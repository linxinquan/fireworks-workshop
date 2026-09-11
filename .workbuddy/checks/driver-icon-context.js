// 拍图标出现的所有场景：选料卡 → 配方碗 → 炼金手札 → 搅拌清单 → 结果卡
(function(){
  function phase(p){ setTimeout(function(){ window.__phase = p; }, 320); }
  function report(){
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = "@@BEGIN@@\nicon context shots done\n@@END@@";
    document.body.appendChild(pre);
  }
  function drag(stage, from, to, steps){
    var r = stage.getBoundingClientRect(), y = r.top + r.height / 2;
    function ev(t, x){ return new PointerEvent(t, { bubbles:true, cancelable:true, clientX:x, clientY:y, pointerId:1, pointerType:"touch", isPrimary:true, buttons: t==="pointerup"?0:1 }); }
    stage.dispatchEvent(ev("pointerdown", from));
    for(var i=1;i<=steps;i++) stage.dispatchEvent(ev("pointermove", from + (to-from)*i/steps));
    stage.dispatchEvent(ev("pointerup", to));
  }
  function run(){
    var cards = document.querySelectorAll("#rack .ing-card");
    cards[0].click(); cards[3].click(); cards[7].click();
    phase("ic-1-pick");

    setTimeout(function(){
      document.getElementById("btnJournal").click();
      phase("ic-2-journal");
      setTimeout(function(){
        document.getElementById("journalClose").click();
        setTimeout(function(){
          document.getElementById("btnToMix").click();
          var stage = document.getElementById("mixStage");
          var b = document.getElementById("bigBowl").getBoundingClientRect();
          var half = Math.max(76, b.width * 0.55);
          drag(stage, b.left + b.width/2 - half, b.left + b.width/2 + half, 18);
          phase("ic-3-mix-list");
          setTimeout(function(){
            document.getElementById("btnToPack").click();
            setTimeout(function(){
              document.getElementById("btnToLaunch").click();
              setTimeout(function(){
                document.getElementById("btnLaunch").click();
                setTimeout(function(){
                  phase("ic-4-result");
                  setTimeout(report, 1200);
                }, 3200);
              }, 500);
            }, 500);
          }, 800);
        }, 400);
      }, 900);
    }, 900);
  }
  if(document.readyState === "complete"){ setTimeout(run, 80); }
  else { window.addEventListener("load", function(){ setTimeout(run, 80); }); }
})();
