/* =========================
   Team Project (StackFlow/PROVI)
   - LocalStorage 기반 MVP
========================= */

const STORAGE_KEYS = {
  PROJECTS: "sf_projects",
  USER: "sf_user", // { name, role, ... } 형태 기대
};

/**
 * quiz 결과(직군) 자동 반영:
 * - 실제 quiz.html에서 setItem 하는 키가 확실하면,
 *   아래 배열에 그 키 하나만 남기고 나머지는 지워도 됩니다.
 */
const QUIZ_ROLE_KEYS = [
  "sf_quiz_role",
  "sf_role",
  "quiz_role",
  "recommended_role",
  "recommendedJob",
  "job_result",
  "resultRole",
  "provi_role",
  "provi_recommend_role",
];

const ROLE_OPTIONS = [
  { code: "FE", label: "프론트엔드" },
  { code: "BE", label: "백엔드" },
  { code: "AI", label: "AI/데이터" },
  { code: "PM", label: "PM/기획" },
  { code: "SEC", label: "보안" },
  { code: "MOBILE", label: "모바일" },
  { code: "GAMEDEV", label: "게임" },
  { code: "DESIGN", label: "디자인" },
  { code: "ETC", label: "기타" },
];

const CATEGORY_LABEL = {
  WEB: "웹",
  APP: "앱",
  AI: "AI/데이터",
  GAME: "게임",
  SEC: "보안",
  IOT: "IoT/임베디드",
  BE: "백엔드",
  FE: "프론트/디자인",
  ETC: "기타",
};

const STATUS_LABEL = {
  RECRUITING: "모집중",
  PLANNING: "기획중",
  DEVELOPING: "진행중",
  MAINTAIN: "유지보수",
  DONE: "완료",
};

const el = (id) => document.getElementById(id);

// Elements
const grid = el("grid");
const createBtn = el("createBtn");
const seedBtn = el("seedBtn");
const clearBtn = el("clearBtn");
const countBadge = el("countBadge");
const emptyState = el("emptyState");

const projectSearch = el("projectSearch");
const myProjectsBtn = el("myProjectsBtn");

const categoryBar = el("categoryBar");
const subCategoryBar = el("subCategoryBar");

const modalBackdrop = el("modalBackdrop");
const modalCloseBtn = el("modalCloseBtn");
const cancelBtn = el("cancelBtn");
const saveBtn = el("saveBtn");

const projectName = el("projectName");
const projectDesc = el("projectDesc");
const projectTags = el("projectTags");
const projectCategory = el("projectCategory");
const projectStatus = el("projectStatus");
const projectMyRole = el("projectMyRole");
const neededRolesBox = el("neededRolesBox");

// Admin
const adminMenu = document.getElementById("adminMenu");

// UI State
let filterCategory = "ALL";
let filterSub = "ALL";
let filterMyOnly = false;

/* =========================
   Utils
========================= */
function nowISO() {
  return new Date().toISOString();
}

