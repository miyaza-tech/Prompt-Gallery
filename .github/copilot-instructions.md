# Prompt Gallery - AI Coding Instructions

## Project Overview
Vanilla JavaScript web app for collecting and managing AI image generation prompts with real-time cloud sync. Uses Firebase (Cloud Firestore + Storage + Auth) for backend. Supports multi-category filtering, image uploads, and JSON backup/restore. **No build process - pure HTML/CSS/JS.**

## Architecture & Data Flow

### Single-File App Structure
```
├── index.html          # Complete UI with 3 modals (add/edit/login/image-preview)
├── js/app.js           # All logic (~1300 lines, no framework) - CLASSIC script
├── js/firebase-config.js  # Firebase init - ES MODULE, publishes window.fb
└── css/style.css       # Custom animations (modals, hover effects)
```

### Script Loading Contract (important)
`app.js` must stay a **classic script** because `index.html` wires buttons with
inline `onclick=` handlers, which resolve against globals. The Firebase modular
SDK is ESM-only, so `js/firebase-config.js` is loaded as `<script type="module">`
and re-publishes what it imports on `window.fb`:

```html
<script src="js/app.js"></script>
<script type="module" src="js/firebase-config.js"></script>
```

Module scripts are deferred, so `window.fb` always exists before
`DOMContentLoaded` fires. **Never** add `type="module"` to `app.js` - every
inline handler in `index.html` would break. To use a new SDK function, import it
in `firebase-config.js` AND add it to the `window.fb` object.

### Global State (Top of app.js)
```javascript
let items = [];              // Loaded from Firestore on auth
let currentUser = null;      // Auth state (null = read-only)
let editingId = null;        // Tracks which item is being edited
let selectedCategories = []; // Add form multi-select
let selectedEditCategories = []; // Edit form multi-select
let uploadType = 'url';      // 'url' or 'file'
let activeFilters = [];      // Multi-category filter (OR logic)
```

### Firebase Backend Architecture
**Firestore collection**: `prompts` (name lives in `window.fb.COLLECTION`)

| Field | Type | Notes |
|---|---|---|
| `prompt` | string | Required |
| `category` | string | Comma-separated: `"GPT, Photo"` |
| `sref` | string | Midjourney style reference |
| `image` | string | Firebase Storage download URL or external URL |
| `created_at` | timestamp | `serverTimestamp()` on create; sort key |

**Document IDs are auto-generated STRINGS**, not integers. This matters:
- `createItemCard()` must quote the id: `editItem(\'' + item.id + '\')`
- Never do arithmetic or `parseInt()` on an id
- `orderBy('created_at')` **silently omits documents missing that field** - always
  write `created_at`, including on import

**Security rules**: see [firestore.rules](../firestore.rules) and
[storage.rules](../storage.rules) - read and write both require `request.auth != null`.

**Storage folder**: `prompt-images/`
- 10MB per file limit, image content types only
- Auto-deletes when prompt deleted (`deleteImageFromStorage()`)
- Unique filenames: `${Date.now()}-${Math.random()}.${ext}`
- Requires the **Blaze plan** (billing account) as of 2026-02-03

**Realtime**: `onSnapshot()` listener for cross-device sync

### Critical Data Operation Pattern
```javascript
// ✅ ALWAYS use window.fb helpers followed by reload:
const { db, doc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, COLLECTION } = window.fb;

// CREATE
await addDoc(collection(db, COLLECTION), { prompt, category, sref, image, created_at: serverTimestamp() });
await loadItems();
renderGallery();
updateButtonVisibility();

// UPDATE
await updateDoc(doc(db, COLLECTION, editingId), { prompt, category, sref, image });
await loadItems();
renderGallery();

// DELETE
await deleteImageFromStorage(item.image); // If image exists
await deleteDoc(doc(db, COLLECTION, id));
await loadItems();
renderGallery();
```

`loadItems()` maps documents through `docToItem()`, which flattens the doc id in
as `id` and converts the `created_at` Timestamp to an ISO string so JSON
export/import round-trips cleanly.

