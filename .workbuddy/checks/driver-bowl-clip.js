// 选料页碗的局部特写：空碗 → 投入 3 种原料
(function(){
  function phase(p){ setTimeout(function(){ window.__phase = p; }, 300); }
  function report(){
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = "@@BEGIN@@\nclip shot done\n@@END@@";
    document.body.appendChild(pre);
  }
  function run(){
    var cards = document.querySelectorAll("#rack .ing-card");
    phase("bowl-empty");
    setTimeout(function(){
      cards[0].click(); cards[3].click(); cards[7].click();
      phase("bowl-3");
      setTimeout(report, 900);
    }, 900);
  }
  if(document.readyState === "complete"){ setTimeout(run, 60); }
  else { window.addEventListener("load", function(){ setTimeout(run, 60); }); }
})();
