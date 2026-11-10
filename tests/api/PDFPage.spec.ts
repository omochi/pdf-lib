import fs from 'fs';
import fontkit from '@pdf-lib/fontkit';

import { PDFArray, PDFDocument, PDFHexString, PDFName, rgb } from 'src/index';

const birdPng = fs.readFileSync('assets/images/greyscale_bird.png');
const ubuntuFont = fs.readFileSync('assets/fonts/ubuntu/Ubuntu-R.ttf');

describe(`PDFDocument`, () => {
  describe(`getSize() method`, () => {
    it(`returns the width and height of the the page's MediaBox`, async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      page.node.set(PDFName.MediaBox, pdfDoc.context.obj([5, 5, 20, 50]));
      expect(page.getSize()).toEqual({ width: 15, height: 45 });
    });
  });

  describe(`setSize() method`, () => {
    it(`sets the width and height of only the the page's MediaBox when the other boxes are not defined`, async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      page.setMediaBox(5, 5, 20, 50);
      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.node.MediaBox()).toBeInstanceOf(PDFArray);
      expect(page.node.CropBox()).toBeUndefined();
      expect(page.node.BleedBox()).toBeUndefined();
      expect(page.node.TrimBox()).toBeUndefined();
      expect(page.node.ArtBox()).toBeUndefined();

      page.setSize(15, 45);
      expect(page.getSize()).toEqual({ width: 15, height: 45 });
      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.node.MediaBox()).toBeInstanceOf(PDFArray);
      expect(page.node.CropBox()).toBeUndefined();
      expect(page.node.BleedBox()).toBeUndefined();
      expect(page.node.TrimBox()).toBeUndefined();
      expect(page.node.ArtBox()).toBeUndefined();
    });

    it(`sets the width and height of the the page's CropBox, BleedBox, TrimBox, and ArtBox when they equal the MediaBox`, async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      page.setMediaBox(5, 5, 20, 50);
      page.setCropBox(5, 5, 20, 50);
      page.setBleedBox(5, 5, 20, 50);
      page.setTrimBox(5, 5, 20, 50);
      page.setArtBox(5, 5, 20, 50);

      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.getCropBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.getBleedBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.getTrimBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.getArtBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });

      expect(page.node.MediaBox()).toBeInstanceOf(PDFArray);
      expect(page.node.CropBox()).toBeInstanceOf(PDFArray);
      expect(page.node.BleedBox()).toBeInstanceOf(PDFArray);
      expect(page.node.TrimBox()).toBeInstanceOf(PDFArray);
      expect(page.node.ArtBox()).toBeInstanceOf(PDFArray);

      page.setSize(15, 45);
      expect(page.getSize()).toEqual({ width: 15, height: 45 });
      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.getCropBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.getBleedBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.getTrimBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.getArtBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
    });

    it(`does not set the width and height of the the page's CropBox, BleedBox, TrimBox, or ArtBox when they do not equal the MediaBox`, async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      page.setMediaBox(5, 5, 20, 50);
      page.setCropBox(0, 0, 20, 50);
      page.setBleedBox(5, 5, 10, 25);
      page.setTrimBox(5, 0, 10, 50);
      page.setArtBox(0, 5, 20, 25);

      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 20, height: 50 });
      expect(page.getCropBox()).toEqual({ x: 0, y: 0, width: 20, height: 50 });
      expect(page.getBleedBox()).toEqual({ x: 5, y: 5, width: 10, height: 25 });
      expect(page.getTrimBox()).toEqual({ x: 5, y: 0, width: 10, height: 50 });
      expect(page.getArtBox()).toEqual({ x: 0, y: 5, width: 20, height: 25 });

      expect(page.node.MediaBox()).toBeInstanceOf(PDFArray);
      expect(page.node.CropBox()).toBeInstanceOf(PDFArray);
      expect(page.node.BleedBox()).toBeInstanceOf(PDFArray);
      expect(page.node.TrimBox()).toBeInstanceOf(PDFArray);
      expect(page.node.ArtBox()).toBeInstanceOf(PDFArray);

      page.setSize(15, 45);
      expect(page.getSize()).toEqual({ width: 15, height: 45 });
      expect(page.getMediaBox()).toEqual({ x: 5, y: 5, width: 15, height: 45 });
      expect(page.getCropBox()).toEqual({ x: 0, y: 0, width: 20, height: 50 });
      expect(page.getBleedBox()).toEqual({ x: 5, y: 5, width: 10, height: 25 });
      expect(page.getTrimBox()).toEqual({ x: 5, y: 0, width: 10, height: 50 });
      expect(page.getArtBox()).toEqual({ x: 0, y: 5, width: 20, height: 25 });
    });
  });

  it('draws positioned glyphs with one reusable font resource and rejects foreign glyphs', async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(ubuntuFont, { subset: true });
    const page = doc.addPage();
    const glyph = font.layoutFont.layout('A').clusters[0].glyphs[0].glyph;
    const options = { font, size: 12, color: rgb(0, 0, 0), actualText: 'A' };
    page.drawGlyphs([{ glyph, matrix: [1, 0, 0, 1, 10, 20] }], options);
    page.drawGlyphs([{ glyph, matrix: [1, 0, 0, 1, 30, 20] }], options);
    expect(page.node.normalizedEntries().Font.keys().length).toBe(1);
    const other = await doc.embedFont(ubuntuFont, { subset: true });
    expect(() =>
      page.drawGlyphs(
        [
          {
            glyph: other.layoutFont.layout('A').clusters[0].glyphs[0].glyph,
            matrix: [1, 0, 0, 1, 0, 0],
          },
        ],
        options,
      ),
    ).toThrow();
    expect((await doc.save()).length).toBeGreaterThan(0);
  });

  it('draws vertically substituted glyphs from a CJK font subset', async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const bytes = fs.readFileSync(
      'assets/fonts/source_hans_jp/SourceHanSerifJP-Regular.otf',
    );
    const font = await doc.embedFont(bytes, { subset: true });
    const horizontal = font.layoutFont.layout('（あ）');
    const vertical = font.layoutFont.layout('（あ）', [], null, null, 'ttb');
    expect(vertical.clusters.map((cluster) => cluster.sourceText)).toEqual([
      '（',
      'あ',
      '）',
    ]);
    expect(vertical.clusters[0].glyphs[0].glyph.id).not.toEqual(
      horizontal.clusters[0].glyphs[0].glyph.id,
    );
    expect(
      vertical.clusters.every((cluster) =>
        cluster.glyphs.every((item) => item.position.yAdvance < 0),
      ),
    ).toBe(true);

    const page = doc.addPage();
    const push = jest.spyOn(page, 'pushOperators');
    page.drawGlyphClusters(
      vertical.clusters.map((cluster, index) => ({
        sourceText: cluster.sourceText,
        glyphs: cluster.glyphs.map(({ glyph }) => ({
          glyph,
          matrix: [1, 0, 0, 1, 100, 300 - index * 20],
        })),
      })),
      { font, size: 20, color: rgb(0, 0, 0) },
    );
    const operators = push.mock.calls[0].map((operator) => operator.toString());
    expect(
      operators.filter((operator) => operator.endsWith('Tj')),
    ).toHaveLength(3);
    expect(
      operators.filter((operator) => operator.endsWith('BDC')),
    ).toHaveLength(3);
    expect((await doc.save()).length).toBeGreaterThan(0);
  });

  it('writes a separate ActualText span for each positioned glyph cluster', async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(ubuntuFont, { subset: true });
    const page = doc.addPage();
    const first = font.layoutFont.layout('A').clusters[0].glyphs[0].glyph;
    const second = font.layoutFont.layout('B').clusters[0].glyphs[0].glyph;
    const push = jest.spyOn(page, 'pushOperators');
    page.drawGlyphClusters(
      [
        {
          sourceText: 'A',
          glyphs: [{ glyph: first, matrix: [1, 0, 0, 1, 10, 20] }],
        },
        {
          sourceText: 'B',
          glyphs: [{ glyph: second, matrix: [1, 0, 0, 1, 20, 20] }],
        },
      ],
      { font, size: 12, color: rgb(0, 0, 0) },
    );
    const operators = push.mock.calls[0].map((operator) => operator.toString());
    const marked = operators.filter((operator) => operator.endsWith('BDC'));
    expect(marked).toHaveLength(2);
    expect(marked[0]).toContain(PDFHexString.fromText('A').toString());
    expect(marked[1]).toContain(PDFHexString.fromText('B').toString());
    expect(
      operators.filter((operator) => operator.endsWith('Tj')),
    ).toHaveLength(2);
  });

  it('preserves logical text when clusters are supplied in a different drawing order', async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(ubuntuFont, { subset: true });
    const page = doc.addPage();
    const a = font.layoutFont.layout('A').clusters[0].glyphs[0].glyph;
    const b = font.layoutFont.layout('B').clusters[0].glyphs[0].glyph;
    const push = jest.spyOn(page, 'pushOperators');
    page.drawGlyphClusters(
      [
        {
          sourceText: 'B',
          glyphs: [{ glyph: b, matrix: [1, 0, 0, 1, 10, 20] }],
        },
        {
          sourceText: 'A',
          glyphs: [{ glyph: a, matrix: [1, 0, 0, 1, 20, 20] }],
        },
      ],
      { font, size: 12, color: rgb(0, 0, 0), actualText: 'AB' },
    );
    const marked = push.mock.calls[0]
      .map((operator) => operator.toString())
      .filter((operator) => operator.endsWith('BDC'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toContain(PDFHexString.fromText('AB').toString());
  });

  // https://github.com/Hopding/pdf-lib/issues/1075
  it(`drawImage() does not reuse existing XObject keys`, async () => {
    const pdfDoc1 = await PDFDocument.create();
    const image1 = await pdfDoc1.embedPng(birdPng);
    const page1 = pdfDoc1.addPage();

    expect(page1.node.normalizedEntries().XObject.keys().length).toEqual(0);
    page1.drawImage(image1);
    expect(page1.node.normalizedEntries().XObject.keys().length).toEqual(1);

    const key1 = page1.node.normalizedEntries().XObject.keys()[0];

    const pdfDoc2 = await PDFDocument.load(await pdfDoc1.save());
    const image2 = await pdfDoc2.embedPng(birdPng);
    const page2 = pdfDoc2.getPage(0);

    expect(page2.node.normalizedEntries().XObject.keys().length).toEqual(1);
    page2.drawImage(image2);
    expect(page2.node.normalizedEntries().XObject.keys().length).toEqual(2);

    const key2 = page2.node.normalizedEntries().XObject.keys()[1];
    expect(key1).not.toEqual(key2);
    expect(page2.node.normalizedEntries().XObject.keys()).toEqual([key1, key2]);
  });

  // https://github.com/Hopding/pdf-lib/issues/1075
  it(`setFont() does not reuse existing Font keys`, async () => {
    const pdfDoc1 = await PDFDocument.create();
    pdfDoc1.registerFontkit(fontkit);
    const font1 = await pdfDoc1.embedFont(ubuntuFont);
    const page1 = pdfDoc1.addPage();

    expect(page1.node.normalizedEntries().Font.keys().length).toEqual(0);
    page1.setFont(font1);
    expect(page1.node.normalizedEntries().Font.keys().length).toEqual(1);

    const key1 = page1.node.normalizedEntries().Font.keys()[0];

    const pdfDoc2 = await PDFDocument.load(await pdfDoc1.save());
    pdfDoc2.registerFontkit(fontkit);
    const font2 = await pdfDoc2.embedFont(ubuntuFont);
    const page2 = pdfDoc2.getPage(0);

    expect(page2.node.normalizedEntries().Font.keys().length).toEqual(1);
    page2.setFont(font2);
    expect(page2.node.normalizedEntries().Font.keys().length).toEqual(2);

    const key2 = page2.node.normalizedEntries().Font.keys()[1];
    expect(key1).not.toEqual(key2);
    expect(page2.node.normalizedEntries().Font.keys()).toEqual([key1, key2]);
  });
});
