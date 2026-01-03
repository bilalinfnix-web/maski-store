// حالة التطبيق
const state = {
    currentSection: 'home',
    selectedVoucher: null,
    selectedPackage: null,
    selectedPlatform: 'instagram',
    adminLoggedIn: false
};

// تهيئة التطبيق
function init() {
    loadProducts();
    setupEventListeners();
    checkAdminLogin();
}

// تحميل المنتجات (مثال)
function loadProducts() {
    // حسابات فري فاير
    const accounts = [
        {
            id: 1,
            name: 'حساب فري فاير VIP',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop'
        },
        {
            id: 2,
            name: 'حساب فري فاير برو',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w-300&h=200&fit=crop'
        }
    ];
    
    // قسائم
    const vouchers = [
        { id: 1, name: '1000 جوهرة', price: 9.99, diamonds: 1000 },
        { id: 2, name: '5000 جوهرة', price: 39.99, diamonds: 5000 }
    ];
    
    // متابعين
    const packages = [
        { id: 1, platform: 'instagram', count: 1000, price: 19.99 },
        { id: 2, platform: 'instagram', count: 5000, price: 79.99 },
        { id: 3, platform: 'facebook', count: 1000, price: 24.99 }
    ];
    
    renderAccounts(accounts);
    renderVouchers(vouchers);
    renderPackages(packages, 'instagram');
}

// عرض الحسابات
function renderAccounts(accounts) {
    const container = document.getElementById('accountsGrid');
    if (!container) return;
    
    container.innerHTML = accounts.map(account => `
        <div class="product-card">
            <img src="${account.image}" alt="${account.name}" class="product-img">
            <div class="product-info">
                <h3 class="product-name">${account.name}</h3>
                <div class="product-price">${account.price} $</div>
                <button class="btn primary" onclick="buyProduct('account', ${account.id})">
                    شراء الآن
                </button>
            </div>
        </div>
    `).join('');
}

// عرض القسائم
function renderVouchers(vouchers) {
    const container = document.getElementById('vouchersList');
    if (!container) return;
    
    container.innerHTML = vouchers.map(voucher => `
        <div class="voucher-item" onclick="selectVoucher(${voucher.id})">
            <h4>${voucher.name}</h4>
            <div class="product-price">${voucher.price} $</div>
        </div>
    `).join('');
}

