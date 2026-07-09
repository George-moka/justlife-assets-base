import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Search, Star, Plus, Minus, ChevronRight, Check, Clock, ArrowRight, Sparkles, Copy, Loader2, AlertCircle } from "lucide-react";

/* Justlife DS — Live Screen Builder (components matched to Figma DS) */

const ASSET_BASE =
  (typeof window !== "undefined" && window.JUSTLIFE_ASSET_BASE) ||
  "https://cdn.jsdelivr.net/gh/George-moka/justlife-assets-base@main/";

// ---- DS tokens ----
// Justlife DS token source — resolved from @justlife/tokens (single source of truth; values mirror the DS repo)
const DS = {
  bg: { primary: "#FFFFFF", secondary: "#FBFAF7", tertiary: "#F5F5F5", canvas: "#FBFAF7", brand: "#00C3FF", brandHover: "#00A8DC", brandSubtle: "#B3EEFF", selected: "#F4FEFF", inverse: "#1A1A1A", tertiaryAction: "#135163" },
  text: { primary: "#1A1A1A", secondary: "#666666", tertiary: "#AAAAAA", disabled: "#7E8080", brand: "#00C3FF", onBrand: "#FFFFFF", inverse: "#FFFFFF", link: "#00A8DC", success: "#496B00", error: "#D42222" },
  border: { default: "#DDDDDD", brand: "#00C3FF", strong: "#7E8080" },
  blue: { b50: "#E6F9FF", b900: "#134453" },
  green: { g300: "#BBFF33", g500: "#8BC34A" },
  yellow: { y500: "#FFCC27", y800: "#7A4A00" },
  red: { r500: "#EF4444", r600: "#D42222" },
  success: { text: "#496B00", bgSoft: "#E4FFB8", bgSolid: "#8BC34A", chip: "#BBFF33" },
  danger: { text: "#D42222", bgSoft: "#FFE0E0", solid: "#EF4444" },
  btn: { tertiaryBg: "#135163", tertiaryText: "#FFFFFF", disabledBg: "#DDDDDD", disabledText: "#7E8080", disabledBorder: "#DDDDDD" },
  radioSelected: "#00C3FF",
};
// Semantic aliases used across renderers — every value traces to the DS token source above
const C = {
  brand: DS.bg.brand, link: DS.text.link, inkOnBrand: DS.text.onBrand,
  bg: DS.bg.primary, bg2: DS.bg.secondary, bg3: DS.bg.tertiary,
  text: DS.text.primary, text2: DS.text.secondary, text3: DS.text.tertiary, disabled: DS.text.disabled,
  border: DS.border.default, borderStrong: DS.border.strong,
  selected: DS.bg.selected, brandBg: DS.blue.b50,
  success: DS.success.text, successBg: DS.success.bgSoft, danger: DS.danger.text, dangerBg: DS.danger.bgSoft,
  yellow: DS.yellow.y500, yellowInk: DS.yellow.y800, purple: "#AD6BB5",
};
const R = { xs: 4, r6: 6, sm: 8, md: 8, lg: 12, xl: 20, pill: 999 };
const S = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, x2: 20 };
const FONT = "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

function Dh({ size = 11, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: 2 }}>
      <path d="M7 4h4.5a6 8 0 0 1 0 16H7" fill="none" stroke={color} strokeWidth={2.4} />
      <path d="M3.5 10h12M3.5 14.5h12" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}
// strip any currency word/symbol the model may include ("AED 149" -> "149") so the Dirham mark isn't doubled
const cleanNum = (v) => {
  if (v == null) return "";
  let s = String(v).replace(/\b(aed|sar|dhs?|usd|د\.?\s*إ|ر\.?\s*س|درهم|ريال)\b/gi, "").replace(/[₯﷼]/g, "");
  return s.replace(/\s{2,}/g, " ").trim();
};
const hasNum = (s) => /\d/.test(s);
function Price({ value, old, color = C.text, size = 11 }) {
  const v = cleanNum(value), o = cleanNum(old);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT }}>
      <span style={{ display: "inline-flex", alignItems: "center", fontWeight: 600, color, fontSize: size }}>
        {hasNum(v) && <Dh size={size - 2} color={color} />}{v}
      </span>
      {o && (
        <span style={{ display: "inline-flex", alignItems: "center", color: C.disabled, fontSize: size - 1, textDecoration: "line-through" }}>
          {hasNum(o) && <Dh size={size - 3} color={C.disabled} />}{o}
        </span>
      )}
    </span>
  );
}

// Justlife brand mark (recreated hook + wordmark, brand blue)
function JustlifeMark({ size = 26 }) {
  return (
    <svg width={size * 0.82} height={size} viewBox="0 0 26 30" fill="none" style={{ display: "block" }}>
      <path d="M17 4 L17 17.5 A8 8 0 1 1 9 9.5" fill="none" stroke={C.brand} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3 l5.4 3.3 -5.4 3.3 z" fill={C.brand} />
    </svg>
  );
}
function JustlifeLogo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <JustlifeMark size={24} />
      <span style={{ fontWeight: 600, fontSize: 20, color: C.brand, letterSpacing: -0.5, lineHeight: 1 }}>justlife</span>
    </span>
  );
}

// ---- assets ----
const AssetCtx = createContext({ map: null, groups: null, catalog: null });
const useAssets = () => useContext(AssetCtx);
function Img({ id, alt, style, radius = 0, ph = C.bg3 }) {
  const { map } = useAssets();
  const [bad, setBad] = useState(false);
  const src = id && map && map[id] ? map[id] : (id && /^(https?:|\/)/.test(id) ? id : null);
  if (!src || bad) return <div style={{ background: ph, borderRadius: radius, ...style }} />;
  return <img src={src} alt={alt || ""} onError={() => setBad(true)} style={{ objectFit: "cover", display: "block", borderRadius: radius, ...style }} />;
}

