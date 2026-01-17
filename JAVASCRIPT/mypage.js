/* =========================================================
   My Page - Data Binding (LocalStorage 기반)
   - quiz 결과(직군/태그) + 팀프로젝트(sf_projects) + 학습기록 저장
========================================================= */

/** 프로젝트(팀프로젝트 페이지)에서 쓰던 키 */
const STORAGE_KEYS = {
  USER: "sf_user",              // { name, job, role } (프로젝트에서 이미 사용중)
  PROJECTS: "sf_projects",      // 팀프로젝트 카드
  // 마이페이지용
  QUIZ_RESULT: "provi_quiz_result",       // 추천 결과(직군/태그)
  LEARNING: "provi_learning_progress",    // 학습 진행/완료
  GOALS: "provi_weekly_goals",            // 이번주 목표 체크리스트
  ACTIVITY: "provi_activity_log"          // 활동 기록
};

const el = (id) => document.getElementById(id);

const sbName = el("sbName");
const sbJob = el("sbJob");

const devRoleText = el("devRoleText");
const tagRow = el("tagRow");

const roadmapEl = el("roadmap");
const nextStepPill = el("nextStepPill");

const joinedProjectsEl = el("joinedProjects");
const joinedEmpty = el("joinedEmpty");

const timelineEl = el("timeline");
const timelineEmpty = el("timelineEmpty");

const ringEl = el("ring");
const ringValue = el("ringValue");
const overallPercent = el("overallPercent");
const currentStepText = el("currentStepText");
const nextStepText = el("nextStepText");
const skillBars = el("skillBars");

const goalsEl = el("goals");
const feedbackEl = el("feedback");
const compareEl = el("compare");

const weeklyGoalCount = el("weeklyGoalCount");
const joinedProjectCount = el("joinedProjectCount");

const btnResetGoals = el("btnResetGoals");
const btnGoTeamProject = el("btnGoTeamProject");
const btnContinue = el("btnContinue");
const btnRetake = el("btnRetake");

const tabs = document.querySelectorAll(".tab");

/* -----------------------------
   Safe Storage Helpers
----------------------------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowISO() {
  return new Date().toISOString();
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  } catch {
    return "";
  }
}

/* -----------------------------
   Role Normalize (quiz 결과 -> 표시용)
----------------------------- */
function normalizeDevRole(roleRaw) {
  const r = String(roleRaw || "").toLowerCase();
  // 가능한 입력 다양성 대응
  if (r.includes("front")) return "웹 개발자 · 프론트엔드";
  if (r.includes("프론트")) return "웹 개발자 · 프론트엔드";
  if (r.includes("backend")) return "웹 개발자 · 백엔드";
  if (r.includes("백")) return "웹 개발자 · 백엔드";
  if (r.includes("ai")) return "AI 개발자 · 데이터/모델";
  if (r.includes("data")) return "AI 개발자 · 데이터/모델";
  if (r.includes("pm")) return "기획 · PM";
  if (r.includes("mobile")) return "앱 개발자 · 모바일";
  if (r.includes("android") || r.includes("ios")) return "앱 개발자 · 모바일";
  if (r.includes("game")) return "게임 개발자";
  if (r.includes("security") || r.includes("보안")) return "보안 · 시큐리티";
  return roleRaw ? String(roleRaw) : "추천 결과 없음";
}

