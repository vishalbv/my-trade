import { useState, useEffect } from "react";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../../store/actions/noteActions";
import moment from "moment";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Button } from "@repo/ui/button";
import { Pencil, Trash2, Star } from "lucide-react";

interface Note {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  priority?: boolean;
}

export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
    priority: false,
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const response = await getNotes();
    setNotes(Array.isArray(response) ? response : []);
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;

    await createNote(newNote);
    setNewNote({ title: "", description: "", priority: false });
    loadNotes();
  };

  const handleUpdateNote = async (note: Note) => {
    await updateNote(note.id, note);
    setEditingNote(null);
    loadNotes();
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    loadNotes();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card className={`mb-6 ${newNote.priority ? "bg-red-400/5" : ""}`}>
        <CardContent className="p-4 text-center">
          <div className="flex gap-2">
            <Input
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              className="mb-3 flex-1"
            />
            <Button
              variant="primary-hover"
              size="icon"
              className={`hover:bg-orange-100 hover:text-orange-500 ${
                newNote.priority ? "bg-orange-100 text-orange-500" : ""
              }`}
              onClick={() =>
                setNewNote({ ...newNote, priority: !newNote.priority })
              }
            >
              <Star
                className={`h-4 w-4 ${
                  newNote.priority || "hover:fill-orange-500"
                } ${newNote.priority ? "fill-orange-500" : ""}`}
              />
            </Button>
            <Button onClick={handleCreateNote}>Add Note</Button>
          </div>
          <Textarea
            placeholder="Note description (optional)"
            value={newNote.description}
            onChange={(e) =>
              setNewNote({ ...newNote, description: e.target.value })
            }
            className="mb-2"
          />
        </CardContent>
      </Card>

      <div className="space-y-4 overflow-y-auto h-[calc(95vh-250px)]">
        {notes.map((note) => (
          <Card
            key={note.id}
            className={`${note.priority ? "bg-red-400/5" : ""}`}
          >
            <CardContent className="p-4">
              {editingNote?.id === note.id ? (
                <>
                  <Input
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                    className="mb-2"
                  />
                  <Textarea
                    value={editingNote.description}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        description: e.target.value,
                      })
                    }
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateNote(editingNote)}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingNote(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-stretch justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {note.priority && (
                        <Star className="inline h-4 w-4 fill-orange-500 text-orange-500 mr-1" />
                      )}
                      {note.title}
                    </h3>
                    {note.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                        {note.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {moment(note.createdAt).format("MMM D, YYYY h:mm A")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary-hover"
                      size="icon"
                      onClick={() => setEditingNote(note)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="primary-hover"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-300 hover:text-orange-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
