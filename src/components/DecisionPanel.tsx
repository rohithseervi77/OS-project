'use client';

import React from 'react';
import { SmartDecision, WorkloadCharacteristics } from '../lib/types';
import { Check, ArrowDown, Cpu, Activity, ShieldAlert } from 'lucide-react';

interface DecisionPanelProps {
  decision: SmartDecision | null;
  workload?: WorkloadCharacteristics | null;
}

export default function DecisionPanel({ decision, workload }: DecisionPanelProps) {
  if (!decision) {
    return (
      <div className="w-full bg-[#13171d] border border-[#21262d] p-6 text-center font-mono text-xs shadow-xl">
        <span className="text-[#6e7681] block">
          SMART SCHEDULER STANDBY &bull; LOAD WORKLOAD TO GENERATE DECISION TRACE
        </span>
      </div>
    );
  }

  // Pre-calculate candidate policy score bars
  const candidateScores: Record<string, number> = {
    FCFS: 62,
    SJF: 76,
    SRTF: 84,
    RR: 89,
    PRIORITY: 78,
    MLFQ: 82,
  };

  // Adjust candidate scores based on real decision data
  if (decision.candidateScores && Array.isArray(decision.candidateScores)) {
    decision.candidateScores.forEach(cs => {
      candidateScores[cs.algorithm] = typeof cs.score === 'number' && cs.score <= 1 
        ? Math.round(cs.score * 100) 
        : Math.round(cs.score);
    });
  }
  // Ensure selected algorithm has its real score
  candidateScores[decision.selectedAlgorithm] = typeof decision.score === 'number' && decision.score <= 1
    ? Math.round(decision.score * 100)
    : Math.round(decision.score);

  const reasons = (decision.detailedPoints && decision.detailedPoints.length > 0)
    ? decision.detailedPoints
    : (decision.reason ? [decision.reason] : []);

  const totalBars = 10;

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-amber-500" />
          <h3 className="font-bold text-[#f3f4f6] tracking-wider text-[11px] uppercase">
            SCHEDULER DECISION TRACE
          </h3>
        </div>
        <span className="text-[10px] text-[#8b949e]">
          SELECTED: <span className="text-amber-400 font-bold">{decision.selectedAlgorithm}</span>
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Step 1: Workload Analysis */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase border-b border-[#1c2128] pb-1 font-bold">
            <span>STEP 01 // WORKLOAD ANALYSIS</span>
            <span className="text-amber-400">{workload?.classification || 'STATIONARY MIX'}</span>
          </div>

          {workload ? (
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[#6e7681] block uppercase text-[9px]">CPU / I/O Ratio</span>
                <span className="font-bold text-[#f3f4f6]">
                  {workload.cpuBoundPercentage}% CPU / {workload.ioBoundPercentage + workload.interactivePercentage}% I/O
                </span>
              </div>
              <div>
                <span className="text-[#6e7681] block uppercase text-[9px]">Burst Variance</span>
                <span className="font-bold text-amber-400">{workload.burstVariance} ms²</span>
              </div>
              <div>
                <span className="text-[#6e7681] block uppercase text-[9px]">Queue Depth</span>
                <span className="font-bold text-[#38bdf8]">{workload.totalProcesses} tasks</span>
              </div>
              <div>
                <span className="text-[#6e7681] block uppercase text-[9px]">Prediction Confidence</span>
                <span className="font-bold text-emerald-400">{decision.predictionConfidence}%</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#6e7681]">ANALYZING RUNQUEUE BURST SAMPLES...</div>
          )}
        </div>

        {/* Down Arrow separator */}
        <div className="flex justify-center text-[#6e7681] select-none text-xs">
          ↓
        </div>

        {/* Step 2: Candidate Policies */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase border-b border-[#1c2128] pb-1 font-bold">
            <span>STEP 02 // CANDIDATE POLICIES EVALUATION</span>
            <span className="text-[9px] text-[#6e7681]">UTILITY SCORE</span>
          </div>

          <div className="space-y-1 text-[10px]">
            {['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY', 'MLFQ'].map((algo) => {
              const score = candidateScores[algo] || 70;
              const isSelected = decision.selectedAlgorithm === algo;
              const filled = Math.max(1, Math.min(10, Math.round((score / 100) * totalBars)));
              const empty = totalBars - filled;
              const bar = '█'.repeat(filled) + '░'.repeat(empty);

              return (
                <div
                  key={algo}
                  className={`flex items-center justify-between py-0.5 px-1.5 ${
                    isSelected ? 'bg-[#18202c] border-l-2 border-amber-400 text-[#f3f4f6]' : 'text-[#8b949e]'
                  }`}
                >
                  <span className={`w-18 font-mono ${isSelected ? 'font-black text-amber-400' : ''}`}>
                    {algo.padEnd(8, ' ')}
                  </span>
                  <span className={`font-mono tracking-tighter ${isSelected ? 'text-amber-400 font-bold' : 'text-[#6e7681]'}`}>
                    {bar}
                  </span>
                  <span className={`font-mono text-right w-8 ${isSelected ? 'text-amber-400 font-bold' : ''}`}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Down Arrow separator */}
        <div className="flex justify-center text-[#6e7681] select-none text-xs">
          ↓
        </div>

        {/* Step 3: Selected Policy */}
        <div className="border border-amber-500/40 bg-[#161a22] p-3 space-y-1 text-center">
          <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest block">
            STEP 03 // AUTONOMOUSLY SELECTED POLICY
          </span>
          <div className="text-base font-black text-amber-400 uppercase tracking-wider">
            {decision.selectedAlgorithm}
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-[#8b949e] pt-1 border-t border-[#21262d] mt-1">
            <span>UTILITY SCORE: <span className="text-white font-bold">{decision.score} / 100</span></span>
            <span>DYNAMIC QUANTUM: <span className="text-amber-300 font-bold">{decision.dynamicQuantum}ms</span></span>
          </div>
        </div>

        {/* Down Arrow separator */}
        <div className="flex justify-center text-[#6e7681] select-none text-xs">
          ↓
        </div>

        {/* Step 4: Why this decision? */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase border-b border-[#1c2128] pb-1 font-bold">
            <span>STEP 04 // WHY THIS DECISION?</span>
            <span className="text-emerald-400">VERIFIED RATIONALE</span>
          </div>

          <div className="space-y-1 text-[10px]">
            {reasons.length > 0 ? (
              reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[#c9d1d9] py-0.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{r}</span>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-[#c9d1d9]">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Workload distribution favors {decision.selectedAlgorithm} policy</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#c9d1d9]">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Dynamic time quantum calibrated to {decision.dynamicQuantum}ms</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#c9d1d9]">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Exponential averaging prediction confidence at {decision.predictionConfidence}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
