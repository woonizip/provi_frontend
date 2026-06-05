const STORAGE_KEYS = {
  USER: "sf_user",              // { name, job, role } (프로젝트에서 이미 사용중)
  PROJECTS: "sf_projects",      // 팀프로젝트 카드
  QUIZ_RESULT: "quizResult",    // result.js가 서버에서 받아 저장하는 실제 결과 키
  QUIZ_PAYLOAD: "quizResultPayload", // 설문지 원본 페이로드 백업 키
  LEARNING: "provi_learning_progress",    // 학습 진행/완료
  GOALS: "provi_weekly_goals",            // 이번주 목표 체크리스트
  ACTIVITY: "provi_activity_log"          // 활동 기록
};

const el = (id) => document.getElementById(id); //

const sbName = el("sbName"); //
const sbJob = el("sbJob"); //
const devRoleText = el("devRoleText"); //
const tagRow = el("tagRow"); //
const roadmapEl = el("roadmap"); //
const nextStepPill = el("nextStepPill"); //
const joinedProjectsEl = el("joinedProjects"); //
const joinedEmpty = el("joinedEmpty"); //
const timelineEl = el("timeline"); //
const timelineEmpty = el("timelineEmpty"); //
const ringEl = el("ring"); //
const ringValue = el("ringValue"); //
const overallPercent = el("overallPercent"); //
const currentStepText = el("currentStepText"); //
const nextStepText = el("nextStepText"); //
const skillBars = el("skillBars"); //
const goalsEl = el("goals"); //
const feedbackEl = el("feedback"); //
const compareEl = el("compare"); //
const weeklyGoalCount = el("weeklyGoalCount"); //
const joinedProjectCount = el("joinedProjectCount"); //
const btnResetGoals = el("btnResetGoals"); //
const btnGoTeamProject = el("btnGoTeamProject"); //
const btnContinue = el("btnContinue"); //
const btnRetake = el("btnRetake"); //
const dashboardContent = el("dashboardContent"); //
const quizEmptyState = el("quizEmptyState"); //
const btnGoStackSurvey = el("btnGoStackSurvey"); //
const btnGoTeamOnly = el("btnGoTeamOnly"); //

const tabs = document.querySelectorAll(".tab"); //

function readJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key); //
    return raw ? JSON.parse(raw) : fallback; //
  } catch { return fallback; } //
}

function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val)); //
  sessionStorage.setItem(key, JSON.stringify(val)); //
}

function escapeHtml(str) {
  return String(str ?? "") //
    .replaceAll("&", "&amp;") //
    .replaceAll("<", "&lt;") //
    .replaceAll(">", "&gt;") //
    .replaceAll('"', "&quot;") //
    .replaceAll("'", "&#039;"); //
}

function nowISO() { return new Date().toISOString(); } //
function formatDate(iso) {
  try {
    const d = new Date(iso); //
    const mm = String(d.getMonth() + 1).padStart(2, "0"); //
    const dd = String(d.getDate()).padStart(2, "0"); //
    return `${mm}/${dd}`; //
  } catch { return ""; } //
}

function getNickname() {
  return (sessionStorage.getItem("nickname") || "").trim(); //
}

// 💡 [직군 로드]: result.js 결과창에 노출된 AI 추천 직군명을 토시 하나 안 틀리고 그대로 매핑
function getQuizRoleRaw(quiz, payload) {
  if (quiz && quiz.role) return quiz.role; //
  if (payload && Array.isArray(payload.answers)) { //
    const targetRoleAns = payload.answers.find(a => a.id === "targetRole"); //
    const webAreaAns = payload.answers.find(a => a.id === "web_area"); //
    if (targetRoleAns?.value === "웹 개발자" && webAreaAns?.value) { //
      if (webAreaAns.value.includes("프론트엔드")) return "프론트엔드 개발자"; //
      if (webAreaAns.value.includes("백엔드")) return "백엔드 개발자"; //
      if (webAreaAns.value.includes("풀스택")) return "풀스택 웹 개발자"; //
    }
    return targetRoleAns?.value || ""; //
  }
  return ""; //
}

function normalizeDevRole(roleRaw) {
  const r = String(roleRaw || "").trim(); //
  return r.length > 0 ? r : "추천 결과 없음"; //
}

