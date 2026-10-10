// Fixed-source, resumable import; never alters the reference checkout.
// node scripts/import-reference-assets.cjs core|album|hd|travel-ui|all [reference-repo]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawn } = require('node:child_process');
const REF = '6e2c8bf976d66192382f86065fdeb76528f6716c';
const repo = process.argv[3] || '/Volumes/Data 1/github/qq-pet-other/qqpet';
const group = process.argv[2] || 'core';
if (!['core', 'album', 'hd', 'travel-ui', 'all'].includes(group)) throw Error('Use core, album, hd, travel-ui or all');
const root = path.resolve(__dirname, '../src/assets/reference');
const manifestPath = path.join(root, 'manifest.json');
const git = args => execFileSync('git', ['-C', repo, ...args], { maxBuffer: 30 * 1024 * 1024 });
const files = git(['ls-tree', '-r', '--name-only', REF, 'resources/pet']).toString().trim().split('\n').filter(file => {
  const core = /\/qqfarm\/.*\.(swf|xml)$/.test(file) || /\/smallGame\/.*\.swf$/.test(file) || file === 'resources/pet/qqfont.ttf';
  const album = /\/album\/.*\.webp$/.test(file);
  const hd = /@2x\.png$/.test(file);
  const travelUI = /\/windowTip\/(normal|vip)\/(beijing[1-8]|Q_0[1-9]|btn_close[1-3]|btn_closedefault)\.svg$/.test(file) || /\/windowTip\/(normal|vip)\/bg\.bmp$/.test(file) || file === 'resources/pet/achievement/travel.svg';
  return group === 'all' ? core || album || hd || travelUI : group === 'core' ? core : group === 'album' ? album : group === 'hd' ? hd : travelUI;
});
const entries = files.map(source => {
  const bytes = git(['show', REF + ':' + source]);
  const pointer = /^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)/.exec(bytes.toString());
  return { source, relative: source.slice('resources/pet/'.length), sha256: pointer ? pointer[1] : crypto.createHash('sha256').update(bytes).digest('hex'), size: pointer ? +pointer[2] : bytes.length, bytes: pointer ? null : bytes };
});
fs.mkdirSync(root, { recursive: true });
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : { repository: 'https://github.com/AnkioTomas/qqpet', commit: REF, files: {} };
if (manifest.commit !== REF) throw Error('Manifest commit differs');
let done = 0, next = 0, failed = [];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save = () => { fs.writeFileSync(manifestPath + '.partial', JSON.stringify(manifest, null, 2) + '\n'); fs.renameSync(manifestPath + '.partial', manifestPath); };
const progress = setInterval(() => console.log(`${group}: ${done}/${entries.length} verified, ${failed.length} failures`), 20000);
console.log(`${group}: importing ${entries.length} files (${(entries.reduce((n, e) => n + e.size, 0) / 1024 / 1024).toFixed(1)} MiB), commit ${REF}`);
async function download(url, file) {
  await new Promise((resolve, reject) => {
    const child = spawn('curl', ['--silent', '--show-error', '--fail', '--location', '--max-time', '90', '--retry', '3', '--retry-all-errors', '--output', file, url], { stdio: ['ignore', 'ignore', 'pipe'] });
    let error = ''; child.stderr.on('data', bytes => error += bytes);
    child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(Error(error.trim() || 'curl exit ' + code)));
  });
}
async function worker() {
  while (next < entries.length) {
    const e = entries[next++];
    const file = path.join(root, e.relative);
    try {
      if (!fs.existsSync(file) || fs.statSync(file).size !== e.size || hash(file) !== e.sha256) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const temp = file + '.partial';
        if (e.bytes) fs.writeFileSync(temp, e.bytes);
        else await download('https://media.githubusercontent.com/media/AnkioTomas/qqpet/' + REF + '/' + e.source.split('/').map(encodeURIComponent).join('/'), temp);
        if (fs.statSync(temp).size !== e.size || hash(temp) !== e.sha256) { fs.unlinkSync(temp); throw Error('LFS size/hash mismatch'); }
        fs.renameSync(temp, file);
      }
      manifest.files[e.relative] = { source: e.source, sha256: e.sha256, size: e.size };
      done++; if (done % 20 === 0) save();
    } catch (error) {
      try { fs.unlinkSync(file + '.partial'); } catch (_) {}
      failed.push(e.relative); console.error(e.relative + ': ' + error.message);
    }
  }
}
const concurrency = Math.max(1, Math.min(16, Number(process.env.QQPET_IMPORT_CONCURRENCY) || 8));
Promise.all(Array.from({ length: concurrency }, worker)).then(() => {
  clearInterval(progress); save();
  console.log(`${group}: ${done}/${entries.length} verified; failures: ${JSON.stringify(failed)}`);
  if (failed.length) process.exitCode = 1;
}).catch(error => { clearInterval(progress); console.error(error); process.exitCode = 1; });
