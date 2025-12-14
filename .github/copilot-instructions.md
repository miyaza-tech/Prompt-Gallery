# Prompt Gallery - AI Coding Instructions

## Project Overview
A vanilla JavaScript web app for collecting and managing AI image generation prompts. **Migrated from localStorage to Supabase** for real-time cloud persistence, authentication, and file storage. Supports JSON import/export for backup.

## Architecture & Key Patterns

### Single-Page App Structure
- `index.html`: Complete UI structure with Tailwind CSS (CDN)
- `js/app.js`: All JavaScript logic in one file (~1069 lines)
- `js/supabase-config.js`: Supabase client initialization
- `css/style.css`: Custom styles (animations, scrollbar, modals)
- `data/`: Directory for JSON backups (user-managed)
- `assets/`: Static files (images, icons)
- No build process - runs directly in browser or with simple HTTP server

### Core Data Flow
```javascript
// Global state management pattern
let items = [];              // Main data store (loaded from Supabase)
let currentFilter = 'All';   // Filter state
let uploadType = 'url';      // Form state (url/file)
let editingId = null;        // Edit mode tracking
let selectedCategories = []; // Multi-select for add form
let selectedEditCategories = []; // Multi-select for edit form
let currentUser = null;      // Authentication state
```

### Supabase Backend Architecture
**CRITICAL**: Replaced localStorage with Supabase PostgreSQL + Storage + Auth
- **Database**: `Prompt-Gallery` table with Row Level Security (RLS)
  - Reads: Public (no auth required)
  - Writes: Authenticated users only
- **Storage**: `prompt-images` bucket for file uploads (10MB limit)
  - Images auto-deleted when prompt deleted
- **Auth**: Email/password login, read-only by default
- **Realtime**: Cross-device sync via postgres_changes subscription

### CRUD Operations Pattern
**CRITICAL**: All data operations are async and use direct Supabase calls:
```javascript
// Create/Update: await supabase.from('Prompt-Gallery').insert/update()
// Read: await supabase.from('Prompt-Gallery').select()
// Delete: await supabase.from('Prompt-Gallery').delete()
// Always follow with: await loadItems() → renderGallery() → updateButtonVisibility()
```
- `saveItems()` function is **deprecated** - kept for backward compatibility but logs warning
- Use `await loadItems()` to refresh from Supabase after any mutation

### Dual Form Pattern
**CRITICAL**: Two separate modal forms exist for add and edit operations:
- **Add form** (`#addFormModal`) - creates new items, multi-category selection
- **Edit form** (`#editFormModal`) - updates existing items with delete button
- Both forms share identical structure but have separate IDs:
  - Prompts: `prompt` / `editPrompt`
  - Image URLs: `imageUrl` / `editImageUrl`
  - File inputs: `imageFile` / `editImageFile`
  - Category arrays: `selectedCategories` / `selectedEditCategories`
  - Upload type toggles: `setUploadType()` / `setEditUploadType()`
  - Char counters: `updateCharCount()` / `updateEditCharCount()`
- When modifying form logic, update BOTH forms to maintain feature parity
- `editingId` global variable tracks which item is being edited

### Image Handling
Two modes controlled by `uploadType`:
1. **URL mode**: Direct image links (external hosting)
2. **File mode**: Upload to Supabase Storage (10MB limit, was 5MB for base64)
   - Generates unique filename: `${Date.now()}-${Math.random()}.${ext}`
   - Uploads to `prompt-images` bucket
   - Returns public URL for storage in database
   - Auto-deletes from Storage when prompt deleted

Functions: `uploadImageToStorage(file)`, `deleteImageFromStorage(imageUrl)`

## Development Workflows

### Local Development
```bash
# Method 1: Direct file opening (read-only, auth may not work)
# Just double-click index.html

# Method 2: HTTP server (recommended for full functionality)
python -m http.server 8000
# Then open http://localhost:8000
```

### Authentication Flow
**Two-Tier Access Model**:
- **Unauthenticated**: Can view and filter all prompts (read-only)
- **Authenticated**: Can add, edit, delete prompts (full CRUD)

```javascript
// Auth state managed by currentUser global
await checkAuthStatus(); // Called on DOMContentLoaded
updateUIForAuth();       // Shows/hides buttons based on auth

// Login/logout updates UI automatically
currentUser = user;      // Set on successful login
currentUser = null;      // Set on logout
```

Buttons visibility:
- Always visible: Filter buttons, prompt cards
- Auth-only: "New Item", "Import", "Export", card edit/delete buttons
- Dynamic: "Login" (logged out) ↔ "Logout" (logged in)

### Realtime Sync
Cross-device synchronization via Supabase Realtime:
```javascript
supabase.channel('prompt-gallery-channel')
    .on('postgres_changes', { event: '*', table: 'Prompt-Gallery' }, 
        async (payload) => {
            await loadItems();
            renderGallery();
            updateButtonVisibility();
        })
    .subscribe();
```
- Listens for INSERT, UPDATE, DELETE events
- Auto-refreshes UI when changes occur from other devices/tabs
- No manual polling needed

### Categories Management
**13 hard-coded categories** - must update in THREE locations:
1. `index.html` - Add form category buttons (`#categoryButtons`)
2. `index.html` - Edit form category buttons (`#editCategoryButtons`)  
3. `index.html` - Filter bar buttons with `data-category` attributes

Current: Nano, GPT, Midjourney, Video, Photo, real_ch, real_bg, US_ch, US_bg, JP_ch, JP_bg, etc, (All is special filter-only category)

