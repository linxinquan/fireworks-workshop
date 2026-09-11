/* 雷鸟羽毛（重绘版）弹层截图驱动
   1) 关掉入场动画（避免幽灵卡）
   2) 用新 SVG 内部独有的 id "mg-feather-main" 反查雷鸟卡片并点开
   3) phase "sheet-thunderbird" —— 给 CDP 轮询（150ms/次）留足截图窗口 */
(function(){
  var st = document.createElement("style");
  st.textContent = "*{animation:none!important;transition:none!important}";
  document.head.appendChild(st);

  function cardByMark(mark){
    var cards = document.querySelectorAll("#grid .card");
    for (var i = 0; i < cards.length; i++){
      if (cards[i].innerHTML.indexOf(mark) >= 0) return cards[i];
    }
    return null;
  }

  var HOLD = 900;

  function done(){
    var p = document.createElement("pre");
    p.id = "testReport";
    p.textContent = "phases = sheet-thunderbird";
    document.body.appendChild(p);
  }

  function boot(){
    setTimeout(function(){
      var card = cardByMark("mg-feather-main");
      if (!card){ done(); return; }
      card.click();
      window.__phase = "sheet-thunderbird";
      setTimeout(done, HOLD);
    }, 300);
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
