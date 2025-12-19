document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('createBtn');
  const grid = document.getElementById('grid');
  const STORAGE_KEY = 'myProject';

  function renderCard(project) {
    grid.innerHTML = '';
    const { title, desc, max } = project;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-title">${title}</div>
        <div class="card-desc">${desc}</div>
      </div>
      <div class="card-meta">참여: 0/${max}명</div>
      <div class="btn-actions">
        <button class="btn-join">참여하기</button>
        <button class="btn-remove">삭제</button>
      </div>
    `;
    // 삭제 이벤트
    card.querySelector('.btn-remove').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      grid.innerHTML = '';
    });
    grid.appendChild(card);
    }

    // 기존 프로젝트 로드
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      renderCard(JSON.parse(stored));
    }

    // 새 프로젝트 생성
  createBtn.addEventListener('click', () => {
    const title = prompt('프로젝트 제목을 입력하세요.');
    if (!title) return;
    const desc = prompt('프로젝트 설명을 입력하세요.') || '';
    const max = prompt('최대 참여 인원을 입력하세요.') || '0';
    const project = { title, desc, max };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    renderCard(project);
  });
});