import React, { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Crosshair, Shield, TrendingUp, Rocket, BookOpen, Trophy, Calendar, Activity, ShieldCheck, X as XIcon } from "lucide-react";

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500,
            padding: "12px 18px", borderRadius: 8, maxWidth: 360, pointerEvents: "auto",
            background: t.type === "success" ? "rgba(52,211,153,0.12)" : t.type === "info" ? "rgba(34,211,238,0.1)" : "rgba(251,113,133,0.12)",
            border: `1px solid ${t.type === "success" ? "rgba(52,211,153,0.35)" : t.type === "info" ? "rgba(34,211,238,0.3)" : "rgba(251,113,133,0.35)"}`,
            color: t.type === "success" ? "var(--green)" : t.type === "info" ? "var(--accent)" : "var(--red)",
            backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            animation: "fadeSlideIn 0.25s ease",
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── ACHIEVEMENT ALERT SYSTEM ─────────────────────────────────────────────────
const BADGE_ICONS = {
  "On Fire": Flame,
  "Disciplined": Target,
  "Sniper": Crosshair,
  "Rule Keeper": Shield,
  "Green Week": TrendingUp,
  "Best Day Ever": Rocket,
  "Journaler": BookOpen,
  "Elite": Trophy,
  "Green Month": Calendar,
  "Marathon": Activity,
  "Ironclad": ShieldCheck,
};

const AchievementAlertContext = createContext(null);

export function AchievementAlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const dismiss = useCallback((id) => {
    setAlerts((a) => a.filter((x) => x.id !== id));
  }, []);

  const triggerAchievement = useCallback((badge) => {
    const id = Date.now() + Math.random();
    setAlerts((a) => [...a, { ...badge, id }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <AchievementAlertContext.Provider value={triggerAchievement}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        <AnimatePresence>
          {alerts.map((a) => (
            <AchievementAlertCard key={a.id} alert={a} onDismiss={() => dismiss(a.id)} />
          ))}
        </AnimatePresence>
      </div>
    </AchievementAlertContext.Provider>
  );
}

export function useAchievement() {
  return useContext(AchievementAlertContext);
}

function AchievementAlertCard({ alert, onDismiss }) {
  const { name, desc, color } = alert;
  const Icon = BADGE_ICONS[name] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        pointerEvents: "auto",
        width: 340,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${color}18 0%, var(--bg-secondary) 55%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 14,
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px var(--border-primary)`,
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient blur blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -12, left: -12, width: 72, height: 72, borderRadius: "50%", background: color, filter: "blur(28px)", opacity: 0.18 }} />
        <div style={{ position: "absolute", bottom: -12, right: -12, width: 72, height: 72, borderRadius: "50%", background: color, filter: "blur(28px)", opacity: 0.12 }} />
      </div>

      {/* Content row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        {/* Spring icon pill */}
        <motion.div
          initial={{ rotate: -15, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            padding: 10,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            boxShadow: `0 4px 12px ${color}44`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color="#fff" strokeWidth={2.5} />
        </motion.div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, marginBottom: 4 }}
          >
            Achievement Unlocked
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}
          >
            {name}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            style={{ fontSize: 12, color: "var(--text-secondary)" }}
          >
            {desc}
          </motion.div>
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex", flexShrink: 0 }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Badge pill — spring in */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
        style={{
          position: "absolute", top: 10, right: 34,
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
          color, background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: 20, padding: "2px 8px",
        }}
      >
        New
      </motion.div>

      {/* Timer bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--border-primary)" }}>
        <div style={{ height: "100%", background: color, animation: "achieveBar 5s linear forwards" }} />
      </div>
    </motion.div>
  );
}
