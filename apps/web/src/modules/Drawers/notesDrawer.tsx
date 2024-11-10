import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../store/store";
import { toggleDrawer } from "../../store/slices/drawerSlice";
import { NoteList } from "../../components/Notes/NoteList";

export function NotesDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: RootState) => state.drawer.activeDrawer === "notes"
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={() => dispatch(toggleDrawer("notes"))}
      direction="bottom"
    >
      <DrawerContent className="h-[50vh]">
        <DrawerHeader>
          <DrawerTitle>Notes</DrawerTitle>
        </DrawerHeader>
        <NoteList />
      </DrawerContent>
    </Drawer>
  );
}
