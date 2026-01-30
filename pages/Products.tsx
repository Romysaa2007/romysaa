
import React, { useState, useEffect } from 'react';
import { Product, User, UserRole } from '../types';
import { getStore, saveStore } from '../services/store';

const Products: React.FC<{ user: User }> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    code: '', name: '', type: '', size: '', buyPrice: 0, sellPrice: 0, quantity: 0, minStockAlert: 5
  });

  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => {
    const init = async () => {
      const store = await getStore();
      setProducts(store.products || []);
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.code) return alert('يرجى تعبئة الخانات الأساسية');
    
    const store = await getStore();
    let newProducts = [...store.products];
    if (editingId) {
      newProducts = newProducts.map(p => p.id === editingId ? { ...formData, id: p.id } : p);
    } else {
      newProducts.push({ ...formData, id: Date.now().toString() });
    }
    
    store.products = newProducts;
    setProducts(newProducts);
    await saveStore(store);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', type: '', size: '', buyPrice: 0, sellPrice: 0, quantity: 0, minStockAlert: 5 });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900">المخزن والتسعير</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="بحث بالكود أو الاسم..." 
            className="flex-1 md:w-64 p-3 bg-slate-50 border rounded-xl outline-none font-bold"
            onChange={e => setSearchTerm(e.target.value)}
          />
          {isAdmin && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">
              إضافة صنف
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr className="text-slate-400 font-black text-[11px] uppercase">
                <th className="px-6 py-4">الكود</th>
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الحجم</th>
                {isAdmin && <th className="px-6 py-4 text-red-500">سعر الشراء</th>}
                <th className="px-6 py-4 text-emerald-600">سعر البيع</th>
                <th className="px-6 py-4">الكمية</th>
                {isAdmin && (
                  <>
                    <th className="px-6 py-4 bg-indigo-50 text-indigo-700">القيمة المالية</th>
                    <th className="px-6 py-4 bg-emerald-50 text-emerald-700">الربح المتوقع</th>
                  </>
                )}
                {isAdmin && <th className="px-6 py-4 text-center">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y text-sm font-bold">
              {products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm)).map(p => {
                const totalValue = p.buyPrice * p.quantity;
                const profitPerUnit = p.sellPrice - p.buyPrice;
                const totalProfit = profitPerUnit * p.quantity;
                const isLow = p.quantity <= p.minStockAlert;

                return (
                  <tr key={p.id} className={`${isLow ? 'bg-red-50/30' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="px-6 py-4 text-indigo-600">#{p.code}</td>
                    <td className="px-6 py-4 text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-500">{p.type}</td>
                    <td className="px-6 py-4 text-slate-500">{p.size}</td>
                    {isAdmin && <td className="px-6 py-4 text-red-600">{p.buyPrice} ج.م</td>}
                    <td className="px-6 py-4 text-emerald-600">{p.sellPrice} ج.م</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 rounded-full text-xs ${isLow ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                           {p.quantity}
                         </span>
                         {isLow && <span className="text-[10px] text-red-500 font-black">نقص مخزون!</span>}
                      </div>
                    </td>
                    {isAdmin && (
                      <>
                        <td className="px-6 py-4 bg-indigo-50/30 text-indigo-700 font-black">{totalValue.toLocaleString()} ج.م</td>
                        <td className="px-6 py-4 bg-emerald-50/30 text-emerald-700 font-black">+{totalProfit.toLocaleString()} ج.م</td>
                      </>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setFormData({...p}); setEditingId(p.id); setShowModal(true); }} className="p-2 hover:bg-white rounded-lg shadow-sm">📝</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-slate-800">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الكود" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              <input type="text" placeholder="اسم المنتج" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="النوع" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
              <input type="text" placeholder="الحجم" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
              <div className="space-y-1">
                <label className="text-xs font-black mr-2 text-red-500">سعر الشراء (ج.م)</label>
                <input type="number" className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-black" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black mr-2 text-emerald-600">سعر البيع (ج.م)</label>
                <input type="number" className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black mr-2">الكمية المتاحة</label>
                <input type="number" className="w-full p-4 bg-slate-100 border rounded-2xl font-black" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black mr-2 text-orange-500">تنبيه عند كمية أقل من</label>
                <input type="number" className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl font-black text-orange-700" value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: Number(e.target.value)})} />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg">حفظ</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
