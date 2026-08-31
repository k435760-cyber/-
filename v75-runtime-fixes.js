/* V75-runtime-fixes
   Restores the PDF layout helper that was accidentally embedded inside the
   arcade HTML string and completes V66 PDF status transitions. */
(function(){
  'use strict';

  function nwFixPdfNoteLayout(){
    try{
      var shell=document.querySelector('.study-note-shell.note-app-mode');
      if(!shell)return;
      var paper=document.getElementById('study-note-paper');
      var bar=shell.querySelector('.study-note-toolbar');
      if(paper)paper.scrollLeft=0;
      if(bar)bar.scrollLeft=0;
      document.documentElement.scrollLeft=0;
      document.body.scrollLeft=0;
    }catch(e){
      if(window.__NW_DEBUG)console.debug(e);
    }
  }
  window.nwFixPdfNoteLayout=nwFixPdfNoteLayout;

  function bindPdfLayoutWatch(){
    var paper=document.getElementById('study-note-paper');
    if(paper&&!paper.dataset.pdfLayoutWatch){
      paper.dataset.pdfLayoutWatch='1';
      var was=paper.classList.contains('has-pdf');
      new MutationObserver(function(){
        var now=paper.classList.contains('has-pdf');
        if(now&&!was){
          requestAnimationFrame(nwFixPdfNoteLayout);
          setTimeout(nwFixPdfNoteLayout,80);
          setTimeout(nwFixPdfNoteLayout,350);
        }
        was=now;
      }).observe(paper,{attributes:true,attributeFilter:['class']});
    }

    var input=document.getElementById('study-note-pdf-input');
    if(input&&!input.dataset.pdfLayoutReset){
      input.dataset.pdfLayoutReset='1';
      input.addEventListener('change',function(){
        setTimeout(nwFixPdfNoteLayout,100);
        setTimeout(nwFixPdfNoteLayout,500);
      });
    }
  }

  function reportPdfStage(holder){
    if(!holder||!holder.dataset)return;
    var stage=holder.dataset.pdfStage||'';
    if(!stage||holder.dataset.v75SeenPdfStage===stage)return;
    holder.dataset.v75SeenPdfStage=stage;

    if(typeof window.v66SetStatus!=='function')return;
    if(stage==='ready'){
      window.v66SetStatus('PDF 미리보기 준비 완료','saved');
    }else if(stage==='fallback'){
      window.v66SetStatus('PDF 미리보기를 열지 못했어요. 다시 시도할 수 있어요.','error');
    }
  }

  var pdfStageObserver=null;
  function bindPdfStageWatch(){
    if(pdfStageObserver)return;
    pdfStageObserver=new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        if(m.type==='attributes'&&m.attributeName==='data-pdf-stage'){
          reportPdfStage(m.target);
        }
        if(m.type==='childList'){
          Array.prototype.forEach.call(m.addedNodes||[],function(node){
            if(!node||node.nodeType!==1)return;
            if(node.matches&&node.matches('[data-pdf-stage]'))reportPdfStage(node);
            if(node.querySelectorAll){
              node.querySelectorAll('[data-pdf-stage]').forEach(reportPdfStage);
            }
          });
        }
      });
    });
    pdfStageObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-pdf-stage']});
  }

  function bind(){
    bindPdfLayoutWatch();
    bindPdfStageWatch();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();

  window.addEventListener('load',function(){
    bind();
    nwFixPdfNoteLayout();
  },{once:true});

  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#view-notes'))setTimeout(bindPdfLayoutWatch,0);
  },true);

  window.addEventListener('resize',function(){
    if(document.body.classList.contains('study-note-app-open'))requestAnimationFrame(nwFixPdfNoteLayout);
  },{passive:true});
})();
