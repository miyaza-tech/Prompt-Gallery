// Global state management
let items = [];
let currentFilter = 'All';
let uploadType = 'url';
let editingId = null;
let useSupabase = false; // Supabase 사용 여부
let isAdmin = false; // 관리자 여부
const ADMIN_EMAILS = [
    'miyaza@naver.com'
]; // 관리자 이메일 목록

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App initializing...');
    console.log('Supabase available:', typeof supabase !== 'undefined');
    console.log('SUPABASE_URL:', typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : 'undefined');
    
    // Supabase 연결 확인
    try {
        if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            useSupabase = true;
            console.log('✓ Supabase mode enabled');
            
            // Auth 상태 변경 리스너
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session ? 'User: ' + session.user.email : 'No user');
                console.log('Processing auth state change...');
                
                // 로그인 모달 닫기
                if (event === 'SIGNED_IN') {
                    const modal = document.getElementById('loginModal');
                    if (modal && !modal.classList.contains('hidden')) {
                        closeLoginModal();
                    }
                }
                
                // 항상 관리자 상태 재확인
                console.log('Calling checkAdminStatus from auth listener...');
                await checkAdminStatus();
                console.log('Calling updateUIForAdminMode from auth listener...');
                updateUIForAdminMode();
                
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    console.log('Calling renderGallery from auth listener...');
                    renderGallery();
                }
                
                console.log('Auth state change processing complete');
            });
            
            // 초기 관리자 확인
            await checkAdminStatus();
            
            await loadItemsFromSupabase();
        } else {
            console.log('✓ localStorage mode enabled (Supabase not configured)');
            loadItems();
        }
    } catch (error) {
        console.error('Supabase initialization failed, using localStorage:', error);
        loadItems();
    }
    
    renderGallery();
    updateButtonVisibility();
    updateUIForAdminMode();
    
    console.log('App initialized. useSupabase:', useSupabase, 'isAdmin:', isAdmin);
});

// Admin authentication
async function checkAdminStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('checkAdminStatus - user:', user ? user.email : 'null', 'ADMIN_EMAILS:', ADMIN_EMAILS);
        
        if (user && ADMIN_EMAILS.includes(user.email)) {
            isAdmin = true;
            console.log('✓ Admin authenticated:', user.email);
        } else {
            isAdmin = false;
            console.log('✗ Read-only mode', user ? '(user: ' + user.email + ')' : '(no user)');
        }
        
        console.log('isAdmin is now:', isAdmin);
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }
}

// Show login modal
function showLoginModal() {
    console.log('showLoginModal called');
    const modal = document.getElementById('loginModal');
    if (!modal) {
        console.error('Login modal not found!');
        return;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').classList.add('hidden');
}

// Login with email and password
async function loginAdmin() {
    console.log('loginAdmin called');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    console.log('Email:', email);
    console.log('Supabase available:', typeof supabase !== 'undefined');
    
    if (!email || !password) {
        errorEl.textContent = 'Please enter both email and password';
        errorEl.classList.remove('hidden');
        return;
    }
    
    try {
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('Login successful:', data);
        closeLoginModal();
        
        // 로그인 성공 후 즉시 UI 업데이트
        setTimeout(async () => {
            await checkAdminStatus();
            updateUIForAdminMode();
            renderGallery();
        }, 500); // Auth 상태 업데이트를 위한 짧은 딜레이
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Login failed: ' + error.message;
        errorEl.classList.remove('hidden');
    }
}

// Legacy function for compatibility
async function loginAsAdmin() {
    showLoginModal();
}

async function logoutAdmin() {
    try {
        await supabase.auth.signOut();
        // 페이지 새로고침으로 확실하게 UI 업데이트
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

function updateUIForAdminMode() {
    console.log('updateUIForAdminMode called - useSupabase:', useSupabase, 'isAdmin:', isAdmin);
    
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const newItemBtn = document.getElementById('newItemBtn');
    const addFormContainer = document.getElementById('addForm');
    
    console.log('Buttons found:', {
        loginBtn: !!loginBtn,
        logoutBtn: !!logoutBtn,
        newItemBtn: !!newItemBtn
    });
    
    if (useSupabase && !isAdmin) {
        // 읽기 전용 모드 - 로그인 버튼만 표시
        console.log('→ Setting READ-ONLY mode');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (newItemBtn) newItemBtn.classList.add('hidden');
        if (addFormContainer) addFormContainer.classList.add('hidden');
    } else if (useSupabase && isAdmin) {
        // 관리자 모드 - 로그아웃, New Item 버튼 표시
        console.log('→ Setting ADMIN mode');
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (newItemBtn) newItemBtn.classList.remove('hidden');
    } else if (!useSupabase) {
        // localStorage 모드 - 모든 기능 사용 가능
        console.log('→ Setting localStorage mode');
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (newItemBtn) newItemBtn.classList.remove('hidden');
    }
}

// Supabase functions
async function loadItemsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('prompts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Supabase 데이터를 기존 형식으로 변환
        items = data.map(item => ({
            id: item.id,
            prompt: item.prompt,
            category: item.category,
            image: item.image || '',
            srefCode: item.sref_code || '',
            createdAt: item.created_at
        }));
        
        console.log('Loaded from Supabase:', items.length, 'items');
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        alert('Failed to load data from database. Check console for details.');
    }
}

async function saveItemToSupabase(item) {
    try {
        const { data, error } = await supabase
            .from('prompts')
            .insert([{
                prompt: item.prompt,
                category: item.category,
                image: item.image || null,
                sref_code: item.srefCode || null
            }])
            .select();
        
        if (error) throw error;
        
        // 새로 생성된 ID로 업데이트
        return data[0];
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        alert('Failed to save to database: ' + error.message);
        throw error;
    }
}

async function updateItemInSupabase(id, updates) {
    try {
        const { error } = await supabase
            .from('prompts')
            .update({
                prompt: updates.prompt,
                category: updates.category,
                image: updates.image || null,
                sref_code: updates.srefCode || null
            })
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error updating in Supabase:', error);
        alert('Failed to update in database: ' + error.message);
        throw error;
    }
}

async function deleteItemFromSupabase(id) {
    try {
        const { error } = await supabase
            .from('prompts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting from Supabase:', error);
        alert('Failed to delete from database: ' + error.message);
        throw error;
    }
}

// localStorage persistence
function loadItems() {
    try {
        const saved = localStorage.getItem('promptGalleryItems');
        items = saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading items:', error);
        items = [];
    }
}

function saveItems() {
    if (useSupabase) return; // Supabase 모드에서는 사용 안 함
    
    try {
        localStorage.setItem('promptGalleryItems', JSON.stringify(items));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please export and clear some items.');
        }
        console.error('Error saving items:', error);
    }
}

// Form management
function toggleForm() {
    const form = document.getElementById('addForm');
    const btn = document.getElementById('addBtnText');
    const submitBtn = document.getElementById('submitBtnText');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.textContent = editingId ? 'Cancel Edit' : 'Close';
        if (submitBtn) submitBtn.textContent = editingId ? 'Update Prompt' : 'Add Prompt';
    } else {
        form.classList.add('hidden');
        btn.textContent = 'New Item';
        if (submitBtn) submitBtn.textContent = 'Add Prompt';
        editingId = null;
        resetForm();
    }
}

