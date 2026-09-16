(function(){
  "use strict";
  try{

  /* ============ 能力检测：Flex gap ============
     Chrome 61 的 Flexbox 不支持 gap（仅 Grid 支持）。语法检测
     （CSS.supports / @supports）无法证明 gap 在 Flex 中真的生效，
     因此按 css-compatibility.md 做真实布局行为检测：创建一个
     display:flex 探针，看两个子项之间是否产生了间距。
     支持时给 <html> 加 supports-flex-gap，CSS 切换到 gap 增强层；
     不支持则保留 CSS 中的 margin 基线，布局依然正确。 */
  function detectFlexGap(){
    try{
      var probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "0";
      probe.style.display = "flex";
      probe.style.flexDirection = "column";
      probe.style.rowGap = "10px";
      probe.appendChild(document.createElement("div"));
      probe.appendChild(document.createElement("div"));
      document.body.appendChild(probe);
      // 两个空 div 高度为 0：行 gap 生效时 scrollHeight 应为 10
      var supported = probe.scrollHeight === 10;
      document.body.removeChild(probe);
      if(supported){
        document.documentElement.className +=
          (document.documentElement.className ? " " : "") + "supports-flex-gap";
      }
    }catch(e){ /* 检测失败不阻塞主流程，退回 margin 基线 */ }
  }

  /* ============ 数据：原料库 ============ */
  var INGREDIENTS = [
    {id:"saltpeter", name:"硝酸钾", type:"base", real:true, desc:"氧化剂 · 让配方真正烧起来", color:"#f5e9c8", fact:"氧化剂：为燃烧提供氧气。没有它，混合物根本点不着。", power:1},
    {id:"sulfur", name:"硫磺", type:"base", real:true, desc:"燃料 · 爆裂与声响", color:"#ffd166", fact:"燃料：与氧化剂剧烈反应，放出热与气体，产生升空和爆裂的推力。", power:1, sound:true},
    {id:"charcoal", name:"木炭粉", type:"base", real:true, desc:"燃料 · 金色火花", color:"#f4a261", fact:"黑火药三大件之一（硝酸钾+硫磺+木炭），决定燃烧速度。", power:.8},
    {id:"strontium", name:"锶盐", type:"color", real:true, desc:"焰色反应 · 正红色", color:"#ff5d6c", fact:"锶盐燃烧发出喜庆正红（约 605–680nm），是烟花的经典红。", rarity:2},
    {id:"barium", name:"钡盐", type:"color", real:true, desc:"焰色反应 · 翠绿色", color:"#51d88a", fact:"钡盐燃烧呈翠绿（约 505–535nm），春意盎然的绿。", rarity:2},
    {id:"copper", name:"铜盐", type:"color", real:true, desc:"焰色反应 · 梦幻蓝", color:"#4cc9f0", fact:"蓝色最难做：铜盐需要极窄的燃烧温度窗口，偏差一点就变绿或发白。", rarity:3, fragile:true},
    {id:"sodium", name:"钠盐", type:"color", real:true, desc:"焰色反应 · 金黄", color:"#ffd60a", fact:"钠盐燃烧呈金黄（589nm），过于明亮，配方里常要控制用量，否则会盖住别的颜色。", rarity:2, loud:true},
    {id:"aluminum", name:"铝粉", type:"spark", real:true, desc:"闪光 · 银白星芒", color:"#ffffff", fact:"铝粉/镁粉燃烧产生银白色闪光与拖尾，是烟花的“银花”。", rarity:2, effect:"sparkle"},
    {id:"moonpetal", name:"月光花瓣", type:"shape", real:false, shape:"willow", color:"#cfe3ff", desc:"魔法 · 垂柳拖尾", fact:"想象原料：采自月圆之夜的昙花，能让星体缓缓垂落成柳条。", rarity:2, effect:"trail"},
    {id:"dragonscale", name:"龙鳞粉", type:"shape", real:false, shape:"double", color:"#ffb703", desc:"魔法 · 二次绽放", fact:"想象原料：研磨自龙蜕下的鳞片，点火时会有第二重惊喜。", rarity:3, effect:"double"},
    {id:"phoenix", name:"凤羽灰", type:"shape", real:false, shape:"star", color:"#ff7b00", desc:"魔法 · 星形绽放", fact:"想象原料：凤凰落羽烧成的灰，能在空中画出星星。", rarity:3, effect:"crackle"},
    {id:"unicorn", name:"独角兽鬃毛", type:"shape", real:false, shape:"rainbow", color:"#e0aaff", desc:"魔法 · 彩虹变色", fact:"想象原料：剪自独角兽的鬃毛，让烟花在空中不断变色。", rarity:4, effect:"rainbow"},
    {id:"stardust", name:"星尘", type:"shape", real:false, shape:"ring", color:"#fff1a8", desc:"魔法 · 光环绽放", fact:"想象原料：陨星坠落时蹭落的尘埃，会聚成一圈光晕。", rarity:4, effect:"glitter"},
    {id:"fairytear", name:"妖精之泪", type:"shape", real:false, shape:"comet", color:"#a78bfa", desc:"魔法 · 流星尾迹", fact:"想象原料：妖精哭过的眼泪，会拖出长长的蓝色尾迹。", rarity:4, effect:"trail2"},
    {id:"thunderbird", name:"雷鸟羽毛", type:"shape", real:false, shape:"chrys", color:"#b388ff", desc:"魔法 · 雷鸣菊花", fact:"想象原料：雷鸟的翎羽，爆裂时伴有雷鸣与细密银丝。", rarity:4, effect:"thunder"},
    {id:"shadowcat", name:"影猫皮毛", type:"shape", real:false, shape:"mystery", color:"#8d99ae", desc:"魔法 · 神秘双爆", fact:"想象原料：午夜影猫换下的毛，结果连老师傅也说不准。", rarity:5, effect:"mystery"}
  ];
  var BY_ID = {};
  INGREDIENTS.forEach(function(ing){ BY_ID[ing.id] = ing; });

  var TYPE_LABEL = {base:"基础药", color:"着色剂", spark:"着色剂", shape:"花型剂"};
  var TYPE_CLASS = {base:"real", color:"real", spark:"real", shape:"magic"};
  /* 分类归并：基础药 / 着色剂(着色+闪光) / 花型剂，共 3 类，用于 UI 配色区分；
     注意 spark 在配方解析里仍用于闪光效果，这里仅做视觉归并，不改数据 type */
  function catOf(ing){
    if(ing.type==="base") return "base";
    if(ing.type==="shape") return "shape";
    return "color"; // color 与 spark 统一归入「着色剂」
  }

  /* ============ 原料图标 ============
     图标本体是文档里的 <symbol id="ic-<原料id>">（见 HTML 的「原料图标集」），
     这里只负责拼 <use>。cls 用来给不同场景定尺寸（.r-ico / .j-ico …）。 */
  function ingIcon(id, cls){
    return '<svg class="ico'+(cls?' '+cls:'')+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#ic-'+id+'"/></svg>';
  }

  var SHAPE_NAME = {peony:"牡丹", willow:"垂柳", chrys:"菊花", ring:"光环", star:"星绽", double:"双子", comet:"彗星", rainbow:"虹", mystery:"谜团", flower:"花瓣"};
  var COLOR_NAME = {red:"赤", green:"翠", blue:"蓝", gold:"金", purple:"紫", white:"月白", rainbow:"彩"};

  /* ============ 图鉴：收集定义 ============
     分组：shape 花型 / color 主色 / hidden 隐藏成就。
     仅当一次燃放「成功触发」对应条件时才解锁并记录。
     持久化在 localStorage，key 见 ACH_KEY。 */
  var ACH_KEY = "fw_workshop_achievements_v1";

  var ACH_GROUPS = [
    { id:"shape", title:"花型图鉴", desc:"用花型剂做出对应的绽放形态。" },
    { id:"color", title:"颜色图鉴", desc:"让烟火的主色调命中对应颜色。" },
    { id:"hidden", title:"隐藏成就", desc:"一些需要特定条件才会出现的结果。" }
  ];

  var ACHIEVEMENTS = [
    /* —— 花型 —— */
    { id:"shape_peony",  group:"shape", name:"牡丹",  ico:"🎆", style:"peony",   hint:"加入任意花型剂之外的基础配方（默认形态）" },
    { id:"shape_willow", group:"shape", name:"垂柳",  ico:"🌿", style:"willow",  hint:"用月光花瓣，让星体缓缓垂落" },
    { id:"shape_chrys",  group:"shape", name:"菊花",  ico:"🌼", style:"chrys",   hint:"用雷鸟羽毛炸出细密银丝" },
    { id:"shape_ring",   group:"shape", name:"光环",  ico:"💫", style:"ring",    hint:"用星尘聚成一圈光晕" },
    { id:"shape_star",   group:"shape", name:"星绽",  ico:"⭐", style:"star",    hint:"用凤羽灰在空中画出星星" },
    { id:"shape_double", group:"shape", name:"双子",  ico:"✨", style:"double",  hint:"用龙鳞粉触发第二重惊喜" },
    { id:"shape_comet",  group:"shape", name:"彗星",  ico:"☄️", style:"comet",   hint:"用妖精之泪拖出长长的尾迹" },
    { id:"shape_rainbow",group:"shape", name:"虹",    ico:"🌈", style:"rainbow", hint:"用独角兽鬃毛让烟火不断变色" },
    { id:"shape_mystery",group:"shape", name:"谜团",  ico:"🌀", style:"mystery", hint:"用影猫皮毛，或把搅拌进度推过 90%" },
    { id:"shape_flower", group:"shape", name:"花瓣",  ico:"🌸", style:"flower",  hint:"谜团里才会偶尔出现的形态" },

    /* —— 颜色（对应公式里 colorName 的全部可能取值） —— */
    { id:"color_red",    group:"color", name:"赤",   ico:"🔴", colorName:"red",    hint:"用锶盐调出正红" },
    { id:"color_green",  group:"color", name:"翠",   ico:"🟢", colorName:"green",  hint:"用钡盐调出翠绿（或铜盐搅拌不足翻车）" },
    { id:"color_blue",   group:"color", name:"蓝",   ico:"🔵", colorName:"blue",   hint:"搅拌充足时用铜盐成功烧出蓝色" },
    { id:"color_gold",   group:"color", name:"金",   ico:"🟡", colorName:"gold",   hint:"用钠盐（或不加着色剂）的金白火花" },
    { id:"color_rainbow",group:"color", name:"彩",   ico:"🟣", colorName:"rainbow",hint:"用独角兽鬃毛做出彩虹变色" },
    { id:"color_mystery",group:"color", name:"神秘", ico:"🌀", colorName:"mystery",hint:"把搅拌进度推过 90%，主色会变成神秘" },

    /* —— 隐藏成就 —— */
    { id:"hd_dud",      group:"hidden", name:"哑火的小爆竹", ico:"💨", hint:"不放任何基础药，看看会发生什么" },
    { id:"hd_copper_fail", group:"hidden", name:"铜盐翻车",   ico:"🧪", hint:"搅拌不足时用铜盐——蓝会变成绿白" },
    { id:"hd_sodium_cover",group:"hidden", name:"金光盖色",   ico:"🌟", hint:"放入钠盐，让金光盖住所有颜色" },
    { id:"hd_tight_double",group:"hidden", name:"紧压二重爆", ico:"🪨", hint:"紧压装填，有概率触发隐藏的二次绽放" },
    { id:"hd_overmix",  group:"hidden", name:"失控的猛药",    ico:"💥", hint:"把搅拌进度推过 90%，让效果失控" },
    { id:"hd_no_color", group:"hidden", name:"纯火药的浪漫",  ico:"🔥", hint:"不加任何着色剂，只用燃料燃烧的金白色" },
    { id:"hd_four",     group:"hidden", name:"满载配方",      ico:"🧰", hint:"一次配方用满 4 个原料" },
    { id:"hd_rainbow_kill", group:"hidden", name:"虹彩猎手",  ico:"🎯", hint:"一次用满 4 个原料，并且做出彩虹变色" }
  ];

  /* ============ 状态 ============ */
  var state = {
    step: 1,
    selected: [],          // 原料 id 数组
    dropId: null,          // 刚投入碗中的原料 id（触发投料动画）
    mix: 0,                // 搅拌进度：按左右拖动行程折算的累计分（0~150，进度 = mix/150×100%）
    mixing: false,
    lastT: 0,              // 上一次指针的归一化横向位置（-1 左端 … 1 右端）
    strokeStart: 0,        // 当前这一程的起点位置
    moveDir: 0,            // 当前拖动方向：1 向右 / -1 向左 / 0 未开始
    pack: "mid",
    packed: false,
    recipe: null,          // 解析后的配方
    launched: false,
    continuous: false,     // 沉浸连放模式：触发后结果卡不再弹出
    freeMode: false,       // 自由连放：点击屏幕任意位置即从桶口放一枚
    soundOn: true
  };
  var mixGeom = {center: 0, half: 120};

  /* ============ DOM 引用 ============ */
  var $ = function(id){ return document.getElementById(id); };
  var rackEl = $("rack"), bowlMix = $("bowlMix"), bowlCount = $("bowlCount"), bowlHint = $("bowlHint");
  var bowlEl = document.querySelector(".bowl-panel .bowl");
  var pickNote = $("pickNote"), btnToMix = $("btnToMix");
  var mixStage = $("mixStage"), spoon = $("spoon"), bigBowl = $("bigBowl"), mixZone = $("mixZone");
  var progFill = $("progFill"), mixPct = $("mixPct"), mixStatus = $("mixStatus"), mixRecipe = $("mixRecipe"), mixNote = $("mixNote"), btnToPack = $("btnToPack");
  var packStage = $("packStage"), packNote = $("packNote");
  var launchStage = $("step-launch"), launchHint = $("launchHint");
  var resultCard = $("resultCard");
  var peekBtn = $("btnPeek");
  // 沉浸连放时，结果卡收起后显示「查看本次效果」按钮；点开结果卡时隐藏。
  // 该按钮现在是控制条内的普通按钮，用 hidden 控制显隐（不占位）。
  function updatePeek(){
    if(!peekBtn) return;
    peekBtn.hidden = !(state.continuous && resultCard.hidden);
  }
  var stepsEls = Array.prototype.slice.call(document.querySelectorAll(".steps li[data-step]"));
  var scenes = {1:$("step-pick"), 2:$("step-mix"), 3:$("step-pack"), 4:$("step-launch")};

  /* ============ 音效（WebAudio 合成） ============ */
  var AC = null, noiseBuf = null;
  function ensureAudio(){
    if(!AC){
      try{
        AC = new (window.AudioContext || window.webkitAudioContext)();
        var len = AC.sampleRate * 1;
        noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for(var i=0;i<len;i++){ d[i] = Math.random()*2-1; }
      }catch(e){ AC = null; }
    }
    if(AC && AC.state === "suspended"){ AC.resume().catch(function(){}); }
  }
  function playNoise(dur, freq, type, vol, slideTo){
    if(!AC || !state.soundOn) return;
    var src = AC.createBufferSource();
    src.buffer = noiseBuf;
    var filter = AC.createBiquadFilter();
    filter.type = type || "bandpass";
    filter.frequency.setValueAtTime(freq, AC.currentTime);
    if(slideTo){ filter.frequency.exponentialRampToValueAtTime(slideTo, AC.currentTime + dur); }
    filter.Q.value = 0.8;
    var g = AC.createGain();
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    src.connect(filter); filter.connect(g); g.connect(AC.destination);
    src.start(); src.stop(AC.currentTime + dur + 0.05);
  }
  function playWhistle(dur){
    if(!AC || !state.soundOn) return;
    var o = AC.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(300, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, AC.currentTime + dur*0.7);
    var g = AC.createGain();
    g.gain.setValueAtTime(0.12, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.02, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur + 0.05);
  }
  function playBoom(big){
    if(!AC || !state.soundOn) return;
    playNoise(big?0.9:0.55, big?180:240, "lowpass", big?0.5:0.35, 60);
    playNoise(big?0.4:0.25, 900, "bandpass", 0.18, 200);
  }
  function playPop(){ if(AC && state.soundOn){ playNoise(0.08, 1800, "highpass", 0.12); } }
  function playFizz(){ if(AC && state.soundOn){ playNoise(0.7, 1200, "highpass", 0.2, 300); } }
  function playStirTick(){ if(AC && state.soundOn){ playNoise(0.04, 2400, "highpass", 0.05); } }
  // 手机端轻震动反馈（不支持的浏览器静默跳过）
  function haptic(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

  /* ============ 视口 · 设备档位（手机端优先） ============
     两张画布（星空 sky / 烟花 fx）统一约定：backing store = CSS 尺寸 × DPR，
     并统一 setTransform(DPR,...) —— 之后所有绘制坐标一律是 CSS 像素。
     这样爆炸原点、粒子大小在 1x/2x/3x 屏上完全一致。 */
  var vw = 0, vh = 0, DPR = 1, SCALE = 1, TIER = null;
  function readViewport(){
    vw = window.innerWidth;
    vh = window.innerHeight;
    // 手机端把 DPR 压到 2 以内：3x 屏的整屏重绘是最大的掉帧来源
    DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    var small = Math.min(vw, vh) <= 640;
    TIER = small
      ? {maxParticles: 460, maxStars: 96, skyFps: 30}
      : {maxParticles: 820, maxStars: 160, skyFps: 60};
    // 粒子速度/重力按屏幕尺寸缩放，小屏上烟花比例才不会被撑爆
    SCALE = Math.max(0.6, Math.min(1.15, Math.min(vw, vh) / 900));
  }
  readViewport();

  /* ============ 星空背景 ============ */
  var sky = $("sky"), skyCtx = sky.getContext("2d");
  var stars = [];
  var skyTopColor = "#070b22";
  try{
    skyTopColor = (getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg-0") || "").trim() || skyTopColor;
  }catch(e){}
  function sizeSkyCanvas(){
    sky.width = Math.round(vw * DPR);
    sky.height = Math.round(vh * DPR);
    sky.style.width = vw + "px";
    sky.style.height = vh + "px";
    skyCtx.setTransform(DPR,0,0,DPR,0,0);
  }
  function seedStars(){
    stars = [];
    var count = Math.min(TIER.maxStars, Math.max(40, Math.round(vw*vh/3200)));
    for(var i=0;i<count;i++){
      stars.push({
        x: Math.random()*vw,
        y: Math.random()*vh*0.82,
        r: Math.random()*1.4+0.4,
        base: 0.35 + Math.random()*0.5,
        phase: Math.random()*Math.PI*2,
        speed: 0.4 + Math.random()*1.2
      });
    }
  }
  function initSky(){ sizeSkyCanvas(); seedStars(); }
  function drawSky(t){
    var W = vw, H = vh;
    var g = skyCtx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, skyTopColor);
    g.addColorStop(0.55, "#101a45");
    g.addColorStop(1, "#1b2a63");
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0,0,W,H);
    // 月亮
    var mx = W*0.82, my = H*0.16, mr = Math.min(W,H)*0.055;
    skyCtx.save();
    skyCtx.shadowColor = "rgba(255,240,200,.5)";
    skyCtx.shadowBlur = 30;
    skyCtx.fillStyle = "#ffe9b8";
    skyCtx.beginPath(); skyCtx.arc(mx,my,mr,0,Math.PI*2); skyCtx.fill();
    skyCtx.restore();
    // 月亮上的环形山
    skyCtx.fillStyle = "rgba(200,160,90,.35)";
    skyCtx.beginPath(); skyCtx.arc(mx-mr*0.3,my-mr*0.2,mr*0.2,0,Math.PI*2); skyCtx.fill();
    skyCtx.beginPath(); skyCtx.arc(mx+mr*0.35,my+mr*0.25,mr*0.13,0,Math.PI*2); skyCtx.fill();
    // 星星
    for(var i=0;i<stars.length;i++){
      var s = stars[i];
      var a = s.base + Math.sin(t*0.001*s.speed + s.phase)*0.25;
      skyCtx.globalAlpha = Math.max(0.05, a);
      skyCtx.fillStyle = "#fff";
      skyCtx.beginPath(); skyCtx.arc(s.x,s.y,s.r,0,Math.PI*2); skyCtx.fill();
      if(s.r > 1.6){
        skyCtx.globalAlpha = Math.max(0.05, a*0.6);
        skyCtx.fillRect(s.x-s.r*2.4, s.y-0.5, s.r*4.8, 1);
        skyCtx.fillRect(s.x-0.5, s.y-s.r*2.4, 1, s.r*4.8);
      }
    }
    skyCtx.globalAlpha = 1;
  }
  // 星空循环：必须无条件自注册，否则放过一次烟花后 fxRunning 一恢复就再也没人重启它
  var skyLastT = -1;
  function skyLoop(t){
    var gap = 1000 / TIER.skyFps;
    if(!fxRunning && (skyLastT < 0 || t - skyLastT >= gap - 1)){
      skyLastT = t;
      drawSky(t);
    }
    requestAnimationFrame(skyLoop);
  }

  /* ============ 烟花粒子系统 ============ */
  var fx = document.createElement("canvas");
  fx.id = "fxCanvas";
  fx.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;display:none;";
  document.body.appendChild(fx);
  var fctx = fx.getContext("2d");

  var particles = [];
  var delayed = [];       // {t, fn}
  var shells = [];        // 升空弹体
  var fxRunning = false;
  var fxT = 0;
  var animId = null;
  var lastFrameT = 0;
  var reducedMotion = false;
  try{ reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}

  function resizeFx(){
    readViewport();
    fx.width = Math.round(vw * DPR);
    fx.height = Math.round(vh * DPR);
    fx.style.width = vw + "px";
    fx.style.height = vh + "px";
    fctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function Particle(x,y,vx,vy,color,life,size,opts){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.life=life; this.maxLife=life;
    this.color=color; this.size=size;
    this.trail=opts.trail||0;
    this.gravity=opts.gravity||0;
    this.drag=opts.drag||0.985;
    this.flicker=!!opts.flicker;
    this.hueShift=opts.hueShift||0;
    this.hueSpeed=opts.hueSpeed||0;
    this.rainbow=!!opts.rainbow;
    this.baseHue=opts.baseHue!==undefined?opts.baseHue:0;
    this.sparkle=!!opts.sparkle;
    this.flash=!!opts.flash;
    this.history=[];
  }
  Particle.prototype.update = function(dt){
    this.history.push({x:this.x,y:this.y});
    var max = Math.max(1, Math.round(this.trail));
    if(this.history.length>max){ this.history.shift(); }
    this.vy += this.gravity*dt;
    this.vx *= Math.pow(this.drag, dt*60);
    this.vy *= Math.pow(this.drag, dt*60);
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    this.life -= dt;
  };
  Particle.prototype.draw = function(ctx){
    if(this.life<=0) return;
    var p = Math.max(0, Math.min(1, this.life/this.maxLife));
    // 冒烟粒子（哑火用）：灰色渐隐
    if(this.drawSmoke){
      ctx.globalAlpha = p*0.55;
      ctx.fillStyle = "#b9bcc7";
      ctx.beginPath(); ctx.arc(this.x,this.y,this.size*(1.2-p*0.6),0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    var color = this.color;
    if(this.rainbow){
      var h = (this.baseHue + (1-p)*360*this.hueSpeed) % 360;
      color = "hsl("+h+",92%,66%)";
    } else if(this.hueShift){
      var h2 = (this.baseHue + this.hueShift*(1-p)) % 360;
      color = "hsl("+h2+",92%,66%)";
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // 爆炸瞬间闪光：径向光晕
    if(this.flash){
      var fr = this.size * (1.5 - p*0.9);
      if(fr>0){
        ctx.globalAlpha = p*0.9;
        var fg = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,Math.max(1,fr));
        fg.addColorStop(0, color);
        fg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(this.x,this.y,Math.max(1,fr),0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
      return;
    }
    // 光带拖尾：沿历史轨迹画发光折线，越靠近头部越亮越粗
    var sz = this.size;
    if(this.flicker){ sz *= 0.75 + Math.random()*0.5; }
    var hist = this.history;
    var hl = hist.length;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if(hl >= 2){
      var seg = Math.min(hl, Math.max(2, Math.round(this.trail)));
      var start = hl - seg;
      ctx.beginPath();
      ctx.moveTo(hist[start].x, hist[start].y);
      for(var i=start+1;i<hl;i++){ ctx.lineTo(hist[i].x, hist[i].y); }
      ctx.strokeStyle = color;
      ctx.globalAlpha = p*0.45;
      ctx.lineWidth = Math.max(0.5, sz*0.55);
      ctx.stroke();
      // 头部段更亮更粗
      var mid = Math.floor((start+hl)/2);
      ctx.beginPath();
      ctx.moveTo(hist[mid].x, hist[mid].y);
      for(var j=mid+1;j<hl;j++){ ctx.lineTo(hist[j].x, hist[j].y); }
      ctx.globalAlpha = p*0.8;
      ctx.lineWidth = Math.max(0.5, sz*1.0);
      ctx.stroke();
    }
    // 主体
    ctx.globalAlpha = p;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(this.x,this.y,sz,0,Math.PI*2); ctx.fill();
    // 亮白核
    ctx.globalAlpha = p*0.85;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.beginPath(); ctx.arc(this.x,this.y,Math.max(0.5, sz*0.45),0,Math.PI*2); ctx.fill();
    // 精致十字闪光
    if(this.sparkle && Math.random() < 0.035){
      var l = sz*3.4 + Math.random()*2;
      ctx.globalAlpha = p*0.85;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(this.x-l,this.y); ctx.lineTo(this.x+l,this.y);
      ctx.moveTo(this.x,this.y-l); ctx.lineTo(this.x,this.y+l);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  function Shell(x,y,targetY,color,spec,targetX){
    this.x=x; this.y=y; this.targetY=targetY;
    this.color=color; this.spec=spec;
    this.t=0; this.dur=0.75+Math.random()*0.25;
    var dy = y-targetY;
    this.vy = -dy/this.dur;
    if(targetX !== undefined && targetX !== null){
      // 自由连放：弹体在飞行时间内水平飞到目标点
      this.vx = (targetX - x)/this.dur;
    } else {
      this.vx = (Math.random()-0.5)*30;
    }
    this.trail=[];
  }
  Shell.prototype.update = function(dt){
    this.t += dt;
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>14){ this.trail.shift(); }
    this.x += this.vx*dt;
    this.y += this.vy*dt;
  };
  Shell.prototype.draw = function(ctx){
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    // 升空光带
    if(this.trail.length>1){
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x,this.trail[0].y);
      for(var i=1;i<this.trail.length;i++){ ctx.lineTo(this.trail[i].x,this.trail[i].y); }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    // 弹头亮核与光晕
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(this.x,this.y,2.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.arc(this.x,this.y,4.5,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(this.x,this.y,9,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  function spawnBurst(x,y,style,colors,cfg){
    // 手机端给粒子数设上限：同时存活超过档位预算就不再补充，避免掉帧
    var budget = TIER.maxParticles - particles.length;
    if(budget <= 4){ return; }
    var count = Math.min(cfg.count, Math.max(24, budget - 3));
    var speed = cfg.speed, gravity = cfg.gravity||0;
    var trail = cfg.trail||6, flicker = !!cfg.flicker, sparkle = !!cfg.sparkle;
    var size = cfg.size||1.8;
    var i, ang, sp;
    // 爆炸瞬间闪光：径向光晕
    if(cfg.flash !== false){
      particles.push(new Particle(x,y,0,0,colors[0]||"#fff",0.22,size*9,{flash:true}));
      particles.push(new Particle(x,y,0,0,"#fff",0.16,size*6,{flash:true}));
    }
    function pick(){ return colors[Math.floor(Math.random()*colors.length)]; }
    if(style==="willow"){
      for(i=0;i<count;i++){
        ang = Math.PI/2 + (Math.random()-0.5)*1.6;
        sp = speed*(0.35+Math.random()*0.5);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,pick(),1.7+Math.random()*1.0,size,{trail:trail+4,gravity:gravity,flicker:true,sparkle:sparkle}));
      }
    } else if(style==="chrys"){
      for(i=0;i<count;i++){
        ang = i/count*Math.PI*2 + (Math.random()-0.5)*0.1;
        sp = speed*(0.65+Math.random()*0.9);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,colors[i%colors.length],1.4+Math.random()*0.8,size*0.7,{trail:trail+6,gravity:gravity,flicker:true}));
      }
    } else if(style==="ring"){
      for(i=0;i<count;i++){
        ang = i/count*Math.PI*2;
        sp = speed*(0.94+Math.random()*0.1);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,colors[i%colors.length],1.6+Math.random()*0.4,size,{trail:trail*0.5,gravity:0.045,flicker:false,sparkle:sparkle}));
      }
    } else if(style==="star"){
      // 五角星轮廓：r = 0.45 + 0.55·cos²(5θ)
      for(i=0;i<count;i++){
        ang = i/count*Math.PI*2 + (Math.random()-0.5)*0.05;
        var rr = 0.45 + 0.55*Math.pow(Math.max(0, Math.cos(5*ang)), 2);
        sp = speed*(0.55 + rr*0.75);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,colors[i%colors.length],1.5+Math.random()*0.5,size*0.9,{trail:trail+2,gravity:0.05,flicker:true,sparkle:sparkle}));
      }
    } else if(style==="flower"){
      // 花瓣形状：速度 = 0.25 + |sin(花瓣数·θ)|·0.9
      var petals = 4 + Math.floor(Math.random()*3);
      for(i=0;i<count;i++){
        ang = i/count*Math.PI*2;
        var flower = Math.abs(Math.sin(petals*ang));
        sp = speed*(0.25 + flower*0.9);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,pick(),1.5+Math.random()*0.6,size,{trail:trail+2,gravity:0.05,flicker:true,sparkle:sparkle}));
      }
    } else if(style==="comet"){
      for(i=0;i<count;i++){
        ang = Math.PI/2 + (Math.random()-0.5)*2.4;
        sp = speed*(0.5+Math.random()*1.1);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,pick(),1.7+Math.random()*1.2,size*0.85,{trail:trail+8,gravity:gravity,flicker:true}));
      }
    } else if(style==="double"){
      spawnBurst(x,y,"peony",colors,cfg);
      delayed.push({t:fxT+(0.35+Math.random()*0.35), fn:function(){
        if(Math.random()<0.8){
          var s2 = ["peony","chrys","star","ring"][Math.floor(Math.random()*4)];
          spawnBurst(x+(Math.random()-0.5)*90, y+(Math.random()-0.5)*60, s2, colors, {count:Math.round(count*0.45), speed:speed*0.6, gravity:gravity, trail:trail, flicker:flicker, sparkle:sparkle, size:size*0.9, flash:false});
        }
      }});
    } else if(style==="mystery"){
      var styles = ["peony","chrys","ring","comet","star","willow","flower"];
      var s1 = styles[Math.floor(Math.random()*styles.length)];
      var s2 = styles[Math.floor(Math.random()*styles.length)];
      spawnBurst(x,y,s1,colors,cfg);
      delayed.push({t:fxT+(0.4+Math.random()*0.3), fn:function(){
        spawnBurst(x+(Math.random()-0.5)*110, y+(Math.random()-0.5)*70, s2, colors, {count:Math.round(count*0.6), speed:speed*0.85, gravity:gravity, trail:trail, flicker:flicker, sparkle:sparkle, size:size, flash:false});
      }});
    } else {
      // peony 默认：圆润均匀
      for(i=0;i<count;i++){
        ang = i/count*Math.PI*2 + (Math.random()-0.5)*0.1;
        sp = speed*(0.62+Math.random()*0.65);
        particles.push(new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,colors[i%colors.length],1.5+Math.random()*0.6,size,{trail:trail,gravity:gravity,flicker:flicker,sparkle:sparkle}));
      }
    }
  }

  function spawnRainbowBurst(x,y,cfg){
    // 彩虹：粒子 hue 随时间旋转
    var budget = TIER.maxParticles - particles.length;
    if(budget <= 4){ return; }
    var count = Math.min(cfg.count, Math.max(24, budget - 3)), speed = cfg.speed;
    for(var i=0;i<count;i++){
      var ang = i/count*Math.PI*2 + (Math.random()-0.5)*0.14;
      var sp = speed*(0.6+Math.random()*0.7);
      var p = new Particle(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp,"hsl(0,90%,65%)",1.5+Math.random()*0.6,cfg.size,{trail:cfg.trail,gravity:cfg.gravity,flicker:true});
      p.rainbow = true; p.baseHue = Math.random()*360; p.hueSpeed = 0.8;
      particles.push(p);
    }
  }

  function fxLoop(ts){
    // 用真实帧间隔推进：120Hz 屏不会 2 倍速、掉帧时也不会变慢动作
    var now = (typeof ts === "number") ? ts : performance.now();
    var dt = lastFrameT ? (now - lastFrameT)/1000 : 1/60;
    lastFrameT = now;
    if(dt > 1/30){ dt = 1/30; }
    if(dt <= 0){ dt = 1/60; }
    fxT += dt;
    fctx.clearRect(0,0,vw,vh);
    // 更新弹体
    var i;
    for(i=shells.length-1;i>=0;i--){
      var sh = shells[i];
      sh.update(dt);
      if(sh.t >= sh.dur){
        var x = sh.x, y = sh.y;
        shells.splice(i,1);
        if(state.recipe){
          var style = state.recipe.style;
          var colors = state.recipe.colors.slice();
          var cfg = sh.spec;
          if(style==="rainbow"){
            spawnRainbowBurst(x,y,cfg);
          } else {
            spawnBurst(x,y,style,colors,cfg);
          }
          playBoom(state.recipe.params.big||false);
        }
      } else {
        sh.draw(fctx);
      }
    }
    // 延迟队列（兜底，正常在爆炸时直接生成）
    for(i=delayed.length-1;i>=0;i--){
      if(fxT >= delayed[i].t){ delayed[i].fn(); delayed.splice(i,1); }
    }
    // 更新粒子
    for(i=particles.length-1;i>=0;i--){
      var p = particles[i];
      p.update(dt);
      if(p.life<=0){ particles.splice(i,1); continue; }
      // 越界剔除：坐标与画布同为 CSS 像素，DPR>1 时这里才是准的
      if(p.y > vh + 40 || p.x < -80 || p.x > vw + 80){ particles.splice(i,1); continue; }
      p.draw(fctx);
    }
    var still = shells.length>0 || particles.length>0 || delayed.length>0;
    // 自由连放：粒子放完后循环继续空转，保证随时点击都能立刻渲染
    if(still || state.freeMode){ animId = requestAnimationFrame(fxLoop); }
    else { endFx(); }
  }
  function endFx(){
    fxRunning = false;
    fx.style.display = "none";
    launchStage.classList.remove("firing");
    if(state.continuous){
      // 沉浸连放：不再弹结果卡，回到可再次点燃状态，连续绽放不打断
      state.launched = false;
      launchHint.textContent = "🔁 沉浸连放中：继续点「点燃引线」连放不歇；想换配方点顶部步骤条回到前面。";
      updatePeek();
      return;
    }
    // 展示结果卡
    showResult();
  }
  function startFx(){
    fxRunning = true;
    fxT = 0;
    lastFrameT = 0;
    resizeFx();
    fx.style.display = "block";
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(fxLoop);
  }

  /* ============ 配方解析 ============ */
  function parseRecipe(){
    var ings = state.selected.map(function(id){ return BY_ID[id]; });
    var bases = ings.filter(function(i){ return i.type==="base"; });
    var colors = ings.filter(function(i){ return i.type==="color"; });
    var shapes = ings.filter(function(i){ return i.type==="shape"; });
    var sparks = ings.filter(function(i){ return i.type==="spark"; });

    var mix = state.mix, pack = state.pack;

    // 是否哑火：没有基础料
    var dud = bases.length === 0;

    // 颜色
    var colorList = [];
    if(colors.length){
      colorList = colors.map(function(c){ return c.color; });
      // 钠盐太亮：若有钠盐，金黄连带覆盖
      if(colors.some(function(c){ return c.id==="sodium"; })){
        colorList = ["#ffd60a","#ffb703"];
      }
      // 铜盐 fragile + 搅拌不足 → 蓝色翻车变绿白（贴近真实）
      var hasCopper = colors.some(function(c){ return c.id==="copper"; });
      if(hasCopper && mix < 40){
        colorList = ["#9fd8c0","#d8f0e4","#cfd6e4"];
      }
    } else {
      colorList = ["#ffd166","#fff3b0"];
    }
    // 铝粉加白闪
    if(sparks.some(function(s){ return s.id==="aluminum"; })){
      colorList = colorList.concat(["#ffffff","#ffe9b8"]);
    }
    // 每个主色配同系高光 + 白色（借鉴"主色+高光"混色，让烟花更有光泽）
    var GLOW = {
      "#ff5d6c":["#ff9db0","#ffe3ea"],
      "#51d88a":["#9df0c2","#e2fff0"],
      "#4cc9f0":["#a4e6ff","#e2f8ff"],
      "#ffd60a":["#ffe98a","#fff6d2"],
      "#ffb703":["#ffd166","#fff3c4"],
      "#ffd166":["#ffe9a8","#fff8e0"],
      "#fff3b0":["#fff9d6","#ffffff"],
      "#ff7b00":["#ffb066","#ffe2c2"],
      "#e0aaff":["#f2d4ff","#fdf0ff"],
      "#a78bfa":["#cbb5ff","#efe6ff"],
      "#b388ff":["#d4b8ff","#f3eaff"],
      "#8d99ae":["#b9c2d4","#e8ecf4"],
      "#cfe3ff":["#e6f1ff","#ffffff"],
      "#9fd8c0":["#c8ecdb","#f0fff8"],
      "#d8f0e4":["#eefbf4","#ffffff"],
      "#cfd6e4":["#e6eaf2","#ffffff"],
      "#ffffff":["#ffffff","#ffffff"]
    };
    var glossy = [];
    colorList.forEach(function(cc){
      glossy.push(cc);
      var hl = GLOW[cc];
      if(hl){ glossy = glossy.concat(hl); }
    });
    if(glossy.length){ glossy.push("#ffffff"); }
    colorList = glossy;

    // 形状
    var style = "peony";
    if(shapes.length){
      style = shapes[0].shape;
      if(shapes.length>1 && Math.random()<0.35){ style = shapes[1].shape; }
    }
    // 过度搅拌 → 神秘效果
    if(mix > 135){ style = "mystery"; }

    // 基础参数
    var baseCount = Math.max(1, bases.length);
    var power = 1 + (bases.reduce(function(s,i){ return s+(i.power||0.8); },0)-0.8);
    var params = {
      count: Math.round((70 + 40*baseCount) * power),
      speed: 240 + 40*baseCount,
      gravity: 0.055,
      trail: 6,
      flicker: false,
      sparkle: false,
      size: 1.7,
      big: false
    };

    // 特效合并
    ings.forEach(function(ing){
      if(ing.effect==="sparkle"){ params.sparkle = true; }
      if(ing.effect==="trail"){ params.trail = Math.max(params.trail,9); params.gravity = 0.3; params.styleWillow = true; }
      if(ing.effect==="trail2"){ params.trail = Math.max(params.trail,13); params.gravity = 0.16; }
      if(ing.effect==="thunder"){ params.big = true; params.flicker = true; params.trail = Math.max(params.trail,7); }
      if(ing.effect==="glitter"){ params.flicker = true; params.sparkle = true; }
      if(ing.effect==="crackle"){ params.flicker = true; }
      if(ing.effect==="rainbow"){ /* 形状已处理 */ }
    });

    // 形状附加参数
    if(style==="willow"){ params.trail = Math.max(params.trail,12); params.gravity = 0.34; params.count = Math.round(params.count*1.1); }
    if(style==="chrys"){ params.trail = Math.max(params.trail,11); params.gravity = 0.05; params.flicker = true; }
    if(style==="ring"){ params.count = Math.round(params.count*0.7); params.speed = params.speed*0.85; }
    if(style==="comet"){ params.trail = Math.max(params.trail,14); params.gravity = 0.16; params.count = Math.round(params.count*0.9); }
    if(style==="double"){ params.big = true; params.count = Math.round(params.count*0.8); }
    if(style==="star"){ params.count = Math.round(params.count*0.85); params.flicker = true; }
    if(style==="mystery"){ params.big = true; params.trail = Math.max(params.trail,7); }

    // 搅拌影响
    if(mix < 40){
      params.count = Math.round(params.count*0.65);
      params.speed = params.speed*0.8;
      params.size = params.size*0.8;
    } else if(mix >= 115 && mix <= 135){
      params.count = Math.round(params.count*1.15);
      params.speed = params.speed*1.1;
      params.size = params.size*1.15;
    } else if(mix > 135){
      params.count = Math.round(params.count*1.3);
      params.speed = params.speed*1.25;
      params.size = params.size*1.3;
      params.big = true;
    }

    // 装填影响
    if(pack==="light"){
      params.speed = params.speed*0.82;
      params.count = Math.round(params.count*0.8);
    } else if(pack==="tight"){
      params.speed = params.speed*1.15;
      params.count = Math.round(params.count*1.25);
      params.size = params.size*1.12;
      if(style!=="double" && style!=="mystery" && Math.random()<0.3){
        params.tightDouble = true;
      }
    }

    // 屏幕自适应：小屏上把速度/重力按比例收一收，
    // 否则同样的 240px/s 在大屏是"小花"，在 390px 宽的手机上会直接糊满整片天
    params.speed = Math.round(params.speed * SCALE);
    params.gravity = params.gravity * SCALE;
    params.size = params.size * Math.max(0.85, SCALE);

    // 主色命名
    var mainColor = colorList[0] || "#ffd166";
    var colorName = "gold";
    if(colors.some(function(c){ return c.id==="strontium"; })) colorName = "red";
    if(colors.some(function(c){ return c.id==="barium"; })) colorName = "green";
    if(colors.some(function(c){ return c.id==="copper"; }) && mix>=40) colorName = "blue";
    if(colors.some(function(c){ return c.id==="copper"; }) && mix<40) colorName = "green";
    if(colors.some(function(c){ return c.id==="sodium"; })) colorName = "gold";
    if(style==="rainbow") colorName = "rainbow";
    if(mix>135) colorName = "mystery";

    var name = dud ? "哑火的小爆竹" : (COLOR_NAME[colorName]||"彩") + (SHAPE_NAME[style]||"花");
    if(style==="mystery" && !dud){ name = "神秘" + (SHAPE_NAME[style]||"花"); }

    var note = "";
    if(dud){
      note = "没有加入任何“基础药”（氧化剂/燃料），引线烧完只冒了一股青烟……配方里加点 " + ingIcon("saltpeter") + " 硝酸钾、" + ingIcon("sulfur") + " 硫磺或 " + ingIcon("charcoal") + " 木炭粉再试试吧。";
    } else {
      if(colors.some(function(c){ return c.id==="copper"; })){
        note = mix<40
          ? ingIcon("copper") + " 铜盐的蓝色翻车了！真实工艺中蓝色最难做：铜盐需要极窄的燃烧温度窗口，搅拌不足导致温度偏差，蓝色变成了绿白。多搅拌一会儿再试。"
          : ingIcon("copper") + " 稀有蓝色成功绽放！现实中蓝色烟花需要精确控制燃烧温度（约 1200–1400℃），能稳定做出蓝的焰火师都是高手。";
      } else if(colors.some(function(c){ return c.id==="sodium"; })){
        note = ingIcon("sodium") + " 钠盐金光太耀眼，把别的颜色都盖住了——现实中也是如此，钠的 589nm 亮线过于明亮，配方里常要控制用量。";
      } else if(colors.length===0){
        note = "没有加入着色剂（金属盐），只有燃料燃烧的金白色火花——现实中纯火药的烟花就是这种颜色。";
      } else {
        var colorFacts = colors.map(function(c){ return ingIcon(c.id)+" "+c.name+"（"+c.fact.split("。")[0]+"）"; }).join("；");
        note = "🎨 颜色来自 " + colorFacts + "。" + (mix<40 ? "不过搅拌时间偏短，星体没拌匀，花朵开得有些稀疏。" : (mix>135 ? "搅拌时间过长，配比失衡，绽放得异常猛烈——效果完全失控，但也意外地好看？" : "火候正好，星体颗颗饱满，绽放得完美。"));
      }
      if(style==="mystery" && mix<=135){
        note = ingIcon("shadowcat") + " 影猫皮毛的神秘力量生效了……结果是随机的，连老师傅也说不准。";
      }
    }
    if(params.tightDouble){
      note += " 🪨 紧压装填触发了隐藏的第二重绽放！";
    }

    return {
      dud: dud,
      style: style,
      colors: colorList,
      mainColor: mainColor,
      colorName: colorName,
      name: name,
      note: note,
      params: params,
      ings: ings,
      mix: mix,
      pack: pack,
      /* —— 供图鉴解锁判定使用 —— */
      flags: {
        copperFail: colors.some(function(c){ return c.id==="copper"; }) && mix < 40,
        sodiumCover: colors.some(function(c){ return c.id==="sodium"; }),
        noColor: !dud && colors.length === 0,
        overMix: mix > 135,
        tightDouble: !!params.tightDouble,
        fourIngs: ings.length >= 4
      }
    };
  }

  /* ============ UI：原料架 ============ */
  function renderRack(){
    rackEl.innerHTML = "";
    INGREDIENTS.forEach(function(ing){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ing-card cat-" + catOf(ing) + (state.selected.indexOf(ing.id)>=0 ? " selected" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", String(state.selected.indexOf(ing.id)>=0));
      btn.dataset.id = ing.id;
      var sel = state.selected.indexOf(ing.id)>=0;
      if(!sel && state.selected.length>=4){ btn.disabled = true; }
      btn.innerHTML =
        '<span class="check">✓</span>' +
        ingIcon(ing.id, "ing-ico") +
        '<span class="ing-name">'+ing.name+'</span>' +
        '<span class="ing-desc">'+ing.desc+'</span>' +
        '<span class="ing-tags">' +
          '<span class="tag '+(ing.real?"real":"magic")+'">'+(ing.real?"普通原料":"魔法原料")+'</span>' +
          '<span class="tag type">'+TYPE_LABEL[ing.type]+'</span>' +
        '</span>';
      btn.addEventListener("click", function(){
        toggleIng(ing.id);
      });
      rackEl.appendChild(btn);
    });
    updateBowl();
  }
  function toggleIng(id){
    var idx = state.selected.indexOf(id);
    if(idx>=0){
      state.selected.splice(idx,1);
      playPop();
    } else {
      if(state.selected.length>=4){ return; }
      state.selected.push(id);
      state.dropId = id;   // 标记：这颗原料要"落进碗里"
      playPop();
    }
    renderRack();
    updatePickNote();
  }
  function updateBowl(){
    var dropId = state.dropId;   // 刚投入的原料：播放落进碗里的动画（只播一次）
    state.dropId = null;
    bowlMix.innerHTML = state.selected.length
      ? state.selected.map(function(id){
          return '<span'+(id===dropId?' class="drop"':'')+' title="'+BY_ID[id].name+'">'+ingIcon(id)+'</span>';
        }).join("")
      : '<span class="empty-txt">（空空如也）</span>';
    bowlCount.textContent = state.selected.length;
    if(dropId && bowlEl){
      bowlEl.classList.remove("bump");
      void bowlEl.offsetWidth;   // 强制重排，让动画可以连续触发
      bowlEl.classList.add("bump");
    }
  }
  function updatePickNote(){
    var bases = state.selected.some(function(id){ return BY_ID[id].type==="base"; });
    if(state.selected.length < 2){
      pickNote.className = "panel-note";
      pickNote.innerHTML = "💡 提示：配方里最好包含至少一种“基础药”（" + ingIcon("saltpeter") + " 硝酸钾 / " + ingIcon("sulfur") + " 硫磺 / " + ingIcon("charcoal") + " 木炭粉），否则可能点不响哦。";
      btnToMix.disabled = true;
    } else if(!bases){
      pickNote.className = "panel-note warn";
      pickNote.innerHTML = "⚠️ 当前配方没有基础药，点燃后大概率会<b>哑火</b>。想稳妥一点，加一种基础药吧（当然，也可以冒险试试）。";
      btnToMix.disabled = false;
    } else {
      pickNote.className = "panel-note ok";
      pickNote.innerHTML = "✅ 配方看起来可行！基础药 + 着色剂/花型剂搭配得当，去搅拌吧。";
      btnToMix.disabled = false;
    }
  }

  /* ============ UI：搅拌（左右来回） ============ */
  var SPOON_RANGE = 56;      // 搅拌棒左右摆动幅度（CSS px）
  var TUBE_MOUTH_RATIO = 30 / 234; // 筒口在烟花筒 SVG（viewBox 92×234）中的高度占比：y=30
  var MIX_PER_UNIT = 10;     // 单向扫过整个碗宽（2.0）＝ +20 分，一个完整来回（左→右→左）＝ +40 分（总 150 分对应进度 100%）
  var MIX_MIN_TRAVEL = 0.5;  // 单次扫动至少要跨过半个碗宽才算数，防止原地小幅抖动刷火候
  /* 自由连放限流：防止狂点导致同屏弹体/粒子过多而掉帧 */
  var FREE_MIN_GAP = 180;    // 两次发射的最小间隔（毫秒）
  var FREE_MAX_SHELLS = 8;   // 同屏最多同时在飞的弹体数
  var freeLastFire = 0;

  function clampT(t){ return t < -1 ? -1 : (t > 1 ? 1 : t); }

  function enterMix(){
    state.mix = 0;
    state.mixing = false;
    state.lastT = 0;
    state.strokeStart = 0;
    state.moveDir = 0;
    mixStage.classList.remove("mixing");   // 重置新手引导的显示
    spoon.style.transform = "";
    mixZone.style.transform = "";
    updateMixUI();
    mixRecipe.innerHTML = state.selected.map(function(id){
      var ing = BY_ID[id];
      return '<li>'+ingIcon(ing.id, "r-ico")+' '+ing.name+' <span style="color:var(--ink-faint);font-size:11px">（'+TYPE_LABEL[ing.type]+'）</span></li>';
    }).join("");
    // 等布局稳定后再量碗宽，用于手指位置到搅拌幅度的映射
    requestAnimationFrame(cacheMixGeometry);
  }
  // 缓存碗的水平几何：在搅拌区任意位置按下都能搅，
  // 只要横向位移映射进碗口范围即可 —— 手机上手指不必精确按在碗里
  function cacheMixGeometry(){
    var rect = bigBowl.getBoundingClientRect();
    mixGeom.center = rect.left + rect.width/2;
    mixGeom.half = Math.max(76, rect.width * 0.55);
    SPOON_RANGE = Math.max(34, Math.min(60, rect.width * 0.19));
  }
  // 结算"一程"：计分与行程成正比 → 无论怎么抖，都要真的把手指扫过去才涨火候
  function strokeCredit(){
    var travel = Math.abs(state.lastT - state.strokeStart);
    if(travel < MIX_MIN_TRAVEL){ return 0; }
    state.mix += travel * MIX_PER_UNIT;
    state.strokeStart = state.lastT;
    return travel;
  }
  function pointerStart(e){
    ensureAudio();
    if(e.pointerType==="mouse" && e.button!==0) return;
    cacheMixGeometry();
    state.mixing = true;
    mixStage.classList.add("mixing");   // 已经上手，隐去新手引导
    state.moveDir = 0;
    state.lastT = clampT((e.clientX - mixGeom.center) / mixGeom.half);
    state.strokeStart = state.lastT;
    try{ mixStage.setPointerCapture(e.pointerId); }catch(err){}
    if(e.cancelable) e.preventDefault();
  }
  function pointerMove(e){
    if(!state.mixing) return;
    var t = clampT((e.clientX - mixGeom.center) / mixGeom.half);
    var dx = t - state.lastT;
    if(Math.abs(dx) < 0.006){ return; }        // 触摸抖动过滤
    var dir = dx > 0 ? 1 : -1;
    if(state.moveDir !== 0 && dir !== state.moveDir){
      // 换向 → 结算上一程
      if(strokeCredit() > 0){ playStirTick(); haptic(10); }
    }
    state.moveDir = dir;
    state.lastT = t;
    // 搅拌棒与碗里的原料一起左右摆
    spoon.style.transform = "translateX("+(t*SPOON_RANGE).toFixed(1)+"px) rotate("+(t*14).toFixed(1)+"deg)";
    mixZone.style.transform = "translateX(-50%) translateX("+(t*SPOON_RANGE*0.35).toFixed(1)+"px)";
    updateMixUI();
    if(e.cancelable) e.preventDefault();
  }
  function pointerEnd(){
    if(!state.mixing) return;
    strokeCredit();                            // 松手时把没结算的一程也算上
    state.mixing = false;
    state.moveDir = 0;
    updateMixUI();
  }
  function updateMixUI(){
    var m = state.mix;
    var pct = Math.min(100, Math.round(m/150*100));
    mixPct.textContent = pct + "%";
    // 颜色分段
    var col;
    if(m<40){ col = "#ff5d6c"; }
    else if(m<=115){ col = "#51d88a"; }
    else if(m<=135){ col = "#ffd166"; }
    else { col = "#b388ff"; }
    if(progFill){ progFill.style.width = pct + "%"; progFill.style.background = col; }

    var prog = "<strong>"+pct+"%</strong>";
    var times = "约 <strong>"+(m/40).toFixed(1)+"</strong> 个来回";

    if(m===0){
      mixStatus.innerHTML = "👈👉 按住搅拌棒，在碗里左右来回搅拌";
      mixNote.className = "panel-note";
      mixNote.innerHTML = "⏳ 搅拌进度实时显示在碗的下方，一个完整来回（左→右→左）约涨 27%。";
      btnToPack.disabled = true;
    } else if(m<40){
      mixStatus.innerHTML = "🕐 还没拌匀……搅拌进度 "+prog+"（"+times+"），再搅几下（<strong style='color:#7fd08a'>27% 以上</strong>更好）";
      mixNote.className = "panel-note warn";
      mixNote.innerHTML = "⚠️ 搅拌不足：星体拌不匀，花朵会稀疏、颜色发淡"+(state.selected.indexOf("copper")>=0 ? "，铜盐蓝色也容易翻车变绿白" : "")+"。想冒险也可以直接装填 —— 效果会打折扣。";
      btnToPack.disabled = false;
    } else if(m<=115){
      mixStatus.innerHTML = "✅ 搅拌正好！"+prog+"（"+times+"）—— 可以收手了（最佳区间 <strong style='color:#7fd08a'>27%~77%</strong>）";
      mixNote.className = "panel-note ok";
      mixNote.innerHTML = "✅ 星体颗粒均匀饱满，配方成型。装填去吧！";
      btnToPack.disabled = false;
    } else if(m<=135){
      mixStatus.innerHTML = "🔥 快过头了……"+prog+"（"+times+"），再搅就要失控（<strong style='color:#b388ff'>超过 90%</strong> 触发神秘效果）";
      mixNote.className = "panel-note warn";
      mixNote.innerHTML = "⚠️ 搅拌接近临界值：配比开始失衡，继续搅会触发“神秘效果”，结果不可预测。";
      btnToPack.disabled = false;
    } else {
      mixStatus.innerHTML = "🌀 过度搅拌！"+prog+"（"+times+"）—— 配方彻底失控，神秘效果启动 🎲";
      mixNote.className = "panel-note";
      mixNote.innerHTML = "🎲 过度搅拌触发神秘效果：形状、颜色、强度全部随机！勇敢的焰火师，接受这个惊喜吧。";
      btnToPack.disabled = false;
    }
  }

  /* ============ UI：装填 ============ */
  function enterPack(){
    state.pack = "mid";
    state.packed = false;
    packStage.classList.remove("packed");
    document.querySelectorAll(".pack-option").forEach(function(el){
      var sel = el.dataset.pack === "mid";
      el.classList.toggle("sel", sel);
      el.setAttribute("aria-checked", String(sel));
    });
    packNote.className = "panel-note";
    packNote.innerHTML = "👇 选择压实程度，然后确认装填。";
  }
  function selectPack(p){
    state.pack = p;
    document.querySelectorAll(".pack-option").forEach(function(el){
      var sel = el.dataset.pack === p;
      el.classList.toggle("sel", sel);
      el.setAttribute("aria-checked", String(sel));
    });
    playPop();
  }

  /* ============ UI：点燃 ============ */
  function enterLaunch(){
    state.launched = false;
    state.continuous = false;   // 重新进入点燃步骤时退出沉浸连放，恢复正常结果卡
    setFreeMode(false);         // 重新进入点燃步骤时退出自由连放
    resultCard.hidden = true;
    launchStage.classList.remove("firing");
    if(peekBtn) peekBtn.hidden = true;
    var bases = state.selected.some(function(id){ return BY_ID[id].type==="base"; });
    var hint = "";
    if(!bases){ hint = "⚠️ 配方缺少基础药，预计会哑火（冒股青烟）。"; }
    else if(state.mix<40){ hint = "⚠️ 搅拌不足（进度不到 27%），花朵会比较稀疏。"; }
    else if(state.mix>135){ hint = "🌀 过度搅拌（进度超过 90%），神秘效果待机中！"; }
    else { hint = "🔥 点击下方按钮点燃引线，退后一步看它升空。"; }
    launchHint.textContent = hint;
  }

  // 自由连放开关：开启后在点燃页任意位置单击即从桶口放一枚
  function setFreeMode(on){
    on = !!on;
    if(state.freeMode === on){
      // 即使状态未变，也把 UI 同步一遍，避免类/文案与实际状态脱节
      launchStage.classList.toggle("free", on);
      return;
    }
    state.freeMode = on;
    launchStage.classList.toggle("free", on);
    var btn = $("btnFree");
    if(btn){
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "自由连放（已开）" : "自由连放";
    }
    if(on){
      // 进入自由连放：先按当前配方算好结果，进入点火常驻态
      ensureAudio();
      var r = parseRecipe();
      state.recipe = r;
      achNewIds = achUnlock(r);
      startFx();
      fx.style.display = "block";
      launchStage.classList.add("firing");
      launchHint.textContent = "自由连放中：在屏幕任意位置单击，就从桶里放一朵！";
    } else {
      // 退出：清空现场、复位状态
      cancelAnimationFrame(animId);
      particles.length = 0; shells.length = 0; delayed.length = 0;
      fxRunning = false;
      fx.style.display = "none";
      launchStage.classList.remove("firing");
      state.launched = false;
      resultCard.hidden = true;
      if(peekBtn) peekBtn.hidden = true;
    }
  }
  function launch(){
    if(state.launched) return;
    state.launched = true;
    if(peekBtn) peekBtn.hidden = true;   // 燃放中隐藏该按钮，放完再由 endFx 决定
    ensureAudio();
    haptic(18);
    var r = parseRecipe();
    state.recipe = r;
    // 图鉴记录：本次燃放真正触发/绽放出来后，才解锁对应成就
    achNewIds = achUnlock(r);
    launchStage.classList.add("firing");
    if(state.freeMode){
      // 自由连放：按钮也当作"在默认高度放一朵"，同样受限流约束
      state.launched = false;   // 允许下次继续点
      if(!freeRateOk()) return;
      launchHint.textContent = "自由连放中：在屏幕任意位置单击，就从桶里放一朵！";
      startFx();
      fireFromTube();
      return;
    }
    launchHint.textContent = "点燃引线，后退一步……";
    startFx();
    fireFromTube();
  }
  // 从烟花筒口发射一枚弹体；targetX/targetY 为空时按默认高度垂直升空
  function fireFromTube(targetX, targetY){
    var r = state.recipe;
    if(!r){ return; }
    var tubeEl = launchStage.querySelector(".launch-tube");
    if(!tubeEl){ return; }
    var rect = tubeEl.getBoundingClientRect();
    var originX = rect.left + rect.width/2;
    var originY = rect.top + rect.height * TUBE_MOUTH_RATIO;
    if(r.dud){
      playFizz();
      delayed.push({t:fxT+0.9, fn:function(){ spawnDudSmoke(originX, originY); }});
      return;
    }
    // 目标高度：默认升到视口上方 30%；自由连放时用点击点的 Y
    var ty = (targetY === undefined || targetY === null)
      ? originY - window.innerHeight*0.3
      : targetY;
    shells.push(new Shell(originX, originY, ty, r.colors[0]||"#fff", r.params, targetX));
    playWhistle(1.0);
  }

  // 连点限流：间隔过近或同屏弹体过多时返回 false
  function freeRateOk(){
    var now = performance.now();
    if(now - freeLastFire < FREE_MIN_GAP) return false;
    if(shells.length >= FREE_MAX_SHELLS) return false;
    freeLastFire = now;
    return true;
  }

  // 自由连放：点击点燃页任意位置就放一枚
  function freeFire(e){
    if(!state.freeMode) return;
    // 点在按钮/卡片等交互元素上时不算（否则开关按钮会自己触发燃放）
    var t = e.target;
    if(t && t.closest && t.closest("button, .card, dialog, a, input, select, textarea")) return;
    if(!freeRateOk()) return;
    if(!fxRunning){ startFx(); }
    // 落点限制在画面上半部，保证有绽放空间
    var ty = Math.min(Math.max(e.clientY, vh*0.12), vh*0.6);
    fireFromTube(e.clientX, ty);
  }

  function spawnDudSmoke(x,y){
    for(var i=0;i<26;i++){
      var ang = Math.PI/2 + (Math.random()-0.5)*1.2;
      var sp = 40 + Math.random()*80;
      var p = new Particle(x + (Math.random()-0.5)*14, y, Math.cos(ang)*sp*0.2, -Math.abs(Math.sin(ang))*sp*0.6, "rgba(180,180,190,1)", 0.9+Math.random()*0.7, 2.4, {trail:4, gravity:-0.02, drag:0.94});
      p.drawSmoke = true;
      particles.push(p);
    }
    playFizz();
  }

  function showResult(){
    var r = state.recipe;
    if(!r) return;
    resultCard.hidden = false;
    if(peekBtn) peekBtn.hidden = true;
    resultCard.classList.toggle("fail", r.dud);
    // 内层滚动位置复位，避免上次滚到底后这次的头部信息看不到
    var rcBody = resultCard.querySelector(".card-body");
    if(rcBody) rcBody.scrollTop = 0;
    $("rcRibbon").textContent = r.dud ? "燃放失败" : "今夜绽放";
    $("rcName").textContent = r.name;
    var mixPct = Math.min(100, Math.round(r.mix/150*100));   // 与搅拌进度条同一换算口径
    $("rcSub").textContent = r.dud
      ? "引线烧完，只冒了一股青烟……"
      : (r.style==="mystery" ? "神秘力量，结果不可预测" : "配方 · 搅拌 "+mixPct+"% · 压实 "+(r.pack==="light"?"轻压":r.pack==="tight"?"紧压":"适中"));
    var stats = [
      {k:"星体数量", v:r.params.count},
      {k:"爆裂速度", v:Math.round(r.params.speed)+" px/s"},
      {k:"主色调", v:COLOR_NAME[r.colorName] || "金"}
    ];
    $("rcStats").innerHTML = stats.map(function(s){
      return '<div class="fx-stat"><div class="fs-k">'+s.k+'</div><div class="fs-v">'+s.v+'</div></div>';
    }).join("");
    $("rcNote").innerHTML = r.note;
    // 原料行：拆成原子片段（段内不断行，段间才换行），避免窄屏把「压实 适中」从中间断开；
    // 分隔符写在片段内部，换行时不会留下孤立的「·」「｜」
    var ingSegs = r.ings.map(function(i, idx){
      return '<span class="fx-ing-seg">' + (idx===0 ? "原料：" : '<span class="fx-ing-dot">·</span>')
        + ingIcon(i.id) + " " + i.name + '</span>';
    });
    ingSegs.push('<span class="fx-ing-seg tail">搅拌 ' + mixPct + '%</span>');
    ingSegs.push('<span class="fx-ing-seg tail">压实 ' + (r.pack==="light"?"轻压":r.pack==="tight"?"紧压":"适中") + '</span>');
    $("rcIngredients").innerHTML = ingSegs.join("");
    // 图鉴新收录提示：只在本次有新的解锁时出现
    var rcNew = $("rcNew");
    if(rcNew){
      if(achNewIds.length){
        var names = achNewIds.map(function(id){
          var a = ACHIEVEMENTS.filter(function(x){ return x.id===id; })[0];
          return a ? (a.ico+" "+a.name) : id;
        }).join("、");
        rcNew.innerHTML = "🆕 图鉴新收录：" + names;
        rcNew.hidden = false;
      } else {
        rcNew.hidden = true;
        rcNew.innerHTML = "";
      }
    }
    // 滚动到结果卡
    try{ resultCard.scrollIntoView({behavior: reducedMotion?"auto":"smooth", block:"nearest"}); }catch(e){}
  }

  /* ============ 步骤导航 ============ */
  function goStep(n){
    state.step = n;
    Object.keys(scenes).forEach(function(k){
      var show = Number(k) === n;
      scenes[k].classList.toggle("show", show);
      scenes[k].hidden = !show;
    });
    stepsEls.forEach(function(li){
      var s = Number(li.dataset.step);
      li.classList.toggle("active", s===n);
      li.classList.toggle("done", s<n);
    });
    document.body.classList.toggle("immersive", n===4);
    if(n===2){ enterMix(); }
    if(n===3){ enterPack(); }
    if(n===4){ enterLaunch(); }
    window.scrollTo({top:0, behavior: reducedMotion?"auto":"smooth"});
  }

  /* ============ 弹层：烟花图鉴（成就式收集） ============ */
  // 已解锁 id 集合：localStorage 持久化，读写失败时退化为内存态，不影响主流程
  var achUnlocked = (function(){
    try{
      var raw = localStorage.getItem(ACH_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  })();
  var achNewIds = [];   // 本次燃放新解锁的 id，用于结果卡「新收录」角标

  function achSave(){
    try{ localStorage.setItem(ACH_KEY, JSON.stringify(achUnlocked)); }catch(e){}
  }
  function achHas(id){ return achUnlocked.indexOf(id) >= 0; }

  // 判定一次配方解锁了哪些成就；返回新解锁的 id 列表
  function achUnlock(r){
    var got = [];
    function take(id){
      if(!achHas(id) && got.indexOf(id) < 0){
        achUnlocked.push(id);
        got.push(id);
      }
    }
    ACHIEVEMENTS.forEach(function(a){
      if(a.group === "shape"){
        if(!r.dud && r.style === a.style) take(a.id);
      } else if(a.group === "color"){
        if(!r.dud && r.colorName === a.colorName) take(a.id);
      } else {
        var f = r.flags || {};
        if(a.id === "hd_dud"          && r.dud)              take(a.id);
        if(a.id === "hd_copper_fail"  && f.copperFail)        take(a.id);
        if(a.id === "hd_sodium_cover" && !r.dud && f.sodiumCover) take(a.id);
        if(a.id === "hd_tight_double" && f.tightDouble)       take(a.id);
        if(a.id === "hd_overmix"      && !r.dud && f.overMix) take(a.id);
        if(a.id === "hd_no_color"     && f.noColor)           take(a.id);
        if(a.id === "hd_four"         && f.fourIngs)          take(a.id);
        // 虹彩猎手：用满 4 个原料做出彩虹（比普通彩虹更难的变体）
        if(a.id === "hd_rainbow_kill" && !r.dud && r.style === "rainbow" && r.flags.fourIngs) take(a.id);
      }
    });
    if(got.length){ achSave(); }
    return got;
  }

  function achProgress(){
    return { got: achUnlocked.length, total: ACHIEVEMENTS.length };
  }

  function renderAlbum(){
    var body = $("albumBody");
    if(!body) return;
    var html = "", p = achProgress();
    html += '<div class="album-progress"><div class="ap-bar"><span style="width:'+
            Math.round(p.got/Math.max(1,p.total)*100)+'%"></span></div>'+
            '<div class="ap-txt">已收录 <b>'+p.got+'</b> / '+p.total+'</div></div>';
    ACH_GROUPS.forEach(function(g){
      var list = ACHIEVEMENTS.filter(function(a){ return a.group === g.id; });
      var gotN = list.filter(function(a){ return achHas(a.id); }).length;
      html += '<div class="album-group">'+
              '<h3>'+g.title+'<span class="ag-count">'+gotN+'/'+list.length+'</span></h3>'+
              '<p class="ag-desc">'+g.desc+'</p>'+
              '<div class="album-grid">';
      list.forEach(function(a){
        var on = achHas(a.id);
        var isNew = achNewIds.indexOf(a.id) >= 0;
        html += '<div class="album-item'+(on?' on':'')+'">'+
                '<div class="ai-ico">'+(on ? a.ico : "❔")+'</div>'+
                '<div class="ai-name">'+(on ? a.name : "未收录")+'</div>'+
                (isNew ? '<span class="ai-new">NEW</span>' : '')+
                '<div class="ai-hint">'+(on ? "已收录 · "+(a.hint||"") : (a.hint||"继续探索"))+'</div>'+
                '</div>';
      });
      html += '</div></div>';
    });
    html += '<button type="button" class="btn ghost album-reset" id="albumReset">🧹 清空图鉴记录</button>';
    body.innerHTML = html;
    var rb = $("albumReset");
    if(rb) rb.addEventListener("click", function(){
      if(!window.confirm("确定要清空全部图鉴收录记录吗？此操作不可撤销。")) return;
      achUnlocked = []; achNewIds = []; achSave();
      renderAlbum();
    });
  }

  /* ============ 弹层：炼金手札 ============ */
  function renderJournal(){
    var grid = $("journalGrid");
    grid.innerHTML = "";
    INGREDIENTS.forEach(function(ing){
      var item = document.createElement("div");
      item.className = "journal-item";
      item.innerHTML =
        '<div class="j-head">'+ingIcon(ing.id, "j-ico")+' '+ing.name+'</div>' +
        '<span class="tag j-type '+(ing.real?"real":"magic")+'">'+(ing.real?"普通原料":"魔法原料")+' · '+TYPE_LABEL[ing.type]+'</span>' +
        '<div class="j-fact">'+ing.fact+'</div>';
      grid.appendChild(item);
    });
  }

  /* ============ 事件绑定 ============ */
  function bind(){
    // 选料
    btnToMix.addEventListener("click", function(){ goStep(2); });
    $("btnBack1").addEventListener("click", function(){ goStep(1); });
    // 搅拌（左右拖动）
    mixStage.addEventListener("pointerdown", pointerStart);
    mixStage.addEventListener("pointermove", pointerMove);
    mixStage.addEventListener("pointerup", pointerEnd);
    mixStage.addEventListener("pointercancel", pointerEnd);
    // 手指滑出搅拌区也要能收尾：pointer capture 之外的兜底
    window.addEventListener("pointerup", pointerEnd);
    window.addEventListener("pointercancel", pointerEnd);
    window.addEventListener("blur", pointerEnd);
    $("btnToPack").addEventListener("click", function(){ goStep(3); });
    $("btnBack2").addEventListener("click", function(){ goStep(2); });
    // 装填
    document.querySelectorAll(".pack-option").forEach(function(el){
      el.addEventListener("click", function(){ selectPack(el.dataset.pack); });
    });
    $("btnToLaunch").addEventListener("click", function(){
      state.packed = true;
      packStage.classList.add("packed");
      packNote.className = "panel-note ok";
      packNote.innerHTML = "✅ 装填完成！压实程度：" + (state.pack==="light"?"轻压":state.pack==="tight"?"紧压":"适中") + "。";
      playPop();
      setTimeout(function(){ goStep(4); }, 650);
    });
    $("btnBack3").addEventListener("click", function(){ goStep(3); });
    // 点燃
    $("btnLaunch").addEventListener("click", launch);
    // 自由连放：开关 + 点燃页任意位置单击发射
    $("btnFree").addEventListener("click", function(){ setFreeMode(!state.freeMode); });
    launchStage.addEventListener("pointerdown", freeFire);
    // 「再放一次」与「关闭」行为一致：进入沉浸连放，回到点燃引信页面
    function backToLaunch(){
      state.continuous = true;
      state.launched = false;
      resultCard.hidden = true;
      launchStage.classList.remove("firing");
      launchHint.textContent = "🔁 沉浸连放模式：点「点燃引线」连续绽放，不再打断。";
      updatePeek();
    }
    $("btnAgain").addEventListener("click", backToLaunch);
    $("btnClose").addEventListener("click", backToLaunch);
    $("btnPeek").addEventListener("click", function(){
      // 查看本次效果：在连放中临时弹出结果卡
      showResult();
    });
    $("btnNew").addEventListener("click", function(){
      state.selected = [];
      state.mix = 0;
      renderRack();
      updatePickNote();
      goStep(1);
    });
    // 步骤条点击（允许回看已完成步骤）
    stepsEls.forEach(function(li){
      li.addEventListener("click", function(){
        var n = Number(li.dataset.step);
        if(n < state.step){ goStep(n); }
      });
    });
    // 手札
    var jd = $("journalDialog");
    $("btnJournal").addEventListener("click", function(){
      renderJournal();
      jd.showModal();
    });
    $("journalClose").addEventListener("click", function(){ jd.close(); });
    jd.addEventListener("click", function(e){ if(e.target===jd){ jd.close(); } });
    // 图鉴
    var ad = $("albumDialog");
    $("btnAlbum").addEventListener("click", function(){
      renderAlbum();
      ad.showModal();
    });
    $("albumClose").addEventListener("click", function(){ ad.close(); });
    ad.addEventListener("click", function(e){ if(e.target===ad){ ad.close(); } });
    // 音效开关
    var bs = $("btnSound");
    bs.addEventListener("click", function(){
      state.soundOn = !state.soundOn;
      // 只改文字，保留按钮内的 emoji / .hb-txt 结构（手机端靠 .hb-txt 隐藏文字）
      var ico = bs.querySelector(".hb-ico"), txt = bs.querySelector(".hb-txt");
      if(ico && txt){
        ico.textContent = state.soundOn ? "🔊" : "🔇";
        txt.textContent = state.soundOn ? " 音效" : " 静音";
      } else {
        bs.textContent = state.soundOn ? "🔊 音效" : "🔇 静音";
      }
      bs.setAttribute("aria-pressed", String(state.soundOn));
      ensureAudio();
    });
    // 手机端地址栏收起/展开会疯狂触发 resize：防抖 + 只在尺寸真的变了才重算，
    // 宽度变化或高度大幅变化（如转屏）才重新撒星星，避免星星位置乱跳
    var resizeTimer = null;
    window.addEventListener("resize", function(){
      if(resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        var oldW = vw, oldH = vh, oldD = DPR;
        readViewport();
        if(vw === oldW && vh === oldH && DPR === oldD){ return; }
        sizeSkyCanvas();
        if(Math.abs(vw-oldW) > 2 || Math.abs(vh-oldH) > 90){ seedStars(); }
        if(fxRunning){ resizeFx(); }
      }, 160);
    });
    window.addEventListener("orientationchange", function(){
      if(resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){ readViewport(); initSky(); if(fxRunning){ resizeFx(); } }, 260);
    });
  }

  /* ============ 启动 ============ */
  function init(){
    detectFlexGap();   // 在渲染前完成 Flex gap 行为检测，决定是否启用 gap 增强层
    readViewport();
    initSky();
    resizeFx();
    renderRack();
    updatePickNote();
    bind();
    // 星空循环无条件自注册（旧写法一旦 fxRunning 变 true 就再也不会重启）
    requestAnimationFrame(skyLoop);
  }
  init();

  }catch(err){
    // 静态内容保持可读
    try{
      var errNote = document.createElement("div");
      errNote.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:99;background:#3a1010;color:#ffb9c1;padding:10px 14px;border-radius:8px;font-size:12px;max-width:80vw;";
      errNote.textContent = "脚本初始化出错：" + (err && err.message ? err.message : String(err));
      document.body.appendChild(errNote);
    }catch(e2){}
  }
})();
