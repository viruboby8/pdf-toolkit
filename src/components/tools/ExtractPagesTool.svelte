<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ThumbnailGrid from '@/components/ThumbnailGrid.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let handle = $state<string | null>(null);
  let thumbnails = $state<ImageBitmap[]>([]);
  let selection = $state<number[]>([]);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  async function onFiles(fs: File[]) {
    busy = true;
    error = '';
    progress = { current: 0, total: 1, label: 'Staging…' };
    try {
      const api = getPdfClient();
      handle = await api.stage(fs[0]);
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      thumbnails = await api.getThumbnails(handle, onProgress);
    } catch (e) {
      error = 'Could not read PDF. Make sure it is a valid PDF file.';
      handle = null;
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  async function extract() {
    if (!handle || selection.length === 0) return;
    busy = true;
    error = '';
    try {
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const sortedSelection = [...selection].sort((a, b) => a - b);
      const resultHandle = await api.extractPages(handle, sortedSelection, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, 'extracted-pages.pdf');
      await api.cleanup(resultHandle);
      await api.cleanup(handle);
      handle = null;
      thumbnails = [];
      selection = [];
    } catch (e) {
      error = 'Something went wrong. Please try again.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  function reset() {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    handle = null;
    thumbnails = [];
    selection = [];
    error = '';
  }
</script>

<div class="space-y-4">
  {#if !handle && !busy}
    <Dropzone onfiles={onFiles} />
  {:else if busy && thumbnails.length === 0}
    <div class="py-8">
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    </div>
  {:else if thumbnails.length > 0}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">
        {thumbnails.length} pages — click to select pages to extract
        {#if selection.length > 0}
          <span class="ml-2 font-medium text-sky-600">({selection.length} selected)</span>
        {/if}
      </p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors">
        Load different file
      </button>
    </div>

    <ThumbnailGrid {thumbnails} selectable bind:selection />

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={extract}
      disabled={busy || selection.length === 0}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Extracting…' : selection.length === 0 ? 'Select pages to extract' : `Extract ${selection.length} page${selection.length === 1 ? '' : 's'} as New PDF`}
    </button>
  {/if}
</div>
