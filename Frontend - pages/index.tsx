import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { tasksAPI, projectsAPI } from '../lib/api';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.list(),
    enabled: !!session,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list(),
    enabled: !!session,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || tasksLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const overdueTasks = incompleteTasks.filter(task => 
    task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
  );
  const todayTasks = incompleteTasks.filter(task => 
    task.due_date && isToday(new Date(task.due_date))
  );
  const upcomingTasks = incompleteTasks.filter(task => 
    task.due_date && !isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
  );

  const totalEstimatedHours = incompleteTasks.reduce((sum, task) => 
    sum + (task.estimated_hours || 0), 0
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your productivity overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tasks
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {incompleteTasks.length}
                      </div>
                      <div className="ml-2 text-sm text-gray-600">
                        ({totalEstimatedHours.toFixed(1)}h estimated)
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-2xl font-semibold text-red-600">
                      {overdueTasks.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Due Today
                    </dt>
                    <dd className="text-2xl font-semibold text-blue-600">
                      {todayTasks.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-2xl font-semibold text-green-600">
                      {completedTasks.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/tasks?action=new')}
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Task
            </button>
            <button
              onClick={() => router.push('/ai?action=breakdown')}
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              AI Goal Breakdown
            </button>
            <button
              onClick={() => router.push('/ai')}
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>

        {/* Priority Tasks */}
        {incompleteTasks.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Priority Tasks
            </h2>
            <div className="space-y-3">
              {incompleteTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push('/tasks')}
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h3>
                    <div className="mt-1 flex items-center space-x-3">
                      {task.estimated_hours && (
                        <span className="text-xs text-gray-500">
                          {task.estimated_hours}h estimated
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`text-xs ${
                          isPast(new Date(task.due_date)) 
                            ? 'text-red-600' 
                            : isToday(new Date(task.due_date))
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }`}>
                          {isToday(new Date(task.due_date))
                            ? 'Due today'
                            : isTomorrow(new Date(task.due_date))
                            ? 'Due tomorrow'
                            : `Due ${format(new Date(task.due_date), 'MMM d')}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority <= 2
                      ? 'bg-red-100 text-red-800'
                      : task.priority <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    P{task.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
