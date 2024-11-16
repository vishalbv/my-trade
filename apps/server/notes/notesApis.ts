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

export const declareNoteApis = () => ({
  "POST /api/notes": async ({ body }: { body: Note }) => {
    try {
      const note: Note = {
        id: Date.now().toString(),
        title: body.title,
        description: body.description || "",
        createdAt: moment().valueOf(),
        updatedAt: moment().valueOf(),
        priority: body.priority || false,
      };

      await dbService.createDocument("notes", note);
      return {
        status: 200,
        message: "Note created successfully",
        data: note,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to create note",
      };
    }
  },

  "GET /api/notes": async () => {
    try {
      const notes = await dbService.getDocuments("notes");
      return {
        status: 200,
        message: "Notes retrieved successfully",
        data: notes,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to fetch notes",
      };
    }
  },

  "PUT /api/notes/:id": async ({
    body,
    params,
  }: {
    body: Note;
    params: { id: string };
  }) => {
    try {
      const noteId = params.id;
      const updatedNote = {
        ...body,
        updatedAt: moment().valueOf(),
      };

      await dbService.updateDocument("notes", noteId, updatedNote);
      return {
        status: 200,
        message: "Note updated successfully",
        data: updatedNote,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to update note",
      };
    }
  },

  "DELETE /api/notes/:id": async ({ params }: { params: { id: string } }) => {
    try {
      const noteId = params.id;
      await dbService.deleteDocument("notes", noteId);
      return {
        status: 200,
        message: "Note deleted successfully",
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to delete note",
      };
    }
  },
});