## Development Workflows

### Local Development
```bash
# HTTP server (recommended - CORS, Auth work correctly)
python -m http.server 8000
# Open http://localhost:8000

# Direct file:// (read-only, Auth won't work)
# Just double-click index.html
```

### Authentication Flow (Firebase Auth)
**Login mechanism**: Firebase email/password authentication
```javascript
// On page load
await checkAuthStatus(); // Wraps onAuthStateChanged in a promise
if (currentUser) {
    await loadItems();
    subscribeToRealtime();
}

// Login
const credential = await window.fb.signInWithEmailAndPassword(window.fb.auth, email, password);
currentUser = credential.user;
updateUIForAuth(); // Shows/hides buttons

// Logout
unsubscribeFromRealtime();  // MUST come first
await window.fb.signOut(window.fb.auth);
currentUser = null;
```

**Two ordering rules that are easy to get wrong**:
1. Firebase restores a persisted session *asynchronously* - `auth.currentUser` is
   null on the first tick. Never read it directly at startup; go through
   `checkAuthStatus()`, which resolves on the first `onAuthStateChanged` callback
   and then keeps listening so other tabs stay in sync.
2. Detach the snapshot listener *before* `signOut()`. Otherwise it keeps firing
   against rules that no longer permit the read and spams permission errors.

**UI visibility rules**:
- Unauthenticated: Login required message + login button
- Authenticated: Full gallery + "New Item", "Import", "Export", card "edit" buttons
- **Critical**: Gallery hidden until login - `renderGallery()` shows "Login Required" message when `currentUser === null`

### Realtime Cross-Device Sync
```javascript
realtimeUnsubscribe = window.fb.onSnapshot(
    promptsQuery(),
    (snapshot) => {
        items = snapshot.docs.map(docToItem); // Snapshot already carries the data
        renderGallery();
        updateButtonVisibility();
    },
    (error) => console.error('Realtime listener error:', error)
);
```
**Triggers on**: Any create/update/delete from any device/tab.
Unlike the previous backend, the snapshot *contains* the new documents, so the
callback does not re-fetch. Keep the returned unsubscribe function in
`realtimeUnsubscribe` and call `unsubscribeFromRealtime()` before logout or
before re-subscribing (otherwise listeners stack up across logins).

### Image Upload Workflow
1. User selects file → `handleFileUpload(event)` validates (type + 10MB limit)
2. Preview shown via `FileReader.readAsDataURL()`
3. On submit → `uploadImageToStorage(file)`:
   - Uploads to the `prompt-images/` folder
   - Returns a download URL: `https://firebasestorage.googleapis.com/v0/b/[bucket]/o/prompt-images%2F[filename]?alt=media&token=...`
4. URL saved in the document's `image` field

**Image deletion**: the storage path is URL-encoded inside the download URL, so
parse the `/o/` segment rather than splitting on the folder name. Only delete
files we host - items whose `image` is an arbitrary external URL must be left alone.
```javascript
if (!imageUrl.includes('firebasestorage.googleapis.com')) return;
const filePath = decodeURIComponent(imageUrl.match(/\/o\/([^?]+)/)[1]);
await deleteObject(storageRef(storage, filePath));
```

## Critical Conventions

### Dual Form Pattern (Add vs Edit)
**CRITICAL**: When modifying form logic, update BOTH forms identically:

| Feature       | Add Form           | Edit Form             |
|---------------|--------------------|-----------------------|
| Modal ID      | `addFormModal`     | `editFormModal`       |
| Prompt input  | `prompt`           | `editPrompt`          |
| Image URL     | `imageUrl`         | `editImageUrl`        |
| File input    | `imageFile`        | `editImageFile`       |
| Category array| `selectedCategories`| `selectedEditCategories`|
| Upload toggle | `setUploadType()`  | `setEditUploadType()` |
| File handler  | `handleFileUpload()`| `handleEditFileUpload()`|
| Char counter  | `updateCharCount()`| `updateEditCharCount()`|

