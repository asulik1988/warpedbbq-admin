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
    if (section === 'batches') loadBatches();
    if (section === 'orders') loadOrders();
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
  if (!confirm('This will clear the cache and update the site. Continue?')) return;

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
        ${data.data.cloudflareCleared ? '<br>✅ Cloudflare CDN cache purged' : ''}
      </div>
    `;

    showAlert('Cache cleared successfully!');

  } catch (error) {
    showAlert('Error clearing cache: ' + error.message, 'danger');
  }
}

// ===== BATCH MANAGEMENT =====

let batches = [];

// Load batches
async function loadBatches() {
  try {
    const response = await fetch('/api/admin/batches', {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load batches');

    const data = await response.json();
    batches = data.data || [];

    renderBatchesTable();

  } catch (error) {
    showAlert('Error loading batches: ' + error.message, 'danger');
  }
}

// Render batches table
function renderBatchesTable() {
  const tbody = document.getElementById('batchesTableBody');

  if (batches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No batches found. Create your first batch!</td></tr>';
    return;
  }

  tbody.innerHTML = batches.map(batch => {
    const pickupDate = new Date(batch.pickup_date || batch.pickupDate).toLocaleDateString();
    const cutoffDate = new Date(batch.cutoff_date || batch.cutoffDate).toLocaleString();
    const pickupTimeStart = batch.pickup_time_start || batch.pickupTimeStart || '';
    const pickupTimeEnd = batch.pickup_time_end || batch.pickupTimeEnd || '';
    const statusBadge = {
      'open': 'badge-success',
      'closed': 'badge-warning',
      'fulfilled': 'badge-info'
    }[batch.status] || 'badge-secondary';

    return `
      <tr>
        <td><strong>${batch.name}</strong></td>
        <td>${pickupDate}</td>
        <td>${pickupTimeStart} - ${pickupTimeEnd}</td>
        <td>${cutoffDate}</td>
        <td>${batch.orderCount || 0}</td>
        <td><span class="badge ${statusBadge}">${batch.status}</span></td>
        <td>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editBatch(${batch.id})">Edit</button>
          <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="deleteBatch(${batch.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open batch modal
function openBatchModal() {
  document.getElementById('batchModalTitle').textContent = 'Create Pickup Batch';
  document.getElementById('batchForm').reset();
  document.getElementById('batchId').value = '';

  // Set default cutoff date to 7 days from now
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  document.getElementById('pickupDate').valueAsDate = sevenDaysLater;
  document.getElementById('cutoffDate').value = now.toISOString().slice(0, 16);

  document.getElementById('batchModal').classList.add('active');
}

// Close batch modal
function closeBatchModal() {
  document.getElementById('batchModal').classList.remove('active');
}

// Edit batch
function editBatch(id) {
  const batch = batches.find(b => b.id === id);
  if (!batch) return;

  document.getElementById('batchModalTitle').textContent = 'Edit Pickup Batch';
  document.getElementById('batchId').value = batch.id;
  document.getElementById('batchName').value = batch.name;
  document.getElementById('pickupDate').value = batch.pickup_date || batch.pickupDate;
  document.getElementById('pickupTimeStart').value = batch.pickup_time_start || batch.pickupTimeStart;
  document.getElementById('pickupTimeEnd').value = batch.pickup_time_end || batch.pickupTimeEnd;

  // Convert cutoffDate to local datetime for input
  const cutoffDate = new Date(batch.cutoff_date || batch.cutoffDate);
  document.getElementById('cutoffDate').value = cutoffDate.toISOString().slice(0, 16);

  document.getElementById('maxCapacity').value = batch.max_capacity || batch.maxCapacity || '';
  document.getElementById('batchStatus').value = batch.status;

  document.getElementById('batchModal').classList.add('active');
}

