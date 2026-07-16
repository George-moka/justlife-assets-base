import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { Search, Star, Plus, Minus, ChevronRight, Check, Clock, ArrowRight, Sparkles, Copy, Loader2, AlertCircle, Wallet, Trash2, RefreshCw, Image, X } from "lucide-react";

// Global animation CSS — injected by the bundle so spinners/skeletons work on ANY host page
if (typeof document !== "undefined" && !document.getElementById("jl-anim")) {
  const st = document.createElement("style");
  st.id = "jl-anim";
  st.textContent = "@keyframes jlspin{to{transform:rotate(360deg)}}.spin{animation:jlspin .9s linear infinite;display:inline-block;transform-origin:center}@keyframes jlpulse{0%,100%{opacity:.4}50%{opacity:.9}}.jl-skel{animation:jlpulse 1.3s ease-in-out infinite}@keyframes jlF{from{opacity:.3;transform:translateX(18px)}to{opacity:1;transform:none}}@keyframes jlB{from{opacity:.3;transform:translateX(-18px)}to{opacity:1;transform:none}}@keyframes jlA{from{opacity:.35}to{opacity:1}}.jl-in-fwd{animation:jlF .22s ease-out}.jl-in-back{animation:jlB .22s ease-out}.jl-in-fade{animation:jlA .2s ease-out}.jl-noscroll{scrollbar-width:none;-ms-overflow-style:none}.jl-noscroll::-webkit-scrollbar{display:none}.jl-noscroll *{scrollbar-width:none;-ms-overflow-style:none}.jl-noscroll *::-webkit-scrollbar{display:none}";
  document.head.appendChild(st);
}

/* Justlife DS — Live Screen Builder (components matched to Figma DS) */

let ADDON_IDS = ["addon-balcony", "addon-cupboard", "addon-fridge", "addon-ironing", "addon-party", "addon-wardrobe"];
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
function JustlifeMark({ size = 26, light = false }) {
  const col = light ? "#FFFFFF" : C.brand;
  return (
    <svg width={size * 0.82} height={size} viewBox="0 0 26 30" fill="none" style={{ display: "block" }}>
      <path d="M17 4 L17 17.5 A8 8 0 1 1 9 9.5" fill="none" stroke={col} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3 l5.4 3.3 -5.4 3.3 z" fill={col} />
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
function DateSelector({ items, active = 1, label }) {
  const days = items && items.length ? items : [
    { day: "Wed", date: "10 Feb" }, { day: "Thu", date: "11 Feb" }, { day: "Fri", date: "12 Feb" },
    { day: "Sat", date: "13 Feb" }, { day: "Sun", date: "14 Feb", disabled: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>}
      <div className="jl-noscroll" style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "0 16px" }}>
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
    </div>
  );
}

// Selectable Item / Time Slot with Tag — 91x43 card + floating tag (Extra=brand / Off=green)
function TimeSlotPicker({ items, active = 0, label }) {
  const slots = items && items.length ? items : [
    { time: "08:00-08:30" }, { time: "08:30-09:00", tag: "5 EXTRA", tagType: "extra" },
    { time: "09:00-09:30", tag: "5 OFF", tagType: "off" }, { time: "09:30-10:00", disabled: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>}
      <div className="jl-noscroll" style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "14px 16px 2px" }}>
      {slots.map((s, i) => {
        const st = selState(s.disabled ? "disabled" : i === active ? "selected" : "default");
        const off = s.tagType === "off";
        return (
          <div key={i} style={{ position: "relative", flex: "0 0 auto" }}>
            <div style={{ height: 35, padding: "0 10px", borderRadius: R.md, background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: st.bold ? 600 : 400, color: st.text, whiteSpace: "nowrap" }}>{s.time}</span>
            </div>
            {s.tag && (() => {
              const money = /^\d/.test(String(s.tag).trim());
              return (
                <span style={{ position: "absolute", top: -9, right: -4, display: "inline-flex", alignItems: "center", gap: 2, background: off ? DS.success.chip : C.brand, color: off ? DS.yellow.y800 : "#fff", fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: R.xs, whiteSpace: "nowrap" }}>
                  {money && <Dh size={7} color={off ? DS.yellow.y800 : "#fff"} />}{s.tag}
                </span>
              );
            })()}
          </div>
        );
      })}
      </div>
    </div>
  );
}

// Selectable Item / Number Box — 40x40 count boxes (bedrooms/bathrooms etc.)
function NumberBoxRow({ label, count = 5, active = 0, items }) {
  const nums = items && items.length ? items : Array.from({ length: count }, (_, i) => ({ n: i + 1 }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.35 }}>{label}</div>}
      <div className="jl-noscroll" style={{ display: "flex", gap: 10, overflowX: "auto", flexWrap: nums.length > 7 ? "nowrap" : "wrap" }}>
        {nums.map((x, i) => {
          const st = selState(x.disabled ? "disabled" : i === active ? "selected" : "default");
          return (
            <div key={i} style={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: R.md, background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: st.bold ? 600 : 400, color: st.text }}>{x.n}</div>
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

// BNPL banner (Tabby / Tamara) — "Pay in 4 interest-free payments" (QA: Checkout top)
function BnplCard({ provider = "Tabby", subtitle = "Pay in 4 interest-free payments" }) {
  const isTamara = /tamara/i.test(provider);
  const logoBg = isTamara ? "#FF6699" : "#3EE5AC";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: R.lg, border: `1px solid ${C.border}`, background: C.bg2 }}>
      <span style={{ background: logoBg, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#000", fontStyle: "italic" }}>{provider.toLowerCase()}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: C.text }}>{provider} <AlertCircle size={11} color={C.text3} /></span>
        <span style={{ fontSize: 9, color: C.text2 }}>{subtitle}</span>
      </div>
    </div>
  );
}

// Confirmation Hero — promo image banner (QA: Thank You top)
function ConfirmationHero({ image, badge = "30% off up to ﷼100", title = "Solo or duo Massages & facials right at home.", cta = "Book Now", cta2 = "Save for Later" }) {
  return (
    <div style={{ position: "relative", borderRadius: R.lg, overflow: "hidden", minHeight: 200 }}>
      <Img id={image} ph={DS.blue.b900} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.45))" }} />
      <div style={{ position: "relative", padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minHeight: 200, justifyContent: "flex-end", textAlign: "center" }}>
        {badge && <span style={{ background: C.yellow, color: C.yellowInk, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 100 }}>{badge}</span>}
        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.3, maxWidth: 260 }}>{title}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ background: C.brand, color: "#fff", fontSize: 11, fontWeight: 600, padding: "9px 18px", borderRadius: R.md }}>{cta}</span>
          <span style={{ background: "rgba(255,255,255,.15)", border: "1px solid #ffffff88", color: "#fff", fontSize: 11, fontWeight: 600, padding: "9px 18px", borderRadius: R.md }}>{cta2}</span>
        </div>
      </div>
    </div>
  );
}

// Assigned Professional card — arrival window + Chat/Call (QA: Thank You)
function AssignedPro({ name = "Leila Mary", image = "avatar-3", rating = "4.7", window = "13:00-14:00", status = "Professional assigned" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: C.link }}>{status} <ChevronRight size={14} color={C.link} /></span>
          <span style={{ fontSize: 11, color: C.text2 }}>We'll arrive between {window}.</span>
        </div>
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <Img id={image} radius={24} ph={C.bg3} style={{ width: 48, height: 48, objectFit: "cover" }} />
          {rating && <span style={{ position: "absolute", top: -4, right: -4, display: "inline-flex", alignItems: "center", gap: 2, background: "#fff", borderRadius: 100, padding: "1px 4px", fontSize: 8, fontWeight: 600, color: C.text, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}><Star size={8} color="#FFB800" />{rating}</span>}
          <span style={{ display: "block", textAlign: "center", fontSize: 9, fontWeight: 600, color: C.link, marginTop: 2 }}>{name}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[{ l: "Chat" }, { l: "Call" }].map(a => (
          <span key={a.l} style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 100, padding: "9px 0", fontSize: 11, fontWeight: 600, color: C.success, border: `1px solid ${C.border}` }}>{a.l}</span>
        ))}
      </div>
    </div>
  );
}

// Kind-gesture banner (QA: Thank You)
function KindBanner({ text = "Show kind gestures, they go a long way" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFF4EC", borderRadius: R.md, padding: "12px 14px" }}>
      <span style={{ fontSize: 15 }}>❤️</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{text}</span>
    </div>
  );
}

