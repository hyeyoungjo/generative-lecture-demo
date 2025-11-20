
// 전역 변수
let videoName = 'physics';
let slideInfo = [];
let slideImages = [];
let interactions = [];
let slideInteractions = {};
let expandedCards = new Set();
let predefinedQnA = null;
let boundingBox = null;
let activeVideoOverlays = {}; // { interactionIndex: { videoElement, container } }

// 원본 슬라이드 크기 상수 (비율 계산용)
const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// DOM 요소
const slidesContainer = document.getElementById('slidesContainer');
const connectionLines = document.getElementById('connectionLines');
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');

// 슬라이드 및 인터랙션 refs
const slideRefs = {};
const interactionRefs = {};

// 초기화
async function init() {
  // URL 파라미터에서 비디오 이름 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  videoName = urlParams.get('video') || 'physics';
  
  // Back to Main 버튼에 비디오 파라미터 추가 (DOM이 로드된 후)
  setTimeout(() => {
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.href = `index.html?video=${encodeURIComponent(videoName)}`;
      console.log('Back button href set to:', backButton.href);
    } else {
      console.error('Back button not found!');
    }
  }, 0);
  
  // 데이터 로드
  try {
    await loadSlideData();
    await loadSlideImages();
    await loadInteractions();
    await loadPredefinedQnA();
    await loadBoundingBox();
    
    // 슬라이드별 인터랙션 매핑
    mapInteractionsToSlides();
    
    // UI 렌더링
    renderSlides();
  } catch (error) {
    console.error('Error in init():', error);
  }
  
  // 연결선 업데이트
  updateConnectionLines();
  
  // 이벤트 리스너
  expandAllBtn.addEventListener('click', expandAllCards);
  collapseAllBtn.addEventListener('click', collapseAllCards);
  
  // 윈도우 리사이즈 및 스크롤 이벤트
  window.addEventListener('resize', updateConnectionLines);
  window.addEventListener('scroll', updateConnectionLines);
}

// 슬라이드 데이터 로드
async function loadSlideData() {
  try {
    const response = await fetch(`./slides/${videoName}/lectureContent.json?t=${Date.now()}`);
    slideInfo = await response.json();
    console.log('Loaded slide data:', slideInfo);
  } catch (error) {
    console.error('Failed to load slide data:', error);
    slideInfo = [];
  }
}

// 슬라이드 이미지 목록 생성 (lectureContent.json 기반)
async function loadSlideImages() {
  // lectureContent.json의 슬라이드 번호를 기반으로 이미지 파일명 생성
  // 패턴: slide_{slideNumber}.jpg (예: slide_001.jpg, slide_002.jpg)
  slideImages = slideInfo.map(slide => {
    const slideNumber = slide.slideNumber.toString().padStart(3, '0');
    return `slide_${slideNumber}.jpg`;
  });
  console.log('Generated slide images:', slideImages);
}

// 인터랙션 히스토리 로드 (localStorage에서, 비디오별로 분리)
function loadInteractions() {
  try {
    // 비디오별로 인터랙션 히스토리를 분리 저장
    const historyKey = `userInteractionHistory_${videoName}`;
    console.log(`Loading interactions with key: ${historyKey}`);
    const stored = localStorage.getItem(historyKey);
    interactions = stored ? JSON.parse(stored) : [];
    console.log(`Loaded ${interactions.length} interactions for ${videoName}:`, interactions);
    
    // 디버깅: 모든 localStorage 키 확인
    console.log('All localStorage keys:', Object.keys(localStorage).filter(key => key.startsWith('userInteractionHistory')));
  } catch (error) {
    console.error('Failed to load interactions:', error);
    interactions = [];
  }
}

// predefinedQnA 데이터 로드
async function loadPredefinedQnA() {
  try {
    const response = await fetch(`./predefinedQnA.json?t=${Date.now()}`);
    predefinedQnA = await response.json();
    console.log('Loaded predefinedQnA:', predefinedQnA);
  } catch (error) {
    console.error('Failed to load predefinedQnA.json:', error);
    predefinedQnA = null;
  }
}

