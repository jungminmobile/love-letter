# 💌 편지 웹앱 시작 가이드

## 1. 패키지 설치 및 서버 실행

```bash
cd love-letter
npm install
node server.js
```

브라우저에서 http://localhost:3000 접속

---

## 2. 카카오톡 공유 기능 설정

카카오 공유 버튼을 사용하려면 아래 단계를 따라하세요.

### ① 카카오 개발자 계정 만들기

1. https://developers.kakao.com 접속
2. 우측 상단 **로그인** → 카카오 계정으로 로그인
3. 로그인 후 **내 애플리케이션** 클릭

### ② 앱 만들기

1. **애플리케이션 추가하기** 클릭
2. 앱 이름: `love-letter` (원하는 이름 입력)
3. 사업자명: 본인 이름 입력
4. **저장** 클릭

### ③ JavaScript 키 복사

1. 생성된 앱 클릭 → **앱 키** 탭
2. **JavaScript 키** 복사 (예: `abcdef1234567890abcdef1234567890`)

### ④ 플랫폼 등록

1. 좌측 메뉴 **플랫폼** 클릭
2. **Web 플랫폼 등록** 클릭
3. 사이트 도메인 입력:
   - 로컬 테스트: `http://localhost:3000`
   - 배포 후: 실제 도메인 추가

### ⑤ 키를 코드에 입력

**`public/js/create.js`** 파일 상단:
```javascript
const KAKAO_APP_KEY = 'YOUR_JAVASCRIPT_KEY_HERE';
//                     ↑ 복사한 키로 교체
```

---

## 3. 인터넷에 공유하기 (배포)

친구/여자친구가 링크를 열려면 서버를 인터넷에 올려야 해요.

### Railway (추천, 무료)

1. https://railway.app 가입
2. **New Project** → **Deploy from GitHub repo** 또는 **Deploy from local**
3. 이 폴더를 GitHub에 올린 뒤 연결
4. 배포 완료 후 발급된 URL을 카카오 플랫폼에 추가

### Render (무료)

1. https://render.com 가입
2. **New Web Service** → GitHub 연결
3. Start Command: `node server.js`
4. 배포 후 URL 확인

> 💡 배포 없이 로컬 테스트만 할 때는 `링크 복사` 버튼을 이용해서
> 같은 와이파이의 기기끼리 `http://[내IP]:3000/letter/[id]` 형식으로 공유할 수 있어요.

---

## 4. 업로드 사진 유지

서버를 재시작해도 사진이 유지되도록 `uploads/` 폴더를 백업해두세요.
배포 환경에서는 AWS S3, Cloudinary 등 클라우드 스토리지 연동을 권장합니다.
