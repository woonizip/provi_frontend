document.addEventListener("DOMContentLoaded", function () {
  const API = {
    SIGNUP: "/api/auth/signup",
    LOGIN: "/api/auth/login",
  };

  const loginForm = document.querySelector("form.login");
  const signupForm = document.querySelector("form.signup");

  const loginText = document.querySelector(".title-text .login");
  const loginFormElement = document.querySelector("form.login");
  const loginBtn = document.querySelector("label.login");
  const signupBtn = document.querySelector("label.signup");
  const signupLink = document.querySelector("form .signup-link a");

  const rememberCheckbox = document.getElementById("remember-id");
  const loginIdInput = loginForm?.querySelector('input[placeholder="ID"]');
  const loginPasswordInput = loginForm?.querySelector('input[placeholder="Password"]');

  const signupIdInput = signupForm?.querySelector('input[placeholder="ID"]');
  const signupNicknameInput = signupForm?.querySelector('input[placeholder="NickName"]');
  const signupPasswordInput = signupForm?.querySelector('input[placeholder="Password"]');
  const signupConfirmPasswordInput = signupForm?.querySelector('input[placeholder="Confirm password"]');

  function showAlert(message) {
    alert(message);
  }

  function setRememberedId() {
    const savedId = localStorage.getItem("rememberedId");
    if (savedId && loginIdInput && rememberCheckbox) {
      loginIdInput.value = savedId;
      rememberCheckbox.checked = true;
    }
  }

  function saveRememberedId() {
    if (!loginIdInput || !rememberCheckbox) return;

    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedId", loginIdInput.value.trim());
    } else {
      localStorage.removeItem("rememberedId");
    }
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      credentials: "include"
    });

    let data = null;
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const message =
        data?.message ||
        data?.error ||
        `HTTP ${res.status}`;
      throw new Error(message);
    }

    return data;
  }

  function goToLoginTab() {
    if (!loginFormElement || !loginText) return;
    loginFormElement.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
    if (loginBtn) {
      document.querySelector("#login") && (document.querySelector("#login").checked = true);
    }
  }

  function goToSignupTab() {
    if (!loginFormElement || !loginText) return;
    loginFormElement.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
  }

  function storeLoginSession(user) {
    sessionStorage.setItem("loggedInUser", user.userId ?? "");
    sessionStorage.setItem("nickname", user.nickname ?? "");
    sessionStorage.setItem("job", user.job ?? "Developer");
    sessionStorage.setItem("isAdmin", user.isAdmin ? "true" : "false");
  }

  function validateSignupInput(userId, nickname, password, confirmPassword) {
    if (!userId) {
      showAlert("ID를 입력해주세요.");
      return false;
    }
    if (!nickname) {
      showAlert("닉네임을 입력해주세요.");
      return false;
    }
    if (!password) {
      showAlert("비밀번호를 입력해주세요.");
      return false;
    }
    if (!confirmPassword) {
      showAlert("비밀번호 확인을 입력해주세요.");
      return false;
    }
    if (password !== confirmPassword) {
      showAlert("비밀번호가 일치하지 않습니다.");
      return false;
    }
    if (password.length < 4) {
      showAlert("비밀번호는 최소 4자 이상이어야 합니다.");
      return false;
    }
    return true;
  }

  function validateLoginInput(userId, password) {
    if (!userId) {
      showAlert("ID를 입력해주세요.");
      return false;
    }
    if (!password) {
      showAlert("비밀번호를 입력해주세요.");
      return false;
    }
    return true;
  }

  setRememberedId();

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = loginIdInput.value.trim();
    const password = loginPasswordInput.value;

    const loginData = {
        userID: id, 
        userPassword: password
    };

    try {
      const res = await fetch(API.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData), 
      });

      const data = await res.json();
      console.log("로그인 응답 데이터: ", data);

      if (res.ok) {
        const token = data.token || data.accessToken;
        const nickname = data.nickname || data.userNickname;

        if (!token) {
          alert("토큰이 없습니다. 응답값을 확인해주세요.");
          return;
        }

        sessionStorage.setItem("token", token);
        
        if (nickname) {
          sessionStorage.setItem("nickname", nickname);
        }

        console.log("token:", token);
        console.log("nickname:", nickname);

        window.location.href = "../mainpage.html";
      } else {
        alert(data.message || "로그인 실패");
      }

    } catch (e) {
      alert("서버 연결 실패");
      console.log(e);
    }
  });

  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = signupIdInput?.value.trim() || "";
    const nickname = signupNicknameInput?.value.trim() || "";
    const password = signupPasswordInput?.value || "";
    const confirmPassword = signupConfirmPasswordInput?.value || "";

    if (!validateSignupInput(userId, nickname, password, confirmPassword)) return;

    try {
      await apiFetch(API.SIGNUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          nickname,
          password,
        }),
      });

      showAlert("회원가입이 완료되었습니다. 로그인 해주세요.");

      if (signupForm) signupForm.reset();
      goToLoginTab();

      if (loginIdInput) {
        loginIdInput.value = userId;
      }
    } catch (error) {
      showAlert(`회원가입 실패: ${error.message}`);
    }
  });

  signupBtn && (signupBtn.onclick = () => {
    goToSignupTab();
  });

  loginBtn && (loginBtn.onclick = () => {
    goToLoginTab();
  });

  signupLink && (signupLink.onclick = () => {
    signupBtn?.click();
    return false;
  });
});