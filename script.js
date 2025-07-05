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

// Elementos do popup de progresso
const progressPopup = document.getElementById('progressPopup');
const closePopup = document.getElementById('closePopup');
const popupProgressBar = document.getElementById('popupProgressBar');
const popupProgressIndicator = document.getElementById('popupProgressIndicator');
const popupProgressText = document.getElementById('popupProgressText');
const popupProgressMessage = document.getElementById('popupProgressMessage');

function handleBrokenImage(img) {
  img.onerror = null;
  img.src = 'https://via.placeholder.com/300x200?text=Thumbnail+indispon%C3%ADvel';
}

// ===========================
// Utilitários
// ===========================
const el = id => document.getElementById(id);

function showStatus(message, type = 'info') {
  const status = el('status');
  if (!status) return;
  
  status.textContent = message;
  status.className = 'status-message';
  
  ['info', 'success', 'error', 'warning'].forEach(cls => {
    status.classList.remove(cls);
  });
  
  if (type) status.classList.add(type);
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return [
    h > 0 ? h : null,
    m > 9 ? m : (h > 0 ? '0' + m : m || '0'),
    s > 9 ? s : '0' + s
  ].filter(Boolean).join(':');
}

function simulateProgress() {
  let progress = 0;
  const progressBar = el('progressBar');
  const progressText = el('progressText');
  
  if (!progressBar || !progressText) return;
  
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      showStatus('Download concluído com sucesso!', 'success');
    }
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
  }, 300);

  setTimeout(() => {
    clearInterval(progressInterval);
  }, 10000);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9áéíóúñü \._-]/gi, '_').substring(0, 100);
}

// ===========================
// Funções do Popup de Progresso
// ===========================
function initProgressPopup() {
  if (closePopup) {
    closePopup.addEventListener('click', () => {
      if (progressPopup) progressPopup.classList.add('hidden');
    });
  }
}

function updatePopupProgress(percent, message) {
  if (!popupProgressBar || !popupProgressIndicator || !popupProgressText || !popupProgressMessage) return;
  
  popupProgressBar.style.width = `${percent}%`;
  popupProgressIndicator.style.left = `${percent}%`;
  popupProgressText.textContent = `${Math.floor(percent)}%`;
  popupProgressMessage.textContent = message;
  
  // Atualiza estatísticas simuladas
  const speedElement = document.querySelector('.tech-progress-speed');
  const timeElement = document.querySelector('.tech-progress-time');
  const sizeElement = document.querySelector('.tech-progress-size');
  
  if (speedElement) {
    speedElement.innerHTML = `<i class="fas fa-bolt"></i> ${(Math.random() * 5 + 1).toFixed(2)} MB/s`;
  }
  if (timeElement) {
    timeElement.innerHTML = `<i class="fas fa-clock"></i> ${Math.floor(percent / 10)}:${Math.floor(percent % 10)}0`;
  }
  if (sizeElement) {
    sizeElement.innerHTML = `<i class="fas fa-database"></i> ${(percent * 2.5).toFixed(1)} MB`;
  }
}

function simulateDownloadProgress() {
  let progress = 0;
  const messages = [
    "Conectando ao servidor...",
    "Preparando download...",
    "Transferindo dados...",
    "Otimizando arquivo...",
    "Quase lá...",
    "Finalizando..."
  ];
  
  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) progress = 100;
    
    updatePopupProgress(progress, messages[Math.floor(progress / 20)]);
    
    if (progress === 100) {
      clearInterval(interval);
      if (popupProgressMessage) {
        popupProgressMessage.textContent = "Download completo!";
      }
      
      updateSpeedGraph();
    }
  }, 500);
}

function updateSpeedGraph() {
  const canvas = document.getElementById('speedGraph');
  if (!canvas || !canvas.getContext) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Limpa o canvas
  ctx.clearRect(0, 0, width, height);
  
  // Desenha o gráfico
  ctx.beginPath();
  ctx.moveTo(0, height);
  
  for (let x = 0; x <= width; x += 20) {
    const y = height - (Math.random() * 0.8 + 0.2) * height;
    ctx.lineTo(x, y);
  }
  
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Adiciona rótulos
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
  ctx.font = '10px Arial';
  ctx.fillText('Velocidade de Download', 10, 15);
}

