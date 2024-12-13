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
  Timer,
} from "lucide-react";
import { useEffect } from "react";
import { TaskDrawer } from "./taskDrawer";
import { NotesDrawer } from "./notesDrawer";
import { TimersDrawer } from "./timersDrawer";
import { Button } from "@repo/ui/button";

const Drawer = () => {
  return (
    <>
      <RightDrawer />
      <TaskDrawer />
      <NotesDrawer />
      <TimersDrawer />
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
    <div className="flex gap-2">
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
        icon={<Timer />}
        label="Timers"
        isActive={activeDrawer === "timers"}
        onClick={() => dispatch(toggleDrawer("timers"))}
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
    className={`h-6 flex text-foreground/80 items-center gap-1 px-2 py-1 rounded-lg transition-colors bg-primary/10 rounded-b-none border-primary/20 border-0.5 ${
      isActive ? "text-primary" : ""
    }`}
  >
    <div className="w-3 h-3 mb-1 mr-2">{icon}</div>
    <span className="text-xs font-base">{label}</span>
    <span className="opacity-50 ml-1">{directionIcon}</span>
  </Button>
);
