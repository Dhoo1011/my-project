import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginModal } from "./LoginModal";
import lspdLogo from "@assets/IMG_0342_1768264620391.gif";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const navItems = [
    { label: "الرئيسية", href: "/" },
    { label: "الأقسام", href: "#departments" },
    { label: "القائمة السوداء", href: "#wanted" },
    { label: "الأخبار", href: "#news" },
    { label: "اتصل بنا", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 space-x-reverse cursor-pointer group">
            <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <img src={lspdLogo} alt="LSPD Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-white leading-none">رئاسة الشرطة</span>
              <span className="text-xs text-blue-400 font-mono tracking-wider">PHANTOM RP</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors relative group py-2"
              >
                {item.label}
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <button 
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              تسجيل الدخول
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-300 hover:bg-white/5 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-neutral-900 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-medium text-slate-300 hover:text-blue-400 transition-colors text-right"
                >
                  {item.label}
                </a>
              ))}
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full mt-4 px-5 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-500 transition-all"
              >
                تسجيل الدخول
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