/* -----------------------------
   Roadmap Templates
----------------------------- */
function getRoadmapTemplate(devRoleText) {
  // devRoleText는 normalizeDevRole 결과(한글) 기반
  if (devRoleText.includes("프론트엔드")) {
    return [
      {
        id: "FE_1",
        title: "1단계. 기초 (웹 기본기)",
        desc: "프론트엔드의 기반이 되는 언어/기술을 배우는 단계입니다. 정적 웹 사이트를 만들 수 있어야 합니다.",
        tags: ["HTML", "CSS", "JavaScript"],
        skills: { HTML: 0, CSS: 0, JS: 0 }
      },
      {
        id: "FE_2",
        title: "2단계. 중급 (동적 웹 개발)",
        desc: "API 통신과 비동기 처리, 상태 관리의 기본기를 익히고 작은 기능 단위 구현을 반복합니다.",
        tags: ["DOM", "Fetch/Ajax", "Async", "REST"],
        skills: { JS: 0, "REST": 0 }
      },
      {
        id: "FE_3",
        title: "3단계. 심화 (프레임워크 활용)",
        desc: "React(또는 Next.js)로 컴포넌트 설계와 라우팅, 상태 관리 패턴을 익힙니다.",
        tags: ["React", "TypeScript", "Routing", "State"],
        skills: { React: 0, TS: 0 }
      },
      {
        id: "FE_4",
        title: "4단계. 확장 (실무·전문가)",
        desc: "테스트/성능/배포를 포함한 실무 프로세스를 경험하고 포트폴리오 완성도를 올립니다.",
        tags: ["Testing", "CI/CD", "Performance", "Deploy"],
        skills: { Deploy: 0, Testing: 0 }
      }
    ];
  }

  if (devRoleText.includes("백엔드")) {
    return [
      {
        id: "BE_1",
        title: "1단계. 기초 (서버 기본기)",
        desc: "HTTP, DB, 기본 API 설계 원칙을 이해하고 간단한 CRUD를 만들 수 있어야 합니다.",
        tags: ["HTTP", "SQL", "CRUD", "Auth"],
        skills: { HTTP: 0, SQL: 0 }
      },
      {
        id: "BE_2",
        title: "2단계. 중급 (서비스 구조화)",
        desc: "레이어드 구조, 트랜잭션, 예외 처리, 테스트의 기본기를 확보합니다.",
        tags: ["Layered", "Transaction", "Test"],
        skills: { "Layered": 0, Test: 0 }
      },
      {
        id: "BE_3",
        title: "3단계. 심화 (프레임워크 & 운영)",
        desc: "Spring Boot 기반으로 보안/성능/캐시/모니터링을 다루고 운영 관점에 익숙해집니다.",
        tags: ["Spring", "Security", "Cache", "Monitoring"],
        skills: { Spring: 0, Security: 0 }
      },
      {
        id: "BE_4",
        title: "4단계. 확장 (실무·전문가)",
        desc: "MSA/메시지큐/클라우드 배포 등을 경험하며 안정적인 운영 역량을 쌓습니다.",
        tags: ["Docker", "Cloud", "Queue", "MSA"],
        skills: { Cloud: 0, Docker: 0 }
      }
    ];
  }

  if (devRoleText.includes("AI")) {
    return [
      {
        id: "AI_1",
        title: "1단계. 기초 (데이터/파이썬)",
        desc: "파이썬 문법과 데이터 처리(넘파이/판다스)를 통해 데이터 다루는 습관을 만듭니다.",
        tags: ["Python", "Pandas", "Numpy"],
        skills: { Python: 0, Pandas: 0 }
      },
      {
        id: "AI_2",
        title: "2단계. 중급 (ML 기본기)",
        desc: "지도/비지도 학습 개념과 평가 지표를 익히고 간단 모델링을 반복합니다.",
        tags: ["Sklearn", "Metrics", "Feature"],
        skills: { Sklearn: 0, Metrics: 0 }
      },
      {
        id: "AI_3",
        title: "3단계. 심화 (DL/모델링)",
        desc: "딥러닝 프레임워크를 익히고 데이터 파이프라인과 학습/추론 구조를 구축합니다.",
        tags: ["PyTorch", "TensorFlow", "Pipeline"],
        skills: { DL: 0, Pipeline: 0 }
      },
      {
        id: "AI_4",
        title: "4단계. 확장 (실무·MLOps)",
        desc: "모델 배포/버전관리/모니터링(MLOps)을 통해 제품화 관점을 확보합니다.",
        tags: ["FastAPI", "MLOps", "Deploy", "Monitoring"],
        skills: { Deploy: 0, MLOps: 0 }
      }
    ];
  }

  // default
  return [
    {
      id: "GEN_1",
      title: "1단계. 기초",
      desc: "기본 CS/언어/도구를 다지는 단계입니다.",
      tags: ["CS", "Git", "Basics"],
      skills: { CS: 0 }
    },
    {
      id: "GEN_2",
      title: "2단계. 중급",
      desc: "작은 기능 단위를 반복 구현하며 실력을 올립니다.",
      tags: ["Mini Projects", "Practice"],
      skills: { Practice: 0 }
    },
    {
      id: "GEN_3",
      title: "3단계. 심화",
      desc: "프레임워크/아키텍처/협업을 다룹니다.",
      tags: ["Framework", "Collaboration"],
      skills: { Framework: 0 }
    },
    {
      id: "GEN_4",
      title: "4단계. 확장",
      desc: "배포/운영/성능 등을 포함한 실무 확장을 합니다.",
      tags: ["Deploy", "Ops"],
      skills: { Deploy: 0 }
    }
  ];
}

