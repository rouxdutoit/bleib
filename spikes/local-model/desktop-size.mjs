import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { promisify } from 'node:util';
import { candidates } from './candidates.mjs';

const run = promisify(execFile);
const nativeDir = 'node_modules/onnxruntime-node/bin/napi-v6/linux/x64';
const sharedFiles = [
  ...(await readdir(nativeDir)).map(file => `${nativeDir}/${file}`),
  'node_modules/@huggingface/tokenizers/dist/tokenizers.min.mjs',
];
const sharedBytes = (await Promise.all(sharedFiles.map(file => stat(file)))).reduce((sum, file) => sum + file.size, 0);

async function packageSize(root, name, { repository }) {
  const packageDir = `${root}/${name}`;
  const resources = `${packageDir}/opt/bleib/resources/relevance`;
  await Promise.all([
    mkdir(`${packageDir}/DEBIAN`, { recursive: true }),
    mkdir(resources, { recursive: true }),
  ]);
  const assets = JSON.parse(await readFile(`.cache/${name}-assets.json`));
  const modelFiles = Object.keys(assets).map(file => `.cache/models/${repository}/${file}`);
  await Promise.all([
    writeFile(`${packageDir}/DEBIAN/control`,
      'Package: bleib-benchmark-payload\nVersion: 0.1.0\nArchitecture: amd64\nMaintainer: bleib\nDescription: Local model size measurement\n'),
    ...[...sharedFiles, ...modelFiles].map(file => copyFile(file, `${resources}/${basename(file)}`)),
  ]);
  const archive = `${root}/${name}.deb`;
  await run('dpkg-deb', ['-Zxz', '-z6', '--threads-max=1', '--root-owner-group', '--build', packageDir, archive]);
  return [name, { debPayloadBytes: (await stat(archive)).size, sharedBytes }];
}

const root = await mkdtemp(resolve('.cache', 'desktop-'));
try {
  const measurements = await Promise.allSettled(Object.entries(candidates).map(([name, candidate]) =>
    packageSize(root, name, candidate)));
  console.log(JSON.stringify(Object.fromEntries(measurements.map(result => {
    if (result.status === 'rejected') throw result.reason;
    return result.value;
  }))));
} finally {
  await rm(root, { recursive: true, force: true });
}
