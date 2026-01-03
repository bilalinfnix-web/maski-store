// متغيرات إدارة الصور
let uploadedImages = [];
let selectedProductId = null;

// إدارة تبويبات الأدمن
function showTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إزالة النشاط من الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المحدد
    const tabElement = document.getElementById(tabName + 'Tab');
    const btnElement = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    
    if (tabElement) tabElement.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
    
    // تحميل بيانات التبويب
    if (tabName === 'products') loadProducts();
    else if (tabName === 'orders') loadOrders();
    else if (tabName === 'vouchers') loadVouchers();
    else if (tabName === 'followers') loadFollowersOrders();
}

// تحميل المنتجات
async function loadProducts() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'accounts')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('productsList');
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد منتجات</div>';
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-item">
                <div class="product-header">
                    <h4>${product.title}</h4>
                    <span class="price">$${product.price}</span>
                </div>
                
                ${product.images && product.images.length > 0 ? `
                    <div class="product-images-grid">
                        ${product.images.slice(0, 3).map((img, index) => `
                            <div class="image-preview">
                                <img src="${img}" alt="صورة ${index + 1}">
                                ${index === 2 && product.images.length > 3 ? 
                                    `<div class="image-counter">+${product.images.length - 3}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="product-meta">
                    <span><i class="fas fa-box"></i> ${product.stock || 0} متوفر</span>
                    <span><i class="fas fa-gem"></i> ${product.diamonds || 0} جوهرة</span>
                    <span><i class="fas fa-level-up-alt"></i> مستوى ${product.level || 1}</span>
                </div>
                
                <div class="product-actions">
                    <button class="btn small" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn small danger" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('حدث خطأ في تحميل المنتجات');
    }
}

// رفع الصور
function handleImageUpload(files) {
    const maxImages = 7;
    const preview = document.getElementById('imagesPreview');
    
    if (!preview) return;
    
    // حساب الصور المتاحة للرفع
    const remainingSlots = maxImages - uploadedImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    if (filesToUpload.length === 0) {
        alert(`لقد وصلت للحد الأقصى (${maxImages} صور)`);
        return;
    }
    
    // عرض معاينة للصور
    filesToUpload.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imageData = {
                id: Date.now() + index,
                file: file,
                url: e.target.result
            };
            
            uploadedImages.push(imageData);
            renderImagePreview(imageData);
        };
        
        reader.readAsDataURL(file);
    });
    
    // تحديث العداد
    updateImageCounter();
}

// عرض معاينة الصور
function renderImagePreview(imageData) {
    const preview = document.getElementById('imagesPreview');
    if (!preview) return;
    
    const imageElement = document.createElement('div');
    imageElement.className = 'image-preview';
    imageElement.innerHTML = `
        <img src="${imageData.url}" alt="صورة ${uploadedImages.length}">
        <button class="remove-image" onclick="removeImage(${imageData.id})">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    preview.appendChild(imageElement);
}

// حذف صورة
function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    
    // إعادة عرض المعاينة
    const preview = document.getElementById('imagesPreview');
    if (preview) {
        preview.innerHTML = '';
        uploadedImages.forEach(renderImagePreview);
    }
    
    updateImageCounter();
}

// تحديث عداد الصور
function updateImageCounter() {
    const counter = document.querySelector('.image-counter');
    if (counter) {
        counter.textContent = `${uploadedImages.length}/7`;
    }
}

