document.addEventListener("DOMContentLoaded", function () {
  const API = {
    SIGNUP: "/api/auth/signup",
    LOGIN: "/api/auth/login",
    SEND_EMAIL_CODE: "/api/auth/email/send-code",
    VERIFY_EMAIL_CODE: "/api/auth/email/verify-code",
    CHECK_USER_ID: "/api/auth/check-userid",
    CHECK_NICKNAME: "/api/auth/check-nickname",
    SOCIAL: {
      google: "/oauth2/authorization/google",
      kakao: "/oauth2/authorization/kakao",
      naver: "/oauth2/authorization/naver",
    },
  };

  const loginForm = document.querySelector("form.login");
  const signupForm = document.querySelector("form.signup");

  const loginText = document.querySelector(".title-text .login");
  const signupText = document.querySelector(".title-text .signup");
  const loginBtn = document.querySelector("label.login");
  const signupBtn = document.querySelector("label.signup");
  const loginRadio = document.getElementById("login");
  const signupRadio = document.getElementById("signup");

  const goSignupLink = document.getElementById("go-signup-link");
  const goLoginLink = document.getElementById("go-login-link");

  const rememberCheckbox = document.getElementById("remember-id");
  const toast = document.getElementById("toast");

  const loginIdInput = document.getElementById("login-id");
  const loginPasswordInput = document.getElementById("login-password");

  const signupIdInput = document.getElementById("signup-id");
  const signupNicknameInput = document.getElementById("signup-nickname");
  const signupEmailInput = document.getElementById("signup-email");
  const emailCodeInput = document.getElementById("email-code");
  const signupPasswordInput = document.getElementById("signup-password");
  const signupConfirmPasswordInput = document.getElementById("signup-confirm-password");

  const sendCodeBtn = document.getElementById("send-code-btn");
  const verifyCodeBtn = document.getElementById("verify-code-btn");
  const emailVerifyStatus = document.getElementById("email-verify-status");
  const passwordMatchStatus = document.getElementById("password-match-status");

  const agreeAll = document.getElementById("agree-all");
  const agreeTerms = document.getElementById("agree-terms");
  const agreePrivacy = document.getElementById("agree-privacy");
  const agreeAge = document.getElementById("agree-age");
  const agreeMarketing = document.getElementById("agree-marketing");
  const agreeItems = document.querySelectorAll(".agree-item");

  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");

  const policyLength = document.getElementById("policy-length");
  const policyLetter = document.getElementById("policy-letter");
  const policyNumber = document.getElementById("policy-number");
  const policySpecial = document.getElementById("policy-special");

  const socialButtons = document.querySelectorAll(".social-btn");
  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  const checkIdBtn = document.getElementById("check-id-btn");
  const checkNicknameBtn = document.getElementById("check-nickname-btn");

  const idCheckStatus = document.getElementById("id-check-status");
  const nicknameCheckStatus = document.getElementById("nickname-check-status");

  let isUserIdChecked = false;
  let isNicknameChecked = false;
  let checkedUserIdValue = "";
  let checkedNicknameValue = "";

  let emailVerified = false;
  let verifiedEmailValue = "";
  let toastTimer = null;

  function showToast(message, type = "default") {
    if (!toast) {
      alert(message);
      return;
    }

    toast.textContent = message;
    toast.className = "toast";
    toast.classList.add("show");

    if (type === "success") toast.classList.add("success");
    if (type === "error") toast.classList.add("error");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function showAlert(message, type = "error") {
    showToast(message, type);
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
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
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
    if (!loginForm || !loginText || !signupText) return;
    loginForm.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
    if (loginRadio) loginRadio.checked = true;
  }

  function goToSignupTab() {
    if (!loginForm || !loginText || !signupText) return;
    loginForm.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
    if (signupRadio) signupRadio.checked = true;
  }

  function isValidUserId(userId) {
    return /^[a-zA-Z0-9_-]{4,20}$/.test(userId);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getPasswordValidation(password) {
    return {
      length: /^.{8,20}$/.test(password),
      letter: /[A-Za-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }

  function isStrongPassword(password) {
    const result = getPasswordValidation(password);
    return result.length && result.letter && result.number && result.special;
  }

  function updatePasswordPolicyUI(password) {
    const result = getPasswordValidation(password);

    policyLength.classList.toggle("valid", result.length);
    policyLetter.classList.toggle("valid", result.letter);
    policyNumber.classList.toggle("valid", result.number);
    policySpecial.classList.toggle("valid", result.special);

    const passedCount = Object.values(result).filter(Boolean).length;

    if (!password) {
      strengthFill.style.width = "0%";
      strengthFill.style.background = "#ef4444";
      strengthText.textContent = "비밀번호 강도: 미입력";
      return;
    }

    if (passedCount <= 1) {
      strengthFill.style.width = "25%";
      strengthFill.style.background = "#ef4444";
      strengthText.textContent = "비밀번호 강도: 약함";
    } else if (passedCount === 2) {
      strengthFill.style.width = "50%";
      strengthFill.style.background = "#f59e0b";
      strengthText.textContent = "비밀번호 강도: 보통";
    } else if (passedCount === 3) {
      strengthFill.style.width = "75%";
      strengthFill.style.background = "#3b82f6";
      strengthText.textContent = "비밀번호 강도: 좋음";
    } else {
      strengthFill.style.width = "100%";
      strengthFill.style.background = "#16a34a";
      strengthText.textContent = "비밀번호 강도: 매우 강함";
    }
  }

  function updatePasswordMatchUI() {
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;

    if (!confirmPassword) {
      passwordMatchStatus.textContent = "비밀번호를 다시 입력해주세요.";
      passwordMatchStatus.className = "hint";
      return;
    }

    if (password === confirmPassword) {
      passwordMatchStatus.textContent = "비밀번호가 일치합니다.";
      passwordMatchStatus.className = "hint success";
    } else {
      passwordMatchStatus.textContent = "비밀번호가 일치하지 않습니다.";
      passwordMatchStatus.className = "hint error";
    }
  }

  function resetEmailVerification() {
    emailVerified = false;
    verifiedEmailValue = "";
    emailVerifyStatus.textContent = "이메일 인증을 완료해주세요.";
    emailVerifyStatus.className = "hint";
    verifyCodeBtn.classList.remove("verified");
    verifyCodeBtn.textContent = "인증 확인";
  }

  function validateSignupInput({ userId, nickname, email, password, confirmPassword }) {
    if (!userId) {
      showAlert("아이디를 입력해주세요.");
      return false;
    }

    if (!isValidUserId(userId)) {
      showAlert("아이디는 영문, 숫자, _, - 조합의 4~20자여야 합니다.");
      return false;
    }

    if (!nickname) {
      showAlert("닉네임을 입력해주세요.");
      return false;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      showAlert("닉네임은 2자 이상 20자 이하로 입력해주세요.");
      return false;
    }

    if (!email) {
      showAlert("이메일을 입력해주세요.");
      return false;
    }

    if (!isValidEmail(email)) {
      showAlert("올바른 이메일 형식을 입력해주세요.");
      return false;
    }

    if (!emailVerified || verifiedEmailValue !== email) {
      showAlert("이메일 인증을 완료해주세요.");
      return false;
    }

    if (!password) {
      showAlert("비밀번호를 입력해주세요.");
      return false;
    }

    if (!isStrongPassword(password)) {
      showAlert("비밀번호는 8~20자이며 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
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

    if (!agreeTerms.checked || !agreePrivacy.checked || !agreeAge.checked) {
      showAlert("필수 약관에 모두 동의해주세요.");
      return false;
    }

    if (!isUserIdChecked || checkedUserIdValue !== userId) {
      showAlert("아이디 중복 확인을 완료해주세요.");
      return false;
    }

    if (!isNicknameChecked || checkedNicknameValue !== nickname) {
      showAlert("닉네임 중복 확인을 완료해주세요.");
      return false;
    }

    return true;
  }

  function validateLoginInput(userId, password) {
    if (!userId) {
      showAlert("아이디를 입력해주세요.");
      return false;
    }

    if (!password) {
      showAlert("비밀번호를 입력해주세요.");
      return false;
    }

    return true;
  }

  async function sendEmailCode() {
    const email = signupEmailInput.value.trim();

    if (!email) {
      showAlert("이메일을 입력해주세요.");
      signupEmailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showAlert("올바른 이메일 형식을 입력해주세요.");
      signupEmailInput.focus();
      return;
    }

    try {
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = "전송 중...";

      await apiFetch(API.SEND_EMAIL_CODE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      resetEmailVerification();
      showAlert("인증번호가 이메일로 전송되었습니다.", "success");
      emailVerifyStatus.textContent = "인증번호를 확인 후 인증 확인 버튼을 눌러주세요.";
      emailVerifyStatus.className = "hint";
    } catch (error) {
      showAlert(`인증번호 전송 실패: ${error.message}`);
    } finally {
      sendCodeBtn.disabled = false;
      sendCodeBtn.textContent = "인증번호 전송";
    }
  }

  async function verifyEmailCode() {
    const email = signupEmailInput.value.trim();
    const code = emailCodeInput.value.trim();

    if (!email) {
      showAlert("이메일을 먼저 입력해주세요.");
      signupEmailInput.focus();
      return;
    }

    if (!code) {
      showAlert("인증번호를 입력해주세요.");
      emailCodeInput.focus();
      return;
    }

    try {
      verifyCodeBtn.disabled = true;
      verifyCodeBtn.textContent = "확인 중...";

      await apiFetch(API.VERIFY_EMAIL_CODE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      emailVerified = true;
      verifiedEmailValue = email;
      emailVerifyStatus.textContent = "이메일 인증이 완료되었습니다.";
      emailVerifyStatus.className = "hint success";
      verifyCodeBtn.classList.add("verified");
      verifyCodeBtn.textContent = "인증 완료";
      showAlert("이메일 인증이 완료되었습니다.", "success");
    } catch (error) {
      emailVerified = false;
      verifiedEmailValue = "";
      emailVerifyStatus.textContent = "인증번호가 올바르지 않거나 만료되었습니다.";
      emailVerifyStatus.className = "hint error";
      verifyCodeBtn.classList.remove("verified");
      verifyCodeBtn.textContent = "인증 확인";
      showAlert(`이메일 인증 실패: ${error.message}`);
    } finally {
      verifyCodeBtn.disabled = false;
    }
  }

  async function checkNicknameDuplicate() {
    const nickname = signupNicknameInput.value.trim();

    if (!nickname) {
      showAlert("닉네임을 입력해주세요.");
      signupNicknameInput.focus();
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      showAlert("닉네임은 2자 이상 20자 이하로 입력해주세요.");
      signupNicknameInput.focus();
      return;
    }

    try {
      checkNicknameBtn.disabled = true;
      checkNicknameBtn.textContent = "확인 중...";

      const data = await apiFetch(`${API.CHECK_NICKNAME}?nickname=${encodeURIComponent(nickname)}`, {
        method: "GET",
      });

      if (data.available) {
        isNicknameChecked = true;
        checkedNicknameValue = nickname;
        nicknameCheckStatus.textContent = data.message || "사용 가능한 닉네임입니다.";
        nicknameCheckStatus.className = "hint success";
        checkNicknameBtn.classList.add("available");
        checkNicknameBtn.textContent = "확인 완료";
        showAlert("사용 가능한 닉네임입니다.", "success");
      } else {
        isNicknameChecked = false;
        checkedNicknameValue = "";
        nicknameCheckStatus.textContent = data.message || "이미 사용 중인 닉네임입니다.";
        nicknameCheckStatus.className = "hint error";
        checkNicknameBtn.classList.remove("available");
        checkNicknameBtn.textContent = "중복 확인";
        showAlert(nicknameCheckStatus.textContent);
      }
    } catch (error) {
      isNicknameChecked = false;
      checkedNicknameValue = "";
      nicknameCheckStatus.textContent = `닉네임 확인 실패: ${error.message}`;
      nicknameCheckStatus.className = "hint error";
      checkNicknameBtn.classList.remove("available");
      checkNicknameBtn.textContent = "중복 확인";
      showAlert(`닉네임 확인 실패: ${error.message}`);
    } finally {
      checkNicknameBtn.disabled = false;
    }
  }

    function syncAgreeAll() {
      const allChecked = [...agreeItems].every((item) => item.checked);
      agreeAll.checked = allChecked;
    }

    function resetSignupState() {
      resetEmailVerification();
      updatePasswordPolicyUI("");
      updatePasswordMatchUI();
      resetUserIdCheck();
      resetNicknameCheck();

      agreeAll.checked = false;
      agreeTerms.checked = false;
      agreePrivacy.checked = false;
      agreeAge.checked = false;
      agreeMarketing.checked = false;
    }

    function resetUserIdCheck() {
      isUserIdChecked = false;
      checkedUserIdValue = "";
      if (idCheckStatus) {
        idCheckStatus.textContent = "아이디 중복 확인을 해주세요.";
        idCheckStatus.className = "hint";
      }
      checkIdBtn?.classList.remove("available");
      if (checkIdBtn) checkIdBtn.textContent = "중복 확인";
    }

    function resetNicknameCheck() {
      isNicknameChecked = false;
      checkedNicknameValue = "";
      if (nicknameCheckStatus) {
        nicknameCheckStatus.textContent = "닉네임 중복 확인을 해주세요.";
        nicknameCheckStatus.className = "hint";
      }
      checkNicknameBtn?.classList.remove("available");
      if (checkNicknameBtn) checkNicknameBtn.textContent = "중복 확인";
    }

    async function checkUserIdDuplicate() {
    const userId = signupIdInput.value.trim();

    if (!userId) {
      showAlert("아이디를 입력해주세요.");
      signupIdInput.focus();
      return;
    }

    if (!isValidUserId(userId)) {
      showAlert("아이디는 영문, 숫자, _, - 조합의 4~20자여야 합니다.");
      signupIdInput.focus();
      return;
    }

    try {
      checkIdBtn.disabled = true;
      checkIdBtn.textContent = "확인 중...";

      const data = await apiFetch(`${API.CHECK_USER_ID}?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
      });

      if (data.available) {
        isUserIdChecked = true;
        checkedUserIdValue = userId;
        idCheckStatus.textContent = data.message || "사용 가능한 아이디입니다.";
        idCheckStatus.className = "hint success";
        checkIdBtn.classList.add("available");
        checkIdBtn.textContent = "확인 완료";
        showAlert("사용 가능한 아이디입니다.", "success");
      } else {
        isUserIdChecked = false;
        checkedUserIdValue = "";
        idCheckStatus.textContent = data.message || "이미 사용 중인 아이디입니다.";
        idCheckStatus.className = "hint error";
        checkIdBtn.classList.remove("available");
        checkIdBtn.textContent = "중복 확인";
        showAlert(idCheckStatus.textContent);
      }
    } catch (error) {
      isUserIdChecked = false;
      checkedUserIdValue = "";
      idCheckStatus.textContent = `아이디 확인 실패: ${error.message}`;
      idCheckStatus.className = "hint error";
      checkIdBtn.classList.remove("available");
      checkIdBtn.textContent = "중복 확인";
      showAlert(`아이디 확인 실패: ${error.message}`);
    } finally {
      checkIdBtn.disabled = false;
    }
  }

  setRememberedId();
  updatePasswordPolicyUI("");
  updatePasswordMatchUI();

  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = loginIdInput.value.trim();
    const password = loginPasswordInput.value;

    if (!validateLoginInput(id, password)) return;

    try {
      const data = await apiFetch(API.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: id,
          userPassword: password,
        }),
      });

      const token = data.token || data.accessToken;
      const nickname = data.nickname || data.userNickname || "";
      const userId = data.userId || data.userID || id;
      const isAdmin = !!data.isAdmin;

      if (!token) {
        showAlert("토큰이 없습니다. 로그인 응답값을 확인해주세요.");
        return;
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("nickname", nickname);
      sessionStorage.setItem("loggedInUser", userId);
      sessionStorage.setItem("isAdmin", isAdmin ? "true" : "false");

      saveRememberedId();
      showAlert("로그인에 성공했습니다.", "success");

      window.location.href = "../mainpage.html";
    } catch (error) {
      showAlert(`로그인 실패: ${error.message}`);
    }
  });

  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const payload = {
      userId: signupIdInput.value.trim(),
      nickname: signupNicknameInput.value.trim(),
      email: signupEmailInput.value.trim(),
      password: signupPasswordInput.value,
      confirmPassword: signupConfirmPasswordInput.value,
    };

    if (!validateSignupInput(payload)) return;

    try {
      await apiFetch(API.SIGNUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: payload.userId,
          nickname: payload.nickname,
          email: payload.email,
          password: payload.password,
          agreements: {
            terms: agreeTerms.checked,
            privacy: agreePrivacy.checked,
            age: agreeAge.checked,
            marketing: agreeMarketing.checked,
          },
        }),
      });

      showAlert("회원가입이 완료되었습니다. 로그인 해주세요.", "success");

      signupForm.reset();
      resetSignupState();
      goToLoginTab();

      if (loginIdInput) {
        loginIdInput.value = payload.userId;
      }
    } catch (error) {
      showAlert(`회원가입 실패: ${error.message}`);
    }
  });

  signupBtn?.addEventListener("click", function () {
    goToSignupTab();
  });

  loginBtn?.addEventListener("click", function () {
    goToLoginTab();
  });

  goSignupLink?.addEventListener("click", function (e) {
    e.preventDefault();
    goToSignupTab();
  });

  goLoginLink?.addEventListener("click", function (e) {
    e.preventDefault();
    goToLoginTab();
  });

  sendCodeBtn?.addEventListener("click", sendEmailCode);
  verifyCodeBtn?.addEventListener("click", verifyEmailCode);

  signupIdInput?.addEventListener("input", function () {
    if (this.value.trim() !== checkedUserIdValue) {
      resetUserIdCheck();
    }
  });

  signupNicknameInput?.addEventListener("input", function () {
    if (this.value.trim() !== checkedNicknameValue) {
      resetNicknameCheck();
    }
  });

  checkIdBtn?.addEventListener("click", checkUserIdDuplicate);
  checkNicknameBtn?.addEventListener("click", checkNicknameDuplicate);

  signupEmailInput?.addEventListener("input", function () {
    if (this.value.trim() !== verifiedEmailValue) {
      resetEmailVerification();
    }
  });

  signupPasswordInput?.addEventListener("input", function () {
    updatePasswordPolicyUI(this.value);
    updatePasswordMatchUI();
  });

  signupConfirmPasswordInput?.addEventListener("input", function () {
    updatePasswordMatchUI();
  });

  agreeAll?.addEventListener("change", function () {
    agreeItems.forEach((item) => {
      item.checked = agreeAll.checked;
    });
  });

  agreeItems.forEach((item) => {
    item.addEventListener("change", syncAgreeAll);
  });

  socialButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const provider = this.dataset.provider;
      const url = API.SOCIAL[provider];

      if (!url) {
        showAlert("지원하지 않는 소셜 로그인입니다.");
        return;
      }

      window.location.href = url;
    });
  });

  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      if (targetInput.type === "password") {
        targetInput.type = "text";
        this.textContent = "숨김";
      } else {
        targetInput.type = "password";
        this.textContent = "보기";
      }
    });
  });
});