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
import { TaskRouter } from './TaskRouter';
import MultiAgentOrchestrator, { AgentRole, OrchestrationStrategy } from './MultiAgentOrchestrator';
import { AgentPerformanceMetrics, OrchestrationMetrics } from '../types/orchestration';
import DeveloperAgent from '../agents/DeveloperAgent';
import DesignerAgent from '../agents/DesignerAgent';

/**
 * Enhanced AgentOS Manager with Multi-Agent Orchestration capabilities
 * Extends the original AgentOSManager with native multi-agent coordination
 */
export class EnhancedAgentOSManager {
  private communicationBus: CommunicationBus;
  private taskRouter: TaskRouter;
  private orchestrator: MultiAgentOrchestrator;
  private agents: Map<AgentType, BaseAgent>;
  private agentRoles: Map<AgentType, AgentRole>;
  private isInitialized: boolean = false;
  private performanceMetrics: Map<AgentType, AgentPerformanceMetrics>;
  private orchestrationEnabled: boolean = true;

  constructor() {
    this.communicationBus = new CommunicationBus();
    this.taskRouter = new TaskRouter(this.communicationBus);
    this.orchestrator = new MultiAgentOrchestrator(this.communicationBus);
    this.agents = new Map();
    this.agentRoles = new Map();
    this.performanceMetrics = new Map();
    
    this.setupEventHandlers();
    this.setupOrchestrationHandlers();
  }

  /**
   * Initialize the enhanced AgentOS system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Enhanced AgentOS already initialized');
      return;
    }

    console.log('🚀 Initializing Enhanced AgentOS with Multi-Agent Orchestration...');

    // Initialize agents with enhanced roles
    await this.initializeEnhancedAgents();
    
    // Setup agent communication
    this.setupAgentCommunication();
    
    // Setup orchestration monitoring
    this.setupOrchestrationMonitoring();
    
    this.isInitialized = true;
    console.log('✅ Enhanced AgentOS initialized successfully');
    
    // Send system ready message
    await this.communicationBus.broadcastMessage(
      'system',
      'Enhanced AgentOS with Multi-Agent Orchestration is now online',
      'info'
    );
  }

  /**
   * Initialize agents with enhanced role definitions
   */
  private async initializeEnhancedAgents(): Promise<void> {
    console.log('🤖 Initializing enhanced agents with specialized roles...');

    // Initialize Developer Agent with enhanced role
    const developerAgent = new DeveloperAgent(this.communicationBus);
    const developerRole: AgentRole = {
      id: 'developer_role_001',
      type: AgentType.DEVELOPER,
      specializations: [
        'full_stack_development',
        'api_development', 
        'database_design',
        'devops',
        'code_review',
        'debugging',
        'performance_optimization'
      ],
      capabilities: [
        'next.js', 'react', 'typescript', 'node.js', 
        'postgresql', 'docker', 'vercel', 'github_api'
      ],
      maxConcurrentTasks: 3,
      skillLevel: 9,
      collaborationStyle: 'collaborative',
      preferredPartners: [AgentType.DESIGNER, AgentType.ANALYST]
    };

    this.agents.set(AgentType.DEVELOPER, developerAgent);
    this.agentRoles.set(AgentType.DEVELOPER, developerRole);
    this.orchestrator.registerAgent(developerAgent, developerRole);
    this.taskRouter.registerAgent(developerAgent);
    this.initializePerformanceMetrics(AgentType.DEVELOPER);

    // Initialize Designer Agent with enhanced role
    const designerAgent = new DesignerAgent(this.communicationBus);
    const designerRole: AgentRole = {
      id: 'designer_role_001',
      type: AgentType.DESIGNER,
      specializations: [
        'ui_design',
        'ux_design',
        'prototyping',
        'design_systems',
        'accessibility',
        'responsive_design',
        'user_research'
      ],
      capabilities: [
        'figma', 'sketch', 'adobe_creative_suite', 
        'html_css', 'design_tokens', 'accessibility_standards'
      ],
      maxConcurrentTasks: 2,
      skillLevel: 8,
      collaborationStyle: 'collaborative',
      preferredPartners: [AgentType.DEVELOPER, AgentType.ANALYST]
    };

    this.agents.set(AgentType.DESIGNER, designerAgent);
    this.agentRoles.set(AgentType.DESIGNER, designerRole);
    this.orchestrator.registerAgent(designerAgent, designerRole);
    this.taskRouter.registerAgent(designerAgent);
    this.initializePerformanceMetrics(AgentType.DESIGNER);

    // TODO: Add other agents (Analyst, Research, Project Manager)
    // For MVP, we'll start with Developer and Designer

    console.log(`✅ Initialized ${this.agents.size} enhanced agents`);
  }

