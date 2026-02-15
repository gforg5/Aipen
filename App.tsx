import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Book, Chapter, GenerationProgress, BookHistoryEvent } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'aipen_projects_v5';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, currentStep, activeProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  const handleNav = (step: AppState) => {
    setStep(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer group z-[110]" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-[360deg]">
            <i className="fas fa-pen-nib text-sm"></i>
          </div>
          <div className="text-perspective-container">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 serif-text animate-wobble-killer text-3d-hover">AiPen</h1>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Studio', step: AppState.HOME },
            { label: 'Developer', step: AppState.DEVELOPER },
            { label: 'Technology', step: AppState.ABOUT },
          ].map((item) => (
            <div key={item.label} className="text-perspective-container">
              <button 
                onClick={() => handleNav(item.step)} 
                className={`px-4 py-1.5 rounded-full transition-all text-[10px