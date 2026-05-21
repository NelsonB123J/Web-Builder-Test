/**
 * ============================================================
 * Obsidian Builder — builder.js
 * Production-ready Web Page Builder Application Logic
 * Vanilla ES6+ Modules | Firebase Realtime Database
 * ============================================================
 */

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDeg51XonQUKuq72ojOdEAelF_Qljxdw5k",
  authDomain:        "web-builder-test.firebaseapp.com",
  databaseURL:       "https://web-builder-test-default-rtdb.firebaseio.com",
  projectId:         "web-builder-test",
  storageBucket:     "web-builder-test.firebasestorage.app",
  messagingSenderId: "727232763731",
  appId:             "1:727232763731:web:e83fc59695a72c6e98b3a6",
  measurementId:     "G-VLLB4QJJTG"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const PAGE_ID = "user_site_01";

// ============================================================
// DOM REFERENCES
// ============================================================
const sidebar      = document.getElementById("sidebar-body");
const btnSave      = document.getElementById("btn-save");
const btnSaveText  = document.getElementById("btn-save-text");
const frame        = document.getElementById("preview-frame");
const iframeLoader = document.getElementById("iframe-loading");
const statusDot    = document.getElementById("status-dot");
const statusLabel  = document.getElementById("status-label");

// ============================================================
// STATE
// ============================================================
/** @type {Element|null} Currently selected element inside the iframe */
let selectedEl = null;

/** @type {Document|null} Shorthand for iframe's contentDocument */
let iframeDoc = null;

