/* V77 — deep feature consolidation */
(function(){
  'use strict';

  var GROUPS={
    study:{
      icon:'📚',title:'공부',desc:'노트·문제·시험을 한 화면에서',
      primary:[
        ['📝','노트','정리하고 다시 보기','notes'],
        ['🧠','문제·오답','문제 풀고 틀린 것 복습','problems'],
        ['🗓️','시험·계획','시험 준비와 공부 계획','exam-maker']
      ],
      secondary:[
        ['공부 계획','study'],['오답 노트','wrong-notes'],['개념','concepts'],['자료실','resources'],['집중 타이머','timer'],['집중 음악','focus-sounds']
      ]
    },
    ai:{
      icon:'✨',title:'AI 학습',desc:'질문·채점·분석을 하나로',
      primary:[
        ['💬','질문·설명','모르는 내용을 바로 질문','ai-chat'],
        ['✅','문제·채점','문제 생성과 답안 채점','v21-qgen'],
        ['🔎','오답·분석','틀린 이유와 학습 방향 분석','v21-wronganalysis']
      ],
      secondary:[
        ['AI 개인 선생님','ai-tutor-phase1'],['서술형 채점','v21-grading'],['학습 분석','ai-analysis'],['학습 경로','learning-path'],['AI 기록','ai-records']
      ]
    },
    school:{
      icon:'🏫',title:'학교',desc:'오늘 학교생활과 소통을 하나로',
      primary:[
        ['📅','오늘 학교','시간표·급식·준비물 확인','timetable'],
        ['📢','공지·자료','공지와 학교 자료 확인','notice'],
        ['💬','친구·질문','게시판과 질문·답변','board']
      ],
      secondary:[
        ['급식','meal'],['준비물','supplies'],['단톡방','chat'],['질문답변','qa'],['스터디 그룹','study-group'],['학교 뉴스룸','school-newsroom'],['친구 활동','friend-feed']
      ]
    },
    my:{
      icon:'🌱',title:'나의 공간',desc:'성장 기록과 보상을 한곳에서',
      primary:[
        ['🎯','목표·기록','목표와 학습 일기 관리','goals'],
        ['📊','통계·성장','통계·연속학습·레벨 확인','weekly-stats'],
        ['🎮','보상·게임','게임·상점·이벤트','arcade-home']
      ],
      secondary:[
        ['학습 일기','journal'],['연속 학습','streak'],['레벨','level'],['순위','ranking'],['캘린더','calendar'],
        ['상점','shop'],['내 가방','bag'],['이벤트','random-events'],['포인트','savings'],['오늘의 미션','npc'],['타임캡슐','capsule']
      ]
    }
  };

  var MORE=[
    ['알림 센터','notifications','도구'],['프로필','profile-hub','계정'],['개념 도감','concept-dex','학습'],
    ['스토리 학습','story','학습'],['익명 투표','poll','소통'],['피드백','feedback','지원'],
    ['이의신청','appeal','지원'],['새 기능','new-features','기타'],['학습 게임','mini-arcade','게임']
  ];

  function go(route){
    closeWorkspace();
    try{
      if(typeof window.navigate==='function') window.navigate(route);
      else if(typeof navigate==='function') navigate(route);
    }catch(e){console.error('[V77 navigate]',e)}
    try{if(window.innerWidth<768&&typeof window.toggleSidebar==='function')window.toggleSidebar()}catch(_){}
  }

  function el(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x}

  function ensureWorkspace(){
    var old=document.getElementById('v77-workspace');if(old)return old;
    var root=el('div');root.id='v77-workspace';root.setAttribute('aria-hidden','true');
    var panel=el('div');panel.id='v77-workspace-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');

    root.addEventListener('click',closeWorkspace);panel.addEventListener('click',function(e){e.stopPropagation()});
    root.appendChild(panel);document.body.appendChild(root);
    return root;
  }

  function renderGroup(key){
    var g=GROUPS[key];if(!g)return renderMore();
    var root=ensureWorkspace(),panel=root.querySelector('#v77-workspace-panel');panel.innerHTML='';

    var head=el('div','v77-head');
    var copy=el('div');copy.innerHTML='<h2></h2><p></p>';copy.querySelector('h2').textContent=g.icon+' '+g.title;copy.querySelector('p').textContent=g.desc;
    var close=el('button','v77-close','✕');close.type='button';close.addEventListener('click',closeWorkspace);head.appendChild(copy);head.appendChild(close);panel.appendChild(head);

    var grid=el('div','v77-primary-grid');
    g.primary.forEach(function(a){
      var b=el('button','v77-primary');b.type='button';
      b.innerHTML='<span class="v77-primary-icon"></span><strong></strong><small></small>';
      b.querySelector('.v77-primary-icon').textContent=a[0];b.querySelector('strong').textContent=a[1];b.querySelector('small').textContent=a[2];
      b.addEventListener('click',function(){go(a[3])});grid.appendChild(b);
    });
    panel.appendChild(grid);

    var details=el('details','v77-secondary');var sum=el('summary',null,'세부 기능 보기');details.appendChild(sum);var sg=el('div','v77-secondary-grid');
    g.secondary.forEach(function(a){var b=el('button','v77-secondary-btn',a[0]);b.type='button';b.addEventListener('click',function(){go(a[1])});sg.appendChild(b)});
    details.appendChild(sg);panel.appendChild(details);

    root.classList.add('v77-open');root.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }

  function allFeatures(){
    var out=[];
    Object.keys(GROUPS).forEach(function(k){
      var g=GROUPS[k];
      g.primary.forEach(function(a){out.push([a[1],a[3],g.title])});
      g.secondary.forEach(function(a){out.push([a[0],a[1],g.title])});
    });
    MORE.forEach(function(a){out.push(a)});
    return out;
  }

  function renderMore(){
    var root=ensureWorkspace(),panel=root.querySelector('#v77-workspace-panel');panel.innerHTML='';
    var head=el('div','v77-head');var copy=el('div');copy.innerHTML='<h2>☰ 더보기</h2><p>평소엔 숨겨두고 필요할 때만 검색하세요.</p>';var close=el('button','v77-close','✕');close.type='button';close.addEventListener('click',closeWorkspace);head.appendChild(copy);head.appendChild(close);panel.appendChild(head);

    var row=el('div','v77-search-row'),input=el('input','v77-search'),btn=el('button','v77-search-btn','검색');input.type='search';input.placeholder='예: 타이머, 순위, 상점, 피드백';row.appendChild(input);row.appendChild(btn);panel.appendChild(row);
    var results=el('div','v77-secondary-grid');results.style.marginTop='10px';panel.appendChild(results);

    function draw(){
      var q=input.value.trim().toLowerCase();results.innerHTML='';
      if(!q){MORE.slice(0,6).forEach(add);return}
      allFeatures().filter(function(a){return (a[0]+' '+a[2]).toLowerCase().indexOf(q)>=0}).slice(0,12).forEach(add);
    }
    function add(a){var b=el('button','v77-secondary-btn');b.type='button';b.innerHTML='<span></span><small></small>';b.querySelector('span').textContent=a[0];b.querySelector('small').textContent=a[2]||'';b.addEventListener('click',function(){go(a[1])});results.appendChild(b)}
    btn.addEventListener('click',draw);input.addEventListener('input',draw);input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();draw()}});draw();

    root.classList.add('v77-open');root.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(function(){input.focus()},50);
  }

  function closeWorkspace(){var r=document.getElementById('v77-workspace');if(r){r.classList.remove('v77-open');r.setAttribute('aria-hidden','true')}document.body.style.removeProperty('overflow')}
  window.v77OpenWorkspace=renderGroup;window.v77OpenMore=renderMore;window.v77CloseWorkspace=closeWorkspace;

  function bindSidebar(){
    var aside=document.getElementById('main-sidebar');if(!aside)return;
    aside.querySelectorAll('[data-v77-group]').forEach(function(b){if(b.dataset.v77Bound)return;b.dataset.v77Bound='1';b.addEventListener('click',function(){renderGroup(b.dataset.v77Group)})});
    aside.querySelectorAll('[data-v77-more]').forEach(function(b){if(b.dataset.v77Bound)return;b.dataset.v77Bound='1';b.addEventListener('click',renderMore)});
    aside.querySelectorAll('[data-v75-route]').forEach(function(b){if(b.dataset.v77RouteBound)return;b.dataset.v77RouteBound='1';b.addEventListener('click',function(){go(b.dataset.v75Route)})});
  }

  function simplifyHome(){
    var view=document.getElementById('view-home');if(!view||document.getElementById('v77-home-core'))return;
    var hero=document.getElementById('home-greeting'),heroCard=hero&&hero.closest('.rounded-3xl');if(!heroCard)return;
    var box=el('div');box.id='v77-home-core';box.innerHTML='<div class="v77-home-title"><b>지금 할 일</b><span>핵심 기능만 보여줘요</span></div><div class="v77-home-grid"></div>';
    var grid=box.querySelector('.v77-home-grid');
    [
      ['📚','공부','노트·문제·시험',function(){renderGroup('study')}],
      ['✨','AI 학습','질문·채점·분석',function(){renderGroup('ai')}],
      ['🏫','학교','시간표·급식·소통',function(){renderGroup('school')}],
      ['🌱','나의 공간','기록·통계·보상',function(){renderGroup('my')}]
    ].forEach(function(a){var b=el('button','v77-home-btn');b.type='button';b.innerHTML='<span></span><strong></strong><small></small>';b.querySelector('span').textContent=a[0];b.querySelector('strong').textContent=a[1];b.querySelector('small').textContent=a[2];b.addEventListener('click',a[3]);grid.appendChild(b)});
    heroCard.insertAdjacentElement('afterend',box);
  }

  function removeOldHome(){var a=document.getElementById('v75-home-start');if(a)a.remove();var b=document.getElementById('v66-home-focus');if(b)b.remove()}

  function boot(){ensureWorkspace();bindSidebar();removeOldHome();simplifyHome()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',function(){boot();setTimeout(boot,350)},{once:true});
  window.addEventListener('pageshow',function(){setTimeout(bindSidebar,50)});
  setInterval(bindSidebar,1200);
})();