// ---- small DS atoms ----
function AddBtn({ label = "Add", outline }) {
  const base = { height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: R.r6, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" };
  return <span style={outline
    ? { ...base, border: `1px solid ${C.brand}`, color: C.brand, background: "transparent", padding: "0 12px" }
    : { ...base, background: C.brand, color: "#fff", padding: "0 8px" }}>{label}</span>;
}
function ControlDot({ type = "radio", selected }) {
  if (type === "checkbox")
    return <span style={{ width: 16, height: 16, flex: "0 0 16px", borderRadius: 4, border: `1.5px solid ${selected ? C.brand : C.borderStrong}`, background: selected ? C.brand : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{selected && <Check size={11} color="#fff" />}</span>;
  return <span style={{ width: 18, height: 18, flex: "0 0 18px", borderRadius: "50%", border: `2px solid ${selected ? C.brand : C.borderStrong}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{selected && <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.brand }} />}</span>;
}
function StatusBadge({ status }) {
  const m = { Active: [C.brandBg, C.link], Confirmed: [C.brandBg, C.link], Completed: [C.successBg, C.success], Cancelled: [C.dangerBg, C.danger], Pending: ["#FFF3DD", "#9A6400"] };
  const [bg, fg] = m[status] || m.Active;
  return <span style={{ background: bg, color: fg, fontSize: 9, fontWeight: 600, padding: "3px 6px", borderRadius: R.xs, whiteSpace: "nowrap" }}>{status}</span>;
}

// ============================================================
//  COMPONENTS (matched to DS)
// ============================================================
function SearchBar({ placeholder = "Search for a service" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: S.md, background: C.bg, border: `1px solid ${C.border}`, borderRadius: R.pill, padding: "10px 14px", color: C.text3 }}>
      <Search size={16} color={C.text3} /><span style={{ fontSize: 11 }}>{placeholder}</span>
    </div>
  );
}

function HeroBanner({ title = "Spring Clean Sale", subtitle = "Book today and save big this season", cta = "Book Now", image, discount }) {
  return (
    <div style={{ position: "relative", borderRadius: R.xl, overflow: "hidden", minHeight: 160, background: "linear-gradient(120deg,#DDF3C6,#CFEFF6)" }}>
      <Img id={image} ph="transparent" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {image && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,0) 100%)" }} />}
      <div style={{ position: "relative", padding: 16, maxWidth: "72%" }}>
        {discount && <span style={{ display: "inline-block", background: C.yellow, color: C.yellowInk, fontWeight: 600, fontSize: 11, padding: "3px 8px", borderRadius: R.xs, marginBottom: 8 }}>{discount}</span>}
        <div style={{ fontWeight: 600, fontSize: 11, color: image ? "#fff" : C.text, lineHeight: 1.25 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: image ? "rgba(255,255,255,.92)" : C.text2, margin: "4px 0 12px" }}>{subtitle}</div>}
        <span style={{ display: "inline-block", background: C.brand, color: "#fff", fontWeight: 600, fontSize: 11, padding: "8px 16px", borderRadius: R.pill }}>{cta}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title = "Our Services", action = "See All" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontWeight: 600, fontSize: 11, color: C.text }}>{title}</div>
      {action && <div style={{ color: C.link, fontWeight: 600, fontSize: 11 }}>{action}</div>}
    </div>
  );
}

// Service Tile (grid item) — bg tertiary card, tilted 3D icon, label, optional yellow tag
function ServiceTile({ label = "Service", icon, tag }) {
  return (
    <div style={{ position: "relative", background: C.bg3, borderRadius: R.lg, minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 4px" }}>
      {tag && <span style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", background: C.yellow, color: C.yellowInk, fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: R.xs, whiteSpace: "nowrap", zIndex: 2 }}>{tag}</span>}
      <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: "rotate(10deg)", filter: "drop-shadow(0 5px 6px rgba(0,0,0,.13))" }}>
          <Img id={icon} ph="transparent" style={{ width: 46, height: 46, objectFit: "contain" }} />
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#232424", textAlign: "center", lineHeight: "13px", letterSpacing: 0.25 }}>{label}</div>
    </div>
  );
}
function ServiceGrid({ title = "Our Services", action = "See All", items }) {
  const tiles = items && items.length ? items : [
    { label: "General Cleaning", icon: "general-cleaning" }, { label: "Deep Cleaning", icon: "deep-cleaning", tag: "30% off" },
    { label: "AC Cleaning", icon: "ac-cleaning" }, { label: "Salon & Spa", icon: "salon-spa" },
    { label: "Handymen", icon: "handymen" }, { label: "Pest Control", icon: "pest-control" },
    { label: "Laundry", icon: "laundry-dry-cleaning" }, { label: "Packers & Movers", icon: "packers-movers" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
      <SectionHeader title={title} action={action} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", columnGap: S.md, rowGap: 14 }}>
        {tiles.map((t, i) => <ServiceTile key={i} {...t} />)}
      </div>
    </div>
  );
}

// Service Card — bg secondary, radius 20
function ServiceCard({ image, title = "Summer Ready Combo", duration = "120 min", desc = "A combo of classic manicure and pedicure treatment for perfect clean nails", price = "100", oldPrice = "399.00", cta = "Add" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.xl, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Img id={image} radius={R.lg} ph={C.bg3} style={{ width: 64, height: 64, flex: "0 0 64px" }} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: C.text, lineHeight: "20px" }}>{title}</div>
          {duration && <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.text2, fontSize: 11 }}><Clock size={12} color={C.text2} />{duration}</div>}
          {desc && <div style={{ fontSize: 11, color: C.text2, lineHeight: "14px" }}>{desc}</div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Price value={price} old={oldPrice} size={11} /><AddBtn label={cta} outline={cta === "Select"} />
          </div>
        </div>
      </div>
    </div>
  );
}
function ProductCard(p) { return <ServiceCard {...p} />; }

// Combo Selection — selectable option row (image + title + inline price + checkbox/radio)
function ComboSelection({ image, title = "Classic Mani-Pedi", price = "100", oldPrice = "399", control = "checkbox", selected = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", borderRadius: R.lg, border: `1.5px solid ${selected ? C.brand : C.border}`, background: selected ? C.selected : C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        {image !== undefined && <Img id={image} radius={R.sm} ph={C.bg3} style={{ width: 44, height: 44, flex: "0 0 44px" }} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.text }}>{title}</div>
          {price && <Price value={price} old={oldPrice} size={11} />}
        </div>
      </div>
      <ControlDot type={control} selected={selected} />
    </div>
  );
}

// Payment brand -> asset logo id (real DS logos from the asset CDN)
const PAY_LOGO = { visa: "visa", mastercard: "master", master: "master", "master card": "master", amex: "amex", "american express": "amex", "apple pay": "apple-pay", applepay: "apple-pay", "google pay": "google-pay", googlepay: "google-pay", tabby: "tabby", tamara: "tamara-logo-en", careem: "careem", "careem pay": "careem" };
const payLogoId = (k) => PAY_LOGO[String(k || "").toLowerCase().trim()];

// Selectable Item — canonical list card (title + 2nd/3rd line + optional tag + radio)
function SelectableItem({ title = "Home — Al Barsha 1", line2 = "Villa 12, Street 4B, Al Barsha 1, Dubai", line3, tag, selected = false, control = "radio" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderRadius: R.lg, border: `${selected ? 1.5 : 0.75}px solid ${selected ? C.brand : C.border}`, background: selected ? C.selected : C.bg }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{title}</div>
        {line2 && <div style={{ fontSize: 11, color: C.text2 }}>{line2}</div>}
        {line3 && <div style={{ fontSize: 9, color: C.text2, letterSpacing: 0.25 }}>{line3}</div>}
        {tag && <div style={{ fontSize: 9, fontWeight: 600, color: C.link, marginTop: 2 }}>{tag}</div>}
      </div>
      <ControlDot type={control} selected={selected} />
    </div>
  );
}

// ——— Selectable Item family (DS 18211-18226): shared state colors ———
const selState = (state) => state === "selected"
  ? { bg: C.selected, border: C.brand, text: C.link, bold: true }
  : state === "disabled"
  ? { bg: C.bg3, border: "transparent", text: C.disabled, bold: false }
  : { bg: C.bg2, border: C.border, text: C.text, bold: false };

// Selectable Item / Date — 55x53 tile (day 9 + date 11 SemiBold), horizontal strip
function DateSelector({ items, active = 1 }) {
  const days = items && items.length ? items : [
    { day: "Wed", date: "10 Feb" }, { day: "Thu", date: "11 Feb" }, { day: "Fri", date: "12 Feb" },
    { day: "Sat", date: "13 Feb" }, { day: "Sun", date: "14 Feb", disabled: true },
  ];
  return (
    <div style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "0 16px" }}>
      {days.map((d, i) => {
        const st = selState(d.disabled ? "disabled" : i === active ? "selected" : "default");
        return (
          <div key={i} style={{ flex: "0 0 55px", width: 55, height: 53, borderRadius: R.md, background: st.bg, border: `1px solid ${st.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <span style={{ fontSize: 9, color: st.text }}>{d.day}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: st.text }}>{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// Selectable Item / Time Slot with Tag — 91x43 card + floating tag (Extra=brand / Off=green)
function TimeSlotPicker({ items, active = 0 }) {
  const slots = items && items.length ? items : [
    { time: "08:00-08:30" }, { time: "08:30-09:00", tag: "5 EXTRA", tagType: "extra" },
    { time: "09:00-09:30", tag: "5 OFF", tagType: "off" }, { time: "09:30-10:00", disabled: true },
  ];
  return (
    <div style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "8px 16px 0" }}>
      {slots.map((s, i) => {
        const st = selState(s.disabled ? "disabled" : i === active ? "selected" : "default");
        const off = s.tagType === "off";
        return (
          <div key={i} style={{ position: "relative", flex: "0 0 auto" }}>
            <div style={{ height: 35, padding: "0 10px", borderRadius: R.md, background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: st.bold ? 600 : 400, color: st.text, whiteSpace: "nowrap" }}>{s.time}</span>
            </div>
            {s.tag && (
              <span style={{ position: "absolute", top: -8, right: -4, display: "inline-flex", alignItems: "center", gap: 2, background: off ? DS.success.chip : C.brand, color: off ? DS.yellow.y800 : "#fff", fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: R.xs, whiteSpace: "nowrap" }}>
                {!off && <Dh size={7} color="#fff" />}{off && <Dh size={7} color={DS.yellow.y800} />}{s.tag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Selectable Item / Number Box — 40x40 count boxes (bedrooms/bathrooms etc.)
function NumberBoxRow({ label, count = 5, active = 0, items }) {
  const nums = items && items.length ? items : Array.from({ length: count }, (_, i) => ({ n: i + 1 }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>}
      <div style={{ display: "flex", gap: S.md, flexWrap: "wrap" }}>
        {nums.map((x, i) => {
          const st = selState(x.disabled ? "disabled" : i === active ? "selected" : "default");
          return (
            <div key={i} style={{ width: 40, height: 40, borderRadius: R.md, background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: st.bold ? 600 : 400, color: st.text }}>{x.n}</div>
          );
        })}
      </div>
    </div>
  );
}

// Disclaimer — tonal callout (success/warning/error/neutral) 9px SemiBold + optional Details link
function Disclaimer({ message = "Enjoy free cancellation up to 6 hours before your booking", type = "success", button, icon = true }) {
  const T = {
    success: { bg: C.successBg, fg: "#2E4400" },
    warning: { bg: "#FFF8EE", fg: DS.yellow.y800 },
    error:   { bg: C.dangerBg, fg: C.danger },
    neutral: { bg: C.bg3, fg: C.text2 },
  }[String(type).toLowerCase()] || { bg: C.successBg, fg: "#2E4400" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: R.md, padding: "10px 12px" }}>
      {icon && <AlertCircle size={14} color={T.fg} style={{ flex: "0 0 14px" }} />}
      <span style={{ flex: 1, fontSize: 9, fontWeight: 600, color: T.fg, lineHeight: 1.4 }}>{message}</span>
      {button && <span style={{ fontSize: 9, fontWeight: 600, color: C.link, whiteSpace: "nowrap" }}>{button}</span>}
    </div>
  );
}

// Booking Status — confirmation/status header card (DS 12644:3058). radius 20, bg secondary.
function BookingStatus({ type = "confirmed", title, message, pro, eta, actions = true }) {
  const t = String(type).toLowerCase();
  const heads = {
    "confirmed": { h: "Booking confirmed!", m: "We'll share professional's details 1 hour prior to your booking." },
    "on-the-way": { h: "On the way!", m: "We'll arrive between 13:00-14:00." },
    "with-professional": { h: "Professional arrived", m: "We'll arrive between 13:00-14:00." },
    "professional assigned": { h: "Professional assigned", m: "We'll arrive between 13:00-14:00." },
    "in-progress": { h: "Service in progress", m: "Your service has started." },
    "completed": { h: "Service completed", m: "Thanks for booking with Justlife!" },
    "cancelled": { h: "Booking cancelled", m: "Your booking has been cancelled." },
  };
  const d = heads[t] || heads["confirmed"];
  const showPro = pro && t !== "confirmed" && t !== "cancelled";
  return (
    <div style={{ background: C.bg2, borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: DS.bg.brandSubtle, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 44px" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={14} color="#fff" />
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{title || d.h}</div>
          <div style={{ fontSize: 11, color: C.text, opacity: .85, lineHeight: 1.4, marginTop: 2 }}>{message || d.m}</div>
        </div>
      </div>
      {showPro && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: R.xs, padding: "3px 8px" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.bg3, flex: "0 0 16px" }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.brand }}>{pro}</span>
          </span>
          {actions && (t.includes("assigned") || t.includes("professional")) && (
            <span style={{ display: "inline-flex", gap: 8 }}>
              {["Chat", "Call"].map(a => (
                <span key={a} style={{ background: "#fff", borderRadius: 200, padding: "6px 14px", fontSize: 11, fontWeight: 600, color: C.success }}>{a}</span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Info Card — tonal tip/callout (Warning/Info/Success/Brand)
function InfoCard({ text = "Tip: our professionals bring their own supplies.", tone = "info", icon = true }) {
  const T = {
    warning: { bg: "#FFF8EE", fg: DS.yellow.y800 },
    info:    { bg: C.brandBg, fg: DS.blue.b900 },
    success: { bg: C.successBg, fg: "#2E4400" },
    brand:   { bg: DS.bg.brandSubtle, fg: DS.blue.b900 },
  }[String(tone).toLowerCase()] || { bg: C.brandBg, fg: DS.blue.b900 };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: T.bg, borderRadius: R.md, padding: "10px 12px" }}>
      {icon && <AlertCircle size={14} color={T.fg} style={{ flex: "0 0 14px", marginTop: 1 }} />}
      <span style={{ fontSize: 11, color: T.fg, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

// Plan Booking Card — booking/subscription summary
function PlanBookingCard({ title = "Cleaning Subscription", status = "Active", rows, pro = "Hussein", proAvatar, rating = "4.7", cta = "View Schedule" }) {
  const r = rows && rows.length ? rows : [
    { label: "Package", value: "1 Month" }, { label: "Schedule", value: "Every Mon & Wed & Fri", brand: true }, { label: "Upcoming Booking", value: "Mon, Nov 24, 09:30" },
  ];
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 2px 5px rgba(0,0,0,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: C.text }}>{title}</div><StatusBadge status={status} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {r.map((x, i) => (
          <div key={i} style={{ display: "flex", fontSize: 11, lineHeight: "14px" }}>
            <span style={{ width: 120, flex: "0 0 120px", color: C.text2 }}>{x.label}</span>
            <span style={{ color: x.brand ? C.link : C.text }}>{x.value}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C.border }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Img id={proAvatar} radius={999} ph={C.bg3} style={{ width: 24, height: 24, flex: "0 0 24px", borderRadius: "50%" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{pro}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: C.yellow, color: C.yellowInk, fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: R.xs }}><Star size={8} color={C.yellowInk} />{rating}</span>
        </div>
        <AddBtn label={cta} />
      </div>
    </div>
  );
}

function CashbackCard({ title = "Referral Cashback", amount = "50", desc = "Invite a friend and earn cashback on their first booking", expiry = "Valid until 30 Jun 2026", cta = "Invite Now" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: C.text }}>{title}</div><Price value={amount} size={11} />
      </div>
      <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.4, margin: "6px 0 10px" }}>{desc}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.danger, fontSize: 11 }}><Clock size={11} color={C.danger} />{expiry}</div>
        <AddBtn label={cta} />
      </div>
    </div>
  );
}

function RatingSummary({ score = "4.8", count = "1,240 reviews" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: S.lg, background: C.bg2, borderRadius: R.lg, padding: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 11, color: C.text }}>{score}</div>
      <div><div style={{ display: "flex", gap: 2 }}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} color="#F5B301" />)}</div>
        <div style={{ fontSize: 11, color: C.text2, marginTop: 3 }}>{count}</div></div>
    </div>
  );
}

function FilterChips({ items, active = 0 }) {
  const chips = items && items.length ? items : ["All", "Hair", "Nails", "Facial", "Waxing"];
  return (
    <div style={{ display: "flex", gap: S.sm, flexWrap: "wrap" }}>
      {chips.map((c, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: "6px 14px", borderRadius: R.pill, border: `1px solid ${i === active ? C.brand : C.border}`, background: i === active ? C.brandBg : C.bg, color: i === active ? C.link : C.text2 }}>{c}</span>
      ))}
    </div>
  );
}

function QuantityStepper({ value = 1 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ background: C.border, borderRadius: R.r6, padding: 5, display: "flex" }}><Minus size={14} color="#fff" /></span>
      <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, fontSize: 11 }}>{value}</span>
      <span style={{ background: C.brand, borderRadius: R.r6, padding: 5, display: "flex" }}><Plus size={14} color="#fff" /></span>
    </div>
  );
}

// Add-ons Card — horizontal scroll of 116px add-on tiles
function AddonTile({ image, name = "Balcony Cleaning", price = "15", oldPrice }) {
  return (
    <div style={{ position: "relative", background: C.bg2, borderRadius: R.lg, width: 116, flex: "0 0 116px", paddingBottom: 8, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
      <Img id={image} radius={R.lg} ph={C.bg3} style={{ width: "100%", height: 100 }} />
      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: "14px" }}>{name}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.link }}>Learn More</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {oldPrice && <span style={{ fontSize: 11, color: C.text2, display: "inline-flex", alignItems: "center" }}><Dh size={9} color={C.text2} />{cleanNum(oldPrice)}</span>}
          <Price value={price} size={11} />
        </div>
      </div>
      <span style={{ position: "absolute", top: 62, right: 8, background: C.brand, borderRadius: R.md, padding: 8, display: "flex" }}><Plus size={16} color="#fff" /></span>
    </div>
  );
}
function AddonsCard({ title = "Add-ons", items }) {
  const its = items && items.length ? items : [{ name: "Balcony Cleaning", price: "15", oldPrice: "10" }, { name: "Fridge Cleaning", price: "30" }, { name: "Oven Cleaning", price: "25" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
      <div style={{ fontWeight: 600, fontSize: 11 }}>{title}</div>
      <div style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "0 16px" }}>
        {its.map((a, i) => <AddonTile key={i} {...a} />)}
      </div>
    </div>
  );
}

