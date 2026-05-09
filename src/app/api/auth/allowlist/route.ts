import { isAllowedEmail } from '@/lib/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalized) return Response.json({ allowed: false }, { status: 400 });
    return Response.json({ allowed: isAllowedEmail(normalized) });
  } catch {
    return Response.json({ allowed: false }, { status: 400 });
  }
}