/** Fallback HTML shown when the DB has no content yet */
const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Site</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;color:#1f2937;background:#fff}
    header{background:#1e3a5f;color:#fff;padding:48px 40px;text-align:center}
    header h1{font-size:2.4rem;margin-bottom:12px}
    header p{font-size:1.1rem;opacity:.8}
    nav{background:#162d4a;padding:0 40px;display:flex;gap:0}
    nav a{color:#93c5fd;padding:14px 18px;text-decoration:none;font-size:.9rem;display:block}
    nav a:hover{background:rgba(255,255,255,.08);color:#fff}
    .hero{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);padding:80px 40px;text-align:center}
    .hero h2{font-size:2rem;color:#1e3a5f;margin-bottom:16px}
    .hero p{font-size:1.05rem;color:#4b5563;max-width:560px;margin:0 auto 32px}
    .cta-btn{background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;display:inline-block}
    .gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:48px 40px;max-width:1100px;margin:0 auto}
    .gallery img{width:100%;height:200px;object-fit:cover;border-radius:8px;display:block}
    .features{padding:60px 40px;background:#f9fafb;max-width:1100px;margin:0 auto}
    .features h2{text-align:center;font-size:1.8rem;margin-bottom:40px;color:#1e3a5f}
    .feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .feature-card{background:#fff;padding:28px;border-radius:10px;border:1px solid #e5e7eb}
    .feature-card h3{font-size:1.1rem;color:#1e3a5f;margin-bottom:10px}
    .feature-card p{font-size:.9rem;color:#6b7280;line-height:1.6}
    footer{background:#111827;color:#9ca3af;text-align:center;padding:32px;font-size:.85rem}
    section{max-width:100%}
    @media(max-width:768px){
      .gallery{grid-template-columns:repeat(2,1fr)}
      .feature-grid{grid-template-columns:1fr}
      .hero h2{font-size:1.5rem}
      header h1{font-size:1.8rem}
    }
  </style>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
    <p>A beautiful, editable website powered by Obsidian Builder</p>
  </header>
  <nav>
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Portfolio</a>
    <a href="#">Contact</a>
  </nav>
  <section class="hero">
    <h2>Build Something Amazing</h2>
    <p>Click any element to start editing — change text, images, colors, and more in real time.</p>
    <a class="cta-btn" href="#">Get Started</a>
  </section>
  <section>
    <div class="gallery">
      <img src="https://picsum.photos/seed/img1/400/300" alt="Gallery image 1" class="gallery-item"/>
      <img src="https://picsum.photos/seed/img2/400/300" alt="Gallery image 2" class="gallery-item"/>
      <img src="https://picsum.photos/seed/img3/400/300" alt="Gallery image 3" class="gallery-item"/>
    </div>
  </section>
  <section class="features">
    <h2>Our Features</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h3>Fast Performance</h3>
        <p>Built with modern standards for blazing-fast page loads and smooth interactions.</p>
      </div>
      <div class="feature-card">
        <h3>Responsive Design</h3>
        <p>Looks great on any screen size — desktop, tablet, and mobile devices.</p>
      </div>
      <div class="feature-card">
        <h3>Easy Editing</h3>
        <p>Click any element to edit it directly. No coding knowledge required.</p>
      </div>
    </div>
  </section>
  <footer>
    <p>&copy; 2025 My Website. Built with Obsidian Builder.</p>
  </footer>
</body>
</html>`;

// ============================================================
// STATUS HELPERS
// ============================================================
/**
 * Update the bottom status bar.
 * @param {'idle'|'connected'|'saving'|'error'} type
 * @param {string} message
 */
function setStatus(type, message) {
  statusDot.className = "status-dot";
  const classMap = { connected: "connected", saving: "saving", error: "error" };
  if (classMap[type]) statusDot.classList.add(classMap[type]);
  statusLabel.textContent = message;
}

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
/**
 * Show a toast notification.
 * @param {'success'|'error'|'info'} type
 * @param {string} message
 * @param {number} [duration=3000]
 */
function showToast(type, message, duration = 3000) {
  const icons = {
    success: `<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type]}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}

// ============================================================
// IFRAME — LOAD CONTENT
// ============================================================
/**
 * Write raw HTML string into the preview iframe and attach click listeners.
 * @param {string} html
 */
function writeToIframe(html) {
  iframeDoc = frame.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // After write, attach click delegation
  attachIframeListeners();

  // Hide loading overlay
  iframeLoader.classList.add("hidden");
  setStatus("connected", "Loaded from database");
}

// ============================================================
// IFRAME — CLICK DELEGATION
// ============================================================
/**
 * Attach a delegated click listener on the iframe body.
 * Handles: element selection, outline rendering, sidebar update.
 */
function attachIframeListeners() {
  if (!iframeDoc) return;

  iframeDoc.body.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;

    // Deselect if clicking on the same element
    if (target === selectedEl) {
      deselectElement();
      return;
    }

    // Remove previous selection outline
    clearOutline();

    // Set new selection
    selectedEl = target;
    applyOutline(selectedEl);

    // Update the sidebar to match element type
    renderSidebarForElement(selectedEl);
  });

  // Click on the document background deselects
  iframeDoc.addEventListener("click", (e) => {
    if (e.target === iframeDoc.body || e.target === iframeDoc.documentElement) {
      deselectElement();
    }
  });
}

/** Apply the dashed electric-blue outline to an element inside the iframe */
function applyOutline(el) {
  if (!el) return;
  el.setAttribute("data-builder-selected", "true");
  el.style.outline = "2px dashed #2563EB";
  el.style.outlineOffset = "4px";
}

/** Remove outline from the currently selected element */
function clearOutline() {
  if (!selectedEl) return;
  selectedEl.style.outline = "";
  selectedEl.style.outlineOffset = "";
  selectedEl.removeAttribute("data-builder-selected");
}

/** Deselect the current element and render the idle sidebar state */
function deselectElement() {
  clearOutline();
  selectedEl = null;
  renderIdleState();
}

// ============================================================
// ELEMENT TYPE CLASSIFICATION
// ============================================================
const TEXT_TAGS = new Set(["H1","H2","H3","H4","H5","H6","P","SPAN","A","LI","STRONG","EM","LABEL","TD","TH","CAPTION","BLOCKQUOTE"]);

/**
 * Determine what "kind" an element is for sidebar routing.
 * @param {Element} el
 * @returns {'text'|'gallery-item'|'gallery'|'image'|'container'}
 */
function classifyElement(el) {
  const tag = el.tagName.toUpperCase();

  // Gallery container
  if (el.classList.contains("gallery")) return "gallery";

  // Item inside a gallery
  if (el.closest(".gallery")) return "gallery-item";

  // Standalone image
  if (tag === "IMG") return "image";

  // Text element
  if (TEXT_TAGS.has(tag)) return "text";

  // Fallback — structural container
  return "container";
}

// ============================================================
// SIDEBAR RENDERING ENGINE
// ============================================================

/** Render idle state (nothing selected) */
function renderIdleState() {
  sidebar.innerHTML = `
    <div class="ctrl-card">
      <div class="ctrl-card-body">
        <div class="idle-state">
          <div class="idle-graphic">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div class="idle-title">No Element Selected</div>
          <div class="idle-message">
            Click any element inside the live web preview to begin editing its content, styles, or layout.
          </div>
        </div>
      </div>
    </div>

    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="card-title">Page Info</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Database Path</span>
          <div class="ctrl-input" style="opacity:.7;cursor:default">pages/${PAGE_ID}/htmlCode</div>
        </div>
        <div class="ctrl-group">
          <span class="ctrl-label">How to Edit</span>
          <div class="text-muted" style="line-height:1.7;">
            • Click <strong style="color:#fff">text</strong> to edit content &amp; typography<br>
            • Click <strong style="color:#fff">images</strong> to swap via URL or upload<br>
            • Click <strong style="color:#fff">containers</strong> to change backgrounds<br>
            • Hit <strong style="color:#2563EB">Save Changes</strong> to push to database
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the appropriate control panel for the selected element.
 * @param {Element} el
 */
function renderSidebarForElement(el) {
  const kind = classifyElement(el);
  const tag  = el.tagName.toUpperCase();

  // Build the selection badge at top
  const badgeHtml = `
    <div style="padding:0 0 4px;">
      <div class="selection-badge">
        <span class="tag-dot"></span>
        &lt;${tag.toLowerCase()}&gt;
        <span style="opacity:.6;font-size:10px;">${kind}</span>
      </div>
    </div>
  `;

  switch (kind) {
    case "text":         sidebar.innerHTML = badgeHtml + buildTextControls(el);     break;
    case "image":        sidebar.innerHTML = badgeHtml + buildImageControls(el);    break;
    case "gallery":      sidebar.innerHTML = badgeHtml + buildGalleryControls(el);  break;
    case "gallery-item": sidebar.innerHTML = badgeHtml + buildGalleryItemControls(el); break;
    case "container":    sidebar.innerHTML = badgeHtml + buildContainerControls(el); break;
    default:             renderIdleState();
  }

  // Bind all newly rendered controls
  bindControls(el, kind);
}

// ============================================================
// CONTROL PANEL BUILDERS — Return HTML strings
// ============================================================

/** Build text editing controls HTML */
function buildTextControls(el) {
  const cs    = el.style;
  const color = rgbToHex(cs.color) || "#000000";
  const size  = parseInt(cs.fontSize) || 16;
  const align = cs.textAlign || "left";
  const weight= cs.fontWeight === "bold" || parseInt(cs.fontWeight) >= 700 ? "bold" : "normal";

  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg></div>
        <div class="card-title">Text Content</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Edit Inline</span>
          <button class="action-btn" id="ctrl-editable-toggle">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Enable Inline Editing
          </button>
        </div>
      </div>
    </div>

    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
        <div class="card-title">Text Color</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <div class="color-picker-row">
            <div class="color-swatch-wrap">
              <div class="color-swatch-preview" id="color-swatch-preview" style="background:${color};"></div>
              <input type="color" id="ctrl-color" value="${color}" />
            </div>
            <input type="text" class="color-hex-input" id="ctrl-color-hex" value="${color}" maxlength="7" placeholder="#000000" />
          </div>
        </div>
      </div>
    </div>

    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg></div>
        <div class="card-title">Typography</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Font Size — <span id="fs-val">${size}px</span></span>
          <div class="slider-row">
            <input type="range" class="ctrl-slider" id="ctrl-fontsize" min="12" max="72" value="${size}" />
            <span class="slider-value" id="fs-disp">${size}px</span>
          </div>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Text Alignment</span>
          <div class="segment-control">
            <button class="segment-btn ${align==='left'?'active':''}" data-align="left" id="align-left">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
              Left
            </button>
            <button class="segment-btn ${align==='center'?'active':''}" data-align="center" id="align-center">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              Center
            </button>
            <button class="segment-btn ${align==='right'?'active':''}" data-align="right" id="align-right">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
              Right
            </button>
          </div>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Font Weight</span>
          <div class="toggle-row">
            <button class="toggle-btn ${weight==='normal'?'active':''}" id="fw-regular">Regular</button>
            <button class="toggle-btn ${weight==='bold'?'active':''}" id="fw-bold">
              <strong>Bold</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Build standalone image controls HTML */
function buildImageControls(el) {
  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        <div class="card-title">Image Source</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Paste Image URL</span>
          <div class="url-input-row">
            <input type="text" class="ctrl-input" id="ctrl-img-url" placeholder="https://example.com/image.jpg" />
            <button class="paste-btn" id="btn-paste-url" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            </button>
          </div>
        </div>
        <button class="url-apply-btn" id="btn-apply-url">Apply URL →</button>

        <div class="ctrl-divider"></div>

        <div class="ctrl-group">
          <span class="ctrl-label">Upload Local Image</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-img-upload" />
            <div class="upload-icon">🖼</div>
            <div class="upload-text">
              <strong>Click to browse</strong> or drag &amp; drop<br>
              Auto-compressed to ≤1200px, JPEG 70%
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Build gallery container controls HTML */
function buildGalleryControls(el) {
  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
        <div class="card-title">Gallery Management</div>
      </div>
      <div class="ctrl-card-body">
        <button class="action-btn" id="btn-add-gallery-img">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Image to Gallery
        </button>
        <div class="text-muted">New images are added with a placeholder. Click an individual image inside the gallery to replace it.</div>
      </div>
    </div>
  `;
}

/** Build gallery item (image inside .gallery) controls HTML */
function buildGalleryItemControls(el) {
  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        <div class="card-title">Gallery Image</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Replace via URL</span>
          <div class="url-input-row">
            <input type="text" class="ctrl-input" id="ctrl-img-url" placeholder="https://example.com/image.jpg" />
            <button class="paste-btn" id="btn-paste-url" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            </button>
          </div>
        </div>
        <button class="url-apply-btn" id="btn-apply-url">Apply URL →</button>

        <div class="ctrl-divider"></div>

        <div class="ctrl-group">
          <span class="ctrl-label">Upload &amp; Compress</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-img-upload" />
            <div class="upload-icon">🖼</div>
            <div class="upload-text">
              <strong>Click to browse</strong><br>Auto-compressed via Canvas API
            </div>
          </div>
        </div>

        <div class="ctrl-divider"></div>

        <button class="action-btn danger" id="btn-delete-gallery-img">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete This Image
        </button>
      </div>
    </div>
  `;
}

/** Build container (div/section/header) background controls HTML */
function buildContainerControls(el) {
  const cs    = el.style;
  const bgColor = rgbToHex(cs.backgroundColor) || "#ffffff";
  const hasBgImg= !!(cs.backgroundImage && cs.backgroundImage !== "none");

  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
        <div class="card-title">Background</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Background Color</span>
          <div class="color-picker-row">
            <div class="color-swatch-wrap">
              <div class="color-swatch-preview" id="color-swatch-preview" style="background:${bgColor};"></div>
              <input type="color" id="ctrl-bgcolor" value="${bgColor}" />
            </div>
            <input type="text" class="color-hex-input" id="ctrl-bgcolor-hex" value="${bgColor}" maxlength="7" placeholder="#ffffff" />
          </div>
        </div>

        <div class="ctrl-divider"></div>

        <div class="ctrl-group">
          <span class="ctrl-label">Background Image — URL</span>
          <div class="url-input-row">
            <input type="text" class="ctrl-input" id="ctrl-bgimg-url" placeholder="https://…/photo.jpg" />
            <button class="paste-btn" id="btn-paste-bgurl" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            </button>
          </div>
          <button class="url-apply-btn" style="margin-top:6px" id="btn-apply-bgurl">Apply Background Image →</button>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Upload Background Image</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-bgimg-upload" />
            <div class="upload-icon">🎨</div>
            <div class="upload-text">
              <strong>Click to browse</strong><br>Canvas-compressed, set as background
            </div>
          </div>
        </div>

        ${hasBgImg ? `
        <button class="action-btn danger" id="btn-remove-bgimg">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Remove Background Image
        </button>` : ""}
      </div>
    </div>
  `;
}

// ============================================================
// CONTROL BINDING ENGINE
// ============================================================
/**
 * After sidebar HTML is set, wire all interactive controls.
 * @param {Element} el  — the selected iframe element
 * @param {string}  kind — element classification
 */
function bindControls(el, kind) {
  // ── TEXT CONTROLS ──────────────────────────────────────────
  if (kind === "text") {
    // Inline edit toggle
    const editBtn = document.getElementById("ctrl-editable-toggle");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const isEditable = el.getAttribute("contenteditable") === "true";
        if (isEditable) {
          el.removeAttribute("contenteditable");
          el.style.outline = "2px dashed #2563EB";
          editBtn.textContent = "Enable Inline Editing";
        } else {
          el.setAttribute("contenteditable", "true");
          el.focus();
          editBtn.textContent = "✔ Editing Active — Click to Disable";
        }
      });
    }

    // Color picker
    const colorPicker = document.getElementById("ctrl-color");
    const colorHex    = document.getElementById("ctrl-color-hex");
    const colorSwatch = document.getElementById("color-swatch-preview");

    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => {
        const val = e.target.value;
        el.style.color = val;
        if (colorHex) colorHex.value = val;
        if (colorSwatch) colorSwatch.style.background = val;
      });
    }

    if (colorHex) {
      colorHex.addEventListener("input", (e) => {
        const val = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          el.style.color = val;
          if (colorPicker) colorPicker.value = val;
          if (colorSwatch) colorSwatch.style.background = val;
        }
      });
    }

    // Font size slider
    const fsSlider = document.getElementById("ctrl-fontsize");
    const fsDisp   = document.getElementById("fs-disp");
    if (fsSlider) {
      fsSlider.addEventListener("input", (e) => {
        const val = e.target.value + "px";
        el.style.fontSize = val;
        if (fsDisp) fsDisp.textContent = val;
      });
    }

    // Alignment buttons
    ["left","center","right"].forEach(dir => {
      const btn = document.getElementById(`align-${dir}`);
      if (btn) {
        btn.addEventListener("click", () => {
          el.style.textAlign = dir;
          document.querySelectorAll("[data-align]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      }
    });

    // Font weight
    const fwRegular = document.getElementById("fw-regular");
    const fwBold    = document.getElementById("fw-bold");
    if (fwRegular && fwBold) {
      fwRegular.addEventListener("click", () => {
        el.style.fontWeight = "normal";
        fwRegular.classList.add("active");
        fwBold.classList.remove("active");
      });
      fwBold.addEventListener("click", () => {
        el.style.fontWeight = "bold";
        fwBold.classList.add("active");
        fwRegular.classList.remove("active");
      });
    }
  }

  // ── IMAGE CONTROLS (standalone + gallery-item) ────────────
  if (kind === "image" || kind === "gallery-item") {
    const urlInput   = document.getElementById("ctrl-img-url");
    const pasteBtn   = document.getElementById("btn-paste-url");
    const applyBtn   = document.getElementById("btn-apply-url");
    const fileInput  = document.getElementById("ctrl-img-upload");

    if (pasteBtn && urlInput) {
      pasteBtn.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          urlInput.value = text.trim();
          showToast("info", "Pasted from clipboard");
        } catch (_) {
          showToast("error", "Clipboard access denied");
        }
      });
    }

    if (applyBtn && urlInput) {
      applyBtn.addEventListener("click", () => {
        const url = urlInput.value.trim();
        if (url && el.tagName === "IMG") {
          el.src = url;
          showToast("success", "Image URL applied");
        } else if (!url) {
          showToast("error", "Enter a valid URL first");
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImageViaCanvas(file, 1200, 0.7, (base64) => {
          if (el.tagName === "IMG") {
            el.src = base64;
            showToast("success", "Image compressed and applied");
          }
        });
      });
    }

    // Gallery item delete
    if (kind === "gallery-item") {
      const deleteBtn = document.getElementById("btn-delete-gallery-img");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          el.remove();
          deselectElement();
          showToast("success", "Image removed from gallery");
        });
      }
    }
  }

  // ── GALLERY CONTAINER CONTROLS ────────────────────────────
  if (kind === "gallery") {
    const addBtn = document.getElementById("btn-add-gallery-img");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const img = iframeDoc.createElement("img");
        img.src       = "https://picsum.photos/seed/" + Date.now() + "/400/300";
        img.className = "gallery-item";
        img.alt       = "Gallery image";
        img.style.cssText = "width:100%;height:200px;object-fit:cover;border-radius:8px;display:block;";
        el.appendChild(img);
        showToast("success", "New image added to gallery");
      });
    }
  }

  // ── CONTAINER BACKGROUND CONTROLS ─────────────────────────
  if (kind === "container") {
    const bgColorPicker = document.getElementById("ctrl-bgcolor");
    const bgColorHex    = document.getElementById("ctrl-bgcolor-hex");
    const bgColorSwatch = document.getElementById("color-swatch-preview");

    if (bgColorPicker) {
      bgColorPicker.addEventListener("input", (e) => {
        el.style.backgroundColor = e.target.value;
        if (bgColorHex) bgColorHex.value = e.target.value;
        if (bgColorSwatch) bgColorSwatch.style.background = e.target.value;
      });
    }

    if (bgColorHex) {
      bgColorHex.addEventListener("input", (e) => {
        const val = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          el.style.backgroundColor = val;
          if (bgColorPicker) bgColorPicker.value = val;
          if (bgColorSwatch) bgColorSwatch.style.background = val;
        }
      });
    }

    // Background image via URL
    const bgImgUrl   = document.getElementById("ctrl-bgimg-url");
    const bgPasteBtn = document.getElementById("btn-paste-bgurl");
    const bgApplyBtn = document.getElementById("btn-apply-bgurl");

    if (bgPasteBtn && bgImgUrl) {
      bgPasteBtn.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          bgImgUrl.value = text.trim();
          showToast("info", "Pasted from clipboard");
        } catch (_) {
          showToast("error", "Clipboard access denied");
        }
      });
    }

    if (bgApplyBtn && bgImgUrl) {
      bgApplyBtn.addEventListener("click", () => {
        const url = bgImgUrl.value.trim();
        if (url) {
          el.style.backgroundImage    = `url('${url}')`;
          el.style.backgroundSize     = "cover";
          el.style.backgroundPosition = "center";
          showToast("success", "Background image applied");
        }
      });
    }

    // Background image via file upload
    const bgFileInput = document.getElementById("ctrl-bgimg-upload");
    if (bgFileInput) {
      bgFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImageViaCanvas(file, 1200, 0.7, (base64) => {
          el.style.backgroundImage    = `url('${base64}')`;
          el.style.backgroundSize     = "cover";
          el.style.backgroundPosition = "center";
          showToast("success", "Background image compressed and applied");
        });
      });
    }

    // Remove background image
    const removeBgBtn = document.getElementById("btn-remove-bgimg");
    if (removeBgBtn) {
      removeBgBtn.addEventListener("click", () => {
        el.style.backgroundImage = "none";
        showToast("success", "Background image removed");
        renderSidebarForElement(el); // Re-render to hide button
      });
    }
  }
}

