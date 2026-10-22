import { NextResponse } from 'next/server';
import { runFCFS } from '@/lib/scheduler/fcfs';
import { runSJF } from '@/lib/scheduler/sjf';
import { runSRTF } from '@/lib/scheduler/srtf';
import { runRoundRobin } from '@/lib/scheduler/roundRobin';
import { runPriority } from '@/lib/scheduler/priority';
import { runMLFQ } from '@/lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '@/lib/scheduler/smartScheduler';
import { generateProcesses } from '@/lib/workload/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const processes = body.processes || generateProcesses({ count: 10, seed: 42 });

    const fcfs = runFCFS(processes);
    const sjf = runSJF(processes, true);
    const srtf = runSRTF(processes, true);
    const rr = runRoundRobin(processes, 4);
    const prio = runPriority(processes, { preemptive: true, agingThreshold: 10 });
    const mlfq = runMLFQ(processes);
    const smart = evaluateSmartScheduler(processes);

    return NextResponse.json({
      success: true,
      comparison: [
        { algorithm: 'FCFS', metrics: fcfs.metrics },
        { algorithm: 'SJF', metrics: sjf.metrics },
        { algorithm: 'SRTF', metrics: srtf.metrics },
        { algorithm: 'Round Robin', metrics: rr.metrics },
        { algorithm: 'Priority', metrics: prio.metrics },
        { algorithm: 'MLFQ', metrics: mlfq.metrics },
        { algorithm: 'SMART', metrics: smart.bestResult.metrics, decision: smart.decision },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
