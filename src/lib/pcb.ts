import { PCB, Process, ProcessState } from './types';

/**
 * Creates a PCB initialized for simulation
 */
export function createPCB(process: Process): PCB {
  return {
    pid: process.pid,
    arrivalTime: process.arrivalTime,
    burstTime: process.burstTime,
    remainingBurst: process.burstTime,
    priority: process.priority,
    effectivePriority: process.priority,
    processType: process.processType,
    state: 'NEW',
    cpuTimeUsed: 0,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: -1,
    firstResponseTime: null,
    prediction: process.predictedBurst ?? process.burstTime,
    predictionConfidence: process.confidence ?? 100,
    lastScheduledTime: process.arrivalTime,
    completionTime: 0,
    burstHistory: [...(process.burstHistory || [process.burstTime])],
    agingCount: 0,
  };
}

/**
 * Valid transitions in OS process state machine:
 * NEW -> READY
 * READY -> RUNNING
 * RUNNING -> READY (Preemption / Quantum expiry)
 * RUNNING -> WAITING (I/O event)
 * WAITING -> READY (I/O completion)
 * RUNNING -> TERMINATED (Process completion)
 */
export const VALID_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  NEW: ['READY'],
  READY: ['RUNNING'],
  RUNNING: ['READY', 'WAITING', 'TERMINATED'],
  WAITING: ['READY'],
  TERMINATED: [],
};

export function transitionState(pcb: PCB, targetState: ProcessState, currentTime: number): boolean {
  if (pcb.state === targetState) return true;
  const allowed = VALID_TRANSITIONS[pcb.state];
  if (!allowed.includes(targetState)) {
    console.warn(`Illegal state transition for ${pcb.pid}: ${pcb.state} -> ${targetState}`);
    return false;
  }

  // Update timestamps and response time
  if (targetState === 'RUNNING' && pcb.firstResponseTime === null) {
    pcb.firstResponseTime = currentTime;
    pcb.responseTime = Math.max(0, currentTime - pcb.arrivalTime);
  }

  pcb.state = targetState;
  return true;
}

/**
 * Aging Mechanism:
 * Increases priority (lower numeric value represents higher priority in standard UNIX/POSIX)
 * when waiting time exceeds threshold.
 */
export function checkAndApplyAging(pcb: PCB, currentWait: number, threshold: number = 10): boolean {
  if (pcb.state === 'TERMINATED' || threshold <= 0) return false;
  if (currentWait >= threshold * (pcb.agingCount + 1)) {
    if (pcb.effectivePriority > 1) {
      pcb.effectivePriority -= 1;
      pcb.agingCount += 1;
      return true;
    }
  }
  return false;
}
