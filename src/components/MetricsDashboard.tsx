'use client';

import React from 'react';
import { SchedulerMetrics } from '../lib/types';
import { Clock, Cpu, Activity, ShieldCheck, Repeat, TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: SchedulerMetrics;
  algorithmName?: string;
}

export default function MetricsDashboard({ metrics, algorithmName }: MetricsDashboardProps) {
  return (
    <div className="w-full rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 font-mono text-xs shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#181c26]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            TELEMETRY & HARDWARE PERFORMANCE METRICS {algorithmName ? `[${algorithmName}]` : ''}
          </span>
        </div>
        <span className="text-[10px] text-[#636d85] uppercase">DISCRETE SAMPLING</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Mean Queue Wait (WT)</span>
          <span className="text-lg font-bold text-yellow-400 mt-0.5 block">{metrics.avgWaitingTime} ms</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Mean Response Time (RT)</span>
          <span className="text-lg font-bold text-[#38bdf8] mt-0.5 block">{metrics.avgResponseTime} ms</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Mean Turnaround (TAT)</span>
          <span className="text-lg font-bold text-purple-400 mt-0.5 block">{metrics.avgTurnaroundTime} ms</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Jain&apos;s Fairness Index</span>
          <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{metrics.fairness.toFixed(3)}</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Core Utilization</span>
          <span className="text-lg font-bold text-white mt-0.5 block">{metrics.cpuUtilization}%</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Throughput</span>
          <span className="text-lg font-bold text-amber-400 mt-0.5 block">{metrics.throughput} /100ms</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Context Switches</span>
          <span className="text-lg font-bold text-rose-400 mt-0.5 block">{metrics.contextSwitches}</span>
        </div>

        <div className="p-3 bg-[#090b0f] border border-[#181c26] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Starvation Counter</span>
          <span className={`text-lg font-bold mt-0.5 block ${metrics.starvationCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {metrics.starvationCount}
          </span>
        </div>
      </div>
    </div>
  );
}
