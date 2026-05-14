import { supabase } from './supabase';

export async function submitScore({
  difficulty,
  time,
  mistakes,
  stars,
  isDaily,
}: {
  difficulty: string;
  time: number;
  mistakes: number;
  stars: number;
  isDaily?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  let display_name = 'Anonymous';
  let city = '';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, city')
      .eq('id', user.id)
      .single();
    if (profile) {
      display_name = (profile.display_name as string) || 'Anonymous';
      city = (profile.city as string) || '';
    }
  }

  const { error } = await supabase.from('scores').insert({
    user_id: user?.id ?? null,
    display_name,
    city,
    difficulty,
    time_seconds: time,
    mistakes,
    stars,
    puzzle_date: new Date().toISOString().split('T')[0],
    is_daily: isDaily ?? false,
  });

  return { error };
}

export async function getDailyLeaderboard() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('scores')
    .select('display_name, city, time_seconds, mistakes, stars, completed_at')
    .eq('is_daily', true)
    .eq('puzzle_date', today)
    .order('time_seconds', { ascending: true })
    .limit(20);
  return data ?? [];
}

export async function getGlobalLeaderboard(difficulty?: string) {
  let query = supabase
    .from('scores')
    .select('display_name, city, time_seconds, mistakes, stars, difficulty, completed_at')
    .order('time_seconds', { ascending: true })
    .limit(50);
  if (difficulty) query = query.eq('difficulty', difficulty);
  const { data } = await query;
  return data ?? [];
}
