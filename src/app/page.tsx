"use client";

import { useRouter } from "next/navigation";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useLanguage } from "@/components/layout/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const carbonTestimonials: Testimonial[] = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/32.jpg",
      name: "Sarah Chen",
      handle: "CFO, IndoSteel Group",
      text: language === "id"
        ? "Fitur perhitungan liabilitas CBAM menghemat waktu kami berminggu-minggu dalam penyusunan prakiraan manual. Sangat penting bagi keuangan industri."
        : "The CBAM liability calculation features saved us weeks of manual forecasting. Indispensable for industrial finance."
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/44.jpg",
      name: "Marcus Wijaya",
      handle: "Head of Sustainability, Berbak Power",
      text: language === "id"
        ? "Solusi elegan untuk memantau tren harga IDXCarbon dan mengoptimalkan strategi CAPEX pengurangan emisi."
        : "An elegant solution to monitor IDXCarbon price trends and optimize emission reduction CAPEX strategies."
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/82.jpg",
      name: "David Halim",
      handle: "Treasurer, Semen Nusantara",
      text: language === "id"
        ? "Analis AI Gemini menghasilkan laporan paparan karbon siap saji untuk rapat direksi dalam hitungan detik. Sangat membantu."
        : "The Gemini AI analyst delivers boardroom-ready carbon exposure reports in seconds. Extremely helpful."
    },
  ];

  const handleSignIn = (email: string, password: string) => {
    if (!email || !password) {
      alert(t("landing.alertEnterCredentials"));
      return;
    }
    router.push("/dashboard");
  };

  const handleGoogleSignIn = () => {
    router.push("/dashboard");
  };

  const handleResetPassword = () => {
    alert(t("landing.alertResetSent"));
  };

  const handleCreateAccount = () => {
    alert(t("landing.alertAccountDisabled"));
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#0b1120] overflow-hidden">
      <SignInPage
        title={
          <span className="font-extrabold text-white tracking-tight">
            Carbon <span className="text-emerald-400">Climatch</span>
          </span>
        }
        description={t("landing.description")}
        heroImageSrc="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&q=80"
        testimonials={carbonTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}

