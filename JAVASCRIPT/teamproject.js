const $ = (id) => document.getElementById(id);

const API = {
  LIST: "/api/list",
  CREATE: "/api/teamproject",
  JOIN: "/api/teamproject/join",
  LEAVE: "/api/teamproject/leave",
  DELETE: (projectId) => `/api/teamproject/${projectId}`,
};

const grid = $("grid");
const pagination = $("pagination");
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
const projectCategory = $("projectCategory");
const projectUserLimit = $("projectUserLimit");
const projectName = $("projectName");
const projectDesc = $("projectDesc");
const myRole = $("myRole");
const neededRolesWrap = $("neededRolesWrap");
const projectTagsInput = $("projectTagsInput");
const tagSuggestList = $("tagSuggestList");
const tagChipList = $("tagChipList");
const adminMenu = $("adminMenu");

const detailBackdrop = $("detailBackdrop");
const detailCloseBtn = $("detailCloseBtn");
const detailCancelBtn = $("detailCancelBtn");
const detailJoinBtn = $("detailJoinBtn");
const detailLeaveBtn = $("detailLeaveBtn");

const detailModalSub = $("detailModalSub");
const detailCategoryBadge = $("detailCategoryBadge");
const detailStatusBadge = $("detailStatusBadge");
const detailSampleBadge = $("detailSampleBadge");
const detailProjectTitle = $("detailProjectTitle");
const detailProjectDesc = $("detailProjectDesc");
const detailLeaderName = $("detailLeaderName");
const detailCreatedAt = $("detailCreatedAt");
const detailMemberCount = $("detailMemberCount");
const detailUserLimit = $("detailUserLimit");
const detailTagList = $("detailTagList");
const detailRoleStatusList = $("detailRoleStatusList");
const detailMemberList = $("detailMemberList");
const detailMyState = $("detailMyState");
const detailMyRole = $("detailMyRole");
const detailRemainRoleCount = $("detailRemainRoleCount");
const detailJoinSection = $("detailJoinSection");
const detailJoinRoleList = $("detailJoinRoleList");

let activeCategory = "ALL";
let activeSubStatus = "ALL";
let onlyMyProjects = false;
let projectsCache = [];
let tagItems = [];
let currentDetailProjectId = null;
let currentDetailMode = "view";

let currentPage = getPageFromUrl();
const pageSize = 6;
let totalPages = 1;

const SAMPLE_KEY_PREFIX = "tp_samples_";

const TAG_OPTIONS = [
  "Java", "JavaScript", "JSON", "TypeScript", "Python", "C", "C++", "C#", "Go", "Rust",
  "Kotlin", "Swift", "React", "Next.js", "Vue", "Spring", "Spring Boot", "FastAPI",
  "Node.js", "Express", "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "Docker", "Kubernetes", "JPA", "JWT", "Jenkins", "JUnit", "Kafka",
  "TensorFlow", "PyTorch", "Pandas", "NumPy"
];

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
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  } catch {
    return "";
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function getSelectedText(selectEl) {
  if (!selectEl) return "";
  const opt = selectEl.options?.[selectEl.selectedIndex];
  return (opt?.textContent || "").trim();
}

function getNickname() {
  return (sessionStorage.getItem("nickname") || "").trim();
}

function requireLoginOrRedirect() {
  const nickname = getNickname();
  if (!nickname) {
    alert("로그인 후 이용할 수 있는 서비스입니다.");
    window.location.href = "../HTML/signin.html";
    return false;
  }
  return true;
}

function getPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("page"));
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

function setPageToUrl(pageNumber) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(pageNumber));
  window.history.replaceState({}, "", url);
}

function normalizeCategoryCode(value) {
  switch (String(value || "").trim()) {
    case "WEB":
    case "웹":
      return "WEB";
    case "AI_DATA":
    case "AI/데이터":
      return "AI_DATA";
    case "GAME":
    case "게임":
      return "GAME";
    case "SEC":
    case "보안":
      return "SEC";
    default:
      return String(value || "").trim();
  }
}

function categoryLabel(v) {
  switch (normalizeCategoryCode(v)) {
    case "WEB": return "웹";
    case "AI_DATA": return "AI/데이터";
    case "GAME": return "게임";
    case "SEC": return "보안";
    default: return v;
  }
}

function normalizeSubStatusCode(value) {
  switch (String(value || "").trim()) {
    case "RECRUITING":
    case "모집중":
      return "RECRUITING";
    case "IN_PROGRESS":
    case "진행중":
      return "IN_PROGRESS";
    case "DONE":
    case "완료":
      return "DONE";
    default:
      return String(value || "").trim();
  }
}

function subStatusLabel(v) {
  switch (normalizeSubStatusCode(v)) {
    case "RECRUITING": return "모집중";
    case "IN_PROGRESS": return "진행중";
    case "DONE": return "완료";
    default: return v;
  }
}

function roleListLabel(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return arr
    .map((x) => String(x?.label ?? x?.name ?? x).trim())
    .filter(Boolean)
    .join(", ");
}

async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  let data = null;
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function sampleKey() {
  const nickname = getNickname();
  return SAMPLE_KEY_PREFIX + (nickname || "__guest__");
}

