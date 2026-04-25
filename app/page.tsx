"use client";

import { useState, useEffect, useRef } from "react";

interface PlanetPosition {
  sign: string;
  degree: number | null;
}

interface NatalChart {
  sun: PlanetPosition;
  moon: PlanetPosition;
  rising: PlanetPosition;
  mc: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  uranus: PlanetPosition;
  neptune: PlanetPosition;
  pluto: PlanetPosition;
  chiron: PlanetPosition;
  trueNode: PlanetPosition;
  spheres: string[];
}

interface LocationSuggestion {
  formatted: string;
  lat: number;
  lng: number;
}

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈︎", Taurus: "♉︎", Gemini: "♊︎", Cancer: "♋︎",
  Leo: "♌︎", Virgo: "♍︎", Libra: "♎︎", Scorpio: "♏︎",
  Sagittarius: "♐︎", Capricorn: "♑︎", Aquarius: "♒︎", Pisces: "♓︎",
};

export default function Home() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [hourVal, setHourVal] = useState("12");
  const [minuteVal, setMinuteVal] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(location)}`
        );
        const data = await res.json();
        setLocationSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {
        setLocationSuggestions([]);
      }
    }, 300);
  }, [location]);

  function selectLocation(suggestion: LocationSuggestion) {
    setLocation(suggestion.formatted);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  }

  function convertTo24Hour(hour: string, minute: string, period: string): { hour: number; minute: number } {
    let h = parseInt(hour);
    const m = parseInt(minute);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return { hour: h, minute: m };
  }

  async function handleSubmit() {
    if (!name || !date || !selectedLocation) {
      setError("Please fill in all fields and select a location from the list.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const [year, month, day] = date.split("-").map(Number);
      const { hour, minute } = unknownTime
        ? { hour: null, minute: null }
        : convertTo24Hour(hourVal, minuteVal, ampm);

      const res = await fetch("/api/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year, month, day, hour, minute,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError("Something went wrong. Please check your details and try again.");
      } else {
        setChart(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 0",
    border: "none",
    borderBottom: "0.5px solid #D0CCC4",
    background: "transparent",
    fontSize: "15px",
    color: "#1A1A18",
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#A8A49C",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
  };

  const selectStyle = {
    padding: "12px 8px 12px 0",
    border: "none",
    borderBottom: "0.5px solid #D0CCC4",
    background: "transparent",
    fontSize: "15px",
    color: "#1A1A18",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  if (chart) {
    return (
      <main style={{
        minHeight: "100vh",
        backgroundColor: "#F7F5F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <svg viewBox="0 0 28 28" fill="none" width="26" height="26">
              <circle cx="14" cy="14" r="3.5" fill="#1C3D2E"/>
              <circle cx="14" cy="14" r="9" stroke="#1C3D2E" strokeWidth="0.7" fill="none"/>
              <circle cx="14" cy="5" r="1.6" fill="#C9A84C"/>
              <circle cx="23" cy="14" r="0.9" fill="#1C3D2E" opacity="0.3"/>
            </svg>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "22px", color: "#1A1A18", letterSpacing: "-0.01em" }}>Orbit</span>
          </div>

          <p style={{ fontSize: "11px", fontWeight: 500, color: "#A8A49C", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Welcome, {name}
          </p>
          <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: "36px", fontWeight: 400, color: "#1A1A18", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "40px" }}>
            Your natal chart
          </h1>

          <div style={{ display: "flex", gap: "40px", marginBottom: "32px" }}>
            <div>
              <p style={labelStyle}><span style={{ fontSize: "13px" }}>☉</span>{" "}Sun</p>
              <p style={{ fontFamily: "DM Serif Display, serif", fontSize: "22px", color: "#1A1A18" }}>{chart.sun.sign}<span style={{ color: "#A8A49C", fontSize: "22px" }}>{SIGN_GLYPHS[chart.sun.sign]}</span></p>
            </div>
            <div>
              <p style={labelStyle}><span style={{ fontSize: "13px" }}>☽</span>{" "}Moon</p>
              <p style={{ fontFamily: "DM Serif Display, serif", fontSize: "22px", color: "#1A1A18" }}>{chart.moon.sign}<span style={{ color: "#A8A49C", fontSize: "22px" }}>{SIGN_GLYPHS[chart.moon.sign]}</span></p>
            </div>
            {chart.rising && (
              <div>
                <p style={labelStyle}><span style={{ fontSize: "13px" }}>↑</span>{" "}Rising</p>
                <p style={{ fontFamily: "DM Serif Display, serif", fontSize: "22px", color: "#1A1A18" }}>{chart.rising.sign}<span style={{ color: "#A8A49C", fontSize: "22px" }}>{SIGN_GLYPHS[chart.rising.sign]}</span></p>
              </div>
            )}
          </div>

          <div style={{ borderTop: "0.5px solid #D0CCC4", paddingTop: "24px", marginBottom: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                ...(chart.rising ? [{ id: "AC", label: "", glyph: "↑", value: chart.rising.sign }] : []),
                ...(chart.mc ? [{ id: "MC", label: "MC", glyph: "", value: chart.mc.sign }] : []),
                { id: "Mercury", label: "Mercury", glyph: "☿", value: chart.mercury.sign },
                { id: "Venus", label: "Venus", glyph: "♀︎", value: chart.venus.sign },
                { id: "Mars", label: "Mars", glyph: "♂︎", value: chart.mars.sign },
                { id: "Jupiter", label: "Jupiter", glyph: "♃", value: chart.jupiter.sign },
                { id: "Saturn", label: "Saturn", glyph: "♄", value: chart.saturn.sign },
                { id: "Uranus", label: "Uranus", glyph: "♅", value: chart.uranus.sign },
                { id: "Neptune", label: "Neptune", glyph: "♆", value: chart.neptune.sign },
                { id: "Pluto", label: "Pluto", glyph: "♇", value: chart.pluto.sign },
                { id: "Chiron", label: "Chiron", glyph: "⚷", value: chart.chiron.sign },
                { id: "True Node", label: "True Node", glyph: "☊", value: chart.trueNode.sign },
              ].map((planet) => (
                <div key={planet.id}>
                  <p style={labelStyle}>
                    {planet.glyph && <span>{planet.glyph}</span>}
                    {planet.glyph && planet.label && " "}
                    {planet.label}
                  </p>
                  <p style={{ fontSize: "15px", color: "#1A1A18" }}>{planet.value}{SIGN_GLYPHS[planet.value] && <span style={{ color: "#A8A49C", fontSize: "15px" }}>{SIGN_GLYPHS[planet.value]}</span>}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid #D0CCC4", paddingTop: "24px", marginBottom: "32px" }}>
            <p style={{ ...labelStyle, marginBottom: "16px" }}>Your spheres</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {chart.spheres.map((sphere) => (
                <p key={sphere} style={{
                  fontSize: "14px",
                  color: "#1C3D2E",
                  borderBottom: "0.5px solid #1C3D2E",
                  display: "inline-block",
                  paddingBottom: "1px",
                  width: "fit-content",
                }}>
                  {sphere}
                </p>
              ))}
            </div>
            {!chart.rising && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#A8A49C", marginTop: "16px" }}>
                Birth time unknown — Rising and MC not calculated. You can add your birth time later.
              </p>
            )}
          </div>

          <button
            onClick={() => setChart(null)}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#1C3D2E",
              color: "#F7F5F0",
              border: "none",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}>
            Enter Orbit
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#F7F5F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "480px", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
          <svg viewBox="0 0 28 28" fill="none" width="26" height="26">
            <circle cx="14" cy="14" r="3.5" fill="#1C3D2E"/>
            <circle cx="14" cy="14" r="9" stroke="#1C3D2E" strokeWidth="0.7" fill="none"/>
            <circle cx="14" cy="5" r="1.6" fill="#C9A84C"/>
            <circle cx="23" cy="14" r="0.9" fill="#1C3D2E" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "22px", color: "#1A1A18", letterSpacing: "-0.01em" }}>Orbit</span>
        </div>

        <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: "36px", fontWeight: 400, color: "#1A1A18", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "16px" }}>
          Where are you<br />in the sky?
        </h1>

        <p style={{ fontSize: "15px", color: "#6B6860", lineHeight: 1.7, marginBottom: "40px", maxWidth: "360px" }}>
          Enter your birth details and we'll calculate your natal chart,
          placing you in the spheres that are yours.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>

          <div>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Date of birth</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Time of birth</label>
            {!unknownTime && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center", borderBottom: "0.5px solid #D0CCC4", paddingBottom: "12px" }}>
                <select value={hourVal} onChange={e => setHourVal(e.target.value)} style={{ ...selectStyle, width: "70px" }}>
                  {hours.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span style={{ color: "#A8A49C", fontSize: "15px" }}>:</span>
                <select value={minuteVal} onChange={e => setMinuteVal(e.target.value)} style={{ ...selectStyle, width: "70px" }}>
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={ampm} onChange={e => setAmpm(e.target.value)} style={{ ...selectStyle, width: "60px" }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={unknownTime}
                onChange={e => setUnknownTime(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6B6860" }}>
                I don&apos;t know my birth time
              </span>
            </label>
          </div>

          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Place of birth</label>
            <input
              type="text"
              placeholder="Start typing a city..."
              value={location}
              onChange={e => {
                setLocation(e.target.value);
                setSelectedLocation(null);
              }}
              style={inputStyle}
              autoComplete="off"
            />
            {showSuggestions && locationSuggestions.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#FFFFFF",
                border: "0.5px solid #D0CCC4",
                borderTop: "none",
                zIndex: 10,
              }}>
                {locationSuggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => selectLocation(s)}
                    style={{
                      padding: "12px 14px",
                      fontSize: "14px",
                      color: "#1A1A18",
                      cursor: "pointer",
                      borderBottom: i < locationSuggestions.length - 1 ? "0.5px solid #F0EDE8" : "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F7F5F0")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    {s.formatted}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "#8A3A2A", marginBottom: "16px" }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: loading ? "#A8A49C" : "#1C3D2E",
            color: "#F7F5F0",
            border: "none",
            borderRadius: "2px",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
          }}>
          {loading ? "Calculating..." : "Calculate my chart"}
        </button>

        <p style={{ fontSize: "12px", color: "#A8A49C", marginTop: "20px", lineHeight: 1.6 }}>
          Your birth data is private. It is used only to calculate your
          natal chart and will never be shared or sold.
        </p>
      </div>
    </main>
  );
}