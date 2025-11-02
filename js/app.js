// Global state management
let items = [];
let currentFilter = 'All';
let uploadType = 'url';
let editingId = null;
let selectedCategories = [];
let selectedEditCategories = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadItems();
    renderGallery();
    updateButtonVisibility();
    subscribeToRealtime();
});

// Supabase Database persistence
async function loadItems() {
    try {
        const { data, error } = await supabase
            .from('prompts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        items = data || [];
        console.log(`Loaded ${items.length} items from Supabase`);
    } catch (error) {
        console.error('Error loading items:', error);
        items = [];
    }
}

// No longer needed - replaced with direct Supabase insert/update/delete
function saveItems() {
    // This function is kept for backward compatibility but no longer used
    console.warn('saveItems() is deprecated - use direct Supabase operations');
}

// Form management
function toggleForm() {
    const modal = document.getElementById('addFormModal');
    const btn = document.getElementById('addBtnText');
    const submitBtn = document.getElementById('submitBtnText');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        btn.textContent = 'Close';
        if (submitBtn) submitBtn.textContent = 'Add Prompt';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scroll
        btn.textContent = 'New Item';
        if (submitBtn) submitBtn.textContent = 'Add Prompt';
        editingId = null;
        resetForm();
    }
}

function closeModalOnBackdrop(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'addFormModal') {
            toggleForm();
        } else if (modalId === 'editFormModal') {
            closeEditForm();
        }
    }
}

// Category selection
function toggleCategory(category) {
    const index = selectedCategories.indexOf(category);
    const button = document.querySelector(`[data-category="${category}"].category-btn`);
    
    if (index > -1) {
        // Remove category
        selectedCategories.splice(index, 1);
        button.classList.remove('border-gray-400', 'bg-gray-200', 'text-gray-900');
        button.classList.add('border-gray-300', 'hover:border-gray-400');
    } else {
        // Add category
        selectedCategories.push(category);
        button.classList.remove('border-gray-300', 'hover:border-gray-400');
        button.classList.add('border-gray-400', 'bg-gray-200', 'text-gray-900');
    }
}

function toggleEditCategory(category) {
    const index = selectedEditCategories.indexOf(category);
    const button = document.querySelector(`[data-category="${category}"].edit-category-btn`);
    
    if (index > -1) {
        // Remove category
        selectedEditCategories.splice(index, 1);
        button.classList.remove('border-gray-400', 'bg-gray-200', 'text-gray-900');
        button.classList.add('border-gray-300', 'hover:border-gray-400');
    } else {
        // Add category
        selectedEditCategories.push(category);
        button.classList.remove('border-gray-300', 'hover:border-gray-400');
        button.classList.add('border-gray-400', 'bg-gray-200', 'text-gray-900');
    }
}

function resetForm() {
    document.getElementById('prompt').value = '';
    document.getElementById('sref').value = '';
    
    // Reset category buttons
    selectedCategories = [];
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.classList.remove('border-gray-400', 'bg-gray-200', 'text-gray-900');
        btn.classList.add('border-gray-300', 'hover:border-gray-400');
    });
    
    const urlEl = document.getElementById('imageUrl');
    const fileEl = document.getElementById('imageFile');
    const previewEl = document.getElementById('imagePreview');
    
    if (urlEl) urlEl.value = '';
    if (fileEl) fileEl.value = '';
    if (previewEl) previewEl.classList.add('hidden');
    
    updateCharCount();
}

