// حالة التطبيق
const state = {
    currentSection: 'home',
    selectedProduct: null,
    selectedPlatform: 'instagram',
    adminLoggedIn: false,
    products: {
        accounts: [],
        vouchers: [],
        followers: []
    }
};

// بدء التطبيق
async function init() {
    console.log('بدء تطبيق MAS Ki stor...');
    
    setupEventListeners();
    checkAdminStatus();
    await loadAllProducts();
    setupNavigation();
}

// إعداد المستمعين
function setupEventListeners() {
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            switchSection(section);
        });
    });
    
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            changePlatform(this.getAttribute('data-platform'));
        });
    });
}

function setupNavigation() {
    const lastSection = localStorage.getItem('lastSection') || 'home';
    switchSection(lastSection);
}

function switchSection(sectionId) {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('active');
    
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`[href="#${sectionId}"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
        state.currentSection = sectionId;
        localStorage.setItem('lastSection', sectionId);
    }
}

// تحميل جميع المنتجات
async function loadAllProducts() {
    console.log('جاري تحميل المنتجات...');
    
    try {
        // الحسابات
        const accountsSnapshot = await firestoreDB.collection('products')
            .where('category', '==', 'accounts')
            .where('isActive', '==', true)
            .get();
        
        state.products.accounts = accountsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderAccounts(state.products.accounts);
        
        // القسائم
        const vouchersSnapshot = await firestoreDB.collection('products')
            .where('category', '==', 'vouchers')
            .where('isActive', '==', true)
            .get();
        
        state.products.vouchers = vouchersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderVouchers(state.products.vouchers);
        
        // المتابعين
        const followersSnapshot = await firestoreDB.collection('products')
            .where('category', '==', 'followers')
            .where('isActive', '==', true)
            .get();
        
        state.products.followers = followersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderPackages(state.products.followers, 'instagram');
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        loadSampleData();
    }
}

function loadSampleData() {
    state.products.accounts = [{
        id: 'sample1',
        title: 'حساب فري فاير VIP',
        description: 'مستوى 70، أسلحة نادرة',
        price: 49.99,
        level: 70,
        diamonds: 5000,
        images: ['https://via.placeholder.com/300x200/6366f1/ffffff?text=VIP+Account']
    }];
    
    state.products.vouchers = [{
        id: 'vsample1',
        title: '1000 جوهرة',
        price: 9.99,
        diamonds: 1000
    }];
    
    state.products.followers = [{
        id: 'fsample1',
        title: '1000 متابع انستغرام',
        price: 19.99,
        followers_count: 1000,
        platform: 'instagram'
    }];
    
    renderAccounts(state.products.accounts);
    renderVouchers(state.products.vouchers);
    renderPackages(state.products.followers, 'instagram');
}

// عرض الحسابات
function renderAccounts(accounts) {
    const container = document.getElementById('accountsGrid');
    if (!container) return;
    
    if (!accounts || accounts.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد حسابات متاحة</div>';
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="product-card">
            <img src="${account.images && account.images.length > 0 ? account.images[0] : 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Free+Fire'}" 
                 class="product-image">
            <div class="product-content">
                <h3 class="product-title">${account.title}</h3>
                <p class="product-description">${account.description || 'لا يوجد وصف'}</p>
                <div class="product-meta">
                    ${account.level ? `<span><i class="fas fa-level-up-alt"></i> ${account.level}</span>` : ''}
                    ${account.diamonds ? `<span><i class="fas fa-gem"></i> ${account.diamonds}</span>` : ''}
                </div>
                <div class="product-price">$${account.price}</div>
                <button class="btn btn-primary" onclick="buyProduct('account', '${account.id}', '${account.title}', ${account.price})">
                    <i class="fas fa-shopping-cart"></i> شراء الآن
                </button>
            </div>
        </div>
    `).join('');
}

