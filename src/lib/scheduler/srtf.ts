import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export function runSRTF(inputProcesses: Process[], usePrediction: boolean = false): SchedulingResult {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'SRTF',
      gantt: [],
      processes: [],
      metrics: calculateMetrics([], [], 0, 0),
      executionLog: ['No processes provided.'],
      totalTime: 0,
    };
  }

  const pcbs: PCB[] = inputProcesses.map(createPCB);
  const rawGantt: { pid: string; time: number; reason: string }[] = [];
  const executionLog: string[] = [];

  const uncompleted = [...pcbs];
  let currentTime = 0;
  let contextSwitches = 0;
  let currentRunning: PCB | null = null;

  executionLog.push(
    `[t=0] SRTF (Preemptive SJF) initialized ${usePrediction ? 'using predicted bursts' : 'using actual bursts'}.`
  );

  // Discrete time simulation loop
  while (uncompleted.length > 0) {
    // Transition newly arrived processes to READY
    for (const p of uncompleted) {
      if (p.arrivalTime <= currentTime && p.state === 'NEW') {
        transitionState(p, 'READY', currentTime);
      }
    }

    const ready = uncompleted.filter(p => p.arrivalTime <= currentTime);

    if (ready.length === 0) {
      if (currentRunning) {
        transitionState(currentRunning, 'READY', currentTime);
        currentRunning = null;
      }
      const nextArrival = Math.min(...uncompleted.map(p => p.arrivalTime));
      const idleDuration = nextArrival - currentTime;
      for (let i = 0; i < idleDuration; i++) {
        rawGantt.push({ pid: 'IDLE', time: currentTime + i, reason: 'CPU Idle' });
      }
      currentTime = nextArrival;
      continue;
    }

    // Sort ready processes by remaining burst (or predicted remaining burst)
    ready.sort((a, b) => {
      const remA = usePrediction 
        ? Math.max(0.1, a.prediction - a.cpuTimeUsed) 
        : a.remainingBurst;
      const remB = usePrediction 
        ? Math.max(0.1, b.prediction - b.cpuTimeUsed) 
        : b.remainingBurst;

      if (remA !== remB) return remA - remB;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.pid.localeCompare(b.pid);
    });

    const bestProcess = ready[0];

    // Check preemption or new dispatch
    if (currentRunning !== bestProcess) {
      if (currentRunning !== null) {
        transitionState(currentRunning, 'READY', currentTime);
        contextSwitches++;
        executionLog.push(
          `[t=${currentTime}] Preemption: ${bestProcess.pid} preempted ${currentRunning.pid} (Rem: ${bestProcess.remainingBurst}ms < ${currentRunning.remainingBurst}ms)`
        );
      }
      transitionState(bestProcess, 'RUNNING', currentTime);
      currentRunning = bestProcess;
    }

    // Determine how long currentRunning can run without interruption:
    // It runs until it completes, or until a future process arrives that might preempt it
    const futureArrivals = uncompleted.filter(p => p.arrivalTime > currentTime);
    let step = currentRunning.remainingBurst;

    for (const future of futureArrivals) {
      const delta = future.arrivalTime - currentTime;
      if (delta < step) {
        // At future.arrivalTime, the future process might have shorter burst than current remaining
        const currentRemAtFuture = currentRunning.remainingBurst - delta;
        const futureMetric = usePrediction ? future.prediction : future.burstTime;
        if (futureMetric < currentRemAtFuture) {
          step = delta;
          break;
        }
      }
    }

    step = Math.max(1, Math.min(step, currentRunning.remainingBurst));

    // Record time slice
    for (let s = 0; s < step; s++) {
      rawGantt.push({
        pid: currentRunning.pid,
        time: currentTime + s,
        reason: `Remaining: ${currentRunning.remainingBurst - s}ms`,
      });
    }

    currentRunning.remainingBurst -= step;
    currentRunning.cpuTimeUsed += step;
    currentTime += step;

    // Check if process finished
    if (currentRunning.remainingBurst <= 0) {
      currentRunning.completionTime = currentTime;
      currentRunning.turnaroundTime = currentRunning.completionTime - currentRunning.arrivalTime;
      currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime;
      transitionState(currentRunning, 'TERMINATED', currentTime);

      executionLog.push(
        `[t=${currentTime}] ${currentRunning.pid} COMPLETED. Waiting: ${currentRunning.waitingTime}ms, TAT: ${currentRunning.turnaroundTime}ms`
      );

      const idx = uncompleted.findIndex(p => p.pid === currentRunning!.pid);
      uncompleted.splice(idx, 1);
      currentRunning = null;
    }
  }

  // Compress raw time slices into clean Gantt segments
  const gantt: GanttSegment[] = [];
  if (rawGantt.length > 0) {
    let segPid = rawGantt[0].pid;
    let segStart = 0;
    let segReason = rawGantt[0].reason;

    for (let i = 1; i < rawGantt.length; i++) {
      if (rawGantt[i].pid !== segPid) {
        gantt.push({
          pid: segPid,
          startTime: segStart,
          endTime: i,
          duration: i - segStart,
          reason: segReason,
        });
        segPid = rawGantt[i].pid;
        segStart = i;
        segReason = rawGantt[i].reason;
      }
    }
    gantt.push({
      pid: segPid,
      startTime: segStart,
      endTime: rawGantt.length,
      duration: rawGantt.length - segStart,
      reason: segReason,
    });
  }

  const metrics = calculateMetrics(pcbs, gantt, currentTime, contextSwitches);

  return {
    algorithm: 'SRTF',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
