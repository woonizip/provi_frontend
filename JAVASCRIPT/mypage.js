/* mypage.js */

const API_ENDPOINTS = {
  USER_INFO: "/api/mypage/user",               // 회원 정보 조회 및 수정
  QUIZ_RESULT: "/api/mypage/quiz-result",       // AI 추천 결과 조회 및 저장
  LEARNING_PROGRESS: "/api/mypage/progress",   // 로드맵 진도율 관리
  JOINED_PROJECTS: "/api/teamproject/joined",  // 내가 참여 중인 팀 프로젝트 리스트
  LEAVE_ACCOUNT: "/api/auth/leave"             // 회원 탈퇴
};

const STORAGE_KEYS = {
  USER: "sf_user",
  PROJECTS: "sf_projects",
  QUIZ_RESULT: "quizResult",
  QUIZ_PAYLOAD: "quizResultPayload",
  LEARNING: "provi_learning_progress"
};

const el = (id) => document.getElementById(id);

const sbName = el("sbName");
const devRoleText = el("devRoleText");
const tagRow = el("tagRow");
const roadmapEl = el("roadmap");
const nextStepPill = el("nextStepPill");
const joinedProjectsEl = el("joinedProjects");
const joinedEmpty = el("joinedEmpty");
const projectCountEl = el("projectCount");
const ringEl = el("ring");
const ringValue = el("ringValue");
const dashboardContent = el("dashboardContent");
const quizEmptyState = el("quizEmptyState");

function readJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  sessionStorage.setItem(key, JSON.stringify(val));
}

async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    alert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
    window.location.href = "signin.html";
    return null;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP 에러 발생: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return null;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  } catch {
    return "-";
  }
}

function getNickname() {
  return (sessionStorage.getItem("nickname") || "").trim();
}

// 💡 1번 보완: 직군 코드 도출 조건 정교화 (quizResult Payload 역추적)
function getQuizRoleRaw(quiz, payload) {
  if (quiz && quiz.role) return quiz.role;
  if (quiz && quiz.quizResult && quiz.quizResult.role) return quiz.quizResult.role;
  if (payload && Array.isArray(payload.answers)) {
    const targetRoleAns = payload.answers.find(a => a.id === "targetRole");
    const webAreaAns = payload.answers.find(a => a.id === "web_area");
    if (targetRoleAns?.value === "웹 개발자" && webAreaAns?.value) {
      if (webAreaAns.value.includes("프론트엔드")) return "프론트엔드 개발자";
      if (webAreaAns.value.includes("백엔드")) return "백엔드 개발자";
      if (webAreaAns.value.includes("풀스택")) return "풀스택 웹 개발자";
    }
    return targetRoleAns?.value || "";
  }
  return "";
}

function normalizeDevRole(roleRaw) {
  const r = String(roleRaw || "").trim();
  return r.length > 0 ? r : "";
}

function parseAILoadmapData(quizResult) {
  // 중첩 구조 파싱 가드 추가
  let rawRoadmap = [];
  if (quizResult) {
    if (Array.isArray(quizResult.roadmap)) rawRoadmap = quizResult.roadmap;
    else if (quizResult.quizResult && Array.isArray(quizResult.quizResult.roadmap)) rawRoadmap = quizResult.quizResult.roadmap;
  }
  
  if (rawRoadmap.length === 0) {
    return [
      { id: "S1", title: "1단계. 코어 언어 제어 기초", desc: "도메인 베이스 코어 언어 제어권을 확보합니다.", items: ["개발 도구 설치 및 컴파일 실행 환경 검증", "기본 연산 제어 구조 응용 예제 실습"], tags: ["기본 환경", "코어 문법"] },
      { id: "S2", title: "2단계. 형상 관리 및 통신 아웃라인", desc: "협업용 깃 브랜치 운영 수립 가이드를 준수합니다.", items: ["Git CLI 환경 컨벤션 룰 정돈", "오픈 API 비동기 데이터 파싱 가동"], tags: ["Git 흐름", "API 통신"] },
      { id: "S3", title: "3단계. 프레임워크 상용 설계 결합", desc: "실무 에코시스템 프레임워크를 바인딩합니다.", items: ["주요 아키텍처 코어 모듈 결합 설계", "상태 관리 라이프사이클 효율 최적화"], tags: ["Framework", "Architecture"] },
      { id: "S4", title: "4단계. 실무 인프라 클라우드 배포", desc: "가상화 가상 컴퓨터 공간에 최종 산출물을 이식합니다.", items: ["Docker 컨테이너 이미지 패키징 빌드 가동", "AWS 클라우드 인프라 파이프라인 무중단 배포"], tags: ["Docker 배포", "Cloud 인프라"] },
      { id: "S5", title: "5단계. 종합 실전 빌드업 릴리즈 포트폴리오", desc: "포토폴리오 마일스톤 산출 검증을 마무리합니다.", items: ["포트폴리오 README 명세서 최적화 정돈", "실전 모의 가상 면접 피드백 오답노트 보완"], tags: ["릴리즈", "면접 대비"] }
    ];
  }

  return rawRoadmap.map((sentence, index) => {
    let clauses = sentence.split(/ 그리고 | 및 |익히면서 |확보하고 |, /).map(s => s.trim());
    clauses = clauses.filter(c => c.length > 2).map(c => c.endsWith(".") ? c : c + ".");

    let tags = ["AI 큐레이션", "실전 스택"];
    const upper = sentence.toUpperCase();
    if (upper.includes("PYTHON") || upper.includes("DJANGO")) tags = ["Python", "Django"];
    if (upper.includes("JAVA") || upper.includes("SPRING")) tags = ["Java", "Spring Boot"];
    if (upper.includes("REACT") || upper.includes("NEXT")) tags = ["React.js", "JavaScript"];
    if (upper.includes("DOCKER") || upper.includes("AWS")) tags = ["Docker", "AWS Infra"];

    return {
      id: `AI_STAGE_${index + 1}`,
      title: `${index + 1}단계. AI 추천 스택 로드맵`,
      desc: sentence.length > 85 ? sentence.slice(0, 85) + "..." : sentence,
      items: clauses,
      tags: tags
    };
  });
}

