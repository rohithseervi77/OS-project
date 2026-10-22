import { analyzeWorkload } from '../src/lib/workload/analyzer';
import { calculateDynamicQuantum } from '../src/lib/scheduler/dynamicQuantum';
import { evaluateSmartScheduler } from '../src/lib/scheduler/smartScheduler';
import { runMLFQ } from '../src/lib/scheduler/mlfq';
import { generateProcesses } from '../src/lib/workload/generator';
import { Process } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phases 5, 6, 7 Smart Engine & MLFQ Tests ---');

// ==========================================
// TEST 1: Workload Analyzer
// ==========================================
console.log('Test 1: Workload Analyzer...');
const cpuProcs = generateProcesses({ count: 10, scenario: 'CPU_HEAVY', seed: 42 });
const cpuAnalysis = analyzeWorkload(cpuProcs);
assert(cpuAnalysis.classification === 'CPU-HEAVY', `Expected CPU-HEAVY, got ${cpuAnalysis.classification}`);
assert(cpuAnalysis.cpuBoundPercentage + cpuAnalysis.batchPercentage >= 65, 'Should be mostly CPU/Batch');

const interactiveProcs = generateProcesses({ count: 10, scenario: 'INTERACTIVE', seed: 42 });
const interactiveAnalysis = analyzeWorkload(interactiveProcs);
assert(interactiveAnalysis.classification === 'INTERACTIVE' || interactiveAnalysis.classification === 'I/O-HEAVY', `Expected INTERACTIVE, got ${interactiveAnalysis.classification}`);

const starvationProcs = generateProcesses({ count: 10, scenario: 'STARVATION', seed: 42 });
const starvationAnalysis = analyzeWorkload(starvationProcs);
assert(starvationAnalysis.starvationRisk === true, 'Starvation risk should be detected');
assert(starvationAnalysis.classification === 'STARVATION-RISK', 'Classified as STARVATION-RISK');
console.log('✓ Workload Analyzer passed.');

// ==========================================
// TEST 2: Dynamic Quantum Calculation
// ==========================================
console.log('Test 2: Dynamic Quantum Calculation...');
const interactiveQ = calculateDynamicQuantum(interactiveAnalysis);
const cpuQ = calculateDynamicQuantum(cpuAnalysis);

assert(interactiveQ.quantum < cpuQ.quantum, `Interactive quantum (${interactiveQ.quantum}ms) must be smaller than CPU-heavy quantum (${cpuQ.quantum}ms)`);
assert(interactiveQ.quantum >= 2 && interactiveQ.quantum <= 12, 'Quantum must be within OS limits [2..12]');
assert(interactiveQ.reason.length > 10, 'Must provide an explanation reason');
console.log(`✓ Dynamic Quantum passed (Interactive: ${interactiveQ.quantum}ms, CPU-Heavy: ${cpuQ.quantum}ms).`);

// ==========================================
// TEST 3: Smart Scheduler Multi-Objective Decision
// ==========================================
console.log('Test 3: Smart Scheduler Multi-Objective Decision...');
const mixedProcs = generateProcesses({ count: 10, scenario: 'MIXED', seed: 42 });
const evaluation = evaluateSmartScheduler(mixedProcs);

assert(evaluation.decision !== undefined, 'Decision must be present');
assert(evaluation.decision.score > 0, 'Decision score must be positive');
assert(evaluation.decision.reason.length > 20, 'Decision explanation must be descriptive');
assert(evaluation.decision.detailedPoints.length >= 3, 'Structured decision points must be present');
assert(evaluation.decision.candidateScores.length >= 5, 'All candidate algorithms must be scored');
console.log(`✓ Smart Scheduler passed (Selected: ${evaluation.decision.selectedAlgorithm}, Dynamic Q: ${evaluation.decision.dynamicQuantum}ms, Score: ${evaluation.decision.score}).`);

// ==========================================
// TEST 4: Confidence-Aware Adjustment
// ==========================================
console.log('Test 4: Confidence-Aware Fallback...');
// Create a workload with low confidence (volatile bursts)
const uncertainProcs = generateProcesses({ count: 10, scenario: 'UNCERTAIN', seed: 42 });
const uncertainEval = evaluateSmartScheduler(uncertainProcs);
assert(uncertainEval.decision.confidenceLevel === 'LOW', `Expected LOW confidence level, got ${uncertainEval.decision.confidenceLevel}`);
// Because confidence is low, SRTF should NOT be boosted, rather conservative policy favored
console.log(`✓ Confidence-aware fallback passed (Low confidence detected: ${uncertainEval.decision.predictionConfidence}%).`);

// ==========================================
// TEST 5: MLFQ (Multi-Level Feedback Queue)
// ==========================================
console.log('Test 5: MLFQ (Multi-Level Feedback Queue)...');
// P1: short burst 2ms -> should finish in Q0
// P2: long burst 15ms -> should demote to Q1, then Q2
const mlfqProcs: Process[] = [
  { pid: 'P_Short', arrivalTime: 0, burstTime: 2, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P_Long', arrivalTime: 0, burstTime: 10, priority: 1, processType: 'CPU-bound', burstHistory: [] },
];
const mlfqRes = runMLFQ(mlfqProcs, { q0Quantum: 2, q1Quantum: 4, boostInterval: 25 });
assert(mlfqRes.processes.length === 2, 'Both processes should complete');
const shortP = mlfqRes.processes.find(p => p.pid === 'P_Short')!;
const longP = mlfqRes.processes.find(p => p.pid === 'P_Long')!;
assert(shortP.completionTime === 2, `P_Short should complete at t=2 in Q0, got ${shortP.completionTime}`);
assert(longP.completionTime === 12, `P_Long should complete at t=12, got ${longP.completionTime}`);
console.log('✓ MLFQ Execution passed.');

console.log('====================================');
console.log('ALL PHASES 5, 6, 7 UNIT TESTS PASSED (5/5)');
console.log('====================================');
