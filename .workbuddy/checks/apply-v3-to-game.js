/* 把 build-v3-icons.js 产出的 symbol 块注入游戏。
 * 用法：node apply-v3-to-game.js <输入html> <输出html>
 *   - 替换「原料图标集」整块（<svg width="0" height="0"> … </svg>）
 *   - 把其余残留的 viewBox="0 0 32 32"（ingIcon 1 处 + #pickNote 内联 3 处）改为 64
 * 默认：输入 F:/yanhua/烟火小作坊.html，输出 F:/yanhua/.workbuddy/checks/preview-v3-game.html
 */
var fs = require("fs");

var IN  = process.argv[2] || "F:/yanhua/烟火小作坊.html";
var OUT = process.argv[3] || "F:/yanhua/.workbuddy/checks/preview-v3-game.html";
var BLK = "F:/yanhua/.workbuddy/checks/v3-symbols.html";

var html = fs.readFileSync(IN, "utf8");
var block = fs.readFileSync(BLK, "utf8").trim();

/* ---- 1. 定位并替换图标块 ---- */
var MARK = "<!-- ============ 原料图标集";
var mi = html.indexOf(MARK);
if (mi < 0) throw new Error("没找到图标集标记");

var svgStart = html.indexOf("<svg width=\"0\" height=\"0\"", mi);
if (svgStart < 0) throw new Error("没找到图标集 <svg>");
var svgEnd = html.indexOf("</svg>", svgStart);
if (svgEnd < 0) throw new Error("图标集 <svg> 未闭合");
svgEnd += "</svg>".length;

var header =
"<!-- ============ 原料图标集（v3 · 统一风格 SVG） ============\n" +
"     来源：原料图鉴-v3.html（12 个 v3 新画 + 4 个 v1 试管）。\n" +
"     约定：viewBox 64×64；<defs> 提为顶层共享（id 全局唯一）；每个 <symbol> 内容已做\n" +
"     「绕画布中心 (32,32) 等比缩放」，把主体最长边统一归一化到 48/64 = 75%，\n" +
"     混排时体量一致（原 v1 试管宽仅 25%、硫磺最长边仅 34，不归一化会明显不齐）。\n" +
"     用 <symbol> 定义一次，各处 <use href=\"#ic-<原料id>\"> 复用。 -->";

var before = html.slice(0, mi);
var after  = html.slice(svgEnd);
var next = before + header + "\n" + block + after;

/* ---- 2. 剩余 viewBox 32 → 64 ---- */
var left32 = (next.match(/0 0 32 32/g) || []).length;
next = next.split("0 0 32 32").join("0 0 64 64");
var left64 = (next.match(/0 0 64 64/g) || []).length;

if (left32 !== 4) console.warn("⚠️ 预期残留 4 处 viewBox 32（ingIcon 1 + pickNote 3），实得 " + left32);

fs.writeFileSync(OUT, next, "utf8");
console.log("输入 " + IN);
console.log("输出 " + OUT);
console.log("图标块：替换 " + (svgEnd - svgStart) + " 字符 → " + block.length + " 字符");
console.log("viewBox 0 0 32 32 → 0 0 64 64 ：改了 " + left32 + " 处；现 64 共 " + left64 + " 处");
