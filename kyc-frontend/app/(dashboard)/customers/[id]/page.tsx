"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCustomerById,
  getCustomerApplications,
  initiateKyc,
  Customer,
  KycApplication,
  getStatusColor,
  getStatusLabel,
} from "@/lib/api";
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  FileCheck,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const [customerData, appsData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerApplications(customerId),
      ]);
      setCustomer(customerData);
      setApplications(appsData);
    } catch (error) {
      console.error("Failed to fetch customer data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateKyc = async () => {
    setInitiating(true);
    try {
      const app = await initiateKyc(customerId);
      router.push(`/applications/${app.id}`);
    } catch (error) {
      console.error("Failed to initiate KYC", error);
    } finally {
      setInitiating(false);
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <Badge className="bg-green-500 hover:bg-green-600">Low Risk</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium Risk</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High Risk</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>;
      default:
        return <Badge variant="outline">Not Assessed</Badge>;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {customer.firstName} {customer.lastName}
              </h1>
              {getRiskBadge(customer.riskLevel)}
            </div>
            <p className="text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
          </Button>
          <Button onClick={handleInitiateKyc} disabled={initiating}>
            {initiating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Start KYC
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">NIK</p>
                <p className="font-mono">{customer.nik || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Citizenship</p>
                <p>{customer.citizenship || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p>{customer.dateOfBirth || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{customer.phoneNumber || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{customer.address || "-"}</p>
            {(customer.kelurahan || customer.kecamatan) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[customer.kelurahan, customer.kecamatan].filter(Boolean).join(", ")}
              </p>
            )}
            {(customer.kabupaten || customer.provinsi) && (
              <p className="text-sm text-muted-foreground">
                {[customer.kabupaten, customer.provinsi].filter(Boolean).join(", ")}
              </p>
            )}
            {customer.postalCode && (
              <p className="text-sm text-muted-foreground">{customer.postalCode}</p>
            )}
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Occupation</p>
              <p>{customer.occupation || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p>{customer.companyName || "-"}</p>
            </div>
            {customer.linkedinUrl && (
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <a
                  href={customer.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {customer.linkedinUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              {getRiskBadge(customer.riskLevel)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net Worth</span>
              <span className="font-semibold">{formatCurrency(customer.netWorth)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            KYC Applications
          </CardTitle>
          <CardDescription>
            {applications.length} application(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No KYC applications yet</p>
              <Button onClick={handleInitiateKyc} disabled={initiating}>
                {initiating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Start First KYC Application
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        app.status === "APPROVED"
                          ? "bg-green-100 text-green-600"
                          : app.status === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {app.status === "APPROVED" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : app.status === "REJECTED" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <FileCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Case ID: {app.caseId || `APP-${app.id}`}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={getStatusColor(app.status)}>
                        {getStatusLabel(app.status)}
                      </Badge>
                      {app.riskScore !== null && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Score: {app.riskScore}/100
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/applications/${app.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
