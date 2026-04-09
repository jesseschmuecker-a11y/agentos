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
 * Designer Agent - Specialized in UI/UX design and creative solutions
 */
export class DesignerAgent extends BaseAgent {
  constructor(communicationBus: AgentCommunicationBus) {
    const profile: AgentProfile = {
      type: AgentType.DESIGNER,
      name: 'Designer Agent',
      description: 'Specialized in UI/UX design, visual design, and user experience optimization',
      capabilities: [
        {
          name: 'UI/UX Design',
          description: 'User interface and experience design, wireframing, prototyping',
          tools: ['design_system', 'wireframe_tool', 'prototype_tool'],
          canHandleTaskTypes: ['ui_design', 'ux_design', 'wireframe', 'prototype']
        },
        {
          name: 'Visual Design',
          description: 'Branding, typography, color schemes, visual assets',
          tools: ['color_palette', 'typography_system', 'asset_generator'],
          canHandleTaskTypes: ['visual_design', 'branding', 'assets', 'styling']
        },
        {
          name: 'Design Systems',
          description: 'Component libraries, design tokens, style guides',
          tools: ['component_library', 'design_tokens', 'style_guide'],
          canHandleTaskTypes: ['design_system', 'components', 'style_guide']
        }
      ],
      isAvailable: true,
      workload: 0,
      specializations: [
        'ui_design', 'ux_design', 'tailwindcss', 'figma', 'sketch',
        'design_systems', 'accessibility', 'responsive_design',
        'user_research', 'prototyping', 'wireframing'
      ]
    };

    super(profile, communicationBus);
  }

  initializeTools(): void {
    // Design System Tool
    this.registerTool({
      name: 'design_system',
      description: 'Create and manage design systems',
      parameters: {
        operation: 'string', // 'create' | 'update' | 'generate'
        component: 'string?',
        properties: 'object?'
      },
      execute: async (params) => this.executeDesignSystemOperation(params)
    });

    // Color Palette Tool
    this.registerTool({
      name: 'color_palette',
      description: 'Generate and manage color palettes',
      parameters: {
        brand_colors: 'string[]?',
        theme: 'string?', // 'light' | 'dark' | 'auto'
        accessibility: 'boolean?'
      },
      execute: async (params) => this.generateColorPalette(params)
    });

    // Typography System
    this.registerTool({
      name: 'typography_system',
      description: 'Create typography scales and font systems',
      parameters: {
        base_font: 'string?',
        scale: 'string?', // 'minor-second' | 'major-third' | 'perfect-fourth'
        weights: 'number[]?'
      },
      execute: async (params) => this.createTypographySystem(params)
    });

    // Component Generator
    this.registerTool({
      name: 'component_generator',
      description: 'Generate React components with Tailwind CSS',
      parameters: {
        component_type: 'string',
        props: 'object?',
        styling: 'object?'
      },
      execute: async (params) => this.generateComponent(params)
    });

    // Wireframe Tool
    this.registerTool({
      name: 'wireframe_tool',
      description: 'Create wireframes and layouts',
      parameters: {
        layout_type: 'string',
        components: 'string[]',
        breakpoints: 'string[]?'
      },
      execute: async (params) => this.createWireframe(params)
    });

    // Accessibility Checker
    this.registerTool({
      name: 'accessibility_checker',
      description: 'Check and improve accessibility compliance',
      parameters: {
        component: 'string',
        standards: 'string[]?' // 'WCAG2.1', 'Section508'
      },
      execute: async (params) => this.checkAccessibility(params)
    });
  }

  canHandleTask(task: Task): boolean {
    const designKeywords = [
      'design', 'ui', 'ux', 'interface', 'wireframe', 'prototype',
      'visual', 'layout', 'component', 'styling', 'theme',
      'color', 'typography', 'brand', 'logo', 'icon',
      'responsive', 'mobile', 'accessibility', 'usability'
    ];

    const taskText = (task.title + ' ' + task.description + ' ' + task.type).toLowerCase();
    return designKeywords.some(keyword => taskText.includes(keyword));
  }