function readUserSamples() {
  try {
    const raw = localStorage.getItem(sampleKey());
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUserSamples(arr) {
  localStorage.setItem(sampleKey(), JSON.stringify(arr));
}

function clearUserSamples() {
  localStorage.removeItem(sampleKey());
}

function deleteOneSample(sampleId) {
  const next = readUserSamples().filter((s) => String(s.id) !== String(sampleId));
  writeUserSamples(next);
}

function updateOneSample(sampleId, updater) {
  const next = readUserSamples().map((item) => {
    if (String(item.id) !== String(sampleId)) return item;
    return updater({ ...item });
  });
  writeUserSamples(next);
}

function ensureTwoSamplesAdded() {
  const nickname = getNickname();
  if (!nickname) return;

  const existing = readUserSamples();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const samples = [
    {
      id: "sample_" + uid(),
      title: "샘플) 팀 매칭/프로젝트 보드",
      content: "프로젝트 생성/참여/필터/검색이 있는 보드형 서비스",
      category: "WEB",
      subStatus: "IN_PROGRESS",
      tags: ["HTML", "CSS", "JavaScript"],
      recruitments: [
        { role: "프론트", count: 2 },
        { role: "백엔드", count: 1 },
        { role: "테스트/품질", count: 1 },
      ],
      leaderName: nickname,
      members: [{ userName: nickname, isLeader: true, role: "프론트" }],
      createdAt: now,
      userLimit: 5,
      isSample: true,
    },
    {
      id: "sample_" + uid(),
      title: "샘플) AI 추천 스택/로드맵",
      content: "질문 기반 성향 분석 → 스택/학습 로드맵 추천 MVP",
      category: "AI_DATA",
      subStatus: "RECRUITING",
      tags: ["React", "Spring", "FastAPI", "PostgreSQL"],
      recruitments: [
        { role: "백엔드", count: 1 },
        { role: "DB/데이터", count: 1 },
        { role: "AI/추천", count: 1 },
      ],
      leaderName: nickname,
      members: [{ userName: nickname, isLeader: true, role: "기획/PM" }],
      createdAt: now,
      userLimit: 4,
      isSample: true,
    },
  ];

  writeUserSamples(samples);
}

function getRecruitmentsFromForm() {
  if (!neededRolesWrap) return [];

  const inputs = [...neededRolesWrap.querySelectorAll(".recruit-count-input")];

  return inputs
    .map((input) => {
      const role = String(input.dataset.role || "").trim();
      const count = Number(input.value || 0);

      if (!role || count <= 0) return null;

      return {
        role,
        count,
      };
    })
    .filter(Boolean);
}

function normalizeRecruitments(project) {
  const recruitmentsRaw = Array.isArray(project.recruitments)
    ? project.recruitments
    : Array.isArray(project.recruitmentList)
    ? project.recruitmentList
    : Array.isArray(project.neededRoles)
    ? project.neededRoles
    : [];

  return recruitmentsRaw
    .map((item) => {
      if (typeof item === "string") {
        return {
          role: item.trim(),
          count: 1,
        };
      }

      return {
        role: String(item?.role ?? item?.name ?? "").trim(),
        count: Number(item?.count ?? item?.recruitCount ?? item?.userCount ?? 1),
      };
    })
    .filter((item) => item.role);
}

function normalizeProject(p) {
  const membersRaw = Array.isArray(p.members)
    ? p.members
    : Array.isArray(p.memberList)
    ? p.memberList
    : [];

  const recruitments = normalizeRecruitments(p);

  const members = (membersRaw || []).map((m) => ({
    userName: String(m.userName ?? m.nickname ?? m.name ?? "").trim(),
    isLeader: !!m.isLeader,
    role: String(m.role ?? m.roleLabel ?? "").trim(),
  }));

  const leaderName =
    String(
      p.leaderName ??
      p.leader ??
      p.createdByNickname ??
      p.ownerNickname ??
      p.createdBy ??
      ""
    ).trim() ||
    String(members.find((m) => m.isLeader)?.userName || "").trim() ||
    "Unknown";

  return {
    id: p.id ?? p.projectId,
    title: p.title ?? p.name ?? "Untitled",
    content: p.content ?? p.description ?? "",
    category: normalizeCategoryCode(p.category ?? "WEB"),
    subStatus: normalizeSubStatusCode(p.subStatus ?? "IN_PROGRESS"),
    tags: Array.isArray(p.tags) ? p.tags : [],
    recruitments,
    neededRoles: recruitments.map((r) => r.role),
    members,
    createdAt: p.createdAt ?? p.createdDate ?? "",
    leaderName,
    userLimit: p.userLimit ?? p.maxMember ?? null,
    isSample: !!p.isSample,
  };
}

function isOwner(p, nickname) {
  return !!nickname && String(p.leaderName || "").trim() === nickname;
}

function isMember(p, nickname) {
  if (!nickname) return false;
  return (p.members || []).some((m) => String(m.userName || "").trim() === nickname);
}

function getMyMemberInfo(project, nickname) {
  return (project.members || []).find((m) => String(m.userName || "").trim() === nickname) || null;
}

function getFilledRoleCountMap(project) {
  const map = new Map();
  (project.members || []).forEach((member) => {
    const role = String(member.role || "").trim();
    if (!role) return;
    map.set(role, (map.get(role) || 0) + 1);
  });
  return map;
}

function getOpenRecruitments(project) {
  const filledMap = getFilledRoleCountMap(project);

  return (project.recruitments || [])
    .map((item) => {
      const filled = filledMap.get(item.role) || 0;
      const remain = Math.max(0, item.count - filled);
      return {
        role: item.role,
        count: item.count,
        filled,
        remain,
      };
    })
    .filter((item) => item.remain > 0);
}

function isProjectFull(project) {
  if (!project.userLimit) return false;
  return (project.members || []).length >= Number(project.userLimit);
}

function renderTagChips() {
  tagChipList.innerHTML = tagItems.map((tag, idx) => `
    <button type="button" class="tag-chip" data-tag-index="${idx}">
      ${escapeHtml(tag)} <span aria-hidden="true">x</span>
    </button>
  `).join("");
}

function showTagSuggestions(keyword) {
  const q = String(keyword || "").trim().toLowerCase();

  if (!q) {
    tagSuggestList.innerHTML = "";
    tagSuggestList.classList.remove("open");
    return;
  }

  const filtered = TAG_OPTIONS.filter(
    (tag) => tag.toLowerCase().includes(q) && !tagItems.includes(tag)
  ).slice(0, 8);

  if (filtered.length === 0) {
    tagSuggestList.innerHTML = "";
    tagSuggestList.classList.remove("open");
    return;
  }

  tagSuggestList.innerHTML = filtered
    .map(
      (tag) => `
        <button type="button" class="tag-suggest-item" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `
    )
    .join("");

  tagSuggestList.classList.add("open");
}

function addTag(tag) {
  const value = String(tag || "").trim();
  if (!value || tagItems.includes(value) || tagItems.length >= 8) return;
  tagItems.push(value);
  renderTagChips();
}

function resetTags() {
  tagItems = [];
  renderTagChips();
  if (projectTagsInput) projectTagsInput.value = "";
  tagSuggestList.innerHTML = "";
  tagSuggestList.classList.remove("open");
}

async function loadProjects(pageNumber = currentPage) {
  try {
    const query = new URLSearchParams({
      page: String(pageNumber),
      size: String(pageSize),
    });

    const data = await apiFetch(`${API.LIST}?${query.toString()}`, {
      method: "GET",
    });

    if (Array.isArray(data)) {
      projectsCache = data.map(normalizeProject);
      currentPage = pageNumber;
      totalPages = 1;
    } else {
      const list = Array.isArray(data?.content) ? data.content : [];
      projectsCache = list.map(normalizeProject);

      const backendPage = Number(data?.number);
      currentPage = Number.isNaN(backendPage) ? pageNumber : backendPage + 1;
      totalPages = Number(data?.totalPages) || 1;
    }
  } catch (e) {
    projectsCache = [];
    currentPage = 1;
    totalPages = 1;
    console.warn("LIST API ERROR:", e.message);
  }
}

function mergedProjects() {
  const samples = readUserSamples().map((p) => normalizeProject({ ...p, isSample: true }));
  return [...samples, ...projectsCache];
}

function getProjectById(id) {
  return mergedProjects().find((x) => String(x.id) === String(id));
}

async function refreshAndRender(pageNumber = currentPage) {
  currentPage = pageNumber;
  setPageToUrl(currentPage);
  await loadProjects(currentPage);
  render();
}

function render() {
  const nickname = getNickname();
  const q = (projectSearch?.value || "").trim().toLowerCase();
  let projects = mergedProjects();

  if (!onlyMyProjects && nickname) {
    projects = projects.filter((p) => !isMember(p, nickname) || isOwner(p, nickname));
  }

  if (onlyMyProjects && nickname) {
    projects = projects.filter((p) => isOwner(p, nickname) || isMember(p, nickname));
  }

  if (activeCategory !== "ALL") {
    projects = projects.filter((p) => p.category === activeCategory || categoryLabel(p.category) === activeCategory);
  }

  if (activeSubStatus !== "ALL") {
    projects = projects.filter((p) => p.subStatus === activeSubStatus || subStatusLabel(p.subStatus) === activeSubStatus);
  }

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

  grid.innerHTML = "";
  if (countBadge) countBadge.textContent = `${projects.length} projects`;
  if (emptyState) emptyState.style.display = projects.length === 0 ? "block" : "none";

  projects.forEach((p) => {
    const owner = isOwner(p, nickname);
    const member = isMember(p, nickname);
    const currentCount = (p.members || []).length;

    const recruitText = (p.recruitments || [])
      .map((r) => `${r.role} ${r.count}명`)
      .join(", ");

    const card = document.createElement("article");
    card.className = `project-card ${p.isSample ? "sample-card" : ""}`;

    card.innerHTML = `
      <div class="project-card-head">
        <h3>${escapeHtml(p.title)}</h3>
        ${p.isSample ? `<span class="sample-badge">SAMPLE</span>` : ``}
      </div>

      <p class="project-card-desc">${escapeHtml(p.content || "설명이 없습니다.")}</p>

      <div class="project-card-meta">
        <span>상태: ${escapeHtml(subStatusLabel(p.subStatus))}</span>
        <span>모집: ${escapeHtml(recruitText || "-")}</span>
        <span>카테고리: ${escapeHtml(categoryLabel(p.category))}</span>
        ${owner ? `<span>권한: 팀장</span>` : ``}
      </div>

      <div class="project-tag-list">
        ${(p.tags || []).map((tag) => `<span class="tag-chip-static">${escapeHtml(tag)}</span>`).join("")}
      </div>

      <div class="project-card-foot">
        <span>팀장: ${escapeHtml(p.leaderName)} · ${escapeHtml(formatDate(p.createdAt))}</span>
        <span>${p.userLimit ? `${currentCount}/${escapeHtml(String(p.userLimit))}명` : `${currentCount}명`}</span>
      </div>

      <div class="project-card-actions">
        <button type="button" class="secondary-btn" data-action="open" data-id="${escapeHtml(String(p.id))}">
          열기
        </button>
        ${(!p.isSample && !owner && !member)
          ? `<button type="button" class="primary-btn" data-action="join" data-id="${escapeHtml(String(p.id))}">
              참여하기
            </button>`
          : ``}
        ${p.isSample
          ? `<button type="button" class="secondary-btn" data-action="deleteSample" data-id="${escapeHtml(String(p.id))}">
              삭제
            </button>`
          : owner
          ? `<button type="button" class="secondary-btn" data-action="delete" data-id="${escapeHtml(String(p.id))}">
              삭제
            </button>`
          : ``}
      </div>
    `;

    grid.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  if (!pagination) return;

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "이전";
  prevBtn.disabled = currentPage <= 1;
  prevBtn.onclick = () => refreshAndRender(currentPage - 1);
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => refreshAndRender(i);
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "다음";
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.onclick = () => refreshAndRender(currentPage + 1);
  pagination.appendChild(nextBtn);
}

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
    setActiveButton(categoryBar, "button[data-cat]", activeCategory, "cat");
    render();
  });

  subCategoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sub]");
    if (!btn) return;
    activeSubStatus = btn.dataset.sub;
    setActiveButton(subCategoryBar, "button[data-sub]", activeSubStatus, "sub");
    render();
  });
}

