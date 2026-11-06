/* 시연 컨트롤 — 상태를 바꿔 가며 CH-01 ~ CH-09를 볼 수 있게 한다. 실제 위젯에는 없다 */
(function () {
  'use strict';

  var C, panel;

  function h(tag, props, children) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') el.className = props[k];
      else if (k === 'text') el.textContent = props[k];
      else if (k === 'onclick') el.addEventListener('click', props[k]);
      else el.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }

  function group(title, rows, note) {
    var g = h('div', { class: 'demo__group' }, [h('h3', { text: title })].concat(rows));
    if (note) g.appendChild(h('p', { class: 'demo__note', text: note }));
    return g;
  }
  // 하나만 켜지는 버튼 줄
  function radio(name, items, current, onPick) {
    var row = h('div', { class: 'demo__row', 'data-radio': name });
    items.forEach(function (it) {
      var b = h('button', { type: 'button', class: 'demo__btn' + (it[0] === current ? ' is-on' : ''), 'data-v': it[0], text: it[1], onclick: function () {
        Array.prototype.forEach.call(row.children, function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        onPick(it[0]);
      } });
      row.appendChild(b);
    });
    return row;
  }
  function setRadio(name, v) {
    var row = panel.querySelector('[data-radio="' + name + '"]');
    if (!row) return;
    Array.prototype.forEach.call(row.children, function (x) { x.classList.toggle('is-on', x.getAttribute('data-v') === String(v)); });
  }
  function go(label, screen) { return h('button', { type: 'button', class: 'demo__btn demo__btn--wide', text: label, onclick: function () { C.reset(); C.go(screen); } }); }
  function ask(text) { return h('button', { type: 'button', class: 'demo__btn', text: text, onclick: function () { C.ask(text); } }); }

  function init() {
    C = window.Chatbot;
    var body = h('div', { class: 'demo__body' });

    body.appendChild(group('로그인 상태', [radio('member', [['n', '비로그인'], ['y', '로그인(홍길동)']], 'n', function (v) { C.setMember(v === 'y'); })],
      '바꾸면 새 대화로 시작한다 — unilms가 로그인 상태를 넘기는 것을 흉내 냄(F-01)'));
    body.appendChild(group('지금 시각(모의)', [radio('clock', [['open', '평일 11:00'], ['lunch', '점심 13:20'], ['after', '금 19:10'], ['weekend', '토 10:30']], 'open', function (v) { C.setClock(v); C.reset(); })],
      'CH-07 운영시간 밖 안내·다음 상담 가능 시간. 공휴일은 계산하지 않는다(소스 미정)'));
    body.appendChild(group('연결 방식(관리 설정)', [radio('counselor', [['off', '전화만(지금)'], ['on', '전화 + 상담사(3단계)']], 'off', function (v) { C.setCounselor(v === 'on'); })]));
    body.appendChild(group('화면', [radio('lecture', [['n', '일반 페이지'], ['y', '강의(영상) 화면']], 'n', function (v) { C.setLecture(v === 'y'); })],
      '강의 화면에서는 영상담당(학습도우미)만 뜨고 안내챗봇은 숨는다 — 런처 공존 규칙 [제안]'));
    body.appendChild(group('다음 응답 1회', [radio('sim', [['none', '정상'], ['slow', '지연(17초)'], ['error', '서버 오류'], ['offline', '연결 끊김']], 'none', function (v) { C.setSim(v); })],
      'CH-03 오류·예외. 고른 뒤 아무 질문이나 하면 그 응답에만 적용된다'));
    body.appendChild(group('검토용 표시', [radio('ids', [['y', '케이스 ID·메모 보기'], ['n', '숨기기(실제 화면)']], 'y', function (v) { C.setShowIds(v === 'y'); })]));

    body.appendChild(group('화면 바로가기', [
      go('CH-01 런처(닫힌 상태)', 'CH-01'),
      go('CH-02 홈', 'CH-02'),
      go('CH-03 서버 오류 예시', 'CH-03'),
      go('CH-04 ① 케이스 답변 — "출석이 안 돼요"', 'CH-04-1'),
      go('CH-04 ② 지식 인용 — "모바일로 시험?"', 'CH-04-2'),
      go('CH-04 ③ 애매 — "인증서"', 'CH-04-amb'),
      go('CH-04 ③ 모름 → 전화 — "기숙사 있어요?"', 'CH-04-3'),
      go('CH-05 로그인 안내 — "내 출석률"', 'CH-05'),
      go('CH-06 학습설계 시작(원문 → 폼)', 'CH-06'),
      go('CH-06 결과 바로 보기(예시 입력)', 'CH-06-result'),
      go('CH-06 되묻기 — 전적대 학과', 'CH-06-ask'),
      go('CH-06 정보 보완 카드', 'CH-06-supp'),
      go('CH-06 상담 요청(접수)', 'CH-06-req'),
      go('CH-07 전화 연결 안내', 'CH-07'),
      go('CH-08 메뉴 드로어', 'CH-08'),
      go('CH-09 상담사 연결(3단계 켬)', 'CH-09')
    ]));

    var askRow = h('div', { class: 'demo__row' });
    ['출석이 안 돼요', '수강료 얼마예요?', '동영상이 안 나와요', '비밀번호를 잊어버렸어요', '학위 따는데 얼마나 걸려요?', '맥북으로 시험 볼 수 있나요?',
      '내 과제 마감 언제야?', '상담사 연결해 주세요', '전화번호 바꾸고 싶어요', '제 번호는 010-1234-5678이에요'].forEach(function (t) { askRow.appendChild(ask(t)); });
    body.appendChild(group('자유 입력 예시', [askRow], '입력창에 직접 써도 된다. 매칭은 프로토타입용 단순 비교 — 실제는 LLM 분류(F-04)'));

    // 케이스 목록
    var QS = (window.CB_QUESTIONS || { items: [], callTypes: {} });
    var search = h('input', { class: 'demo__search', type: 'search', placeholder: '검색 (케이스)', 'aria-label': '케이스 검색' });
    var srcPick = 'all';
    var srcRow = radio('qsrc', [['all', '전체'], ['통화', '통화만'], ['채팅', '채팅만']], 'all', function (v) { srcPick = v; draw(); });
    var list = h('div', { class: 'demo__cases' });
    function qBtn(x) {
      var b = h('button', { type: 'button', class: 'demo__q', title: x.memo || '', onclick: function () { C.replay(x); } },
        [h('span', { class: 'demo__src demo__src--' + (x.src === '통화' ? 'call' : 'chat'), text: x.src }), document.createTextNode(x.q)]);
      if (x.review.length) b.appendChild(h('span', { class: 'is-login', text: '재검토' }));
      return b;
    }
    function fold(label, count, children, open) {
      var d = h('details', { class: 'demo__fold' }, [h('summary', null, [document.createTextNode(label), h('span', { class: 'demo__count', text: String(count) })])].concat(children));
      if (open) d.open = true;
      return d;
    }
    function draw() {
      var q = search.value.trim();
      var items = QS.items.filter(function (x) { return srcPick === 'all' || x.src === srcPick; });
      var hitQ = function (x) { return !q || (x.q + x.memo + x.call + (QS.callTypes[x.call] || '')).indexOf(q) >= 0; };
      list.innerHTML = '';
      window.CB_DATA.cases.forEach(function (c) {
        var mine = items.filter(function (x) { return x.type === '케이스' && x.ans === c.id; });
        var caseHit = !q || (c.id + c.q + c.cat).indexOf(q) >= 0;
        var shown = caseHit ? mine : mine.filter(hitQ);
        if (!caseHit && !shown.length) return;
        var nCall = mine.filter(function (x) { return x.src === '통화'; }).length, nChat = mine.length - nCall;
        var b = h('button', { type: 'button', title: c.cat, onclick: function () { C.showCase(c.id); } }, [h('code', { text: c.id }), document.createTextNode(c.q)]);
        if (c.login !== 'none') b.appendChild(h('span', { class: 'is-login', text: c.login === 'required' ? '로그인 필수' : '로그인 선택' }));
        b.appendChild(h('span', { class: 'demo__count', title: '실제 질문 — 통화 · 채팅', text: '통' + nCall + '·채' + nChat }));
        list.appendChild(b);
        if (shown.length) list.appendChild(fold('실제 질문', shown.length, shown.map(qBtn), !!q && !caseHit));
      });
      // 케이스가 없는 질문 — 학습설계·로그인 필요·없음(전화). 없음은 통화분류별로 묶는다
      [['학습설계', '학습설계로 가는 질문'], ['로그인필요', '로그인이 필요한 질문'], ['없음', '케이스 없음 → 지식 또는 전화']].forEach(function (t) {
        var all = items.filter(function (x) { return x.type === t[0] && hitQ(x); });
        if (!all.length) return;
        var kids;
        if (t[0] === '없음') {
          var groups = {};
          all.forEach(function (x) { var k = x.src === '통화' ? (x.call || '분류 없음') : '채팅'; (groups[k] = groups[k] || []).push(x); });
          kids = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; }).map(function (k) {
            return fold((k === '채팅' ? '채팅' : k + ' ' + (QS.callTypes[k] || '')), groups[k].length, groups[k].map(qBtn), false);
          });
        } else kids = all.map(qBtn);
        list.appendChild(h('div', { class: 'demo__sep', text: t[1] }));
        list.appendChild(fold('질문', all.length, kids, !!q));
      });
    }
    search.addEventListener('input', draw);
    draw();
    var nCallAll = QS.items.filter(function (x) { return x.src === '통화'; }).length;
    body.appendChild(group('케이스 ' + window.CB_DATA.cases.length + '건', [search, list],
      '안내 문구는 예시로 대체되어 있다(실제 안내 원문 생략). 케이스를 누르면 해당 화면의 흐름을 볼 수 있다.'));

    var toggle = h('button', { type: 'button', class: 'demo__btn', text: '접기', 'aria-expanded': 'true' });
    panel = h('aside', { class: 'demo', 'aria-label': '프로토타입 시연 컨트롤' }, [
      h('div', { class: 'demo__head' }, [h('strong', { text: '⚙ 시연 컨트롤 (프로토타입)' }), toggle]), body]);
    toggle.addEventListener('click', function () {
      var c = panel.classList.toggle('is-collapsed');
      toggle.textContent = c ? '펴기' : '접기';
      toggle.setAttribute('aria-expanded', String(!c));
    });
    if (window.matchMedia('(max-width: 767px)').matches) { panel.classList.add('is-collapsed'); toggle.textContent = '펴기'; }
    document.body.appendChild(panel);
  }

  window.ChatDemo = {
    init: init,
    sync: function () {
      if (!panel) return;
      setRadio('member', C.state.member ? 'y' : 'n');
      setRadio('counselor', C.state.counselor ? 'on' : 'off');
    },
    simUsed: function () { if (panel) setRadio('sim', 'none'); }
  };
})();
