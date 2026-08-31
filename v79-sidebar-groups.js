/* V79 — six sidebar groups, 36 core shortcuts, zero feature deletion. */
(function(){
  'use strict';

  var expected={
    today:4,
    exam:6,
    tools:7,
    ai:3,
    record:5,
    social:11
  };
  var routeToGroup={
    timetable:'today',meal:'today',supplies:'today',notice:'today',
    problems:'exam','wrong-notes':'exam','exam-maker':'exam','v21-qgen':'exam','v21-grading':'exam','v21-mockexam':'exam',
    notes:'tools',concepts:'tools',study:'tools',timer:'tools','focus-sounds':'tools',resources:'tools','learning-path':'tools',
    'ai-chat':'ai','ai-tutor-phase1':'ai','ai-analysis':'ai',
    goals:'record',journal:'record','weekly-stats':'record',streak:'record',calendar:'record',
    'new-features':'social',board:'social','school-newsroom':'social',notifications:'social',chat:'social',appeal:'social',feedback:'social',qa:'social','study-group':'social','friend-feed':'social',poll:'social'
  };

  var templateHtml=null;
  var repairBusy=false;
  var openGroup=null;

  function getAside(){return document.getElementById('main-sidebar')}

  function sidebarValid(){
    var aside=getAside();
    if(!aside || aside.dataset.v79Sidebar!=='1')return false;
    var groups=aside.querySelectorAll('.v79-group[data-v79-group]');
    if(groups.length!==6)return false;
    var total=0;
    for(var i=0;i<groups.length;i++){
      var key=groups[i].dataset.v79Group;
      var count=groups[i].querySelectorAll('.v79-item[data-v79-route]').length;
      if(expected[key]!==count)return false;
      total+=count;
    }
    return total===36;
  }

  function snapshotTemplate(){
    var aside=getAside();
    if(aside && aside.dataset.v79Sidebar==='1' && !templateHtml)templateHtml=aside.outerHTML;
  }

  function restoreSidebar(){
    if(repairBusy)return;
    repairBusy=true;
    try{
      if(sidebarValid()){bindSidebar();return}
      if(!templateHtml)return;
      var old=getAside();
      if(!old)return;
      var wrap=document.createElement('div');
      wrap.innerHTML=templateHtml.trim();
      var fresh=wrap.firstElementChild;
      old.replaceWith(fresh);
      bindSidebar();
      setOpen(openGroup||readOpen(),false);
      updateActive();
    }finally{
      repairBusy=false;
    }
  }

  function readOpen(){
    try{return sessionStorage.getItem('v79-open-group')||''}catch(_){return ''}
  }
  function saveOpen(key){
    try{if(key)sessionStorage.setItem('v79-open-group',key);else sessionStorage.removeItem('v79-open-group')}catch(_){}
  }

  function setOpen(key,save){
    var aside=getAside();if(!aside)return;
    aside.querySelectorAll('.v79-group').forEach(function(g){
      g.classList.toggle('v79-open',!!key && g.dataset.v79Group===key);
    });
    openGroup=key||null;
    if(save!==false)saveOpen(key||'');
  }

  function toggleGroup(key){
    var aside=getAside();if(!aside)return;
    var g=aside.querySelector('.v79-group[data-v79-group="'+key+'"]');
    var isOpen=g && g.classList.contains('v79-open');
    setOpen(isOpen?'':key,true);
  }

  function go(route){
    try{
      if(typeof window.navigate==='function')window.navigate(route);
    }catch(e){console.error('[V79 navigate]',route,e)}
    setTimeout(updateActive,60);
    try{
      if(window.innerWidth<768 && typeof window.toggleSidebar==='function')window.toggleSidebar();
    }catch(_){}
  }

  function doSearch(){
    try{
      if(typeof window.openSearchModal==='function'){window.openSearchModal();return}
    }catch(_){}
    var q=window.prompt('기능 이름을 입력하세요.');
    if(!q)return;
    q=q.trim().toLowerCase();
    var aside=getAside();if(!aside)return;
    var found=null;
    aside.querySelectorAll('.v79-item').forEach(function(b){
      if(found)return;
      if((b.textContent||'').trim().toLowerCase().indexOf(q)>=0)found=b;
    });
    if(found){
      var group=found.closest('.v79-group');
      if(group)setOpen(group.dataset.v79Group,true);
      found.scrollIntoView({block:'nearest',behavior:'smooth'});
      found.focus();
    }
  }

  function visibleRoute(){
    var main=document.getElementById('main-screen');
    if(!main)return '';
    var sections=main.querySelectorAll('section[id^="view-"]');
    for(var i=0;i<sections.length;i++){
      var s=sections[i];
      if(!s.classList.contains('hidden') && s.offsetParent!==null)return s.id.slice(5);
    }
    return '';
  }

  function updateActive(){
    var route=visibleRoute();
    var aside=getAside();if(!aside)return;
    aside.querySelectorAll('.v79-item').forEach(function(b){
      b.classList.toggle('v79-active',b.dataset.v79Route===route);
    });
    var group=routeToGroup[route];
    if(group && !openGroup)setOpen(group,false);
  }

  function bindSidebar(){
    var aside=getAside();if(!aside)return;
    aside.querySelectorAll('[data-v79-toggle]').forEach(function(b){
      if(b.dataset.v79Bound)return;
      b.dataset.v79Bound='1';
      b.addEventListener('click',function(){toggleGroup(b.dataset.v79Toggle)});
    });
    aside.querySelectorAll('[data-v79-route]').forEach(function(b){
      if(b.dataset.v79Bound)return;
      b.dataset.v79Bound='1';
      b.addEventListener('click',function(){go(b.dataset.v79Route)});
    });
    aside.querySelectorAll('[data-v79-search]').forEach(function(b){
      if(b.dataset.v79Bound)return;
      b.dataset.v79Bound='1';
      b.addEventListener('click',doSearch);
    });
    aside.querySelectorAll('[data-v79-home]').forEach(function(b){
      if(b.dataset.v79Bound)return;
      b.dataset.v79Bound='1';
      b.addEventListener('click',function(){go('home')});
    });
    aside.querySelectorAll('[data-v79-collapse]').forEach(function(b){
      if(b.dataset.v79Bound)return;
      b.dataset.v79Bound='1';
      b.addEventListener('click',function(){
        try{if(typeof window.toggleSidebar==='function')window.toggleSidebar()}catch(_){}
      });
    });
  }

  function boot(){
    snapshotTemplate();
    bindSidebar();
    setOpen(readOpen()||'',false);
    updateActive();

    var body=document.body;
    if(body && window.MutationObserver){
      var timer=null;
      new MutationObserver(function(){
        clearTimeout(timer);
        timer=setTimeout(function(){
          restoreSidebar();
          updateActive();
        },80);
      }).observe(body,{childList:true,subtree:true});
    }

    setInterval(function(){
      if(!sidebarValid())restoreSidebar();
      else{bindSidebar();updateActive()}
    },1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('load',function(){setTimeout(boot,250)},{once:true});
  window.addEventListener('pageshow',function(){setTimeout(function(){restoreSidebar();updateActive()},60)});
})();