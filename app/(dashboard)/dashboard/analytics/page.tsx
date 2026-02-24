"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// --- Export Sales API Helper ---
// const exportSales = async (params: {
//   reportType: string;
//   startDate: string;
//   endDate: string;
// }) => {
//   const BASE_URL = "https://alpa-be-1.onrender.com";
//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWppZjNrOTEwMDAyd296eDdma3BidWhxIiwidXNlclR5cGUiOiJzZWxsZXIiLCJyb2xlIjoiU0VMTEVSIiwiaWF0IjoxNzY2NDg0NTEzLCJleHAiOjE3NjkwNzY1MTN9.Y82RBMLKkta1bb1Lj7ZsWjKdHky4AwQe1lg80_yjjCk";
//   const res = await fetch(
//     `${BASE_URL}/api/seller/orders/export-sales?reportType=${params.reportType}&startDate=${params.startDate}&endDate=${params.endDate}`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
//   return res.json();
// };
import {
  
  BarChart3,
  
  Download,
  Filter,
  Calendar,
  
} from "lucide-react";

const BASE_URL = "https://alpa-be-1.onrender.com";
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

type Analytics = {
  monthlySales?: number[];
  topProducts?: Array<{
    productId: string;
    title: string;
    quantitySold: number;
    revenue: number;
  }>;
  period?: {
    startDate?: string;
    endDate?: string;
  };
  totalRevenue?: number;
  totalOrders?: number;
  totalItemsSold?: number;
  averageOrderValue?: number;
  statusBreakdown?: Record<string, number>;
};
type ExportRow = Record<string, string | number | null | undefined>;

