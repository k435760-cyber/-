/* V78 — actual feature consolidation */
(function(){
  'use strict';

  var GROUPS={
    study:{
      icon:'📚',title:'공부',desc:'정리·문제·시험을 세 화면으로 통합',
      modes:[
        {key:'practice',title:'문제·복습',desc:'문제풀이와 오답 복습을 한 화면에서',sections:[['problems','문제풀이'],['wrong-notes','오답 복습']]},
        {key:'plan',title:'시험·계획',desc:'시험 만들기와 공부 계획을 한 화면에서',sections:[['exam-maker','시험 만들기'],['study','공부 계획']]},
        {key:'notes',title:'노트',desc:'노트 작성과 PDF 학습',route:'notes'}
      ]
    },
    ai:{
      icon:'✨',title:'AI 학습',desc:'질문·문제·분석 세 가지로 통합',
      modes:[
        {key:'ask',title:'질문·설명',desc:'AI 질문과 설명 기능을 하나로',sections:[['ai-chat','AI 질문·설명']]},
        {key:'practice',title:'문제·채점',desc:'문제 생성과 답안 채점을 한 화면에서',sections:[['v21-qgen','AI 문제 생성'],['v21-grading','AI 채점']]},
        {key:'analysis',title:'오답·분석',desc:'오답 원인과 학습 분석을 한 화면에서',sections:[['v21-wronganalysis','오답 원인'],['ai-analysis','학습 분석']]}
      ]
    },
    school:{
      icon:'🏫',title:'학교',desc:'오늘·공지·소통 세 가지로 통합',
      modes:[
        {key:'today',title:'오늘',desc:'시간표·급식·준비물을 한 화면에서',sections:[['timetable','시간표'],['meal','급식'],['supplies','준비물']]},
        {key:'info',title:'공지',desc:'학교 공지를 한곳에서 확인',sections:[['notice','학교 공지']]},
        {key:'social',title:'소통',desc:'게시판·질문·채팅을 한 화면에서',sections:[['board','게시판'],['qa','질문답변'],['chat','채팅']]}
      ]
    },
    my:{
      icon:'🌱',title:'나의 공간',desc:'기록·성장·보상 세 가지로 통합',
      modes:[
        {key:'record',title:'기록·목표',desc:'목표와 학습 일기를 한 화면에서',sections:[['goals','목표'],['journal','학습 일기']]},
        {key:'growth',title:'성장',desc:'통계·연속학습·레벨을 한 화면에서',sections:[['weekly-stats','주간 통계'],['streak','연속 학습'],['level','레벨']]},
        {key:'reward',title:'보상',desc:'게임·상점·가방을 한 화면에서',sections:[['arcade-home','게임'],['shop','상점'],['bag','가방']]}
      ]
    }
  };

  var ROUTE_MAP={
    'problems':['study','practice'],'wrong-notes':['study','practice'],
    'exam-maker':['study','plan'],'study':['study','plan'],
    'concepts':['study','practice'],'concept-dex':['study','practice'],'story':['study','practice'],
    'resources':['study','notes'],'learning-path':['study','plan'],'timer':['study','plan'],'focus-sounds':['study','plan'],

    'ai-chat':['ai','ask'],'ai-tutor-phase1':['ai','ask'],
    'v21-qgen':['ai','practice'],'v21-grading':['ai','practice'],
    'v21-wronganalysis':['ai','analysis'],'ai-analysis':['ai','analysis'],

    'timetable':['school','today'],'meal':['school','today'],'supplies':['school','today'],
    'notice':['school','info'],'school-newsroom':['school','info'],
    'board':['school','social'],'qa':['school','social'],'chat':['school','social'],
    'study-group':['school','social'],'friend-feed':['school','social'],'poll':['school','social'],

    'goals':['my','record'],'journal':['my','record'],'calendar':['my','record'],'ai-records':['my','record'],
    'weekly-stats':['my','growth'],'streak':['my','growth'],'level':['my','growth'],'ranking':['my','growth'],
    'arcade-home':['my','reward'],'games':['my','reward'],'mini-arcade':['my','reward'],
    'shop':['my','reward'],'bag':['my','reward'],'random-events':['my','reward'],
    'savings':['my','reward'],'npc':['my','reward'],'capsule':['my','reward']
  };

  var nativeNavigate=null;
  var returnRoute='home';
  var mounted=[];
  var openState=null;
  var switching=false;

  function el(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}

  function currentRoute(){
    var main=document.getElementById('main-screen');
    if(!main)return 'home';
    var list=main.querySelectorAll('section[id^="view-"]');
    for(var i=0;i<list.length;i++){
      var x=list[i];
      if(!x.classList.contains('hidden') && x.offsetParent!==null && !x.classList.contains('v78-mounted')){
        return x.id.slice(5);
      }
    }
    return 'home';
  }

  function ensureWorkspace(){
    var old=document.getElementById('v78-workspace');if(old)return old;
    var root=el('div');root.id='v78-workspace';root.setAttribute('aria-hidden','true');
    var panel=el('div');panel.id='v78-workspace-panel';
    panel.innerHTML='<div class="v78-workspace-head"><div class="v78-head-row"><button type="button" class="v78-back" aria-label="닫기">‹</button><div class="v78-head-copy"><h2></h2><p></p></div></div><div class="v78-mode-tabs"></div></div><div id="v78-workspace-scroll"><div id="v78-workspace-content"></div></div>';
    root.appendChild(panel);document.body.appendChild(root);
    panel.querySelector('.v78-back').addEventListener('click',function(){closeWorkspace(true)});
    root.addEventListener('click',function(e){if(e.target===root)closeWorkspace(true)});
    return root;
  }

  function restoreMounted(){
    for(var i=mounted.length-1;i>=0;i--){
      var rec=mounted[i],node=rec.node;
      try{
        node.classList.remove('v78-mounted');
        if(rec.hadHidden)node.classList.add('hidden');else node.classList.remove('hidden');
        if(rec.next && rec.next.parentNode===rec.parent)rec.parent.insertBefore(node,rec.next);
        else rec.parent.appendChild(node);
      }catch(_){}
    }
    mounted=[];
  }

  function callNative(route){
    if(typeof nativeNavigate==='function'){
      try{return nativeNavigate.call(window,route)}catch(e){console.error('[V78 native navigate]',route,e)}
    }
  }

  async function mountSection(route,label,container){
    callNative(route);
    await wait(35);
    for(var mi=0;mi<mounted.length;mi++)mounted[mi].node.classList.remove('hidden');
    var node=document.getElementById('view-'+route);
    if(!node){
      var miss=el('div','v78-retired-note','이 기능은 통합 과정에서 제거되었어요.');
      container.appendChild(miss);
      return;
    }
    var parent=node.parentNode,next=node.nextSibling,hadHidden=node.classList.contains('hidden');
    mounted.push({node:node,parent:parent,next:next,hadHidden:hadHidden});
    var card=el('article','v78-module');
    var head=el('div','v78-module-head');head.innerHTML='<b></b>';head.querySelector('b').textContent=label;
    var body=el('div','v78-module-body');
    card.appendChild(head);card.appendChild(body);container.appendChild(card);
    body.appendChild(node);
    node.classList.remove('hidden');
    node.classList.add('v78-mounted');
    node.style.removeProperty('display');
  }

  function modeByKey(group,key){
    var modes=GROUPS[group].modes;
    for(var i=0;i<modes.length;i++)if(modes[i].key===key)return modes[i];
    return modes[0];
  }

  async function showMode(group,key){
    if(switching)return;
    switching=true;
    var g=GROUPS[group],mode=modeByKey(group,key);
    if(mode.route){
      switching=false;
      closeWorkspace(false);
      callNative(mode.route);
      return;
    }

    restoreMounted();
    openState={group:group,mode:mode.key};

    var root=ensureWorkspace(),panel=root.querySelector('#v78-workspace-panel');
    panel.querySelector('.v78-head-copy h2').textContent=g.icon+' '+g.title;
    panel.querySelector('.v78-head-copy p').textContent=g.desc;

    var tabs=panel.querySelector('.v78-mode-tabs');tabs.innerHTML='';
    g.modes.forEach(function(m){
      var b=el('button','v78-mode-btn'+(m.key===mode.key?' v78-active':''),m.title);b.type='button';
      b.addEventListener('click',function(){showMode(group,m.key)});tabs.appendChild(b);
    });

    var content=panel.querySelector('#v78-workspace-content');content.innerHTML='';
    var intro=el('div','v78-mode-intro');intro.innerHTML='<strong></strong><span></span>';intro.querySelector('strong').textContent=mode.title;intro.querySelector('span').textContent=mode.desc;content.appendChild(intro);
    var loading=el('div','v78-loading','통합 화면을 준비하는 중…');content.appendChild(loading);

    root.classList.add('v78-open');root.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';

    for(var i=0;i<mode.sections.length;i++)await mountSection(mode.sections[i][0],mode.sections[i][1],content);
    loading.remove();
    var sc=root.querySelector('#v78-workspace-scroll');if(sc)sc.scrollTop=0;
    switching=false;
  }

  function openWorkspace(group,key){
    if(!GROUPS[group])return;
    var root=ensureWorkspace();
    if(!root.classList.contains('v78-open'))returnRoute=currentRoute();
    showMode(group,key||GROUPS[group].modes[0].key);
  }

  function closeWorkspace(restoreRoute){
    restoreMounted();
    var root=document.getElementById('v78-workspace');
    if(root){root.classList.remove('v78-open');root.setAttribute('aria-hidden','true')}
    document.body.style.removeProperty('overflow');
    openState=null;switching=false;
    if(restoreRoute!==false && returnRoute)callNative(returnRoute);
  }

  function installNavigateWrapper(){
    var cur=window.navigate;
    if(!cur)return;
    if(cur.__v78Wrapped)return;
    nativeNavigate=cur;
    var wrapped=function(route){
      var key=String(route||'').replace(/^view-/,'');
      if(key==='notes'){
        closeWorkspace(false);
        return nativeNavigate.apply(this,arguments);
      }
      var map=ROUTE_MAP[key];
      if(map){openWorkspace(map[0],map[1]);return}
      closeWorkspace(false);
      return nativeNavigate.apply(this,arguments);
    };
    wrapped.__v78Wrapped=true;
    wrapped.__v78Native=nativeNavigate;
    window.navigate=wrapped;
  }

  function bindSidebar(){
    var aside=document.getElementById('main-sidebar');if(!aside)return;
    aside.querySelectorAll('[data-v78-group]').forEach(function(b){
      if(b.dataset.v78Bound)return;b.dataset.v78Bound='1';
      b.addEventListener('click',function(){openWorkspace(b.dataset.v78Group)});
    });
    aside.querySelectorAll('[data-v78-home]').forEach(function(b){
      if(b.dataset.v78Bound)return;b.dataset.v78Bound='1';
      b.addEventListener('click',function(){closeWorkspace(false);callNative('home');try{if(window.innerWidth<768&&typeof window.toggleSidebar==='function')window.toggleSidebar()}catch(_){}});
    });
    aside.querySelectorAll('[data-v78-collapse]').forEach(function(b){
      if(b.dataset.v78Bound)return;b.dataset.v78Bound='1';
      b.addEventListener('click',function(){try{if(typeof window.toggleSidebar==='function')window.toggleSidebar()}catch(_){}});
    });
  }

  function simplifyHome(){
    var view=document.getElementById('view-home');if(!view)return;
    view.classList.add('v78-home-simple');
    var old=document.getElementById('v78-home-core');if(old)return;
    var hero=view.querySelector(':scope > div');
    if(!hero)return;
    var box=el('div');box.id='v78-home-core';
    box.innerHTML='<div class="v78-home-title"><b>무엇을 할까요?</b><span>세부 기능 대신 목적만 고르세요</span></div><div class="v78-home-grid"></div>';
    var grid=box.querySelector('.v78-home-grid');
    [
      ['📚','공부','노트·문제·시험','study'],
      ['✨','AI 학습','질문·문제·분석','ai'],
      ['🏫','학교','오늘·공지·소통','school'],
      ['🌱','나의 공간','기록·성장·보상','my']
    ].forEach(function(a){
      var b=el('button','v78-home-btn');b.type='button';
      b.innerHTML='<span class="v78-home-icon"></span><strong></strong><small></small>';
      b.querySelector('.v78-home-icon').textContent=a[0];b.querySelector('strong').textContent=a[1];b.querySelector('small').textContent=a[2];
      b.addEventListener('click',function(){openWorkspace(a[3])});grid.appendChild(b);
    });
    hero.insertAdjacentElement('afterend',box);
  }

  function removeOldExperiments(){
    ['v75-feature-hub','v77-workspace','v75-home-start','v77-home-core','v66-home-focus'].forEach(function(id){var x=document.getElementById(id);if(x)x.remove()});
  }

  function boot(){
    ensureWorkspace();
    installNavigateWrapper();
    bindSidebar();
    removeOldExperiments();
    simplifyHome();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',function(){boot();setTimeout(boot,400)},{once:true});
  window.addEventListener('pageshow',function(){setTimeout(boot,60)});
  setInterval(function(){
    if(window.navigate && !window.navigate.__v78Wrapped)installNavigateWrapper();
    bindSidebar();
  },1000);
})();