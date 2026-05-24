import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import logo from "./assets/cota.png";
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
      role: fr ? "Administrateur" : "Administrator",
      color: "#3498db",
      items: fr
        ? ["Créez et gérez votre association", "Ajoutez et modifiez les adhérents", "Créez les périodes de cotisation", "Enregistrez les paiements", "Générez les reçus PDF", "Exportez les données Excel/PDF", "Gérez les accès membres"]
        : ["Create and manage your association", "Add and edit members", "Create contribution periods", "Record payments", "Generate PDF receipts", "Export Excel/PDF data", "Manage member access"],
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
    { q: "Un administrateur peut-il gérer plusieurs associations ?", a: "Oui, chaque compte administrateur est lié à une association distincte. Vous pouvez créer autant de comptes que nécessaire." },
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

const pwdOk = (pwd) => pwd.length >= 8 && /[^a-zA-Z0-9]/.test(pwd);

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
  const [form, setForm] = useState({ email: "", mot_de_passe: "", confirmer_mot_de_passe: "", nom_association: "" });
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
    if (!joinForm.mot_de_passe || !pwdOk(joinForm.mot_de_passe)) { setError(lang === "fr" ? "Le mot de passe doit contenir au moins 8 caractères et un caractère spécial (ex: @, #, !, %)." : "Password must be at least 8 characters and include a special character (e.g. @, #, !, %)."); return; }
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
    if (form.mot_de_passe !== form.confirmer_mot_de_passe) { setError(t("passwordsNoMatch")); return; }
    if (!pwdOk(form.mot_de_passe)) { setError(t("passwordMinLength")); return; }
    if (!termsAccepted) { setError(t("termsNotAccepted")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom_association: form.nom_association.trim(), email: form.email.trim(), mot_de_passe: form.mot_de_passe }),
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
                  <input style={authSt.input} type="text" name="invite_token" value={joinForm.invite_token} onChange={handleJoinChange} placeholder={lang === "fr" ? "Entrez le code reçu de votre admin" : "Enter the code from your admin"} autoFocus />
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

  const t2 = (fr, en) => lang === "fr" ? fr : en;

  const apiFetch = (url, options = {}) =>
    fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${compte.token}` } });

  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE}/me`).then((r) => r.json()).then(setProfile),
      apiFetch(`${API_BASE}/me/cotisations`).then((r) => r.json()).then(setCotisations),
      apiFetch(`${API_BASE}/me/membres`).then((r) => r.json()).then((d) => setMembres(Array.isArray(d) ? d : [])),
      apiFetch(`${API_BASE}/me/toutes-cotisations`).then((r) => r.json()).then((d) => setToutesCotisations(Array.isArray(d) ? d : [])),
      apiFetch(`${API_BASE}/messages`).then((r) => r.json()).then((d) => {
        if (!Array.isArray(d)) return;
        setUserMessages(d);
        const seenKey = `msg_seen_${compte?.email}`;
        const seenAt = parseInt(localStorage.getItem(seenKey) || "0");
        setUserMsgUnread(d.filter(m => new Date(m.created_at).getTime() > seenAt).length);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

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
          <button onClick={() => setPage("membres")} style={navBtnStyle(page === "membres")}>{t2("Membres", "Members")}</button>
          <button onClick={() => setPage("cotisations")} style={navBtnStyle(page === "cotisations")}>{t2("Mes Paiements", "My Payments")}</button>
          <button onClick={() => setPage("apercu")} style={navBtnStyle(page === "apercu")}>{t2("Cotisations", "Contributions")}</button>
          <button onClick={() => { setPage("messages"); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setUserMsgUnread(0); }} style={{ ...navBtnStyle(page === "messages"), position: "relative" }}>
            {t2("Messages", "Messages")}
            {userMsgUnread > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{userMsgUnread}</span>}
          </button>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ ...navBtnStyle(false), background: "#c0392b" }}>{t2("Déconnexion", "Logout")}</button>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 16px" }}>

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
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "20px" }}>👤 {t2("Mon Profil", "My Profile")}</h2>
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

        {/* ── PAGE COTISATIONS ── */}
        {page === "cotisations" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 24px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8" }}>
              💰 {t2("Mes Cotisations", "My Contributions")}
            </h2>
            {cotisations.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0", fontSize: "15px" }}>
                {t2("Aucune cotisation enregistrée.", "No contributions recorded.")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {cotisations.map((c, i) => (
                  <div key={i} style={{ border: `2px solid ${statutColor(c.statut)}33`, borderRadius: "10px", padding: "16px 20px", background: statutBg(c.statut) + "55" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>{c.periode}</div>
                        {c.dernierPaiement && <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "2px" }}>{t2("Dernier paiement", "Last payment")}: {c.dernierPaiement}</div>}
                      </div>
                      <span style={{ background: statutColor(c.statut), color: "white", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                        {statutLabel(c.statut)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "24px", marginTop: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Montant dû", "Amount due")}: <strong style={{ color: "#2c3e50" }}>{c.montantDu}</strong></div>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Payé", "Paid")}: <strong style={{ color: "#27ae60" }}>{c.soldePaye}</strong></div>
                      <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{t2("Reste", "Remaining")}: <strong style={{ color: "#e74c3c" }}>{c.reste}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PAGE MEMBRES ── */}
        {page === "membres" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8" }}>
              👥 {t2("Membres de l'association", "Association Members")}
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
                    return !q || `${m.nom} ${m.prenom} ${m.matricule || ""} ${m.telephone || ""} ${m.email || ""}`.toLowerCase().includes(q);
                  })
                  .map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", border: "1px solid #e0e6ed", borderRadius: "10px", background: "#f7f9fc" }}>
                      {m.photo ? (
                        <img src={m.photo} alt="" style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "2px solid #3498db", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👤</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{m.nom} {m.prenom}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "2px" }}>
                          {m.matricule && <span style={{ marginRight: "10px" }}>#{m.matricule}</span>}
                          {m.telephone && <span style={{ marginRight: "10px" }}>📞 {m.telephone}</span>}
                          {m.email && <span>✉️ {m.email}</span>}
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

        {/* ── PAGE APERÇU COTISATIONS ── */}
        {page === "apercu" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 24px", color: "#2c3e50", fontSize: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f4f8" }}>
              📊 {t2("Suivi des cotisations", "Contributions Overview")}
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
        {page === "messages" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            <h2 style={{ margin: "0 0 6px", color: "#2c3e50", fontSize: "20px" }}>📢 {t2("Messages de l'association", "Association Messages")}</h2>
            <p style={{ color: "#7f8c8d", fontSize: "13px", marginBottom: "20px" }}>
              {t2("Annonces et informations envoyées par votre administrateur.", "Announcements and information sent by your administrator.")}
            </p>
            {userMessages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", padding: "40px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                <p style={{ margin: 0 }}>{t2("Aucun message pour le moment.", "No messages yet.")}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {userMessages.map(m => (
                  <div key={m.id} style={{ border: "1px solid #e0e6ed", borderRadius: "10px", padding: "18px 20px", background: "#f7f9fc" }}>
                    <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px", marginBottom: "8px" }}>{m.titre}</div>
                    <div style={{ color: "#555", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{m.contenu}</div>
                    <div style={{ color: "#95a5a6", fontSize: "12px", marginTop: "10px" }}>
                      🕐 {new Date(m.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL CHANGEMENT MOT DE PASSE ── */}
      {showChangePwd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "28px 32px", width: "400px", maxWidth: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "17px" }}>🔑 {t2("Changer le mot de passe", "Change Password")}</h3>
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
              <button onClick={onLogout} style={{ padding: "10px 24px", background: "#c0392b", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>
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
        <button className={`bnav-item${page === "cotisations" ? " bnav-active" : ""}`} onClick={() => setPage("cotisations")}>
          <span className="bnav-label">{t2("Cotisations", "Contributions")}</span>
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
// APPLICATION PRINCIPALE
// ═══════════════════════════════════════════════════════
function App() {
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

  const handleLogout = () => {
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
  const [showCotisationForm, setShowCotisationForm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
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
  const [adminMessages, setAdminMessages] = useState([]);
  const [msgForm, setMsgForm] = useState({ titre: "", contenu: "" });
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");
  const [adminMsgUnread, setAdminMsgUnread] = useState(0);
  const [msgTab, setMsgTab] = useState("nouveau");

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

  const loadMessages = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setAdminMessages(data);
      const seenKey = `msg_seen_${compte?.email}`;
      const seenAt = parseInt(localStorage.getItem(seenKey) || "0");
      setAdminMsgUnread(data.filter(m => new Date(m.created_at).getTime() > seenAt).length);
    } catch {}
  };

  useEffect(() => { if (compte && compte.role !== "user") { loadAdherents(); loadPeriodes(); loadHistorique(); loadMessages(); } }, [compte]);

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
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [selectedStatutFilter, setSelectedStatutFilter] = useState("tous");

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
    matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false, photo: "", photoName: "",
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
    if (!selectedAdherentForPayment || !addPaiementFormData.montantPaye) {
      alert(t("alertSelectMemberAmount"));
      return;
    }
    const periodeObj = periodes.find((p) => p.libelle === selectedPeriode);
    if (!periodeObj) return;

    const montantDu = parseAmount(periodeObj.montantDu);
    const montantPaye = Number(addPaiementFormData.montantPaye);

    if (isNaN(montantPaye) || montantPaye <= 0) {
      alert(t("alertAmountPositive"));
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
      alert(`Le montant saisi (${formatAmount(montantPaye)}) dépasse le reste à payer (${formatAmount(montantDu - dejaPaye)}).`);
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

    try {
      const response = await apiFetch(`${API_BASE}/periodes/${periodeObj.id}/paiements`, {
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur paiement");

      await loadPeriodes();
      await loadHistorique();
      setLastPaiement(recuInfo);
      setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" });
      setSelectedAdherentForPayment(null);
      setShowAddPaiementForm(false);
      setShowSuccessMessage(true);
      setShowRecuPrompt(true);
    } catch (error) {
      setApiError(error.message);
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
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || err?.message || "Impossible de modifier");
        }
        await loadAdherents();
        setEditingIndex(null);
        showToast(t("memberEdited"));
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
    setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false, photo: "", photoName: "" });
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
  const modeLabel = (m) => {
    const map = { "Espèces": t("cash"), "Mobile Money": t("mobileMoney"), "Virement": t("transfer"), "Chèque": t("check"), "Autre": t("other") };
    return map[m] || m;
  };

  // ── Guard : interface membre (role = user) ─────────────────
  if (compte?.role === "user") {
    return (
      <UserDashboard
        compte={compte}
        API_BASE={API_BASE}
        lang={lang}
        setLang={setLang}
        onLogout={handleLogout}
      />
    );
  }

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

      {/* ── MENU ────────────────────────────────────────────── */}
      <div style={styles.menu} className="app-menu">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <img src={logo} alt="Logo Cotisation Pro" style={{ height: "52px", width: "52px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} className="app-menu-logo" />
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "16px", whiteSpace: "nowrap" }}>Cotisation Pro</div>
            <div style={{ color: "#3498db", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>🏛️ {compte.nom_association}</div>
          </div>
        </div>

        {/* Boutons desktop */}
        <div style={styles.menuButtons} className="app-menu-buttons">
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            style={{ padding: "6px 30px 6px 12px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }}
            className="lang-select">
            <option value="fr" style={{ background: "#2c3e50" }}>🇫🇷 FR</option>
            <option value="en" style={{ background: "#2c3e50" }}>🇬🇧 EN</option>
          </select>
          <button style={styles.btn} onClick={() => setPage("accueil")}>{t("home")}</button>
          <button style={styles.btn} onClick={() => { setPage("adherents"); setShowUnpaidOnly(false); setShowUnpaidOrPartial(false); }}>{t("members")}</button>
          <button style={styles.btn} onClick={() => setPage("cotisations")}>{t("contributions")}</button>
          <button style={styles.btn} onClick={() => setPage("historique")}>{t("history")}</button>

          <button style={{ ...styles.btn, background: "#e67e22", position: "relative" }} onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}>
            {lang === "fr" ? "Messages" : "Messages"}
            {adminMsgUnread > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{adminMsgUnread}</span>}
          </button>
          <div style={{ position: "relative", marginLeft: "14px" }} ref={accountMenuRef}>
            <button style={{ ...styles.btn, background: "#34495e", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setShowAccountMenu(v => !v)}>
              {t("accountMenu")} ▾
            </button>
            {showAccountMenu && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "white", borderRadius: "10px", boxShadow: "0 6px 24px rgba(0,0,0,0.18)", minWidth: "230px", zIndex: 999, overflow: "hidden", border: "1px solid #ecf0f1" }}>
                <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1" }}>
                  <div style={{ fontSize: "11px", color: "#3498db", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{t("accountMenu")}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#2c3e50", marginBottom: "2px" }}>{compte.nom_association}</div>
                  <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{compte.email}</div>
                </div>
                {[
                  { label: t("changePassword"), action: () => { setShowAccountMenu(false); setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccessMsg(false); setShowChangePwd(true); } },
                  { label: t("changeEmail"), action: () => { setShowAccountMenu(false); setChangeEmailStep(1); setChangeEmailForm({ email: "", mot_de_passe: "" }); setChangeEmailOtp(""); setChangeEmailError(""); setChangeEmailSuccess(false); setShowChangeEmail(true); } },
                  { label: t("helpMenu"), action: () => { setShowAccountMenu(false); setHelpSection(null); setShowHelp(true); } },
                  { label: t("aboutMenu"), action: () => { setShowAccountMenu(false); setShowAbout(true); } },
                ].map(({ label, action }) => (
                  <button key={label}
                    style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#2c3e50", fontFamily: "inherit", boxSizing: "border-box" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f8ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    onClick={action}>{label}</button>
                ))}
                <div style={{ height: "1px", background: "#ecf0f1", margin: "2px 0" }} />
                <button
                  style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#c0392b", fontFamily: "inherit", fontWeight: "600", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  onClick={() => { setShowAccountMenu(false); setShowLogoutConfirm(true); }}>
                  🚪 {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <div style={styles.content} className="app-content">

        {/* ── ACCUEIL ─────────────────────────────────────────── */}
        {page === "accueil" && (
          <div>
            <div style={{ ...styles.welcomeText, display: "flex", alignItems: "center", gap: "24px", backgroundColor: "#b8ddf0", boxShadow: "0 8px 24px rgba(52,152,219,0.30), 0 2px 6px rgba(0,0,0,0.12)", cursor: "default" }} className="welcome-text">
              <img src={logo} alt="Logo Cotisation Pro" style={{ height: "130px", width: "130px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} className="welcome-logo" />
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }} className="welcome-span">{currentText}</span>
            </div>
            <div style={styles.cards}>
              <div
                style={{ ...styles.card, transition: "transform 0.18s, box-shadow 0.18s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,152,219,0.22)"; e.currentTarget.style.background = "#c5e8f7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.background = "#e0f3fc"; }}
              >
                <span style={{ fontSize: "36px", fontWeight: "bold", color: "#2c3e50" }}>{t("totalMembers")} {adherents.length}</span>
              </div>
            </div>
            <div style={styles.summarySection} className="summary-section">
              <div
                style={{ ...styles.summaryCard, textAlign: "center", transition: "transform 0.18s, box-shadow 0.18s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,152,219,0.22)"; e.currentTarget.style.background = "#c5e8f7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.10)"; e.currentTarget.style.background = "#e0f3fc"; }}
              >
                <h3>{t("lastMemberAdded")}</h3>
                <p>
                  {adherents[adherents.length - 1]
                    ? `${adherents[adherents.length - 1].nom} ${adherents[adherents.length - 1].prenom}`
                    : "—"}
                </p>
              </div>
              <div
                style={{ ...styles.summaryCard, textAlign: "center", transition: "transform 0.18s, box-shadow 0.18s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,152,219,0.22)"; e.currentTarget.style.background = "#c5e8f7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.10)"; e.currentTarget.style.background = "#e0f3fc"; }}
              >
                <h3>{t("totalCollectedCurrentPeriod")}</h3>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px" }}>
                  {currentPeriode ? periodeLabel(currentPeriode.libelle) : t("noPeriod")}
                </p>
                <strong style={{ fontSize: "20px", color: "#27ae60" }}>
                  {formatAmount(totalEncaissePeriodeCourante)}
                </strong>
              </div>
              <div
                style={{ ...styles.summaryCard, textAlign: "center", transition: "transform 0.18s, box-shadow 0.18s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,152,219,0.22)"; e.currentTarget.style.background = "#c5e8f7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.10)"; e.currentTarget.style.background = "#e0f3fc"; }}
              >
                <h3>{t("lastContributionRegistered")}</h3>
                <p>{periodes.length > 0 ? periodeLabel(periodes[periodes.length - 1].libelle) : "—"}</p>
              </div>
            </div>
            <div style={styles.alerts}>
              <div style={styles.alert}>
                {currentPeriode ? (
                  <>
                    <strong>{currentPeriodeNotPaidCount}</strong>{" "}
                    {currentPeriodeNotPaidCount !== 1 ? t("memberPlural") : t("memberSingular")} {t("notPaidFor")}
                    <strong> {periodeLabel(currentPeriode.libelle)}</strong>
                  </>
                ) : (
                  t("noCurrentPeriod")
                )}
                {currentPeriode && (
                  <button
                    style={styles.alertButton}
                    onClick={() => { setPage("nonRegle"); setShowUnpaidOrPartial(false); setShowUnpaidOnly(false); }}
                  >
                    {t("view")}
                  </button>
                )}
              </div>
            </div>
            <div style={{ ...styles.summaryCard, marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: "#2c3e50" }}>{t("lastPayments")}</h3>
                <button style={styles.alertButton} onClick={() => setPage("historique")}>{t("viewMore")}</button>
              </div>
              {cinqDerniersPaiements.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cinqDerniersPaiements.map((pay, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#eaf6fd", borderRadius: "6px", border: "1px solid #c5e8f7" }}>
                      <div>
                        <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{pay.nom} {pay.prenom}</span>
                        <span style={{ fontSize: "12px", color: "#7f8c8d", marginLeft: "8px" }}>[{periodeLabel(pay.periode)}]</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: "bold", color: "#27ae60" }}>{pay.montantPaye}</span>
                        <span style={{ fontSize: "12px", color: "#95a5a6", marginLeft: "8px" }}>{pay.datePaiement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#95a5a6", fontStyle: "italic", fontSize: "13px", margin: 0 }}>
                  {t("noPaymentRegistered")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── ADHERENTS ────────────────────────────────────────── */}
        {page === "adherents" && (
          <div>
            {selectedAdherentId === null ? (
              <div>
                <h1>{t("memberManagement")}</h1>

                {/* ── Code d'invitation membres ── */}
                <div style={{ background: "linear-gradient(135deg,#1a2742,#2c3e50)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", color: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🔗</span>
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
                </div>

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
                <div style={styles.toolbarSection}>
                  <div style={styles.toolbarTop} className="toolbar-top">
                    <button style={styles.addBtn} className="toolbar-btn" onClick={() => { setEditingIndex(null); setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); }}>
                      {t("addMemberBtn")}
                    </button>
                    <div style={styles.statsBox} className="stats-box">
                      <span>{t("totalLabel")} <strong>{adherents.length}</strong></span>
                    </div>
                    <button style={{ ...styles.addBtn, background: "#27ae60", marginLeft: "10px" }} className="toolbar-btn" onClick={exportExcel}>
                      {t("exportExcel")}
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
                          <tr key={a.id ?? a.originalIndex} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                            <td style={styles.td}><strong>{a.matricule}</strong></td>
                            <td style={styles.td}>{a.nom}</td>
                            <td style={styles.td}>{a.prenom}</td>
                            <td style={styles.td}>{a.telephone || "-"}</td>
                            <td style={styles.td}>{a.email || "-"}</td>
                            <td style={styles.td}>{a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "-"}</td>
                            <td style={styles.td}>
                              <button style={styles.detailsBtn} onClick={() => setSelectedAdherentId(a.id)}><EyeOpen /></button>
                              <button style={styles.actionBtn} onClick={() => { const ad = adherents[a.originalIndex]; setEditingIndex(a.originalIndex); setFormData({ ...ad, photo: ad.photo || "", photoName: ad.photo ? "Photo existante" : "" }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); }}>✏️</button>
                              <button style={styles.actionDeleteBtn} onClick={() => { setDeleteIndex(a.id); setShowDeleteConfirm(true); }}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <button style={styles.backBtn} onClick={() => setSelectedAdherentId(null)}>{t("backToList")}</button>
                {(() => {
                  const adherent = adherents.find((a) => a.id === selectedAdherentId);
                  return adherent ? (
                    <div style={styles.detailsContainer}>
                      <div style={styles.detailsHeader} className="details-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                          {adherent.photo ? (
                            <img
                              src={adherent.photo}
                              alt="Photo"
                              style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #3498db", flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#2c3e50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", flexShrink: 0 }}>👤</div>
                          )}
                          <h1 style={{ margin: 0 }}>{adherent.nom} {adherent.prenom}</h1>
                        </div>
                      </div>
                      <div style={styles.detailsGrid} className="details-grid">
                        {[
                          [t("matricule"), adherent.matricule],
                          [t("nameTh"), adherent.nom],
                          [t("surnameTh"), adherent.prenom],
                          [t("telephoneTh"), adherent.telephone || t("notProvided")],
                          [t("emailTh"), adherent.email || t("notProvided")],
                          [t("dateOfRegistration"), adherent.date ? new Date(adherent.date).toLocaleDateString(t("locale")) : "-"],
                        ].map(([label, val]) => (
                          <div key={label} style={styles.detailCard}>
                            <h3 style={{ color: "#2c3e50", marginTop: 0, marginBottom: "10px", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>{label}</h3>
                            <p style={{ color: "#34495e", fontSize: "16px", margin: 0, fontWeight: "500" }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      <div style={styles.detailsActions}>
                        <button style={styles.addBtn} onClick={() => { setEditingIndex(adherents.findIndex((a) => a.id === selectedAdherentId)); setFormData({ ...adherent, photo: adherent.photo || "", photoName: adherent.photo ? "Photo existante" : "" }); setSearchTerm(""); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowForm(true); setSelectedAdherentId(null); }}>{t("editBtn")}</button>
                        <button style={styles.cancelBtn} onClick={() => { setDeleteIndex(adherent.id); setShowDeleteConfirm(true); setSelectedAdherentId(null); }}>{t("deleteIconBtn")}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.emptyState}><p>{t("memberNotFound")}</p></div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── COTISATIONS ─────────────────────────────────────── */}
        {page === "cotisations" && (
          <div>
            <h1>{t("cotisationsTitle")}</h1>

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

            <div style={styles.toolbarSection}>
              <div style={styles.toolbarTop}>
                <button style={styles.addBtn} onClick={() => { setCotisationFormData({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" }); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); setShowCotisationForm(true); }}>
                  {t("newContributionBtn")}
                </button>
                <div style={styles.statsBox}>
                  <span>{t("periodsLabel")} <strong>{periodes.length}</strong></span>
                </div>
              </div>
            </div>

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

            {/* Liste déroulante des périodes */}
            {periodes.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <label style={{ color: "#2c3e50", fontWeight: "600", fontSize: "15px", whiteSpace: "nowrap" }}>
                      {t("periodPreview")}
                    </label>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <select
                        value={selectedPeriode || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPeriode(val || null);
                          setSelectedStatutFilter("tous");
                          setShowAddPaiementForm(false);
                          setShowSuccessMessage(false);
                          setShowRecuPrompt(false);
                        }}
                        style={{
                          padding: "10px 44px 10px 18px",
                          background: "#2c3e50",
                          color: "white",
                          border: "none",
                          borderRadius: "20px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
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
                      <span style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "white",
                        fontSize: "11px",
                      }}>▼</span>
                    </div>
                  </div>
                  {selectedPeriode && selectedPeriodeObj && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        style={{ ...styles.addBtn, background: "#8e44ad", width: "auto", minWidth: "190px" }}
                        onClick={() => { setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" }); setSelectedAdherentForPayment(null); setShowAddPaiementForm(true); setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                      >
                        {t("addPaymentBtn")}
                      </button>
                      <button
                        style={{ ...styles.addBtn, background: "#27ae60", width: "auto", minWidth: "190px" }}
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
                        {t("exportExcel")}
                      </button>
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

                  // Liste filtrée complète
                  const filtres =
                    selectedStatutFilter === "tous"
                      ? [...liste, ...sansPaiement]
                      : selectedStatutFilter === "Impayé"
                      ? [...liste.filter((p) => p.statut === "Impayé"), ...sansPaiement]
                      : liste.filter((p) => p.statut === selectedStatutFilter);

                  return (
                    <div>
                      <h3 style={{ color: "#2c3e50", marginBottom: "14px" }}>
                        📊 {periodeLabel(selectedPeriode)} — {t("amountDueRow")}{" "}
                        <span style={{ color: "#e74c3c" }}>{selectedPeriodeObj.montantDu} F</span>
                      </h3>

                      {/* Modal ajouter un paiement */}
                      {showAddPaiementForm && selectedPeriodeObj && (
                        <div style={styles.modalOverlay}>
                          <div className="modal-box" style={{ ...styles.modal, position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", cursor: "default" }}>
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
                              <select
                                value={addPaiementFormData.modePaiement}
                                onChange={(e) => setAddPaiementFormData({ ...addPaiementFormData, modePaiement: e.target.value })}
                                style={styles.input}
                              >
                                <option value="Espèces">{t("cash")}</option>
                                <option value="Mobile Money">{t("mobileMoney")}</option>
                                <option value="Virement">{t("transfer")}</option>
                                <option value="Chèque">{t("check")}</option>
                                <option value="Autre">{t("other")}</option>
                              </select>
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

                            <div style={styles.modalButtons}>
                              <button style={{ ...styles.addBtn, background: "#0daf3e" }} onClick={handleSaveAddPaiement}>{t("pay")}</button>
                              <button style={styles.cancelBtn} onClick={() => { setShowAddPaiementForm(false); setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" }); setSelectedAdherentForPayment(null); }}>{t("cancel")}</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filtres avec compteurs */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
                        {[
                          ["tous",    t("filterAll"),     "#7f8c8d", nbPaye + nbPartiel + nbImpaye],
                          ["Payé",    t("filterPaid"),    "#27ae60", nbPaye],
                          ["Impayé",  t("filterUnpaid"),  "#e74c3c", nbImpaye],
                          ["Partiel", t("filterPartial"), "#f39c12", nbPartiel],
                        ].map(([val, label, color, count]) => (
                          <button key={val} onClick={() => setSelectedStatutFilter(val)} style={{ padding: "7px 16px", background: selectedStatutFilter === val ? color : "#ecf0f1", color: selectedStatutFilter === val ? "white" : "#2c3e50", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: selectedStatutFilter === val ? "bold" : "normal" }}>
                            {label} ({count})
                          </button>
                        ))}
                      </div>

                      {/* ── Récapitulatif collecte ── */}
                      {(() => {
                        const duParPersonne = parseAmount(selectedPeriodeObj.montantDu);
                        const totalCollecte = liste.reduce((sum, p) => sum + parseAmount(p.soldePaye), 0);
                        const totalPeriode = liste.length + sansPaiement.length;
                        const totalDu = duParPersonne * totalPeriode;
                        const resteACollecter = Math.max(totalDu - totalCollecte, 0);
                        const pct = totalDu > 0 ? Math.min((totalCollecte / totalDu) * 100, 100) : 0;
                        const barColor = pct >= 100 ? "#27ae60" : pct >= 50 ? "#f39c12" : "#3498db";
                        const nbPayeComplet = liste.filter((p) => p.statut === "Payé").length;
                        return (
                          <div style={{ background: "#e0f3fc", border: "1px solid #bbdff0", borderRadius: "10px", padding: "16px 20px", marginBottom: "15px" }}>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-around", marginBottom: "14px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#1a4a6e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: "600" }}>{t("collectedAmount")}</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#27ae60" }}>{formatAmount(totalCollecte)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#bbdff0" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#1a4a6e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: "600" }}>{t("expectedTotal")}</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2c3e50" }}>{formatAmount(totalDu)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#bbdff0" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#1a4a6e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: "600" }}>{t("remainingToCollect")}</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#e74c3c" }}>{formatAmount(resteACollecter)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#bbdff0" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#1a4a6e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: "600" }}>{t("fullPayers")}</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#3498db" }}>{nbPayeComplet} / {totalPeriode}</div>
                              </div>
                            </div>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#1a4a6e", marginBottom: "5px", fontWeight: "600" }}>
                                <span>{t("collectionProgress")}</span>
                                <strong style={{ color: barColor }}>{pct.toFixed(1)} %</strong>
                              </div>
                              <div style={{ background: "#bbdff0", borderRadius: "10px", height: "12px", overflow: "hidden" }}>
                                <div style={{ width: pct + "%", height: "100%", background: barColor, borderRadius: "10px", transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tableau paiements */}
                      <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, tableLayout: "auto" }}>
                          <thead>
                            <tr>
                              <th style={styles.th}>{t("matricule")}</th><th style={styles.th}>{t("nameTh")}</th><th style={styles.th}>{t("surnameTh")}</th>
                              <th style={styles.th}>{t("telephoneTh")}</th><th style={styles.th}>{t("emailTh")}</th>
                              <th style={styles.th}>{t("balancePaid")}</th><th style={styles.th}>{t("remaining")}</th>
                              <th style={styles.th}>{t("totalDue")}</th><th style={styles.th}>{t("statusTh")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtres.length === 0 ? (
                              <tr>
                                <td colSpan="9" style={{ ...styles.td, textAlign: "center", padding: "20px", color: "#7f8c8d" }}>
                                  {adherents.length === 0 ? t("noMemberRegistered") : t("noResultsFilter")}
                                </td>
                              </tr>
                            ) : (
                              filtres.map((c, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                                  <td style={styles.td}><strong>{c.matricule}</strong></td>
                                  <td style={styles.td}>{c.nom}</td>
                                  <td style={styles.td}>{c.prenom}</td>
                                  <td style={styles.td}>{c.telephone}</td>
                                  <td style={styles.td}>{c.email}</td>
                                  <td style={styles.td}>{c.soldePaye}</td>
                                  <td style={styles.td}>{c.reste}</td>
                                  <td style={styles.td}>{selectedPeriodeObj.montantDu} F</td>
                                  <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                                    <span style={{ padding: "4px 12px", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "13px", background: statutColor(c.statut), whiteSpace: "nowrap", display: "inline-block" }}>
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
          <div>
            <h1 style={{ color: "#2c3e50", marginBottom: "6px" }}>{lang === "fr" ? "Messages aux membres" : "Member Messages"}</h1>
            <p style={{ color: "#7f8c8d", marginBottom: "20px", fontSize: "14px" }}>
              {lang === "fr" ? "Envoyez une information ou annonce à tous vos membres. Ils la verront dans leur espace." : "Send information or an announcement to all your members. They will see it in their space."}
            </p>

            {/* Sous-onglets */}
            <div style={{ display: "flex", border: "1.5px solid #e0e6ed", borderRadius: "10px", overflow: "hidden", marginBottom: "24px", background: "white" }}>
              <button
                style={{ flex: 1, padding: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: msgTab === "nouveau" ? "700" : "500", background: msgTab === "nouveau" ? "#e67e22" : "transparent", color: msgTab === "nouveau" ? "white" : "#7f8c8d", transition: "all 0.15s" }}
                onClick={() => { setMsgTab("nouveau"); setMsgError(""); setMsgSuccess(""); }}
              >
                {lang === "fr" ? "Nouveau message" : "New Message"}
              </button>
              <button
                style={{ flex: 1, padding: "12px", border: "none", borderLeft: "1.5px solid #e0e6ed", cursor: "pointer", fontSize: "14px", fontWeight: msgTab === "envoyes" ? "700" : "500", background: msgTab === "envoyes" ? "#e67e22" : "transparent", color: msgTab === "envoyes" ? "white" : "#7f8c8d", transition: "all 0.15s", position: "relative" }}
                onClick={() => setMsgTab("envoyes")}
              >
                {lang === "fr" ? "Messages envoyés" : "Sent Messages"}
                {adminMessages.length > 0 && <span style={{ marginLeft: "8px", background: msgTab === "envoyes" ? "rgba(255,255,255,0.3)" : "#e67e22", color: "white", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "700" }}>{adminMessages.length}</span>}
              </button>
            </div>

            {/* Formulaire d'envoi */}
            {msgTab === "nouveau" && (
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {lang === "fr" ? "Titre" : "Title"}
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                    value={msgForm.titre}
                    onChange={e => setMsgForm(f => ({ ...f, titre: e.target.value }))}
                    placeholder={lang === "fr" ? "Objet du message" : "Message subject"}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#2c3e50", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {lang === "fr" ? "Contenu" : "Content"}
                  </label>
                  <textarea
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e0e6ed", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
                    value={msgForm.contenu}
                    onChange={e => setMsgForm(f => ({ ...f, contenu: e.target.value }))}
                    placeholder={lang === "fr" ? "Contenu du message…" : "Message content…"}
                  />
                </div>
                {msgError && <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>⚠️ {msgError}</div>}
                {msgSuccess && <div style={{ background: "#d5f5e3", color: "#1e8449", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>✅ {msgSuccess}</div>}
                <button
                  style={{ padding: "11px 32px", background: "#e67e22", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px", opacity: msgLoading ? 0.7 : 1 }}
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
                  {msgLoading ? (lang === "fr" ? "Envoi…" : "Sending…") : (lang === "fr" ? "Envoyer à tous les membres" : "Send to all members")}
                </button>
              </div>
            )}

            {/* Liste des messages envoyés */}
            {msgTab === "envoyes" && (
              adminMessages.length === 0 ? (
                <div style={styles.emptyState}><p>{lang === "fr" ? "Aucun message envoyé pour le moment." : "No messages sent yet."}</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {adminMessages.map(m => (
                    <div key={m.id} style={{ background: "white", borderRadius: "10px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #f0f4f8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px", marginBottom: "6px" }}>{m.titre}</div>
                          <div style={{ color: "#555", fontSize: "14px", lineHeight: "1.55", whiteSpace: "pre-wrap" }}>{m.contenu}</div>
                          <div style={{ color: "#95a5a6", fontSize: "12px", marginTop: "10px" }}>
                            {new Date(m.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                          </div>
                        </div>
                        <button
                          style={{ padding: "6px 12px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", flexShrink: 0 }}
                          onClick={async () => {
                            if (!window.confirm(lang === "fr" ? "Supprimer ce message ?" : "Delete this message?")) return;
                            try {
                              await apiFetch(`${API_BASE}/messages/${m.id}`, { method: "DELETE" });
                              setAdminMessages(prev => prev.filter(x => x.id !== m.id));
                            } catch {}
                          }}
                        >{lang === "fr" ? "Supprimer" : "Delete"}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ── NON RÉGLÉS ──────────────────────────────────────── */}
        {page === "nonRegle" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <button style={styles.cancelBtn} onClick={() => setPage("accueil")}>{t("backBtn")}</button>
              <h1 style={{ margin: 0 }}>{t("unpaidTitle")}</h1>
            </div>
            {currentPeriode && (
              <p style={{ color: "#7f8c8d", marginBottom: "20px", fontSize: "14px" }}>
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
              const nonRegles = [
                ...liste.filter((p) => p.statut === "Impayé" || p.statut === "Partiel"),
                ...sansPaiement,
              ];
              return nonRegles.length === 0 ? (
                <div style={styles.emptyState}><p>{t("allMembersPaid")}</p></div>
              ) : (
                <>
                  <p style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                    {nonRegles.length} {nonRegles.length > 1 ? t("memberPlural") : t("memberSingular")} {nonRegles.length > 1 ? t("nonReglePlural") : t("nonRegleSingular")}
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
                        {nonRegles.map((c, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
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
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                        <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d" }}>{tx.numeroRecu}</td>
                        <td style={styles.td}>{tx.datePaiement}</td>
                        <td style={styles.td}><strong>{tx.nom} {tx.prenom}</strong></td>
                        <td style={styles.td}>{periodeLabel(tx.periode)}</td>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#27ae60" }}>{tx.montantPaye}</td>
                        <td style={styles.td}>{modeLabel(tx.modePaiement)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL REÇU ──────────────────────────────────────── */}
      {showRecu && lastPaiement && (
        <div style={styles.modalOverlay}>
          <div className="modal-box" style={{ background: "white", borderRadius: "12px", width: "520px", maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
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

        <button className={`bnav-item${page === "messages" ? " bnav-active" : ""}`} style={{ position: "relative" }} onClick={() => { setPage("messages"); loadMessages(); const k = `msg_seen_${compte?.email}`; localStorage.setItem(k, Date.now().toString()); setAdminMsgUnread(0); }}>
          <span className="bnav-label">{lang === "fr" ? "Messages" : "Messages"}</span>
          {adminMsgUnread > 0 && <span style={{ position: "absolute", top: "4px", right: "8px", background: "#e74c3c", color: "white", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{adminMsgUnread}</span>}
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
            <div className="mobile-sheet-divider" />
            <button className="mobile-sheet-btn" onClick={() => { setChangePwdStep(1); setChangePwdForm({ ancien: "", nouveau: "", confirmer: "" }); setChangePwdError(""); setChangePwdSuccessMsg(false); setShowChangePwd(true); setMobileAccountOpen(false); }}>🔑 {t("changePassword")}</button>
            <button className="mobile-sheet-btn" onClick={() => { setChangeEmailStep(1); setChangeEmailForm({ email: "", mot_de_passe: "" }); setChangeEmailOtp(""); setChangeEmailError(""); setChangeEmailSuccess(false); setShowChangeEmail(true); setMobileAccountOpen(false); }}>✉️ {t("changeEmail")}</button>
            <button className="mobile-sheet-btn" onClick={() => { setHelpSection(null); setShowHelp(true); setMobileAccountOpen(false); }}>❓ {t("helpMenu")}</button>
            <button className="mobile-sheet-btn" onClick={() => { setShowAbout(true); setMobileAccountOpen(false); }}>ℹ️ {t("aboutMenu")}</button>
            <div className="mobile-sheet-divider" />
            <button className="mobile-sheet-btn mobile-sheet-logout" onClick={() => { setShowLogoutConfirm(true); setMobileAccountOpen(false); }}>🚪 {t("logout")}</button>
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
  addBtn: { padding: "10px 20px", background: "green", color: "white", border: "none", borderRadius: "5px", width: "150px", minWidth: "150px", height: "45px", cursor: "pointer" },
  alertButton: { marginLeft: "12px", padding: "8px 14px", background: "#2c3e50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  cancelBtn: { padding: "10px 20px", background: "red", color: "white", border: "none", borderRadius: "5px", width: "150px", minWidth: "150px", height: "45px", cursor: "pointer" },
  actionBtn: { padding: "0", background: "#3498db", color: "white", border: "none", borderRadius: "6px", width: "42px", height: "42px", marginRight: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  actionDeleteBtn: { padding: "0", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", width: "42px", height: "42px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  errorMessage: { color: "#b02a2a", background: "#ffecec", padding: "12px", borderRadius: "8px", margin: "12px 0", display: "flex", alignItems: "center" },
  infoMessage: { color: "#2c3e50", background: "#ecf0f1", padding: "12px", borderRadius: "8px", margin: "12px 0" },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
  th: { background: "#2c3e50", color: "white", padding: "10px", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  td: { border: "1px solid #ccc", padding: "10px", overflow: "hidden", textOverflow: "ellipsis", wordBreak: "break-word", whiteSpace: "normal" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "white", padding: "30px", borderRadius: "10px", width: "420px", boxSizing: "border-box", userSelect: "none", cursor: "move", resize: "horizontal", overflow: "auto", minWidth: "360px", minHeight: "240px", position: "fixed" },
  formRow: { display: "grid", gridTemplateColumns: "max-content 1fr", gap: "10px", alignItems: "center", marginBottom: "12px" },
  label: { fontWeight: "bold", whiteSpace: "nowrap", justifySelf: "start" },
  input: { width: "100%", padding: "8px", minWidth: 0, boxSizing: "border-box" },
  modalButtons: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px" },
  summarySection: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "15px", margin: "20px 0" },
  summaryCard: { background: "#e0f3fc", padding: "15px", borderRadius: "10px", textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.10)" },
  alerts: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  alert: { background: "#ffecec", color: "#b02a2a", padding: "12px 15px", borderRadius: "8px", fontWeight: "600" },
  welcomeText: { margin: "30px 0 40px", color: "#1a2d40", fontSize: "clamp(20px, 2.1vw, 36px)", fontWeight: "bold", width: "100%", boxSizing: "border-box", lineHeight: "1.4", backgroundColor: "#e0f3fc", padding: "20px 28px", borderRadius: "10px", boxShadow: "0 3px 10px rgba(0,0,0,0.10)" },
  toolbarSection: { background: "#eaf6fd", padding: "15px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #c5e8f7" },
  toolbarTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0", gap: "15px", flexWrap: "wrap" },
  statsBox: { display: "flex", gap: "20px", background: "#eaf6fd", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" },
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
