# Prompt Gallery - AI Coding Instructions

## Project Overview
Vanilla JavaScript web app for collecting and managing AI image generation prompts with real-time cloud sync. Uses Supabase (PostgreSQL + Storage + Auth + Realtime) for backend, replacing legacy localStorage. Supports multi-category filtering, image uploads, and JSON backup/restore. **No build process - pure HTML/CSS/JS.**

## Architecture & Data Flow

### Single-File App Structure
```
├── index.html          # Complete UI with 3 modals (add/edit/login/image-preview)
├── js/app.js           # All logic (~1200 lines, no framework)
├── js/supabase-config.js  # Backend client init
└── css/style.css       # Custom animations (modals, hover effects)
```

### Global State (Top of app.js)
```javascript
let items = [];              // Loaded from Supabase on auth
let currentUser = null;      // Auth state (null = read-only)
let editingId = null;        // Tracks which item is being edited
let selectedCategories = []; // Add form multi-select
let selectedEditCategories = []; // Edit form multi-select
let uploadType = 'url';      // 'url' or 'file'
let activeFilters = [];      // Multi-category filter (OR logic)
```

### Supabase Backend Architecture
**Database Table**: `Prompt-Gallery`
```sql
CREATE TABLE "Prompt-Gallery" (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  category TEXT,           -- Comma-separated: "GPT, Photo"
  sref TEXT,               -- Midjourney style reference
  image TEXT,              -- Supabase Storage URL or external URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row Level Security (RLS)**:
- SELECT: Public (anyone can read, even unauthenticated)
- INSERT/UPDATE/DELETE: Only `auth.uid() IS NOT NULL`

**Storage Bucket**: `prompt-images` (Public)
- 10MB per file limit
- Auto-deletes when prompt deleted (`deleteImageFromStorage()`)
- Unique filenames: `${Date.now()}-${Math.random()}.${ext}`

**Realtime**: `postgres_changes` subscription for cross-device sync

### Critical Data Operation Pattern
```javascript
// ❌ NEVER use saveItems() - deprecated, localStorage legacy
// ✅ ALWAYS use direct Supabase calls followed by reload:

// CREATE
await supabase.from('Prompt-Gallery').insert([{ prompt, category, sref, image }]);
await loadItems();
renderGallery();
updateButtonVisibility();

// UPDATE
await supabase.from('Prompt-Gallery').update({ ... }).eq('id', editingId);
await loadItems();
renderGallery();

// DELETE
await deleteImageFromStorage(item.image); // If image exists
await supabase.from('Prompt-Gallery').delete().eq('id', id);
await loadItems();
renderGallery();
```

## Development Workflows

### Local Development
```bash
# HTTP server (recommended - CORS, Auth work correctly)
python -m http.server 8000
# Open http://localhost:8000

# Direct file:// (read-only, Auth won't work)
# Just double-click index.html
```

### Authentication Flow (Supabase Auth)
**Login mechanism**: Uses Supabase email/password authentication
```javascript
// On page load
await checkAuthStatus(); // Calls supabase.auth.getSession()
if (currentUser) {
    await loadItems();
    subscribeToRealtime();
}

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
currentUser = data.user;
updateUIForAuth(); // Shows/hides buttons

// Logout
await supabase.auth.signOut();
currentUser = null;
```

**UI visibility rules**:
- Unauthenticated: Login required message + login button
- Authenticated: Full gallery + "New Item", "Import", "Export", card "edit" buttons
- **Critical**: Gallery hidden until login - `renderGallery()` shows "Login Required" message when `currentUser === null`

### Realtime Cross-Device Sync
```javascript
supabase.channel('prompt-gallery-channel')
    .on('postgres_changes', { event: '*', table: 'Prompt-Gallery' }, 
        async (payload) => {
            await loadItems();        // Fetch latest
            renderGallery();         // Re-render cards
            updateButtonVisibility(); // Update button states
        })
    .subscribe();
```
**Triggers on**: Any INSERT/UPDATE/DELETE from any device/tab

### Image Upload Workflow
1. User selects file → `handleFileUpload(event)` validates (10MB limit)
2. Preview shown via `FileReader.readAsDataURL()`
3. On submit → `uploadImageToStorage(file)`:
   - Uploads to `prompt-images` bucket
   - Returns public URL: `https://[project].supabase.co/storage/v1/object/public/prompt-images/[filename]`
4. URL saved in database `image` column

**Image deletion**:
```javascript
// Extract path from URL: "https://.../prompt-images/1234.jpg" → "1234.jpg"
const filePath = imageUrl.split('/prompt-images/')[1].split('?')[0];
await supabase.storage.from('prompt-images').remove([filePath]);
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
   - Update Supabase table schema (SQL migration)
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
<script src="https://unpkg.com/@supabase/supabase-js@2.39.0/dist/umd/supabase.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
```
**Browser APIs**: FileReader, Clipboard API, fetch (translate feature)

### Supabase Configuration ([js/supabase-config.js](js/supabase-config.js))
```javascript
const SUPABASE_URL = 'https://uhwnbjmfcakbkbxvhpgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...'; // Public key (safe for client-side)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```
**RLS protects writes** - uses Supabase Auth tokens. Authenticated users can write; unauthenticated users are read-only (SELECT allowed).

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
**Solution**: Always call `deleteImageFromStorage()` before `supabase.delete()`:
```javascript
if (item.image && item.image.includes('prompt-images')) {
    await deleteImageFromStorage(item.image);
}
await supabase.from('Prompt-Gallery').delete().eq('id', id);
```

### Realtime Not Working
**Problem**: UI not updating on other devices.
**Solution**: Verify `subscribeToRealtime()` called after login, check browser console for connection status.

### Category Filter Not Showing Items
**Problem**: Filtering by category A doesn't show items with "A, B".
**Solution**: Correct - uses OR logic. Item with "GPT, Photo" shows when filtering GPT OR Photo.

### Supabase RLS Blocks Writes
**Problem**: Authenticated user can't insert/update.
**Solution**: 
- Verify `auth.uid() IS NOT NULL` policy exists in Supabase dashboard
- **This app uses Supabase Auth** - ensure user is properly authenticated via `supabase.auth.signInWithPassword()`
- Check browser console for authentication errors and verify `currentUser` is set after login

### Image Preview Not Showing
**Problem**: FileReader preview shows but card doesn't.
**Solution**: 
- Add: Preview uses `readAsDataURL()` (base64)
- Card: Uses Supabase Storage URL (after upload)
- Check `uploadImageToStorage()` returns valid URL

## Quick Reference

### Render Pipeline
```
User action → Supabase mutation → await loadItems() → renderGallery() → updateButtonVisibility()
```

### Key Functions
- `loadItems()`: Fetches all from Supabase
- `renderGallery()`: Regenerates all cards (respects activeFilters)
- `createItemCard(item)`: Returns HTML string for one card
- `updateButtonVisibility()`: Shows/hides auth-dependent buttons
- `updateUIForAuth()`: Calls renderGallery + button visibility

### Debugging Tips
- Check browser console for Supabase errors
- Verify `currentUser` state (null = unauthenticated)
- Test Supabase RLS policies in Supabase dashboard
- Use `console.log('✅ Realtime subscription active')` to verify sync