function uid() {
  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeTags(str) {
  return String(str || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  } catch {
    return "";
  }
}

function roleLabel(code) {
  return ROLE_OPTIONS.find((r) => r.code === code)?.label || code;
}

/**
 * quiz 결과 -> ROLE code로 매핑
 * (한국어/영어/축약 혼용 대비)
 */
function normalizeRoleFromQuiz(raw) {
  const v = String(raw || "").trim().toLowerCase();

  if (!v) return null;

  // direct codes
  const upper = v.toUpperCase();
  if (ROLE_OPTIONS.some((r) => r.code === upper)) return upper;

  // common aliases
  if (v.includes("front") || v.includes("프론트") || v.includes("frontend") || v.includes("ui")) return "FE";
  if (v.includes("back") || v.includes("백") || v.includes("backend") || v.includes("server")) return "BE";
  if (v.includes("ai") || v.includes("data") || v.includes("데이터") || v.includes("ml")) return "AI";
  if (v.includes("pm") || v.includes("기획") || v.includes("product")) return "PM";
  if (v.includes("sec") || v.includes("보안") || v.includes("security")) return "SEC";
  if (v.includes("mobile") || v.includes("ios") || v.includes("android") || v.includes("앱")) return "MOBILE";
  if (v.includes("game") || v.includes("게임")) return "GAMEDEV";
  if (v.includes("design") || v.includes("디자인")) return "DESIGN";

  return null;
}

function getQuizRecommendedRole() {
  // 1) 후보 키 탐색
  for (const k of QUIZ_ROLE_KEYS) {
    const raw = localStorage.getItem(k);
    const mapped = normalizeRoleFromQuiz(raw);
    if (mapped) return mapped;
  }

  // 2) 만약 quiz 결과가 JSON으로 저장되어 있을 수도 있어 추가 탐색
  //    (예: localStorage.sf_quiz_result = {"role":"BE"} 같은 형태)
  const maybeJsonKeys = ["sf_quiz_result", "quiz_result", "result"];
  for (const k of maybeJsonKeys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const candidates = [obj?.role, obj?.job, obj?.recommendedRole, obj?.recommended_job];
      for (const c of candidates) {
        const mapped = normalizeRoleFromQuiz(c);
        if (mapped) return mapped;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/* =========================
   Storage
========================= */
function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

function upsertProject(newProject) {
  const projects = readProjects();
  projects.unshift(newProject);
  writeProjects(projects);
}

function updateProject(id, patch) {
  const projects = readProjects().map((p) => (p.id === id ? { ...p, ...patch } : p));
  writeProjects(projects);
}

function deleteProject(id) {
  const projects = readProjects().filter((p) => p.id !== id);
  writeProjects(projects);
}

function clearProjects() {
  writeProjects([]);
}

/* =========================
   Modal
========================= */
function renderNeededRoleCheckboxes(defaultChecked = ["FE", "BE", "AI"]) {
  if (!neededRolesBox) return;
  neededRolesBox.innerHTML = ROLE_OPTIONS.map((r) => {
    const checked = defaultChecked.includes(r.code) ? "checked" : "";
    return `
      <label class="check">
        <input type="checkbox" value="${r.code}" ${checked} />
        <span>${escapeHtml(r.label)}</span>
      </label>
    `;
  }).join("");
}

function getCheckedNeededRoles() {
  if (!neededRolesBox) return [];
  return Array.from(neededRolesBox.querySelectorAll('input[type="checkbox"]:checked'))
    .map((i) => i.value)
    .filter(Boolean);
}

function openModal() {
  const recommended = getQuizRecommendedRole();
  if (projectMyRole) projectMyRole.value = recommended || "FE";

  // 기본 필요 역할(본인 역할 제외하고 체크되게 하고 싶으면 아래처럼)
  const baseNeeded = ["FE", "BE", "AI", "PM"].filter((r) => r !== (projectMyRole?.value || "FE"));
  renderNeededRoleCheckboxes(baseNeeded.length ? baseNeeded : ["FE", "BE", "AI"]);

  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => projectName?.focus(), 0);
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");

  if (projectName) projectName.value = "";
  if (projectDesc) projectDesc.value = "";
  if (projectTags) projectTags.value = "";
  if (projectCategory) projectCategory.value = "ETC";
  if (projectStatus) projectStatus.value = "RECRUITING";
}

/* =========================
   Seed
========================= */
function seedProjects() {
  const user = readUser();
  const baseName = user?.name || "Team Member";

  const samples = [
    {
      id: uid(),
      name: "PROVI - 개발자 스택 추천 MVP",
      description: "질문 기반으로 사용자의 성향을 분석하고 스택/학습 로드맵 추천",
      tags: ["React", "Spring", "FastAPI", "PostgreSQL"],
      category: "AI",
      status: "DEVELOPING",

      leader: baseName,
      leaderRole: "PM",
      neededRoles: ["FE", "BE", "AI"],
      members: [{ name: baseName, role: "PM" }],

      createdAt: nowISO(),
      createdBy: baseName,
    },
    {
      id: uid(),
      name: "팀 매칭/프로젝트 보드",
      description: "팀 프로젝트 생성/모집/참여 기능 + 필터/검색",
      tags: ["HTML", "CSS", "JS"],
      category: "WEB",
      status: "RECRUITING",

      leader: baseName,
      leaderRole: "FE",
      neededRoles: ["BE", "PM"],
      members: [{ name: baseName, role: "FE" }],

      createdAt: nowISO(),
      createdBy: baseName,
    },
  ];

  const projects = readProjects();
  writeProjects([...samples, ...projects]);
}

/* =========================
   Normalize (기존 데이터 호환)
========================= */
function normalizeProject(p) {
  const leader = p.leader || p.createdBy || "Unknown";
  const members = Array.isArray(p.members) ? p.members : [];
  const neededRoles = Array.isArray(p.neededRoles) ? p.neededRoles : (Array.isArray(p.needRoles) ? p.needRoles : []);

  return {
    ...p,
    category: p.category || "ETC",
    status: p.status || "RECRUITING",
    leader,
    leaderRole: p.leaderRole || (members.find((m) => m.name === leader)?.role) || "PM",
    members,
    neededRoles: neededRoles.length ? neededRoles : ["FE", "BE", "AI"],
  };
}

/* =========================
   Filters UI handlers
========================= */
function setActiveButton(container, selector, matchFn) {
  if (!container) return;
  const btns = Array.from(container.querySelectorAll(selector));
  btns.forEach((b) => b.classList.toggle("active", matchFn(b)));
}

function bindCategoryBars() {
  categoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    filterCategory = btn.dataset.cat || "ALL";
    setActiveButton(categoryBar, "button[data-cat]", (b) => b.dataset.cat === filterCategory);
    render();
  });

  subCategoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sub]");
    if (!btn) return;
    filterSub = btn.dataset.sub || "ALL";
    setActiveButton(subCategoryBar, "button[data-sub]", (b) => b.dataset.sub === filterSub);
    render();
  });

  myProjectsBtn?.addEventListener("click", () => {
    filterMyOnly = !filterMyOnly;
    myProjectsBtn.setAttribute("aria-pressed", String(filterMyOnly));
    myProjectsBtn.textContent = filterMyOnly
      ? "전체 팀 프로젝트 보기"
      : "내가 참여한 팀 프로젝트 보기";
    render();
  });
}

