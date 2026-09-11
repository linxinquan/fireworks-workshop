/* 探针：确认「结果卡在点燃前就可见」是不是既有问题（与图标改动无关）。
   只走到第 4 步（不点燃），读 #resultCard 的 hidden / computed display / opacity。 */
(function () {
  function run() {
    var LOG = [];
    function out(k, v) { LOG.push(k + " = " + v); }
    document.querySelectorAll("#rack .ing-card")[0].click();
    setTimeout(function () {
      document.getElementById("btnToMix").click();
      setTimeout(function () {
        document.getElementById("btnToPack").click();
        setTimeout(function () {
          var po = document.querySelectorAll(".pack-option");
          if (po.length) po[1].click();
          setTimeout(function () {
            document.getElementById("btnToLaunch").click();   // 跳到第 4 步
            setTimeout(function () {
              var rc = document.getElementById("resultCard");
              out("resultCard.hidden", String(rc.hidden));
              out("computed display", getComputedStyle(rc).display);
              out("computed opacity", getComputedStyle(rc).opacity);
              out("computed visibility", getComputedStyle(rc).visibility);
              var r = rc.getBoundingClientRect();
              out("cardRect", Math.round(r.left) + "," + Math.round(r.top) + " " +
                Math.round(r.width) + "x" + Math.round(r.height));
              out("rcName", JSON.stringify(document.getElementById("rcName").textContent));
              out("rcIngredients子元素", document.getElementById("rcIngredients").children.length);
              out("底部中心命中元素", (function () {
                var el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 40);
                return el ? (el.id || el.className || el.tagName) : "null";
              })());
              var p = document.createElement("pre");
              p.id = "testReport";
              p.textContent = LOG.join("\n");
              document.body.appendChild(p);
              window.__phase = "step4";
            }, 1200);
          }, 700);
        }, 700);
      }, 700);
    }, 700);
  }
  if (document.readyState === "complete") setTimeout(run, 300);
  else window.addEventListener("load", function () { setTimeout(run, 300); });
})();
