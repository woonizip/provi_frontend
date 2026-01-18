const $ = (id) => document.getElementById(id);

/* =========================
  API Endpoints (Spring Boot)
========================= */
const API = {
  LIST: "/api/teamproject",                 // GET  : 전체 프로젝트 리스트
  CREATE: "/api/teamproject",               // POST : 프로젝트 생성
  JOIN: "/api/teamproject/join",            // POST : 프로젝트 참여
  DELETE: (projectId) => `/api/teamproject/${projectId}`, // DELETE : 프로젝트 삭제
};

/* =========================
  Elements
========================= */
const grid = $("grid");
const createBtn = $("createBtn");
const myProjectsBtn = $("myProjectsBtn");
const seedBtn = $("seedBtn");      // 있으면 유지(원하면 제거 가능)
const clearBtn = $("clearBtn");    // 있으면 유지(원하면 제거 가능)
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

/* =========================
  State
========================= */
let activeCategory = "ALL";
let activeSubStatus = "ALL";
let onlyMyProjects = false;

let projectsCache = []; // API에서 받은 원본/정규화 데이터

/* =========================
  Utils
========================= */
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
    case "FE": return "프론트엔드(UI)";
    case "BE": return "백엔드";
    case "API": return "API/연동";
    case "DATA": return "DB/데이터";
    case "AI": return "AI/추천";
    case "QA": return "테스트/품질";
    case "PM": return "기획/PM";
    default: return v;
  }
}

function roleListLabel(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return arr.map(roleLabel).join(", ");
}

/* =========================
  Auth (sessionStorage)
  - 네 signin.js와 동일: nickname만 사용
========================= */
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

/* =========================
  Project Normalize
========================= */
function normalizeProject(p) {
  const members = Array.isArray(p.members) ? p.members : (Array.isArray(p.memberList) ? p.memberList : []);
  const neededRoles = Array.isArray(p.neededRoles) ? p.neededRoles : (Array.isArray(p.needRoles) ? p.needRoles : []);

  // 팀장 닉네임 후보들
  const leaderName =
    p.leaderName ??
    p.leader ??
    p.createdByNickname ??
    p.createdBy ??
    p.ownerNickname ??
    (members.find((m) => m?.isLeader)?.userName) ??
    "Unknown";

  return {
    id: p.id ?? p.projectId,
    title: p.title ?? p.name ?? "Untitled",
    content: p.content ?? p.description ?? "",
    category: p.category ?? "ETC",
    subStatus: p.subStatus ?? "IN_PROGRESS",
    tags: Array.isArray(p.tags) ? p.tags : [],
    neededRoles,
    members,
    createdAt: p.createdAt ?? p.createdDate ?? "",
    leaderName,
  };
}

/* =========================
  Owner / Member checks (nickname 기준)
========================= */
function isOwner(p, nickname) {
  return !!nickname && String(p.leaderName || "").trim() === nickname;
}

function isMember(p, nickname) {
  if (!nickname) return false;
  return (p.members || []).some((m) => String(m.userName || m.nickname || "").trim() === nickname);
}

/* =========================
  API helpers
========================= */
async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // 일부 DELETE는 body 없을 수 있음
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return null;
}

/* =========================
  Data Load
========================= */
async function loadProjects() {
  try {
    const data = await apiFetch(API.LIST, { method: "GET" });
    const list = Array.isArray(data) ? data : (data?.items || []);
    projectsCache = list.map(normalizeProject);
  } catch (e) {
    projectsCache = [];
    grid.innerHTML = `<div class="error">서버 오류: ${escapeHtml(e.message)}</div>`;
  }
}

