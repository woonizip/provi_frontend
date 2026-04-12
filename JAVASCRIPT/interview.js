const questionSelect = document.getElementById("questionSelect");
const questionPreview = document.getElementById("questionPreview");
const answerInput = document.getElementById("answerInput");
const charCount = document.getElementById("charCount");
const resetBtn = document.getElementById("resetBtn");
const feedbackBtn = document.getElementById("feedbackBtn");
const loadingBox = document.getElementById("loadingBox");
const resultBox = document.getElementById("resultBox");
const resultStatus = document.getElementById("resultStatus");

const API = {
  QUESTIONS: "/api/interview/questions",
  FEEDBACK: "/api/interview/feedback"
};

let questions = [];
let selectedQuestion = null;

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

async function loadQuestions() {
  try {
    const data = await apiFetch(API.QUESTIONS, {
      method: "GET"
    });

    questions = Array.isArray(data) ? data : [];

    questionSelect.innerHTML = `
      <option value="">질문을 선택하세요</option>
      ${questions.map(q => `
        <option value="${q.id}">${q.question}</option>
      `).join("")}
    `;
  } catch (error) {
    questionSelect.innerHTML = `<option value="">질문을 불러오지 못했습니다</option>`;
    questionPreview.textContent = "질문 목록을 불러오지 못했습니다.";
    console.error(error);
  }
}

questionSelect.addEventListener("change", () => {
  const selectedId = questionSelect.value;

  selectedQuestion =
    questions.find((q) => String(q.id) === String(selectedId)) || null;

  questionPreview.textContent = selectedQuestion
    ? selectedQuestion.question
    : "선택한 질문이 여기에 표시됩니다.";
});

answerInput.addEventListener("input", () => {
  charCount.textContent = `${answerInput.value.length}자`;
});

resetBtn.addEventListener("click", () => {
  questionSelect.value = "";
  selectedQuestion = null;
  questionPreview.textContent = "선택한 질문이 여기에 표시됩니다.";
  answerInput.value = "";
  charCount.textContent = "0자";
  resultStatus.textContent = "대기 중";
  loadingBox.classList.add("hidden");

  resultBox.innerHTML = `
    <div class="empty-result">
      질문을 선택하고 답변을 작성한 뒤
      AI 피드백을 받아보세요.
    </div>
  `;
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === "string") return [value];
  return [];
}

function renderFeedback(data) {
  const strengths = toArray(data.strengths);
  const improvements = toArray(data.improvements);
  const tips = toArray(data.tips);

  resultBox.innerHTML = `
    <div class="feedback-section tip">
      <h3>한줄 총평</h3>
      <p>${data.summary || "피드백 결과가 없습니다."}</p>
    </div>

    <div class="feedback-section good">
      <h3>좋았던 점</h3>
      <ul>
        ${strengths.map(item => `<li>${item}</li>`).join("") || "<li>없음</li>"}
      </ul>
    </div>

    <div class="feedback-section warn">
      <h3>보완할 점</h3>
      <ul>
        ${improvements.map(item => `<li>${item}</li>`).join("") || "<li>없음</li>"}
      </ul>
    </div>

    <div class="feedback-section tip">
      <h3>이렇게 수정해보세요</h3>
      <ul>
        ${tips.map(item => `<li>${item}</li>`).join("") || "<li>없음</li>"}
      </ul>
    </div>
  `;
}

feedbackBtn.addEventListener("click", async () => {
  const answer = answerInput.value.trim();

  if (!selectedQuestion) {
    alert("면접 질문을 선택해주세요.");
    return;
  }

  if (!answer) {
    alert("답변을 작성해주세요.");
    answerInput.focus();
    return;
  }

  resultStatus.textContent = "분석 중";
  loadingBox.classList.remove("hidden");
  resultBox.innerHTML = "";

  try {
    const feedback = await authFetch(API.FEEDBACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: selectedQuestion.id,
        answer
      })
    });

    renderFeedback(feedback);
    resultStatus.textContent = "완료";
  } catch (error) {
    resultStatus.textContent = "오류";
    resultBox.innerHTML = `
      <div class="empty-result">
        피드백을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    `;
    console.error(error);
  } finally {
    loadingBox.classList.add("hidden");
  }
});

loadQuestions();