"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import AuthForm from "@/components/AuthForm";

gsap.registerPlugin(ScrollTrigger);

export default function BhuMapLanding() {
  const container = useRef<HTMLElement>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Extraction");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
      gsap.set(".nav-elem, .hero-text-elem, .hero-visual, .about-visuals, .about-text-elem, .feature-card, .workflow-phone, .process-step", {
        opacity: 1, y: 0, x: 0, scale: 1,
      });
      return;
    }

    gsap.fromTo(".nav-elem", 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: "power3.out" }
    );

    gsap.fromTo(".hero-text-elem",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out", delay: 0.1 }
    );

    gsap.fromTo(".hero-visual",
      { scale: 0.95, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 }
    );

    gsap.fromTo(".about-visuals",
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#about", start: "top 80%", toggleActions: "play reset play reset" } }
    );

    gsap.fromTo(".about-text-elem",
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#about", start: "top 80%", toggleActions: "play reset play reset" } }
    );

    gsap.fromTo(".feature-card",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: "#features", start: "top 85%", toggleActions: "play reset play reset" } }
    );

    gsap.fromTo(".workflow-text",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#workflow-cards", start: "top 80%", toggleActions: "play reset play reset" } }
    );

    gsap.fromTo(".workflow-phone",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: "#workflow-cards", start: "top 75%", toggleActions: "play reset play reset" } }
    );

    const steps = gsap.utils.toArray('.process-step');
    steps.forEach((step: any) => {
      gsap.fromTo(step,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: step, start: "top 85%", toggleActions: "play reset play reset" } }
      );
    });
  }, { scope: container });

  return (
    <main 
      ref={container}
      className="min-h-screen bg-[#f4f8f5] relative font-sans selection:bg-[#4a7258] selection:text-white pb-12 overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/topography.svg')",
        backgroundSize: "100% auto",
        backgroundPosition: "center top",
        backgroundRepeat: "repeat-y"
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5b8c69]/10 via-transparent to-transparent pointer-events-none z-0"></div>

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button onClick={() => setShowAuth(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300 font-bold">
              ✕ Close
            </button>
            <AuthForm onSuccess={() => setShowAuth(false)} />
          </div>
        </div>
      )}

      <nav className="relative z-20 max-w-[1400px] mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="nav-elem flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1c2b23"/>
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#1c2b23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[1.35rem] font-bold text-[#1c2b23] tracking-tight">BhuMap</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="nav-elem text-[14px] font-medium text-[#1c2b23]/80 hover:text-[#1c2b23] transition-colors">Platform</a>
          <a href="#features" className="nav-elem text-[14px] font-medium text-[#1c2b23]/80 hover:text-[#1c2b23] transition-colors">Features</a>
          <a href="#process" className="nav-elem text-[14px] font-medium text-[#1c2b23]/80 hover:text-[#1c2b23] transition-colors">How it works</a>
          <a href="#faq" className="nav-elem text-[14px] font-medium text-[#1c2b23]/80 hover:text-[#1c2b23] transition-colors">FAQ</a>
        </div>

        <button onClick={() => setShowAuth(true)} className="nav-elem flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#4a7258]/40 text-[#4a7258] text-[14px] font-semibold hover:bg-[#4a7258] hover:text-white transition-all shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <span className="hidden sm:inline">Launch Web GIS</span>
          <span className="inline sm:hidden">Login</span>
        </button>
      </nav>

      {/* TIGHTENED HERO SECTION */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pt-4 pb-12 lg:pt-8 lg:pb-16 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="w-full lg:w-[60%] flex flex-col items-start pt-2 lg:pt-4">
          <div className="hero-text-elem flex items-center gap-3 mb-5 lg:mb-6 bg-white/60 backdrop-blur-md pr-5 py-1.5 rounded-full border border-[#1c2b23]/5 shadow-sm">
            <div className="bg-[#5b8c69] p-2 rounded-full ml-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span className="text-[13px] md:text-[14px] font-bold text-[#1c2b23]">SIH 2026 Problem Statement 26012</span>
          </div>

          <h1 className="hero-text-elem text-[2.8rem] md:text-[3.8rem] leading-[1.05] lg:text-[4.6rem] font-bold text-[#1c2b23] tracking-tighter w-full">
            <span className="text-[#5b8c69]">BhuMap</span> is your <br />
            automated
            <div className="inline-flex align-middle mx-2 lg:mx-3 w-20 h-9 md:w-28 md:h-12 lg:w-[130px] lg:h-[60px] rounded-full overflow-hidden relative shadow-inner translate-y-[-4px] lg:translate-y-[-6px]">
              <Image src="/images/headline-pill.jpg" alt="Cadastral Map snippet" fill className="object-cover" priority />
            </div>
            <br />
            cadastral mapper
          </h1>

          <p className="hero-text-elem mt-5 lg:mt-6 text-[15px] md:text-[16px] text-[#1c2b23]/70 max-w-xl leading-[1.6] font-medium lg:pr-10">
            AI-Based Automated Urban Parcel Mapping and Cadastral Feature Extraction System. Transform high-resolution drone imagery into verified GIS datasets instantly.
          </p>

          <div className="hero-text-elem mt-8 lg:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <button onClick={() => setShowAuth(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#5b8c69] text-white text-[15px] font-semibold hover:bg-[#4a7258] hover:-translate-y-0.5 transition-all shadow-xl shadow-[#5b8c69]/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Access GIS Workspace
            </button>
            <div className="flex flex-col border-l-2 border-[#1c2b23]/10 pl-5 py-1">
              <span className="text-[13px] font-semibold text-[#1c2b23]">Web Environment</span>
              <span className="text-[13px] font-medium text-[#5b8c69]">Drone imagery ready</span>
            </div>
          </div>
        </div>

        <div className="hero-visual w-full lg:w-[40%] flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[260px] md:max-w-[320px] aspect-[19.5/40] bg-[#111814] rounded-[3rem] md:rounded-[3.5rem] p-[8px] md:p-[10px] shadow-2xl shadow-[#1c2b23]/25 border border-white/20">
            <div className="absolute top-[8px] md:top-[10px] left-1/2 -translate-x-1/2 w-[90px] md:w-[110px] h-[24px] md:h-[28px] bg-[#111814] rounded-b-[16px] md:rounded-b-[18px] z-20 flex justify-center items-center gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white/10"></div>
              <div className="w-8 h-1 md:w-10 md:h-1.5 rounded-full bg-white/10"></div>
            </div>
            <div className="relative w-full h-full bg-[#2a3630] rounded-[2.4rem] md:rounded-[2.8rem] overflow-hidden">
              <Image src="/images/hero-gis-interface.png" alt="BhuMap Workspace" fill className="object-cover object-center z-0" priority />
            </div>
            <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 w-[80px] md:w-[100px] h-[4px] bg-white rounded-full z-20"></div>
          </div>
        </div>
      </section>

      {/* TIGHTENED ABOUT SECTION & FIXED VISIBILITY OF MARKERS */}
      <section id="about" className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10 md:pt-16 pb-12 md:pb-16">
        <h2 className="text-[1.8rem] md:text-[2.2rem] font-bold text-[#1c2b23] mb-10 md:mb-14 tracking-tight text-center lg:text-left">About BhuMap Core</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center overflow-hidden lg:overflow-visible">
          
          <div className="about-visuals relative h-[450px] md:h-[550px] w-full flex justify-center items-center scale-[0.9] md:scale-100 origin-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] md:w-[350px] h-[280px] md:h-[350px] bg-[#5b8c69] rounded-full opacity-[0.08] blur-[60px]"></div>
            
            {/* Background Phone */}
            <div className="absolute right-[5%] lg:right-[10%] top-[20px] w-[220px] md:w-[250px] aspect-[19.5/40] bg-[#111814] rounded-[2.5rem] md:rounded-[3rem] p-[8px] md:p-[10px] shadow-xl border border-white/20 rotate-[3deg]">
              <div className="relative w-full h-full bg-[#2a3630] rounded-[2rem] md:rounded-[2.4rem] overflow-hidden">
                <Image src="/images/hero-gis-interface.png" alt="Map View" fill className="object-cover z-0" />
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent z-10"></div>
                <div className="absolute top-10 left-3 right-3 bg-black/50 backdrop-blur-md rounded-lg p-2 z-20">
                  <p className="text-white/90 text-[10px] font-medium text-center">Click on point to close polygon</p>
                </div>
                
                {/* HIGHLY VISIBLE MARKERS UPDATED HERE */}
                <div className="absolute inset-0 z-10">
                  <svg width="100%" height="100%" viewBox="0 0 240 500" fill="none">
                    <polygon points="120,200 180,320 80,300" fill="#FF5722" fillOpacity="0.35" stroke="#FF5722" strokeWidth="3.5" strokeDasharray="6 6"/>
                    <circle cx="120" cy="200" r="6" fill="#FF5722" stroke="#fff" strokeWidth="2.5"/>
                    <circle cx="180" cy="320" r="6" fill="#FF5722" stroke="#fff" strokeWidth="2.5"/>
                    <circle cx="80" cy="300" r="6" fill="#FF5722" stroke="#fff" strokeWidth="2.5"/>
                  </svg>
                </div>

                <div className="absolute bottom-5 left-3 right-3 flex gap-2 z-20">
                  <button className="flex-1 bg-white text-[#1c2b23] text-[11px] font-bold py-2.5 rounded-xl shadow-lg">Save Cadastral Plot</button>
                </div>
              </div>
            </div>

            {/* Foreground Phone */}
            <div className="absolute left-[5%] lg:left-[5%] top-[60px] w-[230px] md:w-[260px] aspect-[19.5/40] bg-[#111814] rounded-[2.8rem] md:rounded-[3.2rem] p-[8px] md:p-[10px] shadow-2xl shadow-[#1c2b23]/30 border border-white/20 z-30 -rotate-[2deg]">
              <div className="relative w-full h-full bg-[#f8f9f9] rounded-[2.2rem] md:rounded-[2.6rem] overflow-hidden flex flex-col">
                <div className="pt-10 px-4 pb-3 bg-white shadow-sm z-10 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-bold text-[#1c2b23]">Extraction Jobs</span>
                    <span className="text-[10px] font-semibold text-[#5b8c69] bg-[#5b8c69]/10 px-2 py-1 rounded-full">Sync</span>
                  </div>
                  <div className="flex bg-[#f0f3f1] p-1 rounded-xl">
                    <div className="flex-1 text-center text-[11px] font-medium text-[#1c2b23]/60 py-1.5">Drone Layer</div>
                    <div className="flex-1 text-center text-[11px] font-semibold text-white bg-[#1c2b23] rounded-lg py-1.5 shadow-sm">Extracted</div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden px-3 py-2 flex flex-col gap-2.5">
                  {[
                    { type: 'Urban Parcel 12A', area: '1.2004 ha', date: 'Validation Required' },
                    { type: 'Commercial Block', area: '3.6015 ha', date: 'Verified' },
                    { type: 'Access Corridor', area: '0.8710 ha', date: 'Pending Review' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-[#1c2b23]/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#5b8c69]/10 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b8c69" strokeWidth="2"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[#1c2b23]">{item.type}</span>
                          <span className="text-[10px] text-[#1c2b23]/70 font-medium">Area {item.area}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -left-2 md:-left-8 lg:-left-16 top-[35%] bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl z-40 flex flex-col gap-1 border border-[#1c2b23]/5">
              <span className="text-[10px] text-[#1c2b23]/50 font-medium">Extraction Alert</span>
              <span className="text-[12px] font-bold text-[#1c2b23]">Geometries Validated</span>
              <span className="text-[11px] font-medium text-[#5b8c69]">Ready for GIS export</span>
            </div>
          </div>

          <div className="flex flex-col items-start pt-0 lg:pt-4">
            <h3 className="about-text-elem text-[2rem] md:text-[2.4rem] font-bold text-[#1c2b23] leading-[1.1] mb-4 tracking-tight">
              Automated <span className="text-[#5b8c69]">Cadastral Extraction</span>
            </h3>
            <p className="about-text-elem text-[#1c2b23]/70 text-[15px] md:text-[16px] leading-relaxed mb-8 font-medium">
              Explore extracted urban parcels effortlessly, harness the power of AI-driven geometry delineation, and streamline surveyor validation tasks.
            </p>
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="about-text-elem flex items-start gap-4">
                <div className="mt-1">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path><path d="M9 9l6 6"></path></svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[15px] md:text-[16px] font-bold text-[#1c2b23] mb-1">Direct GIS Integration</h4>
                  <p className="text-[13px] md:text-[14px] text-[#1c2b23]/70 leading-relaxed font-medium">Select extracted parcels and perform automated area calculations. Export boundaries directly into GIS formats.</p>
                </div>
              </div>
              <div className="about-text-elem flex items-start gap-4">
                <div className="mt-1">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[15px] md:text-[16px] font-bold text-[#1c2b23] mb-1">Validate, Store and Export</h4>
                  <p className="text-[13px] md:text-[14px] text-[#1c2b23]/70 leading-relaxed font-medium">Compare extracted geometry with existing cadastral information. Track discrepancy history securely.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIGHTENED FEATURES SECTION */}
      <section id="features" className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10 md:pt-12 pb-10 md:pb-16">
        <h2 className="text-[1.8rem] md:text-[2.2rem] font-bold text-[#1c2b23] mb-8 md:mb-10 tracking-tight text-center lg:text-left">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="feature-card bg-white rounded-3xl p-6 shadow-sm border border-[#1c2b23]/5 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f5] border border-[#5b8c69]/30 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="1.5"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M12 7v5l3 3"/></svg>
            </div>
            <h4 className="text-[16px] md:text-[17px] font-bold text-[#1c2b23] mb-2">Automated Pipeline</h4>
            <p className="text-[13px] text-[#1c2b23]/70 leading-relaxed font-medium">Drone imagery is processed through AI models, pulling geometries directly to the map automatically.</p>
          </div>
          <div className="feature-card bg-white rounded-3xl p-6 shadow-sm border border-[#1c2b23]/5 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f5] border border-[#5b8c69]/30 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <h4 className="text-[16px] md:text-[17px] font-bold text-[#1c2b23] mb-2">High Accuracy Extraction</h4>
            <p className="text-[13px] text-[#1c2b23]/70 leading-relaxed font-medium">Advanced algorithms ensure high fidelity to land-use features, identifying buildings and roads.</p>
          </div>
          <div className="feature-card bg-white rounded-3xl p-6 shadow-sm border border-[#1c2b23]/5 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f5] border border-[#5b8c69]/30 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h4 className="text-[16px] md:text-[17px] font-bold text-[#1c2b23] mb-2">Surveyor Validation</h4>
            <p className="text-[13px] text-[#1c2b23]/70 leading-relaxed font-medium">Easy access to validation tools through the interface, streamlining geometry adjustment workflows.</p>
          </div>
          <div className="feature-card bg-white rounded-3xl p-6 shadow-sm border border-[#1c2b23]/5 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f5] border border-[#5b8c69]/30 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h4 className="text-[16px] md:text-[17px] font-bold text-[#1c2b23] mb-2">Standardized Export</h4>
            <p className="text-[13px] text-[#1c2b23]/70 leading-relaxed font-medium">Seamlessly export verified parcel geometries directly into state registers from the web dashboard.</p>
          </div>
        </div>
      </section>

      {/* TIGHTENED WORKFLOW SECTION (Phones correctly stacked & displayed) */}
      <section id="workflow-cards" className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10 md:pt-16 pb-12 overflow-hidden">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <h2 className="workflow-text text-[2rem] md:text-[2.8rem] font-bold text-[#1c2b23] leading-[1.1] mb-4 tracking-tight">
            Streamline <span className="text-[#5b8c69]">cadastral reporting</span>
          </h2>
          <p className="workflow-text text-[14px] md:text-[15px] text-[#1c2b23]/70 leading-relaxed font-medium">
            BhuMap is designed to streamline your feature extraction exports. Download standardized GIS formats, share verified geometries, and manage surveyor logs with just one click.
          </p>
        </div>
        
        <div className="relative flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-0 mt-6">
          <div className="workflow-phone z-20 lg:z-10 relative lg:translate-x-12 lg:translate-y-8 w-full max-w-[260px] md:max-w-[280px] aspect-[19.5/40] bg-[#111814] rounded-[2.8rem] p-[8px] shadow-xl border border-white/20 hidden md:block">
            <div className="relative w-full h-full bg-[#f0f3f1] rounded-[2.2rem] overflow-hidden flex flex-col">
              <div className="pt-10 px-5 pb-3 flex flex-col gap-1 z-10"><span className="text-[14px] font-bold text-[#1c2b23] text-center">Extraction Logs</span></div>
              <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
                {[
                  { id: '26012-001', time: '10:00am' },
                  { id: '26012-002', time: '08:00am' },
                  { id: '26012-003', time: '01:00pm' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-[#1c2b23]/5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <div className="w-6 h-6 rounded-md bg-[#e35a5a]/10 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e35a5a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-[#1c2b23]">Extract</span><span className="text-[9px] text-[#1c2b23]/60">ID-{item.id}</span></div>
                      </div>
                    </div>
                    <button className="w-full bg-[#f4f8f5] text-[#1c2b23] text-[10px] font-bold py-1.5 rounded-lg">Export Report</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="workflow-phone z-30 relative w-full max-w-[280px] md:max-w-[320px] aspect-[19.5/40] bg-[#111814] rounded-[3rem] p-[10px] shadow-2xl shadow-[#1c2b23]/30 border border-white/20">
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-[#111814] rounded-b-[16px] z-20 flex justify-center items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/10"></div><div className="w-8 h-1 rounded-full bg-white/10"></div></div>
            <div className="relative w-full h-full bg-[#2a3630] rounded-[2.4rem] overflow-hidden">
              <Image src="/images/hero-gis-interface.png" alt="BhuMap Map" fill className="object-cover z-0" priority />
              <div className="absolute top-10 left-3 right-3 bg-[#111814]/80 backdrop-blur-md rounded-xl p-3 z-20 flex justify-between items-center border border-white/10"><span className="text-white text-[10px] font-medium">7134000000:00:033:0402</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <div className="absolute bottom-5 right-3 flex flex-col gap-2 z-20"><button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c2b23" strokeWidth="2"><path d="M12 2L2 22l10-4 10 4L12 2z"/></svg></button></div>
            </div>
          </div>
          
          <div className="workflow-phone z-10 relative lg:-translate-x-12 lg:translate-y-8 w-full max-w-[260px] md:max-w-[280px] aspect-[19.5/40] bg-[#111814] rounded-[2.8rem] p-[8px] shadow-xl border border-white/20 hidden lg:block">
            <div className="relative w-full h-full bg-[#e2ebe6] rounded-[2.2rem] overflow-hidden flex flex-col px-4 pt-12 pb-4">
              <div className="flex items-center gap-3 mb-4"><span className="text-[12px] font-bold text-[#1c2b23] flex-1 text-center">Export Config</span></div>
              <div className="flex flex-col gap-1 mb-6"><span className="text-[12px] font-bold text-[#1c2b23]">Urban_Parcel_26012</span><span className="text-[10px] text-[#1c2b23]/60 font-medium">7134000000:00:033:0402</span></div>
              <div className="flex justify-between items-center mb-6 border-b border-[#1c2b23]/10 pb-3"><span className="text-[12px] font-bold text-[#1c2b23]">Total Area</span><span className="text-[13px] font-bold text-[#1c2b23]">4.82 ha</span></div>
              <div className="flex flex-col gap-3 mt-auto">
                <span className="text-[12px] font-bold text-[#1c2b23]">Format: GeoJSON</span>
                <button className="w-full border border-[#1c2b23]/20 bg-transparent text-[#1c2b23] text-[12px] font-bold py-3 rounded-xl hover:bg-[#1c2b23]/5 transition-colors">Generate Export</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIGHTENED PROCESS SECTION WITH ACTUAL MAP BACKGROUNDS */}
      <section id="process" className="relative z-10 max-w-[1200px] mx-auto px-6 pt-12 md:pt-20 pb-16">
        <div className="mb-12 lg:mb-16 text-center lg:text-left">
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#1c2b23] mb-4 tracking-tight">How it works</h2>
          <p className="text-[14px] md:text-[16px] text-[#1c2b23]/70 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            Embrace efficiency as you navigate the automated pipeline of cadastral feature extraction, empowering surveyors to validate drone-derived datasets with ease.
          </p>
        </div>

        <div className="flex flex-col gap-16 lg:gap-24">
          
          <div className="process-step flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16 relative">
            <div className="w-full lg:w-1/2 relative h-[280px] md:h-[350px] flex items-center justify-center rounded-[2rem] overflow-hidden border border-[#1c2b23]/10 shadow-lg">
              <Image src="/images/hero-gis-interface.png" alt="Map View" fill className="object-cover opacity-50 z-0" />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-10"></div>
              
              <div className="absolute right-[10%] top-[15%] bg-white rounded-2xl p-5 shadow-xl w-[220px] md:w-[260px] z-20">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#1c2b23]">Imagery Source</span>
                    <div className="bg-[#f4f8f5] rounded-xl px-3 py-2 text-[11px] text-[#1c2b23]/60 font-medium border border-[#1c2b23]/5">Drone_Ortho_Sector4</div>
                  </div>
                </div>
              </div>
              <div className="absolute left-[5%] bottom-[15%] bg-white/90 backdrop-blur-md rounded-[1.5rem] p-4 shadow-xl w-[150px] z-20">
                <span className="block text-[12px] font-bold text-[#1c2b23] mb-1">Surveyor Profile</span>
                <span className="block text-[10px] text-[#1c2b23]/60 font-medium">Validated Access</span>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 relative">
              <span className="absolute -top-8 -left-4 md:-top-12 md:-left-6 text-[5rem] md:text-[7rem] font-bold text-[#1c2b23]/5 leading-none select-none z-0">01</span>
              <div className="relative z-10">
                <h3 className="text-[1.8rem] font-bold text-[#1c2b23] mb-3">Data Ingestion</h3>
                <p className="text-[14px] md:text-[15px] text-[#1c2b23]/70 leading-relaxed font-medium">
                  Initiate the workflow by connecting state land registers and uploading high-resolution drone orthomosaics. Create secure surveyor accounts to maintain a verified chain of custody.
                </p>
              </div>
            </div>
          </div>

          <div className="process-step flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative">
            <div className="w-full lg:w-1/2 relative order-2 lg:order-1">
              <span className="absolute -top-8 -left-4 md:-top-12 md:-left-6 text-[5rem] md:text-[7rem] font-bold text-[#1c2b23]/5 leading-none select-none z-0">02</span>
              <div className="relative z-10">
                <h3 className="text-[1.8rem] font-bold text-[#1c2b23] mb-3">AI Feature Extraction</h3>
                <p className="text-[14px] md:text-[15px] text-[#1c2b23]/70 leading-relaxed font-medium">
                  Utilize advanced computer vision models to automatically delineate parcel boundaries, building footprints, and road networks from the ingested imagery.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative h-[280px] md:h-[350px] flex items-center justify-center order-1 lg:order-2 rounded-[2rem] overflow-hidden border border-[#1c2b23]/10 shadow-lg">
              <Image src="/images/hero-gis-interface.png" alt="Map View" fill className="object-cover opacity-50 z-0" />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-10"></div>
              
              <div className="absolute left-[10%] top-[20%] bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl w-[200px] md:w-[240px] z-20 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#1c2b23]">AI Polygons</span>
                  <div className="w-8 h-5 bg-[#5b8c69] rounded-full relative p-1"><div className="w-3 h-3 bg-white rounded-full absolute right-1"></div></div>
                </div>
              </div>

              <div className="absolute right-[5%] bottom-[25%] bg-white rounded-2xl p-3 shadow-xl w-[220px] md:w-[260px] z-20 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#f4f8f5] rounded-xl flex items-center px-3 justify-between py-2.5">
                    <span className="text-[10px] text-[#1c2b23]/70 font-medium">Search Block ID...</span>
                  </div>
                </div>
                <button className="w-full bg-[#5b8c69] text-white text-[11px] font-semibold py-2 rounded-lg">Run Extraction Model</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIGHTENED FAQ SECTION */}
      <section id="faq" className="relative z-10 max-w-[1400px] mx-auto px-6 pt-12 md:pt-16 pb-16">
        <h2 className="text-[2rem] md:text-[2.6rem] font-bold text-[#1c2b23] mb-10 tracking-tight text-center lg:text-left">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-[#1c2b23]/5 flex flex-col gap-2">
            {Object.keys(faqData).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenFaq(0);
                }}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-[14px] font-semibold transition-all flex items-center justify-between ${
                  activeCategory === cat 
                    ? "bg-[#1c2b23] text-white shadow-md" 
                    : "text-[#1c2b23]/70 hover:bg-[#f4f8f5] hover:text-[#1c2b23]"
                }`}
              >
                <span>{cat}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-3">
            {faqData[activeCategory].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-[#1c2b23]/5 transition-all cursor-pointer"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="text-[15px] md:text-[16px] font-bold text-[#1c2b23]">{item.q}</h4>
                    <div className={`w-8 h-8 rounded-full bg-[#f4f8f5] flex items-center justify-center transition-transform shrink-0 ${isOpen ? "rotate-45 bg-[#5b8c69] text-white" : "text-[#1c2b23]"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>
                  {isOpen && (
                    <p className="mt-3 text-[14px] text-[#1c2b23]/70 leading-relaxed font-medium pt-3 border-t border-[#1c2b23]/5">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIGHTENED FOOTER SECTION */}
      <footer className="relative z-10 border-t border-[#1c2b23]/10 bg-white/40 backdrop-blur-md pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1c2b23"/>
                  <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#1c2b23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold text-[#1c2b23] tracking-tight">BhuMap</span>
              </div>
              <p className="text-[13px] text-[#1c2b23]/70 font-medium max-w-md">
                Smart India Hackathon 2026 • Problem Statement 26012<br />
                AI-Based Automated Urban Parcel Mapping System.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 lg:gap-12">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-[#1c2b23] uppercase tracking-wider">Platform</span>
                <a href="#about" className="text-[13px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium">Core Overview</a>
                <a href="#features" className="text-[13px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium">Extraction Engine</a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-[#1c2b23] uppercase tracking-wider">Resources</span>
                <a href="#faq" className="text-[13px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium">Documentation</a>
                <a href="#faq" className="text-[13px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium">GIS Standards</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[#1c2b23]/10">
            <span className="text-[12px] text-[#1c2b23]/60 font-medium">
              © 2026 BhuMap Team. Smart India Hackathon Submission.
            </span>
            <div className="flex items-center gap-6">
              <span className="text-[12px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium cursor-pointer">Privacy Policy</span>
              <span className="text-[12px] text-[#1c2b23]/70 hover:text-[#1c2b23] font-medium cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}