'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  Process, 
  PCB, 
  AlgorithmType, 
  GanttSegment, 
  SchedulerMetrics, 
  SmartDecision, 
  WorkloadCharacteristics,
  ObjectiveWeights 
} from '../lib/types';
import { generateProcesses } from '../lib/workload/generator';
import { analyzeWorkload } from '../lib/workload/analyzer';
import { evaluateSmartScheduler, DEFAULT_OBJECTIVE_WEIGHTS } from '../lib/scheduler/smartScheduler';
import { DiscreteEventSimulationEngine } from '../lib/simulation/engine';
import { SimulationEvent } from '../lib/simulation/events';
import { createPCB } from '../lib/pcb';

export type WorkloadScenario = 'MIXED' | 'CPU_HEAVY' | 'INTERACTIVE' | 'STARVATION' | 'UNCERTAIN';

interface SimulationContextType {
  // Authoritative workload & config
  processes: Process[];
  scenario: WorkloadScenario;
  seed: number;
  processCount: number;
  activeAlgorithm: AlgorithmType;
  weights: ObjectiveWeights;
  agingThreshold: number;
  alpha: number;
  quantum: number;

  // Active Simulation Runtime State
  currentTime: number;
  currentRunning: PCB | null;
  readyQueue: PCB[];
  completedProcesses: PCB[];
  gantt: GanttSegment[];
  events: SimulationEvent[];
  isFinished: boolean;
  isPlaying: boolean;
  speed: number;
  contextSwitches: number;
  metrics: SchedulerMetrics | null;
  smartDecision: SmartDecision | null;
  workload: WorkloadCharacteristics | null;

  // Selected Process Inspector
  selectedPid: string | null;
  inspectPCB: PCB | null;
  setSelectedPid: (pid: string | null) => void;
  setInspectPCB: (pcb: PCB | null) => void;