function FrequencyOptions({ title = "How often?", options, active = 0 }) {
  const opts = options && options.length ? options : [{ label: "One time" }, { label: "Weekly", note: "Save 10%" }, { label: "Bi-weekly", note: "Save 5%" }];
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 11, marginBottom: S.md }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
        {opts.map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: S.md, borderRadius: R.md, border: `1.5px solid ${i === active ? C.brand : C.border}`, background: i === active ? C.selected : C.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: S.md }}><ControlDot type="radio" selected={i === active} /><span style={{ fontSize: 11, fontWeight: 500, color: C.text }}>{o.label}</span></div>
            {o.note && <span style={{ fontSize: 11, fontWeight: 600, color: C.success }}>{o.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
function SubscriptionSchedule(p) { return <FrequencyOptions title="Subscription schedule" {...p} />; }

function SpecialInstructions({ label = "Any specific instructions?", action = "Add" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: S.md, color: C.text2 }}><AlertCircle size={16} color={C.text3} /><span style={{ fontSize: 11 }}>{label}</span></div>
      <span style={{ color: C.link, fontWeight: 600, fontSize: 11 }}>{action}</span>
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: C.text2 }}>{label}</span><span style={{ color: valueColor || C.text, fontWeight: 500 }}>{value}</span></div>;
}
function BookingDetails({ title = "Booking Details", status = "Confirmed", reference = "043DD43", service = "Mani-Pedi Combo package", datetime = "7 Jul 2026, 09:00-09:30" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 11, marginBottom: S.md }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <InfoRow label="Status" value={status} valueColor={C.success} />
        <InfoRow label="Reference code" value={reference} /><InfoRow label="Service" value={service} /><InfoRow label="Date & Time" value={datetime} />
      </div>
    </div>
  );
}

function PriceDetails({ title = "Price Breakdown", rows, total = "367.13", totalLabel = "Total (inc. VAT)", payment, footer }) {
  const r = rows && rows.length ? rows : [
    { label: "Deep Cleaning (3BR)", value: "349" },
    { label: "Add-on: Inside Fridge", value: "49" },
    { label: "Promo Code (CLEAN20)", value: "87.40", discount: true },
    { label: "VAT (5%)", value: "17.53" },
  ];
  const payLogo = payment && (payment.logo || payLogoId(payment.method || payment.brand));
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12 }}>
      {title && <div style={{ fontWeight: 600, fontSize: 11, marginBottom: S.md }}>{title}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {r.map((x, i) => {
          const val = cleanNum(String(x.value)).replace(/^-/, "");
          const disc = x.discount || x.tone === "discount";
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: C.text2 }}>{x.label}</span>
              {disc
                ? <span style={{ display: "inline-flex", alignItems: "center", color: C.success, fontWeight: 600 }}>−<Dh size={9} color={C.success} />{val}</span>
                : <Price value={val} size={11} />}
            </div>
          );
        })}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 11 }}>{totalLabel}</span><span style={{ fontWeight: 600 }}><Price value={total} size={11} /></span>
        </div>
        {payment && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, paddingTop: 2 }}>
            <span style={{ color: C.text2 }}>Payment</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {payLogo && <Img id={payLogo} style={{ width: 30, height: 18, objectFit: "contain" }} />}
              {payment.last4 && <span style={{ color: C.text }}>**** {payment.last4}</span>}
            </span>
          </div>
        )}
        {footer && <div style={{ fontSize: 9, color: C.text2, marginTop: 2, lineHeight: 1.4 }}>{footer}</div>}
      </div>
    </div>
  );
}

function PaymentMethod({ brand = "Visa", method, last4 = "4782", selected = true, subtitle, logo }) {
  const logoId = logo || payLogoId(method || brand);
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${selected ? C.brand : "transparent"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: S.md, minWidth: 0 }}>
        {logoId
          ? <Img id={logoId} style={{ width: 38, height: 24, objectFit: "contain", flex: "0 0 38px" }} />
          : <span style={{ fontWeight: 600, fontStyle: "italic", color: "#1A1F71", fontSize: 11, letterSpacing: 0.5 }}>{brand}</span>}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          {last4 && <span style={{ fontSize: 11, color: C.text, letterSpacing: 1 }}>**** **** **** {last4}</span>}
          {subtitle && <span style={{ fontSize: 9, color: C.text2 }}>{subtitle}</span>}
        </div>
      </div>
      <ControlDot type="radio" selected={selected} />
    </div>
  );
}

