<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';

  let handle = $state<string | null>(null);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });
  let text = $state('');
  let copied = $state(false);

  async function onFiles(fs: File[]) {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    error = ''; text = '';
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

  async function runOcr() {
    if (!handle) return;
    busy = true;
    error = '';
    text = '';
    try {
      // Get page bitmaps from the worker
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      progress = { current: 0, total: 1, label: 'Rendering pages…' };
      const bitmaps = await api.getThumbnails(handle, onProgress);

      // Lazy-load Tesseract on first use
      progress = { current: 0, total: bitmaps.length, label: 'Loading OCR engine…' };
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');

      const pages: string[] = [];
      for (let i = 0; i < bitmaps.length; i++) {
        progress = { current: i + 1, total: bitmaps.length, label: `OCR page ${i + 1} of ${bitmaps.length}…` };
        // Draw bitmap to a canvas to get ImageData for Tesseract
        const canvas = document.createElement('canvas');
        canvas.width = bitmaps[i].width;
        canvas.height = bitmaps[i].height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmaps[i], 0, 0);
        const { data: { text: t } } = await worker.recognize(canvas);
        pages.push(t.trim());
        bitmaps[i].close();
      }
      await worker.terminate();
      text = pages.join('\n\n--- Page break ---\n\n');
    } catch (e) {
      error = 'OCR failed. Please try again.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function downloadText() {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'extracted-text.txt' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    handle = null; text = ''; error = '';
  }
</script>

<div class="space-y-4">
  {#if !handle && !busy}
    <Dropzone onfiles={onFiles} />
  {:else if busy && !handle}
    <div class="py-8">
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    </div>
  {:else if handle && !text}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">PDF ready. Extract text from all pages using OCR.</p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors">
        Load different file
      </button>
    </div>

    <div class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
      OCR works best on scanned documents with clear text. The engine (~10 MB) is downloaded on first use and cached.
    </div>

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={runOcr}
      disabled={busy}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Extracting text…' : 'Extract text (OCR)'}
    </button>
  {:else if text}
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-slate-700">Extracted text</p>
      <div class="flex gap-2">
        <button
          onclick={copyText}
          class="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onclick={downloadText}
          class="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
        >
          Download .txt
        </button>
        <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors">
          New file
        </button>
      </div>
    </div>
    <textarea
      readonly
      value={text}
      class="w-full h-72 text-xs font-mono p-3 border border-slate-200 rounded-lg resize-y bg-slate-50 text-slate-700 focus:outline-none"
    ></textarea>
  {/if}
</div>
