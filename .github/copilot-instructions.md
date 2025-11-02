# Prompt Gallery - AI Coding Instructions

## Project Overview
A vanilla JavaScript web app for collecting and managing AI image generation prompts. Pure client-side with no backend - uses localStorage for persistence and supports JSON import/export for backup.

## Architecture & Key Patterns

### Single-Page App Structure
- `index.html`: Complete UI structure with Tailwind CSS (CDN)
- `js/app.js`: All JavaScript logic in one file (785 lines)
- `css/style.css`: Custom styles (animations, scrollbar)
- `data/`: Directory for JSON backups (user-managed)
- `assets/`: Static files (images, icons)
- No build process - runs directly in browser or with simple HTTP server

### Core Data Flow
```javascript
// Global state management pattern
let items = [];              // Main data store
let currentFilter = 'All';   // Filter state
let uploadType = 'url';      // Form state
let copiedId = null;         // UI feedback state
```

### localStorage as Database
- Key: `'promptGalleryItems'`
- Auto-saves on every add/delete operation
- Error handling for quota exceeded (5-10MB browser limit)
- Items stored as array with `{id, prompt, category, image, createdAt}`

### Dual Form Pattern
**CRITICAL**: Two separate forms exist for add and edit operations:
- Add form (`addForm`) - for creating new items
- Edit form (`editForm`) - for updating existing items with delete option
- Both forms share identical structure but have separate IDs (`prompt`/`editPrompt`, `imageUrl`/`editImageUrl`, etc.)
- When modifying form logic, update BOTH forms to maintain feature parity
- `editingId` global variable tracks which item is being edited

### Image Handling
Two modes controlled by `uploadType`:
1. **URL mode**: Direct image links (requires internet)
2. **File mode**: Base64 encoding for offline storage (5MB limit)

Error handling includes fallback placeholders and size validation.

## Development Workflows

### Local Development
```bash
# Method 1: Direct file opening
# Just double-click index.html

# Method 2: HTTP server (recommended for file uploads)
python -m http.server 8000
# Then open http://localhost:8000
```

### Key Categories
Hard-coded in multiple locations - must update all three:
1. `index.html` - `<select id="category">` options (add form)
2. `index.html` - `<select id="editCategory">` options (edit form)
3. `index.html` - Filter bar buttons with `data-category` attributes

Current categories: Nano, GPT, Midjourney, Video, Photorealistic, Casual, Anime

### Form Validation Pattern
```javascript
// Used throughout for user input validation
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}
```

## Critical Conventions

### State Management
- All state in global variables (no framework)
- UI updates via direct DOM manipulation
- `renderGallery()` is the main render function - call after any data change

### Error Handling
- Graceful localStorage failures
- File size limits (5MB for uploads)
- URL validation for image links
- Try-catch blocks around JSON operations

### CSS & Animations
- Tailwind utility classes with custom animations in `<style>`
- `.fade-in` animation for form toggles
- `.card-hover` for interactive feedback
- Responsive design with mobile-first approach

### Data Persistence
```javascript
// Always call after modifying items array
saveItems();
renderGallery();
updateButtonVisibility();
```

### CRUD Operation Flow
1. **Add**: `addItem()` → validates → handles file/URL → `saveItemWithImage()` → `saveItems()` → `renderGallery()` → `toggleForm()`
2. **Edit**: `editItem(id)` → populate form → show `editForm` → `updateItem()` → `saveUpdatedItem()` → `saveItems()`
3. **Delete**: 
   - From card: `deleteItem(id)` → confirm → filter array → `saveItems()`
   - From edit form: `deleteCurrentItem()` → confirm → filter array → `closeEditForm()`
4. **Read**: `loadItems()` on DOMContentLoaded → parse JSON → set global `items` array

## File Modification Guidelines

### Adding Features
- Extend global state variables at top of `js/app.js`
- Add HTML structure to `index.html`
- Test localStorage quota handling

### UI Changes
- Modify Tailwind classes in `index.html`
- Custom styles go in `css/style.css`
- Maintain responsive breakpoints (`md:`, `lg:` prefixes)

### Data Structure Changes
- Update both save/load functions in `js/app.js`
- Consider backwards compatibility for existing localStorage data
- Test JSON export/import functionality
- JSON backups can be saved in `data/` directory (user-managed)

## Integration Points

### External Dependencies
- Tailwind CSS (CDN) - no local compilation
- Google Fonts (Inter) for typography
- Browser APIs: localStorage, FileReader, Clipboard API

### Browser Compatibility
Requires modern browser features:
- localStorage (IE8+)
- FileReader API (IE10+)
- Clipboard API (Chrome 66+, Firefox 63+)

### Deployment
Static hosting ready:
- GitHub Pages, Netlify, Vercel
- No server-side processing required
- All assets self-contained except CDN links

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

### localStorage Quota Management
5MB limit handling:
- Catch `QuotaExceededError` in `saveItems()`
- Alert user to export and clear data
- Base64 images increase size ~33% vs original file
- Consider warning at 80% capacity (not currently implemented)