function openCreateModal() {
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => projectName?.focus(), 0);

  projectCategory.value = "웹";
  projectUserLimit.value = "";
  projectName.value = "";
  projectDesc.value = "";
  if (myRole) myRole.selectedIndex = 0;

  [...neededRolesWrap.querySelectorAll(".recruit-count-input")].forEach((input) => {
    input.value = "0";
  });

  resetTags();
}

function closeCreateModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  resetTags();
}

async function createProjectToServer() {
  if (!requireLoginOrRedirect()) return;

  const nickname = getNickname();
  const category = normalizeCategoryCode(projectCategory.value);
  const userLimit = Number(projectUserLimit.value);
  const title = projectName.value.trim();
  const content = projectDesc.value.trim();
  const tags = [...tagItems];
  const myRoleLabel = getSelectedText(myRole);
  const recruitments = getRecruitmentsFromForm();
  const totalRecruitCount = recruitments.reduce((sum, item) => sum + item.count, 0);

  if (!category) {
    alert("분야를 선택해주세요.");
    return;
  }

  if (!userLimit || userLimit < 1) {
    alert("최대 인원은 1명 이상이어야 합니다.");
    projectUserLimit.focus();
    return;
  }

  if (!title) {
    alert("제목을 입력해주세요.");
    projectName.focus();
    return;
  }

  if (!content) {
    alert("내용을 입력해주세요.");
    projectDesc.focus();
    return;
  }

  if (recruitments.length === 0) {
    alert("최소 1개 이상의 모집 직군 인원을 입력해주세요.");
    return;
  }

  if (totalRecruitCount > userLimit) {
    alert("직군별 모집 인원 합이 최대 인원을 초과할 수 없습니다.");
    return;
  }

  const payload = {
    nickname,
    category,
    userLimit,
    title,
    content,
    tags,
    myRole: myRoleLabel,
    recruitments,
    neededRoles: recruitments.map((r) => r.role),
  };

  createProjectBtn.disabled = true;
  createProjectBtn.textContent = "생성 중...";

  try {
    await authFetch(API.CREATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    closeCreateModal();
    await refreshAndRender(1);
  } catch (e) {
    alert(`서버 오류: ${e.message}`);
  } finally {
    createProjectBtn.disabled = false;
    createProjectBtn.textContent = "생성";
  }
}

function openDetailModal(project, mode = "view") {
  currentDetailProjectId = project.id;
  currentDetailMode = mode;
  renderDetailModal(project, mode);

  detailBackdrop.classList.add("open");
  detailBackdrop.setAttribute("aria-hidden", "false");
}

function closeDetailModal() {
  detailBackdrop.classList.remove("open");
  detailBackdrop.setAttribute("aria-hidden", "true");
  currentDetailProjectId = null;
  currentDetailMode = "view";
}

function renderDetailModal(project, mode = "view") {
  const nickname = getNickname();
  const owner = isOwner(project, nickname);
  const member = isMember(project, nickname);
  const myMemberInfo = getMyMemberInfo(project, nickname);
  const openRecruitments = getOpenRecruitments(project);
  const full = isProjectFull(project);
  const detailChatBtn = document.getElementById("detailChatBtn");

  if (detailChatBtn) {
    if (owner || member) {
      detailChatBtn.style.display = "inline-flex";
    } else {
      detailChatBtn.style.display = "none";
    }
  }

  detailModalSub.textContent =
    mode === "join"
      ? "프로젝트 정보를 확인하고 참여 역할을 선택하세요."
      : "프로젝트 상세 정보입니다.";

  detailCategoryBadge.textContent = categoryLabel(project.category);
  detailStatusBadge.textContent = subStatusLabel(project.subStatus);
  detailSampleBadge.style.display = project.isSample ? "inline-flex" : "none";

  detailProjectTitle.textContent = project.title || "제목 없음";
  detailProjectDesc.textContent = project.content || "설명이 없습니다.";
  detailLeaderName.textContent = project.leaderName || "-";
  detailCreatedAt.textContent = formatDate(project.createdAt) || "-";
  detailMemberCount.textContent = `${(project.members || []).length}명`;
  detailUserLimit.textContent = project.userLimit ? `${project.userLimit}명` : "제한 없음";

  detailTagList.innerHTML =
    Array.isArray(project.tags) && project.tags.length > 0
      ? project.tags.map((tag) => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join("")
      : `<div class="detail-empty">등록된 태그가 없습니다.</div>`;

  detailRoleStatusList.innerHTML =
    Array.isArray(project.recruitments) && project.recruitments.length > 0
      ? project.recruitments
          .map((r) => {
            const remainInfo = openRecruitments.find((x) => x.role === r.role);
            const remain = remainInfo ? remainInfo.remain : 0;
            const filled = Number(r.count) - remain;

            return `
              <div class="role-chip">
                <div class="role-chip-left">
                  <span class="role-chip-title">${escapeHtml(r.role)}</span>
                  <span class="role-chip-sub">
                    모집 ${escapeHtml(String(r.count))}명 / 참여 ${escapeHtml(String(filled))}명 / 남은 ${escapeHtml(String(remain))}명
                  </span>
                </div>
                <span class="role-chip-state ${remain > 0 ? "open" : "filled"}">
                  ${remain > 0 ? "모집중" : "마감"}
                </span>
              </div>
            `;
          })
          .join("")
      : `<div class="detail-empty">설정된 모집 직군이 없습니다.</div>`;

  detailMemberList.innerHTML =
    Array.isArray(project.members) && project.members.length > 0
      ? project.members
          .map((memberInfo) => `
            <div class="member-card">
              <div class="member-left">
                <span class="member-name">${escapeHtml(memberInfo.userName)}</span>
                <span class="member-role">${escapeHtml(memberInfo.role || "역할 미지정")}</span>
              </div>
              <div class="member-badges">
                ${memberInfo.isLeader ? `<span class="member-badge">팀장</span>` : ``}
              </div>
            </div>
          `)
          .join("")
      : `<div class="detail-empty">현재 참여자가 없습니다.</div>`;

  if (owner) {
    detailMyState.textContent = "팀장";
    detailMyRole.textContent = myMemberInfo?.role || "-";
  } else if (member) {
    detailMyState.textContent = "참여중";
    detailMyRole.textContent = myMemberInfo?.role || "-";
  } else {
    detailMyState.textContent = "미참여";
    detailMyRole.textContent = "-";
  }

  detailRemainRoleCount.textContent = `${openRecruitments.reduce((sum, r) => sum + r.remain, 0)}명`;

  const canShowJoinSection = !owner && !member && !full && openRecruitments.length > 0;
  detailJoinSection.style.display = canShowJoinSection ? "block" : "none";

  detailJoinRoleList.innerHTML = canShowJoinSection
    ? openRecruitments
        .map(
          (r, idx) => `
            <label class="join-role-item">
              <input type="radio" name="detailJoinRole" value="${escapeHtml(r.role)}" ${idx === 0 ? "checked" : ""} />
              <span>${escapeHtml(r.role)} (남은 ${escapeHtml(String(r.remain))}명)</span>
            </label>
          `
        )
        .join("")
    : `<div class="detail-empty">${
        owner
          ? "팀장은 별도 참여 선택이 필요하지 않습니다."
          : member
          ? "이미 참여 중인 프로젝트입니다."
          : full
          ? "정원이 가득 찼습니다."
          : "모집 가능한 역할이 없습니다."
      }</div>`;

  detailJoinBtn.style.display = !owner && !member ? "inline-flex" : "none";
  detailLeaveBtn.style.display = !owner && member ? "inline-flex" : "none";

  if (!owner && !member) {
    if (full) {
      detailJoinBtn.disabled = true;
      detailJoinBtn.textContent = "정원 마감";
    } else if (openRecruitments.length === 0) {
      detailJoinBtn.disabled = true;
      detailJoinBtn.textContent = "모집 역할 없음";
    } else {
      detailJoinBtn.disabled = false;
      detailJoinBtn.textContent = "참여하기";
    }
  }
}

async function joinProjectFromDetail() {
  if (!requireLoginOrRedirect()) return;
  if (!currentDetailProjectId) return;

  const project = getProjectById(currentDetailProjectId);
  if (!project) {
    alert("프로젝트 정보를 찾을 수 없습니다.");
    return;
  }

  const nickname = getNickname();

  if (isOwner(project, nickname)) {
    alert("프로젝트 생성자는 자동 참여 상태입니다.");
    return;
  }

  if (isMember(project, nickname)) {
    alert("이미 참여한 프로젝트입니다.");
    return;
  }

  if (isProjectFull(project)) {
    alert("정원이 가득 찼습니다.");
    return;
  }

  const roleEl = document.querySelector("input[name='detailJoinRole']:checked");
  if (!roleEl) {
    alert("참여할 역할을 선택해주세요.");
    return;
  }

  const roleLabel = roleEl.value;

  detailJoinBtn.disabled = true;
  detailJoinBtn.textContent = "처리 중...";

  try {
    if (project.isSample) {
      updateOneSample(project.id, (sample) => {
        const members = Array.isArray(sample.members) ? [...sample.members] : [];
        members.push({
          userName: nickname,
          isLeader: false,
          role: roleLabel,
        });
        sample.members = members;
        return sample;
      });
    } else {
      await authFetch(API.JOIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          nickname,
          role: roleLabel,
        }),
      });
    }

    closeDetailModal();
    await refreshAndRender(currentPage);
    alert(`참여 완료\n역할: ${roleLabel}`);
  } catch (e) {
    alert(`서버 오류: ${e.message}`);
  } finally {
    detailJoinBtn.disabled = false;
    detailJoinBtn.textContent = "참여하기";
  }
}

