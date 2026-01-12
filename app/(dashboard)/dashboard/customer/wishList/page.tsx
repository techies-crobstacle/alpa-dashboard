// "use client"
// import React, { useState } from "react";
// import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
// import { Heart, ShoppingCart, List, LayoutGrid, Trash2, StickyNote, Share2, ArrowDownUp } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// const products = [
//   {
//     title: "Gesto 4W Solar Up Down Wall Sconce Light – Waterproof 2-Way Led Outdoor Wall Lamp With 1200mAh Battery |Auto Day Off & Night On | Exterior Light for Garden, Farm,Elevation,Fence,Balcony, Patio, Stairs",
//     brand: "Gesto",
//     rating: 4,
//     reviews: 156,
//     deal: "79% off",
//     dealType: "Limited time deal",
//     price: "$29.99 AUD",
//     mrp: "$99.99 AUD",
//     color: "Warm White",
//     dateAdded: "2026-01-07",
//     image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
//   },
//   {
//     title: "Timex Analog Grey Dial Men's Watch-TWEG16609",
//     brand: "TIMEX (Watch)",
//     rating: 4,
//     reviews: 37,
//     price: "$149.99 AUD",
//     mrp: "$199.99 AUD",
//     color: "Grey",
//     dateAdded: "2023-05-20",
//     image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=300&q=80",
//   },
//   // Add more products as needed
// ];

// function WishlistCard({ product }: { product: typeof products[0] }) {
//   return (
//     <Card className="w-full max-w-xs bg-card text-card-foreground rounded-xl border shadow-sm flex flex-col justify-between">
//       <div className="aspect-square w-full rounded-t-xl bg-muted/40 flex items-center justify-center overflow-hidden">
//         <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
//       </div>
//       <CardContent className="flex flex-col gap-2 p-4 flex-1">
//         <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">{product.title}</CardTitle>
//         <CardDescription className="text-xs mb-2 line-clamp-2">{product.brand}</CardDescription>
//         <div className="flex items-center justify-between mt-auto">
//           <span className="font-bold text-base">{product.price}</span>
//           <div className="flex gap-2">
//             <button className="rounded-full p-2 bg-muted hover:bg-primary/10 transition-colors"><Heart className="w-5 h-5 text-primary" /></button>
//             <button className="rounded-full p-2 bg-muted hover:bg-primary/10 transition-colors"><ShoppingCart className="w-5 h-5 text-primary" /></button>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function WishlistTable() {
//   return (
//     <div className="w-full max-w-6xl mx-auto">
//       {products.map((product, idx) => (
//         <Card key={idx} className="flex flex-col sm:flex-row items-start gap-6 p-6 mb-6 bg-card text-card-foreground rounded-xl border shadow-sm">
//           <div className="w-32 h-32 rounded bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
//             <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
//           </div>
//           <div className="flex-1 w-full">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
//               <div>
//                 <a href="#" className="font-semibold text-lg text-primary hover:underline leading-snug block mb-1">{product.title}</a>
//                 <div className="text-sm text-muted-foreground mb-1">by {product.brand}</div>
//                 <div className="flex items-center gap-2 mb-1">
//                   <span className="text-yellow-500 font-bold">{'★'.repeat(product.rating)}</span>
//                   <span className="text-muted-foreground text-xs">{product.reviews}</span>
//                 </div>
//                 {/* <div className="flex items-center gap-2 mb-1">
//                   {product.deal && <span className="inline-block bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded">{product.deal}</span>}
//                   {product.dealType && <span className="inline-block bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded">{product.dealType}</span>}
//                 </div> */}
//                 {product.color && <div className="text-xs text-muted-foreground">Colour: {product.color}</div>}
//                 <div className="text-xs text-muted-foreground mt-1">Item added {new Date(product.dateAdded).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
//               </div>
//               <div className="flex flex-col items-start md:items-end gap-1 min-w-[160px]">
//                 <div className="flex items-center gap-2">
//                   <span className="font-bold text-2xl text-primary">{product.price}</span>
//                   {product.mrp && <span className="text-xs line-through text-muted-foreground">{product.mrp}</span>}
//                 </div>
//                 <span className="text-xs text-muted-foreground">FREE Delivery on orders over $50 AUD</span>
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-2 mt-4">
//               <Button variant="secondary" size="sm"><ShoppingCart className="w-4 h-4" />Add to Cart</Button>
//               {/* <Button variant="outline" size="sm"><StickyNote className="w-4 h-4" />Add a note</Button> */}
//               {/* <Button variant="outline" size="sm">Move</Button> */}
//               <Button variant="ghost" size="icon"><Share2 className="w-4 h-4" /></Button>
//               <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
//             </div>
//           </div>
//         </Card>
//       ))}
//     </div>
//   );
// }

// export default function WishlistPage() {
//   const [view, setView] = useState<'card' | 'table'>('table');
//   return (
//     <div className="min-h-screen bg-background py-8 px-4">
//       <div className="flex justify-end max-w-6xl mx-auto mb-6 gap-2">
//         <Button
//           variant={view === 'card' ? 'default' : 'outline'}
//           size="sm"
//           onClick={() => setView('card')}
//           aria-label="Card view"
//         >
//           <LayoutGrid className="w-4 h-4 mr-1" /> Card View
//         </Button>
//         <Button
//           variant={view === 'table' ? 'default' : 'outline'}
//           size="sm"
//           onClick={() => setView('table')}
//           aria-label="Table view"
//         >
//           <List className="w-4 h-4 mr-1" /> Table View
//         </Button>
//       </div>
//       {view === 'card' ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
//           {products.map((product, idx) => (
//             <WishlistCard key={idx} product={product} />
//           ))}
//         </div>
//       ) : (
//         <WishlistTable />
//       )}
//     </div>
//   );
// }


