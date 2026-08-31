/* V75 Feature Unification — reduce feature overload without deleting capability */
(function(){
  'use strict';

  var GROUPS=[
    {key:'study',icon:'📚',title:'공부하기',desc:'노트 · 문제 · 시험을 한곳에서',primary:[
      ['노트','notes'],['공부 계획','study'],['문제풀이','problems'],['오답','wrong-notes'],['시험 만들기','exam-maker'],['개념','concepts'],['자료실','resources']
    ]},
    {key:'ai',icon:'✨',title:'AI 도움',desc:'질문 · 채점 · 분석을 한곳에서',primary:[
      ['AI 학습 도우미','ai-chat'],['AI 개인 선생님','ai-tutor-phase1'],['AI 문제 생성','v21-qgen'],['서술형 채점','v21-grading'],['오답 원인 분석','v21-wronganalysis'],['학습 분석','ai-analysis'],['학습 경로','learning-path']
    ]},
    {key:'school',icon:'🏫',title:'학교 · 소통',desc:'학교 정보와 친구 소통을 묶어서',primary:[
      ['시간표','timetable'],['급식','meal'],['공지','notice'],['준비물','supplies'],['게시판','board'],['단톡방','chat'],['질문답변','qa'],['스터디 그룹','study-group']
    ]},
    {key:'growth',icon:'📈',title:'성장 · 기록',desc:'목표 · 통계 · 레벨을 한곳에서',primary:[
      ['목표','goals'],['학습 일기','journal'],['주간 통계','weekly-stats'],['연속 학습','streak'],['레벨','level'],['순위','ranking'],['AI 기록','ai-records'],['캘린더','calendar']
    ]},
    {key:'reward',icon:'🎮',title:'게임 · 보상',desc:'게임 · 상점 · 이벤트는 여기서',primary:[
      ['게임센터','arcade-home'],['미니게임','games'],['상점','shop'],['내 가방','bag'],['이벤트','random-events'],['포인트','savings'],['오늘의 미션','npc'],['타임캡슐','capsule']
    ]}
  ];

  var EXTRAS=[
    ['집중 타이머','timer','도구'],['집중 음악','focus-sounds','도구'],['알림 센터','notifications','도구'],['프로필','profile-hub','계정'],
    ['학교 뉴스룸','school-newsroom','학교'],['친구 활동','friend-feed','소통'],['익명 투표','poll','소통'],['피드백','feedback','지원'],['이의신청','appeal','지원'],
    ['개념 도감','concept-dex','학습'],['스토리 학습','story','학습'],['학습 게임','mini-arcade','게임'],['새 기능','new-features','기타']
  ];

  function go(route){
    closeHub();
    try{ if(typeof window.navigate==='function') window.navigate(route); }
    catch(e){ console.error('[V75 navigate]',e); }
    try{ if(window.innerWidth<768 && typeof window.toggleSidebar==='function') window.toggleSidebar(); }catch(_){}
  }

  function create(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el}

  function ensureHub(){
    var old=document.getElementById('v75-feature-hub'); if(old)return old;
    var hub=create('div');hub.id='v75-feature-hub';hub.setAttribute('aria-hidden','true');
    var panel=create('div');panel.id='v75-feature-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','통합 기능');

    var head=create('div','v75-hub-head');
    var titleBox=create('div');titleBox.innerHTML='<h2>무엇을 하려나요?</h2><p>기능 이름 대신 목표를 고르면 돼요. 자주 쓰는 기능만 먼저 보여줘요.</p>';
    var close=create('button','v75-close','✕');close.type='button';close.addEventListener('click',closeHub);
    head.appendChild(titleBox);head.appendChild(close);panel.appendChild(head);

    var sw=create('div','v75-search-wrap');var input=create('input','v75-search');input.type='search';input.placeholder='기능 검색: 오답, 급식, 채점, 게임…';input.setAttribute('aria-label','기능 검색');sw.appendChild(input);panel.appendChild(sw);

    var grid=create('div','v75-goal-grid');grid.id='v75-goal-grid';
    GROUPS.forEach(function(g){
      var card=create('div','v75-goal');card.dataset.v75Search=(g.title+' '+g.desc+' '+g.primary.map(function(x){return x[0]}).join(' ')).toLowerCase();
      var top=create('div','v75-goal-top');var ico=create('span','v75-goal-icon',g.icon);var copy=create('div');var t=create('div','v75-goal-title',g.title);var d=create('span','v75-goal-desc',g.desc);copy.appendChild(t);copy.appendChild(d);top.appendChild(ico);top.appendChild(copy);card.appendChild(top);
      var acts=create('div','v75-goal-actions');
      g.primary.forEach(function(item){var b=create('button','v75-chip',item[0]);b.type='button';b.dataset.route=item[1];b.addEventListener('click',function(){go(item[1])});acts.appendChild(b)});
      card.appendChild(acts);grid.appendChild(card);
    });
    panel.appendChild(grid);

    var more=create('details','v75-more');var sum=create('summary',null,'기타 기능 보기');more.appendChild(sum);var eg=create('div','v75-extra-grid');
    EXTRAS.forEach(function(item){var b=create('button','v75-extra');b.type='button';b.dataset.v75Search=(item[0]+' '+item[2]).toLowerCase();b.innerHTML='<span></span><small></small>';b.querySelector('span').textContent=item[0];b.querySelector('small').textContent=item[2];b.addEventListener('click',function(){go(item[1])});eg.appendChild(b)});more.appendChild(eg);panel.appendChild(more);
    var empty=create('div','v75-empty','검색 결과가 없어요. 다른 단어로 찾아보세요.');panel.appendChild(empty);

    input.addEventListener('input',function(){
      var q=input.value.trim().toLowerCase(),shown=0;
      panel.querySelectorAll('[data-v75-search]').forEach(function(el){var ok=!q||el.dataset.v75Search.indexOf(q)>=0;el.style.display=ok?'':'none';if(ok)shown++});
      if(q)more.open=true;empty.style.display=shown?'none':'block';
    });

    panel.addEventListener('click',function(e){e.stopPropagation()});hub.addEventListener('click',closeHub);hub.appendChild(panel);document.body.appendChild(hub);return hub;
  }

  function openHub(pref){
    var hub=ensureHub();hub.classList.add('v75-open');hub.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    var inp=hub.querySelector('.v75-search');if(inp){inp.value=pref||'';inp.dispatchEvent(new Event('input'));setTimeout(function(){inp.focus()},50)}
  }
  function closeHub(){var hub=document.getElementById('v75-feature-hub');if(hub){hub.classList.remove('v75-open');hub.setAttribute('aria-hidden','true')}document.body.style.removeProperty('overflow')}
  window.v75OpenFeatureHub=openHub;window.v75CloseFeatureHub=closeHub;

  function navBtn(icon,title,sub,handler,extra){var b=create('button','v75-nav-btn'+(extra?' '+extra:''));b.type='button';b.innerHTML='<span class="v75-nav-ico"></span><span class="v75-nav-copy"><span class="v75-nav-title"></span><span class="v75-nav-sub"></span></span><span class="v75-nav-chevron">›</span>';b.querySelector('.v75-nav-ico').textContent=icon;b.querySelector('.v75-nav-title').textContent=title;b.querySelector('.v75-nav-sub').textContent=sub;b.addEventListener('click',handler);return b}

  function bindStaticSidebar(){
    var aside=document.getElementById('main-sidebar');if(!aside)return;
    aside.querySelectorAll('[data-v75-route]').forEach(function(b){
      if(b.dataset.v75Bound)return;
      b.dataset.v75Bound='1';
      b.addEventListener('click',function(){go(b.dataset.v75Route)});
    });
    aside.querySelectorAll('[data-v75-hub]').forEach(function(b){
      if(b.dataset.v75Bound)return;
      b.dataset.v75Bound='1';
      b.addEventListener('click',function(){openHub(b.dataset.v75Hub||'')});
    });
    aside.querySelectorAll('[data-v75-collapse]').forEach(function(b){
      if(b.dataset.v75Bound)return;
      b.dataset.v75Bound='1';
      b.addEventListener('click',function(){
        try{if(typeof window.toggleSidebar==='function')window.toggleSidebar()}catch(_){}
      });
    });
  }

  function isUnifiedSidebar(){
    var aside=document.getElementById('main-sidebar');if(!aside)return false;
    var nav=aside.querySelector('nav');if(!nav)return false;
    if(nav.dataset.v77Unified==='1') return true;
    return nav.classList.contains('v75-simple-nav') &&
      nav.dataset.v75Unified==='1' &&
      nav.querySelectorAll(':scope > .v75-nav-btn').length===GROUPS.length+2;
  }

  function simplifySidebar(){
    var aside=document.getElementById('main-sidebar');if(!aside)return false;
    var nav=aside.querySelector('nav');if(!nav)return false;
    if(nav.dataset.v77Unified==='1') return true;
    if(isUnifiedSidebar()){bindStaticSidebar();return true;}

    nav.innerHTML='';
    nav.className='v75-simple-nav';
    nav.dataset.v75Unified='1';

    var home=navBtn('⌂','홈','오늘 정보만 한눈에',function(){go('home')},'v75-nav-home');
    home.id='nav-home';
    nav.appendChild(home);

    GROUPS.forEach(function(g){
      nav.appendChild(navBtn(
        g.icon,
        g.title,
        g.desc,
        function(){openHub(g.title.split(' ')[0])},
        g.key==='study'?'v75-nav-primary':''
      ));
    });

    nav.appendChild(navBtn('☰','전체 기능','필요할 때만 모두 보기',function(){openHub('')},''));
    aside.dataset.v75Simple='1';
    bindStaticSidebar();
    return true;
  }

  var sidebarObserver=null;
  var sidebarRepairTimer=null;

  function watchSidebar(){
    var aside=document.getElementById('main-sidebar');
    if(!aside){setTimeout(watchSidebar,250);return;}

    if(sidebarObserver)sidebarObserver.disconnect();
    sidebarObserver=new MutationObserver(function(){
      if(isUnifiedSidebar())return;
      clearTimeout(sidebarRepairTimer);
      sidebarRepairTimer=setTimeout(simplifySidebar,30);
    });
    sidebarObserver.observe(aside,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

    simplifySidebar();
  }

  function simplifyHome(){
    var view=document.getElementById('view-home');if(!view||document.getElementById('v75-home-start'))return;
    view.classList.add('v75-home-simple');
    var hero=document.getElementById('home-greeting');var heroCard=hero&&hero.closest('.rounded-3xl');if(!heroCard)return;
    var box=create('div');box.id='v75-home-start';box.innerHTML='<div class="v75-home-head"><b>지금 뭐 할까요?</b><span>4가지만 먼저 보여드려요</span></div><div class="v75-home-grid"></div><button id="v75-home-toggle" type="button">오늘 정보 펼치기 ▾</button>';
    var grid=box.querySelector('.v75-home-grid');
    [
      ['📚','공부 시작','노트 · 문제 · 시험',function(){openHub('공부')}],
      ['✨','AI 도움','질문 · 채점 · 오답',function(){openHub('AI')}],
      ['🏫','학교 확인','시간표 · 급식 · 공지',function(){openHub('학교')}],
      ['☰','전체 기능','필요한 기능 검색',function(){openHub('')}]
    ].forEach(function(x){var b=create('button','v75-home-action');b.type='button';b.innerHTML='<span class="v75-ha-icon"></span><strong></strong><small></small>';b.querySelector('.v75-ha-icon').textContent=x[0];b.querySelector('strong').textContent=x[1];b.querySelector('small').textContent=x[2];b.addEventListener('click',x[3]);grid.appendChild(b)});
    var tog=box.querySelector('#v75-home-toggle');tog.addEventListener('click',function(){var on=view.classList.toggle('v75-show-details');tog.textContent=on?'오늘 정보 접기 ▴':'오늘 정보 펼치기 ▾'});
    heroCard.insertAdjacentElement('afterend',box);
  }

  function removeV66HomeFocus(){var el=document.getElementById('v66-home-focus');if(el)el.remove()}

  function boot(){simplifySidebar();bindStaticSidebar();watchSidebar();removeV66HomeFocus();simplifyHome();ensureHub();try{if(window.lucide&&window.lucide.createIcons)window.lucide.createIcons()}catch(_){} }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',function(){boot();setTimeout(boot,400)},{once:true});
  window.addEventListener('pageshow',function(){setTimeout(simplifySidebar,50)});
  setInterval(function(){if(!isUnifiedSidebar())simplifySidebar()},900);
})();
