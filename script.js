// 전역 변수
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let currentSelection = null;
let boundingBoxData = null;
let predefinedQnA = null;
let currentVideoName = 'physics';

// DOM 요소
const videoContainer = document.getElementById('videoContainer');
const mainVideo = document.getElementById('mainVideo');
const selectionLayer = document.getElementById('selectionLayer');
const askModal = document.getElementById('askModal');
const askPanel = document.getElementById('askPanel');
const questionInput = document.getElementById('questionInput');
const askSendBtn = document.getElementById('askSendBtn');
const visualSendBtn = document.getElementById('visualSendBtn');
const closeAskBtn = document.getElementById('closeAskBtn');
const stepByStepChip = document.getElementById('stepByStepChip');
const analogyChip = document.getElementById('analogyChip');
const lastQuestionChip = document.getElementById('lastQuestionChip');
const avatarOverlay = document.getElementById('avatarOverlay');
const avatarVideo = document.getElementById('avatarVideo');
const closeAvatarBtn = document.getElementById('closeAvatarBtn');
const handwritingOverlay = document.getElementById('handwritingOverlay');
const handwritingContainer = document.getElementById('handwritingContainer');
const imagePopupModal = document.getElementById('imagePopupModal');
const popupImage = document.getElementById('popupImage');
const closeImagePopupBtn = document.getElementById('closeImagePopupBtn');
const toastNotification = document.getElementById('toastNotification');

// Interactive Diagram 요소
const interactiveDiagramBtn = document.getElementById('interactiveDiagramBtn');
const diagramOverlay = document.getElementById('diagramOverlay');
const diagramIframe = document.getElementById('diagramIframe');
const closeDiagramBtn = document.getElementById('closeDiagramBtn');
const loadingState = document.getElementById('loadingState');
const diagramNameDisplay = document.getElementById('diagramName');

// 비디오 컨트롤 요소
const videoSelector = document.getElementById('videoSelector');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const seekBarContainer = document.getElementById('seekBarContainer');
const seekBarProgress = document.getElementById('seekBarProgress');
const seekBarHandle = document.getElementById('seekBarHandle');

// 마지막 입력한 질문 저장
let lastTypedQuestion = null;

// 초기화
async function init() {
  // boundingBox 데이터 로드 (캐시 방지)
  try {
    const response = await fetch(`./boundingBoxList.json?t=${Date.now()}`);
    boundingBoxData = await response.json();
    console.log('Loaded boundingBoxData:', boundingBoxData);
  } catch (error) {
    console.error('Failed to load boundingBoxList.json:', error);
  }

  // predefinedQnA 데이터 로드 (캐시 방지)
  try {
    const response = await fetch(`./predefinedQnA.json?t=${Date.now()}`);
    predefinedQnA = await response.json();
    console.log('Loaded predefinedQnA:', predefinedQnA);
  } catch (error) {
    console.error('Failed to load predefinedQnA.json:', error);
  }

  // 비디오 이름 추출 (URL에서)
  const videoSrc = mainVideo.src;
  const match = videoSrc.match(/\/([^/]+)\.mp4$/);
  if (match) {
    currentVideoName = match[1];
  }
  
  // 드롭다운 초기값 설정
  if (videoSelector) {
    videoSelector.value = currentVideoName;
  }

  setupEventListeners();
  setupVideoControls();
}

// 비디오 변경 함수
function changeVideo(videoName) {
  console.log('Changing video to:', videoName);
  
  // 현재 비디오 이름 업데이트
  currentVideoName = videoName;
  
  // 비디오 소스 변경
  const wasPlaying = !mainVideo.paused;
  mainVideo.src = `./video/${videoName}.mp4`;
  mainVideo.load();
  
  // 재생 중이었다면 다시 재생
  if (wasPlaying) {
    mainVideo.play().catch(err => {
      console.log('Auto-play prevented:', err);
    });
  }
  
  // duration 업데이트를 위해 loadedmetadata 기다림
  mainVideo.addEventListener('loadedmetadata', () => {
    durationDisplay.textContent = formatTime(mainVideo.duration);
  }, { once: true });
}

