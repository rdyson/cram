import { describe, expect, it } from 'vitest';
import { validateGeneratedBatch, validationSummary } from './generation';

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

  it('fills missing distractor explanations deterministically', () => {
    const batch = validateGeneratedBatch(JSON.stringify({
      items: [{
        type: 'scenario_question',
        domain: 'Design Resilient Architectures',
        topic: 'RDS Multi-AZ vs read replicas',
        difficulty: 'easy',
        prompt: 'A workload needs automatic database failover. What should be used?',
        answer_choices: [
          { key: 'A', text: 'RDS read replica only' },
          { key: 'B', text: 'RDS Multi-AZ deployment' },
          { key: 'C', text: 'S3 lifecycle rule' },
          { key: 'D', text: 'CloudFront distribution' }
        ],
        correct_answer_key: 'B',
        explanation: 'Multi-AZ provides standby failover for RDS.'
      }]
    }));
    expect(batch.items[0].why_wrong_answers_are_wrong?.A).toContain('not the best fit');
    expect(batch.items[0].why_wrong_answers_are_wrong?.C).toContain('not the best fit');
    expect(batch.items[0].why_wrong_answers_are_wrong?.D).toContain('not the best fit');
  });

  it('does not fail a batch for a short model-generated domain', () => {
    const batch = validateGeneratedBatch(JSON.stringify({
      items: [{
        type: 'flashcard',
        domain: 'x',
        topic: 'Amazon S3',
        difficulty: 'easy',
        prompt: 'What storage service provides object storage in AWS?',
        answer: 'Amazon S3 provides object storage for buckets and objects.',
        explanation: 'S3 is the AWS object storage service commonly tested on SAA-C03.'
      }]
    }));
    expect(batch.items[0].domain).toBeUndefined();
  });

  it('summarizes validation errors for display', () => {
    try {
      validateGeneratedBatch('{"items":[]}');
    } catch (error) {
      expect(validationSummary(error)).toContain('items');
    }
  });
});