function parseAILoadmapData(quizResult, devRole) {
  const rawRoadmap = quizResult && Array.isArray(quizResult.roadmap) ? quizResult.roadmap : []; //
  
  if (rawRoadmap.length === 0) { //
    return [ //
      { id: "GEN_S1", title: "1단계. 코어 언어 환경 및 문법 확립", desc: "도메인의 주축이 되는 언어 제어권을 확보합니다.", items: ["선택 주특기 개발 도구(IDE) 설치 및 컴파일 환경 검증", "코어 기본 문법 실습 및 제어구조 응용 예제 풀이"], tags: ["기본 환경", "코어 문법"] }, //
      { id: "GEN_S2", title: "2단계. 형상 관리 및 데이터 통신", desc: "팀 프로젝트 컨벤션 룰과 오픈 데이터 구조를 완습합니다.", items: ["Git Flow 브랜치 운영 전략 수립 및 커밋 컨벤션 정돈", "오픈 API 엔드포인트 수집 및 비동기 파싱 가동"], tags: ["Git CLI", "API 연동"] }, //
      { id: "GEN_S3", title: "3단계. 상용 프레임워크 설계 결합", desc: "실무 에코시스템 라이브러리를 가동 바인딩합니다.", items: ["주요 아키텍처 코어 모듈 융합 패턴 설계", "상태 관리 라이프사이클 최적화 흐름 도식화"], tags: ["Framework", "Architecture"] }, //
      { id: "GEN_S4", title: "4단계. 실무 프로덕션 배포 파이프라인", desc: "클라우드 서비스 가상화 공간에 최종 산출물을 덤프합니다.", items: ["Docker 컨테이너 환경 가상화 이식 가이드 준수", "AWS 클라우드 인프라 무중단 배포 자동화 구현"], tags: ["Docker 배포", "클라우드"] } //
    ]; //
  }

  return rawRoadmap.map((sentence, index) => { //
    let clauses = sentence.split(/ 그리고 | 및 |익히면서 |, /).map(s => s.trim()); //
    clauses = clauses.filter(c => c.length > 2).map(c => c.endsWith(".") ? c : c + "."); //

    if (clauses.length === 1 && sentence.includes(". ")) { //
      clauses = sentence.split(". ").map(s => s.trim()).filter(s => s.length > 0).map(s => s.endsWith(".") ? s : s + "."); //
    }

    let tags = ["AI 추천", "실전 스택"]; //
    const upper = sentence.toUpperCase(); //
    if (upper.includes("JAVA") || upper.includes("SPRING")) tags = ["Java", "Spring Boot"]; //
    if (upper.includes("HTML") || upper.includes("JS") || upper.includes("CSS") || upper.includes("JAVASCRIPT")) tags = ["HTML/CSS", "JavaScript"]; //
    if (upper.includes("REACT") || upper.includes("NEXT")) tags = ["React.js", "Next.js"]; //
    if (upper.includes("DOCKER") || upper.includes("AWS") || upper.includes("CLOUD") || upper.includes("EC2")) tags = ["Docker", "AWS Cloud"]; //
    if (upper.includes("PYTHON") || upper.includes("PANDAS") || upper.includes("TORCH")) tags = ["Python", "AI 머신러닝"]; //
    if (upper.includes("UNITY") || upper.includes("ENGINE")) tags = ["Unity Engine", "C#"]; //
    if (upper.includes("보안") || upper.includes("해킹") || upper.includes("취약점") || upper.includes("POSTGRESQL")) tags = ["인프라 보안", "DB 쿼리/보안"]; //

    return {
      id: `DYNAMIC_STAGE_${index + 1}`,
      title: `${index + 1}단계. AI 추천 맞춤 로드맵`,
      desc: sentence.length > 90 ? sentence.slice(0, 90) + "..." : sentence, //
      items: clauses, // 💡 결과창 로드맵 문장을 하위 세부 미션 배열로 완벽 쪼개기 주입
      tags: tags //
    };
  });
}

