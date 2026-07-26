"use client";

import React from "react";
import { Star, CheckCircle2 } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      role: "Computer Science Student",
      institution: "IIT Bombay",
      name: "Aarav Sharma",
      quote: "StudySpace.AI completely changed the way I prepare for exams. Uploading a 2-hour lecture recording and getting structured notes with equations in 30 seconds feels like a superpower.",
      rating: 5,
      tag: "Semester Topper"
    },
    {
      role: "Professor & Educator",
      institution: "BITS Pilani",
      name: "Dr. Meera Nambiar",
      quote: "Creating quizzes and revision material now takes seconds instead of hours. The MCQ generator creates well-distanced distractors that test deep conceptual clarity.",
      rating: 5,
      tag: "Verified Educator"
    },
    {
      role: "Competitive Exam Aspirant",
      institution: "GATE & UPSC Prep",
      name: "Rohan Varma",
      quote: "The AI tutor and flashcards helped me retain concepts much better. Having source timestamp citations means I can double-check complex proofs without guessing.",
      rating: 5,
      tag: "AIR 42 Ranker"
    }
  ];

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-[#FFFDF9] border-b border-[#E6E0D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Real Student Results
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Loved by Students & Educators
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            See how top performers rely on StudySpace.AI to accelerate their learning output.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all duration-200 flex flex-col justify-between space-y-6 relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t.tag}
                  </span>
                </div>

                <p className="text-sm text-[#1C1917] italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#E6E0D6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0D9488] to-[#2563EB] text-white font-bold text-sm flex items-center justify-center">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{t.name}</h4>
                  <p className="text-xs text-[#78716C]">{t.role} • {t.institution}</p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
