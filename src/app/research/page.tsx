'use client';

import React, { useState } from 'react';
import { AlgorithmType, Process } from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { runFCFS } from '../../lib/scheduler/fcfs';
import { runSJF } from '../../lib/scheduler/sjf';
import { runSRTF } from '../../lib/scheduler/srtf';
import { runRoundRobin } from '../../lib/scheduler/roundRobin';
import { runPriority } from '../../lib/scheduler/priority';
import { runMLFQ } from '../../lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '../../lib/scheduler/smartScheduler';
import { Play, RotateCcw, Download, Check, ShieldCheck, Activity } from 'lucide-react';

interface ExperimentMetric {
  algorithm: string;
  runs: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  avgTurnaroundTime: number;
  cpuUtilization: number;
  fairness: number;
  contextSwitches: number;
}

export default function ResearchModePage() {
  const [scenario, setScenario] = useState<'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN'>('MIXED');
  const [processCount, setProcessCount] = useState<number>(10);
  const [numRuns, setNumRuns] = useState<number>(3);
  const [rrQuantum, setRrQuantum] = useState<number>(4);

  // Selected algorithms checklist
  const [selectedAlgos, setSelectedAlgos] = useState<Record<string, boolean>>({
    FCFS: true,
    SJF: true,
    SRTF: true,
    RR: true,
    PRIORITY: true,
    MLFQ: true,
    SMART: true,
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ExperimentMetric[] | null>(null);

  const toggleAlgo = (algo: string) => {
    setSelectedAlgos(prev => ({ ...prev, [algo]: !prev[algo] }));
  };

  const handleRunExperiment = () => {
    setIsRunning(true);
    setResults(null);

    setTimeout(() => {
      const activeKeys = Object.keys(selectedAlgos).filter(k => selectedAlgos[k]);
      const metricsAccumulator: Record<string, {
        wt: number[];
        rt: number[];
        tat: number[];
        cpu: number[];
        fairness: number[];
        cs: number[];
      }> = {};

      activeKeys.forEach(k => {
        metricsAccumulator[k] = { wt: [], rt: [], tat: [], cpu: [], fairness: [], cs: [] };
      });

      // Run empirical simulations over distinct seeds
      for (let run = 1; run <= numRuns; run++) {
        const seed = 40 + run * 7;
        const procs = generateProcesses({ count: processCount, seed, scenario });

        if (selectedAlgos.FCFS) {
          const res = runFCFS(procs);
          accumulate('FCFS', res);
        }
        if (selectedAlgos.SJF) {
          const res = runSJF(procs, true);
          accumulate('SJF', res);
        }
        if (selectedAlgos.SRTF) {
          const res = runSRTF(procs, true);
          accumulate('SRTF', res);
        }
        if (selectedAlgos.RR) {
          const res = runRoundRobin(procs, rrQuantum);
          accumulate('RR', res);
        }
        if (selectedAlgos.PRIORITY) {
          const res = runPriority(procs, { preemptive: true, agingThreshold: 10 });
          accumulate('PRIORITY', res);
        }
        if (selectedAlgos.MLFQ) {
          const res = runMLFQ(procs, { q0Quantum: 2, q1Quantum: 4, boostInterval: 25 });
          accumulate('MLFQ', res);
        }
        if (selectedAlgos.SMART) {
          const smart = evaluateSmartScheduler(procs);
          accumulate('SMART', smart.bestResult);
        }
      }

      function accumulate(key: string, res: any) {
        if (!metricsAccumulator[key]) return;
        metricsAccumulator[key].wt.push(res.metrics.avgWaitingTime);
        metricsAccumulator[key].rt.push(res.metrics.avgResponseTime);
        metricsAccumulator[key].tat.push(res.metrics.avgTurnaroundTime);
        metricsAccumulator[key].cpu.push(res.metrics.cpuUtilization);
        metricsAccumulator[key].fairness.push(res.metrics.fairness);
        metricsAccumulator[key].cs.push(res.metrics.contextSwitches);
      }

      const compiledResults: ExperimentMetric[] = activeKeys.map(k => {
        const acc = metricsAccumulator[k];
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        return {
          algorithm: k === 'SMART' ? 'SMART ADAPTIVE' : k,
          runs: numRuns,
          avgWaitingTime: Number(avg(acc.wt).toFixed(2)),
          avgResponseTime: Number(avg(acc.rt).toFixed(2)),
          avgTurnaroundTime: Number(avg(acc.tat).toFixed(2)),
          cpuUtilization: Number(avg(acc.cpu).toFixed(1)),
          fairness: Number(avg(acc.fairness).toFixed(3)),
          contextSwitches: Math.round(avg(acc.cs)),
        };
      });

      setResults(compiledResults);
      setIsRunning(false);
    }, 150);
  };

  const handleReset = () => {
    setResults(null);
  };

  // Export results as CSV (Section 20)
  const handleExportCSV = () => {
    if (!results) return;
    const headers = ['Algorithm', 'Evaluation Runs', 'Avg Waiting Time (ms)', 'Avg Response Time (ms)', 'Avg Turnaround Time (ms)', 'CPU Utilization (%)', 'Jain Fairness', 'Context Switches'];
    const rows = results.map(r => [
      `"${r.algorithm}"`,
      r.runs,
      r.avgWaitingTime,
      r.avgResponseTime,
      r.avgTurnaroundTime,
      r.cpuUtilization,
      r.fairness,
      r.contextSwitches,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kernel_lab_research_experiment_${scenario.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 font-mono text-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              RESEARCH MODE // EMPIRICAL BENCHMARK LAB
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Batch experimental execution across multiple workload seeds with empirical metric aggregation and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-emerald-400 font-bold uppercase transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              EXPORT CSV
            </button>
          )}

          <button
            onClick={handleRunExperiment}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            {isRunning ? 'RUNNING EXPERIMENT...' : 'RUN EXPERIMENT'}
          </button>
        </div>
      </div>

      {/* Experiment Configuration Panel (Section 20) */}
      <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
          <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs">
            EXPERIMENT CONFIGURATION PARAMETERS
          </span>
          <span className="text-[10px] text-[#8b949e]">
            CONFIGURED RUNS: <span className="text-amber-400 font-bold">{numRuns}</span> &bull; TASKS/RUN: <span className="text-[#38bdf8] font-bold">{processCount}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
          {/* Workload */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6e7681] uppercase block font-bold">WORKLOAD SCENARIO</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as any)}
              className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white font-mono text-xs"
            >
              <option value="MIXED">MIXED (General Purpose)</option>
              <option value="CPU_HEAVY">CPU HEAVY (Compute Bound)</option>
              <option value="INTERACTIVE">INTERACTIVE (I/O Bound)</option>
              <option value="STARVATION">STARVATION (Extreme Priority)</option>
              <option value="UNCERTAIN">UNCERTAIN (High Variance)</option>
            </select>
          </div>

          {/* Number of Processes */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6e7681] uppercase block font-bold">PROCESS COUNT PER RUN</label>
            <select
              value={processCount}
              onChange={(e) => setProcessCount(Number(e.target.value))}
              className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white font-mono text-xs"
            >
              <option value="5">5 processes</option>
              <option value="10">10 processes</option>
              <option value="15">15 processes</option>
              <option value="20">20 processes</option>
              <option value="30">30 processes</option>
            </select>
          </div>

          {/* Number of Runs */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6e7681] uppercase block font-bold">EVALUATION RUNS</label>
            <select
              value={numRuns}
              onChange={(e) => setNumRuns(Number(e.target.value))}
              className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white font-mono text-xs"
            >
              <option value="1">1 run (Single deterministic)</option>
              <option value="3">3 runs (Empirical average)</option>
              <option value="5">5 runs (High confidence sample)</option>
              <option value="10">10 runs (Extended benchmark)</option>
            </select>
          </div>

          {/* RR Quantum */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6e7681] uppercase block font-bold">RR TIME QUANTUM (MS)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={rrQuantum}
              onChange={(e) => setRrQuantum(Number(e.target.value))}
              className="w-full bg-[#0d0f12] border border-[#21262d] p-1.5 text-white font-mono text-xs"
            />
          </div>
        </div>

        {/* Algorithm Checklist */}
        <div className="space-y-1.5 pt-2 border-t border-[#21262d]">
          <span className="text-[10px] text-[#6e7681] uppercase block font-bold">
            SELECT ALGORITHMS TO BENCHMARK:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.keys(selectedAlgos).map((algo) => {
              const checked = selectedAlgos[algo];
              return (
                <button
                  key={algo}
                  type="button"
                  onClick={() => toggleAlgo(algo)}
                  className={`flex items-center justify-between p-2 border font-bold text-xs transition-colors ${
                    checked
                      ? 'bg-[#18202c] border-amber-500/60 text-amber-400'
                      : 'bg-[#0d0f12] border-[#21262d] text-[#6e7681]'
                  }`}
                >
                  <span>{algo}</span>
                  <span className="text-[11px] font-bold">{checked ? '☑' : '☐'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results / Status Section (Section 20) */}
      <div className="bg-[#13171d] border border-[#21262d] shadow-xl overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-3 py-2 bg-[#0e1116] border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-none ${results ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-[11px]">
              {results ? 'EXPERIMENT COMPLETE // EMPIRICAL DATASET' : 'EXPERIMENT STANDBY // READY TO EXECUTE'}
            </span>
          </div>

          {results && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-white uppercase font-bold"
            >
              <RotateCcw className="h-3 w-3" />
              RESET EXPERIMENT
            </button>
          )}
        </div>

        {!results ? (
          <div className="p-8 text-center text-[#6e7681] bg-[#0d0f12]">
            <span className="text-xs uppercase font-bold text-[#8b949e]">NO EXPERIMENTAL RUNS EXECUTED</span>
            <p className="text-[10px] text-[#484f58] mt-1">
              CLICK &quot;RUN EXPERIMENT&quot; ABOVE TO EXECUTE BATCH SIMULATION
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0d0f12] text-[#8b949e] text-[9px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">ALGORITHM</th>
                  <th className="py-2.5 px-3">RUNS</th>
                  <th className="py-2.5 px-3">AVG WAIT (MS)</th>
                  <th className="py-2.5 px-3">AVG RESPONSE (MS)</th>
                  <th className="py-2.5 px-3">AVG TURNAROUND (MS)</th>
                  <th className="py-2.5 px-3">CPU UTIL (%)</th>
                  <th className="py-2.5 px-3">JAIN FAIRNESS</th>
                  <th className="py-2.5 px-3 text-right">CONTEXT SWITCHES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2128] font-mono text-[11px]">
                {results.map((r) => {
                  const isSmart = r.algorithm.includes('SMART');
                  return (
                    <tr
                      key={r.algorithm}
                      className={`transition-colors ${
                        isSmart
                          ? 'bg-[#181d26] font-bold text-white border-l-2 border-amber-400'
                          : 'hover:bg-[#161b22] text-[#c9d1d9]'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className={isSmart ? 'text-amber-400 font-bold' : 'text-[#f3f4f6]'}>
                          {r.algorithm}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[#8b949e]">
                        {r.runs}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-[#f3f4f6]">
                        {r.avgWaitingTime}
                      </td>

                      <td className="py-2.5 px-3 text-[#c9d1d9]">
                        {r.avgResponseTime}
                      </td>

                      <td className="py-2.5 px-3 text-[#c9d1d9]">
                        {r.avgTurnaroundTime}
                      </td>

                      <td className="py-2.5 px-3 text-amber-300">
                        {r.cpuUtilization}%
                      </td>

                      <td className="py-2.5 px-3 text-emerald-400">
                        {r.fairness}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.contextSwitches}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
