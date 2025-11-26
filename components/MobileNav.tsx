import React from "react";
import { Mic, Library, Eye, SplitSquareVertical, Bookmark } from "lucide-react";

const MobileNav = ({ activeMode, setActiveMode, setViewState }: any) => {
  const navItems = [
    { id: "VOICE", icon: Mic, label: "Translate" },
    { id: "DICTIONARY", icon: Library, label: "Dictionary" },
    { id: "VISION", icon: Eye, label: "Image" },
    { id: "CONVERSATION", icon: SplitSquareVertical, label: "Split" },
    { id: "SAVED", icon: Bookmark, label: "Saved" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#3182CE] backdrop-blur-lg border-t border-white/20 pb-safe z-50">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "SAVED") {
                setViewState("SAVED");
              } else {
                setActiveMode(item.id);
                setViewState("CHAT");
              }
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              (activeMode === item.id && item.id !== "SAVED") ||
              (item.id === "SAVED" && activeMode === "SAVED") // Logic handled in parent for ViewState vs Mode
                ? "text-white bg-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { MobileNav };
