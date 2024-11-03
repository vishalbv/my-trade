import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer";
import { useEffect, useState } from "react";
import { LINKS } from "../../utils/constants";
import { ExternalLink } from "lucide-react";

export function RightDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerContent className="h-full w-[220px] right-0">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg font-bold">Quick Links</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-80px)] px-4">
          {LINKS.map((section, index) => (
            <div key={index} className="space-y-2 mb-4">
              <h2 className="text-base font-semibold text-primary">
                {section.heading}
              </h2>
              <div className="space-y-1">
                {section.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded-lg duration-200 group hover:scale-105 hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm group-hover:text-primary">
                        {link.heading}
                      </span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
