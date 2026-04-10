'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings,
  Bell,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { OrchestrationMetrics, AgentPerformanceMetrics } from '../../types/orchestration';
import { AgentType } from '../../types/agents';
import MetricsChart from './MetricsChart';
import ComplianceReport from './ComplianceReport';
import ActivityLog from './ActivityLog';
import AlertsPanel from './AlertsPanel';

/**
 * Enterprise Governance Dashboard
 * Comprehensive monitoring, logging, and compliance dashboard for enterprise features
 */

interface GovernanceDashboardProps {
  orchestrationMetrics?: OrchestrationMetrics;
  agentPerformance?: AgentPerformanceMetrics[];
  className?: string;
}

interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  failedTasks: number;
  averageCompletionTime: number;
  systemUptime: number;
  activeAgents: number;
  totalAgents: number;
  complianceScore: number;
  securityScore: number;
  performanceScore: number;
  costEfficiency: number;
}

interface ComplianceMetric {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'warning' | 'non_compliant' | 'pending';
  score: number;
  lastChecked: Date;
  requirements: string[];
  violations: ComplianceViolation[];
}

interface ComplianceViolation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurredAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  resource: string;
  user: string;
  agent?: AgentType;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'warning';
  ipAddress?: string;
  userAgent?: string;
}

interface SecurityAlert {
  id: string;
  type: 'unauthorized_access' | 'suspicious_activity' | 'policy_violation' | 'system_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved';
  affectedResources: string[];
  assignedTo?: string;
  resolvedAt?: Date;
  response: string;
}