// 비디오 컨트롤 설정
function setupVideoControls() {
  const videoControls = document.getElementById('videoControls');
  
  // 컨트롤 바 영역의 모든 이벤트는 여기서만 처리
  videoControls.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // videoContainer로 전파 방지
  });
  
  videoControls.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation(); // videoContainer의 contextmenu 방지
  });
  
  // 비디오 선택 드롭다운
  if (videoSelector) {
    videoSelector.addEventListener('change', (e) => {
      e.stopPropagation();
      const selectedVideo = e.target.value;
      changeVideo(selectedVideo);
    });
  }
  
  // 재생/일시정지 버튼
  playPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
  
  // 시크바 클릭/드래그
  let isSeeking = false;
  
  seekBarContainer.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isSeeking = true;
    updateSeekPosition(e);
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isSeeking) {
      e.preventDefault();
      updateSeekPosition(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isSeeking = false;
  });
  
  // 비디오 시간 업데이트
  mainVideo.addEventListener('timeupdate', updateTimeDisplay);
  mainVideo.addEventListener('loadedmetadata', () => {
    durationDisplay.textContent = formatTime(mainVideo.duration);
  });
  
  // 재생 상태 변경
  mainVideo.addEventListener('play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  });
  
  mainVideo.addEventListener('pause', () => {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  });
}

// 재생/일시정지 토글
function togglePlayPause() {
  if (mainVideo.paused) {
    mainVideo.play();
  } else {
    mainVideo.pause();
  }
}

// 시간 표시 업데이트
function updateTimeDisplay() {
  currentTimeDisplay.textContent = formatTime(mainVideo.currentTime);
  const progress = (mainVideo.currentTime / mainVideo.duration) * 100;
  seekBarProgress.style.width = progress + '%';
  seekBarHandle.style.left = progress + '%';
}

// 시크바 위치 업데이트
function updateSeekPosition(e) {
  // 비디오가 로드되지 않았거나 duration이 없으면 리턴
  if (!mainVideo.duration || !isFinite(mainVideo.duration)) {
    return;
  }
  
  // seekable 범위 확인
  if (mainVideo.seekable.length === 0) {
    return;
  }
  
  const rect = seekBarContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;
  
  if (width <= 0) {
    return;
  }
  
  const percent = Math.max(0, Math.min(1, x / width));
  let newTime = percent * mainVideo.duration;
  
  // seekable 범위 내로 제한
  const seekableStart = mainVideo.seekable.start(0);
  const seekableEnd = mainVideo.seekable.end(mainVideo.seekable.length - 1);
  newTime = Math.max(seekableStart, Math.min(seekableEnd, newTime));
  
  mainVideo.currentTime = newTime;
}

// 시간 포맷팅 (초를 MM:SS 형식으로)
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // Shift + 클릭 드래그로 영역 선택
  videoContainer.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // 우클릭으로 Ask 창 열기
  videoContainer.addEventListener('contextmenu', handleRightClick);

  // Ask 모달 이벤트
  askSendBtn.addEventListener('click', handleAskSend);
  visualSendBtn.addEventListener('click', handleVisualSend);
  closeAskBtn.addEventListener('click', closeAskModal);
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskSend();
    }
  });
  
  // 칩 버튼 이벤트
  stepByStepChip.addEventListener('click', () => {
    fillPrompt("walk me through this step by step.");
  });
  analogyChip.addEventListener('click', () => {
    fillPrompt("can you make an analogy");
  });
  lastQuestionChip.addEventListener('click', () => {
    if (lastTypedQuestion) {
      fillPrompt(lastTypedQuestion);
    }
  });

  // 아바타 비디오 닫기
  closeAvatarBtn.addEventListener('click', closeAvatarVideo);

  // 이미지 팝업 닫기
  closeImagePopupBtn.addEventListener('click', closeImagePopup);
  
  // 이미지 팝업 외부 클릭 시 닫기
  document.addEventListener('mousedown', (e) => {
    if (imagePopupModal.style.display === 'flex') {
      const imagePopupContent = document.querySelector('.image-popup-content');
      if (imagePopupContent && !imagePopupContent.contains(e.target)) {
        closeImagePopup();
      }
    }
  });

  // 모달 배경 클릭 시 닫기
  askModal.addEventListener('mousedown', (e) => {
    if (e.target === askModal) {
      closeAskModal();
    }
  });
  
  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && askModal.style.display === 'block') {
      closeAskModal();
    } else if (e.key === 'Escape' && diagramOverlay && diagramOverlay.style.display === 'block') {
      closeDiagram();
    }
  });
  
  // Interactive Diagram 버튼 클릭 이벤트
  if (interactiveDiagramBtn) {
    interactiveDiagramBtn.addEventListener('click', () => {
      console.log('Interactive Diagram button clicked for video:', currentVideoName);
      openDiagramForCurrentVideo();
    });
  } else {
    console.error('Interactive Diagram button not found!');
  }
  
  // Diagram 닫기 버튼
  if (closeDiagramBtn) {
    closeDiagramBtn.addEventListener('click', closeDiagram);
  }
  
  // Diagram 오버레이 배경 클릭시 닫기
  if (diagramOverlay) {
    diagramOverlay.addEventListener('click', (e) => {
      if (e.target === diagramOverlay) {
        closeDiagram();
      }
    });
  }
  
  // Diagram Iframe 로드 완료
  if (diagramIframe) {
    diagramIframe.addEventListener('load', () => {
      console.log('Diagram loaded');
      
      // 로딩 상태 숨기기
      if (diagramIframe.src && loadingState) {
        loadingState.classList.add('hidden');
      }
    });
  }
}


