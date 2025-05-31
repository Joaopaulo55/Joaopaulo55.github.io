// Configuração
const API_BASE_URL = 'https://backend-bdownload.onrender.com';

// Atualiza o ano no footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

const el = id => document.getElementById(id);

// Toggle dark/light theme
el('themeToggle').onclick = () => {
  document.body.classList.toggle('dark-theme');
  const icon = el('themeToggle').querySelector('i');
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
  el('themeToggle').querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

el('check').onclick = async () => {
  const url = el('url').value.trim();
  if(!url) {
    showStatus('Por favor, insira um URL válido', 'error');
    return;
  }
  
  showStatus('Consultando...', 'info');
  el('check').disabled = true;
  el('check').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando';

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
    
    // Preenche os dados
    el('thumb').src = data.thumbnail;
    el('thumb').classList.remove('hidden');
    el('mediaTitle').textContent = data.title || 'Título não disponível';
    el('mediaDuration').textContent = data.duration ? `Duração: ${formatDuration(data.duration)}` : 'Duração não disponível';
    
    // Preenche a lista de formatos
    if (data.formats && data.formats.length > 0) {
      el('formats').innerHTML = data.formats.map(f =>
        `<option value="${f.id}">
          ${f.resolution?.padEnd(6) || 'Áudio'} | ${f.ext} | ${f.vcodec !== 'none' ? 'Vídeo' : ''}${f.vcodec !== 'none' && f.acodec !== 'none' ? ' + ' : ''}${f.acodec !== 'none' ? 'Áudio' : ''}
        </option>`
      ).join('');
      
      el('formats').classList.remove('hidden');
      el('download').classList.remove('hidden');
      showStatus('Selecione o formato e baixe!', 'success');
    } else {
      showStatus('Nenhum formato disponível encontrado', 'warning');
    }
    
    el('resultContainer').classList.remove('hidden');
    
  } catch (error) {
    showStatus(error.message || 'Erro ao conectar ao servidor', 'error');
    console.error('Erro:', error);
  } finally {
    el('check').disabled = false;
    el('check').innerHTML = '<i class="fas fa-search"></i> <span class="btn-text">Ver Qualidades</span>';
  }
};

el('download').onclick = async () => {
  const url = el('url').value.trim();
  const fmtId = el('formats').value;
  
  if(!fmtId) {
    showStatus('Selecione um formato para baixar', 'error');
    return;
  }

  showStatus('Preparando download...', 'info');
  el('download').disabled = true;
  el('download').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando';
  el('progressContainer').classList.remove('hidden');

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
      // Abre o link de download em nova aba
      window.open(data.downloadUrl, '_blank');
      showStatus('Redirecionando para download...', 'success');
      simulateProgress();
      
      // Atualiza o botão para "Baixar Novamente"
      setTimeout(() => {
        el('download').innerHTML = '<i class="fas fa-redo"></i> <span class="btn-text">Baixar Novamente</span>';
      }, 2000);
    } else {
      throw new Error('URL de download não recebida');
    }
    
  } catch (error) {
    showStatus(error.message || 'Erro durante o download', 'error');
  } finally {
    el('download').disabled = false;
    el('download').innerHTML = '<i class="fas fa-download"></i> <span class="btn-text">Baixar</span>';
  }
};

// Mostra mensagens de status
function showStatus(message, type = 'info') {
  const status = el('status');
  status.textContent = message;
  status.className = 'status-message';
  
  // Remove todas as classes de tipo anteriores
  ['info', 'success', 'error', 'warning'].forEach(cls => {
    status.classList.remove(cls);
  });
  
  if (type) status.classList.add(type);
}

// Formata a duração de segundos para HH:MM:SS
function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':');
}

// Simula barra de progresso (opcional)
function simulateProgress() {
  let progress = 0;
  const progressBar = el('progressBar');
  const progressText = el('progressText');
  
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if(progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      showStatus('Download concluído com sucesso!', 'success');
    }
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
  }, 300);
}

// Plataformas sugeridas
document.querySelectorAll('.platform-icons i').forEach(icon => {
  icon.addEventListener('click', () => {
    const platformUrls = {
      'YouTube': 'https://youtube.com/watch?v=',
      'Vimeo': 'https://vimeo.com/',
      'Facebook': 'https://facebook.com/watch/?v=',
      'Instagram': 'https://instagram.com/p/',
      'TikTok': 'https://tiktok.com/@',
      'Outros sites': 'https://'
    };
    
    const platform = icon.title.replace('INSERIR O LINK DA URL AQUI', 'YouTube');
    el('url').value = platformUrls[platform] || '';
    el('url').focus();
  });
});

// FAQ functionality
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const isOpen = question.classList.contains('active');
    
    // Close all other FAQs
    document.querySelectorAll('.faq-question').forEach(q => {
      if (q !== question) {
        q.classList.remove('active');
        q.nextElementSibling.classList.remove('show');
      }
    });
    
    // Toggle current FAQ
    question.classList.toggle('active');
    answer.classList.toggle('show');
  });
});

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Set current date in format DD/MM/YYYY
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Set current date in terms and privacy pages
if (document.getElementById('currentDate')) {
  document.getElementById('currentDate').textContent = formatDate(new Date());
}

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();