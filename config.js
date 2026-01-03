// إعدادات Supabase
const SUPABASE_URL = 'https://ftgjqvoiunulricuetmb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_X_GOb2cSy8ddfcHOSYCrzw_Bu7E-5Fm';

// تهيئة Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// إعدادات NowPayments
const NOWPAYMENTS_API_KEY = 'your-api-key-here'; // ضعه لاحقًا
const NOWPAYMENTS_URL = 'https://api.nowpayments.io/v1';

// دالة لتحميل الصور
async function loadImageFromStorage(path) {
    try {
        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
        return data?.publicUrl || null;
    } catch (error) {
        console.log('خطأ في تحميل الصورة:', error);
        return null;
    }
}

// دالة لرفع الصور
async function uploadImageToStorage(file) {
    try {
        if (!file) return null;
        
        const fileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const filePath = `${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.log('خطأ في رفع الصورة:', error);
            
            // محاولة باسم آخر
            const newFileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return uploadImageToStorage(file, newFileName);
        }
        
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        return urlData?.publicUrl || null;
    } catch (error) {
        console.log('خطأ غير متوقع في رفع الصورة:', error);
        return null;
    }
}

// NowPayments وظائف
async function createNowPaymentsInvoice(amount, productName, orderId) {
    try {
        // سيتم تفعيل هذا لاحقًا
        console.log('NowPayments Invoice Request:', {
            amount,
            productName,
            orderId
        });
        
        // رابط تجريبي للاختبار
        return `https://nowpayments.io/payment/?amount=${amount}&description=${encodeURIComponent(productName)}&orderId=${orderId}`;
    } catch (error) {
        console.error('NowPayments Error:', error);
        return null;
    }
}

async function checkPaymentStatus(paymentId) {
    try {
        // محاكاة لحالة الدفع
        return 'completed'; // أو 'pending', 'failed'
    } catch (error) {
        console.error('Payment Status Error:', error);
        return 'failed';
    }
}

// تصدير
window.supabaseClient = supabase;
window.supabaseUtils = {
    loadImage: loadImageFromStorage,
    uploadImage: uploadImageToStorage
};

window.nowpaymentsUtils = {
    createInvoice: createNowPaymentsInvoice,
    checkStatus: checkPaymentStatus
};
