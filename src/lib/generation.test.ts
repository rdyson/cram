import { describe, expect, it } from 'vitest';
import { validateGeneratedBatch } from './generation';

describe('generated item validation', () => {
  it('accepts a valid scenario question', () => {
    const batch = validateGeneratedBatch(JSON.stringify({
      items: [{
        type: 'scenario_question',
        domain: 'Design Resilient Architectures',
        topic: 'RDS Multi-AZ vs read replicas',
        difficulty: 'medium',
        prompt: 'A workload needs automatic database failover. What should be used?',
        answer_choices: [
          { key: 'A', text: 'RDS read replica only' },
          { key: 'B', text: 'RDS Multi-AZ deployment' },
          { key: 'C', text: 'S3 lifecycle rule' },
          { key: 'D', text: 'CloudFront distribution' }
        ],
        correct_answer_key: 'B',
        explanation: 'Multi-AZ provides standby failover for RDS.',
        why_wrong_answers_are_wrong: {
          A: 'Read replicas help read scaling and are not the primary automatic failover answer for standard RDS.',
          C: 'S3 lifecycle rules manage object storage transitions, not database failover.',
          D: 'CloudFront is an edge cache, not a relational database failover feature.'
        }
      }]
    }));
    expect(batch.items).toHaveLength(1);
  });

  it('rejects scenario questions without distractor explanations', () => {
    expect(() => validateGeneratedBatch(JSON.stringify({
      items: [{
        type: 'scenario_question', domain: 'x', topic: 'y', difficulty: 'easy', prompt: 'short prompt',
        answer_choices: [{ key: 'A', text: 'one' }, { key: 'B', text: 'two' }, { key: 'C', text: 'three' }, { key: 'D', text: 'four' }],
        correct_answer_key: 'A', explanation: 'because'
      }]
    }))).toThrow();
  });
});