async function leaveProjectFromDetail() {
  if (!requireLoginOrRedirect()) return;
  if (!currentDetailProjectId) return;

  const project = getProjectById(currentDetailProjectId);
  if (!project) {
    alert("프로젝트 정보를 찾을 수 없습니다.");
    return;
  }

  const nickname = getNickname();
  const myInfo = getMyMemberInfo(project, nickname);

  if (!myInfo) {
    alert("현재 참여 정보가 없습니다.");
    return;
  }

  const ok = confirm("프로젝트 참여를 취소할까요?");
  if (!ok) return;

  detailLeaveBtn.disabled = true;
  detailLeaveBtn.textContent = "처리 중...";

  try {
    if (project.isSample) {
      updateOneSample(project.id, (sample) => {
        sample.members = (sample.members || []).filter(
          (m) => String(m.userName || "").trim() !== nickname
        );
        return sample;
      });
    } else {
      await authFetch(API.LEAVE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          nickname,
        }),
      });
    }

    closeDetailModal();
    await refreshAndRender(currentPage);
    alert("참여가 취소되었습니다.");
  } catch (e) {
    alert(`참여 취소 처리 중 오류가 발생했습니다.\n${e.message}`);
  } finally {
    detailLeaveBtn.disabled = false;
    detailLeaveBtn.textContent = "참여 취소";
  }
}

