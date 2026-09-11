// 生成「瓶罐版图标」游戏预览副本（只写 checks 下的临时文件，不改原文件）
// 把 原料图标集.svg 的 <defs> 塞进 烟火小作坊.html 的图标位，并把 ingIcon 的 viewBox 改成 64
const fs = require("fs");

const GAME = "F:/yanhua/烟火小作坊.html";
const ATLAS = "F:/yanhua/原料图标集.svg";
const OUT = "F:/yanhua/.workbuddy/checks/preview-jar-icons.html";

let game = fs.readFileSync(GAME, "utf8");
const atlas = fs.readFileSync(ATLAS, "utf8");

// 1) 取新 defs（去掉仅供预览层使用的 h-* 光晕渐变）
const m = atlas.match(/<defs>([\s\S]*?)<\/defs>/);
if (!m) throw new Error("atlas defs not found");
const defs = m[1]
  .split("\n")
  .filter((l) => !/id="h-/.test(l))
  .join("\n");

// 2) 替换游戏里旧的图标 <svg>…</svg> 块
const start = game.indexOf("<!-- ============ 原料图标集");
if (start < 0) throw new Error("old icon block start not found");
const end = game.indexOf("</svg>", start);
if (end < 0) throw new Error("old icon block end not found");
const oldBlock = game.slice(start, end + 6);
const newBlock =
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n' +
  "<defs>" + defs + "</defs>\n</svg>";
game = game.slice(0, start) + newBlock + game.slice(end + 6);

// 3) ingIcon 的 viewBox 32 → 64
const before = (game.match(/viewBox="0 0 32 32"/g) || []).length;
game = game.replace(/viewBox="0 0 32 32"/g, 'viewBox="0 0 64 64"');
const after = (game.match(/viewBox="0 0 32 32"/g) || []).length;

fs.writeFileSync(OUT, game);
console.log("oldBlock lines =", oldBlock.split("\n").length);
console.log("newBlock lines =", newBlock.split("\n").length);
console.log('viewBox "0 0 32 32" replaced =', before, "->", after);
console.log("written:", OUT);