  // Actions
  loadScenario: (scenario: WorkloadScenario, count?: number, seed?: number) => void;
  setProcessesList: (processes: Process[]) => void;
  setAlgorithm: (algo: AlgorithmType) => void;
  updateWeights: (weights: ObjectiveWeights) => void;
  updateSettings: (settings: { agingThreshold?: number; alpha?: number; quantum?: number }) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WEIGHTS: 'kernel_lab_weights',
  SETTINGS: 'kernel_lab_settings',
};

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  // Config state
  const [scenario, setScenario] = useState<WorkloadScenario>('MIXED');
  const [seed, setSeed] = useState<number>(42);
  const [processCount, setProcessCount] = useState<number>(10);
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>('SMART');
  const [weights, setWeights] = useState<ObjectiveWeights>(DEFAULT_OBJECTIVE_WEIGHTS);
  const [agingThreshold, setAgingThreshold] = useState<number>(10);
  const [alpha, setAlpha] = useState<number>(0.5);
  const [quantum, setQuantum] = useState<number>(4);

  // Processes & Analysis
  const [processes, setProcesses] = useState<Process[]>([]);
  const [workload, setWorkload] = useState<WorkloadCharacteristics | null>(null);
  const [smartDecision, setSmartDecision] = useState<SmartDecision | null>(null);

  // Runtime engine states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentRunning, setCurrentRunning] = useState<PCB | null>(null);
  const [readyQueue, setReadyQueue] = useState<PCB[]>([]);
  const [completedProcesses, setCompletedProcesses] = useState<PCB[]>([]);
  const [gantt, setGantt] = useState<GanttSegment[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [contextSwitches, setContextSwitches] = useState<number>(0);
  const [metrics, setMetrics] = useState<SchedulerMetrics | null>(null);

  // Inspector
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [inspectPCB, setInspectPCB] = useState<PCB | null>(null);

  const engineRef = useRef<DiscreteEventSimulationEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved settings on mount if available
  useEffect(() => {
    try {
      const savedWeights = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
      if (savedWeights) {
        const parsed = JSON.parse(savedWeights);
        setWeights(parsed);
      }
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.agingThreshold) setAgingThreshold(parsed.agingThreshold);
        if (parsed.alpha) setAlpha(parsed.alpha);
        if (parsed.quantum) setQuantum(parsed.quantum);
      }
    } catch {
      // LocalStorage not available or parse error
    }
  }, []);

  const updateUIFromEngine = useCallback((state: any) => {
    setCurrentTime(state.currentTime);
    setCurrentRunning(state.currentRunning);
    setReadyQueue(state.readyQueue);
    setCompletedProcesses(state.completedProcesses || []);
    setGantt(state.gantt);
    setEvents(state.eventLog);
    setIsFinished(state.isFinished);
    setContextSwitches(state.contextSwitches);
    setMetrics(state.metrics);
  }, []);

  // Initialize engine with given processes and algorithm
  const initEngine = useCallback((
    procs: Process[], 
    algo: AlgorithmType, 
    dynQuantum: number, 
    agingTh: number,
    alphaVal: number
  ) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);

    const targetAlgo = algo;
    const engine = new DiscreteEventSimulationEngine(procs, {
      algorithm: targetAlgo,
      quantum: dynQuantum,
      agingThreshold: agingTh,
      usePrediction: true,
    });
    engineRef.current = engine;
    updateUIFromEngine(engine.getState());
  }, [updateUIFromEngine]);

  // Load workload scenario
  const loadScenario = useCallback((
    sc: WorkloadScenario, 
    count: number = processCount, 
    currentSeed: number = seed
  ) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);

    setScenario(sc);
    setProcessCount(count);
    setSeed(currentSeed);

    const procs = generateProcesses({ count, seed: currentSeed, scenario: sc, alpha });
    setProcesses(procs);

    const wl = analyzeWorkload(procs);
    setWorkload(wl);

    const evaluation = evaluateSmartScheduler(procs, weights, agingThreshold);
    setSmartDecision(evaluation.decision);

    const chosenAlgo = activeAlgorithm === 'SMART' ? evaluation.decision.selectedAlgorithm : activeAlgorithm;
    const chosenQuantum = evaluation.decision.dynamicQuantum || quantum;

    initEngine(procs, chosenAlgo, chosenQuantum, agingThreshold, alpha);
  }, [processCount, seed, alpha, weights, agingThreshold, activeAlgorithm, quantum, initEngine]);

  // Set explicit custom processes list
  const setProcessesList = useCallback((newProcs: Process[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);

    setProcesses(newProcs);
    const wl = analyzeWorkload(newProcs);
    setWorkload(wl);

    const evaluation = evaluateSmartScheduler(newProcs, weights, agingThreshold);
    setSmartDecision(evaluation.decision);

    const chosenAlgo = activeAlgorithm === 'SMART' ? evaluation.decision.selectedAlgorithm : activeAlgorithm;
    initEngine(newProcs, chosenAlgo, evaluation.decision.dynamicQuantum || quantum, agingThreshold, alpha);
  }, [weights, agingThreshold, activeAlgorithm, quantum, alpha, initEngine]);

  // Initial mount load
  useEffect(() => {
    loadScenario('MIXED', 10, 42);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // Run once on mount

  // Simulation controls
  const startSimulation = useCallback(() => {
    if (isPlaying || !engineRef.current || isFinished) return;
    setIsPlaying(true);
    const tickMs = Math.max(20, Math.floor(100 / speed));

    intervalRef.current = setInterval(() => {
      if (!engineRef.current) return;
      const state = engineRef.current.step();
      updateUIFromEngine(state);
      if (state.isFinished) {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, tickMs);
  }, [isPlaying, isFinished, speed, updateUIFromEngine]);

  const pauseSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const stepSimulation = useCallback(() => {
    if (isPlaying || !engineRef.current || isFinished) return;
    const state = engineRef.current.step();
    updateUIFromEngine(state);
    if (state.isFinished) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, isFinished, updateUIFromEngine]);

  const resetSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    if (engineRef.current) {
      engineRef.current.reset();
      updateUIFromEngine(engineRef.current.getState());
    }
  }, [updateUIFromEngine]);

  const setSimulationSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const tickMs = Math.max(20, Math.floor(100 / newSpeed));
      intervalRef.current = setInterval(() => {
        if (!engineRef.current) return;
        const state = engineRef.current.step();
        updateUIFromEngine(state);
        if (state.isFinished) {
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, tickMs);
    }
  }, [isPlaying, updateUIFromEngine]);

  const setAlgorithm = useCallback((algo: AlgorithmType) => {
    setActiveAlgorithm(algo);
    const targetAlgo = algo === 'SMART' && smartDecision ? smartDecision.selectedAlgorithm : algo;
    initEngine(processes, targetAlgo, smartDecision?.dynamicQuantum || quantum, agingThreshold, alpha);
  }, [smartDecision, processes, quantum, agingThreshold, alpha, initEngine]);

  const updateWeights = useCallback((newWeights: ObjectiveWeights) => {
    setWeights(newWeights);
    try {
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(newWeights));
    } catch {}

    if (processes.length > 0) {
      const evaluation = evaluateSmartScheduler(processes, newWeights, agingThreshold);
      setSmartDecision(evaluation.decision);
      if (activeAlgorithm === 'SMART') {
        initEngine(processes, evaluation.decision.selectedAlgorithm, evaluation.decision.dynamicQuantum || quantum, agingThreshold, alpha);
      }
    }
  }, [processes, agingThreshold, activeAlgorithm, quantum, alpha, initEngine]);

  const updateSettings = useCallback((settings: { agingThreshold?: number; alpha?: number; quantum?: number }) => {
    if (settings.agingThreshold !== undefined) setAgingThreshold(settings.agingThreshold);
    if (settings.alpha !== undefined) setAlpha(settings.alpha);
    if (settings.quantum !== undefined) setQuantum(settings.quantum);

    try {
      const merged = {
        agingThreshold: settings.agingThreshold ?? agingThreshold,
        alpha: settings.alpha ?? alpha,
        quantum: settings.quantum ?? quantum,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    } catch {}

    const newAlpha = settings.alpha ?? alpha;
    const newAging = settings.agingThreshold ?? agingThreshold;
    const newQuantum = settings.quantum ?? quantum;

    // Recompute processes with new alpha
    if (processes.length > 0) {
      const recomputed = processes.map(p => {
        const pred = createPCB(p);
        return {
          ...p,
          predictedBurst: pred.prediction,
          confidence: pred.predictionConfidence,
        };
      });
      setProcesses(recomputed);
      const wl = analyzeWorkload(recomputed);
      setWorkload(wl);
      const evalRes = evaluateSmartScheduler(recomputed, weights, newAging);
      setSmartDecision(evalRes.decision);
      const targetAlgo = activeAlgorithm === 'SMART' ? evalRes.decision.selectedAlgorithm : activeAlgorithm;
      initEngine(recomputed, targetAlgo, evalRes.decision.dynamicQuantum || newQuantum, newAging, newAlpha);
    }
  }, [agingThreshold, alpha, quantum, processes, weights, activeAlgorithm, initEngine]);

  const handleSelectPid = useCallback((pid: string | null) => {
    setSelectedPid(pid);
    if (!pid) {
      setInspectPCB(null);
      return;
    }
    const found = readyQueue.find(p => p.pid === pid) || (currentRunning?.pid === pid ? currentRunning : null);
    if (found) {
      setInspectPCB(found);
    } else {
      const completed = completedProcesses.find(p => p.pid === pid);
      if (completed) {
        setInspectPCB(completed);
      } else {
        const proc = processes.find(p => p.pid === pid);
        if (proc) setInspectPCB(createPCB(proc));
      }
    }
  }, [readyQueue, currentRunning, completedProcesses, processes]);

  const value = {
    processes,
    scenario,
    seed,
    processCount,
    activeAlgorithm,
    weights,
    agingThreshold,
    alpha,
    quantum,
    currentTime,
    currentRunning,
    readyQueue,
    completedProcesses,
    gantt,
    events,
    isFinished,
    isPlaying,
    speed,
    contextSwitches,
    metrics,
    smartDecision,
    workload,
    selectedPid,
    inspectPCB,
    setSelectedPid: handleSelectPid,
    setInspectPCB,
    loadScenario,
    setProcessesList,
    setAlgorithm,
    updateWeights,
    updateSettings,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    setSimulationSpeed,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
