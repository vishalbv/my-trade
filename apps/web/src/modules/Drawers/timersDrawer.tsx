import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../store/store";
import { toggleDrawer } from "../../store/slices/drawerSlice";
// import { TimerList } from "../../components/Timers/TimerList";

export function TimersDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: RootState) => state.drawer.activeDrawer === "timers"
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={() => dispatch(toggleDrawer("timers"))}
      direction="bottom"
    >
      <DrawerContent className="h-[95vh] right-0">
        <DrawerHeader>
          <DrawerTitle>Timers</DrawerTitle>
        </DrawerHeader>

        {/* <TimerList /> */}
      </DrawerContent>
    </Drawer>
  );
}
