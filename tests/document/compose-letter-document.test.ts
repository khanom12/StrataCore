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
            ...(block.reLabel ? [block.reLabel] : []),
            ...(block.subjectLine ? [block.subjectLine] : []),
            ...(block.detailLines ?? []),
            ...block.lines
          ].join('\n');
        case 'paragraph_block':
          return block.text;
        case 'archive_path_block':
          return block.text;
        case 'signoff_block':
          return [
            block.salutationLine,
            block.organization,
            ...block.lines.flatMap((line) => [line.label, line.value]),
            ...(block.engineerMemberNumberLine ? [block.engineerMemberNumberLine] : [])
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

    expect(document.pages[0]?.kind).toBe('first_page');
    expect(document.pages.slice(1).every((page) => page.kind === 'continuation_page')).toBe(true);
    expect(orderedSections).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'CLOSING']);
  });

  it('uses layout-intent pagination for longer drafts instead of a fixed section split plus naive count chunking', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.excavation.waterIssueMode = 'free_water_in_auger_holes_upgraded_drainage';
    formState.reportBody.excavation.waterObservedDepthBelowFootingM = 0.4;
    formState.reportBody.recommendation.drainageUpgradeVariant = 'washed_rock_interior_exterior_two_laterals';
    formState.reportBody.recommendation.drainageDrawingAttached = true;
    formState.reportBody.excavation.oversizedTrenchMode = 'reinforcement';
    formState.reportBody.excavation.trenchLocation = 'front_left';
    formState.reportBody.excavation.frostDepthMm = 200;
    formState.reportBody.sulphate.includeParagraph = true;
    formState.reportBody.sulphate.sulphateClass = 'moderate';

    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const continuationPages = document.pages.filter((page) => page.kind === 'continuation_page');
    const lastPage = document.pages.at(-1);

    expect(document.pages.length).toBeGreaterThan(2);
    expect(continuationPages.every((page) => page.headerBlock.role === 'continuation_subject')).toBe(true);
    expect(lastPage?.bodyBlocks.some((block) => block.kind === 'signoff_block')).toBe(true);
    expect(lastPage?.bodyBlocks.some((block) => block.kind === 'archive_path_block' && block.text.endsWith('.docx'))).toBe(true);
  });

  it('keeps the Victory reference office address plus the legacy-style continuation shell markers in the composed shell', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const officeAddressBlock = document.pages[0].bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'metadata_block' }> => block.kind === 'metadata_block' && block.role === 'office_address'
    );

    expect(officeAddressBlock?.lines).toEqual(['2304 - 119 Avenue NE', 'Edmonton, Alberta', 'T6S 1B3']);
    expect(document.pages[1].headerBlock.role).toBe('continuation_subject');
    expect(document.pages[0].headerBlock.logoAsset?.publicPath).toBe('/assets/legacy/office-logo.png');
    expect(document.pages[1].headerBlock.pageNumberText).toBe(`Page 2 of ${document.pages.length}`);
    const dateFileBlock = document.pages[0].bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'metadata_block' }> => block.kind === 'metadata_block' && block.role === 'date_file'
    );

    expect(document.pages[1].headerBlock.lines[0]).toBe('J.R. Paine & Associates Ltd.');
    expect(document.pages[1].footerBlock.continuationMarkerLine).toBe('Foundation Soil Inspection\tFile No. 5478 - 1');
    expect(dateFileBlock?.dateLine).toBe('February 4, 2026');
  });

  it('keeps the Re block structured as a labeled headline with indented detail lines', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const reBlock = document.pages[0].bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'metadata_block' }> => block.kind === 'metadata_block' && block.role === 're_block'
    );

    expect(reBlock?.reLabel).toBe('Re:');
    expect(reBlock?.subjectLine).toBe('Foundation Soil Inspection');
    expect(reBlock?.detailLines).toContain('Lot 110, Block 17, Plan 252 2250');
    expect(reBlock?.reLayout?.detailTabCount).toBeGreaterThan(reBlock?.reLayout?.leadTabCount ?? 0);
  });

  it('keeps the raw H number out of body text while placing the archive path in the final visible body shell above the continuation footer', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const bodyText = document.pages.map((page) => flattenBodyText(page.bodyBlocks)).join('\n');
    const firstPageBody = flattenBodyText(document.pages[0]?.bodyBlocks ?? []);
    const firstPageFooterText = document.pages[0]?.footerBlock.lines.join('\n') ?? '';
    const lastPageBody = flattenBodyText(document.pages.at(-1)?.bodyBlocks ?? []);

    expect(firstPageBody).not.toContain('h38566');
    expect(firstPageFooterText).not.toContain('h38566');
    expect(bodyText).toContain('h38566vic.docx');
    expect(lastPageBody).toContain('h38566vic.docx');
    expect(document.archivePath).toContain('h38566vic.docx');
  });

  it('keeps internal clause and rule ids out of the client-facing composed document text', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const visibleText = [
      ...document.pages.flatMap((page) => page.headerBlock.lines),
      ...document.pages.flatMap((page) => page.bodyBlocks.flatMap((block) => flattenBodyText([block]))),
      ...document.pages.flatMap((page) => page.footerBlock.lines),
      ...document.pages.flatMap((page) => (page.footerBlock.continuationMarkerLine ? [page.footerBlock.continuationMarkerLine] : []))
    ].join('\n');

    expect(visibleText).not.toMatch(/\bCL_\d+\b/);
    expect(visibleText).not.toMatch(/\bDT_\d+\b/);
  });

  it('renders the Victory signoff block with reviewed-by wording, the Scott member number, the final archive path, and first-page office contacts', () => {
    const formState = cloneFormState(victoryHomes2026IssuedExample);
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const signoff = document.pages.at(-1)?.bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'signoff_block' }> => block.kind === 'signoff_block'
    );
    const archivePath = document.pages.at(-1)?.bodyBlocks.find(
      (block): block is Extract<LetterDocumentBodyBlock, { kind: 'archive_path_block' }> => block.kind === 'archive_path_block'
    );

    expect(signoff?.lines.some((line) => line.label === 'Reviewed by,' && line.value === 'Scott MacFarlane, P.Eng.')).toBe(true);
    expect(signoff?.engineerMemberNumberLine).toBe('APEGA Member #: 89667');
    expect(flattenBodyText(document.pages.at(-1)?.bodyBlocks ?? [])).not.toContain('placeholder');
    expect(archivePath?.text).toContain('h38566vic.docx');
    expect(document.pages[0]?.footerBlock.offices).toEqual([
      { city: 'EDMONTON', phone: '780-489-0700' },
      { city: 'GRANDE PRAIRIE', phone: '780-532-1515' },
      { city: 'PEACE RIVER', phone: '780-624-4966' }
    ]);
    expect(document.pages.slice(1).every((page) => !page.footerBlock.offices?.length)).toBe(true);
    expect(document.pages.at(-1)?.footerBlock.continuationMarkerLine).toBe('Foundation Soil Inspection\tFile No. 5478 - 1');
  });
});
