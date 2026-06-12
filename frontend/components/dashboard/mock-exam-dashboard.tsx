"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  BookOpenCheckIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClipboardListIcon,
  Clock3Icon,
  FlameIcon,
  Layers3Icon,
  ListChecksIcon,
  MenuIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
  TrophyIcon,
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
type DashboardSection = "mock" | "study-plan" | "progress" | "practice";
type SetupStep = "intro" | "subject" | "chapter" | "units" | "length" | "confirm";

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
  description: string;
  icon: typeof BookOpenCheckIcon;
}[] = [
  {
    id: "mock",
    label: "Mock Exam",
    description: "Build PYQ-ranked tests by chapter and unit.",
    icon: BookOpenCheckIcon,
  },
  {
    id: "study-plan",
    label: "Study Plan",
    description: "Daily tasks and revision schedule.",
    icon: TargetIcon,
  },
  {
    id: "progress",
    label: "Progress",
    description: "Scores, weak topics, and readiness trends.",
    icon: BarChart3Icon,
  },
  {
    id: "practice",
    label: "Practice Sets",
    description: "Focused drills from recent mistakes.",
    icon: ListChecksIcon,
  },
];

export function MockExamDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("study-plan");
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
    if (sectionId === "mock") {
      router.push("/dashboard/mock-exam");
      return;
    }

    setActiveSection(sectionId);
    setMobileMenuOpen(false);
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
                label={section.label}
                active={activeSection === section.id}
                onClick={() => selectSection(section.id)}
              />
            ))}
          </nav>
        </aside>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Learning workspace</p>
            <h1 className="font-bold text-2xl tracking-wide sm:text-3xl">Choose what to work on</h1>
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
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
                  onBegin={() => setSetupStep("subject")}
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
    </main>
  );
}

export function MockExamFlow() {
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
        cancelExam();
      }
    };

    const handleFullscreenChange = () => {
      if (modeRef.current === "exam" && !document.fullscreenElement && !allowFullscreenExitRef.current) {
        cancelExam();
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

  const cancelExam = () => {
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
          <Button className="mt-6 w-full" onClick={cancelExam}>Create another mock</Button>
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
            <Button variant="outline" className="mt-5 w-full" onClick={cancelExam}>Cancel mock</Button>
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
            <h2 className="mt-1 font-bold text-2xl tracking-wide">Start a PYQ-focused mock</h2>
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

function SelectorGroup({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof SearchIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </section>
  );
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
      className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{section.label}</p>
        <p className={`truncate text-xs ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
          {section.description}
        </p>
      </div>
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
      className={`min-h-28 rounded-lg border p-4 text-left shadow-sm shadow-black/5 transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        {active ? <CheckCircle2Icon className="h-4 w-4 shrink-0" /> : null}
      </div>
      <p className="mt-4 font-semibold">{section.label}</p>
      <p className={`mt-1 text-sm ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        {section.description}
      </p>
    </button>
  );
}

function SectionPlaceholder({ section }: { section: (typeof dashboardSections)[number] }) {
  const Icon = section.icon;

  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm shadow-black/5">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border bg-background p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Coming next</p>
          <h2 className="mt-1 font-semibold text-xl">{section.label}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
            This section is reserved in the dashboard shell. Mock Exam is the active feature being built first, and this area will become the dedicated {section.label.toLowerCase()} workspace later.
          </p>
        </div>
      </div>
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
    <div className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
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
      <Icon className="h-4 w-4" />
      {label}
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
