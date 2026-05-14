import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { puzzle_id, time_seconds, mistakes, difficulty } = await req.json();

  if (!puzzle_id || !time_seconds || !difficulty) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, puzzle_id, time_seconds, mistakes: mistakes ?? 0, difficulty })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get('difficulty');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  let query = supabase
    .from('leaderboard')
    .select('*')
    .order('time_seconds', { ascending: true })
    .limit(limit);

  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
