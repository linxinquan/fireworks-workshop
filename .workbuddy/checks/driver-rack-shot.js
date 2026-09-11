// 预览驱动：停在「选料」步，把 #rack 整块截出来，看 17px 下图标糊不糊
(function(){
  function run(){
    window.__phase = "rack";
    var pre = document.getElementById("testReport") || document.createElement("pre");
    pre.id = "testReport";
    pre.style.cssText = "display:none";
    pre.textContent = "@@BEGIN@@\nrack shot\n@@END@@";
    document.body.appendChild(pre);
  }
  if (document.readyState === "complete") { setTimeout(run, 600); }
  else { window.addEventListener("load", function(){ setTimeout(run, 600); }); }
})();
