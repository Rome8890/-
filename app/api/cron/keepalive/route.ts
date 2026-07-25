import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Vercel Cron이 매일 오전 9시(KST)에 호출 — Supabase 일시정지 방지
export async function GET(req: NextRequest) {
  // Vercel Cron 요청 검증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from('tracking_events')
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: 'Supabase keepalive ping 성공',
      at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
