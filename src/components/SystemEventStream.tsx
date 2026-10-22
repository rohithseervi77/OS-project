'use client';

import React, { useRef, useEffect } from 'react';
import { SimulationEvent } from '../lib/simulation/events';
import { Terminal } from 'lucide-react';

interface SystemEventStreamProps {
  events: SimulationEvent[];
  maxHeight?: string;
}

export default function SystemEventStream({ events, maxHeight = "h-48" }: SystemEventStreamProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Format timestamp into terminal clock HH:MM:SS or simulation time
  const formatTime = (t: number) => {
    const totalSecs = Math.floor(t / 1000);
    const ms = (t % 1000).toString().padStart(3, '0');
    return `+${t.toFixed(0).padStart(4, '0')}ms`;
  };

  const getTagStyle = (type: string) => {
    switch (type) {
      case 'PROCESS_ARRIVAL':
        return 'text-[#38bdf8]';
      case 'CPU_START':
        return 'text-emerald-400 font-bold';
      case 'CPU_PREEMPT':
        return 'text-amber-400 font-bold';
      case 'CPU_COMPLETE':
        return 'text-purple-400';
      case 'CONTEXT_SWITCH':
        return 'text-rose-400';
      default:
        return 'text-[#8e99b0]';
    }
  };

  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#181c26] mb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            SYSTEM EVENT STREAM
          </span>
        </div>
        <span className="text-[10px] text-[#636d85]">
          [ EVENTS: <span className="text-white">{events.length}</span> ]
        </span>
      </div>

      <div
        ref={containerRef}
        className={`${maxHeight} overflow-y-auto pr-1 space-y-1 select-text`}
      >
        {events.length === 0 ? (
          <div className="py-8 text-center text-[#4b5563]">
            TERMINAL STANDBY &bull; AWAITING KERNEL SIGNALS
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 py-0.5 px-1 rounded-sm hover:bg-[#121620] transition-colors leading-relaxed"
            >
              <span className="text-[#4b5563] shrink-0 font-mono text-[11px]">
                {formatTime(ev.time)}
              </span>
              <span className={`shrink-0 text-[11px] uppercase ${getTagStyle(ev.type)}`}>
                [{ev.pid}]
              </span>
              <span className="text-[#c0c7d6] text-[11px] break-words">
                {ev.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
