'use client';

import React from 'react';
import { PCB, ProcessState } from '../lib/types';
import { X, ArrowRight } from 'lucide-react';

interface PCBModalProps {
  pcb: PCB | null;
  onClose: () => void;
}

export default function PCBModal({ pcb, onClose }: PCBModalProps) {
  if (!pcb) return null;

  const stateColors: Record<ProcessState, string> = {
    RUNNING: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50 font-bold',
    READY: 'text-amber-400 bg-amber-950/50 border-amber-500/50 font-bold',
    WAITING: 'text-[#38bdf8] bg-sky-950/50 border-sky-500/50 font-bold',
    TERMINATED: 'text-[#6b7280] bg-[#161b22] border-[#30363d]',
    NEW: 'text-[#9ca3af] bg-[#161b22] border-[#30363d]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs p-0 font-mono text-xs">
      <div className="relative w-full max-w-lg h-full border-l border-[#21262d] bg-[#0d0f12] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 bg-[#161b22] border border-[#30363d] text-amber-400 font-bold text-sm">
                {pcb.pid}
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider">
                  {pcb.pid} — PROCESS CONTROL BLOCK
                </h3>
                <span className="text-[10px] text-[#8b949e]">
                  TYPE: {pcb.processType} // EFFECTIVE PRI: {pcb.effectivePriority}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[9px] uppercase border ${stateColors[pcb.state]}`}>
                {pcb.state}
              </span>
              <button
                onClick={onClose}
                className="p-1 text-[#8b949e] hover:text-[#f3f4f6] hover:bg-[#161b22] transition-colors"
                title="Close Inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* State Transition Sequence: NEW → READY → RUNNING → WAITING → READY → TERMINATED */}
          <div className="border border-[#21262d] bg-[#13171d] p-3 space-y-2">
            <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-wider block">
              STATE HISTORY TRANSITION PIPELINE
            </span>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] py-1">
              {(['NEW', 'READY', 'RUNNING', 'WAITING', 'TERMINATED'] as ProcessState[]).map((st, i, arr) => {
                const isCurrent = pcb.state === st;
                return (
                  <React.Fragment key={st}>
                    <span
                      className={`px-2 py-0.5 border uppercase font-mono font-bold ${
                        isCurrent
                          ? 'bg-amber-950/60 text-amber-400 border-amber-500 shadow-sm'
                          : 'bg-[#0d0f12] text-[#6e7681] border-[#21262d]'
                      }`}
                    >
                      {isCurrent ? `▶ ${st}` : st}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-[#484f58] select-none text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* PCB Parameters Grid */}
          <div className="space-y-2">
            <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-wider block">
              HARDWARE TIMERS & PROCESS REGISTERS
            </span>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">PROCESS ID</span>
                <span className="text-[#f3f4f6] font-bold text-xs">{pcb.pid}</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">CURRENT STATE</span>
                <span className="text-amber-400 font-bold">{pcb.state}</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">ARRIVAL TIME</span>
                <span className="text-[#f3f4f6] font-bold">{pcb.arrivalTime} ms</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">INITIAL BURST TIME</span>
                <span className="text-[#f3f4f6] font-bold">{pcb.burstTime} ms</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">REMAINING BURST</span>
                <span className="text-amber-400 font-bold">{pcb.remainingBurst} ms</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">PRIORITY (BASE / EFFECTIVE)</span>
                <span className="text-[#f3f4f6] font-bold">{pcb.priority} / {pcb.effectivePriority}</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">PREDICTED BURST (τ)</span>
                <span className="text-[#38bdf8] font-bold">{pcb.prediction} ms</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">PREDICTION CONFIDENCE</span>
                <span className="text-emerald-400 font-bold">{pcb.predictionConfidence}%</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">WAITING TIME</span>
                <span className="text-[#f3f4f6] font-bold">{pcb.waitingTime} ms</span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d]">
                <span className="text-[9px] text-[#6e7681] block uppercase">RESPONSE TIME</span>
                <span className="text-[#f3f4f6] font-bold">
                  {pcb.responseTime !== undefined && pcb.responseTime >= 0 ? `${pcb.responseTime} ms` : 'PENDING'}
                </span>
              </div>

              <div className="p-2.5 bg-[#13171d] border border-[#21262d] col-span-2">
                <span className="text-[9px] text-[#6e7681] block uppercase">TURNAROUND TIME</span>
                <span className="text-amber-400 font-bold">
                  {pcb.turnaroundTime !== undefined && pcb.turnaroundTime > 0 ? `${pcb.turnaroundTime} ms` : 'IN EXECUTION'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#21262d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#f3f4f6] font-bold uppercase transition-colors"
          >
            DISMISS INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
}