// عرض باقات المتابعين
function renderPackages(packages, platform) {
    const container = document.getElementById('packages');
    if (!container) return;
    
    const filtered = packages.filter(pkg => pkg.platform === platform);
    
    container.innerHTML = filtered.map(pkg => `
        <div class="package" onclick="selectPackage(${pkg.id})">
            <h4>${pkg.count} متابع</h4>
            <div class="product-price">${pkg.price} $</div>
            <button class="btn primary" onclick="buyFollowers(${pkg.id})">
                طلب الآن
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
            const target = this.getAttribute('href').substring(1);
            switchSection(target);
        });
    });
    
    // زر القائمة للموبايل
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // تغيير المنصة
    document.querySelectorAll('.platform').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.platform').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const platform = this.getAttribute('data-platform');
            state.selectedPlatform = platform;
            // إعادة تحميل الباقات حسب المنصة
            loadPackagesByPlatform(platform);
        });
    });
}

// تبديل الأقسام
function switchSection(sectionId) {
    // إخفاء القائمة في الهاتف
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('active');
    
    // إخفاء جميع الأقسام
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة النشاط من الروابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`[href="#${sectionId}"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
        state.currentSection = sectionId;
        
        // التمرير للقسم
        setTimeout(() => {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

// اختيار قسيمة
function selectVoucher(voucherId) {
    state.selectedVoucher = voucherId;
    
    // تحديث التحديد
    document.querySelectorAll('.voucher-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selected = document.querySelector(`.voucher-item:nth-child(${voucherId})`);
    if (selected) selected.classList.add('selected');
    
    // عرض القسيمة
    showVoucher(voucherId);
}

// عرض تفاصيل القسيمة
function showVoucher(voucherId) {
    const display = document.getElementById('voucherDisplay');
    if (!display) return;
    
    display.innerHTML = `
        <div>
            <h3>قسيمة ${voucherId === 1 ? '1000' : '5000'} جوهرة</h3>
            <div class="voucher-code">FF-${Date.now().toString().slice(-8)}</div>
            <button class="btn primary" onclick="copyVoucher()">
                نسخ القسيمة
            </button>
            <button class="btn primary" onclick="buyProduct('voucher', ${voucherId})" style="margin-top: 0.5rem;">
                شراء الآن
            </button>
        </div>
    `;
}

// نسخ القسيمة
function copyVoucher() {
    const code = document.querySelector('.voucher-code');
    if (!code) return;
    
    navigator.clipboard.writeText(code.textContent).then(() => {
        alert('تم نسخ القسيمة!');
    });
}

// اختيار باقة
function selectPackage(packageId) {
    state.selectedPackage = packageId;
    
    document.querySelectorAll('.package').forEach(pkg => {
        pkg.classList.remove('selected');
    });
    
    const selected = document.querySelector(`.package:nth-child(${packageId})`);
    if (selected) selected.classList.add('selected');
}

// شراء متابعين
function buyFollowers(packageId) {
    state.selectedPackage = packageId;
    document.getElementById('orderForm').classList.remove('hidden');
    document.getElementById('profileUrl').focus();
}

// تأكيد طلب المتابعين
function confirmOrder() {
    const profileUrl = document.getElementById('profileUrl').value.trim();
    if (!profileUrl) {
        alert('يرجى إدخال رابط الحساب');
        return;
    }
    
    alert('تم تأكيد طلبك! سيتم معالجته قريباً.');
    cancelOrder();
}

// إلغاء الطلب
function cancelOrder() {
    document.getElementById('orderForm').classList.add('hidden');
    document.getElementById('profileUrl').value = '';
    state.selectedPackage = null;
}

// شراء منتج
function buyProduct(type, productId) {
    alert(`سيتم توجيهك لصفحة الدفع لشراء ${type === 'account' ? 'حساب' : 'قسيمة'}`);
}

// تحميل الباقات حسب المنصة
function loadPackagesByPlatform(platform) {
    // هذا مثال - سيتم استبداله ببيانات حقيقية
    const packages = {
        instagram: [
            { id: 1, count: 1000, price: 19.99 },
            { id: 2, count: 5000, price: 79.99 }
        ],
        facebook: [
            { id: 3, count: 1000, price: 24.99 },
            { id: 4, count: 5000, price: 99.99 }
        ],
        tiktok: [
            { id: 5, count: 1000, price: 29.99 },
            { id: 6, count: 5000, price: 119.99 }
        ]
    };
    
    renderPackages(packages[platform] || [], platform);
}

// التحقق من تسجيل دخول الأدمن
function checkAdminLogin() {
    const token = localStorage.getItem('adminToken');
    if (token === 'Maski2026') {
        state.adminLoggedIn = true;
        updateAdminButton();
    }
}

// تحديث زر الأدمن
function updateAdminButton() {
    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn && state.adminLoggedIn) {
        adminBtn.innerHTML = '<i class="fas fa-cog"></i> لوحة التحكم';
        adminBtn.onclick = () => {
            window.location.href = 'admin.html';
        };
    }
}

// عرض نافذة الأدمن
function showAdminLogin() {
    if (state.adminLoggedIn) {
        window.location.href = 'admin.html';
        return;
    }
    
    document.getElementById('adminModal').classList.add('active');
    document.getElementById('adminPassword').focus();
}

// إخفاء نافذة الأدمن
function hideAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

// تسجيل دخول الأدمن
function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'Maski2026') {
        localStorage.setItem('adminToken', password);
        state.adminLoggedIn = true;
        hideAdminModal();
        updateAdminButton();
        alert('تم تسجيل دخول الأدمن بنجاح!');
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);
