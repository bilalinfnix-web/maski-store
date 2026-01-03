// متغيرات
let uploadedImages = [];

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('لوحة التحكم جاهزة');
    loadStats();
    loadProducts();
    loadOrders();
});

// تحميل الإحصائيات
async function loadStats() {
    try {
        // عدد المنتجات
        const productsSnapshot = await firestoreDB.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnapshot.size;
        
        // عدد الطلبات
        const ordersSnapshot = await firestoreDB.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        
        // إجمالي المبيعات
        let totalSales = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.status === 'completed') {
                totalSales += parseFloat(order.amount) || 0;
            }
        });
        document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        
        // طلبات المتابعين
        const followersQuery = await firestoreDB.collection('orders')
            .where('productType', '==', 'followers')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('totalFollowers').textContent = followersQuery.size;
        
    } catch (error) {
        console.log('خطأ في الإحصائيات:', error);
    }
}

// إظهار التبويب
function showTab(tabName) {
    // إخفاء الكل
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // إظهار المطلوب
    const section = document.getElementById(tabName + 'Section');
    const button = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    
    if (section) section.classList.add('active');
    if (button) button.classList.add('active');
}

// معالجة رفع الصور
function handleImageUpload(files) {
    const maxImages = 7;
    const preview = document.getElementById('imagesPreview');
    
    if (!preview) return;
    
    // مسح القديم
    preview.innerHTML = '';
    uploadedImages = [];
    
    // أخذ أول 7 صور فقط
    const filesArray = Array.from(files).slice(0, maxImages);
    
    filesArray.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            uploadedImages.push({
                id: Date.now() + index,
                file: file,
                url: e.target.result
            });
            
            // عرض الصورة
            const div = document.createElement('div');
            div.className = 'image-preview';
            div.innerHTML = `
                <img src="${e.target.result}" alt="صورة ${index + 1}">
                <button class="remove-image" onclick="removeImage(${Date.now() + index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.appendChild(div);
        };
        
        reader.readAsDataURL(file);
    });
}

// حذف صورة
function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    const preview = document.getElementById('imagesPreview');
    preview.innerHTML = '';
    uploadedImages.forEach(img => {
        const div = document.createElement('div');
        div.className = 'image-preview';
        div.innerHTML = `
            <img src="${img.url}" alt="صورة">
            <button class="remove-image" onclick="removeImage(${img.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        preview.appendChild(div);
    });
}

