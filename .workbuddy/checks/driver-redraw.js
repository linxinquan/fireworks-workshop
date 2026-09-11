// 重绘验证：四步各截一张核心图（小碗 / 大碗+搅拌棒 / 琉璃筒装填 / 点燃页筒）
(function () {
  var R = {};
  function out(k, v) { R[k] = v; }
  function phase(name) { window.__phase = name; }
  function report() {
    var pre = document.getElementById("testReport") || document.createElement("pre");
    pre.id = "testReport";
    pre.style.display = "none";
    pre.textContent = "@@BEGIN@@" + JSON.stringify(R) + "@@END@@";
    document.body.appendChild(pre);
    window.__done = true;
  }
  function svgOk(sel) {
    var el = document.querySelector(sel);
    if (!el) return "missing";
    try {
      var bb = el.getBBox();
      return (bb.width > 4 && bb.height > 4) ? "ok" : "empty";
    } catch (e) { return "err"; }
  }
  function drag(stage, x1, x2, steps) {
    function ev(type, x) {
      var touch = { identifier: 0, target: stage, clientX: x, clientY: 260, radiusX: 2.5, radiusY: 2.5, rotationAngle: 0, force: 0.5 };
      (type.startsWith("touch") ? Touch : MouseEvent);
      var E = (type.indexOf("touch") === 0) ? TouchEvent : MouseEvent;
      var opts = { bubbles: true, cancelable: true, clientX: x, clientY: 260 };
      if (type.indexOf("touch") === 0) {
        opts.touches = (type === "touchend") ? [] : [touch];
        opts.changedTouches = [touch];
        opts.targetTouches = (type === "touchend") ? [] : [touch];
      }
      stage.dispatchEvent(new E(type, opts));
    }
    var i = 0;
    var iv = setInterval(function () {
      i++;
      if (i === 1) ev("touchstart", x1);
      else if (i <= steps) ev("touchmove", x1 + (x2 - x1) * i / steps);
      else { ev("touchend", x2); clearInterval(iv); }
    }, 40);
  }
  function waitMs(ms, fn) { setTimeout(fn, ms); }

  function boot() {
    var st = document.createElement("style");
    st.textContent = "*{animation:none!important;transition:none!important}";
    document.head.appendChild(st);
    out("smallBowlSvg", svgOk(".bowl svg"));
    out("bigBowlSvg", svgOk(".big-bowl > svg"));
    out("spoonSvg", svgOk("#spoon"));
    out("packTubeSvg", svgOk("#step-pack .tube svg"));
    out("launchTubeSvg", svgOk("#step-launch .tube svg"));

    // 第 1 步：选 3 种原料，看小碗
    var cards = document.querySelectorAll("#rack .ing-card");
    cards[0].click(); cards[3].click(); cards[8].click();
    waitMs(600, function () {
      out("bowlCount", document.getElementById("bowlCount").textContent);
      phase("s1-bowl");
      // 进第 2 步
      document.getElementById("btnToMix").click();
      waitMs(700, function () {
        var stage = document.getElementById("mixStage");
        var br = document.getElementById("bigBowl").getBoundingClientRect();
        var cx = br.left + br.width / 2;
        var half = Math.max(76, br.width * 0.55);
        drag(stage, cx - half, cx + half, 24);
        waitMs(1400, function () {
          out("mixPct", document.getElementById("mixPct").textContent);
          phase("s2-mix");
          // 进第 3 步
          document.getElementById("btnToPack").click();
          waitMs(700, function () {
            var po = document.querySelectorAll(".pack-option");
            if (po.length) po[1].click();
            waitMs(500, function () {
              phase("s3-pack");
              // 进第 4 步
              document.getElementById("btnToLaunch").click();
              waitMs(800, function () {
                out("btnLaunchDisabled", String(document.getElementById("btnLaunch").disabled));
                phase("s4-launch");
                waitMs(600, report);
              });
            });
          });
        });
      });
    });
  }
  if (document.readyState === "complete") setTimeout(boot, 300);
  else window.addEventListener("load", function () { setTimeout(boot, 300); });
})();
