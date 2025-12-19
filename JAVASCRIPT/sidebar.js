document.addEventListener("DOMContentLoaded", function () {

  let btn = document.querySelector("#btn");
  let sidebar = document.querySelector(".sidebar");
  let searchBtn = document.querySelector(".bx-search");

  btn.onclick = function() {
    sidebar.classList.toggle("active");
  }

  searchBtn.onclick = function() {
    sidebar.classList.toggle("active");
  }

  const loggedInUser = sessionStorage.getItem("loggedInUser");
  const isLoggedIn = !!loggedInUser;

  const logInIcon = document.getElementById("log_in");
  const logOutIcon = document.getElementById("log_out");

  const nameElement = document.querySelector(".profile .name");
  const jobElement = document.querySelector(".profile .job");

// 상태에 따라 로그인/로그아웃 아이콘 표시 제어
  if (isLoggedIn) {
    logInIcon.style.display = "none";
    logOutIcon.style.display = "block";

    const nickname = sessionStorage.getItem("nickname") || "";
    const job = sessionStorage.getItem("job") || "";

    nameElement.textContent = nickname;
    jobElement.textContent = job;
  } else {
    logInIcon.style.display = "block";
    logOutIcon.style.display = "none";

    nameElement.textContent = "로그인을 해주세요.";
    jobElement.textContent = "";
  }

// 로그인 아이콘 클릭 시 로그인 페이지로 이동
  logInIcon.addEventListener("click", () => {
    window.location.href = "../HTML/signin.html";
  });

// 로그아웃 아이콘 클릭 시 처리
  logOutIcon.addEventListener("click", () => {
    // localStorage.removeItem("token"); 같은 코드 넣을 수 있음
    sessionStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("nickname");
    sessionStorage.removeItem("job");
    sessionStorage.removeItem("isAdmin");

    alert("로그아웃 되었습니다.");
    location.reload();
  });

  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const adminMenu = document.getElementById("adminMenu");

  if (loggedInUser && isAdmin && adminMenu) {
    adminMenu.style.display = "block";
  } else if (adminMenu) {
    adminMenu.style.display = "none";
  }
});