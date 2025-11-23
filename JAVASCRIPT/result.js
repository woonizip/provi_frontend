document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("result-root");
  const btnAgain = document.getElementById("btn-again");
  const btnChat = document.getElementById("btn-chat");
  const btnRetry = document.getElementById("btn-retry");

  const API_URL = "/api/quiz";
  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "사용자";

  // quiz.js 쪽에서 저장해 둔 payload & 옵션
  const rawPayload = sessionStorage.getItem("quizResultPayload");
  const commonOnlyFlag = sessionStorage.getItem("quizResultCommonOnly") === "1";

  if (!rawPayload) {
    root.innerHTML = `
      <div class="result-state">
        설문 결과 정보가 없습니다.<br />
        먼저 설문을 진행한 뒤에 다시 결과 페이지로 이동해주세요.
      </div>
    `;
    return;
  }

  const payload = JSON.parse(rawPayload);

  async function fetchResult() {
    root.innerHTML = `
      <div class="result-state">
        AI가 ${nickname}님의 설문을 분석 중입니다...
      </div>
    `;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawPayload
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderResult(data);
    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div class="result-state">
          서버 통신 중 오류가 발생했습니다.<br />
          잠시 후 다시 시도해주세요.<br /><br />
          <small>${String(err.message || err)}</small>
        </div>
      `;
    }
  }

  function renderResult(result) {
    const s = result?.recommended_stack || {};
    const pct = Math.round((result?.score || 0) * 100);
    const role = result?.role || "분석 불가";

    const reasons = Array.isArray(result?.reasons) ? result.reasons : [];

    // 태그용 간단 요약
    const tagList = [
      ...(result?.highlights || []),
      ...(reasons.slice(0, 3))
    ].filter(Boolean);

    root.innerHTML = `
      <section class="result-panel-primary">
        <div class="result-role-label">추천 직군</div>
        <div class="result-role-main">
          <div class="result-role-name">${role}</div>
          <div class="result-score-pill">
            적합도 ${isNaN(pct) ? "-" : pct + "%"}
          </div>
        </div>

        <div class="result-tags">
          ${tagList.map(t => `<span class="result-tag">${t}</span>`).join("")}
        </div>

        <div class="result-learning">
          <div class="result-learning-title">
            추천 학습 순서
          </div>
          <ol>
            ${(s.learning_path || [])
              .map(step => `<li>${step}</li>`)
              .join("") || "<li>추천 학습 경로 정보가 없습니다.</li>"}
          </ol>
        </div>
      </section>

      <section class="result-panel-secondary">
        <div class="result-section">
          <h3>Frontend</h3>
          <div class="result-chips">
            ${(s.frontend || [])
              .map(x => `<span class="result-chip">${x}</span>`)
              .join("") || "<span class=\"result-chip\">추천 항목 없음</span>"}
          </div>
        </div>

        <div class="result-section">
          <h3>Backend</h3>
          <div class="result-chips">
            ${(s.backend || [])
              .map(x => `<span class="result-chip">${x}</span>`)
              .join("") || "<span class=\"result-chip\">추천 항목 없음</span>"}
          </div>
        </div>

        <div class="result-section">
          <h3>DevOps / Infra</h3>
          <div class="result-chips">
            ${(s.devops || [])
              .map(x => `<span class="result-chip">${x}</span>`)
              .join("") || "<span class=\"result-chip\">추천 항목 없음</span>"}
          </div>
        </div>

        <div class="result-section">
          <h3>Database</h3>
          <div class="result-chips">
            ${(s.db || [])
              .map(x => `<span class="result-chip">${x}</span>`)
              .join("") || "<span class=\"result-chip\">추천 항목 없음</span>"}
          </div>
        </div>
      </section>
    `;
  }

  // 버튼 동작들
  btnAgain?.addEventListener("click", () => {
    // 완전 처음부터 다시
    sessionStorage.removeItem("quizResultPayload");
    sessionStorage.removeItem("quizResultCommonOnly");
    window.location.href = "quiz.html";
  });

  btnChat?.addEventListener("click", () => {
    // 공통 설문 답변은 이미 quiz.js에서 세션에 따로 저장해두고 있다고 가정
    window.location.href = "chat.html";
  });

  btnRetry?.addEventListener("click", () => {
    fetchResult();
  });

  // 최초 1회 호출
  fetchResult();
});
