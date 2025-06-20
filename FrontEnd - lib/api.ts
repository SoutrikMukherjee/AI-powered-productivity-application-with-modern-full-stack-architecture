import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  estimated_hours?: number;
  due_date?: string;
  completed: boolean;
  project_id?: number;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string;
  project_id?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: number;
  estimated_hours?: number;
  due_date?: string;
  completed?: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

// Auth API
export const authAPI = {
  register: async (data: RegisterInput) => {
    const response = await api.post('/register', data);
    return response.data;
  },
  
  login: async (data: LoginInput) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  list: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  
  create: async (data: CreateProjectInput): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  list: async (params?: { completed?: boolean; project_id?: number }): Promise<Task[]> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  
  create: async (data: CreateTaskInput): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  
  update: async (id: number, data: UpdateTaskInput): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  query: async (query: string): Promise<{ response: string }> => {
    const response = await api.post('/ai/query', { query });
    return response.data;
  },
  
  breakdown: async (goal: string): Promise<{ project_id: number; subtasks: Array<{ title: string; estimated_hours: number }> }> => {
    const response = await api.post('/ai/breakdown', { goal });
    return response.data;
  },
};
