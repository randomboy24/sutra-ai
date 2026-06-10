"use client";

import { SignIn } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import { ChevronLeftIcon, GraduationCapIcon, LandmarkIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "choice" | "signin" | "signup";
type WizardStep =
  | "account"
  | "studentType"
  | "class"
  | "board"
  | "stream"
  | "scienceGroup"
  | "form"
  | "verify";
type ClassLevel = "10th" | "12th";
type Stream = "science" | "commerce";
type ScienceGroup = "pcb" | "pcm" | "pcmb";

type OnboardingState = {
  role: "student";
  student_type: "individual";
  class_level?: ClassLevel;
  board?: "CBSE";
  stream?: Stream;
  science_group?: ScienceGroup;
  onboarding_complete: true;
};

const initialOnboarding: OnboardingState = {
  role: "student",
  student_type: "individual",
  onboarding_complete: true,
};

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("choice");

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" />

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Sutra AI completely transformed our student academic readiness. Our teachers save over 12 hours a week on test formulation, while our students get highly targeted remedial plans automatically.&rdquo;
            </p>
            <footer className="font-mono font-semibold text-xs">
              ~ Dr. Rajesh Patel, Principal of DPS Academy
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col justify-center px-8">
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>
        <Button asChild className="absolute top-7 left-5" variant="ghost">
          <Link href="/">
            <ChevronLeftIcon data-icon="inline-start" />Home
          </Link>
        </Button>

        <div className="mx-auto space-y-4 sm:w-sm">
          <Logo className="h-4.5 lg:hidden" />
          <AuthContent mode={mode} setMode={setMode} />
        </div>
      </div>
    </main>
  );
}

function AuthContent({
  mode,
  setMode,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
}) {
  if (mode === "signin") {
    return (
      <div className="space-y-4">
        <AuthHeader
          title="Welcome back"
          description="Sign in to continue to your Sutra AI dashboard."
        />
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none border border-border rounded-lg",
            },
          }}
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/auth"
        />
        <Button variant="ghost" className="w-full" onClick={() => setMode("choice")}>
          Back
        </Button>
      </div>
    );
  }

  if (mode === "signup") {
    return <SignupWizard onBackToChoice={() => setMode("choice")} />;
  }

  return (
    <div className="space-y-5">
      <AuthHeader
        title="Sign in or join Sutra AI"
        description="Choose how you want to access your learning workspace."
      />
      <div className="grid gap-3">
        <Button className="h-12 justify-start gap-3" onClick={() => setMode("signup")}>
          <GraduationCapIcon className="h-4 w-4" />
          Sign up
        </Button>
        <Button
          variant="outline"
          className="h-12 justify-start gap-3"
          onClick={() => setMode("signin")}
        >
          <LandmarkIcon className="h-4 w-4" />
          Sign in
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        By continuing, you agree to Sutra AI account access being managed through Clerk.
      </p>
    </div>
  );
}

function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <h1 className="font-bold text-2xl tracking-wide">{title}</h1>
      <p className="text-base text-muted-foreground">{description}</p>
    </div>
  );
}

