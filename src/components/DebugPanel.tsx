import React, { useState } from 'react';
import { addSampleData } from '@/lib/addSampleData';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

export function DebugPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { articles, videos, faqs, loading, refreshArticles, refreshVideos, refreshFAQs } = useApp();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleAddSampleData = async () => {
    setIsLoading(true);
    addLog("Starting to add sample data...");
    
    try {
      await addSampleData();
      addLog("Sample data added successfully!");
      
      // Refresh data
      await Promise.all([
        refreshArticles(),
        refreshVideos(), 
        refreshFAQs()
      ]);
      addLog("Data refreshed from database!");
      
    } catch (error) {
      console.error("Error adding sample data:", error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    addLog("Refreshing data...");
    
    try {
      await Promise.all([
        refreshArticles(),
        refreshVideos(), 
        refreshFAQs()
      ]);
      addLog("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Debug Panel</h3>
      
      <div className="space-y-2 mb-3">
        <Button
          onClick={handleAddSampleData}
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Add Sample Data'}
        </Button>
        
        <Button
          onClick={handleRefreshData}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="w-full"
        >
          Refresh Data
        </Button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>Articles: {loading ? 'Loading...' : articles.length}</div>
        <div>Videos: {loading ? 'Loading...' : videos.length}</div>
        <div>FAQs: {loading ? 'Loading...' : faqs.length}</div>
      </div>
      
      <div className="mt-2 max-h-32 overflow-y-auto">
        <div className="text-xs font-mono space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-gray-600">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}