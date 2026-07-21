import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SB_URL, SB_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('jisikin_answers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'not found', detail: error?.message, hint: error?.hint },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
