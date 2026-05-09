import { afterEach, describe, expect, it } from 'vitest';
import { isAllowedEmail } from './server';

describe('email allowlist', () => {
  const original = process.env.ALLOWED_EMAILS;
  afterEach(() => {
    process.env.ALLOWED_EMAILS = original;
  });

  it('allows everyone when no allowlist is configured', () => {
    delete process.env.ALLOWED_EMAILS;
    expect(isAllowedEmail('anyone@example.com')).toBe(true);
  });

  it('allows only configured emails case-insensitively', () => {
    process.env.ALLOWED_EMAILS = 'rdyson@hotmail.com, friend@example.com';
    expect(isAllowedEmail('RDYSON@hotmail.com')).toBe(true);
    expect(isAllowedEmail('friend@example.com')).toBe(true);
    expect(isAllowedEmail('stranger@example.com')).toBe(false);
  });
});
