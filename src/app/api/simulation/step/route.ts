import { NextResponse } from 'next/server';
import { DiscreteEventSimulationEngine } from '@/lib/simulation/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const processes = body.processes || [];
    const engine = new DiscreteEventSimulationEngine(processes, {
      algorithm: body.algorithm || 'RR',
      quantum: body.quantum || 4,
    });
    // Advance steps
    const stepsCount = body.steps || 1;
    let state = engine.getState();
    for (let i = 0; i < stepsCount; i++) {
      state = engine.step();
      if (state.isFinished) break;
    }
    return NextResponse.json({ success: true, state });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
