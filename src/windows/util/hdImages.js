const fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const { mappings: aliases } = require('./hdAliases.json');
const assets = path.resolve(__dirname, '../../assets');
let pairs;
function imageSize(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
  }
  if (buffer.length >= 10 && /^GIF8[79]a/.test(buffer.toString('ascii', 0, 6))) {
    return [buffer.readUInt16LE(6), buffer.readUInt16LE(8)];
  }
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset++] !== 0xff) return null;
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return length >= 8 ? [buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3)] : null;
    }
    offset += length;
  }
  return null;
}
function hdPairs() {
  if (pairs) return pairs;
  pairs = {};
  function visit(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      if (!entry.name.endsWith('@2x.png')) continue;
      const relative = path.relative(path.join(assets, 'reference'), file).split(path.sep).join('/');
      const stem = relative.replace('@2x.png', '');
      for (const ext of ['png', 'gif']) {
        const original = path.join(assets, stem + '.' + ext);
        if (!fs.existsSync(original)) continue;
        try {
          const low = fs.readFileSync(original), high = fs.readFileSync(file);
          const png = buffer => buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
          // Many original .gif files contain PNG or JPEG bytes. The browser
          // decodes their content; the HD map must use that same image size.
          const size = imageSize(low);
          if (!png(high) || high.length < 24 || !size) continue;
          const [width, height] = size;
          if (width * 2 === high.readUInt32BE(16) && height * 2 === high.readUInt32BE(20)) pairs[stem + '.' + ext] = 'reference/' + relative;
        } catch (_) { /* Missing or invalid HD resources keep the original image. */ }
      }
    }
  }
  visit(path.join(assets, 'reference'));
  // These renamed paths were matched against the reference project's original
  // file bytes. Keep that identity check so a later icon change cannot select
  // an unrelated HD image with a similar filename.
  for (const [lowPath, alias] of Object.entries(aliases)) {
    try {
      const low = fs.readFileSync(path.join(assets, lowPath));
      if (createHash('sha256').update(low).digest('hex') !== alias.sha256) continue;
      const high = fs.readFileSync(path.join(assets, alias.high));
      const lowSize = imageSize(low), highSize = imageSize(high);
      if (lowSize && highSize && lowSize[0] * 2 === highSize[0] && lowSize[1] * 2 === highSize[1]) pairs[lowPath] = alias.high;
    } catch (_) { /* Missing or changed files retain the original image. */ }
  }
  return pairs;
}
function hdCss(css, enabled) {
  if (!enabled) return css;
  const map = hdPairs();
  return css.replace(/url\(\s*(['"]?)(\.\.\/assets\/[^'"()]+)\1\s*\)/g, (original, quote, url) => {
    const target = map[url.slice('../assets/'.length)];
    return target ? `image-set(url("../assets/${target}") 2x)` : original;
  });
}
function installHdImages(map) {
  const base = new URL('../assets/', document.baseURI);
  const urls = new Map(Object.entries(map).map(([low, high]) => [new URL(low, base).href, new URL(high, base).href]));
  function target(value) { try { return urls.get(new URL(value, document.baseURI).href); } catch (_) { return null; } }
  function update(node) {
    if (!(node instanceof Element)) return;
    if (node.tagName === 'IMG') {
      const hd = target(node.getAttribute('src'));
      if (hd && !node.hasAttribute('srcset')) {
        node.setAttribute('srcset', `${hd} 2x`);
        node.addEventListener('error', () => node.removeAttribute('srcset'), { once: true });
        node.dataset.qqpetHd = 'true';
      } else if (!hd && node.dataset.qqpetHd) {
        node.removeAttribute('srcset'); delete node.dataset.qqpetHd;
      } else if (hd && node.dataset.qqpetHd && node.getAttribute('srcset') !== `${hd} 2x`) {
        node.setAttribute('srcset', `${hd} 2x`);
      }
    }
    const style = node.getAttribute('style');
    if (style && !style.includes('image-set(')) {
      const next = style.replace(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/g, (original, quote, url) => {
        const hd = target(url); return hd ? `image-set(url("${hd}") 2x)` : original;
      });
      if (next !== style) node.setAttribute('style', next);
    }
    node.querySelectorAll('img,[style]').forEach(update);
  }
  update(document.documentElement);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') update(record.target);
      else record.addedNodes.forEach(update);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'style'] });
}
function hdScript(enabled) { return enabled ? `(${installHdImages.toString()})(${JSON.stringify(hdPairs())});void 0;` : ''; }
module.exports = { hdPairs, hdCss, hdScript, imageSize };
