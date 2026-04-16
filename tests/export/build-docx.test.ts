import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { buildDocx } from '@/lib/export/build-docx';
import { generateLetter } from '@/lib/generation/generate-letter';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';
import type { FormState } from '@/types/domain';

function cloneFormState(): FormState {
  return JSON.parse(JSON.stringify(victoryHomes2026IssuedExample)) as FormState;
}

describe('buildDocx', () => {
  it('returns a real DOCX byte payload for the composed letter document', async () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const docx = await buildDocx(document);

    expect(
      document.pages[0].bodyBlocks.some((block) => block.kind === 'metadata_block' && block.role === 'date_file')
    ).toBe(true);
    expect(document.pages[1].headerBlock.role).toBe('continuation_subject');
    expect(docx.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(docx.filename).toBe('h38566vic.docx');
    expect(docx.buffer.byteLength).toBeGreaterThan(100);
    expect(docx.buffer[0]).toBe(0x50);
    expect(docx.buffer[1]).toBe(0x4b);

    const tempDir = mkdtempSync(join(tmpdir(), 'stratacore-docx-'));
    const docxPath = join(tempDir, docx.filename);

    try {
      writeFileSync(docxPath, docx.buffer);
      const documentXml = execFileSync('unzip', ['-p', docxPath, 'word/document.xml'], {
        encoding: 'utf8'
      });
      const header2Xml = execFileSync('unzip', ['-p', docxPath, 'word/header2.xml'], {
        encoding: 'utf8'
      });
      const footerXml = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']
        .map((path) => {
          try {
            return execFileSync('unzip', ['-p', docxPath, path], {
              encoding: 'utf8'
            });
          } catch {
            return '';
          }
        })
        .join('\n');

      expect(documentXml).toContain('J.R. Paine &amp; Associates Ltd.');
      expect(documentXml).toContain('Foundation Soil Inspection');
      expect(documentXml).toContain('February 4, 2026');
      expect(documentXml).toContain('Reviewed by,');
      expect(documentXml).toContain('APEGA Member #: 89667');
      expect(documentXml).not.toContain('[Engineer stamp placeholder');
      expect(documentXml).not.toContain('[Permit-to-practice');
      expect(header2Xml).toContain('Foundation Soil Inspection');
      expect(header2Xml).toContain('File No. 5478 - 1');
      expect(footerXml).toContain('H:\\DATA 2026\\00 Housing 2026\\5478 - 1 VICTORY HOMES LTD.\\h38566vic.docx');
      expect(documentXml).not.toContain('LETTER - CONTINUED');
      expect(documentXml).not.toMatch(/\bCL_\d+\b/);
      expect(documentXml).not.toMatch(/\bDT_\d+\b/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
