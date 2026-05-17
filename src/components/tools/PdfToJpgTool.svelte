<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let handle = $state<string | null>(null);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  async function onFiles(fs: File[]) {
    busy = true;
    error = '';
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

  async function convert() {
    if (!handle) return;
    busy = true;
    error = '';
    try {
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const resultHandle = await api.pdfToImages(handle, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, 'pages.zip', 'application/zip');
      await api.cleanup(resultHandle);
      await api.cleanup(handle);
      handle = null;
    } catch (e) {
      error = 'Export failed. Please try again.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  function reset() {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    handle = null; error = '';
  }
</script>

<div class="space-y-4">
  {#if !handle && !busy}
    <Dropzone onfiles={onFiles} />
  {:else if busy && !handle}
    <div class="py-8">
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    </div>
  {:else if handle}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">PDF ready — each page will be exported as a JPG at 2× resolution.</p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors">
        Load different file
      </button>
    </div>

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={convert}
      disabled={busy}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Exporting…' : 'Export pages as JPG (ZIP)'}
    </button>
  {/if}
</div>
