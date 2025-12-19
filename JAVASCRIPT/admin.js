// const isAdmin = sessionStorage.getItem("isAdmin") === "true";
//     const loggedInUser = sessionStorage.getItem("loggedInUser");

//const { createElement } = require("react");

//     if (!isAdmin || loggedInUser !== "admin") {
//       alert("관리자만 접근 가능합니다.");
//       window.location.href = "../HTML/mainpage1_copy.html";
//     }

//     const userListDiv = document.getElementById("userList");

//     for (let key in localStorage) {
//       if (key.startsWith("user_")) {
//         const user = JSON.parse(localStorage.getItem(key));
//         if (!user || user.id === "admin") continue;

//         const userCard = document.createElement("div");
//         userCard.className = "user-card";
//         userCard.innerHTML = `
//           <div class="id">ID: ${user.id}</div>
//           <div>닉네임: ${user.nickname}</div>
//           <div>직무: ${user.job || "없음"}</div>
//           <button class="btn-delete" data-id="${user.id}">삭제</button>
//         `;
//         userListDiv.appendChild(userCard);
//       }
//     }

//     document.addEventListener("click", function (e) {
//       if (e.target.classList.contains("btn-delete")) {
//         const userId = e.target.getAttribute("data-id");
//         if (confirm(`정말로 ${userId} 계정을 삭제할까요?`)) {
//           localStorage.removeItem("user_" + userId);
//           alert(`${userId} 삭제 완료`);
//           location.reload();
//         }
//       }
//     });

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid");

  for (let key in localStorage) {
    if (key.startsWith("user_")) {
      const user = JSON.parse(localStorage.getItem(key));
      if(!user || user.id === "admin") continue;

      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
      <h3>ID : <span class="user-id">${user.id}</span></h3>
      <p>닉네임: ${user.nickname || "없음"}</p>
      <p>직무: ${user.job || "없음"}</p>
      <button class="btn-delete" data-id="${user.id}">삭제</button>
      `;
      grid.appendChild(card);
    }
  }

  grid.addEventListener("click", function(e) {
    if (e.target.classList.contains("btn-delete")) {
      const userId = e.target.getAttribute("data-id");
      if (confirm(`${userId} 유저를 정말 삭제할까요?`)) {
        localStorage.removeItem("user_" + userId);
        alert(`${userId} 삭제`);
        location.reload();
      }
    }
  });
});