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
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-amber-500" />
          <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">
            READY QUEUE // SCHEDULING DISPATCH RAIL
          </span>
          <span className="text-[10px] text-[#8b949e]">
            [ DEPTH: <span className="text-amber-400 font-bold">{queue.length}</span> ]
          </span>
        </div>
        <span className="text-[9px] text-[#6e7681] uppercase">
          HEAD (NEXT DISPATCH) → TAIL
        </span>
      </div>

      <div className="p-3">
        {queue.length === 0 ? (
          <div className="py-6 text-center text-[#6e7681] border border-dashed border-[#21262d] bg-[#0d0f12]">
            <span className="text-xs uppercase font-bold text-[#8b949e]">READY QUEUE EMPTY</span>
            <p className="text-[10px] text-[#484f58] mt-0.5">
              NO PROCESSES PENDING DISPATCH IN RUNQUEUE
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1">
            {queue.map((proc, idx) => {
              const isSelected = selectedPid === proc.pid;
              return (
                <React.Fragment key={proc.pid}>
                  <div
                    onClick={() => onSelectProcess && onSelectProcess(proc.pid)}
                    className={`flex flex-col min-w-[105px] p-2 border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1c2230] border-amber-400 ring-1 ring-amber-400 text-white'
                        : 'bg-[#0d0f12] border-[#21262d] hover:border-[#384158] hover:bg-[#161b22]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-[#1c2128] pb-1">
                      <span className="font-bold text-amber-400 tracking-wider text-xs">
                        {proc.pid}
                      </span>
                      <span className="text-[9px] text-[#8b949e] font-semibold">
                        PRI:{proc.effectivePriority}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#38bdf8] font-bold mt-1">
                      τ: {proc.prediction}ms
                    </div>
                    <div className="text-[9px] text-[#8b949e] mt-0.5">
                      REM: {proc.remainingBurst}ms
                    </div>
                    <div className="text-[8px] text-[#6e7681] mt-0.5">
                      WAIT: {proc.waitingTime}ms
                    </div>
                  </div>

                  {idx < queue.length - 1 && (
                    <span className="text-[#484f58] font-mono select-none text-xs px-0.5">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
