'use client';

import React from 'react';
import { AlgorithmType, PCB } from '../../lib/types';
import { useSimulation, WorkloadScenario } from '../../context/SimulationContext';
import CPUVisualizer from '../../components/CPUVisualizer';
import GanttChart from '../../components/GanttChart';
import ReadyQueue from '../../components/ReadyQueue';
import SystemEventStream from '../../components/SystemEventStream';
import DecisionPanel from '../../components/DecisionPanel';
import StarvationMonitor from '../../components/StarvationMonitor';
import PCBModal from '../../components/PCBModal';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward 
} from 'lucide-react';

export default function ControlRoomPage() {
  const {
    processes,
    scenario,
    activeAlgorithm,
    currentTime,
    currentRunning,
    readyQueue,
    gantt,
    events,
    isFinished,
    isPlaying,
    speed,
    contextSwitches,
    smartDecision,
    workload,
    selectedPid,
    inspectPCB,
    setSelectedPid,
    setInspectPCB,
    loadScenario,
    setAlgorithm,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    setSimulationSpeed,
  } = useSimulation();

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  };

  const handleSelectProcess = (pid: string) => {
    setSelectedPid(pid);
  };

  const totalBusy = gantt.filter(g => g.pid !== 'IDLE').reduce((s, g) => s + g.duration, 0);
  const currentUtil = currentTime > 0 ? Math.round((totalBusy / currentTime) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 space-y-4 font-mono text-xs">
      {/* Sticky Simulation Control Bar */}
      <div className="sticky top-14 z-40 bg-[#0d0f12] border border-[#21262d] p-2.5 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d] font-bold uppercase transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            RESET
          </button>

          <button
            onClick={handlePlayPause}
            disabled={processes.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold uppercase tracking-wider text-black transition-colors disabled:opacity-40 ${
              isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5 fill-black" />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={stepSimulation}
            disabled={isPlaying || processes.length === 0 || isFinished}
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
                onClick={() => setSimulationSpeed(s)}
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
            onClick={() => loadScenario('MIXED')}
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

        {/* Right: Workload Scenario Switcher */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-[#6e7681] uppercase mr-0.5">SCENARIO:</span>
          {(['MIXED', 'CPU_HEAVY', 'INTERACTIVE', 'STARVATION', 'UNCERTAIN'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => loadScenario(sc)}
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
              onClick={() => setAlgorithm(algo)}
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

      {/* Empty State Banner if no processes loaded */}
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
              onClick={() => loadScenario('MIXED')}
              className="px-3 py-1.5 bg-amber-500 text-black font-bold uppercase text-xs"
            >
              [ MIXED WORKLOAD ]
            </button>
            <button
              onClick={() => loadScenario('CPU_HEAVY')}
              className="px-3 py-1.5 bg-[#161b22] text-[#c9d1d9] border border-[#30363d] font-bold uppercase text-xs hover:bg-[#21262d]"
            >
              [ CPU HEAVY ]
            </button>
            <button
              onClick={() => loadScenario('INTERACTIVE')}
              className="px-3 py-1.5 bg-[#161b22] text-[#c9d1d9] border border-[#30363d] font-bold uppercase text-xs hover:bg-[#21262d]"
            >
              [ INTERACTIVE ]
            </button>
            <button
              onClick={() => loadScenario('STARVATION')}
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

              {/* Starvation & Aging Telemetry Panel */}
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
