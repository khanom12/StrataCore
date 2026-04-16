import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';
import type { LetterDocumentBodyBlock } from '@/types/document';

function cloneFormState(): FormState {
  return JSON.parse(JSON.stringify(defaultFormState)) as FormState;
}

function flattenBodyText(blocks: LetterDocumentBodyBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'metadata_block':
          return block.lines.join('\n');
        case 'paragraph_block':
          return block.text;
        case 'signoff_block':
          return [block.organization, ...block.lines.map((line) => `${line.label}: ${line.value}`), block.engineerMemberNumberLine, block.stampPlaceholderLine, block.permitToPracticeLine].join('\n');
        case 'spacer_block':
        case 'trace_block':
          return '';
      }
    })
    .join('\n');
}

describe('composeLetterDocument', () => {
  it('preserves paragraph ordering across the first-page and continuation-page shells', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const orderedSections = document.pages.flatMap((page) =>
      page.bodyBlocks.filter((block): block is Extract<LetterDocumentBodyBlock, { kind: 'paragraph_block' }> => block.kind === 'paragraph_block').map((block) => block.sectionId)
    );

    expect(document.pages.map((page) => page.kind)).toEqual(['first_page', 'continuation_page']);
    expect(orderedSections).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'CLOSING']);
  });

  it('keeps the hidden H number out of visible body blocks while preserving it in the footer archive text', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const bodyText = document.pages.map((page) => flattenBodyText(page.bodyBlocks)).join('\n');
    const footerText = document.pages.map((page) => page.footerBlock.lines.join('\n')).join('\n');

    expect(bodyText).not.toContain('h38566');
    expect(footerText).toContain('h38566vic.docx');
  });

  it('keeps internal clause and rule ids out of the client-facing composed document text', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const visibleText = [
      ...document.pages.flatMap((page) => page.headerBlock.lines),
      ...document.pages.flatMap((page) => page.bodyBlocks.flatMap((block) => flattenBodyText([block]))),
      ...document.pages.flatMap((page) => page.footerBlock.lines)
    ].join('\n');

    expect(visibleText).not.toMatch(/\bCL_\d+\b/);
    expect(visibleText).not.toMatch(/\bDT_\d+\b/);
  });
});
