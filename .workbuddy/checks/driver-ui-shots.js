// UI screenshot driver — walks pick -> mix -> pack -> launch, pausing at each phase.
(function(){
  function phase(p){ setTimeout(function(){ window.__phase = p; }, 300); }
  function report(){
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = "@@BEGIN@@\nui shot run done\n@@END@@";
    document.body.appendChild(pre);
  }
  function drag(stage, from, to, steps){
    var r = stage.getBoundingClientRect();
    var y = r.top + r.height / 2;
    function ev(type, x){
      return new PointerEvent(type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 1, pointerType: "touch", isPrimary: true,
        buttons: type === "pointerup" ? 0 : 1
      });
    }
    stage.dispatchEvent(ev("pointerdown", from));
    for(var i = 1; i <= steps; i++){
      stage.dispatchEvent(ev("pointermove", from + (to - from) * i / steps));
    }
    stage.dispatchEvent(ev("pointerup", to));
  }
  function run(){
    var cards = document.querySelectorAll("#rack .ing-card");
    phase("ui-1a-pick-empty");
    setTimeout(function(){
      cards[0].click(); cards[3].click(); cards[7] && cards[7].click();
      phase("ui-1b-pick-selected");
      setTimeout(function(){
        document.getElementById("btnToMix").click();
        var stage = document.getElementById("mixStage");
        var bowl = document.getElementById("bigBowl");
        var br = bowl.getBoundingClientRect();
        var cx = br.left + br.width / 2;
        var half = Math.max(76, br.width * 0.55);
        drag(stage, cx - half, cx + half, 20);
        phase("ui-2-mix");
        setTimeout(function(){
          document.getElementById("btnToPack").click();
          setTimeout(function(){
            document.querySelectorAll(".pack-option")[1].click();
            phase("ui-3-pack");
            setTimeout(function(){
              // 预览"装填完成"状态（星体浮现）
              document.getElementById("packStage").classList.add("packed");
              phase("ui-3b-packed");
              setTimeout(function(){
                document.getElementById("packStage").classList.remove("packed");
                document.getElementById("btnToLaunch").click();
                setTimeout(function(){
                  phase("ui-4-launch");
                  setTimeout(report, 1500);
                }, 900);
              }, 800);
            }, 700);
          }, 500);
        }, 700);
      }, 900);
    }, 700);
  }
  if(document.readyState === "complete"){ setTimeout(run, 60); }
  else { window.addEventListener("load", function(){ setTimeout(run, 60); }); }
})();
