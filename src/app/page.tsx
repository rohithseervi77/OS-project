'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Terminal, 
  ArrowRight, 
  Activity, 
  Clock, 
  Layers, 
  GitBranch, 
  ShieldAlert, 
  Sliders,
  Play
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between tech-grid">
      {/* Top Banner Tag */}
      <div className="border-b border-[#1c202a] bg-[#0c0e14]/80 py-1.5 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-[11px] font-mono text-[#636d85]">
          <span className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">KERNEL//LAB</span>
            <span>::</span>
            <span>SYSTEM DISPATCHER & PREDICTIVE ANALYTICS ENGINE</span>
          </span>
          <span className="hidden sm:inline text-[#8e99b0]">
            ARCH: X86_64 // SCHED: ADAPTIVE // TICK: 1MS
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 w-full">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#141720] border border-[#212635] text-amber-500 font-mono text-xs font-semibold tracking-wider uppercase">
            <span>OPERATING SYSTEMS LAB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white leading-tight uppercase">
            THE CPU DECIDES.<br />
            <span className="text-amber-400">THE WORKLOAD CHANGES.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#8e99b0] leading-relaxed max-w-2xl font-sans">
            Explore how scheduling policies behave under changing workloads and see how predictive scheduling adapts in real time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
            <Link
              href="/scheduler"
              className="flex items-center gap-2 px-5 py-3 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold tracking-wider uppercase transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              START SIMULATION
            </Link>

            <Link
              href="/algorithms"
              className="flex items-center gap-2 px-5 py-3 rounded-sm bg-[#151922] hover:bg-[#1c2230] text-[#c0c7d6] border border-[#262d3e] font-semibold tracking-wider uppercase transition-colors"
            >
              EXPLORE ALGORITHMS
              <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
            </Link>
          </div>
        </div>

        {/* Live Central CPU Visualization & Telemetry Board */}
        <div className="mt-12 rounded-sm border border-[#1e2330] bg-[#0c0e14] p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#181c26] text-xs font-mono text-[#8e99b0] gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-white font-bold tracking-wider">HARDWARE TELEMETRY & EXECUTION MONITOR</span>
            </div>
            <span className="text-[11px] text-[#636d85]">CORE #0 // STATE: READY TO DISPATCH</span>
          </div>

          {/* CPU Visualizer Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-5 font-mono text-xs">
            {/* CPU 0 Status */}
            <div className="rounded-sm bg-[#10131a] border border-[#1b202c] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#636d85] uppercase tracking-wider block">Processor Core</span>
                <span className="text-xl font-bold text-white mt-1 block">CPU 0</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8e99b0]">Core Load</span>
                  <span className="text-amber-400 font-bold">0% (IDLE)</span>
                </div>
                <div className="text-[10px] text-[#636d85] font-mono tracking-tighter">
                  ░░░░░░░░░░░░░░░░░░░░ 0%
                </div>
              </div>
              <span className="text-[10px] text-[#636d85] mt-3 block border-t border-[#181c26] pt-2">
                STATUS: WAITING FOR CLOCK TICK
              </span>
            </div>

            {/* Current Process / Execution */}
            <div className="rounded-sm bg-[#10131a] border border-[#1b202c] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#636d85] uppercase tracking-wider block">Dispatched Process</span>
                <span className="text-xl font-bold text-[#8e99b0] mt-1 block">[ NONE ]</span>
              </div>
              <div className="mt-4 text-[11px] text-[#8e99b0] space-y-1">
                <div>Burst Remaining: <span className="text-white">-- ms</span></div>
                <div>Priority Level: <span className="text-white">--</span></div>
                <div>Process Type: <span className="text-white">--</span></div>
              </div>
              <span className="text-[10px] text-[#636d85] mt-3 block border-t border-[#181c26] pt-2">
                RUNNING SLOT: IDLE
              </span>
            </div>

            {/* Active Policy */}
            <div className="rounded-sm bg-[#10131a] border border-[#1b202c] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#636d85] uppercase tracking-wider block">Scheduling Policy</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">SMART (ADAPTIVE)</span>
              </div>
              <div className="mt-4 text-[11px] text-[#8e99b0] space-y-1">
                <div>Dynamic Slice (q): <span className="text-white">AUTO-COMPUTED</span></div>
                <div>Aging Trigger: <span className="text-white">ENABLED (10ms)</span></div>
                <div>Predictor: <span className="text-white">EXPONENTIAL (α=0.5)</span></div>
              </div>
              <span className="text-[10px] text-[#636d85] mt-3 block border-t border-[#181c26] pt-2">
                EVALUATION: MULTI-OBJECTIVE
              </span>
            </div>

            {/* Execution Timeline Snapshot */}
            <div className="rounded-sm bg-[#10131a] border border-[#1b202c] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#636d85] uppercase tracking-wider block">Simulation Clock</span>
                <span className="text-xl font-bold text-white mt-1 block">t = 0.00 ms</span>
              </div>
              <div className="mt-4 text-[11px] text-[#8e99b0] space-y-1">
                <div>Ready Queue Depth: <span className="text-white">0</span></div>
                <div>Completed Tasks: <span className="text-white">0</span></div>
                <div>Context Switches: <span className="text-white">0</span></div>
              </div>
              <Link 
                href="/scheduler" 
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold mt-3 block border-t border-[#181c26] pt-2 flex items-center justify-between"
              >
                <span>OPEN SIMULATOR</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Quick Command Ribbon */}
          <div className="mt-2 border-t border-[#181c26] pt-3 flex flex-wrap items-center justify-between text-xs font-mono text-[#8e99b0] gap-2">
            <span className="text-[#636d85]">
              QUICK COMMAND: LAUNCH THE INTERACTIVE CONTROL ROOM TO INITIALIZE BENCHMARKS
            </span>
            <Link 
              href="/scheduler" 
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              LAUNCH KERNEL CONTROL ROOM &rarr;
            </Link>
          </div>
        </div>

        {/* Technical Subsystem Modules Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 font-mono text-xs">
          <Link href="/processes" className="p-4 rounded-sm border border-[#1c212d] bg-[#0c0e14] hover:border-amber-500/40 transition-colors group">
            <div className="flex items-center justify-between text-[#636d85] group-hover:text-amber-400 mb-2">
              <span className="text-[10px] uppercase tracking-wider">MODULE // 01</span>
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">PROCESS MONITOR & PCB</h3>
            <p className="text-[11px] text-[#8e99b0] mt-1 font-sans">
              Real process control block tracking, state transitions, and deterministic workload generation.
            </p>
          </Link>

          <Link href="/predictions" className="p-4 rounded-sm border border-[#1c212d] bg-[#0c0e14] hover:border-amber-500/40 transition-colors group">
            <div className="flex items-center justify-between text-[#636d85] group-hover:text-amber-400 mb-2">
              <span className="text-[10px] uppercase tracking-wider">MODULE // 02</span>
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">BURST PREDICTOR</h3>
            <p className="text-[11px] text-[#8e99b0] mt-1 font-sans">
              Exponential Averaging engine with statistical error feedback and dynamic confidence boundaries.
            </p>
          </Link>

          <Link href="/algorithms" className="p-4 rounded-sm border border-[#1c212d] bg-[#0c0e14] hover:border-amber-500/40 transition-colors group">
            <div className="flex items-center justify-between text-[#636d85] group-hover:text-amber-400 mb-2">
              <span className="text-[10px] uppercase tracking-wider">MODULE // 03</span>
              <GitBranch className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">ALGORITHM MATRIX</h3>
            <p className="text-[11px] text-[#8e99b0] mt-1 font-sans">
              Rigorous implementations of FCFS, SJF, SRTF, Round Robin, Priority Aging, and MLFQ.
            </p>
          </Link>

          <Link href="/analytics" className="p-4 rounded-sm border border-[#1c212d] bg-[#0c0e14] hover:border-amber-500/40 transition-colors group">
            <div className="flex items-center justify-between text-[#636d85] group-hover:text-amber-400 mb-2">
              <span className="text-[10px] uppercase tracking-wider">MODULE // 04</span>
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">BENCHMARK WORKSTATION</h3>
            <p className="text-[11px] text-[#8e99b0] mt-1 font-sans">
              Comparative analysis on identical workloads: Waiting, Turnaround, Response, and Jain's Fairness.
            </p>
          </Link>
        </div>
      </div>

      {/* Engineering Footer Strip */}
      <div className="border-t border-[#1c202a] bg-[#0a0c10] py-3 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#636d85] gap-2">
          <span>KERNEL//LAB &bull; OPERATING SYSTEMS SCHEDULING RESEARCH SUITE</span>
          <span>100% OFFLINE LOCAL COMPUTATION &bull; NO HARDCODED RESULTS</span>
        </div>
      </div>
    </div>
  );
}
