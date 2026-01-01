import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, FileText, TrendingUp } from "lucide-react";

const reportStats = [
  {
    title: "Total Users",
    value: 1245,
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Total Revenue",
    value: "$32,500",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Reports Generated",
    value: 87,
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Growth",
    value: "+12.5%",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const sampleReports = [
  {
    id: "RPT-001",
    name: "Monthly Sales",
    date: "2025-12-01",
    status: "Completed",
    amount: "$12,000",
  },
  {
    id: "RPT-002",
    name: "User Growth",
    date: "2025-12-05",
    status: "Completed",
    amount: "$8,500",
  },
  {
    id: "RPT-003",
    name: "Refund Analysis",
    date: "2025-12-10",
    status: "Pending",
    amount: "$2,000",
  },
];

const ReportPage = () => {
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Overview and analytics of your reports.
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {reportStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-lg ${stat.bg} group-hover:bg-primary/10 transition-colors`}
                >
                  <Icon
                    className={`h-5 w-5 ${stat.color} group-hover:text-primary transition-colors`}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold mb-2">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "Completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPage;
