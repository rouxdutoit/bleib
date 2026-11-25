import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { buildPages, launch, loadExtension, localOnly, logPage, loopback } from './browser.mjs';
import { chromeSystem, diagnostics } from './diagnostics.mjs';
import { environment, monitor } from './resources.mjs';
import { models, prepareMiniLM, prepareWebModel } from './assets.mjs';
import { accelerated } from './webllm.mjs';
import { languages } from './nano.mjs';
import { directWorkload, workload } from './workload.mjs';

const log = message => console.log('[run-x] ' + message);
const message = error => String(error?.message ?? error).slice(0, 8000);
const readyStates = new Set(['available', 'downloadable', 'downloading']);
const maxRunMs = 45 * 60_000;
const waitMinutes = Number(process.env.BLEIB_X_NANO_WAIT_MIN ?? 20);
const option = process.argv[2];
if (process.argv.length > 3 || ![undefined, '--probe', '--nano-only'].includes(option) ||
    !Number.isFinite(waitMinutes) || waitMinutes <= 0 || waitMinutes > 60) {
  throw new Error('Usage: run.sh [--probe|--nano-only], with BLEIB_X_NANO_WAIT_MIN in (0, 60].');
}

const runId = new Date().toISOString();

async function write(name, result) {
  const path = resolve('results', name + '.json');
  await writeFile(path + '.tmp', JSON.stringify({ runId, ...result }, null, 2) + '\n');
  await rename(path + '.tmp', path);
  log('wrote results/' + name + '.json');
}

