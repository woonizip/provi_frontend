const question = [
  // ===== 동기 =====
  { id: 101, category: "동기", question: "자기소개를 해주세요.", answer: "핵심 역량/경험 2~3개 + 지원 직무와의 연결 + 최근 성과를 1문장으로 요약해 마무리하세요." },
  { id: 102, category: "동기", question: "왜 이 직무(프론트엔드/백엔드 등)를 선택했나요?", answer: "관심 계기 → 관련 프로젝트/학습 → 성과(지표/사용자 반응) → 앞으로 기여 방식 순으로 구조화." },
  { id: 103, category: "동기", question: "우리 회사에 지원한 이유는?", answer: "회사/제품/기술/문화 중 2개 이상 근거 + 내가 기여할 수 있는 포인트(역량/경험)로 연결." },
  { id: 104, category: "동기", question: "당장 합격하면 어떤 목표로 일하겠나요?", answer: "온보딩 30/60/90일 계획: 코드베이스 파악→작은 개선→주요 기능 기여(리스크/지표 포함)." },

  // ===== 역량 =====
  { id: 201, category: "역량", question: "본인의 강점과 약점은?", answer: "강점: 업무 성과 사례로 증명. 약점: 개선 노력/보완 시스템(체크리스트, 리뷰, 자동화)까지 제시." },
  { id: 202, category: "역량", question: "협업에서 가장 중요하게 생각하는 것은?", answer: "명확한 커뮤니케이션(요구사항/우선순위/정의) + 기록(문서/이슈) + 합의(ADR/회의록)로 답변." },
  { id: 203, category: "역량", question: "학습 능력을 보여줄 수 있는 경험이 있나요?", answer: "새 기술 학습→적용→문제 해결→결과(성능/속도/오류 감소 등)까지 '전후 비교'로 말하기." },
  { id: 204, category: "역량", question: "시간이 촉박할 때 우선순위를 어떻게 정하나요?", answer: "임팩트/리스크/의존성 기준으로 정렬, MVP 먼저, 나머지는 백로그로 분리 + 이해관계자 공유." },

  // ===== 개발자 관련 질문 =====
  { id: 301, category: "개발자질문", question: "최근에 해결한 기술적 문제를 설명해보세요.", answer: "문제 정의→원인 분석(로그/프로파일링)→대안 비교→적용→성과(지표)→회고(재발 방지)." },
  { id: 302, category: "개발자질문", question: "코드 품질을 어떻게 관리하나요?", answer: "리뷰 규칙 + 린트/포맷터 + 테스트 + CI + 작은 PR + 리팩토링 타이밍(기능/버그 전후)." },
  { id: 303, category: "개발자질문", question: "성능 최적화를 했던 경험이 있나요?", answer: "측정(성능 지표)→병목 파악→해결(캐싱/지연로딩/쿼리 최적화)→재측정으로 이야기." },
  { id: 304, category: "개발자질문", question: "보안에 대해 신경 쓰는 포인트는?", answer: "입력 검증/인증·인가/민감정보 처리/의존성 취약점/로그 마스킹/권한 최소화 원칙." },

  // ===== 회사 이해도 =====
  { id: 401, category: "회사이해도", question: "우리 서비스/제품을 써본 소감과 개선점은?", answer: "좋았던 점 1~2개 + 개선점 1~2개(근거 포함) + 기대 효과(전환/리텐션/CS 감소)로 제시." },
  { id: 402, category: "회사이해도", question: "우리 회사의 경쟁사는 어디고 차별점은 뭐라고 보나요?", answer: "경쟁사 2~3곳 + 비교 기준(가격/기능/UX/유통/기술) + 차별 포인트 + 리스크까지 언급." },
  { id: 403, category: "회사이해도", question: "최근 우리 회사 이슈/뉴스 중 인상 깊었던 것은?", answer: "사실 기반 요약 + 내 관점(기회/리스크) + 직무 관점에서의 제안(작은 실천)으로 마무리." },
  { id: 404, category: "회사이해도", question: "입사 후 우리 팀에서 어떤 가치를 만들 수 있나요?", answer: "직무 역량(기술/협업) + 유사 문제 해결 경험 + 지표/프로세스 개선으로 연결." },

  // ===== 경험 =====
  { id: 501, category: "경험", question: "가장 자랑스러운 프로젝트는?", answer: "역할/기여도 → 문제/해결 → 결과(지표) → 배운 점. '내가 한 것'을 구체적으로." },
  { id: 502, category: "경험", question: "실패했던 경험과 배운 점은?", answer: "실패 원인(가설/커뮤니케이션/일정) → 개선(프로세스/기술) → 이후 성과로 연결." },
  { id: 503, category: "경험", question: "팀 내 갈등을 해결한 경험이 있나요?", answer: "갈등 원인 파악→공통 목표 재정의→대안 비교→합의→후속 조치(문서/규칙)로 설명." },
  { id: 504, category: "경험", question: "리더십/주도적으로 진행한 경험이 있나요?", answer: "문제 인식→목표/역할 정의→일정/리스크 관리→결과. '조율'과 '결정'을 강조." },

  // ===== 상황 대처 =====
  { id: 601, category: "상황대처", question: "운영 중 장애가 발생하면 어떻게 대응하나요?", answer: "1) 영향도 파악 2) 롤백/우회 3) 원인 분석 4) 재발 방지(모니터링/테스트) 5) 공유/문서화." },
  { id: 602, category: "상황대처", question: "요구사항이 계속 바뀌면 어떻게 하나요?", answer: "변경 사유/우선순위 확인 → 영향도/비용 공유 → MVP 재정의 → 스코프/일정 합의." },
  { id: 603, category: "상황대처", question: "모르는 기술/업무를 갑자기 맡게 되면?", answer: "핵심 목표/제약 파악 → 빠른 러닝(문서/샘플) → 작은 POC → 리뷰 요청 → 점진적 확장." },
  { id: 604, category: "상황대처", question: "면접에서 모르는 질문이 나오면 어떻게 답하나요?", answer: "모른다고 인정 + 아는 범위 공유 + 접근 방법(가정/검증/찾는 법) + 유사 경험으로 연결." },
];

