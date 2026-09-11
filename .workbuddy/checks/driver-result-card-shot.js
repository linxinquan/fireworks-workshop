// 结果卡专用截图驱动：等卡片浮出动画走完再打阶段标记
(function(){
  function run(){
    var cards = document.querySelectorAll("#rack .ing-card");
    cards[0].click(); cards[3].click(); cards[7].click();
    setTimeout(function(){
      document.getElementById("btnToMix").click();
      setTimeout(function(){
        var stage = document.getElementById("mixStage");
        var b = document.getElementById("bigBowl").getBoundingClientRect();
        var half = Math.max(76, b.width * 0.55), y = b.top + b.height / 2;
        function ev(t,x){ return new PointerEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:"touch",isPrimary:true,buttons:t==="pointerup"?0:1}); }
        var from = b.left + b.width/2 - half, to = b.left + b.width/2 + half;
        stage.dispatchEvent(ev("pointerdown", from));
        for(var i=1;i<=24;i++) stage.dispatchEvent(ev("pointermove", from + (to-from)*i/24));
        stage.dispatchEvent(ev("pointerup", to));
        setTimeout(function(){
          document.getElementById("btnToPack").click();
          setTimeout(function(){
            document.querySelectorAll(".pack-option")[1].click();
            document.getElementById("btnToLaunch").click();
            setTimeout(function(){
              document.getElementById("btnLaunch").click();
              // 卡片 ~3.5s 浮出，cardUp 动画 .4s → 4.1s 后再截图
              setTimeout(function(){ window.__phase = "result"; }, 4300);
              setTimeout(function(){
                var pre = document.createElement("pre");
                pre.id = "testReport";
                // 隐藏，避免这个诊断节点本身影响布局/合成
                pre.style.cssText = "display:none";
                pre.textContent = "@@BEGIN@@\nresult card shot\n@@END@@";
                document.body.appendChild(pre);
              }, 4900);
            }, 500);
          }, 500);
        }, 700);
      }, 700);
    }, 700);
  }
  if(document.readyState === "complete"){ setTimeout(run, 80); }
  else { window.addEventListener("load", function(){ setTimeout(run, 80); }); }
})();
