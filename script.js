// حالة التطبيق
const state = {
    currentSection: 'home',
    selectedProduct: null,
    paymentInProgress: false,
    adminLoggedIn: false,
    selectedPlatform: 'instagram',
    cart: [],
    products: {
        accounts: [],
        vouchers: [],
        followers: []
    }
};

// تهيئة التطبيق
async function init() {
    setupEventListeners();
    checkAdminStatus();
    await loadAllProducts();
    
    // تتبع أقسام الموقع
    trackNavigation();
}

// تحميل جميع المنتجات من Supabase
async function loadAllProducts() {
    try {
        // تحميل الحسابات
        const { data: accounts, error: accountsError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'accounts')
            .eq('is_active', true);
        
        if (!accountsError) {
            state.products.accounts = accounts || [];
            renderAccounts(accounts);
        }
        
        // تحميل القسائم
        const { data: vouchers, error: vouchersError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'vouchers')
            .eq('is_active', true);
        
        if (!vouchersError) {
            state.products.vouchers = vouchers || [];
            renderVouchers(vouchers);
        }
        
        // تحميل باقات المتابعين
        const { data: followers, error: followersError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', 'followers')
            .eq('is_active', true);
        
        if (!followersError) {
            state.products.followers = followers || [];
            renderPackages(followers, state.selectedPlatform);
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('حدث خطأ في تحميل المنتجات');
    }
}

// عرض الحسابات
async function renderAccounts(accounts) {
    const container = document.getElementById('accountsGrid');
    if (!container) return;
    
    if (!accounts || accounts.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد حسابات متاحة حالياً</div>';
        return;
    }
    
    let html = '';
    
    for (const account of accounts) {
        // تحميل الصور
        let imagesHtml = '';
        if (account.images && account.images.length > 0) {
            imagesHtml = account.images.slice(0, 7).map(img => 
                `<div class="product-thumb" style="background-image: url('${img}')"></div>`
            ).join('');
        }
        
        html += `
            <div class="product-card animate-fade">
                <div class="product-images">
                    ${imagesHtml || '<div class="product-img"></div>'}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${account.title}</h3>
                    <p class="product-desc">${account.description || ''}</p>
                    <div class="product-meta">
                        <span><i class="fas fa-level-up-alt"></i> ${account.level || 'مستوى 1'}</span>
                        <span><i class="fas fa-gem"></i> ${account.diamonds || 0}</span>
                        <span><i class="fas fa-shopping-bag"></i> ${account.skins || 0} سكن</span>
                    </div>
                    <div class="product-price">$${account.price || 0}</div>
                    <button class="btn primary" onclick="buyProduct('account', '${account.id}', '${account.title}', ${account.price})">
                        <i class="fas fa-shopping-cart"></i> شراء الآن
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// عرض القسائم
function renderVouchers(vouchers) {
    const container = document.getElementById('vouchersList');
    if (!container) return;
    
    if (!vouchers || vouchers.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد قسائم متاحة حالياً</div>';
        return;
    }
    
    container.innerHTML = vouchers.map(voucher => `
        <div class="voucher-item" onclick="selectVoucher('${voucher.id}', '${voucher.title}', ${voucher.price}, ${voucher.diamonds || 0})">
            <h4>${voucher.title}</h4>
            <div class="product-price">$${voucher.price}</div>
            <p><i class="fas fa-gem"></i> ${voucher.diamonds || 0} جوهرة</p>
        </div>
    `).join('');
}

// عرض باقات المتابعين
function renderPackages(packages, platform) {
    const container = document.getElementById('packages');
    if (!container) return;
    
    const filtered = packages.filter(pkg => pkg.platform === platform);
    
    if (!filtered.length) {
        container.innerHTML = '<div class="loading">لا توجد باقات متاحة لهذه المنصة</div>';
        return;
    }
    
    container.innerHTML = filtered.map(pkg => `
        <div class="package">
            <h4>${pkg.followers_count} متابع</h4>
            <p>${pkg.description || 'زيادة متابعين حقيقية'}</p>
            <div class="product-price">$${pkg.price}</div>
            <button class="btn primary" onclick="buyFollowers('${pkg.id}', '${pkg.title}', ${pkg.price}, ${pkg.followers_count}, '${pkg.platform}')">
                <i class="fas fa-shopping-cart"></i> شراء الآن
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
        
        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }
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
        
        // حفظ القسم النشط
        localStorage.setItem('lastSection', sectionId);
    }
}

// تتبع التنقل
function trackNavigation() {
    const lastSection = localStorage.getItem('lastSection') || 'home';
    switchSection(lastSection);
}

// اختيار قسيمة
function selectVoucher(voucherId, title, price, diamonds) {
    const display = document.getElementById('voucherDisplay');
    if (!display) return;
    
    display.innerHTML = `
        <div class="voucher-result">
            <h3>${title}</h3>
            <p><i class="fas fa-gem"></i> ${diamonds} جوهرة</p>
            <div class="product-price">$${price}</div>
            <button class="btn primary" onclick="buyProduct('voucher', '${voucherId}', '${title}', ${price}, ${diamonds})">
                <i class="fas fa-shopping-cart"></i> شراء الآن
            </button>
        </div>
    `;
    
    // تحديث التحديد في القائمة
    document.querySelectorAll('.voucher-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selected = document.querySelector(`.voucher-item[onclick*="${voucherId}"]`);
    if (selected) selected.classList.add('selected');
}

// تغيير المنصة للمتابعين
function changePlatform(platform) {
    state.selectedPlatform = platform;
    
    // تحديث الأزرار
    document.querySelectorAll('.platform').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-platform') === platform) {
            btn.classList.add('active');
        }
    });
    
    // إعادة تحميل الباقات
    renderPackages(state.products.followers, platform);
}

