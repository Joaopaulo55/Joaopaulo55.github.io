const API_URL = 'https://backend-bdownload.onrender.com'; // ← substitua pela URL real (Render)

async function search() {
  const input = document.getElementById('searchInput').value.trim();
  if (!input) return alert('Digite algo para buscar.');

  const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(input)}`);
  const data = await res.json();

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (Array.isArray(data)) {
    data.forEach(item => {
      resultsDiv.innerHTML += `
        <div class="result-card">
          <h3>${item.title}</h3>
          <p>Duração: ${item.duration}s</p>
          <a href="${API_URL}/download/video?url=${item.url}" target="_blank">📺 Baixar Vídeo</a> |
          <a href="${API_URL}/download/audio?url=${item.url}" target="_blank">🎧 Baixar MP3</a>
        </div>
      `;
    });
  } else {
    const qualityOptions = data.qualities?.map(q =>
      `<option value="${q.format_id}">${q.resolution} - .${q.ext}</option>`).join('');

    resultsDiv.innerHTML = `
      <div class="result-card">
        <img src="${data.thumbnail}" alt="thumb" />
        <h3>${data.title}</h3>
        <p>Duração: ${data.duration}s</p>
        <a href="${API_URL}/download/audio?url=${data.url}" target="_blank">🎧 Baixar MP3</a><br><br>
        <select id="qualitySelect">${qualityOptions}</select>
        <button onclick="downloadVideo('${data.url}')">📥 Baixar Vídeo</button>
      </div>
    `;
  }
}

function downloadVideo(url) {
  const quality = document.getElementById('qualitySelect').value;
  window.open(`${API_URL}/download/video?url=${encodeURIComponent(url)}&quality=${quality}`, '_blank');
}

function directDownload() {
  const url = document.getElementById('directLink').value.trim();
  const format = document.getElementById('formatSelect').value;
  if (!url) return alert('Cole um link válido.');

  window.open(`${API_URL}/download/universal?url=${encodeURIComponent(url)}&format=${format}`, '_blank');
}