function renderRoadmap(quizResult, devRole) {
  const learning = readLearning();
  const steps = parseAILoadmapData(quizResult, devRole); //

  steps.forEach((s, idx) => {
    if (learning.stepProgress[s.id] == null) learning.stepProgress[s.id] = idx === 0 ? 20 : 0; //
  });

  if (!learning.currentStepId) learning.currentStepId = steps[0]?.id || null; //

  const ordered = steps.map(s => s.id); //
  const currentIdx = Math.max(0, ordered.indexOf(learning.currentStepId)); //
  const nextStep = steps[currentIdx + 1] || steps[currentIdx]; //

  currentStepText.textContent = steps[currentIdx] ? `현재 단계 (${currentIdx + 1}Step)` : "-"; //
  nextStepText.textContent = nextStep ? `다음 단계 (${Math.min(steps.length, currentIdx + 2)}Step)` : "-"; //
  nextStepPill.textContent = `다음 지향 단계: ${nextStep ? nextStep.title : "-"}`; //

  roadmapEl.innerHTML = ""; //
  steps.forEach((s, idx) => {
    const pct = clamp(learning.stepProgress[s.id] ?? 0, 0, 100); //
    const card = document.createElement("div"); //
    card.className = "step" + (idx === currentIdx ? " primary" : ""); //

    const subitemsHtml = s.items.map((itemSentence, sIdx) => `
      <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 13px; line-height: 1.5;">
        <span style="color: #06b6d4; font-weight: 800; flex-shrink: 0;">${sIdx + 1}.</span>
        <span style="color: var(--my-text); opacity: 0.95;">${escapeHtml(itemSentence)}</span>
      </div>
    `).join(""); //

    card.innerHTML = `
      <div class="step-head">
        <h3 class="step-title">${escapeHtml(s.title)}</h3>
        <span class="step-badge">${idx === currentIdx ? "진행 중" : (idx < currentIdx ? "완료" : "예정")}</span>
      </div>
      <p class="step-desc" style="margin-bottom: 12px; color: var(--my-text-sub); font-size: 13px;">${escapeHtml(s.desc)}</p>
      
      <div class="sub-task-box" style="background: rgba(148,163,184,0.05); padding: 12px 14px; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--my-glass-border);">
        ${subitemsHtml}
      </div>

      <div class="step-tags">${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      <div class="step-actions" style="margin-top: 14px;">
        <div class="progress"><span style="width:${pct}%"></span></div>
        <button class="btn-ghost" data-step="${s.id}" data-action="complete">이 단계 10% 올리기</button>
      </div>
    `; //
    roadmapEl.appendChild(card); //
  });

  const avg = Math.round(steps.reduce((sum, s) => sum + (learning.stepProgress[s.id] ?? 0), 0) / steps.length); //
  setRing(avg); //
  overallPercent.textContent = `${avg}%`; //
  ringValue.textContent = `${avg}%`; //

  renderSkillBars(devRole, learning); //
  writeLearning(learning); //

  roadmapEl.querySelectorAll('button[data-action="complete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const stepId = btn.getAttribute("data-step"); //
      const l = readLearning(); //
      l.stepProgress[stepId] = clamp((l.stepProgress[stepId] ?? 0) + 10, 0, 100); //

      if (l.stepProgress[stepId] >= 100 && currentIdx < steps.length - 1) { //
        l.currentStepId = steps[currentIdx + 1].id; //
      } else {
        l.currentStepId = stepId; //
      }

      writeLearning(l); //
      pushActivity(`[${steps.find(x => x.id === stepId)?.title || stepId}] 추천 스택 진도 지표 증가 완료`); //
      renderAll();
    });
  });
}

function renderHeader(user, quiz, payload) {
  const name = user?.name || sessionStorage.getItem("nickname") || "Guest"; //
  if (sbName) sbName.textContent = name; //
  if (sbJob) sbJob.textContent = user?.job || "정회원"; //

  const rawRole = getQuizRoleRaw(quiz, payload); //
  const devRole = normalizeDevRole(rawRole); //
  devRoleText.textContent = devRole; //

  const target = payload || quiz; //
  const knownLangsAns = target?.answers?.find(a => a.id === "knownLangs"); //
  const interestAns = target?.answers?.find(a => a.id === "interestDevField"); //
  const tags = [
    ...(knownLangsAns && Array.isArray(knownLangsAns.value) ? knownLangsAns.value : []), //
    ...(interestAns && Array.isArray(interestAns.value) ? interestAns.value : []) //
  ].filter(Boolean); //

  tagRow.innerHTML = ""; //
  if (tags.length === 0) { //
    ["AI 실시간연산", "직군 정밀매핑", "개인 커스텀"].forEach(t => { //
      const span = document.createElement("span"); //
      span.className = "tag"; //
      span.textContent = t; //
      tagRow.appendChild(span); //
    });
  } else {
    tags.slice(0, 12).forEach(t => { //
      const span = document.createElement("span"); //
      span.className = "tag"; //
      span.textContent = String(t); //
      tagRow.appendChild(span); //
    });
  }
  return devRole; //
}

