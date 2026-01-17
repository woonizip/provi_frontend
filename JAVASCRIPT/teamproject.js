const STORAGE_KEYS = {
  PROJECTS: "sf_projects",
};

const $ = (id) => document.getElementById(id);

// Elements
const grid = $("grid");
const createBtn = $("createBtn");
const myProjectsBtn = $("myProjectsBtn");
const seedBtn = $("seedBtn");
const clearBtn = $("clearBtn");
const countBadge = $("countBadge");
const emptyState = $("emptyState");

const projectSearch = $("projectSearch");

const categoryBar = $("categoryBar");
const subCategoryBar = $("subCategoryBar");

const modalBackdrop = $("modalBackdrop");
const modalCloseBtn = $("modalCloseBtn");
const cancelBtn = $("cancelBtn");
const createProjectBtn = $("createProjectBtn");

const projectName = $("projectName");
const projectDesc = $("projectDesc");
const projectTags = $("projectTags");
const projectCategory = $("projectCategory");
const projectSubStatus = $("projectSubStatus");
const myRole = $("myRole");
const neededRolesWrap = $("neededRolesWrap");

const adminMenu = $("adminMenu");

let activeCategory = "ALL";
let activeSubStatus = "ALL";
let onlyMyProjects = false;

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

/* =========================
  Labels
========================= */
function categoryLabel(v) {
  switch (v) {
    case "WEB": return "웹";
    case "APP": return "앱";
    case "AI_DATA": return "AI/데이터";
    case "GAME": return "게임";
    case "SEC": return "보안";
    case "IOT": return "IoT/임베디드";
    case "BACKEND": return "백엔드";
    case "FRONTEND": return "프론트/디자인";
    case "ETC": return "기타";
    default: return v;
  }
}
function subStatusLabel(v) {
  switch (v) {
    case "RECRUITING": return "모집중";
    case "IN_PROGRESS": return "진행중";
    case "PLANNING": return "기획중";
    case "MAINTAIN": return "유지보수";
    case "DONE": return "완료";
    default: return v;
  }
}
function roleLabel(v) {
  switch (v) {
    case "FE": return "프론트엔드";
    case "BE": return "백엔드";
    case "AI": return "AI/데이터";
    case "PM": return "기획/PM";
    case "SEC": return "보안";
    case "IOT": return "IoT";
    case "GAME": return "게임";
    case "DESIGN": return "디자인";
    default: return v;
  }
}
function roleListLabel(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return arr.map(roleLabel).join(", ");
}

/* =========================
  Auth (SESSION STORAGE 기반)
========================= */
function readSessionUser() {
  // 로그인 안 된 상태면 null
  const id = sessionStorage.getItem("loggedInUser");
  if (!id) return null;

  const nickname = sessionStorage.getItem("nickname") || "";
  const job = sessionStorage.getItem("job") || "Developer";
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  return {
    id,
    nickname,
    name: nickname, // 기존 코드 호환용 alias
    job,
    isAdmin,
  };
}

function getUserKey(user) {
  // 고유키는 id만 사용
  return user?.id ? String(user.id).trim() : null;
}

function getUserDisplayName(user) {
  // 표시명은 nickname만 사용
  const n = user?.nickname || user?.name;
  const s = n ? String(n).trim() : "";
  return s || "";
}

