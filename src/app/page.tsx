'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  ArrowRight,
  Cpu, 
  Layers, 
  Activity, 
  Terminal,
  Sliders,
  Check
} from 'lucide-react';
import { Process, PCB, AlgorithmType, SmartDecision, WorkloadCharacteristics } from '../lib/types';
import { generateProcesses } from '../lib/workload/generator';
import { createPCB } from '../lib/pcb';
import { evaluateSmartScheduler } from '../lib/scheduler/smartScheduler';
import { analyzeWorkload } from '../lib/workload/analyzer';
import { DiscreteEventSimulationEngine } from '../lib/simulation/engine';
import { SimulationEvent } from '../lib/simulation/events';
import CPUVisualizer from '../components/CPUVisualizer';
import GanttChart from '../components/GanttChart';
import ReadyQueue from '../components/ReadyQueue';
import SystemEventStream from '../components/SystemEventStream';
import DecisionPanel from '../components/DecisionPanel';
import PCBModal from '../components/PCBModal';

export default function HomePage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [smartDecision, setSmartDecision] = useState<SmartDecision | null>(null);
  const [workload, setWorkload] = useState<WorkloadCharacteristics | null>(null);

  // Live simulation states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentRunning, setCurrentRunning] = useState<PCB | null>(null);
  const [readyQueue, setReadyQueue] = useState<PCB[]>([]);
  const [gantt, setGantt] = useState<any[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [inspectPCB, setInspectPCB] = useState<PCB | null>(null);

  const engineRef = useRef<DiscreteEventSimulationEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadLiveWorkload();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadLiveWorkload = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);

    const procs = generateProcesses({ count: 8, seed: 42, scenario: 'MIXED' });
    setProcesses(procs);
    const wl = analyzeWorkload(procs);
    setWorkload(wl);
    const evaluation = evaluateSmartScheduler(procs);
    setSmartDecision(evaluation.decision);

    const engine = new DiscreteEventSimulationEngine(procs, {
      algorithm: evaluation.decision.selectedAlgorithm,
      quantum: evaluation.decision.dynamicQuantum,
      agingThreshold: 10,
      usePrediction: true,
    });
    engineRef.current = engine;
    const state = engine.getState();
    updateStates(state);
  };

  const updateStates = (state: any) => {
    setCurrentTime(state.currentTime);
    setCurrentRunning(state.currentRunning);
    setReadyQueue(state.readyQueue);
    setGantt(state.gantt);
    setEvents(state.eventLog);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        if (!engineRef.current) return;
        const state = engineRef.current.step();
        updateStates(state);
        if (state.isFinished) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 70);
    }
  };

  const handleStep = () => {
    if (!engineRef.current) return;
    const state = engineRef.current.step();
    updateStates(state);
    if (state.isFinished) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    if (engineRef.current) {
      engineRef.current.reset();
      updateStates(engineRef.current.getState());
    }
  };

  const totalBusy = gantt.filter(g => g.pid !== 'IDLE').reduce((s, g) => s + g.duration, 0);
  const currentUtil = currentTime > 0 ? Math.round((totalBusy / currentTime) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between tech-grid">
      {/* Top Banner Tag */}
      <div className="border-b border-[#21262d] bg-[#0a0c0e]/90 py-1.5 px-3 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-[11px] font-mono text-[#6e7681]">
          <span className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">KERNEL//LAB</span>
            <span>::</span>
            <span>SYSTEM DISPATCHER & PREDICTIVE ANALYTICS ENGINE</span>
          </span>
          <span className="hidden sm:inline text-[#8b949e]">
            ARCH: X86_64 // SCHED: WORKLOAD-AWARE // TICK: 1MS
          </span>
        </div>
      </div>

      {/* Hero Section Above the Fold (Section 5) */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-10 pb-8 w-full">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#161b22] border border-[#30363d] text-amber-400 font-mono text-xs font-semibold tracking-wider uppercase">
            <span>OPERATING SYSTEMS LAB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-[#f3f4f6] leading-tight uppercase">
            THE CPU DECIDES.<br />
            <span className="text-amber-400">THE WORKLOAD CHANGES.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed max-w-2xl font-mono">
            Explore how scheduling policies behave under changing workloads and how predictive scheduling adapts in real time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
            <Link
              href="/scheduler"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black tracking-wider uppercase transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              LAUNCH CONTROL ROOM
            </Link>

            <Link
              href="/algorithms"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] font-bold tracking-wider uppercase transition-colors"
            >
              EXPLORE ALGORITHMS
              <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
            </Link>
          </div>
        </div>

        {/* Live Control Room Immediate Preview (Section 5) */}
        <div className="mt-8 border border-[#21262d] bg-[#0d0f12] shadow-2xl p-4 font-mono text-xs space-y-4">
          {/* Top Live Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-amber-400 animate-pulse" />
              <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs">
                ACTIVE HARDWARE SIMULATION // CORE 0 DISPATCH
              </span>
            </div>

            {/* Quick Live Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className={`px-3 py-1 font-bold uppercase transition-colors flex items-center gap-1.5 ${
                  isPlaying ? 'bg-amber-400 text-black' : 'bg-emerald-500 text-black'
                }`}
              >
                {isPlaying ? <Pause className="h-3 w-3 fill-black" /> : <Play className="h-3 w-3 fill-black" />}
                {isPlaying ? 'PAUSE' : 'START SIMULATION'}
              </button>

              <button
                onClick={handleStep}
                disabled={isPlaying}
                className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] font-bold uppercase disabled:opacity-40"
              >
                STEP
              </button>

              <button
                onClick={handleReset}
                className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] font-bold uppercase"
              >
                RESET
              </button>

              <span className="px-2 py-1 bg-[#161b22] border border-[#30363d] text-amber-400 font-bold">
                t = {currentTime.toFixed(2)}ms
              </span>
            </div>
          </div>

          {/* 3-Column Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <CPUVisualizer
                currentRunning={currentRunning}
                currentTime={currentTime}
                cpuUtilization={currentUtil}
                algorithm={smartDecision ? smartDecision.selectedAlgorithm : 'SMART'}
                quantum={smartDecision?.dynamicQuantum || 4}
                readyQueueCount={readyQueue.length}
              />
            </div>

            <div className="lg:col-span-8 space-y-4">
              <GanttChart
                segments={gantt}
                currentTime={currentTime}
                onSelectProcess={(pid) => {
                  const p = processes.find(proc => proc.pid === pid);
                  if (p) {
                    setInspectPCB(createPCB(p));
                  }
                }}
              />

              <ReadyQueue
                queue={readyQueue}
                onSelectProcess={(pid) => {
                  const found = readyQueue.find(p => p.pid === pid);
                  if (found) setInspectPCB(found);
                }}
              />
            </div>
          </div>
        </div>

        {/* 4 Feature Engineering Pillars */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="border border-[#21262d] bg-[#13171d] p-3 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">01 // PREDICT</span>
            <span className="text-sm font-bold text-[#f3f4f6] block">BURST ESTIMATION</span>
            <p className="text-[10px] text-[#8b949e] font-sans">
              Exponential Averaging model tracking CPU bursts with statistical confidence scoring.
            </p>
          </div>

          <div className="border border-[#21262d] bg-[#13171d] p-3 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">02 // ANALYZE</span>
            <span className="text-sm font-bold text-[#f3f4f6] block">WORKLOAD PROFILING</span>
            <p className="text-[10px] text-[#8b949e] font-sans">
              Calculates CPU/IO ratio, burst variance, and queue pressure across dynamically shifting tasks.
            </p>
          </div>

          <div className="border border-[#21262d] bg-[#13171d] p-3 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">03 // ADAPT</span>
            <span className="text-sm font-bold text-[#f3f4f6] block">AUTONOMOUS POLICY</span>
            <p className="text-[10px] text-[#8b949e] font-sans">
              Evaluates candidates on identical workloads to choose the optimal policy and dynamic quantum.
            </p>
          </div>

          <div className="border border-[#21262d] bg-[#13171d] p-3 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">04 // EXPLAIN</span>
            <span className="text-sm font-bold text-[#f3f4f6] block">DECISION TRACE</span>
            <p className="text-[10px] text-[#8b949e] font-sans">
              Inspectable rationale cards showing why each scheduling and preemption decision occurred.
            </p>
          </div>
        </div>
      </div>

      {inspectPCB && (
        <PCBModal pcb={inspectPCB} onClose={() => setInspectPCB(null)} />
      )}
    </div>
  );
}
