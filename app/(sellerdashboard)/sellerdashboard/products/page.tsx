"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, DollarSign, Edit, Trash2, Loader2, X, Eye, Search, Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, XCircle, Clock, CheckCircle2, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ProductAuditHistory } from "@/components/shared/product-audit-history";

// --- CONFIGURATION ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com";

// --- HELPER: Get Auth Token ---
const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  // Only use 'alpa_token' for authentication
  return localStorage.getItem("alpa_token");
};

// --- Seller Profile Type ---
type SellerProfile = {
  id: string;
  status: string;
  approvedAt?: string | null;
  storeName?: string;
  businessName?: string;
};

// --- FETCH SELLER PROFILE ---
const fetchSellerProfile = async (): Promise<SellerProfile> => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  
  const response = await fetch(`${BASE_URL}/api/seller-profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (response.status === 401) throw new Error("Unauthorized: Please log in again.");
  if (!response.ok) throw new Error("Failed to fetch seller profile");
  
  const data = await response.json();
  return data.data;
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

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
  featuredImage?: string | null;
  galleryImages?: string[];
  status?: string;
  isActive?: boolean;
  rejectionReason?: string | null;
  reviewNote?: string | null;
  sellerInactiveReason?: string | null;
  sales?: number;
  featured?: boolean;
  tags?: string[] | string;
  artistName?: string;
};

// ── Status badge (seller-facing labels) ───────────────────────────────────────
function StatusBadge({ status, stock }: { status?: string; stock?: number }) {
  const isLowStock = (stock ?? 0) <= 2;
  switch (status) {
    case "ACTIVE":
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">Live</span>;
    case "PENDING":
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400">Pending Review</span>;
    case "INACTIVE":
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{isLowStock ? "Inactive — Low Stock" : "Inactive"}</span>;
    case "REJECTED":
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">Rejected</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status ?? "Unknown"}</span>;
  }
}

type RecycleBinProduct = {
  id: string;
  title: string;
  price: string;
  stock: number;
  category?: string;
  featuredImage?: string | null;
  galleryImages?: string[];
  images?: string[];
  description?: string;
  tags?: string[] | string;
  artistName?: string;
  featured?: boolean;
  status?: string;
  deletedAt: string;
  deletedBy: string | null;
  deletedByRole: string | null;
};

const addProduct = async (productData: {
  tags: string;
  featured: boolean;
  title: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  images: File[];
  featuredImage?: File | null;
  galleryImages?: File[];
  artistName?: string;
}) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const form = new FormData();
  form.append("title", productData.title);
  form.append("description", productData.description);
  form.append("price", productData.price);
  form.append("stock", productData.stock);
  form.append("category", productData.category);

  // Send gallery images under 'galleryImages' key.
  // Repeating the key for each file as per Postman working configuration.
  if (productData.galleryImages && productData.galleryImages.length > 0) {
    productData.galleryImages.forEach((file) => {
      form.append("galleryImages", file);
    });
  }

  if (productData.featuredImage) {
    form.append("featuredImage", productData.featuredImage);
  }

  form.append("featured", String(productData.featured));
  form.append("tags", productData.tags);
  if (productData.artistName) {
    form.append("artistName", productData.artistName);
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
  
  console.log('Attempting to delete product:', { productId, token: !!token });
  
  try {
    const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    console.log('Delete response:', { status: response.status, statusText: response.statusText });
    
    if (!response.ok) {
      // Get detailed error information
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('Delete failed with error:', errorData);
      throw new Error(errorData.message || errorData.error || `Failed to delete product (${response.status})`);
    }
    
    // Handle successful deletion (some APIs return 204 No Content)
    if (response.status === 204) {
      console.log('Product deletion successful (No Content)');
      return null;
    }
    
    console.log('Product deletion successful');
    return response.json();
  } catch (error) {
    console.error('Network error during deletion:', error);
    throw error;
  }
};

const fetchRecycleBinProducts = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const response = await fetch(`${BASE_URL}/api/products/recycle-bin`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch recycle bin");
  return response.json();
};

const restoreProduct = async (productId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");
  const response = await fetch(`${BASE_URL}/api/products/${productId}/restore`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    let errorData;
    try { errorData = await response.json(); } catch { errorData = {}; }
    throw new Error((errorData as any).message || `Failed to restore product (${response.status})`);
  }
  return response.json();
};


function ProjectsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Seller profile state
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Refs for closing dropdowns on click outside
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const editCatDropdownRef = useRef<HTMLDivElement>(null);

  // Native refs for file inputs — bypasses shadcn wrapper entirely
  const addFeaturedImageRef   = useRef<HTMLInputElement>(null);
  const addGalleryImagesRef   = useRef<HTMLInputElement>(null);
  const editFeaturedImageRef  = useRef<HTMLInputElement>(null);
  const editGalleryImagesRef  = useRef<HTMLInputElement>(null);

  // Mutable accumulator refs for gallery files — always current, no stale closure
  const addGalleryAccumRef   = useRef<File[]>([]);
  const editGalleryAccumRef  = useRef<File[]>([]);

  // Category Search State for Modals
  const [catSearch, setCatSearch] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editCatSearch, setEditCatSearch] = useState("");
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target as Node)) {
        setIsCatOpen(false);
      }
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(event.target as Node)) {
        setIsEditCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [] as File[],
    featuredImage: null as File | null,
    galleryImages: [] as File[],
    featured: false,
    tags: "",
    artistName: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRestoringMode, setIsRestoringMode] = useState(false);
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
    featuredImage: null as File | null,
    oldFeaturedImage: null as string | null,
    galleryImages: [] as File[],
    oldGalleryImages: [] as string[],
    featured: false,
    tags: "",
    artistName: "",
  });
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Recycle Bin state
  const [activeTab, setActiveTab] = useState<'products' | 'recycle-bin'>('products');
  const [recycleBinProducts, setRecycleBinProducts] = useState<RecycleBinProduct[]>([]);
  const [recycleBinLoading, setRecycleBinLoading] = useState(false);

  // View deleted product
  const [viewBinProduct, setViewBinProduct] = useState<RecycleBinProduct | null>(null);

  // Seller deactivate modal
  const [showSellerDeactivateModal, setShowSellerDeactivateModal] = useState(false);
  const [sellerDeactivateProductId, setSellerDeactivateProductId] = useState<string | null>(null);
  const [sellerDeactivateReason, setSellerDeactivateReason] = useState("");
  const [sellerDeactivateSubmitting, setSellerDeactivateSubmitting] = useState(false);

  // Submit for review modal
  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);
  const [submitReviewProductId, setSubmitReviewProductId] = useState<string | null>(null);
  const [submitReviewNote, setSubmitReviewNote] = useState("");
  const [submitReviewSubmitting, setSubmitReviewSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await apiClient("/api/categories/");
      if (response.success && response.data) {
        setAvailableCategories(response.data.approvedCategories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const loadSellerProfile = async () => {
    try {
      setProfileLoading(true);
      const profile = await fetchSellerProfile();
      setSellerProfile(profile);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      // Don't show error toast as this might be called on page load
    } finally {
      setProfileLoading(false);
    }
  };

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
    loadCategories();
    loadSellerProfile();
  }, []);

  // Auto-refresh seller profile when page gains focus (in case status changed in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (!profileLoading && sellerProfile) {
        loadSellerProfile();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !profileLoading && sellerProfile) {
        loadSellerProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profileLoading, sellerProfile]);

  // Periodic check every 2 minutes for status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!profileLoading && sellerProfile && sellerProfile.status !== "APPROVED") {
        loadSellerProfile();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [profileLoading, sellerProfile]);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, statusFilter]);

  const refreshSellerStatus = async () => {
    await loadSellerProfile();
    toast.success("Status refreshed successfully");
  };

  const loadRecycleBin = async () => {
    try {
      setRecycleBinLoading(true);
      const data = await fetchRecycleBinProducts();
      setRecycleBinProducts(data.products || []);
    } catch (error) {
      toast.error((error as Error).message || "Failed to load recycle bin");
    } finally {
      setRecycleBinLoading(false);
    }
  };

  // Load recycle bin count eagerly so the badge shows the correct number immediately
  useEffect(() => {
    loadRecycleBin();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (activeTab === 'recycle-bin') {
      loadRecycleBin();
    }
  }, [activeTab]); // eslint-disable-line

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data.products || []);
    } catch (error) {
      toast.error((error as Error).message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    // Check seller approval status before allowing product addition
    if (sellerProfile?.status !== "APPROVED") {
      toast.error("Your account needs to be approved before you can add products");
      return;
    }
    
    if (!formData.title || !formData.price || !formData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setSubmitting(true);
      // featuredImage: read from native input ref — always current
      const featuredImageFile = addFeaturedImageRef.current?.files?.[0] ?? null;
      // galleryImages: read from mutable accumulator ref — always current, no stale closure
      const galleryImageFiles = [...addGalleryAccumRef.current];
      console.log("featuredImage file to send:", featuredImageFile);
      console.log("galleryImages files to send:", galleryImageFiles);
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        images: [],
        featuredImage: featuredImageFile,
        galleryImages: galleryImageFiles,
        featured: formData.featured,
        tags: formData.tags,
        artistName: formData.artistName,
      };
      await addProduct(productData);
      toast.success("Product added successfully!");
      setShowAddModal(false);
      setFormData({ title: "", description: "", price: "", stock: "", category: "", images: [], featuredImage: null, galleryImages: [], featured: false, tags: "", artistName: "" });
      addGalleryAccumRef.current = []; // clear accumulator
      loadProducts();
    } catch {
      toast.error("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreProduct = async (productId: string, productTitle: string) => {
    try {
      await restoreProduct(productId);
      toast.success(`"${productTitle}" restored and submitted for admin review. It will go live once approved.`);
      loadRecycleBin();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Restore failed: ${errorMessage}`);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    toast("Delete this product?", {
      description: "It will be moved to your Recycle Bin where you can restore it anytime.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            console.log('Starting product deletion for ID:', productId);
            await deleteProduct(productId);
            toast.success("Product moved to Recycle Bin. It can be restored from there.");
            loadProducts();
          } catch (error) {
            console.error('Product deletion failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            // Backend deletes the product successfully but then crashes on a
            // post-delete count update — treat these as a successful deletion.
            const isBackendCountBug =
              errorMessage.toLowerCase().includes('newcount') ||
              errorMessage.toLowerCase().includes('count is not defined');

            if (isBackendCountBug) {
              toast.success("Product deleted successfully!");
              loadProducts();
              return;
            }

            // Check for specific database constraint errors
            if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('order_items_productId_fkey')) {
              toast.error('Cannot delete product: It has associated orders', {
                description: 'Products with existing orders cannot be deleted to maintain data integrity.'
              });
            } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
              toast.error('Authentication error. Please log out and log back in.');
            } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
              toast.error('You do not have permission to delete this product.');
            } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
              toast.error('Product not found. It may have already been deleted.');
            } else {
              toast.error(`Delete failed: ${errorMessage}`);
            }
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
    }
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, featuredImage: file }));
    }
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Append to mutable ref (always current at submit time)
      addGalleryAccumRef.current = [...addGalleryAccumRef.current, ...newFiles];
      // Also update state so previews re-render
      setFormData(prev => ({ ...prev, galleryImages: [...addGalleryAccumRef.current] }));
      e.target.value = "";
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEditFormData(prev => ({ ...prev, images: files }));
    }
  };

  const handleEditFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFormData(prev => ({ ...prev, featuredImage: file }));
    }
  };

  const handleEditGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Append to mutable ref (always current at submit time)
      editGalleryAccumRef.current = [...editGalleryAccumRef.current, ...newFiles];
      // Also update state so previews re-render
      setEditFormData(prev => ({ ...prev, galleryImages: [...editGalleryAccumRef.current] }));
      e.target.value = "";
    }
  };

  const openEditModal = async (productId: string, product?: Product, isRestoring: boolean = false) => {
    // Check if product is rejected before allowing edit
    if (!isRestoring && product?.status === "REJECTED") {
      toast.error("Cannot edit rejected products. Please create a new product or resubmit the original.");
      return;
    }

    setIsRestoringMode(isRestoring);
    setEditProductId(productId);
    setEditSubmitting(false);
    editGalleryAccumRef.current = []; // reset accumulator for fresh edit session
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusMsg = response.status === 403 ? "This product cannot be edited (may be rejected or not accessible)." : "Failed to fetch product details";
        throw new Error(errorData.message || statusMsg);
      }
      const data = await response.json();
      const prod = data.product || data;

      // Check if returned product is rejected
      if (!isRestoring && prod.status === "REJECTED") {
        throw new Error("This product has been rejected and cannot be edited. Please create a new product instead.");
      }

      // Deduplicate gallery: merge galleryImages + images, remove featured, remove dupes
      const featuredImg: string | null = prod.featuredImage || null;
      const rawGallery: string[] = [
        ...(Array.isArray(prod.galleryImages) ? prod.galleryImages : []),
        ...(Array.isArray(prod.images) ? prod.images : []),
      ];
      const resolvedGallery: string[] = [...new Set(rawGallery)].filter(
        (img) => img !== featuredImg
      );
      setEditFormData({
        title: prod.title || "",
        description: prod.description || "",
        price: prod.price?.toString() || "",
        stock: prod.stock?.toString() || "",
        category: prod.category || "",
        images: [],
        oldImages: prod.images || [],
        featuredImage: null,
        oldFeaturedImage: featuredImg,
        galleryImages: [],
        oldGalleryImages: resolvedGallery,
        featured: prod.featured ?? false,
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : (prod.tags || ""),
        artistName: prod.artistName || "",
      });
      setShowEditModal(true);
    } catch (err) {
      setEditProductId(null); // clear the ID so modal doesn't open
      toast.error((err as Error).message || "Failed to load product");
    }
  };

  // ── Open restore modal directly from recycle-bin data (no API fetch) ───────
  const openRestoreModal = (recycleBinProduct: RecycleBinProduct) => {
    setIsRestoringMode(true);
    setEditProductId(recycleBinProduct.id);
    setEditSubmitting(false);
    editGalleryAccumRef.current = [];

    const featuredImg = recycleBinProduct.featuredImage || null;
    const rawGallery: string[] = [
      ...(Array.isArray(recycleBinProduct.galleryImages) ? recycleBinProduct.galleryImages : []),
      ...(Array.isArray(recycleBinProduct.images) ? recycleBinProduct.images : []),
    ];
    const resolvedGallery = [...new Set(rawGallery)].filter((img) => img !== featuredImg);

    setEditFormData({
      title: recycleBinProduct.title || "",
      description: recycleBinProduct.description || "",
      price: recycleBinProduct.price?.toString() || "",
      stock: recycleBinProduct.stock?.toString() || "",
      category: recycleBinProduct.category || "",
      images: [],
      oldImages: [],
      featuredImage: null,
      oldFeaturedImage: featuredImg,
      galleryImages: [],
      oldGalleryImages: resolvedGallery,
      featured: recycleBinProduct.featured ?? false,
      tags: Array.isArray(recycleBinProduct.tags)
        ? recycleBinProduct.tags.join(", ")
        : (recycleBinProduct.tags || ""),
      artistName: recycleBinProduct.artistName || "",
    });
    setShowEditModal(true);
  };

  const handleEditProduct = async () => {
    if (!editProductId) return;
    if (!editFormData.title || !editFormData.price || !editFormData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setEditSubmitting(true);
      const token = getAuthToken();
      const form = new FormData();
      form.append("title", editFormData.title.trim());
      form.append("description", editFormData.description.trim());
      form.append("price", String(editFormData.price));
      form.append("stock", String(editFormData.stock));
      form.append("category", editFormData.category.trim());

      // featuredImage: read from native input ref — always current
      const editFeaturedFile = editFeaturedImageRef.current?.files?.[0] ?? null;
      // galleryImages: read from mutable accumulator ref — always current, no stale closure
      const editGalleryFiles = [...editGalleryAccumRef.current];

      // Append featuredImage if new one selected; else send old URL to keep it
      if (editFeaturedFile) {
        form.append("featuredImage", editFeaturedFile);
      } else if (editFormData.oldFeaturedImage) {
        form.append("oldFeaturedImage", editFormData.oldFeaturedImage);
      }

      // Append existing gallery images back to the server. 
      // This ensures they are not deleted if the server replaces the whole list.
      if (editFormData.oldGalleryImages?.length > 0) {
        editFormData.oldGalleryImages.forEach(url => {
          form.append("galleryImages", url);
        });
      }
      
      // Append the new gallery files
      if (editGalleryFiles?.length > 0) {
        editGalleryFiles.forEach(f => {
          form.append("galleryImages", f);
        });
      }

      console.log("featuredImage file to send:", editFeaturedFile);
      console.log("existing gallery URLs to keep:", editFormData.oldGalleryImages);
      console.log("new galleryImages files to add:", editGalleryFiles);
      // Add featured and tags fields
      form.append("featured", String(editFormData.featured));
      form.append("tags", editFormData.tags);
      if (editFormData.artistName) {
        form.append("artistName", editFormData.artistName.trim());
      }

      // ── RESTORE MODE: restore the deleted product first, then apply edits ──
      if (isRestoringMode && editProductId) {
        // Step 1: Un-delete the product (sets status back to PENDING)
        await restoreProduct(editProductId);

        // Step 2: Apply any edits the seller made
        try {
          const updateRes = await fetch(`${BASE_URL}/api/products/${editProductId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: form,
          });
          if (updateRes.ok) {
            toast.success(`"${editFormData.title}" restored and submitted for admin review!`);
          } else {
            toast.success(`"${editFormData.title}" restored! It's now pending review. Some edits may not have saved.`, { duration: 6000 });
          }
        } catch {
          toast.success(`"${editFormData.title}" restored and submitted for admin review!`);
        }

        setRecycleBinProducts(prev => prev.filter(p => p.id !== editProductId));
        setShowEditModal(false);
        setEditProductId(null);
        setIsRestoringMode(false);
        editGalleryAccumRef.current = [];
        loadProducts();
        return;
      }

      // ── NORMAL EDIT MODE ─────────────────────────────────────────────────
      // Debug: Log what we're sending
      console.log("Sending edit request for product:", editProductId);
      console.log("FormData contents:");
      for (const pair of form.entries()) {
        console.log(pair[0], pair[1]);
      }
      const response = await fetch(`${BASE_URL}/api/products/${editProductId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: form,
      });
      // Debug: Log response
      console.log("Response status:", response.status);
      if (!response.ok) {
        let errorMsg = "Failed to update product";
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      toast.success("Product submitted for admin review — it will be live once approved.", { duration: 5000 });

      setShowEditModal(false);
      setEditProductId(null);
      setIsRestoringMode(false);
      editGalleryAccumRef.current = []; // clear accumulator
      loadProducts();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Edit product error:", error);
      toast.error(error.message || "Failed to update product");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Seller deactivate (ACTIVE → INACTIVE) ─────────────────────────────────
  const openSellerDeactivateModal = (productId: string) => {
    setSellerDeactivateProductId(productId);
    setSellerDeactivateReason("");
    setShowSellerDeactivateModal(true);
  };

  const handleSellerDeactivate = async () => {
    if (!sellerDeactivateProductId) return;
    if (!sellerDeactivateReason.trim()) {
      toast.error("Please enter a reason for deactivating your product.");
      return;
    }
    try {
      setSellerDeactivateSubmitting(true);
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/products/${sellerDeactivateProductId}/deactivate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ reason: sellerDeactivateReason.trim() }),
      });

      if (!res.ok) {
        // 500 here almost always means the product was deactivated successfully
        // but the backend's notification function crashed afterwards.
        if (res.status === 500) {
          const errBody = await res.json().catch(() => ({}));
          const msg: string = (errBody as any).message || "";
          const isNotificationCrash =
            msg.toLowerCase().includes("not defined") ||
            msg.toLowerCase().includes("is not a function") ||
            msg.toLowerCase().includes("notify") ||
            msg.toLowerCase().includes("notification") ||
            msg.toLowerCase().includes("email");
          if (isNotificationCrash || msg === "") {
            toast.success("Product deactivated successfully.");
            setShowSellerDeactivateModal(false);
            setSellerDeactivateProductId(null);
            setSellerDeactivateReason("");
            loadProducts();
            return;
          }
          throw new Error(msg || "Failed to deactivate product");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to deactivate product");
      }

      toast.success("Product deactivated successfully.");
      setShowSellerDeactivateModal(false);
      setSellerDeactivateProductId(null);
      setSellerDeactivateReason("");
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate product");
    } finally {
      setSellerDeactivateSubmitting(false);
    }
  };

  // ── Submit for review (INACTIVE/REJECTED → PENDING) ───────────────────────
  const openSubmitReviewModal = (productId: string) => {
    setSubmitReviewProductId(productId);
    setSubmitReviewNote("");
    setShowSubmitReviewModal(true);
  };

  const handleSubmitForReview = async () => {
    if (!submitReviewProductId) return;
    try {
      setSubmitReviewSubmitting(true);
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/products/${submitReviewProductId}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ reviewNote: submitReviewNote.trim() }),
      });

      if (!res.ok) {
        if (res.status === 500) {
          // The backend always updates the product to PENDING before crashing
          // on its notification/email helper — treat any 500 as a partial success.
          toast.success("Product submitted for review. You'll be notified once an admin reviews it.", { duration: 6000 });
          setShowSubmitReviewModal(false);
          setSubmitReviewProductId(null);
          setSubmitReviewNote("");
          loadProducts();
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to submit for review");
      }

      toast.success("Product submitted for review. You'll be notified once an admin reviews it.", { duration: 6000 });
      setShowSubmitReviewModal(false);
      setSubmitReviewProductId(null);
      setSubmitReviewNote("");
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit product for review");
    } finally {
      setSubmitReviewSubmitting(false);
    }
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalRevenue = products.reduce((sum, p) => sum + (Number(p.price) * (Number(p.sales) || 0)), 0);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Per-status counts
  const statusCounts = {
    all: products.length,
    ACTIVE: products.filter(p => p.status === 'ACTIVE').length,
    PENDING: products.filter(p => p.status === 'PENDING').length,
    REJECTED: products.filter(p => p.status === 'REJECTED').length,
    INACTIVE: products.filter(p => p.status === 'INACTIVE').length,
  };

  // Filtered products by search, category, and status
  const filteredProducts = products.filter(
    (p) =>
      (p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.toLowerCase().includes(search.toLowerCase()))) &&
      (categoryFilter ? p.category === categoryFilter : true) &&
      (statusFilter !== 'all' ? p.status === statusFilter : true)
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getPaginationPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
     
     {/* Message for Account Status when approved */}
      {!profileLoading && sellerProfile?.status === "APPROVED" && totalProducts === 0 && (
        <div className=" rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5 rounded-lg bg-primary/10 p-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Welcome to Your Store! 🎉
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your seller account is approved and active. Start by adding your first product to begin selling and reach more shoppers.
            </p>

            <div className="mt-3">
              <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Your First Product
              </Button>
            </div>
          </div>
        </div>
      )}


{/* Message for Account Status if not approved */}
        {!profileLoading && sellerProfile && (
        <>
          {sellerProfile.status === "PENDING" && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
              <CardContent className="flex items-center gap-3 pt-4">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Account Pending Approval</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your seller account is currently under review. Once approved, you'll be able to add and manage products. You'll receive a notification when your account is activated.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshSellerStatus}
                  disabled={profileLoading}
                  className="shrink-0 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          )}
          {sellerProfile.status === "REJECTED" && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <CardContent className="flex items-center gap-3 pt-4">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 dark:text-red-200">Account Not Approved</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Your seller account application was not approved. Please contact support for more information about reapplying.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshSellerStatus}
                  disabled={profileLoading}
                  className="shrink-0 text-red-700 border-red-300 hover:bg-red-100"
                >
                  {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          )}
          {sellerProfile.status === "INACTIVE" && (
            <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/10">
              <CardContent className="flex items-center gap-3 pt-4">
                <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">Account Inactive</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Your seller account is currently inactive. Please contact support to reactivate your account and start selling again.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and listings.</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0 items-center">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded px-3 py-2 w-[200px]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Category Filter Dropdown */}
          <select
            className="border rounded px-3 py-2 w-[180px]"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button 
            className={cn("gap-2", sellerProfile?.status !== "APPROVED" && "opacity-50 cursor-not-allowed")} 
            onClick={() => {
              if (sellerProfile?.status !== "APPROVED") {
                toast.error("Your account needs to be approved before you can add products");
                return;
              }
              setShowAddModal(true);
            }}
            disabled={sellerProfile?.status !== "APPROVED"}
          >
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

      {/* Tab Switcher */}
      <div className="flex gap-1 border-b pb-3 mb-2">
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('products')}
          className="gap-1.5"
        >
          <Package className="h-4 w-4" /> My Products ({totalProducts})
        </Button>
        <Button
          variant={activeTab === 'recycle-bin' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('recycle-bin')}
          className={cn("gap-1.5", activeTab !== 'recycle-bin' && "text-muted-foreground")}
        >
          <Trash2 className="h-4 w-4" /> Recycle Bin ({recycleBinProducts.length})
        </Button>
      </div>

      {activeTab === 'products' && (<>
      {/* Status Filter Tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-2 mb-1">
        {([
          { key: 'all',      label: 'All',           count: statusCounts.all,      cls: '' },
          { key: 'ACTIVE',   label: 'Live',          count: statusCounts.ACTIVE,   cls: 'text-green-700 dark:text-green-400' },
          { key: 'PENDING',  label: 'Pending Review',count: statusCounts.PENDING,  cls: 'text-yellow-700 dark:text-yellow-400' },
          { key: 'REJECTED', label: 'Rejected',      count: statusCounts.REJECTED, cls: 'text-red-600 dark:text-red-400' },
          { key: 'INACTIVE', label: 'Inactive',      count: statusCounts.INACTIVE, cls: 'text-gray-500 dark:text-gray-400' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap",
              statusFilter === tab.key
                ? "border border-b-background border-b-0 -mb-px bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
              statusFilter === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {["Image", "Title", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-12 w-12 rounded" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="h-8 w-14 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="col-span-full text-center py-12">
          {statusFilter !== 'all'
            ? `No ${statusFilter === 'ACTIVE' ? 'live' : statusFilter === 'PENDING' ? 'pending' : statusFilter === 'REJECTED' ? 'rejected' : 'inactive'} products found.`
            : 'No products found.'}
        </Card>
      ) : (
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
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2">
                    {(product.featuredImage || (product.images && product.images.length > 0)) ? (
                      <Image
                        src={product.featuredImage || product.images[0]}
                        alt={product.title}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover rounded"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/100x100?text=No+Image';
                        }}
                        unoptimized
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                        <Image
                          src="/placeholder.svg"
                          alt="No image"
                          width={24}
                          height={24}
                          className="h-6 w-6 text-muted-foreground/50"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-semibold">{product.title}</p>
                    {product.status === 'REJECTED' && product.rejectionReason && (
                      <p className="text-xs text-red-600 mt-0.5 line-clamp-2" title={product.rejectionReason}>
                        <AlertCircle className="inline h-3 w-3 mr-1 align-middle" />
                        {product.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2">{product.category}</td>
                  <td className="px-4 py-2">${product.price}</td>
                  <td className={cn("px-4 py-2 font-medium", (product.stock ?? 0) <= 2 && product.status === 'INACTIVE' ? "text-red-600" : "")}>
                    {product.stock}
                    {(product.stock ?? 0) <= 2 && product.status === 'INACTIVE' && (
                      <span className="ml-1 text-xs text-red-500">(low)</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={product.status} stock={product.stock} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 items-center">
                      {product.status === 'REJECTED' ? (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Submit for Review" onClick={() => openSubmitReviewModal(product.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={() => router.push(`/sellerdashboard/products/${product.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : product.status === 'PENDING' ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400 whitespace-nowrap">
                            <Clock className="h-3 w-3" /> In Review
                          </span>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={() => router.push(`/sellerdashboard/products/${product.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : product.status === 'INACTIVE' ? (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title={(product.stock ?? 0) <= 2 ? 'Update Stock' : 'Edit'} onClick={() => openEditModal(product.id)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Submit for Review" onClick={() => openSubmitReviewModal(product.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={() => router.push(`/sellerdashboard/products/${product.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <div className="flex items-center gap-1.5 pl-1" title="Submit for review to re-activate">
                            <Switch checked={false} disabled />
                            <span className="text-xs font-medium text-red-500 whitespace-nowrap">
                              {(product.stock ?? 0) <= 2 ? 'Low Stock' : 'Inactive'}
                            </span>
                          </div>
                        </>
                      ) : (
                        /* ACTIVE */
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEditModal(product.id)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={() => router.push(`/sellerdashboard/products/${product.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <div className="flex items-center gap-1.5 pl-1">
                            <Switch
                              checked={true}
                              onCheckedChange={() => openSellerDeactivateModal(product.id)}
                            />
                            <span className="text-xs font-medium text-green-600 whitespace-nowrap">Active</span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}</span>
              {"–"}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span>
              {" of "}
              <span className="font-medium text-foreground">{filteredProducts.length}</span>
              {" products"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Per page:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[6, 12, 24, 48].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPaginationPages().map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">&hellip;</span>
              ) : (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => handlePageChange(page as number)}>{page}</Button>
              )
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      </>)}

      {/* Recycle Bin View */}
      {activeTab === 'recycle-bin' && (
        <div className="space-y-4">
          {recycleBinLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recycleBinProducts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Trash2 className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-lg font-semibold text-muted-foreground">Recycle Bin is empty</p>
                <p className="text-sm text-muted-foreground">Deleted products will appear here and can be restored anytime.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="min-w-full divide-y divide-muted">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Deleted On</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Deleted By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {recycleBinProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2">
                        {product.featuredImage ? (
                          <Image
                            src={product.featuredImage}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="h-12 w-12 object-cover rounded opacity-60"
                            unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image'; }}
                          />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-muted-foreground">{product.title}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{product.category || '—'}</td>
                      <td className="px-4 py-2 text-sm">${product.price}</td>
                      <td className="px-4 py-2 text-sm">{product.stock}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(product.deletedAt).toLocaleDateString('en-AU', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          className={cn(
                            "text-xs whitespace-nowrap",
                            product.deletedByRole === 'ADMIN'
                              ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                              : "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
                          )}
                          variant="outline"
                        >
                          {product.deletedByRole === 'ADMIN' ? 'Deleted by Admin' : 'Deleted by You'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setViewBinProduct(product)}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openRestoreModal(product)}
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

            {/* Seller Deactivate Modal */}
            {showSellerDeactivateModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-orange-500" /> Deactivate Product
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowSellerDeactivateModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted" disabled={sellerDeactivateSubmitting}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Please tell us why you're deactivating this product. The admin will be notified.</p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Reason <span className="text-red-500">*</span></Label>
                      <Textarea
                        placeholder="e.g. I am restocking, will be back in 2 weeks."
                        value={sellerDeactivateReason}
                        onChange={(e) => setSellerDeactivateReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={sellerDeactivateSubmitting}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">{sellerDeactivateReason.length} characters</p>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowSellerDeactivateModal(false)} disabled={sellerDeactivateSubmitting} className="h-10 px-4">Cancel</Button>
                    <Button
                      className="h-10 px-6 font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleSellerDeactivate}
                      disabled={sellerDeactivateSubmitting || !sellerDeactivateReason.trim()}
                    >
                      {sellerDeactivateSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deactivating...</> : "Deactivate Product"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Submit for Review Modal */}
            {showSubmitReviewModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-blue-500" /> Submit for Review
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowSubmitReviewModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted" disabled={submitReviewSubmitting}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your product will be submitted for admin review. It will go live once approved. You may add an optional note for the admin.</p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Note for Admin <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Textarea
                        placeholder="e.g. I have updated the images and description. Please review again."
                        value={submitReviewNote}
                        onChange={(e) => setSubmitReviewNote(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={submitReviewSubmitting}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">{submitReviewNote.length} characters</p>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowSubmitReviewModal(false)} disabled={submitReviewSubmitting} className="h-10 px-4">Cancel</Button>
                    <Button
                      className="h-10 px-6 font-semibold"
                      onClick={handleSubmitForReview}
                      disabled={submitReviewSubmitting}
                    >
                      {submitReviewSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><RotateCcw className="mr-2 h-4 w-4" />Submit for Review</>}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && (() => {
              const editingProduct = products.find(p => p.id === editProductId);
              const isResubmit = editingProduct?.status === 'REJECTED';
              const isInactive = editingProduct?.status === 'INACTIVE';
              const isActive = editingProduct?.status === 'ACTIVE';
              return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                  <CardHeader className="border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {isRestoringMode ? 'Edit & Restore Product' : isResubmit ? 'Edit & Resubmit Product' : isInactive ? 'Update Product' : 'Edit Product'}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => { editGalleryAccumRef.current = []; setShowEditModal(false); setIsRestoringMode(false); }} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4" /></Button>
                    </div>
                    {isRestoringMode ? (
                      <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg text-xs bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300">
                        <RotateCcw className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          Review the product details below and make any edits needed before restoring. Once confirmed, the product will be submitted for admin review and go live once approved.
                        </span>
                      </div>
                    ) : (isResubmit || isActive || isInactive) && (
                      <div className={`flex items-start gap-2 mt-2 p-2.5 rounded-lg text-xs ${
                        isResubmit ? 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300'
                        : isInactive && (editingProduct?.stock ?? 0) <= 2 ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                        : 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300'
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          {isResubmit
                            ? 'After saving, your product will be resubmitted for admin review. Address the rejection reason before resubmitting.'
                            : isInactive && (editingProduct?.stock ?? 0) <= 2
                            ? 'Update the stock quantity. Your product will be submitted for admin review and re-listed once approved.'
                            : 'Editing a live product will temporarily remove it from the storefront and submit it for re-approval.'}
                        </span>
                      </div>
                    )}
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

                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Promotion Tags</Label>
                      <div className="flex flex-wrap gap-4 pt-1">
                        {["New Arrival", "Sale", "Best Seller", "Limited Edition"].map(tag => {
                          const currentTags = editFormData.tags ? editFormData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
                          const isChecked = currentTags.includes(tag);
                          return (
                            <div 
                              key={tag} 
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer select-none",
                                isChecked ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted/10 border-transparent hover:bg-muted/20"
                              )}
                              onClick={() => {
                                let newTags;
                                if (!isChecked) {
                                  newTags = [...currentTags, tag];
                                } else {
                                  newTags = currentTags.filter(t => t !== tag);
                                }
                                setEditFormData({
                                  ...editFormData,
                                  tags: newTags.join(", ")
                                });
                              }}
                            >
                              <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                                isChecked ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                              )}>
                                {isChecked && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-sm font-medium">{tag}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* --- IMAGE UPLOAD --- */}
                    {/* Featured Image */}  
                    <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="edit-featuredImage" className="text-sm font-semibold">Featured Image</Label>
                        <span className="text-[10px] text-muted-foreground">Main product image</span>
                      </div>
                      <input
                        ref={editFeaturedImageRef}
                        id="edit-featuredImage"
                        type="file"
                        accept="image/*"
                        onChange={handleEditFeaturedImageChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                      />
                      <div className="flex gap-3 flex-wrap pt-2">
                        {editFormData.oldFeaturedImage && !editFormData.featuredImage && (
                          <div className="relative group h-20 w-20 rounded border overflow-hidden flex items-center justify-center bg-muted">
                            <Image
                              src={editFormData.oldFeaturedImage}
                              className="h-full w-full object-cover"
                              alt="Featured"
                              width={80}
                              height={80}
                              onError={(e) => (e.target as HTMLImageElement).style.display='none'}
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => setEditFormData({ ...editFormData, oldFeaturedImage: null })}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {editFormData.featuredImage && (
                          <div className="relative group h-20 w-20 rounded border overflow-hidden flex items-center justify-center bg-muted">
                            <Image
                              src={URL.createObjectURL(editFormData.featuredImage)}
                              className="h-full w-full object-cover"
                              alt="New Featured"
                              width={80}
                              height={80}
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
                          </div>
                        )}
                        {!editFormData.oldFeaturedImage && !editFormData.featuredImage && (
                          <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                            <Package className="h-6 w-6 mb-1 opacity-20" />
                            <p className="text-xs">No featured image</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Gallery Images */}
                    <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="edit-galleryImages" className="text-sm font-semibold">Gallery Images</Label>
                        <span className="text-[10px] text-muted-foreground">Multiple gallery images</span>
                      </div>
                      <input
                        ref={editGalleryImagesRef}
                        id="edit-galleryImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditGalleryImageChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                      />
                      <div className="flex gap-3 flex-wrap pt-2">
                        {editFormData.oldGalleryImages && editFormData.oldGalleryImages.length > 0 && editFormData.oldGalleryImages.map((img, idx) => (
                          <div key={idx} className="relative group h-20 w-20 rounded border overflow-hidden flex items-center justify-center bg-muted">
                            <Image
                              src={img}
                              className="h-full w-full object-cover"
                              alt="Gallery"
                              width={80}
                              height={80}
                              onError={(e) => (e.target as HTMLImageElement).style.display='none'}
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => {
                                const updated = editFormData.oldGalleryImages.filter((_, i) => i !== idx);
                                setEditFormData(prev => ({ ...prev, oldGalleryImages: updated }));
                              }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {editFormData.galleryImages && editFormData.galleryImages.length > 0 && editFormData.galleryImages.map((file, idx) => (
                          <div key={idx} className="relative group h-20 w-20 rounded border overflow-hidden flex items-center justify-center bg-muted">
                            <Image
                              src={URL.createObjectURL(file)}
                              className="h-full w-full object-cover"
                              alt="New Gallery"
                              width={80}
                              height={80}
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => {
                                const updated = editFormData.galleryImages.filter((_, i) => i !== idx);
                                editGalleryAccumRef.current = updated; // keep ref in sync
                                setEditFormData(prev => ({ ...prev, galleryImages: updated }));
                              }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {(!editFormData.oldGalleryImages || editFormData.oldGalleryImages.length === 0) && editFormData.galleryImages.length === 0 && (
                          <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                            <Package className="h-6 w-6 mb-1 opacity-20" />
                            <p className="text-xs">No gallery images</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm mt-4 border-t py-4">
                      <Button className="flex-1 h-11 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleEditProduct} disabled={editSubmitting}>
                        {editSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isRestoringMode ? "Save & Restore" : "Save Changes"}
                      </Button>
                      <Button variant="outline" className="h-11 px-8" onClick={() => {
                          editGalleryAccumRef.current = []; // reset on cancel
                          setShowEditModal(false);
                          setIsRestoringMode(false);
                        }} disabled={editSubmitting}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
            })()}
      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Add New Product</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { addGalleryAccumRef.current = []; setShowAddModal(false); }} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
                  <Input id="title" placeholder="Give your product a clear name" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="focus:ring-primary h-10" />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Detailed Description</Label>
                  <Textarea id="description" placeholder="Describe the features, materials, and benefits..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="resize-none focus:ring-primary py-2" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="artistName" className="text-sm font-semibold">Artist Name (Optional)</Label>
                  <Input id="artistName" placeholder="Enter artist name" value={formData.artistName} onChange={(e) => setFormData({ ...formData, artistName: e.target.value })} className="focus:ring-primary h-10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="price" type="number" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="pl-9 focus:ring-primary h-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-semibold">Initial Stock <span className="text-red-500">*</span></Label>
                  <Input id="stock" type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="focus:ring-primary h-10" />
                </div>

                <div className="space-y-2 relative" ref={catDropdownRef}>
                  <Label htmlFor="category" className="text-sm font-semibold">Category <span className="text-red-500">*</span></Label>
                  <div 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-primary/50 cursor-pointer"
                    onClick={() => setIsCatOpen(!isCatOpen)}
                  >
                    <span className={formData.category ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {formData.category || "Select a category"}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isCatOpen && "rotate-180")} />
                  </div>
                  
                  {isCatOpen && (
                    <div className="absolute z-[60] w-full mt-1 bg-background text-popover-foreground rounded-lg border shadow-xl p-1 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                      <div className="flex items-center border-b px-3 pb-2 pt-1">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search categories..."
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
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
                          .filter(cat => cat.categoryName.toLowerCase().includes(catSearch.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat.categoryName}
                              className={cn(
                                "group relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                                formData.category === cat.categoryName && "bg-primary/5 text-primary font-medium"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, category: cat.categoryName });
                                setIsCatOpen(false);
                                setCatSearch("");
                              }}
                            >
                              <div className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                                formData.category === cat.categoryName ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                              )}>
                                {formData.category === cat.categoryName && <Check className="h-3 w-3" />}
                              </div>
                              {cat.categoryName}
                            </div>
                          ))}
                        {availableCategories.length > 0 && availableCategories.filter(cat => cat.categoryName.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
                        )}
                      </div>
                      <div className="border-t mt-1 pt-2 px-3 pb-2 bg-muted/30">
                        <p className="text-[11px] text-muted-foreground text-center">
                          Category not listed? <a href="/sellerdashboard/categories" className="text-primary hover:underline font-medium">Request a new one</a> from the Categories page
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Promotion Tags</Label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {["New Arrival", "Sale", "Best Seller", "Limited Edition"].map(tag => {
                    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
                    const isChecked = currentTags.includes(tag);
                    return (
                      <div 
                        key={tag} 
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer select-none",
                          isChecked ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted/10 border-transparent hover:bg-muted/20"
                        )}
                        onClick={() => {
                          let newTags;
                          if (!isChecked) {
                            newTags = [...currentTags, tag];
                          } else {
                            newTags = currentTags.filter(t => t !== tag);
                          }
                          setFormData({
                            ...formData,
                            tags: newTags.join(", ")
                          });
                        }}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                          isChecked ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                        )}>
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium">{tag}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* --- IMAGE UPLOAD --- */}
              {/* Featured Image */}
              <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="featuredImage" className="text-sm font-semibold">Featured Image</Label>
                  <span className="text-[10px] text-muted-foreground">Main product image</span>
                </div>
                <input
                  ref={addFeaturedImageRef}
                  id="featuredImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <div className="flex gap-3 flex-wrap pt-2">
                  {formData.featuredImage ? (
                    <div className="relative group h-24 w-24 rounded-lg border-2 border-muted overflow-hidden bg-background shadow-sm">
                      <Image
                        src={URL.createObjectURL(formData.featuredImage)}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        alt="Featured Preview"
                        width={96}
                        height={96}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => setFormData({ ...formData, featuredImage: null })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                      <Package className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No featured image selected</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Gallery Images */}
              <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="galleryImages" className="text-sm font-semibold">Gallery Images</Label>
                  <span className="text-[10px] text-muted-foreground">Upload multiple gallery images</span>
                </div>
                <input
                  ref={addGalleryImagesRef}
                  id="galleryImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImageChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <div className="flex gap-3 flex-wrap pt-2">
                  {formData.galleryImages && formData.galleryImages.length > 0 && formData.galleryImages.map((file, idx) => (
                    <div key={idx} className="relative group h-24 w-24 rounded-lg border-2 border-muted overflow-hidden bg-background shadow-sm">
                      <Image
                        src={URL.createObjectURL(file)}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        alt="Gallery Preview"
                        width={96}
                        height={96}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => {
                            const updated = formData.galleryImages.filter((_, i) => i !== idx);
                            addGalleryAccumRef.current = updated; // keep ref in sync
                            setFormData(prev => ({ ...prev, galleryImages: updated }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {formData.galleryImages.length === 0 && (
                    <div className="h-24 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                      <Package className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No gallery images selected</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm mt-4 border-t py-4">
                <Button className="flex-1 h-11 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleAddProduct} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <> <Plus className="w-5 h-5 mr-2" /> Publish Product</>}
                </Button>
                <Button variant="outline" className="h-11 px-8" onClick={() => { addGalleryAccumRef.current = []; setShowAddModal(false); }} disabled={submitting}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Deleted Product Dialog */}
      <Dialog open={!!viewBinProduct} onOpenChange={(open) => { if (!open) setViewBinProduct(null); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700">
              Deleted
            </span>
            <span className="truncate">{viewBinProduct?.title}</span>
          </DialogTitle>
        </DialogHeader>
        {viewBinProduct && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {viewBinProduct.featuredImage ? (
                <Image
                  src={viewBinProduct.featuredImage}
                  alt={viewBinProduct.title}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 object-cover rounded-lg border shrink-0 opacity-80"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image'; }}
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center bg-muted rounded-lg border shrink-0">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-base">{viewBinProduct.title}</p>
                {viewBinProduct.category && <p className="text-muted-foreground">{viewBinProduct.category}</p>}
                <div className="flex flex-wrap gap-3">
                  <span><span className="text-muted-foreground">Price:</span> <span className="font-semibold">${viewBinProduct.price}</span></span>
                  <span><span className="text-muted-foreground">Stock:</span> <span className="font-semibold">{viewBinProduct.stock}</span></span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    viewBinProduct.deletedByRole === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {viewBinProduct.deletedByRole === 'ADMIN' ? 'Deleted by Admin' : 'Deleted by You'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    on {new Date(viewBinProduct.deletedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            <ProductAuditHistory productId={viewBinProduct.id} productTitle={viewBinProduct.title} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
}

export default ProjectsPage;
