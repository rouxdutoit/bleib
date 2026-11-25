import assert from 'node:assert/strict';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { byLanguage, latency, metrics } from '../evaluate.mjs';
import { vaults } from '../v/corpus.mjs';
import { cases } from './workload.mjs';

const caseById = new Map(cases.map(row => [row.id, row]));
const partitions = ['test', 'second', 'hero'];
const methods = ['Gemini Nano', 'Qwen3.5 2B', 'MiniLM + Qwen3.5 2B', 'Qwen3.5 4B', 'MiniLM + Qwen3.5 4B'];
const facts = { H01: 'seat', H02: 'diet', H03: 'role', H04: 'home city', H05: 'serves two' };
const percent = score => (score * 100).toFixed(1);
const none = '—';
const mb = bytes => Number.isFinite(bytes) ? (bytes / 1024 ** 2).toFixed(1) : none;
const ms = value => Number.isFinite(value) ? value.toFixed(1) : none;
const clean = value => String(value ?? none).replace(/[\r\n]+/gu, ' ').replaceAll('|', '/').replaceAll('`', "'").trim();

function summarizeSplit(split, results) {
  const expected = cases.filter(row => row.split === split);
  const matched = results.filter(row => row.split === split);
  const language = byLanguage(matched);
  for (const lang of ['en', 'de']) {
    if (expected.filter(row => row.lang === lang).length !== language[lang].drafts) delete language[lang];
  }
  const blanks = matched.filter(row => !row.text.trim());
  return {
    measured: matched.length, expected: expected.length, language,
    total: matched.length === expected.length ? metrics(matched) : null,
    blanks: { measured: blanks.length, offers: blanks.filter(row => row.selected.length).length },
    routed: matched.filter(row => row.routed).length,
    invalid: matched.filter(row => row.invalid).length,
    wrongProtected: matched.reduce((sum, row) => sum + row.selected.filter(id =>
      !row.relevant.includes(id) && vaults[row.vault].some(entry => entry.id === id && entry.policy === 'ask')).length, 0),
  };
}

export function summarizePhase(phase = {}) {
  const seen = new Set();
  const results = (phase.output ?? []).map(row => {
    const label = caseById.get(row.id);
    assert(label && !seen.has(row.id), `Unexpected or duplicate draft ${row.id}.`);
    seen.add(row.id);
    assert(Number.isFinite(row.ms) && row.ms >= 0);
    assert(row.selected.length <= 2 && new Set(row.selected).size === row.selected.length);
    assert(row.selected.every(id => vaults[label.vault].some(entry => entry.id === id)));
    return { ...label, ...row };
  });
  const inferred = results.filter(row => row.inferred);
  const routed = results.filter(row => row.routed);
  return {
    status: phase.status ?? 'pending', coverage: results.length, indexMs: phase.indexMs, coldMs: phase.coldMs,
    control: phase.control, resources: phase.resources, error: phase.error,
    firstDraftMs: inferred[0]?.ms, warm: results.length ? latency(results) : null,
    inference: inferred.length ? latency(inferred) : null,
    fallback: routed.length ? latency(routed.map(row => ({ ms: row.reasonerMs }))) : null,
    splits: Object.fromEntries(partitions.map(split => [split, summarizeSplit(split, results)])),
    demos: results.filter(row => row.split === 'hero').map(({ id, relevant, selected }) =>
      ({ id, selected, exact: relevant.length === selected.length && relevant.every(entry => selected.includes(entry)) })),
  };
}

function table(columns, rows) {
  return ['| ' + columns.join(' | ') + ' |', '| ' + columns.map(() => '---').join(' | ') + ' |',
    ...rows.map(row => '| ' + row.join(' | ') + ' |')].join('\n');
}

function ratios(result) {
  if (!result) return none;
  const precision = result.tp + result.fp ? percent(result.precision) : 'n/a';
  return [precision, percent(result.recall), percent(result.f1)].join(' / ');
}

function offers(split) {
  if (!split.total) return none;
  return split.total.picksOnNegative + '/' + split.total.negatives;
}

function qualityTable(summary) {
  return table(['Picker', 'Drafts', 'Original EN', 'Original DE', 'Second EN', 'Second DE',
    'Empty labels original / second', 'Literal blanks offered', 'Wrong ask-only picks', 'Invalid'],
  Object.entries(summary).map(([name, run]) => {
    const { test, second, hero } = run.splits;
    const totals = [test, second, hero];
    return [name, run.coverage + '/' + cases.length,
      ...[test, second].flatMap(split => ['en', 'de'].map(lang => ratios(split.language[lang]))),
      [offers(test), offers(second)].join(' · '),
      run.coverage ? totals.reduce((n, split) => n + split.blanks.offers, 0) + '/' +
        totals.reduce((n, split) => n + split.blanks.measured, 0) : none,
      run.coverage ? totals.reduce((n, split) => n + split.wrongProtected, 0) : none,
      run.coverage ? totals.reduce((n, split) => n + split.invalid, 0) : none];
  }));
}

