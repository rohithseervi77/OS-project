'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Play, 
  Layers, 
  Activity 
} from 'lucide-react';

interface AlgorithmDetail {
  id: string;
  code: string;
  name: string;
  type: string;
  preemption: string;
  rule: string;
  complexity: string;
  bestUseCase: string;
  advantage: string;
  problem: string;
  // Execution blocks for P1=8ms, P2=3ms, P3=5ms, P4=2ms
  demoSchedule: { pid: string; start: number; end: number; duration: number }[];
}

const ALGORITHM_SPECS: AlgorithmDetail[] = [
  {
    id: 'FCFS',
    code: 'FCFS',
    name: 'First-Come, First-Served',
    type: 'Non-Preemptive Batch',
    preemption: 'Non-preemptive',
    rule: 'Strict arrival order: min(arrivalTime).',
    complexity: 'O(1) dispatch',
    bestUseCase: 'Batch processing systems with uniform burst times.',
    advantage: 'Simple, zero context switch overhead, no starvation.',
    problem: 'Convoy Effect: Short jobs get delayed behind long CPU-bound tasks.',
    demoSchedule: [
      { pid: 'P1', start: 0, end: 8, duration: 8 },
      { pid: 'P2', start: 8, end: 11, duration: 3 },
      { pid: 'P3', start: 11, end: 16, duration: 5 },
      { pid: 'P4', start: 16, end: 18, duration: 2 },
    ],
  },
  {
    id: 'SJF',
    code: 'SJF',
    name: 'Shortest Job First',
    type: 'Non-Preemptive Optimal',
    preemption: 'Non-preemptive',
    rule: 'Shortest CPU burst: min(burstTime).',
    complexity: 'O(log N) heap or O(N) scan',
    bestUseCase: 'Long-term job scheduling where burst length is known or accurately predictable.',
    advantage: 'Provably optimal minimum average waiting time for stationary processes.',
    problem: 'Starvation of long jobs under high queue arrivals; requires burst prediction.',
    demoSchedule: [
      { pid: 'P4', start: 0, end: 2, duration: 2 },
      { pid: 'P2', start: 2, end: 5, duration: 3 },
      { pid: 'P3', start: 5, end: 10, duration: 5 },
      { pid: 'P1', start: 10, end: 18, duration: 8 },
    ],
  },
  {
    id: 'SRTF',
    code: 'SRTF',
    name: 'Shortest Remaining Time First',
    type: 'Preemptive Optimal',
    preemption: 'Preemptive on Arrival',
    rule: 'Shortest remaining burst: min(remainingBurst).',
    complexity: 'O(log N) event queue',
    bestUseCase: 'Interactive systems with mixed burst lengths where short tasks need immediate execution.',
    advantage: 'Lowest average waiting time; newly arriving short jobs preempt longer tasks instantly.',
    problem: 'Context-switch thrashing if bursts are close; severe starvation of long jobs.',
    demoSchedule: [
      { pid: 'P4', start: 0, end: 2, duration: 2 },
      { pid: 'P2', start: 2, end: 5, duration: 3 },
      { pid: 'P3', start: 5, end: 10, duration: 5 },
      { pid: 'P1', start: 10, end: 18, duration: 8 },
    ],
  },
  {
    id: 'RR',
    code: 'RR',
    name: 'Round Robin',
    type: 'Time-Sharing Preemptive',
    preemption: 'Preemptive on Quantum Expiry',
    rule: 'FIFO queue with fixed time quantum slice (q=3ms).',
    complexity: 'O(1) queue operations',
    bestUseCase: 'General-purpose time-sharing and interactive desktop/server operating systems.',
    advantage: 'Fair CPU allocation, guaranteed response time bounded by (N-1)×q, starvation-free.',
    problem: 'High context switch overhead if quantum is too small; degrades to FCFS if quantum is too large.',
    demoSchedule: [
      { pid: 'P1', start: 0, end: 3, duration: 3 },
      { pid: 'P2', start: 3, end: 6, duration: 3 },
      { pid: 'P3', start: 6, end: 9, duration: 3 },
      { pid: 'P4', start: 9, end: 11, duration: 2 },
      { pid: 'P1', start: 11, end: 14, duration: 3 },
      { pid: 'P3', start: 14, end: 16, duration: 2 },
      { pid: 'P1', start: 16, end: 18, duration: 2 },
    ],
  },
  {
    id: 'PRIORITY',
    code: 'PRIORITY',
    name: 'Priority Scheduling (with Aging)',
    type: 'Preemptive / Non-Preemptive',
    preemption: 'Preemptive with Aging',
    rule: 'Highest priority dispatched first: min(effectivePriority).',
    complexity: 'O(log N) priority queue',
    bestUseCase: 'Real-time or mission-critical systems where urgent tasks supersede background jobs.',
    advantage: 'Ensures critical processes receive CPU time first; dynamic aging mitigates starvation.',
    problem: 'Indefinite blocking (starvation) if aging threshold is set too high or omitted.',
    demoSchedule: [
      { pid: 'P2', start: 0, end: 3, duration: 3 },
      { pid: 'P4', start: 3, end: 5, duration: 2 },
      { pid: 'P3', start: 5, end: 10, duration: 5 },
      { pid: 'P1', start: 10, end: 18, duration: 8 },
    ],
  },
  {
    id: 'MLFQ',
    code: 'MLFQ',
    name: 'Multi-Level Feedback Queue',
    type: 'Adaptive Multi-Queue',
    preemption: 'Preemptive with Demotion',
    rule: 'Multiple priority queues (Q0=2ms, Q1=4ms, Q2=FCFS) with priority boost interval.',
    complexity: 'O(1) per queue',
    bestUseCase: 'Complex modern OS kernels (macOS, Windows, Solaris) balancing interactive vs batch tasks.',
    advantage: 'Learns process characteristics without a priori knowledge; prioritizes I/O and interactive tasks.',
    problem: 'Complex parameter tuning (number of queues, quantums, starvation boost interval).',
    demoSchedule: [
      { pid: 'P1', start: 0, end: 2, duration: 2 },
      { pid: 'P2', start: 2, end: 4, duration: 2 },
      { pid: 'P3', start: 4, end: 6, duration: 2 },
      { pid: 'P4', start: 6, end: 8, duration: 2 },
      { pid: 'P2', start: 8, end: 9, duration: 1 },
      { pid: 'P3', start: 9, end: 12, duration: 3 },
      { pid: 'P1', start: 12, end: 18, duration: 6 },
    ],
  },
  {
    id: 'SMART',
    code: 'SMART',
    name: 'Smart Adaptive Scheduler',
    type: 'Workload-Aware Predictive',
    preemption: 'Dynamically Selected',
    rule: 'Multi-objective utility optimization on workload snapshot + dynamic quantum calibration.',
    complexity: 'O(K · N log N) evaluation of K candidate policies',
    bestUseCase: 'Heterogeneous cloud, container, and dynamically shifting mixed workloads.',
    advantage: 'Autonomously adapts policy and quantum to changing burst distributions; transparent rationale.',
    problem: 'Requires small simulation evaluation overhead before dispatching major workload epochs.',
    demoSchedule: [
      { pid: 'P4', start: 0, end: 2, duration: 2 },
      { pid: 'P2', start: 2, end: 5, duration: 3 },
      { pid: 'P3', start: 5, end: 10, duration: 5 },
      { pid: 'P1', start: 10, end: 18, duration: 8 },
    ],
  },
];