function setRing(percent) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  if (ringEl) {
    ringEl.style.background = `conic-gradient(#6366f1 0deg, #06b6d4 ${Math.round(3.6 * pct)}deg, rgba(148,163,184,0.1) ${Math.round(3.6 * pct)}deg)`;
  }
}

function renderRoadmap(quizResult, backendProgress) {
  const steps = parseAILoadmapData(quizResult);
  const stepProgress = backendProgress || {};
  
  steps.forEach((s, idx) => {
    if (stepProgress[s.id] == null) stepProgress[s.id] = idx === 0 ? 10 : 0;
  });

  const ordered = steps.map(s => s.id);
  let currentStepId = steps.find(s => (stepProgress[s.id] ?? 0) < 100)?.id || steps[steps.length - 1].id;
  const currentIdx = ordered.indexOf(currentStepId);
  const nextStep = steps[currentIdx + 1] || null;

  if (nextStepPill) nextStepPill.textContent = `목표 단계: ${nextStep ? nextStep.title : "전 코스 최종 완료"}`;

  roadmapEl.innerHTML = "";
  steps.forEach((s, idx) => {
    const pct = Math.max(0, Math.min(100, stepProgress[s.id] ?? 0));
    const card = document.createElement("div");
    card.className = "step" + (idx === currentIdx ? " primary" : "");

    const subitemsHtml = s.items.map((itemSentence, sIdx) => `
      <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 13px; line-height: 1.5;">
        <span style="color: #06b6d4; font-weight: 800; flex-shrink: 0;">${sIdx + 1}.</span>
        <span style="color: var(--text-main); opacity: 0.95;">${escapeHtml(itemSentence)}</span>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="step-head">
        <h3 class="step-title">${escapeHtml(s.title)}</h3>
        <span class="step-badge">${idx === currentIdx ? "진행 중" : (idx < currentIdx ? "완료" : "예정")}</span>
      </div>
      <p class="step-desc" style="margin-bottom: 12px; color: var(--text-sub); font-size: 13px;">${escapeHtml(s.desc)}</p>
      
      <div class="sub-task-box" style="background: rgba(148,163,184,0.04); padding: 12px 14px; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--card-border);">
        ${subitemsHtml}
      </div>

      <div class="step-tags">${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      <div class="step-actions" style="margin-top: 14px;">
        <div class="progress"><span style="width:${pct}%"></span></div>
        <button type="button" class="btn btn-ghost" data-step="${s.id}" data-action="complete" style="padding: 6px 12px; font-size: 0.8rem;">진도 10% 추가</button>
      </div>
    `;
    roadmapEl.appendChild(card);
  });

  const avg = Math.round(steps.reduce((sum, s) => sum + (stepProgress[s.id] ?? 0), 0) / steps.length);
  setRing(avg);
  if (ringValue) ringValue.textContent = `${avg}%`;

  renderLiveMetrics(devRoleText.textContent || "", avg);

  roadmapEl.querySelectorAll('button[data-action="complete"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const stepId = btn.getAttribute("data-step");
      const currentPct = stepProgress[stepId] ?? 0;
      const targetPct = Math.min(100, currentPct + 10);

      try {
        await authFetch(API_ENDPOINTS.LEARNING_PROGRESS, {
          method: "PUT",
          body: JSON.stringify({ stepId, progress: targetPct })
        });
        await renderAll();
      } catch (err) {
        console.error("진도 반영 실패:", err);
        alert("백엔드 서버 연동에 실패했습니다.");
      }
    });
  });
}

