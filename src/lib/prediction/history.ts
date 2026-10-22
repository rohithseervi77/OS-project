import { ConfidenceLevel } from '../types';
import { ExponentialAveragePredictor } from './predictor';

export interface BurstHistoryStep {
  step: number;
  actual: number;
  predicted: number;
  error: number;
  confidence: number;
  level: ConfidenceLevel;
}

export interface DetailedProcessPrediction {
  steps: BurstHistoryStep[];
  nextPrediction: number;
  overallMeanError: number;
  overallConfidence: number;
  overallLevel: ConfidenceLevel;
  burstVariance: number;
  isVolatile: boolean;
}

export function analyzeBurstHistory(
  bursts: number[],
  alpha: number = 0.5,
  initialTau: number = 10
): DetailedProcessPrediction {
  const predictor = new ExponentialAveragePredictor(alpha);
  if (!bursts || bursts.length === 0) {
    return {
      steps: [],
      nextPrediction: initialTau,
      overallMeanError: 0,
      overallConfidence: 100,
      overallLevel: 'HIGH',
      burstVariance: 0,
      isVolatile: false,
    };
  }

  const steps: BurstHistoryStep[] = [];
  let currentTau = bursts[0] || initialTau;

  for (let i = 0; i < bursts.length; i++) {
    const actual = bursts[i];
    const predicted = Number(currentTau.toFixed(2));
    const error = predictor.calculateError(actual, predicted);
    const confidence = predictor.calculateConfidence(actual, predicted);
    const level = predictor.classifyConfidence(confidence);

    steps.push({
      step: i + 1,
      actual,
      predicted,
      error,
      confidence,
      level,
    });

    // Update tau for next iteration: τ(n+1) = α * t(n) + (1 - α) * τ(n)
    currentTau = alpha * actual + (1 - alpha) * currentTau;
  }

  const nextPrediction = Number(currentTau.toFixed(2));
  const meanError = Number(
    (steps.reduce((sum, s) => sum + s.error, 0) / steps.length).toFixed(1)
  );
  const meanConfidence = Number(Math.max(0, 100 - meanError).toFixed(1));
  const overallLevel = predictor.classifyConfidence(meanConfidence);

  // Calculate variance of actual bursts
  const meanBurst = bursts.reduce((a, b) => a + b, 0) / bursts.length;
  const variance = Number(
    (bursts.reduce((sum, b) => sum + Math.pow(b - meanBurst, 2), 0) / bursts.length).toFixed(2)
  );
  const isVolatile = variance > 20 || meanConfidence < 60;

  return {
    steps,
    nextPrediction,
    overallMeanError: meanError,
    overallConfidence: meanConfidence,
    overallLevel,
    burstVariance: variance,
    isVolatile,
  };
}
