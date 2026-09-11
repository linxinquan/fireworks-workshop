/* 从 原料图鉴-v3.html 抽出 16 个图标，做「尺寸归一化」，产出可直接塞进游戏的 symbol 块。
 *
 * 为什么归一化：
 *   实测主体包围盒（见 driver-v3-iconset.js 的输出）差异很大 ——
 *     v1 试管  16×50  → 最窄(25%)，最长边 50
 *     硫磺     32×34  → 最长边 34（最小）
 *     月光花瓣 33×53  → 最长边 53（最大）
 *   最长边 34~53 相差 1.56 倍，直接混排会明显不齐。
 *   做法：给每个 symbol 的整块内容套一个「绕 (32,32) 等比缩放」的 <g>，
 *   把最长边统一缩放到 TARGET。绕画布中心缩放的好处是背景光晕圆心 (32,32) 不动，
 *   渐变/滤镜（无论 objectBoundingBox 还是 userSpaceOnUse）都随内容一起缩放，不会错位。
 *
 * 用法：node build-v3-icons.js
 */
var fs = require("fs");

var SRC   = "F:/yanhua/原料图鉴-v3.html";
var OUTJSON = "F:/yanhua/.workbuddy/checks/v3-icons.json";
var OUTBLK  = "F:/yanhua/.workbuddy/checks/v3-symbols.html";

var TARGET = 48;   // 归一化后「最长边」占 64 画布的比例目标 = 48/64 = 75%（与原 32 视图剪影版 24/32=75% 一致）

/* 实测主体包围盒（64 视图坐标，已排除 r>=24 的背景光晕圆）。
   来源：driver-v3-iconset.js 跑 原料图鉴-v3.html 的输出，2026-09-11。 */
var SIZES = {
  saltpeter:  [42, 41], sulfur:     [32, 34], charcoal:   [38, 43], aluminum:   [35, 45],
  strontium:  [16, 50], barium:     [16, 50], copper:     [16, 50], sodium:     [16, 50],
  moonpetal:  [33, 53], dragonscale:[35, 34], phoenix:    [43, 44], unicorn:    [35, 52],
  stardust:   [43, 26], fairytear:  [28, 42], thunderbird:[30, 50], shadowcat:  [40, 46]
};

/* ---------- 1. 抽取 INGREDIENTS ---------- */
var src = fs.readFileSync(SRC, "utf8");
var m = src.match(/var INGREDIENTS\s*=\s*(\[[\s\S]*?\n\];)/);
if (!m) throw new Error("没找到 INGREDIENTS 数组");
var items = new Function("return " + m[1])();

if (items.length !== 16) throw new Error("期望 16 个原料，实得 " + items.length);

var out = items.map(function (it) {
  var svg = String(it.svg).trim();
  var dm = svg.match(/<defs>([\s\S]*?)<\/defs>/);
  var defs = dm ? dm[1].trim() : "";
  var body = svg.replace(/<defs>[\s\S]*?<\/defs>/, "")
                .replace(/^<svg[^>]*>/, "")
                .replace(/<\/svg>\s*$/, "")
                .trim();
  if (!defs) throw new Error(it.id + " 没有 <defs>");
  if (!body) throw new Error(it.id + " 主体为空");

  /* 把「背景光晕」从主体里切出来：所有 v3 图标都是开头一枚 <circle r=26|28 cx=cy=32>。
     它在设计里是固定底光，不参与归一化缩放（见下方注释）。 */
  var halo = "", haloR = 0;
  var hm = body.match(/^([\s\S]*?<circle\b[^>]*\br="(2[6-9]|[3-9]\d)"[^>]*\/>)/);
  if (hm) {
    halo = hm[1].trim();
    haloR = parseInt(hm[2], 10);
    body = body.slice(hm[1].length).trim();
    if (!body) throw new Error(it.id + " 切掉光晕后主体为空");
  }

  return { id: it.id, name: it.name, color: it.color, src: it.src || "v3",
           defs: defs, body: body, halo: halo, haloR: haloR };
});

/* ---------- 2. 归一化缩放 ---------- */
var rows = [], defsAll = [], symbols = [], seen = {}, dup = [];

