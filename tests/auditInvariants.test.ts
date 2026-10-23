import { generateProcesses } from '../src/lib/workload/generator';
import { runFCFS } from '../src/lib/scheduler/fcfs';
import { runSJF } from '../src/lib/scheduler/sjf';
import { runSRTF } from '../src/lib/scheduler/srtf';
import { runRoundRobin } from '../src/lib/scheduler/roundRobin';
import { runPriority } from '../src/lib/scheduler/priority';
import { runMLFQ } from '../src/lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '../src/lib/scheduler/smartScheduler';
import { calculateJainsFairness } from '../src/lib/analytics/metrics';
import { analyzeBurstHistory } from '../src/lib/prediction/history';
import { ExponentialAveragePredictor } from '../src/lib/prediction/predictor';
import { DiscreteEventSimulationEngine } from '../src/lib/simulation/engine';

console.log('\n========================================================');
console.log('  RUNNING KERNEL//LAB AUDIT INVARIANTS & INTEGRITY SUITE  ');
console.log('========================================================\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAILED: ${msg}`);
    throw new Error(msg);
  }
}

// 1. Invariant: TAT = CT - AT and WT = TAT - BT >= 0 for all algorithms
console.log('Test 1: Fundamental OS Accounting Invariants (TAT = CT - AT, WT = TAT - BT >= 0)...');
const testProcs = generateProcesses({ count: 12, seed: 101, scenario: 'MIXED' });
const algorithms = [
  { name: 'FCFS', runner: () => runFCFS(testProcs) },
  { name: 'SJF', runner: () => runSJF(testProcs, false) },
  { name: 'SRTF', runner: () => runSRTF(testProcs, false) },
  { name: 'RR', runner: () => runRoundRobin(testProcs, 4) },
  { name: 'PRIORITY', runner: () => runPriority(testProcs, { preemptive: true, agingThreshold: 10 }) },
  { name: 'MLFQ', runner: () => runMLFQ(testProcs, { q0Quantum: 2, q1Quantum: 4, boostInterval: 25 }) },
];

for (const { name, runner } of algorithms) {
  const result = runner();
  assert(result.processes.length === testProcs.length, `${name}: All processes must complete`);
  for (const p of result.processes) {
    const expectedTAT = p.completionTime - p.arrivalTime;
    assert(p.turnaroundTime === expectedTAT, `${name}: TAT mismatch for ${p.pid}. Expected ${expectedTAT}, got ${p.turnaroundTime}`);
    const expectedWT = p.turnaroundTime - p.burstTime;
    assert(p.waitingTime === expectedWT, `${name}: WT mismatch for ${p.pid}. Expected ${expectedWT}, got ${p.waitingTime}`);
    assert(p.waitingTime >= 0, `${name}: WT must be >= 0 for ${p.pid}. Got ${p.waitingTime}`);
    assert(p.responseTime >= 0, `${name}: Response Time must be >= 0 for ${p.pid}. Got ${p.responseTime}`);
  }
}
console.log('✓ All 6 algorithms satisfy strict OS accounting invariants.');

// 2. Invariant: Jain's Fairness Index is bounded strictly in [1/n, 1.0]
console.log('\nTest 2: Jain\'s Fairness Mathematical Bounds...');
const n = 5;
const basePCB = (pid: string, bt: number, tat: number) => ({
  pid,
  arrivalTime: 0,
  burstTime: bt,
  remainingBurst: 0,
  priority: 1,
  effectivePriority: 1,
  processType: 'CPU-bound' as const,
  state: 'TERMINATED' as const,
  cpuTimeUsed: bt,
  waitingTime: tat - bt,
  turnaroundTime: tat,
  responseTime: 0,
  firstResponseTime: 0,
  prediction: bt,
  predictionConfidence: 100,
  lastScheduledTime: 0,
  completionTime: tat,
  burstHistory: [],
  agingCount: 0,
});

const perfectlyFair = [basePCB('P1', 10, 10), basePCB('P2', 10, 10), basePCB('P3', 10, 10), basePCB('P4', 10, 10), basePCB('P5', 10, 10)];
const maximallyUnfair = [basePCB('P1', 10, 10), basePCB('P2', 1, 1000), basePCB('P3', 1, 1000), basePCB('P4', 1, 1000), basePCB('P5', 1, 1000)];
const fairScore = calculateJainsFairness(perfectlyFair);
const unfairScore = calculateJainsFairness(maximallyUnfair);
assert(fairScore === 1.0, `Perfect fairness must be exactly 1.0, got ${fairScore}`);
assert(unfairScore >= 1 / n - 0.01 && unfairScore <= 1.0, `Unfair score must be >= 1/n (${1/n}), got ${unfairScore}`);
console.log(`✓ Jain Fairness bounds verified (Fair: ${fairScore}, Min Bound: ${unfairScore} >= ${1/n}).`);

