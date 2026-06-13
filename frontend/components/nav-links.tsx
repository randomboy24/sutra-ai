import type { LinkItemType } from "@/components/sheard";
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Calendar, 
  Users, 
  Star, 
  Handshake, 
  FileText, 
  Shield, 
  RotateCcw, 
  HelpCircle,
  Award
} from "lucide-react";

export const productLinks: LinkItemType[] = [
	{
		label: "AI Mentor Teacher",
		href: "#features",
		description: "24/7 personalized tutor that understands student style",
		icon: (
			<Sparkles />
		),
	},
	{
		label: "Weakness Diagnostician",
		href: "#features",
		description: "Detects root-cause conceptual gaps automatically",
		icon: (
			<Search />
		),
	},
	{
		label: "Autonomous Study Planner",
		href: "#features",
		description: "Nightly syllabus adjustments & study sheets",
		icon: (
			<Calendar />
		),
	},
	{
		label: "AI Intervention Engine",
		href: "#features",
		description: "Proactive tracking and custom student follow ups",
		icon: (
			<RotateCcw />
		),
	},
	{
		label: "Adaptive Exam Simulator",
		href: "#features",
		description: "Practice exams starting easier and shifting harder",
		icon: (
			<BookOpen />
		),
	},
	{
		label: "AI Paper Evaluator",
		href: "#features",
		description: "Grades written paper PDFs based on Board rubrics",
		icon: (
			<Award />
		),
	},
];

export const companyLinks: LinkItemType[] = [
	{
		label: "About Sutra AI",
		href: "#",
		description: "Learn about our vision to personalize learning",
		icon: (
			<Users />
		),
	},
	{
		label: "Success Stories",
		href: "#testimonials",
		description: "Real feedback from students, teachers and parents",
		icon: (
			<Star />
		),
	},
	{
		label: "Institution Onboarding",
		href: "#contact",
		icon: (
			<Handshake />
		),
		description: "Connect your school, board, or coaching center",
	},
];

export const companyLinks2: LinkItemType[] = [
	{
		label: "Terms of Service",
		href: "#",
		icon: (
			<FileText />
		),
	},
	{
		label: "Privacy Policy",
		href: "#",
		icon: (
			<Shield />
		),
	},
	{
		label: "Refund Policy",
		href: "#",
		icon: (
			<RotateCcw />
		),
	},
	{
		label: "Help Center",
		href: "#faq",
		icon: (
			<HelpCircle />
		),
	},
];
