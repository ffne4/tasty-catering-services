/* =====================================================
   TASTY CATERING — PUBLIC SITE LOGIC (Firestore)
   ===================================================== */

let SETTINGS = {};
const BOOKING_FORMSPREE_ID = 'xrpbqaap';
const CLOUDINARY_CLOUD_NAME = 'cb0ifa9n';
const CLOUDINARY_UPLOAD_PRESET = 'x3dioeud';

function isFirestoreReady() {
  return !!db && typeof db.collection === 'function';
}

function renderUnavailable(el, sectionName) {
  if (!el) return;
  el.innerHTML = `<p style="text-align:center;color:#888;">${sectionName} is unavailable right now. Check your Firebase setup and Firestore rules.</p>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function showSiteError(message) {
  const existing = document.getElementById('siteError');
  if (existing) return;
  const error = document.createElement('div');
  error.id = 'siteError';
  error.setAttribute('role', 'alert');
  error.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 20px;background:#fff3cd;color:#664d03;text-align:center;font-size:.9rem;box-shadow:0 2px 8px rgba(0,0,0,.15);';
  error.textContent = message;
  document.body.prepend(error);
}

/* ---------- NAVBAR ---------- */
const nav = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 50));
hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));

/* ---------- SCROLL REVEAL ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

function observeReveals(root = document) {
  root.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initSecretAdminPath() {
  const logo = document.querySelector('[data-admin-trigger]');
  if (!logo) return;

  let taps = 0;
  let resetTimer;
  logo.addEventListener('click', event => {
    event.preventDefault();
    taps += 1;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { taps = 0; }, 1800);

    if (taps === 5) {
      sessionStorage.setItem('tasty_admin_entry_unlocked', '1');
      window.location.href = 'admin.html';
    }
  });
}

function initBackgroundVideos() {
  document.querySelectorAll('[data-background-video]').forEach(video => {
    const sources = [
      'assets/videos/home-kitchen.mp4',
      'assets/videos/home-catering.mp4'
    ];
    let current = 0;

    const playCurrentVideo = () => {
      video.src = sources[current];
      video.load();
      video.play().catch(() => {});
    };

    video.addEventListener('ended', () => {
      current = (current + 1) % sources.length;
      playCurrentVideo();
    });
    video.addEventListener('error', () => {
      if (current < sources.length - 1) {
        current += 1;
        playCurrentVideo();
      }
    }, { once: true });
    playCurrentVideo();
  });
}

/* ---------- APPLY SETTINGS ACROSS SITE ---------- */
function applySettings() {
  document.querySelectorAll('[data-setting]').forEach(el => {
    const key = el.dataset.setting;
    if (SETTINGS[key] !== undefined) el.textContent = SETTINGS[key];
  });
  document.querySelectorAll('[data-setting-href]').forEach(el => {
    const key = el.dataset.settingHref;
    if (SETTINGS[key]) el.href = SETTINGS[key];
  });
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    el.href = `https://wa.me/${SETTINGS.whatsapp}?text=Hello%20Tasty%20Catering%20Service%2C%20I%27d%20like%20to%20make%20an%20enquiry`;
  });
  document.querySelectorAll('[data-tel]').forEach(el => el.href = `tel:${SETTINGS.phone}`);
  document.querySelectorAll('[data-email]').forEach(el => el.href = `mailto:${SETTINGS.email}`);
}