async function deleteProjectFromServer(projectId) {
  if (!requireLoginOrRedirect()) return;

  const nickname = getNickname();
  const ok = confirm("이 프로젝트를 삭제할까요?");
  if (!ok) return;

  try {
    await authFetch(API.DELETE(projectId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, projectId }),
    });

    await refreshAndRender(currentPage);
  } catch (e) {
    alert(`서버 오류: ${e.message}`);
  }
}

createBtn?.addEventListener("click", () => {
  if (!requireLoginOrRedirect()) return;
  openCreateModal();
});

myProjectsBtn?.addEventListener("click", () => {
  onlyMyProjects = !onlyMyProjects;
  myProjectsBtn.textContent = onlyMyProjects
    ? "전체 프로젝트 보기"
    : "내가 참여한 팀 프로젝트 보기";
  render();
});

modalCloseBtn?.addEventListener("click", closeCreateModal);
cancelBtn?.addEventListener("click", closeCreateModal);

modalBackdrop?.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeCreateModal();
});

detailCloseBtn?.addEventListener("click", closeDetailModal);
detailCancelBtn?.addEventListener("click", closeDetailModal);

detailBackdrop?.addEventListener("click", (e) => {
  if (e.target === detailBackdrop) closeDetailModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modalBackdrop?.classList.contains("open")) closeCreateModal();
    if (detailBackdrop?.classList.contains("open")) closeDetailModal();
  }
});

