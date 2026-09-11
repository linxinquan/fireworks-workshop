// 图标图集校验驱动：确认 16 个 symbol / 16 条渐变都注册，且每个 <use> 都真的画出了图形
(function(){
  function run(){
    window.__phase = "atlas";   // 让 harness 先抓一张整图再收报告
    var uses = [].slice.call(document.querySelectorAll("use"));
    var bad = [];
    uses.forEach(function(u){
      var b = u.getBBox();
      if (!(b.width > 10 && b.height > 10)) {
        bad.push((u.getAttribute("href") || u.getAttribute("xlink:href")) +
          ":" + Math.round(b.width) + "x" + Math.round(b.height));
      }
    });
    var pre = document.getElementById("testReport") || document.createElement("pre");
    pre.id = "testReport";
    pre.style.cssText = "display:none";
    pre.textContent = "@@BEGIN@@\n" +
      "symbols=" + document.querySelectorAll("symbol").length + "\n" +
      "gradients=" + document.querySelectorAll("linearGradient").length + "\n" +
      "uses=" + uses.length + "\n" +
      "bad_bbox=" + (bad.length ? bad.join(",") : "0") + "\n" +
      "@@END@@";
    document.body.appendChild(pre);
  }
  if (document.readyState === "complete") { setTimeout(run, 300); }
  else { window.addEventListener("load", function(){ setTimeout(run, 300); }); }
})();
