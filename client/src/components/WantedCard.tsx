import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface WantedCardProps {
  name: string;
  crime: string;
  status: "wanted" | "captured";
  imageUrl?: string | null;
  delay?: number;
}

export function WantedCard({ name, crime, status, imageUrl, delay = 0 }: WantedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={`relative rounded-xl overflow-hidden border ${
        status === "wanted" ? "border-red-900/50 bg-red-950/10" : "border-green-900/50 bg-green-950/10"
      }`}
    >
      {/* Status Badge */}
      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 z-10 ${
        status === "wanted" 
          ? "bg-red-600 text-white shadow-lg shadow-red-900/40" 
          : "bg-green-600 text-white shadow-lg shadow-green-900/40"
      }`}>
        {status === "wanted" ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        {status === "wanted" ? "مطلوب" : "تم القبض عليه"}
      </div>

      <div className="aspect-[3/4] w-full bg-neutral-900 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          /* Unsplash placeholder for police/mugshot style if no image */
          <div className="w-full h-full relative">
            {/* Descriptive comment for Unsplash image */}
            {/* abstract silhouette person dark moody */}
            <img 
              src="https://pixabay.com/get/ge5c8d76220e5fde3c55876e3ea6bd666c1f8c57f3ccc2396825111d682f05b15e8973636235da736e732384676a3cd1f7469b32d87510fb9a00259f5596e0e06_1280.jpg" 
              alt="Placeholder" 
              className="w-full h-full object-cover grayscale opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-neutral-500 font-mono text-sm">NO IMAGE</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-lg font-bold text-white font-display mb-1">{name}</h4>
        <p className="text-xs text-slate-300 font-mono bg-black/50 inline-block px-2 py-1 rounded border border-white/10">
          {crime}
        </p>
      </div>
    </motion.div>
  );
}