"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, ShoppingCart, List, LayoutGrid, Trash2, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

// TypeScript interfaces matching your API response
interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  stock: number;
  status: string;
  category: string;
  seller: {
    id: string;
    name: string;
  };
}

interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

interface WishlistResponse {
  success: boolean;
  wishlist: WishlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Card View Component
function WishlistCard({ item, onRemove, onAddToCart, actionLoading }: { 
  item: WishlistItem; 
  onRemove: (itemId: string) => void;
  onAddToCart: (productId: string) => void;
  actionLoading: { [key: string]: boolean };
}) {
  const { product } = item;
  const image = product.images && product.images.length > 0 
    ? product.images[0] 
    : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80";
  
  const isRemoving = actionLoading[`remove-${item.id}`];
  const isAddingToCart = actionLoading[`cart-${product.id}`];
  
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={image}
          alt={product.title}
          className="w-full h-48 object-cover"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-white hover:bg-gray-100"
          onClick={() => onRemove(item.id)}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          )}
        </Button>
      </div>
      <CardContent className="p-4">
        <CardTitle className="text-sm line-clamp-2 mb-2">{product.title}</CardTitle>
        <CardDescription className="text-xs mb-2">{product.seller.name}</CardDescription>
        <CardDescription className="text-xs mb-2 text-gray-600">{product.category}</CardDescription>
        <div className="text-lg font-bold text-red-600 mb-2">${product.price} AUD</div>
        <div className="text-xs text-gray-500 mb-2">Stock: {product.stock}</div>
        <Button 
          className="w-full" 
          disabled={product.stock === 0 || isAddingToCart}
          onClick={() => onAddToCart(product.id)}
        >
          {isAddingToCart ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Table View Component
function WishlistTable({ items, onRemove, onAddToCart, actionLoading }: { 
  items: WishlistItem[];
  onRemove: (itemId: string) => void;
  onAddToCart: (productId: string) => void;
  actionLoading: { [key: string]: boolean };
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[500px]">Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const { product } = item;
          const image = product.images && product.images.length > 0 
            ? product.images[0] 
            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80";
          
          const isRemoving = actionLoading[`remove-${item.id}`];
          const isAddingToCart = actionLoading[`cart-${product.id}`];
          
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex gap-3">
                  <img
                    src={image}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex flex-col gap-1">
                    <div className="font-medium line-clamp-2">{product.title}</div>
                    <div className="text-sm text-gray-600">by {product.seller.name}</div>
                    <div className="text-xs text-gray-500">
                      Item added {new Date(item.addedAt).toLocaleDateString('en-AU', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{product.category}</div>
              </TableCell>
              <TableCell>
                <div className="font-bold text-red-600">${product.price} AUD</div>
                <div className="text-xs text-gray-500 mt-1">FREE Delivery on orders over $50 AUD</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{product.stock} available</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    disabled={product.stock === 0 || isAddingToCart}
                    onClick={() => onAddToCart(product.id)}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRemove(item.id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Main Wishlist Page Component
export default function WishlistPage() {
  const [view, setView] = useState<'card' | 'table'>('table');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch wishlist data when component mounts
  useEffect(() => {
    fetchWishlist();
  }, []);

  // API call function
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the api client from lib/api.ts which handles authentication automatically
      const data: WishlistResponse = await api.get('/api/wishlist/');
      
      if (data.success) {
        setWishlistItems(data.wishlist);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch wishlist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching wishlist');
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (itemId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`remove-${itemId}`]: true }));
      await api.delete(`/api/wishlist/${itemId}`);
      toast.success("Item removed from wishlist", {
        description: "The item has been successfully removed from your wishlist.",
      });
      // Refresh wishlist after removal
      fetchWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from wishlist';
      setError(errorMessage);
      toast.error("Failed to remove item", {
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove-${itemId}`]: false }));
    }
  };

  // Add to cart
  const addToCart = async (productId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: true }));
      await api.post('/api/cart/add', { productId, quantity: 1 });
      toast.success("Item added to cart", {
        description: "The item has been successfully added to your cart.",
      });
      // Optionally remove from wishlist after adding to cart
      // removeFromWishlist(itemId);
    } catch (err) {
      console.error('Error adding to cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      toast.error("Failed to add to cart", {
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading wishlist...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Error loading wishlist</h3>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchWishlist} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {pagination.total} {pagination.total === 1 ? 'item' : 'items'} in your wishlist
            </p>
          </div>
          {/* View Toggle Buttons */}
          <div className="flex gap-2">
            <Button
              variant={view === 'card' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('card')}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500">Start adding items you love to your wishlist!</p>
          </div>
        ) : (
          /* Wishlist Content */
          <>
            {view === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistItems.map((item) => (
                  <WishlistCard 
                    key={item.id} 
                    item={item} 
                    onRemove={removeFromWishlist}
                    onAddToCart={addToCart}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            ) : (
              <WishlistTable 
                items={wishlistItems} 
                onRemove={removeFromWishlist}
                onAddToCart={addToCart}
                actionLoading={actionLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}