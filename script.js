// ===========================
// Configurações Globais
// ===========================
const API_BASE_URL = 'https://backend-bdownload.onrender.com';
const PLATFORM_URLS = {
  'youtube': 'https://youtube.com/watch?v=',
  'vimeo': 'https://vimeo.com/',
  'facebook': 'https://facebook.com/watch/?v=',
  'instagram': 'https://instagram.com/p/',
  'tiktok': 'https://tiktok.com/@',
  'all': 'https://'
};
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

let selectedPlatform = null;
let debounceTimer = null;
let lastSearchQuery = '';
let currentVideoTitle = '';

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
  
  // Remove todas as classes de tipo
  ['info', 'success', 'error', 'warning'].forEach(cls => {
    status.classList.remove(cls);
  });
  
  // Adiciona a classe do tipo especificado
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

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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

  // Timeout de segurança
  setTimeout(() => {
    clearInterval(progressInterval);
  }, 10000); // 10 segundos
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9áéíóúñü \._-]/gi, '_').substring(0, 100);
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

  // Verifica o tema salvo
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    const icon = toggle.querySelector('i');
    if (icon) icon.classList.replace('fa-moon', 'fa-sun');
  }
}

function initTutorialAccordion() {
    const tutorialHeader = document.getElementById('tutorialHeader');
    const tutorialContent = document.getElementById('tutorialContent');
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
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
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



function initPlatformSelection() {
  const platformIcons = document.querySelectorAll('.platform-icons i');
  if (!platformIcons.length) return;

  platformIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      // Remove a classe 'selected' de todos os ícones
      platformIcons.forEach(i => i.classList.remove('selected'));
      
      // Adiciona a classe 'selected' apenas ao ícone clicado
      icon.classList.add('selected');
      
      // Define a plataforma selecionada
      selectedPlatform = icon.dataset.platform;
      
      // Foca no input de URL
      const urlInput = el('url');
      if (urlInput) {
        urlInput.focus();
        urlInput.placeholder = `Pesquise vídeos no ${icon.title} ou cole um link...`;
      }
    });
  });
}

function initAutoCheck() {
  const urlInput = el('url');
  if (!urlInput) return;

  urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();
    
    // Se for um URL válido, verifica automaticamente após um pequeno atraso
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
      } else if (selectedPlatform && url.length > 2) {
        searchVideos(url);
      }
    }
  });
}


