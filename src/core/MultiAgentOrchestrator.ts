import { 
  AgentType, 
  Task, 
  TaskStatus, 
  TaskPriority,
  AgentProfile,
  HandoffRequest,
  AgentCommunication 
} from '../types/agents';
import { BaseAgent } from './BaseAgent';
import { CommunicationBus } from './CommunicationBus';
import { EventEmitter } from 'events';

/**
 * Enhanced Multi-Agent Orchestrator for native agent coordination
 * Extends the existing system with sophisticated role-based specialization
 */
export interface AgentRole {
  id: string;
  type: AgentType;
  specializations: string[];
  capabilities: string[];
  maxConcurrentTasks: number;
  skillLevel: number; // 1-10 scale
  collaborationStyle: 'independent' | 'collaborative' | 'leader' | 'follower';
  preferredPartners: AgentType[];
}

export interface OrchestrationStrategy {
  id: string;
  name: string;
  description: string;
  agentSelection: 'auto' | 'skill_based' | 'workload_based' | 'collaborative';
  taskDistribution: 'sequential' | 'parallel' | 'hierarchical' | 'hybrid';
  handoffCriteria: HandoffCriteria;
  qualityGates: QualityGate[];
}

export interface HandoffCriteria {
  skillThreshold: number;
  workloadThreshold: number;
  timeThreshold: number; // minutes
  qualityThreshold: number;
  requiresApproval: boolean;
  autoHandoffEnabled: boolean;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  criteria: QualityCriteria[];
  requiredApproval: boolean;
  blocksProgress: boolean;
}

export interface QualityCriteria {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  weight: number;
}

export interface WorkflowExecution {
  id: string;
  taskId: string;
  strategy: OrchestrationStrategy;
  currentAgent: AgentType;
  executionPath: AgentType[];
  startTime: Date;
  estimatedCompletion: Date;
  status: 'planning' | 'executing' | 'handoff_pending' | 'quality_check' | 'completed' | 'failed';
  qualityScore: number;
  handoffCount: number;
  collaborationScore: number;
}

export class MultiAgentOrchestrator extends EventEmitter {
  private communicationBus: CommunicationBus;
  private agentRoles: Map<AgentType, AgentRole>;
  private orchestrationStrategies: Map<string, OrchestrationStrategy>;
  private activeWorkflows: Map<string, WorkflowExecution>;
  private agents: Map<AgentType, BaseAgent>;
  private collaborationHistory: Map<string, AgentCollaboration>;

  constructor(communicationBus: CommunicationBus) {
    super();
    this.communicationBus = communicationBus;
    this.agentRoles = new Map();
    this.orchestrationStrategies = new Map();
    this.activeWorkflows = new Map();
    this.agents = new Map();
    this.collaborationHistory = new Map();
    
    this.setupDefaultStrategies();
    this.setupEventHandlers();
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: BaseAgent, role: AgentRole): void {
    this.agents.set(agent.getType(), agent);
    this.agentRoles.set(agent.getType(), role);
    
    console.log(`🎭 Registered ${agent.getType()} with role: ${role.specializations.join(', ')}`);
    this.emit('agent:registered', { agent: agent.getType(), role });
  }