function renderSkillBars(devRole, learning) {
  const preset = []; //
  if (devRole.includes("프론트엔드")) preset.push(["Core JS/TS 명세", 75], ["UI/UX 인터랙션", 60], ["React 프레임워크", 15]); //
  else if (devRole.includes("백엔드")) preset.push(["서버 아키텍처", 70], ["데이터 아키텍처", 50], ["엔터프라이즈 엔진", 15]); //
  else if (devRole.includes("AI") || devRole.includes("인텔리전스")) preset.push(["파이썬 데이터 핸들링", 80], ["통계 분석 머신러닝", 50], ["인공신경망 딥러닝", 20]); //
  else if (devRole.includes("게임")) preset.push(["C# 스크립팅", 75], ["게임엔진 라이프사이클", 55], ["물리 충돌 제어", 25]);
  else if (devRole.includes("보안")) preset.push(["네트워크 모니터링", 70], ["시스템 모의해킹", 50], ["취약점 분석보고서", 30]);
  else if (devRole.includes("데브옵스")) preset.push(["Linux 서버 인프라", 80], ["Docker 가상화", 60], ["CI/CD 배포 자동화", 20]);
  else preset.push(["기초 시스템 전공CS", 50], ["협업 형상관리 Git", 30]); //

  skillBars.innerHTML = ""; //
  preset.forEach(([name, pct]) => { //
    const row = document.createElement("div"); //
    row.className = "bar"; //
    row.innerHTML = `
      <div class="bar-top"><span>${escapeHtml(name)}</span><span>${pct}%</span></div>
      <div class="bar-line"><span style="width:${pct}%"></span></div>
    `; //
    skillBars.appendChild(row); //
  });
}

function isOwner(project, nickname) {
  return !!nickname && String(project.leaderName || project.leader || "").trim() === nickname;
}
function isMember(project, nickname) {
  if (!nickname) return false;
  return (project.members || []).some((m) => String(m.userName || m.name || m.nickname || "").trim() === nickname);
}
function getMyMemberInfo(project, nickname) {
  return (project.members || []).find((m) => String(m.userName || m.name || m.nickname || "").trim() === nickname) || null;
}
function roleLabel(role) {
  switch (String(role || "").toUpperCase()) {
    case "LEAD": return "팀장";
    case "FE": return "프론트엔드";
    case "BE": return "백엔드";
    case "AI": return "AI/데이터";
    case "PM": return "PM/기획";
    default: return role ? String(role) : "-";
  }
}
function statusLabel(status) {
  switch (String(status || "").toUpperCase()) {
    case "RECRUITING": return "모집중";
    case "PLANNING": return "기획중";
    case "IN_PROGRESS": return "진행중";
    case "DONE": return "완료";
    default: return status || "-";
  }
}