// ✅ إضافة منتج - تعمل 100%
async function addProduct() {
    try {
        console.log('بدء إضافة منتج...');
        
        // الحصول على البيانات
        const title = document.getElementById('productTitle').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value) || 10;
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim() || 'لا يوجد وصف';
        
        // تحقق بسيط
        if (!title || isNaN(price) || price <= 0) {
            alert('⚠️ الرجاء إدخال عنوان وسعر صحيحين');
            return;
        }
        
        // تغيير زر الإضافة
        const addBtn = document.querySelector('.btn-primary[onclick="addProduct()"]');
        const originalText = addBtn.innerHTML;
        addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
        addBtn.disabled = true;
        
        // بيانات المنتج الأساسية
        const productData = {
            title: title,
            description: description,
            price: price,
            stock: stock,
            category: category,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // حقول إضافية حسب التصنيف
        if (category === 'accounts') {
            productData.level = parseInt(document.getElementById('productLevel').value) || 1;
            productData.diamonds = parseInt(document.getElementById('productDiamonds').value) || 1000;
            productData.skins = parseInt(document.getElementById('productSkins').value) || 5;
        } else if (category === 'vouchers') {
            productData.diamonds = parseInt(document.getElementById('productDiamonds').value) || 1000;
        } else if (category === 'followers') {
            productData.platform = document.getElementById('productPlatform').value || 'instagram';
            productData.followers_count = parseInt(document.getElementById('productDiamonds').value) || 1000;
        }
        
        // رفع الصور
        if (uploadedImages.length > 0) {
            const imageUrls = [];
            for (const img of uploadedImages) {
                const url = await firebaseUtils.uploadImage(img.file);
                if (url) imageUrls.push(url);
            }
            if (imageUrls.length > 0) {
                productData.images = imageUrls;
            }
        }
        
        console.log('بيانات المنتج:', productData);
        
        // إضافة المنتج إلى Firebase
        const docRef = await firestoreDB.collection('products').add(productData);
        
        console.log('تم إضافة المنتج بنجاح:', docRef.id);
        alert('✅ تم إضافة المنتج بنجاح!');
        
        // تنظيف النموذج
        resetProductForm();
        
        // إعادة تحميل القائمة
        setTimeout(() => {
            loadProducts();
            addBtn.innerHTML = originalText;
            addBtn.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        alert(`❌ فشل إضافة المنتج: ${error.message}`);
        
        // إعادة تفعيل الزر
        const addBtn = document.querySelector('.btn-primary[onclick="addProduct()"]');
        if (addBtn) {
            addBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة المنتج';
            addBtn.disabled = false;
        }
    }
}

// تنظيف النموذج
function resetProductForm() {
    document.getElementById('productTitle').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '10';
    document.getElementById('productLevel').value = '1';
    document.getElementById('productDiamonds').value = '1000';
    document.getElementById('productSkins').value = '5';
    document.getElementById('productDescription').value = '';
    document.getElementById('productCategory').value = 'accounts';
    document.getElementById('productPlatform').value = 'instagram';
    
    // مسح الصور
    uploadedImages = [];
    const preview = document.getElementById('imagesPreview');
    if (preview) preview.innerHTML = '';
}

// تحميل المنتجات
async function loadProducts() {
    try {
        console.log('جاري تحميل المنتجات...');
        
        const container = document.getElementById('productsList');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">جاري التحميل...</div>';
        
        const snapshot = await firestoreDB.collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('المنتجات المحملة:', products.length);
        
        if (products.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد منتجات بعد</div>';
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-item">
                <div class="product-header">
                    <h4>${product.title}</h4>
                    <span class="product-price">$${product.price}</span>
                </div>
                <p class="product-desc">${product.description || 'لا يوجد وصف'}</p>
                <div class="product-meta">
                    <span><i class="fas fa-tag"></i> ${product.category}</span>
                    <span><i class="fas fa-box"></i> ${product.stock || 0}</span>
                    <span style="color: ${product.isActive ? '#10b981' : '#ef4444'}">
                        <i class="fas fa-${product.isActive ? 'check' : 'times'}-circle"></i>
                        ${product.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-secondary btn-small" onclick="toggleProduct('${product.id}', ${product.isActive})">
                        ${product.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteProduct('${product.id}')">
                        حذف
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        const container = document.getElementById('productsList');
        if (container) {
            container.innerHTML = '<div class="loading">خطأ في التحميل</div>';
        }
    }
}

// تفعيل/تعطيل منتج
async function toggleProduct(productId, isActive) {
    if (!confirm(`هل تريد ${isActive ? 'تعطيل' : 'تفعيل'} هذا المنتج؟`)) return;
    
    try {
        await firestoreDB.collection('products').doc(productId).update({
            isActive: !isActive,
            updatedAt: new Date().toISOString()
        });
        
        alert(`✅ تم ${isActive ? 'تعطيل' : 'تفعيل'} المنتج`);
        loadProducts();
        
    } catch (error) {
        console.error('خطأ في تغيير الحالة:', error);
        alert('❌ فشل تغيير الحالة');
    }
}

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        await firestoreDB.collection('products').doc(productId).delete();
        
        alert('✅ تم حذف المنتج');
        loadProducts();
        
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        alert('❌ فشل حذف المنتج');
    }
}

// تحميل الطلبات
async function loadOrders() {
    try {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
        
        const snapshot = await firestoreDB.collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">لا توجد طلبات</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><code>${order.orderId || order.id}</code></td>
                <td>${order.productName || 'غير محدد'}</td>
                <td>$${order.amount || 0}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${getStatusText(order.status)}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString('ar-SA')}</td>
                <td>
                    ${(order.status === 'pending' || !order.status) ? `
                        <button class="btn btn-success btn-small" onclick="completeOrder('${order.id}')">
                            إكمال
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        const tbody = document.getElementById('ordersTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6">خطأ في التحميل</td></tr>';
        }
    }
}

function getStatusText(status) {
    const statuses = {
        'pending': 'قيد الانتظار',
        'completed': 'مكتمل',
        'failed': 'فاشل'
    };
    return statuses[status] || status || 'قيد الانتظار';
}

// إكمال طلب
async function completeOrder(orderId) {
    try {
        await firestoreDB.collection('orders').doc(orderId).update({
            status: 'completed',
            updatedAt: new Date().toISOString()
        });
        
        alert('✅ تم إكمال الطلب');
        loadOrders();
        loadStats();
        
    } catch (error) {
        console.error('خطأ في إكمال الطلب:', error);
        alert('❌ فشل إكمال الطلب');
    }
}

// تغيير كلمة مرور الأدمن
function changeAdminPassword() {
    const newPass = document.getElementById('adminNewPassword').value;
    
    if (newPass.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    localStorage.setItem('adminToken', newPass);
    document.getElementById('adminNewPassword').value = '';
    alert('✅ تم تغيير كلمة المرور بنجاح!');
}

// تسجيل خروج
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
    }
