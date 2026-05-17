<script lang="ts">
  import Dropzone from '@/components/Dropzone.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let handle = $state<string | null>(null);
  let fileName = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state('');
  let progress = $state({ current: 0, total: 0, label: '' });

  async function onFiles(fs: File[]) {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
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

  async function remove() {
    if (!handle) return;
    busy = true;
    error = '';
    try {
      const api = getPdfClient();
      const onProgress = Comlink.proxy((c: number, t: number, label = '') => {
        progress = { current: c, total: t, label };
      });
      const resultHandle = await api.removePassword(handle, password, onProgress);
      const blob = await api.getResultBlob(resultHandle);
      const base = fileName.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${base}-unlocked.pdf`);
      await api.cleanup(resultHandle);
      await api.cleanup(handle);
      handle = null;
      password = '';
      fileName = '';
    } catch (e) {
      error = 'Could not remove password. Check that the password is correct.';
      console.error(e);
    } finally {
      busy = false;
      progress = { current: 0, total: 0, label: '' };
    }
  }

  function reset() {
    if (handle) getPdfClient().cleanup(handle).catch(() => {});
    handle = null; password = ''; error = ''; fileName = '';
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
      <p class="text-sm text-slate-500 truncate max-w-xs">{fileName}</p>
      <button onclick={reset} class="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-4">
        Load different file
      </button>
    </div>

    <div class="space-y-1">
      <label for="pdf-password" class="text-sm font-medium text-slate-700">PDF password</label>
      <input
        id="pdf-password"
        type="password"
        bind:value={password}
        placeholder="Enter the current password"
        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </div>

    {#if busy}
      <ProgressBar current={progress.current} total={progress.total} label={progress.label} />
    {/if}

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      onclick={remove}
      disabled={busy || !password}
      class="w-full py-2.5 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? 'Removing password…' : 'Remove password & Download'}
    </button>
  {/if}
</div>