out.forEach(function (o) {
  var sz = SIZES[o.id];
  if (!sz) throw new Error("缺 " + o.id + " 的实测尺寸");
  var maxDim = Math.max(sz[0], sz[1]);
  var s = TARGET / maxDim;
  s = Math.round(s * 1000) / 1000;

  // 归一化后主体相对画布中心的最大外扩（用于确认不会被 64 视窗裁掉）
  var reach = Math.max(sz[0], sz[1]) / 2 * s;   // 最长边半径
  var margin = 32 - reach;
  rows.push({ id: o.id, name: o.name, src: o.src, size: sz[0] + "x" + sz[1],
              maxDim: maxDim, scale: s, out: Math.round(sz[0] * s) + "x" + Math.round(sz[1] * s),
              margin: Math.round(margin * 10) / 10, halo: o.halo ? "r" + o.haloR : "—" });

  // defs 提为顶层：检查 id 唯一
  var ids = (o.defs.match(/\sid="([^"]+)"/g) || []).map(function (x) { return x.replace(/\sid="|"/g, ""); });
  ids.forEach(function (id) {
    if (seen[id]) dup.push(id + " (首次在 " + seen[id] + ")");
    seen[id] = o.id;
    defsAll.push("    <!-- " + o.id + " -->\n    " // 标注释：把每个 def 归到来源图标名下
      + o.defs.split("\n").map(function (l) { return l.trim(); }).join("\n").split("\n").join("\n    "));
  });

  // 背景光晕：单独留在缩放组外面。
  //   光晕是「固定打的底光」（r 26/28，占画布 81%，与图鉴里一致）；
  //   若跟着主体一起缩放，硫磺(×1.412)的光晕会涨到 r=36.7 撑破视窗，
  //   变成一团糊满整格的亮黄球 —— 实测截图确认过。
  var symbolInner = o.halo
    ? indent(o.halo, "      ") + "\n" +
      '      <g transform="translate(32,32) scale(' + s + ') translate(-32,-32)">\n' +
      indent(o.body, "        ") + "\n" +
      '      </g>'
    : '      <g transform="translate(32,32) scale(' + s + ') translate(-32,-32)">\n' +
      indent(o.body, "        ") + "\n" +
      '      </g>';

  symbols.push(
    '    <!-- ' + o.name + '（' + o.id + '，' + o.src + '）主体 ' + sz[0] + "x" + sz[1] +
    ' → 归一化 ×' + s.toFixed(3) + ' -->\n' +
    '    <symbol id="ic-' + o.id + '" viewBox="0 0 64 64">\n' +
    symbolInner + "\n" +
    '    </symbol>'
  );
});

if (dup.length) throw new Error("defs id 重复：" + dup.join(", "));

function indent(s, pad) {
  return s.split("\n").map(function (l) { return l.trim() ? pad + l.trim() : l; }).join("\n");
}

/* ---------- 3. 产出 ---------- */
var block =
'<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n' +
'  <defs>\n' +
defsAll.join("\n") + "\n" +
'  </defs>\n\n' +
symbols.join("\n\n") + "\n" +
'</svg>\n';

fs.writeFileSync(OUTJSON, JSON.stringify(out, null, 2), "utf8");
fs.writeFileSync(OUTBLK, block, "utf8");

/* ---------- 4. 报告 ---------- */
console.log("TARGET 最长边 = " + TARGET + "/64 = " + Math.round(TARGET / 64 * 100) + "%");
console.log("id      来源  实测主体    最长边  ×缩放  归一化后    中心余量  光晕");
rows.forEach(function (r) {
  console.log(
    pad(r.name, 7) + pad(r.src, 6) + pad(r.size, 11) + pad(String(r.maxDim), 7) +
    pad("×" + r.scale.toFixed(3), 8) + pad(r.out, 12) + pad(r.margin, 10) + r.halo);
});
var mn = Math.min.apply(null, rows.map(function (r) { return r.margin; }));
console.log("\n最小中心余量 = " + mn + " 单位（>0 即不会被 64 视窗裁切）");
console.log("defs 注册 " + Object.keys(seen).length + " 个 id，无重复");
console.log("写出：\n  " + OUTJSON + "\n  " + OUTBLK + "  (" + block.split("\n").length + " 行)");

function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s + " "; }
