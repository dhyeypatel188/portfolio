// Edit this file to make the portfolio yours.
export const PROFILE = {
  name: 'Dhyey Patel',
  role: 'Full-Stack Developer',
  greeting: 'Hello',
  intro: "I'm Dhyey, and I build",
  builds: ['real-time backends.', 'APIs that never sleep.', 'ERPs that run the shop floor.', 'microservices that scale.', 'systems that stay up.'],
  about: [
    'Full-stack developer with production experience in Node.js and NestJS. I maintain 55+ REST APIs at Electrify Services, a live system serving real users every day.',
    'I design microservices with WebSockets and JWT auth, handle production support for 3 live projects, and own the pipeline end to end — from PostgreSQL schema to AWS deployment.',
  ],
  location: 'Ahmedabad, Gujarat',
  email: 'pateldhyey649@gmail.com',
  phone: '+91 7405223326',
  links: [
    { label: 'GitHub', url: 'https://github.com/dhyeypatel188' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/dhyey-patel-3202a922a' },
  ],
};

export const STATS = [
  { value: '55+', label: 'Production REST APIs' },
  { value: '<1s', label: 'Real-time update latency' },
  { value: '−70%', label: 'Deploy time (25 → 5-7 min)' },
  { value: '3', label: 'Live projects supported' },
];

export const SKILLS = [
  { group: 'Languages', items: ['JavaScript', 'TypeScript', 'Python'] },
  { group: 'Backend', items: ['Node.js', 'NestJS', 'REST APIs', 'Microservices', 'WebSockets', 'Socket.IO', 'JWT Auth'] },
  { group: 'Data', items: ['PostgreSQL', 'Prisma ORM', 'MongoDB'] },
  { group: 'Frontend', items: ['React', 'Leaflet.js'] },
  { group: 'Cloud & Tools', items: ['AWS (ECR, ECS)', 'Docker', 'CI/CD', 'Razorpay', 'Git'] },
];

export const PROJECTS = [
  {
    title: 'Food Delivery App',
    year: 'Personal',
    category: 'Microservices',
    description: 'A 5-service platform (Auth, User, Order, Delivery, Restaurant) behind a central API Gateway with JWT. Real-time order tracking over Socket.IO on a live Leaflet.js map, refreshed every 3-5 seconds, with Razorpay payments and a Prisma/Neon PostgreSQL schema answering in under 100ms.',
    tags: ['NestJS', 'Socket.IO', 'PostgreSQL', 'Prisma', 'Razorpay'],
    liveUrl: 'https://testyfoodapp.netlify.app/login',
    repoUrl: 'https://github.com/dhyeypatel188',
  },
  {
    title: 'HR Resume Scanner',
    year: '2025',
    category: 'Internal tool',
    description: 'Matches resumes to job descriptions with TF-IDF ranking (scikit-learn) over PDF, DOCX and TXT input — replacing manual recruiter screening.',
    tags: ['FastAPI', 'React', 'scikit-learn'],
    liveUrl: '',
    repoUrl: '',
  },
  {
    title: 'Print Production ERP',
    year: '2025',
    category: 'ERP system',
    description: 'An ERP for a printing and packaging business. It creates work orders and moves each job through every production stage — plate making, cutting, printing, lamination, folding and more — with tracking at each step. It also handles outsourced stages, and pulls accounting data (parties, items, vouchers) from Tally.',
    tags: ['Work orders', 'Job tracking', 'Outsourcing', 'Tally integration'],
    liveUrl: '',
    repoUrl: '',
  },
];

export const TIMELINE = [
  { when: 'Nov 2024 — Now', title: 'Full-Stack Developer', place: 'Electrify Services', text: 'Intern to full-time. Lead API design and production debugging in a 2-3 person team.' },
  { when: 'Jun — Nov 2024', title: 'Flutter Developer Intern', place: 'JVS Technology', text: 'Shipped 10+ features biweekly; apps used by 200+ readers; 95%+ document-scan accuracy.' },
  { when: '2020 — 2024', title: 'B.E. Computer Science', place: 'Babaria Institute of Technology', text: 'CGPA 8.28.' },
];
