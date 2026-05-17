import { PDFDocument, degrees } from 'pdf-lib';

export async function rotateAll(file: File, angle: 90 | 180 | 270): Promise<Uint8Array> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  src.getPages().forEach(p => {
    const cur = p.getRotation().angle;
    p.setRotation(degrees((cur + angle) % 360));
  });
  return src.save();
}
