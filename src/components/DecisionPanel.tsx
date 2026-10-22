'use client';

import React from 'react';
import { SmartDecision, WorkloadCharacteristics } from '../lib/types';
import { 
  GitCommit, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Cpu, 
  ShieldAlert,
  Sliders
} from 'lucide-react';

interface DecisionPanelProps {
  decision: SmartDecision | null;
  workload?: WorkloadCharacteristics | null;
}

export default function DecisionPanel({ decision, workload }: DecisionPanelProps) {
  if (!decision) {
    return (
      <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-6 text-center font-mono text-xs shadow-xl">
        <span className="text-[#4b5563] block">
          SMART SCHEDULER STANDBY &bull; RUN SIMULATION TO GENERATE DECISION TRACE
        </span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[#181c26] gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <h3 className="font-bold text-white tracking-wider text-xs uppercase">
            SMART SCHEDULER DECISION SYSTEM
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#636d85]">
            SELECTED: <span className="text-amber-400 font-bold">{decision.selectedAlgorithm}</span>
          </span>
          <span className="text-[10px] text-[#636d85]">
            [ QUANTUM: <span className="text-white font-bold">{decision.dynamicQuantum}ms</span> ]
          </span>
          <span className="text-[10px] text-[#636d85]">
            [ CONFIDENCE: <span className="text-emerald-400 font-bold">{decision.predictionConfidence}%</span> ]
          </span>
        </div>
      </div>

      {/* 1. WORKLOAD ANALYSIS: Compact Horizontal Indicators */}
      {workload && (
        <div className="space-y-2">
          <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
            01 // WORKLOAD ANALYSIS PROFILE ({workload.classification})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#090b0f] p-3 rounded-sm border border-[#181c26]">
            {/* CPU-bound vs I/O-bound */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#8e99b0]">CPU / I/O Ratio</span>
                <span className="text-white font-bold">
                  {workload.cpuBoundPercentage}% / {workload.ioBoundPercentage + workload.interactivePercentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#171b24] rounded-sm flex overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${workload.cpuBoundPercentage}%` }} />
                <div className="bg-[#38bdf8] h-full" style={{ width: `${workload.ioBoundPercentage + workload.interactivePercentage}%` }} />
              </div>
            </div>

            {/* Average Burst & Variance */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#8e99b0]">Burst Mean / Var</span>
                <span className="text-amber-400 font-bold">
                  {workload.avgBurst}ms / {workload.burstVariance}ms²
                </span>
              </div>
              <div className="text-[10px] text-[#636d85]">
                MEDIAN: {workload.medianBurst}ms
              </div>
            </div>

            {/* Ready Queue Length */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#8e99b0]">Queue Pressure</span>
                <span className="text-white font-bold">{workload.totalProcesses} tasks</span>
              </div>
              <div className="text-[10px] text-[#636d85]">
                DENSITY: {workload.arrivalDensity} arr/tick
              </div>
            </div>

            {/* Starvation Risk */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#8e99b0]">Starvation Risk</span>
                <span className={`font-bold ${workload.starvationRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {workload.starvationRisk ? 'ALERT (AGING ON)' : 'NOMINAL'}
                </span>
              </div>
              <div className="text-[10px] text-[#636d85]">
                CONFIDENCE: {workload.avgConfidence}% ({decision.confidenceLevel})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DECISION TRACE: Visual Pipeline */}
      <div className="space-y-2">
        <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
          02 // DECISION TRACE PIPELINE
        </span>

        <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-[#090b0f] rounded-sm border border-[#181c26] text-[10px]">
          <div className="px-2 py-1 bg-[#12151d] border border-[#212736] rounded-sm shrink-0">
            <span className="text-[#636d85] block text-[8px]">WORKLOAD</span>
            <span className="text-white font-bold">{workload?.classification || 'MIXED'}</span>
          </div>

          <ArrowRight className="h-3 w-3 text-[#3d455b] shrink-0" />

          <div className="px-2 py-1 bg-[#12151d] border border-[#212736] rounded-sm shrink-0">
            <span className="text-[#636d85] block text-[8px]">BURST PREDICTION</span>
            <span className="text-amber-400 font-bold">avg {workload?.avgBurst}ms</span>
          </div>

          <ArrowRight className="h-3 w-3 text-[#3d455b] shrink-0" />

          <div className="px-2 py-1 bg-[#12151d] border border-[#212736] rounded-sm shrink-0">
            <span className="text-[#636d85] block text-[8px]">CONFIDENCE</span>
            <span className="text-[#38bdf8] font-bold">{decision.predictionConfidence}% ({decision.confidenceLevel})</span>
          </div>

          <ArrowRight className="h-3 w-3 text-[#3d455b] shrink-0" />

          <div className="px-2 py-1 bg-[#12151d] border border-[#212736] rounded-sm shrink-0">
            <span className="text-[#636d85] block text-[8px]">CANDIDATE SIMULATION</span>
            <span className="text-purple-300 font-bold">6 policies</span>
          </div>

          <ArrowRight className="h-3 w-3 text-[#3d455b] shrink-0" />

          <div className="px-2 py-1 bg-[#12151d] border border-[#212736] rounded-sm shrink-0">
            <span className="text-[#636d85] block text-[8px]">MULTI-OBJECTIVE</span>
            <span className="text-emerald-400 font-bold">Score {decision.score.toFixed(3)}</span>
          </div>

          <ArrowRight className="h-3 w-3 text-[#3d455b] shrink-0" />

          <div className="px-2 py-1 bg-amber-950/40 border border-amber-500/50 rounded-sm shrink-0">
            <span className="text-amber-400 block text-[8px] font-bold">POLICY SELECTED</span>
            <span className="text-amber-300 font-bold">{decision.selectedAlgorithm} (q={decision.dynamicQuantum}ms)</span>
          </div>
        </div>
      </div>

      {/* 3. POLICY COMPARISON TABLE */}
      <div className="space-y-2">
        <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
          03 // CANDIDATE POLICIES EVALUATION MATRIX
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#1c2230] text-[#636d85] uppercase text-[9px]">
                <th className="py-1.5 px-2">POLICY</th>
                <th className="py-1.5 px-2">WAIT (WT)</th>
                <th className="py-1.5 px-2">RESP (RT)</th>
                <th className="py-1.5 px-2">TAT</th>
                <th className="py-1.5 px-2">FAIRNESS</th>
                <th className="py-1.5 px-2">SWITCHES</th>
                <th className="py-1.5 px-2 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161a24]">
              {decision.candidateScores.map((c) => {
                const isSelected = c.algorithm === decision.selectedAlgorithm;
                return (
                  <tr
                    key={c.algorithm}
                    className={`${isSelected ? 'bg-amber-950/20 text-white font-bold border-l-2 border-l-amber-500' : 'text-[#8e99b0]'}`}
                  >
                    <td className="py-1.5 px-2 flex items-center gap-1.5">
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      <span className={isSelected ? 'text-amber-400' : 'text-white'}>{c.algorithm}</span>
                    </td>
                    <td className="py-1.5 px-2 text-yellow-400">{c.metrics.avgWaitingTime}ms</td>
                    <td className="py-1.5 px-2 text-teal-400">{c.metrics.avgResponseTime}ms</td>
                    <td className="py-1.5 px-2 text-purple-400">{c.metrics.avgTurnaroundTime}ms</td>
                    <td className="py-1.5 px-2 text-emerald-400">{c.metrics.fairness.toFixed(3)}</td>
                    <td className="py-1.5 px-2 text-[#8e99b0]">{c.metrics.contextSwitches}</td>
                    <td className="py-1.5 px-2 text-right font-bold">
                      <span className={isSelected ? 'text-amber-400 font-bold' : 'text-[#636d85]'}>
                        {c.score.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. WHY THIS DECISION? Structured Explanation */}
      <div className="space-y-2 pt-1 border-t border-[#181c26]">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-white uppercase text-[11px]">
            WHY {decision.selectedAlgorithm}?
          </span>
        </div>

        <div className="bg-[#090b0f] border border-[#181c26] p-3 rounded-sm space-y-1.5 text-[11px] text-[#c0c7d6]">
          {decision.detailedPoints.map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-amber-500">&bull;</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
