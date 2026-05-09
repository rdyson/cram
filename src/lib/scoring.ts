export type TopicStats = {
  topic: string;
  coverageCount: number;
  attempts: number;
  correct: number;
  avgConfidence: number | null;
};

export function coverageScore(coverageCount: number) {
  if (coverageCount <= 0) return 0;
  if (coverageCount === 1) return 1;
  if (coverageCount <= 3) return 2;
  if (coverageCount <= 5) return 3;
  if (coverageCount <= 8) return 4;
  return 5;
}

export function masteryScore(attempts: number, correct: number, avgConfidence: number | null) {
  if (attempts === 0) return 0;
  const accuracy = correct / attempts;
  const confidence = avgConfidence ?? 3;
  if (accuracy >= 0.9 && confidence >= 4) return 5;
  if (accuracy >= 0.75) return 4;
  if (accuracy >= 0.55) return 3;
  if (accuracy >= 0.35) return 2;
  return 1;
}

export function diagnosis(stats: TopicStats) {
  const coverage = coverageScore(stats.coverageCount);
  const mastery = masteryScore(stats.attempts, stats.correct, stats.avgConfidence);
  if (coverage === 0 && stats.attempts === 0) return 'unseen';
  if (coverage <= 1 && mastery <= 1) return 'coverage_gap';
  if (coverage >= 3 && stats.attempts === 0) return 'untested';
  if (coverage >= 3 && mastery <= 2) return 'false_familiarity';
  if (mastery >= 4) return 'stable';
  return 'shaky';
}
