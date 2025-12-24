"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { Settings as SettingsIcon, User, Bell, Shield, Server } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      <div className="grid gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role || ""} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.userId?.toString() || ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Agent Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              KYC Agent Service
            </CardTitle>
            <CardDescription>Google ADK Agent configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agent Service URL</Label>
              <Input
                value={process.env.NEXT_PUBLIC_KYC_AGENT_URL || 'Not configured'}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Cloud Run endpoint for the Google ADK multi-agent system
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Sub-Agents</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Document_Checker</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Resume_Crosschecker</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>External_Search</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Wealth_Calculator</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch disabled />
            </div>
            <Separator />
            <div>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about KYC applications
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Review Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when applications need manual review
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Risk Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Immediate notification for high-risk customers
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
