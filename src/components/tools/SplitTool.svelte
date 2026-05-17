<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  type Mode = 'everyN' | 'range';

  let file = $state<File | null>(null);
  let mode = $state<Mode>('everyN');
  let everyN = $state(1);
  let rangeStart = $state(1);
  let rangeEnd = $state(1);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  function onFiles(fs: File[]) {
    file = fs[0];
    error = '';
  }

  async function go() {
    if (!file) return;
    busy = true;
    error = '';
    progress = { current: 0, total: 1, label: 'Staging…' };
    try {
      const api = getPdfClient();
      const handle = await api.stage(file);
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      let resultHandle: string;
      let filename: string;
      let mime = 'application/pdf';
      if (mode === 'everyN') {
        resultHandle = await api.splitEveryN(handle, everyN, onProgress);
        filename = 'split-parts.zip';
        mime = 'application/zip';
      } else {
        resultHandle = await api.splitByRange(handle, rangeStart, rangeEnd, onProgress);
        filename = `pages-${rangeStart}-${rangeEnd}.pdf`;
      }
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, filename, mime);
      await api.cleanup(handle);
      await api.cleanup(resultHandle);
    } catch (e) {
      error = 'Something went wrong. Check the page numbers and try again.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }
</script>

<div class="space-y-4">
  {#if !file}
    <Dropzone onfiles={onFiles} />
  {:else}
    <div class="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
      <svg class="w-8 h-8 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p class="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>
      <button
        onclick={() => { file = null; error = ''; }}
        class="text-slate-400 hover:text-red-500 transition-colors p-1"
        aria-label="Remove file"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex gap-2">
      <button
        onclick={() => (mode = 'everyN')}
        class={`flex-1 py-2 text-sm rounded-lg border transition-colors ${mode === 'everyN' ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        Every N pages
      </button>
      <button
        onclick={() => (mode = 'range')}
        class={`flex-1 py-2 text-sm rounded-lg border transition-colors ${mode === 'range' ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        Page range
      </button>
    </div>

    {#if mode === 'everyN'}
      <div class="flex items-center gap-3">
        <label for="everyN" class="text-sm text-slate-600 whitespace-nowrap">Split every</label>
        <input
          id="everyN"
          type="number"
          min="1"
          bind:value={everyN}
          class="w-20 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span class="text-sm text-slate-600">page(s)</span>
      </div>
    {:else}
      <div class="flex items-center gap-3">
        <label for="rangeStart" class="text-sm text-slate-600 whitespace-nowrap">Pages</label>
        <input
          id="rangeStart"
          type="number"
          min="1"
          bind:value={rangeStart}
          class="w-20 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span class="text-sm text-slate-500">to</span>
        <input
          id="rangeEnd"
          type="number"
          min="1"
          bind:value={rangeEnd}
          class="w-20 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="End page"
        />
      </div>
    {/if}

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={go}
      disabled={busy}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Splitting…' : 'Split & Download'}
    </button>
  {/if}
</div>
