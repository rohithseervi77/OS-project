'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Process, 
  PCB, 
  AlgorithmType, 
  SchedulingResult, 
  SmartDecision, 
  WorkloadCharacteristics 
} from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { runFCFS } from '../../lib/scheduler/fcfs';
import { runSJF } from '../../lib/scheduler/sjf';
import { runSRTF } from '../../lib/scheduler/srtf';
import { runRoundRobin } from '../../lib/scheduler/roundRobin';
import { runPriority } from '../../lib/scheduler/priority';
import { runMLFQ } from '../../lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '../../lib/scheduler/smartScheduler';
import { analyzeWorkload } from '../../lib/workload/analyzer';
import { DiscreteEventSimulationEngine } from '../../lib/simulation/engine';
import { SimulationEvent } from '../../lib/simulation/events';
import CPUVisualizer from '../../components/CPUVisualizer';
import GanttChart from '../../components/GanttChart';
import ReadyQueue from '../../components/ReadyQueue';
import SystemEventStream from '../../components/SystemEventStream';
import DecisionPanel from '../../components/DecisionPanel';
import StarvationMonitor from '../../components/StarvationMonitor';
import PCBModal from '../../components/PCBModal';
import { createPCB } from '../../lib/pcb';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Zap, 
  Sliders, 
  Layers, 
  Terminal, 
  Cpu, 
  Activity, 
  FolderPlus 
} from 'lucide-react';