// 컨트롤 바 영역인지 확인
function isControlBarArea(target) {
  const videoControls = document.getElementById('videoControls');
  return videoControls && videoControls.contains(target);
}

// 마우스 다운 이벤트 (Shift + 클릭)
function handleMouseDown(e) {
  // 컨트롤 바 영역이면 무시
  if (isControlBarArea(e.target)) {
    return;
  }
  
  if (!e.shiftKey) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const rect = videoContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  isSelecting = true;
  selectionStart = { x, y };
  
  // 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // 기존 선택 영역 제거
  clearSelection();
}

// 마우스 이동 이벤트
function handleMouseMove(e) {
  if (!isSelecting) return;
  
  const rect = videoContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  drawSelectionBox(selectionStart.x, selectionStart.y, x, y);
}

// 마우스 업 이벤트
function handleMouseUp(e) {
  if (!isSelecting) return;
  
  isSelecting = false;
  
  const rect = videoContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 선택 영역 저장
  const box = {
    startX: Math.min(selectionStart.x, x),
    startY: Math.min(selectionStart.y, y),
    endX: Math.max(selectionStart.x, x),
    endY: Math.max(selectionStart.y, y)
  };
  
  // 너무 작은 영역은 무시
  if (Math.abs(box.endX - box.startX) < 10 || Math.abs(box.endY - box.startY) < 10) {
    clearSelection();
    return;
  }
  
  currentSelection = box;
  
  // Ask 모달 열기
  openAskModal(e.clientX, e.clientY);
}

// 우클릭 이벤트
function handleRightClick(e) {
  // 컨트롤 바 영역이면 무시 (컨트롤 바에서 이미 preventDefault됨)
  if (isControlBarArea(e.target)) {
    return;
  }
  
  e.preventDefault();
  
  // 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // Ask 모달 열기
  openAskModal(e.clientX, e.clientY);
}

// 선택 박스 그리기
function drawSelectionBox(x1, y1, x2, y2) {
  clearSelection();
  
  const box = document.createElement('div');
  box.className = 'selection-box';
  box.style.left = Math.min(x1, x2) + 'px';
  box.style.top = Math.min(y1, y2) + 'px';
  box.style.width = Math.abs(x2 - x1) + 'px';
  box.style.height = Math.abs(y2 - y1) + 'px';
  
  selectionLayer.appendChild(box);
}

// 선택 영역 제거
function clearSelection() {
  selectionLayer.innerHTML = '';
}

// 프롬프트 채우기
function fillPrompt(text) {
  questionInput.value = text;
  questionInput.focus();
}

