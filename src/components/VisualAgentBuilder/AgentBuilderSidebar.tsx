'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AgentType } from '../../types/agents';
import { AgentCapability } from '../../types/orchestration';
import { CustomAgent } from './AgentBuilderCanvas';
import { 
  Bot, 
  Palette, 
  BarChart3, 
  Search, 
  Users, 
  Code, 
  Database,
  Globe,
  MessageSquare,
  Settings,
  Zap,
  PlayCircle,
  GitBranch,
  Shield,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

/**
 * Sidebar component for the Visual Agent Builder
 * Contains draggable agent types, capabilities, and tools
 */

interface AgentBuilderSidebarProps {
  savedAgents: CustomAgent[];
  onAgentLoad: (agent: CustomAgent) => void;
}

interface DraggableItemProps {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  data: any;
}

function DraggableItem({ id, type, label, description, icon, data }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type, label, description, ...data }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto'
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        flex items-start space-x-3 p-3 rounded-lg border cursor-move transition-all
        ${isDragging 
          ? 'bg-blue-50 border-blue-300 shadow-lg' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900">{label}</div>
        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</div>
        <Badge variant="secondary" className="mt-1 text-xs">
          {type}
        </Badge>
      </div>
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function SidebarSection({ title, children, defaultExpanded = true }: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-md"
      >
        <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AgentBuilderSidebar({ savedAgents, onAgentLoad }: AgentBuilderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Base agent types with enhanced configurations
  const baseAgentTypes = [
    {
      id: 'developer-agent',
      type: AgentType.DEVELOPER,
      label: 'Developer Agent',
      description: 'Full-stack development, API creation, code review, and debugging',
      icon: <Code className="w-5 h-5" />,
      specializations: ['frontend', 'backend', 'fullstack', 'api', 'database'],
      skillLevel: 9
    },
    {
      id: 'designer-agent',
      type: AgentType.DESIGNER,
      label: 'Designer Agent',
      description: 'UI/UX design, prototyping, design systems, and accessibility',
      icon: <Palette className="w-5 h-5" />,
      specializations: ['ui_design', 'ux_design', 'prototyping', 'accessibility'],
      skillLevel: 8
    },
    {
      id: 'analyst-agent',
      type: AgentType.ANALYST,
      label: 'Analyst Agent',
      description: 'Data analysis, reporting, insights, and business intelligence',
      icon: <BarChart3 className="w-5 h-5" />,
      specializations: ['data_analysis', 'reporting', 'business_intelligence'],
      skillLevel: 8
    },
    {
      id: 'research-agent',
      type: AgentType.RESEARCH,
      label: 'Research Agent',
      description: 'Information gathering, market research, and competitive analysis',
      icon: <Search className="w-5 h-5" />,
      specializations: ['market_research', 'competitive_analysis', 'data_gathering'],
      skillLevel: 7
    },
    {
      id: 'project-manager-agent',
      type: AgentType.PROJECT_MANAGER,
      label: 'Project Manager Agent',
      description: 'Task coordination, workflow management, and team collaboration',
      icon: <Users className="w-5 h-5" />,
      specializations: ['project_management', 'workflow_optimization', 'team_coordination'],
      skillLevel: 8
    }
  ];

  // Available capabilities
  const availableCapabilities: AgentCapability[] = [
    {
      id: 'web-development',
      name: 'Web Development',
      description: 'Build modern web applications using React, Next.js, and TypeScript',
      category: 'technical',
      proficiencyLevel: 9,
      prerequisites: ['javascript', 'html', 'css'],
      compatibleWith: ['api-development', 'database-design']
    },
    {
      id: 'api-development',
      name: 'API Development',
      description: 'Create RESTful APIs and GraphQL endpoints with proper authentication',
      category: 'technical',
      proficiencyLevel: 8,
      prerequisites: ['backend-development'],
      compatibleWith: ['web-development', 'database-design']
    },
    {
      id: 'database-design',
      name: 'Database Design',
      description: 'Design and optimize database schemas, queries, and migrations',
      category: 'technical',
      proficiencyLevel: 8,
      prerequisites: ['sql'],
      compatibleWith: ['api-development', 'data-analysis']
    },
    {
      id: 'ui-design',
      name: 'UI Design',
      description: 'Create beautiful and intuitive user interfaces with modern design principles',
      category: 'creative',
      proficiencyLevel: 9,
      prerequisites: ['design-principles'],
      compatibleWith: ['ux-design', 'prototyping']
    },
    {
      id: 'ux-design',
      name: 'UX Design',
      description: 'Research and design optimal user experiences with user-centered approach',
      category: 'creative',
      proficiencyLevel: 8,
      prerequisites: ['user-research'],
      compatibleWith: ['ui-design', 'user-testing']
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Analyze data patterns, create insights, and generate actionable reports',
      category: 'analytical',
      proficiencyLevel: 8,
      prerequisites: ['statistics', 'data-visualization'],
      compatibleWith: ['business-intelligence', 'reporting']
    },
    {
      id: 'business-intelligence',
      name: 'Business Intelligence',
      description: 'Transform data into business insights and strategic recommendations',
      category: 'analytical',
      proficiencyLevel: 7,
      prerequisites: ['data-analysis', 'business-knowledge'],
      compatibleWith: ['data-analysis', 'reporting']
    },
    {
      id: 'project-coordination',
      name: 'Project Coordination',
      description: 'Coordinate tasks, manage timelines, and facilitate team collaboration',
      category: 'management',
      proficiencyLevel: 8,
      prerequisites: ['project-management'],
      compatibleWith: ['team-leadership', 'communication']
    }
  ];

  // Integration tools
  const integrationTools = [
    {
      id: 'github-integration',
      type: 'integration',
      label: 'GitHub Integration',
      description: 'Connect to GitHub repositories for code management and collaboration',
      icon: <GitBranch className="w-5 h-5" />,
      category: 'version_control'
    },
    {
      id: 'database-connector',
      type: 'integration',
      label: 'Database Connector',
      description: 'Connect to PostgreSQL, MySQL, and other databases',
      icon: <Database className="w-5 h-5" />,
      category: 'data'
    },
    {
      id: 'web-search',
      type: 'integration',
      label: 'Web Search',
      description: 'Search the web for current information and research',
      icon: <Globe className="w-5 h-5" />,
      category: 'information'
    },
    {
      id: 'communication-hub',
      type: 'integration',
      label: 'Communication Hub',
      description: 'Handle inter-agent communication and messaging',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'communication'
    },
    {
      id: 'automation-triggers',
      type: 'integration',
      label: 'Automation Triggers',
      description: 'Set up automated workflows and event-based triggers',
      icon: <Zap className="w-5 h-5" />,
      category: 'automation'
    },
    {
      id: 'security-module',
      type: 'integration',
      label: 'Security Module',
      description: 'Add authentication, authorization, and security features',
      icon: <Shield className="w-5 h-5" />,
      category: 'security'
    }
  ];

  // Workflow components
  const workflowComponents = [
    {
      id: 'task-executor',
      type: 'workflow',
      label: 'Task Executor',
      description: 'Execute specific tasks with configurable parameters',
      icon: <PlayCircle className="w-5 h-5" />,
      category: 'execution'
    },
    {
      id: 'decision-node',
      type: 'workflow',
      label: 'Decision Node',
      description: 'Make decisions based on conditions and route workflow accordingly',
      icon: <GitBranch className="w-5 h-5" />,
      category: 'logic'
    },
    {
      id: 'timer-node',
      type: 'workflow',
      label: 'Timer Node',
      description: 'Add delays, schedules, and time-based triggers to workflows',
      icon: <Clock className="w-5 h-5" />,
      category: 'timing'
    },
    {
      id: 'quality-gate',
      type: 'workflow',
      label: 'Quality Gate',
      description: 'Ensure quality standards are met before proceeding',
      icon: <Star className="w-5 h-5" />,
      category: 'quality'
    }
  ];

  // Filter items based on search query
  const filterItems = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg text-gray-900 mb-3">Agent Builder</h2>
        <Input
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Base Agent Types */}
        <SidebarSection title="Base Agent Types">
          {filterItems(baseAgentTypes).map(agent => (
            <DraggableItem
              key={agent.id}
              id={agent.id}
              type="agent"
              label={agent.label}
              description={agent.description}
              icon={agent.icon}
              data={{
                agentType: agent.type,
                specializations: agent.specializations,
                skillLevel: agent.skillLevel
              }}
            />
          ))}
        </SidebarSection>

        {/* Capabilities */}
        <SidebarSection title="Capabilities">
          {filterItems(availableCapabilities).map(capability => (
            <DraggableItem
              key={capability.id}
              id={capability.id}
              type="capability"
              label={capability.name}
              description={capability.description}
              icon={<Settings className="w-5 h-5" />}
              data={{ capability }}
            />
          ))}
        </SidebarSection>

        {/* Integration Tools */}
        <SidebarSection title="Integration Tools">
          {filterItems(integrationTools).map(tool => (
            <DraggableItem
              key={tool.id}
              id={tool.id}
              type="integration"
              label={tool.label}
              description={tool.description}
              icon={tool.icon}
              data={{ category: tool.category }}
            />
          ))}
        </SidebarSection>

        {/* Workflow Components */}
        <SidebarSection title="Workflow Components">
          {filterItems(workflowComponents).map(component => (
            <DraggableItem
              key={component.id}
              id={component.id}
              type="workflow"
              label={component.label}
              description={component.description}
              icon={component.icon}
              data={{ category: component.category }}
            />
          ))}
        </SidebarSection>

        {/* Saved Agents */}
        <SidebarSection title="Saved Agents" defaultExpanded={false}>
          {savedAgents.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No saved agents yet
            </div>
          ) : (
            savedAgents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    v{agent.version} • {agent.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAgentLoad(agent)}
                  className="ml-2"
                >
                  Load
                </Button>
              </div>
            ))
          )}
        </SidebarSection>

        {/* Quick Actions */}
        <SidebarSection title="Quick Actions" defaultExpanded={false}>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {/* TODO: Create template */}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {/* TODO: Import agent */}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Import Agent
            </Button>
          </div>
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Drag components to canvas to build your custom agent
        </div>
      </div>
    </div>
  );
}