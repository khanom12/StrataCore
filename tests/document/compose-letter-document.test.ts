import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { generateLetter } from '@/lib/generation/generate-letter';
import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';
import type { FormState } from '@/types/domain';
import type { LetterDocumentBodyBlock } from '@/types/document';

function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

function flattenBodyText(blocks: LetterDocumentBodyBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'metadata_block':
          return [
            ...(block.subjectLine ? [block.subjectLine] : []),
            ...(block.detailLines ?? []),
            ...block.lines
          ].join('\n');
        case 'paragraph_block':
          return block.text;
        case 'signoff_block':
          return [
            block.salutationLine,
            block.organization,
            ...block.lines.flatMap((line) => [line.label, line.value]),
            block.engineerMemberNumberLine,
            block.stampPlaceholderLine,
            block.permitToPracticeLine
          ].join('\n');
        case 'spacer_block':
        case 'trace_block':
          return '';
      }
    })
    .join('\n');
}

describe('composeLetterDocument', () => {
  it('preserves paragraph ordering across the first-page and continuation-page shells', () => {
    const formState = cloneFormState(genericHappyPath);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const orderedSections = document.pages.flatMap((page) =>
      page.bodyBlocks.filter((block): block is Extract<LetterDocumentBodyBlock, { kind: 'paragraph_block' }> => block.kind === 'paragraph_block').map((block) => block.sectionId)
    );

    expect(document.pages.map((page) => page.kind)).toEqual(['first_page', 'continuation_page']);
    expect(orderedSections).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'CLOSING']);
  });

  it('keeps the Victory reference office address and continuation header in the composed shell', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const officeAddressBlock = document.pages[0].bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'metadata_block' }> => block.kind === 'metadata_block' && block.role === 'office_address'
    );

    expect(officeAddressBlock?.lines).toEqual(['2304 - 119 Avenue NE', 'Edmonton, Alberta', 'T6S 1B3']);
    expect(document.pages[1].headerBlock.role).toBe('continuation_subject');
    expect(document.pages[1].headerBlock.subjectLine).toBe('Foundation Soils Inspection');
    expect(document.pages[1].headerBlock.fileNumberLine).toBe('File No. 5478 - 1');
    expect(document.pages[1].headerBlock.lines[0]).toContain('J.R. Paine & Associates Ltd.');
    expect(document.pages[1].headerBlock.lines[0]).toContain('Page 2 of 2');
  });

  it('keeps the hidden H number out of visible body blocks and visible footer content while preserving it in document metadata', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const bodyText = document.pages.map((page) => flattenBodyText(page.bodyBlocks)).join('\n');
    const footerText = document.pages.map((page) => page.footerBlock.lines.join('\n')).join('\n');

    expect(bodyText).not.toContain('h38566');
    expect(footerText).not.toContain('h38566');
    expect(document.archivePath).toContain('h38566vic.docx');
  });

  it('keeps internal clause and rule ids out of the client-facing composed document text', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
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

  it('renders the Victory signoff block with reviewed-by wording, the Scott member number, and separated office footer contacts', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const signoff = document.pages[1].bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'signoff_block' }> => block.kind === 'signoff_block'
    );

    expect(signoff?.lines.some((line) => line.label === 'Reviewed by,' && line.value === 'Scott MacFarlane, P.Eng.')).toBe(true);
    expect(signoff?.engineerMemberNumberLine).toBe('APEGA Member #: 89667');
    expect(document.pages[1].footerBlock.offices).toEqual([
      { city: 'EDMONTON', phone: '780-489-0700' },
      { city: 'GRANDE PRAIRIE', phone: '780-532-1515' },
      { city: 'PEACE RIVER', phone: '780-624-4966' }
    ]);
  });
});
