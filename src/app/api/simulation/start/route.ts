import { NextResponse } from 'next/server';
import { DiscreteEventSimulationEngine } from '@/lib/simulation/engine';
import { generateProcesses } from '@/lib/workload/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const processes = body.processes || generateProcesses({ count: 10, seed: 42 });
    const algorithm = body.algorithm || 'RR';
    const quantum = body.quantum || 4;

    const engine = new DiscreteEventSimulationEngine(processes, {
      algorithm,
      quantum,
      agingThreshold: body.agingThreshold ?? 10,
      usePrediction: body.usePrediction ?? false,
    });

    const state = engine.getState();
    return NextResponse.json({ success: true, state });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
