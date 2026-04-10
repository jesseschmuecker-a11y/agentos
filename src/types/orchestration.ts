import { AgentType, Task } from './agents';

/**
 * Enhanced types for Multi-Agent Orchestration
 */

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'creative' | 'analytical' | 'communication' | 'management';
  proficiencyLevel: number; // 1-10 scale
  prerequisites: string[]; // Required capabilities
  compatibleWith: string[]; // Works well with these capabilities
}

export interface AgentSpecialization {
  domain: string;
  expertise: AgentCapability[];
  experience: number; // Years of experience equivalent
  certifications: string[];
  performanceMetrics: {
    accuracy: number;
    speed: number;
    reliability: number;
    collaboration: number;
  };
}

export interface TaskComplexity {
  overall: number; // 1-10 scale
  technical: number;
  creative: number;
  analytical: number;
  collaborative: number;
  timeEstimate: number; // minutes
  uncertaintyFactor: number; // 0-1 scale
}

export interface CollaborationPattern {
  id: string;
  name: string;
  description: string;
  agentTypes: AgentType[];
  workflow: CollaborationStep[];
  successRate: number;
  averageCompletionTime: number;
  qualityScore: number;
}

export interface CollaborationStep {
  order: number;
  agentType: AgentType;
  action: string;
  dependencies: number[]; // Step orders this depends on
  parallelizable: boolean;
  estimatedDuration: number;
  qualityCriteria: string[];
}

export interface OrchestrationMetrics {
  taskThroughput: number; // tasks per hour
  averageHandoffTime: number; // seconds
  agentUtilization: Record<AgentType, number>; // percentage
  collaborationEfficiency: number; // percentage
  qualityConsistency: number; // percentage
  errorRate: number; // percentage
  customerSatisfaction: number; // 1-10 scale
}

export interface AgentPerformanceMetrics {
  agentType: AgentType;
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number;
  collaborationScore: number;
  handoffSuccessRate: number;
  specializations: Record<string, number>; // proficiency scores
  workloadBalance: number; // 0-100 percentage
  availability: number; // 0-100 percentage
  learningProgress: number; // improvement rate
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskTypes: string[];
  requiredAgents: AgentType[];
  optionalAgents: AgentType[];
  steps: WorkflowStep[];
  estimatedDuration: number;
  complexity: TaskComplexity;
  successCriteria: SuccessCriteria[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentType: AgentType;
  action: WorkflowAction;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  dependencies: string[]; // Step IDs
  conditions: WorkflowCondition[];
  timeoutMinutes: number;
  retryCount: number;
}

export interface WorkflowAction {
  type: 'execute' | 'review' | 'approve' | 'handoff' | 'notify' | 'wait';
  command: string;
  parameters: Record<string, any>;
  validationRules: ValidationRule[];
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'object' | 'file' | 'reference';
  required: boolean;
  source: 'user' | 'previous_step' | 'context' | 'external';
  validation: ValidationRule[];
}

export interface WorkflowOutput {
  name: string;
  type: 'string' | 'number' | 'object' | 'file' | 'reference';
  description: string;
  usedBy: string[]; // Step IDs that use this output
}

export interface WorkflowCondition {
  type: 'if' | 'while' | 'until' | 'switch';
  expression: string;
  trueAction: string;
  falseAction?: string;
  loopLimit?: number;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'range' | 'custom';
  parameter?: any;
  errorMessage: string;
}

export interface SuccessCriteria {
  id: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  tolerance: number;
  weight: number; // for overall scoring
  measurement: 'absolute' | 'percentage' | 'ratio';
}

export interface OrchestrationEvent {
  id: string;
  timestamp: Date;
  type: 'workflow:started' | 'workflow:completed' | 'handoff:requested' | 'handoff:completed' | 
        'quality:checked' | 'error:occurred' | 'agent:assigned' | 'agent:removed';
  workflowId: string;
  taskId: string;
  agentType?: AgentType;
  data: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AgentLearning {
  agentType: AgentType;
  learningEnabled: boolean;
  adaptationRate: number; // 0-1 scale
  knowledgeBase: KnowledgeItem[];
  performanceHistory: PerformanceSnapshot[];
  skillProgression: SkillProgression[];
  learningGoals: LearningGoal[];
}

export interface KnowledgeItem {
  id: string;
  category: string;
  content: string;
  source: 'experience' | 'training' | 'collaboration' | 'external';
  confidence: number;
  lastUsed: Date;
  useCount: number;
  validated: boolean;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: AgentPerformanceMetrics;
  context: Record<string, any>;
  feedback: string[];
  improvements: string[];
}

export interface SkillProgression {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progressRate: number; // improvement per task
  practiceNeeded: number; // tasks to reach target
  lastPracticed: Date;
}

export interface LearningGoal {
  id: string;
  description: string;
  skill: string;
  targetProficiency: number;
  deadline: Date;
  priority: number;
  progress: number; // 0-100 percentage
  milestones: LearningMilestone[];
}

export interface LearningMilestone {
  id: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completionDate?: Date;
  evidence: string[];
}

export interface OrchestrationConfig {
  maxConcurrentWorkflows: number;
  defaultStrategy: string;
  enableLearning: boolean;
  qualityThreshold: number;
  handoffTimeout: number; // seconds
  retryAttempts: number;
  loggingLevel: 'minimal' | 'standard' | 'detailed' | 'debug';
  notifications: NotificationConfig;
  security: SecurityConfig;
}

export interface NotificationConfig {
  enableEmail: boolean;
  enableSlack: boolean;
  enableWebhooks: boolean;
  escalationRules: EscalationRule[];
  channels: NotificationChannel[];
}

export interface EscalationRule {
  condition: string;
  delay: number; // minutes
  recipients: string[];
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  credentials: Record<string, string>;
  filters: string[];
}

export interface SecurityConfig {
  enableAuditLog: boolean;
  requireApproval: string[]; // Operations requiring approval
  accessControl: AccessRule[];
  dataRetention: number; // days
  encryption: boolean;
}

export interface AccessRule {
  role: string;
  permissions: string[];
  restrictions: string[];
  context: Record<string, any>;
}

// Export all orchestration-related types
export type {
  AgentCapability,
  AgentSpecialization,
  TaskComplexity,
  CollaborationPattern,
  CollaborationStep,
  OrchestrationMetrics,
  AgentPerformanceMetrics,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowAction,
  WorkflowInput,
  WorkflowOutput,
  WorkflowCondition,
  ValidationRule,
  SuccessCriteria,
  OrchestrationEvent,
  AgentLearning,
  KnowledgeItem,
  PerformanceSnapshot,
  SkillProgression,
  LearningGoal,
  LearningMilestone,
  OrchestrationConfig,
  NotificationConfig,
  EscalationRule,
  NotificationChannel,
  SecurityConfig,
  AccessRule
};