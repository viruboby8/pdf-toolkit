<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';

  interface Props {
    thumbnails: ImageBitmap[];
    selectable?: boolean;
    order?: number[];
    selection?: number[];
  }

  let {
    thumbnails,
    selectable = false,
    order = $bindable(thumbnails.map((_, i) => i)),
    selection = $bindable<number[]>([]),
  }: Props = $props();

  interface Item { id: number; origIndex: number }

  let items = $derived(order.map(origIndex => ({ id: origIndex, origIndex })));

  function handleSort(e: CustomEvent<{ items: Item[] }>) {
    order = e.detail.items.map(it => it.origIndex);
  }

  function toggleSelect(origIndex: number, e: MouseEvent | KeyboardEvent) {
    if (!selectable) return;
    const me = e as MouseEvent;
    if (me.shiftKey && selection.length > 0) {
      const last = selection[selection.length - 1];
      const a = order.indexOf(last);
      const b = order.indexOf(origIndex);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      selection = [...new Set([...selection, ...order.slice(lo, hi + 1)])];
    } else if (me.metaKey || me.ctrlKey) {
      selection = selection.includes(origIndex)
        ? selection.filter(i => i !== origIndex)
        : [...selection, origIndex];
    } else {
      selection = selection.includes(origIndex) && selection.length === 1 ? [] : [origIndex];
    }
  }

  function drawBitmap(canvas: HTMLCanvasElement, bmp: ImageBitmap | undefined) {
    function draw(b: ImageBitmap | undefined) {
      if (!b) return;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(b, 0, 0);
    }
    draw(bmp);
    return {
      update(newBmp: ImageBitmap | undefined) { draw(newBmp); },
    };
  }
</script>

<div
  class="grid gap-2 mt-4"
  style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));"
  use:dndzone={{ items, flipDurationMs: 150 }}
  onconsider={handleSort}
  onfinalize={handleSort}
>
  {#each items as { origIndex } (origIndex)}
    {@const bmp = thumbnails[origIndex]}
    {@const selected = selection.includes(origIndex)}
    <div
      role={selectable ? 'checkbox' : 'img'}
      aria-checked={selectable ? selected : undefined}
      aria-label={`Page ${origIndex + 1}`}
      tabindex={selectable ? 0 : undefined}
      class={`relative rounded-lg border-2 overflow-hidden cursor-pointer select-none transition-all ${
        selected ? 'border-sky-500 shadow-md shadow-sky-200' : 'border-slate-200 hover:border-slate-400'
      }`}
      onclick={e => toggleSelect(origIndex, e)}
      onkeydown={e => (e.key === ' ' || e.key === 'Enter') && toggleSelect(origIndex, e)}
    >
      <canvas
        width={bmp?.width ?? 120}
        height={bmp?.height ?? 160}
        class="w-full block bg-white"
        use:drawBitmap={bmp}
      ></canvas>
      <div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-0.5 leading-tight">
        {origIndex + 1}
      </div>
      {#if selected}
        <div class="absolute top-1 right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {/if}
    </div>
  {/each}
</div>
