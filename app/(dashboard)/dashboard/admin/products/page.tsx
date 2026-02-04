
"use client";

import React from "react";

import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Package, DollarSign, Pencil } from "lucide-react";
import { toast } from "sonner";

// --- CONFIGURATION ---

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as LucideImage } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Add edit price modal dependencies
import { Input } from "@/components/ui/input";

type Seller = {
  id: string;
  name: string;
  email: string;
};

type Product = {
  id: string;
  title: string;
  price: number;
  status: string;
  images?: string[];
  description?: string;
  category?: string;
  stock?: number;
  featured?: boolean;
  tags?: string[] | string;
};


export default function AdminProductsPage() {

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [layout, setLayout] = useState<'table' | 'card'>("table");

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalRevenue = products.reduce((sum, p) => sum + (Number(p.price) * (Number((p as { sales?: number }).sales) || 0)), 0);

  // Accordion state for expanded product details
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Edit price modal state
  const [editPriceProductId, setEditPriceProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");
  const [editPriceLoading, setEditPriceLoading] = useState(false);

  const openEditPrice = (product: Product) => {
    setEditPriceProductId(product.id);
    setEditPriceValue(product.price.toString());
  };

  const closeEditPrice = () => {
    setEditPriceProductId(null);
    setEditPriceValue("");
  };

  const handleEditPrice = async () => {
    if (!editPriceProductId) return;
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    setEditPriceLoading(true);
    try {
      await api.put(`/api/admin/products/${editPriceProductId}/price`, { price: newPrice });
      toast.success("Price updated successfully");
      closeEditPrice();
      fetchProducts(selectedSeller);
    } catch {
      toast.error("Failed to update price");
    } finally {
      setEditPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      fetchProducts(selectedSeller);
    } else {
      setProducts([]);
      setLoading(false); // Ensure loading state is cleared
    }
  }, [selectedSeller]);

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      console.log("Fetching sellers...");
      const res = await api.get("/api/users/all");
      console.log("Sellers API Response:", res);
      
      const sellersOnly = Array.isArray(res)
        ? res.filter((u: { role: string }) => u.role === "SELLER")
        : (res.users || []).filter((u: { role: string }) => u.role === "SELLER");
      
      console.log("Filtered sellers:", sellersOnly);
      setSellers(sellersOnly);
      if (sellersOnly.length > 0) {
        console.log("Setting first seller as selected:", sellersOnly[0].id);
        setSelectedSeller(sellersOnly[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch sellers:", error);
      let message = 'Unknown error';
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message;
      }
      toast.error(`Failed to load sellers: ${message}`);
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const fetchProducts = async (sellerId: string) => {
    setLoading(true);
    try {
      console.log(`Fetching products for seller: ${sellerId}`);
      const res = await api.get(`/api/admin/sellers/${sellerId}/products`);
      console.log("API Response:", res);
      
      // Handle the specific response structure: { success: true, products: [...] }
      let productsData = [];
      if (res && res.success && res.products) {
        productsData = res.products;
      } else if (Array.isArray(res)) {
        productsData = res;
      } else if (res && res.data) {
        productsData = res.data;
      }
      
      console.log("Products data to set:", productsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      let message = 'Unknown error';
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message;
      }
      toast.error(`Failed to load products: ${message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInactivate = async (productId: string) => {
    try {
      await api.put(`/api/admin/products/${productId}/inactive`);
      toast.success("Product marked as inactive");
      fetchProducts(selectedSeller);
    } catch {
      toast.error("Failed to inactivate product");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">View and manage products by seller.</p>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto md:justify-end justify-between">
          <div className="min-w-[250px]">
            <label className="block mb-1 font-medium">Select Seller</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              disabled={loadingSellers}
            >
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} ({seller.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
            <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalStock}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="col-span-full text-center py-12">No products found.</Card>
      ) : layout === 'table' ? (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {products.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title || "Product image"}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                          <LucideImage className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-semibold">{product.title}</td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2 flex items-center gap-1">
                      ${product.price}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1"
                        aria-label="Edit Price"
                        onClick={() => openEditPrice(product)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status || 'Active'}</Badge>
                    </td>
                    <td className="px-4 py-2 flex gap-1">
                        {product.status !== 'INACTIVE' && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleInactivate(product.id)}>
                            Mark Inactive
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                        >
                          {expandedProductId === product.id ? (
                            <>
                              <span>&#x2715;</span> Hide
                            </>
                          ) : (
                            <>
                              <span>&#128065;</span> View
                            </>
                          )}
                        </Button>
                    </td>
                  </tr>
                  {expandedProductId === product.id && (
                    <tr>
                      <td colSpan={7} className="bg-muted/10 p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                            <p className="mb-2 text-muted-foreground">{product.description}</p>
                            <div className="mb-2"><strong>Category:</strong> {product.category}</div>
                            <div className="mb-2"><strong>Price:</strong> ${product.price}</div>
                            <div className="mb-2"><strong>Stock:</strong> {product.stock}</div>
                            <div className="mb-2"><strong>Status:</strong> {product.status || 'Active'}</div>
                            <div className="mb-2"><strong>Featured:</strong> {product.featured ? 'Yes' : 'No'}</div>
                            <div className="mb-2">
                              <strong>Tags:</strong> 
                              {product.tags && product.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(product.tags) ? (
                                    product.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))
                                  ) : (
                                    product.tags.split(',').map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                                    ))
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground ml-2">No tags</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {product.images && product.images.length > 0 ? (
                              product.images.map((img, idx) => (
                                <div key={img + idx} className="w-32 h-32 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={img}
                                    alt={product.title || "Product image"}
                                    width={120}
                                    height={120}
                                    className="max-w-full max-h-full object-contain"
                                    unoptimized
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="w-32 h-32 rounded border bg-muted flex items-center justify-center">
                                <Image
                                  src="/placeholder.svg"
                                  alt="No image"
                                  width={48}
                                  height={48}
                                  className="opacity-50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full bg-muted">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title || "Product image"}
                    width={400}
                    height={192}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <LucideImage className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <Badge 
                  className="absolute top-2 right-2" 
                  variant={product.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {product.status || "Active"}
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{product.category}</span>
                  <span className="font-bold text-lg text-primary">${product.price}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Stock Available</span>
                  <span className="font-semibold">{product.stock} units</span>
                </div>
                <div className="flex gap-2 pt-2">
                    {product.status !== "INACTIVE" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleInactivate(product.id)}
                        >
                          Mark Inactive
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => openEditPrice(product)}
                        >
                          Edit Price
                        </Button>
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    {/* Edit Price Modal */}
    {editPriceProductId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-xs space-y-4">
          <h2 className="text-lg font-bold mb-2">Edit Product Price</h2>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editPriceValue}
            onChange={e => setEditPriceValue(e.target.value)}
            className="w-full"
            disabled={editPriceLoading}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeEditPrice} disabled={editPriceLoading}>Cancel</Button>
            <Button onClick={handleEditPrice} disabled={editPriceLoading}>
              {editPriceLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>  
  );
}