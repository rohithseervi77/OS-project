import { NextResponse } from 'next/server';
import { DiscreteEventSimulationEngine } from '@/lib/simulation/engine';
import { generateProcesses } from '@/lib/workload/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const processes = body.processes || generateProcesses({ count: 10, seed: 42 });
    const engine = new DiscreteEventSimulationEngine(processes, {
      algorithm: body.algorithm || 'RR',
      quantum: body.quantum || 4,
    });
    engine.reset();
    return NextResponse.json({ success: true, state: engine.getState() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