export default function ControlRoomPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [scenario, setScenario] = useState<'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN'>('MIXED');
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>('SMART');
  const [smartDecision, setSmartDecision] = useState<SmartDecision | null>(null);
  const [workload, setWorkload] = useState<WorkloadCharacteristics | null>(null);

  // Simulation execution engine states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentRunning, setCurrentRunning] = useState<PCB | null>(null);
  const [readyQueue, setReadyQueue] = useState<PCB[]>([]);
  const [gantt, setGantt] = useState<any[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [inspectPCB, setInspectPCB] = useState<PCB | null>(null);

  // Engine refs
  const engineRef = useRef<DiscreteEventSimulationEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load demo workload on mount (Demo-first experience)
  useEffect(() => {
    handleLoadScenario('MIXED');
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleLoadScenario = (sc: 'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN') => {
    setScenario(sc);
    const procs = generateProcesses({ count: 10, seed: 42, scenario: sc });
    setProcesses(procs);
    const wl = analyzeWorkload(procs);
    setWorkload(wl);
    const evaluation = evaluateSmartScheduler(procs);
    setSmartDecision(evaluation.decision);

    const targetAlgo = activeAlgorithm === 'SMART' ? evaluation.decision.selectedAlgorithm : activeAlgorithm;
    initEngine(procs, targetAlgo, evaluation.decision.dynamicQuantum);
  };

  const handleLoadDemoWorkload = () => {
    handleLoadScenario('MIXED');
  };

  const initEngine = (procs: Process[], algo: AlgorithmType, dynamicQ: number = 4) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);

    const actualAlgo = algo === 'SMART' && smartDecision ? smartDecision.selectedAlgorithm : algo;
    const engine = new DiscreteEventSimulationEngine(procs, {
      algorithm: actualAlgo,
      quantum: dynamicQ,
      agingThreshold: 10,
      usePrediction: true,
    });
    engineRef.current = engine;

    const state = engine.getState();
    updateUIState(state);
  };

  const updateUIState = (state: any) => {
    setCurrentTime(state.currentTime);
    setCurrentRunning(state.currentRunning);
    setReadyQueue(state.readyQueue);
    setGantt(state.gantt);
    setEvents(state.eventLog);
  };

  const handleStep = () => {
    if (!engineRef.current) return;
    const state = engineRef.current.step();
    updateUIState(state);
    if (state.isFinished) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const tick = Math.max(20, Math.floor(100 / speed));
      intervalRef.current = setInterval(() => {
        if (!engineRef.current) return;
        const state = engineRef.current.step();
        updateUIState(state);
        if (state.isFinished) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, tick);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    if (engineRef.current) {
      engineRef.current.reset();
      updateUIState(engineRef.current.getState());
    }
  };

  const handleClearProcesses = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setProcesses([]);
    setCurrentTime(0);
    setCurrentRunning(null);
    setReadyQueue([]);
    setGantt([]);
    setEvents([]);
    engineRef.current = null;
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const tick = Math.max(20, Math.floor(100 / newSpeed));
      intervalRef.current = setInterval(() => {
        if (!engineRef.current) return;
        const state = engineRef.current.step();
        updateUIState(state);
        if (state.isFinished) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, tick);
    }
  };

  const handleAlgorithmChange = (algo: AlgorithmType) => {
    setActiveAlgorithm(algo);
    const targetAlgo = algo === 'SMART' && smartDecision ? smartDecision.selectedAlgorithm : algo;
    initEngine(processes, targetAlgo, smartDecision?.dynamicQuantum || 4);
  };

  const handleSelectProcess = (pid: string) => {
    setSelectedPid(pid);
    const found = readyQueue.find(p => p.pid === pid) || (currentRunning?.pid === pid ? currentRunning : null);
    if (found) {
      setInspectPCB(found);
    } else {
      const proc = processes.find(p => p.pid === pid);
      if (proc) {
        setInspectPCB(createPCB(proc));
      }
    }
  };

  const totalBusy = gantt.filter(g => g.pid !== 'IDLE').reduce((s, g) => s + g.duration, 0);
  const currentUtil = currentTime > 0 ? Math.round((totalBusy / currentTime) * 100) : 0;
  const contextSwitches = engineRef.current?.getState().contextSwitches || 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 space-y-4 font-mono text-xs">
      {/* Sticky Simulation Control Bar (Section 9) */}
      <div className="sticky top-14 z-40 bg-[#0d0f12] border border-[#21262d] p-2.5 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d] font-bold uppercase transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            RESET
          </button>

          <button
            onClick={handlePlayPause}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold uppercase tracking-wider text-black transition-colors ${
              isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5 fill-black" />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={handleStep}
            disabled={isPlaying || processes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] font-bold uppercase disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" />
            STEP
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] px-1.5 py-1 text-[10px]">
            <span className="text-[#6e7681] uppercase text-[9px]">SPEED:</span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.2 font-bold ${
                  speed === s ? 'bg-amber-500 text-black' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Demo Button */}
          <button
            onClick={handleLoadDemoWorkload}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase"
          >
            LOAD DEMO WORKLOAD
          </button>
        </div>

        {/* Center: Live Telemetry Values */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] bg-[#13171d] border border-[#21262d] px-2.5 py-1">
          <span>CLOCK: <span className="text-amber-400 font-bold">{currentTime.toFixed(2)}ms</span></span>
          <span className="text-[#30363d]">|</span>
          <span>CPU: <span className="text-[#f3f4f6] font-bold">{currentUtil}%</span></span>
          <span className="text-[#30363d]">|</span>
          <span>QUEUE: <span className="text-[#38bdf8] font-bold">{readyQueue.length}</span></span>
          <span className="text-[#30363d]">|</span>
          <span>TASKS: <span className="text-emerald-400 font-bold">{processes.length}</span></span>
          <span className="text-[#30363d]">|</span>
          <span>CS: <span className="text-amber-300 font-bold">{contextSwitches}</span></span>
        </div>

        {/* Right: Workload Scenario Switcher (Section 15) */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-[#6e7681] uppercase mr-0.5">SCENARIO:</span>
          {(['MIXED', 'CPU_HEAVY', 'INTERACTIVE', 'STARVATION', 'UNCERTAIN'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => handleLoadScenario(sc)}
              className={`px-2 py-1 text-[10px] uppercase font-bold transition-colors ${
                scenario === sc
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
              }`}
            >
              {sc.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Selection Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#13171d] border border-[#21262d] text-[11px]">
        <span className="text-[10px] text-[#8b949e] uppercase px-1 font-bold">SCHEDULING POLICY:</span>
        {(['SMART', 'FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY', 'MLFQ'] as AlgorithmType[]).map((algo) => {
          const isSelected = activeAlgorithm === algo;
          return (
            <button
              key={algo}
              onClick={() => handleAlgorithmChange(algo)}
              className={`px-3 py-1 font-bold uppercase transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
              }`}
            >
              {algo === 'SMART' ? '⚡ SMART SCHEDULER' : algo}
            </button>
          );
        })}
      </div>

      {/* Empty State Banner (Section 23) if no processes loaded */}
      {processes.length === 0 ? (
        <div className="border border-dashed border-[#21262d] bg-[#13171d] p-8 text-center space-y-3">
          <h2 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
            SIMULATION READY
          </h2>
          <p className="text-xs text-[#8b949e]">
            Load a workload scenario or generate custom processes to begin hardware simulation.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => handleLoadScenario('MIXED')}
              className="px-3 py-1.5 bg-amber-500 text-black font-bold uppercase text-xs"
            >
              [ MIXED WORKLOAD ]
            </button>
            <button
              onClick={() => handleLoadScenario('CPU_HEAVY')}
              className="px-3 py-1.5 bg-[#161b22] text-[#c9d1d9] border border-[#30363d] font-bold uppercase text-xs hover:bg-[#21262d]"
            >
              [ CPU HEAVY ]
            </button>
            <button
              onClick={() => handleLoadScenario('INTERACTIVE')}
              className="px-3 py-1.5 bg-[#161b22] text-[#c9d1d9] border border-[#30363d] font-bold uppercase text-xs hover:bg-[#21262d]"
            >
              [ INTERACTIVE ]
            </button>
            <button
              onClick={() => handleLoadScenario('STARVATION')}
              className="px-3 py-1.5 bg-[#161b22] text-[#c9d1d9] border border-[#30363d] font-bold uppercase text-xs hover:bg-[#21262d]"
            >
              [ STARVATION TEST ]
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main 3-Column CPU Control Room Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: CPU Status & Resource Monitor (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <CPUVisualizer
                currentRunning={currentRunning}
                currentTime={currentTime}
                cpuUtilization={currentUtil}
                algorithm={activeAlgorithm === 'SMART' && smartDecision ? smartDecision.selectedAlgorithm : activeAlgorithm}
                quantum={smartDecision?.dynamicQuantum || 4}
                readyQueueCount={readyQueue.length}
              />
            </div>

            {/* CENTER COLUMN: Execution Timeline & Ready Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <GanttChart
                segments={gantt}
                currentTime={currentTime}
                onSelectProcess={handleSelectProcess}
                selectedPid={selectedPid || undefined}
              />

              <ReadyQueue
                queue={readyQueue}
                onSelectProcess={handleSelectProcess}
                selectedPid={selectedPid}
              />

              {/* Starvation & Aging Telemetry Panel (Section 16) */}
              <StarvationMonitor
                readyQueue={readyQueue}
                agingThreshold={10}
                onSelectProcess={handleSelectProcess}
              />
            </div>

            {/* RIGHT COLUMN: Scheduler Decision Trace (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <DecisionPanel decision={smartDecision} workload={workload} />
            </div>
          </div>

          {/* Bottom Terminal System Event Stream */}
          <div className="pt-2">
            <SystemEventStream events={events} maxHeight="h-44" />
          </div>
        </>
      )}

      {/* PCB Modal Inspector */}
      {inspectPCB && (
        <PCBModal pcb={inspectPCB} onClose={() => setInspectPCB(null)} />
      )}
    </div>
  );
}
