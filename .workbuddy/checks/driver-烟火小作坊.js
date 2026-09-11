// E2E driver for 烟火小作坊.html (injected into a temp copy, never into the deliverable)
(function(){
  var LOG = [];
  function out(k, v){ LOG.push(k + " = " + v); }
  function fail(m){ out("FAIL", m); report(); }
  function phase(p){ window.__phase = p; }
  var fxArcs = [], skyTicks = 0;

  window.addEventListener("error", function(e){ out("JSERROR", e.message); });

  function patchCanvas(){
    var proto = CanvasRenderingContext2D.prototype;
    if(proto.__patched){ return; }
    proto.__patched = true;
    var origArc = proto.arc, origFill = proto.fillRect;
    proto.arc = function(x, y, r){
      if(this.canvas && this.canvas.id === "fxCanvas"){ fxArcs.push([Math.round(x), Math.round(y)]); }
      return origArc.apply(this, arguments);
    };
    proto.fillRect = function(){
      if(this.canvas && this.canvas.id === "sky"){ skyTicks++; }
      return origFill.apply(this, arguments);
    };
  }

  // simulate a horizontal stir gesture on the mixing stage
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

  function report(){
    var pre = document.createElement("pre");
    pre.id = "testReport";
    pre.textContent = "\n@@" + "BEGIN@@\n" + LOG.join("\n") + "\n@@" + "END@@\n";
    document.body.appendChild(pre);
  }

  function run(){
    try{
      patchCanvas();
      out("innerSize", window.innerWidth + "x" + window.innerHeight);
      out("dpr", window.devicePixelRatio);
      var sky = document.getElementById("sky");
      out("skyCanvas", sky.width + "x" + sky.height);
      var cards = document.querySelectorAll("#rack .ing-card");
      out("ingCardCount", cards.length);
      phase("pick");
      cards[0].click();            // 硝酸钾 (base)
      cards[3].click();            // 锶盐 (color)
      out("bowlCount", document.getElementById("bowlCount").textContent);
      var b2m = document.getElementById("btnToMix");
      out("pick_btnToMixDisabled", b2m.disabled);
      b2m.click();
      phase("mix-start");
      setTimeout(mixStep, 150);
    }catch(e){ fail(e.message); }
  }

  function mixStep(){
    try{
      var stage = document.getElementById("mixStage");
      var bowl = document.getElementById("bigBowl");
      var br = bowl.getBoundingClientRect();
      var cx = br.left + br.width / 2;
      var half = Math.max(76, br.width * 0.55);
      out("bowlSize", Math.round(br.width) + "x" + Math.round(br.height) + " half=" + Math.round(half));
      var b2p = document.getElementById("btnToPack");
      out("mixStart_pct", document.getElementById("mixPct").textContent);
      out("mixStart_disabled", b2p.disabled);

      // A) 20 cycles of tiny wiggle (+-0.2 of half) -> must earn nothing
      var i;
      phase("mix-wiggle");
      for(i = 0; i < 20; i++){
        drag(stage, cx - half * 0.2, cx + half * 0.2, 6);
        drag(stage, cx + half * 0.2, cx - half * 0.2, 6);
      }
      out("afterWiggle_pct", document.getElementById("mixPct").textContent);
      out("afterWiggle_disabled", b2p.disabled);

      // B) one short sweep only -> low heat, must be allowed through (P1-3)
      phase("mix-low");
      drag(stage, cx - half * 0.5, cx + half * 0.5, 12);
      out("lowHeat_pct", document.getElementById("mixPct").textContent);
      out("lowHeat_disabled", b2p.disabled);
      out("lowHeat_status", document.getElementById("mixStatus").textContent);

      // C) up into the sweet zone
      phase("mix-sweet");
      drag(stage, cx + half * 0.5, cx - half * 0.95, 16);
      drag(stage, cx - half * 0.95, cx + half * 0.95, 24);
      drag(stage, cx + half * 0.95, cx - half * 0.95, 24);
      out("sweet_pct", document.getElementById("mixPct").textContent);
      out("sweet_disabled", b2p.disabled);
      out("sweet_status", document.getElementById("mixStatus").textContent);
      out("sweet_note", document.getElementById("mixNote").textContent.slice(0, 20));
      out("spoonTransform", document.getElementById("spoon").style.transform);
      out("mixZoneTransform", document.getElementById("mixZone").style.transform);

      // D) keep stirring -> over mixed / mystery
      phase("mix-over");
      for(i = 0; i < 3; i++){
        drag(stage, cx - half * 0.95, cx + half * 0.95, 24);
        drag(stage, cx + half * 0.95, cx - half * 0.95, 24);
      }
      out("over_pct", document.getElementById("mixPct").textContent);
      out("over_disabled", b2p.disabled);
      out("over_status", document.getElementById("mixStatus").textContent);
      out("over_note", document.getElementById("mixNote").textContent.slice(0, 20));
      out("ringStroke", document.getElementById("ringFg").style.stroke);

      setTimeout(function(){ b2p.click(); setTimeout(packStep, 220); }, 850);
    }catch(e){ fail(e.message); }
  }

  function packStep(){
    try{
      phase("pack");
      document.querySelectorAll(".pack-option")[2].click();   // 紧压
      out("packSelected", document.querySelectorAll(".pack-option.sel")[0].textContent.slice(0, 6));
      document.getElementById("btnToLaunch").click();
      setTimeout(launchStep, 1000);
    }catch(e){ fail(e.message); }
  }

  function launchStep(){
    try{
      out("launchHint", document.getElementById("launchHint").textContent);
      out("skyTicksBeforeFire", skyTicks);
      window.__skyBefore = skyTicks;
      fxArcs.length = 0;
      phase("launch-hint");
      document.getElementById("btnLaunch").click();
      phase("firing");
      setTimeout(pollResult, 400);
    }catch(e){ fail(e.message); }
  }

  function pollResult(){
    var waited = 0;
    (function tick(){
      waited += 250;
      var card = document.getElementById("resultCard");
      if(!card.hidden || waited > 9000){ setTimeout(checkBurst, 1000); return; }
      setTimeout(tick, 250);
    })();
  }

  function checkBurst(){
    try{
      phase("done");
      var fx = document.getElementById("fxCanvas");
      var t = fx.getContext("2d").getTransform();
      out("fxCanvas", fx.width + "x" + fx.height);
      out("fxTransform", "a=" + t.a + " d=" + t.d);
      out("fxDisplayAfter", fx.style.display);
      out("skyTicksAfterFire", skyTicks + " (delta=" + (skyTicks - window.__skyBefore) + ")");
      out("fxArcCount", fxArcs.length);
      var xs = fxArcs.map(function(a){ return a[0]; }).sort(function(a, b){ return a - b; });
      var ys = fxArcs.map(function(a){ return a[1]; }).sort(function(a, b){ return a - b; });
      if(xs.length){
        out("fxArcX", "min=" + xs[0] + " mid=" + xs[Math.floor(xs.length / 2)] + " max=" + xs[xs.length - 1] + " expect_mid=" + Math.round(window.innerWidth / 2));
        out("fxArcY", "min=" + ys[0] + " mid=" + ys[Math.floor(ys.length / 2)] + " max=" + ys[ys.length - 1]);
      }
      var card = document.getElementById("resultCard");
      out("resultHidden", card.hidden);
      out("resultRibbon", document.getElementById("rcRibbon").textContent);
      out("resultName", document.getElementById("rcName").textContent);
      out("resultStats", document.getElementById("rcStats").textContent);
      out("resultNote", document.getElementById("rcNote").textContent.slice(0, 34));
      out("initErrorBanner", document.querySelectorAll('div[style*="3a1010"]').length);
      report();
    }catch(e){ fail(e.message); }
  }

  if(document.readyState === "complete"){ setTimeout(run, 40); }
  else { window.addEventListener("load", function(){ setTimeout(run, 40); }); }
})();