// boundingBox 데이터 로드
async function loadBoundingBox() {
  try {
    const response = await fetch(`./boundingBoxList.json?t=${Date.now()}`);
    const data = await response.json();
    boundingBox = data.boundingBoxes.find(box => box.name === videoName);
    console.log('Loaded boundingBox for', videoName, ':', boundingBox);
  } catch (error) {
    console.error('Failed to load boundingBoxList.json:', error);
    boundingBox = null;
  }
}

// 슬라이드별 인터랙션 매핑
function mapInteractionsToSlides() {
  slideInteractions = {};
  
  interactions.forEach((interaction, index) => {
    const slideNumber = findSlideNumber(interaction.time.seconds);
    
    if (slideNumber > 0) {
      if (!slideInteractions[slideNumber]) {
        slideInteractions[slideNumber] = [];
      }
      slideInteractions[slideNumber].push(index);
    }
  });
  
  console.log('Mapped slide interactions:', slideInteractions);
}

// 주어진 시간(초)에 해당하는 슬라이드 번호 찾기
function findSlideNumber(timeSeconds) {
  for (let i = 0; i < slideInfo.length; i++) {
    const currentSlide = slideInfo[i];
    const nextSlide = slideInfo[i + 1];
    
    if (timeSeconds >= currentSlide.seconds && 
        (!nextSlide || timeSeconds < nextSlide.seconds)) {
      return currentSlide.slideNumber;
    }
  }
  return 0;
}

// 슬라이드 렌더링
function renderSlides() {
  if (!slidesContainer) {
    console.error('slidesContainer not found!');
    return;
  }
  
  slidesContainer.innerHTML = '';
  
  slideInfo.forEach((slide, index) => {
    const slideNumber = slide.slideNumber;
    const hasInteractions = slideInteractions[slideNumber] && slideInteractions[slideNumber].length > 0;
    const slideRelatedInteractions = hasInteractions ? slideInteractions[slideNumber] : [];
    const slideImage = slideImages[index];
    
    const slideContainer = document.createElement('div');
    slideContainer.className = 'slide-container';
    
    const slideRow = document.createElement('div');
    slideRow.className = 'slide-row';
    
    // 슬라이드 섹션
    const slideSection = document.createElement('div');
    slideSection.className = 'slide-section';
    
    const slideCard = document.createElement('div');
    slideCard.className = `slide-card ${hasInteractions ? 'has-interactions' : ''}`;
    slideCard.setAttribute('data-slide-number', slideNumber);
    
    const slideNumberBadge = document.createElement('div');
    slideNumberBadge.className = 'slide-number';
    slideNumberBadge.textContent = `#${slideNumber}`;
    
    const slideImageContainer = document.createElement('div');
    slideImageContainer.className = 'slide-image-container';
    
    const slideImageEl = document.createElement('img');
    slideImageEl.className = 'slide-image';
    slideImageEl.src = `./slides/${videoName}/${slideImage}`;
    slideImageEl.alt = `Slide ${slideNumber}`;
    slideImageEl.onerror = (e) => {
      console.error('이미지 로딩 실패:', e.target.src);
      // 이미지 로딩 실패 시 플레이스홀더 표시
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; background: #1f2937;';
      placeholder.textContent = `Slide ${slideNumber}`;
      slideImageContainer.appendChild(placeholder);
    };
    
    slideImageContainer.appendChild(slideImageEl);
    
    // 선택 영역 오버레이
    if (hasInteractions) {
      slideRelatedInteractions.forEach(interactionIndex => {
        const interaction = interactions[interactionIndex];
        const selection = interaction.selection;
        
        if (selection) {
          const overlay = document.createElement('div');
          overlay.className = 'selection-overlay inactive';
          overlay.setAttribute('data-interaction-index', interactionIndex);
          
          const relativeX = (selection.startX / ORIGINAL_WIDTH) * 100;
          const relativeY = (selection.startY / ORIGINAL_HEIGHT) * 100;
          const relativeWidth = ((selection.endX - selection.startX) / ORIGINAL_WIDTH) * 100;
          const relativeHeight = ((selection.endY - selection.startY) / ORIGINAL_HEIGHT) * 100;
          
          overlay.style.left = `${relativeX}%`;
          overlay.style.top = `${relativeY}%`;
          overlay.style.width = `${relativeWidth}%`;
          overlay.style.height = `${relativeHeight}%`;
          
          overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCard(interactionIndex);
            updateConnectionLines();
          });
          
          slideImageContainer.appendChild(overlay);
        }
      });
    }
    
    slideCard.appendChild(slideNumberBadge);
    slideCard.appendChild(slideImageContainer);
    slideSection.appendChild(slideCard);
    
    // ref 저장
    slideRefs[slideNumber] = slideCard;
    
    slideRow.appendChild(slideSection);
    
    // 인터랙션 섹션
    if (hasInteractions && slideRelatedInteractions.length > 0) {
      const interactionSection = document.createElement('div');
      interactionSection.className = 'interaction-section';
      
      slideRelatedInteractions.forEach((interactionIndex, i) => {
        const interactionCard = renderInteractionCard(interactionIndex, slideNumber);
        interactionSection.appendChild(interactionCard);
      });
      
      slideRow.appendChild(interactionSection);
    }
    
    slideContainer.appendChild(slideRow);
    slidesContainer.appendChild(slideContainer);
  });
  
  // 연결선 업데이트
  setTimeout(updateConnectionLines, 100);
}

