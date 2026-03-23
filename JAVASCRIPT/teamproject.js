const $ = (id) => document.getElementById(id);

const API = {
  LIST: "/api/teamproject",
  CREATE: "/api/teamproject",
  JOIN: "/api/teamproject/join",
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

let activeCategory = "ALL";
let activeSubStatus = "ALL";
let onlyMyProjects = false;
let projectsCache = [];
let tagItems = [];

const SAMPLE_KEY_PREFIX = "tp_samples_";

const TAG_OPTIONS = [
  "Java",
  "JavaScript",
  "JSON",
  "TypeScript",
  "Python",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "React",
  "Next.js",
  "Vue",
  "Spring",
  "Spring Boot",
  "FastAPI",
  "Node.js",
  "Express",
  "Django",
  "Flask",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "JPA",
  "JWT",
  "Jenkins",
  "JUnit",
  "Kafka",
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy"
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
  return arr.map((x) => String(x?.label ?? x?.name ?? x).trim()).filter(Boolean).join(", ");
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return null;
}

function normalizeProject(p) {
  const membersRaw =
    Array.isArray(p.members) ? p.members :
    (Array.isArray(p.memberList) ? p.memberList : []);

  const neededRaw =
    Array.isArray(p.neededRoles) ? p.neededRoles :
    (Array.isArray(p.needRoles) ? p.needRoles :
    (Array.isArray(p.neededRoleLabels) ? p.neededRoleLabels : []));

  const neededRoles = (neededRaw || [])
    .map((x) => (x?.label ?? x?.name ?? x))
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const members = (membersRaw || []).map((m) => ({
    userName: String(m.userName ?? m.nickname ?? m.name ?? "").trim(),
    isLeader: !!m.isLeader,
    role: String(m.role ?? m.roleLabel ?? "").trim(),
  }));

  const leaderName =
    String(p.leaderName ?? p.leader ?? p.createdByNickname ?? p.ownerNickname ?? p.createdBy ?? "").trim() ||
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
    isSample: false,
  };
}

function isOwner(p, nickname) {
  return !!nickname && String(p.leaderName || "").trim() === nickname;
}

function isMember(p, nickname) {
  if (!nickname) return false;
  return (p.members || []).some((m) => String(m.userName || "").trim() === nickname);
}

function renderTagChips() {
  tagChipList.innerHTML = tagItems.map((tag, idx) => `
    <span class="tag-chip">
      ${escapeHtml(tag)}
      <button type="button" data-remove-tag="${idx}">×</button>
    </span>
  `).join("");
}

