import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import type { PersonalProfile, ProfileRelationship, SubjectGrade } from '../types/intelligence';
import { calculateProfileCompleteness, createEmptyProfileDraft } from '../lib/firestoreValidation';
import { TagInput } from './TagInput';

interface ProfileWizardProps {
  initialProfile?: PersonalProfile | null;
  onSave: (
    payload: Omit<PersonalProfile, 'id' | 'ownerId' | 'completenessScore' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  { id: 0, title: 'Basic Information', subtitle: 'Identity, location & consent' },
  { id: 1, title: 'Education', subtitle: 'Level, grades & subjects' },
  { id: 2, title: 'Interests & Goals', subtitle: 'Hobbies, passions & ambitions' },
  { id: 3, title: 'Skills & Activities', subtitle: 'Abilities & leadership' },
  { id: 4, title: 'Family & Context', subtitle: 'Optional background & resources' },
];

export function ProfileWizard({ initialProfile, onSave, onCancel }: ProfileWizardProps) {
  const base = useMemo(() => createEmptyProfileDraft(), []);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relationship, setRelationship] = useState<ProfileRelationship>(
    initialProfile?.relationship || base.relationship
  );
  const [parentalConsentConfirmed, setParentalConsentConfirmed] = useState<boolean>(
    initialProfile?.parentalConsentConfirmed ?? true
  );
  const [basic, setBasic] = useState(initialProfile?.basic || base.basic);
  const [education, setEducation] = useState(initialProfile?.education || base.education);
  const [interests, setInterests] = useState(initialProfile?.interests || base.interests);
  const [skills, setSkills] = useState(initialProfile?.skills || base.skills);
  const [background, setBackground] = useState(initialProfile?.background || base.background);

  // Subject grade quick-adder state
  const [newSubject, setNewSubject] = useState('');
  const [newScore, setNewScore] = useState('85');

  const completeness = calculateProfileCompleteness({
    basic,
    education,
    interests,
    skills,
    background,
  });

  const needsParentalConsent = relationship === 'child' || relationship === 'dependent' || (basic.age !== null && basic.age < 18);

  const handleAddSubjectGrade = () => {
    const subj = newSubject.trim();
    const scoreNum = Number(newScore);
    if (!subj || !Number.isFinite(scoreNum)) return;
    const clamped = Math.max(0, Math.min(100, Math.round(scoreNum)));
    const next: SubjectGrade[] = [
      ...education.subjectGrades.filter((s) => s.subject.toLowerCase() !== subj.toLowerCase()),
      { subject: subj, score: clamped },
    ];
    setEducation({ ...education, subjectGrades: next });
    setNewSubject('');
    setNewScore('85');
  };

