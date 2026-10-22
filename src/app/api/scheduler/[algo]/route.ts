import { NextResponse } from 'next/server';
import { runFCFS } from '@/lib/scheduler/fcfs';
import { runSJF } from '@/lib/scheduler/sjf';
import { runSRTF } from '@/lib/scheduler/srtf';
import { runRoundRobin } from '@/lib/scheduler/roundRobin';
import { runPriority } from '@/lib/scheduler/priority';
import { runMLFQ } from '@/lib/scheduler/mlfq';
import { evaluateSmartScheduler } from '@/lib/scheduler/smartScheduler';
import { generateProcesses } from '@/lib/workload/generator';

export async function POST(
  request: Request,
  { params }: { params: { algo: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const processes = body.processes || generateProcesses({ count: 10, seed: 42 });
    const algo = (params.algo || '').toLowerCase();

    let result;
    if (algo === 'fcfs') {
      result = runFCFS(processes);
    } else if (algo === 'sjf') {
      result = runSJF(processes, body.usePrediction ?? true);
    } else if (algo === 'srtf') {
      result = runSRTF(processes, body.usePrediction ?? true);
    } else if (algo === 'rr') {
      result = runRoundRobin(processes, body.quantum || 4);
    } else if (algo === 'priority') {
      result = runPriority(processes, {
        preemptive: body.preemptive ?? true,
        agingThreshold: body.agingThreshold ?? 10,
      });
    } else if (algo === 'mlfq') {
      result = runMLFQ(processes, {
        q0Quantum: body.q0Quantum || 2,
        q1Quantum: body.q1Quantum || 4,
        boostInterval: body.boostInterval || 25,
      });
    } else if (algo === 'smart') {
      const evaluation = evaluateSmartScheduler(processes, body.weights, body.agingThreshold);
      return NextResponse.json({
        success: true,
        decision: evaluation.decision,
        result: evaluation.bestResult,
        candidateEvaluations: evaluation.candidateEvaluations,
      });
    } else {
      return NextResponse.json({ success: false, error: `Unknown algorithm ${algo}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
