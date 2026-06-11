import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRoundSearch,
  Users,
  Video,
  VideoOff,
  X
} from "lucide-react";


const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const AI_MENTOR_PERSONAS = {
  default: (mentor) => `You are ${mentor.profile?.fullName || "Alex"}, an experienced tech mentor on JoinSkill platform.
Your skills: ${(mentor.profile?.skills || []).map(s => s.name).join(", ") || "Software Development"}.
Your background: ${mentor.profile?.description || "Passionate about teaching and mentoring students."}
Experience level: ${mentor.profile?.experience || "Senior Developer"}.
Speak in a friendly, encouraging, and knowledgeable tone. Give practical, actionable advice.
Keep responses concise (2-4 paragraphs max). Use examples when relevant.
You genuinely care about the student's growth. Sometimes ask follow-up questions to understand their needs better.`,
};

async function getAIMentorReply(mentor, conversationHistory, userMessage) {
  const systemPrompt = AI_MENTOR_PERSONAS.default(mentor);
  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text,
    })),
    { role: "user", content: userMessage },
  ];
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "I'm having trouble responding right now. Please try again!";
}

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "discover", label: "Discover", icon: UserRoundSearch },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "tests", label: "Skill Test", icon: Award },
  { id: "recommendations", label: "AI Match", icon: Brain },
  { id: "profile", label: "Profile", icon: CircleUserRound }
];

const skillOptions = ["React.js", "Node.js", "Python", "Machine Learning", "UI/UX Design", "Data Analytics", "Cloud Fundamentals"];
const interestOptions = ["Frontend", "Backend", "AI", "Data Analytics", "Career Projects", "Design Systems", "Mentoring"];
const availabilityOptions = ["Mornings", "Afternoons", "Evenings", "Late evenings", "Weekends"];

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