  const handleSave = async () => {
    if (!basic.name.trim()) {
      setError('Please provide a profile name in Step 1 before saving.');
      setStep(0);
      return;
    }
    if (needsParentalConsent && !parentalConsentConfirmed) {
      setError('Please confirm parental or guardian authorization for this dependent/minor profile.');
      setStep(0);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(
        {
          relationship,
          parentalConsentConfirmed: needsParentalConsent ? parentalConsentConfirmed : true,
          basic,
          education,
          interests,
          skills,
          background,
        },
        initialProfile?.id
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Completeness */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-500">
            {initialProfile ? 'Update Personal Profile' : 'Create Personal Profile'}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">
            {basic.name.trim() || 'New Intelligence Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All sections beyond Name are optional. Save at any stage; Meridian adapts analysis to available data.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500">Profile Completeness</p>
            <p className="text-lg font-mono font-semibold tabular-nums text-slate-900">{completeness}%</p>
          </div>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((s) => {
          const active = step === s.id;
          const visited = s.id < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : visited
                  ? 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span>0{s.id + 1}</span>
                {visited && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-xs font-semibold truncate">{s.title}</p>
              <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                {s.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form Step Body */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Define who this profile represents and their geographical context.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Profile Relationship</label>
              <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
                {(
                  [
                    { id: 'self', label: 'Myself' },
                    { id: 'child', label: 'My Child' },
                    { id: 'dependent', label: 'Dependent / Student' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRelationship(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      relationship === opt.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Full Name or Nickname <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={basic.name}
                  onChange={(e) => setBasic({ ...basic, name: e.target.value })}
                  placeholder="e.g. Aarav Khan or Maya Lin"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Age (Optional)</label>
                <input
                  type="number"
                  min={3}
                  max={120}
                  value={basic.age ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBasic({ ...basic, age: val === '' ? null : Number(val) });
                  }}
                  placeholder="e.g. 14"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Gender (Optional)</label>
                <input
                  type="text"
                  value={basic.gender}
                  onChange={(e) => setBasic({ ...basic, gender: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Country</label>
                <input
                  type="text"
                  value={basic.country}
                  onChange={(e) => setBasic({ ...basic, country: e.target.value })}
                  placeholder="e.g. Pakistan, United Kingdom, Canada"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-800 mb-1.5">City / Hometown</label>
                <input
                  type="text"
                  value={basic.city}
                  onChange={(e) => setBasic({ ...basic, city: e.target.value })}
                  placeholder="e.g. Lahore, Manchester, Toronto"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <TagInput
              label="Languages Spoken"
              values={basic.languages}
              onChange={(languages) => setBasic({ ...basic, languages })}
              placeholder="e.g. English, Urdu, Mandarin"
              suggestions={['English', 'Urdu', 'Arabic', 'Spanish', 'Mandarin', 'German']}
            />

            {needsParentalConsent && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">
                    Parental &amp; Privacy Protection Notice
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Profiles for minors are stored privately under your authenticated account. Direct identifiers like names and institutions are redacted before AI analysis.
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentalConsentConfirmed}
                      onChange={(e) => setParentalConsentConfirmed(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    I confirm I am the parent or legal guardian authorized to manage this profile.
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Educational Background</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Capture academic stage, numeric subject grades, and standout coursework.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Current Education Level</label>
                <input
                  type="text"
                  value={education.currentLevel}
                  onChange={(e) => setEducation({ ...education, currentLevel: e.target.value })}
                  placeholder="e.g. Grade 8, O-Levels, BSc Year 2"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  School / University (Optional)
                </label>
                <input
                  type="text"
                  value={education.institution}
                  onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                  placeholder="Optional (redacted in AI prompts)"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Overall Grade / GPA / %</label>
                <input
                  type="text"
                  value={education.overallGrade}
                  onChange={(e) => setEducation({ ...education, overallGrade: e.target.value })}
                  placeholder="e.g. 88% or 3.7 GPA"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-800">Subject Grades (0-100%)</label>
                <span className="text-xs text-slate-500">Used for academic performance charts</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Subject (e.g. Mathematics)"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="Score %"
                  className="w-28 px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddSubjectGrade}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Grade
                </button>
              </div>

              {education.subjectGrades.length > 0 && (
                <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-lg mt-2">
                  {education.subjectGrades.map((sg) => (
                    <div key={sg.subject} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-slate-800 font-medium">{sg.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums text-slate-900">{sg.score}%</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEducation({
                              ...education,
                              subjectGrades: education.subjectGrades.filter((x) => x.subject !== sg.subject),
                            })
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TagInput
                label="Favorite Subjects"
                values={education.favoriteSubjects}
                onChange={(favoriteSubjects) => setEducation({ ...education, favoriteSubjects })}
                placeholder="e.g. Physics, Computer Science"
                suggestions={['Mathematics', 'Physics', 'Computer Science', 'Biology', 'Economics', 'Art & Design']}
              />
              <TagInput
                label="Exceptional Performance Subjects"
                values={education.exceptionalSubjects}
                onChange={(exceptionalSubjects) => setEducation({ ...education, exceptionalSubjects })}
                placeholder="Subjects where person excels effortlessly"
              />
              <TagInput
                label="Weak or Challenging Subjects"
                values={education.weakSubjects}
                onChange={(weakSubjects) => setEducation({ ...education, weakSubjects })}
                placeholder="e.g. Memorization-heavy History"
              />
              <TagInput
                label="Academic Achievements & Awards"
                values={education.achievements}
                onChange={(achievements) => setEducation({ ...education, achievements })}
                placeholder="e.g. Regional Math Olympiad Finalist"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Personal Interests &amp; Goals</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Intrinsic curiosity often reveals career fit earlier than formal grades alone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TagInput
                label="Hobbies"
                values={interests.hobbies}
                onChange={(hobbies) => setInterests({ ...interests, hobbies })}
                placeholder="e.g. Robotics kits, Chess, Gardening"
              />
              <TagInput
                label="Broader Interests"
                values={interests.interests}
                onChange={(v) => setInterests({ ...interests, interests: v })}
                placeholder="e.g. Space exploration, Macroeconomics"
              />
              <TagInput
                label="Technical Interests"
                values={interests.technicalInterests}
                onChange={(technicalInterests) => setInterests({ ...interests, technicalInterests })}
                placeholder="e.g. Python, Arduino, CAD modeling"
                suggestions={['Coding', 'Robotics', 'Electronics', 'Data Analysis', '3D Modeling']}
              />
              <TagInput
                label="Creative Interests"
                values={interests.creativeInterests}
                onChange={(creativeInterests) => setInterests({ ...interests, creativeInterests })}
                placeholder="e.g. UI sketching, Storytelling, Music"
                suggestions={['Graphic Design', 'Creative Writing', 'Photography', 'Architecture', 'Film']}
              />
              <TagInput
                label="Favorite Activities"
                values={interests.favoriteActivities}
                onChange={(favoriteActivities) => setInterests({ ...interests, favoriteActivities })}
                placeholder="e.g. Building PCs, Debating"
              />
              <TagInput
                label="Sports & Physical Activities"
                values={interests.sports}
                onChange={(sports) => setInterests({ ...interests, sports })}
                placeholder="e.g. Cricket, Swimming, Badminton"
              />
              <TagInput
                label="Social Activities"
                values={interests.socialActivities}
                onChange={(socialActivities) => setInterests({ ...interests, socialActivities })}
                placeholder="e.g. Mentoring peers, Debate club"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Personal Goals &amp; Ambitions
              </label>
              <textarea
                rows={4}
                value={interests.goalsAmbitions}
                onChange={(e) => setInterests({ ...interests, goalsAmbitions: e.target.value })}
                placeholder="Describe what motivates this person, problems they want to solve, or long-term aspirations..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Skills &amp; Activities</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Document demonstrated capabilities, leadership, and real-world experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TagInput
                label="Existing General Skills"
                values={skills.existingSkills}
                onChange={(existingSkills) => setSkills({ ...skills, existingSkills })}
                placeholder="e.g. Research, Time management, Public speaking"
              />
              <TagInput
                label="Technical Skills"
                values={skills.technicalSkills}
                onChange={(technicalSkills) => setSkills({ ...skills, technicalSkills })}
                placeholder="e.g. Python, Excel, React, Circuit Soldering"
              />
              <TagInput
                label="Leadership Activities"
                values={skills.leadershipActivities}
                onChange={(leadershipActivities) => setSkills({ ...skills, leadershipActivities })}
                placeholder="e.g. Science Club President, Team Captain"
              />
              <TagInput
                label="Extracurricular Activities"
                values={skills.extracurriculars}
                onChange={(extracurriculars) => setSkills({ ...skills, extracurriculars })}
                placeholder="e.g. Hackathon participant, Robotics team"
              />
              <TagInput
                label="Volunteering & Community Work"
                values={skills.volunteering}
                onChange={(volunteering) => setSkills({ ...skills, volunteering })}
                placeholder="e.g. Peer math tutoring, Community cleanups"
              />
              <TagInput
                label="Other Achievements"
                values={skills.otherAchievements}
                onChange={(otherAchievements) => setSkills({ ...skills, otherAchievements })}
                placeholder="e.g. Published school magazine essay"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Communication Skills Assessment
                </label>
                <textarea
                  rows={3}
                  value={skills.communicationSkills}
                  onChange={(e) => setSkills({ ...skills, communicationSkills: e.target.value })}
                  placeholder="e.g. Strong written clarity; prefers small-group technical discussions over large crowds"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Problem-Solving Abilities
                </label>
                <textarea
                  rows={3}
                  value={skills.problemSolving}
                  onChange={(e) => setSkills({ ...skills, problemSolving: e.target.value })}
                  placeholder="e.g. Breaks down complex puzzles systematically; persists on debugging tasks"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Family &amp; Resource Context (Optional)</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Optional context helps calibrate realistic educational pathways, scholarship needs, and local resources.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Parents&apos; Professions (Optional)
                </label>
                <input
                  type="text"
                  value={background.parentsProfessions}
                  onChange={(e) => setBackground({ ...background, parentsProfessions: e.target.value })}
                  placeholder="e.g. Civil Engineer & High School Educator"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Family Educational Background (Optional)
                </label>
                <input
                  type="text"
                  value={background.familyEducation}
                  onChange={(e) => setBackground({ ...background, familyEducation: e.target.value })}
                  placeholder="e.g. First-generation university applicant or STEM household"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Available Educational Resources (Optional)
              </label>
              <textarea
                rows={3}
                value={background.availableResources}
                onChange={(e) => setBackground({ ...background, availableResources: e.target.value })}
                placeholder="e.g. Reliable home laptop & internet, local university library access, STEM mentoring"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Family Background Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={background.familyBackground}
                  onChange={(e) => setBackground({ ...background, familyBackground: e.target.value })}
                  placeholder="Optional cultural, relocation, or support context"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Financial or Scholarship Considerations (Optional)
                </label>
                <textarea
                  rows={3}
                  value={background.financialCircumstances}
                  onChange={(e) => setBackground({ ...background, financialCircumstances: e.target.value })}
                  placeholder="e.g. Prefers public universities or merit scholarships; budget-conscious"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200/70 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
