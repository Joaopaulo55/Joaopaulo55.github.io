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
    const res = await fetch(`${API_BASE_URL}/buscar?q=${encodeURIComponent(query)}${platformParam ? `&platform=${platformParam}` : ''}`);
    
    if (!res.ok) {
      throw new Error('Erro ao buscar vídeos');
    }
    
    const data = await res.json();
    displaySearchResults(data.resultados);
    
  } catch (error) {
    showStatus(error.message || 'Erro ao buscar vídeos', 'error');
    console.error('Erro na busca:', error);
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
    const res = await fetch(`${API_BASE_URL}/formats`, {
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
    thumb.onerror = () => handleBrokenImage(thumb);
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
    cookieStatus.innerHTML = data.cookies ? 
      `<i class="fas ${data.cookies === 'válidos' ? 'fa-check-circle text-green' : 'fa-exclamation-triangle text-red'}"></i> Cookies ${data.cookies}` : 
      '';
    cookieStatus.classList.remove('hidden');
  }
  
  if (formats && data.formats && data.formats.length > 0) {
    formats.innerHTML = data.formats.map(f =>
      `<option value="${f.id}">
        ${f.resolution?.padEnd(6) || 'Áudio'} | ${f.ext} | ${f.vcodec !== 'none' ? 'Vídeo' : ''}${f.vcodec !== 'none' && f.acodec !== 'none' ? ' + ' : ''}${f.acodec !== 'none' ? 'Áudio' : ''}
      </option>`
    ).join('');
    
    formats.classList.remove('hidden');
    if (downloadButton) downloadButton.classList.remove('hidden');
    showStatus('Selecione o formato e baixe!', 'success');
  } else {
    showStatus('Nenhum formato disponível encontrado', 'warning');
  }
  
  if (resultContainer) resultContainer.classList.remove('hidden');
}

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
    const res = await fetch(`${API_BASE_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format: fmtId })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao preparar download');
    }
    
    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
      showStatus('Redirecionando para download...', 'success');
      simulateProgress();
      
      // Atualiza o botão para "Baixar Novamente"
      setTimeout(() => {
        downloadButton.innerHTML = '<i class="fas fa-redo"></i> <span class="btn-text">Baixar Novamente</span>';
      }, 2000);
    } else {
      throw new Error('URL de download não recebida');
    }
    
  } catch (error) {
    showStatus(error.message || 'Erro durante o download', 'error');
    console.error('Erro no download:', error);
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