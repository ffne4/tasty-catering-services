/* =====================================================
   TASTY CATERING — ADMIN PANEL (Firebase Auth + Firestore + Cloudinary)
   ===================================================== */

let CURRENT_SETTINGS = {};

/* ---------- CLOUDINARY CONFIGURATION ---------- */
const CLOUDINARY_CLOUD_NAME = 'cb0ifa9n';
const CLOUDINARY_UPLOAD_PRESET = 'x3dioeud';

function isFirebaseAuthReady() {
  return !!auth && typeof auth.onAuthStateChanged === 'function' && typeof auth.signInWithEmailAndPassword === 'function';
}

function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = ok ? '#28a745' : '#dc3545';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function getAdminErrorMessage(err) {
  if (err?.code === 'permission-denied' || err?.code === 'firestore/permission-denied') {
    return 'Firebase denied the database write. Sign in with the Firebase admin account and allow authenticated admin writes in Firestore rules.';
  }
  return err?.message || 'Unknown error';
}

window.logout = async function () {
  localStorage.removeItem('tasty_admin_authed');
  if (isFirebaseAuthReady()) {
    await auth.signOut();
  }

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  if (loginScreen) loginScreen.style.display = 'flex';
  if (dashboard) dashboard.style.display = 'none';
};

/* ---------- AUTH FLOW ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');

  if (sessionStorage.getItem('tasty_admin_entry_unlocked') !== '1') {
    if (loginScreen) loginScreen.innerHTML = '<div class="admin-login-box"><h2>Page unavailable</h2><p class="sub">This page is not available at this address.</p></div>';
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    return;
  }
  sessionStorage.removeItem('tasty_admin_entry_unlocked');

  if (isFirebaseAuthReady()) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        localStorage.setItem('tasty_admin_authed', '1');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'grid';
        await initAdmin();
        return;
      }

      localStorage.removeItem('tasty_admin_authed');
      if (loginScreen) loginScreen.style.display = 'flex';
      if (dashboard) dashboard.style.display = 'none';
      bindLoginForm();
    });
  } else {
    if (localStorage.getItem('tasty_admin_authed') === '1') {
      if (loginScreen) loginScreen.style.display = 'none';
      if (dashboard) dashboard.style.display = 'grid';
      await initAdmin();
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
      if (dashboard) dashboard.style.display = 'none';
      bindLoginForm();
    }
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.logout();
  });
});

function bindLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form || form.dataset.bound === 'yes') return;
  form.dataset.bound = 'yes';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('adminEmail');
    const passEl = document.getElementById('adminPass');
    const email = emailEl ? emailEl.value.trim() : 'admin@tastycatering.local';
    const pass = passEl ? passEl.value : '';
    const err = document.getElementById('loginError');
    err.style.display = 'none';

    if (isFirebaseAuthReady()) {
      if (!email || !email.includes('@')) {
        err.textContent = 'Enter your Firebase admin email to sign in.';
        err.style.display = 'block';
        return;
      }

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        localStorage.setItem('tasty_admin_authed', '1');
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'grid';
        await initAdmin();
        return;
      } catch (ex) {
        err.textContent = 'Login failed: ' + ex.message;
        err.style.display = 'block';
        return;
      }
    }

    err.textContent = 'Firebase Auth is not configured. Contact the site administrator.';
    err.style.display = 'block';
  });
}

/* ---------- PANEL NAVIGATION ---------- */
function switchPanel(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.querySelector(`.admin-nav a[data-panel="${name}"]`)?.classList.add('active');
  const titles = { dashboard:'Dashboard', settings:'Site Settings', services:'Services & Menu',
    gallery:'Gallery', blog:'Blog', testimonials:'Testimonials', bookings:'Bookings Inbox' };
  document.getElementById('pageTitle').textContent = titles[name] || 'Admin';
  renderAllLists();
}

