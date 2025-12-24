"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getReviewQueue,
  approveApplication,
  rejectApplication,
  requestAdditionalInfo,
  KycApplication,
  getStatusColor,
  getStatusLabel,
} from "@/lib/api";
import { AlertTriangle, CheckCircle2, Clock, Eye, Loader2, RefreshCw, XCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ReviewPage() {
  const [pendingReviews, setPendingReviews] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const reviews = await getReviewQueue();
      setPendingReviews(reviews);
    } catch (error) {
      console.error("Failed to fetch pending reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: number) => {
    if (!reviewerName.trim()) {
      alert("Please enter your name");
      return;
    }
    setActionLoading(applicationId);
    try {
      await approveApplication(applicationId, reviewerName, comment || undefined);
      await fetchPendingReviews();
      setComment("");
    } catch (error) {
      console.error("Failed to approve", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!reviewerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }
    setActionLoading(applicationId);
    try {
      await rejectApplication(applicationId, rejectReason, reviewerName);
      await fetchPendingReviews();
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestInfo = async (applicationId: number) => {
    if (!reviewerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!comment.trim()) {
      alert("Please enter what information is needed");
      return;
    }
    setActionLoading(applicationId);
    try {
      await requestAdditionalInfo(applicationId, comment, reviewerName);
      await fetchPendingReviews();
      setComment("");
    } catch (error) {
      console.error("Failed to request info", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manual Review</h1>
          <p className="text-muted-foreground">Applications requiring human review</p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual Review Queue</h1>
          <p className="text-muted-foreground">
            Applications flagged for human-in-the-loop review by the ADK Agent
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reviewer:</span>
            <Input 
              placeholder="Your name"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={fetchPendingReviews} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PEP Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingReviews.filter((r) => r.pepMatch).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sanctions Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingReviews.filter((r) => r.sanctionsMatch).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Adverse Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingReviews.filter((r) => r.adverseMediaFound).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
          <CardDescription>
            Applications flagged by ADK Agent requiring manual decision
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-600 mb-2">All Clear!</p>
              <p className="text-muted-foreground">
                No applications currently require manual review.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                The ADK Agent will flag applications that need attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {review.caseId || `Application #${review.id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.customer?.firstName} {review.customer?.lastName}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {review.pepMatch && (
                          <Badge variant="destructive" className="text-xs">
                            PEP
                          </Badge>
                        )}
                        {review.sanctionsMatch && (
                          <Badge variant="destructive" className="text-xs">
                            Sanctions
                          </Badge>
                        )}
                        {review.adverseMediaFound && (
                          <Badge className="bg-yellow-500 text-xs">
                            Adverse Media
                          </Badge>
                        )}
                      </div>
                      {review.adminComments && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                          {review.adminComments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p className={`text-lg font-bold ${
                        (review.riskScore ?? 0) >= 50 ? 'text-red-600' : 
                        (review.riskScore ?? 0) >= 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {review.riskScore !== null ? review.riskScore : "N/A"}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/applications/${review.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                      
                      {/* Approve Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Application</DialogTitle>
                            <DialogDescription>
                              Confirm approval for {review.caseId || `Application #${review.id}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Optional comment..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                              className="bg-green-600"
                            >
                              {actionLoading === review.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Confirm Approval
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Reject Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Application</DialogTitle>
                            <DialogDescription>
                              Provide a reason for rejecting {review.caseId || `Application #${review.id}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Rejection reason (required)..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleReject(review.id)}
                              disabled={actionLoading === review.id}
                              variant="destructive"
                            >
                              {actionLoading === review.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Confirm Rejection
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Request Info Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Request Info
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Additional Information</DialogTitle>
                            <DialogDescription>
                              Specify what additional information is needed
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="What information do you need?..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleRequestInfo(review.id)}
                              disabled={actionLoading === review.id}
                            >
                              {actionLoading === review.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Send Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
