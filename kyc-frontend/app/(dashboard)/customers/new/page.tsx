"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCustomer, CreateCustomerRequest, Citizenship } from "@/lib/api";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    nik: "",
    citizenship: "WNI",
    phoneNumber: "",
    address: "",
    kelurahan: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    postalCode: "",
    occupation: "",
    companyName: "",
    linkedinUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate NIK format for WNI
      if (formData.citizenship === "WNI" && formData.nik.length !== 16) {
        setError("NIK must be 16 digits for Indonesian citizens");
        setLoading(false);
        return;
      }

      const customer = await createCustomer(formData);
      router.push(`/customers/${customer.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Customer</h1>
          <p className="text-muted-foreground">Register a new customer for KYC verification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+6281234567890"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citizenship">Citizenship *</Label>
                <Select
                  value={formData.citizenship}
                  onValueChange={(value) => updateField("citizenship", value as Citizenship)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WNI">WNI (Warga Negara Indonesia)</SelectItem>
                    <SelectItem value="WNA">WNA (Warga Negara Asing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">
                  {formData.citizenship === "WNI" ? "NIK (Nomor Induk Kependudukan) *" : "Passport Number"}
                </Label>
                <Input
                  id="nik"
                  placeholder={formData.citizenship === "WNI" ? "16 digit NIK" : "Passport number"}
                  value={formData.nik}
                  onChange={(e) => updateField("nik", e.target.value)}
                  maxLength={formData.citizenship === "WNI" ? 16 : undefined}
                  required={formData.citizenship === "WNI"}
                />
                {formData.citizenship === "WNI" && (
                  <p className="text-xs text-muted-foreground">
                    {formData.nik.length}/16 digits
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Indonesian address format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Jl. Sudirman No. 123"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kelurahan">Kelurahan</Label>
                  <Input
                    id="kelurahan"
                    placeholder="Village/Sub-district"
                    value={formData.kelurahan}
                    onChange={(e) => updateField("kelurahan", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Input
                    id="kecamatan"
                    placeholder="District"
                    value={formData.kecamatan}
                    onChange={(e) => updateField("kecamatan", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                  <Input
                    id="kabupaten"
                    placeholder="Regency/City"
                    value={formData.kabupaten}
                    onChange={(e) => updateField("kabupaten", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provinsi">Provinsi</Label>
                  <Input
                    id="provinsi"
                    placeholder="Province"
                    value={formData.provinsi}
                    onChange={(e) => updateField("provinsi", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
              <CardDescription>Used for Resume Crosschecker verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="Software Engineer"
                    value={formData.occupation}
                    onChange={(e) => updateField("occupation", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="PT Example Indonesia"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedinUrl}
                    onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" asChild>
            <Link href="/customers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Customer
          </Button>
        </div>
      </form>
    </div>
  );
}