// CRUD operations
function addItem() {
    const prompt = document.getElementById('prompt').value.trim();
    const sref = document.getElementById('sref').value.trim();
    
    if (!prompt) {
        showError('promptError', 'Please enter a prompt');
        return;
    }
    
    if (selectedCategories.length === 0) {
        showError('categoryError', 'Please select at least one category');
        return;
    }
    
    const category = selectedCategories.join(', ');
    
    // Handle file upload (async)
    if (uploadType === 'file') {
        const fileEl = document.getElementById('imageFile');
        if (fileEl && fileEl.files[0]) {
            const file = fileEl.files[0];
            
            // Validate file size
            if (file.size > 5 * 1024 * 1024) {
                showError('fileError', 'File size must be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                saveItemWithImage(prompt, category, sref, e.target.result);
            };
            reader.readAsDataURL(file);
            return;
        }
    }
    
    // Handle URL or no image
    let imageSource = '';
    if (uploadType === 'url') {
        const urlEl = document.getElementById('imageUrl');
        if (urlEl && urlEl.value.trim()) {
            imageSource = urlEl.value.trim();
        }
    }
    
    saveItemWithImage(prompt, category, sref, imageSource);
}

async function saveItemWithImage(prompt, category, sref, image) {
    try {
        if (editingId) {
            // Update existing item in Supabase
            const { error } = await supabase
                .from('prompts')
                .update({
                    prompt: prompt,
                    category: category,
                    sref: sref,
                    image: image
                })
                .eq('id', editingId);
            
            if (error) throw error;
            console.log('Item updated in Supabase');
            editingId = null;
        } else {
            // Create new item in Supabase
            const { error } = await supabase
                .from('prompts')
                .insert([{
                    prompt: prompt,
                    category: category,
                    sref: sref,
                    image: image
                }]);
            
            if (error) throw error;
            console.log('New item added to Supabase');
        }
        
        // Reload items from Supabase
        await loadItems();
        renderGallery();
        toggleForm();
        resetForm();
        updateButtonVisibility();
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Failed to save item. Please try again.');
    }
}

function editItem(id) {
    editingId = id;
    const item = items.find(item => item.id === id);
    
    if (!item) return;
    
    // Populate edit form
    document.getElementById('editPrompt').value = item.prompt;
    document.getElementById('editSref').value = item.sref || '';
    
    // Set selected categories for edit form
    selectedEditCategories = item.category ? item.category.split(', ') : [];
    
    // Reset all edit category buttons first
    const editCategoryButtons = document.querySelectorAll('.edit-category-btn');
    editCategoryButtons.forEach(btn => {
        btn.classList.remove('border-gray-400', 'bg-gray-200', 'text-gray-900');
        btn.classList.add('border-gray-300', 'hover:border-gray-400');
    });
    
    // Set selected buttons
    selectedEditCategories.forEach(category => {
        const button = document.querySelector(`[data-category="${category}"].edit-category-btn`);
        if (button) {
            button.classList.remove('border-gray-300', 'hover:border-gray-400');
            button.classList.add('border-gray-400', 'bg-gray-200', 'text-gray-900');
        }
    });
    
    // Handle image
    if (item.image) {
        if (item.image.startsWith('data:')) {
            // Base64 image
            setEditUploadType('file');
            const preview = document.getElementById('editImagePreview');
            if (preview) {
                preview.src = item.image;
                preview.classList.remove('hidden');
            }
        } else {
            // URL image
            setEditUploadType('url');
            const urlInput = document.getElementById('editImageUrl');
            if (urlInput) urlInput.value = item.image;
        }
    } else {
        setEditUploadType('url');
    }
    
    updateEditCharCount();
    
    // Show edit form modal
    const editFormModal = document.getElementById('editFormModal');
    if (editFormModal) {
        editFormModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeEditForm() {
    const editFormModal = document.getElementById('editFormModal');
    if (editFormModal) {
        editFormModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scroll
    }
    editingId = null;
    resetEditForm();
}

function goToHome() {
    // Close all modals
    const addFormModal = document.getElementById('addFormModal');
    const editFormModal = document.getElementById('editFormModal');
    
    if (addFormModal) addFormModal.classList.add('hidden');
    if (editFormModal) editFormModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
    
    editingId = null;
    
    // Reset filter to show all items
    activeFilters = [];
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-category') === 'All') {
            btn.className = 'filter-btn bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all';
        } else {
            btn.className = 'filter-btn text-gray-600 hover:text-gray-900 px-5 py-2 rounded-lg text-sm font-medium transition-all';
        }
    });
    
    // Render gallery and scroll to top
    renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEditForm() {
    document.getElementById('editPrompt').value = '';
    document.getElementById('editSref').value = '';
    
    // Reset edit category buttons
    selectedEditCategories = [];
    const editCategoryButtons = document.querySelectorAll('.edit-category-btn');
    editCategoryButtons.forEach(btn => {
        btn.classList.remove('border-gray-400', 'bg-gray-200', 'text-gray-900');
        btn.classList.add('border-gray-300', 'hover:border-gray-400');
    });
    
    const urlEl = document.getElementById('editImageUrl');
    const fileEl = document.getElementById('editImageFile');
    const previewEl = document.getElementById('editImagePreview');
    
    if (urlEl) urlEl.value = '';
    if (fileEl) fileEl.value = '';
    if (previewEl) previewEl.classList.add('hidden');
    
    updateEditCharCount();
}

function updateItem() {
    if (!editingId) return;
    
    const prompt = document.getElementById('editPrompt').value.trim();
    const sref = document.getElementById('editSref').value.trim();
    
    if (!prompt) {
        showError('editPromptError', 'Please enter a prompt');
        return;
    }
    
    if (selectedEditCategories.length === 0) {
        showError('editCategoryError', 'Please select at least one category');
        return;
    }
    
    const category = selectedEditCategories.join(', ');
    
    // Handle file upload (async)
    if (uploadType === 'file') {
        const fileEl = document.getElementById('editImageFile');
        if (fileEl && fileEl.files[0]) {
            const file = fileEl.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                showError('editFileError', 'File size must be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                saveUpdatedItem(prompt, category, sref, e.target.result);
            };
            reader.readAsDataURL(file);
            return;
        }
    }
    
    // Handle URL or existing image
    let imageSource = '';
    if (uploadType === 'url') {
        const urlEl = document.getElementById('editImageUrl');
        if (urlEl && urlEl.value.trim()) {
            imageSource = urlEl.value.trim();
        }
    }
    
    // If no new image, keep existing one
    const item = items.find(item => item.id === editingId);
    if (!imageSource && item && item.image) {
        imageSource = item.image;
    }
    
    saveUpdatedItem(prompt, category, sref, imageSource);
}

async function saveUpdatedItem(prompt, category, sref, image) {
    try {
        const { error } = await supabase
            .from('prompts')
            .update({
                prompt: prompt,
                category: category,
                sref: sref,
                image: image
            })
            .eq('id', editingId);
        
        if (error) throw error;
        
        console.log('Item updated in Supabase');
        editingId = null;
        
        // Reload items from Supabase
        await loadItems();
        renderGallery();
        closeEditForm();
        updateButtonVisibility();
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Failed to update item. Please try again.');
    }
}

async function deleteCurrentItem() {
    if (!editingId) return;
    
    if (confirm('Delete this prompt? This cannot be undone.')) {
        try {
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', editingId);
            
            if (error) throw error;
            
            console.log('Item deleted from Supabase');
            editingId = null;
            
            // Reload items from Supabase
            await loadItems();
            renderGallery();
            closeEditForm();
            updateButtonVisibility();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

function updateEditCharCount() {
    const prompt = document.getElementById('editPrompt');
    const count = document.getElementById('editCharCount');
    if (prompt && count) {
        const length = prompt.value.length;
        count.textContent = '(' + length + '/1000)';
        
        if (length > 1000) {
            count.classList.add('text-red-600');
        } else {
            count.classList.remove('text-red-600');
        }
    }
}

function setEditUploadType(type) {
    uploadType = type;
    
    const urlBtn = document.getElementById('editUrlBtn');
    const fileBtn = document.getElementById('editFileBtn');
    const urlInput = document.getElementById('editUrlInput');
    const fileInput = document.getElementById('editFileInput');
    
    if (type === 'url') {
        if (urlBtn) urlBtn.className = 'py-3 px-4 rounded-lg text-sm border-2 border-gray-900 bg-gray-900 text-white transition-all';
        if (fileBtn) fileBtn.className = 'py-3 px-4 rounded-lg text-sm border border-gray-300 hover:border-gray-400 transition-all';
        if (urlInput) urlInput.classList.remove('hidden');
        if (fileInput) fileInput.classList.add('hidden');
    } else {
        if (fileBtn) fileBtn.className = 'py-3 px-4 rounded-lg text-sm border-2 border-gray-900 bg-gray-900 text-white transition-all';
        if (urlBtn) urlBtn.className = 'py-3 px-4 rounded-lg text-sm border border-gray-300 hover:border-gray-400 transition-all';
        if (fileInput) fileInput.classList.remove('hidden');
        if (urlInput) urlInput.classList.add('hidden');
    }
}

function handleEditFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showError('editFileError', 'File size must be less than 5MB');
        event.target.value = '';
        return;
    }
    
    const preview = document.getElementById('editImagePreview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (preview) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
    };
    
    reader.readAsDataURL(file);
}

async function deleteItem(id) {
    if (confirm('Delete this item?')) {
        try {
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            console.log('Item deleted from Supabase');
            
            // Reload items from Supabase
            await loadItems();
            renderGallery();
            updateButtonVisibility();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

// Utility functions
function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Prompt copied!');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy');
    });
}

function copySref(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('_sref copied!');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy');
    });
}

