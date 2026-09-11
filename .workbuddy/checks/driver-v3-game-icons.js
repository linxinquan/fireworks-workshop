/* 量游戏内图标（v3）的实际渲染尺寸，确认：
   ① 16 个 <use> 都能解析、都画得出图形（非空、非同一张）
   ② .ico 的 CSS 尺寸 + 归一化后主体（最长边 75%）折算到 CSS px / 设备 px 是多少
   ③ 选料区不横向溢出
   截图用：--clip "#rack" */
(function () {
  var LOG = [];
  function out(k, v) { LOG.push(k + " = " + v); }
  window.addEventListener("error", function (e) { out("JSERROR", e.message); });

  function rect(sel) {
    var el = document.querySelector(sel);
    if (!el) return "MISSING";
    var r = el.getBoundingClientRect();
    return Math.round(r.left) + "," + Math.round(r.top) + " " +
           Math.round(r.width) + "x" + Math.round(r.height);
  }

  function run() {
    // 关掉入场动画（否则卡片半透明，截图会像"幽灵卡"）
    var st = document.createElement("style");
    st.textContent = "*{animation:none!important;transition:none!important}";
    document.head.appendChild(st);

    var dpr = window.devicePixelRatio || 1;
    out("dpr", dpr);
    out("viewport", window.innerWidth + "x" + window.innerHeight);

    var cards = document.querySelectorAll("#rack .ing-card");
    out("rackCards", cards.length);

    var blanks = [], sigs = {};
    [].forEach.call(cards, function (c) {
      var svg = c.querySelector(".ing-ico");
      var name = (c.querySelector(".ing-name") || c).textContent.trim().slice(0, 6);
      if (!svg) { blanks.push(name + "(无svg)"); return; }
      var r = svg.getBoundingClientRect();
      var use = svg.querySelector("use");
      var b = use ? use.getBBox() : { width: 0, height: 0 };
      var k = r.width / 64;                     // 64 视图单位 → CSS px
      var subjCss = 0.75 * r.width;             // 归一化后主体最长边 = 75%
      if (!(b.width > 0 && b.height > 0)) blanks.push(name + "(空)");
      sigs[Math.round(b.width) + "x" + Math.round(b.height)] =
        (sigs[Math.round(b.width) + "x" + Math.round(b.height)] || 0) + 1;
      out("ICO", name.padEnd(6) + " 盒子 " + r.width.toFixed(1) + "x" + r.height.toFixed(1) +
        " CSS(" + (r.width * dpr).toFixed(0) + "x" + (r.height * dpr).toFixed(0) + " 设备px)" +
        "  内容bbox(含光晕) " + b.width.toFixed(0) + "x" + b.height.toFixed(0) +
        "  主体≈" + subjCss.toFixed(1) + " CSS / " + (subjCss * dpr).toFixed(1) + " 设备px");
    });
    out("空图标", blanks.length ? blanks.join(",") : "无");
    out("不同bbox签名数", Object.keys(sigs).length + " （越接近 16 越说明不是同一张图）");

    out("横向溢出", document.documentElement.scrollWidth > window.innerWidth);
    out("rackRect", rect("#rack"));
    out("card0Rect", rect("#rack .ing-card"));
    out("ico0Rect", rect("#rack .ing-card .ing-ico"));

    var p = document.createElement("pre");
    p.id = "testReport";
    p.style.cssText = "display:none";
    p.textContent = LOG.join("\n");
    document.body.appendChild(p);
    window.__phase = "rack";
  }

  function boot() { setTimeout(run, 700); }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
