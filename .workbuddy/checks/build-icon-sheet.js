#!/usr/bin/env node
/*
 * build-icon-sheet.js — 把单文件 HTML 里的内联 SVG 图标集抽出来，生成一张「图标对照页」。
 *
 * 用途：图标是 24~27px 用的，直接看页面截图根本判断不了细节（形状糊、描边粗细不统一、
 * 视觉体量差一倍都不一定看得出来）。把它们按 90px / 40px / 25px 三档并排渲染，
 * 再配上浅色卡背景，问题一眼就暴露。
 *
 *   node build-icon-sheet.js --file page.html [--out sheet.html]
 *
 * 约定：页面里有一个 `<svg width="0" height="0">…<symbol id="ic-XXX">…</symbol></svg>` 定义块，
 * 图标 id 写在页面内的 `INGREDIENTS`/数组里时用 --ids a,b,c 手动指定。
 */
"use strict";
const fs = require("fs");
const path = require("path");

function parseArgs(argv){
  const a = {};
  for(let i = 2; i < argv.length; i++){
    if(argv[i] === "--file") a.file = argv[++i];
    else if(argv[i] === "--out") a.out = argv[++i];
    else if(argv[i] === "--ids") a.ids = argv[++i].split(",");
    else if(argv[i] === "--prefix") a.prefix = argv[++i];
  }
  return a;
}

const args = parseArgs(process.argv);
if(!args.file){ console.error("usage: node build-icon-sheet.js --file page.html [--out sheet.html] [--ids a,b,c] [--prefix ic-]"); process.exit(1); }
const prefix = args.prefix || "ic-";

const html = fs.readFileSync(args.file, "utf8");
// 1) 抓图标定义块（含有 <symbol 的那个 <svg>）
const defsMatches = html.match(/<svg[^>]*>[\s\S]*?<symbol[\s\S]*?<\/svg>/g);
if(!defsMatches){ console.error("没找到内联 <symbol> 图标定义块"); process.exit(1); }
const defs = defsMatches[defsMatches.length - 1];

// 2) 图标 id 列表：优先命令行，其次从定义块里按出现顺序取
let ids = args.ids;
if(!ids){
  ids = [...defs.matchAll(new RegExp("symbol id=\"(" + prefix + "[^\"]+)\"", "g"))].map((m) => m[1].slice(prefix.length));
}
if(!ids.length){ console.error("没有解析到图标 id，用 --ids 手动指定"); process.exit(1); }

const card = (id) => `<div class="c">
  <div class="big"><svg viewBox="0 0 32 32"><use href="#${prefix}${id}"/></svg></div>
  <div class="mid"><svg viewBox="0 0 32 32"><use href="#${prefix}${id}"/></svg><span class="s"><svg class="ico" viewBox="0 0 32 32"><use href="#${prefix}${id}"/></svg></span></div>
  <div class="n">${id}</div>
</div>`;

const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:linear-gradient(180deg,#241d3c,#161022);color:#f2efe6;
  font-family:"PingFang SC","Microsoft YaHei",sans-serif;padding:12px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.c{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:12px;
  padding:7px;display:flex;flex-direction:column;align-items:center;gap:5px}
.big svg{width:90px;height:90px;display:block}
.mid{display:flex;align-items:center;gap:12px}
.mid svg{width:40px;height:40px;display:block}
.s .ico{width:25px;height:25px;display:block}
.n{font-size:11px;color:#c9c4b8}
</style></head><body>
<div class="grid">${ids.map(card).join("")}</div>
${defs}
</body></html>`;

const out = args.out || path.join(path.dirname(args.file), "_icon-sheet.html");
fs.writeFileSync(out, page);
console.log("icon sheet: " + out + "  (" + ids.length + " icons)");
