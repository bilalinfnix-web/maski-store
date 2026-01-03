// حالة الأدمن
let uploadedImages = [];

// تحميل الإحصائيات
async function loadStats() {
    try {
        // إجمالي المبيعات
        const { data: sales, error: salesError } = await supabaseClient
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
        
        if (!salesError && sales) {
            const total = sales.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
            document.getElementById('totalSales').textContent = `$${total.toFixed(2)}`;
        }
        
        // إجمالي الطلبات
        const { data: orders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('id');
        
        if (!ordersError && orders) {
            document.getElementById('totalOrders').textContent = orders.length;
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
            .eq('status', 'pending');
        
        if (!followersError && followers) {
            document.getElementById('totalFollowers').textContent = followers.length;
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// إظهار التبويب
function showTab(tabName) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة النشاط من الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const section = document.getElementById(tabName + 'Section');
    const button = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    
    if (section) section.classList.add('active');
    if (button) button.classList.add('active');
    
    // تحميل بيانات التبويب
    if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'vouchers') {
        loadVouchersAdmin();
    } else if (tabName === 'followers') {
        loadFollowersOrdersAdmin();
    }
}

// رفع الصور
function handleImageUpload(files) {
    const maxImages = 7;
    const preview = document.getElementById('imagesPreview');
    
    if (!preview) return;
    
    // حساب المساحة المتاحة
    const remaining = maxImages - uploadedImages.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    
    if (filesToUpload.length === 0) {
        alert(`لقد وصلت للحد الأقصى (${maxImages} صور)`);
        return;
    }
    
    // معالجة كل صورة
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
}

// عرض معاينة الصور
function renderImagePreview(imageData) {
    const preview = document.getElementById('imagesPreview');
    if (!preview) return;
    
    const div = document.createElement('div');
    div.className = 'image-preview';
    div.innerHTML = `
        <img src="${imageData.url}" alt="صورة">
        <button class="remove-image" onclick="removeImage(${imageData.id})">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    preview.appendChild(div);
}

// حذف صورة
function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    
    // إعادة عرض المعاينة
    const preview = document.getElementById('imagesPreview');
    if (preview) {
        preview.innerHTML = '';
        uploadedImages.forEach(img => renderImagePreview(img));
    }
}

// إضافة منتج
async function addProduct() {
    try {
        // جمع البيانات
        const title = document.getElementById('productTitle').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value) || 1;
        const category = document.getElementById('productCategory').value;
        const platform = document.getElementById('productPlatform').value;
        const level = parseInt(document.getElementById('productLevel').value) || 1;
        const diamonds = parseInt(document.getElementById('productDiamonds').value) || 0;
        const skins = parseInt(document.getElementById('productSkins').value) || 0;
        const description = document.getElementById('productDescription').value.trim();
        
        // التحقق
        if (!title || isNaN(price) || price <= 0) {
            alert('الرجاء إدخال عنوان وسعر صحيحين');
            return;
        }
        
        // رفع الصور
        const imageUrls = [];
        if (uploadedImages.length > 0) {
            for (const imgData of uploadedImages) {
                const url = await supabaseUtils.uploadImage(imgData.file);
                if (url) imageUrls.push(url);
            }
        }
        
        // بيانات المنتج
        const productData = {
            title: title,
            description: description || 'لا يوجد وصف',
            price: price,
            stock: stock,
            category: category,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // حقول إضافية حسب التصنيف
        if (category === 'accounts') {
            productData.level = level;
            productData.diamonds = diamonds;
            productData.skins = skins;
        } else if (category === 'vouchers') {
            productData.diamonds = diamonds;
        } else if (category === 'followers') {
            productData.platform = platform;
            productData.followers_count = diamonds; // استخدام حقل الجواهر للعدد
        }
        
        // إضافة الصور
        if (imageUrls.length > 0) {
            productData.images = imageUrls;
        }
        
        console.log('بيانات المنتج:', productData);
        
        // إرسال البيانات
        const { data, error } = await supabaseClient
            .from('products')
            .insert([productData])
            .select()
            .single();
        
        if (error) {
            throw new Error(`خطأ في الإضافة: ${error.message}`);
        }
        
        alert('✅ تم إضافة المنتج بنجاح!');
        
        // تنظيف النموذج
        resetProductForm();
        
        // إعادة تحميل القائمة
        loadProducts();
        
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        alert(`❌ فشل إضافة المنتج: ${error.message}`);
    }
}

// تنظيف النموذج
function resetProductForm() {
    document.getElementById('productTitle').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productLevel').value = '';
    document.getElementById('productDiamonds').value = '';
    document.getElementById('productSkins').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productCategory').value = 'accounts';
    document.getElementById('productPlatform').value = '';
    
    uploadedImages = [];
    const preview = document.getElementById('imagesPreview');
    if (preview) preview.innerHTML = '';
}

// تحميل المنتجات
async function loadProducts() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        const container = document.getElementById('productsList');
        if (!container) return;
        
        if (error) {
            container.innerHTML = '<div class="loading">خطأ في تحميل المنتجات</div>';
            return;
        }
        
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد منتجات</div>';
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-item">
                <div class="product-header">
                    <h4>${product.title}</h4>
                    <span class="product-price">$${product.price}</span>
                </div>
                
                <div class="product-info">
                    <p>${product.description || 'لا يوجد وصف'}</p>
                    <div class="product-meta">
                        <span><i class="fas fa-box"></i> ${product.stock} متوفر</span>
                        <span><i class="fas fa-tag"></i> ${product.category}</span>
                        ${product.is_active ? '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> نشط</span>' : 
                         '<span style="color: #ef4444;"><i class="fas fa-times-circle"></i> غير نشط</span>'}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-secondary admin-btn-small" onclick="toggleProductStatus('${product.id}', ${product.is_active})">
                        ${product.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn admin-btn-danger admin-btn-small" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        const container = document.getElementById('productsList');
        if (container) {
            container.innerHTML = '<div class="loading">خطأ في تحميل المنتجات</div>';
        }
    }
}

// تبديل حالة المنتج
async function toggleProductStatus(productId, currentStatus) {
    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ is_active: !currentStatus })
            .eq('id', productId);
        
        if (error) throw error;
        
        alert(`✅ تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المنتج`);
        loadProducts();
        
    } catch (error) {
        console.error('خطأ في تغيير الحالة:', error);
        alert('❌ فشل تغيير الحالة');
    }
}

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
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
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        
        if (error) {
            tbody.innerHTML = '<tr><td colspan="6">خطأ في تحميل الطلبات</td></tr>';
            return;
        }
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">لا توجد طلبات</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><code>${order.order_id}</code></td>
                <td>${order.product_name}</td>
                <td>$${order.amount}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    ${order.status === 'pending' ? `
                        <button class="btn admin-btn-small admin-btn-success" onclick="completeOrder('${order.id}')">
                            إكمال
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
    }
}

// نص الحالة
function getStatusText(status) {
    const statuses = {
        'pending': 'قيد الانتظار',
        'completed': 'مكتمل',
        'failed': 'فاشل'
    };
    return statuses[status] || status;
}

// إكمال طلب
async function completeOrder(orderId) {
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', orderId);
        
        if (error) throw error;
        
        alert('✅ تم إكمال الطلب');
        loadOrders();
        
    } catch (error) {
        console.error('خطأ في إكمال الطلب:', error);
        alert('❌ فشل إكمال الطلب');
    }
}

// إضافة قسيمة
async function addVoucher() {
    try {
        const title = document.getElementById('voucherTitle').value.trim();
        const diamonds = parseInt(document.getElementById('voucherDiamonds').value);
        const price = parseFloat(document.getElementById('voucherPrice').value);
        const stock = parseInt(document.getElementById('voucherStock').value) || 100;
        
        if (!title || !diamonds || !price) {
            alert('الرجاء ملء جميع الحقول');
            return;
        }
        
        const { error } = await supabaseClient
            .from('products')
            .insert([{
                title: title,
                description: `قسيمة ${diamonds} جوهرة فري فاير`,
                price: price,
                stock: stock,
                diamonds: diamonds,
                category: 'vouchers',
                is_active: true,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        alert('✅ تم إضافة القسيمة');
        
        // تنظيف النموذج
        document.getElementById('voucherTitle').value = '';
        document.getElementById('voucherDiamonds').value = '';
        document.getElementById('voucherPrice').value = '';
        document.getElementById('voucherStock').value = '';
        
        loadVouchersAdmin();
        
    } catch (error) {
        console.error('خطأ في إضافة القسيمة:', error);
        alert('❌ فشل إضافة القسيمة');
    }
}

// تحميل القسائم للأدمن
async function loadVouchersAdmin() {
    try {
        const { data: vouchers, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'vouchers')
            .order('created_at', { ascending: false });
        
        const container = document.getElementById('vouchersListAdmin');
        if (!container) return;
        
        if (error) {
            container.innerHTML = '<div class="loading">خطأ في تحميل القسائم</div>';
            return;
        }
        
        if (!vouchers || vouchers.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد قسائم</div>';
            return;
        }
        
        container.innerHTML = vouchers.map(voucher => `
            <div class="product-item">
                <div class="product-header">
                    <h4>${voucher.title}</h4>
                    <span>$${voucher.price}</span>
                </div>
                <p>${voucher.diamonds} جوهرة - المخزون: ${voucher.stock}</p>
                <button class="btn admin-btn-danger admin-btn-small" onclick="deleteProduct('${voucher.id}')">
                    حذف
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل القسائم:', error);
    }
}

// تحميل طلبات المتابعين
async function loadFollowersOrdersAdmin() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('product_type', 'followers')
            .order('created_at', { ascending: false });
        
        const container = document.getElementById('followersOrders');
        if (!container) return;
        
        if (error) {
            container.innerHTML = '<div class="loading">خطأ في تحميل الطلبات</div>';
            return;
        }
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد طلبات</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="product-item">
                <div class="product-header">
                    <h4>${order.product_name}</h4>
                    <span class="status-badge status-${order.status}">
                        ${getStatusText(order.status)}
                    </span>
                </div>
                ${order.profile_url ? `<p><strong>الحساب:</strong> ${order.profile_url}</p>` : ''}
                ${order.platform ? `<p><strong>المنصة:</strong> ${order.platform}</p>` : ''}
                <p><strong>المبلغ:</strong> $${order.amount}</p>
                ${order.status === 'pending' ? `
                    <button class="btn admin-btn-small admin-btn-success" onclick="completeOrder('${order.id}')">
                        تم التنفيذ
                    </button>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل طلبات المتابعين:', error);
    }
}

// تغيير كلمة مرور الأدمن
function changeAdminPassword() {
    const newPassword = document.getElementById('adminNewPassword').value.trim();
    
    if (newPassword.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    localStorage.setItem('adminToken', newPassword);
    document.getElementById('adminNewPassword').value = '';
    alert('✅ تم تغيير كلمة المرور بنجاح!');
}

// تسجيل خروج
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadProducts();
});
