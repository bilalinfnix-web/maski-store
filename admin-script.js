here// إدارة لوحة التحكم

// تبديل الأقسام
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const sectionId = this.getAttribute('href').substring(1);
        
        // إخفاء جميع الأقسام
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إزالة النشاط من جميع الروابط
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // إظهار القسم المطلوب
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.classList.add('active');
        }
    });
});

// تبديل تبويبات المنتجات
function showProductTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // هنا يمكنك تحميل المنتجات حسب النوع
    loadProductsByCategory(tabName);
}

// إضافة منتج جديد
function addProduct() {
    const product = {
        title: document.getElementById('product-title').value,
        description: document.getElementById('product-desc').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        image_url: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value
    };
    
    // هنا سيتم إرسال المنتج إلى Supabase
    console.log('Adding product:', product);
    alert('تم إضافة المنتج بنجاح!');
    
    // مسح الحقول
    document.getElementById('product-title').value = '';
    document.getElementById('product-desc').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-image').value = '';
}

// تغيير كلمة مرور الأدمن
function changePassword() {
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    // هنا سيتم تغيير كلمة المرور في Supabase
    localStorage.setItem('adminToken', newPassword);
    alert('تم تغيير كلمة المرور بنجاح!');
    document.getElementById('new-password').value = '';
}

// تسجيل خروج الأدمن
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// تحميل الطلبات
async function loadOrders() {
    // محاكاة للبيانات
    const orders = [
        { id: 'ORD-001', product: 'حساب فري فاير VIP', price: '$49.99', status: 'مكتمل', date: '2024-01-15' },
        { id: 'ORD-002', product: '1000 جوهرة', price: '$9.99', status: 'قيد الانتظار', date: '2024-01-15' },
        { id: 'ORD-003', product: '5000 متابع', price: '$79.99', status: 'معلق', date: '2024-01-14' }
    ];
    
    const tbody = document.getElementById('orders-body');
    if (tbody) {
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.product}</td>
                <td>${order.price}</td>
                <td><span class="status-${order.status === 'مكتمل' ? 'success' : 'warning'}">${order.status}</span></td>
                <td>${order.date}</td>
                <td>
                    <button class="btn-small" onclick="viewOrder('${order.id}')">عرض</button>
                    <button class="btn-small btn-danger" onclick="deleteOrder('${order.id}')">حذف</button>
                </td>
            </tr>
        `).join('');
    }
}

// تحميل طلبات المتابعين
async function loadFollowersOrders() {
    const orders = [
        { id: 'FOL-001', platform: 'انستغرام', profile: '@username', count: 1000, status: 'قيد الانتظار' },
        { id: 'FOL-002', platform: 'فيسبوك', profile: 'facebook.com/user', count: 5000, status: 'قيد التنفيذ' }
    ];
    
    const container = document.getElementById('followers-orders');
    if (container) {
        container.innerHTML = orders.map(order => `
            <div class="follower-order-card">
                <div class="order-info">
                    <h4>طلب ${order.platform}</h4>
                    <p><strong>الحساب:</strong> ${order.profile}</p>
                    <p><strong>العدد:</strong> ${order.count} متابع</p>
                    <p><strong>الحالة:</strong> <span class="status-${order.status === 'قيد الانتظار' ? 'warning' : 'info'}">${order.status}</span></p>
                </div>
                <div class="order-actions">
                    <button class="btn-primary" onclick="completeOrder('${order.id}')">تم التنفيذ</button>
                    <button class="btn-secondary" onclick="cancelOrder('${order.id}')">إلغاء</button>
                </div>
            </div>
        `).join('');
    }
}

// تحميل عند بدء التشغيل
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    loadFollowersOrders();
    
    // إضافة CSS للإدارة
    const style = document.createElement('style');
    style.textContent = `
        .admin-body { background: #0a0e17; }
        .admin-container { display: flex; min-height: calc(100vh - 80px); }
        .admin-sidebar { width: 250px; background: rgba(15, 23, 42, 0.95); border-left: 2px solid var(--primary); }
        .admin-main { flex: 1; padding: 2rem; }
        .admin-section { display: none; }
        .admin-section.active { display: block; animation: slideIn 0.5s ease-out; }
        .admin-profile { padding: 2rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .profile-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem; }
        .sidebar-nav { padding: 1rem; }
        .sidebar-link { display: block; padding: 1rem; color: var(--gray); text-decoration: none; border-radius: 10px; margin-bottom: 0.5rem; transition: all 0.3s ease; }
        .sidebar-link:hover, .sidebar-link.active { background: var(--primary); color: white; }
        .admin-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .tab-btn { background: rgba(255,255,255,0.1); border: none; padding: 0.75rem 1.5rem; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s ease; }
        .tab-btn.active { background: var(--primary); }
        .product-form { background: rgba(30, 41, 59, 0.8); padding: 2rem; border-radius: 15px; margin-bottom: 2rem; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .orders-table { background: rgba(30, 41, 59, 0.8); border-radius: 15px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { background: rgba(109, 40, 217, 0.3); font-weight: 600; }
        .status-success { color: var(--success); background: rgba(16, 185, 129, 0.2); padding: 0.25rem 0.75rem; border-radius: 20px; }
        .status-warning { color: var(--warning); background: rgba(245, 158, 11, 0.2); padding: 0.25rem 0.75rem; border-radius: 20px; }
        .status-info { color: var(--info); background: rgba(59, 130, 246, 0.2); padding: 0.25rem 0.75rem; border-radius: 20px; }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.9rem; }
        .btn-danger { background: var(--danger); }
        .follower-order-card { background: rgba(30, 41, 59, 0.8); border-radius: 15px; padding: 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .setting-card { background: rgba(30, 41, 59, 0.8); padding: 1.5rem; border-radius: 15px; }
        .admin-stat { text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: 700; margin: 1rem 0; color: var(--secondary); }
    `;
    document.head.appendChild(style);
});
