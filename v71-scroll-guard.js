/* V72-scroll-recovery
   V71's hard vertical clamp was too aggressive and could prevent legitimate
   scrolling. Keep only safe horizontal correction and let the browser handle
   vertical scrolling naturally. */
(function(){
  'use strict';

  function fixHorizontal(){
    if(window.scrollX!==0){
      try{window.scrollTo({left:0,top:window.scrollY,behavior:'auto'})}
      catch(_){window.scrollTo(0,window.scrollY)}
    }
  }

  window.addEventListener('scroll',fixHorizontal,{passive:true});
  window.addEventListener('resize',fixHorizontal,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',fixHorizontal,{passive:true});
  }
})();
