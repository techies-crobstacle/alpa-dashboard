"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://alpa-be.onrender.com";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type RefundRequest = {
  id: any;
  orderId: any;
  requestType: any; // FULL_REFUND | PARTIAL_REFUND
  reason: any;
  status: any; // OPEN | IN_PROGRESS | RESOLVED | CLOSED
  adminResponse?: any;
  createdAt: any;
  updatedAt?: any;
};

const REFUND_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const getTicketStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toUpperCase()) {
    case "OPEN": return "secondary";
    case "IN_PROGRESS": return "default";
    case "RESOLVED": return "default";
    case "CLOSED": return "outline";
    default: return "secondary";
  }
};

const getTicketStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN": return <Clock className="h-4 w-4" />;
    case "IN_PROGRESS": return <RefreshCw className="h-4 w-4" />;
    case "RESOLVED": return <CheckCircle2 className="h-4 w-4" />;
    case "CLOSED": return <XCircle className="h-4 w-4" />;
    default: return <ClipboardList className="h-4 w-4" />;
  }
};

const RefundTicketProgressTracker = ({ status }: { status: string }) => {
  const statusStr = (status || "").toUpperCase();
  const currentIndex = REFUND_TICKET_STATUSES.indexOf(statusStr);

  const icons: Record<string, React.ReactNode> = {
    OPEN: <Clock className="h-5 w-5" />,
    IN_PROGRESS: <RefreshCw className="h-5 w-5" />,
    RESOLVED: <CheckCircle2 className="h-5 w-5" />,
    CLOSED: <XCircle className="h-5 w-5" />,
  };
  const labels: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Review",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted -z-10 mx-6">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: currentIndex >= 0 ? `${(currentIndex / (REFUND_TICKET_STATUSES.length - 1)) * 100}%` : "0%" }}
          />
        </div>
        {REFUND_TICKET_STATUSES.map((s, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={s} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
              >
                {icons[s]}
              </div>
              <span className={`text-xs font-medium text-center ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {labels[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="p-6 max-w-4xl mx-auto space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function RefundRequestsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, RefundRequest>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/refund-requests`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setRequests(data.requests || data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load refund requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (requestId: string) => {
    if (details[requestId]) {
      setExpandedId(expandedId === requestId ? null : requestId);
      return;
    }
    setDetailLoading(requestId);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/refund-requests/${requestId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      const detail = data.request || data;
      setDetails((prev) => ({ ...prev, [requestId]: detail }));
      setExpandedId(requestId);
    } catch (err: any) {
      toast.error("Failed to load request details.");
    } finally {
      setDetailLoading(null);
    }
  };

  const handleToggle = (requestId: string) => {
    if (expandedId === requestId) {
      setExpandedId(null);
    } else {
      fetchDetail(requestId);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Refund Requests</h1>
          <p className="text-muted-foreground">Track the status of your refund and return requests.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/customerdashboard/orders"}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <ClipboardList className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <p className="text-lg font-semibold">No refund requests yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                When you submit a refund or return request, it will appear here.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = "/customerdashboard/orders"}>
              Go to My Orders
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const detail = details[req.id];
            const statusStr = (req.status || "").toUpperCase();

            return (
              <Card key={req.id} className="overflow-hidden">
                {/* Request Summary Row */}
                <CardContent className="p-0">
                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Ticket Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          Request #{typeof req.id === "string" ? req.id.slice(-8).toUpperCase() : req.id}
                        </span>
                        <Badge variant={getTicketStatusBadgeVariant(statusStr)} className="flex items-center gap-1">
                          {getTicketStatusIcon(statusStr)}
                          {statusStr}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {req.requestType === "FULL_REFUND" ? "Full Refund" : "Partial Refund"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: #{typeof req.orderId === "string" ? req.orderId.slice(-6).toUpperCase() : req.orderId}
                        {" · "}
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">{req.reason || "No reason provided."}</p>
                    </div>

                    {/* Right: Expand Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(req.id)}
                      disabled={detailLoading === req.id}
                      className="shrink-0"
                    >
                      {detailLoading === req.id ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : isExpanded ? (
                        <><ChevronUp className="h-4 w-4 mr-1" /> Hide Details</>
                      ) : (
                        <><ChevronDown className="h-4 w-4 mr-1" /> View Details</>
                      )}
                    </Button>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-6 space-y-6">
                      {/* Progress Tracker */}
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Request Progress
                        </p>
                        <RefundTicketProgressTracker status={(detail || req).status} />
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Request ID</p>
                          <p className="font-medium text-sm mt-1">
                            {typeof (detail || req).id === "string"
                              ? (detail || req).id
                              : String((detail || req).id)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                          <p className="font-medium text-sm mt-1">
                            #{typeof (detail || req).orderId === "string"
                              ? (detail || req).orderId.slice(-6).toUpperCase()
                              : (detail || req).orderId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Refund Type</p>
                          <p className="font-medium text-sm mt-1">
                            {(detail || req).requestType === "FULL_REFUND" ? "Full Refund" : "Partial Refund"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Submitted On</p>
                          <p className="font-medium text-sm mt-1">
                            {(detail || req).createdAt
                              ? new Date((detail || req).createdAt).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                        {(detail || req).updatedAt && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                            <p className="font-medium text-sm mt-1">
                              {new Date((detail || req).updatedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Reason</p>
                        <div className="rounded-lg border bg-background p-3 text-sm">
                          {(detail || req).reason || "No reason provided."}
                        </div>
                      </div>

                      {/* Admin Response */}
                      {(detail || req).adminResponse ? (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Admin Response</p>
                          <div className="rounded-lg border-l-4 border-primary bg-background p-3 text-sm">
                            {(detail || req).adminResponse}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>No admin response yet. Our team is reviewing your request.</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
