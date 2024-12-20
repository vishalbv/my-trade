"use client";

import { useState } from "react";
import { Card } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { ScrollArea } from "@repo/ui/scroll-area";
import { useSelector } from "react-redux";
import { createNote } from "../../store/actions/noteActions";

interface JournalEntry {
  id: string;
  note: string;
  timestamp: string;
}

export function TradingJournal() {
  const [newNote, setNewNote] = useState("");
  const { tradingJournal = [] } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote({
        title: "",
        description: newNote,
      });

      setNewNote("");
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Trading Journal</h3>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <Button onClick={addNote}>Add</Button>
      </div>

      <ScrollArea className="h-[100px]">
        <div className="space-y-3">
          {tradingJournal.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No journal entries yet
            </p>
          ) : (
            tradingJournal.map((entry: JournalEntry) => (
              <div key={entry.id} className="p-3 bg-card/50 rounded-lg">
                <p className="text-sm">{entry.note}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
