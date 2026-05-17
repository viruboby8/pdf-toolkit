<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  type Angle = 90 | 180 | 270;

  let file = $state<File | null>(null);
  let angle = $state<Angle>(90);
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
      const resultHandle = await api.rotate(handle, angle, null, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      const base = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${base}-rotated.pdf`);
      await api.cleanup(handle);
      await api.cleanup(resultHandle);
    } catch (e) {
      error = 'Something went wrong. Please try again.';
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

    <div>
      <p class="text-sm text-slate-600 mb-2">Rotation angle (all pages)</p>
      <div class="flex gap-2">
        {#each ([90, 180, 270] as Angle[]) as a}
          <button
            onclick={() => (angle = a)}
            class={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              angle === a ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            {a}°
          </button>
        {/each}
      </div>
    </div>

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
      {busy ? 'Rotating…' : `Rotate ${angle}° & Download`}
    </button>
  {/if}
</div>
