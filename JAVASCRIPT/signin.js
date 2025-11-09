/* document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.querySelector('form.login input[type="text"]');
  const rememberCheckbox = document.getElementById("remember-id");

  const savedId = localStorage.getItem("rememberedId");
  if (savedId) {
    emailInput.value = savedId;
    rememberCheckbox.checked = true;
  }

  const loginForm = document.querySelector("form.login");
  loginForm.addEventListener("submit", function () {
    if (rememberCheckbox.checked) {
    localStorage.setItem("rememberedId", emailInput.value);
    } else {
      localStorage.removeItem("rememberedId");
    }
  });

  const loginText = document.querySelector(".title-text .login");
  const loginFormElement = document.querySelector("form.login");
  const loginBtn = document.querySelector("label.login");
  const signupBtn = document.querySelector("label.signup");
  const signupLink = document.querySelector("form .signup-link a");

  signupBtn.onclick = () => {
    loginFormElement.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
  };
  loginBtn.onclick = () => {
    loginFormElement.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
  };
  signupLink.onclick = () => {
    signupBtn.click();
    return false;
  };
}); */

document.addEventListener("DOMContentLoaded", function() {
  const adminKey = "user_admin";
  if(!localStorage.getItem(adminKey)) {
    const adminData = {
    id: "admin",
    nickname: "관리자",
    password: "admin1234",
    job: "Admin",
    isAdmin: true
    };
    localStorage.setItem(adminKey, JSON.stringify(adminData));
    console.log("계정 생성");
  } else {
    console.log("계정 생성 안됨");
  }

  const loginForm = document.querySelector("form.login");
  const signupForm = document.querySelector("form.signup");
  const idInput = loginForm.querySelector('input[placeholder="ID"]');
  const rememberCheckbox = document.getElementById("remember-id");

  const savedId = localStorage.getItem("rememberedId");
  if (savedId) {
    idInput.value = savedId;
    rememberCheckbox.checked = true;
  }

  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = idInput.value;
    const password = loginForm.querySelector('input[placeholder="Password"]').value;

    const userDataStr = localStorage.getItem("user_" + id);
    if (!userDataStr) {
      alert("존재하지 않는 ID입니다.");
      return;
    }

    const userData = JSON.parse(userDataStr);
    if (userData.password !== password) {
      alert("비밀번호가 틀렸습니다.");
      return;
    }

    sessionStorage.setItem("loggedInUser", id);
    sessionStorage.setItem("nickname", userData.nickname);
    sessionStorage.setItem("job", userData.job || "Developer");
    sessionStorage.setItem("isAdmin", userData.isAdmin ? "true" : "false");

    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedId", id);
    } else {
      localStorage.removeItem("rememberId");
    }

    window.location.href = "../HTML/mainpage.html";
  });

  signupForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = signupForm.querySelector('input[placeholder="ID"]').value;
    const nickname = signupForm.querySelector('input[placeholder="NickName"]').value;
    const password = signupForm.querySelector('input[placeholder="Password"]').value;
    const confirmPassword = signupForm.querySelector('input[placeholder="Confirm password"]').value;

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (localStorage.getItem("user_" + id)) {
      alert("이미 존재하는 ID입니다.");
      return;
    }

    const userData = {
      id,
      nickname,
      password,
      job : "Developer",
      isAdmin: false
    };

    localStorage.setItem("user_" + id, JSON.stringify(userData));
    alert("회원가입이 완료되었습니다. 로그인 해주세요.");

    document.querySelector("#login").checked = true;
    // loginFormElement.style.marginLeft = "0%";
    // loginText.style.marginLeft = "0%";
    loginBtn.click();
  });

  const loginText = document.querySelector(".title-text .login");
  const loginFormElement = document.querySelector("form.login");
  const loginBtn = document.querySelector("label.login");
  const signupBtn = document.querySelector("label.signup");
  const signupLink = document.querySelector("form .signup-link a");

  signupBtn.onclick = () => {
    loginFormElement.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
  };

  loginBtn.onclick = () => {
    loginFormElement.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
  }

  signupLink.onclick = () => {
    signupBtn.click();
    return false;
  };
});