function demosTable(summary) {
  const show = row => row ? row.selected.map(id => facts[id] ?? id).join(' + ') || 'none' : none;
  return table(['Picker', 'Lisbon EN / DE', 'Cover letter EN / DE', 'Dinner EN / DE', 'Exact'],
    Object.entries(summary).map(([name, run]) => [name, ...['LIS', 'COVER', 'DINNER'].map(demo =>
      ['en', 'de'].map(lang => show(run.demos.find(row => row.id === `H-${demo}-${lang}`))).join(' / ')),
    run.demos.length ? run.demos.filter(row => row.exact).length + '/' + run.demos.length : none]));
}

function resourceCell(resources, key) {
  const peak = resources?.peaks?.[key], start = resources?.baseline?.[key];
  return mb(peak) + ' / ' + mb(Number.isFinite(peak) && Number.isFinite(start) ? peak - start : null);
}
const pair = timings => ms(timings?.p50Ms) + ' / ' + ms(timings?.p95Ms);

function costTable(summary, provision) {
  return table(['Picker', 'Assets MiB', 'Provision / first load / index ms', 'First inference ms', 'Warm p50 / p95 ms',
    'Routed original / second / demos', 'Fallback p50 / p95 ms', 'RAM peak / increase MiB', 'VRAM peak / increase MiB'],
  Object.entries(summary).map(([name, run], i) => {
    const assets = provision[i];
    return [name, mb(assets?.bytes), [ms(assets?.provisionMs), ms(run.coldMs), ms(run.indexMs)].join(' / '),
      ms(run.firstDraftMs), pair(run.warm),
      run.coverage ? partitions.map(split => run.splits[split].routed).join(' / ') : none,
      pair(run.fallback), resourceCell(run.resources, 'ram'), resourceCell(run.resources, 'vram')];
  }));
}

function decision(summary, gpu) {
  const finished = Object.entries(summary).filter(([, run]) => run.coverage === cases.length);
  const targeted = finished.filter(([name]) => name === 'Gemini Nano' || gpu?.status === 'hardware');
  const qualified = targeted.filter(([, run]) => run.control !== false &&
    !Object.values(run.control ?? {}).includes(false) && ['test', 'second'].every(split =>
      Object.values(run.splits[split].language).every(score => score.precision >= 0.9 && score.recall >= 0.4)));
  if (qualified.length) {
    const ordered = qualified.sort(([, a], [, b]) => a.warm.p95Ms - b.warm.p95Ms);
    return `Advance **${ordered[0][0]}** to an opt-in manual suggestion pilot. It met the 90% precision and 40% recall thresholds in both languages on both holdouts. Keep automatic relevance-based offers off pending independent bilingual validation and Phase 4 disclosure checks.`;
  }
  if (!targeted.length) {
    return 'Keep Run V’s explicit picker and person-chosen profile. Wait for a complete host benchmark before choosing a model for a manual suggestion pilot.';
  }
  return 'Keep Run V’s explicit picker and person-chosen profile. The completed Run X pickers missed the joint gate of 90% precision and 40% recall in both languages on both holdouts.';
}

function brokerFindings(internals) {
  const text = internals?.['Broker State'] ?? '';
  const evidence = text.split('\n').filter(line =>
    line.includes('row "') && /prompt_api|nano_v3|gemma4|Enabled by|Enough (?:disk|VRAM)|Device Capable/iu.test(line))
    .slice(0, 20);
  return evidence.map(clean).join(' · ');
}

