// IndexedDB storage helper for customer review images
// Solves browser localStorage 5MB quota limit (IndexedDB provides 500MB+ storage)

const DB_NAME = 'AgadhiReviewImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'dynamic_reviews';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const REMOVED_REVIEW_IDS = new Set([
  '6af57aecd99a2552afd0b003'
]);

// Clean stale broken paths (e.g. older /review/PHOTO-ADMIN-... files that do not exist on static hosting)
export const isBrokenReviewUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  if (url.includes('PHOTO-ADMIN-')) return true;
  return false;
};

export const isRemovedOrBrokenReview = (itemOrUrl) => {
  if (!itemOrUrl) return true;
  if (typeof itemOrUrl === 'string') {
    return isBrokenReviewUrl(itemOrUrl);
  }
  if (itemOrUrl._id && REMOVED_REVIEW_IDS.has(String(itemOrUrl._id))) return true;
  if (itemOrUrl.title === 'WhatsApp Image 2026-11-11 at 6.28.24 PM (3)') return true;
  if (isBrokenReviewUrl(itemOrUrl.url)) return true;
  return false;
};

// Retrieve all stored dynamic review images
export async function getDynamicReviews() {
  // Purge any stale broken or removed records from localStorage
  try {
    const rawLocal = localStorage.getItem('dynamicReviewImages');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      const cleaned = parsed.filter(item => !isRemovedOrBrokenReview(item));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('dynamicReviewImages', JSON.stringify(cleaned));
      }
    }
  } catch (e) {}

  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    const items = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    const validItems = items.filter(item => !isRemovedOrBrokenReview(item));
    if (validItems.length > 0) {
      return validItems;
    }
  } catch (err) {
    console.warn('IndexedDB read notice:', err);
  }

  // 2. Fallback to localStorage if IndexedDB is empty or not available
  try {
    const raw = localStorage.getItem('dynamicReviewImages');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed
        .map(i => (typeof i === 'string' ? { _id: i, url: i, title: 'Customer Transformation', isDefault: false } : i))
        .filter(i => !isRemovedOrBrokenReview(i));
    }
  } catch (e) {}

  return [];
}

// Save list of dynamic review images into IndexedDB (and sync to localStorage if small)
export async function saveDynamicReviews(items) {
  if (!Array.isArray(items)) return;
  const cleanItems = items.filter(item => !isRemovedOrBrokenReview(item));

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of cleanItems) {
      const doc = {
        _id: item._id || `revimg-dyn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: item.url,
        title: item.title || 'Customer Review',
        order: item.order || 0,
        isDefault: false,
        createdAt: item.createdAt || new Date().toISOString()
      };
      store.put(doc);
    }
  } catch (err) {
    console.warn('IndexedDB save notice:', err);
  }

  // Try syncing to localStorage (ignore quota error)
  try {
    localStorage.setItem('dynamicReviewImages', JSON.stringify(cleanItems));
  } catch (e) {
    // Quota exceeded is normal for multi-image uploads; IndexedDB safely holds them
  }
}

// Add new dynamic review images
export async function addDynamicReviews(newItems) {
  if (!Array.isArray(newItems) || newItems.length === 0) return [];
  const existing = await getDynamicReviews();
  const merged = [
    ...newItems.filter(n => !isBrokenReviewUrl(n.url)),
    ...existing.filter(e => !newItems.some(n => (n._id && n._id === e._id) || (n.url && n.url === e.url)))
  ];
  await saveDynamicReviews(merged);
  return merged;
}

// Delete a dynamic review image by ID or URL
export async function deleteDynamicReview(idOrUrl) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(idOrUrl);
  } catch (e) {}

  const current = await getDynamicReviews();
  const filtered = current.filter(item => item._id !== idOrUrl && item.url !== idOrUrl);
  await saveDynamicReviews(filtered);
  return filtered;
}