// Ask 모달 열기
function openAskModal(x, y) {
  askModal.style.display = 'block';
  
  // 패널 위치 설정 (클릭 위치 기준)
  const offset = 12;
  const margin = 8;
  const panelWidth = 340;
  const panelHeight = 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  
  const nextX = Math.min(Math.max(margin, x + offset), vw - panelWidth - margin);
  const nextY = Math.min(Math.max(margin, y + offset), vh - panelHeight - margin);
  
  askPanel.style.left = nextX + 'px';
  askPanel.style.top = nextY + 'px';
  
  // 입력 필드 초기화 및 포커스
  questionInput.value = '';
  setTimeout(() => questionInput.focus(), 0);
  
  // 마지막 질문 칩 표시/숨김
  if (lastTypedQuestion) {
    lastQuestionChip.textContent = `"${lastTypedQuestion}"`;
    lastQuestionChip.style.display = 'inline-block';
  } else {
    lastQuestionChip.style.display = 'none';
  }
}

// Ask 모달 닫기
function closeAskModal() {
  askModal.style.display = 'none';
  clearSelection();
  currentSelection = null;
}

// 질문 정규화 함수
function normalizeText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Ask 전송 처리
async function handleAskSend() {
  const raw = questionInput.value.trim();
  const effective = raw || "please explain this";
  const normalized = normalizeText(effective);
  
  let question = effective;
  
  // 특정 패턴 감지
  if (normalized === normalizeText("please explain this")) {
    // Quick 질문으로 처리
    question = "what is this? Give me a quick definition less than 15 words.";
  } else if (normalized.includes("analogy")) {
    // Analogy 질문으로 처리
    question = "please make an analogy of the content in the attached image";
  } else if (normalized.includes("step")) {
    // Step-by-step 질문으로 처리
    question = "I don't understand this. Please provide a step-by-step breakdown with clear explanations within 100 words.";
  } else {
    // 사용자 입력 질문 저장
    if (raw && normalized !== normalizeText("please explain this") && 
        normalized !== normalizeText("walk me through this step by step.") &&
        normalized !== normalizeText("can you make an analogy")) {
      lastTypedQuestion = raw;
    }
  }
  
  // predefinedQnA에서 매칭되는 응답 찾기
  const matchedResponse = findMatchingResponse(question);
  
  if (!matchedResponse) {
    showToast('Saved generated response not available');
    closeAskModal();
    return;
  }
  
  // 아바타 비디오 재생
  await playAvatarVideo(matchedResponse.videoPath, matchedResponse.boundingBox);
  
  // handwriting도 함께 표시
  if (matchedResponse.handwritingText) {
    showHandwritingOverlay(
      matchedResponse.handwritingText, 
      currentSelection,
      matchedResponse.handwritingBoundingBox
    );
  }
  
  closeAskModal();
}

// Enhanced Visual 전송 처리
async function handleVisualSend() {
  // 비디오별 Enhanced Visual 이미지 매핑
  const enhancedVisualMap = {
    'physics': './response/physics-quarks.png',
    'linear-algebra': './response/linear-algebra-geometric-transformations.png',
    'machinelearning': './response/machinelearning-forward-propagation.png'
  };
  
  // 현재 비디오에 맞는 이미지 선택
  const imagePath = enhancedVisualMap[currentVideoName] || './response/enhancedVisual.png';
  
  console.log('Showing Enhanced Visual for:', currentVideoName, '→', imagePath);
  
  // Enhanced Visual 이미지 표시
  showImagePopup(imagePath);
  closeAskModal();
}

// 이미지 팝업 표시
function showImagePopup(imagePath) {
  popupImage.src = imagePath;
  
  // 화면 중앙에 위치
  const imagePopupContent = document.querySelector('.image-popup-content');
  imagePopupContent.style.left = '50%';
  imagePopupContent.style.top = '50%';
  imagePopupContent.style.transform = 'translate(-50%, -50%)';
  
  imagePopupModal.style.display = 'flex';
  
  // 메인 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
}

// 이미지 팝업 닫기
function closeImagePopup() {
  imagePopupModal.style.display = 'none';
  popupImage.src = '';
  
  // 메인 비디오 재개
  if (mainVideo.paused) {
    mainVideo.play();
  }
}

