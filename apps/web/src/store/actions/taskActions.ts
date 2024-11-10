import {
  postRequest,
  getRequest,
  putRequest,
  deleteRequest,
} from "../../services/api";

interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  priority?: boolean;
}

export const createTask = (task: Partial<Task>) => {
  return postRequest("tasks", task);
};

export const getTasks = () => {
  return getRequest("tasks");
};

export const updateTask = (id: string, updates: Partial<Task>) => {
  return putRequest(`tasks/${id}`, updates);
};

export const deleteTask = (id: string) => {
  return deleteRequest(`tasks/${id}`);
};
