"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  checkAgentHealth,
  AgentHealthCheck,
  getCustomers,
  Customer,
} from "@/lib/api";
import { 
  Activity, 
  AlertTriangle, 
  Bot, 
  CheckCircle2, 
  Clock, 
  FileSearch, 
  Globe, 
  Loader2, 
  RefreshCw,
  Search,
  Server,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  XCircle
} from "lucide-react";

// Agent info type
interface AgentInfo {
  name: string;
  model: string;
  description: string;
  tools: string[];
}

interface ServiceInfo {
  service: string;
  version: string;
  description: string;
  agents: AgentInfo[];
  endpoints: Record<string, string>;
}

export default function ReportsPage() {
  const [agentHealth, setAgentHealth] = useState<AgentHealthCheck | null>(null);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch agent health and service info in parallel
      const [healthResult, customersResult] = await Promise.allSettled([
        checkAgentHealth(),
        getCustomers()
      ]);

      if (healthResult.status === 'fulfilled') {
        setAgentHealth(healthResult.value);
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value);
      }

      // Fetch service info
      try {
        const agentUrl = process.env.NEXT_PUBLIC_KYC_AGENT_URL;
        if (agentUrl) {
          const infoResponse = await fetch(`${agentUrl}/info`);
          if (infoResponse.ok) {
            const info = await infoResponse.json();
            setServiceInfo(info);
          }
        }
      } catch (e) {
        console.log("Service info fetch failed:", e);
      }

    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = async () => {
    setHealthLoading(true);
    try {
      const health = await checkAgentHealth();
      setAgentHealth(health);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  // Calculate statistics from customers
  const stats = {
    totalCustomers: customers.length,
    approvedToday: customers.filter(c => c.riskLevel === 'LOW').length,
    pendingReview: customers.filter(c => c.riskLevel === 'MEDIUM' || c.riskLevel === 'HIGH').length,
    highRisk: customers.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length,
  };

  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case "KYC_Manager":
        return <Bot className="h-5 w-5 text-blue-500" />;
      case "Document_Checker":
        return <FileSearch className="h-5 w-5 text-green-500" />;
      case "Resume_Crosschecker":
        return <User className="h-5 w-5 text-purple-500" />;
      case "External_Search":
        return <Globe className="h-5 w-5 text-orange-500" />;
      case "Wealth_Calculator":
        return <Wallet className="h-5 w-5 text-emerald-500" />;
      case "Sanctions_Screener":
        return <Shield className="h-5 w-5 text-red-500" />;
      default:
        return <Bot className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">KYC Agent Service monitoring</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            KYC Agent Service monitoring and statistics
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Clean profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              Flagged cases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agent Status
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Activity className="h-4 w-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="service">
            <Server className="h-4 w-4 mr-2" />
            Service Info
          </TabsTrigger>
        </TabsList>

        {/* Agent Status Tab */}
        <TabsContent value="agents" className="space-y-4">
          {/* Agent Health Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    KYC Agent Service Status
                  </CardTitle>
                  <CardDescription>
                    {process.env.NEXT_PUBLIC_KYC_AGENT_URL || 'Agent URL not configured'}
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={refreshHealth}
                  disabled={healthLoading}
                >
                  {healthLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {agentHealth ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {agentHealth.status === "ok" ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {agentHealth.status === "ok" ? "Healthy" : "Unhealthy"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {agentHealth.service}
                      </p>
                    </div>
                  </div>
                  <Badge variant={agentHealth.status === "ok" ? "default" : "destructive"}>
                    {agentHealth.status.toUpperCase()}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Unable to connect to agent service</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Team Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Team</CardTitle>
              <CardDescription>
                Multi-agent KYC verification workflow powered by Google ADK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(serviceInfo?.agents || [
                  { name: "KYC_Manager", model: "gemini-2.0-flash", description: "Root orchestrator", tools: ["BigQuery", "CaseIdGenerator"] },
                  { name: "Document_Checker", model: "gemini-1.5-pro", description: "Document verification", tools: ["DocumentAnalysis"] },
                  { name: "Resume_Crosschecker", model: "gemini-2.0-flash", description: "Employment verification", tools: ["GoogleSearch"] },
                  { name: "External_Search", model: "gemini-2.0-flash", description: "Adverse media screening", tools: ["GoogleSearch", "SanctionsScreening"] },
                  { name: "Wealth_Calculator", model: "gemini-2.0-flash", description: "Wealth verification", tools: ["WealthCalculation"] },
                ]).map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {getAgentIcon(agent.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{agent.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {agent.model}
                        </Badge>
                        {agent.tools.map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification Workflow</CardTitle>
              <CardDescription>
                How the multi-agent system processes KYC applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Database Check</h4>
                    <p className="text-sm text-muted-foreground">
                      KYC Manager queries BigQuery to check if customer already has a verified profile.
                      If found, returns existing risk score immediately.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Document Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Document Checker (Gemini 1.5 Pro multimodal) analyzes KTP and bank statements
                      for authenticity and cross-references data.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Employment Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Resume Crosschecker uses Google Search Grounding to verify employment
                      claims on LinkedIn and company websites.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Adverse Media & PEP Screening</h4>
                    <p className="text-sm text-muted-foreground">
                      External Search agent scans news sources for fraud, scandals, PEP status,
                      and sanctions list matches with citation requirements.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Wealth Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Wealth Calculator analyzes bank statements to estimate income,
                      verify source of wealth, and flag unusual patterns.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    6
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Risk Aggregation (HITL)</h4>
                    <p className="text-sm text-muted-foreground">
                      KYC Manager aggregates all findings into a risk score. 
                      <span className="font-medium text-green-600"> Low risk (&lt;20) → Auto-approve. </span>
                      <span className="font-medium text-yellow-600"> Higher risk → Human review queue. </span>
                      <span className="font-medium text-red-600"> Never auto-reject.</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Score Guide</CardTitle>
              <CardDescription>How risk scores are calculated and interpreted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Finding</TableHead>
                    <TableHead>Risk Points</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Document verification failed</TableCell>
                    <TableCell><Badge variant="destructive">+50</Badge></TableCell>
                    <TableCell>HIGH</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employment discrepancy</TableCell>
                    <TableCell><Badge className="bg-orange-500">+30</Badge></TableCell>
                    <TableCell>MEDIUM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Adverse media found</TableCell>
                    <TableCell><Badge variant="destructive">+100</Badge></TableCell>
                    <TableCell>CRITICAL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>PEP status detected</TableCell>
                    <TableCell><Badge className="bg-orange-500">+50</Badge></TableCell>
                    <TableCell>HIGH</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sanctions match</TableCell>
                    <TableCell><Badge variant="destructive">+200</Badge></TableCell>
                    <TableCell>CRITICAL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Wealth verification failed</TableCell>
                    <TableCell><Badge className="bg-yellow-500">+40</Badge></TableCell>
                    <TableCell>MEDIUM</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Info Tab */}
        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Configuration</CardTitle>
              <CardDescription>
                Technical details about the KYC Agent Service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Deployment</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Platform:</span> Google Cloud Run</p>
                      <p><span className="text-muted-foreground">Region:</span> us-central1</p>
                      <p><span className="text-muted-foreground">URL:</span> {process.env.NEXT_PUBLIC_KYC_AGENT_URL || 'Not configured'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Version</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Service:</span> {serviceInfo?.service || "KYC Agent Service"}</p>
                      <p><span className="text-muted-foreground">Version:</span> {serviceInfo?.version || "2.0.0"}</p>
                      <p><span className="text-muted-foreground">Framework:</span> Google ADK + FastAPI</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">API Endpoints</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><code>/</code></TableCell>
                        <TableCell><Badge variant="outline">GET</Badge></TableCell>
                        <TableCell>Health check</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/info</code></TableCell>
                        <TableCell><Badge variant="outline">GET</Badge></TableCell>
                        <TableCell>Service information</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/analyze</code></TableCell>
                        <TableCell><Badge>POST</Badge></TableCell>
                        <TableCell>Full KYC analysis</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/analyze/quick</code></TableCell>
                        <TableCell><Badge>POST</Badge></TableCell>
                        <TableCell>Quick risk assessment</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Google Cloud Services</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Vertex AI API</Badge>
                    <Badge variant="secondary">BigQuery API</Badge>
                    <Badge variant="secondary">Google Search Grounding</Badge>
                    <Badge variant="secondary">Gemini 2.0 Flash</Badge>
                    <Badge variant="secondary">Gemini 1.5 Pro</Badge>
                    <Badge variant="secondary">Cloud Run</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
