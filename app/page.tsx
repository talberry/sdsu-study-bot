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
          <div className="text-2xl text-white font-bold">SDSU StudyBot</div>

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
            <button className="bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-6 py-2 border border-[#8b2e2e] text-white font-semibold transition-all duration-300 rounded-lg">
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
            <button className="w-full bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-6 py-2 border border-[#8b2e2e] text-white font-semibold transition-all duration-300 rounded-lg">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section - Full screen title with gradient fade */}
      <section
        className="h-screen pt-28 px-6 relative flex items-center justify-center text-center"
        style={{
          background:
            "linear-gradient(to bottom, rgba(139, 46, 46, 0.8) 0%, rgba(139, 46, 46, 0.4) 50%, rgba(0, 0, 0, 1) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl md:text-8xl leading-tight text-white tracking-tighter font-bold">
            <span className="block">SDSU</span>
            <span className="block text-white">Canvas Study Bot</span>
          </h1>

          {/* Scroll hint */}
          <a
            href="#link"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 hover:text-white transition text-4xl"
            aria-label="Scroll to link section"
          >
            ↓
          </a>
        </div>
      </section>

      {/* Link Canvas Section */}
      <section id="link" className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Link your Canvas token
          </h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
            Start by linking your Canvas authentication token to personalize
            your study experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsCanvasModalOpen(true)}
              className="bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] px-8 py-4 border border-[#8b2e2e] text-white font-semibold text-lg transition-all duration-300 rounded-lg"
            >
              Link Canvas
            </button>
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section id="chat" className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4 text-center">
            Chat with your Study Bot
          </h3>
          <div className="relative w-full max-w-4xl mx-auto h-[500px] overflow-hidden">
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