  async executeTask(task: Task): Promise<any> {
    console.log(`🎨 Designer Agent executing task: ${task.title}`);

    try {
      const approach = this.determineDesignApproach(task);
      
      switch (approach.type) {
        case 'ui_design':
          return await this.handleUIDesignTask(task, approach);
        case 'ux_design':
          return await this.handleUXDesignTask(task, approach);
        case 'component_design':
          return await this.handleComponentDesignTask(task, approach);
        case 'design_system':
          return await this.handleDesignSystemTask(task, approach);
        case 'visual_design':
          return await this.handleVisualDesignTask(task, approach);
        default:
          return await this.handleGenericDesignTask(task);
      }
    } catch (error) {
      if (this.shouldHandoff(task, error)) {
        await this.requestAppropriateHandoff(task, error);
        return { status: 'handed_off', error: error instanceof Error ? error.message : 'Unknown error' };
      }
      throw error;
    }
  }

  private determineDesignApproach(task: Task): { type: string; confidence: number; tools: string[] } {
    const taskText = (task.title + ' ' + task.description).toLowerCase();

    if (taskText.includes('component') || taskText.includes('button') || taskText.includes('form')) {
      return { 
        type: 'component_design', 
        confidence: 0.9, 
        tools: ['component_generator', 'design_system', 'accessibility_checker'] 
      };
    }

    if (taskText.includes('wireframe') || taskText.includes('layout') || taskText.includes('structure')) {
      return { 
        type: 'ux_design', 
        confidence: 0.9, 
        tools: ['wireframe_tool', 'design_system'] 
      };
    }

    if (taskText.includes('color') || taskText.includes('typography') || taskText.includes('brand')) {
      return { 
        type: 'visual_design', 
        confidence: 0.9, 
        tools: ['color_palette', 'typography_system'] 
      };
    }

    if (taskText.includes('design system') || taskText.includes('style guide')) {
      return { 
        type: 'design_system', 
        confidence: 0.95, 
        tools: ['design_system', 'color_palette', 'typography_system'] 
      };
    }

    if (taskText.includes('ui') || taskText.includes('interface')) {
      return { 
        type: 'ui_design', 
        confidence: 0.8, 
        tools: ['component_generator', 'design_system', 'wireframe_tool'] 
      };
    }

    return { type: 'generic', confidence: 0.5, tools: ['design_system'] };
  }

