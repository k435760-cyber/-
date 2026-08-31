/* ==========================================================================
   V74 · PDF 미리보기 멈춤 + UI 흔들림 + 과도한 스크롤 통합 수정 (JS)
   ==========================================================================
   [핵심 버그]
   index.html 의 ensurePdfJs() 는 첫 줄에서
       if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
   로 즉시 반환한다. 이 경로에서는 GlobalWorkerOptions.workerSrc 를
   설정하지 않는다.

   그런데 12초 타임아웃이 먼저 터진 뒤(느린 CDN) 스크립트가 뒤늦게 실행되면
   window.pdfjsLib 는 채워지지만 workerSrc 는 영영 빈 문자열로 남는다.
   workerSrc 가 비어 있으면 pdf.js 는 "fake worker" 로 폴백해서
   PDF 파싱을 메인 스레드에서 수행한다.
   → 큰 PDF에서 메인 스레드가 통째로 멈추고,
     setTimeout 기반 워치독(8.5초/12초)조차 실행되지 못해
     "PDF 미리보기를 준비하는 중…" 에서 영구히 정지한다.
   (기존 script[data-nw-pdfjs] 재사용 분기도 이미 load된 스크립트에
    리스너만 달아 영원히 resolve 되지 않는 같은 결함이 있다.)
   ========================================================================== */
