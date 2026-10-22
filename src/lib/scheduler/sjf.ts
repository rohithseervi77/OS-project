import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export function runSJF(inputProcesses: Process[], usePrediction: boolean = false): SchedulingResult {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'SJF',
      gantt: [],
      processes: [],
      metrics: calculateMetrics([], [], 0, 0),
      executionLog: ['No processes provided.'],
      totalTime: 0,
    };
  }

  const pcbs: PCB[] = inputProcesses.map(createPCB);
  const remaining = [...pcbs];
  const gantt: GanttSegment[] = [];
  const executionLog: string[] = [];

  let currentTime = 0;
  let contextSwitches = 0;
  let lastPid = '';

  executionLog.push(
    `[t=0] SJF (Non-preemptive) initialized with ${pcbs.length} processes ${usePrediction ? '(Using Predicted Bursts)' : '(Using Actual Bursts)'}.`
  );

  while (remaining.length > 0) {
    // Filter processes that have arrived by currentTime
    const available = remaining.filter(p => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      // CPU Idle: advance time to the earliest arrival among remaining processes
      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      gantt.push({
        pid: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        reason: 'No processes ready in ready queue',
      });
      executionLog.push(`[t=${currentTime}] CPU IDLE until next arrival at t=${nextArrival}`);
      currentTime = nextArrival;
      continue;
    }

    // Select process with shortest burst (or predicted burst)
    available.sort((a, b) => {
      const metricA = usePrediction ? a.prediction : a.burstTime;
      const metricB = usePrediction ? b.prediction : b.burstTime;
      if (metricA !== metricB) return metricA - metricB;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.pid.localeCompare(b.pid);
    });

    const current = available[0];
    const index = remaining.findIndex(p => p.pid === current.pid);
    remaining.splice(index, 1);

    if (lastPid && lastPid !== 'IDLE' && lastPid !== current.pid) {
      contextSwitches++;
    }
    lastPid = current.pid;

    const startTime = currentTime;
    transitionState(current, 'READY', startTime);
    transitionState(current, 'RUNNING', startTime);

    const endTime = startTime + current.burstTime;
    current.remainingBurst = 0;
    current.cpuTimeUsed = current.burstTime;
    current.completionTime = endTime;
    current.turnaroundTime = current.completionTime - current.arrivalTime;
    current.waitingTime = current.turnaroundTime - current.burstTime;
    transitionState(current, 'TERMINATED', endTime);

    const burstMetric = usePrediction ? `Predicted τ=${current.prediction}ms (Actual=${current.burstTime}ms)` : `Burst=${current.burstTime}ms`;
    gantt.push({
      pid: current.pid,
      startTime,
      endTime,
      duration: current.burstTime,
      reason: `Shortest job selected: ${burstMetric}`,
    });

    executionLog.push(
      `[t=${startTime}-${endTime}] Process ${current.pid} executed to completion (${burstMetric}). Waiting: ${current.waitingTime}ms, TAT: ${current.turnaroundTime}ms`
    );

    currentTime = endTime;
  }

  const metrics = calculateMetrics(pcbs, gantt, currentTime, contextSwitches);

  return {
    algorithm: 'SJF',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
