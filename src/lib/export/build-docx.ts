import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  Paragraph,
  SectionType,
  TextRun
} from 'docx';

import type { ComposedLetterDocument, FooterBlock, HeaderBlock, LetterDocumentBodyBlock } from '@/types/document';

export interface DocxExportResult {
  buffer: Uint8Array;
  contentType: string;
  filename: string;
  archivePath: string;
  exportWarnings: string[];
}

function buildLineParagraph(line: string, options?: { bold?: boolean; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new Paragraph({
    alignment: options?.alignment,
    spacing: { after: 120 },
    children: [new TextRun({ text: line || ' ', bold: options?.bold })]
  });
}

function buildHeader(block: HeaderBlock) {
  return new Header({
    children: block.lines.map((line, index) =>
      buildLineParagraph(line, {
        bold: index === 0,
        alignment: index === 0 ? AlignmentType.CENTER : AlignmentType.LEFT
      })
    )
  });
}

function buildFooter(block: FooterBlock) {
  return new Footer({
    children: block.lines.map((line) => buildLineParagraph(line, { alignment: AlignmentType.LEFT }))
  });
}

function buildBodyParagraphs(blocks: LetterDocumentBodyBlock[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case 'metadata_block':
        for (const line of block.lines) {
          paragraphs.push(buildLineParagraph(line));
        }
        paragraphs.push(new Paragraph({ text: ' ' }));
        break;
      case 'paragraph_block':
        paragraphs.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: block.text })]
          })
        );
        break;
      case 'signoff_block':
        paragraphs.push(buildLineParagraph(block.organization));
        paragraphs.push(new Paragraph({ text: ' ' }));
        for (const line of block.lines) {
          paragraphs.push(buildLineParagraph(`${line.label}: ${line.value}`));
        }
        paragraphs.push(buildLineParagraph(block.engineerMemberNumberLine));
        paragraphs.push(buildLineParagraph(block.stampPlaceholderLine));
        paragraphs.push(buildLineParagraph(block.permitToPracticeLine));
        break;
      case 'spacer_block':
        paragraphs.push(new Paragraph({ text: ' ' }));
        break;
      case 'trace_block':
        break;
    }
  }

  return paragraphs;
}

export async function buildDocx(documentModel: ComposedLetterDocument): Promise<DocxExportResult> {
  const document = new Document({
    sections: documentModel.pages.map((page, index) => ({
      properties: index === 0 ? {} : { type: SectionType.NEXT_PAGE },
      headers: {
        default: buildHeader(page.headerBlock)
      },
      footers: {
        default: buildFooter(page.footerBlock)
      },
      children: buildBodyParagraphs(page.bodyBlocks)
    }))
  });
  const buffer = new Uint8Array(await Packer.toBuffer(document));

  return {
    buffer,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: documentModel.filename,
    archivePath: documentModel.archivePath,
    exportWarnings: documentModel.exportWarnings
  };
}
