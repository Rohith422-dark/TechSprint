
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  LayoutDashboard, BookOpen, GraduationCap, ChevronRight, Upload, 
  AlertCircle, CheckCircle2, RefreshCw, BookMarked, BrainCircuit, ShieldCheck,
  Zap, ArrowLeft, BarChart3, Save, History, Trash2, Compass,
  User as UserIcon, LogOut, Settings, Mail, Info, Award, FileText, X, Trophy,
  ExternalLink, Loader2, Check, AlertTriangle, Activity, Briefcase, ListChecks, PenTool,
  Cpu, Database, Shield, Cloud, Palette, Link as LinkIcon, BriefcaseBusiness, Binary,
  Image as ImageIcon, Download, Maximize2, Layers, Sparkles, Network, Terminal, Grid3X3
} from 'lucide-react';
import { Domain, AppState, Skill, AnalysisResult, Resource, QuizQuestion, User, CareerCompassData, HeatmapPoint } from './types';
import * as gemini from './geminiService';

// --- Constants & Helpers ---

const STREAMS = [
  "Engineering & Technology",
  "Data & Artificial Intelligence",
  "Business & Management",
  "Design & Creative Arts"
];

const STREAM_TO_DOMAINS: Record<string, Domain[]> = {
  "Engineering & Technology": [Domain.SOFTWARE, Domain.CLOUD_DEVOPS, Domain.CYBERSECURITY, Domain.BLOCKCHAIN],
  "Data & Artificial Intelligence": [Domain.DATA, Domain.AI],
  "Business & Management": [Domain.BUSINESS_TECH],
  "Design & Creative Arts": [Domain.PRODUCT_DESIGN]
};

const DOMAIN_ROLES: Record<Domain, string[]> = {
  [Domain.SOFTWARE]: ['Frontend Engineer', 'Backend Engineer', 'Fullstack Developer', 'Mobile Dev', 'Embedded Systems', 'QA Automation', 'System Architect'],
  [Domain.DATA]: ['Data Analyst', 'Data Engineer', 'Data Scientist', 'BI Developer', 'Data Architect', 'Statistician'],
  [Domain.AI]: ['ML Engineer', 'NLP Specialist', 'AI Architect', 'Computer Vision Engineer', 'Robotics Engineer', 'AI Ethicist'],
  [Domain.CYBERSECURITY]: ['Security Analyst', 'Penetration Tester', 'Incident Responder', 'Cloud Security Engineer', 'GRC Specialist'],
  [Domain.CLOUD_DEVOPS]: ['DevOps Engineer', 'Cloud Architect', 'Site Reliability Engineer', 'Platform Engineer', 'Cloud Migration Specialist'],
  [Domain.PRODUCT_DESIGN]: ['UI/UX Designer', 'Product Manager', 'Product Designer', 'Interaction Designer', 'User Researcher'],
  [Domain.BLOCKCHAIN]: ['Smart Contract Developer', 'DApp Developer', 'Blockchain Architect', 'Web3 Product Manager'],
  [Domain.BUSINESS_TECH]: ['Digital Transformation Lead', 'IT Business Analyst', 'Growth Hacker', 'Tech Sales Engineer', 'E-commerce Specialist']
};

interface SavedSession {
  id: string;
  userId: string;
  name: string;
  date: string;
  timestamp: number;
  domain: Domain;
  role: string;
  industrySkills: Skill[];
  analysis: AnalysisResult;
  syllabusText: string;
  validatedSkills: string[];
}

const getEffectiveScore = (analysisScore: number, missingSkillsCount: number, validatedCount: number) => {
  if (missingSkillsCount === 0 || analysisScore === 0) return analysisScore;
  const reductionPerSkill = analysisScore / missingSkillsCount;
  const currentReduction = Math.min(validatedCount, missingSkillsCount) * reductionPerSkill;
  return Math.max(0, Math.round(analysisScore - currentReduction));
};

const getUUID = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);

// --- Sub-components ---

