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
    // UPDATED: Paths are now lowercase
    this.elements.themeIcon.src = theme === 'dark' ? '/moon.png' : '/sun.png';
  }

  toggleTheme() {
    const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    // UPDATED: Paths are now lowercase
    this.elements.themeIcon.src = newTheme === 'dark' ? '/moon.png' : '/sun.png';
  }

  // ... (The rest of the file is exactly the same) ...
}

document.addEventListener("DOMContentLoaded", () => new YouTubeConverter());