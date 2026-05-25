"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-700 bg-white/5 backdrop-blur-sm transition-all duration-200 focus-within:border-emerald-400/70 focus-within:bg-emerald-500/5">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/5 p-5 w-72 text-left`}>
    <img 
      src={testimonial.avatarSrc} 
      className="h-10 w-10 object-cover rounded-2xl border border-white/10" 
      alt={`Avatar of ${testimonial.name}`} 
      loading="lazy"
      fetchPriority="low"
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-slate-400 text-xs">{testimonial.handle}</p>
      <p className="mt-2 text-slate-300 text-xs leading-normal">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-white tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (onSignIn) {
      onSignIn(email, password);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-[#0b1120]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-white">{title}</h1>
            <p className="animate-element animate-delay-200 text-slate-400">{description}</p>

            <div className="space-y-5">
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-slate-400 block mb-1.5">Email Address</label>
                <GlassInputWrapper>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl text-white focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-slate-400 block mb-1.5">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl text-white focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-slate-400 hover:text-white transition-colors" /> : <Eye className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="h-4 w-4 rounded border-slate-700 bg-white/5 accent-emerald-500 text-emerald-500 focus:ring-0 focus:ring-offset-0" />
                  <span className="text-slate-300">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-emerald-400 transition-colors">Reset password</a>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-emerald-500 py-4 font-semibold text-black hover:bg-emerald-400 transition-colors cursor-pointer text-center"
              >
                Sign In
              </button>
            </div>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center py-2">
              <span className="w-full border-t border-slate-800"></span>
              <span className="px-4 text-sm text-slate-500 bg-[#0b1120] absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-slate-800 rounded-2xl py-4 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors cursor-pointer">
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-slate-400">
              New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-emerald-400 hover:underline transition-colors">Create Account</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4 bg-slate-950">
          <img 
            src={heroImageSrc} 
            alt="Industrial background showcasing solar/wind energy installations" 
            fetchPriority="high"
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center opacity-40 filter grayscale hover:grayscale-0 transition-all duration-700 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover"
          />
          <div className="absolute inset-4 rounded-3xl bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-80 pointer-events-none" />
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