const Heatmap = ({ data }: { data: HeatmapPoint[] }) => {
  const rows = Array.from(new Set(data.map(d => d.y)));
  const cols = Array.from(new Set(data.map(d => d.x)));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {data.map((point, i) => {
          const intensity = point.value / 100;
          return (
            <div 
              key={i}
              className="group relative rounded-lg border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                backgroundColor: `rgba(79, 70, 229, ${0.1 + intensity * 0.8})`,
                boxShadow: intensity > 0.5 ? `0 0 20px rgba(79, 70, 229, ${intensity * 0.4})` : 'none'
              }}
            >
              <div className="text-[10px] font-black text-white/40 group-hover:text-white/100 transition-colors">
                {point.value}%
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-20 pointer-events-none">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{point.y}</p>
                <p className="text-xs font-bold text-white leading-tight mb-2">{point.x}</p>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${point.value}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend / Axes (Simplified) */}
      <div className="flex justify-between mt-4 px-2">
         <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Low Relevance</p>
         <div className="h-2 flex-1 mx-4 bg-gradient-to-r from-indigo-500/10 to-indigo-500 rounded-full" />
         <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Industry Ready</p>
      </div>
    </div>
  );
};

const Header = ({ user, onLogout, onNavigateProfile, onNavigateCompass, step }: any) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.href='/'}>
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">
            CAI <span className="text-indigo-600">INDEX</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Curriculum Aging</p>
        </div>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-8 mr-8">
            <button onClick={onNavigateProfile} className={`text-[11px] font-black uppercase tracking-widest transition-colors ${step === 'profile' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Audits</button>
            <button onClick={onNavigateCompass} className={`text-[11px] font-black uppercase tracking-widest transition-colors ${step === 'career_compass' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Compass</button>
          </nav>
          
          <div className="relative group">
            <button className="flex items-center gap-3 p-1 rounded-full border border-slate-200 hover:border-indigo-200 transition-all bg-slate-50/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-700 pr-3">{user.name.split(' ')[0]}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 scale-95 group-hover:scale-100">
              <button onClick={onNavigateProfile} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Dashboard
              </button>
              <button onClick={onNavigateCompass} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <Compass className="w-4 h-4 text-indigo-500" /> Career Compass
              </button>
              <div className="h-px bg-slate-100 my-2 mx-2" />
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
);

const LoadingOverlay = ({ message }: { message: string }) => {
  const steps = ["Calibrating Industry Weights...", "Parsing Competency Nodes...", "Querying Market Drift...", "Synthesizing Recommendations..."];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStepIdx(prev => (prev + 1) % steps.length), 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-12 animate-float">
        <div className="w-24 h-24 rounded-3xl border-4 border-indigo-500/20 flex items-center justify-center">
          <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
        </div>
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-3xl animate-ping opacity-20" />
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter mb-4">{message}</h2>
      <div className="flex flex-col items-center gap-2">
        <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">{steps[stepIdx]}</p>
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'login',
    user: null,
    domain: null,
    role: '',
    industrySkills: [],
    syllabusText: '',
    syllabusFile: null,
    analysis: null,
    validatedSkills: [],
    activeSessionId: null,
    loading: false,
    loadingMessage: '',
    careerCompassData: undefined
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [globalValidatedSkills, setGlobalValidatedSkills] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getAllSavedSessions = (): SavedSession[] => {
    try {
      const stored = localStorage.getItem('cai_saved_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('cai_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setState(prev => ({ ...prev, user, step: 'domain' }));
      const storedGlobal = localStorage.getItem(`cai_validated_${user.id}`);
      if (storedGlobal) setGlobalValidatedSkills(JSON.parse(storedGlobal));
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      const all = getAllSavedSessions();
      setSavedSessions(all.filter(s => s.userId === state.user?.id).sort((a, b) => b.timestamp - a.timestamp));
    }
  }, [state.user]);

  const handleLogin = (email: string, name: string) => {
    const user: User = { id: btoa(email), name, email, role: 'Academic Developer', bio: '', avatar: '' };
    localStorage.setItem('cai_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user, step: 'domain' }));
    setToast({ message: `Welcome, Specialist ${name.split(' ')[0]}.`, type: 'success' });
  };

  const handleDomainSelect = async (domain: Domain, role: string) => {
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'Retrieving Industry Standards' }));
    try {
      const skills = await gemini.generateIndustrySkills(domain, role);
      setState(prev => ({ ...prev, domain, role, industrySkills: skills, step: 'upload', loading: false }));
    } catch (e) {
      setState(prev => ({ ...prev, loading: false }));
      setToast({ message: "Failed to fetch industry data.", type: 'error' });
    }
  };

  const handleSyllabusSubmit = async (text: string, file: any) => {
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'Deconstructing Syllabus' }));
    try {
      const result = await gemini.analyzeSyllabus({ text: text || undefined, file: file ? { data: file.data, mimeType: file.mimeType } : undefined }, state.industrySkills);
      const autoValidated = result.missingSkills.filter(s => globalValidatedSkills.includes(s));
      setState(prev => ({ ...prev, syllabusText: text, syllabusFile: file, analysis: result, validatedSkills: autoValidated, step: 'analysis', loading: false }));
    } catch (e) {
      setState(prev => ({ ...prev, loading: false }));
      setToast({ message: "Analysis engine failed.", type: 'error' });
    }
  };

  const handleSaveAnalysis = async (name?: string) => {
    if (!state.analysis || !state.user) return;
    const sessionId = state.activeSessionId || getUUID();
    const all = getAllSavedSessions();
    const newSession: SavedSession = {
      id: sessionId, userId: state.user.id, name: name || `${state.role} Audit`, date: new Date().toLocaleDateString(), timestamp: Date.now(),
      domain: state.domain!, role: state.role, industrySkills: state.industrySkills, analysis: state.analysis, syllabusText: state.syllabusText, validatedSkills: state.validatedSkills
    };
    const updated = [newSession, ...all.filter(s => s.id !== sessionId)];
    localStorage.setItem('cai_saved_sessions', JSON.stringify(updated));
    setSavedSessions(updated.filter(s => s.userId === state.user?.id).sort((a, b) => b.timestamp - a.timestamp));
    setState(prev => ({ ...prev, activeSessionId: sessionId }));
    setToast({ message: "Audit persisted to profile.", type: 'success' });
  };

  const handleSkillValidated = (skillName: string) => {
    if (!state.user) return;
    const newValidated = Array.from(new Set([...state.validatedSkills, skillName]));
    setState(prev => ({ ...prev, validatedSkills: newValidated }));
    const newGlobal = Array.from(new Set([...globalValidatedSkills, skillName]));
    setGlobalValidatedSkills(newGlobal);
    localStorage.setItem(`cai_validated_${state.user.id}`, JSON.stringify(newGlobal));
    setToast({ message: `Competency "${skillName}" verified.`, type: 'success' });
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-700">
      <Header user={state.user} step={state.step} 
        onLogout={() => { localStorage.clear(); window.location.reload(); }}
        onNavigateProfile={() => setState(p => ({ ...p, step: 'profile' }))}
        onNavigateCompass={() => setState(p => ({ ...p, step: 'career_compass', careerCompassData: undefined }))}
      />
      
      {state.loading && <LoadingOverlay message={state.loadingMessage} />}
      
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4">
          <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {state.step === 'login' && <LoginPortal onLogin={handleLogin} />}
        {state.step === 'profile' && <ProfileView user={state.user!} savedSessions={savedSessions} onBack={() => setState(p => ({ ...p, step: 'domain' }))} onLoad={(s: any) => setState(p => ({ ...p, ...s, step: 'analysis' }))} />}
        {state.step === 'domain' && <DomainSelection onSelect={handleDomainSelect} />}
        {state.step === 'upload' && <UploadSyllabus role={state.role} onBack={() => setState(p => ({ ...p, step: 'domain' }))} onSubmit={handleSyllabusSubmit} />}
        {state.step === 'analysis' && state.analysis && (
          <AnalysisDashboard 
            analysis={state.analysis} 
            role={state.role} 
            validatedCount={state.validatedSkills.length}
            onReset={() => setState(p => ({ ...p, step: 'domain', analysis: null }))}
            onSave={handleSaveAnalysis}
            onNext={async () => {
              setState(p => ({ ...p, loading: true, loadingMessage: 'Scouting Learning Pathways' }));
              try {
                const res = await gemini.getRecommendations(state.analysis!.missingSkills);
                setResources(res);
                setState(p => ({ ...p, step: 'guidance', loading: false }));
              } catch (e) {
                setState(p => ({ ...p, loading: false }));
                setToast({ message: "Failed to scout resources.", type: 'error' });
              }
            }}
          />
        )}
        {/* Pass setToast to GuidanceView to fix scoping error */}
        {state.step === 'guidance' && state.analysis && <GuidanceView analysis={state.analysis} resources={resources} onBack={() => setState(p => ({ ...p, step: 'analysis' }))} onValidate={handleSkillValidated} validated={state.validatedSkills} setToast={setToast} />}
        {state.step === 'career_compass' && <CareerCompassView data={state.careerCompassData} onBack={() => setState(p => ({ ...p, step: 'domain' }))} onSubmit={async (s: string, d: string, r: string) => {
          setState(p => ({ ...p, loading: true, loadingMessage: 'Charting Future Trajectory' }));
          try {
            const data = await gemini.generateCareerCompass(d, r);
            setState(p => ({ ...p, careerCompassData: data, loading: false }));
          } catch (e) {
            setState(p => ({ ...p, loading: false }));
            setToast({ message: "Compass generation failed.", type: 'error' });
          }
        }} />}
      </main>
    </div>
  );
}

