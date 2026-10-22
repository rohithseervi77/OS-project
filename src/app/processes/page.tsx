'use client';

import React, { useState, useEffect } from 'react';
import { Process, ProcessType } from '../../lib/types';
import { generateProcesses, createManualProcess } from '../../lib/workload/generator';
import ProcessTable from '../../components/ProcessTable';
import { 
  Plus, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Activity, 
  Cpu, 
  X,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [processCount, setProcessCount] = useState<number>(10);
  const [seed, setSeed] = useState<number>(42);
  const [scenario, setScenario] = useState<'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN'>('MIXED');
  const [alpha, setAlpha] = useState<number>(0.5);

  // Manual creation state
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
    setProcesses((prev) => [...prev, newProcess]);
    setShowManualModal(false);
    setManualPid('');
    setManualArrival(0);
    setManualBurst(10);
    setManualPriority(3);
    setManualHistory('8, 10, 9');
  };

  const avgBurst = processes.length > 0 
    ? (processes.reduce((sum, p) => sum + p.burstTime, 0) / processes.length).toFixed(1)
    : '0';

  const cpuBoundCount = processes.filter(p => p.processType === 'CPU-bound' || p.processType === 'Batch').length;
  const ioBoundCount = processes.filter(p => p.processType === 'I/O-bound' || p.processType === 'Interactive').length;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 font-mono text-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1c2230] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">
              PROCESS MONITOR & KERNEL WORKLOAD MANAGER
            </h1>
          </div>
          <p className="text-xs text-[#8e99b0] mt-1 font-sans">
            Deterministic pseudorandom process generation, initial PCB memory allocation, and historical burst telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#161a24] hover:bg-[#1f2535] text-white border border-[#272e40] font-bold uppercase tracking-wider transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            INSERT CUSTOM PROCESS
          </button>

          <Link
            href="/scheduler"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors"
          >
            <Play className="h-3 w-3 fill-black" />
            RUN IN SIMULATOR
          </Link>
        </div>
      </div>

      {/* Control Panel Ribbon */}
      <div className="rounded-sm border border-[#1e2330] bg-[#0c0e14] p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#181c26] text-[10px] text-[#636d85] uppercase font-bold">
          <span>WORKLOAD CONFIGURATION REGISTERS</span>
          <span>SEED PRNG: DETERMINISTIC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Batch Size */}
          <div>
            <label className="text-[10px] text-[#636d85] block mb-1 uppercase">BATCH SIZE (TASKS)</label>
            <div className="grid grid-cols-4 gap-1">
              {[5, 10, 20, 50].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => {
                    setProcessCount(cnt);
                    handleGenerate(cnt, seed, scenario, alpha);
                  }}
                  className={`py-1 rounded-sm text-[11px] font-bold ${
                    processCount === cnt
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#10131b] text-[#8e99b0] hover:text-white border border-[#1d222f]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selection */}
          <div>
            <label className="text-[10px] text-[#636d85] block mb-1 uppercase">WORKLOAD PROFILE</label>
            <select
              value={scenario}
              onChange={(e) => {
                const sc = e.target.value as any;
                setScenario(sc);
                handleGenerate(processCount, seed, sc, alpha);
              }}
              className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="MIXED">MIXED (BALANCED)</option>
              <option value="CPU_HEAVY">CPU-HEAVY (LONG BURSTS)</option>
              <option value="INTERACTIVE">INTERACTIVE (SHORT BURSTS)</option>
              <option value="STARVATION">STARVATION RISK (AGING TEST)</option>
              <option value="UNCERTAIN">UNCERTAIN (HIGH VARIANCE)</option>
            </select>
          </div>

          {/* Seed Input */}
          <div>
            <label className="text-[10px] text-[#636d85] block mb-1 uppercase">PSEUDORANDOM SEED</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleGenerate(processCount, seed, scenario, alpha)}
                className="px-2.5 py-1 rounded-sm bg-[#151923] hover:bg-[#1e2332] text-amber-400 border border-[#242b3b] font-bold"
              >
                APPLY
              </button>
            </div>
          </div>

          {/* Alpha Selector */}
          <div>
            <label className="text-[10px] text-[#636d85] block mb-1 uppercase">
              SMOOTHING FACTOR α: <span className="text-amber-400">{alpha}</span>
            </label>
            <div className="grid grid-cols-6 gap-1">
              {[0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAlpha(a);
                    handleGenerate(processCount, seed, scenario, a);
                  }}
                  className={`py-1 rounded-sm text-[10px] font-bold ${
                    alpha === a
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#10131b] text-[#8e99b0] hover:text-white border border-[#1d222f]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Loaded Workload</span>
          <span className="text-base font-bold text-white mt-0.5 block">{processes.length} TASKS</span>
        </div>

        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Average Burst Length</span>
          <span className="text-base font-bold text-amber-400 mt-0.5 block">{avgBurst} ms</span>
        </div>

        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">CPU vs I/O Distribution</span>
          <span className="text-base font-bold text-white mt-0.5 block">
            <span className="text-purple-400">{cpuBoundCount} CPU</span> / <span className="text-[#38bdf8]">{ioBoundCount} I/O</span>
          </span>
        </div>

        <div className="p-3 bg-[#0c0e14] border border-[#1e2330] rounded-sm">
          <span className="text-[9px] text-[#636d85] uppercase block">Predictor Readiness</span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">ACTIVE (α={alpha})</span>
        </div>
      </div>

      {/* Main Process Monitor Table */}
      <ProcessTable processes={processes} />

      {/* Custom Process Add Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-sm border border-[#242a38] bg-[#0c0e14] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2230]">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                INSERT CUSTOM PROCESS TO QUEUE
              </span>
              <button onClick={() => setShowManualModal(false)} className="text-[#636d85] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualProcess} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Process ID (PID)</label>
                  <input
                    type="text"
                    placeholder={`P${processes.length + 1}`}
                    value={manualPid}
                    onChange={(e) => setManualPid(e.target.value)}
                    className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Arrival Timestamp (ms)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualArrival}
                    onChange={(e) => setManualArrival(Number(e.target.value))}
                    className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Burst Duration (ms)</label>
                  <input
                    type="number"
                    min="1"
                    value={manualBurst}
                    onChange={(e) => setManualBurst(Number(e.target.value))}
                    className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Priority (1 = High)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualPriority}
                    onChange={(e) => setManualPriority(Number(e.target.value))}
                    className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Process Classification</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as ProcessType)}
                  className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                >
                  <option value="CPU-bound">CPU-bound</option>
                  <option value="I/O-bound">I/O-bound</option>
                  <option value="Interactive">Interactive</option>
                  <option value="Batch">Batch</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#636d85] block mb-1 uppercase">Historical CPU Bursts (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 8, 10, 9, 12"
                  value={manualHistory}
                  onChange={(e) => setManualHistory(e.target.value)}
                  className="w-full rounded-sm bg-[#10131b] border border-[#1d222f] px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1c2230]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded-sm bg-[#141822] text-[#8e99b0] hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase"
                >
                  COMMIT TO PCB HEAP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