// 인터랙션 카드 렌더링
function renderInteractionCard(interactionIndex, slideNumber) {
  const interaction = interactions[interactionIndex];
  const isExpanded = expandedCards.has(interactionIndex);
  
  const card = document.createElement('div');
  card.className = `interaction-card ${isExpanded ? 'expanded' : ''}`;
  card.setAttribute('data-interaction-index', interactionIndex);
  
  const header = document.createElement('div');
  header.className = 'interaction-card-header';
  
  const title = document.createElement('div');
  title.className = 'interaction-card-title';
  title.textContent = `Interaction #${interactionIndex + 1} at ${interaction.time.timecode}`;
  
  const slideBadge = document.createElement('div');
  slideBadge.className = 'interaction-card-slide';
  slideBadge.textContent = `Slide #${slideNumber}`;
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'interaction-card-toggle';
  toggleBtn.innerHTML = isExpanded 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>';
  
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCard(interactionIndex);
  });
  
  header.appendChild(title);
  header.appendChild(slideBadge);
  header.appendChild(toggleBtn);
  
  const content = document.createElement('div');
  content.className = 'interaction-card-content';
  
  // Menu 정보
  const menuDetail = document.createElement('div');
  menuDetail.className = 'interaction-detail';
  menuDetail.innerHTML = `<div class="interaction-detail-label">Menu:</div><div class="interaction-detail-text">${interaction.selectedMenu}</div>`;
  content.appendChild(menuDetail);
  
  // User Prompt
  if (interaction.sentPrompt?.userPrompt) {
    const promptDetail = document.createElement('div');
    promptDetail.className = 'interaction-detail';
    promptDetail.innerHTML = `<div class="interaction-detail-label">User Prompt:</div><div class="interaction-detail-text">${escapeHtml(interaction.sentPrompt.userPrompt)}</div>`;
    content.appendChild(promptDetail);
  }
  
  // AI Response
  if (interaction.receivedResponse?.text) {
    const responseDetail = document.createElement('div');
    responseDetail.className = 'interaction-detail';
    responseDetail.innerHTML = `<div class="interaction-detail-label">AI Response:</div><div class="interaction-detail-text">${escapeHtml(interaction.receivedResponse.text)}</div>`;
    content.appendChild(responseDetail);
  }
  
  card.appendChild(header);
  card.appendChild(content);
  
  // ref 저장
  interactionRefs[interactionIndex] = card;
  
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCard(interactionIndex);
  });
  
  return card;
}

