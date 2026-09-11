/* 量 v3 图鉴每个图标的「视觉体量」：包围盒占 viewBox 64 的比例 + 实际渲染尺寸
   目的：确认 v1 试管（细长）与 v3 结晶簇（铺满）混排时体量差多少 */
(function(){
  var LOG = [];
  function out(k, v){ LOG.push(k + " = " + v); }
  window.addEventListener("error", function(e){ out("JSERROR", e.message); });

  function rect(sel){
    var el = document.querySelector(sel);
    if(!el) return "MISSING";
    var r = el.getBoundingClientRect();
    return Math.round(r.left) + "," + Math.round(r.top) + " " +
           Math.round(r.width) + "x" + Math.round(r.height);
  }

  function run(){
    var cards = document.querySelectorAll("#grid .card");
    out("cardCount", cards.length);
    out("progressText", document.getElementById("barCap").textContent);

    /* 两个坑：
       ① getBBox() 会把统一的 r>=24 背景光晕圆算进去，所有 v3 图标都量成 52/56 的方块
          —— 那是光晕不是主体，要跳过。
       ② getBBox() **不含元素自身的 transform**。图标里一旦出现
          `<g transform="translate(32,24)">` / `<path transform="rotate(72)">`，
          直接对各子元素 getBBox 做并集就会把不同坐标空间的坐标混在一起，
          量出 62x77 这种超过 viewBox 的假数。
       正解：用 getCTM/getScreenCTM 把每个子元素的包围盒**映射回 svg 的 viewBox 坐标**再取并集。 */
    function boxInViewBox(svg, el){
      var b;
      try { b = el.getBBox(); } catch(e){ return null; }
      if(!b || b.width <= 0 || b.height <= 0) return null;
      var rootInv;
      try { rootInv = svg.getScreenCTM().inverse(); } catch(e){ return b; }
      var m;
      try { m = rootInv.multiply(el.getScreenCTM()); } catch(e){ return b; }
      var xs = [], ys = [];
      [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
        .forEach(function(p){
          var q = new DOMPoint(p[0], p[1]).matrixTransform(m);
          xs.push(q.x); ys.push(q.y);
        });
      return { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys),
               width: Math.max.apply(null, xs) - Math.min.apply(null, xs),
               height: Math.max.apply(null, ys) - Math.min.apply(null, ys) };
    }

    function subjectBBox(svg){
      var x1=1e9, y1=1e9, x2=-1e9, y2=-1e9;
      [].forEach.call(svg.children, function(el){
        var tag = el.tagName.toLowerCase();
        if(tag === "defs" || tag === "title") return;
        if(tag === "circle" && parseFloat(el.getAttribute("r")) >= 24) return; // 背景光晕
        var b = boxInViewBox(svg, el);
        if(!b) return;
        x1 = Math.min(x1, b.x);            y1 = Math.min(y1, b.y);
        x2 = Math.max(x2, b.x + b.width);  y2 = Math.max(y2, b.y + b.height);
      });
      if(x1 > x2) return { width: 0, height: 0 };
      return { width: x2 - x1, height: y2 - y1 };
    }

    var rows = [], wsum = { "v1":0, "v3":0 }, n = { "v1":0, "v3":0 };
    [].forEach.call(cards, function(c){
      var name = c.querySelector(".name").textContent;
      var tag  = c.querySelector(".meta").textContent;
      var svg  = c.querySelector(".icon svg");
      var r    = svg.getBoundingClientRect();
      var b    = subjectBBox(svg);
      var wp = Math.round(b.width  / 64 * 100);
      var hp = Math.round(b.height / 64 * 100);
      var kind = tag.indexOf("v1") >= 0 ? "v1" : "v3";
      wsum[kind] += b.width; n[kind]++;
      rows.push(name.padEnd(6) + " [" + kind + "] 主体 " +
        Math.round(b.width) + "x" + Math.round(b.height) +
        " (" + wp + "%x" + hp + "%)  渲染 " +
        Math.round(r.width) + "x" + Math.round(r.height));
    });
    rows.forEach(function(s){ out("ICON", s); });
    out("主体平均宽占比", "v1 试管 " + Math.round(wsum.v1/n.v1/64*100) + "%  |  v3 新画 " + Math.round(wsum.v3/n.v3/64*100) + "%");

    // 空图标 / 未渲染断言
    var blank = [];
    [].forEach.call(cards, function(c){
      var b = c.querySelector(".icon svg").getBBox();
      if(b.width <= 0 || b.height <= 0) blank.push(c.querySelector(".name").textContent);
    });
    out("空图标", blank.length ? blank.join(",") : "无");

    // 布局
    out("横向溢出", document.documentElement.scrollWidth > window.innerWidth);
    out("gridRect", rect("#grid"));
    out("card0Rect", rect("#grid .card"));
    out("icon0Rect", rect("#grid .card .icon"));
    out("modalVisible", document.getElementById("modal").classList.contains("on"));

    window.__phase = "grid";
  }

  function report(){
    var p = document.createElement("pre");
    p.id = "testReport";
    p.textContent = LOG.join("\n");
    document.body.appendChild(p);
  }
  function boot(){
    /* 卡片有 animation:in .35s + animationDelay=i*22ms 的入场动画。
       若在动画未跑完时截图，后几排会呈半透明「幽灵卡」——那是截图时机问题，不是渲染问题。
       截图类驱动一律先关掉动画。 */
    var st = document.createElement("style");
    st.textContent = "*{animation:none!important;transition:none!important}";
    document.head.appendChild(st);
    setTimeout(function(){ run(); setTimeout(report, 500); }, 80);
  }
  if(document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
