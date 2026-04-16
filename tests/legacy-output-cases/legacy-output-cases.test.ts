import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { generateLetter } from '@/lib/generation/generate-letter';
import { getLegacyOutputCase, getLegacyOutputCaseMatrixSummary, legacyOutputCases } from '@/lib/reference-cases/legacy-output-cases';

function flattenVisibleText(documentText: ReturnType<typeof composeLetterDocument>) {
  return documentText.pages
    .flatMap((page) => [
      ...page.headerBlock.lines,
      ...page.bodyBlocks.flatMap((block) => {
        switch (block.kind) {
          case 'metadata_block':
            return [...block.lines, ...(block.detailLines ?? [])];
          case 'paragraph_block':
            return [block.text];
          case 'signoff_block':
            return [
              block.salutationLine,
              block.organization,
              ...block.lines.flatMap((line) => [line.label, line.value]),
              block.engineerMemberNumberLine
            ];
          case 'spacer_block':
          case 'trace_block':
            return [];
        }
      }),
      ...page.footerBlock.lines
    ])
    .join('\n');
}

describe('legacy output regression matrix', () => {
  it('contains a manifest entry for every expected historical output case and only marks present files as active fixtures', () => {
    expect(legacyOutputCases.map((item) => item.slug)).toEqual([
      'water-in-auger-holes-upgraded-drainage',
      'saturated-material-comment',
      'loose-material-comment',
      'frost-on-site',
      'house-garage-with-walkout',
      'garden-suite',
      'multiple-lots',
      'over-excavated-service-trench',
      'clay-fill-then-other-soils-below',
      'already-poured-footing'
    ]);

    for (const fixture of legacyOutputCases) {
      const sourcePath = resolve('/Users/omar/Projects/StrataCore', fixture.sourcePath);
      expect(existsSync(sourcePath)).toBe(true);
      expect(fixture.status).not.toBe('pending-file');
    }
  });

  it('provides a case matrix summary with honest support status for every legacy fixture', () => {
    const summary = getLegacyOutputCaseMatrixSummary();

    expect(summary).toHaveLength(legacyOutputCases.length);
    expect(summary.every((item) => ['supported', 'partial', 'unsupported', 'pending-file'].includes(item.status))).toBe(true);
    expect(summary.some((item) => item.slug === 'house-garage-with-walkout' && item.status === 'partial')).toBe(true);
    expect(summary.some((item) => item.slug === 'already-poured-footing' && item.status === 'partial')).toBe(true);
  });

  it('supports the upgraded-drainage auger-hole family with a dedicated issue paragraph and conditional recommendation', () => {
    const fixture = getLegacyOutputCase('water-in-auger-holes-upgraded-drainage');
    const result = generateLetter(fixture!.formState);
    const p3a = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3A')?.text ?? '';
    const p4 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P4')?.text ?? '';

    expect(result.visibleSections).toEqual(fixture!.expectedVisibleSections);
    expect(p3a).toContain('washed rock slab base');
    expect(p3a).toContain('interior as well as exterior weeping tile with two laterals');
    expect(p3a).toContain('A drawing depicting the recommended drainage measures is attached.');
    expect(p4).toContain('would then be considered');
  });

  it('supports the saturated-material issue paragraph family without inventing a separate debug section', () => {
    const fixture = getLegacyOutputCase('saturated-material-comment');
    const result = generateLetter(fixture!.formState);
    const p3a = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3A')?.text ?? '';

    expect(p3a).toContain('Due to the frost');
    expect(p3a).toContain('water softened material should be adequately dried or removed');
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P5')?.text).toContain('attached garage');
  });

  it('supports the garden-suite variant as a distinct letter family', () => {
    const fixture = getLegacyOutputCase('garden-suite');
    const result = generateLetter(fixture!.formState);
    const topBlock = result.paragraphs.find((paragraph) => paragraph.sectionId === 'TOP_BLOCK')?.text ?? '';
    const p4 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P4')?.text ?? '';

    expect(result.visibleSections).toEqual(fixture!.expectedVisibleSections);
    expect(topBlock).toContain('Foundation Soil Inspection – Garden Suite');
    expect(p4).toContain('rear garage garden suite structure');
    expect(result.visibleSections).not.toContain('P5');
  });

  it('supports custom multiple-lot legal descriptions without leaking single-lot placeholders', () => {
    const fixture = getLegacyOutputCase('multiple-lots');
    const result = generateLetter(fixture!.formState);
    const topBlock = result.paragraphs.find((paragraph) => paragraph.sectionId === 'TOP_BLOCK')?.text ?? '';

    expect(topBlock).toContain('Lot 5, 6, 7 & 8, Block 12, Plan 252 2670');
    expect(topBlock).toContain('2020, 2022, 2024 & 2026 - 212 Street NW');
    expect(topBlock).not.toContain('Lot undefined');
  });

  it('keeps the walkout + garage family active while the matrix still records it as partial', () => {
    const fixture = getLegacyOutputCase('house-garage-with-walkout');
    const result = generateLetter(fixture!.formState);
    const p2 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P2')?.text ?? '';

    expect(fixture?.status).toBe('partial');
    expect(result.visibleSections).toContain('P5');
    expect(p2).toContain('garage footing area');
    expect(p2).toContain('Rear walkout basement conditions were selected');
  });

  it('keeps the clay-fill-over-below-soils family materially aligned with the historical wording', () => {
    const fixture = getLegacyOutputCase('clay-fill-then-other-soils-below');
    const result = generateLetter(fixture!.formState);
    const p3 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3')?.text ?? '';

    expect(p3).toContain('to a depth of approximately 0.8 m');
    expect(p3).toContain('Below the fill');
    expect(p3).toContain('engineered fill program monitored and tested by our firm');
  });

  it('keeps the already-placed footing family marked partial while using as-placed wording', () => {
    const fixture = getLegacyOutputCase('already-poured-footing');
    const result = generateLetter(fixture!.formState);
    const p2 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P2')?.text ?? '';
    const p4 = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P4')?.text ?? '';

    expect(fixture?.status).toBe('partial');
    expect(p2).toContain('strip footing forms');
    expect(p4).toContain('as placed, was considered adequate');
  });

  it('uses the real office shell text in composed historical-case documents and keeps archive metadata hidden from visible body text', () => {
    const fixture = getLegacyOutputCase('water-in-auger-holes-upgraded-drainage');
    const result = generateLetter(fixture!.formState);
    const document = composeLetterDocument(fixture!.formState, result);
    const visibleText = flattenVisibleText(document);

    expect(visibleText).toContain('J.R. Paine & Associates Ltd.\tPage 2 of 2');
    expect(visibleText).toContain('Foundation Soils Inspection\tFile No. 4460 - 1');
    expect(visibleText).toContain('Reviewed by,');
    expect(visibleText).not.toContain('LETTER - CONTINUED');
    expect(visibleText).not.toContain('h38862');
  });
});
