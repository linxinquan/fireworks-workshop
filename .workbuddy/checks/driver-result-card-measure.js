// 测量结果卡的几何：卡片是否溢出视口、内容是否被裁、ribbon 是否被 overflow 剪掉
(function(){
  var LOG = [];
  function out(k, v){ LOG.push(k + " = " + v); }
  window.addEventListener("error", function(e){ out("JSERROR", e.message); });
  function r(el){
    if(!el) return "null";
    var b = el.getBoundingClientRect();
    return "x" + Math.round(b.left) + " y" + Math.round(b.top) + " w" + Math.round(b.width) + " h" + Math.round(b.height)
      + " bot" + Math.round(b.bottom);
  }
  function run(){
    var cards = document.querySelectorAll("#rack .ing-card");
    cards[0].click(); cards[3].click(); cards[7].click();
    setTimeout(function(){
      document.getElementById("btnToMix").click();
      setTimeout(function(){
        var stage = document.getElementById("mixStage");
        var b = document.getElementById("bigBowl").getBoundingClientRect();
        var half = Math.max(76, b.width * 0.55);
        var y = b.top + b.height / 2;
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
              setTimeout(measure, 3600);
            }, 500);
          }, 500);
        }, 700);
      }, 700);
    }, 700);
  }
  function measure(){
    var card = document.getElementById("resultCard");
    var vv = window.visualViewport;
    out("viewport", window.innerWidth + "x" + window.innerHeight);
    out("visualViewport", vv ? Math.round(vv.width) + "x" + Math.round(vv.height) : "n/a");
    out("docScrollH", document.documentElement.scrollHeight + " clientH " + document.documentElement.clientHeight);
    var cs = getComputedStyle(card);
    out("card.hidden", card.hidden);
    out("card.computed", "maxH=" + cs.maxHeight + " overflowY=" + cs.overflowY + " overflowX=" + cs.overflowX + " bottom=" + cs.bottom + " pos=" + cs.position);
    out("card.rect", r(card));
    var body = card.querySelector(".card-body");
    out("body.rect", r(body));
    out("body.scroll", "scrollH=" + body.scrollHeight + " clientH=" + body.clientHeight + " 溢出行=" + (body.scrollHeight - body.clientHeight) + "px");
    out("body.computed", "overflowY=" + getComputedStyle(body).overflowY + " overflowX=" + getComputedStyle(body).overflowX);
    out("card.computed2", "overflow=" + cs.overflow + " display=" + cs.display + " maxH=" + cs.maxHeight);
    out("body可滚动", body.scrollHeight > body.clientHeight + 1);
    out("card最大内容高", card.scrollHeight + " vs clientH " + card.clientHeight);
    out("ribbon.rect", r(document.getElementById("rcRibbon")));
    out("name.rect", r(document.getElementById("rcName")));
    out("stats.rect", r(document.getElementById("rcStats")));
    out("note.rect", r(document.getElementById("rcNote")));
    out("actions.rect", r(document.querySelector("#resultCard .fx-actions")));
    out("ings.rect", r(document.getElementById("rcIngredients")));
    var cb = card.getBoundingClientRect();
    var ib = document.getElementById("rcIngredients").getBoundingClientRect();
    var rb = document.getElementById("rcRibbon").getBoundingClientRect();
    out("ings被卡底裁切", (ib.bottom > cb.bottom + 0.5) ? ("是，超出 " + Math.round(ib.bottom - cb.bottom) + "px") : "否");
    // ribbon 故意露出卡顶（top:-14px 跨边框），要检查的是「有没有被祖先/视口裁掉」
    var stage = document.getElementById("step-launch");
    var sb = stage.getBoundingClientRect();
    out("ribbon完整可见", (rb.top >= sb.top - 0.5 && rb.top >= -0.5 && rb.bottom <= window.innerHeight + 0.5) ? "是" : "否(被裁)");
    out("clipping祖先", (function(){ var e=card.parentElement, s=[]; while(e && e!==document.documentElement){ var o=getComputedStyle(e).overflow; if(o!=="visible") s.push((e.id||e.className)+":"+o); e=e.parentElement; } return s.length?s.join(" > "):"无"; })());
    out("卡顶是否贴视口顶", Math.round(cb.top));
    out("卡底是否贴视口底", Math.round(window.innerHeight - cb.bottom));
    out("横屏/矮屏是否还需滚动", (body.scrollHeight > body.clientHeight + 1) ? ("是，超出 " + (body.scrollHeight - body.clientHeight) + "px") : "否");
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = "@@BEGIN@@\n" + LOG.join("\n") + "\n@@END@@";
    // 等卡片浮出动画（cardUp .4s）走完再让 harness 截图，否则会拍到空帧
    setTimeout(function(){ window.__phase = "result"; document.body.appendChild(pre); }, 620);
  }
  if(document.readyState === "complete"){ setTimeout(run, 80); }
  else { window.addEventListener("load", function(){ setTimeout(run, 80); }); }
})();