/* ---------- INIT AFTER LOGIN ---------- */
async function initAdmin() {
  try {
    CURRENT_SETTINGS = (await Store.getSettings({ seedIfMissing: true })) || {};
    await Store.seedDemoData();
  } catch (err) {
    console.error('Failed to initialize admin data:', err);
    toast('Some admin data could not be loaded. Check Firebase permissions.', false);
  } finally {
    renderSettingsForm();
    renderAllLists();
    bindForms();
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

/* ---------- SETTINGS FORM ---------- */
function renderSettingsForm() {
  const map = {
    set_businessName: 'businessName', set_slogan: 'slogan', set_location: 'location',
    set_phone: 'phone', set_whatsapp: 'whatsapp', set_email: 'email', set_address: 'address',
    set_tiktok: 'tiktok', set_instagram: 'instagram', set_facebook: 'facebook',
    set_formspreeId: 'formspreeId', set_about: 'about'
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = CURRENT_SETTINGS[key] || '';
  });
}

/* ---------- FILE UPLOAD TO CLOUDINARY ---------- */
async function uploadToCloudinary(file, folder = 'tasty-catering') {
  if (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET') {
    throw new Error('Please configure your Cloudinary Cloud Name and Upload Preset in admin.js');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url; // This is the public CDN URL for the uploaded file
}

/* ---------- BIND FORMS ---------- */
function bindForms() {
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm && settingsForm.dataset.bound !== 'yes') {
    settingsForm.dataset.bound = 'yes';
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = { ...CURRENT_SETTINGS };
        const fields = ['businessName','slogan','location','phone','whatsapp','email','address',
                        'tiktok','instagram','facebook','formspreeId','about'];
        fields.forEach(k => {
          const el = document.getElementById('set_' + k);
          if (el) data[k] = el.value;
        });
        await Store.saveSettings(data);
        CURRENT_SETTINGS = data;
        toast('Settings saved ✓');
      } catch (err) {
        toast(err.message || 'Could not save settings', false);
      }
    });
  }

  const serviceForm = document.getElementById('serviceForm');
  if (serviceForm && serviceForm.dataset.bound !== 'yes') {
    serviceForm.dataset.bound = 'yes';
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const file = f.serviceImage.files[0];
      let image = (f.serviceImageUrl.value || '').trim();

      try {
        if (file) {
          toast('Uploading image to Cloudinary...');
          image = await uploadToCloudinary(file, 'services');
        }
        if (!image) image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';

        const payload = {
          title: f.serviceTitle.value,
          price: f.servicePrice.value,
          description: f.serviceDesc.value,
          image
        };
        if (f.dataset.editing) {
          await Store.update('services', f.dataset.editing, payload);
        } else {
          await Store.add('services', payload);
        }
        f.reset();
        delete f.dataset.editing;
        const saveBtn = f.querySelector('.save-btn');
        if (saveBtn) saveBtn.textContent = 'Add Service';
        renderAllLists();
        toast('Service saved ✓');
      } catch (err) {
        toast('Could not save service: ' + getAdminErrorMessage(err), false);
      }
    });
  }

  const galleryForm = document.getElementById('galleryForm');
  if (galleryForm && galleryForm.dataset.bound !== 'yes') {
    galleryForm.dataset.bound = 'yes';
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const file = f.galleryFile.files[0];
      const url = (f.galleryUrl.value || '').trim();
      const type = f.galleryType.value;
      let src = url;

      try {
        if (file) {
          toast('Uploading media to Cloudinary...');
          src = await uploadToCloudinary(file, 'gallery');
        }
        if (!src) return toast('Please upload a file or paste a URL', false);
        await Store.add('gallery', { type, src, caption: f.galleryCaption.value });
        f.reset();
        renderAllLists();
        toast('Added to gallery ✓');
      } catch (err) {
        toast('Could not save gallery item: ' + getAdminErrorMessage(err), false);
      }
    });
  }

  const blogForm = document.getElementById('blogForm');
  if (blogForm && blogForm.dataset.bound !== 'yes') {
    blogForm.dataset.bound = 'yes';
    blogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const file = f.postImage.files[0];
      let image = (f.postImageUrl.value || '').trim();

      try {
        if (file) {
          toast('Uploading image to Cloudinary...');
          image = await uploadToCloudinary(file, 'blog');
        }
        if (!image) image = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800';

        const payload = {
          title: f.postTitle.value,
          date: f.postDate.value || new Date().toISOString().slice(0,10),
          excerpt: f.postExcerpt.value,
          body: f.postBody.value,
          image
        };
        if (f.dataset.editing) {
          await Store.update('posts', f.dataset.editing, payload);
        } else {
          await Store.add('posts', payload);
        }
        const wasEditing = Boolean(f.dataset.editing);
        f.reset();
        delete f.dataset.editing;
        const saveBtn = f.querySelector('.save-btn');
        if (saveBtn) saveBtn.textContent = 'Publish Post';
        renderAllLists();
        toast(wasEditing ? 'Post updated ✓' : 'Post published ✓');
      } catch (err) {
        toast('Could not publish post: ' + getAdminErrorMessage(err), false);
      }
    });
  }

  const testimonialForm = document.getElementById('testimonialForm');
  if (testimonialForm && testimonialForm.dataset.bound !== 'yes') {
    testimonialForm.dataset.bound = 'yes';
    testimonialForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const f = e.target;
        const file = f.tImage.files[0];
        let image = (f.tImageUrl.value || '').trim();
        if (file) {
          toast('Uploading testimonial photo to Cloudinary...');
          image = await uploadToCloudinary(file, 'testimonials');
        }
        await Store.add('testimonials', {
          name: f.tName.value,
          event: f.tEvent.value,
          rating: parseInt(f.tRating.value) || 5,
          message: f.tMessage.value,
          image
        });
        f.reset();
        renderAllLists();
        toast('Testimonial added ✓');
      } catch (err) {
        toast('Error: ' + err.message, false);
      }
    });
  }
}

