'use client';

import { useEffect, useState } from 'react';
import { AgentOSManager } from '@/src/core/AgentOSManager';
import { AgentType, TaskPriority } from '@/src/types/agents';
import Dashboard from '@/src/components/Dashboard';
import LoadingScreen from '@/src/components/LoadingScreen';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [agentOS, setAgentOS] = useState<AgentOSManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAgentOS = async () => {
      try {
        console.log('🚀 Initializing AgentOS...');
        const manager = new AgentOSManager();
        
        await manager.initialize();
        
        setAgentOS(manager);
        setIsInitialized(true);
        
        toast.success('AgentOS initialized successfully!');
        
        // Simulate a welcome workflow
        setTimeout(() => {
          manager.simulateWorkflow();
        }, 2000);
        
      } catch (error) {
        console.error('Failed to initialize AgentOS:', error);
        toast.error('Failed to initialize AgentOS');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAgentOS();

    // Cleanup on unmount
    return () => {
      if (agentOS) {
        agentOS.shutdown();
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isInitialized || !agentOS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            Failed to Initialize AgentOS
          </h2>
          <p className="text-gray-600 mt-2">
            Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="button button-primary button-md mt-4"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard agentOS={agentOS} />
    </div>
  );
}