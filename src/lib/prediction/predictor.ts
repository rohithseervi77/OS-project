import { ConfidenceLevel } from '../types';

export interface BurstPredictor {
  readonly name: string;
  readonly description: string;
  predict(history: number[], options?: Record<string, any>): number;
  calculateError(actual: number, predicted: number): number;
  calculateConfidence(actual: number, predicted: number): number;
  classifyConfidence(confidence: number): ConfidenceLevel;
}

/**
 * Exponential Averaging Predictor:
 * τ(n+1) = α * t(n) + (1 - α) * τ(n)
 */
export class ExponentialAveragePredictor implements BurstPredictor {
  readonly name = 'Exponential Averaging';
  readonly description = 'Standard OS burst predictor using smoothing parameter α ∈ [0.1, 0.9]';
  private defaultAlpha: number;

  constructor(defaultAlpha: number = 0.5) {
    this.defaultAlpha = defaultAlpha;
  }

  predict(history: number[], options?: { alpha?: number; initialTau?: number }): number {
    if (!history || history.length === 0) {
      return options?.initialTau ?? 10;
    }

    const alpha = options?.alpha ?? this.defaultAlpha;
    let tau = options?.initialTau ?? history[0] ?? 10;

    for (let i = 0; i < history.length; i++) {
      const t = history[i];
      tau = alpha * t + (1 - alpha) * tau;
    }

    return Number(tau.toFixed(2));
  }

  calculateError(actual: number, predicted: number): number {
    if (actual <= 0) return 0;
    const error = (Math.abs(actual - predicted) / actual) * 100;
    return Number(error.toFixed(1));
  }

  calculateConfidence(actual: number, predicted: number): number {
    const error = this.calculateError(actual, predicted);
    const conf = Math.max(0, 100 - error);
    return Number(conf.toFixed(1));
  }

  classifyConfidence(confidence: number): ConfidenceLevel {
    if (confidence >= 80) return 'HIGH';
    if (confidence >= 50) return 'MEDIUM';
    return 'LOW';
  }
}

/**
 * Extensible ML Placeholder: Linear Regression Predictor
 * Designed for future plug-in without modifying scheduler code
 */
export class LinearRegressionPredictor implements BurstPredictor {
  readonly name = 'Linear Regression (Trend-Aware)';
  readonly description = 'Fits a trend line y = mx + c to the historical sequence of CPU bursts';

  predict(history: number[]): number {
    if (!history || history.length === 0) return 10;
    if (history.length === 1) return history[0];

    const n = history.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i + 1;
      const y = history[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return history[n - 1];

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const nextX = n + 1;
    const predicted = slope * nextX + intercept;
    return Number(Math.max(1, predicted).toFixed(2));
  }

  calculateError(actual: number, predicted: number): number {
    if (actual <= 0) return 0;
    return Number(((Math.abs(actual - predicted) / actual) * 100).toFixed(1));
  }

  calculateConfidence(actual: number, predicted: number): number {
    const error = this.calculateError(actual, predicted);
    return Number(Math.max(0, 100 - error).toFixed(1));
  }

  classifyConfidence(confidence: number): ConfidenceLevel {
    if (confidence >= 80) return 'HIGH';
    if (confidence >= 50) return 'MEDIUM';
    return 'LOW';
  }
}

/**
 * Extensible ML Placeholder: Random Forest Regressor
 */
export class RandomForestPredictor implements BurstPredictor {
  readonly name = 'Random Forest Regressor (Placeholder)';
  readonly description = 'Ensemble tree predictor for complex multi-feature workload patterns';

  predict(history: number[]): number {
    // Falls back to robust weighted quantile mean of recent bursts
    if (!history || history.length === 0) return 10;
    const recent = history.slice(-5);
    const sum = recent.reduce((a, b) => a + b, 0);
    return Number((sum / recent.length).toFixed(2));
  }

  calculateError(actual: number, predicted: number): number {
    if (actual <= 0) return 0;
    return Number(((Math.abs(actual - predicted) / actual) * 100).toFixed(1));
  }

  calculateConfidence(actual: number, predicted: number): number {
    const error = this.calculateError(actual, predicted);
    return Number(Math.max(0, 100 - error).toFixed(1));
  }

  classifyConfidence(confidence: number): ConfidenceLevel {
    if (confidence >= 80) return 'HIGH';
    if (confidence >= 50) return 'MEDIUM';
    return 'LOW';
  }
}
