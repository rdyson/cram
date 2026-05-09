import { describe, expect, it } from 'vitest';
import { coverageScore, diagnosis, masteryScore } from './scoring';

describe('scoring', () => {
  it('scores coverage from mapped excerpts', () => {
    expect(coverageScore(0)).toBe(0);
    expect(coverageScore(1)).toBe(1);
    expect(coverageScore(4)).toBe(3);
    expect(coverageScore(9)).toBe(5);
  });

  it('scores mastery from attempts and confidence', () => {
    expect(masteryScore(0, 0, null)).toBe(0);
    expect(masteryScore(10, 9, 4.2)).toBe(5);
    expect(masteryScore(10, 4, 3)).toBe(2);
  });

  it('detects false familiarity', () => {
    expect(diagnosis({ topic: 'RDS', coverageCount: 4, attempts: 4, correct: 1, avgConfidence: 4 })).toBe('false_familiarity');
  });
});
