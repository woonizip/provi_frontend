function go(target){ if(!target) return; window.location.href = target; }

document.querySelectorAll('.card').forEach(card=>{
  const target = card.getAttribute('data-target');

  // 마우스 클릭
  card.addEventListener('click', ()=> go(target));

  // 키보드 접근성
  // card.addEventListener('keydown', (e)=>{
    // if(e.key === 'Enter' || e.key === ' '){
      // e.preventDefault();
      // go(target);
    // }
  // });
});

/* 파일 경로를 바꾸고 싶으면 이렇게도 가능
document.querySelector('[aria-label="질문형 추천으로 이동"]').dataset.target = '/stack/quiz';
document.querySelector('[aria-label="대화형 추천으로 이동"]').dataset.target = '/stack/chat';
*/