/* =========================
  Render
========================= */
function render() {
  const nickname = getNickname();
  const q = (projectSearch?.value || "").trim().toLowerCase();

  let projects = [...projectsCache];

  // "내가 참여한 팀 프로젝트 보기"
  if (onlyMyProjects && nickname) {
    projects = projects.filter((p) => isOwner(p, nickname) || isMember(p, nickname));
  }

  if (activeCategory !== "ALL") {
    projects = projects.filter((p) => p.category === activeCategory);
  }

  if (activeSubStatus !== "ALL") {
    projects = projects.filter((p) => p.subStatus === activeSubStatus);
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

  // draw
  grid.innerHTML = "";
  if (countBadge) countBadge.textContent = `${projects.length} projects`;
  if (emptyState) emptyState.style.display = projects.length === 0 ? "block" : "none";

  projects.forEach((p) => {
    const tagsHtml = (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    const owner = isOwner(p, nickname);
    const member = isMember(p, nickname);

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
  Filters
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
  Create Modal (기존 생성 모달 그대로)
========================= */
function openCreateModal() {
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => projectName.focus(), 0);

  // 기본값
  projectCategory.value = projectCategory.value || "WEB";
  projectSubStatus.value = projectSubStatus.value || "IN_PROGRESS";

  // neededRoles 기본 체크(원하는대로 조정 가능)
  [...neededRolesWrap.querySelectorAll("input[type='checkbox']")].forEach((cb) => {
    if (cb.checked === false) cb.checked = ["FE", "BE"].includes(cb.value);
  });
}

function closeCreateModal() {
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
  Join Role Modal (새 모달: 참여자 역할만 선택)
========================= */
let joinModalEl = null;

function ensureJoinModal() {
  if (joinModalEl) return;

  joinModalEl = document.createElement("div");
  joinModalEl.id = "joinRoleModal";
  joinModalEl.style.cssText = `
    position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); z-index: 9999;
  `;

  joinModalEl.innerHTML = `
    <div style="
      width: min(520px, 92vw);
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 18px 18px 14px 18px;
      color: #e5e7eb;
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div id="joinModalTitle" style="font-size:16px; font-weight:700;">프로젝트 참여</div>
          <div id="joinModalSub" style="margin-top:4px; font-size:12px; opacity:0.8;">
            모집 중인 역할 중 하나를 선택하세요.
          </div>
        </div>
        <button id="joinModalX" style="
          width: 34px; height:34px; border-radius:10px; border:1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06); color:#e5e7eb; cursor:pointer;
        ">✕</button>
      </div>

      <div id="joinModalProjectName" style="margin-top:14px; font-size:14px; font-weight:600;"></div>

      <div id="joinRoleList" style="margin-top:12px; display:flex; flex-direction:column; gap:10px;"></div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
        <button id="joinModalCancel" style="
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color:#e5e7eb; cursor:pointer;
        ">취소</button>

        <button id="joinModalConfirm" style="
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(59,130,246,0.55);
          background: rgba(59,130,246,0.9);
          color:white; cursor:pointer; font-weight:700;
        ">참여하기</button>
      </div>
    </div>
  `;

  document.body.appendChild(joinModalEl);

  // backdrop click 닫기
  joinModalEl.addEventListener("click", (e) => {
    if (e.target === joinModalEl) hideJoinModal();
  });
  joinModalEl.querySelector("#joinModalX").addEventListener("click", hideJoinModal);
  joinModalEl.querySelector("#joinModalCancel").addEventListener("click", hideJoinModal);
}

let joinContext = { projectId: null, pickedRole: null };

function showJoinModal(project) {
  ensureJoinModal();
  joinContext = { projectId: project.id, pickedRole: null };

  const titleEl = joinModalEl.querySelector("#joinModalTitle");
  const nameEl = joinModalEl.querySelector("#joinModalProjectName");
  const listEl = joinModalEl.querySelector("#joinRoleList");

  titleEl.textContent = "프로젝트 참여";
  nameEl.textContent = project.title ? `프로젝트: ${project.title}` : "프로젝트 참여";

  const roles = Array.isArray(project.neededRoles) ? project.neededRoles : [];
  listEl.innerHTML = "";

  if (roles.length === 0) {
    listEl.innerHTML = `<div style="opacity:0.85; font-size:13px;">현재 모집 중인 역할이 없습니다.</div>`;
    joinContext.pickedRole = null;
  } else {
    roles.forEach((r, idx) => {
      const id = `joinRole_${idx}`;
      const item = document.createElement("label");
      item.setAttribute("for", id);
      item.style.cssText = `
        display:flex; align-items:center; gap:10px;
        padding: 10px 12px;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        background: rgba(255,255,255,0.04);
        cursor: pointer;
      `;
      item.innerHTML = `
        <input type="radio" name="joinRoleRadio" id="${id}" value="${escapeHtml(r)}" style="transform:scale(1.05);" ${idx === 0 ? "checked" : ""}/>
        <div style="display:flex; flex-direction:column;">
          <div style="font-weight:700;">${escapeHtml(roleLabel(r))}</div>
          <div style="font-size:12px; opacity:0.75;">코드: ${escapeHtml(r)}</div>
        </div>
      `;
      listEl.appendChild(item);

      if (idx === 0) joinContext.pickedRole = r;
    });

    listEl.querySelectorAll("input[name='joinRoleRadio']").forEach((radio) => {
      radio.addEventListener("change", () => {
        joinContext.pickedRole = radio.value;
      });
    });
  }

  // confirm handler (매번 최신 context로)
  const confirmBtn = joinModalEl.querySelector("#joinModalConfirm");
  confirmBtn.onclick = async () => {
    if (!requireLoginOrRedirect()) return;

    const nickname = getNickname();
    const projectId = joinContext.projectId;
    const role = joinContext.pickedRole;

    if (!projectId) {
      alert("프로젝트 정보가 없습니다.");
      return;
    }
    if (!role) {
      alert("참여할 역할을 선택하세요.");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "처리 중...";

    try {
      // 백엔드: nickname + projectId + role
      await apiFetch(API.JOIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, nickname, role }),
      });

      hideJoinModal();
      await refreshAndRender();
      alert(`참여 완료\n역할: ${roleLabel(role)}`);
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

/* =========================
  Create (API)
========================= */
async function createProjectToServer() {
  if (!requireLoginOrRedirect()) return;

  const nickname = getNickname();
  const title = projectName.value.trim();
  const content = projectDesc.value.trim();
  const tags = normalizeTags(projectTags.value);
  const category = projectCategory.value;
  const subStatus = projectSubStatus.value;
  const selectedMyRole = myRole.value;

  const neededRoles = [...neededRolesWrap.querySelectorAll("input[type='checkbox']:checked")]
    .map((cb) => cb.value)
    .filter(Boolean);

  if (!title) {
    alert("프로젝트 이름을 입력해주세요!");
    projectName.focus();
    return;
  }
  if (neededRoles.length === 0) {
    alert("필요 역할을 최소 1개 이상 선택해주세요!");
    return;
  }

  // 백엔드에 넘길 payload (닉네임만)
  const payload = {
    nickname,      // 생성자 닉네임(팀장)
    title,
    content,
    category,
    subStatus,
    tags,
    neededRoles,
    myRole: selectedMyRole, // 생성자가 선택한 "내 역할"도 전달 (원하면 백엔드에서 members에 leader로 반영)
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

/* =========================
  Delete (API)
========================= */
async function deleteProjectFromServer(projectId) {
  if (!requireLoginOrRedirect()) return;
  const nickname = getNickname();

  try {
    // 닉네임도 필요하면 query/body로 받게 백엔드 맞추기
    // 여기서는 DELETE body 허용되는 서버라 가정(스프링은 가능)
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

/* =========================
  Refresh + Render
========================= */
async function refreshAndRender() {
  await loadProjects();
  render();
}

/* =========================
  Events
========================= */
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

grid?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  const nickname = getNickname();
  const p = projectsCache.find((x) => String(x.id) === String(id));
  if (!p) return;

  if (action === "open") {
    alert(
      `[${p.title}]\n\n카테고리: ${categoryLabel(p.category)}\n상태: ${subStatusLabel(p.subStatus)}\n필요 역할: ${roleListLabel(p.neededRoles)}\n태그: ${(p.tags || []).join(", ")}`
    );
    return;
  }

  if (action === "delete") {
    if (!requireLoginOrRedirect()) return;
    if (!isOwner(p, nickname)) {
      alert("삭제 권한이 없습니다. (프로젝트 생성자만 삭제 가능)");
      return;
    }
    const ok = confirm("이 프로젝트를 삭제할까요?");
    if (!ok) return;
    await deleteProjectFromServer(p.id);
    return;
  }

  if (action === "join") {
    if (!requireLoginOrRedirect()) return;

    if (isOwner(p, nickname)) {
      alert("프로젝트 생성자는 자동 참여 상태입니다.");
      return;
    }
    if (isMember(p, nickname)) {
      alert("이미 참여한 프로젝트입니다.");
      return;
    }

    // prompt 대신 역할 선택 모달
    showJoinModal(p);
    return;
  }
});

/* =========================
  Optional: seed/clear 버튼 처리
========================= */
seedBtn?.addEventListener("click", () => {
  alert("현재는 백엔드(API) 기반입니다. Seed는 백엔드에서 처리하거나 기능을 제거하세요.");
});
clearBtn?.addEventListener("click", () => {
  alert("현재는 백엔드(API) 기반입니다. Clear는 백엔드에서 처리하거나 기능을 제거하세요.");
});

/* =========================
  Init
========================= */
(function init() {
  // admin menu (기존 유지)
  if (adminMenu) {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    adminMenu.style.display = isAdmin ? "block" : "none";
  }

  bindCategoryEvents();

  // 최초 로딩
  refreshAndRender();
})();
