document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chatWindow");
  const chatForm   = document.getElementById("chatForm");
  const chatInput  = document.getElementById("chatInput");
  const sendBtn    = document.getElementById("chatSendBtn");
  const summaryBox = document.getElementById("chatSummary");

  // ✅ quiz1.js에서 저장해둔 공통 응답 불러오기
  //   quiz1.js 에서 이미:
  //   sessionStorage.setItem("quizCommonAnswers", JSON.stringify(payload));
  //   로 저장하고 chat.html로 이동하고 있음
  let quizCommon = null;
  try {
    const raw = sessionStorage.getItem("quizCommonAnswers");
    quizCommon = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("quizCommonAnswers 파싱 실패:", e);
  }

  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "사용자";

  // ===== 설문 요약 렌더링 =====
  function renderSummary() {
    if (!quizCommon || !Array.isArray(quizCommon.answers)) {
      summaryBox.innerHTML = `
        <div class="chat-summary-title">설문 응답 정보 없음</div>
        <div class="chat-summary-item">
          <div class="chat-summary-label">상황</div>
          <div> 공통 질문 설문을 완료한 뒤, "대화형으로 전환"을 눌러주세요.</div>
        </div>
      `;
      return;
    }

    // id 기준으로 꺼내기 편하게 맵 만들기
    const map = {};
    quizCommon.answers.forEach(a => {
      map[a.id] = a;
    });

    const currentStatus = map["currentStatus"]?.value || "-";
    const targetRole    = map["targetRole"]?.value || "미선택";
    const purpose       = map["purpose"]?.value || "-";
    const experience    = map["experience"]?.value || "-";

    summaryBox.innerHTML = `
      <div class="chat-summary-title">${nickname}님의 설문 요약</div>
      <div class="chat-summary-item">
        <div class="chat-summary-label">현재</div>
        <div>${currentStatus}</div>
      </div>
      <div class="chat-summary-item">
        <div class="chat-summary-label">희망 직군</div>
        <div>${targetRole}</div>
      </div>
      <div class="chat-summary-item">
        <div class="chat-summary-label">경험</div>
        <div>${experience}</div>
      </div>
      <div class="chat-summary-item">
        <div class="chat-summary-label">목적</div>
        <div>${purpose}</div>
      </div>
    `;
  }

  renderSummary();

  // ===== 말풍선 유틸 =====
  function appendBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.innerText = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // ===== 초기 인사 메시지 =====
  let conversation = [];

  function initConversation() {
    const intro = `${nickname}님, 안녕하세요! 👋 
    PROVI입니다. 아까 입력해주신 공통 설문 내용을 바탕으로,
    원하시는 방향에 맞춰 기술 스택과 학습 순서를 함께 설계해볼게요.`;

    const guide = `예를 들어 이런 식으로 물어보실 수 있어요.
    - "프론트엔드로 취업하고 싶은데 어떤 스택 순서로 공부할까요?"
    - "웹이랑 AI 둘 다 관심 있는데, 어떤 쪽이 더 맞을까요?"
    - "제가 선택한 희망 직군에 맞는 백엔드 스택도 같이 추천해 주세요."`;

    appendBubble("bot", intro);
    appendBubble("bot", guide);

    conversation.push({ role: "assistant", content: intro + "\n\n" + guide });
  }

  initConversation();

  // ===== 백엔드 API 설정 =====
  // 👉 실제 스프링/파이썬 서버에서 사용하는 엔드포인트에 맞게 수정
  const CHAT_API_URL = "/api/chat";  // 필요시 "/api/quiz/chat" 등으로 변경

  async function sendToServer(userMessage) {
    // 서버로 보낼 payload 예시
    const payload = {
      messages: [
        ...conversation,
        { role: "user", content: userMessage }
      ],
      quizAnswers: quizCommon || null,
      nickname
    };

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    // 백엔드에서 `{ reply: "문자열" }` 형식으로 돌려준다고 가정
    return data.reply || JSON.stringify(data);
  }

  // ===== 폼 submit 핸들러 =====
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // 유저 버블 추가
    appendBubble("user", text);
    conversation.push({ role: "user", content: text });

    chatInput.value = "";
    chatInput.style.height = "auto";
    chatInput.focus();

    // 버튼/입력 비활성화
    sendBtn.disabled = true;
    chatInput.disabled = true;

    let loadingBubble = document.createElement("div");
    loadingBubble.className = "chat-bubble bot";
    loadingBubble.innerText = "추천 내용을 정리하고 있어요...";
    chatWindow.appendChild(loadingBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      const reply = await sendToServer(text);

      // 로딩 말풍선 교체
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

  // ===== textarea 자동 높이 조절 =====
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  });

  chatInput.addEventListener("keydown", (e) => {
  // Shift + Enter → 줄바꿈 허용
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 기본 줄바꿈 막기

      const text = chatInput.value.trim();
      if (!text) return;

    // 전송 버튼 클릭과 동일 처리
      chatForm.dispatchEvent(new Event("submit"));
    }
  });
});
