// 공통 설문(기술 스택 추천 시작하기) 버튼용
function getRecommendation() {
  // 공통 설문은 비로그인도 가능
  window.location.href = "../HTML/stack.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const navbarLinks = document.querySelector(".navbar-links");
  if (navbarLinks) {
    // 로그인/회원가입 링크 찾기
    const authLink =
      navbarLinks.querySelector('a[href$="signin.html"]') ||
      navbarLinks.lastElementChild;

    const nickname = sessionStorage.getItem("nickname");

    //네비게이션 로그인/로그아웃 UI
    if (nickname) {
      const authArea = document.createElement("div");
      authArea.id = "authArea";
      authArea.className = "navbar-auth";

      authArea.innerHTML = `
        <span class="user-nick">반갑습니다, ${nickname}님</span>
        <a href="#" id="logout-link" class="logout-link">로그아웃</a>
      `;

      navbarLinks.replaceChild(authArea, authLink);

      authArea.addEventListener("click", function (e) {
        if (e.target && e.target.id === "logout-link") {
          e.preventDefault();
          sessionStorage.clear();   // 세션 삭제
          location.reload();        // 비로그인 상태로 리셋
        }
      });
    } else {
      // 비로그인 상태
      if (authLink && authLink.tagName.toLowerCase() === "a") {
        authLink.textContent = "로그인/회원가입";
        authLink.href = "../HTML/signin.html";
      }
    }
  }
});

//로그인 필요한 기능 공통 가드
document.addEventListener(
  "click",
  function (e) {
    const protectedEl = e.target.closest("[data-require-login='true']");
    if (!protectedEl) return;

    // 공통 설문(기술 스택)은 비로그인 허용 → 예외 처리
    const href =
      protectedEl.getAttribute("href") ||
      protectedEl.dataset.href ||
      "";

    if (href.includes("stack.html")) {
      // 공통 설문은 로그인 체크 X
      return;
    }

    const nickname = sessionStorage.getItem("nickname");

    if (!nickname) {
      e.preventDefault();
      e.stopImmediatePropagation();

      const goLogin = confirm(
        "로그인 후 이용할 수 있는 서비스입니다.\n로그인 페이지로 이동하시겠습니까?"
      );

      if (goLogin) {
        if (!location.pathname.endsWith("signin.html")) {
          window.location.href = "../HTML/signin.html";
        }
      } else {
        return;
      }
    }
  },
  true
);
