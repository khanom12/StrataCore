import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  TabStopPosition,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions
} from 'docx';

import type {
  ArchivePathBlock,
  ComposedLetterDocument,
  FooterBlock,
  HeaderBlock,
  LetterDocumentBodyBlock,
  MetadataBlock,
  ParagraphBlock,
  SignoffBlock
} from '@/types/document';
import { officeShellLayout } from '@/lib/seed/letter-surfaces';

export interface DocxExportResult {
  buffer: Uint8Array;
  contentType: string;
  filename: string;
  archivePath: string;
  exportWarnings: string[];
}

const DEFAULT_FONT = 'Franklin Gothic Book';
const BODY_SIZE = 22;
const FIRST_PAGE_TITLE_SIZE = 48;
const FIRST_PAGE_SUBTITLE_SIZE = 16;
const CONTINUATION_META_SIZE = officeShellLayout.continuation.pageNumberSizeHalfPoints;
const FOOTER_SIZE = officeShellLayout.continuation.footerMarkerSizeHalfPoints;
const ARCHIVE_PATH_SIZE = officeShellLayout.archivePath.fontSizeHalfPoints;
const RIGHT_TAB_STOP = [{ position: TabStopPosition.MAX, type: TabStopType.RIGHT }];
const CONTINUATION_FOOTER_TABS = [
  { position: 4680, type: TabStopType.CENTER },
  { position: TabStopPosition.MAX, type: TabStopType.RIGHT }
];
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
} as const;

function buildRun(text: string, options?: { bold?: boolean; italic?: boolean; size?: number }) {
  return new TextRun({
    text: text || ' ',
    bold: options?.bold,
    italics: options?.italic,
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
    italic?: boolean;
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
    children: [buildRun(text, { bold: options?.bold, italic: options?.italic, size: options?.size })]
  });
}

async function loadHeaderLogoData(documentModel: ComposedLetterDocument) {
  const logoPaths = [...new Set(documentModel.pages.map((page) => page.headerBlock.logoAsset?.filePath).filter((value): value is string => Boolean(value)))];
  const entries = await Promise.all(
    logoPaths.map(async (path) => [path, new Uint8Array(await readFile(resolve(process.cwd(), path)))] as const)
  );

  return new Map(entries);
}

