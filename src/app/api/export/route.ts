import { NextResponse } from 'next/server';

import { buildDocx } from '@/lib/export/build-docx';
import type { FormState } from '@/types/domain';

export async function POST(request: Request) {
  const formState = (await request.json()) as FormState;

  return NextResponse.json(buildDocx(formState), { status: 501 });
}