async function renderJoinedProjects(user) {
  const nickname = getNickname() || user?.name || "Guest";
  const projects = await loadProjectsForMypage();
  const joined = projects.filter((p) => isOwner(p, nickname) || isMember(p, nickname));

  joinedProjectCount.textContent = `${joined.length}개`;
  joinedProjectsEl.innerHTML = "";

  if (joined.length === 0) {
    joinedEmpty.style.display = "block"; //
    return; //
  }
  joinedEmpty.style.display = "none"; //

  joined.slice(0, 8).forEach((p) => {
    const myMember = getMyMemberInfo(p, nickname);
    const myRole = myMember?.role || (isOwner(p, nickname) ? "LEAD" : p.myRole) || "-";
    const recruitText = (p.recruitments || []).map((r) => `${r.role} ${r.count}명`).join(", ");

    const card = document.createElement("div"); //
    card.className = "pcard"; //
    card.innerHTML = `
      <h3 class="pcard-title">${escapeHtml(p.name)}</h3>
      <p class="pcard-desc">${escapeHtml(p.description || "설명이 없습니다.")}</p>
      <div class="badges">
        <span class="badge status">상태: ${escapeHtml(statusLabel(p.status))}</span>
        <span class="badge role">내 역할: ${escapeHtml(roleLabel(myRole))}</span>
        ${recruitText ? `<span class="badge need">모집: ${escapeHtml(recruitText)}</span>` : ""}
      </div>
      <div class="pcard-foot">
        <div class="meta">팀장: ${escapeHtml(p.leaderName)} · ${escapeHtml(formatDate(p.createdAt))}</div>
        <div class="pbtns">
          <button class="action-btn" data-action="open" data-id="${escapeHtml(String(p.id))}">상세</button>
          <button class="action-btn primary" data-action="goto" data-id="${escapeHtml(String(p.id))}">보드</button>
        </div>
      </div>
    `;
    joinedProjectsEl.appendChild(card);
  });

  joinedProjectsEl.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      const p = mypageProjectsCache.find((x) => String(x.id) === String(id));
      if (!p) return;

      if (action === "open") {
        const recruitSummary = (p.recruitments || []).map(r => `${r.role} ${r.count}명`).join(", ") || "-";
        alert(`[${p.name}]\n\n상태: ${statusLabel(p.status)}\n팀장: ${p.leaderName}\n모집: ${recruitSummary}\n태그: ${(p.tags || []).join(", ") || "-"}`);
      }
      if (action === "goto") {
        location.href = "../HTML/teamproject.html?page=1";
      }
    });
  });
}

function renderTimeline(days) {
  const log = readActivity();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const items = log.filter(x => {
    const t = new Date(x.at).getTime();
    return !isNaN(t) && t >= cutoff;
  });

  timelineEl.innerHTML = "";
  if (items.length === 0) {
    timelineEmpty.style.display = "block";
    return;
  }
  timelineEmpty.style.display = "none";

  items.slice(0, 20).forEach((x) => {
    const div = document.createElement("div"); //
    div.className = "titem"; //
    div.innerHTML = `
      <div class="tdate">${escapeHtml(formatDate(x.at))}</div>
      <div class="ttext">${escapeHtml(x.text)}</div>
    `;
    timelineEl.appendChild(div); //
  });
}

function renderGoals(devRole) {
  let goals = readGoals(); //
  if (!Array.isArray(goals) || goals.length === 0) { //
    goals = generateGoals(devRole); //
    writeGoals(goals); //
  }
  weeklyGoalCount.textContent = `${goals.length}개`; //
  goalsEl.innerHTML = goals.map(g => `
    <label class="chk">
      <div class="chk-left">
        <input type="checkbox" ${g.done ? "checked" : ""} data-id="${escapeHtml(g.id)}"/>
        <div class="chk-text">${escapeHtml(g.text)}</div>
      </div>
      <span class="chk-badge">${escapeHtml(g.type)}</span>
    </label>
  `).join(""); //

  goalsEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-id"); //
      const next = readGoals().map(g => g.id === id ? { ...g, done: cb.checked } : g); //
      writeGoals(next); //
      pushActivity(`주간 목표 ${cb.checked ? "완료" : "해제"}: ${next.find(x => x.id === id)?.text || id}`);
      renderAll();
    });
  });
}

function generateGoals(devRole) {
  if (devRole.includes("프론트엔드")) { //
    return [ //
      { id: "g1", text: "JavaScript 런타임 비동기 메커니즘 분석 완료", done: false, type: "주간" }, //
      { id: "g2", text: "반응형 그리드 시스템 모바일 중단점 레이아웃 구성", done: false, type: "핵심" } //
    ]; //
  }
  if (devRole.includes("백엔드")) { //
    return [ //
      { id: "g1", text: "RESTful 아키텍처 스펙 설계 규칙 명세 작성", done: false, type: "주간" }, //
      { id: "g2", text: "데이터베이스 ERD 모델링 다대다 연관관계 매핑 완료", done: false, type: "핵심" } //
    ]; //
  }
  return [ //
    { id: "g1", text: "CS 프로세스 아키텍처 구조 리포트 분석", done: false, type: "주간" }, //
    { id: "g2", text: "도메인 실전 활용을 위한 토이 프로젝트 환경 셋업", done: false, type: "핵심" } //
  ]; //
}