// ===========================
// Componentes
// ===========================
function initThemeToggle() {
  const toggle = el('themeToggle');
  if (!toggle) return;

  toggle.onclick = () => {
    document.body.classList.toggle('dark-theme');
    const icon = toggle.querySelector('i');
    
    if (document.body.classList.contains('dark-theme')) {
      icon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
    } else {
      icon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
    }
  };

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    const icon = toggle.querySelector('i');
    if (icon) icon.classList.replace('fa-moon', 'fa-sun');
  }
}

function initTutorialAccordion() {
  const tutorialHeader = el('tutorialHeader');
  const tutorialContent = el('tutorialContent');
  const tutorialToggle = tutorialHeader?.querySelector('.tutorial-toggle i');
  
  if (tutorialHeader && tutorialContent && tutorialToggle) {
    tutorialHeader.addEventListener('click', function() {
      tutorialContent.classList.toggle('show');
      
      if (tutorialContent.classList.contains('show')) {
        tutorialToggle.classList.remove('fa-chevron-down');
        tutorialToggle.classList.add('fa-chevron-up');
        tutorialHeader.querySelector('.tutorial-toggle').style.animation = 'none';
      } else {
        tutorialToggle.classList.remove('fa-chevron-up');
        tutorialToggle.classList.add('fa-chevron-down');
        tutorialHeader.querySelector('.tutorial-toggle').style.animation = 'pulse 2s infinite';
      }
    });
  }
}

function initScrollToTop() {
  const scrollToTopBtn = el('scrollToTop');
  
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

function initAutoCheck() {
  const urlInput = el('url');
  if (!urlInput) return;

  urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();
    
    if (url.match(/^https?:\/\/.+\..+/)) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkVideo();
      }, 1000);
    }
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const url = urlInput.value.trim();
      
      if (url.match(/^https?:\/\/.+\..+/)) {
        checkVideo();
      } else if (url.length > 2) {
        searchVideos(url);
      }
    }
  });
}

async function searchVideos(query) {
  if (!query || query.length < 3) return;
  if (query === lastSearchQuery) return;
  
  lastSearchQuery = query;
  showStatus(`Pesquisando por "${query}"...`, 'info');

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      {},
      10000
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar vídeos');
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Nenhum resultado encontrado');
    }
    
    displaySearchResults(data);
    
  } catch (error) {
    showStatus(error.message || 'Erro ao buscar vídeos', 'error');
    console.error('Erro na busca:', error);
    
    const resultsGrid = el('searchResultsGrid');
    if (resultsGrid) resultsGrid.innerHTML = '';
    
    const resultsContainer = el('searchResults');
    if (resultsContainer) resultsContainer.classList.add('hidden');
  }
}

