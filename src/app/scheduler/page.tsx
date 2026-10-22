'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Process, 
  PCB, 
  AlgorithmType, 
  SchedulingResult, 
  SmartDecision, 
  WorkloadCharacteristics,
  ObjectiveWeights
} from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { runFCFS } from '../../lib/scheduler/fcfs';
import { runSJF } from '../../lib/scheduler/sjf';
import { runSRTF } from '../../lib/scheduler/srtf';
import { runRoundRobin } from '../../lib/scheduler/roundRobin';
import { runPriority } from '../../lib/scheduler/priority';
import { runMLFQ } from '../../lib/scheduler/mlfq';
import { evaluateSmartScheduler, DEFAULT_OBJECTIVE_WEIGHTS } from '../../lib/scheduler/smartScheduler';
import { analyzeWorkload } from '../../lib/workload/analyzer';
import { DiscreteEventSimulationEngine } from '../../lib/simulation/engine';
import { SimulationEvent } from '../../lib/simulation/events';
import CPUVisualizer from '../../components/CPUVisualizer';
import GanttChart from '../../components/GanttChart';
import ReadyQueue from '../../components/ReadyQueue';
import SystemEventStream from '../../components/SystemEventStream';
import DecisionPanel from '../../components/DecisionPanel';
import PCBModal from '../../components/PCBModal';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Sliders, 
  Layers, 
  Terminal, 
  Sparkles,
  Cpu,
  Activity,
  ArrowRight
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

  // Load default mixed workload on mount
  useEffect(() => {
    handleLoadScenario('MIXED');
  }, []);

  const handleLoadScenario = (sc: 'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN') => {
    setScenario(sc);
    const procs = generateProcesses({ count: 10, seed: 42, scenario: sc });
    setProcesses(procs);
    const wl = analyzeWorkload(procs);
    setWorkload(wl);
    const evaluation = evaluateSmartScheduler(procs);
    setSmartDecision(evaluation.decision);
    initEngine(procs, activeAlgorithm === 'SMART' ? evaluation.decision.selectedAlgorithm : activeAlgorithm, evaluation.decision.dynamicQuantum);
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

  // Inspect selected process PCB modal
  const handleSelectProcess = (pid: string) => {
    setSelectedPid(pid);
    const found = readyQueue.find(p => p.pid === pid) || (currentRunning?.pid === pid ? currentRunning : null);
    if (found) {
      setInspectPCB(found);
    }
  };

  const totalBusy = gantt.filter(g => g.pid !== 'IDLE').reduce((s, g) => s + g.duration, 0);
  const currentUtil = currentTime > 0 ? Math.round((totalBusy / currentTime) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 space-y-4 font-mono text-xs">
      {/* Top Header & Simulation Controls Ribbon */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#151822] hover:bg-[#1b202e] text-[#8e99b0] hover:text-white border border-[#23293a] font-bold uppercase tracking-wider"
          >
            <RotateCcw className="h-3 w-3" />
            RESET
          </button>

          <button
            onClick={handlePlayPause}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-sm font-bold uppercase tracking-wider text-black transition-colors ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300'
                : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5 fill-black" />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={handleStep}
            disabled={isPlaying}
            className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-[#151822] hover:bg-[#1b202e] text-[#c0c7d6] border border-[#23293a] font-bold uppercase tracking-wider disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" />
            STEP
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-[#090b0f] border border-[#1e2330] px-1.5 py-1 rounded-sm ml-1 text-[11px]">
            <span className="text-[#636d85] uppercase text-[9px]">SPEED:</span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.2 rounded-sm font-bold ${
                  speed === s ? 'bg-amber-500 text-black' : 'text-[#8e99b0] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="px-2.5 py-1 rounded-sm bg-[#090b0f] border border-[#1e2330] text-amber-400 font-bold ml-1">
            t = {currentTime.toFixed(2)} ms
          </div>
        </div>

        {/* Workload Scenario Switcher */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-[#636d85] uppercase mr-1">SCENARIO:</span>
          {(['MIXED', 'CPU_HEAVY', 'INTERACTIVE', 'STARVATION', 'UNCERTAIN'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => handleLoadScenario(sc)}
              className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold transition-colors ${
                scenario === sc
                  ? 'bg-[#1e2536] text-amber-400 border border-amber-500/50'
                  : 'text-[#636d85] hover:text-[#c0c7d6] bg-[#090b0f]'
              }`}
            >
              {sc.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Selector Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#090b0f] border border-[#181c26] rounded-sm text-[11px]">
        <span className="text-[10px] text-[#636d85] uppercase px-1">POLICY:</span>
        {(['SMART', 'FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY', 'MLFQ'] as AlgorithmType[]).map((algo) => {
          const isSelected = activeAlgorithm === algo;
          return (
            <button
              key={algo}
              onClick={() => handleAlgorithmChange(algo)}
              className={`px-3 py-1 rounded-sm font-bold uppercase transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-black'
                  : 'text-[#8e99b0] hover:text-white hover:bg-[#141822]'
              }`}
            >
              {algo === 'SMART' ? '⚡ SMART SCHEDULER' : algo}
            </button>
          );
        })}
      </div>

      {/* Main 3-Column CPU Control Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: CPU Status (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <CPUVisualizer
            currentRunning={currentRunning}
            currentTime={currentTime}
            cpuUtilization={currentUtil}
            algorithm={activeAlgorithm === 'SMART' && smartDecision ? smartDecision.selectedAlgorithm : activeAlgorithm}
            quantum={smartDecision?.dynamicQuantum || 4}
          />
        </div>

        {/* CENTER COLUMN: Execution Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <GanttChart
            segments={gantt}
            currentTime={currentTime}
            onSelectProcess={handleSelectProcess}
            selectedPid={selectedPid || undefined}
          />

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 bg-[#0c0e14] border border-[#1e2330] p-3 rounded-sm text-center">
            <div>
              <span className="text-[9px] text-[#636d85] block uppercase">Utilized</span>
              <span className="text-sm font-bold text-white">{currentUtil}%</span>
            </div>
            <div>
              <span className="text-[9px] text-[#636d85] block uppercase">Context Switches</span>
              <span className="text-sm font-bold text-amber-400">{engineRef.current?.getState().contextSwitches || 0}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#636d85] block uppercase">Tasks Remaining</span>
              <span className="text-sm font-bold text-[#38bdf8]">{readyQueue.length + (currentRunning ? 1 : 0)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Scheduler Decision & Analysis (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <DecisionPanel decision={smartDecision} workload={workload} />
        </div>
      </div>

      {/* BOTTOM SECTION: Ready Queue + Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <ReadyQueue
            queue={readyQueue}
            onSelectProcess={handleSelectProcess}
            selectedPid={selectedPid}
          />
        </div>

        <div className="lg:col-span-6">
          <SystemEventStream events={events} maxHeight="h-44" />
        </div>
      </div>

      {/* Process PCB Inspector Modal / Slide-over */}
      {inspectPCB && (
        <PCBModal pcb={inspectPCB} onClose={() => setInspectPCB(null)} />
      )}
    </div>
  );
}