function buildHeader(block: HeaderBlock, options?: { logoData?: Uint8Array }) {
  if (block.role === 'continuation_subject') {
    return new Header({
      children: [
        buildParagraph({
          spacing: { after: 80 },
          tabStops: RIGHT_TAB_STOP,
          children: [
            buildRun(block.lines[0] ?? '', {
              size: officeShellLayout.continuation.headerCompanySizeHalfPoints,
              italic: true,
              bold: true
            }),
            buildRun('\t'),
            buildRun(block.pageNumberText ?? 'Page 1 of 1', { size: CONTINUATION_META_SIZE })
          ]
        })
      ]
    });
  }

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: officeShellLayout.firstPageHeader.logoColumnWidthPercent, type: WidthType.PERCENTAGE },
                borders: NO_BORDERS,
                children: [
                  buildParagraph({
                    spacing: { after: 0 },
                    children:
                      block.logoAsset && options?.logoData
                        ? [
                            new ImageRun({
                              data: options.logoData,
                              type: 'png',
                              transformation: {
                                width: block.logoAsset.widthPx,
                                height: block.logoAsset.heightPx
                              }
                            })
                          ]
                        : [buildRun(' ')]
                  })
                ]
              }),
              new TableCell({
                width: { size: officeShellLayout.firstPageHeader.identityColumnWidthPercent, type: WidthType.PERCENTAGE },
                borders: NO_BORDERS,
                children: [
                  buildSimpleParagraph(block.lines[0] ?? '', {
                    bold: true,
                    italic: true,
                    size: FIRST_PAGE_TITLE_SIZE,
                    alignment: AlignmentType.CENTER,
                    after: 40
                  }),
                  buildSimpleParagraph(block.lines[1] ?? '', {
                    bold: true,
                    size: FIRST_PAGE_SUBTITLE_SIZE,
                    alignment: AlignmentType.CENTER,
                    after: 20
                  }),
                  buildSimpleParagraph(block.lines[2] ?? '', {
                    size: FIRST_PAGE_SUBTITLE_SIZE,
                    alignment: AlignmentType.CENTER,
                    after: 20
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function buildFooter(block: FooterBlock) {
  if (block.role === 'continuation_footer') {
    return new Footer({
      children: [
        buildParagraph({
          spacing: { after: 0 },
          tabStops: CONTINUATION_FOOTER_TABS,
          children: [buildRun(block.continuationMarkerLine ?? '', { size: FOOTER_SIZE, italic: true })]
        })
      ]
    });
  }

  const rows: TableRow[] = [];

  if (block.offices?.length) {
    rows.push(
      new TableRow({
        children: block.offices.map((office) =>
          new TableCell({
            width: { size: 33.33, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [
              buildSimpleParagraph(office.city, {
                alignment: AlignmentType.CENTER,
                size: officeShellLayout.firstPageFooter.fontSizeHalfPoints,
                after: 0
              })
            ]
          })
        )
      })
    );
    rows.push(
      new TableRow({
        children: block.offices.map((office) =>
          new TableCell({
            width: { size: 33.33, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [
              buildSimpleParagraph(office.phone, {
                alignment: AlignmentType.CENTER,
                size: officeShellLayout.firstPageFooter.fontSizeHalfPoints,
                after: 0
              })
            ]
          })
        )
      })
    );
  }

  return new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows
      })
    ]
  });
}

function buildMetadataParagraphs(block: MetadataBlock): Paragraph[] {
  switch (block.role) {
    case 'office_address':
      return block.lines.map((line, index) =>
        buildSimpleParagraph(line, {
          alignment: AlignmentType.RIGHT,
          after: index === block.lines.length - 1 ? officeShellLayout.topRightBlock.officeBlockAfterTwips : officeShellLayout.topRightBlock.officeLineAfterTwips
        })
      );
    case 'date_file':
      return [
        buildSimpleParagraph(block.dateLine ?? block.lines[0] ?? '', {
          alignment: AlignmentType.RIGHT,
          after: officeShellLayout.topRightBlock.dateAfterTwips
        }),
        buildSimpleParagraph(block.fileNumberLine ?? block.lines[1] ?? '', {
          alignment: AlignmentType.RIGHT,
          after: officeShellLayout.topRightBlock.fileAfterTwips
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
      const layout = block.reLayout ?? {
        label: 'Re:',
        leadTabCount: 2,
        detailTabCount: 4,
        tabStopTwips: [720, 1440, 1800, 2160, 2520],
        previewHeadlineIndentPx: 22,
        previewLabelWidthPx: 54,
        previewDetailIndentPx: 96
      };
      const tabStops = layout.tabStopTwips.map((position) => ({ position, type: TabStopType.LEFT }));
      const paragraphs = [
        buildParagraph({
          spacing: { after: 40 },
          tabStops,
          children: [buildRun(`${'\t'.repeat(layout.leadTabCount)}${block.reLabel ?? layout.label}\t${block.subjectLine ?? ''}`, { bold: true })]
        })
      ];

      (block.detailLines ?? []).forEach((line, index, lines) => {
        paragraphs.push(
          buildParagraph({
            spacing: {
              after: index === lines.length - 1 ? officeShellLayout.reBlock.trailingSpaceAfterTwips : 30
            },
            tabStops,
            children: [buildRun(`${'\t'.repeat(layout.detailTabCount)}${line}`, { bold: true })]
          })
        );
      });

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

function buildArchivePathParagraph(block: ArchivePathBlock) {
  return buildSimpleParagraph(block.text, {
    size: ARCHIVE_PATH_SIZE,
    after: officeShellLayout.archivePath.afterTwips
  });
}

function buildSignoffParagraphs(block: SignoffBlock): Paragraph[] {
  const paragraphs: Paragraph[] = [
    buildSimpleParagraph(block.salutationLine, {
      after: officeShellLayout.signoff.salutationAfterTwips
    }),
    buildSimpleParagraph(block.organization, {
      after: officeShellLayout.signoff.organizationAfterTwips
    })
  ];

  for (const line of block.lines) {
    paragraphs.push(
      buildSimpleParagraph(line.label, {
        after: officeShellLayout.signoff.labelAfterTwips
      })
    );
    paragraphs.push(
      buildSimpleParagraph(line.value, {
        after: officeShellLayout.signoff.valueAfterTwips,
        indent: { left: officeShellLayout.signoff.valueIndentTwips }
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
      case 'archive_path_block':
        paragraphs.push(buildArchivePathParagraph(block));
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
  const headerLogoData = await loadHeaderLogoData(documentModel);
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
        default: buildHeader(page.headerBlock, {
          logoData: page.headerBlock.logoAsset ? headerLogoData.get(page.headerBlock.logoAsset.filePath) : undefined
        })
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
