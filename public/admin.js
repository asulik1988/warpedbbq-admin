// Warped BBQ Admin Panel - Client-side Logic

let menuItems = [];
let currentEditId = null;
let reorderMode = false;

// Check authentication on page load
(async function checkAuth() {
  try {
    const response = await fetch('/api/admin/menu', {
      credentials: 'include'
    });

    if (!response.ok) {
      window.location.href = '/';
      return;
    }

    // Load initial data
    await loadMenuItems();

  } catch (error) {
    window.location.href = '/';
  }
})();

// Logout
async function logout() {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  window.location.href = '/';
}

// Navigation
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;

    // Update active link
    document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Show section
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`section-${section}`).classList.remove('hidden');

    // Load section data
    if (section === 'inventory') loadInventory();
    if (section === 'schedules') loadSchedules();
  });
});

// Show alert
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);

  setTimeout(() => alert.remove(), 5000);
}

// Load menu items
async function loadMenuItems() {
  try {
    const response = await fetch('/api/admin/menu', {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load menu');

    const data = await response.json();
    menuItems = data.data || [];

    renderMenuTable();

  } catch (error) {
    showAlert('Error loading menu items: ' + error.message, 'danger');
  }
}

// Render menu table
function renderMenuTable() {
  const tbody = document.getElementById('menuTableBody');

  if (menuItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No menu items found</td></tr>';
    return;
  }

  tbody.innerHTML = menuItems.map(item => `
    <tr ${reorderMode ? 'draggable="true" class="draggable"' : ''} data-id="${item.id}">
      <td>${item.displayOrder}</td>
      <td><strong>${item.title}</strong></td>
      <td><span class="badge badge-info">${item.category}</span></td>
      <td>${item.tag || '-'}</td>
      <td>
        <span class="badge badge-${item.isActive ? 'success' : 'danger'}">
          ${item.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem(${item.id})">Edit</button>
        <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    </tr>
  `).join('');

  if (reorderMode) {
    setupDragAndDrop();
  }
}

// Open add modal
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('itemModal').classList.add('active');
}

// Edit item
function editItem(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Menu Item';
  document.getElementById('itemId').value = item.id;
  document.getElementById('title').value = item.title;
  document.getElementById('description').value = item.description;
  document.getElementById('category').value = item.category;
  document.getElementById('tag').value = item.tag || '';
  document.getElementById('displayOrder').value = item.displayOrder;
  document.getElementById('isActive').value = item.isActive ? '1' : '0';
  document.getElementById('imageUrl').value = item.imageUrl || '';

  if (item.imageUrl) {
    const preview = document.getElementById('imagePreview');
    preview.src = item.imageUrl;
    preview.classList.remove('hidden');
  }

  document.getElementById('itemModal').classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('itemModal').classList.remove('active');
  currentEditId = null;
}

// Preview image
function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('imagePreview');
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Save item
document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const saveText = document.getElementById('saveText');
  const saveLoading = document.getElementById('saveLoading');
  saveText.classList.add('hidden');
  saveLoading.classList.remove('hidden');

  try {
    let imageUrl = document.getElementById('imageUrl').value;

    // Upload image if new file selected
    const imageFile = document.getElementById('imageFile').files[0];
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const itemData = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      category: document.getElementById('category').value,
      tag: document.getElementById('tag').value || null,
      displayOrder: parseInt(document.getElementById('displayOrder').value),
      isActive: parseInt(document.getElementById('isActive').value),
      imageUrl: imageUrl || null
    };

    const itemId = document.getElementById('itemId').value;
    const method = itemId ? 'PUT' : 'POST';
    const url = itemId ? `/api/admin/menu/${itemId}` : '/api/admin/menu';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(itemData)
    });

    if (!response.ok) throw new Error('Failed to save item');

    showAlert(itemId ? 'Item updated successfully' : 'Item added successfully');
    closeModal();
    await loadMenuItems();

  } catch (error) {
    showAlert('Error saving item: ' + error.message, 'danger');
  } finally {
    saveText.classList.remove('hidden');
    saveLoading.classList.add('hidden');
  }
});

