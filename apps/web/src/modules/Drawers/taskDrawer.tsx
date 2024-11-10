import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../store/store";
import { toggleDrawer } from "../../store/slices/drawerSlice";
import { TaskList } from "../../components/Tasks/TaskList";

export function TaskDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: RootState) => state.drawer.activeDrawer === "task"
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={() => dispatch(toggleDrawer("task"))}
      direction="bottom"
      noBodyStyles
    >
      <DrawerContent className="h-[95vh] w-[40vw] right-0">
        <DrawerHeader className="text-center flex justify-center py-1">
          <DrawerTitle>Tasks</DrawerTitle>
        </DrawerHeader>
        <TaskList />
      </DrawerContent>
    </Drawer>
  );
}