function updateCharCount() {
    const prompt = document.getElementById('prompt');
    const count = document.getElementById('charCount');
    if (prompt && count) {
        const length = prompt.value.length;
        count.textContent = '(' + length + '/1000)';
        
        if (length > 1000) {
            count.classList.add('text-red-600');
        } else {
            count.classList.remove('text-red-600');
        }
    }
}

function showError(id, message) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 3000);
    }
}

// Image handling
function setUploadType(type) {
    uploadType = type;
    
    const urlBtn = document.getElementById('urlBtn');
    const fileBtn = document.getElementById('fileBtn');
    const urlInput = document.getElementById('urlInput');
    const fileInput = document.getElementById('fileInput');
    
    if (type === 'url') {
        if (urlBtn) urlBtn.className = 'py-3 px-4 rounded-lg text-sm border-2 border-gray-900 bg-gray-900 text-white transition-all';
        if (fileBtn) fileBtn.className = 'py-3 px-4 rounded-lg text-sm border border-gray-300 hover:border-gray-400 transition-all';
        if (urlInput) urlInput.classList.remove('hidden');
        if (fileInput) fileInput.classList.add('hidden');
    } else {
        if (fileBtn) fileBtn.className = 'py-3 px-4 rounded-lg text-sm border-2 border-gray-900 bg-gray-900 text-white transition-all';
        if (urlBtn) urlBtn.className = 'py-3 px-4 rounded-lg text-sm border border-gray-300 hover:border-gray-400 transition-all';
        if (fileInput) fileInput.classList.remove('hidden');
        if (urlInput) urlInput.classList.add('hidden');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showError('fileError', 'File size must be less than 5MB');
        event.target.value = '';
        return;
    }
    
    // Show preview
    const preview = document.getElementById('imagePreview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (preview) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
    };
    
    reader.readAsDataURL(file);
}

