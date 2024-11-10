import express from "express";
import { sendResponse } from "@repo/utils/server/helpers";
import dbService from "../services/db";
import moment from "moment";

interface Note {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  priority: boolean;
}

export const declareNoteApis = (app: express.Application) => {
  // Create new note
  app.post("/api/notes", async function (req, res) {
    try {
      const note: Note = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description || "",
        createdAt: moment().valueOf(),
        updatedAt: moment().valueOf(),
        priority: req.body.priority || false,
      };

      await dbService.createDocument("notes", note);
      sendResponse(res, {
        status: 200,
        message: "Note created successfully",
        data: note,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to create note",
      });
    }
  });

  // Get all notes
  app.get("/api/notes", async function (req, res) {
    try {
      const notes = await dbService.getDocuments("notes");
      sendResponse(res, {
        status: 200,
        message: "Notes retrieved successfully",
        data: notes,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to fetch notes",
      });
    }
  });

  // Update note
  app.put("/api/notes/:id", async function (req, res) {
    try {
      const noteId = req.params.id;
      const updatedNote = {
        ...req.body,
        updatedAt: moment().valueOf(),
      };

      await dbService.updateDocument("notes", noteId, updatedNote);
      sendResponse(res, {
        status: 200,
        message: "Note updated successfully",
        data: updatedNote,
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to update note",
      });
    }
  });

  // Delete note
  app.delete("/api/notes/:id", async function (req, res) {
    try {
      const noteId = req.params.id;
      await dbService.deleteDocument("notes", noteId);
      sendResponse(res, {
        status: 200,
        message: "Note deleted successfully",
      });
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to delete note",
      });
    }
  });
};