function displaySearchResults(results) {
  const resultsContainer = el('searchResults');
  const resultsGrid = el('searchResultsGrid');
  
  if (!resultsContainer || !resultsGrid) return;

  if (!results || results.length === 0) {
    showStatus('Nenhum resultado encontrado', 'warning');
    resultsContainer.classList.add('hidden');
    return;
  }

  resultsGrid.innerHTML = results.map(result => `
    <div class="search-result-item" data-url="${result.url}">
      <img src="${result.thumbnail}" alt="${result.title}" class="search-result-thumbnail" loading="lazy" onerror="handleBrokenImage(this)">
      <div class="search-result-info">
        <div class="search-result-title">${result.title || 'Sem título'}</div>
        <div class="search-result-duration">${result.duration ? formatDuration(result.duration) : '--:--'}</div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      el('url').value = url;
      checkVideo();
    });
  });

  resultsContainer.classList.remove('hidden');
  showStatus(`${results.length} resultados encontrados`, 'success');
}

// ===========================
// Lógica Principal
// ===========================
async function checkVideo() {
  const urlInput = el('url');
  const checkButton = el('check');
  
  if (!urlInput || !checkButton) return;

  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Por favor, insira um URL válido', 'error');
    return;
  }
  
  showStatus('Consultando...', 'info');
  checkButton.disabled = true;
  checkButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando';

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao consultar o vídeo');
    }
    
    updateVideoInfoUI(data);
    
  } catch (error) {
    showStatus(error.message || 'Erro ao conectar ao servidor', 'error');
    console.error('Erro na verificação:', error);
  } finally {
    checkButton.disabled = false;
    checkButton.innerHTML = '<i class="fas fa-search"></i> <span class="btn-text">Ver Qualidades</span>';
  }
}

function updateVideoInfoUI(data) {
  const thumb = el('thumb');
  const title = el('mediaTitle');
  const duration = el('mediaDuration');
  const formats = el('formats');
  const downloadButton = el('download');
  const resultContainer = el('resultContainer');
  const searchResults = el('searchResults');
  
  if (searchResults) searchResults.classList.add('hidden');
  
  if (thumb) {
    thumb.src = data.thumbnail || 'https://via.placeholder.com/300x200?text=Sem+thumbnail';
    thumb.onerror = function() {
      this.onerror = null;
      this.src = 'https://via.placeholder.com/300x200?text=Thumbnail+indispon%C3%ADvel';
    };
    thumb.classList.remove('hidden');
  }
  
  if (title) {
    title.textContent = data.title || 'Título não disponível';
    currentVideoTitle = data.title || 'video';
  }
  
  if (duration) {
    duration.textContent = data.duration ? `Duração: ${formatDuration(data.duration)}` : 'Duração não disponível';
  }
  
  if (formats && data.formats && data.formats.length > 0) {
    const sortedFormats = data.formats.sort((a, b) => {
      const aScore = (a.height || 0) + (a.filesize || 0);
      const bScore = (b.height || 0) + (b.filesize || 0);
      return bScore - aScore;
    });
    
    formats.innerHTML = sortedFormats.map(f => {
      const resolution = f.height ? `${f.height}p` : 'Áudio';
      const size = f.filesize ? `| ${formatFileSize(f.filesize)}` : '';
      return `<option value="${f.format}">
        ${resolution} | ${f.ext.toUpperCase()} ${size}
      </option>`;
    }).join('');
    
    formats.classList.remove('hidden');
    if (downloadButton) downloadButton.classList.remove('hidden');
    showStatus('Selecione o formato e baixe!', 'success');
  }
  
  if (resultContainer) resultContainer.classList.remove('hidden');
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function initCopyButton() {
  const copyBtn = el('copyUrl');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const urlInput = el('url');
      if (urlInput) {
        urlInput.select();
        document.execCommand('copy');
        showStatus('URL copiada para a área de transferência!', 'success');
      }
    });
  }
}

async function downloadVideo() {
  const urlInput = el('url');
  const formats = el('formats');
  const downloadButton = el('download');
  const progressContainer = el('progressContainer');
  
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
  if (progressContainer) progressContainer.classList.remove('hidden');

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
    window.open(data.download, '_blank');
    
    showStatus('Redirecionando para download...', 'success');
    simulateDownloadProgress();
    
    setTimeout(() => {
      downloadButton.innerHTML = '<i class="fas fa-redo"></i> <span class="btn-text">Baixar Novamente</span>';
    }, 2000);
    
  } catch (error) {
    showStatus(error.message || 'Erro durante o download', 'error');
    console.error('Erro no download:', error);
    const progressBar = el('progressBar');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPopup) progressPopup.classList.add('hidden');
  } finally {
    downloadButton.disabled = false;
    downloadButton.innerHTML = '<i class="fas fa-download"></i> <span class="btn-text">Baixar</span>';
  }
}

async function convertVideo(format) {
  const urlInput = el('url');
  if (!urlInput) return;

  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Por favor, insira um URL válido', 'error');
    return;
  }

  showStatus(`Convertendo para ${format.toUpperCase()}...`, 'info');

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na conversão');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${sanitizeFilename(currentVideoTitle)}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    showStatus('Conversão concluída!', 'success');
    
  } catch (error) {
    showStatus(error.message || 'Erro na conversão', 'error');
    console.error('Erro na conversão:', error);
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
  
  const checkButton = el('check');
  const downloadButton = el('download');
  const mp3Button = el('convertMp3');
  const mp4Button = el('convertMp4');
  
  if (checkButton) checkButton.onclick = checkVideo;
  if (downloadButton) downloadButton.onclick = downloadVideo;
  if (mp3Button) mp3Button.onclick = () => convertVideo('mp3');
  if (mp4Button) mp4Button.onclick = () => convertVideo('mp4');
}

if (document.readyState !== 'loading') {
  initPage();
} else {
  document.addEventListener('DOMContentLoaded', initPage);
}