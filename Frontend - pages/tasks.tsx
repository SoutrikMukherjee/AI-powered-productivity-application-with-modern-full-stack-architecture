import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { tasksAPI, projectsAPI, Task, CreateTaskInput } from '../lib/api';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskInput>();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', selectedFilter],
    queryFn: () => selectedFilter === 'all' 
      ? tasksAPI.list()
      : tasksAPI.list({ completed: selectedFilter === 'completed' }),
    enabled: !!session,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list(),
    enabled: !!session,
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      setIsCreating(false);
      toast.success('Task created with AI time estimation!');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      tasksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated!');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    if (router.query.action === 'new') {
      setIsCreating(true);
    }
  }, [status, router]);

  const onSubmit = (data: CreateTaskInput) => {
    createTaskMutation.mutate(data);
  };

  const toggleTaskComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { completed: !task.completed }
    });
  };

  if (status === 'loading' || isLoading) {
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <p className="mt-1 text-gray-600">Manage your tasks with AI-powered prioritization</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex space-x-4">
            {(['all', 'active', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedFilter === filter
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Create Task Form */}
        {isCreating && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    {...register('project_id', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    {...register('due_date')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedFilter === 'all' 
                ? 'All Tasks' 
                : selectedFilter === 'active'
                ? 'Active Tasks'
                : 'Completed Tasks'}
              <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tasks found. Create your first task to get started!
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className={`mt-1 flex-shrink-0 h-5 w-5 rounded border-2 ${
                        task.completed
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {task.completed && (
                        <CheckIcon className="h-3 w-3 text-white mx-auto" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${
                        task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        {task.estimated_hours && (
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {task.estimated_hours}h estimated
                          </span>
                        )}
                        
                        {task.due_date && (
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority <= 2
                            ? 'bg-red-100 text-red-800'
                            : task.priority <= 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Priority {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
