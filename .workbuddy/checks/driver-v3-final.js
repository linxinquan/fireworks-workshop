/* v3 终版截图驱动：
   1) 关掉入场动画（否则后几排卡片会以半透明状态被截成「幽灵卡」）
   2) phase "grid"               —— 整页网格
   3) 逐个点开指定原料的弹层，各出一张 phase "sheet-<原料>"
   用法：node cdp-run.js --file 原料图鉴-v3.html --driver driver-v3-final.js --out <dir> */
(function(){
  var st = document.createElement("style");
  st.textContent = "*{animation:none!important;transition:none!important}";
  document.head.appendChild(st);

  /* 用 SVG 内部独有的 id 反查卡片，避免依赖中文名或数组下标 */
  var SHEETS = [
    { id: "unicorn",     mark: "mg-horn-amb" },
    { id: "thunderbird", mark: "mg-bolt-amb" },
    { id: "shadowcat",   mark: "mg-cat-amb" }
  ];

  function cardByMark(mark){
    var cards = document.querySelectorAll("#grid .card");
    for (var i = 0; i < cards.length; i++){
      if (cards[i].innerHTML.indexOf(mark) >= 0) return cards[i];
    }
    return null;
  }

  var HOLD = 700;   // 弹层保持打开多久，给 CDP 轮询（150ms/次）留足截图窗口

  function done(){
    /* 写 #testReport 让 harness 提前收工（否则会空等到 --timeout） */
    var p = document.createElement("pre");
    p.id = "testReport";
    p.textContent = "phases = grid, " + SHEETS.map(function(s){ return "sheet-" + s.id; }).join(", ");
    document.body.appendChild(p);
  }

  function next(i){
    if (i >= SHEETS.length){ done(); return; }
    var s = SHEETS[i];
    var card = cardByMark(s.mark);
    if (!card){ next(i + 1); return; }
    card.click();
    window.__phase = "sheet-" + s.id;
    setTimeout(function(){
      var c = document.getElementById("close");
      if (c) c.click();
      setTimeout(function(){ next(i + 1); }, 200);
    }, HOLD);
  }

  function boot(){
    setTimeout(function(){
      window.__phase = "grid";
      setTimeout(function(){ next(0); }, 400);
    }, 120);
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
