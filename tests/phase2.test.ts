import { runFCFS } from '../src/lib/scheduler/fcfs';
import { runSJF } from '../src/lib/scheduler/sjf';
import { runSRTF } from '../src/lib/scheduler/srtf';
import { runRoundRobin } from '../src/lib/scheduler/roundRobin';
import { runPriority } from '../src/lib/scheduler/priority';
import { Process } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 2 Classical Scheduling Tests ---');

// ==========================================
// TEST 1: FCFS (Classic Textbook Scenario)
// ==========================================
console.log('Test 1: FCFS Scheduling Verification...');
const fcfsProcs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 24, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P3', arrivalTime: 0, burstTime: 3, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const fcfsRes = runFCFS(fcfsProcs);
const p1 = fcfsRes.processes.find(p => p.pid === 'P1')!;
const p2 = fcfsRes.processes.find(p => p.pid === 'P2')!;
const p3 = fcfsRes.processes.find(p => p.pid === 'P3')!;

assert(p1.waitingTime === 0, `P1 waiting time should be 0, got ${p1.waitingTime}`);
assert(p1.turnaroundTime === 24, `P1 TAT should be 24, got ${p1.turnaroundTime}`);
assert(p2.waitingTime === 24, `P2 waiting time should be 24, got ${p2.waitingTime}`);
assert(p2.turnaroundTime === 27, `P2 TAT should be 27, got ${p2.turnaroundTime}`);
assert(p3.waitingTime === 27, `P3 waiting time should be 27, got ${p3.waitingTime}`);
assert(p3.turnaroundTime === 30, `P3 TAT should be 30, got ${p3.turnaroundTime}`);

const avgWaitFCFS = (0 + 24 + 27) / 3; // 17ms
assert(fcfsRes.metrics.avgWaitingTime === Number(avgWaitFCFS.toFixed(2)), `Avg wait should be 17ms, got ${fcfsRes.metrics.avgWaitingTime}`);
console.log(`✓ FCFS passed (Avg Wait: ${fcfsRes.metrics.avgWaitingTime}ms, CPU Util: ${fcfsRes.metrics.cpuUtilization}%).`);

// ==========================================
// TEST 2: SJF Non-Preemptive
// ==========================================
console.log('Test 2: SJF Non-Preemptive Verification...');
const sjfProcs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 7, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P3', arrivalTime: 4, burstTime: 1, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P4', arrivalTime: 5, burstTime: 4, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const sjfRes = runSJF(sjfProcs);
// P1 runs 0-7. At t=7: P3(burst 1), P2(burst 4), P4(burst 4) are ready.
// P3 must run next (7-8). Then P2 (8-12), then P4 (12-16).
assert(sjfRes.gantt[0].pid === 'P1', 'First process must be P1');
assert(sjfRes.gantt[1].pid === 'P3', `Second process must be P3 (burst 1), got ${sjfRes.gantt[1].pid}`);
assert(sjfRes.gantt[2].pid === 'P2', `Third process must be P2, got ${sjfRes.gantt[2].pid}`);
assert(sjfRes.gantt[3].pid === 'P4', `Fourth process must be P4, got ${sjfRes.gantt[3].pid}`);

const sjfP3 = sjfRes.processes.find(p => p.pid === 'P3')!;
assert(sjfP3.waitingTime === 3, `P3 wait should be 7 - 4 = 3, got ${sjfP3.waitingTime}`);
console.log('✓ SJF Non-preemptive passed.');

// ==========================================
// TEST 3: SRTF (Preemptive SJF)
// ==========================================
console.log('Test 3: SRTF (Preemptive SJF) Verification...');
const srtfProcs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const srtfRes = runSRTF(srtfProcs);
// At t=0: P1 starts (burst 8)
// At t=1: P1 has remaining 7. P2 arrives with burst 4 < 7 -> PREEMPTS P1!
// P2 runs 1 to 5, completes at 5.
// At t=5: P4(5), P1(7), P3(9) -> P4 runs 5 to 10.
// At t=10: P1 runs 10 to 17.
// At t=17: P3 runs 17 to 26.
assert(srtfRes.gantt[0].pid === 'P1' && srtfRes.gantt[0].endTime === 1, 'P1 runs from 0 to 1');
assert(srtfRes.gantt[1].pid === 'P2' && srtfRes.gantt[1].endTime === 5, 'P2 preempts and runs 1 to 5');
assert(srtfRes.gantt[2].pid === 'P4' && srtfRes.gantt[2].endTime === 10, 'P4 runs 5 to 10');
assert(srtfRes.gantt[3].pid === 'P1' && srtfRes.gantt[3].endTime === 17, 'P1 resumes 10 to 17');
assert(srtfRes.gantt[4].pid === 'P3' && srtfRes.gantt[4].endTime === 26, 'P3 runs 17 to 26');

