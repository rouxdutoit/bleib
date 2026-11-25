import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { statfs } from 'node:fs/promises';
import { availableParallelism, totalmem } from 'node:os';

const exec = promisify(execFile);
const mib = 1024 ** 2;

async function nvidia(fields, index) {
  const options = index === undefined ? [] : ['-i', String(index)];
  const { stdout } = await exec('nvidia-smi', [
    ...options, '--query-gpu=' + fields, '--format=csv,noheader,nounits',
  ], { timeout: 3000 });
  return stdout.trim().split('\n').filter(Boolean).map(line => line.split(',').map(value => value.trim()));
}

export async function environment() {
  const disk = await statfs('.');
  let gpus = [], nvidiaError;
  try {
    gpus = (await nvidia('index,name,memory.total,driver_version')).map(([index, name, memory, driver]) =>
      ({ index, name, memoryMiB: Number(memory), driver }));
  } catch (error) {
    nvidiaError = error.stdout?.trim() || error.stderr?.trim() || error.message;
  }
  const gpu = process.env.BLEIB_X_GPU_INDEX === undefined ? gpus.find(item => item.name.includes('RTX 3070')) ?? gpus[0]
    : gpus.find(item => item.index === process.env.BLEIB_X_GPU_INDEX);
  return {
    freeBytes: disk.bsize * disk.bavail, ramBytes: totalmem(), cores: availableParallelism(),
    gpus, gpu, nvidiaError,
  };
}

async function rss(profile) {
  const { stdout } = await exec('ps', ['-eo', 'pid=,ppid=,rss=,args='], { timeout: 3000 });
  const processes = stdout.split('\n').map(line => line.trim().split(/\s+/u));
  const roots = processes.filter(([, , , exe, ...args]) =>
    exe?.endsWith('/chrome') && args.includes('--user-data-dir=' + profile) &&
    !args.some(arg => arg.startsWith('--type=')));
  if (!roots.length) return null;
  const tree = new Set(roots.map(([pid]) => pid));
  for (let size = 0; size < tree.size;) {
    size = tree.size;
    for (const [pid, ppid] of processes) if (tree.has(ppid)) tree.add(pid);
  }
  return processes.reduce((sum, [pid, , memory]) => sum + (tree.has(pid) ? Number(memory) * 1024 : 0), 0);
}

async function reading(profile, gpu) {
  const [ram, vram] = await Promise.all([
    rss(profile).catch(() => null),
    gpu ? nvidia('memory.used', gpu.index).then(([[memory]]) => Number(memory) * mib).catch(() => null) : null,
  ]);
  return { ram, vram: Number.isFinite(vram) ? vram : null };
}

export async function monitor(profile, gpu, baseline) {
  baseline ??= await reading(profile, gpu);
  const peaks = { ram: null, vram: null };
  let samples = 0;
  const capture = async () => {
    const value = await reading(profile, gpu);
    samples++;
    for (const key of Object.keys(peaks)) {
      if (value[key] !== null) peaks[key] = Math.max(peaks[key] ?? 0, value[key]);
    }
  };
  let pending;
  const ticker = setInterval(() => {
    pending ??= capture().finally(() => { pending = undefined; });
  }, 500);
  await capture();
  return async () => {
    clearInterval(ticker);
    await pending;
    await capture();
    return { baseline, peaks, samples };
  };
}
