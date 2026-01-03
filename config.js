// إعدادات Supabase
const SUPABASE_URL = 'https://ftgjqvoiunulricuetmb.supabase.co'; // استبدل برابط مشروعك
const SUPABASE_ANON_KEY = 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm'; // استبدل بمفتاحك

// إعدادات NowPayments
const NOWPAYMENTS_API_KEY = 'your-nowpayments-api-key'; // استبدل بمفتاح API
const NOWPAYMENTS_URL = 'https://api.nowpayments.io/v1';

// تهيئة Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تصدير المتغيرات
window.supabaseClient = supabase;
window.nowpaymentsConfig = {
    apiKey: NOWPAYMENTS_API_KEY,
    apiUrl: NOWPAYMENTS_URL
};

// دالة لتحميل الصور من Supabase Storage
async function loadImageFromStorage(path) {
    try {
        const { data, error } = await supabase.storage
            .from('product-images')
            .getPublicUrl(path);
        
        if (error) throw error;
        return data.publicUrl;
    } catch (error) {
        console.error('Error loading image:', error);
        return 'https://via.placeholder.com/300x200?text=MAS+Ki+stor';
    }
}

// دالة لرفع الصور إلى Supabase Storage
async function uploadImageToStorage(file, productId) {
    try {
        const fileName = `${productId}_${Date.now()}_${file.name}`;
        const filePath = `products/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);
        
        if (error) throw error;
        
        // الحصول على رابط عام للصورة
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

// دالة إنشاء فاتورة NowPayments
async function createNowPaymentsInvoice(amount, productName, orderId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_URL}/invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': NOWPAYMENTS_API_KEY
            },
            body: JSON.stringify({
                price_amount: amount,
                price_currency: 'usd',
                order_id: orderId,
                order_description: productName,
                ipn_callback_url: 'https://your-domain.com/ipn-callback',
                success_url: 'https://your-domain.com/success',
                cancel_url: 'https://your-domain.com/cancel'
            })
        });
        
        if (!response.ok) throw new Error('Failed to create invoice');
        
        const data = await response.json();
        return data.invoice_url;
    } catch (error) {
        console.error('Error creating NowPayments invoice:', error);
        return null;
    }
}

// دالة التحقق من حالة الدفع
async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_URL}/payment/${paymentId}`, {
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to check payment status');
        
        const data = await response.json();
        return data.payment_status;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return 'failed';
    }
}

// تصدير الدوال
window.supabaseUtils = {
    loadImage: loadImageFromStorage,
    uploadImage: uploadImageToStorage
};

window.nowpaymentsUtils = {
    createInvoice: createNowPaymentsInvoice,
    checkStatus: checkPaymentStatus
};
