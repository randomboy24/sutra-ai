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
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
  TrophyIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Logo } from "@/components/logo";
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

export function MockExamDashboard() {
  const [mode, setMode] = useState<ExamMode>("setup");
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [chapterId, setChapterId] = useState(subjects[0].chapters[0].id);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [examLength, setExamLength] = useState<ExamLength>("standard");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

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
  const result = calculateResult(examQuestions, answers);

  const changeSubject = (nextSubjectId: string) => {
    const nextSubject = subjects.find((subject) => subject.id === nextSubjectId) ?? subjects[0];
    setSubjectId(nextSubject.id);
    setChapterId(nextSubject.chapters[0].id);
    setSelectedUnitIds([]);
    setAnswers({});
    setActiveQuestionIndex(0);
  };

  const changeChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setSelectedUnitIds([]);
    setAnswers({});
    setActiveQuestionIndex(0);
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId],
    );
  };

  const startExam = () => {
    setAnswers({});
    setActiveQuestionIndex(0);
    setMode("exam");
  };

  const resetExam = () => {
    setAnswers({});
    setActiveQuestionIndex(0);
    setMode("setup");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo className="h-5 w-28" />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <p className="hidden text-muted-foreground text-sm sm:block">Student dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg border bg-card px-3 py-1.5 text-sm lg:block">
              CBSE 12th Science
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-2">
            <NavItem icon={BookOpenCheckIcon} label="Mock Exam" active />
            <NavItem icon={TargetIcon} label="Study Plan" />
            <NavItem icon={BarChart3Icon} label="Progress" />
            <NavItem icon={ListChecksIcon} label="Practice Sets" />
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={FlameIcon} label="PYQ priority" value="High" detail="Ranked by frequency" />
            <Metric icon={Clock3Icon} label="Suggested time" value={`${examLengthConfig[examLength].minutes}m`} detail={examLengthConfig[examLength].label} />
            <Metric icon={Layers3Icon} label="Question pool" value={String(rankedQuestions.length)} detail="Filtered by selection" />
            <Metric icon={TrophyIcon} label="Target score" value="80%" detail="Recommended benchmark" />
          </div>

          {mode === "setup" ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5">
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">Mock exam builder</p>
                  <h1 className="font-bold text-2xl tracking-wide">Create a PYQ-focused test</h1>
                  <p className="text-muted-foreground text-sm">
                    Pick a chapter, optionally narrow it to units, and Sutra AI will prioritize frequently asked and important questions.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <SelectorGroup title="Subject" icon={SearchIcon}>
                    <SegmentedOptions
                      options={subjects.map((subject) => ({ id: subject.id, label: subject.name }))}
                      value={subjectId}
                      onChange={changeSubject}
                    />
                  </SelectorGroup>

                  <SelectorGroup title="Chapter" icon={BookOpenCheckIcon}>
                    <SegmentedOptions
                      options={selectedSubject.chapters.map((chapter) => ({ id: chapter.id, label: chapter.name }))}
                      value={chapterId}
                      onChange={changeChapter}
                    />
                  </SelectorGroup>

                  <SelectorGroup title="Units" icon={Layers3Icon} description="Leave units unselected to include the full chapter.">
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
                            onClick={() => toggleUnit(unit.id)}
                            type="button"
                          >
                            <span>{unit.name}</span>
                            {selected ? <CheckCircle2Icon className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </SelectorGroup>

                  <SelectorGroup title="Exam length" icon={TimerIcon}>
                    <SegmentedOptions
                      options={Object.entries(examLengthConfig).map(([id, config]) => ({
                        id,
                        label: `${config.label} - ${config.questions} Qs`,
                      }))}
                      value={examLength}
                      onChange={(value) => setExamLength(value as ExamLength)}
                    />
                  </SelectorGroup>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-muted-foreground text-sm">
                    {examQuestions.length} questions ready from {rankedQuestions.length} matching PYQs.
                  </div>
                  <Button className="h-10 gap-2" disabled={!examQuestions.length} onClick={startExam}>
                    <PlayIcon className="h-4 w-4" />
                    Start mock exam
                  </Button>
                </div>
              </section>

              <QuestionPreview questions={examQuestions} selectedChapter={selectedChapter.name} />
            </div>
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
                    onClick={() => setActiveQuestionIndex((index) => Math.max(0, index - 1))}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                  {activeQuestionIndex === examQuestions.length - 1 ? (
                    <Button className="gap-2" onClick={() => setMode("results")}>
                      Submit exam
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      onClick={() => setActiveQuestionIndex((index) => Math.min(examQuestions.length - 1, index + 1))}
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
                        onClick={() => setActiveQuestionIndex(index)}
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
        </section>
      </div>
    </main>
  );
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

function QuestionPreview({ questions, selectedChapter }: { questions: Question[]; selectedChapter: string }) {
  return (
    <aside className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5">
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
          questions.map((question, index) => (
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

function NavItem({ icon: Icon, label, active = false }: { icon: typeof BookOpenCheckIcon; label: string; active?: boolean }) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
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