function resetForm() {
    document.getElementById('prompt').value = '';
    document.getElementById('category').value = 'Nano';
    document.getElementById('srefCode').value = '';
    
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
    const category = document.getElementById('category').value;
    const srefCode = document.getElementById('srefCode').value.trim();
    
    if (!prompt) {
        showError('promptError', 'Please enter a prompt');
        return;
    }
    
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
                saveItemWithImage(prompt, category, e.target.result, srefCode);
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
    
    saveItemWithImage(prompt, category, imageSource, srefCode);
}

async function saveItemWithImage(prompt, category, image, srefCode) {
    if (useSupabase) {
        // Supabase 모드
        try {
            if (editingId) {
                // Update existing item
                await updateItemInSupabase(editingId, {
                    prompt: prompt,
                    category: category,
                    image: image,
                    srefCode: srefCode || ''
                });
                
                const itemIndex = items.findIndex(item => item.id === editingId);
                if (itemIndex !== -1) {
                    items[itemIndex] = {
                        ...items[itemIndex],
                        prompt: prompt,
                        category: category,
                        image: image,
                        srefCode: srefCode || ''
                    };
                }
                editingId = null;
            } else {
                // Create new item
                const newItem = await saveItemToSupabase({
                    prompt: prompt,
                    category: category,
                    image: image,
                    srefCode: srefCode || ''
                });
                
                items.unshift({
                    id: newItem.id,
                    prompt: newItem.prompt,
                    category: newItem.category,
                    image: newItem.image || '',
                    srefCode: newItem.sref_code || '',
                    createdAt: newItem.created_at
                });
            }
        } catch (error) {
            console.error('Failed to save:', error);
            return;
        }
    } else {
        // localStorage 모드
        if (editingId) {
            // Update existing item
            const itemIndex = items.findIndex(item => item.id === editingId);
            if (itemIndex !== -1) {
                items[itemIndex] = {
                    ...items[itemIndex],
                    prompt: prompt,
                    category: category,
                    image: image,
                    srefCode: srefCode || ''
                };
            }
            editingId = null;
        } else {
            // Create new item
            const newItem = {
                id: Date.now(),
                prompt: prompt,
                category: category,
                image: image,
                srefCode: srefCode || '',
                createdAt: new Date().toISOString()
            };
            items.unshift(newItem);
        }
        saveItems();
    }
    
    renderGallery();
    toggleForm();
    resetForm();
    updateButtonVisibility();
}

function editItem(id) {
    editingId = id;
    const item = items.find(item => item.id === id);
    
    if (!item) return;
    
    // Populate edit form
    document.getElementById('editPrompt').value = item.prompt;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editSrefCode').value = item.srefCode || '';
    
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
    
    // Show edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.classList.remove('hidden');
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function closeEditForm() {
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.classList.add('hidden');
    }
    editingId = null;
    resetEditForm();
}

