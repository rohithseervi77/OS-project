'use client';

import React, { useState } from 'react';
import { PCB, Process, ProcessState } from '../lib/types';
import PCBModal from './PCBModal';
import { createPCB } from '../lib/pcb';
import { Eye, Clock, Hash, Cpu, Layers } from 'lucide-react';

interface ProcessTableProps {
  processes: Process[] | PCB[];
  title?: string;
  onSelectProcess?: (pid: string) => void;
}

export default function ProcessTable({ processes, title = "PROCESS MONITOR TABLE", onSelectProcess }: ProcessTableProps) {
  const [selectedPCB, setSelectedPCB] = useState<PCB | null>(null);

  const stateBadges: Record<ProcessState, { label: string; style: string }> = {
    RUNNING: { label: 'RUNNING', style: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50 font-bold' },
    READY: { label: 'READY', style: 'text-amber-400 bg-amber-950/40 border-amber-500/50 font-bold' },
    WAITING: { label: 'WAITING', style: 'text-[#38bdf8] bg-sky-950/40 border-sky-500/50' },
    TERMINATED: { label: 'TERMINATED', style: 'text-[#6b7280] bg-[#12151c] border-[#232938]' },
    NEW: { label: 'NEW', style: 'text-[#9ca3af] bg-[#12151c] border-[#232938]' },
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
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] shadow-xl overflow-hidden font-mono text-xs">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2.5 border-b border-[#181c26] bg-[#090b0f] gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">{title}</h3>
          <span className="text-[10px] text-[#636d85]">
            [ ACTIVE PROCESS ENTRIES: <span className="text-white font-bold">{processes.length}</span> ]
          </span>
        </div>
        <span className="text-[10px] text-[#4b5563] uppercase">
          CLICK ROW TO OPEN PROCESS PCB DETAIL PANEL
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1a1f2c] bg-[#0d1017] text-[#636d85] text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">PID</th>
              <th className="py-2.5 px-3">STATE</th>
              <th className="py-2.5 px-3">ARRIVAL</th>
              <th className="py-2.5 px-3">BURST</th>
              <th className="py-2.5 px-3">REMAINING</th>
              <th className="py-2.5 px-3">PRIORITY</th>
              <th className="py-2.5 px-3">PREDICTION</th>
              <th className="py-2.5 px-3">CONFIDENCE</th>
              <th className="py-2.5 px-3">WAIT</th>
              <th className="py-2.5 px-3 text-right">INSPECT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151922] font-mono text-[11px]">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#4b5563]">
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
                    className="hover:bg-[#121622] cursor-pointer transition-colors group"
                  >
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded-sm bg-[#181d28] border border-[#273042] text-amber-400 font-bold text-[10px]">
                        {p.pid}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-[#c0c7d6]">{p.arrivalTime}ms</td>

                    <td className="py-2 px-3 text-white font-bold">{p.burstTime}ms</td>

                    <td className="py-2 px-3 text-amber-400 font-bold">{remaining}ms</td>

                    <td className="py-2 px-3 text-[#c0c7d6]">
                      {'effectivePriority' in p && (p as PCB).effectivePriority !== p.priority ? (
                        <span>
                          <span className="text-amber-400 font-bold">P{(p as PCB).effectivePriority}</span>{' '}
                          <span className="text-[10px] text-[#4b5563] line-through">(P{p.priority})</span>
                        </span>
                      ) : (
                        `P${p.priority}`
                      )}
                    </td>

                    <td className="py-2 px-3 text-[#38bdf8] font-bold">
                      {pred !== undefined ? `${pred}ms` : '--'}
                    </td>

                    <td className="py-2 px-3">
                      <span className={`text-[10px] ${
                        (conf ?? 0) >= 80 ? 'text-emerald-400 font-bold' : (conf ?? 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {conf !== undefined ? `${conf}%` : '--'}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-yellow-400">{wait}ms</td>

                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p);
                        }}
                        className="px-2 py-0.5 rounded-sm bg-[#141822] hover:bg-[#1f2535] text-[#8e99b0] hover:text-white border border-[#232938] text-[10px] uppercase font-bold"
                      >
                        VIEW PCB
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PCB Modal / Side Panel */}
      <PCBModal pcb={selectedPCB} onClose={() => setSelectedPCB(null)} />
    </div>
  );
}
