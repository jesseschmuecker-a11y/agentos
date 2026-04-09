// Core agent types and interfaces for AgentOS
export enum AgentType {
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  ANALYST = 'analyst',
  RESEARCH = 'research',
  PROJECT_MANAGER = 'project_manager'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  HANDED_OFF = 'handed_off'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent: AgentType;
  createdBy: AgentType | 'user';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dependencies: string[];
  context: Record<string, any>;
  result?: any;
  handoffReason?: string;
  handoffTarget?: AgentType;
}

export interface AgentCapability {
  name: string;
  description: string;
  tools: string[];
  canHandleTaskTypes: string[];
}

export interface AgentProfile {
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  isAvailable: boolean;
  currentTask?: string;
  workload: number; // 0-100
  specializations: string[];
}

export interface HandoffRequest {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  taskId: string;
  reason: string;
  context: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface AgentCommunication {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  message: string;
  type: 'info' | 'request' | 'handoff' | 'collaboration';
  taskId?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<ToolResult>;
}