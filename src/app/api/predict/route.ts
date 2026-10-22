import { NextResponse } from 'next/server';
import { analyzeBurstHistory } from '@/lib/prediction/history';
import { ExponentialAveragePredictor } from '@/lib/prediction/predictor';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const history = body.history || [10, 10, 10];
    const alpha = body.alpha ?? 0.5;

    const analysis = analyzeBurstHistory(history, alpha);
    return NextResponse.json({ success: true, analysis });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