// ============================================================
// CANVAS IMAGE COMPRESSION PIPELINE
// ============================================================
/**
 * Resize and compress an image file via an in-memory HTML Canvas.
 * Scales down so longest edge ≤ maxPx, then exports as JPEG at quality.
 *
 * @param {File}     file    — source image file
 * @param {number}   maxPx   — max width or height in pixels
 * @param {number}   quality — JPEG quality 0.0–1.0
 * @param {Function} cb      — callback(base64DataURL: string)
 */
function compressImageViaCanvas(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down proportionally
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width  = maxPx;
        } else {
          width  = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL("image/jpeg", quality);
      cb(base64);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================================
// SAVE / SYNC TO FIREBASE
// ============================================================
/**
 * Collect the current iframe DOM, strip builder artifacts,
 * and push the clean HTML to Firebase Realtime Database.
 */
async function saveToDatabase() {
  if (!iframeDoc) {
    showToast("error", "No page loaded to save");
    return;
  }

  // Enter saving state
  btnSave.classList.add("saving");
  btnSaveText.textContent = "Saving…";
  setStatus("saving", "Pushing to Firebase…");

  try {
    // Work on a deep clone so we don't mutate the live DOM
    const clone = iframeDoc.documentElement.cloneNode(true);

    // Scrub all builder-injected attributes / styles
    const allEls = clone.querySelectorAll("*");
    allEls.forEach((el) => {
      // Remove contenteditable
      if (el.hasAttribute("contenteditable")) {
        el.removeAttribute("contenteditable");
      }

      // Remove the selection outline only (keep other inline styles)
      if (el.style.outline && el.style.outline.includes("#2563EB")) {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }

      // Remove data-builder-selected attribute
      if (el.hasAttribute("data-builder-selected")) {
        el.removeAttribute("data-builder-selected");
      }
    });

    const cleanHTML = "<!DOCTYPE html>\n" + clone.outerHTML;

    // Push to Firebase
    const pageRef = ref(db, `pages/${PAGE_ID}/htmlCode`);
    await set(pageRef, cleanHTML);

    // Success feedback
    btnSave.classList.remove("saving");
    btnSave.classList.add("saved");
    btnSaveText.textContent = "✔ Saved!";
    setStatus("connected", "Saved to Firebase ✔");
    showToast("success", "Page saved to database");

    // Reset button after 2.5s
    setTimeout(() => {
      btnSave.classList.remove("saved");
      btnSaveText.textContent = "Save Changes";
    }, 2500);

  } catch (err) {
    console.error("Firebase save error:", err);
    btnSave.classList.remove("saving");
    btnSaveText.textContent = "Save Changes";
    setStatus("error", "Save failed — check console");
    showToast("error", "Save failed: " + (err.message || "Unknown error"));
  }
}

// ============================================================
// BOOTSTRAP — LOAD FROM FIREBASE ON MOUNT
// ============================================================
async function initBuilder() {
  setStatus("idle", "Connecting to Firebase…");

  try {
    const pageRef  = ref(db, `pages/${PAGE_ID}/htmlCode`);
    const snapshot = await get(pageRef);

    if (snapshot.exists()) {
      const html = snapshot.val();
      writeToIframe(html);
      setStatus("connected", "Page loaded");
      showToast("success", "Page loaded from database");
    } else {
      // No data yet — write and load the fallback
      console.info("No data at pages/" + PAGE_ID + "/htmlCode — using fallback template.");
      writeToIframe(FALLBACK_HTML);
      // Also save the fallback so subsequent loads work
      const pageRef2 = ref(db, `pages/${PAGE_ID}/htmlCode`);
      await set(pageRef2, FALLBACK_HTML);
      setStatus("connected", "Template initialized");
      showToast("info", "Default template loaded & saved");
    }
  } catch (err) {
    console.error("Firebase load error:", err);
    // Still load fallback so the builder is usable offline
    writeToIframe(FALLBACK_HTML);
    setStatus("error", "DB error — offline mode");
    showToast("error", "Could not load from DB — using fallback");
  }

  // Always render the idle sidebar
  renderIdleState();
}

// ============================================================
// UTILITY — RGB to HEX
// ============================================================
/**
 * Convert computed rgb(...) string to hex #RRGGBB.
 * Falls back to empty string if conversion fails.
 * @param {string} rgb
 * @returns {string}
 */
function rgbToHex(rgb) {
  if (!rgb || rgb === "") return "";
  if (rgb.startsWith("#")) return rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "";

  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Save button
btnSave.addEventListener("click", saveToDatabase);

// Keyboard shortcut: Ctrl/Cmd + S
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveToDatabase();
  }
});

// Escape key — deselect element
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && selectedEl) {
    deselectElement();
  }
});

// ============================================================
// START THE APP
// ============================================================
initBuilder();
