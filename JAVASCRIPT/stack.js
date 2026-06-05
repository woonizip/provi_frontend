// 기존 stack.js 파일에 이 통합 고도화 로직을 덮어씌워주세요.
document.addEventListener("DOMContentLoaded", function () {
  
  // ==========================================================================
  // ⚡️ 글로벌 라이트/다크 테마 락킹 및 지속 엔진 주입
  // ==========================================================================
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // 시스템 실시간 모드 변동성 스파이 리스너
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (!localStorage.getItem("theme")) {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    }
  });
  // ==========================================================================

  // 기존 유효 바인딩 기능 가드 유지
  const branchEndBtn = document.getElementById("branch-end");
  if (branchEndBtn) {
    branchEndBtn.addEventListener("click", function () {
      sessionStorage.setItem("allowAnonymousResult", "true");
    });
  }
});

function go(target) { 
  if (!target) return; 
  window.location.href = target; 
}