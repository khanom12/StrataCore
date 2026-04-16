import { NextResponse } from 'next/server';

import { normalizeStoredDraftState } from '@/lib/draft/storage';
import { generateLetter } from '@/lib/generation/generate-letter';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = undefined;
  }

  return NextResponse.json(generateLetter(normalizeStoredDraftState(payload)));
}