// Full booking details table (QA: Thank You) — label/value rows + action rows
function BookingDetailsFull({ title = "Booking Details", instructionsAction = "Add", rows, professional, actions }) {
  const R2 = rows && rows.length ? rows : [
    { label: "Status", value: "Confirmed", tone: "success" },
    { label: "Reference code", value: "043DD43" },
    { label: "Service", value: "Women's Salon" },
    { label: "Frequency", value: "One time" },
    { label: "Date & Time", value: "7 Jul 2026, 09:00-09:30" },
    { label: "Duration", value: "2 Hours, 3 Cleaners" },
    { label: "Material", value: "No" },
    { label: "Total (Inc VAT)", value: "600", price: true, bold: true },
    { label: "Payment Method", value: "Visa **** 0021", payLogo: "visa" },
  ];
  const acts = actions && actions.length ? actions : [{ label: "Edit this booking only" }, { label: "Manage subscription" }];
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: DS.blue.b900 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: R.md, padding: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Any specific instructions?</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.link }}>{instructionsAction}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {R2.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.text2, flex: "0 0 auto" }}>{r.label}</span>
            <span style={{ fontSize: 11, fontWeight: r.bold ? 600 : 400, color: r.tone === "success" ? C.success : C.text, textAlign: "right", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {r.payLogo && payLogoId(r.value.split(" ")[0]) ? <Img id={payLogoId(r.value.split(" ")[0])} style={{ width: 26, height: 16, objectFit: "contain" }} /> : null}
              {r.price ? <><Dh size={10} color={C.text} />{cleanNum(r.value)}</> : r.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {acts.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: R.md, padding: "12px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: C.text }}>{a.label}</span><ChevronRight size={16} color={C.text3} />
          </div>
        ))}
      </div>
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
function AddonTile({ image, name = "Balcony Cleaning", price = "15", oldPrice, qty, fluid, selected }) {
  const q = qty || (selected ? 1 : 0);
  return (
    <div style={{ position: "relative", background: C.bg2, borderRadius: R.lg, width: fluid ? "auto" : 116, flex: fluid ? "1 1 auto" : "0 0 116px", paddingBottom: 8, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden", border: selected ? `1.5px solid ${C.brand}` : "1.5px solid transparent" }}>
      <div style={{ position: "relative" }}>
        <Img id={image} radius={R.lg} ph={C.bg3} style={{ width: "100%", height: 100 }} />
        {q > 0
          ? <span style={{ position: "absolute", bottom: 8, right: 8, display: "inline-flex", alignItems: "center", background: "#fff", borderRadius: R.md, boxShadow: "0 2px 6px rgba(0,0,0,.12)", overflow: "hidden" }}>
              <span style={{ padding: "6px 7px", display: "flex" }}><Trash2 size={13} color={C.text2} /></span>
              <span style={{ minWidth: 18, textAlign: "center", fontSize: 11, fontWeight: 600, color: C.text }}>{q}</span>
              <span style={{ background: C.brand, padding: "7px 7px", display: "flex" }}><Plus size={13} color="#fff" /></span>
            </span>
          : <span style={{ position: "absolute", bottom: 8, right: 8, background: C.brand, borderRadius: R.md, padding: 7, display: "flex", boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}><Plus size={15} color="#fff" /></span>}
      </div>
      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: "14px" }}>{name}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.link }}>Learn More</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Price value={price} size={11} />
          {oldPrice && <span style={{ fontSize: 11, color: C.text3, textDecoration: "line-through", display: "inline-flex", alignItems: "center" }}><Dh size={9} color={C.text3} />{cleanNum(oldPrice)}</span>}
        </div>
      </div>
    </div>
  );
}
function AddonsCard({ title = "Add-ons", items, layout = "row" }) {
  const its = items && items.length ? items : [{ name: "Balcony Cleaning", price: "15", oldPrice: "10" }, { name: "Fridge Cleaning", price: "30" }, { name: "Oven Cleaning", price: "25" }];
  const grid = String(layout).toLowerCase() === "grid";
  // Auto-assign a DISTINCT add-on image to each tile (round-robin) so every card differs,
  // regardless of whether the AI supplied images. An explicit item.image always wins.
  const pool = (ADDON_IDS && ADDON_IDS.length) ? ADDON_IDS : [];
  const withImg = its.map((a, i) => ({ ...a, image: a.image || (pool.length ? pool[i % pool.length] : undefined) }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
      {title && <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{title}</div>}
      {grid
        ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: S.md }}>{withImg.map((a, i) => <AddonTile key={i} {...a} fluid selected={a.selected} />)}</div>
        : <div className="jl-noscroll" style={{ display: "flex", gap: S.md, overflowX: "auto", margin: "0 -16px", padding: "0 16px" }}>{withImg.map((a, i) => <AddonTile key={i} {...a} />)}</div>}
    </div>
  );
}

