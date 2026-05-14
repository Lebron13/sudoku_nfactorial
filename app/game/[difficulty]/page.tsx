import { redirect } from 'next/navigation';
import { GameView } from '@/components/GameView';

const VALID = ['easy', 'medium', 'hard', 'expert', 'daily'];

export function generateStaticParams() {
  return VALID.map((difficulty) => ({ difficulty }));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty } = await params;
  if (difficulty === 'daily') redirect('/daily');
  if (!VALID.includes(difficulty)) redirect('/');
  return <GameView difficulty={difficulty} />;
}
