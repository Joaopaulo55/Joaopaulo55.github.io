document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const videoUrlInput = document.getElementById('video-url');
    const searchBtn = document.getElementById('search-btn');
    const videoInfoSection = document.getElementById('video-info');
    const videoTitle = document.getElementById('video-title');
    const videoChannel = document.getElementById('video-channel');
    const videoDescription = document.getElementById('video-description');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoDuration = document.getElementById('video-duration');
    const videoQualitySelect = document.getElementById('video-quality');
    const audioQualitySelect = document.getElementById('audio-quality');
    const urlQualitySelect = document.getElementById('url-quality');
    const downloadVideoBtn = document.getElementById('download-video-btn');
    const downloadAudioBtn = document.getElementById('download-audio-btn');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const directUrlLink = document.getElementById('direct-url-link');
    const youtubeSearchQuery = document.getElementById('youtube-search-query');
    const youtubeSearchBtn = document.getElementById('youtube-search-btn');
    const youtubeResults = document.getElementById('youtube-results');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    const youtubeAuthBtn = document.getElementById('youtube-auth-btn');
    const mobileYoutubeAuthBtn = document.getElementById('mobile-youtube-auth-btn');
    const youtubeAuthModal = document.getElementById('youtube-auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const submitCookiesBtn = document.getElementById('submit-cookies-btn');
    const logoutYtBtn = document.getElementById('logout-yt-btn');
    const youtubeCookies = document.getElementById('youtube-cookies');
    const loadingModal = document.getElementById('loading-modal');
    const loadingText = document.getElementById('loading-text');
    const errorToast = document.getElementById('error-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastClose = document.querySelector('.toast-close');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const formatOptions = document.querySelectorAll('.format-options');
    
    // State variables
    let currentVideoInfo = null;
    let currentPageToken = '';
    let prevPageTokens = [];
    let currentPage = 1;
    let isYouTubeAuthenticated = false;
    
    // API Base URL
    const API_BASE_URL = 'https://backend-bdownload.onrender.com';
    
    // Initialize the app
    init();
    
    function init() {
        // Check if YouTube cookies exist
        checkYouTubeAuth();
        
        // Event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Video URL search
        searchBtn.addEventListener('click', handleVideoUrlSearch);
        videoUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleVideoUrlSearch();
        });
        
        // YouTube search
        youtubeSearchBtn.addEventListener('click', handleYouTubeSearch);
        youtubeSearchQuery.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleYouTubeSearch();
        });
        
        // Pagination
        prevPageBtn.addEventListener('click', goToPrevPage);
        nextPageBtn.addEventListener('click', goToNextPage);
        
        // Download buttons
        downloadVideoBtn.addEventListener('click', downloadVideo);
        downloadAudioBtn.addEventListener('click', downloadAudio);
        copyUrlBtn.addEventListener('click', copyDirectUrl);
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const format = this.dataset.format;
                switchFormatTab(format);
            });
        });
        
        // YouTube auth
        youtubeAuthBtn.addEventListener('click', showAuthModal);
        mobileYoutubeAuthBtn.addEventListener('click', showAuthModal);
        closeAuthModal.addEventListener('click', hideAuthModal);
        submitCookiesBtn.addEventListener('click', submitYouTubeCookies);
        logoutYtBtn.addEventListener('click', logoutYouTube);
        
        // Mobile menu
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.dataset.section;
                navigateToSection(section);
                if (this.classList.contains('mobile-nav-link')) {
                    toggleMobileMenu();
                }
            });
        });
        
        // Toast close
        toastClose.addEventListener('click', hideToast);
    }
    
    // Video URL Search Functionality
    async function handleVideoUrlSearch() {
        const url = videoUrlInput.value.trim();
        
        if (!url) {
            showError('Please enter a video URL');
            return;
        }
        
        try {
            showLoading('Analyzing video...');
            
            // Get video info
            const response = await fetch(`${API_BASE_URL}/api/video/info?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get video info');
            }
            
            const videoInfo = await response.json();
            currentVideoInfo = videoInfo;
            
            // Display video info
            displayVideoInfo(videoInfo);
            
            // Hide YouTube search section if visible
            document.getElementById('youtube-search').style.display = 'none';
            
            // Show video info section
            videoInfoSection.style.display = 'block';
            
            // Scroll to video info section
            videoInfoSection.scrollIntoView({ behavior: 'smooth' });
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error analyzing video:', error);
        }
    }
    
    function displayVideoInfo(videoInfo) {
        videoTitle.textContent = videoInfo.title;
        videoChannel.textContent = videoInfo.platform ? `From ${videoInfo.platform}` : '';
        videoDescription.textContent = videoInfo.description || 'No description available';
        
        // Set thumbnail
        if (videoInfo.thumbnails && videoInfo.thumbnails.length > 0) {
            // Find the highest resolution thumbnail
            const thumbnail = videoInfo.thumbnails.reduce((prev, current) => 
                (prev.width > current.width) ? prev : current
            );
            videoThumbnail.src = thumbnail.url;
        } else {
            videoThumbnail.src = 'https://via.placeholder.com/350x200?text=No+Thumbnail';
        }
        
        // Set duration
        if (videoInfo.duration) {
            const duration = formatDuration(videoInfo.duration);
            videoDuration.textContent = duration;
            videoDuration.style.display = 'block';
        } else {
            videoDuration.style.display = 'none';
        }
        
        // Populate quality options for video
        populateQualityOptions(videoInfo, 'video');
        
        // Populate quality options for direct URL
        populateQualityOptions(videoInfo, 'url');
    }
    
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return [
            hours ? hours.toString().padStart(2, '0') : null,
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].filter(Boolean).join(':');
    }
    
    function populateQualityOptions(videoInfo, type) {
        const selectElement = type === 'video' ? videoQualitySelect : urlQualitySelect;
        selectElement.innerHTML = '';
        
        if (!videoInfo.formats || videoInfo.formats.length === 0) {
            const option = document.createElement('option');
            option.value = 'best';
            option.textContent = 'Best Quality';
            selectElement.appendChild(option);
            return;
        }
        
        // Filter and sort formats
        let formats = [...videoInfo.formats];
        
        if (type === 'video') {
            // For video, we want video formats
            formats = formats.filter(f => f.ext === 'mp4' || f.ext === 'webm');
        } else {
            // For URL, we want all formats
            formats = formats.sort((a, b) => {
                // Sort by resolution if available
                if (a.resolution && b.resolution) {
                    return parseInt(b.resolution) - parseInt(a.resolution);
                }
                return 0;
            });
        }
        
        // Add best quality option
        const bestOption = document.createElement('option');
        bestOption.value = 'best';
        bestOption.textContent = 'Best Quality';
        selectElement.appendChild(bestOption);
        
        // Add other quality options
        formats.forEach(format => {
            if (format.filesize && format.filesize > 0) {
                const option = document.createElement('option');
                option.value = format.format_id;
                
                let label = '';
                if (format.resolution) label += format.resolution;
                if (format.fps) label += ` @ ${format.fps}fps`;
                if (format.filesize) label += ` (${formatFilesize(format.filesize)})`;
                
                option.textContent = label || `Format ${format.format_id}`;
                selectElement.appendChild(option);
            }
        });
    }
    
    function formatFilesize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    
    // Download Functions
    function downloadVideo() {
        if (!currentVideoInfo) return;
        
        const quality = videoQualitySelect.value;
        const url = currentVideoInfo.url || videoUrlInput.value;
        
        // Open download in new tab
        window.open(`${API_BASE_URL}/api/stream/video?url=${encodeURIComponent(url)}&quality=${quality}`, '_blank');
    }
    
    function downloadAudio() {
        if (!currentVideoInfo) return;
        
        const quality = audioQualitySelect.value;
        const url = currentVideoInfo.url || videoUrlInput.value;
        
        // Open download in new tab
        window.open(`${API_BASE_URL}/api/stream/audio?url=${encodeURIComponent(url)}&quality=${quality}`, '_blank');
    }
    
    async function getDirectUrl() {
        if (!currentVideoInfo) return null;
        
        const quality = urlQualitySelect.value;
        const url = currentVideoInfo.url || videoUrlInput.value;
        const type = quality === 'best' ? 'video' : 'audio';
        
        try {
            showLoading('Getting direct URL...');
            
            const response = await fetch(`${API_BASE_URL}/api/get-download-url?url=${encodeURIComponent(url)}&type=${type}&quality=${quality}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get direct URL');
            }
            
            const data = await response.json();
            hideLoading();
            return data.url;
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error getting direct URL:', error);
            return null;
        }
    }
    
    async function copyDirectUrl() {
        const url = await getDirectUrl();
        if (url) {
            navigator.clipboard.writeText(url)
                .then(() => {
                    showToast('URL copied to clipboard!');
                })
                .catch(err => {
                    showError('Failed to copy URL');
                    console.error('Failed to copy URL:', err);
                });
        }
    }
    
    // YouTube Search Functionality
    async function handleYouTubeSearch() {
        const query = youtubeSearchQuery.value.trim();
        
        if (!query) {
            showError('Please enter a search query');
            return;
        }
        
        try {
            showLoading('Searching YouTube...');
            
            // Reset pagination
            currentPageToken = '';
            prevPageTokens = [];
            currentPage = 1;
            
            // Perform search
            await performYouTubeSearch(query);
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error searching YouTube:', error);
        }
    }
    
    async function performYouTubeSearch(query, pageToken = '') {
        let url = `${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        
        const response = await fetch(url, {
            credentials: 'include' // Include cookies for authenticated requests
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to search YouTube');
        }
        
        const data = await response.json();
        
        // Display results
        displayYouTubeResults(data.results);
        
        // Update pagination
        currentPageToken = data.nextPageToken || '';
        pageInfo.textContent = `Page ${currentPage}`;
        
        // Enable/disable pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = !data.nextPageToken;
        
        // Show YouTube search section
        document.getElementById('youtube-search').style.display = 'block';
        
        // Scroll to YouTube search section
        document.getElementById('youtube-search').scrollIntoView({ behavior: 'smooth' });
        
        return data;
    }
    
    function displayYouTubeResults(videos) {
        youtubeResults.innerHTML = '';
        
        if (videos.length === 0) {
            youtubeResults.innerHTML = '<p class="no-results">No videos found</p>';
            return;
        }
        
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.innerHTML = `
                <div class="video-card-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <span class="video-card-duration">${video.duration || ''}</span>
                </div>
                <div class="video-card-info">
                    <h4 class="video-card-title">${video.title}</h4>
                    <p class="video-card-channel">${video.channel}</p>
                </div>
            `;
            
            videoCard.addEventListener('click', () => {
                videoUrlInput.value = video.link;
                handleVideoUrlSearch();
            });
            
            youtubeResults.appendChild(videoCard);
        });
    }
    
    async function goToNextPage() {
        if (!currentPageToken) return;
        
        try {
            showLoading('Loading next page...');
            
            // Push current page token to history
            prevPageTokens.push(currentPageToken);
            currentPage++;
            
            const query = youtubeSearchQuery.value.trim();
            await performYouTubeSearch(query, currentPageToken);
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error loading next page:', error);
        }
    }
    
    async function goToPrevPage() {
        if (prevPageTokens.length === 0) return;
        
        try {
            showLoading('Loading previous page...');
            
            // Pop the last token from history
            const prevToken = prevPageTokens.pop();
            currentPage--;
            
            const query = youtubeSearchQuery.value.trim();
            await performYouTubeSearch(query, prevToken);
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error loading previous page:', error);
        }
    }
    
    // YouTube Authentication Functions
    function checkYouTubeAuth() {
        // In a real app, you would check for the cookie
        // For demo purposes, we'll just check localStorage
        const ytAuth = localStorage.getItem('ytAuth');
        isYouTubeAuthenticated = !!ytAuth;
        
        if (isYouTubeAuthenticated) {
            youtubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Logout';
            mobileYoutubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Logout';
        } else {
            youtubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Login';
            mobileYoutubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Login';
        }
    }
    
    function showAuthModal() {
        if (isYouTubeAuthenticated) {
            logoutYouTube();
            return;
        }
        
        youtubeAuthModal.classList.add('show');
    }
    
    function hideAuthModal() {
        youtubeAuthModal.classList.remove('show');
    }
    
    async function submitYouTubeCookies() {
        const cookies = youtubeCookies.value.trim();
        
        if (!cookies) {
            showError('Please enter YouTube cookies');
            return;
        }
        
        try {
            showLoading('Authenticating with YouTube...');
            
            const response = await fetch(`${API_BASE_URL}/api/youtube/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cookies }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to authenticate');
            }
            
            const data = await response.json();
            
            // Store auth state
            localStorage.setItem('ytAuth', 'true');
            isYouTubeAuthenticated = true;
            youtubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Logout';
            mobileYoutubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Logout';
            
            hideAuthModal();
            hideLoading();
            showToast('YouTube authentication successful!');
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error authenticating with YouTube:', error);
        }
    }
    
    async function logoutYouTube() {
        try {
            showLoading('Logging out from YouTube...');
            
            const response = await fetch(`${API_BASE_URL}/api/youtube/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to logout');
            }
            
            // Clear auth state
            localStorage.removeItem('ytAuth');
            isYouTubeAuthenticated = false;
            youtubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Login';
            mobileYoutubeAuthBtn.innerHTML = '<i class="fab fa-youtube"></i> YouTube Login';
            
            hideLoading();
            showToast('Logged out from YouTube');
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error logging out from YouTube:', error);
        }
    }
    
    // Tab Switching
    function switchFormatTab(format) {
        // Update active tab
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.format === format) {
                btn.classList.add('active');
            }
        });
        
        // Show corresponding format options
        formatOptions.forEach(options => {
            options.style.display = 'none';
            if (options.id === `${format}-format-options`) {
                options.style.display = 'block';
            }
        });
        
        // If URL tab is selected, update the direct URL link
        if (format === 'url') {
            updateDirectUrlLink();
        }
    }
    
    async function updateDirectUrlLink() {
        const url = await getDirectUrl();
        if (url) {
            directUrlLink.href = url;
        } else {
            directUrlLink.removeAttribute('href');
        }
    }
    
    // Mobile Menu
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('show');
    }
    
    // Navigation
    function navigateToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === sectionId) {
                    link.classList.add('active');
                }
            });
        }
    }
    
    // UI Helpers
    function showLoading(message) {
        loadingText.textContent = message;
        loadingModal.classList.add('show');
    }
    
    function hideLoading() {
        loadingModal.classList.remove('show');
    }
    
    function showError(message) {
        toastMessage.textContent = message;
        errorToast.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(hideToast, 5000);
    }
    
    function showToast(message) {
        toastMessage.textContent = message;
        errorToast.style.backgroundColor = var('--success-color');
        errorToast.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            errorToast.classList.remove('show');
            // Reset to error color
            setTimeout(() => {
                errorToast.style.backgroundColor = var('--error-color');
            }, 300);
        }, 3000);
    }
    
    function hideToast() {
        errorToast.classList.remove('show');
    }
    
    // Initialize direct URL link if URL tab is active by default
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.dataset.format === 'url') {
        updateDirectUrlLink();
    }
});