function goToHome() {
    // Close all forms
    const addForm = document.getElementById('addForm');
    const editForm = document.getElementById('editForm');
    
    if (addForm) addForm.classList.add('hidden');
    if (editForm) editForm.classList.add('hidden');
    
    editingId = null;
    
    // Reset filter to show all items
    currentFilter = 'All';
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
    document.getElementById('editCategory').value = 'Nano';
    document.getElementById('editSrefCode').value = '';
    
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
    const category = document.getElementById('editCategory').value;
    const srefCode = document.getElementById('editSrefCode').value.trim();
    
    if (!prompt) {
        showError('editPromptError', 'Please enter a prompt');
        return;
    }
    
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
                saveUpdatedItem(prompt, category, e.target.result, srefCode);
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
    
    saveUpdatedItem(prompt, category, imageSource, srefCode);
}

async function saveUpdatedItem(prompt, category, image, srefCode) {
    const itemIndex = items.findIndex(item => item.id === editingId);
    if (itemIndex !== -1) {
        if (useSupabase) {
            try {
                await updateItemInSupabase(editingId, {
                    prompt: prompt,
                    category: category,
                    image: image,
                    srefCode: srefCode || ''
                });
            } catch (error) {
                console.error('Failed to update:', error);
                return;
            }
        }
        
        items[itemIndex] = {
            ...items[itemIndex],
            prompt: prompt,
            category: category,
            image: image,
            srefCode: srefCode || ''
        };
    }
    
    editingId = null;
    if (!useSupabase) saveItems();
    renderGallery();
    closeEditForm();
    updateButtonVisibility();
}

async function deleteCurrentItem() {
    if (!editingId) return;
    
    if (confirm('Delete this prompt? This cannot be undone.')) {
        if (useSupabase) {
            try {
                await deleteItemFromSupabase(editingId);
            } catch (error) {
                console.error('Failed to delete:', error);
                return;
            }
        }
        
        items = items.filter(item => item.id !== editingId);
        editingId = null;
        if (!useSupabase) saveItems();
        renderGallery();
        closeEditForm();
        updateButtonVisibility();
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
        if (useSupabase) {
            await deleteItemFromSupabase(id);
        } else {
            items = items.filter(item => item.id !== id);
            saveItems();
        }
        renderGallery();
        updateButtonVisibility();
    }
}

// Utility functions
function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied!');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy');
    });
}

function copySref(srefCode) {
    const srefText = '--sref ' + srefCode;
    navigator.clipboard.writeText(srefText).then(() => {
        alert('Sref code copied!');
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
function filterItems(category) {
    currentFilter = category;
    
    // Update button styles
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.className = 'filter-btn bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all';
        } else {
            btn.className = 'filter-btn text-gray-600 hover:text-gray-900 px-5 py-2 rounded-lg text-sm font-medium transition-all';
        }
    });
    
    renderGallery();
}

// Main render function
function renderGallery() {
    const gallery = document.getElementById('gallery');
    const count = document.getElementById('itemCount');
    
    if (!gallery || !count) return;
    
    // Filter items
    const filteredItems = currentFilter === 'All' 
        ? items 
        : items.filter(item => item.category === currentFilter);
    
    count.textContent = items.length;
    
    // Empty state
    if (filteredItems.length === 0) {
        const emptyMessage = currentFilter === 'All'
            ? '<h3 class=\"text-xl mb-4\">No prompts yet</h3><button onclick=\"toggleForm()\" class=\"bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all\">Add Your First Prompt</button>'
            : '<p class=\"text-gray-400\">No prompts in this category</p>';
        
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
    
    // Escape prompt for safe HTML insertion
    const escapedPrompt = escapeHtml(item.prompt);
    const jsEscapedPrompt = item.prompt.replace(/'/g, "\\\\'").replace(/\"/g, '&quot;').replace(/\n/g, '\\\\n');
    
    // Create sref button if sref code exists
    const srefButton = item.srefCode 
        ? '<button onclick=\"copySref(\'' + escapeHtml(item.srefCode).replace(/'/g, "\\\\'") + '\')\" ' +
          'class=\"bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
          '_serf</button>'
        : '';
    
    // Edit button only for admin in Supabase mode
    const editButton = (!useSupabase || isAdmin)
        ? '<button onclick=\"editItem(' + item.id + ')\" ' +
          'class=\"bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
          'edit</button>'
        : '';
    
    return '<div class=\"bg-white rounded-xl shadow-lg overflow-hidden group relative hover:shadow-xl transition-all\">' +
        '<div class=\"aspect-square relative\">' +
        imageHtml +
        '<div class=\"absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end justify-center pb-6 gap-3\">' +
        srefButton +
        '<button onclick=\"copyPrompt(\'' + jsEscapedPrompt + '\')\" ' +
        'class=\"bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-gray-800\">' +
        'prompt</button>' +
        editButton +
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

function clearAll() {
    if (confirm('Are you sure you want to delete all prompts? This cannot be undone.')) {
        items = [];
        saveItems();
        renderGallery();
        updateButtonVisibility();
    }
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
