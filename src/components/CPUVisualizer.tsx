'use client';

import React from 'react';
import { PCB, AlgorithmType } from '../lib/types';
import { Cpu, Activity } from 'lucide-react';

interface CPUVisualizerProps {
  currentRunning: PCB | null;
  currentTime: number;
  cpuUtilization: number;
  algorithm: AlgorithmType;
  quantum?: number;
  readyQueueCount?: number;
}

export default function CPUVisualizer({
  currentRunning,
  currentTime,
  cpuUtilization = 0,
  algorithm,
  quantum,
  readyQueueCount = 0,
}: CPUVisualizerProps) {
  // Generate ASCII block progress meter: e.g. ██████████████░░ 72%
  const totalBlocks = 16;
  const filledBlocks = Math.round((Math.min(100, Math.max(0, cpuUtilization)) / 100) * totalBlocks);
  const emptyBlocks = Math.max(0, totalBlocks - filledBlocks);
  const cpuMeter = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  // Ready queue meter
  const qFilled = Math.min(10, readyQueueCount);
  const qMeter = '█'.repeat(qFilled) + '░'.repeat(Math.max(0, 10 - qFilled));

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl space-y-4">
      {/* Instrumentation Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-amber-500" />
          <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">
            PROCESSOR CORE 0 // EXECUTION REGISTER
          </span>
        </div>
        <span
          className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
            currentRunning
              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/50'
              : 'bg-[#161b22] text-[#8b949e] border-[#30363d]'
          }`}
        >
          {currentRunning ? 'RUNNING' : 'IDLE'}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Core Load Block */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#8b949e] uppercase font-semibold">CPU 0 CORE LOAD</span>
            <span className="text-amber-400 font-bold">{cpuUtilization}%</span>
          </div>
          <div className="text-xs text-amber-500 tracking-tight font-bold select-none">
            {cpuMeter} {cpuUtilization}%
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#6e7681] pt-1 border-t border-[#1c2128]">
            <span>CLOCK: <span className="text-[#f3f4f6] font-bold">{currentTime.toFixed(2)}ms</span></span>
            <span>POLICY: <span className="text-amber-400 font-bold">{algorithm}</span></span>
            <span>QUANTUM: <span className="text-[#f3f4f6] font-bold">{quantum || 4}ms</span></span>
          </div>
        </div>

        {/* Current Process Panel */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase border-b border-[#1c2128] pb-1.5">
            <span>CURRENT PROCESS</span>
            <span className="text-emerald-400 font-semibold">{currentRunning ? 'ACTIVE DISPATCH' : 'IDLE WAIT'}</span>
          </div>

          {currentRunning ? (
            <div>
              <div className="flex items-baseline justify-between py-1">
                <span className="text-2xl font-black text-[#f3f4f6] tracking-wider">
                  {currentRunning.pid}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] text-emerald-400 font-bold uppercase">
                  {currentRunning.processType}
                </span>
              </div>

              {/* Burst progress */}
              <div className="space-y-1 my-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8b949e]">BURST REMAINING</span>
                  <span className="text-amber-400 font-bold">
                    {currentRunning.burstTime}ms → {currentRunning.remainingBurst}ms
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#161b22] border border-[#21262d]">
                  <div
                    className="bg-amber-500 h-full transition-all duration-75"
                    style={{
                      width: `${Math.max(0, Math.min(100, (currentRunning.remainingBurst / currentRunning.burstTime) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1c2128] text-[10px]">
                <div>
                  <span className="text-[#6e7681] block uppercase text-[9px]">Priority</span>
                  <span className="font-bold text-[#f3f4f6]">PRI {currentRunning.effectivePriority}</span>
                </div>
                <div>
                  <span className="text-[#6e7681] block uppercase text-[9px]">Predicted τ</span>
                  <span className="font-bold text-[#38bdf8]">{currentRunning.prediction}ms</span>
                </div>
                <div>
                  <span className="text-[#6e7681] block uppercase text-[9px]">Wait Time</span>
                  <span className="font-bold text-amber-300">{currentRunning.waitingTime}ms</span>
                </div>
                <div>
                  <span className="text-[#6e7681] block uppercase text-[9px]">Confidence</span>
                  <span className="font-bold text-emerald-400">{currentRunning.predictionConfidence}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-[#6e7681]">
              <span className="text-xs uppercase font-bold text-[#8b949e]">CPU 0 IDLE</span>
              <p className="text-[10px] text-[#484f58] mt-1 font-mono">
                WAITING FOR READY QUEUE DISPATCH
              </p>
            </div>
          )}
        </div>

        {/* System Resource Monitor Section (Section 22) */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase border-b border-[#1c2128] pb-1 font-bold">
            <span>SYSTEM RESOURCE MONITOR</span>
            <span className="text-[9px] text-[#6e7681]">HARDWARE BUS</span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">CPU</span>
                <span className="text-amber-400 font-bold">{cpuUtilization}%</span>
              </div>
              <div className="text-[10px] text-amber-500 font-mono tracking-tighter select-none">
                {cpuMeter}
              </div>
            </div>

            {/* Ready Queue Depth */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">READY QUEUE</span>
                <span className="text-[#38bdf8] font-bold">{readyQueueCount} tasks</span>
              </div>
              <div className="text-[10px] text-[#38bdf8] font-mono tracking-tighter select-none">
                {qMeter}
              </div>
            </div>

            {/* Simulated / Real I/O */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">I/O CHANNEL</span>
                <span className="text-emerald-400 font-bold">
                  {currentRunning?.processType === 'I/O-bound' ? 'BUSY (INTERLEAVED)' : 'POLLING'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-500 font-mono tracking-tighter select-none">
                {currentRunning?.processType === 'I/O-bound' ? '████████░░░░░░░░' : '██░░░░░░░░░░░░░░'}
              </div>
            </div>

            {/* Unsimulated Subsystems with transparent labeling */}
            <div className="pt-1.5 border-t border-[#1c2128] space-y-1 text-[9px] text-[#6e7681]">
              <div className="flex justify-between">
                <span>MEMORY SUBSYSTEM</span>
                <span className="text-[#484f58] uppercase">[UNSIMULATED / OFFLINE]</span>
              </div>
              <div className="flex justify-between">
                <span>DISK CONTROLLER</span>
                <span className="text-[#484f58] uppercase">[UNSIMULATED / OFFLINE]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