export default function AlgorithmsPage() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('SMART');

  const current = ALGORITHM_SPECS.find(a => a.id === selectedAlgo) || ALGORITHM_SPECS[0];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 font-mono text-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              ALGORITHM LAB // SCHEDULING POLICY MATRIX
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Formal operating systems scheduling taxonomy, theoretical complexities, selection mechanics, and execution visual examples.
          </p>
        </div>

        <Link
          href="/scheduler"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-colors"
        >
          <Play className="h-3 w-3 fill-black" />
          TEST IN CONTROL ROOM
        </Link>
      </div>

      {/* Algorithm Selector Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#13171d] border border-[#21262d]">
        {ALGORITHM_SPECS.map((algo) => (
          <button
            key={algo.id}
            onClick={() => setSelectedAlgo(algo.id)}
            className={`px-3 py-1 font-bold uppercase transition-colors whitespace-nowrap text-xs ${
              selectedAlgo === algo.id
                ? 'bg-amber-500 text-black'
                : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
            }`}
          >
            {algo.id === 'SMART' ? '⚡ SMART SCHEDULER' : algo.code}
          </button>
        ))}
      </div>

      {/* Visual Scheduling Example Section (Section 21) */}
      <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#21262d] pb-2 gap-1">
          <div>
            <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs block">
              VISUAL SCHEDULING EXECUTION EXAMPLE
            </span>
            <span className="text-[10px] text-[#8b949e]">
              STANDARDIZED WORKLOAD: P1 = 8ms, P2 = 3ms, P3 = 5ms, P4 = 2ms (TOTAL: 18ms)
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold uppercase">
            POLICY: {current.name}
          </span>
        </div>

        {/* Visual Execution Order Rail */}
        <div className="p-3 bg-[#0d0f12] border border-[#21262d] space-y-2">
          <span className="text-[9px] text-[#6e7681] uppercase block font-bold">
            COMPUTED EXECUTION ORDER:
          </span>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {current.demoSchedule.map((seg, i) => (
              <div
                key={i}
                style={{ width: `${Math.max(48, seg.duration * 24)}px` }}
                className="h-10 bg-[#161b22] border border-amber-500/50 flex flex-col justify-center items-center text-center shrink-0"
              >
                <span className="font-bold text-amber-400 text-xs">{seg.pid}</span>
                <span className="text-[8px] text-[#8b949e]">{seg.start}–{seg.end}ms</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-[#8b949e] pt-1">
            Execution sequence: {current.demoSchedule.map(s => `${s.pid} (${s.duration}ms)`).join(' → ')}
          </div>
        </div>
      </div>

      {/* Detailed Technical Specification Cards (Section 21) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Properties */}
        <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-3">
          <div className="border-b border-[#21262d] pb-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">{current.code} // SPECIFICATION</span>
            <h2 className="text-sm font-bold text-[#f3f4f6] uppercase tracking-wider">{current.name}</h2>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-[#1c2128]">
              <span className="text-[#8b949e] uppercase text-[10px]">CLASSIFICATION TYPE</span>
              <span className="text-[#f3f4f6] font-bold">{current.type}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#1c2128]">
              <span className="text-[#8b949e] uppercase text-[10px]">PREEMPTION BEHAVIOUR</span>
              <span className="text-amber-400 font-bold">{current.preemption}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#1c2128]">
              <span className="text-[#8b949e] uppercase text-[10px]">TIME COMPLEXITY</span>
              <span className="text-emerald-400 font-bold">{current.complexity}</span>
            </div>

            <div className="py-1 border-b border-[#1c2128]">
              <span className="text-[#8b949e] uppercase text-[10px] block mb-0.5">SELECTION RULE</span>
              <span className="text-[#c9d1d9] font-mono">{current.rule}</span>
            </div>

            <div className="py-1">
              <span className="text-[#8b949e] uppercase text-[10px] block mb-0.5">BEST USE CASE</span>
              <span className="text-[#c9d1d9]">{current.bestUseCase}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Advantages & Problems */}
        <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-4">
          <div className="border-b border-[#21262d] pb-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">TRADE-OFF ANALYSIS</span>
            <h2 className="text-sm font-bold text-[#f3f4f6] uppercase tracking-wider">ENGINEERING EVALUATION</h2>
          </div>

          {/* Advantage */}
          <div className="p-3 bg-[#0d0f12] border border-[#21262d] space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block flex items-center gap-1.5">
              <span>✓</span> MAIN ADVANTAGE
            </span>
            <p className="text-[11px] text-[#c9d1d9] leading-relaxed">
              {current.advantage}
            </p>
          </div>

          {/* Problem */}
          <div className="p-3 bg-[#0d0f12] border border-[#21262d] space-y-1">
            <span className="text-[10px] text-rose-400 font-bold uppercase block flex items-center gap-1.5">
              <span>⚠</span> MAIN LIMITATION / PROBLEM
            </span>
            <p className="text-[11px] text-[#c9d1d9] leading-relaxed">
              {current.problem}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
