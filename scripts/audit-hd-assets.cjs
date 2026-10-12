// Read-only by default. Regenerate aliases only with --write-aliases.
// node scripts/audit-hd-assets.cjs [reference-repo] [--write-aliases]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { imageSize } = require('../src/windows/util/hdImages');
const assets = path.resolve(__dirname, '../src/assets');
const repo = process.argv.slice(2).find(arg=>!arg.startsWith('--')) || '/Volumes/Data 1/github/qq-pet-other/qqpet';
const ref = require('../src/assets/reference/manifest.json').commit;
const git = (args, options={}) => execFileSync('git',['-C',repo,...args],{maxBuffer:128*1024*1024,...options});
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const tree = new Set(git(['ls-tree','-r','--name-only',ref,'resources/pet']).toString().trim().split('\n'));
const highs = Object.keys(require('../src/assets/reference/manifest.json').files).filter(file=>file.endsWith('@2x.png')).sort();
const sourceFiles = high => ['png','gif','ico','bmp'].map(ext=>'resources/pet/'+high.replace('@2x.png','.'+ext)).filter(file=>tree.has(file));
const sources = [...new Set(highs.flatMap(sourceFiles))];
const batch = git(['cat-file','--batch'],{input:sources.map(file=>ref+':'+file).join('\n')+'\n'});
const originals = new Map();
let offset = 0;
for (const source of sources) {
  const end = batch.indexOf(10,offset);
  const header = batch.subarray(offset,end).toString().split(' ');
  if (end<offset || header[1]!=='blob') throw Error('Missing reference blob: '+source);
  const length = Number(header[2]);
  offset = end+1;
  const bytes = batch.subarray(offset,offset+length);
  if (bytes.length!==length) throw Error('Incomplete reference blob: '+source);
  offset += length+1;
  const pointer = /^version https:\/\/git-lfs.github.com\/spec\/v1\r?\noid sha256:([a-f0-9]{64})\r?\nsize \d+/.exec(bytes.toString());
  originals.set(source,pointer?pointer[1]:hash(bytes));
}
const lowIndex = new Map(), byPath = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file = path.join(dir,entry.name);
    if (entry.isDirectory()) { if(entry.name!=='reference')walk(file);continue; }
    if (!/\.(png|gif|ico|bmp)$/i.test(entry.name)) continue;
    const bytes = fs.readFileSync(file), dimensions = imageSize(bytes);
    if (!dimensions) continue;
    const low = path.relative(assets,file).split(path.sep).join('/');
    const item = {low,dimensions,sha256:hash(bytes)};
    byPath.set(low,item);
    lowIndex.set(item.sha256,[...(lowIndex.get(item.sha256)||[]),item]);
  }
}
walk(assets);
const direct = new Set(), aliases = {}, covered = new Set();
for (const high of highs) {
  const dimensions = imageSize(fs.readFileSync(path.join(assets,'reference',high)));
  if (!dimensions) throw Error('Invalid HD image: '+high);
  const fits = item => item && item.dimensions[0]*2===dimensions[0] && item.dimensions[1]*2===dimensions[1];
  for (const ext of ['png','gif']) {
    const low = high.replace('@2x.png','.'+ext);
    if (fits(byPath.get(low))) direct.add(low);
  }
  for (const source of sourceFiles(high)) {
    for (const item of lowIndex.get(originals.get(source))||[]) {
      if (!fits(item)) continue;
      covered.add(high);
      const previous = aliases[item.low];
      const sameName = path.basename(item.low)===path.basename(source);
      if (!previous || (sameName && path.basename(item.low)!==path.basename(previous.source))) {
        aliases[item.low] = {high:'reference/'+high,sha256:item.sha256,source};
      }
    }
  }
}
const mappings = Object.fromEntries(Object.keys(aliases).filter(low=>!direct.has(low)).sort().map(low=>[low,aliases[low]]));
if (process.argv.includes('--write-aliases')) {
  fs.writeFileSync(path.join(__dirname,'../src/windows/util/hdAliases.json'),JSON.stringify({referenceCommit:ref,mappings},null,2)+'\n');
}
console.log(JSON.stringify({referenceCommit:ref,hdFiles:highs.length,directPairs:direct.size,verifiedAliases:Object.keys(mappings).length,identityMatchedHdFiles:covered.size,unresolved:highs.filter(high=>!covered.has(high))},null,2));
