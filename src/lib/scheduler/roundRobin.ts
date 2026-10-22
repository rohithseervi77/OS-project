import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export function runRoundRobin(inputProcesses: Process[], quantum: number = 4): SchedulingResult {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'RR',
      gantt: [],
      processes: [],
      metrics: calculateMetrics([], [], 0, 0),
      executionLog: ['No processes provided.'],
      totalTime: 0,
    };
  }

  const validQuantum = Math.max(1, quantum);
  const pcbs: PCB[] = inputProcesses.map(createPCB);
  const gantt: GanttSegment[] = [];
  const executionLog: string[] = [];

  // Sort initially by arrival time to inspect upcoming arrivals
  const unarrived = [...pcbs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.pid.localeCompare(b.pid);
  });

  const readyQueue: PCB[] = [];
  let currentTime = 0;
  let contextSwitches = 0;
  let lastPid = '';

  executionLog.push(`[t=0] Round Robin initialized with Quantum = ${validQuantum}ms.`);

  // Function to push arrived processes into readyQueue
  const checkArrivals = (time: number) => {
    while (unarrived.length > 0 && unarrived[0].arrivalTime <= time) {
      const p = unarrived.shift()!;
      transitionState(p, 'READY', time);
      readyQueue.push(p);
      executionLog.push(`[t=${time}] ${p.pid} arrived and added to ready queue.`);
    }
  };

  // Initial check at t=0
  checkArrivals(currentTime);

  while (readyQueue.length > 0 || unarrived.length > 0) {
    if (readyQueue.length === 0) {
      // CPU Idle: advance time to next arrival
      const nextArrival = unarrived[0].arrivalTime;
      gantt.push({
        pid: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        reason: 'Ready queue empty',
      });
      executionLog.push(`[t=${currentTime}] CPU IDLE until t=${nextArrival}`);
      currentTime = nextArrival;
      checkArrivals(currentTime);
      lastPid = 'IDLE';
      continue;
    }

    const current = readyQueue.shift()!;

    if (lastPid && lastPid !== 'IDLE' && lastPid !== current.pid) {
      contextSwitches++;
    }
    lastPid = current.pid;

    transitionState(current, 'RUNNING', currentTime);

    // Run for minimum of quantum or remaining burst
    const slice = Math.min(validQuantum, current.remainingBurst);
    const startTime = currentTime;
    const endTime = startTime + slice;

    current.remainingBurst -= slice;
    current.cpuTimeUsed += slice;
    currentTime = endTime;

    gantt.push({
      pid: current.pid,
      startTime,
      endTime,
      duration: slice,
      reason: current.remainingBurst === 0 
        ? `Completed within slice (${slice}ms)` 
        : `Quantum expired (${slice}ms / ${validQuantum}ms)`,
    });

    // Check newly arrived processes during this execution slice BEFORE re-enqueuing current
    checkArrivals(currentTime);

    if (current.remainingBurst > 0) {
      transitionState(current, 'READY', currentTime);
      readyQueue.push(current);
      executionLog.push(
        `[t=${endTime}] ${current.pid} slice finished. Remaining: ${current.remainingBurst}ms. Re-queued.`
      );
    } else {
      current.completionTime = currentTime;
      current.turnaroundTime = current.completionTime - current.arrivalTime;
      current.waitingTime = current.turnaroundTime - current.burstTime;
      transitionState(current, 'TERMINATED', currentTime);

      executionLog.push(
        `[t=${endTime}] ${current.pid} TERMINATED. Waiting: ${current.waitingTime}ms, TAT: ${current.turnaroundTime}ms`
      );
    }
  }

  const metrics = calculateMetrics(pcbs, gantt, currentTime, contextSwitches);

  return {
    algorithm: 'RR',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
