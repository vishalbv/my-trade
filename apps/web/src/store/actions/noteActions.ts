import {
  postRequest,
  getRequest,
  putRequest,
  deleteRequest,
} from "../../services/api";

interface Note {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  priority?: boolean;
}

export const createNote = (note: Partial<Note>) => {
  return postRequest("notes", note);
};

export const getNotes = () => {
  return getRequest("notes");
};

export const updateNote = (id: string, updates: Partial<Note>) => {
  return putRequest(`notes/${id}`, updates);
};

export const deleteNote = (id: string) => {
  return deleteRequest(`notes/${id}`);
};
