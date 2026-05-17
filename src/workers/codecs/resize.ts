import resize from '@jsquash/resize';

export async function clampLongestSide(img: ImageData, maxSide: number): Promise<ImageData> {
  const long = Math.max(img.width, img.height);
  if (long <= maxSide) return img;
  const scale = maxSide / long;
  return resize(img, {
    width: Math.round(img.width * scale),
    height: Math.round(img.height * scale),
    method: 'lanczos3',
  });
}
