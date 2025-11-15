"use client";

import React, { useEffect, useState } from "react";
import { useCanvasTokenContext } from "./CanvasTokenProvider";

interface CanvasAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CanvasAuthModal({
  isOpen,
  onClose,
}: CanvasAuthModalProps) {
  const ctx = useCanvasTokenContext();
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInputValue(ctx.token ?? "");
    }
  }, [isOpen, ctx.token]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // store token via context
    ctx.setToken(inputValue);
    onClose();
  };

  const handleCancel = () => {
    // just close without changing stored token
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-[#1f1f1f] shadow-[0_4px_24px_rgba(0,0,0,0.8)] p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          Link Canvas Account
        </h2>
        <p className="text-gray-400 mb-6 text-sm font-semibold">
          Enter your Canvas authentication token to get started:
        </p>

        <input
          type="password"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste your Canvas auth token"
          className="w-full px-4 py-2 bg-[#1f1f1f] border border-[#1f1f1f] text-white placeholder-gray-500 focus:outline-none focus:border-[#8b2e2e] mb-6"
        />

        <div className="flex gap-4">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-[#1f1f1f] text-gray-400 hover:bg-[#141414] transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] border border-[#8b2e2e] text-white font-semibold transition-all duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
