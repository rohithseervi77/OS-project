'use client';

import React, { useEffect, useRef } from 'react';
import { SimulationEvent } from '../lib/simulation/events';
import { Terminal } from 'lucide-react';

interface SystemEventStreamProps {
  events: SimulationEvent[];
  maxHeight?: string;
}

export default function SystemEventStream({ events, maxHeight = 'h-48' }: SystemEventStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getTagColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'KERNEL':
        return 'text-purple-400 font-bold';
      case 'SCHED':
      case 'DISPATCH':
      case 'PREEMPT':
        return 'text-amber-400 font-bold';
      case 'PROCESS':
      case 'ARRIVAL':
      case 'COMPLETE':
        return 'text-emerald-400 font-bold';
      case 'PREDICT':
        return 'text-[#38bdf8] font-bold';
      case 'AGING':
        return 'text-rose-400 font-bold';
      case 'CPU':
        return 'text-amber-300 font-bold';
      default:
        return 'text-[#8b949e] font-semibold';
    }
  };

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl flex flex-col">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">
            KERNEL SYSTEM EVENT STREAM
          </span>
          <span className="text-[10px] text-[#8b949e]">
            [ EVENTS: <span className="text-[#f3f4f6] font-bold">{events.length}</span> ]
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#6e7681]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>RING BUFFER LIVE</span>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className={`${maxHeight} overflow-y-auto p-3 space-y-1 bg-[#0a0c0e] text-[11px] leading-relaxed font-mono select-text`}
      >
        {events.length === 0 ? (
          <div className="py-8 text-center text-[#484f58]">
            <span>[00.00] KERNEL STANDBY &bull; AWAITING INITIAL SCHEDULER DISPATCH</span>
          </div>
        ) : (
          events.map((ev, i) => {
            const eventTime = typeof ev.time === 'number' ? ev.time : 0;
            const timeStr = `[${eventTime.toFixed(2).padStart(5, '0')}]`;
            // Standardize category tag
            let tag = 'KERNEL';
            if (ev.type === 'PROCESS_ARRIVAL') tag = 'PROCESS';
            else if (ev.type === 'SCHEDULE') tag = 'SCHED';
            else if (ev.type === 'CPU_START') tag = 'DISPATCH';
            else if (ev.type === 'CPU_PREEMPT') tag = 'PREEMPT';
            else if (ev.type === 'CPU_COMPLETE') tag = 'COMPLETE';
            else if (ev.type === 'CONTEXT_SWITCH') tag = 'SCHED';
            else if (ev.type === 'PROCESS_TERMINATE') tag = 'PROCESS';
            else if (ev.description.toLowerCase().includes('predict')) tag = 'PREDICT';
            else if (ev.description.toLowerCase().includes('aging') || ev.description.toLowerCase().includes('aged')) tag = 'AGING';
            else if (ev.description.toLowerCase().includes('utilization')) tag = 'CPU';

            return (
              <div key={i} className="flex items-start gap-2 hover:bg-[#11141a] px-1 py-0.5">
                <span className="text-[#6e7681] shrink-0">{timeStr}</span>
                <span className={`shrink-0 w-16 uppercase ${getTagColor(tag)}`}>
                  {tag.padEnd(8, ' ')}
                </span>
                <span className="text-[#c9d1d9] break-all">{ev.description}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