// 질문에 매칭되는 응답 찾기 (predefinedQnA에서)
function findMatchingResponse(question) {
  if (!predefinedQnA || !predefinedQnA[videoName]) {
    return null;
  }
  
  const qnaList = predefinedQnA[videoName];
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

// 비디오 오버레이 표시
function showVideoOverlay(interactionIndex, slideNumber) {
  const interaction = interactions[interactionIndex];
  
  if (!interaction || !interaction.sentPrompt?.userPrompt) {
    return;
  }
  
  // 모든 활성 비디오 오버레이 숨기기 (가장 최근 것만 재생)
  Object.keys(activeVideoOverlays).forEach(index => {
    hideVideoOverlay(parseInt(index));
  });
  
  // 저장된 인터랙션에서 비디오 경로 확인 (receivedResponse.src)
  let videoPath = null;
  if (interaction.receivedResponse?.src && interaction.receivedResponse.src.length > 0) {
    videoPath = interaction.receivedResponse.src[0];
  } else {
    // predefinedQnA에서 매칭되는 응답 찾기
    const matchedResponse = findMatchingResponse(interaction.sentPrompt.userPrompt);
    
    if (!matchedResponse || !matchedResponse.videoPath) {
      return;
    }
    videoPath = matchedResponse.videoPath;
  }
  
  // 슬라이드 요소 찾기
  const slideRef = slideRefs[slideNumber];
  if (!slideRef || !boundingBox) {
    return;
  }
  
  const slideImageContainer = slideRef.querySelector('.slide-image-container');
  if (!slideImageContainer) {
    return;
  }
  
  // 슬라이드 이미지 컨테이너의 실제 크기 가져오기
  const containerRect = slideImageContainer.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  
  // instructorRegion 위치 계산 (슬라이드 기준 상대 위치)
  // boundingBox의 instructorRegion은 원본 비디오 크기를 기준으로 함
  const relativeX = (boundingBox.instructorRegion.x / ORIGINAL_WIDTH) * containerWidth;
  const relativeY = (boundingBox.instructorRegion.y / ORIGINAL_HEIGHT) * containerHeight;
  const relativeWidth = (boundingBox.instructorRegion.width / ORIGINAL_WIDTH) * containerWidth;
  const relativeHeight = (boundingBox.instructorRegion.height / ORIGINAL_HEIGHT) * containerHeight;
  
  // 비디오 오버레이 컨테이너 생성
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'video-overlay-container';
  overlayContainer.style.cssText = `
    position: absolute;
    left: ${relativeX}px;
    top: ${relativeY}px;
    width: ${relativeWidth}px;
    height: ${relativeHeight}px;
    z-index: 20;
    background: #000;
    overflow: hidden;
  `;
  
  // 비디오 요소 생성
  const video = document.createElement('video');
  video.src = videoPath;
  video.autoplay = true;
  video.controls = false;
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;
  
  // 닫기 버튼
  const closeBtn = document.createElement('button');
  closeBtn.className = 'video-overlay-close';
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    z-index: 21;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideVideoOverlay(interactionIndex);
    toggleCard(interactionIndex);
  });
  
  // 비디오 종료 시 오버레이 제거
  video.addEventListener('ended', () => {
    hideVideoOverlay(interactionIndex);
  });
  
  overlayContainer.appendChild(video);
  overlayContainer.appendChild(closeBtn);
  slideImageContainer.appendChild(overlayContainer);
  
  // 오버레이 정보 저장
  activeVideoOverlays[interactionIndex] = {
    videoElement: video,
    container: overlayContainer,
    slideNumber: slideNumber
  };
  
  // 비디오 재생
  video.play().catch(err => {
    console.error('Failed to play video:', err);
  });
}

