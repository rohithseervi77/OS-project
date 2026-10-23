import { Process, PCB, AlgorithmType, GanttSegment, SchedulerMetrics } from '../types';
import { createPCB, transitionState, checkAndApplyAging } from '../pcb';
import { SimulationEvent, SimulationEventType, SimulationStepState } from './events';
import { calculateMetrics } from '../analytics/metrics';

export interface SimulationEngineConfig {
  algorithm: AlgorithmType;
  quantum?: number;
  agingThreshold?: number;
  usePrediction?: boolean;
  mlfqBoostInterval?: number;
}

export class DiscreteEventSimulationEngine {
  private initialProcesses: Process[];
  private config: SimulationEngineConfig;

  private pcbs: PCB[];
  private unarrived: PCB[];
  private readyQueue: PCB[];
  private completed: PCB[];
  private currentRunning: PCB | null = null;
  private currentQuantumUsed: number = 0;

  // MLFQ state tracking
  private mlfqQ0: PCB[] = [];
  private mlfqQ1: PCB[] = [];
  private mlfqQ2: PCB[] = [];
  private processQueueLevel: Map<string, number> = new Map();

  private currentTime: number = 0;
  private contextSwitches: number = 0;
  private totalBusyTime: number = 0;
  private rawHistory: { pid: string; time: number; reason: string }[] = [];
  private eventLog: SimulationEvent[] = [];
  private isFinished: boolean = false;

  constructor(processes: Process[], config: SimulationEngineConfig) {
    this.initialProcesses = processes;
    this.config = config;

    this.pcbs = processes.map(createPCB);
    this.unarrived = [...this.pcbs].sort((a, b) => a.arrivalTime - b.arrivalTime);
    this.readyQueue = [];
    this.completed = [];
    this.mlfqQ0 = [];
    this.mlfqQ1 = [];
    this.mlfqQ2 = [];
    this.processQueueLevel = new Map();
    this.currentTime = 0;
    this.contextSwitches = 0;
    this.totalBusyTime = 0;
    this.rawHistory = [];
    this.eventLog = [];
    this.isFinished = processes.length === 0;

    this.logEvent(0, 'SCHEDULE', 'SYSTEM', `Simulator initialized with algorithm ${config.algorithm}`);
    this.checkArrivals(0);
  }

  private logEvent(time: number, type: SimulationEventType, pid: string, description: string) {
    this.eventLog.unshift({
      id: `${time}-${type}-${pid}-${Math.random().toString(36).substr(2, 4)}`,
      time,
      type,
      pid,
      description,
    });
    // Keep log reasonable in size for UI
    if (this.eventLog.length > 150) {
      this.eventLog.pop();
    }
  }

  private checkArrivals(time: number) {
    while (this.unarrived.length > 0 && this.unarrived[0].arrivalTime <= time) {
      const arrived = this.unarrived.shift()!;
      transitionState(arrived, 'READY', time);
      if (this.config.algorithm === 'MLFQ') {
        this.processQueueLevel.set(arrived.pid, 0);
        this.mlfqQ0.push(arrived);
        this.logEvent(time, 'PROCESS_ARRIVAL', arrived.pid, `${arrived.pid} arrived at t=${time}ms -> placed in MLFQ Q0`);
      } else {
        this.readyQueue.push(arrived);
        this.logEvent(time, 'PROCESS_ARRIVAL', arrived.pid, `${arrived.pid} arrived at t=${time}ms (Burst: ${arrived.burstTime}ms)`);
      }
    }
  }

  private selectNextProcess(): PCB | null {
    const algo = this.config.algorithm;
    const usePred = this.config.usePrediction ?? false;

    if (algo === 'MLFQ') {
      let next: PCB | null = null;
      if (this.mlfqQ0.length > 0) {
        next = this.mlfqQ0.shift()!;
      } else if (this.mlfqQ1.length > 0) {
        next = this.mlfqQ1.shift()!;
      } else if (this.mlfqQ2.length > 0) {
        next = this.mlfqQ2.shift()!;
      }
      return next;
    }

    if (this.readyQueue.length === 0) return null;

    if (algo === 'FCFS') {
      // FIFO
      return this.readyQueue.shift()!;
    } else if (algo === 'SJF') {
      // Non-preemptive shortest burst
      this.readyQueue.sort((a, b) => {
        const ma = usePred ? a.prediction : a.burstTime;
        const mb = usePred ? b.prediction : b.burstTime;
        if (ma !== mb) return ma - mb;
        return a.arrivalTime - b.arrivalTime;
      });
      return this.readyQueue.shift()!;
    } else if (algo === 'SRTF') {
      // Shortest remaining time
      this.readyQueue.sort((a, b) => {
        const ra = usePred ? Math.max(0.1, a.prediction - a.cpuTimeUsed) : a.remainingBurst;
        const rb = usePred ? Math.max(0.1, b.prediction - b.cpuTimeUsed) : b.remainingBurst;
        if (ra !== rb) return ra - rb;
        return a.arrivalTime - b.arrivalTime;
      });
      return this.readyQueue.shift()!;
    } else if (algo === 'PRIORITY') {
      // Priority with effective priority
      this.readyQueue.sort((a, b) => {
        if (a.effectivePriority !== b.effectivePriority) return a.effectivePriority - b.effectivePriority;
        return a.arrivalTime - b.arrivalTime;
      });
      return this.readyQueue.shift()!;
    } else {
      // Round Robin default
      return this.readyQueue.shift()!;
    }
  }