  /**
   * Initialize performance metrics for agent
   */
  private initializePerformanceMetrics(agentType: AgentType): void {
    this.performanceMetrics.set(agentType, {
      agentType,
      tasksCompleted: 0,
      averageCompletionTime: 0,
      qualityScore: 85, // Starting score
      collaborationScore: 80,
      handoffSuccessRate: 90,
      specializations: {},
      workloadBalance: 0,
      availability: 100,
      learningProgress: 0
    });
  }

  /**
   * Create task with orchestration (enhanced version)
   */
  async createOrchestredTask(
    title: string,
    description: string,
    type: string = 'general',
    priority: TaskPriority = TaskPriority.MEDIUM,
    dependencies: string[] = [],
    context: Record<string, any> = {},
    orchestrationStrategy: string = 'default_collaborative'
  ): Promise<{ task: Task; workflowId: string }> {
    if (!this.isInitialized) {
      throw new Error('Enhanced AgentOS not initialized. Call initialize() first.');
    }

    const task: Task = {
      id: this.generateId(),
      title,
      description,
      type,
      priority,
      status: TaskStatus.PENDING,
      assignedAgent: AgentType.DEVELOPER, // Will be reassigned by orchestrator
      createdBy: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies,
      context: {
        ...context,
        orchestrationEnabled: this.orchestrationEnabled,
        orchestrationStrategy
      }
    };

    console.log(`🎼 Creating orchestrated task: ${title} with strategy: ${orchestrationStrategy}`);

    if (this.orchestrationEnabled) {
      // Use orchestrator for intelligent task execution
      const workflow = await this.orchestrator.orchestrateTask(task, orchestrationStrategy);
      return { task, workflowId: workflow.id };
    } else {
      // Fallback to regular task routing
      await this.taskRouter.addTask(task);
      return { task, workflowId: 'legacy_routing' };
    }
  }

  /**
   * Create task (backward compatibility)
   */
  async createTask(
    title: string,
    description: string,
    type: string = 'general',
    priority: TaskPriority = TaskPriority.MEDIUM,
    dependencies: string[] = [],
    context: Record<string, any> = {}
  ): Promise<Task> {
    const result = await this.createOrchestredTask(
      title, description, type, priority, dependencies, context
    );
    return result.task;
  }

  /**
   * Setup orchestration event handlers
   */
  private setupOrchestrationHandlers(): void {
    // Monitor workflow events
    this.orchestrator.on('workflow:started', ({ workflow, task }) => {
      console.log(`🎼 Workflow started: ${workflow.id} for task: ${task.title}`);
      this.updateAgentWorkload(workflow.currentAgent, 1);
    });

    this.orchestrator.on('workflow:completed', ({ workflow }) => {
      console.log(`✅ Workflow completed: ${workflow.id} (Quality: ${workflow.qualityScore})`);
      this.updateAgentPerformanceOnCompletion(workflow);
      this.updateAgentWorkload(workflow.currentAgent, -1);
    });

    this.orchestrator.on('workflow:handoff_completed', ({ workflow, handoff }) => {
      console.log(`🔄 Handoff completed in workflow: ${workflow.id}`);
      this.recordSuccessfulHandoff(handoff.fromAgent, handoff.toAgent);
      this.updateAgentWorkload(handoff.fromAgent, -1);
      this.updateAgentWorkload(handoff.toAgent, 1);
    });

    this.orchestrator.on('workflow:failed', ({ workflow, error }) => {
      console.error(`❌ Workflow failed: ${workflow.id}`, error);
      this.updateAgentWorkload(workflow.currentAgent, -1);
    });

    this.orchestrator.on('workflow:quality_gate_failed', ({ workflow, gate }) => {
      console.warn(`⚠️ Quality gate failed: ${gate.name} in workflow: ${workflow.id}`);
      // Could trigger remediation actions here
    });
  }

  /**
   * Update agent workload tracking
   */
  private updateAgentWorkload(agentType: AgentType, delta: number): void {
    const metrics = this.performanceMetrics.get(agentType);
    if (metrics) {
      // Update workload balance (simplified calculation)
      const currentTasks = this.getCurrentTaskCount(agentType);
      const maxTasks = this.agentRoles.get(agentType)?.maxConcurrentTasks || 3;
      metrics.workloadBalance = Math.min(100, (currentTasks / maxTasks) * 100);
      
      // Update availability
      metrics.availability = Math.max(0, 100 - metrics.workloadBalance);
    }
  }

  /**
   * Get current task count for agent
   */
  private getCurrentTaskCount(agentType: AgentType): number {
    const activeTasks = this.taskRouter.getTasksByStatus(TaskStatus.IN_PROGRESS);
    return activeTasks.filter(task => task.assignedAgent === agentType).length;
  }

