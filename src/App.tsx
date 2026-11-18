import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Compass,
  FileBarChart2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Play,
  Plus,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { AssessmentProgressOverlay } from './components/AssessmentProgressOverlay';
import { CareerVisualizations } from './components/CareerVisualizations';
import { DashboardOverview } from './components/DashboardOverview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FuturePredictionsView } from './components/FuturePredictionsView';
import { HistoricalComparisonView } from './components/HistoricalComparisonView';
import { ProfileWizard } from './components/ProfileWizard';
import { auth, googleProvider } from './lib/firebase';
import {
  deleteCareerAssessment,
  deleteFuturePrediction,
  deleteProfile,
  ensureUserAccount,
  saveCareerAssessment,
  saveFuturePrediction,
  saveProfile,
  subscribeAssessmentsForProfile,
  subscribePredictions,
  subscribeProfiles,
  updatePreferredModel,
} from './lib/intelligenceService';
import type {
  CareerAssessment,
  FuturePrediction,
  ModelId,
  PersonalProfile,
  PredictionCategoryId,
} from './types/intelligence';

type WorkspaceTab = 'overview' | 'profiles' | 'assessment' | 'timeline' | 'predictions';

function MeridianWorkspace() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<PersonalProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [assessments, setAssessments] = useState<CareerAssessment[]>([]);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>('');
  const [predictions, setPredictions] = useState<FuturePrediction[]>([]);

  const [preferredModel, setPreferredModel] = useState<ModelId>('Qwen/Qwen3-8B');
  const [hfConfigured, setHfConfigured] = useState(false);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [editingProfile, setEditingProfile] = useState<PersonalProfile | null | 'new'>(null);
  const [runningAssessmentFor, setRunningAssessmentFor] = useState<PersonalProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Fetch modular AI provider availability
  useEffect(() => {
    fetch('/api/ai/models')
      .then((r) => r.json())
      .then((info: { hfConfigured?: boolean; defaultModel?: ModelId }) => {
        setHfConfigured(Boolean(info.hfConfigured));
      })
      .catch(() => {
        // Non-fatal
      });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const acct = await ensureUserAccount(nextUser);
          if (acct.preferredModel) {
            setPreferredModel(acct.preferredModel);
          }
        } catch (err) {
          setActionError(err instanceof Error ? err.message : 'Account initialization failed.');
        }
      } else {
        setProfiles([]);
        setAssessments([]);
        setPredictions([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Profiles & Predictions subscriptions
  useEffect(() => {
    if (!user) return;
    const unsubProfiles = subscribeProfiles(
      user.uid,
      (list) => {
        setProfiles(list);
        setActiveProfileId((prev) =>
          prev && list.some((p) => p.id === prev) ? prev : list[0]?.id || ''
        );
      },
      (err) => setActionError(err.message)
    );

    const unsubPreds = subscribePredictions(
      user.uid,
      (list) => setPredictions(list),
      (err) => setActionError(err.message)
    );

    return () => {
      unsubProfiles();
      unsubPreds();
    };
  }, [user]);

  // Assessments subscription for active profile
  useEffect(() => {
    if (!user || !activeProfileId) {
      setAssessments([]);
      setActiveAssessmentId('');
      return;
    }

    const unsub = subscribeAssessmentsForProfile(
      user.uid,
      activeProfileId,
      (list) => {
        setAssessments(list);
        setActiveAssessmentId((prev) =>
          prev && list.some((a) => a.id === prev) ? prev : list[0]?.id || ''
        );
      },
      (err) => setActionError(err.message)
    );

    return () => unsub();
  }, [user, activeProfileId]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;
  const activeAssessment = assessments.find((a) => a.id === activeAssessmentId) || assessments[0] || null;

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('overview');
  };

  const handleModelChange = async (model: ModelId) => {
    setPreferredModel(model);
    if (user) {
      await updatePreferredModel(user.uid, model);
    }
  };

  const handleSaveProfile = async (
    payload: Omit<PersonalProfile, 'id' | 'ownerId' | 'completenessScore' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const savedId = await saveProfile(user.uid, payload, existingId);
    setActiveProfileId(savedId);
    setEditingProfile(null);
    setActiveTab('overview');
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!user) return;
    await deleteProfile(user.uid, profileId);
    if (activeProfileId === profileId) {
      setActiveProfileId('');
    }
  };

  const handleRunCareerAssessment = async (
    profile: PersonalProfile,
    baselineAssessment?: CareerAssessment | null
  ) => {
    if (!user) return;
    setActionError(null);
    setRunningAssessmentFor(profile);
    setEditingProfile(null);
    setActiveTab('assessment');

    try {
      const response = await fetch('/api/ai/career-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          preferredModel,
          previousAssessment: baselineAssessment || null,
        }),
      });
      const json = (await response.json()) as {
        assessment?: Omit<CareerAssessment, 'id' | 'ownerId' | 'profileId' | 'profileSnapshot' | 'createdAt'>;
        error?: string;
      };

      if (!response.ok || !json.assessment) {
        throw new Error(json.error || 'Assessment generation failed.');
      }

      const newId = await saveCareerAssessment(user.uid, profile, json.assessment);
      setActiveProfileId(profile.id);
      setActiveAssessmentId(newId);
      setActiveTab(baselineAssessment ? 'timeline' : 'assessment');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to generate career assessment.');
    } finally {
      setRunningAssessmentFor(null);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!user || !activeProfile) return;
    await deleteCareerAssessment(user.uid, activeProfile.id, assessmentId);
  };

  const handleGeneratePrediction = async (input: {
    category: PredictionCategoryId;
    subjectTitle: string;
    country: string;
    city: string;
    focusSector: string;
    inputContext: string;
    linkedProfileId: string;
  }): Promise<FuturePrediction> => {
    if (!user) throw new Error('Authentication required.');
    const linkedProfile = profiles.find((p) => p.id === input.linkedProfileId) || null;

    const response = await fetch('/api/ai/future-prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: input.category,
        subjectTitle: input.subjectTitle,
        country: input.country,
        city: input.city,
        focusSector: input.focusSector,
        inputContext: input.inputContext,
        linkedProfile,
        preferredModel,
      }),
    });

    const json = (await response.json()) as {
      prediction?: Omit<FuturePrediction, 'id' | 'ownerId' | 'profileId' | 'createdAt'>;
      error?: string;
    };

    if (!response.ok || !json.prediction) {
      throw new Error(json.error || 'Prediction generation failed.');
    }

    const toSave = {
      ...json.prediction,
      profileId: linkedProfile?.id || '',
    };

    const savedId = await saveFuturePrediction(user.uid, toSave);
    return {
      ...toSave,
      id: savedId,
      ownerId: user.uid,
    };
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-mono">Loading Meridian workspace...</div>
      </div>
    );
  }

  // Unauthenticated Landing & Sign-In Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between gap-8">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Meridian
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#capabilities" className="hover:text-slate-900 whitespace-nowrap shrink-0">
              Career Engine
            </a>
            <a href="#longitudinal" className="hover:text-slate-900 whitespace-nowrap shrink-0">
              Longitudinal Tracking
            </a>
            <a href="#predictions" className="hover:text-slate-900 whitespace-nowrap shrink-0">
              Prediction Categories
            </a>
            <a href="#privacy" className="hover:text-slate-900 whitespace-nowrap shrink-0">
              Privacy
            </a>
          </nav>
          <button
            type="button"
            onClick={handleSignIn}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Sign In with Google
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-14 space-y-16">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-mono text-blue-600">
                Personal Intelligence &amp; Future Trajectory Platform
              </p>
              <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight text-balance">
                Structured life, career, and regional intelligence powered by Qwen3 reasoning.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Built for individuals and parents managing long-term development. Meridian evaluates academics, intrinsic interests, skills, and local opportunities to produce visual assessments, validate how trajectories evolve across years, and export institutional PDF reports.
              </p>
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {authError}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Continue with Google Account
                </button>
                <span className="text-xs text-slate-500">
                  Private multi-profile storage · Parental consent controls · PII-redacted inference
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <p className="text-xs font-mono text-slate-500">Platform Architecture</p>
              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-3">
                  <p className="font-semibold text-slate-900">01. Multi-Profile Management</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Create flexible profiles for yourself or multiple children with optional fields and draft saving.
                  </p>
                </div>
                <div className="py-3">
                  <p className="font-semibold text-slate-900">02. Independent Career Engine</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Modular Qwen3-8B / Qwen3.8 reasoning synthesizes primary &amp; alternative career paths with interactive charts.
                  </p>
                </div>
                <div className="py-3">
                  <p className="font-semibold text-slate-900">03. Longitudinal Validation (2026 → 2028+)</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Compare updated grades and interests against historical snapshots to audit past predictions.
                  </p>
                </div>
                <div className="py-3">
                  <p className="font-semibold text-slate-900">04. Multi-Category Future Forecasts</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Personal Development, City/Hometown, Country Analysis, and Business Intelligence with PDF exports.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="predictions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'capabilities',
                title: 'Career Suitability Charts',
                desc: 'Visual alignment bars, academic benchmarks, interest radars, and multi-horizon roadmaps.',
              },
              {
                id: 'longitudinal',
                title: 'Historical Snapshots',
                desc: 'Every assessment freezes the exact profile snapshot and model version for future audits.',
              },
              {
                id: 'forecast',
                title: 'Epistemic Separation',
                desc: 'Every forecast distinguishes verified facts from assumptions and AI projections.',
              },
              {
                id: 'privacy',
                title: 'Child Data Protection',
                desc: 'Owner-isolated Firestore rules and automatic PII redaction before model inference.',
              },
            ].map((item) => (
              <div key={item.id} id={item.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    );
  }

  const navItems: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profiles', label: 'Profiles', icon: <Users className="w-4 h-4" /> },
    { id: 'assessment', label: 'Career Report', icon: <FileBarChart2 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <History className="w-4 h-4" /> },
    { id: 'predictions', label: 'Predictions', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 bg-white border-r border-slate-200 flex-col justify-between p-5">
        <div className="space-y-6">
          <div className="px-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">Meridian</span>
          </div>

          {/* Active Profile Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-medium text-slate-500">Active Profile</span>
              <button
                type="button"
                onClick={() => {
                  setEditingProfile('new');
                  setActiveTab('profiles');
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                + New
              </button>
            </div>
            {profiles.length > 0 ? (
              <select
                value={activeProfileId}
                onChange={(e) => {
                  setActiveProfileId(e.target.value);
                  setEditingProfile(null);
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.basic.name} ({p.relationship})
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingProfile('new');
                  setActiveTab('profiles');
                }}
                className="w-full px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100/70 transition-colors"
              >
                Create First Profile
              </button>
            )}
          </div>

          {/* Sidebar Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Modular AI Model Selector */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <label className="block px-1 text-xs font-medium text-slate-500">
              AI Reasoning Model
            </label>
            <select
              value={preferredModel}
              onChange={(e) => handleModelChange(e.target.value as ModelId)}
              className="w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="Qwen/Qwen3-8B">Qwen/Qwen3-8B</option>
              <option value="Qwen/Qwen3.8-2.4T-A95B">Qwen/Qwen3.8-2.4T-A95B</option>
              <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
            </select>
            <p className="px-1 text-[11px] text-slate-400 leading-snug">
              {hfConfigured
                ? 'Hugging Face Router active'
                : 'Modular engine: HF Qwen3 routes via server fallback until HF_TOKEN is added'}
            </p>
          </div>
        </div>

        {/* Account Footer */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: 3 Clean Zones */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="lg:hidden p-1.5 text-slate-700 border border-slate-200 rounded-lg"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="text-sm font-semibold text-slate-900 truncate whitespace-nowrap">
              {activeProfile ? activeProfile.basic.name : 'Meridian Workspace'}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setEditingProfile(null);
                  setActiveTab(item.id);
                }}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === item.id
                    ? 'text-slate-900 underline underline-offset-8 decoration-blue-600 decoration-2'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            {activeProfile ? (
              <button
                type="button"
                disabled={Boolean(runningAssessmentFor)}
                onClick={() => handleRunCareerAssessment(activeProfile)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                Run Assessment
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingProfile('new');
                  setActiveTab('profiles');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Profile
              </button>
            )}
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                    activeTab === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <select
                value={preferredModel}
                onChange={(e) => handleModelChange(e.target.value as ModelId)}
                className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Qwen/Qwen3-8B">Qwen/Qwen3-8B</option>
                <option value="Qwen/Qwen3.8-2.4T-A95B">Qwen/Qwen3.8-2.4T-A95B</option>
                <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
              </select>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-medium text-slate-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-4">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-xs font-semibold hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {runningAssessmentFor ? (
            <AssessmentProgressOverlay
              subjectName={runningAssessmentFor.basic.name}
              model={preferredModel}
              mode="career"
            />
          ) : editingProfile !== null ? (
            <ProfileWizard
              initialProfile={editingProfile === 'new' ? null : editingProfile}
              onSave={handleSaveProfile}
              onCancel={() => setEditingProfile(null)}
            />
          ) : activeTab === 'overview' ? (
            <DashboardOverview
              profiles={profiles}
              activeProfile={activeProfile}
              assessments={assessments}
              predictions={predictions}
              preferredModel={preferredModel}
              hfConfigured={hfConfigured}
              onSelectProfile={(p) => setActiveProfileId(p.id)}
              onCreateProfile={() => {
                setEditingProfile('new');
                setActiveTab('profiles');
              }}
              onEditProfile={(p) => {
                setEditingProfile(p);
                setActiveTab('profiles');
              }}
              onDeleteProfile={handleDeleteProfile}
              onRunAssessment={(p) => handleRunCareerAssessment(p)}
              onOpenAssessment={(a) => {
                setActiveAssessmentId(a.id);
                setActiveTab('assessment');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          ) : activeTab === 'profiles' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Personal &amp; Family Profiles</h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Manage profiles for yourself or your children. Incomplete profiles can be saved and refined anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProfile('new')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Create Profile
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <p className="text-base font-semibold text-slate-900">No profiles created yet</p>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Start with a guided multi-step profile for yourself or a child to unlock personalized AI assessments.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingProfile('new')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className={`bg-white border rounded-xl p-6 space-y-4 ${
                        p.id === activeProfileId ? 'border-blue-600' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-mono text-slate-500 capitalize">
                            {p.relationship} · {p.completenessScore}% Complete
                          </p>
                          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                            {p.basic.name}
                          </h2>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {[
                              p.basic.age ? `Age ${p.basic.age}` : null,
                              p.education.currentLevel || null,
                              [p.basic.city, p.basic.country].filter(Boolean).join(', ') || null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveProfileId(p.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-md ${
                            p.id === activeProfileId
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {p.id === activeProfileId ? 'Active' : 'Select'}
                        </button>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${p.completenessScore}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProfile(p)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            Edit Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(p.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRunCareerAssessment(p)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Run Assessment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'assessment' ? (
            activeAssessment ? (
              <div className="space-y-6">
                {assessments.length > 1 && (
                  <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600">
                      Viewing Saved Assessment for {activeProfile?.basic.name}:
                    </span>
                    <select
                      value={activeAssessment.id}
                      onChange={(e) => setActiveAssessmentId(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      {assessments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.primaryRecommendation.title})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <CareerVisualizations
                  assessment={activeAssessment}
                  onDeleteAssessment={handleDeleteAssessment}
                  onOpenTimeline={() => setActiveTab('timeline')}
                />
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
                <FileBarChart2 className="w-8 h-8 text-slate-400 mx-auto" />
                <h2 className="text-lg font-semibold text-slate-900">
                  No career assessment generated yet
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {activeProfile
                    ? `Run an AI career assessment for ${activeProfile.basic.name} to view suitability charts, reasoning, and educational roadmaps.`
                    : 'Create and select a profile first to generate a comprehensive career assessment.'}
                </p>
                {activeProfile ? (
                  <button
                    type="button"
                    onClick={() => handleRunCareerAssessment(activeProfile)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" />
                    Generate Career Assessment
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile('new');
                      setActiveTab('profiles');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4" />
                    Create Profile
                  </button>
                )}
              </div>
            )
          ) : activeTab === 'timeline' ? (
            activeProfile ? (
              <HistoricalComparisonView
                profile={activeProfile}
                assessments={assessments}
                onRunComparativeAssessment={(baseline) =>
                  handleRunCareerAssessment(activeProfile, baseline)
                }
                onSelectAssessment={(a) => {
                  setActiveAssessmentId(a.id);
                  setActiveTab('assessment');
                }}
                onDeleteAssessment={handleDeleteAssessment}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <p className="text-sm text-slate-600">Select or create a profile to view its historical assessment timeline.</p>
              </div>
            )
          ) : (
            <FuturePredictionsView
              profiles={profiles}
              predictions={predictions}
              preferredModel={preferredModel}
              onGeneratePrediction={handleGeneratePrediction}
              onDeletePrediction={(id) => deleteFuturePrediction(user.uid, id)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MeridianWorkspace />
    </ErrorBoundary>
  );
}
