'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove 
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { AgentType } from '../../types/agents';
import { 
  AgentCapability, 
  WorkflowTemplate, 
  WorkflowStep, 
  WorkflowAction 
} from '../../types/orchestration';
import AgentBuilderSidebar from './AgentBuilderSidebar';
import AgentCanvas from './AgentCanvas';
import WorkflowEditor from './WorkflowEditor';
import AgentConfigPanel from './AgentConfigPanel';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Save, Play, Download, Upload, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Main Visual Agent Builder component
 * Provides drag-and-drop interface for creating custom agents
 */

export interface AgentBuilderNode {
  id: string;
  type: 'agent' | 'capability' | 'workflow' | 'connector';
  position: { x: number; y: number };
  data: AgentBuilderNodeData;
  connections: string[];
}

export interface AgentBuilderNodeData {
  label: string;
  agentType?: AgentType;
  capability?: AgentCapability;
  workflow?: WorkflowTemplate;
  config: Record<string, any>;
  isCustom?: boolean;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  baseType: AgentType;
  customCapabilities: AgentCapability[];
  workflows: WorkflowTemplate[];
  configuration: AgentConfiguration;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isActive: boolean;
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  skillLevel: number;
  collaborationStyle: 'independent' | 'collaborative' | 'leader' | 'follower';
  preferredPartners: AgentType[];
  specializations: string[];
  tools: ToolConfiguration[];
  triggers: TriggerConfiguration[];
  notifications: NotificationConfiguration;
}

export interface ToolConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  permissions: string[];
}

export interface TriggerConfiguration {
  id: string;
  name: string;
  event: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface NotificationConfiguration {
  onTaskStart: boolean;
  onTaskComplete: boolean;
  onHandoffRequest: boolean;
  onError: boolean;
  channels: string[];
}

export default function AgentBuilderCanvas() {
  const [nodes, setNodes] = useState<AgentBuilderNode[]>([]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'workflow' | 'config'>('canvas');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [customAgent, setCustomAgent] = useState<CustomAgent | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savedAgents, setSavedAgents] = useState<CustomAgent[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor)
  );

  /**
   * Initialize builder with default agent template
   */
  useEffect(() => {
    initializeDefaultAgent();
    loadSavedAgents();
  }, []);

  const initializeDefaultAgent = () => {
    const defaultAgent: CustomAgent = {
      id: generateId(),
      name: 'Custom Agent',
      description: 'A custom agent built with the Visual Agent Builder',
      baseType: AgentType.DEVELOPER,
      customCapabilities: [],
      workflows: [],
      configuration: {
        maxConcurrentTasks: 2,
        skillLevel: 7,
        collaborationStyle: 'collaborative',
        preferredPartners: [],
        specializations: [],
        tools: [],
        triggers: [],
        notifications: {
          onTaskStart: true,
          onTaskComplete: true,
          onHandoffRequest: true,
          onError: true,
          channels: ['browser']
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isActive: false
    };

    setCustomAgent(defaultAgent);

    // Add initial agent node to canvas
    const agentNode: AgentBuilderNode = {
      id: 'agent-core',
      type: 'agent',
      position: { x: 400, y: 200 },
      data: {
        label: 'Custom Agent',
        agentType: AgentType.DEVELOPER,
        config: defaultAgent.configuration,
        isCustom: true
      },
      connections: []
    };

    setNodes([agentNode]);
  };

  const loadSavedAgents = () => {
    // Load from localStorage for now
    const saved = localStorage.getItem('visual_agent_builder_agents');
    if (saved) {
      setSavedAgents(JSON.parse(saved));
    }
  };

  /**
   * Handle drag start event
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setDraggedItem(active.data.current);
  }, []);

  /**
   * Handle drag end event
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    if (!over) {
      setDraggedItem(null);
      return;
    }

    // Handle drop on canvas
    if (over.id === 'agent-canvas' && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const dropPosition = {
        x: event.activatorEvent ? 
          (event.activatorEvent as PointerEvent).clientX - canvasRect.left :
          400,
        y: event.activatorEvent ? 
          (event.activatorEvent as PointerEvent).clientY - canvasRect.top :
          200
      };

      handleCanvasDrop(active.data.current, dropPosition);
    }

    // Handle node reordering
    if (active.id !== over.id) {
      const oldIndex = nodes.findIndex(node => node.id === active.id);
      const newIndex = nodes.findIndex(node => node.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setNodes(arrayMove(nodes, oldIndex, newIndex));
      }
    }

    setDraggedItem(null);
  }, [nodes]);

  /**
   * Handle item dropped on canvas
   */
  const handleCanvasDrop = useCallback((item: any, position: { x: number; y: number }) => {
    if (!item) return;

    const newNode: AgentBuilderNode = {
      id: generateId(),
      type: item.type,
      position,
      data: {
        label: item.label || item.name,
        ...item,
        config: {}
      },
      connections: []
    };

    setNodes(prev => [...prev, newNode]);
    toast.success(`Added ${item.label || item.name} to canvas`);
  }, []);

  /**
   * Handle node selection
   */
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setActiveTab('config');
  }, []);

