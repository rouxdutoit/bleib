import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { chromium, firefox } from 'playwright';

const place = 'http://127.0.0.1/probe';
const chromiumModes = {
  stock: [],
  unsafe: ['--enable-unsafe-webgpu'],
  vulkan: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,VulkanFromANGLE,DefaultANGLEVulkan',
    '--use-angle=vulkan', '--disable-vulkan-surface', '--disable-software-rasterizer'],
  'software-control': ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};

async function probe(engine, options) {
  const browser = await engine.launch({ headless: true, ...options });
  try {
    const page = await browser.newPage();
    await page.route(place, route => route.fulfill({ body: '<!doctype html>', contentType: 'text/html' }));
    await page.goto(place);
    await page.context().setOffline(true);
    const info = await page.evaluate(async () => {
      let webgpu;
      try {
        const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter) {
          const { vendor, architecture, device, description, isFallbackAdapter } = adapter.info;
          const features = Array.from(adapter.features);
          const gpu = await adapter.requestDevice();
          await gpu.queue.onSubmittedWorkDone();
          gpu.destroy();
          webgpu = { vendor, architecture, device, description, isFallbackAdapter, features };
        } else webgpu = navigator.gpu ? 'No adapter' : 'No WebGPU API';
      } catch (error) {
        webgpu = String(error);
      }
      const nano = {};
      for (const lang of ['en', 'de']) {
        nano[lang] = await globalThis.LanguageModel?.availability({
          expectedInputs: [{ type: 'text', languages: [lang] }],
          expectedOutputs: [{ type: 'text', languages: [lang] }],
        }).catch(error => String(error)) ?? 'No Prompt API';
      }
      return { webgpu, nano };
    });
    const cdp = engine === chromium ? await browser.newBrowserCDPSession() : null;
    const gpu = cdp ? (await cdp.send('SystemInfo.getInfo')).gpu.devices : undefined;
    return { version: browser.version(), ...info, gpu };
  } finally {
    await browser.close();
  }
}

const results = {
  host: { platform: platform(), release: release(), cpu: cpus()[0]?.model, ramBytes: totalmem() },
};
if (platform() === 'linux') {
  const nodes = await readdir('/dev');
  const pci = await readdir('/proc/driver/nvidia/gpus').catch(() => []);
  results.host.deviceNodes = nodes.filter(name => /^(?:dri|nvidia|dxg)/.test(name));
  results.host.nvidiaPci = await Promise.all(pci.map(async bus => ({
    bus, model: (await readFile(`/proc/driver/nvidia/gpus/${bus}/information`, 'utf8'))
      .match(/^Model:\s*(.+)$/m)?.[1],
  })));
  try {
    results.host.vulkanDevices = execFileSync('vulkaninfo', ['--summary'], {
      encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'],
    }).split('Devices:').at(-1).split('\n').filter(line => /deviceName|deviceType/.test(line)).map(x => x.trim());
  } catch (error) {
    results.host.vulkanDevices = String(error.message).split('\n')[0];
  }
}
for (const [name, args] of Object.entries(chromiumModes)) {
  results[`chromium-${name}`] = await probe(chromium, { channel: 'chromium', executablePath: process.env.BLEIB_CHROMIUM, args }).catch(String);
}
for (const enabled of [false, true]) {
  results[enabled ? 'firefox-webgpu-pref' : 'firefox-stock'] = await probe(firefox,
    { executablePath: process.env.BLEIB_FIREFOX, firefoxUserPrefs: enabled ? { 'dom.webgpu.enabled': true } : {} }).catch(String);
}
try {
  results.nvidia = execFileSync('nvidia-smi', ['-L'], { encoding: 'utf8' }).trim();
} catch (error) {
  results.nvidia = { exit: error.status, message: error.stdout?.trim() || error.stderr?.trim() };
}
await mkdir('.cache', { recursive: true });
await writeFile('.cache/probe.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
