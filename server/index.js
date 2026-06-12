import express from "express";
import http from "http";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGINS = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

// Debug log
console.log("Allowed origins:", CLIENT_ORIGINS);
const JWT_SECRET = process.env.JWT_SECRET || "joinskill-local-secret-change-me";
const dataFile = path.join(__dirname, "data", "db.json");
const uploadDir = path.join(__dirname, "uploads");
const id = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});
const corsOptions = {
  origin: true,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "6mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadDir));

const skillAliases = {
  react: ["react", "react.js", "reactjs"],
  node: ["node", "node.js", "nodejs", "express"],
  python: ["python", "django", "flask"],
  machinelearning: ["machine learning", "ml", "ai", "artificial intelligence"],
  dataanalytics: ["data analytics", "data analysis", "analytics", "sql"],
  uiux: ["ui", "ux", "ui/ux", "product design", "figma"]
};

const trendingSkills = [
  { name: "Generative AI", growth: 92, category: "AI" },
  { name: "React.js", growth: 88, category: "Frontend" },
  { name: "Prompt Engineering", growth: 84, category: "AI" },
  { name: "Node.js", growth: 78, category: "Backend" },
  { name: "Data Analytics", growth: 76, category: "Data" },
  { name: "Cloud Fundamentals", growth: 71, category: "Cloud" }
];

const skillGraph = {
  "React.js": ["TypeScript", "Next.js", "Redux Toolkit", "Testing Library", "Node.js"],
  "Node.js": ["Express.js", "MongoDB", "API Security", "Socket.IO", "System Design"],
  "Python": ["Data Analytics", "Machine Learning", "FastAPI", "Automation", "Django"],
  "Machine Learning": ["Python", "Data Analytics", "MLOps", "Generative AI", "Vector Databases"],
  "UI/UX Design": ["Figma", "Design Systems", "User Research", "Frontend Basics", "Accessibility"],
  "Data Analytics": ["SQL", "Python", "Power BI", "Statistics", "Machine Learning"],
  "Cloud Fundamentals": ["Docker", "Kubernetes", "AWS", "DevOps", "Linux"]
};

const testBanks = {
  react: {
    displayName: "React.js",
    questions: [
      {
        question: "Which React hook is used to manage local component state?",
        options: ["useEffect", "useMemo", "useState", "useRef"],
        answerIndex: 2
      },
      {
        question: "What should be used as a stable identity when rendering a list?",
        options: ["key", "className", "placeholder", "data-index"],
        answerIndex: 0
      },
      {
        question: "Which pattern passes data from parent to child?",
        options: ["Props", "Reducers", "Portals", "Fragments"],
        answerIndex: 0
      },
      {
        question: "What does useEffect commonly handle?",
        options: ["Side effects", "CSS parsing", "JSX transpiling", "Route compilation"],
        answerIndex: 0
      },
      {
        question: "Which concept avoids unnecessary recalculation?",
        options: ["Memoization", "Hydration only", "Hoisting CSS", "Polling"],
        answerIndex: 0
      }
    ]
  },
  node: {
    displayName: "Node.js",
    questions: [
      {
        question: "What runtime does Node.js use to execute JavaScript outside the browser?",
        options: ["V8", "Blink", "Gecko", "WebKit"],
        answerIndex: 0
      },
      {
        question: "Which package is commonly used to build HTTP APIs in Node.js?",
        options: ["Express", "Pandas", "NumPy", "Redux"],
        answerIndex: 0
      },
      {
        question: "Which object contains route parameters in Express?",
        options: ["req.params", "req.filesOnly", "res.params", "app.params"],
        answerIndex: 0
      },
      {
        question: "Which model helps Node.js handle many concurrent I/O operations?",
        options: ["Event loop", "DOM tree", "Sprite loop", "Paint cycle"],
        answerIndex: 0
      },
      {
        question: "What status code usually means a request succeeded and created a resource?",
        options: ["201", "301", "401", "503"],
        answerIndex: 0
      }
    ]
  },
  python: {
    displayName: "Python",
    questions: [
      {
        question: "Which Python data type stores key-value pairs?",
        options: ["list", "tuple", "dict", "set"],
        answerIndex: 2
      },
      {
        question: "Which keyword defines a function in Python?",
        options: ["def", "fn", "function", "method"],
        answerIndex: 0
      },
      {
        question: "Which library is widely used for dataframes?",
        options: ["Pandas", "Socket.IO", "Vite", "JWT"],
        answerIndex: 0
      },
      {
        question: "What does pip manage?",
        options: ["Python packages", "Git branches", "CSS variables", "Browser tabs"],
        answerIndex: 0
      },
      {
        question: "Which statement handles exceptions?",
        options: ["try/except", "catch/final", "rescue/error", "guard/fail"],
        answerIndex: 0
      }
    ]
  },
  machinelearning: {
    displayName: "Machine Learning",
    questions: [
      {
        question: "Which task predicts a numeric value?",
        options: ["Regression", "Clustering", "Tokenization", "Hashing"],
        answerIndex: 0
      },
      {
        question: "What is overfitting?",
        options: ["Performing well on training data but poorly on new data", "Using too little memory", "Skipping model evaluation", "Removing all features"],
        answerIndex: 0
      },
      {
        question: "Which metric is common for classification?",
        options: ["Accuracy", "FPS", "Latency only", "Bundle size"],
        answerIndex: 0
      },
      {
        question: "Which split evaluates model generalization?",
        options: ["Test set", "CSS set", "Route set", "Asset set"],
        answerIndex: 0
      },
      {
        question: "What is a feature?",
        options: ["An input variable used by a model", "A server process", "A button style", "A DNS record"],
        answerIndex: 0
      }
    ]
  },
  dataanalytics: {
    displayName: "Data Analytics",
    questions: [
      {
        question: "Which SQL clause filters rows before grouping?",
        options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
        answerIndex: 0
      },
      {
        question: "What does a pivot table primarily do?",
        options: ["Summarises and aggregates data", "Deletes duplicate rows", "Creates scatter plots only", "Runs regression models"],
        answerIndex: 0
      },
      {
        question: "Which Python library is most used for dataframes?",
        options: ["Pandas", "Socket.IO", "Express", "Vite"],
        answerIndex: 0
      },
      {
        question: "What does ETL stand for?",
        options: ["Extract, Transform, Load", "Edit, Test, Launch", "Export, Tag, Link", "Evaluate, Train, Log"],
        answerIndex: 0
      },
      {
        question: "Which chart type best shows a distribution of values?",
        options: ["Histogram", "Pie chart only", "Scatter without axes", "Bar with one bar"],
        answerIndex: 0
      }
    ]
  },
  uiux: {
    displayName: "UI/UX Design",
    questions: [
      {
        question: "What does a user persona represent?",
        options: ["A target user archetype", "A database table", "A CSS framework", "A browser API"],
        answerIndex: 0
      },
      {
        question: "Which practice checks whether users can complete tasks?",
        options: ["Usability testing", "Minification", "Hashing", "Dependency injection"],
        answerIndex: 0
      },
      {
        question: "Which tool is commonly used for interface design?",
        options: ["Figma", "MongoDB", "Nginx", "NumPy"],
        answerIndex: 0
      },
      {
        question: "What does accessibility improve?",
        options: ["Use by people with different abilities", "Only server speed", "Only password length", "Only image resolution"],
        answerIndex: 0
      },
      {
        question: "What is a design system?",
        options: ["Reusable design rules and components", "A network protocol", "A data backup", "A compiler"],
        answerIndex: 0
      }
    ]
  }
};

function genericTestBank(skill) {
  return {
    displayName: displaySkillName(skill),
    questions: [
      {
        question: "What is the first step before teaching a topic to someone else?",
        options: ["Understand the learner goal", "Skip examples", "Hide prerequisites", "Avoid practice"],
        answerIndex: 0
      },
      {
        question: "Which signal best shows practical skill strength?",
        options: ["Projects and clear explanations", "Only a long title", "A random keyword", "Unrelated tools"],
        answerIndex: 0
      },
      {
        question: "What should a mentor do after a session?",
        options: ["Suggest focused next steps", "Delete notes", "Ignore questions", "Change the topic"],
        answerIndex: 0
      },
      {
        question: "What improves peer learning quality?",
        options: ["Specific feedback", "Vague praise only", "No examples", "No goals"],
        answerIndex: 0
      },
      {
        question: "Which habit supports long-term learning?",
        options: ["Small consistent practice", "One giant session only", "No review", "Memorizing passwords"],
        answerIndex: 0
      }
    ]
  };
}

function testBankFor(skill) {
  return testBanks[getSkillKey(skill)] || genericTestBank(skill);
}

function now() {
  return new Date().toISOString();
}

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getSkillKey(value = "") {
  const normalized = normalizeText(value);
  const found = Object.entries(skillAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizeText(alias) === normalized)
  );

  return found?.[0] || normalized;
}

