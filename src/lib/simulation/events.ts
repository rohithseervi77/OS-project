import { PCB, Process, ProcessState, AlgorithmType, GanttSegment, SchedulerMetrics } from '../types';

export type SimulationEventType = 
  | 'PROCESS_ARRIVAL'
  | 'SCHEDULE'
  | 'CPU_START'
  | 'CPU_PREEMPT'
  | 'CPU_COMPLETE'
  | 'CONTEXT_SWITCH'
  | 'PROCESS_TERMINATE';

export interface SimulationEvent {
  id: string;
  time: number;
  type: SimulationEventType;
  pid: string;
  description: string;
}

export interface SimulationStepState {
  currentTime: number;
  currentRunning: PCB | null;
  readyQueue: PCB[];
  completedProcesses: PCB[];
  gantt: GanttSegment[];
  eventLog: SimulationEvent[];
  isFinished: boolean;
  contextSwitches: number;
  totalBusyTime: number;
  metrics: SchedulerMetrics;
}
