class YouTubeConverter {
  constructor() {
    this.API_BASE_URL = "/api";
    this.initializeElements();
    this.initializeEventListeners();
    this.initializeTheme();
  }

  initializeElements() {
    this.elements = {
      themeToggle: document.getElementById("themeToggle"),
      themeIcon: document.getElementById("themeIcon"),
      youtubeUrl: document.getElementById("youtubeUrl"),
      analyzeBtn: document.getElementById("analyzeBtn"),
      resultPanel: document.getElementById("result-panel"),
      progressSection: document.getElementById("progressSection"),
      progressFill: document.getElementById("progressFill"),
      progressText: document.getElementById("progressText"),
    };
  }

  initializeEventListeners() {
    this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.elements.analyzeBtn.addEventListener("click", () => this.analyzeVideo());
    this.elements.youtubeUrl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.analyzeVideo();
    });
  }

  initializeTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    // Fixed icon logic - sun for dark mode, moon for light mode
    this.elements.themeIcon.src = theme === 'dark' ? '/sun.png' : '/moon.png';
  }

  toggleTheme() {
    const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    // Fixed icon logic - sun for dark mode, moon for light mode
    this.elements.themeIcon.src = newTheme === 'dark' ? '/sun.png' : '/moon.png';
  }

  async analyzeVideo() {
    const url = this.elements.youtubeUrl.value.trim();
    if (!url) {
      alert("Please enter a YouTube URL");
      return;
    }

    this.setLoading(true);

    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      this.displayVideoInfo(data);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  displayVideoInfo(videoInfo) {
    // Clear previous results
    this.elements.resultPanel.innerHTML = "";
    this.elements.resultPanel.style.display = "block";

    // Create video info section
    const videoInfoElement = document.createElement("div");
    videoInfoElement.className = "video-info";
    videoInfoElement.innerHTML = `
      <img src="${videoInfo.thumbnail}" alt="Video thumbnail" />
      <div>
        <h3>${videoInfo.title}</h3>
        <p>Duration: ${videoInfo.duration}</p>
      </div>
    `;

    // Create options section
    const optionsGroup = document.createElement("div");
    optionsGroup.className = "options-group";
    
    // Format selection
    const formatOption = document.createElement("div");
    formatOption.className = "option";
    formatOption.innerHTML = `
      <label for="format">Format:</label>
      <select id="format" name="format">
        <option value="video">Video (mp4)</option>
        <option value="audio">Audio only (mp3)</option>
      </select>
    `;
    
    // Quality selection
    const qualityOption = document.createElement("div");
    qualityOption.className = "option";
    qualityOption.innerHTML = `
      <label for="quality">Quality:</label>
      <select id="quality" name="quality">
        <option value="highest">Best Quality</option>
        <option value="medium">Medium Quality</option>
        <option value="lowest">Low Quality</option>
      </select>
    `;
    
    optionsGroup.appendChild(formatOption);
    optionsGroup.appendChild(qualityOption);

    // Create download button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "download-btn";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", () => this.downloadVideo());

    // Add everything to the result panel
    this.elements.resultPanel.appendChild(videoInfoElement);
    this.elements.resultPanel.appendChild(optionsGroup);
    this.elements.resultPanel.appendChild(downloadBtn);
  }

  async downloadVideo() {
    const format = document.getElementById("format").value;
    const quality = document.getElementById("quality").value;
    const url = this.elements.youtubeUrl.value;

    this.elements.progressSection.style.display = "block";
    this.updateProgress(0, "Starting download...");

    try {
      const response = await fetch(`${this.API_BASE_URL}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, quality }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const { downloadId } = await response.json();
      this.pollProgress(downloadId);
    } catch (error) {
      this.showError(error.message);
    }
  }

  async pollProgress(downloadId) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/progress/${downloadId}`);
        if (!response.ok) {
          clearInterval(interval);
          throw new Error(`Server responded with ${response.status}`);
        }

        const progress = await response.json();
        this.updateProgress(progress.progress, progress.message);

        if (progress.status === "complete") {
          clearInterval(interval);
          window.location.href = progress.downloadUrl;
        } else if (progress.status === "error") {
          clearInterval(interval);
          this.showError(progress.message);
        }
      } catch (error) {
        clearInterval(interval);
        this.showError(error.message);
      }
    }, 1000);
  }

  updateProgress(percent, message) {
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressText.textContent = message;
  }

  setLoading(isLoading) {
    this.elements.analyzeBtn.disabled = isLoading;
    this.elements.analyzeBtn.textContent = isLoading ? "Working..." : "Analyze";
  }

  showError(message) {
    this.elements.resultPanel.innerHTML = `<div class="error-message">Error: ${message}</div>`;
    this.elements.resultPanel.style.display = "block";
    this.elements.progressSection.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => new YouTubeConverter());