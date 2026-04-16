import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
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

function toAlignmentType(alignment?: HeaderBlock['alignment']) {
  switch (alignment) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    default:
      return AlignmentType.LEFT;
  }
}

function buildLineParagraph(
  line: string,
  options?: {
    bold?: boolean;
    size?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    tabs?: Array<{
      position: number;
      type: (typeof TabStopType)[keyof typeof TabStopType];
    }>;
  }
) {
  return new Paragraph({
    alignment: options?.alignment,
    spacing: { before: options?.before ?? 0, after: options?.after ?? 120 },
    tabStops: options?.tabs,
    children: [
      new TextRun({
        text: line || ' ',
        bold: options?.bold,
        size: options?.size ?? 22,
        font: 'Franklin Gothic Book'
      })
    ]
  });
}

function buildHeader(block: HeaderBlock) {
  return new Header({
    children: block.lines.map((line, index) =>
      buildLineParagraph(line, {
        bold: index === 0,
        size: index === 0 ? 24 : 20,
        alignment: toAlignmentType(block.alignment),
        after: index === block.lines.length - 1 ? 80 : 40
      })
    )
  });
}

function buildFooter(block: FooterBlock) {
  return new Footer({
    children: block.lines.map((line, index) =>
      buildLineParagraph(line, {
        alignment: toAlignmentType(block.alignment),
        size: 18,
        after: index === block.lines.length - 1 ? 0 : 40
      })
    )
  });
}

function buildBodyParagraphs(blocks: LetterDocumentBodyBlock[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case 'metadata_block':
        for (const line of block.lines) {
          const renderedLine =
            block.id === 'metadata-top-block'
              ? line.replace(/^File No\.\:\s+/, 'File No.:\t').replace(/^Client Job No\.\:\s+/, 'Client Job No.:\t')
              : line;
          paragraphs.push(
            buildLineParagraph(renderedLine, {
              alignment: toAlignmentType(block.alignment),
              after: line ? 80 : 120,
              tabs:
                block.id === 'metadata-top-block'
                  ? [
                      {
                        position: TabStopPosition.MAX,
                      type: TabStopType.RIGHT
                    }
                  ]
                  : undefined
            })
          );
        }
        paragraphs.push(new Paragraph({ text: ' ' }));
        break;
      case 'paragraph_block':
        paragraphs.push(
          new Paragraph({
            alignment: toAlignmentType(block.alignment),
            spacing: { after: 220, line: 320 },
            children: [new TextRun({ text: block.text, size: 22, font: 'Franklin Gothic Book' })]
          })
        );
        break;
      case 'signoff_block':
        paragraphs.push(buildLineParagraph(block.salutationLine, { after: 120 }));
        paragraphs.push(new Paragraph({ text: ' ' }));
        paragraphs.push(buildLineParagraph(block.organization, { after: 80 }));
        paragraphs.push(new Paragraph({ text: ' ' }));
        for (const line of block.lines) {
          paragraphs.push(buildLineParagraph(`${line.label}: ${line.value}`, { after: 80 }));
        }
        paragraphs.push(buildLineParagraph(block.engineerMemberNumberLine, { after: 80 }));
        paragraphs.push(buildLineParagraph(block.stampPlaceholderLine, { after: 80 }));
        paragraphs.push(buildLineParagraph(block.permitToPracticeLine, { after: 0 }));
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
    styles: {
      default: {
        document: {
          run: {
            font: 'Franklin Gothic Book',
            size: 22
          },
          paragraph: {
            spacing: {
              after: 120,
              line: 320
            }
          }
        }
      }
    },
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
