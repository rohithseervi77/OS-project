'use client';

import React from 'react';
import { WorkloadCharacteristics } from '../lib/types';
import { BarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface WorkloadAnalyzerViewProps {
  workload: WorkloadCharacteristics;
}

export default function WorkloadAnalyzerView({ workload }: WorkloadAnalyzerViewProps) {
  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#181c26]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            WORKLOAD CHARACTERISTICS // {workload.classification}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-sm bg-amber-950/40 border border-amber-500/50 text-amber-400 font-bold text-[10px] uppercase">
          PROFILE: {workload.classification}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">CPU-Bound Ratio</span>
          <span className="text-base font-bold text-purple-400 mt-0.5 block">{workload.cpuBoundPercentage}%</span>
          <div className="w-full bg-[#181c26] h-1 rounded-sm mt-2 overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: `${workload.cpuBoundPercentage}%` }} />
          </div>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">I/O & Interactive</span>
          <span className="text-base font-bold text-[#38bdf8] mt-0.5 block">
            {workload.ioBoundPercentage + workload.interactivePercentage}%
          </span>
          <div className="w-full bg-[#181c26] h-1 rounded-sm mt-2 overflow-hidden">
            <div className="bg-[#38bdf8] h-full" style={{ width: `${Math.min(100, workload.ioBoundPercentage + workload.interactivePercentage)}%` }} />
          </div>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Burst Mean / Variance</span>
          <span className="text-base font-bold text-amber-400 mt-0.5 block">
            {workload.avgBurst}ms / {workload.burstVariance}ms²
          </span>
          <span className="text-[9px] text-[#636d85] mt-1 block">
            MEDIAN: {workload.medianBurst}ms
          </span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Prediction Reliability</span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">{workload.avgConfidence}%</span>
          <span className="text-[9px] text-[#636d85] mt-1 block">
            STARVATION: {workload.starvationRisk ? 'FLAGGED' : 'NOMINAL'}
          </span>
        </div>
      </div>
    </div>
  );
}
