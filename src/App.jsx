import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import logo from "./assets/cota.png";

// ═══════════════════════════════════════════════════════
// PAGE D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════
function AuthPage({ API_BASE, onSuccess }) {
  const [mode, setMode] = useState("login");
  // step: "form" → saisie identifiants | "sending" → envoi OTP | "otp" → saisie code
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ email: "", mot_de_passe: "", confirmer_mot_de_passe: "", nom_association: "" });
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  // Countdown pour renvoyer le code
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Étape 1 — valider le formulaire et envoyer le code OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (!form.nom_association.trim() || !form.email.trim() || !form.mot_de_passe) { setError("Tous les champs sont obligatoires."); return; }
      if (form.mot_de_passe !== form.confirmer_mot_de_passe) { setError("Les mots de passe ne correspondent pas."); return; }
      if (form.mot_de_passe.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    } else {
      if (!form.email.trim() || !form.mot_de_passe) { setError("Email et mot de passe requis."); return; }
    }
    await envoyerCode();
  };

  const envoyerCode = async () => {
    setError("");
    setLoading(true);
    setStep("sending");
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), purpose: mode, mot_de_passe: form.mot_de_passe }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Impossible d'envoyer le code."); setStep("form"); return; }
      setOtp(["", "", "", "", ""]);
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch { setError("Erreur réseau. Vérifiez que le serveur est démarré."); setStep("form"); }
    finally { setLoading(false); }
  };

  // Saisie dans les cases OTP
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 4) otpRefs[i + 1].current?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    const next = ["", "", "", "", ""];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 4);
    otpRefs[lastFilled].current?.focus();
  };

  // Étape 2 — vérifier le code OTP et finaliser
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 5) { setError("Veuillez entrer les 5 chiffres du code."); return; }
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register"
        ? { nom_association: form.nom_association.trim(), email: form.email.trim(), mot_de_passe: form.mot_de_passe, code }
        : { email: form.email.trim(), mot_de_passe: form.mot_de_passe, code };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Code incorrect."); return; }
      onSuccess(data, mode);
    } catch { setError("Erreur réseau. Vérifiez que le serveur est démarré."); }
    finally { setLoading(false); }
  };

  const EyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  // ── Écran d'envoi en cours ──
  if (step === "sending") {
    return (
      <div style={authSt.page}>
        <div style={authSt.card}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
            <h2 style={authSt.cardTitle}>Envoi en cours…</h2>
            <p style={{ color: "#7f8c8d", fontSize: "14px", margin: "8px 0 0" }}>
              Nous envoyons un code de vérification à<br />
              <strong style={{ color: "#2c3e50" }}>{form.email}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran de saisie OTP ──
  if (step === "otp") {
    return (
      <div style={authSt.page}>
        <div style={authSt.card}>
          <div style={authSt.cardHeader}>
            <img src={logo} alt="" style={authSt.cardLogo} />
            <div>
              <h2 style={authSt.cardTitle}>Vérification email</h2>
              <p style={authSt.cardSub}>Entrez le code reçu par email</p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>

            <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>
              Un code à 5 chiffres a été envoyé à
            </p>
            <p style={{ color: "#2c3e50", fontWeight: "bold", fontSize: "14px", margin: "4px 0 0" }}>
              {form.email}
            </p>
          </div>

          {/* 5 cases OTP */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                style={{
                  width: "52px", height: "58px", textAlign: "center", fontSize: "24px",
                  fontWeight: "bold", border: digit ? "2px solid #2c3e50" : "2px solid #e0e6ed",
                  borderRadius: "10px", outline: "none", background: digit ? "#f0f4ff" : "#fdfdfe",
                  color: "#2c3e50", transition: "border 0.2s, background 0.2s",
                }}
              />
            ))}
          </div>

          {error && <div style={authSt.error}>⚠️ {error}</div>}

          <button
            style={{ ...authSt.submitBtn, opacity: loading || otp.join("").length < 5 ? 0.7 : 1 }}
            onClick={handleVerifyOtp}
            disabled={loading || otp.join("").length < 5}
          >
            {loading ? "Vérification…" : "Valider le code"}
          </button>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            {resendTimer > 0 ? (
              <p style={{ color: "#95a5a6", fontSize: "13px", margin: 0 }}>
                Renvoyer le code dans <strong>{resendTimer}s</strong>
              </p>
            ) : (
              <button style={authSt.switchLink} onClick={envoyerCode} disabled={loading}>
                Renvoyer le code
              </button>
            )}
            <br />
            <button
              style={{ ...authSt.switchLink, marginTop: "8px", color: "#95a5a6" }}
              onClick={() => { setStep("form"); setError(""); setOtp(["", "", "", "", ""]); }}
            >
              ← Modifier mes informations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ──
  return (
    <div style={authSt.page}>
      <div style={authSt.card}>
        <div style={authSt.cardHeader}>
          <img src={logo} alt="" style={authSt.cardLogo} />
          <div>
            <h2 style={authSt.cardTitle}>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>
            <p style={authSt.cardSub}>{mode === "login" ? "Accédez à votre espace association" : "Rejoignez Cotisation Pro"}</p>
          </div>
        </div>

        <div style={authSt.tabs}>
          <button style={{ ...authSt.tab, ...(mode === "login" ? authSt.tabOn : {}) }} onClick={() => { setMode("login"); setError(""); }}>Connexion</button>
          <button style={{ ...authSt.tab, ...(mode === "register" ? authSt.tabOn : {}) }} onClick={() => { setMode("register"); setError(""); }}>Créer un compte</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={authSt.field}>
              <label style={authSt.label}>Nom de l'association</label>
              <div style={authSt.inputBox}>
                <input style={authSt.input} type="text" name="nom_association" value={form.nom_association} onChange={handleChange} placeholder="Ex : Association des anciens élèves" autoFocus />
              </div>
            </div>
          )}
          <div style={authSt.field}>
            <label style={authSt.label}>Adresse email</label>
            <div style={authSt.inputBox}>
              <input style={authSt.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" autoFocus={mode === "login"} />
            </div>
          </div>
          <div style={authSt.field}>
            <label style={authSt.label}>Mot de passe</label>
            <div style={authSt.inputBox}>
              <input style={{ ...authSt.input, paddingRight: "44px" }} type={showPwd ? "text" : "password"} name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder={mode === "register" ? "Minimum 6 caractères" : "Votre mot de passe"} />
              <button type="button" style={authSt.eyeBtn} onClick={() => setShowPwd((v) => !v)}>{showPwd ? <EyeOff /> : <EyeOpen />}</button>
            </div>
          </div>
          {mode === "register" && (
            <div style={authSt.field}>
              <label style={authSt.label}>Confirmer le mot de passe</label>
              <div style={authSt.inputBox}>
                <input style={{ ...authSt.input, paddingRight: "44px" }} type={showPwd2 ? "text" : "password"} name="confirmer_mot_de_passe" value={form.confirmer_mot_de_passe} onChange={handleChange} placeholder="Répétez le mot de passe" />
                <button type="button" style={authSt.eyeBtn} onClick={() => setShowPwd2((v) => !v)}>{showPwd2 ? <EyeOff /> : <EyeOpen />}</button>
              </div>
            </div>
          )}
          {error && <div style={authSt.error}>⚠️ {error}</div>}
          <button type="submit" style={{ ...authSt.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Envoi du code…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p style={authSt.switchText}>
          {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button style={authSt.switchLink} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
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
  submitBtn:  { width: "100%", padding: "13px", background: "linear-gradient(135deg,#2c3e50,#3498db)", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginTop: "4px", letterSpacing: "0.5px" },
  switchText: { textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#95a5a6" },
  switchLink: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontWeight: "bold", fontSize: "13px", padding: 0 },
};

// ═══════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ═══════════════════════════════════════════════════════
function App() {
  // ── Authentification ──────────────────────────────────
  const [compte, setCompte] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("cotisation_pro_compte")); } catch { return null; }
  });

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
  };

  // ─────────────────────────────────────────────────────
  const [currentText, setCurrentText] = useState("");
  const fullText = "Bienvenue sur Cotisation Pro, votre outil efficace de gestion des cotisations.";
  const [page, setPage] = useState("accueil");
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [showUnpaidOrPartial, setShowUnpaidOrPartial] = useState(false);
  const [showCotisationForm, setShowCotisationForm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
  const MOIS_LISTE = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
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

  // Animation texte accueil — démarre uniquement après connexion
  useEffect(() => {
    if (!compte) {
      setCurrentText("");
      return;
    }
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
  }, [compte]);

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
      alert("Veuillez remplir le montant dû et la période.");
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
      alert("Veuillez sélectionner un adhérent et saisir un montant.");
      return;
    }
    const periodeObj = periodes.find((p) => p.libelle === selectedPeriode);
    if (!periodeObj) return;

    const montantDu = parseAmount(periodeObj.montantDu);
    const montantPaye = Number(addPaiementFormData.montantPaye);

    if (isNaN(montantPaye) || montantPaye <= 0) {
      alert("Le montant doit être un nombre supérieur à zéro.");
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
      alert("Veuillez autoriser les popups dans votre navigateur pour imprimer.");
      return;
    }
    const logoUrl = new URL(logo, window.location.href).href;
    const sColor = statutColor(lastPaiement.statut);
    const sBg    = statutBg(lastPaiement.statut);
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
    <div><h1>Cotisation Pro</h1><p>Reçu officiel de paiement</p></div>
  </div>
  <div class="body">
    <div class="meta">
      <span>N° Reçu : <strong>${lastPaiement.numeroRecu}</strong></span>
      <span>Date : <strong>${lastPaiement.datePaiement}</strong></span>
    </div>
    <div class="section">
      <div class="section-title">Informations de l'adhérent</div>
      <div class="row"><span>Matricule</span><strong>${lastPaiement.matricule}</strong></div>
      <div class="row"><span>Nom</span><strong>${lastPaiement.nom}</strong></div>
      <div class="row"><span>Prénom</span><strong>${lastPaiement.prenom}</strong></div>
      <div class="row"><span>Téléphone</span><strong>${lastPaiement.telephone}</strong></div>
      <div class="row"><span>Email</span><strong>${lastPaiement.email}</strong></div>
    </div>
    <div class="section">
      <div class="section-title">Détails du paiement</div>
      <div class="row"><span>Période concernée</span><strong>${lastPaiement.periode}</strong></div>
      <div class="row"><span>Mode de paiement</span><strong>${lastPaiement.modePaiement}</strong></div>
      <div class="row"><span>Montant dû</span><strong>${lastPaiement.montantDu}</strong></div>
      <div class="row"><span>Montant déjà payé</span><strong>${lastPaiement.dejaPaye}</strong></div>
      <div class="row row-hl"><span>Ce paiement</span><strong>${lastPaiement.montantPaye}</strong></div>
      <div class="row"><span>Total payé</span><strong style="color:#2980b9">${lastPaiement.totalPaye}</strong></div>
      <div class="row"><span>Reste à payer</span><strong style="color:#e74c3c">${lastPaiement.reste}</strong></div>
    </div>
    <div class="statut">STATUT : ${lastPaiement.statut.toUpperCase()}</div>
    <div class="footer">
      <p>Cotisation Pro — Document généré automatiquement</p>
      <p>Ce reçu fait foi de paiement pour la période indiquée.</p>
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
      alert("Le nom et le prénom sont obligatoires.");
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
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || err?.message || "Impossible de modifier");
        }
        await loadAdherents();
        if (formData.photo) localStorage.setItem(`adherent_photo_${existing.id}`, formData.photo);
        setEditingIndex(null);
        showToast("Adhérent modifié avec succès !");
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
        alert(`⚠️ Cet adhérent existe déjà !\nMatricule : ${doublon.matricule} — ${doublon.nom} ${doublon.prenom}`);
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
        if (formData.photo && result.id) localStorage.setItem(`adherent_photo_${result.id}`, formData.photo);
        showToast("Adhérent ajouté avec succès !");
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
      showToast("Adhérent supprimé avec succès !");
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

  // ── Guard : si non connecté → page d'authentification ──
  if (!compte) {
    return (
      <AuthPage
        API_BASE={API_BASE}
        onSuccess={(c, type) => {
          sessionStorage.setItem("cotisation_pro_compte", JSON.stringify(c));
          setCompte(c);
          if (type === "register") showToast("Compte créé avec succès !");
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
          <button style={styles.btn} onClick={() => setPage("accueil")}>Accueil</button>
          <button style={styles.btn} onClick={() => { setPage("adherents"); setShowUnpaidOnly(false); setShowUnpaidOrPartial(false); }}>Adhérents</button>
          <button style={styles.btn} onClick={() => setPage("cotisations")}>Cotisations</button>
          <button style={styles.btn} onClick={() => setPage("historique")}>Historique</button>
          <button
            style={{ ...styles.btn, background: "#c0392b", marginLeft: "14px" }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div style={styles.content}>

        {/* ── ACCUEIL ─────────────────────────────────────────── */}
        {page === "accueil" && (
          <div>
            <div style={{ ...styles.welcomeText, display: "flex", alignItems: "center", gap: "24px" }}>
              <img src={logo} alt="Logo Cotisation Pro" style={{ height: "130px", width: "130px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{currentText}</span>
            </div>
            <div style={styles.cards}>
              <div style={styles.card}>
                <span style={{ fontSize: "36px", fontWeight: "bold", color: "#2c3e50" }}>Total adhérents : {adherents.length}</span>
              </div>
            </div>
            <div style={styles.summarySection}>
              <div style={{ ...styles.summaryCard, textAlign: "center" }}>
                <h3>Dernier adhérent ajouté</h3>
                <p>
                  {adherents[adherents.length - 1]
                    ? `${adherents[adherents.length - 1].nom} ${adherents[adherents.length - 1].prenom}`
                    : "—"}
                </p>
              </div>
              <div style={{ ...styles.summaryCard, textAlign: "center" }}>
                <h3>Total encaissé — période en cours</h3>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px" }}>
                  {currentPeriode ? currentPeriode.libelle : "Aucune période"}
                </p>
                <strong style={{ fontSize: "20px", color: "#27ae60" }}>
                  {formatAmount(totalEncaissePeriodeCourante)}
                </strong>
              </div>
              <div style={{ ...styles.summaryCard, textAlign: "center" }}>
                <h3>Dernière cotisation enregistrée</h3>
                <p>{periodes.length > 0 ? periodes[periodes.length - 1].libelle : "—"}</p>
              </div>
            </div>
            <div style={styles.alerts}>
              <div style={styles.alert}>
                {currentPeriode ? (
                  <>
                    <strong>{currentPeriodeNotPaidCount}</strong>{" "}
                    adhérent{currentPeriodeNotPaidCount !== 1 ? "s" : ""} n'ont pas encore payé
                    pour <strong>{currentPeriode.libelle}</strong>
                  </>
                ) : (
                  "Aucune période en cours"
                )}
                {currentPeriode && (
                  <button
                    style={styles.alertButton}
                    onClick={() => { setPage("nonRegle"); setShowUnpaidOrPartial(false); setShowUnpaidOnly(false); }}
                  >
                    Voir
                  </button>
                )}
              </div>
            </div>
            <div style={{ ...styles.summaryCard, marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: "#2c3e50" }}>Derniers paiements effectués</h3>
                <button style={styles.alertButton} onClick={() => setPage("historique")}>Voir plus</button>
              </div>
              {cinqDerniersPaiements.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cinqDerniersPaiements.map((pay, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f7f9fc", borderRadius: "6px", border: "1px solid #e0e6ed" }}>
                      <div>
                        <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{pay.nom} {pay.prenom}</span>
                        <span style={{ fontSize: "12px", color: "#7f8c8d", marginLeft: "8px" }}>[{pay.periode}]</span>
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
                  Aucun paiement enregistré
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
                <h1>Gestion des Adhérents</h1>
                {showUnpaidOrPartial && (
                  <div style={{ background: "#fef9e7", border: "1px solid #f39c12", borderRadius: "8px", padding: "12px 18px", marginBottom: "14px", color: "#7d6608", fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      Filtré : adhérents n'ayant pas encore payé ou ayant payé partiellement
                      {currentPeriode ? ` pour ${currentPeriode.libelle}` : ""}
                    </span>
                    <button style={{ background: "none", border: "1px solid #f39c12", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", color: "#7d6608", fontWeight: "bold" }} onClick={() => setShowUnpaidOrPartial(false)}>
                      ✕ Effacer
                    </button>
                  </div>
                )}
                {apiError && <div style={styles.errorMessage}>{apiError}</div>}
                {loadingAdherents && <div style={styles.infoMessage}>Chargement des adhérents…</div>}
                <div style={styles.toolbarSection}>
                  <div style={styles.toolbarTop}>
                    <button style={styles.addBtn} onClick={() => { setEditingIndex(null); setFormData({ matricule: "", nom: "", prenom: "", telephone: "", email: "", date: "", paid: false }); setSearchTerm(""); setShowForm(true); }}>
                      ➕ Ajouter un adhérent
                    </button>
                    <div style={styles.statsBox}>
                      <span>👥 Total: <strong>{adherents.length}</strong></span>
                    </div>
                    <button style={{ ...styles.addBtn, background: "#27ae60", marginLeft: "10px" }} onClick={exportExcel}>
                      ⬇️ Exporter Excel
                    </button>
                  </div>
                  <div style={styles.filtersSection}>
                    <input
                      type="text"
                      placeholder="🔍 Rechercher par nom, prénom ou matricule..."
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
                      <h2>{editingIndex !== null ? "✏️ Modifier un adhérent" : "➕ Ajouter un adhérent"}</h2>
                      <div style={styles.formRow}><label style={styles.label}>Nom *:</label><input name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex. Kouakou" style={styles.input} autoFocus /></div>
                      <div style={styles.formRow}><label style={styles.label}>Prénom *:</label><input name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex. Jean" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>Téléphone :</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Ex. +225 07 00 00 00 00" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>Email :</label><input name="email" value={formData.email} onChange={handleChange} placeholder="Ex. jean@example.com" type="email" style={styles.input} /></div>
                      <div style={styles.formRow}><label style={styles.label}>Date inscription :</label><input type="date" name="date" value={formData.date} onChange={handleChange} style={styles.input} /></div>
                      <div style={styles.formRow}>
                        <label style={styles.label}>Photo :</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
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
                            style={{ padding: "8px 14px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap" }}
                            onClick={() => document.getElementById("adherentPhotoInput").click()}
                          >
                            📷 Choisir
                          </button>
                          <span style={{ fontSize: "13px", color: formData.photoName ? "#2c3e50" : "#7f8c8d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                            {formData.photoName || "Aucune photo sélectionnée"}
                          </span>
                        </div>
                      </div>
                      <div style={styles.modalButtons}>
                        <button style={styles.addBtn} onClick={handleSave}>{editingIndex !== null ? "Modifier" : "Ajouter"}</button>
                        <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingIndex(null); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); }}>Annuler</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal confirmation suppression */}
                {showDeleteConfirm && (
                  <div style={styles.modalOverlay}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "360px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
                      <h3 style={{ color: "#e74c3c", marginTop: 0 }}>⚠️ Confirmer la suppression</h3>
                      <p style={{ color: "#555", lineHeight: "1.6" }}>Êtes-vous sûr de vouloir supprimer cet adhérent ?<br /><strong>Cette action est irréversible.</strong></p>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                        <button style={styles.cancelBtn} onClick={() => { handleDelete(deleteIndex); setShowDeleteConfirm(false); setDeleteIndex(null); }}>🗑️ Supprimer</button>
                        <button style={styles.addBtn} onClick={() => { setDeleteIndex(null); setShowDeleteConfirm(false); }}>Annuler</button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.tableContainer}>
                  {filteredAdherents.length === 0 ? (
                    <div style={styles.emptyState}><p>Aucun adhérent trouvé</p></div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Matricule</th><th style={styles.th}>Nom</th><th style={styles.th}>Prénom</th>
                          <th style={styles.th}>Téléphone</th><th style={styles.th}>Email</th>
                          <th style={styles.th}>Date inscription</th><th style={styles.th}>Actions</th>
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
                              <button style={styles.detailsBtn} onClick={() => setSelectedAdherentId(a.id)}>👁️</button>
                              <button style={styles.actionBtn} onClick={() => { const ad = adherents[a.originalIndex]; setEditingIndex(a.originalIndex); setFormData({ ...ad, photo: "", photoName: localStorage.getItem(`adherent_photo_${ad.id}`) ? "Photo existante" : "" }); setSearchTerm(""); setShowForm(true); }}>✏️</button>
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
                <button style={styles.backBtn} onClick={() => setSelectedAdherentId(null)}>← Retour à la liste</button>
                {(() => {
                  const adherent = adherents.find((a) => a.id === selectedAdherentId);
                  return adherent ? (
                    <div style={styles.detailsContainer}>
                      <div style={styles.detailsHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                          {localStorage.getItem(`adherent_photo_${adherent.id}`) ? (
                            <img
                              src={localStorage.getItem(`adherent_photo_${adherent.id}`)}
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
                          ["Matricule", adherent.matricule],
                          ["Nom", adherent.nom],
                          ["Prénom", adherent.prenom],
                          ["Téléphone", adherent.telephone || "Non renseigné"],
                          ["Email", adherent.email || "Non renseigné"],
                          ["Date d'inscription", adherent.date ? new Date(adherent.date).toLocaleDateString("fr-FR") : "-"],
                        ].map(([label, val]) => (
                          <div key={label} style={styles.detailCard}>
                            <h3 style={{ color: "#2c3e50", marginTop: 0, marginBottom: "10px", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>{label}</h3>
                            <p style={{ color: "#34495e", fontSize: "16px", margin: 0, fontWeight: "500" }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      <div style={styles.detailsActions}>
                        <button style={styles.addBtn} onClick={() => { setEditingIndex(adherents.findIndex((a) => a.id === selectedAdherentId)); setFormData({ ...adherent, photo: "", photoName: localStorage.getItem(`adherent_photo_${adherent.id}`) ? "Photo existante" : "" }); setSearchTerm(""); setShowForm(true); setSelectedAdherentId(null); }}>✏️ Modifier</button>
                        <button style={styles.cancelBtn} onClick={() => { setDeleteIndex(adherent.id); setShowDeleteConfirm(true); setSelectedAdherentId(null); }}>🗑️ Supprimer</button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.emptyState}><p>Adhérent non trouvé</p></div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── COTISATIONS ─────────────────────────────────────── */}
        {page === "cotisations" && (
          <div>
            <h1>Cotisations</h1>

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
                  <h2 style={{ margin: "0 0 8px", color: "#27ae60", fontSize: "20px" }}>Paiement effectué avec succès !</h2>
                  {lastPaiement && (
                    <p style={{ color: "#7f8c8d", fontSize: "14px", margin: "0 0 8px" }}>
                      {lastPaiement.nom} {lastPaiement.prenom}
                    </p>
                  )}
                  {lastPaiement && (
                    <p style={{ color: "#2c3e50", fontSize: "15px", fontWeight: "bold", margin: "0 0 22px" }}>
                      Montant payé : <span style={{ color: "#27ae60" }}>{lastPaiement.montantPaye}</span>
                    </p>
                  )}
                  <p style={{ color: "#2c3e50", marginBottom: "20px", fontSize: "14px" }}>Voulez-vous générer un reçu pour ce paiement ?</p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button
                      style={{ padding: "10px 22px", background: "#2980b9", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                      onClick={() => { setShowRecu(true); setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                    >
                      🧾 Générer un reçu
                    </button>
                    <button
                      style={{ padding: "10px 18px", background: "transparent", color: "#7f8c8d", border: "1px solid #bdc3c7", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                      onClick={() => { setShowSuccessMessage(false); setShowRecuPrompt(false); }}
                    >
                      Non, merci
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.toolbarSection}>
              <div style={styles.toolbarTop}>
                <button style={styles.addBtn} onClick={() => { setCotisationFormData({ montantDu: "", mois: "", annee: String(ANNEE_COURANTE), periode: "" }); setShowCotisationForm(true); }}>
                  ➕ Nouvelle cotisation
                </button>
                <div style={styles.statsBox}>
                  <span>Périodes : <strong>{periodes.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal nouvelle cotisation */}
            {showCotisationForm && (
              <div style={styles.modalOverlay}>
                <div ref={modalRef} style={{ ...styles.modal, ...modalPos }} onMouseDown={dragProps}>
                  <h2>Nouvelle cotisation</h2>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Montant dû :</label>
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
                    <label style={styles.label}>Période de cotisation :</label>
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
                        <option value="">-- Mois --</option>
                        {MOIS_LISTE.map((m) => (
                          <option key={m} value={m}>{m}</option>
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
                      Période : <strong style={{ color: "#2c3e50" }}>{cotisationFormData.periode}</strong>
                    </div>
                  )}
                  <div style={styles.modalButtons}>
                    <button style={styles.addBtn} onClick={handleSaveCotisation}>Enregistrer</button>
                    <button style={styles.cancelBtn} onClick={() => { setShowCotisationForm(false); setModalPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); }}>Annuler</button>
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
                      Période :
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
                            {p.libelle}
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
                        ➕ Ajouter un paiement
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
                        ⬇️ Exporter Excel
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
                        📊 {selectedPeriode} — Montant dû :{" "}
                        <span style={{ color: "#e74c3c" }}>{selectedPeriodeObj.montantDu} F</span>
                      </h3>

                      {/* Modal ajouter un paiement */}
                      {showAddPaiementForm && selectedPeriodeObj && (
                        <div style={styles.modalOverlay}>
                          <div style={{ ...styles.modal, position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", cursor: "default" }}>
                            <h2>Ajouter un paiement</h2>
                            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 16px" }}>
                              Période : <strong>{selectedPeriode}</strong> — Montant dû :{" "}
                              <strong>{selectedPeriodeObj.montantDu} F</strong>
                            </p>

                            {/* Sélection de l'adhérent */}
                            <div style={styles.formRow}>
                              <label style={styles.label}>Adhérent :</label>
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
                                <option value="">-- Sélectionner un adhérent --</option>
                                {adherents.filter((a) => eligibleSet.has(a.id)).map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nom} {a.prenom}{a.matricule ? ` (${a.matricule})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Montant payé — chiffres uniquement */}
                            <div style={styles.formRow}>
                              <label style={styles.label}>Montant payé :</label>
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
                              <label style={styles.label}>Mode de paiement :</label>
                              <select
                                value={addPaiementFormData.modePaiement}
                                onChange={(e) => setAddPaiementFormData({ ...addPaiementFormData, modePaiement: e.target.value })}
                                style={styles.input}
                              >
                                <option>Espèces</option>
                                <option>Mobile Money</option>
                                <option>Virement</option>
                                <option>Chèque</option>
                                <option>Autre</option>
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
                                          ⚠️ Montant supérieur au reste à payer ({formatAmount(d - deja)})
                                        </div>
                                      )}
                                      <div style={styles.calcRow}><span>Montant dû :</span><strong>{formatAmount(d)}</strong></div>
                                      <div style={styles.calcRow}><span>Déjà payé :</span><strong style={{ color: "#7f8c8d" }}>{formatAmount(deja)}</strong></div>
                                      <div style={styles.calcRow}><span>Ce paiement :</span><strong style={{ color: "#27ae60" }}>{formatAmount(p)}</strong></div>
                                      <div style={{ ...styles.calcRow, borderTop: "1px solid #e0e6ed", paddingTop: "8px", marginTop: "4px" }}>
                                        <span>Total payé :</span><strong style={{ color: "#2980b9" }}>{formatAmount(total)}</strong>
                                      </div>
                                      <div style={styles.calcRow}><span>Reste à payer :</span><strong style={{ color: "#e74c3c" }}>{formatAmount(r)}</strong></div>
                                      <div style={styles.calcRow}><span>Statut :</span><strong style={{ color: statutColor(s) }}>{s}</strong></div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            <div style={styles.modalButtons}>
                              <button style={{ ...styles.addBtn, background: "#0daf3e" }} onClick={handleSaveAddPaiement}>Payer</button>
                              <button style={styles.cancelBtn} onClick={() => { setShowAddPaiementForm(false); setAddPaiementFormData({ adherentId: "", montantPaye: "", modePaiement: "Espèces" }); setSelectedAdherentForPayment(null); }}>Annuler</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filtres avec compteurs */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
                        {[
                          ["tous",    "Tous",     "#7f8c8d", nbPaye + nbPartiel + nbImpaye],
                          ["Payé",    "Payés",    "#27ae60", nbPaye],
                          ["Impayé",  "Impayés",  "#e74c3c", nbImpaye],
                          ["Partiel", "Partiels", "#f39c12", nbPartiel],
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
                          <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "10px", padding: "16px 20px", marginBottom: "15px" }}>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-around", marginBottom: "14px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Montant collecté</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#27ae60" }}>{formatAmount(totalCollecte)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#e0e6ed" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total attendu</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2c3e50" }}>{formatAmount(totalDu)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#e0e6ed" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Reste à collecter</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#e74c3c" }}>{formatAmount(resteACollecter)}</div>
                              </div>
                              <div style={{ width: "1px", background: "#e0e6ed" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Payeurs complets</div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#3498db" }}>{nbPayeComplet} / {totalPeriode}</div>
                              </div>
                            </div>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#7f8c8d", marginBottom: "5px" }}>
                                <span>Progression de la collecte</span>
                                <strong style={{ color: barColor }}>{pct.toFixed(1)} %</strong>
                              </div>
                              <div style={{ background: "#e0e6ed", borderRadius: "10px", height: "12px", overflow: "hidden" }}>
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
                              <th style={styles.th}>Matricule</th><th style={styles.th}>Nom</th><th style={styles.th}>Prénom</th>
                              <th style={styles.th}>Téléphone</th><th style={styles.th}>Email</th>
                              <th style={styles.th}>Solde payé</th><th style={styles.th}>Reste</th>
                              <th style={styles.th}>Total dû</th><th style={styles.th}>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtres.length === 0 ? (
                              <tr>
                                <td colSpan="9" style={{ ...styles.td, textAlign: "center", padding: "20px", color: "#7f8c8d" }}>
                                  {adherents.length === 0 ? "Aucun adhérent enregistré." : "Aucun résultat pour ce filtre."}
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
                                  <td style={styles.td}>
                                    <span style={{ padding: "4px 12px", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "13px", background: statutColor(c.statut) }}>
                                      {c.statut}
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
                <p>Aucune cotisation enregistrée. Cliquez sur "Nouvelle cotisation" pour commencer.</p>
              </div>
            )}
          </div>
        )}

        {/* ── NON RÉGLÉS ──────────────────────────────────────── */}
        {page === "nonRegle" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <button style={styles.cancelBtn} onClick={() => setPage("accueil")}>← Retour</button>
              <h1 style={{ margin: 0 }}>Non réglés</h1>
            </div>
            {currentPeriode && (
              <p style={{ color: "#7f8c8d", marginBottom: "20px", fontSize: "14px" }}>
                Période en cours : <strong style={{ color: "#2c3e50" }}>{currentPeriode.libelle}</strong> — Montant dû :{" "}
                <strong style={{ color: "#e74c3c" }}>{currentPeriode.montantDu} F</strong>
              </p>
            )}
            {!currentPeriode ? (
              <div style={styles.emptyState}><p>Aucune période de cotisation enregistrée.</p></div>
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
                <div style={styles.emptyState}><p>🎉 Tous les adhérents ont réglé leur cotisation pour cette période !</p></div>
              ) : (
                <>
                  <p style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                    {nonRegles.length} adhérent{nonRegles.length > 1 ? "s" : ""} non réglé{nonRegles.length > 1 ? "s" : ""}
                  </p>
                  <div style={styles.tableContainer}>
                    <table style={{ ...styles.table, tableLayout: "auto" }}>
                      <thead>
                        <tr>
                          <th style={styles.th}>N°</th>
                          <th style={styles.th}>Matricule</th>
                          <th style={styles.th}>Nom</th>
                          <th style={styles.th}>Prénom</th>
                          <th style={styles.th}>Téléphone</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Solde payé</th>
                          <th style={styles.th}>Reste à payer</th>
                          <th style={styles.th}>Statut</th>
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
                            <td style={styles.td}>
                              <span style={{ padding: "4px 12px", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "13px", background: statutColor(c.statut) }}>
                                {c.statut}
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
            <h1>Historique des paiements</h1>
            <div style={{ background: "#f7f9fc", padding: "12px 18px", borderRadius: "8px", marginBottom: "16px", display: "flex", gap: "24px", flexWrap: "wrap", border: "1px solid #e0e6ed" }}>
              <span>Total transactions : <strong>{historiqueTransactions.length}</strong></span>
              <span>
                Montant total encaissé :{" "}
                <strong style={{ color: "#27ae60" }}>
                  {formatAmount(historiqueTransactions.reduce((s, t) => s + parseAmount(t.montantPaye), 0))}
                </strong>
              </span>
            </div>
            <div style={styles.toolbarSection}>
              <input
                type="text"
                placeholder="🔍 Rechercher par nom, prénom, période ou N° reçu..."
                value={searchHistorique}
                onChange={(e) => setSearchHistorique(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {historiqueTransactions.length === 0 ? (
              <div style={styles.emptyState}><p>Aucun paiement enregistré pour le moment.</p></div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={{ ...styles.table, tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>N° Reçu</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Adhérent</th>
                      <th style={styles.th}>Période</th>
                      <th style={styles.th}>Montant payé</th>
                      <th style={styles.th}>Total payé</th>
                      <th style={styles.th}>Reste</th>
                      <th style={styles.th}>Mode</th>
                      <th style={styles.th}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...historiqueTransactions].reverse().filter((t) => {
                      const q = searchHistorique.toLowerCase();
                      if (!q) return true;
                      return (
                        (t.nom || "").toLowerCase().includes(q) ||
                        (t.prenom || "").toLowerCase().includes(q) ||
                        (t.periode || "").toLowerCase().includes(q) ||
                        (t.numeroRecu || "").toLowerCase().includes(q)
                      );
                    }).map((t, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                        <td style={{ ...styles.td, fontSize: "12px", color: "#7f8c8d" }}>{t.numeroRecu}</td>
                        <td style={styles.td}>{t.datePaiement}</td>
                        <td style={styles.td}><strong>{t.nom} {t.prenom}</strong></td>
                        <td style={styles.td}>{t.periode}</td>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#27ae60" }}>{t.montantPaye}</td>
                        <td style={{ ...styles.td, color: "#2980b9" }}>{t.totalPaye}</td>
                        <td style={{ ...styles.td, color: "#e74c3c" }}>{t.reste}</td>
                        <td style={styles.td}>{t.modePaiement}</td>
                        <td style={styles.td}>
                          <span style={{ padding: "3px 10px", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "12px", background: t.statut === "Payé" ? "#27ae60" : t.statut === "Partiel" ? "#f39c12" : "#e74c3c" }}>
                            {t.statut}
                          </span>
                        </td>
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
              <button onClick={handlePrintRecu} style={{ padding: "8px 18px", background: "#2c3e50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>🖨️ Imprimer</button>
              <button onClick={() => setShowRecu(false)} style={{ padding: "8px 18px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>✕ Fermer</button>
            </div>
            <div ref={recuRef} style={{ padding: "30px" }}>
              <div style={{ textAlign: "center", borderBottom: "3px double #2c3e50", paddingBottom: "18px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <img src={logo} alt="Logo" style={{ height: "52px", width: "52px", objectFit: "contain" }} />
                  <h1 style={{ margin: 0, fontSize: "26px", color: "#2c3e50", letterSpacing: "3px", textTransform: "uppercase" }}>Cotisation Pro</h1>
                </div>
                <p style={{ margin: "6px 0 0", color: "#7f8c8d", fontSize: "13px" }}>Reçu officiel de paiement</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "22px", fontSize: "13px", color: "#7f8c8d" }}>
                <span>N° Reçu : <strong style={{ color: "#2c3e50" }}>{lastPaiement.numeroRecu}</strong></span>
                <span>Date : <strong style={{ color: "#2c3e50" }}>{lastPaiement.datePaiement}</strong></span>
              </div>
              <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
                <h3 style={styles.recuSectionTitle}>Informations de l'adhérent</h3>
                <div style={styles.recuRow}><span>Matricule</span><strong>{lastPaiement.matricule}</strong></div>
                <div style={styles.recuRow}><span>Nom</span><strong>{lastPaiement.nom}</strong></div>
                <div style={styles.recuRow}><span>Prénom</span><strong>{lastPaiement.prenom}</strong></div>
                <div style={styles.recuRow}><span>Téléphone</span><strong>{lastPaiement.telephone}</strong></div>
                <div style={styles.recuRow}><span>Email</span><strong>{lastPaiement.email}</strong></div>
              </div>
              <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
                <h3 style={styles.recuSectionTitle}>Détails du paiement</h3>
                <div style={styles.recuRow}><span>Période concernée</span><strong>{lastPaiement.periode}</strong></div>
                <div style={styles.recuRow}><span>Mode de paiement</span><strong>{lastPaiement.modePaiement}</strong></div>
                <div style={styles.recuRow}><span>Montant dû</span><strong>{lastPaiement.montantDu}</strong></div>
                <div style={styles.recuRow}><span>Montant déjà payé</span><strong>{lastPaiement.dejaPaye}</strong></div>
                <div style={{ ...styles.recuRow, background: "#eafaf1", borderRadius: "6px", padding: "8px", margin: "6px 0" }}>
                  <span>Ce paiement</span><strong style={{ color: "#27ae60", fontSize: "16px" }}>{lastPaiement.montantPaye}</strong>
                </div>
                <div style={styles.recuRow}><span>Total payé</span><strong style={{ color: "#2980b9" }}>{lastPaiement.totalPaye}</strong></div>
                <div style={styles.recuRow}><span>Reste à payer</span><strong style={{ color: "#e74c3c" }}>{lastPaiement.reste}</strong></div>
              </div>
              <div style={{ textAlign: "center", background: statutBg(lastPaiement.statut), border: `2px solid ${statutColor(lastPaiement.statut)}`, borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: statutColor(lastPaiement.statut) }}>
                  Statut : {lastPaiement.statut.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#bdc3c7", borderTop: "1px solid #ecf0f1", paddingTop: "14px" }}>
                <p style={{ margin: 0 }}>Cotisation Pro — Document généré automatiquement</p>
                <p style={{ margin: "4px 0 0" }}>Ce reçu fait foi de paiement pour la période indiquée.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMATION DÉCONNEXION ──────────────────── */}
      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: "white", borderRadius: "14px", padding: "32px 36px", width: "360px", maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#2c3e50" }}>Déconnexion</h3>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#7f8c8d", lineHeight: "1.5" }}>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                style={{ padding: "11px 28px", background: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Annuler
              </button>
              <button
                style={{ padding: "11px 28px", background: "#c0392b", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
              >
                Se déconnecter
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
  card: { padding: "20px", background: "#ecf0f1", textAlign: "center", minWidth: "180px", borderRadius: "8px" },
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
  summaryCard: { background: "#f7f9fc", padding: "15px", borderRadius: "10px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  alerts: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  alert: { background: "#ffecec", color: "#b02a2a", padding: "12px 15px", borderRadius: "8px", fontWeight: "600" },
  welcomeText: { margin: "30px 0 40px", color: "#2c3e50", fontSize: "clamp(20px, 2.1vw, 36px)", fontWeight: "bold", width: "100%", boxSizing: "border-box", lineHeight: "1.4", backgroundColor: "#f7f9fc", padding: "20px 28px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  toolbarSection: { background: "#f7f9fc", padding: "15px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e0e6ed" },
  toolbarTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0", gap: "15px", flexWrap: "wrap" },
  statsBox: { display: "flex", gap: "20px", background: "white", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
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
