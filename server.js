const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const LETTERS_FILE = path.join(DATA_DIR, 'letters.json');

[UPLOADS_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(LETTERS_FILE)) {
  fs.writeFileSync(LETTERS_FILE, JSON.stringify({}));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다'));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

function readLetters() {
  try {
    return JSON.parse(fs.readFileSync(LETTERS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeLetters(data) {
  fs.writeFileSync(LETTERS_FILE, JSON.stringify(data, null, 2));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// POST /api/letters — 편지 생성
app.post('/api/letters', upload.array('photos', 5), (req, res) => {
  const { title, text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: '편지 내용을 입력해주세요' });
  }

  const id = uuidv4();
  const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

  const letter = {
    id,
    title: (title || '').trim(),
    text: text.trim(),
    photos,
    createdAt: new Date().toISOString()
  };

  const letters = readLetters();
  letters[id] = letter;
  writeLetters(letters);

  res.json({ id, url: `/letter/${id}` });
});

// GET /api/letters/:id — 편지 데이터 조회
app.get('/api/letters/:id', (req, res) => {
  const letters = readLetters();
  const letter = letters[req.params.id];
  if (!letter) return res.status(404).json({ error: '편지를 찾을 수 없어요' });
  res.json(letter);
});

// GET /letter/:id — 동적 HTML (OG 메타태그 포함)
app.get('/letter/:id', (req, res) => {
  const letters = readLetters();
  const letter = letters[req.params.id];
  if (!letter) {
    return res.status(404).send(`
      <!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
      <title>편지를 찾을 수 없어요</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff0f3;color:#c9184a;flex-direction:column;gap:16px}h1{font-size:1.5rem}a{color:#ff4d6d;text-decoration:none;font-size:0.9rem}</style>
      </head><body><h1>💌 편지를 찾을 수 없어요</h1><a href="/">새 편지 작성하러 가기</a></body></html>
    `);
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const baseUrl = `${protocol}://${req.get('host')}`;
  const firstPhoto = letter.photos[0] ? `${baseUrl}${letter.photos[0]}` : '';
  const ogTitle = escapeHtml(letter.title || '💌 나만을 위한 편지가 도착했어요');

  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${ogTitle}</title>

  <meta property="og:type" content="website">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="봉투를 열어서 편지를 확인해보세요 💕">
  ${firstPhoto ? `<meta property="og:image" content="${escapeHtml(firstPhoto)}">` : ''}
  <meta property="og:url" content="${escapeHtml(`${baseUrl}/letter/${letter.id}`)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="봉투를 열어서 편지를 확인해보세요 💕">
  ${firstPhoto ? `<meta name="twitter:image" content="${escapeHtml(firstPhoto)}">` : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/view.css">

  <script>
    window.LETTER_DATA = ${JSON.stringify(letter)};
    window.BASE_URL = "${escapeHtml(baseUrl)}";
    window.LETTER_URL = "${escapeHtml(`${baseUrl}/letter/${letter.id}`)}";
    window.KAKAO_APP_KEY = "${process.env.KAKAO_APP_KEY || ''}";
  </script>
</head>
<body>
  <div class="page" id="page">

    <!-- 봉투 화면 -->
    <div class="envelope-scene" id="envelopeScene">
      <div class="scene-bg"></div>

      <div class="envelope-wrapper">
        <div class="envelope" id="envelope">
          <!-- 봉투 뒷판 -->
          <div class="env-back"></div>

          <!-- 봉투 안 편지지 (솟아오르는 요소) -->
          <div class="letter-peek" id="letterPeek">
            <div class="letter-peek-content">
              <p class="peek-title" id="peekTitle"></p>
              <div class="peek-lines">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <!-- 봉투 앞면 장식 (좌/우/하단 삼각) -->
          <div class="env-front">
            <div class="env-tri env-tri-left"></div>
            <div class="env-tri env-tri-right"></div>
            <div class="env-tri env-tri-bottom"></div>
          </div>

          <!-- 봉투 날개 (열리는 부분) -->
          <div class="env-flap" id="envFlap">
            <div class="env-flap-inner"></div>
          </div>

          <!-- 하트 장식 -->
          <div class="env-heart">💌</div>
        </div>

        <p class="tap-hint" id="tapHint">봉투를 눌러서 열어보세요</p>
      </div>
    </div>

    <!-- 전체 편지 화면 -->
    <div class="letter-full" id="letterFull">
      <button class="close-btn" id="closeBtn">✕</button>

      <div class="letter-scroll">
        <div class="letter-paper-full">
          <!-- 편지 헤더 -->
          <div class="letter-header">
            <p class="letter-date" id="letterDate"></p>
            <h1 class="letter-title" id="letterTitle"></h1>
          </div>

          <!-- 사진 갤러리 -->
          <div class="photo-gallery" id="photoGallery"></div>

          <!-- 편지 본문 -->
          <div class="letter-body">
            <div class="letter-text" id="letterText"></div>
          </div>

          <!-- 편지 마무리 -->
          <div class="letter-footer">
            <p class="letter-sign">보내는 사람이 💕</p>
          </div>
        </div>
      </div>

      <!-- 공유 버튼 영역 -->
      <div class="share-bar">
        <button class="share-btn kakao-btn" id="kakaoShareBtn">
          <span class="share-icon">💬</span> 카카오톡 공유
        </button>
        <button class="share-btn copy-btn" id="copyLinkBtn">
          <span class="share-icon">🔗</span> 링크 복사
        </button>
      </div>
    </div>

  </div>

  <!-- 토스트 메시지 -->
  <div class="toast" id="toast"></div>

  <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" crossorigin="anonymous"></script>
  <script src="/js/view.js"></script>
</body>
</html>`);
});

// 루트 → 작성 페이지로
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

app.listen(PORT, () => {
  console.log(`\n💌 편지 서버가 시작되었습니다!`);
  console.log(`   작성 페이지: http://localhost:${PORT}/`);
  console.log(`   포트: ${PORT}\n`);
});