  /**
   * Performs 1 time-step (1 ms simulation tick)
   */
  public step(): SimulationStepState {
    if (this.isFinished) {
      return this.getState();
    }

    const t = this.currentTime;
    const quantum = Math.max(1, this.config.quantum || 4);
    const agingThreshold = this.config.agingThreshold ?? 10;
    const boostInterval = this.config.mlfqBoostInterval ?? 25;

    // 1. Check process arrivals at current time
    this.checkArrivals(t);

    // 2. MLFQ Priority Boost Check
    if (this.config.algorithm === 'MLFQ' && boostInterval > 0 && t > 0 && t % boostInterval === 0) {
      let boosted = 0;
      while (this.mlfqQ1.length > 0) {
        const p = this.mlfqQ1.shift()!;
        this.processQueueLevel.set(p.pid, 0);
        this.mlfqQ0.push(p);
        boosted++;
      }
      while (this.mlfqQ2.length > 0) {
        const p = this.mlfqQ2.shift()!;
        this.processQueueLevel.set(p.pid, 0);
        this.mlfqQ0.push(p);
        boosted++;
      }
      if (boosted > 0) {
        this.logEvent(t, 'SCHEDULE', 'SYSTEM', `MLFQ Priority Boost: ${boosted} processes promoted to Q0`);
      }
    }

    // 3. Check aging for processes waiting in readyQueue (for PRIORITY)
    if (this.config.algorithm === 'PRIORITY' && agingThreshold > 0) {
      for (const p of this.readyQueue) {
        const wait = t - p.arrivalTime - p.cpuTimeUsed;
        if (checkAndApplyAging(p, wait, agingThreshold)) {
          this.logEvent(t, 'SCHEDULE', p.pid, `Aging: ${p.pid} effective priority elevated to ${p.effectivePriority}`);
        }
      }
    }

    // 4. Preemption checks for SRTF, Priority, or MLFQ
    if (this.currentRunning) {
      if (this.config.algorithm === 'MLFQ') {
        const currentLvl = this.processQueueLevel.get(this.currentRunning.pid) ?? 0;
        if (currentLvl > 0 && this.mlfqQ0.length > 0) {
          this.logEvent(t, 'CPU_PREEMPT', this.currentRunning.pid, `MLFQ Preemption: High priority Q0 arrived, preempting ${this.currentRunning.pid} (Q${currentLvl})`);
          transitionState(this.currentRunning, 'READY', t);
          if (currentLvl === 1) this.mlfqQ1.push(this.currentRunning);
          else this.mlfqQ2.push(this.currentRunning);
          this.currentRunning = null;
          this.currentQuantumUsed = 0;
          this.contextSwitches++;
        } else if (currentLvl === 2 && this.mlfqQ1.length > 0) {
          this.logEvent(t, 'CPU_PREEMPT', this.currentRunning.pid, `MLFQ Preemption: Medium priority Q1 arrived, preempting ${this.currentRunning.pid} (Q2)`);
          transitionState(this.currentRunning, 'READY', t);
          this.mlfqQ2.push(this.currentRunning);
          this.currentRunning = null;
          this.currentQuantumUsed = 0;
          this.contextSwitches++;
        }
      } else if (this.readyQueue.length > 0 && this.config.algorithm === 'SRTF') {
        const usePred = this.config.usePrediction ?? false;
        const currentRem = usePred ? (this.currentRunning.prediction - this.currentRunning.cpuTimeUsed) : this.currentRunning.remainingBurst;
        
        let bestCandidate = this.readyQueue[0];
        let bestRem = usePred ? (bestCandidate.prediction - bestCandidate.cpuTimeUsed) : bestCandidate.remainingBurst;
        for (const p of this.readyQueue) {
          const rem = usePred ? (p.prediction - p.cpuTimeUsed) : p.remainingBurst;
          if (rem < bestRem) {
            bestCandidate = p;
            bestRem = rem;
          }
        }

        if (bestRem < currentRem) {
          // Preemption!
          this.logEvent(t, 'CPU_PREEMPT', this.currentRunning.pid, `${bestCandidate.pid} (Rem: ${bestRem}ms) preempted ${this.currentRunning.pid} (Rem: ${currentRem}ms)`);
          transitionState(this.currentRunning, 'READY', t);
          this.readyQueue.push(this.currentRunning);
          this.currentRunning = null;
          this.contextSwitches++;
        }
      } else if (this.readyQueue.length > 0 && this.config.algorithm === 'PRIORITY') {
        // Find if readyQueue has strictly higher priority (lower numeric value)
        let highest = this.readyQueue[0];
        for (const p of this.readyQueue) {
          if (p.effectivePriority < highest.effectivePriority) {
            highest = p;
          }
        }
        if (highest.effectivePriority < this.currentRunning.effectivePriority) {
          this.logEvent(t, 'CPU_PREEMPT', this.currentRunning.pid, `Priority Preemption: ${highest.pid} (Pri: ${highest.effectivePriority}) preempted ${this.currentRunning.pid} (Pri: ${this.currentRunning.effectivePriority})`);
          transitionState(this.currentRunning, 'READY', t);
          this.readyQueue.push(this.currentRunning);
          this.currentRunning = null;
          this.contextSwitches++;
        }
      }
    }

    // 5. Dispatch CPU if idle
    if (!this.currentRunning) {
      const next = this.selectNextProcess();
      if (next) {
        transitionState(next, 'RUNNING', t);
        this.currentRunning = next;
        this.currentQuantumUsed = 0;
        const qInfo = this.config.algorithm === 'MLFQ' ? ` (MLFQ Q${this.processQueueLevel.get(next.pid) ?? 0})` : '';
        this.logEvent(t, 'CPU_START', next.pid, `Dispatched ${next.pid} on CPU${qInfo}`);
      }
    }

    // 6. Execute 1 ms on CPU
    if (this.currentRunning) {
      const qInfo = this.config.algorithm === 'MLFQ' ? ` [Q${this.processQueueLevel.get(this.currentRunning.pid) ?? 0}]` : '';
      this.rawHistory.push({
        pid: this.currentRunning.pid,
        time: t,
        reason: `Executing${qInfo} (Remaining: ${this.currentRunning.remainingBurst - 1}ms)`,
      });

      this.currentRunning.remainingBurst -= 1;
      this.currentRunning.cpuTimeUsed += 1;
      this.currentQuantumUsed += 1;
      this.totalBusyTime += 1;
      this.currentTime += 1;

      // Check if process finished
      if (this.currentRunning.remainingBurst <= 0) {
        this.currentRunning.completionTime = this.currentTime;
        this.currentRunning.turnaroundTime = this.currentTime - this.currentRunning.arrivalTime;
        this.currentRunning.waitingTime = this.currentRunning.turnaroundTime - this.currentRunning.burstTime;
        transitionState(this.currentRunning, 'TERMINATED', this.currentTime);

        this.logEvent(this.currentTime, 'CPU_COMPLETE', this.currentRunning.pid, `${this.currentRunning.pid} completed execution (TAT: ${this.currentRunning.turnaroundTime}ms, Wait: ${this.currentRunning.waitingTime}ms)`);
        this.completed.push(this.currentRunning);
        this.currentRunning = null;
        this.currentQuantumUsed = 0;
      } 
      // Check MLFQ Demotion
      else if (this.config.algorithm === 'MLFQ') {
        const currentLvl = this.processQueueLevel.get(this.currentRunning.pid) ?? 0;
        const q0Limit = 2;
        const q1Limit = 4;
        if (currentLvl === 0 && this.currentQuantumUsed >= q0Limit) {
          this.logEvent(this.currentTime, 'CPU_PREEMPT', this.currentRunning.pid, `MLFQ Q0 quantum (${q0Limit}ms) expired for ${this.currentRunning.pid} -> Demoted to Q1`);
          transitionState(this.currentRunning, 'READY', this.currentTime);
          this.processQueueLevel.set(this.currentRunning.pid, 1);
          this.checkArrivals(this.currentTime);
          this.mlfqQ1.push(this.currentRunning);
          this.currentRunning = null;
          this.currentQuantumUsed = 0;
          this.contextSwitches++;
        } else if (currentLvl === 1 && this.currentQuantumUsed >= q1Limit) {
          this.logEvent(this.currentTime, 'CPU_PREEMPT', this.currentRunning.pid, `MLFQ Q1 quantum (${q1Limit}ms) expired for ${this.currentRunning.pid} -> Demoted to Q2 (FCFS)`);
          transitionState(this.currentRunning, 'READY', this.currentTime);
          this.processQueueLevel.set(this.currentRunning.pid, 2);
          this.checkArrivals(this.currentTime);
          this.mlfqQ2.push(this.currentRunning);
          this.currentRunning = null;
          this.currentQuantumUsed = 0;
          this.contextSwitches++;
        }
      }
      // Check Round Robin quantum expiration
      else if (this.config.algorithm === 'RR' && this.currentQuantumUsed >= quantum) {
        this.logEvent(this.currentTime, 'CPU_PREEMPT', this.currentRunning.pid, `Quantum of ${quantum}ms expired for ${this.currentRunning.pid}`);
        transitionState(this.currentRunning, 'READY', this.currentTime);
        this.checkArrivals(this.currentTime);
        this.readyQueue.push(this.currentRunning);
        this.currentRunning = null;
        this.currentQuantumUsed = 0;
        this.contextSwitches++;
      }
    } else {
      // CPU Idle
      this.rawHistory.push({
        pid: 'IDLE',
        time: t,
        reason: 'Ready queue empty',
      });
      this.currentTime += 1;
    }

    // 7. Check termination condition
    if (this.completed.length === this.pcbs.length) {
      this.isFinished = true;
      this.logEvent(this.currentTime, 'SCHEDULE', 'SYSTEM', `All ${this.pcbs.length} processes completed.`);
    }

    return this.getState();
  }

