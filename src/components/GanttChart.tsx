'use client';

import React, { useState } from 'react';
import { GanttSegment } from '../lib/types';
import { ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface GanttChartProps {
  segments: GanttSegment[];
  totalTime?: number;
  currentTime?: number;
  title?: string;
  onSelectProcess?: (pid: string) => void;
  selectedPid?: string;
}

// Consistent dark graphite & restrained status color assignments for processes
const PID_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  P1: { bg: 'bg-[#1b2333]', text: 'text-amber-400', border: 'border-amber-500/50' },
  P2: { bg: 'bg-[#162723]', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  P3: { bg: 'bg-[#292317]', text: 'text-amber-300', border: 'border-amber-400/50' },
  P4: { bg: 'bg-[#201c2e]', text: 'text-purple-300', border: 'border-purple-400/50' },
  P5: { bg: 'bg-[#2e1921]', text: 'text-rose-300', border: 'border-rose-400/50' },
  P6: { bg: 'bg-[#16242e]', text: 'text-cyan-300', border: 'border-cyan-400/50' },
  P7: { bg: 'bg-[#172721]', text: 'text-teal-300', border: 'border-teal-400/50' },
  P8: { bg: 'bg-[#1d1d2b]', text: 'text-indigo-300', border: 'border-indigo-400/50' },
  P9: { bg: 'bg-[#2a2016]', text: 'text-orange-300', border: 'border-orange-400/50' },
  P10: { bg: 'bg-[#2a1727]', text: 'text-pink-300', border: 'border-pink-400/50' },
  IDLE: { bg: 'bg-[#101216]', text: 'text-[#6e7681]', border: 'border-[#21262d] border-dashed' },
};

function getStyle(pid: string) {
  if (PID_COLORS[pid]) return PID_COLORS[pid];
  return { bg: 'bg-[#161b22]', text: 'text-[#c9d1d9]', border: 'border-[#30363d]' };
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
  const maxSpan = Math.max(
    totalTime || 0,
    currentTime || 0,
    segments.length > 0 ? segments[segments.length - 1].endTime : 0
  );

  // Each millisecond has a base pixel width scaled by zoom
  const pxPerMs = Math.max(12, Math.round(18 * zoomLevel));

  return (
    <div className="w-full bg-[#13171d] border border-[#21262d] font-mono text-xs shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d] gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-amber-500" />
          <h3 className="font-bold text-[#f3f4f6] tracking-wider text-[11px] uppercase">
            {title}
          </h3>
          <span className="text-[10px] text-[#8b949e]">
            [ SPAN: <span className="text-[#f3f4f6] font-bold">{maxSpan}ms</span> ]
          </span>
          {currentTime !== undefined && (
            <span className="text-[10px] text-[#8b949e]">
              [ CLOCK: <span className="text-amber-400 font-bold">{currentTime.toFixed(2)}ms</span> ]
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#0d0f12] border border-[#21262d] px-1 py-0.5">
          <span className="text-[9px] text-[#6e7681] px-1 uppercase">SCALE:</span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
            className="p-1 hover:bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="text-[9px] text-[#f3f4f6] px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="p-1 hover:bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="p-3">
        {segments.length === 0 ? (
          <div className="py-10 text-center text-[#6e7681] border border-dashed border-[#21262d] bg-[#0d0f12]">
            <span className="text-xs uppercase font-bold text-[#8b949e]">SIMULATION READY</span>
            <p className="text-[10px] text-[#484f58] mt-1">
              EXECUTION TIMELINE RECORDING WILL BEGIN ON FIRST CLOCK TICK
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 pt-1">
            <div className="relative inline-block min-w-full">
              {/* Moving Vertical Amber Cursor Line */}
              {currentTime !== undefined && maxSpan > 0 && (
                <div
                  style={{
                    left: `${currentTime * pxPerMs}px`,
                  }}
                  className="absolute top-0 bottom-6 w-[2px] bg-amber-400 z-30 pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(245,158,11,0.9)]"
                >
                  <div className="absolute -top-3 -left-2 text-[8px] bg-amber-500 text-black font-black px-1 leading-tight select-none">
                    ▼
                  </div>
                </div>
              )}

              {/* Execution Block Rail */}
              <div className="flex items-center h-16 border-b border-[#21262d] bg-[#0d0f12] relative">
                {segments.map((seg, i) => {
                  const style = getStyle(seg.pid);
                  const isSelected = selectedPid === seg.pid;
                  const widthPx = Math.max(28, seg.duration * pxPerMs);
                  const isPreviousDifferent = i > 0 && segments[i - 1].pid !== seg.pid;

                  return (
                    <div
                      key={`${seg.pid}-${seg.startTime}-${i}`}
                      onClick={() => seg.pid !== 'IDLE' && onSelectProcess && onSelectProcess(seg.pid)}
                      style={{ width: `${widthPx}px` }}
                      className={`relative h-12 flex flex-col justify-center items-center border transition-all cursor-pointer shrink-0 ${style.bg} ${style.border} ${
                        isSelected ? 'ring-2 ring-amber-400 z-10' : 'hover:brightness-125'
                      }`}
                    >
                      {/* Context Switch Marker */}
                      {isPreviousDifferent && (
                        <div
                          className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-amber-500/80 z-20"
                          title="Context Switch"
                        />
                      )}

                      <span className={`font-black text-xs tracking-wider ${style.text}`}>
                        {seg.pid}
                      </span>
                      <span className="text-[9px] text-[#8b949e] font-mono leading-none mt-0.5">
                        {seg.duration}ms
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Time Ruler Axis */}
              <div className="flex relative h-6 text-[9px] text-[#6e7681] pt-1">
                {segments.map((seg, i) => {
                  const widthPx = Math.max(28, seg.duration * pxPerMs);
                  return (
                    <div
                      key={`axis-${i}`}
                      style={{ width: `${widthPx}px` }}
                      className="relative border-l border-[#21262d] pl-0.5 shrink-0"
                    >
                      <span className="select-none">{seg.startTime}ms</span>
                    </div>
                  );
                })}
                {/* Last timestamp marker */}
                {segments.length > 0 && (
                  <div className="border-l border-[#21262d] pl-0.5 shrink-0">
                    <span className="select-none">{segments[segments.length - 1].endTime}ms</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
