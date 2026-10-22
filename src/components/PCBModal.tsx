'use client';

import React from 'react';
import { PCB, ProcessState } from '../lib/types';
import { X, ArrowRight, ArrowDown, Activity, Clock, Cpu, Layers } from 'lucide-react';

interface PCBModalProps {
  pcb: PCB | null;
  onClose: () => void;
}

export default function PCBModal({ pcb, onClose }: PCBModalProps) {
  if (!pcb) return null;

  const stateColors: Record<ProcessState, string> = {
    RUNNING: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50 font-bold',
    READY: 'text-amber-400 bg-amber-950/40 border-amber-500/50 font-bold',
    WAITING: 'text-[#38bdf8] bg-sky-950/40 border-sky-500/50',
    TERMINATED: 'text-[#6b7280] bg-[#12151c] border-[#232938]',
    NEW: 'text-[#9ca3af] bg-[#12151c] border-[#232938]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-xs p-0 font-mono text-xs">
      <div className="relative w-full max-w-xl h-full border-l border-[#242b3b] bg-[#0c0e14] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1c2230] pb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-sm bg-[#161a24] border border-[#262d3e] text-amber-400 font-bold text-base">
                {pcb.pid}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    PROCESS CONTROL BLOCK (PCB)
                  </h3>
                  <span className={`px-2 py-0.2 rounded-sm text-[9px] uppercase border ${stateColors[pcb.state]}`}>
                    {pcb.state}
                  </span>
                </div>
                <span className="text-[10px] text-[#636d85]">
                  TYPE: {pcb.processType} // BASE PRIORITY: {pcb.priority}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-sm text-[#636d85] hover:text-white hover:bg-[#1a1f2b] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* State Transition Timeline */}
          <div className="rounded-sm bg-[#090b0f] border border-[#181c26] p-4 space-y-2">
            <span className="text-[10px] text-[#636d85] uppercase tracking-wider font-bold block">
              OS PROCESS STATE TRANSITION TIMELINE
            </span>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] py-1">
              {(['NEW', 'READY', 'RUNNING', 'WAITING', 'TERMINATED'] as ProcessState[]).map((st, i, arr) => {
                const isCurrent = pcb.state === st;
                return (
                  <React.Fragment key={st}>
                    <span
                      className={`px-2 py-1 rounded-sm border uppercase font-bold text-[10px] ${
                        isCurrent
                          ? 'bg-amber-950/50 text-amber-400 border-amber-500 shadow-sm'
                          : 'bg-[#10131b] text-[#4b5563] border-[#1d222f]'
                      }`}
                    >
                      {isCurrent ? `▶ ${st}` : st}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-[#374151]" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Timers & Hardware Execution Registers */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#636d85] uppercase tracking-wider font-bold block">
              EXECUTION TIMERS & REGISTERS
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Arrival Time</span>
                <span className="text-white font-bold">{pcb.arrivalTime} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Actual Burst</span>
                <span className="text-white font-bold">{pcb.burstTime} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Remaining Burst</span>
                <span className="text-amber-400 font-bold">{pcb.remainingBurst} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">CPU Time Used</span>
                <span className="text-emerald-400 font-bold">{pcb.cpuTimeUsed} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Waiting Time</span>
                <span className="text-yellow-400 font-bold">{pcb.waitingTime} ms</span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Turnaround Time</span>
                <span className="text-purple-400 font-bold">
                  {pcb.turnaroundTime > 0 ? `${pcb.turnaroundTime} ms` : '--'}
                </span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Response Time</span>
                <span className="text-teal-400 font-bold">
                  {pcb.responseTime >= 0 ? `${pcb.responseTime} ms` : '--'}
                </span>
              </div>

              <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
                <span className="text-[9px] text-[#636d85] block uppercase">Effective Priority</span>
                <span className="text-white font-bold">
                  {pcb.effectivePriority} {pcb.agingCount > 0 && `(Aged ${pcb.agingCount}x)`}
                </span>
              </div>
            </div>
          </div>

          {/* Burst Prediction & Statistical History */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#636d85] uppercase tracking-wider font-bold block">
              BURST PREDICTOR & STATISTICAL METRICS
            </span>

            <div className="bg-[#090b0f] border border-[#181c26] p-4 rounded-sm space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-[#636d85] uppercase block">Predicted Next τ</span>
                  <span className="text-base font-bold text-[#38bdf8]">{pcb.prediction} ms</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#636d85] uppercase block">Prediction Confidence</span>
                  <span className={`text-base font-bold ${pcb.predictionConfidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {pcb.predictionConfidence}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#636d85] uppercase block mb-1.5">
                  Observed Historical Bursts Sequence [t0 &rarr; tn]:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {pcb.burstHistory && pcb.burstHistory.length > 0 ? (
                    pcb.burstHistory.map((b, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded-sm bg-[#121620] border border-[#212738] text-[10px] text-[#c0c7d6] shrink-0"
                      >
                        <span className="text-[8px] text-[#636d85] block">t{idx}</span>
                        <span className="font-bold text-white">{b}ms</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-[#4b5563]">NO PRIOR HISTORY LOGGED</span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0 mx-1" />
                  <div className="px-2 py-1 rounded-sm bg-amber-950/40 border border-amber-500/50 text-amber-400 text-[10px] shrink-0 font-bold">
                    <span className="text-[8px] text-amber-500/70 block">τ(next)</span>
                    <span>{pcb.prediction}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1c2230] pt-4 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-[#161a24] hover:bg-[#1f2535] text-white text-xs uppercase font-bold border border-[#262c3b] transition-colors"
          >
            DISMISS PANEL
          </button>
        </div>
      </div>
    </div>
  );
}