function SignupWizard({ onBackToChoice }: { onBackToChoice: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [step, setStep] = useState<WizardStep>("account");
  const [metadata, setMetadata] = useState<OnboardingState>(initialOnboarding);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useMemo(() => {
    const steps: WizardStep[] =
      metadata.stream === "science"
        ? ["account", "studentType", "class", "board", "stream", "scienceGroup", "form", "verify"]
        : ["account", "studentType", "class", "board", "stream", "form", "verify"];

    return {
      current: Math.max(1, steps.indexOf(step) + 1),
      total: steps.length,
    };
  }, [metadata.stream, step]);

  const selectClass = (class_level: ClassLevel) => {
    setMetadata((current) => ({ ...current, class_level }));
    setStep("board");
  };

  const selectStream = (stream: Stream) => {
    setMetadata((current) => {
      const next = { ...current, stream };
      if (stream === "commerce") {
        delete next.science_group;
      }
      return next;
    });
    setStep(stream === "science" ? "scienceGroup" : "form");
  };

  const goBack = () => {
    setError("");
    if (step === "account") {
      onBackToChoice();
      return;
    }
    if (step === "studentType") setStep("account");
    if (step === "class") setStep("studentType");
    if (step === "board") setStep("class");
    if (step === "stream") setStep("board");
    if (step === "scienceGroup") setStep("stream");
    if (step === "form") setStep(metadata.stream === "science" ? "scienceGroup" : "stream");
    if (step === "verify") setStep("form");
  };

  const startSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isLoaded) return;

    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress,
        password,
        unsafeMetadata: metadata,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isLoaded) return;

    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/dashboard";
        return;
      }

      setError("Verification is incomplete. Please check the code and try again.");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="font-mono text-muted-foreground text-xs">
          Step {progress.current} of {progress.total}
        </p>
        <AuthHeader title="Create your student account" description="Answer a few questions before signup." />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {step === "account" ? (
        <WizardOptions
          options={[
            {
              label: "Student",
              description: "Personal learning dashboard and AI study support.",
              onClick: () => setStep("studentType"),
            },
            {
              label: "Institute",
              description: "Classroom and institution management is coming soon.",
              disabled: true,
            },
          ]}
        />
      ) : null}

      {step === "studentType" ? (
        <WizardOptions
          options={[
            {
              label: "Individual student",
              description: "Create an account for yourself.",
              onClick: () => setStep("class"),
            },
            {
              label: "Belongs to an institute",
              description: "Institute-linked onboarding is coming soon.",
              disabled: true,
            },
          ]}
        />
      ) : null}

      {step === "class" ? (
        <WizardOptions
          options={[
            {
              label: "10th",
              description: "Prepare with class 10 learning paths.",
              onClick: () => selectClass("10th"),
            },
            {
              label: "12th",
              description: "Prepare with class 12 learning paths.",
              onClick: () => selectClass("12th"),
            },
          ]}
        />
      ) : null}

      {step === "board" ? (
        <WizardOptions
          options={[
            {
              label: "CBSE",
              description: "Central Board of Secondary Education.",
              onClick: () => {
                setMetadata((current) => ({ ...current, board: "CBSE" }));
                setStep("stream");
              },
            },
            { label: "GSEB", description: "Coming soon.", disabled: true },
            { label: "ICSE", description: "Coming soon.", disabled: true },
          ]}
        />
      ) : null}

      {step === "stream" ? (
        <WizardOptions
          options={[
            {
              label: "Science",
              description: "Select your science group next.",
              onClick: () => selectStream("science"),
            },
            {
              label: "Commerce",
              description: "Continue without a science group.",
              onClick: () => selectStream("commerce"),
            },
          ]}
        />
      ) : null}

      {step === "scienceGroup" ? (
        <WizardOptions
          options={[
            {
              label: "PCB",
              description: "Physics, Chemistry, Biology.",
              onClick: () => {
                setMetadata((current) => ({ ...current, science_group: "pcb" }));
                setStep("form");
              },
            },
            {
              label: "PCM",
              description: "Physics, Chemistry, Mathematics.",
              onClick: () => {
                setMetadata((current) => ({ ...current, science_group: "pcm" }));
                setStep("form");
              },
            },
            {
              label: "PCMB",
              description: "Physics, Chemistry, Mathematics, Biology.",
              onClick: () => {
                setMetadata((current) => ({ ...current, science_group: "pcmb" }));
                setStep("form");
              },
            },
          ]}
        />
      ) : null}

      {step === "form" ? (
        <form className="space-y-3" onSubmit={startSignUp}>
          <label className="grid gap-1.5 text-sm">
            <span>Email address</span>
            <Input
              autoComplete="email"
              className="h-10"
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={emailAddress}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>Password</span>
            <Input
              autoComplete="new-password"
              className="h-10"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
              type="password"
              value={password}
            />
          </label>
          <div id="clerk-captcha" />
          <Button className="h-10 w-full" disabled={!isLoaded || isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form className="space-y-3" onSubmit={verifyEmail}>
          <label className="grid gap-1.5 text-sm">
            <span>Email verification code</span>
            <Input
              autoComplete="one-time-code"
              className="h-10"
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter the code from Clerk"
              required
              value={code}
            />
          </label>
          <Button className="h-10 w-full" disabled={!isLoaded || isSubmitting} type="submit">
            {isSubmitting ? "Verifying..." : "Verify and continue"}
          </Button>
        </form>
      ) : null}

      <Button variant="ghost" className="w-full" onClick={goBack}>
        Back
      </Button>
    </div>
  );
}

function WizardOptions({
  options,
}: {
  options: {
    label: string;
    description: string;
    onClick?: () => void;
    disabled?: boolean;
  }[];
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <Button
          key={option.label}
          variant="outline"
          className="h-auto min-h-16 flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
          disabled={option.disabled}
          onClick={option.onClick}
        >
          <span className="font-medium">{option.label}</span>
          <span className="text-muted-foreground text-xs leading-relaxed">{option.description}</span>
        </Button>
      ))}
    </div>
  );
}

function getClerkErrorMessage(err: unknown) {
  const clerkErrors = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors;
  return clerkErrors?.[0]?.longMessage || clerkErrors?.[0]?.message || "Something went wrong. Please try again.";
}