function renderLiveMetrics(devRole, avgProgress) {
  let subSection = el("liveMetricsSection");
  if (!subSection && dashboardContent) {
    subSection = document.createElement("div");
    subSection.id = "liveMetricsSection";
    subSection.className = "planner-grid";
    subSection.style.marginTop = "24px";
    dashboardContent.appendChild(subSection);
  }

  if (!subSection) return;

  const m1 = Math.min(100, Math.round(avgProgress * 1.1));
  const m2 = Math.min(100, Math.round(avgProgress * 0.9));

  subSection.innerHTML = `
    <div class="todo-list-box" style="grid-column: span 2;">
      <h4 style="font-size: 1rem; margin-bottom: 14px;"><i class='bx bx-git-branch' style='color:#6366f1;'></i> AI 직군 연동 실시간 성장률 인디케이터</h4>
      <div class="skill-metrics-grid">
        <div class="metric-bar-item">
          <div class="metric-info"><span>컴파일 및 코어 문법 숙련도</span><span>${m1}%</span></div>
          <div class="metric-line"><span style="width:${m1}%"></span></div>
        </div>
        <div class="metric-bar-item">
          <div class="metric-info"><span>인프라 아키텍처 연동 지표</span><span>${m2}%</span></div>
          <div class="metric-line"><span style="width:${m2}%"></span></div>
        </div>
      </div>
    </div>
  `;
}

function renderHeader(user, quiz, payload) {
  const name = sessionStorage.getItem("nickname") || user?.name || "개발자";
  if (sbName) sbName.textContent = `${name}님`;

  const rawRole = getQuizRoleRaw(quiz, payload);
  const devRole = normalizeDevRole(rawRole);
  if (devRoleText) devRoleText.textContent = devRole || "분석 대기 중";

  // 중첩 풀링 적용
  const target = (quiz && quiz.quizResult) ? quiz.quizResult : (quiz || payload);
  const stacks = target && Array.isArray(target.stacks) ? target.stacks : [];
  
  tagRow.innerHTML = "";
  if (stacks.length === 0) {
    ["API 개발", "형상 관리", "가상화 가동"].forEach(t => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tagRow.appendChild(span);
    });
  } else {
    stacks.forEach(s => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = `${s.icon || "⚡"} ${s.name}`;
      tagRow.appendChild(span);
    });
  }
}

// 💡 3번 보완: 참여중 프로젝트 데이터 추출 알고리즘 전면 교정 (userName / nickname 완전 래핑)
async function renderJoinedProjects() {
  const nickname = getNickname();
  let joined = [];

  try {
    const data = await authFetch(API_ENDPOINTS.JOINED_PROJECTS, { method: "GET" });
    joined = Array.isArray(data) ? data : (data?.content || data?.list || []);
  } catch (err) {
    console.warn("백엔드 프로젝트 데이터 수신 실패, 오프라인 모드 스왑:", err);
    const raw = readJSON(STORAGE_KEYS.PROJECTS, []);
    joined = raw;
  }

  // 내 참여 조건 필터 매칭 튜닝
  const myFiltered = joined.filter(p => {
    const isLeader = String(p.leaderName || p.leader || "").trim() === nickname;
    const isMember = Array.isArray(p.members) && p.members.some(m => {
      const targetName = String(m.userName || m.nickname || m.name || "").trim();
      return targetName === nickname;
    });
    return isLeader || isMember;
  });

  if (projectCountEl) projectCountEl.textContent = String(myFiltered.length);
  joinedProjectsEl.innerHTML = "";

  if (myFiltered.length === 0) {
    if (joinedEmpty) joinedEmpty.style.display = "flex";
    return;
  }
  if (joinedEmpty) joinedEmpty.style.display = "none";

  myFiltered.forEach(p => {
    const card = document.createElement("div");
    card.className = "pcard";
    
    let catText = p.category || "웹";
    if (catText === "AI_DATA") catText = "AI/데이터";
    if (catText === "SEC") catText = "보안";

    const checkLeader = String(p.leaderName || p.leader || "").trim() === nickname;

    card.innerHTML = `
      <h3 class="pcard-title">${escapeHtml(p.title || p.name)}</h3>
      <p class="pcard-desc">${escapeHtml(p.content || p.description || "설명이 없는 프로젝트입니다.")}</p>
      <div class="badges">
        <span class="badge status">소속: ${escapeHtml(checkLeader ? "팀장" : "팀원")}</span>
        <span class="badge role">${escapeHtml(catText)}</span>
      </div>
      <div class="pcard-foot">
        <div class="meta">개설일: ${p.createdAt ? formatDate(p.createdAt) : "-"}</div>
        <div class="pbtns">
          <button type="button" class="action-btn primary" onclick="location.href='teamproject.html'">보드 가기</button>
        </div>
      </div>
    `;
    joinedProjectsEl.appendChild(card);
  });
}