// عرض القسائم
function renderVouchers(vouchers) {
    const container = document.getElementById('vouchersList');
    if (!container) return;
    
    if (!vouchers || vouchers.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد قسائم متاحة</div>';
        return;
    }
    
    container.innerHTML = vouchers.map(voucher => `
        <div class="voucher-item" onclick="selectVoucher('${voucher.id}', '${voucher.title}', ${voucher.price}, ${voucher.diamonds || 0})">
            <h4>${voucher.title}</h4>
            <div class="product-price">$${voucher.price}</div>
            ${voucher.diamonds ? `<p><i class="fas fa-gem"></i> ${voucher.diamonds} جوهرة</p>` : ''}
        </div>
    `).join('');
}

// عرض الباقات
function renderPackages(packages, platform) {
    const container = document.getElementById('packagesGrid');
    if (!container) return;
    
    const filtered = packages.filter(pkg => pkg.platform === platform);
    
    if (!filtered.length) {
        container.innerHTML = '<div class="loading">لا توجد باقات لهذه المنصة</div>';
        return;
    }
    
    container.innerHTML = filtered.map(pkg => `
        <div class="package-card">
            <h4>${pkg.title}</h4>
            <div class="product-price">$${pkg.price}</div>
            <button class="btn btn-primary" onclick="buyFollowers('${pkg.id}', '${pkg.title}', ${pkg.price}, ${pkg.followers_count}, '${pkg.platform}')">
                <i class="fas fa-shopping-cart"></i> شراء الآن
            </button>
        </div>
    `).join('');
}

// اختيار قسيمة
function selectVoucher(voucherId, title, price, diamonds) {
    const display = document.getElementById('voucherDisplay');
    if (!display) return;
    
    display.innerHTML = `
        <div class="voucher-result">
            <h3>${title}</h3>
            ${diamonds ? `<p><i class="fas fa-gem"></i> ${diamonds} جوهرة</p>` : ''}
            <div class="product-price">$${price}</div>
            <button class="btn btn-primary" onclick="buyProduct('voucher', '${voucherId}', '${title}', ${price}, ${diamonds})">
                <i class="fas fa-shopping-cart"></i> شراء الآن
            </button>
        </div>
    `;
}

function changePlatform(platform) {
    state.selectedPlatform = platform;
    renderPackages(state.products.followers, platform);
}

// شراء منتج
async function buyProduct(type, productId, productName, price, diamonds = 0) {
    state.selectedProduct = { type, id: productId, name: productName, price, diamonds };
    showPaymentModal();
}

// شراء متابعين
async function buyFollowers(packageId, title, price, count, platform) {
    state.selectedProduct = { type: 'followers', id: packageId, name: title, price, count, platform };
    showPaymentModal();
}

