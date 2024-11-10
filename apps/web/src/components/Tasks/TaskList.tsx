import { useState, useEffect } from "react";

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../../store/actions/taskActions";
import moment from "moment";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Button } from "@repo/ui/button";
import { Pencil, Trash2, CheckCheck, Star } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  priority?: boolean;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: false,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  console.log("tasks", tasks);

  const loadTasks = async () => {
    const response = await getTasks();
    setTasks(Array.isArray(response) ? response : []);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    await createTask(newTask);
    setNewTask({ title: "", description: "", priority: false });
    loadTasks();
  };

  const handleUpdateTask = async (task: Task) => {
    await updateTask(task.id, task);
    setEditingTask(null);
    loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    loadTasks();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card className={`mb-6 ${newTask.priority ? "bg-red-400/5" : ""}`}>
        <CardContent className="p-4 text-center">
          <div className="flex gap-2">
            <Input
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              className="mb-3 flex-1"
            />
            <Button
              variant="primary-hover"
              size="icon"
              className={`hover:bg-orange-100 hover:text-orange-500 ${
                newTask.priority ? "bg-orange-100 text-orange-500" : ""
              }`}
              onClick={() =>
                setNewTask({ ...newTask, priority: !newTask.priority })
              }
            >
              <Star
                className={`h-4 w-4 ${
                  newTask.priority || "hover:fill-orange-500"
                } ${newTask.priority ? "fill-orange-500" : ""}`}
              />
            </Button>
            <Button onClick={handleCreateTask}>Add Task</Button>
          </div>
          <Textarea
            placeholder="Task description (optional)"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
            className="mb-2"
          />
        </CardContent>
      </Card>

      <div className="space-y-4 overflow-y-auto h-[calc(95vh-250px)]">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`${task.priority ? "bg-red-400/5" : ""}`}
          >
            <CardContent className="p-4">
              {editingTask?.id === task.id ? (
                <>
                  <Input
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="mb-2"
                  />
                  <Textarea
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateTask(editingTask)}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingTask(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-stretch justify-between">
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {moment(task.createdAt).format("MMM D, YYYY h:mm A")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 justify-between">
                    <div className="flex gap-2">
                      {!task.completed && (
                        <Button
                          variant="primary-hover"
                          size="icon"
                          onClick={() => setEditingTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="primary-hover"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-300 hover:text-orange-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {!task.completed && (
                      <Button
                        variant="primary"
                        size="icon"
                        className="rounded-full mt-2"
                        onClick={() =>
                          handleUpdateTask({
                            ...task,
                            completed: true,
                          })
                        }
                      >
                        <CheckCheck className="h-6 w-6" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
