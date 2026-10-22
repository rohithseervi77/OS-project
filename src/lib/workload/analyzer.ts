import { Process, WorkloadCharacteristics, WorkloadClassification } from '../types';

export function analyzeWorkload(processes: Process[]): WorkloadCharacteristics {
  if (!processes || processes.length === 0) {
    return {
      totalProcesses: 0,
      avgBurst: 0,
      medianBurst: 0,
      burstVariance: 0,
      avgPriority: 0,
      cpuBoundPercentage: 0,
      ioBoundPercentage: 0,
      interactivePercentage: 0,
      batchPercentage: 0,
      arrivalDensity: 0,
      readyQueueSize: 0,
      avgConfidence: 100,
      starvationRisk: false,
      classification: 'MIXED',
    };
  }

  const n = processes.length;
  const bursts = processes.map(p => p.burstTime);
  const priorities = processes.map(p => p.priority);
  const confidences = processes.map(p => p.confidence ?? 100);

  // 1. Mean Burst
  const avgBurst = Number((bursts.reduce((a, b) => a + b, 0) / n).toFixed(1));

  // 2. Median Burst
  const sortedBursts = [...bursts].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const medianBurst = n % 2 !== 0 
    ? sortedBursts[mid] 
    : Number(((sortedBursts[mid - 1] + sortedBursts[mid]) / 2).toFixed(1));

  // 3. Burst Variance
  const burstVariance = Number(
    (bursts.reduce((acc, b) => acc + Math.pow(b - avgBurst, 2), 0) / n).toFixed(1)
  );

  // 4. Mean Priority
  const avgPriority = Number((priorities.reduce((a, b) => a + b, 0) / n).toFixed(1));

  // 5. Types breakdown
  const cpuBoundCount = processes.filter(p => p.processType === 'CPU-bound').length;
  const ioBoundCount = processes.filter(p => p.processType === 'I/O-bound').length;
  const interactiveCount = processes.filter(p => p.processType === 'Interactive').length;
  const batchCount = processes.filter(p => p.processType === 'Batch').length;

  const cpuBoundPercentage = Math.round((cpuBoundCount / n) * 100);
  const ioBoundPercentage = Math.round((ioBoundCount / n) * 100);
  const interactivePercentage = Math.round((interactiveCount / n) * 100);
  const batchPercentage = Math.round((batchCount / n) * 100);

  // 6. Arrival Density: processes arriving within 3ms of each other
  let burstArrivals = 0;
  for (let i = 1; i < n; i++) {
    if (Math.abs(processes[i].arrivalTime - processes[i - 1].arrivalTime) <= 2) {
      burstArrivals++;
    }
  }
  const arrivalDensity = Number((burstArrivals / Math.max(1, n - 1)).toFixed(2));

  // 7. Average Confidence
  const avgConfidence = Number((confidences.reduce((a, b) => a + b, 0) / n).toFixed(1));

  // 8. Starvation Risk: Presence of long, low-priority jobs competing with short, high-priority jobs
  const hasLongLowPriority = processes.some(p => p.burstTime >= 15 && p.priority >= 4);
  const hasShortHighPriority = processes.some(p => p.burstTime <= 6 && p.priority <= 2);
  const starvationRisk = hasLongLowPriority && hasShortHighPriority;

  // 9. Workload Classification Logic
  let classification: WorkloadClassification = 'MIXED';

  if (starvationRisk) {
    classification = 'STARVATION-RISK';
  } else if (cpuBoundPercentage + batchPercentage >= 65) {
    classification = 'CPU-HEAVY';
  } else if (ioBoundPercentage + interactivePercentage >= 65) {
    classification = interactivePercentage >= 40 ? 'INTERACTIVE' : 'I/O-HEAVY';
  } else if (burstVariance > 45) {
    classification = 'BURSTY';
  } else if (priorities.filter(p => p <= 2).length >= n * 0.6) {
    classification = 'HIGH-PRIORITY';
  } else {
    classification = 'MIXED';
  }

  return {
    totalProcesses: n,
    avgBurst,
    medianBurst,
    burstVariance,
    avgPriority,
    cpuBoundPercentage,
    ioBoundPercentage,
    interactivePercentage,
    batchPercentage,
    arrivalDensity,
    readyQueueSize: n,
    avgConfidence,
    starvationRisk,
    classification,
  };
}
