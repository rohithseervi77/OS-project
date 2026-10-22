'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Play, 
  Layers, 
  Activity,
  Sparkles
} from 'lucide-react';

interface AlgorithmDetail {
  id: string;
  code: string;
  name: string;
  type: string;
  preemption: string;
  rule: string;
  howItWorks: string;
  advantages: string[];
  problems: string[];
  complexity: string;
}

const ALGORITHMS: AlgorithmDetail[] = [
  {
    id: 'FCFS',
    code: 'FCFS',
    name: 'First-Come, First-Served',
    type: 'Non-Preemptive Batch',
    preemption: 'Non-preemptive',
    rule: 'Queue position strictly determined by arrival timestamp: min(arrivalTime).',
    howItWorks: 'Processes are placed into a FIFO queue upon arrival. The CPU executes the process at the head of the queue to completion before dispatching the next ready process.',
    advantages: [
      'Simple, deterministic O(1) queue management.',
      'Completely zero preemption overhead and context switch thrashing.',
      'No starvation — every arriving process eventually executes.'
    ],
    problems: [
      'Convoy Effect: Short interactive jobs are trapped behind long CPU-bound tasks.',
      'High average waiting time and turnaround latency.',
      'Poor response time for interactive and I/O-bound workloads.'
    ],
    complexity: 'O(1) dispatch'
  },
  {
    id: 'SJF',
    code: 'SJF',
    name: 'Shortest Job First',
    type: 'Non-Preemptive Optimal',
    preemption: 'Non-preemptive',
    rule: 'Selects the arrived task with the shortest CPU burst: min(burstTime).',
    howItWorks: 'When the CPU becomes idle, the scheduler inspects the ready queue and selects the uncompleted process with the lowest actual or predicted burst duration. It executes to completion without interruption.',
    advantages: [
      'Provably optimal minimum average waiting time for a given set of stationary processes.',
      'Maximizes process completion throughput for short bursts.',
      'Effective when burst lengths can be accurately predicted.'
    ],
    problems: [
      'Starvation: Continuous arrival of short processes starves long batch jobs.',
      'Requires future burst knowledge (requires predictive estimation like Exponential Averaging).',
      'Cannot preempt a long process once it begins running.'
    ],
    complexity: 'O(log N) heap or O(N) scan'
  },
  {
    id: 'SRTF',
    code: 'SRTF',
    name: 'Shortest Remaining Time First',
    type: 'Preemptive Optimal',
    preemption: 'Preemptive',
    rule: 'At every clock tick or arrival: min(remainingBurst).',
    howItWorks: 'Preemptive version of SJF. When a new process arrives, if its remaining CPU burst is strictly less than the currently executing process remaining burst, the current process is preempted and returned to the ready queue.',
    advantages: [
      'Produces the lowest theoretical average waiting time in preemptive scheduling.',
      'Highly responsive to newly arriving short jobs.',
      'Allows urgent short interactive bursts to bypass long-running tasks immediately.'
    ],
    problems: [
      'Substantial context-switch overhead if remaining times are close.',
      'High risk of starvation for long processes under heavy interactive load.',
      'Requires continuous tracking and prediction of remaining burst times.'
    ],
    complexity: 'O(log N) event priority queue'
  },
  {
    id: 'RR',
    code: 'RR',
    name: 'Round Robin',
    type: 'Time-Sharing Preemptive',
    preemption: 'Preemptive on Quantum Expiry',
    rule: 'FIFO ready queue with fixed time-slice quantum (q).',
    howItWorks: 'Each process is assigned a fixed time slice (quantum). The CPU runs the process for at most quantum ms. If the burst is not completed, the process is preempted and re-enqueued at the tail of the ready queue.',
    advantages: [
      'Guaranteed bounded response time: (N - 1) * q maximum wait before first dispatch.',
      'Inherently fair — all processes receive an equal share of CPU cycles.',
      'Ideal for interactive, multi-user, and desktop environments.'
    ],
    problems: [
      'Performance critically sensitive to quantum size q:',
      '• If q is too small: excessive context-switch overhead degrades CPU throughput.',
      '• If q is too large: degrades to FCFS with poor interactive response.'
    ],
    complexity: 'O(1) circular queue'
  },
  {
    id: 'PRIORITY',
    code: 'PRIORITY',
    name: 'Priority Scheduling with Aging',
    type: 'Priority-Based with Starvation Defense',
    preemption: 'Preemptive (Lower numeric value = Higher priority)',
    rule: 'Selects task with min(effectivePriority). Aging elevates priority over time.',
    howItWorks: 'Processes have static base priorities. To prevent starvation of low-priority tasks, an Aging policy gradually increments effective priority (reduces numeric value) as waiting time crosses threshold multiples.',
    advantages: [
      'Allows critical system tasks and real-time processes to preempt background jobs.',
      'Aging mechanism mathematically guarantees an upper bound on starvation.',
      'Aligns with operating system security rings and process importance.'
    ],
    problems: [
      'Without aging, low-priority tasks can suffer indefinite postponement.',
      'Priority inversion hazard if not coupled with priority inheritance mechanisms.'
    ],
    complexity: 'O(log N) priority queue'
  },
  {
    id: 'MLFQ',
    code: 'MLFQ',
    name: 'Multilevel Feedback Queue',
    type: 'Adaptive Multi-Tier Feedback',
    preemption: 'Preemptive Hierarchical',
    rule: 'Q0 (RR q=2ms) -> Q1 (RR q=4ms) -> Q2 (FCFS). Periodic priority boost.',
    howItWorks: 'New tasks enter highest queue Q0. If a task uses its full quantum without finishing, it is demoted to a lower queue with longer quantum. Periodic Priority Boost resets all tasks to Q0 to prevent starvation.',
    advantages: [
      'Approximates SJF without requiring prior knowledge of burst lengths.',
      'Automatically separates I/O-bound (interactive) tasks from CPU-bound batch tasks.',
      'Standard basis for modern OS schedulers (Linux CFS / BSD).'
    ],
    problems: [
      'Complex kernel state with multiple queues, demotion thresholds, and boost timers.',
      'Vulnerable to gaming if a task intentionally yields just before quantum expiry.'
    ],
    complexity: 'O(1) per queue level'
  },
  {
    id: 'SMART',
    code: 'SMART',
    name: 'Workload-Aware Adaptive Scheduler',
    type: 'Predictive Multi-Objective',
    preemption: 'Dynamic Policy Selection',
    rule: 'Evaluate candidates on same workload -> multi-objective score modulated by prediction confidence.',
    howItWorks: 'The core novelty of KERNEL//LAB: analyzes burst variance, CPU/IO ratio, and prediction confidence. Dynamically computes the optimal quantum and aging parameters, simulates candidate policies, and deploys the highest-scoring policy with explainable reasoning.',
    advantages: [
      'Autonomous adaptation to shifting workload phases (CPU-heavy vs interactive).',
      'Confidence-aware fallback: reduces prediction reliance when history is volatile.',
      'Deterministic explainable trace showing why decisions were made.'
    ],
    problems: [
      'Requires discrete candidate evaluation overhead.',
      'Multi-objective weights must reflect the operator intended performance tradeoffs.'
    ],
    complexity: 'O(K * N log N) candidate simulation'
  }
];