// --- Specific Views ---

const LoginPortal = ({ onLogin }: any) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" /> Powered by Gemini 3.0 Pro
        </div>
        <h1 className="text-6xl font-[900] text-slate-900 leading-[1.1] tracking-tighter">
          Quantify the <span className="text-indigo-600">Relevance</span> of your Academic Content.
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed">
          The Curriculum Aging Index (CAI) uses advanced LLMs to audit university syllabi against real-time industry demands. Bridge the gap between theory and market mastery.
        </p>
        <div className="grid grid-cols-3 gap-6 pt-4">
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">120k+</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Industry Signals</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">98.4%</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Gap Precision</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">Real-time</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Competency Mapping</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100%] opacity-50" />
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Academic Access</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">Enter your credentials to synchronize with global industry standards.</p>
          <form onSubmit={e => { e.preventDefault(); onLogin(email, name); }} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Academic Entity Name</label>
              <input type="text" placeholder="Dr. Sarah Johnson" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-700" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Institutional Email</label>
              <input type="email" placeholder="sarah@university.edu" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-700" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
              Initiate Alignment <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const DomainSelection = ({ onSelect }: any) => {
  const [sel, setSel] = useState<Domain | null>(null);
  const [role, setRole] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Define Scope of Audit</h2>
        <p className="text-slate-500 font-medium text-lg">Select the technological domain and specific professional role for calibration.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(Domain).map(d => (
          <button key={d} onClick={() => setSel(d)} className={`p-6 rounded-[2rem] border-2 text-left transition-all h-36 flex flex-col justify-between group ${sel === d ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-white bg-white hover:border-indigo-100 shadow-sm'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${sel === d ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
              <Network className="w-5 h-5" />
            </div>
            <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-800 leading-tight">{d}</h4>
          </button>
        ))}
      </div>

      {sel && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Target Career Specialization</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DOMAIN_ROLES[sel].map(r => (
              <button key={r} onClick={() => setRole(r)} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${role === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-50 hover:border-indigo-200 text-slate-500 hover:bg-white'}`}>
                {r}
              </button>
            ))}
          </div>
          <button disabled={!role} onClick={() => onSelect(sel, role)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest mt-12 shadow-xl hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center gap-3">
            Load Specialism Standards <Zap className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const UploadSyllabus = ({ role, onBack, onSubmit }: any) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<any>(null);
  const fileRef = useRef<any>(null);

  const handleFile = (e: any) => {
    const f = e.target.files[0];
    if (f?.type === 'application/pdf') {
      const r = new FileReader();
      r.onload = () => setFile({ data: (r.result as string).split(',')[1], name: f.name, mimeType: f.type });
      r.readAsDataURL(f);
    } else alert('Only PDF supported');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-12 animate-in slide-in-from-bottom-4">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Ingest Syllabus</h2>
        <p className="text-slate-500 font-medium mb-10">Scanning for <span className="text-indigo-600 font-bold">{role}</span> competencies.</p>
        
        <div className="space-y-8">
          <div onClick={() => fileRef.current.click()} className={`cursor-pointer border-4 border-dashed rounded-3xl p-16 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50/50 hover:border-indigo-200'}`}>
            <input type="file" ref={fileRef} className="hidden" accept=".pdf" onChange={handleFile} />
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${file ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <p className="font-black text-slate-800">{file ? file.name : 'Upload PDF Document'}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Maximum size 10MB</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">or paste text</span></div>
          </div>

          <textarea className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-indigo-600 outline-none resize-none transition-all text-sm font-medium" placeholder="Copy/paste syllabus description..." value={text} onChange={e => setText(e.target.value)} />
        </div>

        <button disabled={!file && text.length < 50} onClick={() => onSubmit(text, file)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest mt-10 shadow-xl hover:bg-indigo-700 disabled:opacity-30 transition-all">
          Generate Aging Index
        </button>
      </div>
    </div>
  );
};

const AnalysisDashboard = ({ analysis, role, validatedCount, onReset, onSave, onNext }: any) => {
  const score = getEffectiveScore(analysis.score, analysis.missingSkills.length, validatedCount);
  
  const radarData = [
    { subject: 'Relevance', A: analysis.breakdown.relevance },
    { subject: 'Depth', A: analysis.breakdown.depth },
    { subject: 'Modernity', A: analysis.breakdown.modernity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900">Analysis Summary</h2>
                <div className="flex gap-2">
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-100">{role} Context</span>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100">Live Scanned</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`w-32 h-32 rounded-full border-[10px] flex flex-col items-center justify-center bg-white shadow-2xl transition-all duration-1000 ${score < 30 ? 'border-emerald-500' : score < 60 ? 'border-amber-500' : 'border-rose-500'}`}>
                  <span className="text-4xl font-black text-slate-900 leading-none">{score}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">Index</span>
                </div>
              </div>
            </div>
            <p className="text-2xl text-slate-600 font-medium leading-relaxed italic pr-12">
              "{analysis.explanation}"
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 border-t border-slate-50 pt-10 mt-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Relevance</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">{analysis.breakdown.relevance}%</span>
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full mb-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${analysis.breakdown.relevance}%`}} /></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Depth</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">{analysis.breakdown.depth}%</span>
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full mb-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${analysis.breakdown.depth}%`}} /></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modernity</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">{analysis.breakdown.modernity}%</span>
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full mb-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${analysis.breakdown.modernity}%`}} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">Competency Matrix</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
              <Radar dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW HEATMAP SECTION */}
      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
              <Grid3X3 className="w-6 h-6 text-indigo-600" />
              Skill Density Heatmap
            </h3>
            <p className="text-sm font-medium text-slate-400">Visualizing alignment across skill groups and competency levels.</p>
          </div>
        </div>
        <div className="flex-1">
          <Heatmap data={analysis.heatmapData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-rose-50/50 p-8 rounded-[2rem] border border-rose-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-800 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Obsolete Content
          </h4>
          <div className="space-y-3">
            {analysis.outdatedTopics.map((t: string, i: number) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-rose-100 text-xs font-bold text-rose-900 shadow-sm leading-relaxed">
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-6 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Market Gaps
          </h4>
          <div className="space-y-3">
            {analysis.missingSkills.map((s: string, i: number) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-amber-100 text-xs font-bold text-amber-900 shadow-sm leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Modern Benchmarks
          </h4>
          <div className="space-y-3">
            {analysis.matchedSkills.map((s: string, i: number) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-emerald-100 text-xs font-bold text-emerald-900 shadow-sm leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-200">
        <div className="flex gap-4">
          <button onClick={onReset} className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Restart Audit</button>
          <button onClick={() => onSave()} className="px-8 py-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Record
          </button>
        </div>
        <button onClick={onNext} className="w-full sm:w-auto px-16 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
          Explore Bridge Strategy <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* Added setToast prop to fix 'Cannot find name setToast' error */
const GuidanceView = ({ analysis, resources, onBack, onValidate, validated, setToast }: any) => {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);

  const startVerification = async (skill: string) => {
    setActiveSkill(skill);
    setLoading(true);
    setAns({});
    setResult(null);
    try {
      const q = await gemini.generateQuiz(skill);
      setQuiz(q);
    } catch(e) { 
      setToast({ message: "Verification engine unavailable.", type: 'error' });
    }
    setLoading(false);
  };

  const submitQuiz = () => {
    const score = Math.round((quiz.reduce((acc, q, i) => acc + (ans[i] === q.correctAnswer ? 1 : 0), 0) / quiz.length) * 100);
    setResult({ score, show: true });
    if (score === 100) onValidate(activeSkill!);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Analysis
        </button>
        <h2 className="text-3xl font-black tracking-tighter text-slate-900">Bridge Strategy</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] border-b border-slate-100 pb-4">Knowledge Resources</h3>
          <div className="grid gap-4">
            {resources.map((r: any, i: number) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-500 transition-all">
                <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">{r.level}</span>
                <h4 className="font-black text-xl text-slate-800 mt-4 leading-tight">{r.title}</h4>
                <div className="mt-8 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">{r.type}</span>
                  <a href={r.url} target="_blank" className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:underline">
                    Access Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] border-b border-slate-100 pb-4">Competency Verification</h3>
          <div className="grid gap-3">
            {analysis.missingSkills.map((s: string, i: number) => (
              <div key={i} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${validated.includes(s) ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${validated.includes(s) ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className={`font-black text-sm ${validated.includes(s) ? 'text-emerald-700' : 'text-slate-700'}`}>{s}</span>
                </div>
                {validated.includes(s) ? (
                  <span className="text-[8px] font-black uppercase bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-600">Verified</span>
                ) : (
                  <button onClick={() => startVerification(s)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Start Audit</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeSkill && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <button onClick={() => setActiveSkill(null)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900"><X /></button>
            <div className="shrink-0 mb-8">
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-2">Technical Verification</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{activeSkill}</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-12">
              {loading ? <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" /> : result?.show ? (
                <div className="text-center py-12 space-y-8">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl ${result.score === 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {result.score === 100 ? <Trophy className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-6xl font-black text-slate-900">{result.score}%</p>
                    <p className="text-slate-500 font-medium">Verification Status: {result.score === 100 ? 'SUCCESS' : 'INCOMPLETE'}</p>
                  </div>
                  <button onClick={() => setActiveSkill(null)} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">Back to Dashboard</button>
                </div>
              ) : (
                <div className="space-y-10">
                  {quiz.map((q, idx) => (
                    <div key={idx} className="space-y-6">
                      <p className="text-xl font-black text-slate-800 leading-tight">Q{idx+1}: {q.question}</p>
                      <div className="grid gap-3">
                        {q.options.map((o, oi) => (
                          <button key={oi} onClick={() => setAns(p => ({ ...p, [idx]: oi }))} className={`w-full p-5 text-left border-2 rounded-2xl transition-all font-bold text-sm ${ans[idx] === oi ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:border-slate-200'}`}>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button disabled={Object.keys(ans).length < quiz.length} onClick={submitQuiz} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl disabled:opacity-30">Finalize Verification</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, savedSessions, onBack, onLoad }: any) => (
  <div className="max-w-5xl mx-auto space-y-12 py-12 animate-in fade-in">
    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-center shadow-sm">
          <div className="w-24 h-24 rounded-full bg-indigo-600 mx-auto mb-6 flex items-center justify-center text-3xl text-white font-black shadow-xl">{user.name.charAt(0)}</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{user.role}</p>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-8">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] border-b border-slate-100 pb-4">Audit History</h3>
        <div className="grid gap-4">
          {savedSessions.map((s: any) => (
            <div key={s.id} onClick={() => onLoad(s)} className="p-6 bg-white border border-slate-100 rounded-[1.75rem] flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                  <span className="text-lg font-black text-indigo-600 leading-none">{s.analysis.score}</span>
                  <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">Index</span>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 leading-tight">{s.name}</h4>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{s.role} • {s.date}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          ))}
          {savedSessions.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No audits recorded yet.</div>}
        </div>
      </div>
    </div>
  </div>
);

const CareerCompassView = ({ data, onBack, onSubmit }: any) => {
  const [stream, setStream] = useState('');
  const [domain, setDomain] = useState<Domain | ''>('');
  const [role, setRole] = useState('');

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-12 animate-in fade-in text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Career Compass</h2>
          <p className="text-slate-500 font-medium">Map out your trajectory from academic core to industry mastery.</p>
        </div>
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl text-left space-y-10">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Academic Stream</h4>
            <div className="grid grid-cols-2 gap-3">
              {STREAMS.map(s => (
                <button key={s} onClick={() => setStream(s)} className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${stream === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-50 text-slate-500 hover:bg-white hover:border-indigo-100'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {stream && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Industry Domain</h4>
              <div className="grid grid-cols-2 gap-3">
                {STREAM_TO_DOMAINS[stream].map(d => (
                  <button key={d} onClick={() => setDomain(d)} className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${domain === d ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-50 text-slate-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          {domain && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Desired Specialization</h4>
              <div className="grid grid-cols-3 gap-3">
                {DOMAIN_ROLES[domain as Domain].map(r => (
                  <button key={r} onClick={() => setRole(r)} className={`p-4 rounded-2xl border-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all ${role === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-50 text-slate-500'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button disabled={!role} onClick={() => onSubmit(stream, domain, role)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 disabled:opacity-30">Chart Trajectory</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-12 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Career Roadmap</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">Targeting {role}</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all"><RefreshCw /></button>
      </div>
      <div className="relative border-l-4 border-indigo-100 ml-6 pl-12 space-y-12 py-12">
        {data.roadmap.map((m: any, i: number) => (
          <div key={i} className="relative">
            <div className="absolute -left-[4.25rem] top-0 w-12 h-12 bg-white border-4 border-indigo-600 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-xl">{i+1}</div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-2xl font-black text-slate-900">{m.title}</h4>
                <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{m.duration}</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
