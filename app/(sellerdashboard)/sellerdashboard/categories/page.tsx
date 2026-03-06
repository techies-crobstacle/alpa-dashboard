"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Clock, CheckCircle2, Package, Search, AlertCircle, RefreshCcw } from "lucide-react";

interface Category {
  categoryName: string;
  productCount?: number;    
  myProductCount?: number;
  isRequestedCategory?: boolean;
  requestedByMe?: boolean;
}

interface PendingRequest {
  id: string;
  categoryName: string;
  description: string;
  sampleProduct: string;
  requestedAt: string;
  status: string;
}

interface RejectedRequest {
  id: string;
  categoryName: string;
  rejectionMessage: string;
  rejectedAt: string;
  status: string;
}

interface CategoryResponse {
  success: boolean;
  data: {
    approvedCategories: Category[];
    myPendingRequests: PendingRequest[];
    myRejectedRequests: RejectedRequest[];
    totalCategories: number;
    totalMyPending: number;
  };
}

interface CategoryRequestForm {
  categoryName: string;
  description: string;
  sampleProduct: string;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<RejectedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<CategoryRequestForm>({
    defaultValues: {
      categoryName: "",
      description: "",
      sampleProduct: "",
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/categories/");
      
      if (response.success && response.data) {
        setCategories(response.data.approvedCategories || []);
        setPendingRequests(response.data.myPendingRequests || []);
        setRejectedRequests(response.data.myRejectedRequests || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryRequestForm) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient("/api/categories/request", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.success) {
        toast.success("Category request submitted successfully!");
        form.reset();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error submitting category request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit request";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view available product categories
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Request Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request New Category</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="categoryName"
                    rules={{ required: "Category name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Electronics"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    rules={{ required: "Description is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the category and its purpose..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sampleProduct"
                    rules={{ required: "Sample product is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Product *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Dining set"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Requests ({pendingRequests.length})
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your category requests awaiting approval
                </p>
              </div>
              <Card className="border-yellow-200 dark:border-yellow-900 overflow-hidden">
                <Table>
                  <TableHeader className="bg-yellow-50/50 dark:bg-yellow-950/20">
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Sample Product</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request, idx) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-semibold">{request.categoryName}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground text-xs">
                          {request.description}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded italic">
                            {request.sampleProduct}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(request.requestedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-none">
                            {request.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Rejected Requests Section */}
          {rejectedRequests.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Rejected Requests ({rejectedRequests.length})
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Requests that were not approved. You can fix and request again.
                </p>
              </div>
              <Card className="border-destructive/20 overflow-hidden">
                <Table>
                  <TableHeader className="bg-destructive/5">
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Rejection Feedback</TableHead>
                      <TableHead>Rejected On</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedRequests.map((request, idx) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-destructive">{request.categoryName}</TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 text-destructive/90 text-sm italic">
                            <span className="shrink-0 mt-1">"</span>
                            <span>{request.rejectionMessage}</span>
                            <span className="shrink-0 mt-1">"</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(request.rejectedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs gap-1.5 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              form.setValue("categoryName", request.categoryName);
                              setIsDialogOpen(true);
                            }}
                          >
                            <RefreshCcw className="w-3 h-3" />
                            Fix
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Available Categories Section */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Available Categories ({filteredCategories.length})
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Active categories you can use for your product listings
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {categories.length === 0 ? (
              <Card className="p-16 border-dashed flex flex-col items-center justify-center text-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No approved categories</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                  You haven't had any categories approved yet. Submit a request to get started.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request Now
                </Button>
              </Card>
            ) : filteredCategories.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <p className="text-muted-foreground">
                  No categories found matching "{searchQuery}"
                </p>
                <Button 
                  variant="ghost" 
                  className="mt-2"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </Card>
            ) : (
              <Card className="overflow-hidden border-muted-foreground/10 shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Status & Origin</TableHead>
                      <TableHead className="text-right pr-8">My Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category, index) => (
                      <TableRow key={index} className="hover:bg-muted/30 group">
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-bold text-base">{category.categoryName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 border-none text-[10px] uppercase">
                              Active
                            </Badge>
                            {category.requestedByMe && (
                              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] uppercase">
                                My Request
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge variant="outline" className="font-semibold text-primary border-primary/20 bg-primary/5">
                            {category.myProductCount || 0} Products
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriesPage;