// 비디오 오버레이 숨기기
function hideVideoOverlay(interactionIndex) {
  const overlay = activeVideoOverlays[interactionIndex];
  if (overlay) {
    // 비디오 정지
    if (overlay.videoElement) {
      overlay.videoElement.pause();
      overlay.videoElement.src = '';
    }
    
    // 컨테이너 제거
    if (overlay.container && overlay.container.parentNode) {
      overlay.container.parentNode.removeChild(overlay.container);
    }
    
    // 오버레이 정보 삭제
    delete activeVideoOverlays[interactionIndex];
  }
}

// 카드 토글
function toggleCard(interactionIndex) {
  const interaction = interactions[interactionIndex];
  const slideNumber = findSlideNumber(interaction.time.seconds);
  
  if (expandedCards.has(interactionIndex)) {
    // 카드 닫기 - 비디오 오버레이 제거
    expandedCards.delete(interactionIndex);
    hideVideoOverlay(interactionIndex);
  } else {
    // 카드 열기 - 비디오 오버레이 표시
    expandedCards.add(interactionIndex);
    showVideoOverlay(interactionIndex, slideNumber);
  }
  
  const card = interactionRefs[interactionIndex];
  if (card) {
    card.classList.toggle('expanded');
    const toggleBtn = card.querySelector('.interaction-card-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = expandedCards.has(interactionIndex)
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>';
    }
  }
  
  updateConnectionLines();
}

// 모든 카드 펼치기
function expandAllCards() {
  interactions.forEach((interaction, index) => {
    expandedCards.add(index);
    const card = interactionRefs[index];
    if (card) {
      card.classList.add('expanded');
      const toggleBtn = card.querySelector('.interaction-card-toggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>';
      }
    }
    // 비디오 오버레이 표시
    const slideNumber = findSlideNumber(interaction.time.seconds);
    if (slideNumber > 0) {
      showVideoOverlay(index, slideNumber);
    }
  });
  updateConnectionLines();
}

// 모든 카드 접기
function collapseAllCards() {
  expandedCards.clear();
  interactions.forEach((_, index) => {
    const card = interactionRefs[index];
    if (card) {
      card.classList.remove('expanded');
      const toggleBtn = card.querySelector('.interaction-card-toggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>';
      }
    }
    // 비디오 오버레이 제거
    hideVideoOverlay(index);
  });
  updateConnectionLines();
}

// 연결선 업데이트
function updateConnectionLines() {
  if (!connectionLines) return;
  
  connectionLines.innerHTML = '';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  
  Object.entries(slideInteractions).forEach(([slideNumStr, interactionIndices]) => {
    const slideNum = parseInt(slideNumStr);
    const slideRef = slideRefs[slideNum];
    
    if (slideRef) {
      interactionIndices.forEach(interactionIndex => {
        const interactionRef = interactionRefs[interactionIndex];
        
        if (interactionRef) {
          const slideRect = slideRef.getBoundingClientRect();
          const interactionRect = interactionRef.getBoundingClientRect();
          
          const interaction = interactions[interactionIndex];
          const selection = interaction.selection;
          
          // 슬라이드 내의 선택 영역 우하단 포인트 계산
          let startX, startY;
          
          if (selection) {
            const relativeX = selection.endX / ORIGINAL_WIDTH;
            const relativeY = selection.endY / ORIGINAL_HEIGHT;
            startX = slideRect.left + (relativeX * slideRect.width);
            startY = slideRect.top + (relativeY * slideRect.height);
          } else {
            startX = slideRect.right;
            startY = slideRect.bottom;
          }
          
          // 인터랙션 카드 기준 끝점 계산 (카드의 좌상단)
          const endX = interactionRect.left;
          const endY = interactionRect.top;
          
          const isExpanded = expandedCards.has(interactionIndex);
          
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const pathData = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
          path.setAttribute('d', pathData);
          path.setAttribute('stroke', '#000000');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('stroke-dasharray', isExpanded ? 'none' : '5,5');
          path.setAttribute('fill', 'none');
          
          svg.appendChild(path);
        }
      });
    }
  });
  
  connectionLines.appendChild(svg);
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

