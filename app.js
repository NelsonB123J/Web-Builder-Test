/* ─────────────────────────────────────────────────────────
   FIREBASE INIT
───────────────────────────────────────────────────────── */
import { initializeApp }              from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics, isSupported }  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

const fbApp = initializeApp(firebaseConfig);
const db    = getDatabase(fbApp);

// Analytics only initialises in environments that support it
// (blocked in some iframes/browsers — isSupported() guards this safely)
isSupported().then(yes => { if (yes) getAnalytics(fbApp); });

const PAGE_ID = "user_site_01";

/* ─────────────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────────────── */
const sidebar      = document.getElementById("sidebar-body");
const btnSave      = document.getElementById("btn-save");
const btnSaveText  = document.getElementById("btn-save-text");
const frame        = document.getElementById("preview-frame");
const iframeLoader = document.getElementById("iframe-loading");
const statusDot    = document.getElementById("status-dot");
const statusLabel  = document.getElementById("status-label");

/* ─────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────── */
let selectedEl = null;   // active element inside the iframe
let iframeDoc  = null;   // reference to iframe's document
let loaderTimer = null;  // safety-timeout handle

/* ─────────────────────────────────────────────────────────
   FALLBACK TEMPLATE  (seeded to DB on first run)
───────────────────────────────────────────────────────── */
const FALLBACK_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en"><head><meta charset="UTF-8"/>',
  '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>',
  '<title>My Site</title>',
  '<style>',
  '*{box-sizing:border-box;margin:0;padding:0}',
  'body{font-family:"Segoe UI",sans-serif;color:#1f2937;background:#fff}',
  'header{background:#1e3a5f;color:#fff;padding:48px 40px;text-align:center}',
  'header h1{font-size:2.4rem;margin-bottom:12px}',
  'header p{font-size:1.1rem;opacity:.8}',
  'nav{background:#162d4a;padding:0 40px;display:flex}',
  'nav a{color:#93c5fd;padding:14px 18px;text-decoration:none;font-size:.9rem;display:block}',
  'nav a:hover{background:rgba(255,255,255,.08);color:#fff}',
  '.hero{background:linear-gradient(135deg,#eff6ff,#dbeafe);padding:80px 40px;text-align:center}',
  '.hero h2{font-size:2rem;color:#1e3a5f;margin-bottom:16px}',
  '.hero p{font-size:1.05rem;color:#4b5563;max-width:560px;margin:0 auto 32px}',
  '.cta-btn{background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;display:inline-block}',
  '.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:48px 40px;max-width:1100px;margin:0 auto}',
  '.gallery img{width:100%;height:200px;object-fit:cover;border-radius:8px;display:block}',
  '.features{padding:60px 40px;background:#f9fafb;max-width:1100px;margin:0 auto}',
  '.features h2{text-align:center;font-size:1.8rem;margin-bottom:40px;color:#1e3a5f}',
  '.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}',
  '.feature-card{background:#fff;padding:28px;border-radius:10px;border:1px solid #e5e7eb}',
  '.feature-card h3{font-size:1.1rem;color:#1e3a5f;margin-bottom:10px}',
  '.feature-card p{font-size:.9rem;color:#6b7280;line-height:1.6}',
  'footer{background:#111827;color:#9ca3af;text-align:center;padding:32px;font-size:.85rem}',
  '@media(max-width:768px){.gallery{grid-template-columns:repeat(2,1fr)}.feature-grid{grid-template-columns:1fr}}',
  '</style></head><body>',
  '<header><h1>Welcome to My Website</h1><p>A beautiful, editable website powered by Obsidian Builder</p></header>',
  '<nav><a href="#">Home</a><a href="#">About</a><a href="#">Portfolio</a><a href="#">Contact</a></nav>',
  '<section class="hero">',
  '  <h2>Build Something Amazing</h2>',
  '  <p>Click any element to start editing — change text, images, colors, and more in real time.</p>',
  '  <a class="cta-btn" href="#">Get Started</a>',
  '</section>',
  '<section>',
  '  <div class="gallery">',
  '    <img src="https://picsum.photos/seed/img1/400/300" alt="Gallery 1" class="gallery-item"/>',
  '    <img src="https://picsum.photos/seed/img2/400/300" alt="Gallery 2" class="gallery-item"/>',
  '    <img src="https://picsum.photos/seed/img3/400/300" alt="Gallery 3" class="gallery-item"/>',
  '  </div>',
  '</section>',
  '<section class="features">',
  '  <h2>Our Features</h2>',
  '  <div class="feature-grid">',
  '    <div class="feature-card"><h3>Fast Performance</h3><p>Built with modern standards for blazing-fast page loads.</p></div>',
  '    <div class="feature-card"><h3>Responsive Design</h3><p>Looks great on any screen size — desktop, tablet, and mobile.</p></div>',
  '    <div class="feature-card"><h3>Easy Editing</h3><p>Click any element to edit it directly. No coding required.</p></div>',
  '  </div>',
  '</section>',
  '<footer><p>© 2025 My Website. Built with Obsidian Builder.</p></footer>',
  '</body></html>'
].join('\n');

