/* V74-view-normalizer
   Move legacy route sections into #main-screen once.
   No scroll interception, no forced scroll position, no height mutation. */
(function(){
  'use strict';

  function normalize(){
    var main=document.getElementById('main-screen');
    var root=main && main.closest('.relative.z-10.flex.flex-col');
    if(!main || !root) return;

    Array.prototype.slice.call(root.children).forEach(function(el){
      if(
        el &&
        el.tagName==='SECTION' &&
        typeof el.id==='string' &&
        el.id.indexOf('view-')===0
      ){
        main.appendChild(el);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',normalize,{once:true});
  }else{
    normalize();
  }

  window.addEventListener('load',normalize,{once:true});
})();