const srtfP1 = srtfRes.processes.find(p => p.pid === 'P1')!;
const srtfP2 = srtfRes.processes.find(p => p.pid === 'P2')!;
assert(srtfP2.waitingTime === 0, `P2 waiting time should be 0, got ${srtfP2.waitingTime}`);
assert(srtfP1.waitingTime === 9, `P1 waiting time should be 9, got ${srtfP1.waitingTime}`);
console.log('✓ SRTF Preemptive SJF passed.');

// ==========================================
// TEST 4: Round Robin (Quantum = 4)
// ==========================================
console.log('Test 4: Round Robin Verification...');
const rrProcs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 10, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 0, burstTime: 4, priority: 1, processType: 'Interactive', burstHistory: [] },
  { pid: 'P3', arrivalTime: 0, burstTime: 5, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const rrRes = runRoundRobin(rrProcs, 4);
// Order:
// P1: 0-4 (rem 6)
// P2: 4-8 (rem 0 -> completes)
// P3: 8-12 (rem 1)
// P1: 12-16 (rem 2)
// P3: 16-17 (rem 0 -> completes)
// P1: 17-19 (rem 0 -> completes)
assert(rrRes.gantt[0].pid === 'P1' && rrRes.gantt[0].duration === 4, 'Segment 0: P1 for 4ms');
assert(rrRes.gantt[1].pid === 'P2' && rrRes.gantt[1].duration === 4, 'Segment 1: P2 for 4ms');
assert(rrRes.gantt[2].pid === 'P3' && rrRes.gantt[2].duration === 4, 'Segment 2: P3 for 4ms');
assert(rrRes.gantt[3].pid === 'P1' && rrRes.gantt[3].duration === 4, 'Segment 3: P1 for 4ms');
assert(rrRes.gantt[4].pid === 'P3' && rrRes.gantt[4].duration === 1, 'Segment 4: P3 for 1ms');
assert(rrRes.gantt[5].pid === 'P1' && rrRes.gantt[5].duration === 2, 'Segment 5: P1 for 2ms');

const rrP2 = rrRes.processes.find(p => p.pid === 'P2')!;
assert(rrP2.completionTime === 8, `P2 completion should be 8, got ${rrP2.completionTime}`);
assert(rrP2.turnaroundTime === 8, `P2 TAT should be 8, got ${rrP2.turnaroundTime}`);
console.log('✓ Round Robin passed.');

// ==========================================
// TEST 5: Priority with Preemption & Aging
// ==========================================
console.log('Test 5: Priority with Preemption and Aging...');
const prioProcs: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 10, priority: 3, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, processType: 'Interactive', burstHistory: [] },
];

const prioRes = runPriority(prioProcs, { preemptive: true, agingThreshold: 0 });
// P1 runs 0 to 2. At t=2, P2 arrives with priority 1 (higher) -> Preempts P1!
// P2 runs 2 to 6.
// P1 resumes 6 to 14.
assert(prioRes.gantt[0].pid === 'P1' && prioRes.gantt[0].endTime === 2, 'P1 runs 0-2');
assert(prioRes.gantt[1].pid === 'P2' && prioRes.gantt[1].endTime === 6, 'P2 runs 2-6');
assert(prioRes.gantt[2].pid === 'P1' && prioRes.gantt[2].endTime === 14, 'P1 resumes 6-14');

// Test Aging: Low priority task waiting crosses threshold -> priority upgraded!
const agingProcs: Process[] = [
  { pid: 'P_High', arrivalTime: 0, burstTime: 15, priority: 1, processType: 'CPU-bound', burstHistory: [] },
  { pid: 'P_Low', arrivalTime: 0, burstTime: 5, priority: 5, processType: 'Batch', burstHistory: [] },
];
const agingRes = runPriority(agingProcs, { preemptive: true, agingThreshold: 5 });
const agedLow = agingRes.processes.find(p => p.pid === 'P_Low')!;
assert(agedLow.agingCount > 0, 'P_Low should have aged during long wait');
assert(agedLow.effectivePriority < 5, `Effective priority should be < 5, got ${agedLow.effectivePriority}`);
console.log(`✓ Priority with preemption & aging passed (P_Low aged to priority ${agedLow.effectivePriority}).`);

console.log('====================================');
console.log('ALL PHASE 2 UNIT TESTS PASSED (5/5)');
console.log('====================================');
