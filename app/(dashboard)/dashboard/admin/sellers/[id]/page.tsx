"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Store,
  User,
  Mail,
  Phone,
  Briefcase,
  Package,
  Calendar,
  MapPin,
  Banknote,
  Tag,
  Flag,
  Globe,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

const iconClass = "inline-block mr-2 text-muted-foreground";

type CulturalApprovalState = {
  approved: boolean;
  feedback: string;
};

interface SellerData {
  id: string;
  sellerId: string;
  userId: string;
  contactPerson: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  abn: string;
  yearsInBusiness: string | null;
  storeName: string;
  storeDescription: string;
  storeLogo: string | null;
  storeBanner: string | null;
  storeLocation: string | null;
  culturalBackground: string | null;
  culturalStory: string;
  culturalApprovalStatus: string;
  culturalApprovalAt: string;
  culturalApprovalFeedback: string;
  culturalApprovalBy: string;
  kycDocuments: any[];
  kycSubmitted: boolean;
  bankDetails: {
    bsb: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  status: string;
  productCount: number;
  minimumProductsUploaded: boolean;
  onboardingStep: number;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string;
  rejectedAt: string | null;
  suspendedAt: string | null;
  activatedAt: string;
  submittedForReviewAt: string;
  userEmail: string;
  userPhone: string;
  userCreatedAt: string;
}

interface ApiResponse {
  success: boolean;
  seller: SellerData;
  products: any[];
  orders: any[];
  statistics: {
    totalProducts: number;
    totalOrders: number;
    activeProducts: number;
    pendingOrders: number;
  };
}

export default function SingleSellerPage() {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [culturalApproval, setCulturalApproval] = useState<CulturalApprovalState>({
    approved: true,
    feedback: "",
  });

  // Fetch seller details
  useEffect(() => {
    async function fetchSellerDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/api/admin/sellers/${sellerId}`);
        console.log("Seller API Response:", res); // Debug log
        if (res.success) {
          setSeller(res.seller);
          setProducts(res.products || []);
          setOrders(res.orders || []);
          setStatistics(res.statistics || {});
        } else {
          toast.error("Failed to load seller details");
        }
      } catch (err) {
        console.error("Fetch error:", err); // Debug log
        toast.error("Failed to load seller details");
      } finally {
        setLoading(false);
      }
    }

    if (sellerId) {
      fetchSellerDetails();
    }
  }, [sellerId]);

  const handleApprove = async () => {
    try {
      await api.post(`/api/admin/sellers/approve/${sellerId}`);
      toast.success("Seller approved successfully");
      // Refetch seller data
      const res = await api.get(`/api/admin/sellers/${sellerId}`);
      if (res.success) {
        setSeller(res.seller);
      }
    } catch (err) {
      toast.error("Failed to approve seller");
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/api/admin/sellers/${sellerId}/reject`, {});
      toast.success("Seller rejected");
      router.push("/dashboard/admin/sellers");
    } catch (err) {
      toast.error("Failed to reject seller");
    }
  };

