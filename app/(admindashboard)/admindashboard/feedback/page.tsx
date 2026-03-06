"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search, Star, User, Package } from "lucide-react";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  name?: string;
  email?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  } | null;
  product?: {
    id: string;
    title: string;
  } | null;
  seller?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filtered, setFiltered] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const data = await api.get("/api/admin/feedback");
        const list: FeedbackItem[] = Array.isArray(data)
          ? data
          : data.feedbacks ?? data.feedback ?? data.data ?? [];
        setFeedbacks(list);
        setFiltered(list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load feedback";
        toast.error("Error", { description: msg });
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(feedbacks);
      return;
    }
    setFiltered(
      feedbacks.filter(
        (f) =>
          f.comment?.toLowerCase().includes(q) ||
          f.name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.user?.name?.toLowerCase().includes(q) ||
          f.user?.email?.toLowerCase().includes(q) ||
          f.product?.title?.toLowerCase().includes(q)
      )
    );
  }, [search, feedbacks]);

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
      : "—";

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-1">All customer feedback and ratings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : feedbacks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
              <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : avgRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Rating Breakdown</p>
            <div className="space-y-1">
              {ratingCounts.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-muted-foreground">{stars}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: feedbacks.length ? `${(count / feedbacks.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by user, product or comment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Feedback List */}
      {loading ? (
        <FeedbackSkeleton />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No feedback found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try adjusting your search." : "No feedback has been submitted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => (
            <Card key={fb.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Rating */}
                    <div className="flex items-center gap-3">
                      <StarRating rating={fb.rating} />
                      <Badge variant="outline" className="text-xs">
                        {fb.rating}/5
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {fb.createdAt
                          ? new Date(fb.createdAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>

                    {/* Comment */}
                    {fb.comment && (
                      <p className="text-sm text-foreground leading-relaxed">{fb.comment}</p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Name chip - only when name exists */}
                      {(fb.name || fb.user?.name) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          <User className="h-3 w-3" />
                          <span>{fb.name || fb.user?.name}</span>
                        </div>
                      )}
                      {/* Email chip */}
                      {(fb.email || fb.user?.email) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          <span className="font-mono">{fb.email || fb.user?.email}</span>
                        </div>
                      )}
                      {fb.product && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          <Package className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{fb.product.title}</span>
                        </div>
                      )}
                      {fb.seller && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          <User className="h-3 w-3" />
                          <span>Seller: {fb.seller.name || fb.seller.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