const STORAGE_KEY = "interview_state_v2";

const els = {
  list: document.getElementById("questionList"),
  empty: document.getElementById("empty"),
  qSearch: document.getElementById("qSearch"),
  qCategory: document.getElementById("qCategory"),
  btnRandom: document.getElementById("btnRandom"),
  btnReset: document.getElementById("btnReset"),
  statTotal: document.getElementById("statTotal"),
  statFav: document.getElementById("statFav"),
  statDone: document.getElementById("statDone"),
  statShown: document.getElementById("statShown"),
};

if (!els.list || !els.qSearch || !els.qCategory) {
    console.error("[Interview] required elements not found", els);
  }

  const loadState = () => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { favorites:{}, done:{}, open:{} };
      const s = JSON.parse(raw);
      return { favorites:s.favorites||{}, done:s.done||{}, open:s.open||{} };
    }catch{
      return { favorites:{}, done:{}, open:{} };
    }
  };

  let state = loadState();

  const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const escapeHtml = (str) => String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  const applyFilters = () => {
    const keyword = els.qSearch.value.trim().toLowerCase();
    const cat = els.qCategory.value;

    return question.filter(x => {
      const matchCat = (cat === "all") || (x.category === cat);
      const matchKey = !keyword || (x.question + " " + x.answer).toLowerCase().includes(keyword);
      return matchCat && matchKey;
    });
  };

  const render = () => {
    const items = applyFilters();

    const total = question.length;
    const favCount = Object.values(state.favorites).filter(Boolean).length;
    const doneCount = Object.values(state.done).filter(Boolean).length;

    els.statTotal.textContent = String(total);
    els.statFav.textContent = String(favCount);
    els.statDone.textContent = String(doneCount);
    els.statShown.textContent = String(items.length);

    els.list.innerHTML = "";
    if (els.empty) els.empty.style.display = items.length ? "none" : "block";

    items.forEach(q => {
      const isFav = !!state.favorites[q.id];
      const isDone = !!state.done[q.id];
      const isOpen = !!state.open[q.id];

      const card = document.createElement("div");
      card.className = "question_card";
      card.dataset.id = q.id;

      card.innerHTML = `
        <div class="question_header">
          <div class="q_title">
            <strong>${escapeHtml(q.question)}</strong>
            <span class="question_category">${escapeHtml(q.category)}</span>
            ${isDone ? `<span class="question_category" style="background:#2f6;color:#111;">DONE</span>` : ``}
          </div>
          <div class="question_actions">
            <button type="button" data-action="toggle">${isOpen ? "🙈" : "👀"}</button>
            <button type="button" data-action="fav">${isFav ? "⭐" : "☆"}</button>
            <button type="button" data-action="done">${isDone ? "✅" : "⬜"}</button>
          </div>
        </div>
        <div class="answer ${isOpen ? "show" : ""}" id="answer-${q.id}">${escapeHtml(q.answer)}</div>
      `;
      els.list.appendChild(card);
    });

    saveState();
  };

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if(!btn) return;
    const card = e.target.closest(".question_card");
    if(!card) return;

    const id = Number(card.dataset.id);
    const action = btn.dataset.action;

    if(action === "toggle") state.open[id] = !state.open[id];
    if(action === "fav") state.favorites[id] = !state.favorites[id];
    if(action === "done") state.done[id] = !state.done[id];

    render();
  });

  els.qSearch.addEventListener("input", render);
  els.qCategory.addEventListener("change", render);

  els.btnRandom?.addEventListener("click", () => {
    const items = applyFilters();
    if(!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    state.open[pick.id] = true;
    render();
    document.querySelector(`.question_card[data-id="${pick.id}"]`)?.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  els.btnReset?.addEventListener("click", () => {
    state = { favorites:{}, done:{}, open:{} };
    localStorage.removeItem(STORAGE_KEY);
    render();
  });

  render();