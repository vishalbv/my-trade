import express from "express";
import { sendResponse } from "@repo/utils/server/helpers";
import dbService from "../services/db";
import moment from "moment";

interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  priority: boolean;
}

export const declareTaskApis = (app: express.Application) => {
  // Create new task
  app.post("/api/tasks", async function (req, res) {
    try {
      const task: Task = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description || "",
        createdAt: moment().valueOf(),
        updatedAt: moment().valueOf(),
        priority: req.body.priority || false,
        completed: false,
      };

      await dbService.createDocument("tasks", task);
      sendResponse(res, {
        status: 200,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to create task",
      });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async function (req, res) {
    try {
      const tasks = await dbService.getDocuments("tasks");
      sendResponse(res, {
        status: 200,
        message: "Tasks retrieved successfully",
        data: tasks,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to fetch tasks",
      });
    }
  });

  // Update task
  app.put("/api/tasks/:id", async function (req, res) {
    try {
      const taskId = req.params.id;
      const updatedTask = {
        ...req.body,
        updatedAt: moment().valueOf(),
      };

      await dbService.updateDocument("tasks", taskId, updatedTask);
      sendResponse(res, {
        status: 200,
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to update task",
      });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", async function (req, res) {
    try {
      const taskId = req.params.id;
      await dbService.deleteDocument("tasks", taskId);
      sendResponse(res, {
        status: 200,
        message: "Task deleted successfully",
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to delete task",
      });
    }
  });
};
