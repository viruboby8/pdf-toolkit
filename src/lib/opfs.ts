// OPFS helpers — worker-side only (sync access only available in Workers on Chrome)

async function root(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

export async function writeStream(name: string, stream: ReadableStream<Uint8Array>): Promise<void> {
  const dir = await root();
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await stream.pipeTo(w);
}

export async function writeBytes(name: string, bytes: Uint8Array): Promise<void> {
  const dir = await root();
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(bytes);
  await w.close();
}

export async function readFile(name: string): Promise<File> {
  const dir = await root();
  const fh = await dir.getFileHandle(name);
  return fh.getFile();
}

export async function del(name: string): Promise<void> {
  const dir = await root();
  try {
    await dir.removeEntry(name);
  } catch {
    // already gone — ignore
  }
}

export async function delAll(): Promise<void> {
  const dir = await root();
  // @ts-expect-error — async iterator on FileSystemDirectoryHandle
  for await (const [n] of dir.entries()) {
    await dir.removeEntry(n).catch(() => {});
  }
}