// إضافة منتج جديد
async function addProduct() {
    try {
        const title = document.getElementById('productTitle').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const level = parseInt(document.getElementById('productLevel').value);
        const diamonds = parseInt(document.getElementById('productDiamonds').value);
        const skins = parseInt(document.getElementById('productSkins').value);
        const description = document.getElementById('productDescription').value.trim();
        
        // التحقق من الحقول المطلوبة
        if (!title || !price || isNaN(price) || price <= 0) {
            showError('الرجاء إدخال عنوان المنتج وسعر صحيح');
            return;
        }
        
        // رفع الصور إلى Supabase Storage
        const imageUrls = [];
        for (const imageData of uploadedImages) {
            const url = await supabaseUtils.uploadImage(imageData.file, 'product_' + Date.now());
            if (url) imageUrls.push(url);
        }
        
        // حفظ المنتج في قاعدة البيانات
        const { data, error } = await supabaseClient
            .from('products')
            .insert([{
                title: title,
                description: description,
                price: price,
                stock: stock || 1,
                level: level || 1,
                diamonds: diamonds || 0,
                skins: skins || 0,
                images: imageUrls,
                category: 'accounts',
                is_active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // إعادة تعيين النموذج
        resetProductForm();
        
        // إعادة تحميل القائمة
        loadProducts();
        
        showSuccess('تم إضافة المنتج بنجاح!');
        
    } catch (error) {
        console.error('Error adding product:', error);
        showError('حدث خطأ في إضافة المنتج');
    }
}

// إعادة تعيين نموذج المنتج
function resetProductForm() {
    document.getElementById('productTitle').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productLevel').value = '';
    document.getElementById('productDiamonds').value = '';
    document.getElementById('productSkins').value = '';
    document.getElementById('productDescription').value = '';
    
    uploadedImages = [];
    const preview = document.getElementById('imagesPreview');
    if (preview) preview.innerHTML = '';
}

// تحميل الطلبات
async function loadOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد طلبات</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><code>${order.order_id}</code></td>
                <td>${order.product_name}</td>
                <td>$${order.amount}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn small" onclick="viewOrderDetails('${order.order_id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn small success" onclick="completeOrder('${order.order_id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('حدث خطأ في تحميل الطلبات');
    }
}

// الحصول على نص الحالة
function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد المعالجة',
        'completed': 'مكتمل',
        'failed': 'فاشل'
    };
    return statusMap[status] || status;
}

// تحميل الإحصائيات
async function loadStats() {
    try {
        // إجمالي المبيعات
        const { data: sales, error: salesError } = await supabaseClient
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
        
        if (!salesError && sales) {
            const totalSales = sales.reduce((sum, order) => sum + (order.amount || 0), 0);
            document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        }
        
        // الطلبات النشطة
        const { data: activeOrders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('status', 'pending');
        
        if (!ordersError && activeOrders) {
            document.getElementById('activeOrders').textContent = activeOrders.length;
        }
        
        // إجمالي المنتجات
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('id');
        
        if (!productsError && products) {
            document.getElementById('totalProducts').textContent = products.length;
        }
        
        // طلبات المتابعين المعلقة
        const { data: followers, error: followersError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('product_type', 'followers')
            .eq('status', 'processing');
        
        if (!followersError && followers) {
            document.getElementById('pendingFollowers').textContent = followers.length;
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// إضافة قسيمة جديدة
async function addVoucher() {
    try {
        const title = document.getElementById('voucherTitle').value.trim();
        const diamonds = parseInt(document.getElementById('voucherDiamonds').value);
        const price = parseFloat(document.getElementById('voucherPrice').value);
        const stock = parseInt(document.getElementById('voucherStock').value);
        
        if (!title || !diamonds || !price) {
            showError('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
        
        const { error } = await supabaseClient
            .from('products')
            .insert([{
                title: `${title} - ${diamonds} جوهرة`,
                description: `قسيمة ${diamonds} جوهرة فري فاير`,
                price: price,
                stock: stock || 100,
                diamonds: diamonds,
                category: 'vouchers',
                is_active: true,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // إعادة تعيين النموذج
        document.getElementById('voucherTitle').value = '';
        document.getElementById('voucherDiamonds').value = '';
        document.getElementById('voucherPrice').value = '';
        document.getElementById('voucherStock').value = '';
        
        showSuccess('تم إضافة القسيمة بنجاح!');
        loadVouchers();
        
    } catch (error) {
        console.error('Error adding voucher:', error);
        showError('حدث خطأ في إضافة القسيمة');
    }
}

// تحميل القسائم
async function loadVouchers() {
    try {
        const { data: vouchers, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'vouchers')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('vouchersList');
        if (!container) return;
        
        if (!vouchers || vouchers.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد قسائم</div>';
            return;
        }
        
        container.innerHTML = vouchers.map(voucher => `
            <div class="voucher-item">
                <h4>${voucher.title}</h4>
                <p><i class="fas fa-gem"></i> ${voucher.diamonds} جوهرة</p>
                <div class="price">$${voucher.price}</div>
                <div class="stock">المخزون: ${voucher.stock}</div>
                <button class="btn small danger" onclick="deleteProduct('${voucher.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading vouchers:', error);
    }
}

// إضافة باقة متابعين
async function addFollowersPackage() {
    try {
        const count = parseInt(document.getElementById('followersCount').value);
        const platform = document.getElementById('followersPlatform').value;
        const price = parseFloat(document.getElementById('followersPrice').value);
        const stock = parseInt(document.getElementById('followersStock').value);
        
        if (!count || !price) {
            showError('الرجاء إدخال عدد المتابعين والسعر');
            return;
        }
        
        const platformNames = {
            instagram: 'انستغرام',
            facebook: 'فيسبوك',
            tiktok: 'تيك توك'
        };
        
        const { error } = await supabaseClient
            .from('products')
            .insert([{
                title: `${count} متابع على ${platformNames[platform]}`,
                description: `زيادة ${count} متابع على ${platformNames[platform]}`,
                price: price,
                stock: stock || 100,
                followers_count: count,
                platform: platform,
                category: 'followers',
                is_active: true,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // إعادة تعيين النموذج
        document.getElementById('followersCount').value = '';
        document.getElementById('followersPrice').value = '';
        document.getElementById('followersStock').value = '';
        
        showSuccess('تم إضافة الباقة بنجاح!');
        
    } catch (error) {
        console.error('Error adding followers package:', error);
        showError('حدث خطأ في إضافة الباقة');
    }
}

// تحميل طلبات المتابعين
async function loadFollowersOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('product_type', 'followers')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('followersOrders');
        if (!container) return;
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد طلبات</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <h4>${order.product_name}</h4>
                    <span class="status ${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-details">
                    ${order.profile_url ? `<p><strong>الحساب:</strong> ${order.profile_url}</p>` : ''}
                    ${order.platform ? `<p><strong>المنصة:</strong> ${order.platform}</p>` : ''}
                    <p><strong>المبلغ:</strong> $${order.amount}</p>
                    <p><strong>التاريخ:</strong> ${new Date(order.created_at).toLocaleString('ar-SA')}</p>
                </div>
                ${order.status === 'processing' ? `
                    <div class="order-actions">
                        <button class="btn small success" onclick="completeFollowersOrder('${order.order_id}')">
                            <i class="fas fa-check"></i> تم التنفيذ
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading followers orders:', error);
        showError('حدث خطأ في تحميل الطلبات');
    }
}

// تسجيل خروج الأدمن
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// تغيير كلمة مرور الأدمن
function changeAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value.trim();
    
    if (newPassword.length < 6) {
        showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    localStorage.setItem('adminToken', newPassword);
    document.getElementById('newAdminPassword').value = '';
    showSuccess('تم تغيير كلمة المرور بنجاح!');
}

// عرض رسالة نجاح
function showSuccess(message) {
    alert(`✅ ${message}`);
}

// عرض رسالة خطأ
function showError(message) {
    alert(`❌ ${message}`);
}

// بدء التحميل
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadProducts();
    
    // إضافة CSS للوحة التحكم
    const style = document.createElement('style');
    style.textContent = `
        .admin-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            border-bottom: 2px solid #374151;
            padding-bottom: 1rem;
        }
        .tab-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            color: #cbd5e1;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
        }
        .tab-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        .tab-btn.active {
            background: #4f46e5;
            color: white;
        }
        .admin-tab {
            display: none;
        }
        .admin-tab.active {
            display: block;
            animation: fadeIn 0.3s;
        }
        .admin-card {
            background: rgba(30, 41, 59, 0.8);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        .products-list {
            display: grid;
            gap: 1rem;
        }
        .product-item {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .product-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .product-meta {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .product-actions {
            display: flex;
            gap: 0.5rem;
        }
        .btn.small {
            padding: 0.25rem 0.75rem;
            font-size: 0.8rem;
        }
        .btn.danger {
            background: #ef4444;
        }
        .btn.success {
            background: #10b981;
        }
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        .status-badge.pending {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        .status-badge.completed {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        .status-badge.processing {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .setting-card {
            background: rgba(30, 41, 59, 0.8);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .voucher-item {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .order-item {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
    `;
    document.head.appendChild(style);
});
