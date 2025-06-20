import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { aiAPI } from '../lib/api';
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'breakdown'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    if (router.query.action === 'breakdown') {
      setActiveTab('breakdown');
    }
  }, [status, router]);

  const queryMutation = useMutation({
    mutationFn: aiAPI.query,
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    },
    onError: () => {
      toast.error('Failed to get AI response');
    },
  });

  const breakdownMutation = useMutation({
    mutationFn: aiAPI.breakdown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project created with ${data.subtasks.length} AI-generated tasks!`);
      router.push('/tasks');
    },
    onError: () => {
      toast.error('Failed to breakdown goal');
    },
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    queryMutation.mutate(chatInput);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    breakdownMutation.mutate(goalInput);
  };

  const exampleQueries = [
    "What should I work on next?",
    "How am I tracking toward my monthly goals?",
    "Which tasks are overdue?",
    "What's my most productive time of day?"
  ];

  const exampleGoals = [
    "Launch a new product website",
    "Prepare for a job interview at a tech company",
    "Organize a team building event",
    "Learn React and build a portfolio"
  ];

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow rounded-lg p-6 text-white">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="mt-1 text-purple-100">
                Get intelligent help with task prioritization and project planning
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
                Chat Assistant
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'breakdown'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <RocketLaunchIcon className="h-5 w-5 inline mr-2" />
                Goal Breakdown
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Ask me anything about your tasks and productivity!
                      </p>
                      <div className="mt-6 space-y-2">
                        {exampleQueries.map((query, idx) => (
                          <button
                            key={idx}
                            onClick={() => setInput(query)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <ChevronRightIcon className="h-4 w-4 inline mr-2" />
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 shadow'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {queryMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-white shadow rounded-lg px-4 py-2">
                        <div className="animate-pulse flex space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your tasks..."
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={queryMutation.isPending || !chatInput.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    AI-Powered Goal Breakdown
                  </h2>
                  <p className="text-gray-600">
                    Describe your goal, and our AI will break it down into actionable tasks with time estimates.
                  </p>
                </div>

                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your goal?
                    </label>
                    <textarea
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      rows={4}
                      placeholder="E.g., Launch a new product website by next month"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={breakdownMutation.isPending || !goalInput.trim()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    <LightBulbIcon className="h-5 w-5 mr-2" />
                    {breakdownMutation.isPending ? 'Generating Tasks...' : 'Generate Tasks with AI'}
                  </button>
                </form>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Example Goals:
                  </h3>
                  <div className="space-y-2">
                    {exampleGoals.map((goal, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGoalInput(goal)}
                        className="block w-full text-left px-3 py-2 text-sm text-blue-700 bg-white rounded hover:bg-blue-100 transition-colors"
                      >
                        <ChevronRightIcon className="h-4 w-4 inline mr-2" />
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