async function timed(task, ms, label) {
  let timer;
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded ${Math.ceil(ms / 1000)} seconds.`)), ms);
    });
    return await Promise.race([task, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function withChrome(profileName, options, result, task) {
  const profile = resolve('.cache', profileName);
  const { context, flags, launchMs, chrome } = await launch(profile, options);
  Object.assign(result, { launchMs, chrome, flags });
  try {
    result.system = await chromeSystem(context);
    await task(context, profile);
  } finally {
    await context.close();
  }
}

async function checkGPU(loop, env) {
  const result = { ...env, status: 'error' };
  try {
    await withChrome('gpu-probe-profile', {}, result, async context => {
      await localOnly(context, loop.origin);
      const page = context.pages()[0];
      await page.goto(loop.origin + '/probe.html');
      await page.waitForFunction(() => !!globalThis.adapterX, undefined, { timeout: 5000 });
      result.adapter = await timed(page.evaluate(() => globalThis.adapterX()), 20_000, 'WebGPU probe');
      result.status = accelerated(result.adapter) ? 'hardware' : 'unavailable';
      if (result.status === 'hardware' && env.gpu && result.adapter.vendor &&
          !/nvidia|10de/iu.test(result.adapter.vendor)) {
        result.status = 'unavailable';
        result.error = 'Chrome selected a different adapter from the NVIDIA device being measured.';
      }
    });
  } catch (error) {
    result.error = message(error);
  }
  log(`WebGPU · ${result.status} · ${JSON.stringify(result.adapter ?? null)}`);
  return result;
}

async function checkAvailability(page, probe) {
  const check = () => timed(page.evaluate(() => nanoX.availability()), 8000, 'Nano availability');
  const initial = await check();
  let current = initial;
  if (!probe) {
    for (let i = 0; i < 7 && Object.values(current).some(value => value === 'unavailable'); i++) {
      await delay(5000);
      current = await check();
    }
  }
  return { initial, current };
}

async function openNano(page, lang, timeoutMs) {
  log(`Nano ${lang.toUpperCase()} · creating session, up to ${Math.ceil(timeoutMs / 60_000)} min`);
  await page.evaluate(([language, ms]) => nanoX.prepare(language, ms), [lang, timeoutMs]);
  await page.locator('#' + lang).click({ timeout: 5000 });
  const start = performance.now();
  const pulse = setInterval(() => log(`Nano ${lang.toUpperCase()} · waiting ${Math.floor((performance.now() - start) / 1000)}s`), 30_000);
  try {
    return await timed(page.evaluate(() => nanoX.ready()), timeoutMs + 5000, 'Nano session creation');
  } finally {
    clearInterval(pulse);
  }
}

async function runNano(env, probe) {
  const result = { status: 'error', output: [], languages: {} };
  try {
    await withChrome(probe ? 'nano-probe-profile' : 'nano-profile', { nano: true }, result, async (context, profile) => {
      result.blockedRequests = await localOnly(context, 'chrome-extension://none');
      const url = await loadExtension(context);
      const page = context.pages()[0];
      logPage(page, 'Nano');
      await page.exposeBinding('recordX', (_source, _mode, row) => { result.output.push(row); });
      await page.goto(url);
      await page.waitForFunction(() => !!globalThis.nanoX, undefined, { timeout: 5000 });
      result.extension = await page.evaluate(() => ({ origin: location.origin, id: chrome.runtime.id }));
      result.availability = await checkAvailability(page, probe);
      log(`Nano availability · ${JSON.stringify(result.availability.current)}`);
      if (!probe) await scoreNano(page, profile, env, result);
      result.diagnostics = await diagnostics(context);
      result.status = probe ? 'probe' : result.output.length === workload.rows.length ?
        'complete' : result.output.length ? 'partial' : 'unavailable';
    });
  } catch (error) {
    result.error = message(error);
  }
  return result;
}

async function scoreNano(page, profile, env, result) {
  const stop = await monitor(profile, env.gpu);
  let remainingDownloadMs = waitMinutes * 60_000;
  try {
    for (const lang of languages) {
      const phase = result.languages[lang] = {};
      const partition = { ...directWorkload, rows: directWorkload.rows.filter(row => row.lang === lang) };
      try {
        phase.before = (await checkAvailability(page, true)).current[lang];
        if (!readyStates.has(phase.before)) continue;
        const timeout = phase.before === 'available' ? 60_000 : remainingDownloadMs;
        if (timeout <= 0) throw new Error('The shared Nano download budget elapsed.');
        const start = performance.now();
        try {
          Object.assign(phase, await openNano(page, lang, timeout));
        } finally {
          if (phase.before !== 'available') remainingDownloadMs -= performance.now() - start;
        }
        phase.after = (await checkAvailability(page, true)).current[lang];
        Object.assign(phase, await timed(page.evaluate(([language, data]) => nanoX.benchmark(language, data),
          [lang, partition]), maxRunMs, 'Nano scoring'));
      } catch (error) {
        phase.error = message(error);
        phase.events = await page.evaluate(() => globalThis.nanoEvents).catch(() => []);
        log(`Nano ${lang.toUpperCase()} · ${phase.error}`);
      } finally {
        phase.finalAvailability = await timed(page.evaluate(async lang => (await nanoX.availability())[lang], lang),
          5000, 'Nano final availability').catch(() => undefined);
        await timed(page.evaluate(() => nanoX.close()), 5000, 'Nano close').catch(() => {});
      }
    }
  } finally {
    result.resources = await stop();
  }
}

async function runWeb(loop, env, model, miniLM) {
  const result = { status: 'error', model, miniLM, direct: { output: [] }, cascade: { output: [] } };
  let profile;
  try {
    result.assets = await prepareWebModel(model);
    profile = await mkdtemp(resolve('.cache', model.key + '-profile-'));
    await withChrome(profile, {}, result, async (context, profilePath) => {
      result.blockedRequests = await localOnly(context, loop.origin);
      const page = context.pages()[0];
      logPage(page, model.key);
      await page.exposeBinding('recordX', (_source, mode, row) => { result[mode].output.push(row); });
      await page.goto(loop.origin + '/web.html');
      await page.waitForFunction(() => !!globalThis.webX, undefined, { timeout: 12_000 });
      await scoreWeb(page, profilePath, env, result, model, miniLM);
    });
    result.status = result.direct.status === 'complete' && result.cascade.status === 'complete' ? 'complete' : 'partial';
  } catch (error) {
    result.error = message(error);
    log(`${model.key} · ${result.error}`);
  } finally {
    if (profile) await rm(profile, { recursive: true, force: true }).catch(error => log(message(error)));
  }
  return result;
}

async function scoreWeb(page, profile, env, result, model, miniLM) {
  const stopDirect = await monitor(profile, env.gpu);
  try {
    result.direct.coldMs = await timed(page.evaluate(spec => webX.load(spec), model), 360_000, 'WebLLM load');
    await webPhase(page, 'direct', directWorkload, result.direct);
  } finally {
    result.direct.resources = await stopDirect();
  }
  if (miniLM.error) {
    result.cascade.error = miniLM.error;
    return;
  }
  const stopCascade = await monitor(profile, env.gpu, result.direct.resources.baseline);
  try {
    await webPhase(page, 'cascade', workload, result.cascade);
  } finally {
    result.cascade.resources = await stopCascade();
    await timed(page.evaluate(() => webX.close()), 10_000, 'WebLLM unload').catch(() => {});
  }
}

async function webPhase(page, mode, data, phase) {
  try {
    Object.assign(phase, await timed(page.evaluate(([name, inputs]) => webX.benchmark(name, inputs),
      [mode, data]), maxRunMs, mode));
    phase.status = phase.output.length === data.rows.length ? 'complete' : 'partial';
  } catch (error) {
    phase.error = message(error);
    log(`${mode} · ${phase.error}`);
    if (phase.error.includes(' exceeded ')) await page.close();
  }
}

await Promise.all([mkdir('results', { recursive: true }), buildPages()]);
const loop = await loopback();
try {
  const env = await environment();
  const gpu = await checkGPU(loop, env);
  await write(option === '--probe' ? 'sandbox-gpu-probe' : option === '--nano-only' ? 'nano-only-gpu' : 'gpu', gpu);
  const nano = await runNano(env, option === '--probe');
  await write(option === '--probe' ? 'sandbox-nano-probe' : option === '--nano-only' ? 'nano-only' : 'nano', nano);
  if (!option) {
    if (gpu.status !== 'hardware') {
      process.exitCode = 1;
      log('WebLLM skipped because Chrome did not see accelerated WebGPU with shader-f16.');
      for (const model of models) await write(model.key, { status: 'skipped', model, error: gpu.error ?? 'No hardware WebGPU with shader-f16.' });
    } else {
      const miniLM = await prepareMiniLM().catch(error => ({ error: message(error) }));
      for (const model of models) {
        const run = await runWeb(loop, env, model, miniLM);
        await write(model.key, run);
        if (run.status !== 'complete') process.exitCode = 1;
      }
    }
  }
  if (nano.status === 'error') process.exitCode = 1;
} finally {
  loop.close();
}
