import { DiscreteEventSimulationEngine } from '../src/lib/simulation/engine';
import { calculateJainsFairness, calculateMetrics } from '../src/lib/analytics/metrics';
import { Process, PCB, GanttSegment } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 3 Simulation Engine & Metrics Tests ---');

// Test 1: Jain's Fairness Index Calculation
console.log('Test 1: Jain Fairness Index Verification...');
// Case A: 3 identical processes -> Perfectly fair = 1.0
const fairPcbs: PCB[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 10, remainingBurst: 0, priority: 1, effectivePriority: 1, processType: 'CPU-bound', state: 'TERMINATED', cpuTimeUsed: 10, waitingTime: 0, turnaroundTime: 10, responseTime: 0, firstResponseTime: 0, prediction: 10, predictionConfidence: 100, lastScheduledTime: 0, completionTime: 10, burstHistory: [], agingCount: 0 },
  { pid: 'P2', arrivalTime: 0, burstTime: 10, remainingBurst: 0, priority: 1, effectivePriority: 1, processType: 'CPU-bound', state: 'TERMINATED', cpuTimeUsed: 10, waitingTime: 0, turnaroundTime: 10, responseTime: 0, firstResponseTime: 0, prediction: 10, predictionConfidence: 100, lastScheduledTime: 0, completionTime: 10, burstHistory: [], agingCount: 0 },
];
const fairnessScore = calculateJainsFairness(fairPcbs);
assert(fairnessScore === 1.0, `Expected fairness 1.0 for identical service, got ${fairnessScore}`);

// Case B: Highly unbalanced service (P1 gets burst 10 with TAT 10, P2 gets burst 10 with TAT 1000)
const unfairPcbs: PCB[] = [
  { ...fairPcbs[0], turnaroundTime: 10 },
  { ...fairPcbs[1], turnaroundTime: 1000 },
];
const unfairScore = calculateJainsFairness(unfairPcbs);
assert(unfairScore < 0.6, `Expected unfair score < 0.6, got ${unfairScore}`);
console.log(`✓ Jain's Fairness Index passed (Fair: ${fairnessScore}, Unfair: ${unfairScore}).`);

// Test 2: Discrete-Event Engine Step-by-Step Execution
console.log('Test 2: Discrete-Event Engine Execution...');
const procs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 2, burstTime: 3, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const engine = new DiscreteEventSimulationEngine(procs, {
  algorithm: 'FCFS',
});

// Step 1: t=0 -> P1 dispatched
let state = engine.step();
assert(state.currentTime === 1, 'Current time should be 1');
assert(state.currentRunning?.pid === 'P1', 'P1 should be running');
assert(state.currentRunning?.remainingBurst === 4, 'P1 remaining burst should be 4');

// Run until complete
while (!state.isFinished) {
  state = engine.step();
}

assert(state.isFinished === true, 'Simulation must finish');
assert(state.completedProcesses.length === 2, 'Both processes should be completed');
assert(state.currentTime === 8, `Total time should be 5 + 3 = 8ms, got ${state.currentTime}`);

const p1 = state.completedProcesses.find(p => p.pid === 'P1')!;
const p2 = state.completedProcesses.find(p => p.pid === 'P2')!;
assert(p1.completionTime === 5, `P1 completion should be 5, got ${p1.completionTime}`);
assert(p2.completionTime === 8, `P2 completion should be 8, got ${p2.completionTime}`);
assert(p2.waitingTime === 3, `P2 waiting should be 5 - 2 = 3, got ${p2.waitingTime}`);
console.log('✓ Discrete-event step-by-step engine passed.');

// Test 3: Gantt Segments Compression
console.log('Test 3: Gantt Segments Structure...');
const segments = engine.getGanttSegments();
assert(segments.length === 2, `Expected 2 Gantt segments, got ${segments.length}`);
assert(segments[0].pid === 'P1' && segments[0].duration === 5, 'Segment 0: P1 for 5ms');
assert(segments[1].pid === 'P2' && segments[1].duration === 3, 'Segment 1: P2 for 3ms');
console.log('✓ Gantt segment compression passed.');

console.log('====================================');
console.log('ALL PHASE 3 UNIT TESTS PASSED (3/3)');
console.log('====================================');
