import { sendResponse } from "@repo/utils/server/helpers";
import dbService from "../services/db";
import moment from "moment";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  priority: boolean;
}

interface RequestParams {
  id?: string;
}

interface RequestBody {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: boolean;
}

export const declareTaskApis = () => ({
  "POST /api/tasks": async ({ body }: { body: RequestBody }) => {
    try {
      const task: Task = {
        id: "task-" + Date.now().toString(),
        title: body.title || "",
        description: body.description || "",
        completed: false,
        createdAt: moment().valueOf(),
        updatedAt: moment().valueOf(),
        priority: body.priority || false,
      };

      await dbService.createDocument("tasks", task);
      return {
        status: 200,
        message: "Task created successfully",
        data: task,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to create task",
      };
    }
  },

  "GET /api/tasks": async () => {
    try {
      const tasks = await dbService.getDocuments("tasks");
      return {
        status: 200,
        message: "Tasks retrieved successfully",
        data: tasks,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to fetch tasks",
      };
    }
  },

  "PUT /api/tasks/:id": async ({
    body,
    params,
  }: {
    body: RequestBody;
    params: RequestParams;
  }) => {
    try {
      const taskId = params.id;
      const updatedTask = {
        ...body,
        updatedAt: moment().valueOf(),
      };

      await dbService.updateDocument("tasks", taskId!, updatedTask);
      return {
        status: 200,
        message: "Task updated successfully",
        data: updatedTask,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to update task",
      };
    }
  },

  "DELETE /api/tasks/:id": async ({ params }: { params: RequestParams }) => {
    try {
      const taskId = params.id;
      await dbService.deleteDocument("tasks", taskId!);
      return {
        status: 200,
        message: "Task deleted successfully",
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to delete task",
      };
    }
  },
});
