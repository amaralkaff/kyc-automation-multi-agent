"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getApplicationDetails,
  submitKyc,
  KycApplication,
  getStatusColor,
  getStatusLabel,
  getRiskLevel,
} from "@/lib/api";
import {
  ArrowLeft,
  FileCheck,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Search,
  Brain,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = Number(params.id);

  const [application, setApplication] = useState<KycApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    try {
      const data = await getApplicationDetails(applicationId);
      setApplication(data);
    } catch (error) {
      console.error("Failed to fetch application", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const updated = await submitKyc(applicationId);
      setApplication(updated);
    } catch (error) {
      console.error("Failed to submit application", error);
    } finally {
      setSubmitting(false);
    }
  };

  const parseJsonSafe = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return json;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  const risk = getRiskLevel(application.riskScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/applications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {application.caseId || `Application #${application.id}`}
              </h1>
              <Badge className={getStatusColor(application.status)}>
                {getStatusLabel(application.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created: {new Date(application.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {application.status === "DRAFT" && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/applications/${application.id}/upload`}>
                <FileText className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Submit for Review
            </Button>
          </div>
        )}
      </div>

      {/* Readiness Checklist */}
      {application.status === "DRAFT" && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Application Readiness</CardTitle>
            <CardDescription>Complete these steps to ensure a high-confidence AI analysis.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              {application.customer?.linkedinUrl ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-400 h-5 w-5" />}
              <span className={application.customer?.linkedinUrl ? "font-medium" : "text-muted-foreground"}>LinkedIn Profile (Found)</span>
            </div>
            <div className="flex items-center gap-2">
              {application.documents?.some(d => d.documentType === 'KTP_FRONT' || d.documentType === 'PASSPORT') ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-400 h-5 w-5" />}
              <span className={application.documents?.some(d => d.documentType === 'KTP_FRONT' || d.documentType === 'PASSPORT') ? "font-medium" : "text-muted-foreground"}>ID Document (Uploaded)</span>
            </div>
            <div className="flex items-center gap-2">
              {application.documents?.some(d => d.documentType === 'BANK_STATEMENT') ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-400 h-5 w-5" />}
              <span className={application.documents?.some(d => d.documentType === 'BANK_STATEMENT') ? "font-medium" : "text-muted-foreground"}>Bank Statement (Uploaded)</span>
            </div>
            <div className="flex items-center gap-2">
              {application.customer?.companyName ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-400 h-5 w-5" />}
              <span className={application.customer?.companyName ? "font-medium" : "text-muted-foreground"}>Company Name (Verified)</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Risk Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={`text-4xl font-bold ${risk.color === "green"
                  ? "text-green-600"
                  : risk.color === "yellow"
                    ? "text-yellow-600"
                    : "text-red-600"
                  }`}
              >
                {application.riskScore ?? "N/A"}
              </div>
              <div>
                <Badge
                  className={
                    risk.color === "green"
                      ? "bg-green-500"
                      : risk.color === "yellow"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }
                >
                  {risk.level}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PEP Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PEP Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {application.pepMatch ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <span className="text-red-600 font-semibold">Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-green-600 font-semibold">Clear</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sanctions Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sanctions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {application.sanctionsMatch ? (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-600 font-semibold">Match Found</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-green-600 font-semibold">Clear</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Agent Results */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="document">Document Check</TabsTrigger>
          <TabsTrigger value="resume">Resume Check</TabsTrigger>
          <TabsTrigger value="external">External Search</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="wealth">Wealth Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Admin Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {application.adminComments || "No comments yet"}
                </p>
                {application.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{application.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Review */}
            <Card>
              <CardHeader>
                <CardTitle>Review Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Requires Manual Review</span>
                  <Badge variant={application.requiresManualReview ? "destructive" : "secondary"}>
                    {application.requiresManualReview ? "Yes" : "No"}
                  </Badge>
                </div>
                {application.reviewedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviewed By</span>
                    <span className="text-sm font-medium">{application.reviewedBy}</span>
                  </div>
                )}
                {application.reviewedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviewed At</span>
                    <span className="text-sm">{new Date(application.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Checker Results
              </CardTitle>
              <CardDescription>ID document verification and authenticity check</CardDescription>
            </CardHeader>
            <CardContent>
              {application.documentCheckerResult ? (
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(parseJsonSafe(application.documentCheckerResult), null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No document check results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Resume Crosschecker Results
              </CardTitle>
              <CardDescription>Employment and background verification via web search</CardDescription>
            </CardHeader>
            <CardContent>
              {application.resumeCrosscheckerResult ? (
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(parseJsonSafe(application.resumeCrosscheckerResult), null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No resume check results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                External Search Results
              </CardTitle>
              <CardDescription>PEP, sanctions, and adverse media screening</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">PEP Match</p>
                  <Badge variant={application.pepMatch ? "destructive" : "secondary"}>
                    {application.pepMatch ? "Found" : "Clear"}
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sanctions</p>
                  <Badge variant={application.sanctionsMatch ? "destructive" : "secondary"}>
                    {application.sanctionsMatch ? "Match" : "Clear"}
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Adverse Media</p>
                  <Badge variant={application.adverseMediaFound ? "destructive" : "secondary"}>
                    {application.adverseMediaFound ? "Found" : "Clear"}
                  </Badge>
                </div>
              </div>

              {application.externalSearchResult ? (
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(parseJsonSafe(application.externalSearchResult), null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No external search results yet</p>
              )}

              {application.adverseMediaSources && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Adverse Media Sources:</p>
                  <pre className="text-sm bg-red-50 p-4 rounded-md overflow-auto border border-red-200">
                    {JSON.stringify(parseJsonSafe(application.adverseMediaSources), null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Files associated with this application</CardDescription>
            </CardHeader>
            <CardContent>
              {application.documents && application.documents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {application.documents.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden">
                      <div className="p-4 flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold truncate" title={doc.fileName}>{doc.fileName}</p>
                          <Badge variant="outline" className="mt-1">
                            {doc.documentType.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-slate-50 px-4 py-3 border-t flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            View File <ArrowLeft className="h-3 w-3 rotate-180" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No documents uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wealth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Wealth Calculator Results
              </CardTitle>
              <CardDescription>Net worth analysis from financial documents</CardDescription>
            </CardHeader>
            <CardContent>
              {application.wealthCalculatorResult ? (
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(parseJsonSafe(application.wealthCalculatorResult), null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No wealth analysis results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
