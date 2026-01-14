import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 text-white p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-6xl font-black font-display mb-4 text-white">404</h1>
        <h2 className="text-2xl font-bold mb-6 font-display text-slate-200">الصفحة غير موجودة</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          عذراً، الصفحة التي تحاول الوصول إليها قد تكون حذفت أو تم تغيير رابطها أو أنها غير متاحة حالياً.
        </p>

        <Link href="/">
          <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
            العودة للرئيسية
          </button>
        </Link>
      </div>
    </div>
  );
}
