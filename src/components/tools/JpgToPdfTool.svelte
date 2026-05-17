<script lang="ts">
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let files = $state<File[]>([]);
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

  function onInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files) files = [...files, ...Array.from(input.files)];
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      const imgs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      files = [...files, ...imgs];
    }
  }

  function remove(i: number) { files = files.filter((_, idx) => idx !== i); }

  function reset() { files = []; error = ''; }

  function fmtSize(n: number) { return n > 1e6 ? `${(n/1e6).toFixed(1)} MB` : `${Math.round(n/1000)} KB`; }

  async function convert() {
    if (files.length === 0) return;
    busy = true;
    error = '';
    progress = { current: 0, total: files.length, label: 'Staging…' };
    try {
      const api = getPdfClient();
      const handles: string[] = [];
      for (let i = 0; i < files.length; i++) {
        progress = { current: i, total: files.length, label: `Staging image ${i + 1}…` };
        handles.push(await api.stage(files[i]));
      }
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const resultHandle = await api.imagesToPdf(handles, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      downloadBlob(blob, 'images.pdf');
      await api.cleanup(resultHandle);
      for (const h of handles) await api.cleanup(h);
      files = [];
    } catch (e) {
      error = 'Conversion failed. Make sure all files are valid images.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }
</script>

<div class="space-y-4">
  <!-- Drop zone / file picker -->
  <div
    role="button"
    tabindex="0"
    ondrop={onDrop}
    ondragover={(e) => e.preventDefault()}
    class="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl p-8 text-center transition-colors cursor-pointer"
    onclick={() => (document.getElementById('img-input') as HTMLInputElement)?.click()}
    onkeydown={(e) => e.key === 'Enter' && (document.getElementById('img-input') as HTMLInputElement)?.click()}
  >
    <p class="text-sm text-slate-500">Drop images here or <span class="text-sky-600 font-medium">browse</span></p>
    <p class="text-xs text-slate-400 mt-1">JPG, PNG, WebP — multiple files allowed</p>
    <input id="img-input" type="file" accept={ACCEPT} multiple class="sr-only" oninput={onInput} />
  </div>

  {#if files.length > 0}
    <ul class="space-y-1.5">
      {#each files as f, i}
        <li class="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
          <span class="truncate text-slate-700 mr-2">{f.name}</span>
          <span class="text-slate-400 shrink-0 mr-2">{fmtSize(f.size)}</span>
          <button onclick={() => remove(i)} disabled={busy} class="text-slate-400 hover:text-red-500 transition-colors">✕</button>
        </li>
      {/each}
    </ul>

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <div class="flex gap-2">
      <button
        onclick={convert}
        disabled={busy}
        class="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? 'Converting…' : `Convert ${files.length} image${files.length === 1 ? '' : 's'} to PDF`}
      </button>
      <button
        onclick={reset}
        disabled={busy}
        class="px-4 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
      >
        Clear
      </button>
    </div>
  {/if}
</div>
