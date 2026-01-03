// متغيرات عامة
let uploadedImages = [];

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('لوحة التحكم جاهزة');
    loadStats();
    loadProducts();
});

// تحميل الإحصائيات
async function loadStats() {
    try {
        // بسيط للإختبار
        document.getElementById('totalSales').textContent = '$0';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalFollowers').textContent = '0';
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
    
    // تحميل البيانات
    if (tabName === 'products') loadProducts();
    if (tabName === 'orders') loadOrders();
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

// ✅ إضافة منتج - نسخة مبسطة تعمل 100%
async function addProduct() {
    try {
        console.log('بدء إضافة منتج...');
        
        // الحصول على البيانات
        const title = document.getElementById('productTitle').value.trim();
        const price = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim() || 'لا يوجد وصف';
        
        console.log('البيانات:', { title, price, category, description });
        
        // تحقق بسيط
        if (!title || !price) {
            alert('⚠️ الرجاء إدخال العنوان والسعر');
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
            price: parseFloat(price),
            stock: parseInt(document.getElementById('productStock').value) || 1,
            category: category,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // حقول إضافية حسب التصنيف
        if (category === 'accounts') {
            productData.level = parseInt(document.getElementById('productLevel').value) || 1;
            productData.diamonds = parseInt(document.getElementById('productDiamonds').value) || 0;
            productData.skins = parseInt(document.getElementById('productSkins').value) || 0;
        } else if (category === 'vouchers') {
            productData.diamonds = parseInt(document.getElementById('productDiamonds').value) || 100;
        } else if (category === 'followers') {
            productData.platform = document.getElementById('productPlatform').value || 'instagram';
            productData.followers_count = parseInt(document.getElementById('productDiamonds').value) || 1000;
        }
        
        console.log('بيانات المنتج المرسلة:', productData);
        
        // محاولة الإضافة مع fetch مباشرة (بدون supabase sdk)
        const response = await fetch('https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(productData)
        });
        
        console.log('استجابة السيرفر:', response.status, response.statusText);
        
        if (response.ok) {
            // نجاح
            alert('✅ تم إضافة المنتج بنجاح!');
            
            // تنظيف النموذج
            resetProductForm();
            
            // إعادة تحميل القائمة
            setTimeout(() => {
                loadProducts();
                addBtn.innerHTML = originalText;
                addBtn.disabled = false;
            }, 1000);
            
        } else {
            // فشل
            const errorText = await response.text();
            console.error('خطأ من السيرفر:', errorText);
            
            // محاولة بديلة باستخدام supabase sdk
            console.log('محاولة باستخدام SDK...');
            
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select();
            
            if (error) {
                throw new Error(`فشل الإضافة: ${error.message}`);
            }
            
            alert('✅ تم إضافة المنتج (المحاولة الثانية)');
            resetProductForm();
            loadProducts();
        }
        
    } catch (error) {
        console.error('خطأ كامل:', error);
        
        let errorMessage = 'حدث خطأ في إضافة المنتج';
        
        if (error.message.includes('permission denied')) {
            errorMessage = 'خطأ في الصلاحيات. تأكد من RLS Policies';
        } else if (error.message.includes('network')) {
            errorMessage = 'خطأ في الاتصال بالخادم';
        } else if (error.message.includes('invalid')) {
            errorMessage = 'بيانات غير صحيحة';
        }
        
        alert(`❌ ${errorMessage}\n\nافتح Console (F12) للتفاصيل`);
        
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
    document.getElementById('productStock').value = '1';
    document.getElementById('productLevel').value = '1';
    document.getElementById('productDiamonds').value = '0';
    document.getElementById('productSkins').value = '0';
    document.getElementById('productDescription').value = '';
    document.getElementById('productCategory').value = 'accounts';
    
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
        
        // محاولة باستخدام fetch مباشرة
        const response = await fetch('https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/products?select=*&order=created_at.desc', {
            headers: {
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في التحميل: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('المنتجات المحملة:', products);
        
        if (!products || products.length === 0) {
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
                    <span style="color: ${product.is_active ? '#10b981' : '#ef4444'}">
                        <i class="fas fa-${product.is_active ? 'check' : 'times'}-circle"></i>
                        ${product.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-secondary admin-btn-small" onclick="toggleProduct('${product.id}', ${product.is_active})">
                        ${product.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn admin-btn-danger admin-btn-small" onclick="deleteProduct('${product.id}')">
                        حذف
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        const container = document.getElementById('productsList');
        if (container) {
            container.innerHTML = '<div class="loading">خطأ في التحميل. تأكد من اتصال الإنترنت</div>';
        }
    }
}

// تفعيل/تعطيل منتج
async function toggleProduct(productId, isActive) {
    if (!confirm(`هل تريد ${isActive ? 'تعطيل' : 'تفعيل'} هذا المنتج؟`)) return;
    
    try {
        const response = await fetch(`https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/products?id=eq.${productId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ is_active: !isActive })
        });
        
        if (response.ok) {
            alert(`✅ تم ${isActive ? 'تعطيل' : 'تفعيل'} المنتج`);
            loadProducts();
        } else {
            throw new Error('فشل التحديث');
        }
        
    } catch (error) {
        console.error('خطأ في تغيير الحالة:', error);
        alert('❌ فشل تغيير الحالة');
    }
}

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    try {
        const response = await fetch(`https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/products?id=eq.${productId}`, {
            method: 'DELETE',
            headers: {
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Prefer': 'return=minimal'
            }
        });
        
        if (response.ok) {
            alert('✅ تم حذف المنتج');
            loadProducts();
        } else {
            throw new Error('فشل الحذف');
        }
        
    } catch (error) {
        console.error('خطأ في الحذف:', error);
        alert('❌ فشل حذف المنتج');
    }
}

// تحميل الطلبات
async function loadOrders() {
    try {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
        
        const response = await fetch('https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/orders?select=*&order=created_at.desc', {
            headers: {
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm'
            }
        });
        
        if (!response.ok) {
            tbody.innerHTML = '<tr><td colspan="6">خطأ في التحميل</td></tr>';
            return;
        }
        
        const orders = await response.json();
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">لا توجد طلبات</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><code>${order.order_id || order.id}</code></td>
                <td>${order.product_name || 'غير محدد'}</td>
                <td>$${order.amount || 0}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'قيد الانتظار'}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    ${(order.status === 'pending' || !order.status) ? `
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

// إكمال طلب
async function completeOrder(orderId) {
    try {
        const response = await fetch(`https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ status: 'completed' })
        });
        
        if (response.ok) {
            alert('✅ تم إكمال الطلب');
            loadOrders();
        }
        
    } catch (error) {
        console.error('خطأ في إكمال الطلب:', error);
        alert('❌ فشل إكمال الطلب');
    }
}

// إضافة قسيمة
async function addVoucher() {
    try {
        const title = document.getElementById('voucherTitle').value || 'قسيمة جديدة';
        const diamonds = parseInt(document.getElementById('voucherDiamonds').value) || 1000;
        const price = parseFloat(document.getElementById('voucherPrice').value) || 9.99;
        const stock = parseInt(document.getElementById('voucherStock').value) || 100;
        
        const voucherData = {
            title: `${diamonds} جوهرة`,
            description: `قسيمة ${diamonds} جوهرة فري فاير`,
            price: price,
            stock: stock,
            diamonds: diamonds,
            category: 'vouchers',
            is_active: true,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch('https://ftgjqvoiunulricuetmb.supabase.co/rest/v1/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Authorization': 'Bearer sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(voucherData)
        });
        
        if (response.ok) {
            alert('✅ تم إضافة القسيمة');
            document.getElementById('voucherTitle').value = '';
            document.getElementById('voucherDiamonds').value = '';
            document.getElementById('voucherPrice').value = '';
            document.getElementById('voucherStock').value = '';
            showTab('products');
            loadProducts();
        }
        
    } catch (error) {
        console.error('خطأ في إضافة القسيمة:', error);
        alert('❌ فشل إضافة القسيمة');
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