// 3. Invariant: Exponential Averaging smoothing and zero division safety
console.log('\nTest 3: Prediction Recursion & Zero Division Safety...');
const predictor = new ExponentialAveragePredictor(0.5);
assert(predictor.calculateError(0, 10) === 0, 'Zero burst must not cause division by zero');
assert(predictor.calculateError(10, 10) === 0, 'Exact prediction must have 0% error');
assert(predictor.calculateError(10, 12) === 20, '|10 - 12| / 10 * 100 must equal 20% error');

const burstAnalysis = analyzeBurstHistory([10, 20, 30], 0.5);
assert(burstAnalysis.steps.length === 3, 'Must analyze all 3 steps');
assert(burstAnalysis.nextPrediction > 0, 'Next prediction must be positive');
console.log(`✓ Exponential smoothing and zero division safety verified.`);

// 4. Invariant: SRTF Arrival Sorting & Preemption Integrity
console.log('\nTest 4: SRTF Unordered Arrival Invariant...');
const unorderedArrivals = [
  { pid: 'P1', arrivalTime: 10, burstTime: 8, priority: 3, processType: 'CPU-bound' as const, burstHistory: [8] },
  { pid: 'P2', arrivalTime: 2, burstTime: 3, priority: 1, processType: 'Interactive' as const, burstHistory: [3] },
  { pid: 'P3', arrivalTime: 0, burstTime: 10, priority: 2, processType: 'Batch' as const, burstHistory: [10] },
];
const srtfRes = runSRTF(unorderedArrivals, false);
assert(srtfRes.processes.length === 3, 'All processes must complete');
// At t=0, P3 starts. At t=2, P2 arrives with burst 3 < P3 remaining (8), preempting P3!
const p2 = srtfRes.processes.find(p => p.pid === 'P2')!;
assert(p2.completionTime === 5, `P2 must preempt and finish at t=5. Got ${p2.completionTime}`);
console.log(`✓ SRTF handles out-of-order arrivals with correct preemption.`);

// 5. Invariant: DiscreteEventSimulationEngine native MLFQ Stepping
console.log('\nTest 5: DiscreteEventSimulationEngine with MLFQ Multi-Queue Stepping...');
const mlfqEngine = new DiscreteEventSimulationEngine(testProcs, {
  algorithm: 'MLFQ',
  quantum: 4,
  mlfqBoostInterval: 25,
});

let steps = 0;
while (!mlfqEngine.getState().isFinished && steps < 1000) {
  mlfqEngine.step();
  steps++;
}
const mlfqState = mlfqEngine.getState();
assert(mlfqState.isFinished, 'MLFQ discrete simulation must complete');
assert(mlfqState.completedProcesses.length === testProcs.length, 'All processes must be completed');
assert(mlfqState.gantt.length > 0, 'Gantt segments must be produced');
console.log(`✓ DiscreteEventSimulationEngine natively executes MLFQ in ${steps} steps.`);

// 6. Invariant: SMART Scheduler evaluates pure objective utility without artificial 1.05 multiplier
console.log('\nTest 6: Smart Scheduler Pure Utility Scoring Invariant...');
const smartEval = evaluateSmartScheduler(testProcs);
assert(smartEval.decision.score <= 1.0, `Score must be <= 1.0, got ${smartEval.decision.score}`);
assert(smartEval.decision.candidateScores.length === 6, 'Must score all 6 candidates');
for (const cand of smartEval.decision.candidateScores) {
  assert(cand.score >= 0 && cand.score <= 1.0, `Candidate ${cand.algorithm} score must be in [0, 1], got ${cand.score}`);
}
console.log(`✓ Smart Scheduler computes pure objective scores (${smartEval.decision.selectedAlgorithm} scored ${smartEval.decision.score}).`);

console.log('\n========================================================');
console.log('  ALL KERNEL//LAB AUDIT INVARIANTS SUCCESSFULLY VERIFIED!  ');
console.log('========================================================\n');