/* ---------- LIST RENDERING ---------- */
async function renderAllLists() {
  try {
  // Services
  const sEl = document.getElementById('adminServicesList');
  if (sEl) {
    const items = await Store.list('services');
    sEl.innerHTML = items.map(s => `
      <div class="admin-list-item">
        <img src="${escapeHtml(s.image)}" alt="">
        <div class="info"><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.price)}</small></div>
        <button class="danger-btn" style="background:#0d6efd;" onclick="editService('${escapeHtml(s.id)}')">Edit</button>
        <button class="danger-btn" onclick="deleteItem('services','${escapeHtml(s.id)}')">Delete</button>
      </div>`).join('') || '<p style="color:#888;">No services yet.</p>';
  }

  // Gallery
  const gEl = document.getElementById('adminGalleryList');
  if (gEl) {
    const items = await Store.list('gallery');
    gEl.innerHTML = items.map(item => `
      <div class="admin-list-item">
        ${item.type === 'video'
          ? `<video src="${escapeHtml(item.src)}" muted></video>`
          : `<img src="${escapeHtml(item.src)}">`}
        <div class="info"><b>${escapeHtml(item.type).toUpperCase()}</b><small>${escapeHtml(item.caption || '(no caption)')}</small></div>
        <button class="danger-btn" onclick="deleteItem('gallery','${escapeHtml(item.id)}')">Delete</button>
      </div>`).join('') || '<p style="color:#888;">Gallery empty.</p>';
  }

  // Blog
  const bEl = document.getElementById('adminBlogList');
  if (bEl) {
    const items = await Store.list('posts');
    bEl.innerHTML = items.map(p => `
      <div class="admin-list-item">
        <img src="${escapeHtml(p.image)}">
        <div class="info"><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.date)}</small></div>
        <button class="danger-btn" style="background:#0d6efd;" onclick="editBlog('${escapeHtml(p.id)}')">Edit</button>
        <button class="danger-btn" onclick="deleteItem('posts','${escapeHtml(p.id)}')">Delete</button>
      </div>`).join('') || '<p style="color:#888;">No posts yet.</p>';
  }

  // Testimonials
  const tEl = document.getElementById('adminTestimonialsList');
  if (tEl) {
    const items = await Store.list('testimonials');
    tEl.innerHTML = items.map(x => `
      <div class="admin-list-item">
        ${x.image ? `<img src="${escapeHtml(x.image)}" alt="">` : ''}
        <div class="info">
          <b>${escapeHtml(x.name || 'Anonymous')} — ${escapeHtml(x.event || 'General')}</b>
          <small>${'★'.repeat(Number(x.rating) || 5)} ${escapeHtml((x.message || '').slice(0,80))}...</small>
        </div>
        <button class="danger-btn" onclick="deleteItem('testimonials','${escapeHtml(x.id)}')">Delete</button>
      </div>`).join('') || '<p style="color:#888;">No testimonials yet.</p>';
  }

  // Bookings
  const bkEl = document.getElementById('adminBookingsList');
  if (bkEl) {
    const items = await Store.list('bookings');
    bkEl.innerHTML = items.map(x => `
      <div class="admin-list-item" style="align-items:flex-start;">
        <div class="info">
          <b>${escapeHtml(x.name || 'Unknown')} — ${escapeHtml(x.event || 'Enquiry')}</b>
          <small>📧 ${escapeHtml(x.email || '-')} | 📞 ${escapeHtml(x.phone || '-')} | 📅 ${escapeHtml(x.date || '-')} | 👥 ${escapeHtml(x.guests || '-')}</small>
          <p style="margin-top:6px;color:#555;font-size:.9rem;">${escapeHtml(x.message)}</p>
        </div>
        <button class="danger-btn" onclick="deleteBooking('${escapeHtml(x.id)}')">Delete</button>
      </div>`).join('') || '<p style="color:#888;">No bookings yet.</p>';
  }
  } catch (err) {
    console.error('Failed to render admin lists:', err);
    toast('Could not load one or more admin lists. Check Firebase permissions.', false);
  }
}

