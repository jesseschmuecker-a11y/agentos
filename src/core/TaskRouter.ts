import { 
  AgentType, 
  Task, 
  TaskStatus, 
  TaskPriority,
  AgentProfile 
} from '../types/agents';
import { BaseAgent } from './BaseAgent';
import { CommunicationBus } from './CommunicationBus';

/**
 * Intelligent task routing system that assigns tasks to the most suitable agents
 */
export class TaskRouter {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private taskQueue: Task[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private communicationBus: CommunicationBus;

  constructor(communicationBus: CommunicationBus) {
    this.communicationBus = communicationBus;
  }

  /**
   * Register an agent with the router
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getProfile().type, agent);
    console.log(`🤖 Registered agent: ${agent.getProfile().name}`);
  }

  /**
   * Add a new task to the system
   */
  async addTask(task: Task): Promise<void> {
    // Add to queue
    this.taskQueue.push(task);
    
    console.log(`📋 New task added: ${task.title} (Priority: ${task.priority})`);

    // Try to assign immediately
    await this.processQueue();
  }

  /**
   * Process the task queue and assign tasks to suitable agents
   */
  async processQueue(): Promise<void> {
    // Sort queue by priority and creation time
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Process each task in the queue
    const tasksToProcess = [...this.taskQueue];
    this.taskQueue = [];

    for (const task of tasksToProcess) {
      await this.assignTask(task);
    }
  }

  /**
   * Assign a task to the most suitable agent
   */
  async assignTask(task: Task): Promise<void> {
    // Check if task has dependencies
    const dependenciesMet = await this.checkDependencies(task);
    if (!dependenciesMet) {
      // Put back in queue
      this.taskQueue.push(task);
      console.log(`⏳ Task ${task.title} waiting for dependencies`);
      return;
    }

    // Find the best agent for this task
    const bestAgent = await this.findBestAgent(task);
    
    if (!bestAgent) {
      // No available agent, put back in queue
      this.taskQueue.push(task);
      console.log(`⏳ No available agent for task: ${task.title}`);
      return;
    }

    // Assign task to agent
    task.assignedAgent = bestAgent.getProfile().type;
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = new Date();

    // Add to active tasks
    this.activeTasks.set(task.id, task);

    // Update agent workload
    const profile = bestAgent.getProfile();
    bestAgent.updateWorkload(profile.workload + this.calculateTaskWeight(task));

    console.log(`✅ Task assigned: ${task.title} → ${profile.name}`);

    // Execute task
    try {
      const result = await bestAgent.executeTask(task);
      await this.completeTask(task.id, result);
    } catch (error) {
      await this.failTask(task.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Find the best agent for a given task
   */
  private async findBestAgent(task: Task): Promise<BaseAgent | null> {
    const availableAgents = Array.from(this.agents.values()).filter(agent => {
      const profile = agent.getProfile();
      return profile.isAvailable && profile.workload < 80; // Don't overload agents
    });

    if (availableAgents.length === 0) {
      return null;
    }

    // Score each agent for this task
    const agentScores = await Promise.all(
      availableAgents.map(async (agent) => ({
        agent,
        score: await this.scoreAgentForTask(agent, task)
      }))
    );

    // Filter out agents that can't handle the task
    const capableAgents = agentScores.filter(({ score }) => score > 0);
    
    if (capableAgents.length === 0) {
      return null;
    }

    // Sort by score (descending) and workload (ascending)
    capableAgents.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.agent.getProfile().workload - b.agent.getProfile().workload;
    });

    return capableAgents[0].agent;
  }

  /**
   * Score an agent's suitability for a task (0-100)
   */
  private async scoreAgentForTask(agent: BaseAgent, task: Task): Promise<number> {
    const profile = agent.getProfile();
    
    // Check if agent can handle this task type
    if (!agent.canHandleTask(task)) {
      return 0;
    }

    let score = 50; // Base score

    // Bonus for specialization match
    const taskKeywords = (task.title + ' ' + task.description).toLowerCase();
    for (const specialization of profile.specializations) {
      if (taskKeywords.includes(specialization.toLowerCase())) {
        score += 20;
      }
    }

    // Bonus for low workload
    score += Math.max(0, 50 - profile.workload);

    // Penalty for high workload
    if (profile.workload > 60) {
      score -= (profile.workload - 60);
    }

    // Priority bonus for urgent tasks
    if (task.priority === TaskPriority.URGENT) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if task dependencies are met
   */
  private async checkDependencies(task: Task): Promise<boolean> {
    for (const depId of task.dependencies) {
      const completedTask = this.completedTasks.get(depId);
      if (!completedTask || completedTask.status !== TaskStatus.COMPLETED) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate task weight for workload management
   */
  private calculateTaskWeight(task: Task): number {
    const baseWeight = 10;
    const priorityMultipliers = {
      [TaskPriority.LOW]: 0.5,
      [TaskPriority.MEDIUM]: 1.0,
      [TaskPriority.HIGH]: 1.5,
      [TaskPriority.URGENT]: 2.0
    };
    
    return baseWeight * priorityMultipliers[task.priority];
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    // Update task
    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.completedAt = new Date();
    task.updatedAt = new Date();

    // Move to completed tasks
    this.activeTasks.delete(taskId);
    this.completedTasks.set(taskId, task);

    // Update agent workload
    const agent = this.agents.get(task.assignedAgent);
    if (agent) {
      const profile = agent.getProfile();
      const newWorkload = Math.max(0, profile.workload - this.calculateTaskWeight(task));
      agent.updateWorkload(newWorkload);
    }

    console.log(`✅ Task completed: ${task.title}`);

    // Notify system about completion
    await this.communicationBus.broadcastMessage(
      'system',
      `Task completed: ${task.title}`,
      'info',
      taskId
    );

    // Process queue in case this completion unlocks other tasks
    await this.processQueue();
  }

  /**
   * Mark a task as failed
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    // Update task
    task.status = TaskStatus.FAILED;
    task.result = { error };
    task.updatedAt = new Date();

    // Move back to queue for potential retry or reassignment
    this.activeTasks.delete(taskId);
    
    // Reset task for retry
    task.status = TaskStatus.PENDING;
    this.taskQueue.push(task);

    // Update agent workload
    const agent = this.agents.get(task.assignedAgent);
    if (agent) {
      const profile = agent.getProfile();
      const newWorkload = Math.max(0, profile.workload - this.calculateTaskWeight(task));
      agent.updateWorkload(newWorkload);
    }

    console.log(`❌ Task failed: ${task.title} - ${error}`);

    // Notify about failure
    await this.communicationBus.broadcastMessage(
      'system',
      `Task failed: ${task.title} - ${error}`,
      'info',
      taskId
    );
  }

  /**
   * Get system status
   */
  getStatus() {
    const agentStatuses = Array.from(this.agents.values()).map(agent => {
      const profile = agent.getProfile();
      return {
        type: profile.type,
        name: profile.name,
        isAvailable: profile.isAvailable,
        workload: profile.workload,
        currentTask: profile.currentTask
      };
    });

    return {
      agents: agentStatuses,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size,
      totalTasks: this.taskQueue.length + this.activeTasks.size + this.completedTasks.size
    };
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    switch (status) {
      case TaskStatus.PENDING:
        return [...this.taskQueue];
      case TaskStatus.IN_PROGRESS:
        return Array.from(this.activeTasks.values());
      case TaskStatus.COMPLETED:
        return Array.from(this.completedTasks.values());
      default:
        return [];
    }
  }
}

export default TaskRouter;