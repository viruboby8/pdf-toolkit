<script lang="ts">
  interface Props {
    current: number;
    total: number;
    label?: string;
  }
  let { current, total, label = '' }: Props = $props();
  const pct = $derived(total > 0 ? Math.round((current / total) * 100) : 0);
</script>

{#if total > 0}
  <div class="space-y-1.5">
    {#if label}
      <div class="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{current} / {total}</span>
      </div>
    {/if}
    <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        class="h-full bg-sky-500 rounded-full transition-all duration-200"
        style={`width: ${pct}%`}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      ></div>
    </div>
  </div>
{/if}
