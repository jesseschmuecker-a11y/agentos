import { 
  AgentType, 
  AgentProfile, 
  Task, 
  TaskStatus, 
  HandoffRequest, 
  AgentCommunication, 
  AgentTool,
  ToolResult 
} from '../types/agents';

export abstract class BaseAgent {
  protected profile: AgentProfile;
  protected tools: Map<string, AgentTool>;
  protected communicationBus: AgentCommunicationBus;
  
  constructor(
    profile: AgentProfile, 
    communicationBus: AgentCommunicationBus
  ) {
    this.profile = profile;
    this.tools = new Map();
    this.communicationBus = communicationBus;
    this.initializeTools();
  }

  abstract initializeTools(): void;
  abstract canHandleTask(task: Task): boolean;
  abstract executeTask(task: Task): Promise<any>;

  /**
   * Get agent profile information
   */
  getProfile(): AgentProfile {
    return { ...this.profile };
  }

  /**
   * Update agent availability status
   */
  setAvailability(isAvailable: boolean): void {
    this.profile.isAvailable = isAvailable;
  }

  /**
   * Update agent workload
   */
  updateWorkload(workload: number): void {
    this.profile.workload = Math.max(0, Math.min(100, workload));
  }

  /**
   * Register a tool for this agent
   */
  protected registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute a tool by name
   */
  protected async executeTool(
    toolName: string, 
    parameters: any
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        data: null,
        error: `Tool '${toolName}' not found`
      };
    }

    try {
      return await tool.execute(parameters);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request handoff to another agent
   */
  protected async requestHandoff(
    toAgent: AgentType,
    task: Task,
    reason: string,
    context: Record<string, any> = {}
  ): Promise<HandoffRequest> {
    const handoffRequest: HandoffRequest = {
      id: this.generateId(),
      fromAgent: this.profile.type,
      toAgent,
      taskId: task.id,
      reason,
      context,
      createdAt: new Date(),
      status: 'pending'
    };

    // Send handoff request through communication bus
    await this.communicationBus.sendHandoffRequest(handoffRequest);
    
    return handoffRequest;
  }

  /**
   * Send message to another agent
   */
  protected async sendMessage(
    toAgent: AgentType,
    message: string,
    type: AgentCommunication['type'] = 'info',
    taskId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const communication: AgentCommunication = {
      id: this.generateId(),
      fromAgent: this.profile.type,
      toAgent,
      message,
      type,
      taskId,
      createdAt: new Date(),
      metadata
    };

    await this.communicationBus.sendMessage(communication);
  }

  /**
   * Handle incoming messages from other agents
   */
  async handleMessage(communication: AgentCommunication): Promise<void> {
    console.log(`${this.profile.name} received message:`, communication);
    
    // Override in specific agent implementations for custom message handling
    switch (communication.type) {
      case 'collaboration':
        await this.handleCollaborationRequest(communication);
        break;
      case 'handoff':
        await this.handleHandoffRequest(communication);
        break;
      default:
        // Log informational messages
        console.log(`${this.profile.name}: ${communication.message}`);
    }
  }

  /**
   * Handle collaboration requests from other agents
   */
  protected async handleCollaborationRequest(
    communication: AgentCommunication
  ): Promise<void> {
    // Default implementation - override in specific agents
    console.log(`${this.profile.name} handling collaboration request`);
  }

  /**
   * Handle handoff requests
   */
  protected async handleHandoffRequest(
    communication: AgentCommunication
  ): Promise<void> {
    // Default implementation - override in specific agents
    console.log(`${this.profile.name} handling handoff request`);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Communication bus interface for agent-to-agent communication
export interface AgentCommunicationBus {
  sendMessage(communication: AgentCommunication): Promise<void>;
  sendHandoffRequest(handoffRequest: HandoffRequest): Promise<void>;
  subscribeToMessages(agentType: AgentType, handler: (msg: AgentCommunication) => void): void;
  subscribeToHandoffs(agentType: AgentType, handler: (req: HandoffRequest) => void): void;
}