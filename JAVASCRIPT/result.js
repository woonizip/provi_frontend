document.addEventListener("DOMContentLoaded", async () => {
  const contentEl = document.getElementById("resultContent");
  const backToQuiz = document.getElementById("backToQuiz");
  const toChat = document.getElementById("toChat");
  const retrySame = document.getElementById("retrySame");

  // 1. quiz 공통 응답 불러오기
  let quizAnswers = null;
  try {
    const raw = sessionStorage.getItem("quizResultPayload");
    quizAnswers = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("quizCommonAnswers 파싱 실패:", e);
  }

  // 2. 화면 테스트용 샘플 결과 (fallback)
  const mockResult = {
    role: "백엔드 개발자",
    role_icon: "🖥",
    summary:
      "안정적인 서버·API 개발과 데이터 처리에 강점을 가진 백엔드형 개발자에 가까워요.",
    stacks: [
      { name: "Spring Boot", category: "Java 프레임워크", icon: "🍃" },
      { name: "PostgreSQL", category: "관계형 데이터베이스 (RDBMS)", icon: "🗄" },
      { name: "Java", category: "백엔드 기반 언어", icon: "☕" },
      { name: "AWS", category: "클라우드 서비스 플랫폼", icon: "☁️" },
      { name: "Docker", category: "컨테이너 기반 배포", icon: "🐳" },
      { name: "Redis", category: "인메모리 데이터베이스", icon: "⚡" }
    ],
    roadmap: [
      "Java 기본 문법과 객체지향(OOP) 개념을 정리해요.",
      "Spring Boot로 REST API를 만들고, 간단한 로그인/게시판 서비스를 구현해봐요.",
      "PostgreSQL로 테이블 설계·조인·인덱스 등을 익히면서 쿼리 튜닝을 연습해요.",
      "Docker로 애플리케이션을 컨테이너로 묶고, AWS EC2에 올려보며 배포 흐름을 경험해요.",
      "Redis·캐시 전략, 로깅·모니터링 등을 추가해 실제 서비스와 비슷한 구조를 만들어봐요."
    ],
    reasons: [
      {
        stack: "Spring Boot",
        reason:
          "안정적인 생태계를 가진 Java 기반 프레임워크로, 백엔드 입문부터 실무까지 폭넓게 사용할 수 있어요."
      },
      {
        stack: "PostgreSQL",
        reason:
          "관계형 데이터베이스 표준에 가깝고, 강력한 기능을 무료로 제공해 중·대규모 서비스에 많이 사용돼요."
      },
      {
        stack: "Java",
        reason:
          "대규모 서버·금융·공공 시스템에서 여전히 널리 쓰이며, 객체지향 설계를 익히기에 좋은 언어예요."
      },
      {
        stack: "AWS",
        reason:
          "실무에서 가장 많이 쓰이는 클라우드 플랫폼 중 하나로, 서버 배포·운영 경험을 쌓기에 적합해요."
      },
      {
        stack: "Docker",
        reason:
          "개발 환경과 배포 환경을 통일해주어, 나중에 팀 개발·DevOps 환경으로 확장하기 쉬워져요."
      },
      {
        stack: "Redis",
        reason:
          "세션 저장·캐시·큐 등에서 자주 쓰이는 인메모리 데이터베이스로, 성능 튜닝에 큰 도움이 돼요."
      }
    ]
  };

  // 3. 백엔드에서 결과 받아오기 (POST)

  const RESULT_API_URL = "/api/result"; // 스프링에서 맞춰줄 엔드포인트

  async function fetchResultFromBackend() {
    // 설문 데이터 자체가 없으면 바로 mockResult
    if (!quizAnswers || !Array.isArray(quizAnswers.answers)) {
      console.warn("quizCommonAnswers 없음 → mockResult 사용");
      return mockResult;
    }

    try {
      const payload = {
        // 백엔드에서 이 구조대로 DTO 만들면 됨
        answers: quizAnswers.answers
      };

      const res = await authFetch(RESULT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 응답이 비어있을 때도 대비
      if (!res || typeof res !== "object") {
        console.warn("백엔드 응답 형식 이상 → mockResult 사용");
        return mockResult;
      }

      // chat에서 이어쓰기 위해 저장 (선택사항이지만 써두면 좋음)
      try {
        sessionStorage.setItem("quizResult", JSON.stringify(res));
      } catch (e) {
        console.warn("quizResult 저장 실패:", e);
      }

      return res;
    } catch (err) {
      console.warn("백엔드 통신 실패 → mockResult 사용:", err);
      return mockResult;
    }
  }

  // 4. 렌더링 함수

  function renderResult(data) {
    if (!data) {
      contentEl.innerHTML =
        '<div class="result-state">결과 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>';
      return;
    }

    const {
      role,
      role_icon,
      summary,
      stacks = [],
      roadmap = [],
      reasons = []
    } = data;

    // 스택 카드
    const stacksHtml = stacks
      .map(
        (s) => `
      <div class="stack-card">
        <div class="stack-main">
          <div class="stack-icon">${s.icon || "🔧"}</div>
          <div>
            <div class="stack-name">${s.name}</div>
            <div class="stack-category">${s.category || ""}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // 학습 로드맵
    const roadmapHtml = roadmap
      .map(
        (step, idx) => `
      <li class="roadmap-item">
        <div class="roadmap-step">${idx + 1}</div>
        <div class="roadmap-text">${step}</div>
      </li>
    `
      )
      .join("");

    // 추천 이유
    const reasonsHtml = reasons
      .map(
        (r) => `
      <li>
        <div class="reason-item-title">${r.stack || ""}</div>
        <div class="reason-item-body">${r.reason || ""}</div>
      </li>
    `
      )
      .join("");

    contentEl.innerHTML = `
      <!-- 상단 요약 -->
      <section class="result-role-row">
        <div class="result-role-main">
          <span class="result-role-chip">추천 직군</span>
          <div class="result-role-name">${role || "분석 중"}</div>
          <div class="result-role-icon">${role_icon || "💻"}</div>
        </div>
        <p class="result-role-sub">
          ${summary || "설문 응답을 기반으로 분석된 결과예요."}
        </p>
      </section>

      <!-- 추천 스택 -->
      <section class="section-block">
        <h2 class="section-title">추천 기술 스택</h2>
        <div class="stack-grid">
          ${stacksHtml}
        </div>
      </section>

      <!-- 학습 로드맵 & 추천 이유 -->
      <section class="result-bottom-row">
        <div class="roadmap-box section-block">
          <h2 class="section-title">학습 로드맵</h2>
          <ol class="roadmap-list">
            ${roadmapHtml}
          </ol>
        </div>

        <div class="reasons-box section-block">
          <h2 class="section-title">추천 이유</h2>
          <ul class="reason-list">
            ${reasonsHtml}
          </ul>
        </div>
      </section>
    `;
  }

  // 5. 실제 로딩 & 렌더링
  const resultData = await fetchResultFromBackend();
  renderResult(resultData);

  // 6. 버튼 동작
  backToQuiz?.addEventListener("click", () => {
    window.location.href = "quiz.html";
  });

  toChat?.addEventListener("click", () => {
    try {
      const raw = sessionStorage.getItem("quizResultPayload");
      if (raw) {
        sessionStorage.setItem("quizCommonAnswers", raw);
      }
    } catch (e) {
      console.warn("chat 이동용 설문 데이터 저장 실패:", e);
    }

    window.location.href = "chat.html";
  });

  retrySame?.addEventListener("click", () => {
    // 같은 조건으로 다시 분석 → 단순 새로고침
    window.location.reload();
  });
  
  const saveAndGoMypage = document.getElementById("saveAndGoMypage");

  saveAndGoMypage?.addEventListener("click", () => {
    try {
      // 1. 현재 화면에 노출 중인 최종 AI 추천 결과 객체 수집
      const currentResult = sessionStorage.getItem("quizResult");
      const currentPayload = sessionStorage.getItem("quizResultPayload");

      if (currentResult) {
        // 2. 마이페이지가 로컬/세션 어디서든 읽을 수 있도록 양방향 스토리지 동기화 락킹
        localStorage.setItem("quizResult", currentResult);
        sessionStorage.setItem("quizResult", currentResult);
      }
      if (currentPayload) {
        localStorage.setItem("quizResultPayload", currentPayload);
        sessionStorage.setItem("quizResultPayload", currentPayload);
      }

      alert("🎉 추천 결과와 5단계 로드맵이 내 마이페이지에 안전하게 보관되었습니다!");
      
      // 3. 마이페이지 대시보드로 안전하게 라우팅 이동
      window.location.href = "mypage.html";
    } catch (e) {
      console.error("마이페이지 데이터 보관 중 오작동 발생:", e);
      window.location.href = "mypage.html";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const nickname = sessionStorage.getItem("nickname");
  const allowAnonymous = sessionStorage.getItem("allowAnonymousResult") === "true";

  if (!nickname && !allowAnoymous) {
    const goLogin = confirm ("로그인 후 이용할 수 있는 서비스입니다. \n로그인 페이지로 이동하시겠습니까>");

    if (goLogin) {
      window.location.href = "../HTML/signin.html";
    } else {
        window.location.href = "../HTML/stack.html";
    }
    return;
  }

  sessionStorage.removeItem("allowAnonymousResult");
})