async function apiRequest(path, { token, method = "GET", body, headers = {} } = {}) {
  const requestHeaders = { ...headers };
  const options = { method, headers: requestHeaders };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function initials(name = "JS") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarUrl(photoUrl) {
  if (!photoUrl) return "";
  return photoUrl.startsWith("http") ? photoUrl : `${API_BASE}${photoUrl}`;
}

function Avatar({ user, size = "md" }) {
  const photo = avatarUrl(user?.profile?.photoUrl);
  return (
    <div className={classNames("avatar", `avatar-${size}`)}>
      {photo ? <img src={photo} alt={user?.profile?.fullName || user?.username} /> : <span>{initials(user?.profile?.fullName || user?.username)}</span>}
    </div>
  );
}

function Button({ children, variant = "primary", icon: Icon, className = "", ...props }) {
  return (
    <button className={classNames("btn", `btn-${variant}`, className)} {...props}>
      {Icon && <Icon size={18} />}
      <span>{children}</span>
    </button>
  );
}

function IconButton({ label, icon: Icon, className = "", ...props }) {
  return (
    <button className={classNames("icon-btn", className)} title={label} aria-label={label} {...props}>
      <Icon size={18} />
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Pill({ children, tone = "neutral" }) {
  return <span className={classNames("pill", `pill-${tone}`)}>{children}</span>;
}

function ProgressRing({ value }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="score-ring" style={{ "--score": `${normalized}%` }}>
      <strong>{normalized}</strong>
      <span>Score</span>
    </div>
  );
}

function TagPicker({ label, values, options = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function addTag(tag) {
    const clean = tag.trim();
    if (!clean) return;
    if (!values.some((value) => value.toLowerCase() === clean.toLowerCase())) {
      onChange([...values, clean]);
    }
    setDraft("");
  }

  function removeTag(tag) {
    onChange(values.filter((value) => value !== tag));
  }

  return (
    <div className="tag-picker">
      <div className="field-label">{label}</div>
      <div className="tag-input-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag(draft);
            }
          }}
          placeholder={placeholder}
        />
        <IconButton icon={Plus} label={`Add ${label}`} type="button" onClick={() => addTag(draft)} />
      </div>
      <div className="suggestion-row">
        {options
          .filter((option) => !values.includes(option))
          .slice(0, 6)
          .map((option) => (
            <button type="button" className="suggestion-chip" key={option} onClick={() => addTag(option)}>
              {option}
            </button>
          ))}
      </div>
      <div className="tag-row">
        {values.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingPanel({ label }) {
  return (
    <div className="loading-panel">
      <Loader2 className="spin" size={28} />
      <span>{label}</span>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event, demo = false) {
    event?.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = demo ? { username: "demo", password: "password123" } : { username, password };
      const endpoint = mode === "signin" || demo ? "/api/auth/signin" : "/api/auth/register";
      const data = await apiRequest(endpoint, { method: "POST", body: payload });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-lockup">
          <div className="brand-mark">
            <GraduationCap size={30} />
          </div>
          <div>
            <p>JoinSkill</p>
            <span>Collaborative learning network</span>
          </div>
        </div>
        <div className="auth-hero">
          <Pill tone="mint">Peer certified learning</Pill>
          <h1>Find people who teach what you want to learn.</h1>
          <p>Build a profile, prove your skills, match with mentors and students, then learn together through chat and live sessions.</p>
        </div>
        <div className="auth-metrics">
          <div>
            <strong>AI</strong>
            <span>Profile scoring</span>
          </div>
          <div>
            <strong>1:1</strong>
            <span>Skill sessions</span>
          </div>
          <div>
            <strong>Live</strong>
            <span>Chat rooms</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tabs">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")} type="button">
            Sign In
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Register
          </button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <h2>{mode === "signin" ? "Welcome back" : "Create account"}</h2>
          <Field label="Username">
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="yourname" autoComplete="username" />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="at least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </Field>
          {error && <div className="error-box">{error}</div>}
          <Button icon={loading ? Loader2 : ShieldCheck} className={loading ? "is-loading" : ""} disabled={loading}>
            {mode === "signin" ? "Sign In" : "Register"}
          </Button>
          <Button variant="ghost" icon={Sparkles} type="button" onClick={(event) => submit(event, true)} disabled={loading}>
            Demo Sign In
          </Button>
        </form>
      </section>
    </main>
  );
}

function ProfileEditor({ user, token, onUserUpdate, compact = false }) {
  const [profile, setProfile] = useState(user.profile);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [skillDraft, setSkillDraft] = useState({ name: "", level: "Beginner", years: 0 });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setProfile(user.profile);
  }, [user]);

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function addSkill(skillName = skillDraft.name) {
    const clean = skillName.trim();
    if (!clean || profile.skills.some((skill) => skill.name.toLowerCase() === clean.toLowerCase())) return;
    updateProfile("skills", [...profile.skills, { ...skillDraft, name: clean, years: Number(skillDraft.years) || 0, testScore: null, certifiedToTeach: false }]);
    setSkillDraft({ name: "", level: "Beginner", years: 0 });
  }

  function removeSkill(skillName) {
    updateProfile(
      "skills",
      profile.skills.filter((skill) => skill.name !== skillName)
    );
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      let nextUser = user;
      if (photoFile) {
        const form = new FormData();
        form.append("photo", photoFile);
        const photoResult = await apiRequest("/api/profile/photo", { token, method: "POST", body: form });
        nextUser = photoResult.user;
      }

      const saved = await apiRequest("/api/profile/me", {
        token,
        method: "PUT",
        body: { ...profile, photoUrl: nextUser.profile.photoUrl }
      });
      onUserUpdate(saved.user);
      setStatus("Profile saved");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={classNames("profile-form", compact && "profile-form-compact")} onSubmit={saveProfile}>
      <div className="section-heading">
        <div>
          <p>Profile setup</p>
          <h2>Your learning identity</h2>
        </div>
        <ProgressRing value={user.profileScore} />
      </div>

      <div className="profile-grid">
        <div className="photo-uploader">
          <div className="photo-preview">
            {preview || profile.photoUrl ? (
              <img src={preview || avatarUrl(profile.photoUrl)} alt={profile.fullName} />
            ) : (
              <span>{initials(profile.fullName || user.username)}</span>
            )}
          </div>
          <label className="upload-button">
            <Camera size={18} />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhotoFile(file || null);
                setPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
          </label>
        </div>

        <div className="form-columns">
          <Field label="Full name">
            <input value={profile.fullName} onChange={(event) => updateProfile("fullName", event.target.value)} />
          </Field>
          <Field label="LinkedIn ID">
            <input value={profile.linkedinId} onChange={(event) => updateProfile("linkedinId", event.target.value)} placeholder="linkedin.com/in/username" />
          </Field>
          <Field label="Experience">
            <input value={profile.experience} onChange={(event) => updateProfile("experience", event.target.value)} placeholder="Frontend intern, ML project lead..." />
          </Field>
          <Field label="Availability">
            <select value={profile.availability} onChange={(event) => updateProfile("availability", event.target.value)}>
              {availabilityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="About Me">
        <textarea rows="5" value={profile.description} onChange={(event) => updateProfile("description", event.target.value)} />
      </Field>

      <div className="two-col">
        <TagPicker
          label="Interests"
          values={profile.interests || []}
          options={interestOptions}
          placeholder="React.js, AI, Design..."
          onChange={(values) => updateProfile("interests", values)}
        />
        <TagPicker
          label="Skills to learn"
          values={profile.targetSkills || []}
          options={skillOptions}
          placeholder="Node.js, ML..."
          onChange={(values) => updateProfile("targetSkills", values)}
        />
      </div>

      <div className="skill-editor">
        <div className="field-label">Skills you can share</div>
        <div className="skill-add-row">
          <input
            value={skillDraft.name}
            onChange={(event) => setSkillDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="React.js"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkill();
              }
            }}
          />
          <select value={skillDraft.level} onChange={(event) => setSkillDraft((current) => ({ ...current, level: event.target.value }))}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <input
            type="number"
            min="0"
            value={skillDraft.years}
            onChange={(event) => setSkillDraft((current) => ({ ...current, years: event.target.value }))}
            aria-label="Years"
          />
          <IconButton icon={Plus} label="Add skill" type="button" onClick={() => addSkill()} />
        </div>
        <div className="suggestion-row">
          {skillOptions
            .filter((option) => !profile.skills.some((skill) => skill.name === option))
            .slice(0, 6)
            .map((option) => (
              <button type="button" className="suggestion-chip" key={option} onClick={() => addSkill(option)}>
                {option}
              </button>
            ))}
        </div>
        <div className="skill-list">
          {profile.skills.map((skill) => (
            <div className="skill-item" key={skill.name}>
              <div>
                <strong>{skill.name}</strong>
                <span>
                  {skill.level} · {skill.years || 0} yrs
                </span>
              </div>
              <div className="skill-actions">
                {skill.certifiedToTeach ? <Pill tone="green">Certified</Pill> : <Pill>Test pending</Pill>}
                {skill.testScore !== null && skill.testScore !== undefined && <Pill tone="blue">{skill.testScore}%</Pill>}
                <IconButton icon={X} label={`Remove ${skill.name}`} type="button" onClick={() => removeSkill(skill.name)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-footer">
        {status && <span className={status === "Profile saved" ? "success-text" : "error-text"}>{status}</span>}
        <Button icon={saving ? Loader2 : CheckCircle2} disabled={saving} className={saving ? "is-loading" : ""}>
          Save Profile
        </Button>
      </div>
    </form>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


// ── AI Mentor Chat Modal ──────────────────────────────────────────────────────
function AIMentorChatModal({ mentor, onClose }) {
  const [messages, setMessages] = useState([{
    id: "intro", isUser: false,
    text: `Hey! I'm ${mentor.profile?.fullName || "your mentor"}. 👋 I'm here to help you with ${(mentor.profile?.skills || []).slice(0, 2).map(s => s.name).join(" and ") || "your learning journey"}. What would you like to learn or discuss today?`,
  }]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(event) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    const userMsg = { id: Date.now(), isUser: true, text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const reply = await getAIMentorReply(mentor, messages, text);
      setMessages([...history, { id: Date.now() + 1, isUser: false, text: reply }]);
    } catch {
      setMessages([...history, { id: Date.now() + 1, isUser: false, text: "Sorry, I'm having a technical issue. Try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  }

  const photo = mentor.profile?.photoUrl ? avatarUrl(mentor.profile.photoUrl) : null;

  return (
    <div className="ai-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-chat-modal">
        <header className="ai-chat-header">
          <div className="ai-mentor-info">
            <div className="ai-avatar-wrap">
              {photo ? <img src={photo} alt={mentor.profile?.fullName} /> : <span>{initials(mentor.profile?.fullName || mentor.username)}</span>}
              <span className="ai-badge">✦ AI</span>
            </div>
            <div>
              <h2>{mentor.profile?.fullName || mentor.username}</h2>
              <p>{mentor.profile?.experience || "Expert Mentor"} · {(mentor.profile?.skills || []).slice(0, 2).map(s => s.name).join(", ")}</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="ai-message-feed" ref={feedRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={classNames("ai-bubble", msg.isUser ? "ai-bubble-user" : "ai-bubble-mentor")}>
              {!msg.isUser && (
                <div className="ai-bubble-avatar">
                  {photo ? <img src={photo} alt="" /> : <span>{initials(mentor.profile?.fullName || mentor.username)}</span>}
                </div>
              )}
              <div className="ai-bubble-text">
                {msg.text.split("\n").map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-bubble ai-bubble-mentor">
              <div className="ai-bubble-avatar"><Loader2 size={16} className="spinning" /></div>
              <div className="ai-bubble-text ai-typing"><span/><span/><span/></div>
            </div>
          )}
        </div>
        <form className="ai-compose" onSubmit={sendMessage}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(e)}
            placeholder={`Ask ${mentor.profile?.fullName?.split(" ")[0] || "your mentor"} anything...`}
            disabled={loading}
          />
          <button type="submit" className="icon-btn" disabled={!draft.trim() || loading} aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── AI Video Session Modal ────────────────────────────────────────────────────
function AIVideoSessionModal({ mentor, onClose }) {
  const [messages, setMessages] = useState([{
    id: "intro", isUser: false,
    text: `🎥 Video session started! Great to connect with you. I'm ${mentor.profile?.fullName || "your mentor"}, and I'm really excited to work with you today.\n\nWhat specific topic or problem would you like to tackle in our session?`,
  }]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setSessionTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function sendMessage(event) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    const userMsg = { id: Date.now(), isUser: true, text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const systemPrompt = AI_MENTOR_PERSONAS.default(mentor) + `\n\nYou are in a LIVE VIDEO SESSION. Behave as if face-to-face. Occasionally reference video context naturally (e.g. "let me share my screen", "try that in your editor"). Be interactive and create a real session feel.`;
      const apiMessages = messages.map(m => ({ role: m.isUser ? "user" : "assistant", content: m.text }));
      apiMessages.push({ role: "user", content: text });
      const response = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: apiMessages }),
      });
      const data = await response.json();
      setMessages([...history, { id: Date.now() + 1, isUser: false, text: data.content?.[0]?.text || "Let me think about that..." }]);
    } catch {
      setMessages([...history, { id: Date.now() + 1, isUser: false, text: "Connection dropped for a moment. Can you repeat that?" }]);
    } finally {
      setLoading(false);
    }
  }

  const photo = mentor.profile?.photoUrl ? avatarUrl(mentor.profile.photoUrl) : null;

  return (
    <div className="ai-modal-overlay">
      <div className="ai-video-modal">
        <div className="ai-video-grid">
          <div className="ai-video-tile ai-video-mentor">
            <div className="ai-video-avatar-large">
              {photo ? <img src={photo} alt={mentor.profile?.fullName} /> : <span>{initials(mentor.profile?.fullName || mentor.username)}</span>}
            </div>
            {loading && <div className="ai-speaking-indicator"><span/><span/><span/></div>}
            <div className="ai-video-label">
              <span>{mentor.profile?.fullName || mentor.username}</span>
              <span className="ai-badge-inline">✦ AI Mentor</span>
            </div>
          </div>
          <div className="ai-video-tile ai-video-you">
            <div className="ai-you-avatar"><CircleUserRound size={40} /></div>
            <div className="ai-video-label"><span>You</span></div>
          </div>
        </div>
        <div className="ai-video-meta">
          <span className="ai-session-time">🔴 {formatTime(sessionTime)}</span>
          <span>{(mentor.profile?.skills || []).slice(0, 1).map(s => s.name).join("") || "Mentoring Session"}</span>
        </div>
        <div className="ai-video-chat" ref={feedRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={classNames("ai-video-msg", msg.isUser ? "ai-video-msg-user" : "ai-video-msg-mentor")}>
              <strong>{msg.isUser ? "You" : mentor.profile?.fullName?.split(" ")[0] || "Mentor"}:</strong>{" "}{msg.text}
            </div>
          ))}
          {loading && <div className="ai-video-msg ai-video-msg-mentor"><em>Thinking...</em></div>}
        </div>
        <div className="ai-video-controls">
          <form className="ai-compose ai-video-compose" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(e)}
              placeholder="Type your response..."
              disabled={loading}
            />
            <button type="submit" className="icon-btn" disabled={!draft.trim() || loading}><Send size={18}/></button>
          </form>
          <button className="btn btn-danger" onClick={onClose}><Phone size={16} /> End Session</button>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person, onMessage, onVideo, query }) {
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAIVideo, setShowAIVideo] = useState(false);
  const certifiedSkills = (person.profile.skills || []).filter((skill) => skill.certifiedToTeach);

  return (
    <article className="person-card">
      <div className="person-topline">
        <Avatar user={person} />
        <div>
          <h3>{person.profile.fullName}</h3>
          <p>{person.profile.experience || person.username}</p>
        </div>
        <div className="match-score">
          <strong>{person.matchScore || person.profileScore}</strong>
          <span>Match</span>
        </div>
      </div>
      <p className="person-about">{person.profile.description}</p>
      <div className="tag-row">
        {(person.matchingSkills?.length ? person.matchingSkills : certifiedSkills).slice(0, 3).map((skill) => (
          <Pill key={skill.name} tone={skill.certifiedToTeach ? "green" : "blue"}>
            {skill.name}
          </Pill>
        ))}
        {query && person.canTeachQuery && <Pill tone="mint">Can teach {query}</Pill>}
      </div>
      <div className="person-meta">
        <span>
          <Star size={15} /> {person.profile.rating || "New"}
        </span>
        <span>
          <Clock3 size={15} /> {person.profile.availability}
        </span>
        <span>
          <Users size={15} /> {person.profile.sessionsCompleted || 0}
        </span>
      </div>
      <div className="person-actions">
        <Button variant="secondary" icon={MessageCircle} type="button" onClick={() => setShowAIChat(true)}>
          Message
        </Button>
        <Button variant="primary" icon={Video} type="button" onClick={() => setShowAIVideo(true)}>
          Video
        </Button>
      </div>
      {showAIChat && <AIMentorChatModal mentor={person} onClose={() => setShowAIChat(false)} />}
      {showAIVideo && <AIVideoSessionModal mentor={person} onClose={() => setShowAIVideo(false)} />}
    </article>
  );
}

function DashboardHome({ dashboard, user, onNavigate, onMessage, onVideo }) {
  if (!dashboard) {
    return <LoadingPanel label="Loading dashboard" />;
  }

  return (
    <div className="dashboard-stack">
      <section className="welcome-panel">
        <div>
          <Pill tone="mint">JoinSkill network</Pill>
          <h1>Welcome, {user.profile.fullName || user.username}</h1>
          <p>Your profile is matched against skills, goals, certification scores, session history, and trending technologies.</p>
        </div>
        <div className="welcome-actions">
          <Button icon={Search} type="button" onClick={() => onNavigate("discover")}>
            Find Mentors
          </Button>
          <Button variant="secondary" icon={Award} type="button" onClick={() => onNavigate("tests")}>
            Take Test
          </Button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={Users} label="Learners" value={dashboard.stats.learners} accent="#176b87" />
        <StatCard icon={ShieldCheck} label="Certified mentors" value={dashboard.stats.certifiedMentors} accent="#3a7d44" />
        <StatCard icon={Video} label="Live sessions" value={dashboard.stats.liveSessions} accent="#b85c38" />
        <StatCard icon={BookOpen} label="Skills mapped" value={dashboard.stats.skillsMapped} accent="#6956e5" />
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="panel-title">
            <div>
              <p>Recommended people</p>
              <h2>Best learning matches</h2>
            </div>
            <button className="text-button" type="button" onClick={() => onNavigate("discover")}>
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="compact-people-list">
            {dashboard.recommendedPeople.slice(0, 3).map((person) => (
              <div className="compact-person" key={person.id}>
                <Avatar user={person} size="sm" />
                <div>
                  <strong>{person.profile.fullName}</strong>
                  <span>{person.profile.skills?.[0]?.name || person.profile.interests?.[0]}</span>
                </div>
                <Pill tone="blue">{person.matchScore}%</Pill>
                <IconButton icon={MessageCircle} label={`Message ${person.profile.fullName}`} onClick={() => onMessage(person)} />
                <IconButton icon={Video} label={`Video ${person.profile.fullName}`} onClick={() => onVideo(person)} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel profile-score-panel">
          <div className="panel-title">
            <div>
              <p>AI profile scoring</p>
              <h2>Skill strength</h2>
            </div>
            <ProgressRing value={dashboard.profileScore} />
          </div>
          <div className="tip-list">
            {(dashboard.tips.length ? dashboard.tips : ["Profile is ready for more matches"]).map((tip) => (
              <div className="tip-item" key={tip}>
                <CheckCircle2 size={17} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="panel-title">
            <div>
              <p>Skill recommendations</p>
              <h2>Next skills</h2>
            </div>
            <TrendingUp size={22} />
          </div>
          <div className="recommendation-list">
            {dashboard.skillRecommendations.slice(0, 4).map((skill) => (
              <div className="recommendation-item" key={skill.name}>
                <div>
                  <strong>{skill.name}</strong>
                  <span>{skill.reason}</span>
                </div>
                <Pill tone="mint">{skill.confidence}%</Pill>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <p>Trending</p>
              <h2>Market signals</h2>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="trend-list">
            {dashboard.trendingSkills.slice(0, 5).map((skill) => (
              <div className="trend-item" key={skill.name}>
                <span>{skill.name}</span>
                <div className="trend-bar">
                  <i style={{ width: `${skill.growth}%` }} />
                </div>
                <strong>{skill.growth}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DiscoverView({ token, onMessage, onVideo }) {
  const [query, setQuery] = useState("React.js");
  const [intent, setIntent] = useState("learn");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use a callback so search always uses the latest query/intent values
  const search = useCallback(async (currentQuery, currentIntent) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/users?skill=${encodeURIComponent(currentQuery)}&intent=${currentIntent}`, { token });
      setPeople(data.users);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    search(query, intent);
  }, [intent]);

  function handleSearch() {
    search(query, intent);
  }

  function handleChipClick(skill) {
    setQuery(skill);
    search(skill, intent);
  }

  return (
    <div className="dashboard-stack">
      <section className="panel search-panel">
        <div className="section-heading">
          <div>
            <p>Discovery</p>
            <h2>Search by skill</h2>
          </div>
          <div className="segmented">
            <button className={intent === "learn" ? "active" : ""} onClick={() => setIntent("learn")} type="button">
              Learn
            </button>
            <button className={intent === "teach" ? "active" : ""} onClick={() => setIntent("teach")} type="button">
              Teach
            </button>
          </div>
        </div>
        <div className="search-row">
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
            placeholder="React.js, Machine Learning, Node.js..."
          />
          <Button icon={loading ? Loader2 : Search} onClick={handleSearch} className={loading ? "is-loading" : ""}>
            Search
          </Button>
        </div>
        <div className="suggestion-row">
          {skillOptions.map((skill) => (
            <button
              type="button"
              className={classNames("suggestion-chip", query === skill && "active")}
              key={skill}
              onClick={() => handleChipClick(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </section>

      <section className="people-grid">
        {people.map((person) => (
          <PersonCard key={person.id} person={person} query={query} onMessage={onMessage} onVideo={onVideo} />
        ))}
        {!people.length && !loading && (
          <div className="empty-state">
            <Search size={32} />
            <h3>No matches yet</h3>
            <p>Try another skill or switch the learning mode.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function MessagesView({ token, user, activeConversationId, onConversationSelected }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(activeConversationId || "");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const feedRef = useRef(null);

  async function loadConversations() {
    try {
      const data = await apiRequest("/api/conversations", { token });
      setConversations(data.conversations);
      if (!activeId && data.conversations[0]) {
        setActiveId(data.conversations[0].id);
      }
    } catch (err) {
      console.error("Load conversations error:", err);
    }
  }

  async function loadMessages(conversationId) {
    if (!conversationId) return;
    try {
      const data = await apiRequest(`/api/conversations/${conversationId}/messages`, { token });
      setMessages(data.messages);
    } catch (err) {
      console.error("Load messages error:", err);
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      setActiveId(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadMessages(activeId);
    onConversationSelected?.(activeId);
  }, [activeId]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("join:user", user.id);
    socket.on("message:new", ({ conversationId, message }) => {
      if (conversationId === activeId) {
        setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      }
      loadConversations();
    });

    return () => socket.disconnect();
  }, [user.id, activeId]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    try {
      const data = await apiRequest(`/api/conversations/${activeId}/messages`, { token, method: "POST", body: { text } });
      setMessages((current) => (current.some((item) => item.id === data.message.id) ? current : [...current, data.message]));
      await loadConversations();
    } catch (err) {
      console.error("Send message error:", err);
    }
  }

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);

  return (
    <div className="messages-layout">
      <aside className="conversation-list">
        <div className="panel-title compact">
          <div>
            <p>Chats</p>
            <h2>Messages</h2>
          </div>
        </div>
        {conversations.map((conversation) => (
          <button
            type="button"
            className={classNames("conversation-item", activeId === conversation.id && "active")}
            key={conversation.id}
            onClick={() => setActiveId(conversation.id)}
          >
            <Avatar user={conversation.participant} size="sm" />
            <div>
              <strong>{conversation.participant?.profile.fullName}</strong>
              <span>{conversation.lastMessage?.text || "Start the conversation"}</span>
            </div>
          </button>
        ))}
      </aside>

      <section className="chat-panel">
        {activeConversation ? (
          <>
            <header className="chat-header">
              <Avatar user={activeConversation.participant} />
              <div>
                <h2>{activeConversation.participant?.profile.fullName}</h2>
                <span>{activeConversation.participant?.profile.availability}</span>
              </div>
            </header>
            <div className="message-feed" ref={feedRef}>
              {messages.map((message) => (
                <div className={classNames("message-bubble", message.senderId === user.id && "mine")} key={message.id}>
                  <p>{message.text}</p>
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
            <form className="message-compose" onSubmit={sendMessage}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." />
              <IconButton icon={Send} label="Send message" />
            </form>
          </>
        ) : (
          <div className="empty-state">
            <MessageCircle size={34} />
            <h3>No conversation selected</h3>
            <p>Open a chat from the discovery page.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SkillTestsView({ token, user, onUserUpdate }) {
  const [skill, setSkill] = useState(user.profile.skills?.[0]?.name || "React.js");
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadTest(selectedSkill = skill) {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const data = await apiRequest(`/api/skills/tests/${encodeURIComponent(selectedSkill)}`, { token });
      setTest(data);
    } catch (err) {
      console.error("Load test error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTest(skill);
  }, []);

  async function submitTest(event) {
    event.preventDefault();
    const orderedAnswers = test.questions.map((question) => answers[question.id]);
    try {
      const data = await apiRequest(`/api/skills/tests/${encodeURIComponent(test.skill)}/submit`, {
        token,
        method: "POST",
        body: { answers: orderedAnswers }
      });
      setResult(data);
      onUserUpdate(data.user);
    } catch (err) {
      console.error("Submit test error:", err);
    }
  }

  return (
    <div className="tests-layout">
      <section className="panel test-control-panel">
        <div className="section-heading">
          <div>
            <p>Certification</p>
            <h2>Skill test</h2>
          </div>
          <Award size={24} />
        </div>
        <Field label="Skill">
          <select
            value={skill}
            onChange={(event) => {
              setSkill(event.target.value);
              loadTest(event.target.value);
            }}
          >
            {[...new Set([...user.profile.skills.map((item) => item.name), ...skillOptions])].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Button icon={loading ? Loader2 : Award} onClick={() => loadTest(skill)} type="button" className={loading ? "is-loading" : ""}>
          Load Test
        </Button>
        <div className="certificate-stack">
          <h3>Certificates</h3>
          {(user.profile.certificates || []).map((certificate) => (
            <div className="certificate" key={certificate.id}>
              <ShieldCheck size={18} />
              <div>
                <strong>{certificate.skill}</strong>
                <span>{certificate.score}% · {new Date(certificate.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel test-panel">
        {test ? (
          <form onSubmit={submitTest}>
            <div className="panel-title">
              <div>
                <p>{test.skill}</p>
                <h2>Knowledge check</h2>
              </div>
              {result && <Pill tone={result.passed ? "green" : "coral"}>{result.score}%</Pill>}
            </div>
            <div className="question-list">
              {test.questions.map((question, index) => (
                <div className="question-card" key={question.id}>
                  <strong>
                    {index + 1}. {question.question}
                  </strong>
                  <div className="option-grid">
                    {question.options.map((option, optionIndex) => (
                      <label className={classNames("option-card", answers[question.id] === optionIndex && "active")} key={option}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[question.id] === optionIndex}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {result && (
              <div className={classNames("result-box", result.passed ? "passed" : "retry")}>
                <strong>{result.passed ? "Certified to teach" : "Keep practicing"}</strong>
                <span>
                  {result.correct} of {result.total} correct
                </span>
              </div>
            )}
            <div className="form-footer">
              <Button icon={CheckCircle2} disabled={Object.keys(answers).length !== test.questions.length}>
                Submit Test
              </Button>
            </div>
          </form>
        ) : (
          <LoadingPanel label="Loading test" />
        )}
      </section>
    </div>
  );
}

function RecommendationsView({ dashboard }) {
  if (!dashboard) {
    return <LoadingPanel label="Loading recommendations" />;
  }

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>Machine learning integration</p>
            <h2>Recommendation systems</h2>
          </div>
          <Brain size={26} />
        </div>
        <div className="ml-grid">
          <div className="ml-card">
            <Users size={22} />
            <h3>Student Recommendation</h3>
            <p>Ranks peers by matching goals, certified skills, interests, ratings, and session history.</p>
          </div>
          <div className="ml-card">
            <BarChart3 size={22} />
            <h3>AI Profile Scoring</h3>
            <p>Scores profile completeness, certification status, skill clarity, and mentoring readiness.</p>
          </div>
          <div className="ml-card">
            <Target size={22} />
            <h3>Skill Recommendation</h3>
            <p>Suggests next skills using current strengths, target skills, and trending technology signals.</p>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="panel-title">
            <div>
              <p>Suggested people</p>
              <h2>Learning graph</h2>
            </div>
          </div>
          <div className="recommendation-list">
            {dashboard.recommendedPeople.map((person) => (
              <div className="recommendation-item" key={person.id}>
                <div>
                  <strong>{person.profile.fullName}</strong>
                  <span>{person.profile.skills?.map((skill) => skill.name).join(", ")}</span>
                </div>
                <Pill tone="blue">{person.matchScore}%</Pill>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <p>Next skills</p>
              <h2>Personalized</h2>
            </div>
          </div>
          <div className="recommendation-list">
            {dashboard.skillRecommendations.map((skill) => (
              <div className="recommendation-item" key={skill.name}>
                <div>
                  <strong>{skill.name}</strong>
                  <span>{skill.reason}</span>
                </div>
                <Pill tone="mint">{skill.confidence}%</Pill>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// VideoSessionModal — full WebRTC peer connection with signaling via socket.io
// ──────────────────────────────────────────────────────────────────────────────
function VideoSessionModal({ session, participant, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const makingOfferRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState("");

  // Acquire local media
  async function startLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setMicOn(true);
      return stream;
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera/microphone permission denied. Please allow access in your browser settings."
          : err.name === "NotFoundError"
          ? "No camera or microphone found on this device."
          : "Camera access is not available in this browser session.";
      setError(msg);
      return null;
    }
  }

  // Create RTCPeerConnection and wire up events
  function createPeerConnection(socket, stream) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // Remote track → remote video element
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams?.[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
        setStatus("Connected");
      }
    };

    // ICE candidates → signal via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("rtc:ice", { roomId: session.roomId, candidate: event.candidate, from: "local" });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setConnected(true);
        setStatus("Connected");
      } else if (state === "disconnected" || state === "failed") {
        setConnected(false);
        setStatus("Peer disconnected");
      }
    };

    return pc;
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stream = await startLocalStream();
      if (cancelled) return;

      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      const pc = createPeerConnection(socket, stream);

      // Join the WebRTC room
      socket.emit("rtc:join", { roomId: session.roomId, userId: "local" });
      setStatus("Waiting for peer…");

      // When another peer joins → we are the offerer
      socket.on("rtc:peer-joined", async () => {
        if (cancelled) return;
        setPeerJoined(true);
        setStatus("Peer joined, connecting…");
        try {
          makingOfferRef.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("rtc:offer", { roomId: session.roomId, offer: pc.localDescription, from: "local" });
        } catch (err) {
          console.error("Offer error:", err);
        } finally {
          makingOfferRef.current = false;
        }
      });

      // Receive offer → answer
      socket.on("rtc:offer", async ({ offer }) => {
        if (cancelled) return;
        setPeerJoined(true);
        setStatus("Peer connected, answering…");
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("rtc:answer", { roomId: session.roomId, answer: pc.localDescription, from: "local" });
        } catch (err) {
          console.error("Answer error:", err);
        }
      });

      // Receive answer
      socket.on("rtc:answer", async ({ answer }) => {
        if (cancelled) return;
        try {
          if (pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } catch (err) {
          console.error("Set answer error:", err);
        }
      });

      // Receive ICE candidate
      socket.on("rtc:ice", async ({ candidate }) => {
        if (cancelled) return;
        try {
          if (candidate && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error("ICE candidate error:", err);
        }
      });

      // Peer left
      socket.on("rtc:peer-left", () => {
        if (cancelled) return;
        setConnected(false);
        setPeerJoined(false);
        setStatus("Peer left the session");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
    }

    init();

    return () => {
      cancelled = true;
      // Clean up
      socketRef.current?.emit("rtc:leave", { roomId: session.roomId });
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks?.()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    } else {
      startLocalStream();
    }
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }

  function handleClose() {
    socketRef.current?.emit("rtc:leave", { roomId: session.roomId });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section className="video-modal">
        <header className="video-header">
          <div>
            <p>{session.skill}</p>
            <h2>{participant?.profile.fullName}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Pill tone={connected ? "green" : "neutral"}>{status}</Pill>
            <IconButton icon={X} label="Close session" onClick={handleClose} />
          </div>
        </header>
        <div className="video-grid">
          <div className="video-tile local">
            <video ref={localVideoRef} autoPlay playsInline muted />
            {!cameraOn && <span>{initials("You")}</span>}
            <Pill tone="mint">You</Pill>
          </div>
          <div className="video-tile remote">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ display: peerJoined && connected ? "block" : "none", width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
            />
            {(!peerJoined || !connected) && (
              <>
                <Avatar user={participant} size="lg" />
                <strong>{participant?.profile.fullName}</strong>
              </>
            )}
            <Pill tone="blue">{peerJoined ? (connected ? "Live" : "Connecting…") : "Waiting…"}</Pill>
          </div>
        </div>
        {error && <div className="error-box">{error}</div>}
        <footer className="video-controls">
          <IconButton icon={micOn ? Mic : MicOff} label={micOn ? "Mute" : "Unmute"} onClick={toggleMic} />
          <IconButton icon={cameraOn ? Video : VideoOff} label={cameraOn ? "Turn camera off" : "Turn camera on"} onClick={toggleCamera} />
          <Button variant="danger" icon={X} onClick={handleClose}>
            End Session
          </Button>
        </footer>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// IncomingSessionBanner — shown when another user invites you to a session
// ──────────────────────────────────────────────────────────────────────────────
function IncomingSessionBanner({ invite, onAccept, onDecline }) {
  if (!invite) return null;
  return (
    <div className="incoming-session-banner">
      <div>
        <Phone size={18} />
        <span>
          <strong>{invite.host?.profile?.fullName || invite.host?.username}</strong> is inviting you to a <strong>{invite.session?.skill}</strong> session
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button variant="secondary" icon={X} onClick={onDecline}>
          Decline
        </Button>
        <Button icon={Video} onClick={onAccept}>
          Join
        </Button>
      </div>
    </div>
  );
}

function AppShell({ user, token, setUser, onLogout }) {
  const [activeView, setActiveView] = useState(user.profile.skills?.length ? "dashboard" : "profile");
  const [dashboard, setDashboard] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [videoSession, setVideoSession] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const globalSocketRef = useRef(null);

  async function loadDashboard() {
    try {
      const data = await apiRequest("/api/dashboard", { token });
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user.id, user.profileScore]);

  // Global socket for receiving session invites and notifications
  useEffect(() => {
    const socket = io(SOCKET_URL);
    globalSocketRef.current = socket;
    socket.emit("join:user", user.id);

    socket.on("session:invite", ({ session, host }) => {
      setIncomingInvite({ session, host });
    });

    return () => socket.disconnect();
  }, [user.id]);

  async function openConversation(person) {
    try {
      const data = await apiRequest("/api/conversations", { token, method: "POST", body: { participantId: person.id } });
      setActiveConversationId(data.conversation.id);
      setActiveView("messages");
    } catch (err) {
      console.error("Open conversation error:", err);
    }
  }

  async function openVideo(person) {
    const skill = person.matchingSkills?.[0]?.name || person.profile.skills?.[0]?.name || "Peer learning";
    try {
      const data = await apiRequest("/api/video-sessions", { token, method: "POST", body: { participantId: person.id, skill } });
      setVideoSession({ session: data.session, participant: data.participant });
      loadDashboard();
    } catch (err) {
      console.error("Open video error:", err);
    }
  }

  function acceptInvite() {
    if (!incomingInvite) return;
    setVideoSession({ session: incomingInvite.session, participant: incomingInvite.host });
    setIncomingInvite(null);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
    loadDashboard();
  }

  const ActiveIcon = navItems.find((item) => item.id === activeView)?.icon || LayoutDashboard;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup small">
          <div className="brand-mark">
            <GraduationCap size={24} />
          </div>
          <div>
            <p>JoinSkill</p>
            <span>Learning portal</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" className={classNames(activeView === item.id && "active")} key={item.id} onClick={() => setActiveView(item.id)}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-profile">
          <Avatar user={user} />
          <div>
            <strong>{user.profile.fullName || user.username}</strong>
            <span>{user.profileScore}% profile score</span>
          </div>
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <p>
              <ActiveIcon size={17} /> {navItems.find((item) => item.id === activeView)?.label}
            </p>
            <h1>{activeView === "dashboard" ? "Collaborative learning dashboard" : navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <Pill tone="green">
              <ShieldCheck size={14} /> {user.profile.skills?.filter((skill) => skill.certifiedToTeach).length || 0} certified
            </Pill>
            <Avatar user={user} size="sm" />
          </div>
        </header>

        <IncomingSessionBanner
          invite={incomingInvite}
          onAccept={acceptInvite}
          onDecline={() => setIncomingInvite(null)}
        />

        {activeView === "dashboard" && (
          <DashboardHome dashboard={dashboard} user={user} onNavigate={setActiveView} onMessage={openConversation} onVideo={openVideo} />
        )}
        {activeView === "discover" && <DiscoverView token={token} onMessage={openConversation} onVideo={openVideo} />}
        {activeView === "messages" && (
          <MessagesView token={token} user={user} activeConversationId={activeConversationId} onConversationSelected={setActiveConversationId} />
        )}
        {activeView === "tests" && <SkillTestsView token={token} user={user} onUserUpdate={updateUser} />}
        {activeView === "recommendations" && <RecommendationsView dashboard={dashboard} />}
        {activeView === "profile" && <ProfileEditor user={user} token={token} onUserUpdate={updateUser} />}
      </section>

      {videoSession && <VideoSessionModal {...videoSession} onClose={() => setVideoSession(null)} />}
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("joinskill_token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    async function bootstrap() {
      if (!token) return;

      try {
        const data = await apiRequest("/api/profile/me", { token });
        setUser(data.user);
      } catch {
        localStorage.removeItem("joinskill_token");
        setToken("");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [token]);

  function handleAuth(nextToken, nextUser) {
    localStorage.setItem("joinskill_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function handleLogout() {
    localStorage.removeItem("joinskill_token");
    setToken("");
    setUser(null);
  }

  if (loading) {
    return <LoadingPanel label="Opening JoinSkill" />;
  }

  if (!token || !user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return <AppShell user={user} token={token} setUser={setUser} onLogout={handleLogout} />;
}
