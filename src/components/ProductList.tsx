import { Plus, X, ShoppingBag } from 'lucide-react';
import CartSheet from './CartSheet';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductList({ store, products, categories }: { store: any, products: Product[], categories: Category[] }) {
  const { addToCart, totalItems, totalPrice } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [observations, setObservations] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setObservations('');
  };

  const confirmAdd = () => {
    if (selectedProduct) {
      addToCart({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity,
        observations,
        image_url: selectedProduct.image_url || undefined
      });
      setSelectedProduct(null);
    }
  };

  return (
    <>
      {/* CATEGORIAS HORIZONTAIS */}
      <div className="flex overflow-x-auto px-5 py-4 gap-3 no-scrollbar border-b border-gray-50 sticky top-[73px] z-20 bg-white/95 backdrop-blur-md">
        {categories.map((cat, index) => (
          <button 
            key={cat.id} 
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              index === 0 
                ? "text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={index === 0 ? { backgroundColor: store.theme_color } : {}}
            onClick={() => {
              const el = document.getElementById(`cat-${cat.id}`);
              if (el) {
                const offset = 140; 
                const elementPosition = el.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="px-5 py-6 space-y-8">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id);
          if (catProducts.length === 0) return null;

          return (
            <div key={cat.id} id={`cat-${cat.id}`}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{cat.name}</h2>
              <div className="space-y-4">
                {catProducts.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => handleAddClick(product)}
                    className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-gray-900 leading-tight">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-snug">{product.description}</p>
                      )}
                      <div className="mt-2 font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </div>
                    </div>
                     <div className="w-24 h-24 shrink-0 rounded-xl bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="text-gray-300 font-medium text-xs text-center p-2">Sem foto</div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-tl-xl rounded-br-xl flex items-center justify-center text-white"
                             style={{ backgroundColor: store.theme_color }}>
                          <Plus className="w-5 h-5" />
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ADIÇÃO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[32px] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="relative h-64 w-full bg-gray-100">
              {selectedProduct.image_url ? (
                <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-12 h-12 opacity-50" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-gray-500 mt-2 leading-relaxed">{selectedProduct.description}</p>
              
              <div className="mt-6">
                <label className="text-sm font-bold text-gray-900 block mb-2">Alguma observação?</label>
                <textarea 
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, etc..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all h-24 resize-none"
                />
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-50 text-xl font-bold"
                  >-</button>
                  <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-50 text-xl font-bold"
                  >+</button>
                </div>
                
                <button 
                  onClick={confirmAdd}
                  className="flex-1 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: store.theme_color }}
                >
                  Adicionar • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.price * quantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTAO FLUTUANTE DE CARRINHO */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 w-full max-w-md px-5 z-50">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full text-white shadow-2xl flex items-center justify-between px-6 py-5 rounded-[24px] transform transition hover:-translate-y-1 active:translate-y-0 animate-in slide-in-from-bottom-4 duration-500"
            style={{ backgroundColor: store.theme_color }}
          >
            <div className="flex items-center gap-4">
               <div className="bg-white/20 px-3 py-1 rounded-lg font-black text-sm">{totalItems}</div>
               <span className="font-bold tracking-tight">Ver minha sacola</span>
            </div>
            <span className="font-black">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
            </span>
          </button>
        </div>
      )}

      {/* SACOLA DE COMPRAS (DRAWER) */}
      <CartSheet 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        store={store}
      />
    </>
  );
}
