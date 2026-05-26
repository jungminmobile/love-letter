// ── 카카오 앱 키 설정 (발급 후 여기에 입력) ──
// kakao.com/developers 에서 앱 생성 후 JavaScript 키를 아래에 입력하세요
const KAKAO_APP_KEY = '0acd7248f284f0f9a09b67aa5a5943fa';

let selectedFiles = [];
let generatedUrl = '';

const titleInput = document.getElementById('titleInput');
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const photoInput = document.getElementById('photoInput');
const uploadZone = document.getElementById('uploadZone');
const previewGrid = document.getElementById('previewGrid');
const letterForm = document.getElementById('letterForm');
const submitBtn = document.getElementById('submitBtn');
const shareModal = document.getElementById('shareModal');
const shareUrlInput = document.getElementById('shareUrl');
const toast = document.getElementById('toast');

// ── 글자 수 카운터 ──
textInput.addEventListener('input', () => {
  charCount.textContent = textInput.value.length;
});

// ── 사진 업로드: 드래그 앤 드롭 ──
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  addFiles(files);
});

// ── 사진 업로드: 파일 선택 ──
photoInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
  photoInput.value = '';
});

function addFiles(newFiles) {
  const remaining = 5 - selectedFiles.length;
  if (remaining <= 0) {
    showToast('사진은 최대 5장까지 추가할 수 있어요');
    return;
  }
  const toAdd = newFiles.slice(0, remaining);
  selectedFiles = [...selectedFiles, ...toAdd];
  renderPreviews();
}

function renderPreviews() {
  previewGrid.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = `사진 ${index + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.textContent = '✕';
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFiles.splice(index, 1);
      renderPreviews();
    });

    item.appendChild(img);
    item.appendChild(removeBtn);
    previewGrid.appendChild(item);
  });
}

// ── 폼 제출 ──
letterForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  if (!text) {
    showToast('편지 내용을 입력해주세요 💌');
    textInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('.submit-text').textContent = '편지 봉투에 넣는 중...';

  try {
    const formData = new FormData();
    formData.append('title', titleInput.value.trim());
    formData.append('text', text);
    selectedFiles.forEach(file => formData.append('photos', file));

    const res = await fetch('/api/letters', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '오류가 발생했어요');
    }

    const data = await res.json();
    generatedUrl = window.location.origin + data.url;
    openShareModal(generatedUrl);
  } catch (err) {
    showToast(err.message || '오류가 발생했어요. 다시 시도해주세요.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.submit-text').textContent = '편지 완성하기';
  }
});

// ── 공유 모달 ──
function openShareModal(url) {
  shareUrlInput.value = url;
  shareModal.classList.add('visible');

  initKakao();
}

document.getElementById('modalClose').addEventListener('click', () => {
  shareModal.classList.remove('visible');
});

shareModal.addEventListener('click', (e) => {
  if (e.target === shareModal) shareModal.classList.remove('visible');
});

// 링크 복사 (모달 내 인라인)
document.getElementById('copyInlineBtn').addEventListener('click', () => {
  copyToClipboard(shareUrlInput.value);
});

// 카카오 공유
document.getElementById('modalKakaoBtn').addEventListener('click', () => {
  shareKakao(generatedUrl, titleInput.value.trim());
});

// 인스타 DM용 링크 복사
document.getElementById('modalInstaBtn').addEventListener('click', () => {
  copyToClipboard(generatedUrl, '인스타 DM에 붙여넣기 하세요! 📸');
});

// ── 카카오 SDK 초기화 ──
function initKakao() {
  if (typeof Kakao === 'undefined') return;
  if (!Kakao.isInitialized() && KAKAO_APP_KEY) {
    Kakao.init(KAKAO_APP_KEY);
  }
}

function shareKakao(url, title) {
  if (typeof Kakao === 'undefined' || !KAKAO_APP_KEY || !Kakao.isInitialized()) {
    showToast('카카오 앱 키가 필요해요. SETUP.md를 확인해주세요!');
    copyToClipboard(url, '링크를 복사했어요. 카카오톡에서 직접 붙여넣기 해주세요 💌');
    return;
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: title || '💌 나만을 위한 편지가 도착했어요',
      description: '봉투를 열어서 편지를 확인해보세요 💕',
      link: { mobileWebUrl: url, webUrl: url }
    },
    buttons: [{
      title: '편지 열어보기 💌',
      link: { mobileWebUrl: url, webUrl: url }
    }]
  });
}

// ── 유틸 ──
function copyToClipboard(text, msg = '링크를 복사했어요! 📋') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(msg));
  } else {
    const el = document.createElement('input');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(msg);
  }
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
