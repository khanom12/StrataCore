import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  Paragraph,
  SectionType,
  TabStopPosition,
  TabStopType,
  TextRun,
  type IParagraphOptions
} from 'docx';

import type {
  ComposedLetterDocument,
  FooterBlock,
  HeaderBlock,
  LetterDocumentBodyBlock,
  MetadataBlock,
  ParagraphBlock,
  SignoffBlock
} from '@/types/document';

export interface DocxExportResult {
  buffer: Uint8Array;
  contentType: string;
  filename: string;
  archivePath: string;
  exportWarnings: string[];
}

const DEFAULT_FONT = 'Franklin Gothic Book';
const BODY_SIZE = 22;
const HEADER_TITLE_SIZE = 24;
const HEADER_SECONDARY_SIZE = 20;
const FOOTER_SIZE = 18;
const RIGHT_TAB_STOP = [{ position: TabStopPosition.MAX, type: TabStopType.RIGHT }];
const FOOTER_COLUMN_TABS = [
  { position: 1800, type: TabStopType.LEFT },
  { position: 3600, type: TabStopType.CENTER },
  { position: 5400, type: TabStopType.RIGHT }
];

function buildRun(text: string, options?: { bold?: boolean; size?: number }) {
  return new TextRun({
    text: text || ' ',
    bold: options?.bold,
    size: options?.size ?? BODY_SIZE,
    font: DEFAULT_FONT
  });
}

function buildParagraph(options: IParagraphOptions) {
  return new Paragraph(options);
}

function buildSimpleParagraph(
  text: string,
  options?: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    line?: number;
    bold?: boolean;
    size?: number;
    tabs?: Array<{
      position: number;
      type: (typeof TabStopType)[keyof typeof TabStopType];
    }>;
    indent?: { left?: number; hanging?: number };
  }
) {
  return buildParagraph({
    alignment: options?.alignment,
    spacing: { before: options?.before ?? 0, after: options?.after ?? 120, line: options?.line },
    tabStops: options?.tabs,
    indent: options?.indent,
    children: [buildRun(text, { bold: options?.bold, size: options?.size })]
  });
}

function buildHeader(block: HeaderBlock) {
  if (block.role === 'continuation_subject') {
    return new Header({
      children: block.lines.map((line, index) =>
        buildParagraph({
          spacing: { after: index === block.lines.length - 1 ? 80 : 20 },
          tabStops: line.includes('\t') ? RIGHT_TAB_STOP : undefined,
          children: [buildRun(line, { size: BODY_SIZE, bold: index === 1 })]
        })
      )
    });
  }

  return new Header({
    children: block.lines.map((line, index) =>
      buildSimpleParagraph(line, {
        bold: index === 0,
        size: index === 0 ? HEADER_TITLE_SIZE : HEADER_SECONDARY_SIZE,
        alignment: AlignmentType.CENTER,
        after: index === block.lines.length - 1 ? 120 : 40
      })
    )
  });
}

function buildFooter(block: FooterBlock) {
  const children: Paragraph[] = [];

  if (block.archivePathLine) {
    children.push(
      buildSimpleParagraph(block.archivePathLine, {
        alignment: AlignmentType.CENTER,
        size: FOOTER_SIZE,
        after: 90
      })
    );
  }

  if (block.offices?.length) {
    for (const office of block.offices) {
      children.push(
        buildParagraph({
          alignment: AlignmentType.CENTER,
          tabStops: FOOTER_COLUMN_TABS,
          spacing: { after: 0 },
          children: [buildRun(`${office.city}\t${office.phone}`, { size: FOOTER_SIZE })]
        })
      );
    }
  }

  return new Footer({ children });
}

function buildMetadataParagraphs(block: MetadataBlock): Paragraph[] {
  switch (block.role) {
    case 'office_address':
      return block.lines.map((line, index) =>
        buildSimpleParagraph(line, {
          alignment: AlignmentType.RIGHT,
          after: index === block.lines.length - 1 ? 60 : 20
        })
      );
    case 'date_file':
      return [
        buildSimpleParagraph(block.dateLine ?? block.lines[0] ?? '', {
          alignment: AlignmentType.RIGHT,
          after: 40
        }),
        buildSimpleParagraph(block.fileNumberLine ?? block.lines[1] ?? '', {
          alignment: AlignmentType.RIGHT,
          after: 180
        })
      ];
    case 'client_address':
      return block.lines.map((line, index) =>
        buildSimpleParagraph(line, {
          bold: block.emphasisLineIndexes?.includes(index),
          after: 30
        })
      );
    case 're_block': {
      const paragraphs = [
        buildParagraph({
          spacing: { after: 40 },
          tabStops: [{ position: 720, type: TabStopType.LEFT }],
          children: [buildRun(`Re:\t${block.subjectLine ?? ''}`)]
        })
      ];

      for (const line of block.detailLines ?? []) {
        paragraphs.push(
          buildSimpleParagraph(line, {
            after: 30,
            indent: { left: 360 }
          })
        );
      }

      paragraphs.push(buildParagraph({ spacing: { after: 160 }, children: [buildRun(' ')] }));
      return paragraphs;
    }
  }
}

function buildBodyParagraph(block: ParagraphBlock) {
  return buildParagraph({
    alignment: block.role === 'closing' ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
    spacing: {
      after: block.role === 'closing' ? 140 : 140,
      line: 280
    },
    children: [buildRun(block.text)]
  });
}

function buildSignoffParagraphs(block: SignoffBlock): Paragraph[] {
  const paragraphs: Paragraph[] = [
    buildSimpleParagraph(block.salutationLine, {
      after: 140
    }),
    buildSimpleParagraph(block.organization, {
      after: 220
    })
  ];

  for (const line of block.lines) {
    paragraphs.push(
      buildSimpleParagraph(line.label, {
        after: 20
      })
    );
    paragraphs.push(
      buildSimpleParagraph(line.value, {
        after: 130,
        indent: { left: 180 }
      })
    );
  }

  if (block.engineerMemberNumberLine) {
    paragraphs.push(buildSimpleParagraph(block.engineerMemberNumberLine, { after: 0 }));
  }

  return paragraphs;
}

function buildBodyParagraphs(blocks: LetterDocumentBodyBlock[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case 'metadata_block':
        paragraphs.push(...buildMetadataParagraphs(block));
        break;
      case 'paragraph_block':
        paragraphs.push(buildBodyParagraph(block));
        break;
      case 'signoff_block':
        paragraphs.push(...buildSignoffParagraphs(block));
        break;
      case 'spacer_block':
        paragraphs.push(buildParagraph({ spacing: { after: block.size === 'large' ? 240 : block.size === 'medium' ? 160 : 80 }, children: [buildRun(' ')] }));
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
            font: DEFAULT_FONT,
            size: BODY_SIZE
          },
          paragraph: {
            spacing: {
              after: 120,
              line: 300
            }
          }
        }
      }
    },
    sections: documentModel.pages.map((page, index) => ({
      properties: {
        type: index === 0 ? undefined : SectionType.NEXT_PAGE,
        page: {
          margin: {
            top: 720,
            right: 900,
            bottom: 720,
            left: 900
          }
        }
      },
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