// Save batch
document.getElementById('batchForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const saveText = document.getElementById('batchSaveText');
  const saveLoading = document.getElementById('batchSaveLoading');
  saveText.classList.add('hidden');
  saveLoading.classList.remove('hidden');

  try {
    const batchData = {
      name: document.getElementById('batchName').value,
      pickupDate: document.getElementById('pickupDate').value,
      pickupTimeStart: document.getElementById('pickupTimeStart').value,
      pickupTimeEnd: document.getElementById('pickupTimeEnd').value,
      cutoffDate: new Date(document.getElementById('cutoffDate').value).toISOString(),
      maxCapacity: document.getElementById('maxCapacity').value || null,
      status: document.getElementById('batchStatus').value
    };

    const batchId = document.getElementById('batchId').value;
    const method = batchId ? 'PUT' : 'POST';
    const url = batchId ? `/api/admin/batches/${batchId}` : '/api/admin/batches';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(batchData)
    });

    if (!response.ok) throw new Error('Failed to save batch');

    showAlert(batchId ? 'Batch updated successfully' : 'Batch created successfully');
    closeBatchModal();
    await loadBatches();

  } catch (error) {
    showAlert('Error saving batch: ' + error.message, 'danger');
  } finally {
    saveText.classList.remove('hidden');
    saveLoading.classList.add('hidden');
  }
});

// Delete batch
async function deleteBatch(id) {
  if (!confirm('Are you sure you want to delete this batch? This cannot be undone.')) return;

  try {
    const response = await fetch(`/api/admin/batches/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete batch');

    showAlert('Batch deleted successfully');
    await loadBatches();

  } catch (error) {
    showAlert('Error deleting batch: ' + error.message, 'danger');
  }
}

// ===== ORDER MANAGEMENT =====

let orders = [];
let allOrders = [];

// Load orders
async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders', {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load orders');

    const data = await response.json();
    allOrders = data.data || [];
    orders = allOrders;

    // Populate batch filter
    const batchFilter = document.getElementById('filterBatch');
    const uniqueBatches = [...new Set(allOrders.map(o => o.batchName))];
    batchFilter.innerHTML = '<option value="">All Batches</option>' +
      uniqueBatches.map(name => `<option value="${name}">${name}</option>`).join('');

    renderOrdersTable();

  } catch (error) {
    showAlert('Error loading orders: ' + error.message, 'danger');
  }
}

// Filter orders
function filterOrders() {
  const batchFilter = document.getElementById('filterBatch').value;
  const statusFilter = document.getElementById('filterStatus').value;

  orders = allOrders.filter(order => {
    const matchBatch = !batchFilter || order.batchName === batchFilter;
    const matchStatus = !statusFilter || order.status === statusFilter;
    return matchBatch && matchStatus;
  });

  renderOrdersTable();
}

// Render orders table
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const statusBadge = {
      'pending': 'badge-warning',
      'paid': 'badge-success',
      'fulfilled': 'badge-info',
      'cancelled': 'badge-danger'
    }[order.status] || 'badge-secondary';

    const createdDate = new Date(order.createdAt).toLocaleDateString();

    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${order.customerName}<br><small>${order.customerEmail}</small></td>
        <td>${order.batchName}</td>
        <td>$${parseFloat(order.subtotal).toFixed(2)}</td>
        <td>$${parseFloat(order.tax).toFixed(2)}</td>
        <td>$${parseFloat(order.total).toFixed(2)}</td>
        <td><span class="badge ${statusBadge}">${order.status}</span></td>
        <td>${createdDate}</td>
        <td>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="viewOrderDetails(${order.id})">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

// View order details (placeholder)
function viewOrderDetails(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  alert(`Order #${orderId}\n\nCustomer: ${order.customerName}\nEmail: ${order.customerEmail}\n\nSubtotal: $${parseFloat(order.subtotal).toFixed(2)}\nTax (7.35%): $${parseFloat(order.tax).toFixed(2)}\nTotal: $${parseFloat(order.total).toFixed(2)}\n\nStatus: ${order.status}\n\nFull order details coming soon!`);
}