/* -----------------------------
   Learning Progress Model
   - stepProgress[stepId] = 0~100
   - skillProgress[skillKey] = 0~100
----------------------------- */
function readLearning() {
  return readJSON(STORAGE_KEYS.LEARNING, {
    stepProgress: {},
    skillProgress: {},
    currentStepId: null
  });
}
function writeLearning(data) {
  writeJSON(STORAGE_KEYS.LEARNING, data);
}

/* -----------------------------
   Activity Log
----------------------------- */
function readActivity() {
  return readJSON(STORAGE_KEYS.ACTIVITY, []);
}
function pushActivity(text) {
  const log = readActivity();
  log.unshift({ at: nowISO(), text });
  writeJSON(STORAGE_KEYS.ACTIVITY, log.slice(0, 200));
}

/* -----------------------------
   Goals
----------------------------- */
function readGoals() {
  return readJSON(STORAGE_KEYS.GOALS, []);
}
function writeGoals(goals) {
  writeJSON(STORAGE_KEYS.GOALS, goals);
}

function generateGoals(devRole) {
  // 역할별 간단 목표 세트
  if (devRole.includes("프론트엔드")) {
    return [
      { id: "g1", text: "HTML 시맨틱 태그로 페이지 1개 구성", done: false, type: "주간" },
      { id: "g2", text: "CSS Flex/Grid로 카드 레이아웃 만들기", done: false, type: "주간" },
      { id: "g3", text: "JS DOM 이벤트 2개 실습(클릭/입력)", done: false, type: "핵심" },
      { id: "g4", text: "Fetch로 공개 API 1회 호출해보기", done: false, type: "확장" }
    ];
  }
  if (devRole.includes("백엔드")) {
    return [
      { id: "g1", text: "REST API 설계 규칙 정리", done: false, type: "주간" },
      { id: "g2", text: "DB 테이블 2개 설계 + 관계 정의", done: false, type: "핵심" },
      { id: "g3", text: "Spring CRUD 엔드포인트 3개 구현", done: false, type: "주간" },
      { id: "g4", text: "JWT/세션 인증 흐름 비교 정리", done: false, type: "확장" }
    ];
  }
  if (devRole.includes("AI")) {
    return [
      { id: "g1", text: "Pandas로 데이터 정제 1회 수행", done: false, type: "주간" },
      { id: "g2", text: "Sklearn으로 분류 모델 1개 학습", done: false, type: "핵심" },
      { id: "g3", text: "평가지표(Accuracy/F1) 비교 정리", done: false, type: "주간" },
      { id: "g4", text: "FastAPI로 추론 API 스켈레톤 작성", done: false, type: "확장" }
    ];
  }
  return [
    { id: "g1", text: "학습 계획(주간) 3개 작성", done: false, type: "주간" },
    { id: "g2", text: "미니 프로젝트 1개 목표 설정", done: false, type: "핵심" },
    { id: "g3", text: "Git 기본 명령 10개 복습", done: false, type: "주간" }
  ];
}

/* -----------------------------
   Team Project Data
----------------------------- */
function readUser() {
  return readJSON(STORAGE_KEYS.USER, null);
}
function readProjects() {
  const arr = readJSON(STORAGE_KEYS.PROJECTS, []);
  return Array.isArray(arr) ? arr : [];
}

// 팀프로젝트 코드 호환(예전 구조 포함)
function normalizeProject(p) {
  return {
    ...p,
    id: p.id,
    name: p.name || "Untitled",
    description: p.description || "",
    status: p.status || "PLANNING",
    createdAt: p.createdAt || nowISO(),
    leader: p.leader || p.createdBy || "Unknown",
    myRole: p.myRole || p.role || "",
    neededRoles: Array.isArray(p.neededRoles) ? p.neededRoles : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    members: Array.isArray(p.members) ? p.members : []
  };
}