**Why**: Forms share identical structure but separate state to avoid conflicts.

### Category Management (Multi-Select)
**13 Hard-Coded Categories**:
`Nano, GPT, Midjourney, Video, Photo, real_ch, real_bg, US_ch, US_bg, JP_ch, JP_bg, etc`

**To add/remove categories**, edit THREE locations:
1. [index.html](index.html) - `#categoryButtons` (add form)
2. [index.html](index.html) - `#editCategoryButtons` (edit form)
3. [index.html](index.html) - `.filter-btn[data-category]` (filter bar)

**Multi-select logic**:
```javascript
// Toggle category in array
toggleCategory('GPT');
selectedCategories.includes('GPT') ? remove : add;
// Update button classes:
selected: 'border-gray-400 bg-gray-200 text-gray-900'
default:  'border-gray-300 hover:border-gray-400'
```

**Filtering (OR logic)**:
```javascript
activeFilters = ['GPT', 'Photo']; // User clicks multiple filters
filteredItems = items.filter(item => {
    const categories = item.category.split(', ');
    return activeFilters.some(filter => categories.includes(filter));
});
```

### Modal Management
**4 Modals**:
1. `#addFormModal` - New prompt (backdrop click to close)
2. `#editFormModal` - Edit/delete existing (backdrop click to close)
3. `#loginModal` - Admin password (backdrop click to close)
4. `#imageModal` - Full-screen image + prompt viewer with translate button

**Pattern**:
```javascript
function toggleForm() {
    modal.classList.toggle('hidden');
    document.body.style.overflow = modal.hidden ? '' : 'hidden'; // Lock scroll
}

function closeModalOnBackdrop(event, modalId) {
    if (event.target.id === modalId) closeModal();
}
```

### XSS Prevention
**Always use `escapeHtml()` for user content**:
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text; // Browser auto-escapes
    return div.innerHTML;
}

