import { 
  AgentType, 
  AgentCommunication, 
  HandoffRequest,
  Task,
  TaskStatus 
} from '../types/agents';
import { AgentCommunicationBus } from './BaseAgent';
import EventEmitter from 'events';

/**
 * Central communication hub for agent-to-agent communication
 */
export class CommunicationBus extends EventEmitter implements AgentCommunicationBus {
  private messageHistory: AgentCommunication[] = [];
  private handoffHistory: HandoffRequest[] = [];
  private activeHandoffs: Map<string, HandoffRequest> = new Map();

  constructor() {
    super();
    this.setMaxListeners(50); // Support many agents
  }

  /**
   * Send message between agents
   */
  async sendMessage(communication: AgentCommunication): Promise<void> {
    // Store message in history
    this.messageHistory.push(communication);

    // Emit to specific agent
    this.emit(`message:${communication.toAgent}`, communication);

    // Emit general message event for logging/monitoring
    this.emit('message', communication);

    console.log(`📨 Message: ${communication.fromAgent} → ${communication.toAgent}: ${communication.message}`);
  }

  /**
   * Send handoff request between agents
   */
  async sendHandoffRequest(handoffRequest: HandoffRequest): Promise<void> {
    // Store handoff in history and active requests
    this.handoffHistory.push(handoffRequest);
    this.activeHandoffs.set(handoffRequest.id, handoffRequest);

    // Emit to specific agent
    this.emit(`handoff:${handoffRequest.toAgent}`, handoffRequest);

    // Emit general handoff event
    this.emit('handoff', handoffRequest);

    console.log(`🔄 Handoff Request: ${handoffRequest.fromAgent} → ${handoffRequest.toAgent} (Task: ${handoffRequest.taskId})`);
  }

  /**
   * Accept a handoff request
   */
  async acceptHandoff(handoffId: string, acceptingAgent: AgentType): Promise<void> {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff request ${handoffId} not found`);
    }

    if (handoff.toAgent !== acceptingAgent) {
      throw new Error(`Handoff ${handoffId} is not for agent ${acceptingAgent}`);
    }

    // Update handoff status
    handoff.status = 'accepted';
    this.activeHandoffs.delete(handoffId);

    // Notify the originating agent
    const acceptanceMessage: AgentCommunication = {
      id: this.generateId(),
      fromAgent: acceptingAgent,
      toAgent: handoff.fromAgent,
      message: `Handoff accepted for task ${handoff.taskId}`,
      type: 'info',
      taskId: handoff.taskId,
      createdAt: new Date(),
      metadata: { handoffId, status: 'accepted' }
    };

    await this.sendMessage(acceptanceMessage);

    // Emit handoff accepted event
    this.emit('handoff:accepted', { handoff, acceptingAgent });

    console.log(`✅ Handoff Accepted: ${handoff.id} by ${acceptingAgent}`);
  }

  /**
   * Reject a handoff request
   */
  async rejectHandoff(
    handoffId: string, 
    rejectingAgent: AgentType, 
    reason: string
  ): Promise<void> {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff request ${handoffId} not found`);
    }

    if (handoff.toAgent !== rejectingAgent) {
      throw new Error(`Handoff ${handoffId} is not for agent ${rejectingAgent}`);
    }

    // Update handoff status
    handoff.status = 'rejected';
    this.activeHandoffs.delete(handoffId);

    // Notify the originating agent
    const rejectionMessage: AgentCommunication = {
      id: this.generateId(),
      fromAgent: rejectingAgent,
      toAgent: handoff.fromAgent,
      message: `Handoff rejected for task ${handoff.taskId}: ${reason}`,
      type: 'info',
      taskId: handoff.taskId,
      createdAt: new Date(),
      metadata: { handoffId, status: 'rejected', reason }
    };

    await this.sendMessage(rejectionMessage);

    // Emit handoff rejected event
    this.emit('handoff:rejected', { handoff, rejectingAgent, reason });

    console.log(`❌ Handoff Rejected: ${handoff.id} by ${rejectingAgent} - ${reason}`);
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribeToMessages(
    agentType: AgentType, 
    handler: (msg: AgentCommunication) => void
  ): void {
    this.on(`message:${agentType}`, handler);
  }

  /**
   * Subscribe to handoff requests for a specific agent
   */
  subscribeToHandoffs(
    agentType: AgentType, 
    handler: (req: HandoffRequest) => void
  ): void {
    this.on(`handoff:${agentType}`, handler);
  }

  /**
   * Get message history for debugging/monitoring
   */
  getMessageHistory(agentType?: AgentType): AgentCommunication[] {
    if (agentType) {
      return this.messageHistory.filter(
        msg => msg.fromAgent === agentType || msg.toAgent === agentType
      );
    }
    return [...this.messageHistory];
  }

  /**
   * Get handoff history for debugging/monitoring
   */
  getHandoffHistory(agentType?: AgentType): HandoffRequest[] {
    if (agentType) {
      return this.handoffHistory.filter(
        req => req.fromAgent === agentType || req.toAgent === agentType
      );
    }
    return [...this.handoffHistory];
  }

  /**
   * Get active handoff requests
   */
  getActiveHandoffs(agentType?: AgentType): HandoffRequest[] {
    const active = Array.from(this.activeHandoffs.values());
    if (agentType) {
      return active.filter(req => req.toAgent === agentType);
    }
    return active;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(
    fromAgent: AgentType | 'system',
    message: string,
    type: AgentCommunication['type'] = 'info',
    taskId?: string
  ): Promise<void> {
    const agents = Object.values(AgentType);
    
    for (const agent of agents) {
      if (agent === fromAgent) continue; // Don't send to self
      
      const communication: AgentCommunication = {
        id: this.generateId(),
        fromAgent: fromAgent as AgentType,
        toAgent: agent,
        message,
        type,
        taskId,
        createdAt: new Date()
      };

      await this.sendMessage(communication);
    }
  }

  /**
   * Clear old messages and handoffs to prevent memory leaks
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    // Clean message history
    this.messageHistory = this.messageHistory.filter(
      msg => msg.createdAt > cutoffTime
    );

    // Clean handoff history
    this.handoffHistory = this.handoffHistory.filter(
      req => req.createdAt > cutoffTime
    );

    console.log(`🧹 Cleaned up communication history older than ${olderThanHours} hours`);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CommunicationBus;