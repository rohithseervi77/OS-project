import { 
  ExponentialAveragePredictor, 
  LinearRegressionPredictor 
} from '../src/lib/prediction/predictor';
import { analyzeBurstHistory } from '../src/lib/prediction/history';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 4 Burst Predictor & ML Architecture Tests ---');

// Test 1: Exponential Averaging Mathematical Precision
console.log('Test 1: Exponential Averaging Formula...');
const expPredictor = new ExponentialAveragePredictor(0.5);

// Example from prompt Section 9:
// Burst history: 5, 7, 6, 8, 9
// Start with 5:
// step 1: tau0 = 5
// step 2: tau1 = 0.5 * 7 + 0.5 * 5 = 6.0
// step 3: tau2 = 0.5 * 6 + 0.5 * 6.0 = 6.0
// step 4: tau3 = 0.5 * 8 + 0.5 * 6.0 = 7.0
// step 5: tau4 = 0.5 * 9 + 0.5 * 7.0 = 8.0
const pred = expPredictor.predict([5, 7, 6, 8, 9], { alpha: 0.5 });
assert(pred === 8.0, `Expected prediction 8.0, got ${pred}`);

// Error calculation:
// actual = 9, predicted = 8.0 -> error = |9 - 8| / 9 * 100 = 11.111% -> 11.1%
const err = expPredictor.calculateError(9, 8.0);
assert(err === 11.1, `Expected error 11.1%, got ${err}%`);

// Confidence calculation:
// 100 - 11.1 = 88.9%
const conf = expPredictor.calculateConfidence(9, 8.0);
assert(conf === 88.9, `Expected confidence 88.9%, got ${conf}%`);
assert(expPredictor.classifyConfidence(conf) === 'HIGH', 'Confidence 88.9% must be classified as HIGH');
console.log(`✓ Exponential Averaging verified (Prediction: ${pred}ms, Error: ${err}%, Conf: ${conf}%).`);

// Test 2: Alpha Smoothing Sensitivity
console.log('Test 2: Smoothing Parameter Alpha Sensitivity...');
const burstSeq = [10, 10, 30]; // Sudden jump to 30ms
const predHighAlpha = expPredictor.predict(burstSeq, { alpha: 0.8 }); // Heavily responsive to recent
const predLowAlpha = expPredictor.predict(burstSeq, { alpha: 0.2 });  // Conservative, resists sudden change
assert(predHighAlpha > predLowAlpha, `High alpha (${predHighAlpha}) should adapt faster than low alpha (${predLowAlpha})`);
console.log(`✓ Alpha sensitivity verified (α=0.8 -> ${predHighAlpha}ms vs α=0.2 -> ${predLowAlpha}ms).`);

// Test 3: Pluggable ML Architecture - Linear Regression Predictor
console.log('Test 3: Linear Regression ML Model Placeholder...');
const lrPredictor = new LinearRegressionPredictor();
// Steadily rising bursts: 2, 4, 6, 8, 10 (slope = 2) -> Next burst should be 12!
const lrPred = lrPredictor.predict([2, 4, 6, 8, 10]);
assert(Math.abs(lrPred - 12) < 0.1, `Expected linear trend 12, got ${lrPred}`);
console.log(`✓ Linear regression ML predictor passed (Trend prediction: ${lrPred}ms).`);

// Test 4: Comprehensive History Analysis & Volatility Detection
console.log('Test 4: History Analysis & Volatility...');
const stableHistory = [10, 11, 10, 10, 9, 10];
const volatileHistory = [2, 28, 4, 30, 3, 29];

const stableAnalysis = analyzeBurstHistory(stableHistory, 0.5);
const volatileAnalysis = analyzeBurstHistory(volatileHistory, 0.5);

assert(stableAnalysis.isVolatile === false, 'Stable history should not be marked volatile');
assert(volatileAnalysis.isVolatile === true, 'Volatile history should be marked volatile');
assert(stableAnalysis.overallConfidence > volatileAnalysis.overallConfidence, 'Stable confidence must exceed volatile confidence');
console.log(`✓ History analysis passed (Stable Conf: ${stableAnalysis.overallConfidence}% vs Volatile Conf: ${volatileAnalysis.overallConfidence}%).`);

console.log('====================================');
console.log('ALL PHASE 4 UNIT TESTS PASSED (4/4)');
console.log('====================================');
