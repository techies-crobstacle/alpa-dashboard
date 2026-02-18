
"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, DollarSign, Edit, Trash2, X, Search, Check, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  // Edit Product Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [] as File[],
    oldImages: [] as string[],
    featured: false,
    tags: "",
    artistName: "",
  });
  
  // Category Search State for Modal
  const editCatDropdownRef = useRef<HTMLDivElement>(null);
  const [editCatSearch, setEditCatSearch] = useState("");
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(event.target as Node)) {
        setIsEditCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get("/api/categories/");
      if (response && response.success && response.data) {
        setAvailableCategories(response.data.approvedCategories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFormData({ ...editFormData, images: Array.from(e.target.files) });
    }
  };

  const openEditModal = async (productId: string) => {
    setEditProductId(productId);
    setEditSubmitting(false);
    try {
      const response = await api.get(`/api/products/${productId}`);
      
      const prod = response.product || response;
      setEditFormData({
        title: prod.title || "",
        description: prod.description || "",
        price: prod.price?.toString() || "",
        stock: prod.stock?.toString() || "",
        category: prod.category || "",
        images: [],
        oldImages: prod.images || [],
        featured: prod.featured ?? false,
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : (prod.tags || ""),
        artistName: prod.artistName || "",
      });
      setShowEditModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load product");
    }
  };

  const handleEditProduct = async () => {
    if (!editProductId) return;
    if (!editFormData.title || !editFormData.price || !editFormData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setEditSubmitting(true);
      const form = new FormData();
      form.append("title", editFormData.title.trim());
      form.append("description", editFormData.description.trim());
      form.append("price", String(editFormData.price));
      form.append("stock", String(editFormData.stock));
      form.append("category", editFormData.category.trim());
      // Only append images if new images are selected
      if (editFormData.images && editFormData.images.length > 0) {
        for (let i = 0; i < editFormData.images.length; i++) {
          form.append("images", editFormData.images[i]);
        }
      }
      // Add featured and tags fields
      form.append("featured", String(editFormData.featured));
      form.append("tags", editFormData.tags);
      if (editFormData.artistName) {
        form.append("artistName", editFormData.artistName.trim());
      }
      
      await api.put(`/api/products/${editProductId}`, form);

      toast.success("Product updated successfully!");
      setShowEditModal(false);
      setEditProductId(null);
      fetchProducts(selectedSeller);
    } catch (err: any) {
      console.error("Edit product error:", err);
      toast.error(err.message || "Failed to update product");
    } finally {
      setEditSubmitting(false);
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

  function openEditPrice(product: Product): void {
    throw new Error("Function not implemented.");
  }

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
                    <td className="px-4 py-2 text-primary font-bold">
                      ${product.price}
                    </td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status || 'Active'}</Badge>
                    </td>
                    <td className="px-4 py-2 flex gap-1 items-center">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditModal(product.id)}>
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                        {product.status !== 'INACTIVE' && (
                          <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700" onClick={() => handleInactivate(product.id)}>
                            <Trash2 className="h-3 w-3" /> Inactive
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
                              <X className="h-3 w-3" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" /> View
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
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEditModal(product.id)}>
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                    {product.status !== "INACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-red-500 hover:text-red-700"
                        onClick={() => handleInactivate(product.id)}
                      >
                        <Trash2 className="h-3 w-3" /> Inactive
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    {/* Edit Product Modal */}
    {showEditModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
          <CardHeader className="border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Edit Product</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit-title" className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
                <Input id="edit-title" placeholder="Give your product a clear name" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="focus:ring-primary h-10" />
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit-description" className="text-sm font-semibold">Detailed Description</Label>
                <Textarea id="edit-description" placeholder="Product details..." value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={4} className="resize-none focus:ring-primary py-2" />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit-artistName" className="text-sm font-semibold">Artist Name (Optional)</Label>
                <Input id="edit-artistName" placeholder="Enter artist name" value={editFormData.artistName} onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })} className="focus:ring-primary h-10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="edit-price" type="number" placeholder="0.00" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="pl-9 focus:ring-primary h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stock" className="text-sm font-semibold">Stock Quantity <span className="text-red-500">*</span></Label>
                <Input id="edit-stock" type="number" placeholder="0" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} className="focus:ring-primary h-10" />
              </div>

              <div className="space-y-2 relative" ref={editCatDropdownRef}>
                <Label htmlFor="edit-category" className="text-sm font-semibold">Category <span className="text-red-500">*</span></Label>
                <div 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-primary/50 cursor-pointer"
                  onClick={() => setIsEditCatOpen(!isEditCatOpen)}
                >
                  <span className={editFormData.category ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {editFormData.category || "Select a category"}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isEditCatOpen && "rotate-180")} />
                </div>
                
                {isEditCatOpen && (
                  <div className="absolute z-[60] w-full mt-1 bg-background text-popover-foreground rounded-lg border shadow-xl p-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                    <div className="flex items-center border-b px-3 pb-2 pt-1">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search categories..."
                        value={editCatSearch}
                        onChange={(e) => setEditCatSearch(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto mt-1 custom-scrollbar">
                      {availableCategories.length === 0 ? (
                        <div className="py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-primary underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadCategories();
                            }}
                          >
                            Refresh Categories
                          </Button>
                        </div>
                      ) : availableCategories
                        .filter(cat => cat.categoryName.toLowerCase().includes(editCatSearch.toLowerCase()))
                        .map((cat) => (
                          <div
                            key={cat.categoryName}
                            className={cn(
                              "group relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                              editFormData.category === cat.categoryName && "bg-primary/5 text-primary font-medium"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditFormData({ ...editFormData, category: cat.categoryName });
                              setIsEditCatOpen(false);
                              setEditCatSearch("");
                            }}
                          >
                            <div className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                              editFormData.category === cat.categoryName ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                            )}>
                              {editFormData.category === cat.categoryName && <Check className="h-3 w-3" />}
                            </div>
                            {cat.categoryName}
                          </div>
                        ))}
                      {availableCategories.length > 0 && availableCategories.filter(cat => cat.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Featured Product</Label>
                  <p className="text-xs text-muted-foreground">Show this product on the home page</p>
                </div>
                <Switch 
                  checked={editFormData.featured} 
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, featured: checked })} 
                />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit-tags" className="text-sm font-semibold">Tags (comma separated)</Label>
                <Input id="edit-tags" placeholder="e.g. handmade, vintage, summer" value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} className="focus:ring-primary h-10" />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label className="text-sm font-semibold">Product Images ({editFormData.images.length + editFormData.oldImages.length}/5)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {editFormData.oldImages.map((img, idx) => (
                    <div key={`old-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <Image src={img} alt={`Product ${idx}`} fill className="object-cover transition-transform group-hover:scale-105" />
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, oldImages: prev.oldImages.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {editFormData.images.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <Image src={URL.createObjectURL(file)} alt={`New ${idx}`} fill className="object-cover transition-transform group-hover:scale-105" onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} />
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {(editFormData.images.length + editFormData.oldImages.length) < 5 && (
                    <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all aspect-square">
                      <Package className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                      <input type="file" multiple accept="image/*" onChange={handleEditImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-6 border-t bg-muted/10 sticky bottom-0 z-10 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={editSubmitting} className="h-10 px-4">Cancel</Button>
            <Button onClick={handleEditProduct} disabled={editSubmitting} className="h-10 px-6 font-semibold shadow-md">
              {editSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </div>
        </Card>
      </div>
    )}
  </div>  
  );
}