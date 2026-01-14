import { Navigation } from "@/components/Navigation";
import { DepartmentCard } from "@/components/DepartmentCard";
import { WantedCard } from "@/components/WantedCard";
import { NewsTicker } from "@/components/NewsTicker";
import { ReportModal } from "@/components/ReportModal";
import { useAnnouncements, useDepartments, useWantedList, usePublicWantedVehicles } from "@/hooks/use-police-data";
import { useState } from "react";
import lspdBackground from "@assets/lspd_1768264491814.png";
import lspdLogo from "@assets/IMG_0342_1768264620391.gif";
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  GraduationCap, 
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Car
} from "lucide-react";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, any> = {
  "Shield": Shield,
  "Users": Users,
  "FileText": FileText,
  "AlertTriangle": AlertTriangle,
  "GraduationCap": GraduationCap,
  "Briefcase": Briefcase,
};

export default function Home() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { data: publicNews } = useAnnouncements("public");
  const { data: wantedPeople } = useWantedList();
  const { data: departments } = useDepartments();
  const { data: wantedVehicles } = usePublicWantedVehicles();

  const tickerNews = publicNews || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navigation />
      
      {/* HERO SECTION - Clean & Minimal */}
      <section className="relative min-h-[85vh] flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a] z-10" />
          <img 
            src={lspdBackground}
            alt="LSPD Headquarters" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 text-center px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <img 
              src={lspdLogo} 
              alt="LSPD Logo" 
              className="w-24 h-24 md:w-32 md:h-32 mb-8 drop-shadow-2xl"
            />
            
            <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">
              رئاسة الشرطة
            </h1>
            <p className="text-lg md:text-xl text-blue-400 font-medium tracking-widest mb-6">
              PHANTOM ROLEPLAY
            </p>
            
            <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
              نلتزم بحماية وخدمة مجتمعنا. العدالة والأمان للجميع.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setReportModalOpen(true)}
                className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
                data-testid="button-submit-report-hero"
              >
                تقديم بلاغ
              </button>
              <a 
                href="#departments"
                className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-all duration-200 backdrop-blur-sm border border-white/10"
              >
                الأقسام
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <ReportModal open={reportModalOpen} onOpenChange={setReportModalOpen} />
      <NewsTicker announcements={tickerNews} />

      {/* QUICK STATS */}
      <section className="py-12 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">24/7</div>
              <div className="text-gray-500 text-sm">خدمة متواصلة</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">911</div>
              <div className="text-gray-500 text-sm">خط الطوارئ</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">100%</div>
              <div className="text-gray-500 text-sm">التزام بالخدمة</div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS SECTION */}
      <section id="departments" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">الأقسام والوحدات</h2>
            <p className="text-gray-500">الهيكل التنظيمي للقسم</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments && departments.length > 0 ? (
              departments.map((dept, idx) => {
                const IconComponent = ICON_MAP[dept.icon] || Shield;
                const deptLink = dept.title === "الأكاديمية" ? "https://rank-tracker--phantom-lspd.replit.app/admin" : undefined;
                return (
                  <DepartmentCard
                    key={dept.id}
                    title={dept.title}
                    description={dept.description}
                    Icon={IconComponent}
                    delay={idx * 0.05}
                    link={deptLink}
                  />
                );
              })
            ) : (
              <>
                <DepartmentCard title="الدوريات" description="الاستجابة السريعة للحالات الطارئة" Icon={Shield} delay={0} />
                <DepartmentCard title="التحقيقات" description="حل الجرائم وجمع الأدلة" Icon={FileText} delay={0.05} />
                <DepartmentCard title="المرور" description="تنظيم السير وتطبيق القوانين" Icon={AlertTriangle} delay={0.1} />
                <DepartmentCard title="الأكاديمية" description="تدريب وتأهيل الكوادر" Icon={GraduationCap} delay={0.15} link="https://rank-tracker--phantom-lspd.replit.app/admin" />
                <DepartmentCard title="الشؤون الداخلية" description="ضمان النزاهة والمهنية" Icon={Users} delay={0.2} />
                <DepartmentCard title="العلاقات العامة" description="التواصل مع المجتمع" Icon={Briefcase} delay={0.25} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* WANTED LIST */}
      <section id="wanted" className="py-20 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">المطلوبين</h2>
              <p className="text-red-400 text-sm">MOST WANTED</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {wantedPeople && wantedPeople.length > 0 ? (
              wantedPeople.map((person, idx) => (
                <WantedCard
                  key={person.id}
                  name={person.name}
                  crime={person.crime}
                  status={person.status as "wanted" | "captured"}
                  imageUrl={person.imageUrl}
                  delay={idx * 0.05}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">لا يوجد مطلوبين حالياً</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WANTED VEHICLES */}
      <section id="vehicles" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">السيارات المطلوبة</h2>
              <p className="text-orange-400 text-sm">WANTED VEHICLES</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wantedVehicles && wantedVehicles.length > 0 ? (
              wantedVehicles.map((vehicle: any, idx: number) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-neutral-900/80 border border-white/5 rounded-xl overflow-hidden hover:border-orange-500/30 transition-all"
                >
                  {vehicle.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={vehicle.imageUrl} 
                        alt={vehicle.plateNumber}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Car className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">{vehicle.plateNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${vehicle.status === 'wanted' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {vehicle.status === 'wanted' ? 'مطلوب' : 'تم العثور'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{vehicle.vehicleType} {vehicle.color && `- ${vehicle.color}`}</p>
                        <p className="text-gray-500 text-xs mt-2">{vehicle.reason}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Car className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد سيارات مطلوبة حالياً</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER - Simple */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={lspdLogo} alt="LSPD" className="w-10 h-10" />
              <div>
                <div className="font-bold">رئاسة الشرطة</div>
                <div className="text-gray-500 text-xs">Phantom Roleplay</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>911</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@phantom-pd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>وسط المدينة</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} Phantom RP Police Department
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
