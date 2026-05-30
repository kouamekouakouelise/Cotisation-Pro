import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import logo from "./assets/cota.png";
import imgOrange from "./assets/ORANGE.png";
import imgWave from "./assets/WAVE.png";
import imgMTN from "./assets/MTN.png";
import { translations } from "./i18n";

const FlagFR = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" style={{ borderRadius: "2px", verticalAlign: "middle", display: "inline-block" }}>
    <rect width="7" height="15" fill="#002395"/>
    <rect x="7" width="8" height="15" fill="#fff"/>
    <rect x="15" width="7" height="15" fill="#ED2939"/>
  </svg>
);
const FlagEN = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" style={{ borderRadius: "2px", verticalAlign: "middle", display: "inline-block" }}>
    <rect width="22" height="15" fill="#012169"/>
    <path d="M0,0 L22,15 M22,0 L0,15" stroke="#fff" strokeWidth="3.5"/>
    <path d="M0,0 L22,15 M22,0 L0,15" stroke="#C8102E" strokeWidth="2"/>
    <path d="M11,0 V15 M0,7.5 H22" stroke="#fff" strokeWidth="5"/>
    <path d="M11,0 V15 M0,7.5 H22" stroke="#C8102E" strokeWidth="3"/>
  </svg>
);


const ICON_PATHS = {
  home:        <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  users:       <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  list:        <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  clock:       <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  mail:        <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>,
  'bar-chart': <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  shield:      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  user:        <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  'arrow-up':  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  'arrow-down':<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  dollar:      <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  target:      <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  receipt:     <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></>,
  lock:        <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  key:         <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  edit:        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  link:        <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  building:    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/><rect x="9" y="3" width="6" height="4"/></>,
  card:        <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  phone:       <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  check:       <polyline points="20 6 9 17 4 12"/>,
  'check-circle': <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  'x-circle':  <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  hourglass:   <><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></>,
  'rotate-cw': <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
  badge:       <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
  info:        <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  save:              <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  bell:              <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  'alert-triangle':  <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  smartphone:        <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
  bank:              <><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></>,
  'trending-up':     <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  trash:             <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  search:            <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  plus:              <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  download:          <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
};

const Icon = ({ name, size = 15, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
    {ICON_PATHS[name]}
  </svg>
);

function InView({ children, delay = 0, style: extra = {}, className = "", ...rest }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      ...extra,
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(30px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
    }} {...rest}>
      {children}
    </div>
  );
}

// ── Compteur animé ───────────────────────────────────────
function CountUp({ target, color, prefix = "", suffix = "", duration = 1100 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return (
    <div style={{ fontSize: "26px", fontWeight: "800", color, letterSpacing: "-0.5px" }}>
      {prefix}{val.toLocaleString("fr-FR")}{suffix}
    </div>
  );
}

// ── Horloge live ─────────────────────────────────────────
function LiveClock({ lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontSize: "32px", fontWeight: "800", color: "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>
        {now.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px", textTransform: "capitalize" }}>
        {now.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGE D'ACCUEIL PUBLIQUE (LANDING)
// ═══════════════════════════════════════════════════════
function LandingPage({ lang, setLang, t, onLogin, onRegister, onJoin }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fr = lang === "fr";

  const btnHover = (color = "#3498db") => ({
    onMouseEnter: (e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${color}55`; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; },
  });

  const features = [
    { icon: "👥", title: fr ? "Gestion des adhérents" : "Member management", desc: fr ? "Ajoutez, modifiez et suivez tous vos adhérents. Photos, matricules et coordonnées centralisés." : "Add, edit and track all your members. Photos, IDs and contact info centralized." },
    { icon: "💰", title: fr ? "Suivi des cotisations" : "Contribution tracking", desc: fr ? "Créez des périodes de cotisation, enregistrez les paiements et visualisez les statuts en temps réel." : "Create contribution periods, record payments and view statuses in real time." },
    { icon: "🧾", title: fr ? "Reçus officiels PDF" : "Official PDF receipts", desc: fr ? "Générez des reçus de paiement professionnels en un clic, prêts à imprimer ou partager." : "Generate professional payment receipts in one click, ready to print or share." },
    { icon: "🔗", title: fr ? "Inscription en autonomie" : "Self-registration", desc: fr ? "Partagez un code d'invitation : vos membres s'inscrivent eux-mêmes et rejoignent automatiquement la liste." : "Share an invite code: members register themselves and join the list automatically." },
    { icon: "📊", title: fr ? "Tableaux de bord" : "Dashboards", desc: fr ? "Statistiques claires : taux de paiement, alertes impayés, historique complet des transactions." : "Clear statistics: payment rates, unpaid alerts, full transaction history." },
    { icon: "📤", title: fr ? "Export Excel & PDF" : "Excel & PDF export", desc: fr ? "Exportez vos données en Excel ou PDF pour vos rapports d'assemblée générale." : "Export your data to Excel or PDF for your general assembly reports." },
  ];

  const steps = [
    { num: "1", icon: "🏛️", title: fr ? "Créez votre association" : "Create your association", desc: fr ? "Inscrivez-vous en 1 minute avec le nom de votre association et votre email." : "Sign up in 1 minute with your association name and email." },
    { num: "2", icon: "🔗", title: fr ? "Invitez vos membres" : "Invite your members", desc: fr ? "Partagez votre code d'invitation unique. Chaque membre crée son propre compte." : "Share your unique invite code. Each member creates their own account." },
    { num: "3", icon: "✅", title: fr ? "Gérez en toute simplicité" : "Manage with ease", desc: fr ? "Suivez les cotisations, enregistrez les paiements et générez les reçus automatiquement." : "Track contributions, record payments and generate receipts automatically." },
  ];

  const audiences = [
    {
      icon: "🏛️",
      role: fr ? "Trésorier" : "Treasurer",
      color: "#8e44ad",
      items: fr
        ? ["Créez et gérez votre association", "Ajoutez et modifiez les adhérents", "Attribuez les postes (Président, Conseiller…)", "Créez les périodes de cotisation", "Enregistrez les paiements", "Générez les reçus PDF", "Exportez les données Excel/PDF", "Gérez les accès membres"]
        : ["Create and manage your association", "Add and edit members", "Assign roles (President, Advisor…)", "Create contribution periods", "Record payments", "Generate PDF receipts", "Export Excel/PDF data", "Manage member access"],
    },
    {
      icon: "👤",
      role: fr ? "Adhérent" : "Member",
      color: "#2ecc71",
      items: fr
        ? ["Consultez votre profil personnel", "Suivez vos propres paiements", "Visualisez les cotisations de l'association", "Voyez la liste des autres membres", "Modifiez vos informations personnelles", "Changez votre mot de passe"]
        : ["View your personal profile", "Track your own payments", "View association contributions", "See the list of other members", "Edit your personal info", "Change your password"],
    },
  ];

  const faqs = fr ? [
    { q: "Est-ce gratuit ?", a: "Oui, Cotisation Pro est entièrement gratuit. Créez votre compte et commencez à gérer votre association sans frais cachés." },
    { q: "Comment mes membres rejoignent-ils l'association ?", a: "Dans votre espace admin, allez dans 'Accès membres', générez un code d'invitation et partagez-le. Vos membres cliquent sur 'Rejoindre' sur la page d'accueil et saisissent ce code." },
    { q: "Les données sont-elles sécurisées ?", a: "Vos données sont stockées sur votre propre serveur. Vous en êtes le seul propriétaire. Les mots de passe sont chiffrés avec bcrypt." },
    { q: "Un trésorier peut-il gérer plusieurs associations ?", a: "Oui, chaque compte trésorier est lié à une association distincte. Vous pouvez créer autant de comptes que nécessaire." },
    { q: "Les adhérents peuvent-ils modifier les données ?", a: "Non. Les adhérents ne peuvent modifier que leurs propres informations personnelles (nom, téléphone, photo, mot de passe). Toutes les données de l'association sont en lecture seule pour eux." },
  ] : [
    { q: "Is it free?", a: "Yes, Cotisation Pro is completely free. Create your account and start managing your association with no hidden fees." },
    { q: "How do my members join the association?", a: "In your admin space, go to 'Member Access', generate an invite code and share it. Members click 'Join' on the home page and enter this code." },
    { q: "Is the data secure?", a: "Your data is stored on your own server. You are the sole owner. Passwords are encrypted with bcrypt." },
    { q: "Can an administrator manage multiple associations?", a: "Yes, each admin account is linked to a separate association. You can create as many accounts as needed." },
    { q: "Can members edit data?", a: "No. Members can only edit their own personal information (name, phone, photo, password). All association data is read-only for them." },
  ];

  const S = {
    root: { fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: "100vh", background: "linear-gradient(160deg,#0a1628 0%,#0f1f38 50%,#0a1628 100%)", color: "#fff", overflowX: "hidden" },
    nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "66px", background: scrolled ? "rgba(8,16,30,0.97)" : "rgba(8,16,30,0.5)", backdropFilter: "blur(16px)", borderBottom: scrolled ? "1px solid rgba(52,152,219,0.18)" : "1px solid transparent", transition: "all 0.3s", boxSizing: "border-box" },
    navBrand: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
    navLogo: { height: "40px", width: "40px", objectFit: "cover", borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 0 2px rgba(52,152,219,0.4)" },
    navTitle: { fontSize: "17px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.3px" },
    navActions: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
    langSelect: { padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "18px", cursor: "pointer", fontWeight: "600", fontSize: "12px", outline: "none" },
    btnOutline: { padding: "7px 18px", background: "transparent", color: "#3498db", border: "1.5px solid #3498db", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnGreen: { padding: "7px 18px", background: "rgba(46,204,113,0.12)", color: "#2ecc71", border: "1.5px solid rgba(46,204,113,0.4)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnPrimary: { padding: "7px 18px", background: "linear-gradient(135deg,#3498db,#2980b9)", color: "#fff", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "700", fontSize: "13px", boxShadow: "0 2px 10px rgba(52,152,219,0.4)" },
    // Hero
    heroWrap: { position: "relative", textAlign: "center", padding: "100px 24px 90px", maxWidth: "820px", margin: "0 auto", overflow: "hidden" },
    orb1: { position: "absolute", top: "-80px", left: "10%", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle,rgba(52,152,219,0.18) 0%,transparent 70%)", pointerEvents: "none" },
    orb2: { position: "absolute", bottom: "-60px", right: "5%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(155,89,182,0.15) 0%,transparent 70%)", pointerEvents: "none" },
    orb3: { position: "absolute", top: "50%", left: "-8%", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle,rgba(46,204,113,0.1) 0%,transparent 70%)", pointerEvents: "none" },
    badge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(52,152,219,0.12)", color: "#3498db", border: "1px solid rgba(52,152,219,0.35)", borderRadius: "20px", padding: "5px 16px", fontSize: "13px", fontWeight: "600", marginBottom: "30px" },
    heroTitle: { fontSize: "clamp(30px,5.5vw,58px)", fontWeight: "900", lineHeight: "1.12", letterSpacing: "-1.5px", margin: "0 0 22px", color: "#fff" },
    accent: { background: "linear-gradient(90deg,#3498db,#9b59b6,#3498db)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
    heroSub: { fontSize: "18px", color: "rgba(255,255,255,0.68)", lineHeight: "1.7", margin: "0 0 44px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" },
    heroCTAs: { display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" },
    ctaPrimary: { padding: "15px 36px", background: "linear-gradient(135deg,#3498db,#2980b9)", color: "#fff", border: "none", borderRadius: "32px", cursor: "pointer", fontWeight: "700", fontSize: "16px", boxShadow: "0 4px 22px rgba(52,152,219,0.45)", transition: "transform 0.15s,box-shadow 0.15s" },
    ctaGreen: { padding: "15px 36px", background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1.5px solid rgba(46,204,113,0.45)", borderRadius: "32px", cursor: "pointer", fontWeight: "700", fontSize: "16px", transition: "all 0.15s" },
    ctaSecondary: { padding: "15px 36px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "32px", cursor: "pointer", fontWeight: "600", fontSize: "16px", transition: "all 0.15s" },
    // Stats
    statsWrap: { display: "flex", justifyContent: "center", gap: "0", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" },
    statItem: { textAlign: "center", padding: "32px 40px", borderRight: "1px solid rgba(255,255,255,0.06)" },
    statVal: { fontSize: "clamp(28px,4vw,42px)", fontWeight: "900", color: "#fff", margin: 0, lineHeight: 1 },
    statLabel: { fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px", fontWeight: "500" },
    // Section
    section: { padding: "90px 24px", maxWidth: "1080px", margin: "0 auto" },
    sectionLabel: { textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#3498db", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" },
    sectionTitle: { textAlign: "center", fontSize: "clamp(22px,3.5vw,38px)", fontWeight: "800", color: "#fff", margin: "0 0 54px", letterSpacing: "-0.5px", lineHeight: "1.2" },
    // Feature grid
    featGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" },
    featCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px 26px", transition: "transform 0.2s,border-color 0.2s,box-shadow 0.2s" },
    featIconBox: { width: "52px", height: "52px", borderRadius: "14px", background: "rgba(52,152,219,0.12)", border: "1px solid rgba(52,152,219,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", marginBottom: "18px" },
    featTitle: { fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "8px" },
    featDesc: { fontSize: "14px", color: "rgba(255,255,255,0.58)", lineHeight: "1.65" },
    // Steps
    stepsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0", position: "relative" },
    stepCard: { textAlign: "center", padding: "32px 24px", position: "relative" },
    stepCircle: { width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg,#3498db,#2980b9)", color: "#fff", fontSize: "28px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 6px 20px rgba(52,152,219,0.4)" },
    stepTitle: { fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "10px" },
    stepDesc: { fontSize: "14px", color: "rgba(255,255,255,0.58)", lineHeight: "1.65" },
    // Audience
    audienceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "24px" },
    audienceCard: { borderRadius: "20px", padding: "36px 32px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" },
    audienceRole: { fontSize: "20px", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" },
    audienceItem: { display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "rgba(255,255,255,0.75)" },
    checkIcon: { fontSize: "16px", flexShrink: 0, marginTop: "1px" },
    // FAQ
    faqWrap: { maxWidth: "740px", margin: "0 auto" },
    faqItem: { borderBottom: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" },
    faqQ: { width: "100%", background: "none", border: "none", color: "#fff", textAlign: "left", padding: "20px 4px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
    faqA: { fontSize: "14px", color: "rgba(255,255,255,0.62)", lineHeight: "1.7", paddingBottom: "18px", paddingLeft: "4px" },
    // CTA bottom
    ctaBottom: { textAlign: "center", padding: "90px 24px", background: "linear-gradient(135deg,rgba(52,152,219,0.1) 0%,rgba(155,89,182,0.08) 100%)", borderTop: "1px solid rgba(52,152,219,0.12)" },
    // Footer
    footer: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 32px 32px", maxWidth: "1080px", margin: "0 auto" },
    footerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "40px", marginBottom: "40px" },
    footerBrand: { fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "10px" },
    footerTagline: { fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" },
    footerColTitle: { fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" },
    footerLink: { display: "block", fontSize: "14px", color: "rgba(255,255,255,0.55)", marginBottom: "8px", cursor: "pointer", background: "none", border: "none", padding: 0, textAlign: "left", transition: "color 0.15s" },
    footerBottom: { borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "rgba(255,255,255,0.3)" },
  };

  const stats = fr
    ? [{ val: "100%", label: "Gratuit" }, { val: "∞", label: "Adhérents" }, { val: "PDF", label: "Reçus officiels" }, { val: "2FA", label: "Données sécurisées" }]
    : [{ val: "100%", label: "Free" }, { val: "∞", label: "Members" }, { val: "PDF", label: "Official receipts" }, { val: "2FA", label: "Secure data" }];

  return (
    <div style={S.root}>
      <style>{`
        @keyframes lp-fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes lp-gradientMove {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes lp-orbPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.14); }
        }
        @keyframes lp-ctaPulse {
          0%, 100% { box-shadow: 0 4px 22px rgba(52,152,219,0.45); }
          50%       { box-shadow: 0 8px 42px rgba(52,152,219,0.75); }
        }
        @keyframes lp-badgeGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,152,219,0); border-color: rgba(52,152,219,0.35); }
          50%       { box-shadow: 0 0 14px 3px rgba(52,152,219,0.22); border-color: rgba(52,152,219,0.65); }
        }
        @keyframes lp-particleFloat {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.18; }
          33%       { transform: translate(10px,-22px) scale(1.3); opacity: 0.45; }
          66%       { transform: translate(-8px,-38px) scale(0.85); opacity: 0.22; }
        }
        @keyframes lp-particleFloat2 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.14; }
          40%       { transform: translate(-14px,-28px) scale(1.2); opacity: 0.38; }
          80%       { transform: translate(10px,-42px) scale(0.9); opacity: 0.2; }
        }
        @keyframes lp-shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        /* ── Hero persistent (loads immediately) ── */
        .lp-hero-badge { animation: lp-float 3.5s ease-in-out infinite, lp-fadeInUp 0.5s ease 0.1s both, lp-badgeGlow 3s ease-in-out infinite; }
        .lp-hero-title { animation: lp-fadeInUp 0.7s ease 0.2s both; }
        .lp-hero-sub   { animation: lp-fadeInUp 0.7s ease 0.35s both; }
        .lp-hero-ctas  { animation: lp-fadeInUp 0.7s ease 0.5s both; }
        /* ── Orbs ── */
        .lp-orb1 { animation: lp-orbPulse 7s ease-in-out infinite; }
        .lp-orb2 { animation: lp-orbPulse 9s ease-in-out 1.5s infinite; }
        .lp-orb3 { animation: lp-orbPulse 11s ease-in-out 3s infinite; }
        /* ── Accent gradient ── */
        .lp-accent {
          background: linear-gradient(90deg,#3498db,#9b59b6,#2ecc71,#e67e22,#3498db);
          background-size: 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-gradientMove 5s ease infinite;
        }
        /* ── CTA ── */
        .lp-cta-primary { animation: lp-ctaPulse 2.8s ease-in-out infinite; }
        /* ── Particles (hero) ── */
        .lp-particle { position: absolute; border-radius: 50%; pointer-events: none; }
        .lp-p1 { width:6px;  height:6px;  background:#3498db; top:18%; left:12%;  animation: lp-particleFloat  5s ease-in-out infinite; }
        .lp-p2 { width:4px;  height:4px;  background:#9b59b6; top:28%; right:18%; animation: lp-particleFloat2 6.5s ease-in-out infinite; }
        .lp-p3 { width:8px;  height:8px;  background:#2ecc71; top:62%; left:7%;   animation: lp-particleFloat  7s ease-in-out 1s infinite; }
        .lp-p4 { width:5px;  height:5px;  background:#e67e22; top:72%; right:14%; animation: lp-particleFloat2 4.5s ease-in-out 0.5s infinite; }
        .lp-p5 { width:7px;  height:7px;  background:#3498db; top:48%; left:88%;  animation: lp-particleFloat  8s ease-in-out 2s infinite; }
        /* ── Particles pleine page (fixed = toujours visibles au scroll) ── */
        .lp-fp { position: fixed; border-radius: 50%; pointer-events: none; z-index: 1; }
        .lp-fp1  { width:5px; height:5px; background:#3498db; top:8%;  left:6%;  animation: lp-particleFloat  6s ease-in-out infinite; }
        .lp-fp2  { width:4px; height:4px; background:#9b59b6; top:18%; right:7%; animation: lp-particleFloat2 8s ease-in-out 1s infinite; }
        .lp-fp3  { width:6px; height:6px; background:#2ecc71; top:30%; left:4%;  animation: lp-particleFloat  9s ease-in-out 2s infinite; }
        .lp-fp4  { width:4px; height:4px; background:#e67e22; top:42%; right:5%; animation: lp-particleFloat2 7s ease-in-out 0.5s infinite; }
        .lp-fp5  { width:7px; height:7px; background:#3498db; top:55%; left:3%;  animation: lp-particleFloat  5s ease-in-out 3s infinite; }
        .lp-fp6  { width:4px; height:4px; background:#e74c3c; top:68%; right:6%; animation: lp-particleFloat2 6s ease-in-out 1.5s infinite; }
        .lp-fp7  { width:5px; height:5px; background:#1abc9c; top:80%; left:8%;  animation: lp-particleFloat  8s ease-in-out 4s infinite; }
        .lp-fp8  { width:4px; height:4px; background:#f39c12; top:90%; right:9%; animation: lp-particleFloat2 7s ease-in-out 2.5s infinite; }
        .lp-fp9  { width:5px; height:5px; background:#9b59b6; top:22%; left:93%; animation: lp-particleFloat  9s ease-in-out 1s infinite; }
        .lp-fp10 { width:4px; height:4px; background:#3498db; top:48%; left:95%; animation: lp-particleFloat2 6s ease-in-out 3.5s infinite; }
        .lp-fp11 { width:6px; height:6px; background:#2ecc71; top:72%; left:92%; animation: lp-particleFloat  7s ease-in-out 2s infinite; }
        .lp-fp12 { width:3px; height:3px; background:#e67e22; top:60%; left:50%; animation: lp-particleFloat2 10s ease-in-out 0s infinite; }
        /* ── Shimmer bar (persistent divider) ── */
        .lp-shimmer-bar {
          height: 3px; border-radius: 2px; margin: 0 auto 0;
          background: linear-gradient(90deg,transparent,rgba(52,152,219,0.7),rgba(155,89,182,0.6),transparent);
          background-size: 200% auto;
          animation: lp-shimmerBar 2.5s linear infinite;
        }
        /* ── Ambient section orbs (persistent everywhere) ── */
        .lp-amb { position: absolute; border-radius: 50%; pointer-events: none; }
        .lp-amb-bl { background: radial-gradient(circle, rgba(52,152,219,0.14) 0%, transparent 70%); animation: lp-orbPulse  8s ease-in-out infinite; }
        .lp-amb-pu { background: radial-gradient(circle, rgba(155,89,182,0.12) 0%, transparent 70%); animation: lp-orbPulse 10s ease-in-out 2s infinite; }
        .lp-amb-gr { background: radial-gradient(circle, rgba(46,204,113,0.10) 0%, transparent 70%); animation: lp-orbPulse 12s ease-in-out 4s infinite; }
        .lp-amb-go { background: radial-gradient(circle, rgba(241,196,15,0.08) 0%, transparent 70%); animation: lp-orbPulse  9s ease-in-out 1s infinite; }
        /* ── Card glow (persistent on cards) ── */
        @keyframes lp-cardGlow {
          0%, 100% { box-shadow: 0 2px 16px rgba(0,0,0,0.1); }
          50%       { box-shadow: 0 4px 32px rgba(52,152,219,0.2); }
        }
        .lp-card-glow { animation: lp-cardGlow 4s ease-in-out infinite; }
        .lp-card-glow:nth-child(2) { animation-delay: 0.7s; }
        .lp-card-glow:nth-child(3) { animation-delay: 1.4s; }
        .lp-card-glow:nth-child(4) { animation-delay: 2.1s; }
        .lp-card-glow:nth-child(5) { animation-delay: 2.8s; }
        .lp-card-glow:nth-child(6) { animation-delay: 3.5s; }
      `}</style>

      {/* ── PARTICULES PLEINE PAGE ── */}
      <div className="lp-fp lp-fp1" /><div className="lp-fp lp-fp2" /><div className="lp-fp lp-fp3" />
      <div className="lp-fp lp-fp4" /><div className="lp-fp lp-fp5" /><div className="lp-fp lp-fp6" />
      <div className="lp-fp lp-fp7" /><div className="lp-fp lp-fp8" /><div className="lp-fp lp-fp9" />
      <div className="lp-fp lp-fp10" /><div className="lp-fp lp-fp11" /><div className="lp-fp lp-fp12" />

      {/* ── NAVBAR ── */}
      <nav style={S.nav} className="landing-nav">
        <div style={S.navBrand}>
          <img src={logo} alt="Logo" style={S.navLogo} className="landing-nav-logo" />
          <span style={S.navTitle} className="landing-nav-title">Cotisation Pro</span>
        </div>
        <div style={S.navActions} className="landing-nav-actions">
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={S.langSelect} className="lang-select">
            <option value="fr" style={{ background: "#0a1628" }}>🇫🇷 FR</option>
            <option value="en" style={{ background: "#0a1628" }}>🇬🇧 EN</option>
          </select>
          <button style={S.btnOutline} onClick={onLogin}>{fr ? "Connexion" : "Login"}</button>
          <button style={S.btnGreen} onClick={onJoin}>🔗 {fr ? "Rejoindre" : "Join"}</button>
          <button style={S.btnPrimary} onClick={onRegister}>{fr ? "Créer un compte" : "Create account"}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={S.heroWrap}>
        <div style={S.orb1} className="lp-orb1" />
        <div style={S.orb2} className="lp-orb2" />
        <div style={S.orb3} className="lp-orb3" />
        <div className="lp-particle lp-p1" />
        <div className="lp-particle lp-p2" />
        <div className="lp-particle lp-p3" />
        <div className="lp-particle lp-p4" />
        <div className="lp-particle lp-p5" />
        <div style={S.badge} className="lp-hero-badge">
          <span>✨</span>
          <span>{fr ? "Solution complète pour les associations" : "Complete solution for associations"}</span>
        </div>
        <h1 style={S.heroTitle} className="lp-hero-title">
          {fr ? <>Gérez les cotisations<br /><span className="lp-accent">en toute simplicité</span></> : <>Manage contributions<br /><span className="lp-accent">with ease</span></>}
        </h1>
        <p style={S.heroSub} className="lp-hero-sub">
          {fr
            ? "Cotisation Pro centralise vos adhérents, vos paiements et vos reçus dans un seul espace. Simple, gratuit, efficace."
            : "Cotisation Pro centralizes your members, payments and receipts in one place. Simple, free, efficient."}
        </p>
        <div style={S.heroCTAs} className="lp-hero-ctas">
          <button style={S.ctaPrimary} className="lp-cta-primary" {...btnHover()} onClick={onRegister}>
            🏛️ {fr ? "Créer mon association" : "Create my association"} →
          </button>
          <button style={S.ctaGreen}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(46,204,113,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(46,204,113,0.1)"; }}
            onClick={onJoin}>
            🔗 {fr ? "Rejoindre une association" : "Join an association"}
          </button>
          <button style={S.ctaSecondary}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onClick={onLogin}>
            {fr ? "Se connecter" : "Sign in"}
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ ...S.statsWrap, position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-bl" style={{ width:"380px",height:"380px",top:"-150px",left:"-80px" }} />
        <div className="lp-amb lp-amb-pu" style={{ width:"320px",height:"320px",bottom:"-100px",right:"-60px" }} />
        {stats.map((s, i) => (
          <InView key={i} delay={i * 0.1} style={{ ...S.statItem, borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <p style={S.statVal}>{s.val}</p>
            <p style={S.statLabel}>{s.label}</p>
          </InView>
        ))}
      </div>

      {/* ── FONCTIONNALITÉS ── */}
      <div style={{ ...S.section, background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", maxWidth: "100%", padding: "90px 24px", position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-bl" style={{ width:"600px",height:"600px",top:"-220px",right:"-160px" }} />
        <div className="lp-amb lp-amb-pu" style={{ width:"500px",height:"500px",bottom:"-180px",left:"-130px" }} />
        <div className="lp-amb lp-amb-gr" style={{ width:"360px",height:"360px",top:"50%",right:"8%" }} />
        <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative" }}>
          <InView><p style={S.sectionLabel}>{fr ? "Fonctionnalités" : "Features"}</p></InView>
          <InView delay={0.12}><h2 style={S.sectionTitle}>{fr ? "Tout ce dont vous avez besoin" : "Everything you need"}</h2></InView>
          <div style={{ ...S.featGrid, marginTop: "8px" }}>
            <div className="lp-shimmer-bar" style={{ gridColumn: "1/-1", marginBottom: "28px" }} />
            {features.map((f, i) => (
              <InView key={i} delay={i * 0.1}>
                <div className="lp-card-glow" style={S.featCard}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(52,152,219,0.3)"; e.currentTarget.style.boxShadow = ""; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={S.featIconBox}>{f.icon}</div>
                  <div style={S.featTitle}>{f.title}</div>
                  <div style={S.featDesc}>{f.desc}</div>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div style={{ ...S.section, position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-go" style={{ width:"420px",height:"420px",top:"-110px",right:"-90px" }} />
        <div className="lp-amb lp-amb-bl" style={{ width:"360px",height:"360px",bottom:"-110px",left:"-80px" }} />
        <div style={{ position: "relative" }}>
          <div className="lp-shimmer-bar" style={{ width:"100px",marginBottom:"36px" }} />
          <InView><p style={S.sectionLabel}>{fr ? "Démarrage rapide" : "Quick start"}</p></InView>
          <InView delay={0.12}><h2 style={S.sectionTitle}>{fr ? "Lancez-vous en 3 étapes" : "Get started in 3 steps"}</h2></InView>
          <div style={S.stepsRow}>
            {steps.map((s, i) => (
              <InView key={i} delay={i * 0.15}>
                <div style={S.stepCard}>
                  <div style={S.stepCircle}>{s.icon}</div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#3498db", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>{fr ? `Étape ${s.num}` : `Step ${s.num}`}</div>
                  <div style={S.stepTitle}>{s.title}</div>
                  <div style={S.stepDesc}>{s.desc}</div>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </div>

      {/* ── POUR QUI ? ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "90px 24px", position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-pu" style={{ width:"520px",height:"520px",top:"-160px",left:"-130px" }} />
        <div className="lp-amb lp-amb-gr" style={{ width:"460px",height:"460px",bottom:"-160px",right:"-110px" }} />
        <div className="lp-amb lp-amb-bl" style={{ width:"300px",height:"300px",top:"50%",right:"5%" }} />
        <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative" }}>
          <div className="lp-shimmer-bar" style={{ width:"100px",marginBottom:"36px" }} />
          <InView><p style={S.sectionLabel}>{fr ? "Pour qui ?" : "Who is it for?"}</p></InView>
          <InView delay={0.12}><h2 style={S.sectionTitle}>{fr ? "Deux profils, une seule plateforme" : "Two profiles, one platform"}</h2></InView>
          <div style={S.audienceGrid}>
            {audiences.map((a, i) => (
              <InView key={i} delay={i * 0.15}>
                <div className="lp-card-glow" style={{ ...S.audienceCard, borderColor: `${a.color}30`, background: `${a.color}06` }}>
                  <div style={{ ...S.audienceRole, color: a.color }}>
                    <span style={{ fontSize: "28px" }}>{a.icon}</span>
                    <span>{a.role}</span>
                  </div>
                  {a.items.map((item, j) => (
                    <div key={j} style={S.audienceItem}>
                      <span style={{ ...S.checkIcon, color: a.color }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                  <button
                    style={{ marginTop: "28px", width: "100%", padding: "12px", background: i === 0 ? "linear-gradient(135deg,#3498db,#2980b9)" : "linear-gradient(135deg,#27ae60,#2ecc71)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer", boxShadow: `0 4px 16px ${a.color}40` }}
                    onClick={i === 0 ? onRegister : onJoin}
                  >
                    {i === 0 ? (fr ? "Créer mon association →" : "Create my association →") : (fr ? "Rejoindre avec un code →" : "Join with a code →")}
                  </button>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </div>

      {/* ── TÉMOIGNAGES ── */}
      <div style={{ padding: "90px 24px", background: "rgba(52,152,219,0.03)", borderTop: "1px solid rgba(52,152,219,0.08)", borderBottom: "1px solid rgba(52,152,219,0.08)", position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-bl" style={{ width:"520px",height:"520px",top:"-160px",right:"-130px" }} />
        <div className="lp-amb lp-amb-go" style={{ width:"420px",height:"420px",bottom:"-130px",left:"-110px" }} />
        <div className="lp-amb lp-amb-pu" style={{ width:"300px",height:"300px",top:"40%",left:"5%" }} />
        <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative" }}>
          <div className="lp-shimmer-bar" style={{ width:"100px",marginBottom:"36px" }} />
          <InView><p style={S.sectionLabel}>{fr ? "Ils nous font confiance" : "They trust us"}</p></InView>
          <InView delay={0.12}><h2 style={S.sectionTitle}>{fr ? "Ce que disent nos utilisateurs" : "What our users say"}</h2></InView>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px" }}>
            {[
              { name: fr ? "Koné A." : "Koné A.", role: fr ? "Secrétaire, Amicale INPHB" : "Secretary, INPHB Alumni", text: fr ? "Cotisation Pro nous a permis de passer de cahiers Excel désorganisés à un suivi clair et professionnel. Les reçus PDF sont un vrai plus !" : "Cotisation Pro took us from messy Excel sheets to clear, professional tracking. The PDF receipts are a great feature!" },
              { name: fr ? "Traoré M." : "Traoré M.", role: fr ? "Trésorier, Association Culturelle" : "Treasurer, Cultural Association", text: fr ? "Fini les erreurs de saisie et les oublis. Je vois en un coup d'œil qui a payé et qui doit encore régler sa cotisation." : "No more input errors and missed payments. I can see at a glance who paid and who still owes their contribution." },
              { name: fr ? "Yao B." : "Yao B.", role: fr ? "Président, Tontine Solidarité" : "President, Solidarity Tontine", text: fr ? "L'inscription des membres par code d'invitation est brillante. Chacun crée son compte en autonomie, sans passer par moi." : "The invite-code member registration is brilliant. Everyone sets up their own account independently, without going through me." },
            ].map((t, i) => (
              <InView key={i} delay={i * 0.12}>
                <div className="lp-card-glow" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(52,152,219,0.15)", borderRadius: "20px", padding: "28px 24px", transition: "transform 0.2s,box-shadow 0.2s", height: "100%", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ fontSize: "22px", color: "#f1c40f", marginBottom: "14px", letterSpacing: "2px" }}>★★★★★</div>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)", lineHeight: "1.75", margin: "0 0 20px", fontStyle: "italic" }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: `linear-gradient(135deg,#3498db,#9b59b6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", fontWeight: "700", flexShrink: 0 }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#fff" }}>{t.name}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ ...S.section, position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-pu" style={{ width:"460px",height:"460px",top:"-130px",right:"-110px" }} />
        <div className="lp-amb lp-amb-bl" style={{ width:"390px",height:"390px",bottom:"-110px",left:"-90px" }} />
        <div style={{ position: "relative" }}>
          <div className="lp-shimmer-bar" style={{ width:"100px",marginBottom:"36px" }} />
          <InView><p style={S.sectionLabel}>FAQ</p></InView>
          <InView delay={0.12}><h2 style={S.sectionTitle}>{fr ? "Questions fréquentes" : "Frequently asked questions"}</h2></InView>
          <div style={S.faqWrap}>
            {faqs.map((item, i) => (
              <InView key={i} delay={i * 0.07}>
                <div style={S.faqItem}>
                  <button style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <span style={{ fontSize: "20px", color: "#3498db", flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
                  </button>
                  {openFaq === i && <div style={S.faqA}>{item.a}</div>}
                </div>
              </InView>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BAS ── */}
      <div style={{ ...S.ctaBottom, position: "relative", overflow: "hidden" }}>
        <div className="lp-amb lp-amb-bl" style={{ width:"500px",height:"500px",top:"-160px",left:"-120px" }} />
        <div className="lp-amb lp-amb-pu" style={{ width:"450px",height:"450px",top:"-140px",right:"-110px" }} />
        <div className="lp-amb lp-amb-gr" style={{ width:"350px",height:"350px",bottom:"-120px",left:"30%" }} />
        <div style={{ position: "relative" }}>
        <div className="lp-shimmer-bar" style={{ width: "80px", marginBottom: "32px" }} />
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#3498db", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px" }}>
          {fr ? "Prêt à démarrer ?" : "Ready to get started?"}
        </div>
        <h2 style={{ fontSize: "clamp(26px,4vw,46px)", fontWeight: "900", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px" }}>
          {fr ? "Votre association mérite le meilleur" : "Your association deserves the best"}
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.6)", margin: "0 0 40px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.65" }}>
          {fr ? "Rejoignez les associations qui font confiance à Cotisation Pro pour gérer leurs membres et leurs paiements." : "Join associations that trust Cotisation Pro to manage their members and payments."}
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ ...S.ctaPrimary, fontSize: "16px" }} className="lp-cta-primary" {...btnHover()} onClick={onRegister}>
            🏛️ {fr ? "Créer mon association" : "Create my association"} →
          </button>
          <button style={{ ...S.ctaGreen, fontSize: "16px", padding: "15px 36px", borderRadius: "32px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(46,204,113,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(46,204,113,0.1)"; }}
            onClick={onJoin}>
            🔗 {fr ? "Rejoindre une association" : "Join an association"}
          </button>
        </div>
        <div className="lp-shimmer-bar" style={{ width: "80px", marginTop: "36px" }} />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "56px 32px 32px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={S.footerGrid}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <img src={logo} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                <span style={S.footerBrand}>Cotisation Pro</span>
              </div>
              <p style={S.footerTagline}>{fr ? "La solution simple et gratuite pour gérer les cotisations de votre association." : "The simple, free solution to manage your association's contributions."}</p>
            </div>
            {/* Navigation */}
            <div>
              <div style={S.footerColTitle}>{fr ? "Navigation" : "Navigation"}</div>
              <button style={S.footerLink} onClick={onLogin}
                onMouseEnter={(e) => e.currentTarget.style.color = "#3498db"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
                {fr ? "Se connecter" : "Sign in"}
              </button>
              <button style={S.footerLink} onClick={onRegister}
                onMouseEnter={(e) => e.currentTarget.style.color = "#3498db"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
                {fr ? "Créer un compte" : "Create account"}
              </button>
              <button style={S.footerLink} onClick={onJoin}
                onMouseEnter={(e) => e.currentTarget.style.color = "#2ecc71"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
                {fr ? "Rejoindre une association" : "Join an association"}
              </button>
            </div>
            {/* Fonctionnalités */}
            <div>
              <div style={S.footerColTitle}>{fr ? "Fonctionnalités" : "Features"}</div>
              {(fr
                ? ["Gestion des adhérents", "Suivi des cotisations", "Reçus PDF", "Export Excel", "Tableau de bord"]
                : ["Member management", "Contribution tracking", "PDF receipts", "Excel export", "Dashboard"]
              ).map((item) => (
                <div key={item} style={{ ...S.footerLink, cursor: "default", marginBottom: "7px" }}>{item}</div>
              ))}
            </div>
            {/* Contact */}
            <div>
              <div style={S.footerColTitle}>Contact</div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.7", margin: 0 }}>
                kouamekouakouelise97@gmail.com
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <div style={{ padding: "6px 14px", background: "rgba(52,152,219,0.12)", border: "1px solid rgba(52,152,219,0.25)", borderRadius: "20px", fontSize: "12px", color: "#3498db", fontWeight: "600" }}>
                  {fr ? "Gratuit" : "Free"}
                </div>
                <div style={{ padding: "6px 14px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: "20px", fontSize: "12px", color: "#2ecc71", fontWeight: "600" }}>
                  {fr ? "Sécurisé" : "Secure"}
                </div>
              </div>
            </div>
          </div>
          <div style={S.footerBottom}>
            <span>© {new Date().getFullYear()} Cotisation Pro. {fr ? "Tous droits réservés." : "All rights reserved."}</span>
            <span>{fr ? "Fait avec ❤️ pour les associations" : "Made with ❤️ for associations"}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// ICÔNES ŒIL — réutilisables dans toute l'app
// ═══════════════════════════════════════════════════════
const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const pwdOk = (pwd) => pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd);

// ═══════════════════════════════════════════════════════
// PAGE D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════
const frTerms = [
  { title: "1. Objet du service", text: "Cotisation Pro est une application locale de gestion des cotisations pour les associations. Elle permet de gérer les adhérents, d'enregistrer les paiements et de générer des reçus officiels." },
  { title: "2. Création et gestion du compte", text: "Pour utiliser le service, vous devez créer un compte avec une adresse email valide et un nom d'association. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte. Vous vous engagez à fournir des informations exactes lors de l'inscription." },
  { title: "3. Données personnelles", text: "Les données saisies (informations des adhérents, montants des cotisations) sont stockées localement sur votre propre serveur. Vous êtes seul responsable de leur sécurité et de leur conformité avec la réglementation applicable (RGPD et toute loi locale sur la protection des données)." },
  { title: "4. Utilisation acceptable", text: "Vous vous engagez à utiliser l'application uniquement dans le cadre légal et pour la gestion de votre association. Il est strictement interdit d'utiliser l'application à des fins frauduleuses, de tenter de contourner les mesures de sécurité, ou de nuire au bon fonctionnement du service." },
  { title: "5. Limitation de responsabilité", text: "L'application est fournie « en l'état », sans garantie d'aucune sorte. Le développeur ne saurait être tenu responsable des pertes de données, des interruptions de service ou de tout dommage direct ou indirect lié à l'utilisation de l'application." },
  { title: "6. Contact", text: "Pour toute question relative à ces conditions d'utilisation, vous pouvez contacter le développeur à l'adresse : kouamekouakouelise97@gmail.com" },
];

const enTerms = [
  { title: "1. Service Purpose", text: "Cotisation Pro is a local contribution management application for associations. It allows you to manage members, record payments and generate official receipts." },
  { title: "2. Account Creation and Management", text: "To use the service, you must create an account with a valid email address and an association name. You are responsible for the confidentiality of your credentials and all activities performed from your account. You agree to provide accurate information during registration." },
  { title: "3. Personal Data", text: "The data you enter (member information, contribution amounts) is stored locally on your own server. You are solely responsible for its security and compliance with applicable regulations (GDPR and any local data protection laws)." },
  { title: "4. Acceptable Use", text: "You agree to use the application only within a legal framework and for the management of your association. It is strictly prohibited to use the application for fraudulent purposes, to attempt to bypass security measures, or to disrupt the proper functioning of the service." },
  { title: "5. Limitation of Liability", text: "The application is provided 'as is', without warranty of any kind. The developer shall not be liable for data loss, service interruptions or any direct or indirect damage related to the use of the application." },
  { title: "6. Contact", text: "For any questions regarding these terms of use, you can contact the developer at: kouamekouakouelise97@gmail.com" },
];

function TermsModal({ lang, t, onClose, onAccept }) {
  const sections = lang === "fr" ? frTerms : enTerms;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box" }}>
      <div style={{ background: "white", borderRadius: "18px", width: "100%", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 48px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #f0f3f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#2c3e50", fontWeight: "bold" }}>{t("termsModalTitle")}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#95a5a6", padding: "4px 8px", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1, lineHeight: "1.65", fontSize: "14px", color: "#444" }}>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#2c3e50", marginBottom: "8px", marginTop: 0 }}>{s.title}</h3>
              <p style={{ margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #f0f3f7", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #e0e6ed", background: "white", color: "#7f8c8d", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            {t("termsCloseBtn")}
          </button>
          <button onClick={onAccept} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#2c3e50,#3498db)", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
            {t("termsAcceptBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ API_BASE, onSuccess, lang, t, setLang, initialMode = "login", onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // "login" | "register" | "reset" | "join"
  const [form, setForm] = useState({ email: "", mot_de_passe: "", confirmer_mot_de_passe: "", nom_association: "", nom: "", prenom: "", telephone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [resetForm, setResetForm] = useState({ email: "", nom_association: "", nouveau_mot_de_passe: "", confirmer: "" });
  const [resetStep, setResetStep] = useState("identity"); // "identity" | "password"
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ invite_token: "", nom: "", prenom: "", email: "", telephone: "", mot_de_passe: "", confirmer: "" });
  const [joinShowPwd, setJoinShowPwd] = useState(false);
  const [joinShowPwd2, setJoinShowPwd2] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value.trimStart() });
  const handleResetChange = (e) => setResetForm({ ...resetForm, [e.target.name]: e.target.value.trimStart() });
  const handleJoinChange = (e) => setJoinForm({ ...joinForm, [e.target.name]: e.target.value.trimStart() });

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    if (!joinForm.invite_token.trim()) { setError(lang === "fr" ? "Code d'invitation requis." : "Invite code required."); return; }
    if (!joinForm.nom.trim() || !joinForm.prenom.trim()) { setError(lang === "fr" ? "Nom et prénom obligatoires." : "First and last name required."); return; }
    if (!joinForm.email.trim() && !joinForm.telephone.trim()) { setError(lang === "fr" ? "Email ou téléphone requis." : "Email or phone required."); return; }
    if (!joinForm.mot_de_passe || !pwdOk(joinForm.mot_de_passe)) { setError(t("passwordMinLength")); return; }
    if (joinForm.mot_de_passe !== joinForm.confirmer) { setError(t("passwordsNoMatch")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: joinForm.invite_token.trim(),
          nom: joinForm.nom.trim(),
          prenom: joinForm.prenom.trim(),
          email: joinForm.email.trim() || undefined,
          telephone: joinForm.telephone.trim() || undefined,
          mot_de_passe: joinForm.mot_de_passe,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          const identifier = joinForm.email.trim() || joinForm.telephone.trim();
          setForm(f => ({ ...f, email: identifier }));
          setMode("login");
          setSuccessMsg(lang === "fr"
            ? "Vous avez déjà un compte. Connectez-vous avec votre email et mot de passe."
            : "You already have an account. Sign in with your email and password.");
          return;
        }
        setError(data.error || t("networkErrorShort"));
        return;
      }
      onSuccess(data, "register");
    } catch { setError(t("networkError")); }
    finally { setLoading(false); }
  };

  // Inscription directe (sans OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nom_association.trim() || !form.email.trim() || !form.mot_de_passe) { setError(t("allFieldsRequired")); return; }
    if (!form.nom.trim() || !form.prenom.trim()) { setError(t("treasurerRequired")); return; }
    if (form.mot_de_passe !== form.confirmer_mot_de_passe) { setError(t("passwordsNoMatch")); return; }
    if (!pwdOk(form.mot_de_passe)) { setError(t("passwordMinLength")); return; }
    if (!termsAccepted) { setError(t("termsNotAccepted")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_association: form.nom_association.trim(),
          email: form.email.trim(),
          mot_de_passe: form.mot_de_passe,
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          telephone: form.telephone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("networkErrorShort")); return; }
      onSuccess(data, "register");
    } catch { setError(t("networkError")); }
    finally { setLoading(false); }
  };

  // Connexion uniquement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.mot_de_passe) { setError(t("emailPasswordRequired")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), mot_de_passe: form.mot_de_passe }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("networkErrorShort")); return; }
      onSuccess(data, "login");
    } catch { setError(t("networkError")); }
    finally { setLoading(false); }
  };

  // Étape 1 — vérifier email + nom association
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetForm.email.trim() || !resetForm.nom_association.trim()) { setError(t("emailAssocRequired")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetForm.email.trim(), nom_association: resetForm.nom_association.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("incorrectEmailAssoc")); return; }
      setResetStep("password");
    } catch { setError(t("networkError")); }
    finally { setLoading(false); }
  };

  // Étape 2 — saisir et enregistrer le nouveau mot de passe
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetForm.nouveau_mot_de_passe || !pwdOk(resetForm.nouveau_mot_de_passe)) { setError(t("passwordMinLength")); return; }
    if (resetForm.nouveau_mot_de_passe !== resetForm.confirmer) { setError(t("passwordsNoMatch")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetForm.email.trim(), nom_association: resetForm.nom_association.trim(), nouveau_mot_de_passe: resetForm.nouveau_mot_de_passe }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("errorReset")); return; }
      setMode("login");
      setResetStep("identity");
      setResetForm({ email: "", nom_association: "", nouveau_mot_de_passe: "", confirmer: "" });
      setSuccessMsg(t("passwordResetSuccess"));
    } catch { setError(t("networkError")); }
    finally { setLoading(false); }
  };

  // ── Formulaire mot de passe oublié — Étape 1 : vérification identité ──
  if (mode === "reset" && resetStep === "identity") {
    return (
      <div style={{ position: "relative" }}>
        <div style={authSt.page}>
          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
            <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{ padding: "6px 28px 6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }}
                className="lang-select"
              >
                <option value="fr" style={{ background: "#1a2d46" }}>🇫🇷 FR</option>
                <option value="en" style={{ background: "#1a2d46" }}>🇬🇧 EN</option>
              </select>
          </div>
          <div style={authSt.card}>
            <div style={authSt.cardHeader}>
              <img src={logo} alt="" style={authSt.cardLogo} />
              <div>
                <h2 style={authSt.cardTitle}>{t("forgotPassword")}</h2>
                <p style={authSt.cardSub}>{t("step1of2")}</p>
              </div>
            </div>
            <form onSubmit={handleVerifyIdentity}>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("emailAddress")}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="email" name="email" value={resetForm.email} onChange={handleResetChange} placeholder="votre@email.com" autoFocus />
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("associationName")}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="text" name="nom_association" value={resetForm.nom_association} onChange={handleResetChange} placeholder={t("exactAssocName")} />
                </div>
              </div>
              {error && <div style={authSt.error}>⚠️ {error}</div>}
              <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? t("verifying") : t("verifyIdentity")}
              </button>
            </form>
            <p style={authSt.switchText}>
              <button style={authSt.switchLink} onClick={() => { setMode("login"); setResetStep("identity"); setError(""); }}>
                {t("backToLogin")}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire mot de passe oublié — Étape 2 : nouveau mot de passe ──
  if (mode === "reset" && resetStep === "password") {
    return (
      <div style={{ position: "relative" }}>
        <div style={authSt.page}>
          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
            <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{ padding: "6px 28px 6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }}
                className="lang-select"
              >
                <option value="fr" style={{ background: "#1a2d46" }}>🇫🇷 FR</option>
                <option value="en" style={{ background: "#1a2d46" }}>🇬🇧 EN</option>
              </select>
          </div>
          <div style={authSt.card}>
            <div style={authSt.cardHeader}>
              <img src={logo} alt="" style={authSt.cardLogo} />
              <div>
                <h2 style={authSt.cardTitle}>{t("newPassword")}</h2>
                <p style={authSt.cardSub}>{t("step2of2")}</p>
              </div>
            </div>
            <form onSubmit={handleReset}>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("newPassword")}</label>
                <div style={authSt.inputBox}>
                  <input style={{ ...authSt.input, paddingRight: "44px" }} type={showNewPwd ? "text" : "password"} name="nouveau_mot_de_passe" value={resetForm.nouveau_mot_de_passe} onChange={handleResetChange} placeholder={t("minChars")} autoFocus />
                  <button type="button" style={authSt.eyeBtn} onClick={() => setShowNewPwd((v) => !v)}>{showNewPwd ? <EyeOff /> : <EyeOpen />}</button>
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("confirmPassword")}</label>
                <div style={authSt.inputBox}>
                  <input style={{ ...authSt.input, paddingRight: "44px" }} type={showNewPwd2 ? "text" : "password"} name="confirmer" value={resetForm.confirmer} onChange={handleResetChange} placeholder={t("repeatNewPassword")} />
                  <button type="button" style={authSt.eyeBtn} onClick={() => setShowNewPwd2((v) => !v)}>{showNewPwd2 ? <EyeOff /> : <EyeOpen />}</button>
                </div>
              </div>
              {error && <div style={authSt.error}>⚠️ {error}</div>}
              <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? t("saving") : t("saveNewPassword")}
              </button>
            </form>
            <p style={authSt.switchText}>
              <button style={authSt.switchLink} onClick={() => { setResetStep("identity"); setError(""); }}>
                {t("backToPrevStep")}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire rejoindre une association ──
  if (mode === "join") {
    return (
      <div style={{ position: "relative" }}>
        <div style={authSt.page}>
          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: "6px 28px 6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }} className="lang-select">
              <option value="fr" style={{ background: "#1a2d46" }}>🇫🇷 FR</option>
              <option value="en" style={{ background: "#1a2d46" }}>🇬🇧 EN</option>
            </select>
          </div>
          {onBackToLanding && (
            <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
              <button onClick={onBackToLanding} style={{ padding: "7px 16px", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                ← {lang === "fr" ? "Accueil" : "Home"}
              </button>
            </div>
          )}
          <div style={{ ...authSt.card, maxWidth: "460px" }}>
            <div style={authSt.cardHeader}>
              <img src={logo} alt="" style={authSt.cardLogo} />
              <div>
                <h2 style={authSt.cardTitle}>{lang === "fr" ? "Rejoindre une association" : "Join an association"}</h2>
                <p style={authSt.cardSub}>{lang === "fr" ? "Créez votre compte membre" : "Create your member account"}</p>
              </div>
            </div>
            <form onSubmit={handleJoin}>
              <div style={authSt.field}>
                <label style={authSt.label}>{lang === "fr" ? "Code d'invitation" : "Invite code"}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="text" name="invite_token" value={joinForm.invite_token} onChange={handleJoinChange} placeholder={lang === "fr" ? "Code à 4 chiffres" : "4-digit code"} maxLength={4} inputMode="numeric" autoFocus />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={authSt.field}>
                  <label style={authSt.label}>{lang === "fr" ? "Nom" : "Last name"}</label>
                  <div style={authSt.inputBox}>
                    <input style={authSt.input} type="text" name="nom" value={joinForm.nom} onChange={handleJoinChange} placeholder="Dupont" />
                  </div>
                </div>
                <div style={authSt.field}>
                  <label style={authSt.label}>{lang === "fr" ? "Prénom" : "First name"}</label>
                  <div style={authSt.inputBox}>
                    <input style={authSt.input} type="text" name="prenom" value={joinForm.prenom} onChange={handleJoinChange} placeholder="Jean" />
                  </div>
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>Email</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="email" name="email" value={joinForm.email} onChange={handleJoinChange} placeholder="votre@email.com" />
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>{lang === "fr" ? "Téléphone (optionnel)" : "Phone (optional)"}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="tel" name="telephone" value={joinForm.telephone} onChange={handleJoinChange} placeholder="+225 07 00 00 00 00" />
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("password")}</label>
                <div style={authSt.inputBox}>
                  <input style={{ ...authSt.input, paddingRight: "44px" }} type={joinShowPwd ? "text" : "password"} name="mot_de_passe" value={joinForm.mot_de_passe} onChange={handleJoinChange} placeholder={t("minChars")} />
                  <button type="button" style={authSt.eyeBtn} onClick={() => setJoinShowPwd((v) => !v)}>{joinShowPwd ? <EyeOff /> : <EyeOpen />}</button>
                </div>
              </div>
              <div style={authSt.field}>
                <label style={authSt.label}>{t("confirmPassword")}</label>
                <div style={authSt.inputBox}>
                  <input style={{ ...authSt.input, paddingRight: "44px" }} type={joinShowPwd2 ? "text" : "password"} name="confirmer" value={joinForm.confirmer} onChange={handleJoinChange} placeholder={t("repeatPassword")} />
                  <button type="button" style={authSt.eyeBtn} onClick={() => setJoinShowPwd2((v) => !v)}>{joinShowPwd2 ? <EyeOff /> : <EyeOpen />}</button>
                </div>
              </div>
              {error && <div style={authSt.error}>⚠️ {error}</div>}
              <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? (lang === "fr" ? "Création…" : "Creating…") : (lang === "fr" ? "Rejoindre l'association" : "Join association")}
              </button>
            </form>
            <p style={authSt.switchText}>
              {lang === "fr" ? "Déjà un compte ?" : "Already have an account?"}{" "}
              <button style={authSt.switchLink} onClick={() => { setMode("login"); setError(""); }}>
                {t("signIn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ──
  return (
    <div style={{ position: "relative" }}>
      <div style={authSt.page}>
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: "6px 28px 6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }}
            className="lang-select"
          >
            <option value="fr" style={{ background: "#1a2d46" }}>🇫🇷 FR</option>
            <option value="en" style={{ background: "#1a2d46" }}>🇬🇧 EN</option>
          </select>
        </div>
        {onBackToLanding && (
          <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
            <button
              onClick={onBackToLanding}
              style={{ padding: "7px 16px", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
            >
              ← {lang === "fr" ? "Accueil" : "Home"}
            </button>
          </div>
        )}
        <div style={authSt.card}>
          <div style={authSt.cardHeader}>
            <img src={logo} alt="" style={authSt.cardLogo} />
            <div>
              <h2 style={authSt.cardTitle}>{mode === "login" ? t("login") : t("createAccount")}</h2>
              <p style={authSt.cardSub}>{mode === "login" ? t("accessYourSpace") : t("joinCotisationPro")}</p>
            </div>
          </div>

          <div style={authSt.tabs}>
            <button style={{ ...authSt.tab, ...(mode === "login" ? authSt.tabOn : {}) }} onClick={() => { setMode("login"); setError(""); }}>{t("login")}</button>
            <button style={{ ...authSt.tab, ...(mode === "register" ? authSt.tabOn : {}) }} onClick={() => { setMode("register"); setError(""); }}>{t("createAccount")}</button>
            <button style={{ ...authSt.tab, background: mode === "login" || mode === "register" ? undefined : undefined, color: "#27ae60", fontWeight: "700", fontSize: "12px" }} onClick={() => { setMode("join"); setError(""); }}>🔗 {lang === "fr" ? "Rejoindre" : "Join"}</button>
          </div>

          <form onSubmit={mode === "register" ? handleRegister : handleSubmit}>
            {mode === "register" && (
              <div style={authSt.field}>
                <label style={authSt.label}>{t("associationName")}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="text" name="nom_association" value={form.nom_association} onChange={handleChange} placeholder={t("assocNamePlaceholder")} autoFocus />
                </div>
              </div>
            )}
            {mode === "register" && (
              <div style={{ marginBottom: "14px" }}>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div style={authSt.field}>
                    <label style={authSt.label}>{t("treasurerLastName")} *</label>
                    <div style={authSt.inputBox}>
                      <input style={authSt.input} type="text" name="nom" value={form.nom} onChange={handleChange} placeholder={t("treasurerLastNamePlaceholder")} />
                    </div>
                  </div>
                  <div style={authSt.field}>
                    <label style={authSt.label}>{t("treasurerFirstName")} *</label>
                    <div style={authSt.inputBox}>
                      <input style={authSt.input} type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder={t("treasurerFirstNamePlaceholder")} />
                    </div>
                  </div>
                </div>
                <div style={authSt.field}>
                  <label style={authSt.label}>{t("treasurerPhone")}</label>
                  <div style={authSt.inputBox}>
                    <input style={authSt.input} type="tel" name="telephone" value={form.telephone} onChange={handleChange} placeholder={t("treasurerPhonePlaceholder")} />
                  </div>
                </div>
              </div>
            )}
            <div style={authSt.field}>
              <label style={authSt.label}>{mode === "login" ? (lang === "fr" ? "Email ou Téléphone" : "Email or Phone") : t("emailAddress")}</label>
              <div style={authSt.inputBox}>
                <input style={authSt.input} type={mode === "login" ? "text" : "email"} name="email" value={form.email} onChange={handleChange} placeholder={mode === "login" ? (lang === "fr" ? "email ou téléphone" : "email or phone") : "votre@email.com"} autoFocus={mode === "login"} />
              </div>
            </div>
            <div style={authSt.field}>
              <label style={authSt.label}>{t("password")}</label>
              <div style={authSt.inputBox}>
                <input style={{ ...authSt.input, paddingRight: "44px" }} type={showPwd ? "text" : "password"} name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder={mode === "register" ? t("minChars") : t("yourPassword")} />
                <button type="button" style={authSt.eyeBtn} onClick={() => setShowPwd((v) => !v)}>{showPwd ? <EyeOff /> : <EyeOpen />}</button>
              </div>
            </div>
            {mode === "register" && (
              <div style={authSt.field}>
                <label style={authSt.label}>{t("confirmPassword")}</label>
                <div style={authSt.inputBox}>
                  <input style={{ ...authSt.input, paddingRight: "44px" }} type={showPwd2 ? "text" : "password"} name="confirmer_mot_de_passe" value={form.confirmer_mot_de_passe} onChange={handleChange} placeholder={t("repeatPassword")} />
                  <button type="button" style={authSt.eyeBtn} onClick={() => setShowPwd2((v) => !v)}>{showPwd2 ? <EyeOff /> : <EyeOpen />}</button>
                </div>
              </div>
            )}
            {mode === "register" && (
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: "3px", cursor: "pointer", width: "16px", height: "16px", flexShrink: 0 }}
                />
                <label htmlFor="terms-checkbox" style={{ fontSize: "13px", color: "#2c3e50", cursor: "pointer", lineHeight: "1.5" }}>
                  {t("termsCheckboxLabel")}{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    style={{ background: "none", border: "none", color: "#3498db", cursor: "pointer", fontWeight: "bold", fontSize: "13px", padding: 0, textDecoration: "underline" }}
                  >
                    {t("termsLinkText")}
                  </button>
                </label>
              </div>
            )}
            {error && <div style={authSt.error}>⚠️ {error}</div>}
            {successMsg && <div style={authSt.success}>✅ {successMsg}</div>}
            <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? (mode === "login" ? t("loggingIn") : t("creatingAccount")) : mode === "login" ? t("signIn") : t("createAccount")}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ textAlign: "center", marginTop: "12px" }}>
              <button style={{ ...authSt.switchLink, color: "#e67e22", fontSize: "13px" }}
                onClick={() => { setMode("reset"); setResetStep("identity"); setResetForm({ email: "", nom_association: "", nouveau_mot_de_passe: "", confirmer: "" }); setError(""); setSuccessMsg(""); }}>
                {t("forgotPasswordQ")}
              </button>
            </p>
          )}

          <p style={authSt.switchText}>
            {mode === "login" ? t("noAccountYet") : t("alreadyAccount")}{" "}
            <button style={authSt.switchLink} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccessMsg(""); }}>
              {mode === "login" ? t("createAccount") : t("signIn")}
            </button>
          </p>
        </div>
      </div>
      {showTermsModal && (
        <TermsModal
          lang={lang}
          t={t}
          onClose={() => setShowTermsModal(false)}
          onAccept={() => { setTermsAccepted(true); setShowTermsModal(false); }}
        />
      )}
    </div>
  );
}

const authSt = {
  page:       { display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#1a2742 0%,#2c3e50 55%,#34495e 100%)", fontFamily: "Arial, sans-serif", padding: "20px", boxSizing: "border-box" },
  card:       { background: "white", borderRadius: "18px", padding: "36px 40px", width: "100%", maxWidth: "430px", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #f0f3f7" },
  cardLogo:   { width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  cardTitle:  { margin: 0, fontSize: "20px", color: "#2c3e50", fontWeight: "bold" },
  cardSub:    { margin: "4px 0 0", fontSize: "13px", color: "#95a5a6" },
  tabs:       { display: "flex", marginBottom: "24px", border: "1.5px solid #e0e6ed", borderRadius: "10px", overflow: "hidden" },
  tab:        { flex: 1, padding: "11px", border: "none", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#7f8c8d" },
  tabOn:      { background: "#2c3e50", color: "white", fontWeight: "bold" },
  field:      { marginBottom: "16px" },
  label:      { display: "block", fontSize: "12px", fontWeight: "bold", color: "#2c3e50", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  inputBox:   { position: "relative", display: "flex", alignItems: "center" },
  input:      { width: "100%", padding: "11px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", fontFamily: "Arial, sans-serif", background: "#fdfdfe" },
  eyeBtn:     { position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", padding: "4px", zIndex: 1, display: "flex", alignItems: "center" },
  error:      { background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", border: "1px solid #f5c6cb" },
  success:    { background: "#d5f5e3", color: "#1e8449", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", border: "1px solid #a9dfbf" },
  submitBtn:  { width: "100%", padding: "13px", background: "linear-gradient(135deg,#2c3e50,#3498db)", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginTop: "4px", letterSpacing: "0.5px" },
  switchText: { textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#95a5a6" },
  switchLink: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontWeight: "bold", fontSize: "13px", padding: 0 },
};

// ═══════════════════════════════════════════════════════
// INTERFACE MEMBRE (role = user)
// ═══════════════════════════════════════════════════════
function UserDashboard({ compte, API_BASE, lang, setLang, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("profil");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [changePwdStep, setChangePwdStep] = useState(1);
  const [changePwdForm, setChangePwdForm] = useState({ ancien: "", nouveau: "", confirmer: "" });
  const [changePwdError, setChangePwdError] = useState("");
  const [changePwdSuccess, setChangePwdSuccess] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwdU, setShowNewPwdU] = useState(false);
  const [showConfirmPwdU, setShowConfirmPwdU] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [membres, setMembres] = useState([]);
  const [toutesCotsations, setToutesCotisations] = useState([]);
  const [membreSearch, setMembreSearch] = useState("");
  const [userMessages, setUserMessages] = useState([]);
  const [userMsgUnread, setUserMsgUnread] = useState(0);
  const [userMsgEmojiOpen, setUserMsgEmojiOpen] = useState(null);
  const [userMsgTooltip, setUserMsgTooltip] = useState(null);
  const [userMsgTab, setUserMsgTab] = useState("messages");
  const [userMsgForm, setUserMsgForm] = useState({ titre: "", contenu: "" });
  const [userMsgSending, setUserMsgSending] = useState(false);
  const [userMsgSendError, setUserMsgSendError] = useState("");
  const [userMsgSendSuccess, setUserMsgSendSuccess] = useState("");
  const [meHistorique, setMeHistorique] = useState([]);
  const [carteQRUrl, setCarteQRUrl] = useState("");
  const [carteDownloading, setCarteDownloading] = useState(false);
  const [userMMConfig, setUserMMConfig] = useState({ om_numero: "", om_nom: "", wave_numero: "", wave_nom: "", mtn_numero: "", mtn_nom: "" });
  const [payQRUrls, setPayQRUrls] = useState({});
  const [cardFlipped, setCardFlipped] = useState(false);
  const memberContentRef = useRef(null);
  // Demandes de paiement Mobile Money
  const [mesDemandes, setMesDemandes] = useState([]);
  const [showPayMM, setShowPayMM] = useState(false);
  const [payMMCot, setPayMMCot] = useState(null);
  const [payMMForm, setPayMMForm] = useState({ montant: "", numero_transaction: "", operateur: "" });
  const [payMMError, setPayMMError] = useState("");
  const [payMMSuccess, setPayMMSuccess] = useState("");
  const [payMMLoading, setPayMMLoading] = useState(false);
  const [payMMStep, setPayMMStep] = useState(1);

  const t2 = (fr, en) => lang === "fr" ? fr : en;

  const apiFetch = (url, options = {}) =>
    fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${compte.token}` } });

  const handlePayMM = async () => {
    setPayMMError("");
    setPayMMSuccess("");
    if (!payMMForm.montant || isNaN(Number(payMMForm.montant)) || Number(payMMForm.montant) <= 0) {
      setPayMMError(t2("Montant invalide.", "Invalid amount."));
      return;
    }
    setPayMMLoading(true);
    try {
      const r = await apiFetch(`${API_BASE}/me/demandes-paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotisation_id: payMMCot?.cotisationId, montant: payMMForm.montant, numero_transaction: payMMForm.numero_transaction, operateur: payMMForm.operateur }),
      });
      const d = await r.json();
      if (!r.ok) { setPayMMError(d.error || "Erreur"); }
      else {
        setPayMMSuccess(t2("Demande envoyée ! En attente de validation par le trésorier.", "Request sent! Awaiting treasurer validation."));
        const updated = await apiFetch(`${API_BASE}/me/demandes-paiement`).then(x => x.json());
        setMesDemandes(Array.isArray(updated) ? updated : []);
        setTimeout(() => { setShowPayMM(false); setPayMMSuccess(""); setPayMMStep(1); setPayMMForm({ montant: "", numero_transaction: "", operateur: "" }); }, 2500);
      }
    } catch { setPayMMError(t2("Erreur réseau.", "Network error.")); }
    setPayMMLoading(false);
  };

  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE}/me`).then((r) => r.json()).then(setProfile),
      apiFetch(`${API_BASE}/me/cotisations`).then((r) => r.json()).then(setCotisations),
      apiFetch(`${API_BASE}/me/membres`).then((r) => r.json()).then((d) => setMembres(Array.isArray(d) ? d : [])),
      apiFetch(`${API_BASE}/me/toutes-cotisations`).then((r) => r.json()).then((d) => setToutesCotisations(Array.isArray(d) ? d : [])),
      apiFetch(`${API_BASE}/me/historique`).then((r) => r.json()).then((d) => setMeHistorique(Array.isArray(d) ? d : [])).catch(() => {}),
      apiFetch(`${API_BASE}/me/demandes-paiement`).then((r) => r.json()).then((d) => setMesDemandes(Array.isArray(d) ? d : [])).catch(() => {}),
      apiFetch(`${API_BASE}/mobile-money/config`).then(r => r.json()).then(d => {
        if (d && !d.error) setUserMMConfig({ om_numero: d.om_numero || "", om_nom: d.om_nom || "", wave_numero: d.wave_numero || "", wave_nom: d.wave_nom || "", mtn_numero: d.mtn_numero || "", mtn_nom: d.mtn_nom || "" });
      }).catch(() => {}),
      apiFetch(`${API_BASE}/messages`).then((r) => r.json()).then((d) => {
        if (!Array.isArray(d)) return;
        setUserMessages(d);
        const seenKey = `msg_seen_${compte?.email}`;
        const seenAt = parseInt(localStorage.getItem(seenKey) || "0");
        setUserMsgUnread(d.filter(m => new Date(m.created_at).getTime() > seenAt).length);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (page === "carte" && profile && !carteQRUrl) generateCarteQR(profile);
  }, [page, profile]);

  // Transition de page membre : animation fade+slide
  useEffect(() => {
    const el = memberContentRef.current;
    if (!el) return;
    el.classList.remove("page-enter");
    void el.offsetWidth;
    el.classList.add("page-enter");
  }, [page]);

  useEffect(() => {
    if (page === "payer" && Object.values(payQRUrls).length === 0) {
      const providers = [
        { key: "om",   numero: userMMConfig.om_numero,   nom: userMMConfig.om_nom,   label: "Orange Money" },
        { key: "wave", numero: userMMConfig.wave_numero, nom: userMMConfig.wave_nom, label: "Wave" },
        { key: "mtn",  numero: userMMConfig.mtn_numero,  nom: userMMConfig.mtn_nom,  label: "MTN MoMo" },
      ];
      providers.forEach(async ({ key, numero, nom, label }) => {
        if (!numero) return;
        try {
          const text = `${label}\nBénéficiaire: ${nom || ""}\nNuméro: ${numero}\nAssociation: ${compte.nom_association}`;
          const url = await QRCode.toDataURL(text, { width: 160, margin: 1, color: { dark: "#1a2a3a", light: "#ffffff" } });
          setPayQRUrls(prev => ({ ...prev, [key]: url }));
        } catch {}
      });
    }
  }, [page, userMMConfig]);

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleUserReactMessage = async (id, emoji) => {
    setUserMsgEmojiOpen(null);
    try {
      const res = await apiFetch(`${API_BASE}/messages/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setUserMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: data.reactions } : m));
    } catch {}
  };

  const handleSaveProfile = async () => {
    setEditError("");
    if (!editForm.nom || !editForm.prenom) { setEditError(t2("Nom et prénom obligatoires.", "First and last name are required.")); return; }
    try {
      const res = await apiFetch(`${API_BASE}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: editForm.nom, prenom: editForm.prenom, telephone: editForm.telephone, photo: editForm.photo }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || t2("Erreur.", "Error.")); return; }
      setProfile((prev) => ({ ...prev, ...editForm }));
      setEditMode(false);
      setEditSuccess(t2("Profil mis à jour !", "Profile updated!"));
      setTimeout(() => setEditSuccess(""), 3000);
    } catch { setEditError(t2("Erreur réseau.", "Network error.")); }
  };

  const generateCarteQR = async (prof) => {
    const p = prof || profile;
    if (!p) return;
    try {
      const cardPayload = {
        n: `${p.nom || ""} ${p.prenom || ""}`.trim(),
        m: p.matricule || "",
        p: p.poste || "",
        t: p.telephone || "",
        e: p.email || "",
        d: p.date_inscription ? new Date(p.date_inscription).toLocaleDateString("fr-FR") : "",
        a: compte.nom_association || "",
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cardPayload))));
      const scanUrl = `${window.location.origin}/?carte=${encoded}`;
      const url = await QRCode.toDataURL(scanUrl, { width: 200, margin: 1, color: { dark: "#1a2a3a", light: "#ffffff" } });
      setCarteQRUrl(url);
    } catch {}
  };

  const downloadCarte = async () => {
    if (!profile) return;
    setCarteDownloading(true);
    try {
      const doc = new jsPDF({ unit: "mm", orientation: "landscape", format: [54, 85.6] });
      const W = 85.6, H = 54;
      // Fond principal
      doc.setFillColor(26, 42, 58);
      doc.rect(0, 0, W, H, "F");
      // Bande décorative gauche
      doc.setFillColor(22, 160, 133);
      doc.rect(0, 0, 3, H, "F");
      // Bande du haut
      doc.setFillColor(52, 73, 94);
      doc.rect(3, 0, W - 3, 10, "F");
      // Nom de l'association
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont(undefined, "bold");
      const assoc = (compte.nom_association || "").substring(0, 32);
      doc.text(assoc, 7, 6.5);
      // Badge CARTE MEMBRE
      doc.setFontSize(5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(200, 230, 240);
      doc.text("CARTE MEMBRE", W - 4, 6.5, { align: "right" });
      // Cercle photo
      const pX = 16, pY = 30, pR = 10;
      doc.setFillColor(44, 62, 80);
      doc.circle(pX, pY, pR, "F");
      if (profile.photo) {
        try {
          doc.addImage(profile.photo, "JPEG", pX - pR, pY - pR, pR * 2, pR * 2);
        } catch {}
      } else {
        const initials = ((profile.nom || "?")[0] + (profile.prenom || "")[0]).toUpperCase();
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor(150, 190, 220);
        doc.text(initials, pX, pY + 1.5, { align: "center" });
      }
      doc.setDrawColor(22, 160, 133);
      doc.setLineWidth(0.5);
      doc.circle(pX, pY, pR, "S");
      // Nom du membre
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${profile.nom} ${profile.prenom}`, 30, 20);
      // Matricule
      doc.setFontSize(7);
      doc.setFont(undefined, "normal");
      doc.setTextColor(150, 200, 220);
      doc.text(`N° ${profile.matricule || "N/A"}`, 30, 26);
      // Poste
      if (profile.poste) {
        doc.setFillColor(22, 160, 133);
        doc.roundedRect(29, 28, Math.min(profile.poste.length * 1.7 + 5, 34), 5.5, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont(undefined, "bold");
        doc.text(profile.poste, 31.5, 31.5);
      }
      // Date inscription
      if (profile.date_inscription) {
        doc.setFontSize(6);
        doc.setFont(undefined, "normal");
        doc.setTextColor(120, 170, 210);
        doc.text(`Membre depuis : ${new Date(profile.date_inscription).toLocaleDateString("fr-FR")}`, 30, 38);
      }
      // QR code
      if (carteQRUrl) {
        const qS = 26, qX = W - qS - 4, qY = (H - qS) / 2 + 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qX - 1, qY - 1, qS + 2, qS + 2, 1.5, 1.5, "F");
        doc.addImage(carteQRUrl, "PNG", qX, qY, qS, qS);
        doc.setFontSize(4.5);
        doc.setTextColor(200, 220, 240);
        doc.text("Scannez pour vérifier", qX + qS / 2, qY + qS + 2.5, { align: "center" });
      }
      // Barre du bas
      doc.setFillColor(22, 160, 133);
      doc.rect(3, H - 8, W - 3, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.setFont(undefined, "bold");
      doc.text("COTISATION PRO", 7, H - 3.5);
      doc.setFont(undefined, "normal");
      doc.setFontSize(5);
      doc.text(compte.nom_association || "", W - 4, H - 3.5, { align: "right" });

      doc.save(`carte-membre-${profile.matricule || profile.nom}.pdf`);
    } catch (e) {
      console.error("Erreur génération carte PDF:", e);
    } finally {
      setCarteDownloading(false);
    }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setChangePwdError("");
    if (changePwdStep === 1) {
      if (!changePwdForm.ancien) { setChangePwdError(t2("Mot de passe actuel requis.", "Current password required.")); return; }
      setChangePwdLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/auth/verify-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mot_de_passe: changePwdForm.ancien }),
        });
        if (!res.ok) { const d = await res.json(); setChangePwdError(d.error || t2("Mot de passe incorrect.", "Wrong password.")); return; }
        setChangePwdStep(2);
      } catch { setChangePwdError(t2("Erreur réseau.", "Network error.")); }
      finally { setChangePwdLoading(false); }
      return;
    }
    if (!changePwdForm.nouveau || changePwdForm.nouveau.length < 6) { setChangePwdError(t2("Minimum 6 caractères.", "Minimum 6 characters.")); return; }
    if (changePwdForm.nouveau !== changePwdForm.confirmer) { setChangePwdError(t2("Les mots de passe ne correspondent pas.", "Passwords do not match.")); return; }
    setChangePwdLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ancien_mot_de_passe: changePwdForm.ancien, nouveau_mot_de_passe: changePwdForm.nouveau }),
      });
      if (!res.ok) { const d = await res.json(); setChangePwdError(d.error || t2("Erreur.", "Error.")); return; }
      setChangePwdSuccess(true);
      setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" });
      setChangePwdStep(1);
    } catch { setChangePwdError(t2("Erreur réseau.", "Network error.")); }
    finally { setChangePwdLoading(false); }
  };

  const statutColor = (s) => s === "Payé" ? "#27ae60" : s === "Partiel" ? "#f39c12" : "#e74c3c";
  const statutBg = (s) => s === "Payé" ? "#d5f5e3" : s === "Partiel" ? "#fef9e7" : "#fdecea";
  const statutLabel = (s) => s === "Payé" ? t2("Payé", "Paid") : s === "Partiel" ? t2("Partiel", "Partial") : t2("Impayé", "Unpaid");

  const navBtnStyle = (active) => ({
    padding: "8px 14px", background: active ? "#3498db" : "rgba(255,255,255,0.12)",
    color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "13px", fontWeight: active ? "700" : "500",
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial", background: "#f0f4f8" }}>
        <div style={{ textAlign: "center", color: "#2c3e50" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p>{t2("Chargement…", "Loading…")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial", minHeight: "100vh", background: "#f0f4f8" }}>

      {/* ── NAVBAR ── */}
      <div style={{ background: "#2c3e50", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logo} alt="Logo" style={{ height: "42px", width: "42px", objectFit: "cover", borderRadius: "50%" }} />
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>Cotisation Pro</div>
            <div style={{ color: "#3498db", fontSize: "11px", fontWeight: "600" }}>🏛️ {compte.nom_association}</div>
          </div>
        </div>
        {/* Desktop nav */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }} className="app-menu-buttons">
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "16px", cursor: "pointer", fontSize: "12px" }} className="lang-select">
            <option value="fr" style={{ background: "#2c3e50" }}>🇫🇷 FR</option>
            <option value="en" style={{ background: "#2c3e50" }}>🇬🇧 EN</option>
          </select>
          <button onClick={() => setPage("profil")} style={navBtnStyle(page === "profil")}>{t2("Mon Profil", "My Profile")}</button>
          <button onClick={() => { setPage("carte"); }} style={navBtnStyle(page === "carte")}>{t2("🪪 Ma Carte", "🪪 My Card")}</button>
          <button onClick={() => setPage("payer")} style={navBtnStyle(page === "payer")}>{t2("📱 Payer", "📱 Pay")}</button>
          <button onClick={() => setPage("membres")} style={navBtnStyle(page === "membres")}>{t2("Membres", "Members")}</button>
          <button onClick={() => setPage("bureau")} style={navBtnStyle(page === "bureau")}>{t2("🏛️ Bureau", "🏛️ Board")}</button>
          <button onClick={() => setPage("cotisations")} style={navBtnStyle(page === "cotisations")}>{t2("Mes Paiements", "My Payments")}</button>
          <button onClick={() => setPage("historique")} style={navBtnStyle(page === "historique")}>{t2("Historique", "History")}</button>
          <button onClick={() => setPage("apercu")} style={navBtnStyle(page === "apercu")}>{t2("Cotisations", "Contributions")}</button>
          <button onClick={() => { setPage("messages"); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setUserMsgUnread(0); }} style={{ ...navBtnStyle(page === "messages"), position: "relative" }}>
            {t2("Messages", "Messages")}
            {userMsgUnread > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{userMsgUnread}</span>}
          </button>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ ...navBtnStyle(false), background: "#c0392b" }}>{t2("Déconnexion", "Logout")}</button>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div ref={memberContentRef} style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 16px" }} className="page-enter">

        {/* Badge rôle */}
        <div style={{ background: "#eaf6fd", border: "1px solid #3498db", borderRadius: "8px", padding: "8px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2c3e50" }}>
          <span>👤</span>
          <span><strong>{t2("Espace Membre", "Member Space")}</strong>{profile ? ` — ${profile.nom} ${profile.prenom}` : ""}</span>
          <span style={{ marginLeft: "auto", background: "#3498db", color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>MEMBRE</span>
        </div>

        {/* ── PAGE PROFIL ── */}
        {page === "profil" && profile && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8" }}>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}><Icon name="user" size={18} /> {t2("Mon Profil", "My Profile")}</h2>
              {!editMode && (
                <button onClick={() => { setEditForm({ nom: profile.nom, prenom: profile.prenom, telephone: profile.telephone || "", photo: profile.photo || "" }); setEditMode(true); setEditError(""); }}
                  style={{ padding: "8px 16px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  ✏️ {t2("Modifier", "Edit")}
                </button>
              )}
            </div>

            {editSuccess && (
              <div style={{ background: "#d5f5e3", border: "1px solid #27ae60", color: "#1e8449", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>✅ {editSuccess}</div>
            )}

            {!editMode ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
                  {profile.photo ? (
                    <img src={profile.photo} alt="Photo" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #3498db", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", flexShrink: 0 }}>👤</div>
                  )}
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50" }}>{profile.nom} {profile.prenom}</div>
                    {profile.matricule && <div style={{ color: "#7f8c8d", fontSize: "14px", marginTop: "4px" }}>#{profile.matricule}</div>}
                    {profile.poste && (
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ background: profile.poste.toLowerCase().includes("président") ? "#8e44ad" : profile.poste.toLowerCase().includes("trésorier") ? "#27ae60" : profile.poste.toLowerCase().includes("secrétaire") ? "#2980b9" : "#7f8c8d", color: "white", padding: "3px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" }}>
                          {profile.poste}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  {[
                    { label: t2("Nom", "Last Name"), value: profile.nom },
                    { label: t2("Prénom", "First Name"), value: profile.prenom },
                    { label: t2("Téléphone", "Phone"), value: profile.telephone || "—" },
                    { label: "Email", value: profile.email || "—" },
                    { label: "Matricule", value: profile.matricule || "—" },
                    { label: t2("Inscription", "Registered"), value: profile.date_inscription ? new Date(profile.date_inscription).toLocaleDateString("fr-FR") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#f7f9fc", borderRadius: "8px", padding: "14px", border: "1px solid #e0e6ed" }}>
                      <div style={{ fontSize: "11px", color: "#7f8c8d", textTransform: "uppercase", fontWeight: "700", marginBottom: "6px" }}>{label}</div>
                      <div style={{ fontSize: "15px", color: "#2c3e50", fontWeight: "500" }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f0f4f8" }}>
                  <button onClick={() => { setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccess(false); setShowChangePwd(true); }}
                    style={{ padding: "10px 20px", background: "#8e44ad", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    🔑 {t2("Changer le mot de passe", "Change Password")}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", border: "3px solid #3498db", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    onClick={() => document.getElementById("userPhotoInput").click()}>
                    {editForm.photo ? <img src={editForm.photo} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "40px" }}>👤</span>}
                  </div>
                  <input type="file" accept="image/*" id="userPhotoInput" style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setEditForm((f) => ({ ...f, photo: ev.target.result }));
                      reader.readAsDataURL(file);
                    }} />
                  <button type="button" style={{ marginTop: "8px", padding: "5px 12px", background: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
                    onClick={() => document.getElementById("userPhotoInput").click()}>
                    {editForm.photo ? t2("Changer la photo", "Change Photo") : t2("Ajouter une photo", "Add Photo")}
                  </button>
                </div>
                {[
                  { label: t2("Nom", "Last Name"), field: "nom", required: true },
                  { label: t2("Prénom", "First Name"), field: "prenom", required: true },
                  { label: t2("Téléphone", "Phone"), field: "telephone", required: false },
                ].map(({ label, field, required }) => (
                  <div key={field} style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px", textTransform: "uppercase" }}>{label}{required ? " *" : ""}</label>
                    <input value={editForm[field] || ""} onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "7px", fontSize: "14px", boxSizing: "border-box" }} />
                  </div>
                ))}
                {editError && <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px", borderRadius: "7px", marginBottom: "14px", fontSize: "13px" }}>⚠️ {editError}</div>}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => { setEditMode(false); setEditError(""); }}
                    style={{ padding: "10px 20px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                    {t2("Annuler", "Cancel")}
                  </button>
                  <button onClick={handleSaveProfile}
                    style={{ padding: "10px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>
                    {t2("Enregistrer", "Save")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PAGE CARTE MEMBRE ── */}
        {page === "carte" && profile && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8" }}>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}><Icon name="card" size={18} /> {t2("Ma Carte Membre", "My Member Card")}</h2>
              <button
                onClick={downloadCarte}
                disabled={carteDownloading || !carteQRUrl}
                style={{ padding: "9px 20px", background: carteDownloading || !carteQRUrl ? "#bdc3c7" : "#16a085", color: "white", border: "none", borderRadius: "8px", cursor: carteDownloading || !carteQRUrl ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "700" }}>
                {carteDownloading ? t2("Génération…", "Generating…") : t2("⬇ Télécharger PDF", "⬇ Download PDF")}
              </button>
            </div>

            <p style={{ color: "#7f8c8d", fontSize: "13px", marginBottom: "24px" }}>
              {t2("Voici votre carte membre digitale. Présentez-la ou partagez-la pour justifier de votre appartenance à l'association.", "This is your digital member card. Present or share it to prove your membership.")}
            </p>

            {/* Carte visuelle — flip 3D */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
              <div className="card-flip-scene" onClick={() => setCardFlipped(f => !f)} title={t2("Cliquer pour retourner", "Click to flip")}>
                <div className={`card-flip-inner${cardFlipped ? " flipped" : ""}`}>

                  {/* ── FACE AVANT ── */}
                  <div className="card-flip-front" style={{
                    background: "linear-gradient(135deg, #1a2a3a 0%, #2c3e50 60%, #1a3a4a 100%)",
                    boxShadow: "0 10px 40px rgba(26,42,58,0.55)",
                    fontFamily: "Arial, sans-serif",
                  }}>
                    {/* Bande gauche colorée */}
                    <div style={{ position: "absolute", left: 0, top: 0, width: "10px", height: "100%", background: "linear-gradient(180deg,#16a085,#1abc9c)" }} />
                    {/* Barre haute */}
                    <div style={{ position: "absolute", left: "10px", top: 0, right: 0, height: "34px", background: "rgba(52,73,94,0.85)", display: "flex", alignItems: "center", padding: "0 12px", justifyContent: "space-between" }}>
                      <span style={{ color: "white", fontWeight: "700", fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{compte.nom_association}</span>
                      <span style={{ color: "#a8d8cc", fontSize: "8px", fontWeight: "700", letterSpacing: "1.2px" }}>CARTE MEMBRE</span>
                    </div>
                    {/* Photo */}
                    <div style={{ position: "absolute", left: "20px", top: "50px", width: "68px", height: "68px", borderRadius: "50%", overflow: "hidden", border: "3px solid #16a085", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {profile.photo
                        ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "26px", color: "#a8d8cc", fontWeight: "700" }}>{((profile.nom || "?")[0] + (profile.prenom || "")[0]).toUpperCase()}</span>
                      }
                    </div>
                    {/* Infos centrales */}
                    <div style={{ position: "absolute", left: "100px", top: "44px", right: "110px" }}>
                      <div style={{ color: "white", fontWeight: "800", fontSize: "13px", lineHeight: 1.2, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.nom} {profile.prenom}</div>
                      <div style={{ color: "#a8d8ea", fontSize: "10px", marginBottom: "4px", fontWeight: "600" }}>N° {profile.matricule || "N/A"}</div>
                      {profile.poste && <div style={{ display: "inline-block", background: "#16a085", color: "white", fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px", marginBottom: "4px" }}>{profile.poste}</div>}
                      {profile.telephone && <div style={{ color: "#90c4d8", fontSize: "9.5px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📞 {profile.telephone}</div>}
                      {profile.email && <div style={{ color: "#90c4d8", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>✉️ {profile.email}</div>}
                      {profile.date_inscription && <div style={{ color: "#6a93aa", fontSize: "9px" }}>{t2("Depuis", "Since")} {new Date(profile.date_inscription).toLocaleDateString("fr-FR")}</div>}
                    </div>
                    {/* QR code */}
                    <div style={{ position: "absolute", right: "10px", top: "42px", background: "white", borderRadius: "8px", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      {carteQRUrl
                        ? <img src={carteQRUrl} alt="QR" style={{ width: "82px", height: "82px", display: "block" }} />
                        : <div style={{ width: "82px", height: "82px", display: "flex", alignItems: "center", justifyContent: "center", color: "#bdc3c7", fontSize: "11px" }}>…</div>
                      }
                      <div style={{ textAlign: "center", fontSize: "7px", color: "#7f8c8d", marginTop: "2px" }}>{t2("Scanner", "Scan")}</div>
                    </div>
                    {/* Barre bas */}
                    <div style={{ position: "absolute", left: "10px", bottom: 0, right: 0, height: "26px", background: "#16a085", display: "flex", alignItems: "center", padding: "0 12px", justifyContent: "space-between" }}>
                      <span style={{ color: "white", fontWeight: "700", fontSize: "9px", letterSpacing: "1px" }}>COTISATION PRO</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{compte.nom_association}</span>
                    </div>
                    <div style={{ position: "absolute", right: "-18px", bottom: "22px", width: "70px", height: "70px", borderRadius: "50%", border: "18px solid rgba(22,160,133,0.10)", pointerEvents: "none" }} />
                  </div>

                  {/* ── FACE ARRIÈRE — infos complètes + QR ── */}
                  <div className="card-flip-back" style={{
                    background: "linear-gradient(135deg, #0d1b2a 0%, #1a3a4a 100%)",
                    boxShadow: "0 10px 40px rgba(26,42,58,0.55)",
                    fontFamily: "Arial, sans-serif",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "5px", background: "linear-gradient(90deg,#16a085,#3498db,#16a085)", backgroundSize: "200% 100%", animation: "lp-shimmerBar 2.5s linear infinite" }} />
                    {/* QR code côté gauche */}
                    <div style={{ position: "absolute", left: "14px", top: "20px", bottom: "30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <div style={{ background: "white", borderRadius: "10px", padding: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                        {carteQRUrl
                          ? <img src={carteQRUrl} alt="QR Code" style={{ width: "96px", height: "96px", display: "block" }} />
                          : <div style={{ width: "96px", height: "96px", display: "flex", alignItems: "center", justifyContent: "center", color: "#bdc3c7" }}>…</div>
                        }
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "8px", textAlign: "center", letterSpacing: "0.5px" }}>{t2("Scanner pour voir le profil", "Scan to view profile")}</div>
                    </div>
                    {/* Séparateur */}
                    <div style={{ position: "absolute", left: "132px", top: "18px", bottom: "30px", width: "1px", background: "rgba(255,255,255,0.1)" }} />
                    {/* Infos côté droit */}
                    <div style={{ position: "absolute", left: "142px", top: "16px", right: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>
                        <div style={{ color: "white", fontWeight: "800", fontSize: "12px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.nom} {profile.prenom}</div>
                        <div style={{ color: "#a8d8ea", fontSize: "9px", marginTop: "1px" }}>N° {profile.matricule || "N/A"}</div>
                      </div>
                      {profile.poste && (
                        <div style={{ display: "inline-block", background: "#16a085", color: "white", fontSize: "8.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px", alignSelf: "flex-start" }}>{profile.poste}</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {profile.telephone && <div style={{ color: "#90c4d8", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><span>📞</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.telephone}</span></div>}
                        {profile.email && <div style={{ color: "#90c4d8", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><span>✉️</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</span></div>}
                        {profile.date_inscription && <div style={{ color: "#6a93aa", fontSize: "8.5px", display: "flex", alignItems: "center", gap: "4px" }}><span>📅</span><span>{t2("Membre depuis", "Member since")} {new Date(profile.date_inscription).toLocaleDateString("fr-FR")}</span></div>}
                      </div>
                      <div style={{ marginTop: "2px", color: "#a8d8cc", fontSize: "8px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🏛️ {compte.nom_association}</div>
                    </div>
                    {/* Barre bas */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24px", background: "#16a085", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontSize: "8px", fontWeight: "700", letterSpacing: "1.5px" }}>COTISATION PRO — {compte.nom_association}</span>
                    </div>
                  </div>

                </div>
              </div>
              <p className="card-flip-hint">{t2("Cliquez sur la carte pour la retourner", "Click the card to flip it")}</p>
            </div>

            {/* Info QR code */}
            <div style={{ background: "#f0faf7", border: "1px solid #a9dfbf", borderRadius: "10px", padding: "14px 18px", fontSize: "13px", color: "#1e8449", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>ℹ️</span>
              <div>
                <strong>{t2("QR Code d'identification", "Identification QR Code")}</strong>
                <p style={{ margin: "4px 0 0", color: "#555", fontSize: "12px" }}>
                  {t2("Le QR code contient vos informations de membre (nom, matricule, association). Toute personne le scannant pourra vérifier votre appartenance à l'association.", "The QR code contains your member info (name, matricule, association). Anyone scanning it can verify your membership.")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE PAYER (Mobile Money) ── */}
        {page === "payer" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 6px", color: "#2c3e50", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}><Icon name="phone" size={18} /> {t2("Payer par Mobile Money", "Pay via Mobile Money")}</h2>
            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 24px" }}>
              {t2("Utilisez l'un des comptes ci-dessous pour régler votre cotisation, puis informez le trésorier.", "Use one of the accounts below to pay your contribution, then inform the treasurer.")}
            </p>

            {(() => {
              const providers = [
                { key: "om",   label: "Orange Money", img: imgOrange, color: "#FF6600", bg: "#fff3e6", border: "#FF660044", numero: userMMConfig.om_numero, nom: userMMConfig.om_nom },
                { key: "wave", label: "Wave",         img: imgWave,   color: "#009BDB", bg: "#e6f5fc", border: "#009BDB44", numero: userMMConfig.wave_numero, nom: userMMConfig.wave_nom },
                { key: "mtn",  label: "MTN MoMo",    img: imgMTN,    color: "#FFCC00", bg: "#fffbe6", border: "#FFCC0044", numero: userMMConfig.mtn_numero, nom: userMMConfig.mtn_nom },
              ].filter(p => p.numero);

              if (providers.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#f7f9fc", borderRadius: "12px", color: "#7f8c8d" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                    <div style={{ fontWeight: "600", marginBottom: "6px" }}>{t2("Aucun compte Mobile Money configuré", "No Mobile Money account configured")}</div>
                    <div style={{ fontSize: "13px" }}>{t2("Le trésorier n'a pas encore renseigné les comptes de paiement.", "The treasurer has not yet added payment accounts.")}</div>
                  </div>
                );
              }

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {providers.map(({ key, label, img, color, bg, border, numero, nom }) => {
                    const payUrl = key === "wave"
                      ? `https://pay.wave.com/m/${encodeURIComponent(numero)}`
                      : `tel:${numero}`;
                    return (
                    <div key={key} style={{ background: bg, border: `2px solid ${color}44`, borderRadius: "16px", padding: "20px", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", boxShadow: `0 4px 20px ${color}18`, position: "relative", overflow: "hidden" }}>
                      {/* Décoration */}
                      <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: `${color}11`, pointerEvents: "none" }} />
                      {/* Infos paiement */}
                      <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          <img src={img} alt={label} style={{ height: "40px", width: "auto", maxWidth: "96px", objectFit: "contain", filter: `drop-shadow(0 2px 8px ${color}55)` }} />
                        </div>
                        <div style={{ background: "white", borderRadius: "10px", padding: "14px 16px", boxShadow: `0 2px 12px ${color}22` }}>
                          <div style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{t2("Numéro", "Number")}</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", letterSpacing: "1.5px" }}>{numero}</div>
                          {nom && <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: "600" }}>{nom}</div>}
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b", background: "white", borderRadius: "8px", padding: "10px 12px" }}>
                          {t2("Après paiement, envoyez la capture d'écran ou la référence à votre trésorier.", "After payment, send the screenshot or reference to your treasurer.")}
                        </div>
                        {/* Bouton Payer maintenant */}
                        <a href={payUrl} target="_blank" rel="noopener noreferrer"
                          className="pay-now-link"
                          style={{ marginTop: "14px", background: `linear-gradient(135deg, ${color}, ${color}bb)`, color: key === "mtn" ? "#1a1a00" : "white", boxShadow: `0 4px 18px ${color}55` }}>
                          <span style={{ fontSize: "18px" }}>💸</span>
                          {t2("Payer maintenant", "Pay now")} →
                        </a>
                      </div>
                      {/* QR Code */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ background: "white", borderRadius: "12px", padding: "8px", boxShadow: `0 4px 16px ${color}33`, border: `2px solid ${color}44` }}>
                          {payQRUrls[key]
                            ? <img src={payQRUrls[key]} alt={`QR ${label}`} style={{ width: "100px", height: "100px", display: "block" }} />
                            : <div style={{ width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", color: "#bdc3c7", fontSize: "11px" }}>…</div>
                          }
                        </div>
                        <div style={{ fontSize: "10px", color: "#7f8c8d", fontWeight: "600" }}>{t2("Scanner pour payer", "Scan to pay")}</div>
                      </div>
                    </div>
                    );
                  })}

                  {/* Rappel cotisations */}
                  {cotisations.filter(c => c.statut !== "Payé").length > 0 && (
                    <div style={{ background: "#fef9e7", border: "1px solid #f9e79f", borderRadius: "12px", padding: "16px 18px" }}>
                      <div style={{ fontWeight: "700", color: "#d4ac0d", fontSize: "13px", marginBottom: "10px" }}>
                        📋 {t2("Vos cotisations à régler", "Your outstanding contributions")}
                      </div>
                      {cotisations.filter(c => c.statut !== "Payé").map((c, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "white", borderRadius: "8px", marginBottom: "6px" }}>
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "13px", color: "#2c3e50" }}>{c.periode}</div>
                            <div style={{ fontSize: "11px", color: "#7f8c8d" }}>{t2("Reste :", "Remaining:")} {c.reste}</div>
                          </div>
                          <span style={{ background: c.statut === "Partiel" ? "#f39c12" : "#e74c3c", color: "white", padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                            {c.statut === "Partiel" ? t2("Partiel", "Partial") : t2("Impayé", "Unpaid")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── PAGE COTISATIONS ── */}
        {page === "cotisations" && (() => {
          const FR_MOIS_USER = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
          const pAmt = (v) => Number(String(v || "").replace(/[^0-9.-]/g, "")) || 0;
          const fAmt = (v) => `${v.toLocaleString("fr-FR")} F`;

          // Extraire l'année depuis une période "Mois AAAA"
          const getYear = (periode) => {
            const parts = (periode || "").trim().split(" ");
            return parts[parts.length - 1];
          };

          // Années disponibles (triées décroissant)
          const anneesDispos = [...new Set(cotisations.map((c) => getYear(c.periode)))].sort((a, b) => b - a);
          const anneeActive = selectedAnnee || anneesDispos[0] || null;

          // Cotisations de l'année sélectionnée
          const cotisationsAnnee = cotisations.filter((c) => getYear(c.periode) === anneeActive);

          // Totaux annuels
          const totalDuAnnuel   = cotisationsAnnee.reduce((s, c) => s + pAmt(c.montantDu), 0);
          const totalPayeAnnuel = cotisationsAnnee.reduce((s, c) => s + pAmt(c.soldePaye), 0);
          const totalResteAnnuel = cotisationsAnnee.reduce((s, c) => s + pAmt(c.reste), 0);
          const pctAnnuel = totalDuAnnuel > 0 ? Math.min((totalPayeAnnuel / totalDuAnnuel) * 100, 100) : 0;
          const barColorAnnuel = pctAnnuel >= 100 ? "#27ae60" : pctAnnuel >= 50 ? "#f39c12" : "#e74c3c";

          // Map mois → cotisation pour la grille calendrier
          const moisMap = {};
          cotisationsAnnee.forEach((c) => {
            const mois = (c.periode || "").split(" ")[0];
            moisMap[mois] = c;
          });

          return (
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
              {/* ── En-tête ── */}
              <h2 style={{ margin: "0 0 20px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon name="dollar" size={18} /> {t2("Mes Cotisations", "My Contributions")}
              </h2>

              {cotisations.length === 0 ? (
                <div style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0", fontSize: "15px" }}>
                  {t2("Aucune cotisation enregistrée.", "No contributions recorded.")}
                </div>
              ) : (
                <>
                  {/* ── Sélecteur d'année ── */}
                  {anneesDispos.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                      {anneesDispos.map((a) => (
                        <button
                          key={a}
                          onClick={() => setSelectedAnnee(a)}
                          style={{
                            padding: "8px 22px",
                            border: `2px solid ${anneeActive === a ? "#3498db" : "#dde3ea"}`,
                            borderRadius: "10px",
                            background: anneeActive === a ? "#3498db" : "white",
                            color: anneeActive === a ? "white" : "#5a6a7a",
                            fontWeight: "700",
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}

                  {anneeActive && (
                    <>
                      {/* ── Cartes bilan annuel ── */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "18px" }}>
                        {[
                          { label: t2("Total attendu", "Expected total"),    value: fAmt(totalDuAnnuel),    color: "#2980b9", bg: "linear-gradient(135deg,#eaf4fb,#d6eaf8)", border: "#a9cce3", icon: "dollar" },
                          { label: t2("Total payé", "Total paid"),           value: fAmt(totalPayeAnnuel),  color: "#27ae60", bg: "linear-gradient(135deg,#eafaf1,#d5f5e3)", border: "#a9dfbf", icon: "check-circle" },
                          { label: t2("Reste à payer", "Remaining"),         value: fAmt(totalResteAnnuel), color: "#e74c3c", bg: "linear-gradient(135deg,#fdedec,#fadbd8)", border: "#f1948a", icon: "alert-triangle" },
                          { label: t2("Mois cotisés", "Months with data"),   value: `${cotisationsAnnee.length} / 12`, color: "#8e44ad", bg: "linear-gradient(135deg,#f5eef8,#e8daef)", border: "#c39bd3", icon: "clock" },
                        ].map(({ label, value, color, bg, border, icon }) => (
                          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                              <Icon name={icon} size={13} style={{ color }} /> {label}
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: "800", color }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── Barre de progression annuelle ── */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e8ecf0", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#7f8c8d", marginBottom: "8px", fontWeight: "600" }}>
                          <span>{t2("Avancement annuel", "Annual progress")} {anneeActive}</span>
                          <strong style={{ color: barColorAnnuel }}>{pctAnnuel.toFixed(1)} %</strong>
                        </div>
                        <div style={{ background: "#e0e6ed", borderRadius: "10px", height: "10px", overflow: "hidden" }}>
                          <div style={{ width: pctAnnuel + "%", height: "100%", background: `linear-gradient(90deg, ${barColorAnnuel}, ${barColorAnnuel}bb)`, borderRadius: "10px", transition: "width 0.8s ease" }} />
                        </div>
                      </div>

                      {/* ── Grille calendrier 12 mois ── */}
                      <div style={{ marginBottom: "22px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#5a6a7a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {t2("Aperçu mois par mois", "Month by month overview")} — {anneeActive}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                          {FR_MOIS_USER.map((mois) => {
                            const cot = moisMap[mois];
                            const statut = cot ? cot.statut : null;
                            const bgC = statut === "Payé" ? "#27ae60" : statut === "Partiel" ? "#f39c12" : statut === "Impayé" ? "#e74c3c" : "#e8ecf0";
                            const textC = statut ? "white" : "#aab2c0";
                            const abbrev = mois.slice(0, 3);
                            return (
                              <div key={mois} title={cot ? `${mois} : ${cot.statut} — Payé ${cot.soldePaye} / Reste ${cot.reste}` : `${mois} : ${t2("Aucune cotisation", "No contribution")}`}
                                style={{ background: bgC, borderRadius: "10px", padding: "10px 6px", textAlign: "center", cursor: cot ? "default" : "default" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: textC, lineHeight: 1.2 }}>{abbrev}</div>
                                {statut && (
                                  <div style={{ fontSize: "9px", color: textC, opacity: 0.85, marginTop: "3px", fontWeight: "600" }}>
                                    {statut === "Payé" ? "✓" : statut === "Partiel" ? "~" : "✗"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Légende */}
                        <div style={{ display: "flex", gap: "14px", marginTop: "10px", flexWrap: "wrap" }}>
                          {[["#27ae60", t2("Payé", "Paid")], ["#f39c12", t2("Partiel", "Partial")], ["#e74c3c", t2("Impayé", "Unpaid")], ["#e8ecf0", t2("Aucune cotisation", "No data")]].map(([c, l]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#7f8c8d" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: c }} /> {l}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Liste mensuelle détaillée ── */}
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#5a6a7a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {t2("Détail mensuel", "Monthly detail")} — {anneeActive}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {cotisationsAnnee.length === 0 ? (
                          <div style={{ textAlign: "center", color: "#7f8c8d", padding: "20px 0" }}>
                            {t2("Aucune cotisation pour cette année.", "No contributions for this year.")}
                          </div>
                        ) : (
                          cotisationsAnnee.map((c, i) => {
                            const demandeEnAttente = mesDemandes.find(d => d.cotisation_id === c.cotisationId && d.statut === "en_attente");
                            const demandeRejetee  = mesDemandes.find(d => d.cotisation_id === c.cotisationId && d.statut === "rejete");
                            const canPay = c.statut !== "Payé" && !demandeEnAttente;
                            return (
                            <div key={i} style={{ border: `1.5px solid ${statutColor(c.statut)}44`, borderRadius: "10px", padding: "14px 18px", background: statutBg(c.statut) + "44", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                              <div>
                                <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{c.periode}</div>
                                {c.dernierPaiement && <div style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "2px" }}>{t2("Dernier paiement", "Last payment")}: {c.dernierPaiement}</div>}
                                {demandeEnAttente && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "5px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", color: "#b45309", fontWeight: "600" }}>
                                    <Icon name="clock" size={12} /> {t2("En attente de validation", "Awaiting validation")} — {Number(demandeEnAttente.montant).toLocaleString("fr-FR")} F{demandeEnAttente.operateur ? ` · ${demandeEnAttente.operateur}` : ""}
                                  </div>
                                )}
                                {demandeRejetee && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "5px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>
                                    <Icon name="alert-triangle" size={12} /> {t2("Demande rejetée", "Request rejected")}{demandeRejetee.note_refus ? ` — ${demandeRejetee.note_refus}` : ""}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{t2("Payé", "Paid")}</div>
                                  <div style={{ fontWeight: "700", color: "#27ae60", fontSize: "15px" }}>{c.soldePaye}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{t2("Reste", "Remaining")}</div>
                                  <div style={{ fontWeight: "700", color: "#e74c3c", fontSize: "15px" }}>{c.reste}</div>
                                </div>
                                <span style={{ background: statutColor(c.statut), color: "white", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                                  {statutLabel(c.statut)}
                                </span>
                                {canPay && (
                                  <button
                                    onClick={() => { setPayMMCot(c); setPayMMForm({ montant: pAmt(c.reste) > 0 ? String(pAmt(c.reste)) : "", numero_transaction: "", operateur: "" }); setPayMMError(""); setPayMMSuccess(""); setPayMMStep(1); setShowPayMM(true); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap" }}
                                  >
                                    <Icon name="phone" size={13} /> {t2("Payer", "Pay")}
                                  </button>
                                )}
                              </div>
                            </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* ── MODAL PAIEMENT MOBILE MONEY ── */}
        {showPayMM && payMMCot && (() => {
          const closePayMM = () => { setShowPayMM(false); setPayMMStep(1); setPayMMError(""); setPayMMSuccess(""); };
          const MM_PROVIDERS = {
            "Orange Money": { img: imgOrange, color: "#FF6600", bg: "#fff3e6", numero: userMMConfig.om_numero,   nom: userMMConfig.om_nom },
            "Wave":         { img: imgWave,   color: "#009BDB", bg: "#e6f5fc", numero: userMMConfig.wave_numero, nom: userMMConfig.wave_nom },
            "MTN MoMo":     { img: imgMTN,    color: "#FFCC00", bg: "#fffbe6", numero: userMMConfig.mtn_numero,  nom: userMMConfig.mtn_nom },
          };
          const selProvider = MM_PROVIDERS[payMMForm.operateur] || {};
          const availableProviders = Object.entries(MM_PROVIDERS).filter(([, p]) => p.numero);

          const stepLabels = [
            t2("Choisir l'opérateur", "Choose operator"),
            t2("Instructions de paiement", "Payment instructions"),
            t2("Confirmer le paiement", "Confirm payment"),
          ];

          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
                 onClick={closePayMM}>
              <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "390px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}
                   onClick={(e) => e.stopPropagation()}>

                {/* Barre de progression */}
                <div style={{ height: "4px", background: "#e2e8f0" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#f59e0b,#22c55e)", width: `${(payMMStep / 3) * 100}%`, transition: "width 0.35s ease" }} />
                </div>

                {/* En-tête */}
                <div style={{ padding: "16px 18px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    {payMMStep > 1 && (
                      <button onClick={() => { setPayMMStep(s => s - 1); setPayMMError(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "13px", padding: "0 0 6px", fontWeight: "600" }}>
                        ← {t2("Retour", "Back")}
                      </button>
                    )}
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#1e293b" }}>{stepLabels[payMMStep - 1]}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{t2(`Étape ${payMMStep} sur 3`, `Step ${payMMStep} of 3`)}</div>
                  </div>
                  <button onClick={closePayMM} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8", lineHeight: 1, marginTop: "2px" }}>✕</button>
                </div>

                {/* Résumé cotisation */}
                <div style={{ margin: "12px 18px 0", background: "#f8fafc", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{payMMCot.periode} —</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{t2("Reste :", "Remaining:")}</span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#dc2626" }}>{payMMCot.reste}</span>
                </div>

                <div style={{ padding: "14px 18px 20px" }}>

                  {/* ── ÉTAPE 1 : Choix opérateur ── */}
                  {payMMStep === 1 && (
                    <div>
                      {availableProviders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#7f8c8d" }}>
                          <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                          <div style={{ fontWeight: "600" }}>{t2("Aucun compte Mobile Money configuré", "No Mobile Money account configured")}</div>
                          <div style={{ fontSize: "12px", marginTop: "6px" }}>{t2("Le trésorier n'a pas encore renseigné ses comptes.", "The treasurer has not added payment accounts yet.")}</div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>{t2("Sélectionnez votre moyen de paiement :", "Select your payment method:")}</div>
                          {availableProviders.map(([label, p]) => (
                            <button key={label} type="button"
                              onClick={() => { setPayMMForm(f => ({ ...f, operateur: label })); setPayMMStep(2); }}
                              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: p.bg, border: `2px solid ${p.color}33`, borderRadius: "12px", cursor: "pointer", textAlign: "left", width: "100%", boxShadow: `0 2px 8px ${p.color}18`, transition: "transform 0.1s, box-shadow 0.1s" }}>
                              <img src={p.img} alt={label} style={{ height: "34px", width: "auto", maxWidth: "75px", objectFit: "contain", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>{label}</div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{p.numero}{p.nom ? ` · ${p.nom}` : ""}</div>
                              </div>
                              <span style={{ color: p.color, fontWeight: "900", fontSize: "20px" }}>›</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ÉTAPE 2 : Instructions de paiement ── */}
                  {payMMStep === 2 && (
                    <div>
                      {/* Numéro du trésorier */}
                      <div style={{ background: selProvider.bg, border: `2px solid ${selProvider.color}44`, borderRadius: "14px", padding: "16px", marginBottom: "14px", textAlign: "center" }}>
                        <img src={selProvider.img} alt={payMMForm.operateur} style={{ height: "38px", width: "auto", maxWidth: "110px", objectFit: "contain", marginBottom: "10px" }} />
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{t2("Numéro du trésorier", "Treasurer's number")}</div>
                        <div style={{ fontSize: "28px", fontWeight: "900", color: "#1e293b", letterSpacing: "2px" }}>{selProvider.numero}</div>
                        {selProvider.nom && <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginTop: "3px" }}>{selProvider.nom}</div>}
                        <button onClick={() => { navigator.clipboard?.writeText(selProvider.numero); }}
                          style={{ marginTop: "10px", padding: "6px 18px", background: "white", border: `1.5px solid ${selProvider.color}`, borderRadius: "20px", color: selProvider.color, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                          📋 {t2("Copier le numéro", "Copy number")}
                        </button>
                      </div>

                      {/* Montant */}
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>{t2("Montant à envoyer (FCFA)", "Amount to send (FCFA)")}</label>
                        <input type="number" value={payMMForm.montant}
                          onChange={(e) => setPayMMForm(f => ({ ...f, montant: e.target.value }))}
                          placeholder="Ex. 5000"
                          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "20px", boxSizing: "border-box", fontWeight: "800", textAlign: "center" }} />
                      </div>

                      {/* Instructions étape par étape */}
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#92400e" }}>
                        <div style={{ fontWeight: "700", marginBottom: "6px" }}>📱 {t2("Comment payer :", "How to pay:")}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div>1. {t2(`Ouvrez votre application ${payMMForm.operateur}`, `Open your ${payMMForm.operateur} app`)}</div>
                          <div>2. {t2(`Envoyez ${payMMForm.montant || "?"} FCFA au numéro`, `Send ${payMMForm.montant || "?"} FCFA to number`)} <strong>{selProvider.numero}</strong></div>
                          <div>3. {t2("Notez la référence/ID du paiement reçue par SMS", "Note the payment reference/ID received by SMS")}</div>
                          <div>4. {t2("Cliquez sur « J'ai payé » ci-dessous", "Click \"I paid\" below")}</div>
                        </div>
                      </div>

                      <button onClick={() => { if (!payMMForm.montant || Number(payMMForm.montant) <= 0) { setPayMMError(t2("Veuillez saisir un montant valide.", "Please enter a valid amount.")); return; } setPayMMError(""); setPayMMStep(3); }}
                        style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg, ${selProvider.color}, ${selProvider.color}cc)`, color: payMMForm.operateur === "MTN MoMo" ? "#1a1a00" : "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "800", fontSize: "15px", boxShadow: `0 4px 16px ${selProvider.color}44` }}>
                        ✓ {t2("J'ai effectué le paiement →", "I made the payment →")}
                      </button>
                      {payMMError && <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", padding: "9px 12px", marginTop: "10px", fontSize: "13px" }}>{payMMError}</div>}
                    </div>
                  )}

                  {/* ── ÉTAPE 3 : Confirmation ── */}
                  {payMMStep === 3 && (
                    <div>
                      <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <div style={{ fontSize: "44px", marginBottom: "8px" }}>🎉</div>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>{t2("Confirmez votre paiement", "Confirm your payment")}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{t2("Entrez la référence reçue après le paiement", "Enter the reference received after payment")}</div>
                      </div>

                      {/* Récapitulatif */}
                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "11px 13px", marginBottom: "14px", fontSize: "13px", color: "#0369a1" }}>
                        <strong>{t2("Récap :", "Summary:")}</strong> {payMMForm.montant} FCFA {t2("via", "via")} {payMMForm.operateur} → {selProvider.numero}
                      </div>

                      {/* Référence transaction */}
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                          {t2("Référence de transaction", "Transaction reference")} <span style={{ fontWeight: "400", color: "#94a3b8" }}>({t2("optionnel", "optional")})</span>
                        </label>
                        <input type="text" value={payMMForm.numero_transaction}
                          onChange={(e) => setPayMMForm(f => ({ ...f, numero_transaction: e.target.value }))}
                          placeholder={t2("Ex. WVCI-20241215-XXXXX", "e.g. WVCI-20241215-XXXXX")}
                          style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box" }} />
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{t2("Disponible dans votre SMS de confirmation ou l'historique de l'application.", "Found in your confirmation SMS or app history.")}</div>
                      </div>

                      {payMMError && <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", padding: "9px 12px", marginBottom: "12px", fontSize: "13px" }}>{payMMError}</div>}
                      {payMMSuccess && <div style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: "8px", padding: "9px 12px", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>{payMMSuccess}</div>}

                      <button onClick={handlePayMM} disabled={payMMLoading}
                        style={{ width: "100%", padding: "13px", background: payMMLoading ? "#94a3b8" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: "10px", cursor: payMMLoading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "15px", boxShadow: payMMLoading ? "none" : "0 4px 16px #22c55e44" }}>
                        {payMMLoading ? t2("Envoi en cours…", "Sending…") : t2("✓ Envoyer la demande au trésorier", "✓ Send request to treasurer")}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })()}

        {/* ── PAGE MEMBRES ── */}
        {page === "membres" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="users" size={18} /> {t2("Membres de l'association", "Association Members")}
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <input
                value={membreSearch}
                onChange={(e) => setMembreSearch(e.target.value)}
                placeholder={t2("Rechercher un membre…", "Search a member…")}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            {membres.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>{t2("Aucun membre enregistré.", "No members registered.")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {membres
                  .filter((m) => {
                    const q = membreSearch.toLowerCase();
                    return !q || `${m.nom} ${m.prenom} ${m.matricule || ""} ${m.telephone || ""} ${m.email || ""} ${m.poste || ""}`.toLowerCase().includes(q);
                  })
                  .map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", border: "1px solid #e0e6ed", borderRadius: "10px", background: "#f7f9fc" }}>
                      {m.photo ? (
                        <img src={m.photo} alt="" style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "2px solid #3498db", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👤</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{m.nom} {m.prenom}</div>
                          {m.poste ? (
                            <span style={{ background: m.poste.toLowerCase().includes("président") ? "#8e44ad" : m.poste.toLowerCase().includes("trésorier") ? "#27ae60" : m.poste.toLowerCase().includes("secrétaire") ? "#2980b9" : "#7f8c8d", color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                              {m.poste}
                            </span>
                          ) : (
                            <span style={{ background: "#ecf0f1", color: "#7f8c8d", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "600", flexShrink: 0 }}>
                              {t2("Membre", "Member")}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "2px" }}>
                          {m.matricule && <span style={{ marginRight: "10px" }}>#{m.matricule}</span>}
                          {m.telephone && <span style={{ marginRight: "10px" }}><Icon name="phone" size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} />{m.telephone}</span>}
                          {m.email && <span><Icon name="mail" size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} />{m.email}</span>}
                        </div>
                      </div>
                      {m.date_inscription && (
                        <div style={{ fontSize: "11px", color: "#95a5a6", textAlign: "right", flexShrink: 0 }}>
                          {t2("Inscrit le", "Joined")}<br />
                          {new Date(m.date_inscription).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#95a5a6", textAlign: "center" }}>
              {membres.length} {t2("membre(s) au total", "member(s) total")}
            </div>
          </div>
        )}

        {/* ── PAGE BUREAU MEMBRE ── */}
        {page === "bureau" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 6px", color: "#2c3e50", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="building" size={18} /> {t2("Bureau de l'association", "Association Board")}
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#7f8c8d" }}>{t2("Membres élus et responsables", "Elected members and officers")}</p>
            {membres.filter(m => m.poste).length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏛️</div>
                <p style={{ margin: 0, fontWeight: "600" }}>{t2("Aucun poste attribué pour l'instant.", "No roles assigned yet.")}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
                {(() => {
                  const posteOrder = ["président","vice-président","secrétaire général","secrétaire adjoint","trésorier","trésorier adjoint","commissaire","conseiller"];
                  const posteColors = { "président": "#7c3aed", "vice-président": "#1d4ed8", "secrétaire général": "#15803d", "secrétaire adjoint": "#0e7490", "trésorier": "#c2410c", "trésorier adjoint": "#b45309", "commissaire": "#b91c1c", "conseiller": "#475569" };
                  return membres
                    .filter(m => m.poste)
                    .sort((a, b) => {
                      const ia = posteOrder.findIndex(k => a.poste?.toLowerCase().includes(k));
                      const ib = posteOrder.findIndex(k => b.poste?.toLowerCase().includes(k));
                      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                    })
                    .map(m => {
                      const colorKey = Object.keys(posteColors).find(k => m.poste?.toLowerCase().includes(k));
                      const color = colorKey ? posteColors[colorKey] : "#475569";
                      return (
                        <div key={m.id} style={{ borderRadius: "12px", padding: "18px 14px", border: `2px solid ${color}22`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                          {m.photo
                            ? <img src={m.photo} alt="" style={{ width: "68px", height: "68px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
                            : <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", border: `3px solid ${color}` }}>👤</div>
                          }
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#2c3e50" }}>{m.nom} {m.prenom}</div>
                            <div style={{ marginTop: "5px", display: "inline-block", background: color, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 12px", borderRadius: "20px" }}>{m.poste}</div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── PAGE HISTORIQUE MEMBRE ── */}
        {page === "historique" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 24px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="receipt" size={18} /> {t2("Historique de mes paiements", "My Payment History")}
            </h2>
            {meHistorique.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", padding: "40px 0", fontSize: "15px" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                <p style={{ margin: 0 }}>{t2("Aucun paiement enregistré.", "No payments recorded.")}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {meHistorique.map((h, i) => (
                  <div key={i} style={{ border: `2px solid ${h.statut === "Payé" ? "#27ae60" : h.statut === "Partiel" ? "#f39c12" : "#e74c3c"}33`, borderRadius: "10px", padding: "16px 20px", background: h.statut === "Payé" ? "#d5f5e333" : h.statut === "Partiel" ? "#fef9e733" : "#fdecea33" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>{h.periode}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "2px" }}>
                          <Icon name="clock" size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} /> {t2("Date de paiement", "Payment date")}: <strong>{h.datePaiement}</strong>
                          {h.numeroRecu && <span style={{ marginLeft: "12px" }}><Icon name="receipt" size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} /> {t2("Reçu", "Receipt")}: <strong>{h.numeroRecu}</strong></span>}
                        </div>
                        {h.modePaiement && h.modePaiement !== "-" && (
                          <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Icon name="card" size={11} style={{ verticalAlign: "middle" }} />
                            {t2("Mode", "Method")}:
                            {({ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[h.modePaiement])
                              ? <img src={{ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[h.modePaiement]} alt={h.modePaiement} style={{ height: "16px", width: "auto", maxWidth: "40px", objectFit: "contain", verticalAlign: "middle" }} />
                              : <span>{h.modePaiement}</span>}
                          </div>
                        )}
                      </div>
                      <span style={{ background: h.statut === "Payé" ? "#27ae60" : h.statut === "Partiel" ? "#f39c12" : "#e74c3c", color: "white", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>
                        {h.statut === "Payé" ? t2("Payé", "Paid") : h.statut === "Partiel" ? t2("Partiel", "Partial") : t2("Impayé", "Unpaid")}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "24px", marginTop: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Montant dû", "Amount due")}: <strong style={{ color: "#2c3e50" }}>{h.montantDu}</strong></div>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Ce paiement", "This payment")}: <strong style={{ color: "#27ae60" }}>{h.montantPaye}</strong></div>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Total payé", "Total paid")}: <strong style={{ color: "#3498db" }}>{h.totalPaye}</strong></div>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Reste", "Remaining")}: <strong style={{ color: "#e74c3c" }}>{h.reste}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#95a5a6", textAlign: "center" }}>
              {meHistorique.length} {t2("transaction(s) au total", "transaction(s) total")}
            </div>
          </div>
        )}

        {/* ── PAGE APERÇU COTISATIONS ── */}
        {page === "apercu" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 24px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="bar-chart" size={18} /> {t2("Suivi des cotisations", "Contributions Overview")}
            </h2>
            {toutesCotsations.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>{t2("Aucune cotisation créée.", "No contributions created.")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {toutesCotsations.map((c) => {
                  const pct = c.total > 0 ? Math.round((c.payes / c.total) * 100) : 0;
                  return (
                    <div key={c.id} style={{ border: "1px solid #e0e6ed", borderRadius: "12px", padding: "20px 24px", background: "#f7f9fc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>{c.libelle}</div>
                          <div style={{ fontSize: "13px", color: "#7f8c8d", marginTop: "2px" }}>{t2("Montant dû :", "Amount due:")} <strong>{c.montantDu}</strong></div>
                        </div>
                        <div style={{ background: pct === 100 ? "#27ae60" : pct > 0 ? "#f39c12" : "#e74c3c", color: "white", padding: "4px 14px", borderRadius: "14px", fontSize: "13px", fontWeight: "700" }}>
                          {pct}% {t2("payé", "paid")}
                        </div>
                      </div>
                      <div style={{ background: "#e0e6ed", borderRadius: "6px", height: "8px", overflow: "hidden", marginBottom: "12px" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#27ae60" : "#3498db", borderRadius: "6px", transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "13px", color: "#27ae60", fontWeight: "600" }}>✅ {c.payes} {t2("payé(s)", "paid")}</div>
                        <div style={{ fontSize: "13px", color: "#f39c12", fontWeight: "600" }}>⏳ {c.partiels} {t2("partiel(s)", "partial")}</div>
                        <div style={{ fontSize: "13px", color: "#e74c3c", fontWeight: "600" }}>❌ {c.impayes} {t2("impayé(s)", "unpaid")}</div>
                        <div style={{ fontSize: "13px", color: "#7f8c8d" }}>👥 {c.total} {t2("total", "total")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ── PAGE MESSAGES ── */}
        {page === "messages" && (() => {
          const isHautMembreUser = !!(compte?.poste);
          const envoyesU = userMessages.filter(m => m.is_mine);
          const recusU   = userMessages.filter(m => !m.is_mine);

          const renderMsgList = (liste, emptyLabel) => liste.length === 0
            ? (<div style={{ textAlign: "center", padding: "56px 0 48px" }}>
                <span className="msg-empty-icon">📭</span>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#64748b" }}>{emptyLabel}</p>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#b2bec3" }}>{t2("Rien de nouveau pour l'instant.", "Nothing new for now.")}</p>
              </div>)
            : (<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {liste.map((m, idx) => {
                  const hasAuteur = m.auteur_nom || m.auteur_prenom;
                  const posteBg = m.auteur_poste && m.auteur_poste.toLowerCase().includes("président") ? "#8e44ad"
                    : m.auteur_poste && m.auteur_poste.toLowerCase().includes("trésorier") ? "#27ae60"
                    : m.auteur_poste && m.auteur_poste.toLowerCase().includes("secrétaire") ? "#e67e22"
                    : "#3498db";
                  const reactions = m.reactions || {};
                  return (
                    <div key={m.id} className="msg-card" style={{ "--i": idx, background: "white", borderRadius: "16px", boxShadow: "0 3px 16px rgba(44,62,80,0.09)", border: "1px solid #edf2f7", overflow: "visible", position: "relative" }}>
                      {/* En-tête expéditeur */}
                      {hasAuteur && (
                        <div style={{ background: `linear-gradient(135deg, ${posteBg}18, ${posteBg}08)`, padding: "14px 18px", borderBottom: `2px solid ${posteBg}22`, display: "flex", alignItems: "center", gap: "12px", borderRadius: "16px 16px 0 0" }}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg,${posteBg},${posteBg}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, color: "white", fontWeight: "800", boxShadow: `0 3px 10px ${posteBg}55`, border: `2px solid ${posteBg}33` }}>
                            {(m.auteur_prenom || m.auteur_nom || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>{m.auteur_prenom} {m.auteur_nom}</div>
                            {m.auteur_poste && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: posteBg, color: "white", fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "8px", marginTop: "4px", letterSpacing: "0.5px", boxShadow: `0 2px 6px ${posteBg}44` }}>
                                ✦ {m.auteur_poste.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Corps du message */}
                      <div style={{ padding: "18px 18px 10px" }}>
                        <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "15px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "4px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg,#7c3aed,#3b82f6)", display: "inline-block", flexShrink: 0 }} />
                          {m.titre}
                        </div>
                        <div style={{ color: "#475569", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{m.contenu}</div>
                      </div>

                      {/* Date */}
                      <div style={{ padding: "0 18px 10px", color: "#94a3b8", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🕐</span> {new Date(m.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                      </div>

                      {/* Réactions */}
                      <div style={{ padding: "8px 18px 14px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", minHeight: "44px", background: "#fafbfc", borderRadius: "0 0 16px 16px" }} onClick={e => e.stopPropagation()}>
                        {Object.entries(reactions).map(([emoji, info]) => (
                          <div key={emoji} style={{ position: "relative", flexShrink: 0 }}>
                            <button
                              title={info.reactors.join(", ")}
                              style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: info.my_reaction ? "#eff6ff" : "#f1f5f9", border: `1.5px solid ${info.my_reaction ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: info.my_reaction ? "#2563eb" : "#64748b", whiteSpace: "nowrap", flexShrink: 0, boxShadow: info.my_reaction ? "0 2px 8px rgba(59,130,246,0.2)" : "none" }}
                              onClick={() => { const key = `${m.id}-${emoji}`; setUserMsgTooltip(prev => prev === key ? null : key); }}
                            >
                              <span style={{ fontSize: "16px", lineHeight: 1 }}>{emoji}</span>
                              <span style={{ fontSize: "13px", minWidth: "12px", textAlign: "center" }}>{info.count}</span>
                            </button>
                            {userMsgTooltip === `${m.id}-${emoji}` && info.reactors.length > 0 && (
                              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#1e293b", color: "white", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", whiteSpace: "nowrap", zIndex: 99, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
                                {info.reactors.join(", ")}
                                <div style={{ position: "absolute", top: "100%", left: "14px", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e293b" }} />
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Bouton ajouter réaction */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <button
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "white", border: "1.5px dashed #cbd5e1", borderRadius: "20px", cursor: "pointer", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap", transition: "all 0.15s" }}
                            onClick={e => { e.stopPropagation(); setUserMsgEmojiOpen(prev => prev === m.id ? null : m.id); setUserMsgTooltip(null); }}
                          >
                            <span style={{ fontSize: "16px", lineHeight: 1 }}>😊</span>
                            <span style={{ fontSize: "12px" }}>+</span>
                          </button>
                          {userMsgEmojiOpen === m.id && (
                            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "white", borderRadius: "14px", padding: "10px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "3px", zIndex: 100, border: "1px solid #e2e8f0", minWidth: "max-content" }} onClick={e => e.stopPropagation()}>
                              {REACTION_EMOJIS.map(e => (
                                <button key={e} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", padding: "4px 6px", borderRadius: "10px", transition: "background 0.12s, transform 0.12s", flexShrink: 0 }}
                                  onMouseEnter={ev => { ev.currentTarget.style.background = "#f1f5f9"; ev.currentTarget.style.transform = "scale(1.25)"; }}
                                  onMouseLeave={ev => { ev.currentTarget.style.background = "none"; ev.currentTarget.style.transform = "scale(1)"; }}
                                  onClick={() => handleUserReactMessage(m.id, e)}
                                >{e}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          return (
            <div className="msg-page-enter" style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 6px 32px rgba(44,62,80,0.13)", border: "1px solid #e2e8f0" }} onClick={() => { setUserMsgEmojiOpen(null); setUserMsgTooltip(null); }}>

              {/* ── Bannière gradient ── */}
              <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #2563eb 100%)", padding: "24px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-45px", right: "-45px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-25px", left: "5%", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "8px", left: "45%", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="msg-icon-float" style={{ fontSize: "38px", filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.28))", lineHeight: 1 }}>✉️</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, color: "white", fontSize: "22px", fontWeight: "800", textShadow: "0 2px 6px rgba(0,0,0,0.2)", letterSpacing: "-0.3px" }}>
                        {t2("Messages", "Messages")}
                      </h2>
                      {userMsgUnread > 0 && (
                        <span className="msg-badge-pop" style={{ background: "#ef4444", color: "white", borderRadius: "12px", padding: "3px 10px", fontSize: "12px", fontWeight: "700", boxShadow: "0 2px 10px rgba(239,68,68,0.55)" }}>
                          {userMsgUnread} {t2("non lu(s)", "unread")}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.72)", fontSize: "13px" }}>
                      {isHautMembreUser
                        ? t2("Communiquez avec les membres de votre association", "Communicate with your association members")
                        : t2("Consultez les messages de votre association", "View your association's messages")}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Onglets & contenu ── */}
              <div style={{ background: "white", padding: "20px 24px 28px" }}>
                {isHautMembreUser ? (
                  <div className="msg-tabs-row">
                    <button className={`msg-tab-btn${userMsgTab === "nouveau" ? " msg-tab-btn--orange" : ""}`} onClick={() => { setUserMsgTab("nouveau"); setUserMsgSendError(""); setUserMsgSendSuccess(""); }}>
                      ✏️ {t2("Nouveau", "New")}
                    </button>
                    <button className={`msg-tab-btn${userMsgTab === "envoyes" ? " msg-tab-btn--orange" : ""}`} onClick={() => setUserMsgTab("envoyes")}>
                      📤 {t2("Envoyés", "Sent")}
                      {envoyesU.length > 0 && <span className={`msg-tab-badge${userMsgTab === "envoyes" ? "" : " msg-tab-badge--orange-inactive"}`}>{envoyesU.length}</span>}
                    </button>
                    <button className={`msg-tab-btn${userMsgTab === "recus" ? " msg-tab-btn--blue" : ""}`} onClick={() => setUserMsgTab("recus")}>
                      📥 {t2("Reçus", "Received")}
                      {recusU.length > 0 && <span className={`msg-tab-badge${userMsgTab === "recus" ? "" : " msg-tab-badge--blue-inactive"}`}>{recusU.length}</span>}
                    </button>
                  </div>
                ) : (
                  <div className="msg-tabs-row">
                    <button className={`msg-tab-btn${userMsgTab !== "recus" ? " msg-tab-btn--blue" : ""}`} onClick={() => setUserMsgTab("messages")}>
                      📢 {t2("Messages", "Messages")}
                    </button>
                    <button className={`msg-tab-btn${userMsgTab === "recus" ? " msg-tab-btn--blue" : ""}`} onClick={() => setUserMsgTab("recus")}>
                      📥 {t2("Reçus", "Received")}
                      {userMessages.length > 0 && <span className={`msg-tab-badge${userMsgTab === "recus" ? "" : " msg-tab-badge--blue-inactive"}`}>{userMessages.length}</span>}
                    </button>
                  </div>
                )}

                {isHautMembreUser && userMsgTab === "nouveau" && (
                  <div style={{ background: "#fafbfc", borderRadius: "12px", padding: "22px", border: "1.5px solid #e2e8f0" }}>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t2("Titre", "Title")}</label>
                      <input style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", background: "white" }} value={userMsgForm.titre} onChange={e => setUserMsgForm(f => ({ ...f, titre: e.target.value }))} placeholder={t2("Objet du message", "Message subject")} autoFocus />
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t2("Contenu", "Content")}</label>
                      <textarea style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", minHeight: "120px", resize: "vertical", fontFamily: "inherit", background: "white" }} value={userMsgForm.contenu} onChange={e => setUserMsgForm(f => ({ ...f, contenu: e.target.value }))} placeholder={t2("Contenu du message…", "Message content…")} />
                    </div>
                    {userMsgSendError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", border: "1px solid #fca5a5" }}>⚠️ {userMsgSendError}</div>}
                    {userMsgSendSuccess && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", border: "1px solid #86efac" }}>✅ {userMsgSendSuccess}</div>}
                    <button style={{ padding: "12px 32px", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px", opacity: userMsgSending ? 0.7 : 1, boxShadow: "0 4px 14px rgba(245,158,11,0.4)", display: "inline-flex", alignItems: "center", gap: "8px" }} disabled={userMsgSending} onClick={async () => {
                      setUserMsgSendError(""); setUserMsgSendSuccess("");
                      if (!userMsgForm.titre.trim() || !userMsgForm.contenu.trim()) { setUserMsgSendError(t2("Titre et contenu requis.", "Title and content required.")); return; }
                      setUserMsgSending(true);
                      try {
                        const res = await apiFetch(`${API_BASE}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userMsgForm) });
                        const data = await res.json();
                        if (!res.ok) { setUserMsgSendError(data.error || t2("Erreur.", "Error.")); return; }
                        setUserMessages(prev => [data, ...prev]);
                        setUserMsgForm({ titre: "", contenu: "" });
                        setUserMsgSendSuccess(t2("Message envoyé avec succès !", "Message sent successfully!"));
                        setTimeout(() => { setUserMsgSendSuccess(""); setUserMsgTab("envoyes"); }, 2200);
                      } catch { setUserMsgSendError(t2("Erreur réseau.", "Network error.")); }
                      finally { setUserMsgSending(false); }
                    }}>
                      {userMsgSending ? <><span>⏳</span> {t2("Envoi…", "Sending…")}</> : <><span>🚀</span> {t2("Envoyer à tous les membres", "Send to all members")}</>}
                    </button>
                  </div>
                )}

                {userMsgTab !== "nouveau" && (() => {
                  const liste = isHautMembreUser
                    ? (userMsgTab === "envoyes" ? envoyesU : recusU)
                    : userMessages;
                  const emptyLabel = userMsgTab === "envoyes"
                    ? t2("Aucun message envoyé pour le moment.", "No sent messages yet.")
                    : t2("Aucun message reçu pour le moment.", "No received messages yet.");
                  return renderMsgList(liste, emptyLabel);
                })()}
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── MODAL CHANGEMENT MOT DE PASSE ── */}
      {showChangePwd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "28px 32px", width: "400px", maxWidth: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "17px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name="key" size={16} /> {t2("Changer le mot de passe", "Change Password")}</h3>
              <button onClick={() => setShowChangePwd(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#7f8c8d" }}>✕</button>
            </div>
            {changePwdSuccess ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <p style={{ color: "#27ae60", fontWeight: "600", margin: "0 0 20px" }}>{t2("Mot de passe modifié avec succès !", "Password changed successfully!")}</p>
                <button onClick={() => setShowChangePwd(false)} style={{ padding: "10px 28px", background: "#3498db", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600" }}>
                  {t2("Fermer", "Close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePwd}>
                {changePwdStep === 1 ? (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px", textTransform: "uppercase" }}>{t2("Mot de passe actuel", "Current Password")}</label>
                    <div style={{ position: "relative" }}>
                      <input type={showOldPwd ? "text" : "password"} value={changePwdForm.ancien} onChange={(e) => setChangePwdForm((f) => ({ ...f, ancien: e.target.value }))}
                        style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "7px", fontSize: "14px", boxSizing: "border-box" }} autoFocus />
                      <button type="button" onClick={() => setShowOldPwd((v) => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d" }}>
                        {showOldPwd ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px", textTransform: "uppercase" }}>{t2("Nouveau mot de passe", "New Password")}</label>
                      <div style={{ position: "relative" }}>
                        <input type={showNewPwdU ? "text" : "password"} value={changePwdForm.nouveau} onChange={(e) => setChangePwdForm((f) => ({ ...f, nouveau: e.target.value }))}
                          style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "7px", fontSize: "14px", boxSizing: "border-box" }}
                          placeholder={t2("Min. 6 caractères", "Min. 6 characters")} autoFocus />
                        <button type="button" onClick={() => setShowNewPwdU((v) => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d" }}>
                          {showNewPwdU ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px", textTransform: "uppercase" }}>{t2("Confirmer", "Confirm")}</label>
                      <div style={{ position: "relative" }}>
                        <input type={showConfirmPwdU ? "text" : "password"} value={changePwdForm.confirmer} onChange={(e) => setChangePwdForm((f) => ({ ...f, confirmer: e.target.value }))}
                          style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "7px", fontSize: "14px", boxSizing: "border-box" }} />
                        <button type="button" onClick={() => setShowConfirmPwdU((v) => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d" }}>
                          {showConfirmPwdU ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {changePwdError && <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px", borderRadius: "7px", marginBottom: "12px", fontSize: "13px" }}>⚠️ {changePwdError}</div>}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  {changePwdStep === 2 && (
                    <button type="button" onClick={() => { setChangePwdStep(1); setChangePwdError(""); }} style={{ padding: "10px 16px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                      ← {t2("Retour", "Back")}
                    </button>
                  )}
                  <button type="button" onClick={() => setShowChangePwd(false)} style={{ padding: "10px 16px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                    {t2("Annuler", "Cancel")}
                  </button>
                  <button type="submit" disabled={changePwdLoading} style={{ padding: "10px 20px", background: changePwdLoading ? "#95a5a6" : "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>
                    {changePwdLoading ? "…" : changePwdStep === 1 ? t2("Continuer →", "Continue →") : t2("Modifier", "Change")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DÉCONNEXION ── */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "340px", maxWidth: "90vw", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: "#2c3e50" }}>{t2("Déconnexion", "Logout")}</h3>
            <p style={{ margin: "0 0 22px", fontSize: "14px", color: "#7f8c8d" }}>{t2("Vous allez être déconnecté. Continuer ?", "You will be logged out. Continue?")}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ padding: "10px 24px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "14px" }}>
                {t2("Annuler", "Cancel")}
              </button>
              <button onClick={async () => { try { await apiFetch(`${API_BASE}/auth/logout`, { method: "POST" }); } catch {} onLogout(); }} style={{ padding: "10px 24px", background: "#c0392b", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>
                {t2("Déconnecter", "Logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVIGATION BAS MOBILE ── */}
      <nav className="bottom-nav">
        <button className={`bnav-item${page === "profil" ? " bnav-active" : ""}`} onClick={() => setPage("profil")}>
          <span className="bnav-label">{t2("Profil", "Profile")}</span>
        </button>
        <button className={`bnav-item${page === "carte" ? " bnav-active" : ""}`} onClick={() => setPage("carte")}>
          <span className="bnav-label">{t2("Carte", "Card")}</span>
        </button>
        <button className={`bnav-item${page === "payer" ? " bnav-active" : ""}`} onClick={() => setPage("payer")}>
          <span className="bnav-label">{t2("Payer", "Pay")}</span>
        </button>
        <button className={`bnav-item${page === "cotisations" ? " bnav-active" : ""}`} onClick={() => setPage("cotisations")}>
          <span className="bnav-label">{t2("Cotisations", "Contributions")}</span>
        </button>
        <button className={`bnav-item${page === "bureau" ? " bnav-active" : ""}`} onClick={() => setPage("bureau")}>
          <span className="bnav-label">{t2("Bureau", "Board")}</span>
        </button>
        <button className={`bnav-item${page === "messages" ? " bnav-active" : ""}`} style={{ position: "relative" }} onClick={() => { setPage("messages"); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setUserMsgUnread(0); }}>
          <span className="bnav-label">{t2("Messages", "Messages")}</span>
          {userMsgUnread > 0 && <span style={{ position: "absolute", top: "4px", right: "8px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{userMsgUnread}</span>}
        </button>
        <button className="bnav-item" onClick={() => setShowChangePwd(true)}>
          <span className="bnav-label">{t2("Mot de passe", "Password")}</span>
        </button>
        <button className="bnav-item" onClick={() => setShowLogoutConfirm(true)}>
          <span className="bnav-label">{t2("Déconnexion", "Logout")}</span>
        </button>
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGE PUBLIQUE — Carte membre (scannée via QR)
// ═══════════════════════════════════════════════════════
function PublicCarteView({ encodedData }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
      setData(decoded);
    } catch { setError(true); }
  }, [encodedData]);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
      <div style={{ textAlign: "center", color: "#e74c3c", fontSize: "16px" }}>❌ Carte invalide ou expirée.</div>
    </div>
  );
  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
      <div style={{ color: "#7f8c8d" }}>Chargement…</div>
    </div>
  );

  const posteColors = { "président": "#7c3aed", "vice-président": "#1d4ed8", "secrétaire général": "#15803d", "secrétaire adjoint": "#0e7490", "trésorier": "#c2410c", "trésorier adjoint": "#b45309", "commissaire": "#b91c1c", "conseiller": "#475569" };
  const colorKey = data.p ? Object.keys(posteColors).find(k => data.p.toLowerCase().includes(k)) : null;
  const posteColor = colorKey ? posteColors[colorKey] : "#3498db";
  const initials = data.n ? data.n.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a2742 0%, #2c3e50 50%, #1a6a9a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ color: "#a8d8cc", fontSize: "13px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>COTISATION PRO</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "2px" }}>Carte membre numérique</div>
        </div>

        {/* Carte */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          {/* Bandeau gradient haut */}
          <div style={{ background: "linear-gradient(135deg, #1a2742, #2c3e50)", padding: "28px 24px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(52,152,219,0.15)" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "18px", position: "relative" }}>
              {/* Avatar */}
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `linear-gradient(135deg, ${posteColor}, ${posteColor}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "800", color: "white", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: "800", fontSize: "20px", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{data.n}</div>
                {data.m && <div style={{ color: "#a8d8ea", fontSize: "13px", marginTop: "4px", fontWeight: "600" }}>N° {data.m}</div>}
                {data.p && (
                  <div style={{ display: "inline-block", marginTop: "6px", background: posteColor, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 12px", borderRadius: "12px" }}>{data.p}</div>
                )}
              </div>
            </div>
          </div>

          {/* Infos détaillées */}
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Association */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #f0f4f8" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#1a2742", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "18px" }}>🏛️</span>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Association</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{data.a}</div>
              </div>
            </div>

            {/* Contact */}
            {(data.t || data.e) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.t && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "16px" }}>📞</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Téléphone</div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{data.t}</div>
                    </div>
                  </div>
                )}
                {data.e && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "16px" }}>✉️</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.e}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date inscription */}
            {data.d && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: (data.t || data.e) ? "2px" : 0 }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "16px" }}>📅</span>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Membre depuis</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{data.d}</div>
                </div>
              </div>
            )}
          </div>

          {/* Pied de carte — badge vérifié */}
          <div style={{ background: "linear-gradient(135deg, #16a085, #1abc9c)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "white", fontWeight: "800", fontSize: "12px", letterSpacing: "0.5px" }}>✅ Carte vérifiée</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", marginTop: "1px" }}>Cotisation Pro — {data.a}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "6px 12px" }}>
              <div style={{ color: "white", fontSize: "9px", fontWeight: "700", letterSpacing: "1px" }}>MEMBRE ACTIF</div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => window.location.href = window.location.origin}
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", padding: "10px 24px", cursor: "pointer", fontSize: "13px", fontWeight: "600", backdropFilter: "blur(8px)" }}
          >
            🏠 Aller sur Cotisation Pro
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ═══════════════════════════════════════════════════════
function App() {
  // ── Carte publique (scan QR) ──────────────────────────
  const [publicCarteParam] = useState(() => new URLSearchParams(window.location.search).get("carte"));

  // ── Langue ────────────────────────────────────────────
  const [lang, setLang] = useState(() => localStorage.getItem("cotisation_lang") || "fr");
  const t = (key) => (translations[lang] || translations.fr)[key] ?? key;
  useEffect(() => { localStorage.setItem("cotisation_lang", lang); }, [lang]);

  // ── Authentification ──────────────────────────────────
  const [compte, setCompte] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("cotisation_pro_compte")); } catch { return null; }
  });
  const [showLanding, setShowLanding] = useState(true);
  const [initialAuthMode, setInitialAuthMode] = useState("login");

  // Nettoyer l'ancien localStorage au démarrage (migration vers sessionStorage)
  useEffect(() => { localStorage.removeItem("cotisation_pro_compte"); }, []);

  const API_BASE = import.meta.env.VITE_API_BASE || "/api";

  const apiFetch = (url, options = {}) =>
    fetch(url, { ...options, headers: { ...(options.headers || {}), ...(compte?.token ? { Authorization: `Bearer ${compte.token}` } : {}) } });

  const handleLogout = async () => {
    try { await apiFetch(`${API_BASE}/auth/logout`, { method: "POST" }); } catch {}
    sessionStorage.removeItem("cotisation_pro_compte");
    setCompte(null);
    setAdherents([]);
    setPeriodes([]);
    setHistoriqueTransactions([]);
    setShowLanding(true);
  };

  // ─────────────────────────────────────────────────────
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [page, setPage] = useState("accueil");
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [showUnpaidOrPartial, setShowUnpaidOrPartial] = useState(false);
  const [nonRegleTab, setNonRegleTab] = useState("impayes");
  const [showCotisationForm, setShowCotisationForm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const contentRef = useRef(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showAssistanceMenu, setShowAssistanceMenu] = useState(false);
  const assistanceMenuRef = useRef(null);
  const [changePwdStep, setChangePwdStep] = useState(1);
  const [changePwdForm, setChangePwdForm] = useState({ ancien: "", nouveau: "", confirmer: "" });
  const [changePwdError, setChangePwdError] = useState("");
  const [changePwdSuccessMsg, setChangePwdSuccessMsg] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);
  const [showConfirmPwd2, setShowConfirmPwd2] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [changeEmailStep, setChangeEmailStep] = useState(1);
  const [changeEmailForm, setChangeEmailForm] = useState({ email: "", mot_de_passe: "" });
  const [changeEmailOtp, setChangeEmailOtp] = useState("");
  const [changeEmailError, setChangeEmailError] = useState("");
  const [changeEmailSuccess, setChangeEmailSuccess] = useState(false);
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [showChangeEmailPwd, setShowChangeEmailPwd] = useState(false);
  const modalRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPos, setModalPos] = useState({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });

  const [showAddPaiementForm, setShowAddPaiementForm] = useState(false);
  const [addPaiementFormData, setAddPaiementFormData] = useState({
    adherentId: "",
    montantPaye: "",
    modePaiement: "Espèces",
  });
  const [selectedAdherentForPayment, setSelectedAdherentForPayment] = useState(null);
  const [addPaiementError, setAddPaiementError] = useState("");
  const [addPaiementSaving, setAddPaiementSaving] = useState(false);
  const MOIS_LISTE = translations[lang].months;
  const ANNEE_COURANTE = new Date().getFullYear();
  const ANNEES_LISTE = Array.from({ length: 10 }, (_, i) => ANNEE_COURANTE + i);
  const [cotisationFormData, setCotisationFormData] = useState({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showRecuPrompt, setShowRecuPrompt] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [lastPaiement, setLastPaiement] = useState(null);
  const [historiqueTransactions, setHistoriqueTransactions] = useState([]);
  const recuRef = useRef(null);

  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimerRef = useRef(null);
  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast({ message: "", visible: false }), 2000);
  };

  // Animation texte accueil — redémarre après connexion ou changement de langue
  useEffect(() => {
    if (!compte) {
      setCurrentText("");
      return;
    }
    const fullText = t("welcomeText");
    let index = 0;
    setCurrentText("");
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setCurrentText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [compte, lang]);

  // Drag modal
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setModalPos({
          top: e.clientY - dragOffset.y + "px",
          left: e.clientX - dragOffset.x + "px",
          transform: "none",
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const [adherents, setAdherents] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [loadingAdherents, setLoadingAdherents] = useState(false);
  const [apiError, setApiError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const AUDIT_LIMIT = 50;
  const [adminMessages, setAdminMessages] = useState([]);
  const [msgForm, setMsgForm] = useState({ titre: "", contenu: "" });
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");
  const [adminMsgUnread, setAdminMsgUnread] = useState(0);
  const [msgTab, setMsgTab] = useState("nouveau");
  const [msgEmojiOpen, setMsgEmojiOpen] = useState(null);
  const [msgTooltip, setMsgTooltip] = useState(null);
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // ── Mobile Money ─────────────────────────────────────────────
  const MM_EMPTY = { om_numero: "", om_nom: "", wave_numero: "", wave_nom: "", mtn_numero: "", mtn_nom: "" };
  const [mmConfig, setMmConfig] = useState(MM_EMPTY);
  const [mmForm, setMmForm] = useState(MM_EMPTY);
  const [mmEditMode, setMmEditMode] = useState(false);
  const [mmSaving, setMmSaving] = useState(false);
  const [mmSuccess, setMmSuccess] = useState("");
  const [mmError, setMmError] = useState("");

  // ── Comptabilité ─────────────────────────────────────────────
  const CATEG_DEPENSES = ["Alimentation", "Transport", "Location / Loyer", "Salaires / Honoraires", "Communication", "Matériel", "Événement", "Autre"];
  const [depenses, setDepenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [comptaResume, setComptaResume] = useState({ recettes: 0, depenses: 0, solde: 0 });
  const [comptaLoading, setComptaLoading] = useState(false);
  const [comptaSousOnglet, setComptaSousOnglet] = useState("recettes");
  const [evolution, setEvolution] = useState([]);
  const [recettesSearch, setRecettesSearch] = useState("");
  const [depensesSearch, setDepensesSearch] = useState("");
  const [depenseForm, setDepenseForm] = useState({ libelle: "", montant: "", categorie: "Autre", date_depense: new Date().toISOString().split("T")[0], description: "" });
  const [depenseFormVisible, setDepenseFormVisible] = useState(false);
  const [depenseError, setDepenseError] = useState("");
  const [depenseLoading, setDepenseLoading] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ libelle: "", montant_prevu: "", date_debut: "", date_fin: "" });
  const [budgetFormVisible, setBudgetFormVisible] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [budgetEditId, setBudgetEditId] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [comptaFiltreDateDebut, setComptaFiltreDateDebut] = useState("");
  const [comptaFiltreDateFin, setComptaFiltreDateFin] = useState("");
  const [depenseEditId, setDepenseEditId] = useState(null);
  const [livreData, setLivreData] = useState([]);
  const [recouvrementData, setRecouvrementData] = useState([]);

  // ── Profil membre ───────────────────────────────────────────
  const [profilData, setProfilData] = useState({ nom: "", prenom: "", telephone: "", photo: "", email: "", matricule: "", date_inscription: "" });
  const [mesCotisations, setMesCotisations] = useState([]);
  const [mesCotisationsLoading, setMesCotisationsLoading] = useState(false);
  const [profilLoading, setProfilLoading] = useState(false);
  const [profilSaving, setProfilSaving] = useState(false);
  const [profilSuccess, setProfilSuccess] = useState("");
  const [profilError, setProfilError] = useState("");
  const [profilEditMode, setProfilEditMode] = useState(false);
  const [profilEditForm, setProfilEditForm] = useState({ nom: "", prenom: "", telephone: "", photo: "" });
  const [roleTransferPoste, setRoleTransferPoste] = useState("Président(e)");
  const [roleTransferTargetId, setRoleTransferTargetId] = useState("");
  const [roleTransferMyPoste, setRoleTransferMyPoste] = useState("");
  const [roleTransferLoading, setRoleTransferLoading] = useState(false);
  const [roleTransferError, setRoleTransferError] = useState("");
  const [roleTransferSuccess, setRoleTransferSuccess] = useState("");
  const [adminCarteQRUrl, setAdminCarteQRUrl] = useState("");
  const [adminCarteDownloading, setAdminCarteDownloading] = useState(false);

  // ── Expiration automatique de session ───────────────────
  const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes
  const COUNTDOWN_S   = 60;             // 60 s de préavis
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(COUNTDOWN_S);
  const inactivityTimer  = useRef(null);
  const countdownTimer   = useRef(null);
  const warningActiveRef = useRef(false);

  const loadMMConfig = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/mobile-money/config`);
      if (!res.ok) return;
      const data = await res.json();
      const cfg = { om_numero: data.om_numero || "", om_nom: data.om_nom || "", wave_numero: data.wave_numero || "", wave_nom: data.wave_nom || "", mtn_numero: data.mtn_numero || "", mtn_nom: data.mtn_nom || "" };
      setMmConfig(cfg);
      setMmForm(cfg);
    } catch {}
  };

  const saveMMConfig = async () => {
    setMmSaving(true); setMmError(""); setMmSuccess("");
    try {
      const res = await apiFetch(`${API_BASE}/mobile-money/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mmForm),
      });
      const data = await res.json();
      if (!res.ok) { setMmError(data.error || "Erreur."); return; }
      setMmConfig({ ...mmForm });
      setMmEditMode(false);
      setMmSuccess(lang === "fr" ? "Configuration Mobile Money enregistrée ✓" : "Mobile Money config saved ✓");
      setTimeout(() => setMmSuccess(""), 3000);
    } catch { setMmError("Erreur réseau."); }
    finally { setMmSaving(false); }
  };

  const loadProfil = async () => {
    setProfilLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/me`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.type === "admin" && data.adherent) {
        setProfilData({
          nom: data.adherent.nom || data.nom_association || "", prenom: data.adherent.prenom || "",
          telephone: data.telephone || "", photo: data.adherent.photo || "",
          email: data.email || "", matricule: data.adherent.matricule || "",
          date_inscription: data.adherent.date_inscription || data.created_at || "",
          poste: data.adherent.poste || null,
        });
      } else {
        setProfilData({
          nom: data.nom || "", prenom: data.prenom || "",
          telephone: data.telephone || "", photo: data.photo || "",
          email: data.email || "", matricule: data.matricule || "",
          date_inscription: data.date_inscription || "",
          poste: data.poste || null,
        });
      }
    } catch {} finally { setProfilLoading(false); }
    if (isAdmin) loadMMConfig();
  };

  const loadAdherentCotisations = async (id) => {
    setSelectedAdherentCotisationsLoading(true);
    setSelectedAdherentCotisations([]);
    try {
      const res = await apiFetch(`${API_BASE}/adherents/${id}/cotisations`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedAdherentCotisations(Array.isArray(data) ? data : []);
    } catch {} finally { setSelectedAdherentCotisationsLoading(false); }
  };

  const saveProfil = async () => {
    setProfilError(""); setProfilSuccess("");
    if (!profilEditForm.nom.trim() || !profilEditForm.prenom.trim()) {
      setProfilError(lang === "fr" ? "Nom et prénom obligatoires." : "First and last name are required.");
      return;
    }
    setProfilSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: profilEditForm.nom.trim(), prenom: profilEditForm.prenom.trim(), telephone: profilEditForm.telephone.trim(), photo: profilEditForm.photo }),
      });
      const data = await res.json();
      if (!res.ok) { setProfilError(data.error || t("networkError")); return; }
      const updated = { nom: profilEditForm.nom.trim(), prenom: profilEditForm.prenom.trim(), telephone: profilEditForm.telephone.trim(), photo: profilEditForm.photo };
      setProfilData(prev => ({ ...prev, ...updated }));
      setAdminCarteQRUrl(""); // Forcer régénération du QR avec les nouvelles infos
      setProfilEditMode(false);
      setProfilSuccess(lang === "fr" ? "Profil mis à jour avec succès ✅" : "Profile updated successfully ✅");
      setTimeout(() => setProfilSuccess(""), 3500);
    } catch { setProfilError(t("networkError")); } finally { setProfilSaving(false); }
  };

  const loadMesCotisations = async () => {
    setMesCotisationsLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/me/cotisations`);
      if (!res.ok) return;
      const data = await res.json();
      setMesCotisations(Array.isArray(data) ? data : []);
    } catch {} finally { setMesCotisationsLoading(false); }
  };

  const generateAdminCarteQR = async (data) => {
    const p = data || profilData;
    if (!p || !p.nom) return;
    try {
      const content = [
        `Association: ${compte.nom_association}`,
        `Membre: ${p.nom} ${p.prenom}`,
        `Matricule: ${p.matricule || "N/A"}`,
        p.poste ? `Poste: ${p.poste}` : "",
      ].filter(Boolean).join("\n");
      const url = await QRCode.toDataURL(content, { width: 200, margin: 1, color: { dark: "#1a2a3a", light: "#ffffff" } });
      setAdminCarteQRUrl(url);
    } catch {}
  };

  const downloadAdminCarte = async () => {
    if (!profilData.nom || adminCarteDownloading) return;
    setAdminCarteDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [54, 86] });
      const W = 86, H = 54;
      doc.setFillColor(26, 39, 66);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(52, 152, 219, 0.3);
      doc.circle(W - 10, -10, 30, "F");
      try {
        const img = new window.Image();
        img.src = logo;
        await new Promise(r => { img.onload = r; img.onerror = r; });
        doc.addImage(img, "PNG", 4, 4, 10, 10);
      } catch {}
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text(compte.nom_association || "", 16, 9, { maxWidth: 45 });
      doc.setFontSize(5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(168, 216, 240);
      doc.text("CARTE MEMBRE", 16, 13.5, { charSpace: 1.5 });
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.3);
      doc.line(4, 17, W - 4, 17);
      if (profilData.photo) {
        try {
          doc.addImage(profilData.photo, "JPEG", 4, 20, 22, 22);
        } catch {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text(`${profilData.prenom} ${profilData.nom}`, 30, 24);
      doc.setTextColor(150, 200, 220);
      doc.setFontSize(6);
      doc.setFont(undefined, "normal");
      doc.text(`N° ${profilData.matricule || "N/A"}`, 30, 28);
      if (profilData.poste) {
        doc.setFillColor(22, 160, 133);
        doc.roundedRect(29, 30, Math.min(profilData.poste.length * 1.7 + 5, 34), 5.5, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont(undefined, "bold");
        doc.text(profilData.poste, 31.5, 33.5);
      }
      if (adminCarteQRUrl) {
        const qS = 26, qX = W - qS - 4, qY = (H - qS) / 2 + 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qX - 1, qY - 1, qS + 2, qS + 2, 1.5, 1.5, "F");
        doc.addImage(adminCarteQRUrl, "PNG", qX, qY, qS, qS);
        doc.setFontSize(4.5);
        doc.setTextColor(200, 220, 240);
        doc.text("Scannez pour vérifier", qX + qS / 2, qY + qS + 2.5, { align: "center" });
      }
      doc.setFontSize(5);
      doc.setTextColor(200, 220, 240);
      doc.text(compte.nom_association || "", W - 4, H - 3.5, { align: "right" });
      doc.save(`carte-membre-${profilData.matricule || profilData.nom}.pdf`);
    } catch (e) {
      console.error("Erreur carte PDF:", e);
    } finally {
      setAdminCarteDownloading(false);
    }
  };

  // ── Chargement des adhérents ────────────────────────────────
  const loadAdherents = async () => {
    try {
      setLoadingAdherents(true);
      setApiError("");
      const response = await apiFetch(`${API_BASE}/adherents`);
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Impossible de charger les adhérents");
      }
      const data = await response.json();
      setAdherents(data.map((a) => ({ ...a, date: a.date_inscription || a.date || "", paid: a.paid ?? false })));
    } catch (error) {
      console.error(error);
      setApiError(error.message || "Erreur réseau");
    } finally {
      setLoadingAdherents(false);
    }
  };

  // ── Chargement des périodes ─────────────────────────────────
  const loadPeriodes = async (autoSelectLibelle = null) => {
    try {
      const response = await apiFetch(`${API_BASE}/periodes`);
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) throw new Error("Erreur chargement périodes");
      const data = await response.json();
      setPeriodes(data);
      if (autoSelectLibelle) {
        setSelectedPeriode(autoSelectLibelle);
      } else if (data.length > 0) {
        setSelectedPeriode((prev) => prev || data[data.length - 1].libelle);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ── Chargement de l'historique ──────────────────────────────
  const loadHistorique = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/historique`);
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) throw new Error("Erreur chargement historique");
      const data = await response.json();
      setHistoriqueTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadAuditLogs = async (offset = 0, action = "") => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ limit: AUDIT_LIMIT, offset });
      if (action) params.set("action", action);
      const res = await apiFetch(`${API_BASE}/audit-logs?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setAuditLogs(data.rows || []);
      setAuditTotal(data.total || 0);
    } catch {} finally { setAuditLoading(false); }
  };

  const loadMessages = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setAdminMessages(Array.isArray(data) ? data : []);
      const seenKey = `msg_seen_${compte?.email}`;
      const seenAt = parseInt(localStorage.getItem(seenKey) || "0");
      setAdminMsgUnread((Array.isArray(data) ? data : []).filter(m => new Date(m.created_at).getTime() > seenAt).length);
    } catch {}
  };

  const loadComptaResume = async (dateDebut = comptaFiltreDateDebut, dateFin = comptaFiltreDateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.set("dateDebut", dateDebut);
      if (dateFin) params.set("dateFin", dateFin);
      const res = await apiFetch(`${API_BASE}/comptabilite/resume?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setComptaResume(data);
    } catch {}
  };

  const loadDepenses = async (dateDebut = comptaFiltreDateDebut, dateFin = comptaFiltreDateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.set("dateDebut", dateDebut);
      if (dateFin) params.set("dateFin", dateFin);
      const res = await apiFetch(`${API_BASE}/depenses?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setDepenses(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadBudgets = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/budgets`);
      if (!res.ok) return;
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadEvolution = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/comptabilite/evolution`);
      if (!res.ok) return;
      setEvolution(await res.json());
    } catch {}
  };

  const loadLivreDeCaisse = async (dateDebut = comptaFiltreDateDebut, dateFin = comptaFiltreDateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.set("dateDebut", dateDebut);
      if (dateFin) params.set("dateFin", dateFin);
      const res = await apiFetch(`${API_BASE}/comptabilite/livre-de-caisse?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLivreData(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadRecouvrement = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/comptabilite/recouvrement`);
      if (!res.ok) return;
      const data = await res.json();
      setRecouvrementData(Array.isArray(data) ? data : []);
    } catch {}
  };

  const exportExcelFinancier = async () => {
    try {
      const xlsxMod = await import("xlsx-js-style");
      const XL = xlsxMod.default || xlsxMod;

      const wb = XL.utils.book_new();
      const nomAssoc = compte?.nom_association || "association";
      const today = new Date().toISOString().split("T")[0];
      const hStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "16A085" } }, alignment: { horizontal: "center" } };
      const applyHeaders = (ws, aoa, style) => aoa[0].forEach((_, ci) => { const cell = ws[XL.utils.encode_cell({ r: 0, c: ci })]; if (cell) cell.s = style; });

      // Feuille Recettes
      const recAoa = [
        ["Date", "N° Reçu", "Membre", "Période", "Montant (FCFA)", "Mode de paiement"],
        ...historiqueTransactions.map(tx => [tx.datePaiement, tx.numeroRecu || "", `${tx.nom} ${tx.prenom}`, tx.periode, parseAmount(tx.montantPaye), tx.modePaiement]),
      ];
      const wsRec = XL.utils.aoa_to_sheet(recAoa);
      applyHeaders(wsRec, recAoa, hStyle);
      wsRec["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 18 }];
      XL.utils.book_append_sheet(wb, wsRec, "Recettes");

      // Feuille Dépenses
      const depAoa = [
        ["Date", "Libellé", "Catégorie", "Montant (FCFA)", "Description"],
        ...depenses.map(d => [new Date(d.date_depense).toLocaleDateString("fr-FR"), d.libelle, d.categorie, Number(d.montant), d.description || ""]),
      ];
      const wsDep = XL.utils.aoa_to_sheet(depAoa);
      applyHeaders(wsDep, depAoa, { ...hStyle, fill: { fgColor: { rgb: "E74C3C" } } });
      wsDep["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 20 }, { wch: 16 }, { wch: 30 }];
      XL.utils.book_append_sheet(wb, wsDep, "Dépenses");

      // Feuille Livre de caisse
      if (livreData.length > 0) {
        const livreAoa = [
          ["Date", "Type", "Libellé", "Entrée (FCFA)", "Sortie (FCFA)", "Solde (FCFA)", "Référence"],
          ...livreData.map(l => [l.date ? new Date(l.date).toLocaleDateString("fr-FR") : "", l.type, l.libelle, l.entree || "", l.sortie || "", l.solde, l.ref || ""]),
        ];
        const wsLivre = XL.utils.aoa_to_sheet(livreAoa);
        applyHeaders(wsLivre, livreAoa, { ...hStyle, fill: { fgColor: { rgb: "2C3E50" } } });
        wsLivre["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
        XL.utils.book_append_sheet(wb, wsLivre, "Livre de caisse");
      }

      // Feuille Recouvrement
      if (recouvrementData.length > 0) {
        const recouAoa = [
          ["Période", "Montant dû (FCFA)", "Membres attendus", "Ont payé", "Payé complet", "Taux (%)", "Montant collecté (FCFA)"],
          ...recouvrementData.map(r => [r.libelle, r.montant_du, r.attendus, r.ont_paye, r.payes_complets, r.taux, r.montant_collecte]),
        ];
        const wsRecou = XL.utils.aoa_to_sheet(recouAoa);
        applyHeaders(wsRecou, recouAoa, { ...hStyle, fill: { fgColor: { rgb: "8E44AD" } } });
        wsRecou["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 22 }];
        XL.utils.book_append_sheet(wb, wsRecou, "Recouvrement");
      }

      XL.writeFile(wb, `export-financier-${nomAssoc}-${today}.xlsx`);
    } catch (err) {
      if (err.name !== "AbortError") showToast("Erreur export Excel : " + err.message);
    }
  };

  const loadComptabilite = async (dateDebut = comptaFiltreDateDebut, dateFin = comptaFiltreDateFin) => {
    setComptaLoading(true);
    await Promise.all([loadComptaResume(dateDebut, dateFin), loadDepenses(dateDebut, dateFin), loadBudgets(), loadEvolution(), loadHistorique(), loadLivreDeCaisse(dateDebut, dateFin), loadRecouvrement()]);
    setComptaLoading(false);
  };

  const genererRapportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, margin = 16;
    let y = 0;
    const fmt = (n) => Number(n).toLocaleString("fr-FR") + " FCFA";
    const moisFr = (m) => { const [yr, mo] = m.split("-"); const noms = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"]; return `${noms[parseInt(mo)-1]} ${yr}`; };

    // En-tête
    doc.setFillColor(26,42,58); doc.rect(0,0,W,28,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont(undefined,"bold");
    doc.text("RAPPORT FINANCIER", margin, 13);
    doc.setFontSize(9); doc.setFont(undefined,"normal");
    doc.text(compte.nom_association || "", margin, 20);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, W-margin, 20, { align:"right" });
    y = 36;

    // Résumé
    doc.setTextColor(44,62,80); doc.setFontSize(12); doc.setFont(undefined,"bold");
    doc.text("RÉSUMÉ FINANCIER", margin, y); y += 6;
    doc.setDrawColor(220,230,240); doc.line(margin, y, W-margin, y); y += 5;
    const cards = [["Recettes (cotisations)", comptaResume.recettes, [39,174,96]], ["Dépenses", comptaResume.depenses, [231,76,60]], ["Solde net", comptaResume.solde, comptaResume.solde >= 0 ? [41,128,185] : [231,76,60]]];
    cards.forEach(([lbl, val, rgb]) => {
      doc.setFontSize(10); doc.setFont(undefined,"normal"); doc.setTextColor(127,140,141); doc.text(lbl, margin, y);
      doc.setFont(undefined,"bold"); doc.setTextColor(...rgb); doc.text(fmt(val), W-margin, y, { align:"right" }); y += 7;
    });
    y += 4;

    // Évolution mensuelle
    if (evolution.length > 0) {
      doc.setTextColor(44,62,80); doc.setFontSize(12); doc.setFont(undefined,"bold");
      doc.text("ÉVOLUTION MENSUELLE", margin, y); y += 6;
      doc.setDrawColor(220,230,240); doc.line(margin, y, W-margin, y); y += 4;
      doc.setFontSize(9); doc.setFont(undefined,"bold"); doc.setTextColor(127,140,141);
      doc.text("Mois", margin, y); doc.text("Recettes", 100, y); doc.text("Dépenses", 140, y); doc.text("Solde", W-margin, y, { align:"right" }); y += 5;
      evolution.slice(-6).forEach((e, i) => {
        doc.setFillColor(i%2===0 ? 249:255, i%2===0 ? 249:255, i%2===0 ? 249:255); doc.rect(margin-2, y-4, W-2*margin+4, 6, "F");
        doc.setFont(undefined,"normal"); doc.setTextColor(44,62,80); doc.text(moisFr(e.mois), margin, y);
        doc.setTextColor(39,174,96); doc.text(fmt(e.recettes), 100, y);
        doc.setTextColor(231,76,60); doc.text(fmt(e.depenses), 140, y);
        const s = e.recettes - e.depenses; doc.setTextColor(s>=0?41:231, s>=0?128:76, s>=0?185:60); doc.text(fmt(s), W-margin, y, { align:"right" }); y += 6;
      });
      y += 4;
    }

    // Top dépenses par catégorie
    if (depenses.length > 0) {
      doc.setTextColor(44,62,80); doc.setFontSize(12); doc.setFont(undefined,"bold");
      doc.text("DÉPENSES PAR CATÉGORIE", margin, y); y += 6;
      doc.setDrawColor(220,230,240); doc.line(margin, y, W-margin, y); y += 4;
      const byCateg = {};
      depenses.forEach(d => { byCateg[d.categorie] = (byCateg[d.categorie]||0) + Number(d.montant); });
      const sorted = Object.entries(byCateg).sort((a,b)=>b[1]-a[1]);
      sorted.forEach(([cat,tot],i) => {
        doc.setFillColor(i%2===0?249:255, i%2===0?249:255, i%2===0?249:255); doc.rect(margin-2, y-4, W-2*margin+4, 6, "F");
        doc.setFontSize(9); doc.setFont(undefined,"normal"); doc.setTextColor(44,62,80); doc.text(cat, margin, y);
        doc.setTextColor(231,76,60); doc.text(fmt(tot), W-margin, y, { align:"right" }); y += 6;
      });
    }

    doc.save(`rapport-financier-${compte.nom_association || "association"}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleSaveDepense = async () => {
    setDepenseError("");
    if (!depenseForm.libelle.trim()) { setDepenseError("Le libellé est requis."); return; }
    if (!depenseForm.montant || parseFloat(depenseForm.montant) <= 0) { setDepenseError("Le montant doit être positif."); return; }
    if (!depenseForm.date_depense) { setDepenseError("La date est requise."); return; }
    setDepenseLoading(true);
    try {
      const isEdit = depenseEditId !== null;
      const url = isEdit ? `${API_BASE}/depenses/${depenseEditId}` : `${API_BASE}/depenses`;
      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depenseForm),
      });
      const data = await res.json();
      if (!res.ok) { setDepenseError(data.error || "Erreur."); return; }
      if (isEdit) {
        setDepenses(prev => prev.map(d => d.id === depenseEditId ? data : d));
      } else {
        setDepenses(prev => [data, ...prev]);
      }
      setDepenseForm({ libelle: "", montant: "", categorie: "Autre", date_depense: new Date().toISOString().split("T")[0], description: "" });
      setDepenseFormVisible(false);
      setDepenseEditId(null);
      loadComptaResume();
      showToast(isEdit ? (lang === "fr" ? "Dépense modifiée ✓" : "Expense updated ✓") : (lang === "fr" ? "Dépense enregistrée ✓" : "Expense recorded ✓"));
    } catch { setDepenseError("Erreur réseau."); }
    finally { setDepenseLoading(false); }
  };

  const handleDeleteDepense = async (id) => {
    if (!window.confirm(lang === "fr" ? "Supprimer cette dépense ?" : "Delete this expense?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/depenses/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setDepenses(prev => prev.filter(d => d.id !== id));
      loadComptaResume();
      showToast(lang === "fr" ? "Dépense supprimée." : "Expense deleted.");
    } catch {}
  };

  const handleSaveBudget = async () => {
    setBudgetError("");
    if (!budgetForm.libelle.trim()) { setBudgetError("Le libellé est requis."); return; }
    if (!budgetForm.montant_prevu || parseFloat(budgetForm.montant_prevu) <= 0) { setBudgetError("Le montant prévu doit être positif."); return; }
    setBudgetLoading(true);
    try {
      const isEdit = budgetEditId !== null;
      const url = isEdit ? `${API_BASE}/budgets/${budgetEditId}` : `${API_BASE}/budgets`;
      const method = isEdit ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetForm),
      });
      const data = await res.json();
      if (!res.ok) { setBudgetError(data.error || "Erreur."); return; }
      setBudgetFormVisible(false);
      setBudgetEditId(null);
      setBudgetForm({ libelle: "", montant_prevu: "", date_debut: "", date_fin: "" });
      loadBudgets();
      showToast(isEdit ? (lang === "fr" ? "Budget modifié ✓" : "Budget updated ✓") : (lang === "fr" ? "Budget créé ✓" : "Budget created ✓"));
    } catch { setBudgetError("Erreur réseau."); }
    finally { setBudgetLoading(false); }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm(lang === "fr" ? "Supprimer ce budget ?" : "Delete this budget?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setBudgets(prev => prev.filter(b => b.id !== id));
      showToast(lang === "fr" ? "Budget supprimé." : "Budget deleted.");
    } catch {}
  };

  const loadServerStatus = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/health`);
      if (res.ok) setServerStatus(await res.json());
    } catch {}
  };

  const handleTestSms = async () => {
    if (!testSmsPhone.trim()) return;
    setTestSmsLoading(true);
    setTestSmsResult(null);
    try {
      const res = await apiFetch(`${API_BASE}/admin/test-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: testSmsPhone.trim() }),
      });
      const data = await res.json();
      setTestSmsResult({ ok: res.ok, ...data });
    } catch {
      setTestSmsResult({ ok: false, error: "Erreur réseau." });
    } finally {
      setTestSmsLoading(false);
    }
  };

  const handleEnvoyerRappels = async (periodeId) => {
    setRappelLoading(true);
    setRappelResult(null);
    try {
      const res = await apiFetch(`${API_BASE}/cotisations/${periodeId}/rappels`, { method: "POST" });
      const data = await res.json();
      setRappelResult({ ok: res.ok, ...data });
    } catch {
      setRappelResult({ ok: false, error: "Erreur réseau." });
    } finally {
      setRappelLoading(false);
    }
  };

  const handleReactMessage = async (id, emoji) => {
    setMsgEmojiOpen(null);
    try {
      const res = await apiFetch(`${API_BASE}/messages/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: data.reactions } : m));
    } catch {}
  };

  const loadDemandesPaiement = async () => {
    try {
      const r = await apiFetch(`${API_BASE}/demandes-paiement`);
      if (r.ok) { const d = await r.json(); setDemandesPaiement(Array.isArray(d) ? d : []); }
    } catch {}
  };

  useEffect(() => { if (compte) { loadAdherents(); loadPeriodes(); loadHistorique(); loadMessages(); loadServerStatus(); loadProfil(); loadComptaResume(); loadDemandesPaiement(); } }, [compte]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SSE — rafraîchissement temps réel quand un rôle change ───
  useEffect(() => {
    if (!compte?.token) return;
    const es = new EventSource(`${API_BASE}/events?token=${encodeURIComponent(compte.token)}`);
    es.addEventListener("adherents_updated", () => {
      loadAdherents();
      // Resync le poste de l'utilisateur courant (si c'est lui qui a été affecté)
      apiFetch(`${API_BASE}/me`).then(r => r.ok ? r.json() : null).then(d => {
        if (!d || !compte) return;
        const newPoste = d.type === "admin" ? (d.adherent?.poste ?? null) : (d.poste ?? null);
        if (newPoste !== compte.poste) {
          const updated = { ...compte, poste: newPoste };
          sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(updated));
          setCompte(updated);
        }
      }).catch(() => {});
    });
    es.addEventListener("messages_updated", () => {
      loadMessages();
    });
    return () => es.close();
  }, [compte?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rafraîchir le poste du membre connecté depuis le serveur à chaque changement de page
  // → si son poste a changé (ex : un autre l'a nommé trésorier), l'interface se met à jour sans reconnexion
  useEffect(() => {
    if (!compte || compte?.role !== "user") return;
    const refresh = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/me`);
        if (!res.ok) return;
        const data = await res.json();
        const serverPoste = data.poste || null;
        if (serverPoste !== compte?.poste) {
          const updatedCompte = { ...compte, poste: serverPoste };
          sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(updatedCompte));
          setCompte(updatedCompte);
          // Nouveau haut-membre : ouvrir directement l'onglet "Reçus" pour voir les messages
          if (serverPoste && !compte?.poste) {
            setMsgTab("recus");
          }
          // Perte de poste : revenir sur l'onglet "Reçus" (onglet neutre, liste toujours visible)
          if (!serverPoste && compte?.poste) {
            setMsgTab("recus");
          }
        }
      } catch {}
    };
    refresh();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fermer le menu compte au clic en dehors
  useEffect(() => {
    if (!showAccountMenu) return;
    const handler = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target))
        setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAccountMenu]);

  // Fermer le menu Assistance au clic en dehors
  useEffect(() => {
    if (!showAssistanceMenu) return;
    const handler = (e) => {
      if (assistanceMenuRef.current && !assistanceMenuRef.current.contains(e.target))
        setShowAssistanceMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAssistanceMenu]);

  // Transition de page : animation fade+slide sur le contenu
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.classList.remove("page-enter");
    void el.offsetWidth;
    el.classList.add("page-enter");
  }, [page]);


  // Générer le QR code de la carte admin quand le profil est chargé
  useEffect(() => {
    if (page === "profil" && profilData.nom && !adminCarteQRUrl) {
      generateAdminCarteQR(profilData);
    }
  }, [page, profilData.nom]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Minuterie d'inactivité ──────────────────────────────
  useEffect(() => {
    if (!compte) return;
    const startInactivityTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        warningActiveRef.current = true;
        setShowInactivityWarning(true);
        setInactivityCountdown(COUNTDOWN_S);
      }, INACTIVITY_MS);
    };
    const onActivity = () => {
      if (warningActiveRef.current) return;
      startInactivityTimer();
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));
    startInactivityTimer();
    return () => {
      events.forEach(ev => document.removeEventListener(ev, onActivity));
      clearTimeout(inactivityTimer.current);
    };
  }, [compte]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compte à rebours quand le warning est affiché
  useEffect(() => {
    if (!showInactivityWarning) return;
    countdownTimer.current = setInterval(() => {
      setInactivityCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer.current);
  }, [showInactivityWarning]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStayLoggedIn = () => {
    warningActiveRef.current = false;
    clearInterval(countdownTimer.current);
    setShowInactivityWarning(false);
    setInactivityCountdown(COUNTDOWN_S);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      warningActiveRef.current = true;
      setShowInactivityWarning(true);
      setInactivityCountdown(COUNTDOWN_S);
    }, INACTIVITY_MS);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwdError("");
    if (changePwdStep === 1) {
      if (!changePwdForm.ancien) { setChangePwdError(t("allFieldsRequired")); return; }
      setChangePwdLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/auth/verify-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mot_de_passe: changePwdForm.ancien }),
        });
        const data = await res.json();
        if (!res.ok) { setChangePwdError(data.error || t("changePwdOldWrong")); return; }
        setChangePwdStep(2);
      } catch { setChangePwdError(t("networkError")); }
      finally { setChangePwdLoading(false); }
      return;
    }
    if (!changePwdForm.nouveau || !changePwdForm.confirmer) { setChangePwdError(t("allFieldsRequired")); return; }
    if (!pwdOk(changePwdForm.nouveau)) { setChangePwdError(t("passwordMinLength")); return; }
    if (changePwdForm.nouveau !== changePwdForm.confirmer) { setChangePwdError(t("passwordsNoMatch")); return; }
    setChangePwdLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ancien_mot_de_passe: changePwdForm.ancien, nouveau_mot_de_passe: changePwdForm.nouveau }),
      });
      const data = await res.json();
      if (!res.ok) { setChangePwdError(data.error || t("networkError")); return; }
      setChangePwdSuccessMsg(true);
      setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" });
      setChangePwdStep(1);
    } catch { setChangePwdError(t("networkError")); }
    finally { setChangePwdLoading(false); }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setChangeEmailError("");
    if (changeEmailStep === 1) {
      if (!changeEmailForm.email.trim() || !changeEmailForm.mot_de_passe) { setChangeEmailError(t("allFieldsRequired")); return; }
      setChangeEmailLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/auth/send-change-email-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nouveau_email: changeEmailForm.email.trim(), mot_de_passe: changeEmailForm.mot_de_passe }),
        });
        const data = await res.json();
        if (!res.ok) { setChangeEmailError(data.error || t("networkError")); return; }
        setChangeEmailStep(2);
      } catch { setChangeEmailError(t("networkError")); }
      finally { setChangeEmailLoading(false); }
    } else {
      if (!changeEmailOtp.trim()) { setChangeEmailError(t("enterAllDigits")); return; }
      setChangeEmailLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/auth/change-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nouveau_email: changeEmailForm.email.trim(), otp: changeEmailOtp.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { setChangeEmailError(data.error || t("networkError")); return; }
        const updated = { ...compte, email: data.email, token: data.token };
        sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(updated));
        setCompte(updated);
        setChangeEmailSuccess(true);
      } catch { setChangeEmailError(t("networkError")); }
      finally { setChangeEmailLoading(false); }
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistorique, setSearchHistorique] = useState("");
  const [selectedAdherentId, setSelectedAdherentId] = useState(null);
  const [selectedAdherentCotisations, setSelectedAdherentCotisations] = useState([]);
  const [selectedAdherentCotisationsLoading, setSelectedAdherentCotisationsLoading] = useState(false);
  const [fichePosteSelected, setFichePosteSelected] = useState("");
  const [fichePosteLoading, setFichePosteLoading] = useState(false);
  const [fichePosteSuccess, setFichePosteSuccess] = useState("");
  const [fichePosteError, setFichePosteError] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [selectedStatutFilter, setSelectedStatutFilter] = useState("tous");
  const [cotisationSearchTerm, setCotisationSearchTerm] = useState("");
  const [demandesPaiement, setDemandesPaiement] = useState([]);
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rappelLoading, setRappelLoading] = useState(false);
  const [showRappelModal, setShowRappelModal] = useState(false);
  const [rappelResult, setRappelResult] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState(null);

  // ── Gestion utilisateurs (admin) ───────────────────────────
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ nom: "", prenom: "", email: "", telephone: "", mot_de_passe: "", date_inscription: "" });
  const [createUserError, setCreateUserError] = useState("");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserSuccess, setCreateUserSuccess] = useState("");
  const [showCreateUserPwd, setShowCreateUserPwd] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteResetting, setInviteResetting] = useState(false);

  const [formData, setFormData] = useState({
    matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false, photo: "", photoName: "", poste: "",
  });

  // ── Utilitaires (définis en premier car utilisés dans les valeurs calculées) ──
  const parseAmount = (value) =>
    Number(String(value || "").replace(/[^0-9.-]/g, "")) || 0;
  const formatAmount = (value) => `${value.toLocaleString("fr-FR")} F`;

  // ── Valeurs calculées ───────────────────────────────────────
  const currentPeriode = periodes.length > 0 ? periodes[periodes.length - 1] : null;

  const totalEncaissePeriodeCourante = currentPeriode
    ? currentPeriode.paiements.reduce((sum, pay) => sum + parseAmount(pay.soldePaye), 0)
    : 0;

  const cinqDerniersPaiements = historiqueTransactions.slice(-5).reverse();

  const currentPeriodeNotPaid = currentPeriode
    ? adherents.filter((a) => {
        const paiement = currentPeriode.paiements.find((p) => p.adherent_id === a.id);
        return !paiement || paiement.statut === "Impayé" || paiement.statut === "Partiel";
      })
    : [];

  const currentPeriodeNotPaidCount = currentPeriodeNotPaid.length;
  const currentPeriodeNotPaidIds = currentPeriodeNotPaid.map((a) => a.id);

  const filteredAdherents = adherents
    .filter(
      (a) =>
        a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.matricule || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((a, index) => ({ ...a, originalIndex: index }));

  const visibleAdherents = adherents
    .map((a, index) => ({ ...a, originalIndex: index }))
    .filter((a) => {
      if (showUnpaidOnly) return !a.paid;
      if (showUnpaidOrPartial) return currentPeriodeNotPaidIds.includes(a.id);
      return true;
    });

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const generateNumeroRecu = () => {
    const now = new Date();
    return `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
  };

  // ── Enregistrer une cotisation ──────────────────────────────
  const handleSaveCotisation = async () => {
    if (!cotisationFormData.montantDu || !cotisationFormData.periode) {
      alert(t("alertFillAmountPeriod"));
      return;
    }
    try {
      const response = await apiFetch(`${API_BASE}/periodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libelle: cotisationFormData.periode,
          montantDu: cotisationFormData.montantDu,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur création cotisation");
      const newLibelle = cotisationFormData.periode;
      await loadPeriodes(newLibelle);
      setCotisationFormData({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" });
      setShowCotisationForm(false);
    } catch (error) {
      setApiError(error.message);
    }
  };

  // ── Enregistrer un paiement ─────────────────────────────────
  const handleSaveAddPaiement = async () => {
    setAddPaiementError("");
    if (!selectedAdherentForPayment || !addPaiementFormData.montantPaye) {
      setAddPaiementError(t("alertSelectMemberAmount"));
      return;
    }
    const periodeObj = periodes.find((p) => p.libelle === selectedPeriode);
    if (!periodeObj) return;

    const montantDu = parseAmount(periodeObj.montantDu);
    const montantPaye = Number(addPaiementFormData.montantPaye);

    if (isNaN(montantPaye) || montantPaye <= 0) {
      setAddPaiementError(t("alertAmountPositive"));
      return;
    }

    const existingPay = periodeObj.paiements.find(
      (p) => p.adherent_id === selectedAdherentForPayment.id
    );
    const dejaPaye = existingPay ? parseAmount(existingPay.soldePaye) : 0;
    const totalPaye = dejaPaye + montantPaye;
    const reste = Math.max(montantDu - totalPaye, 0);
    const statut = totalPaye === 0 ? "Impayé" : reste <= 0 ? "Payé" : "Partiel";

    if (montantPaye > montantDu - dejaPaye) {
      setAddPaiementError(
        lang === "fr"
          ? `Le montant saisi (${formatAmount(montantPaye)}) dépasse le reste à payer (${formatAmount(montantDu - dejaPaye)}).`
          : `Amount entered (${formatAmount(montantPaye)}) exceeds remaining balance (${formatAmount(montantDu - dejaPaye)}).`
      );
      return;
    }

    const numeroRecu = generateNumeroRecu();
    const datePaiementISO = new Date().toISOString().split("T")[0];
    const datePaiementFR = new Date().toLocaleDateString("fr-FR");

    const recuInfo = {
      numeroRecu,
      datePaiement: datePaiementFR,
      periode: selectedPeriode,
      nom: selectedAdherentForPayment.nom,
      prenom: selectedAdherentForPayment.prenom,
      telephone: selectedAdherentForPayment.telephone || "-",
      matricule: selectedAdherentForPayment.matricule || "-",
      email: selectedAdherentForPayment.email || "-",
      montantDu: formatAmount(montantDu),
      dejaPaye: formatAmount(dejaPaye),
      montantPaye: formatAmount(montantPaye),
      totalPaye: formatAmount(totalPaye),
      reste: formatAmount(reste),
      statut,
      modePaiement: addPaiementFormData.modePaiement,
    };

    setAddPaiementSaving(true);
    try {
      let response;
      try {
        response = await apiFetch(`${API_BASE}/periodes/${periodeObj.id}/paiements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adherent_id: selectedAdherentForPayment.id,
            montantPaye: montantPaye,
            modePaiement: addPaiementFormData.modePaiement,
            numeroRecu,
            datePaiement: datePaiementISO,
          }),
        });
      } catch {
        setAddPaiementError(
          lang === "fr"
            ? "Erreur réseau : impossible de joindre le serveur. Vérifiez votre connexion et réessayez."
            : "Network error: unable to reach the server. Check your connection and try again."
        );
        return;
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAddPaiementError(result.error || (lang === "fr" ? "Erreur lors de l'enregistrement du paiement." : "Error recording the payment."));
        return;
      }

      await loadPeriodes();
      await loadHistorique();
      setLastPaiement(recuInfo);
      setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" });
      setSelectedAdherentForPayment(null);
      setAddPaiementError("");
      setShowAddPaiementForm(false);
      setShowSuccessMessage(true);
      setShowRecuPrompt(true);
    } finally {
      setAddPaiementSaving(false);
    }
  };

  const handlePrintRecu = () => {
    if (!lastPaiement) return;
    const win = window.open("", "_blank", "width=720,height=960");
    if (!win) {
      alert(t("alertAllowPopups"));
      return;
    }
    const logoUrl = new URL(logo, window.location.href).href;
    const sColor = statutColor(lastPaiement.statut);
    const sBg    = statutBg(lastPaiement.statut);
    const pPeriode = periodeLabel(lastPaiement.periode);
    const pMode    = modeLabel(lastPaiement.modePaiement);
    const pStatut  = statutLabel(lastPaiement.statut).toUpperCase();
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reçu ${lastPaiement.numeroRecu}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#fff;color:#2c3e50;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:640px;margin:0 auto}

  /* En-tête bleue */
  .header{background:#2c3e50;color:#fff;padding:14px 24px;display:flex;align-items:center;gap:14px}
  .header img{width:52px;height:52px;object-fit:contain;flex-shrink:0}
  .header h1{font-size:22px;letter-spacing:3px;text-transform:uppercase;font-weight:bold}
  .header p{font-size:11px;opacity:.85;margin-top:4px}

  /* Corps */
  .body{padding:18px 24px}
  .meta{display:flex;justify-content:space-between;font-size:12px;color:#7f8c8d;margin-bottom:16px}
  .meta strong{color:#2c3e50}

  /* Boîtes sections */
  .section{border:1px solid #e0e6ed;border-radius:8px;padding:14px;margin-bottom:14px;background:#f7f9fc}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#7f8c8d;border-bottom:1px solid #dce3ec;padding-bottom:6px;margin-bottom:10px;font-weight:bold}
  .row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #f0f0f0}
  .row:last-child{border-bottom:none}
  .row span{color:#7f8c8d}
  .row strong{color:#2c3e50}
  .row-hl{background:#eafaf1;border-radius:4px;padding:5px 6px;margin:4px 0}
  .row-hl strong{color:#27ae60;font-size:15px}

  /* Badge statut */
  .statut{text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:17px;margin-bottom:14px;border:2px solid ${sColor};background:${sBg};color:${sColor}}

  /* Pied de page */
  .footer{text-align:center;font-size:11px;color:#bdc3c7;border-top:1px solid #ecf0f1;padding-top:12px}
  .footer p{margin-top:4px}

  @media print{.body{padding:12px 18px}}
</style></head>
<body><div class="page">
  <div class="header">
    <img src="${logoUrl}" alt="Logo">
    <div><h1>Cotisation Pro</h1><p>${t("officialReceipt")}</p></div>
  </div>
  <div class="body">
    <div class="meta">
      <span>${t("receiptNLabel")} <strong>${lastPaiement.numeroRecu}</strong></span>
      <span>${t("dateLabel")} <strong>${lastPaiement.datePaiement}</strong></span>
    </div>
    <div class="section">
      <div class="section-title">${t("memberInfoTitle")}</div>
      <div class="row"><span>${t("matricule")}</span><strong>${lastPaiement.matricule}</strong></div>
      <div class="row"><span>${t("nameTh")}</span><strong>${lastPaiement.nom}</strong></div>
      <div class="row"><span>${t("surnameTh")}</span><strong>${lastPaiement.prenom}</strong></div>
      <div class="row"><span>${t("telephoneTh")}</span><strong>${lastPaiement.telephone}</strong></div>
      <div class="row"><span>${t("emailTh")}</span><strong>${lastPaiement.email}</strong></div>
    </div>
    <div class="section">
      <div class="section-title">${t("paymentDetailsTitle")}</div>
      <div class="row"><span>${t("concernedPeriod")}</span><strong>${pPeriode}</strong></div>
      <div class="row"><span>${t("paymentMethodTitle")}</span><strong>${pMode}</strong></div>
      <div class="row"><span>${t("montantDuTitle")}</span><strong>${lastPaiement.montantDu}</strong></div>
      <div class="row"><span>${t("alreadyPaidTitle")}</span><strong>${lastPaiement.dejaPaye}</strong></div>
      <div class="row row-hl"><span>${t("thisPaymentTitle")}</span><strong>${lastPaiement.montantPaye}</strong></div>
      <div class="row"><span>${t("totalPaidTitle")}</span><strong style="color:#2980b9">${lastPaiement.totalPaye}</strong></div>
      <div class="row"><span>${t("remainingTitle")}</span><strong style="color:#e74c3c">${lastPaiement.reste}</strong></div>
    </div>
    <div class="statut">${t("statusTitle")} ${pStatut}</div>
    <div class="footer">
      <p>${t("autoGenerated")}</p>
      <p>${t("receiptProof")}</p>
    </div>
  </div>
</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleDownloadPDF = () => {
    if (!lastPaiement) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const mg = 20;
    let y = 0;

    // En-tête colorée
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pw, 42, "F");

    // Logo dans l'en-tête (à gauche, centré verticalement dans les 42mm)
    try {
      const imgEl = new Image();
      imgEl.src = logo;
      doc.addImage(imgEl, "PNG", 10, 6, 30, 30);
    } catch (_) {}

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("COTISATION PRO", pw / 2, 18, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Recu officiel de paiement", pw / 2, 30, { align: "center" });
    y = 52;

    // N° reçu + date
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("N Recu : " + lastPaiement.numeroRecu, mg, y);
    doc.text("Date : " + lastPaiement.datePaiement, pw - mg, y, { align: "right" });
    y += 12;

    // Section adhérent
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(224, 230, 237);
    doc.roundedRect(mg, y, pw - 2 * mg, 50, 3, 3, "FD");
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(127, 140, 141);
    doc.text("INFORMATIONS DE L'ADHERENT", mg + 5, y);
    y += 7;
    doc.setFontSize(11);
    const adh = [
      ["Matricule", lastPaiement.matricule],
      ["Nom & Prenom", lastPaiement.nom + " " + lastPaiement.prenom],
      ["Telephone", lastPaiement.telephone],
      ["Email", lastPaiement.email],
    ];
    adh.forEach(([label, val]) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(127, 140, 141);
      doc.text(label + " :", mg + 5, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 62, 80);
      doc.text(String(val || "-"), mg + 52, y);
      y += 8;
    });
    y += 6;

    // Section paiement
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(224, 230, 237);
    doc.roundedRect(mg, y, pw - 2 * mg, 72, 3, 3, "FD");
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(127, 140, 141);
    doc.text("DETAILS DU PAIEMENT", mg + 5, y);
    y += 7;
    doc.setFontSize(11);
    const pmt = [
      ["Periode", lastPaiement.periode, "#2c3e50"],
      ["Mode de paiement", lastPaiement.modePaiement, "#2c3e50"],
      ["Montant du", lastPaiement.montantDu, "#2c3e50"],
      ["Deja paye", lastPaiement.dejaPaye, "#7f8c8d"],
      ["Ce paiement", lastPaiement.montantPaye, "#27ae60"],
      ["Total paye", lastPaiement.totalPaye, "#2980b9"],
      ["Reste a payer", lastPaiement.reste, "#e74c3c"],
    ];
    pmt.forEach(([label, val, clr], idx) => {
      if (idx === 4) {
        doc.setFillColor(234, 250, 241);
        doc.rect(mg + 2, y - 5, pw - 2 * mg - 4, 9, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(127, 140, 141);
      doc.text(label + " :", mg + 5, y);
      doc.setFont("helvetica", "bold");
      const rgb = clr.replace("#", "");
      const r = parseInt(rgb.substring(0, 2), 16);
      const g = parseInt(rgb.substring(2, 4), 16);
      const b = parseInt(rgb.substring(4, 6), 16);
      doc.setTextColor(r, g, b);
      doc.text(String(val || "-"), pw - mg - 5, y, { align: "right" });
      y += 9;
    });
    y += 8;

    // Badge statut
    const sClr = lastPaiement.statut === "Paye" || lastPaiement.statut === "Payé"
      ? [39, 174, 96]
      : lastPaiement.statut === "Partiel"
      ? [243, 156, 18]
      : [231, 76, 60];
    doc.setFillColor(...sClr);
    doc.roundedRect(mg, y, pw - 2 * mg, 18, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("STATUT : " + lastPaiement.statut.toUpperCase(), pw / 2, y + 12, { align: "center" });
    y += 26;

    // Pied de page
    doc.setDrawColor(224, 230, 237);
    doc.line(mg, y, pw - mg, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(189, 195, 199);
    doc.text("Cotisation Pro - Document genere automatiquement", pw / 2, y, { align: "center" });
    doc.text("Ce recu fait foi de paiement pour la periode indiquee.", pw / 2, y + 5, { align: "center" });

    doc.save("recu-" + lastPaiement.numeroRecu + ".pdf");
  };

  // ── Enregistrer un adhérent ─────────────────────────────────
  const handleSave = async () => {
    if (!formData.nom || !formData.prenom) {
      alert(t("alertNameRequired"));
      return;
    }
    if (editingIndex !== null) {
      const existing = adherents[editingIndex];
      try {
        const response = await apiFetch(`${API_BASE}/adherents/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            email: formData.email,
            photo: formData.photo || undefined,
            poste: formData.poste || null,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error || result?.message || "Impossible de modifier");
        }
        await loadAdherents();
        setEditingIndex(null);
        showToast(t("memberEdited"));
        // Si notre propre poste de trésorier a été transféré → déconnexion immédiate
        if (result.myPosteWasCleared) {
          const updatedCompte = { ...compte, poste: null };
          sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(updatedCompte));
          setCompte(updatedCompte);
          showToast(lang === "fr" ? "Votre poste de trésorier a été transféré. Déconnexion dans 3 s…" : "Your treasurer role was transferred. Logging out in 3 s…");
          setTimeout(() => handleLogout(), 3000);
        }
      } catch (error) {
        setApiError(error.message);
        return;
      }
    } else {
      const doublon = adherents.find(
        (a) =>
          a.nom.toLowerCase() === formData.nom.toLowerCase() &&
          a.prenom.toLowerCase() === formData.prenom.toLowerCase()
      );
      if (doublon) {
        alert(`⚠️ ${t("alertMemberExists")}\n${t("alertMatricule")} ${doublon.matricule} — ${doublon.nom} ${doublon.prenom}`);
        return;
      }
      try {
        const response = await apiFetch(`${API_BASE}/adherents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            email: formData.email,
            date_inscription: formData.date,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || result?.message || "Erreur ajout");
        await loadAdherents();
        const msg = result.emailSent
          ? (lang === "fr" ? "Adhérent ajouté — identifiants envoyés par email ✅" : "Member added — credentials sent by email ✅")
          : (lang === "fr" ? "Adhérent ajouté (aucun email envoyé — email manquant)" : "Member added (no email sent — email missing)");
        showToast(msg);
      } catch (error) {
        setApiError(error.message);
        return;
      }
    }
    setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false, photo: "", photoName: "", poste: "" });
    setShowForm(false);
    setShowUnpaidOnly(false);
    setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
  };

  // ── Export Excel période (.xlsx) ───────────────────────────
  const exportPeriodeExcel = async (filtres, periode, periodeObj) => {
    try {
      const xlsxMod = await import("xlsx-js-style");
      const XLSX = xlsxMod.default || xlsxMod;

      const wb = XLSX.utils.book_new();
      const ws = {};
      const cols = ["A","B","C","D","E","F","G","H","I","J"];

      const pHeaders = ["N°","Matricule","Nom","Prénom","Téléphone","Email","Solde payé","Reste","Total dû","Statut"];
      const pRows = filtres.map((c, idx) => [
        String(idx + 1),
        c.matricule||"-", c.nom||"", c.prenom||"",
        c.telephone||"-", c.email||"-",
        c.soldePaye||"0 F", c.reste||"0 F",
        `${periodeObj.montantDu} F`, c.statut||"Impayé",
      ]);
      ws["!cols"] = pHeaders.map((h, i) => {
        const max = pRows.reduce((m, row) => Math.max(m, String(row[i]||"").length), h.length);
        return { wch: Math.min(Math.ceil(max * 1.3) + 4, 90) };
      });
      ws["!merges"] = [{ s:{ r:0, c:0 }, e:{ r:0, c:9 } }];
      ws["!rows"] = [
        { hpt:46 },
        { hpt:32 },
        ...filtres.map(() => ({ hpt:26 })),
      ];

      ws["A1"] = {
        v: `COTISATIONS — ${periode}   |   Montant dû : ${periodeObj.montantDu} F   |   Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
        t: "s",
        s: {
          fill: { fgColor:{ rgb:"2C3E50" } },
          font: { bold:true, sz:14, color:{ rgb:"FFFFFF" } },
          alignment: { horizontal:"center", vertical:"center", wrapText:false },
        },
      };

      ["N°","Matricule","Nom","Prénom","Téléphone","Email","Solde payé","Reste","Total dû","Statut"].forEach((h, i) => {
        ws[`${cols[i]}2`] = {
          v: h, t: "s",
          s: {
            fill: { fgColor:{ rgb:"8E44AD" } },
            font: { bold:true, sz:13, color:{ rgb:"FFFFFF" } },
            alignment: { horizontal:"center", vertical:"center", wrapText:false },
            border: { top:{ style:"medium", color:{ rgb:"6C3483" } }, bottom:{ style:"medium", color:{ rgb:"6C3483" } }, left:{ style:"thin", color:{ rgb:"FFFFFF" } }, right:{ style:"thin", color:{ rgb:"FFFFFF" } } },
          },
        };
      });

      const statutBg = { "Payé":"D5F5E3", "Partiel":"FEF9E7", "Impayé":"FDECEA" };
      const statutFg = { "Payé":"1E8449", "Partiel":"B7950B", "Impayé":"C0392B" };
      const brd = {
        top:    { style:"thin", color:{ rgb:"BDC3C7" } },
        bottom: { style:"thin", color:{ rgb:"BDC3C7" } },
        left:   { style:"thin", color:{ rgb:"BDC3C7" } },
        right:  { style:"thin", color:{ rgb:"BDC3C7" } },
      };

      filtres.forEach((c, idx) => {
        const r   = idx + 3;
        const bg  = idx % 2 === 0 ? "FFFFFF" : "F4ECF7";
        const st  = c.statut || "Impayé";
        const vals = [
          { v: String(idx + 1),            color:"7F8C8D", bold:true,  bg },
          { v: c.matricule||"-",           color:"2980B9", bold:true,  bg },
          { v: c.nom||"",                  color:"2C3E50", bold:true,  bg },
          { v: c.prenom||"",               color:"2C3E50", bold:false, bg },
          { v: c.telephone||"-",           color:"2C3E50", bold:false, bg },
          { v: c.email||"-",               color:"2C3E50", bold:false, bg },
          { v: c.soldePaye||"0 F",         color:"27AE60", bold:false, bg },
          { v: c.reste||"0 F",             color:"E74C3C", bold:false, bg },
          { v: `${periodeObj.montantDu} F`,color:"2C3E50", bold:false, bg },
          { v: st, color: statutFg[st]||"2C3E50", bold:true, bg: statutBg[st]||bg },
        ];
        vals.forEach(({ v, color, bold, bg: cellBg }, i) => {
          ws[`${cols[i]}${r}`] = {
            v, t:"s",
            s: {
              fill: { fgColor:{ rgb:cellBg } },
              font: { bold, sz:13, color:{ rgb:color } },
              alignment: { horizontal:"center", vertical:"center", wrapText:false },
              border: brd,
            },
          };
        });
      });

      ws["!ref"] = `A1:J${filtres.length + 2}`;
      XLSX.utils.book_append_sheet(wb, ws, periode.substring(0, 31));

      const filename = `cotisations_${periode.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const buffer = XLSX.write(wb, { bookType:"xlsx", type:"array" });

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description:"Fichier Excel (.xlsx)", accept:{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(new Uint8Array(buffer));
        await writable.close();
      } else {
        XLSX.writeFile(wb, filename);
      }
    } catch (err) {
      if (err.name !== "AbortError") setApiError("Erreur export Excel : " + err.message);
    }
  };

  // ── Export Excel (.xlsx) ────────────────────────────────────
  const exportExcel = async () => {
    try {
      const xlsxMod = await import("xlsx-js-style");
      const XLSX = xlsxMod.default || xlsxMod;

      const wb = XLSX.utils.book_new();
      const ws = {};
      const cols = ["A","B","C","D","E","F","G"];

      const aHeaders = ["N°","Matricule","Nom","Prénom","Téléphone","Email","Date d'inscription"];
      const aRows = adherents.map((a, idx) => [
        String(idx + 1),
        a.matricule||"-", a.nom||"", a.prenom||"",
        a.telephone||"-", a.email||"-",
        a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "-",
      ]);
      ws["!cols"] = aHeaders.map((h, i) => {
        const max = aRows.reduce((m, row) => Math.max(m, String(row[i]||"").length), h.length);
        return { wch: Math.min(Math.ceil(max * 1.3) + 4, 90) };
      });
      ws["!merges"] = [{ s:{ r:0, c:0 }, e:{ r:0, c:6 } }];
      ws["!rows"]   = [
        { hpt:46 },
        { hpt:32 },
        ...adherents.map(() => ({ hpt:28 })),
      ];

      // Ligne titre fusionnée
      ws["A1"] = {
        v: `LISTE DES ADHÉRENTS — COTISATION PRO   |   Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
        t: "s",
        s: {
          fill: { fgColor:{ rgb:"2C3E50" } },
          font: { bold:true, sz:16, color:{ rgb:"FFFFFF" } },
          alignment: { horizontal:"center", vertical:"center", wrapText:false },
        },
      };

      // En-têtes colonnes
      ["N°","Matricule","Nom","Prénom","Téléphone","Email","Date d'inscription"].forEach((h, i) => {
        ws[`${cols[i]}2`] = {
          v: h, t: "s",
          s: {
            fill: { fgColor:{ rgb:"3498DB" } },
            font: { bold:true, sz:14, color:{ rgb:"FFFFFF" } },
            alignment: { horizontal:"center", vertical:"center", wrapText:false },
            border: { top:{ style:"medium", color:{ rgb:"2980B9" } }, bottom:{ style:"medium", color:{ rgb:"2980B9" } }, left:{ style:"thin", color:{ rgb:"FFFFFF" } }, right:{ style:"thin", color:{ rgb:"FFFFFF" } } },
          },
        };
      });

      // Lignes de données
      const brd = {
        top:    { style:"thin", color:{ rgb:"BDC3C7" } },
        bottom: { style:"thin", color:{ rgb:"BDC3C7" } },
        left:   { style:"thin", color:{ rgb:"BDC3C7" } },
        right:  { style:"thin", color:{ rgb:"BDC3C7" } },
      };
      adherents.forEach((a, idx) => {
        const r  = idx + 3;
        const bg = idx % 2 === 0 ? "FFFFFF" : "EAF2FB";
        const vals = [
          { v: String(idx + 1),   align:"center", bold:true,  color:"7F8C8D" },
          { v: a.matricule||"-",  align:"center", bold:true,  color:"2980B9" },
          { v: a.nom||"",         align:"center", bold:true,  color:"2C3E50" },
          { v: a.prenom||"",      align:"center", bold:false, color:"2C3E50" },
          { v: a.telephone||"-",  align:"center", bold:false, color:"2C3E50" },
          { v: a.email||"-",      align:"center", bold:false, color:"2C3E50" },
          { v: a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "-", align:"center", bold:false, color:"2C3E50" },
        ];
        vals.forEach(({ v, align, bold, color }, i) => {
          ws[`${cols[i]}${r}`] = {
            v, t:"s",
            s: { fill:{ fgColor:{ rgb:bg } }, font:{ bold, sz:14, color:{ rgb:color } }, alignment:{ horizontal:align, vertical:"center", wrapText:false }, border:brd },
          };
        });
      });

      ws["!ref"] = `A1:G${adherents.length + 2}`;
      XLSX.utils.book_append_sheet(wb, ws, "Adhérents");

      const filename = `adherents_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const buffer   = XLSX.write(wb, { bookType:"xlsx", type:"array" });

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description:"Fichier Excel (.xlsx)", accept:{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(new Uint8Array(buffer));
        await writable.close();
      } else {
        XLSX.writeFile(wb, filename);
      }
    } catch (err) {
      if (err.name !== "AbortError") setApiError("Erreur export Excel : " + err.message);
    }
  };

  // ── Supprimer un adhérent ───────────────────────────────────
  const handleDelete = async (adherentId) => {
    try {
      const response = await apiFetch(`${API_BASE}/adherents/${adherentId}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Impossible de supprimer");
      }
      await loadAdherents();
      showToast(t("memberDeleted"));
    } catch (error) {
      setApiError(error.message);
    }
  };

  // ── Code d'invitation ──────────────────────────────────────
  const loadInviteToken = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin/invite-token`);
      const data = await res.json();
      if (res.ok) setInviteToken(data.token || "");
    } catch (_) {}
  };

  const resetInviteToken = async () => {
    setInviteResetting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/invite-token/reset`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setInviteToken(data.token || ""); setInviteCopied(false); }
    } catch (_) {}
    finally { setInviteResetting(false); }
  };

  const copyInviteToken = () => {
    navigator.clipboard.writeText(inviteToken).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    });
  };

  // ── Chargement / création / suppression des comptes utilisateurs ──
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await apiFetch(`${API_BASE}/admin/users`);
      if (!res.ok) return;
      const data = await res.json();
      setUserList(data);
    } catch (_) {}
    finally { setLoadingUsers(false); }
  };

  const handleCreateUser = async () => {
    setCreateUserError("");
    const { nom, prenom, email, telephone, mot_de_passe } = createUserForm;
    if (!nom || !prenom) { setCreateUserError(t("alertNameRequired")); return; }
    if (!email && !telephone) { setCreateUserError(lang === "fr" ? "Email ou téléphone requis." : "Email or phone required."); return; }
    if (!mot_de_passe || !pwdOk(mot_de_passe)) { setCreateUserError(t("passwordMinLength")); return; }
    setCreateUserLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (!res.ok) { setCreateUserError(data.error || t("networkError")); return; }
      setCreateUserForm({ nom: "", prenom: "", email: "", telephone: "", mot_de_passe: "", date_inscription: "" });
      setShowCreateUserForm(false);
      setCreateUserSuccess(lang === "fr" ? `Compte créé — Matricule : ${data.matricule}` : `Account created — ID: ${data.matricule}`);
      setTimeout(() => setCreateUserSuccess(""), 5000);
      await loadUsers();
      await loadAdherents();
    } catch { setCreateUserError(t("networkError")); }
    finally { setCreateUserLoading(false); }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await apiFetch(`${API_BASE}/admin/users/${userId}`, { method: "DELETE" });
      await loadUsers();
      showToast(lang === "fr" ? "Accès supprimé" : "Access removed");
    } catch (_) {}
  };

  const selectedPeriodeObj = periodes.find((p) => p.libelle === selectedPeriode);

  const dragProps = (e) => {
    if (navigator.maxTouchPoints > 0) return; // pas de drag sur appareils tactiles (téléphone/tablette, mode bureau inclus)
    if (!["INPUT", "BUTTON", "SELECT"].includes(e.target.tagName)) {
      setIsDragging(true);
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setModalPos({ top: rect.top + "px", left: rect.left + "px", transform: "none" });
    }
  };

  const statutColor = (s) =>
    s === "Payé" ? "#27ae60" : s === "Partiel" ? "#f39c12" : "#e74c3c";
  const statutBg = (s) =>
    s === "Payé" ? "#d5f5e3" : s === "Partiel" ? "#fef9e7" : "#fdecea";

  const FR_MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const periodeLabel = (libelle) => {
    if (!libelle || lang === "fr") return libelle;
    const months = translations[lang]?.months || FR_MOIS;
    return FR_MOIS.reduce((acc, fr, i) => acc.replace(fr, months[i]), libelle);
  };
  const statutLabel = (s) =>
    s === "Payé" ? t("statusPaid") : s === "Partiel" ? t("statusPartial") : t("statusUnpaid");
  const MM_PROVIDERS = [
    { value: "Orange Money", label: "Orange Money", color: "#FF6600", bg: "#fff3e6" },
    { value: "Wave",         label: "Wave",         color: "#009BDB", bg: "#e6f5fc" },
    { value: "MTN MoMo",    label: "MTN MoMo",     color: "#FFCC00", bg: "#fffbe6" },
  ];
  const modeLabel = (m) => {
    const map = { "Espèces": t("cash"), "Mobile Money": t("mobileMoney"), "Orange Money": "Orange Money", "Wave": "Wave", "MTN MoMo": "MTN MoMo", "Virement": t("transfer"), "Chèque": t("check"), "Autre": t("other") };
    return map[m] || m;
  };
  const modeBadge = (m) => {
    const p = MM_PROVIDERS.find(p => p.value === m);
    if (p) return { color: p.color, bg: p.bg };
    if (m === "Espèces") return { color: "#27ae60", bg: "#eafaf1" };
    if (m === "Virement") return { color: "#2980b9", bg: "#eaf2fb" };
    return { color: "#7f8c8d", bg: "#f4f6f7" };
  };

  const isAdmin = compte?.role === "admin";
  const isTresorier = compte?.role === "user" && !!compte?.poste?.toLowerCase().includes("trésorier");
  const isPresident = compte?.role === "user" && !!compte?.poste?.toLowerCase().includes("président");
  const isHautMembre = isAdmin || (compte?.role === "user" && !!compte?.poste);

  // Président différent du créateur (un membre a le poste Président)
  const nonCreatorPresidentExists = adherents.some(
    (a) => a.poste && a.poste.toLowerCase().includes("président") && a.email !== compte?.email
  );
  // Trésorier différent du créateur (un membre a le poste Trésorier)
  const nonCreatorTresorierExists = adherents.some(
    (a) => a.poste && a.poste.toLowerCase().includes("trésorier") && a.email !== compte?.email
  );
  // L'admin conserve les droits trésorier tant qu'aucun trésorier n'est assigné à un membre
  const canActAsTresorier = isAdmin ? !nonCreatorTresorierExists : isTresorier;
  // L'admin conserve les droits président tant qu'aucun président externe n'est assigné
  const canActAsPresident = isAdmin ? !nonCreatorPresidentExists : isPresident;
  // Le créateur peut attribuer des postes si aucun président externe n'existe encore,
  // OU si le créateur lui-même est président, OU si c'est un membre président
  const creatorIsPresident = isAdmin && !!(profilData?.poste?.toLowerCase().includes("président"));
  const canAssignPoste = (isAdmin && (!nonCreatorPresidentExists || creatorIsPresident)) || isPresident;

  // ── Page publique carte membre (scan QR) ──────────────
  if (publicCarteParam) return <PublicCarteView encodedData={publicCarteParam} />;

  // ── Guard : si non connecté → landing ou authentification ──
  if (!compte) {
    if (showLanding) {
      return (
        <LandingPage
          lang={lang}
          setLang={setLang}
          t={t}
          API_BASE={API_BASE}
          onLogin={() => { setInitialAuthMode("login"); setShowLanding(false); }}
          onRegister={() => { setInitialAuthMode("register"); setShowLanding(false); }}
          onJoin={() => { setInitialAuthMode("join"); setShowLanding(false); }}
        />
      );
    }
    return (
      <AuthPage
        key={initialAuthMode}
        API_BASE={API_BASE}
        lang={lang}
        t={t}
        setLang={setLang}
        initialMode={initialAuthMode}
        onBackToLanding={() => setShowLanding(true)}
        onSuccess={(c, type) => {
          sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(c));
          setCompte(c);
          setShowLanding(true);
          if (type === "register") showToast(t("accountCreated"));
        }}
      />
    );
  }

  return (
    <div style={styles.app}>

      {/* ── TOAST NOTIFICATION ──────────────────────────────── */}
      {toast.visible && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "#27ae60", color: "white", padding: "20px 36px",
          borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          fontSize: "16px", fontWeight: "600", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "12px",
          animation: "toastIn 0.25s ease",
        }}>
          <span style={{ fontSize: "22px" }}>✅</span>
          {toast.message}
        </div>
      )}

      {/* ── MODAL INACTIVITÉ ─────────────────────────────────── */}
      {showInactivityWarning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "36px 32px", width: "420px", maxWidth: "94vw", boxShadow: "0 12px 48px rgba(0,0,0,0.32)", textAlign: "center" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>⏳</div>
            <h2 style={{ margin: "0 0 10px", fontSize: "20px", color: "#2c3e50", fontWeight: "800" }}>
              {lang === "fr" ? "Session inactive" : "Inactive session"}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#7f8c8d", lineHeight: "1.6" }}>
              {lang === "fr"
                ? "Vous n'avez effectué aucune action depuis un moment. Vous serez automatiquement déconnecté(e) pour protéger votre compte."
                : "You haven't performed any action for a while. You will be automatically logged out to protect your account."}
            </p>

            {/* Compte à rebours circulaire */}
            <div style={{ position: "relative", width: "90px", height: "90px", margin: "0 auto 24px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "90px", height: "90px", transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ecf0f1" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e74c3c" strokeWidth="3"
                  strokeDasharray={`${(inactivityCountdown / COUNTDOWN_S) * 100} 100`}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 1s linear" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: inactivityCountdown <= 10 ? "#e74c3c" : "#2c3e50" }}>
                {inactivityCountdown}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleStayLoggedIn}
                style={{ padding: "12px 28px", background: "#27ae60", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", flex: "1", minWidth: "150px" }}>
                {lang === "fr" ? "Rester connecté(e)" : "Stay logged in"}
              </button>
              <button onClick={() => handleLogout()}
                style={{ padding: "12px 20px", background: "none", color: "#e74c3c", border: "2px solid #e74c3c", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                {lang === "fr" ? "Se déconnecter" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRE DE NAVIGATION DESKTOP ──────────────────── */}
      <header className="app-navbar">

        {/* ── Barre principale : Logo à gauche, Langue + Compte à droite ── */}
        <div className="app-navbar-brand-row">
          <div className="app-navbar-brand">
            <img src={logo} alt="Logo" className="app-navbar-logo" />
            <div>
              <div className="app-navbar-title">Cotisation <span className="app-navbar-title-accent">Pro</span></div>
              <div className="app-navbar-assoc"><Icon name="building" size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />{compte.nom_association}</div>
            </div>
          </div>
          <div className="app-navbar-brand-controls">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="topbar-lang-select">
              <option value="fr">🇫🇷 FR</option>
              <option value="en">🇬🇧 EN</option>
            </select>
            <div style={{ position: "relative" }} ref={accountMenuRef}>
              <button
                className={`topbar-account-btn ${isAdmin ? "role-admin" : isTresorier ? "role-tresorier" : "role-membre"}`}
                onClick={() => setShowAccountMenu(v => !v)}
                title={compte.email || t("accountMenu")}
              >
                {(compte.email?.split("@")[0] || "U").slice(0, 2).toUpperCase()}
              </button>
              {showAccountMenu && (
                <div className="nav-account-panel">
                  <div className="nav-account-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#3498db", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("accountMenu")}</div>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", background: isAdmin ? "#f3e5f5" : isTresorier ? "#e8f0fe" : "#e3f2fd", color: isAdmin ? "#6a1b9a" : isTresorier ? "#6c3483" : "#1565c0" }}>
                        {isAdmin ? (compte?.poste || (lang === "fr" ? "Créateur" : "Creator")) : compte?.poste ? compte.poste : (lang === "fr" ? "Membre" : "Member")}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#2c3e50", marginBottom: "2px" }}>{compte.nom_association}</div>
                    <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{compte.email}</div>
                  </div>
                  <div style={{ padding: "6px 14px 3px", fontSize: "10px", fontWeight: "800", color: "#b0bec5", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    {lang === "fr" ? "Mon compte" : "My account"}
                  </div>
                  <button className="nav-account-item" onClick={() => { setShowAccountMenu(false); loadProfil(); setPage("profil"); }} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <Icon name="user" size={14} style={{ opacity: 0.6 }} /> {lang === "fr" ? "Mon profil" : "My Profile"}
                  </button>
                  <button className="nav-account-item" onClick={() => { setShowAccountMenu(false); loadMesCotisations(); setPage("mes-cotisations"); }} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <Icon name="dollar" size={14} style={{ opacity: 0.6 }} /> {lang === "fr" ? "Mes cotisations" : "My Contributions"}
                  </button>
                  <div style={{ height: "1px", background: "#f0f2f5", margin: "6px 0 4px" }} />
                  <div style={{ padding: "2px 14px 3px", fontSize: "10px", fontWeight: "800", color: "#b0bec5", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    {lang === "fr" ? "Sécurité" : "Security"}
                  </div>
                  <button className="nav-account-item" onClick={() => { setShowAccountMenu(false); setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccessMsg(false); setShowChangePwd(true); }} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <Icon name="key" size={14} style={{ opacity: 0.6 }} /> {t("changePassword")}
                  </button>
                  <button className="nav-account-item" onClick={() => { setShowAccountMenu(false); setChangeEmailStep(1); setChangeEmailForm({ email: "", mot_de_passe: "" }); setChangeEmailOtp(""); setChangeEmailError(""); setChangeEmailSuccess(false); setShowChangeEmail(true); }} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <Icon name="mail" size={14} style={{ opacity: 0.6 }} /> {t("changeEmail")}
                  </button>
                  <div style={{ height: "1px", background: "#f0f2f5", margin: "6px 0 2px" }} />
                  <button className="nav-account-item nav-account-logout" onClick={() => { setShowAccountMenu(false); setShowLogoutConfirm(true); }} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <Icon name="logout" size={14} style={{ opacity: 0.7 }} /> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Barre des onglets de navigation ── */}
        <div className="app-navbar-tabs-row">
          <nav className="app-navbar-tabs">
            <button className={`nav-tab${page === "accueil" ? " nav-tab-active" : ""}`} onClick={() => setPage("accueil")}>
              <Icon name="home" size={15} /> {t("home")}
            </button>
            <button className={`nav-tab${page === "adherents" ? " nav-tab-active" : ""}`} onClick={() => { setPage("adherents"); setShowUnpaidOnly(false); setShowUnpaidOrPartial(false); }}>
              <Icon name="users" size={15} /> {t("members")}
            </button>
            <button className={`nav-tab${page === "cotisations" ? " nav-tab-active" : ""}`} onClick={() => setPage("cotisations")}>
              <Icon name="list" size={15} /> {t("contributions")}
            </button>
            <button className={`nav-tab${page === "historique" ? " nav-tab-active" : ""}`} onClick={() => setPage("historique")}>
              <Icon name="clock" size={15} /> {t("history")}
            </button>
            <button className={`nav-tab${page === "messages" ? " nav-tab-active" : ""}`}
              onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}
              style={{ position: "relative" }}>
              <Icon name="mail" size={15} /> {lang === "fr" ? "Messages" : "Messages"}
              {adminMsgUnread > 0 && <span className="nav-badge badge-pulse-red">{adminMsgUnread}</span>}
            </button>
            {canActAsTresorier && (
              <button className={`nav-tab${page === "comptabilite" ? " nav-tab-active" : ""}`}
                onClick={() => { setPage("comptabilite"); loadComptabilite(); }}>
                <Icon name="bar-chart" size={15} /> {lang === "fr" ? "Comptabilité" : "Accounting"}
              </button>
            )}
            {isAdmin && (
              <button className={`nav-tab${page === "audit" ? " nav-tab-active" : ""}`}
                onClick={() => { setPage("audit"); setAuditOffset(0); setAuditActionFilter(""); loadAuditLogs(0, ""); }}>
                <Icon name="shield" size={15} /> Audit
              </button>
            )}
            <button className={`nav-tab${page === "bureau" ? " nav-tab-active" : ""}`}
              onClick={() => { setRoleTransferPoste(""); setRoleTransferTargetId(""); setRoleTransferError(""); setRoleTransferSuccess(""); setPage("bureau"); }}>
              <Icon name="building" size={15} /> {lang === "fr" ? "Bureau" : "Board"}
            </button>
            <div className="nav-tab-dropdown" ref={assistanceMenuRef} style={{ position: "relative" }}>
              <button className={`nav-tab${showAssistanceMenu ? " nav-tab-active" : ""}`}
                onClick={() => setShowAssistanceMenu(v => !v)}>
                <Icon name="info" size={15} /> {lang === "fr" ? "Assistance" : "Support"} {showAssistanceMenu ? "▲" : "▾"}
              </button>
              {showAssistanceMenu && (
                <div className="nav-dropdown-panel">
                  <button className="nav-dropdown-item" onClick={() => { setShowAssistanceMenu(false); setHelpSection(null); setShowHelp(true); }}>
                    <Icon name="list" size={14} /> {t("helpMenu")}
                  </button>
                  <button className="nav-dropdown-item" onClick={() => { setShowAssistanceMenu(false); setShowAbout(true); }}>
                    <Icon name="info" size={14} /> {t("aboutMenu")}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

      </header>

      <div style={styles.content} className="app-content" ref={contentRef}>

        {/* ── MON PROFIL (membres uniquement) ─────────────────── */}
        {page === "profil" && (
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <button style={styles.backBtn} onClick={() => setPage("accueil")}>{t("backBtn")}</button>

            {profilLoading ? (
              <div style={styles.infoMessage}>{lang === "fr" ? "Chargement…" : "Loading…"}</div>
            ) : (
              <>
                {/* ── Carte Hero ── */}
                <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 8px 32px rgba(44,62,80,0.18)", marginBottom: "20px" }}>
                  {/* Bandeau gradient */}
                  <div style={{ background: "linear-gradient(135deg, #1a2742 0%, #2c3e50 50%, #1a6a9a 100%)", padding: "32px 28px 20px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(52,152,219,0.15)" }} />
                    <div style={{ position: "absolute", bottom: "-50px", left: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", position: "relative" }}>
                      {/* Avatar */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {profilData.photo
                          ? <img src={profilData.photo} alt="Photo" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "4px solid #3498db", boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }} />
                          : <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(135deg,#34495e,#2c3e50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", border: "4px solid #3498db", boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>👤</div>
                        }
                        <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "50%", background: "#27ae60", border: "2px solid white" }} title="Actif" />
                      </div>
                      {/* Infos */}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "white", fontWeight: "800", fontSize: "22px", lineHeight: "1.2", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                          {profilData.nom} {profilData.prenom}
                        </div>
                        {profilData.matricule && (
                          <div style={{ display: "inline-block", background: "rgba(52,152,219,0.35)", color: "#a8d8f0", fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px", marginTop: "6px", border: "1px solid rgba(52,152,219,0.4)" }}>
                            # {profilData.matricule}
                          </div>
                        )}
                        <div style={{ color: "#a0b9cc", fontSize: "12px", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Icon name="building" size={11} />{compte.nom_association}</div>
                      </div>
                      {/* Badge rôle */}
                      {(() => {
                        const roleLabel = isAdmin ? (profilData.poste ? profilData.poste.toUpperCase() : (lang === "fr" ? "CRÉATEUR" : "CREATOR")) : profilData.poste ? profilData.poste.toUpperCase() : "MEMBRE";
                        const roleBg = isAdmin && !profilData.poste ? "#7f8c8d" : profilData.poste && profilData.poste.toLowerCase().includes("président") ? "#8e44ad" : profilData.poste && profilData.poste.toLowerCase().includes("trésorier") ? "#27ae60" : profilData.poste && profilData.poste.toLowerCase().includes("secrétaire") ? "#e67e22" : "#3498db";
                        return <div style={{ background: roleBg, color: "white", padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", letterSpacing: "1px", alignSelf: "flex-start", whiteSpace: "nowrap" }}>{roleLabel}</div>;
                      })()}
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div style={{ background: "white", padding: "14px 24px", display: "flex", gap: "10px", flexWrap: "wrap", borderBottom: "1px solid #f0f4f8" }}>
                    {profilSuccess && (
                      <div style={{ width: "100%", background: "#d5f5e3", color: "#1e8449", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>{profilSuccess}</div>
                    )}
                    {profilError && (
                      <div style={{ width: "100%", background: "#fdecea", color: "#c0392b", padding: "8px 14px", borderRadius: "8px", fontSize: "13px" }}>⚠️ {profilError}</div>
                    )}
                    {isAdmin && nonCreatorPresidentExists && (
                      <div style={{ width: "100%", background: "#eaf4fb", border: "1px solid #aed6f1", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", color: "#1a5276", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <Icon name="info" size={14} style={{ marginTop: "1px", flexShrink: 0 }} /> {lang === "fr"
                          ? "Un président est en place. L'attribution des postes lui est désormais réservée."
                          : "A president is in place. Role assignment is now reserved for them."}
                      </div>
                    )}
                    {!profilEditMode ? (
                      <>
                        <button
                          onClick={() => { setProfilEditForm({ nom: profilData.nom, prenom: profilData.prenom, telephone: profilData.telephone, photo: profilData.photo }); setProfilError(""); setProfilEditMode(true); }}
                          style={{ padding: "9px 20px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="edit" size={14} /> {lang === "fr" ? "Modifier le profil" : "Edit Profile"}
                        </button>
                        <button
                          onClick={() => { setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccessMsg(false); setShowChangePwd(true); }}
                          style={{ padding: "9px 20px", background: "#8e44ad", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="key" size={14} /> {lang === "fr" ? "Mot de passe" : "Password"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={saveProfil} disabled={profilSaving}
                          style={{ padding: "9px 20px", background: profilSaving ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {profilSaving ? (lang === "fr" ? "Enregistrement…" : "Saving…") : (<><Icon name="save" size={14} /> {lang === "fr" ? "Enregistrer" : "Save"}</>)}
                        </button>
                        <button onClick={() => { setProfilEditMode(false); setProfilError(""); }}
                          style={{ padding: "9px 20px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                          {lang === "fr" ? "Annuler" : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Corps de la carte */}
                  <div style={{ background: "white", padding: "20px 24px 24px" }}>
                    {!profilEditMode ? (
                      /* ── Mode lecture ── */
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                        {[
                          { icon: "mail",  label: "Email", value: profilData.email || "—" },
                          { icon: "phone", label: lang === "fr" ? "Téléphone" : "Phone", value: profilData.telephone || "—" },
                          { icon: "clock", label: lang === "fr" ? "Date d'inscription" : "Registration date", value: profilData.date_inscription ? new Date(profilData.date_inscription).toLocaleDateString("fr-FR") : "—" },
                          { icon: "badge", label: "Matricule", value: profilData.matricule ? `# ${profilData.matricule}` : "—" },
                        ].map(({ icon, label, value }) => (
                          <div key={label} style={{ background: "#f7f9fc", borderRadius: "10px", padding: "14px 16px", border: "1px solid #e8edf3", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <span style={{ marginTop: "2px", color: "#7f8c8d" }}><Icon name={icon} size={18} /></span>
                            <div>
                              <div style={{ fontSize: "11px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "14px", color: "#2c3e50", fontWeight: "600", wordBreak: "break-all" }}>{value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ── Mode édition ── */
                      <div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                          <div
                            style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", border: "3px solid #3498db", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            onClick={() => document.getElementById("profilPhotoInput").click()}>
                            {profilEditForm.photo
                              ? <img src={profilEditForm.photo} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: "40px" }}>👤</span>
                            }
                          </div>
                          <input type="file" accept="image/*" id="profilPhotoInput" style={{ display: "none" }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => setProfilEditForm(f => ({ ...f, photo: ev.target.result }));
                              reader.readAsDataURL(file);
                            }} />
                          <button type="button" onClick={() => document.getElementById("profilPhotoInput").click()}
                            style={{ marginTop: "8px", padding: "5px 14px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                            {profilEditForm.photo ? (lang === "fr" ? "Changer la photo" : "Change Photo") : (lang === "fr" ? "Ajouter une photo" : "Add Photo")}
                          </button>
                        </div>
                        {[
                          { label: lang === "fr" ? "Nom *" : "Last Name *", field: "nom", placeholder: "Ex. Kouakou" },
                          { label: lang === "fr" ? "Prénom *" : "First Name *", field: "prenom", placeholder: "Ex. Jean" },
                          { label: lang === "fr" ? "Téléphone" : "Phone", field: "telephone", placeholder: "Ex. +225 07 00 00 00 00" },
                        ].map(({ label, field, placeholder }) => (
                          <div key={field} style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                            <input
                              value={profilEditForm[field] || ""} onChange={e => setProfilEditForm(f => ({ ...f, [field]: e.target.value }))}
                              placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                          </div>
                        ))}
                        <div style={{ background: "#f7f9fc", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#7f8c8d", border: "1px solid #e8edf3" }}>
                          ℹ️ {lang === "fr" ? "Email et matricule ne peuvent pas être modifiés." : "Email and membership ID cannot be changed."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Carte Membre avec QR Code ── */}
                <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e8edf3", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
                  <div style={{ background: "linear-gradient(135deg,#1a2742,#2c3e50)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon name="card" size={20} style={{ color: "white" }} />
                      <div>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{lang === "fr" ? "Ma Carte Membre" : "My Member Card"}</div>
                        <div style={{ color: "#a8c4d8", fontSize: "11px" }}>{lang === "fr" ? "Carte digitale avec QR Code" : "Digital card with QR Code"}</div>
                      </div>
                    </div>
                    <button
                      onClick={downloadAdminCarte}
                      disabled={adminCarteDownloading || !adminCarteQRUrl}
                      style={{ padding: "7px 16px", background: adminCarteDownloading || !adminCarteQRUrl ? "rgba(255,255,255,0.08)" : "rgba(22,160,133,0.9)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", cursor: adminCarteDownloading || !adminCarteQRUrl ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "700" }}>
                      {adminCarteDownloading ? (lang === "fr" ? "Génération…" : "Generating…") : (lang === "fr" ? "⬇ Télécharger PDF" : "⬇ Download PDF")}
                    </button>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    {/* Carte visuelle */}
                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "linear-gradient(135deg,#1a2742 0%,#2c3e50 55%,#1a6a9a 100%)", padding: "16px 14px", minHeight: "110px", boxShadow: "0 4px 18px rgba(44,62,80,0.25)", maxWidth: "440px" }}>
                      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(52,152,219,0.15)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        {profilData.photo
                          ? <img src={profilData.photo} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(52,152,219,0.7)", flexShrink: 0 }} />
                          : <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(52,152,219,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👤</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "white", fontWeight: "800", fontSize: "16px", lineHeight: "1.2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profilData.prenom} {profilData.nom}</div>
                          <div style={{ color: "#a8d8ea", fontSize: "11px", marginTop: "3px" }}>N° {profilData.matricule || "N/A"}</div>
                          {profilData.poste && (
                            <div style={{ display: "inline-block", background: "#16a085", color: "white", fontSize: "10px", fontWeight: "700", padding: "2px 10px", borderRadius: "10px", marginTop: "4px" }}>
                              {profilData.poste}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>{compte.nom_association}</div>
                      {/* QR Code */}
                      <div style={{ position: "absolute", right: "12px", top: "12px", background: "white", borderRadius: "8px", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        {adminCarteQRUrl
                          ? <img src={adminCarteQRUrl} alt="QR Code" style={{ width: "72px", height: "72px", display: "block" }} />
                          : <div style={{ width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", color: "#bdc3c7", fontSize: "10px" }}>…</div>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Carte Mes cotisations rapide ── */}
                <div style={{ background: "linear-gradient(135deg,#e8f4fd,#f0f8ff)", borderRadius: "14px", padding: "18px 22px", border: "1px solid #bee3f8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", cursor: "pointer", transition: "box-shadow 0.2s", marginBottom: "16px" }}
                  onClick={() => { loadMesCotisations(); setPage("mes-cotisations"); }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(52,152,219,0.20)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#3498db,#2980b9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="dollar" size={22} style={{ color: "white" }} /></div>
                    <div>
                      <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{lang === "fr" ? "Mes cotisations" : "My Contributions"}</div>
                      <div style={{ color: "#7f8c8d", fontSize: "12px", marginTop: "2px" }}>{lang === "fr" ? "Voir mes paiements et statuts" : "View my payments and statuses"}</div>
                    </div>
                  </div>
                  <div style={{ color: "#3498db", fontWeight: "700", fontSize: "18px" }}>→</div>
                </div>

                {/* ── Configuration Mobile Money ── */}
                {isAdmin && (
                  <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e8edf3", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                    <div style={{ background: "linear-gradient(135deg,#1a2a3a,#2c3e50)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Icon name="phone" size={20} style={{ color: "white" }} />
                        <div>
                          <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{lang === "fr" ? "Comptes Mobile Money" : "Mobile Money Accounts"}</div>
                          <div style={{ color: "#a8c4d8", fontSize: "11px" }}>{lang === "fr" ? "Numéros de réception des paiements" : "Payment receiving numbers"}</div>
                        </div>
                      </div>
                      {!mmEditMode && (
                        <button onClick={() => { setMmForm({ ...mmConfig }); setMmEditMode(true); setMmError(""); setMmSuccess(""); }}
                          style={{ padding: "7px 16px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                          ✏️ {lang === "fr" ? "Modifier" : "Edit"}
                        </button>
                      )}
                    </div>
                    <div style={{ padding: "18px 20px" }}>
                      {mmSuccess && <div style={{ background: "#d5f5e3", color: "#1e8449", padding: "9px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: "600" }}>{mmSuccess}</div>}
                      {mmError && <div style={{ background: "#fdecea", color: "#c0392b", padding: "9px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>⚠️ {mmError}</div>}
                      {!mmEditMode ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {[
                            { label: "Orange Money", img: imgOrange, color: "#FF6600", bg: "#fff3e6", numero: mmConfig.om_numero, nom: mmConfig.om_nom },
                            { label: "Wave",         img: imgWave,   color: "#009BDB", bg: "#e6f5fc", numero: mmConfig.wave_numero, nom: mmConfig.wave_nom },
                            { label: "MTN MoMo",    img: imgMTN,    color: "#FFCC00", bg: "#fffbe6", numero: mmConfig.mtn_numero, nom: mmConfig.mtn_nom },
                          ].map(({ label, img, color, bg, numero, nom }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: bg, borderRadius: "10px", border: `1px solid ${color}33` }}>
                              <img src={img} alt={label} style={{ height: "28px", width: "auto", maxWidth: "62px", objectFit: "contain", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                {numero ? (
                                  <div style={{ color: "#2c3e50", fontSize: "14px", fontWeight: "600", marginTop: "2px" }}>{numero}{nom ? ` — ${nom}` : ""}</div>
                                ) : (
                                  <div style={{ color: "#bdc3c7", fontSize: "12px", fontStyle: "italic" }}>{lang === "fr" ? "Non configuré" : "Not configured"}</div>
                                )}
                              </div>
                              {numero && <span style={{ background: color, color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>ACTIF</span>}
                            </div>
                          ))}
                          {!mmConfig.om_numero && !mmConfig.wave_numero && !mmConfig.mtn_numero && (
                            <div style={{ textAlign: "center", padding: "10px", color: "#7f8c8d", fontSize: "13px" }}>
                              {lang === "fr" ? "Aucun compte Mobile Money configuré. Cliquez sur Modifier pour en ajouter." : "No Mobile Money account configured. Click Edit to add one."}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {[
                            { label: "Orange Money", img: imgOrange, color: "#FF6600", numKey: "om_numero", nomKey: "om_nom", ph: "+225 07 00 00 00 00" },
                            { label: "Wave",         img: imgWave,   color: "#009BDB", numKey: "wave_numero", nomKey: "wave_nom", ph: "+225 01 00 00 00 00" },
                            { label: "MTN MoMo",     img: imgMTN,    color: "#FFCC00", numKey: "mtn_numero", nomKey: "mtn_nom", ph: "+225 05 00 00 00 00" },
                          ].map(({ label, img, color, numKey, nomKey, ph }) => (
                            <div key={numKey} style={{ marginBottom: "16px", padding: "12px 16px", background: "#f7f9fc", borderRadius: "10px", border: "1px solid #e8edf3" }}>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#2c3e50", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src={img} alt={label} style={{ height: "22px", width: "auto", maxWidth: "52px", objectFit: "contain" }} />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                  <label style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Numéro" : "Number"}</label>
                                  <input value={mmForm[numKey]} onChange={e => setMmForm(f => ({ ...f, [numKey]: e.target.value }))}
                                    placeholder={ph} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Nom bénéficiaire" : "Beneficiary name"}</label>
                                  <input value={mmForm[nomKey]} onChange={e => setMmForm(f => ({ ...f, [nomKey]: e.target.value }))}
                                    placeholder={lang === "fr" ? "Ex. Jean Kouakou" : "Ex. Jean Kouakou"} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }} />
                                </div>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button onClick={() => { setMmEditMode(false); setMmForm({ ...mmConfig }); setMmError(""); }}
                              style={{ padding: "9px 20px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                              {lang === "fr" ? "Annuler" : "Cancel"}
                            </button>
                            <button onClick={saveMMConfig} disabled={mmSaving}
                              style={{ padding: "9px 20px", background: mmSaving ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700", opacity: mmSaving ? 0.8 : 1 }}>
                              {mmSaving ? (lang === "fr" ? "Enregistrement…" : "Saving…") : (lang === "fr" ? "✅ Enregistrer" : "✅ Save")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── MES COTISATIONS ──────────────────────────────────── */}
        {page === "mes-cotisations" && (
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <button style={styles.backBtn} onClick={() => setPage("accueil")}>{t("backBtn")}</button>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#3498db,#2980b9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="dollar" size={24} style={{ color: "white" }} /></div>
              <div>
                <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "20px", fontWeight: "800" }}>{lang === "fr" ? "Mes cotisations" : "My Contributions"}</h2>
                <p style={{ margin: 0, color: "#7f8c8d", fontSize: "13px" }}>{lang === "fr" ? "Historique de vos paiements et soldes" : "Your payment history and balances"}</p>
              </div>
            </div>
            {mesCotisationsLoading ? (
              <div style={styles.infoMessage}>{lang === "fr" ? "Chargement…" : "Loading…"}</div>
            ) : mesCotisations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", background: "white", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: "52px", marginBottom: "12px" }}>📭</div>
                <p style={{ color: "#7f8c8d", fontSize: "15px", margin: 0 }}>{lang === "fr" ? "Aucune cotisation enregistrée pour vous." : "No contributions recorded for you."}</p>
              </div>
            ) : (
              <>
                {/* Stats rapides */}
                {(() => {
                  const payes = mesCotisations.filter(c => c.statut === "Payé").length;
                  const partiels = mesCotisations.filter(c => c.statut === "Partiel").length;
                  const impayes = mesCotisations.filter(c => c.statut === "Impayé").length;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                      {[
                        { label: lang === "fr" ? "Payées" : "Paid", count: payes, color: "#27ae60", bg: "#d5f5e3", icon: "check-circle" },
                        { label: lang === "fr" ? "Partielles" : "Partial", count: partiels, color: "#f39c12", bg: "#fef9e7", icon: "hourglass" },
                        { label: lang === "fr" ? "Impayées" : "Unpaid", count: impayes, color: "#e74c3c", bg: "#fdecea", icon: "x-circle" },
                      ].map(({ label, count, color, bg, icon }) => (
                        <div key={label} style={{ background: bg, borderRadius: "12px", padding: "16px 14px", textAlign: "center", border: `1px solid ${color}33` }}>
                          <div style={{ marginBottom: "4px", color }}><Icon name={icon} size={22} /></div>
                          <div style={{ fontSize: "22px", fontWeight: "800", color }}>{count}</div>
                          <div style={{ fontSize: "11px", color, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Liste */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {mesCotisations.map((c, i) => {
                    const statColor = c.statut === "Payé" ? "#27ae60" : c.statut === "Partiel" ? "#f39c12" : "#e74c3c";
                    const statBg = c.statut === "Payé" ? "#d5f5e3" : c.statut === "Partiel" ? "#fef9e7" : "#fdecea";
                    const statLabel = c.statut === "Payé" ? (lang === "fr" ? "Payé" : "Paid") : c.statut === "Partiel" ? (lang === "fr" ? "Partiel" : "Partial") : (lang === "fr" ? "Impayé" : "Unpaid");
                    return (
                      <div key={i} style={{ background: "white", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: `2px solid ${statColor}33` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>{c.periode}</div>
                          <span style={{ background: statColor, color: "white", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{statLabel}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                          {[
                            { label: lang === "fr" ? "Montant dû" : "Amount due", value: c.montantDu, color: "#2c3e50" },
                            { label: lang === "fr" ? "Montant payé" : "Amount paid", value: c.soldePaye, color: "#27ae60" },
                            { label: lang === "fr" ? "Reste" : "Remaining", value: c.reste, color: "#e74c3c" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: "#f7f9fc", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "14px", fontWeight: "800", color }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {c.dernierPaiement && (
                          <div style={{ fontSize: "11px", color: "#95a5a6", marginTop: "10px", textAlign: "right" }}>
                            🕐 {lang === "fr" ? "Dernier paiement :" : "Last payment:"} {c.dernierPaiement}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ACCUEIL ─────────────────────────────────────────── */}
        {page === "accueil" && (() => {
          const nowD = new Date();
          const monthlyData = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(nowD.getFullYear(), nowD.getMonth() - (5 - i), 1);
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const key = `${d.getFullYear()}-${mm}`;
            const label = d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short" });
            const total = historiqueTransactions
              .filter(tx => { if (!tx.datePaiement) return false; const p = tx.datePaiement.split("/"); return p.length === 3 && `${p[2]}-${p[1]}` === key; })
              .reduce((sum, tx) => sum + parseAmount(tx.montantPaye), 0);
            return { label, total };
          });
          const maxMonth = Math.max(...monthlyData.map(m => m.total), 1);
          const roleLabel = isAdmin ? (compte?.poste || (lang === "fr" ? "Créateur / Admin" : "Creator / Admin")) : isTresorier ? (lang === "fr" ? "Trésorier" : "Treasurer") : compte?.poste || (lang === "fr" ? "Membre" : "Member");
          const roleColor = isAdmin ? "#9b59b6" : isTresorier ? "#3498db" : "#27ae60";
          const derniersMsgs = adminMessages.slice(0, 3);
          return (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* ① CARTE BIENVENUE */}
            <div style={{ background: "linear-gradient(135deg,#1a2742 0%,#2c3e50 60%,#1a6b9e 100%)", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(52,152,219,0.12)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: "60px", bottom: "-60px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(52,152,219,0.08)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={profilData.photo || logo} alt="Photo" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(52,152,219,0.7)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} />
                  <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#27ae60", border: "2px solid #1a2742" }} />
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{lang === "fr" ? "Bonjour," : "Hello,"}</div>
                  <div style={{ color: "#fff", fontSize: "22px", fontWeight: "800", lineHeight: "1.2", marginBottom: "8px" }}>
                    {profilData.prenom || profilData.nom ? `${profilData.prenom} ${profilData.nom}` : compte?.email?.split("@")[0]}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ background: roleColor, color: "#fff", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" }}>{roleLabel}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}><Icon name="shield" size={11} style={{ color: "rgba(52,152,219,0.85)" }} /> {compte?.nom_association}</span>
                  </div>
                </div>
              </div>
              <LiveClock lang={lang} />
            </div>

            {/* ② STATS CARDS avec animation compteur */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "16px" }} className="home-stat-grid">
              {[
                { iconName: "users",    label: lang === "fr" ? "Total adhérents" : "Total members",    value: adherents.length,             suffix: "",   bg: "linear-gradient(135deg,#0f3460 0%,#1a6b9e 100%)",   glow: "rgba(52,152,219,0.40)" },
                { iconName: "dollar",   label: lang === "fr" ? "Cotisations reçues" : "Contributions", value: totalEncaissePeriodeCourante, suffix: " F", bg: "linear-gradient(135deg,#0d3b22 0%,#1e8449 100%)",   glow: "rgba(39,174,96,0.40)" },
                { iconName: "x-circle", label: lang === "fr" ? "Non payés" : "Unpaid",                 value: currentPeriodeNotPaidCount,   suffix: "",   bg: "linear-gradient(135deg,#3b0f0f 0%,#a93226 100%)",   glow: "rgba(231,76,60,0.40)" },
                { iconName: "bank",     label: lang === "fr" ? "Solde net" : "Net balance",             value: Math.abs(comptaResume.solde), suffix: " F", bg: comptaResume.solde >= 0 ? "linear-gradient(135deg,#2e1a4a 0%,#7d3c98 100%)" : "linear-gradient(135deg,#3b0f0f 0%,#a93226 100%)", glow: comptaResume.solde >= 0 ? "rgba(155,89,182,0.40)" : "rgba(231,76,60,0.40)", prefix: comptaResume.solde < 0 ? "-" : "" },
              ].map(({ iconName, label, value, suffix, bg, glow, prefix: pfx = "" }, idx) => (
                <InView key={label} delay={idx * 0.09}>
                  <div style={{ background: bg, borderRadius: "18px", padding: "22px 20px 20px", boxShadow: `0 8px 36px ${glow}`, position: "relative", overflow: "hidden", cursor: "default" }} className="home-stat-card">
                    <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.1, color: "#fff", pointerEvents: "none", userSelect: "none" }}>
                      <Icon name={iconName} size={90} />
                    </div>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))", borderRadius: "18px 18px 0 0" }} />
                    <div className="home-stat-icon" style={{ width: "44px", height: "44px", borderRadius: "13px", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", color: "#fff" }}>
                      <Icon name={iconName} size={21} />
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.1px", marginBottom: "8px" }}>{label}</div>
                    <CountUp target={Math.round(value)} color="#fff" prefix={pfx} suffix={suffix} />
                  </div>
                </InView>
              ))}
            </div>

            {/* ③ ACTIVITÉS + ALERTES */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="home-mid-grid">
              <InView delay={0.1}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#3498db,#2980b9)" }}>
                      <Icon name="clock" size={15} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Activités récentes" : "Recent activities"}</span>
                  </div>
                  <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px" }} onClick={() => setPage("historique")}>{lang === "fr" ? "Voir tout" : "View all"}</button>
                </div>
                {cinqDerniersPaiements.length === 0 ? (
                  <p style={{ color: "#95a5a6", fontSize: "13px", fontStyle: "italic", margin: 0 }}>{lang === "fr" ? "Aucune activité récente" : "No recent activity"}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {cinqDerniersPaiements.map((pay, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "#f8fbff", borderRadius: "10px", border: "1px solid #e8f4fd" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#3498db,#2980b9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="dollar" size={14} style={{ color: "#fff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a2742", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pay.nom} {pay.prenom}</div>
                          <div style={{ fontSize: "11px", color: "#95a5a6" }}>{pay.datePaiement} · {periodeLabel(pay.periode)}</div>
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "13px", color: "#27ae60", flexShrink: 0 }}>{pay.montantPaye}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </InView>

              <InView delay={0.18}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
                  <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#f39c12,#e67e22)" }}>
                    <Icon name="alert-triangle" size={14} />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Alertes importantes" : "Important alerts"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentPeriodeNotPaidCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fef0f0", border: "1px solid #fad7d7", borderRadius: "12px", padding: "12px 14px" }}>
                      <span style={{ background: "#e74c3c", color: "#fff", borderRadius: "50%", minWidth: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{currentPeriodeNotPaidCount}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#c0392b" }}>{lang === "fr" ? "Membres non payés" : "Unpaid members"}</div>
                        <div style={{ fontSize: "11px", color: "#e74c3c" }}>{currentPeriode ? periodeLabel(currentPeriode.libelle) : ""}</div>
                      </div>
                      <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px", background: "#e74c3c" }} onClick={() => { setPage("nonRegle"); setShowUnpaidOrPartial(false); setShowUnpaidOnly(false); }}>{lang === "fr" ? "Voir" : "View"}</button>
                    </div>
                  )}
                  {adminMsgUnread > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "12px 14px" }}>
                      <span style={{ background: "#f39c12", color: "#fff", borderRadius: "50%", minWidth: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{adminMsgUnread}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#d35400" }}>{lang === "fr" ? "Nouveaux messages" : "New messages"}</div>
                      </div>
                      <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px", background: "#f39c12" }} onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}>{lang === "fr" ? "Lire" : "Read"}</button>
                    </div>
                  )}
                  {comptaResume.solde < 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fef0f0", border: "1px solid #fad7d7", borderRadius: "12px", padding: "12px 14px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                        <Icon name="bank" size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#c0392b" }}>{lang === "fr" ? "Solde négatif" : "Negative balance"}</div>
                        <div style={{ fontSize: "11px", color: "#e74c3c" }}>{formatAmount(comptaResume.solde)}</div>
                      </div>
                    </div>
                  )}
                  {currentPeriodeNotPaidCount === 0 && adminMsgUnread === 0 && comptaResume.solde >= 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#eafaf1", border: "1px solid #a9dfbf", borderRadius: "12px", padding: "12px 14px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#27ae60", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                        <Icon name="check" size={14} />
                      </div>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e8449" }}>{lang === "fr" ? "Tout est à jour !" : "All up to date!"}</div>
                    </div>
                  )}
                </div>
              </div>
              </InView>
            </div>

            {/* ④ GRAPHIQUE + MESSAGES */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }} className="home-bottom-grid">
              <InView delay={0.12}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#27ae60,#1e8449)" }}>
                      <Icon name="bar-chart" size={15} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Cotisations — 6 derniers mois" : "Contributions — last 6 months"}</span>
                  </div>
                  <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px" }} onClick={() => { setPage("comptabilite"); loadComptabilite(); }}>{lang === "fr" ? "Détail" : "Detail"}</button>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "130px" }}>
                  {monthlyData.map(({ label, total }, i) => {
                    const pct = total / maxMonth * 100;
                    const isLast = i === monthlyData.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                        <div style={{ fontSize: "9px", color: "#3498db", fontWeight: "700", minHeight: "13px" }}>{total > 0 ? `${Math.round(total / 1000)}k` : ""}</div>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                          <div className="home-chart-bar" style={{ animationDelay: `${i * 0.07}s`, width: "100%", height: `${Math.max(pct, 4)}%`, background: isLast ? "linear-gradient(to top,#1a6b9e,#3498db)" : "linear-gradient(to top,#b8d9f0,#d6ecf8)", borderRadius: "5px 5px 0 0", minHeight: "4px", boxShadow: isLast ? "0 0 10px rgba(52,152,219,0.35)" : "none" }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "#95a5a6", fontWeight: "600", textTransform: "capitalize" }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "14px", borderTop: "1px solid #f0f4f8", paddingTop: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#3498db" }} /><span style={{ fontSize: "11px", color: "#7f8c8d" }}>{lang === "fr" ? "Mois actuel" : "Current month"}</span></div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#d6ecf8" }} /><span style={{ fontSize: "11px", color: "#7f8c8d" }}>{lang === "fr" ? "Mois précédents" : "Previous months"}</span></div>
                  <div style={{ marginLeft: "auto", fontSize: "11px", color: "#7f8c8d" }}>{lang === "fr" ? "Période : " : "Period: "}<strong style={{ color: "#27ae60" }}>{formatAmount(totalEncaissePeriodeCourante)}</strong></div>
                </div>
              </div>
              </InView>

              <InView delay={0.2}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#9b59b6,#8e44ad)" }}>
                      <Icon name="mail" size={14} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>Messages</span>
                    {adminMsgUnread > 0 && <span style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: "700" }}>{adminMsgUnread}</span>}
                  </div>
                  <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px" }} onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}>{lang === "fr" ? "Voir" : "View"}</button>
                </div>
                {derniersMsgs.length === 0 ? (
                  <p style={{ color: "#95a5a6", fontSize: "12px", fontStyle: "italic", margin: 0 }}>{lang === "fr" ? "Aucun message" : "No messages"}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {derniersMsgs.map((m, i) => (
                      <div key={i} style={{ padding: "10px 12px", background: m.is_mine ? "#f0f8ff" : "#f8f9fa", borderRadius: "10px", border: `1px solid ${m.is_mine ? "#d6ecf8" : "#eaecef"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: m.is_mine ? "#3498db" : "#7f8c8d" }}>{m.is_mine ? (lang === "fr" ? "Vous" : "You") : (m.auteur_prenom || "Admin")}</span>
                          <span style={{ fontSize: "10px", color: "#bdc3c7" }}>{m.created_at ? new Date(m.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" }) : ""}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#1a2742", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </InView>
            </div>

            {/* ⑤ Admin : statut notifications */}
            {isAdmin && (
              <InView delay={0.1}>
              <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid #e8edf3", padding: "24px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} className="home-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                  <div className="home-icon-badge" style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#f39c12,#e67e22)" }}>
                    <Icon name="bell" size={16} />
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Statut des notifications" : "Notification status"}</span>
                </div>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {[
                    { iconName: "mail", label: "Email (Gmail)", ok: serverStatus?.email, desc: lang === "fr" ? "Confirmation paiement, rappels" : "Payment confirmation, reminders" },
                  ].map(({ iconName, label, ok, desc }) => (
                    <div key={label} style={{ flex: "1", minWidth: "200px", background: ok ? "#eafaf1" : "#f8f9fa", border: `1.5px solid ${ok ? "#a9dfbf" : "#e0e6ed"}`, borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: ok ? "linear-gradient(135deg,#1e8449,#27ae60)" : "linear-gradient(135deg,#5d6d7e,#7f8c8d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                        <Icon name={iconName} size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a2742", display: "flex", alignItems: "center", gap: "6px" }}>
                          {label}
                          <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", background: ok ? "#27ae60" : "#e74c3c", color: "white" }}>
                            {ok ? (lang === "fr" ? "Actif" : "Active") : (lang === "fr" ? "Inactif" : "Inactive")}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "3px" }}>{desc}</div>
                        {!ok && (
                          <div style={{ fontSize: "11px", color: "#e74c3c", marginTop: "4px" }}>
                            {label.includes("SMS")
                              ? (lang === "fr" ? "Ajoutez AT_USERNAME et AT_API_KEY dans les variables d'env." : "Add AT_USERNAME and AT_API_KEY to env vars.")
                              : (lang === "fr" ? "Ajoutez EMAIL_USER et EMAIL_PASS dans les variables d'env." : "Add EMAIL_USER and EMAIL_PASS to env vars.")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </InView>
            )}

            {/* ⑥ ACTIONS RAPIDES */}
            <InView delay={0.08}>
            <div style={{ background: "#fff", borderRadius: "18px", padding: "22px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px" }}>
                <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#3498db,#1a6fa8)" }}>
                  <Icon name="plus" size={15} />
                </div>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Actions rapides" : "Quick actions"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                {[
                  { iconName: "users",      label: lang === "fr" ? "Ajouter adhérent"      : "Add member",        bg: "linear-gradient(135deg,#0f3460,#1a6b9e)", targetPage: "adherents",    show: isAdmin || isTresorier },
                  { iconName: "dollar",     label: lang === "fr" ? "Enregistrer paiement"  : "Record payment",    bg: "linear-gradient(135deg,#0d3b22,#1e8449)", targetPage: "cotisations",  show: canActAsTresorier },
                  { iconName: "mail",       label: lang === "fr" ? "Envoyer message"        : "Send message",      bg: "linear-gradient(135deg,#4a235a,#9b59b6)", targetPage: "messages",     show: true },
                  { iconName: "clock",      label: lang === "fr" ? "Voir historique"        : "View history",      bg: "linear-gradient(135deg,#1a3560,#2980b9)", targetPage: "historique",   show: true },
                  { iconName: "bar-chart",  label: lang === "fr" ? "Comptabilité"           : "Accounting",        bg: "linear-gradient(135deg,#145a32,#27ae60)", targetPage: "comptabilite", show: canActAsTresorier },
                  { iconName: "shield",     label: "Audit",                                                        bg: "linear-gradient(135deg,#3b0f0f,#a93226)", targetPage: "audit",        show: isAdmin },
                ].filter(a => a.show).map(({ iconName, label, bg, targetPage }) => (
                  <button key={label} onClick={() => { setPage(targetPage); if (targetPage === "comptabilite") loadComptabilite(); }} className="quick-action-btn" style={{ background: bg, borderRadius: "12px", border: "none", padding: "14px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px", boxShadow: "0 3px 12px rgba(0,0,0,0.15)", width: "100%" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Icon name={iconName} size={16} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff", textAlign: "left", lineHeight: "1.3" }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            </InView>

            {/* ⑦ TAUX DE PAIEMENT DE LA PÉRIODE */}
            {currentPeriode && adherents.length > 0 && (
              <InView delay={0.1}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "24px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "20px" }}>
                  <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#27ae60,#1e8449)" }}>
                    <Icon name="trending-up" size={15} />
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Taux de paiement" : "Payment rate"}</span>
                    <span style={{ marginLeft: "10px", fontSize: "12px", color: "#95a5a6", fontWeight: "600" }}>— {periodeLabel(currentPeriode.libelle)}</span>
                  </div>
                </div>
                {(() => {
                  const total = adherents.length;
                  const paid = total - currentPeriodeNotPaidCount;
                  const pct = total > 0 ? Math.round(paid / total * 100) : 0;
                  const color = pct >= 70 ? "#27ae60" : pct >= 40 ? "#f39c12" : "#e74c3c";
                  const gradient = pct >= 70 ? "linear-gradient(90deg,#1e8449,#27ae60)" : pct >= 40 ? "linear-gradient(90deg,#d35400,#f39c12)" : "linear-gradient(90deg,#a93226,#e74c3c)";
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10px" }}>
                        <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "600" }}>{paid} / {total} {lang === "fr" ? "membres ont payé" : "members paid"}</span>
                        <span style={{ fontSize: "28px", fontWeight: "900", color, lineHeight: 1 }}>{pct}%</span>
                      </div>
                      <div style={{ height: "14px", background: "#f0f4f8", borderRadius: "100px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: gradient, borderRadius: "100px", transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ display: "flex", gap: "24px", marginTop: "14px" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27ae60" }} />
                          <span style={{ fontSize: "12px", color: "#4a5568", fontWeight: "600" }}>{paid} {lang === "fr" ? "payés" : "paid"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e74c3c" }} />
                          <span style={{ fontSize: "12px", color: "#4a5568", fontWeight: "600" }}>{currentPeriodeNotPaidCount} {lang === "fr" ? "non payés" : "unpaid"}</span>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                          <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 12px" }} onClick={() => { setPage("adherents"); setShowUnpaidOnly(true); }}>
                            {lang === "fr" ? "Voir les non payés" : "View unpaid"}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              </InView>
            )}

            {/* ⑧ DERNIERS ADHÉRENTS INSCRITS */}
            {adherents.length > 0 && (
              <InView delay={0.12}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8edf3" }} className="home-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div className="home-icon-badge" style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#1a6b9e,#3498db)" }}>
                      <Icon name="users" size={15} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a2742" }}>{lang === "fr" ? "Derniers adhérents inscrits" : "Latest registered members"}</span>
                  </div>
                  <button style={{ ...styles.alertButton, fontSize: "11px", padding: "5px 10px" }} onClick={() => setPage("adherents")}>{lang === "fr" ? "Voir tous" : "View all"}</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[...adherents].sort((a, b) => b.id - a.id).slice(0, 6).map((adh, i) => (
                    <div key={adh.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: i % 2 === 0 ? "#f8fbff" : "#fff", borderRadius: "10px", border: "1px solid #eef2f7", transition: "background 0.15s" }}>
                      {adh.photo
                        ? <img src={adh.photo} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #d6ecf8", flexShrink: 0 }} />
                        : <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#1a6b9e,#3498db)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "14px", flexShrink: 0 }}>
                            {((adh.prenom?.[0] || "") + (adh.nom?.[0] || "") || "?").toUpperCase()}
                          </div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a2742", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adh.prenom} {adh.nom}</div>
                        <div style={{ fontSize: "11px", color: "#95a5a6" }}>{adh.poste || (lang === "fr" ? "Membre" : "Member")}</div>
                      </div>
                      {adh.email && <div style={{ fontSize: "11px", color: "#7f8c8d", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adh.email}</div>}
                      <div style={{ fontSize: "10px", color: "#bdc3c7", fontWeight: "700", flexShrink: 0 }}>#{adh.id}</div>
                    </div>
                  ))}
                </div>
              </div>
              </InView>
            )}

          </div>
          );
        })()}

        {/* ── ADHERENTS ────────────────────────────────────────── */}
        {page === "adherents" && (
          <div>
            {selectedAdherentId === null ? (
              <div>
                <h1>{t("memberManagement")}</h1>

                {/* ── Code d'invitation membres ── */}
                {isHautMembre && <div style={{ background: "linear-gradient(135deg,#1a2742,#2c3e50)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", color: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Icon name="link" size={16} />
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>{lang === "fr" ? "Code d'invitation — auto-inscription" : "Invite code — self-registration"}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                        {lang === "fr" ? "Partagez ce code pour que les membres s'inscrivent eux-mêmes." : "Share this code so members can register themselves."}
                      </div>
                    </div>
                  </div>
                  {!inviteToken ? (
                    <button style={{ padding: "8px 18px", background: "#3498db", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }} onClick={loadInviteToken}>
                      {lang === "fr" ? "Générer le code" : "Generate code"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <div style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "7px", padding: "8px 14px", fontFamily: "monospace", fontSize: "14px", fontWeight: "700", letterSpacing: "1px", flex: "1 1 160px", wordBreak: "break-all" }}>{inviteToken}</div>
                      <button style={{ padding: "8px 14px", background: inviteCopied ? "#27ae60" : "#3498db", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "12px", flexShrink: 0 }} onClick={copyInviteToken}>
                        {inviteCopied ? (lang === "fr" ? "✅ Copié !" : "✅ Copied!") : (lang === "fr" ? "📋 Copier" : "📋 Copy")}
                      </button>
                      <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "7px", cursor: "pointer", fontSize: "12px", flexShrink: 0 }} onClick={resetInviteToken} disabled={inviteResetting}>
                        {inviteResetting ? "…" : (lang === "fr" ? "🔄 Nouveau" : "🔄 New")}
                      </button>
                    </div>
                  )}
                </div>}

                {showUnpaidOrPartial && (
                  <div style={{ background: "#fef9e7", border: "1px solid #f39c12", borderRadius: "8px", padding: "12px 18px", marginBottom: "14px", color: "#7d6608", fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      {t("filteredUnpaid")}
                      {currentPeriode ? ` ${t("forPeriod")} ${periodeLabel(currentPeriode.libelle)}` : ""}
                    </span>
                    <button style={{ background: "none", border: "1px solid #f39c12", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", color: "#7d6608", fontWeight: "bold" }} onClick={() => setShowUnpaidOrPartial(false)}>
                      {t("clearFilter")}
                    </button>
                  </div>
                )}
                {apiError && <div style={styles.errorMessage}>{apiError}</div>}
                {loadingAdherents && <div style={styles.infoMessage}>{t("loadingMembers")}</div>}

                {/* ── Bureau de l'association (visible membres & admin) ── */}
                {!loadingAdherents && adherents.filter(a => a.poste).length > 0 && (
                  <div style={{ background: "linear-gradient(135deg,#1a2742,#2c3e50)", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px", color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <Icon name="building" size={22} style={{ color: "white" }} />
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "16px" }}>{lang === "fr" ? "Bureau de l'association" : "Association Board"}</div>
                        <div style={{ fontSize: "12px", color: "#a0b4c8" }}>{lang === "fr" ? "Membres élus et responsables" : "Elected members and officers"}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                      {adherents.filter(a => a.poste).map(a => (
                        <div key={a.id} style={{ background: "rgba(255,255,255,0.10)", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                          {a.photo
                            ? <img src={a.photo} alt="" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #3498db", flexShrink: 0 }} />
                            : <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#34495e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>👤</div>
                          }
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nom} {a.prenom}</div>
                            <div style={{ fontSize: "11px", color: "#3498db", fontWeight: "600", marginTop: "2px" }}>{a.poste}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.toolbarSection}>
                  <div style={styles.toolbarTop} className="toolbar-top">
                    {canActAsTresorier && (
                      <button style={styles.addBtn} className="toolbar-btn" onClick={() => { setEditingIndex(null); setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); }}>
                        <Icon name="plus" size={14} /> {t("addMemberBtn")}
                      </button>
                    )}
                    <div style={styles.statsBox} className="stats-box">
                      <Icon name="users" size={14} /> <strong>{adherents.length}</strong> {lang === "fr" ? "membre(s)" : "member(s)"}
                    </div>
                    <button style={{ ...styles.addBtn, background: "#16a34a", marginLeft: "auto" }} className="toolbar-btn" onClick={exportExcel}>
                      <Icon name="download" size={14} /> {t("exportExcel")}
                    </button>
                  </div>
                  <div style={styles.filtersSection}>
                    <input
                      type="text"
                      placeholder={t("searchMember")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={styles.searchInput}
                    />
                  </div>
                </div>

                {/* Modal ajout/modification adhérent */}
                {showForm && (
                  <div style={styles.modalOverlay}>
                    <div ref={modalRef} style={{ ...styles.modal, ...modalPos }} className="modal-box" onMouseDown={dragProps}>
                      <h2>{editingIndex !== null ? t("editMemberTitle") : t("addMemberTitle")}</h2>
                      <div style={styles.formRow}><label style={styles.label}>{t("lastName")}</label><input name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex. Kouakou" style={styles.input} autoFocus /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("firstName")}</label><input name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex. Jean" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("phone")}</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Ex. +225 07 00 00 00 00" style={styles.input} /></div>
                      <div style={styles.formRow}>
                        <label style={styles.label}>{t("emailField")}</label>
                        <input name="email" value={formData.email} onChange={handleChange} placeholder="Ex. jean@example.com" type="email" style={styles.input} />
                        {editingIndex === null && (
                          <span style={{ fontSize: "11px", color: "#27ae60", marginTop: "4px", display: "block" }}>
                            {lang === "fr" ? "📧 Un mot de passe sera envoyé automatiquement par email." : "📧 A password will be sent automatically by email."}
                          </span>
                        )}
                      </div>
                      <div style={styles.formRow}><label style={styles.label}>{t("registrationDate")}</label><input type="date" name="date" value={formData.date} onChange={handleChange} style={styles.input} /></div>
                      {isPresident && (
                      <div style={styles.formRow}>
                        <label style={styles.label}>{lang === "fr" ? "Poste / Rôle" : "Role / Position"}</label>
                        <select name="poste" value={formData.poste || ""} onChange={handleChange} style={styles.input}>
                          <option value="">{lang === "fr" ? "— Aucun poste —" : "— No role —"}</option>
                          <option value="Président(e)">{lang === "fr" ? "Président(e)" : "President"}</option>
                          <option value="Vice-Président(e)">{lang === "fr" ? "Vice-Président(e)" : "Vice-President"}</option>
                          <option value="Secrétaire Général(e)">{lang === "fr" ? "Secrétaire Général(e)" : "General Secretary"}</option>
                          <option value="Secrétaire Adjoint(e)">{lang === "fr" ? "Secrétaire Adjoint(e)" : "Deputy Secretary"}</option>
                          <option value="Trésorier(e)">{lang === "fr" ? "Trésorier(e)" : "Treasurer"}</option>
                          <option value="Trésorier(e) Adjoint(e)">{lang === "fr" ? "Trésorier(e) Adjoint(e)" : "Deputy Treasurer"}</option>
                          <option value="Commissaire aux comptes">{lang === "fr" ? "Commissaire aux comptes" : "Auditor"}</option>
                          <option value="Conseiller(e)">{lang === "fr" ? "Conseiller(e)" : "Adviser"}</option>
                        </select>
                      </div>
                      )}
                      {editingIndex !== null && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
                          <div
                            style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", border: "3px solid #3498db", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                            onClick={() => document.getElementById("adherentPhotoInput").click()}
                            title="Cliquer pour changer la photo"
                          >
                            {formData.photo ? (
                              <img src={formData.photo} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: "48px" }}>👤</span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            id="adherentPhotoInput"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => setFormData((prev) => ({ ...prev, photo: ev.target.result, photoName: file.name }));
                              reader.readAsDataURL(file);
                            }}
                          />
                          <button
                            type="button"
                            style={{ marginTop: "8px", padding: "6px 14px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                            onClick={() => document.getElementById("adherentPhotoInput").click()}
                          >
                            {formData.photo ? t("changePhoto") : t("addPhoto")}
                          </button>
                          {formData.photoName && (
                            <span style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "4px" }}>{formData.photoName}</span>
                          )}
                        </div>
                      )}
                      <div style={styles.modalButtons}>
                        <button style={styles.addBtn} onClick={handleSave}>{editingIndex !== null ? t("edit") : t("add")}</button>
                        <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingIndex(null); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); }}>{t("cancel")}</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal confirmation suppression */}
                {showDeleteConfirm && (
                  <div style={styles.modalOverlay}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "360px", maxWidth: "92vw", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
                      <h3 style={{ color: "#e74c3c", marginTop: 0 }}>{t("confirmDeletion")}</h3>
                      <p style={{ color: "#555", lineHeight: "1.6" }}>{t("deleteMemberConfirm")}<br /><strong>{t("irreversibleAction")}</strong></p>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                        <button style={styles.cancelBtn} onClick={() => { handleDelete(deleteIndex); setShowDeleteConfirm(false); setDeleteIndex(null); }}>{t("deleteBtn")}</button>
                        <button style={styles.addBtn} onClick={() => { setDeleteIndex(null); setShowDeleteConfirm(false); }}>{t("cancel")}</button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.tableContainer}>
                  {filteredAdherents.length === 0 ? (
                    <div style={styles.emptyState}><p>{t("noMemberFound")}</p></div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>{t("matricule")}</th><th style={styles.th}>{t("nameTh")}</th><th style={styles.th}>{t("surnameTh")}</th>
                          <th style={styles.th}>{t("telephoneTh")}</th><th style={styles.th}>{t("emailTh")}</th>
                          <th style={styles.th}>{t("dateRegisteredTh")}</th><th style={styles.th}>{t("actionsTh")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdherents.map((a, i) => (
                          <tr key={a.id ?? a.originalIndex} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }} className="anim-row">
                            <td style={styles.td}><strong>{a.matricule}</strong></td>
                            <td style={styles.td}>
                              {a.nom}
                              {a.poste && <div style={{ fontSize: "10px", color: "#3498db", fontWeight: "700", marginTop: "2px" }}>{a.poste}</div>}
                            </td>
                            <td style={styles.td}>{a.prenom}</td>
                            <td style={styles.td}>{a.telephone || "-"}</td>
                            <td style={styles.td}>{a.email || "-"}</td>
                            <td style={styles.td}>{a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "-"}</td>
                            <td style={styles.td}>
                              <button style={styles.detailsBtn} onClick={() => { setSelectedAdherentId(a.id); loadAdherentCotisations(a.id); setFichePosteSelected(a.poste || ""); setFichePosteSuccess(""); setFichePosteError(""); }}><EyeOpen /></button>
                              {(canActAsPresident || a.email === compte?.email) && <button style={styles.actionBtn} title={lang === "fr" ? "Modifier" : "Edit"} onClick={() => { const ad = adherents[a.originalIndex]; setEditingIndex(a.originalIndex); setFormData({ ...ad, photo: ad.photo || "", photoName: ad.photo ? "Photo existante" : "" }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); }}><Icon name="edit" size={15} /></button>}
                              {canActAsTresorier && <button style={styles.actionDeleteBtn} title={lang === "fr" ? "Supprimer" : "Delete"} onClick={() => { setDeleteIndex(a.id); setShowDeleteConfirm(true); }}><Icon name="trash" size={15} /></button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                <button style={styles.backBtn} onClick={() => { setSelectedAdherentId(null); setSelectedAdherentCotisations([]); }}>{t("backToList")}</button>
                {(() => {
                  const adherent = adherents.find((a) => a.id === selectedAdherentId);
                  if (!adherent) return <div style={styles.emptyState}><p>{t("memberNotFound")}</p></div>;
                  const roleBadgeLabel = adherent.poste ? adherent.poste.toUpperCase() : "MEMBRE";
                  const roleBadgeBg = adherent.poste && adherent.poste.toLowerCase().includes("président") ? "#8e44ad" : adherent.poste && adherent.poste.toLowerCase().includes("trésorier") ? "#27ae60" : adherent.poste && adherent.poste.toLowerCase().includes("secrétaire") ? "#e67e22" : "#3498db";
                  return (
                    <>
                      {/* ── Carte Hero ── */}
                      <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 8px 32px rgba(44,62,80,0.18)", marginBottom: "20px" }}>
                        {/* Bandeau gradient */}
                        <div style={{ background: "linear-gradient(135deg, #1a2742 0%, #2c3e50 50%, #1a6a9a 100%)", padding: "36px 32px 24px", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(52,152,219,0.15)" }} />
                          <div style={{ position: "absolute", bottom: "-50px", left: "-20px", width: "130px", height: "130px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", position: "relative", flexWrap: "wrap" }}>
                            {/* Avatar */}
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              {adherent.photo
                                ? <img src={adherent.photo} alt="Photo" style={{ width: "110px", height: "110px", borderRadius: "50%", objectFit: "cover", border: "4px solid #3498db", boxShadow: "0 4px 18px rgba(0,0,0,0.4)" }} />
                                : <div style={{ width: "110px", height: "110px", borderRadius: "50%", background: "linear-gradient(135deg,#34495e,#2c3e50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", border: "4px solid #3498db", boxShadow: "0 4px 18px rgba(0,0,0,0.4)" }}>👤</div>
                              }
                              <div style={{ position: "absolute", bottom: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "#27ae60", border: "3px solid white" }} title="Actif" />
                            </div>
                            {/* Infos */}
                            <div style={{ flex: 1, minWidth: "200px" }}>
                              <div style={{ color: "white", fontWeight: "800", fontSize: "26px", lineHeight: "1.2", textShadow: "0 1px 4px rgba(0,0,0,0.3)", textTransform: "uppercase" }}>
                                {adherent.nom} {adherent.prenom}
                              </div>
                              {adherent.matricule && (
                                <div style={{ display: "inline-block", background: "rgba(52,152,219,0.35)", color: "#a8d8f0", fontSize: "13px", fontWeight: "700", padding: "4px 12px", borderRadius: "12px", marginTop: "8px", border: "1px solid rgba(52,152,219,0.4)" }}>
                                  # {adherent.matricule}
                                </div>
                              )}
                              <div style={{ color: "#a0b9cc", fontSize: "13px", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Icon name="building" size={12} />{compte.nom_association}</div>
                            </div>
                            {/* Badge rôle */}
                            <div style={{ background: roleBadgeBg, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", letterSpacing: "1px", alignSelf: "flex-start", whiteSpace: "nowrap" }}>{roleBadgeLabel}</div>
                          </div>
                        </div>

                        {/* Boutons d'action */}
                        {(canActAsPresident || adherent.email === compte?.email) && (
                          <div style={{ background: "#fafbfc", padding: "12px 24px", display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid #f0f4f8" }}>
                            <button style={{ ...styles.addBtn, background: "#2563eb" }}
                              onClick={() => { setEditingIndex(adherents.findIndex((a) => a.id === selectedAdherentId)); setFormData({ ...adherent, photo: adherent.photo || "", photoName: adherent.photo ? "Photo existante" : "" }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); setSelectedAdherentId(null); }}>
                              <Icon name="edit" size={14} /> {t("editBtn")}
                            </button>
                            {canActAsTresorier && (
                              <button style={{ ...styles.addBtn, background: "#dc2626" }}
                                onClick={() => { setDeleteIndex(adherent.id); setShowDeleteConfirm(true); setSelectedAdherentId(null); }}>
                                <Icon name="trash" size={14} /> {t("deleteIconBtn")}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Corps — grille infos */}
                        <div style={{ background: "white", padding: "24px 28px 28px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            {[
                              { icon: "mail",  label: "Email", value: adherent.email || "—" },
                              { icon: "phone", label: lang === "fr" ? "Téléphone" : "Phone", value: adherent.telephone || "—" },
                              { icon: "clock", label: lang === "fr" ? "Date d'inscription" : "Registration date", value: adherent.date ? new Date(adherent.date).toLocaleDateString("fr-FR") : "—" },
                              { icon: "badge", label: "Matricule", value: adherent.matricule ? `# ${adherent.matricule}` : "—" },
                            ].map(({ icon, label, value }) => (
                              <div key={label} style={{ background: "#f7f9fc", borderRadius: "12px", padding: "16px 18px", border: "1px solid #e8edf3", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                <span style={{ marginTop: "2px", color: "#7f8c8d" }}><Icon name={icon} size={18} /></span>
                                <div>
                                  <div style={{ fontSize: "11px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>{label}</div>
                                  <div style={{ fontSize: "15px", color: "#2c3e50", fontWeight: "600", wordBreak: "break-all" }}>{value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── Section Désignation de Poste ── */}
                      {canAssignPoste && adherent.email !== compte?.email && (
                        <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(44,62,80,0.12)", background: "white", marginBottom: "20px" }}>
                          {/* En-tête */}
                          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)", padding: "18px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: "10px", padding: "9px", display: "flex" }}>
                              <Icon name="badge" size={20} style={{ color: "white" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: "700", color: "white", fontSize: "15px" }}>{lang === "fr" ? "Désignation de Poste" : "Role Assignment"}</div>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                                {lang === "fr" ? "Attribuez un rôle officiel à ce membre" : "Assign an official role to this member"}
                              </div>
                            </div>
                            {adherent.poste && (
                              <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", fontWeight: "700", color: "white", whiteSpace: "nowrap" }}>
                                {adherent.poste}
                              </div>
                            )}
                          </div>

                          {/* Corps */}
                          <div style={{ padding: "22px 28px" }}>
                            {/* Feedback */}
                            {fichePosteSuccess && (
                              <div style={{ background: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #bbf7d0" }}>
                                <Icon name="check-circle" size={14} style={{ flexShrink: 0 }} /> {fichePosteSuccess}
                              </div>
                            )}
                            {fichePosteError && (
                              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #fecaca" }}>
                                <Icon name="x-circle" size={14} style={{ flexShrink: 0 }} /> {fichePosteError}
                              </div>
                            )}

                            {/* Grille de cartes postes */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "9px", marginBottom: "18px" }}>
                              {[
                                { label: "Président(e)",           color: "#7c3aed", icon: "shield",       bg: "#f5f3ff" },
                                { label: "Vice-Président(e)",       color: "#1d4ed8", icon: "badge",        bg: "#eff6ff" },
                                { label: "Secrétaire Général(e)",   color: "#15803d", icon: "edit",         bg: "#f0fdf4" },
                                { label: "Secrétaire Adjoint(e)",   color: "#0e7490", icon: "edit",         bg: "#ecfeff" },
                                { label: "Trésorier(e)",            color: "#c2410c", icon: "dollar",       bg: "#fff7ed" },
                                { label: "Trésorier(e) Adjoint(e)", color: "#b45309", icon: "receipt",      bg: "#fffbeb" },
                                { label: "Commissaire aux comptes", color: "#b91c1c", icon: "check-circle", bg: "#fef2f2" },
                                { label: "Conseiller(e)",           color: "#475569", icon: "info",         bg: "#f8fafc" },
                              ].map(p => {
                                const sel = fichePosteSelected === p.label;
                                return (
                                  <button key={p.label} onClick={() => setFichePosteSelected(sel ? "" : p.label)} style={{
                                    padding: "10px 12px", border: `2px solid ${sel ? p.color : "#e2e8f0"}`,
                                    borderRadius: "11px", background: sel ? p.bg : "white",
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: "9px",
                                    textAlign: "left", transition: "all 0.15s ease",
                                    boxShadow: sel ? `0 0 0 3px ${p.color}22` : "none",
                                  }}>
                                    <div style={{ background: sel ? p.color : "#e2e8f0", borderRadius: "7px", padding: "5px", display: "flex", color: sel ? "white" : "#94a3b8", flexShrink: 0 }}>
                                      <Icon name={p.icon} size={13} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: sel ? p.color : "#334155", flex: 1, lineHeight: "1.3" }}>{p.label}</span>
                                    {sel && <Icon name="check" size={12} style={{ color: p.color, flexShrink: 0 }} />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Bouton retirer + confirmer */}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                              {adherent.poste && (
                                <button
                                  disabled={fichePosteLoading}
                                  onClick={async () => {
                                    setFichePosteError(""); setFichePosteSuccess(""); setFichePosteLoading(true);
                                    try {
                                      const r = await apiFetch(`${API_BASE}/adherents/${adherent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: adherent.nom, prenom: adherent.prenom, telephone: adherent.telephone || null, email: adherent.email || null, poste: null }) });
                                      if (!r.ok) { const d = await r.json(); setFichePosteError(d.error || (lang === "fr" ? "Erreur." : "Error.")); return; }
                                      setAdherents(prev => prev.map(a => a.id === adherent.id ? { ...a, poste: null } : a));
                                      setFichePosteSelected(""); setFichePosteSuccess(lang === "fr" ? "Poste retiré." : "Role removed.");
                                    } catch { setFichePosteError(lang === "fr" ? "Erreur réseau." : "Network error."); }
                                    finally { setFichePosteLoading(false); }
                                  }}
                                  style={{ padding: "9px 18px", background: "white", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: "9px", fontSize: "13px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Icon name="x-circle" size={13} /> {lang === "fr" ? "Retirer le poste" : "Remove role"}
                                </button>
                              )}
                              <button
                                disabled={fichePosteLoading || !fichePosteSelected}
                                onClick={async () => {
                                  setFichePosteError(""); setFichePosteSuccess(""); setFichePosteLoading(true);
                                  try {
                                    const r = await apiFetch(`${API_BASE}/adherents/${adherent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: adherent.nom, prenom: adherent.prenom, telephone: adherent.telephone || null, email: adherent.email || null, poste: fichePosteSelected }) });
                                    if (!r.ok) { const d = await r.json(); setFichePosteError(d.error || (lang === "fr" ? "Erreur." : "Error.")); return; }
                                    setAdherents(prev => prev.map(a => a.id === adherent.id ? { ...a, poste: fichePosteSelected } : a));
                                    setFichePosteSuccess(lang === "fr" ? `Poste "${fichePosteSelected}" attribué avec succès !` : `Role "${fichePosteSelected}" assigned!`);
                                  } catch { setFichePosteError(lang === "fr" ? "Erreur réseau." : "Network error."); }
                                  finally { setFichePosteLoading(false); }
                                }}
                                style={{
                                  padding: "9px 22px",
                                  background: fichePosteLoading || !fichePosteSelected ? "#cbd5e1" : "linear-gradient(135deg, #1a1a2e, #0f3460)",
                                  color: "white", border: "none", borderRadius: "9px", fontSize: "13px",
                                  cursor: fichePosteLoading || !fichePosteSelected ? "not-allowed" : "pointer",
                                  fontWeight: "700", display: "flex", alignItems: "center", gap: "7px",
                                  boxShadow: fichePosteLoading || !fichePosteSelected ? "none" : "0 4px 12px rgba(15,52,96,0.3)",
                                }}>
                                <Icon name="badge" size={13} />
                                {fichePosteLoading ? (lang === "fr" ? "Attribution…" : "Assigning…") : (lang === "fr" ? "Attribuer ce poste" : "Assign this role")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Section Cotisations ── */}
                      <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(44,62,80,0.12)", background: "white" }}>
                        <div style={{ background: "linear-gradient(135deg,#e8f4fd,#dff0fb)", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #bee3f8" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "linear-gradient(135deg,#3498db,#2980b9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="dollar" size={22} style={{ color: "white" }} /></div>
                            <div>
                              <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>{lang === "fr" ? "Cotisations" : "Contributions"}</div>
                              <div style={{ color: "#7f8c8d", fontSize: "12px" }}>{lang === "fr" ? "Historique des paiements" : "Payment history"}</div>
                            </div>
                          </div>
                          {selectedAdherentCotisations.length === 0 && !selectedAdherentCotisationsLoading && (
                            <button style={{ padding: "8px 18px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                              onClick={() => loadAdherentCotisations(adherent.id)}>
                              {lang === "fr" ? "Charger" : "Load"}
                            </button>
                          )}
                        </div>
                        <div style={{ padding: "20px 28px 24px" }}>
                          {selectedAdherentCotisationsLoading ? (
                            <div style={{ textAlign: "center", color: "#7f8c8d", padding: "20px" }}>⏳ {lang === "fr" ? "Chargement…" : "Loading…"}</div>
                          ) : selectedAdherentCotisations.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#95a5a6", padding: "20px", fontSize: "14px" }}>
                              📭 {lang === "fr" ? "Aucune cotisation enregistrée pour ce membre." : "No contributions recorded for this member."}
                            </div>
                          ) : (
                            <>
                              {/* Stats rapides */}
                              {(() => {
                                const payes = selectedAdherentCotisations.filter(c => c.statut === "Payé").length;
                                const partiels = selectedAdherentCotisations.filter(c => c.statut === "Partiel").length;
                                const impayes = selectedAdherentCotisations.filter(c => c.statut === "Impayé").length;
                                return (
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
                                    {[
                                      { label: lang === "fr" ? "Payées" : "Paid", count: payes, color: "#27ae60", bg: "#d5f5e3", icon: "✅" },
                                      { label: lang === "fr" ? "Partielles" : "Partial", count: partiels, color: "#f39c12", bg: "#fef9e7", icon: "⏳" },
                                      { label: lang === "fr" ? "Impayées" : "Unpaid", count: impayes, color: "#e74c3c", bg: "#fdecea", icon: "❌" },
                                    ].map(({ label, count, color, bg, icon }) => (
                                      <div key={label} style={{ background: bg, borderRadius: "12px", padding: "14px", textAlign: "center", border: `1px solid ${color}33` }}>
                                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
                                        <div style={{ fontSize: "22px", fontWeight: "800", color }}>{count}</div>
                                        <div style={{ fontSize: "11px", color, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                              {/* Liste */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {selectedAdherentCotisations.map((c, i) => {
                                  const statColor = c.statut === "Payé" ? "#27ae60" : c.statut === "Partiel" ? "#f39c12" : "#e74c3c";
                                  const statBg = c.statut === "Payé" ? "#d5f5e3" : c.statut === "Partiel" ? "#fef9e7" : "#fdecea";
                                  const statLabel = c.statut === "Payé" ? (lang === "fr" ? "Payé" : "Paid") : c.statut === "Partiel" ? (lang === "fr" ? "Partiel" : "Partial") : (lang === "fr" ? "Impayé" : "Unpaid");
                                  return (
                                    <div key={i} style={{ background: "#f9fbfd", borderRadius: "12px", padding: "16px 20px", border: `2px solid ${statColor}33` }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                        <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{c.periode}</div>
                                        <span style={{ background: statColor, color: "white", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{statLabel}</span>
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                                        {[
                                          { label: lang === "fr" ? "Montant dû" : "Due", value: c.montantDu, color: "#2c3e50" },
                                          { label: lang === "fr" ? "Payé" : "Paid", value: c.soldePaye, color: "#27ae60" },
                                          { label: lang === "fr" ? "Reste" : "Remaining", value: c.reste, color: "#e74c3c" },
                                        ].map(({ label, value, color }) => (
                                          <div key={label} style={{ background: "white", borderRadius: "8px", padding: "10px 12px", textAlign: "center", border: "1px solid #e8edf3" }}>
                                            <div style={{ fontSize: "10px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                                            <div style={{ fontSize: "14px", fontWeight: "800", color }}>{value}</div>
                                          </div>
                                        ))}
                                      </div>
                                      {c.dernierPaiement && (
                                        <div style={{ fontSize: "11px", color: "#95a5a6", marginTop: "8px", textAlign: "right" }}>
                                          🕐 {lang === "fr" ? "Dernier paiement :" : "Last payment:"} {c.dernierPaiement}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── COTISATIONS ─────────────────────────────────────── */}
        {page === "cotisations" && (
          <div>
            {/* ── En-tête moderne ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", color: "#2c3e50", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon name="dollar" size={22} /> {t("cotisationsTitle")}
                </h1>
                <p style={{ margin: "5px 0 0", color: "#7f8c8d", fontSize: "14px" }}>
                  {periodes.length} {lang === "fr" ? "période(s) configurée(s)" : "configured period(s)"}
                </p>
              </div>
              {canActAsTresorier && (
                <button
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "linear-gradient(135deg, #3498db, #2980b9)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 12px rgba(52,152,219,0.35)", transition: "all 0.2s" }}
                  onClick={() => { setCotisationFormData({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" }); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowCotisationForm(true); }}
                >
                  <Icon name="dollar" size={14} /> {t("newContributionBtn")}
                </button>
              )}
            </div>

            {apiError && (
              <div style={styles.errorMessage}>
                {apiError}
                <button style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: "#b02a2a" }} onClick={() => setApiError("")}>✕</button>
              </div>
            )}

            {/* ── Popup succès paiement ── */}
            {showSuccessMessage && (
              <div style={styles.modalOverlay}>
                <div style={{ background: "white", borderRadius: "14px", width: "380px", maxWidth: "95vw", padding: "36px 30px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", textAlign: "center" }}>
                  <div style={{ fontSize: "52px", marginBottom: "12px" }}>✅</div>
                  <h2 style={{ margin: "0 0 8px", color: "#27ae60", fontSize: "20px" }}>{t("paymentSuccess")}</h2>
                  {lastPaiement && (
                    <p style={{ color: "#7f8c8d", fontSize: "14px", margin: "0 0 8px" }}>
                      {lastPaiement.nom} {lastPaiement.prenom}
                    </p>
                  )}
                  {lastPaiement && (
                    <p style={{ color: "#2c3e50", fontSize: "15px", fontWeight: "bold", margin: "0 0 22px" }}>
                      {t("amountPaidLabel2")} <span style={{ color: "#27ae60" }}>{lastPaiement.montantPaye}</span>
                    </p>
                  )}
                  <p style={{ color: "#2c3e50", marginBottom: "20px", fontSize: "14px" }}>{t("generateReceiptQ")}</p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button
                      style={{ padding: "10px 22px", background: "#2980b9", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                      onClick={() => { setShowRecu(true); setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                    >
                      {t("generateReceiptBtn")}
                    </button>
                    <button
                      style={{ padding: "10px 18px", background: "transparent", color: "#7f8c8d", border: "1px solid #bdc3c7", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                      onClick={() => { setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                    >
                      {t("noThanks")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal nouvelle cotisation */}
            {showCotisationForm && (
              <div style={styles.modalOverlay}>
                <div ref={modalRef} style={{ ...styles.modal, ...modalPos }} className="modal-box" onMouseDown={dragProps}>
                  <h2>{t("newContributionTitle")}</h2>
                  <div style={styles.formRow}>
                    <label style={styles.label}>{t("amountDue")}</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cotisationFormData.montantDu}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setCotisationFormData({ ...cotisationFormData, montantDu: val });
                      }}
                      placeholder="Ex. 10000"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>{t("contributionPeriod")}</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={cotisationFormData.mois}
                        onChange={(e) => {
                          const mois = e.target.value;
                          const periode = mois && cotisationFormData.annee ? `${mois} ${cotisationFormData.annee}` : "";
                          setCotisationFormData({ ...cotisationFormData, mois, periode });
                        }}
                        style={{ ...styles.input, flex: 1 }}
                      >
                        <option value="">{t("monthPlaceholder")}</option>
                        {FR_MOIS.map((mFr, i) => (
                          <option key={mFr} value={mFr}>{MOIS_LISTE[i]}</option>
                        ))}
                      </select>
                      <select
                        value={cotisationFormData.annee}
                        onChange={(e) => {
                          const annee = e.target.value;
                          const periode = cotisationFormData.mois && annee ? `${cotisationFormData.mois} ${annee}` : "";
                          setCotisationFormData({ ...cotisationFormData, annee, periode });
                        }}
                        style={{ ...styles.input, width: "90px", flex: "0 0 90px" }}
                      >
                        {ANNEES_LISTE.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {cotisationFormData.periode && (
                    <div style={{ textAlign: "center", fontSize: "13px", color: "#7f8c8d", marginBottom: "8px" }}>
                      {t("periodPreview")} <strong style={{ color: "#2c3e50" }}>{periodeLabel(cotisationFormData.periode)}</strong>
                    </div>
                  )}
                  <div style={styles.modalButtons}>
                    <button style={styles.addBtn} onClick={handleSaveCotisation}>{t("save")}</button>
                    <button style={styles.cancelBtn} onClick={() => { setShowCotisationForm(false); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); }}>{t("cancel")}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sélecteur de période + boutons ── */}
            {periodes.length > 0 && (
              <div>
                <div style={{ background: "white", borderRadius: "14px", padding: "14px 20px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1px solid #e8ecf0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon name="list" size={17} style={{ color: "#7f8c8d" }} />
                    <label style={{ color: "#7f8c8d", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>
                      {lang === "fr" ? "Période :" : "Period:"}
                    </label>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <select
                        value={selectedPeriode || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPeriode(val || null);
                          setSelectedStatutFilter("tous");
                          setCotisationSearchTerm("");
                          setShowAddPaiementForm(false);
                          setShowSuccessMessage(false);
                          setShowRecuPrompt(false);
                        }}
                        style={{
                          padding: "9px 40px 9px 16px",
                          background: "linear-gradient(135deg, #2c3e50, #34495e)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          minWidth: "200px",
                          outline: "none",
                        }}
                      >
                        {periodes.map((p, i) => (
                          <option key={i} value={p.libelle} style={{ background: "white", color: "#2c3e50" }}>
                            {periodeLabel(p.libelle)}
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "white", fontSize: "11px" }}>▼</span>
                    </div>
                  </div>
                  {selectedPeriode && selectedPeriodeObj && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {canActAsTresorier && (
                        <button
                          style={{ ...styles.addBtn, background: "#7c3aed" }}
                          onClick={() => { setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" }); setSelectedAdherentForPayment(null); setShowAddPaiementForm(true); setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                        >
                          <Icon name="plus" size={14} /> {t("addPaymentBtn")}
                        </button>
                      )}
                      <button
                        style={{ ...styles.addBtn, background: "#16a34a" }}
                        onClick={() => {
                          const rawEligibleExport = selectedPeriodeObj.eligibleAdherentIds;
                          const eligibleSetExport = rawEligibleExport != null
                            ? new Set(rawEligibleExport)
                            : new Set(adherents.map((a) => a.id));
                          const l = selectedPeriodeObj.paiements || [];
                          const ids = new Set(l.map((p) => p.adherent_id));
                          const sp = adherents.filter((a) => !ids.has(a.id) && eligibleSetExport.has(a.id)).map((a) => ({
                            adherent_id: a.id, matricule: a.matricule||"-", nom: a.nom, prenom: a.prenom,
                            telephone: a.telephone||"-", email: a.email||"-",
                            soldePaye: formatAmount(0), reste: formatAmount(parseAmount(selectedPeriodeObj.montantDu)), statut: "Impayé",
                          }));
                          exportPeriodeExcel([...l, ...sp], selectedPeriode, selectedPeriodeObj);
                        }}
                      >
                        <Icon name="download" size={14} /> {t("exportExcel")}
                      </button>
                      {canActAsTresorier && (
                        <button
                          style={{ ...styles.addBtn, background: "#2563eb" }}
                          onClick={() => { setRappelResult(null); setShowRappelModal(true); }}
                        >
                          <Icon name="mail" size={14} /> {lang === "fr" ? "Rappels" : "Reminders"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Modal rappels email */}
                  {showRappelModal && selectedPeriode && (
                    <div style={styles.modalOverlay} onClick={() => { if (!rappelLoading) setShowRappelModal(false); }}>
                      <div style={{ background: "white", borderRadius: "14px", padding: "32px 28px", width: "420px", maxWidth: "94vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        {!rappelResult ? (
                          <>
                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📧</div>
                            <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: "#2c3e50" }}>
                              {lang === "fr" ? "Envoyer des rappels" : "Send reminders"}
                            </h2>
                            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#7f8c8d", lineHeight: "1.6" }}>
                              {lang === "fr"
                                ? `Un email de rappel sera envoyé à tous les adhérents avec cotisation impayée ou partielle pour la période « ${periodeLabel(selectedPeriode)} ».`
                                : `A reminder email will be sent to all members with unpaid or partial contributions for the period « ${periodeLabel(selectedPeriode)} ».`}
                            </p>
                            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#e67e22", background: "#fff8f0", borderRadius: "8px", padding: "10px 14px" }}>
                              ⚠️ {lang === "fr" ? "Seuls les adhérents ayant un email renseigné recevront le message." : "Only members with a registered email will receive the message."}
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                              <button onClick={() => handleEnvoyerRappels(selectedPeriode)} disabled={rappelLoading}
                                style={{ padding: "11px 26px", background: "#2980b9", color: "white", border: "none", borderRadius: "8px", cursor: rappelLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px", opacity: rappelLoading ? 0.7 : 1, flex: 1 }}>
                                {rappelLoading ? (lang === "fr" ? "Envoi en cours…" : "Sending…") : (lang === "fr" ? "Confirmer l'envoi" : "Confirm send")}
                              </button>
                              <button onClick={() => setShowRappelModal(false)} disabled={rappelLoading}
                                style={{ padding: "11px 20px", background: "none", color: "#7f8c8d", border: "1.5px solid #e0e6ed", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                                {lang === "fr" ? "Annuler" : "Cancel"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "52px", marginBottom: "12px" }}>{rappelResult.ok ? "✅" : "❌"}</div>
                            <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: rappelResult.ok ? "#27ae60" : "#e74c3c" }}>
                              {rappelResult.ok ? (lang === "fr" ? "Rappels envoyés !" : "Reminders sent!") : (lang === "fr" ? "Erreur" : "Error")}
                            </h2>
                            {rappelResult.ok ? (
                              <div style={{ margin: "0 0 22px" }}>
                                <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "10px" }}>
                                  <div style={{ textAlign: "center", background: "#eaf4fb", borderRadius: "10px", padding: "12px 20px", minWidth: "100px" }}>
                                    <div style={{ marginBottom: "4px", color: "#2980b9" }}><Icon name="mail" size={22} /></div>
                                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#2980b9" }}>{rappelResult.emails ?? rappelResult.envoyes ?? 0}</div>
                                    <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{lang === "fr" ? "email(s)" : "email(s)"}</div>
                                  </div>
                                </div>
                                {rappelResult.ignores > 0 && (
                                  <p style={{ fontSize: "13px", color: "#e74c3c", margin: "6px 0 0" }}>
                                    {rappelResult.ignores} {lang === "fr" ? "échec(s)" : "failure(s)"}
                                  </p>
                                )}
                                {(rappelResult.emails ?? rappelResult.envoyes ?? 0) === 0 && (
                                  <p style={{ fontSize: "13px", color: "#7f8c8d", margin: "8px 0 0" }}>
                                    {lang === "fr" ? "Aucun adhérent impayé avec email trouvé." : "No unpaid member with email found."}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p style={{ fontSize: "14px", color: "#7f8c8d", margin: "0 0 22px" }}>{rappelResult.error || rappelResult.message}</p>
                            )}
                            <button onClick={() => setShowRappelModal(false)}
                              style={{ padding: "11px 30px", background: "#2c3e50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                              {lang === "fr" ? "Fermer" : "Close"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedPeriode && selectedPeriodeObj && (() => {
                  // Éligibilité fournie par le serveur en SQL.
                  // Si le champ est absent (serveur non redémarré), tous les adhérents sont affichés.
                  const rawEligible = selectedPeriodeObj.eligibleAdherentIds;
                  const eligibleSet = rawEligible != null
                    ? new Set(rawEligible)
                    : new Set(adherents.map((a) => a.id));

                  // Les paiements sont déjà filtrés par le serveur (seuls les éligibles)
                  const liste = selectedPeriodeObj.paiements || [];

                  // Adhérents éligibles sans aucun enregistrement de paiement → Impayés réels
                  const idAvecPaiement = new Set(liste.map((p) => p.adherent_id));
                  const sansPaiement = adherents
                    .filter((a) => !idAvecPaiement.has(a.id) && eligibleSet.has(a.id))
                    .map((a) => ({
                      adherent_id: a.id,
                      matricule: a.matricule || "-",
                      nom: a.nom,
                      prenom: a.prenom,
                      telephone: a.telephone || "-",
                      email: a.email || "-",
                      soldePaye: formatAmount(0),
                      reste: formatAmount(parseAmount(selectedPeriodeObj.montantDu)),
                      statut: "Impayé",
                    }));

                  // Compteurs corrects (tous les adhérents pris en compte)
                  const nbPaye   = liste.filter((p) => p.statut === "Payé").length;
                  const nbPartiel = liste.filter((p) => p.statut === "Partiel").length;
                  const nbImpaye = liste.filter((p) => p.statut === "Impayé").length + sansPaiement.length;

                  const duParPersonne = parseAmount(selectedPeriodeObj.montantDu);
                  const totalCollecte = liste.reduce((sum, p) => sum + parseAmount(p.soldePaye), 0);
                  const totalPeriode = liste.length + sansPaiement.length;
                  const totalDu = duParPersonne * totalPeriode;
                  const resteACollecter = Math.max(totalDu - totalCollecte, 0);
                  const pct = totalDu > 0 ? Math.min((totalCollecte / totalDu) * 100, 100) : 0;
                  const barColor = pct >= 100 ? "#27ae60" : pct >= 50 ? "#f39c12" : "#3498db";
                  const nbPayeComplet = liste.filter((p) => p.statut === "Payé").length;

                  // Liste filtrée par statut puis par recherche
                  const filtresBase =
                    selectedStatutFilter === "tous"
                      ? [...liste, ...sansPaiement]
                      : selectedStatutFilter === "Impayé"
                      ? [...liste.filter((p) => p.statut === "Impayé"), ...sansPaiement]
                      : liste.filter((p) => p.statut === selectedStatutFilter);

                  const filtres = cotisationSearchTerm
                    ? filtresBase.filter((c) => {
                        const q = cotisationSearchTerm.toLowerCase();
                        return (
                          (c.nom && c.nom.toLowerCase().includes(q)) ||
                          (c.prenom && c.prenom.toLowerCase().includes(q)) ||
                          (c.matricule && c.matricule.toLowerCase().includes(q)) ||
                          (c.email && c.email.toLowerCase().includes(q)) ||
                          (c.telephone && c.telephone.toLowerCase().includes(q))
                        );
                      })
                    : filtresBase;

                  return (
                    <div>
                      {/* ── Cartes stats style dashboard – pleine largeur navbar ── */}
                      <div style={{ margin: "-4px -20px 0", padding: "12px 20px 14px", background: "#f0f4f8" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                          {[
                            { label: lang === "fr" ? "Montant dû"         : "Amount due",          value: formatAmount(duParPersonne),               grad: "linear-gradient(135deg,#1a3a5c,#1e6fa8)", icon: "dollar",         shadow: "#1e6fa844" },
                            { label: t("collectedAmount"),                                           value: formatAmount(totalCollecte),               grad: "linear-gradient(135deg,#145a32,#1e8449)", icon: "check-circle",  shadow: "#1e844944" },
                            { label: t("expectedTotal"),                                             value: formatAmount(totalDu),                     grad: "linear-gradient(135deg,#154360,#1a5276)", icon: "trending-up",   shadow: "#1a527644" },
                            { label: t("remainingToCollect"),                                        value: formatAmount(resteACollecter),             grad: "linear-gradient(135deg,#641e16,#c0392b)", icon: "alert-triangle",shadow: "#c0392b44" },
                            { label: t("fullPayers"),                                                value: `${nbPayeComplet} / ${totalPeriode}`,      grad: "linear-gradient(135deg,#4a235a,#7d3c98)", icon: "users",         shadow: "#7d3c9844" },
                          ].map(({ label, value, grad, icon, shadow }) => (
                            <div key={label} style={{ background: grad, borderRadius: "14px", padding: "14px 16px", boxShadow: `0 4px 18px ${shadow}`, display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden" }}>
                              <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.08 }}>
                                <Icon name={icon} size={64} style={{ color: "white" }} />
                              </div>
                              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
                                <Icon name={icon} size={15} style={{ color: "white" }} />
                              </div>
                              <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{label}</div>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: "white", lineHeight: 1 }}>{value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Barre de progression ── */}
                      <div style={{ background: "white", border: "1px solid #e8ecf0", borderRadius: "12px", padding: "12px 18px", marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#7f8c8d", marginBottom: "7px", fontWeight: "600" }}>
                          <span>{t("collectionProgress")}</span>
                          <strong style={{ color: barColor }}>{pct.toFixed(1)} %</strong>
                        </div>
                        <div style={{ background: "#e8ecf0", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`, borderRadius: "10px", transition: "width 0.7s ease" }} />
                        </div>
                      </div>

                      {/* ── Demandes Mobile Money en attente ── */}
                      {(() => {
                        const all = demandesPaiement;
                        if (!canActAsTresorier || all.length === 0) return null;
                        return (
                          <div style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: "12px", padding: "16px 18px", marginBottom: "18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: "700", color: "#b45309", fontSize: "14px" }}>
                              <Icon name="clock" size={15} /> {lang === "fr" ? `${all.length} demande${all.length > 1 ? "s" : ""} Mobile Money en attente de validation` : `${all.length} pending Mobile Money payment${all.length > 1 ? "s" : ""}`}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {all.map((d) => (
                                <div key={d.id} style={{ background: "white", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                                  <div>
                                    <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{d.prenom} {d.nom} <span style={{ color: "#94a3b8", fontSize: "12px" }}>({d.matricule})</span></div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                      {d.periode} — <strong style={{ color: "#b45309" }}>{Number(d.montant).toLocaleString("fr-FR")} F</strong>
                                      {d.operateur && <> · <span style={{ fontWeight: "700", color: d.operateur === "Wave" ? "#009BDB" : d.operateur === "Orange Money" ? "#FF6600" : "#f59e0b" }}>{d.operateur}</span></>}
                                      {d.numero_transaction && <> · Réf. {d.numero_transaction}</>}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{new Date(d.date_demande).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                      onClick={async () => {
                                        const r = await apiFetch(`${API_BASE}/demandes-paiement/${d.id}/approuver`, { method: "PUT" });
                                        if (r.ok) { await Promise.all([loadDemandesPaiement(), loadPeriodes(selectedPeriode)]); }
                                        else { const e = await r.json(); alert(e.error || "Erreur"); }
                                      }}
                                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                                      <Icon name="check-circle" size={13} /> {lang === "fr" ? "Approuver" : "Approve"}
                                    </button>
                                    <button
                                      onClick={() => { setRejectModalId(d.id); setRejectNote(""); }}
                                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                                      <Icon name="trash" size={13} /> {lang === "fr" ? "Rejeter" : "Reject"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Modal refus */}
                      {rejectModalId && (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
                             onClick={() => setRejectModalId(null)}>
                          <div style={{ background: "white", borderRadius: "14px", padding: "24px", width: "100%", maxWidth: "380px" }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ margin: "0 0 14px", fontSize: "16px", color: "#1e293b" }}>{lang === "fr" ? "Motif du refus (optionnel)" : "Rejection reason (optional)"}</h3>
                            <input
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder={lang === "fr" ? "Ex. : Numéro de transaction incorrect" : "E.g.: Wrong transaction number"}
                              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "14px", boxSizing: "border-box", marginBottom: "16px" }}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                onClick={async () => {
                                  const r = await apiFetch(`${API_BASE}/demandes-paiement/${rejectModalId}/rejeter`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note_refus: rejectNote }) });
                                  if (r.ok) { await loadDemandesPaiement(); setRejectModalId(null); }
                                  else { const e = await r.json(); alert(e.error || "Erreur"); }
                                }}
                                style={{ flex: 1, padding: "10px", background: "#dc2626", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                                {lang === "fr" ? "Confirmer le refus" : "Confirm rejection"}
                              </button>
                              <button onClick={() => setRejectModalId(null)}
                                style={{ padding: "10px 16px", background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: "9px", cursor: "pointer", fontWeight: "600" }}>
                                {lang === "fr" ? "Annuler" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Filtres chips + recherche sur une ligne ── */}
                      {(() => {
                        const total = nbPaye + nbPartiel + nbImpaye;
                        const tabs = [
                          { val: "tous",    label: t("filterAll"),     color: "#5a6a7a", count: total },
                          { val: "Payé",    label: t("filterPaid"),    color: "#27ae60", count: nbPaye },
                          { val: "Impayé",  label: t("filterUnpaid"),  color: "#e74c3c", count: nbImpaye },
                          { val: "Partiel", label: t("filterPartial"), color: "#f39c12", count: nbPartiel },
                        ];
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                            {tabs.map(({ val, label, color, count }) => {
                              const active = selectedStatutFilter === val;
                              return (
                                <button key={val} onClick={() => setSelectedStatutFilter(val)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: active ? color : "white", color: active ? "white" : "#5a6a7a", border: `1.5px solid ${active ? color : "#d1d5db"}`, borderRadius: "20px", cursor: "pointer", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}>
                                  {label}
                                  <span style={{ background: active ? "rgba(255,255,255,0.25)" : "#f0f2f5", color: active ? "white" : "#5a6a7a", borderRadius: "10px", padding: "0 5px", fontSize: "10px", fontWeight: "800", lineHeight: "16px" }}>{count}</span>
                                </button>
                              );
                            })}
                            <div style={{ position: "relative", flex: 1 }}>
                              <Icon name="list" size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aab" }} />
                              <input
                                type="text"
                                placeholder={lang === "fr" ? "Rechercher un membre…" : "Search member…"}
                                value={cotisationSearchTerm}
                                onChange={(e) => setCotisationSearchTerm(e.target.value)}
                                style={{ width: "100%", padding: "7px 12px 7px 36px", border: "1.5px solid #e0e6ed", borderRadius: "9px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Modal ajouter un paiement */}
                      {showAddPaiementForm && selectedPeriodeObj && (
                        <div style={styles.modalOverlay}>
                          <div className="modal-box" style={{ ...styles.modal, position: "relative", top: "auto", left: "auto", transform: "none", cursor: "default", minWidth: "unset" }}>
                            <h2>{t("addPaymentTitle")}</h2>
                            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 16px" }}>
                              {t("periodPreview")} <strong>{periodeLabel(selectedPeriode)}</strong> — {t("amountDue")}{" "}
                              <strong>{selectedPeriodeObj.montantDu} F</strong>
                            </p>

                            {/* Sélection de l'adhérent */}
                            <div style={styles.formRow}>
                              <label style={styles.label}>{t("members")} :</label>
                              <select
                                value={addPaiementFormData.adherentId}
                                onChange={(e) => {
                                  const id = Number(e.target.value);
                                  const found = adherents.find((a) => a.id === id);
                                  setAddPaiementFormData({ ...addPaiementFormData, adherentId: e.target.value });
                                  setSelectedAdherentForPayment(found || null);
                                }}
                                style={styles.input}
                              >
                                <option value="">{t("selectMember")}</option>
                                {adherents.filter((a) => eligibleSet.has(a.id)).map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nom} {a.prenom}{a.matricule ? ` (${a.matricule})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Montant payé — chiffres uniquement */}
                            <div style={styles.formRow}>
                              <label style={styles.label}>{t("amountPaidInput")}</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={addPaiementFormData.montantPaye}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  setAddPaiementFormData({ ...addPaiementFormData, montantPaye: val });
                                }}
                                placeholder="Ex. 6000"
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.formRow}>
                              <label style={styles.label}>{t("paymentMethodLabel")}</label>
                              {/* Niveau 1 : Espèces | Mobile Money */}
                              {(() => {
                                const isMM = ["Orange Money", "Wave", "MTN MoMo"].includes(addPaiementFormData.modePaiement);
                                return (
                                  <>
                                    <div className="mm-main-options">
                                      <button type="button"
                                        className={`mm-main-btn${addPaiementFormData.modePaiement === "Espèces" ? " mm-main-btn--cash-active" : ""}`}
                                        onClick={() => setAddPaiementFormData({ ...addPaiementFormData, modePaiement: "Espèces" })}>
                                        <span style={{ fontWeight: "700", fontSize: "13px", color: addPaiementFormData.modePaiement === "Espèces" ? "#15803d" : "#374151" }}>Espèces</span>
                                        {addPaiementFormData.modePaiement === "Espèces" && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: "14px" }}>✓</span>}
                                      </button>
                                      <button type="button"
                                        className={`mm-main-btn${isMM ? " mm-main-btn--mobile-active" : ""}`}
                                        onClick={() => { if (!isMM) setAddPaiementFormData({ ...addPaiementFormData, modePaiement: "Wave" }); }}>
                                        <span style={{ fontWeight: "700", fontSize: "13px", color: isMM ? "#6d28d9" : "#374151" }}>Mobile Money</span>
                                        {isMM && <span style={{ marginLeft: "auto", color: "#8b5cf6", fontSize: "14px" }}>✓</span>}
                                      </button>
                                    </div>
                                    {isMM && (
                                      <div className="mm-dropdown-panel">
                                        <div style={{ display: "flex", gap: "8px" }}>
                                          {[
                                            { value: "Wave",         img: imgWave,   cls: "mm-op-btn--wave-active" },
                                            { value: "Orange Money", img: imgOrange, cls: "mm-op-btn--om-active"   },
                                            { value: "MTN MoMo",    img: imgMTN,    cls: "mm-op-btn--mtn-active"  },
                                          ].map(({ value, img, cls }) => {
                                            const sel = addPaiementFormData.modePaiement === value;
                                            return (
                                              <button key={value} type="button"
                                                className={`mm-op-btn${sel ? ` ${cls}` : ""}`}
                                                onClick={() => setAddPaiementFormData({ ...addPaiementFormData, modePaiement: value })}>
                                                <img src={img} alt={value} style={{ height: "18px", width: "auto", maxWidth: "50px", objectFit: "contain", display: "block" }} />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Aperçu du calcul */}
                            {addPaiementFormData.montantPaye && selectedAdherentForPayment && (
                              <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "8px", padding: "12px", marginBottom: "14px", fontSize: "14px" }}>
                                {(() => {
                                  const d = parseAmount(selectedPeriodeObj.montantDu);
                                  const existing = selectedPeriodeObj.paiements.find(
                                    (pay) => pay.adherent_id === selectedAdherentForPayment.id
                                  );
                                  const deja = existing ? parseAmount(existing.soldePaye) : 0;
                                  const p = Number(addPaiementFormData.montantPaye) || 0;
                                  const total = deja + p;
                                  const r = Math.max(d - total, 0);
                                  const s = total === 0 ? "Impayé" : r <= 0 ? "Payé" : "Partiel";
                                  const depasse = p > d - deja;
                                  return (
                                    <>
                                      {depasse && (
                                        <div style={{ color: "#e74c3c", fontWeight: "bold", marginBottom: "8px", background: "#fdecea", padding: "8px", borderRadius: "6px" }}>
                                          {t("amountExceedsRemaining")} ({formatAmount(d - deja)})
                                        </div>
                                      )}
                                      <div style={styles.calcRow}><span>{t("amountDueRow")}</span><strong>{formatAmount(d)}</strong></div>
                                      <div style={styles.calcRow}><span>{t("alreadyPaidRow")}</span><strong style={{ color: "#7f8c8d" }}>{formatAmount(deja)}</strong></div>
                                      <div style={styles.calcRow}><span>{t("thisPaymentRow")}</span><strong style={{ color: "#27ae60" }}>{formatAmount(p)}</strong></div>
                                      <div style={{ ...styles.calcRow, borderTop: "1px solid #e0e6ed", paddingTop: "8px", marginTop: "4px" }}>
                                        <span>{t("totalPaidRow")}</span><strong style={{ color: "#2980b9" }}>{formatAmount(total)}</strong>
                                      </div>
                                      <div style={styles.calcRow}><span>{t("remainingToPayRow")}</span><strong style={{ color: "#e74c3c" }}>{formatAmount(r)}</strong></div>
                                      <div style={styles.calcRow}><span>{t("statusRow")}</span><strong style={{ color: statutColor(s) }}>{s === "Payé" ? t("statusPaid") : s === "Partiel" ? t("statusPartial") : t("statusUnpaid")}</strong></div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {addPaiementError && (
                              <div style={{ background: "#fdecea", color: "#c0392b", border: "1px solid #f5b7b1", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <span style={{ flexShrink: 0, fontWeight: "700" }}>⚠️</span>
                                <span>{addPaiementError}</span>
                              </div>
                            )}
                            <div style={styles.modalButtons}>
                              <button
                                style={{ ...styles.addBtn, background: addPaiementSaving ? "#95a5a6" : "#0daf3e", cursor: addPaiementSaving ? "not-allowed" : "pointer", opacity: addPaiementSaving ? 0.8 : 1 }}
                                onClick={handleSaveAddPaiement}
                                disabled={addPaiementSaving}
                              >
                                {addPaiementSaving ? (lang === "fr" ? "Enregistrement…" : "Saving…") : t("pay")}
                              </button>
                              <button style={styles.cancelBtn} onClick={() => { setShowAddPaiementForm(false); setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" }); setSelectedAdherentForPayment(null); setAddPaiementError(""); }}>{t("cancel")}</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Bouton Payer au-dessus du tableau ── */}
                      {canActAsTresorier && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                          <button
                            title={lang === "fr" ? "Enregistrer un paiement" : "Record a payment"}
                            onClick={() => {
                              setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" });
                              setSelectedAdherentForPayment(null);
                              setShowAddPaiementForm(true);
                              setShowSuccessMessage(false);
                              setShowRecuPrompt(false);
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 14px rgba(124,58,237,0.4)", transition: "transform 0.15s, box-shadow 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.55)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(124,58,237,0.4)"; }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="3" ry="3"/>
                              <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            {lang === "fr" ? "Payer" : "Pay"}
                          </button>
                        </div>
                      )}

                      {/* ── Tableau membres ── */}
                      <div style={{ borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.09)", border: "1px solid #e8ecf0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                          <thead>
                            <tr style={{ background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)" }}>
                              <th style={{ padding: "13px 14px", textAlign: "left", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{t("matricule")}</th>
                              <th style={{ padding: "13px 14px", textAlign: "left", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px" }}>{lang === "fr" ? "Membre" : "Member"}</th>
                              <th style={{ padding: "13px 14px", textAlign: "left", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px" }}>{t("telephoneTh")}</th>
                              <th style={{ padding: "13px 14px", textAlign: "right", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{t("balancePaid")}</th>
                              <th style={{ padding: "13px 14px", textAlign: "right", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{t("remaining")}</th>
                              <th style={{ padding: "13px 14px", textAlign: "center", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px" }}>{t("statusTh")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtres.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "36px 20px", color: "#aab2c0", fontSize: "14px" }}>
                                  {cotisationSearchTerm ? (lang === "fr" ? "Aucun résultat pour cette recherche." : "No results for this search.") : adherents.length === 0 ? t("noMemberRegistered") : t("noResultsFilter")}
                                </td>
                              </tr>
                            ) : (
                              filtres.map((c, i) => (
                                <tr key={i} className="anim-row" style={{ borderBottom: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbfc", transition: "background 0.15s" }}>
                                  <td style={{ padding: "13px 14px", fontSize: "13px" }}>
                                    <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#5a6a7a", fontSize: "12px", background: "#f0f4f8", padding: "3px 8px", borderRadius: "6px" }}>{c.matricule}</span>
                                  </td>
                                  <td style={{ padding: "13px 14px" }}>
                                    <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "14px" }}>{c.nom} {c.prenom}</div>
                                    <div style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "2px" }}>{c.email !== "-" ? c.email : ""}</div>
                                  </td>
                                  <td style={{ padding: "13px 14px", fontSize: "13px", color: "#5a6a7a" }}>{c.telephone}</td>
                                  <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: "700", color: "#27ae60", fontSize: "14px" }}>{c.soldePaye}</td>
                                  <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: "700", color: parseAmount(c.reste) > 0 ? "#e74c3c" : "#27ae60", fontSize: "14px" }}>{c.reste}</td>
                                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                                    <span style={{ padding: "5px 14px", borderRadius: "20px", color: "white", fontWeight: "700", fontSize: "12px", background: statutColor(c.statut), whiteSpace: "nowrap", display: "inline-block" }}>
                                      {statutLabel(c.statut)}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {periodes.length === 0 && (
              <div style={styles.emptyState}>
                <p>{t("noContribution")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ────────────────────────────────────────── */}
        {page === "messages" && (
          <div className="msg-page-enter" style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 6px 32px rgba(44,62,80,0.13)", border: "1px solid #e2e8f0" }} onClick={() => { setMsgEmojiOpen(null); setMsgTooltip(null); }}>

            {/* ── Bannière gradient ── */}
            <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #4f46e5 50%, #7c3aed 100%)", padding: "26px 28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-30px", left: "8%", width: "110px", height: "110px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: "6px", left: "42%", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px" }}>
                <span className="msg-icon-float" style={{ fontSize: "42px", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.3))", lineHeight: 1 }}>✉️</span>
                <div>
                  <h1 style={{ margin: "0 0 5px", color: "white", fontSize: "22px", fontWeight: "800", textShadow: "0 2px 6px rgba(0,0,0,0.2)", letterSpacing: "-0.3px" }}>
                    {lang === "fr" ? "Messages aux membres" : "Member Messages"}
                  </h1>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "13px" }}>
                    {isHautMembre
                      ? (lang === "fr" ? "Diffusez des informations et annonces à toute l'association" : "Broadcast information and announcements to all members")
                      : (lang === "fr" ? "Consultez les messages envoyés par les responsables" : "View messages sent by the association's officers")}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Corps ── */}
            <div style={{ background: "white", padding: "20px 24px 28px" }}>
              {/* Sous-onglets — hauts membres uniquement */}
              {isHautMembre && (() => {
                const envoyesCount = adminMessages.filter(m => m.is_mine).length;
                const recusCount = adminMessages.filter(m => !m.is_mine).length;
                return (
                  <div className="msg-tabs-row">
                    <button className={`msg-tab-btn${msgTab === "nouveau" ? " msg-tab-btn--orange" : ""}`} onClick={() => { setMsgTab("nouveau"); setMsgError(""); setMsgSuccess(""); }}>
                      ✏️ {lang === "fr" ? "Nouveau" : "New"}
                    </button>
                    <button className={`msg-tab-btn${msgTab === "envoyes" ? " msg-tab-btn--orange" : ""}`} onClick={() => setMsgTab("envoyes")}>
                      📤 {lang === "fr" ? "Envoyés" : "Sent"}
                      {envoyesCount > 0 && <span className={`msg-tab-badge${msgTab === "envoyes" ? "" : " msg-tab-badge--orange-inactive"}`}>{envoyesCount}</span>}
                    </button>
                    <button className={`msg-tab-btn${msgTab === "recus" ? " msg-tab-btn--blue" : ""}`} onClick={() => setMsgTab("recus")}>
                      📥 {lang === "fr" ? "Reçus" : "Received"}
                      {recusCount > 0 && <span className={`msg-tab-badge${msgTab === "recus" ? "" : " msg-tab-badge--blue-inactive"}`}>{recusCount}</span>}
                    </button>
                  </div>
                );
              })()}

              {/* Formulaire d'envoi */}
              {isHautMembre && msgTab === "nouveau" && (
                <div style={{ background: "#fafbfc", borderRadius: "12px", padding: "22px", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {lang === "fr" ? "Titre" : "Title"}
                    </label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", background: "white" }}
                      value={msgForm.titre}
                      onChange={e => setMsgForm(f => ({ ...f, titre: e.target.value }))}
                      placeholder={lang === "fr" ? "Objet du message" : "Message subject"}
                      autoFocus
                    />
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {lang === "fr" ? "Contenu" : "Content"}
                    </label>
                    <textarea
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", minHeight: "120px", resize: "vertical", fontFamily: "inherit", background: "white" }}
                      value={msgForm.contenu}
                      onChange={e => setMsgForm(f => ({ ...f, contenu: e.target.value }))}
                      placeholder={lang === "fr" ? "Contenu du message…" : "Message content…"}
                    />
                  </div>
                  {msgError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", border: "1px solid #fca5a5" }}>⚠️ {msgError}</div>}
                  {msgSuccess && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", border: "1px solid #86efac" }}>✅ {msgSuccess}</div>}
                  <button
                    style={{ padding: "12px 32px", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px", opacity: msgLoading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(245,158,11,0.4)", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    disabled={msgLoading}
                    onClick={async () => {
                      setMsgError(""); setMsgSuccess("");
                      if (!msgForm.titre.trim() || !msgForm.contenu.trim()) { setMsgError(lang === "fr" ? "Titre et contenu requis." : "Title and content required."); return; }
                      setMsgLoading(true);
                      try {
                        const res = await apiFetch(`${API_BASE}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msgForm) });
                        const data = await res.json();
                        if (!res.ok) { setMsgError(data.error || (lang === "fr" ? "Erreur." : "Error.")); return; }
                        setAdminMessages(prev => [data, ...prev]);
                        setMsgForm({ titre: "", contenu: "" });
                        setMsgSuccess(lang === "fr" ? "Message envoyé avec succès ! Vos membres peuvent le consulter." : "Message sent successfully! Your members can now view it.");
                        setTimeout(() => { setMsgSuccess(""); setMsgTab("envoyes"); }, 2500);
                      } catch { setMsgError(lang === "fr" ? "Erreur réseau." : "Network error."); }
                      finally { setMsgLoading(false); }
                    }}
                  >
                    {msgLoading ? <><span>⏳</span> {lang === "fr" ? "Envoi…" : "Sending…"}</> : <><span>🚀</span> {lang === "fr" ? "Envoyer à tous les membres" : "Send to all members"}</>}
                  </button>
                </div>
              )}

              {/* Liste des messages */}
              {(isHautMembre ? (msgTab === "envoyes" || msgTab === "recus") : true) && (() => {
                const listeAffichee = !isHautMembre
                  ? adminMessages
                  : msgTab === "envoyes"
                    ? adminMessages.filter(m => m.is_mine)
                    : adminMessages.filter(m => !m.is_mine);
                const emptyLabel = msgTab === "envoyes"
                  ? (lang === "fr" ? "Aucun message envoyé pour le moment." : "No sent messages yet.")
                  : msgTab === "recus"
                    ? (lang === "fr" ? "Aucun message reçu pour le moment." : "No received messages yet.")
                    : (lang === "fr" ? "Aucun message pour le moment." : "No messages yet.");
                return listeAffichee.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "56px 0 48px" }}>
                    <span className="msg-empty-icon">📭</span>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#64748b" }}>{emptyLabel}</p>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#b2bec3" }}>{lang === "fr" ? "Rien de nouveau pour l'instant." : "Nothing new for now."}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {listeAffichee.map((m, idx) => {
                      const hasAuteur = m.auteur_nom || m.auteur_prenom;
                      const posteBg = m.auteur_poste && m.auteur_poste.toLowerCase().includes("président") ? "#8e44ad"
                        : m.auteur_poste && m.auteur_poste.toLowerCase().includes("trésorier") ? "#27ae60"
                        : m.auteur_poste && m.auteur_poste.toLowerCase().includes("secrétaire") ? "#e67e22"
                        : "#3498db";
                      const reactions = m.reactions || {};
                      return (
                        <div key={m.id} className="msg-card" style={{ "--i": idx, background: "white", borderRadius: "16px", boxShadow: "0 3px 16px rgba(44,62,80,0.09)", border: "1px solid #edf2f7", overflow: "visible", position: "relative" }}>
                          {/* En-tête expéditeur */}
                          {hasAuteur && (
                            <div style={{ background: `linear-gradient(135deg, ${posteBg}18, ${posteBg}08)`, padding: "14px 20px", borderBottom: `2px solid ${posteBg}22`, display: "flex", alignItems: "center", gap: "12px", borderRadius: "16px 16px 0 0" }}>
                              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg,${posteBg},${posteBg}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, color: "white", fontWeight: "800", boxShadow: `0 3px 10px ${posteBg}55`, border: `2px solid ${posteBg}33` }}>
                                {(m.auteur_prenom || m.auteur_nom || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>{m.auteur_prenom} {m.auteur_nom}</div>
                                {m.auteur_poste && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: posteBg, color: "white", fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "8px", marginTop: "4px", letterSpacing: "0.5px", boxShadow: `0 2px 6px ${posteBg}44` }}>
                                    ✦ {m.auteur_poste.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Corps */}
                          <div style={{ padding: "18px 20px 10px" }}>
                            <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "15px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: "4px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg,#7c3aed,#3b82f6)", display: "inline-block", flexShrink: 0 }} />
                              {m.titre}
                            </div>
                            <div style={{ color: "#475569", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{m.contenu}</div>
                          </div>

                          {/* Date */}
                          <div style={{ padding: "0 20px 10px", color: "#94a3b8", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>🕐</span> {new Date(m.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                          </div>

                          {/* Réactions + supprimer */}
                          <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", background: "#fafbfc", borderRadius: "0 0 16px 16px" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", minHeight: "36px" }}>
                              {Object.entries(reactions).map(([emoji, info]) => (
                                <div key={emoji} style={{ position: "relative", flexShrink: 0 }}>
                                  <button
                                    title={info.reactors.join(", ")}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: info.my_reaction ? "#eff6ff" : "#f1f5f9", border: `1.5px solid ${info.my_reaction ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: info.my_reaction ? "#2563eb" : "#64748b", whiteSpace: "nowrap", flexShrink: 0, boxShadow: info.my_reaction ? "0 2px 8px rgba(59,130,246,0.2)" : "none" }}
                                    onClick={() => { const key = `${m.id}-${emoji}`; setMsgTooltip(prev => prev === key ? null : key); setMsgEmojiOpen(null); }}
                                  >
                                    <span style={{ fontSize: "16px", lineHeight: 1 }}>{emoji}</span>
                                    <span style={{ fontSize: "13px", minWidth: "12px", textAlign: "center" }}>{info.count}</span>
                                  </button>
                                  {msgTooltip === `${m.id}-${emoji}` && info.reactors.length > 0 && (
                                    <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#1e293b", color: "white", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", whiteSpace: "nowrap", zIndex: 99, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
                                      {info.reactors.join(", ")}
                                      <div style={{ position: "absolute", top: "100%", left: "14px", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e293b" }} />
                                    </div>
                                  )}
                                </div>
                              ))}
                              <div style={{ position: "relative", flexShrink: 0 }}>
                                <button
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "white", border: "1.5px dashed #cbd5e1", borderRadius: "20px", cursor: "pointer", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}
                                  onClick={e => { e.stopPropagation(); setMsgEmojiOpen(prev => prev === m.id ? null : m.id); setMsgTooltip(null); }}
                                >
                                  <span style={{ fontSize: "16px", lineHeight: 1 }}>😊</span>
                                  <span style={{ fontSize: "12px" }}>+</span>
                                </button>
                                {msgEmojiOpen === m.id && (
                                  <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "white", borderRadius: "14px", padding: "10px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "3px", zIndex: 100, border: "1px solid #e2e8f0", minWidth: "max-content" }} onClick={e => e.stopPropagation()}>
                                    {REACTION_EMOJIS.map(e => (
                                      <button key={e} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", padding: "4px 6px", borderRadius: "10px", transition: "background 0.12s, transform 0.12s", flexShrink: 0 }}
                                        onMouseEnter={ev => { ev.currentTarget.style.background = "#f1f5f9"; ev.currentTarget.style.transform = "scale(1.25)"; }}
                                        onMouseLeave={ev => { ev.currentTarget.style.background = "none"; ev.currentTarget.style.transform = "scale(1)"; }}
                                        onClick={() => handleReactMessage(m.id, e)}
                                      >{e}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Supprimer (admin uniquement) */}
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm(lang === "fr" ? "Supprimer ce message ?" : "Delete this message?")) return;
                                  try {
                                    await apiFetch(`${API_BASE}/messages/${m.id}`, { method: "DELETE" });
                                    setAdminMessages(prev => prev.filter(x => x.id !== m.id));
                                  } catch {}
                                }}
                              style={styles.actionDeleteBtn}><Icon name="trash" size={14} /></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── NON RÉGLÉS ──────────────────────────────────────── */}
        {page === "nonRegle" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
              <button style={styles.cancelBtn} onClick={() => setPage("accueil")}>{t("backBtn")}</button>
              <h1 style={{ margin: 0 }}>{t("unpaidTitle")}</h1>
            </div>
            {currentPeriode && (
              <p style={{ color: "#7f8c8d", marginBottom: "16px", fontSize: "14px", marginTop: 0 }}>
                {t("currentPeriodLabel")} <strong style={{ color: "#2c3e50" }}>{periodeLabel(currentPeriode.libelle)}</strong> — {t("amountDue")}{" "}
                <strong style={{ color: "#e74c3c" }}>{currentPeriode.montantDu} F</strong>
              </p>
            )}
            {!currentPeriode ? (
              <div style={styles.emptyState}><p>{t("noPeriodRegistered")}</p></div>
            ) : (() => {
              const liste = currentPeriode.paiements || [];
              const idAvecPaiement = new Set(liste.map((p) => p.adherent_id));
              const sansPaiement = adherents
                .filter((a) => !idAvecPaiement.has(a.id))
                .map((a) => ({
                  adherent_id: a.id,
                  matricule: a.matricule || "-",
                  nom: a.nom,
                  prenom: a.prenom,
                  telephone: a.telephone || "-",
                  email: a.email || "-",
                  soldePaye: formatAmount(0),
                  reste: formatAmount(parseAmount(currentPeriode.montantDu)),
                  statut: "Impayé",
                }));
              const tousImpayes = [...liste.filter((p) => p.statut === "Impayé"), ...sansPaiement];
              const tousPartiels = liste.filter((p) => p.statut === "Partiel");
              const listeAffichee = nonRegleTab === "impayes" ? tousImpayes : tousPartiels;
              return (
                <>
                  {/* ── Onglets ── */}
                  <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid #e8ecf0" }}>
                    <button
                      onClick={() => setNonRegleTab("impayes")}
                      style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit", borderBottom: nonRegleTab === "impayes" ? "3px solid #e74c3c" : "3px solid transparent", color: nonRegleTab === "impayes" ? "#e74c3c" : "#7f8c8d", marginBottom: "-2px", transition: "color 0.15s, border-color 0.15s", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <Icon name="x-circle" size={15} style={{ color: nonRegleTab === "impayes" ? "#e74c3c" : "#bdc3c7" }} />
                      {lang === "fr" ? "Non payés" : "Unpaid"}
                      <span style={{ background: nonRegleTab === "impayes" ? "#e74c3c" : "#bdc3c7", color: "#fff", borderRadius: "10px", padding: "1px 8px", fontSize: "11px", fontWeight: "700" }}>{tousImpayes.length}</span>
                    </button>
                    <button
                      onClick={() => setNonRegleTab("partiels")}
                      style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit", borderBottom: nonRegleTab === "partiels" ? "3px solid #f39c12" : "3px solid transparent", color: nonRegleTab === "partiels" ? "#f39c12" : "#7f8c8d", marginBottom: "-2px", transition: "color 0.15s, border-color 0.15s", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <Icon name="hourglass" size={15} style={{ color: nonRegleTab === "partiels" ? "#f39c12" : "#bdc3c7" }} />
                      {lang === "fr" ? "Partiels" : "Partial"}
                      <span style={{ background: nonRegleTab === "partiels" ? "#f39c12" : "#bdc3c7", color: "#fff", borderRadius: "10px", padding: "1px 8px", fontSize: "11px", fontWeight: "700" }}>{tousPartiels.length}</span>
                    </button>
                  </div>

                  {listeAffichee.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p>{nonRegleTab === "impayes" ? (lang === "fr" ? "Aucun membre impayé ✓" : "No unpaid members ✓") : (lang === "fr" ? "Aucun paiement partiel ✓" : "No partial payments ✓")}</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                        {listeAffichee.length} {listeAffichee.length > 1 ? t("memberPlural") : t("memberSingular")} {nonRegleTab === "impayes" ? (lang === "fr" ? "non payés" : "unpaid") : (lang === "fr" ? "en paiement partiel" : "partial payment")}
                      </p>
                      <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, tableLayout: "auto" }}>
                          <thead>
                            <tr>
                              <th style={styles.th}>{t("numberTh")}</th>
                              <th style={styles.th}>{t("matricule")}</th>
                              <th style={styles.th}>{t("nameTh")}</th>
                              <th style={styles.th}>{t("surnameTh")}</th>
                              <th style={styles.th}>{t("telephoneTh")}</th>
                              <th style={styles.th}>{t("emailTh")}</th>
                              <th style={styles.th}>{t("balancePaid")}</th>
                              <th style={styles.th}>{t("remainingToPayTh")}</th>
                              <th style={styles.th}>{t("statusTh")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {listeAffichee.map((c, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }} className="anim-row">
                                <td style={styles.td}>{i + 1}</td>
                                <td style={styles.td}><strong>{c.matricule}</strong></td>
                                <td style={styles.td}><strong>{c.nom}</strong></td>
                                <td style={styles.td}>{c.prenom}</td>
                                <td style={styles.td}>{c.telephone}</td>
                                <td style={styles.td}>{c.email}</td>
                                <td style={styles.td}>{c.soldePaye}</td>
                                <td style={styles.td}>{c.reste}</td>
                                <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                                  <span style={{ padding: "4px 12px", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "13px", background: statutColor(c.statut), whiteSpace: "nowrap", display: "inline-block" }}>
                                    {statutLabel(c.statut)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── HISTORIQUE ───────────────────────────────────────── */}
        {page === "historique" && (
          <div>
            <h1>{t("paymentHistory")}</h1>
            <div style={{ background: "#f7f9fc", padding: "12px 18px", borderRadius: "8px", marginBottom: "16px", display: "flex", gap: "24px", flexWrap: "wrap", border: "1px solid #e0e6ed" }}>
              <span>{t("totalTransactions")} <strong>{historiqueTransactions.length}</strong></span>
              <span>
                {t("totalAmountCollected")}{" "}
                <strong style={{ color: "#27ae60" }}>
                  {formatAmount(historiqueTransactions.reduce((s, tx) => s + parseAmount(tx.montantPaye), 0))}
                </strong>
              </span>
            </div>
            <div style={styles.toolbarSection}>
              <input
                type="text"
                placeholder={t("searchHistory")}
                value={searchHistorique}
                onChange={(e) => setSearchHistorique(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {historiqueTransactions.length === 0 ? (
              <div style={styles.emptyState}><p>{t("noPaymentYet")}</p></div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={{ ...styles.table, tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t("receiptNumberTh")}</th>
                      <th style={styles.th}>{t("dateTh")}</th>
                      <th style={styles.th}>{t("memberTh")}</th>
                      <th style={styles.th}>{t("periodTh")}</th>
                      <th style={styles.th}>{t("amountPaidTh")}</th>
                      <th style={styles.th}>{t("modeTh")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...historiqueTransactions].reverse().filter((tx) => {
                      const q = searchHistorique.toLowerCase();
                      if (!q) return true;
                      return (
                        (tx.nom || "").toLowerCase().includes(q) ||
                        (tx.prenom || "").toLowerCase().includes(q) ||
                        (tx.periode || "").toLowerCase().includes(q) ||
                        (tx.numeroRecu || "").toLowerCase().includes(q)
                      );
                    }).map((tx, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }} className="anim-row">
                        <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d" }}>{tx.numeroRecu}</td>
                        <td style={styles.td}>{tx.datePaiement}</td>
                        <td style={styles.td}><strong>{tx.nom} {tx.prenom}</strong></td>
                        <td style={styles.td}>{periodeLabel(tx.periode)}</td>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#27ae60" }}>{tx.montantPaye}</td>
                        <td style={styles.td}>
                          {({ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[tx.modePaiement])
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><img src={{ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[tx.modePaiement]} alt={tx.modePaiement} style={{ height: "18px", width: "auto", maxWidth: "42px", objectFit: "contain", verticalAlign: "middle" }} /></span>
                            : modeLabel(tx.modePaiement)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── JOURNAL D'AUDIT ──────────────────────────────────── */}
        {page === "audit" && isAdmin && (
          <div>
            <h1 style={{ margin: "0 0 14px", fontSize: "22px", color: "#2c3e50" }}>
              🔐 {lang === "fr" ? "Journal d'audit" : "Audit Log"}
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#7f8c8d" }}>
              {lang === "fr" ? "Toutes les actions sensibles enregistrées — qui, quoi, quand, depuis quelle IP." : "All sensitive actions recorded — who, what, when, from which IP."}
            </p>

            {/* Filtre par action */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setAuditActionFilter(v);
                  setAuditOffset(0);
                  loadAuditLogs(0, v);
                }}
                style={{ padding: "8px 14px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", color: "#2c3e50", background: "white", cursor: "pointer", outline: "none" }}
              >
                <option value="">{lang === "fr" ? "Toutes les actions" : "All actions"}</option>
                <option value="CONNEXION">Connexion</option>
                <option value="DECONNEXION">{lang === "fr" ? "Déconnexion" : "Logout"}</option>
                <option value="INSCRIPTION_MEMBRE">{lang === "fr" ? "Inscription membre" : "Member registration"}</option>
                <option value="CHANGEMENT_MOT_DE_PASSE">{lang === "fr" ? "Changement mot de passe" : "Password change"}</option>
                <option value="CHANGEMENT_EMAIL">{lang === "fr" ? "Changement email" : "Email change"}</option>
                <option value="AJOUT_ADHERENT">{lang === "fr" ? "Ajout adhérent" : "Member added"}</option>
                <option value="MODIFICATION_ADHERENT">{lang === "fr" ? "Modification adhérent" : "Member edited"}</option>
                <option value="SUPPRESSION_ADHERENT">{lang === "fr" ? "Suppression adhérent" : "Member deleted"}</option>
                <option value="CREATION_PERIODE">{lang === "fr" ? "Création période" : "Period created"}</option>
                <option value="ENREGISTREMENT_PAIEMENT">{lang === "fr" ? "Paiement enregistré" : "Payment recorded"}</option>
                <option value="CREATION_UTILISATEUR">{lang === "fr" ? "Création utilisateur" : "User created"}</option>
                <option value="SUPPRESSION_UTILISATEUR">{lang === "fr" ? "Suppression utilisateur" : "User deleted"}</option>
              </select>
              <span style={{ fontSize: "13px", color: "#95a5a6" }}>
                {lang === "fr" ? `${auditTotal} entrée(s) au total` : `${auditTotal} total entries`}
              </span>
            </div>

            {auditLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#7f8c8d" }}>
                {lang === "fr" ? "Chargement…" : "Loading…"}
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#7f8c8d" }}>
                <div style={{ marginBottom: "10px", opacity: 0.3 }}><Icon name="shield" size={40} /></div>
                <p style={{ margin: 0 }}>{lang === "fr" ? "Aucune entrée dans le journal." : "No entries in the audit log."}</p>
              </div>
            ) : (
              <>
                <div style={styles.tableContainer}>
                  <table style={{ ...styles.table, tableLayout: "auto" }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{lang === "fr" ? "Date / Heure" : "Date / Time"}</th>
                        <th style={styles.th}>{lang === "fr" ? "Utilisateur" : "User"}</th>
                        <th style={styles.th}>Action</th>
                        <th style={styles.th}>{lang === "fr" ? "Détails" : "Details"}</th>
                        <th style={styles.th}>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, i) => {
                        const actionColors = {
                          CONNEXION: "#27ae60",
                          DECONNEXION: "#7f8c8d",
                          INSCRIPTION_MEMBRE: "#1abc9c",
                          CHANGEMENT_MOT_DE_PASSE: "#e67e22",
                          CHANGEMENT_EMAIL: "#e67e22",
                          AJOUT_ADHERENT: "#3498db",
                          MODIFICATION_ADHERENT: "#2980b9",
                          SUPPRESSION_ADHERENT: "#e74c3c",
                          CREATION_PERIODE: "#8e44ad",
                          ENREGISTREMENT_PAIEMENT: "#27ae60",
                          CREATION_UTILISATEUR: "#3498db",
                          SUPPRESSION_UTILISATEUR: "#e74c3c",
                        };
                        const color = actionColors[log.action] || "#7f8c8d";
                        const auteur = log.nom ? `${log.prenom || ""} ${log.nom}`.trim() : (log.user_type === "admin" ? (lang === "fr" ? "Trésorier" : "Treasurer") : (lang === "fr" ? "Membre" : "Member"));
                        return (
                          <tr key={log.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                            <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d", whiteSpace: "nowrap" }}>
                              {new Date(log.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: "#2c3e50" }}>{auteur}</div>
                              {log.poste && <div style={{ fontSize: "11px", color: "#7f8c8d" }}>{log.poste}</div>}
                            </td>
                            <td style={styles.td}>
                              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "10px", background: color + "22", color, fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap", border: `1px solid ${color}44` }}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={{ ...styles.td, fontSize: "13px", color: "#4a5568", maxWidth: "300px", wordBreak: "break-word" }}>
                              {log.details || "—"}
                            </td>
                            <td style={{ ...styles.td, fontSize: "12px", color: "#95a5a6", fontFamily: "monospace" }}>
                              {log.ip_address || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {auditTotal > AUDIT_LIMIT && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px", alignItems: "center" }}>
                    <button
                      disabled={auditOffset === 0}
                      onClick={() => { const o = Math.max(0, auditOffset - AUDIT_LIMIT); setAuditOffset(o); loadAuditLogs(o, auditActionFilter); }}
                      style={{ padding: "8px 18px", border: "1.5px solid #e0e6ed", borderRadius: "8px", background: "white", cursor: auditOffset === 0 ? "not-allowed" : "pointer", color: auditOffset === 0 ? "#bdc3c7" : "#2c3e50", fontWeight: "600", fontSize: "13px" }}
                    >
                      ← {lang === "fr" ? "Précédent" : "Previous"}
                    </button>
                    <span style={{ fontSize: "13px", color: "#7f8c8d" }}>
                      {auditOffset + 1}–{Math.min(auditOffset + AUDIT_LIMIT, auditTotal)} / {auditTotal}
                    </span>
                    <button
                      disabled={auditOffset + AUDIT_LIMIT >= auditTotal}
                      onClick={() => { const o = auditOffset + AUDIT_LIMIT; setAuditOffset(o); loadAuditLogs(o, auditActionFilter); }}
                      style={{ padding: "8px 18px", border: "1.5px solid #e0e6ed", borderRadius: "8px", background: "white", cursor: auditOffset + AUDIT_LIMIT >= auditTotal ? "not-allowed" : "pointer", color: auditOffset + AUDIT_LIMIT >= auditTotal ? "#bdc3c7" : "#2c3e50", fontWeight: "600", fontSize: "13px" }}
                    >
                      {lang === "fr" ? "Suivant" : "Next"} →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════ GESTION DES POSTES ═══ */}
        {page === "bureau" && (
          <div>
            {/* En-tête */}
            <div style={{ background: "linear-gradient(135deg, #1a2742 0%, #2c3e50 60%, #1a6a9a 100%)", borderRadius: "16px", padding: "28px 32px", color: "white", marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px" }}>
              <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: "14px", padding: "14px", display: "flex", flexShrink: 0 }}>
                <Icon name="building" size={26} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800" }}>
                  {lang === "fr" ? "Bureau de l'association" : "Association Board"}
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.65 }}>
                  {lang === "fr" ? "Membres élus et responsables de l'association" : "Elected members and officers of the association"}
                </p>
              </div>
            </div>

            {/* Membres du bureau */}
            {adherents.filter(a => a.poste).length === 0 ? (
              <div style={{ background: "white", borderRadius: "14px", padding: "40px", textAlign: "center", color: "#94a3b8", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "28px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏛️</div>
                <div style={{ fontSize: "15px", fontWeight: "600" }}>{lang === "fr" ? "Aucun poste attribué pour l'instant." : "No roles assigned yet."}</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px", marginBottom: "32px" }}>
                {(() => {
                  const posteOrder = ["président","vice-président","secrétaire général","secrétaire adjoint","trésorier","trésorier adjoint","commissaire","conseiller"];
                  const posteColors = { "président": "#7c3aed", "vice-président": "#1d4ed8", "secrétaire général": "#15803d", "secrétaire adjoint": "#0e7490", "trésorier": "#c2410c", "trésorier adjoint": "#b45309", "commissaire": "#b91c1c", "conseiller": "#475569" };
                  return adherents
                    .filter(a => a.poste)
                    .sort((a, b) => {
                      const ia = posteOrder.findIndex(k => a.poste?.toLowerCase().includes(k));
                      const ib = posteOrder.findIndex(k => b.poste?.toLowerCase().includes(k));
                      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                    })
                    .map(a => {
                      const colorKey = Object.keys(posteColors).find(k => a.poste?.toLowerCase().includes(k));
                      const color = colorKey ? posteColors[colorKey] : "#475569";
                      return (
                        <div key={a.id} style={{ background: "white", borderRadius: "14px", padding: "18px 16px", border: `2px solid ${color}22`, boxShadow: "0 3px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                          {a.photo
                            ? <img src={a.photo} alt="" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
                            : <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", border: `3px solid ${color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>👤</div>
                          }
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px", color: "#1e293b" }}>{a.prenom} {a.nom}</div>
                            <div style={{ marginTop: "5px", display: "inline-block", background: color, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 12px", borderRadius: "20px" }}>{a.poste}</div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}

            {/* Formulaire d'attribution — visible uniquement si l'utilisateur peut attribuer des postes */}
            {canAssignPoste && (
              <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon name="badge" size={18} style={{ color: "#0f3460" }} />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>
                    {lang === "fr" ? "Attribuer un poste" : "Assign a role"}
                  </h3>
                </div>

                {isAdmin && !nonCreatorPresidentExists && (
                  <div style={{ margin: "16px 24px 0", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#92400e", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Icon name="alert-triangle" size={15} style={{ flexShrink: 0, marginTop: "1px", color: "#d97706" }} />
                    <span>{lang === "fr" ? "Une fois un(e) Président(e) désigné(e), seul(e) celui-ci/celle-ci pourra attribuer des postes." : "Once a President is designated, only that person will be able to assign roles."}</span>
                  </div>
                )}

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {roleTransferError && (
                    <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "9px", border: "1px solid #fecaca" }}>
                      <Icon name="x-circle" size={15} style={{ flexShrink: 0 }} /> {roleTransferError}
                    </div>
                  )}
                  {roleTransferSuccess && (
                    <div style={{ background: "#f0fdf4", color: "#166534", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "9px", border: "1px solid #bbf7d0" }}>
                      <Icon name="check-circle" size={15} style={{ flexShrink: 0 }} /> {roleTransferSuccess}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                        {lang === "fr" ? "Poste à attribuer" : "Role to assign"}
                      </label>
                      <select
                        value={roleTransferPoste}
                        onChange={e => setRoleTransferPoste(e.target.value)}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", color: roleTransferPoste ? "#1e293b" : "#94a3b8", background: "white", cursor: "pointer" }}
                      >
                        <option value="">{lang === "fr" ? "— Choisir un poste —" : "— Choose a role —"}</option>
                        {["Président(e)", "Vice-Président(e)", "Secrétaire Général(e)", "Secrétaire Adjoint(e)", "Trésorier(e)", "Trésorier(e) Adjoint(e)", "Commissaire aux comptes", "Conseiller(e)"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                        {lang === "fr" ? "Membre concerné" : "Member"}
                      </label>
                      <select
                        value={roleTransferTargetId}
                        onChange={e => setRoleTransferTargetId(e.target.value)}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", color: roleTransferTargetId ? "#1e293b" : "#94a3b8", background: "white", cursor: "pointer" }}
                      >
                        <option value="">{lang === "fr" ? "— Choisir un membre —" : "— Choose a member —"}</option>
                        {adherents.map(a => (
                          <option key={a.id} value={String(a.id)}>
                            {a.prenom} {a.nom}{a.poste ? ` (${a.poste})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      disabled={roleTransferLoading || !roleTransferTargetId || !roleTransferPoste}
                      style={{
                        padding: "12px 28px",
                        background: roleTransferLoading || !roleTransferTargetId || !roleTransferPoste ? "#cbd5e1" : "linear-gradient(135deg, #1a1a2e, #0f3460)",
                        color: "white", border: "none", borderRadius: "11px", fontSize: "14px",
                        cursor: roleTransferLoading || !roleTransferTargetId || !roleTransferPoste ? "not-allowed" : "pointer",
                        fontWeight: "700", display: "flex", alignItems: "center", gap: "9px",
                        boxShadow: roleTransferLoading || !roleTransferTargetId || !roleTransferPoste ? "none" : "0 4px 16px rgba(15,52,96,0.35)",
                        transition: "all 0.15s ease",
                      }}
                      onClick={async () => {
                        setRoleTransferError(""); setRoleTransferSuccess("");
                        const targetAdherent = adherents.find(a => String(a.id) === String(roleTransferTargetId));
                        if (!targetAdherent) { setRoleTransferError(lang === "fr" ? "Membre introuvable." : "Member not found."); return; }
                        setRoleTransferLoading(true);
                        try {
                          const r1 = await apiFetch(`${API_BASE}/adherents/${targetAdherent.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ nom: targetAdherent.nom, prenom: targetAdherent.prenom, telephone: targetAdherent.telephone || null, email: targetAdherent.email || null, poste: roleTransferPoste }),
                          });
                          if (!r1.ok) { const d = await r1.json(); setRoleTransferError(d.error || (lang === "fr" ? "Erreur." : "Error.")); return; }
                          setAdherents(prev => prev.map(a => String(a.id) === String(roleTransferTargetId) ? { ...a, poste: roleTransferPoste } : a));
                          setRoleTransferSuccess(lang === "fr" ? `Poste "${roleTransferPoste}" attribué à ${targetAdherent.prenom} ${targetAdherent.nom} avec succès !` : `Role "${roleTransferPoste}" assigned to ${targetAdherent.prenom} ${targetAdherent.nom}!`);
                          setRoleTransferTargetId("");
                          setRoleTransferPoste("");
                        } catch { setRoleTransferError(lang === "fr" ? "Erreur réseau." : "Network error."); }
                        finally { setRoleTransferLoading(false); }
                      }}
                    >
                      <Icon name="badge" size={15} />
                      {roleTransferLoading ? (lang === "fr" ? "Attribution…" : "Assigning…") : (lang === "fr" ? "Confirmer" : "Confirm")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════ COMPTABILITÉ ═══ */}
        {page === "comptabilite" && canActAsTresorier && (
          <div>
            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "22px", color: "#2c3e50", display: "flex", alignItems: "center", gap: "10px" }}><Icon name="bar-chart" size={20} /> {lang === "fr" ? "Comptabilité" : "Accounting"}</h1>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#7f8c8d" }}>
                  {lang === "fr" ? "Recettes · Dépenses · Trésorerie · Rapports" : "Revenue · Expenses · Treasury · Reports"}
                </p>
              </div>
            </div>

            {/* Filtres date */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", margin: "16px 0 20px" }}>
              <label style={{ fontSize: "13px", color: "#7f8c8d", fontWeight: "600" }}>{lang === "fr" ? "Période :" : "Period:"}</label>
              <input type="date" value={comptaFiltreDateDebut}
                onChange={e => { setComptaFiltreDateDebut(e.target.value); loadComptabilite(e.target.value, comptaFiltreDateFin); }}
                style={{ padding: "7px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
              <span style={{ color: "#bdc3c7" }}>→</span>
              <input type="date" value={comptaFiltreDateFin}
                onChange={e => { setComptaFiltreDateFin(e.target.value); loadComptabilite(comptaFiltreDateDebut, e.target.value); }}
                style={{ padding: "7px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
              {(comptaFiltreDateDebut || comptaFiltreDateFin) && (
                <button onClick={() => { setComptaFiltreDateDebut(""); setComptaFiltreDateFin(""); loadComptabilite("", ""); }}
                  style={{ padding: "7px 14px", border: "1.5px solid #e74c3c", borderRadius: "8px", background: "none", color: "#e74c3c", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
                  ✕ {lang === "fr" ? "Tout afficher" : "Show all"}
                </button>
              )}
            </div>

            {/* Cartes résumé */}
            {comptaLoading ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#7f8c8d" }}>{lang === "fr" ? "Chargement…" : "Loading…"}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: lang === "fr" ? "Recettes (cotisations)" : "Revenue (contributions)", value: comptaResume.recettes, color: "#27ae60", bg: "#eafaf1", icon: "arrow-up" },
                  { label: lang === "fr" ? "Dépenses" : "Expenses", value: comptaResume.depenses, color: "#e74c3c", bg: "#fef0f0", icon: "arrow-down" },
                  { label: "Solde", value: comptaResume.solde, color: comptaResume.solde >= 0 ? "#2980b9" : "#e74c3c", bg: comptaResume.solde >= 0 ? "#eaf4fb" : "#fef0f0", icon: "dollar" },
                ].map(({ label, value, color, bg, icon }) => (
                  <div key={label} style={{ background: bg, border: `1.5px solid ${color}33`, borderRadius: "12px", padding: "20px 24px" }}>
                    <div style={{ marginBottom: "6px", color }}><Icon name={icon} size={22} /></div>
                    <div style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color }}>{Number(value).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} FCFA</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 5 onglets ── */}
            <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #e0e6ed", marginBottom: "24px", overflowX: "auto" }}>
              {[
                { key: "recettes",   icon: "arrow-up",   label: lang === "fr" ? "Recettes"        : "Revenue"        },
                { key: "depenses",   icon: "arrow-down", label: lang === "fr" ? "Dépenses"        : "Expenses"       },
                { key: "livre",      icon: "receipt",    label: lang === "fr" ? "Livre de caisse" : "Cash book"      },
                { key: "tresorerie", icon: "dollar",     label: lang === "fr" ? "Trésorerie"      : "Treasury"       },
                { key: "rapports",   icon: "bar-chart",  label: lang === "fr" ? "Rapports"        : "Reports"        },
              ].map(({ key, icon, label }) => (
                <button key={key} onClick={() => setComptaSousOnglet(key)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", border: "none", borderBottom: comptaSousOnglet === key ? "3px solid #16a085" : "3px solid transparent", background: "none", cursor: "pointer", fontWeight: comptaSousOnglet === key ? "700" : "500", color: comptaSousOnglet === key ? "#16a085" : "#7f8c8d", fontSize: "14px", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                  <Icon name={icon} size={14}/> {label}
                </button>
              ))}
            </div>

            {/* ══ ONGLET RECETTES ══ */}
            {comptaSousOnglet === "recettes" && (() => {
              const filtered = historiqueTransactions.filter(tx => {
                const q = recettesSearch.toLowerCase();
                if (q && !(
                  (tx.nom||"").toLowerCase().includes(q) || (tx.prenom||"").toLowerCase().includes(q) || (tx.periode||"").toLowerCase().includes(q) || (tx.modePaiement||"").toLowerCase().includes(q)
                )) return false;
                if (comptaFiltreDateDebut && tx.datePaiementRaw && tx.datePaiementRaw < comptaFiltreDateDebut) return false;
                if (comptaFiltreDateFin && tx.datePaiementRaw && tx.datePaiementRaw > comptaFiltreDateFin) return false;
                return true;
              });
              const total = filtered.reduce((s, tx) => s + parseAmount(tx.montantPaye), 0);
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ background: "#eafaf1", color: "#27ae60", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
                        {lang === "fr" ? "Total collecté" : "Total collected"} : {formatAmount(total)}
                      </span>
                      <span style={{ background: "#f0f4f8", color: "#7f8c8d", padding: "6px 14px", borderRadius: "8px", fontSize: "13px" }}>
                        {filtered.length} {lang === "fr" ? "transaction(s)" : "transaction(s)"}
                      </span>
                    </div>
                    <input type="text" value={recettesSearch} onChange={e => setRecettesSearch(e.target.value)}
                      placeholder={lang === "fr" ? "Rechercher membre, période…" : "Search member, period…"}
                      style={{ padding: "8px 14px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", minWidth: "220px" }} />
                  </div>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px 0", color: "#7f8c8d" }}>
                      <div style={{ fontSize: "40px", marginBottom: "10px" }}>💰</div>
                      <p style={{ margin: 0 }}>{lang === "fr" ? "Aucune recette trouvée." : "No revenue found."}</p>
                    </div>
                  ) : (
                    <div style={styles.tableContainer}>
                      <table style={{ ...styles.table, tableLayout: "auto" }}>
                        <thead>
                          <tr>
                            <th style={styles.th}>{lang === "fr" ? "Date" : "Date"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Reçu" : "Receipt"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Membre" : "Member"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Période" : "Period"}</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>{lang === "fr" ? "Montant" : "Amount"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Mode" : "Method"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filtered].reverse().map((tx, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                              <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d", whiteSpace: "nowrap" }}>{tx.datePaiement}</td>
                              <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d" }}>{tx.numeroRecu || "—"}</td>
                              <td style={{ ...styles.td, fontWeight: "600" }}>{tx.nom} {tx.prenom}</td>
                              <td style={styles.td}>{periodeLabel(tx.periode)}</td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#27ae60", whiteSpace: "nowrap" }}>{tx.montantPaye}</td>
                              <td style={styles.td}>
                                {({ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[tx.modePaiement])
                                  ? <img src={{ "Orange Money": imgOrange, "Wave": imgWave, "MTN MoMo": imgMTN }[tx.modePaiement]} alt={tx.modePaiement} style={{ height: "18px", width: "auto", maxWidth: "44px", objectFit: "contain", verticalAlign: "middle" }} />
                                  : <span style={{ fontSize: "12px" }}>{modeLabel(tx.modePaiement)}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f0f4f8" }}>
                            <td colSpan={4} style={{ ...styles.td, fontWeight: "700", color: "#2c3e50" }}>Total</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "800", color: "#27ae60", fontSize: "15px" }}>{formatAmount(total)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ ONGLET DÉPENSES ══ */}
            {comptaSousOnglet === "depenses" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: "#fef0f0", color: "#e74c3c", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
                      Total : {depenses.reduce((s,d)=>s+Number(d.montant),0).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA
                    </span>
                    <input type="text" value={depensesSearch} onChange={e => setDepensesSearch(e.target.value)}
                      placeholder={lang === "fr" ? "Rechercher…" : "Search…"}
                      style={{ padding: "7px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
                  </div>
                  <button onClick={() => { setDepenseFormVisible(v => !v); setDepenseEditId(null); setDepenseError(""); setDepenseForm({ libelle: "", montant: "", categorie: "Autre", date_depense: new Date().toISOString().split("T")[0], description: "" }); }}
                    style={{ padding: "9px 20px", background: "#16a085", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                    {depenseFormVisible ? (lang === "fr" ? "✕ Annuler" : "✕ Cancel") : (lang === "fr" ? "+ Ajouter une dépense" : "+ Add expense")}
                  </button>
                </div>

                {depenseFormVisible && (
                  <div style={{ background: "#f0faf8", border: "1.5px solid #16a08533", borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#16a085" }}>{depenseEditId !== null ? (lang === "fr" ? "✏️ Modifier la dépense" : "✏️ Edit expense") : (lang === "fr" ? "Nouvelle dépense" : "New expense")}</h3>
                    {depenseError && <div style={{ background: "#fef0f0", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>{depenseError}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Libellé *" : "Label *"}</label>
                        <input value={depenseForm.libelle} onChange={e => setDepenseForm(f => ({ ...f, libelle: e.target.value }))}
                          placeholder={lang === "fr" ? "Ex: Achat chaises" : "Ex: Chair purchase"}
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Montant (FCFA) *" : "Amount (FCFA) *"}</label>
                        <input type="number" min="1" value={depenseForm.montant} onChange={e => setDepenseForm(f => ({ ...f, montant: e.target.value }))}
                          placeholder="0"
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Catégorie" : "Category"}</label>
                        <select value={depenseForm.categorie} onChange={e => setDepenseForm(f => ({ ...f, categorie: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" }}>
                          {CATEG_DEPENSES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Date *" : "Date *"}</label>
                        <input type="date" value={depenseForm.date_depense} onChange={e => setDepenseForm(f => ({ ...f, date_depense: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang === "fr" ? "Description (optionnel)" : "Description (optional)"}</label>
                      <textarea value={depenseForm.description} onChange={e => setDepenseForm(f => ({ ...f, description: e.target.value }))}
                        rows={2} placeholder={lang === "fr" ? "Détails supplémentaires…" : "Additional details…"}
                        style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                    </div>
                    <button onClick={handleSaveDepense} disabled={depenseLoading}
                      style={{ padding: "10px 24px", background: "#16a085", color: "white", border: "none", borderRadius: "8px", cursor: depenseLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", opacity: depenseLoading ? 0.7 : 1 }}>
                      {depenseLoading ? (lang === "fr" ? "Enregistrement…" : "Saving…") : depenseEditId !== null ? (lang === "fr" ? "Mettre à jour" : "Update") : (lang === "fr" ? "Enregistrer la dépense" : "Save expense")}
                    </button>
                  </div>
                )}

                {(() => {
                  const filteredDep = depenses.filter(d => {
                    const q = depensesSearch.toLowerCase();
                    return !q || (d.libelle||"").toLowerCase().includes(q) || (d.categorie||"").toLowerCase().includes(q) || (d.description||"").toLowerCase().includes(q);
                  });
                  const categColors = { "Alimentation":"#e67e22","Transport":"#3498db","Location / Loyer":"#8e44ad","Salaires / Honoraires":"#27ae60","Communication":"#2980b9","Matériel":"#7f8c8d","Événement":"#e91e63","Autre":"#95a5a6" };
                  return filteredDep.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px 0", color: "#7f8c8d" }}>
                      <div style={{ fontSize: "40px", marginBottom: "10px" }}>💸</div>
                      <p style={{ margin: 0 }}>{lang === "fr" ? "Aucune dépense trouvée." : "No expenses found."}</p>
                    </div>
                  ) : (
                    <div style={styles.tableContainer}>
                      <table style={{ ...styles.table, tableLayout: "auto" }}>
                        <thead>
                          <tr>
                            <th style={styles.th}>{lang === "fr" ? "Date" : "Date"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Libellé" : "Label"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Catégorie" : "Category"}</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>{lang === "fr" ? "Montant" : "Amount"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Description" : "Description"}</th>
                            <th style={styles.th}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDep.map((d, i) => {
                            const c = categColors[d.categorie] || "#95a5a6";
                            return (
                              <tr key={d.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                                <td style={{ ...styles.td, fontSize: "13px", whiteSpace: "nowrap", color: "#7f8c8d" }}>{new Date(d.date_depense).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</td>
                                <td style={{ ...styles.td, fontWeight: "600", color: "#2c3e50" }}>{d.libelle}</td>
                                <td style={styles.td}><span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "10px", background: c + "22", color: c, fontSize: "11px", fontWeight: "700", border: `1px solid ${c}44`, whiteSpace: "nowrap" }}>{d.categorie}</span></td>
                                <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#e74c3c", whiteSpace: "nowrap" }}>{Number(d.montant).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} FCFA</td>
                                <td style={{ ...styles.td, fontSize: "13px", color: "#7f8c8d", maxWidth: "220px", wordBreak: "break-word" }}>{d.description || "—"}</td>
                                <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                                  <button onClick={() => { setDepenseEditId(d.id); setDepenseForm({ libelle: d.libelle, montant: String(d.montant), categorie: d.categorie, date_depense: d.date_depense, description: d.description || "" }); setDepenseFormVisible(true); setDepenseError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                    style={{ ...styles.actionBtn, marginRight: "6px" }}><Icon name="edit" size={14} /></button>
                                  <button onClick={() => handleDeleteDepense(d.id)} style={styles.actionDeleteBtn}><Icon name="trash" size={14} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f0f4f8" }}>
                            <td colSpan={3} style={{ ...styles.td, fontWeight: "700", color: "#2c3e50" }}>Total</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "800", color: "#e74c3c", fontSize: "15px" }}>{filteredDep.reduce((s,d)=>s+Number(d.montant),0).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ══ ONGLET LIVRE DE CAISSE ══ */}
            {comptaSousOnglet === "livre" && (() => {
              const fmt = n => Number(n).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "#2c3e50" }}>
                        📒 {lang === "fr" ? "Journal général (livre de caisse)" : "General ledger (cash book)"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "3px" }}>
                        {lang === "fr" ? "Toutes les opérations dans l'ordre chronologique avec le solde cumulatif" : "All operations in chronological order with running balance"}
                      </div>
                    </div>
                    <button onClick={exportExcelFinancier}
                      style={{ ...styles.addBtn, background: "#16a34a" }}>
                      <Icon name="download" size={14} /> {lang === "fr" ? "Exporter Excel" : "Export Excel"}
                    </button>
                  </div>
                  {livreData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c8d" }}>
                      <div style={{ fontSize: "40px", marginBottom: "10px" }}>📒</div>
                      <p style={{ margin: 0 }}>{lang === "fr" ? "Aucune opération enregistrée." : "No operations recorded."}</p>
                    </div>
                  ) : (
                    <div style={styles.tableContainer}>
                      <table style={{ ...styles.table, tableLayout: "auto" }}>
                        <thead>
                          <tr>
                            <th style={styles.th}>{lang === "fr" ? "Date" : "Date"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Type" : "Type"}</th>
                            <th style={styles.th}>{lang === "fr" ? "Libellé" : "Label"}</th>
                            <th style={{ ...styles.th, textAlign: "right", color: "#27ae60" }}>{lang === "fr" ? "Entrée" : "Income"}</th>
                            <th style={{ ...styles.th, textAlign: "right", color: "#e74c3c" }}>{lang === "fr" ? "Sortie" : "Expense"}</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Solde</th>
                          </tr>
                        </thead>
                        <tbody>
                          {livreData.map((l, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                              <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d", whiteSpace: "nowrap" }}>
                                {l.date ? new Date(l.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "—"}
                              </td>
                              <td style={styles.td}>
                                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700",
                                  background: l.type === "Recette" ? "#eafaf1" : "#fef0f0",
                                  color: l.type === "Recette" ? "#27ae60" : "#e74c3c",
                                  border: `1px solid ${l.type === "Recette" ? "#27ae6044" : "#e74c3c44"}` }}>
                                  {l.type === "Recette" ? "↑" : "↓"} {l.type}
                                </span>
                              </td>
                              <td style={{ ...styles.td, maxWidth: "280px", wordBreak: "break-word" }}>{l.libelle}</td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: l.entree > 0 ? "#27ae60" : "#bdc3c7", whiteSpace: "nowrap" }}>
                                {l.entree > 0 ? `+${fmt(l.entree)}` : ""}
                              </td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: l.sortie > 0 ? "#e74c3c" : "#bdc3c7", whiteSpace: "nowrap" }}>
                                {l.sortie > 0 ? `-${fmt(l.sortie)}` : ""}
                              </td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "800", whiteSpace: "nowrap",
                                color: l.solde >= 0 ? "#2980b9" : "#e74c3c" }}>
                                {fmt(l.solde)} FCFA
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f0f4f8" }}>
                            <td colSpan={3} style={{ ...styles.td, fontWeight: "700", color: "#2c3e50" }}>
                              {lang === "fr" ? "Solde final" : "Final balance"}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#27ae60" }}>
                              +{fmt(livreData.reduce((s, l) => s + l.entree, 0))} FCFA
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#e74c3c" }}>
                              -{fmt(livreData.reduce((s, l) => s + l.sortie, 0))} FCFA
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "800", fontSize: "15px",
                              color: livreData[livreData.length - 1]?.solde >= 0 ? "#2980b9" : "#e74c3c" }}>
                              {fmt(livreData[livreData.length - 1]?.solde ?? 0)} FCFA
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ ONGLET TRÉSORERIE ══ */}
            {comptaSousOnglet === "tresorerie" && (
              <div>
                {/* Carte solde */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                  {[
                    { label: lang==="fr"?"Recettes totales":"Total revenue", value: comptaResume.recettes, color: "#27ae60", bg: "#eafaf1", icon: "↑" },
                    { label: lang==="fr"?"Dépenses totales":"Total expenses", value: comptaResume.depenses, color: "#e74c3c", bg: "#fef0f0", icon: "↓" },
                    { label: lang==="fr"?"Solde disponible":"Available balance", value: comptaResume.solde, color: comptaResume.solde>=0?"#2980b9":"#e74c3c", bg: comptaResume.solde>=0?"#eaf4fb":"#fef0f0", icon: "=" },
                  ].map(({label,value,color,bg,icon}) => (
                    <div key={label} style={{ background: bg, border: `2px solid ${color}33`, borderRadius: "14px", padding: "22px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: "28px", fontWeight: "900", color, marginBottom: "4px" }}>{icon}</div>
                      <div style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{label}</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color }}>{Number(value).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</div>
                    </div>
                  ))}
                </div>

                {/* Graphique SVG évolution mensuelle */}
                {evolution.length > 0 && (() => {
                  const data = evolution.slice(-6);
                  const maxVal = Math.max(...data.map(e => Math.max(e.recettes, e.depenses)), 1);
                  const chartH = 100, barW = 18, gap = 6, groupGap = 14, padL = 4, padB = 22;
                  const moisFr = m => { const [,mo] = m.split("-"); return ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"][parseInt(mo)-1]; };
                  const totalW = padL + data.length * (barW * 2 + gap + groupGap);
                  return (
                    <div style={{ background: "white", border: "1.5px solid #e0e6ed", borderRadius: "14px", padding: "20px 24px", marginBottom: "28px" }}>
                      <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px", marginBottom: "16px" }}>
                        {lang==="fr"?"Évolution mensuelle (6 derniers mois)":"Monthly evolution (last 6 months)"}
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <svg width={Math.max(totalW, 300)} height={chartH + padB + 10} style={{ display: "block" }}>
                          {data.map((e, i) => {
                            const x = padL + i * (barW * 2 + gap + groupGap);
                            const hRec = Math.round((e.recettes / maxVal) * chartH);
                            const hDep = Math.round((e.depenses / maxVal) * chartH);
                            return (
                              <g key={e.mois}>
                                <rect x={x} y={chartH - hRec} width={barW} height={hRec} fill="#27ae60" rx="3" opacity="0.85" />
                                <rect x={x + barW + gap} y={chartH - hDep} width={barW} height={hDep} fill="#e74c3c" rx="3" opacity="0.85" />
                                <text x={x + barW} y={chartH + padB - 2} textAnchor="middle" fontSize="10" fill="#7f8c8d">{moisFr(e.mois)}</text>
                              </g>
                            );
                          })}
                          <line x1={0} y1={chartH} x2={totalW} y2={chartH} stroke="#e0e6ed" strokeWidth="1" />
                        </svg>
                      </div>
                      <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "12px", height: "12px", background: "#27ae60", borderRadius: "3px", display: "inline-block" }} />{lang==="fr"?"Recettes":"Revenue"}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "12px", height: "12px", background: "#e74c3c", borderRadius: "3px", display: "inline-block" }} />{lang==="fr"?"Dépenses":"Expenses"}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Budgets */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#2c3e50" }}>🎯 {lang==="fr"?"Budgets":"Budgets"} ({budgets.length})</div>
                  <button onClick={() => { setBudgetFormVisible(v => !v); setBudgetEditId(null); setBudgetForm({ libelle: "", montant_prevu: "", date_debut: "", date_fin: "" }); setBudgetError(""); }}
                    style={{ padding: "9px 20px", background: "#16a085", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                    {budgetFormVisible && budgetEditId === null ? (lang==="fr"?"✕ Annuler":"✕ Cancel") : (lang==="fr"?"+ Créer un budget":"+ Create budget")}
                  </button>
                </div>
                {budgetFormVisible && (
                  <div style={{ background: "#f0faf8", border: "1.5px solid #16a08533", borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#16a085" }}>{budgetEditId !== null ? (lang==="fr"?"Modifier le budget":"Edit budget") : (lang==="fr"?"Nouveau budget":"New budget")}</h3>
                    {budgetError && <div style={{ background: "#fef0f0", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>{budgetError}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang==="fr"?"Intitulé *":"Budget name *"}</label>
                        <input value={budgetForm.libelle} onChange={e => setBudgetForm(f=>({...f,libelle:e.target.value}))} placeholder={lang==="fr"?"Ex: Budget 2026":"Ex: Budget 2026"} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e0e6ed",borderRadius:"8px",fontSize:"13px",outline:"none",boxSizing:"border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang==="fr"?"Montant prévu (FCFA) *":"Planned (FCFA) *"}</label>
                        <input type="number" min="1" value={budgetForm.montant_prevu} onChange={e => setBudgetForm(f=>({...f,montant_prevu:e.target.value}))} placeholder="0" style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e0e6ed",borderRadius:"8px",fontSize:"13px",outline:"none",boxSizing:"border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang==="fr"?"Date début":"Start date"}</label>
                        <input type="date" value={budgetForm.date_debut} onChange={e => setBudgetForm(f=>({...f,date_debut:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e0e6ed",borderRadius:"8px",fontSize:"13px",outline:"none",boxSizing:"border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", display: "block", marginBottom: "4px" }}>{lang==="fr"?"Date fin":"End date"}</label>
                        <input type="date" value={budgetForm.date_fin} onChange={e => setBudgetForm(f=>({...f,date_fin:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e0e6ed",borderRadius:"8px",fontSize:"13px",outline:"none",boxSizing:"border-box" }} />
                      </div>
                    </div>
                    <button onClick={handleSaveBudget} disabled={budgetLoading} style={{ padding:"10px 24px",background:budgetLoading?"#95a5a6":"#16a085",color:"white",border:"none",borderRadius:"8px",cursor:budgetLoading?"not-allowed":"pointer",fontWeight:"700",fontSize:"13px",opacity:budgetLoading?0.7:1 }}>
                      {budgetLoading ? (lang==="fr"?"Enregistrement…":"Saving…") : (budgetEditId !== null ? (lang==="fr"?"Mettre à jour":"Update") : (lang==="fr"?"Créer le budget":"Create budget"))}
                    </button>
                  </div>
                )}
                {budgets.length === 0 && !budgetFormVisible ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#7f8c8d" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎯</div>
                    <p style={{ margin: 0 }}>{lang==="fr"?"Aucun budget défini.":"No budget defined."}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {budgets.map(b => {
                      const pct = Math.min(100, b.montant_prevu > 0 ? Math.round((b.depenses_reelles / b.montant_prevu) * 100) : 0);
                      const isOver = b.depenses_reelles > b.montant_prevu;
                      const barColor = isOver ? "#e74c3c" : pct > 80 ? "#e67e22" : "#27ae60";
                      return (
                        <div key={b.id} style={{ background: "white", border: "1.5px solid #e0e6ed", borderRadius: "12px", padding: "18px 22px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "15px", color: "#2c3e50" }}>{b.libelle}</div>
                              {(b.date_debut || b.date_fin) && (
                                <div style={{ fontSize: "12px", color: "#95a5a6", marginTop: "2px" }}>
                                  {b.date_debut ? new Date(b.date_debut).toLocaleDateString(lang==="fr"?"fr-FR":"en-US") : "…"} → {b.date_fin ? new Date(b.date_fin).toLocaleDateString(lang==="fr"?"fr-FR":"en-US") : "…"}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => { setBudgetEditId(b.id); setBudgetForm({ libelle: b.libelle, montant_prevu: String(b.montant_prevu), date_debut: b.date_debut||"", date_fin: b.date_fin||"" }); setBudgetFormVisible(true); setBudgetError(""); }}
                                style={styles.actionBtn}>
                                <Icon name="edit" size={14} />
                              </button>
                              <button onClick={() => handleDeleteBudget(b.id)} style={styles.actionDeleteBtn}><Icon name="trash" size={14} /></button>
                            </div>
                          </div>
                          <div style={{ height: "10px", background: "#ecf0f1", borderRadius: "5px", overflow: "hidden", marginBottom: "8px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "5px", transition: "width 0.5s ease" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", flexWrap: "wrap", gap: "4px" }}>
                            <span style={{ color: "#e74c3c", fontWeight: "600" }}>{lang==="fr"?"Dépensé :":"Spent:"} {Number(b.depenses_reelles).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</span>
                            <span style={{ color: "#7f8c8d" }}>{lang==="fr"?"Budget :":"Budget:"} {Number(b.montant_prevu).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</span>
                            <span style={{ fontWeight: "700", color: barColor }}>{pct}% {isOver ? "⚠️" : ""}</span>
                          </div>
                          {isOver && (
                            <div style={{ marginTop: "8px", background: "#fef0f0", color: "#c0392b", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                              {lang==="fr"?`Dépassement de ${(b.depenses_reelles-b.montant_prevu).toLocaleString("fr-FR")} FCFA`:`Over by ${(b.depenses_reelles-b.montant_prevu).toLocaleString("en-US")} FCFA`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ ONGLET RAPPORTS ══ */}
            {comptaSousOnglet === "rapports" && (
              <div>
                {/* Résumé rapide */}
                <div style={{ background: "linear-gradient(135deg,#1a2a3a,#2c3e50)", borderRadius: "14px", padding: "24px 28px", marginBottom: "24px", color: "white" }}>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "16px" }}>📊 {lang==="fr"?"Résumé financier complet":"Full financial summary"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "14px" }}>
                    {[
                      { label: lang==="fr"?"Recettes":"Revenue", value: comptaResume.recettes, color: "#2ecc71" },
                      { label: lang==="fr"?"Dépenses":"Expenses", value: comptaResume.depenses, color: "#e74c3c" },
                      { label: "Solde", value: comptaResume.solde, color: comptaResume.solde>=0?"#3498db":"#e74c3c" },
                      { label: lang==="fr"?"Transactions":"Transactions", value: historiqueTransactions.length, color: "#f39c12", isCnt: true },
                    ].map(({label,value,color,isCnt}) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px 16px" }}>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color }}>{isCnt ? value : `${Number(value).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA`}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boutons d'export */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
                  <button onClick={genererRapportPDF}
                    style={{ padding: "11px 22px", background: "#dc2626", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px" }}>
                    <Icon name="save" size={14} /> {lang==="fr"?"Télécharger le rapport PDF":"Download PDF report"}
                  </button>
                  <button onClick={exportExcelFinancier}
                    style={{ ...styles.addBtn, background: "#16a34a" }}>
                    <Icon name="download" size={14} /> {lang==="fr"?"Exporter en Excel (4 feuilles)":"Export to Excel (4 sheets)"}
                  </button>
                </div>

                {/* Tableau récapitulatif par mois */}
                {evolution.length > 0 && (
                  <div style={{ background: "white", border: "1.5px solid #e0e6ed", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
                    <div style={{ padding: "14px 20px", background: "#f7f9fc", borderBottom: "1px solid #e0e6ed", fontWeight: "700", color: "#2c3e50", fontSize: "14px" }}>
                      {lang==="fr"?"Détail mensuel":"Monthly breakdown"}
                    </div>
                    <table style={{ ...styles.table, tableLayout: "auto" }}>
                      <thead>
                        <tr>
                          <th style={styles.th}>{lang==="fr"?"Mois":"Month"}</th>
                          <th style={{ ...styles.th, textAlign: "right", color: "#27ae60" }}>{lang==="fr"?"Recettes":"Revenue"}</th>
                          <th style={{ ...styles.th, textAlign: "right", color: "#e74c3c" }}>{lang==="fr"?"Dépenses":"Expenses"}</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evolution.map((e, i) => {
                          const s = e.recettes - e.depenses;
                          const [yr, mo] = e.mois.split("-");
                          const nomsMois = lang==="fr" ? ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"] : ["January","February","March","April","May","June","July","August","September","October","November","December"];
                          return (
                            <tr key={e.mois} style={{ background: i%2===0?"#f9f9f9":"#fff" }}>
                              <td style={{ ...styles.td, fontWeight: "600" }}>{nomsMois[parseInt(mo)-1]} {yr}</td>
                              <td style={{ ...styles.td, textAlign: "right", color: "#27ae60", fontWeight: "600" }}>{Number(e.recettes).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</td>
                              <td style={{ ...styles.td, textAlign: "right", color: "#e74c3c", fontWeight: "600" }}>{Number(e.depenses).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: s>=0?"#2980b9":"#e74c3c" }}>{Number(s).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Taux de recouvrement par période */}
                {recouvrementData.length > 0 && (
                  <div style={{ background: "white", border: "1.5px solid #e0e6ed", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", background: "#f0f0f8", borderBottom: "1px solid #e0e6ed", fontWeight: "700", color: "#2c3e50", fontSize: "14px" }}>
                      🎯 {lang==="fr"?"Taux de recouvrement par période de cotisation":"Recovery rate by contribution period"}
                    </div>
                    <table style={{ ...styles.table, tableLayout: "auto" }}>
                      <thead>
                        <tr>
                          <th style={styles.th}>{lang==="fr"?"Période":"Period"}</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>{lang==="fr"?"Attendus":"Expected"}</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>{lang==="fr"?"Ont payé":"Paid"}</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>{lang==="fr"?"Taux":"Rate"}</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>{lang==="fr"?"Montant collecté":"Amount collected"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recouvrementData.map((r, i) => {
                          const pct = r.taux;
                          const barColor = pct >= 80 ? "#27ae60" : pct >= 50 ? "#e67e22" : "#e74c3c";
                          return (
                            <tr key={r.id} style={{ background: i%2===0?"#f9f9f9":"#fff" }}>
                              <td style={{ ...styles.td, fontWeight: "600" }}>{r.libelle}</td>
                              <td style={{ ...styles.td, textAlign: "right", color: "#7f8c8d" }}>{r.attendus}</td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                <span style={{ fontWeight: "700", color: barColor }}>{r.payes_complets}</span>
                                {r.ont_paye > r.payes_complets && <span style={{ fontSize: "11px", color: "#e67e22", marginLeft: "4px" }}>(+{r.ont_paye - r.payes_complets} {lang==="fr"?"partiel":"partial"})</span>}
                              </td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                                  <div style={{ width: "60px", height: "8px", background: "#ecf0f1", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "4px" }} />
                                  </div>
                                  <span style={{ fontWeight: "800", color: barColor, minWidth: "36px", textAlign: "right" }}>{pct}%</span>
                                </div>
                              </td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#27ae60", whiteSpace: "nowrap" }}>
                                {Number(r.montant_collecte).toLocaleString(lang==="fr"?"fr-FR":"en-US")} FCFA
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL REÇU ──────────────────────────────────────── */}
      {showRecu && lastPaiement && (
        <div style={styles.modalOverlay}>
          <div className="modal-box" style={{ background: "white", borderRadius: "12px", width: "520px", maxWidth: "min(96vw, 520px)", maxHeight: "calc(100vh - 40px)", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 20px 0", background: "#f7f9fc", borderRadius: "12px 12px 0 0" }}>
              <button onClick={handlePrintRecu} style={{ padding: "8px 18px", background: "#2c3e50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>{t("printBtn")}</button>
              <button onClick={() => setShowRecu(false)} style={{ padding: "8px 18px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>{t("closeBtn")}</button>
            </div>
            <div ref={recuRef} style={{ padding: "30px" }}>
              <div style={{ textAlign: "center", borderBottom: "3px double #2c3e50", paddingBottom: "18px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <img src={logo} alt="Logo" style={{ height: "52px", width: "52px", objectFit: "contain" }} />
                  <h1 style={{ margin: 0, fontSize: "26px", color: "#2c3e50", letterSpacing: "3px", textTransform: "uppercase" }}>Cotisation Pro</h1>
                </div>
                <p style={{ margin: "6px 0 0", color: "#7f8c8d", fontSize: "13px" }}>{t("officialReceipt")}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "22px", fontSize: "13px", color: "#7f8c8d" }}>
                <span>{t("receiptNLabel")} <strong style={{ color: "#2c3e50" }}>{lastPaiement.numeroRecu}</strong></span>
                <span>{t("dateLabel")} <strong style={{ color: "#2c3e50" }}>{lastPaiement.datePaiement}</strong></span>
              </div>
              <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
                <h3 style={styles.recuSectionTitle}>{t("memberInfoTitle")}</h3>
                <div style={styles.recuRow}><span>{t("matricule")}</span><strong>{lastPaiement.matricule}</strong></div>
                <div style={styles.recuRow}><span>{t("nameTh")}</span><strong>{lastPaiement.nom}</strong></div>
                <div style={styles.recuRow}><span>{t("surnameTh")}</span><strong>{lastPaiement.prenom}</strong></div>
                <div style={styles.recuRow}><span>{t("telephoneTh")}</span><strong>{lastPaiement.telephone}</strong></div>
                <div style={styles.recuRow}><span>{t("emailTh")}</span><strong>{lastPaiement.email}</strong></div>
              </div>
              <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
                <h3 style={styles.recuSectionTitle}>{t("paymentDetailsTitle")}</h3>
                <div style={styles.recuRow}><span>{t("concernedPeriod")}</span><strong>{periodeLabel(lastPaiement.periode)}</strong></div>
                <div style={styles.recuRow}><span>{t("paymentMethodTitle")}</span><strong>{modeLabel(lastPaiement.modePaiement)}</strong></div>
                <div style={styles.recuRow}><span>{t("montantDuTitle")}</span><strong>{lastPaiement.montantDu}</strong></div>
                <div style={styles.recuRow}><span>{t("alreadyPaidTitle")}</span><strong>{lastPaiement.dejaPaye}</strong></div>
                <div style={{ ...styles.recuRow, background: "#eafaf1", borderRadius: "6px", padding: "8px", margin: "6px 0" }}>
                  <span>{t("thisPaymentTitle")}</span><strong style={{ color: "#27ae60", fontSize: "16px" }}>{lastPaiement.montantPaye}</strong>
                </div>
                <div style={styles.recuRow}><span>{t("totalPaidTitle")}</span><strong style={{ color: "#2980b9" }}>{lastPaiement.totalPaye}</strong></div>
                <div style={styles.recuRow}><span>{t("remainingTitle")}</span><strong style={{ color: "#e74c3c" }}>{lastPaiement.reste}</strong></div>
              </div>
              <div style={{ textAlign: "center", background: statutBg(lastPaiement.statut), border: `2px solid ${statutColor(lastPaiement.statut)}`, borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: statutColor(lastPaiement.statut) }}>
                  {t("statusTitle")} {statutLabel(lastPaiement.statut).toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#bdc3c7", borderTop: "1px solid #ecf0f1", paddingTop: "14px" }}>
                <p style={{ margin: 0 }}>{t("autoGenerated")}</p>
                <p style={{ margin: "4px 0 0" }}>{t("receiptProof")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER EMAIL ─────────────────────────────── */}
      {showChangeEmail && (
        <div style={styles.modalOverlay} onClick={() => setShowChangeEmail(false)}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "420px", maxWidth: "94vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#2c3e50" }}>✉️ {t("changeEmailTitle")}</h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#95a5a6" }}>
              {changeEmailStep === 1 ? t("changeEmailStep1Label") : t("changeEmailStep2Label")}
            </p>

            {changeEmailSuccess ? (
              <>
                <div style={{ background: "#d5f5e3", border: "1px solid #27ae60", borderRadius: "8px", padding: "16px", textAlign: "center", color: "#1e8449", fontWeight: "600", marginBottom: "20px" }}>
                  ✅ {t("changeEmailSuccess")}
                </div>
                <div style={{ textAlign: "right" }}>
                  <button style={{ padding: "10px 24px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    onClick={() => setShowChangeEmail(false)}>
                    {t("aboutClose")}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleChangeEmail}>
                {changeEmailError && (
                  <div style={{ background: "#ffecec", color: "#b02a2a", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>
                    ⚠️ {changeEmailError}
                  </div>
                )}

                {changeEmailStep === 1 ? (
                  <>
                    <div style={{ marginBottom: "8px", padding: "10px 14px", background: "#f0f8ff", borderRadius: "8px", fontSize: "13px", color: "#2c3e50" }}>
                      <span style={{ color: "#7f8c8d" }}>{t("currentEmailLabel")} : </span>
                      <strong>{compte.email}</strong>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("newEmailLabel")}</label>
                      <input
                        type="email"
                        value={changeEmailForm.email}
                        onChange={(e) => setChangeEmailForm(f => ({ ...f, email: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                        placeholder="nouvelle@email.com"
                        autoFocus
                      />
                    </div>
                    <div style={{ marginBottom: "18px" }}>
                      <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("password")}</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showChangeEmailPwd ? "text" : "password"}
                          value={changeEmailForm.mot_de_passe}
                          onChange={(e) => setChangeEmailForm(f => ({ ...f, mot_de_passe: e.target.value }))}
                          style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                          placeholder={t("yourPassword")}
                        />
                        <button type="button" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d", padding: "4px" }}
                          onClick={() => setShowChangeEmailPwd(v => !v)}>
                          {showChangeEmailPwd ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: "18px" }}>
                    <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#2c3e50", lineHeight: "1.5" }}>
                      {t("changeEmailCodeSentTo")} <strong>{changeEmailForm.email}</strong>.
                      <br /><span style={{ fontSize: "12px", color: "#95a5a6" }}>{t("otpExpires")}</span>
                    </p>
                    <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("changeEmailEnterCode")}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={changeEmailOtp}
                      onChange={(e) => setChangeEmailOtp(e.target.value.replace(/\D/g, ""))}
                      style={{ width: "100%", padding: "12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "22px", textAlign: "center", letterSpacing: "12px", fontWeight: "700", boxSizing: "border-box", outline: "none" }}
                      placeholder="----"
                      autoFocus
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  {changeEmailStep === 2 && (
                    <button type="button" style={{ padding: "10px 18px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                      onClick={() => { setChangeEmailStep(1); setChangeEmailError(""); setChangeEmailOtp(""); }}>
                      ←
                    </button>
                  )}
                  <button type="button" style={{ padding: "10px 18px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    onClick={() => setShowChangeEmail(false)}>
                    {t("cancel")}
                  </button>
                  <button type="submit" disabled={changeEmailLoading}
                    style={{ padding: "10px 20px", background: changeEmailLoading ? "#95a5a6" : "#3498db", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: changeEmailLoading ? "not-allowed" : "pointer" }}>
                    {changeEmailLoading ? "..." : changeEmailStep === 1 ? t("changeEmailSendCode") : t("changeEmailConfirm")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER MOT DE PASSE ─────────────────────── */}
      {showChangePwd && (
        <div style={styles.modalOverlay} onClick={() => setShowChangePwd(false)}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "400px", maxWidth: "94vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#2c3e50" }}>✏️ {t("changePwdTitle")}</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#95a5a6" }}>
              {changePwdStep === 1 ? t("changePwdStep1Label") : t("changePwdStep2Label")}
            </p>
            {changePwdSuccessMsg ? (
              <div style={{ background: "#d5f5e3", border: "1px solid #27ae60", borderRadius: "8px", padding: "16px", textAlign: "center", color: "#1e8449", fontWeight: "600", marginBottom: "16px" }}>
                ✅ {t("changePwdSuccess")}
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                {changePwdError && (
                  <div style={{ background: "#ffecec", color: "#b02a2a", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>
                    ⚠️ {changePwdError}
                  </div>
                )}
                {changePwdStep === 1 ? (
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("oldPassword")}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showOldPwd ? "text" : "password"}
                        value={changePwdForm.ancien}
                        onChange={(e) => setChangePwdForm(f => ({ ...f, ancien: e.target.value.trimStart() }))}
                        style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button type="button" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d", padding: "4px" }} onClick={() => setShowOldPwd(v => !v)}>
                        {showOldPwd ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("newPassword")}</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showNewPwd2 ? "text" : "password"}
                          value={changePwdForm.nouveau}
                          onChange={(e) => setChangePwdForm(f => ({ ...f, nouveau: e.target.value.trimStart() }))}
                          style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                          placeholder={t("minChars")}
                          autoFocus
                        />
                        <button type="button" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d", padding: "4px" }} onClick={() => setShowNewPwd2(v => !v)}>
                          {showNewPwd2 ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: "18px" }}>
                      <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#2c3e50", marginBottom: "6px" }}>{t("confirmPassword")}</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPwd2 ? "text" : "password"}
                          value={changePwdForm.confirmer}
                          onChange={(e) => setChangePwdForm(f => ({ ...f, confirmer: e.target.value.trimStart() }))}
                          style={{ width: "100%", padding: "10px 44px 10px 12px", border: "1.5px solid #bdc3c7", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                          placeholder={t("repeatPassword")}
                        />
                        <button type="button" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7f8c8d", padding: "4px" }} onClick={() => setShowConfirmPwd2(v => !v)}>
                          {showConfirmPwd2 ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  {changePwdStep === 2 && (
                    <button type="button" style={{ padding: "10px 20px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                      onClick={() => { setChangePwdStep(1); setChangePwdError(""); }}>
                      ← {t("backToPrevStep").replace("← ", "")}
                    </button>
                  )}
                  <button type="button" style={{ padding: "10px 20px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    onClick={() => setShowChangePwd(false)}>
                    {t("cancel")}
                  </button>
                  <button type="submit" disabled={changePwdLoading}
                    style={{ padding: "10px 22px", background: changePwdLoading ? "#95a5a6" : "#3498db", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: changePwdLoading ? "not-allowed" : "pointer" }}>
                    {changePwdLoading ? t("saving") : changePwdStep === 1 ? t("changePwdNext") : t("changePwdBtn")}
                  </button>
                </div>
              </form>
            )}
            {changePwdSuccessMsg && (
              <div style={{ textAlign: "right" }}>
                <button style={{ padding: "10px 24px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                  onClick={() => setShowChangePwd(false)}>
                  {t("cancel").replace("Annuler", "Fermer").replace("Cancel", "Close")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL AIDE ───────────────────────────────────────── */}
      {showHelp && (() => {
        const helpSections = [
          { key: 0, color: "#3498db", bg: "#eaf4fb", title: t("helpSection1Title"), steps: t("helpSection1Steps") },
          { key: 1, color: "#27ae60", bg: "#eafaf1", title: t("helpSection2Title"), steps: t("helpSection2Steps") },
          { key: 2, color: "#e67e22", bg: "#fef9f0", title: t("helpSection3Title"), steps: t("helpSection3Steps") },
          { key: 3, color: "#9b59b6", bg: "#f5eef8", title: t("helpSection4Title"), steps: t("helpSection4Steps") },
        ];
        const active = helpSection !== null ? helpSections[helpSection] : null;
        return (
          <div style={styles.modalOverlay} onClick={() => { setShowHelp(false); setHelpSection(null); }}>
            <div style={{ background: "white", borderRadius: "14px", padding: "28px 32px", width: "520px", maxWidth: "96vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>

              {/* En-tête */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                {active ? (
                  <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#3498db", fontWeight: "700", fontFamily: "inherit", padding: 0 }}
                    onClick={() => setHelpSection(null)}>
                    ← {lang === "fr" ? "Retour" : "Back"}
                  </button>
                ) : (
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#2c3e50" }}>
                    {lang === "fr" ? "Aide — Guide d'utilisation" : "Help — User Guide"}
                  </h3>
                )}
                <button style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7f8c8d", lineHeight: 1 }}
                  onClick={() => { setShowHelp(false); setHelpSection(null); }}>✕</button>
              </div>

              {/* Vue liste des 4 cartes */}
              {!active && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {helpSections.map(({ key, color, bg, title }) => (
                    <button key={key}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: bg, border: `1.5px solid ${color}22`, borderRadius: "10px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "box-shadow 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}33`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                      onClick={() => setHelpSection(key)}
                    >
                      <span style={{ fontSize: "15px", fontWeight: "700", color }}>{title}</span>
                      <span style={{ fontSize: "18px", color, opacity: 0.7 }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Vue détail d'une section */}
              {active && (
                <div>
                  <h4 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700", color: active.color, borderLeft: `4px solid ${active.color}`, paddingLeft: "12px" }}>{active.title}</h4>
                  <ol style={{ margin: 0, paddingLeft: "20px" }}>
                    {active.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: "12px", fontSize: "14px", color: "#2c3e50", lineHeight: "1.6", background: active.bg, padding: "10px 14px", borderRadius: "8px", listStyle: "none", display: "flex", gap: "10px" }}>
                        <span style={{ minWidth: "24px", height: "24px", background: active.color, color: "white", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div style={{ textAlign: "right", marginTop: "20px" }}>
                    <button style={{ padding: "10px 28px", background: active.color, color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                      onClick={() => setHelpSection(null)}>
                      ← {lang === "fr" ? "Retour" : "Back"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── MODAL À PROPOS ───────────────────────────────────── */}
      {showAbout && (
        <div style={styles.modalOverlay} onClick={() => setShowAbout(false)}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "480px", maxWidth: "96vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img src={logo} alt="Logo" style={{ height: "64px", width: "64px", objectFit: "cover", borderRadius: "50%", marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#2c3e50" }}>Cotisation Pro</h3>
              <span style={{ fontSize: "12px", color: "#95a5a6", background: "#ecf0f1", padding: "3px 10px", borderRadius: "12px" }}>v{t("aboutVersionNum")}</span>
            </div>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.65", margin: "0 0 24px", textAlign: "justify" }}>{t("aboutAppDesc")}</p>
            <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "#95a5a6" }}>{t("aboutDeveloper")}</p>
              <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700", color: "#2c3e50" }}>{t("aboutDevName")}</p>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#7f8c8d" }}>{t("aboutDevRole")}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#2980b9" }}>📧 {t("aboutDevEmail")} : {t("aboutDevEmailVal")}</p>
            </div>
            <div style={{ background: "#eaf6fd", borderRadius: "10px", padding: "12px 20px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "#95a5a6" }}>{t("aboutTechLabel")}</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#2980b9" }}>{t("aboutTechVal")}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button style={{ padding: "10px 36px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }} onClick={() => setShowAbout(false)}>
                {t("aboutClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRE DE NAVIGATION BAS — MOBILE ────────────────── */}
      <nav className="bottom-nav">
        <button className={`bnav-item${page === "accueil" ? " bnav-active" : ""}`} onClick={() => setPage("accueil")}>
          <span className="bnav-label">{t("home")}</span>
        </button>
        <button className={`bnav-item${page === "adherents" ? " bnav-active" : ""}`} onClick={() => { setPage("adherents"); setShowUnpaidOnly(false); setShowUnpaidOrPartial(false); }}>
          <span className="bnav-label">{t("members")}</span>
        </button>
        <button className={`bnav-item${page === "cotisations" ? " bnav-active" : ""}`} onClick={() => setPage("cotisations")}>
          <span className="bnav-label">{t("contributions")}</span>
        </button>
        <button className={`bnav-item${page === "historique" ? " bnav-active" : ""}`} onClick={() => setPage("historique")}>
          <span className="bnav-label">{t("history")}</span>
        </button>
        {canActAsTresorier && (
          <button className={`bnav-item${page === "comptabilite" ? " bnav-active" : ""}`} onClick={() => { setPage("comptabilite"); loadComptabilite(); }}>
            <span className="bnav-label">{lang === "fr" ? "Compta" : "Accounting"}</span>
          </button>
        )}

        <button className={`bnav-item${page === "messages" ? " bnav-active" : ""}`} style={{ position: "relative" }} onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}>
          <span className="bnav-label">{lang === "fr" ? "Messages" : "Messages"}</span>
          {adminMsgUnread > 0 && <span style={{ position: "absolute", top: "4px", right: "8px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{adminMsgUnread}</span>}
        </button>
        {isAdmin && (
          <button className={`bnav-item${page === "audit" ? " bnav-active" : ""}`} onClick={() => { setPage("audit"); setAuditOffset(0); setAuditActionFilter(""); loadAuditLogs(0, ""); }}>
            <span className="bnav-label">🔐 Audit</span>
          </button>
        )}
        <button className={`bnav-item${page === "bureau" ? " bnav-active" : ""}`} onClick={() => { setRoleTransferPoste(""); setRoleTransferTargetId(""); setRoleTransferError(""); setRoleTransferSuccess(""); setPage("bureau"); }}>
          <span className="bnav-label">🏛️ Bureau</span>
        </button>
        <button className={`bnav-item${mobileAccountOpen ? " bnav-active" : ""}`} onClick={() => setMobileAccountOpen(v => !v)}>
          <span className="bnav-label">{t("accountMenu")}</span>
        </button>
      </nav>

      {/* ── FICHE COMPTE MOBILE (bottom sheet) ──────────────── */}
      {mobileAccountOpen && (
        <div className="mobile-account-overlay" onClick={() => setMobileAccountOpen(false)}>
          <div className="mobile-account-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-account-header">
              <div>
                <div style={{ fontWeight: "700", color: "#fff", fontSize: "16px" }}>{compte.nom_association}</div>
                <div style={{ color: "#95a5a6", fontSize: "13px" }}>{compte.email}</div>
              </div>
              <button style={{ background: "none", border: "none", color: "#95a5a6", fontSize: "22px", cursor: "pointer", lineHeight: 1 }} onClick={() => setMobileAccountOpen(false)}>✕</button>
            </div>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-select mobile-sheet-lang">
              <option value="fr" style={{ background: "#1e2d3d" }}>🇫🇷 Français</option>
              <option value="en" style={{ background: "#1e2d3d" }}>🇬🇧 English</option>
            </select>
            {/* ─── Mon compte ─── */}
            <div style={{ padding: "10px 20px 4px", fontSize: "10px", fontWeight: "800", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {lang === "fr" ? "Mon compte" : "My account"}
            </div>
            <button className="mobile-sheet-btn" onClick={() => { loadProfil(); setPage("profil"); setMobileAccountOpen(false); }}>
              <Icon name="user" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{lang === "fr" ? "Mon profil" : "My Profile"}
            </button>
            <button className="mobile-sheet-btn" onClick={() => { loadMesCotisations(); setPage("mes-cotisations"); setMobileAccountOpen(false); }}>
              <Icon name="dollar" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{lang === "fr" ? "Mes cotisations" : "My Contributions"}
            </button>

            {/* ─── Sécurité ─── */}
            <div className="mobile-sheet-divider" />
            <div style={{ padding: "10px 20px 4px", fontSize: "10px", fontWeight: "800", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {lang === "fr" ? "Sécurité" : "Security"}
            </div>
            <button className="mobile-sheet-btn" onClick={() => { setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccessMsg(false); setShowChangePwd(true); setMobileAccountOpen(false); }}>
              <Icon name="key" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{t("changePassword")}
            </button>
            <button className="mobile-sheet-btn" onClick={() => { setChangeEmailStep(1); setChangeEmailForm({ email: "", mot_de_passe: "" }); setChangeEmailOtp(""); setChangeEmailError(""); setChangeEmailSuccess(false); setShowChangeEmail(true); setMobileAccountOpen(false); }}>
              <Icon name="mail" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{t("changeEmail")}
            </button>

            {/* ─── Assistance ─── */}
            <div className="mobile-sheet-divider" />
            <div style={{ padding: "10px 20px 4px", fontSize: "10px", fontWeight: "800", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {lang === "fr" ? "Assistance" : "Support"}
            </div>
            <button className="mobile-sheet-btn" onClick={() => { setHelpSection(null); setShowHelp(true); setMobileAccountOpen(false); }}>
              <Icon name="list" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{t("helpMenu")}
            </button>
            <button className="mobile-sheet-btn" onClick={() => { setShowAbout(true); setMobileAccountOpen(false); }}>
              <Icon name="info" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{t("aboutMenu")}
            </button>

            {/* ─── Déconnexion ─── */}
            <div className="mobile-sheet-divider" />
            <button className="mobile-sheet-btn mobile-sheet-logout" onClick={() => { setShowLogoutConfirm(true); setMobileAccountOpen(false); }}>
              <Icon name="logout" size={15} style={{ marginRight: "10px", opacity: 0.7 }} />{t("logout")}
            </button>
          </div>
        </div>
      )}


      {/* ── MODAL CONFIRMATION DÉCONNEXION ──────────────────── */}
      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "360px", maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#2c3e50" }}>{t("logoutTitle")}</h3>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#7f8c8d", lineHeight: "1.5" }}>{t("logoutConfirm")}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                style={{ padding: "11px 28px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t("cancel")}
              </button>
              <button
                style={{ padding: "11px 28px", background: "#c0392b", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
              >
                {t("logoutBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { fontFamily: "Arial", width: "100%", minHeight: "100vh", boxSizing: "border-box" },
  menu: { background: "#2c3e50", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  menuButtons: { display: "flex", gap: "10px" },
  btn: { padding: "10px 16px", background: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  content: { padding: "20px" },
  cards: { display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" },
  card: { padding: "20px", background: "#e0f3fc", textAlign: "center", minWidth: "180px", borderRadius: "8px" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap", letterSpacing: "0.2px" },
  alertButton: { marginLeft: "12px", padding: "8px 14px", background: "#2c3e50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  cancelBtn: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: "9px", cursor: "pointer", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" },
  actionBtn: { padding: "0", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", width: "34px", height: "34px", marginRight: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  actionDeleteBtn: { padding: "0", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", width: "34px", height: "34px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  errorMessage: { color: "#b02a2a", background: "#ffecec", padding: "12px", borderRadius: "8px", margin: "12px 0", display: "flex", alignItems: "center" },
  infoMessage: { color: "#2c3e50", background: "#ecf0f1", padding: "12px", borderRadius: "8px", margin: "12px 0" },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
  th: { background: "#2c3e50", color: "white", padding: "10px", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  td: { border: "1px solid #ccc", padding: "10px", overflow: "hidden", textOverflow: "ellipsis", wordBreak: "break-word", whiteSpace: "normal" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px", boxSizing: "border-box", overflowY: "auto" },
  modal: { background: "white", padding: "30px", borderRadius: "10px", width: "420px", maxWidth: "min(95vw, 460px)", boxSizing: "border-box", userSelect: "none", cursor: "move", resize: "horizontal", overflow: "auto", minWidth: "360px", minHeight: "240px", position: "fixed" },
  formRow: { display: "grid", gridTemplateColumns: "max-content 1fr", gap: "10px", alignItems: "center", marginBottom: "12px" },
  label: { fontWeight: "bold", whiteSpace: "nowrap", justifySelf: "start" },
  input: { width: "100%", padding: "8px", minWidth: 0, boxSizing: "border-box" },
  modalButtons: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px" },
  summarySection: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "15px", margin: "20px 0" },
  summaryCard: { background: "#e0f3fc", padding: "15px", borderRadius: "10px", textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.10)" },
  alerts: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  alert: { background: "#ffecec", color: "#b02a2a", padding: "12px 15px", borderRadius: "8px", fontWeight: "600" },
  welcomeText: { margin: "30px 0 40px", color: "#1a2d40", fontSize: "clamp(20px, 2.1vw, 36px)", fontWeight: "bold", width: "100%", boxSizing: "border-box", lineHeight: "1.4", backgroundColor: "#e0f3fc", padding: "20px 28px", borderRadius: "10px", boxShadow: "0 3px 10px rgba(0,0,0,0.10)" },
  toolbarSection: { background: "white", padding: "14px 0", marginBottom: "16px", borderBottom: "1.5px solid #f1f5f9" },
  toolbarTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0", gap: "10px", flexWrap: "wrap" },
  statsBox: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: "600", color: "#475569", border: "1px solid #e2e8f0" },
  filtersSection: { display: "flex", flexDirection: "column", gap: "10px" },
  searchInput: { width: "100%", padding: "10px 15px", fontSize: "14px", border: "1px solid #bdc3c7", borderRadius: "5px", boxSizing: "border-box" },
  detailsBtn: { padding: "0", background: "#9b59b6", color: "white", border: "none", borderRadius: "6px", width: "42px", height: "42px", marginRight: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  tableContainer: { marginTop: "20px", overflowX: "auto", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#7f8c8d", fontSize: "16px", background: "#ecf0f1", borderRadius: "8px", marginTop: "20px" },
  backBtn: { padding: "10px 20px", background: "#95a5a6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginBottom: "20px", fontSize: "14px", fontWeight: "500" },
  detailsContainer: { background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  detailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "2px solid #ecf0f1", paddingBottom: "20px" },
  statusBadge: { padding: "8px 16px", borderRadius: "20px", color: "white", fontWeight: "bold", fontSize: "14px" },
  detailsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" },
  detailCard: { background: "#f7f9fc", padding: "20px", borderRadius: "8px", border: "1px solid #e0e6ed" },
  detailsActions: { display: "flex", gap: "12px", justifyContent: "center", marginTop: "30px", borderTop: "1px solid #ecf0f1", paddingTop: "20px" },
  calcRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "14px", borderBottom: "1px solid #f0f0f0" },
  successBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#d5f5e3", border: "1px solid #27ae60", borderRadius: "8px", padding: "14px 18px", marginBottom: "14px", fontWeight: "bold", color: "#1e8449", fontSize: "15px" },
  successClose: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#1e8449", fontWeight: "bold" },
  recuPromptBox: { display: "flex", alignItems: "center", gap: "14px", background: "#eaf4fb", border: "1px solid #3498db", borderRadius: "8px", padding: "12px 18px", marginBottom: "14px", flexWrap: "wrap" },
  recuBtn: { padding: "8px 18px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  recuCloseBtn: { padding: "8px 14px", background: "transparent", color: "#7f8c8d", border: "1px solid #bdc3c7", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  recuSectionTitle: { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#7f8c8d", borderBottom: "1px solid #e0e6ed", paddingBottom: "6px", marginBottom: "12px", marginTop: 0 },
  recuRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", borderBottom: "1px solid #f5f5f5" },
};

export default App;
