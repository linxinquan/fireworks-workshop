// 夜色琉璃换肤验证：logo SVG 渲染 + 分段截图
(function () {
  var R = {};
  function phase(name) { window.__phase = name; }
  function report() {
    var pre = document.getElementById("testReport") || document.createElement("pre");
    pre.id = "testReport";
    pre.style.display = "none";
    pre.textContent = "@@BEGIN@@" + JSON.stringify(R) + "@@END@@";
    document.body.appendChild(pre);
    window.__done = true;
  }
  function check() {
    var logo = document.querySelector(".brand .logo");
    var svg = logo && logo.querySelector("svg");
    R.logoHasSvg = !!svg;
    R.logoHasEmoji = logo ? /[\u2600-\u27BF\uFE0F]|🎆/.test(logo.textContent) : null;
    if (svg) {
      var r = svg.getBoundingClientRect();
      R.logoRect = Math.round(r.width) + "x" + Math.round(r.height);
      try { var bb = svg.getBBox(); R.logoBBox = Math.round(bb.width) + "x" + Math.round(bb.height); } catch (e) {}
    }
    // 主按钮发光（getComputedStyle 取 box-shadow 是否含 rgb(255,183,3)）
    var btn = document.querySelector(".btn:not(.ghost)");
    if (btn) R.btnGlow = getComputedStyle(btn).boxShadow.indexOf("255, 183, 3") > -1 || getComputedStyle(btn).boxShadow.indexOf("255,183,3") > -1;
    // 工作台边框应为 1px
    var wb = document.querySelector(".workbench");
    if (wb) R.workbenchBorder = getComputedStyle(wb).borderTopWidth;
    // 步骤 active 辉光
    var ad = document.querySelector(".steps li.active .step-dot");
    if (ad) R.stepGlow = getComputedStyle(ad).boxShadow.indexOf("255, 209, 102") > -1;
    // 选中原料卡辉光
    var sel = document.querySelector(".ing-card.selected");
    R.hasSelCard = !!sel;
    if (sel) R.selGlow = getComputedStyle(sel).boxShadow.indexOf("255, 209, 102") > -1;

    phase("top");
    var secs = [".steps", "#rack", ".mix-stage", ".pack-stage", ".launch-controls", ".card"];
    secs.forEach(function (sel2, i) {
      setTimeout(function () {
        var el = document.querySelector(sel2);
        if (el) el.scrollIntoView({ block: "center" });
        phase("at" + i + "-" + sel2.replace(/[^a-z-]/gi, ""));
      }, 500 + i * 450);
    });
    setTimeout(report, 500 + secs.length * 450 + 300);
  }
  if (document.readyState === "complete") setTimeout(check, 400);
  else window.addEventListener("load", function () { setTimeout(check, 400); });
})();