function renderNoQuizState() {
  if (devRoleText) devRoleText.textContent = "추천 조사 미달성";
  tagRow.innerHTML = `<span class="tag">성장 분석 전</span>`;
  if (ringValue) ringValue.textContent = "0%";
  setRing(0);
  if (dashboardContent) dashboardContent.classList.add("is-hidden");
  if (quizEmptyState) quizEmptyState.classList.remove("is-hidden");
}

function renderDashboardState() {
  if (dashboardContent) dashboardContent.classList.remove("is-hidden");
  if (quizEmptyState) quizEmptyState.classList.add("is-hidden");
}

function ensureInitialState() {
  const user = readJSON(STORAGE_KEYS.USER, null);
  if (!user) {
    const nickname = getNickname() || "Team Member";
    writeJSON(STORAGE_KEYS.USER, { name: nickname, job: "정회원", role: "USER" });
  }
}

// 💡 2번 보완: 비동기 결합 파싱 예외 최적화 처리
async function renderAll() {
  let user = null;
  let quiz = null;
  let payload = null;
  let progress = null;

  try {
    const [userRes, quizRes, progressRes] = await Promise.all([
      authFetch(API_ENDPOINTS.USER_INFO, { method: "GET" }).catch(() => null),
      authFetch(API_ENDPOINTS.QUIZ_RESULT, { method: "GET" }).catch(() => null),
      authFetch(API_ENDPOINTS.LEARNING_PROGRESS, { method: "GET" }).catch(() => null)
    ]);

    user = userRes;
    quiz = quizRes;
    progress = progressRes;
  } catch (e) {
    console.warn("백엔드 통신 해제 상태, 로컬 캐시 우선 취합 가동.");
  }

  // 백엔드가 비어있다면 로컬 스토리지 역추적 복구 실행
  if (!user) user = readJSON(STORAGE_KEYS.USER, null);
  if (!quiz) quiz = readJSON(STORAGE_KEYS.QUIZ_RESULT, null);
  if (!payload) payload = readJSON(STORAGE_KEYS.QUIZ_PAYLOAD, null);
  if (!progress) progress = readJSON(STORAGE_KEYS.LEARNING, {}).stepProgress;

  const rawRole = getQuizRoleRaw(quiz, payload);
  if (!String(rawRole).trim().length) {
    renderNoQuizState();
    await renderJoinedProjects();
    return;
  }

  renderDashboardState();
  renderHeader(user, quiz, payload);
  renderRoadmap(quiz, progress);
  await renderJoinedProjects();
}

function bindPopupEvents() {
  el("btnLeave")?.addEventListener("click", async () => {
    if (confirm("PROVI 계정을 완전히 삭제하시겠습니까?\n서버 DB에 보관되어 있던 모든 추천 이력과 프로젝트 소속 기록이 파기됩니다.")) {
      try {
        await authFetch(API_ENDPOINTS.LEAVE_ACCOUNT, { method: "DELETE" });
        sessionStorage.clear();
        localStorage.clear();
        alert("회원 탈퇴가 완료되었습니다. 랜딩 홈으로 이동합니다.");
        location.href = "mainpage.html";
      } catch (err) {
        alert("탈퇴 처리 중 통신 장해가 발생했습니다.");
      }
    }
  });

  el("btnChangePassword")?.addEventListener("click", () => {
    alert("보안 비밀번호 변경 본인확인 토큰 메일이 계정 주소로 발송되었습니다.");
  });
}

(function init() {
  const activeTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", activeTheme);
  
  // 💡 선제적 로딩 닉네임 유실 가드 링
  const initialNick = getNickname();
  if (sbName && initialNick) sbName.textContent = `${initialNick}님`;

  ensureInitialState();
  bindPopupEvents();
  renderAll();
})();