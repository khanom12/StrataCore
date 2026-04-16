import { NextResponse } from 'next/server';

import { normalizeStoredDraftState } from '@/lib/draft/storage';
import { buildDocx } from '@/lib/export/build-docx';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = undefined;
  }

  return NextResponse.json(buildDocx(normalizeStoredDraftState(payload)), { status: 501 });
}
