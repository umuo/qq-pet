const fs = require('node:fs'), path = require('node:path');
const assets = path.resolve(__dirname, '../../assets');
let pairs;
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
          if (!png(high) || (ext === 'png' ? !png(low) : !/^GIF8[79]a/.test(low.toString('ascii', 0, 6)))) continue;
          const [width, height] = ext === 'png' ? [low.readUInt32BE(16), low.readUInt32BE(20)] : [low.readUInt16LE(6), low.readUInt16LE(8)];
          if (width * 2 === high.readUInt32BE(16) && height * 2 === high.readUInt32BE(20)) pairs[stem + '.' + ext] = 'reference/' + relative;
        } catch (_) { /* Missing or invalid HD resources keep the original image. */ }
      }
    }
  }
  visit(path.join(assets, 'reference'));
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
module.exports = { hdPairs, hdCss, hdScript };
