function getRecommendation() {
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

    // 네비게이션 로그인/로그아웃 UI
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
          sessionStorage.clear();
          location.reload();
        }
      });
    } else {
      if (authLink && authLink.tagName.toLowerCase() === "a") {
        authLink.textContent = "로그인/회원가입";
        authLink.href = "../HTML/signin.html";
      }
    }
  }
});

// 로그인 필요한 기능 공통
document.addEventListener(
  "click",
  function (e) {
    const protectedEl = e.target.closest("[data-require-login='true']");
    if (!protectedEl) return;

    const nickname = sessionStorage.getItem("nickname");

    if (!nickname) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("로그인 후 이용할 수 있는 서비스입니다.");

      // 이미 로그인 페이지면 또 보내지 않기
      if (!location.pathname.endsWith("signin.html")) {
        window.location.href = "../HTML/signin.html";
      }
    }
  },
  true // 캡처 단계에서 먼저 가로채기
);