export default function AlgorithmsPage() {
  const [selectedId, setSelectedId] = useState<string>('SMART');
  const activeAlgo = ALGORITHMS.find(a => a.id === selectedId) || ALGORITHMS[0];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-8 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1c2230] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">
              OPERATING SYSTEM ALGORITHM MATRIX
            </h1>
          </div>
          <p className="text-xs text-[#8e99b0] mt-1 font-sans">
            Technical specification of scheduling rules, preemption semantics, mathematical behaviors, and operational trade-offs.
          </p>
        </div>

        <Link
          href="/scheduler"
          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          SIMULATOR CONTROL ROOM
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Algorithm Modules List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold mb-2">
            SELECT ALGORITHM MODULE
          </span>

          {ALGORITHMS.map((algo) => {
            const isSelected = algo.id === selectedId;
            return (
              <div
                key={algo.id}
                onClick={() => setSelectedId(algo.id)}
                className={`p-3 rounded-sm border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#141822] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-[#0c0e14] border-[#1e2330] hover:border-[#2f374a] hover:bg-[#0f121a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {algo.id === 'SMART' && <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
                    <span className="font-bold text-white tracking-wider text-sm">{algo.code}</span>
                  </div>
                  <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded-sm border ${
                    isSelected ? 'bg-amber-950/40 text-amber-400 border-amber-500/50' : 'bg-[#12151d] text-[#636d85] border-[#222736]'
                  }`}>
                    {algo.preemption.split(' ')[0]}
                  </span>
                </div>
                <div className="text-[11px] text-[#8e99b0] mt-1 font-sans font-medium">
                  {algo.name}
                </div>
                <div className="text-[10px] text-[#636d85] mt-1">
                  RULE: {algo.rule.slice(0, 42)}...
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Algorithm Detailed Blueprint (8 cols) */}
        <div className="lg:col-span-8 rounded-sm border border-[#1e2330] bg-[#0c0e14] p-6 space-y-6 shadow-xl">
          {/* Blueprint Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#181c26] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tracking-wider">{activeAlgo.code}</span>
                <span className="text-xs text-amber-400 font-bold uppercase">&bull; {activeAlgo.name}</span>
              </div>
              <p className="text-xs text-[#8e99b0] mt-1">
                Classification: <span className="text-white">{activeAlgo.type}</span> | Preemption: <span className="text-amber-400">{activeAlgo.preemption}</span>
              </p>
            </div>

            <Link
              href="/scheduler"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#151922] hover:bg-[#1c2230] text-amber-400 border border-amber-500/40 text-xs font-bold uppercase tracking-wider"
            >
              <Play className="h-3 w-3 fill-amber-400" />
              SIMULATE THIS POLICY
            </Link>
          </div>

          {/* Operational Rule Card */}
          <div className="rounded-sm bg-[#090b0f] border border-[#181c26] p-4 space-y-1.5">
            <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
              DISPATCHING RULE
            </span>
            <p className="text-sm font-bold text-amber-300">
              {activeAlgo.rule}
            </p>
            <span className="text-[10px] text-[#636d85] block pt-1">
              TIME COMPLEXITY: {activeAlgo.complexity}
            </span>
          </div>

          {/* How It Works */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#636d85] uppercase tracking-wider block font-bold">
              MECHANICAL EXECUTION
            </span>
            <p className="text-xs text-[#c0c7d6] font-sans leading-relaxed">
              {activeAlgo.howItWorks}
            </p>
          </div>

          {/* Advantages & Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Advantages */}
            <div className="p-4 rounded-sm bg-[#090b0f] border border-[#181c26] space-y-2">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                SYSTEM ADVANTAGES
              </span>
              <ul className="space-y-2 text-[11px] text-[#c0c7d6] font-sans">
                {activeAlgo.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Problems & Hazards */}
            <div className="p-4 rounded-sm bg-[#090b0f] border border-[#181c26] space-y-2">
              <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                PROBLEMS & TRADE-OFFS
              </span>
              <ul className="space-y-2 text-[11px] text-[#c0c7d6] font-sans">
                {activeAlgo.problems.map((prob, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">&bull;</span>
                    <span>{prob}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
