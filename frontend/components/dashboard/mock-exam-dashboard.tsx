"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  BookOpenCheckIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClipboardListIcon,
  Clock3Icon,
  DatabaseIcon,
  FileCheck2Icon,
  FlameIcon,
  GaugeIcon,
  HeartPulseIcon,
  Layers3Icon,
  MenuIcon,
  PlayIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TimerIcon,
  TrophyIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type Unit = {
  id: string;
  name: string;
};

type Chapter = {
  id: string;
  name: string;
  units: Unit[];
};

type Subject = {
  id: string;
  name: string;
  shortName: string;
  chapters: Chapter[];
};

type Question = {
  id: string;
  subjectId: string;
  chapterId: string;
  unitId: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  frequency: number;
  importance: number;
  difficulty: "Easy" | "Medium" | "Hard";
  sourceYears: number[];
};

type ExamMode = "setup" | "exam" | "results";
type ExamLength = "short" | "standard" | "full";
type DashboardSection =
  | "academic-health"
  | "weakness"
  | "study-plan"
  | "intervention"
  | "mock"
  | "readiness"
  | "paper-evaluator"
  | "question-bank"
  | "adaptive";
type SetupStep = "intro" | "subject" | "chapter" | "units" | "length" | "confirm";
type MockCancellationReason = "tab-switch" | "fullscreen-exit" | "manual";
type FeatureStatus = "Active" | "Next" | "Planned";

