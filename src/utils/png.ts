import { PNG as PNGJS } from 'pngjs';

const splitAlphaChannel = (rgbaChannel: Uint8Array) => {
  const pixelCount = Math.floor(rgbaChannel.length / 4);

  const rgbChannel = new Uint8Array(pixelCount * 3);
  const alphaChannel = new Uint8Array(pixelCount * 1);

  let rgbaOffset = 0;
  let rgbOffset = 0;
  let alphaOffset = 0;

  while (rgbaOffset < rgbaChannel.length) {
    rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
    rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
    rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
    alphaChannel[alphaOffset++] = rgbaChannel[rgbaOffset++];
  }

  return { rgbChannel, alphaChannel };
};

export class PNG {
  static load = (pngData: Uint8Array) => new PNG(pngData);

  readonly rgbChannel: Uint8Array;
  readonly alphaChannel?: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly bitsPerComponent: number;

  private constructor(pngData: Uint8Array) {
    const png = PNGJS.sync.read(Buffer.from(pngData));
    const frame = new Uint8Array(png.data);
    const { rgbChannel, alphaChannel } = splitAlphaChannel(frame);

    this.rgbChannel = rgbChannel;

    const hasAlphaValues = alphaChannel.some((a) => a < 255);
    if (hasAlphaValues) this.alphaChannel = alphaChannel;

    this.width = png.width;
    this.height = png.height;
    this.bitsPerComponent = 8;
  }
}
