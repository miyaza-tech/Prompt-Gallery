# Prompt Gallery - AI Coding Instructions

## Project Overview
A vanilla JavaScript web app for collecting and managing AI image generation prompts. Pure client-side with no backend - uses localStorage for persistence and supports JSON import/export for backup.

## Architecture & Key Patterns

### Single-Page App Structure
- `index.html`: Complete UI structure with Tailwind CSS (CDN)
- `app.js`: All JavaScript logic in one file (~785 lines)
- No build process - runs directly in browser or with simple HTTP server

### Core Data Flow
```javascript
// Global state management pattern
let items = [];              // Main data store
let currentFilter = 'All';   // Filter state
let uploadType = 'url';      // Form state
let editingId = null;        // Edit mode tracking
```

### localStorage as Database
- Key: `'promptGalleryItems'`
- Auto-saves on every add/delete/edit operation
- Error handling for quota exceeded (5-10MB browser limit)
- Items stored as array with `{id, prompt, category, image, createdAt}`

### Dual-Form Architecture
**CRITICAL**: Two separate forms - `addForm` and `editForm` with nearly identical structure but different IDs:
```javascript
// Add form IDs: prompt, category, imageUrl, imageFile
// Edit form IDs: editPrompt, editCategory, editImageUrl, editImageFile
```

### Image Handling
Two modes controlled by `uploadType` variable:
1. **URL mode**: Direct image links (requires internet)
2. **File mode**: Base64 encoding for offline storage (5MB limit)

Error handling includes fallback placeholders and size validation.

### Edit vs Add Pattern
**CRITICAL**: Functions are duplicated for add vs edit operations:
```javascript
// Add functions: addItem(), handleFileUpload(), setUploadType()
// Edit functions: updateItem(), handleEditFileUpload(), setEditUploadType()
// Always maintain both when adding features
```

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
Hard-coded in both HTML `<select>` and filter buttons:
- Nano, GPT, Midjourney, Video, Photorealistic, Casual, Anime
- Add new categories in 3 places: form selects + filter bar + any validation

### Form Validation Pattern
```javascript
// Used throughout for user input validation
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    // Auto-hide after 3 seconds
    setTimeout(() => errorElement.classList.add('hidden'), 3000);
}
```

### State Synchronization Pattern
After ANY data modification, always call this sequence:
```javascript
saveItems();           // Persist to localStorage
renderGallery();       // Update UI
updateButtonVisibility(); // Show/hide import/export buttons
```

## Critical Conventions

### State Management
- All state in global variables (no framework)
- UI updates via direct DOM manipulation
- `renderGallery()` is the main render function - call after any data change
- Edit mode tracked via `editingId` global variable

### Error Handling
- Graceful localStorage failures with quota exceeded alerts
- File size limits (5MB for uploads) with user feedback
- URL validation for image links
- Try-catch blocks around JSON operations
- Auto-hiding error messages after 3 seconds

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

## File Modification Guidelines

### Adding Features
- Extend global state variables at top of `app.js`
- Add HTML structure to `index.html`
- Follow bilingual comment/variable pattern
- Test localStorage quota handling

### UI Changes
- Modify Tailwind classes in `index.html`
- Custom styles go in `<style>` tag (not external CSS)
- Maintain responsive breakpoints (`md:`, `lg:` prefixes)

### Data Structure Changes
- Update both save/load functions in `app.js`
- Consider backwards compatibility for existing localStorage data
- Test JSON export/import functionality

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