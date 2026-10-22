import { NextResponse } from 'next/server';
import { generateProcesses } from '@/lib/workload/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = body.count || 10;
    const seed = body.seed || 42;
    const scenario = body.scenario || 'MIXED';
    const alpha = body.alpha || 0.5;

    const processes = generateProcesses({ count, seed, scenario, alpha });
    return NextResponse.json({ success: true, count: processes.length, processes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
