"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert
} from "lucide-react";
import { getCustomers, Customer } from "@/lib/api";
import Link from "next/link";

interface DashboardStats {
  totalCustomers: number;
  pendingReview: number;
  approved: number;
  highRiskCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    pendingReview: 0,
    approved: 0,
    highRiskCount: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const customers = await getCustomers();
      setRecentCustomers(customers.slice(0, 5));
      
      let highRisk = 0;
      customers.forEach((customer) => {
        if (customer.riskLevel === 'HIGH' || customer.riskLevel === 'CRITICAL') {
          highRisk++;
        }
      });

      setStats({
        totalCustomers: customers.length,
        pendingReview: 0,
        approved: 0,
        highRiskCount: highRisk,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">KYC Automation Overview</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Indonesian KYC Automation Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting manual review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">KYC verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
            <CardDescription>Latest registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customers yet</p>
              ) : (
                recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {customer.firstName?.[0]}{customer.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    {getRiskBadge(customer.riskLevel)}
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/customers">View All Customers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/customers/new">
                <Users className="mr-2 h-4 w-4" />
                Add New Customer
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/review">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Pending Applications
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/applications">
                <FileCheck className="mr-2 h-4 w-4" />
                View All Applications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
