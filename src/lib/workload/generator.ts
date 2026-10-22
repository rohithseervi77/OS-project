import { Process, ProcessType } from '../types';
import { computeProcessPrediction } from '../prediction/exponentialAverage';

// Seeded pseudorandom generator (Mulberry32)
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratorOptions {
  count: number;
  seed?: number;
  scenario?: 'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN';
  alpha?: number;
}

export function generateProcesses(options: GeneratorOptions): Process[] {
  const { count, seed = 42, scenario = 'MIXED', alpha = 0.5 } = options;
  const rand = createPRNG(seed);
  const processes: Process[] = [];

  let currentArrival = 0;

  for (let i = 1; i <= count; i++) {
    const pid = `P${i}`;
    let processType: ProcessType = 'CPU-bound';
    let burstTime = 10;
    let priority = Math.floor(rand() * 5) + 1; // 1 to 5 (1 is high)
    const history: number[] = [];

    // Scenario-based generation
    if (scenario === 'CPU_HEAVY') {
      processType = rand() > 0.15 ? 'CPU-bound' : 'Batch';
      burstTime = Math.floor(rand() * 18) + 12; // 12-30 ms
      // Generates stable CPU burst history
      const historyLength = Math.floor(rand() * 4) + 3;
      for (let h = 0; h < historyLength; h++) {
        history.push(Math.max(8, burstTime + Math.floor(rand() * 7) - 3));
      }
    } else if (scenario === 'INTERACTIVE') {
      processType = rand() > 0.3 ? 'Interactive' : 'I/O-bound';
      burstTime = Math.floor(rand() * 6) + 2; // 2-8 ms
      const historyLength = Math.floor(rand() * 4) + 3;
      for (let h = 0; h < historyLength; h++) {
        history.push(Math.max(1, burstTime + Math.floor(rand() * 5) - 2));
      }
    } else if (scenario === 'STARVATION') {
      // Few high-priority short tasks and many low-priority long tasks
      if (i <= 2) {
        processType = 'Interactive';
        burstTime = Math.floor(rand() * 4) + 2; // 2-5 ms
        priority = 1; // highest priority
      } else {
        processType = 'Batch';
        burstTime = Math.floor(rand() * 20) + 15; // 15-35 ms
        priority = 5; // lowest priority
      }
      const historyLength = 4;
      for (let h = 0; h < historyLength; h++) {
        history.push(Math.max(2, burstTime + Math.floor(rand() * 5) - 2));
      }
    } else if (scenario === 'UNCERTAIN') {
      // Highly volatile burst history (extreme variance -> low prediction confidence < 50%)
      processType = 'CPU-bound';
      burstTime = Math.floor(rand() * 20) + 5; // e.g. 5-25ms
      const historyLength = 6;
      for (let h = 0; h < historyLength; h++) {
        // Extreme alternating swings: 1-3ms vs 35-50ms
        const spike = h % 2 === 0 ? Math.floor(rand() * 3) + 1 : Math.floor(rand() * 25) + 35;
        history.push(spike);
      }
    } else {
      // MIXED Workload (realistic production simulation)
      const rType = rand();
      if (rType < 0.35) {
        processType = 'CPU-bound';
        burstTime = Math.floor(rand() * 14) + 10; // 10-24 ms
      } else if (rType < 0.65) {
        processType = 'Interactive';
        burstTime = Math.floor(rand() * 7) + 3; // 3-10 ms
      } else if (rType < 0.85) {
        processType = 'I/O-bound';
        burstTime = Math.floor(rand() * 4) + 2; // 2-6 ms
      } else {
        processType = 'Batch';
        burstTime = Math.floor(rand() * 20) + 16; // 16-36 ms
      }

      const historyLength = Math.floor(rand() * 4) + 3;
      for (let h = 0; h < historyLength; h++) {
        const delta = Math.floor(rand() * 7) - 3;
        history.push(Math.max(2, burstTime + delta));
      }
    }

    // Stagger arrival times realistically
    if (i === 1) {
      currentArrival = 0;
    } else {
      currentArrival += Math.floor(rand() * 4); // delta 0 to 3
    }

    // Compute actual prediction based on historical bursts
    const prediction = computeProcessPrediction(history, burstTime, alpha);

    processes.push({
      pid,
      arrivalTime: currentArrival,
      burstTime,
      priority,
      processType,
      burstHistory: history,
      predictedBurst: prediction.predictedBurst,
      predictionError: prediction.error,
      confidence: prediction.confidence,
      state: 'NEW',
    });
  }

  return processes;
}

export function createManualProcess(
  pid: string,
  arrivalTime: number,
  burstTime: number,
  priority: number,
  processType: ProcessType,
  burstHistoryStr: string = '',
  alpha: number = 0.5
): Process {
  let burstHistory: number[] = [];
  if (burstHistoryStr && burstHistoryStr.trim().length > 0) {
    burstHistory = burstHistoryStr
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
  }
  if (burstHistory.length === 0) {
    burstHistory = [burstTime];
  }

  const prediction = computeProcessPrediction(burstHistory, burstTime, alpha);

  return {
    pid,
    arrivalTime: Math.max(0, arrivalTime),
    burstTime: Math.max(1, burstTime),
    priority: Math.max(1, priority),
    processType,
    burstHistory,
    predictedBurst: prediction.predictedBurst,
    predictionError: prediction.error,
    confidence: prediction.confidence,
    state: 'NEW',
  };
}
