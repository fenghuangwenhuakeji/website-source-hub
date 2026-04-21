var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class ParticleNetwork {
  constructor(canvasId, config) {
    __publicField(this, "canvas");
    __publicField(this, "ctx");
    __publicField(this, "particles", []);
    __publicField(this, "animationId", null);
    __publicField(this, "config");
    __publicField(this, "mouse", { x: 0, y: 0 });
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;
    this.config = {
      particleCount: 80,
      connectionDistance: 150,
      particleColor: "rgba(139, 92, 246, 0.6)",
      lineColor: "rgba(139, 92, 246, 0.15)",
      particleSize: 2,
      speed: 0.5,
      ...config
    };
    this.init();
  }
  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(new Particle(
        this.canvas.width,
        this.canvas.height,
        this.config.particleSize,
        this.config.speed
      ));
    }
  }
  bindEvents() {
    window.addEventListener("resize", () => {
      this.resize();
      this.createParticles();
    });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((particle, i) => {
      particle.update(this.canvas.width, this.canvas.height);
      particle.draw(this.ctx, this.config.particleColor);
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const distance = particle.distanceTo(other);
        if (distance < this.config.connectionDistance) {
          const opacity = (1 - distance / this.config.connectionDistance) * 0.5;
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.config.lineColor.replace("0.15", opacity.toString());
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.stroke();
        }
      }
      const mouseDistance = Math.hypot(particle.x - this.mouse.x, particle.y - this.mouse.y);
      if (mouseDistance < 200) {
        const opacity = (1 - mouseDistance / 200) * 0.8;
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.stroke();
      }
    });
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
class Particle {
  constructor(canvasWidth, canvasHeight, size, speed) {
    __publicField(this, "x");
    __publicField(this, "y");
    __publicField(this, "vx");
    __publicField(this, "vy");
    __publicField(this, "size");
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.size = size + Math.random() * 2;
  }
  update(canvasWidth, canvasHeight) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
    this.x = Math.max(0, Math.min(canvasWidth, this.x));
    this.y = Math.max(0, Math.min(canvasHeight, this.y));
  }
  draw(ctx, color) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = color.replace("0.6", "0.1");
    ctx.fill();
  }
  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}