createProjectBtn?.addEventListener("click", createProjectToServer);
detailJoinBtn?.addEventListener("click", joinProjectFromDetail);
detailLeaveBtn?.addEventListener("click", leaveProjectFromDetail);

projectSearch?.addEventListener("input", render);

seedBtn?.addEventListener("click", () => {
  if (!requireLoginOrRedirect()) return;
  ensureTwoSamplesAdded();
  render();
});

clearBtn?.addEventListener("click", () => {
  if (!requireLoginOrRedirect()) return;
  const ok = confirm("내 샘플 프로젝트를 삭제할까요?");
  if (!ok) return;
  clearUserSamples();
  render();
});

projectTagsInput?.addEventListener("input", (e) => {
  showTagSuggestions(e.target.value);
});

projectTagsInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const value = projectTagsInput.value.replace(/,/g, "").trim();
    if (!value) return;
    addTag(value);
    projectTagsInput.value = "";
    tagSuggestList.innerHTML = "";
    tagSuggestList.classList.remove("open");
  }

  if (e.key === "Backspace" && !projectTagsInput.value.trim() && tagItems.length > 0) {
    tagItems.pop();
    renderTagChips();
  }
});

tagSuggestList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-tag]");
  if (!btn) return;

  const tag = btn.dataset.tag;
  addTag(tag);
  projectTagsInput.value = "";
  tagSuggestList.innerHTML = "";
  tagSuggestList.classList.remove("open");
  projectTagsInput.focus();
});

