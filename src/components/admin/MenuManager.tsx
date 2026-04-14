'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, ImagePlus, X, Tag } from 'lucide-react';

interface Category { id: string; name: string; order_index: number; restaurant_id: string; }
interface Product { id: string; category_id: string; name: string; description: string; price: number; image_url: string | null; is_active: boolean; is_featured: boolean; }

export default function MenuManager({
  restaurantId,
  initialCategories,
  initialProducts,
}: {
  restaurantId: string;
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [openCat, setOpenCat] = useState<string | null>(initialCategories[0]?.id ?? null);

  // --- Modal de Produto ---
  const [productModal, setProductModal] = useState<{ open: boolean; editing: Product | null; categoryId: string }>({ open: false, editing: null, categoryId: '' });

  // --- Modal de Categoria ---
  const [catModal, setCatModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });

  // ───────── CATEGORIAS ─────────
  const saveCategory = async (name: string) => {
    if (catModal.editing) {
      const { data } = await supabase.from('categories').update({ name }).eq('id', catModal.editing.id).select().single();
      if (data) setCategories((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    } else {
      const { data } = await supabase.from('categories').insert({ name, restaurant_id: restaurantId, order_index: categories.length }).select().single();
      if (data) setCategories((prev) => [...prev, data]);
    }
    setCatModal({ open: false, editing: null });
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Deletar categoria e todos os seus produtos?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) => prev.filter((p) => p.category_id !== id));
  };

  // ───────── PRODUTOS ─────────
  const saveProduct = async (data: Partial<Product> & { imageFile?: File }) => {
    const { imageFile, ...rest } = data;
    let image_url = rest.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('menuvi-public').upload(path, imageFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('menuvi-public').getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    if (productModal.editing) {
      const { data: updated } = await supabase.from('products').update({ ...rest, image_url }).eq('id', productModal.editing.id).select().single();
      if (updated) setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const { data: created } = await supabase.from('products').insert({ ...rest, image_url, category_id: productModal.categoryId }).select().single();
      if (created) setProducts((prev) => [created, ...prev]);
    }
    setProductModal({ open: false, editing: null, categoryId: '' });
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Deletar este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p)));
  };

  return (
    <div className="space-y-4">
      {/* Botão nova categoria */}
      <div className="flex justify-end">
        <button
          onClick={() => setCatModal({ open: true, editing: null })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Lista de Categorias */}
      {categories.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">Nenhuma categoria ainda.</p>
          <p className="text-sm mt-1">Crie uma categoria para começar a adicionar pratos.</p>
        </div>
      )}

      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const isOpen = openCat === cat.id;
        return (
          <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Header da Categoria */}
            <div className="flex items-center justify-between px-6 py-4">
              <button onClick={() => setOpenCat(isOpen ? null : cat.id)} className="flex items-center gap-3 flex-1 text-left">
                <span className="text-white font-bold">{cat.name}</span>
                <span className="text-gray-600 text-sm">({catProducts.length} itens)</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />}
              </button>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setCatModal({ open: true, editing: cat })} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Produtos da Categoria */}
            {isOpen && (
              <div className="border-t border-gray-800 divide-y divide-gray-800">
                {catProducts.map((product) => (
                  <div key={product.id} className={`flex items-center gap-4 px-6 py-4 ${!product.is_active ? 'opacity-50' : ''}`}>
                    {/* Imagem */}
                    <div className="w-14 h-14 rounded-xl bg-gray-800 shrink-0 overflow-hidden relative">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <ImagePlus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{product.name}</p>
                      <p className="text-orange-400 font-bold text-sm mt-0.5">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </p>
                    </div>
                    {/* Toggle + Ações */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${product.is_active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                      >
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => setProductModal({ open: true, editing: product, categoryId: product.category_id })} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Botão Adicionar Produto */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => setProductModal({ open: true, editing: null, categoryId: cat.id })}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adicionar produto
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal Categoria */}
      {catModal.open && (
        <CategoryModal
          editing={catModal.editing}
          onSave={saveCategory}
          onClose={() => setCatModal({ open: false, editing: null })}
        />
      )}

      {/* Modal Produto */}
      {productModal.open && (
        <ProductModal
          editing={productModal.editing}
          onSave={saveProduct}
          onClose={() => setProductModal({ open: false, editing: null, categoryId: '' })}
        />
      )}
    </div>
  );
}

// ───────── MODAL CATEGORIA ─────────
function CategoryModal({ editing, onSave, onClose }: { editing: Category | null; onSave: (name: string) => void; onClose: () => void; }) {
  const [name, setName] = useState(editing?.name ?? '');
  return (
    <ModalWrapper title={editing ? 'Editar Categoria' : 'Nova Categoria'} onClose={onClose}>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Burgers, Bebidas..."
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
      />
      <button onClick={() => name.trim() && onSave(name.trim())} className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors">
        Salvar
      </button>
    </ModalWrapper>
  );
}

// ───────── MODAL PRODUTO ─────────
function ProductModal({ editing, onSave, onClose }: { editing: Product | null; onSave: (data: any) => Promise<void>; onClose: () => void; }) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing?.price?.toString() ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.image_url ?? null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name || !price) return;
    setLoading(true);
    await onSave({ name, description, price: parseFloat(price.replace(',', '.')), image_url: editing?.image_url ?? null, imageFile: imageFile ?? undefined, is_active: true, is_featured: false });
    setLoading(false);
  };

  return (
    <ModalWrapper title={editing ? 'Editar Produto' : 'Novo Produto'} onClose={onClose}>
      <div className="space-y-4">
        {/* Upload de imagem */}
        <div className="relative w-full h-40 bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-orange-500 transition-colors">
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" unoptimized />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-2 text-gray-500">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">Clique para adicionar foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          )}
        </div>

        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600 resize-none" />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
          <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600" />
        </div>
        <button disabled={loading || !name || !price} onClick={handleSave} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ───────── WRAPPER MODAL ─────────
function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
