const API = {
  COMMUNITY_POSTS: `/api/community/posts`,
  COMMUNITY_POST_DETAIL: (postId) => `/api/community/posts/${postId}`,
  COMMUNITY_POST_LIKE: (postId) => `/api/community/posts/${postId}/like`,
  COMMUNITY_POST_COMMENTS: (postId) => `/api/community/posts/${postId}/comments`,
  COMMUNITY_COMMENT_DETAIL: (commentId) => `/api/community/comments/${commentId}`,
  COMMUNITY_MY_ACTIVITY: `/api/community/me/activity`,
};

// 현재 로그인한 사용자 닉네임
const currentNickname = sessionStorage.getItem("nickname") || "익명사용자";

// 현재 페이지 번호
let currentPageNumber = 1;

// 한 페이지 게시글 수
const pageSize = 10;

// 현재 선택된 카테고리 코드
let selectedCategoryCode = "ALL";

// 현재 선택된 정렬 타입
let selectedSortType = "latest";

// 현재 검색어
let searchKeyword = "";

// 현재 상세 모달에서 보고 있는 게시글 ID
let selectedPostId = null;

// 현재 수정 중인 게시글 ID
let editingPostId = null;

// 현재 수정 중인 댓글 ID
let editingCommentId = null;

// 게시글 목록 데이터
let postList = [];

// 인기 게시글 데이터
let hotPostList = [];

// 내가 쓴 글 목록
let myPostList = [];

// 내가 댓글 단 글 목록
let myCommentedPostList = [];

// 전체 게시글 개수
let totalPostCount = 0;

// 전체 페이지 수
let totalPageCount = 1;

// 현재 상세 게시글 데이터
let selectedPostDetail = null;

const COMMUNITY_CATEGORY_MAP = {
  전체: "ALL",
  자유: "FREE",
  질문: "QUESTION",
  기업정보: "INFO",
  면접후기: "INTERVIEW",
  프로젝트: "PROJECT",
  커리어: "CAREER",
};

const COMMUNITY_CATEGORY_LABEL_MAP = {
  ALL: "전체",
  FREE: "자유",
  QUESTION: "질문",
  INFO: "기업정보",
  INTERVIEW: "면접후기",
  PROJECT: "프로젝트",
  CAREER: "커리어",
};

/**
 * 인기 게시물 선정을 위한 정밀 알고리즘 상수 정의 (원하는 수치로 커스텀 가능)
 */
const HOT_MIN_LIKE_COUNT = 5;    // 최소 추천수 5개 이상 필수 만족
const HOT_MIN_COMMENT_COUNT = 3; // 최소 댓글수 3개 이상 필수 만족
const HOT_TIME_LIMIT_HOURS = 48; // 최근 48시간(이틀) 이내에 작성된 글만 후보 진입

function getCategoryCodeFromFormValue(value) {
  if (!value) return "";
  if (COMMUNITY_CATEGORY_MAP[value]) {
    return COMMUNITY_CATEGORY_MAP[value];
  }
  return value;
}

function getPostIdValue(post) {
  return post?.postId ?? post?.id ?? null;
}

const communityPostListEl = document.getElementById("communityPostList");
const communityPaginationEl = document.getElementById("communityPagination");
const hotPostGridEl = document.getElementById("hotPostGrid");
const writerRankListEl = document.getElementById("writerRankList");

const categoryButtons = document.querySelectorAll(".community-category-btn");
const filterButtons = document.querySelectorAll(".post-filter-btn");
const searchInputEl = document.getElementById("communitySearchInput");
const searchBtnEl = document.getElementById("communitySearchBtn");
const openWriteModalBtn = document.getElementById("openWriteModalBtn");
const openMyActivityBtn = document.getElementById("openMyActivityBtn");
const showHotPostsBtn = document.getElementById("showHotPostsBtn");

const postDetailModalEl = document.getElementById("postDetailModal");
const postFormModalEl = document.getElementById("postFormModal");
const myActivityModalEl = document.getElementById("myActivityModal");

const detailBadgesEl = document.getElementById("detailBadges");
const detailTitleEl = document.getElementById("detailTitle");
const detailAuthorEl = document.getElementById("detailAuthor");
const detailAuthorRoleEl = document.getElementById("detailAuthorRole");
const detailDateEl = document.getElementById("detailDate");
const detailViewEl = document.getElementById("detailView");
const detailBodyEl = document.getElementById("detailBody");
const detailLikeBtnEl = document.getElementById("detailLikeBtn");
const detailOwnerActionsEl = document.getElementById("detailOwnerActions");
const detailCommentCountEl = document.getElementById("detailCommentCount");
const detailCommentListEl = document.getElementById("detailCommentList");
const detailCommentInputEl = document.getElementById("detailCommentInput");
const submitCommentBtnEl = document.getElementById("submitCommentBtn");