/* ---------- RENDER HELPERS ---------- */
function renderServices(targetId, limit) {
  const el = document.getElementById(targetId);
  if (!el) return;

  if (!isFirestoreReady()) {
    renderUnavailable(el, 'Services');
    return;
  }

  db.collection('services').orderBy('createdAt', 'desc').get().then(snap => {
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const seen = new Set();
    items = items.filter(service => {
      const key = [service.title, service.price, service.description, service.image]
        .map(value => String(value ?? '').trim().toLowerCase())
        .join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (limit) items = items.slice(0, limit);
    el.innerHTML = items.map((s, i) => `
      <div class="card reveal" style="transition-delay:${i * 0.08}s">
        <img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.title)}" loading="lazy">
        <div class="card-body">
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>
          <div class="card-price">${escapeHtml(s.price)}</div>
        </div>
      </div>`).join('') || '<p style="text-align:center;color:#888;">No services yet.</p>';
    observeReveals(el);
  }).catch(err => {
    console.error('Failed to load services:', err);
    renderUnavailable(el, 'Services');
  });
}

function renderGallery(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  if (!isFirestoreReady()) {
    renderUnavailable(el, 'Gallery');
    return;
  }

  db.collection('gallery').orderBy('createdAt', 'desc').get().then(snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    el.innerHTML = items.map(item => `
      <div class="gallery-item" data-lightbox-type="${escapeHtml(item.type)}" data-lightbox-src="${escapeHtml(item.src)}">
        ${item.type === 'video'
          ? `<video src="${escapeHtml(item.src)}" muted></video>`
          : `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.caption)}" loading="lazy">`}
      </div>`).join('') || '<p style="text-align:center;color:#888;">No media yet.</p>';
    el.querySelectorAll('[data-lightbox-src]').forEach(item => {
      item.addEventListener('click', () => openLightbox(item.dataset.lightboxType, item.dataset.lightboxSrc));
    });
  }).catch(err => {
    console.error('Failed to load gallery:', err);
    renderUnavailable(el, 'Gallery');
  });
}

function renderTestimonials(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  if (!isFirestoreReady()) {
    renderUnavailable(el, 'Testimonials');
    return;
  }

  db.collection('testimonials').orderBy('createdAt', 'desc').get().then(snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    el.innerHTML = items.map((t, i) => `
      <div class="testimonial reveal" style="transition-delay:${i * 0.1}s">
        ${t.image ? `<img class="testimonial-image" src="${escapeHtml(t.image)}" alt="${escapeHtml(t.name || 'Client photo')}" loading="lazy">` : ''}
        <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
        <p>"${escapeHtml(t.message)}"</p>
        <h4>${escapeHtml(t.name)}</h4>
        <span>${escapeHtml(t.event)}</span>
      </div>`).join('') || '<p style="text-align:center;color:#888;">No testimonials yet.</p>';
    observeReveals(el);
  }).catch(err => {
    console.error('Failed to load testimonials:', err);
    renderUnavailable(el, 'Testimonials');
  });
}

function renderBlog(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  if (!isFirestoreReady()) {
    renderUnavailable(el, 'Blog');
    return;
  }

  db.collection('posts').orderBy('createdAt', 'desc').get().then(snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    el.innerHTML = items.map((p, i) => `
      <article class="card blog-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="blog-image-wrap">
          <img class="blog-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">
        </div>
        <div class="card-body">
          <small style="color:var(--gold);font-weight:600;">${escapeHtml(p.date)}</small>
          <h3 style="margin-top:6px;">${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.excerpt)}</p>
          ${p.body ? `<div class="blog-body">${escapeHtml(p.body)}</div>` : ''}
        </div>
      </article>`).join('') || '<p style="text-align:center;color:#888;">No posts yet.</p>';
    observeReveals(el);
  }).catch(err => {
    console.error('Failed to load posts:', err);
    renderUnavailable(el, 'Blog');
  });
}

async function uploadPublicTestimonialPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'testimonials');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Photo upload failed');
  const result = await response.json();
  return result.secure_url;
}

function initPublicTestimonialForm() {
  const form = document.getElementById('publicTestimonialForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = form.querySelector('.form-msg');
    const file = form.image.files[0];
    let image = '';

    try {
      if (file) {
        message.className = 'form-msg success';
        message.textContent = 'Uploading your photo...';
        message.style.display = 'block';
        image = await uploadPublicTestimonialPhoto(file);
      }
      await Store.add('testimonials', {
        name: form.name.value.trim(),
        event: form.event.value.trim(),
        rating: Number(form.rating.value),
        message: form.message.value.trim(),
        image
      });
      message.className = 'form-msg success';
      message.textContent = 'Thank you! Your testimonial has been published.';
      message.style.display = 'block';
      form.reset();
      renderTestimonials('testimonialsFull');
    } catch (error) {
      console.error('Failed to submit testimonial:', error);
      message.className = 'form-msg error';
      message.textContent = 'Could not submit your testimonial. Please try again later.';
      message.style.display = 'block';
    }
  });
}

/* ---------- LIGHTBOX ---------- */
function openLightbox(type, src) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.innerHTML = `
    <span class="lightbox-close" role="button" tabindex="0">&times;</span>
    ${type === 'video' ? `<video src="${escapeHtml(src)}" controls autoplay></video>` : `<img src="${escapeHtml(src)}">`}`;
  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lb.classList.add('open');
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) { lb.classList.remove('open'); lb.innerHTML = ''; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ---------- BOOKING FORM ---------- */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.form-msg');
    const data = Object.fromEntries(new FormData(form));

    let firestoreSaved = false;
    let emailSent = false;

    try {
      await Store.add('bookings', { ...data, receivedAt: new Date().toISOString() });
      firestoreSaved = true;
    } catch (err) {
      console.error('Failed to save booking to Firestore:', err);
    }

    const formspreeId = SETTINGS.formspreeId && SETTINGS.formspreeId !== 'YOUR_FORMSPREE_ID'
      ? SETTINGS.formspreeId : BOOKING_FORMSPREE_ID;

    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      emailSent = response.ok;
      if (!response.ok) console.error('Formspree rejected booking:', response.status);
    } catch (err) {
      console.error('Failed to send booking through Formspree:', err);
    }

    if (!firestoreSaved && !emailSent) {
      msg.className = 'form-msg error';
      msg.textContent = 'Could not send your enquiry right now. Please try WhatsApp instead.';
      msg.style.display = 'block';
      return;
    }

    msg.className = 'form-msg success';
    msg.textContent = firestoreSaved && emailSent
      ? 'Thank you! Your booking enquiry has been received. We will contact you shortly.'
      : firestoreSaved
        ? 'Your enquiry was saved. We will contact you shortly.'
        : 'Your enquiry was emailed successfully. Please note: it could not be added to our admin inbox.';
    msg.style.display = 'block';
    form.reset();
    setTimeout(() => { msg.style.display = 'none'; }, 6000);
  });
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  initSecretAdminPath();
  initBookingForm();
  initPublicTestimonialForm();
  initBackgroundVideos();
  observeReveals();
  try {
    SETTINGS = await Store.getSettings();
  } catch (err) {
    console.error('Failed to load site settings:', err);
    SETTINGS = {};
    showSiteError('Some site settings are temporarily unavailable. You can still browse and submit an enquiry.');
  }
  applySettings();
  renderServices('servicesHome', 3);
  renderServices('servicesFull');
  renderGallery('galleryHome');
  renderGallery('galleryFull');
  renderTestimonials('testimonialsHome');
  renderTestimonials('testimonialsFull');
  renderBlog('blogFull');
});