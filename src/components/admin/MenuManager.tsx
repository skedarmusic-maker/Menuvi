'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, ImagePlus, X, Tag } from 'lucide-react';

interface Category { id: string; name: string; order_index: number; restaurant_id: string; }
interface Product { id: string; category_id: string; name: string; description: string; price: number; image_url: string | null; is_active: boolean; is_available: boolean; is_featured: boolean; is_promo?: boolean; promo_price?: number; available_days?: number[]; variants?: any[]; }

export default function MenuManager({
  restaurantId,
  initialCategories,
  initialProducts,
}: {
  restaurantId: string;
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const supabase = createSupabaseBrowserClient();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [openCat, setOpenCat] = useState<string | null>(initialCategories[0]?.id ?? null);
  const [productModal, setProductModal] = useState<{ open: boolean; editing: Product | null; categoryId: string }>({ open: false, editing: null, categoryId: '' });
  const [catModal, setCatModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });

  const saveCategory = async (name: string) => {
    try {
      if (catModal.editing) {
        const { data, error } = await supabase.from('categories').update({ name }).eq('id', catModal.editing.id).select().single();
        if (error) throw error;
        if (data) setCategories((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        const { data, error } = await supabase.from('categories').insert({ name, restaurant_id: restaurantId, order_index: categories.length }).select().single();
        if (error) throw error;
        if (data) setCategories((prev) => [...prev, data]);
      }
      setCatModal({ open: false, editing: null });
    } catch (err: any) {
      alert('Erro ao salvar categoria: ' + err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Deletar categoria e todos os seus produtos?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setProducts((prev) => prev.filter((p) => p.category_id !== id));
    } catch (err: any) {
      alert('Erro ao deletar categoria: ' + err.message);
    }
  };

  const saveProduct = async (data: Partial<Product> & { imageFile?: File }) => {
    try {
      const { imageFile, ...rest } = data;
      let image_url = rest.image_url ?? null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `products/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('menuvi-public').upload(path, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('menuvi-public').getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      if (productModal.editing) {
        const { data: updated, error } = await supabase.from('products').update({ ...rest, image_url }).eq('id', productModal.editing.id).select().single();
        if (error) throw error;
        if (updated) setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const { data: created, error } = await supabase.from('products').insert({ ...rest, image_url, category_id: productModal.categoryId }).select().single();
        if (error) throw error;
        if (created) setProducts((prev) => [created, ...prev]);
      }
      setProductModal({ open: false, editing: null, categoryId: '' });
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Deletar este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert('Erro ao deletar produto: ' + err.message);
    }
  };

  const toggleAvailable = async (product: Product) => {
    try {
      const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)));
    } catch (err: any) {
      alert('Erro ao alterar disponibilidade: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setCatModal({ open: true, editing: null })} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">Nenhuma categoria ainda.</p>
        </div>
      )}

      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const isOpen = openCat === cat.id;
        return (
          <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <button onClick={() => setOpenCat(isOpen ? null : cat.id)} className="flex items-center gap-3 flex-1 text-left">
                <span className="text-white font-bold">{cat.name}</span>
                <span className="text-gray-600 text-sm">({catProducts.length})</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />}
              </button>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setCatModal({ open: true, editing: cat })} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-800 divide-y divide-gray-800">
                {catProducts.map((product) => (
                  <div key={product.id} className={`flex items-center gap-4 px-6 py-4 ${!product.is_active ? 'opacity-50' : ''}`}>
                    <div className="w-14 h-14 rounded-xl bg-gray-800 shrink-0 overflow-hidden relative">
                      {product.image_url ? <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="56px" /> : <ImagePlus className="w-6 h-6 m-auto mt-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{product.name}</p>
                      <p className="text-orange-400 font-bold text-sm mt-0.5">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => toggleAvailable(product)} 
                        title={product.is_available ? 'Pausar venda' : 'Ativar venda'}
                        className={`p-2 rounded-lg transition-colors ${product.is_available ? 'text-green-500 hover:bg-green-500/10' : 'text-gray-600 hover:bg-gray-800'}`}
                      >
                        {product.is_available ? <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm" /> : <div className="w-5 h-5 bg-gray-700 rounded-full border-2 border-gray-600 shadow-sm" />}
                      </button>
                      <button onClick={() => setProductModal({ open: true, editing: product, categoryId: product.category_id })} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <div className="px-6 py-3">
                  <button onClick={() => setProductModal({ open: true, editing: null, categoryId: cat.id })} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-400 transition-colors"><Plus className="w-4 h-4" /> Adicionar produto</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {catModal.open && <CategoryModal editing={catModal.editing} onSave={saveCategory} onClose={() => setCatModal({ open: false, editing: null })} />}
      {productModal.open && <ProductModal editing={productModal.editing} onSave={saveProduct} onClose={() => setProductModal({ open: false, editing: null, categoryId: '' })} />}
    </div>
  );
}

function CategoryModal({ editing, onSave, onClose }: { editing: Category | null; onSave: (name: string) => void; onClose: () => void; }) {
  const [name, setName] = useState(editing?.name ?? '');
  return (
    <ModalWrapper title={editing ? 'Editar Categoria' : 'Nova Categoria'} onClose={onClose}>
      <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Burgers, Bebidas..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" />
      <button onClick={() => name.trim() && onSave(name.trim())} className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors">Salvar</button>
    </ModalWrapper>
  );
}

function ProductModal({ editing, onSave, onClose }: { editing: Product | null; onSave: (data: any) => Promise<void>; onClose: () => void; }) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing?.price?.toString() ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.image_url ?? null);
  const [variants, setVariants] = useState<{ name: string; price: string }[]>(editing?.variants?.map(v => ({ name: v.name, price: v.price.toString() })) ?? []);
  const [isPromo, setIsPromo] = useState(editing?.is_promo ?? false);
  const [promoPrice, setPromoPrice] = useState(editing?.promo_price?.toString() ?? '');
  const [availableDays, setAvailableDays] = useState<number[]>(editing?.available_days ?? []);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { id: 0, label: 'Dom' },
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' },
  ];

  const toggleDay = (day: number) => {
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const addVariant = () => setVariants([...variants, { name: '', price: '' }]);
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: 'name' | 'price', value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name || (!price && variants.length === 0)) return;
    setLoading(true);
    const processedVariants = variants.map(v => ({ name: v.name, price: parseFloat(v.price.replace(',', '.')) })).filter(v => v.name && !isNaN(v.price));
    const finalPrice = processedVariants.length > 0 ? processedVariants[0].price : parseFloat(price.replace(',', '.'));
    await onSave({ 
      name, 
      description, 
      price: finalPrice, 
      image_url: editing?.image_url ?? null, 
      imageFile: imageFile ?? undefined, 
      is_active: true, 
      is_available: editing ? editing.is_available : true,
      is_featured: false, 
      is_promo: isPromo, 
      promo_price: isPromo ? parseFloat(promoPrice.replace(',', '.')) : null, 
      available_days: availableDays,
      variants: processedVariants 
    });
    setLoading(false);
  };

  return (
    <ModalWrapper title={editing ? 'Editar Produto' : 'Novo Produto'} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-2 custom-scrollbar text-left font-sans">
        <div className="relative w-full h-40 bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-orange-500 transition-colors shrink-0">
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" unoptimized />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-2 text-gray-500">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">Clique para adicionar foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Informações Básicas</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 resize-none" />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pl-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tamanhos / Preços</label>
            <button onClick={addVariant} className="text-orange-500 hover:text-orange-400 text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Tamanho</button>
          </div>
          {variants.length > 0 ? (
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} placeholder="Ex: P, M, G" className="w-32 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                    <input type="text" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} placeholder="0,00" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                  </div>
                  <button onClick={() => removeVariant(index)} className="p-2 text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span><input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-orange-500" /></div>
          )}
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-orange-500" /><span className="text-sm font-bold text-orange-400">Produto em Promoção?</span></div>
            <button type="button" onClick={() => setIsPromo(!isPromo)} className={`w-12 h-6 rounded-full transition-all relative ${isPromo ? 'bg-orange-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPromo ? 'left-7' : 'left-1'}`} /></button>
          </div>
          {isPromo && (
            <div className="animate-in fade-in zoom-in-95">
              <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Preço Promocional</label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-black">R$</span><input type="text" inputMode="decimal" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="0,00" className="w-full bg-gray-950 border border-orange-500/30 rounded-xl pl-12 pr-4 py-3 text-orange-400 font-black outline-none transition-all" /></div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Exibição Programada (Cardápio Semanal)</label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center border-2 ${
                  availableDays.includes(day.id) 
                    ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' 
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 font-medium pl-1">
            {availableDays.length === 0 ? 'Exibido todos os dias' : 'Exibido apenas nos dias selecionados'}
          </p>
        </div>

        <button disabled={loading || !name} onClick={handleSave} className="w-full mt-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 sticky bottom-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Produto'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-[32px] w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300 transition-all"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