/* =========================
  Storage
========================= */
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
function addProject(p) {
  const projects = readProjects();
  projects.unshift(p);
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

/* =========================
  Normalize Project
========================= */
function normalizeProject(p) {
  const members = Array.isArray(p.members) ? p.members : [];

  const leaderFromMembers = members.find((m) => m?.isLeader)?.userName;

  return {
    id: p.id,
    title: p.title ?? p.name ?? "Untitled",
    content: p.content ?? p.description ?? "",
    category: p.category ?? "ETC",
    subStatus: p.subStatus ?? "IN_PROGRESS",
    tags: Array.isArray(p.tags) ? p.tags : [],
    neededRoles: Array.isArray(p.neededRoles) ? p.neededRoles : [],
    members,
    createdAt: p.createdAt ?? nowISO(),

    // 신규 권장 필드
    createdBy: p.createdBy ?? p.createdById ?? "", // 생성자 id
    leaderName: p.leaderName ?? p.leader ?? leaderFromMembers ?? "Unknown", // 팀장 닉네임
  };
}

/* =========================
  Owner / Member checks (id로만 판정)
========================= */
function isOwner(p, user) {
  if (!p || !user) return false;
  const userKey = getUserKey(user);
  if (!userKey) return false;
  return String(p.createdBy || "").trim() === userKey;
}
function isMember(p, user) {
  if (!p || !user) return false;
  const userKey = getUserKey(user);
  if (!userKey) return false;
  return (p.members || []).some((m) => String(m.userId || "").trim() === userKey);
}

/* =========================
  Modal
========================= */
function openModal() {
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => projectName.focus(), 0);

  const user = readSessionUser();
  const job = (user?.job || "").toLowerCase();

  if (job.includes("front")) myRole.value = "FE";
  else if (job.includes("back")) myRole.value = "BE";
  else if (job.includes("ai") || job.includes("data")) myRole.value = "AI";
  else if (job.includes("pm") || job.includes("plan")) myRole.value = "PM";
}
function closeModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");

  projectName.value = "";
  projectDesc.value = "";
  projectTags.value = "";
  projectCategory.value = "WEB";
  projectSubStatus.value = "IN_PROGRESS";
  myRole.value = "FE";

  [...neededRolesWrap.querySelectorAll("input[type='checkbox']")].forEach((cb) => {
    cb.checked = ["FE", "BE", "AI"].includes(cb.value);
  });
}

/* =========================
  Filter UI
========================= */
function setActiveButton(container, selector, activeValue, datasetKey) {
  container?.querySelectorAll(selector).forEach((btn) => {
    const v = btn.dataset[datasetKey];
    btn.classList.toggle("active", v === activeValue);
  });
}
function bindCategoryEvents() {
  categoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    setActiveButton(categoryBar, ".cat-btn", activeCategory, "cat");
    render();
  });

  subCategoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sub]");
    if (!btn) return;
    activeSubStatus = btn.dataset.sub;
    setActiveButton(subCategoryBar, ".subcat-btn", activeSubStatus, "sub");
    render();
  });
}

/* =========================
  Seed (현재 로그인 유저로 생성)
========================= */
function seedProjects() {
  const user = readSessionUser();
  const createdBy = getUserKey(user);
  const leaderName = getUserDisplayName(user);

  if (!createdBy || !leaderName) {
    alert("Seed 불가: 로그인 후 이용하세요.");
    return;
  }

  const samples = [
    {
      id: uid(),
      title: "PROVI - 개발자 스택 추천 MVP",
      content: "질문 기반으로 사용자의 성향을 분석하고 스택/학습 로드맵 추천",
      category: "AI_DATA",
      subStatus: "IN_PROGRESS",
      tags: ["React", "Spring", "FastAPI", "PostgreSQL"],
      leaderName,
      members: [{ userId: createdBy, userName: leaderName, role: "FE", isLeader: true, joinedAt: nowISO() }],
      neededRoles: ["FE", "BE", "AI"],
      createdAt: nowISO(),
      createdBy,
    },
    {
      id: uid(),
      title: "팀 매칭/프로젝트 보드",
      content: "팀 프로젝트 생성/모집/참여 기능 + 필터/검색",
      category: "WEB",
      subStatus: "RECRUITING",
      tags: ["HTML", "CSS", "JS"],
      leaderName,
      members: [{ userId: createdBy, userName: leaderName, role: "PM", isLeader: true, joinedAt: nowISO() }],
      neededRoles: ["BE", "PM"],
      createdAt: nowISO(),
      createdBy,
    },
  ];

  const projects = readProjects();
  writeProjects([...samples, ...projects]);
}