export default function AnalyticsPage() {
  // All hooks at top level
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportParams, setExportParams] = useState({
    reportType: "summary",
    startDate: "",
    endDate: "",
  });
  const [exportData] = useState<ExportRow[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showExportFilters, setShowExportFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  // Example monthly sales data (replace with real data if available)
  const monthlySales = analytics?.monthlySales || [3200, 6100, 5400, 3700, 4200, 3500, 2100, 3900, 4700, 4700, 1300, 4800];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/seller/orders/analytics`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setAnalytics(data.analytics || null);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportLoading(true);
    setExportError("");
    try {
      const params = { ...exportParams, endDate: exportParams.endDate };
      const BASE_URL = "https://alpa-be-1.onrender.com";
      const url = `${BASE_URL}/api/seller/orders/export-sales?reportType=${params.reportType}&startDate=${params.startDate}&endDate=${params.endDate}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setExportError("Failed to fetch export data.");
        setExportLoading(false);
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `sales_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      setExportError("");
    } catch {
      setExportError("Failed to fetch export data.");
    } finally {
      setExportLoading(false);
    }
  };
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <BarChart3 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );

  if (!analytics)
    return (
      <div className="p-8 text-center text-muted-foreground">
        No analytics data found.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Tabs Carousel */}
      {/* <div className="flex gap-2 mb-4">
        {[
          { key: "overview", label: "Overview" },
          { key: "analysis", label: "Analysis" },
          { key: "report", label: "Report" },
          { key: "orderStatus", label: "Order Status" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div> */}
      {/* Export Sales Data Button and Filters */}
      

      {/* Exported Sales Table */}
      {exportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exported Sales Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Detect summary format by checking for 'Product Title' and 'Total Quantity Sold' */}
              {exportData[0] && "Total Quantity Sold" in exportData[0] ? (
                <table className="min-w-full text-sm border rounded-lg bg-background">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-4">Product ID</th>
                      <th className="py-2 px-4">Product Title</th>
                      <th className="py-2 px-4">Total Quantity Sold</th>
                      <th className="py-2 px-4">Number of Orders</th>
                      <th className="py-2 px-4">Total Revenue</th>
                      <th className="py-2 px-4">Average Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.map((row, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-2 px-4">{row["Product ID"]}</td>
                        <td className="py-2 px-4">{row["Product Title"]}</td>
                        <td className="py-2 px-4">
                          {row["Total Quantity Sold"]}
                        </td>
                        <td className="py-2 px-4">{row["Number of Orders"]}</td>
                        <td className="py-2 px-4">{row["Total Revenue"]}</td>
                        <td className="py-2 px-4">
                          {row["Average Order Value"]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full text-sm border rounded-lg bg-background">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-4">Order ID</th>
                      <th className="py-2 px-4">Order Date</th>
                      <th className="py-2 px-4">Product Title</th>
                      <th className="py-2 px-4">Product ID</th>
                      <th className="py-2 px-4">Quantity Sold</th>
                      <th className="py-2 px-4">Unit Price</th>
                      <th className="py-2 px-4">Total Amount</th>
                      <th className="py-2 px-4">Order Status</th>
                      <th className="py-2 px-4">Payment Method</th>
                      <th className="py-2 px-4">Customer Name</th>
                      <th className="py-2 px-4">Customer Phone</th>
                      <th className="py-2 px-4">Customer Email</th>
                      <th className="py-2 px-4">Shipping Address</th>
                      <th className="py-2 px-4">Shipping City</th>
                      <th className="py-2 px-4">Shipping State</th>
                      <th className="py-2 px-4">Shipping Pincode</th>
                      <th className="py-2 px-4">Tracking Number</th>
                      <th className="py-2 px-4">Estimated Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.map((row, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-2 px-4">{row["Order ID"]}</td>
                        <td className="py-2 px-4">{row["Order Date"]}</td>
                        <td className="py-2 px-4">{row["Product Title"]}</td>
                        <td className="py-2 px-4">{row["Product ID"]}</td>
                        <td className="py-2 px-4">{row["Quantity Sold"]}</td>
                        <td className="py-2 px-4">{row["Unit Price"]}</td>
                        <td className="py-2 px-4">{row["Total Amount"]}</td>
                        <td className="py-2 px-4">{row["Order Status"]}</td>
                        <td className="py-2 px-4">{row["Payment Method"]}</td>
                        <td className="py-2 px-4">{row["Customer Name"]}</td>
                        <td className="py-2 px-4">{row["Customer Phone"]}</td>
                        <td className="py-2 px-4">{row["Customer Email"]}</td>
                        <td className="py-2 px-4">{row["Shipping Address"]}</td>
                        <td className="py-2 px-4">{row["Shipping City"]}</td>
                        <td className="py-2 px-4">{row["Shipping State"]}</td>
                        <td className="py-2 px-4">{row["Shipping Pincode"]}</td>
                        <td className="py-2 px-4">{row["Tracking Number"]}</td>
                        <td className="py-2 px-4">
                          {row["Estimated Delivery"]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            View detailed analytics and insights about your business
            performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {analytics.period?.startDate} - {analytics.period?.endDate}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue}</div>
            <div className="text-xs text-muted-foreground mt-1">+20.1% from last month</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">+19% from last month</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Total Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalItemsSold}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.averageOrderValue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Sales Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 flex items-end gap-2 p-4 bg-background rounded-lg border">
            {monthlySales.map((sales: number, idx: number) => {
              // Calculate max for scaling
              const maxSales = Math.max(...monthlySales);
              const barHeight = (sales / maxSales) * 180;
              return (
                <div key={monthLabels[idx]} className="flex flex-col items-center justify-end" style={{ width: 32 }}>
                  <div
                    className="bg-primary rounded-md"
                    style={{ height: `${barHeight}px`, width: "24px" }}
                  ></div>
                  <span className="text-xs mt-2 text-muted-foreground">{monthLabels[idx]}</span>
                  <span className="text-xs text-muted-foreground">${sales}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

{/* Export Sales Data */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Export Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap gap-4 items-end"
            onSubmit={handleExport}
          >
            <div>
              <Label className="mb-2" htmlFor="reportType">
                Report Type
              </Label>
              <Input
                id="reportType"
                value={exportParams.reportType}
                onChange={(e) =>
                  setExportParams((p) => ({ ...p, reportType: e.target.value }))
                }
                className="min-w-[120px]"
                placeholder="summary"
                // required
              />
            </div>
            <div>
              <Label className="mb-2" htmlFor="startDate">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={exportParams.startDate}
                onChange={(e) =>
                  setExportParams((p) => ({ ...p, startDate: e.target.value }))
                }
                // required
              />
            </div>
            <div>
              <Label className="mb-2" htmlFor="endDate">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={exportParams.endDate}
                onChange={(e) =>
                  setExportParams((p) => ({ ...p, endDate: e.target.value }))
                }
                // required
              />
            </div>
            <Button
              type="submit"
              disabled={exportLoading}
              className="h-10 px-6"
            >
              {exportLoading ? "Exporting..." : "Export"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-6 ml-2"
              onClick={() =>
                setExportParams({ reportType: "", startDate: "", endDate: "" })
              }
              disabled={exportLoading}
            >
              Clear Filters
            </Button>
          </form>
          {exportError && (
            <div className="text-red-600 mt-2 font-medium">{exportError}</div>
          )}
        </CardContent>
      </Card> */}

<Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Export Sales Data</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportFilters((v) => !v)}
              type="button"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showExportFilters ? "Hide Filters" : "Add Filters"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              disabled={exportLoading}
              type="button"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? "Exporting..." : "Export Sales Data"}
            </Button>
          </div>
        </CardHeader>
        {showExportFilters && (
          <CardContent>
            <form className="flex flex-wrap gap-4 items-end" onSubmit={handleExport}>
              <div>
                <Label className="mb-2" htmlFor="reportType">
                  Report Type
                </Label>
                <Input
                  id="reportType"
                  value={exportParams.reportType}
                  onChange={(e) =>
                    setExportParams((p) => ({ ...p, reportType: e.target.value }))
                  }
                  className="min-w-[120px]"
                  placeholder="summary"
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="startDate">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportParams.startDate}
                  onChange={(e) =>
                    setExportParams((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="endDate">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportParams.endDate}
                  onChange={(e) =>
                    setExportParams((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={exportLoading}
                className="h-10 px-6"
              >
                {exportLoading ? "Exporting..." : "Export"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-6 ml-2"
                onClick={() =>
                  setExportParams({ reportType: "summary", startDate: "", endDate: "" })
                }
                disabled={exportLoading}
              >
                Clear Filters
              </Button>
            </form>
            {exportError && (
              <div className="text-red-600 mt-2 font-medium">{exportError}</div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          {Object.entries(analytics.statusBreakdown || {}).map(
            ([status, count]) => (
              <div key={status} className="flex flex-col items-center">
                <Badge variant="secondary" className="mb-1">
                  {status}
                </Badge>
                <span className="text-lg font-semibold">{String(count)}</span>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Product</th>
                  <th className="py-2 px-4 text-left">Quantity Sold</th>
                  <th className="py-2 px-4 text-left">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts?.map((product) => (
                  <tr key={product.productId} className="border-b">
                    <td className="py-2 px-4">{product.title}</td>
                    <td className="py-2 px-4">{product.quantitySold}</td>
                    <td className="py-2 px-4">${product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
