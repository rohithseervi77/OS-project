'use client';

import React from 'react';
import { PCB } from '../lib/types';
import { ArrowRight, Layers } from 'lucide-react';

interface ReadyQueueProps {
  queue: PCB[];
  onSelectProcess?: (pid: string) => void;
  selectedPid?: string | null;
}

export default function ReadyQueue({ queue, onSelectProcess, selectedPid }: ReadyQueueProps) {
  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#181c26] mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            OS READY QUEUE
          </span>
          <span className="text-[10px] text-[#636d85]">
            [ DEPTH: <span className="text-amber-400 font-bold">{queue.length}</span> ]
          </span>
        </div>
        <span className="text-[10px] text-[#4b5563] uppercase">
          DISPATCH ORDER: HEAD &rarr; TAIL
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="py-6 text-center text-[#4b5563] text-xs">
          READY QUEUE EMPTY &bull; NO PROCESSES PENDING DISPATCH
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
          {queue.map((proc, idx) => {
            const isSelected = selectedPid === proc.pid;
            return (
              <React.Fragment key={proc.pid}>
                <div
                  onClick={() => onSelectProcess && onSelectProcess(proc.pid)}
                  className={`flex flex-col min-w-[96px] p-2 rounded-sm border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1e2536] border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-[#10131a] border-[#222736] hover:border-[#384158] hover:bg-[#141822]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white tracking-wider">{proc.pid}</span>
                    <span className="text-[9px] text-[#636d85]">P{proc.effectivePriority}</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-bold mt-1">
                    τ: {proc.prediction}ms
                  </div>
                  <div className="text-[9px] text-[#636d85] mt-0.5">
                    Rem: {proc.remainingBurst}ms
                  </div>
                </div>

                {idx < queue.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
