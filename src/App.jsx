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
function LangToggle({ lang, setLang }) {
  const btn = (code) => ({
    display: "flex", alignItems: "center", gap: "5px",
    background: lang === code ? "rgba(52,152,219,0.25)" : "transparent",
    border: lang === code ? "1px solid #3498db" : "1px solid rgba(255,255,255,0.3)",
    color: "#fff", padding: "4px 10px", borderRadius: "14px",
    cursor: "pointer", fontSize: "12px", fontWeight: lang === code ? "700" : "500",
  });
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      <button style={btn("fr")} onClick={() => setLang("fr")}><FlagFR /> FR</button>
      <button style={btn("en")} onClick={() => setLang("en")}><FlagEN /> EN</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGE D'ACCUEIL PUBLIQUE (LANDING)
// ═══════════════════════════════════════════════════════
function LandingPage({ lang, setLang, t, onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ls = {
    root: {
      fontFamily: "Arial, sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(160deg,#0f1b2d 0%,#1a2d46 40%,#0d2137 100%)",
      color: "#fff",
      overflowX: "hidden",
    },
    nav: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      height: "68px",
      background: scrolled ? "rgba(10,20,38,0.97)" : "rgba(10,20,38,0.6)",
      backdropFilter: "blur(12px)",
      borderBottom: scrolled ? "1px solid rgba(52,152,219,0.2)" : "1px solid transparent",
      transition: "all 0.3s ease",
      boxSizing: "border-box",
    },
    navBrand: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    navLogo: {
      height: "42px",
      width: "42px",
      objectFit: "cover",
      borderRadius: "50%",
    },
    navTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#fff",
      margin: 0,
      letterSpacing: "-0.3px",
    },
    navActions: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    langSelect: {
      padding: "6px 12px",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "20px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      outline: "none",
    },
    btnOutline: {
      padding: "8px 20px",
      background: "transparent",
      color: "#3498db",
      border: "1.5px solid #3498db",
      borderRadius: "22px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      transition: "all 0.2s",
    },
    btnPrimary: {
      padding: "8px 20px",
      background: "linear-gradient(135deg,#3498db,#2980b9)",
      color: "#fff",
      border: "none",
      borderRadius: "22px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      boxShadow: "0 2px 12px rgba(52,152,219,0.4)",
      transition: "all 0.2s",
    },
    // ── HERO ──────────────────────────────────────────────
    hero: {
      textAlign: "center",
      padding: "90px 24px 80px",
      maxWidth: "760px",
      margin: "0 auto",
    },
    heroBadge: {
      display: "inline-block",
      background: "rgba(52,152,219,0.15)",
      color: "#3498db",
      border: "1px solid rgba(52,152,219,0.4)",
      borderRadius: "20px",
      padding: "5px 16px",
      fontSize: "13px",
      fontWeight: "600",
      marginBottom: "28px",
      letterSpacing: "0.3px",
    },
    heroTitle: {
      fontSize: "clamp(28px, 5vw, 52px)",
      fontWeight: "800",
      lineHeight: "1.15",
      letterSpacing: "-1px",
      margin: "0 0 24px",
      color: "#fff",
    },
    heroTitleAccent: {
      background: "linear-gradient(90deg,#3498db,#9b59b6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    heroSub: {
      fontSize: "18px",
      color: "rgba(255,255,255,0.72)",
      lineHeight: "1.65",
      margin: "0 0 40px",
      maxWidth: "580px",
      marginLeft: "auto",
      marginRight: "auto",
    },
    heroCTAs: {
      display: "flex",
      gap: "16px",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    ctaPrimary: {
      padding: "14px 32px",
      background: "linear-gradient(135deg,#3498db,#2980b9)",
      color: "#fff",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "16px",
      boxShadow: "0 4px 20px rgba(52,152,219,0.45)",
      transition: "transform 0.15s, box-shadow 0.15s",
    },
    ctaSecondary: {
      padding: "14px 32px",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      border: "1.5px solid rgba(255,255,255,0.25)",
      borderRadius: "30px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "16px",
      transition: "all 0.15s",
    },
    // ── FEATURES ──────────────────────────────────────────
    featSection: {
      background: "rgba(255,255,255,0.03)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "80px 24px",
    },
    featInner: {
      maxWidth: "1060px",
      margin: "0 auto",
    },
    sectionLabel: {
      textAlign: "center",
      fontSize: "13px",
      fontWeight: "700",
      color: "#3498db",
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      marginBottom: "12px",
    },
    sectionTitle: {
      textAlign: "center",
      fontSize: "clamp(22px, 3.5vw, 36px)",
      fontWeight: "800",
      color: "#fff",
      margin: "0 0 56px",
      letterSpacing: "-0.5px",
    },
    featGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
    },
    featCard: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "18px",
      padding: "36px 28px",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    },
    featIcon: {
      fontSize: "40px",
      marginBottom: "18px",
      display: "block",
    },
    featTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "10px",
    },
    featDesc: {
      fontSize: "15px",
      color: "rgba(255,255,255,0.62)",
      lineHeight: "1.65",
    },
    // ── HOW IT WORKS ──────────────────────────────────────
    howSection: {
      padding: "80px 24px",
      maxWidth: "860px",
      margin: "0 auto",
    },
    stepsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "32px",
      marginTop: "8px",
    },
    stepCard: {
      textAlign: "center",
      padding: "32px 20px",
    },
    stepNum: {
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      background: "linear-gradient(135deg,#3498db,#2980b9)",
      color: "#fff",
      fontSize: "22px",
      fontWeight: "800",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
      boxShadow: "0 4px 16px rgba(52,152,219,0.4)",
    },
    stepTitle: {
      fontSize: "17px",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "10px",
    },
    stepDesc: {
      fontSize: "14px",
      color: "rgba(255,255,255,0.6)",
      lineHeight: "1.6",
    },
    // ── CTA BOTTOM ────────────────────────────────────────
    ctaSection: {
      textAlign: "center",
      padding: "70px 24px",
      background: "linear-gradient(135deg,rgba(52,152,219,0.12),rgba(155,89,182,0.1))",
      borderTop: "1px solid rgba(52,152,219,0.15)",
    },
    ctaTitle: {
      fontSize: "clamp(22px, 3vw, 34px)",
      fontWeight: "800",
      color: "#fff",
      margin: "0 0 14px",
    },
    ctaSub: {
      fontSize: "16px",
      color: "rgba(255,255,255,0.65)",
      margin: "0 0 36px",
    },
    // ── FOOTER ────────────────────────────────────────────
    footer: {
      textAlign: "center",
      padding: "24px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.35)",
      fontSize: "13px",
    },
  };

  const features = [
    { icon: t("landingFeat1Icon"), title: t("landingFeat1Title"), desc: t("landingFeat1Desc") },
    { icon: t("landingFeat2Icon"), title: t("landingFeat2Title"), desc: t("landingFeat2Desc") },
    { icon: t("landingFeat3Icon"), title: t("landingFeat3Title"), desc: t("landingFeat3Desc") },
  ];

  const steps = [
    { num: t("landingStep1Num"), title: t("landingStep1Title"), desc: t("landingStep1Desc") },
    { num: t("landingStep2Num"), title: t("landingStep2Title"), desc: t("landingStep2Desc") },
    { num: t("landingStep3Num"), title: t("landingStep3Title"), desc: t("landingStep3Desc") },
  ];

  return (
    <div style={ls.root}>
      {/* ── NAVBAR ── */}
      <nav style={ls.nav}>
        <div style={ls.navBrand}>
          <img src={logo} alt="Logo" style={ls.navLogo} />
          <span style={ls.navTitle}>Cotisation Pro</span>
        </div>
        <div style={ls.navActions}>
          <LangToggle lang={lang} setLang={setLang} />
          <button style={ls.btnOutline} onClick={onLogin}>{t("landingNavLogin")}</button>
          <button style={ls.btnPrimary} onClick={onRegister}>{t("landingNavRegister")}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={ls.hero}>
        <div style={ls.heroBadge}>🏛️ Cotisation Pro</div>
        <h1 style={ls.heroTitle}>
          {lang === "fr" ? (
            <>Gérez les cotisations de votre association{" "}<span style={ls.heroTitleAccent}>en toute simplicité</span></>
          ) : (
            <>Manage your association's contributions{" "}<span style={ls.heroTitleAccent}>with ease</span></>
          )}
        </h1>
        <p style={ls.heroSub}>{t("landingHeroSubtitle")}</p>
        <div style={ls.heroCTAs}>
          <button
            style={ls.ctaPrimary}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(52,152,219,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(52,152,219,0.45)"; }}
            onClick={onRegister}
          >
            {t("landingCTAStart")} →
          </button>
          <button
            style={ls.ctaSecondary}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onClick={onLogin}
          >
            {t("landingCTALogin")}
          </button>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section style={ls.featSection}>
        <div style={ls.featInner}>
          <p style={ls.sectionLabel}>Fonctionnalités</p>
          <h2 style={ls.sectionTitle}>{t("landingFeaturesTitle")}</h2>
          <div style={ls.featGrid}>
            {features.map((f, i) => (
              <div
                key={i}
                style={ls.featCard}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)"; e.currentTarget.style.borderColor = "rgba(52,152,219,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                <span style={ls.featIcon}>{f.icon}</span>
                <div style={ls.featTitle}>{f.title}</div>
                <div style={ls.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={ls.howSection}>
        <p style={ls.sectionLabel}>{lang === "fr" ? "En 3 étapes" : "3 simple steps"}</p>
        <h2 style={{ ...ls.sectionTitle, marginBottom: "40px" }}>{t("landingHowTitle")}</h2>
        <div style={ls.stepsGrid}>
          {steps.map((s, i) => (
            <div key={i} style={ls.stepCard}>
              <div style={ls.stepNum}>{s.num}</div>
              <div style={ls.stepTitle}>{s.title}</div>
              <div style={ls.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAS DE PAGE ── */}
      <section style={ls.ctaSection}>
        <h2 style={ls.ctaTitle}>
          {lang === "fr" ? "Prêt à démarrer ?" : "Ready to get started?"}
        </h2>
        <p style={ls.ctaSub}>
          {lang === "fr"
            ? "Créez votre compte gratuit et gérez votre association dès aujourd'hui."
            : "Create your free account and manage your association today."}
        </p>
        <button
          style={{ ...ls.ctaPrimary, fontSize: "17px", padding: "16px 40px" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(52,152,219,0.55)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(52,152,219,0.45)"; }}
          onClick={onRegister}
        >
          {t("landingCTAStart")} →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={ls.footer}>
        {t("landingFooter")}
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
  const [mode, setMode] = useState(initialMode); // "login" | "register" | "reset"
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
  const [registerStep, setRegisterStep] = useState("form"); // "form" | "otp"
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const otp0Ref = useRef(null);
  const otp1Ref = useRef(null);
  const otp2Ref = useRef(null);
  const otp3Ref = useRef(null);
  const otpRefs = [otp0Ref, otp1Ref, otp2Ref, otp3Ref];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetForm({ ...resetForm, [e.target.name]: e.target.value });

  // ── OTP helpers ─────────────────────────────────────────────
  const handleOtpInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs[index - 1].current?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!digits) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < 4; i++) next[i] = digits[i] || "";
    setOtpDigits(next);
    otpRefs[Math.min(digits.length - 1, 3)].current?.focus();
  };

  // Étape 1 inscription — envoyer l'OTP
  const sendOtpRequest = async (email) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
    const data = await res.json();
    if (res.status === 429) throw new Error(t("emailRateLimit"));
    if (res.status === 503) throw new Error(t("emailServiceUnavailable"));
    if (!res.ok) throw new Error(data.error || t("errorSendingCode"));
    return data;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nom_association.trim() || !form.email.trim() || !form.mot_de_passe) { setError(t("allFieldsRequired")); return; }
    if (form.mot_de_passe !== form.confirmer_mot_de_passe) { setError(t("passwordsNoMatch")); return; }
    if (form.mot_de_passe.length < 6) { setError(t("passwordMinLength")); return; }
    if (!termsAccepted) { setError(t("termsNotAccepted")); return; }
    setLoading(true);
    try {
      await sendOtpRequest(form.email);
      setRegisterStep("otp");
      setOtpDigits(["", "", "", ""]);
      setTimeout(() => otp0Ref.current?.focus(), 100);
    } catch (err) { setError(err.message || t("networkError")); }
    finally { setLoading(false); }
  };

  // Renvoyer le code OTP
  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtpRequest(form.email);
      setOtpDigits(["", "", "", ""]);
      setTimeout(() => otp0Ref.current?.focus(), 100);
    } catch (err) { setError(err.message || t("networkErrorShort")); }
    finally { setLoading(false); }
  };

  // Étape 2 inscription — vérifier l'OTP et créer le compte
  const handleRegisterWithOtp = async (e) => {
    e.preventDefault();
    setError("");
    const otp = otpDigits.join("");
    if (otp.length !== 4) { setError(t("enterAllDigits")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom_association: form.nom_association.trim(), email: form.email.trim(), mot_de_passe: form.mot_de_passe, otp }),
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
    if (!resetForm.nouveau_mot_de_passe || resetForm.nouveau_mot_de_passe.length < 6) { setError(t("passwordMinLength")); return; }
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
            <LangToggle lang={lang} setLang={setLang} />
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
            <LangToggle lang={lang} setLang={setLang} />
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

  // ── Étape OTP — vérification email pour inscription ──
  if (mode === "register" && registerStep === "otp") {
    return (
      <div style={{ position: "relative" }}>
        <div style={authSt.page}>
          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <div style={authSt.card}>
            <div style={authSt.cardHeader}>
              <img src={logo} alt="" style={authSt.cardLogo} />
              <div>
                <h2 style={authSt.cardTitle}>{t("emailVerification")}</h2>
                <p style={authSt.cardSub}>{t("codeSentTo")} {form.email}</p>
              </div>
            </div>
            <p style={{ textAlign: "center", color: "#7f8c8d", fontSize: "13px", marginBottom: "24px", lineHeight: "1.5" }}>
              {t("otpInstruction")} <strong>{t("otpDigits")}</strong> {t("otpReceived")}<br />{t("otpExpires")}
            </p>
            <form onSubmit={handleRegisterWithOtp}>
              <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginBottom: "28px" }}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: "62px", height: "68px", textAlign: "center", fontSize: "30px", fontWeight: "bold",
                      border: "2px solid " + (digit ? "#2c3e50" : "#e0e6ed"),
                      borderRadius: "12px", outline: "none", color: "#2c3e50",
                      background: digit ? "#eef2f7" : "#fdfdfe", boxSizing: "border-box",
                      transition: "border-color 0.15s, background 0.15s",
                      fontFamily: "Arial, sans-serif",
                    }}
                  />
                ))}
              </div>
              {error && <div style={authSt.error}>⚠️ {error}</div>}
              <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? t("verifying") : t("confirmCreateAccount")}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#95a5a6" }}>
              {t("didntReceiveCode")}{" "}
              <button style={{ ...authSt.switchLink, fontSize: "13px" }} onClick={handleResendOtp} disabled={loading}>
                {t("resendCode")}
              </button>
            </p>
            <p style={authSt.switchText}>
              <button style={authSt.switchLink} onClick={() => { setRegisterStep("form"); setError(""); }}>
                {t("backToForm")}
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
          <LangToggle lang={lang} setLang={setLang} />
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
            <button style={{ ...authSt.tab, ...(mode === "login" ? authSt.tabOn : {}) }} onClick={() => { setMode("login"); setRegisterStep("form"); setError(""); }}>{t("login")}</button>
            <button style={{ ...authSt.tab, ...(mode === "register" ? authSt.tabOn : {}) }} onClick={() => { setMode("register"); setRegisterStep("form"); setError(""); }}>{t("createAccount")}</button>
          </div>

          <form onSubmit={mode === "register" ? handleSendOtp : handleSubmit}>
            {mode === "register" && (
              <div style={authSt.field}>
                <label style={authSt.label}>{t("associationName")}</label>
                <div style={authSt.inputBox}>
                  <input style={authSt.input} type="text" name="nom_association" value={form.nom_association} onChange={handleChange} placeholder={t("assocNamePlaceholder")} autoFocus />
                </div>
              </div>
            )}
            <div style={authSt.field}>
              <label style={authSt.label}>{t("emailAddress")}</label>
              <div style={authSt.inputBox}>
                <input style={authSt.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" autoFocus={mode === "login"} />
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
              {loading ? (mode === "login" ? t("loggingIn") : t("sendingCode")) : mode === "login" ? t("signIn") : t("receiveCode")}
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
            <button style={authSt.switchLink} onClick={() => { setMode(mode === "login" ? "register" : "login"); setRegisterStep("form"); setError(""); setSuccessMsg(""); }}>
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

  useEffect(() => { if (compte) { loadAdherents(); loadPeriodes(); loadHistorique(); } }, [compte]);

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
    if (changePwdForm.nouveau.length < 6) { setChangePwdError(t("passwordMinLength")); return; }
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
            photo: formData.photo || null,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || result?.message || "Erreur ajout");
        await loadAdherents();
        showToast(t("memberAdded"));
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

  const selectedPeriodeObj = periodes.find((p) => p.libelle === selectedPeriode);

  const dragProps = (e) => {
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

  // ── Guard : si non connecté → landing ou authentification ──
  if (!compte) {
    if (showLanding) {
      return (
        <LandingPage
          lang={lang}
          setLang={setLang}
          t={t}
          onLogin={() => { setInitialAuthMode("login"); setShowLanding(false); }}
          onRegister={() => { setInitialAuthMode("register"); setShowLanding(false); }}
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
      <div style={styles.menu}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logo} alt="Logo Cotisation Pro" style={{ height: "72px", width: "72px", objectFit: "cover", borderRadius: "50%" }} />
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "18px" }}>Cotisation Pro</h2>
            <span style={{ color: "#3498db", fontSize: "13px", fontWeight: "600" }}>🏛️ {compte.nom_association}</span>
          </div>
        </div>
        <div style={styles.menuButtons}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: "6px 12px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", outline: "none" }}
          >
            <option value="fr" style={{ background: "#2c3e50" }}>🇫🇷 FR</option>
            <option value="en" style={{ background: "#2c3e50" }}>🇬🇧 EN</option>
          </select>
          <button style={styles.btn} onClick={() => setPage("accueil")}>{t("home")}</button>
          <button style={styles.btn} onClick={() => { setPage("adherents"); setShowUnpaidOnly(false); setShowUnpaidOrPartial(false); }}>{t("members")}</button>
          <button style={styles.btn} onClick={() => setPage("cotisations")}>{t("contributions")}</button>
          <button style={styles.btn} onClick={() => setPage("historique")}>{t("history")}</button>
          <div style={{ position: "relative", marginLeft: "14px" }} ref={accountMenuRef}>
            <button
              style={{ ...styles.btn, background: "#34495e", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => setShowAccountMenu(v => !v)}
            >
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
                    onClick={action}
                  >
                    {label}
                  </button>
                ))}
                <div style={{ height: "1px", background: "#ecf0f1", margin: "2px 0" }} />
                <button
                  style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#c0392b", fontFamily: "inherit", fontWeight: "600", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  onClick={() => { setShowAccountMenu(false); setShowLogoutConfirm(true); }}
                >
                  🚪 {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.content}>

        {/* ── ACCUEIL ─────────────────────────────────────────── */}
        {page === "accueil" && (
          <div>
            <div style={{ ...styles.welcomeText, display: "flex", alignItems: "center", gap: "24px", backgroundColor: "#b8ddf0", boxShadow: "0 8px 24px rgba(52,152,219,0.30), 0 2px 6px rgba(0,0,0,0.12)", cursor: "default" }}>
              <img src={logo} alt="Logo Cotisation Pro" style={{ height: "130px", width: "130px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{currentText}</span>
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
            <div style={styles.summarySection}>
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
                  <div style={styles.toolbarTop}>
                    <button style={styles.addBtn} onClick={() => { setEditingIndex(null); setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false }); setSearchTerm(""); setShowForm(true); }}>
                      {t("addMemberBtn")}
                    </button>
                    <div style={styles.statsBox}>
                      <span>{t("totalLabel")} <strong>{adherents.length}</strong></span>
                    </div>
                    <button style={{ ...styles.addBtn, background: "#27ae60", marginLeft: "10px" }} onClick={exportExcel}>
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
                    <div ref={modalRef} style={{ ...styles.modal, ...modalPos }} onMouseDown={dragProps}>
                      <h2>{editingIndex !== null ? t("editMemberTitle") : t("addMemberTitle")}</h2>
                      <div style={styles.formRow}><label style={styles.label}>{t("lastName")}</label><input name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex. Kouakou" style={styles.input} autoFocus /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("firstName")}</label><input name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex. Jean" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("phone")}</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Ex. +225 07 00 00 00 00" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("emailField")}</label><input name="email" value={formData.email} onChange={handleChange} placeholder="Ex. jean@example.com" type="email" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>{t("registrationDate")}</label><input type="date" name="date" value={formData.date} onChange={handleChange} style={styles.input} /></div>
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
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "360px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
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
                              <button style={styles.actionBtn} onClick={() => { const ad = adherents[a.originalIndex]; setEditingIndex(a.originalIndex); setFormData({ ...ad, photo: ad.photo || "", photoName: ad.photo ? "Photo existante" : "" }); setSearchTerm(""); setShowForm(true); }}>✏️</button>
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
                      <div style={styles.detailsHeader}>
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
                      <div style={styles.detailsGrid}>
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
                        <button style={styles.addBtn} onClick={() => { setEditingIndex(adherents.findIndex((a) => a.id === selectedAdherentId)); setFormData({ ...adherent, photo: adherent.photo || "", photoName: adherent.photo ? "Photo existante" : "" }); setSearchTerm(""); setShowForm(true); setSelectedAdherentId(null); }}>{t("editBtn")}</button>
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
                <button style={styles.addBtn} onClick={() => { setCotisationFormData({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" }); setShowCotisationForm(true); }}>
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
                <div ref={modalRef} style={{ ...styles.modal, ...modalPos }} onMouseDown={dragProps}>
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
                          <div style={{ ...styles.modal, position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", cursor: "default" }}>
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
          <div style={{ background: "white", borderRadius: "12px", width: "520px", maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
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
                        onChange={(e) => setChangePwdForm(f => ({ ...f, ancien: e.target.value }))}
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
                          onChange={(e) => setChangePwdForm(f => ({ ...f, nouveau: e.target.value }))}
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
                          onChange={(e) => setChangePwdForm(f => ({ ...f, confirmer: e.target.value }))}
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
