"use client";

import React, { useState } from "react";
import CanvasAuthModal from "./components/CanvasAuthModal";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);

  const features = [
    {
      icon: "📚",
      title: "Smart Study Materials",
      description:
        "AI-powered summaries and study guides tailored to your courses",
    },
    {
      icon: "🤖",
      title: "AI Tutor Assistant",
      description: "Get instant help with difficult concepts and homework",
    },
    {
      icon: "📝",
      title: "Quiz Generator",
      description: "Auto-generated practice quizzes to test your knowledge",
    },
    {
      icon: "⏰",
      title: "Study Planning",
      description: "Personalized study schedules and progress tracking",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-black border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl text-white tracking-widest font-bold">
            SDSU StudyBot
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              Features
            </a>
            <a
              href="#about"
              className="hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              Contact
            </a>
            <button className="bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-6 py-2 border border-[#8b2e2e] text-white font-semibold transition-all duration-300">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-[#1f1f1f] p-4 space-y-4">
            <a
              href="#features"
              className="block hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              Features
            </a>
            <a
              href="#about"
              className="block hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              About
            </a>
            <a
              href="#contact"
              className="block hover:text-[#8b2e2e] transition text-gray-400 text-sm font-semibold"
            >
              Contact
            </a>
            <button className="w-full bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-6 py-2 border border-[#8b2e2e] text-white font-semibold transition-all duration-300">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="pt-32 pb-20 px-6 relative"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 46, 46, 0.2), transparent)",
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl mb-6 leading-tight text-white tracking-tighter font-bold">
            Study<span className="text-[#8b2e2e] block">Bot</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-semibold">
            Start by linking your Canvas auth token below
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => setIsCanvasModalOpen(true)}
              className="bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-8 py-4 border border-[#8b2e2e] text-white font-semibold text-lg transition-all duration-300"
            >
              Link Canvas
            </button>
          </div>

          {/* Chat Interface Box */}
          <div className="relative w-full max-w-4xl mx-auto h-[500px] bg-[#080808] border border-[#1f1f1f] shadow-[0_4px_24px_rgba(0,0,0,0.8)] overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      </section>

      <CanvasAuthModal
        isOpen={isCanvasModalOpen}
        onClose={() => {
          setIsCanvasModalOpen(false);
        }}
      />
    </div>
  );
}
