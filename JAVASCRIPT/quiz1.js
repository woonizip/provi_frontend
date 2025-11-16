document.addEventListener("DOMContentLoaded", () => {
  const quizBox = document.getElementById('quiz-box');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const btnWrap = document.querySelector('.quiz-btns');
  
  let currentQuestion = 0;
  let answers = {};
  let injectedDevQIndex = null;
  let injectedDevType = null;
  
  const quizData_common = [
    {
      id: "currentStatus",
      q: "현재 본인의 개발 관련 상황은 무엇인가요?",
      a: ["개발을 처음 시작하는 단계예요", "개발을 공부 중이에요 (학생 / 독학)", "취업을 준비 중이에요", "개발 관련 일을 하고 있어요"]
    },
    {
      id: "experience",
      q: "실질적으로 개발 공부나 경험을 쌓은 기간은 얼마나 되셨나요?",
      a: ["6개월 미만", "6개월 ~ 1년", "1년 ~ 3년", "3년 이상"]
    },
    {
      id: "knownLangs",
      q: "지금까지 사용해본 프로그래밍 언어를 모두 선택해주세요.",
      a: ["C / C++", "Java", "Python", "JavaScript / TypeScript", "Rust", "Go", "Kotlin / Swift", "기타"], multiple: true
    },
    {
      id: "projectExp",
      q: "프로젝트 경험(튜토리얼 외)은 어느 정도 있으신가요?",
      a: ["아직 프로젝트를 해본 적 없어요", "개인 프로젝트를 해본 적 있어요", "팀 프로젝트에 참여한 경험이 있어요", "실무 프로젝트를 진행해봤어요"]
    },
    {
      id: "targetRole",
      q: "가장 궁극적으로 되고 싶은 개발자 유형을 선택해주세요.",
      a: ["웹 개발자", "모바일 앱 개발자", "데브옵스 / 클라우드 엔지니어", "AI 개발자", "게임 개발자", "보안 전문가", "임베디드 / IoT 개발자", "아직 잘 모르겠어요"]
    },
    {
      id: "purpose",
      q: "개발을 배우는 주요 목적은 무엇인가요?",
      a: ["취업을 위해", "창업이나 개인 프로젝트를 위해", "연구나 학문적 관심으로", "취미 / 자기계발을 위해"]
    },
    {
      id: "careerGoal",
      q: "장기적으로 가장 가까운 커리어 목표는 무엇인가요?",
      a: ["특정 분야의 전문 개발자로 성장하고 싶어요", "다양한 기술을 익힌 올라운더 개발자가 되고 싶어요", "자신만의 서비스를 만드는 창업형 개발자가 되고 싶어요", " 안정적인 기업에 취업해 커리어를 쌓고 싶어요"]
    },
    {
      id: "wishLangs",
      q: "앞으로 배우거나 관심 있는 언어를 선택해주세요.",
      a: ["JavaScript / TypeScript", "Python", "Java", "Go", "Rust", "Kotlin / Swift", "C / C++", "C#", "기타"]
    },
    {
      id: "learningStyle",
      q: "개발을 배울 때 어떤 방식이 가장 잘 맞는다고 느끼시나요?",
      a: ["직접  만들어보며 배우는 편이에요", "개념을 이해하고 이론부터 배우는 편이에요", "문제를 해결하며 도전적으로 배우는 편이에요", "상황에 따라 유연하게 배우는 편이에요"]
    }
  ];
  
  const quizData_jobs = {
    web: [
      {
        id: "web_area",
        q: "웹 개발 중 어떤 분야에 더 흥미가 있으신가요?",
        a: ["프론트엔드 (화면/UI 구현)", "백엔드 (서버 / 데이터 처리)", "풀스택 (둘 다)", "아직 잘 모르겠어요"]
      },
      {
        id: "web_stack_interest",
        q: "관심 있는 웹 기술/프레임워크가 있다면 선택해주세요.",
        a: ["React", "Vue.js", "Next.js", "Node.js", "Spring Boot", "Django / FastAPI", "기타"], multiple: true
      },
      {
        id: "web_priority",
        q: "웹 서비스 개발에서 가장 중요하다고 생각하는 부분은 무엇인가요?",
        a: ["사용자 경험 (UI/UX)", "속도와 성능", "보안", "데이터베이스 설계", "유지보수와 확장성"]
      },
      {
        id: "web_deploy",
        q: "웹 프로젝트를 배포/운영해본 경험이 있나요?",
        a: ["없어요", "튜토리얼 수준이에요", "개인 프로젝트 배포 경험이 있어요", "팀/실무 프로젝트에서 배포한 적 있어요"]
      }
    ],
    mobile: [
      {
        id: "mobile_platform",
        q: "어떤 플랫폼 개발에 더 관심 있으신가요?",
        a: ["Android", "iOS", "Cross-platform (Flutter, React Native 등)", "아직 잘 모르겠어요"]
      },
      {
        id: "mobile_interest",
        q: "모바일 개발에서 더 흥미로운 부분은 무엇인가요?",
        a: ["UI/애니메이션", "앱 로직/기능 설계", "API 연동/서버 통신", "성능 최적화"]
      },
      {
        id: "mobile_release",
        q: "앱을 직접 배포해본 경험이 있나요?",
        a: ["없어요", "연습용으로 해본 적 있어요", "스토어에 실제로 등록해본 적 있어요"]
      },
      {
        id: "mobile_stack_interest",
        q: "앞으로 다뤄보고 싶은 기술이 있나요?",
        a: ["Kotlin", "Swift", "Flutter", "React Native", "기타"], multiple: true
      }
    ],
    ai: [
      {
        id: "ai_domain",
        q: "AI 분야 중 어떤 영역에 더 관심이 있으신가요?",
        a: ["머신러닝", "딥러닝", "자연어 처리(NLP)", "컴퓨터 비전(CV)", "데이터 분석/시각화", "추천 시스템", "기타"], multiple: true
      },
      {
        id: "ai_train_exp",
        q: "AI 모델을 직접 학습시키거나 실험해본 경험이 있나요?",
        a: ["없어요", "튜토리얼 수준이에요", "직접 실험하거나 모델을 만든 적 있어요"]
      },
      {
        id: "ai_role",
        q: "AI 프로젝트에서 어떤 역할이 더 흥미로우신가요?",
        a: ["데이터 수집/전처리", "모델 설계/학습", "결과 분석/시각화", "AI를 서비스에 적용"]
      },
      {
        id: "ai_stack_interest",
        q: "배우고 싶은 AI 관련 기술이 있다면 선택해주세요.",
        a: ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas/Numpy", "OpenAI API", "기타"], multiple: true
      }
    ],
    security: [
      {
        id: "sec_area",
        q: "보안 분야 중 어떤 영역에 더 관심이 있으신가요?",
        a: ["웹 보안", "네트워크 보안", "시스템 보안", "악성코드 분석", "침투 테스트(펜테스트)"], multiple: true
      },
      {
        id: "sec_cert",
        q: "보안 관련 자격증 취득 계획이 있으신가요?",
        a: ["있어요", "준비할 예정", "관심 없어요"]
      },
      {
        id: "sec_tools",
        q: "보안 관련 툴이나 환경을 사용해본 경험이 있나요?",
        a: ["없어요", "튜토리얼 수준", "CTF/보안 실습 경험", "프로젝트/인턴 경험"]
      },
      {
        id: "sec_interest",
        q: "보안 공부에서 더 흥미로운 부분은 무엇인가요?",
        a: ["취약점 분석/모의 해킹", "로그 분석/대응", "보안 시스템 설계", "보안 자동화/AI 보안"]
      }
    ],
    game: [
      {
        id: "game_type",
        q: "어떤 종류의 게임 개발에 관심이 있으신가요?",
        a: ["2D", "3D", "모바일", "온라인 멀티플레이", "VR/AR", "기타"], multiple: true
      },
      {
        id: "game_engine",
        q: "사용해본 게임 엔진이 있나요?",
        a: ["없어요", "Unity", "Unreal Engine", "Godot", "기타"], multiple: true
      },
      {
        id: "game_role",
        q: "게임 개발에서 어떤 부분이 가장 흥미로우신가요?",
        a: ["그래픽/디자인", "게임 로직/시스템 구현", "AI/물리 엔진", "서버/네트워크"], multiple: true
      },
      {
        id: "game_exp",
        q: "게임을 실제로 제작하거나 배포해본 경험이 있나요?",
        a: ["없어요", "개인 프로젝트 경험", "팀 프로젝트/공모전 경험"]
      }
    ],
    embedded: [
      {
        id: "emb_area",
        q: "어떤 분야의 임베디드 시스템에 더 관심이 있으신가요?",
        a: ["IoT/스마트기기", "로봇/하드웨어 제어", "자동차/산업용 시스템", "펌웨어 개발"], multiple: true
      },
      {
        id: "emb_lang_exp",
        q: "C나 C++ 같은 저수준 언어 경험이 있으신가요?",
        a: ["없어요", "기초 문법만", "간단한 프로젝트 경험", "깊이 있게 사용"]
      },
      {
        id: "emb_hw",
        q: "하드웨어 연동(센서/보드)을 다뤄본 적이 있나요?",
        a: ["없어요", "아두이노/라즈베리파이", "회로나 드라이버를 직접 다룸"]
      },
      {
        id: "emb_stack_interest",
        q: "관심 있는 기술 스택이 있다면 선택해주세요.",
        a: ["C/C++", "Python", "Rust", "RTOS", "기타"], multiple: true
      }
    ],
    devops: [
      {
        id: "devops_focus",
        q: "어떤 데브옵스/클라우드 분야에 더 관심이 있으신가요?",
        a: ["인프라 자동화 (IaC)", "컨테이너/오케스트레이션 (Docker/Kubernetes)", "CI/CD 파이프라인", "관측/모니터링 · SRE"], multiple: true
      },
      {
        id: "devops_tools",
        q: "다뤄봤거나 배우고 싶은 도구를 선택해주세요.",
        a: ["Docker", "Kubernetes", "Terraform", "Ansible", "Helm", "GitHub Actions", "Jenkins", "Argo CD", "Linux", "Bash / Python 스크립팅"], multiple: true
      },
      {
        id: "devops_cloud",
        q: "선호하거나 경험해보고 싶은 클라우드를 선택해주세요.",
        a: ["AWS", "Azure", "GCP", "Naver Cloud", "기타"], multiple: true
      },
      {
        id: "devops_exp",
        q: "배포/자동화 관련 경험 수준은 어느 정도인가요?",
        a: ["없어요", "튜토리얼 수준이에요", "개인/팀 프로젝트에서 CI/CD 구성해봤어요", "실무에서 IaC·Kubernetes 운영해봤어요"]
      }
    ]
  };

  const ROLE_TO_JOBKEY = {
    "웹 개발자": "web",
    "모바일 앱 개발자": "mobile",
    "AI 개발자": "ai",
    "게임 개발자": "game",
    "보안 전문가": "security",
    "임베디드 / IoT 개발자": "embedded",
    "데브옵스 / 클라우드 엔지니어": "devops"
  };

  const API_URL = "/api/quiz";
  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "사용자";

  let stage = "common";
  let commonIdx = 0;
  let jobIdx = 0;
  let jobList = [];
  const answersById = {};

  // 직군 안내 화면 제어
  let jobTitleShown = false;
  let onJobIntro = false;
  
  function isAnswered(item) {
    const v = answersById[item.id];
    return item.multiple ? Array.isArray(v) && v.length>0 : typeof v === "string" && v.length>0;
  }
  function currentItem() {
    if (stage === "common") return quizData_common[commonIdx];
    if (stage === "job")    return jobList[jobIdx];
    return null;
  }
  function totalCount() {
    if (stage === "common") return quizData_common.length;
    if (stage === "job")    return jobList.length;
    return 0;
  }
  function indexInStage() {
    if (stage === "common") return commonIdx;
    if (stage === "job")    return jobIdx;
    return 0;
  }

  function renderBranchChoice() {
  const role = answersById["targetRole"] || "선택 안 함";
  const jobKey = ROLE_TO_JOBKEY[role];
  const hasJobFollowUp = !!(jobKey && quizData_jobs[jobKey]?.length);

  // 분기 화면에서는 아래 이전/다음 버튼 숨기기
  if (btnWrap) btnWrap.style.display = 'none';

  quizBox.innerHTML = `
    <div class="branch-header">
      <div class="branch-icon">🔎</div>
      <div class="branch-texts">
        <div class="branch-title">다음 진행 방식을 선택해주세요</div>
      </div>
    </div>

    <p class="branch-main">
      지금까지의 공통 답변을 바탕으로,<br>
      <span class="branch-em">어떻게 이어갈지</span> 선택하실 수 있어요.
    </p>

    <div class="branch-buttons">
      <button class="quiz-btn branch-btn branch-btn--neutral ${hasJobFollowUp ? "" : "branch-btn--disabled"}"
              id="branch-detail" ${hasJobFollowUp ? "" : "disabled"}>
        ${hasJobFollowUp ? "직군별 세부 질문 계속하기" : "직군별 질문 없음 (직군 미선택)"}
      </button>

      <button class="quiz-btn branch-btn branch-btn--primary" id="branch-chat">
        대화형으로 전환 (채팅으로 추천 받기)
      </button>

      <button class="quiz-btn branch-btn branch-btn--ghost" id="branch-end">
        공통 질문만으로 결과 보기
      </button>
    </div>

    <button class="branch-back" type="button">← 공통 질문 다시 수정하기</button>

    <p class="branch-hint">* 공통 답변을 다시 보고 싶다면 위 버튼을 눌러주세요.</p>
  `;

  // 1) 직군별 세부 질문
  document.getElementById("branch-detail")?.addEventListener("click", () => {
    if (!hasJobFollowUp) return;
    const role = answersById["targetRole"];
    const jobKey = ROLE_TO_JOBKEY[role];
    stage = "job";
    jobList = quizData_jobs[jobKey];
    jobIdx = 0;
    jobTitleShown = false;

    if (btnWrap) btnWrap.style.display = 'flex'; // 버튼 다시 보이게
    render();
  });

  // 2) 대화형으로 전환
  document.getElementById("branch-chat")?.addEventListener("click", () => {
    try {
      const payload = buildPayload(/*commonOnly=*/true);
      sessionStorage.setItem("quizCommonAnswers", JSON.stringify(payload));
    } catch (e) {
      console.warn("세션 저장 실패:", e);
    }
    window.location.href = "chat.html";
  });

  // 3) 공통 질문만으로 결과 보기
  document.getElementById("branch-end")?.addEventListener("click", () => {
    jobList = [];
    jobIdx = 0;
    submitToServer(true);
  });

  // 4) 공통 질문으로 돌아가기
  document.querySelector('.branch-back')?.addEventListener('click', () => {
    stage = "common";
    commonIdx = quizData_common.length - 1;  // 마지막 공통 질문으로
    if (btnWrap) btnWrap.style.display = 'flex'; // 다시 표시
    render();
  });
}

  function render() {
    if (btnWrap && stage !== 'branch') {
      btnWrap.style.display = 'flex';
    }
    // 직군 안내 화면
    if (stage === "job" && !jobTitleShown) {
      const role = answersById["targetRole"];
      quizBox.innerHTML = `
        <div class="section-title">💡 ${nickname}님이 선택하신 <b>${role || "-"}</b>에 대한 추가 질문</div>
        <div class="section-sub">아래 문항에 답해주시면 더 정밀한 스택을 추천해드릴게요.</div>
      `;
      jobTitleShown = true;
      onJobIntro = true;
      prevBtn.disabled = false;
      nextBtn.textContent = "시작하기";
      nextBtn.disabled = false;
      return;
    }

    // 공통 후 분기 선택 화면
    if (stage === "branch") {
      renderBranchChoice();
      return;
    }

    // 일반 질문 화면
    const item = currentItem();
    const idx = indexInStage();
    const total = totalCount();

    onJobIntro = false;
    quizBox.innerHTML = `
      <div class="progress-line"><div class="bar" style="width:${((idx + 1) / total) * 100}%"></div></div>
      <div class="question">${item.q}</div>
      <div class="options" role="group" aria-label="선택지"></div>
    `;

    const wrap = quizBox.querySelector(".options");
    const prevAns = answersById[item.id];

    (item.a || []).forEach(label => {
      const el = document.createElement("div");
      el.className = "option";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.dataset.value = label;
      el.textContent = label;

      // 선택 복원
      if (item.multiple && Array.isArray(prevAns) && prevAns.includes(label)) el.classList.add("selected");
      if (!item.multiple && prevAns === label) el.classList.add("selected");

      const toggle = () => {
        if (item.multiple) {
          el.classList.toggle("selected");
          const selected = Array.from(wrap.querySelectorAll(".option.selected")).map(n => n.dataset.value);
          answersById[item.id] = selected;
        } else {
          wrap.querySelectorAll(".option").forEach(n => n.classList.remove("selected"));
          el.classList.add("selected");
          answersById[item.id] = label;
        }
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });

      wrap.appendChild(el);
    });

    // 버튼 상태
    if (stage === "common") {
      prevBtn.disabled = commonIdx === 0;
      nextBtn.textContent = (commonIdx === quizData_common.length - 1) ? "다음 단계" : "다음";
      nextBtn.disabled = false;
    } else if (stage === "job") {
      prevBtn.disabled = false;
      nextBtn.textContent = (jobIdx === jobList.length - 1) ? "결과 보기" : "다음";
      nextBtn.disabled = false;
    }
  }

  function buildPayload(commonOnly = false) {
    const allQs = commonOnly ? [...quizData_common] : [...quizData_common, ...jobList];
    return {
      answers: allQs.map((q, i) => ({
        index: i,
        id: q.id ?? null,
        question: q.q,
        multiple: !!q.multiple,
        value: answersById[q.id] ?? null
      }))
    };
  }

  async function submitToServer(commonOnly = false) {
    quizBox.innerHTML = `<div class="loading">AI가 결과를 분석 중입니다...</div>`;
    nextBtn.disabled = true; 
    prevBtn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(commonOnly))
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderResult(data);
    } catch (e) {
      quizBox.innerHTML = `<div class="error">서버 오류: ${e.message}</div>`;
      nextBtn.disabled = false; 
      prevBtn.disabled = false;
    }
  }

  function renderResult(result) {
    const s = result?.recommended_stack || {};
    const pct = Math.round((result?.score || 0) * 100);
    quizBox.innerHTML = `
      <h3>✅ 추천 직군: ${result?.role || "-"} <small>(적합도: ${isNaN(pct) ? "-" : pct + "%"})</small></h3>
      <p class="reasons">${(result?.reasons || []).join(" · ")}</p>
      <div class="result-grid">
        <div><h4>Frontend</h4><p>${(s.frontend || []).join(", ")}</p></div>
        <div><h4>Backend</h4><p>${(s.backend || []).join(", ")}</p></div>
        <div><h4>DevOps</h4><p>${(s.devops || []).join(", ")}</p></div>
        <div><h4>DB</h4><p>${(s.db || []).join(", ")}</p></div>
        <div><h4>Learning Path</h4><ol>${(s.learning_path || []).map(x => `<li>${x}</li>`).join("")}</ol></div>
      </div>
      <button id="retryBtn" class="quiz-btn">다시 하기</button>
    `;
    document.getElementById('retryBtn')?.addEventListener('click', () => location.reload());
  }

  nextBtn.addEventListener("click", () => {
    // 직군 안내 화면에서 '시작하기'
    if (stage === "job" && onJobIntro) {
      onJobIntro = false;
      render();
      return;
    }

    // 공통 / 직군 질문에서 유효성 검사
    const item = currentItem();
    if (item && !isAnswered(item)) { 
      alert("하나 이상 선택해주세요."); 
      return; 
    }

    if (stage === "common") {
      if (commonIdx < quizData_common.length - 1) {
        commonIdx += 1;
        render();
      } else {
        // 공통 질문 끝 → 분기 선택 화면으로 이동
        stage = "branch";
        render();
      }
      return;
    }

    if (stage === "job") {
      if (jobIdx < jobList.length - 1) {
        jobIdx += 1;
        render();
      } else {
        submitToServer(false);
      }
    }
  });

  prevBtn.addEventListener("click", () => {
    // 분기 화면에서 '이전' → 공통 마지막 질문으로 복귀
    if (stage === "branch") {
      stage = "common";
      commonIdx = quizData_common.length - 1;
      render();
      return;
    }

    // 직군 안내 화면에서 '이전' → 공통 마지막
    if (stage === "job" && onJobIntro) {
      stage = "common";
      commonIdx = quizData_common.length - 1;
      onJobIntro = false;
      render();
      return;
    }

    if (stage === "job") {
      if (jobIdx > 0) {
        jobIdx -= 1;
        render();
      } else {
        stage = "common";
        commonIdx = quizData_common.length - 1;
        render();
      }
      return;
    }

    // 공통 단계
    if (stage === "common" && commonIdx > 0) {
      commonIdx -= 1;
      render();
    }
  });

  // 초기 렌더
  prevBtn.disabled = true;
  render();
});