function PrimaryButton({ label = "Continue", price, variant = "primary", size = "large", outline = false, icon }) {
  // DS Button: 5 variants × sizes × states (incl. new Outline). Outline = transparent bg + colored border + colored text.
  const V = {
    primary:   { bg: C.brand,   fg: "#fff" },
    secondary: { bg: C.yellow,  fg: DS.yellow.y800 },
    tertiary:  { bg: DS.btn.tertiaryBg, fg: DS.btn.tertiaryText },
    danger:    { bg: C.danger,  fg: "#fff" },
    pill:      { bg: C.brand,   fg: "#fff" },
  }[String(variant).toLowerCase()] || { bg: C.brand, fg: "#fff" };
  const sz = {
    xs:     { p: "4px 8px",   r: R.r6, f: 9 },
    small:  { p: "6px 12px",  r: R.md, f: 9 },
    medium: { p: "8px 16px",  r: R.md, f: 11 },
    large:  { p: "14px 18px", r: R.lg, f: 11 },
  }[String(size).toLowerCase()] || { p: "14px 18px", r: R.lg, f: 11 };
  const radius = String(variant).toLowerCase() === "pill" ? 1000 : sz.r;
  const bg = outline ? "transparent" : V.bg;
  const fg = outline ? V.bg : V.fg;
  const border = outline ? `1px solid ${V.bg}` : "1px solid transparent";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: S.md, background: bg, color: fg, border, borderRadius: radius, padding: sz.p, fontWeight: 600, fontSize: sz.f, whiteSpace: "nowrap" }}>
      {price && <span style={{ fontWeight: 600 }}><Price value={price} color={fg} size={sz.f} /></span>}<span>{label}</span>
    </div>
  );
}

function hIcon(name, color = "#1a1a1a", size = 20) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "search") return <svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>;
  if (name === "heart") return <svg {...c}><path d="M12 20.3l-1.1-1C6.1 15 3 12.2 3 8.8 3 6.1 5.1 4 7.7 4c1.5 0 2.9.7 3.8 1.8C12.4 4.7 13.8 4 15.3 4 17.9 4 20 6.1 20 8.8c0 3.4-3.1 6.2-7.9 10.5z" /></svg>;
  const d = { back: "M15 18l-6-6 6-6", up: "M6 15l6-6 6 6" }[name];
  return <svg {...c}><path d={d} /></svg>;
}

// App Header — DS mobile screen header (back · title · search/heart · progress)
function AppHeader({ title = "Women's Salon", step, nextStep, back = true, search = true, heart = true, progress }) {
  const pct = typeof progress === "number" ? Math.max(0, Math.min(1, progress)) : null;
  // DS App Header: white surface (background/primary), elevation-xs, curved bottom edge
  return (
    <div style={{ flex: "0 0 auto", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.06))" }}>
      <div style={{ background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 12px 12px", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
            {back && <span style={{ flex: "0 0 24px", display: "flex" }}>{hIcon("back", "#1a1a1a", 24)}</span>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>{title}</div>
              {step && <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{step}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {search && hIcon("search", "#1a1a1a", 20)}
            {heart && hIcon("heart", "#1a1a1a", 20)}
          </div>
        </div>
        {pct != null && (
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "0 16px 12px" }}>
            <div style={{ height: 4, width: 149, background: DS.bg.tertiary, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: 4, width: 149 * pct, background: C.brand, borderRadius: 100 }} />
            </div>
            {nextStep && <span style={{ fontSize: 9, color: "#666" }}>{nextStep}</span>}
          </div>
        )}
      </div>
      {/* Bottom Curve — DS curved bottom edge */}
      <svg width="100%" height="14" viewBox="0 0 375 14" preserveAspectRatio="none" style={{ display: "block", marginTop: -1 }}>
        <path d="M0,0 L375,0 L375,5 Q187.5,16 0,5 Z" fill="#fff" />
      </svg>
    </div>
  );
}

// Navbar / App — DS bottom checkout & CTA bar (total · price · Next button · plus banner)
function NavbarApp({ price = "62.10", oldPrice, discount, subtitle, button = "Next", plusBanner, total = true, homeIndicator = true }) {
  // DS Navbar/App (app/Default): floating white card (radius 16, elevation-xs) on secondary backdrop; elevation-navbar on the bar
  return (
    <div style={{ background: C.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, flex: "0 0 auto", filter: "drop-shadow(0 -8px 20px rgba(0,0,0,.10))" }}>
      {plusBanner && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: DS.bg.tertiaryAction, padding: "10px 16px" }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "#ffffff33", flex: "0 0 18px" }} />
          <span style={{ fontSize: 11, color: "#fff" }}>{plusBanner}</span>
        </div>
      )}
      <div style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            {total && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: "#666" }}>Total</span>
                {oldPrice && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "#666", textDecoration: "line-through" }}><Dh size={9} color="#666" />{cleanNum(oldPrice)}</span>}
                {discount && <span style={{ display: "inline-flex", alignItems: "center", background: DS.success.chip, color: DS.success.text, fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4 }}>{String(discount).replace(/%/g, "")}%</span>}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dh size={14} color="#1a1a1a" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{cleanNum(price)}</span>
              <span style={{ display: "flex" }}>{hIcon("up", "#1a1a1a", 16)}</span>
            </div>
            {subtitle && <div style={{ fontSize: 9, color: "#666" }}>{subtitle}</div>}
          </div>
          <div style={{ background: DS.yellow.y500, color: DS.yellow.y800, fontWeight: 500, fontSize: 11, padding: "12px 20px", borderRadius: 8, whiteSpace: "nowrap" }}>{button}</div>
        </div>
      </div>
      {homeIndicator && (
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
          <div style={{ width: 134, height: 5, background: "#1a1a1a", borderRadius: 100 }} />
        </div>
      )}
    </div>
  );
}

function BottomNav({ active = 0 }) {
  const tabs = ["Home", "Bookings", "Wallet", "Profile"];
  const paths = [
    "M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.66-.66V19.5a1.5 1.5 0 01-1.5 1.5H14.5v-5.25h-3V21H6a1.5 1.5 0 01-1.5-1.5v-6.57l-.66.66a.75.75 0 11-1.06-1.06z",
    "M8 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1.5A2.5 2.5 0 0121 6.5V8H3V6.5A2.5 2.5 0 015.5 4H7V3a1 1 0 011-1zM3 10h18v8.5A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5z",
    "M4 5h13.5A2.5 2.5 0 0120 7.5V8h-4.5a3 3 0 100 6H20v.5a2.5 2.5 0 01-2.5 2.5H4a2 2 0 01-2-2V7a2 2 0 012-2zm12 5a1.5 1.5 0 000 3H21a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5z",
    "M12 12.5a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5zM4 19.6C4 16.3 7.6 14.5 12 14.5s8 1.8 8 5.1V20a1 1 0 01-1 1H5a1 1 0 01-1-1z",
  ];
  const ic = (i, on) => <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? DS.blue.b900 : "#8A9098"}><path d={paths[i]} /></svg>;
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "15px 16px 23px", background: C.bg }}>
      <div style={{ display: "flex", flex: 1, height: 60, background: "#fff", borderRadius: 12, padding: "2px 3px", alignItems: "center", boxShadow: "0 6px 22px rgba(19,68,83,.13)", border: `1px solid ${C.border}` }}>
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, height: 46, borderRadius: 12, background: on ? DS.blue.b50 : "transparent" }}>
              <span style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{ic(i, on)}</span>
              <span style={{ fontSize: 9, lineHeight: "13px", letterSpacing: 0.25, textAlign: "center", color: on ? DS.blue.b900 : C.text2, fontWeight: on ? 600 : 400 }}>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Generic DS fallback — renders any DS component (not yet hand-built) as a labeled DS-styled card