  const handleActivate = async () => {
    try {
      await api.post(`/api/admin/sellers/activate/${sellerId}`, {});
      toast.success("Seller activated");
      const res = await api.get(`/api/admin/sellers/${sellerId}`);
      if (res.success) {
        setSeller(res.seller);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to activate seller";
      if (typeof message === "string" && message.includes("Seller must upload")) {
        toast.error("Seller must upload at least 1-2 products before going live. 5+ products recommended.");
      } else {
        toast.error("Failed to activate seller");
      }
    }
  };

  const handleCulturalApproval = async () => {
    try {
      await api.post(`/api/admin/sellers/cultural-approval/${sellerId}`, {
        approved: culturalApproval.approved,
        feedback: culturalApproval.feedback,
      });
      toast.success("Cultural approval updated");
      const res = await api.get(`/api/admin/sellers/${sellerId}`);
      if (res.success) {
        setSeller(res.seller);
      }
    } catch (err: any) {
      console.error("Cultural approval error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update cultural approval";
      toast.error("Failed to update cultural approval", { description: message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="p-8 text-center">Loading seller details...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="space-y-6">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Seller not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const businessAddressObj = typeof seller.businessAddress === "string" ? JSON.parse(seller.businessAddress) : seller.businessAddress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{seller.businessName}</h2>
            <p className="text-muted-foreground">{seller.storeName}</p>
          </div>
        </div>
        <Badge variant={seller.status === "ACTIVE" ? "default" : seller.status === "PENDING" ? "secondary" : "outline"}>
          {seller.status.charAt(0) + seller.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Building2 className={iconClass} />
              <span className="font-semibold">Business Name:</span> {seller.businessName}
            </div>
            <div>
              <Store className={iconClass} />
              <span className="font-semibold">Store Name:</span> {seller.storeName}
            </div>
            <div>
              <Briefcase className={iconClass} />
              <span className="font-semibold">Business Type:</span> {seller.businessType}
            </div>
            <div>
              <Tag className={iconClass} />
              <span className="font-semibold">ABN:</span> {seller.abn}
            </div>
            <div className="md:col-span-2">
              <MapPin className={iconClass} />
              <span className="font-semibold">Address:</span>{" "}
              {businessAddressObj && `${businessAddressObj.street}, ${businessAddressObj.city}, ${businessAddressObj.state} ${businessAddressObj.postcode}, ${businessAddressObj.country}`}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">Store Description:</span>
              <p className="text-sm text-muted-foreground">{seller.storeDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <User className={iconClass} />
              <span className="font-semibold">Contact Person:</span> {seller.contactPerson}
            </div>
            <div>
              <Mail className={iconClass} />
              <span className="font-semibold">Email:</span> {seller.userEmail}
            </div>
            <div>
              <Phone className={iconClass} />
              <span className="font-semibold">Phone:</span> {seller.userPhone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {seller.bankDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Banknote className={iconClass} />
                <span className="font-semibold">Bank Name:</span> {seller.bankDetails.bankName}
              </div>
              <div>
                <span className="font-semibold">Account Name:</span> {seller.bankDetails.accountName}
              </div>
              <div>
                <span className="font-semibold">Account Number:</span> {seller.bankDetails.accountNumber}
              </div>
              <div>
                <span className="font-semibold">BSB:</span> {seller.bankDetails.bsb}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      {seller.kycDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>KYC Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seller.kycDocuments.map((doc: any, idx: number) => (
                <div key={idx} className="border rounded-lg overflow-hidden bg-muted/50">
                  {doc.documentUrl && (
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={doc.documentUrl}
                        alt={doc.originalName || "KYC Document"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <p className="font-semibold text-sm">{doc.documentType}</p>
                    <p className="text-xs text-muted-foreground truncate" title={doc.originalName}>
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                    {doc.documentUrl && (
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-block mt-2"
                      >
                        View Full Size
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Package className={iconClass} />
                <span className="font-semibold">Total Products:</span> {statistics.totalProducts}
              </div>
              <div>
                <Package className={iconClass} />
                <span className="font-semibold">Active Products:</span> {statistics.activeProducts}
              </div>
              <div>
                <Calendar className={iconClass} />
                <span className="font-semibold">Total Orders:</span> {statistics.totalOrders}
              </div>
              <div>
                <Calendar className={iconClass} />
                <span className="font-semibold">Pending Orders:</span> {statistics.pendingOrders}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Cultural Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seller.culturalApprovalStatus?.toLowerCase() === "approved" ? (
            <div className="space-y-4">
              <div>
                <Badge variant="default" className="mb-2">
                  <Check className="h-4 w-4 mr-1" /> Approved
                </Badge>
                <p>
                  <span className="font-semibold">Approved By:</span> {seller.culturalApprovalBy}
                </p>
                <p>
                  <span className="font-semibold">Approved At:</span>{" "}
                  {new Date(seller.culturalApprovalAt).toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Feedback:</span> {seller.culturalApprovalFeedback}
                </p>
              </div>
              {seller.culturalStory && (
                <div>
                  <span className="font-semibold">Cultural Story:</span>
                  <p className="text-sm text-muted-foreground">{seller.culturalStory}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {seller.culturalStory && (
                <div>
                  <span className="font-semibold">Cultural Story:</span>
                  <p className="text-sm text-muted-foreground">{seller.culturalStory}</p>
                </div>
              )}
              <div className="border p-4 rounded-md bg-muted/30 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">Approval Decision:</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cultural-approval"
                      checked={culturalApproval.approved === true}
                      onChange={() =>
                        setCulturalApproval({
                          approved: true,
                          feedback: culturalApproval.feedback || "Your Cultural is well Approved you can go live and sell your product",
                        })
                      }
                    />
                    <span>Approve</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cultural-approval"
                      checked={culturalApproval.approved === false}
                      onChange={() =>
                        setCulturalApproval({
                          approved: false,
                          feedback: culturalApproval.feedback || "Cultural approval denied. Please review your submission.",
                        })
                      }
                    />
                    <span>Reject</span>
                  </label>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Feedback Message:</label>
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    placeholder="Enter feedback message..."
                    value={culturalApproval.feedback}
                    onChange={(e) =>
                      setCulturalApproval({ ...culturalApproval, feedback: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCulturalApproval} className="w-full">
                  <Globe className="h-4 w-4 mr-2" /> Submit Cultural Approval
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {seller.status === "PENDING" && (
              <>
                <Button onClick={handleApprove} variant="default">
                  <Check className="h-4 w-4 mr-1" /> Approve Seller
                </Button>
                <Button onClick={handleReject} variant="destructive">
                  <X className="h-4 w-4 mr-1" /> Reject Seller
                </Button>
              </>
            )}
            {seller.status !== "ACTIVE" && (
              <Button onClick={handleActivate} variant="secondary">
                <Flag className="h-4 w-4 mr-1" /> Activate Seller
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