/* ─────────────────────────────────────────────────────────
   UTILITY: rgb(r,g,b) → #rrggbb
   Defined first so all functions below can call it.
───────────────────────────────────────────────────────── */
function rgbToHex(rgb) {
  if (!rgb || rgb === '') return '';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '';
  return '#' + [m[1], m[2], m[3]]
    .map(n => parseInt(n, 10).toString(16).padStart(2, '0'))
    .join('');
}

/* ─────────────────────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────────────────────── */
function setStatus(type, msg) {
  statusDot.className = 'status-dot';
  if (type === 'connected') statusDot.classList.add('connected');
  if (type === 'saving')    statusDot.classList.add('saving');
  if (type === 'error')     statusDot.classList.add('error');
  statusLabel.textContent = msg;
}

/* ─────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────────────── */
function showToast(type, message, duration = 3000) {
  const ICONS = {
    success: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  const wrap = document.getElementById('toast-container');
  const el   = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = ICONS[type] + '<span>' + message + '</span>';
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

/* ─────────────────────────────────────────────────────────
   CANVAS IMAGE COMPRESSION
   Scales image so max(w,h) ≤ maxPx then encodes as JPEG.
───────────────────────────────────────────────────────── */
function compress(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h / w * maxPx); w = maxPx; }
        else        { w = Math.round(w / h * maxPx); h = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ─────────────────────────────────────────────────────────
   IFRAME — write HTML via srcdoc, grab doc on load
───────────────────────────────────────────────────────── */
function writeToIframe(html) {
  // Clear any existing safety timer
  if (loaderTimer) clearTimeout(loaderTimer);

  frame.onload = () => {
    iframeDoc = frame.contentDocument || frame.contentWindow.document;
    if (loaderTimer) clearTimeout(loaderTimer);
    attachIframeListeners();
    iframeLoader.classList.add('hidden');
    setStatus('connected', 'Page loaded');
  };

  // srcdoc triggers onload reliably without sandbox restrictions
  frame.srcdoc = html;

  // Hard fallback: forcibly hide loader after 7s
  loaderTimer = setTimeout(() => {
    iframeLoader.classList.add('hidden');
    if (!iframeDoc) setStatus('error', 'iframe load timeout');
  }, 7000);
}

/* ─────────────────────────────────────────────────────────
   IFRAME — attach a single delegated click listener
   Called once per load; no duplicates since onload reassigns.
───────────────────────────────────────────────────────── */
function attachIframeListeners() {
  if (!iframeDoc || !iframeDoc.body) return;

  // Single delegated handler on body — no per-element listeners
  iframeDoc.body.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;

    // Skip clicks on html/body themselves
    if (target === iframeDoc.body || target === iframeDoc.documentElement) {
      deselectElement();
      return;
    }

    // Toggle selection off if clicking the same element
    if (target === selectedEl) {
      deselectElement();
      return;
    }

    clearOutline();
    selectedEl = target;
    applyOutline(selectedEl);
    renderSidebarForElement(selectedEl);
  });
}

/* ─────────────────────────────────────────────────────────
   SELECTION OUTLINE HELPERS
───────────────────────────────────────────────────────── */
function applyOutline(el) {
  if (!el) return;
  el.setAttribute('data-builder-selected', 'true');
  el.style.outline       = '2px dashed #2563EB';
  el.style.outlineOffset = '4px';
}

