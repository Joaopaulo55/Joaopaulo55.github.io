// ===========================
// Configurações Globais
// ===========================
const API_BASE_URL = 'https://backend-bdownload.onrender.com';
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
};

let debounceTimer = null;
let lastSearchQuery = '';
let currentVideoTitle = '';
let eventSource = null;
let progressSource = null;

// Elementos do popup de progresso
const progressPopup = document.getElementById('progressPopup');
const closePopup = document.getElementById('closePopup');
const popupProgressBar = document.getElementById('popupProgressBar');
const popupProgressIndicator = document.getElementById('popupProgressIndicator');
const popupProgressText = document.getElementById('popupProgressText');
const popupProgressMessage = document.getElementById('popupProgressMessage');

// Elementos do popup de notícias
const newsPopup = document.getElementById('newsPopup');
const newsPopupContent = document.getElementById('newsPopupContent');
const closeNewsPopup = document.getElementById('closeNewsPopup');
const adsContainer = document.getElementById('adsContainer');

function handleBrokenImage(img) {
  img.onerror = null;
  img.src = 'https://via.placeholder.com/300x200?text=Thumbnail+indispon%C3%ADvel';
}

// ===========================
// Novas Funções para Notificações e Progresso
// ===========================
function initEventSources() {
  // Conecta ao SSE de notificações
  eventSource = new EventSource(`${API_BASE_URL}/notifications`);
  
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    showNewsPopup(data.number);
  };
  
  eventSource.onerror = (e) => {
    console.error('Erro na conexão de notificações:', e);
    // Tentar reconectar após 5 segundos
    setTimeout(initEventSources, 5000);
  };
}

function showNewsPopup(randomNumber) {
  if (!newsPopup || !newsPopupContent || !adsContainer) return;
  
  // Carrega notícias baseadas no número aleatório
  const news = News.getRandomNews(randomNumber);
  const ads = Ads.getRandomAd();
  
  newsPopupContent.innerHTML = `
    <h3>Notícias da Região</h3>
    <div class="news-item">
      <h4>${news.title}</h4>
      <p>${news.content}</p>
      <small>${news.source}</small>
    </div>
  `;
  
  adsContainer.innerHTML = `
    <div class="ad-banner">
      ${ads.content}
    </div>
  `;
  
  newsPopup.classList.remove('hidden');
}

function closeNewsPopupHandler() {
  if (newsPopup) newsPopup.classList.add('hidden');
}

function initProgressTracking() {
  // Fecha qualquer conexão anterior
  if (progressSource) progressSource.close();
  
  progressSource = new EventSource(`${API_BASE_URL}/download/progress`);
  
  progressSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    updateProgressBar(data.progress);
    
    if (data.download) {
      handleDownload(data.download);
    }
    
    if (data.message) {
      updatePopupProgress(data.progress, data.message);
    }
  };
  
  progressSource.onerror = (e) => {
    console.error('Erro na conexão de progresso:', e);
    // Tentar reconectar após 5 segundos
    setTimeout(initProgressTracking, 5000);
  };
}

function updateProgressBar(progress) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${progress}%`;
}

function handleDownload(downloadUrl) {
  // Abre o download em uma nova aba
  window.open(downloadUrl, '_blank');
  
  // Atualiza a UI para mostrar que o download está completo
  const downloadButton = el('download');
  if (downloadButton) {
    downloadButton.innerHTML = '<i class="fas fa-redo"></i> <span class="btn-text">Baixar Novamente</span>';
    downloadButton.disabled = false;
  }
  
  showStatus('Download concluído!', 'success');
  
  // Fecha o popup de progresso após 2 segundos
  setTimeout(() => {
    if (progressPopup) progressPopup.classList.add('hidden');
  }, 2000);
}

// ===========================
// Modificações nas Funções Existentes
// ===========================
async function downloadVideo() {
  const urlInput = el('url');
  const formats = el('formats');
  const downloadButton = el('download');
  
  if (!urlInput || !formats || !downloadButton) return;

  const url = urlInput.value.trim();
  const format = formats.value;
  
  if (!format) {
    showStatus('Selecione um formato para baixar', 'error');
    return;
  }

  // Mostra o popup de progresso
  if (progressPopup) progressPopup.classList.remove('hidden');
  showStatus('Preparando download...', 'info');
  downloadButton.disabled = true;
  downloadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando';

  // Inicia o acompanhamento de progresso
  initProgressTracking();
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao preparar download');
    }
    
    const data = await response.json();
    
    // O progresso será atualizado via SSE
    // O download será aberto automaticamente quando o progresso chegar a 100%
    
  } catch (error) {
    showStatus(error.message || 'Erro durante o download', 'error');
    console.error('Erro no download:', error);
    updateProgressBar(0);
    if (progressPopup) progressPopup.classList.add('hidden');
    downloadButton.disabled = false;
    downloadButton.innerHTML = '<i class="fas fa-download"></i> <span class="btn-text">Baixar</span>';
  }
}

// ===========================
// Inicialização
// ===========================
function initPage() {
  const currentYear = el('currentYear');
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  initThemeToggle();
  initTutorialAccordion();
  initScrollToTop();
  initAutoCheck();
  initCopyButton();
  initProgressPopup();
  
  // Inicializa as novas funcionalidades
  initEventSources();
  
  if (closeNewsPopup) {
    closeNewsPopup.addEventListener('click', closeNewsPopupHandler);
  }

  const checkButton = el('check');
  const downloadButton = el('download');
  const mp3Button = el('convertMp3');
  const mp4Button = el('convertMp4');
  
  if (checkButton) checkButton.onclick = checkVideo;
  if (downloadButton) downloadButton.onclick = downloadVideo;
  if (mp3Button) mp3Button.onclick = () => convertVideo('mp3');
  if (mp4Button) mp4Button.onclick = () => convertVideo('mp4');
}

// Fecha as conexões SSE quando a página é descarregada
window.addEventListener('beforeunload', () => {
  if (eventSource) eventSource.close();
  if (progressSource) progressSource.close();
});

if (document.readyState !== 'loading') {
  initPage();
} else {
  document.addEventListener('DOMContentLoaded', initPage);
}