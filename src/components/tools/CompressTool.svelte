<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';
  import type { CompressResult } from '@/lib/pdf/compress-types';

  let { presetTarget = '' }: { presetTarget?: string } = $props();

  const SIZE_TARGETS: Record<string, number> = {
    '100kb': 100_000,
    '200kb': 200_000,
    '500kb': 500_000,
    '1mb':   1_000_000,
    '2mb':   2_000_000,
  };

  const SIZE_LABELS: Record<string, string> = {
    '100kb': '100 KB', '200kb': '200 KB', '500kb': '500 KB',
    '1mb': '1 MB', '2mb': '2 MB',
  };

  let mode = $state<'quality' | 'target'>(presetTarget ? 'target' : 'quality');
  let qualityPreset = $state<'low' | 'medium' | 'high'>('medium');
  let sizeTarget = $state<string>(presetTarget || '200kb');

  let handle = $state<string | null>(null);
  let fileName = $state('');
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 1, label: '' });
  let result = $state<CompressResult | null>(null);
  let outHandle = $state<string | null>(null);

  async function onFiles(fs: File[]) {
    if (outHandle) { getPdfClient().cleanup(outHandle).catch(() => {}); outHandle = null; }
    if (handle) { getPdfClient().cleanup(handle).catch(() => {}); }
    result = null;
    error = '';
    fileName = fs[0].name;
    busy = true;
    progress = { current: 0, total: 1, label: 'Staging…' };
    try {
      handle = await getPdfClient().stage(fs[0]);
    } catch {
      error = 'Could not read PDF.';
      handle = null;
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  async function compress() {
    if (!handle) return;
    busy = true;
    error = '';
    result = null;
    progress = { current: 0, total: 1, label: 'Starting…' };
    try {
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const opts = mode === 'quality'
        ? { mode: 'quality' as const, quality: qualityPreset }
        : { mode: 'target' as const, targetBytes: SIZE_TARGETS[sizeTarget] };
      const res = await api.compress(handle, opts, onProgress);
      outHandle = res.handle;
      result = res.result;
    } catch (e) {
      error = 'Compression failed. Please try again.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  async function download() {
    if (!outHandle) return;
    const blob = await getPdfClient().getResultBlob(outHandle);
    const base = fileName.replace(/\.pdf$/i, '');
    downloadBlob(blob, `${base}-compressed.pdf`);
  }

  function reset() {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    if (outHandle) getPdfClient().cleanup(outHandle).catch(() => {});
    handle = null; outHandle = null; result = null; error = ''; fileName = '';
  }

  function fmtBytes(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
    return `${Math.round(n / 1000)} KB`;
  }
</script>

<div class="space-y-5">
  {#if !handle}
    <Dropzone onfiles={onFiles} />
  {:else}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500 truncate max-w-xs">{fileName}</p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-4">
        Load different file
      </button>
    </div>

    <!-- Mode tabs -->
    <div class="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
      <button
        onclick={() => mode = 'quality'}
        class={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'quality' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        By quality
      </button>
      <button
        onclick={() => mode = 'target'}
        class={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'target' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        By size target
      </button>
    </div>

    {#if mode === 'quality'}
      <div class="flex gap-2">
        {#each ['low', 'medium', 'high'] as q}
          <button
            onclick={() => qualityPreset = q as 'low' | 'medium' | 'high'}
            class={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${qualityPreset === q ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'}`}
          >
            {q.charAt(0).toUpperCase() + q.slice(1)}
          </button>
        {/each}
      </div>
      <p class="text-xs text-slate-400">
        {qualityPreset === 'low' ? 'Max compression — good for scanned documents, small file uploads' :
         qualityPreset === 'medium' ? 'Balanced — smaller file, readable quality' :
         'Light compression — minimal quality loss'}
      </p>
    {:else}
      <div class="flex flex-wrap gap-2">
        {#each Object.keys(SIZE_TARGETS) as t}
          <button
            onclick={() => sizeTarget = t}
            class={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${sizeTarget === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'}`}
          >
            {SIZE_LABELS[t]}
          </button>
        {/each}
      </div>
      <p class="text-xs text-slate-400">
        Iteratively re-encodes images to reach the target size. Works best on scanned PDFs.
        Text-heavy PDFs may not reach very small targets.
      </p>
    {/if}

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    {#if result}
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
        <p class="text-sm font-semibold text-emerald-800">
          Compressed {result.percentSaved}% smaller
        </p>
        <p class="text-xs text-emerald-700">
          {fmtBytes(result.originalBytes)} → {fmtBytes(result.compressedBytes)}
          {#if result.compressedBytes > (mode === 'target' ? SIZE_TARGETS[sizeTarget] : 0) && mode === 'target'}
            <span class="ml-2 text-amber-600 font-medium">
              (couldn't reach {SIZE_LABELS[sizeTarget]} — closest possible)
            </span>
          {/if}
        </p>
      </div>
      <button
        onclick={download}
        class="w-full py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
      >
        Download compressed PDF
      </button>
    {/if}

    {#if !result}
      <button
        onclick={compress}
        disabled={busy}
        class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? 'Compressing…' : 'Compress PDF'}
      </button>
    {/if}
  {/if}
</div>