const subjects: Subject[] = [
  {
    id: "physics",
    name: "Physics",
    shortName: "PHY",
    chapters: [
      {
        id: "electrostatics",
        name: "Electrostatics",
        units: [
          { id: "charges-fields", name: "Charges and Electric Fields" },
          { id: "potential", name: "Electric Potential" },
          { id: "capacitors", name: "Capacitance" },
        ],
      },
      {
        id: "current-electricity",
        name: "Current Electricity",
        units: [
          { id: "ohms-law", name: "Ohm's Law" },
          { id: "kirchhoff", name: "Kirchhoff's Laws" },
          { id: "cells", name: "Cells and Internal Resistance" },
        ],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    shortName: "CHEM",
    chapters: [
      {
        id: "solutions",
        name: "Solutions",
        units: [
          { id: "concentration", name: "Concentration Terms" },
          { id: "colligative", name: "Colligative Properties" },
          { id: "abnormal", name: "Abnormal Molar Mass" },
        ],
      },
      {
        id: "organic-basics",
        name: "Organic Chemistry Basics",
        units: [
          { id: "nomenclature", name: "Nomenclature" },
          { id: "isomerism", name: "Isomerism" },
          { id: "effects", name: "Electronic Effects" },
        ],
      },
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    shortName: "MATH",
    chapters: [
      {
        id: "calculus",
        name: "Differential Calculus",
        units: [
          { id: "limits", name: "Limits" },
          { id: "continuity", name: "Continuity" },
          { id: "derivatives", name: "Derivatives" },
        ],
      },
      {
        id: "probability",
        name: "Probability",
        units: [
          { id: "conditional", name: "Conditional Probability" },
          { id: "bayes", name: "Bayes' Theorem" },
          { id: "random-variable", name: "Random Variables" },
        ],
      },
    ],
  },
];

const questions: Question[] = [
  {
    id: "phy-1",
    subjectId: "physics",
    chapterId: "electrostatics",
    unitId: "charges-fields",
    prompt: "Two identical point charges are separated by distance r. If the distance is doubled, what happens to the electrostatic force?",
    options: ["It becomes twice", "It becomes one-fourth", "It becomes half", "It remains unchanged"],
    answerIndex: 1,
    explanation: "By Coulomb's law, force is inversely proportional to the square of distance, so doubling r makes force one-fourth.",
    frequency: 94,
    importance: 91,
    difficulty: "Easy",
    sourceYears: [2018, 2020, 2022, 2024],
  },
  {
    id: "phy-2",
    subjectId: "physics",
    chapterId: "electrostatics",
    unitId: "potential",
    prompt: "The electric potential at a point due to a point charge depends on which quantity?",
    options: ["Only charge", "Only distance", "Charge and distance", "Mass of the charge"],
    answerIndex: 2,
    explanation: "Potential due to a point charge is V = kQ/r, so it depends on charge and distance.",
    frequency: 88,
    importance: 86,
    difficulty: "Easy",
    sourceYears: [2017, 2019, 2023],
  },
  {
    id: "phy-3",
    subjectId: "physics",
    chapterId: "electrostatics",
    unitId: "capacitors",
    prompt: "When a dielectric slab is inserted fully between capacitor plates, capacitance generally:",
    options: ["Decreases", "Increases", "Becomes zero", "Does not change"],
    answerIndex: 1,
    explanation: "A dielectric increases capacitance by reducing the effective electric field between plates.",
    frequency: 82,
    importance: 90,
    difficulty: "Medium",
    sourceYears: [2018, 2021, 2024],
  },
  {
    id: "phy-4",
    subjectId: "physics",
    chapterId: "current-electricity",
    unitId: "ohms-law",
    prompt: "For a metallic conductor at constant temperature, the V-I graph is:",
    options: ["A parabola", "A straight line through origin", "A circle", "A hyperbola"],
    answerIndex: 1,
    explanation: "Ohm's law gives V = IR, so voltage varies linearly with current at constant resistance.",
    frequency: 90,
    importance: 84,
    difficulty: "Easy",
    sourceYears: [2016, 2019, 2020, 2023],
  },
  {
    id: "phy-5",
    subjectId: "physics",
    chapterId: "current-electricity",
    unitId: "kirchhoff",
    prompt: "Kirchhoff's junction rule is based on conservation of:",
    options: ["Energy", "Charge", "Momentum", "Mass"],
    answerIndex: 1,
    explanation: "The algebraic sum of currents at a junction is zero because charge is conserved.",
    frequency: 86,
    importance: 88,
    difficulty: "Medium",
    sourceYears: [2017, 2021, 2024],
  },
  {
    id: "chem-1",
    subjectId: "chemistry",
    chapterId: "solutions",
    unitId: "colligative",
    prompt: "Which colligative property is used to determine molar mass of polymers most commonly?",
    options: ["Relative lowering of vapour pressure", "Elevation in boiling point", "Osmotic pressure", "Depression in freezing point"],
    answerIndex: 2,
    explanation: "Osmotic pressure is useful for high molar mass substances because it is measurable even at low concentration.",
    frequency: 92,
    importance: 94,
    difficulty: "Medium",
    sourceYears: [2018, 2020, 2022, 2024],
  },
  {
    id: "chem-2",
    subjectId: "chemistry",
    chapterId: "solutions",
    unitId: "concentration",
    prompt: "Molarity is defined as moles of solute per:",
    options: ["kg of solvent", "litre of solution", "kg of solution", "mole of solvent"],
    answerIndex: 1,
    explanation: "Molarity is the number of moles of solute dissolved per litre of solution.",
    frequency: 84,
    importance: 82,
    difficulty: "Easy",
    sourceYears: [2017, 2019, 2021],
  },
  {
    id: "chem-3",
    subjectId: "chemistry",
    chapterId: "organic-basics",
    unitId: "effects",
    prompt: "The -I effect is strongest in which substituent?",
    options: ["-CH3", "-F", "-OH", "-NH2"],
    answerIndex: 1,
    explanation: "Fluorine is highly electronegative and shows a strong negative inductive effect.",
    frequency: 78,
    importance: 87,
    difficulty: "Hard",
    sourceYears: [2020, 2022, 2023],
  },
  {
    id: "math-1",
    subjectId: "mathematics",
    chapterId: "calculus",
    unitId: "derivatives",
    prompt: "If y = x^n, then dy/dx is:",
    options: ["nx^(n-1)", "x^(n+1)", "n/x", "x/n"],
    answerIndex: 0,
    explanation: "The power rule gives d(x^n)/dx = nx^(n-1).",
    frequency: 95,
    importance: 89,
    difficulty: "Easy",
    sourceYears: [2016, 2018, 2021, 2024],
  },
  {
    id: "math-2",
    subjectId: "mathematics",
    chapterId: "probability",
    unitId: "bayes",
    prompt: "Bayes' theorem is primarily used to calculate:",
    options: ["Independent events only", "Posterior probability", "Mean deviation", "Permutation count"],
    answerIndex: 1,
    explanation: "Bayes' theorem updates probability after new evidence, giving posterior probability.",
    frequency: 81,
    importance: 88,
    difficulty: "Medium",
    sourceYears: [2019, 2022, 2024],
  },
];

const examLengthConfig: Record<ExamLength, { label: string; questions: number; minutes: number }> = {
  short: { label: "Short drill", questions: 3, minutes: 15 },
  standard: { label: "Standard mock", questions: 5, minutes: 35 },
  full: { label: "Full practice", questions: 8, minutes: 60 },
};

const dashboardSections: {
  id: DashboardSection;
  label: string;
  shortLabel: string;
  description: string;
  owner: "Jatin" | "Krish" | "Shared";
  status: FeatureStatus;
  stage: string;
  icon: typeof BookOpenCheckIcon;
  accent: string;
  signals: string[];
  nextMilestone: string;
}[] = [
  {
    id: "academic-health",
    label: "Academic Health",
    shortLabel: "Health",
    description: "A live score from tests, attendance, study consistency, and revision rhythm.",
    owner: "Krish",
    status: "Planned",
    stage: "Agentic Feature #1",
    icon: HeartPulseIcon,
    accent: "from-rose-500/20 via-transparent to-emerald-500/10",
    signals: ["Score trend", "Study time", "Revision frequency"],
    nextMilestone: "Create the health-score formula and demo trend data.",
  },
  {
    id: "weakness",
    label: "Weakness Detection",
    shortLabel: "Weakness",
    description: "Find root-cause learning gaps from repeated mistakes across concepts.",
    owner: "Jatin",
    status: "Next",
    stage: "Agentic Feature #2",
    icon: BrainCircuitIcon,
    accent: "from-violet-500/20 via-transparent to-sky-500/10",
    signals: ["Wrong-answer clusters", "Root cause", "Prerequisite gaps"],
    nextMilestone: "Map mock mistakes to chapter, unit, and prerequisite concepts.",
  },
  {
    id: "study-plan",
    label: "Autonomous Study Planner",
    shortLabel: "Study Plan",
    description: "Rebuild daily plans from exams, weak areas, available hours, and learning speed.",
    owner: "Krish",
    status: "Planned",
    stage: "Agentic Feature #3",
    icon: CalendarClockIcon,
    accent: "from-amber-500/20 via-transparent to-lime-500/10",
    signals: ["Exam dates", "Study hours", "Task rebalance"],
    nextMilestone: "Add a simple generated day plan from readiness and weak chapters.",
  },
  {
    id: "intervention",
    label: "AI Intervention Engine",
    shortLabel: "Intervention",
    description: "Act when students disappear, struggle, or overload instead of waiting for humans.",
    owner: "Jatin",
    status: "Planned",
    stage: "Agentic Feature #4",
    icon: ShieldAlertIcon,
    accent: "from-red-500/20 via-transparent to-orange-500/10",
    signals: ["Inactivity", "Reduced workload", "Mentor alert"],
    nextMilestone: "Create rule-based demo interventions for inactivity and low scores.",
  },
  {
    id: "mock",
    label: "Dynamic Mock Test Generator",
    shortLabel: "Mock Exam",
    description: "Generate board-style mocks from board, standard, subject, chapter, and unit choices.",
    owner: "Shared",
    status: "Active",
    stage: "Examination Feature #1",
    icon: BookOpenCheckIcon,
    accent: "from-cyan-500/20 via-transparent to-emerald-500/10",
    signals: ["PYQ ranking", "Fullscreen lock", "Question states"],
    nextMilestone: "Connect the frontend flow to the real question-bank API.",
  },
  {
    id: "readiness",
    label: "Exam Readiness Score",
    shortLabel: "Readiness",
    description: "Predict preparedness, expected marks, weak chapters, and confidence level.",
    owner: "Krish",
    status: "Planned",
    stage: "Examination Feature #2",
    icon: GaugeIcon,
    accent: "from-blue-500/20 via-transparent to-teal-500/10",
    signals: ["Preparedness", "Predicted score", "Confidence"],
    nextMilestone: "Derive readiness from mock accuracy, coverage, and weak chapters.",
  },
  {
    id: "paper-evaluator",
    label: "AI Paper Evaluator",
    shortLabel: "Evaluator",
    description: "Evaluate uploaded answer sheets for correctness, presentation, and missing points.",
    owner: "Jatin",
    status: "Planned",
    stage: "Examination Feature #3",
    icon: FileCheck2Icon,
    accent: "from-fuchsia-500/20 via-transparent to-indigo-500/10",
    signals: ["Upload", "Marking scheme", "Feedback"],
    nextMilestone: "Prototype a PDF upload review screen with mocked evaluation output.",
  },
  {
    id: "question-bank",
    label: "Personalized Question Bank",
    shortLabel: "Question Bank",
    description: "Recommend practice questions from mistakes, weak concepts, and board pattern.",
    owner: "Krish",
    status: "Planned",
    stage: "Examination Feature #4",
    icon: DatabaseIcon,
    accent: "from-emerald-500/20 via-transparent to-yellow-500/10",
    signals: ["Mistakes", "Board pattern", "Practice queue"],
    nextMilestone: "Create the PYQ schema and seed enough questions for recommendation demos.",
  },
  {
    id: "adaptive",
    label: "Adaptive Exam Simulator",
    shortLabel: "Adaptive",
    description: "Adjust difficulty during tests to discover the student's true capability level.",
    owner: "Jatin",
    status: "Planned",
    stage: "Examination Feature #5",
    icon: WandSparklesIcon,
    accent: "from-purple-500/20 via-transparent to-cyan-500/10",
    signals: ["Difficulty shift", "Ability estimate", "Adaptive path"],
    nextMilestone: "Add difficulty bands and next-question selection rules after mock APIs exist.",
  },
];

const dashboardStats = [
  { label: "Academic Health", value: "82", detail: "Stable", icon: HeartPulseIcon },
  { label: "Exam Readiness", value: "74%", detail: "Physics focus", icon: GaugeIcon },
  { label: "Weak Concepts", value: "3", detail: "Needs revision", icon: BrainCircuitIcon },
  { label: "Today's Plan", value: "5", detail: "Tasks queued", icon: CalendarClockIcon },
];

export function MockExamDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("mock");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mode, setMode] = useState<ExamMode>("setup");
  const [setupStep, setSetupStep] = useState<SetupStep>("intro");
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [chapterId, setChapterId] = useState(subjects[0].chapters[0].id);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [examLength, setExamLength] = useState<ExamLength>("standard");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seenQuestionIds, setSeenQuestionIds] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionNotice, setSessionNotice] = useState("");
  const [cancellationReason, setCancellationReason] = useState<MockCancellationReason | null>(null);
  const modeRef = useRef(mode);
  const allowFullscreenExitRef = useRef(false);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
  const selectedChapter = selectedSubject.chapters.find((chapter) => chapter.id === chapterId) ?? selectedSubject.chapters[0];

  const rankedQuestions = useMemo(() => {
    const unitFilter = selectedUnitIds.length ? selectedUnitIds : selectedChapter.units.map((unit) => unit.id);

    return questions
      .filter(
        (question) =>
          question.subjectId === selectedSubject.id &&
          question.chapterId === selectedChapter.id &&
          unitFilter.includes(question.unitId),
      )
      .sort((a, b) => questionScore(b) - questionScore(a));
  }, [selectedChapter, selectedSubject.id, selectedUnitIds]);

  const examQuestions = rankedQuestions.slice(0, examLengthConfig[examLength].questions);
  const activeQuestion = examQuestions[activeQuestionIndex];
  const answeredCount = examQuestions.filter((question) => answers[question.id] !== undefined).length;
  const seenCount = examQuestions.filter((question) => seenQuestionIds.has(question.id)).length;
  const result = calculateResult(examQuestions, answers);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const reason = params.get("mock_cancelled");

    if (section === "mock") {
      setActiveSection("mock");
      setSetupStep("intro");
      setMode("setup");
    }

    if (isMockCancellationReason(reason)) {
      setCancellationReason(reason);
      setSessionNotice(getMockCancellationMessage(reason));
    }

    if (section === "mock" || reason) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (mode !== "exam") return;

    if (remainingSeconds <= 0) {
      completeExam();
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [mode, remainingSeconds]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (modeRef.current !== "exam") return;

      event.preventDefault();
      event.returnValue = "Your active mock exam will be cancelled.";
    };

    const handleVisibilityChange = () => {
      if (modeRef.current === "exam" && document.visibilityState === "hidden") {
        cancelExam("Mock cancelled because the exam tab was left before submission.");
      }
    };

    const handleFullscreenChange = () => {
      if (
        modeRef.current === "exam" &&
        !document.fullscreenElement &&
        !allowFullscreenExitRef.current
      ) {
        cancelExam("Mock cancelled because fullscreen mode was exited before submission.");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const changeSubject = (nextSubjectId: string) => {
    const nextSubject = subjects.find((subject) => subject.id === nextSubjectId) ?? subjects[0];
    setSubjectId(nextSubject.id);
    setChapterId(nextSubject.chapters[0].id);
    setSelectedUnitIds([]);
    setAnswers({});
    setActiveQuestionIndex(0);
  };

  const chooseSubject = (nextSubjectId: string) => {
    changeSubject(nextSubjectId);
    setSetupStep("chapter");
  };

  const changeChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setSelectedUnitIds([]);
    setAnswers({});
    setActiveQuestionIndex(0);
  };

  const chooseChapter = (nextChapterId: string) => {
    changeChapter(nextChapterId);
    setSetupStep("units");
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId],
    );
  };

  const openQuestion = (index: number) => {
    const nextQuestion = examQuestions[index];

    if (!nextQuestion) return;

    setActiveQuestionIndex(index);
    setSeenQuestionIds((current) => new Set(current).add(nextQuestion.id));
  };

  const cancelSetup = () => {
    setSetupStep("intro");
    setSelectedUnitIds([]);
    setExamLength("standard");
    setSessionNotice("");
  };

  const startExam = async () => {
    setAnswers({});
    setSessionNotice("");
    setActiveQuestionIndex(0);
    setSeenQuestionIds(examQuestions[0] ? new Set([examQuestions[0].id]) : new Set());
    setRemainingSeconds(examLengthConfig[examLength].minutes * 60);
    allowFullscreenExitRef.current = false;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setSessionNotice("Fullscreen could not be started by the browser. The mock is still locked to this tab.");
    }

    setMode("exam");
  };

  const startConfirmedExam = () => {
    void startExam();
  };

  const completeExam = () => {
    allowFullscreenExitRef.current = true;
    setMode("results");

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  };

  const cancelExam = (message = "Mock cancelled.") => {
    allowFullscreenExitRef.current = true;
    setAnswers({});
    setSeenQuestionIds(new Set());
    setRemainingSeconds(0);
    setActiveQuestionIndex(0);
    setSessionNotice(message);
    setMode("setup");

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  };

  const resetExam = () => {
    allowFullscreenExitRef.current = true;
    setAnswers({});
    setSeenQuestionIds(new Set());
    setRemainingSeconds(0);
    setActiveQuestionIndex(0);
    setSessionNotice("");
    setSetupStep("intro");
    setMode("setup");

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  };

  const selectSection = (sectionId: DashboardSection) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    if (sectionId === "mock") {
      setSetupStep("intro");
      setMode("setup");
    }
  };

  const activeSectionConfig =
    dashboardSections.find((section) => section.id === activeSection) ?? dashboardSections[0];

  if (mode === "exam" && activeQuestion) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-background px-5 py-4">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                  Locked mock exam
                </p>
                <h1 className="font-semibold text-xl">{selectedChapter.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm ${remainingSeconds <= 300 ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-card"}`}>
                  <TimerIcon className="h-4 w-4" />
                  {formatSeconds(remainingSeconds)}
                </div>
                <Button variant="outline" className="gap-2" onClick={() => cancelExam("Mock cancelled by the student before submission.")}>
                  <ArrowLeftIcon className="h-4 w-4" />
                  Cancel mock
                </Button>
              </div>
            </div>
          </header>

          <section className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
              <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                    Question {activeQuestionIndex + 1} of {examQuestions.length}
                  </p>
                  <h2 className="mt-2 font-semibold text-xl leading-snug">{activeQuestion.prompt}</h2>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                  <Badge>{activeQuestion.difficulty}</Badge>
                  <Badge>{activeQuestion.frequency}% frequency</Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {activeQuestion.options.map((option, index) => {
                  const selected = answers[activeQuestion.id] === index;
                  return (
                    <button
                      key={option}
                      className={`rounded-lg border px-4 py-4 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: index }))}
                      type="button"
                    >
                      <span className="mr-2 font-mono text-xs">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-5">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => openQuestion(Math.max(0, activeQuestionIndex - 1))}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
                {activeQuestionIndex === examQuestions.length - 1 ? (
                  <Button className="gap-2" onClick={completeExam}>
                    Submit exam
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="gap-2"
                    onClick={() => openQuestion(Math.min(examQuestions.length - 1, activeQuestionIndex + 1))}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <aside className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Questions</h2>
                  <p className="text-muted-foreground text-sm">{answeredCount} answered · {seenCount} seen</p>
                </div>
                <ClipboardListIcon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2">
                {examQuestions.map((question, index) => {
                  const answered = answers[question.id] !== undefined;
                  const seen = seenQuestionIds.has(question.id);
                  const active = index === activeQuestionIndex;
                  return (
                    <button
                      key={question.id}
                      className={`h-11 rounded-lg border text-sm transition-colors ${getQuestionTileClass({ active, answered, seen })}`}
                      onClick={() => openQuestion(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 text-xs">
                <LegendItem className="border-primary bg-primary text-primary-foreground" label="Current" />
                <LegendItem className="border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" label="Answered" />
                <LegendItem className="border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300" label="Seen" />
                <LegendItem className="border-border bg-background text-muted-foreground" label="Unseen" />
              </div>

              <div className="mt-5 rounded-lg border bg-background p-3 text-sm">
                <p className="font-medium">Exam lock</p>
                <p className="mt-1 text-muted-foreground">
                  Leaving this tab or exiting fullscreen before submission cancels the active mock.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open dashboard sections"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            <Logo className="hidden h-5 w-28 shrink-0 sm:block" />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{activeSectionConfig.label}</p>
              <p className="truncate text-muted-foreground text-xs">CBSE 12th Science</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t bg-background px-4 py-3 lg:hidden">
            <div className="grid gap-2">
              {dashboardSections.map((section) => (
                <MobileSectionButton
                  key={section.id}
                  section={section}
                  active={activeSection === section.id}
                  onClick={() => selectSection(section.id)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2">
            {dashboardSections.map((section) => (
              <NavItem
                key={section.id}
                icon={section.icon}
                label={section.shortLabel}
                active={activeSection === section.id}
                onClick={() => selectSection(section.id)}
              />
            ))}
          </nav>
        </aside>

        <section className="space-y-6">
          <DashboardHero activeSection={activeSectionConfig} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <Metric
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                detail={stat.detail}
              />
            ))}
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3">
            {dashboardSections.map((section) => (
              <DashboardSectionCard
                key={section.id}
                section={section}
                active={activeSection === section.id}
                onClick={() => selectSection(section.id)}
              />
            ))}
          </div>

          {activeSection === "mock" ? (
            <>
              <FeatureWorkspaceHeader section={activeSectionConfig} />

              <div className="grid gap-3 md:grid-cols-4">
                <Metric icon={FlameIcon} label="PYQ priority" value="High" detail="Ranked by frequency" />
                <Metric icon={Clock3Icon} label="Suggested time" value={`${examLengthConfig[examLength].minutes}m`} detail={examLengthConfig[examLength].label} />
                <Metric icon={Layers3Icon} label="Question pool" value={String(rankedQuestions.length)} detail="Filtered by selection" />
                <Metric icon={TrophyIcon} label="Target score" value="80%" detail="Recommended benchmark" />
              </div>

              {sessionNotice ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-800 text-sm dark:text-amber-200">
                  {sessionNotice}
                </div>
              ) : null}

              {mode === "setup" ? (
                <MockSetupWizard
                  setupStep={setupStep}
                  selectedSubject={selectedSubject}
                  selectedChapter={selectedChapter}
                  selectedUnitIds={selectedUnitIds}
                  examLength={examLength}
                  examQuestions={examQuestions}
                  rankedQuestions={rankedQuestions}
                  onBegin={() => router.push("/dashboard/mock-exam")}
                  onChooseSubject={chooseSubject}
                  onChooseChapter={chooseChapter}
                  onToggleUnit={toggleUnit}
                  onUseFullChapter={() => {
                    setSelectedUnitIds([]);
                    setSetupStep("length");
                  }}
                  onUnitsNext={() => setSetupStep("length")}
                  onChooseLength={(value) => {
                    setExamLength(value);
                    setSetupStep("confirm");
                  }}
                  onBack={() => setSetupStep(getPreviousSetupStep(setupStep))}
                  onCancel={cancelSetup}
                  onStartExam={startConfirmedExam}
                />
              ) : null}

          {mode === "exam" && activeQuestion ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
              <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
                <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                      Question {activeQuestionIndex + 1} of {examQuestions.length}
                    </p>
                    <h1 className="mt-1 font-semibold text-xl leading-snug">{activeQuestion.prompt}</h1>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                    <TimerIcon className="h-4 w-4 text-muted-foreground" />
                    {examLengthConfig[examLength].minutes}:00
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {activeQuestion.options.map((option, index) => {
                    const selected = answers[activeQuestion.id] === index;
                    return (
                      <button
                        key={option}
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                        }`}
                        onClick={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: index }))}
                        type="button"
                      >
                        <span className="font-mono text-xs">{String.fromCharCode(65 + index)}.</span> {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between border-t pt-5">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={activeQuestionIndex === 0}
                    onClick={() => openQuestion(Math.max(0, activeQuestionIndex - 1))}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                  {activeQuestionIndex === examQuestions.length - 1 ? (
                    <Button className="gap-2" onClick={completeExam}>
                      Submit exam
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      onClick={() => openQuestion(Math.min(examQuestions.length - 1, activeQuestionIndex + 1))}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <aside className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Navigator</h2>
                  <span className="text-muted-foreground text-sm">{answeredCount}/{examQuestions.length}</span>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {examQuestions.map((question, index) => {
                    const answered = answers[question.id] !== undefined;
                    const active = index === activeQuestionIndex;
                    return (
                      <button
                        key={question.id}
                        className={`h-10 rounded-lg border text-sm transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : answered
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-background hover:bg-accent"
                        }`}
                        onClick={() => openQuestion(index)}
                        type="button"
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 rounded-lg border bg-background p-3 text-sm">
                  <p className="font-medium">Selection basis</p>
                  <p className="mt-1 text-muted-foreground">
                    This mock uses the highest PYQ priority questions from {selectedChapter.name}.
                  </p>
                </div>
              </aside>
            </section>
          ) : null}

          {mode === "results" ? (
            <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
                <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Mock result</p>
                <h1 className="mt-1 font-bold text-3xl tracking-wide">{result.percentage}%</h1>
                <p className="text-muted-foreground text-sm">
                  {result.correct} correct, {result.incorrect} incorrect, {result.skipped} skipped
                </p>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${result.percentage}%` }} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <ResultStat label="Accuracy" value={`${result.percentage}%`} />
                  <ResultStat label="Attempted" value={`${result.attempted}/${examQuestions.length}`} />
                  <ResultStat label="PYQ coverage" value={`${examQuestions.length} key Qs`} />
                </div>
                <Button className="mt-5 w-full gap-2" onClick={resetExam}>
                  <RotateCcwIcon className="h-4 w-4" />
                  Build another mock
                </Button>
              </div>

              <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Review</p>
                    <h2 className="font-semibold text-xl">Answers and explanations</h2>
                  </div>
                  <SparklesIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-5 space-y-3">
                  {examQuestions.map((question, index) => {
                    const chosen = answers[question.id];
                    const correct = chosen === question.answerIndex;
                    return (
                      <div key={question.id} className="rounded-lg border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-sm">
                            {index + 1}. {question.prompt}
                          </p>
                          <span
                            className={`shrink-0 rounded-md px-2 py-1 text-xs ${
                              correct
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {correct ? "Correct" : chosen === undefined ? "Skipped" : "Review"}
                          </span>
                        </div>
                        <p className="mt-2 text-muted-foreground text-sm">{question.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
            </>
          ) : (
            <SectionPlaceholder section={dashboardSections.find((section) => section.id === activeSection) ?? dashboardSections[0]} />
          )}
        </section>
      </div>

      {cancellationReason ? (
        <MockCancellationModal
          reason={cancellationReason}
          onClose={() => setCancellationReason(null)}
        />
      ) : null}
    </main>
  );
}

export function MockExamFlow() {
  const router = useRouter();
  const [setupStep, setSetupStep] = useState<SetupStep>("subject");
  const [mode, setMode] = useState<ExamMode>("setup");
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [chapterId, setChapterId] = useState(subjects[0].chapters[0].id);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [examLength, setExamLength] = useState<ExamLength>("standard");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seenQuestionIds, setSeenQuestionIds] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const modeRef = useRef(mode);
  const allowFullscreenExitRef = useRef(false);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
  const selectedChapter = selectedSubject.chapters.find((chapter) => chapter.id === chapterId) ?? selectedSubject.chapters[0];

  const rankedQuestions = useMemo(() => {
    const unitFilter = selectedUnitIds.length ? selectedUnitIds : selectedChapter.units.map((unit) => unit.id);

    return questions
      .filter(
        (question) =>
          question.subjectId === selectedSubject.id &&
          question.chapterId === selectedChapter.id &&
          unitFilter.includes(question.unitId),
      )
      .sort((a, b) => questionScore(b) - questionScore(a));
  }, [selectedChapter, selectedSubject.id, selectedUnitIds]);

  const examQuestions = rankedQuestions.slice(0, examLengthConfig[examLength].questions);
  const activeQuestion = examQuestions[activeQuestionIndex];
  const answeredCount = examQuestions.filter((question) => answers[question.id] !== undefined).length;
  const seenCount = examQuestions.filter((question) => seenQuestionIds.has(question.id)).length;
  const result = calculateResult(examQuestions, answers);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (mode !== "exam") return;

    if (remainingSeconds <= 0) {
      completeExam();
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [mode, remainingSeconds]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (modeRef.current !== "exam") return;

      event.preventDefault();
      event.returnValue = "Your active mock exam will be cancelled.";
    };

    const handleVisibilityChange = () => {
      if (modeRef.current === "exam" && document.visibilityState === "hidden") {
        cancelExam("tab-switch");
      }
    };

    const handleFullscreenChange = () => {
      if (modeRef.current === "exam" && !document.fullscreenElement && !allowFullscreenExitRef.current) {
        cancelExam("fullscreen-exit");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const chooseSubject = (nextSubjectId: string) => {
    const nextSubject = subjects.find((subject) => subject.id === nextSubjectId) ?? subjects[0];
    setSubjectId(nextSubject.id);
    setChapterId(nextSubject.chapters[0].id);
    setSelectedUnitIds([]);
    setSetupStep("chapter");
  };

  const chooseChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setSelectedUnitIds([]);
    setSetupStep("units");
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId],
    );
  };

  const openQuestion = (index: number) => {
    const nextQuestion = examQuestions[index];

    if (!nextQuestion) return;

    setActiveQuestionIndex(index);
    setSeenQuestionIds((current) => new Set(current).add(nextQuestion.id));
  };

  const startExam = async () => {
    setAnswers({});
    setActiveQuestionIndex(0);
    setSeenQuestionIds(examQuestions[0] ? new Set([examQuestions[0].id]) : new Set());
    setRemainingSeconds(examLengthConfig[examLength].minutes * 60);
    allowFullscreenExitRef.current = false;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser denied fullscreen. Continue with the locked tab behavior.
    }

    setMode("exam");
  };

  const completeExam = () => {
    allowFullscreenExitRef.current = true;
    setMode("results");

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  };

  const cancelExam = (reason?: MockCancellationReason) => {
    allowFullscreenExitRef.current = true;
    setAnswers({});
    setSeenQuestionIds(new Set());
    setRemainingSeconds(0);
    setActiveQuestionIndex(0);
    setMode("setup");
    setSetupStep("subject");

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }

    if (reason) {
      router.replace(`/dashboard?section=mock&mock_cancelled=${reason}`);
    }
  };

  if (mode === "results") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground">
        <section className="w-full max-w-xl rounded-lg border bg-card p-6 shadow-sm shadow-black/5">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Mock result</p>
          <h1 className="mt-2 font-bold text-4xl tracking-wide">{result.percentage}%</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {result.correct} correct, {result.incorrect} incorrect, {result.skipped} skipped
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <ResultStat label="Accuracy" value={`${result.percentage}%`} />
            <ResultStat label="Attempted" value={`${result.attempted}/${examQuestions.length}`} />
            <ResultStat label="PYQ coverage" value={`${examQuestions.length} key Qs`} />
          </div>
          <Button className="mt-6 w-full" onClick={() => cancelExam()}>Create another mock</Button>
        </section>
      </main>
    );
  }

  if (mode === "exam" && activeQuestion) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-5 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                  Question {activeQuestionIndex + 1} of {examQuestions.length}
                </p>
                <h1 className="mt-2 font-semibold text-xl leading-snug">{activeQuestion.prompt}</h1>
              </div>
              <div className={`shrink-0 rounded-lg border px-3 py-2 font-mono text-sm ${remainingSeconds <= 300 ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-background"}`}>
                {formatSeconds(remainingSeconds)}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {activeQuestion.options.map((option, index) => {
                const selected = answers[activeQuestion.id] === index;
                return (
                  <button
                    key={option}
                    className={`rounded-lg border px-4 py-4 text-left text-sm transition-colors ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                    }`}
                    onClick={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: index }))}
                    type="button"
                  >
                    <span className="mr-2 font-mono text-xs">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-5">
              <Button variant="outline" disabled={activeQuestionIndex === 0} onClick={() => openQuestion(activeQuestionIndex - 1)}>
                Back
              </Button>
              {activeQuestionIndex === examQuestions.length - 1 ? (
                <Button onClick={completeExam}>Submit</Button>
              ) : (
                <Button onClick={() => openQuestion(activeQuestionIndex + 1)}>Next</Button>
              )}
            </div>
          </div>

          <aside className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Questions</h2>
              <span className="text-muted-foreground text-sm">{answeredCount} answered · {seenCount} seen</span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {examQuestions.map((question, index) => {
                const answered = answers[question.id] !== undefined;
                const seen = seenQuestionIds.has(question.id);
                const active = index === activeQuestionIndex;
                return (
                  <button
                    key={question.id}
                    className={`h-11 rounded-lg border text-sm transition-colors ${getQuestionTileClass({ active, answered, seen })}`}
                    onClick={() => openQuestion(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <Button variant="outline" className="mt-5 w-full" onClick={() => cancelExam("manual")}>Cancel mock</Button>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground">
      <section className="w-full max-w-xl">
        <MockSetupQuestion
          setupStep={setupStep}
          selectedSubject={selectedSubject}
          selectedChapter={selectedChapter}
          selectedUnitIds={selectedUnitIds}
          examLength={examLength}
          examQuestions={examQuestions}
          rankedQuestions={rankedQuestions}
          onChooseSubject={chooseSubject}
          onChooseChapter={chooseChapter}
          onToggleUnit={toggleUnit}
          onUseFullChapter={() => {
            setSelectedUnitIds([]);
            setSetupStep("length");
          }}
          onUnitsNext={() => setSetupStep("length")}
          onChooseLength={(value) => {
            setExamLength(value);
            setSetupStep("confirm");
          }}
          onBack={() => setSetupStep(getPreviousSetupStep(setupStep))}
          onStartExam={() => void startExam()}
        />
      </section>
    </main>
  );
}

function isMockCancellationReason(value: string | null): value is MockCancellationReason {
  return value === "tab-switch" || value === "fullscreen-exit" || value === "manual";
}

function getMockCancellationMessage(reason: MockCancellationReason) {
  if (reason === "tab-switch") {
    return "Your mock exam was cancelled because you switched tabs or left the exam window before submitting.";
  }

  if (reason === "fullscreen-exit") {
    return "Your mock exam was cancelled because fullscreen mode was exited before submitting.";
  }

  return "Your mock exam was cancelled before submission.";
}

function MockCancellationModal({
  reason,
  onClose,
}: {
  reason: MockCancellationReason;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-lg border bg-card p-5 text-card-foreground shadow-lg shadow-black/10"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mock-cancelled-title"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="mock-cancelled-title" className="font-semibold text-lg">Mock exam cancelled</h2>
            <p className="mt-2 text-muted-foreground text-sm">{getMockCancellationMessage(reason)}</p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>Got it</Button>
      </div>
    </div>
  );
}

function MockSetupQuestion({
  setupStep,
  selectedSubject,
  selectedChapter,
  selectedUnitIds,
  examLength,
  examQuestions,
  rankedQuestions,
  onChooseSubject,
  onChooseChapter,
  onToggleUnit,
  onUseFullChapter,
  onUnitsNext,
  onChooseLength,
  onBack,
  onStartExam,
}: {
  setupStep: SetupStep;
  selectedSubject: Subject;
  selectedChapter: Chapter;
  selectedUnitIds: string[];
  examLength: ExamLength;
  examQuestions: Question[];
  rankedQuestions: Question[];
  onChooseSubject: (subjectId: string) => void;
  onChooseChapter: (chapterId: string) => void;
  onToggleUnit: (unitId: string) => void;
  onUseFullChapter: () => void;
  onUnitsNext: () => void;
  onChooseLength: (length: ExamLength) => void;
  onBack: () => void;
  onStartExam: () => void;
}) {
  const selectedUnitNames = selectedUnitIds.length
    ? selectedChapter.units.filter((unit) => selectedUnitIds.includes(unit.id)).map((unit) => unit.name).join(", ")
    : "Full chapter";


  if (setupStep === "subject") {
    return (
      <MinimalStep eyebrow="Step 1 of 5" title="Which subject do you want to practice?">
        <ChoiceList options={subjects.map((subject) => ({ id: subject.id, label: subject.name }))} value={selectedSubject.id} onChange={onChooseSubject} />
      </MinimalStep>
    );
  }

  if (setupStep === "chapter") {
    return (
      <MinimalStep eyebrow="Step 2 of 5" title="Which chapter should the mock focus on?" onBack={onBack}>
        <ChoiceList options={selectedSubject.chapters.map((chapter) => ({ id: chapter.id, label: chapter.name }))} value={selectedChapter.id} onChange={onChooseChapter} />
      </MinimalStep>
    );
  }

  if (setupStep === "units") {
    return (
      <MinimalStep eyebrow="Step 3 of 5" title="Any specific units?" onBack={onBack}>
        <div className="grid gap-2">
          {selectedChapter.units.map((unit) => {
            const selected = selectedUnitIds.includes(unit.id);
            return (
              <button
                key={unit.id}
                className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                }`}
                onClick={() => onToggleUnit(unit.id)}
                type="button"
              >
                {unit.name}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={onUseFullChapter}>Use full chapter</Button>
          <Button onClick={onUnitsNext}>Continue</Button>
        </div>
      </MinimalStep>
    );
  }

  if (setupStep === "length") {
    return (
      <MinimalStep eyebrow="Step 4 of 5" title="How long should the mock be?" onBack={onBack}>
        <ChoiceList
          options={Object.entries(examLengthConfig).map(([id, config]) => ({ id, label: `${config.label} · ${config.questions} questions` }))}
          value={examLength}
          onChange={(value) => onChooseLength(value as ExamLength)}
        />
      </MinimalStep>
    );
  }

  return (
    <MinimalStep eyebrow="Step 5 of 5" title="Ready to start?" onBack={onBack}>
      <div className="space-y-2 rounded-lg border bg-card p-4 text-sm">
        <p><span className="text-muted-foreground">Subject:</span> {selectedSubject.name}</p>
        <p><span className="text-muted-foreground">Chapter:</span> {selectedChapter.name}</p>
        <p><span className="text-muted-foreground">Units:</span> {selectedUnitNames}</p>
        <p><span className="text-muted-foreground">Length:</span> {examLengthConfig[examLength].label}</p>
        <p><span className="text-muted-foreground">Questions:</span> {examQuestions.length} from {rankedQuestions.length} matching PYQs</p>
      </div>
      <Button className="mt-4 h-11 w-full" disabled={!examQuestions.length} onClick={onStartExam}>Start exam</Button>
    </MinimalStep>
  );
}

function MinimalStep({
  eyebrow,
  title,
  onBack,
  children,
}: {
  eyebrow: string;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">{eyebrow}</p>
          <h1 className="mt-2 font-bold text-3xl tracking-wide">{title}</h1>
        </div>
        {onBack ? <Button variant="ghost" onClick={onBack}>Back</Button> : null}
      </div>
      {children}
    </div>
  );
}

function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
            value === option.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
          }`}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MockSetupWizard({
  setupStep,
  selectedSubject,
  selectedChapter,
  selectedUnitIds,
  examLength,
  examQuestions,
  rankedQuestions,
  onBegin,
  onChooseSubject,
  onChooseChapter,
  onToggleUnit,
  onUseFullChapter,
  onUnitsNext,
  onChooseLength,
  onBack,
  onCancel,
  onStartExam,
}: {
  setupStep: SetupStep;
  selectedSubject: Subject;
  selectedChapter: Chapter;
  selectedUnitIds: string[];
  examLength: ExamLength;
  examQuestions: Question[];
  rankedQuestions: Question[];
  onBegin: () => void;
  onChooseSubject: (subjectId: string) => void;
  onChooseChapter: (chapterId: string) => void;
  onToggleUnit: (unitId: string) => void;
  onUseFullChapter: () => void;
  onUnitsNext: () => void;
  onChooseLength: (length: ExamLength) => void;
  onBack: () => void;
  onCancel: () => void;
  onStartExam: () => void;
}) {
  const selectedUnitNames = selectedUnitIds.length
    ? selectedChapter.units.filter((unit) => selectedUnitIds.includes(unit.id)).map((unit) => unit.name)
    : ["Full chapter"];

  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5">
      {setupStep === "intro" ? (
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Mock exam</p>
            <h2 className="mt-1 font-bold text-2xl tracking-wide">Ready for a PYQ mock?</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
              Sutra AI will ask a few quick questions, then build a locked mock from high-frequency and important PYQs.
            </p>
          </div>
          <Button className="h-11 gap-2 md:w-52" onClick={onBegin}>
            <PlayIcon className="h-4 w-4" />
            Start Mock Exam
          </Button>
        </div>
      ) : null}

      {setupStep === "subject" ? (
        <WizardStepShell
          eyebrow="Step 1 of 5"
          title="Which subject do you want to test?"
          onBack={onCancel}
          backLabel="Cancel"
        >
          <SegmentedOptions
            options={subjects.map((subject) => ({ id: subject.id, label: subject.name }))}
            value={selectedSubject.id}
            onChange={onChooseSubject}
          />
        </WizardStepShell>
      ) : null}

      {setupStep === "chapter" ? (
        <WizardStepShell eyebrow="Step 2 of 5" title="Choose a chapter" onBack={onBack}>
          <SegmentedOptions
            options={selectedSubject.chapters.map((chapter) => ({ id: chapter.id, label: chapter.name }))}
            value={selectedChapter.id}
            onChange={onChooseChapter}
          />
        </WizardStepShell>
      ) : null}

      {setupStep === "units" ? (
        <WizardStepShell
          eyebrow="Step 3 of 5"
          title="Choose units"
          description="Select specific units or use the full chapter."
          onBack={onBack}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedChapter.units.map((unit) => {
              const selected = selectedUnitIds.includes(unit.id);
              return (
                <button
                  key={unit.id}
                  className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => onToggleUnit(unit.id)}
                  type="button"
                >
                  <span>{unit.name}</span>
                  {selected ? <CheckCircle2Icon className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={onUseFullChapter}>Use full chapter</Button>
            <Button onClick={onUnitsNext}>Continue</Button>
          </div>
        </WizardStepShell>
      ) : null}

      {setupStep === "length" ? (
        <WizardStepShell eyebrow="Step 4 of 5" title="Pick exam length" onBack={onBack}>
          <SegmentedOptions
            options={Object.entries(examLengthConfig).map(([id, config]) => ({
              id,
              label: `${config.label} - ${config.questions} Qs`,
            }))}
            value={examLength}
            onChange={(value) => onChooseLength(value as ExamLength)}
          />
        </WizardStepShell>
      ) : null}

      {setupStep === "confirm" ? (
        <WizardStepShell
          eyebrow="Step 5 of 5"
          title="Ready to start?"
          description="The mock will enter fullscreen and leaving the tab cancels the session."
          onBack={onBack}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem label="Subject" value={selectedSubject.name} />
            <SummaryItem label="Chapter" value={selectedChapter.name} />
            <SummaryItem label="Units" value={selectedUnitNames.join(", ")} />
            <SummaryItem label="Length" value={`${examLengthConfig[examLength].label} · ${examLengthConfig[examLength].minutes}m`} />
          </div>
          <QuestionPreview compact questions={examQuestions} selectedChapter={selectedChapter.name} />
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {examQuestions.length} questions ready from {rankedQuestions.length} matching PYQs.
            </p>
            <Button className="h-10 gap-2" disabled={!examQuestions.length} onClick={onStartExam}>
              <PlayIcon className="h-4 w-4" />
              Start Exam
            </Button>
          </div>
        </WizardStepShell>
      ) : null}
    </section>
  );
}

function WizardStepShell({
  eyebrow,
  title,
  description,
  backLabel = "Back",
  onBack,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backLabel?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">{eyebrow}</p>
          <h2 className="mt-1 font-bold text-2xl tracking-wide">{title}</h2>
          {description ? <p className="mt-2 text-muted-foreground text-sm">{description}</p> : null}
        </div>
        <Button variant="ghost" onClick={onBack}>{backLabel}</Button>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function getPreviousSetupStep(step: SetupStep): SetupStep {
  if (step === "chapter") return "subject";
  if (step === "units") return "chapter";
  if (step === "length") return "units";
  if (step === "confirm") return "length";
  return "intro";
}

function SegmentedOptions({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.id}
          className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            value === option.id
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QuestionPreview({ questions, selectedChapter, compact = false }: { questions: Question[]; selectedChapter: string; compact?: boolean }) {
  return (
    <aside className={`${compact ? "mt-5" : ""} rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">PYQ ranking</p>
          <h2 className="font-semibold text-xl">Most likely questions</h2>
        </div>
        <ClipboardListIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        Ranked from {selectedChapter} using frequency and importance scores.
      </p>
      <div className="mt-5 space-y-3">
        {questions.length ? (
          questions.slice(0, compact ? 3 : questions.length).map((question, index) => (
            <div key={question.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-sm leading-snug">
                  {index + 1}. {question.prompt}
                </p>
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{questionScore(question)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge>{question.difficulty}</Badge>
                <Badge>{question.frequency}% frequency</Badge>
                <Badge>{question.sourceYears.length} PYQs</Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-background p-4 text-muted-foreground text-sm">
            No questions match this selection yet.
          </div>
        )}
      </div>
    </aside>
  );
}

function DashboardHero({ activeSection }: { activeSection: (typeof dashboardSections)[number] }) {
  const ActiveIcon = activeSection.icon;

  return (
    <section className="relative overflow-hidden rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5 sm:p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${activeSection.accent}`} />
      <FeatureSignalArt />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={activeSection.status} />
            <span className="rounded-md border bg-background/70 px-2 py-1 text-muted-foreground text-xs backdrop-blur">
              Owner: {activeSection.owner}
            </span>
            <span className="rounded-md border bg-background/70 px-2 py-1 text-muted-foreground text-xs backdrop-blur">
              {activeSection.stage}
            </span>
          </div>
          <h1 className="mt-5 max-w-2xl font-bold text-3xl tracking-wide sm:text-4xl">
            Sutra AI command center
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground text-sm leading-6 sm:text-base">
            A shared feature hub for agentic learning, exam preparation, and the mock-test engine. Use this as the common starting point for frontend and backend work.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {activeSection.signals.map((signal) => (
              <span key={signal} className="rounded-md border bg-background/70 px-2.5 py-1.5 text-xs backdrop-blur">
                {signal}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-background/75 p-4 backdrop-blur">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Active workspace</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="rounded-lg border bg-card p-2">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{activeSection.label}</h2>
              <p className="mt-1 text-muted-foreground text-sm">{activeSection.nextMilestone}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSignalArt() {
  return (
    <svg
      className="pointer-events-none absolute right-0 top-0 h-full w-1/2 min-w-80 text-foreground/10"
      fill="none"
      viewBox="0 0 420 260"
      aria-hidden="true"
    >
      <path d="M46 168 C100 88 164 219 225 122 S333 58 390 111" stroke="currentColor" strokeWidth="1.5" />
      <path d="M76 207 C139 127 193 245 260 151 S350 98 404 146" stroke="currentColor" strokeDasharray="5 7" strokeWidth="1.5" />
      {[62, 146, 225, 302, 376].map((cx, index) => (
        <circle key={cx} cx={cx} cy={[151, 128, 122, 91, 105][index]} r="5" className="fill-background stroke-current" />
      ))}
      <rect x="260" y="36" width="104" height="58" rx="8" className="fill-background/60 stroke-current" />
      <path d="M280 57h52M280 73h34" stroke="currentColor" />
    </svg>
  );
}

function FeatureWorkspaceHeader({ section }: { section: (typeof dashboardSections)[number] }) {
  const Icon = section.icon;

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-background p-3">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={section.status} />
              <span className="text-muted-foreground text-xs">{section.owner}</span>
            </div>
            <h2 className="mt-2 font-bold text-2xl tracking-wide">{section.label}</h2>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{section.description}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm sm:w-64">
          <p className="font-medium">Next milestone</p>
          <p className="mt-1 text-muted-foreground">{section.nextMilestone}</p>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: FeatureStatus }) {
  const className =
    status === "Active"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "Next"
        ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
        : "border-border bg-background text-muted-foreground";

  return <span className={`rounded-md border px-2 py-1 text-xs ${className}`}>{status}</span>;
}

function MobileSectionButton({
  section,
  active,
  onClick,
}: {
  section: (typeof dashboardSections)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;

  return (
    <button
      className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-black/10"
          : "bg-card text-card-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{section.shortLabel}</p>
        <p className={`truncate text-xs ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
          {section.owner} · {section.status}
        </p>
      </div>
      {active ? <CheckCircle2Icon className="h-4 w-4 shrink-0" /> : null}
    </button>
  );
}

function DashboardSectionCard({
  section,
  active,
  onClick,
}: {
  section: (typeof dashboardSections)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;

  return (
    <button
      className={`group relative min-h-48 overflow-hidden rounded-lg border p-4 text-left shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-black/10 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-card-foreground hover:border-foreground/20"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${section.accent} opacity-80 transition-opacity group-hover:opacity-100`} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-lg border p-2 ${active ? "border-primary-foreground/20 bg-primary-foreground/10" : "bg-background/70"}`}>
            <Icon className="h-5 w-5 shrink-0" />
          </div>
          <StatusPill status={section.status} />
        </div>
        <div className="mt-4 flex-1">
          <p className="text-muted-foreground text-xs">{section.stage}</p>
          <p className="mt-1 font-semibold leading-snug">{section.label}</p>
          <p className={`mt-2 text-sm leading-5 ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
            {section.description}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className={active ? "text-primary-foreground/80" : "text-muted-foreground"}>{section.owner}</span>
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function SectionPlaceholder({ section }: { section: (typeof dashboardSections)[number] }) {
  const Icon = section.icon;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm shadow-black/5">
        <div className={`absolute inset-0 bg-gradient-to-br ${section.accent}`} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={section.status} />
            <span className="rounded-md border bg-background/70 px-2 py-1 text-muted-foreground text-xs backdrop-blur">
              Owner: {section.owner}
            </span>
            <span className="rounded-md border bg-background/70 px-2 py-1 text-muted-foreground text-xs backdrop-blur">
              {section.stage}
            </span>
          </div>
          <div className="mt-5 flex items-start gap-4">
            <div className="rounded-lg border bg-background/80 p-3 backdrop-blur">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-2xl tracking-wide">{section.label}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">{section.description}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {section.signals.map((signal) => (
              <div key={signal} className="rounded-lg border bg-background/75 p-3 backdrop-blur">
                <p className="text-muted-foreground text-xs">Signal</p>
                <p className="mt-1 font-medium text-sm">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Build note</p>
        <h3 className="mt-2 font-semibold">Next useful slice</h3>
        <p className="mt-2 text-muted-foreground text-sm leading-6">{section.nextMilestone}</p>
        <div className="mt-5 rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm">
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Demo state ready</span>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            This panel is intentionally reserved so backend and agent work can plug into a stable UI contract.
          </p>
        </div>
      </aside>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FlameIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-h-28 rounded-lg border bg-card p-4 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-bold text-2xl tracking-wide">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof BookOpenCheckIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border bg-card px-2 py-1 text-muted-foreground">{children}</span>;
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded border ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function getQuestionTileClass({
  active,
  answered,
  seen,
}: {
  active: boolean;
  answered: boolean;
  seen: boolean;
}) {
  if (active) return "border-primary bg-primary text-primary-foreground";
  if (answered) return "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (seen) return "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground";
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function questionScore(question: Question) {
  return Math.round(question.frequency * 0.6 + question.importance * 0.4);
}

function calculateResult(examQuestions: Question[], answers: Record<string, number>) {
  const correct = examQuestions.filter((question) => answers[question.id] === question.answerIndex).length;
  const attempted = examQuestions.filter((question) => answers[question.id] !== undefined).length;
  const skipped = examQuestions.length - attempted;
  const incorrect = attempted - correct;
  const percentage = examQuestions.length ? Math.round((correct / examQuestions.length) * 100) : 0;

  return { attempted, correct, incorrect, percentage, skipped };
}
