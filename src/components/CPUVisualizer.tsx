'use client';

import React from 'react';
import { PCB, AlgorithmType } from '../lib/types';
import { Cpu, Zap, Activity } from 'lucide-react';

interface CPUVisualizerProps {
  currentRunning: PCB | null;
  currentTime: number;
  cpuUtilization: number;
  algorithm: AlgorithmType;
  quantum?: number;
}

export default function CPUVisualizer({
  currentRunning,
  currentTime,
  cpuUtilization = 0,
  algorithm,
  quantum,
}: CPUVisualizerProps) {
  // Generate ASCII block progress meter: e.g. ██████████████░░ 78%
  const totalBlocks = 20;
  const filledBlocks = Math.round((Math.min(100, Math.max(0, cpuUtilization)) / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const asciiMeter = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl space-y-4">
      {/* Core Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#181c26]">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-amber-500" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">CPU 0 CORE UNIT</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border uppercase tracking-wider ${
            currentRunning
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
              : 'bg-[#12141a] text-[#4b5563] border-[#222734]'
          }`}
        >
          {currentRunning ? 'RUNNING' : 'IDLE'}
        </span>
      </div>

      {/* Utilization Bar & Percentage */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-[#636d85] uppercase tracking-wider">UTILIZATION</span>
          <span className="font-bold text-amber-400">{cpuUtilization}%</span>
        </div>
        <div className="text-[11px] text-amber-500/90 tracking-tighter overflow-hidden select-none">
          {asciiMeter}
        </div>
      </div>

      {/* Process Slot */}
      <div className="rounded-sm bg-[#090b0f] border border-[#181c26] p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[#636d85] uppercase">
          <span>ACTIVE PROCESS</span>
          <span>SLOT 0</span>
        </div>

        {currentRunning ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-wider">
                {currentRunning.pid}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold uppercase">
                {currentRunning.processType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#141720] text-[11px]">
              <div>
                <span className="text-[9px] text-[#636d85] block uppercase">Remaining</span>
                <span className="font-bold text-amber-400">{currentRunning.remainingBurst} ms</span>
              </div>
              <div>
                <span className="text-[9px] text-[#636d85] block uppercase">Burst Time</span>
                <span className="font-bold text-white">{currentRunning.burstTime} ms</span>
              </div>
              <div>
                <span className="text-[9px] text-[#636d85] block uppercase">Effective Pri</span>
                <span className="font-bold text-white">{currentRunning.effectivePriority}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#636d85] block uppercase">Prediction</span>
                <span className="font-bold text-[#38bdf8]">{currentRunning.prediction} ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-[#4b5563]">
            <span className="text-xs">CPU IDLE</span>
            <p className="text-[10px] text-[#333a4a] mt-0.5">READY QUEUE DISPATCH WAIT</p>
          </div>
        )}
      </div>

      {/* Telemetry Registers */}
      <div className="pt-1 border-t border-[#181c26] space-y-1 text-[10px] text-[#636d85]">
        <div className="flex justify-between">
          <span>SCHEDULING POLICY:</span>
          <span className="text-white font-bold">{algorithm}</span>
        </div>
        {quantum !== undefined && (
          <div className="flex justify-between">
            <span>TIME QUANTUM (q):</span>
            <span className="text-amber-400 font-bold">{quantum} ms</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>KERNEL CLOCK:</span>
          <span className="text-white">{currentTime.toFixed(2)} ms</span>
        </div>
      </div>
    </div>
  );
}
