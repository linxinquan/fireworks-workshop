// 设计语言页验证：量图标渲染 + 分区截图
// 用法: cdp-run.js --file UI设计语言-v3.html --driver driver-design-page.js --width 1280 --height 900 --dsf 2
(function () {
  var R = {};
  function phase(name) { window.__phase = name; }
  function report() {
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.style.display = "none";
    pre.textContent = "@@BEGIN@@" + JSON.stringify(R) + "@@END@@";
    document.body.appendChild(pre);
    window.__done = true;
  }

  function check() {
    var uses = [].slice.call(document.querySelectorAll("use"));
    var badBBox = 0, subjects = [];
    uses.forEach(function (u) {
      var svg = u.ownerSVGElement;
      if (!svg) return;
      var r = svg.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { badBBox++; return; }
      try {
        var bb = svg.getBBox();
        if (!bb || (bb.width === 0 && bb.height === 0)) badBBox++;
      } catch (e) { badBBox++; }
    });
    R.uses = uses.length;
    R.badBBox = badBBox;

    // 各分区是否可见
    ["hero", "ingGrid", "ingGrid"].forEach(function () {});
    R.sections = [].slice.call(document.querySelectorAll("section")).map(function (s) {
      var h = s.querySelector("h2");
      return (h ? h.textContent.slice(0, 10) : "?") + ":" + s.offsetHeight + "px";
    });

    // 原料卡状态
    var cards = document.querySelectorAll(".ing-card");
    R.ingCards = cards.length;
    R.magicCards = document.querySelectorAll(".ing-card.magic").length;
    R.selCards = document.querySelectorAll(".ing-card.sel").length;

    // 按钮数量
    R.btns = document.querySelectorAll(".btn").length;
    R.tags = document.querySelectorAll(".tag").length;
    R.toastIco = !!document.querySelector(".toast use");

    // 交互冒烟：点第二张卡 → 选中态转移
    if (cards[1]) {
      cards[1].click();
      R.selAfterClick = document.querySelectorAll(".ing-card.sel").length;
      R.selIsCard2 = cards[1].classList.contains("sel");
    }

    // 背景是否深色（截图像素判断交给截图，这里查 computed）
    R.bodyBg = getComputedStyle(document.body).backgroundColor;

    phase("full");
    setTimeout(function () { phase("top"); }, 250);
    // 分段滚动截图：逐个 section 滚到视口顶部，各留一张
    var secs = [].slice.call(document.querySelectorAll("section"));
    secs.forEach(function (s, i) {
      setTimeout(function () {
        s.scrollIntoView({ block: "start" });
        window.scrollBy(0, -12);
        phase("sec" + (i + 1));
      }, 600 + i * 450);
    });
    setTimeout(report, 600 + secs.length * 450 + 300);
  }

  if (document.readyState === "complete") setTimeout(check, 300);
  else window.addEventListener("load", function () { setTimeout(check, 300); });
})();
