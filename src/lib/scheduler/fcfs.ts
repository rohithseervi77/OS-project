import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export function runFCFS(inputProcesses: Process[]): SchedulingResult {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'FCFS',
      gantt: [],
      processes: [],
      metrics: calculateMetrics([], [], 0, 0),
      executionLog: ['No processes provided.'],
      totalTime: 0,
    };
  }

  // Clone and create initial PCBs
  const pcbs: PCB[] = inputProcesses.map(createPCB);
  const executionLog: string[] = [];
  const gantt: GanttSegment[] = [];

  // Sort queue by arrival time (FIFO)
  const queue = [...pcbs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.pid.localeCompare(b.pid);
  });

  let currentTime = 0;
  let contextSwitches = 0;

  executionLog.push(`[t=0] FCFS scheduler initialized with ${queue.length} processes.`);

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];

    // CPU Idle gap if process hasn't arrived yet
    if (currentTime < current.arrivalTime) {
      const idleDuration = current.arrivalTime - currentTime;
      gantt.push({
        pid: 'IDLE',
        startTime: currentTime,
        endTime: current.arrivalTime,
        duration: idleDuration,
        reason: 'CPU Idle waiting for process arrival',
      });
      executionLog.push(`[t=${currentTime}] CPU IDLE until t=${current.arrivalTime}`);
      currentTime = current.arrivalTime;
    }

    const startTime = currentTime;
    transitionState(current, 'READY', startTime);
    transitionState(current, 'RUNNING', startTime);

    if (i > 0 && gantt[gantt.length - 1]?.pid !== 'IDLE') {
      contextSwitches++;
    }

    const endTime = startTime + current.burstTime;
    current.remainingBurst = 0;
    current.cpuTimeUsed = current.burstTime;
    current.completionTime = endTime;
    current.turnaroundTime = current.completionTime - current.arrivalTime;
    current.waitingTime = current.turnaroundTime - current.burstTime;
    transitionState(current, 'TERMINATED', endTime);

    gantt.push({
      pid: current.pid,
      startTime,
      endTime,
      duration: current.burstTime,
      reason: `Dispatched strictly in arrival order (Arrival: ${current.arrivalTime}ms, Burst: ${current.burstTime}ms)`,
    });

    executionLog.push(
      `[t=${startTime}-${endTime}] Process ${current.pid} executed to completion. Waiting: ${current.waitingTime}ms, TAT: ${current.turnaroundTime}ms`
    );

    currentTime = endTime;
  }

  const metrics = calculateMetrics(pcbs, gantt, currentTime, contextSwitches);

  return {
    algorithm: 'FCFS',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
