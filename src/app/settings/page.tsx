'use client';

import React, { useState } from 'react';
import { ObjectiveWeights } from '../../lib/types';
import { DEFAULT_OBJECTIVE_WEIGHTS } from '../../lib/scheduler/smartScheduler';
import { RotateCcw, Check, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [weights, setWeights] = useState<ObjectiveWeights>(DEFAULT_OBJECTIVE_WEIGHTS);
  const [agingThreshold, setAgingThreshold] = useState<number>(10);
  const [alpha, setAlpha] = useState<number>(0.5);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const totalWeight = Math.round(
    (weights.waitingTime +
      weights.responseTime +
      weights.turnaroundTime +
      weights.cpuUtilization +
      weights.fairness +
      weights.contextSwitches) * 100
  );

  const handleWeightChange = (key: keyof ObjectiveWeights, val: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: Number((val / 100).toFixed(2)),
    }));
  };

  const handleReset = () => {
    setWeights(DEFAULT_OBJECTIVE_WEIGHTS);
    setAgingThreshold(10);
    setAlpha(0.5);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-6 font-mono text-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              KERNEL PARAMETERS & OBJECTIVE PREFERENCES
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Calibrate multi-objective optimization priorities, aging thresholds, and predictor smoothing coefficients.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d] font-bold uppercase transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          RESTORE DEFAULTS
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Multi-Objective Weights */}
        <div className="bg-[#13171d] border border-[#21262d] p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#21262d]">
            <div>
              <span className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider block">
                MULTI-OBJECTIVE SCORING WEIGHTS
              </span>
              <span className="text-[10px] text-[#8b949e]">
                DETERMINES UTILITY SCORE RANKING AMONG CANDIDATE SCHEDULING POLICIES
              </span>
            </div>
            <span className={`px-2 py-0.5 font-bold border text-[10px] ${
              totalWeight === 100 
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/50' 
                : 'bg-amber-950/50 text-amber-400 border-amber-500/50'
            }`}>
              TOTAL WEIGHT: {totalWeight}%
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">WAITING TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.waitingTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.waitingTime * 100)}
                onChange={(e) => handleWeightChange('waitingTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">RESPONSE TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.responseTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.responseTime * 100)}
                onChange={(e) => handleWeightChange('responseTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">TURNAROUND TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.turnaroundTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.turnaroundTime * 100)}
                onChange={(e) => handleWeightChange('turnaroundTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">CPU UTILIZATION WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.cpuUtilization * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.cpuUtilization * 100)}
                onChange={(e) => handleWeightChange('cpuUtilization', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">JAIN&apos;S FAIRNESS INDEX WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.fairness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.fairness * 100)}
                onChange={(e) => handleWeightChange('fairness', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#c9d1d9]">CONTEXT SWITCH OVERHEAD PENALTY</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.contextSwitches * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.contextSwitches * 100)}
                onChange={(e) => handleWeightChange('contextSwitches', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#0d0f12] cursor-pointer h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Aging policy & prediction coefficients */}
        <div className="bg-[#13171d] border border-[#21262d] p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#21262d]">
            <span className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider block">
              AGING POLICY & PREDICTION COEFFICIENTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#6e7681] block mb-1.5 uppercase font-bold">
                STARVATION AGING THRESHOLD (MS)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setAgingThreshold(th)}
                    className={`py-1.5 text-xs font-bold ${
                      agingThreshold === th
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#0d0f12] text-[#8b949e] hover:text-white border border-[#21262d]'
                    }`}
                  >
                    {th}ms
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-[#6e7681] mt-1 block">
                Process effective priority elevated by 1 upon crossing threshold wait duration.
              </span>
            </div>

            <div>
              <label className="text-[10px] text-[#6e7681] block mb-1.5 uppercase font-bold">
                SMOOTHING COEFFICIENT α
              </label>
              <div className="grid grid-cols-6 gap-1">
                {[0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlpha(a)}
                    className={`py-1.5 text-xs font-bold ${
                      alpha === a
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#0d0f12] text-[#8b949e] hover:text-white border border-[#21262d]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-[#6e7681] mt-1 block">
                Higher values yield rapid adaptation to burst spikes; lower values provide dampening.
              </span>
            </div>
          </div>
        </div>

        {/* Save button & notice */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedNotice && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                <Check className="h-4 w-4" /> PARAMETERS COMMITTED TO KERNEL CONFIG
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors"
          >
            COMMIT CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
}