// Filtering
let activeFilters = [];

function filterItems(category) {
    if (category === 'All') {
        // Clear all filters
        activeFilters = [];
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const cat = btn.getAttribute('data-category');
            if (cat === 'All') {
                btn.className = 'filter-btn bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all';
            } else {
                btn.className = 'filter-btn text-gray-600 hover:text-gray-900 px-5 py-2 rounded-lg text-sm font-medium transition-all';
            }
        });
    } else {
        const index = activeFilters.indexOf(category);
        const button = document.querySelector(`.filter-btn[data-category="${category}"]`);
        const allButton = document.querySelector('.filter-btn[data-category="All"]');
        
        if (index > -1) {
            // Remove filter
            activeFilters.splice(index, 1);
            button.className = 'filter-btn text-gray-600 hover:text-gray-900 px-5 py-2 rounded-lg text-sm font-medium transition-all';
            
            // If no filters, activate All
            if (activeFilters.length === 0) {
                allButton.className = 'filter-btn bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all';
            }
        } else {
            // Add filter
            activeFilters.push(category);
            button.className = 'filter-btn bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all';
            
            // Deactivate All button
            allButton.className = 'filter-btn text-gray-600 hover:text-gray-900 px-5 py-2 rounded-lg text-sm font-medium transition-all';
        }
    }
    
    renderGallery();
}

