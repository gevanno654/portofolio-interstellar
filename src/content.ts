/* ————————————————————————————————————————————————
   content.ts · SATU-SATUNYA file yang perlu disentuh
   untuk mengganti identitas, teks, dan daftar proyek.

   Semua nilai string di bawah ini PLACEHOLDER yang
   ditandai TODO — ganti dengan data asli. Struktur
   (nama field, bentuk array) JANGAN diubah karena
   komponen membaca field-field ini.
   ———————————————————————————————————————————————— */

export const site = {
  // TODO: picks — dipakai di <title>, nav, footer
  name: "GevannoYoh",
  initials: "GY",
  role: "Creative Developer",
  // TODO: satu kalimat spesialisasi, mis. "front-end engineer …"
  specialty: "Front-end engineer & interactive experiences",
  // TODO: deskripsi hero 1–2 kalimat
  heroLede:
    "I build interfaces that feel like places — cinematic, spatial, and precise. Currently charting a course through the modern web.",
  email: "hello@gevannoyoh.dev", // TODO: ganti email asli
  location: "Indonesia", // TODO: ganti kota / hapus bila tak perlu
  availability: "Open for collaboration", // TODO: status ketersediaan
};

export const socials = [
  { label: "GitHub", href: "https://github.com/", handle: "@gevannoyoh" }, // TODO: URL profil
  { label: "LinkedIn", href: "https://linkedin.com/", handle: "/in/gevannoyoh" }, // TODO: URL profil
  { label: "Resume", href: "#", handle: "PDF" }, // TODO: tautan CV / hapus entri
] as const;

export const about = {
  // Headline di-hardcode di About.tsx (mask+Chars per huruf) — bukan dari
  // content agar struktur span tak bocor ke data. Tag transmission dihapus.
  // Teks utama: bio + quotes (per permintaan user).
  subtitle:
    "I am a Computer Science graduate with experience in designing and developing websites, Android apps and desktop applications. Driven by a keen sense of curiosity, I always strive to explore and learn new things.",
  quote:
    "Limitations are a gift from God, so always be grateful and look for solutions!",
  // TODO: tulis 2 paragraf bio asli — latar, pendidikan, minat
  body: [
    "TODO — Paragraf 1: siapa Anda, latar belakang pendidikan, dan bagaimana Anda sampai di pengembangan web. 3–5 kalimat.",
    "TODO — Paragraf 2: minat dan fokus teknologi saat ini — apa yang sedang dipelajari, ke arah mana ingin berkembang. 2–4 kalimat.",
  ],
  facts: [
    { k: "Origin", v: "TODO — kota / negara" },
    { k: "Education", v: "TODO — jurusan, kampus, tahun" },
    { k: "Focus", v: "TODO — mis. creative front-end, WebGL" },
    { k: "Orbit", v: "TODO — mis. open-source, freelance, full-time" },
  ],
};

export type WhatIDoItem = {
  id: string;
  index: "01" | "02" | "03";
  title: string;
  lede: string;
  items: string[];
};

export const whatIDo: WhatIDoItem[] = [
  {
    id: "develop",
    index: "01",
    title: "Develop",
    lede: "I build interfaces that feel like places — cinematic, spatial, and precise.",
    items: ["React", "Vite", "GSAP", "Three.js", "TODO — tambah/hapus"],
  },
  {
    id: "design",
    index: "02",
    title: "Design",
    lede: "TODO — satu kalimat pendekatan desain: layout, tipografi, motion.",
    items: ["TODO — mis. Figma", "TODO — mis. Design system"],
  },
  {
    id: "broadcast",
    index: "03",
    title: "Operator Broadcast",
    lede: "TODO — satu kalimat pengalaman operator broadcast / live production.",
    items: ["TODO — mis. OBS", "TODO — mis. Live switching"],
  },
];

export const skillGroups = [
  {
    id: "languages",
    index: "SYS.01",
    title: "Programming Languages",
    items: ["TypeScript", "JavaScript", "HTML5", "CSS3", "TODO — tambah/hapus"],
  },
  {
    id: "frontend",
    index: "SYS.02",
    title: "Frontend Development",
    items: ["React", "Vite", "GSAP", "Three.js", "TODO — tambah/hapus"],
  },
  {
    id: "backend",
    index: "SYS.03",
    title: "Backend Development",
    items: ["Node.js", "TODO — tambah/hapus"],
  },
  {
    id: "database",
    index: "SYS.04",
    title: "Database",
    items: ["TODO — mis. PostgreSQL", "TODO — mis. MongoDB"],
  },
  {
    id: "tools",
    index: "SYS.05",
    title: "Tools & Technologies",
    items: ["Git", "Figma", "TODO — tambah/hapus"],
  },
] as const;

export type Project = {
  slug: string;
  index: string;
  title: string;
  description: string;
  stack: string[];
  year: string;
  github?: string;
  live?: string;
  layout: "bleed" | "split" | "index";
};

export const projects: Project[] = [
  {
    slug: "todo-project-1",
    index: "D-01",
    title: "TODO — Project Title One",
    description:
      "TODO — 2–3 kalimat: masalah apa yang diselesaikan, peran Anda, dan hal paling menarik dari proyek ini.",
    stack: ["React", "TypeScript", "TODO"],
    year: "2025",
    github: "https://github.com/",
    live: undefined,
    layout: "bleed",
  },
  {
    slug: "todo-project-2",
    index: "D-02",
    title: "TODO — Project Title Two",
    description: "TODO — 2–3 kalimat deskripsi proyek kedua.",
    stack: ["TODO"],
    year: "2024",
    github: "https://github.com/",
    live: undefined,
    layout: "split",
  },
  {
    slug: "todo-project-3",
    index: "D-03",
    title: "TODO — Project Title Three",
    description: "TODO — 2–3 kalimat deskripsi proyek ketiga.",
    stack: ["TODO"],
    year: "2024",
    github: undefined,
    live: undefined,
    layout: "index",
  },
];

export type JourneyEntry = {
  period: string;
  coord: string;
  title: string;
  org: string;
  detail: string;
};

export const journey: JourneyEntry[] = [
  {
    period: "TODO — 2021 → 2025",
    coord: "T+00.0",
    title: "TODO — Gelar / posisi",
    org: "TODO — Universitas / perusahaan",
    detail: "TODO — 1–2 kalimat: fokus studi, pencapaian, atau tanggung jawab.",
  },
  {
    period: "TODO — 2023",
    coord: "T+01.4",
    title: "TODO — Magang / sertifikasi",
    org: "TODO — Organisasi",
    detail: "TODO — 1–2 kalimat penjelasan.",
  },
  {
    period: "TODO — 2024",
    coord: "T+02.7",
    title: "TODO — Pengalaman / pencapaian",
    org: "TODO — Organisasi",
    detail: "TODO — 1–2 kalimat penjelasan.",
  },
];

export const closing = {
  tag: "05 // Beyond",
  headline: "Beyond the horizon, another conversation begins.",
  // TODO: kalimat penutup personal 1–2 kalimat
  note: "TODO — mis. Saya selalu tertarik pada proyek yang berani secara visual dan jujur secara teknis. Sapa saya.",
};
