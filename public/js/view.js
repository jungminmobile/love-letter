(function () {
  // ── 카카오 앱 키 (서버에서 주입됨, 없으면 빈 문자열) ──
  const KAKAO_APP_KEY = window.KAKAO_APP_KEY || '';
  const letter = window.LETTER_DATA;
  const letterUrl = window.LETTER_URL || location.href;

  if (!letter) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.2rem;color:#c9184a;">편지 데이터를 불러올 수 없어요 😢</div>';
    return;
  }

  // ── 요소 참조 ──
  const envelope = document.getElementById('envelope');
  const envFlap = document.getElementById('envFlap');
  const letterPeek = document.getElementById('letterPeek');
  const letterFull = document.getElementById('letterFull');
  const envelopeScene = document.getElementById('envelopeScene');
  const tapHint = document.getElementById('tapHint');
  const toast = document.getElementById('toast');

  // ── 편지 내용 렌더링 ──
  function renderLetter() {
    // 제목 / peek
    const peekTitle = document.getElementById('peekTitle');
    if (peekTitle) {
      peekTitle.textContent = letter.title || '사랑하는 너에게';
    }

    // 날짜
    const dateEl = document.getElementById('letterDate');
    if (dateEl && letter.createdAt) {
      const d = new Date(letter.createdAt);
      dateEl.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    }

    // 제목
    const titleEl = document.getElementById('letterTitle');
    if (titleEl) {
      titleEl.textContent = letter.title || '사랑하는 너에게';
    }

    // 사진 갤러리
    const gallery = document.getElementById('photoGallery');
    if (gallery && letter.photos && letter.photos.length > 0) {
      gallery.className = `photo-gallery count-${letter.photos.length}`;
      letter.photos.forEach((src) => {
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '추억 사진';
        img.loading = 'lazy';
        polaroid.appendChild(img);
        gallery.appendChild(polaroid);
      });
    }

    // 편지 본문
    const textEl = document.getElementById('letterText');
    if (textEl) {
      textEl.textContent = letter.text;
    }
  }

  renderLetter();

  // ── 봉투 상태 머신 ──
  // closed → opening → open → expanded
  let state = 'closed';

  function handleEnvelopeClick() {
    if (state === 'closed') {
      state = 'opening';
      envelope.classList.add('opening');
      tapHint.style.opacity = '0';

      // 날개 열림 후 편지지 솟아오름
      setTimeout(() => {
        state = 'open';
        envelope.classList.remove('opening');
        envelope.classList.add('open');
        tapHint.textContent = '편지를 클릭해서 열어보세요 💕';
        tapHint.style.opacity = '1';
      }, 950);
    }
  }

  function handleLetterPeekClick(e) {
    if (state !== 'open') return;
    e.stopPropagation();
    state = 'expanded';
    envelope.classList.add('expanded');
    letterFull.classList.add('visible');
    document.body.style.overflow = '';
  }

  envelope.addEventListener('click', handleEnvelopeClick);
  envFlap.addEventListener('click', handleEnvelopeClick);
  letterPeek.addEventListener('click', handleLetterPeekClick);

  // ── 닫기 버튼 ──
  const closeBtn = document.getElementById('closeBtn');
  closeBtn.addEventListener('click', () => {
    state = 'open';
    envelope.classList.remove('expanded');
    letterFull.classList.remove('visible');
    tapHint.textContent = '편지를 클릭해서 열어보세요 💕';
  });

  // ── 카카오 SDK 초기화 ──
  function initKakao() {
    if (typeof Kakao === 'undefined') return;
    if (!Kakao.isInitialized() && KAKAO_APP_KEY) {
      try { Kakao.init(KAKAO_APP_KEY); } catch {}
    }
  }

  initKakao();

  // ── 카카오 공유 ──
  document.getElementById('kakaoShareBtn').addEventListener('click', () => {
    if (typeof Kakao === 'undefined' || !KAKAO_APP_KEY || !Kakao.isInitialized()) {
      copyToClipboard(letterUrl, '카카오 앱 키가 없어서 링크를 복사했어요 💌');
      return;
    }

    const firstPhoto = letter.photos && letter.photos[0]
      ? `${window.BASE_URL}${letter.photos[0]}`
      : null;

    const shareParams = {
      objectType: 'feed',
      content: {
        title: letter.title || '💌 나만을 위한 편지가 도착했어요',
        description: '봉투를 열어서 편지를 확인해보세요 💕',
        link: { mobileWebUrl: letterUrl, webUrl: letterUrl }
      },
      buttons: [{
        title: '편지 열어보기 💌',
        link: { mobileWebUrl: letterUrl, webUrl: letterUrl }
      }]
    };

    if (firstPhoto) {
      shareParams.content.imageUrl = firstPhoto;
    }

    try {
      Kakao.Share.sendDefault(shareParams);
    } catch (err) {
      copyToClipboard(letterUrl, '링크를 복사했어요! 카카오톡에 붙여넣기 해주세요');
    }
  });

  // ── 링크 복사 ──
  document.getElementById('copyLinkBtn').addEventListener('click', () => {
    copyToClipboard(letterUrl);
  });

  // ── 유틸 ──
  function copyToClipboard(text, msg = '링크를 복사했어요! 📋') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(msg))
        .catch(() => legacyCopy(text, msg));
    } else {
      legacyCopy(text, msg);
    }
  }

  function legacyCopy(text, msg) {
    const el = document.createElement('input');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      showToast(msg);
    } catch {
      showToast('링크를 직접 복사해주세요: ' + text);
    }
    document.body.removeChild(el);
  }

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
})();
