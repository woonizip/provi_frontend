document.addEventListener("DOMContentLoaded", () => {
  const quizBox = document.getElementById('quiz-box');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const btnWrap = document.querySelector('.quiz-btns');

  let stage = sessionStorage.getItem("quizStage") || "common";
  let commonIdx = parseInt(sessionStorage.getItem("commonIdx")) || 0;
  let jobIdx = parseInt(sessionStorage.getItem("jobIdx")) || 0;
  let jobList = JSON.parse(sessionStorage.getItem("jobList")) || [];
  let answersById = JSON.parse(sessionStorage.getItem("answersById")) || {};
  let currentJobKey = sessionStorage.getItem("currentJobKey") || null;
  let onJobIntro = sessionStorage.getItem("onJobIntro") === "true";
  let jobTitleShown = sessionStorage.getItem("jobTitleShown") === "true";

  const nickname = (sessionStorage.getItem("nickname") || "").trim() || "주니어";

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
      id: "collaborationStyle",
      q: "본인의 선호하는 문제 해결 방식과 팀워크 성향은 어느 쪽인가요?",
      a: [
        "혼자 깊게 파고들어 문제를 해결하는 것을 좋아해요",
        "팀원들과 활발히 토론하며 함께 해결하는 것을 좋아해요",
        "상황에 따라 유연하게 협업하고 싶어요"
      ]
    },
    {
      id: "projectType",
      q: "어떤 형태의 프로젝트를 할 때 가장 성취감을 느끼나요?",
      a: [
        "처음부터 끝까지 혼자 기획하고 구현하는 개인 프로젝트",
        "팀원들과 역할을 나눠 협업하며 만드는 팀 프로젝트",
        "기존 오픈소스를 기여(Contribute)하거나 분석하는 활동"
      ]
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
      { id: "web_area", q: "웹 개발 스펙트럼 중 어떤 메인 주특기를 가져가고 싶으신가요?", a: ["프론트엔드 (UI/UX 구현 중심)", "백엔드 (서버/API/DB 설계 중심)", "풀스택 (프론트와 백엔드 모두)", "아직 정하지 못했어요"] },
      { id: "web_front_interest", q: "프론트엔드 쪽에서 더 흥미로운 영역은 무엇인가요?", a: ["화면 레이아웃과 디자인 구현", "사용자 인터랙션과 애니메이션", "상태 관리와 데이터 흐름 설계", "웹 접근성/반응형/성능 최적화"] },
      { id: "web_backend_interest", q: "백엔드 쪽에서 더 흥미로운 영역은 무엇인가요?", a: ["REST API 설계와 서버 로직 구현", "DB 설계와 데이터 모델링", "로그인/권한/보안 처리", "대용량 트래픽과 서버 성능 개선"] },
      { id: "web_stack_preference", q: "웹 개발에서 선호하거나 배우고 싶은 기술 조합은 무엇인가요?", a: ["React + Node.js", "React + Spring Boot", "Vue + Spring Boot", "아직 잘 모르겠어요"] },
      { id: "web_project_type", q: "포트폴리오로 만들고 싶은 웹 프로젝트 유형은 무엇인가요?", a: ["커뮤니티/SNS 서비스", "쇼핑몰/예약/결제 서비스", "대시보드/관리자 페이지", "AI 또는 외부 API 연동 서비스"] },
      { id: "web_priority", q: "웹 개발자로 성장하기 위해 가장 보완하고 싶은 부분은 무엇인가요?", a: ["HTML/CSS/JavaScript 기본기", "React 같은 프론트 프레임워크", "Spring/Node 같은 백엔드 프레임워크", "배포, 서버, DB 연결 경험"] }
    ],
    mobile: [
      { id: "mobile_platform", q: "어떤 모바일 앱 개발 방향에 더 관심이 있나요?", a: ["Android 앱 개발", "iOS 앱 개발", "Android/iOS 모두 가능한 크로스플랫폼", "아직 정하지 못했어요"] },
      { id: "mobile_stack", q: "배우고 싶거나 관심 있는 모바일 기술은 무엇인가요?", a: ["Kotlin / Android Studio", "Swift / Xcode", "Flutter / Dart", "React Native"] },
      { id: "mobile_app_type", q: "만들어보고 싶은 앱 유형은 무엇인가요?", a: ["일정/메모/습관 관리 앱", "지도/위치 기반 서비스 앱", "커뮤니티/채팅 앱", "쇼핑/예약/생활 편의 앱"] },
      { id: "mobile_feature_interest", q: "모바일 앱 기능 중 가장 구현해보고 싶은 것은 무엇인가요?", a: ["로그인과 사용자 관리", "푸시 알림", "카메라/앨범/파일 업로드", "GPS와 지도 연동"] },
      { id: "mobile_ui_interest", q: "모바일 화면 구현에서 더 자신 있거나 관심 있는 부분은 무엇인가요?", a: ["깔끔한 앱 화면 디자인", "부드러운 화면 전환과 애니메이션", "다양한 화면 크기에 맞춘 반응형 UI", "사용자 경험을 고려한 앱 흐름 설계"] },
      { id: "mobile_priority", q: "모바일 개발자로 성장하기 위해 가장 필요한 학습은 무엇이라고 느끼나요?", a: ["프로그래밍 언어 기본기", "앱 화면 구성과 상태 관리", "서버 API 연동", "스토어 배포와 앱 운영 경험"] }
    ],
    ai: [
      { id: "ai_area", q: "AI 분야 중 어떤 방향에 가장 관심이 있나요?", a: ["머신러닝/딥러닝 모델 개발", "데이터 분석과 시각화", "자연어 처리/챗봇", "컴퓨터 비전/이미지 인식"] },
      { id: "ai_math_level", q: "수학이나 통계 개념에 대한 현재 자신감은 어느 정도인가요?", a: ["거의 처음이라 기초부터 필요해요", "기본 개념은 알지만 적용은 어려워요", "확률/통계/선형대수 개념을 어느 정도 알아요", "모델 원리까지 깊게 공부해보고 싶어요"] },
      { id: "ai_python_level", q: "Python 활용 수준은 어느 정도인가요?", a: ["기초 문법을 배우는 단계", "간단한 문제 풀이가 가능한 단계", "Pandas/Numpy를 사용해본 단계", "모델 학습 코드까지 작성해본 단계"] },
      { id: "ai_data_interest", q: "다루고 싶은 데이터 유형은 무엇인가요?", a: ["텍스트 데이터", "이미지/영상 데이터", "숫자/표 형태의 정형 데이터", "음성 또는 센서 데이터"] },
      { id: "ai_project_type", q: "AI 포트폴리오로 만들고 싶은 프로젝트는 무엇인가요?", a: ["챗봇/문서 요약 서비스", "이미지 분류/객체 인식 서비스", "추천 시스템", "데이터 분석 리포트/예측 모델"] },
      { id: "ai_priority", q: "AI 개발자로 성장하기 위해 가장 먼저 보완하고 싶은 부분은 무엇인가요?", a: ["Python과 데이터 처리 기본기", "머신러닝/딥러닝 이론", "모델 학습과 평가 경험", "AI 모델을 웹/앱 서비스에 연결하는 경험"] }
    ],
    game: [
      { id: "game_area", q: "게임 개발에서 가장 관심 있는 역할은 무엇인가요?", a: ["게임 클라이언트 개발", "게임 서버 개발", "게임 기획과 시스템 설계", "그래픽스/물리/엔진 개발"] },
      { id: "game_engine", q: "관심 있거나 사용해보고 싶은 게임 엔진은 무엇인가요?", a: ["Unity", "Unreal Engine", "Godot", "아직 정하지 못했어요"] },
      { id: "game_genre", q: "만들어보고 싶은 게임 장르는 무엇인가요?", a: ["2D 캐주얼/퍼즐 게임", "3D 액션/어드벤처 게임", "멀티플레이/온라인 게임", "시뮬레이션/전략 게임"] },
      { id: "game_programming_interest", q: "게임 프로그래밍에서 가장 흥미로운 부분은 무엇인가요?", a: ["캐릭터 이동과 조작감", "충돌 처리와 물리 시스템", "아이템/스킬/전투 시스템", "네트워크 멀티플레이"] },
      { id: "game_language", q: "게임 개발을 위해 배우고 싶은 언어는 무엇인가요?", a: ["C#", "C++", "JavaScript", "아직 잘 모르겠어요"] },
      { id: "game_priority", q: "게임 개발자로 성장하기 위해 가장 필요한 학습은 무엇이라고 느끼나요?", a: ["프로그래밍 기본기", "게임 엔진 사용법", "게임 수학과 물리", "완성도 있는 작은 게임 제작 경험"] }
    ],
    security: [
      { id: "security_area", q: "보안 분야 중 어떤 방향에 가장 관심이 있나요?", a: ["웹 해킹/취약점 분석", "네트워크 보안", "시스템/리버싱", "보안 관제/침해 대응"] },
      { id: "security_base", q: "현재 보안 학습의 기초 수준은 어느 정도인가요?", a: ["이제 막 관심을 가진 단계", "네트워크/운영체제 기초를 배우는 단계", "간단한 취약점 실습을 해본 단계", "CTF나 모의해킹 경험이 있는 단계"] },
      { id: "security_web", q: "웹 보안에서 가장 공부해보고 싶은 주제는 무엇인가요?", a: ["SQL Injection", "XSS / CSRF", "인증/인가 취약점", "파일 업로드/서버 설정 취약점"] },
      { id: "security_system", q: "시스템 보안에서 관심 있는 영역은 무엇인가요?", a: ["Linux 명령어와 서버 관리", "운영체제 구조", "악성코드 분석", "리버스 엔지니어링"] },
      { id: "security_project", q: "보안 포트폴리오로 해보고 싶은 활동은 무엇인가요?", a: ["취약점 진단 보고서 작성", "CTF 문제 풀이 기록", "보안 로그 분석 프로젝트", "웹 서비스 보안 개선 프로젝트"] },
      { id: "security_priority", q: "보안 전문가로 성장하기 위해 가장 먼저 보완하고 싶은 부분은 무엇인가요?", a: ["네트워크 기초", "운영체제/Linux 기초", "웹 구조와 백엔드 이해", "보고서 작성과 분석 능력"] }
    ],
    devops: [
      { id: "devops_area", q: "데브옵스/클라우드 분야 중 어떤 방향에 가장 관심이 있나요?", a: ["서버 배포와 운영", "클라우드 인프라 설계", "CI/CD 자동화", "모니터링과 장애 대응"] },
      { id: "devops_cloud", q: "관심 있거나 사용해보고 싶은 클라우드 플랫폼은 무엇인가요?", a: ["AWS", "Google Cloud", "Azure", "아직 정하지 못했어요"] },
      { id: "devops_linux", q: "Linux나 터미널 사용 경험은 어느 정도인가요?", a: ["거의 사용해본 적 없어요", "기본 명령어 정도는 사용해봤어요", "서버 접속과 파일 관리를 해봤어요", "배포나 서버 설정 경험이 있어요"] },
      { id: "devops_container", q: "컨테이너/배포 기술 중 가장 관심 있는 것은 무엇인가요?", a: ["Docker", "Kubernetes", "Nginx", "GitHub Actions"] },
      { id: "devops_project", q: "데브옵스 포트폴리오로 해보고 싶은 프로젝트는 무엇인가요?", a: ["웹 서비스 클라우드 배포", "Docker 기반 배포 환경 구성", "CI/CD 자동 배포 파이프라인 구축", "서버 모니터링과 로그 관리"] },
      { id: "devops_priority", q: "데브옵스/클라우드 엔지니어로 성장하기 위해 가장 먼저 보완하고 싶은 부분은 무엇인가요?", a: ["Linux와 서버 기본기", "네트워크와 인프라 구조 이해", "Docker/배포 자동화", "클라우드 서비스 실습 경험"] }
    ]
  };

  const proficiencyQuestion = {
    id: "selfProficiency",
    q: "현재 선택하신 직군 관련 기술 스택을 실무에 바로 적용할 수 있는 수준인가요?",
    a: ["이론만 알아요", "예제 수준의 코딩 가능", "토이 프로젝트 완성 경험 있음", "실무 코드 이해 가능"]
  };

  const ROLE_TO_JOBKEY = {
    "웹 개발자": "web", "모바일 앱 개발자": "mobile", "AI 개발자": "ai",
    "게임 개발자": "game", "보안 전문가": "security", "데브옵스 / 클라우드 엔지니어": "devops"
  };

  function isAnswered(item) {
    const v = answersById[item.id];
    return item.multiple ? Array.isArray(v) && v.length > 0 : typeof v === "string" && v.length > 0;
  }

  function currentItem() {
    return stage === "common" ? quizData_common[commonIdx] : jobList[jobIdx];
  }

  function saveProgress() {
    sessionStorage.setItem("quizStage", stage);
    sessionStorage.setItem("commonIdx", commonIdx);
    sessionStorage.setItem("jobIdx", jobIdx);
    sessionStorage.setItem("jobList", JSON.stringify(jobList));
    sessionStorage.setItem("answersById", JSON.stringify(answersById));
    sessionStorage.setItem("currentJobKey", currentJobKey);
    sessionStorage.setItem("onJobIntro", onJobIntro);
    sessionStorage.setItem("jobTitleShown", jobTitleShown);
  }

  function resetQuizToFirst() {
    // 임시 변수에 핵심 토큰과 닉네임만 안전하게 복사 후 가드
    const nickTemp = sessionStorage.getItem("nickname");
    const tokenTemp = sessionStorage.getItem("token");
    
    sessionStorage.clear();
    
    if (nickTemp) sessionStorage.setItem("nickname", nickTemp);
    if (tokenTemp) sessionStorage.setItem("token", tokenTemp);

    // 내부 스크립트 상태값 완전 원천 초기화
    stage = "common";
    commonIdx = 0;
    jobIdx = 0;
    jobList = [];
    answersById = {};
    currentJobKey = null;
    onJobIntro = false;
    jobTitleShown = false;

    if (btnWrap) btnWrap.style.display = 'flex';
    render(); // 새로고침 없이 즉시 Q.1 첫 화면으로 리드로잉
  }

  const totalSavedCount = Object.keys(answersById).length;
  if (totalSavedCount > 0) {
    const currentNum = stage === "common" ? (commonIdx + 1) : (quizData_common.length + jobIdx + 1);
    
    // 💡 취소를 누르면 팝업이 무한 반복되지 않고 즉시 1번 문항으로 순간 복구 도킹
    if (confirm(`이전에 중간까지 답변해 주신 설문 내역이 있습니다.\n마지막으로 응답하신 문항의 다음인 [Q.${currentNum}]번부터 이어서 설문을 계속 작성하시겠습니까?`)) {
      render();
    } else {
      resetQuizToFirst();
    }
  }

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
      
      const baseJobs = [...quizData_jobs[jobKey]];
      if (!baseJobs.some(q => q.id === "selfProficiency")) {
        baseJobs.push(proficiencyQuestion);
      }
      
      jobList = baseJobs;
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
    saveProgress(); 

    if (stage === "branch") {
      renderBranchChoice();
      return;
    }

    if (stage === "job" && !jobTitleShown) {
      const role = answersById["targetRole"];
      quizBox.innerHTML = `
        <div class="job-intro-box" style="text-align: center; padding: 20px 0;">
          <div class="section-title" style="font-size: 1.4rem; font-weight: 800; margin-bottom: 12px;">💡 <b>${role}</b> 심화 진단 시작</div>
          <p class="section-sub" style="color: var(--text-muted); line-height: 1.5;">${nickname}님의 타겟 커리어에 딱 맞는 상세 로드맵 정밀 튜닝을 위한 최종 단계입니다.</p>
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
        <span class="q-badge">Q.${stage === "common" ? (idx + 1) : (quizData_common.length + idx + 1)}</span>
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
        saveProgress(); 
      });
      wrap.appendChild(el);
    });

    prevBtn.disabled = stage === "common" && commonIdx === 0;
    
    if (stage === "common" && commonIdx === quizData_common.length - 1) {
      nextBtn.textContent = "다음 단계";
    } else if (stage === "job" && jobIdx === jobList.length - 1) {
      nextBtn.textContent = "분석 리포트 생성";
    } else {
      nextBtn.textContent = "다음";
    }
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
    
    sessionStorage.removeItem("quizStage");
    sessionStorage.removeItem("commonIdx");
    sessionStorage.removeItem("jobIdx");
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

  // 초기 구동
  render();
});