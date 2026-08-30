/* V71-real-content-scroll-guard */
(function(){
  'use strict';

  var ticking=false, locked=false, lastMax=0;

  function viewportHeight(){
    try{return Math.max(1,Math.round((window.visualViewport&&window.visualViewport.height)||window.innerHeight||document.documentElement.clientHeight||0));}
    catch(_){return window.innerHeight||document.documentElement.clientHeight||1;}
  }

  function normalPage(){
    var b=document.body;
    if(!b)return false;
    if(b.classList.contains('study-note-app-open'))return false;
    if(b.classList.contains('study-note-section-open'))return false;
    return true;
  }

  function realEnd(){
    if(!normalPage())return null;
    var footer=document.querySelector('body > footer');
    if(footer && footer.offsetParent!==null){
      var r=footer.getBoundingClientRect();
      return Math.max(0,Math.ceil(r.bottom + window.scrollY));
    }

    var main=document.getElementById('main-screen');
    var root=document.querySelector('body > .relative.z-10.flex.flex-col.min-h-screen');
    var end=0;
    [root,main].forEach(function(el){
      if(!el||el.offsetParent===null)return;
      var r=el.getBoundingClientRect();
      end=Math.max(end,Math.ceil(r.bottom+window.scrollY));
    });
    return end||null;
  }

  function clampNow(){
    ticking=false;
    if(locked||!normalPage())return;

    var end=realEnd();
    if(end==null)return;

    var vh=viewportHeight();
    var maxY=Math.max(0,end-vh);
    lastMax=maxY;

    if(window.scrollY>maxY+2){
      locked=true;
      try{window.scrollTo({left:0,top:maxY,behavior:'auto'});}catch(_){window.scrollTo(0,maxY);}
      requestAnimationFrame(function(){locked=false;});
    }
  }

  function schedule(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(clampNow);
  }

  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',schedule,{passive:true});
    window.visualViewport.addEventListener('scroll',schedule,{passive:true});
  }

  var mo=new MutationObserver(function(){schedule();});
  function observe(){
    try{mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});}catch(_){}
  }

  function boot(){
    observe();
    schedule();
    setTimeout(schedule,150);
    setTimeout(schedule,600);
    setTimeout(schedule,1400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  /* Navigation can restore old scroll positions; clamp after every route change. */
  setInterval(function(){
    if(normalPage() && window.scrollY>lastMax+2)schedule();
  },500);
})();
