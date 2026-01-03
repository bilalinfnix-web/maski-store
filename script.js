here// حالة التطبيق
let state = {
    currentSection: 'home',
    selectedVoucher: null,
    selectedPackage: null,
    selectedPlatform: 'instagram',
    adminLoggedIn: false,
    products: {
        accounts: [],
        vouchers: [],
        followers: []
    }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadProducts();
    setupEventListeners();
});

function initializeApp() {
    // التحقق من تسجيل دخول الأدمن
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken === 'Maski2026') {
        state.adminLoggedIn = true;
        document.querySelector('.admin-btn').innerHTML = '<i class="fas fa-cog"></i> لوحة التحكم';
    }
}

// تحميل المنتجات من Supabase
async function loadProducts() {
    try {
        // حسابات فري فاير
        const accounts = await supabase.getProducts('accounts');
        state.products.accounts = accounts;
        renderAccounts(accounts);
        
        // قسائم جواهر
        const vouchers = await supabase.getProducts('vouchers');
        state.products.vouchers = vouchers;
        renderVouchers(vouchers);
        
        // متابعين
        const followers = await supabase.getProducts('followers');
        state.products.followers = followers;
        renderFollowers(followers, state.selectedPlatform);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// عرض الحسابات
function renderAccounts(accounts) {
    const container = document.getElementById('accounts-grid');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد حسابات متاحة حالياً</div>';
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="product-card animate-slide">
            <img src="${account.image_url || 'https://via.placeholder.com/300x200'}" 
                 alt="${account.title}" 
                 class="product-image">
            <div class="product-content">
                <h3 class="product-title">${account.title}</h3>
                <p class="product-description">${account.description}</p>
                <div class="product-price">${account.price} $</div>
                <button class="btn-primary" onclick="buyProduct('account', '${account.id}')">
                    <i class="fas fa-shopping-cart"></i> شراء الآن
                </button>
            </div>
        </div>
    `).join('');
}

// عرض القسائم
function renderVouchers(vouchers) {
    const container = document.getElementById('vouchers-grid');
    if (!container) return;
    
    container.innerHTML = vouchers.map(voucher => `
        <div class="voucher-card ${state.selectedVoucher === voucher.id ? 'selected' : ''}" 
             onclick="selectVoucher('${voucher.id}')">
            <h4>${voucher.title}</h4>
            <div class="product-price">${voucher.price} $</div>
            <p>${voucher.diamonds || 0} جوهرة</p>
        </div>
    `).join('');
}

// عرض باقات المتابعين
function renderFollowers(packages, platform) {
    const container = document.getElementById('followers-packages');
    if (!container) return;
    
    const filteredPackages = packages.filter(pkg => pkg.platform === platform);
    
    container.innerHTML = filteredPackages.map(pkg => `
        <div class="follower-package ${state.selectedPackage === pkg.id ? 'selected' : ''}" 
             onclick="selectPackage('${pkg.id}')">
            <h4>${pkg.followers_count} متابع</h4>
            <div class="product-price">${pkg.price} $</div>
            <p>${pkg.description || ''}</p>
            <button class="btn-primary" onclick="buyFollowers('${pkg.id}')">
                <i class="fas fa-users"></i> طلب الآن
            </button>
        </div>
    `).join('');
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // التنقل بين الأقسام
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
    
    // تغيير المنصة للمتابعين
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.selectedPlatform = this.getAttribute('data-platform');
            renderFollowers(state.products.followers, state.selectedPlatform);
        });
    });
}

// تبديل الأقسام
function switchSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة النشاط من جميع الروابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
        if (targetLink) {
            targetLink.classList.add('active');
        }
        state.currentSection = sectionId;
        
        // إضافة تأثير عند التبديل
        targetSection.style.opacity = '0';
        setTimeout(() => {
            targetSection.style.opacity = '1';
        }, 10);
    }
}

// اختيار قسيمة
function selectVoucher(voucherId) {
    state.selectedVoucher = voucherId;
    const voucher = state.products.vouchers.find(v => v.id === voucherId);
    
    if (voucher) {
        document.getElementById('voucher-display').innerHTML = `
            <div class="animate-pop">
                <h3>${voucher.title}</h3>
                <div class="voucher-code" id="voucher-code" onclick="copyVoucher()">
                    ${generateVoucherCode()}
                </div>
                <p>${voucher.diamonds || 0} جوهرة</p>
                <button class="copy-btn" onclick="copyVoucher()">
                    <i class="fas fa-copy"></i> نسخ القسيمة
                </button>
                <button class="btn-primary" onclick="buyProduct('voucher', '${voucher.id}')">
                    <i class="fas fa-shopping-cart"></i> شراء بـ ${voucher.price} $
                </button>
            </div>
        `;
        
        // تحديث التحديد في القائمة
        document.querySelectorAll('.voucher-card').forEach(card => {
            card.classList.remove('selected');
        });
        event.target.closest('.voucher-card').classList.add('selected');
    }
}

// اختيار باقة المتابعين
function selectPackage(packageId) {
    state.selectedPackage = packageId;
    document.querySelectorAll('.follower-package').forEach(pkg => {
        pkg.classList.remove('selected');
    });
    event.target.closest('.follower-package').classList.add('selected');
}

// شراء متابعين
function buyFollowers(packageId) {
    const pkg = state.products.followers.find(p => p.id === packageId);
    if (!pkg) return;
    
    state.selectedPackage = packageId;
    document.getElementById('order-form').classList.remove('hidden');
    document.getElementById('profile-url').focus();
}

// تأكيد طلب المتابعين
async function confirmOrder() {
    const profileUrl = document.getElementById('profile-url').value.trim();
    if (!profileUrl) {
        alert('يرجى إدخال رابط الحساب');
        return;
    }
    
    const pkg = state.products.followers.find(p => p.id === state.selectedPackage);
    if (!pkg) return;
    
    try {
        // حفظ الطلب في قاعدة البيانات
        const order = {
            type: 'followers',
            product_id: state.selectedPackage,
            profile_url: profileUrl,
            platform: state.selectedPlatform,
            followers_count: pkg.followers_count,
            price: pkg.price,
            status: 'pending'
        };
        
        await supabase.saveOrder(order);
        
        // عرض نافذة الدفع
        showPaymentModal('followers', pkg);
        
        // إعادة تعيين النموذج
        document.getElementById('order-form').classList.add('hidden');
        document.getElementById('profile-url').value = '';
        
    } catch (error) {
        console.error('Error saving order:', error);
        alert('حدث خطأ أثناء حفظ الطلب');
    }
}

// إلغاء الطلب
function cancelOrder() {
    document.getElementById('order-form').classList.add('hidden');
    document.getElementById('profile-url').value = '';
    state.selectedPackage = null;
}

// شراء منتج
function buyProduct(type, productId) {
    let product;
    
    if (type === 'account') {
        product = state.products.accounts.find(p => p.id === productId);
    } else if (type === 'voucher') {
        product = state.products.vouchers.find(p => p.id === productId);
    }
    
    if (product) {
        showPaymentModal(type, product);
    }
}

// عرض نافذة الدفع
function showPaymentModal(type, product) {
    document.getElementById('payment-modal').classList.remove('hidden');
    
    let content = '';
    if (type === 'voucher') {
        content = `
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <div class="product-price">${product.price} $</div>
            <p>ستحصل على: ${product.diamonds || 0} جوهرة</p>
            <button class="btn-primary" onclick="processPayment('${type}', '${product.id}')">
                <i class="fas fa-credit-card"></i> المتابعة للدفع عبر NowPayments
            </button>
        `;
    } else if (type === 'account') {
        content = `
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <div class="product-price">${product.price} $</div>
            <button class="btn-primary" onclick="processPayment('${type}', '${product.id}')">
                <i class="fas fa-credit-card"></i> المتابعة للدفع عبر NowPayments
            </button>
        `;
    } else if (type === 'followers') {
        content = `
            <h3>طلب متابعين</h3>
            <p>المنصة: ${state.selectedPlatform}</p>
            <p>العدد: ${product.followers_count} متابع</p>
            <div class="product-price">${product.price} $</div>
            <button class="btn-primary" onclick="processPayment('followers', '${product.id}')">
                <i class="fas fa-credit-card"></i> المتابعة للدفع عبر NowPayments
            </button>
        `;
    }
    
    document.getElementById('payment-content').innerHTML = content;
}

// إخفاء نافذة الدفع
function hidePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
}

// معالجة الدفع (محاكاة)
async function processPayment(type, productId) {
    // هنا سيتم ربط NowPayments
    alert('سيتم توجيهك لصفحة الدفع عبر NowPayments');
    
    // محاكاة الدفع الناجح
    setTimeout(async () => {
        try {
            // تحديث حالة الطلب في قاعدة البيانات
            await supabase.updateOrderStatus(productId, 'completed');
            
            // عرض النتيجة للمستخدم
            if (type === 'voucher') {
                alert('تم الدفع بنجاح! يمكنك نسخ القسيمة الآن.');
            } else if (type === 'account') {
                alert('تم الدفع بنجاح! سيتم إرسال بيانات الحساب إليك.');
            } else if (type === 'followers') {
                alert('تم الدفع بنجاح! سيبدأ تنفيذ طلبك قريباً.');
            }
            
            hidePaymentModal();
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('حدث خطأ أثناء معالجة الدفع');
        }
    }, 2000);
}

// توليد كود قسيمة عشوائي
function generateVoucherCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// نسخ القسيمة
function copyVoucher() {
    const codeElement = document.getElementById('voucher-code');
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const originalText = codeElement.textContent;
        codeElement.textContent = 'تم النسخ!';
        codeElement.style.background = 'rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
            codeElement.textContent = originalText;
            codeElement.style.background = '';
        }, 2000);
    });
}

// عرض نافذة تسجيل دخول الأدمن
function showAdminLogin() {
    document.getElementById('admin-modal').classList.remove('hidden');
    document.getElementById('admin-password').focus();
}

// إخفاء نافذة تسجيل دخول الأدمن
function hideAdminLogin() {
    document.getElementById('admin-modal').classList.add('hidden');
    document.getElementById('admin-password').value = '';
}

// تسجيل دخول الأدمن
function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === 'Maski2026') {
        localStorage.setItem('adminToken', password);
        state.adminLoggedIn = true;
        hideAdminLogin();
        alert('تم تسجيل الدخول بنجاح!');
        
        // تحديث زر الأدمن
        document.querySelector('.admin-btn').innerHTML = '<i class="fas fa-cog"></i> لوحة التحكم';
        
        // توجيه إلى لوحة التحكم (في المستقبل)
        window.location.href = 'admin.html';
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

// A-ads Integration
function loadAads() {
    // سيتم تحميل إعلانات A-ads هنا
    const aadsDiv = document.getElementById('a-ads-placeholder');
    if (aadsDiv) {
        // محاكاة لإعلان A-ads
        aadsDiv.innerHTML = `
            <div style="padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px;">
                <h4>إعلان A-ads</h4>
                <p>سيظهر إعلان A-ads هنا عند إضافة الكود الخاص بك</p>
                <small>أضف كود A-ads في مكانه المخصص في الملف</small>
            </div>
        `;
    }
}

// تحميل إعلانات A-ads عند بدء التشغيل
loadAads();