export default function GovernanceDashboard({ 
  orchestrationMetrics,
  agentPerformance = [],
  className = ''
}: GovernanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'activity' | 'performance' | 'security'>('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>();
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from APIs
      await Promise.all([
        loadMetrics(),
        loadComplianceData(),
        loadAuditLog(),
        loadSecurityAlerts()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Mock data - in production this would come from APIs
    setDashboardMetrics({
      totalTasks: 1247,
      completedTasks: 1098,
      activeTasks: 149,
      failedTasks: 23,
      averageCompletionTime: 8.4,
      systemUptime: 99.7,
      activeAgents: 5,
      totalAgents: 8,
      complianceScore: 94,
      securityScore: 97,
      performanceScore: 89,
      costEfficiency: 87
    });
  };

  const loadComplianceData = async () => {
    const mockCompliance: ComplianceMetric[] = [
      {
        id: 'gdpr',
        name: 'GDPR Compliance',
        description: 'General Data Protection Regulation compliance',
        status: 'compliant',
        score: 96,
        lastChecked: new Date(),
        requirements: ['Data encryption', 'Access controls', 'Audit logging', 'Data retention'],
        violations: []
      },
      {
        id: 'soc2',
        name: 'SOC 2 Type II',
        description: 'Service Organization Control 2 Type II compliance',
        status: 'warning',
        score: 88,
        lastChecked: new Date(),
        requirements: ['Security controls', 'Availability', 'Processing integrity', 'Confidentiality'],
        violations: [
          {
            id: 'soc2-001',
            severity: 'medium',
            description: 'Delayed security review for agent deployment',
            occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'in_progress',
            assignedTo: 'security-team'
          }
        ]
      },
      {
        id: 'iso27001',
        name: 'ISO 27001',
        description: 'Information security management system compliance',
        status: 'compliant',
        score: 92,
        lastChecked: new Date(),
        requirements: ['Information security policy', 'Risk management', 'Incident management'],
        violations: []
      },
      {
        id: 'hipaa',
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act compliance',
        status: 'non_compliant',
        score: 65,
        lastChecked: new Date(),
        requirements: ['PHI protection', 'Access controls', 'Audit trails', 'Breach notification'],
        violations: [
          {
            id: 'hipaa-001',
            severity: 'high',
            description: 'Insufficient PHI access logging for agent interactions',
            occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'open',
            assignedTo: 'compliance-team'
          }
        ]
      }
    ];
    
    setComplianceMetrics(mockCompliance);
  };

  const loadAuditLog = async () => {
    const mockAuditLog: AuditLogEntry[] = [
      {
        id: 'audit-001',
        timestamp: new Date(),
        action: 'agent_deployment',
        resource: 'custom_agent_001',
        user: 'admin@company.com',
        agent: AgentType.DEVELOPER,
        details: { version: '1.2.0', environment: 'production' },
        outcome: 'success',
        ipAddress: '192.168.1.100'
      },
      {
        id: 'audit-002',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        action: 'workflow_execution',
        resource: 'enterprise_dashboard_workflow',
        user: 'system',
        agent: AgentType.DESIGNER,
        details: { taskId: 'task_12345', duration: 450000 },
        outcome: 'success'
      },
      {
        id: 'audit-003',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        action: 'security_scan',
        resource: 'agent_runtime_environment',
        user: 'security-service',
        details: { scanType: 'vulnerability', findings: 0 },
        outcome: 'success'
      }
    ];
    
    setAuditLog(mockAuditLog);
  };

  const loadSecurityAlerts = async () => {
    const mockAlerts: SecurityAlert[] = [
      {
        id: 'alert-001',
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Unusual Agent Activity Pattern',
        description: 'Agent performing tasks outside normal operating hours',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'investigating',
        affectedResources: ['developer_agent'],
        assignedTo: 'security-team',
        response: 'Investigating unusual task patterns during off-hours'
      },
      {
        id: 'alert-002',
        type: 'policy_violation',
        severity: 'low',
        title: 'Agent Configuration Change',
        description: 'Agent configuration modified without proper approval',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'resolved',
        affectedResources: ['custom_agent_001'],
        resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        response: 'Configuration change reverted, proper approval process enforced'
      }
    ];
    
    setSecurityAlerts(mockAlerts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'success':
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'investigating':
        return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant':
      case 'failure':
      case 'open':
        return 'text-red-600 bg-red-100';
      case 'pending':
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading governance dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Governance</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive monitoring, compliance, and security oversight
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>

          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {dashboardMetrics.systemUptime}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+0.2% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {dashboardMetrics.complianceScore}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+3% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {dashboardMetrics.securityScore}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-600">-1% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {dashboardMetrics.activeTasks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Clock className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-gray-600">Avg completion: {dashboardMetrics.averageCompletionTime}min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Task Execution Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MetricsChart 
                  type="line" 
                  data={[/* chart data */]} 
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Agent Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Agent Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentPerformance.slice(0, 5).map((agent, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {agent.agentType.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{agent.agentType}</div>
                          <div className="text-xs text-gray-500">
                            {agent.tasksCompleted} tasks completed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{agent.qualityScore}%</div>
                        <Progress 
                          value={agent.qualityScore} 
                          className="w-16 h-2 mt-1" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog entries={auditLog.slice(0, 10)} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compliance Management</h2>
            <Button className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Generate Report</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Score</span>
                        <span className="font-medium">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} className="mt-1" />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {metric.violations.length === 0 ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          No violations
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {metric.violations.length} violations
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ComplianceReport metrics={complianceMetrics} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Activity & Audit Log</h2>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ActivityLog 
            entries={auditLog}
            searchQuery={searchQuery}
            statusFilter={filterStatus}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Detailed Analytics
            </Button>
          </div>

          <MetricsChart 
            type="dashboard" 
            data={agentPerformance} 
            orchestrationMetrics={orchestrationMetrics}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Security Monitoring</h2>
            <Button className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Configure Alerts</span>
            </Button>
          </div>

          <AlertsPanel 
            alerts={securityAlerts}
            onAlertUpdate={(id, status) => {
              setSecurityAlerts(prev => prev.map(alert => 
                alert.id === id ? { ...alert, status } : alert
              ));
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}