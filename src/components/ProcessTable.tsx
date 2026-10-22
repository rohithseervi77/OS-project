'use client';

import React, { useState } from 'react';
import { PCB, Process, ProcessState } from '../lib/types';
import PCBModal from './PCBModal';
import { createPCB } from '../lib/pcb';

interface ProcessTableProps {
  processes: Process[] | PCB[];
  title?: string;
  onSelectProcess?: (pid: string) => void;
}

export default function ProcessTable({
  processes,
  title = "PROCESS MONITOR TABLE",
  onSelectProcess,
}: ProcessTableProps) {
  const [selectedPCB, setSelectedPCB] = useState<PCB | null>(null);

  const stateBadges: Record<ProcessState, { label: string; style: string }> = {
    RUNNING: { label: 'RUNNING', style: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50 font-bold' },
    READY: { label: 'READY', style: 'text-amber-400 bg-amber-950/40 border-amber-500/50 font-bold' },
    WAITING: { label: 'WAITING', style: 'text-[#38bdf8] bg-sky-950/40 border-sky-500/50' },
    TERMINATED: { label: 'TERMINATED', style: 'text-[#6e7681] bg-[#161b22] border-[#21262d]' },
    NEW: { label: 'NEW', style: 'text-[#8b949e] bg-[#161b22] border-[#21262d]' },
  };

  const handleRowClick = (item: Process | PCB) => {
    let pcb: PCB;
    if ('remainingBurst' in item && 'cpuTimeUsed' in item) {
      pcb = item as PCB;
    } else {
      pcb = createPCB(item as Process);
    }
    setSelectedPCB(pcb);
    if (onSelectProcess) onSelectProcess(pcb.pid);
  };

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] shadow-xl overflow-hidden font-mono text-xs">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 py-2 border-b border-[#21262d] bg-[#0e1116] gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-amber-500" />
          <h3 className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">{title}</h3>
          <span className="text-[10px] text-[#8b949e]">
            [ LOADED: <span className="text-[#f3f4f6] font-bold">{processes.length}</span> ]
          </span>
        </div>
        <span className="text-[9px] text-[#6e7681] uppercase">
          CLICK ANY ROW TO OPEN RIGHT-SIDE PCB INSPECTOR
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#0d0f12] text-[#8b949e] text-[9px] uppercase font-bold tracking-wider">
              <th className="py-2 px-3">PID</th>
              <th className="py-2 px-3">STATE</th>
              <th className="py-2 px-3">ARRIVAL</th>
              <th className="py-2 px-3">BURST</th>
              <th className="py-2 px-3">REMAINING</th>
              <th className="py-2 px-3">PRIORITY</th>
              <th className="py-2 px-3">PREDICTION</th>
              <th className="py-2 px-3">CONFIDENCE</th>
              <th className="py-2 px-3">WAIT</th>
              <th className="py-2 px-3 text-right">INSPECT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c2128] font-mono text-[11px]">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#6e7681] bg-[#0d0f12]">
                  NO PROCESSES LOADED &bull; SELECT A WORKLOAD SCENARIO OR GENERATE PROCESSES
                </td>
              </tr>
            ) : (
              processes.map((p) => {
                const remaining = 'remainingBurst' in p ? p.remainingBurst : p.burstTime;
                const state: ProcessState = p.state || 'NEW';
                const pred = 'predictedBurst' in p ? p.predictedBurst : ('prediction' in p ? (p as PCB).prediction : p.burstTime);
                const conf = 'confidence' in p ? p.confidence : ('predictionConfidence' in p ? (p as PCB).predictionConfidence : 100);
                const wait = 'waitingTime' in p ? (p as PCB).waitingTime : 0;
                const badge = stateBadges[state] || stateBadges.NEW;

                return (
                  <tr
                    key={p.pid}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-[#161b22] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {p.pid}
                    </td>

                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.2 text-[9px] uppercase tracking-wider border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-[#c9d1d9]">
                      {p.arrivalTime}ms
                    </td>

                    <td className="py-2 px-3 font-semibold text-[#f3f4f6]">
                      {p.burstTime}ms
                    </td>

                    <td className="py-2 px-3 font-bold text-amber-400">
                      {remaining}ms
                    </td>

                    <td className="py-2 px-3 text-[#c9d1d9]">
                      {p.priority}
                    </td>

                    <td className="py-2 px-3 font-bold text-[#38bdf8]">
                      {pred}ms
                    </td>

                    <td className="py-2 px-3 font-semibold text-emerald-400">
                      {conf}%
                    </td>

                    <td className="py-2 px-3 text-amber-300">
                      {wait}ms
                    </td>

                    <td className="py-2 px-3 text-right">
                      <span className="px-1.5 py-0.5 border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white text-[9px] uppercase">
                        PCB &rarr;
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedPCB && (
        <PCBModal pcb={selectedPCB} onClose={() => setSelectedPCB(null)} />
      )}
    </div>
  );
}