function FrequencyOptions({ title = "How often would you like your home cleaned?", options, active = 1 }) {
  const opts = options && options.length ? options : [
    { label: "One Time", discount: "10% OFF", bullets: ["Perfect pick for an uncertain schedule.", "Pay once, with no commitment."] },
    { label: "Recurring", discount: "25% OFF", bullets: ["Flexible, ongoing cleaning.", "Pay after each service, no upfront cost."], tabs: ["Weekly", "Every Two Weeks"], days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], banner: "Yaay! You've earned 10% discount. Unlock up to 25% by booking more days!" },
    { label: "Monthly Subscription", discount: "40% OFF", bullets: ["Get the same professional every week.", "Pause or cancel anytime you want."] },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>}
      {opts.map((o, i) => {
        const sel = i === active;
        const expanded = sel && (o.tabs || o.days || o.banner);
        return (
          <div key={i} style={{ borderRadius: R.lg, border: `1.5px solid ${sel ? C.brand : C.border}`, background: sel ? C.selected : C.bg2, overflow: "hidden" }}>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{o.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                  {o.discount && <span style={{ background: DS.success.chip, color: C.yellowInk, fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: R.xs, whiteSpace: "nowrap" }}>{o.discount}</span>}
                  <ControlDot type="radio" selected={sel} />
                </div>
              </div>
              {o.bullets && o.bullets.length > 0 && <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                {o.bullets.map((b, j) => <div key={j} style={{ fontSize: 11, color: C.text2, lineHeight: 1.4, display: "flex", gap: 6 }}><span>•</span><span>{b}</span></div>)}
              </div>}
              {expanded && o.tabs && (
                <div style={{ display: "flex", gap: 8 }}>
                  {o.tabs.map((t, j) => (
                    <span key={j} style={{ padding: "9px 16px", borderRadius: R.md, border: `1px solid ${j === 0 ? C.brand : C.border}`, background: C.bg, fontSize: 9, fontWeight: j === 0 ? 600 : 400, color: j === 0 ? C.link : C.text, whiteSpace: "nowrap" }}>{t}</span>
                  ))}
                </div>
              )}
              {expanded && o.days && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Which days do you prefer?</span>
                  <div className="jl-noscroll" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                    {o.days.map((d, j) => (
                      <span key={j} style={{ flex: "0 0 auto", minWidth: 40, textAlign: "center", padding: "10px 8px", borderRadius: R.md, border: `1px solid ${C.border}`, background: C.bg, fontSize: 9, color: C.text }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {expanded && o.banner && (
                <div style={{ display: "flex", gap: 8, background: DS.success.bg, borderRadius: R.md, padding: "10px 12px" }}>
                  <span style={{ flex: "0 0 auto", fontSize: 12 }}>🏷️</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#2E4400", lineHeight: 1.4 }}>{o.banner}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Justlife Promise — marketing reassurance block (QA: Frequency screen)
function JustlifePromise({ title = "justlife Promise", items }) {
  const its = items && items.length ? items : [
    { title: "More Days, More Savings!", desc: "Save up to 40% based on your plan" },
    { title: "Reschedule or Cancel Anytime", desc: "Total flexibility at your fingertips!" },
  ];
  return (
    <div style={{ padding: "18px 14px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <svg width="26" height="30" viewBox="0 0 26 30" fill="none"><path d="M13 2 L23 6 V14 C23 21 18 26 13 28 C8 26 3 21 3 14 V6 Z" fill="none" stroke={C.text3} strokeWidth="1.6" /></svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text3 }}>{title}</span>
      </div>
      {its.map((it, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{it.title}</span>
          {it.desc && <span style={{ fontSize: 11, color: C.text2 }}>{it.desc}</span>}
        </div>
      ))}
    </div>
  );
}

// Selectable Item / Pill — pill choice row (QA: materials Yes/No), optional "Powered by justlife"
function PillSelector({ label, options, active = 0, poweredBy, info }) {
  const opts = (options && options.length ? options : ["Yes, please", "No, thanks"]).map(o => typeof o === "string" ? { label: o } : o);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
          {info && <AlertCircle size={12} color={C.text3} />}
          {poweredBy && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto", fontSize: 9, color: C.text3 }}>Powered by <JustlifeMark size={13} /><span style={{ fontWeight: 600, color: C.brand }}>justlife</span></span>}
        </div>
      )}
      <div style={{ display: "flex", gap: S.md, flexWrap: "wrap" }}>
        {opts.map((o, i) => {
          const st = selState(o.disabled ? "disabled" : i === active ? "selected" : "default");
          return <div key={i} style={{ padding: "9px 16px", borderRadius: 100, background: st.bg, border: `1px solid ${st.border}`, fontSize: 11, fontWeight: st.bold ? 600 : 400, color: st.text, whiteSpace: "nowrap" }}>{o.label}</div>;
        })}
      </div>
    </div>
  );
}

// Frequency Summary — chosen plan row + Change link (QA: Date & Time screen)
function FrequencySummary({ title = "Frequency", value = "Weekly", note, change = "Change" }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, rowGap: 10, padding: 14, borderRadius: R.lg, border: `1.5px solid ${C.brand}`, background: C.selected }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, rowGap: 4, minWidth: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.brand, color: "#fff", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 100, whiteSpace: "nowrap" }}><RefreshCw size={12} color="#fff" />{value}</span>
        {note && <span style={{ fontSize: 9, color: C.text2, whiteSpace: "nowrap" }}>{note}</span>}
      </div>
      </div>
      {change && <span style={{ fontSize: 13, fontWeight: 600, color: C.link, whiteSpace: "nowrap", flex: "0 0 auto", alignSelf: "flex-start" }}>{change}</span>}
    </div>
  );
}

// Professional Chooser — auto-assign + professional cards strip (QA: Date & Time screen)
function ProfessionalChooser({ title = "Which professional do you prefer?", pros, active = 1 }) {
  const items = pros && pros.length ? pros : [
    { autoassign: true, name: "Auto-Assign", desc: "We'll assign the best professional" },
    { name: "Leila Mary", image: "avatar-3", rating: "4.7", desc: "Recommended in your area" },
    { name: "Sara M.", image: "avatar-7", rating: "4.8", desc: "Recommended in your area" },
    { name: "Nour A.", image: "avatar-12", rating: "4.9", desc: "Recommended in your area" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>}
      <div className="jl-noscroll" style={{ display: "flex", gap: 10, overflowX: "auto", margin: "0 -16px", padding: "2px 16px" }}>
        {items.map((p, i) => {
          const sel = i === active && !p.disabled;
          return (
            <div key={i} style={{ flex: "0 0 120px", width: 120, borderRadius: R.lg, border: `1.5px solid ${sel ? C.brand : C.border}`, background: sel ? C.selected : C.bg2, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {p.autoassign
                ? <>
                    <span style={{ width: 66, height: 66, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}><JustlifeMark size={30} light /></span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.name || "Auto-Assign"}</span>
                    <span style={{ fontSize: 10, color: C.text2, textAlign: "center", lineHeight: 1.35 }}>{p.desc || "We'll assign the best professional"}</span>
                  </>
                : <>
                    <div style={{ position: "relative", width: 66, height: 66 }}>
                      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DS.bg.brandSubtle }} />
                      <Img id={p.image || "avatar-1"} radius={33} ph={C.bg3} style={{ position: "relative", width: 66, height: 66, objectFit: "cover" }} />
                      {p.rating && <span style={{ position: "absolute", top: -2, right: -2, display: "inline-flex", alignItems: "center", gap: 2, background: "#fff", borderRadius: 100, padding: "1px 5px", fontSize: 9, fontWeight: 600, color: C.text, boxShadow: "0 1px 4px rgba(0,0,0,.15)" }}><Star size={9} color="#FFB800" />{p.rating}</span>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.link, background: C.bg, borderRadius: 100, padding: "3px 12px", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: C.text2, textAlign: "center", lineHeight: 1.35 }}>{p.desc || "Recommended in your area"}</span>
                  </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Voucher + Wallet — two side-by-side cards (QA: Checkout screen)
function VoucherWallet({ title = "Apply Voucher or Wallet Balance", voucher = "Apply Voucher Code", wallet = "No wallet balance", walletDisabled = true }) {
  const cell = (label, disabled, icon) => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", borderRadius: R.md, border: `1px dashed ${disabled ? C.border : C.brand}`, background: disabled ? C.bg3 : C.bg, minWidth: 0 }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 600, color: disabled ? C.disabled : C.link, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      {title && <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{title}</div>}
      <div style={{ display: "flex", gap: S.md }}>
        {cell(voucher, false, <Plus size={12} color={C.link} style={{ flex: "0 0 12px" }} />)}
        {cell(wallet, walletDisabled, <Wallet size={12} color={walletDisabled ? C.disabled : C.link} style={{ flex: "0 0 12px" }} />)}
      </div>
    </div>
  );
}
function SubscriptionSchedule(p) { return <FrequencyOptions title="Subscription schedule" {...p} />; }

function SpecialInstructions({ label = "Any specific instructions?", action = "Add" }) {
  return (
    <div style={{ background: C.bg2, borderRadius: R.lg, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: S.md, color: C.text2, minWidth: 0 }}><AlertCircle size={16} color={C.text3} style={{ flex: "0 0 16px" }} /><span style={{ fontSize: 11 }}>{label}</span></div>
      <span style={{ color: C.link, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", flex: "0 0 auto", marginLeft: 8 }}>{action}</span>
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
  // Official Justlife DS 2D nav icons (house / calendar / wallet / user), fill-based
  const paths = [
    [
      "M14 21V13H10V21C10 21.5523 9.55228 22 9 22C8.44772 22 8 21.5523 8 21V13C8 12.4696 8.21087 11.961 8.58594 11.5859C8.96101 11.2109 9.46957 11 10 11H14C14.5304 11 15.039 11.2109 15.4141 11.5859C15.7891 11.961 16 12.4696 16 13V21C16 21.5523 15.5523 22 15 22C14.4477 22 14 21.5523 14 21Z",
      "M20 9.99951C20 9.85414 19.9684 9.71048 19.9072 9.57861C19.846 9.44668 19.7566 9.32973 19.6455 9.23584L19.6406 9.23096L12.6455 3.23486V3.23584C12.465 3.08329 12.2363 2.99951 12 2.99951C11.7637 2.99951 11.535 3.08329 11.3545 3.23584L11.3535 3.23486L4.35938 9.23096L4.35449 9.23584C4.24341 9.32973 4.15399 9.44668 4.09277 9.57861C4.03159 9.71048 4 9.85415 4 9.99951V18.9995C4 19.2647 4.10543 19.52 4.29297 19.7075C4.48048 19.8949 4.7349 19.9995 5 19.9995H19C19.2651 19.9995 19.5195 19.8949 19.707 19.7075C19.8946 19.52 20 19.2647 20 18.9995V9.99951ZM22 18.9995C22 19.7952 21.6837 20.559 21.1211 21.1216C20.5585 21.684 19.7955 21.9995 19 21.9995H5C4.20447 21.9995 3.44149 21.684 2.87891 21.1216C2.3163 20.559 2 19.7952 2 18.9995V9.99951C2 9.56341 2.09478 9.13242 2.27832 8.73682C2.46197 8.34101 2.73024 7.99017 3.06348 7.7085L10.0586 1.7124L10.0635 1.7085C10.605 1.25086 11.291 0.999512 12 0.999512C12.6202 0.999512 13.2229 1.19185 13.7266 1.54639L13.9365 1.7085L13.9414 1.7124L20.9365 7.7085L21.0586 7.81689C21.3356 8.0782 21.561 8.39045 21.7217 8.73682C21.9052 9.13242 22 9.56341 22 9.99951V18.9995Z"
    ],
    [
      "M7 6V2C7 1.44772 7.44772 1 8 1C8.55228 1 9 1.44772 9 2V6C9 6.55228 8.55228 7 8 7C7.44772 7 7 6.55228 7 6ZM15 6V2C15 1.44772 15.4477 1 16 1C16.5523 1 17 1.44772 17 2V6C17 6.55228 16.5523 7 16 7C15.4477 7 15 6.55228 15 6Z",
      "M20 6C20 5.44772 19.5523 5 19 5H5C4.44772 5 4 5.44772 4 6V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V6ZM22 20C22 21.6569 20.6569 23 19 23H5C3.34315 23 2 21.6569 2 20V6C2 4.34315 3.34315 3 5 3H19C20.6569 3 22 4.34315 22 6V20Z",
      "M21 9C21.5523 9 22 9.44772 22 10C22 10.5523 21.5523 11 21 11H3C2.44772 11 2 10.5523 2 10C2 9.44772 2.44772 9 3 9H21Z"
    ],
    [
      "M18 13C17.7348 13 17.4805 13.1054 17.293 13.293C17.1054 13.4805 17 13.7348 17 14C17 14.2652 17.1054 14.5195 17.293 14.707C17.4805 14.8946 17.7348 15 18 15H21V13H18ZM5 4C4.73478 4 4.4805 4.10543 4.29297 4.29297C4.10543 4.4805 4 4.73478 4 5C4 5.26522 4.10543 5.5195 4.29297 5.70703C4.4805 5.89457 4.73478 6 5 6H18V4H5ZM20 6C20.5304 6 21.039 6.21087 21.4141 6.58594C21.7891 6.96101 22 7.46957 22 8V11.2695C22.1498 11.3561 22.2896 11.4615 22.4141 11.5859C22.7891 11.961 23 12.4696 23 13V15C23 15.5304 22.7891 16.039 22.4141 16.4141C22.039 16.7891 21.5304 17 21 17H18C17.2043 17 16.4415 16.6837 15.8789 16.1211C15.3163 15.5585 15 14.7957 15 14C15 13.2043 15.3163 12.4415 15.8789 11.8789C16.4415 11.3163 17.2043 11 18 11H20V8H5C4.20435 8 3.44152 7.6837 2.87891 7.12109C2.3163 6.55849 2 5.79565 2 5C2 4.20435 2.3163 3.44152 2.87891 2.87891C3.44152 2.3163 4.20435 2 5 2H18C18.5304 2 19.039 2.21086 19.4141 2.58594C19.7891 2.96101 20 3.46957 20 4V6Z",
      "M2 19V5C2 4.44772 2.44772 4 3 4C3.55228 4 4 4.44772 4 5V19C4 19.2652 4.10543 19.5195 4.29297 19.707C4.48051 19.8946 4.73478 20 5 20H20V16C20 15.4477 20.4477 15 21 15C21.5523 15 22 15.4477 22 16V20C22 20.5304 21.7891 21.039 21.4141 21.4141C21.039 21.7891 20.5304 22 20 22H5C4.20435 22 3.44152 21.6837 2.87891 21.1211C2.3163 20.5585 2 19.7956 2 19Z"
    ],
    [
      "M18 21V19C18 18.2044 17.6837 17.4415 17.1211 16.8789C16.5585 16.3163 15.7956 16 15 16H9C8.20435 16 7.44152 16.3163 6.87891 16.8789C6.3163 17.4415 6 18.2044 6 19V21C6 21.5523 5.55228 22 5 22C4.44772 22 4 21.5523 4 21V19C4 17.6739 4.52716 16.4025 5.46484 15.4648C6.40253 14.5272 7.67392 14 9 14H15C16.3261 14 17.5975 14.5272 18.5352 15.4648C19.4728 16.4025 20 17.6739 20 19V21C20 21.5523 19.5523 22 19 22C18.4477 22 18 21.5523 18 21Z",
      "M15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10C13.6569 10 15 8.65685 15 7ZM17 7C17 9.76142 14.7614 12 12 12C9.23858 12 7 9.76142 7 7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7Z"
    ],
  ];
  const ic = (i, on) => <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? DS.blue.b900 : "#8A9098"}>{paths[i].map((d, k) => <path key={k} d={d} />)}</svg>;
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
// ============================================================
//  CUSTOM COMPONENT ENGINE — the AI composes any missing component
//  from a constrained element tree that only uses DS tokens.
// ============================================================
const TOKEN_BG = { white: "#FFFFFF", primary: "#FFFFFF", secondary: C.bg2, tertiary: C.bg3, selected: C.selected, brand: C.brand, "brand-subtle": DS.bg.brandSubtle, navy: DS.bg.tertiaryAction, inverse: DS.bg.inverse, success: C.successBg, warning: "#FFF8EE", danger: C.dangerBg, yellow: C.yellow, transparent: "transparent" };
const TOKEN_TX = { primary: C.text, secondary: C.text2, tertiary: C.text3, brand: C.brand, link: C.link, inverse: "#FFFFFF", white: "#FFFFFF", success: C.success, danger: C.danger, "yellow-ink": C.yellowInk, navy: DS.blue.b900 };
const tokBg = (v) => v == null ? undefined : (TOKEN_BG[v] !== undefined ? TOKEN_BG[v] : (String(v).startsWith("#") ? v : undefined));
const tokTx = (v) => v == null ? C.text : (TOKEN_TX[v] !== undefined ? TOKEN_TX[v] : (String(v).startsWith("#") ? v : C.text));

function CustomNode({ n, depth = 0, web = false }) {
  if (!n || depth > 8) return null;
  const t = n.t || n.type;
  if (t === "text") {
    const size = web ? Math.min(32, Number(n.size) || 14) : ((n.size === 9 || n.size === 11) ? n.size : (Number(n.size) >= 12 ? 11 : 9));
    return <div style={{ fontSize: size, fontWeight: (n.w === 600 || n.bold) ? 600 : (n.w === 500 ? 500 : 400), color: tokTx(n.color || "primary"), textAlign: n.align, lineHeight: 1.45 }}>{n.v}</div>;
  }
  if (t === "price") return <Price value={cleanNum(String(n.v ?? "0"))} size={web ? 14 : (n.size === 9 ? 9 : 11)} color={tokTx(n.color || "primary")} />;
  if (t === "image") return <Img id={n.id} radius={n.r ?? R.md} ph={C.bg3} style={{ width: n.w || "100%", height: n.h || (web ? 140 : 96), objectFit: "cover", flex: n.w ? `0 0 ${n.w}px` : undefined }} />;
  if (t === "icon3d") return <Img id={n.id} ph={C.bg3} style={{ width: n.w || 40, height: n.h || 40, objectFit: "contain", transform: "rotate(-10deg)", flex: "0 0 auto" }} />;
  if (t === "pill") {
    const tone = { brand: { bg: C.brandBg, fg: DS.blue.b900 }, success: { bg: DS.success.chip, fg: C.success }, warning: { bg: "#FFF8EE", fg: C.yellowInk }, neutral: { bg: C.bg3, fg: C.text2 }, danger: { bg: C.dangerBg, fg: C.danger } }[n.tone || "brand"] || { bg: C.brandBg, fg: DS.blue.b900 };
    return <span style={{ alignSelf: "flex-start", background: tone.bg, color: tone.fg, fontSize: web ? 11 : 9, fontWeight: 600, padding: "2px 8px", borderRadius: R.xs, whiteSpace: "nowrap" }}>{n.v}</span>;
  }
  if (t === "button") return <PrimaryButton label={n.v || "Continue"} variant={n.variant || "primary"} size={n.sz || (web ? "medium" : "large")} outline={!!n.outline} />;
  if (t === "divider") return <div style={{ height: 1, background: C.border, alignSelf: "stretch" }} />;
  if (t === "stars") { const k = Math.round(Math.min(5, Number(n.v) || 5)); return <div style={{ display: "flex", gap: 2 }}>{[...Array(5)].map((_, i) => <Star key={i} size={web ? 14 : 11} color={i < k ? "#FFB800" : C.border} />)}</div>; }
  if (t === "control") return <ControlDot type={n.kind || "radio"} selected={n.selected !== false} />;
  if (t === "spacer") return <div style={{ flex: 1 }} />;
  // containers: col / row
  const isRow = t === "row";
  const kids = Array.isArray(n.children) ? n.children : [];
  return (
    <div style={{ display: "flex", flexDirection: isRow ? "row" : "column", gap: n.gap ?? (web ? 10 : 8), padding: n.pad, background: tokBg(n.bg), borderRadius: n.r, border: n.border ? `1px solid ${C.border}` : undefined, alignItems: n.align || (isRow ? "center" : "stretch"), justifyContent: n.justify, flexWrap: n.wrap ? "wrap" : undefined, flex: n.flex, minWidth: 0, overflow: n.r ? "hidden" : undefined }}>
      {kids.map((k, i) => <CustomNode key={i} n={k} depth={depth + 1} web={web} />)}
    </div>
  );
}
function CustomBlock({ layout, web = false, __name }) {
  if (!layout) return <GenericDSCard __name={__name || "Custom"} />;
  return <CustomNode n={layout} web={web} />;
}
const CustomBlockWeb = (p) => <CustomBlock {...p} web />;

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
  "Custom": { c: CustomBlock },
  "Justlife Promise": { c: JustlifePromise },
  "Selectable Item / Pill": { c: PillSelector }, "Pill Selector": { c: PillSelector },
  "Frequency Summary": { c: FrequencySummary },
  "Professional Chooser": { c: ProfessionalChooser }, "Professional Card · DS": { c: ProfessionalChooser },
  "Voucher Code Card": { c: VoucherWallet }, "Justlife Credit Card": { c: VoucherWallet }, "Voucher Wallet": { c: VoucherWallet },
  "BNPL": { c: BnplCard }, "Tabby": { c: BnplCard }, "Tamara": { c: BnplCard }, "BNPL Card": { c: BnplCard },
  "Confirmation Hero": { c: ConfirmationHero }, "Promo Hero": { c: ConfirmationHero },
  "Assigned Professional": { c: AssignedPro }, "Assigned Pro": { c: AssignedPro },
  "Kind Banner": { c: KindBanner }, "Kind Gesture": { c: KindBanner },
  "Booking Details Full": { c: BookingDetailsFull }, "Booking Summary": { c: BookingDetailsFull },
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

function WebHeader({ brand = "Justlife", links, cta = "Book Now", user, nav, curId }) {
  const L = (links && links.length ? links : ["Services", "Pricing", "About", "Contact"]).map(l => typeof l === "string" ? { label: l } : l);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "16px 36px", background: C.bg, borderBottom: `1px solid ${C.border}`, flex: "0 0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <JustlifeMark size={22} /><span style={{ fontWeight: 600, fontSize: WF.h3, color: C.text }}>{brand}</span>
      </div>
      <div style={{ display: "flex", gap: 22, marginLeft: 12 }}>
        {L.map((l, i) => {
          const on = l.to ? l.to === curId : i === 0;
          const click = l.to && nav ? () => nav(l.to) : null;
          return <span key={i} onClick={click} style={{ fontSize: WF.small, color: on ? C.text : C.text2, fontWeight: on ? 600 : 400, cursor: click ? "pointer" : "default", borderBottom: on && l.to ? `2px solid ${C.brand}` : "2px solid transparent", paddingBottom: 2 }}>{l.label}</span>;
        })}
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

function WebSidebar({ items, active = 0, nav, curId }) {
  const its = (items && items.length ? items : ["Dashboard", "Bookings", "Professionals", "Customers", "Payments", "Reports", "Settings"]).map(it => typeof it === "string" ? { label: it } : it);
  const byId = its.findIndex(it => it.to && it.to === curId);
  const act = byId !== -1 ? byId : active;
  return (
    <div style={{ width: 190, flex: "0 0 190px", background: C.bg2, borderRight: `1px solid ${C.border}`, padding: "18px 10px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 16px" }}>
        <JustlifeMark size={20} /><span style={{ fontWeight: 600, fontSize: WF.small, color: C.text }}>Admin</span>
      </div>
      {its.map((l, i) => {
        const click = l.to && nav ? () => nav(l.to) : null;
        return <div key={i} onClick={click} style={{ fontSize: WF.tiny, fontWeight: i === act ? 600 : 400, color: i === act ? DS.blue.b900 : C.text2, background: i === act ? C.brandBg : "transparent", padding: "9px 12px", borderRadius: R.md, cursor: click ? "pointer" : "default" }}>{l.label}</div>;
      })}
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
  "Footer": { c: WebFooter }, "Form": { c: WebForm }, "Contact Form": { c: WebForm }, "Custom": { c: CustomBlockWeb },
};
const WEB_BY_NORM = Object.fromEntries(Object.entries(WEB_LIVE).map(([k, v]) => [norm(k), v]));
const resolveWeb = (name) => WEB_LIVE[name] || WEB_BY_NORM[norm(name)] || null;

function BrowserFrame({ children }) {
  return (
    <div style={{ width: "100%", maxWidth: 1000, background: "#0b0b0b", borderRadius: 18, padding: 8, boxShadow: "0 30px 60px rgba(0,0,0,.18)" }}>
      <div className="jl-noscroll" style={{ background: C.bg, borderRadius: 12, overflow: "hidden", color: C.text, display: "flex", flexDirection: "column", height: 620 }}>
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

function WebScreen({ spec, go, curId }) {
  const nodes = (spec && spec.nodes) || [];
  const top = [], side = [], flow = [];
  const seen = new Set();
  for (const n of nodes) {
    if (seen.has(n.component)) continue; seen.add(n.component);
    const r = resolveWeb(n.component);
    if (!r) { flow.push({ n, r: null }); continue; }
    (r.top ? top : r.side ? side : flow).push({ n, r });
  }
  const clickFor = (n) => (n.link && go) ? () => go(n.link) : null;
  const body = (
    <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      {flow.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: C.text3 }}><ArrowRight size={26} /><div style={{ marginTop: 8, fontSize: 13 }}>Your generated page appears here</div></div>}
      {flow.map(({ n, r }, i) => { const Comp = r ? r.c : GenericDSCard; const ex = r ? {} : { __name: n.component }; const oc = clickFor(n); return <div key={i} onClick={oc} style={oc ? { cursor: "pointer" } : null}><Comp {...(n.props || {})} {...ex} /></div>; })}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, fontFamily: FONT }}>
      {top.map(({ n, r }, i) => { const Comp = r.c; return <Comp key={i} {...(n.props || {})} nav={go} curId={curId} />; })}
      {side.length
        ? <div style={{ display: "flex", flex: 1, minHeight: 0 }}>{side.map(({ n, r }, i) => { const Comp = r.c; return <Comp key={i} {...(n.props || {})} nav={go} curId={curId} />; })}{body}</div>
        : body}
    </div>
  );
}

const WEB_RULES = `GENERATION PROTOCOL — think in these steps first:
STEP 1 — DECOMPOSE the request into UI pieces (nav, hero, stats, chart, table, cards, form, footer…).
STEP 2 — MATCH each piece to a component in the list below and fill it with realistic content.
STEP 3 — SYNTHESIZE anything not covered with a "Custom" element tree using DS tokens ONLY (brand color, Poppins, spacing, radii) so it matches the Justlife look. Never skip a requested piece.

RULES (WEB):
1. Use these component names when they fit, and "Custom" for anything else: "Web Header" {brand,links:[{label,to?}],cta,user} · "Sidebar" {items:[{label,to?}],active} · "Web Hero" {title,subtitle,cta,cta2,image(photo id),stat} · "Stat Cards" {items:[{label,value,delta,currency:bool}]} · "Chart" {title,bars:[12 numbers],labels:[12 short strings]} · "Data Table" {title,columns:[5 strings],rows:[[name,service,date,amount-number,status]]} · "Card Grid" {title,items:[{title,desc,price,image(photo id)}],columns} · "Form" {title,fields:[string],cta} · "Footer" {brand,columns:[{title,links:[string]}]}.
2. Output STRICT JSON ONLY: {"title":string,"platform":"web","nodes":[{"component":<name>,"props":{...}}]}. No markdown.
3. Prices/amounts are NUMBERS ONLY (no currency words) — the Dirham symbol renders automatically.
4. MATCH PAGE TYPE:
   - DASHBOARD/ADMIN -> "Sidebar" FIRST, then "Stat Cards", "Chart", "Data Table". NO Web Hero / Web Header / Footer on dashboards.
   - WEBSITE/LANDING -> "Web Header" FIRST, then "Web Hero", "Card Grid", optional "Form", "Footer" LAST. NO Sidebar on websites.
5. Use each component AT MOST once. 3-6 nodes. Rich, realistic Justlife content (real service names, believable numbers). Table status values: Confirmed | In progress | Completed | Cancelled.
6. FLOW MODE (multi-page): "to" on Sidebar items / Web Header links = page id to navigate to. Any other node may add a top-level "link":<page id> to be clickable.
CUSTOM COMPONENTS — if the request needs ANYTHING not in the catalog, DO NOT skip or approximate it with a wrong component. Build it exactly as {"component":"Custom","props":{"layout":{...}}} with this element tree (DS tokens only):
- containers: {"t":"col"|"row","gap"?,"pad"?,"bg"?,"r"?,"border"?:true,"align"?,"justify"?,"wrap"?:true,"flex"?,"children":[...]}
- leaves: {"t":"text","v",size,"w":400|500|600,"color"?} · {"t":"price","v"} · {"t":"image","id":<SERVICE PHOTO id>,"h"?,"w"?,"r"?} · {"t":"icon3d","id":<3D icon id>} · {"t":"pill","v","tone":"brand"|"success"|"warning"|"danger"|"neutral"} · {"t":"button","v","variant"?,"outline"?} · {"t":"divider"} · {"t":"stars","v":1-5} · {"t":"control","kind":"radio"|"checkbox","selected"} · {"t":"spacer"}
- bg tokens ONLY: white|secondary|tertiary|selected|brand|brand-subtle|navy|inverse|success|warning|danger|yellow. text color tokens ONLY: primary|secondary|tertiary|brand|link|inverse|success|danger|yellow-ink|navy.
MICROCOPY — match native app lengths: option/pill labels 1-2 words ("Weekly", "Bi-weekly", "Yes, please"); savings notes SHORT ("Save 15%", "Most popular" — max ~18 chars); time-slot tags: money tags start with a number ("5 EXTRA", "5 OFF"), word tags plain ("Popular", "Off-peak"); link labels one word ("Change", "Add", "Details").
CONTENT RULES — output MUST be tailored to THIS request: every title, service name, price, count and label derives from the user's words (their service type, city, offer, audience). Set EVERY prop explicitly with fresh specific copy — never rely on component defaults, never repeat example values.\nOFF-DOMAIN REQUESTS (games, calculators, or anything NOT a Justlife service screen) — DO build it, never refuse. Compose the whole thing from \"Custom\" element trees using DS tokens only, as a STATIC MOCKUP (no real interactivity). Examples: tic-tac-toe = a 3x3 grid of Custom boxes with X/O text (brand color for the active mark); a calculator = a display text row + grid of button leaves; a quiz = question text + option rows. Use \"App Header\" for the title bar, keep phone width, and pick colors from the DS palette (brand=primary/active, secondary/tertiary=surfaces).
Custom text sizes on web: 11-32.`;

// Loading skeletons — pulsing DS-toned placeholders while the AI generates
function SkeletonScreen() {
  const blk = (h, r, w) => <div className="jl-skel" style={{ height: h, width: w || "100%", background: C.bg3, borderRadius: r || R.lg }} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "22px 20px", gap: 14 }}>
      {blk(40, R.pill)}
      {blk(130)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>{blk(74)}{blk(74)}{blk(74)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>{blk(74)}{blk(74)}{blk(74)}</div>
      {blk(84)}
      {blk(84)}
      <div style={{ marginTop: "auto" }}>{blk(54, R.pill)}</div>
    </div>
  );
}
function WebSkeleton() {
  const blk = (h, w) => <div className="jl-skel" style={{ height: h, width: w || "100%", background: C.bg3, borderRadius: R.lg }} />;
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div style={{ width: 190, flex: "0 0 190px", borderRight: `1px solid ${C.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(6)].map((_, i) => <div key={i} className="jl-skel" style={{ height: 30, background: C.bg3, borderRadius: R.md }} />)}
      </div>
      <div style={{ flex: 1, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>{blk(78)}{blk(78)}{blk(78)}{blk(78)}</div>
        {blk(180)}
        {blk(200)}
      </div>
    </div>
  );
}

// ============================================================
function PhoneFrame({ children }) {
  return (
    <div style={{ width: 360, background: "#0b0b0b", borderRadius: 44, padding: 10, boxShadow: "0 30px 60px rgba(0,0,0,.18)", flex: "0 0 auto" }}>
      <div className="jl-noscroll" style={{ background: C.bg, borderRadius: 36, height: 720, overflow: "hidden", color: C.text, position: "relative", display: "flex", flexDirection: "column" }}>
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
function photoLists(groups) {
  const all = ((groups && groups.photos) || []).map(a => a.id);
  const isAvatar = (x) => /avatar|portrait|person|professional|pro-/i.test(x);
  const isAddon = (x) => /^addon-/i.test(x);
  const addon = all.filter(isAddon);
  const svc = all.filter(x => !isAvatar(x) && !isAddon(x));
  const ava = all.filter(isAvatar);
  return { svc, ava, addon };
}
function catalogText(groups, catalog, lite) {
  const lines = [
    'CATALOG — review this list and MATCH each piece of the request to a component here. Anything not covered → build with "Custom" (DS tokens only).',
    'COMPONENTS (use these EXACT names; each renders a real live DS component):',
    '- "Input/SearchMobile" {placeholder}',
    '- "Hero Banner" {title,subtitle,cta,discount,image(photo id)}',
    '- "Homepage Section" {title,action,items:[{label,icon(3D icon id),tag}]}  (services grid of tiles)',
    '- "Service Card" / "Product Card" {title,duration,desc,price,oldPrice,cta(Add|Select),image(photo id)}',
    '- "Combo Selection" {title,price,oldPrice,control(checkbox|radio),selected,image(photo id)}',
    '- "Selectable Item" {title,line2,line3,tag,selected,control(radio|checkbox)}  address/list row; tag e.g. "Default address" (brand)',
    '- "Selectable Item / Date" {label,items:[{day,date,disabled}],active}  date strip; label e.g. "When would you like your service?"',
    '- "Selectable Item / Time Slot with Tag" {label,items:[{time,tag,tagType(extra|off),disabled}],active}  time slots; label e.g. "What time would you like us to start?"',
    '- "Selectable Item / Number Box" {label,count,active}  numbered boxes (bedrooms/bathrooms/units count)',
    '- "Disclaimer" {message,type(success|warning|error|neutral),button}  tonal callout e.g. free-cancellation note; button e.g. "Details"',
    '- "Justlife Promise" {items:[{title,desc}]}  reassurance block (savings + flexibility). Use on Frequency screens.',
    '- "Selectable Item / Pill" {label,options:[string],active,poweredBy:bool,info:bool}  pill choice row e.g. cleaning materials Yes/No',
    '- "Frequency Summary" {title,value,note,change}  chosen-plan row with Change link. Use FIRST on Date & Time screens.',
    '- "Professional Chooser" {title,pros:[{name,image(avatar id),rating,autoassign:bool}],active}  auto-assign + professional cards strip',
    '- "Voucher Wallet" {title,voucher,wallet,walletDisabled}  voucher code + wallet balance side-by-side. Use on Checkout before Price Details.',
    '- "BNPL" {provider(Tabby|Tamara),subtitle}  buy-now-pay-later banner. Use at TOP of Checkout.',
    '- "Confirmation Hero" {image(service photo id),badge,title,cta,cta2}  promo image banner. Use at TOP of the confirmation/thank-you screen.',
    '- "Assigned Professional" {name,image(avatar id),rating,window,status}  arrival window + Chat/Call. Use on confirmation screen.',
    '- "Kind Banner" {text}  small warm reminder banner (thank-you screen).',
    '- "Booking Details Full" {rows:[{label,value,tone,price,bold,payLogo}],actions:[{label}]}  full booking summary table with Status/Reference/Service/Duration/Total + Edit/Manage rows. Use on confirmation screen.',
    '- "Booking Status" {type(confirmed|on-the-way|professional assigned|in-progress|completed|cancelled),title,message,pro}  status header card. Use FIRST on confirmation/tracking screens (after App Header).',
    '- "Info Card" {text,tone(info|warning|success|brand)}  inline tip/callout',
    '- "Plan Booking Card" {title,status(Active|Confirmed|Completed|Cancelled),rows:[{label,value,brand}],pro,rating,cta}',
    '- "Cashback Card" {title,amount,desc,expiry,cta}',
    '- "Rating Summary" {score,count}',
    '- "Tag" / "Category Card" {items:[string],active}  (filter chips)',
    '- "Add-ons Card" {title,layout(grid|row),items:[{name,price,oldPrice,image(a DIFFERENT ADD-ON PHOTO id per item),selected}]}  layout:\"grid\" (2-col) on the Add-ons step; give each item a distinct matching add-on image; a selected item shows a qty stepper (set selected:true, qty:1)',
    '- "Frequency Option" {title,options:[{label,discount:"25% OFF",bullets:[2 short lines],tabs?:["Weekly","Every Two Weeks"],days?:["Mon".."Sun"],banner?:short}],active}  the SELECTED option expands to show tabs+days+banner. discount badge is green. Use as the Frequency screen main block.',
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
    const { svc, ava, addon } = photoLists(groups);
    const ic3d = (groups.icons3d || []).map(a => a.id);
    if (svc.length) lines.push("", "SERVICE PHOTO ids — use these for card/banner/hero images: " + svc.slice(0, 22).join(", "));
    if (addon.length) lines.push("ADD-ON PHOTO ids — use ONLY as the 'image' on Add-ons Card items (each add-on gets its OWN matching image): " + addon.join(", "));
    if (ava.length) lines.push("AVATAR PHOTO ids — ONLY for people (professional/reviewer avatars), NEVER for service cards or heroes: " + ava.slice(0, 8).join(", "));
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

const SCREEN_RULES = `GENERATION PROTOCOL — think in these steps before writing JSON:
STEP 1 — DECOMPOSE: break the request into the distinct UI pieces it needs (header, inputs, cards, lists, banners, CTA bar…).
STEP 2 — MATCH: for each piece, scan the CATALOG for a component that fits. Prefer an exact DS component and fill its props with specific, realistic content from the request.
STEP 3 — SYNTHESIZE: if a needed piece has NO matching catalog component, DO NOT skip it or force a wrong one — build it with a "Custom" element tree using DS tokens ONLY (the DS colors, Poppins text sizes 9/11, spacing, radii defined below). The result must look like it belongs in the Justlife design system.
Then assemble the pieces top-to-bottom into one screen. Every screen should combine matched catalog components + custom pieces as needed to fully satisfy the request.

RULES:
1. Use component names from the CATALOG with their listed props whenever one fits; use "Custom" for anything the catalog doesn't cover. Set rich, realistic props.
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
7. SEPARATION (native Justlife funnel): "Frequency Option", "Add-ons Card" and Date/Time pickers are SEPARATE steps — never put more than ONE of these three on the same screen unless the user explicitly asks for a combined screen.
8. EVERY "Homepage Section" item 'icon' MUST be a 3D SERVICE ICON id. Card/banner/add-on/avatar images use PHOTO ids. Never use 2D ids for the grid.
CUSTOM COMPONENTS — if the request needs ANYTHING not in the catalog, DO NOT skip or approximate it with a wrong component. Build it exactly as {"component":"Custom","props":{"layout":{...}}} with this element tree (DS tokens only):
- containers: {"t":"col"|"row","gap"?,"pad"?,"bg"?,"r"?,"border"?:true,"align"?,"justify"?,"wrap"?:true,"flex"?,"children":[...]}
- leaves: {"t":"text","v",size,"w":400|500|600,"color"?} · {"t":"price","v"} · {"t":"image","id":<SERVICE PHOTO id>,"h"?,"w"?,"r"?} · {"t":"icon3d","id":<3D icon id>} · {"t":"pill","v","tone":"brand"|"success"|"warning"|"danger"|"neutral"} · {"t":"button","v","variant"?,"outline"?} · {"t":"divider"} · {"t":"stars","v":1-5} · {"t":"control","kind":"radio"|"checkbox","selected"} · {"t":"spacer"}
- bg tokens ONLY: white|secondary|tertiary|selected|brand|brand-subtle|navy|inverse|success|warning|danger|yellow. text color tokens ONLY: primary|secondary|tertiary|brand|link|inverse|success|danger|yellow-ink|navy.
MICROCOPY — match native app lengths: option/pill labels 1-2 words ("Weekly", "Bi-weekly", "Yes, please"); savings notes SHORT ("Save 15%", "Most popular" — max ~18 chars); time-slot tags: money tags start with a number ("5 EXTRA", "5 OFF"), word tags plain ("Popular", "Off-peak"); link labels one word ("Change", "Add", "Details").
CONTENT RULES — output MUST be tailored to THIS request: every title, service name, price, count and label derives from the user's words (their service type, city, offer, audience). Set EVERY prop explicitly with fresh specific copy — never rely on component defaults, never repeat example values.\nOFF-DOMAIN REQUESTS (games, calculators, or anything NOT a Justlife service screen) — DO build it, never refuse. Compose the whole thing from \"Custom\" element trees using DS tokens only, as a STATIC MOCKUP (no real interactivity). Examples: tic-tac-toe = a 3x3 grid of Custom boxes with X/O text (brand color for the active mark); a calculator = a display text row + grid of button leaves; a quiz = question text + option rows. Use \"App Header\" for the title bar, keep phone width, and pick colors from the DS palette (brand=primary/active, secondary/tertiary=surfaces).
Custom text sizes: ONLY 9 or 11 (phone scale).`;

const FLOW_RULES = `FLOW MODE — output a CLICKABLE MULTI-SCREEN JOURNEY:
1. Output STRICT JSON ONLY: {"title":string,"start":<screen-id>,"screens":[{"id":kebab-case,"title":string,"nodes":[{"component":...,"props":{...},"link":<screen-id optional>}]}]}.
2. 3-4 screens forming ONE user journey (4 max — keep it fast), e.g. home -> services -> booking -> checkout -> confirmation. Every screen must be reachable from "start" via links.
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
  const [img, setImg] = useState(null);       // { data (base64), mime, name, preview }
  const imgRef = useRef(null);
  useEffect(() => { imgRef.current = img; }, [img]);
  const [editText, setEditText] = useState("");
  const [spec, setSpec] = useState(null);
  const [cur, setCur] = useState(null);      // current screen id (flow)
  const [hist, setHist] = useState([]);      // back stack
  const [navDir, setNavDir] = useState("fade"); // transition direction: fwd | back | fade
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState(null);

  const isFlow = spec && Array.isArray(spec.screens);
  const screens = isFlow ? spec.screens : null;
  const curScreen = isFlow ? (screens.find(s => s.id === cur) || screens[0]) : spec;
  const go = (id) => { if (!isFlow) return; if (!screens.some(s => s.id === id)) return; setNavDir("fwd"); setHist(h => [...h, curScreen.id]); setCur(id); };
  const back = () => setHist(h => { if (!h.length) return h; const p = h[h.length - 1]; setNavDir("back"); setCur(p); return h.slice(0, -1); });
  const jump = (id) => { setNavDir("fade"); setCur(id); setHist([]); };
  function adopt(s) {
    if (s && Array.isArray(s.screens) && s.screens.length) { setSpec(s); setCur(s.start && s.screens.some(x => x.id === s.start) ? s.start : s.screens[0].id); setHist([]); }
    else { setSpec(s); setCur(null); setHist([]); }
  }
  const suggestions = mode === "web" ? (flowOn ? [
    "A clickable admin dashboard: overview, bookings and reports pages",
    "A website flow: home, services and contact pages",
    "An admin dashboard with bookings stats, a revenue chart and recent bookings table",
    "A landing page with hero, services grid and a contact form",
  ] : [
    "An admin dashboard with bookings stats, a revenue chart and recent bookings table",
    "A landing page with hero, services grid and a contact form",
    "An operations dashboard for professionals performance",
    "A services website page with pricing cards and footer",
  ]) : [
    "A full home-cleaning booking flow from home to confirmation",
    "A salon journey: services list, booking and checkout",
    "A home screen with a banner, services grid and bottom nav",
    "A checkout summary with booking details, price and payment",
  ];

  async function callAIOnce(system, user, maxTokens, image) {
    const userText = user + "\n\nCRITICAL: Your ENTIRE reply must be the JSON object only. Start with { as the very first character. No preamble, no explanation, no markdown fences.";
    const content = image && image.data
      ? [{ type: "image", source: { type: "base64", media_type: image.mime || "image/png", data: image.data } }, { type: "text", text: userText }]
      : userText;
    const body = JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens || 2200, system, messages: [{ role: "user", content }] });
    if (typeof location !== "undefined" && location.protocol === "file:") throw new Error("FILE");
    const ctrl = new AbortController();
    let timer = setTimeout(() => ctrl.abort(), 30000); // 30s to first byte
    const bump = (ms) => { clearTimeout(timer); timer = setTimeout(() => ctrl.abort(), ms); };
    let res;
    try { res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal }); }
    catch (e) { clearTimeout(timer); throw new Error(e && e.name === "AbortError" ? "TIMEOUT" : "NETWORK"); }
    if (!res.ok) {
      clearTimeout(timer);
      let msg = "HTTP " + res.status;
      const t = await res.json().catch(() => null);
      if (t && t.error) msg = t.error.message;
      if (res.status === 404) msg = "MISSING_FN";
      if (res.status === 504) msg = "TIMEOUT";
      throw new Error(msg);
    }
    const ct = (res.headers && res.headers.get && res.headers.get("content-type")) || "";
    const repair = (t) => { // close truncated JSON: balance braces/brackets outside strings
      let out = "", inStr = false, esc = false; const stack = [];
      for (const ch of t) {
        out += ch;
        if (esc) { esc = false; continue; }
        if (ch === "\\") { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === "{") stack.push("}"); else if (ch === "[") stack.push("]");
        else if (ch === "}" || ch === "]") stack.pop();
      }
      if (inStr) out += '"';
      out = out.replace(/,\s*$/, "");
      while (stack.length) out += stack.pop();
      return out;
    };
    const tryJson = (x) => { try { return JSON.parse(x); } catch (e) { return undefined; } };
    const parseOut = (raw) => {
      raw = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
      const cands = [raw, "{" + raw];
      // pass 1: direct parse of the outermost {...} in each candidate
      for (const t of cands) {
        const a = t.indexOf("{"); if (a === -1) continue;
        const b = t.lastIndexOf("}");
        if (b > a) { const r = tryJson(t.slice(a, b + 1)); if (r !== undefined) return r; }
      }
      // pass 2: truncated output — repair, walking back to the last structurally-safe point
      for (const t of cands) {
        const a = t.indexOf("{"); if (a === -1) continue;
        let t2 = t.slice(a);
        for (let k = 0; k < 80 && t2.length > 1; k++) {
          const r = tryJson(repair(t2));
          if (r !== undefined) return r;
          const cut = Math.max(t2.lastIndexOf(","), t2.lastIndexOf("{"), t2.lastIndexOf("["), t2.lastIndexOf(":"));
          if (cut <= 0) break;
          t2 = t2.slice(0, cut);
        }
      }
      throw new Error("BAD_JSON");
    };
    // STREAMING PATH (SSE) — bytes arrive continuously; reset idle timeout on every chunk
    if (ct.includes("event-stream") && res.body && res.body.getReader) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", text = "", errMsg = null;
      try {
        while (true) {
          bump(45000); // 45s of stream silence = abort
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n\n")) !== -1) {
            const evt = buf.slice(0, i); buf = buf.slice(i + 2);
            for (const line of evt.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const d = line.slice(5).trim();
              if (!d || d === "[DONE]") continue;
              let j = null; try { j = JSON.parse(d); } catch (x) { continue; }
              if (j.type === "content_block_delta" && j.delta && typeof j.delta.text === "string") text += j.delta.text;
              else if (j.type === "error" && j.error) errMsg = j.error.message || "stream error";
            }
          }
        }
      } catch (e) { clearTimeout(timer); throw new Error(e && e.name === "AbortError" ? "TIMEOUT" : "NETWORK"); }
      clearTimeout(timer);
      if (errMsg) throw new Error(errMsg);
      if (!text.trim()) throw new Error("EMPTY");
      return parseOut(text);
    }
    // FALLBACK: plain JSON (non-streaming function / tests)
    bump(120000);
    const data = await res.json().finally(() => clearTimeout(timer));
    if (data.error) throw new Error(data.error.message);
    const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return parseOut(raw);
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  // Auto-retry: bad/empty JSON retries immediately; rate limits wait and retry automatically
  async function callAI(system, user, maxTokens, image) {
    for (let attempt = 0; ; attempt++) {
      try { return await callAIOnce(system, user, maxTokens, image); }
      catch (e) {
        const m = String((e && e.message) || "");
        if (/rate limit/i.test(m) && attempt < 2) {
          setErr("\u23F3 Anthropic rate limit reached \u2014 waiting 35s and retrying automatically\u2026");
          await sleep(35000); setErr(null); continue;
        }
        if ((m === "BAD_JSON" || m === "EMPTY") && attempt < 1) continue;
        if (/rate limit/i.test(m)) throw new Error("RATE_LIMIT");
        throw e;
      }
    }
  }
  function showErr(e) {
    const m = String((e && e.message) || "");
    const map = {
      EMPTY: "The model returned an empty response — try again.",
      RATE_LIMIT: "Your Anthropic plan\u2019s rate limit (10k input tokens/min) is exhausted — wait ~1 minute and try again. Tip: adding credits in console.anthropic.com raises the limit tier.",
      BAD_JSON: "The model reply wasn\u2019t valid JSON this time — just press Generate again.",
      FILE: "The generator needs the deployed Netlify site (or local server) — it can't run from a double-clicked file.",
      NETWORK: "Couldn't reach /api/generate. You must be on the deployed Netlify site (with Functions), not a static host.",
      MISSING_FN: "The /api/generate function isn't deployed. Deploy from Git so netlify/functions/generate.js ships.",
      TIMEOUT: "The generation took too long (gateway timeout). Make sure the LATEST site version is deployed (it streams responses to avoid this), then try again.",
    };
    setErr(map[m] || ("Failed: " + m));
  }

  function webCatalogText() {
    const lines = ["COMPONENTS are defined in the RULES. Use DS look & feel: Poppins, brand #00C3FF, warm neutrals."];
    if (groups) {
      const { svc, ava } = photoLists(groups);
      if (svc.length) lines.push("SERVICE PHOTO ids — use for hero/card images: " + svc.slice(0, 20).join(", "));
      if (ava.length) lines.push("AVATAR ids — ONLY for people/testimonials, never heroes or service cards: " + ava.slice(0, 6).join(", "));
    }
    return lines.join("\n");
  }

  function onPickImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-picking same file
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Image is larger than 5MB — please use a smaller screenshot."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      const comma = res.indexOf(",");
      const data = comma >= 0 ? res.slice(comma + 1) : res;
      const mime = /^data:([^;]+);/.exec(res);
      setImg({ data, mime: mime ? mime[1] : (file.type || "image/png"), name: file.name || "image", preview: res });
    };
    reader.onerror = () => setErr("Couldn't read that image — try another file.");
    reader.readAsDataURL(file);
  }
  async function run(text) {
    text = (text || "").trim();
    const img = imgRef.current;
    if (!text && !img) return;
    setLoading(true); setErr(null); setSpec(null); setCur(null); setHist([]);
    const web = mode === "web";
    const flow = flowOn;
    try {
      if (!img && flow && web) { await runWebFlow(text); }
      else if (!img && flow) { await runFlow(text); }
      else {
        // Single screen (image uploads always take this path — one screen from the screenshot)
        const imgInstr = img
          ? (text
              ? `\n\nAN IMAGE IS ATTACHED. Use it as the visual reference. ${text}`
              : `\n\nAN IMAGE IS ATTACHED (a screenshot/design). REBUILD its layout as faithfully as possible using the CATALOG components — match the same sections, order, text, and structure you see, but rendered with Justlife DS components. For any part with no matching component, build it with "Custom" using DS tokens. Reproduce the visible text/labels/numbers from the image.`)
          : "";
        const system = web
          ? `You generate Justlife WEB pages (desktop, wide layout) — dashboards and marketing/website pages — using the Justlife design system look (Poppins, brand colors). Fill props with realistic, specific content.\n${WEB_RULES}`
          : `You generate Justlife mobile app screens (375px) by composing live DS components from the CATALOG. Fill props with realistic, specific content — these render live, so detail matters.\n${SCREEN_RULES}`;
        const user = web
          ? `${webCatalogText()}\n\nUSER REQUEST: "${text || "(rebuild the attached image)"}"${imgInstr}\n\nReturn ONLY the JSON.`
          : `CATALOG:\n${catalogText(groups, catalog)}\n\nUSER REQUEST: "${text || "(rebuild the attached image)"}"${imgInstr}\n\nReturn ONLY the screen JSON.`;
        const s = await callAI(system, user, 2600, img); s.platform = web ? "web" : "app"; adopt(s);
      }
    } catch (e) { showErr(e); } finally { setLoading(false); }
  }

  // FLOW = one small PLAN request + one small request PER SCREEN, in parallel.
  // Every request stays the size of a single-screen generation, so no gateway timeout is possible.
  async function runFlow(text) {
    // 1) Plan the journey (fast, ~few hundred tokens)
    const planSys = `You PLAN a Justlife mobile app flow (a clickable multi-screen journey). Output STRICT JSON ONLY:
{"title":string,"start":<id>,"screens":[{"id":kebab-case,"title":short,"goal":one sentence of what's on it,"links":[{"component":<catalog name>,"to":<screen id>}]}]}
Rules: 3-5 screens forming ONE journey. Every screen reachable from start via links.
JUSTLIFE FUNNEL STRUCTURE (match the native app QA exactly) — one concern per screen, composed as:
 "frequency": App Header + "Frequency Option" (3-4 options, savings notes, desc on selected) + "Justlife Promise" + Navbar/App
 "details": App Header + "Selectable Item / Number Box" (hours) + "Selectable Item / Number Box" (professionals) + "Selectable Item / Pill" (materials Yes/No, poweredBy) + "Special Instructions" + Navbar/App
 "addons": App Header + "Add-ons Card" {layout:"grid", 4-6 items, first item selected:true with qty} + "Disclaimer" {message:"The duration of the session may change based on your selection.", type:"neutral", button:"Details"} + Navbar/App
 "date-time": App Header + "Frequency Summary" + "Professional Chooser" + "Selectable Item / Date" {label} + "Selectable Item / Time Slot with Tag" {label} + "Disclaimer" + Navbar/App
 "checkout": App Header + "BNPL" (Tabby) + "Payment Method" (selected, with Details disclaimer) + "Voucher Wallet" + "Price Details — Variants" (named discount rows) + Navbar/App (button "Complete")
 "confirmation": "Confirmation Hero" + "Assigned Professional" + "Kind Banner" + "Booking Details Full" + "Price Details — Variants" (with "Show Receipt")
NEVER combine frequency + date/time + add-ons on one screen. Pick the 3-5 most relevant steps for the request. Links use ONLY component names from the list. Typical links: "Homepage Section"->services, "Service Card"->booking, "Navbar / App"->next step, final screen may have "Button"->home. NEVER link "App Header". ids: home, services, booking, checkout, confirmation.`;
    const names = 'COMPONENT NAMES: Input/SearchMobile, Hero Banner, Homepage Section, Service Card, Product Card, Combo Selection, Selectable Item, Selectable Item / Date, Selectable Item / Time Slot with Tag, Selectable Item / Number Box, Disclaimer, Booking Status, Info Card, Plan Booking Card, Cashback Card, Rating Summary, Tag, Add-ons Card, Frequency Option, Subscription Schedule, Quantity Stepper, Special Instructions, Booking Details — Variants, Price Details — Variants, Payment Method, Button, App Header, Navbar / App, Navigation Bar';
    const plan = await callAI(planSys, `${names}\n\nUSER REQUEST: "${text}"\n\nReturn ONLY the JSON.`, 1400);
    const screens = (plan.screens || []).slice(0, 5).map(sc => ({ id: String(sc.id || "").trim() || "screen", title: sc.title || sc.id, nodes: [], pending: true }));
    if (!screens.length) throw new Error("EMPTY");
    const ids = screens.map(s => s.id);
    adopt({ title: plan.title || "Flow", platform: "app", start: plan.start, screens });

    // 2) Generate screens SEQUENTIALLY with a compact catalog — stays inside low rate-limit tiers (10k input tokens/min)
    let failed = 0;
    for (const sc of (plan.screens || []).slice(0, 5)) {
      const sys = `You generate ONE Justlife mobile app screen (375px) that is part of the flow "${plan.title}" by composing live DS components from the CATALOG. Fill props with realistic, specific content.\n${SCREEN_RULES}\nFLOW LINKS for THIS screen — add a top-level "link" field on exactly these components: ${JSON.stringify(sc.links || [])}. Valid screen ids: ${ids.join(", ")}. NEVER link "App Header" (tapping it goes back automatically). Output STRICT JSON ONLY: {"title":string,"nodes":[{"component":...,"props":{...},"link":<id optional>}]}.`;
      const user = `CATALOG:\n${catalogText(groups, catalog, true)}\n\nSCREEN TO BUILD: id "${sc.id}" — "${sc.title}". Goal: ${sc.goal || sc.title}\n\nReturn ONLY the screen JSON.`;
      try {
        const scr = await callAI(sys, user, 2200);
        setSpec(prev => {
          if (!prev || !Array.isArray(prev.screens)) return prev;
          return { ...prev, screens: prev.screens.map(s0 => s0.id === sc.id ? { ...s0, title: scr.title || s0.title, nodes: scr.nodes || [], pending: false } : s0) };
        });
      } catch (e) {
        failed++;
        setSpec(prev => prev && Array.isArray(prev.screens) ? { ...prev, screens: prev.screens.map(s0 => s0.id === sc.id ? { ...s0, pending: false } : s0) } : prev);
        if (String(e && e.message) === "RATE_LIMIT") { showErr(e); break; }
      }
    }
    setSpec(prev => prev && Array.isArray(prev.screens) ? { ...prev, screens: prev.screens.map(s0 => s0.pending ? { ...s0, pending: false, nodes: s0.nodes || [] } : s0) } : prev);
    if (failed) setErr(`${failed} screen(s) didn't generate — press Generate to retry.`);
  }

  // WEB FLOW = plan (pages + shared nav) + one small request per page, sequential.
  async function runWebFlow(text) {
    const planSys = `You PLAN a Justlife WEB flow (a clickable multi-page web experience). Output STRICT JSON ONLY:
{"title":string,"kind":"dashboard"|"website","start":<id>,"nav":[{"label":string,"to":<page id>}],"screens":[{"id":kebab-case,"title":short,"goal":one sentence}]}
Rules: 2-4 pages sharing ONE nav (every nav entry maps to a page id). kind "dashboard" = admin/analytics (nav renders as a left Sidebar); kind "website" = marketing site (nav renders as header links). ids kebab-case.`;
    const plan = await callAI(planSys, `USER REQUEST: "${text}"\n\nReturn ONLY the JSON.`, 900);
    const screens = (plan.screens || []).slice(0, 4).map(sc => ({ id: String(sc.id || "").trim() || "page", title: sc.title || sc.id, nodes: [], pending: true }));
    if (!screens.length) throw new Error("EMPTY");
    const ids = screens.map(x => x.id);
    adopt({ title: plan.title || "Web Flow", platform: "web", start: plan.start, screens });
    const dash = String(plan.kind || "dashboard") === "dashboard";
    let failed = 0;
    for (const sc of (plan.screens || []).slice(0, 4)) {
      const navRule = dash
        ? `Include "Sidebar" FIRST with items EXACTLY ${JSON.stringify(plan.nav || [])} (the item whose to="${sc.id}" is this page). Do NOT use "Web Header", "Web Hero" or "Footer".`
        : `Include "Web Header" FIRST with links EXACTLY ${JSON.stringify(plan.nav || [])}. Do NOT use "Sidebar".`;
      const sys = `You generate ONE Justlife WEB page (desktop, wide) that is part of the ${dash ? "dashboard" : "website"} flow "${plan.title}", using the Justlife DS look (Poppins, brand colors). Fill props with realistic content.\n${WEB_RULES}\nFLOW NAV: ${navRule} Valid page ids: ${ids.join(", ")}. Cards/heroes may add top-level "link":<page id>. Output STRICT JSON ONLY {"title":string,"nodes":[{"component":...,"props":{...},"link"?}]}.`;
      const user = `${webCatalogText()}\n\nPAGE TO BUILD: id "${sc.id}" — "${sc.title}". Goal: ${sc.goal || sc.title}\n\nReturn ONLY the page JSON.`;
      try {
        const scr = await callAI(sys, user, 2200);
        setSpec(prev => {
          if (!prev || !Array.isArray(prev.screens)) return prev;
          return { ...prev, screens: prev.screens.map(s0 => s0.id === sc.id ? { ...s0, title: scr.title || s0.title, nodes: scr.nodes || [], pending: false } : s0) };
        });
      } catch (e) {
        failed++;
        setSpec(prev => prev && Array.isArray(prev.screens) ? { ...prev, screens: prev.screens.map(s0 => s0.id === sc.id ? { ...s0, pending: false } : s0) } : prev);
        if (String(e && e.message) === "RATE_LIMIT") { showErr(e); break; }
      }
    }
    setSpec(prev => prev && Array.isArray(prev.screens) ? { ...prev, screens: prev.screens.map(s0 => s0.pending ? { ...s0, pending: false, nodes: s0.nodes || [] } : s0) } : prev);
    if (failed) setErr(`${failed} page(s) didn't generate — press Generate to retry.`);
  }

  async function refine() { return refineWith(editText.trim()); }
  async function refineWith(instrArg) {
    const instr = (instrArg || "").trim(); if (!instr || !spec || loading || editing) return;
    setEditing(true); setErr(null);
    const web = (spec && spec.platform === "web") || mode === "web";
    const fl = isFlow;
    try {
      if (fl) {
        // Edit ONLY the current screen/page — keeps the request small (no gateway timeout)
        const ids = screens.map(x => x.id).join(", ");
        const rules = web ? WEB_RULES : SCREEN_RULES;
        const sys = `You EDIT one ${web ? "page" : "screen"} of the Justlife flow "${spec.title}". Apply the requested change and return the FULL updated ${web ? "page" : "screen"} in the same shape {"title":string,"nodes":[{"component","props","link"?}]}. Preserve everything the change doesn't mention. If the user asks to add something, APPEND a new node; if they ask to change text/props, edit those props; if they ask to remove, drop that node. Valid link ids: ${ids}.${web ? "" : ' NEVER link "App Header".'}\n${rules}`;
        const user = `${web ? webCatalogText() : "CATALOG:\n" + catalogText(groups, catalog, true)}\n\nCURRENT ${web ? "PAGE" : "SCREEN"} (id "${curScreen.id}"):\n${JSON.stringify({ title: curScreen.title, nodes: curScreen.nodes })}\n\nCHANGE REQUESTED: "${instr}"\n\nReturn ONLY the full updated JSON.`;
        const scr = await callAI(sys, user, 2200);
        setSpec(prev => prev && Array.isArray(prev.screens) ? { ...prev, _rev: (prev._rev || 0) + 1, screens: prev.screens.map(s0 => s0.id === curScreen.id ? { ...s0, title: scr.title || s0.title, nodes: scr.nodes || s0.nodes } : s0) } : prev);
      } else {
        const rules = web ? WEB_RULES : SCREEN_RULES;
        const shape = web ? '{"title","platform":"web","nodes":[{component,props}]}' : '{"title","nodes":[{component,props}]}';
        const system = `You EDIT an existing Justlife ${web ? "web page" : "screen"}. Apply the requested change and return the FULL updated JSON in the same shape ${shape}. Preserve everything the change doesn't mention. If the user asks to add something, APPEND a new node; to change text/props, edit those props; to remove, drop that node. Same component/prop/price rules apply.\n${rules}`;
        const user = `${web ? webCatalogText() : "CATALOG:\n" + catalogText(groups, catalog, true)}\n\nCURRENT JSON:\n${JSON.stringify(spec)}\n\nCHANGE REQUESTED: "${instr}"\n\nReturn ONLY the full updated JSON.`;
        const s2 = await callAI(system, user, 2200); s2.platform = web ? "web" : "app"; s2._rev = ((spec && spec._rev) || 0) + 1; adopt(s2);
      }
      setEditText("");
    } catch (e) { showErr(e); } finally { setEditing(false); }
  }
  // Contextual edit suggestions (like chat quick-replies) — depend on platform + current screen
  const editIdeas = (() => {
    if (mode === "web") return ["Add a stats row", "Change the primary color accent", "Add a footer", "Make the hero headline punchier"];
    const id = (curScreen && curScreen.id) || "";
    if (/freq/.test(id)) return ["Add a yearly plan option", "Make weekly the selected one", "Change discounts to AED amounts", "Add a promo banner"];
    if (/addon/.test(id)) return ["Add 2 more add-ons", "Select the first add-on", "Show original prices struck-through", "Change title to 'Enhance your clean'"];
    if (/date|time/.test(id)) return ["Add more time slots", "Mark a slot as Off-peak", "Add a fourth professional", "Change dates to next week"];
    if (/checkout|pay/.test(id)) return ["Add a promo code discount row", "Switch payment to Visa", "Add a VAT line", "Change button to 'Pay now'"];
    return ["Add a discount banner", "Change the header title", "Add a service card", "Make the CTA say 'Book now'"];
  })();


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
          <button className={flowOn ? "s-btn-dark" : "s-btn-ghost"} onClick={() => setFlowOn(f => !f)} title="Generate a clickable multi-screen journey"
            style={{ fontSize: 12.5, padding: "8px 16px", marginLeft: "auto" }}>🔗 Flow {flowOn ? "ON" : "OFF"}</button>
        </div>
        <textarea className="s-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "web" ? "e.g. An admin dashboard with bookings stats, revenue chart and a recent bookings table" : "e.g. A checkout summary with booking details, price breakdown and payment method"}
          style={{ width: "100%", minHeight: 100, padding: 14, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
          {suggestions.map((s, i) => <button key={i} className="s-chip" onClick={() => { setPrompt(s); run(s); }}>{s}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <label className="s-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, padding: "8px 14px" }}>
            <Image size={15} /> Upload image
            <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onPickImage} />
          </label>
          {img && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--s-chip-bg, #ffffff10)", border: "1px solid var(--s-line, #ffffff22)", borderRadius: 10, padding: "5px 8px 5px 5px" }}>
              <img src={img.preview} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 6 }} />
              <span style={{ fontSize: 11, color: "var(--s-ink)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</span>
              <button onClick={() => setImg(null)} title="Remove image" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--s-faint)", display: "flex", padding: 2 }}><X size={14} /></button>
            </span>
          )}
          {img && <span style={{ fontSize: 11, color: "var(--s-faint)" }}>Leave the prompt empty to rebuild the screenshot as-is with DS components.</span>}
        </div>
        <button className="s-btn-primary" onClick={() => run(prompt)} disabled={loading || editing}>
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}{loading ? "Working…" : (img && !prompt.trim() ? "Rebuild from image" : "Generate")}
        </button>

        {spec && (
          <div className="s-card" style={{ marginTop: 18, padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--s-ink)", marginBottom: 10 }}>✎ Edit this design <span style={{ fontWeight: 400, color: "var(--s-faint)" }}>— tweak it instead of starting over</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="s-input" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") refine(); }}
                placeholder={isFlow ? `e.g. add a Disclaimer — edits apply to the screen you\u2019re viewing (${curScreen ? curScreen.title || curScreen.id : ""})` : "e.g. change the banner title to 'Eid Offers', add a service card"}
                style={{ flex: "1 1 240px", padding: "10px 13px", fontSize: 13 }} />
              <button className="s-btn-ghost" onClick={refine} disabled={loading || editing} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{editing ? <Loader2 size={14} className="spin" /> : null}{editing ? "Applying…" : "Apply edit"}</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {editIdeas.map((idea, i) => (
                <button key={i} className="s-chip" disabled={editing} onClick={() => refineWith(idea)} style={{ fontSize: 11, padding: "5px 11px", opacity: editing ? .5 : 1 }}>+ {idea}</button>
              ))}
            </div>
            <button className="s-btn-dark" onClick={() => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(spec, null, 2))} style={{ marginTop: 12 }}><Copy size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Export spec (JSON)</button>
          </div>
        )}
        {err && <div style={{ marginTop: 14, color: C.danger, fontSize: 13, maxWidth: 560 }}>{err}</div>}
      </div>
      {(mode === "web" || (spec && spec.platform === "web"))
        ? <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 640px", minWidth: 340 }}>
            {isFlow && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {screens.map(sc => (
                  <button key={sc.id} className={curScreen && curScreen.id === sc.id ? "s-btn-dark" : "s-chip"} onClick={() => jump(sc.id)} style={{ fontSize: 11, padding: "5px 12px" }}>{sc.title || sc.id}</button>
                ))}
              </div>
            )}
            <BrowserFrame>{(loading && !isFlow) || (curScreen && curScreen.pending) ? <WebSkeleton /> : <div key={(curScreen ? curScreen.id : "single") + ":" + ((spec && spec._rev) || 0)} className={navDir === "fwd" ? "jl-in-fwd" : navDir === "back" ? "jl-in-back" : "jl-in-fade"} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}><WebScreen spec={spec && spec.platform === "web" ? curScreen : null} go={go} curId={curScreen && curScreen.id} /></div>}</BrowserFrame>
            {isFlow && <div style={{ fontSize: 11.5, color: "var(--s-faint)" }}>▶ Click sidebar / header links and linked cards to navigate</div>}
          </div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", flex: "0 0 auto" }}>
            {isFlow && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 380 }}>
                {screens.map(sc => (
                  <button key={sc.id} className={curScreen && curScreen.id === sc.id ? "s-btn-dark" : "s-chip"} onClick={() => jump(sc.id)} style={{ fontSize: 11, padding: "5px 12px" }}>{sc.title || sc.id}</button>
                ))}
              </div>
            )}
            <PhoneFrame>{(loading && !isFlow) || (curScreen && curScreen.pending) ? <SkeletonScreen /> : <div key={(curScreen ? curScreen.id : "single") + ":" + ((spec && spec._rev) || 0)} className={navDir === "fwd" ? "jl-in-fwd" : navDir === "back" ? "jl-in-back" : "jl-in-fade"} style={{ height: "100%" }}><Screen spec={spec && spec.platform !== "web" ? curScreen : null} go={go} back={back} canBack={hist.length > 0} /></div>}</PhoneFrame>
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
      ADDON_IDS = (j.groups.photos || []).map(a => a.id).filter(id => /^addon-/i.test(id));
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
      ADDON_IDS = (j.groups.photos || []).map(a => a.id).filter(id => /^addon-/i.test(id));
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
