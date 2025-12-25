"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadKycDocument } from "@/lib/api";
import { Loader2, ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function UploadDocumentPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);
    const { toast } = useToast();

    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<string>("KTP_FRONT");
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            await uploadKycDocument(applicationId, file, docType as any);
            toast({
                title: "Upload Successful",
                description: `${file.name} has been uploaded.`,
            });
            // Redirect back to application details
            router.push(`/applications/${applicationId}`);
        } catch (error) {
            console.error("Upload failed", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "Could not upload document. Please try again.",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/applications/${applicationId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Upload Document</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Document</CardTitle>
                    <CardDescription>
                        Upload supporting documents for KYC verification.
                        Supported formats: JPG, PNG, PDF (Max 5MB).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="type">Document Type</Label>
                            <Select value={docType} onValueChange={setDocType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KTP_FRONT">KTP (Front)</SelectItem>
                                    <SelectItem value="KTP_BACK">KTP (Back)</SelectItem>
                                    <SelectItem value="PASSPORT">Passport</SelectItem>
                                    <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                                    <SelectItem value="NPWP">Tax Document (NPWP)</SelectItem>
                                    <SelectItem value="SELFIE_WITH_KTP">Selfie with ID</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file">File</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                <Input
                                    id="file"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Label htmlFor="file" className="cursor-pointer w-full h-full flex flex-col items-center">
                                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                                    {file ? (
                                        <span className="text-sm font-medium text-primary">{file.name}</span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Click to browse or drag file here</span>
                                    )}
                                </Label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={!file || uploading}>
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
