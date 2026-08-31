/* V74-scroll-core */
(function(){
  'use strict';

  var observer=null, queued=false;

  function main(){ return document.getElementById('main-screen'); }

  function normalizeViews(){
    var m=main();
    if(!m)return;

    /* Keep every route view in one content container.
       This removes the old external route bank from page geometry. */
    document.querySelectorAll('section[id^="view-"]').forEach(function(v){
      if(v.parentElement!==m)m.appendChild(v);
    });

    /* Make hidden route geometry explicit, independent of utility CSS timing. */
    m.querySelectorAll('section[id^="view-"].hidden').forEach(function(v){
      v.style.setProperty('display','none','important');
    });
    m.querySelectorAll('section[id^="view-"]:not(.hidden)').forEach(function(v){
      v.style.removeProperty('display');
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){
      queued=false;
      normalizeViews();
    });
  }

  function boot(){
    normalizeViews();

    observer=new MutationObserver(function(mutations){
      var needed=false;
      mutations.forEach(function(m){
        if(m.type==='childList')needed=true;
        if(m.type==='attributes'&&m.attributeName==='class'&&m.target&&m.target.matches&&m.target.matches('section[id^="view-"]'))needed=true;
      });
      if(needed)schedule();
    });

    try{
      observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }catch(_){}

    setTimeout(schedule,250);
    setTimeout(schedule,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
