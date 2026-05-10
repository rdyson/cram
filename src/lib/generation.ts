import { z } from 'zod';

const answerKeys = ['A', 'B', 'C', 'D'] as const;

export const AnswerChoiceSchema = z.object({
  key: z.enum(answerKeys),
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
  correct_answer_key: z.enum(answerKeys).optional(),
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
  const wrongKeys = answerKeys.filter((key) => key !== item.correct_answer_key);
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

type LooseGeneratedItem = {
  type?: string;
  topic?: string;
  domain?: string;
  difficulty?: string;
  prompt?: string;
  answer?: string;
  answer_choices?: Array<{ key?: string; text?: string }>;
  correct_answer_key?: string;
  explanation?: string;
  why_wrong_answers_are_wrong?: unknown;
};

export function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function normalizeWhyWrong(value: unknown) {
  if (!value) return {};
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((entry) => {
      if (typeof entry === 'string') return ['', entry];
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const key = String(record.key ?? record.answer ?? record.choice ?? '').toUpperCase();
        const text = String(record.text ?? record.explanation ?? record.why ?? '');
        return [key, text];
      }
      return ['', ''];
    }).filter(([key, text]) => answerKeys.includes(key as typeof answerKeys[number]) && text));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, text]) => [key.toUpperCase(), String(text)]));
  }
  return {};
}

function normalizeGeneratedJson(json: unknown) {
  if (!json || typeof json !== 'object') return json;
  const batch = json as { items?: LooseGeneratedItem[] };
  if (!Array.isArray(batch.items)) return json;
  batch.items = batch.items.map((item) => {
    if (item.correct_answer_key) item.correct_answer_key = item.correct_answer_key.toUpperCase();
    if (item.answer_choices) {
      item.answer_choices = item.answer_choices.map((choice) => ({
        ...choice,
        key: String(choice.key ?? '').toUpperCase()
      }));
    }
    if (item.type === 'scenario_question' && item.answer_choices?.length === 4 && item.correct_answer_key) {
      const whyWrong = normalizeWhyWrong(item.why_wrong_answers_are_wrong);
      const correct = item.answer_choices.find((choice) => choice.key === item.correct_answer_key);
      for (const key of answerKeys) {
        if (key === item.correct_answer_key) continue;
        if (!whyWrong[key]) {
          const wrong = item.answer_choices.find((choice) => choice.key === key);
          whyWrong[key] = `Option ${key} (${wrong?.text ?? 'this answer'}) is not the best fit for this scenario. The correct answer is ${item.correct_answer_key}${correct?.text ? ` (${correct.text})` : ''}. ${item.explanation ?? ''}`.trim();
        }
      }
      item.why_wrong_answers_are_wrong = whyWrong;
    }
    return item;
  });
  return json;
}

export function validationSummary(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => `${issue.path.join('.') || 'output'}: ${issue.message}`).join('; ');
  }
  return error instanceof Error ? error.message : String(error);
}

export function validateGeneratedBatch(raw: string) {
  const json = normalizeGeneratedJson(JSON.parse(extractJson(raw)));
  return GeneratedBatchSchema.parse(json);
}