/* =========================
   Render
========================= */
function matchesFilters(p, userName) {
  if (filterCategory !== "ALL" && p.category !== filterCategory) return false;
  if (filterSub !== "ALL" && p.status !== filterSub) return false;

  if (filterMyOnly) {
    const joined = (p.members || []).some((m) => m?.name === userName);
    if (!joined) return false;
  }
  return true;
}

function render() {
  const user = readUser();
  const userName = user?.name || "Guest";

  const q = (projectSearch?.value || "").trim().toLowerCase();

  const projects = readProjects().map(normalizeProject);

  const filtered = projects
    .filter((p) => matchesFilters(p, userName))
    .filter((p) => {
      if (!q) return true;

      const hay = [
        p.name,
        p.description,
        ...(p.tags || []),
        STATUS_LABEL[p.status] || p.status,
        CATEGORY_LABEL[p.category] || p.category,
        p.leader,
        roleLabel(p.leaderRole),
        (p.neededRoles || []).map(roleLabel).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });

  grid.innerHTML = "";

  countBadge.textContent = `${filtered.length} project${filtered.length === 1 ? "" : "s"}`;
  emptyState.style.display = filtered.length === 0 ? "block" : "none";

  filtered.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";

    const tagsHtml = (p.tags || [])
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    const isLeader = p.leader === userName;
    const myMember = (p.members || []).find((m) => m.name === userName);
    const myRoleText = myMember ? roleLabel(myMember.role) : "-";
    const neededText = (p.neededRoles || []).length ? (p.neededRoles || []).map(roleLabel).join(", ") : "-";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-title">${escapeHtml(p.name)}</div>
          <div class="card-desc">${escapeHtml(p.description || "설명이 없습니다.")}</div>
        </div>
      </div>

      <div class="badges">
        <span class="badge status">상태: ${escapeHtml(STATUS_LABEL[p.status] || p.status)}</span>
        <span class="badge role">내 역할: ${escapeHtml(myRoleText)}</span>
        <span class="badge need">필요 역할: ${escapeHtml(neededText)}</span>
        ${isLeader ? `<span class="badge auth">권한: 팀장</span>` : ""}
      </div>

      <div class="tags">
        <span class="tag">카테고리: ${escapeHtml(CATEGORY_LABEL[p.category] || p.category)}</span>
        ${tagsHtml}
      </div>

      <div class="card-footer">
        <div class="meta">
          팀장: ${escapeHtml(p.leader)} · ${escapeHtml(formatDate(p.createdAt))}
        </div>
        <div class="card-actions">
          <button class="action-btn" data-action="open" data-id="${p.id}" type="button">열기</button>
          <button class="action-btn primary join" data-action="join" data-id="${p.id}" type="button">참여하기</button>
          <button class="action-btn danger" data-action="delete" data-id="${p.id}" type="button">삭제</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================
   Join logic
========================= */
function joinProject(id) {
  const user = readUser();
  const userName = user?.name || "Guest";

  const projects = readProjects().map(normalizeProject);
  const p = projects.find((x) => x.id === id);
  if (!p) return;

  const already = (p.members || []).some((m) => m.name === userName);
  if (already) {
    alert("이미 참여한 프로젝트입니다.");
    return;
  }

  const needed = Array.isArray(p.neededRoles) ? p.neededRoles : [];
  if (needed.length === 0) {
    alert("현재 모집 중인 역할이 없습니다.");
    return;
  }

  let pickedRole = needed[0];

  if (needed.length > 1) {
    const answer = prompt(
      `참여할 역할을 선택하세요:\n` +
      needed.map((r) => `- ${roleLabel(r)} (${r})`).join("\n") +
      `\n\n예: ${needed[0]}`
    );
    if (!answer) return;

    const normalized = String(answer).trim().toUpperCase();
    if (!needed.includes(normalized)) {
      alert("선택한 역할이 '필요 역할' 목록에 없습니다.");
      return;
    }
    pickedRole = normalized;
  }

  const nextMembers = [...(p.members || []), { name: userName, role: pickedRole }];
  const nextNeeded = (p.neededRoles || []).filter((r) => r !== pickedRole);

  updateProject(id, { members: nextMembers, neededRoles: nextNeeded });
  alert(`참여 완료: ${p.name}\n역할: ${roleLabel(pickedRole)}`);
  render();
}

/* =========================
   Events
========================= */
createBtn?.addEventListener("click", openModal);

modalCloseBtn?.addEventListener("click", closeModal);
cancelBtn?.addEventListener("click", closeModal);

modalBackdrop?.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("open")) closeModal();
});

