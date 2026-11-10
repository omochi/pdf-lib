import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';

import {
  CustomFontSubsetEmbedder,
  PDFContext,
  PDFDict,
  PDFHexString,
} from 'src/index';

const ubuntuFont = fs.readFileSync('./assets/fonts/ubuntu/Ubuntu-R.ttf');

describe(`CustomFontSubsetEmbedder`, () => {
  it(`can be constructed with CustomFontSubsetEmbedder.for(...)`, async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    expect(embedder).toBeInstanceOf(CustomFontSubsetEmbedder);
  });

  it(`can embed standard font dictionaries into PDFContexts`, async () => {
    const context = PDFContext.create();
    const embedder = await CustomFontSubsetEmbedder.for(
      fontkit,
      new Uint8Array(ubuntuFont),
    );

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = await embedder.embedIntoContext(context);
    expect(context.enumerateIndirectObjects().length).toBe(5);
    expect(context.lookup(ref)).toBeInstanceOf(PDFDict);
  });

  it(`can encode text strings into PDFHexString objects`, async () => {
    const text = 'Stuff and thingz!';
    const hexCodes =
      '00010002000300040005000600070008000500020009000A0007000B000C000D';
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);

    expect(embedder.encodeText(text)).toBeInstanceOf(PDFHexString);
    expect(String(embedder.encodeText(text))).toBe(
      String(PDFHexString.of(hexCodes)),
    );
  });

  it(`encodes an existing glyph run without reshaping and rejects another font`, async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    const glyphs = embedder.font
      .layout('office')
      .clusters.flatMap((cluster) => cluster.glyphs.map((item) => item.glyph));
    const spy = jest.spyOn(embedder.font, 'layout');
    expect(embedder.encodeGlyphs(glyphs)).toBeInstanceOf(PDFHexString);
    expect(spy).not.toHaveBeenCalled();
    const another = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    expect(() =>
      embedder.encodeGlyphs(
        another.font
          .layout('x')
          .clusters.flatMap((cluster) =>
            cluster.glyphs.map((item) => item.glyph),
          ),
      ),
    ).toThrow('different font instance');
  });

  it(`can measure the width of text strings at the given font size`, async () => {
    const text = 'Stuff and thingz!';
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    expect(embedder.widthOfTextAtSize(text, 12)).toBe(90.672);
    expect(embedder.widthOfTextAtSize(text, 24)).toBe(181.344);
  });

  it(`caches font layout by text`, async () => {
    const text = 'Stuff and thingz!';
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    const layout = jest.spyOn(embedder.font, 'layout');

    embedder.widthOfTextAtSize(text, 12);
    embedder.widthOfTextAtSize(text, 24);
    embedder.encodeText(text);
    embedder.encodeText(text);

    expect(layout).toHaveBeenCalledTimes(1);

    embedder.encodeText('Other text');

    expect(layout).toHaveBeenCalledTimes(2);
  });

  it(`can measure the height of the font at the given size`, async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    expect(embedder.heightOfFontAtSize(12)).toBeCloseTo(13.452);
    expect(embedder.heightOfFontAtSize(24)).toBeCloseTo(26.904);
  });

  it(`can measure the size of the font at a given height`, async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fontkit, ubuntuFont);
    expect(embedder.sizeOfFontAtHeight(12)).toBeCloseTo(10.705);
    expect(embedder.sizeOfFontAtHeight(24)).toBeCloseTo(21.409);
  });
});
