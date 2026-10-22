import { PCB, SchedulerMetrics, GanttSegment } from '../types';

/**
 * Calculates Jain's Fairness Index:
 * J = (Σ xi)^2 / (n * Σ xi^2)
 * 
 * where xi is the normalized service ratio for process i:
 * xi = burstTime / turnaroundTime  (ratio of actual computation to turnaround time in system)
 * 
 * Value ranges from 1/n (worst fairness) to 1.0 (perfectly fair).
 */
export function calculateJainsFairness(processes: PCB[]): number {
  if (!processes || processes.length === 0) return 1.0;
  
  // Calculate service ratio xi for each process
  const x = processes.map(p => {
    if (p.turnaroundTime <= 0) return 1.0;
    return p.burstTime / p.turnaroundTime;
  });

  const n = x.length;
  const sum = x.reduce((acc, val) => acc + val, 0);
  const sumSquares = x.reduce((acc, val) => acc + (val * val), 0);

  if (sumSquares === 0) return 1.0;

  const fairness = (sum * sum) / (n * sumSquares);
  return Number(Math.min(1.0, Math.max(0.0, fairness)).toFixed(3));
}

/**
 * Calculates complete scheduling metrics from finished PCBs and Gantt segments
 */
export function calculateMetrics(
  processes: PCB[],
  gantt: GanttSegment[],
  totalSimulationTime: number,
  contextSwitchCount: number,
  contextSwitchDuration: number = 0
): SchedulerMetrics {
  const n = processes.length;
  if (n === 0) {
    return {
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      contextSwitchOverhead: 0,
      fairness: 1.0,
      starvationCount: 0,
      avgPredictionError: 0,
      avgConfidence: 100,
    };
  }

  const totalWaiting = processes.reduce((acc, p) => acc + p.waitingTime, 0);
  const totalTurnaround = processes.reduce((acc, p) => acc + p.turnaroundTime, 0);
  const totalResponse = processes.reduce((acc, p) => acc + (p.responseTime >= 0 ? p.responseTime : 0), 0);

  // Total CPU busy time is the sum of burst times
  const totalCpuBusy = processes.reduce((acc, p) => acc + p.burstTime, 0);
  const totalTime = Math.max(1, totalSimulationTime);

  // CPU utilization: Busy / Total time
  const cpuUtilization = Number(Math.min(100, (totalCpuBusy / totalTime) * 100).toFixed(1));

  // Throughput: completed processes per unit time (multiplied by 100 for readable processes / 100ms)
  const throughput = Number(((n / totalTime) * 100).toFixed(2));

  // Fairness using Jain's Index
  const fairness = calculateJainsFairness(processes);

  // Starvation: Waiting time exceeds 3x burst time and waiting > 15ms
  const starvationCount = processes.filter(p => p.waitingTime > 15 && p.waitingTime > p.burstTime * 2.5).length;

  // Prediction accuracy
  const totalPredError = processes.reduce((acc, p) => {
    const err = Math.abs(p.burstTime - p.prediction);
    const pct = p.burstTime > 0 ? (err / p.burstTime) * 100 : 0;
    return acc + pct;
  }, 0);

  const avgPredictionError = Number((totalPredError / n).toFixed(1));
  const avgConfidence = Number(Math.max(0, 100 - avgPredictionError).toFixed(1));

  return {
    avgWaitingTime: Number((totalWaiting / n).toFixed(2)),
    avgTurnaroundTime: Number((totalTurnaround / n).toFixed(2)),
    avgResponseTime: Number((totalResponse / n).toFixed(2)),
    cpuUtilization,
    throughput,
    contextSwitches: contextSwitchCount,
    contextSwitchOverhead: contextSwitchCount * contextSwitchDuration,
    fairness,
    starvationCount,
    avgPredictionError,
    avgConfidence,
  };
}
