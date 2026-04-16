import { NextResponse } from 'next/server';

import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';

export async function POST(request: Request) {
  const formState = (await request.json()) as FormState;

  return NextResponse.json(generateLetter(formState));
}

