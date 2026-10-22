'use client';

import React, { useState, useEffect } from 'react';
import { Process } from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { analyzeBurstHistory, DetailedProcessPrediction } from '../../lib/prediction/history';
import { Activity, Sliders, ArrowRight, Play, Cpu, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PredictionsPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedPid, setSelectedPid] = useState<string>('P1');
  const [alpha, setAlpha] = useState<number>(0.5);

  const [customInput, setCustomInput] = useState<string>('5, 7, 6, 8, 9');
  const [customResult, setCustomResult] = useState<DetailedProcessPrediction | null>(null);

  useEffect(() => {
    const procs = generateProcesses({ count: 10, seed: 42, scenario: 'MIXED' });
    setProcesses(procs);
    setSelectedPid(procs[0]?.pid || 'P1');
  }, []);

  useEffect(() => {
    const numbers = customInput
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    if (numbers.length > 0) {
      setCustomResult(analyzeBurstHistory(numbers, alpha));
    }
  }, [customInput, alpha]);

  const selectedProcess = processes.find(p => p.pid === selectedPid) || processes[0];
  const processAnalysis = selectedProcess 
    ? analyzeBurstHistory(selectedProcess.burstHistory, alpha) 
    : null;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1c2230] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">
              BURST PREDICTOR // STATISTICAL ESTIMATION UNIT
            </h1>
          </div>
          <p className="text-xs text-[#8e99b0] mt-1 font-sans">
            Mathematical Exponential Averaging: &tau;(n+1) = &alpha;&middot;t(n) + (1&minus;&alpha;)&middot;&tau;(n). Error calculation and confidence classification.
          </p>
        </div>

        {/* Smoothing Factor Selector */}
        <div className="flex items-center gap-2 bg-[#0c0e14] border border-[#1e2330] p-1.5 rounded-sm">
          <span className="text-[10px] text-[#636d85] px-1 uppercase">FACTOR &alpha;:</span>
          {[0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((a) => (
            <button
              key={a}
              onClick={() => setAlpha(a)}
              className={`px-2 py-0.5 rounded-sm font-bold transition-colors ${
                alpha === a
                  ? 'bg-amber-500 text-black'
                  : 'text-[#8e99b0] hover:text-white bg-[#10131a]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Mathematical Specification Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">PREDICTION FORMULA</span>
          <span className="text-sm font-bold text-white mt-1 block font-mono">
            &tau;(n+1) = &alpha;&middot;t(n) + (1&minus;&alpha;)&middot;&tau;(n)
          </span>
          <span className="text-[10px] text-[#636d85] mt-1 block">
            &tau;(n+1): Next estimate | t(n): Actual burst | &tau;(n): Prior estimate
          </span>
        </div>

        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">PREDICTION ERROR FORMULA</span>
          <span className="text-sm font-bold text-rose-400 mt-1 block font-mono">
            error = |actual &minus; predicted| / actual &times; 100
          </span>
          <span className="text-[10px] text-[#636d85] mt-1 block">
            Computes percentage divergence from hardware execution
          </span>
        </div>

        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">CONFIDENCE MODEL</span>
          <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">
            confidence = max(0, 100 &minus; error)
          </span>
          <span className="text-[10px] text-[#636d85] mt-1 block">
            HIGH (&ge;80%) &bull; MEDIUM (50-79%) &bull; LOW (&lt;50%)
          </span>
        </div>
      </div>

      {/* Main Process Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Process Selector (4 cols) */}
        <div className="lg:col-span-4 rounded-sm border border-[#1e2330] bg-[#0c0e14] p-3 shadow-xl space-y-2">
          <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold mb-2">
            SELECT PROCESS ENTRY
          </span>

          <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
            {processes.map((p) => {
              const isSelected = p.pid === selectedPid;
              return (
                <div
                  key={p.pid}
                  onClick={() => setSelectedPid(p.pid)}
                  className={`p-2.5 rounded-sm border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#141822] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-[#090b0f] border-[#181c26] hover:border-[#283042]'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white block">{p.pid} ({p.processType})</span>
                    <span className="text-[10px] text-[#636d85]">
                      BURST: {p.burstTime}ms | PRED: {p.predictedBurst}ms
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    (p.confidence || 0) >= 80 ? 'text-emerald-400 bg-emerald-950/30' : (p.confidence || 0) >= 50 ? 'text-amber-400 bg-amber-950/30' : 'text-rose-400 bg-rose-950/30'
                  }`}>
                    {p.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detailed Prediction Telemetry (8 cols) */}
        <div className="lg:col-span-8 rounded-sm border border-[#1e2330] bg-[#0c0e14] p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#181c26] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  BURST TELEMETRY: {selectedPid}
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">&bull; &alpha; = {alpha}</span>
              </div>
              <span className="text-[10px] text-[#636d85]">
                HISTORICAL SEQUENCE REGRESSION ANALYSIS
              </span>
            </div>

            {processAnalysis && (
              <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider ${
                processAnalysis.overallConfidence >= 80
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                  : processAnalysis.overallConfidence >= 50
                  ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
              }`}>
                {processAnalysis.overallLevel} CONFIDENCE ({processAnalysis.overallConfidence}%)
              </span>
            )}
          </div>

          {/* KPI Strip */}
          {processAnalysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] uppercase block">PREDICTED NEXT &tau;</span>
                <span className="text-base font-bold text-[#38bdf8] mt-0.5 block">{processAnalysis.nextPrediction} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] uppercase block">MEAN ERROR</span>
                <span className="text-base font-bold text-rose-400 mt-0.5 block">{processAnalysis.overallMeanError}%</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] uppercase block">BURST VARIANCE</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">{processAnalysis.burstVariance} ms²</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] uppercase block">VOLATILITY STATUS</span>
                <span className={`text-base font-bold mt-0.5 block ${processAnalysis.isVolatile ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {processAnalysis.isVolatile ? 'VOLATILE' : 'STABLE'}
                </span>
              </div>
            </div>
          )}

          {/* Sequential Step Progression Table */}
          {processAnalysis && (
            <div className="space-y-2">
              <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
                BURST PROGRESSION STEP TABLE
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-[#1c2230] text-[#636d85] uppercase text-[9px]">
                      <th className="py-1.5 px-2">STEP</th>
                      <th className="py-1.5 px-2">ACTUAL t(n)</th>
                      <th className="py-1.5 px-2">PREDICTED &tau;(n)</th>
                      <th className="py-1.5 px-2">ERROR</th>
                      <th className="py-1.5 px-2">CONFIDENCE</th>
                      <th className="py-1.5 px-2 text-right">RATING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#151922]">
                    {processAnalysis.steps.map((s) => (
                      <tr key={s.step} className="hover:bg-[#121620]">
                        <td className="py-1.5 px-2 text-[#8e99b0]">STEP #{s.step}</td>
                        <td className="py-1.5 px-2 text-white font-bold">{s.actual} ms</td>
                        <td className="py-1.5 px-2 text-[#38bdf8] font-bold">{s.predicted} ms</td>
                        <td className="py-1.5 px-2 text-rose-400">{s.error}%</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-bold">{s.confidence}%</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={`px-1.5 py-0.2 rounded-sm text-[9px] uppercase border ${
                            s.level === 'HIGH' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40' : s.level === 'MEDIUM' ? 'bg-amber-950/30 text-amber-400 border-amber-500/40' : 'bg-rose-950/30 text-rose-400 border-rose-500/40'
                          }`}>
                            {s.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Sandbox */}
      <div className="rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 shadow-xl space-y-3">
        <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
          INTERACTIVE MATHEMATICAL PREDICTION TESTBENCH
        </span>

        <p className="text-[#8e99b0] text-[11px] font-sans">
          Feed any raw sequence of observed execution bursts into the smoothing pipeline to evaluate responsiveness to spikes.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 rounded-sm bg-[#090b0f] border border-[#1d222f] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            placeholder="e.g. 5, 7, 6, 8, 9, 12, 14"
          />
          <button
            onClick={() => setCustomInput('10, 10, 10, 30, 30, 10')}
            className="px-3 py-1.5 rounded-sm bg-[#151923] hover:bg-[#1e2332] text-amber-400 border border-[#242b3b] font-bold uppercase whitespace-nowrap"
          >
            LOAD SUDDEN SPIKE TEST
          </button>
        </div>

        {customResult && (
          <div className="p-3 rounded-sm bg-[#090b0f] border border-[#181c26] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[9px] text-[#636d85] uppercase block">PREDICTED NEXT BURST</span>
              <span className="text-xl font-black text-[#38bdf8] font-mono">{customResult.nextPrediction} ms</span>
            </div>
            <div>
              <span className="text-[9px] text-[#636d85] uppercase block">MEAN DEVIATION ERROR</span>
              <span className="text-base font-bold text-rose-400 font-mono">{customResult.overallMeanError}%</span>
            </div>
            <div>
              <span className="text-[9px] text-[#636d85] uppercase block">STATISTICAL CONFIDENCE</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{customResult.overallConfidence}% ({customResult.overallLevel})</span>
            </div>
            <div>
              <span className="text-[9px] text-[#636d85] uppercase block">BURST VARIANCE</span>
              <span className="text-base font-bold text-amber-400 font-mono">{customResult.burstVariance} ms²</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