  /**
   * Update agent performance metrics on task completion
   */
  private updateAgentPerformanceOnCompletion(workflow: any): void {
    const metrics = this.performanceMetrics.get(workflow.currentAgent);
    if (metrics) {
      metrics.tasksCompleted++;
      
      // Update average completion time
      const executionTime = Date.now() - workflow.startTime.getTime();
      metrics.averageCompletionTime = (
        (metrics.averageCompletionTime * (metrics.tasksCompleted - 1)) + 
        executionTime
      ) / metrics.tasksCompleted;
      
      // Update quality score (moving average)
      metrics.qualityScore = (
        (metrics.qualityScore * 0.8) + (workflow.qualityScore * 0.2)
      );
      
      // Update collaboration score based on handoffs
      if (workflow.handoffCount > 0) {
        metrics.collaborationScore = Math.min(100, metrics.collaborationScore + 2);
      }
    }
  }

  /**
   * Record successful handoff between agents
   */
  private recordSuccessfulHandoff(fromAgent: AgentType, toAgent: AgentType): void {
    const fromMetrics = this.performanceMetrics.get(fromAgent);
    const toMetrics = this.performanceMetrics.get(toAgent);
    
    if (fromMetrics) {
      fromMetrics.handoffSuccessRate = Math.min(100, fromMetrics.handoffSuccessRate + 1);
      fromMetrics.collaborationScore = Math.min(100, fromMetrics.collaborationScore + 1);
    }
    
    if (toMetrics) {
      toMetrics.collaborationScore = Math.min(100, toMetrics.collaborationScore + 1);
    }
  }

  /**
   * Setup orchestration monitoring
   */
  private setupOrchestrationMonitoring(): void {
    // Monitor orchestration performance every 5 minutes
    setInterval(() => {
      const analytics = this.orchestrator.getOrchestrationAnalytics();
      console.log('📊 Orchestration Analytics:', analytics);
    }, 5 * 60 * 1000);
  }

  /**
   * Setup legacy event handlers
   */
  private setupEventHandlers(): void {
    // Monitor all communications
    this.communicationBus.on('message', (communication: AgentCommunication) => {
      console.log(`📨 ${communication.fromAgent} → ${communication.toAgent}: ${communication.type}`);
    });

    // Monitor handoffs
    this.communicationBus.on('handoff', (handoff: HandoffRequest) => {
      console.log(`🔄 Handoff: ${handoff.fromAgent} → ${handoff.toAgent} (${handoff.reason})`);
    });
  }

  /**
   * Setup agent communication handlers
   */
  private setupAgentCommunication(): void {
    // Set up message handling for each agent
    for (const [agentType, agent] of this.agents) {
      this.communicationBus.subscribeToMessages(agentType, async (message) => {
        await agent.handleMessage(message);
      });

      this.communicationBus.subscribeToHandoffs(agentType, async (handoff) => {
        // Orchestrator handles handoffs now
        console.log(`📨 Handoff received by ${agentType}: ${handoff.id}`);
      });
    }
  }

