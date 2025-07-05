// News.js - Versão atualizada para integração com script.js
const API_KEY = 'pub_78c798a7fdd24d4ea4910fc1a264f469';

// Armazena as notícias carregadas para uso nos pop-ups
window.newsData = [];

// Carrega as notícias quando o script é importado
(async function loadNews() {
  try {
    // Obter localização com fallback
    let local;
    try {
      const res = await fetch('https://ipapi.co/json/');
      local = await res.json();
    } catch (error) {
      console.error('Erro ao obter localização, usando fallback:', error);
      local = { country_code: 'br' }; // Fallback para Brasil
    }

    // Obter notícias da API
    const country = local.country_code.toLowerCase();
    const noticias = await getNoticias(country);
    
    if (noticias && noticias.length > 0) {
      // Formata as notícias para o formato esperado pelo script.js
      window.newsData = noticias.map(noticia => ({
        title: noticia.title || 'Sem título',
        content: noticia.description || 'Sem descrição disponível',
        category: noticia.category ? noticia.category.join(', ') : 'Geral',
        source: noticia.source_id || 'Fonte desconhecida',
        date: noticia.pubDate || new Date().toISOString(),
        image: noticia.image_url || 'https://via.placeholder.com/400x200?text=Sem+Imagem',
        link: noticia.link || '#'
      }));

      // Se houver um elemento para mostrar notícias na página principal
      if (document.getElementById('lista-noticias')) {
        mostrarNoticias(noticias);
      }
    } else {
      console.warn('Nenhuma notícia encontrada para a região');
      // Fallback para notícias padrão
      window.newsData = [{
        title: "Notícias não disponíveis",
        content: "Não foi possível carregar as notícias no momento.",
        category: "Informação",
        source: "Sistema",
        date: new Date().toISOString()
      }];
    }
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    // Fallback para notícias padrão em caso de erro
    window.newsData = [{
      title: "Erro ao carregar notícias",
      content: "O serviço de notícias está temporariamente indisponível.",
      category: "Erro",
      source: "Sistema",
      date: new Date().toISOString()
    }];
  }
})();

// Função para obter notícias da API
async function getNoticias(countryCode) {
  try {
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=${countryCode}&language=pt`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Erro na API');
    
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return null;
  }
}

// Função para exibir notícias na página (se necessário)
function mostrarNoticias(noticias) {
  const lista = document.getElementById('lista-noticias');
  if (!lista) return;

  lista.innerHTML = '';

  noticias.slice(0, 6).forEach(noticia => {
    const article = document.createElement('article');
    article.className = 'bg-card-color rounded-lg overflow-hidden shadow-md border border-border-color hover:shadow-lg transition-shadow duration-300 h-full flex flex-col';
    
    article.innerHTML = `
      <div class="h-full flex flex-col">
        <img src="${noticia.image_url || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}" 
             alt="${noticia.title || 'Notícia'}" 
             class="w-full h-48 object-cover"
             onerror="this.src='https://via.placeholder.com/400x200?text=Sem+Imagem'">
        
        <div class="p-4 flex-grow flex flex-col">
          <h3 class="text-lg font-semibold mb-2 text-text-color">
            <a href="${noticia.link}" target="_blank" rel="noopener noreferrer"
               class="hover:text-primary-color transition-colors duration-200">
              ${noticia.title || 'Sem título'}
            </a>
          </h3>
          
          <p class="text-text-light mb-4 flex-grow">
            ${noticia.description || 'Sem descrição disponível.'}
          </p>
          
          <div class="mt-auto">
            <a href="${noticia.link}" target="_blank" rel="noopener noreferrer"
               class="text-primary-color hover:text-secondary-color font-medium inline-flex items-center gap-1 transition-colors duration-200">
              Ler mais <i class="fas fa-external-link-alt text-xs"></i>
            </a>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-bg-secondary text-xs text-text-light border-t border-border-color">
          ${noticia.pubDate ? new Date(noticia.pubDate).toLocaleDateString('pt-BR') : 'Data não disponível'}
        </div>
      </div>
    `;
    
    lista.appendChild(article);
  });
}

// Função para obter uma notícia aleatória para o pop-up
window.getRandomNews = function() {
  if (window.newsData.length === 0) {
    return {
      title: "Notícias não disponíveis",
      content: "Não foi possível carregar as notícias no momento.",
      category: "Informação",
      source: "Sistema",
      date: new Date().toISOString()
    };
  }
  
  const randomIndex = Math.floor(Math.random() * window.newsData.length);
  return window.newsData[randomIndex];
};