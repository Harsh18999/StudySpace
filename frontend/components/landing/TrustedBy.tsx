"use client";

import React from "react";
import { GraduationCap, Landmark, BookOpenCheck, School, Award } from "lucide-react";

export function TrustedBy() {
  const logos = [
    { name: "IIT Students", icon: GraduationCap, category: "Top Tech Institutes" },
    { name: "NIT Scholars", icon: Landmark, category: "Engineering Excellence" },
    { name: "Global Universities", icon: School, category: "Higher Education" },
    { name: "Leading Educators", icon: BookOpenCheck, category: "Curriculum Creators" },
    { name: "Competitive Exam Aspirants", icon: Award, category: "GATE & UPSC Prep" },
  ];

  return (
    <section className="py-12 border-y border-[#E6E0D6]/80 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        <p className="text-xs uppercase font-bold tracking-widest text-[#A8A29E] font-['Plus_Jakarta_Sans']">
          Trusted by top students & educators across top institutions
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center justify-center opacity-75 hover:opacity-100 transition-opacity duration-300">
          {logos.map((logo, idx) => {
            const Icon = logo.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-[#0D9488]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#78716C] group-hover:text-[#0D9488] group-hover:bg-[#0D9488]/10 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{logo.name}</p>
                  <p className="text-[10px] text-[#A8A29E]">{logo.category}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