const postFormEl = document.getElementById("postForm");
const postFormTitleEl = document.getElementById("postFormTitle");
const postCategoryEl = document.getElementById("postCategory");
const postTitleInputEl = document.getElementById("postTitleInput");
const postContentInputEl = document.getElementById("postContentInput");
const postAnonymousInputEl = document.getElementById("postAnonymousInput");
const postFormSubmitBtnEl = document.getElementById("postFormSubmitBtn");

const myPostsPanelEl = document.getElementById("myPostsPanel");
const myCommentsPanelEl = document.getElementById("myCommentsPanel");
const myActivityTabs = document.querySelectorAll(".my-activity-tab");

function goToMainPage() {
  location.href = "mainpage.html";
}

function isLoggedIn() {
  return !!sessionStorage.getItem("token");
}

function requireLogin() {
  if (isLoggedIn()) return true;
  const ok = confirm("로그인 후 이용할 수 있는 서비스입니다. 로그인 페이지로 이동하시겠습니까?");
  if (ok) {
    location.href = "signin.html";
  }
  return false;
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
  const openedModal = document.querySelector(".community-modal:not(.hidden)");
  if (!openedModal) {
    document.body.style.overflow = "";
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function getCategoryLabel(categoryCode) {
  const code = normalizeCommunityCategory(categoryCode);
  return COMMUNITY_CATEGORY_LABEL_MAP[code] || categoryCode || "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSummaryText(content, max = 110) {
  const text = String(content || "").replace(/\n/g, " ");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function isAnonymousPost(post) {
  return !!(post?.anonymous || post?.isAnonymous);
}

function isMinePost(post) {
  return !!post?.mine;
}

function closeAllMoreMenus() {
  document.querySelectorAll(".post-more-menu.open").forEach((menu) => {
    menu.classList.remove("open");
  });
}

function renderPostMoreButton(post) {
  if (!isMinePost(post)) return "";
  const postId = getPostIdValue(post);
  return `
    <div class="post-more-wrap" data-more-wrap>
      <button
        type="button"
        class="post-more-btn"
        data-more-btn
        data-post-id="${postId}"
        aria-label="게시글 더보기"
      >⋯</button>
      <div class="post-more-menu" data-more-menu>
        <button type="button" class="post-more-action edit" data-action="edit" data-post-id="${postId}">
          수정
        </button>
        <button type="button" class="post-more-action delete" data-action="delete" data-post-id="${postId}">
          삭제
        </button>
      </div>
    </div>
  `;
}

// ==========================================================================
// 🔥 인기 게시물 정밀 스코어링 알고리즘 로직 구역
// ==========================================================================
function getHotScore(post) {
  const likes = post?.likeCount || 0;
  const comments = post?.commentCount || 0;
  const views = post?.viewCount || 0;

  // 가중치 스코어: 추천 5점, 댓글 3점, 조회수 0.1점
  let baseScore = (likes * 5) + (comments * 3) + (views * 0.1);

  // 시간 경과에 따른 감쇄 처리 (과거 인기글이 상단을 독점하는 고임 방지)
  const postDate = new Date(post?.createdAt || post?.createdDate || Date.now());
  const now = new Date();
  const diffHours = Math.max(1, (now - postDate) / (1000 * 60 * 60));

  return baseScore / Math.pow(diffHours, 1.2);
}

function sortPostsForHot(posts = []) {
  const now = new Date();

  return [...posts]
    .filter((post) => {
      const likes = post?.likeCount || 0;
      const comments = post?.commentCount || 0;
      
      const postDate = new Date(post?.createdAt || post?.createdDate || 0);
      const diffHours = (now - postDate) / (1000 * 60 * 60);

      // 내가 방금 쓰고 좋아요 1개 누른 글 차단 (최소 추천 혹은 최소 댓글 만족 필수)
      const isQualified = (likes >= HOT_MIN_LIKE_COUNT) || (comments >= HOT_MIN_COMMENT_COUNT);
      // 최근 48시간 이내 생성된 프레시한 글 가드
      const isFresh = diffHours <= HOT_TIME_LIMIT_HOURS;

      return isQualified && isFresh;
    })
    .sort((a, b) => getHotScore(b) - getHotScore(a));
}

// ==========================================================================
// ⚙️ [완벽 구현] 게시글 목록 조회 & 페이징 슬라이스 엔진
// ==========================================================================
async function fetchCommunityPostList() {
  const params = new URLSearchParams({
    page: String(currentPageNumber),
    size: String(pageSize),
    category: selectedCategoryCode || "ALL",
    sort: selectedSortType || "latest",
    keyword: searchKeyword || "",
  });

  const data = await authFetch(`${API.COMMUNITY_POSTS}?${params.toString()}`, {
    method: "GET",
  });

  const rawList = Array.isArray(data.content) ? data.content : [];

  postList = rawList;
  totalPostCount = data.totalElements ?? rawList.length;
  totalPageCount = data.totalPages ?? Math.max(1, Math.ceil(totalPostCount / pageSize));

  // 2. 검색어 필터 가이드
  if (searchKeyword.trim()) {
    const q = searchKeyword.trim().toLowerCase();
    rawList = rawList.filter((post) => {
      const hay = [
        post.title,
        post.content,
        post.summary,
        post.authorNickname,
        post.categoryLabel,
        getCategoryLabel(post.category),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  // 3. 필터 정렬 스위칭
  if (selectedSortType === "popular") {
    rawList.sort((a, b) => {
      const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
      if (likeDiff !== 0) return likeDiff;
      return (b.commentCount || 0) - (a.commentCount || 0);
    });
  } else if (selectedSortType === "comments") {
    rawList.sort((a, b) => {
      const commentDiff = (b.commentCount || 0) - (a.commentCount || 0);
      if (commentDiff !== 0) return commentDiff;
      return (b.likeCount || 0) - (a.likeCount || 0);
    });
  } else {
    rawList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  // 4. [페이지네이션 10개씩 분할 처리 알고리즘 연동]
  totalPostCount = rawList.length;
  totalPageCount = Math.max(1, Math.ceil(totalPostCount / pageSize));
  
  if (currentPageNumber > totalPageCount) currentPageNumber = totalPageCount;

  const startIndex = (currentPageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // 최종적으로 10개만 정확하게 슬라이싱 처리
  postList = rawList.slice(startIndex, endIndex);
}
// 인기 게시글 데이터 연동 로드
async function fetchHotPostList() {
  const params = new URLSearchParams({
    page: "1",
    size: "50", 
    category: "ALL",
    sort: "latest",
    keyword: "",
  });

  const data = await authFetch(`${API.COMMUNITY_POSTS}?${params.toString()}`, {
    method: "GET",
  });
  
  const rawList = data.content || [];
  hotPostList = sortPostsForHot(rawList).slice(0, 3);

  // 세이프 가드: 검증 조건을 통과한 글이 초기 단계라 0개일 경우, 추천수 베스트 순위로 채워두기
  if (hotPostList.length === 0 && rawList.length > 0) {
    hotPostList = [...rawList]
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 3);
  }
}

// 게시글 상세 조회
async function fetchCommunityPostDetail(postId) {
  const data = await authFetch(API.COMMUNITY_POST_DETAIL(postId), {
    method: "GET",
  });
  selectedPostDetail = data;
}

// 게시글 작성
async function createCommunityPost() {
  const createPostPayload = {
    category: getCategoryCodeFromFormValue(postCategoryEl.value),
    title: postTitleInputEl.value.trim(),
    content: postContentInputEl.value.trim(),
    anonymous: postAnonymousInputEl ? postAnonymousInputEl.checked : false,
  };

  return await authFetch(API.COMMUNITY_POSTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPostPayload),
  });
}

// 게시글 수정
async function updateCommunityPost(postId) {
  const updatePostPayload = {
    category: getCategoryCodeFromFormValue(postCategoryEl.value),
    title: postTitleInputEl.value.trim(),
    content: postContentInputEl.value.trim(),
    anonymous: postAnonymousInputEl ? postAnonymousInputEl.checked : false,
  };

  return await authFetch(API.COMMUNITY_POST_DETAIL(postId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatePostPayload),
  });
}

// 게시글 삭제
async function deleteCommunityPost(postId) {
  return await authFetch(API.COMMUNITY_POST_DETAIL(postId), {
    method: "DELETE",
  });
}

// 댓글 작성
async function createCommunityComment(postId) {
  const createCommentPayload = {
    content: detailCommentInputEl.value.trim(),
    anonymous: false,
  };

  return await authFetch(API.COMMUNITY_POST_COMMENTS(postId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createCommentPayload),
  });
}

// 댓글 수정
async function updateCommunityComment(commentId, content) {
  const updateCommentPayload = {
    content,
    anonymous: false,
  };

  return await authFetch(API.COMMUNITY_COMMENT_DETAIL(commentId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateCommentPayload),
  });
}

// 댓글 삭제
async function deleteCommunityComment(commentId) {
  return await authFetch(API.COMMUNITY_COMMENT_DETAIL(commentId), {
    method: "DELETE",
  });
}

// 게시글 좋아요
async function toggleCommunityPostLike(postId) {
  return await authFetch(API.COMMUNITY_POST_LIKE(postId), {
    method: "POST",
  });
}

// 내 활동 조회
async function fetchMyCommunityActivity() {
  const data = await authFetch(API.COMMUNITY_MY_ACTIVITY, {
    method: "GET",
  });
  myPostList = data?.myPosts || [];
  myCommentedPostList = data?.myCommentedPosts || [];
}

function renderHotPostList() {
  if (!hotPostGridEl) return;
  if (!hotPostList.length) {
    hotPostGridEl.innerHTML = `<div class="empty-message">인기 게시글이 없습니다.</div>`;
    return;
  }

  hotPostGridEl.innerHTML = hotPostList
    .map((post) => {
      const postId = getPostIdValue(post);
      return `
        <article class="highlight-card" data-post-id="${postId ?? ""}">
          <div class="highlight-card-top">
            ${post.hot ? `<div class="highlight-badge hot">HOT</div>` : `<div class="highlight-badge recommend">TOP</div>`}
            ${isAnonymousPost(post) ? `<div class="highlight-badge anonymous">익명</div>` : ""}
          </div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.summary || getSummaryText(post.content || ""))}</p>
          <div class="highlight-meta">
            <span>${escapeHtml(post.categoryLabel || getCategoryLabel(post.category))}</span>
            <span>추천 ${post.likeCount || 0}</span>
            <span>댓글 ${post.commentCount || 0}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPostList() {
  if (!communityPostListEl) return;
  if (!postList.length) {
    communityPostListEl.innerHTML = `<div class="empty-message">선택하신 조건에 맞는 게시글이 없습니다.</div>`;
    renderPagination();
    return;
  }

  communityPostListEl.innerHTML = postList
    .map((post) => {
      const postId = getPostIdValue(post);
      const authorNickname = post.authorNickname || "알 수 없음";
      const displayNickname = isAnonymousPost(post) ? "익명" : authorNickname;
      return `
        <article class="community-post-item" data-post-id="${postId ?? ""}">
          <div class="community-post-top">
            <div class="community-post-badges">
              <span class="community-post-badge category">
                ${escapeHtml(post.categoryLabel || getCategoryLabel(post.category))}
              </span>
              ${post.hot ? `<span class="community-post-badge hot">HOT</span>` : ""}
              ${isAnonymousPost(post) ? `<span class="community-post-badge anonymous">익명</span>` : ""}
            </div>
            <div class="community-post-top-right">
              <span class="community-post-date">${formatDate(post.createdAt)}</span>
              ${renderPostMoreButton(post)}
            </div>
          </div>
          <h3 class="community-post-title">${escapeHtml(post.title)}</h3>
          <p class="community-post-content">${escapeHtml(post.summary || getSummaryText(post.content || ""))}</p>
          <div class="community-post-bottom">
            <div class="community-post-author">
              <div class="community-post-avatar">${escapeHtml(displayNickname.slice(0, 2))}</div>
              <div class="community-post-author-info">
                <span class="community-post-author-name">${escapeHtml(displayNickname)}</span>
                <span class="community-post-author-role">${escapeHtml(post.authorRoleLabel || "")}</span>
              </div>
            </div>
            <div class="community-post-stats">
              <span>추천 ${post.likeCount || 0}</span>
              <span>댓글 ${post.commentCount || 0}</span>
              <span>조회 ${post.viewCount || 0}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  renderPagination();
}

function renderPagination() {
  if (!communityPaginationEl) return;
  communityPaginationEl.innerHTML = "";

  for (let i = 1; i <= totalPageCount; i += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `page-btn ${i === currentPageNumber ? "active" : ""}`;
    button.textContent = i;

    button.addEventListener("click", async () => {
      currentPageNumber = i;
      await loadPostList();
      window.scrollTo({ top: 350, behavior: "smooth" }); 
    });

    communityPaginationEl.appendChild(button);
  }
}

function renderWriterRankList() {
  if (!writerRankListEl) return;
  const merged = [...postList, ...hotPostList];
  const uniquePosts = [];
  const seenPostIds = new Set();

  merged.forEach((post) => {
    const postId = getPostIdValue(post);
    if (!postId || seenPostIds.has(postId)) return;
    seenPostIds.add(postId);
    uniquePosts.push(post);
  });

  const authorScoreMap = {};
  uniquePosts.forEach((post) => {
    if (isAnonymousPost(post)) return;
    const nickname = post.authorNickname;
    if (!nickname) return;

    if (!authorScoreMap[nickname]) {
      authorScoreMap[nickname] = { score: 0, postCount: 0 };
    }
    authorScoreMap[nickname].score += (post.likeCount || 0) + (post.commentCount || 0);
    authorScoreMap[nickname].postCount += 1;
  });

  const rankList = Object.entries(authorScoreMap)
    .map(([nickname, info]) => ({
      nickname,
      score: info.score,
      postCount: info.postCount,
    }))
    .sort((a, b) => b.score - a.score || b.postCount - a.postCount)
    .slice(0, 3);

  if (!rankList.length) {
    writerRankListEl.innerHTML = `<div class="empty-message">표시할 작성자가 없습니다.</div>`;
    return;
  }

  writerRankListEl.innerHTML = rankList
    .map((item, index) => `
      <div class="writer-rank-item">
        <span class="rank-num">${index + 1}</span>
        <span class="writer-name">${escapeHtml(item.nickname)}</span>
        <span class="writer-score">+${item.score}</span>
      </div>
    `)
    .join("");
}

function renderPostDetail() {
  if (!selectedPostDetail) return;

  detailBadgesEl.innerHTML = `
    <span class="community-post-badge category">
      ${escapeHtml(selectedPostDetail.categoryLabel || getCategoryLabel(selectedPostDetail.category))}
    </span>
    ${selectedPostDetail.hot ? `<span class="community-post-badge hot">HOT</span>` : ""}
    ${isAnonymousPost(selectedPostDetail) ? `<span class="community-post-badge anonymous">익명</span>` : ""}
  `;

  detailTitleEl.textContent = selectedPostDetail.title || "";
  const detailDisplayNickname = isAnonymousPost(selectedPostDetail) ? "익명" : (selectedPostDetail.authorNickname || "");
  detailAuthorEl.textContent = `작성자 ${detailDisplayNickname}`;
  detailAuthorRoleEl.textContent = selectedPostDetail.authorRoleLabel || "";
  detailDateEl.textContent = formatDate(selectedPostDetail.createdAt);
  detailViewEl.textContent = `조회 ${selectedPostDetail.viewCount || 0}`;
  detailBodyEl.textContent = selectedPostDetail.content || "";
  detailLikeBtnEl.textContent = `추천 ${selectedPostDetail.likeCount || 0}`;
  detailCommentCountEl.textContent = `${selectedPostDetail.commentCount || 0}개`;

  renderDetailOwnerActions();
  renderCommentList();
}

function renderDetailOwnerActions() {
  if (!detailOwnerActionsEl || !selectedPostDetail) return;
  if (!selectedPostDetail.mine) {
    detailOwnerActionsEl.innerHTML = "";
    return;
  }

  const postId = getPostIdValue(selectedPostDetail);
  detailOwnerActionsEl.innerHTML = `
    <div class="post-more-wrap detail-more" data-more-wrap>
      <button
        type="button"
        class="post-more-btn"
        data-more-btn
        data-post-id="${postId}"
        aria-label="상세 더보기"
      >⋯</button>
      <div class="post-more-menu" data-more-menu>
        <button type="button" class="post-more-action edit" data-action="edit" data-post-id="${postId}">
          수정
        </button>
        <button type="button" class="post-more-action delete" data-action="delete" data-post-id="${postId}">
          삭제
        </button>
      </div>
    </div>
  `;
}

function renderCommentList() {
  if (!detailCommentListEl || !selectedPostDetail) return;
  const comments = selectedPostDetail.comments || [];

  if (!comments.length) {
    detailCommentListEl.innerHTML = `<div class="empty-message">아직 댓글이 없습니다.</div>`;
    return;
  }

  detailCommentListEl.innerHTML = comments
    .map((comment) => {
      return `
        <div class="comment-item" data-comment-id="${comment.commentId}">
          <div class="comment-top">
            <span class="comment-author">${escapeHtml(comment.authorNickname || "")}</span>
            <span class="comment-date">${formatDate(comment.createdAt)}</span>
          </div>
          <div class="comment-text">${escapeHtml(comment.content || "")}</div>
          ${
            comment.mine
              ? `
              <div class="detail-owner-actions" style="margin-top:10px;">
                <button type="button" class="detail-edit-btn comment-edit-btn" data-comment-id="${comment.commentId}" data-comment-content="${encodeURIComponent(comment.content || "")}">
                  댓글 수정
                </button>
                <button type="button" class="detail-delete-btn comment-delete-btn" data-comment-id="${comment.commentId}">
                  댓글 삭제
                </button>
              </div>
            `
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderMyActivity() {
  if (!myPostsPanelEl || !myCommentsPanelEl) return;

  if (!myPostList.length) {
    myPostsPanelEl.innerHTML = `<div class="empty-message">작성한 게시글이 없습니다.</div>`;
  } else {
    myPostsPanelEl.innerHTML = myPostList
      .map((post) => {
        const postId = getPostIdValue(post);
        return `
          <div class="my-activity-item" data-post-id="${postId ?? ""}">
            <div class="my-activity-item-top">
              <span class="community-post-badge category">
                ${escapeHtml(post.categoryLabel || getCategoryLabel(post.category))}
              </span>
              <span class="community-post-date">${formatDate(post.createdAt)}</span>
            </div>
            <h3 class="my-activity-item-title">${escapeHtml(post.title)}</h3>
            <p class="my-activity-item-desc">${escapeHtml(post.summary || "")}</p>
          </div>
        `;
      })
      .join("");
  }

  if (!myCommentedPostList.length) {
    myCommentsPanelEl.innerHTML = `<div class="empty-message">댓글 단 게시글이 없습니다.</div>`;
  } else {
    myCommentsPanelEl.innerHTML = myCommentedPostList
      .map((post) => {
        const postId = getPostIdValue(post);
        return `
          <div class="my-activity-item" data-post-id="${postId ?? ""}">
            <div class="my-activity-item-top">
              <span class="community-post-badge category">
                ${escapeHtml(post.categoryLabel || getCategoryLabel(post.category))}
              </span>
              <span class="community-post-date">${formatDate(post.myCommentCreatedAt || post.createdAt)}</span>
            </div>
            <h3 class="my-activity-item-title">${escapeHtml(post.title)}</h3>
            <p class="my-activity-item-desc">내 댓글: ${escapeHtml(post.myCommentContent || "")}</p>
          </div>
        `;
      })
      .join("");
  }
}

async function loadPostList() {
  try {
    await fetchCommunityPostList();
    renderPostList();
    renderWriterRankList();
  } catch (error) {
    console.error(error);
    if (communityPostListEl) {
      communityPostListEl.innerHTML = `<div class="empty-message">게시글 목록을 불러오지 못했습니다.</div>`;
    }
  }
}

async function loadHotPostList() {
  try {
    await fetchHotPostList();
    renderHotPostList();
    renderWriterRankList();
  } catch (error) {
    console.error(error);
    if (hotPostGridEl) {
      hotPostGridEl.innerHTML = `<div class="empty-message">인기 게시글을 불러오지 못했습니다.</div>`;
    }
  }
}

async function loadPostDetail(postId) {
  try {
    selectedPostId = postId;
    await fetchCommunityPostDetail(postId);
    renderPostDetail();
    openModal(postDetailModalEl);
  } catch (error) {
    console.error(error);
    alert("게시글 상세를 불러오지 못했습니다.");
  }
}

async function loadMyActivity() {
  try {
    await fetchMyCommunityActivity();
    renderMyActivity();
  } catch (error) {
    console.error(error);
    alert("내 활동을 불러오지 못했습니다.");
  }
}

async function loadCommunityPage() {
  await Promise.all([
    loadPostList(),
    loadHotPostList(),
  ]);
}

function openWriteModal() {
  if (!requireLogin()) return;
  editingPostId = null;
  postFormTitleEl.textContent = "게시글 작성";
  postFormSubmitBtnEl.textContent = "등록";
  postFormEl.reset();
  openModal(postFormModalEl);
}

function openEditModal() {
  if (!selectedPostDetail) return;
  if (!selectedPostDetail.mine) return;

  editingPostId = getPostIdValue(selectedPostDetail);
  postFormTitleEl.textContent = "게시글 수정";
  postFormSubmitBtnEl.textContent = "수정 완료";

  postCategoryEl.value = getCategoryLabel(selectedPostDetail.category || "");
  postTitleInputEl.value = selectedPostDetail.title || "";
  postContentInputEl.value = selectedPostDetail.content || "";

  if (postAnonymousInputEl) {
    postAnonymousInputEl.checked = !!selectedPostDetail.anonymous;
  }

  closeModal(postDetailModalEl);
  openModal(postFormModalEl);
}

async function handleSubmitPostForm(event) {
  event.preventDefault();
  if (!requireLogin()) return;

  const category = postCategoryEl.value;
  const title = postTitleInputEl.value.trim();
  const content = postContentInputEl.value.trim();

  if (!category || !title || !content) {
    alert("카테고리, 제목, 내용을 모두 입력해주세요.");
    return;
  }

  try {
    if (editingPostId) {
      await updateCommunityPost(editingPostId);
      alert("게시글이 수정되었습니다.");
    } else {
      await createCommunityPost();
      alert("게시글이 등록되었습니다.");
    }

    closeModal(postFormModalEl);
    currentPageNumber = 1;
    await loadCommunityPage();
  } catch (error) {
    console.error(error);
    alert(editingPostId ? "게시글 수정에 실패했습니다." : "게시글 등록에 실패했습니다.");
  }
}

async function handleDeletePost() {
  if (!requireLogin()) return;
  if (!selectedPostDetail?.mine) return;

  const postId = getPostIdValue(selectedPostDetail);
  if (!postId) {
    alert("게시글 ID를 찾을 수 없습니다.");
    return;
  }

  const ok = confirm("게시글을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    await deleteCommunityPost(postId);
    alert("게시글이 삭제되었습니다.");
    closeModal(postDetailModalEl);
    await loadCommunityPage();
  } catch (error) {
    console.error(error);
    alert("게시글 삭제에 실패했습니다.");
  }
}

// [실시간 보완] 내가 댓글을 등록하는 순간, 타인이 쓴 댓글까지 결합하여 스크롤 리프레시
async function handleSubmitComment() {
  if (!requireLogin()) return;
  if (!selectedPostId) return;

  const commentContent = detailCommentInputEl.value.trim();
  if (!commentContent) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  try {
    // 1. 내가 작성한 댓글을 먼저 백엔드 포스트 엔드포인트로 전송
    await createCommunityComment(selectedPostId);
    
    // 2. 인풋을 비우기 전 서버로부터 최신 댓글 데이터베이스 리스트를 통째로 다시 긁어옴 (레이스 컨디션 동기화)
    await fetchCommunityPostDetail(selectedPostId);
    
    // 3. 인풋 청소 및 UI 자동 reload 그리프팅
    detailCommentInputEl.value = "";
    renderPostDetail();
    await loadPostList();
    
  } catch (error) {
    console.error(error);
    alert("댓글 등록에 실패했습니다.");
  }
}

// [실시간 보완] 추천 토글 처리 후 즉시 새로고침 반영
async function handleToggleLike() {
  if (!requireLogin()) return;
  if (!selectedPostId) return;

  try {
    const data = await toggleCommunityPostLike(selectedPostId);
    
    // 서버에서 리턴된 최신 스펙을 즉시 주입
    if (selectedPostDetail) {
      selectedPostDetail.likeCount = data.likeCount ?? selectedPostDetail.likeCount;
      selectedPostDetail.likedByMe = data.liked ?? selectedPostDetail.likedByMe;
    }
    
    // 상세 모달 데이터와 백그라운드 전체 메인 게시판 목록 동시 릴레이 새로고침
    await fetchCommunityPostDetail(selectedPostId);
    renderPostDetail();
    await loadCommunityPage();
    
  } catch (error) {
    console.error(error);
    alert("추천 처리에 실패했습니다.");
  }
}

async function handleEditComment(commentId, oldContent) {
  if (!requireLogin()) return;
  const newContent = prompt("댓글을 수정하세요.", oldContent || "");
  if (newContent === null) return;
  if (!newContent.trim()) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  try {
    await updateCommunityComment(commentId, newContent.trim());
    await loadPostDetail(selectedPostId);
  } catch (error) {
    console.error(error);
    alert("댓글 수정에 실패했습니다.");
  }
}

async function handleDeleteComment(commentId) {
  if (!requireLogin()) return;
  const ok = confirm("댓글을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    await deleteCommunityComment(commentId);
    await loadPostDetail(selectedPostId);
    await loadPostList();
  } catch (error) {
    console.error(error);
    alert("댓글 삭제에 실패했습니다.");
  }
}

function normalizeCommunityCategory(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (COMMUNITY_CATEGORY_MAP[raw]) {
    return COMMUNITY_CATEGORY_MAP[raw];
  }
  const upper = raw.toUpperCase();
  if (COMMUNITY_CATEGORY_LABEL_MAP[upper]) {
    return upper;
  }
  return raw;
}

function getPostCategoryCode(post) {
  return normalizeCommunityCategory(
    post.category ?? post.categoryCode ?? post.categoryLabel ?? ""
  );
}

// 상단 카테고리 클릭 핸들러 (실시간 동적 렌더링 동기화)
categoryButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const categoryLabel = button.dataset.category || "전체";
    selectedCategoryCode = COMMUNITY_CATEGORY_MAP[categoryLabel] || "ALL";
    currentPageNumber = 1; // 카테고리 변경 시 항상 1페이지 가이드 스위칭

    await loadPostList();
  });
});

// 정렬 클릭
filterButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    selectedSortType = button.dataset.sort || "latest";
    currentPageNumber = 1;

    await loadPostList();
  });
});

// 검색
searchBtnEl?.addEventListener("click", async () => {
  searchKeyword = searchInputEl.value.trim();
  currentPageNumber = 1;
  await loadPostList();
});

searchInputEl?.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    searchKeyword = searchInputEl.value.trim();
    currentPageNumber = 1;
    await loadPostList();
  }
});

// 글쓰기
openWriteModalBtn?.addEventListener("click", openWriteModal);

// 내 활동
openMyActivityBtn?.addEventListener("click", async () => {
  if (!requireLogin()) return;
  await loadMyActivity();
  openModal(myActivityModalEl);
});

// 인기 더보기
showHotPostsBtn?.addEventListener("click", async () => {
  selectedSortType = "popular";
  currentPageNumber = 1;
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  document.querySelector('.post-filter-btn[data-sort="popular"]')?.classList.add("active");

  await loadPostList();
  window.scrollTo({ top: 350, behavior: "smooth" });
});

// [실시간 보완] 게시글 목록 클릭 -> 상세 모달 열기 및 자동 갱신
communityPostListEl?.addEventListener("click", async (event) => {
  if (event.target.closest("[data-more-wrap]")) return;
  const postItem = event.target.closest(".community-post-item");
  if (!postItem) return;
  const postId = postItem.dataset.postId;
  if (!postId || postId === "undefined" || postId === "null") {
    console.error("잘못된 postId:", postId);
    return;
  }
  
  // 상세 데이터 조회 후 모달을 열고, 목록의 조회수 수치도 실시간 동기화
  await loadPostDetail(postId);
  await fetchCommunityPostList();
  renderPostList();
});

// 인기 게시글 클릭 -> 상세 동일 적용
hotPostGridEl?.addEventListener("click", async (event) => {
  const postItem = event.target.closest(".highlight-card");
  if (!postItem) return;
  const postId = postItem.dataset.postId;
  if (!postId || postId === "undefined" || postId === "null") {
    console.error("잘못된 postId:", postId);
    return;
  }
  await loadPostDetail(postId);
  await fetchCommunityPostList();
  renderPostList();
});

// 게시글 작성/수정 submit
postFormEl?.addEventListener("submit", handleSubmitPostForm);

// 댓글 등록
submitCommentBtnEl?.addEventListener("click", handleSubmitComment);

// 추천
detailLikeBtnEl?.addEventListener("click", handleToggleLike);

// 댓글 수정/삭제
detailCommentListEl?.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".comment-edit-btn");
  const deleteBtn = event.target.closest(".comment-delete-btn");

  if (editBtn) {
    const commentId = editBtn.dataset.commentId;
    const oldContent = editBtn.dataset.commentContent || "";
    await handleEditComment(commentId, oldContent);
    return;
  }

  if (deleteBtn) {
    const commentId = deleteBtn.dataset.commentId;
    await handleDeleteComment(commentId);
  }
});

// 내 활동 게시글 클릭 -> 상세
document.addEventListener("click", async (event) => {
  const activityItem = event.target.closest(".my-activity-item");
  if (!activityItem) return;
  const postId = activityItem.dataset.postId;
  if (!postId || postId === "undefined" || postId === "null") {
    console.error("잘못된 postId:", postId);
    return;
  }
  closeModal(myActivityModalEl);
  await loadPostDetail(postId);
});

// 내 활동 탭
myActivityTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    myActivityTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");

    const targetTab = tab.dataset.tab;
    document.querySelectorAll(".my-activity-panel").forEach((panel) => {
      panel.classList.remove("active");
    });

    if (targetTab === "posts") {
      myPostsPanelEl.classList.add("active");
    } else {
      myCommentsPanelEl.classList.add("active");
    }
  });
});

// [실시간 보완] 상세창을 닫을 때 최종 데이터를 메인 대시보드 리스트에 새로고침 바인딩
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", async () => {
    const modalId = button.dataset.close;
    const modalEl = document.getElementById(modalId);
    closeModal(modalEl);
    
    // 상세 창이나 글쓰기 창이 닫히면 전체 메인 보드를 무조건 리로드
    if (modalId === "postDetailModal" || modalId === "postFormModal") {
      await loadCommunityPage();
    }
  });
});

// ESC 버튼 클로저 가드 대응
document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape") {
    let needRefresh = false;
    [postDetailModalEl, postFormModalEl, myActivityModalEl].forEach((modalEl) => {
      if (modalEl && !modalEl.classList.contains("hidden")) {
        if (modalEl.id === "postDetailModal" || modalEl.id === "postFormModal") {
          needRefresh = true;
        }
        closeModal(modalEl);
      }
    });
    
    if (needRefresh) {
      await loadCommunityPage();
    }
  }
});

document.addEventListener("click", async (event) => {
  const moreBtn = event.target.closest("[data-more-btn]");
  const moreAction = event.target.closest("[data-action]");

  if (moreBtn) {
    event.stopPropagation();
    const wrap = moreBtn.closest("[data-more-wrap]");
    const menu = wrap?.querySelector("[data-more-menu]");
    if (!menu) return;

    const isOpen = menu.classList.contains("open");
    closeAllMoreMenus();

    if (!isOpen) {
      menu.classList.add("open");
    }
    return;
  }

  if (moreAction) {
    event.stopPropagation();
    const action = moreAction.dataset.action;
    const postId = moreAction.dataset.postId;
    if (!postId) return;

    closeAllMoreMenus();

    if (action === "edit") {
      if (selectedPostDetail && String(getPostIdValue(selectedPostDetail)) === String(postId)) {
        openEditModal();
        return;
      }
      await loadPostDetail(postId);
      openEditModal();
      return;
    }

    if (action === "delete") {
      if (!selectedPostDetail || String(getPostIdValue(selectedPostDetail)) !== String(postId)) {
        await fetchCommunityPostDetail(postId);
      }
      await handleDeletePost();
    }
  } else {
    closeAllMoreMenus();
  }
});

detailCommentInputEl?.addEventListener("keydown", async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await handleSubmitComment();
  }
});

document.querySelectorAll(".tag-list button").forEach((button) => {
  button.addEventListener("click", async () => {
    const keyword = button.textContent.replace("#", "").trim();
    searchKeyword = keyword;
    if (searchInputEl) {
      searchInputEl.value = keyword;
    }
    currentPageNumber = 1;
    await loadPostList();
  });
});

loadCommunityPage();