// 질문에 매칭되는 응답 찾기
function findMatchingResponse(question) {
  if (!predefinedQnA || !predefinedQnA[currentVideoName]) {
    return null;
  }
  
  const qnaList = predefinedQnA[currentVideoName];
  const lowerQuestion = question.toLowerCase();
  
  // 정확한 매칭 먼저 시도
  for (const item of qnaList) {
    if (item.questions.some(q => q.toLowerCase() === lowerQuestion)) {
      return item;
    }
  }
  
  // 부분 매칭 시도
  for (const item of qnaList) {
    if (item.questions.some(q => 
      lowerQuestion.includes(q.toLowerCase()) || 
      q.toLowerCase().includes(lowerQuestion)
    )) {
      return item;
    }
  }
  
  return null;
}

// 아바타 비디오 재생
async function playAvatarVideo(videoPath, boundingBox) {
  // 메인 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // boundingBox 영역 계산
  const videoRect = videoContainer.getBoundingClientRect();
  const boundingBoxConfig = getBoundingBoxConfig();
  
  if (!boundingBoxConfig) {
    console.error('Bounding box config not found');
    return;
  }
  
  // 비디오 로드
  avatarVideo.src = videoPath;
  avatarVideo.load();
  
  // boundingBox 영역에 맞춰 오버레이 위치 및 크기 설정
  const instructorRegion = boundingBoxConfig.instructorRegion;
  const scaleX = videoRect.width / 1920; // 원본 비디오 너비 기준
  const scaleY = videoRect.height / 1080; // 원본 비디오 높이 기준
  
  avatarOverlay.style.left = (instructorRegion.x * scaleX) + 'px';
  avatarOverlay.style.top = (instructorRegion.y * scaleY) + 'px';
  avatarOverlay.style.width = (instructorRegion.width * scaleX) + 'px';
  avatarOverlay.style.height = (instructorRegion.height * scaleY) + 'px';
  
  // 오버레이 표시
  avatarOverlay.style.display = 'block';
  
  // 비디오 재생
  try {
    await avatarVideo.play();
  } catch (error) {
    console.error('Failed to play avatar video:', error);
  }
  
  // 비디오 종료 시 오버레이 숨기기
  avatarVideo.addEventListener('ended', closeAvatarVideo, { once: true });
}

// 아바타 비디오 닫기
function closeAvatarVideo() {
  avatarOverlay.style.display = 'none';
  avatarVideo.pause();
  avatarVideo.currentTime = 0;
  
  // handwriting도 함께 닫기
  closeHandwritingOverlay();
  
  // 메인 비디오 재개
  if (mainVideo.paused) {
    mainVideo.play();
  }
}

// Handwriting 오버레이 표시 (Vara.js 사용, 지정된 boundingBox에)
function showHandwritingOverlay(text, selectedBox, handwritingBBox) {
  console.log('showHandwritingOverlay called with text:', text);
  console.log('handwritingBBox:', handwritingBBox);
  
  // Vara가 로드되었는지 확인
  if (typeof Vara === 'undefined') {
    console.error('Vara is not loaded yet');
    handwritingContainer.innerHTML = `<p style="font-size: 24px; color: #1e40af;">${text.replace(/\n/g, '<br>')}</p>`;
    return;
  }
  
  // 컨테이너 초기화
  handwritingContainer.innerHTML = '';
  
  // 비디오 컨테이너 크기 가져오기
  const videoRect = videoContainer.getBoundingClientRect();
  
  // handwritingBBox가 있으면 그것을 사용, 없으면 기본 중앙 위치
  let overlayX, overlayY, overlayWidth, overlayHeight;
  
  if (handwritingBBox) {
    // boundingBox 좌표를 현재 비디오 크기에 맞게 스케일링
    const scaleX = videoRect.width / 1920; // 원본 비디오 너비 기준
    const scaleY = videoRect.height / 1080; // 원본 비디오 높이 기준
    
    overlayX = handwritingBBox.x * scaleX;
    overlayY = handwritingBBox.y * scaleY;
    overlayWidth = handwritingBBox.width * scaleX;
    overlayHeight = handwritingBBox.height * scaleY;
  } else {
    // 기본값: 비디오 중앙
    overlayWidth = videoRect.width * 0.6;
    overlayHeight = videoRect.height * 0.5;
    overlayX = videoRect.width * 0.2;
    overlayY = videoRect.height * 0.25;
  }
  
  handwritingOverlay.style.left = overlayX + 'px';
  handwritingOverlay.style.top = overlayY + 'px';
  handwritingOverlay.style.width = overlayWidth + 'px';
  handwritingOverlay.style.height = overlayHeight + 'px';
  handwritingOverlay.style.display = 'block';
  
  console.log('Handwriting overlay position:', { x: overlayX, y: overlayY, width: overlayWidth, height: overlayHeight });
  
  // Vara.js 애니메이션 생성
  try {
    const vara = new Vara(
      '#handwritingContainer',
      'https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json',
      [{
        text: text,
        fontSize: 14,
        strokeWidth: 2,
        color: '#1e40af',
        duration: 4000,
        textAlign: 'left',
      }],
      {
        autoAnimation: true,
        fontSize: 12,
        strokeWidth: 1,
        color: '#1e40af'
      }
    );
    
    vara.ready(() => {
      console.log('Vara handwriting animation ready');
    });
    
    vara.animationEnd(() => {
      console.log('Vara handwriting animation completed');
    });
  } catch (error) {
    console.error('Error creating Vara instance:', error);
    handwritingContainer.innerHTML = `<p style="font-size: 24px; color: #1e40af;">${text.replace(/\n/g, '<br>')}</p>`;
  }
}

