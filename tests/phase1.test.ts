import { generateProcesses, createManualProcess } from '../src/lib/workload/generator';
import { createPCB, transitionState, checkAndApplyAging } from '../src/lib/pcb';
import { 
  predictNextBurst, 
  calculatePredictionError, 
  calculatePredictionConfidence, 
  getConfidenceLevel 
} from '../src/lib/prediction/exponentialAverage';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 1 Unit Tests ---');

// Test 1: Process Generator Count & Properties
console.log('Test 1: Process Generator Batch Sizes...');
for (const count of [5, 10, 20, 50]) {
  const procs = generateProcesses({ count, seed: 123 });
  assert(procs.length === count, `Expected ${count} processes, got ${procs.length}`);
  assert(procs[0].pid === 'P1', 'First process should be P1');
  assert(procs[0].arrivalTime >= 0, 'Arrival time must be non-negative');
  assert(procs[0].burstTime > 0, 'Burst time must be positive');
  assert(procs[0].burstHistory.length > 0, 'Burst history should not be empty');
  assert(procs[0].predictedBurst !== undefined, 'Prediction should be populated');
}
console.log('✓ Batch size tests passed.');

// Test 2: Deterministic Seed Reproducibility
console.log('Test 2: Seed Reproducibility...');
const runA = generateProcesses({ count: 10, seed: 999 });
const runB = generateProcesses({ count: 10, seed: 999 });
const runC = generateProcesses({ count: 10, seed: 1000 });

assert(JSON.stringify(runA) === JSON.stringify(runB), 'Same seed must generate identical workloads');
assert(JSON.stringify(runA) !== JSON.stringify(runC), 'Different seeds must produce different workloads');
console.log('✓ Deterministic seed reproducibility passed.');

// Test 3: Scenario-specific characteristics
console.log('Test 3: Scenario Generator Characteristics...');
const cpuWorkload = generateProcesses({ count: 10, scenario: 'CPU_HEAVY', seed: 42 });
const interactiveWorkload = generateProcesses({ count: 10, scenario: 'INTERACTIVE', seed: 42 });

const avgCpuBurst = cpuWorkload.reduce((sum, p) => sum + p.burstTime, 0) / 10;
const avgInteractiveBurst = interactiveWorkload.reduce((sum, p) => sum + p.burstTime, 0) / 10;
assert(avgCpuBurst > avgInteractiveBurst, `CPU-heavy avg burst (${avgCpuBurst}) must be greater than interactive (${avgInteractiveBurst})`);
console.log(`✓ Scenario tests passed (CPU avg: ${avgCpuBurst.toFixed(1)}ms > Interactive avg: ${avgInteractiveBurst.toFixed(1)}ms).`);

// Test 4: Manual Process Creation
console.log('Test 4: Manual Process Creation...');
const manual = createManualProcess('P99', 5, 12, 2, 'CPU-bound', '10, 11, 12');
assert(manual.pid === 'P99', 'PID must be P99');
assert(manual.arrivalTime === 5, 'Arrival time must be 5');
assert(manual.burstTime === 12, 'Burst time must be 12');
assert(manual.burstHistory.length === 3, 'Burst history should have 3 items');
assert(manual.predictedBurst !== undefined && manual.predictedBurst > 0, 'Prediction must be calculated');
console.log('✓ Manual process creation passed.');

// Test 5: PCB Lifecycle & State Transitions
console.log('Test 5: PCB Lifecycle & State Machine...');
const pcb = createPCB(manual);
assert(pcb.state === 'NEW', 'Initial PCB state must be NEW');
assert(pcb.remainingBurst === 12, 'Initial remaining burst must match burst time');
assert(pcb.cpuTimeUsed === 0, 'Initial CPU time used must be 0');
assert(pcb.firstResponseTime === null, 'First response time must be null initially');

// Valid transition NEW -> READY
assert(transitionState(pcb, 'READY', 5) === true, 'Transition NEW -> READY should succeed');
assert(pcb.state === 'READY', 'State should now be READY');

// Valid transition READY -> RUNNING
assert(transitionState(pcb, 'RUNNING', 8) === true, 'Transition READY -> RUNNING should succeed');
assert(pcb.state === 'RUNNING', 'State should now be RUNNING');
assert(pcb.responseTime === 3, `Response time should be 8 - 5 = 3, got ${pcb.responseTime}`);

// Invalid transition RUNNING -> NEW
assert(transitionState(pcb, 'NEW', 10) === false, 'Transition RUNNING -> NEW should fail');

// Valid transition RUNNING -> TERMINATED
assert(transitionState(pcb, 'TERMINATED', 20) === true, 'Transition RUNNING -> TERMINATED should succeed');
assert(pcb.state === 'TERMINATED', 'State should now be TERMINATED');
console.log('✓ PCB state machine tests passed.');

// Test 6: Aging Mechanism
console.log('Test 6: Aging Mechanism...');
const agingPcb = createPCB(createManualProcess('PStarve', 0, 20, 5, 'Batch'));
assert(agingPcb.effectivePriority === 5, 'Initial priority is 5');

// Wait 8ms with threshold 10 -> No aging
assert(checkAndApplyAging(agingPcb, 8, 10) === false, 'Should not age before threshold');
assert(agingPcb.effectivePriority === 5, 'Priority should remain 5');

// Wait 12ms with threshold 10 -> Ages by 1
assert(checkAndApplyAging(agingPcb, 12, 10) === true, 'Should age when threshold reached');
assert(agingPcb.effectivePriority === 4, `Priority should be reduced to 4, got ${agingPcb.effectivePriority}`);
assert(agingPcb.agingCount === 1, 'Aging count should be 1');

// Wait 22ms -> Ages again
assert(checkAndApplyAging(agingPcb, 22, 10) === true, 'Should age again at 2x threshold');
assert(agingPcb.effectivePriority === 3, `Priority should be reduced to 3, got ${agingPcb.effectivePriority}`);
console.log('✓ Aging mechanism tests passed.');

// Test 7: Burst Predictor Math (Exponential Averaging)
console.log('Test 7: Exponential Averaging & Prediction Metrics...');
// Example: history = [10, 10, 10], alpha = 0.5, initialTau = 10 -> tau should remain 10
const steadyTau = predictNextBurst([10, 10, 10], 0.5, 10);
assert(steadyTau === 10, `Expected steady prediction 10, got ${steadyTau}`);

// Example: actual = 10, predicted = 8 -> error = |10 - 8| / 10 * 100 = 20%
const err = calculatePredictionError(10, 8);
assert(err === 20, `Expected error 20%, got ${err}%`);

const conf = calculatePredictionConfidence(err);
assert(conf === 80, `Expected confidence 80%, got ${conf}%`);
assert(getConfidenceLevel(conf) === 'HIGH', 'Confidence 80 should be classified as HIGH');

const lowConfLevel = getConfidenceLevel(45);
assert(lowConfLevel === 'LOW', 'Confidence 45 should be classified as LOW');
console.log('✓ Prediction mathematics tests passed.');

console.log('====================================');
console.log('ALL PHASE 1 UNIT TESTS PASSED (7/7)');
console.log('====================================');