function clearOutline() {
  if (!selectedEl) return;
  selectedEl.style.outline       = '';
  selectedEl.style.outlineOffset = '';
  selectedEl.removeAttribute('data-builder-selected');
}

function deselectElement() {
  clearOutline();
  selectedEl = null;
  renderIdleState();
}

/* ─────────────────────────────────────────────────────────
   ELEMENT CLASSIFICATION
   FIX: added BUTTON, DT, DD, FIGCAPTION, CITE, MARK, SMALL,
        SUB, SUP, TIME so ALL text-bearing tags are editable.
───────────────────────────────────────────────────────── */
const TEXT_TAGS = new Set([
  'H1','H2','H3','H4','H5','H6',
  'P','SPAN','A','LI',
  'STRONG','EM','B','I','U','S',
  'LABEL','TD','TH','CAPTION','BLOCKQUOTE',
  'BUTTON',           // FIX: button text is now editable
  'DT','DD','FIGCAPTION',
  'CITE','MARK','SMALL','SUB','SUP','TIME',
  'LEGEND','SUMMARY'
]);

function classifyElement(el) {
  const tag = el.tagName.toUpperCase();
  // Must check gallery before gallery-item
  if (el.classList.contains('gallery'))      return 'gallery';
  if (el.closest && el.closest('.gallery'))  return 'gallery-item';
  if (tag === 'IMG')                         return 'image';
  if (TEXT_TAGS.has(tag))                    return 'text';
  return 'container';
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR — IDLE STATE
───────────────────────────────────────────────────────── */
function renderIdleState() {
  sidebar.innerHTML = `
    <div class="ctrl-card">
      <div class="ctrl-card-body">
        <div class="idle-state">
          <div class="idle-graphic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div class="idle-title">No Element Selected</div>
          <div class="idle-message">
            Click any element in the live preview to start editing its content, styles, or layout.
          </div>
        </div>
      </div>
    </div>
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon">
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="card-title">Quick Guide</div>
      </div>
      <div class="ctrl-card-body">
        <div class="text-muted" style="line-height:1.9">
          • Click <b style="color:#e2e8f0">text / buttons</b> → edit content &amp; typography<br>
          • Click <b style="color:#e2e8f0">images</b> → swap via URL or upload<br>
          • Click <b style="color:#e2e8f0">containers</b> → change background<br>
          • Click <b style="color:#e2e8f0">gallery</b> → add / remove images<br>
          • <b style="color:#2563EB">Ctrl+S</b> or Save button → push to Firebase
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR — ROUTE TO CORRECT PANEL
───────────────────────────────────────────────────────── */
function renderSidebarForElement(el) {
  const kind = classifyElement(el);
  const tag  = el.tagName.toLowerCase();
  const badge = `
    <div style="padding:0 0 6px">
      <div class="selection-badge">
        <span class="tag-dot"></span>
        &lt;${tag}&gt;&nbsp;<span style="opacity:.55;font-size:10px">${kind}</span>
      </div>
    </div>`;

  switch (kind) {
    case 'text':         sidebar.innerHTML = badge + buildTextControls(el);        break;
    case 'image':        sidebar.innerHTML = badge + buildImageControls();          break;
    case 'gallery':      sidebar.innerHTML = badge + buildGalleryControls();        break;
    case 'gallery-item': sidebar.innerHTML = badge + buildGalleryItemControls();   break;
    case 'container':    sidebar.innerHTML = badge + buildContainerControls(el);   break;
    default:             renderIdleState(); return;
  }
  bindControls(el, kind);
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR PANEL BUILDERS (return HTML strings)
───────────────────────────────────────────────────────── */

/* ── TEXT ── */
function buildTextControls(el) {
  const view   = el.ownerDocument.defaultView;
  const cs     = view ? view.getComputedStyle(el) : el.style;
  const color  = rgbToHex(el.style.color  || cs.color)  || '#000000';
  const size   = parseInt(el.style.fontSize || cs.fontSize, 10) || 16;
  const align  = el.style.textAlign || cs.textAlign || 'left';
  const isBold = (el.style.fontWeight || cs.fontWeight) === 'bold'
              || parseInt(el.style.fontWeight || cs.fontWeight, 10) >= 700;

  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
        <div class="card-title">Content</div>
      </div>
      <div class="ctrl-card-body">
        <span class="ctrl-label">Click the button to type directly in the preview</span>
        <button class="action-btn" id="ctrl-editable-toggle">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span id="editable-label">Enable Inline Editing</span>
        </button>
      </div>
    </div>

    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#2563EB" stroke="none"/></svg></div>
        <div class="card-title">Text Color</div>
      </div>
      <div class="ctrl-card-body">
        <div class="color-picker-row">
          <div class="color-swatch-wrap">
            <div class="color-swatch-preview" id="color-swatch-preview" style="background:${color}"></div>
            <input type="color" id="ctrl-color" value="${color}" aria-label="Text color picker"/>
          </div>
          <input type="text" class="color-hex-input" id="ctrl-color-hex" value="${color}" maxlength="7" placeholder="#000000" aria-label="Hex color value"/>
        </div>
      </div>
    </div>

    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg></div>
        <div class="card-title">Typography</div>
      </div>
      <div class="ctrl-card-body">

        <div class="ctrl-group">
          <span class="ctrl-label">Font Size — <span id="fs-disp">${size}px</span></span>
          <div class="slider-row">
            <input type="range" class="ctrl-slider" id="ctrl-fontsize" min="12" max="72" value="${size}" aria-label="Font size"/>
          </div>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Alignment</span>
          <div class="segment-control" role="group" aria-label="Text alignment">
            <button class="segment-btn ${align === 'left'   ? 'active' : ''}" data-align="left">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>Left
            </button>
            <button class="segment-btn ${align === 'center' ? 'active' : ''}" data-align="center">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>Center
            </button>
            <button class="segment-btn ${align === 'right'  ? 'active' : ''}" data-align="right">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>Right
            </button>
          </div>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Font Weight</span>
          <div class="toggle-row">
            <button class="toggle-btn ${!isBold ? 'active' : ''}" id="fw-regular">Regular</button>
            <button class="toggle-btn ${isBold  ? 'active' : ''}" id="fw-bold"><b>Bold</b></button>
          </div>
        </div>

      </div>
    </div>`;
}

/* ── IMAGE (standalone) ── */
function buildImageControls() {
  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        <div class="card-title">Replace Image</div>
      </div>
      <div class="ctrl-card-body">
        <div class="ctrl-group">
          <span class="ctrl-label">Paste Image URL</span>
          <div class="url-input-row">
            <input type="text" class="ctrl-input" id="ctrl-img-url" placeholder="https://example.com/photo.jpg" aria-label="Image URL"/>
            <button class="paste-btn" id="btn-paste-url" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            </button>
          </div>
          <button class="url-apply-btn" style="margin-top:5px" id="btn-apply-url">Apply URL →</button>
        </div>
        <div class="ctrl-divider"></div>
        <div class="ctrl-group">
          <span class="ctrl-label">Upload &amp; Auto-Compress</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-img-upload" aria-label="Upload image"/>
            <div class="upload-icon">🖼</div>
            <div class="upload-text"><strong>Click to browse</strong> or drag &amp; drop<br>Resized ≤ 1200px · JPEG 70%</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── GALLERY CONTAINER ── */
function buildGalleryControls() {
  return `
    <div class="ctrl-card">
      <div class="ctrl-card-header">
        <div class="card-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
        <div class="card-title">Gallery</div>
      </div>
      <div class="ctrl-card-body">
        <button class="action-btn" id="btn-add-gallery-img">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Image to Gallery
        </button>
        <span class="text-muted">Click an individual image inside the gallery to replace or delete it.</span>
      </div>
    </div>`;
}

/* ── GALLERY ITEM (img inside .gallery) ── */
function buildGalleryItemControls() {
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
            <input type="text" class="ctrl-input" id="ctrl-img-url" placeholder="https://example.com/photo.jpg" aria-label="Image URL"/>
            <button class="paste-btn" id="btn-paste-url" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            </button>
          </div>
          <button class="url-apply-btn" style="margin-top:5px" id="btn-apply-url">Apply URL →</button>
        </div>
        <div class="ctrl-divider"></div>
        <div class="ctrl-group">
          <span class="ctrl-label">Upload &amp; Compress</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-img-upload" aria-label="Upload image"/>
            <div class="upload-icon">🖼</div>
            <div class="upload-text"><strong>Click to browse</strong><br>Canvas-compressed &amp; applied</div>
          </div>
        </div>
        <div class="ctrl-divider"></div>
        <button class="action-btn danger" id="btn-delete-gallery-img">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete This Image
        </button>
      </div>
    </div>`;
}

/* ── CONTAINER (div / section / header / footer / nav) ── */
function buildContainerControls(el) {
  const bgColor  = rgbToHex(el.style.backgroundColor) || '#ffffff';
  const hasBgImg = !!(el.style.backgroundImage && el.style.backgroundImage !== 'none');
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
              <div class="color-swatch-preview" id="color-swatch-preview" style="background:${bgColor}"></div>
              <input type="color" id="ctrl-bgcolor" value="${bgColor}" aria-label="Background color"/>
            </div>
            <input type="text" class="color-hex-input" id="ctrl-bgcolor-hex" value="${bgColor}" maxlength="7" placeholder="#ffffff" aria-label="Hex background color"/>
          </div>
        </div>

        <div class="ctrl-divider"></div>

        <div class="ctrl-group">
          <span class="ctrl-label">Background Image — URL</span>
          <div class="url-input-row">
            <input type="text" class="ctrl-input" id="ctrl-bgimg-url" placeholder="https://example.com/bg.jpg" aria-label="Background image URL"/>
            <button class="paste-btn" id="btn-paste-bgurl" title="Paste from clipboard">
              <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            </button>
          </div>
          <button class="url-apply-btn" style="margin-top:5px" id="btn-apply-bgurl">Apply Background Image →</button>
        </div>

        <div class="ctrl-group">
          <span class="ctrl-label">Upload Background</span>
          <div class="file-upload-zone">
            <input type="file" accept="image/*" id="ctrl-bgimg-upload" aria-label="Upload background image"/>
            <div class="upload-icon">🎨</div>
            <div class="upload-text"><strong>Click to browse</strong><br>Canvas-compressed, applied as bg-image</div>
          </div>
        </div>

        ${hasBgImg ? `
        <button class="action-btn danger" id="btn-remove-bgimg">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
          Remove Background Image
        </button>` : ''}

      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   BIND CONTROLS
   Called once after sidebar HTML is set. All getElementById
   calls target the freshly-rendered DOM, so no stale refs.
───────────────────────────────────────────────────────── */
function bindControls(el, kind) {

  /* ── TEXT ─────────────────────────────────────────────── */
  if (kind === 'text') {

    // Inline edit toggle
    // FIX: use inner <span> label so toggling doesn't clobber the SVG icon
    const editBtn   = document.getElementById('ctrl-editable-toggle');
    const editLabel = document.getElementById('editable-label');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const isOn = el.getAttribute('contenteditable') === 'true';
        if (isOn) {
          el.removeAttribute('contenteditable');
          el.blur();
          applyOutline(el);                               // restore outline after blur
          if (editLabel) editLabel.textContent = 'Enable Inline Editing';
        } else {
          el.setAttribute('contenteditable', 'true');
          el.focus();
          if (editLabel) editLabel.textContent = '✔ Editing Active — Click to Disable';
        }
      });
    }

    // Color picker ↔ hex input — bidirectional sync
    const picker = document.getElementById('ctrl-color');
    const hexIn  = document.getElementById('ctrl-color-hex');
    const swatch = document.getElementById('color-swatch-preview');

    if (picker) {
      picker.addEventListener('input', e => {
        el.style.color = e.target.value;
        if (hexIn)  hexIn.value            = e.target.value;
        if (swatch) swatch.style.background = e.target.value;
      });
    }
    if (hexIn) {
      hexIn.addEventListener('input', e => {
        const v = e.target.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
          el.style.color = v;
          if (picker) picker.value            = v;
          if (swatch) swatch.style.background  = v;
        }
      });
    }

    // Font size slider
    const fsSlider = document.getElementById('ctrl-fontsize');
    const fsDisp   = document.getElementById('fs-disp');
    if (fsSlider) {
      fsSlider.addEventListener('input', e => {
        const v = e.target.value + 'px';
        el.style.fontSize = v;
        if (fsDisp) fsDisp.textContent = v;
      });
    }

    // Alignment segment buttons
    document.querySelectorAll('.segment-btn[data-align]').forEach(btn => {
      btn.addEventListener('click', () => {
        el.style.textAlign = btn.dataset.align;
        document.querySelectorAll('.segment-btn[data-align]')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Font weight toggle
    const fwR = document.getElementById('fw-regular');
    const fwB = document.getElementById('fw-bold');
    if (fwR) fwR.addEventListener('click', () => {
      el.style.fontWeight = 'normal';
      fwR.classList.add('active');
      if (fwB) fwB.classList.remove('active');
    });
    if (fwB) fwB.addEventListener('click', () => {
      el.style.fontWeight = 'bold';
      fwB.classList.add('active');
      if (fwR) fwR.classList.remove('active');
    });
  }

  /* ── IMAGE / GALLERY-ITEM ─────────────────────────────── */
  if (kind === 'image' || kind === 'gallery-item') {

    const urlIn    = document.getElementById('ctrl-img-url');
    const pasteBtn = document.getElementById('btn-paste-url');
    const applyBtn = document.getElementById('btn-apply-url');
    const fileIn   = document.getElementById('ctrl-img-upload');

    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (urlIn) urlIn.value = text.trim();
          showToast('info', 'Pasted from clipboard');
        } catch {
          showToast('error', 'Clipboard access denied');
        }
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const url = urlIn ? urlIn.value.trim() : '';
        if (url && el.tagName === 'IMG') {
          el.src = url;
          showToast('success', 'Image URL applied');
        } else {
          showToast('error', 'Enter a valid image URL first');
        }
      });
    }

    if (fileIn) {
      fileIn.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        compress(file, 1200, 0.7, b64 => {
          if (el.tagName === 'IMG') {
            el.src = b64;
            showToast('success', 'Image compressed & applied');
          }
        });
      });
    }

    // Gallery-item only: delete button
    if (kind === 'gallery-item') {
      const delBtn = document.getElementById('btn-delete-gallery-img');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          el.remove();
          deselectElement();
          showToast('success', 'Image removed from gallery');
        });
      }
    }
  }

  /* ── GALLERY CONTAINER ────────────────────────────────── */
  if (kind === 'gallery') {
    const addBtn = document.getElementById('btn-add-gallery-img');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const img       = iframeDoc.createElement('img');
        img.src         = 'https://picsum.photos/seed/' + Date.now() + '/400/300';
        img.className   = 'gallery-item';
        img.alt         = 'Gallery image';
        img.style.cssText = 'width:100%;height:200px;object-fit:cover;border-radius:8px;display:block';
        el.appendChild(img);
        showToast('success', 'Image added to gallery');
      });
    }
  }

  /* ── CONTAINER ────────────────────────────────────────── */
  if (kind === 'container') {

    const bgPicker = document.getElementById('ctrl-bgcolor');
    const bgHex    = document.getElementById('ctrl-bgcolor-hex');
    const bgSwatch = document.getElementById('color-swatch-preview');

    if (bgPicker) {
      bgPicker.addEventListener('input', e => {
        el.style.backgroundColor = e.target.value;
        if (bgHex)    bgHex.value            = e.target.value;
        if (bgSwatch) bgSwatch.style.background = e.target.value;
      });
    }
    if (bgHex) {
      bgHex.addEventListener('input', e => {
        const v = e.target.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
          el.style.backgroundColor = v;
          if (bgPicker) bgPicker.value            = v;
          if (bgSwatch) bgSwatch.style.background  = v;
        }
      });
    }

    const bgImgUrl = document.getElementById('ctrl-bgimg-url');
    const bgPaste  = document.getElementById('btn-paste-bgurl');
    const bgApply  = document.getElementById('btn-apply-bgurl');
    const bgFile   = document.getElementById('ctrl-bgimg-upload');
    const bgRemove = document.getElementById('btn-remove-bgimg');

    function applyBgImage(src) {
      el.style.backgroundImage    = "url('" + src + "')";
      el.style.backgroundSize     = 'cover';
      el.style.backgroundPosition = 'center';
    }

    if (bgPaste) {
      bgPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (bgImgUrl) bgImgUrl.value = text.trim();
          showToast('info', 'Pasted from clipboard');
        } catch {
          showToast('error', 'Clipboard access denied');
        }
      });
    }

    if (bgApply) {
      bgApply.addEventListener('click', () => {
        const url = bgImgUrl ? bgImgUrl.value.trim() : '';
        if (url) { applyBgImage(url); showToast('success', 'Background image applied'); }
        else       showToast('error', 'Enter a valid image URL first');
      });
    }

    if (bgFile) {
      bgFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        compress(file, 1200, 0.7, b64 => {
          applyBgImage(b64);
          showToast('success', 'Background image applied');
        });
      });
    }

    if (bgRemove) {
      bgRemove.addEventListener('click', () => {
        el.style.backgroundImage = 'none';
        showToast('success', 'Background image removed');
        renderSidebarForElement(el);   // re-render to hide the remove button
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────
   SAVE TO FIREBASE
   Clones the iframe DOM, scrubs all builder artefacts
   (outlines, contenteditable, data attrs), then pushes
   clean HTML to Realtime Database.
───────────────────────────────────────────────────────── */
async function saveToDatabase() {
  if (!iframeDoc) { showToast('error', 'No page loaded yet'); return; }

  btnSave.classList.add('saving');
  btnSaveText.textContent = 'Saving…';
  setStatus('saving', 'Pushing to Firebase…');

  try {
    const clone = iframeDoc.documentElement.cloneNode(true);

    // Strip all builder artefacts from clone
    clone.querySelectorAll('*').forEach(node => {
      node.removeAttribute('contenteditable');
      node.removeAttribute('data-builder-selected');
      if (node.style) {
        if (node.style.outline       && node.style.outline.includes('#2563EB'))
          node.style.outline = '';
        if (node.style.outlineOffset && node.style.outlineOffset)
          node.style.outlineOffset = '';
      }
    });

    const cleanHTML = '<!DOCTYPE html>\n' + clone.outerHTML;
    await set(ref(db, 'pages/' + PAGE_ID + '/htmlCode'), cleanHTML);

    btnSave.classList.remove('saving');
    btnSave.classList.add('saved');
    btnSaveText.textContent = '✔ Saved!';
    setStatus('connected', 'Saved to Firebase ✔');
    showToast('success', 'Page saved to database');

    setTimeout(() => {
      btnSave.classList.remove('saved');
      btnSaveText.textContent = 'Save Changes';
    }, 2500);

  } catch (err) {
    console.error('Save error:', err);
    btnSave.classList.remove('saving');
    btnSaveText.textContent = 'Save Changes';
    setStatus('error', 'Save failed');
    showToast('error', 'Save failed: ' + (err.message || 'Unknown error'));
  }
}

/* ─────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS — single listener, no duplicates
───────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveToDatabase();
  }
  if (e.key === 'Escape' && selectedEl) {
    deselectElement();
  }
});

/* Save button click — wired once here */
btnSave.addEventListener('click', saveToDatabase);

/* ─────────────────────────────────────────────────────────
   BOOT — fetch from Firebase (or seed fallback) then render
───────────────────────────────────────────────────────── */
async function initBuilder() {
  setStatus('idle', 'Connecting to Firebase…');
  renderIdleState();

  try {
    const snap = await get(ref(db, 'pages/' + PAGE_ID + '/htmlCode'));

    if (snap.exists()) {
      writeToIframe(snap.val());
      showToast('success', 'Page loaded from database');
    } else {
      // First run: seed the fallback template so DB is never empty
      writeToIframe(FALLBACK_HTML);
      await set(ref(db, 'pages/' + PAGE_ID + '/htmlCode'), FALLBACK_HTML);
      showToast('info', 'Default template loaded & saved to DB');
    }
  } catch (err) {
    console.error('Firebase load error:', err);
    // Degrade gracefully — show fallback so the editor is still usable
    writeToIframe(FALLBACK_HTML);
    setStatus('error', 'DB error — offline mode');
    showToast('error', 'Could not reach Firebase — using fallback template');
  }
}

initBuilder();