function statusLabel(status) {
  switch (status) {
    case "RECRUITING": return "모집중";
    case "PLANNING": return "기획중";
    case "DEVELOPING": return "진행중";
    case "DONE": return "완료";
    case "MAINTAIN": return "유지보수";
    case "TESTING": return "테스트";
    default: return status;
  }
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

/* -----------------------------
   Quiz Result Source
   - 프로젝트마다 키가 다를 수 있어 "유연하게" 읽음
----------------------------- */
function readQuizResult() {
  // 1) 우선 지정 키
  const direct = readJSON(STORAGE_KEYS.QUIZ_RESULT, null);
  if (direct) return direct;

  // 2) 흔한 키 후보들(네 프로젝트 구조가 다양할 수 있으니)
  const candidates = [
    "quizResult",
    "provi_result",
    "proviResult",
    "stackflow_quiz_result",
    "sf_quiz_result"
  ];

  for (const k of candidates) {
    const v = readJSON(k, null);
    if (v) return v;
  }

  return null;
}

/* -----------------------------
   Render: Header (Role/Tags)
----------------------------- */
function renderHeader(user, quiz) {
  const name = user?.name || "Guest";
  const job = user?.job || "Member";
  if (sbName) sbName.textContent = name;
  if (sbJob) sbJob.textContent = job;

  // quiz 구조 유연 처리
  const rawRole =
    quiz?.developerRole ||
    quiz?.role ||
    quiz?.recommendedRole ||
    quiz?.job ||
    quiz?.devRole ||
    quiz?.resultRole ||
    "";

  const devRole = normalizeDevRole(rawRole);

  devRoleText.textContent = devRole;

  // 태그(선호/배우고싶은 언어 등)
  const tags = [
    ...(quiz?.preferredLanguages || quiz?.preferredLangs || []),
    ...(quiz?.wantLanguages || quiz?.targetLanguages || quiz?.learnLanguages || []),
    ...(quiz?.interests || [])
  ].filter(Boolean);

  tagRow.innerHTML = "";
  if (tags.length === 0) {
    // 기본 안내 태그
    ["선호 언어", "배우고 싶은 언어", "관심 분야"].forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tagRow.appendChild(span);
    });
  } else {
    tags.slice(0, 12).forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = String(t);
      tagRow.appendChild(span);
    });
  }

  return devRole;
}

/* -----------------------------
   Render: Roadmap
----------------------------- */
function renderRoadmap(devRole) {
  const learning = readLearning();
  const steps = getRoadmapTemplate(devRole);

  // step progress 기본값 부여
  steps.forEach((s, idx) => {
    if (learning.stepProgress[s.id] == null) {
      learning.stepProgress[s.id] = idx === 0 ? 20 : 0; // 첫 단계 기본 20% 정도
    }
  });

  // current step id
  if (!learning.currentStepId) {
    learning.currentStepId = steps[0]?.id || null;
  }

  // 현재/다음 단계 계산
  const ordered = steps.map(s => s.id);
  const currentIdx = Math.max(0, ordered.indexOf(learning.currentStepId));
  const nextIdx = Math.min(steps.length - 1, currentIdx + 1);

  const currentStep = steps[currentIdx];
  const nextStep = steps[nextIdx];

  currentStepText.textContent = currentStep ? currentStep.title.replace(/^(\d단계\.)?/, "").trim() : "-";
  nextStepText.textContent = nextStep ? nextStep.title.replace(/^(\d단계\.)?/, "").trim() : "-";
  nextStepPill.textContent = `다음 추천 단계: ${nextStep ? nextStep.title : "-"}`;

  roadmapEl.innerHTML = "";

  steps.forEach((s, idx) => {
    const pct = clamp(learning.stepProgress[s.id] ?? 0, 0, 100);

    const card = document.createElement("div");
    card.className = "step" + (idx === currentIdx ? " primary" : "");
    card.innerHTML = `
      <div class="step-head">
        <h3 class="step-title">${escapeHtml(s.title)}</h3>
        <span class="step-badge">${idx === currentIdx ? "진행 중" : (idx < currentIdx ? "완료" : "예정")}</span>
      </div>

      <p class="step-desc">${escapeHtml(s.desc)}</p>

      <div class="step-tags">
        ${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>

      <div class="step-actions">
        <div class="progress" aria-label="진행률">
          <span style="width:${pct}%"></span>
        </div>
        <button class="btn-ghost" data-step="${s.id}" data-action="complete">
          이 단계 10% 올리기
        </button>
      </div>
    `;

    roadmapEl.appendChild(card);
  });

  // overall percent
  const avg = Math.round(
    steps.reduce((sum, s) => sum + (learning.stepProgress[s.id] ?? 0), 0) / Math.max(1, steps.length)
  );

  setRing(avg);
  overallPercent.textContent = `${avg}%`;
  ringValue.textContent = `${avg}%`;

  // skill bars(간단히: 역할별 대표 기술 바)
  renderSkillBars(devRole, learning);

  // 저장
  writeLearning(learning);

  // roadmap interactions
  roadmapEl.querySelectorAll('button[data-action="complete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const stepId = btn.getAttribute("data-step");
      const l = readLearning();
      l.stepProgress[stepId] = clamp((l.stepProgress[stepId] ?? 0) + 10, 0, 100);

      // 현재 단계 갱신 규칙: 현재 단계가 100%면 다음 단계로
      const steps2 = getRoadmapTemplate(devRole);
      const idx = steps2.findIndex(x => x.id === stepId);
      if (idx >= 0 && l.stepProgress[stepId] >= 100 && idx < steps2.length - 1) {
        l.currentStepId = steps2[idx + 1].id;
      } else {
        l.currentStepId = stepId;
      }

      writeLearning(l);
      pushActivity(`로드맵 진행: ${steps.find(x => x.id === stepId)?.title || stepId} (+10%)`);
      renderAll(); // 재렌더
    });
  });
}