async function searchVideos(query) {
  if (!query || query.length < 3) return;
  if (query === lastSearchQuery) return;
  
  lastSearchQuery = query;
  showStatus(`Pesquisando por "${query}" no ${selectedPlatform || 'todas as plataformas'}...`, 'info');

  try {
    const platformParam = selectedPlatform === 'all' ? null : selectedPlatform;
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/buscar?q=${encodeURIComponent(query)}${platformParam ? `&platform=${platformParam}` : ''}`,
      {}, // options
      10000 // timeout de 10 segundos
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || 'Erro ao buscar vídeos');
    }
    
    const data = await response.json();
    
    if (!data.resultados || data.resultados.length === 0) {
      throw new Error('Nenhum resultado encontrado');
    }
    
    displaySearchResults(data.resultados);
    
  } catch (error) {
    showStatus(error.message || 'Erro ao buscar vídeos', 'error');
    console.error('Erro na busca:', error);
    
    // Limpa resultados em caso de erro
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
      <img src="${result.thumb}" alt="${result.titulo}" class="search-result-thumbnail" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Thumbnail+indispon%C3%ADvel'">
      <div class="search-result-info">
        <div class="search-result-title">${result.titulo}</div>
        <div class="search-result-channel">${result.canal || 'Canal desconhecido'}</div>
        <div class="search-result-platform">${result.plataforma}</div>
        <div class="search-result-duration">${result.duracao || '--:--'}</div>
      </div>
    </div>
  `).join('');

  // Adiciona event listeners para os resultados
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
    const res = await fetchWithTimeout(`${API_BASE_URL}/formats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao consultar o vídeo');
    }
    
    // Atualiza a UI com os dados recebidos
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
  const cookieStatus = el('cookieStatus');
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
  
  if (cookieStatus) {
    const hasCookies = data.cookies === 'válidos';
    cookieStatus.innerHTML = `
      <i class="fas ${hasCookies ? 'fa-check-circle text-green' : 'fa-exclamation-triangle text-yellow'}"></i> 
      ${hasCookies ? 'Acesso premium disponível' : 'Acesso limitado (sem cookies)'}
    `;
    
    if (!hasCookies) {
      showStatus('Para acessar formatos premium, atualize os cookies no servidor', 'warning');
    }
    cookieStatus.classList.remove('hidden');
  }
  
  if (formats && data.formats && data.formats.length > 0) {
    // Ordenar formatos
    const sortedFormats = data.formats.sort((a, b) => {
      const aScore = (a.vcodec !== 'none' ? 2 : 0) + (a.acodec !== 'none' ? 1 : 0);
      const bScore = (b.vcodec !== 'none' ? 2 : 0) + (b.acodec !== 'none' ? 1 : 0);
      return bScore - aScore;
    });
    
    formats.innerHTML = sortedFormats.map(f => {
      const isVideo = f.vcodec !== 'none';
      const isAudio = f.acodec !== 'none';
      let type = '';
      
      if (isVideo && isAudio) type = 'Vídeo + Áudio';
      else if (isVideo) type = 'Apenas Vídeo';
      else if (isAudio) type = 'Apenas Áudio';
      
      return `<option value="${f.id}">
        ${f.resolution?.padEnd(6) || 'Áudio'} | ${f.ext.toUpperCase()} | ${type}
        ${f.filesize ? `| ${formatFileSize(f.filesize)}` : ''}
      </option>`;
    }).join('');
    
    formats.classList.remove('hidden');
    if (downloadButton) downloadButton.classList.remove('hidden');
    showStatus('Selecione o formato e baixe!', 'success');
  }
  
  if (resultContainer) resultContainer.classList.remove('hidden');
}


// ===========================
// Função Auxiliar
// ===========================
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

// ===========================
// Lógica Principal (continuação)
// ===========================
async function downloadVideo() {
  const urlInput = el('url');
  const formats = el('formats');
  const downloadButton = el('download');
  const progressContainer = el('progressContainer');
  
  if (!urlInput || !formats || !downloadButton) return;

  const url = urlInput.value.trim();
  const fmtId = formats.value;
  
  if (!fmtId) {
    showStatus('Selecione um formato para baixar', 'error');
    return;
  }

  showStatus('Preparando download...', 'info');
  downloadButton.disabled = true;
  downloadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando';
  if (progressContainer) progressContainer.classList.remove('hidden');

  try {
    const redirectUrl = `${API_BASE_URL}/redirect-download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(fmtId)}`;
    window.open(redirectUrl, '_blank');
    
    showStatus('Redirecionando para download...', 'success');
    simulateProgress();
    
    setTimeout(() => {
      downloadButton.innerHTML = '<i class="fas fa-redo"></i> <span class="btn-text">Baixar Novamente</span>';
    }, 2000);
    
  } catch (error) {
    showStatus(error.message || 'Erro durante o download', 'error');
    console.error('Erro no download:', error);
    const progressBar = el('progressBar');
    if (progressBar) progressBar.style.width = '0%';
  } finally {
    downloadButton.disabled = false;
    downloadButton.innerHTML = '<i class="fas fa-download"></i> <span class="btn-text">Baixar</span>';
  }
}

// ===========================
// Inicialização
// ===========================
function initPage() {
  // Atualiza o ano no footer
  const currentYear = el('currentYear');
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Atualiza a data atual (para termos e privacidade)
  const currentDate = el('currentDate');
  if (currentDate) {
    currentDate.textContent = formatDate(new Date());
  }

  // Inicializa componentes
  initThemeToggle();
  initPlatformSelection();
  initAutoCheck();
  initTutorialAccordion();
  initScrollToTop();
  initCopyButton();

  // Configura eventos
  const checkButton = el('check');
  const downloadButton = el('download');
  
  if (checkButton) checkButton.onclick = checkVideo;
  if (downloadButton) downloadButton.onclick = downloadVideo;
}

// Inicia a aplicação quando o DOM estiver pronto
if (document.readyState !== 'loading') {
  initPage();
} else {
  document.addEventListener('DOMContentLoaded', initPage);
}