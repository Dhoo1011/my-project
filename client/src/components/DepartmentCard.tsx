import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface DepartmentCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  delay?: number;
  link?: string;
}

export function DepartmentCard({ title, description, Icon, delay = 0, link }: DepartmentCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-neutral-900/80 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
          <Icon className="w-7 h-7 text-blue-400 group-hover:text-blue-300" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed font-body">
          {description}
        </p>
      </div>
    </motion.div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" data-testid={`link-department-${title}`}>
        {content}
      </a>
    );
  }

  return content;
}
