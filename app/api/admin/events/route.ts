import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bororefund2025';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다' }, { status: 401 });
  }

  // anon 키 사용 — tracking_events는 PII 없음, RLS SELECT 정책으로 제어
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
