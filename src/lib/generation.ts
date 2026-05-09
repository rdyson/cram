import { z } from 'zod';

export const AnswerChoiceSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(3)
});

export const GeneratedItemSchema = z.object({
  type: z.enum(['flashcard', 'scenario_question']),
  topic: z.string().min(3),
  domain: z.string().min(3),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prompt: z.string().min(8),
  answer: z.string().optional(),
  answer_choices: z.array(AnswerChoiceSchema).optional(),
  correct_answer_key: z.enum(['A', 'B', 'C', 'D']).optional(),
  explanation: z.string().min(8),
  why_wrong_answers_are_wrong: z.record(z.string()).optional()
}).superRefine((item, ctx) => {
  if (item.type === 'flashcard') {
    if (!item.answer || item.answer.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'Flashcards require an answer.' });
    }
    return;
  }

  if (!item.answer_choices || item.answer_choices.length !== 4) {
    ctx.addIssue({ code: 'custom', message: 'Scenario questions require exactly four answer choices.' });
  }
  if (!item.correct_answer_key) {
    ctx.addIssue({ code: 'custom', message: 'Scenario questions require one correct answer key.' });
  }
  const wrongKeys = ['A', 'B', 'C', 'D'].filter((key) => key !== item.correct_answer_key);
  for (const key of wrongKeys) {
    if (!item.why_wrong_answers_are_wrong?.[key]) {
      ctx.addIssue({ code: 'custom', message: `Missing wrong-answer explanation for ${key}.` });
    }
  }
});

export const GeneratedBatchSchema = z.object({
  items: z.array(GeneratedItemSchema).min(1).max(12)
});

export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;

export function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

export function validateGeneratedBatch(raw: string) {
  const json = JSON.parse(extractJson(raw));
  return GeneratedBatchSchema.parse(json);
}
