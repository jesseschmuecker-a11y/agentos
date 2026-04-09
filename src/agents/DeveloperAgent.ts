import { BaseAgent, AgentCommunicationBus } from '../core/BaseAgent';
import { 
  AgentType, 
  AgentProfile, 
  Task, 
  AgentTool, 
  ToolResult,
  AgentCommunication 
} from '../types/agents';

/**
 * Developer Agent - Specialized in code development, debugging, and technical solutions
 */
export class DeveloperAgent extends BaseAgent {
  constructor(communicationBus: AgentCommunicationBus) {
    const profile: AgentProfile = {
      type: AgentType.DEVELOPER,
      name: 'Developer Agent',
      description: 'Specialized in full-stack development, code review, debugging, and technical architecture',
      capabilities: [
        {
          name: 'Full-Stack Development',
          description: 'Next.js, React, TypeScript, Node.js development',
          tools: ['code_editor', 'file_system', 'github_api'],
          canHandleTaskTypes: ['development', 'coding', 'implementation']
        },
        {
          name: 'Code Review & Debugging',
          description: 'Code analysis, bug detection, and performance optimization',
          tools: ['code_analyzer', 'debugger', 'performance_profiler'],
          canHandleTaskTypes: ['debugging', 'code_review', 'optimization']
        },
        {
          name: 'Architecture & Design',
          description: 'System architecture, database design, API development',
          tools: ['architecture_planner', 'database_designer'],
          canHandleTaskTypes: ['architecture', 'system_design', 'api_design']
        }
      ],
      isAvailable: true,
      workload: 0,
      specializations: [
        'typescript', 'react', 'nextjs', 'nodejs', 'postgresql', 
        'supabase', 'api_development', 'debugging', 'testing',
        'docker', 'vercel', 'github_actions'
      ]
    };

    super(profile, communicationBus);
  }

  initializeTools(): void {
    // File System Operations
    this.registerTool({
      name: 'file_system',
      description: 'Read, write, and manage files',
      parameters: {
        operation: 'string', // 'read' | 'write' | 'delete' | 'list'
        path: 'string',
        content: 'string?'
      },
      execute: async (params) => this.executeFileOperation(params)
    });

    // Code Editor
    this.registerTool({
      name: 'code_editor',
      description: 'Advanced code editing and generation',
      parameters: {
        language: 'string',
        content: 'string',
        operation: 'string' // 'create' | 'edit' | 'analyze'
      },
      execute: async (params) => this.executeCodeOperation(params)
    });

    // GitHub API
    this.registerTool({
      name: 'github_api',
      description: 'Interact with GitHub repositories',
      parameters: {
        operation: 'string',
        repo: 'string?',
        data: 'any'
      },
      execute: async (params) => this.executeGitHubOperation(params)
    });

    // Terminal/CLI
    this.registerTool({
      name: 'terminal',
      description: 'Execute command line operations',
      parameters: {
        command: 'string',
        cwd: 'string?'
      },
      execute: async (params) => this.executeTerminalCommand(params)
    });

    // Database Operations
    this.registerTool({
      name: 'database',
      description: 'Database operations and queries',
      parameters: {
        operation: 'string',
        query: 'string?',
        data: 'any?'
      },
      execute: async (params) => this.executeDatabaseOperation(params)
    });
  }

  canHandleTask(task: Task): boolean {
    const developmentKeywords = [
      'code', 'develop', 'implement', 'build', 'create',
      'debug', 'fix', 'bug', 'error', 'optimize',
      'api', 'database', 'frontend', 'backend',
      'react', 'nextjs', 'typescript', 'javascript',
      'architecture', 'system', 'design'
    ];

    const taskText = (task.title + ' ' + task.description + ' ' + task.type).toLowerCase();
    return developmentKeywords.some(keyword => taskText.includes(keyword));
  }

  async executeTask(task: Task): Promise<any> {
    console.log(`🔧 Developer Agent executing task: ${task.title}`);

    try {
      // Analyze task type and determine approach
      const approach = this.determineApproach(task);
      
      switch (approach.type) {
        case 'implementation':
          return await this.handleImplementationTask(task, approach);
        case 'debugging':
          return await this.handleDebuggingTask(task, approach);
        case 'review':
          return await this.handleCodeReviewTask(task, approach);
        case 'architecture':
          return await this.handleArchitectureTask(task, approach);
        default:
          return await this.handleGenericDevelopmentTask(task);
      }
    } catch (error) {
      // If task is too complex or requires other expertise, request handoff
      if (this.shouldHandoff(task, error)) {
        await this.requestAppropriateHandoff(task, error);
        return { status: 'handed_off', error: error instanceof Error ? error.message : 'Unknown error' };
      }
      throw error;
    }
  }

  private determineApproach(task: Task): { type: string; confidence: number; tools: string[] } {
    const taskText = (task.title + ' ' + task.description).toLowerCase();

    if (taskText.includes('implement') || taskText.includes('build') || taskText.includes('create')) {
      return { type: 'implementation', confidence: 0.9, tools: ['code_editor', 'file_system', 'github_api'] };
    }
    
    if (taskText.includes('debug') || taskText.includes('fix') || taskText.includes('bug')) {
      return { type: 'debugging', confidence: 0.9, tools: ['code_editor', 'terminal', 'file_system'] };
    }

    if (taskText.includes('review') || taskText.includes('analyze')) {
      return { type: 'review', confidence: 0.8, tools: ['code_editor', 'file_system'] };
    }

    if (taskText.includes('architecture') || taskText.includes('design') || taskText.includes('system')) {
      return { type: 'architecture', confidence: 0.8, tools: ['architecture_planner', 'database'] };
    }

    return { type: 'generic', confidence: 0.5, tools: ['code_editor', 'file_system'] };
  }

