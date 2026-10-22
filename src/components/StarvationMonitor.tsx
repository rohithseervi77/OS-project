'use client';

import React from 'react';
import { PCB } from '../lib/types';
import { ShieldAlert, ArrowUp } from 'lucide-react';

interface StarvationMonitorProps {
  readyQueue: PCB[];
  agingThreshold?: number;
  onSelectProcess?: (pid: string) => void;
}

export default function StarvationMonitor({
  readyQueue,
  agingThreshold = 10,
  onSelectProcess,
}: StarvationMonitorProps) {
  // Sort processes by waiting time descending
  const sorted = [...readyQueue].sort((a, b) => b.waitingTime - a.waitingTime);

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-rose-500" />
          <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">
            STARVATION & AGING TELEMETRY
          </span>
        </div>
        <span className="text-[10px] text-[#8b949e]">
          AGING THRESHOLD: <span className="text-amber-400 font-bold">{agingThreshold}ms</span>
        </span>
      </div>

      <div className="p-3">
        {sorted.length === 0 ? (
          <div className="py-6 text-center text-[#6e7681] border border-dashed border-[#21262d] bg-[#0d0f12]">
            <span className="text-xs uppercase font-bold text-[#8b949e]">NO PROCESSES IN RUNQUEUE</span>
            <p className="text-[10px] text-[#484f58] mt-0.5">
              STARVATION THREAT LEVEL: ZERO
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((p) => {
              const isStarving = p.waitingTime >= agingThreshold * 1.5;
              const hasAged = p.effectivePriority < p.priority;

              return (
                <div
                  key={p.pid}
                  onClick={() => onSelectProcess && onSelectProcess(p.pid)}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border transition-all cursor-pointer ${
                    isStarving
                      ? 'bg-[#1e1315] border-rose-500/60 text-[#f3f4f6]'
                      : 'bg-[#0d0f12] border-[#21262d] text-[#c9d1d9] hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400 text-xs w-10">
                      {p.pid}
                    </span>
                    <span className="text-[10px] text-[#8b949e]">
                      WAIT: <span className={`font-bold ${isStarving ? 'text-rose-400' : 'text-[#f3f4f6]'}`}>{p.waitingTime}ms</span>
                    </span>
                    {isStarving && (
                      <span className="px-1.5 py-0.2 bg-rose-950/80 border border-rose-500/80 text-rose-400 text-[9px] font-black uppercase tracking-wider">
                        ⚠ STARVATION WARNING
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 sm:mt-0 text-[10px]">
                    <span className="text-[#8b949e]">
                      PRIORITY: {p.priority} {hasAged ? `→ ${p.effectivePriority}` : ''}
                    </span>
                    {hasAged && (
                      <span className="px-1.5 py-0.2 bg-amber-950/80 border border-amber-500/80 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                        AGING ACTIVATED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
