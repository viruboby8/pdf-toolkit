<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import FileList from '@/components/FileList.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let files = $state<File[]>([]);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  async function go() {
    if (files.length < 2) return;
    busy = true;
    error = '';
    progress = { current: 0, total: files.length, label: 'Staging files…' };
    try {
      const api = getPdfClient();
      const handles = await Promise.all(files.map(f => api.stage(f)));
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const resultHandle = await api.merge(handles, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, `merged-${new Date().toISOString().slice(0, 10)}.pdf`);
      await Promise.all([...handles, resultHandle].map(h => api.cleanup(h)));
    } catch (e) {
      error = 'Something went wrong. Please try again with different files.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }
</script>

<div class="space-y-4">
  <Dropzone multiple onfiles={fs => (files = [...files, ...fs])} />
  <FileList bind:files />

  {#if busy}
    <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
  {/if}

  {#if error}
    <p class="text-red-600 text-sm">{error}</p>
  {/if}

  {#if files.length > 0}
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">{files.length} file{files.length === 1 ? '' : 's'} — drag to reorder</p>
      <div class="flex gap-2">
        <button
          onclick={() => (files = [])}
          disabled={busy}
          class="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
        <button
          onclick={go}
          disabled={files.length < 2 || busy}
          class="px-5 py-2 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? 'Merging…' : `Merge ${files.length} files`}
        </button>
      </div>
    </div>
  {/if}
</div>
