document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chatWindow");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const summaryBox = document.getElementById("chatSummary");
  const detailBox = document.getElementById("profileDetail");
  const chatLayout = document.querySelector(".chat-layout");

  // 1. quiz1.js 또는 공통 레포트에서 저장해둔 데이터 바인딩 로드
  let quizCommon = null;
  try {
    const raw =
      sessionStorage.getItem("quizCommonAnswers") ||
      sessionStorage.getItem("quizResultPayload");
    quizCommon = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("설문 데이터 파싱 실패:", e);
  }

  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "사용자";

  // ==========================================================================
  // ⚡️ [핵심 수정] quiz1.js의 10개 문항 ID와 1:1 매칭 데이터 매퍼 엔진
  // ==========================================================================
  function renderSummary() {
    if (!quizCommon || !Array.isArray(quizCommon.answers)) {
      summaryBox.innerHTML = `
        <div class="chat-summary-title">설문 응답 정보 없음</div>
        <div class="chat-summary-item">
          <div class="chat-summary-label">안내</div>
          <div>공통 질문 설문을 완료한 뒤 '대화형으로 전환'을 선택해 주세요.</div>
        </div>
      `;

      if (detailBox) {
        detailBox.innerHTML = `
          <div class="profile-panel-header">
            <div class="profile-panel-title">${nickname}님의 개발 프로필</div>
          </div>
          <div class="profile-panel-body">
            아직 공통 설문 응답 기록이 존재하지 않습니다.
          </div>
        `;
      }
      return;
    }

    // id 기준으로 매핑 딕셔너리 빌드
    const map = {};
    quizCommon.answers.forEach(a => {
      map[a.id] = a;
    });

    // 배열 형태의 다중 선택과 단일 선택 데이터를 안전하게 파싱하는 유틸 함수
    const getValue = (id) => {
      const target = map[id];
      if (!target || target.value === undefined || target.value === null) return "-";
      if (Array.isArray(target.value)) {
        return target.value.length ? target.value.join(", ") : "-";
      }
      return target.value;
    };

    // 💡 quiz1.js에 명시된 10개 핵심 ID 실시간 동기화 바인딩
    const currentStatus   = getValue("currentStatus");     // 현재 상황
    const experience      = getValue("experience");        // 경험 기간
    const knownLangs      = getValue("knownLangs");        // 사용 언어
    const frameworkExp    = getValue("frameworkExp");      // 사용 스택
    const interestDev     = getValue("interestDevField");  // 관심 개발 영역
    const targetRole      = getValue("targetRole");        // 되고 싶은 개발자 유형
    const projectPref     = getValue("projectPreference"); // 프로젝트 성향
    const learningStyle   = getValue("learningStyle");     // 학습 스타일
    const studyTime       = getValue("studyTime");         // 학습 시간
    const shortTermGoal   = getValue("shortTermGoal");     // 단기 목표

    // 1. 좌측 상단 미니 프로필 요약창 채우기
    summaryBox.innerHTML = `
      <div class="chat-summary-header">
        <div class="chat-summary-title">${nickname} 님의 설문 프로필 요약</div>
        <button id="profileToggleBtn" class="chat-summary-toggle">자세히 보기 ▶</button>
      </div>

      <div class="chat-summary-item">
        <div class="chat-summary-label">현재 상황</div>
        <div>${currentStatus}</div>
      </div>
      
      <div class="chat-summary-item">
        <div class="chat-summary-label">희망 직군</div>
        <div>${targetRole}</div>
      </div>

      <div class="chat-summary-item">
        <div class="chat-summary-label">경험 기간</div>
        <div>${experience}</div>
      </div>

      <div class="chat-summary-item">
        <div class="chat-summary-label">사용 언어</div>
        <div>${knownLangs}</div>
      </div>
    `;

    // 2. 우측 확장 패널 세부 정보 채우기 (정확히 매칭된 문항 데이터만 깔끔하게 노출)
    if (detailBox) {
      detailBox.innerHTML = `
        <div class="profile-panel-header">
          <div class="profile-panel-title">${nickname}님의 질문 선택 답변 보기</div>
        </div>

        <div class="profile-panel-body">
          <ul class="profile-detail-list">
            <li class="profile-row">
              <div class="profile-row-label">현재 상황</div>
              <div class="profile-row-value">${currentStatus}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">경험 기간</div>
              <div class="profile-row-value">${experience}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">보유 언어 스택</div>
              <div class="profile-row-value">${knownLangs}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">경험한 기술 프레임워크</div>
              <div class="profile-row-value">${frameworkExp}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">관심 개발 영역</div>
              <div class="profile-row-value">${interestDev}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">목표 직군 트랙</div>
              <div class="profile-row-value">${targetRole}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">선호 프로젝트 성향</div>
              <div class="profile-row-value">${projectPref}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">가장 편한 학습 스타일</div>
              <div class="profile-row-value">${learningStyle}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">주간 학습 시간</div>
              <div class="profile-row-value">${studyTime}</div>
            </li>

            <li class="profile-row">
              <div class="profile-row-label">6개월 내 단기 목표</div>
              <div class="profile-row-value">${shortTermGoal}</div>
            </li>
          </ul>
        </div>
      `;

      // 3. 토글 핸들러 바인딩 (동적 생성된 버튼에 정확히 이벤트 주입)
      const toggleBtn = document.getElementById("profileToggleBtn");
      if (toggleBtn && chatLayout) {
        // 현재 클래스 유무를 기반으로 상태 체크하여 버그 방지
        toggleBtn.addEventListener("click", () => {
          const isOpen = chatLayout.classList.toggle("profile-open");
          toggleBtn.textContent = isOpen ? "간단히 보기 ◀" : "자세히 보기 ▶";
        });
      }
    }
  }

  // 데이터 바인딩 런처 구동
  renderSummary();

  // ==========================================================================
  // CORE CHAT SYSTEM (채팅 인터랙션 제어)
  // ==========================================================================
  function appendBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.innerText = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  let conversation = [];

  function initConversation() {
    const intro = `${nickname}님, 안녕하세요! 👋 \nPROVI입니다. 아까 입력해주신 공통 설문 내용을 바탕으로, 원하시는 방향에 맞춰 기술 스택과 학습 순서를 함께 설계해볼게요.`;
    const guide = `예를 들어 이런 식으로 물어보실 수 있어요.\n- "프론트엔드로 취업하고 싶은데 어떤 스택 순서로 공부할까요?"\n- "웹이랑 AI 둘 다 관심 있는데, 어떤 쪽이 더 맞을까요?"\n- "제가 선택한 희망 직군에 맞는 백엔드 스택도 같이 추천해 주세요."`;

    appendBubble("bot", intro);
    appendBubble("bot", guide);

    conversation.push({ role: "assistant", content: intro + "\n\n" + guide });
  }

  initConversation();

  const CHAT_API_URL = "/api/chat";

  async function sendToServer(userMessage) {
    const quizAnswersForBackend = (quizCommon && Array.isArray(quizCommon.answers)) ? quizCommon.answers : [];
    
    const payload = {
      messages: [
        ...conversation,
        { role: "user", content: userMessage }
      ],
      quizAnswers: quizAnswersForBackend,
      nickname
    };

    const data = await authFetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return data.reply || JSON.stringify(data);
  }

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendBubble("user", text);
    conversation.push({ role: "user", content: text });

    chatInput.value = "";
    chatInput.style.height = "auto";
    chatInput.focus();

    sendBtn.disabled = true;
    chatInput.disabled = true;

    let loadingBubble = document.createElement("div");
    loadingBubble.className = "chat-bubble bot";
    loadingBubble.innerText = "추천 내용을 정리하고 있어요...";
    chatWindow.appendChild(loadingBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      const reply = await sendToServer(text);
      chatWindow.removeChild(loadingBubble);
      appendBubble("bot", reply);
      conversation.push({ role: "assistant", content: reply });
    } catch (err) {
      console.error(err);
      chatWindow.removeChild(loadingBubble);
      appendBubble("bot", "서버와 통신 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });
});