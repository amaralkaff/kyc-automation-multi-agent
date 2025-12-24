"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllApplications,
  KycApplication,
  KycStatus,
  getStatusColor,
  getStatusLabel,
  getRiskLevel,
} from "@/lib/api";
import { Loader2, Search, Eye, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchQuery, statusFilter, applications]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const allApps = await getAllApplications();
      setApplications(allApps);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.caseId?.toLowerCase().includes(query) ||
          app.customer?.firstName?.toLowerCase().includes(query) ||
          app.customer?.lastName?.toLowerCase().includes(query) ||
          app.customer?.nik?.includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApps(filtered);
  };

  const getStatusIcon = (status: KycStatus) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Applications</h1>
          <p className="text-muted-foreground">View and manage all KYC applications</p>
        </div>
        <Button onClick={fetchApplications} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            {filteredApps.length} application(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case ID, customer name, or NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ACTION_REQUIRED">Action Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No applications found</p>
              <p className="text-sm text-muted-foreground">
                Start by creating a customer and initiating their KYC application
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/customers">Go to Customers</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>PEP</TableHead>
                    <TableHead>Sanctions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => {
                    const risk = getRiskLevel(app.riskScore);
                    const customerName = app.customer 
                      ? `${app.customer.firstName} ${app.customer.lastName}` 
                      : "-";
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono">
                          {app.caseId || `APP-${app.id}`}
                        </TableCell>
                        <TableCell>{customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(app.status)}
                            <Badge className={getStatusColor(app.status)}>
                              {getStatusLabel(app.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {app.riskScore !== null ? (
                            <Badge
                              className={
                                risk.color === "green"
                                  ? "bg-green-500"
                                  : risk.color === "yellow"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }
                            >
                              {app.riskScore} - {risk.level}
                            </Badge>
                          ) : (
                            <Badge variant="outline">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={app.pepMatch ? "destructive" : "secondary"}>
                            {app.pepMatch ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={app.sanctionsMatch ? "destructive" : "secondary"}>
                            {app.sanctionsMatch ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/applications/${app.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