// شراء منتج (حسابات أو قسائم)
async function buyProduct(type, productId, productName, price, diamonds = 0) {
    state.selectedProduct = {
        type,
        id: productId,
        name: productName,
        price,
        diamonds
    };
    
    // عرض نافذة الدفع
    showPaymentModal(type, productName, price, diamonds);
}

// شراء متابعين
async function buyFollowers(packageId, title, price, count, platform) {
    state.selectedProduct = {
        type: 'followers',
        id: packageId,
        name: title,
        price: price,
        count: count,
        platform: platform
    };
    
    // عرض نافذة الدفع
    showPaymentModal('followers', title, price, count);
}

// عرض نافذة الدفع
function showPaymentModal(type, productName, price, extraInfo) {
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');
    
    let description = productName;
    if (type === 'voucher' && extraInfo) {
        description += ` (${extraInfo} جوهرة)`;
    } else if (type === 'followers' && extraInfo) {
        description += ` (${extraInfo} متابع)`;
    }
    
    content.innerHTML = `
        <div class="payment-details">
            <div class="payment-info">
                <h4>تفاصيل الشراء:</h4>
                <div class="info-item">
                    <span>المنتج:</span>
                    <span>${description}</span>
                </div>
                <div class="info-item">
                    <span>السعر:</span>
                    <span class="price">$${price}</span>
                </div>
                <div class="info-item">
                    <span>طريقة الدفع:</span>
                    <span>NowPayments (عملات رقمية)</span>
                </div>
            </div>
            
            <div class="payment-notice">
                <p><i class="fas fa-info-circle"></i> بعد الدفع، سيتم تأكيد طلبك تلقائيًا وتستلم المنتج فورًا.</p>
            </div>
            
            <div class="payment-actions">
                <button class="btn secondary" onclick="hidePaymentModal()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="btn primary" onclick="processPayment()">
                    <i class="fas fa-credit-card"></i> المتابعة للدفع
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// معالجة الدفع عبر NowPayments
async function processPayment() {
    try {
        if (!state.selectedProduct) return;
        
        state.paymentInProgress = true;
        
        // إنشاء طلب في قاعدة البيانات
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
                order_id: orderId,
                product_type: state.selectedProduct.type,
                product_id: state.selectedProduct.id,
                product_name: state.selectedProduct.name,
                amount: state.selectedProduct.price,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (orderError) throw orderError;
        
        // إنشاء فاتورة NowPayments
        const invoiceUrl = await nowpaymentsUtils.createInvoice(
            state.selectedProduct.price,
            state.selectedProduct.name,
            orderId
        );
        
        if (!invoiceUrl) {
            throw new Error('فشل في إنشاء فاتورة الدفع');
        }
        
        // توجيه المستخدم لصفحة الدفع
        window.open(invoiceUrl, '_blank');
        
        // بدء تتبع حالة الدفع
        startPaymentTracking(orderId);
        
        // إخفاء نافذة الدفع
        hidePaymentModal();
        
    } catch (error) {
        console.error('Payment error:', error);
        showError('حدث خطأ في عملية الدفع');
        state.paymentInProgress = false;
    }
}

// تتبع حالة الدفع
async function startPaymentTracking(orderId) {
    let attempts = 0;
    const maxAttempts = 60; // 5 دقائق (كل 5 ثواني)
    
    const checkInterval = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
            clearInterval(checkInterval);
            showError('انتهت مدة الانتظار للدفع');
            return;
        }
        
        try {
            // التحقق من حالة الطلب في قاعدة البيانات
            const { data: order, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('order_id', orderId)
                .single();
            
            if (error) throw error;
            
            if (order.status === 'completed') {
                clearInterval(checkInterval);
                onPaymentSuccess(order);
            } else if (order.status === 'failed') {
                clearInterval(checkInterval);
                showError('فشل عملية الدفع');
            }
            
        } catch (error) {
            console.error('Tracking error:', error);
        }
    }, 5000); // كل 5 ثواني
}

// عند نجاح الدفع
async function onPaymentSuccess(order) {
    state.paymentInProgress = false;
    
    try {
        // جلب تفاصيل المنتج
        const { data: product, error: productError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', order.product_id)
            .single();
        
        if (productError) throw productError;
        
        // عرض النتيجة حسب نوع المنتج
        if (order.product_type === 'account') {
            showAccountAfterPayment(product, order);
        } 
        else if (order.product_type === 'voucher') {
            showVoucherAfterPayment(product, order);
        }
        else if (order.product_type === 'followers') {
            showFollowersFormAfterPayment(product, order);
        }
        
    } catch (error) {
        console.error('Error in payment success:', error);
        showError('حدث خطأ في معالجة الطلب');
    }
}

// عرض بيانات الحساب بعد الدفع
function showAccountAfterPayment(product, order) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    // توليد بيانات الحساب العشوائية
    const accountData = {
        username: `FF_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        password: `FF@${Math.floor(Math.random() * 1000000)}`,
        email: `account.${Math.floor(Math.random() * 1000)}@freefiremail.com`,
        recovery_code: `RC-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };
    
    content.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p class="success-text">شكرًا لشرائك. إليك بيانات حسابك:</p>
            
            <div class="account-data">
                <div class="data-item">
                    <strong><i class="fas fa-user"></i> اسم المستخدم:</strong>
                    <span class="copyable" onclick="copyText(this)">${accountData.username}</span>
                </div>
                <div class="data-item">
                    <strong><i class="fas fa-lock"></i> كلمة المرور:</strong>
                    <span class="copyable" onclick="copyText(this)">${accountData.password}</span>
                </div>
                <div class="data-item">
                    <strong><i class="fas fa-envelope"></i> البريد الإلكتروني:</strong>
                    <span class="copyable" onclick="copyText(this)">${accountData.email}</span>
                </div>
                <div class="data-item">
                    <strong><i class="fas fa-key"></i> كود الاسترجاع:</strong>
                    <span class="copyable" onclick="copyText(this)">${accountData.recovery_code}</span>
                </div>
            </div>
            
            <div class="warning-box">
                <i class="fas fa-exclamation-triangle"></i>
                <p>احفظ هذه البيانات في مكان آمن ولا تشاركها مع أحد!</p>
            </div>
            
            <button class="btn primary" onclick="hideResultModal()">
                <i class="fas fa-check"></i> تم الاستلام
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// عرض القسيمة بعد الدفع
function showVoucherAfterPayment(product, order) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    // توليد كود القسيمة
    const voucherCode = `FF-${Math.random().toString(36).substr(2, 8).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    content.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p class="success-text">شكرًا لشرائك. إليك قسيمتك:</p>
            
            <div class="voucher-result">
                <div class="voucher-code" id="voucherCodeResult" onclick="copyVoucherCode()">
                    ${voucherCode}
                </div>
                <p class="voucher-info"><i class="fas fa-gem"></i> ${product.diamonds || 0} جوهرة</p>
                
                <button class="btn primary" onclick="copyVoucherCode()">
                    <i class="fas fa-copy"></i> نسخ القسيمة
                </button>
            </div>
            
            <div class="instructions">
                <h4><i class="fas fa-info-circle"></i> كيفية الاستخدام:</h4>
                <p>1. افتح لعبة فري فاير</p>
                <p>2. اذهب إلى قسم شراء الجواهر</p>
                <p>3. اختر "إدخال كود"</p>
                <p>4. الصق الكود واضغط تأكيد</p>
            </div>
            
            <button class="btn secondary" onclick="hideResultModal()">
                إغلاق
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// عرض نموذج المتابعين بعد الدفع
function showFollowersFormAfterPayment(product, order) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    
    content.innerHTML = `
        <div class="followers-form">
            <div class="success-icon">✅</div>
            <h3>تم الدفع بنجاح!</h3>
            <p class="success-text">الرجاء إكمال معلومات الطلب:</p>
            
            <div class="order-summary">
                <div class="summary-item">
                    <span>الباقة:</span>
                    <span>${product.followers_count} متابع</span>
                </div>
                <div class="summary-item">
                    <span>المبلغ:</span>
                    <span>$${product.price}</span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="followersPlatform"><i class="fas fa-globe"></i> اختر المنصة:</label>
                <select id="followersPlatform" class="input">
                    <option value="instagram">انستغرام</option>
                    <option value="facebook">فيسبوك</option>
                    <option value="tiktok">تيك توك</option>
                    <option value="twitter">تويتر</option>
                    <option value="youtube">يوتيوب</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="followersProfile"><i class="fas fa-link"></i> رابط الحساب أو اليوزر:</label>
                <input type="text" id="followersProfile" 
                       placeholder="مثال: instagram.com/username أو @username" 
                       class="input">
                <small class="hint">تأكد من أن الحساب عام وليس خاص</small>
            </div>
            
            <div class="form-group">
                <label for="followersNote"><i class="fas fa-sticky-note"></i> ملاحظات إضافية (اختياري):</label>
                <textarea id="followersNote" 
                         placeholder="أي تعليمات خاصة بالطلب..." 
                         class="input" 
                         rows="3"></textarea>
            </div>
            
            <div class="form-actions">
                <button class="btn secondary" onclick="hideResultModal()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="btn primary" onclick="submitFollowersOrder('${order.order_id}', '${product.id}')">
                    <i class="fas fa-check"></i> تأكيد الطلب
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// إرسال طلب المتابعين
async function submitFollowersOrder(orderId, productId) {
    try {
        const platform = document.getElementById('followersPlatform').value;
        const profile = document.getElementById('followersProfile').value.trim();
        const note = document.getElementById('followersNote').value.trim();
        
        if (!profile) {
            showError('الرجاء إدخال رابط الحساب');
            return;
        }
        
        // تحديث الطلب في قاعدة البيانات
        const { error } = await supabaseClient
            .from('orders')
            .update({
                platform: platform,
                profile_url: profile,
                notes: note,
                status: 'processing'
            })
            .eq('order_id', orderId);
        
        if (error) throw error;
        
        // تحديث حالة المنتج
        await supabaseClient
            .from('products')
            .update({ stock: supabaseClient.sql`stock - 1` })
            .eq('id', productId);
        
        hideResultModal();
        
        // عرض رسالة النجاح
        setTimeout(() => {
            alert('✅ تم تأكيد طلبك بنجاح!\n\nسيتم بدء التنفيذ خلال 24 ساعة.\nيمكنك متابعة طلبك من خلال رقم الطلب: ' + orderId);
        }, 300);
        
    } catch (error) {
        console.error('Error submitting order:', error);
        showError('حدث خطأ في تأكيد الطلب');
    }
}

// نسخ النص
function copyText(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const original = element.textContent;
        element.textContent = 'تم النسخ!';
        element.style.color = '#10b981';
        
        setTimeout(() => {
            element.textContent = original;
            element.style.color = '';
        }, 2000);
    });
}

// نسخ القسيمة
function copyVoucherCode() {
    const codeElement = document.getElementById('voucherCodeResult');
    if (codeElement) {
        copyText(codeElement);
    }
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

// عرض نافذة الأدمن
function showAdminLogin() {
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
        window.location.href = 'admin.html';
    } else {
        showError('كلمة المرور غير صحيحة!');
    }
}

// إخفاء نافذة الدفع
function hidePaymentModal() {
    if (!state.paymentInProgress) {
        document.getElementById('paymentModal').classList.remove('active');
    }
}

// إخفاء نافذة النتائج
function hideResultModal() {
    document.getElementById('resultModal').classList.remove('active');
    state.selectedProduct = null;
}

// عرض خطأ
function showError(message) {
    alert(`❌ ${message}`);
}

// إخفاء القائمة على الهاتف عند النقر على رابط
function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks && window.innerWidth <= 768) {
        navLinks.classList.remove('active');
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', init);

// تصدير الدوال للاستخدام في الملفات الأخرى
window.appState = state;
window.utils = {
    switchSection,
    showError,
    copyText
};