function displaySkillName(value = "") {
  const key = getSkillKey(value);
  const bank = testBanks[key];
  if (bank) {
    return bank.displayName;
  }

  const graphName = Object.keys(skillGraph).find((skill) => normalizeText(skill) === key);
  if (graphName) {
    return graphName;
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function skillMatches(skillName, query) {
  if (!query) {
    return true;
  }

  const skillKey = getSkillKey(skillName);
  const queryKey = getSkillKey(query);
  return skillKey.includes(queryKey) || queryKey.includes(skillKey);
}

function profileDefaults(username) {
  return {
    fullName: username,
    photoUrl: "",
    linkedinId: "",
    interests: [],
    targetSkills: [],
    skills: [],
    experience: "",
    description: "",
    availability: "Weekends",
    rating: 0,
    sessionsCompleted: 0,
    certificates: []
  };
}

function calculateProfileScore(profile = {}) {
  let score = 0;
  if (profile.photoUrl) score += 10;
  if (profile.fullName && profile.fullName.length >= 3) score += 10;
  if (profile.linkedinId) score += 10;
  if ((profile.interests || []).length >= 3) score += 12;
  if ((profile.targetSkills || []).length >= 2) score += 8;
  if ((profile.skills || []).length >= 2) score += 18;
  if ((profile.description || "").length >= 80) score += 14;
  if (profile.experience) score += 8;
  if ((profile.skills || []).some((skill) => skill.certifiedToTeach)) score += 10;
  return Math.min(score, 100);
}

function profileTips(profile = {}) {
  const tips = [];
  if (!profile.photoUrl) tips.push("Add a profile photo");
  if (!profile.linkedinId) tips.push("Add your LinkedIn ID");
  if ((profile.interests || []).length < 3) tips.push("Add at least three interests");
  if ((profile.skills || []).length < 2) tips.push("Add two or more skills");
  if ((profile.description || "").length < 80) tips.push("Expand About Me");
  if (!(profile.skills || []).some((skill) => skill.certifiedToTeach)) tips.push("Pass one skill test");
  return tips.slice(0, 4);
}

function safeUser(user) {
  const { passwordHash, ...publicUser } = user;
  return {
    ...publicUser,
    profileScore: calculateProfileScore(user.profile)
  };
}

function publicUsers(db, excludeUserId) {
  return db.users
    .filter((user) => user.id !== excludeUserId)
    .map((user) => safeUser(user));
}

function countOverlap(a = [], b = []) {
  const aKeys = new Set(a.map(getSkillKey));
  return b.reduce((count, item) => count + (aKeys.has(getSkillKey(item)) ? 1 : 0), 0);
}

function candidateScore(currentUser, candidate, query = "", intent = "learn") {
  const profile = candidate.profile;
  const skills = profile.skills || [];
  const matchingSkills = skills.filter((skill) => skillMatches(skill.name, query));
  const certifiedMatch = matchingSkills.some((skill) => skill.certifiedToTeach);
  const skillMatch = matchingSkills.length > 0;
  const interestMatch = (profile.interests || []).some((interest) => skillMatches(interest, query));
  const targetMatch = (profile.targetSkills || []).some((skill) => skillMatches(skill, query));
  let score = 30;

  if (query) {
    if (intent === "learn") {
      if (certifiedMatch) score += 38;
      else if (skillMatch) score += 24;
      if (interestMatch) score += 8;
    } else {
      if (targetMatch || interestMatch) score += 36;
      if (skillMatch) score += 12;
    }
  }

  score += Math.min(12, countOverlap(currentUser.profile?.interests, profile.interests) * 4);
  score += Math.min(10, countOverlap(currentUser.profile?.skills?.map((skill) => skill.name), profile.targetSkills) * 5);
  score += Math.min(10, Math.round((profile.rating || 0) * 2));
  score += Math.min(8, Math.round((profile.sessionsCompleted || 0) / 2));

  return Math.min(score, 99);
}

function decorateCandidate(currentUser, user, query = "", intent = "learn") {
  return {
    ...safeUser(user),
    matchScore: candidateScore(currentUser, user, query, intent),
    matchingSkills: (user.profile.skills || []).filter((skill) => skillMatches(skill.name, query)),
    canTeachQuery: (user.profile.skills || []).some((skill) => skillMatches(skill.name, query) && skill.certifiedToTeach)
  };
}

function getSkillRecommendations(user) {
  const profile = user.profile || {};
  const owned = new Set((profile.skills || []).map((skill) => getSkillKey(skill.name)));
  const targets = new Set((profile.targetSkills || []).map(getSkillKey));
  const recommendations = [];

  for (const skill of profile.skills || []) {
    const related = skillGraph[displaySkillName(skill.name)] || skillGraph[skill.name] || [];
    for (const next of related) {
      const nextKey = getSkillKey(next);
      if (!owned.has(nextKey) && !targets.has(nextKey)) {
        recommendations.push({
          name: next,
          reason: `Builds on ${displaySkillName(skill.name)}`,
          confidence: 82
        });
      }
    }
  }

  for (const trend of trendingSkills) {
    const trendKey = getSkillKey(trend.name);
    if (!owned.has(trendKey) && !targets.has(trendKey)) {
      recommendations.push({
        name: trend.name,
        reason: `${trend.category} demand is rising`,
        confidence: Math.min(96, trend.growth)
      });
    }
  }

  const unique = new Map();
  for (const item of recommendations) {
    if (!unique.has(getSkillKey(item.name))) {
      unique.set(getSkillKey(item.name), item);
    }
  }

  return Array.from(unique.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

function recommendPeople(db, currentUser) {
  return db.users
    .filter((user) => user.id !== currentUser.id)
    .map((user) => {
      const desiredSkills = currentUser.profile?.targetSkills || currentUser.profile?.interests || [];
      const strongestQuery = desiredSkills[0] || "";
      return decorateCandidate(currentUser, user, strongestQuery, "learn");
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

function conversationView(db, conversation, viewerId) {
  const participantId = conversation.participants.find((participant) => participant !== viewerId);
  const participant = db.users.find((user) => user.id === participantId);

  return {
    ...conversation,
    participant: participant ? safeUser(participant) : null,
    unread: 0
  };
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createSeedData() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const createdAt = now();
  const users = [
    {
      id: "u_demo",
      username: "demo",
      passwordHash,
      createdAt,
      profile: {
        fullName: "Demo Learner",
        photoUrl: "",
        linkedinId: "linkedin.com/in/demo-learner",
        interests: ["React.js", "Machine Learning", "UI/UX Design"],
        targetSkills: ["Node.js", "Generative AI"],
        skills: [
          { name: "Python", level: "Intermediate", years: 2, testScore: 78, certifiedToTeach: true },
          { name: "Data Analytics", level: "Intermediate", years: 1, testScore: 74, certifiedToTeach: true }
        ],
        experience: "Built analytics dashboards and student project tools.",
        description:
          "I enjoy learning with peers, exchanging structured notes, and turning small projects into repeatable practice sessions. I can help beginners with Python and data workflows.",
        availability: "Evenings",
        rating: 4.7,
        sessionsCompleted: 18,
        certificates: [
          { id: "cert_demo_python", skill: "Python", score: 78, issuedAt: createdAt },
          { id: "cert_demo_data", skill: "Data Analytics", score: 74, issuedAt: createdAt }
        ]
      }
    },
    {
      id: "u_aria",
      username: "aria",
      passwordHash,
      createdAt,
      profile: {
        fullName: "Aria Mehta",
        photoUrl: "",
        linkedinId: "linkedin.com/in/ariamehta",
        interests: ["Frontend", "Design Systems", "Mentoring"],
        targetSkills: ["Machine Learning", "Node.js"],
        skills: [
          { name: "React.js", level: "Advanced", years: 4, testScore: 94, certifiedToTeach: true },
          { name: "UI/UX Design", level: "Advanced", years: 3, testScore: 88, certifiedToTeach: true }
        ],
        experience: "Frontend engineer with product-design experience.",
        description:
          "I help learners move from component basics to production-ready React patterns, accessibility, and design system thinking through project-based sessions.",
        availability: "Weekends",
        rating: 4.9,
        sessionsCompleted: 42,
        certificates: [
          { id: "cert_aria_react", skill: "React.js", score: 94, issuedAt: createdAt },
          { id: "cert_aria_uiux", skill: "UI/UX Design", score: 88, issuedAt: createdAt }
        ]
      }
    },
    {
      id: "u_kabir",
      username: "kabir",
      passwordHash,
      createdAt,
      profile: {
        fullName: "Kabir Anand",
        photoUrl: "",
        linkedinId: "linkedin.com/in/kabiranand",
        interests: ["APIs", "Cloud Fundamentals", "System Design"],
        targetSkills: ["React.js", "UI/UX Design"],
        skills: [
          { name: "Node.js", level: "Advanced", years: 5, testScore: 91, certifiedToTeach: true },
          { name: "Cloud Fundamentals", level: "Intermediate", years: 2, testScore: 82, certifiedToTeach: true }
        ],
        experience: "Backend developer focused on real-time products.",
        description:
          "I teach API design, authentication, Socket.IO workflows, and deployment fundamentals. I like clear examples and short practice tasks between sessions.",
        availability: "Late evenings",
        rating: 4.8,
        sessionsCompleted: 36,
        certificates: [
          { id: "cert_kabir_node", skill: "Node.js", score: 91, issuedAt: createdAt },
          { id: "cert_kabir_cloud", skill: "Cloud Fundamentals", score: 82, issuedAt: createdAt }
        ]
      }
    },
    {
      id: "u_mira",
      username: "mira",
      passwordHash,
      createdAt,
      profile: {
        fullName: "Mira Shah",
        photoUrl: "",
        linkedinId: "linkedin.com/in/mirashah",
        interests: ["AI", "Data Analytics", "Career Projects"],
        targetSkills: ["React.js", "Node.js"],
        skills: [
          { name: "Machine Learning", level: "Advanced", years: 3, testScore: 90, certifiedToTeach: true },
          { name: "Python", level: "Advanced", years: 5, testScore: 93, certifiedToTeach: true }
        ],
        experience: "ML mentor and data science project reviewer.",
        description:
          "I guide students through ML foundations, model evaluation, and portfolio projects. My sessions combine concept checks with code review and next-step planning.",
        availability: "Mornings",
        rating: 4.9,
        sessionsCompleted: 51,
        certificates: [
          { id: "cert_mira_ml", skill: "Machine Learning", score: 90, issuedAt: createdAt },
          { id: "cert_mira_python", skill: "Python", score: 93, issuedAt: createdAt }
        ]
      }
    }
  ];

  return {
    users,
    conversations: [
      {
        id: "c_demo_aria",
        participants: ["u_demo", "u_aria"],
        createdAt,
        updatedAt: createdAt,
        lastMessage: {
          text: "Happy to pair on React components this weekend.",
          senderId: "u_aria",
          createdAt
        }
      }
    ],
    messages: [
      {
        id: "m_seed_1",
        conversationId: "c_demo_aria",
        senderId: "u_aria",
        text: "Happy to pair on React components this weekend.",
        createdAt
      }
    ],
    videoSessions: []
  };
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });

  if (!(await pathExists(dataFile))) {
    const seed = await createSeedData();
    await fs.writeFile(dataFile, JSON.stringify(seed, null, 2), "utf8");
  }
}

async function readDB() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeDB(db) {
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2), "utf8");
}

function issueToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = await readDB();
    const user = db.users.find((item) => item.id === payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User account was not found." });
    }

    req.db = db;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

const storage = multer.diskStorage({
  destination: async (req, file, callback) => {
    await fs.mkdir(uploadDir, { recursive: true });
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname || ".jpg") || ".jpg";
    callback(null, `${req.user.id}-${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed."));
      return;
    }

    callback(null, true);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "JoinSkill API", timestamp: now() });
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!username || password.length < 6) {
    return res.status(400).json({ message: "Username and a 6 character password are required." });
  }

  const db = await readDB();
  if (db.users.some((user) => user.username.toLowerCase() === username)) {
    return res.status(409).json({ message: "That username is already registered." });
  }

  const user = {
    id: `u_${id()}`,
    username,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: now(),
    profile: profileDefaults(username)
  };

  db.users.push(user);
  await writeDB(db);

  res.status(201).json({ token: issueToken(user), user: safeUser(user) });
});

app.post("/api/auth/signin", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const db = await readDB();
  const user = db.users.find((item) => item.username.toLowerCase() === username);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  res.json({ token: issueToken(user), user: safeUser(user) });
});

app.get("/api/profile/me", auth, async (req, res) => {
  res.json({ user: safeUser(req.user), tips: profileTips(req.user.profile) });
});

app.put("/api/profile/me", auth, async (req, res) => {
  const { user, db } = req;
  const existingSkills = new Map((user.profile.skills || []).map((skill) => [getSkillKey(skill.name), skill]));
  const incomingSkills = Array.isArray(req.body.skills) ? req.body.skills : [];

  const normalizedSkills = incomingSkills
    .map((skill) => {
      if (typeof skill === "string") {
        const previous = existingSkills.get(getSkillKey(skill));
        return {
          name: displaySkillName(skill),
          level: previous?.level || "Beginner",
          years: previous?.years || 0,
          testScore: previous?.testScore ?? null,
          certifiedToTeach: previous?.certifiedToTeach || false
        };
      }

      const previous = existingSkills.get(getSkillKey(skill.name));
      return {
        name: displaySkillName(skill.name),
        level: skill.level || previous?.level || "Beginner",
        years: Number(skill.years || previous?.years || 0),
        testScore: previous?.testScore ?? skill.testScore ?? null,
        certifiedToTeach: previous?.certifiedToTeach ?? skill.certifiedToTeach ?? false
      };
    })
    .filter((skill) => skill.name);

  user.profile = {
    ...user.profile,
    fullName: String(req.body.fullName || user.profile.fullName || user.username).trim(),
    linkedinId: String(req.body.linkedinId || "").trim(),
    interests: normalizeArray(req.body.interests),
    targetSkills: normalizeArray(req.body.targetSkills),
    skills: normalizedSkills,
    experience: String(req.body.experience || "").trim(),
    description: String(req.body.description || "").trim(),
    availability: String(req.body.availability || user.profile.availability || "Weekends").trim()
  };

  await writeDB(db);
  res.json({ user: safeUser(user), tips: profileTips(user.profile) });
});

app.post("/api/profile/photo", auth, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Photo file is required." });
  }

  req.user.profile.photoUrl = `/uploads/${req.file.filename}`;
  await writeDB(req.db);
  res.json({ user: safeUser(req.user) });
});

app.get("/api/dashboard", auth, async (req, res) => {
  const { db, user } = req;
  const conversations = db.conversations
    .filter((conversation) => conversation.participants.includes(user.id))
    .map((conversation) => conversationView(db, conversation, user.id))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  res.json({
    profileScore: calculateProfileScore(user.profile),
    tips: profileTips(user.profile),
    stats: {
      learners: db.users.length,
      certifiedMentors: db.users.filter((item) => item.profile.skills?.some((skill) => skill.certifiedToTeach)).length,
      liveSessions: db.videoSessions.length,
      skillsMapped: new Set(db.users.flatMap((item) => (item.profile.skills || []).map((skill) => getSkillKey(skill.name)))).size
    },
    trendingSkills,
    skillRecommendations: getSkillRecommendations(user),
    recommendedPeople: recommendPeople(db, user),
    recentConversations: conversations
  });
});

app.get("/api/users", auth, async (req, res) => {
  const query = String(req.query.skill || "").trim();
  const intent = String(req.query.intent || "learn");
  const candidates = req.db.users
    .filter((user) => user.id !== req.user.id)
    .filter((candidate) => {
      if (!query) return true;
      const profile = candidate.profile || {};
      if (intent === "teach") {
        return [...(profile.targetSkills || []), ...(profile.interests || [])].some((item) => skillMatches(item, query));
      }

      return [
        ...(profile.skills || []).map((skill) => skill.name),
        ...(profile.interests || [])
      ].some((item) => skillMatches(item, query));
    })
    .map((candidate) => decorateCandidate(req.user, candidate, query, intent))
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json({ users: candidates });
});

app.get("/api/users/:userId", auth, async (req, res) => {
  const user = req.db.users.find((item) => item.id === req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "User was not found." });
  }

  res.json({ user: safeUser(user) });
});

app.get("/api/skills/tests/:skill", auth, async (req, res) => {
  const bank = testBankFor(req.params.skill);

  res.json({
    skill: bank.displayName,
    questions: bank.questions.map(({ answerIndex, ...question }, index) => ({
      id: index,
      ...question
    }))
  });
});

app.post("/api/skills/tests/:skill/submit", auth, async (req, res) => {
  const bank = testBankFor(req.params.skill);
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const correct = bank.questions.reduce((count, question, index) => count + (Number(answers[index]) === question.answerIndex ? 1 : 0), 0);
  const score = Math.round((correct / bank.questions.length) * 100);
  const passed = score >= 70;
  const skillName = bank.displayName || displaySkillName(req.params.skill);
  const profileSkills = req.user.profile.skills || [];
  const existing = profileSkills.find((skill) => getSkillKey(skill.name) === getSkillKey(skillName));

  if (existing) {
    existing.testScore = Math.max(existing.testScore || 0, score);
    existing.certifiedToTeach = existing.certifiedToTeach || passed;
    existing.level = score >= 90 ? "Advanced" : score >= 70 ? "Intermediate" : existing.level || "Beginner";
  } else {
    profileSkills.push({
      name: skillName,
      level: score >= 90 ? "Advanced" : score >= 70 ? "Intermediate" : "Beginner",
      years: 0,
      testScore: score,
      certifiedToTeach: passed
    });
  }

  req.user.profile.skills = profileSkills;

  let certificate = null;
  if (passed) {
    certificate = {
      id: `cert_${id()}`,
      skill: skillName,
      score,
      issuedAt: now()
    };
    req.user.profile.certificates = [
      ...(req.user.profile.certificates || []).filter((item) => getSkillKey(item.skill) !== getSkillKey(skillName)),
      certificate
    ];
  }

  await writeDB(req.db);
  res.json({
    score,
    correct,
    total: bank.questions.length,
    passed,
    certificate,
    user: safeUser(req.user),
    skillRecommendations: getSkillRecommendations(req.user)
  });
});

app.get("/api/conversations", auth, async (req, res) => {
  const conversations = req.db.conversations
    .filter((conversation) => conversation.participants.includes(req.user.id))
    .map((conversation) => conversationView(req.db, conversation, req.user.id))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ conversations });
});

app.post("/api/conversations", auth, async (req, res) => {
  const participantId = String(req.body.participantId || "");
  const participant = req.db.users.find((user) => user.id === participantId);

  if (!participant || participant.id === req.user.id) {
    return res.status(400).json({ message: "A valid conversation participant is required." });
  }

  let conversation = req.db.conversations.find(
    (item) => item.participants.length === 2 && item.participants.includes(req.user.id) && item.participants.includes(participantId)
  );

  if (!conversation) {
    conversation = {
      id: `c_${id()}`,
      participants: [req.user.id, participantId],
      createdAt: now(),
      updatedAt: now(),
      lastMessage: null
    };
    req.db.conversations.push(conversation);
    await writeDB(req.db);
  }

  res.status(201).json({ conversation: conversationView(req.db, conversation, req.user.id) });
});

app.get("/api/conversations/:conversationId/messages", auth, async (req, res) => {
  const conversation = req.db.conversations.find((item) => item.id === req.params.conversationId);

  if (!conversation || !conversation.participants.includes(req.user.id)) {
    return res.status(404).json({ message: "Conversation was not found." });
  }

  const messages = req.db.messages
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ messages });
});

app.post("/api/conversations/:conversationId/messages", auth, async (req, res) => {
  const conversation = req.db.conversations.find((item) => item.id === req.params.conversationId);
  const text = String(req.body.text || "").trim();

  if (!conversation || !conversation.participants.includes(req.user.id)) {
    return res.status(404).json({ message: "Conversation was not found." });
  }

  if (!text) {
    return res.status(400).json({ message: "Message text is required." });
  }

  const message = {
    id: `m_${id()}`,
    conversationId: conversation.id,
    senderId: req.user.id,
    text,
    createdAt: now()
  };

  req.db.messages.push(message);
  conversation.lastMessage = {
    text,
    senderId: req.user.id,
    createdAt: message.createdAt
  };
  conversation.updatedAt = message.createdAt;
  await writeDB(req.db);

  for (const participant of conversation.participants) {
    io.to(participant).emit("message:new", { conversationId: conversation.id, message });
  }

  res.status(201).json({ message });
});

app.post("/api/video-sessions", auth, async (req, res) => {
  const participantId = String(req.body.participantId || "");
  const participant = req.db.users.find((user) => user.id === participantId);

  if (!participant || participant.id === req.user.id) {
    return res.status(400).json({ message: "A valid session participant is required." });
  }

  const roomId = `room-${id()}`;
  const session = {
    id: `v_${id()}`,
    roomId,
    hostId: req.user.id,
    participantId,
    skill: String(req.body.skill || "Peer learning").trim(),
    status: "active",
    createdAt: now(),
    roomUrl: `/session/${roomId}`
  };

  req.db.videoSessions.push(session);
  await writeDB(req.db);

  io.to(participantId).emit("session:invite", {
    session,
    host: safeUser(req.user)
  });

  res.status(201).json({ session, participant: safeUser(participant) });
});

io.on("connection", (socket) => {
  socket.on("join:user", (userId) => {
    if (userId) {
      socket.join(userId);
      socket.data.userId = userId;
    }
  });

  socket.on("typing", ({ conversationId, to }) => {
    if (to) {
      socket.to(to).emit("typing", { conversationId });
    }
  });

  // WebRTC signaling relay — forward offer/answer/ICE between peers in a room
  socket.on("rtc:join", ({ roomId, userId }) => {
    if (!roomId || !userId) return;
    socket.join(`rtc:${roomId}`);
    socket.data.rtcRoom = `rtc:${roomId}`;
    socket.data.rtcUserId = userId;
    // Notify others in the room that a new peer arrived
    socket.to(`rtc:${roomId}`).emit("rtc:peer-joined", { userId });
  });

  socket.on("rtc:offer", ({ roomId, to, offer, from }) => {
    if (!roomId || !offer) return;
    socket.to(`rtc:${roomId}`).emit("rtc:offer", { offer, from });
  });

  socket.on("rtc:answer", ({ roomId, to, answer, from }) => {
    if (!roomId || !answer) return;
    socket.to(`rtc:${roomId}`).emit("rtc:answer", { answer, from });
  });

  socket.on("rtc:ice", ({ roomId, candidate, from }) => {
    if (!roomId || !candidate) return;
    socket.to(`rtc:${roomId}`).emit("rtc:ice", { candidate, from });
  });

  socket.on("rtc:leave", ({ roomId, userId }) => {
    if (!roomId) return;
    socket.leave(`rtc:${roomId}`);
    socket.to(`rtc:${roomId}`).emit("rtc:peer-left", { userId });
  });

  socket.on("disconnect", () => {
    if (socket.data.rtcRoom) {
      socket.to(socket.data.rtcRoom).emit("rtc:peer-left", { userId: socket.data.rtcUserId });
    }
  });
});

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }

  const indexPath = path.join(distPath, "index.html");
  if (await pathExists(indexPath)) {
    return res.sendFile(indexPath);
  }

  next();
});

ensureDataFile().then(() => {
  server.listen(PORT, () => {
    console.log(`JoinSkill API running on http://localhost:${PORT}`);
  });
});
