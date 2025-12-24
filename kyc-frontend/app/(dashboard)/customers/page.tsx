"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCustomers, deleteCustomer, Customer } from "@/lib/api";
import { Loader2, Search, Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.firstName?.toLowerCase().includes(query) ||
            c.lastName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.nik?.includes(query) ||
            c.phoneNumber?.includes(query)
        )
      );
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Failed to delete customer", error);
    } finally {
      setDeleting(false);
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer data and KYC applications</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            {filteredCustomers.length} of {customers.length} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, NIK, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No customers match your search" : "No customers found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Net Worth</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                            {customer.firstName?.[0]}{customer.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                            <p className="text-xs text-muted-foreground">{customer.occupation || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.nik || "-"}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phoneNumber || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.kabupaten || "-"}</p>
                          <p className="text-xs text-muted-foreground">{customer.provinsi || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(customer.riskLevel)}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(customer.netWorth)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setCustomerToDelete(customer);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.firstName} {customerToDelete?.lastName}? 
              This action cannot be undone and will also delete all associated KYC applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
