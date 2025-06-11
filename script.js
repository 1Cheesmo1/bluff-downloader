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
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.elements.themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  }

  toggleTheme() {
    const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    this.elements.themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
  }

  async analyzeVideo() {
    const url = this.elements.youtubeUrl.value.trim();
    if (!url) return this.showError("Please enter a YouTube URL");

    this.elements.analyzeBtn.disabled = true;
    this.elements.analyzeBtn.textContent = "Analyzing...";
    this.elements.resultPanel.style.display = "none";
    this.elements.progressSection.style.display = "none";

    try {
      const videoInfo = await this.getVideoInfo(url);
      this.displayVideoInfo(videoInfo);
      this.elements.resultPanel.style.display = "block";
    } catch (error) {
      this.showError("Failed to analyze video: " + error.message);
    } finally {
      this.elements.analyzeBtn.disabled = false;
      this.elements.analyzeBtn.textContent = "Analyze";
    }
  }

  async getVideoInfo(url) {
    const response = await fetch(`${this.API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Server error");
    }
    return await response.json();
  }

  displayVideoInfo(info) {
    const duration = new Date(info.duration * 1000).toISOString().substr(11, 8);
    this.elements.resultPanel.innerHTML = `
      <div class="video-info">
        <img src="${info.thumbnail}" alt="Video thumbnail">
        <div>
          <h3>${info.title}</h3>
          <p><strong>Duration:</strong> ${duration}</p>
        </div>
      </div>
      <div class="options-group">
        <div class="option">
          <label for="formatSelect">Format:</label>
          <select id="formatSelect">
            <option value="mp4">MP4 (Video)</option>
            <option value="mp3">MP3 (Audio)</option>
          </select>
        </div>
        <div class="option">
          <label for="qualitySelect">Quality:</label>
          <select id="qualitySelect">
            <!-- Options will be added by updateQualityOptions() -->
          </select>
        </div>
      </div>
      <button id="downloadBtn" class="download-btn">Start Download</button>
    `;
    // Re-add event listeners for the new elements
    document.getElementById("downloadBtn").addEventListener("click", () => this.startDownload());
    document.getElementById("formatSelect").addEventListener("change", () => this.updateQualityOptions());
    // Populate quality options for the first time
    this.updateQualityOptions();
  }

  // --- THIS FUNCTION IS NOW FIXED ---
  updateQualityOptions() {
    const format = document.getElementById("formatSelect").value;
    const qualitySelect = document.getElementById("qualitySelect");
    qualitySelect.innerHTML = ""; // Clear old options

    const qualities = format === "mp4"
      ? ["best", "1080p", "720p", "480p"]
      : ["best", "320k", "192k", "128k"];

    qualities.forEach((q) => {
      const option = document.createElement("option");
      option.value = q;
      option.textContent = q.replace('k', 'kbps'); // Make it look nice
      qualitySelect.appendChild(option);
    });
  }

  async startDownload() {
    const url = this.elements.youtubeUrl.value.trim();
    document.getElementById("downloadBtn").disabled = true;
    this.elements.progressSection.style.display = "block";
    this.resetProgress();

    try {
      const response = await fetch(`${this.API_BASE_URL}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          format: document.getElementById("formatSelect").value,
          quality: document.getElementById("qualitySelect").value,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const { downloadId } = await response.json();
      this.pollProgress(downloadId);
    } catch (error) {
      this.showError("Download failed: " + error.message);
      document.getElementById("downloadBtn").disabled = false;
      this.elements.progressSection.style.display = "none";
    }
  }

  pollProgress(downloadId) {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/progress/${downloadId}`);
        if (!response.ok) throw new Error("Progress check failed");
        const progress = await response.json();
        this.elements.progressText.textContent = progress.message;
        this.elements.progressFill.style.width = `${progress.progress}%`;

        if (progress.status === "completed") {
          clearInterval(pollInterval);
          this.showSuccess("Download complete!");
          if (progress.downloadUrl) {
            const link = `<a href="${progress.downloadUrl}" target="_blank" style="color: var(--primary-orange); font-weight: bold;">Open in Google Drive</a>`;
            this.elements.progressText.innerHTML = `${progress.message} ${link}`;
          }
        } else if (progress.status === "error") {
          throw new Error(progress.message);
        }
      } catch (error) {
        clearInterval(pollInterval);
        this.showError("Download failed: " + error.message);
        this.elements.progressSection.style.display = "none";
      }
    }, 1000);
  }

  resetProgress() {
    this.elements.progressFill.style.width = "0%";
    this.elements.progressText.textContent = "Preparing download...";
  }

  showError(message) { alert("Error: " + message); }
  showSuccess(message) { alert("Success: " + message); }
}

document.addEventListener("DOMContentLoaded", () => new YouTubeConverter());