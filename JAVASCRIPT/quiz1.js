document.addEventListener("DOMContentLoaded", () => {
  const quizBox = document.getElementById('quiz-box');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const btnWrap = document.querySelector('.quiz-btns');
  
  let currentQuestion = 0;
  let answers = {};
  let stage = "common";
  let jobIdx = 0;
  let jobList = [];
  const answersById = {};
  let currentJobKey = null;
  let onJobIntro = false;
  let jobTitleShown = false;

  // 18개에서 10개로 압축 정제된 핵심 공통 질문 데이터셋
  const quizData_common = [
    {
      id: "currentStatus",
      q: "현재 본인의 개발 학습 상황은 어느 단계인가요?",
      a: ["비전공자이고 이제 막 시작했어요", "학생이며 전공 지식을 쌓고 있어요", "부트캠프/독학으로 취업 준비 중이에요", "주니어 개발자로 일하고 있어요"]
    },
    {
      id: "experience",
      q: "코드나 이론을 공부해온 총 기간이 얼마나 되나요?",
      a: ["3개월 미만", "3개월 ~ 6개월", "6개월 ~ 1년", "1년 이상"]
    },
    {
      id: "knownLangs",
      q: "작성해 보았거나 문법을 접해본 프로그래밍 언어를 선택해주세요 (중복 가능)",
      a: ["Python", "JavaScript / TypeScript", "Java", "C / C++", "Kotlin / Swift", "Go / Rust", "아직 언어 경험이 없어요"],
      multiple: true
    },
    {
      id: "frameworkExp",
      q: "실습이나 프로젝트로 맛보았던 기술 진영이 있나요? (중복 가능)",
      a: ["HTML/CSS 기본 화면 구현", "React / Vue 등 프론트 프레임워크", "Node.js / Spring / Django 등 서버 백엔드", "TensorFlow / PyTorch / 데이터 분석 라이브러리", "아직 경험이 없어요"],
      multiple: true
    },
    {
      id: "interestDevField",
      q: "가장 호기심이 생기거나 파보고 싶은 개발 분야는 어디인가요? (중복 가능)",
      a: ["눈에 보이는 화면과 UX (프론트엔드)", "데이터 처리와 서버 인프라 (백엔드)", "AI 모델링과 대용량 데이터 (인텔리전스)", "시스템 보안 및 네트워크 아키텍처", "아직 탐색 중이에요"],
      multiple: true
    },
    {
      id: "targetRole",
      q: "최종 목표로 생각 중인 개발자 직군 유형을 골라주세요.",
      a: ["웹 개발자", "모바일 앱 개발자", "AI 개발자", "게임 개발자", "보안 전문가", "데브옵스 / 클라우드 엔지니어", "아직 잘 모르겠어요"]
    },
    {
      id: "projectPreference",
      q: "어떤 성격의 문제를 풀 때 더 코딩이 재밌게 느껴지시나요?",
      a: ["디자인을 코드로 레이아웃화하고 인터랙션을 줄 때", "복잡한 알고리즘이나 DB 구조를 효율적으로 설계할 때", "데이터를 가공해서 인사이트를 뽑거나 예측 모델을 만들 때", "인프라를 배포하고 자동화 파이프라인을 구축할 때"]
    },
    {
      id: "learningStyle",
      q: "새로운 기술을 배울 때 본인에게 가장 효과적인 방식은?",
      a: ["이론이나 문서를 꼼꼼히 정독하고 시작한다", "강의나 동영상 튜토리얼을 배속으로 빠르게 돌려본다", "일단 클론 코딩이나 작은 토이 프로젝트를 만들며 부딪힌다"]
    },
    {
      id: "studyTime",
      q: "주당 온전히 개발 공부에 확보할 수 있는 골든 타임은?",
      a: ["주 10시간 미만 (취미/병행)", "주 10시간 ~ 20시간", "주 20시간 ~ 40시간", "주 40시간 이상 (전업 올인)"]
    },
    {
      id: "shortTermGoal",
      q: "앞으로 6개월 이내에 달성하고 싶은 가장 시급한 마일스톤은?",
      a: ["기초 포텐셜을 확인하고 확실한 주특기 스택 정하기", "탄탄한 포트폴리오용 팀 프로젝트 완성하기", "주니어 개발자로 이력서 내고 면접 합격하기"]
    }
  ];

  const quizData_jobs = {
    web: [
      {
        id: "web_area",
        q: "웹 개발 스펙트럼 중 어떤 메인 주특기를 가져가고 싶으신가요?",
        a: ["프론트엔드 (UI/UX 구현 중심)", "백엔드 (서버/데이터 API 설계 중심)", "풀스택 (전체 아키텍처 빌드)", "아직 정하지 못했어요"]
      }
    ]
    // 모바일, AI, 게임 등 하위 직군 데이터 구조 유지...
  };

  const ROLE_TO_JOBKEY = {
    "웹 개발자": "web", "모바일 앱 개발자": "mobile", "AI 개발자": "ai",
    "게임 개발자": "game", "보안 전문가": "security", "데브옵스 / 클라우드 엔지니어": "devops"
  };

  const API_URL = "/api/quiz";
  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "주니어";

  function isAnswered(item) {
    const v = answersById[item.id];
    return item.multiple ? Array.isArray(v) && v.length > 0 : typeof v === "string" && v.length > 0;
  }

  function currentItem() {
    return stage === "common" ? quizData_common[commonIdx] : jobList[jobIdx];
  }

  let commonIdx = 0;
  
  function renderBranchChoice() {
    if (btnWrap) btnWrap.style.display = 'none';
    const role = answersById["targetRole"] || "아직 잘 모르겠어요";
    const jobKey = ROLE_TO_JOBKEY[role];
    const hasJobFollowUp = !!(jobKey && quizData_jobs[jobKey]?.length);

    quizBox.innerHTML = `
      <div class="branch-container">
        <div class="branch-header">
          <div class="branch-title">🎯 핵심 공통 진단 완료</div>
          <p class="branch-desc">기본 분석 준비가 끝났습니다. 다음 성장 여정을 어떻게 설계할까요?</p>
        </div>
        <div class="branch-buttons">
          <button class="quiz-btn branch-btn branch-btn--neutral" id="branch-detail" ${hasJobFollowUp ? "" : "disabled"}>
            ${hasJobFollowUp ? `🚀 ${role} 세부 타겟팅 질문 계속하기` : "🔒 선택 직군 세부 질문 없음"}
          </button>
          <button class="quiz-btn branch-btn branch-btn--primary" id="branch-chat">
            💬 AI와 1:1 대화형 빌드업으로 넘어가기
          </button>
          <button class="quiz-btn branch-btn branch-btn--ghost" id="branch-end">
            📊 즉시 내 성장 레포트 결과 보기
          </button>
        </div>
        <button class="branch-back" type="button">← 설문 수정하기</button>
      </div>
    `;

    document.getElementById("branch-detail")?.addEventListener("click", () => {
      if (!hasJobFollowUp) return;
      stage = "job";
      currentJobKey = jobKey;
      jobList = quizData_jobs[jobKey];
      jobIdx = 0;
      jobTitleShown = false;
      if (btnWrap) btnWrap.style.display = 'flex';
      render();
    });

    document.getElementById("branch-chat")?.addEventListener("click", () => {
      const payload = buildPayload(true);
      sessionStorage.setItem("quizCommonAnswers", JSON.stringify(payload));
      window.location.href = "chat.html";
    });

    document.getElementById("branch-end")?.addEventListener("click", () => {
      const payload = buildPayload(true);
      goToResultPage(true, payload);
    });

    document.querySelector('.branch-back')?.addEventListener('click', () => {
      stage = "common";
      commonIdx = quizData_common.length - 1;
      if (btnWrap) btnWrap.style.display = 'flex';
      render();
    });
  }

  function render() {
    if (stage === "branch") {
      renderBranchChoice();
      return;
    }

    if (stage === "job" && !jobTitleShown) {
      const role = answersById["targetRole"];
      quizBox.innerHTML = `
        <div class="job-intro-box">
          <div class="section-title">💡 <b>${role}</b> 심화 진단 시작</div>
          <p class="section-sub">${nickname}님의 타겟 커리어에 딱 맞는 상세 로드맵 정밀 튜닝을 위한 최종 단계입니다.</p>
        </div>
      `;
      jobTitleShown = true;
      onJobIntro = true;
      prevBtn.disabled = false;
      nextBtn.textContent = "심화 설문 시작";
      return;
    }

    const item = currentItem();
    const idx = stage === "common" ? commonIdx : jobIdx;
    const total = stage === "common" ? quizData_common.length : jobList.length;

    quizBox.innerHTML = `
      <div class="progress-line"><div class="bar" style="width:${((idx + 1) / total) * 100}%"></div></div>
      <div class="question-header">
        <span class="q-badge">Q.${idx + 1}</span>
        <div class="question">${item.q}</div>
      </div>
      <div class="options" role="group"></div>
    `;

    const wrap = quizBox.querySelector(".options");
    const prevAns = answersById[item.id];

    item.a.forEach(label => {
      const el = document.createElement("div");
      el.className = "option";
      el.textContent = label;

      if (item.multiple && Array.isArray(prevAns) && prevAns.includes(label)) el.classList.add("selected");
      if (!item.multiple && prevAns === label) el.classList.add("selected");

      el.addEventListener("click", () => {
        if (item.multiple) {
          el.classList.toggle("selected");
          answersById[item.id] = Array.from(wrap.querySelectorAll(".option.selected")).map(n => n.textContent);
        } else {
          wrap.querySelectorAll(".option").forEach(n => n.classList.remove("selected"));
          el.classList.add("selected");
          answersById[item.id] = label;
        }
      });
      wrap.appendChild(el);
    });

    prevBtn.disabled = stage === "common" && commonIdx === 0;
    nextBtn.textContent = stage === "common" && commonIdx === quizData_common.length - 1 ? "다음 단계" : (stage === "job" && jobIdx === jobList.length - 1 ? "분석 리포트 생성" : "다음");
  }

  function buildPayload(commonOnly = false) {
    const allQs = commonOnly ? [...quizData_common] : [...quizData_common, ...jobList];
    return {
      answers: allQs.map((q, i) => ({
        index: i,
        id: q.id,
        question: q.q,
        multiple: !!q.multiple,
        value: answersById[q.id] ?? null
      }))
    };
  }

  function goToResultPage(commonOnly = false, payload) {
    sessionStorage.setItem("quizResultPayload", JSON.stringify(payload));
    sessionStorage.setItem("quizResultCommonOnly", commonOnly ? "1" : "0");
    window.location.href = "result.html";
  }

  nextBtn.addEventListener("click", () => {
    if (stage === "job" && onJobIntro) {
      onJobIntro = false;
      render();
      return;
    }

    const item = currentItem();
    if (item && !item.multiple && !isAnswered(item)) { 
      alert("진단을 이어가기 위해 답변을 하나 선택해주세요!"); 
      return; 
    }

    if (stage === "common") {
      if (commonIdx < quizData_common.length - 1) {
        commonIdx++;
        render();
      } else {
        stage = "branch";
        render();
      }
    } else if (stage === "job") {
      if (jobIdx < jobList.length - 1) {
        jobIdx++;
        render();
      } else {
        goToResultPage(false, buildPayload(false));
      }
    }
  });

  prevBtn.addEventListener("click", () => {
    if (stage === "job" && onJobIntro) {
      stage = "common";
      commonIdx = quizData_common.length - 1;
      onJobIntro = false;
      render();
      return;
    }
    if (stage === "job") {
      if (jobIdx > 0) {
        jobIdx--;
      } else {
        stage = "common";
        commonIdx = quizData_common.length - 1;
      }
      render();
    } else if (stage === "common" && commonIdx > 0) {
      commonIdx--;
      render();
    }
  });

  render();
});