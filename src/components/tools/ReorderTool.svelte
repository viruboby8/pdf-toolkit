<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ThumbnailGrid from '@/components/ThumbnailGrid.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let handle = $state<string | null>(null);
  let thumbnails = $state<ImageBitmap[]>([]);
  let order = $state<number[]>([]);
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
      order = thumbnails.map((_, i) => i);
    } catch (e) {
      error = 'Could not read PDF. Make sure it is a valid PDF file.';
      handle = null;
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  async function save() {
    if (!handle) return;
    busy = true;
    error = '';
    try {
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const resultHandle = await api.reorder(handle, order, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, 'reordered.pdf');
      await api.cleanup(resultHandle);
      await api.cleanup(handle);
      handle = null;
      thumbnails = [];
      order = [];
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
    order = [];
    error = '';
  }
</script>

<div class="space-y-4">
  {#if !handle && !busy}
    <Dropzone onfiles={onFiles} />
  {:else if busy && thumbnails.length === 0}
    <div class="py-8 text-center text-slate-500 text-sm">
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    </div>
  {:else if thumbnails.length > 0}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">{thumbnails.length} pages — drag to reorder</p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors">
        Load different file
      </button>
    </div>

    <ThumbnailGrid {thumbnails} bind:order />

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={save}
      disabled={busy}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Saving…' : 'Save Reordered PDF'}
    </button>
  {/if}
</div>