tagChipList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-tag-index]");
  if (!btn) return;

  const idx = Number(btn.dataset.tagIndex);
  if (Number.isNaN(idx)) return;

  tagItems.splice(idx, 1);
  renderTagChips();
});

grid?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const nickname = getNickname();
  const p = getProjectById(id);

  if (!p) return;

  if (action === "open") {
    openDetailModal(p, "view");
    return;
  }

  if (action === "join") {
    if (!requireLoginOrRedirect()) return;

    if (isOwner(p, nickname) || isMember(p, nickname)) {
      openDetailModal(p, "view");
      return;
    }

    openDetailModal(p, "join");
    return;
  }

  if (action === "deleteSample") {
    const ok = confirm("이 샘플을 삭제할까요?");
    if (!ok) return;
    deleteOneSample(p.id);
    render();
    return;
  }

  if (action === "delete") {
    if (!isOwner(p, nickname)) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    await deleteProjectFromServer(p.id);
  }
});

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
    setActiveButton(categoryBar, "button[data-cat]", activeCategory, "cat");
    render();
  });

  subCategoryBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sub]");
    if (!btn) return;
    activeSubStatus = btn.dataset.sub;
    setActiveButton(subCategoryBar, "button[data-sub]", activeSubStatus, "sub");
    render();
  });
}

(function init() {
  if (adminMenu) {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    adminMenu.style.display = isAdmin ? "block" : "none";
  }

  bindCategoryEvents();
  refreshAndRender(currentPage);
})();

/* Team Project Chat Frontend */

const detailChatBtn = document.getElementById("detailChatBtn");

const chatWindow = document.getElementById("chatWindow");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const chatTitle = document.getElementById("chatTitle");
const chatProjectInfo = document.getElementById("chatProjectInfo");
const msgArea = document.getElementById("msgArea");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatFile = document.getElementById("chatFile");
const chatFileBtn = document.getElementById("chatFileBtn");
const chatFilePreview = document.getElementById("chatFilePreview");

let currentChatProjectId = null;
let selectedChatFile = null;
let stompClient = null;
let chatSubscription = null;

function openChatWindow(project) {
  const nickname = getNickname();

  if (!isOwner(project, nickname) && !isMember(project, nickname)) {
    alert("프로젝트 참여자만 채팅방에 입장할 수 있습니다.");
    return;
  }

  currentChatProjectId = project.id;
  selectedChatFile = null;

  chatTitle.textContent = `${project.title} 채팅`;
  chatProjectInfo.textContent = `팀장: ${project.leaderName || "-"}`;
  msgArea.innerHTML = "";
  chatInput.value = "";
  chatFile.value = "";
  chatFilePreview.style.display = "none";
  chatFilePreview.innerHTML = "";

  chatWindow.classList.add("open");
  chatWindow.setAttribute("aria-hidden", "false");

  connectChatSocket(project.id);

  loadChatHistory(project.id).then(() => {
    appendSystemMessage("채팅방에 입장했습니다.");
  });
}

function closeChatWindow() {
  chatWindow.classList.remove("open");
  chatWindow.setAttribute("aria-hidden", "true");

  disconnectChatSocket();

  currentChatProjectId = null;
  selectedChatFile = null;
}

function appendSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "chat-message-system";
  div.textContent = text;
  msgArea.appendChild(div);
  scrollChatBottom();
}

function appendChatMessage(chat) {
  const nickname = getNickname();
  const isMine = String(chat.senderNickname || "") === nickname;

  const div = document.createElement("div");
  div.className = `chat-message ${isMine ? "mine" : "other"}`;

  const sender = escapeHtml(chat.senderNickname || "알 수 없음");
  const time = chat.createdAt ? formatChatTime(chat.createdAt) : formatChatTime(new Date());

  let contentHtml = "";

  if (chat.messageType === "IMAGE") {
    const fileUrl = escapeHtml(chat.fileUrl || "");
    const fileName = escapeHtml(chat.originalFileName || "이미지");
    contentHtml = `
      <span class="chat-sender">${sender}</span>
      <a href="${fileUrl}" target="_blank" rel="noopener">
        <img class="chat-image" src="${fileUrl}" alt="${fileName}">
      </a>
      <span class="chat-time">${time}</span>
    `;
  } else if (chat.messageType === "FILE") {
    const fileUrl = escapeHtml(chat.fileUrl || "#");
    const fileName = escapeHtml(chat.originalFileName || "첨부파일");
    contentHtml = `
      <span class="chat-sender">${sender}</span>
      <a class="chat-file-link" href="${fileUrl}" target="_blank" rel="noopener">${fileName}</a>
      <span class="chat-time">${time}</span>
    `;
  } else {
    contentHtml = `
      <span class="chat-sender">${sender}</span>
      ${escapeHtml(chat.content || "")}
      <span class="chat-time">${time}</span>
    `;
  }

  div.innerHTML = contentHtml;
  msgArea.appendChild(div);
  scrollChatBottom();
}