  /**
   * Orchestrate task execution with intelligent agent selection
   */
  async orchestrateTask(
    task: Task, 
    strategyId: string = 'default_collaborative'
  ): Promise<WorkflowExecution> {
    const strategy = this.orchestrationStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Orchestration strategy '${strategyId}' not found`);
    }

    console.log(`🎼 Orchestrating task: ${task.title} with strategy: ${strategy.name}`);

    // Create workflow execution
    const workflow: WorkflowExecution = {
      id: this.generateId(),
      taskId: task.id,
      strategy,
      currentAgent: await this.selectOptimalAgent(task, strategy),
      executionPath: [],
      startTime: new Date(),
      estimatedCompletion: this.estimateCompletion(task, strategy),
      status: 'planning',
      qualityScore: 0,
      handoffCount: 0,
      collaborationScore: 0
    };

    this.activeWorkflows.set(workflow.id, workflow);

    // Start execution
    await this.executeWorkflow(workflow, task);
    
    this.emit('workflow:started', { workflow, task });
    return workflow;
  }

  /**
   * Select optimal agent based on orchestration strategy
   */
  private async selectOptimalAgent(
    task: Task, 
    strategy: OrchestrationStrategy
  ): Promise<AgentType> {
    const candidates = Array.from(this.agentRoles.values())
      .filter(role => this.isAgentCapable(role, task))
      .sort((a, b) => this.calculateAgentScore(b, task) - this.calculateAgentScore(a, task));

    if (candidates.length === 0) {
      throw new Error(`No capable agent found for task: ${task.title}`);
    }

    const selectedRole = candidates[0];
    console.log(`🎯 Selected ${selectedRole.type} for task: ${task.title} (score: ${this.calculateAgentScore(selectedRole, task)})`);
    
    return selectedRole.type;
  }

  /**
   * Check if agent is capable of handling the task
   */
  private isAgentCapable(role: AgentRole, task: Task): boolean {
    const agent = this.agents.get(role.type);
    if (!agent) return false;

    const profile = agent.getProfile();
    
    // Check availability and workload
    if (!profile.isAvailable || profile.workload >= role.maxConcurrentTasks * 10) {
      return false;
    }

    // Check specializations match task type
    const taskTypeMatch = role.specializations.some(spec => 
      task.type.toLowerCase().includes(spec.toLowerCase()) ||
      task.description.toLowerCase().includes(spec.toLowerCase())
    );

    return taskTypeMatch || role.specializations.includes('general');
  }

  /**
   * Calculate agent suitability score for task
   */
  private calculateAgentScore(role: AgentRole, task: Task): number {
    const agent = this.agents.get(role.type);
    if (!agent) return 0;

    const profile = agent.getProfile();
    let score = 0;

    // Skill level (40% weight)
    score += role.skillLevel * 4;

    // Workload (30% weight) - lower is better
    score += (100 - profile.workload) * 0.3;

    // Specialization match (20% weight)
    const specializationMatch = role.specializations.some(spec =>
      task.type.toLowerCase().includes(spec.toLowerCase()) ||
      task.description.toLowerCase().includes(spec.toLowerCase())
    );
    if (specializationMatch) score += 20;

    // Priority alignment (10% weight)
    if (task.priority === TaskPriority.HIGH && role.skillLevel >= 8) score += 10;
    if (task.priority === TaskPriority.CRITICAL && role.skillLevel >= 9) score += 10;

    return score;
  }

  /**
   * Execute workflow with intelligent handoffs
   */
  private async executeWorkflow(workflow: WorkflowExecution, task: Task): Promise<void> {
    workflow.status = 'executing';
    workflow.executionPath.push(workflow.currentAgent);

    const currentAgent = this.agents.get(workflow.currentAgent);
    if (!currentAgent) {
      workflow.status = 'failed';
      this.emit('workflow:failed', { workflow, reason: 'Agent not found' });
      return;
    }

    try {
      // Monitor for handoff requests
      this.setupWorkflowHandoffMonitoring(workflow);

      // Execute task with current agent
      console.log(`🚀 Starting execution with ${workflow.currentAgent}`);
      await this.executeTaskWithAgent(task, currentAgent, workflow);

      // Check quality gates
      await this.evaluateQualityGates(workflow, task);

      if (workflow.status !== 'failed') {
        workflow.status = 'completed';
        workflow.qualityScore = await this.calculateQualityScore(workflow);
        this.emit('workflow:completed', { workflow });
      }

    } catch (error) {
      workflow.status = 'failed';
      this.emit('workflow:failed', { workflow, error });
    }
  }

  /**
   * Setup handoff monitoring for workflow
   */
  private setupWorkflowHandoffMonitoring(workflow: WorkflowExecution): void {
    const handoffHandler = async (handoff: HandoffRequest) => {
      if (handoff.taskId !== workflow.taskId) return;

      console.log(`🔄 Processing handoff in workflow ${workflow.id}: ${handoff.fromAgent} → ${handoff.toAgent}`);
      
      workflow.status = 'handoff_pending';
      workflow.handoffCount++;

      const shouldAutoApprove = await this.evaluateHandoffRequest(handoff, workflow);
      
      if (shouldAutoApprove) {
        await this.approveHandoff(handoff, workflow);
      } else {
        // Require manual approval or use alternative strategy
        this.emit('workflow:handoff_approval_required', { workflow, handoff });
      }
    };

    this.communicationBus.on('handoff', handoffHandler);
    
    // Cleanup handler when workflow completes
    this.once(`workflow:completed:${workflow.id}`, () => {
      this.communicationBus.off('handoff', handoffHandler);
    });
  }

  /**
   * Evaluate if handoff should be auto-approved
   */
  private async evaluateHandoffRequest(
    handoff: HandoffRequest, 
    workflow: WorkflowExecution
  ): Promise<boolean> {
    const criteria = workflow.strategy.handoffCriteria;
    
    if (!criteria.autoHandoffEnabled) return false;

    const toAgentRole = this.agentRoles.get(handoff.toAgent);
    const fromAgent = this.agents.get(handoff.fromAgent);
    
    if (!toAgentRole || !fromAgent) return false;

    // Check skill threshold
    if (toAgentRole.skillLevel < criteria.skillThreshold) return false;

    // Check workload
    const toAgent = this.agents.get(handoff.toAgent);
    if (toAgent && toAgent.getProfile().workload > criteria.workloadThreshold) return false;

    // Check time threshold
    const workflowDuration = Date.now() - workflow.startTime.getTime();
    if (workflowDuration > criteria.timeThreshold * 60000) return false;

    return true;
  }

  /**
   * Approve and execute handoff
   */
  private async approveHandoff(handoff: HandoffRequest, workflow: WorkflowExecution): Promise<void> {
    await this.communicationBus.acceptHandoff(handoff.id, handoff.toAgent);
    
    // Update workflow
    workflow.currentAgent = handoff.toAgent;
    workflow.executionPath.push(handoff.toAgent);
    workflow.status = 'executing';

    // Record collaboration
    await this.recordCollaboration(handoff.fromAgent, handoff.toAgent, workflow.taskId);

    console.log(`✅ Handoff approved in workflow ${workflow.id}: ${handoff.fromAgent} → ${handoff.toAgent}`);
    this.emit('workflow:handoff_completed', { workflow, handoff });
  }

  /**
   * Execute task with specific agent
   */
  private async executeTaskWithAgent(
    task: Task, 
    agent: BaseAgent, 
    workflow: WorkflowExecution
  ): Promise<void> {
    // This would integrate with the existing agent execution system
    // For now, we simulate the execution
    task.assignedAgent = agent.getType();
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = new Date();

    // Simulate work with progress updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
  }

  /**
   * Evaluate quality gates for workflow
   */
  private async evaluateQualityGates(workflow: WorkflowExecution, task: Task): Promise<void> {
    const gates = workflow.strategy.qualityGates;
    
    for (const gate of gates) {
      const passed = await this.evaluateQualityGate(gate, task, workflow);
      
      if (!passed && gate.blocksProgress) {
        workflow.status = 'failed';
        this.emit('workflow:quality_gate_failed', { workflow, gate });
        throw new Error(`Quality gate '${gate.name}' failed`);
      }

      if (!passed) {
        this.emit('workflow:quality_warning', { workflow, gate });
      }
    }
  }

  /**
   * Evaluate individual quality gate
   */
  private async evaluateQualityGate(
    gate: QualityGate, 
    task: Task, 
    workflow: WorkflowExecution
  ): Promise<boolean> {
    // Simplified quality evaluation - would integrate with actual metrics
    let totalScore = 0;
    let totalWeight = 0;

    for (const criteria of gate.criteria) {
      const value = await this.getMetricValue(criteria.metric, task, workflow);
      const passed = this.evaluateCriteria(criteria, value);
      
      totalScore += passed ? criteria.weight : 0;
      totalWeight += criteria.weight;
    }

    return totalWeight > 0 ? (totalScore / totalWeight) >= 0.8 : true;
  }

  /**
   * Get metric value for quality evaluation
   */
  private async getMetricValue(
    metric: string, 
    task: Task, 
    workflow: WorkflowExecution
  ): Promise<number> {
    // Placeholder implementation - would integrate with real metrics
    switch (metric) {
      case 'execution_time':
        return Date.now() - workflow.startTime.getTime();
      case 'handoff_count':
        return workflow.handoffCount;
      case 'agent_confidence':
        return Math.random() * 100; // Would use real agent confidence scores
      default:
        return 0;
    }
  }

  /**
   * Evaluate criteria against value
   */
  private evaluateCriteria(criteria: QualityCriteria, value: number): boolean {
    switch (criteria.operator) {
      case 'gt': return value > criteria.threshold;
      case 'lt': return value < criteria.threshold;
      case 'eq': return value === criteria.threshold;
      case 'gte': return value >= criteria.threshold;
      case 'lte': return value <= criteria.threshold;
      default: return false;
    }
  }

  /**
   * Calculate overall quality score for workflow
   */
  private async calculateQualityScore(workflow: WorkflowExecution): Promise<number> {
    let score = 100;

    // Deduct for excessive handoffs
    if (workflow.handoffCount > 3) {
      score -= (workflow.handoffCount - 3) * 5;
    }

    // Deduct for long execution time
    const duration = Date.now() - workflow.startTime.getTime();
    const expectedDuration = workflow.estimatedCompletion.getTime() - workflow.startTime.getTime();
    
    if (duration > expectedDuration) {
      const overrun = (duration - expectedDuration) / expectedDuration;
      score -= overrun * 20;
    }

    // Add bonus for good collaboration
    score += workflow.collaborationScore;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Record collaboration between agents
   */
  private async recordCollaboration(
    fromAgent: AgentType, 
    toAgent: AgentType, 
    taskId: string
  ): Promise<void> {
    const collaborationKey = `${fromAgent}-${toAgent}`;
    
    if (!this.collaborationHistory.has(collaborationKey)) {
      this.collaborationHistory.set(collaborationKey, {
        fromAgent,
        toAgent,
        collaborationCount: 0,
        successCount: 0,
        averageHandoffTime: 0,
        lastCollaboration: new Date(),
        taskIds: []
      });
    }

    const collaboration = this.collaborationHistory.get(collaborationKey)!;
    collaboration.collaborationCount++;
    collaboration.lastCollaboration = new Date();
    collaboration.taskIds.push(taskId);

    console.log(`🤝 Recorded collaboration: ${fromAgent} → ${toAgent} (total: ${collaboration.collaborationCount})`);
  }

  /**
   * Estimate task completion time
   */
  private estimateCompletion(task: Task, strategy: OrchestrationStrategy): Date {
    // Simplified estimation - would use historical data and ML
    const baseTime = this.getBaseTaskTime(task.type);
    const strategyMultiplier = this.getStrategyMultiplier(strategy);
    
    const estimatedMinutes = baseTime * strategyMultiplier;
    return new Date(Date.now() + estimatedMinutes * 60000);
  }

  /**
   * Get base task time in minutes
   */
  private getBaseTaskTime(taskType: string): number {
    const baseTimes: Record<string, number> = {
      'ui_design': 60,
      'development': 120,
      'api_development': 90,
      'testing': 45,
      'documentation': 30,
      'general': 60
    };

    return baseTimes[taskType] || baseTimes.general;
  }

  /**
   * Get strategy multiplier for time estimation
   */
  private getStrategyMultiplier(strategy: OrchestrationStrategy): number {
    const multipliers: Record<string, number> = {
      'sequential': 1.0,
      'parallel': 0.7,
      'hierarchical': 1.2,
      'hybrid': 0.9
    };

    return multipliers[strategy.taskDistribution] || 1.0;
  }

  /**
   * Setup default orchestration strategies
   */
  private setupDefaultStrategies(): void {
    // Default collaborative strategy
    this.orchestrationStrategies.set('default_collaborative', {
      id: 'default_collaborative',
      name: 'Default Collaborative',
      description: 'Balanced approach with moderate collaboration',
      agentSelection: 'skill_based',
      taskDistribution: 'hybrid',
      handoffCriteria: {
        skillThreshold: 7,
        workloadThreshold: 80,
        timeThreshold: 30,
        qualityThreshold: 80,
        requiresApproval: false,
        autoHandoffEnabled: true
      },
      qualityGates: [
        {
          id: 'basic_quality',
          name: 'Basic Quality Check',
          description: 'Ensures minimum quality standards',
          criteria: [
            { metric: 'agent_confidence', operator: 'gte', threshold: 70, weight: 1 }
          ],
          requiredApproval: false,
          blocksProgress: false
        }
      ]
    });

    // High-performance strategy
    this.orchestrationStrategies.set('high_performance', {
      id: 'high_performance',
      name: 'High Performance',
      description: 'Optimized for speed with skilled agents',
      agentSelection: 'skill_based',
      taskDistribution: 'parallel',
      handoffCriteria: {
        skillThreshold: 8,
        workloadThreshold: 60,
        timeThreshold: 15,
        qualityThreshold: 85,
        requiresApproval: false,
        autoHandoffEnabled: true
      },
      qualityGates: [
        {
          id: 'performance_quality',
          name: 'Performance Quality Check',
          description: 'High standards for performance-critical tasks',
          criteria: [
            { metric: 'execution_time', operator: 'lt', threshold: 3600000, weight: 0.4 },
            { metric: 'agent_confidence', operator: 'gte', threshold: 85, weight: 0.6 }
          ],
          requiredApproval: false,
          blocksProgress: true
        }
      ]
    });

    console.log('📋 Initialized default orchestration strategies');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('workflow:completed', ({ workflow }) => {
      console.log(`✅ Workflow ${workflow.id} completed with quality score: ${workflow.qualityScore}`);
      this.activeWorkflows.delete(workflow.id);
    });

    this.on('workflow:failed', ({ workflow, error }) => {
      console.error(`❌ Workflow ${workflow.id} failed:`, error);
      this.activeWorkflows.delete(workflow.id);
    });
  }

  /**
   * Get orchestration analytics
   */
  getOrchestrationAnalytics() {
    const workflows = Array.from(this.activeWorkflows.values());
    const collaborations = Array.from(this.collaborationHistory.values());

    return {
      activeWorkflows: workflows.length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length,
      averageQualityScore: workflows.reduce((sum, w) => sum + w.qualityScore, 0) / workflows.length || 0,
      averageHandoffCount: workflows.reduce((sum, w) => sum + w.handoffCount, 0) / workflows.length || 0,
      collaborationPairs: collaborations.length,
      topCollaborators: collaborations
        .sort((a, b) => b.collaborationCount - a.collaborationCount)
        .slice(0, 5)
        .map(c => ({ 
          pair: `${c.fromAgent} → ${c.toAgent}`, 
          count: c.collaborationCount 
        }))
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `orc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional types for collaboration tracking
interface AgentCollaboration {
  fromAgent: AgentType;
  toAgent: AgentType;
  collaborationCount: number;
  successCount: number;
  averageHandoffTime: number;
  lastCollaboration: Date;
  taskIds: string[];
}

export default MultiAgentOrchestrator;