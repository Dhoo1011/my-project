import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
}

interface NewsTickerProps {
  announcements: Announcement[];
}

export function NewsTicker({ announcements }: NewsTickerProps) {
  if (announcements.length === 0) return null;

  // Duplicate announcements for seamless looping
  const duplicatedAnnouncements = [...announcements, ...announcements];
  
  // Adjust duration based on number of announcements
  const baseDuration = Math.max(15, announcements.length * 8);

  return (
    <div className="w-full bg-blue-900/20 border-y border-blue-500/20 backdrop-blur-sm overflow-hidden h-12 flex items-center relative">
      <div className="absolute right-0 top-0 bottom-0 bg-blue-600 px-4 flex items-center z-10 shadow-lg shadow-blue-900/50">
        <Megaphone className="w-4 h-4 text-white ml-2 animate-pulse" />
        <span className="text-white font-bold text-sm whitespace-nowrap">عاجل</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center mr-20">
        <motion.div
          animate={{ x: [0, "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            duration: baseDuration, 
            ease: "linear",
            repeatType: "loop"
          }}
          className="whitespace-nowrap flex items-center gap-16"
        >
          {duplicatedAnnouncements.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span className="text-slate-200 font-medium text-sm">{item.title}:</span>
              <span className="text-slate-400 text-sm">{item.content}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
