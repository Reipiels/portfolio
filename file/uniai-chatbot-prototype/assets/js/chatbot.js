/* ==========================================================================
   안내챗봇 프로토타입 — 화면정의 CH-01 ~ CH-09 (화면정의 문서)
   - 서버 없이 동작한다. 케이스 답변·나머지 값은 모두 예시다
   - "예시" 표시가 붙은 숫자·내 현황은 실제 엔진·cblms 값이 아니다
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.CB_DATA;
  var CASES = {};
  DATA.cases.forEach(function (c) { CASES[c.id] = c; });

  var PHONE = '1833-6227';
  var MAX_LEN = 300;
  var COUNT_FROM = 250;
  var RECOMMENDED = [   // 홈 추천 질문(예시 순서)
    'LD-001', 'LD-004', 'GD-011', 'LD-007', 'GD-008', 'GD-050', 'GD-012', 'GD-014'
  ];

  /* ---- 상태 ------------------------------------------------------------- */
  var S = {
    member: false,
    name: '홍길동',
    clock: 'open',          // open · lunch · after · weekend
    counselor: false,       // 상담사 연결(3단계) 켬
    sim: 'none',            // 다음 응답 1회: none · slow · error · offline
    showIds: true,
    lecture: false,
    expanded: false,
    menuStack: [],
    awaiting: null,         // 입력창을 특정 질문의 답으로 받을 때
    lastQuestion: '',
    design: null,           // 학습설계 입력
    saved: [
      { id: 's1', title: '수업을 들었는데 출석인정처리가 안되요.', date: '10/27', caseId: 'GD-020' },
      { id: 's2', title: '학습설계 — 건축공학 학사', date: '10/20', caseId: 'LD-004' },
      { id: 's3', title: '증명서/연말정산 신청', date: '10/02', caseId: 'GD-049' }
    ],
    closeArmed: false,
    timers: []
  };

  /* ---- DOM 도우미 ------------------------------------------------------- */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
        else if (k === 'style') el.setAttribute('style', v);
        else if (k in el && typeof v !== 'string') el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  function ico(name, extra) { return h('i', { class: 'ico ico-' + name + (extra ? ' ' + extra : ''), 'aria-hidden': 'true' }); }
  function btn(cls, label, onClick, extra) {
    var b = h('button', Object.assign({ type: 'button', class: 'btn ' + cls, on: { click: onClick } }, extra || {}));
    append(b, label);
    return b;
  }
  function sample(text) { return h('span', { class: 'chat-sample', title: '프로토타입 예시 값 — 실제 엔진·cblms 값이 아니다' }, '예시' + (text ? ' · ' + text : '')); }
  function demoOnly(node) { node.classList.add('demo-only'); if (!S.showIds) node.hidden = true; return node; }
  function isMobile() { return window.matchMedia('(max-width: 767px)').matches; }
  function later(fn, ms) { var t = setTimeout(fn, ms); S.timers.push(t); return t; }
  function copyText(text) {
    try { navigator.clipboard.writeText(text); } catch (e) { /* file:// 등에서 막히면 안내만 */ }
    sys('복사했어요');
  }

  /* ---- 쉘 (CH-01) ------------------------------------------------------- */
  var root, launcher, panel, body, log, input, count, sendBtn, pill, titleSub, drawer, footWarn;

  function buildShell() {
    root = document.getElementById('chatbot');

    // 글자 없이 채팅 아이콘 하나(요청자 10/30) — PC·모바일 같은 원형. 이름은 aria-label·title로
    launcher = h('button', { type: 'button', class: 'chat-launcher', 'aria-label': '고객상담챗봇 열기', title: '고객상담챗봇', on: { click: openPanel } }, ico('chat'));

    // 머리글의 다른 아이콘 버튼과 같은 모양 — 글자 pill은 자리를 많이 차지했다(요청자 10/30)
    pill = h('button', { type: 'button', class: 'chat-hbtn chat-hbtn--login', on: { click: onPill } });
    titleSub = null;

    var head = h('div', { class: 'chat-panel__head' },
      h('button', { type: 'button', class: 'chat-hbtn', 'aria-label': '메뉴', title: '메뉴(CH-08)', on: { click: toggleDrawer } }, ico('menu')),
      h('button', { type: 'button', class: 'chat-hbtn', 'aria-label': '처음으로', title: '홈(CH-02)', on: { click: function () { goHome(true); } } }, ico('home')),
      h('div', { class: 'chat-panel__title' }, '고객상담챗봇'),
      pill,
      h('button', { type: 'button', class: 'chat-hbtn', 'aria-label': '최소화', title: '최소화 — 대화는 유지', on: { click: minimize } }, h('span', { 'aria-hidden': 'true', style: 'font-size:20px;line-height:1' }, '–')),
      h('button', { type: 'button', class: 'chat-hbtn chat-hbtn--expand', 'aria-label': '확대', title: '확대(PC)', on: { click: toggleExpand } }, h('span', { 'aria-hidden': 'true', style: 'font-size:16px' }, '⤢')),
      h('button', { type: 'button', class: 'chat-hbtn', 'aria-label': '닫기', title: '닫기', on: { click: closePanel } }, ico('close'))
    );

    log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': '대화' });
    body = h('div', { class: 'chat-panel__body' }, log);

    input = h('textarea', { rows: 1, placeholder: '궁금한 것을 물어보세요', 'aria-label': '질문 입력', maxlength: String(MAX_LEN + 50) });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    count = h('span', { class: 'chat-input__count', 'aria-live': 'polite', hidden: true }, '0/' + MAX_LEN);
    sendBtn = h('button', { type: 'button', class: 'chat-send', 'aria-label': '보내기', disabled: true, on: { click: onSend } }, ico('chevron-right'));
    footWarn = h('div', { class: 'chat-foot-warn', hidden: true });

    var foot = h('div', { class: 'chat-panel__foot' },
      footWarn,
      h('div', { class: 'chat-input' }, input, count, sendBtn),
      h('p', { class: 'chat-disclaimer' }, 'AI가 안내해 드려요. 답을 찾지 못하면 전화로 연결해 드려요.')
    );

    drawer = h('div', { class: 'chat-drawer', hidden: true });

    panel = h('section', { class: 'chat-panel', role: 'dialog', 'aria-label': '고객상담챗봇', hidden: true }, head, body, foot, drawer);
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!drawer.hidden) toggleDrawer(); else minimize();
    });

    root.appendChild(launcher);
    root.appendChild(panel);
    renderPill();
  }

  function renderPill() {
    pill.innerHTML = '';
    pill.classList.toggle('is-member', S.member);
    if (S.member) { append(pill, ico('user')); pill.setAttribute('aria-label', S.name + '님 — 내 메뉴'); pill.title = S.name + '님 — 내 메뉴(CH-08)'; }
    else { append(pill, ico('user')); pill.setAttribute('aria-label', '로그인'); pill.title = '로그인(CH-05)'; }
  }
  function onPill() { if (S.member) toggleDrawer(); else { ensureOpen(); loginCard({ reason: 'pill' }); } }

  function openPanel() {
    if (S.lecture) return;
    panel.hidden = false;
    launcher.hidden = true;
    if (!log.children.length) goHome(false);
    setTimeout(function () { input.focus(); }, 30);
  }
  function ensureOpen() { if (panel.hidden) openPanel(); }
  function minimize() { panel.hidden = true; launcher.hidden = S.lecture; drawer.hidden = true; launcher.focus(); }
  function toggleExpand() { S.expanded = !S.expanded; panel.classList.toggle('is-expanded', S.expanded); }
  function closePanel() {
    // 비로그인은 닫으면 대화를 지운다(CH-01 대화 보관 표). 지우기 전에 한 번 알린다 — 브라우저 확인창은 쓰지 않는다
    if (!S.member && log.children.length > 1 && !S.closeArmed) {
      S.closeArmed = true;
      var bar = h('div', { class: 'chat-banner' },
        h('div', { class: 'notice notice--warning notice--inline' }, ico('alert'),
          h('span', { class: 'notice__body' }, h('strong', { class: 'notice__title' }, '닫으면 대화가 지워져요'), '로그인하지 않은 대화는 저장되지 않아요.'),
          h('span', { class: 'notice__action' },
            btn('btn--sm btn--primary', '닫기', function () { bar.remove(); S.closeArmed = false; reallyClose(); }), ' ',
            btn('btn--sm', '취소', function () { bar.remove(); S.closeArmed = false; }))));
      body.insertBefore(bar, log);
      body.scrollTop = 0;
      return;
    }
    reallyClose();
  }
  function reallyClose() {
    if (S.member && log.children.length > 1 && S.lastQuestion) {
      S.saved.unshift({ id: 's' + Date.now(), title: S.lastQuestion, date: today().label, caseId: null });
    }
    resetConversation();
    panel.hidden = true;
    launcher.hidden = S.lecture;
  }
  function resetConversation() {
    S.timers.forEach(clearTimeout); S.timers = [];
    log.innerHTML = '';
    S.menuStack = []; S.awaiting = null; S.lastQuestion = ''; S.design = null; S.closeArmed = false;
    input.placeholder = '궁금한 것을 물어보세요';
    setBusy(false);
  }

  /* ---- 입력창 ----------------------------------------------------------- */
  function onInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    var n = input.value.length;
    count.textContent = n + '/' + MAX_LEN;
    count.hidden = n < COUNT_FROM;   // 처음부터 보일 필요가 없다 — 250자부터(10/30 검토)
    count.classList.toggle('is-over', n > MAX_LEN);
    if (!S.busy) sendBtn.disabled = !input.value.trim() || n > MAX_LEN || S.sim === 'offline-active';
  }
  function onKey(e) {
    // 한글 조합 중 Enter는 보내지 않는다(CH-01)
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); onSend(); }
  }
  function onSend() {
    if (S.busy) { stopAnswer(); return; }
    var text = input.value.trim();
    if (!text || text.length > MAX_LEN) return;
    if (S.sim === 'offline-active') return;
    var pii = findPii(text);
    if (pii && !onSend.skipPii) { piiWarning(text, pii); return; }
    onSend.skipPii = false;
    input.value = ''; onInput();
    userSay(text);
    if (S.awaiting) { var fn = S.awaiting; S.awaiting = null; input.placeholder = '궁금한 것을 물어보세요'; fn(text); return; }
    handleText(text);
  }

  var PII = [
    { re: /\d{6}\s*-\s*[1-4]\d{6}/, name: '주민등록번호' },
    { re: /01[016789][\s-]?\d{3,4}[\s-]?\d{4}/, name: '휴대전화 번호' },
    { re: /[\w.+-]+@[\w-]+\.[\w.]+/, name: '이메일 주소' }
  ];
  function findPii(text) { for (var i = 0; i < PII.length; i++) if (PII[i].re.test(text)) return PII[i]; return null; }
  function maskPii(text) {
    return text.replace(PII[0].re, '******-*******').replace(PII[1].re, '010-****-****').replace(PII[2].re, '***@***');
  }
  function piiWarning(text, pii) {
    // CH-03: 전송 전에 경고. 보내더라도 저장·LLM 전달 전에 가린다(ADR-020 취지)
    var card = h('div', { class: 'notice notice--warning' }, ico('alert'),
      h('div', { class: 'notice__body' },
        h('strong', { class: 'notice__title' }, pii.name + '가 들어 있는 것 같아요'),
        '개인정보는 적지 않아도 안내해 드릴 수 있어요. 그대로 보내면 가려서 보내고 저장하지 않아요.',
        h('div', { class: 'chat-actions', style: 'margin-top:8px' },
          btn('btn--sm', '지우고 다시 쓰기', function () { card.remove(); input.focus(); }),
          btn('btn--sm btn--outline', '가려서 보내기', function () { card.remove(); input.value = maskPii(text); onInput(); onSend.skipPii = true; onSend(); }))));
    footWarn.hidden = false; footWarn.innerHTML = ''; footWarn.appendChild(card);
    var obs = new MutationObserver(function () { if (!footWarn.children.length) { footWarn.hidden = true; obs.disconnect(); } });
    obs.observe(footWarn, { childList: true });
  }

  /* ---- 메시지 ------------------------------------------------------------ */
  function scrollEnd() { requestAnimationFrame(function () { body.scrollTop = body.scrollHeight; }); }
  function userSay(text) {
    log.appendChild(h('div', { class: 'chat-row chat-row--user' }, h('div', { class: 'chat-bubble chat-bubble--user' }, text)));
    S.lastQuestion = text;
    scrollEnd();
  }
  function botRow() {
    var stack = h('div', { class: 'chat-stack' });
    var row = h('div', { class: 'chat-row' }, h('span', { class: 'chat-avatar', 'aria-hidden': 'true' }, 'AI'), stack);
    for (var i = 0; i < arguments.length; i++) append(stack, arguments[i]);
    log.appendChild(row);
    scrollEnd();
    return stack;
  }
  function sys(text) { var el = h('div', { class: 'chat-sys', role: 'status' }, text); log.appendChild(el); scrollEnd(); later(function () { el.remove(); }, 2600); }
  function say(text) { return bubble(text); }
  function bubble(text, opts) {
    opts = opts || {};
    var lines = String(text).split('\n');
    var box = h('div', { class: 'chat-bubble__text' });
    lines.forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      var cls = null;
      if (/^<.+>$/.test(t) || /^\[[^\]]+\]$/.test(t)) cls = 'is-head';
      else if (/^[▶■★※ㄴ•·-]|^\d+[).]\s|^[①-⑩]/.test(t)) cls = 'is-point';
      box.appendChild(h('p', { class: cls }, t));
    });
    var b = h('div', { class: 'chat-bubble chat-bubble--bot' + (opts.cls ? ' ' + opts.cls : '') }, box);
    if (lines.length > 10 && !opts.noFold) {
      b.classList.add('is-folded');
      var more = btn('btn--link btn--sm chat-bubble__more', '전체 보기', function () {
        b.classList.toggle('is-folded');
        more.textContent = b.classList.contains('is-folded') ? '전체 보기' : '접기';
      });
      b.appendChild(more);
    }
    return b;
  }
  function chips(list) {
    var wrap = h('div', { class: 'chat-chips' });
    list.forEach(function (c) {
      if (!c) return;
      wrap.appendChild(h('button', {
        type: 'button', class: 'chat-chip' + (c.kind ? ' chat-chip--' + c.kind : ''),
        on: { click: function () { if (c.say !== false) userSay(c.label.replace(/^[^\w가-힣]+/, '') || c.label); c.run(); } }
      }, c.label));
    });
    return wrap;
  }
  function homeChip() { return { label: '🏠 처음으로', kind: 'sub', say: false, run: function () { goHome(true); } }; }
  function phoneChip(reason) { return { label: '전화로 문의', kind: 'phone', run: function () { connectCard({ reason: reason || 'user' }); } }; }
  // 메뉴에서 누르면 이전 메뉴로, 답변에서 누르면 그 답변을 연 메뉴로 돌아간다(채널톡 👈뒤로가기와 같게)
  function backChip(fromMenu) {
    if (S.menuStack.length < (fromMenu ? 2 : 1)) return fromMenu ? homeChip() : null;
    return { label: '👈 뒤로가기', kind: 'sub', say: false, run: function () {
      if (fromMenu) S.menuStack.pop();
      var key = S.menuStack.pop();
      if (key) showMenu(key); else goHome(true);
    } };
  }

  function feedbackRow(opts) {
    opts = opts || {};
    var row = h('div', { class: 'chat-feedback' });
    if (opts.source) row.appendChild(h('span', { class: 'chat-source', title: '출처 — 안내 자료(지식)' }, ico('book', 'ico-sm'), opts.source));
    var up = h('button', { type: 'button', 'aria-label': '도움이 됐어요', title: '도움이 됐어요' }, '👍');
    var down = h('button', { type: 'button', 'aria-label': '아쉬워요', title: '아쉬워요' }, '👎');
    var cp = h('button', { type: 'button', 'aria-label': '복사', title: '복사' }, '⧉');
    up.addEventListener('click', function () {
      if (up.classList.contains('is-on')) return;
      up.classList.add('is-on'); down.disabled = true;
      row.appendChild(h('span', { class: 'chat-feedback__done' }, '의견 고마워요'));
      row.appendChild(demoOnly(h('span', { class: 'chat-feedback__done' }, '· 기록: 👍 ' + (opts.caseId || '지식 답변') + (S.member ? ' (대화와 함께 CH-A2)' : ' (비로그인 — 건수·케이스 ID만 집계)'))));
    });
    down.addEventListener('click', function () {
      if (down.classList.contains('is-on')) return;
      down.classList.add('is-on'); up.disabled = true;
      botRow(say('어떤 점이 아쉬웠나요?'), chips([
        { label: '다른 질문이에요', run: function () { botRow(say('궁금한 것을 아래 입력창에 다시 적어 주시거나, 자주 묻는 질문에서 골라 주세요.'), chips(recommendedChips(4))); input.focus(); } },
        { label: '내용이 달라요', run: function () {
          botRow(say('알려 주셔서 고마워요. 담당자가 확인해서 안내 내용을 고칠게요.\n급하시면 전화로 확인해 주세요.'), chips([phoneChip('feedback'), homeChip()]),
            demoOnly(h('div', { class: 'chat-meta' }, '기록: 👎 "내용이 달라요" · ' + (opts.caseId || '지식 답변') + (S.member ? ' — 로그인 대화는 CH-A2에서 원문과 함께 봄' : ' — 비로그인은 원문 없이 건수만'))));
        } },
        { label: '전화로 문의할래요', kind: 'phone', run: function () { connectCard({ reason: 'feedback', caseId: opts.caseId }); } }
      ]));
    });
    cp.addEventListener('click', function () { copyText(opts.copy || ''); });
    row.appendChild(up); row.appendChild(down); row.appendChild(cp);
    return row;
  }

  /* ---- 대기·오류 시뮬레이션 (CH-03) ------------------------------------- */
  var pending = null;
  function setBusy(on) {
    S.busy = on;
    sendBtn.classList.toggle('is-stop', on);
    sendBtn.classList.remove('is-urgent');
    sendBtn.setAttribute('aria-label', on ? '답변 중지' : '보내기');
    sendBtn.innerHTML = '';
    sendBtn.appendChild(on ? h('span', { 'aria-hidden': 'true', style: 'display:block;width:12px;height:12px;border-radius:2px;background:currentColor' }) : ico('chevron-right'));
    sendBtn.disabled = on ? false : !input.value.trim();
  }
  function think(label, then, retry) {
    var mode = S.sim; S.sim = 'none';
    if (window.ChatDemo) window.ChatDemo.simUsed();
    var dots = h('span', { class: 'chat-typing__dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
    var txt = h('span', null, label || '답변을 찾는 중…');
    var typing = h('div', { class: 'chat-typing', role: 'status' }, dots, txt);
    var row = botRow(typing).parentNode;
    setBusy(true);
    var done = function (fn) { row.remove(); setBusy(false); pending = null; fn(); };
    if (mode === 'offline') {
      later(function () { done(function () { offline(); }); }, 500);
      return;
    }
    if (mode === 'error') {
      later(function () { done(function () { serverError(retry || then); }); }, 1200);
      return;
    }
    var ms = mode === 'slow' ? 17000 : 700 + Math.random() * 500;
    if (mode === 'slow') {
      later(function () { txt.textContent = '조금만 기다려 주세요…'; }, 5000);
      later(function () { sendBtn.classList.add('is-urgent'); txt.textContent = '조금만 기다려 주세요… 오래 걸리면 ■ 로 멈출 수 있어요'; }, 15000);
    }
    var t = later(function () { done(then); }, ms);
    pending = { row: row, timer: t };
  }
  function stopAnswer() {
    if (!pending) return;
    S.timers.forEach(clearTimeout); S.timers = [];
    pending.row.remove(); pending = null; setBusy(false);
    botRow(say('답변을 멈췄어요. 다시 물어보시거나 전화로 문의해 주세요.'), chips([phoneChip('stopped'), homeChip()]));
  }
  function serverError(retry) {
    botRow(h('div', { class: 'notice notice--danger' }, ico('alert'),
      h('div', { class: 'notice__body' }, h('strong', { class: 'notice__title' }, '일시적인 문제가 생겼어요.'), '잠시 뒤에 다시 시도해 주세요.')),
      h('div', { class: 'chat-actions' },
        btn('btn--outline', '다시 시도', function () { think(null, retry); }),
        btn('', ['전화로 문의'], function () { connectCard({ reason: 'error' }); })));
  }
  function offline() {
    S.sim = 'offline-active';
    footWarn.hidden = false; footWarn.innerHTML = '';
    footWarn.appendChild(h('div', { class: 'notice notice--warning notice--inline' }, ico('alert'),
      h('span', { class: 'notice__body' }, h('strong', { class: 'notice__title' }, '인터넷 연결이 끊겼어요.'), '입력한 내용은 그대로 있어요.'),
      h('span', { class: 'notice__action' }, btn('btn--sm', '다시 연결', function () {
        S.sim = 'none'; footWarn.hidden = true; footWarn.innerHTML = ''; onInput(); sys('다시 연결됐어요');
      }))));
    input.value = S.lastQuestion; onInput();
  }

  /* ---- 시간 (CH-07 운영시간) -------------------------------------------- */
  var CLOCKS = {   // 프로토타입 모의 시각. 2026-10-29은 목요일
    open: new Date(2026, 9, 29, 11, 0),
    lunch: new Date(2026, 9, 29, 13, 20),
    after: new Date(2026, 9, 30, 19, 10),
    weekend: new Date(2026, 9, 31, 10, 30)
  };
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function now() { return CLOCKS[S.clock]; }
  function fmt(d) { return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ') ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function today() { var d = now(); return { date: d, label: (d.getMonth() + 1) + '/' + String(d.getDate()).padStart(2, '0') }; }
  function hoursState(d) {
    d = d || now();
    var day = d.getDay(), m = d.getHours() * 60 + d.getMinutes();
    if (day === 0 || day === 6) return 'weekend';
    if (m >= 13 * 60 && m < 14 * 60) return 'lunch';
    if (m >= 10 * 60 && m < 18 * 60) return 'open';
    return 'closed';
  }
  function nextOpen(d) {
    // 공휴일은 계산하지 않는다 — 공휴일 데이터 소스 미정(기능정의 F-07)
    d = new Date((d || now()).getTime());
    var st = hoursState(d);
    if (st === 'open') return null;
    if (st === 'lunch') { d.setHours(14, 0, 0, 0); return d; }
    if (st === 'closed' && d.getHours() < 10) { d.setHours(10, 0, 0, 0); return d; }
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
    d.setHours(10, 0, 0, 0);
    return d;
  }
  function nextLabel(d) {
    var n = now();
    var sameDay = d.toDateString() === n.toDateString();
    var tomorrow = new Date(n.getTime()); tomorrow.setDate(n.getDate() + 1);
    var dayLabel = sameDay ? '오늘' : (d.toDateString() === tomorrow.toDateString() ? '내일' : (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')');
    return dayLabel + ' ' + String(d.getHours()).padStart(2, '0') + ':00';
  }
  function hoursBlock() {
    var st = hoursState();
    var stTxt = { open: ['is-open', '지금 상담 가능'], lunch: ['is-closed', '점심시간'], closed: ['is-closed', '운영시간 아님'], weekend: ['is-closed', '주말 휴무'] }[st];
    return h('button', { type: 'button', class: 'chat-hours', on: { click: function () { userSay('전화문의'); connectCard({ reason: 'home' }); } } },
      ico('mobile', 'ico-sm'),
      h('span', { class: 'chat-hours__txt' }, h('strong', null, '전화 문의 ' + PHONE), ' · ', h('span', { class: stTxt[0] }, stTxt[1]), h('br'),
        '평일 10:00~18:00 · 점심 13:00~14:00 · 주말·공휴일 휴무'),
      ico('chevron-right', 'ico-sm'),
      demoOnly(h('span', { class: 'chat-meta', style: 'flex-basis:100%;margin:0 0 0 22px' }, '모의 시각 ' + fmt(now()))));
  }

  /* ---- 홈 (CH-02) ------------------------------------------------------- */
  // 홈 칩 문구 — 케이스 대표 질문이 채널톡 버튼 문구라 질문형이 아닌 것만 바꾼다(10/30 검토). 케이스 원문은 그대로
  var CHIP_LABEL = { 'LD-004': '4년제 졸업했는데 학위를 더 받을 수 있나요?' };
  // 학습설계 카드와 의도가 겹치는 칩은 신청 카드로 바로
  var CHIP_TO_DESIGN = { 'LD-007': '어떤 과목을 신청해야 할지 설계받기' };
  function recommendedChips(n) {
    return RECOMMENDED.slice(0, n || 8).map(function (id) {
      if (CHIP_TO_DESIGN[id]) return { label: CHIP_TO_DESIGN[id], run: startDesign };
      return { label: CHIP_LABEL[id] || CASES[id].q, run: function () { showCase(id); } };
    });
  }
  function goHome(fromButton) {
    if (fromButton) { S.menuStack = []; }
    var hello = S.member
      ? h('div', { class: 'chat-hello' }, h('h2', null, S.name + '님, 안녕하세요!'), h('p', null, '학습설계부터 수강·평가·오류까지 물어보세요.'))
      : h('div', { class: 'chat-hello' }, h('h2', null, '안녕하세요! 무엇을 도와드릴까요?'), h('p', null, '학습설계부터 수강·평가·오류까지 물어보세요.'));

    var areas = h('div', { class: 'chat-areas' },
      // 전화문의는 "챗봇이 해 주는 일"이 아니라 탈출구라 카드에서 빼고 운영시간 줄로 내렸다(10/30 검토)
      areaCard('cap', '학습설계', '내 학점에 맞는 학위·과목 설계', function () { userSay('학습설계'); startDesign(); }),
      areaCard('book', '학습안내', '수강·평가·오류를 바로 안내해 드려요', function () { userSay('학습안내'); S.menuStack = []; showMenu('PREVIEW'); }));

    var recWrap = h('div', null, h('p', { class: 'chat-section-title' }, '자주 묻는 질문'));
    var rec = chips(recommendedChips(8));
    var extra = Array.prototype.slice.call(rec.children, 5);
    extra.forEach(function (b) { b.hidden = true; });
    var moreBtn = h('button', { type: 'button', class: 'chat-chip chat-chip--sub', on: { click: function () { extra.forEach(function (b) { b.hidden = false; }); moreBtn.remove(); } } }, '더 보기 +' + extra.length);
    rec.appendChild(moreBtn);
    recWrap.appendChild(rec);
    recWrap.appendChild(demoOnly(h('p', { class: 'chat-meta', style: 'margin-top:4px' }, '추천 질문(예시)')));

    var home = h('div', { class: 'chat-home' }, hello, areas, recWrap, hoursBlock(), summaryBlock(),
      h('p', { class: 'chat-meta' }, '그 밖의 질문은 아래 입력창에 바로 적어 주세요.'));
    log.appendChild(home);
    if (fromButton) home.scrollIntoView({ block: 'start' }); else body.scrollTop = 0;
  }
  function areaCard(icon, title, desc, onClick, kind) {
    return h('button', { type: 'button', class: 'chat-area' + (kind ? ' chat-area--' + kind : ''), on: { click: onClick } },
      h('span', { class: 'chat-area__ico' }, ico(icon)),
      h('span', { class: 'chat-area__txt' }, h('strong', null, title), h('span', null, desc)),
      ico('chevron-right'));
  }

  // 내 학습 요약 (CH-02 4) — 항목은 화면정의 4차, 값은 예시. 출처 뷰는 구현 단계에서 확인
  var TODO = [
    { kind: '과제 마감', title: '건축구조', when: '10/31(금) 23:59', dday: 2, act: '제출하러 가기' },
    { kind: '토론 마감', title: '건축시공', when: '11/2(일) 23:59', dday: 4, act: '참여하기' },
    { kind: '중간고사', title: '건축구조 외 1과목', when: '11/3(월) ~ 11/9(일)', dday: 5, act: '시험 안내' },
    { kind: '기말고사', title: '건축구조 외 1과목', when: '12/8(월) ~ 12/14(일)', dday: 40, act: '시험 안내' },
    { kind: '성적 조회', title: '2026-2학기 성적 공개', when: '12/22(월)', dday: 54, act: '성적 보기' }
  ];
  function todoList(items) {
    return h('ul', { class: 'chat-todo' }, items.map(function (t) {
      return h('li', null,
        h('span', { class: 'chat-todo__kind' }, t.kind),
        h('span', { class: 'chat-todo__main' }, h('strong', null, t.title), h('span', null, t.when)),
        h('span', { class: 'chat-dday' + (t.dday <= 3 ? ' is-hot' : '') }, 'D-' + t.dday),
        h('button', { type: 'button', class: 'btn btn--link btn--sm', on: { click: function () { linkClick(t.act + ' (나의강의실)'); } } }, t.act, ico('chevron-right', 'ico-sm')));
    }));
  }
  function summaryBlock() {
    if (!S.member) {
      return h('div', { class: 'notice notice--info' }, ico('info'),
        h('div', { class: 'notice__body' }, '로그인하면 내 학습 현황(과제·토론 마감, 시험 일정, 성적 조회일)을 볼 수 있어요.'),
        h('span', { class: 'notice__action' }, btn('btn--sm btn--secondary', '로그인', function () { loginCard({ reason: 'summary' }); })));
    }
    return h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '지금 해야 할 일'), sample()),
      h('div', { class: 'chat-card__body', style: 'padding-top:0;padding-bottom:0' }, todoList(TODO.slice(0, 3))),
      h('div', { class: 'chat-card__foot' }, btn('btn--outline', '전체 보기', function () {
        userSay('내 학습 일정 전체 보기');
        botRow(h('div', { class: 'chat-card' },
          h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '다가오는 일정'), sample()),
          h('div', { class: 'chat-card__body', style: 'padding-top:0;padding-bottom:0' }, todoList(TODO))),
          demoOnly(h('div', { class: 'chat-meta' }, '항목: 과제·토론 마감, 중간·기말 응시일, 성적 조회일(요청자 지정). cblms 뷰는 구현 단계에서 확인 — 뷰에 없는 항목은 뺀다')),
          chips([{ label: '마이페이지에서 보기', run: function () { linkClick('마이페이지'); } }, homeChip()]));
      })));
  }

  /* ---- 메뉴 (채널톡 워크플로우처럼 따라가기) --------------------------- */
  var MENU_TITLE = { PREVIEW: '학습안내', C: '수업 진행 관련 문의', D: '수강신청문의', X: '기타 궁금한 사항', Z: '오류', Q: '개인정보 변경' };
  function chipFor(c, fromMenu) {
    var to = c.to;
    if (!to) return null;
    if (to === 'back') return backChip(fromMenu);
    if (to === 'home') return homeChip();
    if (to === 'phone') return { label: '💬 상담사 연결', kind: 'phone', run: function () { connectCard({ reason: 'request' }); } };
    if (to.indexOf('menu:') === 0) return { label: c.label, run: function () { showMenu(to.slice(5)); } };
    if (to.indexOf('case:') === 0) return { label: c.label, run: function () { showCase(to.slice(5)); } };
    if (to.indexOf('kb:') === 0) return { label: c.label, run: function () { think('안내 자료를 찾는 중…', function () { knowledgeAnswer(KB[to.slice(3)]); }); } };
    return null;
  }
  function showMenu(key) {
    var m = DATA.menus[key];
    if (S.menuStack[S.menuStack.length - 1] !== key) S.menuStack.push(key);
    var intro = key === 'PREVIEW' ? '어떤 것이 궁금하세요? 아래에서 고르거나 입력창에 바로 물어보셔도 돼요.' : m.intro;
    var list = m.chips.map(function (c) { return chipFor(c, true); }).filter(Boolean)
      .filter(function (c) { return !(key === 'PREVIEW' && c.kind === 'sub'); });
    if (key === 'PREVIEW') list.push({ label: '📚 주제별 전체 보기', kind: 'sub', run: showTopics });
    if (!list.some(function (c) { return c.label === '🏠 처음으로'; })) list.push(homeChip());
    botRow(say(intro), chips(list),
      demoOnly(h('div', { class: 'chat-meta' }, '메뉴 "' + (m.title || MENU_TITLE[key]) + '" (기존 안내 버튼 순서)')));
  }
  function showTopics() {
    var cats = [];
    DATA.cases.forEach(function (c) { if (cats.indexOf(c.cat) < 0) cats.push(c.cat); });
    botRow(say('주제를 골라 주세요.'), chips(cats.map(function (cat) {
      var n = DATA.cases.filter(function (c) { return c.cat === cat; }).length;
      return { label: cat + ' (' + n + ')', run: function () { showTopic(cat); } };
    }).concat([homeChip()])));
  }
  function showTopic(cat) {
    botRow(say(cat + ' — 궁금한 것을 골라 주세요.'), chips(DATA.cases.filter(function (c) { return c.cat === cat; })
      .map(function (c) { return { label: c.q, run: function () { showCase(c.id); } }; })
      .concat([{ label: '👈 주제 목록', kind: 'sub', say: false, run: showTopics }, homeChip()])));
  }

  /* ---- 케이스 답변 (CH-04 ①) ------------------------------------------- */
  function showCase(id, opts) {
    opts = opts || {};
    var c = CASES[id];
    if (c.login === 'required' && !S.member) { loginCard({ reason: 'required', caseId: id }); return; }
    think(null, function () { renderCase(c, opts); }, function () { renderCase(c, opts); });
  }
  function renderCase(c, opts) {
    var parts = [];
    parts.push(bubble(c.body));

    if (c.login === 'optional') parts.push(S.member ? myStatusCard(c) : loginLine(c));
    if (c.login === 'required' && S.member) parts.push(say('이 문의는 본인 확인 뒤 담당자가 처리해요. 전화로 연결해 드릴게요.'));

    var acts = [];
    c.links.forEach(function (l) {
      if (l.action === 'design') {
        acts.push(btn('btn--primary', ['내 조건으로 학습설계 받기'], startDesign, { title: '원문 버튼: ' + l.label + ' → 새 시스템에서는 챗봇 안 학습설계(CH-06)' }));
      } else {
        acts.push(btn('btn--outline', [l.label, ico('external', 'ico-sm')], function () { linkClick(l.label); }));
      }
    });
    c.files.forEach(function (f) {
      acts.push(h('button', { type: 'button', class: 'chat-file', on: { click: function () { linkClick(f.name); } } }, ico('file', 'ico-sm'), f.name, h('small', null, f.size)));
    });
    if (acts.length) parts.push(h('div', { class: 'chat-actions' }, acts));

    parts.push(feedbackRow({ caseId: c.id, copy: c.body }));

    var meta = h('div', { class: 'chat-meta' }, h('span', { class: 'badge badge--soft' }, c.id), '로그인 ' + ({ none: '불필요', optional: '선택', required: '필수' })[c.login]);
    if (c.memo) meta.appendChild(h('span', { style: 'color:var(--color-warning)' }, '확인 메모: ' + c.memo));
    if (c.links.length || c.files.length) meta.appendChild(h('span', null, '링크 URL·첨부는 원문에 없음 — 담당자가 채움'));
    parts.push(demoOnly(meta));

    var next = c.chips.map(chipFor).filter(Boolean);
    if (c.area === '학습설계' && !c.links.some(function (l) { return l.action === 'design'; }))
      next.push({ label: '내 조건으로 학습설계 받기', run: startDesign, say: true });
    if (c.login === 'required' && S.member) { botRow.apply(null, parts); connectCard({ reason: 'human', caseId: c.id }); return; }
    if (!next.some(function (x) { return x.kind === 'sub' && x.label.indexOf('뒤로') >= 0; })) { var b = backChip(); if (b) next.push(b); }
    if (!next.some(function (x) { return x.label === '🏠 처음으로'; })) next.push(homeChip());
    if (opts.withPhone) next.push(phoneChip('case'));
    if (opts.extra) parts.push(opts.extra);
    parts.push(chips(next));
    botRow.apply(null, parts);
  }
  function linkClick(label) {
    botRow(h('div', { class: 'notice notice--inline' }, ico('external'),
      h('span', { class: 'notice__body' }, '"' + label + '" — 새 창으로 열립니다.'),
      demoOnly(h('span', { class: 'chat-meta' }, '프로토타입: URL 미확보(원문에 버튼 이름만 있음)'))));
  }
  function loginLine(c) {
    var what = { '출석': '내 출석 현황', '시험': '내 시험 응시 현황', '과제': '내 과제 제출 현황', '수료·성적': '내 성적 공개일', '오류·접속': '내 등록 기기', '증명·결제': '내 수강·결제 내역', '계정·개인정보': '내 등록 정보', '학위·자격 설계': '내 수강 이력' }[c.cat] || '내 현황';
    return h('div', { class: 'notice notice--info notice--inline' }, ico('info'),
      h('span', { class: 'notice__body' }, '로그인하면 ' + what + '도 볼 수 있어요.'),
      h('span', { class: 'notice__action' }, btn('btn--sm btn--secondary', '로그인', function () { loginCard({ reason: 'optional', caseId: c.id }); })));
  }

  // 내 현황 카드 — 로그인 "선택" 케이스. 항목·값은 예시(구현 단계에서 cblms 뷰로 확정)
  var MY = {
    '출석': ['내 출석 현황', [['건축구조', '출석률 86% · 결석 2회'], ['건축시공', '출석률 93% · 결석 1회']], '수료 기준: 출석률 80% 이상'],
    '시험': ['내 시험 응시 현황', [['건축구조 중간고사', '11/3 ~ 11/9 · 미응시'], ['건축시공 중간고사', '11/3 ~ 11/9 · 미응시']], '응시 기간 안에만 응시할 수 있어요'],
    '과제': ['내 과제 제출 현황', [['건축구조', '10/31(금) 23:59 마감 · 미제출'], ['건축시공', '11/7(금) 23:59 마감 · 제출 완료']], null],
    '수료·성적': ['내 성적', [['2026-2학기', '성적 공개 12/22(월) · 이의신청 12/22 ~ 12/24']], null],
    '오류·접속': ['내 등록 기기', [['수강 컴퓨터', '3대 등록 / 최대 5대']], null],
    '증명·결제': ['내 수강·결제 내역', [['2026-2학기', '2과목 · 결제 완료'], ['영수증', '발급 가능']], null],
    '계정·개인정보': ['내 등록 정보', [['휴대전화', '010-****-5678'], ['이메일', 'h***@*****.com']], null],
    '학위·자격 설계': ['내 수강 이력', [['누적 이수', '12학점 (2026-1·2학기)']], null]
  };
  function myStatusCard(c) {
    var m = MY[c.cat] || ['내 현황', [['항목', '구현 단계에서 확정']], null];
    return h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, ico('user'), h('span', { class: 'chat-card__title' }, m[0]), sample()),
      h('div', { class: 'chat-card__body' },
        h('dl', { class: 'chat-sum' }, m[1].map(function (r) { return [h('dt', null, r[0]), h('dd', null, r[1])]; })),
        m[2] ? h('p', { class: 'chat-meta', style: 'margin:8px 0 0' }, m[2]) : null));
  }

  /* ---- 자유 입력 (CH-03 → CH-04) --------------------------------------- */
  var KEYWORDS = {   // 표현 변형 — 엑셀 "유사 표현" 칸이 비어 있어 프로토타입용으로 붙였다
    'GD-001': '학점은행제 뭐 무엇 제도', 'GD-008': '내일배움카드 국민내일배움', 'GD-009': '수강료 얼마 비용 가격 학비 학습비',
    'GD-010': '바우처 평생교육이용권', 'GD-011': '개강 언제 학사일정 시작', 'GD-012': '장학 장학금 할인 감면 유공자',
    'GD-013': '학자금 대출', 'GD-014': '수료 기준 통과 패스', 'GD-016': '상대평가', 'GD-017': '성적 조회 언제 나와',
    'GD-018': '평가 배점 비율 항목', 'GD-020': '출석 인정 안돼 안 돼 처리 안됨 출석이', 'GD-021': '결석',
    'GD-022': '공결 병가 예비군 출산 경조사 사유', 'GD-023': '수강시간 누적 진도 안 올라',
    'GD-024': '시험 중간고사 기말고사', 'GD-025': '장애인 시간연장', 'GD-026': '제출 완료 안됨 답안',
    'GD-027': '시험 망쳤 못봤', 'GD-028': '점수 최종', 'GD-029': '과제 레포트', 'GD-030': '과제 못냈 제출 못',
    'GD-031': '과제 주제 어디', 'GD-032': '과제 제출 방법 어떻게 내', 'GD-033': '과제 양식 한글 워드',
    'GD-034': '퀴즈 쪽지시험', 'GD-035': '토론', 'GD-036': '토론 삭제 지우', 'GD-040': '참여도 커뮤니티',
    'GD-041': '교재 교안 책 구매 사야', 'GD-042': '공동인증서 범용 인증서 PIN', 'GD-043': '시험 프로그램 설치 오류',
    'GD-044': '영상 동영상 재생 안 나와 안나와 오류 강의 안 보여', 'GD-045': '인증서 오류 유효하지',
    'GD-046': '인증서 발급', 'GD-047': '맥어드레스 초과', 'GD-048': '맥어드레스 등록 수강컴퓨터',
    'GD-049': '증명서 발급 증명서발급 연말정산 영수증 수강증명', 'GD-050': '환불 취소 반환',
    'LD-001': '공학사 학위 취득 방법', 'LD-006': '의무 18학점',
    'LD-007': '어떤 과목 신청 뭐 들어야', 'IQ-001': '본인인증 휴대폰 인증 안돼 기기변경',
    'IQ-002': '원격지원', 'IQ-003': '개명 이름 변경', 'IQ-004': '전화번호 주소 이메일 변경 바꾸고 바꿨',
    'IQ-005': '회원탈퇴 탈퇴', 'IQ-006': '비밀번호 분실 잊어 비번'
  };
  // 어미·조사 조각은 뜻이 없어 점수를 흐린다("~싶어요"가 토론글 삭제로 붙었다)
  var STOP = ['어요', '싶어', '고싶', '하고', '있어', '나요', '해요', '예요', '에요', '이에', '돼요', '되요', '세요', '주세', '습니', '니다',
    '는데', '은데', '어떻', '떻게', '할까', '까요', '버렸', '렸어', '려요', '워요', '이요', '가요', '데요'];
  function grams(s) {
    var t = s.replace(/[^가-힣a-zA-Z0-9]/g, '');
    var g = {};
    for (var i = 0; i < t.length - 1; i++) { var k = t.substr(i, 2); if (STOP.indexOf(k) < 0) g[k] = 1; }
    return g;
  }
  var INDEX = DATA.cases.map(function (c) { return { id: c.id, g: grams(c.q + ' ' + (KEYWORDS[c.id] || '')) }; });
  function match(text) {
    var q = grams(text), keys = Object.keys(q);
    if (!keys.length) return [];
    return INDEX.map(function (x) {
      var hit = keys.filter(function (k) { return x.g[k]; }).length;
      return { id: x.id, score: hit / keys.length };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  // 지식 인용 답변(CH-04 ②) 예시 — 케이스에 없는 질문을 안내 자료로 정리. 실제는 LLM + 인용 검증(ADR-022)
  var KNOWLEDGE = [
    { re: /(얼마나|몇\s*(학기|년|개월)|기간).*(걸|필요|취득|졸업)|(학위|졸업).*(얼마나|기간|언제쯤)/,
      text: '학점은행제에서 수업으로 받을 수 있는 학점은 한 학기 최대 24학점, 1년 최대 42학점이에요.\n그래서 필요한 학점이 많을수록 기간이 길어져요. 전적대 학점이나 자격증을 인정받으면 줄어들 수 있어요.\n내 조건으로 정확히 알고 싶으면 학습설계를 받아 보세요.',
      source: '연간/학기당 제한 이수학점', caseId: 'GD-005', design: true },
    { re: /(모바일|핸드폰|휴대폰|폰|앱|어플).*(시험|과제|토론|퀴즈)|(시험|과제|토론|퀴즈).*(모바일|핸드폰|휴대폰|폰으로|앱|어플)/,
      text: '모바일에서는 학습(출석)만 할 수 있어요.\n시험·과제·토론 같은 다른 평가 항목은 PC로만 참여할 수 있어요.',
      source: '출석 — 모바일 어플 수강', caseId: 'GD-019' },
    { re: /(맥|mac|맥북|애플).*(시험|응시|설치)|(시험|응시).*(맥|mac|맥북)/i,
      text: '시험 응시 프로그램은 Mac OS에 설치할 수 없어요.\nWindows가 설치된 PC에서 설치하고 응시해 주세요.',
      source: '시험 응시프로그램 설치 오류', caseId: 'GD-043' }
  ];
  // 케이스가 아니라 상담AI 지식베이스로 답하는 것. 채널톡 L 단계(구 LD-005, 원문 빈칸)는 케이스 엑셀에서 빠졌고(10/30)
  // 메뉴 버튼 "자격증 학점 인정 가능한가요?"가 여기로 온다 — 답은 상담AI 지식베이스
  var KB = {
    'cert-credit': {
      text: '전공과 연계된 자격증은 전공필수로 먼저 인정돼요. 자격증으로 전공필수를 채우면 남은 학점은 전공필수·전공선택 구분 없이 들으시면 돼요.\n'
        + '기능사는 학점인정 대상이 아니에요. 다만 1999년 이전에 딴 기사1급·기사2급·기능사1급·다기능기술자는 지금의 산업기사 등으로 인정돼요(기능사2급·기능사보는 인정되지 않아요).\n'
        + '이미 학사가 있어 다른 전공으로 학위를 받는 경우(타전공)에는 자격증을 하나만 쓸 수 있고, 이전 학점은행제 학위에서 이미 인정받은 자격증은 다시 신청할 수 없어요.\n'
        + '자격증마다, 전공마다 인정 학점이 달라요. 가지고 계신 자격증으로 학습설계를 받아 보시면 인정 학점을 계산해 드려요.',
      source: '학위와 학점에 관해 알아야 할 것 — 2. 자격증 학점 · 5. 인정되지 않는 자격', file: '상담AI 지식베이스', step: 'L', design: true }
  };
  KNOWLEDGE.push({ re: /기능사.*(인정|학점|되나|돼)|자격증.*(인정|학점|되나|돼|쓸\s*수)/, kb: KB['cert-credit'] });
  // "전화번호 변경"(IQ-004)이 전화 연결로 가지 않게 "전화 상담·문의" 꼴만 잡는다
  var RE_PHONE = /(상담사|상담원|사람|직원|담당자).*(연결|통화|얘기|이야기|바꿔)|전화\s*(상담|문의|할래|하고\s*싶|주세요|드릴)|^상담(원|사)?$/;
  var RE_PERSONAL = /(내|제|나의|저의)\s*(출석|성적|과제|시험|점수|결석|진도|학점|일정|마감|수강|결제|등록)|(출석률|성적|점수).*(알려|몇|확인해)/;
  var RE_DESIGN = /(학위|학사|전문학사|공학사|몇\s*학점|학습설계|편입|졸업하려면|자격증.*(인정|학점))/;

  function handleText(text) {
    if (RE_PHONE.test(text)) { think(null, function () { connectCard({ reason: 'request' }); }); return; }
    if (RE_PERSONAL.test(text)) {
      var topic = /출석|결석|진도/.test(text) ? 'GD-019' : /시험|점수/.test(text) ? 'GD-024' : /과제/.test(text) ? 'GD-029' : /성적/.test(text) ? 'GD-017' : /결제|등록/.test(text) ? 'GD-049' : 'GD-019';
      if (!S.member) { think(null, function () { loginCard({ reason: 'personal', caseId: topic }); }); return; }
      think(null, function () {
        botRow(say(S.name + '님의 현황이에요.'), myStatusCard(CASES[topic]), feedbackRow({ caseId: topic }),
          demoOnly(h('div', { class: 'chat-meta' }, '로그인 질문 → 내 현황 조회(cblms 뷰, 구현 단계 확정). 값은 예시')),
          chips([{ label: CASES[topic].q + ' 안내 보기', run: function () { showCase(topic); } }, homeChip()]));
      });
      return;
    }
    for (var i = 0; i < KNOWLEDGE.length; i++) {
      if (KNOWLEDGE[i].re.test(text)) { var k = KNOWLEDGE[i].kb || KNOWLEDGE[i]; think('안내 자료를 찾는 중…', function () { knowledgeAnswer(k); }); return; }
    }
    var ranked = match(text);
    var top = ranked[0], second = ranked[1];
    // 학습설계를 원하는 말(LD-001 "학위 취득 방법" 포함)은 원문 메뉴가 아니라 바로 신청 폼으로 — 요청자 10/30
    if (/학습설계|학습상담/.test(text) || (top && top.id === 'LD-001' && top.score >= 0.5)) { think(null, startDesign); return; }
    if (top && top.score >= 0.5 && (!second || top.score - second.score >= 0.12)) { showCase(top.id); return; }
    if (RE_DESIGN.test(text) && (!top || top.score < 0.5)) { think(null, startDesign); return; }
    var cands = ranked.filter(function (r) { return r.score >= 0.28; }).slice(0, 3);
    think(null, function () {
      if (cands.length) {
        botRow(say('혹시 이 질문인가요?'), chips(cands.map(function (r) { return { label: CASES[r.id].q, run: function () { showCase(r.id); } }; })
          .concat([{ label: '아니에요, 다른 질문이에요', kind: 'sub', run: function () { connectCard({ reason: 'nomatch' }); } }])),
          demoOnly(h('div', { class: 'chat-meta' }, '③ 애매 — 후보 ' + cands.map(function (r) { return r.id + ' ' + r.score.toFixed(2); }).join(', ') + ' (임계값은 평가셋 뒤에 정한다)')));
      } else {
        connectCard({ reason: 'nomatch' });
      }
    });
  }
  function knowledgeAnswer(k) {
    var next = [];
    if (k.caseId && CASES[k.caseId]) next.push({ label: '원문 안내 보기', run: function () { showCase(k.caseId); } });
    if (k.design) next.unshift({ label: '내 조건으로 학습설계 받기', run: startDesign });
    var b = backChip(); if (b) next.push(b);
    next.push(homeChip());
    botRow(h('div', { class: 'chat-ai-note' }, ico('info', 'ico-sm'), ' AI가 안내 자료를 찾아 정리했어요'),
      bubble(k.text), feedbackRow({ source: k.source, copy: k.text }),
      demoOnly(h('div', { class: 'chat-meta' }, k.file
        ? '② 지식 인용 — 케이스가 아니라 상담AI 지식베이스로 답한다. 프로토타입은 고정 문장'
        : '② 지식 인용 — 인용 문장이 원문(' + k.caseId + ')에 있는지 코드가 검증한 답만 낸다. 프로토타입은 고정 예시')),
      chips(next));
  }

  /* ---- 로그인 안내 (CH-05) --------------------------------------------- */
  function loginCard(opts) {
    var c = opts.caseId ? CASES[opts.caseId] : null;
    var foot = [btn('btn--primary', '로그인', doLogin)];
    if (c && c.login !== 'required') foot.push(btn('btn--outline', '일반 안내만 볼게요', function () { showCase(c.id); }));
    var title = opts.reason === 'required' ? '본인 확인이 필요한 문의예요' : '로그인이 필요한 질문이에요';
    botRow(h('div', { class: 'notice notice--info' }, ico('lock'),
      h('div', { class: 'notice__body' },
        h('strong', { class: 'notice__title' }, title),
        '로그인하신 뒤 다시 질문해 주세요. 로그인하지 않아도 알려드릴 수 있는 일반 안내는 계속 도와드릴게요.',
        h('div', { class: 'chat-actions', style: 'margin-top:10px' }, foot),
        h('p', { style: 'margin:8px 0 0;font-size:12px' }, '회원이 아니신가요? ', h('button', { type: 'button', class: 'btn btn--link btn--underline btn--sm', on: { click: function () { linkClick('회원가입'); } } }, '회원가입')))),
      demoOnly(h('div', { class: 'chat-meta' }, 'CH-05 — 로그인 후 어디로 돌아올지·위젯 자동 열기는 unilms가 정한다. 돌아오면 새 대화로 시작'
        + (c ? ' · 대상 ' + c.id : ''))));
  }
  function doLogin() {
    sys('unilms 로그인 페이지로 이동합니다');
    later(function () {
      setMember(true);
      if (panel.hidden) openPanel();
      botRow(say('로그인됐어요. 묻던 질문을 다시 입력해 주세요.'),
        demoOnly(h('div', { class: 'chat-meta' }, '프로토타입: 로그인하고 돌아온 상태를 흉내 냄 — 비로그인 대화는 서버에 없어 복원하지 않는다')));
    }, 900);
  }

  /* ---- 전화·상담사 연결 (CH-07 · CH-09) -------------------------------- */
  var REASONS = {
    nomatch: '죄송해요, 제가 정확히 답변드리기 어려운 내용이 포함되어 있어요.',   // 요청자 10/30 — "자료에서 못 찾음"보다 챗봇이 말하는 뉘앙스로
    request: '상담이 필요하시군요.',
    human: '이 문의는 담당자가 직접 처리해요.',
    error: '문제가 계속되면 전화로 도와드릴게요.',
    feedback: '정확한 안내를 위해 전화로 도와드릴게요.',
    stopped: '',
    home: '',
    user: '',
    case: '',
    design: '담당자 확인이 필요한 부분이 있어요.',
    noagree: '개인정보 수집에 동의하지 않으면 상담 요청을 접수할 수 없어요.'
  };
  function connectCard(opts) {
    opts = opts || {};
    var st = hoursState(), nxt = nextOpen();
    var parts = [];
    if (REASONS[opts.reason]) parts.push(say(REASONS[opts.reason]));
    if (opts.caseId === 'IQ-001') {
      parts.push(h('div', { class: 'notice notice--inline' }, ico('info'),
        h('span', { class: 'notice__body' }, '전화하실 때 성함 · 아이디 · 변경 전 휴대전화 번호를 알려 주세요.')));
    }
    var numRow = h('div', { class: 'chat-phone__num' }, ico('mobile'), PHONE);
    if (!isMobile()) numRow.appendChild(btn('btn--sm', '복사', function () { copyText(PHONE); }));
    var connect = h('div', { class: 'chat-connect' + (S.counselor ? ' has-two' : '') },
      isMobile()
        ? h('a', { class: 'btn btn--secondary', href: 'tel:' + PHONE.replace(/-/g, ''), on: { click: function () { record('call'); } } }, ico('mobile'), '전화하기')
        : btn('btn--secondary', [ico('mobile'), '전화번호 보기'], function () { record('call'); copyText(PHONE); }),
      S.counselor ? btn('btn--primary', [ico('chat'), '상담사와 채팅'], function () { counselorChat(opts); }) : null);
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, S.counselor ? '사람과 연결해 드릴게요' : '전화로 도와드릴게요')),
      h('div', { class: 'chat-card__body' },
        numRow,
        h('ul', { class: 'chat-phone__hours' }, h('li', null, '월~금 10:00~18:00'), h('li', null, '점심 13:00~14:00'), h('li', null, '공휴일·주말 제외')),
        st !== 'open' ? h('div', { class: 'notice notice--warning notice--inline', style: 'margin-top:10px' }, ico('clock'),
          h('span', { class: 'notice__body' }, '지금은 운영시간이 아니에요. 다음 상담 가능 시간은 ', h('strong', null, nextLabel(nxt)), '입니다.')) : null,
        h('div', { style: 'margin-top:12px' }, connect),
        S.lastQuestion ? h('div', { style: 'margin-top:8px' }, btn('btn--link btn--underline btn--sm', '문의 내용 복사', function () { copyText(S.lastQuestion); }),
          h('span', { class: 'chat-meta' }, ' 전화할 때 읽을 수 있게 — 서버로 보내지 않아요')) : null));
    parts.push(card);
    function record(what) {
      card.appendChild(demoOnly(h('div', { class: 'chat-meta', style: 'padding:0 16px 12px' }, '전환 기록: ' + (what === 'call' ? '[전화] 누름' : '') + ' · 사유=' + (opts.reason || '-') + ' · 케이스=' + (opts.caseId || '-'))));
    }
    parts.push(demoOnly(h('div', { class: 'chat-meta' }, 'CH-07 전환 기록(F-09): 카드 표시 · 사유=' + (opts.reason || '-') + ' · 케이스=' + (opts.caseId || '-') + ' · 원문 없이' + (S.member ? '' : ' (비로그인도 집계)')
      + ' · 상담사 연결 ' + (S.counselor ? '켬' : '꺼 둠(관리 설정)'))));
    parts.push(chips([homeChip()]));
    botRow.apply(null, parts);
  }
  function counselorChat(opts) {
    userSay('상담사와 채팅');
    var st = hoursState();
    if (st !== 'open') {
      botRow(say('지금은 채팅 상담 시간이 아니에요. 다음 상담 가능 시간은 ' + nextLabel(nextOpen()) + '입니다.'),
        demoOnly(h('div', { class: 'chat-meta' }, '채팅 가능 시간은 켤 때 정한다')), chips([homeChip()]));
      return;
    }
    var num = h('div', { class: 'chat-queue__num' }, '2');
    var q = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '상담사 연결 중'), h('span', { class: 'badge badge--soft' }, '3단계')),
      h('div', { class: 'chat-queue' }, h('span', { class: 'chat-meta' }, '내 앞 대기'), num,
        h('span', { style: 'font-size:13px;color:var(--text-sub)' }, '지금까지 나눈 대화는 상담사에게 함께 전달돼요.'),
        btn('btn--sm', '연결 취소', function () { S.timers.forEach(clearTimeout); q.classList.add('is-done'); botRow(say('연결을 취소했어요.'), chips([phoneChip('user'), homeChip()])); })));
    botRow(q, demoOnly(h('div', { class: 'chat-meta' }, 'CH-09 — 지금은 꺼 둔 화면. 접수 폼 없이 대화에서 바로 연결, 상담사는 공용 대기열(CH-A3)'
      + (S.member ? '' : ' · 비로그인 사용 여부는 켤 때 정한다(미보관 원칙과 충돌)'))));
    later(function () { num.textContent = '1'; }, 1500);
    later(function () {
      q.classList.add('is-done');
      var row = botRow(say('상담사가 연결됐어요. 무엇을 도와드릴까요?'));
      row.parentNode.querySelector('.chat-avatar').textContent = '상담';
      row.parentNode.querySelector('.chat-avatar').style.background = 'var(--color-secondary)';
    }, 3200);
  }

  /* ---- 학습설계 (CH-06) ------------------------------------------------- */
  // 입력 칸·순서·목록·검증 문구는 unilms 학습상담신청(공학사) 폼 그대로다(front/apply/consult.html · CounselService, unilms 0e8bd96).
  // 같은 칸이어야 접수가 cblms 상담 행과 같은 모양이 되고 상담AI가 지금 접수처럼 분석한다.
  // 폼과 다른 점은 하나 — 이름·휴대폰·이메일·희망상담시간·동의는 결과를 본 뒤 상담 요청(requestCard)에서 받는다(비로그인 미보관)
  var IN_PATHS = ['지인소개', '블로그,SNS', '국가평생교육진흥원 홈페이지', '네이버 검색', '구글 검색', 'AI추천'];
  var IN_PATH_LABEL = { '국가평생교육진흥원 홈페이지': '국평원 홈페이지' };
  var BACHELOR = ['전자공학', '기계공학', '안전공학', '전기공학', '자동차공학', '건축공학', '토목공학', '제어계측공학', '산업공학', '컴퓨터공학',
    '정보통신공학', '기관공학', '항공정비공학', '정보보호학', '전파공학', '메카트로닉스학', '기계설계공학', '조선공학', '건축설비학', '환경공학',
    '매체공학', '교통공학', '인공지능', '음향공학', '멀티미디어학', '화학공학', 'AI융합 산업공학', '금속공학', '게임프로그래밍학'];
  var ASSOCIATE = ['건축', '기계', '전자', '안전공학', '토목', '정보통신', '전기', '기계설계', '정보보호', '산업정보시스템경영', '항공정비', '조선',
    '환경관리', '멀티미디어', '방송음향', '화학공업'];
  var EDU_GRADES = ['고등학교', '2년제 대학', '3년제 대학', '4년제 대학', '학점은행제 전문학사', '학점은행제 학사', '외국대학'];
  var EDU_STATUSES = ['재학', '휴학', '중퇴', '졸업'];
  var HOPE_TIMES = ['오전 10시00분~10시30분', '오전 10시30분~11시00분', '오전 11시00분~11시30분', '낮 12시00분~12시30분', '낮 12시30분~오후1시00분',
    '오후 2시00분~2시30분', '오후 2시30분~3시00분', '오후 3시00분~3시30분', '오후 3시30분~4시00분', '오후 4시00분~4시30분', '오후 4시30분~5시00분', '오후 5시00분~5시30분'];
  var PATHS = [['bachelor', '학사', '4년제 학위과정 전공'], ['associate', '전문학사', '2년제 학위과정 전공'], ['license', '산업기사·기사 응시', '전공 대신 자격증으로 검색']];
  var LICENSES = window.CB_LICENSES || [];   // 학점인정 자격증 826건 — 폼 자동완성·서버 검사와 같은 목록(licenses.js)
  var PHONE_RE = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})-?[0-9]{4}-?[0-9]{4}$/;
  var STEPS = 6;

  function startDesign() {
    S.design = { basic: {}, goal: {}, edu: {}, certs: [], memo: '', extra: {}, round: 0 };
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, ico('cap'), h('span', { class: 'chat-card__title' }, '학습설계 신청')),
      h('div', { class: 'chat-card__body' },
        h('p', { style: 'margin:0' }, '전공별 학위 이수 또는 자격증 취득 조건에 맞도록 맞춤형 학습 계획을 안내해 드려요. ',
          h('strong', null, '정확한 정보를 입력해 주셔야 올바른 상담 및 학위 취득이 가능합니다.')),
        h('p', { class: 'chat-meta', style: 'margin:6px 0 0' }, '학습상담신청과 같은 항목 · 5단계 · 약 3분. 이름·연락처는 결과를 본 뒤 상담을 요청할 때만 받아요'),
        h('details', { class: 'chat-guide' }, h('summary', null, '학습설계 신청 안내 보기'),
          h('ol', null,
            h('li', null, h('strong', null, '정확한 정보 기입'), ' 해당 정보가 사실과 다를 경우 학위취득이 지연될 수 있습니다.'),
            h('li', null, h('strong', null, '자격증 학점인정 기준'), ' 자격증은 학위 취득 이후에 취득한 자격증만 인정 가능합니다.(단, 취득년도에 따라 상이함)'),
            h('li', null, h('strong', null, '학점 인정 및 학위 심의'), ' 상담내용은 참고용으로, 최종 학점인정 및 학습설계는 국가평생교육진흥원 심의결과에 따릅니다.'),
            h('li', null, h('strong', null, '신청 절차'), ' 학습자등록, 학점인정신청, 학위신청 등은 모두 학습자 본인이 직접 진행해야 합니다.')))),
      h('div', { class: 'chat-card__foot' },
        btn('btn--ghost', '학위 과정 안내 먼저 보기', function () { userSay('학위 과정 안내'); showCase('LD-001'); }),
        btn('btn--primary', '시작하기', function () { card.classList.add('is-done'); stepBasic(); })));
    botRow(card, demoOnly(h('div', { class: 'chat-meta' }, '칸·순서·목록·검증 문구 = unilms 학습상담신청(/apply/consult). 접수하면 같은 cblms 상담 행이 생겨 상담AI가 그대로 분석한다')));
  }

  function formCard(step, title, rows, onNext, opts) {
    opts = opts || {};
    var form = h('div', { class: 'form form--plain chat-form' }, rows);
    form.addEventListener('input', clearRow); form.addEventListener('change', clearRow);
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-progress', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(step / STEPS * 100) + '%' })),
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, title), h('span', { class: 'chat-card__step' }, step + '/' + STEPS)),
      h('div', { class: 'chat-card__body', style: 'padding-top:0;padding-bottom:0' }, form),
      h('div', { class: 'chat-card__foot' },
        opts.skip ? btn('btn--ghost', '건너뛰기', function () { card.classList.add('is-done'); opts.skip(); }) : null,
        btn('btn--primary', opts.nextLabel || '다음', function () { if (onNext(form)) card.classList.add('is-done'); })));
    botRow(card, opts.meta ? demoOnly(h('div', { class: 'chat-meta' }, opts.meta)) : null);
    var first = form.querySelector('input:not([type=radio]):not([type=checkbox]),select,textarea'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
    return form;
  }
  function row(label, control, opts) {
    opts = opts || {};
    return h('div', { class: 'form__row', 'data-field': opts.field || '' },
      h('span', { class: 'form__label' }, label, opts.req ? h('span', { class: 'req' }, ' *') : null),
      h('div', { class: 'form__control' }, control, opts.help ? h('span', { class: 'form__help' }, opts.help) : null, h('span', { class: 'form__msg' }, opts.msg || '필수 항목이에요')));
  }
  function select(name, list, value, placeholder) {
    return h('select', { class: 'select', name: name }, h('option', { value: '' }, placeholder || '선택'),
      list.map(function (v) { return h('option', { value: v, selected: v === value }, v); }));
  }
  function seg(name, list, value, labels) {
    return h('div', { class: 'chat-seg', role: 'radiogroup' }, list.map(function (v) {
      return h('label', null, h('input', { type: 'radio', name: name, value: v, checked: v === value }), h('span', null, (labels && labels[v]) || v));
    }));
  }
  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('select[name="' + name + '"],input[name="' + name + '"]:not([type=radio]):not([type=checkbox]),textarea[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }
  function invalid(form, field, on) { var r = form.querySelector('[data-field="' + field + '"]'); if (r) r.classList.toggle('is-invalid', on); return on; }
  // 폼의 검증 문구를 그 칸에 — msg 가 없으면 지운다
  function fail(form, field, msg) {
    var r = form.querySelector('[data-field="' + field + '"]');
    if (r) { r.classList.toggle('is-invalid', !!msg); if (msg) r.querySelector('.form__msg').textContent = msg; }
    return !!msg;
  }
  function clearRow(e) { var r = e.target.closest('.form__row'); if (r) r.classList.remove('is-invalid'); }

  function stepBasic(back) {
    var d = S.design;
    var rows = [];
    if (S.member) {
      rows.push(row('신청자', h('div', { class: 'chat-sum' }, h('span', null, S.name + ' · 010-****-5678'), h('span', { class: 'chat-meta' }, '회원 정보')), { help: '연락처·희망상담시간은 상담 요청할 때 확인해요' }));
    }
    rows.push(row('유입경로', seg('inPath', IN_PATHS, d.basic.inPath, IN_PATH_LABEL), { req: true, field: 'inPath' }));
    rows.push(row('학점은행제 이용 여부', seg('bankYn', ['없음', '있음'], d.basic.bankYn), { req: true, field: 'bankYn', help: S.member ? '로그인하면 수강 이력으로 미리 채워요(프로토타입은 직접 선택)' : null }));
    formCard(1, '유입경로 · 학점은행제 이용 여부', rows, function (f) {
      var p = val(f, 'inPath'), b = val(f, 'bankYn');
      var bad = fail(f, 'inPath', p ? null : '유입경로를 입력하세요.');
      bad = fail(f, 'bankYn', b ? null : '학점은행제 이용여부를 입력하세요.') || bad;
      if (bad) return false;
      d.basic = { inPath: p, bankYn: b };
      userSay((IN_PATH_LABEL[p] || p) + ' · 학점은행제 이용 ' + b);
      back ? stepConfirm() : stepGoal();
      return true;
    }, { meta: '폼 칸 inPath(6종)·bankYn(없음 0 / 있음 1)' });
  }
  function stepGoal(back) {
    var d = S.design;
    var box = h('div', { style: 'margin-top:8px' });
    function render(p) {
      box.innerHTML = '';
      if (p === 'license') {
        box.appendChild(acInput('target', LICENSES, d.goal.target, null, '두 글자 이상 입력 (예: 산업안전)'));
        box.appendChild(h('span', { class: 'form__help' }, '검색어(2글자 이상) 입력 후 자동완성 목록에서 자격증을 직접 선택해주세요.'));
      } else {
        var assoc = p === 'associate';
        box.appendChild(select('major', assoc ? ASSOCIATE : BACHELOR, d.goal.major, '선택하세요 (' + (assoc ? '16' : '29') + '개, 인기순)'));
      }
    }
    var cur = d.goal.path || 'bachelor';
    var group = h('div', { class: 'choice-group choice-group--row chat-choice', role: 'radiogroup' }, PATHS.map(function (p) {
      return h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'path', value: p[0], checked: p[0] === cur }),
        h('span', { class: 'choice__title' }, p[1]), h('span', { class: 'choice__desc' }, p[2]));
    }));
    group.addEventListener('change', function (e) { if (e.target.name === 'path') render(e.target.value); });
    formCard(2, '희망전공', [row('희망전공', h('div', null, group, box), { req: true, field: 'major' })], function (f) {
      var p = val(f, 'path') || 'bachelor', major = '', target = '', msg = null;
      if (p === 'license') {
        target = val(f, 'target');
        if (LICENSES.indexOf(target) < 0) msg = '응시 예정 자격증을 목록에서 선택해주세요.';
      } else {
        major = val(f, 'major');
        if (!major) msg = p === 'associate' ? '희망전공(전문학사)을 선택해주세요.' : '희망전공(학사)을 선택해주세요.';
      }
      if (fail(f, 'major', msg)) return false;
      var label = PATHS.filter(function (x) { return x[0] === p; })[0][1];
      d.goal = { path: p, degree: label, major: major, target: target };
      userSay(label + ' · ' + (target || major));
      back ? stepConfirm() : stepEdu();
      return true;
    }, { meta: '폼 칸 majorPath + hopeMajor(학사 29) / hopeMajorAssoc(전문학사 16) / licenseTarget(자격증 826건 중 선택)' });
    render(cur);
  }
  // 학습상담신청 폼에는 없지만 계산에 필요한 것 — 추가폼 요청서 1·4·5와 상담AI ③.
  // 최종학력에 따라 같은 카드에 붙인다(요청자 10/30 "전적대 전공, 직전에 취득한 학점"). cblms 폼은 바꾸지 않으므로 접수 API가 따로 싣는다
  function isCollege(g, st) { return /^(2년제|3년제|4년제) 대학$|외국대학/.test(g) && /졸업|중퇴|재학/.test(st); }
  function isBankDegree(g, st) { return /학점은행제/.test(g) && st === '졸업'; }
  function stepEdu(back) {
    var d = S.design, x = d.extra;
    var grade = select('grade', EDU_GRADES, d.edu.grade, '학년제 선택');
    var status = select('status', EDU_STATUSES, d.edu.status, '상태 선택');
    var grad = h('input', { class: 'input', type: 'month', name: 'grad', value: d.edu.grad || '', max: iso(now()).slice(0, 7), 'aria-label': '졸업연월' });
    var gradBox = h('div', { style: 'margin-top:6px' }, grad, h('span', { class: 'form__help' }, '졸업연월'));
    // 폼과 같다 — 졸업이고 고등학교가 아니면 졸업연월
    function need() { return status.value === '졸업' && grade.value !== '고등학교'; }

    function num(name, ph, v) { return h('input', { class: 'input', name: name, type: 'number', min: 0, placeholder: ph, value: v || '' }); }
    var unknown = h('input', { type: 'checkbox', name: 'prevMajorUnknown', checked: !!x.prevMajorUnknown });
    var majorLabel = h('span', null, '전적대 학과(전공)');
    var prevRow = row(majorLabel, h('div', null,
      h('input', { class: 'input', name: 'prevMajor', value: x.prevMajor || '', placeholder: '예) 건축학과' }),
      h('label', { class: 'check', style: 'margin-top:4px' }, unknown, h('span', { class: 'check__box' }), '모르겠어요')),
      { req: true, field: 'prevMajor', help: '희망전공과 얼마나 관련 있는지에 따라 인정 학점이 달라져요. 모르면 학점인정 신청 결과를 먼저 받아 보시도록 안내해 드려요', msg: '전적대 학과를 적거나 "모르겠어요"를 골라 주세요' });
    var creditRow = row('전적대 이수학점', num('prevCredit', '예) 76', x.prevCredit), { field: 'prevCredit', help: '성적증명서의 총 이수학점. 모르면 비워 두세요' });
    var other = x.other || {};
    var otherRow = row('이미 인정받은 학점', h('div', { class: 'grid-3' }, num('otherMajor', '전공', other.major), num('otherLib', '교양', other.liberal), num('otherGen', '일반선택', other.general)),
      { field: 'other', help: '학점은행제에서 이미 인정받은 학점을 이수구분별로. 모르면 비워 두세요' });
    var takingRow = row('수강 중 과목', h('input', { class: 'input', name: 'taking', value: x.taking || '', placeholder: '예) 건축구조, 건축시공' }), { field: 'taking' });
    function sync() {
      gradBox.hidden = !need();
      var col = isCollege(grade.value, status.value), bank = isBankDegree(grade.value, status.value);
      prevRow.hidden = !(col || bank);
      majorLabel.textContent = bank ? '이전 학위 전공' : '전적대 학과(전공)';
      creditRow.hidden = !col;
    }
    grade.addEventListener('change', sync); status.addEventListener('change', sync);
    var rows = [row('최종학력', h('div', null, h('div', { class: 'grid-2' }, grade, status), gradBox), { req: true, field: 'edu' }), prevRow, creditRow];
    if (d.basic.bankYn === '있음') rows.push(otherRow, takingRow);   // 요청서 4·5 — 학점은행제 이용 "있음"일 때만
    formCard(3, d.basic.bankYn === '있음' ? '최종학력 · 이전 학점' : '최종학력', rows, function (f) {
      var msg = !grade.value ? '학년제를 선택해주세요.' : !status.value ? '상태를 선택해주세요.' : need() && !grad.value ? '졸업연월을 입력해주세요.' : null;
      var bad = fail(f, 'edu', msg);
      var askMajor = !prevRow.hidden, pm = val(f, 'prevMajor');
      bad = invalid(f, 'prevMajor', askMajor && !pm && !unknown.checked) || bad;
      if (bad) return false;
      d.edu = { grade: grade.value, status: status.value, grad: need() ? grad.value : '' };
      x.prevMajor = askMajor ? pm : ''; x.prevMajorUnknown = askMajor && !pm && unknown.checked;
      x.prevCredit = creditRow.hidden ? '' : val(f, 'prevCredit');
      if (d.basic.bankYn === '있음') {
        var o = { major: val(f, 'otherMajor'), liberal: val(f, 'otherLib'), general: val(f, 'otherGen') };
        x.other = o.major || o.liberal || o.general ? o : '';
        x.taking = val(f, 'taking');
      }
      var said = d.edu.grade + ' ' + d.edu.status + (d.edu.grad ? ' (' + d.edu.grad + ')' : '');
      if (askMajor) said += ' · ' + (pm || '학과 모름') + (x.prevCredit ? ' ' + x.prevCredit + '학점' : '');
      if (x.other) said += ' · 인정 학점 전공 ' + (x.other.major || 0) + ' / 교양 ' + (x.other.liberal || 0) + ' / 일반 ' + (x.other.general || 0);
      userSay(said);
      back ? stepConfirm() : stepCerts();
      return true;
    }, { meta: '폼 칸 eduGrade·eduStatus·gradDate(cblms last_edu·grad_ym) + 폼에 없는 칸: 전적대 학과·이수학점(요청서 1·M-02, ③ 이전 학위 전공), 이미 인정받은 학점·수강 중 과목(요청서 4·5, ③ 다른 교육원 인정 학점) — 접수 API가 함께 싣는다' });
    sync();
  }
  function acInput(name, list, value, onPick, placeholder) {
    var inp = h('input', { class: 'input', name: name, value: value || '', autocomplete: 'off', placeholder: placeholder || '예) 건축', role: 'combobox', 'aria-expanded': 'false' });
    var ul = h('ul', { class: 'chat-ac__list', role: 'listbox', hidden: true });
    function render() {
      var q = inp.value.trim();
      ul.innerHTML = '';
      if (q.length < 2) { ul.hidden = true; return; }
      var hits = list.filter(function (c) { return c.replace(/\s/g, '').indexOf(q.replace(/\s/g, '')) >= 0; }).slice(0, 8);
      if (!hits.length || (hits.length === 1 && hits[0] === q)) { ul.hidden = true; return; }
      hits.forEach(function (c) { ul.appendChild(h('li', { role: 'option', on: { mousedown: function (e) { e.preventDefault(); inp.value = c; ul.hidden = true; inp.dispatchEvent(new Event('input', { bubbles: true })); if (onPick) onPick(c); } } }, c)); });
      ul.hidden = false;
    }
    inp.addEventListener('input', render);
    inp.addEventListener('blur', function () { setTimeout(function () { ul.hidden = true; }, 120); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && onPick && inp.value.trim()) { e.preventDefault(); onPick(inp.value.trim()); ul.hidden = true; } });
    return h('div', { class: 'chat-ac' }, inp, ul);
  }
  function stepCerts(back) {
    var d = S.design;
    var list = h('div', { class: 'chat-cert-rows' });
    var cmp = h('span', { class: 'form__help', hidden: true });
    // 폼과 같은 안내 — 가장 이른 취득일과 졸업연월을 비교
    function compare() {
      var dates = Array.prototype.map.call(list.querySelectorAll('input[type=date]'), function (i) { return i.value; }).filter(Boolean).sort();
      if (!d.edu.grad || !dates.length) { cmp.hidden = true; return; }
      var before = dates[0].slice(0, 7) <= d.edu.grad;
      cmp.hidden = false;
      cmp.textContent = '자격증 취득일(' + dates[0] + ')이 졸업일(' + d.edu.grad + ')보다 ' + (before ? '앞섭니다 — 졸업 전 취득' : '뒤입니다 — 졸업 후 취득') + '으로 판단됩니다.';
    }
    function addRow(c) {
      var ac = acInput('certName', LICENSES, c ? c.name : '', null, '자격증명');
      var nameIn = ac.querySelector('input');
      var date = h('input', { class: 'input', type: 'date', name: 'certDate', value: c ? c.date || '' : '', max: iso(now()), 'aria-label': '취득일' });
      var note = h('span', { class: 'form__help', hidden: true }, '기능사2급 또는 급수가 없는 기능사는 학점인정 대상이 아닙니다. 입력하지 않으셔도 상담에는 영향이 없습니다.');
      var r = h('div', { class: 'chat-cert-row' }, ac, date,
        h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': list.children.length ? '자격증 삭제' : '자격증 입력 초기화', on: { click: function () {
          if (r === list.firstElementChild) { nameIn.value = ''; date.value = ''; note.hidden = true; } else r.remove();
          compare();
        } } }, ico('close', 'ico-sm')), note);
      function sync() { var v = nameIn.value; note.hidden = !(v.indexOf('기능사') > -1 && v.indexOf('기능사1급') === -1); }
      nameIn.addEventListener('input', sync); sync();
      date.addEventListener('change', compare);
      list.appendChild(r);
      return nameIn;
    }
    (d.certs.length ? d.certs : [null]).forEach(addRow);
    var add = h('button', { type: 'button', class: 'btn btn--sm', on: { click: function () { addRow(null).focus(); } } }, ico('plus', 'ico-sm'), '추가하기');
    formCard(4, '자격증', [row('자격증', h('div', null, list, h('div', { style: 'margin-top:6px' }, add), cmp), { field: 'cert', help: '없으면 비워 두고 다음을 눌러 주세요. 목록에 없어도 이름 그대로 적으면 돼요(명칭 변경 전 취득)' })], function () {
      d.certs = [];
      Array.prototype.forEach.call(list.children, function (r) {
        var n = r.querySelector('input[name="certName"]').value.trim();
        if (n) d.certs.push({ name: n, date: r.querySelector('input[name="certDate"]').value, manual: LICENSES.indexOf(n) < 0 });
      });
      userSay(d.certs.length ? '자격증: ' + d.certs.map(function (c) { return c.name + (c.date ? '(' + c.date + ')' : ''); }).join(', ') : '자격증 없음');
      back ? stepConfirm() : stepMemo();
      return true;
    }, { meta: '폼 칸 majorSubject[]·obtentionDate[] — cblms 자격증 행(이름·취득일). 이름은 목록 밖도 받는다(폼과 같음)' });
    compare();
  }
  function stepMemo(back) {
    var d = S.design;
    botRow(h('div', { class: 'chat-card' },
      h('div', { class: 'chat-progress', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(5 / STEPS * 100) + '%' })),
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '학위취득 목적 및 상담내용'), h('span', { class: 'chat-card__step' }, '5/' + STEPS)),
      h('div', { class: 'chat-card__body' }, '학위가 필요한 이유와 궁금한 점을 ', h('strong', null, '아래 입력창'), '에 적어 주세요.',
        h('p', { class: 'chat-meta', style: 'margin:6px 0 0' }, '* 상세하게 내용을 입력해 주시면 더욱 정확한 상담이 가능합니다.'),
        h('p', { class: 'chat-meta', style: 'margin:2px 0 0' }, '예) 회사 승진에 학사가 필요해요. 전문대 건축과를 나왔고 건축기사 준비 중이에요.'),
        d.memo ? h('p', { class: 'chat-meta', style: 'margin:6px 0 0' }, '지금 적힌 내용: ' + d.memo) : null)),
      demoOnly(h('div', { class: 'chat-meta' }, '폼 칸 memo(필수 — "상담내역 및 문의를 입력하세요.") → 상담내용 해석(MEMO_INTERPRET)이 사실+원문 인용으로 바꾼다(ADR-034)')));
    input.placeholder = '학위취득 목적과 상담내용을 적어 주세요';
    input.focus();
    S.awaiting = function (text) { d.memo = text; stepConfirm(); };
  }
  function designSummary(d) {
    return h('dl', { class: 'chat-sum' },
      h('dt', null, '유입경로'), h('dd', null, IN_PATH_LABEL[d.basic.inPath] || d.basic.inPath || '-'),
      h('dt', null, '학점은행제 이용'), h('dd', null, d.basic.bankYn || '-'),
      h('dt', null, '희망전공'), h('dd', null, (d.goal.degree || '-') + ' · ' + (d.goal.target || d.goal.major || '-')),
      h('dt', null, '최종학력'), h('dd', null, (d.edu.grade || '-') + ' ' + (d.edu.status || '') + (d.edu.grad ? ' (' + d.edu.grad + ')' : '')),
      d.extra.prevMajor || d.extra.prevMajorUnknown ? [h('dt', null, '전적대 학과'), h('dd', null, (d.extra.prevMajor || '모름') + (d.extra.prevCredit ? ' · ' + d.extra.prevCredit + '학점' : ''))] : null,
      d.extra.other ? [h('dt', null, '인정받은 학점'), h('dd', null, '전공 ' + (d.extra.other.major || 0) + ' · 교양 ' + (d.extra.other.liberal || 0) + ' · 일반선택 ' + (d.extra.other.general || 0))] : null,
      d.extra.taking ? [h('dt', null, '수강 중'), h('dd', null, d.extra.taking)] : null,
      h('dt', null, '자격증'), h('dd', null, d.certs.length ? d.certs.map(function (c) { return c.name + (c.date ? ' ' + c.date : ''); }).join(', ') : '없음'),
      h('dt', null, '목적·상담내용'), h('dd', null, d.memo || '-'));
  }
  function stepConfirm() {
    var d = S.design;
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-progress', 'aria-hidden': 'true' }, h('i', { style: 'width:100%' })),
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '입력 내용 확인'), h('span', { class: 'chat-card__step' }, STEPS + '/' + STEPS)),
      h('div', { class: 'chat-card__body' }, designSummary(d)),
      h('div', { class: 'chat-card__foot' },
        btn('btn--outline', '수정', function () {
          botRow(say('어느 부분을 고칠까요?'), chips([
            { label: '유입경로·이용 여부', run: function () { stepBasic(true); } },
            { label: '희망전공', run: function () { stepGoal(true); } },
            { label: '최종학력·이전 학점', run: function () { stepEdu(true); } },
            { label: '자격증', run: function () { stepCerts(true); } },
            { label: '목적·상담내용', run: function () { stepMemo(true); } }]));
        }),
        btn('btn--primary', '분석 받기', function () { card.classList.add('is-done'); userSay('분석 받기'); analyze(); })));
    botRow(card);
  }

  // 되묻기 — 계산을 막는 항목만 대화로 하나씩(학습설계 기능정의 5절). 프로토타입은 전적대 학과 하나
  function needsPrevMajor(d) {
    return /^(2년제|3년제|4년제) 대학$|외국대학/.test(d.edu.grade || '') && /졸업|중퇴|재학/.test(d.edu.status || '') && !d.extra.prevMajor && !d.extra.prevMajorUnknown && d.goal.degree !== '산업기사·기사 응시';
  }
  function analyze() {
    var d = S.design;
    think('분석 중입니다…', function () {
      if (needsPrevMajor(d)) {
        botRow(say('계산하기 전에 하나만 여쭤볼게요.\n전적대에서 어떤 학과(전공)를 나오셨나요?'),
          chips([
            { label: '입력할게요', run: function () {
              input.placeholder = '예) 건축학과'; input.focus();
              botRow(say('아래 입력창에 학과 이름을 적어 주세요.'));
              S.awaiting = function (t) { d.extra.prevMajor = t; analyze(); };
            } },
            { label: '모르겠어요', kind: 'sub', run: function () { d.extra.prevMajorUnknown = true; renderS19(); } }]),
          demoOnly(h('div', { class: 'chat-meta' }, '부족정보 — 다시 계산할 수 있는 항목만 되묻는다(RECALCULABLE). 모르면 S-19')));
        return;
      }
      // 입력 단계에서 "모르겠어요"를 골랐으면 숫자 없이 S-19
      if (d.extra.prevMajorUnknown && !d.extra.prevMajor && d.goal.path !== 'license') { renderS19(); return; }
      renderResult();
    });
  }
  function renderS19() {
    var d = S.design;
    think('분석 중입니다…', function () {
      botRow(bubble('전적대 학과를 모르시면 인정받을 수 있는 학점을 정확히 계산할 수 없어요.\n그래서 학점 숫자는 말씀드리지 않을게요.\n▶ 먼저 국가평생교육진흥원에 학점인정 신청을 하시면 전적대 학점이 확정돼요.\n▶ 확정된 뒤 다시 학습설계를 받으시면 남은 학점과 과목을 정확히 안내해 드려요.'),
        demoOnly(h('div', { class: 'chat-meta' }, 'S-19 (ADR-038) — 확인되지 않은 정보로는 계산하지 않고 멈춘다')),
        chips([
          { label: '학점인정신청이란?', run: function () { showCase('GD-003'); } },
          { label: '전적대 학과 입력하기', run: function () { d.extra.prevMajorUnknown = false; analyze(); } },
          { label: '상담 요청', run: requestCard },
          phoneChip('design'), homeChip()]));
    });
  }

  // 결과 계산 — 예시. 학점 기준은 채널톡 원문 LD-002~004, 자격증 인정 값은 예시(실제는 상담AI 엔진 + 고시)
  function compute(d) {
    var deg = d.goal.degree, sch = d.edu.grade || '', st = d.edu.status;
    var grad = st === '졸업';
    var univ = /4년제|학점은행제 학사|외국대학/.test(sch), college = /2년제|3년제|학점은행제 전문학사/.test(sch);
    var rows = [], notes = [], prem = [];
    if (deg === '산업기사·기사 응시') {
      var need = /산업기사/.test(d.goal.target) ? 41 : 106;
      rows.push(['응시자격 학점', need, 0]);
      notes.push(d.goal.target + ' 응시자격 — 학점은행제 ' + need + '학점 이상(동일 직무분야 학점 포함 여부는 담당자 확인)');
      if (!d.extra.career) prem.push('실무경력으로 응시자격을 채울 수 있는지는 경력을 알려 주시면 확인해 드려요');
    } else if (deg === '전문학사') {
      if (grad && (univ || college)) { rows.push(['전공 (타전공 전문학사)', 36, 0]); notes.push('대학 졸업자는 타전공 전문학사로 전공 36학점만 이수'); }
      else { rows.push(['전공', 45, 0], ['교양', 15, 0], ['일반선택', 20, 0]); notes.push('전문학사 총 80학점'); }
    } else {
      if (grad && univ) { rows.push(['전공 (타전공 학사)', 48, 0]); notes.push('학사 학위가 있으면 타전공 학사로 전공 48학점만 이수'); }
      else if (grad && college) {
        var cap = /3년제/.test(sch) ? 120 : 80;
        var given = Number(d.extra.prevCredit || 0);   // 적어 준 이수학점이 상한보다 적으면 그만큼만
        if (given && given < cap) cap = given;
        rows.push(['전공', 60, 0], ['교양', 30, Math.min(30, Math.round(cap * 0.3))], ['일반선택', 50, Math.min(50, cap - Math.min(30, Math.round(cap * 0.3)))]);
        prem.push(given ? '적어 주신 전적대 ' + given + '학점이 모두 인정된다는 전제예요(학점인정 신청 전)' : '전적대 학점이 최대 ' + cap + '학점까지 인정된다는 전제예요(학점인정 신청 전)');
        notes.push('학사 총 140학점 — 전문학사 과정 학점은 최대 ' + cap + '학점까지 인정');
      } else { rows.push(['전공', 60, 0], ['교양', 30, 0], ['일반선택', 50, 0]); notes.push('학사 총 140학점'); }
    }
    var certCredit = 0, certNames = [];
    var used = d.extra.priorUsed || [];
    if (used.length) prem.push(used.join(', ') + ' — 이전 학위과정에서 이미 인정받아 다시 인정되지 않아요');
    d.certs.filter(function (c) { return used.indexOf(c.name) < 0; }).concat(d.extra.planCert ? [{ name: d.extra.planCert, plan: true }] : []).forEach(function (c) {
      var v = /산업기사/.test(c.name) ? 16 : /기사/.test(c.name) ? 20 : 0;
      if (!v) return;
      certCredit += v; certNames.push(c.name + ' ' + v + (c.plan ? '(취득 후)' : ''));
    });
    if (certCredit && deg !== '산업기사·기사 응시') {
      rows[0][2] = Math.min(rows[0][1], rows[0][2] + certCredit);
      if (d.extra.planCert) prem.push(d.extra.planCert + '은 취득한 뒤에 인정돼요');
    }
    var other = d.extra.other || {};
    rows.forEach(function (r) {
      var add = Number((/^전공/.test(r[0]) ? other.major : r[0] === '교양' ? other.liberal : r[0] === '일반선택' ? other.general : 0) || 0);
      r[2] = Math.min(r[1], r[2] + add);
    });
    var remain = rows.reduce(function (s, r) { return s + Math.max(0, r[1] - r[2]); }, 0);
    var floor = deg !== '산업기사·기사 응시' && remain < 18;
    return { rows: rows, remain: floor ? 18 : remain, floor: floor, notes: notes, prem: prem, certNames: certNames, mandatory: deg !== '산업기사·기사 응시' };
  }
  function renderResult() {
    var d = S.design;
    var r = compute(d);
    d.round++;
    var group = h('div', { class: 'chat-result', 'data-round': d.round });
    var prev = log.querySelectorAll('.chat-result:not(.is-old)');
    Array.prototype.forEach.call(prev, function (p) {
      p.classList.add('is-old');
      var content = Array.prototype.slice.call(p.children);
      content.forEach(function (n) { n.hidden = true; });
      var t = btn('btn--link btn--sm', '이전 결과 보기', function () { content.forEach(function (n) { n.hidden = !n.hidden; }); t.textContent = content[0].hidden ? '이전 결과 보기' : '이전 결과 접기'; });
      p.insertBefore(t, p.firstChild);
    });
    log.appendChild(group);
    var target = d.goal.target || d.goal.major;
    var summary = [
      '▶ ' + (d.goal.degree === '산업기사·기사 응시' ? target + ' 응시를 목표로 하시는군요.' : target + ' ' + d.goal.degree + ' 학위를 목표로 하시는군요.'),
      '▶ ' + r.notes.join(' / ')
    ];
    if (d.extra.prevMajor) summary.push('▶ 전적대 ' + d.extra.prevMajor + ' — 희망 전공과 관련성에 따라 전공 학점 인정이 달라져요');
    if (r.certNames.length) summary.push('▶ 자격증 인정(예상): ' + r.certNames.join(', ') + '학점');
    if (r.mandatory) summary.push('▶ 어떤 경우든 평가인정 학습과목으로 18학점 이상(의무 18학점)은 이수해야 해요');
    if (d.memo) summary.push('▶ 말씀하신 내용("' + d.memo.slice(0, 30) + (d.memo.length > 30 ? '…' : '') + '")도 반영했어요');

    var table = h('table', { class: 'chat-table' },
      h('thead', null, h('tr', null, h('th', null, '구분'), h('th', null, '필요'), h('th', null, '인정 예상'), h('th', null, '남은 학점'))),
      h('tbody', null, r.rows.map(function (x) { return h('tr', null, h('td', null, x[0]), h('td', null, String(x[1])), h('td', { class: x[2] ? '' : 'is-muted' }, x[2] ? String(x[2]) : '-'), h('td', null, String(Math.max(0, x[1] - x[2])))); })),
      h('tfoot', null, h('tr', null, h('td', { colspan: 3 }, r.floor ? '앞으로 이수할 학점(의무 18학점 이상)' : '앞으로 이수할 학점'), h('td', null, String(r.remain)))));

    group.appendChild(h('div', { class: 'chat-sys' }, d.round > 1 ? '보완한 정보로 다시 분석했어요' : '분석 결과'));
    var s1 = botRow(bubble(summary.join('\n'), { noFold: true }),
      r.prem.length ? h('div', { class: 'notice notice--warning' }, ico('alert'), h('div', { class: 'notice__body' }, h('strong', { class: 'notice__title' }, '전제'), r.prem.join(' · '))) : null);
    group.appendChild(s1.parentNode);
    var s2 = botRow(h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '향후 필요 학점'), sample('실제는 상담AI 엔진 계산')),
      h('div', { class: 'chat-card__body', style: 'padding:0' }, table),
      h('div', { class: 'chat-card__body', style: 'padding-top:8px' }, h('span', { class: 'chat-meta' }, '숫자는 정보 충분성 게이트(G0~G4)를 통과한 경우에만 보여요'))));
    group.appendChild(s2.parentNode);
    var s3 = botRow(bubble('해야 할 일\n1) 학습자등록 — 처음 한 번\n2) 수강신청 — 희망 전공 과목부터\n3) 학점인정신청 — 전적대·자격증 학점' + (d.goal.degree === '산업기사·기사 응시' ? '\n4) 응시자격 서류 제출' : '\n4) 학위신청 — 학점을 다 채운 뒤'), { noFold: true }),
      h('div', { class: 'chat-actions' },
        btn('btn--outline', ['학습자등록 방법', ico('external', 'ico-sm')], function () { showCase('GD-002'); }),
        btn('btn--outline', ['수강신청 메뉴', ico('external', 'ico-sm')], function () { linkClick('수강신청메뉴'); })),
      h('details', { class: 'chat-card' }, h('summary', { style: 'padding:10px 16px;cursor:pointer;font-size:13px;font-weight:500' }, '학점은행제 필독사항'),
        h('div', { class: 'chat-card__body' }, '결과지의 "학점은행제 필독사항" 고정 문구를 그대로 보여 줍니다.', h('br'), h('span', { class: 'chat-meta' }, '프로토타입: 문구 자리만'))),
      feedbackRow({ caseId: '학습설계 결과', copy: summary.join('\n') }),
      demoOnly(h('div', { class: 'chat-meta' }, '결과지 ② AI 분석과 같은 계산 — 학습자는 채팅으로, 담당자는 CN-02 ② 참고자료로 본다')),
      chips([
        { label: '기간이 얼마나 걸리나요?', run: function () { followPeriod(r); } },
        { label: '자격증으로 줄일 수 있나요?', run: function () { followCert(); } },
        { label: '📝 정보 더 입력하기', run: supplementCard },
        { label: '📞 상담 요청', run: requestCard },
        homeChip()]));
    group.appendChild(s3.parentNode);
    scrollEnd();
  }
  function followPeriod(r) {
    think(null, function () {
      var sem = Math.max(1, Math.ceil(r.remain / 24));
      botRow(bubble('남은 ' + r.remain + '학점을 한 학기 최대 24학점(1년 최대 42학점)으로 들으면 최단 약 ' + sem + '학기가 걸려요.\n다만 학기마다 열리는 과목에 따라 달라질 수 있어요. 열리는 과목이 모자라면 기간을 말씀드리지 않고 담당자가 확인해 드려요.'),
        h('div', { class: 'chat-meta' }, sample('계산'), ' 같은 엔진(SemesterPlanner·OfferingCheck)을 다시 부른 결과로 바뀐다'),
        feedbackRow({ source: '연간/학기당 제한 이수학점', copy: '' }),
        chips([{ label: '📞 상담 요청', run: requestCard }, homeChip()]));
    });
  }
  function followCert() {
    think(null, function () {
      var m = S.design.goal.major || '';
      var rel = LICENSES.filter(function (c) { return m && /기사$/.test(c) && c.indexOf(m.replace(/공학$|학$/, '')) === 0; }).slice(0, 2);
      botRow(bubble('희망 전공과 관련된 국가기술자격증은 전공 학점으로 인정받을 수 있어요.\n' + (rel.length ? '▶ 예: ' + rel.join(', ') + '\n' : '') + '▶ 기사는 20학점, 산업기사는 16학점 정도가 인정돼요(전공과 관련성에 따라 달라요).\n취득 예정인 자격증이 있으면 "정보 더 입력하기"에 적어 주세요. 다시 계산해 드려요.'),
        h('div', { class: 'chat-meta' }, sample('인정 학점'), ' 실제는 자격 학점인정 고시(제28차) 기준으로 엔진이 계산'),
        chips([{ label: '📝 정보 더 입력하기', run: supplementCard }, homeChip()]));
    });
  }

  // 정보 보완 카드 — 결과 뒤 "더 있으면 정확해지는 것"을 한 번에 받는다(화면정의 CH-06 4차).
  // 항목은 요청서 1~5와 상담AI 담당자 입력(CN-02 ③)·부족정보(M-02·M-05)에서 왔다.
  // 학습상담신청 폼에 이미 있는 것(졸업연월 = ③ 이전 학위 취득 연월 등)은 다시 묻지 않는다
  function supplementCard() {
    var d = S.design;
    var g = d.edu.grade || '', st = d.edu.status || '';
    var college = isCollege(g, st), bankDegree = isBankDegree(g, st), x = d.extra;
    var bankYes = d.basic.bankYn === '있음';
    function num(name, ph) { return h('input', { class: 'input', name: name, type: 'number', min: 0, placeholder: ph }); }
    var items = [];
    if ((college || bankDegree) && !x.prevMajor)
      items.push({ key: 'prevMajor', label: college ? '전적대 학과' : '이전 학위 전공', from: '요청서 1 · ③ 이전 학위 전공', ctl: function () { return h('input', { class: 'input', name: 'prevMajor', placeholder: '예) 건축학과' }); } });
    if (college && !x.prevCredit)
      items.push({ key: 'prevCredit', label: '전적대 이수학점', from: 'M-02', ctl: function () { return num('prevCredit', '예) 60'); } });
    if (d.goal.path === 'license')
      items.push({ key: 'career', label: '실무경력(기간·분야)', from: '요청서 2', ctl: function () { return h('input', { class: 'input', name: 'career', placeholder: '예) 건축 현장 3년' }); } });
    items.push({ key: 'planCert', label: '취득 예정 자격증', from: '요청서 3', ctl: function () { return acInput('planCert', LICENSES, '', null, '자격증명'); } });
    if (bankYes) {
      if (!x.other) items.push({ key: 'other', label: '이미 인정받은 학점(이수구분별)', from: '요청서 4 · ③ 다른 교육원 인정 학점',
        ctl: function () { return h('div', { class: 'grid-3' }, num('otherMajor', '전공'), num('otherLib', '교양'), num('otherGen', '일반선택')); },
        get: function (f) { var v = { major: val(f, 'otherMajor'), liberal: val(f, 'otherLib'), general: val(f, 'otherGen') }; return v.major || v.liberal || v.general ? v : ''; } });
      if (!x.taking) items.push({ key: 'taking', label: '수강 중 과목', from: '요청서 5', ctl: function () { return h('input', { class: 'input', name: 'taking', placeholder: '예) 건축구조, 건축시공' }); } });
    }
    var noDate = d.certs.filter(function (c) { return !c.date; });
    if (noDate.length)
      items.push({ key: 'certDates', label: '자격증 취득일', from: 'M-05', help: '취득일에 따라 인정 학점이 달라지는 자격이 있어요',
        ctl: function () { return h('div', null, noDate.map(function (c, i) { return h('div', { class: 'grid-2', style: 'margin-bottom:4px;align-items:center' }, h('span', { style: 'font-size:13px' }, c.name), h('input', { class: 'input', type: 'date', name: 'certDate' + i, max: iso(now()) })); })); },
        get: function (f) { var any = false; noDate.forEach(function (c, i) { var v = val(f, 'certDate' + i); if (v) { c.date = v; any = true; } }); return any ? 'y' : ''; } });
    if (bankDegree && d.certs.length)
      items.push({ key: 'priorUsed', label: '이전 학위에 이미 쓴 자격증', from: '③ 이전 학위에 사용(지식 5절)', help: '이전 학점은행제 학위에서 학점인정 받은 자격증은 다시 신청할 수 없어요',
        ctl: function () { return h('div', null, d.certs.map(function (c, i) { return h('label', { class: 'check', style: 'margin-right:12px' }, h('input', { type: 'checkbox', name: 'used' + i }), h('span', { class: 'check__box' }), c.name); })); },
        get: function (f) { var used = d.certs.filter(function (c, i) { return f.querySelector('[name="used' + i + '"]').checked; }).map(function (c) { return c.name; }); return used.length ? used : ''; } });

    var total = items.length;
    var counter = h('span', { class: 'chat-card__step' }, '채운 항목 0/' + total);
    var rows = items.map(function (it) {
      var unknown = h('label', { class: 'check', style: 'margin-top:4px' }, h('input', { type: 'checkbox', name: it.key + '_unknown' }), h('span', { class: 'check__box' }), '모르겠어요');
      return row(it.label, h('div', null, it.ctl(), unknown), { field: it.key, help: it.help });
    });
    var form = h('div', { class: 'form form--plain chat-form' }, rows);
    function update() {
      var n = items.filter(function (it) { return (it.get ? it.get(form) : val(form, it.key)) || form.querySelector('[name="' + it.key + '_unknown"]').checked; }).length;
      counter.textContent = '채운 항목 ' + n + '/' + total;
    }
    form.addEventListener('input', update); form.addEventListener('change', update);
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, h('span', { class: 'chat-card__title' }, '정보 더 입력하기'), counter),
      h('div', { class: 'chat-card__body', style: 'padding-bottom:0' },
        h('p', { class: 'chat-meta', style: 'margin:0' }, '채울수록 결과가 정확해져요. 모두 선택 항목이에요.'), form),
      h('div', { class: 'chat-card__foot' }, btn('btn--primary', '반영해서 다시 분석', function () {
        items.forEach(function (it) {
          var v = it.get ? it.get(form) : val(form, it.key);
          if (v) d.extra[it.key] = v;
          if (form.querySelector('[name="' + it.key + '_unknown"]').checked && it.key === 'prevMajor') d.extra.prevMajorUnknown = true;
        });
        card.classList.add('is-done');
        userSay('정보 보완 — ' + (items.filter(function (it) { return d.extra[it.key]; }).map(function (it) { return it.label; }).join(', ') || '모르겠어요'));
        if (d.extra.prevMajorUnknown && !d.extra.prevMajor) { renderS19(); return; }
        think('다시 분석 중입니다…', renderResult);
      })));
    botRow(card, demoOnly(h('div', { class: 'chat-meta' }, '되묻기(계산을 막는 항목, 하나씩)와 달리 계산 뒤 정확도를 높일 항목을 한 번에. "100%"는 약속하지 않는다 · 출처: ' + items.map(function (it) { return it.label + '(' + it.from + ')'; }).join(', '))));
  }

  // 상담 요청(접수) — 기타문의 접수는 폐기, 학습설계 상담 요청 접수는 유지(IA Q2). 비로그인도 접수 가능.
  // 학습상담신청 폼에서 분석 단계로 옮기지 않은 칸(이름·휴대폰·이메일·희망상담시간·동의)을 폼 순서·문구 그대로 받는다
  function requestCard() {
    var d = S.design || { basic: {}, goal: {}, edu: {}, certs: [], memo: '', extra: {} };
    var today0 = now(), maxD = new Date(today0.getTime());
    maxD.setMonth(maxD.getMonth() + 1);
    var rows = [];
    if (S.member) {
      rows.push(row('신청자', h('div', null, h('div', null, S.name), h('div', { class: 'chat-meta' }, '010-****-5678 · h***@*****.com (회원 정보)'))));
    } else {
      var phoneIn = h('input', { class: 'input', name: 'phone', inputmode: 'numeric', maxlength: '13', autocomplete: 'tel', placeholder: '010-0000-0000' });
      // 폼과 같은 자동 하이픈
      phoneIn.addEventListener('input', function () {
        var s = this.value.replace(/[^0-9]/g, '');
        this.value = s.length < 4 ? s : s.length < 7 ? s.substr(0, 3) + '-' + s.substr(3) : s.length < 11 ? s.substr(0, 3) + '-' + s.substr(3, 3) + '-' + s.substr(6) : s.substr(0, 3) + '-' + s.substr(3, 4) + '-' + s.substr(7);
      });
      rows.push(row('이름', h('input', { class: 'input', name: 'name', autocomplete: 'name' }), { req: true, field: 'name' }));
      rows.push(row('휴대폰', phoneIn, { req: true, field: 'phone' }));
      rows.push(row('이메일', h('input', { class: 'input', name: 'email', type: 'email', maxlength: '50', autocomplete: 'email' }), { req: true, field: 'email', help: '상담 결과지(PDF)를 이 주소로 보내 드려요' }));
    }
    var dateIn = h('input', { class: 'input', type: 'date', name: 'date', min: iso(today0), max: iso(maxD), 'aria-label': '날짜 선택' });
    var timeSel = select('time', HOPE_TIMES, '', '시간대를 선택하세요.');
    var any = h('input', { type: 'checkbox', name: 'every' });
    any.addEventListener('change', function () { dateIn.disabled = timeSel.disabled = any.checked; if (any.checked) timeSel.value = ''; });
    // 주말은 고르는 즉시 막는다(폼과 같음). 공휴일은 unilms 설정(unilms.counsel.holidays)이라 프로토타입은 주말만
    // 카드의 clearRow 가 같은 change 에서 표시를 지우므로 한 박자 뒤에 건다
    dateIn.addEventListener('change', function () { if (dateIn.value && isOff(dateIn.value)) { dateIn.value = ''; setTimeout(function () { fail(form, 'time', '주말·공휴일은 선택할 수 없습니다.'); }, 0); } });
    rows.push(row('희망상담시간', h('div', null, h('div', { class: 'grid-2' }, dateIn, timeSel),
      h('label', { class: 'check', style: 'margin-top:6px' }, any, h('span', { class: 'check__box' }), '언제나 가능')), { req: true, field: 'time', help: '오늘부터 1개월 안, 평일만' }));
    var agree1 = h('input', { type: 'checkbox', name: 'agree' }), agree2 = h('input', { type: 'checkbox', name: 'agree2' }), all = h('input', { type: 'checkbox' });
    all.addEventListener('change', function () { agree1.checked = agree2.checked = all.checked; });
    [agree1, agree2].forEach(function (c) { c.addEventListener('change', function () { all.checked = agree1.checked && agree2.checked; }); });
    var agreeText = h('div', { class: 'notice', hidden: true, style: 'margin-top:6px;font-size:12px' }, '개인정보동의안내 — unilms front/fragment/privacy 문구를 그대로 보여 준다(프로토타입은 자리만)');
    rows.push(row('개인정보 동의', h('div', null,
      h('label', { class: 'check' }, all, h('span', { class: 'check__box' }), h('b', null, '전체 동의')),
      h('label', { class: 'check', style: 'margin-top:6px' }, agree1, h('span', { class: 'check__box' }), h('span', null, h('b', null, '[필수]'), ' 비회원 전화상담 진행 및 ', h('b', null, '상담 결과지(PDF) 이메일 발송'), '을 위해 개인정보 수집·이용에 동의합니다.')),
      h('label', { class: 'check', style: 'margin-top:6px' }, agree2, h('span', { class: 'check__box' }), h('span', null, h('b', null, '[선택]'), ' 개강/마감 일정 및 수강신청 안내 등 유용한 소식(광고성 정보 포함)을 SMS로 받겠습니다.')),
      h('button', { type: 'button', class: 'btn btn--link btn--underline btn--sm', on: { click: function () { agreeText.hidden = !agreeText.hidden; } } }, '내용보기'), agreeText,
      h('p', { class: 'chat-meta', style: 'margin:4px 0 0' }, '선택 미동의 시에도 상담 및 결과지 제공은 동일하게 진행됩니다.')), { field: 'agree' }));
    var form = h('div', { class: 'form form--plain chat-form' }, rows);
    form.addEventListener('input', clearRow); form.addEventListener('change', clearRow);
    var card = h('div', { class: 'chat-card' },
      h('div', { class: 'chat-card__head' }, ico('calendar'), h('span', { class: 'chat-card__title' }, '상담 요청')),
      h('div', { class: 'chat-card__body', style: 'padding-bottom:0' },
        h('p', { class: 'chat-meta', style: 'margin:0' }, '담당자가 입력하신 내용과 분석 결과를 보고 연락드려요.'), form),
      h('div', { class: 'chat-card__foot' }, btn('btn--primary', '학습상담 신청하기', function () {
        // 폼과 같은 순서 — 앞 칸부터 하나씩 멈춘다
        if (!S.member) {
          var nm = val(form, 'name'), ph = val(form, 'phone'), em = val(form, 'email');
          if (fail(form, 'name', nm ? null : '이름을 입력하세요')) return;
          if (fail(form, 'phone', !ph ? '휴대번호를 입력하세요.' : !PHONE_RE.test(ph) ? '휴대번호를 정확히 입력하세요.' : null)) return;
          if (fail(form, 'email', em ? null : '이메일을 입력하세요.')) return;
        }
        var dt = dateIn.value, tm = timeSel.value;
        if (!any.checked && fail(form, 'time', !dt && !tm ? '상담희망 시간을 선택해주세요.' : !dt ? '날짜를 선택해주세요.' : !tm ? '시간대를 선택해주세요.' : null)) return;
        if (!agree1.checked) {
          fail(form, 'agree', '개인정보 보호정책에 동의가 필요합니다.');
          connectCard({ reason: 'noagree' });
          return;
        }
        card.classList.add('is-done');
        userSay('학습상담 신청하기');
        think('접수 중입니다…', function () {
          var D = dt ? new Date(dt + 'T00:00') : null;
          var when = any.checked ? '언제나 가능으로 접수했어요. 담당자가 ' : (D.getMonth() + 1) + '/' + D.getDate() + '(' + '일월화수목금토'[D.getDay()] + ') ' + tm + '에 ';
          botRow(h('div', { class: 'notice notice--success' }, ico('check'),
            h('div', { class: 'notice__body' }, h('strong', { class: 'notice__title' }, '학습상담 신청이 접수됐어요'),
              when + (S.member ? '010-****-5678' : maskPhone(val(form, 'phone'))) + '로 연락드릴게요. 급하시면 ' + PHONE + '로 전화 주세요.')),
            demoOnly(h('div', { class: 'chat-meta' }, '접수 = 학습상담신청과 같은 칸(이름·휴대폰·이메일·유입경로·이용 여부·희망전공·최종학력·졸업연월·자격증·희망상담시간·동의·목적) '
              + '→ cblms 접수 생성 API(계획 P1b) → 상담AI CN-02(① 접수 ② AI 분석). 지금 웹 신청과 같은 행이라 상담AI는 바뀌는 것이 없다')),
            chips([homeChip()]));
        });
      })));
    botRow(card);
  }
  function isOff(v) { var w = new Date(v + 'T00:00:00').getDay(); return w === 0 || w === 6; }
  function nextBizDay(d) { var x = new Date(d.getTime()); do { x.setDate(x.getDate() + 1); } while (x.getDay() === 0 || x.getDay() === 6); return x; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function maskPhone(p) { var t = p.replace(/\D/g, ''); return t.slice(0, 3) + '-****-' + t.slice(-4); }

  /* ---- 드로어 (CH-08) --------------------------------------------------- */
  function toggleDrawer() {
    if (!drawer.hidden) { drawer.hidden = true; return; }
    drawer.innerHTML = '';
    var inner = [];
    inner.push(btn('btn--outline btn--block', [ico('plus'), '새 대화'], function () { drawer.hidden = true; newConversation(); }));
    if (!S.member) {
      inner.push(h('div', { class: 'notice notice--info', style: 'margin-top:12px' }, ico('info'),
        h('div', { class: 'notice__body' }, '로그인하면 대화가 저장돼요. 로그인하지 않으면 대화는 저장되지 않아요.',
          h('div', { style: 'margin-top:8px' }, btn('btn--sm btn--secondary', '로그인', function () { drawer.hidden = true; loginCard({ reason: 'drawer' }); })))));
    } else {
      inner.push(h('p', { class: 'chat-section-title', style: 'margin-top:16px' }, '저장된 대화'));
      var ul = h('ul', { class: 'chat-history' });
      S.saved.forEach(function (s, i) {
        ul.appendChild(h('li', null,
          h('button', { type: 'button', class: 'chat-history__open', on: { click: function () { drawer.hidden = true; openSaved(s); } } }, h('strong', null, s.title), h('span', null, s.date)),
          h('button', { type: 'button', class: 'chat-hbtn', 'aria-label': s.title + ' 삭제', title: '삭제', on: { click: function () { S.saved.splice(i, 1); drawer.hidden = true; toggleDrawer(); } } }, ico('close', 'ico-sm'))));
      });
      if (!S.saved.length) ul.appendChild(h('li', { class: 'chat-meta', style: 'padding:8px' }, '저장된 대화가 없어요'));
      inner.push(ul);
    }
    var box = h('div', { class: 'chat-drawer__box', role: 'navigation', 'aria-label': '대화 메뉴' },
      h('div', { class: 'chat-drawer__body' }, inner),
      h('div', { class: 'chat-drawer__foot' }, S.member ? '대화는 학습 지원을 위해 보관돼요. 보관 기간은 약관에 따릅니다(기간 확정 전).' : '대화는 이 창을 닫으면 사라져요.', h('br'), demoOnly(h('span', null, '문의 내역·접수 상태 메뉴는 없다(기타문의 접수 폐기)'))));
    drawer.appendChild(h('div', { class: 'chat-drawer__dim', on: { click: toggleDrawer } }));
    drawer.appendChild(box);
    drawer.hidden = false;
  }
  function newConversation() {
    if (S.member && S.lastQuestion) S.saved.unshift({ id: 's' + Date.now(), title: S.lastQuestion, date: today().label, caseId: null });
    resetConversation();
    goHome(false);
  }
  function openSaved(s) {
    resetConversation();
    log.appendChild(h('div', { class: 'chat-sys' }, s.date + ' 대화'));
    userSay(s.title);
    if (s.caseId) renderCase(CASES[s.caseId], {});
    else botRow(say('저장된 대화를 불러왔어요.'), demoOnly(h('div', { class: 'chat-meta' }, '프로토타입: 제목만 저장')), chips([homeChip()]));
  }

  /* ---- 외부(시연 컨트롤)에서 부르는 것 --------------------------------- */
  function setMember(on) {
    S.member = on; renderPill();
    resetConversation();
    if (!panel.hidden) goHome(false);
    if (window.ChatDemo) window.ChatDemo.sync();
  }
  function setLecture(on) {
    S.lecture = on;
    document.body.classList.toggle('is-lecture', on);
    if (on) { panel.hidden = true; launcher.hidden = true; } else { launcher.hidden = !panel.hidden ? true : false; }
  }

  // 평가셋의 실제 질문을 "정답대로" 보여 준다(시연 컨트롤). 프로토타입 매칭기를 거치지 않는다 — 실제는 LLM 분류(F-04)
  function replay(x) {
    var Q = window.CB_QUESTIONS;
    var meta = demoOnly(h('div', { class: 'chat-meta' }, x.id + ' · ' + x.src + (x.call ? ' · ' + x.call + ' ' + (Q.callTypes[x.call] || '') : '')
      + ' · 평가셋 정답 ' + x.ans + (x.check ? ' (담당자 확인 대기)' : '') + (x.memo ? ' · 메모: ' + x.memo : ''),
      x.review.length ? h('span', { style: 'color:var(--color-warning)' }, ' · ' + x.review[0]) : null));
    S.lastQuestion = x.q;
    userSay(x.q);
    if (x.type === '케이스') { showCase(x.ans, { extra: meta }); return; }
    think(null, function () {
      if (x.type === '학습설계') { startDesign(); log.appendChild(meta); return; }
      if (x.type === '로그인필요') { loginCard({ reason: 'personal' }); log.appendChild(meta); return; }
      if (x.kb) botRow(h('div', { class: 'notice notice--info notice--inline' }, ico('info'),
        h('span', { class: 'notice__body' }, '지식 후보 — 상담AI 지식이나 안내 자료에 답이 있으면 지식 인용 답변(CH-04 ②)으로 답하고, 없으면 아래처럼 전화로 간다')));
      connectCard({ reason: 'nomatch' });
      log.appendChild(meta);
    });
  }

  window.Chatbot = {
    replay: function (x) { this.open(); replay(x); },
    state: S,
    cases: CASES,
    match: match,
    open: function () { if (S.lecture) setLecture(false); openPanel(); },
    minimize: minimize,
    setMember: setMember,
    setClock: function (k) { S.clock = k; },
    setCounselor: function (on) { S.counselor = on; },
    setSim: function (k) { if (S.sim === 'offline-active') { footWarn.hidden = true; footWarn.innerHTML = ''; } S.sim = k; onInput(); },
    setShowIds: function (on) { S.showIds = on; document.querySelectorAll('.demo-only').forEach(function (n) { n.hidden = !on; }); },
    setLecture: setLecture,
    reset: function () { resetConversation(); if (!panel.hidden) goHome(false); },
    ask: function (text) { this.open(); input.value = text; onInput(); onSend(); },
    showCase: function (id) { this.open(); userSay(CASES[id].q); showCase(id); },
    go: function (screen) {
      this.open();
      var map = {
        'CH-01': function () { minimize(); },
        'CH-02': function () { goHome(true); },
        'CH-03': function () { S.sim = 'error'; userSay('수강료는 어디서 볼 수 있나요?'); showCase('GD-009'); },
        'CH-04-1': function () { window.Chatbot.ask('출석이 안 돼요'); },
        'CH-04-2': function () { window.Chatbot.ask('모바일로 시험 볼 수 있어요?'); },
        'CH-04-3': function () { window.Chatbot.ask('기숙사 있어요?'); },
        'CH-04-amb': function () { window.Chatbot.ask('인증서'); },
        'CH-05': function () { if (S.member) setMember(false); window.Chatbot.ask('내 출석률 알려줘'); },
        'CH-06': function () { userSay('학습설계'); startDesign(); },
        'CH-06-result': function () { quickDesign(); analyzeNow(); },
        'CH-06-ask': function () { quickDesign(true); analyze(); },
        'CH-06-supp': function () { quickDesign(); renderResult(); supplementCard(); },
        'CH-06-req': function () { quickDesign(); renderResult(); requestCard(); },
        'CH-07': function () { userSay('상담사 연결해 주세요'); connectCard({ reason: 'request' }); },
        'CH-08': function () { toggleDrawer(); },
        'CH-09': function () { S.counselor = true; if (window.ChatDemo) window.ChatDemo.sync(); userSay('상담사 연결해 주세요'); connectCard({ reason: 'request' }); }
      };
      (map[screen] || function () {})();
    }
  };
  function quickDesign(noMajor) {
    S.design = { basic: { inPath: '네이버 검색', bankYn: '없음' }, goal: { path: 'bachelor', degree: '학사', major: '건축공학', target: '' },
      edu: { grade: '2년제 대학', status: '졸업', grad: '2015-02' }, certs: [{ name: '건축산업기사', date: '2018-05-20' }],
      memo: '회사 승진에 학사가 필요해요', extra: noMajor ? {} : { prevMajor: '건축과' }, round: 0 };
    userSay('(예시 입력) 학사 · 건축공학 / 2년제 대학 졸업 / 건축산업기사');
  }
  function analyzeNow() { think('분석 중입니다…', renderResult); }

  document.addEventListener('DOMContentLoaded', function () {
    buildShell();
    if (window.ChatDemo) window.ChatDemo.init();
  });
})();