  /**
   * Generates compressed Gantt segments from raw execution history
   */
  public getGanttSegments(): GanttSegment[] {
    const gantt: GanttSegment[] = [];
    if (this.rawHistory.length === 0) return gantt;

    let segPid = this.rawHistory[0].pid;
    let segStart = 0;
    let segReason = this.rawHistory[0].reason;

    for (let i = 1; i < this.rawHistory.length; i++) {
      if (this.rawHistory[i].pid !== segPid) {
        gantt.push({
          pid: segPid,
          startTime: segStart,
          endTime: i,
          duration: i - segStart,
          reason: segReason,
        });
        segPid = this.rawHistory[i].pid;
        segStart = i;
        segReason = this.rawHistory[i].reason;
      }
    }

    gantt.push({
      pid: segPid,
      startTime: segStart,
      endTime: this.rawHistory.length,
      duration: this.rawHistory.length - segStart,
      reason: segReason,
    });

    return gantt;
  }

  public getState(): SimulationStepState {
    const gantt = this.getGanttSegments();
    const metrics = calculateMetrics(this.completed, gantt, this.currentTime, this.contextSwitches);
    const activeReadyQueue = this.config.algorithm === 'MLFQ'
      ? [...this.mlfqQ0, ...this.mlfqQ1, ...this.mlfqQ2]
      : [...this.readyQueue];

    return {
      currentTime: this.currentTime,
      currentRunning: this.currentRunning,
      readyQueue: activeReadyQueue,
      completedProcesses: [...this.completed],
      gantt,
      eventLog: [...this.eventLog],
      isFinished: this.isFinished,
      contextSwitches: this.contextSwitches,
      totalBusyTime: this.totalBusyTime,
      metrics,
    };
  }

  public reset() {
    this.pcbs = this.initialProcesses.map(createPCB);
    this.unarrived = [...this.pcbs].sort((a, b) => a.arrivalTime - b.arrivalTime);
    this.readyQueue = [];
    this.completed = [];
    this.mlfqQ0 = [];
    this.mlfqQ1 = [];
    this.mlfqQ2 = [];
    this.processQueueLevel = new Map();
    this.currentRunning = null;
    this.currentQuantumUsed = 0;
    this.currentTime = 0;
    this.contextSwitches = 0;
    this.totalBusyTime = 0;
    this.rawHistory = [];
    this.eventLog = [];
    this.isFinished = this.initialProcesses.length === 0;

    this.logEvent(0, 'SCHEDULE', 'SYSTEM', `Simulator reset.`);
    this.checkArrivals(0);
  }
}