saveBtn?.addEventListener("click", () => {
  const name = projectName.value.trim();
  const desc = projectDesc.value.trim();
  const tags = normalizeTags(projectTags.value);
  const status = projectStatus.value;
  const category = projectCategory.value;
  const myRole = projectMyRole.value;

  const neededRoles = getCheckedNeededRoles()
    .filter((r) => r !== myRole); // 팀장 역할은 이미 본인이 가져가므로 제외(원하면 제거)

  if (!name) {
    alert("프로젝트 이름을 입력해줘!");
    projectName.focus();
    return;
  }

  const user = readUser();
  const leaderName = user?.name || "Unknown";

  // 생성자=팀장, 단 팀장도 역할 선택
  const project = {
    id: uid(),
    name,
    description: desc,
    tags,
    category,
    status,

    leader: leaderName,
    leaderRole: myRole,

    neededRoles,
    members: [{ name: leaderName, role: myRole }],

    createdAt: nowISO(),
    createdBy: leaderName,
  };

  upsertProject(project);
  closeModal();
  render();
});

seedBtn?.addEventListener("click", () => {
  seedProjects();
  render();
});

clearBtn?.addEventListener("click", () => {
  const ok = confirm("정말 전체 프로젝트를 삭제할까?");
  if (!ok) return;
  clearProjects();
  render();
});

projectSearch?.addEventListener("input", render);

// 카드 버튼 이벤트 위임
grid?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "delete") {
    const ok = confirm("이 프로젝트를 삭제할까?");
    if (!ok) return;
    deleteProject(id);
    render();
    return;
  }

  if (action === "open") {
    const p = readProjects().map(normalizeProject).find((x) => x.id === id);
    if (!p) return;

    const userName = (readUser()?.name) || "Guest";
    const myMember = (p.members || []).find((m) => m.name === userName);

    alert(
      `[${p.name}]\n\n` +
      `카테고리: ${CATEGORY_LABEL[p.category] || p.category}\n` +
      `상태: ${STATUS_LABEL[p.status] || p.status}\n` +
      `팀장: ${p.leader} (${roleLabel(p.leaderRole)})\n` +
      `내 역할: ${myMember ? roleLabel(myMember.role) : "-"}\n` +
      `필요 역할: ${(p.neededRoles || []).map(roleLabel).join(", ") || "-"}\n` +
      `태그: ${(p.tags || []).join(", ")}`
    );
    return;
  }

  if (action === "join") {
    joinProject(id);
    return;
  }
});

/* =========================
   Init
========================= */
(function init() {
  // 관리자 메뉴 노출
  const user = readUser();
  if (adminMenu) {
    const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
    adminMenu.style.display = isAdmin ? "block" : "none";
  }

  bindCategoryBars();
  renderNeededRoleCheckboxes(); // 최초 1회
  render();
})();