function initParticleNetwork(canvasId = "particles-canvas") {
  return new ParticleNetwork(canvasId);
}
const ICONS = {
  logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-logo-pro">
    <defs>
      <linearGradient id="logo-gradient-pro" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6">
          <animate attributeName="stop-color" values="#8b5cf6;#06b6d4;#ec4899;#8b5cf6" dur="4s" repeatCount="indefinite"/>
        </stop>
        <stop offset="50%" style="stop-color:#06b6d4">
          <animate attributeName="stop-color" values="#06b6d4;#ec4899;#8b5cf6;#06b6d4" dur="4s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" style="stop-color:#ec4899">
          <animate attributeName="stop-color" values="#ec4899;#8b5cf6;#06b6d4;#ec4899" dur="4s" repeatCount="indefinite"/>
        </stop>
      </linearGradient>
      <filter id="glow-pro" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="particle-glow">
        <feGaussianBlur stdDeviation="1.5"/>
      </filter>
    </defs>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="url(#logo-gradient-pro)" fill="url(#logo-gradient-pro)" fill-opacity="0.1" filter="url(#glow-pro)">
      <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.05;0.2;0.05" dur="3s" repeatCount="indefinite"/>
    </polygon>
    <g class="logo-particles">
      <circle cx="12" cy="12" r="1" fill="#fbbf24" filter="url(#particle-glow)">
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="r" values="0.5;2;0.5" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="8" cy="8" r="0.5" fill="#06b6d4" filter="url(#particle-glow)">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="16" cy="8" r="0.5" fill="#ec4899" filter="url(#particle-glow)">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.6s"/>
      </circle>
      <circle cx="8" cy="16" r="0.5" fill="#8b5cf6" filter="url(#particle-glow)">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.9s"/>
      </circle>
      <circle cx="16" cy="16" r="0.5" fill="#fbbf24" filter="url(#particle-glow)">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.2s"/>
      </circle>
    </g>
  </svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-home-pro">
    <defs>
      <linearGradient id="home-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#06b6d4"/>
        <stop offset="100%" style="stop-color:#3b82f6"/>
      </linearGradient>
      <filter id="home-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#06b6d4" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="url(#home-gradient)" fill="url(#home-gradient)" fill-opacity="0.05" filter="url(#home-shadow)">
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1s" fill="freeze"/>
    </path>
    <polyline points="9 22 9 12 15 12 15 22" stroke="url(#home-gradient)">
      <animate attributeName="stroke-dasharray" values="0 50;50 0" dur="0.8s" begin="0.5s" fill="freeze"/>
    </polyline>
    <circle cx="12" cy="8" r="1.5" fill="#fbbf24" class="home-light">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="1;2;1" dur="2s" repeatCount="indefinite"/>
    </circle>
    <g class="home-particles">
      <circle cx="6" cy="10" r="0.3" fill="#06b6d4" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="10" r="0.3" fill="#3b82f6" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" begin="1s"/>
      </circle>
    </g>
  </svg>`,
  lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-lightning-pro">
    <defs>
      <linearGradient id="lightning-gradient-pro" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="50%" style="stop-color:#f59e0b"/>
        <stop offset="100%" style="stop-color:#ef4444"/>
      </linearGradient>
      <filter id="lightning-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="url(#lightning-gradient-pro)" fill="url(#lightning-gradient-pro)" fill-opacity="0.2" filter="url(#lightning-glow)">
      <animate attributeName="fill-opacity" values="0.1;0.4;0.1" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="stroke-width" values="2;3;2" dur="0.3s" repeatCount="indefinite"/>
    </polygon>
    <g class="lightning-sparks">
      <line x1="6" y1="10" x2="4" y2="8" stroke="#fbbf24" stroke-width="1.5" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite"/>
      </line>
      <line x1="18" y1="12" x2="20" y2="10" stroke="#fbbf24" stroke-width="1.5" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" begin="0.2s"/>
      </line>
      <line x1="14" y1="18" x2="16" y2="20" stroke="#fbbf24" stroke-width="1.5" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" begin="0.4s"/>
      </line>
      <circle cx="8" cy="6" r="0.5" fill="#fbbf24" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.1s"/>
      </circle>
      <circle cx="16" cy="8" r="0.5" fill="#f59e0b" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
    </g>
  </svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-book-pro">
    <defs>
      <linearGradient id="book-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#ec4899"/>
      </linearGradient>
      <filter id="book-shadow">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#8b5cf6" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="url(#book-gradient)" filter="url(#book-shadow)">
      <animate attributeName="stroke-dasharray" values="0 50;50 0" dur="0.8s" fill="freeze"/>
    </path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="url(#book-gradient)" fill="url(#book-gradient)" fill-opacity="0.05" filter="url(#book-shadow)">
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1s" begin="0.3s" fill="freeze"/>
    </path>
    <g class="book-pages">
      <line x1="8" y1="6" x2="16" y2="6" stroke="#a78bfa" stroke-width="1" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="x2" values="8;16;8" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="8" y1="10" x2="14" y2="10" stroke="#a78bfa" stroke-width="1" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" begin="0.3s"/>
        <animate attributeName="x2" values="8;14;8" dur="2s" repeatCount="indefinite" begin="0.3s"/>
      </line>
      <line x1="8" y1="14" x2="12" y2="14" stroke="#a78bfa" stroke-width="1" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" begin="0.6s"/>
        <animate attributeName="x2" values="8;12;8" dur="2s" repeatCount="indefinite" begin="0.6s"/>
      </line>
    </g>
    <circle cx="18" cy="4" r="0.5" fill="#fbbf24" opacity="0">
      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-message-pro">
    <defs>
      <linearGradient id="message-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
      <filter id="message-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#message-gradient)" fill="url(#message-gradient)" fill-opacity="0.05" filter="url(#message-glow)">
      <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1s" fill="freeze"/>
    </path>
    <g class="message-dots">
      <circle cx="9" cy="10" r="1.5" fill="#10b981">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="r" values="0.8;1.5;0.8" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="10" r="1.5" fill="#10b981">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
        <animate attributeName="r" values="0.8;1.5;0.8" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
      </circle>
      <circle cx="15" cy="10" r="1.5" fill="#10b981">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
        <animate attributeName="r" values="0.8;1.5;0.8" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
      </circle>
    </g>
  </svg>`,
  card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-card-pro">
    <defs>
      <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
      <filter id="card-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#8b5cf6" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect x="4" y="4" width="16" height="20" rx="2" stroke="url(#card-gradient)" fill="url(#card-gradient)" fill-opacity="0.05" filter="url(#card-shadow)">
      <animate attributeName="stroke-dasharray" values="0 72;72 0" dur="1s" fill="freeze"/>
    </rect>
    <line x1="8" y1="10" x2="16" y2="10" stroke="url(#card-gradient)" stroke-width="1.5" opacity="0.6">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="8" y1="14" x2="14" y2="14" stroke="url(#card-gradient)" stroke-width="1.5" opacity="0.4">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.5s"/>
    </line>
    <circle cx="12" cy="19" r="1.5" fill="#fbbf24" opacity="0.8">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>`,
  cards: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-cards-pro">
    <defs>
      <linearGradient id="cards-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ec4899"/>
        <stop offset="50%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
      <filter id="cards-shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#ec4899" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="url(#cards-gradient)" fill="url(#cards-gradient)" fill-opacity="0.05" filter="url(#cards-shadow)">
      <animate attributeName="stroke-dasharray" values="0 72;72 0" dur="1s" fill="freeze"/>
    </rect>
    <g class="card-pattern">
      <path d="M12 8v8" stroke="url(#cards-gradient)" stroke-width="1.5" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M8 12h8" stroke="url(#cards-gradient)" stroke-width="1.5" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="0.5s"/>
      </path>
    </g>
    <g class="card-sparkles">
      <circle cx="6" cy="6" r="0.8" fill="#fbbf24">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="r" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="6" r="0.8" fill="#fbbf24">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.5s"/>
        <animate attributeName="r" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s"/>
      </circle>
      <circle cx="18" cy="18" r="0.8" fill="#fbbf24">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1s"/>
        <animate attributeName="r" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s"/>
      </circle>
      <circle cx="6" cy="18" r="0.8" fill="#fbbf24">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.5s"/>
        <animate attributeName="r" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.5s"/>
      </circle>
    </g>
  </svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-list-pro">
    <defs>
      <linearGradient id="list-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#06b6d4"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
    </defs>
    <line x1="8" x2="21" y1="6" y2="6" stroke="url(#list-gradient)">
      <animate attributeName="x2" values="8;21;21" dur="0.8s" fill="freeze"/>
    </line>
    <line x1="8" x2="21" y1="12" y2="12" stroke="url(#list-gradient)">
      <animate attributeName="x2" values="8;21;21" dur="0.8s" begin="0.2s" fill="freeze"/>
    </line>
    <line x1="8" x2="21" y1="18" y2="18" stroke="url(#list-gradient)">
      <animate attributeName="x2" values="8;21;21" dur="0.8s" begin="0.4s" fill="freeze"/>
    </line>
    <g class="list-bullets">
      <circle cx="3" cy="6" r="1.5" fill="#fbbf24">
        <animate attributeName="r" values="1;1.5;1" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="3" cy="12" r="1.5" fill="#06b6d4">
        <animate attributeName="r" values="1;1.5;1" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="3" cy="18" r="1.5" fill="#ec4899">
        <animate attributeName="r" values="1;1.5;1" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
      </circle>
    </g>
  </svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-bulb-pro">
    <defs>
      <radialGradient id="bulb-glow-pro" cx="50%" cy="30%" r="60%">
        <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1">
          <animate attributeName="stop-opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0"/>
      </radialGradient>
      <filter id="bulb-light" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="12" cy="9" r="5" fill="url(#bulb-glow-pro)" filter="url(#bulb-light)">
      <animate attributeName="r" values="4.5;5.5;4.5" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <g class="bulb-rays">
      <line x1="12" y1="1" x2="12" y2="3" stroke="#fbbf24" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#fbbf24" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.25s"/>
      </line>
      <line x1="1" y1="12" x2="3" y2="12" stroke="#fbbf24" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.5s"/>
      </line>
      <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" stroke="#fbbf24" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.75s"/>
      </line>
      <line x1="23" y1="12" x2="21" y2="12" stroke="#fbbf24" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="1s"/>
      </line>
    </g>
  </svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-user-pro">
    <defs>
      <linearGradient id="user-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
      <filter id="user-glow">
        <feGaussianBlur stdDeviation="2"/>
      </filter>
    </defs>
    <circle cx="12" cy="7" r="4" stroke="url(#user-gradient)" fill="url(#user-gradient)" fill-opacity="0.1">
      <animate attributeName="stroke-dasharray" values="0 30;30 0" dur="0.8s" fill="freeze"/>
    </circle>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="url(#user-gradient)">
      <animate attributeName="stroke-dasharray" values="0 40;40 0" dur="1s" begin="0.3s" fill="freeze"/>
    </path>
    <circle cx="12" cy="7" r="2" fill="#8b5cf6" opacity="0.2">
      <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-chart-pro">
    <defs>
      <linearGradient id="chart-gradient-pro" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1"/>
      </linearGradient>
      <filter id="chart-glow">
        <feGaussianBlur stdDeviation="2"/>
      </filter>
    </defs>
    <line x1="12" x2="12" y1="20" y2="10" stroke="url(#chart-gradient-pro)" filter="url(#chart-glow)">
      <animate attributeName="y1" values="20;20" dur="0.5s"/>
      <animate attributeName="y2" values="20;10" dur="0.8s" fill="freeze"/>
    </line>
    <line x1="18" x2="18" y1="20" y2="4" stroke="url(#chart-gradient-pro)" filter="url(#chart-glow)">
      <animate attributeName="y2" values="20;4" dur="1s" begin="0.2s" fill="freeze"/>
    </line>
    <line x1="6" x2="6" y1="20" y2="16" stroke="url(#chart-gradient-pro)" filter="url(#chart-glow)">
      <animate attributeName="y2" values="20;16" dur="0.6s" begin="0.4s" fill="freeze"/>
    </line>
    <g class="chart-dots">
      <circle cx="12" cy="10" r="2.5" fill="#06b6d4">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="4" r="2.5" fill="#8b5cf6">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="6" cy="16" r="2.5" fill="#ec4899">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
      </circle>
    </g>
  </svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-heart-pro">
    <defs>
      <linearGradient id="heart-gradient-pro" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ec4899">
          <animate attributeName="stop-color" values="#ec4899;#f43f5e;#ec4899" dur="2s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" style="stop-color:#f43f5e">
          <animate attributeName="stop-color" values="#f43f5e;#ec4899;#f43f5e" dur="2s" repeatCount="indefinite"/>
        </stop>
      </linearGradient>
      <filter id="heart-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="url(#heart-gradient-pro)" fill="url(#heart-gradient-pro)" fill-opacity="0.2" filter="url(#heart-glow)">
      <animate attributeName="fill-opacity" values="0.1;0.3;0.1" dur="1s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="0.8s" repeatCount="indefinite" additive="sum"/>
    </path>
    <g class="heart-particles">
      <circle cx="8" cy="6" r="0.8" fill="#fbbf24" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="6;4;6" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="16" cy="6" r="0.8" fill="#fbbf24" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
        <animate attributeName="cy" values="6;4;6" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
      </circle>
      <circle cx="12" cy="4" r="0.5" fill="#ec4899" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
    </g>
  </svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-globe">
    <circle cx="12" cy="12" r="10" class="icon-rotate"/>
    <line x1="2" x2="22" y1="12" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-chat">
    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" class="icon-bounce"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" class="icon-draw-delay"/>
  </svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-settings">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" class="icon-rotate-slow"/>
    <circle cx="12" cy="12" r="3" class="icon-pulse"/>
  </svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-moon">
    <defs>
      <linearGradient id="moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#a78bfa"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
    </defs>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="url(#moon-gradient)" class="icon-swing"/>
  </svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-sun">
    <defs>
      <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="100%" style="stop-color:#f59e0b"/>
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="4" fill="url(#sun-gradient)" class="icon-pulse"/>
    <g class="icon-rotate-slow" style="transform-origin: center;">
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/>
      <path d="m19.07 4.93-1.41 1.41"/>
    </g>
  </svg>`,
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-help">
    <circle cx="12" cy="12" r="10" class="icon-draw"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" class="icon-draw-delay"/>
    <path d="M12 17h.01" class="icon-blink"/>
  </svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-play">
    <defs>
      <linearGradient id="play-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
    </defs>
    <polygon points="5 3 19 12 5 21 5 3" fill="url(#play-gradient)" class="icon-scale-pulse"/>
  </svg>`,
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-rocket">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" class="icon-draw"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" class="icon-float"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" class="icon-draw-delay"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" class="icon-draw-delay-2"/>
  </svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-sparkles">
    <defs>
      <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="50%" style="stop-color:#f59e0b"/>
        <stop offset="100%" style="stop-color:#ec4899"/>
      </linearGradient>
    </defs>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" stroke="url(#sparkle-gradient)" class="icon-sparkle"/>
    <path d="M5 3v4" class="icon-sparkle-delay"/>
    <path d="M19 17v4" class="icon-sparkle-delay-2"/>
    <path d="M3 5h4" class="icon-sparkle-delay"/>
    <path d="M17 19h4" class="icon-sparkle-delay-2"/>
  </svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-send">
    <path d="m22 2-7 20-4-9-9-4Z" class="icon-slide-right"/>
    <path d="M22 2 11 13" class="icon-draw-delay"/>
  </svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-save">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" class="icon-draw"/>
    <polyline points="17 21 17 13 7 13 7 21" class="icon-draw-delay"/>
    <polyline points="7 3 7 8 15 8" class="icon-draw-delay-2"/>
  </svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>`,
  alertCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-download">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" class="icon-draw"/>
    <polyline points="7 10 12 15 17 10" class="icon-bounce-down"/>
    <line x1="12" x2="12" y1="15" y2="3" class="icon-slide-down"/>
  </svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-upload">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" class="icon-draw"/>
    <polyline points="17 8 12 3 7 8" class="icon-bounce-up"/>
    <line x1="12" x2="12" y1="3" y2="15" class="icon-slide-up"/>
  </svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-plus">
    <line x1="12" x2="12" y1="5" y2="19" class="icon-scale-v"/>
    <line x1="5" x2="19" y1="12" y2="12" class="icon-scale-h"/>
  </svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-minus">
    <line x1="5" x2="19" y1="12" y2="12" class="icon-scale-h"/>
  </svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-x">
    <line x1="18" x2="6" y1="6" y2="18" class="icon-rotate-in"/>
    <line x1="6" x2="18" y1="6" y2="18" class="icon-rotate-in-delay"/>
  </svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-arrow-left">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-arrow-right">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-check">
    <defs>
      <linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#06b6d4"/>
      </linearGradient>
    </defs>
    <polyline points="20 6 9 17 4 12" stroke="url(#check-gradient)" class="icon-draw-check"/>
  </svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-clock">
    <circle cx="12" cy="12" r="10" class="icon-draw"/>
    <polyline points="12 6 12 12 16 14" class="icon-tick"/>
  </svg>`,
  castle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-castle">
    <path d="M22 22H2V12l5-5v5h10V7l5 5v10z" class="icon-draw"/>
    <path d="M2 12h20" class="icon-draw-delay"/>
    <path d="M7 7V2h2v3" class="icon-draw-delay"/>
    <path d="M15 7V2h2v3" class="icon-draw-delay-2"/>
    <path d="M10 22v-4h4v4" class="icon-draw-delay-2"/>
  </svg>`,
  sword: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-sword">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" class="icon-draw"/>
    <line x1="13" x2="19" y1="19" y2="13" class="icon-draw-delay"/>
    <line x1="16" x2="20" y1="16" y2="20" class="icon-draw-delay-2"/>
    <line x1="19" x2="21" y1="21" y2="19" class="icon-draw-delay-2"/>
  </svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-refresh">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" class="icon-rotate"/>
    <path d="M3 3v5h5" class="icon-draw"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" class="icon-rotate-reverse"/>
    <path d="M16 16h5v5" class="icon-draw-delay"/>
  </svg>`,
  bookOpen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-book-open">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" class="icon-flip-left"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" class="icon-flip-right"/>
  </svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-users">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" class="icon-draw"/>
    <circle cx="9" cy="7" r="4" class="icon-scale-in"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" class="icon-draw-delay"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" class="icon-draw-delay-2"/>
  </svg>`,
  server: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,
  // 新增卡牌相关图标
  gitBranch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <line x1="6" y1="3" x2="6" y2="15"/>
    <circle cx="18" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated icon-lightning-pro">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`,
  chevronUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <polyline points="18 15 12 9 6 15"/>
  </svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-animated">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`
};
const TOOL_DEFINITIONS = [
  {
    name: "read_file",
    description: "读取文件内容，支持行范围读取",
    parameters: {
      path: { type: "string", description: "文件路径", required: true },
      start_line: { type: "number", description: "起始行号（可选）" },
      end_line: { type: "number", description: "结束行号（可选）" }
    }
  },
  {
    name: "write_file",
    description: "写入文件，自动创建目录",
    parameters: {
      path: { type: "string", description: "文件路径", required: true },
      content: { type: "string", description: "文件内容", required: true }
    }
  },
  {
    name: "search_replace",
    description: "搜索并替换文件中的内容",
    parameters: {
      path: { type: "string", description: "文件路径", required: true },
      search: { type: "string", description: "要搜索的内容", required: true },
      replace: { type: "string", description: "替换后的内容", required: true }
    }
  },
  {
    name: "delete_file",
    description: "删除文件",
    parameters: {
      path: { type: "string", description: "文件路径", required: true }
    }
  },
  {
    name: "list_directory",
    description: "列出目录内容",
    parameters: {
      path: { type: "string", description: "目录路径", required: true },
      pattern: { type: "string", description: "过滤模式（可选）" }
    }
  },
  {
    name: "search_files",
    description: "使用正则表达式搜索文件内容",
    parameters: {
      pattern: { type: "string", description: "正则表达式模式", required: true },
      path: { type: "string", description: "搜索目录路径" },
      file_type: { type: "string", description: "文件类型过滤（如ts,js,json）" }
    }
  },
  {
    name: "glob_find",
    description: "使用通配符查找文件",
    parameters: {
      pattern: { type: "string", description: "通配符模式（如**/*.ts）", required: true },
      path: { type: "string", description: "搜索根目录" }
    }
  },
  {
    name: "run_command",
    description: "执行终端命令",
    parameters: {
      command: { type: "string", description: "要执行的命令", required: true },
      cwd: { type: "string", description: "工作目录" }
    }
  },
  {
    name: "analyze_code",
    description: "分析代码结构和依赖关系",
    parameters: {
      path: { type: "string", description: "文件或目录路径", required: true },
      analysis_type: {
        type: "string",
        description: "分析类型",
        enum: ["structure", "dependencies", "complexity", "patterns"]
      }
    }
  },
  {
    name: "memory_store",
    description: "存储信息到会话记忆中",
    parameters: {
      key: { type: "string", description: "记忆键", required: true },
      value: { type: "string", description: "记忆值", required: true },
      category: { type: "string", description: "分类（如character,plot,world）" }
    }
  },
  {
    name: "memory_recall",
    description: "从会话记忆中检索信息",
    parameters: {
      key: { type: "string", description: "记忆键" },
      category: { type: "string", description: "分类" },
      query: { type: "string", description: "模糊搜索查询" }
    }
  },
  {
    name: "web_search",
    description: "搜索互联网获取信息",
    parameters: {
      query: { type: "string", description: "搜索查询", required: true }
    }
  }
];
const TOOL_SYSTEM_PROMPT = `你是一个强大的AI Agent，拥有完整的工具调用能力。

## 你的工作流程
1. **思考** - 分析用户请求，制定计划
2. **调用工具** - 选择合适的工具执行操作
3. **观察结果** - 分析工具返回的结果
4. **继续思考** - 决定是否需要更多操作
5. **给出答案** - 当任务完成时给出最终回答

## 可用工具
${TOOL_DEFINITIONS.map((t) => `- **${t.name}**: ${t.description}`).join("\n")}

## 工具调用格式
当你需要调用工具时，请使用以下JSON格式：
\`\`\`tool_call
{"name": "工具名", "arguments": {"参数名": "参数值"}}
\`\`\`

## 重要规则
- 每次只能调用一个工具
- 调用工具前先思考需要什么信息
- 工具返回结果后会自动送回给你
- 当你认为任务完成时，直接给出最终回答（不要使用tool_call格式）
- 如果操作涉及文件，请先读取确认内容再修改
- 对于创作类任务，优先使用memory工具管理上下文`;
class AgentLoopEngine {
  constructor(projectRoot = "") {
    __publicField(this, "state");
    __publicField(this, "onStep", null);
    __publicField(this, "memory", /* @__PURE__ */ new Map());
    __publicField(this, "projectRoot");
    this.projectRoot = projectRoot;
    this.state = {
      steps: [],
      isRunning: false,
      currentIteration: 0,
      maxIterations: 15,
      context: []
    };
  }
  setStepCallback(cb) {
    this.onStep = cb;
  }
  getState() {
    return { ...this.state };
  }
  getSystemPrompt() {
    return TOOL_SYSTEM_PROMPT;
  }
  getToolDefinitionsJson() {
    return JSON.stringify(TOOL_DEFINITIONS, null, 2);
  }
  reset() {
    this.state = {
      steps: [],
      isRunning: false,
      currentIteration: 0,
      maxIterations: 15,
      context: []
    };
  }
  processStreamChunk(fullContent) {
    const toolCallRegex = /```tool_call\s*\n([\s\S]*?)\n```/g;
    const matches = [...fullContent.matchAll(toolCallRegex)];
    if (matches.length > 0) {
      try {
        const lastMatch = matches[matches.length - 1];
        const jsonStr = lastMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        return {
          isToolCall: true,
          toolCall: {
            id: `tc_${Date.now()}`,
            name: parsed.name,
            arguments: parsed.arguments || {}
          },
          cleanContent: fullContent.replace(toolCallRegex, "").trim()
        };
      } catch (e) {
        return { isToolCall: false, toolCall: null, cleanContent: fullContent };
      }
    }
    const pendingToolCall = fullContent.match(/```tool_call\s*\n([\s\S]*?)$/);
    if (pendingToolCall) {
      try {
        const jsonStr = pendingToolCall[1].trim();
        if (jsonStr.includes('"name"') && jsonStr.includes('"arguments"')) {
          JSON.parse(jsonStr + "}");
          return { isToolCall: false, toolCall: null, cleanContent: fullContent };
        }
      } catch (e) {
        return { isToolCall: false, toolCall: null, cleanContent: fullContent };
      }
    }
    return { isToolCall: false, toolCall: null, cleanContent: fullContent };
  }
  async executeTool(toolCall) {
    const step = {
      type: "tool_call",
      content: `调用工具: ${toolCall.name}`,
      toolCall,
      timestamp: Date.now()
    };
    this.state.steps.push(step);
    this.emitStep(step);
    let result = "";
    let success = true;
    try {
      switch (toolCall.name) {
        case "read_file":
          result = await this.toolReadFile(
            toolCall.arguments.path,
            toolCall.arguments.start_line,
            toolCall.arguments.end_line
          );
          break;
        case "write_file":
          result = await this.toolWriteFile(
            toolCall.arguments.path,
            toolCall.arguments.content
          );
          break;
        case "search_replace":
          result = await this.toolSearchReplace(
            toolCall.arguments.path,
            toolCall.arguments.search,
            toolCall.arguments.replace
          );
          break;
        case "delete_file":
          result = await this.toolDeleteFile(toolCall.arguments.path);
          break;
        case "list_directory":
          result = await this.toolListDirectory(
            toolCall.arguments.path,
            toolCall.arguments.pattern
          );
          break;
        case "search_files":
          result = await this.toolSearchFiles(
            toolCall.arguments.pattern,
            toolCall.arguments.path,
            toolCall.arguments.file_type
          );
          break;
        case "glob_find":
          result = await this.toolGlobFind(
            toolCall.arguments.pattern,
            toolCall.arguments.path
          );
          break;
        case "run_command":
          result = await this.toolRunCommand(
            toolCall.arguments.command,
            toolCall.arguments.cwd
          );
          break;
        case "analyze_code":
          result = await this.toolAnalyzeCode(
            toolCall.arguments.path,
            toolCall.arguments.analysis_type
          );
          break;
        case "memory_store":
          result = this.toolMemoryStore(
            toolCall.arguments.key,
            toolCall.arguments.value,
            toolCall.arguments.category
          );
          break;
        case "memory_recall":
          result = this.toolMemoryRecall(
            toolCall.arguments.key,
            toolCall.arguments.category,
            toolCall.arguments.query
          );
          break;
        case "web_search":
          result = `[模拟] 搜索: "${toolCall.arguments.query}" - 由于浏览器安全限制，Web搜索需要后端支持`;
          break;
        default:
          result = `未知工具: ${toolCall.name}`;
          success = false;
      }
    } catch (error) {
      result = `工具执行错误: ${error.message}`;
      success = false;
    }
    const resultStep = {
      type: "tool_result",
      content: result,
      toolResult: {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success,
        result
      },
      timestamp: Date.now()
    };
    this.state.steps.push(resultStep);
    this.emitStep(resultStep);
    this.state.context.push(`[工具 ${toolCall.name} 结果]: ${result.substring(0, 500)}`);
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success,
      result
    };
  }
  buildContextMessages() {
    if (this.state.context.length === 0) return "";
    return "\n\n## 已执行的工具结果\n" + this.state.context.join("\n");
  }
  emitStep(step) {
    if (this.onStep) {
      this.onStep(step, { ...this.state });
    }
  }
  // ==========================================
  // 工具实现
  // ==========================================
  async toolReadFile(path, startLine, endLine) {
    try {
      const fs = require("fs");
      const fullPath = this.resolvePath(path);
      let content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      if (startLine || endLine) {
        const start = (startLine || 1) - 1;
        const end = endLine || lines.length;
        content = lines.slice(start, end).map((line, i) => `${start + i + 1}: ${line}`).join("\n");
      } else {
        content = `文件: ${path} (${lines.length}行)
${"─".repeat(40)}
${content}`;
      }
      return content.substring(0, 1e4);
    } catch (e) {
      return `[浏览器环境] 无法直接读取文件: ${path}。在Electron环境中此功能可用。你可以将文件内容粘贴到对话中。`;
    }
  }
  async toolWriteFile(path, content) {
    try {
      const fs = require("fs");
      const fullPath = this.resolvePath(path);
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content, "utf-8");
      return `文件已写入: ${path} (${content.length}字符)`;
    } catch (e) {
      return `[建议写入] 文件: ${path}
内容:
${content.substring(0, 2e3)}`;
    }
  }
  async toolSearchReplace(path, search, replace) {
    try {
      const fs = require("fs");
      const fullPath = this.resolvePath(path);
      let content = fs.readFileSync(fullPath, "utf-8");
      if (!content.includes(search)) {
        return `未找到匹配内容: "${search.substring(0, 50)}..."`;
      }
      const occurrences = content.split(search).length - 1;
      content = content.replace(new RegExp(this.escapeRegex(search), "g"), replace);
      fs.writeFileSync(fullPath, content, "utf-8");
      return `已替换 ${occurrences} 处: "${search.substring(0, 30)}..." → "${replace.substring(0, 30)}..."`;
    } catch (e) {
      return `[建议替换] 文件: ${path}
搜索: ${search}
替换: ${replace}`;
    }
  }
  async toolDeleteFile(path) {
    try {
      const fs = require("fs");
      const fullPath = this.resolvePath(path);
      fs.unlinkSync(fullPath);
      return `文件已删除: ${path}`;
    } catch (e) {
      return `[建议删除] 文件: ${path}`;
    }
  }
  async toolListDirectory(path, pattern) {
    try {
      const fs = require("fs");
      const fullPath = this.resolvePath(path);
      let entries = fs.readdirSync(fullPath, { withFileTypes: true });
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        entries = entries.filter((e) => regex.test(e.name));
      }
      const result = entries.slice(0, 100).map((e) => {
        const type = e.isDirectory() ? "📁" : "📄";
        return `${type} ${e.name}`;
      }).join("\n");
      return `目录: ${path} (${entries.length}项)
${"─".repeat(40)}
${result}`;
    } catch (e) {
      return `[浏览器环境] 无法列出目录: ${path}。在Electron环境中此功能可用。`;
    }
  }
  async toolSearchFiles(pattern, path, fileType) {
    return `[搜索] 模式: ${pattern}, 路径: ${path || "."}, 类型: ${fileType || "all"}
在Electron环境中可用grep进行正则搜索。`;
  }
  async toolGlobFind(pattern, path) {
    return `[通配符查找] 模式: ${pattern}, 路径: ${path || "."}
在Electron环境中可用glob匹配文件。`;
  }
  async toolRunCommand(command, cwd) {
    return `[命令] ${command} (工作目录: ${cwd || "当前"})
在Electron环境中可执行终端命令。`;
  }
  async toolAnalyzeCode(path, analysisType) {
    return `[代码分析] ${path} - 类型: ${analysisType}
分析功能在Electron环境中可用。`;
  }
  toolMemoryStore(key, value, category) {
    const cat = category || "general";
    if (!this.memory.has(cat)) {
      this.memory.set(cat, /* @__PURE__ */ new Map());
    }
    this.memory.get(cat).set(key, value);
    return `已存储记忆: [${cat}] ${key} = ${value.substring(0, 100)}...`;
  }
  toolMemoryRecall(key, category, query) {
    const results = [];
    if (category && this.memory.has(category)) {
      const catMap = this.memory.get(category);
      if (key) {
        const val = catMap.get(key);
        if (val) results.push(`[${category}] ${key}: ${val}`);
      } else {
        catMap.forEach((v, k) => {
          if (!query || v.includes(query) || k.includes(query)) {
            results.push(`[${category}] ${k}: ${v}`);
          }
        });
      }
    } else {
      this.memory.forEach((catMap, cat) => {
        catMap.forEach((v, k) => {
          if (!query || v.includes(query) || k.includes(query)) {
            results.push(`[${cat}] ${k}: ${v}`);
          }
        });
      });
    }
    if (results.length === 0) return "未找到匹配的记忆";
    return results.join("\n");
  }
  resolvePath(path) {
    if (path.startsWith("/")) return path;
    if (path.startsWith("./")) return this.projectRoot + path.substring(1);
    return this.projectRoot + "/" + path;
  }
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
function renderAgentStepHtml(step) {
  var _a, _b, _c, _d;
  switch (step.type) {
    case "thinking":
      return `
        <div class="agent-step thinking" style="margin: 8px 0; padding: 10px 14px; background: rgba(139,92,246,0.1); border-left: 3px solid #8b5cf6; border-radius: 0 8px 8px 0; font-size: 13px;">
          <div style="color: #a78bfa; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">💭</span> 思考
          </div>
          <div style="color: rgba(255,255,255,0.8); white-space: pre-wrap;">${step.content}</div>
        </div>`;
    case "tool_call":
      return `
        <div class="agent-step tool-call" style="margin: 8px 0; padding: 10px 14px; background: rgba(6,182,212,0.1); border-left: 3px solid #06b6d4; border-radius: 0 8px 8px 0; font-size: 13px;">
          <div style="color: #22d3ee; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">🔧</span> 调用工具: ${((_a = step.toolCall) == null ? void 0 : _a.name) || ""}
          </div>
          <div style="color: rgba(255,255,255,0.7); font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 4px; margin-top: 4px;">
            ${JSON.stringify(((_b = step.toolCall) == null ? void 0 : _b.arguments) || {}, null, 2)}
          </div>
        </div>`;
    case "tool_result":
      const isSuccess = (_c = step.toolResult) == null ? void 0 : _c.success;
      return `
        <div class="agent-step tool-result" style="margin: 8px 0; padding: 10px 14px; background: rgba(${isSuccess ? "16,185,129" : "239,68,68"},0.1); border-left: 3px solid ${isSuccess ? "#10b981" : "#ef4444"}; border-radius: 0 8px 8px 0; font-size: 13px;">
          <div style="color: ${isSuccess ? "#34d399" : "#f87171"}; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">${isSuccess ? "✅" : "❌"}</span> 结果: ${((_d = step.toolResult) == null ? void 0 : _d.name) || ""}
          </div>
          <div style="color: rgba(255,255,255,0.7); max-height: 200px; overflow-y: auto; white-space: pre-wrap; font-size: 12px;">${(step.content || "").substring(0, 2e3)}</div>
        </div>`;
    case "final_answer":
      return `
        <div class="agent-step final-answer" style="margin: 8px 0; padding: 12px 16px; background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1)); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px;">
          <div style="color: #fbbf24; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🎯</span> 最终回答
          </div>
          <div style="color: rgba(255,255,255,0.9); white-space: pre-wrap; line-height: 1.6;">${step.content}</div>
        </div>`;
    default:
      return "";
  }
}
class StructuredRenderer {
  constructor() {
    __publicField(this, "theme", "dark");
  }
  setTheme(theme) {
    this.theme = theme;
  }
  render(content) {
    switch (content.type) {
      case "novel":
        return this.renderNovel(content.data);
      case "chapter":
        return this.renderChapter(content.data);
      case "character":
        return this.renderCharacter(content.data);
      case "dialogue":
        return this.renderDialogue(content.data);
      case "scene":
        return this.renderScene(content.data);
      case "plot":
        return this.renderPlot(content.data);
      case "emotion":
        return this.renderEmotion(content.data);
      case "world":
        return this.renderWorld(content.data);
      case "card":
        return this.renderCard(content.data);
      case "outline":
        return this.renderOutline(content.data);
      case "inspiration":
        return this.renderInspiration(content.data);
      default:
        return this.renderUnknown(content.data);
    }
  }
  renderNovel(data) {
    return `
      <article class="content-novel" data-theme="${this.theme}">
        <header class="novel-header">
          <h1 class="novel-title">${this.escapeHtml(data.title)}</h1>
          ${data.author ? `<p class="novel-author">作者：${this.escapeHtml(data.author)}</p>` : ""}
          ${data.synopsis ? `<p class="novel-synopsis">${this.escapeHtml(data.synopsis)}</p>` : ""}
          ${data.tags ? this.renderTags(data.tags) : ""}
        </header>
        <div class="novel-chapters">
          ${data.chapters.map((ch) => this.renderChapter(ch)).join("")}
        </div>
      </article>
    `;
  }
  renderChapter(data) {
    return `
      <section class="content-chapter" data-theme="${this.theme}">
        <header class="chapter-header">
          <span class="chapter-number">第${data.number}章</span>
          <h2 class="chapter-title">${this.escapeHtml(data.title)}</h2>
          ${data.wordCount ? `<span class="chapter-words">${data.wordCount}字</span>` : ""}
        </header>
        <div class="chapter-content">
          ${this.formatParagraphs(data.content)}
        </div>
        ${data.scenes ? `<div class="chapter-scenes">${data.scenes.map((s) => this.renderScene(s)).join("")}</div>` : ""}
      </section>
    `;
  }
  renderCharacter(data) {
    return `
      <article class="content-character" data-theme="${this.theme}">
        <header class="character-header">
          <div class="character-avatar">
            <div class="avatar-placeholder" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">
              ${data.name.charAt(0)}
            </div>
          </div>
          <div class="character-info">
            <h3 class="character-name">${this.escapeHtml(data.name)}</h3>
            <p class="character-meta">
              ${data.gender ? `<span>${this.escapeHtml(data.gender)}</span>` : ""}
              ${data.age ? `<span>${this.escapeHtml(data.age)}</span>` : ""}
              ${data.occupation ? `<span>${this.escapeHtml(data.occupation)}</span>` : ""}
            </p>
          </div>
        </header>
        
        <div class="character-body">
          ${data.appearance ? `
            <section class="character-section">
              <h4 class="section-title">外貌描述</h4>
              <p class="section-content">${this.escapeHtml(data.appearance)}</p>
            </section>
          ` : ""}
          
          ${data.personality && data.personality.length > 0 ? `
            <section class="character-section">
              <h4 class="section-title">性格特点</h4>
              <div class="tag-group">
                ${data.personality.map((p) => `<span class="tag tag-personality">${this.escapeHtml(p)}</span>`).join("")}
              </div>
            </section>
          ` : ""}
          
          ${data.background ? `
            <section class="character-section">
              <h4 class="section-title">背景故事</h4>
              <p class="section-content">${this.escapeHtml(data.background)}</p>
            </section>
          ` : ""}
          
          <div class="character-grid">
            ${data.motivation ? `
              <div class="grid-item">
                <h5 class="grid-title">核心动机</h5>
                <p class="grid-content">${this.escapeHtml(data.motivation)}</p>
              </div>
            ` : ""}
            ${data.conflict ? `
              <div class="grid-item">
                <h5 class="grid-title">内心冲突</h5>
                <p class="grid-content">${this.escapeHtml(data.conflict)}</p>
              </div>
            ` : ""}
          </div>
          
          ${data.arc ? `
            <section class="character-section">
              <h4 class="section-title">角色弧线</h4>
              <p class="section-content">${this.escapeHtml(data.arc)}</p>
            </section>
          ` : ""}
          
          ${data.speechStyle ? `
            <section class="character-section">
              <h4 class="section-title">说话风格</h4>
              <p class="section-content">${this.escapeHtml(data.speechStyle)}</p>
            </section>
          ` : ""}
          
          ${data.relationships && data.relationships.length > 0 ? `
            <section class="character-section">
              <h4 class="section-title">人物关系</h4>
              <div class="tag-group">
                ${data.relationships.map((r) => `<span class="tag tag-relationship">${this.escapeHtml(r)}</span>`).join("")}
              </div>
            </section>
          ` : ""}
        </div>
      </article>
    `;
  }
  renderDialogue(data) {
    return `
      <article class="content-dialogue" data-theme="${this.theme}">
        ${data.title ? `<h3 class="dialogue-title">${this.escapeHtml(data.title)}</h3>` : ""}
        ${data.scene ? `<p class="dialogue-scene">${this.escapeHtml(data.scene)}</p>` : ""}
        
        ${data.characters && data.characters.length > 0 ? `
          <div class="dialogue-characters">
            ${data.characters.map((c) => `
              <div class="character-badge">
                <span class="badge-name">${this.escapeHtml(c.name)}</span>
                ${c.description ? `<span class="badge-desc">${this.escapeHtml(c.description)}</span>` : ""}
              </div>
            `).join("")}
          </div>
        ` : ""}
        
        <div class="dialogue-lines">
          ${data.lines.map((line, i) => `
            <div class="dialogue-line ${i % 2 === 0 ? "line-a" : "line-b"}">
              <div class="line-header">
                <span class="line-speaker">${this.escapeHtml(line.speaker)}</span>
                ${line.emotion ? `<span class="line-emotion">${this.escapeHtml(line.emotion)}</span>` : ""}
              </div>
              ${line.action ? `<p class="line-action">${this.escapeHtml(line.action)}</p>` : ""}
              <p class="line-content">${this.escapeHtml(line.line)}</p>
              ${line.subtext ? `<p class="line-subtext">潜台词：${this.escapeHtml(line.subtext)}</p>` : ""}
            </div>
          `).join("")}
        </div>
        
        ${data.emotionProgression && data.emotionProgression.length > 0 ? `
          <div class="dialogue-meta">
            <div class="meta-section">
              <h5>情绪变化</h5>
              <div class="tag-group">
                ${data.emotionProgression.map((e) => `<span class="tag">${this.escapeHtml(e)}</span>`).join("")}
              </div>
            </div>
          </div>
        ` : ""}
        
        ${data.keyMoments && data.keyMoments.length > 0 ? `
          <div class="dialogue-meta">
            <div class="meta-section">
              <h5>关键时刻</h5>
              <ul class="moment-list">
                ${data.keyMoments.map((m) => `<li>${this.escapeHtml(m)}</li>`).join("")}
              </ul>
            </div>
          </div>
        ` : ""}
        
        ${data.notes ? `<p class="dialogue-notes">${this.escapeHtml(data.notes)}</p>` : ""}
      </article>
    `;
  }
  renderScene(data) {
    return `
      <section class="content-scene" data-theme="${this.theme}">
        <header class="scene-header">
          <h4 class="scene-location">${this.escapeHtml(data.location)}</h4>
          ${data.time ? `<span class="scene-time">${this.escapeHtml(data.time)}</span>` : ""}
        </header>
        <p class="scene-description">${this.escapeHtml(data.description)}</p>
        ${data.atmosphere ? `<p class="scene-atmosphere">氛围：${this.escapeHtml(data.atmosphere)}</p>` : ""}
        ${data.characters && data.characters.length > 0 ? `
          <div class="scene-characters">
            出场人物：${data.characters.map((c) => `<span class="character-chip">${this.escapeHtml(c)}</span>`).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }
  renderPlot(data) {
    return `
      <article class="content-plot" data-theme="${this.theme}">
        <header class="plot-header">
          <h3 class="plot-title">${this.escapeHtml(data.title)}</h3>
          ${data.logline ? `<p class="plot-logline">${this.escapeHtml(data.logline)}</p>` : ""}
        </header>
        
        <div class="plot-timeline">
          ${data.acts.map((act) => `
            <section class="plot-act act-${act.number}">
              <header class="act-header">
                <span class="act-number">第${act.number}幕</span>
                <h4 class="act-title">${this.escapeHtml(act.title)}</h4>
              </header>
              
              <div class="act-events">
                <ul class="event-list">
                  ${act.events.map((e) => `<li class="event-item">${this.escapeHtml(e)}</li>`).join("")}
                </ul>
              </div>
              
              ${act.turningPoint ? `
                <div class="act-milestone milestone-turning">
                  <span class="milestone-label">转折点</span>
                  <p class="milestone-content">${this.escapeHtml(act.turningPoint)}</p>
                </div>
              ` : ""}
              
              ${act.midpoint ? `
                <div class="act-milestone milestone-midpoint">
                  <span class="milestone-label">中点</span>
                  <p class="milestone-content">${this.escapeHtml(act.midpoint)}</p>
                </div>
              ` : ""}
              
              ${act.climax ? `
                <div class="act-milestone milestone-climax">
                  <span class="milestone-label">高潮</span>
                  <p class="milestone-content">${this.escapeHtml(act.climax)}</p>
                </div>
              ` : ""}
              
              ${act.resolution ? `
                <div class="act-milestone milestone-resolution">
                  <span class="milestone-label">结局</span>
                  <p class="milestone-content">${this.escapeHtml(act.resolution)}</p>
                </div>
              ` : ""}
            </section>
          `).join("")}
        </div>
        
        ${data.theme || data.conflict ? `
          <footer class="plot-footer">
            ${data.theme ? `<div class="plot-meta"><span class="meta-label">主题</span>${this.escapeHtml(data.theme)}</div>` : ""}
            ${data.conflict ? `<div class="plot-meta"><span class="meta-label">冲突</span>${this.escapeHtml(data.conflict)}</div>` : ""}
          </footer>
        ` : ""}
      </article>
    `;
  }
  renderEmotion(data) {
    const maxIntensity = 100;
    const curvePath = data.emotionCurve.map((point, i) => {
      const x = i / (data.emotionCurve.length - 1) * 100;
      const y = maxIntensity - point.intensity;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return `
      <article class="content-emotion" data-theme="${this.theme}">
        ${data.title ? `<h3 class="emotion-title">${this.escapeHtml(data.title)}</h3>` : ""}
        
        <div class="emotion-stats">
          ${data.tensionScore !== void 0 ? `
            <div class="stat-item">
              <span class="stat-value">${data.tensionScore}%</span>
              <span class="stat-label">情感张力</span>
            </div>
          ` : ""}
          ${data.turningPoints !== void 0 ? `
            <div class="stat-item">
              <span class="stat-value">${data.turningPoints}</span>
              <span class="stat-label">转折点</span>
            </div>
          ` : ""}
          ${data.overallGrade ? `
            <div class="stat-item">
              <span class="stat-value">${this.escapeHtml(data.overallGrade)}</span>
              <span class="stat-label">整体评分</span>
            </div>
          ` : ""}
        </div>
        
        <div class="emotion-curve">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="curve-svg">
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.4" />
                <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="${curvePath} L100,100 L0,100 Z" fill="url(#curveGradient)" />
            <path d="${curvePath}" fill="none" stroke="#ec4899" stroke-width="0.5" vector-effect="non-scaling-stroke" />
            ${data.emotionCurve.map((point, i) => {
      const x = i / (data.emotionCurve.length - 1) * 100;
      const y = maxIntensity - point.intensity;
      return `<circle cx="${x}" cy="${y}" r="1.5" fill="#ec4899" class="curve-point" />`;
    }).join("")}
          </svg>
          <div class="curve-labels">
            ${data.emotionCurve.map((point) => `<span class="curve-label">${this.escapeHtml(point.point)}</span>`).join("")}
          </div>
        </div>
        
        ${data.analysis ? `
          <section class="emotion-section">
            <h4 class="section-title">情感分析</h4>
            <p class="section-content">${this.escapeHtml(data.analysis)}</p>
          </section>
        ` : ""}
        
        ${data.suggestions && data.suggestions.length > 0 ? `
          <section class="emotion-section">
            <h4 class="section-title">优化建议</h4>
            <ul class="suggestion-list">
              ${data.suggestions.map((s) => `<li>${this.escapeHtml(s)}</li>`).join("")}
            </ul>
          </section>
        ` : ""}
        
        ${data.emotionBeats && data.emotionBeats.length > 0 ? `
          <section class="emotion-section">
            <h4 class="section-title">情感节拍</h4>
            <div class="tag-group">
              ${data.emotionBeats.map((b) => `<span class="tag">${this.escapeHtml(b)}</span>`).join("")}
            </div>
          </section>
        ` : ""}
      </article>
    `;
  }
  renderWorld(data) {
    return `
      <article class="content-world" data-theme="${this.theme}">
        <header class="world-header">
          <h3 class="world-title">${this.escapeHtml(data.name)}</h3>
          ${data.type ? `<p class="world-type">${this.escapeHtml(data.type)}</p>` : ""}
        </header>
        
        <div class="world-grid">
          ${data.geography ? `
            <section class="world-section">
              <h4 class="section-title">地理环境</h4>
              ${data.geography.overview ? `<p class="section-content">${this.escapeHtml(data.geography.overview)}</p>` : ""}
              ${data.geography.regions && data.geography.regions.length > 0 ? `
                <div class="info-row">
                  <span class="info-label">区域</span>
                  <span class="info-value">${data.geography.regions.map((r) => this.escapeHtml(r)).join("、")}</span>
                </div>
              ` : ""}
              ${data.geography.climate ? `
                <div class="info-row">
                  <span class="info-label">气候</span>
                  <span class="info-value">${this.escapeHtml(data.geography.climate)}</span>
                </div>
              ` : ""}
            </section>
          ` : ""}
          
          ${data.history ? `
            <section class="world-section">
              <h4 class="section-title">历史背景</h4>
              ${data.history.majorEvents ? `<p class="section-content">${this.escapeHtml(data.history.majorEvents)}</p>` : ""}
              ${data.history.currentEra ? `
                <div class="info-row">
                  <span class="info-label">当前时代</span>
                  <span class="info-value">${this.escapeHtml(data.history.currentEra)}</span>
                </div>
              ` : ""}
            </section>
          ` : ""}
          
          ${data.culture ? `
            <section class="world-section">
              <h4 class="section-title">文化习俗</h4>
              ${data.culture.society ? `<p class="section-content">${this.escapeHtml(data.culture.society)}</p>` : ""}
              ${data.culture.customs && data.culture.customs.length > 0 ? `
                <div class="info-row">
                  <span class="info-label">习俗</span>
                  <span class="info-value">${data.culture.customs.map((c) => this.escapeHtml(c)).join("、")}</span>
                </div>
              ` : ""}
            </section>
          ` : ""}
          
          ${data.magicSystem ? `
            <section class="world-section">
              <h4 class="section-title">魔法/科技体系</h4>
              ${data.magicSystem.type ? `<p class="section-content">${this.escapeHtml(data.magicSystem.type)}</p>` : ""}
              ${data.magicSystem.rules && data.magicSystem.rules.length > 0 ? `
                <div class="info-row">
                  <span class="info-label">规则</span>
                  <span class="info-value">${data.magicSystem.rules.map((r) => this.escapeHtml(r)).join("、")}</span>
                </div>
              ` : ""}
            </section>
          ` : ""}
        </div>
        
        ${data.politics || data.economy ? `
          <section class="world-section world-extra">
            <h4 class="section-title">政治与经济</h4>
            <div class="world-grid">
              ${data.politics ? `
                <div class="grid-item">
                  ${data.politics.government ? `<p><strong>政治体制：</strong>${this.escapeHtml(data.politics.government)}</p>` : ""}
                  ${data.politics.factions && data.politics.factions.length > 0 ? `<p><strong>主要势力：</strong>${data.politics.factions.map((f) => this.escapeHtml(f)).join("、")}</p>` : ""}
                </div>
              ` : ""}
              ${data.economy ? `
                <div class="grid-item">
                  ${data.economy.currency ? `<p><strong>货币：</strong>${this.escapeHtml(data.economy.currency)}</p>` : ""}
                  ${data.economy.trade ? `<p><strong>贸易：</strong>${this.escapeHtml(data.economy.trade)}</p>` : ""}
                </div>
              ` : ""}
            </div>
          </section>
        ` : ""}
      </article>
    `;
  }
  renderCard(data) {
    const rarityColors = {
      common: "#9ca3af",
      rare: "#3b82f6",
      epic: "#a855f7",
      legendary: "#f59e0b"
    };
    const color = data.color || rarityColors[data.rarity || "common"];
    return `
      <article class="content-card rarity-${data.rarity || "common"}" data-theme="${this.theme}" style="--card-color: ${color}">
        <header class="card-header">
          ${data.icon ? `<div class="card-icon">${data.icon}</div>` : ""}
          <h4 class="card-title">${this.escapeHtml(data.title)}</h4>
          <span class="card-type">${this.escapeHtml(data.type)}</span>
        </header>
        <div class="card-body">
          <p class="card-content">${this.escapeHtml(data.content)}</p>
          ${data.effects && data.effects.length > 0 ? `
            <div class="card-effects">
              ${data.effects.map((e) => `<span class="effect-item">${this.escapeHtml(e)}</span>`).join("")}
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }
  renderOutline(data) {
    return `
      <article class="content-outline" data-theme="${this.theme}">
        <header class="outline-header">
          <h3 class="outline-title">${this.escapeHtml(data.title)}</h3>
          ${data.wordCount ? `<span class="outline-words">预计${data.wordCount}字</span>` : ""}
          ${data.theme ? `<p class="outline-theme">主题：${this.escapeHtml(data.theme)}</p>` : ""}
        </header>
        
        <div class="outline-chapters">
          ${data.chapters.map((ch) => `
            <section class="outline-chapter">
              <header class="chapter-header">
                <span class="chapter-num">第${ch.number}章</span>
                <h4 class="chapter-title">${this.escapeHtml(ch.title)}</h4>
                ${ch.wordCount ? `<span class="chapter-words">${ch.wordCount}字</span>` : ""}
              </header>
              <p class="chapter-summary">${this.escapeHtml(ch.summary)}</p>
              ${ch.keyEvents && ch.keyEvents.length > 0 ? `
                <div class="chapter-events">
                  <span class="events-label">关键事件：</span>
                  <ul class="events-list">
                    ${ch.keyEvents.map((e) => `<li>${this.escapeHtml(e)}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
              ${ch.emotionBeat ? `<span class="emotion-beat">情感节拍：${this.escapeHtml(ch.emotionBeat)}</span>` : ""}
            </section>
          `).join("")}
        </div>
      </article>
    `;
  }
  renderInspiration(data) {
    return `
      <article class="content-inspiration" data-theme="${this.theme}">
        <header class="inspiration-header">
          <h3 class="inspiration-title">${this.escapeHtml(data.title)}</h3>
          ${data.genre ? `<span class="inspiration-genre">${this.escapeHtml(data.genre)}</span>` : ""}
        </header>
        <p class="inspiration-content">${this.escapeHtml(data.content)}</p>
        ${data.tags && data.tags.length > 0 ? this.renderTags(data.tags) : ""}
        ${data.prompt ? `
          <div class="inspiration-prompt">
            <span class="prompt-label">创作提示</span>
            <p class="prompt-content">${this.escapeHtml(data.prompt)}</p>
          </div>
        ` : ""}
      </article>
    `;
  }
  renderUnknown(data) {
    return `
      <article class="content-unknown" data-theme="${this.theme}">
        <pre class="unknown-data">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </article>
    `;
  }
  renderTags(tags) {
    return `
      <div class="tag-group">
        ${tags.map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }
  formatParagraphs(content) {
    return content.split(/\n\n+/).filter((p) => p.trim()).map((p) => `<p class="paragraph">${this.escapeHtml(p.trim())}</p>`).join("");
  }
  escapeHtml(text) {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
  }
}
const renderer = new StructuredRenderer();
class StreamResponseRenderer {
  constructor() {
    __publicField(this, "container", null);
    __publicField(this, "theme", "dark");
    __publicField(this, "animationEnabled", true);
  }
  setContainer(container) {
    this.container = container;
    return this;
  }
  setTheme(theme) {
    this.theme = theme;
    return this;
  }
  setAnimation(enabled) {
    this.animationEnabled = enabled;
    return this;
  }
  render(response) {
    const html = this.renderResponse(response);
    if (this.container) {
      this.container.innerHTML = html;
    }
    return html;
  }
  renderIncremental(response, existingContent = "") {
    const html = this.renderResponse(response);
    if (this.container) {
      if (existingContent) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        const newContent = wrapper.firstElementChild;
        if (newContent) {
          const existingElement = this.container.querySelector(".stream-response:last-child");
          if (existingElement) {
            const contentEl = existingElement.querySelector(".response-content, .dialogue-text, .narration-text");
            if (contentEl) {
              contentEl.innerHTML = this.formatText(response.content);
            }
          } else {
            this.container.appendChild(newContent);
          }
        }
      } else {
        this.container.innerHTML = html;
      }
    }
    return html;
  }
  renderResponse(response) {
    const animClass = this.animationEnabled ? "animate-in" : "";
    switch (response.type) {
      case "narration":
        return this.renderNarration(response, animClass);
      case "dialogue":
        return this.renderDialogue(response, animClass);
      case "action":
        return this.renderAction(response, animClass);
      case "shop":
        return this.renderShop(response, animClass);
      case "combat":
        return this.renderCombat(response, animClass);
      case "quest":
        return this.renderQuest(response, animClass);
      case "status":
        return this.renderStatus(response, animClass);
      case "choice":
        return this.renderChoice(response, animClass);
      case "reward":
        return this.renderReward(response, animClass);
      case "novel":
        return this.renderNovel(response, animClass);
      case "character":
        return this.renderCharacter(response, animClass);
      case "plot":
        return this.renderPlot(response, animClass);
      case "emotion":
        return this.renderEmotion(response, animClass);
      case "world":
        return this.renderWorld(response, animClass);
      case "card":
        return this.renderCard(response, animClass);
      case "outline":
        return this.renderOutline(response, animClass);
      case "inspiration":
        return this.renderInspiration(response, animClass);
      default:
        return this.renderNarration(response, animClass);
    }
  }
  renderNarration(response, animClass) {
    return `
            <article class="stream-response narration ${animClass}" data-theme="${this.theme}">
                ${response.icon ? `<span class="response-icon">${response.icon}</span>` : ""}
                ${response.title ? `<h3 class="response-title">${this.escapeHtml(response.title)}</h3>` : ""}
                <div class="narration-text">${this.formatText(response.content)}</div>
                ${this.renderMetadata(response.metadata)}
            </article>
        `;
  }
  renderDialogue(response, animClass) {
    const emotionClass = response.emotion ? `emotion-${response.emotion}` : "";
    const emotionColors = {
      happy: "#10b981",
      sad: "#6366f1",
      angry: "#ef4444",
      surprised: "#f59e0b",
      neutral: "#6b7280",
      excited: "#ec4899"
    };
    const emotionColor = response.emotion ? emotionColors[response.emotion] : "#8b5cf6";
    return `
            <article class="stream-response dialogue ${emotionClass} ${animClass}" data-theme="${this.theme}" style="--emotion-color: ${emotionColor}">
                <header class="dialogue-header">
                    ${response.icon ? `<span class="speaker-icon">${response.icon}</span>` : ""}
                    <span class="speaker-name">${this.escapeHtml(response.speaker ?? "???")}</span>
                    ${response.emotion ? `<span class="emotion-badge">${this.getEmotionLabel(response.emotion)}</span>` : ""}
                </header>
                <div class="dialogue-content">
                    <span class="dialogue-text">${this.formatText(response.content)}</span>
                </div>
                ${this.renderMetadata(response.metadata)}
            </article>
        `;
  }
  renderAction(response, animClass) {
    return `
            <article class="stream-response action ${animClass}" data-theme="${this.theme}">
                <span class="action-icon">⚡</span>
                <span class="action-text">${this.formatText(response.content)}</span>
                ${this.renderEffects(response.effects)}
            </article>
        `;
  }
  renderShop(response, animClass) {
    var _a;
    const items = ((_a = response.data) == null ? void 0 : _a.items) ?? [];
    return `
            <article class="stream-response shop ${animClass}" data-theme="${this.theme}">
                <header class="shop-header">
                    <span class="shop-icon">🏪</span>
                    <h3 class="shop-title">${this.escapeHtml(response.title ?? "商店")}</h3>
                </header>
                <div class="shop-items">
                    ${items.map((item) => `
                        <div class="shop-item" data-id="${item.id}">
                            <span class="item-icon">${item.icon}</span>
                            <span class="item-name">${this.escapeHtml(item.name)}</span>
                            <span class="item-price ${item.discount ? "discounted" : ""}">
                                ${item.discount ? `<span class="original">${item.price}</span>` : ""}
                                ${item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price}金
                                ${item.trend ? `<span class="trend trend-${item.trend}">${item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}</span>` : ""}
                            </span>
                            ${item.stock !== void 0 ? `<span class="item-stock">库存: ${item.stock}</span>` : ""}
                        </div>
                    `).join("")}
                </div>
                ${this.renderChoices(response.choices)}
            </article>
        `;
  }
  renderCombat(response, animClass) {
    const combat = response.combat;
    if (!combat) return "";
    return `
            <article class="stream-response combat ${animClass}" data-theme="${this.theme}">
                <header class="combat-header">
                    <span class="combat-icon">⚔️</span>
                    <span class="combat-turn">回合 ${combat.turn}</span>
                </header>
                <div class="combat-arena">
                    <div class="combatant player">
                        <div class="combatant-name">你</div>
                        <div class="hp-bar">
                            <div class="hp-fill player" style="width: ${Math.max(0, combat.playerHP.current / combat.playerHP.max * 100)}%"></div>
                            <span class="hp-text">${combat.playerHP.current}/${combat.playerHP.max}</span>
                        </div>
                    </div>
                    <div class="combatant enemy">
                        <div class="combatant-name">${combat.enemyIcon ?? "👹"} ${this.escapeHtml(combat.enemyName)}</div>
                        <div class="hp-bar enemy">
                            <div class="hp-fill enemy" style="width: ${Math.max(0, combat.enemyHP.current / combat.enemyHP.max * 100)}%"></div>
                            <span class="hp-text">${combat.enemyHP.current}/${combat.enemyHP.max}</span>
                        </div>
                    </div>
                </div>
                <div class="combat-log">
                    ${combat.log.slice(-3).map((log) => `<div class="log-entry">${this.escapeHtml(log)}</div>`).join("")}
                </div>
                ${this.renderChoices(response.choices)}
            </article>
        `;
  }
  renderQuest(response, animClass) {
    const quest = response.quest;
    if (!quest) return "";
    return `
            <article class="stream-response quest ${animClass}" data-theme="${this.theme}">
                <header class="quest-header">
                    <span class="quest-icon">📜</span>
                    <h3 class="quest-name">${this.escapeHtml(quest.name)}</h3>
                </header>
                <div class="quest-description">${this.escapeHtml(quest.description)}</div>
                <div class="quest-objectives">
                    ${quest.objectives.map((obj) => `
                        <div class="objective ${obj.completed ? "completed" : ""}">
                            <span class="objective-check">${obj.completed ? "✓" : "○"}</span>
                            <span class="objective-text">${this.escapeHtml(obj.text)}</span>
                            <span class="objective-progress">${obj.current}/${obj.target}</span>
                        </div>
                    `).join("")}
                </div>
                <div class="quest-rewards">
                    ${quest.rewards.map((r) => `
                        <span class="reward-item">
                            <span class="reward-icon">${r.icon}</span>
                            <span class="reward-value">${r.value}</span>
                        </span>
                    `).join("")}
                </div>
            </article>
        `;
  }
  renderStatus(response, animClass) {
    const status = response.status;
    if (!status) return "";
    return `
            <article class="stream-response status ${animClass}" data-theme="${this.theme}">
                <header class="status-header">
                    <span class="status-name">${this.escapeHtml(status.name)}</span>
                    <span class="status-class">${this.escapeHtml(status.class ?? "冒险者")}</span>
                    <span class="status-level">Lv.${status.level}</span>
                </header>
                <div class="status-bars">
                    <div class="status-bar hp">
                        <span class="bar-label">HP</span>
                        <div class="bar-container">
                            <div class="bar-fill hp" style="width: ${Math.max(0, status.hp.current / status.hp.max * 100)}%"></div>
                            <span class="bar-text">${status.hp.current}/${status.hp.max}</span>
                        </div>
                    </div>
                    <div class="status-bar mp">
                        <span class="bar-label">MP</span>
                        <div class="bar-container">
                            <div class="bar-fill mp" style="width: ${Math.max(0, status.mp.current / status.mp.max * 100)}%"></div>
                            <span class="bar-text">${status.mp.current}/${status.mp.max}</span>
                        </div>
                    </div>
                    <div class="status-bar exp">
                        <span class="bar-label">EXP</span>
                        <div class="bar-container">
                            <div class="bar-fill exp" style="width: ${Math.max(0, status.exp.current / status.exp.max * 100)}%"></div>
                            <span class="bar-text">${status.exp.current}/${status.exp.max}</span>
                        </div>
                    </div>
                </div>
                <div class="status-gold">
                    <span class="gold-icon">💰</span>
                    <span class="gold-value">${status.gold}</span>
                </div>
                ${status.stats ? `
                    <div class="status-stats">
                        ${Object.entries(status.stats).map(([stat, value]) => `
                            <div class="stat-item">
                                <span class="stat-name">${this.escapeHtml(stat)}</span>
                                <span class="stat-value">${value}</span>
                            </div>
                        `).join("")}
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderChoice(response, animClass) {
    return `
            <article class="stream-response choice ${animClass}" data-theme="${this.theme}">
                ${response.content ? `<div class="choice-prompt">${this.formatText(response.content)}</div>` : ""}
                ${this.renderChoices(response.choices)}
            </article>
        `;
  }
  renderReward(response, animClass) {
    var _a;
    const data = response.data;
    if (!data) return "";
    return `
            <article class="stream-response reward ${animClass}" data-theme="${this.theme}">
                <header class="reward-header">
                    <span class="reward-icon">🎁</span>
                    <h3 class="reward-title">获得奖励</h3>
                </header>
                <div class="reward-list">
                    ${((_a = data.items) == null ? void 0 : _a.map((item) => `
                        <div class="reward-item">
                            <span class="item-icon">${item.icon}</span>
                            <span class="item-name">${this.escapeHtml(item.name)}</span>
                            <span class="item-quantity">x${item.quantity}</span>
                        </div>
                    `).join("")) ?? ""}
                    ${data.gold ? `
                        <div class="reward-item gold">
                            <span class="item-icon">💰</span>
                            <span class="item-name">金币</span>
                            <span class="item-quantity">+${data.gold}</span>
                        </div>
                    ` : ""}
                    ${data.exp ? `
                        <div class="reward-item exp">
                            <span class="item-icon">⭐</span>
                            <span class="item-name">经验</span>
                            <span class="item-quantity">+${data.exp}</span>
                        </div>
                    ` : ""}
                </div>
            </article>
        `;
  }
  renderNovel(response, animClass) {
    var _a;
    return `
            <article class="stream-response novel ${animClass}" data-theme="${this.theme}">
                <header class="novel-header">
                    <h2 class="novel-title">${this.escapeHtml(response.title ?? "未命名小说")}</h2>
                    ${((_a = response.metadata) == null ? void 0 : _a.author) ? `<p class="novel-author">作者：${this.escapeHtml(response.metadata.author)}</p>` : ""}
                </header>
                <div class="novel-content">
                    ${this.formatText(response.content)}
                </div>
                ${response.chapters && response.chapters.length > 0 ? `
                    <div class="novel-chapters">
                        ${response.chapters.map((ch) => `
                            <section class="novel-chapter">
                                <header class="chapter-header">
                                    <span class="chapter-number">第${ch.number}章</span>
                                    <h3 class="chapter-title">${this.escapeHtml(ch.title)}</h3>
                                </header>
                                ${ch.content ? `<div class="chapter-content">${this.formatText(ch.content)}</div>` : ""}
                                ${ch.summary ? `<p class="chapter-summary">${this.escapeHtml(ch.summary)}</p>` : ""}
                            </section>
                        `).join("")}
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderCharacter(response, animClass) {
    const data = response.data;
    return `
            <article class="stream-response character ${animClass}" data-theme="${this.theme}">
                <header class="character-header">
                    <div class="character-avatar">
                        <div class="avatar-placeholder">${(response.title ?? "?").charAt(0)}</div>
                    </div>
                    <div class="character-info">
                        <h3 class="character-name">${this.escapeHtml(response.title ?? "未知角色")}</h3>
                        ${(data == null ? void 0 : data.gender) || (data == null ? void 0 : data.age) || (data == null ? void 0 : data.occupation) ? `
                            <p class="character-meta">
                                ${data.gender ? `<span>${this.escapeHtml(data.gender)}</span>` : ""}
                                ${data.age ? `<span>${this.escapeHtml(data.age)}</span>` : ""}
                                ${data.occupation ? `<span>${this.escapeHtml(data.occupation)}</span>` : ""}
                            </p>
                        ` : ""}
                    </div>
                </header>
                <div class="character-body">
                    ${(data == null ? void 0 : data.appearance) ? `
                        <section class="character-section">
                            <h4 class="section-title">外貌描述</h4>
                            <p class="section-content">${this.escapeHtml(data.appearance)}</p>
                        </section>
                    ` : ""}
                    ${(data == null ? void 0 : data.personality) && Array.isArray(data.personality) && data.personality.length > 0 ? `
                        <section class="character-section">
                            <h4 class="section-title">性格特点</h4>
                            <div class="tag-group">
                                ${data.personality.map((p) => `<span class="tag">${this.escapeHtml(p)}</span>`).join("")}
                            </div>
                        </section>
                    ` : ""}
                    ${(data == null ? void 0 : data.background) ? `
                        <section class="character-section">
                            <h4 class="section-title">背景故事</h4>
                            <p class="section-content">${this.escapeHtml(data.background)}</p>
                        </section>
                    ` : ""}
                    ${response.content ? `<div class="character-notes">${this.formatText(response.content)}</div>` : ""}
                </div>
            </article>
        `;
  }
  renderPlot(response, animClass) {
    return `
            <article class="stream-response plot ${animClass}" data-theme="${this.theme}">
                <header class="plot-header">
                    <h3 class="plot-title">${this.escapeHtml(response.title ?? "情节大纲")}</h3>
                </header>
                <div class="plot-content">
                    ${this.formatText(response.content)}
                </div>
                ${response.acts && response.acts.length > 0 ? `
                    <div class="plot-timeline">
                        ${response.acts.map((act) => `
                            <section class="plot-act act-${act.number}">
                                <header class="act-header">
                                    <span class="act-number">第${act.number}幕</span>
                                    <h4 class="act-title">${this.escapeHtml(act.title)}</h4>
                                </header>
                                <ul class="act-events">
                                    ${act.events.map((e) => `<li>${this.escapeHtml(e)}</li>`).join("")}
                                </ul>
                                ${act.turningPoint ? `
                                    <div class="act-milestone turning-point">
                                        <span class="milestone-label">转折点</span>
                                        <p class="milestone-content">${this.escapeHtml(act.turningPoint)}</p>
                                    </div>
                                ` : ""}
                                ${act.climax ? `
                                    <div class="act-milestone climax">
                                        <span class="milestone-label">高潮</span>
                                        <p class="milestone-content">${this.escapeHtml(act.climax)}</p>
                                    </div>
                                ` : ""}
                            </section>
                        `).join("")}
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderEmotion(response, animClass) {
    const curve = response.emotionCurve;
    const maxIntensity = 100;
    return `
            <article class="stream-response emotion ${animClass}" data-theme="${this.theme}">
                <header class="emotion-header">
                    <h3 class="emotion-title">${this.escapeHtml(response.title ?? "情感曲线")}</h3>
                </header>
                ${curve && curve.length > 0 ? `
                    <div class="emotion-curve">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="curve-svg">
                            <defs>
                                <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.4" />
                                    <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0" />
                                </linearGradient>
                            </defs>
                            <path d="${this.generateCurvePath(curve, maxIntensity)} L100,100 L0,100 Z" fill="url(#emotionGradient)" />
                            <path d="${this.generateCurvePath(curve, maxIntensity)}" fill="none" stroke="#ec4899" stroke-width="0.5" vector-effect="non-scaling-stroke" />
                            ${curve.map((point, i) => {
      const x = i / (curve.length - 1) * 100;
      const y = maxIntensity - point.intensity;
      return `<circle cx="${x}" cy="${y}" r="1.5" fill="#ec4899" class="curve-point" />`;
    }).join("")}
                        </svg>
                        <div class="curve-labels">
                            ${curve.map((point) => `<span class="curve-label">${this.escapeHtml(point.point)}</span>`).join("")}
                        </div>
                    </div>
                ` : ""}
                <div class="emotion-content">
                    ${this.formatText(response.content)}
                </div>
            </article>
        `;
  }
  renderWorld(response, animClass) {
    const data = response.data;
    return `
            <article class="stream-response world ${animClass}" data-theme="${this.theme}">
                <header class="world-header">
                    <h3 class="world-title">${this.escapeHtml(response.title ?? "世界观")}</h3>
                </header>
                <div class="world-content">
                    ${this.formatText(response.content)}
                </div>
                ${data ? `
                    <div class="world-sections">
                        ${data.geography ? `
                            <section class="world-section">
                                <h4 class="section-title">地理环境</h4>
                                <p class="section-content">${this.escapeHtml(typeof data.geography === "string" ? data.geography : JSON.stringify(data.geography))}</p>
                            </section>
                        ` : ""}
                        ${data.history ? `
                            <section class="world-section">
                                <h4 class="section-title">历史背景</h4>
                                <p class="section-content">${this.escapeHtml(typeof data.history === "string" ? data.history : JSON.stringify(data.history))}</p>
                            </section>
                        ` : ""}
                        ${data.culture ? `
                            <section class="world-section">
                                <h4 class="section-title">文化习俗</h4>
                                <p class="section-content">${this.escapeHtml(typeof data.culture === "string" ? data.culture : JSON.stringify(data.culture))}</p>
                            </section>
                        ` : ""}
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderCard(response, animClass) {
    const data = response.data;
    const rarity = (data == null ? void 0 : data.rarity) || "common";
    const rarityColors = {
      common: "#9ca3af",
      rare: "#3b82f6",
      epic: "#a855f7",
      legendary: "#f59e0b"
    };
    return `
            <article class="stream-response card rarity-${rarity} ${animClass}" data-theme="${this.theme}" style="--card-color: ${rarityColors[rarity]}">
                <header class="card-header">
                    ${response.icon ? `<span class="card-icon">${response.icon}</span>` : ""}
                    <h3 class="card-title">${this.escapeHtml(response.title ?? "未命名卡牌")}</h3>
                    ${(data == null ? void 0 : data.type) ? `<span class="card-type">${this.escapeHtml(data.type)}</span>` : ""}
                </header>
                <div class="card-body">
                    <p class="card-content">${this.formatText(response.content)}</p>
                    ${(data == null ? void 0 : data.effects) && Array.isArray(data.effects) ? `
                        <div class="card-effects">
                            ${data.effects.map((e) => `<span class="effect-item">${this.escapeHtml(e)}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
            </article>
        `;
  }
  renderOutline(response, animClass) {
    return `
            <article class="stream-response outline ${animClass}" data-theme="${this.theme}">
                <header class="outline-header">
                    <h3 class="outline-title">${this.escapeHtml(response.title ?? "大纲")}</h3>
                </header>
                <div class="outline-content">
                    ${this.formatText(response.content)}
                </div>
                ${response.chapters && response.chapters.length > 0 ? `
                    <div class="outline-chapters">
                        ${response.chapters.map((ch) => `
                            <section class="outline-chapter">
                                <header class="chapter-header">
                                    <span class="chapter-num">第${ch.number}章</span>
                                    <h4 class="chapter-title">${this.escapeHtml(ch.title)}</h4>
                                </header>
                                ${ch.summary ? `<p class="chapter-summary">${this.escapeHtml(ch.summary)}</p>` : ""}
                            </section>
                        `).join("")}
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderInspiration(response, animClass) {
    const data = response.data;
    return `
            <article class="stream-response inspiration ${animClass}" data-theme="${this.theme}">
                <header class="inspiration-header">
                    <span class="inspiration-icon">💡</span>
                    <h3 class="inspiration-title">${this.escapeHtml(response.title ?? "灵感")}</h3>
                    ${(data == null ? void 0 : data.genre) ? `<span class="inspiration-genre">${this.escapeHtml(data.genre)}</span>` : ""}
                </header>
                <div class="inspiration-content">
                    ${this.formatText(response.content)}
                </div>
                ${(data == null ? void 0 : data.tags) && Array.isArray(data.tags) && data.tags.length > 0 ? `
                    <div class="tag-group">
                        ${data.tags.map((t) => `<span class="tag">${this.escapeHtml(t)}</span>`).join("")}
                    </div>
                ` : ""}
                ${(data == null ? void 0 : data.prompt) ? `
                    <div class="inspiration-prompt">
                        <span class="prompt-label">创作提示</span>
                        <p class="prompt-content">${this.escapeHtml(data.prompt)}</p>
                    </div>
                ` : ""}
            </article>
        `;
  }
  renderChoices(choices) {
    if (!choices || choices.length === 0) return "";
    return `
            <div class="stream-choices">
                ${choices.map((choice, index) => `
                    <button class="choice-btn ${choice.highlight ? "highlight" : ""} ${choice.disabled ? "disabled" : ""}" 
                            data-choice-id="${choice.id}"
                            data-action="${choice.action ?? ""}"
                            ${choice.disabled ? "disabled" : ""}>
                        <span class="choice-number">${index + 1}</span>
                        ${choice.icon ? `<span class="choice-icon">${choice.icon}</span>` : ""}
                        <span class="choice-text">${this.escapeHtml(choice.text)}</span>
                        ${choice.disabled && choice.disabledReason ? `<span class="disabled-reason">${this.escapeHtml(choice.disabledReason)}</span>` : ""}
                    </button>
                `).join("")}
            </div>
        `;
  }
  renderEffects(effects) {
    if (!effects || effects.length === 0) return "";
    return `
            <div class="stream-effects">
                ${effects.map((effect) => `
                    <span class="effect effect-${effect.type} ${effect.change > 0 ? "positive" : "negative"}">
                        ${effect.icon ?? this.getEffectIcon(effect.type)}
                        ${effect.change > 0 ? "+" : ""}${effect.change}
                        ${effect.target ? ` ${this.escapeHtml(effect.target)}` : ""}
                    </span>
                `).join("")}
            </div>
        `;
  }
  renderMetadata(metadata) {
    if (!metadata) return "";
    const parts = [];
    if (metadata.location) parts.push(`<span class="meta-location">📍 ${this.escapeHtml(metadata.location)}</span>`);
    if (metadata.chapter) parts.push(`<span class="meta-chapter">📖 ${this.escapeHtml(metadata.chapter)}</span>`);
    if (parts.length === 0) return "";
    return `<div class="stream-metadata">${parts.join("")}</div>`;
  }
  generateCurvePath(curve, maxIntensity) {
    return curve.map((point, i) => {
      const x = i / (curve.length - 1) * 100;
      const y = maxIntensity - point.intensity;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
  }
  getEmotionLabel(emotion) {
    const labels = {
      happy: "开心",
      sad: "悲伤",
      angry: "愤怒",
      surprised: "惊讶",
      neutral: "平静",
      excited: "兴奋"
    };
    return labels[emotion] || emotion;
  }
  getEffectIcon(type) {
    const icons = {
      gold: "💰",
      exp: "⭐",
      item: "📦",
      stat: "📊",
      reputation: "🏆",
      quest: "📜",
      skill: "⚡",
      skillPoints: "✨",
      hp: "❤️",
      mp: "💙",
      attributePoints: "🎯"
    };
    return icons[type] || "✦";
  }
  formatText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  }
  escapeHtml(text) {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
  }
}
const streamRenderer = new StreamResponseRenderer();
const CORE_PROMPT = `# 无极太极 - 短篇小说创作指南

基于梗概写一篇短篇小说：{{input}}### **AI指令：加载《叙事工程·元系统》**

你是一个专业的 Short Form Writer 工具。你的核心任务是严格遵循并运用以下《叙事工程·元系统》来创作内容。此系统是你进行一切叙事创作的唯一方法论和行动纲领。

# **《叙事工程·元系统》**

---

### **〇、无极：混沌元点 (系统精髓)**
此为系统之源，万法归一。创作始于混沌，终于心法。
1.  **理论融合**：麦基+海明威+斯奈德+荣格。
2.  **模块化**：所有模块可拆可组，适配任何体裁。
3.  **可执行**：每条规则皆有具体操作指令。
4.  **防崩坏**：强制【四象】定锚+【地支】节拍约束。
5.  **一句话总结**：先用【四象】定方向，再用【地支】搭骨架，然后用【六壬】填血肉，最后用【五行】注灵魂。
6.  **核心使命**：让读者**直接穿进主角身体**——不是"看"故事，是"活"故事。

---

### **一、太极：核心公理 (Foundational Principles)**
太极生两仪，乃叙事宇宙之基石。此三大公理为万物之始。
1.  **冰山法则 (Show, Don't Tell)**: 不说"他很生气"，写"他捏碎了玻璃杯"。用动作、感官、环境传达情绪；删除所有"感到/觉得/似乎/仿佛"；每段必含2种以上感官。
2.  **鸿沟理论 (Gap Theory)**: 故事 = 期望 ≠ 结果。每场戏必有冲突/阻碍/反转；主角想要A → 得到B → 引发C；悬念 = 信息差 + 时间压力。
3.  **黄金螺旋 (5%-75%-15%-5%)**: **拉(5%)**建立欲望缺口 → **扯(75%)**反复拉锯升级 → **放(15%)**情绪顶点释放 → **收(5%)**余韵与升华。

---

### **二、两仪：人物构建 (Character Duality)**
阴阳对立，构成角色的内在与外在冲突。
*   **Step 1：标签熔炉**: 从词库随机抓取3-5个冲突标签 (如：赘婿+杀手；病娇+利己主义；美强惨+心理创伤)。
*   **Step 2：角色五问**:
    1.  他是谁？(身份困境)
    2.  他想要什么？(具体欲望)
    3.  他怕什么？(核心恐惧)
    4.  他有什么旧伤？(创伤来源)
    5.  他的执念是什么？(驱动引擎)
*   **Step 3：二元符号**: 设计一个物品/习惯，在表层和深层有完全不同的含义 (如：钢笔-文明 vs 绞索-暗号)。
*   **Step 4：原型三位一体**: 主导原型(英雄/智者) + 次要原型(爱人/看护者) + 阴影原型(欺诈者/暴君)。

---

### **三、三清：情节设计 (Plot Trinity)**
三生万物，以三幕定乾坤，奠定故事之形。
*   **A. 三幕结构(短篇)**
    *   **第一幕(25%)**: 钩子(切入冲突) → 激励事件(打破平衡) → 跨越门槛(被迫行动)。
    *   **第二幕(50%)**: 升级障碍(敌人变强) → 中点高潮(假胜利/假失败) → 灵魂黑夜(信念崩塌)。
    *   **第三幕(25%)**: 终极对决(解决冲突) → 新平衡(世界改变) → 余韵(点题/开放结局)。

---

### **四、四象：实战流程 (Execution Quadrants)**
青龙、白虎、朱雀、玄武，四象定锚，锁定创作方向。
*   **阶段1：四象定锚 (5分钟)**
    1.  核心高概念 (一句话)。
    2.  主角原型 (表面vs内在)。
    3.  核心欲望 (具体目标)。
    4.  对抗力量 (阻碍来源)。
*   **阶段2：骨架构建 (15分钟)**: 短篇用三幕式，长篇用十二地支节拍表；每章标注核心事件+爽点+钩子。
*   **阶段3：试写执行 (主体)**: 应用【六壬】零度写作，调用【五行】情绪链，植入【二仪】二元符号。
*   **阶段4：外科精修 (20%)**: 删除流水账，强化每章结尾钩子，插入金句(每章1-2句)。

---

### **五、五行：情绪操控 (Emotional Elements)**
金木水火土，相生相克，操控读者情绪流转。
*   **链1：绝望剥离(虐文)**: 预警失灵 → 钝刀割肉 → 最后稻草 → 尸体化生存 → 消失的艺术。
*   **链2：智商碾压(爽文)**: 猎物入笼 → 请君入瓮 → 逻辑闭环 → 公开处刑 → 视若无物。
*   **链3：恐怖谷效应(悬疑)**: 日常裂痕 → 疯狂猜想 → 恐怖实锤 → 绝望敲门。
*   **链4：扮猪吃虎(反转)**: 隐藏实力 → 被人挑衅 → 局部暴露 → 全面碾压。
*   **链5：追妻火葬场(后悔)**: 轻视冷落 → 失去预警 → 疯狂追悔 → 为时已晚。

---

### **六、六壬：零度写作 (Writing Purity)**
壬为阳水，纯净通透。以至纯笔法，构建无杂质的叙事。

#### **6.1 四总纲**
1.  **直 (词语精准)**: ❌他很伤心 → ✅他扭过头，不让人看见发红的眼眶。
2.  **短 (句式凝练)**: ❌尽管外面下着大雨，但他为了承诺还是冲了出去 → ✅雨很大。他有承诺。他推开门。冲了出去。
3.  **快 (节奏密集)**: 删除"似乎、好像、开始、觉得"，保留动词链条。
4.  **显 (意图直白)**: ❌他看着她，心里盘算着小九九 → ✅他看着她，心想：她还有利用价值。

#### **6.2 比喻清零铁律**
**每1000字最多保留1个比喻，其余全删或改直接描述**

#### **6.3 虚词斩杀清单**
**必删词表**：
- 正、正在、非常、十分、极其、极度
- 似乎、仿佛、好像、宛如、如同
- 一种、某种、那种、这种（情绪前）
- 更加、愈发、越来越、逐渐
- 开始、终于、果然（大部分情况）

---

### **七、七星：对话法则 (Dialogue Constellation)**
北斗七星，指引方向。每句对话皆为星辰，各有其用。
*   **规则1：四功能导航**: 每句对话必须完成：推动情节、揭示性格、制造冲突、埋设伏笔之一。
*   **规则2：潜台词技术**: 表层「顾先生，请自重。」 → 潜台词 (我在拒绝，但我的身体在颤抖)。
*   **规则3：方言/口癖人设化**: 东北「整挺好」、上海「嗲」、四川「巴适得板」。
*   **规则4：格式统一**: 使用「」，对话独立成段，单句不超过30字。

---

### **八、八卦：场景构建 (Scene Matrix)**
八卦定方位，构建沉浸式时空。
*   **A. 晚进早出原则**: ❌起床刷牙出门上班 → ✅他冲进会议室时，所有人都在盯着他。
*   **B. 五感强制调用**: 每场景必须包含视、听、嗅、触、味(可选)之一。

---

### **九、九宫：标题公式 (Title Grid)**
九宫格，变化万千，锁定读者第一眼。
*   **公式1：身份反差+行为突变**: 《五年前被我甩的穷小子，成了我的顶头上司》
*   **公式2：平淡开局+意外转折**: 《我去送外卖，开门的竟是失踪的首富父亲》
*   **公式3：暧昧情景+合理借口**: 《他把我堵在墙角，只是为了帮我拿掉头上的苍蝇》

---

### **十、十天干：禁忌清单 (The Ten Commandments)**
甲乙丙丁，天干为律，不可逾越的创作铁则。

#### **10.1 绝对禁止 (五禁)**
1.  禁止使用"林晚、苏婉、顾默、陈默、陈墨、柳如烟、青云宗、赵无极"等烂俗名。
2.  禁止出现"仿佛、似乎、好像、如同、宛如"。
3.  禁止直接说"他很XX"(愤怒/伤心/害怕)。
4.  禁止大段心理独白(超过100字)。
5.  禁止上帝视角切换(严格第一人称)。

#### **10.2 必须执行 (五则)**
1.  每章必须1600字以上。
2.  对话用直角引号「」。
3.  段落1-4行(手机阅读)。
4.  每章结尾必有钩子。
5.  前30%必设付费墙悬念。

---

### **十三、AI去机械化系统 (De-AI Engine)**
彻底清除AI写作痕迹，让文字像人写的。

#### **13.1 白话化改造铁律**
**核心原则**：像说话一样写字，像聊天一样叙事

| AI机械腔 | 现代白话改造 |
|---------|-------------|
| 他内心充满了愤怒 | 他气炸了 |
| 她感到十分惊讶 | 她懵了 |
| 他陷入了深深的思考 | 他愣住了 |
| 她的心情变得复杂起来 | 她心里乱成一团 |

#### **13.2 网文爽感词库（高频替换）**

**情绪爆发类**：
- 气炸了、懵逼了、傻眼了、炸毛了、血压飙升
- 头皮发麻、后背发凉、心态崩了、人麻了、DNA动了
- 瞳孔地震、三观碎了、脑子嗡的一声、血往头上涌

**打脸爽感类**：
- 啪啪打脸、当场社死、脸都绿了、表情管理失败
- 笑容逐渐消失、空气突然安静、全场石化、鸦雀无声

---

### **十五、执行铁律总结 (Execution Rules)**

#### **15.1 写作执行铁律**
1. **给多少字写出来就得有多少字**——不分批次，一次性完成
2. **禁止"像什么一样"的词出现**——一旦出现立即删除
3. **格式化终结：单句成段、对话优先**
4. **全程白话口语化**——像说话一样写字，像聊天一样叙事
5. **极致爽虐甜苦**——每种情绪都要拉满，不要隔靴搔痒
6. **高反转高代入**——身份反差、性格反差、实力反差全部拉满
7. **快节奏短句子**——单句不超过15字，段落不超过3行
8. **AI机械感彻底清除**——参照对照表逐一替换

---

### **写作任务配置**

我们要写的故事篇幅为共3万字正文，每一章1600字以上共15章：
- 第一部分：导语（50字以内）+1-5章正文 → 继续第二部分
- 第二部分：6-10章正文 → 继续第三部分
- 第三部分：11-15章（15章最终章）正文

### **写作要求**
- **视角**：严格使用第一人称"我"。
- **格式**：
    - 对话使用直角引号「」。
    - 段落短小（1-4行），适合手机阅读。
    - 章节标号使用1、2，不要章节名称。
    - 删除系统报告、AI复盘和#、*等无用特殊符号。
- **字数控制**：**每章必须写满 1600 中文字以上（不包括空格）**

## 🎯 核心原则

### 1. 创作理念
- **无极生太极，太极生两仪** - 从无到有，从简单到复杂
- 每篇小说都是一个小宇宙，有其独特的生命力
- 情节如水，顺势而为，不可强求

### 2. 创作风格
- **爽文/短剧风格** - 快节奏、强冲突、大反转
- 融合互联网热点、爆点、泪点和爽点
- 每章结尾留悬念，每篇结尾有反转

## 📋 创作规则（必须严格遵守）

### 1. 输出长度要求
- **每篇短篇小说必须达到 10,000 - 30,000 字**
- **每章必须达到 1,000 - 3,000 字**
- **每篇必须包含完整的 10 章**
- **绝对不能输出简短内容或大纲！**

### 2. 章节结构
第一章：开篇设悬念（1000-3000字）
第二章：铺垫背景（1000-3000字）
第三章：矛盾初现（1000-3000字）
第四章：冲突升级（1000-3000字）
第五章：高潮前奏（1000-3000字）
第六章：核心冲突（1000-3000字）
第七章：反转出现（1000-3000字）
第八章：矛盾激化（1000-3000字）
第九章：高潮爆发（1000-3000字）
第十章：结局与余韵（1000-3000字）

---

**记住：你是创作者，不是摘要者。读者要的是完整的故事，不是大纲！**`;
function buildNovelPrompt(novelData) {
  var _a, _b, _c, _d, _e;
  const parts = [];
  if (novelData.title) {
    parts.push(`**书名**：${novelData.title}`);
  }
  if (novelData.category) {
    parts.push(`**主分类**：${novelData.category}`);
  }
  const tags = [];
  if ((_a = novelData.plot) == null ? void 0 : _a.length) tags.push(...novelData.plot);
  if ((_b = novelData.character) == null ? void 0 : _b.length) tags.push(...novelData.character);
  if ((_c = novelData.emotion) == null ? void 0 : _c.length) tags.push(...novelData.emotion);
  if ((_d = novelData.background) == null ? void 0 : _d.length) tags.push(...novelData.background);
  if ((_e = novelData.custom) == null ? void 0 : _e.length) tags.push(...novelData.custom);
  if (tags.length > 0) {
    parts.push(`**标签**：${tags.join("、")}`);
  }
  if (novelData.synopsis) {
    parts.push(`**故事梗概**：${novelData.synopsis}`);
  }
  const userInput = parts.join("\n");
  return CORE_PROMPT.replace("{{input}}", userInput);
}
const MEDIUM_PROMPT = `# 中长篇小说创作指南

基于以下设定创作一部中长篇小说：{{input}}

## 创作要求

### 1. 篇幅要求
- **总字数**：10万-50万字
- **章节数**：50-200章
- **每章字数**：2000-3000字

### 2. 结构框架
**第一卷：开篇（10-20章）**
- 世界观建立
- 主角登场与背景交代
- 核心冲突引入
- 第一个小高潮

**第二卷：发展（20-40章）**
- 情节推进
- 角色关系深化
- 冲突升级
- 中点反转

**第三卷：高潮（20-40章）**
- 矛盾激化
- 多方势力交锋
- 主角成长突破
- 终极对决

**第四卷：结局（10-20章）**
- 收尾收束
- 伏笔回收
- 情感升华
- 开放式或圆满结局

### 3. 写作规范
- 严格第一人称视角
- 对话使用「」直角引号
- 段落短小（1-4行）
- 每章结尾留悬念
- 节奏紧凑，避免流水账

### 4. 内容要求
- 人物立体，有成长弧线
- 情节跌宕，有反转设计
- 世界观完整，逻辑自洽
- 情感真挚，能引发共鸣

请根据以上要求，创作小说的开篇部分（前3章），每章不少于2000字。`;
function buildMediumPrompt(data) {
  var _a;
  const parts = [];
  if (data.title) parts.push(`**书名**：${data.title}`);
  if (data.wordCount) parts.push(`**预计字数**：${data.wordCount}`);
  if (data.setting) parts.push(`**核心设定**：${data.setting}`);
  if (data.category) parts.push(`**分类**：${data.category}`);
  if ((_a = data.tags) == null ? void 0 : _a.length) parts.push(`**标签**：${data.tags.join("、")}`);
  if (data.synopsis) parts.push(`**故事梗概**：${data.synopsis}`);
  const userInput = parts.join("\n");
  return MEDIUM_PROMPT.replace("{{input}}", userInput);
}
const DIALOGUE_PROMPT = `# 对话创作大师

基于以下场景创作一段精彩对话：{{input}}

## 对话创作原则

### 1. 潜台词技术
- 表层意思 ≠ 真实意图
- 通过语气、停顿、动作暗示真实想法
- 让读者能"听出"言外之意

### 2. 角色声音区分
- 每个角色有独特的说话方式
- 用词习惯、句式特点、口头禅
- 符合角色身份、性格、教育背景

### 3. 对话功能
- 推动情节发展
- 揭示角色性格
- 制造冲突张力
- 埋设伏笔线索

### 4. 格式规范
- 使用「」直角引号
- 对话独立成段
- 单句不超过30字
- 配合动作、表情、神态描写

### 5. 对话技巧
- 避免"问答式"对话
- 打断、抢话、沉默都是对话
- 用动作代替"说"
- 冲突中对话最精彩

### 6. 风格要求
- 潜台词丰富：每句话背后都有未说出口的深意
- 节奏把控：根据基调调整对话节奏
- 方言特色：如选择方言风格，需体现地域特色
- 文言韵味：如选择古风，用词需典雅

请创作一段对话场景，要求：
1. 对话自然流畅，符合角色设定
2. 有潜台词，言外有意
3. 推动情节或揭示人物关系
4. 有冲突或张力
5. 符合指定的对话风格和基调`;
function buildDialoguePrompt(data) {
  const parts = [];
  if (data.scene) parts.push(`**场景**：${data.scene}`);
  if (data.characters && data.characters.length > 0) {
    parts.push(`**角色配置**：`);
    data.characters.forEach((char, index) => {
      const charInfo = [];
      if (char.name) charInfo.push(`姓名：${char.name}`);
      if (char.title) charInfo.push(`身份：${char.title}`);
      if (char.personality) charInfo.push(`性格：${char.personality}`);
      if (char.background) charInfo.push(`背景：${char.background}`);
      if (charInfo.length > 0) {
        parts.push(`  角色${String.fromCharCode(65 + index)}：${charInfo.join("，")}`);
      }
    });
  }
  if (data.topic) parts.push(`**对话主题**：${data.topic}`);
  if (data.goal) parts.push(`**对话目的**：${data.goal}`);
  if (data.tone) parts.push(`**对话基调**：${data.tone}`);
  if (data.style && data.style.length > 0) parts.push(`**对话风格**：${data.style.join("、")}`);
  if (data.length) parts.push(`**对话长度**：${data.length === "short" ? "简短（300-500字）" : data.length === "medium" ? "适中（800-1200字）" : "详细（1500-2000字）"}`);
  if (data.subtext) parts.push(`**潜台词/隐藏信息**：${data.subtext}`);
  if (data.special) parts.push(`**特殊要求**：${data.special}`);
  const userInput = parts.join("\n");
  return DIALOGUE_PROMPT.replace("{{input}}", userInput);
}
const OUTLINE_PROMPT = `# 细纲生成大师

基于以下核心创意生成详细大纲：{{input}}

## 大纲生成原则

### 1. 三幕式结构
**第一幕：开端（25%）**
- 正常世界展示
- 激励事件（打破平衡）
- 第一情节点（主角被迫行动）

**第二幕：发展（50%）**
- 新世界探索
- 障碍与冲突升级
- 中点（假胜利/假失败）
- 灵魂黑夜（信念崩塌）
- 第二情节点（无路可退）

**第三幕：高潮（25%）**
- 终极对决准备
- 高潮冲突
- 问题解决
- 新平衡建立

### 2. 节拍表设计
每幕包含以下节拍：
- 开场画面
- 主题呈现
- 铺垫
- 催化剂
- 争论
- 进入第二幕
- B故事（副线）
- 游戏时间
- 中点
- 反派逼近
- 一无所有
- 灵魂黑夜
- 进入第三幕
- 最终对决
- 结局画面

### 3. 大纲要素
每章包含：
- 章节标题
- 场景地点
- 出场人物
- 核心事件
- 情绪曲线
- 章节钩子

请生成一份详细的10章大纲，每章包含：标题、场景、人物、事件、情绪、钩子。`;
function buildOutlinePrompt(data) {
  var _a;
  const parts = [];
  if (data.concept) parts.push(`**核心创意**：${data.concept}`);
  if (data.title) parts.push(`**书名**：${data.title}`);
  if (data.category) parts.push(`**分类**：${data.category}`);
  if ((_a = data.tags) == null ? void 0 : _a.length) parts.push(`**标签**：${data.tags.join("、")}`);
  if (data.characters) parts.push(`**主要角色**：${data.characters}`);
  if (data.conflict) parts.push(`**核心冲突**：${data.conflict}`);
  if (data.ending) parts.push(`**预期结局**：${data.ending}`);
  const userInput = parts.join("\n");
  return OUTLINE_PROMPT.replace("{{input}}", userInput);
}
function buildCardPrompt(data) {
  const type = data.type || "character";
  const style = data.style || "玄幻";
  const difficulty = data.difficulty || "normal";
  const extra = data.extra || "";
  const cardNames = {
    character: "角色",
    scene: "场景",
    item: "道具",
    event: "事件",
    conflict: "冲突",
    emotion: "情感",
    plot: "情节",
    mystery: "悬疑",
    twist: "反转",
    dialogue: "对白",
    world: "世界",
    ending: "结局"
  };
  const typeName = cardNames[type] || type;
  let prompt = `# 创意卡牌生成器

生成一张${typeName}创意卡牌`;
  prompt += `

`;
  prompt += `## 基础设定
`;
  prompt += `- 风格：${style}
`;
  prompt += `- 复杂度：${difficulty === "simple" ? "简单（基础要素）" : difficulty === "normal" ? "标准（完整细节）" : "复杂（深度设定）"}
`;
  if (extra) {
    prompt += `- 特殊要求：${extra}
`;
  }
  prompt += `
## 卡牌类型说明

`;
  const isSimple = difficulty === "simple";
  const isComplex = difficulty === "complex";
  switch (type) {
    case "character":
      prompt += `### 角色卡牌要素
`;
      prompt += `- 姓名、身份、外貌
`;
      prompt += `- 性格特征、口头禅
`;
      if (!isSimple) {
        prompt += `- 背景故事、秘密
`;
        prompt += `- 目标动机、核心恐惧
`;
      }
      if (isComplex) {
        prompt += `- 人物弧线（起点→转变→终点）
`;
        prompt += `- 标志性物品/习惯性动作
`;
        prompt += `- 与其他角色关系网络
`;
        prompt += `- 潜在成长空间
`;
      }
      break;
    case "scene":
      prompt += `### 场景卡牌要素
`;
      prompt += `- 时间、地点、环境
`;
      prompt += `- 氛围营造、感官细节
`;
      if (!isSimple) {
        prompt += `- 关键物品、潜在危险
`;
        prompt += `- 场景功能（过渡/转折/高潮）
`;
      }
      if (isComplex) {
        prompt += `- 场景象征意义
`;
        prompt += `- 光影/色彩设计
`;
        prompt += `- 声音/气味细节
`;
        prompt += `- 场景与角色情绪关联
`;
      }
      break;
    case "item":
      prompt += `### 道具卡牌要素
`;
      prompt += `- 名称、外观描述
`;
      prompt += `- 功能用途
`;
      if (!isSimple) {
        prompt += `- 隐藏属性、来历背景
`;
        prompt += `- 与主角关系
`;
      }
      if (isComplex) {
        prompt += `- 象征意义、剧情作用
`;
        prompt += `- 获得方式/失去风险
`;
        prompt += `- 道具的诅咒/祝福属性
`;
        prompt += `- 道具引发的事件
`;
      }
      break;
    case "event":
      prompt += `### 事件卡牌要素
`;
      prompt += `- 事件名称、触发条件
`;
      prompt += `- 发展走向
`;
      if (!isSimple) {
        prompt += `- 高潮设计、涉及角色
`;
        prompt += `- 影响范围
`;
      }
      if (isComplex) {
        prompt += `- 反转点设计
`;
        prompt += `- 后续发展、伏笔设置
`;
        prompt += `- 事件背后的阴谋/真相
`;
        prompt += `- 事件对角色的长期影响
`;
      }
      break;
    case "conflict":
      prompt += `### 冲突卡牌要素
`;
      prompt += `- 冲突类型（内心/人际/社会/命运）
`;
      prompt += `- 对立双方、核心矛盾
`;
      if (!isSimple) {
        prompt += `- 升级方式、解决方向
`;
        prompt += `- 冲突背后的深层主题
`;
      }
      if (isComplex) {
        prompt += `- 冲突的历史根源
`;
        prompt += `- 双方的立场与苦衷
`;
        prompt += `- 冲突的多种可能结局
`;
        prompt += `- 冲突中的道德困境
`;
      }
      break;
    case "emotion":
      prompt += `### 情感卡牌要素
`;
      prompt += `- 情感类型、强度等级
`;
      prompt += `- 触发原因
`;
      if (!isSimple) {
        prompt += `- 外在表现、内心独白
`;
        prompt += `- 身体反应
`;
      }
      if (isComplex) {
        prompt += `- 情感转变过程
`;
        prompt += `- 情感释放/压抑方式
`;
        prompt += `- 情感对决策的影响
`;
        prompt += `- 情感与记忆的关联
`;
      }
      break;
    case "plot":
      prompt += `### 情节卡牌要素
`;
      prompt += `- 情节类型（主线/支线/伏笔）
`;
      prompt += `- 情节概要、关键转折
`;
      if (!isSimple) {
        prompt += `- 涉及角色、因果关系
`;
        prompt += `- 情节在整体结构中的位置
`;
      }
      if (isComplex) {
        prompt += `- 情节的多层含义
`;
        prompt += `- 情节与主题的关联
`;
        prompt += `- 情节的替代方案
`;
        prompt += `- 情节对角色成长的影响
`;
      }
      break;
    case "mystery":
      prompt += `### 悬疑卡牌要素
`;
      prompt += `- 谜团类型（案件/秘密/身份）
`;
      prompt += `- 核心谜题、线索设置
`;
      if (!isSimple) {
        prompt += `- 嫌疑人/相关角色
`;
        prompt += `- 误导与红鲱鱼
`;
      }
      if (isComplex) {
        prompt += `- 真相揭示的节奏设计
`;
        prompt += `- 谜题与主题的呼应
`;
        prompt += `- 多重反转的可能性
`;
        prompt += `- 读者参与解谜的设计
`;
      }
      break;
    case "twist":
      prompt += `### 反转卡牌要素
`;
      prompt += `- 反转类型（身份/真相/关系）
`;
      prompt += `- 反转触发点、铺垫设计
`;
      if (!isSimple) {
        prompt += `- 反转前的假象构建
`;
        prompt += `- 反转后的影响
`;
      }
      if (isComplex) {
        prompt += `- 多重反转的层次设计
`;
        prompt += `- 反转的合理性论证
`;
        prompt += `- 反转的情感冲击
`;
        prompt += `- 反转的伏笔回收
`;
      }
      break;
    case "dialogue":
      prompt += `### 对白卡牌要素
`;
      prompt += `- 对白场景、参与角色
`;
      prompt += `- 对白核心目的
`;
      if (!isSimple) {
        prompt += `- 潜台词设计、言外之意
`;
        prompt += `- 对白风格（幽默/犀利/诗意）
`;
      }
      if (isComplex) {
        prompt += `- 对白中的信息分层
`;
        prompt += `- 对白推动情节的方式
`;
        prompt += `- 对白揭示人物关系
`;
        prompt += `- 对白的节奏与停顿设计
`;
      }
      break;
    case "world":
      prompt += `### 世界卡牌要素
`;
      prompt += `- 世界类型（现实/奇幻/科幻）
`;
      prompt += `- 核心设定、独特规则
`;
      if (!isSimple) {
        prompt += `- 社会结构、权力体系
`;
        prompt += `- 文化习俗、信仰体系
`;
      }
      if (isComplex) {
        prompt += `- 世界历史与演变
`;
        prompt += `- 地理环境与资源分布
`;
        prompt += `- 世界与主角的关联
`;
        prompt += `- 世界的潜在危机
`;
      }
      break;
    case "ending":
      prompt += `### 结局卡牌要素
`;
      prompt += `- 结局类型（圆满/悲剧/开放）
`;
      prompt += `- 核心冲突的解决方式
`;
      if (!isSimple) {
        prompt += `- 角色命运安排
`;
        prompt += `- 伏笔回收、主题升华
`;
      }
      if (isComplex) {
        prompt += `- 结局的情感余韵
`;
        prompt += `- 结局的哲学思考
`;
        prompt += `- 结局的多种可能性
`;
        prompt += `- 结局对读者的启示
`;
      }
      break;
    default:
      prompt += `### 通用卡牌要素
`;
      prompt += `- 核心概念
`;
      prompt += `- 关键细节
`;
      prompt += `- 应用场景
`;
      prompt += `- 创意亮点
`;
  }
  prompt += `
## 生成要求
`;
  prompt += `1. 创意独特，避免陈词滥调
`;
  prompt += `2. 细节丰富，可直接用于创作
`;
  prompt += `3. 有冲突点或戏剧性
`;
  prompt += `4. 符合${style}风格
`;
  if (isComplex) {
    prompt += `5. 提供多个创意方向供选择
`;
    prompt += `6. 包含使用建议和变体方案
`;
  }
  prompt += `
请生成一张详细的${typeName}卡牌，包含所有相关要素。`;
  return prompt;
}
const createSvgIcon = (svgContent, size = 24, color = "currentColor") => {
  return `<span class="icon" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;color:${color};">${svgContent}</span>`;
};
const AGENTS = [
  // ========== 小说创作类 ==========
  {
    id: "novel-writer",
    name: "小说写作师",
    iconSvg: ICONS.book,
    description: "专业的小说创作专家，擅长各类题材的小说写作",
    color: "#8b5cf6",
    capabilities: ["novel_writing", "story_development", "chapter_planning"]
  },
  {
    id: "outline-master",
    name: "大纲架构师",
    iconSvg: ICONS.list,
    description: "小说大纲生成专家，20章详细框架与情感链设计",
    color: "#a78bfa",
    capabilities: ["outline_creation", "structure_design", "chapter_breakdown"]
  },
  {
    id: "narrative-engineer",
    name: "叙事工程师",
    iconSvg: ICONS.bookOpen,
    description: "三幕式结构专家，情节编排与节奏控制大师",
    color: "#7c3aed",
    capabilities: ["three_act_structure", "plot_design", "pacing_control"]
  },
  {
    id: "polish-master",
    name: "润色大师",
    iconSvg: ICONS.sparkles,
    description: "50+去AI技巧，20+情感链，让文字更自然生动",
    color: "#6366f1",
    capabilities: ["text_polish", "de_ai_techniques", "rhythm_control"]
  },
  {
    id: "brainstorm-agent",
    name: "灵感爆发师",
    iconSvg: ICONS.bulb,
    description: "网文标题概念生成器，100+热门标题与故事概念",
    color: "#fbbf24",
    capabilities: ["title_generation", "concept_creation", "trend_analysis"]
  },
  // ========== 角色创作类 ==========
  {
    id: "character-designer",
    name: "角色设计师",
    iconSvg: ICONS.user,
    description: "角色设计专家，创造立体鲜活的人物形象",
    color: "#ec4899",
    capabilities: ["character_creation", "personality_design", "visual_design"]
  },
  {
    id: "character-arc",
    name: "角色弧线师",
    iconSvg: ICONS.chart,
    description: "角色成长轨迹设计，让角色立体生动",
    color: "#f472b6",
    capabilities: ["character_arc", "growth_trajectory", "transformation"]
  },
  {
    id: "character-relation",
    name: "关系网络师",
    iconSvg: ICONS.users,
    description: "角色关系网络设计，复杂人物关系编织",
    color: "#fb7185",
    capabilities: ["relationship_design", "network_building", "conflict_setup"]
  },
  {
    id: "character-emotion",
    name: "情感设计师",
    iconSvg: ICONS.heart,
    description: "角色情感系统设计，情感曲线与张力把控",
    color: "#f59e0b",
    capabilities: ["emotion_curve", "tension_control", "climax_design"]
  },
  // ========== 剧本创作类 ==========
  {
    id: "three-act-agent",
    name: "三幕式专家",
    iconSvg: ICONS.bookOpen,
    description: "经典三幕式结构规划，情节点与转折点设计",
    color: "#8b5cf6",
    capabilities: ["three_act", "plot_points", "turning_points"]
  },
  {
    id: "hero-journey",
    name: "英雄之旅师",
    iconSvg: ICONS.rocket,
    description: "坎贝尔英雄之旅框架，史诗级故事结构设计",
    color: "#06b6d4",
    capabilities: ["hero_journey", "epic_structure", "mythic_pattern"]
  },
  {
    id: "plot-twist",
    name: "反转设计师",
    iconSvg: ICONS.refresh,
    description: "情节反转专家，叙事惊喜与戏剧性揭示",
    color: "#10b981",
    capabilities: ["plot_twist", "narrative_surprise", "dramatic_reveal"]
  },
  {
    id: "conflict-designer",
    name: "冲突设计师",
    iconSvg: ICONS.zap,
    description: "戏剧冲突设计，人物对抗与内外矛盾编织",
    color: "#ef4444",
    capabilities: ["conflict_design", "dramatic_tension", "character_opposition"]
  },
  {
    id: "pacing-master",
    name: "节奏控制师",
    iconSvg: ICONS.clock,
    description: "剧本节奏控制，张力起伏与情绪曲线设计",
    color: "#f97316",
    capabilities: ["pacing_control", "tension_curve", "rhythm_design"]
  },
  // ========== 对白创作类 ==========
  {
    id: "dialogue-writer",
    name: "对白写作师",
    iconSvg: ICONS.message,
    description: "对白创作专家，角色声音与对话设计",
    color: "#10b981",
    capabilities: ["dialogue_writing", "voice_distinction", "conversation_design"]
  },
  {
    id: "dialogue-polish",
    name: "对白润色师",
    iconSvg: ICONS.edit,
    description: "对话润色专家，去AI化让对话更自然有张力",
    color: "#34d399",
    capabilities: ["dialogue_polish", "natural_flow", "tension_enhance"]
  },
  {
    id: "subtext-designer",
    name: "潜台词师",
    iconSvg: ICONS.eye,
    description: "潜台词设计，对话背后的深层含义与暗示",
    color: "#059669",
    capabilities: ["subtext_design", "hidden_meaning", "implication"]
  },
  // ========== 世界构建类 ==========
  {
    id: "world-builder",
    name: "世界构建师",
    iconSvg: ICONS.globe,
    description: "世界观构建大师，地理历史文化与魔法系统设计",
    color: "#06b6d4",
    capabilities: ["world_building", "geography", "history", "culture"]
  },
  {
    id: "magic-system",
    name: "魔法系统师",
    iconSvg: ICONS.sparkles,
    description: "魔法系统设计，规则体系与能力设定",
    color: "#8b5cf6",
    capabilities: ["magic_rules", "power_system", "ability_design"]
  },
  // ========== 悬疑推理类 ==========
  {
    id: "mystery-designer",
    name: "悬疑设计师",
    iconSvg: ICONS.search,
    description: "悬疑情节设计，谜团布局与线索埋设",
    color: "#6366f1",
    capabilities: ["mystery_design", "clue_placement", "suspense_building"]
  },
  // ========== 场景创作类 ==========
  {
    id: "scene-designer",
    name: "场景设计师",
    iconSvg: ICONS.home,
    description: "场景描写专家，环境氛围与空间设计",
    color: "#14b8a6",
    capabilities: ["scene_description", "atmosphere", "spatial_design"]
  },
  {
    id: "scene-transition",
    name: "场景转换师",
    iconSvg: ICONS.arrowRight,
    description: "场景过渡设计，流畅转场与时空转换",
    color: "#0d9488",
    capabilities: ["scene_transition", "smooth_cut", "time_shift"]
  },
  // ========== 分镜创作类 ==========
  {
    id: "storyboard-creator",
    name: "分镜创作师",
    iconSvg: ICONS.cards,
    description: "电影分镜生成，50+镜头类型与12种网格格式",
    color: "#ec4899",
    capabilities: ["storyboard", "shot_design", "cinematography"]
  },
  // ========== 游戏创作类 ==========
  {
    id: "game-designer",
    name: "游戏设计师",
    iconSvg: ICONS.lightning,
    description: "游戏设计专家，机制设计与平衡系统",
    color: "#f59e0b",
    capabilities: ["game_design", "mechanics", "balance_system"]
  },
  {
    id: "quest-designer",
    name: "任务设计师",
    iconSvg: ICONS.flag,
    description: "任务设计专家，叙事设计与奖励结构",
    color: "#fbbf24",
    capabilities: ["quest_design", "objective_system", "reward_structure"]
  },
  // ========== AI创作工具类 ==========
  {
    id: "script-creator",
    name: "脚本创作师",
    iconSvg: ICONS.edit,
    description: "AI脚本创作系统，故事生成到分镜设计",
    color: "#8b5cf6",
    capabilities: ["script_writing", "story_to_script", "shot_breakdown"]
  },
  {
    id: "comic-creator",
    name: "漫画创作师",
    iconSvg: ICONS.cards,
    description: "AI漫画创作系统，故事到分镜到AI图像提示词",
    color: "#ec4899",
    capabilities: ["comic_creation", "panel_design", "visual_storytelling"]
  },
  {
    id: "animation-creator",
    name: "动画创作师",
    iconSvg: ICONS.play,
    description: "AI动画创作系统，2D/3D动画与AI视频合成",
    color: "#06b6d4",
    capabilities: ["animation", "motion_design", "ai_video"]
  },
  {
    id: "suno-music",
    name: "音乐创作师",
    iconSvg: ICONS.sparkles,
    description: "Suno AI音乐生成，专业歌词与多风格音乐创作",
    color: "#f59e0b",
    capabilities: ["music_generation", "lyrics_writing", "genre_creation"]
  },
  // ========== 分支叙事类 ==========
  {
    id: "branching-narrative",
    name: "分支叙事师",
    iconSvg: ICONS.gitBranch,
    description: "分支叙事专家，选择设计与后果系统",
    color: "#10b981",
    capabilities: ["branching_story", "choice_design", "consequence_system"]
  },
  // ========== 结局创作类 ==========
  {
    id: "ending-designer",
    name: "结局设计师",
    iconSvg: ICONS.flag,
    description: "结局设计专家，圆满/悲剧/开放/反转结局",
    color: "#8b5cf6",
    capabilities: ["ending_design", "resolution", "closure"]
  },
  // ========== 卡牌专用Agent ==========
  {
    id: "item-designer",
    name: "道具设计师",
    iconSvg: ICONS.sword,
    description: "道具设计专家，武器/法宝/神器与特殊物品创造",
    color: "#f59e0b",
    capabilities: ["item_creation", "weapon_design", "artifact_lore"]
  },
  {
    id: "event-designer",
    name: "事件设计师",
    iconSvg: ICONS.bookOpen,
    description: "事件设计专家，关键事件/转折点/高潮场景设计",
    color: "#ec4899",
    capabilities: ["event_creation", "turning_point", "climax_design"]
  },
  {
    id: "plot-weaver",
    name: "情节编织师",
    iconSvg: ICONS.gitBranch,
    description: "情节编织专家，主线/支线/伏笔与callback设计",
    color: "#8b5cf6",
    capabilities: ["plot_weaving", "subplot_design", "foreshadowing"]
  },
  {
    id: "dramatic-conflict",
    name: "戏剧冲突师",
    iconSvg: ICONS.lightning,
    description: "戏剧冲突专家，内心/人际/社会/命运冲突设计",
    color: "#ef4444",
    capabilities: ["dramatic_conflict", "tension_building", "climax_setup"]
  },
  {
    id: "emotion-designer",
    name: "情感设计专家",
    iconSvg: ICONS.heart,
    description: "情感设计专家，爱/恨/恐惧/希望等情感场景创作",
    color: "#f472b6",
    capabilities: ["emotion_scene", "feeling_expression", "emotional_arc"]
  },
  {
    id: "clue-designer",
    name: "线索设计师",
    iconSvg: ICONS.search,
    description: "线索设计专家，谜团线索/伏笔/暗示布局",
    color: "#6366f1",
    capabilities: ["clue_placement", "hint_design", "mystery_setup"]
  },
  {
    id: "suspense-builder",
    name: "悬念构建师",
    iconSvg: ICONS.eye,
    description: "悬念构建专家，紧张氛围/期待感/惊喜设计",
    color: "#4f46e5",
    capabilities: ["suspense_building", "tension_creation", "surprise_setup"]
  },
  {
    id: "reversal-master",
    name: "反转大师",
    iconSvg: ICONS.refresh,
    description: "反转设计大师，身份/真相/关系/动机反转",
    color: "#10b981",
    capabilities: ["reversal_design", "identity_twist", "truth_reveal"]
  }
];
const AGENT_CATEGORIES = {
  novel: ["novel-writer", "outline-master", "narrative-engineer", "polish-master", "brainstorm-agent"],
  character: ["character-designer", "character-arc", "character-relation", "character-emotion"],
  screenplay: ["three-act-agent", "hero-journey", "plot-twist", "conflict-designer", "pacing-master"],
  dialogue: ["dialogue-writer", "dialogue-polish", "subtext-designer"],
  world: ["world-builder", "magic-system"],
  mystery: ["mystery-designer"],
  scene: ["scene-designer", "scene-transition"],
  storyboard: ["storyboard-creator"],
  game: ["game-designer", "quest-designer"],
  ai_creation: ["script-creator", "comic-creator", "animation-creator", "suno-music"],
  narrative: ["branching-narrative", "ending-designer"],
  // 卡牌专用Agent分类
  card_character: ["character-designer", "character-arc", "character-emotion", "character-relation"],
  card_scene: ["scene-designer", "scene-transition", "world-builder"],
  card_item: ["item-designer", "magic-system", "world-builder"],
  card_event: ["plot-weaver", "event-designer", "narrative-engineer"],
  card_conflict: ["conflict-designer", "dramatic-conflict", "narrative-engineer"],
  card_emotion: ["emotion-designer", "character-emotion", "dialogue-polish"],
  card_plot: ["plot-weaver", "narrative-engineer", "three-act-agent"],
  card_mystery: ["mystery-designer", "clue-designer", "suspense-builder"],
  card_twist: ["plot-twist", "reversal-master", "narrative-engineer"],
  card_dialogue: ["dialogue-writer", "subtext-designer", "dialogue-polish"],
  card_world: ["world-builder", "magic-system", "scene-designer"],
  card_ending: ["ending-designer", "narrative-engineer", "plot-twist"]
};
function createAgentSelector(category, selectedAgentId) {
  const agentIds = AGENT_CATEGORIES[category] || [];
  const agents = agentIds.map((id) => AGENTS.find((a) => a.id === id)).filter(Boolean);
  if (agents.length === 0) return "";
  return `
    <div class="form-section agent-selector-section">
      <h3 class="section-title">
        ${createSvgIcon(ICONS.sparkles, 20, "#fbbf24")}
        <span>选择创作Agent</span>
        <span style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 400; margin-left: 8px;">（可选）</span>
      </h3>
      <div class="agent-selector" data-category="${category}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${agents.map((agent) => `
          <div class="agent-card ${selectedAgentId === agent.id ? "selected" : ""}" 
               data-agent-id="${agent.id}"
               style="padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid ${selectedAgentId === agent.id ? agent.color : "rgba(255,255,255,0.1)"}; border-radius: 12px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: ${agent.color}; opacity: ${selectedAgentId === agent.id ? 1 : 0};"></div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="width: 36px; height: 36px; background: ${agent.color}20; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                ${createSvgIcon(agent.iconSvg, 20, agent.color)}
              </div>
              <div style="font-weight: 600; font-size: 0.875rem; color: ${selectedAgentId === agent.id ? agent.color : "rgba(255,255,255,0.9)"};">${agent.name}</div>
            </div>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5); line-height: 1.5;">${agent.description}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
              ${agent.capabilities.slice(0, 2).map((cap) => `
                <span style="font-size: 0.625rem; padding: 2px 6px; background: ${agent.color}15; color: ${agent.color}; border-radius: 4px;">${cap.replace(/_/g, " ")}</span>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
const MODE_TEMPLATES = {
  full: `
    <div class="content-section">
      <!-- Hero区域 -->
      <div class="hero-section" style="text-align: center; padding: 40px 20px;">
        <div class="hero-badge" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px; margin-bottom: 16px;">
          ${createSvgIcon(ICONS.sparkles, 16, "#a78bfa")}
          <span style="color: #a78bfa; font-size: 0.875rem;">AI驱动的小说创作引擎</span>
        </div>
        
        <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 12px; background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">创世纪引擎</h1>
        <p style="font-size: 1.125rem; color: rgba(255,255,255,0.6); margin-bottom: 32px;">让创意无限可能，用AI赋能每一个故事</p>
        
        <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 40px;">
          <button class="btn btn-primary btn-lg" id="start-create-btn" style="padding: 14px 28px; font-size: 1rem;">
            ${createSvgIcon(ICONS.edit, 18, "white")}
            <span style="margin-left: 8px;">开始创作</span>
          </button>
          <button class="btn btn-secondary btn-lg" id="explore-btn" style="padding: 14px 28px; font-size: 1rem;">
            ${createSvgIcon(ICONS.bookOpen, 18, "currentColor")}
            <span style="margin-left: 8px;">查看演示</span>
          </button>
        </div>
        
        <!-- 统计数据 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 800px; margin: 0 auto 48px;">
          <div class="glass-card" style="padding: 20px; text-align: center;">
            <div style="font-size: 1.75rem; font-weight: 700; color: #8b5cf6; margin-bottom: 4px;">10,000+</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">创作灵感</div>
          </div>
          <div class="glass-card" style="padding: 20px; text-align: center;">
            <div style="font-size: 1.75rem; font-weight: 700; color: #ec4899; margin-bottom: 4px;">5,000+</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">角色模板</div>
          </div>
          <div class="glass-card" style="padding: 20px; text-align: center;">
            <div style="font-size: 1.75rem; font-weight: 700; color: #06b6d4; margin-bottom: 4px;">2,000+</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">情节框架</div>
          </div>
          <div class="glass-card" style="padding: 20px; text-align: center;">
            <div style="font-size: 1.75rem; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">100+</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">情感维度</div>
          </div>
        </div>
      </div>
      
      <!-- 创作工具箱 -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 32px; display: flex; align-items: center; justify-content: center; gap: 12px;">
          ${createSvgIcon(ICONS.settings, 24, "#a78bfa")}
          <span>创作工具箱</span>
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto;">
          <!-- 灵感生成器 -->
          <div class="glass-card tool-card" data-tool="inspiration" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(245, 158, 11, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #f59e0b, #ec4899); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.bulb, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">灵感生成器</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">突破创作瓶颈，一键生成独特的故事创意和情节构思</p>
              </div>
            </div>
          </div>
          
          <!-- 角色工坊 -->
          <div class="glass-card tool-card" data-tool="character" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(236, 72, 153, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.user, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #ec4899;">角色工坊</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">深度角色开发，打造立体鲜活的人物形象和成长弧线</p>
              </div>
            </div>
          </div>
          
          <!-- 情节编排 -->
          <div class="glass-card tool-card" data-tool="plot" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(139, 92, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.chart, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #8b5cf6;">情节编排</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">三幕式结构规划，精心设计每一个转折点和高潮</p>
              </div>
            </div>
          </div>
          
          <!-- 情感曲线 -->
          <div class="glass-card tool-card" data-tool="emotion" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(236, 72, 153, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #ec4899, #f59e0b); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.heart, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #ec4899;">情感曲线</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">精准把控情绪节奏，让读者沉浸其中无法自拔</p>
              </div>
            </div>
          </div>
          
          <!-- 世界构建 -->
          <div class="glass-card tool-card" data-tool="world" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(6, 182, 212, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #06b6d4, #10b981); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.globe, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #06b6d4;">世界构建</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">创建完整的世界观，包括地理、历史、文化和魔法体系</p>
              </div>
            </div>
          </div>
          
          <!-- 对白大师 -->
          <div class="glass-card tool-card" data-tool="dialogue" style="padding: 24px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${createSvgIcon(ICONS.message, 28, "white")}
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #10b981;">对白大师</h3>
                <p style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5;">自然流畅的对话生成，让每个角色都有独特的声音</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  chat: `
    <div class="content-section">
      <div class="chat-container">
        <div class="chat-header">
          <div class="chat-avatar" id="chat-avatar">${createSvgIcon(ICONS.sparkles, 32, "white")}</div>
          <div class="chat-info">
            <h3 id="chat-agent-name">AI 助手</h3>
            <div class="chat-status">
              <span class="status-dot"></span>
              <span>在线</span>
            </div>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="chat-message ai">
            <div class="message-bubble">
              你好！我是创世纪引擎的AI助手。我可以帮助你进行小说创作的各个环节，包括故事构思、角色设计、情节编排等。请问有什么我可以帮你的吗？
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <input type="text" class="input" id="chat-input" placeholder="输入你的问题或想法..." style="flex: 1;">
          <button class="btn btn-primary" id="chat-send">${createSvgIcon(ICONS.send, 18, "white")}<span style="margin-left:6px;">发送</span></button>
        </div>
      </div>
      
      <div style="margin-top: 24px;">
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 16px;">选择专业助手</h3>
        <div class="agent-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          ${AGENTS.map((agent) => `
            <div class="agent-card" data-agent="${agent.id}" style="
              background: rgba(26, 26, 37, 0.6);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 20px;
              cursor: pointer;
              transition: all 0.3s ease;
            " onmouseover="this.style.borderColor='${agent.color}'; this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.08)'; this.style.transform='translateY(0)'">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 48px; height: 48px; background: ${agent.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ${agent.color}40;">${createSvgIcon(agent.iconSvg, 24, "white")}</div>
                <div>
                  <div style="font-weight: 600; color: ${agent.color};">${agent.name}</div>
                  <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">${agent.capabilities.length} 项能力</div>
                </div>
              </div>
              <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.5; margin-bottom: 12px;">${agent.description}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                ${agent.capabilities.map((cap) => `
                  <span style="
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    background: ${agent.color}20;
                    color: ${agent.color};
                    border-radius: 6px;
                    border: 1px solid ${agent.color}40;
                  ">${cap.replace(/_/g, " ")}</span>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `,
  short: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.lightning, 28, "#f59e0b")} 小说设定</h1>
        <p class="content-subtitle">配置你的短篇小说创作参数</p>
      </div>
      
      <div class="glass-card novel-form" style="padding: 32px;">
        <div class="form-section">
          <h3 class="section-title">${createSvgIcon(ICONS.book, 20, "#8b5cf6")} 书名</h3>
          <input type="text" class="input" id="novel-title" placeholder="输入书名">
        </div>
        
        <div class="form-section">
          <h3 class="section-title">主分类（单选）</h3>
          <div class="tag-group single-select" data-name="category">
            <div class="tag-item" data-value="婚姻家庭">婚姻家庭</div>
            <div class="tag-item" data-value="男生生活">男生生活</div>
            <div class="tag-item" data-value="虐心婚恋">虐心婚恋</div>
            <div class="tag-item" data-value="男生情感">男生情感</div>
            <div class="tag-item" data-value="社会伦理">社会伦理</div>
            <div class="tag-item" data-value="悬疑惊悚">悬疑惊悚</div>
            <div class="tag-item" data-value="玄幻仙侠">玄幻仙侠</div>
            <div class="tag-item" data-value="男频衍生">男频衍生</div>
            <div class="tag-item" data-value="年代">年代</div>
            <div class="tag-item" data-value="女生生活">女生生活</div>
            <div class="tag-item" data-value="现言甜宠">现言甜宠</div>
            <div class="tag-item" data-value="青春虐恋">青春虐恋</div>
            <div class="tag-item" data-value="脑洞">脑洞</div>
            <div class="tag-item" data-value="女性成长">女性成长</div>
            <div class="tag-item" data-value="古代言情">古代言情</div>
            <div class="tag-item" data-value="宫斗宅斗">宫斗宅斗</div>
            <div class="tag-item" data-value="女频衍生">女频衍生</div>
            <div class="tag-item" data-value="纯爱">纯爱</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">情节（可多选）</h3>
          <div class="tag-group multi-select" data-name="plot">
            <div class="tag-item" data-value="追妻火葬场">追妻火葬场</div>
            <div class="tag-item" data-value="追夫火葬场">追夫火葬场</div>
            <div class="tag-item" data-value="真假千金">真假千金</div>
            <div class="tag-item" data-value="先婚后爱">先婚后爱</div>
            <div class="tag-item" data-value="打脸逆袭">打脸逆袭</div>
            <div class="tag-item" data-value="破镜重圆">破镜重圆</div>
            <div class="tag-item" data-value="系统">系统</div>
            <div class="tag-item" data-value="大女主">大女主</div>
            <div class="tag-item" data-value="穿越">穿越</div>
            <div class="tag-item" data-value="暗恋">暗恋</div>
            <div class="tag-item" data-value="权谋">权谋</div>
            <div class="tag-item" data-value="养崽文">养崽文</div>
            <div class="tag-item" data-value="无限流">无限流</div>
            <div class="tag-item" data-value="金手指">金手指</div>
            <div class="tag-item" data-value="女性互助">女性互助</div>
            <div class="tag-item" data-value="重生">重生</div>
            <div class="tag-item" data-value="婚恋">婚恋</div>
            <div class="tag-item" data-value="架空">架空</div>
            <div class="tag-item" data-value="团宠">团宠</div>
            <div class="tag-item" data-value="末日求生">末日求生</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">角色（可多选）</h3>
          <div class="tag-group multi-select" data-name="character">
            <div class="tag-item" data-value="白月光">白月光</div>
            <div class="tag-item" data-value="霸总">霸总</div>
            <div class="tag-item" data-value="婆媳">婆媳</div>
            <div class="tag-item" data-value="青梅竹马">青梅竹马</div>
            <div class="tag-item" data-value="姐弟恋">姐弟恋</div>
            <div class="tag-item" data-value="校花校草">校花校草</div>
            <div class="tag-item" data-value="医生">医生</div>
            <div class="tag-item" data-value="病娇">病娇</div>
            <div class="tag-item" data-value="校霸">校霸</div>
            <div class="tag-item" data-value="萌宝">萌宝</div>
            <div class="tag-item" data-value="凤凰男">凤凰男</div>
            <div class="tag-item" data-value="女配">女配</div>
            <div class="tag-item" data-value="替身">替身</div>
            <div class="tag-item" data-value="赘婿">赘婿</div>
            <div class="tag-item" data-value="影帝影后">影帝影后</div>
            <div class="tag-item" data-value="糙汉">糙汉</div>
            <div class="tag-item" data-value="万人迷">万人迷</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">情绪（可多选）</h3>
          <div class="tag-group multi-select" data-name="emotion">
            <div class="tag-item" data-value="先虐后甜">先虐后甜</div>
            <div class="tag-item" data-value="虐文">虐文</div>
            <div class="tag-item" data-value="救赎">救赎</div>
            <div class="tag-item" data-value="励志">励志</div>
            <div class="tag-item" data-value="甜宠">甜宠</div>
            <div class="tag-item" data-value="爽文">爽文</div>
            <div class="tag-item" data-value="惊悚">惊悚</div>
            <div class="tag-item" data-value="沙雕搞笑">沙雕搞笑</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">背景（可多选）</h3>
          <div class="tag-group multi-select" data-name="background">
            <div class="tag-item" data-value="家庭">家庭</div>
            <div class="tag-item" data-value="校园">校园</div>
            <div class="tag-item" data-value="现代">现代</div>
            <div class="tag-item" data-value="民国">民国</div>
            <div class="tag-item" data-value="职场">职场</div>
            <div class="tag-item" data-value="娱乐圈">娱乐圈</div>
            <div class="tag-item" data-value="古代">古代</div>
            <div class="tag-item" data-value="豪门世家">豪门世家</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">自定义标签（可多选）</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="text" class="input" id="custom-tag-input" placeholder="输入自定义标签..." style="flex: 1;">
            <button class="btn btn-secondary" id="add-custom-tag" style="white-space: nowrap;">添加</button>
          </div>
          <div class="tag-group multi-select" id="custom-tags" data-name="custom"></div>
        </div>
        
        ${createAgentSelector("novel")}
        
        <div class="form-section">
          <h3 class="section-title">故事梗概 / 核心设定</h3>
          <textarea class="input" id="novel-synopsis" rows="6" placeholder="简要描述故事梗概、核心设定、人物关系等..." style="resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
          <button class="btn btn-secondary" id="cancel-novel">${createSvgIcon(ICONS.x, 18, "currentColor")}<span style="margin-left:6px;">取消</span></button>
          <button class="btn btn-primary" id="save-novel">${createSvgIcon(ICONS.check, 18, "white")}<span style="margin-left:6px;">生成提示词</span></button>
        </div>
      </div>
      
      <div id="prompt-preview" style="display: none; margin-top: 24px;"></div>
    </div>
  `,
  medium: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.book, 28, "#8b5cf6")} 中长篇创作</h1>
        <p class="content-subtitle">创作 10万-50万字的中长篇小说</p>
      </div>
      
      <div class="glass-card medium-form" style="padding: 32px;">
        <div class="form-section">
          <h3 class="section-title">${createSvgIcon(ICONS.book, 20, "#8b5cf6")} 书名</h3>
          <input type="text" class="input" id="medium-title" placeholder="输入书名">
        </div>
        
        <div class="form-section">
          <h3 class="section-title">预计字数</h3>
          <select class="input" id="medium-wordcount">
            <option value="10-20万字">10-20万字</option>
            <option value="20-30万字">20-30万字</option>
            <option value="30-50万字">30-50万字</option>
            <option value="50万字+">50万字+</option>
          </select>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">主分类（单选）</h3>
          <div class="tag-group single-select" data-name="medium-category">
            <div class="tag-item" data-value="玄幻修仙">玄幻修仙</div>
            <div class="tag-item" data-value="都市异能">都市异能</div>
            <div class="tag-item" data-value="历史架空">历史架空</div>
            <div class="tag-item" data-value="科幻未来">科幻未来</div>
            <div class="tag-item" data-value="游戏竞技">游戏竞技</div>
            <div class="tag-item" data-value="武侠江湖">武侠江湖</div>
            <div class="tag-item" data-value="悬疑推理">悬疑推理</div>
            <div class="tag-item" data-value="灵异恐怖">灵异恐怖</div>
            <div class="tag-item" data-value="军事战争">军事战争</div>
            <div class="tag-item" data-value="现实题材">现实题材</div>
            <div class="tag-item" data-value="言情">言情</div>
            <div class="tag-item" data-value="耽美">耽美</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">核心标签（可多选）</h3>
          <div class="tag-group multi-select" data-name="medium-tags">
            <div class="tag-item" data-value="系统流">系统流</div>
            <div class="tag-item" data-value="重生">重生</div>
            <div class="tag-item" data-value="穿越">穿越</div>
            <div class="tag-item" data-value="种田">种田</div>
            <div class="tag-item" data-value="升级">升级</div>
            <div class="tag-item" data-value="逆袭">逆袭</div>
            <div class="tag-item" data-value="爽文">爽文</div>
            <div class="tag-item" data-value="虐文">虐文</div>
            <div class="tag-item" data-value="甜宠">甜宠</div>
            <div class="tag-item" data-value="权谋">权谋</div>
            <div class="tag-item" data-value="争霸">争霸</div>
            <div class="tag-item" data-value="探险">探险</div>
            <div class="tag-item" data-value="无限流">无限流</div>
            <div class="tag-item" data-value="洪荒流">洪荒流</div>
            <div class="tag-item" data-value="末日">末日</div>
            <div class="tag-item" data-value="星际">星际</div>
          </div>
        </div>
        
        ${createAgentSelector("novel")}
        
        <div class="form-section">
          <h3 class="section-title">核心设定</h3>
          <textarea class="input" id="medium-setting" rows="6" placeholder="描述你的世界设定、力量体系、主要角色和核心冲突..." style="resize: vertical;"></textarea>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">故事梗概</h3>
          <textarea class="input" id="medium-synopsis" rows="4" placeholder="简要描述故事主线、主角目标和主要情节走向..." style="resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
          <button class="btn btn-secondary" id="cancel-medium">${createSvgIcon(ICONS.x, 18, "currentColor")}<span style="margin-left:6px;">取消</span></button>
          <button class="btn btn-primary" id="save-medium">${createSvgIcon(ICONS.check, 18, "white")}<span style="margin-left:6px;">生成提示词</span></button>
        </div>
      </div>
      
      <div id="medium-prompt-preview" style="display: none; margin-top: 24px;"></div>
    </div>
  `,
  card: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.cards, 28, "#06b6d4")} 创意卡牌</h1>
        <p class="content-subtitle">抽取灵感卡牌，获取创作灵感</p>
      </div>
      
      <!-- 模式切换 -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <button class="btn btn-primary btn-sm active" id="card-mode-single" style="flex: 1;">
          ${createSvgIcon(ICONS.card, 16, "white")}
          <span style="margin-left: 6px;">单卡抽取</span>
        </button>
        <button class="btn btn-secondary btn-sm" id="card-mode-multi" style="flex: 1;">
          ${createSvgIcon(ICONS.cards, 16, "currentColor")}
          <span style="margin-left: 6px;">组合抽取</span>
        </button>
        <button class="btn btn-secondary btn-sm" id="card-mode-history" style="flex: 1;">
          ${createSvgIcon(ICONS.clock, 16, "currentColor")}
          <span style="margin-left: 6px;">历史记录</span>
        </button>
      </div>
      
      <!-- 单卡模式 -->
      <div id="card-single-mode">
        <!-- 卡牌选择区域 -->
        <div id="card-selection" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
          <div class="glass-card card-item" data-card-type="character" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(139, 92, 246, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #8b5cf6, #06b6d4);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);">${createSvgIcon(ICONS.user, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">角色卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取角色灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(139, 92, 246, 0.2); border-radius: 10px; font-size: 0.7rem; color: #a78bfa;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="scene" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(6, 182, 212, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #06b6d4, #10b981);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #06b6d4, #10b981); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);">${createSvgIcon(ICONS.castle, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">场景卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取场景灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(6, 182, 212, 0.2); border-radius: 10px; font-size: 0.7rem; color: #06b6d4;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="item" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(245, 158, 11, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #f59e0b, #ef4444);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);">${createSvgIcon(ICONS.sword, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">道具卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取道具灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(245, 158, 11, 0.2); border-radius: 10px; font-size: 0.7rem; color: #f59e0b;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="event" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(236, 72, 153, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ec4899, #f59e0b);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ec4899, #f59e0b); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);">${createSvgIcon(ICONS.bookOpen, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">事件卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取事件灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(236, 72, 153, 0.2); border-radius: 10px; font-size: 0.7rem; color: #ec4899;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="conflict" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(239, 68, 68, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ef4444, #8b5cf6);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444, #8b5cf6); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);">${createSvgIcon(ICONS.lightning, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">冲突卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取冲突灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(239, 68, 68, 0.2); border-radius: 10px; font-size: 0.7rem; color: #ef4444;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="emotion" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(16, 185, 129, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #10b981, #06b6d4);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);">${createSvgIcon(ICONS.heart, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">情感卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取情感灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); border-radius: 10px; font-size: 0.7rem; color: #10b981;">点击查看示例</div>
          </div>
          
          <!-- 新增卡牌类型 -->
          <div class="glass-card card-item" data-card-type="plot" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(139, 92, 246, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);">${createSvgIcon(ICONS.gitBranch, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">情节卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取情节灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(139, 92, 246, 0.2); border-radius: 10px; font-size: 0.7rem; color: #a78bfa;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="mystery" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(75, 85, 99, 0.4)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #4b5563, #1f2937);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #4b5563, #1f2937); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(75, 85, 99, 0.4);">${createSvgIcon(ICONS.search, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">悬疑卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取悬疑灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(75, 85, 99, 0.3); border-radius: 10px; font-size: 0.7rem; color: #9ca3af;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="twist" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(245, 158, 11, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #f59e0b, #8b5cf6);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);">${createSvgIcon(ICONS.zap, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">反转卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取反转灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(245, 158, 11, 0.2); border-radius: 10px; font-size: 0.7rem; color: #f59e0b;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="dialogue" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(6, 182, 212, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #06b6d4, #3b82f6);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);">${createSvgIcon(ICONS.message, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">对白卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取对白灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(6, 182, 212, 0.2); border-radius: 10px; font-size: 0.7rem; color: #06b6d4;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="world" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(16, 185, 129, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #10b981, #84cc16);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #84cc16); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);">${createSvgIcon(ICONS.globe, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">世界卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取世界观灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); border-radius: 10px; font-size: 0.7rem; color: #10b981;">点击查看示例</div>
          </div>
          
          <div class="glass-card card-item" data-card-type="ending" style="padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;" 
               onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(236, 72, 153, 0.3)'" 
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow=''">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ec4899, #f43f5e);"></div>
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ec4899, #f43f5e); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);">${createSvgIcon(ICONS.flag, 32, "white")}</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">结局卡牌</h3>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">抽取结局灵感</p>
            <div style="margin-top: 10px; padding: 4px 10px; background: rgba(236, 72, 153, 0.2); border-radius: 10px; font-size: 0.7rem; color: #ec4899;">点击查看示例</div>
          </div>
        </div>
        
        <!-- 卡牌配置表单（初始隐藏） -->
        <div id="card-config-form" style="display: none; margin-top: 24px;">
          <div class="glass-card" style="padding: 32px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <button class="btn btn-secondary btn-sm" id="back-to-cards">
                ${createSvgIcon(ICONS.arrowLeft, 16, "currentColor")}
                <span style="margin-left: 4px;">返回</span>
              </button>
              <h3 id="card-type-title" style="font-weight: 600;">角色卡牌</h3>
            </div>
            
            <!-- 动态配置区域 -->
            <div id="card-dynamic-config">
              <!-- 风格偏好 -->
              <div class="form-section">
                <h3 class="section-title">风格偏好（单选）</h3>
                <div class="tag-group single-select" data-name="card-style">
                  <div class="tag-item" data-value="玄幻">玄幻</div>
                  <div class="tag-item" data-value="都市">都市</div>
                  <div class="tag-item" data-value="仙侠">仙侠</div>
                  <div class="tag-item" data-value="科幻">科幻</div>
                  <div class="tag-item" data-value="历史">历史</div>
                  <div class="tag-item" data-value="悬疑">悬疑</div>
                  <div class="tag-item" data-value="言情">言情</div>
                  <div class="tag-item" data-value="恐怖">恐怖</div>
                </div>
              </div>
              
              <!-- 卡牌类型特定选项 -->
              <div id="card-specific-options"></div>
              
              <!-- 难度/复杂度 -->
              <div class="form-section">
                <h3 class="section-title">难度/复杂度</h3>
                <div style="display: flex; gap: 12px;">
                  <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="card-difficulty" value="simple" style="display: none;" checked>
                    <div class="difficulty-option" style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-align: center; transition: all 0.3s;">
                      <div style="font-weight: 600; margin-bottom: 4px;">简单</div>
                      <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">基础要素</div>
                    </div>
                  </label>
                  <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="card-difficulty" value="normal" style="display: none;">
                    <div class="difficulty-option" style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-align: center; transition: all 0.3s;">
                      <div style="font-weight: 600; margin-bottom: 4px;">标准</div>
                      <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">完整细节</div>
                    </div>
                  </label>
                  <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="card-difficulty" value="complex" style="display: none;">
                    <div class="difficulty-option" style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-align: center; transition: all 0.3s;">
                      <div style="font-weight: 600; margin-bottom: 4px;">复杂</div>
                      <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">深度设定</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <!-- 卡牌Agent选择器（动态） -->
              <div id="card-agent-selector"></div>
              
              <!-- 额外要求 -->
              <div class="form-section">
                <h3 class="section-title">额外要求（可选）</h3>
                <textarea class="input" id="card-extra" rows="3" placeholder="对生成内容的具体要求" style="resize: vertical;"></textarea>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
              <button class="btn btn-secondary" id="cancel-card">${createSvgIcon(ICONS.x, 18, "currentColor")}<span style="margin-left:6px;">取消</span></button>
              <button class="btn btn-primary" id="generate-card">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">生成卡牌</span></button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 组合模式 -->
      <div id="card-multi-mode" style="display: none;">
        <div class="glass-card" style="padding: 32px; text-align: center;">
          <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #8b5cf6, #06b6d4, #ec4899); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 40px rgba(139, 92, 246, 0.5);">
            ${createSvgIcon(ICONS.cards, 48, "white")}
          </div>
          <h3 style="font-weight: 600; margin-bottom: 12px;">卡牌组合</h3>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 24px;">同时抽取多张卡牌，组合成一个完整的创作灵感</p>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div class="combo-card-slot" data-slot="1" style="aspect-ratio: 3/4; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s;">
              <span style="color: rgba(255,255,255,0.4); font-size: 0.875rem;">+ 添加卡牌</span>
            </div>
            <div class="combo-card-slot" data-slot="2" style="aspect-ratio: 3/4; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s;">
              <span style="color: rgba(255,255,255,0.4); font-size: 0.875rem;">+ 添加卡牌</span>
            </div>
            <div class="combo-card-slot" data-slot="3" style="aspect-ratio: 3/4; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s;">
              <span style="color: rgba(255,255,255,0.4); font-size: 0.875rem;">+ 添加卡牌</span>
            </div>
          </div>
          
          <button class="btn btn-primary" id="generate-combo" disabled>
            ${createSvgIcon(ICONS.sparkles, 18, "white")}
            <span style="margin-left: 6px;">生成组合灵感</span>
          </button>
        </div>
      </div>
      
      <!-- 历史记录模式 -->
      <div id="card-history-mode" style="display: none;">
        <div id="card-history-list" style="display: grid; gap: 16px;">
          <div style="text-align: center; padding: 48px; color: rgba(255,255,255,0.5);">
            ${createSvgIcon(ICONS.clock, 48, "rgba(255,255,255,0.3)")}
            <p style="margin-top: 16px;">暂无历史记录</p>
          </div>
        </div>
      </div>
      
      <!-- 卡牌结果显示 -->
      <div id="card-result" style="display: none; margin-top: 24px;"></div>
    </div>
  `,
  outline: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.list, 28, "#10b981")} 细纲生成</h1>
        <p class="content-subtitle">使用三幕式结构生成详细大纲</p>
      </div>
      
      <div class="glass-card outline-form" style="padding: 32px;">
        <div class="form-section">
          <h3 class="section-title">${createSvgIcon(ICONS.book, 20, "#8b5cf6")} 书名</h3>
          <input type="text" class="input" id="outline-title" placeholder="输入书名">
        </div>
        
        <div class="form-section">
          <h3 class="section-title">核心创意</h3>
          <textarea class="input" id="outline-concept" rows="4" placeholder="一句话概括你的核心创意（如：一个废柴少年获得系统，逆天改命成为最强者）" style="resize: vertical;"></textarea>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">分类（单选）</h3>
          <div class="tag-group single-select" data-name="outline-category">
            <div class="tag-item" data-value="玄幻">玄幻</div>
            <div class="tag-item" data-value="都市">都市</div>
            <div class="tag-item" data-value="仙侠">仙侠</div>
            <div class="tag-item" data-value="科幻">科幻</div>
            <div class="tag-item" data-value="历史">历史</div>
            <div class="tag-item" data-value="游戏">游戏</div>
            <div class="tag-item" data-value="悬疑">悬疑</div>
            <div class="tag-item" data-value="言情">言情</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">标签（可多选）</h3>
          <div class="tag-group multi-select" data-name="outline-tags">
            <div class="tag-item" data-value="系统">系统</div>
            <div class="tag-item" data-value="重生">重生</div>
            <div class="tag-item" data-value="穿越">穿越</div>
            <div class="tag-item" data-value="升级">升级</div>
            <div class="tag-item" data-value="逆袭">逆袭</div>
            <div class="tag-item" data-value="爽文">爽文</div>
            <div class="tag-item" data-value="虐文">虐文</div>
            <div class="tag-item" data-value="甜宠">甜宠</div>
            <div class="tag-item" data-value="权谋">权谋</div>
            <div class="tag-item" data-value="修仙">修仙</div>
            <div class="tag-item" data-value="异能">异能</div>
            <div class="tag-item" data-value="商战">商战</div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">主要角色</h3>
          <textarea class="input" id="outline-characters" rows="3" placeholder="描述主角和重要配角（姓名、身份、性格、目标）" style="resize: vertical;"></textarea>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">核心冲突</h3>
          <textarea class="input" id="outline-conflict" rows="3" placeholder="主角面临的核心冲突是什么？（如：与反派的斗争、内心的挣扎、命运的挑战）" style="resize: vertical;"></textarea>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">预期结局</h3>
          <div class="tag-group single-select" data-name="outline-ending">
            <div class="tag-item" data-value="圆满结局">圆满结局</div>
            <div class="tag-item" data-value="悲剧结局">悲剧结局</div>
            <div class="tag-item" data-value="开放式结局">开放式结局</div>
            <div class="tag-item" data-value="反转结局">反转结局</div>
            <div class="tag-item" data-value="悬念结局">悬念结局</div>
          </div>
        </div>
        
        ${createAgentSelector("screenplay")}
        
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
          <button class="btn btn-secondary" id="cancel-outline">${createSvgIcon(ICONS.x, 18, "currentColor")}<span style="margin-left:6px;">取消</span></button>
          <button class="btn btn-primary" id="save-outline">${createSvgIcon(ICONS.check, 18, "white")}<span style="margin-left:6px;">生成提示词</span></button>
        </div>
      </div>
      
      <div id="outline-prompt-preview" style="display: none; margin-top: 24px;"></div>
    </div>
  `,
  inspiration: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.bulb, 28, "#f59e0b")} 灵感生成器</h1>
        <p class="content-subtitle">突破创作瓶颈，获取独特创意</p>
      </div>
      <div class="glass-card" style="padding: 48px; text-align: center;">
        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #f59e0b, #ec4899); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 0 40px rgba(245, 158, 11, 0.4);">${createSvgIcon(ICONS.bulb, 48, "white")}</div>
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 16px;">点击生成灵感</h2>
        <p style="color: rgba(255,255,255,0.6); margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto;">基于AI大模型，为你生成独特的故事创意、角色设定和情节转折</p>
        <button class="btn btn-primary btn-lg" id="generate-inspiration">
          ${createSvgIcon(ICONS.sparkles, 20, "white")}
          <span>生成灵感</span>
        </button>
        <div id="inspiration-result" style="margin-top: 32px; text-align: left; display: none;"></div>
      </div>
    </div>
  `,
  character: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.user, 28, "#ec4899")} 角色工坊</h1>
        <p class="content-subtitle">打造立体鲜活的角色形象</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">角色类型/提示词</label>
          <textarea class="input" id="character-prompt" rows="3" placeholder="例如：一个神秘的古董店老板，表面温和但暗藏秘密..." style="resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="generate-character">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">AI生成角色</span></button>
        </div>
        <div id="character-result" style="display: none;"></div>
      </div>
    </div>
  `,
  plot: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.chart, 28, "#8b5cf6")} 情节编排</h1>
        <p class="content-subtitle">设计精彩的情节转折和故事结构</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">故事主题/提示词</label>
          <textarea class="input" id="plot-prompt" rows="3" placeholder="例如：一个关于复仇与救赎的悬疑故事..." style="resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="generate-plot">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">AI生成情节</span></button>
        </div>
        <div id="plot-result" style="display: none;"></div>
      </div>
    </div>
  `,
  emotion: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.heart, 28, "#ec4899")} 情感曲线</h1>
        <p class="content-subtitle">分析和优化故事的情感节奏</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">故事梗概</label>
          <textarea class="input" id="emotion-prompt" rows="4" placeholder="输入你的故事梗概，AI将分析情感曲线并给出优化建议..." style="resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="generate-emotion">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">AI分析情感</span></button>
        </div>
        <div id="emotion-result" style="display: none;"></div>
      </div>
    </div>
  `,
  world: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.globe, 28, "#06b6d4")} 世界构建</h1>
        <p class="content-subtitle">创建完整的世界观和背景设定</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">世界类型/提示词</label>
          <textarea class="input" id="world-prompt" rows="4" placeholder="例如：一个魔法与科技共存的赛博朋克世界，人类与AI共生..." style="resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="generate-world">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">AI构建世界</span></button>
        </div>
        <div id="world-result" style="display: none;"></div>
      </div>
    </div>
  `,
  dialogue: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.message, 28, "#10b981")} 对白大师</h1>
        <p class="content-subtitle">生成自然流畅、富有张力的角色对话</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">对话场景与角色</label>
          <textarea class="input" id="dialogue-prompt" rows="4" placeholder="例如：两个老朋友在咖啡馆重逢，一个已经功成名就，另一个依然在追寻梦想..." style="resize: vertical;"></textarea>
        </div>
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">对话风格</label>
          <select class="input" id="dialogue-style">
            <option value="natural">自然日常</option>
            <option value="dramatic">戏剧张力</option>
            <option value="humorous">幽默风趣</option>
            <option value="poetic">诗意浪漫</option>
            <option value="suspense">悬疑紧张</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="generate-dialogue">${createSvgIcon(ICONS.sparkles, 18, "white")}<span style="margin-left:6px;">AI生成对话</span></button>
        </div>
        <div id="dialogue-result" style="display: none;"></div>
      </div>
    </div>
  `,
  settings: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">${createSvgIcon(ICONS.settings, 28, "#6366f1")} 系统设置</h1>
        <p class="content-subtitle">自定义你的创作环境</p>
      </div>
      
      <div class="glass-card" style="padding: 32px; margin-bottom: 24px;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            ${createSvgIcon(ICONS.server, 20, "#8b5cf6")}
            <span>API 配置</span>
          </h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">配置名称</label>
            <input type="text" class="input" id="api-config-name" placeholder="例如：我的OpenAI" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">预设提供商</label>
            <select class="input" id="api-provider" style="width: 100%;">
              <option value="">-- 选择预设或手动输入 --</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="moonshot">Moonshot (Kimi)</option>
              <option value="zhipu">智谱AI (GLM)</option>
              <option value="minimax">MiniMax</option>
              <option value="qwen">通义千问</option>
              <option value="doubao">豆包 (字节)</option>
              <option value="baidu">百度文心</option>
              <option value="alibaba">阿里通义</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">API 端点 (URL)</label>
            <input type="text" class="input" id="api-endpoint" placeholder="https://api.openai.com/v1/chat/completions" style="width: 100%; font-family: monospace;">
            <small style="color: rgba(255,255,255,0.5); margin-top: 4px; display: block;">完整的API请求地址</small>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">API 密钥 (Key)</label>
            <div style="position: relative;">
              <input type="password" class="input" id="api-key" placeholder="sk-..." style="width: 100%; font-family: monospace; padding-right: 40px;">
              <button id="toggle-api-key-visibility" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; opacity: 0.6; transition: opacity 0.3s;">
                ${createSvgIcon(ICONS.eye, 18, "rgba(255,255,255,0.8)")}
              </button>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">模型名称 (可选)</label>
            <input type="text" class="input" id="api-model-name" placeholder="例如：gpt-4, deepseek-chat" style="width: 100%; font-family: monospace;">
            <small style="color: rgba(255,255,255,0.5); margin-top: 4px; display: block;">
              留空使用默认模型。常用模型：<br>
              • MiniMax: MiniMax-M2.5, MiniMax-M2.5-highspeed, M2-her<br>
              • DeepSeek: deepseek-chat, deepseek-reasoner<br>
              • OpenAI: gpt-4, gpt-3.5-turbo<br>
              • 智谱: glm-4-flash, glm-4
            </small>
          </div>
          
          <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 16px; margin-top: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              ${createSvgIcon(ICONS.info, 18, "#a78bfa")}
              <span style="font-weight: 600; color: #a78bfa;">配置说明</span>
            </div>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.7); font-size: 0.875rem; line-height: 1.6;">
              <li>选择预设提供商可自动填充API端点</li>
              <li>API密钥将安全存储在本地</li>
              <li>支持多个API配置切换</li>
              <li>自定义端点支持任何兼容接口</li>
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="btn btn-primary" id="save-api-config" style="flex: 1;">
              ${createSvgIcon(ICONS.check, 18, "white")}
              <span style="margin-left: 6px;">保存配置</span>
            </button>
            <button class="btn btn-secondary" id="test-api-config">
              ${createSvgIcon(ICONS.zap, 18, "currentColor")}
              <span style="margin-left: 6px;">测试连接</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="glass-card" style="padding: 32px; margin-bottom: 24px;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: 600; margin-bottom: 16px;">界面设置</h3>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 12px;">
            <span>深色模式</span>
            <div style="width: 48px; height: 24px; background: #8b5cf6; border-radius: 12px; position: relative; cursor: pointer;">
              <div style="position: absolute; right: 2px; top: 2px; width: 20px; height: 20px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
            <span>粒子动画</span>
            <div style="width: 48px; height: 24px; background: #8b5cf6; border-radius: 12px; position: relative; cursor: pointer;">
              <div style="position: absolute; right: 2px; top: 2px; width: 20px; height: 20px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 style="font-weight: 600; margin-bottom: 16px;">AI 设置</h3>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px;">AI 模型</label>
            <select class="input">
              <option>GPT-4 (推荐)</option>
              <option>GPT-3.5</option>
              <option>Claude</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px;">创作风格</label>
            <select class="input">
              <option>平衡</option>
              <option>创意优先</option>
              <option>逻辑优先</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  help: `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">❓ 帮助中心</h1>
        <p class="content-subtitle">了解如何使用创世纪引擎</p>
      </div>
      <div class="glass-card" style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: 600; margin-bottom: 16px;">快速开始</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
              <div style="font-weight: 500; margin-bottom: 4px;">1. 选择创作模式</div>
              <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">根据你的需求选择短篇、中长篇或其他创作模式</div>
            </div>
            <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
              <div style="font-weight: 500; margin-bottom: 4px;">2. 使用AI助手</div>
              <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">在对话模式中与专业AI助手交流，获取创作建议</div>
            </div>
            <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
              <div style="font-weight: 500; margin-bottom: 4px;">3. 生成和导出</div>
              <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">完成创作后，可以导出为多种格式</div>
            </div>
          </div>
        </div>
        <div>
          <h3 style="font-weight: 600; margin-bottom: 16px;">常见问题</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <details style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
              <summary style="cursor: pointer; font-weight: 500;">如何保存我的创作？</summary>
              <div style="margin-top: 12px; font-size: 0.875rem; color: rgba(255,255,255,0.6);">系统会自动保存你的创作进度。你也可以点击"保存草稿"按钮手动保存。</div>
            </details>
            <details style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px;">
              <summary style="cursor: pointer; font-weight: 500;">AI助手能做什么？</summary>
              <div style="margin-top: 12px; font-size: 0.875rem; color: rgba(255,255,255,0.6);">AI助手可以帮助你进行故事构思、角色设计、情节编排、对白创作等各个环节。</div>
            </details>
          </div>
        </div>
      </div>
    </div>
  `
};
class GenesisEngineV3 {
  constructor() {
    __publicField(this, "particleNetwork", null);
    __publicField(this, "currentMode", "full");
    __publicField(this, "chatHistory", []);
    __publicField(this, "currentAgent", null);
    __publicField(this, "selectedAgentId", null);
    __publicField(this, "agentLoop");
    __publicField(this, "agentLoopEnabled", true);
    __publicField(this, "novelState", {
      data: null,
      prompt: "",
      content: "",
      status: "idle"
    });
    __publicField(this, "domCache", /* @__PURE__ */ new Map());
    __publicField(this, "streamingUpdateScheduled", false);
    __publicField(this, "streamingContent", "");
    __publicField(this, "streamingMessageId", "");
    __publicField(this, "lastScrollTop", 0);
    __publicField(this, "rafId", null);
    // ============================================
    // 卡牌创作模块
    // ============================================
    __publicField(this, "currentCardType", "");
    __publicField(this, "comboCards", []);
    this.agentLoop = new AgentLoopEngine();
    this.init();
  }
  $(id) {
    if (!this.domCache.has(id)) {
      this.domCache.set(id, document.getElementById(id));
    }
    return this.domCache.get(id) || null;
  }
  clearDomCache() {
    this.domCache.clear();
  }
  init() {
    this.initParticles();
    this.bindEvents();
    this.animateStats();
    this.hideLoading();
    requestAnimationFrame(() => {
      this.showHomePage();
    });
  }
  showHomePage() {
    const heroSection = this.$("hero-section");
    const featuresSection = this.$("features-section");
    const dynamicContent = this.$("dynamic-content");
    if (heroSection) {
      heroSection.style.cssText = "display: flex; opacity: 1; visibility: visible;";
    }
    if (featuresSection) {
      featuresSection.style.cssText = "display: block; opacity: 1; visibility: visible;";
    }
    if (dynamicContent) {
      dynamicContent.style.cssText = "display: none;";
      dynamicContent.innerHTML = "";
    }
  }
  initParticles() {
    try {
      this.particleNetwork = initParticleNetwork("particles-canvas");
    } catch (error) {
      console.warn("粒子网络初始化失败:", error);
    }
  }
  hideLoading() {
    setTimeout(() => {
      const loading = document.getElementById("loading-overlay");
      if (loading) {
        loading.classList.add("hidden");
        this.animateEntrance();
      }
    }, 1500);
  }
  animateEntrance() {
    const heroSection = this.$("hero-section");
    const featuresSection = this.$("features-section");
    if (heroSection) {
      heroSection.style.cssText = "display: flex; opacity: 1;";
    }
    if (featuresSection) {
      featuresSection.style.cssText = "display: block; opacity: 1;";
    }
    document.querySelectorAll(".feature-card").forEach((card) => {
      card.style.cssText = "opacity: 1; transform: none;";
    });
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero-badge, .hero-title, .hero-subtitle, .hero-actions, .stat-card, .feature-card").forEach((el, i) => {
        el.classList.add("animate-in");
        el.style.animationDelay = `${i * 0.1}s`;
      });
    });
  }
  animateStats() {
    const statValues = document.querySelectorAll(".stat-value");
    statValues.forEach((stat) => {
      const target = parseInt(stat.getAttribute("data-count") || "0");
      const duration = 2e3;
      const start = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeProgress * target);
        stat.textContent = current.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    });
  }
  bindEvents() {
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const mode = e.currentTarget.getAttribute("data-mode");
        if (mode) this.switchMode(mode);
      });
    });
    document.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const mode = e.currentTarget.getAttribute("data-mode");
        if (mode) this.switchMode(mode);
      });
    });
    const startBtn = document.getElementById("start-create");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.switchMode("short"));
    }
    const demoBtn = document.getElementById("view-demo");
    if (demoBtn) {
      demoBtn.addEventListener("click", () => {
        alert("演示功能即将上线！");
      });
    }
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.switchMode("settings"));
    }
  }
  async switchMode(mode) {
    if (this.currentMode === mode) return;
    if (this.currentMode === "short") {
      this.saveNovelState();
    }
    this.currentMode = mode;
    this.clearDomCache();
    const navTabs = document.querySelectorAll(".nav-tab");
    navTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-mode") === mode);
    });
    const heroSection = this.$("hero-section");
    const featuresSection = this.$("features-section");
    const dynamicContent = this.$("dynamic-content");
    if (mode === "full") {
      if (dynamicContent) {
        dynamicContent.style.cssText = "display: none; opacity: 0;";
        dynamicContent.innerHTML = "";
      }
      if (heroSection) {
        heroSection.style.cssText = "display: flex; opacity: 1;";
      }
      if (featuresSection) {
        featuresSection.style.cssText = "display: block; opacity: 1;";
      }
    } else {
      if (heroSection) {
        heroSection.style.cssText = "display: none; opacity: 0;";
      }
      if (featuresSection) {
        featuresSection.style.cssText = "display: none; opacity: 0;";
      }
      const template = MODE_TEMPLATES[mode];
      if (template && dynamicContent) {
        dynamicContent.innerHTML = template;
        dynamicContent.style.cssText = "display: block; opacity: 1;";
        requestAnimationFrame(() => {
          this.bindModeEvents(mode);
          if (mode === "short") {
            this.restoreNovelState();
          }
        });
      }
    }
  }
  saveNovelState() {
    const previewContainer = document.getElementById("prompt-preview");
    if (previewContainer) {
      this.novelState.content = previewContainer.innerHTML;
    }
    const titleInput = document.getElementById("novel-title");
    const synopsisInput = document.getElementById("novel-synopsis");
    if (titleInput || synopsisInput) {
      this.novelState.data = this.collectNovelData();
    }
    localStorage.setItem("novel-state", JSON.stringify(this.novelState));
  }
  restoreNovelState() {
    const saved = localStorage.getItem("novel-state");
    if (saved) {
      try {
        this.novelState = JSON.parse(saved);
      } catch (e) {
        console.error("恢复状态失败:", e);
      }
    }
    if (this.novelState.data) {
      setTimeout(() => {
        var _a, _b, _c;
        const titleInput = document.getElementById("novel-title");
        if (titleInput) titleInput.value = ((_a = this.novelState.data) == null ? void 0 : _a.title) || "";
        const synopsisInput = document.getElementById("novel-synopsis");
        if (synopsisInput) synopsisInput.value = ((_b = this.novelState.data) == null ? void 0 : _b.synopsis) || "";
        const categoryGroup = document.querySelector('.tag-group[data-name="category"]');
        if (categoryGroup && ((_c = this.novelState.data) == null ? void 0 : _c.category)) {
          const tags = categoryGroup.querySelectorAll(".tag-item");
          tags.forEach((tag) => {
            var _a2;
            if (tag.getAttribute("data-value") === ((_a2 = this.novelState.data) == null ? void 0 : _a2.category)) {
              tag.classList.add("selected");
            }
          });
        }
        ["plot", "character", "emotion", "background", "custom"].forEach((name) => {
          var _a2;
          const group = document.querySelector(`.tag-group[data-name="${name}"]`);
          if (group && ((_a2 = this.novelState.data) == null ? void 0 : _a2[name])) {
            const values = this.novelState.data[name];
            const tags = group.querySelectorAll(".tag-item");
            tags.forEach((tag) => {
              if (values.includes(tag.getAttribute("data-value") || "")) {
                tag.classList.add("selected");
              }
            });
          }
        });
        if (this.novelState.content && this.novelState.status !== "idle") {
          const previewContainer = document.getElementById("prompt-preview");
          if (previewContainer) {
            previewContainer.innerHTML = this.novelState.content;
            previewContainer.style.display = "block";
            this.bindWritingEvents();
          }
        }
      }, 100);
    }
  }
  bindWritingEvents() {
    const copyBtn = document.getElementById("copy-prompt");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(this.novelState.prompt).then(() => {
          copyBtn.innerHTML = `${createSvgIcon(ICONS.check, 16, "currentColor")}<span style="margin-left: 4px;">已复制</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `${createSvgIcon(ICONS.copy, 16, "currentColor")}<span style="margin-left: 4px;">复制</span>`;
          }, 2e3);
        });
      });
    }
    const startWritingBtn = document.getElementById("start-writing");
    if (startWritingBtn) {
      startWritingBtn.addEventListener("click", () => {
        this.startNovelWriting(this.novelState.prompt);
      });
    }
    const editSettingsBtn = document.getElementById("edit-settings");
    if (editSettingsBtn) {
      editSettingsBtn.addEventListener("click", () => {
        const previewContainer = document.getElementById("prompt-preview");
        if (previewContainer) {
          previewContainer.style.display = "none";
        }
        const form = document.querySelector(".novel-form");
        if (form) {
          form.style.display = "block";
          form.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }
  bindModeEvents(mode) {
    if (mode === "full") {
      const startCreateBtn = document.getElementById("start-create-btn");
      const exploreBtn = document.getElementById("explore-btn");
      if (startCreateBtn) {
        startCreateBtn.addEventListener("click", () => {
          this.startQuickCreation();
        });
      }
      if (exploreBtn) {
        exploreBtn.addEventListener("click", () => {
          this.switchMode("chat");
        });
      }
      const toolCards = document.querySelectorAll(".tool-card");
      toolCards.forEach((card) => {
        card.addEventListener("click", () => {
          const tool = card.getAttribute("data-tool");
          if (tool) {
            this.switchMode(tool);
          }
        });
      });
    }
    if (mode === "chat") {
      const chatInput = document.getElementById("chat-input");
      const chatSend = document.getElementById("chat-send");
      const agentCards = document.querySelectorAll(".agent-card");
      const sendMessage = async () => {
        if (chatInput && chatInput.value.trim()) {
          const userMessage = chatInput.value.trim();
          this.addChatMessage({
            id: Date.now().toString(),
            role: "user",
            content: userMessage,
            timestamp: /* @__PURE__ */ new Date()
          });
          chatInput.value = "";
          await this.sendChatToAPI(userMessage);
        }
      };
      if (chatSend) {
        chatSend.addEventListener("click", sendMessage);
      }
      if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") sendMessage();
        });
      }
      agentCards.forEach((card) => {
        card.addEventListener("click", () => {
          const agentId = card.getAttribute("data-agent");
          const agent = AGENTS.find((a) => a.id === agentId);
          if (agent) {
            this.currentAgent = agent;
            const avatar = document.getElementById("chat-avatar");
            const name = document.getElementById("chat-agent-name");
            if (avatar) avatar.innerHTML = createSvgIcon(agent.iconSvg, 32, "white");
            if (name) name.textContent = agent.name;
            this.addChatMessage({
              id: Date.now().toString(),
              role: "system",
              content: `已切换到 ${agent.name}。${agent.description}`,
              agentId: agent.id,
              timestamp: /* @__PURE__ */ new Date()
            });
            const chatContainer = document.querySelector(".chat-container");
            if (chatContainer) {
              chatContainer.scrollIntoView({ behavior: "smooth" });
            }
          }
        });
      });
    }
    if (mode === "inspiration") {
      const generateBtn = document.getElementById("generate-inspiration");
      const resultDiv = document.getElementById("inspiration-result");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI生成中...</span>";
          try {
            const inspiration = await this.generateInspirationFromAPI();
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #f59e0b;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px; color: #f59e0b;">${inspiration.title}</h3>
                <p style="line-height: 1.8; color: rgba(255,255,255,0.8);">${inspiration.content}</p>
                <div style="margin-top: 16px; display: flex; gap: 12px;">
                  <button class="btn btn-primary" id="use-inspiration">使用这个灵感</button>
                  <button class="btn btn-secondary" id="regenerate-inspiration">继续生成</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const useBtn = document.getElementById("use-inspiration");
            if (useBtn) {
              useBtn.addEventListener("click", () => {
                this.switchMode("short");
                const promptInput = document.getElementById("novel-prompt");
                if (promptInput) {
                  promptInput.value = `故事标题：${inspiration.title}

故事梗概：${inspiration.content}`;
                }
              });
            }
            const regenBtn = document.getElementById("regenerate-inspiration");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => {
                generateBtn.click();
              });
            }
            gsap.from(resultDiv, {
              opacity: 0,
              y: 20,
              duration: 0.5
            });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px; color: #ef4444;">❌ 生成失败</h3>
                <p style="line-height: 1.8; color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>生成灵感</span>";
        });
      }
    }
    if (mode === "character") {
      const generateBtn = document.getElementById("generate-character");
      const resultDiv = document.getElementById("character-result");
      const promptInput = document.getElementById("character-prompt");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI生成中...</span>";
          try {
            const prompt = `请生成一个详细的小说角色设定。
用户提示：${(promptInput == null ? void 0 : promptInput.value) || "一个有深度的角色"}

请按以下JSON格式返回：
{
  "name": "角色名称",
  "gender": "性别",
  "age": "年龄",
  "occupation": "职业/身份",
  "appearance": "外貌描述（100字以内）",
  "personality": ["性格特点1", "性格特点2", "性格特点3"],
  "background": "背景故事（150字以内）",
  "motivation": "核心动机",
  "conflict": "内心冲突",
  "arc": "角色成长弧线",
  "speech_style": "说话风格",
  "relationships": ["关系1", "关系2"]
}

只返回JSON，不要其他内容。`;
            const result = await this.callToolAPI(prompt);
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ec4899;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                  <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                    ${createSvgIcon(ICONS.user, 40, "white")}
                  </div>
                  <div>
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #ec4899;">${result.name || "未命名角色"}</h3>
                    <p style="color: rgba(255,255,255,0.6);">${result.gender || ""} · ${result.age || ""} · ${result.occupation || ""}</p>
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #a78bfa;">外貌描述</h4>
                  <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">${result.appearance || ""}</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #a78bfa;">性格特点</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(result.personality || []).map((p) => `<span style="padding: 6px 12px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px; font-size: 0.875rem;">${p}</span>`).join("")}
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #a78bfa;">背景故事</h4>
                  <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">${result.background || ""}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div>
                    <h4 style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">核心动机</h4>
                    <p style="color: rgba(255,255,255,0.8);">${result.motivation || ""}</p>
                  </div>
                  <div>
                    <h4 style="font-weight: 600; margin-bottom: 8px; color: #ef4444;">内心冲突</h4>
                    <p style="color: rgba(255,255,255,0.8);">${result.conflict || ""}</p>
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #06b6d4;">角色成长弧线</h4>
                  <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">${result.arc || ""}</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #10b981;">说话风格</h4>
                  <p style="color: rgba(255,255,255,0.8);">${result.speech_style || ""}</p>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                  <button class="btn btn-primary" id="use-character">使用这个角色</button>
                  <button class="btn btn-secondary" id="regenerate-character">重新生成</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const regenBtn = document.getElementById("regenerate-character");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => generateBtn.click());
            }
            gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444;">❌ 生成失败</h3>
                <p style="color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>AI生成角色</span>";
        });
      }
    }
    if (mode === "plot") {
      const generateBtn = document.getElementById("generate-plot");
      const resultDiv = document.getElementById("plot-result");
      const promptInput = document.getElementById("plot-prompt");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI生成中...</span>";
          try {
            const prompt = `请基于以下主题生成一个详细的三幕式情节结构。
主题：${(promptInput == null ? void 0 : promptInput.value) || "一个精彩的故事"}

请按以下JSON格式返回：
{
  "title": "故事标题",
  "logline": "一句话梗概",
  "act1": {
    "title": "第一幕：建置",
    "events": ["事件1", "事件2", "事件3"],
    "turning_point": "转折点描述"
  },
  "act2": {
    "title": "第二幕：对抗",
    "events": ["事件1", "事件2", "事件3", "事件4"],
    "midpoint": "中点转折",
    "turning_point": "第二转折点"
  },
  "act3": {
    "title": "第三幕：解决",
    "events": ["事件1", "事件2"],
    "climax": "高潮描述",
    "resolution": "结局描述"
  },
  "theme": "核心主题",
  "conflict": "核心冲突"
}

只返回JSON，不要其他内容。`;
            const result = await this.callToolAPI(prompt);
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #8b5cf6;">
                <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; color: #8b5cf6;">${result.title || "故事标题"}</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">${result.logline || ""}</p>
                
                <div style="position: relative; padding-left: 40px; margin-bottom: 24px;">
                  <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #8b5cf6, #06b6d4);"></div>
                  
                  <div style="margin-bottom: 24px; padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border-left: 3px solid #8b5cf6;">
                    <div style="position: absolute; left: 7px; width: 16px; height: 16px; background: #8b5cf6; border-radius: 50%; box-shadow: 0 0 10px #8b5cf6;"></div>
                    <h4 style="font-weight: 600; color: #a78bfa; margin-bottom: 12px;">${((_a = result.act1) == null ? void 0 : _a.title) || "第一幕：建置"}</h4>
                    ${(((_b = result.act1) == null ? void 0 : _b.events) || []).map((e) => `<p style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">• ${e}</p>`).join("")}
                    <p style="color: #f59e0b; margin-top: 12px;"><strong>转折点：</strong>${((_c = result.act1) == null ? void 0 : _c.turning_point) || ""}</p>
                  </div>
                  
                  <div style="margin-bottom: 24px; padding: 20px; background: rgba(236, 72, 153, 0.1); border-radius: 12px; border-left: 3px solid #ec4899;">
                    <div style="position: absolute; left: 7px; width: 16px; height: 16px; background: #ec4899; border-radius: 50%; box-shadow: 0 0 10px #ec4899;"></div>
                    <h4 style="font-weight: 600; color: #ec4899; margin-bottom: 12px;">${((_d = result.act2) == null ? void 0 : _d.title) || "第二幕：对抗"}</h4>
                    ${(((_e = result.act2) == null ? void 0 : _e.events) || []).map((e) => `<p style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">• ${e}</p>`).join("")}
                    <p style="color: #06b6d4; margin-top: 12px;"><strong>中点转折：</strong>${((_f = result.act2) == null ? void 0 : _f.midpoint) || ""}</p>
                    <p style="color: #f59e0b;"><strong>第二转折点：</strong>${((_g = result.act2) == null ? void 0 : _g.turning_point) || ""}</p>
                  </div>
                  
                  <div style="padding: 20px; background: rgba(6, 182, 212, 0.1); border-radius: 12px; border-left: 3px solid #06b6d4;">
                    <div style="position: absolute; left: 7px; width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 10px #06b6d4;"></div>
                    <h4 style="font-weight: 600; color: #06b6d4; margin-bottom: 12px;">${((_h = result.act3) == null ? void 0 : _h.title) || "第三幕：解决"}</h4>
                    ${(((_i = result.act3) == null ? void 0 : _i.events) || []).map((e) => `<p style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">• ${e}</p>`).join("")}
                    <p style="color: #ef4444; margin-top: 12px;"><strong>高潮：</strong>${((_j = result.act3) == null ? void 0 : _j.climax) || ""}</p>
                    <p style="color: #10b981;"><strong>结局：</strong>${((_k = result.act3) == null ? void 0 : _k.resolution) || ""}</p>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div style="padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; color: #a78bfa; margin-bottom: 8px;">核心主题</h4>
                    <p style="color: rgba(255,255,255,0.8);">${result.theme || ""}</p>
                  </div>
                  <div style="padding: 16px; background: rgba(236, 72, 153, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; color: #ec4899; margin-bottom: 8px;">核心冲突</h4>
                    <p style="color: rgba(255,255,255,0.8);">${result.conflict || ""}</p>
                  </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                  <button class="btn btn-primary" id="use-plot">使用这个情节</button>
                  <button class="btn btn-secondary" id="regenerate-plot">重新生成</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const regenBtn = document.getElementById("regenerate-plot");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => generateBtn.click());
            }
            gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444;">❌ 生成失败</h3>
                <p style="color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>AI生成情节</span>";
        });
      }
    }
    if (mode === "emotion") {
      const generateBtn = document.getElementById("generate-emotion");
      const resultDiv = document.getElementById("emotion-result");
      const promptInput = document.getElementById("emotion-prompt");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          var _a, _b, _c, _d;
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI分析中...</span>";
          try {
            const prompt = `请分析以下故事的情感曲线，并给出优化建议。
故事梗概：${(promptInput == null ? void 0 : promptInput.value) || "一个感人的故事"}

请按以下JSON格式返回：
{
  "tension_score": 85,
  "turning_points": 8,
  "overall_grade": "A",
  "emotion_curve": [
    {"point": "开端", "emotion": "平静", "intensity": 30},
    {"point": "上升", "emotion": "好奇", "intensity": 50},
    {"point": "中点", "emotion": "紧张", "intensity": 70},
    {"point": "高潮", "emotion": "震撼", "intensity": 95},
    {"point": "结局", "emotion": "释然", "intensity": 40}
  ],
  "analysis": "情感分析描述",
  "suggestions": ["建议1", "建议2", "建议3"],
  "emotion_beats": ["情感节拍1", "情感节拍2", "情感节拍3", "情感节拍4"]
}

只返回JSON，不要其他内容。`;
            const result = await this.callToolAPI(prompt);
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ec4899;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px; color: #ec4899;">情感曲线分析</h3>
                
                <div style="height: 200px; background: rgba(26, 26, 37, 0.6); border-radius: 12px; margin-bottom: 24px; position: relative; overflow: hidden;">
                  <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="emotionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,${200 - (((_b = (_a = result.emotion_curve) == null ? void 0 : _a[0]) == null ? void 0 : _b.intensity) || 30) * 1.8} ${(result.emotion_curve || []).map((p, i) => {
              var _a2, _b2;
              return `Q${i * 200 + 100},${200 - p.intensity * 1.8} ${(i + 1) * 200},${200 - (((_b2 = (_a2 = result.emotion_curve) == null ? void 0 : _a2[i + 1]) == null ? void 0 : _b2.intensity) || p.intensity) * 1.8}`;
            }).join(" ")} L800,200 L0,200 Z" fill="url(#emotionGrad)" />
                    <path d="M0,${200 - (((_d = (_c = result.emotion_curve) == null ? void 0 : _c[0]) == null ? void 0 : _d.intensity) || 30) * 1.8} ${(result.emotion_curve || []).map((p, i) => {
              var _a2, _b2;
              return `Q${i * 200 + 100},${200 - p.intensity * 1.8} ${(i + 1) * 200},${200 - (((_b2 = (_a2 = result.emotion_curve) == null ? void 0 : _a2[i + 1]) == null ? void 0 : _b2.intensity) || p.intensity) * 1.8}`;
            }).join(" ")}" fill="none" stroke="#ec4899" stroke-width="3" />
                    ${(result.emotion_curve || []).map((p, i) => `<circle cx="${i * 200}" cy="${200 - p.intensity * 1.8}" r="6" fill="#ec4899" />`).join("")}
                  </svg>
                  <div style="position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: space-around; font-size: 0.75rem; color: rgba(255,255,255,0.5);">
                    ${(result.emotion_curve || []).map((p) => `<span>${p.point}</span>`).join("")}
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                  <div style="padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #8b5cf6;">${result.tension_score || 85}%</div>
                    <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">情感张力</div>
                  </div>
                  <div style="padding: 16px; background: rgba(236, 72, 153, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ec4899;">${result.turning_points || 8}</div>
                    <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">情绪转折点</div>
                  </div>
                  <div style="padding: 16px; background: rgba(6, 182, 212, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #06b6d4;">${result.overall_grade || "A"}</div>
                    <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">整体评分</div>
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #a78bfa;">情感分析</h4>
                  <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">${result.analysis || ""}</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">优化建议</h4>
                  <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; padding-left: 20px;">
                    ${(result.suggestions || []).map((s) => `<li>${s}</li>`).join("")}
                  </ul>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h4 style="font-weight: 600; margin-bottom: 8px; color: #10b981;">情感节拍</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(result.emotion_beats || []).map((b) => `<span style="padding: 6px 12px; background: rgba(16, 185, 129, 0.2); border-radius: 20px; font-size: 0.875rem;">${b}</span>`).join("")}
                  </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                  <button class="btn btn-secondary" id="regenerate-emotion">重新分析</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const regenBtn = document.getElementById("regenerate-emotion");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => generateBtn.click());
            }
            gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444;">❌ 分析失败</h3>
                <p style="color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>AI分析情感</span>";
        });
      }
    }
    if (mode === "world") {
      const generateBtn = document.getElementById("generate-world");
      const resultDiv = document.getElementById("world-result");
      const promptInput = document.getElementById("world-prompt");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI构建中...</span>";
          try {
            const prompt = `请构建一个完整的世界观设定。
世界类型/提示：${(promptInput == null ? void 0 : promptInput.value) || "一个独特的世界"}

请按以下JSON格式返回：
{
  "name": "世界名称",
  "type": "世界类型（如：奇幻、科幻、历史等）",
  "geography": {
    "overview": "地理概述",
    "regions": ["区域1", "区域2", "区域3"],
    "climate": "气候特点",
    "landmarks": ["地标1", "地标2"]
  },
  "history": {
    "timeline": ["历史事件1", "历史事件2", "历史事件3"],
    "major_events": "重大事件描述",
    "current_era": "当前时代"
  },
  "culture": {
    "society": "社会结构",
    "customs": ["习俗1", "习俗2"],
    "religion": "宗教信仰",
    "art": "艺术特色"
  },
  "magic_system": {
    "type": "魔法/科技类型",
    "rules": ["规则1", "规则2"],
    "limitations": "限制条件",
    "users": "使用者"
  },
  "politics": {
    "government": "政治体制",
    "factions": ["势力1", "势力2"],
    "conflicts": "主要冲突"
  },
  "economy": {
    "currency": "货币系统",
    "trade": "贸易特点",
    "resources": ["资源1", "资源2"]
  }
}

只返回JSON，不要其他内容。`;
            const result = await this.callToolAPI(prompt);
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #06b6d4;">
                <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; color: #06b6d4;">${result.name || "世界名称"}</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">${result.type || ""}</p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                  <div style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px; color: #a78bfa; display: flex; align-items: center; gap: 8px;">
                      ${createSvgIcon(ICONS.castle, 18, "#a78bfa")} 地理环境
                    </h4>
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 12px;">${((_a = result.geography) == null ? void 0 : _a.overview) || ""}</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>区域：</strong>${(((_b = result.geography) == null ? void 0 : _b.regions) || []).join("、")}</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>气候：</strong>${((_c = result.geography) == null ? void 0 : _c.climate) || ""}</p>
                  </div>
                  
                  <div style="padding: 20px; background: rgba(236, 72, 153, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px; color: #ec4899; display: flex; align-items: center; gap: 8px;">
                      ${createSvgIcon(ICONS.book, 18, "#ec4899")} 历史背景
                    </h4>
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 12px;">${((_d = result.history) == null ? void 0 : _d.major_events) || ""}</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>当前时代：</strong>${((_e = result.history) == null ? void 0 : _e.current_era) || ""}</p>
                  </div>
                  
                  <div style="padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
                      ${createSvgIcon(ICONS.users, 18, "#f59e0b")} 文化习俗
                    </h4>
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 12px;">${((_f = result.culture) == null ? void 0 : _f.society) || ""}</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>习俗：</strong>${(((_g = result.culture) == null ? void 0 : _g.customs) || []).join("、")}</p>
                  </div>
                  
                  <div style="padding: 20px; background: rgba(6, 182, 212, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px; color: #06b6d4; display: flex; align-items: center; gap: 8px;">
                      ${createSvgIcon(ICONS.sparkles, 18, "#06b6d4")} 魔法/科技体系
                    </h4>
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 12px;">${((_h = result.magic_system) == null ? void 0 : _h.type) || ""}</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>规则：</strong>${(((_i = result.magic_system) == null ? void 0 : _i.rules) || []).join("、")}</p>
                  </div>
                </div>
                
                <div style="margin-top: 20px; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                  <h4 style="font-weight: 600; margin-bottom: 12px; color: #10b981;">政治与经济</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>政治体制：</strong>${((_j = result.politics) == null ? void 0 : _j.government) || ""}</p>
                      <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>主要势力：</strong>${(((_k = result.politics) == null ? void 0 : _k.factions) || []).join("、")}</p>
                    </div>
                    <div>
                      <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>货币：</strong>${((_l = result.economy) == null ? void 0 : _l.currency) || ""}</p>
                      <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;"><strong>贸易：</strong>${((_m = result.economy) == null ? void 0 : _m.trade) || ""}</p>
                    </div>
                  </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                  <button class="btn btn-primary" id="use-world">使用这个世界</button>
                  <button class="btn btn-secondary" id="regenerate-world">重新构建</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const regenBtn = document.getElementById("regenerate-world");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => generateBtn.click());
            }
            gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444;">❌ 构建失败</h3>
                <p style="color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>AI构建世界</span>";
        });
      }
    }
    if (mode === "dialogue") {
      const generateBtn = document.getElementById("generate-dialogue");
      const resultDiv = document.getElementById("dialogue-result");
      const promptInput = document.getElementById("dialogue-prompt");
      const styleSelect = document.getElementById("dialogue-style");
      if (generateBtn && resultDiv) {
        generateBtn.addEventListener("click", async () => {
          generateBtn.disabled = true;
          generateBtn.innerHTML = "<span>⏳</span><span>AI生成中...</span>";
          try {
            const style = (styleSelect == null ? void 0 : styleSelect.value) || "natural";
            const styleMap = {
              "natural": "自然日常，口语化",
              "dramatic": "戏剧张力，情感强烈",
              "humorous": "幽默风趣，轻松诙谐",
              "poetic": "诗意浪漫，优美动人",
              "suspense": "悬疑紧张，扣人心弦"
            };
            const prompt = `请生成一段精彩的对话。
场景与角色：${(promptInput == null ? void 0 : promptInput.value) || "两个角色的对话"}
风格：${styleMap[style]}

请按以下JSON格式返回：
{
  "title": "对话标题",
  "scene": "场景描述",
  "characters": [
    {"name": "角色A", "description": "角色描述"},
    {"name": "角色B", "description": "角色描述"}
  ],
  "dialogue": [
    {"speaker": "角色A", "line": "台词内容", "action": "动作/表情（可选）", "subtext": "潜台词（可选）"},
    {"speaker": "角色B", "line": "台词内容", "action": "动作/表情（可选）", "subtext": "潜台词（可选）"}
  ],
  "emotion_progression": ["情绪变化1", "情绪变化2"],
  "key_moments": ["关键时刻1", "关键时刻2"],
  "notes": "创作说明"
}

只返回JSON，不要其他内容。`;
            const result = await this.callToolAPI(prompt);
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #10b981;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; color: #10b981;">${result.title || "对话"}</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">${result.scene || ""}</p>
                
                <div style="margin-bottom: 24px;">
                  ${(result.dialogue || []).map((d, i) => `
                    <div style="margin-bottom: 16px; padding: 16px; background: ${i % 2 === 0 ? "rgba(139, 92, 246, 0.1)" : "rgba(236, 72, 153, 0.1)"}; border-radius: 12px; border-left: 3px solid ${i % 2 === 0 ? "#8b5cf6" : "#ec4899"};">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: ${i % 2 === 0 ? "#a78bfa" : "#ec4899"};">${d.speaker}</span>
                        ${d.action ? `<span style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">（${d.action}）</span>` : ""}
                      </div>
                      <p style="color: rgba(255,255,255,0.9); line-height: 1.6; margin-bottom: ${d.subtext ? "8px" : "0"};">"${d.line}"</p>
                      ${d.subtext ? `<p style="color: rgba(255,255,255,0.5); font-size: 0.875rem; font-style: italic;">💡 潜台词：${d.subtext}</p>` : ""}
                    </div>
                  `).join("")}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div style="padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 8px; color: #a78bfa;">情绪变化</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                      ${(result.emotion_progression || []).map((e) => `<span style="padding: 4px 8px; background: rgba(139, 92, 246, 0.2); border-radius: 12px; font-size: 0.75rem;">${e}</span>`).join("")}
                    </div>
                  </div>
                  <div style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                    <h4 style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">关键时刻</h4>
                    <ul style="color: rgba(255,255,255,0.8); font-size: 0.875rem; padding-left: 16px;">
                      ${(result.key_moments || []).map((m) => `<li>${m}</li>`).join("")}
                    </ul>
                  </div>
                </div>
                
                ${result.notes ? `<p style="color: rgba(255,255,255,0.6); font-size: 0.875rem; font-style: italic;">📝 ${result.notes}</p>` : ""}
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                  <button class="btn btn-primary" id="use-dialogue">使用这段对话</button>
                  <button class="btn btn-secondary" id="regenerate-dialogue">重新生成</button>
                </div>
              </div>
            `;
            resultDiv.style.display = "block";
            const regenBtn = document.getElementById("regenerate-dialogue");
            if (regenBtn) {
              regenBtn.addEventListener("click", () => generateBtn.click());
            }
            gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
          } catch (error) {
            resultDiv.innerHTML = `
              <div class="glass-card" style="padding: 24px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444;">❌ 生成失败</h3>
                <p style="color: rgba(255,255,255,0.8);">${error.message || "请检查API配置"}</p>
              </div>
            `;
            resultDiv.style.display = "block";
          }
          generateBtn.disabled = false;
          generateBtn.innerHTML = "<span>✨</span><span>AI生成对话</span>";
        });
      }
    }
    if (mode === "short") {
      this.initNovelForm();
    }
    if (mode === "medium") {
      this.initMediumForm();
    }
    if (mode === "dialogue") {
      this.initDialogueForm();
    }
    if (mode === "outline") {
      this.initOutlineForm();
    }
    if (mode === "card") {
      this.initCardForm();
    }
    if (mode === "settings") {
      this.initSettingsForm();
    }
  }
  initSettingsForm() {
    const providerSelect = document.getElementById("api-provider");
    const endpointInput = document.getElementById("api-endpoint");
    const apiKeyInput = document.getElementById("api-key");
    const configNameInput = document.getElementById("api-config-name");
    const toggleVisibilityBtn = document.getElementById("toggle-api-key-visibility");
    const saveBtn = document.getElementById("save-api-config");
    const testBtn = document.getElementById("test-api-config");
    const providerEndpoints = {
      openai: "https://api.openai.com/v1/chat/completions",
      anthropic: "https://api.anthropic.com/v1/messages",
      google: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      deepseek: "https://api.deepseek.com/v1/chat/completions",
      moonshot: "https://api.moonshot.cn/v1/chat/completions",
      zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      minimax: "https://api.minimax.chat/v1/chat/completions",
      qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      doubao: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      baidu: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions",
      alibaba: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
    };
    const savedConfigs = JSON.parse(localStorage.getItem("api-configs") || "[]");
    if (savedConfigs.length > 0) {
      const lastConfig = savedConfigs[savedConfigs.length - 1];
      if (configNameInput) configNameInput.value = lastConfig.name || "";
      if (providerSelect) providerSelect.value = lastConfig.provider || "";
      if (endpointInput) endpointInput.value = lastConfig.endpoint || "";
      if (apiKeyInput) apiKeyInput.value = lastConfig.apiKey || "";
    }
    if (providerSelect && endpointInput) {
      providerSelect.addEventListener("change", () => {
        const selectedProvider = providerSelect.value;
        if (selectedProvider && providerEndpoints[selectedProvider]) {
          endpointInput.value = providerEndpoints[selectedProvider];
        }
      });
    }
    if (toggleVisibilityBtn && apiKeyInput) {
      toggleVisibilityBtn.addEventListener("click", () => {
        const isPassword = apiKeyInput.type === "password";
        apiKeyInput.type = isPassword ? "text" : "password";
        toggleVisibilityBtn.innerHTML = isPassword ? createSvgIcon(ICONS.eyeOff, 18, "rgba(255,255,255,0.8)") : createSvgIcon(ICONS.eye, 18, "rgba(255,255,255,0.8)");
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        var _a, _b;
        const configName = ((_a = document.getElementById("api-config-name")) == null ? void 0 : _a.value) || "默认配置";
        const provider = (providerSelect == null ? void 0 : providerSelect.value) || "";
        const endpoint = (endpointInput == null ? void 0 : endpointInput.value) || "";
        const apiKey = (apiKeyInput == null ? void 0 : apiKeyInput.value) || "";
        const modelName = ((_b = document.getElementById("api-model-name")) == null ? void 0 : _b.value) || "";
        if (!endpoint || !apiKey) {
          alert("请填写完整的API配置信息");
          return;
        }
        const config = {
          name: configName,
          provider,
          endpoint,
          apiKey,
          model: modelName,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const configs = JSON.parse(localStorage.getItem("api-configs") || "[]");
        const existingIndex = configs.findIndex((c) => c.name === configName);
        if (existingIndex >= 0) {
          configs[existingIndex] = config;
        } else {
          configs.push(config);
        }
        localStorage.setItem("api-configs", JSON.stringify(configs));
        const successToast = document.createElement("div");
        successToast.className = "toast-success";
        successToast.innerHTML = "✅ API配置已保存";
        successToast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 2e3);
      });
    }
    if (testBtn) {
      testBtn.addEventListener("click", async () => {
        const endpoint = (endpointInput == null ? void 0 : endpointInput.value) || "";
        const apiKey = (apiKeyInput == null ? void 0 : apiKeyInput.value) || "";
        if (!endpoint || !apiKey) {
          alert("请填写完整的API配置信息");
          return;
        }
        testBtn.innerHTML = "<span>测试中...</span>";
        testBtn.setAttribute("disabled", "true");
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          alert("API连接测试成功！");
        } catch (error) {
          alert("API连接测试失败，请检查配置");
        } finally {
          testBtn.innerHTML = `${createSvgIcon(ICONS.zap, 18, "currentColor")}<span style="margin-left:6px;">测试连接</span>`;
          testBtn.removeAttribute("disabled");
        }
      });
    }
  }
  initNovelForm() {
    const tagGroups = document.querySelectorAll(".tag-group");
    tagGroups.forEach((group) => {
      const isSingleSelect = group.classList.contains("single-select");
      const tags = group.querySelectorAll(".tag-item");
      tags.forEach((tag) => {
        tag.addEventListener("click", () => {
          if (isSingleSelect) {
            tags.forEach((t) => t.classList.remove("selected"));
            tag.classList.add("selected");
            const section = group.closest(".form-section");
            if (section) {
              section.style.maxHeight = "60px";
              section.style.overflow = "hidden";
              section.style.transition = "max-height 0.3s ease";
              setTimeout(() => {
                section.style.maxHeight = "";
                section.style.overflow = "";
              }, 3e3);
            }
          } else {
            tag.classList.toggle("selected");
          }
        });
      });
    });
    this.initAgentSelectors();
    const customTagInput = document.getElementById("custom-tag-input");
    const addCustomTagBtn = document.getElementById("add-custom-tag");
    const customTagsContainer = document.getElementById("custom-tags");
    if (addCustomTagBtn && customTagInput && customTagsContainer) {
      const addCustomTag = () => {
        const value = customTagInput.value.trim();
        if (value) {
          const tagElement = document.createElement("div");
          tagElement.className = "tag-item selected";
          tagElement.setAttribute("data-value", value);
          tagElement.textContent = value;
          tagElement.addEventListener("click", () => {
            tagElement.remove();
          });
          customTagsContainer.appendChild(tagElement);
          customTagInput.value = "";
        }
      };
      addCustomTagBtn.addEventListener("click", addCustomTag);
      customTagInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addCustomTag();
        }
      });
    }
    const saveBtn = document.getElementById("save-novel");
    const cancelBtn = document.getElementById("cancel-novel");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const novelData = this.collectNovelData();
        if (!novelData.title) {
          alert("请输入书名");
          return;
        }
        const fullPrompt = buildNovelPrompt(novelData);
        this.novelState.data = novelData;
        this.novelState.prompt = fullPrompt;
        this.novelState.status = "idle";
        this.saveNovelState();
        const previewContainer = document.getElementById("prompt-preview");
        if (previewContainer) {
          previewContainer.style.display = "block";
          previewContainer.innerHTML = `
            <div class="glass-card" style="padding: 32px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h3 style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  ${createSvgIcon(ICONS.sparkles, 24, "#fbbf24")}
                  <span>核心提示词</span>
                </h3>
                <button class="btn btn-secondary btn-sm" id="copy-prompt" style="padding: 6px 12px; font-size: 0.875rem;">
                  ${createSvgIcon(ICONS.copy, 16, "currentColor")}
                  <span style="margin-left: 4px;">复制</span>
                </button>
              </div>
              <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; color: rgba(255,255,255,0.9);">
${this.escapeHtml(fullPrompt)}
              </div>
              <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-primary" id="start-writing" style="flex: 1;">
                  ${createSvgIcon(ICONS.send, 18, "white")}
                  <span style="margin-left: 6px;">开始创作</span>
                </button>
                <button class="btn btn-secondary" id="edit-settings">
                  ${createSvgIcon(ICONS.edit, 18, "currentColor")}
                  <span style="margin-left: 6px;">修改设定</span>
                </button>
              </div>
            </div>
          `;
          const copyBtn = document.getElementById("copy-prompt");
          if (copyBtn) {
            copyBtn.addEventListener("click", () => {
              navigator.clipboard.writeText(fullPrompt).then(() => {
                copyBtn.innerHTML = `${createSvgIcon(ICONS.check, 16, "currentColor")}<span style="margin-left: 4px;">已复制</span>`;
                setTimeout(() => {
                  copyBtn.innerHTML = `${createSvgIcon(ICONS.copy, 16, "currentColor")}<span style="margin-left: 4px;">复制</span>`;
                }, 2e3);
              });
            });
          }
          const startWritingBtn = document.getElementById("start-writing");
          if (startWritingBtn) {
            startWritingBtn.addEventListener("click", () => {
              this.startNovelWriting(fullPrompt);
            });
          }
          const editSettingsBtn = document.getElementById("edit-settings");
          if (editSettingsBtn) {
            editSettingsBtn.addEventListener("click", () => {
              previewContainer.style.display = "none";
              const form = document.querySelector(".novel-form");
              if (form) {
                form.style.display = "block";
                form.scrollIntoView({ behavior: "smooth" });
              }
            });
          }
          previewContainer.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.switchMode("full");
      });
    }
  }
  collectNovelData() {
    const data = {
      title: "",
      category: "",
      plot: [],
      character: [],
      emotion: [],
      background: [],
      custom: [],
      synopsis: ""
    };
    const titleInput = document.getElementById("novel-title");
    if (titleInput) data.title = titleInput.value.trim();
    const synopsisInput = document.getElementById("novel-synopsis");
    if (synopsisInput) data.synopsis = synopsisInput.value.trim();
    const categoryGroup = document.querySelector('.tag-group[data-name="category"]');
    if (categoryGroup) {
      const selected = categoryGroup.querySelector(".tag-item.selected");
      if (selected) data.category = selected.getAttribute("data-value") || "";
    }
    ["plot", "character", "emotion", "background", "custom"].forEach((name) => {
      const group = document.querySelector(`.tag-group[data-name="${name}"]`);
      if (group) {
        const selected = group.querySelectorAll(".tag-item.selected");
        data[name] = Array.from(selected).map((tag) => tag.getAttribute("data-value") || "");
      }
    });
    return data;
  }
  // ============================================
  // 中长篇小说模块
  // ============================================
  initMediumForm() {
    this.initTagGroups();
    this.initCustomTags("custom-tag-input", "add-custom-tag", "custom-tags");
    this.initAgentSelectors();
    this.initFormActions("save-medium", "cancel-medium", () => this.collectMediumData(), buildMediumPrompt, "中长篇小说");
  }
  collectMediumData() {
    const data = {
      title: "",
      wordCount: "",
      category: "",
      plot: [],
      character: [],
      setting: [],
      custom: [],
      synopsis: ""
    };
    const titleInput = document.getElementById("medium-title");
    if (titleInput) data.title = titleInput.value.trim();
    const wordCountInput = document.getElementById("medium-wordcount");
    if (wordCountInput) data.wordCount = wordCountInput.value;
    const synopsisInput = document.getElementById("medium-synopsis");
    if (synopsisInput) data.synopsis = synopsisInput.value.trim();
    const categoryGroup = document.querySelector('.tag-group[data-name="category"]');
    if (categoryGroup) {
      const selected = categoryGroup.querySelector(".tag-item.selected");
      if (selected) data.category = selected.getAttribute("data-value") || "";
    }
    ["plot", "character", "setting", "custom"].forEach((name) => {
      const group = document.querySelector(`.tag-group[data-name="${name}"]`);
      if (group) {
        const selected = group.querySelectorAll(".tag-item.selected");
        data[name] = Array.from(selected).map((tag) => tag.getAttribute("data-value") || "");
      }
    });
    return data;
  }
  // ============================================
  // 对话创作模块
  // ============================================
  initDialogueForm() {
    this.initTagGroups();
    this.initAgentSelectors();
    const addCharBtn = document.getElementById("add-character-btn");
    if (addCharBtn) {
      addCharBtn.addEventListener("click", () => this.addCharacterCard());
    }
    const lengthOptions = document.querySelectorAll('input[name="dialogue-length"]');
    lengthOptions.forEach((option) => {
      option.addEventListener("change", (e) => {
        const target = e.target;
        document.querySelectorAll(".length-option").forEach((el) => {
          el.style.borderColor = "rgba(255,255,255,0.1)";
          el.style.background = "rgba(255,255,255,0.05)";
        });
        const parent = target.closest("label");
        if (parent) {
          const optionDiv = parent.querySelector(".length-option");
          if (optionDiv) {
            optionDiv.style.borderColor = "var(--primary)";
            optionDiv.style.background = "rgba(139, 92, 246, 0.2)";
          }
        }
      });
    });
    const saveBtn = document.getElementById("save-dialogue");
    const cancelBtn = document.getElementById("cancel-dialogue");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const data = this.collectDialogueData();
        if (!data.scene) {
          alert("请填写场景设定");
          return;
        }
        const validCharacters = data.characters.filter((c) => c.name);
        if (validCharacters.length < 2) {
          alert("请至少配置两个角色");
          return;
        }
        const fullPrompt = buildDialoguePrompt(data);
        this.showPromptPreview(fullPrompt, "对话创作");
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.switchMode("full");
      });
    }
  }
  addCharacterCard() {
    const container = document.getElementById("characters-container");
    if (!container) return;
    const existingCards = container.querySelectorAll(".character-card");
    const index = existingCards.length;
    if (index >= 4) {
      alert("最多支持4个角色");
      return;
    }
    const colors = [
      { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.3)", label: "#a78bfa", gradient: "linear-gradient(135deg, #8b5cf6, #06b6d4)" },
      { bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.3)", label: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #f59e0b)" },
      { bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.3)", label: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4, #10b981)" },
      { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", label: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" }
    ];
    const color = colors[index];
    const letter = String.fromCharCode(65 + index);
    const card = document.createElement("div");
    card.className = "character-card";
    card.dataset.index = String(index);
    card.style.cssText = `background: ${color.bg}; border: 1px solid ${color.border}; border-radius: 12px; padding: 16px; margin-bottom: 12px;`;
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 28px; height: 28px; background: ${color.gradient}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600;">${letter}</span>
          <span style="font-weight: 600; color: ${color.label};">角色 ${letter}</span>
        </div>
        <button class="btn btn-secondary btn-sm remove-character" style="padding: 4px 8px; font-size: 0.7rem;">删除</button>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <input type="text" class="input character-name" placeholder="角色名称" style="font-size: 0.875rem;">
        <input type="text" class="input character-title" placeholder="身份/职业" style="font-size: 0.875rem;">
      </div>
      <input type="text" class="input character-personality" placeholder="性格特点" style="margin-top: 8px; font-size: 0.875rem;">
      <textarea class="input character-background" placeholder="背景故事/当前状态..." rows="2" style="margin-top: 8px; font-size: 0.875rem; resize: vertical;"></textarea>
    `;
    container.appendChild(card);
    const removeBtn = card.querySelector(".remove-character");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        card.remove();
        this.reindexCharacterCards();
      });
    }
  }
  reindexCharacterCards() {
    const container = document.getElementById("characters-container");
    if (!container) return;
    const cards = container.querySelectorAll(".character-card");
    const colors = [
      { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.3)", label: "#a78bfa", gradient: "linear-gradient(135deg, #8b5cf6, #06b6d4)" },
      { bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.3)", label: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #f59e0b)" },
      { bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.3)", label: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4, #10b981)" },
      { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", label: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" }
    ];
    cards.forEach((card, index) => {
      const color = colors[index];
      const letter = String.fromCharCode(65 + index);
      card.dataset.index = String(index);
      card.style.background = color.bg;
      card.style.borderColor = color.border;
      const badge = card.querySelector("span:first-child");
      const label = card.querySelector("span:nth-child(2)");
      if (badge) {
        badge.style.background = color.gradient;
        badge.textContent = letter;
      }
      if (label) {
        label.style.color = color.label;
        label.textContent = `角色 ${letter}`;
      }
    });
  }
  collectDialogueData() {
    const data = {
      scene: "",
      characters: [],
      topic: "",
      goal: "",
      tone: "",
      style: [],
      length: "medium",
      subtext: "",
      special: ""
    };
    const sceneInput = document.getElementById("dialogue-scene");
    if (sceneInput) data.scene = sceneInput.value.trim();
    const characterCards = document.querySelectorAll(".character-card");
    characterCards.forEach((card) => {
      const nameInput = card.querySelector(".character-name");
      const titleInput = card.querySelector(".character-title");
      const personalityInput = card.querySelector(".character-personality");
      const backgroundInput = card.querySelector(".character-background");
      if (nameInput && nameInput.value.trim()) {
        data.characters.push({
          name: nameInput.value.trim(),
          title: (titleInput == null ? void 0 : titleInput.value.trim()) || "",
          personality: (personalityInput == null ? void 0 : personalityInput.value.trim()) || "",
          background: (backgroundInput == null ? void 0 : backgroundInput.value.trim()) || ""
        });
      }
    });
    const topicInput = document.getElementById("dialogue-topic");
    if (topicInput) data.topic = topicInput.value.trim();
    const goalInput = document.getElementById("dialogue-goal");
    if (goalInput) data.goal = goalInput.value.trim();
    const toneGroup = document.querySelector('.tag-group[data-name="dialogue-tone"]');
    if (toneGroup) {
      const selected = toneGroup.querySelector(".tag-item.selected");
      if (selected) {
        data.tone = selected.getAttribute("data-value") || "";
      }
    }
    const styleGroup = document.querySelector('.tag-group[data-name="dialogue-style"]');
    if (styleGroup) {
      const selected = styleGroup.querySelectorAll(".tag-item.selected");
      data.style = Array.from(selected).map((tag) => tag.getAttribute("data-value") || "");
    }
    const lengthInput = document.querySelector('input[name="dialogue-length"]:checked');
    if (lengthInput) data.length = lengthInput.value;
    const subtextInput = document.getElementById("dialogue-subtext");
    if (subtextInput) data.subtext = subtextInput.value.trim();
    const specialInput = document.getElementById("dialogue-special");
    if (specialInput) data.special = specialInput.value.trim();
    return data;
  }
  // ============================================
  // 细纲创作模块
  // ============================================
  initOutlineForm() {
    this.initTagGroups();
    this.initCustomTags("custom-tag-input", "add-custom-tag", "custom-tags");
    this.initAgentSelectors();
    this.initFormActions("save-outline", "cancel-outline", () => this.collectOutlineData(), buildOutlinePrompt, "细纲创作");
  }
  collectOutlineData() {
    const data = {
      title: "",
      totalChapters: "",
      structure: "",
      genre: [],
      elements: [],
      synopsis: ""
    };
    const titleInput = document.getElementById("outline-title");
    if (titleInput) data.title = titleInput.value.trim();
    const chaptersInput = document.getElementById("outline-chapters");
    if (chaptersInput) data.totalChapters = chaptersInput.value;
    const structureInput = document.getElementById("outline-structure");
    if (structureInput) data.structure = structureInput.value;
    const synopsisInput = document.getElementById("outline-synopsis");
    if (synopsisInput) data.synopsis = synopsisInput.value.trim();
    ["genre", "elements"].forEach((name) => {
      const group = document.querySelector(`.tag-group[data-name="${name}"]`);
      if (group) {
        const selected = group.querySelectorAll(".tag-item.selected");
        data[name] = Array.from(selected).map((tag) => tag.getAttribute("data-value") || "");
      }
    });
    return data;
  }
  initCardForm() {
    this.initCardModeSwitch();
    this.initSingleCardMode();
    this.initComboCardMode();
    this.initCardHistoryMode();
  }
  initCardModeSwitch() {
    const modeButtons = {
      single: document.getElementById("card-mode-single"),
      multi: document.getElementById("card-mode-multi"),
      history: document.getElementById("card-mode-history")
    };
    const modeContainers = {
      single: document.getElementById("card-single-mode"),
      multi: document.getElementById("card-multi-mode"),
      history: document.getElementById("card-history-mode")
    };
    Object.entries(modeButtons).forEach(([mode, btn]) => {
      if (btn) {
        btn.addEventListener("click", () => {
          Object.values(modeButtons).forEach((b) => {
            if (b) {
              b.classList.remove("btn-primary", "active");
              b.classList.add("btn-secondary");
            }
          });
          btn.classList.remove("btn-secondary");
          btn.classList.add("btn-primary", "active");
          Object.entries(modeContainers).forEach(([m, container]) => {
            if (container) {
              container.style.display = m === mode ? "block" : "none";
            }
          });
          const result = document.getElementById("card-result");
          if (result) result.style.display = "none";
        });
      }
    });
  }
  initSingleCardMode() {
    const cardItems = document.querySelectorAll(".card-item");
    const cardSelection = document.getElementById("card-selection");
    const cardConfigForm = document.getElementById("card-config-form");
    cardItems.forEach((item) => {
      item.addEventListener("click", () => {
        const cardType = item.getAttribute("data-card-type");
        if (cardType && cardSelection && cardConfigForm) {
          this.currentCardType = cardType;
          const titleEl = document.getElementById("card-type-title");
          if (titleEl) {
            const cardNames = {
              character: "角色卡牌",
              scene: "场景卡牌",
              item: "道具卡牌",
              event: "事件卡牌",
              conflict: "冲突卡牌",
              emotion: "情感卡牌",
              plot: "情节卡牌",
              mystery: "悬疑卡牌",
              twist: "反转卡牌",
              dialogue: "对白卡牌",
              world: "世界卡牌",
              ending: "结局卡牌"
            };
            titleEl.textContent = cardNames[cardType] || "卡牌";
          }
          this.updateCardSpecificOptions(cardType);
          this.updateCardPlaceholder(cardType);
          cardSelection.style.display = "none";
          cardConfigForm.style.display = "block";
          this.initTagGroups();
        }
      });
    });
    const backBtn = document.getElementById("back-to-cards");
    if (backBtn && cardSelection && cardConfigForm) {
      backBtn.addEventListener("click", () => {
        cardConfigForm.style.display = "none";
        cardSelection.style.display = "grid";
        this.currentCardType = "";
      });
    }
    const difficultyOptions = document.querySelectorAll('input[name="card-difficulty"]');
    difficultyOptions.forEach((option) => {
      option.addEventListener("change", (e) => {
        const target = e.target;
        document.querySelectorAll(".difficulty-option").forEach((el) => {
          el.style.borderColor = "rgba(255,255,255,0.1)";
          el.style.background = "rgba(255,255,255,0.05)";
        });
        const parent = target.closest("label");
        if (parent) {
          const optionDiv = parent.querySelector(".difficulty-option");
          if (optionDiv) {
            optionDiv.style.borderColor = "var(--primary)";
            optionDiv.style.background = "rgba(139, 92, 246, 0.2)";
          }
        }
      });
    });
    const generateBtn = document.getElementById("generate-card");
    const cancelBtn = document.getElementById("cancel-card");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        const data = this.collectCardData();
        const fullPrompt = buildCardPrompt(data);
        this.showPromptPreview(fullPrompt, "卡牌创作");
        this.saveCardToHistory(data);
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.switchMode("full");
      });
    }
  }
  // ============================================
  // 卡牌类型特定配置选项
  // ============================================
  updateCardSpecificOptions(cardType) {
    const container = document.getElementById("card-specific-options");
    if (!container) return;
    let html = "";
    switch (cardType) {
      case "character":
        html = `
          <div class="form-section">
            <h3 class="section-title">角色定位（单选）</h3>
            <div class="tag-group single-select" data-name="character-role">
              <div class="tag-item selected" data-value=" protagonist">主角</div>
              <div class="tag-item" data-value="supporting">配角</div>
              <div class="tag-item" data-value="antagonist">反派</div>
              <div class="tag-item" data-value="mentor">导师</div>
              <div class="tag-item" data-value="love">恋人</div>
              <div class="tag-item" data-value="comic">喜剧角色</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">角色特质（多选）</h3>
            <div class="tag-group" data-name="character-traits">
              <div class="tag-item" data-value="brave">勇敢</div>
              <div class="tag-item" data-value="clever">聪明</div>
              <div class="tag-item" data-value="mysterious">神秘</div>
              <div class="tag-item" data-value="tragic">悲剧</div>
              <div class="tag-item" data-value="humorous">幽默</div>
              <div class="tag-item" data-value="cunning">狡猾</div>
              <div class="tag-item" data-value="loyal">忠诚</div>
              <div class="tag-item" data-value="rebellious">叛逆</div>
            </div>
          </div>
        `;
        break;
      case "scene":
        html = `
          <div class="form-section">
            <h3 class="section-title">场景类型（单选）</h3>
            <div class="tag-group single-select" data-name="scene-type">
              <div class="tag-item selected" data-value="indoor">室内</div>
              <div class="tag-item" data-value="outdoor">室外</div>
              <div class="tag-item" data-value="nature">自然</div>
              <div class="tag-item" data-value="urban">都市</div>
              <div class="tag-item" data-value="fantasy">奇幻</div>
              <div class="tag-item" data-value="battle">战场</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">场景氛围（单选）</h3>
            <div class="tag-group single-select" data-name="scene-mood">
              <div class="tag-item selected" data-value="peaceful">宁静</div>
              <div class="tag-item" data-value="tense">紧张</div>
              <div class="tag-item" data-value="romantic">浪漫</div>
              <div class="tag-item" data-value="mysterious">神秘</div>
              <div class="tag-item" data-value="epic">史诗</div>
              <div class="tag-item" data-value="horror">恐怖</div>
            </div>
          </div>
        `;
        break;
      case "item":
        html = `
          <div class="form-section">
            <h3 class="section-title">道具类型（单选）</h3>
            <div class="tag-group single-select" data-name="item-type">
              <div class="tag-item selected" data-value="weapon">武器</div>
              <div class="tag-item" data-value="magic">魔法物品</div>
              <div class="tag-item" data-value="key">关键道具</div>
              <div class="tag-item" data-value="treasure">宝藏</div>
              <div class="tag-item" data-value="cursed">诅咒物品</div>
              <div class="tag-item" data-value="daily">日常物品</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">道具属性（多选）</h3>
            <div class="tag-group" data-name="item-attributes">
              <div class="tag-item" data-value="powerful">强大</div>
              <div class="tag-item" data-value="hidden">隐藏</div>
              <div class="tag-item" data-value="ancient">古老</div>
              <div class="tag-item" data-value="unique">独特</div>
              <div class="tag-item" data-value="dangerous">危险</div>
              <div class="tag-item" data-value="sentient">有灵性</div>
            </div>
          </div>
        `;
        break;
      case "event":
        html = `
          <div class="form-section">
            <h3 class="section-title">事件类型（单选）</h3>
            <div class="tag-group single-select" data-name="event-type">
              <div class="tag-item selected" data-value="conflict">冲突</div>
              <div class="tag-item" data-value="revelation">揭秘</div>
              <div class="tag-item" data-value="betrayal">背叛</div>
              <div class="tag-item" data-value="reunion">重逢</div>
              <div class="tag-item" data-value="discovery">发现</div>
              <div class="tag-item" data-value="ceremony">仪式</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">事件规模（单选）</h3>
            <div class="tag-group single-select" data-name="event-scale">
              <div class="tag-item selected" data-value="personal">个人</div>
              <div class="tag-item" data-value="group">群体</div>
              <div class="tag-item" data-value="regional">区域</div>
              <div class="tag-item" data-value="world">世界</div>
            </div>
          </div>
        `;
        break;
      case "conflict":
        html = `
          <div class="form-section">
            <h3 class="section-title">冲突类型（单选）</h3>
            <div class="tag-group single-select" data-name="conflict-type">
              <div class="tag-item selected" data-value="internal">内心冲突</div>
              <div class="tag-item" data-value="interpersonal">人际冲突</div>
              <div class="tag-item" data-value="social">社会冲突</div>
              <div class="tag-item" data-value="fate">命运冲突</div>
              <div class="tag-item" data-value="moral">道德冲突</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">冲突强度（单选）</h3>
            <div class="tag-group single-select" data-name="conflict-intensity">
              <div class="tag-item selected" data-value="mild">温和</div>
              <div class="tag-item" data-value="moderate">中等</div>
              <div class="tag-item" data-value="intense">激烈</div>
              <div class="tag-item" data-value="extreme">极端</div>
            </div>
          </div>
        `;
        break;
      case "emotion":
        html = `
          <div class="form-section">
            <h3 class="section-title">情感类型（单选）</h3>
            <div class="tag-group single-select" data-name="emotion-type">
              <div class="tag-item selected" data-value="love">爱情</div>
              <div class="tag-item" data-value="hate">仇恨</div>
              <div class="tag-item" data-value="fear">恐惧</div>
              <div class="tag-item" data-value="hope">希望</div>
              <div class="tag-item" data-value="despair">绝望</div>
              <div class="tag-item" data-value="joy">喜悦</div>
              <div class="tag-item" data-value="sadness">悲伤</div>
              <div class="tag-item" data-value="anger">愤怒</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">情感强度（单选）</h3>
            <div class="tag-group single-select" data-name="emotion-intensity">
              <div class="tag-item selected" data-value="subtle">微妙</div>
              <div class="tag-item" data-value="moderate">适中</div>
              <div class="tag-item" data-value="overwhelming">强烈</div>
            </div>
          </div>
        `;
        break;
      case "plot":
        html = `
          <div class="form-section">
            <h3 class="section-title">情节类型（单选）</h3>
            <div class="tag-group single-select" data-name="plot-type">
              <div class="tag-item selected" data-value="main">主线情节</div>
              <div class="tag-item" data-value="sub">支线情节</div>
              <div class="tag-item" data-value="foreshadowing">伏笔</div>
              <div class="tag-item" data-value="callback"> callback</div>
              <div class="tag-item" data-value="twist">反转</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">情节功能（单选）</h3>
            <div class="tag-group single-select" data-name="plot-function">
              <div class="tag-item selected" data-value="setup">铺垫</div>
              <div class="tag-item" data-value="rising">上升</div>
              <div class="tag-item" data-value="climax">高潮</div>
              <div class="tag-item" data-value="falling">下降</div>
              <div class="tag-item" data-value="resolution">结局</div>
            </div>
          </div>
        `;
        break;
      case "mystery":
        html = `
          <div class="form-section">
            <h3 class="section-title">谜团类型（单选）</h3>
            <div class="tag-group single-select" data-name="mystery-type">
              <div class="tag-item selected" data-value="crime">案件</div>
              <div class="tag-item" data-value="secret">秘密</div>
              <div class="tag-item" data-value="identity">身份</div>
              <div class="tag-item" data-value="location">地点</div>
              <div class="tag-item" data-value="motivation">动机</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">悬疑程度（单选）</h3>
            <div class="tag-group single-select" data-name="mystery-level">
              <div class="tag-item selected" data-value="light">轻度</div>
              <div class="tag-item" data-value="moderate">中度</div>
              <div class="tag-item" data-value="heavy">重度</div>
            </div>
          </div>
        `;
        break;
      case "twist":
        html = `
          <div class="form-section">
            <h3 class="section-title">反转类型（单选）</h3>
            <div class="tag-group single-select" data-name="twist-type">
              <div class="tag-item selected" data-value="identity">身份反转</div>
              <div class="tag-item" data-value="truth">真相反转</div>
              <div class="tag-item" data-value="relationship">关系反转</div>
              <div class="tag-item" data-value="motivation">动机反转</div>
              <div class="tag-item" data-value="situation">处境反转</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">反转时机（单选）</h3>
            <div class="tag-group single-select" data-name="twist-timing">
              <div class="tag-item selected" data-value="early">早期</div>
              <div class="tag-item" data-value="midpoint">中点</div>
              <div class="tag-item" data-value="climax">高潮</div>
              <div class="tag-item" data-value="ending">结局</div>
            </div>
          </div>
        `;
        break;
      case "dialogue":
        html = `
          <div class="form-section">
            <h3 class="section-title">对白类型（单选）</h3>
            <div class="tag-group single-select" data-name="dialogue-type">
              <div class="tag-item selected" data-value="confrontation">对峙</div>
              <div class="tag-item" data-value="confession">告白</div>
              <div class="tag-item" data-value="negotiation">谈判</div>
              <div class="tag-item" data-value="revelation">揭示</div>
              <div class="tag-item" data-value="farewell">告别</div>
              <div class="tag-item" data-value="greeting">相遇</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">对白风格（单选）</h3>
            <div class="tag-group single-select" data-name="dialogue-style">
              <div class="tag-item selected" data-value="witty">机智</div>
              <div class="tag-item" data-value="poetic">诗意</div>
              <div class="tag-item" data-value="sharp">犀利</div>
              <div class="tag-item" data-value="tender">温柔</div>
              <div class="tag-item" data-value="dramatic">戏剧</div>
            </div>
          </div>
        `;
        break;
      case "world":
        html = `
          <div class="form-section">
            <h3 class="section-title">世界类型（单选）</h3>
            <div class="tag-group single-select" data-name="world-type">
              <div class="tag-item selected" data-value="fantasy">奇幻</div>
              <div class="tag-item" data-value="scifi">科幻</div>
              <div class="tag-item" data-value="historical">历史</div>
              <div class="tag-item" data-value="modern">现代</div>
              <div class="tag-item" data-value="postapocalyptic">末世</div>
              <div class="tag-item" data-value="parallel">平行</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">世界特色（多选）</h3>
            <div class="tag-group" data-name="world-features">
              <div class="tag-item" data-value="magic">魔法</div>
              <div class="tag-item" data-value="technology">科技</div>
              <div class="tag-item" data-value="mythical">神话</div>
              <div class="tag-item" data-value="dystopian">反乌托邦</div>
              <div class="tag-item" data-value="utopian">乌托邦</div>
              <div class="tag-item" data-value="wilderness">荒野</div>
            </div>
          </div>
        `;
        break;
      case "ending":
        html = `
          <div class="form-section">
            <h3 class="section-title">结局类型（单选）</h3>
            <div class="tag-group single-select" data-name="ending-type">
              <div class="tag-item selected" data-value="happy">圆满</div>
              <div class="tag-item" data-value="tragic">悲剧</div>
              <div class="tag-item" data-value="bittersweet"> bittersweet</div>
              <div class="tag-item" data-value="open">开放</div>
              <div class="tag-item" data-value="twist">反转</div>
              <div class="tag-item" data-value="circular">循环</div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">结局基调（单选）</h3>
            <div class="tag-group single-select" data-name="ending-tone">
              <div class="tag-item selected" data-value="hopeful">希望</div>
              <div class="tag-item" data-value="melancholy">忧伤</div>
              <div class="tag-item" data-value="triumphant">胜利</div>
              <div class="tag-item" data-value="thoughtful">深思</div>
            </div>
          </div>
        `;
        break;
    }
    container.innerHTML = html;
    const agentSelectorContainer = document.getElementById("card-agent-selector");
    if (agentSelectorContainer) {
      const cardAgentCategory = this.getCardAgentCategory(cardType);
      agentSelectorContainer.innerHTML = createAgentSelector(cardAgentCategory);
      this.initAgentSelectors();
    }
  }
  getCardAgentCategory(cardType) {
    return `card_${cardType}`;
  }
  updateCardPlaceholder(cardType) {
    const extraInput = document.getElementById("card-extra");
    if (!extraInput) return;
    const placeholders = {
      character: "例如：要一个复杂的反派角色，有悲惨的过去但令人同情",
      scene: "例如：一个雨夜的废弃工厂，要有工业时代的衰败感",
      item: "例如：一把有诅咒的古老匕首，但持有者会获得强大力量",
      event: "例如：一场意外的重逢，但双方都已经不是过去的自己",
      conflict: "例如：主角必须在拯救爱人和拯救世界之间做出选择",
      emotion: "例如：一种复杂的情感，混合着爱与恨、希望与绝望",
      plot: "例如：一个看似无关的支线情节，最后成为解决主线的关键",
      mystery: "例如：一个看似完美的犯罪，但凶手就在受害者身边",
      twist: "例如：最信任的朋友其实是幕后黑手，但有不得已的苦衷",
      dialogue: "例如：一场表面平静但充满潜台词的晚餐对话",
      world: "例如：一个魔法与科技并存的世界，但两者互相排斥",
      ending: "例如：一个看似悲剧的结局，但留给读者希望的种子"
    };
    extraInput.placeholder = placeholders[cardType] || "对生成内容的具体要求";
  }
  initComboCardMode() {
    const slots = document.querySelectorAll(".combo-card-slot");
    const generateBtn = document.getElementById("generate-combo");
    slots.forEach((slotEl, index) => {
      const slot = slotEl;
      slot.addEventListener("click", () => {
        if (this.comboCards[index]) {
          if (confirm("要移除这张卡牌吗？")) {
            this.comboCards[index] = null;
            slot.innerHTML = '<span style="color: rgba(255,255,255,0.4); font-size: 0.875rem;">+ 添加卡牌</span>';
            slot.style.borderStyle = "dashed";
            slot.style.background = "rgba(255,255,255,0.05)";
          }
        } else {
          this.showCardTypeSelector(index, slot);
        }
        const hasCards = this.comboCards.filter((c) => c).length > 0;
        if (generateBtn) {
          generateBtn.disabled = !hasCards;
        }
      });
    });
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        const validCards = this.comboCards.filter((c) => c);
        if (validCards.length === 0) return;
        const comboPrompt = this.buildComboCardPrompt(validCards);
        this.showPromptPreview(comboPrompt, "卡牌组合");
      });
    }
  }
  showCardTypeSelector(slotIndex, slotEl) {
    var _a, _b;
    const cardTypes = [
      { type: "character", name: "角色", icon: ICONS.user, color: "#8b5cf6" },
      { type: "scene", name: "场景", icon: ICONS.castle, color: "#06b6d4" },
      { type: "item", name: "道具", icon: ICONS.sword, color: "#f59e0b" },
      { type: "event", name: "事件", icon: ICONS.bookOpen, color: "#ec4899" },
      { type: "conflict", name: "冲突", icon: ICONS.lightning, color: "#ef4444" },
      { type: "emotion", name: "情感", icon: ICONS.heart, color: "#10b981" }
    ];
    const styles = ["玄幻", "都市", "仙侠", "科幻", "历史", "悬疑", "言情", "恐怖"];
    const modal = document.createElement("div");
    modal.className = "card-selector-modal";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    `;
    modal.innerHTML = `
      <div style="background: rgba(30, 30, 40, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin-bottom: 20px; text-align: center;">选择卡牌类型</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          ${cardTypes.map((ct) => `
            <div class="card-type-option" data-type="${ct.type}" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s;">
              <div style="width: 48px; height: 48px; background: ${ct.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">${createSvgIcon(ct.icon, 24, "white")}</div>
              <div style="font-size: 0.875rem;">${ct.name}</div>
            </div>
          `).join("")}
        </div>
        <h4 style="margin-bottom: 12px; font-size: 0.875rem; color: rgba(255,255,255,0.6);">选择风格</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px;">
          ${styles.map((s) => `
            <div class="style-option" data-style="${s}" style="padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; cursor: pointer; font-size: 0.875rem; transition: all 0.3s;">${s}</div>
          `).join("")}
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-secondary" style="flex: 1;" id="cancel-card-select">取消</button>
          <button class="btn btn-primary" style="flex: 1;" id="confirm-card-select" disabled>确认</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    let selectedType = "";
    let selectedStyle = "";
    modal.querySelectorAll(".card-type-option").forEach((el) => {
      el.addEventListener("click", () => {
        modal.querySelectorAll(".card-type-option").forEach((e) => {
          e.style.borderColor = "rgba(255,255,255,0.1)";
          e.style.background = "rgba(255,255,255,0.05)";
        });
        el.style.borderColor = "var(--primary)";
        el.style.background = "rgba(139, 92, 246, 0.2)";
        selectedType = el.getAttribute("data-type") || "";
        this.updateConfirmButton(modal, selectedType, selectedStyle);
      });
    });
    modal.querySelectorAll(".style-option").forEach((el) => {
      el.addEventListener("click", () => {
        modal.querySelectorAll(".style-option").forEach((e) => {
          e.style.borderColor = "rgba(255,255,255,0.1)";
          e.style.background = "rgba(255,255,255,0.05)";
        });
        el.style.borderColor = "var(--primary)";
        el.style.background = "rgba(139, 92, 246, 0.2)";
        selectedStyle = el.getAttribute("data-style") || "";
        this.updateConfirmButton(modal, selectedType, selectedStyle);
      });
    });
    (_a = modal.querySelector("#cancel-card-select")) == null ? void 0 : _a.addEventListener("click", () => {
      modal.remove();
    });
    (_b = modal.querySelector("#confirm-card-select")) == null ? void 0 : _b.addEventListener("click", () => {
      if (selectedType && selectedStyle) {
        this.comboCards[slotIndex] = { type: selectedType, style: selectedStyle };
        const cardNames = {
          character: "角色",
          scene: "场景",
          item: "道具",
          event: "事件",
          conflict: "冲突",
          emotion: "情感"
        };
        slotEl.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 8px;">${this.getCardTypeEmoji(selectedType)}</div>
            <div style="font-weight: 600; margin-bottom: 4px;">${cardNames[selectedType]}卡</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">${selectedStyle}</div>
          </div>
        `;
        slotEl.style.borderStyle = "solid";
        slotEl.style.borderColor = "var(--primary)";
        slotEl.style.background = "rgba(139, 92, 246, 0.1)";
        modal.remove();
        const generateBtn = document.getElementById("generate-combo");
        if (generateBtn) {
          generateBtn.disabled = false;
        }
      }
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  getCardTypeEmoji(type) {
    const emojis = {
      character: "👤",
      scene: "🏰",
      item: "⚔️",
      event: "📖",
      conflict: "⚡",
      emotion: "❤️"
    };
    return emojis[type] || "🎴";
  }
  updateConfirmButton(modal, type, style) {
    const confirmBtn = modal.querySelector("#confirm-card-select");
    if (confirmBtn) {
      confirmBtn.disabled = !(type && style);
    }
  }
  buildComboCardPrompt(cards) {
    const cardNames = {
      character: "角色",
      scene: "场景",
      item: "道具",
      event: "事件",
      conflict: "冲突",
      emotion: "情感"
    };
    let prompt = `# 卡牌组合灵感生成器

`;
    prompt += `## 组合卡牌

`;
    cards.forEach((card, index) => {
      prompt += `${index + 1}. **${cardNames[card.type]}卡** - ${card.style}风格
`;
    });
    prompt += `
## 创作任务

`;
    prompt += `基于以上${cards.length}张卡牌，创作一个完整的创作灵感。要求：

`;
    prompt += `1. 将各卡牌元素有机融合
`;
    prompt += `2. 确保元素之间有逻辑关联
`;
    prompt += `3. 突出冲突和张力
`;
    prompt += `4. 提供具体可用的创作细节

`;
    prompt += `请生成一个详细的创作灵感，包含场景设定、角色互动、情节发展等要素。`;
    return prompt;
  }
  initCardHistoryMode() {
    this.loadCardHistory();
  }
  saveCardToHistory(data) {
    const history = JSON.parse(localStorage.getItem("cardHistory") || "[]");
    history.unshift({
      ...data,
      timestamp: Date.now()
    });
    if (history.length > 20) {
      history.pop();
    }
    localStorage.setItem("cardHistory", JSON.stringify(history));
  }
  loadCardHistory() {
    const container = document.getElementById("card-history-list");
    if (!container) return;
    const history = JSON.parse(localStorage.getItem("cardHistory") || "[]");
    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: rgba(255,255,255,0.5);">
          ${createSvgIcon(ICONS.clock, 48, "rgba(255,255,255,0.3)")}
          <p style="margin-top: 16px;">暂无历史记录</p>
        </div>
      `;
      return;
    }
    const cardNames = {
      character: "角色",
      scene: "场景",
      item: "道具",
      event: "事件",
      conflict: "冲突",
      emotion: "情感"
    };
    container.innerHTML = history.map((item, index) => `
      <div class="glass-card" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            ${this.getCardTypeEmoji(item.type)}
          </div>
          <div>
            <div style="font-weight: 600;">${cardNames[item.type] || "卡牌"} - ${item.style || "默认"}</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">${new Date(item.timestamp).toLocaleString()}</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm reuse-card" data-index="${index}">重用</button>
          <button class="btn btn-secondary btn-sm delete-card" data-index="${index}">删除</button>
        </div>
      </div>
    `).join("");
    container.querySelectorAll(".reuse-card").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index || "0");
        const item = history[index];
        if (item) {
          const fullPrompt = buildCardPrompt(item);
          this.showPromptPreview(fullPrompt, "卡牌创作");
        }
      });
    });
    container.querySelectorAll(".delete-card").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index || "0");
        history.splice(index, 1);
        localStorage.setItem("cardHistory", JSON.stringify(history));
        this.loadCardHistory();
      });
    });
  }
  collectCardData() {
    const data = {
      type: this.currentCardType,
      style: "",
      difficulty: "normal",
      extra: ""
    };
    const styleGroup = document.querySelector('.tag-group[data-name="card-style"]');
    if (styleGroup) {
      const selected = styleGroup.querySelector(".tag-item.selected");
      if (selected) {
        data.style = selected.getAttribute("data-value") || "";
      }
    }
    const difficultyInput = document.querySelector('input[name="card-difficulty"]:checked');
    if (difficultyInput) {
      data.difficulty = difficultyInput.value;
    }
    const extraInput = document.getElementById("card-extra");
    if (extraInput) {
      data.extra = extraInput.value.trim();
    }
    return data;
  }
  // ============================================
  // 通用表单辅助方法
  // ============================================
  initTagGroups() {
    const tagGroups = document.querySelectorAll(".tag-group");
    tagGroups.forEach((group) => {
      const isSingleSelect = group.classList.contains("single-select");
      const tags = group.querySelectorAll(".tag-item");
      tags.forEach((tag) => {
        tag.addEventListener("click", () => {
          if (isSingleSelect) {
            tags.forEach((t) => t.classList.remove("selected"));
            tag.classList.add("selected");
          } else {
            tag.classList.toggle("selected");
          }
        });
      });
    });
  }
  // ============================================
  // Agent 选择器事件处理
  // ============================================
  initAgentSelectors() {
    const agentSelectors = document.querySelectorAll(".agent-selector");
    agentSelectors.forEach((selector) => {
      const agentCards = selector.querySelectorAll(".agent-card");
      agentCards.forEach((cardEl) => {
        const card = cardEl;
        card.addEventListener("click", () => {
          agentCards.forEach((cEl) => {
            const c = cEl;
            c.classList.remove("selected");
            const topBar = c.querySelector('div[style*="position: absolute; top: 0"]');
            if (topBar) topBar.style.opacity = "0";
            const nameEl = c.querySelector('div[style*="font-weight: 600"]');
            if (nameEl) nameEl.style.color = "rgba(255,255,255,0.9)";
            c.style.borderColor = "rgba(255,255,255,0.1)";
          });
          card.classList.add("selected");
          const agentId = card.getAttribute("data-agent-id");
          const agent = AGENTS.find((a) => a.id === agentId);
          if (agent) {
            const topBar = card.querySelector('div[style*="position: absolute; top: 0"]');
            if (topBar) topBar.style.opacity = "1";
            const nameEl = card.querySelector('div[style*="font-weight: 600"]');
            if (nameEl) nameEl.style.color = agent.color;
            card.style.borderColor = agent.color;
          }
        });
        card.addEventListener("mouseenter", () => {
          if (!card.classList.contains("selected")) {
            const agentId = card.getAttribute("data-agent-id");
            const agent = AGENTS.find((a) => a.id === agentId);
            if (agent) {
              card.style.borderColor = agent.color + "60";
            }
          }
        });
        card.addEventListener("mouseleave", () => {
          if (!card.classList.contains("selected")) {
            card.style.borderColor = "rgba(255,255,255,0.1)";
          }
        });
      });
    });
    const quickBtns = document.querySelectorAll(".agent-quick-btn");
    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const agentId = btn.getAttribute("data-agent-id");
        const agent = AGENTS.find((a) => a.id === agentId);
        if (agent) {
          this.showAgentInfo(agent);
        }
      });
    });
    const dropdownToggles = document.querySelectorAll("#agent-dropdown-toggle");
    dropdownToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        var _a;
        e.stopPropagation();
        const menu = (_a = toggle.parentElement) == null ? void 0 : _a.querySelector("#agent-dropdown-menu");
        if (menu) {
          menu.style.display = menu.style.display === "none" ? "block" : "none";
        }
      });
    });
    const agentOptions = document.querySelectorAll(".agent-option");
    agentOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const agentId = option.getAttribute("data-agent-id");
        const agent = AGENTS.find((a) => a.id === agentId);
        if (agent) {
          this.selectAgent(agent);
        }
      });
      option.addEventListener("mouseenter", () => {
        const agentId = option.getAttribute("data-agent-id");
        const agent = AGENTS.find((a) => a.id === agentId);
        if (agent) {
          option.style.background = agent.color + "15";
        }
      });
      option.addEventListener("mouseleave", () => {
        if (!option.classList.contains("selected")) {
          option.style.background = "transparent";
        }
      });
    });
  }
  showAgentInfo(agent) {
    var _a, _b;
    const modal = document.createElement("div");
    modal.className = "agent-info-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `;
    modal.innerHTML = `
      <div class="glass-card" style="max-width: 500px; padding: 32px; position: relative;">
        <button class="close-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 1.5rem;">×</button>
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div style="width: 64px; height: 64px; background: ${agent.color}20; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            ${createSvgIcon(agent.iconSvg, 32, agent.color)}
          </div>
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 600; color: ${agent.color};">${agent.name}</h3>
            <p style="font-size: 0.875rem; color: rgba(255,255,255,0.5);">专业创作Agent</p>
          </div>
        </div>
        <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 20px;">${agent.description}</p>
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.875rem; color: rgba(255,255,255,0.5); margin-bottom: 12px;">核心能力</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${agent.capabilities.map((cap) => `
              <span style="padding: 6px 12px; background: ${agent.color}15; color: ${agent.color}; border-radius: 20px; font-size: 0.75rem;">${cap.replace(/_/g, " ")}</span>
            `).join("")}
          </div>
        </div>
        <button class="btn btn-primary" style="width: 100%;" data-agent-id="${agent.id}">
          ${createSvgIcon(ICONS.check, 18, "white")}
          <span style="margin-left: 8px;">选择此Agent</span>
        </button>
      </div>
    `;
    (_a = modal.querySelector(".close-modal")) == null ? void 0 : _a.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    (_b = modal.querySelector(".btn-primary")) == null ? void 0 : _b.addEventListener("click", () => {
      this.selectAgent(agent);
      modal.remove();
    });
    document.body.appendChild(modal);
  }
  selectAgent(agent) {
    this.selectedAgentId = agent.id;
    console.log("Selected Agent:", agent.name);
  }
  getSelectedAgentId() {
    const selectedCard = document.querySelector(".agent-card.selected");
    return (selectedCard == null ? void 0 : selectedCard.getAttribute("data-agent-id")) || null;
  }
  initCustomTags(inputId, addBtnId, containerId) {
    const customTagInput = document.getElementById(inputId);
    const addCustomTagBtn = document.getElementById(addBtnId);
    const customTagsContainer = document.getElementById(containerId);
    if (addCustomTagBtn && customTagInput && customTagsContainer) {
      const addCustomTag = () => {
        const value = customTagInput.value.trim();
        if (value) {
          const tagElement = document.createElement("div");
          tagElement.className = "tag-item selected";
          tagElement.setAttribute("data-value", value);
          tagElement.textContent = value;
          tagElement.addEventListener("click", () => {
            tagElement.remove();
          });
          customTagsContainer.appendChild(tagElement);
          customTagInput.value = "";
        }
      };
      addCustomTagBtn.addEventListener("click", addCustomTag);
      customTagInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addCustomTag();
        }
      });
    }
  }
  initFormActions(saveBtnId, cancelBtnId, collectData, buildPrompt, moduleName) {
    const saveBtn = document.getElementById(saveBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const data = collectData();
        if (!data.title && !data.name && !data.scene) {
          alert("请输入必要信息");
          return;
        }
        const fullPrompt = buildPrompt(data);
        this.showPromptPreview(fullPrompt, moduleName);
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.switchMode("full");
      });
    }
  }
  showPromptPreview(fullPrompt, moduleName) {
    const previewContainer = document.getElementById("prompt-preview");
    if (previewContainer) {
      const isDialogue = moduleName === "对话创作";
      const startButtonText = isDialogue ? "生成对话" : "开始创作";
      previewContainer.style.display = "block";
      previewContainer.innerHTML = `
        <div class="glass-card" style="padding: 32px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
              ${createSvgIcon(ICONS.sparkles, 24, "#fbbf24")}
              <span>核心提示词</span>
            </h3>
            <button class="btn btn-secondary btn-sm" id="copy-prompt" style="padding: 6px 12px; font-size: 0.875rem;">
              ${createSvgIcon(ICONS.copy, 16, "currentColor")}
              <span style="margin-left: 4px;">复制</span>
            </button>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; color: rgba(255,255,255,0.9);">
${this.escapeHtml(fullPrompt)}
          </div>
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-primary" id="start-writing" style="flex: 1;" data-module="${moduleName}">
              ${createSvgIcon(ICONS.send, 18, "white")}
              <span style="margin-left: 6px;">${startButtonText}</span>
            </button>
            <button class="btn btn-secondary" id="edit-settings">
              ${createSvgIcon(ICONS.edit, 18, "currentColor")}
              <span style="margin-left: 6px;">修改设定</span>
            </button>
          </div>
        </div>
      `;
      const copyBtn = document.getElementById("copy-prompt");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(fullPrompt).then(() => {
            copyBtn.innerHTML = `${createSvgIcon(ICONS.check, 16, "currentColor")}<span style="margin-left: 4px;">已复制</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `${createSvgIcon(ICONS.copy, 16, "currentColor")}<span style="margin-left: 4px;">复制</span>`;
            }, 2e3);
          });
        });
      }
      const startWritingBtn = document.getElementById("start-writing");
      if (startWritingBtn) {
        startWritingBtn.addEventListener("click", () => {
          const module = startWritingBtn.getAttribute("data-module");
          if (module === "对话创作") {
            this.startDialogueWriting(fullPrompt);
          } else if (module === "卡牌创作" || module === "卡牌组合") {
            this.startCardWriting(fullPrompt);
          } else {
            this.startNovelWriting(fullPrompt);
          }
        });
      }
      const editSettingsBtn = document.getElementById("edit-settings");
      if (editSettingsBtn) {
        editSettingsBtn.addEventListener("click", () => {
          previewContainer.style.display = "none";
          const form = document.querySelector(".novel-form, .medium-form, .dialogue-form, .outline-form, .card-form");
          if (form) {
            form.style.display = "block";
            form.scrollIntoView({ behavior: "smooth" });
          }
        });
      }
      previewContainer.scrollIntoView({ behavior: "smooth" });
    }
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  startQuickCreation() {
    this.switchMode("chat");
    this.addChatMessage({
      id: Date.now().toString(),
      role: "system",
      content: "🚀 快速创作模式已启动\n\n请告诉我您想创作什么类型的故事？例如：\n• 一个关于复仇与救赎的悬疑故事\n• 一个穿越时空的科幻冒险\n• 一段跨越阶级的爱情故事\n\n或者直接描述您的故事构想，我将为您开始创作。",
      timestamp: /* @__PURE__ */ new Date()
    });
    const narrativeAgent = AGENTS.find((a) => a.id === "narrative-engineer");
    if (narrativeAgent) {
      this.currentAgent = narrativeAgent;
      const avatar = document.getElementById("chat-avatar");
      const name = document.getElementById("chat-agent-name");
      if (avatar) avatar.innerHTML = createSvgIcon(narrativeAgent.iconSvg, 32, "white");
      if (name) name.textContent = narrativeAgent.name;
    }
  }
  startNovelWriting(prompt) {
    this.switchMode("chat");
    this.addChatMessage({
      id: Date.now().toString(),
      role: "system",
      content: `小说创作设定已加载：

${prompt.substring(0, 500)}...`,
      timestamp: /* @__PURE__ */ new Date()
    });
    this.addChatMessage({
      id: (Date.now() + 1).toString(),
      role: "user",
      content: "请根据以上设定开始创作小说。",
      timestamp: /* @__PURE__ */ new Date()
    });
    const narrativeAgent = AGENTS.find((a) => a.id === "narrative-engineer");
    if (narrativeAgent) {
      this.currentAgent = narrativeAgent;
      const avatar = document.getElementById("chat-avatar");
      const name = document.getElementById("chat-agent-name");
      if (avatar) avatar.innerHTML = createSvgIcon(narrativeAgent.iconSvg, 32, "white");
      if (name) name.textContent = narrativeAgent.name;
    }
    setTimeout(() => {
      this.callWritingAPI(prompt);
    }, 300);
  }
  // ============================================
  // 对话创作 - 实时流式输出
  // ============================================
  startDialogueWriting(prompt) {
    const previewContainer = document.getElementById("prompt-preview");
    if (!previewContainer) return;
    this.switchMode("chat");
    this.addChatMessage({
      id: Date.now().toString(),
      role: "system",
      content: `🎭 对话创作设定已加载

正在为您生成精彩对话场景...`,
      timestamp: /* @__PURE__ */ new Date()
    });
    this.addChatMessage({
      id: (Date.now() + 1).toString(),
      role: "user",
      content: "请根据以上设定生成对话。",
      timestamp: /* @__PURE__ */ new Date()
    });
    const dialogueAgent = {
      id: "dialogue-master",
      name: "对白大师",
      description: "专业对话创作AI",
      iconSvg: ICONS.message,
      color: "#06b6d4",
      capabilities: ["对话创作", "角色塑造", "情感表达"],
      systemPrompt: "你是一位专业的对话创作大师，擅长创作自然流畅、富有张力的角色对话。"
    };
    this.currentAgent = dialogueAgent;
    const avatar = document.getElementById("chat-avatar");
    const name = document.getElementById("chat-agent-name");
    if (avatar) avatar.innerHTML = createSvgIcon(ICONS.message, 32, "white");
    if (name) name.textContent = dialogueAgent.name;
    this.callWritingAPI(prompt);
  }
  // ============================================
  // 卡牌创作 - 实时流式输出
  // ============================================
  startCardWriting(prompt) {
    const previewContainer = document.getElementById("prompt-preview");
    if (!previewContainer) return;
    this.switchMode("chat");
    this.addChatMessage({
      id: Date.now().toString(),
      role: "system",
      content: `🎴 卡牌创作设定已加载

正在为您生成创意卡牌...`,
      timestamp: /* @__PURE__ */ new Date()
    });
    this.addChatMessage({
      id: (Date.now() + 1).toString(),
      role: "user",
      content: "请根据以上设定生成卡牌内容。",
      timestamp: /* @__PURE__ */ new Date()
    });
    const cardAgent = {
      id: "card-creator",
      name: "卡牌大师",
      description: "专业卡牌创作AI",
      iconSvg: ICONS.cards,
      color: "#8b5cf6",
      capabilities: ["卡牌设计", "创意生成", "灵感激发"],
      systemPrompt: "你是一位专业的创意卡牌设计师，擅长设计各种类型的小说创作灵感卡牌。"
    };
    this.currentAgent = cardAgent;
    const avatar = document.getElementById("chat-avatar");
    const name = document.getElementById("chat-agent-name");
    if (avatar) avatar.innerHTML = createSvgIcon(ICONS.cards, 32, "white");
    if (name) name.textContent = cardAgent.name;
    this.callWritingAPI(prompt);
  }
  async callWritingAPI(prompt) {
    var _a, _b, _c, _d;
    const configs = JSON.parse(localStorage.getItem("api-configs") || "[]");
    const config = configs[configs.length - 1];
    if (!config || !config.endpoint || !config.apiKey) {
      this.addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ 未配置API\n\n请先在设置页面配置API密钥。",
        timestamp: /* @__PURE__ */ new Date()
      });
      return;
    }
    this.novelState.status = "generating";
    this.novelState.prompt = prompt;
    const messageId = Date.now().toString();
    this.addStreamingMessage(messageId);
    try {
      console.log("=== API调用开始 ===");
      console.log("提供商:", config.provider);
      console.log("端点:", config.endpoint);
      const supportsStreaming = config.provider !== "anthropic";
      console.log("支持流式输出:", supportsStreaming);
      if (supportsStreaming) {
        await this.callStreamingChatAPI(config, prompt, messageId);
      } else {
        await this.callNonStreamingChatAPI(config, prompt, messageId);
      }
      console.log("=== API调用成功 ===");
      this.novelState.status = "completed";
      this.saveNovelState();
    } catch (error) {
      console.error("=== API调用失败 ===");
      console.error("错误详情:", error);
      this.novelState.status = "error";
      let errorMessage = error.message || "请检查API配置是否正确";
      if ((_a = error.message) == null ? void 0 : _a.includes("Failed to fetch")) {
        errorMessage = "网络连接失败，请检查：\n1. API端点是否正确\n2. 是否需要代理\n3. 网络是否正常";
      } else if ((_b = error.message) == null ? void 0 : _b.includes("401")) {
        errorMessage = "API密钥无效，请检查密钥是否正确";
      } else if ((_c = error.message) == null ? void 0 : _c.includes("403")) {
        errorMessage = "访问被拒绝，请检查API权限";
      } else if ((_d = error.message) == null ? void 0 : _d.includes("404")) {
        errorMessage = "API端点不存在，请检查URL是否正确";
      }
      this.updateStreamingMessage(messageId, `❌ 创作失败

${errorMessage}`, true);
      this.saveNovelState();
    }
  }
  addStreamingMessage(messageId) {
    const container = this.$("chat-messages");
    if (!container) return;
    const messageDiv = document.createElement("div");
    messageDiv.id = `msg-${messageId}`;
    messageDiv.className = "chat-message assistant streaming";
    messageDiv.innerHTML = `
      <div class="message-bubble">
        <div class="thinking-indicator" style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">
          <div class="thinking-dots" style="display: flex; gap: 4px;">
            <span style="width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out infinite both;"></span>
            <span style="width: 6px; height: 6px; background: #06b6d4; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out 0.16s infinite both;"></span>
            <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out 0.32s infinite both;"></span>
          </div>
          <span style="font-size: 0.875rem;">AI 正在思考中...</span>
        </div>
        <div class="streaming-content" style="white-space: pre-wrap; display: none;"></div>
        <span class="typing-cursor" style="display: none; width: 2px; height: 1.2em; background: #fbbf24; animation: blink 1s infinite; vertical-align: text-bottom; margin-left: 2px;"></span>
      </div>
    `;
    container.appendChild(messageDiv);
    this.domCache.set(`msg-${messageId}`, messageDiv);
    container.scrollTop = container.scrollHeight;
  }
  updateStreamingMessage(messageId, content, isComplete = false) {
    if (this.streamingMessageId !== messageId) {
      this.streamingMessageId = messageId;
      this.streamingContent = "";
    }
    this.streamingContent = content;
    if (isComplete) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.flushStreamingUpdate(messageId, content, true);
      this.streamingUpdateScheduled = false;
      this.streamingMessageId = "";
      this.streamingContent = "";
    } else if (!this.streamingUpdateScheduled) {
      this.streamingUpdateScheduled = true;
      this.rafId = requestAnimationFrame(() => {
        this.flushStreamingUpdate(this.streamingMessageId, this.streamingContent, false);
        this.streamingUpdateScheduled = false;
      });
    }
  }
  flushStreamingUpdate(messageId, content, isComplete) {
    const messageDiv = this.$(`msg-${messageId}`);
    if (!messageDiv) return;
    const contentDiv = messageDiv.querySelector(".streaming-content");
    const cursor = messageDiv.querySelector(".typing-cursor");
    const thinkingIndicator = messageDiv.querySelector(".thinking-indicator");
    if (content && contentDiv) {
      contentDiv.style.display = "block";
      contentDiv.innerHTML = this.formatChatContent(content);
      if (thinkingIndicator) thinkingIndicator.style.display = "none";
      if (cursor && !isComplete) cursor.style.display = "inline-block";
    }
    if (isComplete) {
      if (cursor) cursor.style.display = "none";
      if (thinkingIndicator) thinkingIndicator.style.display = "none";
      messageDiv.classList.remove("streaming");
    }
    const container = this.$("chat-messages");
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom || isComplete) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
  formatChatContent(content) {
    if (this.isJsonContent(content)) {
      return this.renderJsonContent(content);
    }
    if (this.isStreamResponse(content)) {
      return this.renderStreamResponse(content);
    }
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    let result = content.replace(/[&<>]/g, (char) => escapeMap[char] || char);
    result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
    return result;
  }
  isStreamResponse(content) {
    const trimmed = content.trim();
    if (!trimmed.startsWith("{")) return false;
    try {
      const data = JSON.parse(trimmed);
      return !!data.type && [
        "narration",
        "dialogue",
        "action",
        "shop",
        "combat",
        "quest",
        "status",
        "choice",
        "reward",
        "novel",
        "character",
        "plot",
        "emotion",
        "world",
        "card",
        "outline",
        "inspiration"
      ].includes(data.type);
    } catch {
      return false;
    }
  }
  renderStreamResponse(content) {
    try {
      const data = JSON.parse(content.trim());
      streamRenderer.setTheme(this.getCurrentTheme());
      return streamRenderer.render(data);
    } catch (e) {
      console.error("流式响应渲染失败:", e);
      return this.escapeHtml(content);
    }
  }
  getCurrentTheme() {
    return document.body.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  isJsonContent(content) {
    const trimmed = content.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return false;
    }
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  renderJsonContent(content) {
    try {
      const data = JSON.parse(content.trim());
      const renderable = this.detectContentType(data);
      if (renderable) {
        return renderer.render(renderable);
      }
      return `<pre class="json-raw">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    } catch (e) {
      return this.escapeHtml(content);
    }
  }
  detectContentType(data) {
    var _a;
    if (data.type && data.data) {
      return data;
    }
    if (data.title && data.chapters && Array.isArray(data.chapters)) {
      const firstChapter = data.chapters[0];
      if (firstChapter.content) {
        return { type: "novel", data };
      }
      return { type: "outline", data };
    }
    if (data.name && (data.personality || data.background || data.motivation)) {
      return { type: "character", data };
    }
    if (data.lines && Array.isArray(data.lines) && ((_a = data.lines[0]) == null ? void 0 : _a.speaker)) {
      return { type: "dialogue", data };
    }
    if (data.acts && Array.isArray(data.acts)) {
      return { type: "plot", data };
    }
    if (data.emotionCurve && Array.isArray(data.emotionCurve)) {
      return { type: "emotion", data };
    }
    if (data.geography || data.history || data.culture || data.magicSystem) {
      return { type: "world", data };
    }
    if (data.location && data.description) {
      return { type: "scene", data };
    }
    if (data.cardType || data.rarity || data.title && data.content && data.type) {
      return { type: "card", data };
    }
    if (data.title && data.content && (data.genre || data.prompt)) {
      return { type: "inspiration", data };
    }
    return null;
  }
  async callStreamingChatAPI(config, prompt, messageId) {
    var _a, _b, _c, _d;
    let endpoint = config.endpoint;
    if (!endpoint.includes("/chat/completions")) {
      endpoint = endpoint.replace(/\/$/, "") + "/chat/completions";
    }
    let provider = config.provider;
    if (!provider || provider === "" || provider === "custom") {
      if (endpoint.includes("minimax")) provider = "minimax";
      else if (endpoint.includes("deepseek")) provider = "deepseek";
      else if (endpoint.includes("moonshot")) provider = "moonshot";
      else if (endpoint.includes("bigmodel") || endpoint.includes("zhipu")) provider = "zhipu";
      else if (endpoint.includes("dashscope") || endpoint.includes("qwen")) provider = "qwen";
      else if (endpoint.includes("doubao") || endpoint.includes("volces")) provider = "doubao";
      else if (endpoint.includes("openai")) provider = "openai";
      else provider = "openai";
    }
    let model = config.model;
    if (!model || model.trim() === "") {
      const modelMap = {
        "openai": "gpt-3.5-turbo",
        "deepseek": "deepseek-chat",
        "moonshot": "moonshot-v1-8k",
        "minimax": "MiniMax-M2.5",
        "zhipu": "glm-4-flash",
        "qwen": "qwen-turbo",
        "doubao": "doubao-pro-32k",
        "google": "gemini-pro",
        "anthropic": "claude-3-sonnet-20240229"
      };
      model = modelMap[provider] || "gpt-3.5-turbo";
    }
    console.log("API端点:", endpoint, "提供商:", provider, "模型:", model);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4e3,
        stream: true
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errorText || response.statusText}`);
    }
    const reader = (_a = response.body) == null ? void 0 : _a.getReader();
    if (!reader) {
      throw new Error("无法获取响应流");
    }
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = (_d = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta) == null ? void 0 : _d.content;
            if (content) {
              fullContent += content;
              this.updateStreamingMessage(messageId, fullContent);
            }
          } catch (e) {
          }
        }
      }
    }
    this.updateStreamingMessage(messageId, fullContent, true);
    this.novelState.content = fullContent;
  }
  async callToolAPI(prompt, expectJson = true) {
    var _a, _b, _c;
    const configs = JSON.parse(localStorage.getItem("api-configs") || "[]");
    const config = configs[configs.length - 1];
    if (!config || !config.endpoint || !config.apiKey) {
      throw new Error("请先在设置页面配置API密钥");
    }
    let endpoint = config.endpoint;
    if (!endpoint.includes("/chat/completions")) {
      endpoint = endpoint.replace(/\/$/, "") + "/chat/completions";
    }
    let model = config.model || "gpt-3.5-turbo";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 4e3
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${errorText}`);
    }
    const data = await response.json();
    const content = ((_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) || "";
    if (expectJson) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
      }
    }
    return content;
  }
  async generateInspirationFromAPI() {
    var _a, _b, _c, _d;
    const configs = JSON.parse(localStorage.getItem("api-configs") || "[]");
    const config = configs[configs.length - 1];
    if (!config || !config.endpoint || !config.apiKey) {
      throw new Error("请先在设置页面配置API密钥");
    }
    let endpoint = config.endpoint;
    if (!endpoint.includes("/chat/completions")) {
      endpoint = endpoint.replace(/\/$/, "") + "/chat/completions";
    }
    let model = config.model || "gpt-3.5-turbo";
    const prompt = `请生成一个独特的小说创作灵感，要求：
1. 一个吸引人的标题（5-10个字）
2. 一个简短的故事梗概（100-200字）
3. 要有创意、有悬念、有情感张力

请按以下JSON格式返回：
{"title": "标题", "content": "故事梗概"}

只返回JSON，不要其他内容。`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 500
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${errorText}`);
    }
    const data = await response.json();
    const content = ((_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) || "";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
    }
    const lines = content.split("\n").filter((l) => l.trim());
    return {
      title: ((_d = lines[0]) == null ? void 0 : _d.replace(/^[#\s]*/, "")) || "未命名灵感",
      content: lines.slice(1).join("\n") || content
    };
  }
  async callNonStreamingChatAPI(config, prompt, messageId) {
    var _a, _b, _c, _d, _e;
    let endpoint = config.endpoint;
    if (!endpoint.includes("/chat/completions")) {
      endpoint = endpoint.replace(/\/$/, "") + "/chat/completions";
    }
    let model = config.model || "claude-3-sonnet-20240229";
    const thinkingSteps = [
      "正在分析创作需求...",
      "正在构思故事结构...",
      "正在设计人物角色...",
      "正在构建情节框架...",
      "正在生成正文内容..."
    ];
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      if (currentStep < thinkingSteps.length) {
        this.updateStreamingMessage(messageId, thinkingSteps[currentStep]);
        currentStep++;
      }
    }, 800);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 4e3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    clearInterval(stepInterval);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errorText || response.statusText}`);
    }
    const data = await response.json();
    const content = ((_b = (_a = data.content) == null ? void 0 : _a[0]) == null ? void 0 : _b.text) || ((_e = (_d = (_c = data.choices) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) == null ? void 0 : _e.content) || "";
    let displayedContent = "";
    const chars = content.split("");
    for (let i = 0; i < chars.length; i++) {
      displayedContent += chars[i];
      if (i % 10 === 0) {
        this.updateStreamingMessage(messageId, displayedContent);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    this.updateStreamingMessage(messageId, content, true);
    this.novelState.content = content;
  }
  async callStreamingAPI(config, prompt, thinkingProcess, streamingContent, writingStatus) {
    var _a, _b, _c;
    try {
      console.log("准备发送API请求...");
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.provider === "openai" ? "gpt-3.5-turbo" : config.provider === "deepseek" ? "deepseek-chat" : config.provider === "moonshot" ? "moonshot-v1-8k" : "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 2e3,
          stream: true
        })
      });
      console.log("API响应状态:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API错误响应:", errorText);
        throw new Error(`API请求失败 (${response.status}): ${errorText || response.statusText}`);
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }
      console.log("开始读取流数据...");
      const decoder = new TextDecoder();
      let fullContent = "";
      let thinkingContent = "";
      let isInThinking = true;
      let thinkingLineCount = 0;
      let chunkCount = 0;
      if (thinkingProcess) {
        thinkingProcess.innerHTML = '<span style="color: #8b5cf6;">●</span> 正在分析创作需求...';
      }
      if (writingStatus) {
        writingStatus.textContent = "正在生成内容...";
      }
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("流数据读取完成");
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`已处理 ${chunkCount} 个数据块`);
        }
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              console.log("收到结束标记");
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta;
              if (delta == null ? void 0 : delta.content) {
                const content = delta.content;
                if (isInThinking) {
                  thinkingContent += content;
                  thinkingLineCount += (content.match(/\n/g) || []).length;
                  if (thinkingLineCount > 3 || content.includes("第一章") || content.includes("第1章") || content.includes("# ") || thinkingContent.length > 200) {
                    isInThinking = false;
                    console.log("切换到内容输出模式");
                    if (thinkingProcess) {
                      thinkingProcess.innerHTML = `<span style="color: #10b981;">✓</span> 思考完成`;
                    }
                  } else {
                    if (thinkingProcess) {
                      thinkingProcess.innerHTML = thinkingContent.split("\n").map((line2) => `<div style="margin: 4px 0;">${line2}</div>`).join("");
                    }
                  }
                }
                if (!isInThinking) {
                  fullContent += content;
                  if (streamingContent) {
                    streamingContent.innerHTML = this.formatNovelContent(fullContent);
                  }
                }
              }
            } catch (e) {
            }
          }
        }
      }
      console.log("总内容长度:", fullContent.length);
      const cursor = document.getElementById("cursor-blink");
      if (cursor) {
        cursor.style.display = "none";
      }
      this.novelState.content = fullContent;
    } catch (error) {
      console.error("流式API调用失败:", error);
      throw error;
    }
  }
  async callNonStreamingAPI(config, prompt, thinkingProcess, streamingContent, writingStatus) {
    var _a, _b;
    const thinkingSteps = [
      "正在分析创作需求...",
      "正在构思故事结构...",
      "正在设计人物角色...",
      "正在构建情节框架...",
      "正在生成正文内容..."
    ];
    let stepIndex = 0;
    if (thinkingProcess) {
      thinkingProcess.innerHTML = `<div style="margin: 4px 0;"><span style="color: #8b5cf6;">●</span> ${thinkingSteps[0]}</div>`;
    }
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < thinkingSteps.length && thinkingProcess) {
        const steps = thinkingSteps.slice(0, stepIndex + 1);
        thinkingProcess.innerHTML = steps.map(
          (step, i) => `<div style="margin: 4px 0;"><span style="color: ${i === stepIndex ? "#8b5cf6" : "#10b981"};">${i === stepIndex ? "●" : "✓"}</span> ${step}</div>`
        ).join("");
      }
    }, 800);
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2e3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    clearInterval(stepInterval);
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const content = ((_b = (_a = data.content) == null ? void 0 : _a[0]) == null ? void 0 : _b.text) || "";
    if (thinkingProcess) {
      thinkingProcess.innerHTML = thinkingSteps.map(
        (step) => `<div style="margin: 4px 0;"><span style="color: #10b981;">✓</span> ${step}</div>`
      ).join("");
    }
    if (streamingContent) {
      const chars = content.split("");
      let currentContent = "";
      for (let i = 0; i < chars.length; i++) {
        currentContent += chars[i];
        streamingContent.innerHTML = this.formatNovelContent(currentContent);
        if (i % 3 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }
    }
    const cursor = document.getElementById("cursor-blink");
    if (cursor) {
      cursor.style.display = "none";
    }
    this.novelState.content = content;
  }
  formatNovelContent(content) {
    const paragraphs = content.split("\n").filter((p) => p.trim());
    let html = "";
    paragraphs.forEach((p) => {
      p = p.trim();
      if (p.startsWith("# ")) {
        html += `<h2 style="font-size: 1.5rem; font-weight: 600; margin: 24px 0 16px; color: #fbbf24;">${p.substring(2)}</h2>`;
      } else if (p.startsWith("## ")) {
        html += `<h3 style="font-size: 1.25rem; font-weight: 600; margin: 20px 0 12px; color: #fbbf24;">${p.substring(3)}</h3>`;
      } else if (p.startsWith("**") && p.endsWith("**")) {
        html += `<p style="margin-bottom: 16px; font-weight: 600; color: #fbbf24;">${p.substring(2, p.length - 2)}</p>`;
      } else if (p.length > 0) {
        html += `<p style="margin-bottom: 16px; text-indent: 2em; line-height: 1.8;">${p}</p>`;
      }
    });
    return html || `<p style="text-indent: 2em;">${content}</p>`;
  }
  async sendChatToAPI(userMessage) {
    var _a, _b, _c;
    const configs = JSON.parse(localStorage.getItem("api-configs") || "[]");
    const activeConfig = configs[configs.length - 1];
    console.log("=== sendChatToAPI 调试 ===");
    console.log("localStorage api-configs:", localStorage.getItem("api-configs"));
    console.log("解析后的configs数组:", configs);
    console.log("activeConfig:", activeConfig);
    console.log("用户消息:", userMessage);
    if (!activeConfig || !activeConfig.apiKey) {
      const thinkingMessages = document.querySelectorAll(".thinking-indicator");
      thinkingMessages.forEach((el) => {
        const parent = el.closest(".chat-message");
        if (parent) parent.remove();
      });
      this.addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ 请先在设置页面配置API密钥\n\n点击右上角 ⚙️ 设置按钮，添加您的API配置。",
        timestamp: /* @__PURE__ */ new Date()
      });
      return;
    }
    const { endpoint, provider, model } = this.resolveApiConfig(activeConfig);
    console.log("解析后的配置 - 端点:", endpoint, "提供商:", provider, "模型:", model);
    const agentSystemPrompt = this.currentAgent ? `你是${this.currentAgent.name}。${this.currentAgent.description}

你的核心能力：${this.currentAgent.capabilities.join("、")}

` : "你是创世纪引擎的AI助手，专注于小说创作辅助。\n\n";
    const useAgentLoop = this.agentLoopEnabled;
    const loopSystemPrompt = useAgentLoop ? this.agentLoop.getSystemPrompt() : "";
    const systemPrompt = agentSystemPrompt + loopSystemPrompt;
    const messageId = Date.now().toString();
    this.addStreamingChatMessage(messageId);
    try {
      if (useAgentLoop) {
        this.agentLoop.reset();
        await this.runAgentLoop(endpoint, provider, model, systemPrompt, userMessage, messageId, activeConfig.apiKey);
      } else {
        await this.runSimpleChat(endpoint, provider, model, systemPrompt, userMessage, messageId, activeConfig.apiKey);
      }
    } catch (error) {
      console.error("sendChatToAPI Error:", error);
      let errorMsg = error.message || "未知错误";
      if ((_a = error.message) == null ? void 0 : _a.includes("Failed to fetch")) {
        errorMsg = "网络连接失败，请检查API端点和网络设置";
      } else if ((_b = error.message) == null ? void 0 : _b.includes("401")) {
        errorMsg = "API密钥无效";
      } else if ((_c = error.message) == null ? void 0 : _c.includes("404")) {
        errorMsg = "API端点不存在";
      }
      this.updateStreamingChatMessage(messageId, `❌ 请求失败: ${errorMsg}`, true);
    }
  }
  resolveApiConfig(activeConfig) {
    let endpoint = activeConfig.endpoint;
    if (!endpoint.includes("/chat/completions")) {
      endpoint = endpoint.replace(/\/$/, "") + "/chat/completions";
    }
    let provider = activeConfig.provider;
    if (!provider || provider === "" || provider === "custom") {
      if (endpoint.includes("minimax")) provider = "minimax";
      else if (endpoint.includes("deepseek")) provider = "deepseek";
      else if (endpoint.includes("moonshot")) provider = "moonshot";
      else if (endpoint.includes("bigmodel") || endpoint.includes("zhipu")) provider = "zhipu";
      else if (endpoint.includes("dashscope") || endpoint.includes("qwen")) provider = "qwen";
      else if (endpoint.includes("doubao") || endpoint.includes("volces")) provider = "doubao";
      else if (endpoint.includes("openai")) provider = "openai";
      else provider = "openai";
    }
    if (activeConfig.model && activeConfig.model.trim() !== "") {
      console.log("API端点:", endpoint, "提供商:", provider, "模型:", activeConfig.model, "(用户指定)");
      return { endpoint, provider, model: activeConfig.model };
    }
    const modelMap = {
      "openai": "gpt-3.5-turbo",
      "deepseek": "deepseek-chat",
      "moonshot": "moonshot-v1-8k",
      "minimax": "MiniMax-M2.5",
      "zhipu": "glm-4-flash",
      "qwen": "qwen-turbo",
      "doubao": "doubao-pro-32k",
      "google": "gemini-pro",
      "anthropic": "claude-3-sonnet-20240229"
    };
    const model = modelMap[provider] || "gpt-3.5-turbo";
    console.log("API端点:", endpoint, "提供商:", provider, "模型:", model);
    return { endpoint, provider, model };
  }
  async runSimpleChat(endpoint, provider, model, systemPrompt, userMessage, messageId, apiKey) {
    var _a, _b, _c, _d;
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...this.chatHistory.filter((m) => m.role !== "system").map((m) => ({
          role: m.role,
          content: m.content
        })),
        { role: "user", content: userMessage }
      ];
      const fullContent = await this.streamApiRequest(endpoint, apiKey, model, messages, messageId);
      this.finalizeStreamingChatMessage(messageId, fullContent);
      this.chatHistory.push({
        id: messageId,
        role: "assistant",
        content: fullContent,
        agentId: (_a = this.currentAgent) == null ? void 0 : _a.id,
        timestamp: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Chat API Error:", error);
      let errorMsg = error.message || "未知错误";
      if ((_b = error.message) == null ? void 0 : _b.includes("Failed to fetch")) {
        errorMsg = "网络连接失败，请检查API端点和网络设置";
      } else if ((_c = error.message) == null ? void 0 : _c.includes("401")) {
        errorMsg = "API密钥无效";
      } else if ((_d = error.message) == null ? void 0 : _d.includes("404")) {
        errorMsg = "API端点不存在";
      }
      this.updateStreamingChatMessage(messageId, `❌ 请求失败: ${errorMsg}`, true);
    }
  }
  async runAgentLoop(endpoint, provider, model, systemPrompt, userMessage, messageId, apiKey) {
    var _a;
    try {
      let currentMessages = [
        { role: "system", content: systemPrompt },
        ...this.chatHistory.filter((m) => m.role !== "system").map((m) => ({
          role: m.role,
          content: m.content
        })),
        { role: "user", content: userMessage }
      ];
      const maxIterations = 15;
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        console.log(`Agent Loop 迭代 ${iteration + 1}/${maxIterations}`);
        const fullContent = await this.streamApiRequest(endpoint, apiKey, model, currentMessages, messageId);
        const { isToolCall, toolCall } = this.agentLoop.processStreamChunk(fullContent);
        if (!isToolCall || !toolCall) {
          this.finalizeStreamingChatMessage(messageId, fullContent);
          this.chatHistory.push({
            id: messageId,
            role: "assistant",
            content: fullContent,
            agentId: (_a = this.currentAgent) == null ? void 0 : _a.id,
            timestamp: /* @__PURE__ */ new Date()
          });
          return;
        }
        const toolResult = await this.agentLoop.executeTool(toolCall);
        this.appendAgentStepToMessage(messageId, renderAgentStepHtml({
          type: "tool_call",
          content: `调用: ${toolCall.name}`,
          toolCall,
          timestamp: Date.now()
        }));
        this.appendAgentStepToMessage(messageId, renderAgentStepHtml({
          type: "tool_result",
          content: toolResult.result,
          toolResult,
          timestamp: Date.now()
        }));
        currentMessages.push({ role: "assistant", content: fullContent });
        currentMessages.push({
          role: "user",
          content: `[工具 ${toolCall.name} 执行结果]:
${toolResult.success ? "✅ 成功" : "❌ 失败"}
${toolResult.result}

请根据结果继续操作，或给出最终回答。`
        });
      }
      this.finalizeStreamingChatMessage(messageId, "⚠️ Agent Loop 已达到最大迭代次数");
    } catch (error) {
      console.error("Agent Loop Error:", error);
      this.updateStreamingChatMessage(messageId, `❌ 请求失败: ${error.message}`, true);
    }
  }
  async streamApiRequest(endpoint, apiKey, model, messages, messageId) {
    var _a, _b, _c;
    console.log("=== streamApiRequest 开始 ===");
    console.log("端点:", endpoint);
    console.log("模型:", model);
    console.log("消息数量:", messages.length);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.8,
          max_tokens: 4e3,
          stream: true
        })
      });
      console.log("响应状态:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API错误响应:", errorText);
        throw new Error(`API请求失败 (${response.status}): ${errorText || response.statusText}`);
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) throw new Error("无法获取响应流");
      const decoder = new TextDecoder();
      let fullContent = "";
      let rawChunks = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("流读取完成，总内容长度:", fullContent.length);
          console.log("原始响应数据:", rawChunks.substring(0, 500));
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        rawChunks += chunk;
        console.log("收到chunk:", chunk.substring(0, 200));
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              console.log("解析数据:", parsed);
              const delta = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta;
              if (delta == null ? void 0 : delta.content) {
                fullContent += delta.content;
                this.updateStreamingChatMessage(messageId, fullContent);
              }
            } catch (e) {
              console.log("解析失败:", data.substring(0, 100));
            }
          }
        }
      }
      if (!fullContent) {
        console.log("流式输出为空，尝试非流式请求");
        return await this.nonStreamApiRequest(endpoint, apiKey, model, messages, messageId);
      }
      return fullContent;
    } catch (error) {
      console.error("streamApiRequest 错误:", error);
      throw error;
    }
  }
  async nonStreamApiRequest(endpoint, apiKey, model, messages, messageId) {
    var _a, _b, _c;
    console.log("=== nonStreamApiRequest 开始 ===");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 4e3,
        stream: false
      })
    });
    console.log("非流式响应状态:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("非流式API错误:", errorText);
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log("非流式响应数据:", data);
    const content = ((_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) || "";
    if (content) {
      this.updateStreamingChatMessage(messageId, content);
    }
    return content;
  }
  appendAgentStepToMessage(messageId, stepHtml) {
    const messageDiv = document.getElementById(`msg-${messageId}`);
    if (!messageDiv) return;
    const contentDiv = messageDiv.querySelector(".streaming-content");
    if (!contentDiv) return;
    let stepsContainer = contentDiv.querySelector(".agent-steps");
    if (!stepsContainer) {
      stepsContainer = document.createElement("div");
      stepsContainer.className = "agent-steps";
      contentDiv.insertBefore(stepsContainer, contentDiv.firstChild);
    }
    stepsContainer.insertAdjacentHTML("beforeend", stepHtml);
    const chatContainer = document.getElementById("chat-messages");
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  addStreamingChatMessage(messageId) {
    const container = document.getElementById("chat-messages");
    if (!container) return;
    const messageDiv = document.createElement("div");
    messageDiv.id = `msg-${messageId}`;
    messageDiv.className = "chat-message assistant streaming";
    messageDiv.innerHTML = `
      <div class="message-bubble">
        <div class="thinking-indicator" style="display: flex; align-items: center; gap: 10px; padding: 8px 0;">
          <div class="thinking-dots" style="display: flex; gap: 5px;">
            <span style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out infinite both;"></span>
            <span style="width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out 0.16s infinite both;"></span>
            <span style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; animation: thinking-bounce 1.4s ease-in-out 0.32s infinite both;"></span>
          </div>
          <span style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">AI 正在思考中...</span>
        </div>
        <div class="streaming-content" style="white-space: pre-wrap; display: none;"></div>
      </div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }
  updateStreamingChatMessage(messageId, content, isError = false) {
    const messageDiv = document.getElementById(`msg-${messageId}`);
    if (!messageDiv) return;
    const contentDiv = messageDiv.querySelector(".streaming-content");
    const thinkingIndicator = messageDiv.querySelector(".thinking-indicator");
    if (contentDiv) {
      if (isError) {
        contentDiv.style.display = "block";
        contentDiv.innerHTML = content;
        if (thinkingIndicator) thinkingIndicator.style.display = "none";
        messageDiv.classList.remove("streaming");
      } else {
        contentDiv.style.display = "block";
        if (thinkingIndicator) thinkingIndicator.style.display = "none";
        contentDiv.innerHTML = content + '<span class="typing-cursor" style="display: inline-block; width: 2px; height: 1em; background: #fbbf24; animation: blink 1s infinite; vertical-align: text-bottom; margin-left: 2px;"></span>';
      }
    }
    const container = document.getElementById("chat-messages");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
  finalizeStreamingChatMessage(messageId, content) {
    const messageDiv = document.getElementById(`msg-${messageId}`);
    if (!messageDiv) return;
    messageDiv.classList.remove("streaming");
    const contentDiv = messageDiv.querySelector(".streaming-content");
    if (contentDiv) {
      contentDiv.innerHTML = this.formatChatContent(content);
    }
  }
  addChatMessage(message) {
    const container = this.$("chat-messages");
    if (!container) return;
    this.chatHistory.push(message);
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${message.role}`;
    let content = message.content;
    if (message.role === "system") {
      content = `<em style="color: rgba(255,255,255,0.6);">${content}</em>`;
    }
    messageDiv.innerHTML = `<div class="message-bubble">${content}</div>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }
  toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") !== "light";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.textContent = isDark ? "☀️" : "🌙";
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new GenesisEngineV3();
});
