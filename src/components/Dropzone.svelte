<script lang="ts">
  interface Props {
    accept?: string;
    multiple?: boolean;
    onfiles: (files: File[]) => void;
  }

  let { accept = 'application/pdf', multiple = false, onfiles }: Props = $props();

  let dragging = $state(false);
  let inputEl: HTMLInputElement;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onfiles(Array.from(fileList));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }

  function onDragLeave() {
    dragging = false;
  }

  function onInputChange(e: Event) {
    handleFiles((e.target as HTMLInputElement).files);
  }

  function onClick() {
    inputEl.click();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputEl.click();
    }
  }
</script>

<div
  role="button"
  tabindex="0"
  aria-label={`Drop ${multiple ? 'files' : 'a file'} here or click to browse`}
  class={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
    dragging
      ? 'border-sky-500 bg-sky-50 text-sky-700'
      : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50 text-slate-500'
  }`}
  ondrop={onDrop}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  onclick={onClick}
  onkeydown={onKeydown}
>
  <svg class="mx-auto mb-3 w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
  <p class="font-medium">Drop {multiple ? 'PDF files' : 'a PDF'} here</p>
  <p class="text-sm mt-1 opacity-75">or click to browse</p>
</div>

<input
  bind:this={inputEl}
  type="file"
  {accept}
  {multiple}
  class="hidden"
  onchange={onInputChange}
/>
