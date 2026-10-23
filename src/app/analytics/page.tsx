'use client';

import React, { useState, useEffect } from 'react';
import { Process, SchedulingResult, AlgorithmType } from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { runFCFS } from '../../lib/scheduler/fcfs';
import { runSJF } from '../../lib/scheduler/sjf';
import { runSRTF } from '../../lib/scheduler/srtf';
import { runRoundRobin } from '../../lib/scheduler/roundRobin';
import { runPriority } from '../../lib/scheduler/priority';
import { runMLFQ } from '../../lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '../../lib/scheduler/smartScheduler';
import { useSimulation, WorkloadScenario } from '../../context/SimulationContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { Play, RotateCcw, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

interface BenchmarkRow {
  name: string;
  code: AlgorithmType | 'SMART';
  isSmart: boolean;
  wt: number;
  tat: number;
  rt: number;
  cpuUtil: number;
  fairness: number;
  cs: number;
  score: number;
}

export default function AnalyticsPage() {
  const { processes: contextProcesses, weights, agingThreshold } = useSimulation();

  const [scenario, setScenario] = useState<WorkloadScenario>('MIXED');
  const [processCount, setProcessCount] = useState<number>(10);
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [activeMetricTab, setActiveMetricTab] = useState<'wt' | 'rt' | 'tat' | 'cpuUtil' | 'fairness' | 'cs'>('wt');
  const [useActiveContext, setUseActiveContext] = useState<boolean>(false);

  useEffect(() => {
    runBenchmark('MIXED', 10, false);
  }, []);

  const runBenchmark = (
    sc: WorkloadScenario = scenario, 
    count: number = processCount, 
    useCurrentContext: boolean = useActiveContext
  ) => {
    setScenario(sc);
    const procs = (useCurrentContext && contextProcesses.length > 0)
      ? contextProcesses
      : generateProcesses({ count, seed: 42, scenario: sc });

    if (procs.length === 0) {
      setRows([]);
      return;
    }

    const smart = evaluateSmartScheduler(procs, weights, agingThreshold);
    const dynQ = smart.decision.dynamicQuantum || 4;

    const fcfs = runFCFS(procs);
    const sjf = runSJF(procs, smart.decision.confidenceLevel !== 'LOW');
    const srtf = runSRTF(procs, smart.decision.confidenceLevel !== 'LOW');
    const rr = runRoundRobin(procs, dynQ);
    const prio = runPriority(procs, { preemptive: true, agingThreshold });
    const mlfq = runMLFQ(procs, { q0Quantum: Math.max(1, Math.round(dynQ / 2)), q1Quantum: dynQ, boostInterval: 25 });

    const getScore = (algo: AlgorithmType): number => {
      const match = smart.decision.candidateScores.find(c => c.algorithm === algo);
      return match ? Math.round(match.score * 100) : 0;
    };

    const benchmarkData: BenchmarkRow[] = [
      { name: 'FCFS', code: 'FCFS', isSmart: false, wt: fcfs.metrics.avgWaitingTime, tat: fcfs.metrics.avgTurnaroundTime, rt: fcfs.metrics.avgResponseTime, cpuUtil: fcfs.metrics.cpuUtilization, fairness: fcfs.metrics.fairness, cs: fcfs.metrics.contextSwitches, score: getScore('FCFS') },
      { name: 'SJF', code: 'SJF', isSmart: false, wt: sjf.metrics.avgWaitingTime, tat: sjf.metrics.avgTurnaroundTime, rt: sjf.metrics.avgResponseTime, cpuUtil: sjf.metrics.cpuUtilization, fairness: sjf.metrics.fairness, cs: sjf.metrics.contextSwitches, score: getScore('SJF') },
      { name: 'SRTF', code: 'SRTF', isSmart: false, wt: srtf.metrics.avgWaitingTime, tat: srtf.metrics.avgTurnaroundTime, rt: srtf.metrics.avgResponseTime, cpuUtil: srtf.metrics.cpuUtilization, fairness: srtf.metrics.fairness, cs: srtf.metrics.contextSwitches, score: getScore('SRTF') },
      { name: `RR (q=${dynQ})`, code: 'RR', isSmart: false, wt: rr.metrics.avgWaitingTime, tat: rr.metrics.avgTurnaroundTime, rt: rr.metrics.avgResponseTime, cpuUtil: rr.metrics.cpuUtilization, fairness: rr.metrics.fairness, cs: rr.metrics.contextSwitches, score: getScore('RR') },
      { name: 'PRIORITY', code: 'PRIORITY', isSmart: false, wt: prio.metrics.avgWaitingTime, tat: prio.metrics.avgTurnaroundTime, rt: prio.metrics.avgResponseTime, cpuUtil: prio.metrics.cpuUtilization, fairness: prio.metrics.fairness, cs: prio.metrics.contextSwitches, score: getScore('PRIORITY') },
      { name: 'MLFQ', code: 'MLFQ', isSmart: false, wt: mlfq.metrics.avgWaitingTime, tat: mlfq.metrics.avgTurnaroundTime, rt: mlfq.metrics.avgResponseTime, cpuUtil: mlfq.metrics.cpuUtilization, fairness: mlfq.metrics.fairness, cs: mlfq.metrics.contextSwitches, score: getScore('MLFQ') },
      { name: `SMART (${smart.decision.selectedAlgorithm})`, code: 'SMART', isSmart: true, wt: smart.bestResult.metrics.avgWaitingTime, tat: smart.bestResult.metrics.avgTurnaroundTime, rt: smart.bestResult.metrics.avgResponseTime, cpuUtil: smart.bestResult.metrics.cpuUtilization, fairness: smart.bestResult.metrics.fairness, cs: smart.bestResult.metrics.contextSwitches, score: Math.round(smart.decision.score * 100) },
    ];

    setRows(benchmarkData);
  };

  // Find optimal scores for highlight (min for latency/switches, max for util/fairness/score)
  const minWT = rows.length > 0 ? Math.min(...rows.map(r => r.wt)) : 0;
  const minRT = rows.length > 0 ? Math.min(...rows.map(r => r.rt)) : 0;
  const minTAT = rows.length > 0 ? Math.min(...rows.map(r => r.tat)) : 0;
  const maxCPU = rows.length > 0 ? Math.max(...rows.map(r => r.cpuUtil)) : 0;
  const maxFairness = rows.length > 0 ? Math.max(...rows.map(r => r.fairness)) : 0;
  const minCS = rows.length > 0 ? Math.min(...rows.map(r => r.cs)) : 0;
  const maxScore = rows.length > 0 ? Math.max(...rows.map(r => r.score)) : 0;

  // Chart dataset based on activeMetricTab
  const chartData = rows.map(r => ({
    name: r.code,
    value: r[activeMetricTab],
    isSmart: r.isSmart,
  }));

  const metricLabels: Record<string, { label: string; unit: string; higherIsBetter: boolean }> = {
    wt: { label: 'Average Waiting Time', unit: 'ms', higherIsBetter: false },
    rt: { label: 'Average Response Time', unit: 'ms', higherIsBetter: false },
    tat: { label: 'Average Turnaround Time', unit: 'ms', higherIsBetter: false },
    cpuUtil: { label: 'CPU Core Utilization', unit: '%', higherIsBetter: true },
    fairness: { label: "Jain's Fairness Index", unit: '', higherIsBetter: true },
    cs: { label: 'Total Context Switches', unit: '', higherIsBetter: false },
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 font-mono text-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              BENCHMARKS // COMPARATIVE ALGORITHM ANALYTICS
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Rigorous empirical benchmarking across classical policies versus adaptive predictive scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/scheduler"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            CONTROL ROOM
          </Link>
        </div>
      </div>

      {/* Benchmark Control Bar */}
      <div className="bg-[#13171d] border border-[#21262d] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Workload Scenarios */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#6e7681] uppercase font-bold mr-1">SCENARIOS:</span>
            {(['MIXED', 'CPU_HEAVY', 'INTERACTIVE', 'STARVATION', 'UNCERTAIN'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => {
                  setUseActiveContext(false);
                  runBenchmark(sc, processCount, false);
                }}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold transition-colors ${
                  !useActiveContext && scenario === sc
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
                }`}
              >
                {sc.replace('_', ' ')}
              </button>
            ))}

            <button
              onClick={() => {
                setUseActiveContext(true);
                runBenchmark(scenario, processCount, true);
              }}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold transition-colors ${
                useActiveContext
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-[#f3f4f6] border border-[#30363d]'
              }`}
            >
              CURRENT SIMULATOR TASKS ({contextProcesses.length})
            </button>
          </div>

          {/* Preset Process Counts */}
          {!useActiveContext && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-[#6e7681] uppercase font-bold mr-1">COUNT:</span>
              {[5, 10, 20, 50].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setProcessCount(c);
                    runBenchmark(scenario, c, false);
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
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-[#21262d] bg-[#13171d] p-8 text-center space-y-3">
          <h2 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
            NO BENCHMARK DATA
          </h2>
          <p className="text-xs text-[#8b949e]">
            Select a workload scenario above to generate empirical scheduling benchmarks.
          </p>
          <button
            onClick={() => runBenchmark('MIXED', 10, false)}
            className="px-3 py-1.5 bg-amber-500 text-black font-bold uppercase text-xs"
          >
            RUN MIXED BENCHMARK
          </button>
        </div>
      ) : (
        <>
          {/* Main Benchmark Comparison Table */}
          <div className="border border-[#21262d] bg-[#13171d] shadow-xl overflow-x-auto">
            <div className="p-2.5 border-b border-[#21262d] bg-[#0e1116] flex items-center justify-between">
              <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs">
                CROSS-ALGORITHM EVALUATION MATRIX
              </span>
              <span className="text-[10px] text-[#8b949e]">
                EVALUATED ON UNIFORM WORKLOAD INSTANCE
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0a0c0e] text-[#6e7681] text-[9px] uppercase font-bold">
                  <th className="py-2.5 px-3">ALGORITHM POLICY</th>
                  <th className="py-2.5 px-3 text-right">WAIT TIME (AVG)</th>
                  <th className="py-2.5 px-3 text-right">TURNAROUND</th>
                  <th className="py-2.5 px-3 text-right">RESPONSE</th>
                  <th className="py-2.5 px-3 text-right">CPU UTIL</th>
                  <th className="py-2.5 px-3 text-right">JAIN FAIRNESS</th>
                  <th className="py-2.5 px-3 text-right">SWITCHES</th>
                  <th className="py-2.5 px-3 text-right">UTILITY SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2128] font-mono text-[11px]">
                {rows.map((r, i) => {
                  const isBestWT = r.wt === minWT;
                  const isBestTAT = r.tat === minTAT;
                  const isBestRT = r.rt === minRT;
                  const isBestCPU = r.cpuUtil === maxCPU;
                  const isBestFair = r.fairness === maxFairness;
                  const isBestCS = r.cs === minCS;
                  const isBestScore = r.score === maxScore;

                  return (
                    <tr
                      key={i}
                      className={`hover:bg-[#161b22] transition-colors ${
                        r.isSmart ? 'bg-amber-500/5 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className={`flex items-center gap-1.5 ${r.isSmart ? 'text-amber-400' : 'text-[#f3f4f6]'}`}>
                          {r.isSmart && <span className="text-amber-400 font-bold">★</span>}
                          {r.name}
                        </span>
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestWT ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.wt.toFixed(1)}ms {isBestWT && '✓'}
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestTAT ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.tat.toFixed(1)}ms
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestRT ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.rt.toFixed(1)}ms {isBestRT && '✓'}
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestCPU ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.cpuUtil}%
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestFair ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.fairness.toFixed(3)}
                      </td>

                      <td className={`py-2.5 px-3 text-right ${isBestCS ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}`}>
                        {r.cs}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 font-bold ${
                          isBestScore ? 'bg-amber-500 text-black' : 'bg-[#0d0f12] text-[#8b949e] border border-[#21262d]'
                        }`}>
                          {r.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Metric Selector Tabs & Comparative Bar Chart */}
          <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#21262d] pb-2.5 gap-2">
              <div>
                <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs block">
                  METRIC VISUALIZATION // {metricLabels[activeMetricTab].label.toUpperCase()}
                </span>
                <span className="text-[10px] text-[#8b949e]">
                  {metricLabels[activeMetricTab].higherIsBetter ? 'HIGHER VALUE IS OPTIMAL' : 'LOWER VALUE IS OPTIMAL'}
                </span>
              </div>

              {/* Metric Tabs */}
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                {(['wt', 'rt', 'tat', 'cpuUtil', 'fairness', 'cs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveMetricTab(tab)}
                    className={`px-2 py-1 font-bold uppercase transition-colors ${
                      activeMetricTab === tab
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#0d0f12] text-[#8b949e] hover:text-white border border-[#21262d]'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2530" />
                  <XAxis dataKey="name" stroke="#6e7681" tick={{ fontSize: 10, fill: '#8b949e' }} />
                  <YAxis stroke="#6e7681" tick={{ fontSize: 10, fill: '#8b949e' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#13171d', borderColor: '#30363d', fontSize: '11px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#f3f4f6' }}
                    formatter={(val: any) => [`${val} ${metricLabels[activeMetricTab].unit}`, metricLabels[activeMetricTab].label]}
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isSmart ? '#f59e0b' : '#38bdf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
