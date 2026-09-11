"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Import useRouter
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "@/components/sections/Navbar";
import About from "@/components/sections/About";
import Footer from "@/components/sections/Footer";

export default function AboutPage() {
  const container = useRef<HTMLElement>(null);
  const router = useRouter(); // <-- Initialize router
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload") {
      router.replace("/"); // <-- Smooth redirect on reload
      return;
    }
    const savedUser = localStorage.getItem("bhumap_user");
    if (savedUser) setIsLoggedIn(true);
  }, [router]);

  useGSAP(() => {
    gsap.fromTo(".nav-elem", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" });
    gsap.fromTo(".about-visuals", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.1 });
    gsap.fromTo(".about-text-elem", { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power2.out", delay: 0.1 });
  }, { scope: container });

  return (
    <main ref={container} className="min-h-screen bg-[#f4f8f5] dark:bg-[#0c120e] text-[#1c2b23] dark:text-white/90 relative font-sans selection:bg-[#4a7258] selection:text-white pb-12 overflow-x-hidden transition-colors duration-300">
      <div className="absolute inset-0 z-0 opacity-100 dark:opacity-[0.05] pointer-events-none transition-opacity duration-300" style={{ backgroundImage: "url('/images/topography.svg')", backgroundSize: "100% auto", backgroundPosition: "center top", backgroundRepeat: "repeat-y" }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5b8c69]/15 dark:from-[#5b8c69]/10 via-transparent to-transparent pointer-events-none z-0"></div>

      <Navbar 
        isLoggedIn={isLoggedIn} 
        onWorkspaceAccess={() => router.push("/workspace")} // <-- Smooth route
        onLogout={() => { localStorage.removeItem("bhumap_user"); setIsLoggedIn(false); }} 
        onOpenAuth={() => router.push("/")} // <-- Smooth route
      />
      <div className="pt-20 pb-12 relative z-10 flex flex-col justify-center min-h-[60vh]">
        <About /> 
      </div>
      <Footer />
    </main>
  );
}