// 在山姆代购 PWA 之外独立运行 index.html 内的解析引擎，用于回归测试
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || '/Users/meetfun/workbuddy/2026-05-12-task-2/index.html';
const html = fs.readFileSync(HTML, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('未找到 <script> 块'); process.exit(1); }
let code = m[1];

// ---- 极简 DOM / 浏览器环境桩 ----
const noop = () => {};
const deepProxy = () => new Proxy(function () {}, {
  get: (t, p) => {
    if (p === Symbol.toPrimitive || p === 'toString') return () => '';
    if (p === 'length') return 0;
    return deepProxy();
  },
  set: () => true,
  apply: () => deepProxy(),
});
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop };
global.document = deepProxy();
global.window = global;
global.navigator = { userAgent: 'node' };
global.alert = noop;
global.confirm = () => false;
global.prompt = () => null;
global.requestAnimationFrame = noop;
global.setTimeout = setTimeout;
global.URL = URL;
global.Blob = class {};

code += `
module.exports = {
  parseOrderText, splitGoodsSmart, parseQty, extractNameAndGoodsV2, isBrandOrGoodsStart,
  toHalfWidth, getDefaultBrandWords: () => DEFAULT_BRAND_WORDS,
};
`;

const mod = { exports: {} };
try {
  new Function('module', 'exports', code)(mod, mod.exports);
} catch (e) {
  console.error('加载失败:', e.message);
  process.exit(1);
}

module.exports = mod.exports;