function renderSkillBars(devRole, learning) {
  const preset = [];
  if (devRole.includes("프론트엔드")) preset.push(["HTML", 100], ["CSS", 80], ["JS", 45], ["React", 10]);
  else if (devRole.includes("백엔드")) preset.push(["HTTP", 50], ["SQL", 40], ["Spring", 20], ["Deploy", 10]);
  else if (devRole.includes("AI")) preset.push(["Python", 55], ["Pandas", 45], ["Sklearn", 25], ["Deploy", 10]);
  else preset.push(["Basics", 30], ["Git", 20], ["Practice", 10]);

  // 저장된 skillProgress가 있으면 그걸 우선 사용
  const final = preset.map(([k, v]) => {
    const saved = learning.skillProgress?.[k];
    return [k, saved == null ? v : saved];
  });

  skillBars.innerHTML = "";
  final.forEach(([name, pct]) => {
    const row = document.createElement("div");
    row.className = "bar";
    row.innerHTML = `
      <div class="bar-top">
        <span>${escapeHtml(name)}</span>
        <span>${clamp(pct, 0, 100)}%</span>
      </div>
      <div class="bar-line"><span style="width:${clamp(pct,0,100)}%"></span></div>
    `;
    skillBars.appendChild(row);
  });
}

/* -----------------------------
   Render: Joined Projects
----------------------------- */
function renderJoinedProjects(user) {
  const userName = user?.name || "Guest";
  const projects = readProjects().map(normalizeProject);

  // 참여 판단: members에 이름이 있거나, leader/createdBy가 본인
  const joined = projects.filter((p) => {
    const inMembers = (p.members || []).some(m => m?.name === userName);
    const isLeader = p.leader === userName || p.createdBy === userName;
    return inMembers || isLeader;
  });

  joinedProjectCount.textContent = `${joined.length}개`;

  joinedProjectsEl.innerHTML = "";
  if (joined.length === 0) {
    joinedEmpty.style.display = "block";
    return;
  }
  joinedEmpty.style.display = "none";

  joined.slice(0, 8).forEach((p) => {
    // 내 역할 추출
    const me = (p.members || []).find(m => m?.name === userName);
    const myRole = me?.role || (p.leader === userName ? "LEAD" : p.myRole) || "-";

    const card = document.createElement("div");
    card.className = "pcard";
    card.innerHTML = `
      <h3 class="pcard-title">${escapeHtml(p.name)}</h3>
      <p class="pcard-desc">${escapeHtml(p.description || "설명이 없습니다.")}</p>

      <div class="badges">
        <span class="badge status">상태: ${escapeHtml(statusLabel(p.status))}</span>
        <span class="badge role">내 역할: ${escapeHtml(roleLabel(myRole))}</span>
        ${p.neededRoles?.length ? `<span class="badge need">필요: ${escapeHtml(p.neededRoles.map(roleLabel).join(", "))}</span>` : ""}
      </div>

      <div class="pcard-foot">
        <div class="meta">팀장: ${escapeHtml(p.leader)} · ${escapeHtml(formatDate(p.createdAt))}</div>
        <div class="pbtns">
          <button class="action-btn" data-action="open" data-id="${escapeHtml(p.id)}">상세</button>
          <button class="action-btn primary" data-action="goto" data-id="${escapeHtml(p.id)}">보드</button>
        </div>
      </div>
    `;

    joinedProjectsEl.appendChild(card);
  });

  // 카드 버튼
  joinedProjectsEl.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      const p = readProjects().map(normalizeProject).find(x => x.id === id);
      if (!p) return;

      if (action === "open") {
        alert(`[${p.name}]\n\n상태: ${statusLabel(p.status)}\n팀장: ${p.leader}\n태그: ${(p.tags||[]).join(", ")}`);
      }
      if (action === "goto") {
        // 팀프로젝트 상세로 이동 (네 라우팅에 맞게 수정)
        location.href = `../HTML/teamproject_detail.html?id=${encodeURIComponent(id)}`;
      }
    });
  });
}

