'use client';

import React, { useState } from 'react';
import { GanttSegment } from '../lib/types';
import { Clock, ZoomIn, ZoomOut, Layers, Info } from 'lucide-react';

interface GanttChartProps {
  segments: GanttSegment[];
  totalTime?: number;
  currentTime?: number;
  title?: string;
  onSelectProcess?: (pid: string) => void;
  selectedPid?: string;
}

// Technical graphite/amber color assignment for process IDs
const PID_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  P1: { bg: 'bg-[#1e293b]', text: 'text-amber-400', border: 'border-amber-500/60' },
  P2: { bg: 'bg-[#1f2e2b]', text: 'text-emerald-400', border: 'border-emerald-500/60' },
  P3: { bg: 'bg-[#2b2416]', text: 'text-amber-300', border: 'border-amber-400/60' },
  P4: { bg: 'bg-[#251e33]', text: 'text-purple-300', border: 'border-purple-400/60' },
  P5: { bg: 'bg-[#331c24]', text: 'text-rose-300', border: 'border-rose-400/60' },
  P6: { bg: 'bg-[#182833]', text: 'text-cyan-300', border: 'border-cyan-400/60' },
  P7: { bg: 'bg-[#192b23]', text: 'text-teal-300', border: 'border-teal-400/60' },
  P8: { bg: 'bg-[#20202e]', text: 'text-indigo-300', border: 'border-indigo-400/60' },
  P9: { bg: 'bg-[#2b2118]', text: 'text-orange-300', border: 'border-orange-400/60' },
  P10: { bg: 'bg-[#2b1928]', text: 'text-pink-300', border: 'border-pink-400/60' },
  IDLE: { bg: 'bg-[#12141a]', text: 'text-[#4b5563]', border: 'border-[#262c3a] border-dashed' },
};

function getPidStyle(pid: string) {
  if (PID_STYLES[pid]) return PID_STYLES[pid];
  return { bg: 'bg-[#171b24]', text: 'text-[#a4b1cd]', border: 'border-[#2a3244]' };
}

export default function GanttChart({
  segments,
  totalTime,
  currentTime,
  title = "CPU EXECUTION TIMELINE",
  onSelectProcess,
  selectedPid,
}: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const maxSpan = totalTime || (segments.length > 0 ? segments[segments.length - 1].endTime : 0);

  const baseUnitPx = 14 * zoomLevel;

  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#181c26] gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <h3 className="font-bold text-white tracking-wider text-xs uppercase">{title}</h3>
          <span className="text-[10px] text-[#636d85]">
            [ TOTAL: <span className="text-white">{maxSpan}ms</span> ]
          </span>
          {currentTime !== undefined && (
            <span className="text-[10px] text-[#636d85]">
              [ CLOCK: <span className="text-amber-400">{currentTime}ms</span> ]
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#12151c] border border-[#1e2330] rounded-sm p-0.5">
          <span className="text-[10px] text-[#636d85] px-1.5 uppercase">ZOOM</span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
            className="p-1 hover:bg-[#1a1e28] text-[#8e99b0] hover:text-white rounded-sm transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-white px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
            className="p-1 hover:bg-[#1a1e28] text-[#8e99b0] hover:text-white rounded-sm transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
      </div>

      {segments.length === 0 ? (
        <div className="py-10 text-center text-[#4b5563] text-xs">
          CPU IDLE. NO TIMELINE DATA RECORDED.
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 pt-1">
          <div className="relative inline-block min-w-full">
            {/* Live Vertical Cursor Indicator */}
            {currentTime !== undefined && maxSpan > 0 && (
              <div
                style={{
                  left: `${(currentTime / maxSpan) * 100}%`,
                }}
                className="absolute top-0 bottom-6 w-[2px] bg-amber-400 z-20 pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              >
                <div className="absolute -top-3.5 -left-3 px-1 py-0.2 rounded bg-amber-500 text-black font-bold text-[9px] uppercase tracking-tighter">
                  {currentTime}ms
                </div>
              </div>
            )}

            {/* Timeline Bar Strip */}
            <div className="flex items-center h-12 bg-[#090b0f] border border-[#181c26] rounded-sm p-1">
              {segments.map((seg, idx) => {
                const style = getPidStyle(seg.pid);
                const isSelected = selectedPid && selectedPid === seg.pid;
                const minWidth = Math.max(34, Math.round(seg.duration * baseUnitPx));

                return (
                  <div
                    key={`${seg.pid}-${seg.startTime}-${idx}`}
                    onClick={() => seg.pid !== 'IDLE' && onSelectProcess && onSelectProcess(seg.pid)}
                    style={{ minWidth: `${minWidth}px` }}
                    className={`relative group h-full flex flex-col items-center justify-center rounded-sm border px-1 transition-all mx-0.5 cursor-pointer ${style.bg} ${style.border} ${
                      isSelected ? 'ring-1 ring-amber-400 brightness-125' : 'hover:brightness-110'
                    }`}
                  >
                    <span className={`text-[11px] font-bold tracking-tight ${style.text}`}>
                      {seg.pid}
                    </span>
                    <span className="text-[9px] text-[#636d85]">
                      {seg.duration}ms
                    </span>

                    {/* Precise Hover Detail Tooltip */}
                    <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-start z-30 p-2 rounded-sm bg-[#10131b] border border-[#262c3b] shadow-2xl text-[10px] whitespace-nowrap pointer-events-none">
                      <div className="flex items-center gap-2 border-b border-[#1c2230] pb-1 w-full text-white font-bold">
                        <span className={`px-1.5 py-0.2 rounded-sm text-[9px] ${style.bg} ${style.text}`}>
                          {seg.pid}
                        </span>
                        <span>t = {seg.startTime}ms &rarr; {seg.endTime}ms ({seg.duration}ms)</span>
                      </div>
                      <span className="text-[#8e99b0] mt-1 max-w-xs break-words font-sans">
                        {seg.reason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Millisecond Axis Ticks */}
            <div className="relative flex justify-between text-[10px] text-[#4b5563] pt-2 px-1">
              <span>0ms</span>
              {segments.map((seg, idx) => (
                <span key={`tick-${idx}`} className="text-[#636d85]">
                  {seg.endTime}ms
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