**Multi-select pattern**: 
- Add form: `selectedCategories[]` array
- Edit form: `selectedEditCategories[]` array
- Visual feedback: Toggle `border-gray-400 bg-gray-200` classes

### Form Validation Pattern
```javascript
// Used throughout for user input validation
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}
```

### Modal Management
Three modals exist:
1. **Add Form Modal** (`#addFormModal`) - backdrop click to close
2. **Edit Form Modal** (`#editFormModal`) - backdrop click to close  
3. **Login Modal** (`#loginModal`) - email/password form
4. **Image Preview Modal** (`#imageModal`) - full-screen image viewer

Pattern: `toggleForm()`, `closeEditForm()`, `toggleLoginModal()`, `closeImageModal()`
- All set `document.body.style.overflow = 'hidden'` when open
- Restore scroll on close

## Critical Conventions

### State Management
- All state in global variables (no framework)
- UI updates via direct DOM manipulation
- `renderGallery()` is the main render function - call after any data change

### Error Handling
- Graceful Supabase operation failures with try-catch
- File size limits (10MB for uploads, was 5MB for base64)
- URL validation for image links
- Auth errors displayed in modal

### CSS & Animations
- Tailwind utility classes with custom animations in `<style>`
- `.fade-in` animation for form toggles
- `.card-hover` for interactive feedback
- Responsive design with mobile-first approach

### Data Persistence
```javascript
// DEPRECATED - no longer call saveItems()
// Instead, use direct Supabase operations:
await supabase.from('Prompt-Gallery').insert/update/delete();
await loadItems();      // Refresh from Supabase
renderGallery();        // Re-render UI
updateButtonVisibility(); // Update auth-dependent buttons
```

### CRUD Operation Flow
1. **Add**: `addItem()` → validates → handles file/URL → `saveItemWithImage()` → `supabase.insert()` → `loadItems()` → `renderGallery()`
2. **Edit**: `editItem(id)` → populate form → show `editFormModal` → `updateItem()` → `supabase.update()` → `loadItems()`
3. **Delete**: 
   - From card: `deleteItem(id)` → confirm → `deleteImageFromStorage()` → `supabase.delete()` → `loadItems()`
   - From edit form: `deleteCurrentItem()` → confirm → `deleteImageFromStorage()` → `supabase.delete()` → `closeEditForm()`
4. **Read**: `loadItems()` on DOMContentLoaded → `supabase.select()` → set global `items` array → `renderGallery()`

## File Modification Guidelines

### Adding Features
- Extend global state variables at top of [js/app.js](js/app.js)
- Add HTML structure to [index.html](index.html)
- Test Supabase RLS policies if changing data model
- Update both add and edit forms if adding new fields

### UI Changes
- Modify Tailwind classes in [index.html](index.html)
- Custom styles go in [css/style.css](css/style.css)
- Maintain responsive breakpoints (`md:`, `lg:` prefixes)

### Data Structure Changes
- Update Supabase table schema (requires database migration)
- Modify both add/edit form handlers in [js/app.js](js/app.js)
- Test JSON export/import functionality for backward compatibility
- JSON backups can be saved in `data/` directory (user-managed)

## Integration Points

### External Dependencies
- **Supabase JS SDK** (CDN v2) - PostgreSQL + Storage + Auth + Realtime
- **Tailwind CSS** (CDN) - no local compilation
- **Google Fonts** (Inter) for typography
- Browser APIs: FileReader, Clipboard API

### Supabase Configuration
Located in [js/supabase-config.js](js/supabase-config.js):
```javascript
const SUPABASE_URL = 'https://[project-ref].supabase.co';
const SUPABASE_ANON_KEY = '[anon-key]';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Browser Compatibility
Requires modern browser features:
- Async/await (Chrome 55+, Firefox 52+)
- FileReader API (IE10+)
- Clipboard API (Chrome 66+, Firefox 63+)

### Deployment
Static hosting ready:
- GitHub Pages, Netlify, Vercel
- Requires Supabase project setup
- All assets self-contained except CDN links
- Environment: `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be configured

## Common Pitfalls & Solutions

### Form State Synchronization
When adding features to forms, remember dual form pattern:
- Add form uses: `prompt`, `category`, `imageUrl`, `imageFile`
- Edit form uses: `editPrompt`, `editCategory`, `editImageUrl`, `editImageFile`
- Upload type toggles: `setUploadType()` vs `setEditUploadType()`
- File handlers: `handleFileUpload()` vs `handleEditFileUpload()`
- Char counters: `updateCharCount()` vs `updateEditCharCount()`

### Image Display Issues
Cards use inline error handling:
```html
<img ... onerror="this.style.display='none';">
```
This prevents broken image icons - image simply disappears if URL fails.

### HTML Escaping for Security
Always use `escapeHtml()` when injecting user content into DOM:
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // Safe - no XSS
    return div.innerHTML;
}
```
Used in `createItemCard()` for prompts and image URLs.

### Supabase Storage Management
- Images stored in `prompt-images` bucket (10MB limit per file)
- Public bucket - no auth required to view images
- Always delete images when deleting prompts to avoid orphaned files
- Extract file path from URL pattern: `split('/prompt-images/')[1]`

### Authentication Edge Cases
- UI updates on auth state change via `updateUIForAuth()`
- Check `currentUser !== null` before write operations
- RLS policies enforced server-side (client validation is UX only)
- Login errors displayed in modal, not as alerts