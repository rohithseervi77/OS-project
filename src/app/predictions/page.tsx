'use client';

import React, { useState, useEffect } from 'react';
import { Process } from '../../lib/types';
import { generateProcesses } from '../../lib/workload/generator';
import { analyzeBurstHistory, DetailedProcessPrediction } from '../../lib/prediction/history';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Play, RotateCcw, Cpu, Activity, Sliders } from 'lucide-react';

export default function PredictionsPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedPid, setSelectedPid] = useState<string>('P1');
  const [alpha, setAlpha] = useState<number>(0.5);

  // Interactive Testbench state
  const [testbenchInput, setTestbenchInput] = useState<string>('5, 7, 6, 8, 9, 12, 14');
  const [testbenchResult, setTestbenchResult] = useState<DetailedProcessPrediction | null>(null);

  useEffect(() => {
    const procs = generateProcesses({ count: 10, seed: 42, scenario: 'MIXED' });
    setProcesses(procs);
    setSelectedPid(procs[0]?.pid || 'P1');
    runTestbench('5, 7, 6, 8, 9, 12, 14', 0.5);
  }, []);

  const runTestbench = (inputStr: string, currentAlpha: number) => {
    const numbers = inputStr
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    if (numbers.length > 0) {
      setTestbenchResult(analyzeBurstHistory(numbers, currentAlpha));
    }
  };

  const handleAlphaChange = (newAlpha: number) => {
    setAlpha(newAlpha);
    runTestbench(testbenchInput, newAlpha);
  };

  const handleRunTestbench = (e: React.FormEvent) => {
    e.preventDefault();
    runTestbench(testbenchInput, alpha);
  };

  // Selected process analysis
  const selectedProcess = processes.find(p => p.pid === selectedPid) || processes[0];
  const processAnalysis = selectedProcess 
    ? analyzeBurstHistory(selectedProcess.burstHistory, alpha) 
    : null;

  // Active chart data: testbench result
  const chartData = testbenchResult ? testbenchResult.steps.map((step) => ({
    sequence: `n=${step.step}`,
    actual: step.actual,
    predicted: step.predicted,
  })) : [];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 font-mono text-xs space-y-5">
      {/* Header (Section 12) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#21262d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-none bg-amber-500" />
            <h1 className="text-base font-bold text-[#f3f4f6] uppercase tracking-wider">
              BURST LAB // MATHEMATICAL PREDICTION WORKSTATION
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5 font-sans">
            Exponential smoothing algorithm for future CPU burst estimation and empirical error tracking.
          </p>
        </div>

        {/* Smoothing Factor Alpha Selector */}
        <div className="flex items-center gap-2 bg-[#13171d] border border-[#21262d] p-1.5">
          <span className="text-[10px] text-[#6e7681] px-1 uppercase font-bold">SMOOTHING FACTOR α:</span>
          {[0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((a) => (
            <button
              key={a}
              onClick={() => handleAlphaChange(a)}
              className={`px-2 py-0.5 font-bold transition-colors ${
                alpha === a
                  ? 'bg-amber-500 text-black'
                  : 'text-[#8b949e] hover:text-[#f3f4f6] bg-[#0d0f12] border border-[#21262d]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Specification Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-[#13171d] border border-[#21262d] space-y-1">
          <span className="text-[9px] text-[#6e7681] uppercase font-bold block">EXPONENTIAL AVERAGING FORMULA</span>
          <span className="text-sm font-bold text-[#f3f4f6] block font-mono">
            τ(n+1) = α·t(n) + (1−α)·τ(n)
          </span>
          <span className="text-[9px] text-[#8b949e] block font-mono">
            τ(n+1): Next burst | t(n): Actual burst | τ(n): Prior estimate
          </span>
        </div>

        <div className="p-3 bg-[#13171d] border border-[#21262d] space-y-1">
          <span className="text-[9px] text-[#6e7681] uppercase font-bold block">PERCENTAGE ERROR MEASUREMENT</span>
          <span className="text-sm font-bold text-rose-400 block font-mono">
            Error = |t(n) − τ(n)| / t(n) × 100
          </span>
          <span className="text-[9px] text-[#8b949e] block font-mono">
            Divergence between predicted estimate and physical execution
          </span>
        </div>

        <div className="p-3 bg-[#13171d] border border-[#21262d] space-y-1">
          <span className="text-[9px] text-[#6e7681] uppercase font-bold block">CONFIDENCE METRIC</span>
          <span className="text-sm font-bold text-emerald-400 block font-mono">
            Confidence = max(0, 100 − Error)
          </span>
          <span className="text-[9px] text-[#8b949e] block font-mono">
            Standard mathematical reliability measurement
          </span>
        </div>
      </div>

      {/* Interactive Prediction Testbench (Section 13) */}
      <div className="bg-[#13171d] border border-[#21262d] p-4 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#21262d] pb-3 gap-2">
          <div>
            <span className="font-bold text-[#f3f4f6] uppercase tracking-wider text-xs block">
              INTERACTIVE PREDICTION TESTBENCH
            </span>
            <span className="text-[10px] text-[#8b949e]">
              ENTER ARBITRARY BURST SEQUENCE TO RUN MATHEMATICAL RECURSION
            </span>
          </div>

          <form onSubmit={handleRunTestbench} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={testbenchInput}
              onChange={(e) => setTestbenchInput(e.target.value)}
              placeholder="e.g. 5, 7, 6, 8, 9, 12, 14"
              className="bg-[#0d0f12] border border-[#21262d] px-2.5 py-1 text-white font-mono text-xs w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-colors shrink-0"
            >
              RUN TESTBENCH
            </button>
          </form>
        </div>

        {/* Telemetry Metrics for Testbench */}
        {testbenchResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
            <div className="p-2.5 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">NEXT PREDICTION τ(n+1)</span>
              <span className="text-base font-bold text-[#38bdf8]">{testbenchResult.nextPrediction} ms</span>
            </div>

            <div className="p-2.5 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">PREDICTION ERROR</span>
              <span className="text-base font-bold text-rose-400">{testbenchResult.overallMeanError}%</span>
            </div>

            <div className="p-2.5 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">MEASURED CONFIDENCE</span>
              <span className="text-base font-bold text-emerald-400">{testbenchResult.overallConfidence}%</span>
            </div>

            <div className="p-2.5 bg-[#0d0f12] border border-[#21262d]">
              <span className="text-[#6e7681] block uppercase text-[9px]">BURSTS EVALUATED</span>
              <span className="text-base font-bold text-amber-400">{testbenchResult.steps.length} samples</span>
            </div>
          </div>
        )}

        {/* Visual Graph: ACTUAL vs PREDICTED */}
        <div className="border border-[#21262d] bg-[#0d0f12] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-b border-[#1c2128] pb-1">
            <span>BURST TIME (MS) VS EXECUTION SEQUENCE</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 bg-amber-400 inline-block" /> ACTUAL BURST t(n)
              </span>
              <span className="flex items-center gap-1 text-[#38bdf8]">
                <span className="h-2 w-2 bg-[#38bdf8] inline-block" /> PREDICTED BURST τ(n)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1f2530" />
                <XAxis dataKey="sequence" stroke="#6e7681" tick={{ fontSize: 10, fill: '#8b949e' }} />
                <YAxis stroke="#6e7681" tick={{ fontSize: 10, fill: '#8b949e' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#13171d', borderColor: '#30363d', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Burst t(n)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted τ(n)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step-by-Step Mathematical Trace Table */}
        {testbenchResult && (
          <div className="border border-[#21262d] bg-[#0d0f12] overflow-x-auto">
            <div className="p-2 border-b border-[#21262d] bg-[#0e1116] text-[10px] text-[#8b949e] font-bold uppercase">
              MATHEMATICAL TRACE // EXECUTION SEQUENCE TABLE
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0a0c0e] text-[#6e7681] text-[9px] uppercase font-bold">
                  <th className="py-2 px-3">STEP (n)</th>
                  <th className="py-2 px-3">PREV PREDICTION τ(n)</th>
                  <th className="py-2 px-3">ACTUAL BURST t(n)</th>
                  <th className="py-2 px-3">NEW PREDICTION τ(n+1)</th>
                  <th className="py-2 px-3">ABS ERROR |t - τ|</th>
                  <th className="py-2 px-3">PERCENT ERROR</th>
                  <th className="py-2 px-3 text-right">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2128] font-mono text-[10px]">
                {testbenchResult.steps.map((h, i) => {
                  const nextEst = i < testbenchResult.steps.length - 1 
                    ? `${testbenchResult.steps[i + 1].predicted} ms` 
                    : `${testbenchResult.nextPrediction} ms`;
                  const absErr = Math.abs(h.actual - h.predicted).toFixed(2);
                  return (
                    <tr key={i} className="hover:bg-[#161b22]">
                      <td className="py-2 px-3 text-amber-400 font-bold">#{h.step}</td>
                      <td className="py-2 px-3 text-[#c9d1d9]">{h.predicted} ms</td>
                      <td className="py-2 px-3 text-[#f3f4f6] font-bold">{h.actual} ms</td>
                      <td className="py-2 px-3 text-[#38bdf8] font-bold">{nextEst}</td>
                      <td className="py-2 px-3 text-white">{absErr} ms</td>
                      <td className="py-2 px-3 text-rose-400">{h.error}%</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">{h.confidence}%</td>
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
