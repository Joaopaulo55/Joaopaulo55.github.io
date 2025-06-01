const GNEWS_API_KEY = 'e369a3da23c10e9a8a77c8a59f33fd1d'; 

  async function getLocation() {
    const res = await fetch('https://ipapi.co/json/');
    return res.json();
  }

  async function getNoticiasPorPais(pais) {
    const res = await fetch(`https://gnews.io/api/v4/top-headlines?lang=pt&country=${pais}&token=${GNEWS_API_KEY}`);
    const data = await res.json();
    return data.articles;
  }

 function mostrarNoticias(noticias) {
  const lista = document.getElementById('lista-noticias');
  lista.innerHTML = '';
  
  noticias.forEach(noticia => {
    const article = document.createElement('article');
    article.className = 'bg-card-color rounded-lg overflow-hidden shadow-md border border-border-color hover:shadow-lg transition-shadow duration-300';
    article.innerHTML = `
      <div class="h-full flex flex-col">
        <img src="${noticia.image || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}" 
             alt="${noticia.title}" 
             class="w-full h-48 object-cover">
        <div class="p-4 flex-grow">
          <h3 class="text-lg font-semibold mb-2 text-text-color">
            <a href="${noticia.url}" target="_blank" class="hover:text-primary-color transition-colors duration-200">
              ${noticia.title}
            </a>
          </h3>
          <p class="text-text-light mb-4">${noticia.description || 'Sem descrição disponível.'}</p>
          <div class="mt-auto">
            <a href="${noticia.url}" target="_blank" 
               class="text-primary-color hover:text-secondary-color font-medium inline-flex items-center gap-1 transition-colors duration-200">
              Ler mais <i class="fas fa-external-link-alt text-xs"></i>
            </a>
          </div>
        </div>
        <div class="px-4 py-3 bg-bg-secondary text-xs text-text-light border-t border-border-color">
          ${new Date(noticia.publishedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
    `;
    lista.appendChild(article);
  });
}


  async function iniciar() {
    const local = await getLocation();
    const pais = local.country_code.toLowerCase(); // ex: 'br', 'ao'
    const noticias = await getNoticiasPorPais(pais);
    mostrarNoticias(noticias);
  }

  iniciar();



