const $ = (id) => document.getElementById(id);

const API = {
  LIST: "/api/teamproject",
  CREATE: "/api/teamproject",
  JOIN: "/api/teamproject/join",
  LEAVE: "/api/teamproject/leave",
  DELETE: (projectId) => `/api/teamproject/${projectId}`,
};

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

function getCheckedLabelTexts(containerEl) {
  if (!containerEl) return [];
  return [...containerEl.querySelectorAll("label.check")]
    .filter((lb) => lb.querySelector("input[type='checkbox']")?.checked)
    .map((lb) => (lb.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function categoryLabel(v) {
  switch (v) {
    case "WEB": return "웹";
    case "AI_DATA": return "AI/데이터";
    case "GAME": return "게임";
    case "SEC": return "보안";
    case "웹": return "웹";
    case "AI/데이터": return "AI/데이터";
    case "게임": return "게임";
    case "보안": return "보안";
    default: return v;
  }
}

function subStatusLabel(v) {
  switch (v) {
    case "RECRUITING": return "모집중";
    case "IN_PROGRESS": return "진행중";
    case "DONE": return "완료";
    case "모집중": return "모집중";
    case "진행중": return "진행중";
    case "완료": return "완료";
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
      neededRoles: ["프론트", "백엔드", "테스트/품질"],
      leaderName: nickname,
      members: [{ userName: nickname, isLeader: true, role: "프론트" }],
      createdAt: now,
      userLimit: 4,
      isSample: true,
    },
    {
      id: "sample_" + uid(),
      title: "샘플) AI 추천 스택/로드맵",
      content: "질문 기반 성향 분석 → 스택/학습 로드맵 추천 MVP",
      category: "AI_DATA",
      subStatus: "RECRUITING",
      tags: ["React", "Spring", "FastAPI", "PostgreSQL"],
      neededRoles: ["백엔드", "DB/데이터", "AI/추천"],
      leaderName: nickname,
      members: [{ userName: nickname, isLeader: true, role: "기획/PM" }],
      createdAt: now,
      userLimit: 5,
      isSample: true,
    },
  ];

  writeUserSamples(samples);
}

async function apiFetch(url, options) {
  const res = await fetch(url, options);
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

function normalizeProject(p) {
  const membersRaw = Array.isArray(p.members)
    ? p.members
    : Array.isArray(p.memberList)
    ? p.memberList
    : [];

  const neededRaw = Array.isArray(p.neededRoles)
    ? p.neededRoles
    : Array.isArray(p.needRoles)
    ? p.needRoles
    : Array.isArray(p.neededRoleLabels)
    ? p.neededRoleLabels
    : [];

  const neededRoles = (neededRaw || [])
    .map((x) => x?.label ?? x?.name ?? x)
    .map((x) => String(x || "").trim())
    .filter(Boolean);

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
    category: p.category ?? "WEB",
    subStatus: p.subStatus ?? "IN_PROGRESS",
    tags: Array.isArray(p.tags) ? p.tags : [],
    neededRoles,
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

function getFilledRoleMap(project) {
  const map = new Map();
  (project.members || []).forEach((member) => {
    const role = String(member.role || "").trim();
    if (!role) return;
    if (!map.has(role)) map.set(role, []);
    map.get(role).push(member);
  });
  return map;
}

function getOpenRoles(project) {
  const filledRoleMap = getFilledRoleMap(project);
  return (project.neededRoles || []).filter((role) => !filledRoleMap.has(role));
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
  if (!value) return;
  if (tagItems.includes(value)) return;
  if (tagItems.length >= 8) return;
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

async function loadProjects() {
  try {
    const data = await apiFetch(API.LIST, { method: "GET" });
    const list = Array.isArray(data) ? data : (data?.content || []);
    projectsCache = list.map(normalizeProject);
  } catch (e) {
    projectsCache = [];
    console.warn("LIST API ERROR:", e.message);
  }
}

function mergedProjects() {
  const samples = readUserSamples().map((p) => ({ ...p, isSample: true }));
  return [...samples, ...projectsCache];
}

function getProjectById(id) {
  return mergedProjects().find((x) => String(x.id) === String(id));
}

function render() {
  const nickname = getNickname();
  const q = (projectSearch?.value || "").trim().toLowerCase();
  let projects = mergedProjects();

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
        <span>필요 역할: ${escapeHtml(roleListLabel(p.neededRoles))}</span>
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

  [...neededRolesWrap.querySelectorAll("input[type='checkbox']")].forEach((cb) => {
    cb.checked = ["프론트", "백엔드"].includes(cb.value);
  });

  resetTags();
}

function closeCreateModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  resetTags();
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
  const filledRoleMap = getFilledRoleMap(project);
  const openRoles = getOpenRoles(project);
  const full = isProjectFull(project);

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
      ? project.tags
          .map((tag) => `<span class="detail-tag">${escapeHtml(tag)}</span>`)
          .join("")
      : `<div class="detail-empty">등록된 태그가 없습니다.</div>`;

  detailRoleStatusList.innerHTML =
    Array.isArray(project.neededRoles) && project.neededRoles.length > 0
      ? project.neededRoles
          .map((role) => {
            const assigned = filledRoleMap.get(role) || [];
            const isOpen = assigned.length === 0;
            return `
              <div class="role-chip">
                <div class="role-chip-left">
                  <span class="role-chip-title">${escapeHtml(role)}</span>
                  <span class="role-chip-sub">
                    ${
                      isOpen
                        ? "아직 참여자가 없습니다."
                        : assigned.map((m) => escapeHtml(m.userName)).join(", ") + " 참여중"
                    }
                  </span>
                </div>
                <span class="role-chip-state ${isOpen ? "open" : "filled"}">
                  ${isOpen ? "모집중" : "참여중"}
                </span>
              </div>
            `;
          })
          .join("")
      : `<div class="detail-empty">설정된 필요 역할이 없습니다.</div>`;

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

  detailRemainRoleCount.textContent = `${openRoles.length}개`;

  const canShowJoinSection = !owner && !member && !full && openRoles.length > 0;
  detailJoinSection.style.display = canShowJoinSection ? "block" : "none";

  detailJoinRoleList.innerHTML = canShowJoinSection
    ? openRoles
        .map(
          (role, idx) => `
            <label class="join-role-item">
              <input type="radio" name="detailJoinRole" value="${escapeHtml(role)}" ${idx === 0 ? "checked" : ""} />
              <span>${escapeHtml(role)}</span>
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
    } else if (openRoles.length === 0) {
      detailJoinBtn.disabled = true;
      detailJoinBtn.textContent = "모집 역할 없음";
    } else {
      detailJoinBtn.disabled = false;
      detailJoinBtn.textContent = "참여하기";
    }
  }
}

async function createProjectToServer() {
if (!requireLoginOrRedirect()) return;

const nickname = getNickname();
const category = projectCategory.value;
const userLimit = Number(projectUserLimit.value);
const title = projectName.value.trim();
const content = projectDesc.value.trim();
const tags = [...tagItems];
const myRoleLabel = getSelectedText(myRole);
const neededRoleLabels = [...neededRolesWrap.querySelectorAll("input[type='checkbox']:checked")]
.map((cb) => cb.value)
.filter(Boolean);

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

const payload = {
nickname,
category,
userLimit,
title,
content,
tags,
neededRoles: neededRoleLabels,
myRole: myRoleLabel,
};

createProjectBtn.disabled = true;
createProjectBtn.textContent = "생성 중...";

try {
await apiFetch(API.CREATE, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
});

closeCreateModal();
await refreshAndRender();
} catch (e) {
alert(`서버 오류: ${e.message}`);
} finally {
createProjectBtn.disabled = false;
createProjectBtn.textContent = "생성";
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
await apiFetch(API.JOIN, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
projectId: project.id,
nickname,
role: roleLabel,
}),
});
}

await refreshAndRender();
const fresh = getProjectById(currentDetailProjectId);
if (fresh) openDetailModal(fresh, "view");
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
await apiFetch(API.LEAVE, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
projectId: project.id,
nickname,
}),
});
}

await refreshAndRender();
const fresh = getProjectById(currentDetailProjectId);
if (fresh) openDetailModal(fresh, "view");
alert("참여가 취소되었습니다.");
} catch (e) {
alert(
`참여 취소 처리 중 오류가 발생했습니다.\n${e.message}\n\n백엔드에 /api/teamproject/leave API가 없으면 추가가 필요합니다.`
);
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
await apiFetch(API.DELETE(projectId), {
method: "DELETE",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ nickname, projectId }),
});

await refreshAndRender();
} catch (e) {
alert(`서버 오류: ${e.message}`);
}
}

async function refreshAndRender() {
await loadProjects();
render();
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

if (isOwner(p, nickname)) {
openDetailModal(p, "view");
return;
}

if (isMember(p, nickname)) {
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

bindCategoryEvents();
refreshAndRender();