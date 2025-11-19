# Generative Lecture Demo

정적 GitHub Pages용 MVP 데모입니다.

## 기능

- 비디오 플레이어
- **Shift + 클릭 드래그**로 영역 선택
- **우클릭**으로 Ask 창 열기
- 질문 입력 시 미리 녹화된 아바타 응답 비디오 재생

## 사용 방법

1. **Shift 키를 누른 채로 드래그**하여 영역 선택
2. 또는 **비디오에서 우클릭**하여 Ask 창 열기
3. 질문을 입력하고 **Send** 버튼 클릭
4. 매칭되는 응답 비디오가 boundingBox 영역(instructorRegion)에 재생됩니다

## 파일 구조

```
GenerativeLectureDemo/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일시트
├── script.js           # JavaScript 로직
├── predefinedQnA.json  # 질문-응답 매핑 데이터
├── boundingBoxList.json # boundingBox 설정
├── video/              # 메인 강의 비디오 폴더
│   └── linear-algebra.mp4
└── response/           # 아바타 응답 비디오 폴더
    ├── linear-algebra-matrix.mp4
    ├── linear-algebra-multiplication.mp4
    └── ...
```

## 데이터 준비

### 1. predefinedQnA.json 수정

질문과 응답 비디오 경로를 추가하세요:

```json
{
  "linear-algebra": [
    {
      "questions": [
        "what is a matrix?",
        "matrix란 무엇인가"
      ],
      "videoPath": "./response/linear-algebra-matrix.mp4",
      "boundingBox": "instructorRegion"
    }
  ]
}
```

### 2. response/ 폴더에 비디오 추가

`predefinedQnA.json`에 지정한 경로에 해당 비디오 파일을 배치하세요.

## JavaScript를 사용하는 이유

이 데모는 **정적 GitHub Pages**용이므로:

1. **빌드 과정 불필요**: TypeScript 컴파일이 필요 없음
2. **브라우저에서 직접 실행**: HTML/CSS/JS만으로 동작
3. **배포 간단**: 파일만 업로드하면 됨
4. **의존성 없음**: Node.js나 빌드 도구 불필요

TypeScript를 사용하려면 Next.js 프로젝트 내에서 별도 페이지로 만드는 것이 좋습니다.

## 로컬 테스트

간단한 HTTP 서버로 테스트할 수 있습니다:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server -p 8000
```

그 후 브라우저에서 `http://localhost:8000` 접속

## GitHub Pages 배포

1. 이 폴더의 내용을 GitHub 저장소에 푸시
2. GitHub 저장소 Settings → Pages
3. Source를 해당 폴더로 설정
4. 배포 완료!

