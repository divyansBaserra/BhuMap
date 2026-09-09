"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTheme } from "next-themes";
import AuthForm from "@/components/AuthForm";

gsap.registerPlugin(ScrollTrigger);

export default function BhuMapLanding() {
  const container = useRef<HTMLElement>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const [activeCategory, setActiveCategory] = useState("Extraction");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("bhumap_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const toggleTheme = () => {
    const current = theme === "system" ? resolvedTheme : theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    window.history.pushState(null, "", `/${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleWorkspaceAccess = () => {
    if (isLoggedIn) {
      window.location.href = "/workspace";
    } else {
      setAuthMode("login");
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    const mockUser = { name: "Authorized Surveyor", email: "surveyor@bhumap.gov.in", role: "SURVEYOR" };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem("bhumap_user", JSON.stringify(mockUser));
    setShowAuth(false);
    window.location.href = "/workspace";
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("bhumap_user");
  };

  const faqData: Record<string, { q: string; a: string }[]> = {
    "General": [
      {
        q: "What is BhuMap and how does it address Problem Statement 26012?",
        a: "BhuMap is an AI-based automated urban parcel mapping and cadastral feature extraction system designed for Smart India Hackathon 2026. It transforms high-resolution drone imagery into structured, verifiable GIS datasets."
      },
      {
        q: "What drone imagery formats are supported for ingestion?",
        a: "The platform ingests high-resolution orthomosaics, GeoTIFFs, and multi-spectral aerial datasets captured by standard UAV survey platforms."
      }
    ],
    "Extraction": [
      {
        q: "How does the AI model extract parcel boundaries and buildings?",
        a: "BhuMap employs deep learning segmentation models trained on aerial imagery to automatically delineate parcel boundaries, building footprints, and access corridors with high spatial precision."
      },
      {
        q: "Can generated layers be compared with existing cadastral data?",
        a: "Yes. Newly extracted AI geometries are overlaid directly on top of legacy state cadastral layers to instantly highlight shifts, boundary discrepancies, and unmapped structures."
      }
    ],
    "Validation": [
      {
        q: "How do surveyors perform ground truthing and verification?",
        a: "Surveyors use the interactive web GIS workspace to review flagged discrepancies, adjust boundary vertices, and sign off on verified parcels before final archival."
      },
      {
        q: "Is a complete audit trail maintained for surveyor edits?",
        a: "Every modification, verification stamp, and timestamp is logged securely under the surveyor profile ID to ensure an immutable chain of custody."
      }
    ],
    "GIS Export": [
      {
        q: "What export formats are available for state land registries?",
        a: "Verified datasets can be exported instantly into standard GIS vector formats including GeoJSON, ESRI Shapefile (SHP), and KML."
      },
      {
        q: "Does BhuMap integrate with existing state GIS portals?",
        a: "Yes. The platform provides secure API endpoints and standardized schema exports designed for seamless integration into state-level land administration workflows."
      }
    ]
  };

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(".hero-text-elem, .hero-visual, .about-visuals, .about-text-elem, .feature-card, .workflow-phone, .process-step", { opacity: 1, y: 0, x: 0, scale: 1 });
      return;
    }

    gsap.fromTo(".nav-elem", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" });
    gsap.fromTo(".hero-text-elem", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out", delay: 0.1 });
    gsap.fromTo(".hero-visual", { scale: 0.96, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 });
    gsap.fromTo(".about-visuals", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#about", start: "top 80%", toggleActions: "play reset play reset" } });
    gsap.fromTo(".about-text-elem", { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#about", start: "top 80%", toggleActions: "play reset play reset" } });
    gsap.fromTo(".feature-card", { y: 25, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: "#features", start: "top 85%", toggleActions: "play reset play reset" } });

    const steps = gsap.utils.toArray('.process-step');
    steps.forEach((step: any) => {
      gsap.fromTo(step, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: step, start: "top 85%", toggleActions: "play reset play reset" } });
    });
  }, { scope: container });

  return (
    <main 
      ref={container}
      className="min-h-screen bg-[#f4f8f5] dark:bg-[#0c120e] text-[#1c2b23] dark:text-white/90 relative font-sans selection:bg-[#4a7258] selection:text-white pb-12 overflow-x-hidden transition-colors duration-300"
    >
      <div 
        className="absolute inset-0 z-0 opacity-100 dark:opacity-[0.05] pointer-events-none transition-opacity duration-300"
        style={{ backgroundImage: "url('/images/topography.svg')", backgroundSize: "100% auto", backgroundPosition: "center top", backgroundRepeat: "repeat-y" }}
      ></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5b8c69]/15 dark:from-[#5b8c69]/10 via-transparent to-transparent pointer-events-none z-0"></div>

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowAuth(false)} 
              className="absolute top-5 right-5 z-20 text-white/60 hover:text-white font-bold text-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}

      <nav className="relative z-20 max-w-[1400px] mx-auto px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="nav-elem flex items-center gap-3 cursor-pointer" onClick={() => { window.history.pushState(null, "", "/"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1c2b23] dark:text-white">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[1.35rem] font-bold tracking-tight">BhuMap</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="/about" onClick={(e) => scrollToSection(e, 'about')} className="nav-elem text-[15px] font-semibold text-[#1c2b23]/70 dark:text-white/70 hover:text-[#5b8c69] dark:hover:text-[#5b8c69] transition-colors">Platform</a>
          <a href="/features" onClick={(e) => scrollToSection(e, 'features')} className="nav-elem text-[15px] font-semibold text-[#1c2b23]/70 dark:text-white/70 hover:text-[#5b8c69] dark:hover:text-[#5b8c69] transition-colors">Features</a>
          <a href="/process" onClick={(e) => scrollToSection(e, 'process')} className="nav-elem text-[15px] font-semibold text-[#1c2b23]/70 dark:text-white/70 hover:text-[#5b8c69] dark:hover:text-[#5b8c69] transition-colors">How it works</a>
          <a href="/faq" onClick={(e) => scrollToSection(e, 'faq')} className="nav-elem text-[15px] font-semibold text-[#1c2b23]/70 dark:text-white/70 hover:text-[#5b8c69] dark:hover:text-[#5b8c69] transition-colors">FAQ</a>
        </div>

        <div className="nav-elem flex items-center gap-3">
          {mounted && (
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white dark:bg-[#1a261f] border border-[#1c2b23]/10 dark:border-white/10 text-[#1c2b23] dark:text-white hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleWorkspaceAccess}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5b8c69] text-white text-[13px] font-bold hover:bg-[#4a7258] transition-all shadow-md cursor-pointer"
              >
                Go to Workspace
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-2.5 rounded-full text-xs font-semibold text-[#1c2b23]/60 dark:text-white/60 hover:text-red-500 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setAuthMode("login"); setShowAuth(true); }}
                className="px-4 py-2.5 text-[14px] font-bold text-[#1c2b23] dark:text-white hover:text-[#5b8c69] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={handleWorkspaceAccess} 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1c2b23] dark:bg-white text-white dark:text-[#1c2b23] text-[14px] font-semibold hover:bg-[#344b3e] dark:hover:bg-[#e2ebe6] transition-all shadow-sm cursor-pointer"
              >
                <span className="hidden sm:inline">Launch Web GIS</span>
                <span className="inline sm:hidden">Login</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <section className="relative z-10 max-w-[1300px] mx-auto px-6 pt-16 pb-12 lg:pt-20 lg:pb-24 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="hero-text-elem flex items-center gap-3 mb-6 bg-white/70 dark:bg-[#1a261f]/80 backdrop-blur-md pr-4 py-1.5 rounded-full border border-[#1c2b23]/10 dark:border-white/10 shadow-sm transition-colors">
            <div className="bg-[#5b8c69] p-1.5 rounded-full ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span className="text-[13px] font-bold">SIH 2026 Problem Statement 26012</span>
          </div>

          <h1 className="hero-text-elem text-[2.8rem] md:text-[4rem] leading-[1.05] lg:text-[4.8rem] font-bold tracking-tighter w-full">
            <span className="text-[#5b8c69]">BhuMap</span> is your <br className="hidden md:block" />
            automated
            <div className="inline-flex align-middle mx-2 lg:mx-3 w-20 h-9 md:w-28 md:h-12 lg:w-[130px] lg:h-[60px] rounded-full overflow-hidden relative shadow-inner translate-y-[-4px] lg:translate-y-[-6px]">
              <Image src="/images/hero-gis-interface.png" alt="Cadastral Map snippet" fill className="object-cover" priority />
            </div>
            <br />
            cadastral mapper
          </h1>

          <p className="hero-text-elem mt-6 text-[15px] md:text-[17px] text-[#1c2b23]/70 dark:text-white/70 max-w-xl leading-[1.6] font-medium lg:pr-10 transition-colors">
            AI-Based Automated Urban Parcel Mapping and Cadastral Feature Extraction System. Transform high-resolution drone imagery into verified GIS datasets instantly.
          </p>

          <div className="hero-text-elem mt-8 flex flex-col sm:flex-row items-center gap-5">
            <button onClick={handleWorkspaceAccess} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#5b8c69] text-white text-[15px] font-bold hover:bg-[#4a7258] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Access GIS Workspace
            </button>
            <div className="flex flex-col border-l-2 border-[#1c2b23]/10 dark:border-white/10 pl-4 py-1 text-left transition-colors">
              <span className="text-[13px] font-bold">Web Environment</span>
              <span className="text-[13px] font-bold text-[#5b8c69]">Drone imagery ready</span>
            </div>
          </div>
        </div>

        <div className="hero-visual w-full lg:w-[45%] flex justify-center lg:justify-end relative">
          <div className="relative w-[280px] md:w-[320px] aspect-[19.5/40] rounded-[3rem] p-[2px] bg-gradient-to-br from-[#a3a3a3] via-[#e5e5e5] to-[#737373] dark:from-[#333] dark:via-[#555] dark:to-[#222] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute inset-[2px] bg-[#111814] rounded-[2.9rem] p-[6px]">
              
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[95px] h-[26px] bg-[#000000] rounded-full z-50 flex items-center justify-between px-3 shadow-inner">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1c] border border-white/10"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500/90 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              </div>

              <div className="relative w-full h-full bg-[#2a3630] rounded-[2.5rem] overflow-hidden flex flex-col">
                <Image src="/images/hero-gis-interface.png" alt="BhuMap Workspace" fill className="object-cover z-0" priority />
                
                <div className="absolute top-14 left-4 bg-white/95 dark:bg-[#1a261f]/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-[#1c2b23]/10 dark:border-white/10 z-20 flex items-center gap-3 animate-[bounce_4s_infinite]">
                  <div className="w-8 h-8 rounded-full bg-[#5b8c69]/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b8c69" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1c2b23]/50 dark:text-white/50 uppercase">Accuracy</span>
                    <span className="text-[13px] font-bold text-[#1c2b23] dark:text-white">99.2% Validated</span>
                  </div>
                </div>

                <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white rounded-full z-20 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 max-w-[1300px] mx-auto px-6 pt-12 pb-16">
        <h2 className="text-[2rem] md:text-[2.6rem] font-bold mb-12 tracking-tight text-center lg:text-left">About BhuMap Core</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          <div className="about-visuals relative h-[450px] md:h-[550px] w-full flex justify-center items-center scale-[0.9] md:scale-100">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5b8c69] rounded-full opacity-[0.08] blur-[70px]"></div>
            
            <div className="absolute right-[5%] lg:right-[15%] top-[20px] w-[240px] md:w-[270px] aspect-[19.5/40] rounded-[3rem] p-[2px] bg-gradient-to-br from-[#a3a3a3] via-[#e5e5e5] to-[#737373] dark:from-[#333] dark:via-[#555] dark:to-[#222] shadow-2xl rotate-[3deg] z-10">
              <div className="absolute inset-[2px] bg-[#111814] rounded-[2.9rem] p-[6px]">
                <div className="relative w-full h-full bg-[#f4f8f5] dark:bg-[#1a261f] rounded-[2.5rem] overflow-hidden">
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-[#000] rounded-full z-50"></div>
                  
                  <Image src="/images/hero-gis-interface.png" alt="Map View" fill className="object-cover z-0" />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-[#1a261f]/95 backdrop-blur-md rounded-[14px] flex flex-col shadow-lg border border-black/5 dark:border-white/5 z-20">
                    <button className="p-2.5 border-b border-[#1c2b23]/10 dark:border-white/10 flex items-center justify-center cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22l10-4 10 4L12 2z"/></svg>
                    </button>
                    <button className="p-2.5 border-b border-[#1c2b23]/10 dark:border-white/10 flex items-center justify-center cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <button className="p-2.5 flex items-center justify-center cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full bg-[#edf2ef]/90 dark:bg-[#111814]/90 backdrop-blur-xl pt-3 pb-6 px-4 flex justify-between items-center border-t border-[#1c2b23]/5 dark:border-white/5 z-30">
                    <div className="flex flex-col items-center gap-1 opacity-100 text-[#1c2b23] dark:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg><span className="text-[8px] font-bold">Maps</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50 text-[#1c2b23] dark:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span className="text-[8px] font-semibold">My requests</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50 text-[#1c2b23] dark:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span className="text-[8px] font-semibold">Documents</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50 text-[#1c2b23] dark:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span className="text-[8px] font-semibold">Favorites</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50 text-[#1c2b23] dark:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span className="text-[8px] font-semibold">Settings</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-[5%] lg:left-[10%] top-[80px] w-[240px] md:w-[270px] aspect-[19.5/40] rounded-[3rem] p-[2px] bg-gradient-to-br from-[#a3a3a3] via-[#e5e5e5] to-[#737373] dark:from-[#333] dark:via-[#555] dark:to-[#222] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] z-30 -rotate-[2deg]">
              <div className="absolute inset-[2px] bg-[#111814] rounded-[2.9rem] p-[6px]">
                <div className="relative w-full h-full bg-[#edf2ef] dark:bg-[#151f18] rounded-[2.5rem] overflow-hidden flex flex-col transition-colors">
                  
                  <div className="pt-3 px-5 pb-3">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-semibold text-[#1c2b23] dark:text-white">9:41</span>
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-[#000] rounded-full z-50"></div>
                      <div className="flex gap-1 items-center text-[#1c2b23] dark:text-white">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.43 4 16.05 4 12C4 7.95 7.05 4.57 11 4.07V19.93ZM13 4.07C16.95 4.57 20 7.95 20 12C20 16.05 16.95 19.43 13 19.93V4.07Z"/></svg>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[15px] font-bold text-center w-full relative">My requests
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-50">Edit</span>
                      </span>
                    </div>

                    <div className="flex bg-white dark:bg-[#0c120e] p-1 rounded-[14px] shadow-sm border border-transparent dark:border-white/5">
                      <div className="flex-1 text-center text-[11px] font-bold text-white bg-[#434b46] dark:bg-[#5b8c69] rounded-[10px] py-1.5">History</div>
                      <div className="flex-1 text-center text-[11px] font-bold opacity-50 py-1.5">Measurement</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-20 flex flex-col gap-3">
                    {[
                      { date: '10.08.23 - 10:10 am', id: '7110000000:00:000:0000', area: 'Area 1, 2004 ha', color: '#bce4ce', fill: true },
                      { date: '07.08.23 - 11:20 am', id: '7110000000:00:034:0011', area: 'Area 2, 101 ha', color: '#e4cdbc', fill: true },
                      { date: '01.08.23 - 09:15 am', id: '7110000000:00:000:0349', area: 'Area 3, 1002 ha', color: '#bce4ce', fill: true },
                      { date: '29.07.23 - 10:45 am', id: '7110000000:00:000:0358', area: 'Area 1, 0009 ha', color: 'none', fill: false }
                    ].map((item, i) => (
                      <div key={i} className="bg-[#fcfdfc] dark:bg-[#111814] p-3 rounded-2xl shadow-sm border border-[#1c2b23]/5 dark:border-white/5 flex gap-3 items-center">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill={item.color !== 'none' ? item.color : 'none'} stroke={item.fill ? 'none' : '#bce4ce'} strokeWidth="1.5" className={item.color === 'none' ? 'dark:fill-[#1a261f]' : ''}>
                              <polygon points="5,5 19,8 15,20 3,15" />
                           </svg>
                        </div>
                        <div className="flex flex-col w-full">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] font-bold opacity-40">{item.date}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill={item.fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="text-[#434b46] dark:text-white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          </div>
                          <span className="text-[11px] font-bold tracking-tight">{item.id}</span>
                          <span className="text-[9px] font-semibold opacity-50">{item.area}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full bg-[#edf2ef]/90 dark:bg-[#111814]/90 backdrop-blur-xl pt-3 pb-6 px-4 flex justify-between items-center border-t border-[#1c2b23]/5 dark:border-white/5 z-30">
                    <div className="flex flex-col items-center gap-1 opacity-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg><span className="text-[8px] font-semibold">Maps</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span className="text-[8px] font-bold">My requests</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span className="text-[8px] font-semibold">Documents</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span className="text-[8px] font-semibold">Favorites</span></div>
                    <div className="flex flex-col items-center gap-1 opacity-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span className="text-[8px] font-semibold">Settings</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start lg:pl-6 pt-4 lg:pt-0">
            <h3 className="about-text-elem text-[2.2rem] md:text-[2.6rem] font-bold leading-[1.1] mb-4 tracking-tight">
              Automated <span className="text-[#5b8c69]">Cadastral Extraction</span>
            </h3>
            <p className="about-text-elem text-[#1c2b23]/70 dark:text-white/70 text-[15px] md:text-[16px] leading-relaxed mb-8 font-medium">
              Explore extracted urban parcels effortlessly, harness the power of AI-driven geometry delineation, and streamline surveyor validation tasks.
            </p>
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="about-text-elem flex items-start gap-4">
                <div className="mt-1 bg-white dark:bg-[#1a261f] p-2.5 rounded-xl shadow-sm border border-[#1c2b23]/5 dark:border-white/5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path><path d="M9 9l6 6"></path></svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[16px] font-bold mb-1">Direct GIS Integration</h4>
                  <p className="text-[14px] opacity-70 leading-relaxed font-medium">Select extracted parcels and perform automated area calculations. Export boundaries directly into GIS formats.</p>
                </div>
              </div>
              <div className="about-text-elem flex items-start gap-4">
                <div className="mt-1 bg-white dark:bg-[#1a261f] p-2.5 rounded-xl shadow-sm border border-[#1c2b23]/5 dark:border-white/5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[16px] font-bold mb-1">Validate, Store and Export</h4>
                  <p className="text-[14px] opacity-70 leading-relaxed font-medium">Compare extracted geometry with existing cadastral information. Track discrepancy history securely.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 max-w-[1300px] mx-auto px-6 pt-12 pb-12">
        <h2 className="text-[2rem] md:text-[2.6rem] font-bold mb-8 tracking-tight text-center lg:text-left">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { t: 'Automated Pipeline', d: 'Drone imagery is processed through AI models, pulling geometries directly to the map automatically.', i: <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5 M12 7v5l3 3"/> },
            { t: 'High Accuracy Extraction', d: 'Advanced algorithms ensure high fidelity to land-use features, identifying buildings and roads.', i: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></> },
            { t: 'Surveyor Validation', d: 'Easy access to validation tools through the interface, streamlining geometry adjustment workflows.', i: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></> },
            { t: 'Standardized Export', d: 'Seamlessly export verified parcel geometries directly into state registers from the web dashboard.', i: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> }
          ].map((feat, index) => (
            <div key={index} className="feature-card bg-white dark:bg-[#111814] rounded-[2rem] p-8 shadow-sm border border-[#1c2b23]/5 dark:border-white/5 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#f4f8f5] dark:bg-[#1a261f] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{feat.i}</svg>
              </div>
              <h4 className="text-[17px] font-bold mb-3">{feat.t}</h4>
              <p className="text-[14px] opacity-70 leading-relaxed font-medium">{feat.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="relative z-10 max-w-[1100px] mx-auto px-6 pt-16 pb-16">
        <div className="mb-14 text-center">
          <h2 className="text-[2.2rem] md:text-[3.2rem] font-bold mb-4 tracking-tight">How it works</h2>
          <p className="text-[15px] md:text-[17px] opacity-70 leading-relaxed font-medium max-w-2xl mx-auto">
            Embrace efficiency as you navigate the automated pipeline of cadastral feature extraction, designed specifically to solve <strong className="text-[#5b8c69]">SIH Problem Statement 26012</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-10 lg:gap-16">
          <div className="process-step bg-white dark:bg-[#111814] rounded-[2rem] p-8 md:p-12 shadow-sm border border-[#1c2b23]/5 dark:border-white/5 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden transition-colors">
            <span className="absolute -top-10 -left-6 md:-top-16 md:-left-8 text-[8rem] md:text-[12rem] font-bold text-[#1c2b23]/5 dark:text-white/5 leading-none select-none z-0 pointer-events-none">01</span>
            
            <div className="w-full lg:w-1/2 relative z-10">
              <h3 className="text-[1.8rem] md:text-[2.2rem] font-bold mb-4">Data Ingestion</h3>
              <p className="text-[15px] opacity-70 leading-relaxed font-medium">
                Initiate the workflow by securely connecting state land registers and uploading high-resolution drone orthomosaics. We automatically sanitize the imagery to prepare it for the extraction engine, maintaining a verified chain of custody.
              </p>
            </div>
            
            <div className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-end">
               <div className="bg-[#f4f8f5] dark:bg-[#1a261f] rounded-2xl p-6 w-full max-w-[300px] border border-[#1c2b23]/5 dark:border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#1c2b23]/10 dark:border-white/10">
                    <span className="text-[13px] font-bold">Orthomosaic Upload</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5b8c69" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[11px] font-bold opacity-50 uppercase">Drone Source</span>
                     <span className="text-[13px] font-bold">Sector_4_Mapping.tif</span>
                  </div>
                  <div className="w-full bg-white dark:bg-[#111814] rounded-full h-1.5 mt-2"><div className="bg-[#5b8c69] h-1.5 rounded-full w-[85%]"></div></div>
               </div>
            </div>
          </div>

          <div className="process-step bg-white dark:bg-[#111814] rounded-[2rem] p-8 md:p-12 shadow-sm border border-[#1c2b23]/5 dark:border-white/5 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden transition-colors">
            <span className="absolute -top-10 -right-6 md:-top-16 md:-right-8 text-[8rem] md:text-[12rem] font-bold text-[#1c2b23]/5 dark:text-white/5 leading-none select-none z-0 pointer-events-none">02</span>
            
            <div className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-start order-2 lg:order-1">
               <div className="bg-[#f4f8f5] dark:bg-[#1a261f] rounded-2xl p-6 w-full max-w-[300px] border border-[#1c2b23]/5 dark:border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#1c2b23]/10 dark:border-white/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[13px] font-bold">AI Engine Active</span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center bg-white dark:bg-[#111814] px-3 py-2 rounded-lg border border-transparent dark:border-white/5">
                        <span className="text-[12px] font-semibold opacity-70">Parcel Boundaries</span>
                        <span className="text-[12px] font-bold text-[#5b8c69]">Extracted</span>
                     </div>
                     <div className="flex justify-between items-center bg-white dark:bg-[#111814] px-3 py-2 rounded-lg border border-transparent dark:border-white/5">
                        <span className="text-[12px] font-semibold opacity-70">Building Footprints</span>
                        <span className="text-[12px] font-bold text-[#5b8c69]">Extracted</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="w-full lg:w-1/2 relative z-10 order-1 lg:order-2">
              <h3 className="text-[1.8rem] md:text-[2.2rem] font-bold mb-4">AI Feature Extraction</h3>
              <p className="text-[15px] opacity-70 leading-relaxed font-medium">
                Addressing the core of <strong className="text-inherit opacity-100">Problem Statement 26012</strong>, our computer vision models automatically delineate parcel boundaries and structures directly from the imagery, replacing manual plotting with high-speed automated accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 max-w-[1300px] mx-auto px-6 pt-8 pb-16">
        <h2 className="text-[2rem] md:text-[2.6rem] font-bold mb-10 tracking-tight text-center lg:text-left">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4 bg-white/80 dark:bg-[#111814]/80 backdrop-blur-md rounded-[2rem] p-4 shadow-sm border border-[#1c2b23]/5 dark:border-white/5 flex flex-col gap-2 transition-colors">
            {Object.keys(faqData).map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenFaq(0); }}
                className={`w-full text-left px-5 py-4 rounded-xl text-[15px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeCategory === cat ? "bg-[#1c2b23] dark:bg-white text-white dark:text-[#1c2b23] shadow-md" : "opacity-70 hover:bg-[#f4f8f5] dark:hover:bg-[#1a261f] hover:opacity-100"
                }`}
              >
                <span>{cat}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            {faqData[activeCategory].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white dark:bg-[#111814] rounded-[1.5rem] p-6 shadow-sm border border-[#1c2b23]/5 dark:border-white/5 transition-all cursor-pointer hover:shadow-md"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="text-[16px] md:text-[17px] font-bold leading-snug">{item.q}</h4>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform shrink-0 ${isOpen ? "rotate-45 bg-[#5b8c69] text-white" : "bg-[#f4f8f5] dark:bg-[#1a261f]"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>
                  {isOpen && (
                    <p className="mt-4 text-[14px] md:text-[15px] opacity-70 leading-relaxed font-medium pt-4 border-t border-[#1c2b23]/5 dark:border-white/5">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#1c2b23]/10 dark:border-white/5 bg-white/40 dark:bg-[#0c120e]/40 backdrop-blur-md pt-12 pb-8 transition-colors">
        <div className="max-w-[1300px] mx-auto px-6 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1c2b23] dark:text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold tracking-tight">BhuMap</span>
              </div>
              <p className="text-[14px] opacity-70 font-medium max-w-sm">
                Smart India Hackathon 2026 • Problem Statement 26012<br />
                AI-Based Automated Urban Parcel Mapping System.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 lg:gap-16">
              <div className="flex flex-col gap-3">
                <span className="text-[12px] font-bold uppercase tracking-wider">Platform</span>
                <a href="/about" onClick={(e) => scrollToSection(e, 'about')} className="text-[14px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold transition-colors">Core Overview</a>
                <a href="/features" onClick={(e) => scrollToSection(e, 'features')} className="text-[14px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold transition-colors">Extraction Engine</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-[12px] font-bold uppercase tracking-wider">Resources</span>
                <a href="/faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-[14px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold transition-colors">Documentation</a>
                <a href="/faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-[14px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold transition-colors">GIS Standards</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[#1c2b23]/10 dark:border-white/5">
            <span className="text-[13px] opacity-60 font-bold">
              © 2026 BhuMap Team. Smart India Hackathon Submission.
            </span>
            <div className="flex items-center gap-6">
              <span className="text-[13px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-[13px] opacity-70 hover:text-[#5b8c69] hover:opacity-100 font-bold cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}