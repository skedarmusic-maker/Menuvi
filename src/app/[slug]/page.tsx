import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Clock, Search } from "lucide-react";
import ProductList from "@/components/ProductList";

// Função para buscar dados da loja
async function getStoreData(slug: string) {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*, categories(*), products(*)")
    .eq("slug", slug)
    .single();

  if (!restaurant || !restaurant.products || restaurant.products.length === 0) {
    return {
      name: "Burger & Co.",
      slug: slug,
      theme_color: "#ef4444", 
      banner_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop",
      logo_url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&q=80&auto=format&fit=crop",
      whatsapp_number: "5511965843545",
      is_open: true,
      is_active: true,
      categories: [
        { id: "1", name: "Destaques" },
        { id: "2", name: "Burgers" },
        { id: "3", name: "Bebidas" },
      ],
      products: [
        {
          id: "p1",
          category_id: "1",
          name: "Smash Duplo Cheddar",
          description: "Dois blends de 90g, muito cheddar cremoso, cebola caramelizada no pão brioche amanteigado.",
          price: 34.90,
          image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80&auto=format&fit=crop",
        },
        {
          id: "p2",
          category_id: "2",
          name: "Classic Bacon",
          description: "Blend 160g, queijo prato, fatias crocantes de bacon e molho especial.",
          price: 38.00,
          image_url: "https://images.unsplash.com/photo-1594212202875-86ac511feec9?w=500&q=80&auto=format&fit=crop",
        },
        {
          id: "p3",
          category_id: "3",
          name: "Coca-Cola Lata",
          description: "Coca-Cola original 350ml bem gelada.",
          price: 6.50,
          image_url: null,
        }
      ]
    };
  }
  
  return restaurant;
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreData(slug);

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
                   {store.name.charAt(0)}
                 </div>
               )}
            </div>
          </div>
          <div className="pb-2 text-white">
            <h1 className="text-2xl font-bold leading-tight shadow-black/50 drop-shadow-md">{store.name}</h1>
            <div className="flex items-center gap-2 text-sm mt-1 font-medium">
               {store.is_open ? (
                 <span className="flex items-center text-green-400 drop-shadow-sm"><Clock className="w-4 h-4 mr-1" /> Aberto agora</span>
               ) : (
                 <span className="flex items-center text-red-400 drop-shadow-sm"><Clock className="w-4 h-4 mr-1" /> Fechado</span>
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

    </main>
  );
}
