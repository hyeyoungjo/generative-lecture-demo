// 전역 변수
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let currentSelection = null;
let boundingBoxData = null;
let predefinedQnA = null;
let currentVideoName = 'physics';
let highlightData = null;
let slideData = null;
let quizData = null;
let emptyRegionsData = null;
let completedQuizSlides = new Set();
let lastSlideNumber = 0;
let hoveredSegmentIndex = null;

// DOM 요소
const videoContainer = document.getElementById('videoContainer');
const mainVideo = document.getElementById('mainVideo');
const selectionLayer = document.getElementById('selectionLayer');
const highlightLayer = document.getElementById('highlightLayer');
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
const breakBtn = document.getElementById('breakBtn');
const breakOverlay = document.getElementById('breakOverlay');
const breakVideo = document.getElementById('breakVideo');
const closeBreakBtn = document.getElementById('closeBreakBtn');
const summaryBtn = document.getElementById('summaryBtn');
const learningInterestsInput = document.getElementById('learningInterestsInput');
const quizModal = document.getElementById('quizModal');
const quizContent = document.getElementById('quizContent');
const quizCloseBtn = document.getElementById('quizCloseBtn');
const quizDifficultySection = document.getElementById('quizDifficultySection');
const difficultySlider = document.getElementById('difficultySlider');
const difficultyValue = document.getElementById('difficultyValue');
const difficultyDescription = document.getElementById('difficultyDescription');
const quizTitle = document.getElementById('quizTitle');
const quizSlideBadge = document.getElementById('quizSlideBadge');
const quizCountBadge = document.getElementById('quizCountBadge');
const quizLevelBadge = document.getElementById('quizLevelBadge');
const currentQuestionNum = document.getElementById('currentQuestionNum');
const totalQuestionsNum = document.getElementById('totalQuestionsNum');
const correctCountBadge = document.getElementById('correctCountBadge');
const accuracyBadge = document.getElementById('accuracyBadge');
const progressBarContainer = document.getElementById('progressBarContainer');
const quizSummary = document.getElementById('quizSummary');

// 비디오 컨트롤 요소
const videoSelector = document.getElementById('videoSelector');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
// Segmented Progress Bar 요소
const segmentedProgressBarContainer = document.getElementById('segmentedProgressBarContainer');
const segmentedProgressBar = document.getElementById('segmentedProgressBar');
const progressIndicator = document.getElementById('progressIndicator');
const playhead = document.getElementById('playhead');
const quizIndicators = document.getElementById('quizIndicators');
const segmentLabelsContainer = document.getElementById('segmentLabelsContainer');
const hoveredSegmentInfo = document.getElementById('hoveredSegmentInfo');

// 마지막 입력한 질문 저장
let lastTypedQuestion = null;

