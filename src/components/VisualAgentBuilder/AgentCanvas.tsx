'use client';

import React, { forwardRef, useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AgentBuilderNode } from './AgentBuilderCanvas';
import CanvasNode from './CanvasNode';
import ConnectionLine from './ConnectionLine';
import { Button } from '../ui/Button';
import { ZoomIn, ZoomOut, Maximize, Grid, Move } from 'lucide-react';

/**
 * Canvas component for the Visual Agent Builder
 * Handles node positioning, connections, and canvas interactions
 */

interface AgentCanvasProps {
  nodes: AgentBuilderNode[];
  selectedNode: string | null;
  isPreviewMode: boolean;
  onNodeSelect: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  onConnectionCreate: (fromId: string, toId: string) => void;
}

const AgentCanvas = forwardRef<HTMLDivElement, AgentCanvasProps>(({
  nodes,
  selectedNode,
  isPreviewMode,
  onNodeSelect,
  onNodeDelete,
  onNodeUpdate,
  onConnectionCreate
}, ref) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'agent-canvas'
  });

  /**
   * Handle canvas zoom
   */
  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    setZoom(prevZoom => {
      switch (direction) {
        case 'in':
          return Math.min(prevZoom * 1.2, 3);
        case 'out':
          return Math.max(prevZoom / 1.2, 0.1);
        case 'reset':
          return 1;
        default:
          return prevZoom;
      }
    });
  }, []);

  /**
   * Handle canvas panning
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !e.target || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * Handle node position updates
   */
  const handleNodePositionUpdate = useCallback((nodeId: string, position: { x: number; y: number }) => {
    onNodeUpdate(nodeId, { position });
  }, [onNodeUpdate]);

  /**
   * Handle connection creation
   */
  const handleConnectionStart = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId);
  }, []);

  const handleConnectionEnd = useCallback((nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      onConnectionCreate(connectingFrom, nodeId);
    }
    setConnectingFrom(null);
  }, [connectingFrom, onConnectionCreate]);

  /**
   * Handle canvas click (deselect nodes)
   */
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-background')) {
      onNodeSelect('');
      setConnectingFrom(null);
    }
  }, [onNodeSelect]);

  /**
   * Render connection lines between nodes
   */
  const renderConnections = () => {
    return nodes.flatMap(node =>
      node.connections.map(connectionId => {
        const targetNode = nodes.find(n => n.id === connectionId);
        if (!targetNode) return null;

        return (
          <ConnectionLine
            key={`${node.id}-${connectionId}`}
            from={node.position}
            to={targetNode.position}
            isSelected={selectedNode === node.id || selectedNode === connectionId}
            zoom={zoom}
          />
        );
      }).filter(Boolean)
    );
  };

  /**
   * Calculate grid pattern based on zoom level
   */
  const getGridSize = () => {
    const baseSize = 20;
    return baseSize * zoom;
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-gray-100">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('out')}
            className="p-2"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="px-2 text-sm font-mono text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('in')}
            className="p-2"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('reset')}
            className="p-2"
            title="Fit to View"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 ${showGrid ? 'bg-blue-50 text-blue-600' : ''}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>

        {isPanning && (
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center">
            <Move className="w-3 h-3 mr-1" />
            Panning
          </div>
        )}
      </div>

      {/* Connection Mode Indicator */}
      {connectingFrom && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
            <span>Click another node to connect</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConnectingFrom(null)}
              className="text-white hover:bg-blue-700 p-1 ml-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drop Zone Indicator */}
      {isOver && (
        <div className="absolute inset-4 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded-lg z-10 flex items-center justify-center">
          <div className="text-blue-600 text-lg font-medium">Drop here to add component</div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={`
          relative w-full h-full cursor-${isPanning ? 'grabbing' : 'grab'} 
          ${showGrid ? 'grid-background' : ''}
        `}
        style={{
          backgroundSize: showGrid ? `${getGridSize()}px ${getGridSize()}px` : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          className="canvas-background absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Render connections first (behind nodes) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {renderConnections()}
          </svg>

          {/* Render nodes */}
          {nodes.map(node => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isPreviewMode={isPreviewMode}
              isConnecting={connectingFrom === node.id}
              zoom={zoom}
              onSelect={() => onNodeSelect(node.id)}
              onDelete={() => onNodeDelete(node.id)}
              onPositionUpdate={(position) => handleNodePositionUpdate(node.id, position)}
              onConnectionStart={() => handleConnectionStart(node.id)}
              onConnectionEnd={() => handleConnectionEnd(node.id)}
            />
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <Move className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Agent</h3>
                <p className="text-sm max-w-md">
                  Drag components from the sidebar to create your custom agent.
                  Connect them together to define workflows and interactions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 flex items-center space-x-4">
          <div>Nodes: {nodes.length}</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Pan: {Math.round(pan.x)}, {Math.round(pan.y)}</div>
        </div>
      </div>

      {/* Canvas Styles */}
      <style jsx>{`
        .grid-background {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0);
        }
        
        .canvas-background {
          background: transparent;
        }
        
        .cursor-grab {
          cursor: grab;
        }
        
        .cursor-grabbing {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
});

AgentCanvas.displayName = 'AgentCanvas';

export default AgentCanvas;