import { Process, PCB, SchedulingResult, GanttSegment } from '../types';
import { createPCB, transitionState } from '../pcb';
import { calculateMetrics } from '../analytics/metrics';

export interface MLFQOptions {
  q0Quantum?: number; // default: 2ms
  q1Quantum?: number; // default: 4ms
  boostInterval?: number; // default: 25ms (priority boost to eliminate starvation)
}

interface MLFQProcessState {
  pcb: PCB;
  queueLevel: number; // 0, 1, or 2
  timeInCurrentQueue: number;
}

export function runMLFQ(
  inputProcesses: Process[],
  options: MLFQOptions = {}
): SchedulingResult {
  const { q0Quantum = 2, q1Quantum = 4, boostInterval = 25 } = options;

  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      algorithm: 'MLFQ',
      gantt: [],
      processes: [],
      metrics: calculateMetrics([], [], 0, 0),
      executionLog: ['No processes provided.'],
      totalTime: 0,
    };
  }

  const pcbs: PCB[] = inputProcesses.map(createPCB);
  const processStates: MLFQProcessState[] = pcbs.map(p => ({
    pcb: p,
    queueLevel: 0,
    timeInCurrentQueue: 0,
  }));

  const unarrived = [...processStates].sort((a, b) => a.pcb.arrivalTime - b.pcb.arrivalTime);
  const q0: MLFQProcessState[] = [];
  const q1: MLFQProcessState[] = [];
  const q2: MLFQProcessState[] = []; // FCFS

  const rawGantt: { pid: string; time: number; reason: string }[] = [];
  const executionLog: string[] = [];

  let currentTime = 0;
  let contextSwitches = 0;
  let currentRunning: MLFQProcessState | null = null;
  let currentSliceUsed = 0;

  executionLog.push(
    `[t=0] MLFQ initialized: Q0(RR q=${q0Quantum}ms), Q1(RR q=${q1Quantum}ms), Q2(FCFS), Boost Interval=${boostInterval}ms.`
  );

  const checkArrivals = (time: number) => {
    while (unarrived.length > 0 && unarrived[0].pcb.arrivalTime <= time) {
      const p = unarrived.shift()!;
      transitionState(p.pcb, 'READY', time);
      p.queueLevel = 0;
      p.timeInCurrentQueue = 0;
      q0.push(p);
      executionLog.push(`[t=${time}] ${p.pcb.pid} arrived and placed in top queue Q0.`);
    }
  };

  const applyPriorityBoost = (time: number) => {
    if (boostInterval > 0 && time > 0 && time % boostInterval === 0) {
      let boosted = 0;
      while (q1.length > 0) {
        const p = q1.shift()!;
        p.queueLevel = 0;
        p.timeInCurrentQueue = 0;
        q0.push(p);
        boosted++;
      }
      while (q2.length > 0) {
        const p = q2.shift()!;
        p.queueLevel = 0;
        p.timeInCurrentQueue = 0;
        q0.push(p);
        boosted++;
      }
      if (boosted > 0) {
        executionLog.push(`[t=${time}] MLFQ Priority Boost: ${boosted} processes reset to Q0 to prevent starvation.`);
      }
    }
  };

  checkArrivals(0);

  const completedCount = () => pcbs.filter(p => p.state === 'TERMINATED').length;

  while (completedCount() < pcbs.length) {
    checkArrivals(currentTime);
    applyPriorityBoost(currentTime);

    // Check if any process is ready in Q0, Q1, or Q2
    const hasReady = q0.length > 0 || q1.length > 0 || q2.length > 0 || currentRunning !== null;

    if (!hasReady) {
      // CPU Idle: advance time
      const nextArrival = unarrived[0]?.pcb.arrivalTime ?? (currentTime + 1);
      const idleSpan = Math.max(1, nextArrival - currentTime);
      for (let s = 0; s < idleSpan; s++) {
        rawGantt.push({ pid: 'IDLE', time: currentTime + s, reason: 'MLFQ Queues Empty' });
      }
      currentTime += idleSpan;
      continue;
    }

    // Preemption check: If Q0 has processes and currentRunning is in Q1 or Q2, preempt!
    if (currentRunning) {
      if (currentRunning.queueLevel > 0 && q0.length > 0) {
        // Preempt by Q0
        transitionState(currentRunning.pcb, 'READY', currentTime);
        if (currentRunning.queueLevel === 1) q1.push(currentRunning);
        else q2.push(currentRunning);
        currentRunning = null;
        currentSliceUsed = 0;
        contextSwitches++;
      } else if (currentRunning.queueLevel === 2 && q1.length > 0) {
        // Preempt by Q1
        transitionState(currentRunning.pcb, 'READY', currentTime);
        q2.push(currentRunning);
        currentRunning = null;
        currentSliceUsed = 0;
        contextSwitches++;
      }
    }

    // Dispatch next process if CPU is free
    if (!currentRunning) {
      if (q0.length > 0) {
        currentRunning = q0.shift()!;
      } else if (q1.length > 0) {
        currentRunning = q1.shift()!;
      } else if (q2.length > 0) {
        currentRunning = q2.shift()!;
      }
      if (currentRunning) {
        transitionState(currentRunning.pcb, 'RUNNING', currentTime);
        currentSliceUsed = 0;
      }
    }

    if (currentRunning) {
      rawGantt.push({
        pid: currentRunning.pcb.pid,
        time: currentTime,
        reason: `MLFQ Q${currentRunning.queueLevel} (Rem: ${currentRunning.pcb.remainingBurst - 1}ms)`,
      });

      currentRunning.pcb.remainingBurst -= 1;
      currentRunning.pcb.cpuTimeUsed += 1;
      currentSliceUsed += 1;
      currentRunning.timeInCurrentQueue += 1;
      currentTime += 1;

      // Check if finished
      if (currentRunning.pcb.remainingBurst <= 0) {
        currentRunning.pcb.completionTime = currentTime;
        currentRunning.pcb.turnaroundTime = currentTime - currentRunning.pcb.arrivalTime;
        currentRunning.pcb.waitingTime = currentRunning.pcb.turnaroundTime - currentRunning.pcb.burstTime;
        transitionState(currentRunning.pcb, 'TERMINATED', currentTime);
        executionLog.push(
          `[t=${currentTime}] ${currentRunning.pcb.pid} completed in Q${currentRunning.queueLevel}. TAT: ${currentRunning.pcb.turnaroundTime}ms, Wait: ${currentRunning.pcb.waitingTime}ms`
        );
        currentRunning = null;
        currentSliceUsed = 0;
      }
      // Check quantum demotion in Q0
      else if (currentRunning.queueLevel === 0 && currentSliceUsed >= q0Quantum) {
        executionLog.push(
          `[t=${currentTime}] ${currentRunning.pcb.pid} used full Q0 quantum (${q0Quantum}ms) -> Demoted to Q1.`
        );
        transitionState(currentRunning.pcb, 'READY', currentTime);
        currentRunning.queueLevel = 1;
        currentRunning.timeInCurrentQueue = 0;
        q1.push(currentRunning);
        currentRunning = null;
        currentSliceUsed = 0;
        contextSwitches++;
      }
      // Check quantum demotion in Q1
      else if (currentRunning.queueLevel === 1 && currentSliceUsed >= q1Quantum) {
        executionLog.push(
          `[t=${currentTime}] ${currentRunning.pcb.pid} used full Q1 quantum (${q1Quantum}ms) -> Demoted to Q2 (FCFS).`
        );
        transitionState(currentRunning.pcb, 'READY', currentTime);
        currentRunning.queueLevel = 2;
        currentRunning.timeInCurrentQueue = 0;
        q2.push(currentRunning);
        currentRunning = null;
        currentSliceUsed = 0;
        contextSwitches++;
      }
    }
  }

  // Compress Gantt
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
    algorithm: 'MLFQ',
    gantt,
    processes: pcbs,
    metrics,
    executionLog,
    totalTime: currentTime,
  };
}
