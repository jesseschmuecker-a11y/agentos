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
import DeveloperAgent from '../agents/DeveloperAgent';
import DesignerAgent from '../agents/DesignerAgent';

/**
 * Central manager for the AgentOS multi-agent system
 */
export class AgentOSManager {
  private communicationBus: CommunicationBus;
  private taskRouter: TaskRouter;
  private agents: Map<AgentType, BaseAgent>;
  private isInitialized: boolean = false;

  constructor() {
    this.communicationBus = new CommunicationBus();
    this.taskRouter = new TaskRouter(this.communicationBus);
    this.agents = new Map();
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the AgentOS system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ AgentOS already initialized');
      return;
    }

    console.log('🚀 Initializing AgentOS...');

    // Initialize agents
    await this.initializeAgents();
    
    // Setup agent communication
    this.setupAgentCommunication();
    
    this.isInitialized = true;
    console.log('✅ AgentOS initialized successfully');
    
    // Send system ready message
    await this.communicationBus.broadcastMessage(
      'system',
      'AgentOS is now online and ready to process tasks',
      'info'
    );
  }

  /**
   * Initialize all specialized agents
   */
  private async initializeAgents(): Promise<void> {
    console.log('🤖 Initializing agents...');

    // Initialize Developer Agent
    const developerAgent = new DeveloperAgent(this.communicationBus);
    this.agents.set(AgentType.DEVELOPER, developerAgent);
    this.taskRouter.registerAgent(developerAgent);

    // Initialize Designer Agent
    const designerAgent = new DesignerAgent(this.communicationBus);
    this.agents.set(AgentType.DESIGNER, designerAgent);
    this.taskRouter.registerAgent(designerAgent);

    // TODO: Initialize remaining agents
    // const analystAgent = new AnalystAgent(this.communicationBus);
    // this.agents.set(AgentType.ANALYST, analystAgent);
    // this.taskRouter.registerAgent(analystAgent);

    // const researchAgent = new ResearchAgent(this.communicationBus);
    // this.agents.set(AgentType.RESEARCH, researchAgent);
    // this.taskRouter.registerAgent(researchAgent);

    // const projectManagerAgent = new ProjectManagerAgent(this.communicationBus);
    // this.agents.set(AgentType.PROJECT_MANAGER, projectManagerAgent);
    // this.taskRouter.registerAgent(projectManagerAgent);

    console.log(`✅ Initialized ${this.agents.size} agents`);
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
        await this.handleHandoffRequest(handoff);
      });
    }
  }

  /**
   * Setup event handlers for system monitoring
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

    this.communicationBus.on('handoff:accepted', ({ handoff, acceptingAgent }) => {
      console.log(`✅ Handoff accepted: ${handoff.id} by ${acceptingAgent}`);
    });

    this.communicationBus.on('handoff:rejected', ({ handoff, rejectingAgent, reason }) => {
      console.log(`❌ Handoff rejected: ${handoff.id} by ${rejectingAgent} - ${reason}`);
    });
  }

  /**
   * Create and submit a new task
   */
  async createTask(
    title: string,
    description: string,
    type: string = 'general',
    priority: TaskPriority = TaskPriority.MEDIUM,
    dependencies: string[] = [],
    context: Record<string, any> = {}
  ): Promise<Task> {
    if (!this.isInitialized) {
      throw new Error('AgentOS not initialized. Call initialize() first.');
    }

    const task: Task = {
      id: this.generateId(),
      title,
      description,
      type,
      priority,
      status: TaskStatus.PENDING,
      assignedAgent: AgentType.DEVELOPER, // Will be reassigned by router
      createdBy: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies,
      context
    };

    console.log(`📋 Creating task: ${title}`);
    await this.taskRouter.addTask(task);
    
    return task;
  }

  /**
   * Handle handoff requests between agents
   */
  private async handleHandoffRequest(handoff: HandoffRequest): Promise<void> {
    const targetAgent = this.agents.get(handoff.toAgent);
    
    if (!targetAgent) {
      console.error(`❌ Target agent ${handoff.toAgent} not found for handoff ${handoff.id}`);
      await this.communicationBus.rejectHandoff(
        handoff.id,
        handoff.toAgent,
        `Agent ${handoff.toAgent} not available`
      );
      return;
    }

    const profile = targetAgent.getProfile();
    
    // Check if target agent can accept the handoff
    if (!profile.isAvailable || profile.workload > 80) {
      await this.communicationBus.rejectHandoff(
        handoff.id,
        handoff.toAgent,
        `Agent ${handoff.toAgent} is not available or overloaded`
      );
      return;
    }

    // Accept the handoff
    await this.communicationBus.acceptHandoff(handoff.id, handoff.toAgent);
    
    // Get the task and reassign it
    const task = this.findTaskById(handoff.taskId);
    if (task) {
      task.assignedAgent = handoff.toAgent;
      task.status = TaskStatus.PENDING; // Reset for new agent
      task.handoffReason = handoff.reason;
      task.updatedAt = new Date();
      
      // Add task back to router for the new agent
      await this.taskRouter.addTask(task);
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    const agentStatuses = Array.from(this.agents.values()).map(agent => ({
      ...agent.getProfile(),
      uptime: 'online'
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
   * Get agent by type
   */
  getAgent(agentType: AgentType): BaseAgent | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Map<AgentType, BaseAgent> {
    return new Map(this.agents);
  }

  /**
   * Get task history
   */
  getTaskHistory(): {
    pending: Task[];
    active: Task[];
    completed: Task[];
  } {
    return {
      pending: this.taskRouter.getTasksByStatus(TaskStatus.PENDING),
      active: this.taskRouter.getTasksByStatus(TaskStatus.IN_PROGRESS),
      completed: this.taskRouter.getTasksByStatus(TaskStatus.COMPLETED)
    };
  }

  /**
   * Get communication history
   */
  getCommunicationHistory(agentType?: AgentType) {
    return {
      messages: this.communicationBus.getMessageHistory(agentType),
      handoffs: this.communicationBus.getHandoffHistory(agentType),
      active_handoffs: this.communicationBus.getActiveHandoffs(agentType)
    };
  }

  /**
   * Send direct message between agents
   */
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

  /**
   * Broadcast message to all agents
   */
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
    console.log('🔄 Shutting down AgentOS...');
    
    // Notify all agents about shutdown
    await this.broadcastMessage('system', 'AgentOS is shutting down', 'info');
    
    // Set all agents as unavailable
    for (const agent of this.agents.values()) {
      agent.setAvailability(false);
    }

    // Cleanup communication history
    this.communicationBus.cleanup();
    
    this.isInitialized = false;
    console.log('✅ AgentOS shut down successfully');
  }

  /**
   * Find task by ID across all task collections
   */
  private findTaskById(taskId: string): Task | null {
    const allTasks = [
      ...this.taskRouter.getTasksByStatus(TaskStatus.PENDING),
      ...this.taskRouter.getTasksByStatus(TaskStatus.IN_PROGRESS),
      ...this.taskRouter.getTasksByStatus(TaskStatus.COMPLETED)
    ];

    return allTasks.find(task => task.id === taskId) || null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Development helper - simulate complex workflow
   */
  async simulateWorkflow(): Promise<void> {
    console.log('🧪 Simulating complex workflow...');
    
    // Create a series of interconnected tasks
    const designTask = await this.createTask(
      'Design User Dashboard',
      'Create wireframes and UI components for a user dashboard',
      'ui_design',
      TaskPriority.HIGH,
      [],
      { target_users: 'admin_users', features: ['analytics', 'user_management'] }
    );

    // Wait a moment then create dependent task
    setTimeout(async () => {
      await this.createTask(
        'Implement Dashboard Components',
        'Develop React components based on design specifications',
        'development',
        TaskPriority.HIGH,
        [designTask.id],
        { framework: 'nextjs', styling: 'tailwindcss' }
      );
    }, 2000);

    setTimeout(async () => {
      await this.createTask(
        'Setup Dashboard API',
        'Create REST API endpoints for dashboard data',
        'api_development',
        TaskPriority.MEDIUM,
        [],
        { database: 'postgresql', auth: 'jwt' }
      );
    }, 1000);
  }
}

// Export singleton instance
export const agentOS = new AgentOSManager();
export default AgentOSManager;