/* -----------------------------
   Render: Timeline
----------------------------- */
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
    const div = document.createElement("div");
    div.className = "titem";
    div.innerHTML = `
      <div class="tdate">${escapeHtml(formatDate(x.at))}</div>
      <div class="ttext">${escapeHtml(x.text)}</div>
    `;
    timelineEl.appendChild(div);
  });
}

/* -----------------------------
   Render: Goals
----------------------------- */
function renderGoals(devRole) {
  let goals = readGoals();

  if (!Array.isArray(goals) || goals.length === 0) {
    goals = generateGoals(devRole);
    writeGoals(goals);
  }

  const doneCount = goals.filter(g => g.done).length;
  weeklyGoalCount.textContent = `${goals.length}개`;

  goalsEl.innerHTML = "";
  goals.forEach((g) => {
    const row = document.createElement("label");
    row.className = "chk";
    row.innerHTML = `
      <div class="chk-left">
        <input type="checkbox" ${g.done ? "checked" : ""} data-id="${escapeHtml(g.id)}"/>
        <div class="chk-text">${escapeHtml(g.text)}</div>
      </div>
      <span class="chk-badge">${escapeHtml(g.type || "목표")}</span>
    `;
    goalsEl.appendChild(row);
  });

  goalsEl.querySelectorAll('input[type="checkbox"][data-id]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-id");
      const next = readGoals().map(g => g.id === id ? { ...g, done: cb.checked } : g);
      writeGoals(next);
      pushActivity(`주간 목표 ${cb.checked ? "완료" : "해제"}: ${next.find(x => x.id === id)?.text || id}`);
      renderAll();
    });
  });

  // 피드백 갱신
  renderFeedback(devRole, goals);
}

/* -----------------------------
   Feedback & Compare
----------------------------- */
function renderFeedback(devRole, goals) {
  const total = goals.length || 1;
  const done = goals.filter(g => g.done).length;
  const pct = Math.round((done / total) * 100);

  const nextStep = getNextRecommendedStep(devRole);

  feedbackEl.innerHTML = `
    <div class="note">
      <p class="note-title">이번 주 달성률</p>
      <p class="note-desc">${pct}% (${done}/${total})</p>
    </div>
    <div class="note">
      <p class="note-title">다음 추천 학습 단계</p>
      <p class="note-desc">${escapeHtml(nextStep)}</p>
    </div>
    <div class="note">
      <p class="note-title">권장 액션</p>
      <p class="note-desc">가장 어려운 목표 1개를 “오늘” 완료 가능한 단위로 쪼개서 실행하세요.</p>
    </div>
  `;
}

function renderCompare(devRole) {
  // 실제 통계는 API/데이터 필요. MVP로는 “샘플 통계”를 역할별로 다르게 보여줌
  let items = [];
  if (devRole.includes("프론트엔드")) {
    items = [
      ["React", 78],
      ["TypeScript", 62],
      ["Next.js", 41],
      ["Tailwind", 39]
    ];
  } else if (devRole.includes("백엔드")) {
    items = [
      ["Spring", 71],
      ["JPA", 55],
      ["Redis", 37],
      ["Docker", 33]
    ];
  } else if (devRole.includes("AI")) {
    items = [
      ["Python", 84],
      ["Pandas", 64],
      ["Sklearn", 48],
      ["FastAPI", 31]
    ];
  } else {
    items = [
      ["Git", 66],
      ["CS", 52],
      ["Mini Projects", 45]
    ];
  }

  compareEl.innerHTML = `
    <div class="note">
      <p class="note-title">같은 직군 TOP 스택</p>
      <p class="note-desc">${items.map(([k,v]) => `${k} ${v}%`).join(" · ")}</p>
    </div>
    <div class="note">
      <p class="note-title">인기 학습 경로</p>
      <p class="note-desc">기초 → 미니프로젝트 → 프레임워크 → 배포/운영 순으로 학습하는 비율이 높습니다.</p>
    </div>
  `;
}