  /**
   * Handle node deletion
   */
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    toast.success('Node removed from canvas');
  }, [selectedNode]);

  /**
   * Handle node update
   */
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<AgentBuilderNodeData>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
  }, []);

  /**
   * Handle connection creation between nodes
   */
  const handleConnectionCreate = useCallback((fromId: string, toId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === fromId 
        ? { ...node, connections: [...node.connections, toId] }
        : node
    ));
    toast.success('Connection created');
  }, []);

  /**
   * Save custom agent
   */
  const handleSaveAgent = useCallback(async () => {
    if (!customAgent) return;

    try {
      const updatedAgent: CustomAgent = {
        ...customAgent,
        updatedAt: new Date(),
        version: customAgent.version + 1
      };

      // Update saved agents
      const existingIndex = savedAgents.findIndex(a => a.id === updatedAgent.id);
      let newSavedAgents;
      
      if (existingIndex >= 0) {
        newSavedAgents = [...savedAgents];
        newSavedAgents[existingIndex] = updatedAgent;
      } else {
        newSavedAgents = [...savedAgents, updatedAgent];
      }

      setSavedAgents(newSavedAgents);
      setCustomAgent(updatedAgent);
      
      // Save to localStorage
      localStorage.setItem('visual_agent_builder_agents', JSON.stringify(newSavedAgents));
      
      toast.success('Agent saved successfully!');
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast.error('Failed to save agent');
    }
  }, [customAgent, savedAgents]);

  /**
   * Deploy custom agent
   */
  const handleDeployAgent = useCallback(async () => {
    if (!customAgent) return;

    try {
      // TODO: Integrate with AgentOS to deploy the custom agent
      console.log('Deploying custom agent:', customAgent);
      
      const deployedAgent = {
        ...customAgent,
        isActive: true,
        updatedAt: new Date()
      };
      
      setCustomAgent(deployedAgent);
      toast.success(`Agent "${customAgent.name}" deployed successfully!`);
    } catch (error) {
      console.error('Failed to deploy agent:', error);
      toast.error('Failed to deploy agent');
    }
  }, [customAgent]);

  /**
   * Export agent configuration
   */
  const handleExportAgent = useCallback(() => {
    if (!customAgent) return;

    const exportData = {
      agent: customAgent,
      nodes: nodes,
      metadata: {
        exportedAt: new Date(),
        builderVersion: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customAgent.name.toLowerCase().replace(/\s+/g, '-')}-agent.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Agent exported successfully!');
  }, [customAgent, nodes]);

  /**
   * Import agent configuration
   */
  const handleImportAgent = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.agent && importData.nodes) {
          setCustomAgent(importData.agent);
          setNodes(importData.nodes);
          toast.success('Agent imported successfully!');
        } else {
          throw new Error('Invalid agent file format');
        }
      } catch (error) {
        console.error('Failed to import agent:', error);
        toast.error('Failed to import agent');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, []);

  /**
   * Clear canvas
   */
  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setSelectedNode(null);
    toast.success('Canvas cleared');
  }, []);

  const generateId = () => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="h-screen flex bg-gray-50">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        {/* Sidebar */}
        <AgentBuilderSidebar 
          savedAgents={savedAgents}
          onAgentLoad={setCustomAgent}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Visual Agent Builder
              </h1>
              {customAgent && (
                <span className="text-sm text-gray-500">
                  {customAgent.name} v{customAgent.version}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAgent}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDeployAgent}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Deploy</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAgent}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>

              <label className="button-outline button-sm cursor-pointer flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportAgent}
                  className="hidden"
                />
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCanvas}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="bg-white border-b border-gray-200 px-4">
              <TabsTrigger value="canvas" className="px-6 py-2">
                Canvas
              </TabsTrigger>
              <TabsTrigger value="workflow" className="px-6 py-2">
                Workflows
              </TabsTrigger>
              <TabsTrigger value="config" className="px-6 py-2">
                Configuration
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 flex">
              <TabsContent value="canvas" className="flex-1 m-0">
                <AgentCanvas
                  ref={canvasRef}
                  nodes={nodes}
                  selectedNode={selectedNode}
                  isPreviewMode={isPreviewMode}
                  onNodeSelect={handleNodeSelect}
                  onNodeDelete={handleNodeDelete}
                  onNodeUpdate={handleNodeUpdate}
                  onConnectionCreate={handleConnectionCreate}
                />
              </TabsContent>

              <TabsContent value="workflow" className="flex-1 m-0">
                <WorkflowEditor
                  customAgent={customAgent}
                  onAgentUpdate={setCustomAgent}
                />
              </TabsContent>

              <TabsContent value="config" className="flex-1 m-0">
                <AgentConfigPanel
                  selectedNode={selectedNodeData}
                  customAgent={customAgent}
                  onNodeUpdate={handleNodeUpdate}
                  onAgentUpdate={setCustomAgent}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem && (
            <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-lg">
              <div className="font-medium text-sm">
                {draggedItem.label || draggedItem.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {draggedItem.type}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}