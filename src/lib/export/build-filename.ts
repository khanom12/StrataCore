import type { FormState } from '@/types/domain';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildFilename(formState: FormState): string {
  const fileNumber = slugify(formState.topBlock.fileNumber);
  const address = slugify(formState.topBlock.streetAddress);
  const hNumber = slugify(formState.archive.hNumber);

  return `${hNumber}_${fileNumber}_${address}_foundation-soil-inspection.docx`;
}

export function buildArchivePath(formState: FormState, filename: string): string {
  const year = new Date(formState.topBlock.letterDate).getFullYear() || new Date().getFullYear();
  const clientFolder = formState.topBlock.clientName.trim() || 'client-folder';

  return `H:/${year}/Housing/${clientFolder}/${filename}`;
}
