const API_KEY = 'pub_78c798a7fdd24d4ea4910fc1a264f469';

document.addEventListener('DOMContentLoaded', async () => {
  const listaNoticias = document.getElementById('lista-noticias');
  
  try {
    // Mostrar estado de carregamento
    listaNoticias.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-8">
        <i class="fas fa-spinner fa-spin text-primary-color text-2xl mr-2"></i>
        <span class="text-text-color">Carregando notícias...</span>
      </div>
    `;

    // Obter localização com fallback
    let local;
    try {
      const res = await fetch('https://ipapi.co/json/');
      local = await res.json();
    } catch (error) {
      console.error('Erro ao obter localização, usando fallback:', error);
      local = { country_code: 'br' }; // Fallback para Brasil
    }

    // Obter notícias
    const country = local.country_code.toLowerCase();
    const noticias = await getNoticias(country);
    
    // Exibir notícias ou mensagem se vazio
    if (noticias && noticias.length > 0) {
      mostrarNoticias(noticias);
    } else {
      listaNoticias.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-newspaper text-4xl text-text-light mb-2"></i>
          <p class="text-text-light">Nenhuma notícia encontrada para sua região</p>
          <button onclick="window.location.reload()" 
                  class="mt-4 px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-blue-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    listaNoticias.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="fas fa-exclamation-triangle text-4xl text-accent-color mb-2"></i>
        <p class="text-text-color">Erro ao carregar notícias</p>
        <button onclick="window.location.reload()" 
                class="mt-4 px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-blue-600 transition-colors">
          Tentar novamente
        </button>
      </div>
    `;
  }
});

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

function mostrarNoticias(noticias) {
  const lista = document.getElementById('lista-noticias');
  lista.innerHTML = '';

  // Limitar a 6 notícias para melhor layout
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