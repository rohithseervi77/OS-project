'use client';

import React, { useState } from 'react';
import { ObjectiveWeights } from '../../lib/types';
import { DEFAULT_OBJECTIVE_WEIGHTS } from '../../lib/scheduler/smartScheduler';
import { Sliders, RotateCcw, Check, Cpu, Clock, Activity, Repeat, ShieldCheck } from 'lucide-react';

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
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-8 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1c2230] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">
              KERNEL PARAMETERS & OBJECTIVE PREFERENCES
            </h1>
          </div>
          <p className="text-xs text-[#8e99b0] mt-1 font-sans">
            Calibrate multi-objective optimization priorities, aging thresholds, and predictor smoothing coefficients.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#151923] hover:bg-[#1d2332] text-[#8e99b0] hover:text-white border border-[#242b3b] font-bold uppercase transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          RESTORE DEFAULTS
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Multi-Objective Weights */}
        <div className="rounded-sm border border-[#1e2330] bg-[#0c0e14] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#181c26]">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                MULTI-OBJECTIVE SCORING WEIGHTS
              </span>
              <span className="text-[10px] text-[#636d85]">
                DETERMINES UTILITY SCORE RANKING AMONG CANDIDATE SCHEDULING POLICIES
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-sm font-bold border text-[10px] ${
              totalWeight === 100 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40' 
                : 'bg-amber-950/40 text-amber-400 border-amber-500/40'
            }`}>
              TOTAL WEIGHT: {totalWeight}%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">WAITING TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.waitingTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.waitingTime * 100)}
                onChange={(e) => handleWeightChange('waitingTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">RESPONSE TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.responseTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.responseTime * 100)}
                onChange={(e) => handleWeightChange('responseTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">TURNAROUND TIME WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.turnaroundTime * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.turnaroundTime * 100)}
                onChange={(e) => handleWeightChange('turnaroundTime', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">CPU UTILIZATION WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.cpuUtilization * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.cpuUtilization * 100)}
                onChange={(e) => handleWeightChange('cpuUtilization', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">JAIN&apos;S FAIRNESS INDEX WEIGHT</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.fairness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.fairness * 100)}
                onChange={(e) => handleWeightChange('fairness', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white">CONTEXT SWITCH OVERHEAD PENALTY</span>
                <span className="text-amber-400 font-bold">{Math.round(weights.contextSwitches * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={Math.round(weights.contextSwitches * 100)}
                onChange={(e) => handleWeightChange('contextSwitches', Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#161a24] rounded-sm cursor-pointer h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Operating System Policy Settings */}
        <div className="rounded-sm border border-[#1e2330] bg-[#0c0e14] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#181c26]">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              AGING POLICY & PREDICTION COEFFICIENTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#636d85] block mb-1.5 uppercase font-bold">
                STARVATION AGING THRESHOLD (MS)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setAgingThreshold(th)}
                    className={`py-1.5 rounded-sm text-xs font-bold ${
                      agingThreshold === th
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#10131a] text-[#8e99b0] hover:text-white border border-[#1e2330]'
                    }`}
                  >
                    {th}ms
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#636d85] mt-1 block">
                Process effective priority elevated by 1 upon crossing threshold wait duration.
              </span>
            </div>

            <div>
              <label className="text-[10px] text-[#636d85] block mb-1.5 uppercase font-bold">
                SMOOTHING COEFFICIENT &alpha;
              </label>
              <div className="grid grid-cols-6 gap-1">
                {[0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlpha(a)}
                    className={`py-1.5 rounded-sm text-xs font-bold ${
                      alpha === a
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#10131a] text-[#8e99b0] hover:text-white border border-[#1e2330]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#636d85] mt-1 block">
                Higher values yield rapid adaptation to burst spikes; lower values provide conservative dampening.
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
            className="px-5 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider"
          >
            COMMIT CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
}
