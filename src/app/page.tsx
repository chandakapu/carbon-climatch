"use client";

import { useRouter } from "next/navigation";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";

const carbonTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/32.jpg",
    name: "Sarah Chen",
    handle: "CFO, IndoSteel Group",
    text: "The CBAM liability calculation features saved us weeks of manual forecasting. Indispensable for industrial finance."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/44.jpg",
    name: "Marcus Wijaya",
    handle: "Head of Sustainability, Berbak Power",
    text: "An elegant solution to monitor IDXCarbon price trends and optimize emission reduction CAPEX strategies."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/82.jpg",
    name: "David Halim",
    handle: "Treasurer, Semen Nusantara",
    text: "The Gemini AI analyst delivers boardroom-ready carbon exposure reports in seconds. Extremely helpful."
  },
];

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = (email: string, password: string) => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    router.push("/dashboard");
  };

  const handleGoogleSignIn = () => {
    router.push("/dashboard");
  };

  const handleResetPassword = () => {
    alert("Password reset request sent to email.");
  };

  const handleCreateAccount = () => {
    alert("Account creation is disabled in the prototype version.");
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#0b1120] overflow-hidden">
      <SignInPage
        title={
          <span className="font-extrabold text-white tracking-tight">
            Carbon <span className="text-emerald-400">Climatch</span>
          </span>
        }
        description="Log in to check compliance risk, calculate exposure, and run strategic optimization."
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
