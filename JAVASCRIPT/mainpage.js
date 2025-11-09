function getRecommendation() {
  const techStack = document.getElementById('tech-stack').value;
  alert(`${techStack}에 대한 추천을 확인하세요!`);
}

document.addEventListener("DOMContentLoaded", function () {
  const authArea = document.getElementById("authArea");
  const nickname = sessionStorage.getItem("nickname");
  
  if (nickname) {
    authArea.innerHTML = `
      <span class="user-nick">반갑습니다, ${nickname}님</span>
      <a href="#" id="logout-link" class="logout-link" style="margin-left:8px;">로그아웃</a>
    `;
    authArea.addEventListener("click", function (e) {
      if (e.target && e.target.id === "logout-link") {
        e.preventDefault();
        sessionStorage.clear();
        location.reload();
      }
    });
  } else {
    authArea.innerHTML = `<a href="../HTML/signin.html">로그인/회원가입</a>`;
  }
})