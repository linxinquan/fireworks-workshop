/* v3 图标在游戏里的三个"尺寸上下文"验收 + 截图：
 *   phase journal —— 炼金手札弹层（.j-ico 24px）
 *   phase result  —— 燃放报告结果卡（.fx-ingredients .ico 17px / 移动端 15px）
 * 同时把每个上下文里的图标盒子尺寸与折算设备像素打进报告。
 * 用法：node cdp-run.js --file <游戏> --driver driver-v3-contexts.js --out <dir> --width 390 --height 844 --dsf 3 --mobile
 */
(function () {
  var LOG = [];
  function out(k, v) { LOG.push(k + " = " + v); }
  window.addEventListener("error", function (e) { out("JSERROR", e.message); });

  function icoStats(sel) {
    var els = document.querySelectorAll(sel);
    if (!els.length) return sel + " → 0 个";
    var r = els[0].getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var blanks = 0;
    [].forEach.call(els, function (e) {
      var u = e.querySelector("use");
      var b = u ? u.getBBox() : { width: 0 };
      if (!(b.width > 0)) blanks++;
    });
    return els.length + " 个，盒子 " + r.width.toFixed(1) + "x" + r.height.toFixed(1) +
      " CSS (" + (r.width * dpr).toFixed(0) + " 设备px)，空图标 " + blanks;
  }

  var HOLD = 900;

  function phase(p) { window.__phase = p; }

  function report() {
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = LOG.join("\n");
    document.body.appendChild(pre);
  }

  function drag(stage, from, to, steps) {
    var r = stage.getBoundingClientRect();
    var y = r.top + r.height / 2;
    function ev(type, x) {
      return new PointerEvent(type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 1, pointerType: "touch", isPrimary: true,
        buttons: type === "pointerup" ? 0 : 1
      });
    }
    stage.dispatchEvent(ev("pointerdown", from));
    for (var i = 1; i <= steps; i++) {
      stage.dispatchEvent(ev("pointermove", from + (to - from) * i / steps));
    }
    stage.dispatchEvent(ev("pointerup", to));
  }

  function stepJournal(next) {
    var jd = document.getElementById("journalDialog");
    document.getElementById("btnJournal").click();
    setTimeout(function () {
      out("journal 图标", icoStats("#journalGrid .j-ico"));
      phase("journal");
      setTimeout(function () {
        if (jd && jd.open) jd.close();
        setTimeout(next, 250);
      }, HOLD);
    }, 400);
  }

  function stepFlow() {
    var cards = document.querySelectorAll("#rack .ing-card");
    out("rack 图标", icoStats("#rack .ing-ico"));
    cards[0].click(); cards[3].click(); cards[8].click();
    setTimeout(function () {
      document.getElementById("btnToMix").click();
      setTimeout(function () {
        var stage = document.getElementById("mixStage");
        var br = document.getElementById("bigBowl").getBoundingClientRect();
        var cx = br.left + br.width / 2;
        var half = Math.max(76, br.width * 0.55);
        drag(stage, cx - half, cx + half, 24);
        setTimeout(function () {
          document.getElementById("btnToPack").click();
          setTimeout(function () {
            var po = document.querySelectorAll(".pack-option");
            if (po.length) po[1].click();
            setTimeout(function () {
              // btnToLaunch = 装填页的"装填完毕"，只是跳到第 4 步；
              // 真正点燃的是第 4 步的 #btnLaunch，别点错。
              document.getElementById("btnToLaunch").click();
              setTimeout(function () {
                var rc = document.getElementById("resultCard");
                out("点燃前 resultCard.hidden", String(rc.hidden) +
                  " / computed display=" + getComputedStyle(rc).display +
                  " / opacity=" + getComputedStyle(rc).opacity);
                var lb = document.getElementById("btnLaunch");
                out("btnLaunch.disabled(点燃前)", String(lb.disabled));
                lb.click();
                waitResult(0);
              }, 900);
            }, 1200);
          }, 700);
        }, 900);
      }, 900);
    }, 500);
  }

  /* 点燃后要等烟花飞完才出结果卡，轮询 #rcName 有文字为止（最多 12s） */
  function waitResult(tries) {
    var name = (document.getElementById("rcName") || {}).textContent || "";
    var ings = document.querySelectorAll("#step-launch .fx-ingredients .ico").length;
    if ((name && ings) || tries > 280) {
      setTimeout(function () {
        out("结果卡 名称", name || "（为空）");
        out("结果卡 图标", icoStats("#step-launch .fx-ingredients .ico"));
        out("结果卡 note 图标", icoStats("#step-launch .panel-note .ico"));
        out("结果卡 溢出检查", (function () {
          var c = document.querySelector("#resultCard .card-body");
          if (!c) return "无 .card-body";
          return "scrollH=" + c.scrollHeight + " clientH=" + c.clientHeight +
            (c.scrollHeight > c.clientHeight + 1 ? " ⚠️需滚动" : " ✓不裁");
        })());
        phase("result");
        setTimeout(report, HOLD);
      }, 300);
      return;
    }
    setTimeout(function () { waitResult(tries + 1); }, 200);
  }

  function boot() {
    /* ⚠️ 这里故意【不】注入 *{animation:none}：
       装填/点燃流程依赖 CSS 过渡（transitionend）推进，关掉动画会让「点燃」按钮永远停在
       disabled，结果卡根本不会出现（实测：关闭动画后 12s 轮询 #rcName 仍为空）。
       截图时机交给 waitResult() 轮询，不用关动画。 */
    setTimeout(function () { stepJournal(stepFlow); }, 200);
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
