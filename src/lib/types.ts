export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export type ProcessType = 'CPU-bound' | 'I/O-bound' | 'Interactive' | 'Batch';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Process {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  processType: ProcessType;
  burstHistory: number[];
  predictedBurst?: number;
  predictionError?: number;
  confidence?: number;
  state?: ProcessState;
}

export interface PCB {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  remainingBurst: number;
  priority: number;
  effectivePriority: number;
  processType: ProcessType;
  state: ProcessState;
  cpuTimeUsed: number;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number;
  firstResponseTime: number | null;
  prediction: number;
  predictionConfidence: number;
  lastScheduledTime: number;
  completionTime: number;
  burstHistory: number[];
  agingCount: number;
}

export type WorkloadClassification = 
  | 'CPU-HEAVY' 
  | 'I/O-HEAVY' 
  | 'INTERACTIVE' 
  | 'MIXED' 
  | 'BURSTY' 
  | 'HIGH-PRIORITY' 
  | 'STARVATION-RISK';

export interface WorkloadCharacteristics {
  totalProcesses: number;
  avgBurst: number;
  medianBurst: number;
  burstVariance: number;
  avgPriority: number;
  cpuBoundPercentage: number;
  ioBoundPercentage: number;
  interactivePercentage: number;
  batchPercentage: number;
  arrivalDensity: number;
  readyQueueSize: number;
  avgConfidence: number;
  starvationRisk: boolean;
  classification: WorkloadClassification;
}

export type AlgorithmType = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY' | 'MLFQ' | 'SMART';

export interface GanttSegment {
  pid: string;
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
}

export interface SchedulerMetrics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
  contextSwitchOverhead: number;
  fairness: number; // Jain's Fairness Index [0..1]
  starvationCount: number;
  avgPredictionError: number;
  avgConfidence: number;
  score?: number;
}

export interface SchedulingResult {
  algorithm: AlgorithmType;
  gantt: GanttSegment[];
  processes: PCB[];
  metrics: SchedulerMetrics;
  executionLog: string[];
  totalTime: number;
}

export interface ObjectiveWeights {
  waitingTime: number;      // default: 0.25
  responseTime: number;     // default: 0.20
  turnaroundTime: number;   // default: 0.15
  cpuUtilization: number;   // default: 0.15
  fairness: number;         // default: 0.15
  contextSwitches: number;  // default: 0.10
}

export interface SmartDecision {
  selectedAlgorithm: AlgorithmType;
  dynamicQuantum: number;
  agingThreshold: number;
  predictionConfidence: number;
  confidenceLevel: ConfidenceLevel;
  workload: WorkloadClassification;
  score: number;
  reason: string;
  detailedPoints: string[];
  candidateScores: {
    algorithm: AlgorithmType;
    score: number;
    metrics: SchedulerMetrics;
  }[];
}
