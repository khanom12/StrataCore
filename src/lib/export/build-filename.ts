import { getCalendarYear } from '@/lib/domain/report-helpers';
import type { FormState } from '@/types/domain';

function normalizeHNumber(value: string): string {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!cleaned) {
    return 'h00000';
  }

  return cleaned.startsWith('h') ? cleaned : `h${cleaned}`;
}

function buildClientCode(clientName: string): string {
  const lettersOnly = clientName.replace(/[^a-z]/gi, '').toLowerCase();

  return lettersOnly.slice(0, 3) || 'cli';
}

export function buildFilename(formState: FormState): string {
  const hNumber = normalizeHNumber(formState.archive.hNumber);
  const clientCode = buildClientCode(formState.topBlock.clientName);

  return `${hNumber}${clientCode}.docx`;
}

export function buildArchivePath(formState: FormState, filename: string): string {
  const year = getCalendarYear(formState.topBlock.letterDate);
  const clientFolder = `${formState.topBlock.fileNumber.trim() || 'file-number'} ${formState.topBlock.clientName.trim() || 'Client Name'}`.trim();

  return `H:\\DATA ${year}\\00 Housing ${year}\\${clientFolder}\\${filename}`;
}
