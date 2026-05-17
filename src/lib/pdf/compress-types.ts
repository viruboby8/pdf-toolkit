export type QualityPreset = 'low' | 'medium' | 'high';

export type CompressOpts =
  | { mode: 'quality'; quality: QualityPreset; gsFallback?: boolean }
  | { mode: 'target'; targetBytes: number; gsFallback?: boolean };

export interface CompressResult {
  originalBytes: number;
  compressedBytes: number;
  percentSaved: number;
  attemptsUsed: number;
  fellBackToGs: boolean;
}

export interface CompressResponse {
  handle: string;
  result: CompressResult;
}
