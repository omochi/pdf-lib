import { inflateSync } from 'node:zlib';

import {
  PDFContext,
  PDFName,
  PDFParser,
  PDFRawStream,
  PDFRef,
  PDFStreamWriter,
} from 'src/index';

const contentStreamText = `
  BT
    /F1 24 Tf
    100 100 Td
    (Hello World and stuff!) Tj
  ET
`;

describe(`PDFStreamWriter`, () => {
  it(`serializes PDFContext objects using Indirect Objects, Object Streams, and XRef Streams`, async () => {
    const context = PDFContext.create();

    const contentStream = context.flateStream(contentStreamText);
    const contentStreamRef = PDFRef.of(9000);
    context.assign(contentStreamRef, contentStream);

    const fontDict = context.obj({
      Type: 'Font',
      Subtype: 'Type1',
      Name: 'F1',
      BaseFont: 'Helvetica',
      Encoding: 'MacRomanEncoding',
    });
    const fontDictRef = context.register(fontDict);

    const page = context.obj({
      Type: 'Page',
      MediaBox: [0, 0, 612, 792],
      Contents: contentStreamRef,
      Resources: { Font: { F1: fontDictRef } },
    });
    const pageRef = context.register(page);

    const pages = context.obj({
      Type: 'Pages',
      Kids: [pageRef],
      Count: 1,
    });
    const pagesRef = context.register(pages);
    page.set(PDFName.of('Parent'), pagesRef);

    const catalog = context.obj({
      Type: 'Catalog',
      Pages: pagesRef,
    });
    context.trailerInfo.Root = context.register(catalog);

    const buffer = await PDFStreamWriter.forContext(
      context,
      Infinity,
      false,
      2,
    ).serializeToBuffer();

    const bytes = Buffer.from(buffer);
    const marker = bytes.lastIndexOf('startxref\n');
    expect(marker).toBeGreaterThanOrEqual(0);
    const xrefOffset = Number(
      bytes
        .subarray(marker + 10)
        .toString('ascii')
        .split('\n')[0],
    );
    expect(bytes.subarray(xrefOffset, xrefOffset + 11).toString('ascii')).toBe(
      '9007 0 obj\n',
    );
    const streamMarker = bytes.indexOf('\nstream\n', xrefOffset) + 8;
    expect(streamMarker).toBeGreaterThan(xrefOffset);
    const xrefEntries = Array.from({ length: 9 }, (_, index) => {
      const entry = bytes.subarray(
        streamMarker + index * 5,
        streamMarker + (index + 1) * 5,
      );
      return [entry[0], entry.readUInt16BE(1), entry.readUInt16BE(3)];
    });
    expect(xrefEntries).toEqual([
      [0, 0, 65535],
      [1, bytes.indexOf('9000 0 obj\n'), 0],
      [2, 9005, 0],
      [2, 9005, 1],
      [2, 9006, 0],
      [2, 9006, 1],
      [1, bytes.indexOf('9005 0 obj\n'), 0],
      [1, bytes.indexOf('9006 0 obj\n'), 0],
      [1, xrefOffset, 0],
    ]);

    const parsed = await PDFParser.forBytesWithOptions(
      buffer,
      Infinity,
      true,
    ).parseDocument();
    const parsedStream = parsed.lookup(contentStreamRef);
    expect(parsedStream).toBeInstanceOf(PDFRawStream);
    expect(
      inflateSync((parsedStream as PDFRawStream).contents).toString(),
    ).toBe(contentStreamText);
    for (const ref of [
      fontDictRef,
      pageRef,
      pagesRef,
      context.trailerInfo.Root!,
    ]) {
      expect(String(parsed.lookup(ref))).toBe(String(context.lookup(ref)));
    }
    expect(parsed.trailerInfo.Root).toBe(context.trailerInfo.Root);
  });
});