// Main render function
function renderGallery() {
    const gallery = document.getElementById('gallery');
    const count = document.getElementById('itemCount');
    
    if (!gallery || !count) return;
    
    // Filter items - check if item has any of the active filters
    const filteredItems = activeFilters.length === 0
        ? items 
        : items.filter(item => {
            const categories = item.category ? item.category.split(', ') : [];
            // Item must have at least one of the active filters
            return activeFilters.some(filter => categories.includes(filter));
        });
    
    count.textContent = items.length;
    
    // Empty state
    if (filteredItems.length === 0) {
        const emptyMessage = activeFilters.length === 0
            ? '<h3 class=\"text-xl mb-4\">No prompts yet</h3><button onclick=\"toggleForm()\" class=\"bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all\">Add Your First Prompt</button>'
            : '<p class=\"text-gray-400\">No prompts in selected categories</p>';
        
        gallery.innerHTML = '<div class=\"col-span-full text-center py-24\">' + emptyMessage + '</div>';
        return;
    }
    
    // Render items
    gallery.innerHTML = filteredItems.map(item => createItemCard(item)).join('');
}

function createItemCard(item) {
    // Image HTML with fallback
    const imageHtml = item.image 
        ? '<img src=\"' + escapeHtml(item.image) + '\" alt=\"Prompt image\" class=\"w-full h-full object-cover\" onerror=\"this.style.display=\'none\';\">'
        : '<div class=\"w-full h-full bg-gray-100 flex items-center justify-center\"><svg class=\"w-12 h-12 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\"></path></svg></div>';
    
    // Category badges
    const categories = item.category ? item.category.split(', ') : [];
    const categoryBadges = categories.map(cat => 
        '<span class=\"inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded\">' + escapeHtml(cat) + '</span>'
    ).join(' ');
    
    // Escape prompt for safe HTML insertion
    const escapedPrompt = escapeHtml(item.prompt);
    const jsEscapedPrompt = item.prompt.replace(/'/g, "\\\\'").replace(/\"/g, '&quot;').replace(/\n/g, '\\\\n');
    const jsEscapedSref = item.sref ? item.sref.replace(/'/g, "\\\\'").replace(/\"/g, '&quot;').replace(/\n/g, '\\\\n') : '';
    
    return '<div class=\"bg-white rounded-xl shadow-lg overflow-hidden group relative hover:shadow-xl transition-all\">' +
        '<div class=\"aspect-square relative\">' +
        imageHtml +
        '<div class=\"absolute top-3 left-3 right-3 flex flex-wrap gap-1\">' +
        categoryBadges +
        '</div>' +
        '<div class=\"absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end justify-center pb-6 gap-2\">' +
        (item.sref ? '<button onclick=\"copySref(\'' + jsEscapedSref + '\')\" ' +
        'class=\"bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
        '_sref</button>' : '') +
        '<button onclick=\"copyPrompt(\'' + jsEscapedPrompt + '\')\" ' +
        'class=\"bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
        'prompt</button>' +
        '<button onclick=\"editItem(' + item.id + ')\" ' +
        'class=\"bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
        'edit</button>' +
        '</div>' +
        '</div>' +
        '</div>';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Import/Export functionality
function exportData() {
    try {
        const dataStr = JSON.stringify(items, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = 'prompt-gallery-backup-' + timestamp + '.json';
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export data');
    }
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                items = imported;
                saveItems();
                renderGallery();
                updateButtonVisibility();
                alert('Data imported successfully! (' + items.length + ' items)');
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Button visibility management
function updateButtonVisibility() {
    const hasItems = items.length > 0;
    
    // Import button always visible (for development)
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.classList.remove('hidden');
    
    // Export only visible when items exist
    const exportBtn = document.getElementById('exportBtn');
    
    if (exportBtn) {
        hasItems ? exportBtn.classList.remove('hidden') : exportBtn.classList.add('hidden');
    }
}

// Supabase Realtime subscription for cross-device sync
function subscribeToRealtime() {
    supabase
        .channel('prompts-channel')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'prompts'
            },
            async (payload) => {
                console.log('Realtime update received:', payload);
                
                // Reload data from Supabase when any change occurs
                await loadItems();
                renderGallery();
                updateButtonVisibility();
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime subscription active - syncing across devices');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Realtime subscription error');
            }
        });
}
