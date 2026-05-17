<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';

  interface Props {
    files: File[];
    onreorder?: (files: File[]) => void;
    onremove?: (index: number) => void;
  }

  let { files = $bindable(), onreorder, onremove }: Props = $props();

  interface DndItem { id: number; file: File }

  let items = $derived(files.map((file, i) => ({ id: i, file })));

  function handleSort(e: CustomEvent<{ items: DndItem[] }>) {
    files = e.detail.items.map(item => item.file);
    onreorder?.(files);
  }

  function remove(index: number) {
    files = files.filter((_, i) => i !== index);
    onremove?.(index);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

{#if items.length > 0}
  <ul
    class="mt-4 space-y-2"
    use:dndzone={{ items, flipDurationMs: 200 }}
    onconsider={handleSort}
    onfinalize={handleSort}
  >
    {#each items as { id, file } (id)}
      <li class="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing shadow-sm">
        <!-- PDF icon -->
        <svg class="w-8 h-8 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 17h2v1H7v-1zm0-2h2v1H7v-1zm0-2h10v1H7v-1zm0-2h10v1H7v-1zm0-2h10v1H7V9z"/>
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">{file.name}</p>
          <p class="text-xs text-slate-400">{formatSize(file.size)}</p>
        </div>
        <button
          onclick={() => remove(items.findIndex(i => i.id === id))}
          aria-label={`Remove ${file.name}`}
          class="p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>
{/if}
