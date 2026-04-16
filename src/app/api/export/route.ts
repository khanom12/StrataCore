import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { normalizeStoredDraftState } from '@/lib/draft/storage';
import { buildDocx } from '@/lib/export/build-docx';
import { generateLetter } from '@/lib/generation/generate-letter';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = undefined;
  }

  const formState = normalizeStoredDraftState(payload);
  const generationResult = generateLetter(formState);
  const documentModel = composeLetterDocument(formState, generationResult);
  const docx = await buildDocx(documentModel);
  const bodyBytes = Uint8Array.from(docx.buffer);
  const blob = new Blob([bodyBytes], { type: docx.contentType });

  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': docx.contentType,
      'Content-Disposition': `attachment; filename="${docx.filename}"`,
      'X-StrataCore-Archive-Path': docx.archivePath
    }
  });
}
