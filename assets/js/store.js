/* =====================================================
   TASTY CATERING SERVICE — FIRESTORE DATA LAYER
   ===================================================== */

const DEFAULT_SETTINGS = {
  businessName: 'Tasty Catering Service',
  slogan: 'Taste the Celebration',
  location: 'Busega, Uganda',
  phone: '0759614716',
  whatsapp: '256759614716',
  email: 'drakewanswa@gmail.com',
  address: '[Your physical address - Busega]',
  tiktok: 'https://tiktok.com/@[placeholder]',
  instagram: 'https://instagram.com/[placeholder]',
  facebook: 'https://facebook.com/[placeholder]',
  about: 'Tasty Catering Service is a professional catering company based in Busega, dedicated to making every event unforgettable.',
  formspreeId: 'xrpbqaap'
};

const Store = {
  KEYS: {
    services:     'services',
    gallery:      'gallery',
    posts:        'posts',
    testimonials: 'testimonials',
    bookings:     'bookings',
    settings:     'settings'
  },

  /* ---------- SETTINGS (single document) ---------- */
  async getSettings({ seedIfMissing = false } = {}) {
    if (!db) return { ...DEFAULT_SETTINGS };

    const doc = await db.collection('site').doc('settings').get();
    if (!doc.exists) {
      if (seedIfMissing) {
        await db.collection('site').doc('settings').set(DEFAULT_SETTINGS);
      }
      return { ...DEFAULT_SETTINGS };
    }
    return doc.data();
  },

  async saveSettings(data) {
    if (!db) {
      throw new Error('Firebase Firestore is not configured yet. Add your Firebase config to save settings.');
    }
    await db.collection('site').doc('settings').set(data, { merge: true });
  },

  /* ---------- GENERIC COLLECTION HELPERS ---------- */
  async list(collectionName) {
    if (!db) return [];
    const snap = await db.collection(collectionName).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((first, second) => {
        const firstTime = first.createdAt?.toMillis?.() || Date.parse(first.receivedAt || '') || 0;
        const secondTime = second.createdAt?.toMillis?.() || Date.parse(second.receivedAt || '') || 0;
        return secondTime - firstTime;
      });
  },

  async add(collectionName, data) {
    if (!db) {
      throw new Error('Firebase Firestore is not configured yet. Add your Firebase config before uploading gallery items.');
    }

    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(collectionName).add(data);
    return ref.id;
  },

  async update(collectionName, id, data) {
    if (!db) {
      throw new Error('Firebase Firestore is not configured yet.');
    }
    await db.collection(collectionName).doc(id).update(data);
  },

  async remove(collectionName, id) {
    if (!db) {
      throw new Error('Firebase Firestore is not configured yet.');
    }
    await db.collection(collectionName).doc(id).delete();
  },

  /* ---------- FILE UPLOAD TO STORAGE ---------- */
  async uploadFile(file, folder = 'uploads') {
    if (!storage) {
      throw new Error('Firebase storage is not configured. Add your Firebase project config first.');
    }

    const path = `${folder}/${Date.now()}_${file.name}`;
    const ref = storage.ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  },

  /* ---------- SEED DEMO DATA (only if collections empty) ---------- */
  async seedDemoData() {
    if (!db) return;

    const svcSnap = await db.collection('services').limit(1).get();
    if (svcSnap.empty) {
      const demo = [
        { title: 'Wedding Catering', price: 'From UGX [placeholder]', description: 'Elegant full-service wedding catering tailored to your theme and guest count.', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800' },
        { title: 'Corporate Events', price: 'From UGX [placeholder]', description: 'Professional catering for conferences, launches, seminars and office parties.', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800' },
        { title: 'Burial & Funeral Catering', price: 'From UGX [placeholder]', description: 'Respectful, timely and comforting catering for memorial gatherings.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
        { title: 'Parties & Celebrations', price: 'From UGX [placeholder]', description: 'Birthdays, graduations, baby showers — we make every party delicious.', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800' },
        { title: 'All Ceremonies', price: 'Custom Quote', description: 'Introductions, thanksgivings, cultural ceremonies — any event, any size.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800' }
      ];
      for (const s of demo) await this.add('services', s);
    }
  }
};