/* ---------- DELETE / EDIT ---------- */
async function deleteItem(collection, id) {
  if (!confirm('Delete this item?')) return;
  try {
    await Store.remove(collection, id);
    await renderAllLists();
    toast('Deleted');
  } catch (err) {
    toast(err.message || 'Could not delete item', false);
  }
}
async function deleteBooking(id) {
  if (!confirm('Delete this booking?')) return;
  try {
    await Store.remove('bookings', id);
    await renderAllLists();
    toast('Booking removed');
  } catch (err) {
    toast(err.message || 'Could not delete booking', false);
  }
}
async function editService(id) {
  if (!db) {
    toast('Firebase Firestore is not configured yet.', false);
    return;
  }

  const doc = await db.collection('services').doc(id).get();
  if (!doc.exists) return;
  const s = doc.data();
  const f = document.getElementById('serviceForm');
  if (!f) return;

  f.serviceTitle.value = s.title || '';
  f.servicePrice.value = s.price || '';
  f.serviceDesc.value = s.description || '';
  f.serviceImageUrl.value = s.image && s.image.startsWith('data:') ? '' : (s.image || '');
  f.dataset.editing = id;
  const saveBtn = f.querySelector('.save-btn');
  if (saveBtn) saveBtn.textContent = 'Update Service';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function editBlog(id) {
  if (!db) {
    toast('Firebase Firestore is not configured yet.', false);
    return;
  }

  try {
    const doc = await db.collection('posts').doc(id).get();
    if (!doc.exists) {
      toast('This blog post no longer exists.', false);
      return;
    }

    const post = doc.data();
    const form = document.getElementById('blogForm');
    if (!form) return;
    form.postTitle.value = post.title || '';
    form.postDate.value = post.date || '';
    form.postExcerpt.value = post.excerpt || '';
    form.postBody.value = post.body || '';
    form.postImageUrl.value = post.image || '';
    form.postImage.value = '';
    form.dataset.editing = id;
    const saveBtn = form.querySelector('.save-btn');
    if (saveBtn) saveBtn.textContent = 'Update Post';
    switchPanel('blog');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    toast('Could not load blog post: ' + getAdminErrorMessage(err), false);
  }
}