// Usage in createItemCard()
const escapedPrompt = escapeHtml(item.prompt);
const jsEscaped = item.prompt.replace(/'/g, "\\'").replace(/\n/g, '\\n');
```

### Image Fallback Pattern
```html
<!-- Cards use inline error handler -->
<img src="${image}" onerror="this.style.display='none';">
```
**Why**: Prevents broken image icons - image div simply disappears if URL fails.

## File Modification Guidelines

### Adding New Features
1. **New field in database**:
   - Firestore is schemaless - just start writing the field (update `firestore.rules` if it needs validation)
   - Add input to BOTH `#addFormModal` and `#editFormModal`
   - Update `addItem()`, `updateItem()`, `createItemCard()`
   - Test JSON export/import compatibility

2. **New category**:
   - Add button to 3 locations (add/edit/filter)
   - No code changes needed (dynamic arrays)

3. **New modal**:
   - Add HTML structure with unique `id`
   - Create `toggle*Modal()` function
   - Add `closeModalOnBackdrop()` handler
   - Set `document.body.style.overflow` on open/close

### UI Changes
- **Styles**: Tailwind classes in [index.html](index.html), custom CSS in [css/style.css](css/style.css)
- **Responsive**: Use `md:` (768px), `lg:` (1024px) breakpoints
- **Animations**: Modal fadeIn/slideUp in `<style>` tag

### Testing Checklist
- [ ] Test add/edit form parity (both should behave identically)
- [ ] Test multi-category selection (add/edit/filter)
- [ ] Test image upload (10MB limit, auto-delete on prompt delete)
- [ ] Test realtime sync (open 2 tabs, edit in one, verify other updates)
- [ ] Test login/logout (UI button visibility)
- [ ] Test JSON export/import (backup compatibility)

## Integration Points

### External Dependencies (CDN)
```html
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
<!-- Firebase SDK is imported inside js/firebase-config.js from https://www.gstatic.com/firebasejs/12.16.0/ -->
```
**Browser APIs**: FileReader, Clipboard API, fetch (translate feature)

**CSP**: `index.html` ships a `Content-Security-Policy` meta tag. Adding a new
Firebase service usually means adding its host to `connect-src`. Current allowances:
`firestore.googleapis.com`, `firebasestorage.googleapis.com`,
`identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, plus
`www.gstatic.com` in `script-src`.

### Firebase Configuration ([js/firebase-config.js](../js/firebase-config.js))
```javascript
const firebaseConfig = { apiKey: '...', projectId: '...', storageBucket: '...', /* ... */ };
const COLLECTION = 'prompts';
const IMAGE_FOLDER = 'prompt-images';
// ...imports Firebase modular SDK, then publishes everything on window.fb
```
`apiKey` is a public identifier, not a secret - **security rules** are what protect
the data. Both read and write require an authenticated user.

### Translation Feature (Image Modal)
Uses **Google Translate API** (free, no auth):
```javascript
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${text}`;
const data = await fetch(url).then(r => r.json());
const translated = data[0].map(item => item[0]).join('');
```
**Why**: Hardcoded EN→KO translation for prompt viewing.

## Common Pitfalls & Solutions

### Form State Desync
**Problem**: Adding field to add form but forgetting edit form.
**Solution**: Use table above to ensure parity. Search codebase for both IDs.

### Orphaned Storage Images
**Problem**: Deleting prompt without deleting image.
**Solution**: Always call `deleteImageFromStorage()` before `deleteDoc()`:
```javascript
if (item.image && item.image.includes('prompt-images')) {
    await deleteImageFromStorage(item.image);
}
await deleteDoc(doc(db, COLLECTION, id));
```

### Realtime Not Working
**Problem**: UI not updating on other devices.
**Solution**: Verify `subscribeToRealtime()` called after login, check browser console for connection status.

### Category Filter Not Showing Items
**Problem**: Filtering by category A doesn't show items with "A, B".
**Solution**: Correct - uses OR logic. Item with "GPT, Photo" shows when filtering GPT OR Photo.

### Security Rules Block Writes
**Problem**: Authenticated user can't create/update.
**Solution**:
- Verify the rules in the Firebase Console match [firestore.rules](../firestore.rules)
- Confirm the collection name in the rules matches `window.fb.COLLECTION`
- Check browser console for auth errors and verify `currentUser` is set after login

### Image Upload Fails With 402/403
**Problem**: Storage requests are rejected outright.
**Solution**: The project must be on the **Blaze plan** - Spark projects have no
Storage bucket access at all. Check the plan before debugging rules.

### Item Saved But Never Appears
**Problem**: Write succeeds, gallery stays empty.
**Solution**: `loadItems()` orders by `created_at`, and Firestore drops documents
that lack the sort field. Ensure every write sets `created_at`.

### Image Preview Not Showing
**Problem**: FileReader preview shows but card doesn't.
**Solution**: 
- Add: Preview uses `readAsDataURL()` (base64)
- Card: Uses Firebase Storage download URL (after upload)
- Check `uploadImageToStorage()` returns valid URL

## Quick Reference

### Render Pipeline
```
User action → Firestore mutation → await loadItems() → renderGallery() → updateButtonVisibility()
```

### Key Functions
- `loadItems()`: One-shot fetch of all documents from Firestore
- `docToItem(docSnap)`: Firestore doc → plain item (`id` + ISO `created_at`)
- `promptsQuery()`: Shared ordered query used by both fetch and listener
- `renderGallery()`: Regenerates all cards (respects activeFilters)
- `createItemCard(item)`: Returns HTML string for one card
- `updateButtonVisibility()`: Shows/hides auth-dependent buttons
- `updateUIForAuth()`: Calls renderGallery + button visibility

### Debugging Tips
- Check browser console for Firebase errors
- Confirm `window.fb` exists (missing = `js/firebase-config.js` failed to load)
- Verify `currentUser` state (null = unauthenticated)
- Test security rules in the Firebase Console Rules Playground
- Use `console.log('✅ Realtime listener active')` to verify sync