function state(gpu, nano, web) {
  const lines = [];
  if (gpu) {
    const a = gpu.adapter;
    lines.push(`- **WebGPU** ${clean(gpu.status)} on ${clean(gpu.system?.version)}. Adapter ${a ?
      `${clean(a.vendor)} ${clean(a.architecture)} ${clean(a.description)}, shader-f16 ${a.shaderF16}` : 'absent'}. ${gpu.nvidiaError ?
      `nvidia-smi reported ${clean(gpu.nvidiaError)}` : `nvidia-smi GPU ${clean(gpu.gpu?.name)}`}.`);
  }
  if (gpu?.error) lines.push(`- **WebGPU detail** ${clean(gpu.error)}`);
  if (nano) {
    const a = nano.availability;
    const languages = ['en', 'de'].map(lang => {
      const run = nano.languages?.[lang];
      const statuses = [a?.initial[lang], a?.current[lang], run?.before, run?.after, run?.finalAvailability].filter(Boolean);
      return `${lang.toUpperCase()} ${[...new Set(statuses)].map(clean).join(' → ') || none}` +
        (run?.error ? ` (${clean(run.error)})` : '');
    });
    lines.push(`- **Gemini Nano** ${clean(nano.status)}. ${languages.join('. ')}.`);
    const d = nano.diagnostics;
    if (d) {
      const tools = d.internals?.tools?.split('\n').findIndex(line => /performance class/iu.test(line));
      const brokerClass = d.internals?.['Broker State']?.match(/row "Performance Class ([^"]+)"/u)?.[1];
      const performance = brokerClass ?? (tools >= 0 ?
        clean(d.internals.tools.split('\n')[tools + 1]?.replace(/.*strong: /u, '')) : none);
      lines.push(`- **Chrome diagnostics** Performance class ${performance}. AI and component policies ${d.policy?.noPoliciesSet ?
        'unset' : clean(d.policy?.relevant?.join(' · ') || d.policy?.error || 'none captured')}. ${brokerFindings(d.internals) || 'See the Nano JSON for the broker state, events and component snapshot.'}`);
      const componentErrors = Array.isArray(d.components) ? d.components.filter(line => /error/iu.test(line)) : [];
      if (componentErrors.length) lines.push(`- **Chrome component errors** ${componentErrors.map(clean).join(' · ')}`);
    }
    if (nano.error) lines.push(`- **Chrome error** ${clean(nano.error)}`);
  }
  for (const run of web.filter(Boolean)) {
    for (const phase of [run, run.direct, run.cascade].filter(item => item?.error)) {
      lines.push(`- **${run.model.key}** ${clean(phase.error)}`);
    }
  }
  return lines.join('\n') || 'Host run pending. The runner records Chrome’s adapter, component policy and broker state.';
}

async function read(name) {
  try {
    return JSON.parse(await readFile('results/' + name + '.json', 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const [gpu, ...artifacts] = await Promise.all(['gpu', 'nano', 'qwen35-2b', 'qwen35-4b'].map(read));
  const [nano, two, four] = artifacts.map(run => run?.runId === gpu?.runId ? run : null);
  const phases = [];
  const provision = [];
  const nanoPhases = Object.values(nano?.languages ?? {});
  const nanoSum = key => nanoPhases.some(phase => Number.isFinite(phase[key])) ?
    nanoPhases.reduce((sum, phase) => sum + (phase[key] ?? 0), 0) : undefined;
  phases.push(nano ? { ...nano, coldMs: nanoSum('createMs'), indexMs: nanoSum('indexMs'),
    control: Object.fromEntries(nanoPhases.map((phase, i) => [['en', 'de'][i], phase.control])) } : {});
  provision.push(undefined);
  for (const model of [two, four]) {
    phases.push(model?.direct ?? { status: model?.status, error: model?.error });
    phases.push(model?.cascade ? { ...model.cascade, coldMs: Number.isFinite(model.cascade.miniLMColdMs) ?
      model.direct.coldMs + model.cascade.miniLMColdMs : undefined } : { status: model?.status });
    provision.push(model?.assets, model?.assets ? { bytes: model.assets.bytes +
      Object.values(model.miniLM?.files ?? {}).reduce((sum, file) => sum + file.bytes, 0) } : undefined);
  }
  const summary = Object.fromEntries(phases.map((phase, i) => [methods[i], summarizePhase(phase)]));
  const blocks = { availability: state(gpu, nano, [two, four]), quality: qualityTable(summary),
    demos: demosTable(summary), cost: costTable(summary, provision), decision: decision(summary, gpu) };
  const report = '../../../docs/research/local-model-x.md';
  let doc = await readFile(report, 'utf8');
  for (const [section, text] of Object.entries(blocks)) {
    const begin = `<!-- run-x:${section}:start -->`;
    const end = `<!-- run-x:${section}:end -->`;
    const a = doc.indexOf(begin), b = doc.indexOf(end);
    assert(a !== -1 && b > a, `Missing Run X report markers for ${section}.`);
    doc = doc.slice(0, a + begin.length) + '\n\n' + text + '\n\n' + doc.slice(b);
  }
  const temp = 'results/summary.tmp';
  await writeFile(temp, JSON.stringify({ summary, recommendation: blocks.decision }, null, 2) + '\n');
  await rename(temp, 'results/summary.json');
  await writeFile(report, doc);
  console.log('[run-x] updated results/summary.json and docs/research/local-model-x.md');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