// Handwriting 오버레이 닫기
function closeHandwritingOverlay() {
  // handwriting만 닫기
  if (handwritingOverlay.style.display !== 'none') {
    handwritingOverlay.style.display = 'none';
    handwritingContainer.innerHTML = '';
  }
}

// boundingBox 설정 가져오기
function getBoundingBoxConfig() {
  if (!boundingBoxData || !boundingBoxData.boundingBoxes) {
    return null;
  }
  
  return boundingBoxData.boundingBoxes.find(
    box => box.name === currentVideoName
  );
}

// Interactive Diagram 관련 함수
const diagramFileMap = {
  'physics': 'physics.html',
  'linear-algebra': 'linear-algebra.html',
  'machinelearning': 'machinelearning.html'
};

const diagramNames = {
  'physics': 'Structure of Matter',
  'linear-algebra': 'Geometric Transformations',
  'machinelearning': 'Perceptron Model'
};

// 현재 비디오에 맞는 Diagram 열기
function openDiagramForCurrentVideo() {
  const diagramFile = diagramFileMap[currentVideoName];
  const diagramTitle = diagramNames[currentVideoName];
  
  if (!diagramFile) {
    console.error('No diagram found for video:', currentVideoName);
    alert('No interactive diagram available for this video');
    return;
  }
  
  console.log('Opening diagram:', diagramFile);
  
  if (!diagramOverlay || !diagramIframe) {
    console.error('Diagram overlay or iframe not found!');
    return;
  }
  
  // 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // 로딩 상태 표시
  if (loadingState) {
    loadingState.classList.remove('hidden');
  }
  if (diagramNameDisplay) {
    diagramNameDisplay.textContent = diagramTitle || 'Interactive Diagram';
  }
  
  // Iframe src 설정 (캐시 방지)
  const diagramPath = `./Assets/${diagramFile}?t=${Date.now()}`;
  console.log('Setting iframe src to:', diagramPath);
  diagramIframe.src = diagramPath;
  
  // 오버레이 표시
  console.log('Showing overlay');
  diagramOverlay.style.display = 'block';
}

// Diagram 닫기
function closeDiagram() {
  console.log('Closing diagram');
  
  // 오버레이 숨기기
  if (diagramOverlay) {
    diagramOverlay.style.display = 'none';
  }
  
  // Iframe src 초기화 (리소스 해제)
  if (diagramIframe) {
    diagramIframe.src = '';
  }
  
  // 로딩 상태 초기화
  if (loadingState) {
    loadingState.classList.remove('hidden');
  }
}

// 토스트 알림 표시
function showToast(message, duration = 1000) {
  if (!toastNotification) return;
  
  toastNotification.textContent = message;
  toastNotification.classList.add('show');
  
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, duration);
}

// 초기화 실행
init();

console.log('Interactive Lecture Demo initialized with Diagrams');

