import { encode, decode } from '@jsquash/jpeg';

export async function jpegEncode(img: ImageData, quality: number): Promise<Uint8Array> {
  return new Uint8Array(await encode(img, { quality }));
}

export async function jpegDecode(bytes: Uint8Array): Promise<ImageData> {
  return decode(bytes.buffer as ArrayBuffer);
}
