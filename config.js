// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBTZscf5MK2oIIirhAJ9PgzgYd5Yo9-O6E",
    authDomain: "mas-ki-stor.firebaseapp.com",
    projectId: "mas-ki-stor",
    storageBucket: "mas-ki-stor.firebasestorage.app",
    messagingSenderId: "210520044834",
    appId: "1:210520044834:web:2b42387c47e47b2186617b"
};

// تهيئة Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// NowPayments API (ضع مفتاحك هنا لاحقًا)
const NOWPAYMENTS_API_KEY = 'YOUR_API_KEY_HERE';

// دالة لتحميل الصور
async function loadImageFromStorage(path) {
    try {
        const url = await storage.ref(path).getDownloadURL();
        return url;
    } catch (error) {
        return 'https://via.placeholder.com/300x200/6366f1/ffffff?text=MAS+Ki+stor';
    }
}

// دالة لرفع الصور
async function uploadImageToStorage(file) {
    try {
        const fileName = `products/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(fileName);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();
        return url;
    } catch (error) {
        console.log('خطأ في رفع الصورة:', error);
        return null;
    }
}

// NowPayments وظائف
async function createNowPaymentsInvoice(amount, productName, orderId) {
    try {
        // محاكاة للاختبار
        console.log('NowPayments Invoice:', { amount, productName, orderId });
        
        // رابط تجريبي (استبدله بالرابط الحقيقي)
        return `https://nowpayments.io/payment/?amount=${amount}&description=${encodeURIComponent(productName)}&orderId=${orderId}`;
    } catch (error) {
        console.error('NowPayments Error:', error);
        return null;
    }
}

// التحقق من حالة الدفع
async function checkPaymentStatus(paymentId) {
    try {
        // محاكاة للاختبار
        return 'completed';
    } catch (error) {
        return 'failed';
    }
}

// تصدير
window.firebaseApp = app;
window.firestoreDB = db;
window.firebaseAuth = auth;
window.firebaseStorage = storage;

window.nowpaymentsUtils = {
    createInvoice: createNowPaymentsInvoice,
    checkStatus: checkPaymentStatus
};

window.firebaseUtils = {
    loadImage: loadImageFromStorage,
    uploadImage: uploadImageToStorage
};
