import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { generateLetter } from '@/lib/generation/generate-letter';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';
import type { FormState } from '@/types/domain';
import type { LetterDocumentBodyBlock } from '@/types/document';

function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

function flattenVisibleText(blocks: LetterDocumentBodyBlock[]): string {
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

describe('Victory Homes 2026 reference case', () => {
  it('locks the authoritative visible-section shape', () => {
    const result = generateLetter(cloneFormState(victoryHomes2026IssuedExample));

    expect(result.visibleSections).toEqual(['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P7', 'CLOSING', 'SIGNOFF']);
    expect(result.visibleSections).not.toContain('P5');
    expect(result.visibleSections).not.toContain('P6');
  });

  it('renders a layered engineered-fill P3 with a native layer and the JRP provenance clause', () => {
    const result = generateLetter(cloneFormState(victoryHomes2026IssuedExample));
    const p3Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3')?.text ?? '';

    expect(p3Text).toContain('Variable portions of the excavation floor were underlain');
    expect(p3Text).toContain('silty clay fill');
    expect(p3Text).toContain('Below the fill');
    expect(p3Text).toContain('native deposit of high plasticity');
    expect(p3Text).toContain('This lot was part of an engineered fill program monitored and tested by our firm.');
  });

  it('composes the office shell with confirmed header, address, footer, continuation header, and Scott member number text', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const visibleText = [
      ...document.pages.flatMap((page) => page.headerBlock.lines),
      ...document.pages.flatMap((page) => page.bodyBlocks.flatMap((block) => flattenVisibleText([block]))),
      ...document.pages.flatMap((page) => page.footerBlock.lines)
    ].join('\n');

    expect(visibleText).toContain('CONSULTING AND TESTING ENGINEERS');
    expect(visibleText).toContain('2304 - 119 Avenue NE');
    expect(visibleText).toContain('780-489-0700');
    expect(visibleText).toContain('J.R. Paine & Associates Ltd.\tPage 2 of 2');
    expect(visibleText).toContain('Foundation Soils Inspection\tFile No. 5478 - 1');
    expect(visibleText).toContain('Reviewed by,');
    expect(visibleText).toContain('APEGA Member #: 89667');
    expect(visibleText).not.toContain('Edmonton office block placeholder');
    expect(visibleText).not.toContain('First-page office footer placeholder');
    expect(visibleText).not.toContain('First-page header placeholder');
    expect(visibleText).not.toContain('LETTER - CONTINUED');
    expect(visibleText).not.toContain('h38566');
  });
});
