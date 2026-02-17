
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Book, Chapter, GenerationProgress } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'AIPEN_PRO_V12_STABLE';

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
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-all group-hover:rotate-12">
            <i className="fas fa-pen-nib text-sm"></i>
          </div>
          <h1 className="text-xl font-black text-slate-900 serif-text tracking-tighter">AiPen</h1>
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
              <i className="fas fa-book-open text-[8px]"></i> Resume Book
            </button>
          )}
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-900 transition-all"><i className="fas fa-bars-staggered"></i></button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-pen-nib text-xs"></i></div><span className="text-base font-black text-slate-900 serif-text uppercase tracking-widest">AiPen Navigation</span></div>
          <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 gap-4">
          {[{ label: 'Studio', step: AppState.HOME }, { label: 'Architect Info', step: AppState.DEVELOPER }].map((item) => (
            <button key={item.label} onClick={() => handleNav(item.step)} className={`text-4xl font-black serif-text text-left p-4 rounded-2xl transition-colors ${currentStep === item.step ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</button>
          ))}
        </div>
      </div>
    </>
  );
};

const Footer: React.FC = () => (
  <footer className="py-12 px-6 border-t border-slate-50 text-center no-print bg-white mt-auto w-full">
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-pen-nib text-xs"></i></div>
      <span className="text-sm font-black text-slate-900 serif-text uppercase tracking-widest">AiPen Studio</span>
    </div>
    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Engineered by Sayed Mohsin Ali • v12.1 Stable</p>
  </footer>
);

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
      <p className="text-xl text-slate-700 italic font-medium max-w-xl mx-auto mb-8 serif-text leading-relaxed">"{desc}"</p>
      <button onClick={generate} disabled={loading} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">
        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-magic mr-2"></i>}
        {loading ? "Materializing..." : "Manifest Visual"}
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
  const [author, setAuthor] = useState('SMA');
  const [genre, setGenre] = useState('Business/Self-Help');
  const [length, setLength] = useState(100);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [progress, setProgress] = useState<GenerationProgress>({ currentChapter: 0, totalChapters: 0, message: '' });

  useEffect(() => {
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
    return true;
  };

  const startOutline = async () => {
    if (!title) { setError("Title required to initiate architecture."); return; }
    setLoading(true); setError(null);
    
    // Ensure Key is handled before continuing
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
      setError(err.message || "Architectural convergence failed. Verify your API Key.");
    } finally { setLoading(false); }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING); setLoading(true); setError(null);
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Initializing Manuscript synthesis...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({ currentChapter: i + 1, totalChapters: updatedOutline.length, message: `Drafting Manuscript: ${updatedOutline[i].title}` });
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
      setError("Drafting cycle interrupted. Connection unstable or Key expired."); 
    } finally { setLoading(false); }
  };

  const loadProject = (project: Book) => {
    setCurrentBook(project);
    setStep(AppState.VIEWER);
    setActiveChapterIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProject = (id: string) => {
    if (confirm("Permanently archive this volume?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentBook?.id === id) setCurrentBook(null);
    }
  }

  const handleReplaceVisual = (desc: string, base64: string, idx: number) => {
    if (!currentBook) return;
    const outline = [...currentBook.outline];
    const chapter = { ...outline[idx] };
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-16 text-center no-print"><img src="${base64}" alt="${desc}" class="rounded-[40px] shadow-2xl mx-auto w-full border-[10px] border-white" /><p class="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Neural Synthesis</p></div>\n\n`;
    chapter.content = (chapter.content || '').replace(regex, imageHtml);
    outline[idx] = chapter;
    const updatedBook = { ...currentBook, outline };
    setCurrentBook(updatedBook);
    setProjects(prev => [updatedBook, ...prev.filter(p => p.id !== updatedBook.id)]);
  };

  const totalWords = useMemo(() => currentBook?.outline.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0, [currentBook]);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Header setStep={setStep} currentStep={step} activeProject={!!currentBook} />
      
      <main className="flex-1 flex flex-col items-center w-full relative">
        {error && (
          <div className="fixed top-24 z-[110] w-[90%] max-w-xl bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center justify-between no-print shadow-2xl animate-fade-in-up">
            <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-amber-400"></i> {error}
            </span>
            <button onClick={() => setError(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><i className="fas fa-times"></i></button>
          </div>
        )}

        {step === AppState.HOME && (
          <div className="w-full animate-fade-in-up no-print">
            <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Professional Studio v12.1</span>
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black text-slate-900 serif-text tracking-tighter leading-none">
                      Architect <br/>
                      <span className="text-indigo-600 italic">Masterpieces.</span>
                    </h2>
                  </div>

                  <div className="bg-white p-8 md:p-12 rounded-[56px] border border-slate-100 shadow-2xl space-y-8">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Book Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Agentic AI: The Future"
                          className="w-full px-6 py-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none font-black serif-text text-2xl transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Author Name</label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Sayed Mohsin Ali"
                          className="w-full px-6 py-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Target Pages (50-500)</label>
                        <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(Number(e.target.value))}
                          className="w-full px-6 py-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Genre Classification</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)}
                          className="w-full px-6 py-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold">
                           <option>Business/Self-Help</option><option>Science Fiction</option><option>History/Biography</option><option>Educational</option><option>Thriller/Mystery</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={startOutline} disabled={loading} className="w-full py-7 bg-slate-900 text-white rounded-[24px] font-black shadow-xl disabled:bg-slate-200 uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4 active:scale-95 transition-all">
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-compass"></i>}
                      {loading ? "Architecting Neural Blueprint..." : "Architect Volume"}
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-5 hidden lg:block"><div className="killer-perspective"><div className="killer-tilt rounded-[64px] shadow-3xl rotate-3 border-8 border-white overflow-hidden"><img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200" alt="Book Inspiration" /></div></div></div>
              </div>
            </section>

            <section className="bg-slate-50 py-24 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="mb-16">
                   <h3 className="text-4xl font-black text-slate-900 serif-text uppercase tracking-tight">Archive Vault</h3>
                </div>
                {projects.length === 0 ? (
                  <div className="py-24 bg-white border border-slate-100 rounded-[64px] flex flex-col items-center text-center">
                     <i className="fas fa-folder-open text-6xl text-slate-100 mb-8"></i>
                     <h4 className="text-xl font-black text-slate-300 serif-text uppercase tracking-widest">No volumes in archive</h4>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {projects.map(project => (
                      <div key={project.id} onClick={() => loadProject(project)} className="group bg-white p-10 rounded-[48px] border border-slate-100 hover:shadow-2xl cursor-pointer relative transition-all">
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="absolute top-8 right-8 text-slate-200 hover:text-red-500 z-10 p-2"><i className="fas fa-trash-alt"></i></button>
                        <div className="space-y-8">
                           <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all"><i className="fas fa-book text-3xl"></i></div>
                           <div><h4 className="text-3xl font-black text-slate-900 serif-text line-clamp-1">{project.title}</h4><div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">{project.genre} • {new Date(project.createdAt).toLocaleDateString()}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {step === AppState.OUTLINING && (
          <div className="py-20 animate-fade-in-up w-full max-w-5xl px-6 no-print">
             <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-3xl space-y-12">
                <div className="flex justify-between items-center"><h2 className="text-5xl font-black serif-text text-slate-900 uppercase">Architecture Blueprint</h2><button onClick={() => setStep(AppState.HOME)} className="text-[10px] font-black uppercase text-slate-400">Cancel</button></div>
                <div className="grid md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-4">
                   {currentBook?.outline.map((ch, idx) => (
                      <div key={ch.id} className="p-8 bg-slate-50 rounded-3xl flex flex-col gap-3 border border-slate-100 transition-all hover:bg-white hover:shadow-xl">
                         <span className="font-bold text-slate-900 text-xl">{idx + 1}. {ch.title}</span>
                         <div className="flex flex-wrap gap-2">{ch.subsections.slice(0, 4).map((sub, i) => (<span key={i} className="text-[8px] px-2 py-1 bg-white border border-slate-200 rounded text-slate-400 uppercase font-black">{sub}</span>))}</div>
                      </div>
                   ))}
                </div>
                <button onClick={startWriting} className="w-full py-8 bg-indigo-600 text-white rounded-[28px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Initiate Neural Drafting Cycle</button>
             </div>
          </div>
        )}

        {step === AppState.WRITING && (
           <div className="py-48 text-center animate-fade-in-up flex flex-col items-center w-full px-6 no-print">
              <div className="relative mb-24">
                 <div className="w-40 h-40 border-[16px] border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-feather-pointed text-slate-200 text-5xl animate-pulse"></i></div>
              </div>
              <h2 className="text-5xl font-black serif-text text-slate-900 uppercase mb-6 tracking-tight">Drafting Manuscript</h2>
              <p className="text-indigo-600 font-bold italic text-2xl animate-pulse">{progress.message}</p>
              <div className="w-full max-w-lg h-3 bg-slate-50 rounded-full mx-auto overflow-hidden border border-slate-100 mt-14">
                 <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
              </div>
              <div className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Neural Convergence in Progress</div>
           </div>
        )}

        {step === AppState.VIEWER && currentBook && (
          <>
            <div className="hidden print:block w-full">
              <div className="book-page flex flex-col items-center justify-center text-center" style={{ breakAfter: 'page' }}>
                 <div className="text-[24px] font-black tracking-[1.8em] uppercase text-slate-900 mb-24 opacity-80">M A N U S C R I P T</div>
                 <h1 className="text-[120px] font-black text-slate-900 serif-text leading-tight mb-12 tracking-tighter">{currentBook.title}</h1>
                 <div className="w-48 h-2 bg-slate-900/10 mb-16 rounded-full"></div>
                 <div className="text-5xl text-slate-600 italic serif-text font-medium">Author: {currentBook.author}</div>
                 <div className="mt-auto text-[12px] font-black text-slate-300 uppercase tracking-widest">Architected via AiPen Studio v12.1</div>
              </div>
              {currentBook.outline.map((ch, idx) => (
                <div key={ch.id} className="book-page">
                  <div className="flex justify-between items-center mb-24 border-b-2 border-slate-100 pb-10">
                    <h2 className="text-4xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Segment {idx + 1}</h2>
                    <div className="text-[12px] font-black text-slate-400 uppercase italic tracking-widest">{currentBook.title}</div>
                  </div>
                  <div className="prose-book"><div dangerouslySetInnerHTML={{ __html: marked.parse(ch.content || '') as string }} /></div>
                </div>
              ))}
            </div>

            <div className="w-full animate-fade-in-up flex flex-col items-center px-6 no-print">
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:left-24 md:top-1/2 md:-translate-y-1/2 flex md:flex-col gap-10 z-[120] bg-white/90 backdrop-blur-3xl p-6 rounded-[50px] shadow-3xl border border-white/40">
                 <button disabled={activeChapterIndex === 0} onClick={() => { setActiveChapterIndex(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="w-18 h-18 md:w-28 md:h-28 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all disabled:opacity-20"><i className="fas fa-chevron-left text-3xl"></i></button>
                 <button disabled={activeChapterIndex === currentBook.outline.length - 1} onClick={() => { setActiveChapterIndex(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="w-18 h-18 md:w-28 md:h-28 bg-slate-900 shadow-3xl rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all disabled:opacity-20"><i className="fas fa-chevron-right text-3xl"></i></button>
              </div>
              
              <div className="w-full max-w-5xl space-y-16 mb-40 mt-12">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-10 bg-white p-12 rounded-[56px] border border-slate-100 shadow-2xl">
                   <div className="flex gap-16 text-center md:text-left">
                      <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Lexicon</div><div className="text-4xl font-black text-slate-900 tracking-tighter">{totalWords.toLocaleString()}</div></div>
                      <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Segment</div><div className="text-4xl font-black text-slate-900 tracking-tighter">{activeChapterIndex + 1}/{currentBook.outline.length}</div></div>
                   </div>
                   <div className="flex gap-4 w-full sm:w-auto">
                      <button onClick={() => setStep(AppState.HOME)} className="px-10 py-6 bg-slate-50 text-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-100">Studio</button>
                      <button onClick={() => window.print()} className="px-12 py-6 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all"><i className="fas fa-file-pdf"></i> Export Volume</button>
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-[80px] shadow-3xl p-14 md:p-36 border border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    {activeChapterIndex === 0 && (
                      <div className="mb-48 text-center border-b border-slate-50 pb-40 space-y-16">
                         <div className="text-[20px] font-black tracking-[1.6em] uppercase text-slate-900 opacity-80">M A N U S C R I P T</div>
                         <h1 className="text-8xl md:text-[110px] font-black text-slate-900 serif-text leading-tight tracking-tighter">{currentBook.title}</h1>
                         <div className="text-4xl text-slate-400 italic serif-text font-medium block">Author: {currentBook.author}</div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-20 border-b border-slate-50 pb-10">
                       <h2 className="text-4xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Segment {activeChapterIndex + 1}</h2>
                       <div className="text-[12px] font-black text-slate-300 uppercase italic tracking-widest">Architect Draft v12.1 Pro</div>
                    </div>
                    <div className="prose-book animate-fade-in-up">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} />;
                        return <VisualPlaceholder key={i} desc={part} genre={currentBook.genre} onReplace={(desc, b64) => handleReplaceVisual(desc, b64, activeChapterIndex)} />;
                      })}
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}

        {step === AppState.DEVELOPER && (
           <div className="w-full max-w-5xl px-6 py-24 animate-fade-in-up no-print">
              <div className="bg-slate-900 p-16 md:p-24 rounded-[80px] shadow-3xl text-center space-y-16 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-white to-slate-900"></div>
                 <div className="w-56 h-56 mx-auto rounded-[60px] border-[10px] border-white/10 overflow-hidden shadow-2xl transition-transform hover:scale-110 duration-1000 rotate-3">
                    <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="w-full h-full object-cover grayscale brightness-125" alt="Architect" />
                 </div>
                 <div className="space-y-6">
                    <h2 className="text-6xl font-black text-white serif-text uppercase tracking-tight">Sayed Mohsin Ali</h2>
                    <p className="text-indigo-400 text-2xl font-medium italic serif-text max-w-2xl mx-auto">"Architecting the future of intelligent storytelling through autonomous manuscript synthesis."</p>
                 </div>
                 <div className="flex justify-center gap-8">
                    <a href="https://github.com/gforg5" target="_blank" className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all"><i className="fab fa-github text-3xl"></i></a>
                    <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white hover:bg-[#0077B5] hover:text-white transition-all"><i className="fab fa-linkedin-in text-3xl"></i></a>
                 </div>
                 <button onClick={() => setStep(AppState.HOME)} className="px-14 py-7 bg-white text-slate-900 rounded-3xl font-black uppercase text-[12px] tracking-[0.4em] hover:scale-105 active:scale-95 transition-all">Studio Portal</button>
              </div>
           </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
