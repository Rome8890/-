import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

// 클라이언트는 IP를 모르기 때문에 이 서버 라우트를 거쳐서 기록한다.
// Vercel이 자동으로 붙여주는 지오/IP 헤더를 읽어 metadata에 얹는다.
export async function POST(req: NextRequest) {
  try {
    const { event, metadata = {}, path } = await req.json();

    if (!event) {
      return NextResponse.json({ ok: false, error: 'event is required' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    const enrichedMetadata = {
      ...metadata,
      ip,
      country: req.headers.get('x-vercel-ip-country') || undefined,
      region: req.headers.get('x-vercel-ip-country-region') || undefined,
      city: req.headers.get('x-vercel-ip-city')
        ? decodeURIComponent(req.headers.get('x-vercel-ip-city') as string)
        : undefined,
    };

    const { error } = await supabase.from('tracking_events').insert([
      {
        event_type: event,
        metadata: enrichedMetadata,
        user_agent: req.headers.get('user-agent') || 'unknown',
        path: path || '/',
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Tracking Error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
