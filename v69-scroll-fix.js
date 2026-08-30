/* V69-empty-scroll-structural-fix */
(function(){
  'use strict';

  var moved=false, navPatched=false, observer=null, raf=0;

  function v69Main(){ return document.getElementById('main-screen'); }

  function v69NormalizeViews(){
    var main=v69Main();
    if(!main) return;

    /* A large bank of later-added views was historically placed after the main
       content row. Move every view into the one real content container. */
    document.querySelectorAll('section[id^="view-"]').forEach(function(view){
      if(view.parentElement!==main){
        main.appendChild(view);
        moved=true;
      }
    });

    /* Hidden means zero geometry, even before/without Tailwind utility rules. */
    main.querySelectorAll('section[id^="view-"].hidden').forEach(function(view){
      view.style.display='none';
    });
    main.querySelectorAll('section[id^="view-"]:not(.hidden)').forEach(function(view){
      view.style.removeProperty('display');
      if(!document.body.classList.contains('study-note-section-open')){
        view.style.removeProperty('min-height');
        view.style.removeProperty('height');
      }
    });
  }

  function v69TrimLayout(){
    if(document.body.classList.contains('study-note-section-open')) return;
    var root=document.querySelector('body > .relative.z-10.flex.flex-col.min-h-screen');
    var row=root && root.querySelector(':scope > .flex-1.max-w-7xl');
    var main=v69Main();
    [root,row,main].forEach(function(el){
      if(!el)return;
      el.style.setProperty('min-height','0','important');
      el.style.setProperty('height','auto','important');
    });
  }

  function v69ResetScroll(){
    if(document.body.classList.contains('study-note-app-open')) return;
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
    var main=v69Main();
    if(main) main.scrollTop=0;
  }

  function v69Sync(reset){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){
      v69NormalizeViews();
      v69TrimLayout();
      if(reset) v69ResetScroll();
    });
  }

  function v69PatchNavigate(){
    if(navPatched || typeof window.navigate!=='function') return;
    var base=window.navigate;
    var wrapped=function(){
      var out=base.apply(this,arguments);
      Promise.resolve(out).finally(function(){
        v69Sync(true);
        setTimeout(function(){v69Sync(false)},80);
      });
      return out;
    };
    try{Object.defineProperty(wrapped,'name',{value:'navigate'})}catch(_){}
    window.navigate=wrapped;
    navPatched=true;
  }

  function v69Observe(){
    if(observer) return;
    var main=v69Main();
    if(!main) return;
    observer=new MutationObserver(function(muts){
      var should=false, reset=false;
      muts.forEach(function(m){
        if(m.type==='childList') should=true;
        if(m.type==='attributes' && m.attributeName==='class'){
          var t=m.target;
          if(t && t.matches && t.matches('section[id^="view-"]')){
            should=true;
            if(!t.classList.contains('hidden')) reset=true;
          }
        }
      });
      if(should) v69Sync(reset);
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  function boot(){
    v69NormalizeViews();
    v69TrimLayout();
    v69PatchNavigate();
    v69Observe();
    setTimeout(function(){v69PatchNavigate();v69Sync(false)},250);
    setTimeout(function(){v69PatchNavigate();v69Sync(false)},900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('load',function(){v69Sync(false)},{once:true});
})();
