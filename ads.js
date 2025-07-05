// ads.js - Sistema de Gerenciamento de Anúncios
window.adsData = {
  // Anúncios para pop-up (0-10)
  popupAds: [
    {
      id: 'popup-ad-1',
      title: "Oferta Especial",
      text: "Experimente nosso plano Premium por 30 dias grátis!",
      image: "https://via.placeholder.com/300x150?text=Oferta+Especial",
      link: "#premium",
      script: `
        <script type="text/javascript">
          atOptions = {
            'key' : 'c51cce0b55f7faae4519b11e915eb248',
            'format' : 'iframe',
            'height' : 300,
            'width' : 160,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/c51cce0b55f7faae4519b11e915eb248/invoke.js"></script>
      `
    },
    {
      id: 'popup-ad-2',
      title: "Novo App",
      text: "Baixe nosso aplicativo para downloads mais rápidos!",
      image: "https://via.placeholder.com/300x150?text=Baixe+Nosso+App",
      link: "#app-download",
      script: `
        <script type="text/javascript">
          atOptions = {
            'key' : 'f013eae7674151fbbb84d938311fe6c0',
            'format' : 'iframe',
            'height' : 600,
            'width' : 160,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/f013eae7674151fbbb84d938311fe6c0/invoke.js"></script>
      `
    }
  ],
  
  // Anúncios para posições estratégicas na página
  positionedAds: {
    'header-ad': {
      id: 'header-ad',
      description: "Anúncio no cabeçalho",
      script: `
        <script type='text/javascript' src='//pl26977578.profitableratecpm.com/02/a6/a6/02a6a6e4e579bd398f654d978ef5291b.js'></script>
      `,
      fallback: `<div class="ad-placeholder">Publicidade</div>`
    },
    'sidebar-ad': {
      id: 'sidebar-ad',
      description: "Anúncio na barra lateral",
      script: `
        <script type='text/javascript' src='//pl26978086.profitableratecpm.com/15/1a/45/151a4553ff8fbf13b995de13e8806b98.js'></script>
      `,
      fallback: `<div class="ad-placeholder">Publicidade</div>`
    },
    'footer-ad': {
      id: 'footer-ad',
      description: "Anúncio no rodapé",
      script: `
        <script type="text/javascript">
          atOptions = {
            'key' : 'cfe688e5fcfcf4c2d4e679f0241bdad6',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/cfe688e5fcfcf4c2d4e679f0241bdad6/invoke.js"></script>
      `,
      fallback: `<div class="ad-placeholder">Publicidade</div>`
    },
    'content-ad': {
      id: 'content-ad',
      description: "Anúncio no conteúdo principal",
      script: `
        <script async="async" data-cfasync="false" src="//pl26977029.profitableratecpm.com/d5bfe8059eb957380dc1fb6e5b16ff9c/invoke.js"></script>
        <div id="container-d5bfe8059eb957380dc1fb6e5b16ff9c"></div>
      `,
      fallback: `<div class="ad-placeholder">Publicidade</div>`
    }
  }
};

// Função para carregar anúncios em elementos específicos
window.loadAd = function(adId) {
  const adContainer = document.getElementById(adId);
  if (!adContainer) return;
  
  // Verifica se é um anúncio posicionado
  if (window.adsData.positionedAds[adId]) {
    const ad = window.adsData.positionedAds[adId];
    
    // Cria um elemento temporário para parsear o HTML
    const temp = document.createElement('div');
    temp.innerHTML = ad.script;
    
    // Adiciona ao container
    while (temp.firstChild) {
      adContainer.appendChild(temp.firstChild);
    }
    
    // Adiciona fallback caso o script falhe
    const fallbackTimeout = setTimeout(() => {
      if (adContainer.innerHTML.trim() === '') {
        adContainer.innerHTML = ad.fallback;
      }
    }, 3000);
    
    // Limpa o timeout se o anúncio carregar
    const observer = new MutationObserver(() => {
      if (adContainer.innerHTML.trim() !== '') {
        clearTimeout(fallbackTimeout);
        observer.disconnect();
      }
    });
    
    observer.observe(adContainer, { childList: true });
  }
};

// Função para obter um anúncio aleatório para pop-up
window.getRandomAd = function() {
  if (window.adsData.popupAds.length === 0) {
    return {
      title: "Anúncio",
      text: "Experimente nossos serviços!",
      image: "https://via.placeholder.com/300x150?text=Publicidade",
      link: "#"
    };
  }
  
  const randomIndex = Math.floor(Math.random() * window.adsData.popupAds.length);
  return window.adsData.popupAds[randomIndex];
};

// Carrega automaticamente os anúncios posicionados quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Carrega todos os anúncios posicionados
  Object.keys(window.adsData.positionedAds).forEach(adId => {
    window.loadAd(adId);
  });
  
  // Adiciona fallback global para pop-ups
  if (window.adsData.popupAds.length === 0) {
    window.adsData.popupAds.push({
      id: 'default-ad',
      title: "Nossos Serviços",
      text: "Conheça nossas soluções premium!",
      image: "https://via.placeholder.com/300x150?text=Publicidade",
      link: "#services"
    });
  }
});

// Função para adicionar novo anúncio (pode ser chamada de outros scripts)
window.addNewAd = function(type, adData) {
  if (type === 'popup') {
    window.adsData.popupAds.push({
      id: `popup-ad-${window.adsData.popupAds.length + 1}`,
      ...adData
    });
  } else if (type === 'positioned' && adData.id) {
    window.adsData.positionedAds[adData.id] = adData;
    window.loadAd(adData.id);
  } else {
    console.error('Tipo de anúncio inválido ou ID faltando');
  }
};