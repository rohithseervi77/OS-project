import { WorkloadCharacteristics } from '../types';

export interface DynamicQuantumResult {
  quantum: number;
  reason: string;
  confidence: number;
}

/**
 * Workload-Aware Dynamic Time Quantum Engine
 * Calculates optimal slice duration balancing CPU efficiency and response-time latency.
 */
export function calculateDynamicQuantum(workload: WorkloadCharacteristics): DynamicQuantumResult {
  if (workload.totalProcesses === 0) {
    return {
      quantum: 4,
      reason: 'Default quantum applied for empty initial workload.',
      confidence: 100,
    };
  }

  const {
    avgBurst,
    medianBurst,
    burstVariance,
    interactivePercentage,
    cpuBoundPercentage,
    avgConfidence,
    classification,
  } = workload;

  let baseQuantum: number;
  let reason: string;

  // 1. High Interactive / IO-bound workloads
  if (interactivePercentage >= 40 || classification === 'INTERACTIVE' || classification === 'I/O-HEAVY') {
    // Shorter quantum to maximize responsiveness and low response times
    baseQuantum = Math.max(2, Math.round(medianBurst * 0.75));
    reason = `Interactive workload detected (${interactivePercentage}% interactive/IO processes). Lower quantum selected to optimize response latency.`;
  }
  // 2. CPU-Heavy or Batch workloads
  else if (cpuBoundPercentage >= 60 || classification === 'CPU-HEAVY') {
    // Longer quantum to minimize context-switch overhead thrashing
    baseQuantum = Math.min(12, Math.max(6, Math.round(avgBurst * 0.65)));
    reason = `CPU-Heavy workload detected (${cpuBoundPercentage}% compute-bound). Longer quantum selected to minimize context switch overhead.`;
  }
  // 3. High Burst Variance (Bursty)
  else if (burstVariance > 35 || classification === 'BURSTY') {
    // Set quantum around the 70th percentile (median + 0.3 * sqrt(variance))
    const stdDev = Math.sqrt(burstVariance);
    baseQuantum = Math.min(10, Math.max(4, Math.round(medianBurst + stdDev * 0.25)));
    reason = `High burst variance (${burstVariance} ms²) detected. Adaptive quantum calibrated around median burst distribution.`;
  }
  // 4. Mixed / Standard Workload
  else {
    // 80% rule: standard OS guideline where ~80% of CPU bursts should be shorter than quantum
    baseQuantum = Math.min(8, Math.max(3, Math.round((avgBurst + medianBurst) / 2 * 0.7)));
    reason = `Mixed workload detected (Avg burst: ${avgBurst}ms). Quantum tuned to balance fairness and throughput.`;
  }

  // Bound quantum within practical OS operating boundaries [2ms .. 12ms]
  const finalQuantum = Math.min(12, Math.max(2, baseQuantum));

  return {
    quantum: finalQuantum,
    reason,
    confidence: avgConfidence,
  };
}