function showTagSuggestions(keyword) {
  const q = String(keyword || "").trim().toLowerCase();

  if (!q) {
    tagSuggestList.innerHTML = "";
    tagSuggestList.classList.remove("open");
    return;
  }

  const filtered = TAG_OPTIONS.filter(tag =>
    tag.toLowerCase().includes(q) && !tagItems.includes(tag)
  ).slice(0, 8);

  if (filtered.length === 0) {
    tagSuggestList.innerHTML = "";
    tagSuggestList.classList.remove("open");
    return;
  }

  tagSuggestList.innerHTML = filtered.map(tag => `
    <div class="tag-suggest-item" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</div>
  `).join("");

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

    const card = document.createElement("article");
    card.className = `project-card ${p.isSample ? "sample-card" : ""}`;

    card.innerHTML = `
      <div class="card-head">
        <div class="card-title">${escapeHtml(p.title)}</div>
        ${p.isSample ? `<span class="badge sample">SAMPLE</span>` : ``}
      </div>

      <p class="card-desc">${escapeHtml(p.content || "설명이 없습니다.")}</p>

      <div class="badges">
        <span class="badge status">상태: ${escapeHtml(subStatusLabel(p.subStatus))}</span>
        <span class="badge need">필요 역할: ${escapeHtml(roleListLabel(p.neededRoles))}</span>
        <span class="badge role">카테고리: ${escapeHtml(categoryLabel(p.category))}</span>
        ${owner ? `<span class="badge auth">권한: 팀장</span>` : ""}
      </div>

      <div class="tags">
        ${(p.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>

      <div class="card-footer">
        <div class="meta">
          팀장: ${escapeHtml(p.leaderName)} · ${escapeHtml(formatDate(p.createdAt))}
          ${p.userLimit ? ` · 최대 ${escapeHtml(String(p.userLimit))}명` : ""}
        </div>

        <div class="card-actions">
          <button class="action-btn" data-action="open" data-id="${p.id}">열기</button>
          ${(!p.isSample && !owner && !member) ? `<button class="action-btn join" data-action="join" data-id="${p.id}">참여하기</button>` : ``}
          ${p.isSample
            ? `<button class="action-btn danger" data-action="deleteSample" data-id="${p.id}">삭제</button>`
            : (owner ? `<button class="action-btn danger" data-action="delete" data-id="${p.id}">삭제</button>` : ``)}
        </div>
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

let joinModalEl = null;
let joinContext = { projectId: null, pickedRoleLabel: null };

function ensureJoinModal() {
  if (joinModalEl) return;

  joinModalEl = document.createElement("div");
  joinModalEl.id = "joinRoleModal";
  joinModalEl.style.cssText = `
    position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); z-index: 99999;
  `;

  joinModalEl.innerHTML = `
    <div style="
      width: min(520px, 92vw);
      background: rgba(15,23,42,0.96);
      border: 1px solid rgba(148,163,184,0.18);
      border-radius: 16px;
      padding: 18px 18px 14px 18px;
      color: rgba(226,232,240,0.95);
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:16px; font-weight:900;">프로젝트 참여</div>
          <div style="margin-top:4px; font-size:12px; opacity:0.8;">
            모집 중인 역할 중 하나를 선택하세요.
          </div>
        </div>
        <button id="joinModalX" style="
          width: 34px; height:34px; border-radius:10px; border:1px solid rgba(148,163,184,0.18);
          background: rgba(148,163,184,0.10); color: rgba(226,232,240,0.95); cursor:pointer;
        ">✕</button>
      </div>

      <div id="joinModalProjectName" style="margin-top:14px; font-size:14px; font-weight:850;"></div>
      <div id="joinRoleList" style="margin-top:12px; display:flex; flex-direction:column; gap:10px;"></div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
        <button id="joinModalCancel" style="
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(148,163,184,0.10);
          color: rgba(226,232,240,0.95); cursor:pointer;
        ">취소</button>

        <button id="joinModalConfirm" style="
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(59,130,246,0.35);
          background: rgba(59,130,246,0.92);
          color:white; cursor:pointer; font-weight:900;
        ">참여하기</button>
      </div>
    </div>
  `;

  document.body.appendChild(joinModalEl);

  joinModalEl.addEventListener("click", (e) => {
    if (e.target === joinModalEl) hideJoinModal();
  });
  joinModalEl.querySelector("#joinModalX").addEventListener("click", hideJoinModal);
  joinModalEl.querySelector("#joinModalCancel").addEventListener("click", hideJoinModal);
}

function showJoinModal(project) {
  ensureJoinModal();

  joinContext = { projectId: project.id, pickedRoleLabel: null };

  const nameEl = joinModalEl.querySelector("#joinModalProjectName");
  const listEl = joinModalEl.querySelector("#joinRoleList");
  const confirmBtn = joinModalEl.querySelector("#joinModalConfirm");

  nameEl.textContent = project.title ? `프로젝트: ${project.title}` : "프로젝트 참여";
  listEl.innerHTML = "";

  const roles = Array.isArray(project.neededRoles) ? project.neededRoles : [];

  if (roles.length === 0) {
    listEl.innerHTML = `<div style="opacity:0.85; font-size:13px;">현재 모집 중인 역할이 없습니다.</div>`;
    joinContext.pickedRoleLabel = null;
  } else {
    roles.forEach((label, idx) => {
      const safeLabel = String(label).trim();
      const id = `joinRole_${idx}`;

      const item = document.createElement("label");
      item.setAttribute("for", id);
      item.style.cssText = `
        display:flex; align-items:center; gap:10px;
        padding: 10px 12px;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 12px;
        background: rgba(148,163,184,0.08);
        cursor: pointer;
      `;
      item.innerHTML = `
        <input type="radio" name="joinRoleRadio" id="${id}" value="${escapeHtml(safeLabel)}"
              style="transform:scale(1.05);" ${idx === 0 ? "checked" : ""}/>
        <div style="font-weight:900;">${escapeHtml(safeLabel)}</div>
      `;
      listEl.appendChild(item);

      if (idx === 0) joinContext.pickedRoleLabel = safeLabel;
    });

    listEl.querySelectorAll("input[name='joinRoleRadio']").forEach((radio) => {
      radio.addEventListener("change", () => {
        joinContext.pickedRoleLabel = radio.value;
      });
    });
  }

  confirmBtn.onclick = async () => {
    if (!requireLoginOrRedirect()) return;

    const nickname = getNickname();
    const projectId = joinContext.projectId;
    const roleLabel = joinContext.pickedRoleLabel;

    if (!projectId) {
      alert("프로젝트 정보가 없습니다.");
      return;
    }

    if (!roleLabel) {
      alert("참여할 역할을 선택하세요.");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "처리 중...";

    try {
      await apiFetch(API.JOIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          nickname,
          role: roleLabel
        }),
      });

      hideJoinModal();
      await refreshAndRender();
      alert(`참여 완료\n역할: ${roleLabel}`);
    } catch (e) {
      alert(`서버 오류: ${e.message}`);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "참여하기";
    }
  };

  joinModalEl.style.display = "flex";
}

function hideJoinModal() {
  if (!joinModalEl) return;
  joinModalEl.style.display = "none";
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
    .map(cb => cb.value)
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
    myRole: myRoleLabel
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
  myProjectsBtn.textContent = onlyMyProjects ? "전체 프로젝트 보기" : "내가 참여한 팀 프로젝트 보기";
  render();
});

modalCloseBtn?.addEventListener("click", closeCreateModal);
cancelBtn?.addEventListener("click", closeCreateModal);

modalBackdrop?.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeCreateModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modalBackdrop?.classList.contains("open")) closeCreateModal();
    if (joinModalEl?.style.display === "flex") hideJoinModal();
  }
});

createProjectBtn?.addEventListener("click", createProjectToServer);
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

grid?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  const nickname = getNickname();
  const all = mergedProjects();
  const p = all.find((x) => String(x.id) === String(id));
  if (!p) return;

  if (action === "open") {
    alert(
      `[${p.title}]\n\n카테고리: ${categoryLabel(p.category)}\n상태: ${subStatusLabel(p.subStatus)}\n필요 역할: ${roleListLabel(p.neededRoles)}\n태그: ${(p.tags || []).join(", ")}`
    );
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
      alert("삭제 권한이 없습니다. (프로젝트 생성자만 삭제 가능)");
      return;
    }
    await deleteProjectFromServer(p.id);
    return;
  }

  if (action === "join") {
    if (isOwner(p, nickname)) {
      alert("프로젝트 생성자는 자동 참여 상태입니다.");
      return;
    }
    if (isMember(p, nickname)) {
      alert("이미 참여한 프로젝트입니다.");
      return;
    }
    showJoinModal(p);
  }
});

projectTagsInput?.addEventListener("input", () => {
  showTagSuggestions(projectTagsInput.value);
});

projectTagsInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const first = tagSuggestList.querySelector(".tag-suggest-item");
    if (first) {
      e.preventDefault();
      addTag(first.dataset.tag);
      projectTagsInput.value = "";
      tagSuggestList.innerHTML = "";
      tagSuggestList.classList.remove("open");
    }
  }

  if (e.key === "Backspace" && !projectTagsInput.value.trim() && tagItems.length > 0) {
    tagItems.pop();
    renderTagChips();
  }
});

projectTagsInput?.addEventListener("blur", () => {
  setTimeout(() => {
    tagSuggestList.classList.remove("open");
  }, 120);
});

tagSuggestList?.addEventListener("click", (e) => {
  const item = e.target.closest(".tag-suggest-item");
  if (!item) return;

  const tag = item.dataset.tag;
  addTag(tag);
  projectTagsInput.value = "";
  tagSuggestList.innerHTML = "";
  tagSuggestList.classList.remove("open");
});

tagChipList?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-remove-tag]");
  if (!btn) return;

  const idx = Number(btn.dataset.removeTag);
  if (Number.isNaN(idx)) return;

  tagItems.splice(idx, 1);
  renderTagChips();
});

(function init() {
  if (adminMenu) {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    adminMenu.style.display = isAdmin ? "block" : "none";
  }

  bindCategoryEvents();
  refreshAndRender();
})();