// عرض نافذة الدفع
function showPaymentModal() {
    if (!state.selectedProduct) return;
    
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');
    
    let description = state.selectedProduct.name;
    if (state.selectedProduct.type === 'voucher' && state.selectedProduct.diamonds) {
        description += ` (${state.selectedProduct.diamonds} جوهرة)`;
    } else if (state.selectedProduct.type === 'followers' && state.selectedProduct.count) {
        description += ` (${state.selectedProduct.count} متابع)`;
    }
    
    content.innerHTML = `
        <div class="payment-details">
            <h4>تفاصيل الشراء</h4>
            <div class="payment-info">
                <p><strong>المنتج:</strong> ${description}</p>
                <p><strong>السعر:</strong> $${state.selectedProduct.price}</p>
                <p><strong>الدفع عبر:</strong> NowPayments</p>
            </div>
            <div class="payment-actions">
                <button class="btn btn-secondary" onclick="closeModal('paymentModal')">
                    إلغاء
                </button>
                <button class="btn btn-primary" onclick="processPayment()">
                    تأكيد الدفع
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// معالجة الدفع
async function processPayment() {
    try {
        if (!state.selectedProduct) return;
        
        closeModal('paymentModal');
        
        // إنشاء طلب
        const orderId = `ORD-${Date.now()}`;
        
        await firestoreDB.collection('orders').add({
            orderId: orderId,
            productType: state.selectedProduct.type,
            productId: state.selectedProduct.id,
            productName: state.selectedProduct.name,
            amount: state.selectedProduct.price,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        // محاكاة الدفع (ستستبدل بـ NowPayments)
        setTimeout(() => {
            completePayment(orderId);
        }, 2000);
        
    } catch (error) {
        console.error('خطأ في الدفع:', error);
        alert('خطأ في عملية الدفع');
    }
}

// إكمال الدفع
async function completePayment(orderId) {
    try {
        // تحديث حالة الطلب
        const query = await firestoreDB.collection('orders').where('orderId', '==', orderId).get();
        if (!query.empty) {
            const doc = query.docs[0];
            await doc.ref.update({ status: 'completed' });
        }
        
        // عرض النتيجة
        if (state.selectedProduct.type === 'account') {
            showAccountResult();
        } else if (state.selectedProduct.type === 'voucher') {
            showVoucherResult();
        } else if (state.selectedProduct.type === 'followers') {
            showFollowersForm();
        }
        
    } catch (error) {
        console.error('خطأ في إكمال الدفع:', error);
    }
}

// نتيجة الحساب
function showAccountResult() {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    const accountData = {
        username: `FF_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        password: `FF${Math.floor(Math.random() * 1000000)}`,
        email: `account${Math.floor(Math.random() * 1000)}@freefire.com`
    };
    
    content.innerHTML = `
        <div class="result-success">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p>بيانات حسابك:</p>
            <div class="result-data">
                <p><strong>اسم المستخدم:</strong> ${accountData.username}</p>
                <p><strong>كلمة المرور:</strong> ${accountData.password}</p>
                <p><strong>البريد:</strong> ${accountData.email}</p>
            </div>
            <button class="btn btn-primary" onclick="closeModal('resultModal')">
                تم الاستلام
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// نتيجة القسيمة
function showVoucherResult() {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    const voucherCode = `FF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    content.innerHTML = `
        <div class="result-success">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p>قسيمتك:</p>
            <div class="voucher-code" onclick="copyToClipboard(this)">${voucherCode}</div>
            <button class="btn btn-primary" onclick="copyToClipboard('${voucherCode}')">
                نسخ القسيمة
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// نموذج المتابعين
function showFollowersForm() {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    content.innerHTML = `
        <div class="followers-form">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p>أكمل معلومات الطلب:</p>
            <input type="text" id="profileUrl" placeholder="رابط الحساب" class="modal-input">
            <textarea id="profileNotes" placeholder="ملاحظات" class="modal-input" rows="3"></textarea>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="submitFollowersOrder()">
                    تأكيد الطلب
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// إرسال طلب المتابعين
async function submitFollowersOrder() {
    const profileUrl = document.getElementById('profileUrl').value;
    
    if (!profileUrl) {
        alert('الرجاء إدخال رابط الحساب');
        return;
    }
    
    alert('تم تأكيد طلبك! سيتم معالجته خلال 24 ساعة.');
    closeModal('resultModal');
}

function copyToClipboard(text) {
    if (typeof text === 'string') {
        navigator.clipboard.writeText(text);
        alert('تم النسخ!');
    } else if (text.textContent) {
        navigator.clipboard.writeText(text.textContent);
        alert('تم النسخ!');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// التحقق من حالة الأدمن
function checkAdminStatus() {
    const token = localStorage.getItem('adminToken');
    if (token === 'Maski2026') {
        state.adminLoggedIn = true;
        window.location.href = 'admin.html';
    } else {
        showAdminLogin();
    }
}

function showAdminLogin() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.add('active');
}

function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'Maski2026') {
        localStorage.setItem('adminToken', password);
        closeModal('adminModal');
        window.location.href = 'admin.html';
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', init);