function scrollChatBottom() {
  msgArea.scrollTop = msgArea.scrollHeight;
}

function formatChatTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function sendChatMessage() {
  if (!currentChatProjectId) {
    alert("채팅방 정보가 없습니다.");
    return;
  }

  const content = chatInput.value.trim();

  if (!content && !selectedChatFile) {
    alert("메시지 또는 파일을 입력해주세요.");
    return;
  }

  if (selectedChatFile) {
    await uploadChatFileAndSend();
    return;
  }

  const payload = {
    projectId: currentChatProjectId,
    senderNickname: getNickname(),
    content,
    messageType: "TEXT",
  };

  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/teamproject/${currentChatProjectId}/chat/send`,
      body: JSON.stringify(payload),
    });
  } else {
    appendChatMessage({
      ...payload,
      createdAt: new Date().toISOString(),
    });
  }

  chatInput.value = "";
}

async function uploadChatFileAndSend() {
  if (!selectedChatFile) return;

  const isImage = selectedChatFile.type.startsWith("image/");

  if (!stompClient || !stompClient.connected) {
    appendChatMessage({
      projectId: currentChatProjectId,
      senderNickname: getNickname(),
      messageType: isImage ? "IMAGE" : "FILE",
      fileUrl: URL.createObjectURL(selectedChatFile),
      originalFileName: selectedChatFile.name,
      createdAt: new Date().toISOString(),
    });

    clearSelectedFile();
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedChatFile);

  try {
    const res = await fetch(`/api/teamproject/${currentChatProjectId}/chat/files`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "파일 업로드 실패");
    }

    const payload = {
      projectId: currentChatProjectId,
      senderNickname: getNickname(),
      content: "",
      messageType: isImage ? "IMAGE" : "FILE",
      fileUrl: data.fileUrl,
      originalFileName: data.originalFileName,
    };

    stompClient.publish({
      destination: `/app/teamproject/${currentChatProjectId}/chat/send`,
      body: JSON.stringify(payload),
    });

    clearSelectedFile();
  } catch (e) {
    alert(`파일 업로드 실패: ${e.message}`);
  }
}

function clearSelectedFile() {
  selectedChatFile = null;
  chatFile.value = "";
  chatFilePreview.style.display = "none";
  chatFilePreview.innerHTML = "";
}

/* WebSocket 연결 */
function connectChatSocket(projectId) {
  if (typeof StompJs === "undefined" || typeof SockJS === "undefined") {
    console.warn("STOMP/SockJS 라이브러리가 없습니다. 프론트 테스트 모드로 동작합니다.");
    return;
  }

  if (stompClient && stompClient.connected) {
    subscribeChatRoom(projectId);
    return;
  }

  stompClient = new StompJs.Client({
    webSocketFactory: () => new SockJS("/ws-chat"),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    subscribeChatRoom(projectId);
  };

  stompClient.onStompError = (frame) => {
    console.error("STOMP ERROR", frame);
    appendSystemMessage("채팅 서버 연결 중 오류가 발생했습니다.");
  };

  stompClient.activate();
}

function subscribeChatRoom(projectId) {
  if (!stompClient || !stompClient.connected) return;

  if (chatSubscription) {
    chatSubscription.unsubscribe();
    chatSubscription = null;
  }

  chatSubscription = stompClient.subscribe(`/topic/teamproject/${projectId}`, (message) => {
    const chat = JSON.parse(message.body);
    appendChatMessage(chat);
  });
}

function disconnectChatSocket() {
  if (chatSubscription) {
    chatSubscription.unsubscribe();
    chatSubscription = null;
  }

  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

async function loadChatHistory(projectId) {
  try {
    const res = await fetch(`/api/teamproject/${projectId}/chat/messages`);
    if (!res.ok) return;

    const data = await res.json();
    const messages = Array.isArray(data) ? data : data.content || [];

    msgArea.innerHTML = "";
    messages.forEach(appendChatMessage);
  } catch (e) {
    console.warn("채팅 내역 조회 실패:", e.message);
  }
}

detailChatBtn?.addEventListener("click", () => {
  if (!currentDetailProjectId) {
    alert("프로젝트 정보가 없습니다.");
    return;
  }

  const project = getProjectById(currentDetailProjectId);

  if (!project) {
    alert("프로젝트를 찾을 수 없습니다.");
    return;
  }

  openChatWindow(project);
});

chatCloseBtn?.addEventListener("click", closeChatWindow);

chatSendBtn?.addEventListener("click", sendChatMessage);

chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChatMessage();
  }
});

chatFileBtn?.addEventListener("click", () => {
  chatFile.click();
});

chatFile?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  selectedChatFile = file;

  chatFilePreview.style.display = "block";
  chatFilePreview.innerHTML = `
    선택된 파일: <strong>${escapeHtml(file.name)}</strong>
    <button type="button" id="removeSelectedFile" class="file-btn" style="margin-left:8px;">삭제</button>
  `;

  document.getElementById("removeSelectedFile")?.addEventListener("click", clearSelectedFile);
});