function setRing(percent) {
  const pct = clamp(percent, 0, 100); //
  ringEl.style.background = `conic-gradient(#3b82f6 0deg, #a855f7 ${Math.round(3.6 * pct)}deg, rgba(148,163,184,0.1) ${Math.round(3.6 * pct)}deg)`; //
}

let timelineRangeDays = 7;

function bindEvents() {
  btnResetGoals?.addEventListener("click", () => {
    const quiz = readJSON(STORAGE_KEYS.QUIZ_RESULT, null); //
    const payload = readJSON(STORAGE_KEYS.QUIZ_PAYLOAD, null); //
    const devRole = normalizeDevRole(getQuizRoleRaw(quiz, payload)); //
    writeGoals(generateGoals(devRole)); //
    pushActivity("주간 목표 재생성");
    renderAll();
  });
  btnRetake?.addEventListener("click", () => { location.href = "quiz.html"; }); //
  btnGoStackSurvey?.addEventListener("click", () => { location.href = "quiz.html"; }); //
  btnGoTeamProject?.addEventListener("click", () => { location.href = "teamproject.html"; }); //
  btnGoTeamOnly?.addEventListener("click", () => { location.href = "teamproject.html"; });
  btnContinue?.addEventListener("click", () => { alert("로드맵 이어하기: 현재 단계 카드에서 ‘10% 올리기’를 누르세요."); });

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      timelineRangeDays = Number(t.getAttribute("data-range")) || 7;
      renderTimeline(timelineRangeDays);
    });
  });
}

function renderNoQuizState(user) {
  devRoleText.textContent = "추천 조사 전"; //
  tagRow.innerHTML = ""; //
  weeklyGoalCount.textContent = "0개"; //
  joinedProjectCount.textContent = "0개"; //
  overallPercent.textContent = "0%"; //
  ringValue.textContent = "0%"; //
  currentStepText.textContent = "-"; //
  nextStepText.textContent = "-"; //
  nextStepPill.textContent = "스택 추천 조사를 먼저 진행해주세요"; //

  btnContinue?.classList.add("is-hidden"); //
  btnRetake?.classList.add("is-hidden"); //
  dashboardContent?.classList.add("is-hidden"); //
  quizEmptyState?.classList.remove("is-hidden"); //
  if (quizEmptyState) quizEmptyState.style.display = "grid"; //
}

function renderDashboardState() {
  btnContinue?.classList.remove("is-hidden"); //
  btnRetake?.classList.remove("is-hidden"); //
  dashboardContent?.classList.remove("is-hidden"); //
  quizEmptyState?.classList.add("is-hidden"); //
  if (quizEmptyState) quizEmptyState.style.display = "none"; //
}

function hasValidQuizResult(quiz, payload) {
  const rawRole = getQuizRoleRaw(quiz, payload);
  return String(rawRole).trim().length > 0;
}

function ensureInitialState() {
  const user = readJSON(STORAGE_KEYS.USER, null);
  if (!user) {
    const nickname = sessionStorage.getItem("nickname") || "Team Member";
    writeJSON(STORAGE_KEYS.USER, { name: nickname, job: "Member", role: "USER" });
  }
}

async function renderAll() {
  const user = readJSON(STORAGE_KEYS.USER, null);
  const quiz = readJSON(STORAGE_KEYS.QUIZ_RESULT, null);
  const payload = readJSON(STORAGE_KEYS.QUIZ_PAYLOAD, null);

  if (!hasValidQuizResult(quiz, payload)) {
    renderNoQuizState(user);
    return;
  }

  renderDashboardState();
  const devRole = renderHeader(user, quiz, payload);
  
  renderRoadmap(quiz, devRole);
  await renderJoinedProjects(user);
  renderGoals(devRole);
  renderTimeline(timelineRangeDays);
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }

(function init() {
  const activeTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", activeTheme);
  
  ensureInitialState();
  bindEvents();
  renderAll();
})();