function GenericDSCard({ __name = "Component", ...props }) {
  const title = props.Title || props.title || props.headerText || __name;
  const rows = Object.entries(props).filter(([k, v]) => v != null && typeof v !== "object" && k !== "Title" && k !== "title").slice(0, 5);
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12, border: `1px dashed ${C.borderStrong}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: rows.length ? 8 : 0 }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: C.text }}>{title}</div>
        <span style={{ fontSize: 9, fontWeight: 600, color: C.link, background: C.brandBg, padding: "2px 6px", borderRadius: R.xs, whiteSpace: "nowrap" }}>{__name}</span>
      </div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, padding: "2px 0" }}>
          <span style={{ color: C.text2 }}>{k}</span><span style={{ color: C.text, textAlign: "right" }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ---- registry ----
const LIVE = {
  "Input/SearchMobile": { c: SearchBar }, "Input/Search": { c: SearchBar }, "SearchBar": { c: SearchBar },
  "Hero Banner": { c: HeroBanner }, "Homepage Section": { c: ServiceGrid }, "Section Header": { c: SectionHeader },
  "Service Card": { c: ServiceCard }, "Product Card": { c: ProductCard }, "Cashback Card": { c: CashbackCard },
  "Combo Selection": { c: ComboSelection }, "Selectable Item": { c: SelectableItem }, "Plan Booking Card": { c: PlanBookingCard },
  "Rating Summary": { c: RatingSummary }, "Tag": { c: FilterChips }, "Category Card": { c: FilterChips }, "Filters": { c: FilterChips },
  "Quantity Stepper": { c: QuantityStepper }, "Add-ons Card": { c: AddonsCard },
  "Frequency Option": { c: FrequencyOptions }, "Subscription Schedule": { c: SubscriptionSchedule },
  "Special Instructions": { c: SpecialInstructions },
  "Selectable Item / Date": { c: DateSelector }, "Date Selector": { c: DateSelector },
  "Selectable Item / Time Slot with Tag": { c: TimeSlotPicker }, "Time Slot": { c: TimeSlotPicker }, "Selectable Item / Time Slot": { c: TimeSlotPicker },
  "Selectable Item / Number Box": { c: NumberBoxRow }, "Number Box": { c: NumberBoxRow },
  "Disclaimer": { c: Disclaimer },
  "Booking Status": { c: BookingStatus }, "Thank You Card": { c: BookingStatus },
  "Info Card": { c: InfoCard },
  "Booking Details — Variants": { c: BookingDetails }, "Booking Details": { c: BookingDetails },
  "Price Details — Variants": { c: PriceDetails }, "Price Details": { c: PriceDetails }, "Payment Summary": { c: PriceDetails },
  "Payment Method": { c: PaymentMethod }, "Button": { c: PrimaryButton, sticky: true },
  "Navigation Bar": { c: BottomNav, bleed: true, bottom: true },
  "App Header": { c: AppHeader, top: true }, "Navbar / App": { c: NavbarApp, bottom: true }, "Navbar/App": { c: NavbarApp, bottom: true },
};
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const LIVE_BY_NORM = Object.fromEntries(Object.entries(LIVE).map(([k, v]) => [norm(k), v]));
const resolveLive = (name) => LIVE[name] || LIVE_BY_NORM[norm(name)] || null;

// ============================================================
//  WEB BUILDER — desktop components (DS tokens: colors, Poppins, radius)
// ============================================================
const WF = { h1: 32, h2: 22, h3: 16, body: 14, small: 12, tiny: 11 };

function WebHeader({ brand = "Justlife", links, cta = "Book Now", user }) {
  const L = links && links.length ? links : ["Services", "Pricing", "About", "Contact"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "16px 36px", background: C.bg, borderBottom: `1px solid ${C.border}`, flex: "0 0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <JustlifeMark size={22} /><span style={{ fontWeight: 600, fontSize: WF.h3, color: C.text }}>{brand}</span>
      </div>
      <div style={{ display: "flex", gap: 22, marginLeft: 12 }}>
        {L.map((l, i) => <span key={i} style={{ fontSize: WF.small, color: i === 0 ? C.text : C.text2, fontWeight: i === 0 ? 600 : 400 }}>{l}</span>)}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        {user && <span style={{ fontSize: WF.small, color: C.text2 }}>{user}</span>}
        <span style={{ background: C.brand, color: "#fff", fontWeight: 600, fontSize: WF.small, padding: "9px 20px", borderRadius: R.md }}>{cta}</span>
      </div>
    </div>
  );
}

function WebHero({ title = "Home services, on demand", subtitle = "Book trusted professionals for cleaning, salon and more — in minutes.", cta = "Get Started", cta2, image, stat }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 40, padding: "48px 44px", background: `linear-gradient(120deg, ${C.selected}, ${C.bg})`, borderRadius: R.xl }}>
      <div style={{ flex: "1 1 380px", minWidth: 0 }}>
        <div style={{ fontSize: WF.h1, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: C.text }}>{title}</div>
        <div style={{ fontSize: WF.body, color: C.text2, marginTop: 14, maxWidth: 460, lineHeight: 1.55 }}>{subtitle}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
          <span style={{ background: C.brand, color: "#fff", fontWeight: 600, fontSize: WF.small, padding: "12px 26px", borderRadius: R.md }}>{cta}</span>
          {cta2 && <span style={{ border: `1px solid ${C.border}`, color: C.text, fontWeight: 600, fontSize: WF.small, padding: "12px 26px", borderRadius: R.md, background: C.bg }}>{cta2}</span>}
        </div>
        {stat && <div style={{ fontSize: WF.tiny, color: C.text2, marginTop: 20 }}>{stat}</div>}
      </div>
      <Img id={image} radius={R.lg} ph={C.bg3} style={{ flex: "0 0 280px", width: 280, height: 195 }} />
    </div>
  );
}

function StatCards({ items }) {
  const its = items && items.length ? items : [
    { label: "Total Bookings", value: "12,480", delta: "+12%" }, { label: "Revenue", value: "418,200", delta: "+8%", currency: true },
    { label: "Active Pros", value: "324", delta: "+4%" }, { label: "Avg. Rating", value: "4.8", delta: "+0.1" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(its.length, 4)}, 1fr)`, gap: 16 }}>
      {its.map((s, i) => (
        <div key={i} style={{ background: C.bg2, borderRadius: R.lg, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: WF.tiny, color: C.text2 }}>{s.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: WF.h2, fontWeight: 600, color: C.text }}>
              {s.currency && <Dh size={15} color={C.text} />}{s.value}
            </span>
            {s.delta && <span style={{ fontSize: WF.tiny, fontWeight: 600, color: String(s.delta).startsWith("-") ? C.danger : C.success, background: String(s.delta).startsWith("-") ? C.dangerBg : C.successBg, padding: "1px 7px", borderRadius: R.xs }}>{s.delta}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title = "Bookings over time", bars, labels }) {
  const B = bars && bars.length ? bars : [42, 58, 50, 74, 66, 88, 96, 80, 104, 92, 118, 126];
  const L = labels && labels.length ? labels : ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const max = Math.max(...B);
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 20, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: WF.small, fontWeight: 600, color: C.text, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
        {B.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", height: `${Math.max(4, (v / max) * 118)}px`, background: i === B.length - 1 ? C.brand : DS.bg.brandSubtle, borderRadius: "6px 6px 2px 2px" }} />
            <span style={{ fontSize: 9, color: C.text3 }}>{L[i] || ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ title = "Recent bookings", columns, rows }) {
  const cols = columns && columns.length === 5 ? columns : ["Customer", "Service", "Date", "Amount", "Status"];
  const rws = rows && rows.length ? rows : [
    ["Sara M.", "Deep Cleaning", "23 Jun", "349", "Confirmed"],
    ["Ahmed K.", "AC Cleaning", "23 Jun", "199", "In progress"],
    ["Lina H.", "Salon at Home", "22 Jun", "260", "Completed"],
    ["Omar T.", "Mani-Pedi", "22 Jun", "120", "Cancelled"],
  ];
  const stColor = (s) => /confirm|complete/i.test(s) ? C.success : /cancel/i.test(s) ? C.danger : C.link;
  const stBg = (s) => /confirm|complete/i.test(s) ? C.successBg : /cancel/i.test(s) ? C.dangerBg : C.brandBg;
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ fontSize: WF.small, fontWeight: 600, color: C.text, padding: "16px 20px 10px" }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `1.2fr 1.4fr .8fr .8fr 1fr`, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
        {cols.map((c, i) => <span key={i} style={{ fontSize: WF.tiny, fontWeight: 600, color: C.text2 }}>{c}</span>)}
      </div>
      {rws.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `1.2fr 1.4fr .8fr .8fr 1fr`, padding: "11px 20px", borderBottom: i < rws.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
          {(Array.isArray(r) ? r : []).slice(0, 5).map((cell, j) => {
            if (j === 3) return <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: WF.tiny, color: C.text }}><Dh size={9} color={C.text} />{cleanNum(String(cell))}</span>;
            if (j === 4) return <span key={j}><span style={{ fontSize: 10, fontWeight: 600, color: stColor(String(cell)), background: stBg(String(cell)), padding: "3px 9px", borderRadius: R.pill }}>{cell}</span></span>;
            return <span key={j} style={{ fontSize: WF.tiny, color: j === 0 ? C.text : C.text2, fontWeight: j === 0 ? 500 : 400 }}>{cell}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

function WebCardGrid({ title = "Our services", items, columns = 3 }) {
  const its = items && items.length ? items : [
    { title: "Home Cleaning", desc: "Trusted hourly cleaning with supplies.", price: "89" },
    { title: "Salon at Home", desc: "Beauty services at your doorstep.", price: "120" },
    { title: "AC Cleaning", desc: "Duct and filter deep cleaning.", price: "199" },
  ];
  return (
    <div>
      {title && <div style={{ fontSize: WF.h2, fontWeight: 600, color: C.text, marginBottom: 18, letterSpacing: "-0.01em" }}>{title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(columns || 3, its.length))}, 1fr)`, gap: 18 }}>
        {its.map((c, i) => (
          <div key={i} style={{ background: C.bg2, borderRadius: R.lg, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Img id={c.image} ph={C.bg3} style={{ width: "100%", height: 125 }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: WF.body, fontWeight: 600, color: C.text }}>{c.title}</div>
              {c.desc && <div style={{ fontSize: WF.tiny, color: C.text2, marginTop: 6, lineHeight: 1.5 }}>{c.desc}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                {c.price ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: WF.body, fontWeight: 600, color: C.text }}><Dh size={12} color={C.text} />{cleanNum(c.price)}</span> : <span />}
                <span style={{ fontSize: WF.tiny, fontWeight: 600, color: C.link }}>Book →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebSidebar({ items, active = 0 }) {
  const its = items && items.length ? items : ["Dashboard", "Bookings", "Professionals", "Customers", "Payments", "Reports", "Settings"];
  return (
    <div style={{ width: 190, flex: "0 0 190px", background: C.bg2, borderRight: `1px solid ${C.border}`, padding: "18px 10px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 16px" }}>
        <JustlifeMark size={20} /><span style={{ fontWeight: 600, fontSize: WF.small, color: C.text }}>Admin</span>
      </div>
      {its.map((l, i) => (
        <div key={i} style={{ fontSize: WF.tiny, fontWeight: i === active ? 600 : 400, color: i === active ? DS.blue.b900 : C.text2, background: i === active ? C.brandBg : "transparent", padding: "9px 12px", borderRadius: R.md }}>{l}</div>
      ))}
    </div>
  );
}

function WebFooter({ brand = "Justlife", columns }) {
  const cols = columns && columns.length ? columns : [
    { title: "Services", links: ["Cleaning", "Salon", "Healthcare"] },
    { title: "Company", links: ["About", "Careers", "Press"] },
    { title: "Support", links: ["Help Center", "Contact", "Terms"] },
  ];
  return (
    <div style={{ background: DS.bg.inverse, color: "#fff", borderRadius: R.xl, padding: "32px 36px", display: "flex", gap: 54, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 600, fontSize: WF.h3 }}>{brand}</span></div>
        <div style={{ fontSize: WF.tiny, color: "#ffffff99", marginTop: 10, maxWidth: 260, lineHeight: 1.6 }}>Everyday services, delivered to your door across the UAE and KSA.</div>
      </div>
      {cols.map((c, i) => (
        <div key={i}>
          <div style={{ fontSize: WF.tiny, fontWeight: 600, marginBottom: 10 }}>{c.title}</div>
          {(c.links || []).map((l, j) => <div key={j} style={{ fontSize: WF.tiny, color: "#ffffff99", marginBottom: 7 }}>{l}</div>)}
        </div>
      ))}
    </div>
  );
}

function WebForm({ title = "Get in touch", fields, cta = "Submit" }) {
  const F = fields && fields.length ? fields : ["Full name", "Email address", "Message"];
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, border: `1px solid ${C.border}`, padding: 24, maxWidth: 480 }}>
      <div style={{ fontSize: WF.h3, fontWeight: 600, color: C.text, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {F.map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: WF.tiny, fontWeight: 500, color: C.text2, marginBottom: 5 }}>{f}</div>
            <div style={{ height: /message|notes|details/i.test(String(f)) ? 74 : 38, background: C.bg, border: `1px solid ${C.border}`, borderRadius: R.md }} />
          </div>
        ))}
        <span style={{ background: C.brand, color: "#fff", fontWeight: 600, fontSize: WF.small, padding: "11px 0", borderRadius: R.md, textAlign: "center", marginTop: 4 }}>{cta}</span>
      </div>
    </div>
  );
}

const WEB_LIVE = {
  "Web Header": { c: WebHeader, top: true }, "Web Hero": { c: WebHero }, "Stat Cards": { c: StatCards },
  "Chart": { c: ChartCard }, "Chart Card": { c: ChartCard }, "Data Table": { c: DataTable }, "Table": { c: DataTable },
  "Card Grid": { c: WebCardGrid }, "Services Grid": { c: WebCardGrid }, "Sidebar": { c: WebSidebar, side: true },
  "Footer": { c: WebFooter }, "Form": { c: WebForm }, "Contact Form": { c: WebForm },
};
const WEB_BY_NORM = Object.fromEntries(Object.entries(WEB_LIVE).map(([k, v]) => [norm(k), v]));
const resolveWeb = (name) => WEB_LIVE[name] || WEB_BY_NORM[norm(name)] || null;

function BrowserFrame({ children }) {
  return (
    <div style={{ flex: "1 1 640px", minWidth: 340, maxWidth: 1000, background: "#0b0b0b", borderRadius: 18, padding: 8, boxShadow: "0 30px 60px rgba(0,0,0,.18)" }}>
      <div style={{ background: C.bg, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 620 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: C.bg2, borderBottom: `1px solid ${C.border}`, flex: "0 0 auto" }}>
          <span style={{ display: "flex", gap: 5 }}>{["#FF5F57", "#FEBC2E", "#28C840"].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</span>
          <span style={{ flex: 1, maxWidth: 340, margin: "0 auto", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 10.5, color: C.text2, textAlign: "center", padding: "4px 12px" }}>justlife.com</span>
          <span style={{ width: 40 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function WebScreen({ spec }) {
  const nodes = (spec && spec.nodes) || [];
  const top = [], side = [], flow = [];
  const seen = new Set();
  for (const n of nodes) {
    if (seen.has(n.component)) continue; seen.add(n.component);
    const r = resolveWeb(n.component);
    if (!r) { flow.push({ n, r: null }); continue; }
    (r.top ? top : r.side ? side : flow).push({ n, r });
  }
  const body = (
    <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      {flow.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: C.text3 }}><ArrowRight size={26} /><div style={{ marginTop: 8, fontSize: 13 }}>Your generated page appears here</div></div>}
      {flow.map(({ n, r }, i) => { const Comp = r ? r.c : GenericDSCard; const ex = r ? {} : { __name: n.component }; return <Comp key={i} {...(n.props || {})} {...ex} />; })}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, fontFamily: FONT }}>
      {top.map(({ n, r }, i) => { const Comp = r.c; return <Comp key={i} {...(n.props || {})} />; })}
      {side.length
        ? <div style={{ display: "flex", flex: 1, minHeight: 0 }}>{side.map(({ n, r }, i) => { const Comp = r.c; return <Comp key={i} {...(n.props || {})} />; })}{body}</div>
        : body}
    </div>
  );
}

const WEB_RULES = `RULES (WEB):
1. Use ONLY these component names: "Web Header" {brand,links:[string],cta,user} · "Sidebar" {items:[string],active} · "Web Hero" {title,subtitle,cta,cta2,image(photo id),stat} · "Stat Cards" {items:[{label,value,delta,currency:bool}]} · "Chart" {title,bars:[12 numbers],labels:[12 short strings]} · "Data Table" {title,columns:[5 strings],rows:[[name,service,date,amount-number,status]]} · "Card Grid" {title,items:[{title,desc,price,image(photo id)}],columns} · "Form" {title,fields:[string],cta} · "Footer" {brand,columns:[{title,links:[string]}]}.
2. Output STRICT JSON ONLY: {"title":string,"platform":"web","nodes":[{"component":<name>,"props":{...}}]}. No markdown.
3. Prices/amounts are NUMBERS ONLY (no currency words) — the Dirham symbol renders automatically.
4. MATCH PAGE TYPE:
   - DASHBOARD/ADMIN -> "Sidebar" FIRST, then "Stat Cards", "Chart", "Data Table". NO Web Hero / Web Header / Footer on dashboards.
   - WEBSITE/LANDING -> "Web Header" FIRST, then "Web Hero", "Card Grid", optional "Form", "Footer" LAST. NO Sidebar on websites.
5. Use each component AT MOST once. 3-6 nodes. Rich, realistic Justlife content (real service names, believable numbers). Table status values: Confirmed | In progress | Completed | Cancelled.`;

// ============================================================
function PhoneFrame({ children }) {
  return (
    <div style={{ width: 360, background: "#0b0b0b", borderRadius: 44, padding: 10, boxShadow: "0 30px 60px rgba(0,0,0,.18)", flex: "0 0 auto" }}>
      <div style={{ background: C.bg, borderRadius: 36, height: 720, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 110, height: 5, background: "#00000022", borderRadius: 3, zIndex: 5 }} />
        {children}
      </div>
    </div>
  );
}
function Screen({ spec, go, back, canBack }) {
  const nodes = (spec && spec.nodes) || [];
  const seen = new Set(); const top = [], flow = [], bottom = [];
  for (const n of nodes) {
    if (seen.has(n.component)) continue;
    const r = resolveLive(n.component);
    seen.add(n.component);
    ((r && r.top) ? top : (r && r.bottom) ? bottom : flow).push({ n, r });
  }
  // click behavior: node.link navigates; App Header (top) goes back when possible
  const clickFor = (n, isTop) => {
    if (n.link && go) return () => go(n.link);
    if (isTop && canBack && back) return () => back();
    return null;
  };
  const wrapStyle = (onClick, extra) => onClick ? { cursor: "pointer", ...extra } : extra;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
      {top.map(({ n, r }, i) => { const Comp = r.c; const oc = clickFor(n, true); return <div key={i} onClick={oc} style={wrapStyle(oc)}><Comp {...(n.props || {})} /></div>; })}
      <div style={{ flex: 1, overflowY: "auto", padding: `${S.x2}px ${S.xl}px`, paddingTop: top.length ? 14 : 26, display: "flex", flexDirection: "column", gap: S.lg }}>
        {flow.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: C.text3 }}><ArrowRight size={26} /><div style={{ marginTop: 8, fontSize: 13 }}>Your generated screen appears here</div></div>}
        {flow.map(({ n, r }, i) => { const Comp = r ? r.c : GenericDSCard; const ex = r ? {} : { __name: n.component }; const oc = clickFor(n, false); return <div key={i} onClick={oc} style={wrapStyle(oc, r && r.sticky ? { position: "sticky", bottom: 0 } : undefined)}><Comp {...(n.props || {})} {...ex} /></div>; })}
      </div>
      {bottom.map(({ n, r }, i) => { const Comp = r.c; const oc = clickFor(n, false); return <div key={i} onClick={oc} style={wrapStyle(oc)}><Comp {...(n.props || {})} /></div>; })}
    </div>
  );
}

// ============================================================
//  GENERATOR
// ============================================================
function catalogText(groups, catalog, lite) {
  const lines = [
    'COMPONENTS (use these EXACT names; each renders a real live DS component):',
    '- "Input/SearchMobile" {placeholder}',
    '- "Hero Banner" {title,subtitle,cta,discount,image(photo id)}',
    '- "Homepage Section" {title,action,items:[{label,icon(3D icon id),tag}]}  (services grid of tiles)',
    '- "Service Card" / "Product Card" {title,duration,desc,price,oldPrice,cta(Add|Select),image(photo id)}',
    '- "Combo Selection" {title,price,oldPrice,control(checkbox|radio),selected,image(photo id)}',
    '- "Selectable Item" {title,line2,line3,tag,selected,control(radio|checkbox)}  address/list row; tag e.g. "Default address" (brand)',
    '- "Selectable Item / Date" {items:[{day,date,disabled}],active}  horizontal date strip (booking calendar). Use on Date & Time screens.',
    '- "Selectable Item / Time Slot with Tag" {items:[{time,tag,tagType(extra|off),disabled}],active}  time slots; tag "5 EXTRA" (brand) or "5 OFF" (green). Use after Date.',
    '- "Selectable Item / Number Box" {label,count,active}  numbered boxes (bedrooms/bathrooms/units count)',
    '- "Disclaimer" {message,type(success|warning|error|neutral),button}  tonal callout e.g. free-cancellation note; button e.g. "Details"',
    '- "Booking Status" {type(confirmed|on-the-way|professional assigned|in-progress|completed|cancelled),title,message,pro}  status header card. Use FIRST on confirmation/tracking screens (after App Header).',
    '- "Info Card" {text,tone(info|warning|success|brand)}  inline tip/callout',
    '- "Plan Booking Card" {title,status(Active|Confirmed|Completed|Cancelled),rows:[{label,value,brand}],pro,rating,cta}',
    '- "Cashback Card" {title,amount,desc,expiry,cta}',
    '- "Rating Summary" {score,count}',
    '- "Tag" / "Category Card" {items:[string],active}  (filter chips)',
    '- "Add-ons Card" {title,items:[{name,price,oldPrice,image(photo id)}]}  (horizontal add-on tiles)',
    '- "Frequency Option" / "Subscription Schedule" {title,options:[{label,note}],active}',
    '- "Quantity Stepper" {value}',
    '- "Special Instructions" {label,action}',
    '- "Booking Details — Variants" {title,status,reference,service,datetime}',
    '- "Price Details — Variants" {title,rows:[{label,value,discount}],total,totalLabel,payment:{method,last4},footer}  discount rows render as −﷼value in green',
    '- "Payment Method" {method(Visa|Mastercard|Amex|Apple Pay|Google Pay|Tabby|Careem),last4,subtitle,selected}  renders the real brand logo',
    '- "Button" {label,price,variant,size,outline}  variant: primary|secondary|tertiary|danger|pill · size: xs|small|medium|large · outline:true = transparent + colored border/text',
    '- "App Header" {title,step,nextStep,back,search,heart,progress(0-1)}  (TOP screen header; non-home screens; always FIRST)',
    '- "Navbar / App" {price,oldPrice,discount,subtitle,button,plusBanner,total}  (BOTTOM checkout/CTA bar with price; use for booking/checkout; always LAST)',
    '- "Navigation Bar" {active}  (BOTTOM tab bar; home screens only; always last)',
  ];
  if (groups) {
    const ph = (groups.photos || []).map(a => a.id);
    const ic3d = (groups.icons3d || []).map(a => a.id);
    if (ph.length) lines.push("", "PHOTO ids (image props on cards/banners/avatars/add-ons): " + ph.slice(0, 60).join(", "));
    if (ic3d.length) lines.push("", "3D SERVICE ICON ids — USE ONE for EVERY Homepage Section item 'icon': " + ic3d.join(", "));
  } else {
    lines.push("", "(No asset library loaded — omit image/icon props; placeholders show.)");
  }
  if (!lite && catalog && catalog.length) {
    const extra = catalog.filter(c => !c.live).map(c => c.name);
    if (extra.length) lines.push("", "OTHER DS COMPONENTS (valid names from the DS — render as labeled placeholder cards; use only when clearly relevant): " + extra.join(", "));
  }
  return lines.join("\n");
}

const SCREEN_RULES = `RULES:
1. Use ONLY component names from the CATALOG, with their listed props. Set rich, realistic props.
2. Output STRICT JSON ONLY: {"title":string,"nodes":[{"component":<name>,"props":{...}}]}. No markdown.
3. Prices are NUMBERS ONLY (e.g. "149" or "149.00") — never include "AED"/"Dh"; the Dirham mark is added automatically.
4. MATCH SCREEN TYPE — include only what fits:
   - Home -> "Input/SearchMobile", "Hero Banner", "Homepage Section", maybe 1 "Service Card", then "Navigation Bar" (last). NO App Header on home.
   - Services list -> "App Header" (first), "Tag" (filters), 2-3 distinct "Service Card"/"Product Card", optional "Rating Summary". No banner/grid/search unless asked.
   - Booking -> "App Header" (first), "Subscription Schedule" or "Frequency Option", "Add-ons Card", "Combo Selection" (1-3), "Special Instructions", end "Navbar / App" (with price). No banner/grid/search.
   - Checkout -> "App Header" (first), "Booking Details — Variants", "Price Details — Variants", "Payment Method", end "Navbar / App" (with price+total+discount). No search/banner.
   - Bookings/subscriptions list -> "App Header", "Plan Booking Card" (1-3, varied status). Address/list -> "Selectable Item".
5. Use each component name AT MOST ONCE (except Plan Booking Card / Service Card where a few distinct ones are fine). 4-8 nodes. "App Header" always FIRST when used; "Navigation Bar"/"Navbar / App" always LAST. Prefer "Navbar / App" (price CTA) over plain "Button" on booking/checkout.
8. HOME vs INNER pages (strict):
   - HOME screen = search bar + Hero Banner + Homepage Section grid + "Navigation Bar" (tab bar) LAST. NEVER put "App Header" or "Navbar / App" on Home — keep it exactly as is.
   - INNER pages (services list, booking, checkout, details, address) = start with "App Header", and on booking/checkout end with "Navbar / App". These two are INNER-PAGE ONLY and must never appear on Home.
6. Prefer the detailed CATALOG components (faithful renderers). OTHER DS COMPONENTS are valid too but render as labeled placeholder cards — use them only when clearly relevant.
7. EVERY "Homepage Section" item 'icon' MUST be a 3D SERVICE ICON id. Card/banner/add-on/avatar images use PHOTO ids. Never use 2D ids for the grid.`;

const FLOW_RULES = `FLOW MODE — output a CLICKABLE MULTI-SCREEN JOURNEY:
1. Output STRICT JSON ONLY: {"title":string,"start":<screen-id>,"screens":[{"id":kebab-case,"title":string,"nodes":[{"component":...,"props":{...},"link":<screen-id optional>}]}]}.
2. 3-5 screens forming ONE user journey, e.g. home -> services -> booking -> checkout -> confirmation. Every screen must be reachable from "start" via links.
3. "link" makes the WHOLE component tappable and navigates to that screen id:
   - "Homepage Section" -> link to the services/list screen
   - "Service Card" / "Product Card" -> link to booking/details screen
   - "Navbar / App" (Continue/Next bar) -> link to the NEXT step (checkout, confirmation)
   - "Payment Method" stays unlinked; the Navbar/App advances.
   - Final confirmation screen: "Booking Status" first (after App Header), optionally a "Button" linking back to home.
4. NEVER put "link" on "App Header" — tapping it automatically goes BACK (built in).
5. Each screen must individually follow ALL the screen-type rules above (home layout, inner-page layout, one component name per screen, prices as numbers).
6. Keep ids short and stable: "home", "services", "booking", "checkout", "confirmation".`;

function Generator({ embedded }) {
  const { groups, catalog } = useAssets();
  const [mode, setMode] = useState("app"); // "app" (mobile 375px) | "web" (desktop)
  const [flowOn, setFlowOn] = useState(true); // clickable multi-screen journey (app mode)
  const [prompt, setPrompt] = useState("");
  const [editText, setEditText] = useState("");
  const [spec, setSpec] = useState(null);
  const [cur, setCur] = useState(null);      // current screen id (flow)
  const [hist, setHist] = useState([]);      // back stack
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState(null);

  const isFlow = spec && Array.isArray(spec.screens);
  const screens = isFlow ? spec.screens : null;
  const curScreen = isFlow ? (screens.find(s => s.id === cur) || screens[0]) : spec;
  const go = (id) => { if (!isFlow) return; if (!screens.some(s => s.id === id)) return; setHist(h => [...h, curScreen.id]); setCur(id); };
  const back = () => setHist(h => { if (!h.length) return h; const p = h[h.length - 1]; setCur(p); return h.slice(0, -1); });
  const jump = (id) => { setCur(id); setHist([]); };
  function adopt(s) {
    if (s && Array.isArray(s.screens) && s.screens.length) { setSpec(s); setCur(s.start && s.screens.some(x => x.id === s.start) ? s.start : s.screens[0].id); setHist([]); }
    else { setSpec(s); setCur(null); setHist([]); }
  }
  const suggestions = mode === "web" ? [
    "An admin dashboard with bookings stats, a revenue chart and recent bookings table",
    "A landing page with hero, services grid and a contact form",
    "An operations dashboard for professionals performance",
    "A services website page with pricing cards and footer",
  ] : [
    "A full home-cleaning booking flow from home to confirmation",
    "A salon journey: services list, booking and checkout",
    "A home screen with a banner, services grid and bottom nav",
    "A checkout summary with booking details, price and payment",
  ];

  async function callAI(system, user, maxTokens) {
    const body = JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens || 2200, system, messages: [{ role: "user", content: user }] });
    if (typeof location !== "undefined" && location.protocol === "file:") throw new Error("FILE");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    let res;
    try { res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal }); }
    catch (e) { throw new Error(e && e.name === "AbortError" ? "TIMEOUT" : "NETWORK"); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
      let msg = "HTTP " + res.status;
      const t = await res.json().catch(() => null);
      if (t && t.error) msg = t.error.message;
      if (res.status === 404) msg = "MISSING_FN";
      throw new Error(msg);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return JSON.parse(raw.replace(/```json/gi, "").replace(/```/g, "").trim());
  }
  function showErr(e) {
    const m = String((e && e.message) || "");
    const map = {
      FILE: "The generator needs the deployed Netlify site (or local server) — it can't run from a double-clicked file.",
      NETWORK: "Couldn't reach /api/generate. You must be on the deployed Netlify site (with Functions), not a static host.",
      MISSING_FN: "The /api/generate function isn't deployed. Deploy from Git so netlify/functions/generate.js ships.",
      TIMEOUT: "That took too long and was stopped. The Netlify function may have timed out — try again, or make the request a bit smaller.",
    };
    setErr(map[m] || ("Failed: " + m));
  }

  function webCatalogText() {
    const lines = ["COMPONENTS are defined in the RULES. Use DS look & feel: Poppins, brand #00C3FF, warm neutrals."];
    if (groups) {
      const ph = (groups.photos || []).map(a => a.id);
      if (ph.length) lines.push("PHOTO ids (for hero/card images): " + ph.slice(0, 40).join(", "));
    }
    return lines.join("\n");
  }

  async function run(text) {
    text = (text || "").trim(); if (!text) return;
    setLoading(true); setErr(null); setSpec(null); setCur(null); setHist([]);
    const web = mode === "web";
    const flow = !web && flowOn;
    const system = web
      ? `You generate Justlife WEB pages (desktop, wide layout) — dashboards and marketing/website pages — using the Justlife design system look (Poppins, brand colors). Fill props with realistic, specific content.\n${WEB_RULES}`
      : `You generate Justlife mobile app ${flow ? "FLOWS (multi-screen clickable journeys)" : "screens"} (375px) by composing live DS components from the CATALOG. Fill props with realistic, specific content — these render live, so detail matters.\n${SCREEN_RULES}${flow ? "\n\n" + FLOW_RULES : ""}`;
    const user = web
      ? `${webCatalogText()}\n\nUSER REQUEST: "${text}"\n\nReturn ONLY the JSON.`
      : `CATALOG:\n${catalogText(groups, catalog)}\n\nUSER REQUEST: "${text}"\n\nReturn ONLY the ${flow ? "flow" : "screen"} JSON.`;
    try { const s = await callAI(system, user, flow ? 6000 : 2200); s.platform = web ? "web" : "app"; adopt(s); } catch (e) { showErr(e); } finally { setLoading(false); }
  }

  async function refine() {
    const instr = editText.trim(); if (!instr || !spec || loading || editing) return;
    setEditing(true); setErr(null);
    const web = (spec && spec.platform === "web") || mode === "web";
    const fl = !web && isFlow;
    const rules = web ? WEB_RULES : (SCREEN_RULES + (fl ? "\n\n" + FLOW_RULES : ""));
    const shape = web ? '{"title","platform":"web","nodes":[{component,props}]}' : fl ? '{"title","start","screens":[{id,title,nodes:[{component,props,link}]}]}' : '{"title","nodes":[{component,props}]}';
    const system = `You EDIT an existing Justlife ${web ? "web page" : fl ? "multi-screen flow" : "screen"}. Apply ONLY the requested change to the given JSON and return the FULL updated JSON in the same shape ${shape}. Keep all other ${fl ? "screens, " : ""}nodes and props unchanged. Same component/prop/price/link rules apply.${fl ? ` The user is currently viewing screen "${curScreen && curScreen.id}" — changes without an explicit screen mention apply to that screen.` : ""}\n${rules}`;
    const user = `${web ? webCatalogText() : "CATALOG:\n" + catalogText(groups, catalog, true)}\n\nCURRENT JSON:\n${JSON.stringify(spec)}\n\nCHANGE REQUESTED: "${instr}"\n\nReturn ONLY the full updated JSON.`;
    try {
      const keep = cur;
      const s = await callAI(system, user, fl ? 6000 : 2200); s.platform = web ? "web" : "app";
      if (fl && s.screens && keep && s.screens.some(x => x.id === keep)) { setSpec(s); setCur(keep); } else adopt(s);
      setEditText("");
    } catch (e) { showErr(e); } finally { setEditing(false); }
  }

  return (
    <div style={{ display: "flex", gap: 44, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 420px", minWidth: 320 }}>
        {!embedded && <>
          <span className="s-eyebrow">AI Screen Builder</span>
          <h2 className="s-display" style={{ fontSize: 34, fontWeight: 600, margin: "12px 0 0", letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--s-ink)" }}>Describe a screen.<br />Watch it build itself.</h2>
          <p style={{ color: "var(--s-muted)", fontSize: 15, marginTop: 16, maxWidth: 520 }}>Built from <b style={{ color: "var(--s-ink)" }}>live</b> Justlife DS components with real content — and your uploaded photos and icons.</p>
        </>}
        <div style={{ display: "flex", gap: 8, marginTop: embedded ? 0 : 20, marginBottom: 10 }}>
          {[{ k: "app", l: "📱 App Screen" }, { k: "web", l: "🖥️ Web / Dashboard" }].map(m => (
            <button key={m.k} className={mode === m.k ? "s-btn-dark" : "s-btn-ghost"} onClick={() => { setMode(m.k); setSpec(null); setErr(null); setCur(null); setHist([]); }}
              style={{ fontSize: 12.5, padding: "8px 16px" }}>{m.l}</button>
          ))}
          {mode === "app" && (
            <button className={flowOn ? "s-btn-dark" : "s-btn-ghost"} onClick={() => setFlowOn(f => !f)} title="Generate a clickable multi-screen journey"
              style={{ fontSize: 12.5, padding: "8px 16px", marginLeft: "auto" }}>🔗 Flow {flowOn ? "ON" : "OFF"}</button>
          )}
        </div>
        <textarea className="s-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "web" ? "e.g. An admin dashboard with bookings stats, revenue chart and a recent bookings table" : "e.g. A checkout summary with booking details, price breakdown and payment method"}
          style={{ width: "100%", minHeight: 100, padding: 14, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
          {suggestions.map((s, i) => <button key={i} className="s-chip" onClick={() => { setPrompt(s); run(s); }}>{s}</button>)}
        </div>
        <button className="s-btn-primary" onClick={() => run(prompt)} disabled={loading || editing}>
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}{loading ? "Working…" : "Generate"}
        </button>

        {spec && (
          <div className="s-card" style={{ marginTop: 18, padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--s-ink)", marginBottom: 10 }}>✎ Edit this design <span style={{ fontWeight: 400, color: "var(--s-faint)" }}>— tweak it instead of starting over</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="s-input" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") refine(); }}
                placeholder="e.g. change the banner title to 'Eid Offers', add a service card"
                style={{ flex: "1 1 240px", padding: "10px 13px", fontSize: 13 }} />
              <button className="s-btn-ghost" onClick={refine} disabled={loading || editing} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{editing ? <Loader2 size={14} className="spin" /> : null}{editing ? "Applying…" : "Apply edit"}</button>
            </div>
            <button className="s-btn-dark" onClick={() => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(spec, null, 2))} style={{ marginTop: 12 }}><Copy size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Export spec (JSON)</button>
          </div>
        )}
        {err && <div style={{ marginTop: 14, color: C.danger, fontSize: 13, maxWidth: 560 }}>{err}</div>}
      </div>
      {(mode === "web" || (spec && spec.platform === "web"))
        ? <BrowserFrame><WebScreen spec={spec && spec.platform === "web" ? spec : null} /></BrowserFrame>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", flex: "0 0 auto" }}>
            {isFlow && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 380 }}>
                {screens.map(sc => (
                  <button key={sc.id} className={curScreen && curScreen.id === sc.id ? "s-btn-dark" : "s-chip"} onClick={() => jump(sc.id)} style={{ fontSize: 11, padding: "5px 12px" }}>{sc.title || sc.id}</button>
                ))}
              </div>
            )}
            <PhoneFrame><Screen spec={spec && spec.platform !== "web" ? curScreen : null} go={go} back={back} canBack={hist.length > 0} /></PhoneFrame>
            {isFlow && <div style={{ fontSize: 11.5, color: "var(--s-faint)" }}>▶ Tap linked cards to navigate · tap the header to go back</div>}
          </div>}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("jl-theme") || document.documentElement.dataset.theme || "light"; } catch (e) { return "light"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("jl-theme", theme); } catch (e) {}
  }, [theme]);
  const dark = theme === "dark";
  return (
    <button className="s-icon-btn" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>}
    </button>
  );
}

export default function App() {
  const [assets, setAssets] = useState({ map: null, groups: null, catalog: null });
  useEffect(() => {
    fetch(ASSET_BASE + "manifest.json").then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.groups) return;
      const map = {};
      for (const g of Object.values(j.groups)) for (const a of g) map[a.id] = ASSET_BASE + a.path;
      setAssets(a => ({ ...a, map, groups: j.groups }));
    }).catch(() => {});
    fetch(ASSET_BASE + "ds-components.json").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.components) setAssets(a => ({ ...a, catalog: j.components }));
    }).catch(() => {});
  }, []);
  const total = assets.groups ? Object.values(assets.groups).reduce((n, g) => n + g.length, 0) : 0;
  const dsCount = assets.catalog ? assets.catalog.length : 0;
  return (
    <AssetCtx.Provider value={assets}>
      <div style={{ minHeight: "100vh", color: "var(--s-ink)" }}>
        <header className="s-header">
          <div className="s-header-in">
            <JustlifeLogo />
            <div style={{ width: 1, height: 22, background: "var(--s-line2)", margin: "0 2px" }} />
            <div className="s-display" style={{ fontWeight: 600, fontSize: 15 }}>DS Builder <span style={{ fontWeight: 400, color: "var(--s-faint)", fontSize: 12 }}>· live components</span></div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 12, color: total ? "var(--s-brand-deep)" : "var(--s-faint)", textAlign: "right", lineHeight: 1.5 }}>
                {total ? `${total} assets` : "no assets yet"}
                {dsCount ? <div style={{ color: "var(--s-faint)" }}>{dsCount} components</div> : null}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="s-main"><Generator /></main>
      </div>
    </AssetCtx.Provider>
  );
}

// Mountable builder for embedding inside the landing page (no app shell/header)
export function EmbeddedBuilder() {
  const [assets, setAssets] = useState({ map: null, groups: null, catalog: null });
  useEffect(() => {
    fetch(ASSET_BASE + "manifest.json").then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.groups) return;
      const map = {};
      for (const g of Object.values(j.groups)) for (const a of g) map[a.id] = ASSET_BASE + a.path;
      setAssets(a => ({ ...a, map, groups: j.groups }));
    }).catch(() => {});
    fetch(ASSET_BASE + "ds-components.json").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.components) setAssets(a => ({ ...a, catalog: j.components }));
    }).catch(() => {});
  }, []);
  return (
    <AssetCtx.Provider value={assets}>
      <Generator embedded />
    </AssetCtx.Provider>
  );
}
