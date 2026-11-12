import { SpecialistAgentDefinition } from '../types';

export const SPECIALIST_AGENTS: SpecialistAgentDefinition[] = [
  {
    id: 'personal-assistant',
    name: 'Personal Assistant Agent',
    nameBn: 'ব্যক্তিগত সহকারী এজেন্ট',
    role: 'Executive Daily Coordinator',
    roleBn: 'দৈনিক কার্যনির্বাহী সমন্বয়কারী',
    description:
      'Manages personal tasks, builds structured daily schedules, summarizes notes, and coordinates general inquiries.',
    descriptionBn:
      'ব্যক্তিগত কাজ পরিচালনা করে, দৈনিক সময়সূচী তৈরি করে এবং তথ্য সংক্ষেপিত করে।',
    capabilities: [
      'Schedule planning',
      'Task prioritization',
      'Executive briefings',
      'Bilingual Q&A',
    ],
    toolPermissions: ['Memory Retrieval', 'Task Planner', 'Conversation Context'],
    systemInstruction:
      'Organize daily priorities, create actionable schedules, and summarize information clearly in English or Bengali.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'research',
    name: 'Research Agent',
    nameBn: 'গবেষণা এজেন্ট',
    role: 'Deep Intelligence & Synthesis',
    roleBn: 'গভীর তথ্য অনুসন্ধান ও বিশ্লেষণ',
    description:
      'Investigates complex topics, compares products and markets with live Google Search grounding, and compiles cited reports.',
    descriptionBn:
      'জটিল বিষয়ে গবেষণা করে, পণ্য ও সেবার তুলনা করে এবং তথ্যসূত্রসহ প্রতিবেদন তৈরি করে।',
    capabilities: [
      'Google Search grounding',
      'Product & market comparison',
      'Source citation',
      'Structured synthesis',
    ],
    toolPermissions: ['Google Search Grounding', 'Document Synthesis', 'Memory Read'],
    systemInstruction:
      'Conduct thorough, objective research with verifiable comparisons and structured sections.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'developer',
    name: 'Developer Agent',
    nameBn: 'ডেভেলপার এজেন্ট',
    role: 'Full-Stack Software Architect',
    roleBn: 'সফটওয়্যার আর্কিটেক্ট ও কোড ইঞ্জিনিয়ার',
    description:
      'Generates production-grade code, debugs runtime errors, conducts security reviews, and scaffolds system architectures.',
    descriptionBn:
      'কোড তৈরি করে, বাগ ফিক্স করে, প্রোগ্রামিং ধারণা ব্যাখ্যা করে এবং সফটওয়্যার আর্কিটেকচার ডিজাইন করে।',
    capabilities: [
      'TypeScript / React / Node.js generation',
      'Root-cause debugging',
      'Security code audit',
      'API schema design',
    ],
    toolPermissions: ['Code Synthesizer', 'Syntax Analyzer', 'Architecture Blueprint'],
    systemInstruction:
      'Write clean, modular, type-safe code and explain architectural trade-offs with clarity.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'designer',
    name: 'Designer Agent',
    nameBn: 'ডিজাইনার এজেন্ট',
    role: 'UI/UX & Brand Systems Director',
    roleBn: 'ইউআই/ইউএক্স ও ব্র্যান্ড ডিরেক্টর',
    description:
      'Creates design briefs, accessible color systems, typographic hierarchies, layout specs, and image-generation prompts.',
    descriptionBn:
      'ক্রিয়েটিভ ডিজাইন ব্রিফ, কালার সিস্টেম, টাইপোগ্রাফি এবং ইমেজ জেনারেশন প্রম্পট তৈরি করে।',
    capabilities: [
      'WCAG color system generation',
      'Typography pairing',
      'Visual prompt engineering',
      'Layout grid architecture',
    ],
    toolPermissions: ['Design System Generator', 'Contrast Calculator', 'Prompt Studio'],
    systemInstruction:
      'Craft distinctive, human-grade visual systems with strict typographic hierarchy and color discipline.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    nameBn: 'মার্কেটিং এজেন্ট',
    role: 'Growth & Campaign Strategist',
    roleBn: 'মার্কেটিং ও ক্যাম্পেইন কৌশলবিদ',
    description:
      'Develops go-to-market strategies, SEO keyword clusters, content calendars, and high-converting campaign copy.',
    descriptionBn:
      'মার্কেটিং কৌশল, সোশ্যাল মিডিয়া কনটেন্ট, কিওয়ার্ড রিসার্চ এবং এসইও পরিকল্পনা তৈরি করে।',
    capabilities: [
      'SEO keyword clustering',
      'Campaign planning',
      'Social copywriting',
      'Audience positioning',
    ],
    toolPermissions: ['Google Search Grounding', 'Campaign Planner', 'Approval Gate (Publishing)'],
    systemInstruction:
      'Build measurable marketing campaigns with clear target personas and channel distribution plans.',
    requiresApprovalForExternal: true,
  },
  {
    id: 'business',
    name: 'Business Agent',
    nameBn: 'বিজনেস এজেন্ট',
    role: 'Strategy & Venture Analyst',
    roleBn: 'ব্যবসায়িক বিশ্লেষক ও পরামর্শক',
    description:
      'Analyzes business models, prepares investor-grade proposals, evaluates competitors, and models unit economics.',
    descriptionBn:
      'ব্যবসায়িক আইডিয়া বিশ্লেষণ করে, বিজনেস প্ল্যান, প্রপোজাল এবং প্রতিযোগীদের তথ্য প্রস্তুত করে।',
    capabilities: [
      'Business plan drafting',
      'Competitor matrix',
      'Proposal structuring',
      'Risk & opportunity audit',
    ],
    toolPermissions: ['Market Grounding', 'Financial Modeler', 'Document Builder'],
    systemInstruction:
      'Deliver rigorous commercial analysis, unit economics breakdowns, and actionable strategic proposals.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'communication',
    name: 'Communication Agent',
    nameBn: 'কমিউনিকেশন এজেন্ট',
    role: 'Executive Correspondence Lead',
    roleBn: 'পেশাদার যোগাযোগ ও ইমেইল বিশেষজ্ঞ',
    description:
      'Drafts executive emails, diplomatic stakeholder messages, and thread summaries. Requires approval before external dispatch.',
    descriptionBn:
      'পেশাদার ইমেইল ও বার্তা প্রস্তুত করে এবং যোগাযোগ সংক্ষেপিত করে। বাহ্যিক প্রেরণের আগে অনুমোদন নেয়।',
    capabilities: [
      'Executive email drafting',
      'Stakeholder updates',
      'Thread summarization',
      'Approval-gated dispatch',
    ],
    toolPermissions: ['Draft Composer', 'Approval Center Gate'],
    systemInstruction:
      'Draft clear, diplomatic communications and route any external dispatch request to the Approval Center.',
    requiresApprovalForExternal: true,
  },
  {
    id: 'document',
    name: 'Document Agent',
    nameBn: 'ডকুমেন্ট এজেন্ট',
    role: 'Knowledge & Report Architect',
    roleBn: 'প্রতিবেদন ও ডকুমেন্ট প্রস্তুতকারক',
    description:
      'Generates structured formal reports, SOPs, and executive summaries from uploaded files and multi-agent research.',
    descriptionBn:
      'আপলোড করা ফাইল সংক্ষেপিত করে এবং সুসংগঠিত প্রতিবেদন ও ডকুমেন্ট তৈরি করে।',
    capabilities: [
      'Uploaded file summarization',
      'Formal report generation',
      'Knowledge structuring',
      'SOP authoring',
    ],
    toolPermissions: ['File Content Reader', 'Report Formatter', 'Memory Indexer'],
    systemInstruction:
      'Transform raw notes, research, and uploaded files into publication-ready structured documents.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst Agent',
    nameBn: 'ডেটা অ্যানালিস্ট এজেন্ট',
    role: 'Quantitative Insights Specialist',
    roleBn: 'ডেটা ও পরিসংখ্যান বিশ্লেষক',
    description:
      'Analyzes CSV and tabular datasets, extracts statistical anomalies, computes KPIs, and summarizes quantitative trends.',
    descriptionBn:
      'সিএসভি ও স্প্রেডশিট ডেটা বিশ্লেষণ করে, ইনসাইট তৈরি করে এবং ডেটাসেট সংক্ষেপিত করে।',
    capabilities: [
      'CSV & dataset parsing',
      'KPI & trend extraction',
      'Anomaly detection',
      'Quantitative reporting',
    ],
    toolPermissions: ['Dataset Parser', 'Statistical Summarizer'],
    systemInstruction:
      'Examine datasets with quantitative precision, stating exact units, sample sizes, and key takeaways.',
    requiresApprovalForExternal: false,
  },
  {
    id: 'automation',
    name: 'Automation Agent',
    nameBn: 'অটোমেশন এজেন্ট',
    role: 'n8n & API Pipeline Engineer',
    roleBn: 'ওয়ার্কফ্লো ও এপিআই অটোমেশন ইঞ্জিনিয়ার',
    description:
      'Designs automation workflows, connects to configured n8n webhooks, and monitors execution payloads with approval safeguards.',
    descriptionBn:
      'অটোমেশন প্ল্যান তৈরি করে, কনফিগার করা এপিআই ও n8n ওয়ার্কফ্লো ট্রিগার এবং মনিটর করে।',
    capabilities: [
      'n8n webhook orchestration',
      'REST payload design',
      'Workflow error recovery',
      'Approval-gated execution',
    ],
    toolPermissions: ['n8n Webhook Proxy', 'Approval Center Gate', 'Activity Logger'],
    systemInstruction:
      'Design resilient automation workflows and verify human approval before mutating external systems.',
    requiresApprovalForExternal: true,
  },
];
