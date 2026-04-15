import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Clock, Search, MapPin, CreditCard, Info, User as UserIcon } from "lucide-react";
import Link from 'next/link';
import ProductList from "@/components/ProductList";

// Função para buscar dados da loja
async function getStoreData(slug: string) {
  const supabase = await createSupabaseServerClient();
  console.log('🔍 Buscando dados da loja para o slug:', slug);

  // Busca o restaurante e suas categorias com os produtos dentro
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select(`
      *,
      categories (
        *,
        products (*)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error('❌ Erro Supabase ao buscar loja:', error);
  }

  const currentDay = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.

  // Achata os produtos de todas as categorias para um array único para o ProductList
  const allProducts = restaurant?.categories?.flatMap((cat: any) =>
    (cat.products || [])
      .filter((p: any) => {
        // Regra 1: Disponibilidade Manual
        if (p.is_available === false) return false;

        // Regra 2: Cardápio Semanal
        // Se available_days for nulo ou vazio, aparece sempre
        if (!p.available_days || p.available_days.length === 0) return true;

        // Se houver lista de dias, verifica se o dia atual está nela
        return p.available_days.includes(currentDay);
      })
      .map((p: any) => ({ ...p, category_id: cat.id }))
  ) || [];

  const promoProducts = allProducts.filter((p: any) => p.is_promo);

  // Se houver promoções, injetamos uma categoria virtual no topo
  let finalCategories = restaurant?.categories || [];
  if (promoProducts.length > 0) {
    const promoCategory = {
      id: 'promo-virtual',
      name: '🔥 PROMOÇÕES DO DIA',
      is_promo_category: true
    };
    finalCategories = [promoCategory, ...finalCategories];

    // Marcamos os produtos da promo para a categoria virtual
    promoProducts.forEach((p: any) => {
      allProducts.push({ ...p, category_id: 'promo-virtual', is_from_promo: true });
    });
  }

  if (!restaurant) {
    console.log('⚠️ Loja não encontrada para o slug:', slug);
    // ... mock data ...
  }

  return {
    ...restaurant,
    categories: finalCategories,
    products: allProducts
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreData(slug);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!store.is_active) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Loja Indisponível</h1>
        <p className="text-gray-500 max-w-sm mb-8">Este cardápio encontra-se temporariamente fora do ar. Volte mais tarde!</p>
      </main>
    );
  }

  return (
    <main className="relative pb-24">
      {/* HEADER PREMIUM COM BANNER */}
      <div className="relative h-48 w-full bg-gray-900 border-b border-gray-100">
        <Image
          src={store.banner_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80&auto=format&fit=crop"}
          alt="Banner"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* BOTÃO ÁREA DO CLIENTE */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Link
            href={user ? `/${slug}/account` : `/${slug}/login`}
            className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all border border-white/20 shadow-lg"
          >
            {user ? <UserIcon className="w-4 h-4" /> : null}
            {user ? 'Minha Conta' : 'Entrar / Cadastrar'}
          </Link>
        </div>
      </div>

      {/* INFORMAÇÕES DA LOJA (Sobrepondo o banner) */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border border-gray-100 shrink-0">
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-100">
              {store.logo_url ? (
                <Image src={store.logo_url} alt="Logo" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full font-bold text-gray-400 text-2xl">
                  {store.name ? store.name.charAt(0) : 'M'}
                </div>
              )}
            </div>
          </div>
          <div className="pb-2 text-white flex-1 min-w-0">
            <h1 className="text-2xl font-black leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter">
              {store.name}
            </h1>
            <div className="flex items-center gap-2 text-sm mt-1 font-bold">
              {store.is_open ? (
                <span className="flex items-center text-green-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                  <Clock className="w-4 h-4 mr-1" /> Aberto agora
                </span>
              ) : (
                <span className="flex items-center text-red-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                  <Clock className="w-4 h-4 mr-1" /> Fechado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA (Sticky) */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-5 pt-6 pb-4 border-b border-gray-100 mt-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Buscar no cardápio..."
            className="w-full bg-gray-100 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder:font-normal border-none"
            style={{ ringColor: store.theme_color } as any}
          />
        </div>
      </div>

      {/* LISTA DE PRODUTOS INTERATIVA */}
      <ProductList
        store={store}
        products={store.products || []}
        categories={store.categories || []}
      />

      {/* RODAPÉ COM INFORMAÇÕES DA LOJA */}
      <footer className="mt-12 px-5 py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-screen-md mx-auto space-y-8">

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-3">
              <Info className="w-6 h-6" style={{ color: store.theme_color }} />
            </div>
            <h2 className="text-xl font-black text-gray-900">Sobre a Loja</h2>
            <p className="text-gray-500 text-sm mt-1">Conheça nosso espaço e formas de atendimento</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Endereço */}
            {store.address && (
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${store.theme_color}10`, color: store.theme_color }}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Localização</h3>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed">{store.address}</p>
                </div>
              </div>
            )}

            {/* Horário */}
            {store.opening_hours && (
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${store.theme_color}10`, color: store.theme_color }}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Funcionamento</h3>
                  <p className="text-gray-700 text-sm font-medium whitespace-pre-line leading-relaxed">{store.opening_hours}</p>
                </div>
              </div>
            )}

            {/* Pagamento */}
            {store.payment_methods && (
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-start md:col-span-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${store.theme_color}10`, color: store.theme_color }}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Formas de Pagamento</h3>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed">{store.payment_methods}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Desenvolvido por Menuvi App</p>
          </div>
        </div>
      </footer>

    </main>
  );
}
