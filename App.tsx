
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Book, Chapter, GenerationProgress } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'AIPEN_V11_STABLE_PRO';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, currentStep, activeProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleNav = (step: AppState) => {
    setStep(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-[360deg]">
            <i className="fas fa-pen-nib text-sm"></i>
          </div>
          <h1 className="text-xl font-black text-slate-900 serif-text tracking-tighter animate-wobble-killer">AiPen</h1>
        </div>
        
        <nav className="hidden lg:flex items-center gap-2">
          {[{ label: 'Studio', step: AppState.HOME }, { label: 'Architect', step: AppState.DEVELOPER }].map((item) => (
            <button key={item.label} onClick={() => handleNav(item.step)} 
              className={`px-5 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === item.step ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {activeProject && currentStep !== AppState.VIEWER && (
            <button onClick={() => handleNav(AppState.VIEWER)} className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-xl font-black text-[9px] uppercase tracking-widest">
              <i className="fas fa-play text-[8px]"></i> Resume
            </button>
          )}
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-900"><i className="fas fa-bars-staggered"></i></button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-pen-nib text-xs"></i></div><span className="text-base font-black text-slate-900 serif-text uppercase tracking-widest">Navigation</span></div>
          <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center"><i className="fas fa-times"></i></button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 gap-4">
          {[{ label: 'Studio', step: AppState.HOME }, { label: 'Architect', step: AppState.DEVELOPER }].map((item) => (
            <button key={item.label} onClick={() => handleNav(item.step)} className={`text-3xl font-black serif-text text-left p-4 rounded-2xl ${currentStep === item.step ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</button>
          ))}
        </div>
      </div>
    </>
  );
};

const VisualPlaceholder: React.FC<{desc: string, genre: string, onReplace: (desc: string, b64: string) => void}> = ({desc, genre, onReplace}) => {
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const b64 = await geminiService.generateChapterImage(desc, genre);
      onReplace(desc, b64);
    } catch (e) { console.error(e); }
    setLoading(false);
  }
  return (
    <div className="my-16 p-10 bg-slate-50 rounded-[40px] border border-slate-100 text-center no-print">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Neural Materialization Required</div>
      <p className="text-xl text-slate-700 italic font-medium max-w-xl mx-auto mb-8 serif-text">"{desc}"</p>
      <button onClick={generate} disabled={loading} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-50">
        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-image mr-2"></i>}
        {loading ? "Materializing..." : "Generate Visual Context"}
      </button>
    </div>
  )
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [step, setStep] = useState<AppState>(AppState.HOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Science Fiction');
  const [length, setLength] = useState(100);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [progress, setProgress] = useState<GenerationProgress>({ currentChapter: 0, totalChapters: 0, message: '' });

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const ensureApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }
    }
  };

  const startOutline = async () => {
    if (!title) { setError("Title required."); return; }
    setLoading(true); setError(null);
    await ensureApiKey();

    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title, author: author || 'SMA', genre, targetLength: length,
        outline, covers: [], createdAt: new Date().toISOString(), history: []
      };
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      setError(err.message || "Failed to start. Check your API key.");
    } finally { setLoading(false); }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING); setLoading(true); setError(null);
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Priming cores...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({ currentChapter: i + 1, totalChapters: updatedOutline.length, message: `Drafting: ${updatedOutline[i].title}` });
        const content = await geminiService.generateChapterContent(currentBook.title, currentBook.genre, updatedOutline[i]);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = (content || '').split(/\s+/).length;
        
        const partialBook = { ...currentBook, outline: [...updatedOutline] };
        setCurrentBook(partialBook);
        setProjects(prev => [partialBook, ...prev.filter(p => p.id !== partialBook.id)]);
      }
      setStep(AppState.VIEWER);
    } catch (err: any) { 
      console.error(err);
      setError("Interrupted. Please retry."); 
    } finally { setLoading(false); }
  };

  const deleteProject = (id: string) => {
    if (confirm("Delete archive?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentBook?.id === id) setCurrentBook(null);
    }
  };

  const exportBook = () => {
    if (!currentBook) return;
    document.title = `${currentBook.title} - ${currentBook.author}`;
    window.print();
  };

  const handleReplaceVisual = (desc: string, base64: string, chapterIdx: number) => {
    if (!currentBook) return;
    const outline = [...currentBook.outline];
    const chapter = outline[chapterIdx];
    if (chapter.content) {
      const visualTag = `[VISUAL: ${desc}]`;
      chapter.content = chapter.content.replace(visualTag, `<img src="${base64}" class="w-full rounded-3xl my-12 shadow-2xl" alt="${desc}" />`);
      
      const updatedBook = { ...currentBook, outline };
      setCurrentBook(updatedBook);
      setProjects(prev => prev.map(p => p.id === updatedBook.id ? updatedBook : p));
    }
  };

  const renderContent = () => {
    switch (step) {
      case AppState.HOME:
        return (
          <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
              <div className="animate-reveal-skew">
                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                  <i className="fas fa-sparkles"></i> Future of Publishing
                </div>
                <h2 className="text-6xl font-black text-slate-900 serif-text leading-[1.1] mb-8">
                  Architecting <span className="text-indigo-600">Masterpieces</span> through Silicon.
                </h2>
                <p className="text-xl text-slate-500 mb-10 leading-relaxed font-light">
                  Professional book studio powered by Gemini 3.0 Ultra. Generate deep-narrative manuscripts, 
                  cinematic illustrations, and production-ready PDFs in minutes.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setStep(AppState.DEVELOPER)} className="btn-killer bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl">
                    Create New Book
                  </button>
                </div>
              </div>
              <div className="killer-perspective hidden lg:block">
                <div className="killer-tilt aspect-[4/5] bg-slate-100 shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200" alt="Book concept" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-12">
                    <div className="text-white text-3xl font-bold serif-text">Aetherbound</div>
                    <div className="text-white/70 text-sm uppercase tracking-widest">A Sci-Fi Epic</div>
                  </div>
                </div>
              </div>
            </div>

            {projects.length > 0 && (
              <section className="mb-24">
                <div className="flex justify-between items-end mb-12">
                  <h3 className="text-4xl font-bold serif-text">Archive</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map(book => (
                    <div key={book.id} className="hover-card group bg-white border border-slate-100 rounded-[32px] p-8 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1 bg-slate-100 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-wider">{book.genre}</div>
                        <button onClick={() => deleteProject(book.id)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
                      </div>
                      <h4 className="text-2xl font-bold text-slate-900 mb-4 line-clamp-1 serif-text">{book.title}</h4>
                      <div className="text-sm text-slate-400 mb-8 flex items-center gap-4">
                        <span>{book.outline.filter(c => c.status === 'completed').length} Chapters</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => { setCurrentBook(book); setStep(AppState.VIEWER); }} className="w-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white py-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
                        Open Studio
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        );

      case AppState.DEVELOPER:
        return (
          <main className="max-w-3xl mx-auto px-6 py-24">
            <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-2xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black serif-text mb-4">Architect Your Book</h2>
                <p className="text-slate-500">Define the core parameters of your literary project.</p>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Book Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg font-medium" placeholder="The Shadow of Mars" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Genre</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all">
                      <option>Science Fiction</option>
                      <option>High Fantasy</option>
                      <option>Business/Self-Help</option>
                      <option>Historical Fiction</option>
                      <option>Thriller/Suspense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Target Length (Pages)</label>
                    <input type="number" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                  </div>
                </div>
                {error && <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm font-medium"><i className="fas fa-exclamation-triangle mr-2"></i> {error}</div>}
                <button onClick={startOutline} disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50">
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                  {loading ? 'Processing Neural Patterns...' : 'Initialize Architect'}
                </button>
              </div>
            </div>
          </main>
        );

      case AppState.OUTLINING:
        return currentBook && (
          <main className="max-w-4xl mx-auto px-6 py-24">
            <div className="mb-12 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black serif-text mb-2">Architectural Blueprint</h2>
                <p className="text-slate-500">Review the generated structure before materializing the content.</p>
              </div>
              <button onClick={startWriting} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                Materialize Book
              </button>
            </div>
            <div className="space-y-4">
              {currentBook.outline.map((ch, idx) => (
                <div key={ch.id} className="bg-white border border-slate-100 p-8 rounded-3xl hover:shadow-lg transition-all group">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 mb-4">{ch.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        {ch.subsections.map((sub, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-lg border border-slate-100">{sub}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        );

      case AppState.WRITING:
        return (
          <main className="max-w-2xl mx-auto px-6 py-48 text-center">
            <div className="relative mb-16 inline-block">
              <div className="w-48 h-48 border-[12px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-900">
                  {Math.round((progress.currentChapter / progress.totalChapters) * 100)}%
                </span>
              </div>
            </div>
            <h2 className="text-4xl font-black serif-text mb-6">Writing Manuscript...</h2>
            <p className="text-xl text-slate-500 font-light mb-12">{progress.message}</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-1000" 
                style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}
              ></div>
            </div>
            <p className="mt-8 text-slate-400 text-sm italic">Gemini 3.0 Ultra is synthesizing high-prose content. Please stay on this page.</p>
          </main>
        );

      case AppState.VIEWER:
        return currentBook && (
          <main className="bg-slate-50 min-h-screen py-12 px-4 no-print">
            <div className="max-w-4xl mx-auto">
              {/* SIDEBAR NAVIGATION */}
              <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 p-2 bg-white/50 backdrop-blur rounded-3xl border border-slate-200 shadow-2xl z-50">
                {currentBook.outline.map((ch, idx) => (
                  <button 
                    key={ch.id}
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeChapterIndex === idx ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
                    title={ch.title}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* ACTION BAR */}
              <div className="flex justify-between items-center mb-12">
                <button onClick={() => setStep(AppState.HOME)} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  <i className="fas fa-arrow-left"></i> Archive
                </button>
                <div className="flex gap-4">
                  <button onClick={exportBook} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                    <i className="fas fa-file-pdf"></i> Export PDF
                  </button>
                </div>
              </div>

              {/* BOOK READER */}
              <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[48px] overflow-hidden">
                <div className="p-16 md:p-32 book-page">
                  <div className="text-center mb-32">
                    <div className="mb-12 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                      {currentBook.genre}
                    </div>
                    <h2 className="text-7xl font-black serif-text text-slate-900 mb-8 leading-tight tracking-tighter">
                      {currentBook.title}
                    </h2>
                    <div className="text-2xl text-slate-400 italic font-light serif-text">
                      by {currentBook.author}
                    </div>
                  </div>

                  <div className="prose-book">
                    <div className="mb-8 flex items-center gap-4 text-slate-300">
                      <div className="flex-1 h-[1px] bg-slate-100"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Chapter {activeChapterIndex + 1}</span>
                      <div className="flex-1 h-[1px] bg-slate-100"></div>
                    </div>
                    <h3 className="text-5xl font-black text-slate-900 mb-16 text-center serif-text">
                      {currentBook.outline[activeChapterIndex].title}
                    </h3>
                    
                    <div className="prose-container" dangerouslySetInnerHTML={{ 
                      __html: (currentBook.outline[activeChapterIndex].content || '').split('\n').map(line => {
                        if (line.includes('[VISUAL:')) {
                          const desc = line.match(/\[VISUAL: (.*?)\]/)?.[1] || '';
                          return `<div id="visual-${activeChapterIndex}-${desc.replace(/\s/g, '-')}"></div>`;
                        }
                        return marked.parse(line);
                      }).join('')
                    }}></div>

                    {/* RENDER PLACEHOLDERS */}
                    {(currentBook.outline[activeChapterIndex].content || '').match(/\[VISUAL: (.*?)\]/g)?.map((match, i) => {
                      const desc = match.replace('[VISUAL: ', '').replace(']', '');
                      return (
                        <VisualPlaceholder 
                          key={i} 
                          desc={desc} 
                          genre={currentBook.genre} 
                          onReplace={(d, b64) => handleReplaceVisual(d, b64, activeChapterIndex)} 
                        />
                      );
                    })}

                    <div className="mt-24 pt-12 border-t border-slate-50 flex justify-between items-center text-slate-400 text-xs italic serif-text no-print">
                      <span>{currentBook.outline[activeChapterIndex].wordCount} words synthesized</span>
                      <span>Page {activeChapterIndex + 5}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between mt-12 mb-24 no-print">
                <button 
                  disabled={activeChapterIndex === 0}
                  onClick={() => setActiveChapterIndex(v => v - 1)}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold hover:bg-slate-50 transition-all disabled:opacity-20 shadow-sm"
                >
                  <i className="fas fa-chevron-left text-xs"></i> Previous Chapter
                </button>
                <button 
                  disabled={activeChapterIndex === currentBook.outline.length - 1}
                  onClick={() => setActiveChapterIndex(v => v + 1)}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold hover:bg-slate-50 transition-all disabled:opacity-20 shadow-sm"
                >
                  Next Chapter <i className="fas fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          </main>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      <Header setStep={setStep} currentStep={step} activeProject={!!currentBook} />
      {renderContent()}
      
      <footer className="py-16 px-6 border-t border-slate-50 text-center no-print bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-pen-nib text-[10px]"></i></div>
            <span className="text-lg font-black serif-text uppercase tracking-widest text-slate-900">AiPen</span>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase max-w-lg mx-auto leading-relaxed">
            Professional AI Book Studio &copy; {new Date().getFullYear()} <br/>
            Engineered for elite literary materialization.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
