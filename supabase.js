here// تهيئة Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabaseClient = {
    // محاكاة للوظائف الأساسية (ستحتاج لإضافة مفاتيحك الفعلية)
    async getProducts(category) {
        // محاكاة للبيانات
        if (category === 'accounts') {
            return [
                {
                    id: '1',
                    title: 'حساب فري فاير VIP',
                    description: 'مستوى 70، أسلبة نادرة، 10 سكنات',
                    price: 49.99,
                    image_url: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Free+Fire+VIP'
                },
                {
                    id: '2',
                    title: 'حساب فري فاير برو',
                    description: 'مستوى 50، أسلبة مميزة، 5 سكنات',
                    price: 29.99,
                    image_url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Free+Fire+Pro'
                }
            ];
        } else if (category === 'vouchers') {
            return [
                {
                    id: 'v1',
                    title: '1000 جوهرة',
                    description: 'قسيمة 1000 جوهرة فري فاير',
                    price: 9.99,
                    diamonds: 1000
                },
                {
                    id: 'v2',
                    title: '5000 جوهرة',
                    description: 'قسيمة 5000 جوهرة فري فاير',
                    price: 39.99,
                    diamonds: 5000
                }
            ];
        } else if (category === 'followers') {
            return [
                {
                    id: 'f1',
                    title: '1000 متابع',
                    description: 'زيادة 1000 متابع حقيقي',
                    price: 19.99,
                    followers_count: 1000,
                    platform: 'instagram'
                },
                {
                    id: 'f2',
                    title: '5000 متابع',
                    description: 'زيادة 5000 متابع حقيقي',
                    price: 79.99,
                    followers_count: 5000,
                    platform: 'instagram'
                },
                {
                    id: 'f3',
                    title: '1000 متابع',
                    description: 'زيادة 1000 متابع فيسبوك',
                    price: 24.99,
                    followers_count: 1000,
                    platform: 'facebook'
                }
            ];
        }
        return [];
    },
    
    async saveOrder(order) {
        // محاكاة لحفظ الطلب
        console.log('Order saved:', order);
        return { success: true, orderId: 'ORD-' + Date.now() };
    },
    
    async updateOrderStatus(orderId, status) {
        // محاكاة لتحديث حالة الطلب
        console.log(`Order ${orderId} updated to ${status}`);
        return { success: true };
    }
};

// تصدير العميل
window.supabase = supabaseClient;
