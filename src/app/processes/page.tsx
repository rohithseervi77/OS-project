'use client';

import React, { useState, useEffect } from 'react';
import { Process, ProcessType, WorkloadCharacteristics } from '../../lib/types';
import { generateProcesses, createManualProcess } from '../../lib/workload/generator';
import { analyzeWorkload } from '../../lib/workload/analyzer';
import ProcessTable from '../../components/ProcessTable';
import { 
  Plus, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Cpu, 
  X,
  Play,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [processCount, setProcessCount] = useState<number>(10);
  const [seed, setSeed] = useState<number>(42);
  const [scenario, setScenario] = useState<'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN'>('MIXED');
  const [alpha, setAlpha] = useState<number>(0.5);
  const [workload, setWorkload] = useState<WorkloadCharacteristics | null>(null);

  // Manual process creation modal state
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualPid, setManualPid] = useState<string>('');
  const [manualArrival, setManualArrival] = useState<number>(0);
  const [manualBurst, setManualBurst] = useState<number>(10);
  const [manualPriority, setManualPriority] = useState<number>(3);
  const [manualType, setManualType] = useState<ProcessType>('CPU-bound');
  const [manualHistory, setManualHistory] = useState<string>('8, 11, 9, 10');

  useEffect(() => {
    handleGenerate(10, 42, 'MIXED', 0.5);
  }, []);

  const handleGenerate = (
    count = processCount, 
    currentSeed = seed, 
    currentScenario = scenario, 
    currentAlpha = alpha
  ) => {
    const generated = generateProcesses({
      count,
      seed: currentSeed,
      scenario: currentScenario,
      alpha: currentAlpha,
    });
    setProcesses(generated);
    setWorkload(analyzeWorkload(generated));
  };

  const handleScenarioChange = (sc: 'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN') => {
    setScenario(sc);
    handleGenerate(processCount, seed, sc, alpha);
  };

  const handleAddManualProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = manualPid.trim() || `P${processes.length + 1}`;
    const newProcess = createManualProcess(
      pid,
      manualArrival,
      manualBurst,
      manualPriority,
      manualType,
      manualHistory,
      alpha
    );
    const updated = [...processes, newProcess];
    setProcesses(updated);
    setWorkload(analyzeWorkload(updated));
    setShowManualModal(false);
    setManualPid('');
    setManualArrival(0);
    setManualBurst(10);
    setManualPriority(3);
    setManualHistory('8, 10, 9');
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 font-mono text-xs space-y-5">
      {/* Header (Section 10) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              PROCESS MONITOR // KERNEL WORKLOAD MANAGER
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Deterministic process generation, initial PCB memory allocation, and historical burst telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#f3f4f6] font-bold uppercase transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            MANUAL PROCESS
          </button>

          <Link
            href="/scheduler"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            DISPATCH IN SIMULATOR
          </Link>
        </div>
      </div>

      {/* Scenario & Generation Control Bar */}
      <div className="bg-[#13171d] border border-[#21262d] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#21262d]">
          {/* Workload Scenarios */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#6e7681] uppercase font-bold mr-1">SCENARIOS:</span>
            {(['MIXED', 'CPU_HEAVY', 'INTERACTIVE', 'STARVATION', 'UNCERTAIN'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => handleScenarioChange(sc)}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold transition-colors ${
                  scenario === sc
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
                }`}
              >
                {sc.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Preset Process Counts */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-[#6e7681] uppercase font-bold mr-1">COUNT:</span>
            {[5, 10, 20, 50].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setProcessCount(c);
                  handleGenerate(c, seed, scenario, alpha);
                }}
                className={`px-2 py-0.5 font-bold ${
                  processCount === c
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#f3f4f6]'
                }`}
              >
                {c}
              </button>
            ))}

            {/* Seed input */}
            <div className="flex items-center gap-1 ml-2 bg-[#0d0f12] border border-[#21262d] px-2 py-0.5">
              <span className="text-[#6e7681] text-[9px] uppercase">SEED:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => {
                  const s = parseInt(e.target.value) || 0;
                  setSeed(s);
                  handleGenerate(processCount, s, scenario, alpha);
                }}
                className="w-12 bg-transparent text-amber-400 font-bold focus:outline-hidden text-[10px]"
              />
            </div>
          </div>
        </div>

        {/* Workload Profile Section (Section 15) */}
        {workload && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-[10px]">
            <div className="p-2 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">CPU BURSTS</span>
              <span className="text-amber-400 font-bold text-xs">
                {workload.avgBurst}ms avg <span className="text-[9px] text-[#8b949e]">({workload.medianBurst}ms med)</span>
              </span>
            </div>

            <div className="p-2 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">I/O FREQUENCY</span>
              <span className="text-[#38bdf8] font-bold text-xs">
                {workload.ioBoundPercentage + workload.interactivePercentage}%
              </span>
            </div>

            <div className="p-2 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">BURST VARIANCE</span>
              <span className="text-[#f3f4f6] font-bold text-xs">
                {workload.burstVariance} ms²
              </span>
            </div>

            <div className="p-2 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">QUEUE PRESSURE</span>
              <span className="text-emerald-400 font-bold text-xs">
                {workload.totalProcesses} tasks <span className="text-[9px] text-[#8b949e]">({workload.arrivalDensity} arr/ms)</span>
              </span>
            </div>

            <div className="p-2 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">PREDICTION CONFIDENCE</span>
              <span className="text-emerald-400 font-bold text-xs">
                {workload.burstVariance > 40 ? '68%' : '84%'} EST.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dense Process Monitor Table */}
      <ProcessTable
        processes={processes}
        title="KERNEL WORKLOAD PCB RUNQUEUE"
      />

      {/* Manual Process Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono text-xs">
          <div className="w-full max-w-md bg-[#13171d] border border-[#21262d] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
              <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs">
                CREATE MANUAL PROCESS (PCB)
              </span>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[#8b949e] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualProcess} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Process ID</label>
                  <input
                    type="text"
                    placeholder={`P${processes.length + 1}`}
                    value={manualPid}
                    onChange={(e) => setManualPid(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Arrival Time (ms)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualArrival}
                    onChange={(e) => setManualArrival(Number(e.target.value))}
                    className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Burst Time (ms)</label>
                  <input
                    type="number"
                    min="1"
                    value={manualBurst}
                    onChange={(e) => setManualBurst(Number(e.target.value))}
                    className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Priority (1 = high)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualPriority}
                    onChange={(e) => setManualPriority(Number(e.target.value))}
                    className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Process Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as ProcessType)}
                  className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                >
                  <option value="CPU-bound">CPU-bound</option>
                  <option value="I/O-bound">I/O-bound</option>
                  <option value="Interactive">Interactive</option>
                  <option value="Batch">Batch</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-[#6e7681] uppercase block mb-1">Burst History (comma-separated)</label>
                <input
                  type="text"
                  value={manualHistory}
                  onChange={(e) => setManualHistory(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#21262d]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 bg-[#161b22] text-[#8b949e] hover:text-white border border-[#30363d]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase"
                >
                  INSERT PROCESS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
