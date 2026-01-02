
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
  Cpu, Database, Shield, Cloud, Palette, Link as LinkIcon, BriefcaseBusiness, Binary
} from 'lucide-react';
import { Domain, AppState, Skill, AnalysisResult, Resource, QuizQuestion, User, CareerCompassData } from './types';
import * as gemini from './geminiService';

// --- Types for persistence ---
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

// --- Hierarchy Definitions ---
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

// --- Helper for Score Calculation ---
const getEffectiveScore = (analysisScore: number, missingSkillsCount: number, validatedCount: number) => {
  if (missingSkillsCount === 0 || analysisScore === 0) return analysisScore;
  const reductionPerSkill = analysisScore / missingSkillsCount;
  const currentReduction = Math.min(validatedCount, missingSkillsCount) * reductionPerSkill;
  return Math.max(0, Math.round(analysisScore - currentReduction));
};

// --- UUID Fallback ---
const getUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// --- Sub-components ---

const Header = ({ user, onLogout, onNavigateProfile, onNavigateCompass, step, stats }: { 
  user: User | null, 
  onLogout: () => void, 
  onNavigateProfile: () => void,
  onNavigateCompass: () => void,
  step: string,
  stats: { count: number, avg: number }
}) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            CAI Index
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Curriculum Aging Index</p>
        </div>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 mr-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Audits</span>
              <span className="text-sm font-black text-indigo-600">{stats.count}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Global Avg</span>
              <span className={`text-sm font-black ${stats.avg < 30 ? 'text-emerald-600' : stats.avg < 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {stats.avg || 0}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex gap-6 mr-6">
            <span onClick={onNavigateProfile} className={`text-sm font-medium cursor-pointer transition-colors ${step === 'profile' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>Dashboard</span>
            <span onClick={onNavigateCompass} className={`text-sm font-medium cursor-pointer transition-colors ${step === 'career_compass' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>Career Compass</span>
          </nav>
          
          <div className="relative group">
            <button 
              onClick={onNavigateProfile}
              className={`flex items-center gap-2 p-1.5 rounded-full transition-all border ${
                step === 'profile' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-700 pr-2">{user.name}</span>
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
              <button onClick={onNavigateProfile} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left">
                <UserIcon className="w-4 h-4" /> My Profile
              </button>
              <button onClick={onNavigateCompass} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left">
                <Compass className="w-4 h-4" /> Career Compass
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
);

const Stepper = ({ currentStep }: { currentStep: AppState['step'] }) => {
  if (currentStep === 'login' || currentStep === 'profile' || currentStep === 'career_compass') return null;
  const steps = [
    { id: 'domain', label: 'Domain' }, 
    { id: 'upload', label: 'Syllabus' }, 
    { id: 'analysis', label: 'Analysis' }, 
    { id: 'guidance', label: 'Guidance' }
  ];
  const activeIndex = steps.findIndex(s => s.id === currentStep);
  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto py-8">
      {steps.map((s, idx) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${idx <= activeIndex ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400'}`}>
              {idx < activeIndex ? <CheckCircle2 className="w-6 h-6" /> : <span>{idx + 1}</span>}
            </div>
            <span className={`text-xs mt-2 font-medium ${idx <= activeIndex ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {idx < steps.length - 1 && <div className={`h-0.5 w-16 mx-2 mb-6 ${idx < activeIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; action?: () => void; actionLabel?: string } | null>(null);

  useEffect(() => {
    if (toast && !toast.action) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getAllSavedSessions = (): SavedSession[] => {
    try {
      const stored = localStorage.getItem('cai_saved_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (state.user) {
      const all = getAllSavedSessions();
      const userSessions = all
        .filter(s => s.userId === state.user?.id)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSavedSessions(userSessions);

      const storedGlobal = localStorage.getItem(`cai_validated_${state.user.id}`);
      if (storedGlobal) {
        setGlobalValidatedSkills(JSON.parse(storedGlobal));
      } else {
        setGlobalValidatedSkills([]);
      }
    } else {
      setSavedSessions([]);
      setGlobalValidatedSkills([]);
    }
  }, [state.user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('cai_user');
    if (storedUser) {
      setState(prev => ({ ...prev, user: JSON.parse(storedUser), step: 'domain' }));
    }
  }, []);

  const navStats = useMemo(() => {
    if (!savedSessions.length) return { count: 0, avg: 0 };
    const effectiveScores = savedSessions.map(s => 
      getEffectiveScore(s.analysis.score, s.analysis.missingSkills.length, s.validatedSkills?.length || 0)
    );
    const sum = effectiveScores.reduce((a, b) => a + b, 0);
    return { count: savedSessions.length, avg: Math.round(sum / savedSessions.length) };
  }, [savedSessions]);

  const handleLogin = (email: string, name: string) => {
    const userId = btoa(email.toLowerCase().trim());
    const user: User = { 
      id: userId, 
      name: name, 
      email: email.toLowerCase().trim(), 
      role: 'Curriculum Developer', 
      bio: 'Academic bridging industry gaps.', 
      avatar: '' 
    };
    setState(prev => ({ ...prev, user, step: 'domain' }));
    localStorage.setItem('cai_user', JSON.stringify(user));
    setToast({ message: `Welcome back, ${name}! Your history has been restored.`, type: 'success' });
  };

  const handleLogout = () => {
    localStorage.removeItem('cai_user');
    setState({ 
      step: 'login', user: null, domain: null, role: '', 
      industrySkills: [], syllabusText: '', syllabusFile: null, 
      analysis: null, validatedSkills: [], activeSessionId: null, 
      loading: false, loadingMessage: '' 
    });
    setToast({ message: "Logged out. Your data remains safe.", type: 'success' });
  };

  const handleDomainSelect = async (domain: Domain, role: string) => {
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'Preparing standard skills...' }));
    try {
      const skills = await gemini.generateIndustrySkills(domain, role);
      setState(prev => ({ ...prev, domain, role, industrySkills: skills, step: 'upload', loading: false }));
    } catch (e) { 
      setState(prev => ({ ...prev, loading: false })); 
      setToast({ message: "Skill generation failed. Check connection.", type: 'error' });
    }
  };

  const handleSyllabusSubmit = async (text: string, file: AppState['syllabusFile']) => {
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'Deep scanning syllabus...' }));
    try {
      const result = await gemini.analyzeSyllabus({ 
        text: text || undefined, 
        file: file ? { data: file.data, mimeType: file.mimeType } : undefined 
      }, state.industrySkills);

      const autoValidated = result.missingSkills.filter(s => globalValidatedSkills.includes(s));

      setState(prev => ({ 
        ...prev, syllabusText: text, syllabusFile: file, 
        analysis: result, validatedSkills: autoValidated, activeSessionId: null, 
        step: 'analysis', loading: false 
      }));
    } catch (e) { 
      setState(prev => ({ ...prev, loading: false })); 
      setToast({ message: "Syllabus analysis failed.", type: 'error' });
    }
  };

  const handleSaveAnalysis = async (name?: string) => {
    if (!state.analysis || !state.domain || !state.user) return;
    
    const sessionId = state.activeSessionId || getUUID();
    const allSessions = getAllSavedSessions();
    const existing = allSessions.find(s => s.id === sessionId);
    
    const sessionName = name || existing?.name || `${state.role} Analysis - ${new Date().toLocaleDateString()}`;
    
    const newSession: SavedSession = {
      id: sessionId,
      userId: state.user.id,
      name: sessionName,
      date: new Date().toLocaleString(),
      timestamp: Date.now(),
      domain: state.domain,
      role: state.role,
      industrySkills: state.industrySkills,
      analysis: state.analysis,
      syllabusText: state.syllabusText,
      validatedSkills: state.validatedSkills
    };
    
    const updatedGlobal = [newSession, ...allSessions.filter(s => s.id !== sessionId)];
    localStorage.setItem('cai_saved_sessions', JSON.stringify(updatedGlobal));

    const userSessions = updatedGlobal
      .filter(s => s.userId === state.user?.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    setSavedSessions(userSessions);
    
    setState(prev => ({ ...prev, activeSessionId: sessionId }));

    setToast({ 
      message: "Analysis saved to your academic record!", 
      type: 'success',
      actionLabel: 'View Profile',
      action: () => setState(p => ({ ...p, step: 'profile' }))
    });
  };

  const handleLoadSession = (session: SavedSession) => {
    setState(prev => ({ 
      ...prev, 
      step: 'analysis', 
      domain: session.domain, 
      role: session.role, 
      industrySkills: session.industrySkills, 
      analysis: session.analysis, 
      syllabusText: session.syllabusText, 
      syllabusFile: null, 
      validatedSkills: session.validatedSkills || [], 
      activeSessionId: session.id, 
      loading: false, 
      loadingMessage: '' 
    }));
    setToast({ message: `Loaded session: ${session.name}`, type: 'success' });
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this audit?')) return;
    const all = getAllSavedSessions();
    const updatedGlobal = all.filter(s => s.id !== id);
    localStorage.setItem('cai_saved_sessions', JSON.stringify(updatedGlobal));
    setSavedSessions(updatedGlobal.filter(s => s.userId === state.user?.id));
    setToast({ message: "Session deleted.", type: 'success' });
  };

  const handleSkillValidated = (skillName: string) => {
    if (!state.user) return;

    const newValidated = Array.from(new Set([...state.validatedSkills, skillName]));
    setState(prev => ({ ...prev, validatedSkills: newValidated }));
    
    const newGlobal = Array.from(new Set([...globalValidatedSkills, skillName]));
    setGlobalValidatedSkills(newGlobal);
    localStorage.setItem(`cai_validated_${state.user.id}`, JSON.stringify(newGlobal));

    if (state.activeSessionId) {
      const all = getAllSavedSessions();
      const updatedGlobal = all.map(s => 
        s.id === state.activeSessionId ? { ...s, validatedSkills: newValidated } : s
      );
      localStorage.setItem('cai_saved_sessions', JSON.stringify(updatedGlobal));
      setSavedSessions(updatedGlobal.filter(s => s.userId === state.user?.id));
    }
    setToast({ message: `Skill '${skillName}' verified and synced!`, type: 'success' });
  };

  const handleCompassSubmit = async (stream: string, domain: string, aspiredRole: string) => {
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'Navigating your career future...' }));
    try {
      const data = await gemini.generateCareerCompass(`${stream} (${domain})`, aspiredRole);
      setState(prev => ({ ...prev, careerCompassData: data, loading: false }));
    } catch (e) {
      setState(prev => ({ ...prev, loading: false }));
      setToast({ message: "Failed to generate Career Compass.", type: 'error' });
    }
  };

  const currentAgingIndex = useMemo(() => {
    if (!state.analysis) return 0;
    return getEffectiveScore(state.analysis.score, state.analysis.missingSkills.length, state.validatedSkills.length);
  }, [state.analysis, state.validatedSkills]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header 
        user={state.user} 
        onLogout={handleLogout} 
        onNavigateProfile={() => setState(p => ({ ...p, step: 'profile' }))} 
        onNavigateCompass={() => setState(p => ({ ...p, step: 'career_compass', careerCompassData: undefined }))}
        step={state.step} 
        stats={navStats}
      />
      
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4">
          <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
            {toast.action && (
              <button onClick={() => { toast.action?.(); setToast(null); }} className="bg-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500 hover:bg-indigo-500 transition-colors">
                {toast.actionLabel}
              </button>
            )}
            <button onClick={() => setToast(null)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {state.loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{state.loadingMessage}</h2>
          </div>
        )}

        <Stepper currentStep={state.step} />

        {state.step === 'login' && <LoginView onLogin={handleLogin} />}
        {state.step === 'profile' && (
          <ProfileView 
            user={state.user!} 
            savedSessions={savedSessions} 
            onBack={() => setState(p => ({ ...p, step: 'domain' }))} 
            onDeleteSession={handleDeleteSession} 
            onLoadSession={handleLoadSession} 
          />
        )}
        {state.step === 'domain' && (
          <DomainSelectionView 
            onSelect={handleDomainSelect} 
            savedSessions={savedSessions} 
            onLoadSession={handleLoadSession} 
          />
        )}
        {state.step === 'upload' && (
          <SyllabusUploadView 
            onBack={() => setState(p => ({ ...p, step: 'domain' }))} 
            onSubmit={handleSyllabusSubmit} 
            role={state.role} 
            domain={state.domain!} 
          />
        )}
        {state.step === 'analysis' && state.analysis && (
          <AnalysisDashboard 
            analysis={state.analysis} 
            role={state.role} 
            activeSessionId={state.activeSessionId}
            onNext={async () => {
              setState(p => ({ ...p, loading: true, loadingMessage: 'Retrieving resources...' }));
              try {
                const res = await gemini.getRecommendations(state.analysis!.missingSkills);
                setResources(res);
                setState(p => ({ ...p, step: 'guidance', loading: false }));
              } catch (e) {
                setState(p => ({ ...p, loading: false }));
              }
            }} 
            onReset={() => setState(p => ({ ...p, step: 'domain', analysis: null, activeSessionId: null, validatedSkills: [] }))} 
            onSave={handleSaveAnalysis} 
            effectiveScore={currentAgingIndex} 
            validatedSkills={state.validatedSkills} 
          />
        )}
        {state.step === 'guidance' && state.analysis && (
          <GuidanceView 
            analysis={state.analysis} 
            resources={resources} 
            onBack={() => setState(p => ({ ...p, step: 'analysis' }))} 
            onSkillValidated={handleSkillValidated} 
            validatedSkills={state.validatedSkills} 
          />
        )}
        {state.step === 'career_compass' && (
          <CareerCompassView 
            data={state.careerCompassData}
            onBack={() => setState(p => ({ ...p, step: 'domain' }))}
            onSubmit={handleCompassSubmit}
          />
        )}
      </main>
    </div>
  );
}

// --- Specific Views ---

function LoginView({ onLogin }: { onLogin: (e: string, n: string) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><GraduationCap className="w-10 h-10 text-white" /></div>
        <h2 className="text-2xl font-black tracking-tight">Academic Access</h2>
        <p className="text-slate-500 mt-2 text-sm px-4 leading-relaxed font-medium">Verified skills and histories are permanently linked to your email identifier.</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); onLogin(email, name); }} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
          <input type="text" placeholder="John Doe" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Identifier</label>
          <input type="email" placeholder="john@university.edu" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 mt-4 uppercase tracking-widest">Restore Academic Profile</button>
      </form>
    </div>
  );
}

