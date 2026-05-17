<script lang="ts">
  import { onMount } from 'svelte';

  let visible = $state(false);

  onMount(() => {
    visible = !localStorage.getItem('consent');
  });

  function accept() {
    localStorage.setItem('consent', 'accepted');
    visible = false;
  }

  function reject() {
    localStorage.setItem('consent', 'rejected');
    visible = false;
  }
</script>

{#if visible}
  <div class="fixed bottom-0 inset-x-0 bg-slate-800 text-slate-200 text-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 z-50 shadow-lg">
    <p class="text-center sm:text-left">
      We use cookies for analytics and (future) ads. Your PDFs never leave your device.
      <a href="/privacy" class="underline text-sky-400 hover:text-sky-300">Privacy policy</a>.
    </p>
    <div class="flex gap-2 shrink-0">
      <button
        onclick={reject}
        class="px-3 py-1 rounded border border-slate-500 hover:bg-slate-700 transition-colors"
      >
        Reject
      </button>
      <button
        onclick={accept}
        class="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
      >
        Accept
      </button>
    </div>
  </div>
{/if}
