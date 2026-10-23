import { 
  Process, 
  PCB, 
  AlgorithmType, 
  SchedulingResult, 
  ObjectiveWeights, 
  SmartDecision, 
  WorkloadCharacteristics,
  ConfidenceLevel,
  SchedulerMetrics
} from '../types';
import { runFCFS } from './fcfs';
import { runSJF } from './sjf';
import { runSRTF } from './srtf';
import { runRoundRobin } from './roundRobin';
import { runPriority } from './priority';
import { runMLFQ } from './mlfq';
import { analyzeWorkload } from '../workload/analyzer';
import { calculateDynamicQuantum } from './dynamicQuantum';
import { getConfidenceLevel } from '../prediction/exponentialAverage';

export const DEFAULT_OBJECTIVE_WEIGHTS: ObjectiveWeights = {
  waitingTime: 0.25,
  responseTime: 0.20,
  turnaroundTime: 0.15,
  cpuUtilization: 0.15,
  fairness: 0.15,
  contextSwitches: 0.10,
};

export interface CandidateEvaluation {
  algorithm: AlgorithmType;
  result: SchedulingResult;
  rawScore: number;
  finalScore: number;
}

export function evaluateSmartScheduler(
  processes: Process[],
  userWeights: Partial<ObjectiveWeights> = {},
  customAgingThreshold: number = 10
): {
  decision: SmartDecision;
  bestResult: SchedulingResult;
  candidateEvaluations: CandidateEvaluation[];
  workload: WorkloadCharacteristics;
} {
  const weights: ObjectiveWeights = {
    ...DEFAULT_OBJECTIVE_WEIGHTS,
    ...userWeights,
  };

  // 1. Analyze the current workload
  const workload = analyzeWorkload(processes);
  const dynQuantumRes = calculateDynamicQuantum(workload);
  const confidenceLevel = getConfidenceLevel(workload.avgConfidence);

  // 2. Run simulation of each candidate algorithm on the IDENTICAL process dataset
  const candidates: { algorithm: AlgorithmType; result: SchedulingResult }[] = [
    { algorithm: 'FCFS', result: runFCFS(processes) },
    { algorithm: 'SJF', result: runSJF(processes, confidenceLevel !== 'LOW') },
    { algorithm: 'SRTF', result: runSRTF(processes, confidenceLevel !== 'LOW') },
    { algorithm: 'RR', result: runRoundRobin(processes, dynQuantumRes.quantum) },
    { algorithm: 'PRIORITY', result: runPriority(processes, { preemptive: true, agingThreshold: customAgingThreshold }) },
    { algorithm: 'MLFQ', result: runMLFQ(processes, { q0Quantum: Math.max(1, Math.round(dynQuantumRes.quantum / 2)), q1Quantum: dynQuantumRes.quantum, boostInterval: 25 }) },
  ];

  // 3. Multi-objective normalization across candidates
  const allWT = candidates.map(c => c.result.metrics.avgWaitingTime);
  const allTAT = candidates.map(c => c.result.metrics.avgTurnaroundTime);
  const allRT = candidates.map(c => c.result.metrics.avgResponseTime);
  const allUtil = candidates.map(c => c.result.metrics.cpuUtilization);
  const allFair = candidates.map(c => c.result.metrics.fairness);
  const allCS = candidates.map(c => c.result.metrics.contextSwitches);

  const minWT = Math.min(...allWT), maxWT = Math.max(...allWT);
  const minTAT = Math.min(...allTAT), maxTAT = Math.max(...allTAT);
  const minRT = Math.min(...allRT), maxRT = Math.max(...allRT);
  const minUtil = Math.min(...allUtil), maxUtil = Math.max(...allUtil);
  const minFair = Math.min(...allFair), maxFair = Math.max(...allFair);
  const minCS = Math.min(...allCS), maxCS = Math.max(...allCS);

  const normalizeLowerIsBetter = (val: number, min: number, max: number) => {
    if (max === min) return 1.0;
    return Math.max(0, 1 - (val - min) / (max - min));
  };

  const normalizeHigherIsBetter = (val: number, min: number, max: number) => {
    if (max === min) return 1.0;
    return Math.max(0, (val - min) / (max - min));
  };

  const evaluations: CandidateEvaluation[] = candidates.map(candidate => {
    const m = candidate.result.metrics;

    const normWT = normalizeLowerIsBetter(m.avgWaitingTime, minWT, maxWT);
    const normTAT = normalizeLowerIsBetter(m.avgTurnaroundTime, minTAT, maxTAT);
    const normRT = normalizeLowerIsBetter(m.avgResponseTime, minRT, maxRT);
    const normUtil = normalizeHigherIsBetter(m.cpuUtilization, minUtil, maxUtil);
    const normFair = normalizeHigherIsBetter(m.fairness, minFair, maxFair);
    const normCS = normalizeLowerIsBetter(m.contextSwitches, minCS, maxCS);

    const rawScore = 
      normWT * weights.waitingTime +
      normRT * weights.responseTime +
      normTAT * weights.turnaroundTime +
      normUtil * weights.cpuUtilization +
      normFair * weights.fairness +
      normCS * weights.contextSwitches;

    // 4. Confidence-Aware Modulation (penalize prediction reliance when confidence is low)
    let confidenceMultiplier = 1.0;
    if (confidenceLevel === 'LOW') {
      // Penalize algorithms with extreme reliance on uncertain burst predictions
      if (candidate.algorithm === 'SRTF') confidenceMultiplier = 0.70;
      if (candidate.algorithm === 'SJF') confidenceMultiplier = 0.80;
    }

    const finalScore = Number((rawScore * confidenceMultiplier).toFixed(3));

    // Assign final computed score to result metrics
    candidate.result.metrics.score = finalScore;

    return {
      algorithm: candidate.algorithm,
      result: candidate.result,
      rawScore: Number(rawScore.toFixed(3)),
      finalScore,
    };
  });

  // Sort candidate evaluations descending by final score
  evaluations.sort((a, b) => b.finalScore - a.finalScore);

  const bestEval = evaluations[0];
  const selectedAlgo = bestEval.algorithm;

  // 5. Deterministic Explainable Reasoning Generator
  const detailedPoints: string[] = [];

  detailedPoints.push(
    `Workload classified as ${workload.classification} (${workload.cpuBoundPercentage}% CPU-bound, ${workload.ioBoundPercentage + workload.interactivePercentage}% Interactive/IO).`
  );

  detailedPoints.push(
    `Average predicted burst is ${workload.avgBurst}ms with variance of ${workload.burstVariance}ms². Dynamic quantum computed as ${dynQuantumRes.quantum}ms.`
  );

  if (confidenceLevel === 'HIGH') {
    detailedPoints.push(
      `Prediction confidence is HIGH (${workload.avgConfidence}%). Scheduling engine granted full reliance on predicted bursts.`
    );
  } else if (confidenceLevel === 'MEDIUM') {
    detailedPoints.push(
      `Prediction confidence is MEDIUM (${workload.avgConfidence}%). Moderate predictive influence applied.`
    );
  } else {
    detailedPoints.push(
      `Prediction confidence is LOW (${workload.avgConfidence}%). Engine reduced reliance on predictions to prevent starvation and preemptive mis-scheduling.`
    );
  }

  detailedPoints.push(
    `${selectedAlgo} achieved the highest multi-objective utility score (${bestEval.finalScore}) balancing wait time, responsiveness, and fairness.`
  );

  if (workload.starvationRisk) {
    detailedPoints.push(
      `Starvation risk detected among long-running jobs. Aging policy applied with threshold of ${customAgingThreshold}ms.`
    );
  }

  const reason = `${selectedAlgo} was selected because the workload contains ${workload.cpuBoundPercentage}% CPU-bound and ${workload.interactivePercentage}% interactive processes with average burst of ${workload.avgBurst}ms. Prediction confidence is ${workload.avgConfidence}% (${confidenceLevel}), so burst predictions were utilized with ${confidenceLevel === 'HIGH' ? 'strong' : confidenceLevel === 'MEDIUM' ? 'moderate' : 'conservative'} weight. ${selectedAlgo} produced the top weighted performance score (${bestEval.finalScore}) across user objectives.`;

  const decision: SmartDecision = {
    selectedAlgorithm: selectedAlgo,
    dynamicQuantum: dynQuantumRes.quantum,
    agingThreshold: customAgingThreshold,
    predictionConfidence: workload.avgConfidence,
    confidenceLevel,
    workload: workload.classification,
    score: bestEval.finalScore,
    reason,
    detailedPoints,
    candidateScores: evaluations.map(e => ({
      algorithm: e.algorithm,
      score: e.finalScore,
      metrics: e.result.metrics,
    })),
  };

  return {
    decision,
    bestResult: bestEval.result,
    candidateEvaluations: evaluations,
    workload,
  };
}
