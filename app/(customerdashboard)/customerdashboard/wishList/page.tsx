"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, ShoppingCart, List, LayoutGrid, Trash2, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
function WishlistCard({ item, onRemove, onAddToCart, onMoveToCart, actionLoading }: { 
  item: WishlistItem; 
  onRemove: (itemId: string) => void;
  onAddToCart: (productId: string) => void;
  onMoveToCart: (productId: string, itemId: string) => void;
  actionLoading: { [key: string]: boolean };
}) {
  const { product } = item;
  const image = product.images && product.images.length > 0 
    ? product.images[0] 
    : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80";
  
  const isRemoving = actionLoading[`remove-${item.id}`];
  const isAddingToCart = actionLoading[`add-cart-${product.id}`];
  const isMovingToCart = actionLoading[`cart-${product.id}`];
  
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
          className="absolute top-2 right-2 bg-background/90 hover:bg-muted"
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
        <CardDescription className="text-xs mb-2 text-muted-foreground">{product.category}</CardDescription>
        <div className="text-lg font-bold text-primary mb-2">${product.price} AUD</div>
        <div className="text-xs text-muted-foreground mb-4">Stock: {product.stock}</div>
        
        {/* Action buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full" 
            disabled={product.stock === 0 || isMovingToCart}
            onClick={() => onMoveToCart(product.id, item.id)}
          >
            {isMovingToCart ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            {product.stock > 0 ? "Move to Cart" : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Table View Component
function WishlistTable({ items, onRemove, onAddToCart, onMoveToCart, actionLoading }: { 
  items: WishlistItem[];
  onRemove: (itemId: string) => void;
  onAddToCart: (productId: string) => void;
  onMoveToCart: (productId: string, itemId: string) => void;
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
          const isAddingToCart = actionLoading[`add-cart-${product.id}`];
          const isMovingToCart = actionLoading[`cart-${product.id}`];
          
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
                    <div className="text-sm text-muted-foreground">by {product.seller.name}</div>
                    <div className="text-xs text-muted-foreground">
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
                <div className="font-bold text-primary">${product.price} AUD</div>
                <div className="text-xs text-muted-foreground mt-1">FREE Delivery on orders over $50 AUD</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{product.stock} available</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  {/* Move to Cart - Primary action */}
                  <Button 
                    size="sm" 
                    disabled={product.stock === 0 || isMovingToCart}
                    onClick={() => onMoveToCart(product.id, item.id)}
                  >
                    {isMovingToCart ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {product.stock > 0 ? "Move to Cart" : "Out of Stock"}
                  </Button>
                  
                  {/* Secondary actions row */}
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

// Utility function to check wishlist status - can be used in other components
export const checkWishlistStatus = async (productId: string): Promise<boolean> => {
  try {
    const response = await api.get(`/api/wishlist/check/${productId}`);
    return response.inWishlist || false;
  } catch (err) {
    console.error('Error checking wishlist status:', err);
    return false;
  }
};

const WishlistLoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* Table View Skeleton */}
      <Card>
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
            {Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex gap-3">
                    <Skeleton className="w-20 h-20 rounded" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
    

// Utility function to add item to wishlist - can be used in other components
export const addToWishlist = async (productId: string): Promise<boolean> => {
  try {
    await api.post('/api/wishlist/add', { productId });
    return true;
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    return false;
  }
};

// Main Wishlist Page Component
export default function WishlistPage() {
  const [view, setView] = useState<'card' | 'table'>('table');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [wishlistStatus, setWishlistStatus] = useState<{ [productId: string]: boolean }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Check if product is in wishlist using the new API
  const checkProductInWishlist = async (productId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/api/wishlist/check/${productId}`);
      return response.inWishlist || false;
    } catch (err) {
      console.error('Error checking wishlist status:', err);
      return false;
    }
  };

  // Update wishlist status for a specific product
  const updateWishlistStatus = (productId: string, inWishlist: boolean) => {
    setWishlistStatus(prev => ({
      ...prev,
      [productId]: inWishlist
    }));
  };

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
        
        // Update wishlist status for all fetched items
        const statusUpdates: { [productId: string]: boolean } = {};
        data.wishlist.forEach(item => {
          statusUpdates[item.product.id] = true;
        });
        setWishlistStatus(prev => ({ ...prev, ...statusUpdates }));
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

  // Remove item from wishlist using productId instead of itemId
  const removeFromWishlist = async (itemId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`remove-${itemId}`]: true }));
      
      // Find the product ID for this wishlist item
      const wishlistItem = wishlistItems.find(item => item.id === itemId);
      if (!wishlistItem) {
        throw new Error('Item not found in wishlist');
      }
      
      // Use the productId as per the API endpoint requirement: /api/wishlist/:productId
      await api.delete(`/api/wishlist/${wishlistItem.product.id}`, {
        reason: ""
      });
      
      // Update wishlist status
      updateWishlistStatus(wishlistItem.product.id, false);
      
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

  // Move to cart - using the new API endpoint
  const moveToCart = async (productId: string, itemId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: true }));
      
      // Call the move-to-cart API endpoint
      await api.post('/api/cart/add', { productId, quantity: 1 });
      await api.delete(`/api/wishlist/${productId}`, {
        reason: ""
      });
      
      // Update wishlist status (item removed from wishlist after moving to cart)
      updateWishlistStatus(productId, false);
      
      toast.success("Item moved to cart", {
        description: "The item has been successfully moved from wishlist to cart.",
      });
      // Refresh wishlist after moving to cart (item should be removed from wishlist)
      fetchWishlist();
    } catch (err) {
      console.error('Error moving to cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to move item to cart';
      setError(errorMessage);
      toast.error("Failed to move to cart", {
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: false }));
    }
  };

  // Add to cart (keep original functionality for separate add to cart without removing from wishlist)
  const addToCart = async (productId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`add-cart-${productId}`]: true }));
      await api.post('/api/cart/add', { productId, quantity: 1 });
      toast.success("Item added to cart", {
        description: "The item has been successfully added to your cart.",
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      toast.error("Failed to add to cart", {
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`add-cart-${productId}`]: false }));
    }
  };

  // Loading state
  if (loading) {
    return <WishlistLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <h3 className="text-destructive font-semibold mb-2">Error loading wishlist</h3>
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchWishlist} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
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
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground">Start adding items you love to your wishlist!</p>
        </Card>
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
                  onMoveToCart={moveToCart}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          ) : (
            <Card>
              <WishlistTable 
                items={wishlistItems} 
                onRemove={removeFromWishlist}
                onAddToCart={addToCart}
                onMoveToCart={moveToCart}
                actionLoading={actionLoading}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
  