/* =========================
  Render
========================= */
function render() {
  const user = readSessionUser();
  const q = (projectSearch?.value || "").trim().toLowerCase();

  let projects = readProjects().map(normalizeProject);

  // 내 참여 프로젝트만 보기 (생성자 포함)
  if (onlyMyProjects && user) {
    projects = projects.filter((p) => isOwner(p, user) || isMember(p, user));
  }

  // 카테고리 필터
  if (activeCategory !== "ALL") {
    projects = projects.filter((p) => p.category === activeCategory);
  }

  // 서브상태 필터
  if (activeSubStatus !== "ALL") {
    projects = projects.filter((p) => p.subStatus === activeSubStatus);
  }

  // 검색
  if (q) {
    projects = projects.filter((p) => {
      const hay = [
        p.title,
        p.content,
        categoryLabel(p.category),
        subStatusLabel(p.subStatus),
        roleListLabel(p.neededRoles),
        p.leaderName,
        ...(p.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  // render
  grid.innerHTML = "";
  countBadge.textContent = `${projects.length} projects`;
  emptyState.style.display = projects.length === 0 ? "block" : "none";

  projects.forEach((p) => {
    const tagsHtml = (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    const owner = isOwner(p, user);
    const member = isMember(p, user);

    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="card-title">${escapeHtml(p.title)}</div>
      <div class="card-desc">${escapeHtml(p.content || "설명이 없습니다.")}</div>

      <div class="badges">
        <span class="badge status">상태: ${escapeHtml(subStatusLabel(p.subStatus))}</span>
        <span class="badge need">필요 역할: ${escapeHtml(roleListLabel(p.neededRoles))}</span>
        <span class="badge role">카테고리: ${escapeHtml(categoryLabel(p.category))}</span>
        ${owner ? `<span class="badge auth">권한: 팀장</span>` : ""}
        ${member && !owner ? `<span class="badge auth">참여중</span>` : ""}
      </div>

      <div class="tags">${tagsHtml}</div>

      <div class="card-footer">
        <div class="meta">팀장: ${escapeHtml(p.leaderName)} · ${escapeHtml(formatDate(p.createdAt))}</div>

        <div class="card-actions">
          <button class="action-btn" data-action="open" data-id="${p.id}">열기</button>
          ${(!owner && !member) ? `<button class="action-btn join" data-action="join" data-id="${p.id}">참여하기</button>` : ""}
          ${owner ? `<button class="action-btn danger" data-action="delete" data-id="${p.id}">삭제</button>` : ""}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================
  Events
========================= */
createBtn?.addEventListener("click", () => {
  const user = readSessionUser();
  if (!user) {
    alert("로그인 후 이용하세요.");
    return;
  }
  openModal();
});

myProjectsBtn?.addEventListener("click", () => {
  onlyMyProjects = !onlyMyProjects;
  myProjectsBtn.textContent = onlyMyProjects ? "전체 프로젝트 보기" : "내가 참여한 팀 프로젝트 보기";
  render();
});

modalCloseBtn?.addEventListener("click", closeModal);
cancelBtn?.addEventListener("click", closeModal);

modalBackdrop?.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("open")) closeModal();
});

createProjectBtn?.addEventListener("click", () => {
  const title = projectName.value.trim();
  const content = projectDesc.value.trim();
  const tags = normalizeTags(projectTags.value);

  if (!title) {
    alert("프로젝트 이름을 입력해주세요!");
    projectName.focus();
    return;
  }

  const user = readSessionUser();
  const createdBy = getUserKey(user);
  const leaderName = getUserDisplayName(user);

  if (!createdBy || !leaderName) {
    alert("프로젝트 생성 불가: 로그인 정보가 부족합니다.");
    return;
  }

  const category = projectCategory.value;
  const subStatus = projectSubStatus.value;
  const selectedMyRole = myRole.value;

  const neededRoles = [...neededRolesWrap.querySelectorAll("input[type='checkbox']:checked")]
    .map((cb) => cb.value)
    .filter(Boolean);

  if (neededRoles.length === 0) {
    alert("필요 역할을 최소 1개 이상 선택해주세요!");
    return;
  }

  const project = {
    id: uid(),
    title,
    content,
    category,
    subStatus,
    tags,
    leaderName,      // 팀장 닉네임(표시용)
    neededRoles,
    members: [
      {
        userId: createdBy,    // 생성자 id(고유키)
        userName: leaderName, // 생성자 닉네임(표시용)
        role: selectedMyRole,
        isLeader: true,
        joinedAt: nowISO(),
      },
    ],
    createdAt: nowISO(),
    createdBy, // 생성자 id(고유키)
  };

  addProject(project);
  closeModal();
  render();
});

seedBtn?.addEventListener("click", () => {
  seedProjects();
  render();
});

clearBtn?.addEventListener("click", () => {
  const ok = confirm("정말 전체 프로젝트를 삭제할까요?");
  if (!ok) return;
  writeProjects([]);
  render();
});

projectSearch?.addEventListener("input", render);

grid?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  const user = readSessionUser();
  const projects = readProjects().map(normalizeProject);
  const p = projects.find((x) => x.id === id);
  if (!p) return;

  if (action === "delete") {
    if (!user || !isOwner(p, user)) {
      alert("삭제 권한이 없습니다. (프로젝트 생성자만 삭제 가능)");
      return;
    }
    const ok = confirm("이 프로젝트를 삭제할까요?");
    if (!ok) return;
    deleteProject(id);
    render();
    return;
  }

  if (action === "open") {
    alert(
      `[${p.title}]\n\n카테고리: ${categoryLabel(p.category)}\n상태: ${subStatusLabel(p.subStatus)}\n필요 역할: ${roleListLabel(p.neededRoles)}\n태그: ${(p.tags || []).join(", ")}`
    );
    return;
  }

  if (action === "join") {
    if (!user) {
      alert("로그인 후 참여할 수 있습니다.");
      return;
    }

    if (isOwner(p, user)) {
      alert("프로젝트 생성자는 자동 참여 상태입니다.");
      return;
    }

    if (isMember(p, user)) {
      alert("이미 참여한 프로젝트입니다.");
      return;
    }

    // 참여 역할 선택(neededRoles 우선)
    let pickedRole = p.neededRoles?.[0] || "FE";

    if (Array.isArray(p.neededRoles) && p.neededRoles.length > 1) {
      const answer = prompt(
        `참여할 역할 코드를 입력하세요:\n${p.neededRoles.map((r) => `- ${roleLabel(r)} (${r})`).join("\n")}\n\n예: FE`
      );
      if (answer) pickedRole = answer.trim().toUpperCase();
    }

    const userId = getUserKey(user);
    const userName = getUserDisplayName(user);

    if (!userId || !userName) {
      alert("참여 불가: 로그인 정보가 부족합니다.");
      return;
    }

    const nextMembers = [
      ...(p.members || []),
      {
        userId,
        userName,
        role: pickedRole,
        isLeader: false,
        joinedAt: nowISO(),
      },
    ];

    const nextNeeded = (p.neededRoles || []).filter((r) => r !== pickedRole);

    updateProject(id, { members: nextMembers, neededRoles: nextNeeded });
    alert(`참여 완료: ${p.title}\n역할: ${roleLabel(pickedRole)}`);
    render();
  }
});

/* =========================
  Init
========================= */
(function init() {
  const user = readSessionUser();

  if (adminMenu) {
    const isAdmin = user?.isAdmin === true || sessionStorage.getItem("isAdmin") === "true";
    adminMenu.style.display = isAdmin ? "block" : "none";
  }

  bindCategoryEvents();
  render();
})();