(function () {
  'use strict';

  var PDFJS_VER = '3.11.174';
  var PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.min.js';
  var PDF_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.worker.min.js';

  var log = function () { if (window.__NW_DEBUG) console.log.apply(console, ['[V74]'].concat([].slice.call(arguments))); };

  /* ----------------------------------------------------------------------
     1. pdf.js 워커 강제 설정 (fake worker 폴백 차단)
     ---------------------------------------------------------------------- */
  var workerReady = false;
  var workerBlobUrl = '';

  function makeWorkerBlobUrl() {
    if (workerBlobUrl) return workerBlobUrl;
    try {
      var blob = new Blob(['importScripts(' + JSON.stringify(PDF_WORKER_URL) + ');'],
        { type: 'application/javascript' });
      workerBlobUrl = URL.createObjectURL(blob);
    } catch (_) { workerBlobUrl = ''; }
    return workerBlobUrl;
  }

  function applyWorkerSrc() {
    if (!window.pdfjsLib || !window.pdfjsLib.GlobalWorkerOptions) return false;
    var opts = window.pdfjsLib.GlobalWorkerOptions;
    if (workerReady && opts.workerSrc) return true;

    // 1순위: 동일 출처 blob 워커 (CDN 교차 출처 Worker 제한 우회)
    var blobUrl = makeWorkerBlobUrl();
    if (blobUrl) {
      try {
        var probe = new Worker(blobUrl);
        probe.terminate();
        opts.workerSrc = blobUrl;
        workerReady = true;
        log('worker = blob wrapper');
        return true;
      } catch (e) { log('blob worker 실패', e); }
    }

    // 2순위: CDN 직접 지정 (pdf.js 내부 createCDNWrapper 경유)
    try {
      opts.workerSrc = PDF_WORKER_URL;
      workerReady = true;
      log('worker = cdn url');
      return true;
    } catch (_) { }
    return false;
  }

  var libPromise = null;

  function ensurePdfJsV74() {
    // 이미 로드되어 있어도 workerSrc 는 매번 보증한다 (원래 코드의 핵심 결함)
    if (window.pdfjsLib) {
      applyWorkerSrc();
      return Promise.resolve(window.pdfjsLib);
    }
    if (libPromise) return libPromise;

    libPromise = new Promise(function (resolve, reject) {
      var settled = false;
      var timer = null;

      function done(ok, err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (ok && window.pdfjsLib) {
          applyWorkerSrc();
          resolve(window.pdfjsLib);
          return;
        }
        libPromise = null;
        reject(err || new Error('PDF 기능을 불러오지 못했습니다.'));
      }

      // 스크립트가 늦게 도착해 pdfjsLib 만 채워지는 경우도 회수한다
      var poll = setInterval(function () {
        if (window.pdfjsLib) { clearInterval(poll); done(true); }
      }, 120);

      timer = setTimeout(function () {
        clearInterval(poll);
        if (window.pdfjsLib) return done(true);
        done(false, new Error('PDF 모듈을 불러오는 데 시간이 오래 걸립니다. 네트워크를 확인해주세요.'));
      }, 15000);

      var existing = document.querySelector('script[data-nw-pdfjs="1"], script[data-v74-pdfjs="1"]');
      if (existing) {
        // 이미 load 끝난 스크립트에 리스너만 달면 영원히 안 온다 → poll 이 회수
        existing.addEventListener('load', function () { clearInterval(poll); done(true); }, { once: true });
        existing.addEventListener('error', function () {
          try { existing.remove(); } catch (_) { }
        }, { once: true });
        return;
      }

      var sc = document.createElement('script');
      sc.src = PDF_LIB_URL;
      sc.async = true;
      sc.dataset.nwPdfjs = '1';
      sc.dataset.v74Pdfjs = '1';
      sc.onload = function () { clearInterval(poll); done(true); };
      sc.onerror = function () {
        clearInterval(poll);
        try { sc.remove(); } catch (_) { }
        done(false, new Error('PDF 모듈을 내려받지 못했습니다.'));
      };
      document.head.appendChild(sc);
    });

    return libPromise;
  }

  window.ensurePdfJs = ensurePdfJsV74;
  window.__v74EnsurePdfWorker = applyWorkerSrc;

  // pdfjsLib 가 나중에 들어와도 workerSrc 를 놓치지 않게 감시
  var guard = setInterval(function () {
    if (window.pdfjsLib) { applyWorkerSrc(); if (workerReady) clearInterval(guard); }
  }, 400);
  setTimeout(function () { clearInterval(guard); }, 60000);

  /* ----------------------------------------------------------------------
     2. 멈춘 미리보기 자동 복구 워치독
     원래 워치독은 setTimeout 하나뿐이라, holder 가 교체되거나
     seq 가 어긋나면 조용히 사라져 "준비 중"이 영구히 남는다.
     ---------------------------------------------------------------------- */
  var BUSY = { download: 1, decode: 1, connect: 1, opening: 1, queued: 1, retry: 1, refresh: 1, render: 1 };
  var STUCK_MS = 22000;
  var seen = new WeakMap();

  function recover(holder) {
    var id = (holder.id || '').replace('study-note-pdf-pages-', '');
    holder.dataset.pdfStage = 'fallback';
    holder.innerHTML =
      '<div class="study-note-pdf-status" data-pdf-fallback="1">' +
      '<div>PDF 미리보기 준비가 너무 오래 걸려 중단했습니다.</div>' +
      '<div class="study-note-pdf-status-actions">' +
      '<button type="button" class="study-note-pdf-retry" data-onclick="retryStudyNotePdfPreview(' + Number(id) + ')">다시 시도</button>' +
      '</div>' +
      '<span class="v74-pdf-hint">PDF 원본은 안전하게 저장되어 있습니다. 네트워크가 불안정하면 잠시 후 다시 시도해주세요.</span>' +
      '</div>';
    try { window.v66SetStatus && window.v66SetStatus('PDF 미리보기를 중단했어요.', 'error'); } catch (_) { }
    log('stuck preview recovered', id);
  }

  setInterval(function () {
    var list = document.querySelectorAll('.study-note-pdf-pages');
    if (!list.length) return;
    var now = Date.now();
    for (var i = 0; i < list.length; i++) {
      var h = list[i];
      var stage = h.dataset.pdfStage || '';
      if (!BUSY[stage]) { seen.delete(h); continue; }
      var rec = seen.get(h);
      if (!rec || rec.stage !== stage) { seen.set(h, { stage: stage, at: now }); continue; }
      if (now - rec.at > STUCK_MS) { seen.delete(h); recover(h); }
    }
  }, 2000);

  /* ----------------------------------------------------------------------
     3. v66 상태 알림(HUD)이 hold=true 로 영구히 떠 있는 문제
        PDF 단계가 끝나면 자동으로 닫는다.
     ---------------------------------------------------------------------- */
  function hideHud() {
    var el = document.getElementById('v66-status-hud');
    if (el) el.classList.remove('show');
  }
  setInterval(function () {
    var busy = document.querySelector('.study-note-pdf-pages[data-pdf-stage="download"],' +
      '.study-note-pdf-pages[data-pdf-stage="decode"],' +
      '.study-note-pdf-pages[data-pdf-stage="connect"],' +
      '.study-note-pdf-pages[data-pdf-stage="opening"]');
    if (!busy) hideHud();
  }, 1500);

  /* ----------------------------------------------------------------------
     4. v66 하단 dock 제거 (footer 와 겹쳐 바가 튀는 원인)
     ---------------------------------------------------------------------- */
  function killDock() {
    var d = document.getElementById('v66-mobile-dock');
    if (d && d.parentNode) d.parentNode.removeChild(d);
  }
  killDock();
  setInterval(killDock, 1200);

  /* ----------------------------------------------------------------------
     5. 실제 툴바 높이를 --v74-footer-h 로 노출 → padding 계산이 어긋나지 않게
     ---------------------------------------------------------------------- */
  var rafH = 0;
  function syncFooterHeight() {
    cancelAnimationFrame(rafH);
    rafH = requestAnimationFrame(function () {
      var f = document.querySelector('.study-note-shell.note-app-mode .study-note-footer');
      var h = f ? Math.round(f.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--v74-footer-h', (h > 0 ? h : 56) + 'px');
    });
  }
  syncFooterHeight();
  window.addEventListener('resize', syncFooterHeight, { passive: true });
  try {
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(syncFooterHeight);
      var attach = setInterval(function () {
        var f = document.querySelector('.study-note-shell.note-app-mode .study-note-footer');
        if (f && !f.dataset.v74Ro) { f.dataset.v74Ro = '1'; ro.observe(f); }
      }, 1000);
      setTimeout(function () { clearInterval(attach); }, 120000);
    }
  } catch (_) { }

  /* ----------------------------------------------------------------------
     6. 키보드 열림 감지 → body.nw-kb-open
        (fixed 툴바가 키보드 밑으로 숨거나 위아래로 튀는 것 방지)
     ---------------------------------------------------------------------- */
  var vv = window.visualViewport;
  var baseH = vv ? vv.height : window.innerHeight;
  function syncKb() {
    if (!vv) return;
    baseH = Math.max(baseH, vv.height);
    var open = (baseH - vv.height) > 140;
    document.body.classList.toggle('nw-kb-open', open);
    document.documentElement.style.setProperty('--nw-vv-height', Math.round(vv.height) + 'px');
    syncFooterHeight();
  }
  if (vv) {
    vv.addEventListener('resize', syncKb, { passive: true });
    vv.addEventListener('scroll', syncKb, { passive: true });
    window.addEventListener('orientationchange', function () {
      baseH = vv.height; setTimeout(syncKb, 250);
    }, { passive: true });
    syncKb();
  }

  /* ----------------------------------------------------------------------
     7. PDF 첨부 후 "가상 페이지(용지)" 레이어가 560~980px 빈 종이를
        남겨두는 문제 → has-pdf 전환 시 레이어를 다시 계산시킨다.
     ---------------------------------------------------------------------- */
  function relayoutPages() {
    try {
      if (typeof window.renderStudyNotePageStyleLayer === 'function') {
        window.renderStudyNotePageStyleLayer();
      }
    } catch (_) { }
    var wrap = document.getElementById('study-note-edit-wrap');
    var paper = document.getElementById('study-note-paper');
    if (wrap && paper && paper.classList.contains('has-pdf')) {
      wrap.classList.remove('study-note-paged');
      wrap.style.removeProperty('--study-note-paged-height');
      wrap.style.removeProperty('--study-note-body-paged-height');
      paper.classList.remove('study-note-paged-paper');
      var layer = document.getElementById('study-note-page-bg-layer');
      var body = document.getElementById('study-note-body');
      if (layer && body) {
        var h = Math.max(160, Math.min(body.scrollHeight + 24, 1200));
        layer.style.height = Math.ceil(h) + 'px';
        var kids = layer.children;
        for (var i = 0; i < kids.length; i++) kids[i].style.height = Math.ceil(h) + 'px';
      }
    }
  }
  window.__v74RelayoutPages = relayoutPages;

  function watchPaper() {
    var paper = document.getElementById('study-note-paper');
    if (!paper || paper.dataset.v74PageWatch) return;
    paper.dataset.v74PageWatch = '1';
    var was = paper.classList.contains('has-pdf');
    new MutationObserver(function () {
      var now = paper.classList.contains('has-pdf');
      if (now !== was) {
        was = now;
        requestAnimationFrame(relayoutPages);
        setTimeout(relayoutPages, 120);
        setTimeout(relayoutPages, 500);
      }
    }).observe(paper, { attributes: true, attributeFilter: ['class'] });
    setTimeout(relayoutPages, 200);
  }
  setInterval(watchPaper, 1000);

  // PDF 페이지 렌더가 끝난 뒤에도 한 번 더 정리
  var pdfList = null;
  setInterval(function () {
    var box = document.getElementById('study-note-pdf-list');
    if (!box || box === pdfList) return;
    pdfList = box;
    new MutationObserver(function () {
      clearTimeout(window.__v74PdfRelayoutT);
      window.__v74PdfRelayoutT = setTimeout(relayoutPages, 200);
    }).observe(box, { childList: true, subtree: true });
  }, 1200);

  /* ----------------------------------------------------------------------
     8. 스크롤이 콘텐츠보다 훨씬 아래까지 내려가는 잔여 여백 정리
     ---------------------------------------------------------------------- */
  function trimTrailingSpace() {
    if (document.body.classList.contains('study-note-app-open')) return;
    var footer = document.querySelector('body > footer');
    if (!footer) return;
    var bottom = footer.getBoundingClientRect().bottom + window.scrollY;
    var docH = document.documentElement.scrollHeight;
    // 푸터 아래 40px 이상 빈 공간이 남으면 잘라낸다
    if (docH - bottom > 40) {
      document.documentElement.style.setProperty('height', 'auto', 'important');
      document.body.style.setProperty('height', 'auto', 'important');
      document.body.style.setProperty('padding-bottom', '0', 'important');
      document.body.style.setProperty('margin-bottom', '0', 'important');
    }
  }
  window.addEventListener('load', function () { setTimeout(trimTrailingSpace, 300); });
  setInterval(trimTrailingSpace, 2500);

  log('V74 patch active');
})();