function ProfileView({ user, savedSessions, onBack, onDeleteSession, onLoadSession }: any) {
  const stats = useMemo(() => {
    if (!savedSessions?.length) return { avgScore: 0, count: 0 };
    const effectiveScores = savedSessions.map((s: SavedSession) => 
      getEffectiveScore(s.analysis.score, s.analysis.missingSkills.length, s.validatedSkills?.length || 0)
    );
    const sum = effectiveScores.reduce((a: number, b: number) => a + b, 0);
    return {
      avgScore: Math.round(sum / effectiveScores.length),
      count: savedSessions.length
    };
  }, [savedSessions]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in py-8">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-3 h-3" /> Go Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center h-fit">
          <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-indigo-600 shadow-md">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{user.name}</h2>
          <p className="text-slate-500 text-sm mb-6 font-bold">{user.role}</p>
          <div className="text-left space-y-4 border-t border-slate-50 pt-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium"><Mail className="w-4 h-4 text-slate-400" /> {user.email}</div>
            <div className="flex items-start gap-2 text-sm text-slate-600 leading-tight font-medium"><Info className="w-4 h-4 text-slate-400 mt-1" /> Profile data is persistent and encrypted for this account.</div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Audits</span>
              <span className="text-4xl font-black block mt-1 text-slate-900">{stats.count}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Index Avg</span>
              <span className={`text-4xl font-black block mt-1 ${stats.avgScore < 30 ? 'text-emerald-600' : stats.avgScore < 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {stats.avgScore || 0}
              </span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800 tracking-tight uppercase text-[11px] tracking-wider border-b border-slate-50 pb-4">
              <History className="w-4 h-4 text-indigo-600" /> Audit History
            </h3>
            <div className="space-y-4">
              {savedSessions.map((s: SavedSession) => {
                const score = getEffectiveScore(s.analysis.score, s.analysis.missingSkills.length, s.validatedSkills?.length || 0);
                return (
                  <div key={s.id} onClick={() => onLoadSession(s)} className="group flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer relative hover:border-indigo-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shrink-0 shadow-sm transition-colors ${score < 30 ? 'bg-emerald-50 text-emerald-600' : score < 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      {score}
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                      <h4 className="font-bold text-slate-800 truncate leading-snug">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.role} • {s.date}</p>
                    </div>
                    <button 
                      onClick={(e) => onDeleteSession(s.id, e)} 
                      className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {!savedSessions.length && (
                <div className="text-center py-16 opacity-40">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No history saved yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainSelectionView({ onSelect, savedSessions, onLoadSession }: any) {
  const [sel, setSel] = useState<Domain | null>(null);
  const [role, setRole] = useState('');

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in py-8 text-center">
      {!!savedSessions.length && (
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-left">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-widest text-[10px]"><History className="text-indigo-600 w-4 h-4" /> Jump Back In</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedSessions.slice(0, 3).map((s: SavedSession) => {
              const score = getEffectiveScore(s.analysis.score, s.analysis.missingSkills.length, s.validatedSkills?.length || 0);
              return (
                <div key={s.id} onClick={() => onLoadSession(s)} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-indigo-400 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs mb-3 transition-colors ${score < 30 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {score}
                  </div>
                  <h4 className="font-bold truncate text-slate-800 text-sm group-hover:text-indigo-600">{s.name}</h4>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{s.role}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">New Curriculum Audit</h2>
          <p className="text-slate-500 mt-3 text-lg max-w-2xl mx-auto leading-relaxed font-medium">Evaluate the alignment of your educational content with current industry specializations.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {Object.values(Domain).map(d => (
            <button key={d} onClick={() => { setSel(d); setRole(''); }} className={`group p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden h-32 flex flex-col justify-center ${sel === d ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50 shadow-inner' : 'border-slate-200 bg-white hover:shadow-xl hover:border-indigo-300'}`}>
              <h4 className="font-black text-xs text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{d.replace(' & ', ' ')}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Industry Scan</p>
              {sel === d && <div className="absolute top-2 right-2"><CheckCircle2 className="text-indigo-600 w-4 h-4" /></div>}
            </button>
          ))}
        </div>
        
        {sel && (
          <div className="mt-8 p-10 bg-white rounded-[2rem] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4 duration-300 text-left">
            <h4 className="font-black mb-6 text-slate-700 uppercase tracking-widest text-[10px]">Select Target Role:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {DOMAIN_ROLES[sel].map(r => (
                <button key={r} onClick={() => setRole(r)} className={`p-4 rounded-2xl border-2 text-xs font-black transition-all ${role === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'}`}>
                  {r}
                </button>
              ))}
            </div>
            <button 
              disabled={!role} 
              onClick={() => onSelect(sel, role)} 
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-xl active:scale-[0.98] text-lg uppercase tracking-wider"
            >
              Analyze specialism alignment <ChevronRight className="inline ml-1 w-6 h-6" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SyllabusUploadView({ onBack, onSubmit, role, domain }: any) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<any>(null);
  const [tab, setTab] = useState<'upload' | 'text'>('upload');
  const fileInputRef = useRef<any>(null);

  const handleFile = (e: any) => {
    const f = e.target.files[0];
    if (f?.type === 'application/pdf') {
      const r = new FileReader();
      r.onload = () => setFile({ data: (r.result as string).split(',')[1], mimeType: f.type, name: f.name });
      r.readAsDataURL(f);
    } else { 
      alert('Only PDF files are supported.'); 
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 py-8 text-center">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-tighter">
        <ArrowLeft className="w-3 h-3" /> Go Back
      </button>
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Import Syllabus</h2>
        <p className="text-slate-500 mb-8 font-bold">Scanning for <b>{role}</b> competencies in <b>{domain}</b>.</p>
        
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
          <button onClick={() => setTab('upload')} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>PDF Document</button>
          <button onClick={() => setTab('text')} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Raw Text</button>
        </div>

        {tab === 'upload' ? (
          <div onClick={() => fileInputRef.current.click()} className={`group cursor-pointer border-4 border-dashed rounded-[2rem] p-16 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-indigo-400 hover:bg-slate-50/50'}`}>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFile} />
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-all ${file ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
              <Upload className="w-10 h-10" />
            </div>
            <p className={`text-lg font-black ${file ? 'text-emerald-700' : 'text-slate-600'}`}>{file ? file.name : 'Choose PDF Syllabus'}</p>
            <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-wider">Drag and drop academic PDF</p>
          </div>
        ) : (
          <textarea className="w-full h-80 p-6 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none resize-none transition-all text-slate-700 font-medium leading-relaxed" placeholder="Paste full course description or syllabus text..." value={text} onChange={e => setText(e.target.value)} />
        )}
        
        <button 
          disabled={tab === 'text' ? text.length < 50 : !file} 
          onClick={() => onSubmit(text, file)} 
          className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black mt-10 shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] text-lg uppercase tracking-widest"
        >
          Generate Aging Index
        </button>
      </div>
    </div>
  );
}

function CareerCompassView({ data, onBack, onSubmit }: { data?: CareerCompassData, onBack: () => void, onSubmit: (s: string, d: string, r: string) => void }) {
  const [stream, setStream] = useState('');
  const [domain, setDomain] = useState<Domain | ''>('');
  const [aspiredRole, setAspiredRole] = useState('');
  const [activeTab, setActiveTab] = useState<'roadmap' | 'tasks' | 'test'>('roadmap');
  const [quizAns, setQuizAns] = useState<Record<number, number>>({});
  const [quizRes, setQuizRes] = useState<{ score: number, show: boolean } | null>(null);

  const handleQuizSubmit = () => {
    if (!data) return;
    const correctCount = data.test.reduce((acc, q, i) => acc + (quizAns[i] === q.correctAnswer ? 1 : 0), 0);
    const score = Math.round((correctCount / data.test.length) * 100);
    setQuizRes({ score, show: true });
  };

  const getStreamIcon = (s: string) => {
    if (s.includes("Engineering")) return <Cpu className="w-8 h-8" />;
    if (s.includes("Data")) return <Database className="w-8 h-8" />;
    if (s.includes("Business")) return <BriefcaseBusiness className="w-8 h-8" />;
    if (s.includes("Design")) return <Palette className="w-8 h-8" />;
    return <Binary className="w-8 h-8" />;
  };

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-in fade-in">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 mb-8 transition-colors font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </button>
        
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Compass className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Career Compass Navigator</h2>
          <p className="text-slate-500 mb-12 font-bold max-w-sm mx-auto">Define your trajectory through streams, domains, and roles to receive a bespoke growth strategy.</p>
          
          <div className="space-y-12 text-left">
            {/* Step 1: Stream Selection */}
            <div className="animate-in slide-in-from-left-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">Step 1: Select Academic Stream</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STREAMS.map(s => (
                  <button key={s} onClick={() => { setStream(s); setDomain(''); setAspiredRole(''); }} className={`p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${stream === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-50 hover:border-indigo-200 text-slate-600 hover:bg-white'}`}>
                    <div className={`${stream === s ? 'text-white' : 'text-indigo-600'}`}>
                      {getStreamIcon(s)}
                    </div>
                    <span className="font-black text-sm text-left leading-tight">{s}</span>
                    {stream === s && <CheckCircle2 className="w-5 h-5 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Domain Selection */}
            {stream && (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">Step 2: Narrow Down Domain</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STREAM_TO_DOMAINS[stream].map(d => (
                    <button key={d} onClick={() => { setDomain(d); setAspiredRole(''); }} className={`p-4 rounded-2xl border-2 text-xs font-black transition-all text-center ${domain === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-50 hover:border-indigo-200 text-slate-600 hover:bg-white'}`}>
                      {d.replace(' & ', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Role Selection */}
            {domain && (
              <div className="animate-in slide-in-from-left-4 duration-500">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">Step 3: Choose Aspiring Specialization</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DOMAIN_ROLES[domain as Domain].map(r => (
                    <button key={r} onClick={() => setAspiredRole(r)} className={`p-4 rounded-2xl border-2 text-xs font-black transition-all text-center ${aspiredRole === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-50 hover:border-indigo-200 text-slate-600 hover:bg-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              disabled={!stream || !domain || !aspiredRole} 
              onClick={() => onSubmit(stream, domain, aspiredRole)} 
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all text-lg uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale mt-4"
            >
              CHART TRAJECTORY <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 animate-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => onSubmit('', '', '')} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-3 h-3" /> New Navigator
        </button>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button onClick={() => setActiveTab('roadmap')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <Briefcase className="w-4 h-4" /> Roadmap
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <ListChecks className="w-4 h-4" /> Tasks
          </button>
          <button onClick={() => setActiveTab('test')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'test' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <PenTool className="w-4 h-4" /> Test
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
        {activeTab === 'roadmap' && (
          <div className="space-y-10 animate-in fade-in">
            <h3 className="text-2xl font-black text-slate-900 border-b border-slate-50 pb-4 text-left">Learning Milestones</h3>
            <div className="relative border-l-4 border-indigo-100 ml-6 pl-10 space-y-12 py-4">
              {data.roadmap.map((m, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[3.25rem] top-0 w-12 h-12 bg-white border-4 border-indigo-600 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-md">
                    {i + 1}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-lg text-slate-800">{m.title}</h4>
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{m.duration}</span>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-in fade-in">
            <h3 className="text-2xl font-black text-slate-900 border-b border-slate-50 pb-6 mb-8 text-left">Practical Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.tasks.map((t, i) => (
                <div key={i} className="p-8 border-2 border-slate-50 bg-slate-50/30 rounded-3xl hover:border-indigo-300 hover:bg-white transition-all text-left flex flex-col group">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${
                      t.difficulty.toLowerCase() === 'hard' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      t.difficulty.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {t.difficulty}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-slate-800 mb-2">{t.title}</h4>
                  <p className="text-slate-500 font-medium text-sm flex-1 mb-6 leading-relaxed">{t.description}</p>
                  <button className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all">Mark as Complete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="animate-in fade-in text-left">
            {!quizRes?.show ? (
              <div className="space-y-12">
                <h3 className="text-2xl font-black text-slate-900 border-b border-slate-50 pb-4">Readiness Assessment</h3>
                {data.test.map((q, idx) => (
                  <div key={idx} className="space-y-6">
                    <p className="font-black text-xl leading-tight text-slate-900"><span className="text-indigo-600 mr-2 opacity-50">Q{idx+1}</span> {q.question}</p>
                    <div className="grid gap-3">
                      {q.options.map((o, oi) => (
                        <button 
                          key={oi} 
                          onClick={() => setQuizAns(p => ({ ...p, [idx]: oi }))} 
                          className={`p-5 text-left border-2 rounded-2xl transition-all text-base font-bold flex items-center gap-5 ${quizAns[idx] === oi ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white text-slate-600'}`}
                        >
                          <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-[10px] font-black transition-all ${quizAns[idx] === oi ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                            {String.fromCharCode(65 + oi)}
                          </div>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button 
                  disabled={Object.keys(quizAns).length < data.test.length} 
                  onClick={handleQuizSubmit} 
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-30 hover:bg-black transition-all shadow-2xl uppercase tracking-widest mt-12"
                >
                  Complete Assessment
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${quizRes.score >= 70 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {quizRes.score >= 70 ? <Trophy className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                </div>
                <h4 className="text-5xl font-black mb-2 text-slate-900 tracking-tighter">{quizRes.score}%</h4>
                <p className="text-slate-500 max-w-sm mx-auto font-bold text-sm leading-relaxed mb-10">
                  {quizRes.score >= 70 
                    ? `Great start! You have a solid foundation for this role.` 
                    : `Focus on the milestones in your roadmap to improve your readiness.`}
                </p>
                <div className="space-y-6 max-w-2xl mx-auto">
                  {data.test.map((q, idx) => {
                    const isCorrect = quizAns[idx] === q.correctAnswer;
                    return (
                      <div key={idx} className={`p-6 rounded-3xl border-2 text-left ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                        <p className="font-black text-slate-800 mb-4">{q.question}</p>
                        <p className="text-sm font-bold text-slate-500 mb-2">You answered: <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{q.options[quizAns[idx]]}</span></p>
                        {!isCorrect && <p className="text-sm font-bold text-emerald-700 mb-2">Correct: {q.options[q.correctAnswer]}</p>}
                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 italic font-medium">
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setQuizRes(null)} className="mt-12 px-10 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Retake Test</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisDashboard({ analysis, onNext, onReset, onSave, effectiveScore, validatedSkills, activeSessionId }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const radarData = [
    { subject: 'Relevance', A: analysis.breakdown.relevance, fullMark: 100 },
    { subject: 'Depth', A: analysis.breakdown.depth, fullMark: 100 },
    { subject: 'Modernity', A: analysis.breakdown.modernity, fullMark: 100 },
  ];

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      if (activeSessionId) {
        await onSave();
      } else {
        const name = prompt("Name this audit session for your profile:", "Audit Result");
        if (name !== null && name !== "") {
          await onSave(name);
        } else if (name === "") {
            await onSave("Untitled Audit");
        } else {
          setIsSaving(false);
          return;
        }
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight text-left">Audit Overview</h2>
              <div className="flex gap-2">
                {activeSessionId && (
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> RECORD PERSISTED
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-slate-600 mb-10 italic text-xl leading-relaxed font-medium pr-24 text-left">&ldquo;{analysis.explanation}&rdquo;</p>
          
          {!!validatedSkills.length && (
            <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in slide-in-from-left-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 leading-none text-left">Competency Optimization</p>
                <p className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wider text-left">Verified skills reduced aging index to {effectiveScore}.</p>
              </div>
            </div>
          )}

          <div className="absolute top-10 right-10 text-center hidden md:block">
            <div className={`w-36 h-36 rounded-full border-[12px] flex flex-col items-center justify-center bg-white shadow-2xl transition-all duration-700 ${effectiveScore < 30 ? 'border-emerald-500' : effectiveScore < 60 ? 'border-amber-500' : 'border-rose-500'}`}>
              <span className="text-5xl font-black text-slate-900 leading-none">{effectiveScore}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Aging Index</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-center">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 800 }} />
              <Radar dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.5} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50/40 p-8 rounded-[2rem] border border-rose-100/50">
          <h4 className="font-black text-rose-800 mb-5 flex items-center gap-2 uppercase text-[10px] tracking-widest text-left"><AlertCircle className="w-4 h-4" /> Obsolete Content</h4>
          <div className="space-y-2.5">{analysis.outdatedTopics.map((t: string, i: number) => <div key={i} className="bg-white p-4 rounded-2xl text-xs border border-rose-100 font-bold text-rose-900 shadow-sm leading-relaxed text-left">{t}</div>)}</div>
          {analysis.outdatedTopics.length === 0 && <p className="text-slate-400 text-xs text-center py-6 font-medium">No critical outdated content detected.</p>}
        </div>
        <div className="bg-amber-50/40 p-8 rounded-[2rem] border border-amber-100/50">
          <h4 className="font-black text-amber-800 mb-5 flex items-center gap-2 uppercase text-[10px] tracking-widest text-left"><LayoutDashboard className="w-4 h-4" /> Market Gaps</h4>
          <div className="space-y-2.5">
            {analysis.missingSkills.map((s: string, i: number) => (
              <div key={i} className={`p-4 rounded-2xl text-xs border font-bold flex items-center justify-between shadow-sm transition-all ${validatedSkills.includes(s) ? 'bg-emerald-100 border-emerald-200 line-through opacity-60' : 'bg-white border-amber-100 text-amber-900'}`}>
                {s} {validatedSkills.includes(s) && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50/40 p-8 rounded-[2rem] border border-emerald-100/50">
          <h4 className="font-black text-emerald-800 mb-5 flex items-center gap-2 uppercase text-[10px] tracking-widest text-left"><CheckCircle2 className="w-4 h-4" /> Modern Benchmarks</h4>
          <div className="space-y-2.5">{analysis.matchedSkills.map((s: string, i: number) => <div key={i} className="bg-white p-4 rounded-2xl text-xs border border-emerald-100 font-bold text-emerald-900 shadow-sm leading-relaxed text-left">{s}</div>)}</div>
          {analysis.matchedSkills.length === 0 && <p className="text-slate-400 text-xs text-center py-6 font-medium">No modern benchmarks found.</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-10 border-t border-slate-200">
        <div className="flex gap-4 w-full sm:w-auto">
          <button onClick={onReset} className="flex-1 sm:flex-none px-8 py-4.5 border-2 border-slate-100 bg-white rounded-2xl font-black text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"><RefreshCw className="w-5 h-5" /> RESTART</button>
          <button 
            disabled={isSaving}
            onClick={handleSaveClick} 
            className={`flex-1 sm:flex-none px-8 py-4.5 border-2 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-sm relative overflow-hidden ${
              justSaved 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200' 
                : activeSessionId 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100' 
                  : 'border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {justSaved ? 'SAVED TO PROFILE!' : isSaving ? 'SAVING...' : activeSessionId ? 'UPDATE RECORD' : 'SAVE TO PROFILE'}
          </button>
        </div>
        <button onClick={onNext} className="w-full sm:w-auto py-5 px-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-[0.98] text-lg uppercase tracking-widest">BRIDGE COMPETENCIES <ChevronRight className="w-6 h-6" /></button>
      </div>
    </div>
  );
}

function GuidanceView({ analysis, resources, onBack, onSkillValidated, validatedSkills }: any) {
  const [active, setActive] = useState<string | null>(null);
  const [qs, setQs] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [res, setRes] = useState<{ score: number, show: boolean } | null>(null);

  const startQuiz = async (skill: string) => {
    setActive(skill); 
    setLoading(true); 
    setAns({}); 
    setRes(null);
    try { 
      const questions = await gemini.generateQuiz(skill);
      setQs(questions);
    } catch(e) {
      alert("Verification Engine unavailable.");
    }
    setLoading(false);
  };

  const submitQuiz = () => {
    const correctCount = qs.reduce((acc, q, i) => acc + (ans[i] === q.correctAnswer ? 1 : 0), 0);
    const score = Math.round((correctCount / qs.length) * 100);
    setRes({ score, show: true });
    if (score >= 100) onSkillValidated(active!);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-right-8 mb-20 py-8">
      <div className="space-y-8">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 mb-6 transition-colors font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-3 h-3" /> Step 3: Analysis
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-left">Bridge Strategy</h2>
        <div className="grid gap-5">
          {resources.map((r: any, i: number) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all hover:shadow-xl text-left">
              <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg tracking-widest border border-indigo-100">{r.level} • {r.type}</span>
              <h4 className="font-black text-xl leading-snug mt-4 text-slate-800 group-hover:text-indigo-600 transition-colors">{r.title}</h4>
              <a href={r.url} target="_blank" className="inline-flex items-center gap-2 mt-6 text-xs text-indigo-600 font-black hover:bg-indigo-50 py-2 px-4 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                EXPLORE CONTENT <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ))}
          {resources.length === 0 && <p className="text-slate-400 font-bold italic py-10 text-center uppercase tracking-widest text-xs">Locating learning modules...</p>}
        </div>
      </div>
      
      <div className="space-y-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-left">Mastery Verification</h2>
        <p className="text-sm text-slate-500 leading-relaxed font-bold uppercase tracking-wide text-left">Once a skill is verified (100% on quiz), it is permanently validated for your profile and won't be tested again.</p>
        <div className="grid gap-4">
          {analysis.missingSkills.map((s: string, i: number) => (
            <div key={i} className={`p-6 rounded-[1.75rem] border-2 transition-all flex items-center justify-between shadow-sm ${validatedSkills.includes(s) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white hover:border-indigo-300'}`}>
              <div className="flex items-center gap-4">
                {validatedSkills.includes(s) ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="w-6 h-6" /></div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-200 flex items-center justify-center border border-slate-100"><ShieldCheck className="w-6 h-6" /></div>
                )}
                <span className={`font-black text-lg ${validatedSkills.includes(s) ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{s}</span>
              </div>
              {validatedSkills.includes(s) ? (
                <div className="text-[10px] font-black text-emerald-600 bg-white px-3 py-2 rounded-xl uppercase tracking-widest border border-emerald-200 shadow-sm">Verified Globally</div>
              ) : (
                <button onClick={() => startQuiz(s)} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95">Verify Mastery</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-12 shadow-2xl relative animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setActive(null)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 z-10"><X className="w-6 h-6" /></button>
            <div className="mb-6 text-left shrink-0">
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 tracking-widest">Academic Validation</span>
              <h3 className="text-3xl font-black mt-4 text-slate-900 tracking-tight">{active} Assessment</h3>
            </div>
            
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <p className="font-black text-indigo-600 uppercase tracking-widest text-xs">Assembling Module...</p>
              </div>
            ) : res?.show ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="text-center py-6 shrink-0 border-b border-slate-50 mb-6">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-xl ${res.score >= 100 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {res.score >= 100 ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                  </div>
                  <h4 className="text-5xl font-black mb-2 text-slate-900 tracking-tighter">{res.score}%</h4>
                  <p className="text-slate-500 max-w-sm mx-auto font-bold text-sm leading-relaxed mb-4">
                    {res.score >= 100 
                      ? `Excellent. Verification is now linked to your academic identity.` 
                      : `Accuracy below validation threshold. Review the analysis below.`}
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6 text-left">
                  {qs.map((q, idx) => {
                    const isCorrect = ans[idx] === q.correctAnswer;
                    return (
                      <div key={idx} className={`p-6 rounded-[1.75rem] border-2 transition-all text-left ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                          </div>
                          <p className="font-black text-slate-800 leading-tight pt-1">{q.question}</p>
                        </div>
                        
                        <div className="space-y-2 ml-14">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selected</span>
                            <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{q.options[ans[idx]]}</p>
                          </div>
                          {!isCorrect && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Correct Answer</span>
                              <p className="text-sm font-bold text-emerald-700">{q.options[q.correctAnswer]}</p>
                            </div>
                          )}
                          <div className="mt-4 p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Reasoning</span>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{q.explanation}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="pt-6 shrink-0 bg-white border-t border-slate-50">
                  <button onClick={() => setActive(null)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all text-lg uppercase tracking-widest">Exit Module</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-left space-y-10 pb-8">
                  {qs.map((q, idx) => (
                    <div key={idx} className="space-y-6">
                      <p className="font-black text-xl leading-tight text-slate-900"><span className="text-indigo-600 mr-2 opacity-50">Q{idx+1}</span> {q.question}</p>
                      <div className="grid gap-3">
                        {q.options.map((o, oi) => (
                          <button 
                            key={oi} 
                            onClick={() => setAns(p => ({ ...p, [idx]: oi }))} 
                            className={`p-5 text-left border-2 rounded-2xl transition-all text-base font-bold flex items-center gap-5 ${ans[idx] === oi ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white text-slate-600'}`}
                          >
                            <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-[10px] font-black transition-all ${ans[idx] === oi ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                              {String.fromCharCode(65 + oi)}
                            </div>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 shrink-0 bg-white border-t border-slate-50">
                  <button 
                    disabled={Object.keys(ans).length < qs.length} 
                    onClick={submitQuiz} 
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-30 hover:bg-black transition-all shadow-2xl uppercase tracking-widest"
                  >
                    Submit Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
