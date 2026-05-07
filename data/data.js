/* ============================================================
   data.js — Portfolio data + EmailJS configuration
   EDIT THIS FILE to update content.
   ============================================================ */

const PORTFOLIO_DATA = {
  name: "RISKY",
  tagline: "BUILDING THE FUTURE. ONE LINE AT A TIME.",
  location: "India",
  available: true,

  /* ──────────────────────────────────────────────────────
     EMAIL CONFIG — fill in once, after you set up EmailJS:
       1. Sign up at https://www.emailjs.com (free, 200/month)
       2. Add your Gmail as a service
       3. Create an email template with variables:
            {{from_name}}, {{from_email}}, {{message}},
            {{submitted_at}}, {{user_agent}}
       4. Set the template "To Email" to deeplambhade101@gmail.com
       5. Paste your Public Key, Service ID, Template ID below.
     If left blank, the form falls back to mailto: + localStorage
     so messages are never lost.
  ────────────────────────────────────────────────────────── */
  email: {
    notifyTo:   "deeplambhade101@gmail.com",
    publicKey:  "",   // e.g. "user_xxxxxxxxxxxxxxxx"
    serviceId:  "",   // e.g. "service_abcd1234"
    templateId: ""    // e.g. "template_xyz9876"
  },

  links: {
    github:    "https://github.com/VRDeep101",
    linkedin:  "https://www.linkedin.com/in/risky07",
    whatsapp:  "https://wa.me/917249563744",
    email:     "mailto:sirfrisky07@gmail.com",
    instagram: ""
  },

  // ────── SKILLS WITH REAL LOGOS (devicon CDN) ──────
  skillCategories: [
    {
      id: "webdev", label: "Web Development", color: "#00e5ff",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
      skills: [
        { name: "JavaScript",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
        { name: "TypeScript",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
        { name: "Python",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
        { name: "Java",        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" },
        { name: "C++",         logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" },
        { name: "HTML5",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
        { name: "CSS3",        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" },
        { name: "React",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
        { name: "Next.js",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" },
        { name: "Tailwind",    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
        { name: "Three.js",    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg" },
        { name: "Node.js",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
        { name: "Express",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" },
        { name: "Django",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" },
        { name: "Flask",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg" }
      ]
    },
    {
      id: "aiml", label: "AI & ML", color: "#bf5af2",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
      skills: [
        { name: "TensorFlow",   logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" },
        { name: "PyTorch",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg" },
        { name: "OpenCV",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg" },
        { name: "Pandas",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg" },
        { name: "NumPy",        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg" },
        { name: "OpenAI",       logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
        { name: "Hugging Face", logo: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg" },
        { name: "Claude AI",    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg" }
      ]
    },
    {
      id: "flutter", label: "Flutter", color: "#54d2ef",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
      skills: [
        { name: "Flutter",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
        { name: "Dart",         logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" },
        { name: "React Native", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
        { name: "Firebase",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" },
        { name: "Android",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg" }
      ]
    },
    {
      id: "design", label: "Graphic Designer", color: "#ff9f0a",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      skills: [
        { name: "Figma",         logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" },
        { name: "Photoshop",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg" },
        { name: "Illustrator",   logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg" },
        { name: "After Effects", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg" },
        { name: "Premiere",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg" },
        { name: "Blender",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg" },
        { name: "Canva",         logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg" }
      ]
    },
    {
      id: "hacking", label: "Ethical Hacker", color: "#ff2244",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
      skills: [
        { name: "Kali Linux",  logo: "https://www.kali.org/images/kali-dragon-icon.svg" },
        { name: "Burp Suite",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "Wireshark",   logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wireshark/wireshark-original.svg" },
        { name: "Metasploit",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "Nmap",        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "OWASP",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg" },
        { name: "TryHackMe",   logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "HackTheBox",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" }
      ]
    },
    {
      id: "cyber", label: "CyberSecurity", color: "#ff2244",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
      skills: [
        { name: "Pen Testing",      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "Network Security", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cisco/cisco-original.svg" },
        { name: "OSINT",            logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
        { name: "CTF",              logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg" },
        { name: "Vuln Assessment",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" }
      ]
    },
    {
      id: "agent", label: "AI Agent", color: "#00e5ff",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      skills: [
        { name: "LangChain",   logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
        { name: "AutoGPT",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
        { name: "Claude API",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg" },
        { name: "OpenAI API",  logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
        { name: "MCP",         logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" }
      ]
    },
    {
      id: "freelancer", label: "Freelancer", color: "#00ff88",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
      skills: [
        { name: "Web Projects", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
        { name: "Upwork",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
        { name: "Fiverr",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
        { name: "Client Mgmt",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg" }
      ]
    },
    {
      id: "content", label: "Content Creator", color: "#ff9f0a",
      skills: [
        { name: "Video Editing", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg" },
        { name: "After Effects", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg" },
        { name: "YouTube",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg" },
        { name: "Instagram",     logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg" },
        { name: "Storytelling",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg" }
      ],
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg"
    }
  ],

  // ────── PROJECTS ──────
  projects: [
    {
      id: 1, title: "JARVIS AI",
      description: "Personal AI assistant with voice, vision, memory & real-time awareness. The real one — not a wrapper.",
      tag: "AI / Agent",
      videoSrc: "videos/jarvis.mp4",
      github: "https://github.com/VRDeep101",
      live: "",
      color: "#00e5ff"
    },
    {
      id: 2, title: "Project Alpha",
      description: "Coming soon. Drop your video file in /videos/ folder and update this block.",
      tag: "Web Dev",
      videoSrc: "",
      github: "https://github.com/VRDeep101",
      live: "",
      color: "#ff2244"
    },
    {
      id: 3, title: "Project Beta",
      description: "Coming soon. Cybersecurity tooling — recon, automation, and reporting.",
      tag: "CyberSecurity",
      videoSrc: "",
      github: "https://github.com/VRDeep101",
      live: "",
      color: "#bf5af2"
    }
  ],

  // ────── EXPERIENCE / TIMELINE ──────
  timeline: [
    { year: "2025", title: "Building JARVIS",      desc: "Personal AI system. Voice, vision, memory, agents.", tag: "NOW" },
    { year: "2024", title: "Multi-Skill Operator", desc: "Picked up cybersecurity, ML, and AI agent dev.",     tag: "" },
    { year: "2023", title: "Full Stack Dev",       desc: "React, Node, databases. Real client projects.",      tag: "" },
    { year: "2022", title: "Started Coding",       desc: "First lines of JavaScript. Never looked back.",      tag: "" }
  ]
};

// Expose to window so cross-script access works (const at top level
// of a <script> doesn't auto-attach to window — this is the explicit fix).
window.PORTFOLIO_DATA = PORTFOLIO_DATA;

if (typeof module !== 'undefined') module.exports = PORTFOLIO_DATA;
