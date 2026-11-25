import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { modelDir, modelFiles } from './encoder.mjs';

const compact = process.argv[2] === 'static';
const source = await mkdtemp(resolve('.cache/q2', 'desktop-'));
const run = (command, args, options = {}) => execFileSync(command, args, options);
const runtimeAssets = [
  ['onnxruntime-node', ['dist', 'package.json', 'bin/napi-v6/linux/x64']],
  ['onnxruntime-common', ['dist', 'package.json']],
  ['@huggingface/tokenizers', ['dist', 'package.json']],
];
const sumFiles = async folder => {
  let total = 0;
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = `${folder}/${item.name}`;
    total += item.isDirectory() ? await sumFiles(path) : item.isFile() ? (await stat(path)).size : 0;
  }
  return total;
};

try {
  run('tar', ['-x', '-C', source], { input: run('git', ['-C', '../..', 'archive', 'HEAD', 'wallet']) });
  const offline = { stdio: 'inherit', cwd: `${source}/wallet`,
    env: { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' } };
  run('npm', ['ci', '--ignore-scripts'], offline);
  run('npm', ['run', 'build:desktop'], offline);
  const desktop = `${source}/extension/dist/desktop`;
  const base = await stat(`${desktop}/bleib-wallet.deb`);
  const staging = `${desktop}/package`;
  const installedBaseBytes = await sumFiles(staging);
  const resources = `${staging}/opt/bleib/resources`;
  const model = `${resources}/relevance`;
  await mkdir(`${model}/onnx`, { recursive: true });
  if (compact) {
    await Promise.all([
      ...['request-static.bin', 'save-static.bin'].map(file => cp(`.cache/q2/${file}`, `${model}/${file}`)),
      cp('q2/subwords.mjs', `${model}/subwords.mjs`),
    ]);
  } else await Promise.all([
    ...modelFiles.map(file => cp(`${modelDir}/${file}`, `${model}/${file}`)),
    ...['request-int8.onnx', 'save-int8.onnx'].map(file => cp(`.cache/q2/${file}`, `${model}/${file}`)),
    ...runtimeAssets.flatMap(([name, files]) => files.map(file =>
      cp(`node_modules/${name}/${file}`, `${resources}/node_modules/${name}/${file}`, { recursive: true }))),
  ]);
  const archive = `${desktop}/bleib-model-size.deb`;
  run('dpkg-deb', ['--root-owner-group', '--build', staging, archive], { stdio: 'inherit' });
  console.log(JSON.stringify({
    baseBytes: base.size, withModelBytes: (await stat(archive)).size, installedBaseBytes,
    installedWithModelBytes: await sumFiles(staging),
  }));
} finally {
  await rm(source, { recursive: true, force: true });
}