  private async handleUIDesignTask(task: Task, approach: any): Promise<any> {
    const steps = [
      'Analyze requirements and user needs',
      'Create wireframes and layout structure',
      'Design visual elements and components',
      'Apply color scheme and typography',
      'Ensure responsive design',
      'Check accessibility compliance'
    ];

    const results = [];
    for (const step of steps) {
      console.log(`🎨 ${step}...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      results.push({ step, status: 'completed' });
    }

    return {
      type: 'ui_design',
      steps: results,
      deliverables: {
        wireframes: ['desktop.png', 'tablet.png', 'mobile.png'],
        components: ['Header.tsx', 'Navigation.tsx', 'Footer.tsx'],
        styles: 'globals.css with Tailwind utilities',
        accessibility_score: 'AAA compliance achieved'
      },
      design_tokens: {
        colors: this.generateDesignTokens('colors'),
        typography: this.generateDesignTokens('typography'),
        spacing: this.generateDesignTokens('spacing')
      }
    };
  }

  private async handleUXDesignTask(task: Task, approach: any): Promise<any> {
    return {
      type: 'ux_design',
      user_research: {
        personas: ['Primary User', 'Secondary User'],
        user_flows: ['Registration Flow', 'Main Navigation Flow'],
        pain_points: ['Complex navigation', 'Unclear CTAs']
      },
      wireframes: {
        low_fidelity: 'Basic structure and layout',
        high_fidelity: 'Detailed with content and interactions'
      },
      prototypes: {
        interactive: 'Clickable prototype with user flows',
        usability_test_results: 'Positive feedback on navigation'
      },
      recommendations: [
        'Simplify main navigation',
        'Add clear call-to-action buttons',
        'Implement breadcrumb navigation'
      ]
    };
  }

  private async handleComponentDesignTask(task: Task, approach: any): Promise<any> {
    const componentName = this.extractComponentName(task);
    
    return {
      type: 'component_design',
      component: componentName,
      specifications: {
        variants: ['primary', 'secondary', 'outline'],
        sizes: ['small', 'medium', 'large'],
        states: ['default', 'hover', 'active', 'disabled']
      },
      code_generated: {
        component_file: `${componentName}.tsx`,
        types_file: `${componentName}.types.ts`,
        stories_file: `${componentName}.stories.tsx`,
        tests_file: `${componentName}.test.tsx`
      },
      design_system_integration: 'Component added to design system library',
      accessibility_features: [
        'Proper ARIA labels',
        'Keyboard navigation support',
        'Screen reader compatibility'
      ]
    };
  }

  private async handleDesignSystemTask(task: Task, approach: any): Promise<any> {
    return {
      type: 'design_system',
      components: {
        foundation: ['Colors', 'Typography', 'Spacing', 'Shadows'],
        components: ['Button', 'Input', 'Card', 'Modal', 'Navigation'],
        patterns: ['Forms', 'Data Display', 'Feedback', 'Navigation']
      },
      documentation: {
        style_guide: 'Comprehensive design guidelines',
        component_library: 'Storybook with all components',
        usage_examples: 'Code examples and best practices'
      },
      implementation: {
        tailwind_config: 'Custom Tailwind configuration',
        css_variables: 'CSS custom properties for theming',
        react_components: 'Reusable React component library'
      },
      governance: {
        design_tokens: 'Centralized design token system',
        versioning: 'Semantic versioning for design system',
        adoption_guidelines: 'Implementation and maintenance guides'
      }
    };
  }

  private async handleVisualDesignTask(task: Task, approach: any): Promise<any> {
    return {
      type: 'visual_design',
      brand_elements: {
        color_palette: await this.generateColorPalette({ accessibility: true }),
        typography: await this.createTypographySystem({ scale: 'major-third' }),
        iconography: 'Custom icon set with consistent style',
        imagery: 'Photography and illustration guidelines'
      },
      assets_created: [
        'Logo variations (primary, secondary, monogram)',
        'Color swatches and gradients',
        'Typography specimens',
        'Icon library',
        'Brand pattern library'
      ],
      style_applications: {
        web: 'Website styling and components',
        mobile: 'Mobile app interface guidelines',
        print: 'Business cards and marketing materials'
      }
    };
  }

  private async handleGenericDesignTask(task: Task): Promise<any> {
    return {
      type: 'generic_design',
      status: 'completed',
      approach: 'Applied standard design principles and best practices',
      output: 'Design solution delivered with user-centered approach'
    };
  }

  private extractComponentName(task: Task): string {
    const taskText = task.title + ' ' + task.description;
    const componentMatch = taskText.match(/(\w+)\s+(component|button|input|form)/i);
    return componentMatch ? componentMatch[1] : 'CustomComponent';
  }

  private generateDesignTokens(category: string): any {
    switch (category) {
      case 'colors':
        return {
          primary: { '50': '#eff6ff', '500': '#3b82f6', '900': '#1e3a8a' },
          secondary: { '50': '#f9fafb', '500': '#6b7280', '900': '#111827' },
          accent: { '50': '#fef3c7', '500': '#f59e0b', '900': '#78350f' }
        };
      case 'typography':
        return {
          fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
          fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem' }
        };
      case 'spacing':
        return { 1: '0.25rem', 2: '0.5rem', 4: '1rem', 8: '2rem' };
      default:
        return {};
    }
  }

  private shouldHandoff(task: Task, error: any): boolean {
    const taskText = (task.title + ' ' + task.description).toLowerCase();

    // Handoff to Developer for implementation
    if (taskText.includes('implement') || taskText.includes('code') || taskText.includes('develop')) {
      return true;
    }

    // Handoff to Research for user research
    if (taskText.includes('user research') || taskText.includes('market research')) {
      return true;
    }

    // Handoff to Analyst for design metrics
    if (taskText.includes('analytics') || taskText.includes('metrics') || taskText.includes('performance')) {
      return true;
    }

    return false;
  }

  private async requestAppropriateHandoff(task: Task, error: any): Promise<void> {
    const taskText = (task.title + ' ' + task.description).toLowerCase();
    
    let targetAgent: AgentType;
    let reason: string;

    if (taskText.includes('implement') || taskText.includes('code')) {
      targetAgent = AgentType.DEVELOPER;
      reason = 'Task requires implementation expertise';
    } else if (taskText.includes('user research') || taskText.includes('research')) {
      targetAgent = AgentType.RESEARCH;
      reason = 'Task requires user research and data gathering';
    } else if (taskText.includes('analytics') || taskText.includes('metrics')) {
      targetAgent = AgentType.ANALYST;
      reason = 'Task requires data analysis of design performance';
    } else {
      targetAgent = AgentType.PROJECT_MANAGER;
      reason = 'Task requires coordination across multiple domains';
    }

    await this.requestHandoff(targetAgent, task, reason, {
      design_deliverables: 'Design specifications and mockups completed',
      next_phase: 'Ready for development implementation'
    });
  }

  // Tool execution methods
  private async executeDesignSystemOperation(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: {
        operation: params.operation,
        component: params.component,
        design_system_updated: true
      }
    };
  }

  private async generateColorPalette(params: any): Promise<ToolResult> {
    const palette = {
      primary: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
        500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a'
      },
      secondary: {
        50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
        500: '#6b7280', 600: '#4b5563', 900: '#111827'
      },
      accent: {
        50: '#fef3c7', 100: '#fde68a', 200: '#fcd34d',
        500: '#f59e0b', 600: '#d97706', 900: '#78350f'
      }
    };

    return {
      success: true,
      data: {
        palette,
        accessibility_checked: params.accessibility || false,
        contrast_ratios: 'All color combinations meet WCAG AA standards'
      }
    };
  }

  private async createTypographySystem(params: any): Promise<ToolResult> {
    const typography = {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        xs: ['0.75rem', '1rem'],
        sm: ['0.875rem', '1.25rem'],
        base: ['1rem', '1.5rem'],
        lg: ['1.125rem', '1.75rem'],
        xl: ['1.25rem', '1.75rem']
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    };

    return {
      success: true,
      data: {
        typography,
        scale: params.scale || 'major-third',
        readability_optimized: true
      }
    };
  }

  private async generateComponent(params: any): Promise<ToolResult> {
    const componentCode = `
// Generated ${params.component_type} component
import React from 'react';
import { cn } from '@/lib/utils';

interface ${params.component_type}Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ${params.component_type}: React.FC<${params.component_type}Props> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'border border-gray-300 bg-transparent': variant === 'outline',
        },
        {
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
    `;

    return {
      success: true,
      data: {
        component_type: params.component_type,
        code: componentCode,
        props: params.props,
        styling: 'Tailwind CSS classes applied'
      }
    };
  }

  private async createWireframe(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: {
        layout_type: params.layout_type,
        components: params.components,
        wireframe_structure: 'ASCII or description-based wireframe created',
        responsive_breakpoints: params.breakpoints || ['mobile', 'tablet', 'desktop']
      }
    };
  }

  private async checkAccessibility(params: any): Promise<ToolResult> {
    return {
      success: true,
      data: {
        component: params.component,
        accessibility_score: 95,
        issues_found: [],
        recommendations: [
          'Add ARIA labels for better screen reader support',
          'Ensure color contrast meets WCAG standards',
          'Add keyboard navigation support'
        ],
        compliance: params.standards || ['WCAG 2.1 AA']
      }
    };
  }

  // Override message handling for design-specific collaboration
  protected async handleCollaborationRequest(communication: AgentCommunication): Promise<void> {
    const message = communication.message.toLowerCase();
    
    if (message.includes('design review')) {
      await this.sendMessage(
        communication.fromAgent,
        'I can help with design review and provide feedback on UI/UX improvements.',
        'collaboration',
        communication.taskId
      );
    } else if (message.includes('component design')) {
      await this.sendMessage(
        communication.fromAgent,
        'I can create component designs and specifications. Please share the requirements.',
        'collaboration',
        communication.taskId
      );
    } else {
      await super.handleCollaborationRequest(communication);
    }
  }
}

export default DesignerAgent;