// 인터랙션 히스토리 리셋 함수
function resetAllInteractionHistory() {
  try {
    // localStorage에서 모든 userInteractionHistory_* 키 찾기
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userInteractionHistory_')) {
        keysToRemove.push(key);
      }
    }
    
    // 모든 키 삭제
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed interaction history: ${key}`);
    });
    
    console.log(`Reset ${keysToRemove.length} interaction history entries`);
  } catch (error) {
    console.error('Failed to reset interaction history:', error);
  }
}

// 초기화
async function init() {
  // 매번 로딩 시마다 모든 인터랙션 히스토리 리셋
  // (개발/데모 목적)
  resetAllInteractionHistory();
  
  // URL 파라미터에서 비디오 이름 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const videoParam = urlParams.get('video');
  if (videoParam) {
    currentVideoName = videoParam;
    // 비디오 소스 변경
    mainVideo.src = `./video/${currentVideoName}.mp4`;
    mainVideo.load();
  } else {
    // URL 파라미터가 없으면 비디오 소스에서 추출
    const videoSrc = mainVideo.src;
    const match = videoSrc.match(/\/([^/]+)\.mp4$/);
    if (match) {
      currentVideoName = match[1];
    }
  }
  
  // 드롭다운 초기값 설정
  if (videoSelector) {
    videoSelector.value = currentVideoName;
  }
  
  // Learning Interests 초기값 설정
  updateLearningInterests(currentVideoName);
  
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

  // 하이라이트 데이터 로드
  await loadHighlightData();
  
  // 슬라이드 데이터 로드
  await loadSlideData();
  
  // 퀴즈 데이터 로드
  await loadQuizData();
  
  // 빈 공간 데이터 로드
  await loadEmptyRegionsData();

  setupEventListeners();
  setupVideoControls();
}

// 하이라이트 데이터 로드
async function loadHighlightData() {
  try {
    const response = await fetch(`./highlight/${currentVideoName}.json?t=${Date.now()}`);
    if (!response.ok) {
      console.log(`No highlight data for ${currentVideoName}`);
      highlightData = [];
      return;
    }
    highlightData = await response.json();
    console.log('Loaded highlight data:', highlightData);
    updateHighlights();
  } catch (error) {
    console.error('Failed to load highlight data:', error);
    highlightData = [];
  }
}

// 슬라이드 데이터 로드
async function loadSlideData() {
  try {
    const response = await fetch(`./slides/${currentVideoName}/lectureContent.json?t=${Date.now()}`);
    if (!response.ok) {
      console.log(`No slide data for ${currentVideoName}`);
      slideData = [];
      renderSegmentedProgressBar();
      return;
    }
    slideData = await response.json();
    console.log('Loaded slide data:', slideData);
    renderSegmentedProgressBar();
  } catch (error) {
    console.error('Failed to load slide data:', error);
    slideData = [];
    renderSegmentedProgressBar();
  }
}

// 퀴즈 데이터 로드
async function loadQuizData() {
  try {
    const response = await fetch(`./slides/${currentVideoName}/quizzes.json?t=${Date.now()}`);
    if (!response.ok) {
      console.log(`No quiz data for ${currentVideoName}`);
      quizData = null;
      return;
    }
    const data = await response.json();
    quizData = data.quizzes || {};
    console.log('Loaded quiz data:', quizData);
  } catch (error) {
    console.error('Failed to load quiz data:', error);
    quizData = null;
  }
}

// 빈 공간 데이터 로드
async function loadEmptyRegionsData() {
  try {
    const response = await fetch(`./slides/${currentVideoName}/emptyRegions.json?t=${Date.now()}`);
    if (!response.ok) {
      console.log(`No empty regions data for ${currentVideoName}`);
      emptyRegionsData = null;
      return;
    }
    emptyRegionsData = await response.json();
    console.log('Loaded empty regions data:', emptyRegionsData);
  } catch (error) {
    console.error('Failed to load empty regions data:', error);
    emptyRegionsData = null;
  }
}

// 현재 슬라이드 찾기
function getCurrentSlide(currentTime) {
  if (!slideData || slideData.length === 0) return null;
  
  for (let i = slideData.length - 1; i >= 0; i--) {
    if (currentTime >= slideData[i].seconds) {
      return slideData[i];
    }
  }
  return slideData[0];
}

// 슬라이드 전환 감지 및 퀴즈 트리거
function checkSlideTransition(currentTime) {
  if (!slideData || !quizData) return;
  
  const currentSlide = getCurrentSlide(currentTime);
  if (!currentSlide) return;
  
  const currentSlideNumber = currentSlide.slideNumber;
  
  // 슬라이드 전환 감지 (앞으로 이동만)
  if (currentSlideNumber !== lastSlideNumber && lastSlideNumber !== 0) {
    const previousSlideNumber = lastSlideNumber;
    const isMovingForward = currentSlideNumber > previousSlideNumber;
    
    // 앞으로 이동하고, 이전 슬라이드의 퀴즈를 아직 완료하지 않았고, 퀴즈가 표시되지 않은 경우
    if (isMovingForward && !completedQuizSlides.has(previousSlideNumber) && quizModal.style.display === 'none') {
      const quiz = quizData[previousSlideNumber];
      if (quiz) {
        console.log(`🎯 Triggering quiz for slide ${previousSlideNumber}`);
        showQuiz(quiz);
      }
    }
  }
  
  lastSlideNumber = currentSlideNumber;
}

// 하이라이트 업데이트
function updateHighlights() {
  if (!highlightLayer || !highlightData || !Array.isArray(highlightData)) {
    return;
  }
  
  const currentTime = mainVideo.currentTime;
  const videoRect = videoContainer.getBoundingClientRect();
  
  // 기존 하이라이트 박스 제거
  highlightLayer.innerHTML = '';
  
  // 현재 시간에 해당하는 하이라이트 박스 찾기
  const activeBoxes = highlightData.filter(box => 
    currentTime >= box.startTime && currentTime <= box.endTime
  );
  
  // 하이라이트 박스 생성
  activeBoxes.forEach((box, index) => {
    const highlightBox = document.createElement('div');
    highlightBox.className = 'highlight-box';
    highlightBox.style.left = `${box.x * 100}%`;
    highlightBox.style.top = `${box.y * 100}%`;
    highlightBox.style.width = `${box.width * 100}%`;
    highlightBox.style.height = `${box.height * 100}%`;
    highlightBox.style.background = box.color || 'rgba(255, 255, 0, 0.2)';
    
    highlightLayer.appendChild(highlightBox);
  });
}

// 비디오 변경 함수
async function changeVideo(videoName) {
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
    if (durationDisplay) {
      durationDisplay.textContent = formatTime(mainVideo.duration);
    }
    // 세그멘트 진행 바 렌더링
    renderSegmentedProgressBar();
  }, { once: true });
  
  // 하이라이트 데이터 다시 로드
  await loadHighlightData();
  
  // 슬라이드 데이터 다시 로드
  await loadSlideData();
  
  // 퀴즈 데이터 다시 로드
  await loadQuizData();
  
  // 빈 공간 데이터 다시 로드
  await loadEmptyRegionsData();
  
  // Learning Interests 업데이트
  updateLearningInterests(videoName);
  
  // 퀴즈 완료 슬라이드 리셋
  completedQuizSlides.clear();
  lastSlideNumber = 0;
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
  
  // 세그멘트 진행 바 클릭/드래그
  let isSeeking = false;
  
  if (segmentedProgressBarContainer) {
    segmentedProgressBarContainer.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isSeeking = true;
      handleSegmentedSeek(e);
  });
  
    segmentedProgressBarContainer.addEventListener('mousemove', (e) => {
    if (isSeeking) {
      e.preventDefault();
        handleSegmentedSeek(e);
      } else {
        updateHoveredSegment(e);
      }
    });
    
    segmentedProgressBarContainer.addEventListener('mouseleave', () => {
      hoveredSegmentIndex = null;
      if (hoveredSegmentInfo) hoveredSegmentInfo.textContent = '';
      updateSegmentHoverState();
    });
    
    segmentedProgressBarContainer.addEventListener('click', (e) => {
      handleSegmentedSeek(e);
    });
  }
  
  document.addEventListener('mousemove', (e) => {
    if (isSeeking && segmentedProgressBarContainer) {
      e.preventDefault();
      handleSegmentedSeek(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isSeeking = false;
  });
  
  // 비디오 시간 업데이트
  mainVideo.addEventListener('timeupdate', () => {
    updateTimeDisplay();
    updateHighlights();
    // 퀴즈 모달이 표시되지 않은 경우에만 슬라이드 전환 체크
    if (quizModal.style.display === 'none') {
      checkSlideTransition(mainVideo.currentTime);
    }
  });
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
  if (!currentTimeDisplay || !durationDisplay) return;
  
  currentTimeDisplay.textContent = formatTime(mainVideo.currentTime);
  durationDisplay.textContent = formatTime(mainVideo.duration);
  
  // 세그멘트 기반 진행 바 업데이트
  updateSegmentedProgressBar();
}

// 세그멘트 기반 진행 바 렌더링
function renderSegmentedProgressBar() {
  if (!segmentedProgressBar || !slideData || slideData.length === 0) {
    // 슬라이드 데이터가 없으면 기본 진행 바 표시
    return;
  }
  
  const duration = mainVideo.duration || 0;
  if (duration === 0) {
    // 비디오가 아직 로드되지 않았으면 나중에 다시 시도
    mainVideo.addEventListener('loadedmetadata', () => {
      renderSegmentedProgressBar();
    }, { once: true });
    return;
  }
  
  // 세그멘트 블록 생성
  segmentedProgressBar.innerHTML = '';
  quizIndicators.innerHTML = '';
  segmentLabelsContainer.innerHTML = '';
  
  const segmentBlocks = [];
  
  for (let i = 0; i < slideData.length; i++) {
    const segment = slideData[i];
    const startTime = segment.seconds;
    const endTime = i < slideData.length - 1 ? slideData[i + 1].seconds : duration;
    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;
    const width = endPercent - startPercent;
    
    segmentBlocks.push({
      ...segment,
      index: i,
      startTime,
      endTime,
      startPercent,
      endPercent,
      width
    });
    
    // 세그멘트 블록 생성
    const block = document.createElement('div');
    block.className = 'segment-block default';
    block.style.left = `${startPercent}%`;
    block.style.width = `${width}%`;
    if (i < slideData.length - 1) {
      block.style.borderRightWidth = '2px';
    } else {
      block.style.borderRightWidth = '0';
    }
    block.setAttribute('data-segment-index', i);
    block.title = `${segment.slideContent.title} (${formatTime(startTime)} - ${formatTime(endTime)})`;
    
    // 세그멘트 번호 표시 (너비가 5% 이상일 때만)
    if (width > 5) {
      const numberLabel = document.createElement('div');
      numberLabel.className = 'segment-number';
      numberLabel.textContent = segment.slideNumber;
      block.appendChild(numberLabel);
    }
    
    segmentedProgressBar.appendChild(block);
    
    // 퀴즈 인디케이터 (세그멘트 끝에)
    const hasQuiz = segment.shouldGenerateQuiz || (quizData && quizData[segment.slideNumber]);
    if (hasQuiz) {
      const quizLine = document.createElement('div');
      quizLine.className = 'quiz-indicator-line';
      quizLine.style.left = `${endPercent}%`;
      
      const quizDot = document.createElement('div');
      quizDot.className = 'quiz-indicator-dot';
      quizLine.appendChild(quizDot);
      
      quizIndicators.appendChild(quizLine);
    }
    
    // 세그멘트 라벨 (아래에 표시)
    const centerPosition = startPercent + (width / 2);
    const labelDiv = document.createElement('div');
    labelDiv.className = 'segment-label';
    labelDiv.style.left = `${centerPosition}%`;
    
    const labelButton = document.createElement('button');
    labelButton.className = 'segment-label-button';
    labelButton.setAttribute('data-segment-index', i);
    labelButton.setAttribute('data-start-time', startTime);
    
    const showFullTitle = width > 10;
    const showTitle = width > 5;
  
    if (showFullTitle) {
      const title = segment.slideContent.title.length > 15 
        ? segment.slideContent.title.substring(0, 15) + '...' 
        : segment.slideContent.title;
      labelButton.textContent = `${segment.slideNumber}. ${title}`;
      labelButton.style.maxWidth = '150px';
    } else if (showTitle) {
      labelButton.textContent = segment.slideNumber;
      labelButton.style.maxWidth = '24px';
    } else {
      labelButton.innerHTML = '<span style="display: inline-block; width: 4px; height: 4px; background: currentColor; border-radius: 50%;"></span>';
      labelButton.style.maxWidth = '8px';
    }
    
    labelButton.title = `${segment.slideNumber}. ${segment.slideContent.title}`;
    labelButton.onclick = (e) => {
      e.stopPropagation();
      mainVideo.currentTime = startTime;
    };
    
    labelDiv.appendChild(labelButton);
    segmentLabelsContainer.appendChild(labelDiv);
    
    // 퀴즈 버튼 (세그멘트 끝에)
    if (hasQuiz) {
      const quizButtonDiv = document.createElement('div');
      quizButtonDiv.className = 'quiz-button';
      quizButtonDiv.style.left = `${endPercent}%`;
      quizButtonDiv.setAttribute('data-segment-index', i);
      quizButtonDiv.setAttribute('data-slide-number', segment.slideNumber);
      
      const isCompleted = completedQuizSlides.has(segment.slideNumber);
      if (isCompleted) {
        quizButtonDiv.classList.add('completed');
        quizButtonDiv.textContent = '✓';
      } else {
        // 퀴즈 번호 계산
        let quizCounter = 0;
        for (let j = 0; j <= i; j++) {
          const seg = slideData[j];
          if (seg.shouldGenerateQuiz || (quizData && quizData[seg.slideNumber])) {
            quizCounter++;
          }
        }
        quizButtonDiv.textContent = `Q${quizCounter}`;
      }
      
      quizButtonDiv.onclick = (e) => {
        e.stopPropagation();
        if (quizData && quizData[segment.slideNumber]) {
          showQuiz(segment.slideNumber);
        }
      };
      
      segmentLabelsContainer.appendChild(quizButtonDiv);
    }
  }
  
  // 진행 바 업데이트
  updateSegmentedProgressBar();
}

// 세그멘트 기반 진행 바 업데이트
function updateSegmentedProgressBar() {
  if (!segmentedProgressBar || !mainVideo.duration || !slideData || slideData.length === 0) {
    return;
  }
  
  const currentTime = mainVideo.currentTime;
  const duration = mainVideo.duration;
  const progressPercent = (currentTime / duration) * 100;
  
  // 진행 인디케이터 업데이트
  if (progressIndicator) {
    progressIndicator.style.width = `${progressPercent}%`;
  }
  
  // 플레이헤드 업데이트
  if (playhead) {
    playhead.style.left = `${progressPercent}%`;
  }
  
  // 활성 세그멘트 업데이트
  const segmentBlocks = segmentedProgressBar.querySelectorAll('.segment-block');
  segmentBlocks.forEach((block, index) => {
    const segment = slideData[index];
    const startTime = segment.seconds;
    const endTime = index < slideData.length - 1 ? slideData[index + 1].seconds : duration;
    
    const isActive = currentTime >= startTime && currentTime < endTime;
    
    block.classList.remove('active', 'hovered', 'default');
    if (isActive) {
      block.classList.add('active');
    } else if (hoveredSegmentIndex === index) {
      block.classList.add('hovered');
    } else {
      block.classList.add('default');
    }
  });
  
  // 세그멘트 라벨 활성 상태 업데이트
  const labelButtons = segmentLabelsContainer.querySelectorAll('.segment-label-button');
  labelButtons.forEach((button, index) => {
    const segment = slideData[index];
    const startTime = segment.seconds;
    const endTime = index < slideData.length - 1 ? slideData[index + 1].seconds : duration;
    
    const isActive = currentTime >= startTime && currentTime < endTime;
    button.classList.toggle('active', isActive);
  });
}

// 세그멘트 기반 시크 처리
function handleSegmentedSeek(e) {
  if (!segmentedProgressBarContainer || !mainVideo.duration || !isFinite(mainVideo.duration)) {
    return;
  }
  
  const rect = segmentedProgressBarContainer.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percentage = x / rect.width;
  const seekTime = percentage * mainVideo.duration;
  
  // seekable 범위 확인
  if (mainVideo.seekable.length > 0) {
  const seekableStart = mainVideo.seekable.start(0);
  const seekableEnd = mainVideo.seekable.end(mainVideo.seekable.length - 1);
    const clampedTime = Math.max(seekableStart, Math.min(seekableEnd, seekTime));
    mainVideo.currentTime = clampedTime;
  } else {
    mainVideo.currentTime = seekTime;
  }
}

// 호버된 세그멘트 업데이트

function updateHoveredSegment(e) {
  if (!segmentedProgressBarContainer || !slideData || slideData.length === 0) {
    return;
  }
  
  const rect = segmentedProgressBarContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = (x / rect.width) * 100;
  const duration = mainVideo.duration || 0;
  
  // 호버된 세그멘트 찾기
  let newHoveredIndex = null;
  for (let i = 0; i < slideData.length; i++) {
    const segment = slideData[i];
    const startTime = segment.seconds;
    const endTime = i < slideData.length - 1 ? slideData[i + 1].seconds : duration;
    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;
    
    if (percentage >= startPercent && percentage < endPercent) {
      newHoveredIndex = i;
      break;
    }
  }
  
  if (newHoveredIndex !== hoveredSegmentIndex) {
    hoveredSegmentIndex = newHoveredIndex;
    updateSegmentHoverState();
    
    // 호버 정보 표시
    if (hoveredSegmentIndex !== null && hoveredSegmentInfo) {
      const segment = slideData[hoveredSegmentIndex];
      hoveredSegmentInfo.textContent = `Section ${segment.slideNumber}: ${segment.slideContent.title}`;
    } else if (hoveredSegmentInfo) {
      hoveredSegmentInfo.textContent = '';
    }
  }
}

function updateSegmentHoverState() {
  if (!segmentedProgressBar || !slideData) return;
  
  const segmentBlocks = segmentedProgressBar.querySelectorAll('.segment-block');
  segmentBlocks.forEach((block, index) => {
    block.classList.remove('hovered');
    if (hoveredSegmentIndex === index) {
      block.classList.add('hovered');
    }
  });
  
  const labelButtons = segmentLabelsContainer.querySelectorAll('.segment-label-button');
  labelButtons.forEach((button, index) => {
    button.classList.remove('hovered');
    if (hoveredSegmentIndex === index) {
      button.classList.add('hovered');
      button.style.maxWidth = '300px';
      const segment = slideData[index];
      button.textContent = `${segment.slideNumber}. ${segment.slideContent.title}`;
    } else {
      const segment = slideData[index];
      const duration = mainVideo.duration || 0;
      const startTime = segment.seconds;
      const endTime = index < slideData.length - 1 ? slideData[index + 1].seconds : duration;
      const startPercent = (startTime / duration) * 100;
      const endPercent = (endTime / duration) * 100;
      const width = endPercent - startPercent;
      
      if (width > 10) {
        const title = segment.slideContent.title.length > 15 
          ? segment.slideContent.title.substring(0, 15) + '...' 
          : segment.slideContent.title;
        button.textContent = `${segment.slideNumber}. ${title}`;
        button.style.maxWidth = '150px';
      } else if (width > 5) {
        button.textContent = segment.slideNumber;
        button.style.maxWidth = '24px';
      } else {
        button.innerHTML = '<span style="display: inline-block; width: 4px; height: 4px; background: currentColor; border-radius: 50%;"></span>';
        button.style.maxWidth = '8px';
      }
    }
  });
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
  
  // Break 버튼 클릭 이벤트
  if (breakBtn) {
    breakBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBreakVideo();
    });
  }
  
  // Break 비디오 닫기 버튼
  if (closeBreakBtn) {
    closeBreakBtn.addEventListener('click', closeBreakVideo);
  }
  
  // Break 비디오 종료 시 닫기
  if (breakVideo) {
    breakVideo.addEventListener('ended', closeBreakVideo);
  }
  
  // Interactive Diagram 버튼 클릭 이벤트
  if (interactiveDiagramBtn) {
    interactiveDiagramBtn.addEventListener('click', () => {
      console.log('Interactive Diagram button clicked for video:', currentVideoName);
      openDiagramForCurrentVideo();
    });
  } else {
    console.error('Interactive Diagram button not found!');
  }
  
  // Summary 버튼 클릭 이벤트
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => {
      openSummaryPage();
    });
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
  
  // 퀴즈 모달 닫기 버튼
  if (quizCloseBtn) {
    quizCloseBtn.addEventListener('click', closeQuiz);
  }
  
  // 퀴즈 모달 배경 클릭 시 닫기
  if (quizModal) {
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) {
        closeQuiz();
      }
    });
  }
  
  // 난이도 슬라이더 변경
  if (difficultySlider) {
    difficultySlider.addEventListener('input', (e) => {
      const newDifficulty = parseInt(e.target.value);
      if (newDifficulty !== quizState.selectedDifficulty) {
        quizState.selectedDifficulty = newDifficulty;
        quizState.currentQuestionIndex = 0;
        quizState.currentAnswer = '';
        quizState.answers = [];
        quizState.showFeedback = false;
        quizState.feedbackData = null;
        quizState.startTime = Date.now();
        updateDifficultySlider();
        updateQuizUI();
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
  
  // 데모에서는 질문을 변환하지 않고 그대로 사용
  let question = effective;
  
  // 사용자 입력 질문 저장 (last question chip용)
    if (raw && normalized !== normalizeText("please explain this") && 
      normalized !== normalizeText("walk me through this step by step") &&
        normalized !== normalizeText("can you make an analogy")) {
      lastTypedQuestion = raw;
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
  
  // 질문과 답변 저장
  saveInteraction({
    question: effective,
    response: matchedResponse,
    selection: currentSelection,
    menu: 'Ask'
  });
  
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
  
  // Enhanced Visual도 인터랙션으로 저장
  saveInteraction({
    question: 'Enhanced Visual',
    response: { imagePath },
    selection: currentSelection,
    menu: 'Enhanced Visual'
  });
  
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

// 시간을 timecode 형식으로 변환 (MM:SS)
function formatTimecode(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 인터랙션 저장 함수
function saveInteraction({ question, response, selection, menu }) {
  try {
    // 비디오별로 인터랙션 히스토리를 분리 저장
    const historyKey = `userInteractionHistory_${currentVideoName}`;
    console.log(`Saving interaction with key: ${historyKey}`);
    let interactions = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // 현재 시간 정보
    const currentTime = mainVideo.currentTime;
    const timecode = formatTimecode(currentTime);
    
    // 선택 영역 정보 변환 (비디오 컨테이너 기준 상대 좌표를 원본 크기 기준으로 변환)
    let selectionData = null;
    if (selection) {
      const videoRect = mainVideo.getBoundingClientRect();
      const videoWidth = mainVideo.videoWidth || 1920;
      const videoHeight = mainVideo.videoHeight || 1080;
      const scaleX = videoWidth / videoRect.width;
      const scaleY = videoHeight / videoRect.height;
      
      selectionData = {
        startX: selection.startX * scaleX,
        startY: selection.startY * scaleY,
        endX: selection.endX * scaleX,
        endY: selection.endY * scaleY
      };
    }
    
    // 인터랙션 데이터 생성
    const interaction = {
      time: {
        timecode: timecode,
        seconds: currentTime
      },
      selection: selectionData,
      selectedMenu: menu,
      sentPrompt: {
        userPrompt: question
      },
      receivedResponse: menu === 'Enhanced Visual' 
        ? { type: 'image', src: [response.imagePath] }
        : {
            text: response.handwritingText || '',
            src: response.videoPath ? [response.videoPath] : []
          },
      generatedContent: menu === 'Enhanced Visual'
        ? null
        : {
            transcript: response.handwritingText || '',
            instructorVideoPath: response.videoPath || null
          },
      timestamp: new Date().toISOString()
    };
    
    // 인터랙션 추가
    interactions.push(interaction);
    
    // localStorage에 저장
    localStorage.setItem(historyKey, JSON.stringify(interactions));
    
    console.log(`Interaction saved to ${historyKey}:`, interaction);
    console.log(`Total interactions for ${currentVideoName}:`, interactions.length);
  } catch (error) {
    console.error('Failed to save interaction:', error);
  }
}

// Learning Interests 입력 필드 업데이트
function updateLearningInterests(videoName) {
  if (!learningInterestsInput) return;
  
  const defaultInterests = {
    'physics': 'football',
    'linear-algebra': 'film',
    'machinelearning': 'music'
  };
  
  learningInterestsInput.value = defaultInterests[videoName] || '';
  learningInterestsInput.placeholder = `e.g., ${defaultInterests[videoName] || 'football'}`;
}

// Summary 페이지로 이동
function openSummaryPage() {
  // map 페이지로 이동 (기존 프로젝트와 동일한 구조)
  window.location.href = `map.html?video=${encodeURIComponent(currentVideoName)}`;
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

// Handwriting 오버레이 표시 (Vara.js 사용, 현재 슬라이드의 빈 공간에)
function showHandwritingOverlay(text, selectedBox, handwritingBBox) {
  console.log('showHandwritingOverlay called with text:', text);
  
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
  
  let overlayX, overlayY, overlayWidth, overlayHeight;
  
  // 현재 슬라이드의 빈 공간 찾기
  const currentSlide = getCurrentSlide(mainVideo.currentTime);
  const slideKey = currentSlide ? `slide_${String(currentSlide.slideNumber).padStart(3, '0')}` : null;
  
  if (slideKey && emptyRegionsData && emptyRegionsData[slideKey]) {
    // 해당 슬라이드의 빈 공간 가져오기
    const targetRegion = emptyRegionsData[slideKey];
    
    // boundingBox의 slideRegion 가져오기
    const config = getBoundingBoxConfig();
    if (config && config.slideRegion) {
      // 비디오 크기에 대한 스케일 계산
      const scaleX = videoRect.width / 1920;
      const scaleY = videoRect.height / 1080;
      
      // 슬라이드 영역 내 빈 공간의 절대 좌표 계산
      const absoluteX = config.slideRegion.x + targetRegion.x;
      const absoluteY = config.slideRegion.y + targetRegion.y;
      
      // 현재 비디오 크기에 맞게 스케일링
      overlayX = absoluteX * scaleX;
      overlayY = absoluteY * scaleY;
      overlayWidth = targetRegion.width * scaleX;
      overlayHeight = targetRegion.height * scaleY;
      
      console.log('Using empty region for handwriting:', { 
        slideKey, 
        region: targetRegion, 
        scaled: { overlayX, overlayY, overlayWidth, overlayHeight } 
      });
  } else {
      console.warn('No slideRegion found in boundingBox config');
      // 폴백: 기본 중앙 위치
      overlayWidth = videoRect.width * 0.6;
      overlayHeight = videoRect.height * 0.5;
      overlayX = videoRect.width * 0.2;
      overlayY = videoRect.height * 0.25;
    }
  } else {
    console.warn('No empty regions data for current slide');
    // 폴백: 기본 중앙 위치
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

// Break 비디오 열기
function openBreakVideo() {
  console.log('Opening break video for:', currentVideoName);
  
  if (!breakOverlay || !breakVideo) {
    console.error('Break overlay or video not found!');
    return;
  }
  
  // 메인 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // Break 비디오 소스 설정
  const breakVideoPath = `./avatar/${currentVideoName}.mp4`;
  console.log('Loading break video:', breakVideoPath);
  breakVideo.src = breakVideoPath;
  breakVideo.load();
  
  // 오버레이 표시
  breakOverlay.style.display = 'flex';
  
  // 비디오 재생
  breakVideo.play().catch(err => {
    console.error('Failed to play break video:', err);
  });
}

// Break 비디오 닫기
function closeBreakVideo() {
  console.log('Closing break video');
  
  if (!breakOverlay || !breakVideo) {
    return;
  }
  
  // 오버레이 숨기기
  breakOverlay.style.display = 'none';
  
  // 비디오 정지 및 초기화
  breakVideo.pause();
  breakVideo.currentTime = 0;
  breakVideo.src = '';
  
  // 메인 비디오 재개
  if (mainVideo.paused) {
    mainVideo.play();
  }
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

// 퀴즈 상태 관리
let quizState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  selectedDifficulty: 3,
  answers: [],
  showFeedback: false,
  feedbackData: null,
  currentAnswer: '',
  startTime: null
};

// 퀴즈 표시
function showQuiz(quiz) {
  if (!quiz || !quizModal) return;
  
  console.log('Showing quiz:', quiz);
  
  // 메인 비디오 일시정지
  if (!mainVideo.paused) {
    mainVideo.pause();
  }
  
  // 퀴즈 상태 초기화
  quizState.currentQuiz = quiz;
  quizState.currentQuestionIndex = 0;
  quizState.selectedDifficulty = 3;
  quizState.answers = [];
  quizState.showFeedback = false;
  quizState.feedbackData = null;
  quizState.currentAnswer = '';
  quizState.startTime = Date.now();
  
  // UI 업데이트
  updateQuizUI();
  
  // 모달 표시
  quizModal.style.display = 'flex';
}

// 퀴즈 UI 업데이트
function updateQuizUI() {
  if (!quizState.currentQuiz) return;
  
  const quiz = quizState.currentQuiz;
  
  // 헤더 업데이트
  quizTitle.textContent = quiz.title;
  quizSlideBadge.textContent = `Section ${quiz.slideNumber}`;
  
  // 난이도별 퀴즈가 있는지 확인
  const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
  
  if (hasDifficultyQuizzes) {
    quizDifficultySection.style.display = 'flex';
    updateDifficultySlider();
  } else {
    quizDifficultySection.style.display = 'none';
  }
  
  // 현재 질문 가져오기
  const currentQuestions = hasDifficultyQuizzes 
    ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
    : quiz.questions;
  
  // 콘텐츠 렌더링
  if (quizState.showFeedback && quizState.feedbackData) {
    renderFeedback();
  } else {
    renderQuestion();
  }
}

// 난이도 슬라이더 업데이트
function updateDifficultySlider() {
  if (!difficultySlider || !difficultyValue) return;
  
  difficultySlider.value = quizState.selectedDifficulty;
  difficultyValue.textContent = quizState.selectedDifficulty;
  
  const labels = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard'
  };
  
  const difficultyLabelEl = document.getElementById('difficultyLabel');
  if (difficultyLabelEl) {
    difficultyLabelEl.textContent = labels[quizState.selectedDifficulty] || 'Medium';
  }
  
  // 슬라이더 배경 그라데이션 업데이트
  const percentage = ((quizState.selectedDifficulty - 1) / 4) * 100;
  difficultySlider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
}

// 진행 바 업데이트
function updateProgressBar() {
  if (!progressBarContainer || !quizState.currentQuiz) return;
  
  const quiz = quizState.currentQuiz;
  const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
  const currentQuestions = hasDifficultyQuizzes 
    ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
    : quiz.questions;
  
  const total = currentQuestions.length;
  const current = quizState.currentQuestionIndex + 1;
  const correctCount = quizState.answers.filter(a => a.isCorrect).length;
  const accuracyPercentage = current > 1 ? Math.round((correctCount / (current - 1)) * 100) : 0;
  
  // 진행 바 섹션 업데이트
  let progressHTML = `
    <div class="progress-stats">
      <div class="progress-stats-left">
        <span class="progress-stats-text">Question ${current} of ${total}</span>
        <span class="progress-badge">${correctCount} correct</span>
  `;
  
  if (current > 1) {
    progressHTML += `<span class="progress-badge">${accuracyPercentage}% accuracy</span>`;
  }
  
  progressHTML += `
      </div>
      <div class="progress-stats-right">
        <svg class="progress-stats-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Quiz Progress</span>
      </div>
    </div>
    <div class="progress-bar-container">
  `;
  
  for (let i = 0; i < total; i++) {
    const stepNum = i + 1;
    const isCompleted = stepNum < current;
    const isCurrent = stepNum === current;
    
    progressHTML += '<div class="progress-step">';
    
    // 원
    progressHTML += `<div class="progress-step-circle ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}">`;
    if (isCompleted) {
      progressHTML += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else {
      progressHTML += `<span style="font-size: 12px; font-weight: 500;">${stepNum}</span>`;
    }
    progressHTML += '</div>';
    
    // 연결선
    if (i < total - 1) {
      let lineClass = 'upcoming';
      if (isCompleted || (isCurrent && i < current - 1)) {
        lineClass = 'completed';
      } else if (isCurrent && i === current - 1) {
        lineClass = 'current-partial';
      }
      
      const lineWidth = `calc((100% - ${total * 2}rem) / ${total - 1})`;
      progressHTML += `<div class="progress-step-line ${lineClass}" style="width: ${lineWidth}; min-width: 2rem;"></div>`;
    }
    
    progressHTML += '</div>';
  }
  
  progressHTML += '</div>';
  
  progressBarContainer.innerHTML = progressHTML;
}

// 질문 렌더링
function renderQuestion() {
  if (!quizContent || !quizState.currentQuiz) return;
  
  const quiz = quizState.currentQuiz;
  const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
  const currentQuestions = hasDifficultyQuizzes 
    ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
    : quiz.questions;
  
  if (currentQuestions.length === 0) {
    quizContent.innerHTML = '<p>No questions available</p>';
    return;
  }
  
  const question = currentQuestions[quizState.currentQuestionIndex];
  if (!question) return;
  
  let html = `
    <div class="question-card">
      <div class="question-header">
        <span class="question-difficulty-badge ${question.difficulty}">${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</span>
      </div>
      <h3 class="question-text">${escapeHtml(question.question)}</h3>
  `;
  
  // 질문 타입별 렌더링
  html += '<div style="display: flex; flex-direction: column; gap: 16px;">'; // space-y-4
  
  if (question.type === 'multiple-choice' && question.options) {
    html += '<div class="question-options">';
    question.options.forEach((option, index) => {
      const escapedOption = option.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const letter = String.fromCharCode(65 + index);
      html += `
        <button class="question-option ${quizState.currentAnswer === option ? 'selected' : ''}" data-option="${index}" onclick="selectOption(${index}, '${escapedOption}')">
          ${letter}. ${escapeHtml(option)}
        </button>
      `;
    });
    html += '</div>';
  } else if (question.type === 'true-false') {
    html += '<div class="question-tf-options">';
    ['True', 'False'].forEach(option => {
      html += `
        <button class="question-tf-option ${quizState.currentAnswer === option ? 'selected' : ''}" data-option="${option}" onclick="selectOption(null, '${option}')">
          ${option}
        </button>
      `;
    });
    html += '</div>';
  } else if (question.type === 'fill-blank') {
    html += `
      <div class="question-fill-blank">
        <input type="text" id="fillBlankInput" class="question-fill-blank-input" placeholder="Enter your answer..." value="${escapeHtml(quizState.currentAnswer || '')}" onkeypress="handleFillBlankKeyPress(event)" oninput="handleFillBlankInput(event)">
      </div>
    `;
  }
  
  // Submit 버튼
  if (quizState.currentAnswer) {
    html += `
      <button class="question-submit-btn" id="questionSubmitBtn" onclick="submitAnswer()">
        Submit Answer
      </button>
    `;
  }
  
  html += '</div>'; // space-y-4 닫기
  
  html += '</div>';
  
  quizContent.innerHTML = html;
  
  // Submit 버튼 상태 업데이트
  updateSubmitButton();
}

// 전역 함수들 (HTML에서 호출)
window.selectOption = function(index, value) {
  quizState.currentAnswer = value;
  
  // 모든 옵션에서 선택 해제
  document.querySelectorAll('.question-option, .question-tf-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  // 선택된 옵션 표시
  const selectedOpt = document.querySelector(`[data-option="${index !== null ? index : value}"]`);
  if (selectedOpt) {
    selectedOpt.classList.add('selected');
  }
  
  // Submit 버튼 표시
  const submitBtn = document.getElementById('questionSubmitBtn');
  if (!submitBtn && quizState.currentAnswer) {
    const questionCard = document.querySelector('.question-card');
    if (questionCard) {
      const btn = document.createElement('button');
      btn.className = 'question-submit-btn';
      btn.id = 'questionSubmitBtn';
      btn.textContent = 'Submit Answer';
      btn.onclick = submitAnswer;
      questionCard.appendChild(btn);
    }
  }
};

window.handleFillBlankKeyPress = function(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('fillBlankInput');
    if (input && input.value.trim()) {
      submitAnswer();
    }
  }
};

window.handleFillBlankInput = function(e) {
  quizState.currentAnswer = e.target.value;
  updateSubmitButton();
};

function updateSubmitButton() {
  const btn = document.getElementById('questionSubmitBtn');
  if (btn) {
    btn.disabled = !quizState.currentAnswer || !quizState.currentAnswer.trim();
  } else if (quizState.currentAnswer && quizState.currentAnswer.trim()) {
    // 버튼이 없으면 생성
    const questionCard = document.querySelector('.question-card');
    if (questionCard) {
      const newBtn = document.createElement('button');
      newBtn.className = 'question-submit-btn';
      newBtn.id = 'questionSubmitBtn';
      newBtn.textContent = 'Submit Answer';
      newBtn.onclick = submitAnswer;
      questionCard.appendChild(newBtn);
    }
  }
}

// 답변 제출
window.submitAnswer = function() {
  if (!quizState.currentAnswer || !quizState.currentQuiz) return;
  
  const quiz = quizState.currentQuiz;
  const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
  const currentQuestions = hasDifficultyQuizzes 
    ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
    : quiz.questions;
  
  const question = currentQuestions[quizState.currentQuestionIndex];
  const isCorrect = quizState.currentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  
  // 답변 기록
  quizState.answers.push({
    questionId: question.id,
    userAnswer: quizState.currentAnswer,
    isCorrect: isCorrect,
    timeSpent: Date.now() - quizState.startTime
  });
  
  // 피드백 표시
  quizState.showFeedback = true;
  quizState.feedbackData = {
    isCorrect: isCorrect,
    explanation: question.explanation,
    userAnswer: quizState.currentAnswer,
    correctAnswer: question.correctAnswer
  };
  
  updateQuizUI();
};

// 피드백 렌더링
function renderFeedback() {
  if (!quizContent || !quizState.feedbackData) return;
  
  const feedback = quizState.feedbackData;
  const isCorrect = feedback.isCorrect;
  
  let html = `
    <div class="answer-feedback">
      <div class="feedback-answer-card user ${isCorrect ? 'correct' : 'incorrect'}">
        <p class="feedback-answer-text ${isCorrect ? 'correct' : 'incorrect'}">
          <strong>Your Answer:</strong> ${escapeHtml(feedback.userAnswer)} ${isCorrect ? '✅ Correct!' : '❌ Incorrect'}
        </p>
      </div>
  `;
  
  if (!isCorrect) {
    html += `
      <div class="feedback-answer-card correct-answer">
        <p class="feedback-answer-text correct">
          <strong>Correct Answer:</strong> ${escapeHtml(feedback.correctAnswer)}
        </p>
      </div>
    `;
  }
  
  if (feedback.explanation) {
    html += `
      <div class="feedback-explanation">
        <p class="feedback-explanation-text">
          <strong>Explanation:</strong> ${escapeHtml(feedback.explanation)}
        </p>
      </div>
    `;
  }
  
  html += `
      <button class="feedback-continue-btn" onclick="nextQuestion()">
        Continue
      </button>
    </div>
  `;
  
  quizContent.innerHTML = html;
}

// 다음 질문
window.nextQuestion = function() {
  const quiz = quizState.currentQuiz;
  const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
  const currentQuestions = hasDifficultyQuizzes 
    ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
    : quiz.questions;
  
  const nextIndex = quizState.currentQuestionIndex + 1;
  
  if (nextIndex >= currentQuestions.length) {
    // 퀴즈 완료 - SimplifiedQuizModal은 간단한 완료 처리
    completeQuiz();
  } else {
    // 다음 질문으로
    quizState.currentQuestionIndex = nextIndex;
    quizState.currentAnswer = '';
    quizState.showFeedback = false;
    quizState.feedbackData = null;
    quizState.startTime = Date.now();
    updateQuizUI();
  }
};




// 퀴즈 완료
window.completeQuiz = function() {
  const quiz = quizState.currentQuiz;
  if (quiz) {
    completedQuizSlides.add(quiz.slideNumber);
    
    // SimplifiedQuizModal 스타일의 간단한 완료 처리
    const hasDifficultyQuizzes = quiz.quizzesByDifficulty && Object.keys(quiz.quizzesByDifficulty).length > 0;
    const currentQuestions = hasDifficultyQuizzes 
      ? (quiz.quizzesByDifficulty[quizState.selectedDifficulty] || quiz.questions)
      : quiz.questions;
    
    const correctCount = quizState.answers.filter(a => a.isCorrect).length;
    const total = currentQuestions.length;
    
    // 간단한 성능 메트릭 전달
    if (typeof window.handleQuizComplete === 'function') {
      window.handleQuizComplete({
        totalQuestions: total,
        correctAnswers: correctCount,
        correctRate: Math.round((correctCount / total) * 100),
        averageTime: 30,
        knowledgeGaps: [],
        strongAreas: [quiz.title]
      });
    }
  }
  
  closeQuiz();
  
  // 메인 비디오 재개
  if (mainVideo.paused) {
    mainVideo.play();
  }
};

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 퀴즈 닫기
function closeQuiz() {
  if (quizModal) {
    quizModal.style.display = 'none';
  }
  
  quizState.currentQuiz = null;
  quizState.currentQuestionIndex = 0;
  quizState.currentAnswer = '';
  quizState.showFeedback = false;
  quizState.feedbackData = null;
  
  if (quizContent) {
    quizContent.innerHTML = '';
  }
}

// 초기화 실행
init();

console.log('Interactive Lecture Demo initialized with Diagrams');

