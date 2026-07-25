import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bororefund2025';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다' }, { status: 401 });
  }

  // 환경변수 존재 확인
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({
      ok: false,
      error: '환경변수 미설정',
      debug: { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY }
    }, { status: 500 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  try {
    const url = `${SUPABASE_URL}/rest/v1/tracking_events?select=*&created_at=gte.${since.toISOString()}&order=created_at.desc&limit=500`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ ok: false, error: `Supabase ${res.status}: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });

  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message,
      type: e.constructor?.name,
      cause: e.cause?.message,
    }, { status: 500 });
  }
}
