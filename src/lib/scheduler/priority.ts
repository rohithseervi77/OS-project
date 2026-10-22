import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState, checkAndApplyAging } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export interface PrioritySchedulerOptions {
  preemptive?: boolean;
  agingThreshold?: number; // 0 to disable, e.g. 10 ms
}

export function runPriority(
  inputProcesses: Process[],
  options: PrioritySchedulerOptions = {}
): SchedulingResult {
  const { preemptive = true, agingThreshold = 10 } = options;

  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'PRIORITY',
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
    `[t=0] Priority Scheduler initialized (${preemptive ? 'Preemptive' : 'Non-preemptive'}, Aging: ${agingThreshold > 0 ? `${agingThreshold}ms` : 'Disabled'}).`
  );

  while (uncompleted.length > 0) {
    // Transition newly arrived processes to READY
    for (const p of uncompleted) {
      if (p.arrivalTime <= currentTime && p.state === 'NEW') {
        transitionState(p, 'READY', currentTime);
      }
    }

    const ready = uncompleted.filter(p => p.arrivalTime <= currentTime);

    // Apply aging to waiting ready processes (excluding the currently running one)
    if (agingThreshold > 0) {
      for (const p of ready) {
        if (p !== currentRunning) {
          const currentWait = currentTime - p.arrivalTime - p.cpuTimeUsed;
          if (checkAndApplyAging(p, currentWait, agingThreshold)) {
            executionLog.push(
              `[t=${currentTime}] Aging applied to ${p.pid}: Effective Priority upgraded to ${p.effectivePriority} (waited ${currentWait}ms).`
            );
          }
        }
      }
    }

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

    // Sort ready processes by effective priority (lowest numeric number is highest priority)
    ready.sort((a, b) => {
      if (a.effectivePriority !== b.effectivePriority) {
        return a.effectivePriority - b.effectivePriority;
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.pid.localeCompare(b.pid);
    });

    const bestProcess = ready[0];

    if (!preemptive && currentRunning !== null && currentRunning.remainingBurst > 0) {
      // Non-preemptive: keep executing currentRunning
    } else {
      // Preemptive: switch to bestProcess if different
      if (currentRunning !== bestProcess) {
        if (currentRunning !== null) {
          transitionState(currentRunning, 'READY', currentTime);
          contextSwitches++;
          executionLog.push(
            `[t=${currentTime}] Priority Preemption: ${bestProcess.pid} (Pri: ${bestProcess.effectivePriority}) preempted ${currentRunning.pid} (Pri: ${currentRunning.effectivePriority})`
          );
        }
        transitionState(bestProcess, 'RUNNING', currentTime);
        currentRunning = bestProcess;
      }
    }

    // In preemptive mode, run 1ms unit step or until next event / completion
    // To ensure accurate aging updates and preemption on newly arrived processes, run in 1ms quantum steps
    rawGantt.push({
      pid: currentRunning.pid,
      time: currentTime,
      reason: `Priority: ${currentRunning.effectivePriority} (Base: ${currentRunning.priority})`,
    });

    currentRunning.remainingBurst -= 1;
    currentRunning.cpuTimeUsed += 1;
    currentTime += 1;

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
    algorithm: 'PRIORITY',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