function getNextRecommendedStep(devRole) {
  if (devRole.includes("프론트엔드")) return "JS DOM 이벤트 실습 2개 완료 후 React 진입";
  if (devRole.includes("백엔드")) return "CRUD + 인증 1세트 완성 후 Spring 심화(보안/캐시)로 확장";
  if (devRole.includes("AI")) return "데이터 정제 자동화(파이프라인) → 모델 학습/평가 반복";
  return "기초 다지기 후 미니 프로젝트로 실전 감각 확보";
}

/* -----------------------------
   Ring
----------------------------- */
function setRing(percent) {
  const pct = clamp(percent, 0, 100);
  // conic-gradient 업데이트
  ringEl.style.background = `conic-gradient(
    rgba(59,130,246,0.90) 0deg,
    rgba(168,85,247,0.70) ${Math.round(3.6 * pct)}deg,
    rgba(148,163,184,0.10) ${Math.round(3.6 * pct)}deg
  )`;
}

/* -----------------------------
   Wiring
----------------------------- */
let timelineRangeDays = 7;

function bindEvents() {
  btnResetGoals?.addEventListener("click", () => {
    const quiz = readQuizResult() || {};
    const roleRaw =
      quiz?.developerRole ||
      quiz?.role ||
      quiz?.recommendedRole ||
      quiz?.job ||
      quiz?.devRole ||
      quiz?.resultRole ||
      "";
    const devRole = normalizeDevRole(roleRaw);

    const next = generateGoals(devRole);
    writeGoals(next);
    pushActivity("주간 목표 재생성");
    renderAll();
  });

  btnGoTeamProject?.addEventListener("click", () => {
    location.href = "../HTML/teamproject.html";
  });

  btnContinue?.addEventListener("click", () => {
    alert("로드맵 이어하기: 현재 단계 카드에서 ‘10% 올리기’를 누르거나, 실제 학습 페이지로 연결하세요.");
  });

  btnRetake?.addEventListener("click", () => {
    // 네 프로젝트의 quiz 페이지 경로로 수정
    location.href = "../HTML/quiz.html";
  });

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      timelineRangeDays = Number(t.getAttribute("data-range")) || 7;
      renderTimeline(timelineRangeDays);
    });
  });
}

/* -----------------------------
   Init + Fallback Seed
   - quiz 결과/유저가 없으면 화면이 비지 않도록 샘플 주입(개발 편의)
----------------------------- */
function ensureSeed() {
  const user = readUser();
  if (!user) {
    writeJSON(STORAGE_KEYS.USER, { name: "Team Member", job: "Member", role: "USER" });
  }

  const quiz = readQuizResult();
  if (!quiz) {
    // 최소 샘플(프론트엔드)
    writeJSON(STORAGE_KEYS.QUIZ_RESULT, {
      developerRole: "Frontend",
      preferredLanguages: ["JavaScript", "TypeScript"],
      wantLanguages: ["React", "Next.js"],
      interests: ["웹", "UI/UX"]
    });
  }

  const goals = readGoals();
  if (!Array.isArray(goals) || goals.length === 0) {
    const q = readQuizResult() || {};
    const roleRaw = q.developerRole || q.role || q.recommendedRole || "";
    writeGoals(generateGoals(normalizeDevRole(roleRaw)));
  }
}

/* -----------------------------
   Render All
----------------------------- */
function renderAll() {
  const user = readUser();
  const quiz = readQuizResult() || {};

  const devRole = renderHeader(user, quiz);

  renderRoadmap(devRole);
  renderJoinedProjects(user);
  renderGoals(devRole);
  renderCompare(devRole);
  renderTimeline(timelineRangeDays);
}

/* -----------------------------
   Utils
----------------------------- */
function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/* -----------------------------
   Boot
----------------------------- */
(function init() {
  ensureSeed();
  bindEvents();
  renderAll();
})();