  private async handleImplementationTask(task: Task, approach: any): Promise<any> {
    // Implementation logic for creating new features/components
    const steps = [
      'Analyze requirements',
      'Design solution architecture', 
      'Implement core functionality',
      'Write tests',
      'Documentation'
    ];

    const results = [];
    for (const step of steps) {
      console.log(`📋 ${step}...`);
      
      // Simulate implementation work
      await new Promise(resolve => setTimeout(resolve, 100));
      results.push({ step, status: 'completed' });
    }

    return {
      type: 'implementation',
      steps: results,
      files_created: ['src/components/NewFeature.tsx', 'src/types/feature.ts'],
      tests_written: ['tests/feature.test.ts'],
      documentation: 'README updated with new feature documentation'
    };
  }

  private async handleDebuggingTask(task: Task, approach: any): Promise<any> {
    const debugSteps = [
      'Reproduce issue',
      'Analyze error logs',
      'Identify root cause',
      'Implement fix',
      'Test solution'
    ];

    const results = [];
    for (const step of debugSteps) {
      console.log(`🐛 ${step}...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      results.push({ step, status: 'completed' });
    }

    return {
      type: 'debugging',
      issue_resolved: true,
      steps: results,
      root_cause: 'Example: Async/await handling in API call',
      fix_applied: 'Added proper error handling and timeout management'
    };
  }

  private async handleCodeReviewTask(task: Task, approach: any): Promise<any> {
    return {
      type: 'code_review',
      issues_found: 2,
      suggestions: [
        'Add TypeScript types for better type safety',
        'Extract common logic into reusable utility functions'
      ],
      performance_improvements: [
        'Implement code splitting for better load times'
      ],
      security_considerations: [
        'Validate input parameters before processing'
      ]
    };
  }

  private async handleArchitectureTask(task: Task, approach: any): Promise<any> {
    return {
      type: 'architecture',
      system_design: 'Multi-layer architecture with clear separation of concerns',
      components: ['Frontend (Next.js)', 'API Layer (Node.js)', 'Database (PostgreSQL)'],
      scalability_considerations: 'Horizontal scaling ready with stateless design',
      technology_recommendations: {
        frontend: 'Next.js with TypeScript',
        backend: 'Node.js with Express',
        database: 'PostgreSQL with Supabase',
        deployment: 'Vercel for frontend, AWS/Railway for backend'
      }
    };
  }

  private async handleGenericDevelopmentTask(task: Task): Promise<any> {
    return {
      type: 'generic_development',
      status: 'completed',
      approach: 'Applied general development best practices',
      output: 'Task completed using standard development workflow'
    };
  }

  private shouldHandoff(task: Task, error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const taskText = (task.title + ' ' + task.description).toLowerCase();

    // Handoff to Designer for UI/UX tasks
    if (taskText.includes('design') && (taskText.includes('ui') || taskText.includes('ux'))) {
      return true;
    }

    // Handoff to Analyst for data analysis
    if (taskText.includes('analyze data') || taskText.includes('analytics')) {
      return true;
    }

    // Handoff to Research for information gathering
    if (taskText.includes('research') || taskText.includes('investigate')) {
      return true;
    }

    return false;
  }

  private async requestAppropriateHandoff(task: Task, error: any): Promise<void> {
    const taskText = (task.title + ' ' + task.description).toLowerCase();
    
    let targetAgent: AgentType;
    let reason: string;

    if (taskText.includes('design') && (taskText.includes('ui') || taskText.includes('ux'))) {
      targetAgent = AgentType.DESIGNER;
      reason = 'Task requires UI/UX design expertise';
    } else if (taskText.includes('analyze data') || taskText.includes('analytics')) {
      targetAgent = AgentType.ANALYST;
      reason = 'Task requires data analysis expertise';
    } else if (taskText.includes('research') || taskText.includes('investigate')) {
      targetAgent = AgentType.RESEARCH;
      reason = 'Task requires research and information gathering';
    } else {
      targetAgent = AgentType.PROJECT_MANAGER;
      reason = 'Task complexity requires project management oversight';
    }

    await this.requestHandoff(targetAgent, task, reason, {
      error_encountered: error instanceof Error ? error.message : String(error),
      developer_analysis: 'Task requires specialized expertise outside development domain'
    });
  }

  // Tool execution methods
  private async executeFileOperation(params: any): Promise<ToolResult> {
    // Simulate file operations
    return {
      success: true,
      data: { operation: params.operation, path: params.path },
      metadata: { timestamp: new Date() }
    };
  }

  private async executeCodeOperation(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: { 
        language: params.language,
        operation: params.operation,
        result: 'Code operation completed successfully'
      }
    };
  }

  private async executeGitHubOperation(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: { operation: params.operation, repo: params.repo }
    };
  }

  private async executeTerminalCommand(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: { 
        command: params.command,
        output: 'Command executed successfully'
      }
    };
  }

  private async executeDatabaseOperation(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: { operation: params.operation, result: 'Database operation completed' }
    };
  }

  // Override message handling for development-specific collaboration
  protected async handleCollaborationRequest(communication: AgentCommunication): Promise<void> {
    const message = communication.message.toLowerCase();
    
    if (message.includes('code review')) {
      await this.sendMessage(
        communication.fromAgent,
        'I can help with code review. Please share the code files or repository.',
        'collaboration',
        communication.taskId
      );
    } else if (message.includes('technical consultation')) {
      await this.sendMessage(
        communication.fromAgent,
        'Available for technical consultation on architecture, implementation, or debugging.',
        'collaboration',
        communication.taskId
      );
    } else {
      await super.handleCollaborationRequest(communication);
    }
  }
}

export default DeveloperAgent;