  /**
   * Toggle orchestration on/off
   */
  setOrchestrationEnabled(enabled: boolean): void {
    this.orchestrationEnabled = enabled;
    console.log(`🎼 Orchestration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get enhanced system status with orchestration metrics
   */
  getEnhancedSystemStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    const baseStatus = this.getSystemStatus();
    const orchestrationAnalytics = this.orchestrator.getOrchestrationAnalytics();
    const performanceData = Array.from(this.performanceMetrics.values());

    return {
      ...baseStatus,
      orchestration: {
        enabled: this.orchestrationEnabled,
        analytics: orchestrationAnalytics,
        agentPerformance: performanceData
      },
      capabilities: {
        multiAgentCoordination: true,
        intelligentHandoffs: true,
        qualityGates: true,
        performanceTracking: true,
        learningEnabled: false // TODO: Implement learning system
      }
    };
  }

  /**
   * Get system status (legacy compatibility)
   */
  getSystemStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    const agentStatuses = Array.from(this.agents.values()).map(agent => ({
      ...agent.getProfile(),
      uptime: 'online',
      role: this.agentRoles.get(agent.getType()),
      performance: this.performanceMetrics.get(agent.getType())
    }));

    return {
      status: 'running',
      initialized: this.isInitialized,
      agents: agentStatuses,
      tasks: this.taskRouter.getStatus(),
      communication: {
        active_messages: this.communicationBus.getMessageHistory().length,
        active_handoffs: this.communicationBus.getActiveHandoffs().length
      }
    };
  }

  /**
   * Get orchestration metrics for monitoring
   */
  getOrchestrationMetrics(): OrchestrationMetrics {
    const analytics = this.orchestrator.getOrchestrationAnalytics();
    const performanceData = Array.from(this.performanceMetrics.values());
    
    return {
      taskThroughput: analytics.completedWorkflows || 0,
      averageHandoffTime: 30, // TODO: Calculate from actual data
      agentUtilization: performanceData.reduce((acc, metrics) => {
        acc[metrics.agentType] = metrics.workloadBalance;
        return acc;
      }, {} as Record<AgentType, number>),
      collaborationEfficiency: performanceData.reduce((sum, m) => sum + m.collaborationScore, 0) / performanceData.length || 0,
      qualityConsistency: analytics.averageQualityScore || 0,
      errorRate: 0, // TODO: Track errors
      customerSatisfaction: 8.5 // TODO: Implement feedback system
    };
  }

  /**
   * Create custom orchestration strategy
   */
  async createOrchestrationStrategy(strategy: OrchestrationStrategy): Promise<void> {
    // TODO: Implement strategy creation/modification
    console.log(`📋 Creating custom orchestration strategy: ${strategy.name}`);
  }

  /**
   * Get all agents (legacy compatibility)
   */
  getAllAgents(): Map<AgentType, BaseAgent> {
    return new Map(this.agents);
  }

  /**
   * Get agent by type (legacy compatibility)
   */
  getAgent(agentType: AgentType): BaseAgent | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Legacy compatibility methods
   */
  getTaskHistory() {
    return {
      pending: this.taskRouter.getTasksByStatus(TaskStatus.PENDING),
      active: this.taskRouter.getTasksByStatus(TaskStatus.IN_PROGRESS),
      completed: this.taskRouter.getTasksByStatus(TaskStatus.COMPLETED)
    };
  }

  getCommunicationHistory(agentType?: AgentType) {
    return {
      messages: this.communicationBus.getMessageHistory(agentType),
      handoffs: this.communicationBus.getHandoffHistory(agentType),
      active_handoffs: this.communicationBus.getActiveHandoffs(agentType)
    };
  }

  async sendAgentMessage(
    fromAgent: AgentType,
    toAgent: AgentType,
    message: string,
    type: AgentCommunication['type'] = 'info',
    taskId?: string
  ): Promise<void> {
    const communication: AgentCommunication = {
      id: this.generateId(),
      fromAgent,
      toAgent,
      message,
      type,
      taskId,
      createdAt: new Date()
    };

    await this.communicationBus.sendMessage(communication);
  }

  async broadcastMessage(
    fromAgent: AgentType | 'system',
    message: string,
    type: AgentCommunication['type'] = 'info'
  ): Promise<void> {
    await this.communicationBus.broadcastMessage(fromAgent, message, type);
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Enhanced AgentOS...');
    
    // Notify all agents about shutdown
    await this.broadcastMessage('system', 'Enhanced AgentOS is shutting down', 'info');
    
    // Set all agents as unavailable
    for (const agent of this.agents.values()) {
      agent.setAvailability(false);
    }

    // Cleanup communication history
    this.communicationBus.cleanup();
    
    this.isInitialized = false;
    console.log('✅ Enhanced AgentOS shut down successfully');
  }

  /**
   * Development helper - simulate complex workflow with orchestration
   */
  async simulateOrchestredWorkflow(): Promise<void> {
    console.log('🧪 Simulating complex orchestrated workflow...');
    
    // Create a series of interconnected tasks with orchestration
    const designTask = await this.createOrchestredTask(
      'Design Enterprise Dashboard',
      'Create comprehensive wireframes and UI components for enterprise dashboard with accessibility compliance',
      'ui_design',
      TaskPriority.HIGH,
      [],
      { 
        target_users: 'enterprise_admins', 
        features: ['analytics', 'user_management', 'compliance_reporting'],
        accessibility_level: 'WCAG_AA',
        design_system: 'enterprise_tokens'
      },
      'high_performance'
    );

    // Wait a moment then create dependent task
    setTimeout(async () => {
      await this.createOrchestredTask(
        'Implement Dashboard Components',
        'Develop React components based on design specifications with full TypeScript support',
        'development',
        TaskPriority.HIGH,
        [designTask.task.id],
        { 
          framework: 'nextjs', 
          styling: 'tailwindcss',
          typescript: true,
          testing: 'jest',
          accessibility: 'required'
        },
        'default_collaborative'
      );
    }, 2000);

    setTimeout(async () => {
      await this.createOrchestredTask(
        'Setup Dashboard API with Enterprise Security',
        'Create secure REST API endpoints for dashboard data with enterprise authentication',
        'api_development',
        TaskPriority.MEDIUM,
        [],
        { 
          database: 'postgresql', 
          auth: 'enterprise_sso',
          security: 'oauth2',
          rate_limiting: true,
          audit_logging: true
        },
        'high_performance'
      );
    }, 1000);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `enh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export enhanced manager
export const enhancedAgentOS = new EnhancedAgentOSManager();
export default EnhancedAgentOSManager;