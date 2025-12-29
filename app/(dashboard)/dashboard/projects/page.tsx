"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, DollarSign, Edit, Trash2, Loader2, X, Image } from "lucide-react";
import { toast } from "sonner";

// --- CONFIGURATION ---
const BASE_URL = "http://127.0.0.1:5000";

// --- HELPER: Get Auth Token ---
const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  // Only use 'alpa_token' for authentication
  return localStorage.getItem("alpa_token");
};

// --- API ACTIONS ---
const fetchProducts = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const response = await fetch(`${BASE_URL}/api/products/my-products`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (response.status === 401) throw new Error("Unauthorized: Please log in again.");
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
};

const addProduct = async (productData: any) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const form = new FormData();
  form.append("title", productData.title);
  form.append("description", productData.description);
  form.append("price", productData.price);
  form.append("stock", productData.stock);
  form.append("category", productData.category);
  for (let i = 0; i < productData.images.length; i++) {
    form.append("images", productData.images[i]);
  }
  const response = await fetch(`${BASE_URL}/api/products/add`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: form,
  });
  if (!response.ok) throw new Error("Failed to add product");
  return response.json();
};

const deleteProduct = async (productId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [layout, setLayout] = useState<'table' | 'card'>("table");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [] as File[],
  });

  useEffect(() => {
    // Check if token exists before loading
    const token = getAuthToken();
    if (!token) {
      console.error("No auth token found in localStorage");
      toast.error("Please log in to view products");
      setLoading(false);
      return;
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data.products || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.title || !formData.price || !formData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setSubmitting(true);
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        images: formData.images,
      };
      await addProduct(productData);
      toast.success("Product added successfully!");
      setShowAddModal(false);
      setFormData({ title: "", description: "", price: "", stock: "", category: "", images: [] });
      loadProducts();
    } catch (error: any) {
      toast.error("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteProduct(productId);
      toast.success("Product deleted!");
      loadProducts();
    } catch (error: any) {
      toast.error("Delete failed");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
    }
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalRevenue = products.reduce((sum, p) => sum + (Number(p.price) * (Number(p.sales) || 0)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and listings.</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
          <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
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
                <tr key={product.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.title} className="h-12 w-12 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image'; }} />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                        <Image className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">{product.title}</td>
                  <td className="px-4 py-2">{product.category}</td>
                  <td className="px-4 py-2">${product.price}</td>
                  <td className="px-4 py-2">{product.stock}</td>
                  <td className="px-4 py-2">
                    <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status || 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
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
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground/50" />
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
                  <Button variant="outline" size="sm" className="flex-1 gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Add Product Modal */}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Add New Product</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="E.g. Ergonomic Office Chair" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Product details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input id="price" type="number" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input id="stock" type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="E.g. Furniture" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </div>
              
              {/* --- IMAGE UPLOAD --- */}
              <div className="space-y-2">
                <Label htmlFor="images">Product Images</Label>
                <Input id="images" type="file" accept="image/*" multiple onChange={handleImageChange} />
                <div className="flex gap-2 flex-wrap pt-2">
                  {formData.images && formData.images.length > 0 && formData.images.map((file, idx) => (
                    <div key={idx} className="h-20 w-20 rounded border overflow-hidden flex items-center justify-center bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        className="h-full w-full object-cover"
                        alt="Preview"
                        onError={(e) => (e.target as any).style.display='none'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t">
                <Button className="flex-1" onClick={handleAddProduct} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Product"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}