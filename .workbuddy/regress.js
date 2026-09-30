/**
 * 解析引擎回归测试
 *
 * 用法：node .workbuddy/regress.js
 * 说明：index.html 是单文件 PWA，本脚本通过 harness.js 抽出其中的 <script> 在 Node 里跑，
 *       用于验证解析逻辑改动后没有回归。
 *
 * !! 核心语义约定（务必遵守，改代码前先读这里）!!
 *   1. 「规格 + ×N」中的 ×N 是【产品规格】，不是数量。
 *      例：1.8kg×2 = 两个一组（2 个 1.8kg）；2L×6 = 一箱6瓶；300毫升×48 = 一箱48瓶。
 *      → 必须【整体保留在商品名里】，数量计 1。
 *   2. 真正的数量只来自【文字表达】或【商品名之后的纯数字】。
 *      例：「，两份」→ 数量 2 份；「酸种水晶面包×3」→ 数量 3。
 *
 * 改动解析相关代码后请务必运行本脚本，重点看这几条：
 *   - #4 Miss C   : MM300毫升×48矿泉水 → 整体 1 件（×48 是装箱规格）
 *   - #8 余生漫漫 : 1.8kgX2 → 名字保留 1.8kg×2，数量由「两份」决定 = x2份
 *   - 2L×6        : MM 全脂牛奶 2L×6 → 名字保留 2L×6，数量 = x1
 */
const { parseOrderText } = require('./harness.js');

const CASES = [
  ['#4 Miss C (真实原文)', '4. Miss C MM300毫升×48矿泉水  1，酸种水晶面包×3',
    ['Miss C|MM300毫升×48矿泉水|x1', 'Miss C|酸种水晶面包|x3']],
  ['#8 余生漫漫 (真实原文, 规格×2 + 两份)', "8. 余生漫漫 Member's Mark 高钙 &原味风味酸奶 1.8kgX2 ，两份",
    ["余生漫漫|Member's Mark 高钙 &原味风味酸奶 1.8kg×2|x2份"]],
  ['#8 规格×2 无数量文字', "8. 余生漫漫 Member's Mark 高钙 &原味风味酸奶 1.8kgX2",
    ["余生漫漫|Member's Mark 高钙 &原味风味酸奶 1.8kg×2|x1"]],
  ['#8 无空格 + 星号', "8. 小雨 Member'sMark酸奶1.8kg*2",
    ["小雨|Member'sMark酸奶1.8kg×2|x1"]],
  ['2L×6 规格(一箱6瓶)', '9. 小张 MM 全脂牛奶 2L×6',
    ['小张|MM 全脂牛奶 2L×6|x1']],
  ['100g*24*1 装箱', '10. 老王 蒙牛冠益乳发酵乳100g*24*1',
    ['老王|蒙牛冠益乳发酵乳100g×24|x1']],
  ['鸡排组合*1', '11. 阿强 鸡排松饼组合*1',
    ['阿强|鸡排松饼组合|x1']],
  ['菻#20', '20. 菻 Pick Up 巧克力夹心饼干1 餐吧牛肉卷2根 餐吧牛肉汉堡1',
    ['菻|Pick Up 巧克力夹心饼干|x1', '菻|餐吧牛肉卷|x2根', '菻|餐吧牛肉汉堡|x1']],
  ['飞飞 全角句号', '7. 飞飞 MM烤鸡1．妃子笑荔枝2',
    ['飞飞|MM烤鸡|x1', '飞飞|妃子笑荔枝|x2']],
  ['无客户名', '12. MM烤鸡1，鲜切羔羊肉卷1',
    ['|MM烤鸡|x1', '|鲜切羔羊肉卷|x1']],
];

function run(text) {
  const out = [];
  for (const c of parseOrderText(text)) {
    for (const it of c.items) out.push(c.name + '|' + it.name + '|x' + it.qty + (it.unit || ''));
  }
  return out;
}

let pass = 0, fail = 0;
for (const [label, text, expect] of CASES) {
  const got = run(text);
  const ok = JSON.stringify(got) === JSON.stringify(expect);
  if (ok) { pass++; console.log('  PASS  ' + label); }
  else {
    fail++;
    console.log('  FAIL  ' + label);
    console.log('        in    : ' + JSON.stringify(text));
    console.log('        expect: ' + JSON.stringify(expect));
    console.log('        got   : ' + JSON.stringify(got));
  }
}
console.log('\n合计: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
