import { ConfidenceLevel } from '../types';

export interface PredictionResult {
  predictedBurst: number;
  error: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Exponential Averaging:
 * τ(n+1) = α * t(n) + (1 - α) * τ(n)
 * 
 * @param history Array of observed CPU bursts [t0, t1, ..., tn]
 * @param alpha Smoothing factor (0.1 to 0.9, default 0.5)
 * @param initialTau Initial estimate (default is first burst or 10ms)
 */
export function predictNextBurst(
  history: number[],
  alpha: number = 0.5,
  initialTau: number = 10
): number {
  if (!history || history.length === 0) return initialTau;
  
  let tau = initialTau;
  for (let i = 0; i < history.length; i++) {
    const t = history[i];
    tau = alpha * t + (1 - alpha) * tau;
  }
  
  return Number(tau.toFixed(2));
}

/**
 * Calculates absolute percentage error:
 * error = |actual - predicted| / actual * 100
 */
export function calculatePredictionError(actual: number, predicted: number): number {
  if (actual <= 0) return 0;
  const error = (Math.abs(actual - predicted) / actual) * 100;
  return Number(error.toFixed(1));
}

/**
 * Calculates prediction confidence:
 * confidence = max(0, 100 - error)
 */
export function calculatePredictionConfidence(error: number): number {
  const conf = Math.max(0, 100 - error);
  return Number(conf.toFixed(1));
}

/**
 * Classifies confidence level into HIGH (>=80), MEDIUM (50-79), LOW (<50)
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'HIGH';
  if (confidence >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Computes full prediction data from history and current actual burst
 */
export function computeProcessPrediction(
  history: number[],
  actualBurst: number,
  alpha: number = 0.5
): PredictionResult {
  const predicted = predictNextBurst(history, alpha, history[0] || actualBurst);
  const error = calculatePredictionError(actualBurst, predicted);
  const confidence = calculatePredictionConfidence(error);
  const confidenceLevel = getConfidenceLevel(confidence);

  return {
    predictedBurst: predicted,
    error,
    confidence,
    confidenceLevel,
  };
}
