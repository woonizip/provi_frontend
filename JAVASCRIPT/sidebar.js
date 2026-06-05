document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem("theme");
  const currentTheme = savedTheme || "dark"; 
  document.documentElement.setAttribute("data-theme", currentTheme);
  
  // 만약 다른 페이지(사이드바가 있는 서브페이지)에서도 테마 토글 버튼을 공통으로 쓴다면 
  // 아래 주석을 풀어서 연동해 주시면 됩니다.
  /*
  const subThemeBtn = document.getElementById("theme-toggle");
  if (subThemeBtn) {
    subThemeBtn.addEventListener("click", function() {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = activeTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
    });
  }
  */

  let btn = document.querySelector("#btn");
  let sidebar = document.querySelector(".sidebar");
  let searchBtn = document.querySelector(".bx-search");

  if (btn) {
    btn.onclick = function() {
      sidebar.classList.toggle("active");
    }
  }

  if (searchBtn) {
    searchBtn.onclick = function() {
      sidebar.classList.add("active");
    }
  }

  const loggedInUser = sessionStorage.getItem("loggedInUser");
  const isLoggedIn = !!loggedInUser;

  const logInIcon = document.getElementById("log_in");
  const logOutIcon = document.getElementById("log_out");
  const nameElement = document.querySelector(".profile .name");
  const jobElement = document.querySelector(".profile .job");

  if (isLoggedIn) {
    if (logInIcon) logInIcon.style.display = "none";
    if (logOutIcon) logOutIcon.style.display = "block";

    const nickname = sessionStorage.getItem("nickname") || "";
    const job = sessionStorage.getItem("job") || "";

    if (nameElement) nameElement.textContent = nickname;
    if (jobElement) jobElement.textContent = job;
  } else {
    if (logInIcon) logInIcon.style.display = "block";
    if (logOutIcon) logOutIcon.style.display = "none";

    if (nameElement) nameElement.textContent = "로그인을 해주세요.";
    if (jobElement) jobElement.textContent = "";
  }

  if (logInIcon) {
    logInIcon.addEventListener("click", () => {
      window.location.href = "../HTML/signin.html";
    });
  }

  if (logOutIcon) {
    logOutIcon.addEventListener("click", () => {
      sessionStorage.clear();
      alert("로그아웃 되었습니다.");
      location.reload();
    });
  }

  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const adminMenu = document.getElementById("adminMenu");

  if (loggedInUser && isAdmin && adminMenu) {
    adminMenu.style.display = "block";
  } else if (adminMenu) {
    adminMenu.style.display = "none";
  }
});