// Upload image to R2
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/admin/upload-image', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  if (!response.ok) throw new Error('Failed to upload image');

  const data = await response.json();
  return data.data.url;
}

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  try {
    const response = await fetch(`/api/admin/menu/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete item');

    showAlert('Item deleted successfully');
    await loadMenuItems();

  } catch (error) {
    showAlert('Error deleting item: ' + error.message, 'danger');
  }
}

// Reorder mode
function toggleReorderMode() {
  reorderMode = !reorderMode;
  renderMenuTable();
}

// Drag and drop for reordering
function setupDragAndDrop() {
  const rows = document.querySelectorAll('#menuTableBody tr');

  rows.forEach(row => {
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  if (draggedElement !== this) {
    const allRows = Array.from(document.querySelectorAll('#menuTableBody tr'));
    const draggedIndex = allRows.indexOf(draggedElement);
    const targetIndex = allRows.indexOf(this);

    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
  }

  return false;
}

function handleDragEnd() {
  this.classList.remove('dragging');
  saveNewOrder();
}

// Save new order
async function saveNewOrder() {
  const rows = document.querySelectorAll('#menuTableBody tr');
  const newOrder = Array.from(rows).map((row, index) => ({
    id: parseInt(row.dataset.id),
    displayOrder: index + 1
  }));

  try {
    const response = await fetch('/api/admin/menu/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ order: newOrder })
    });

    if (!response.ok) throw new Error('Failed to save order');

    showAlert('Order updated successfully');
    await loadMenuItems();

  } catch (error) {
    showAlert('Error updating order: ' + error.message, 'danger');
  }
}

// Load inventory
async function loadInventory() {
  try {
    const response = await fetch('/api/admin/menu', {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load inventory');

    const data = await response.json();
    const items = data.data || [];

    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = items.map(item => `
      <div class="card">
        <h3>${item.title}</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Current Stock</label>
            <input type="number" value="${item.inventory?.currentStock || ''}"
                   placeholder="Leave blank for unlimited"
                   onchange="updateInventory(${item.id}, 'currentStock', this.value)">
          </div>
          <div class="form-group">
            <label>Low Stock Threshold</label>
            <input type="number" value="${item.inventory?.lowStockThreshold || 5}"
                   onchange="updateInventory(${item.id}, 'lowStockThreshold', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" ${item.inventory?.isSoldOut ? 'checked' : ''}
                   onchange="updateInventory(${item.id}, 'isSoldOut', this.checked ? 1 : 0)">
            Mark as Sold Out
          </label>
        </div>
      </div>
    `).join('');

  } catch (error) {
    showAlert('Error loading inventory: ' + error.message, 'danger');
  }
}

// Update inventory
async function updateInventory(itemId, field, value) {
  try {
    const payload = { [field]: value === '' ? null : value };

    const response = await fetch(`/api/admin/inventory/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to update inventory');

    showAlert('Inventory updated successfully');

  } catch (error) {
    showAlert('Error updating inventory: ' + error.message, 'danger');
  }
}

// Load schedules
async function loadSchedules() {
  // Placeholder for schedules functionality
  const container = document.getElementById('schedulesContainer');
  container.innerHTML = '<div class="card"><p>Schedule management coming soon!</p></div>';
}

// Clear cache
async function clearCache() {
  if (!confirm('This will clear the cache and update the main site. Continue?')) return;

  try {
    const response = await fetch('/api/admin/cache/purge', {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to clear cache');

    const data = await response.json();

    document.getElementById('cacheStatus').innerHTML = `
      <div class="alert alert-success">
        Cache cleared successfully!<br>
        New cache version: ${data.data.cacheVersion}<br>
        Time: ${new Date(data.data.timestamp).toLocaleString()}
      </div>
    `;

    showAlert('Cache cleared successfully!');

  } catch (error) {
    showAlert('Error clearing cache: ' + error.message, 'danger');
  }
}
