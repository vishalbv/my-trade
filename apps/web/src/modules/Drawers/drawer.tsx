import { RightDrawer } from "./rightDrawer";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toggleDrawer } from "../../store/slices/drawerSlice";
import {
  Clipboard,
  FileText,
  ExternalLink,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { useEffect } from "react";
import { TaskDrawer } from "./taskDrawer";
import { NotesDrawer } from "./notesDrawer";
import { Button } from "@repo/ui/button";

const Drawer = () => {
  return (
    <>
      <RightDrawer />
      <TaskDrawer />
      <NotesDrawer />
      <DrawerIcons />
    </>
  );
};

export default Drawer;

const DrawerIcons = () => {
  const dispatch = useDispatch();
  const activeDrawer = useSelector(
    (state: RootState) => state.drawer.activeDrawer
  );

  return (
    <div className="fixed bottom-0 right-0 flex gap-2 z-50">
      <IconButton
        icon={<Clipboard />}
        label="Tasks"
        isActive={activeDrawer === "task"}
        onClick={() => dispatch(toggleDrawer("task"))}
        directionIcon={<ArrowUp className="h-3 w-3" />}
      />
      <IconButton
        icon={<FileText />}
        label="Notes"
        isActive={activeDrawer === "notes"}
        onClick={() => dispatch(toggleDrawer("notes"))}
        directionIcon={<ArrowUp className="h-3 w-3" />}
      />
      <IconButton
        icon={<ExternalLink />}
        label="Links"
        isActive={activeDrawer === "right"}
        onClick={() => dispatch(toggleDrawer("right"))}
        directionIcon={<ArrowLeft className="h-3 w-3" />}
      />
    </div>
  );
};

const IconButton = ({
  icon,
  label,
  isActive,
  onClick,
  directionIcon,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  directionIcon: React.ReactNode;
}) => (
  <Button
    onClick={onClick}
    variant="primary-hover"
    size="xs"
    className={`flex text-foreground/80 items-center gap-1 px-2 py-2 rounded-lg transition-colors bg-primary/10 rounded-b-none border-primary/20 border-0.5 ${
      isActive ? "text-primary" : ""
    }`}
  >
    <div className="w-5 h-5 pt-0.5">{icon}</div>
    <span className="text-xs font-base">{label}</span>
    <span className="opacity-50">{directionIcon}</span>
  </Button>
);
