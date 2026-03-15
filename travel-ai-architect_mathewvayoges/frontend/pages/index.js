import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";

const TRAVEL_STYLES = [
  "Adventure", "Foodie", "Cultural", "Relaxation", "Budget", "Luxury",
];

const TIME_CONFIG = {
  Morning:   { icon: "🌅", label: "Morning",   color: "#A78BFA" },
  Afternoon: { icon: "☀️",  label: "Afternoon", color: "#2A9D8F" },
  Evening:   { icon: "🌙", label: "Evening",   color: "#8B5CF6" },
};

// Curated couple travel photos — permanent Unsplash CDN URLs
const HERO_PHOTOS = [
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80", // Couple in Prague
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1920&q=80", // Couple on Italy coast
  "https://images.unsplash.com/photo-1530523884792-d601b9e88b2b?w=1920&q=80", // Couple watching sunset
];

// Fallback destination skyline photos from Unsplash CDN
const DESTINATION_FALLBACKS = [
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&q=80", // Night city skyline
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1600&q=80", // World map travel
  "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1600&q=80", // Golden Gate Bridge
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&q=80", // Dubai skyline night
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=80", // Luxury interior
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600&q=80", // Mountain lake fog
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80", // Aerial mountains
];

// Fetch a real image from Wikipedia for a given search query
async function fetchWikipediaImage(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=900&origin=*&gsrlimit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      const results = Object.values(pages)
        .filter((p) => p.thumbnail?.source)
        .sort((a, b) => (a.index || 0) - (b.index || 0));
      if (results.length > 0) return results[0].thumbnail.source;
    }
  } catch (_) { /* silent fallback */ }
  return null;
}

// Pick a consistent fallback photo from the curated list based on a seed string
function seedFallback(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return DESTINATION_FALLBACKS[Math.abs(hash) % DESTINATION_FALLBACKS.length];
}

export default function Home() {
  const [destination, setDestination]   = useState("");
  const [travelStyle, setTravelStyle]   = useState("Luxury");
  const [itinerary, setItinerary]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [activeDay, setActiveDay]       = useState(0);
  const [heroIdx, setHeroIdx]           = useState(0);
  const [mounted, setMounted]           = useState(false);
  const [activityImages, setActivityImages] = useState({});   // key: activity.title → image URL
  const [destHeaderImg, setDestHeaderImg]   = useState(null);
  const [loadingImg, setLoadingImg]         = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // When itinerary loads, fetch Wikipedia images for all activities + header
  const fetchAllImages = useCallback(async (data) => {
    // Destination header image
    const headerImg = await fetchWikipediaImage(`${data.destination} city`);
    setDestHeaderImg(headerImg || seedFallback(data.destination + "-header"));

    // Each activity image
    const images = {};
    for (const day of data.days) {
      for (const activity of day.activities) {
        const query = `${data.destination} ${activity.title}`;
        const img = await fetchWikipediaImage(query);
        images[activity.title] = img || seedFallback(activity.title);
      }
    }
    setActivityImages(images);
  }, []);

  useEffect(() => {
    if (itinerary) {
      setActivityImages({});
      setDestHeaderImg(null);
      fetchAllImages(itinerary);
    }
  }, [itinerary, fetchAllImages]);

  const handleGenerate = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError("");
    setItinerary(null);

    // Prefetch loading-screen image
    fetchWikipediaImage(`${destination} landmark`).then((img) => {
      setLoadingImg(img || seedFallback(destination + "-loading"));
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/generate-itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, travel_style: travelStyle }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Something went wrong.");
      }
      const data = await res.json();
      setItinerary(data);
      setActiveDay(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain min-h-screen bg-navy text-offwhite selection:bg-gold/30 selection:text-gold overflow-x-hidden">
      <Head>
        <title>Travel AI Architect | Mathew Voyages</title>
        <meta name="description" content="Luxury AI-powered travel planning" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ── NAV ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/70 backdrop-blur-xl border-b border-white/5 py-5 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-serif text-3xl tracking-tighter text-gold">MV</span>
          <span className="font-sans text-[9px] tracking-[0.25em] font-light uppercase opacity-50">Mathew Voyages</span>
        </div>
        {itinerary && !loading ? (
          /* Back to Home — visible whenever itinerary is showing */
          <button
            className="flex items-center gap-2.5 border border-white/15 hover:border-gold/50 bg-white/5 hover:bg-gold/8 text-offwhite/60 hover:text-gold rounded-full px-5 py-2.5 text-[9px] tracking-[0.3em] uppercase font-bold transition-all duration-300"
            onClick={() => { setItinerary(null); setDestination(""); setError(""); setActivityImages({}); setDestHeaderImg(null); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Back to Home
          </button>
        ) : (
          <div className="hidden md:flex gap-8 text-[9px] tracking-[0.3em] uppercase font-medium opacity-40">
            <a href="#" className="hover:text-gold hover:opacity-100 transition-all">Bespoke Tours</a>
            <a href="#" className="hover:text-gold hover:opacity-100 transition-all">Our Story</a>
            <a href="#" className="hover:text-gold hover:opacity-100 transition-all">Contact</a>
          </div>
        )}
      </nav>


      <main className="relative z-10">

        {/* ── HERO / LANDING ─────────────────────── */}
        {!itinerary && !loading && (
          <div className="relative min-h-screen flex flex-col overflow-hidden">

            {/* CSS-only background — no images */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Deep radial base */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(167,139,250,0.12) 0%, transparent 70%)" }} />
              {/* Bottom warm glow */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 110%, rgba(167,139,250,0.07) 0%, transparent 60%)" }} />
              {/* Left accent */}
              <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)" }} />
              {/* Right accent */}
              <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(100,80,200,0.08) 0%, transparent 70%)" }} />
              {/* Dot grid */}
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle, #A78BFA 1px, transparent 1px)", backgroundSize: "36px 36px" }}
              />
              {/* Horizontal rule lines */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "linear-gradient(#A78BFA 1px, transparent 1px)", backgroundSize: "100% 100px" }}
              />
              {/* Top-right decorative ring */}
              <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-gold/5" />
              <div className="absolute -top-8 -right-8 w-72 h-72 rounded-full border border-gold/5" style={{ animation: "counter-spin 30s linear infinite" }} />
            </div>

            {/* ── LEFT COLUMN — Hero content */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen max-w-7xl mx-auto px-8 gap-16 pt-28 pb-16">

              {/* Text side */}
              <div className="flex-1 max-w-2xl animate-fade-in">
                {/* Pre-headline badge */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/50 animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <span className="w-1 h-1 rounded-full bg-gold/30 animate-pulse" style={{ animationDelay: "0.6s" }} />
                  </div>
                  <span className="text-[9px] tracking-[0.5em] uppercase text-gold/70 font-semibold">
                    AI Travel Architecture · Est. 2024
                  </span>
                </div>

                {/* Main heading */}
                <h1 className="font-serif leading-[0.88] mb-8 animate-slide-up" style={{ fontSize: "clamp(3.2rem, 8vw, 7rem)" }}>
                  <span className="block text-offwhite/90">Your Dream</span>
                  <span className="block text-offwhite/90">Journey,</span>
                  <span className="block italic text-gold"
                    style={{ textShadow: "0 0 60px rgba(167,139,250,0.35)" }}>
                    Designed by AI.
                  </span>
                </h1>

                {/* Sub-copy */}
                <p className="text-offwhite/45 max-w-lg leading-relaxed mb-10 tracking-wide font-light text-base animate-fade-in-delayed">
                  Tell us where you want to go and how you like to travel. Our AI architect will craft a fully bespoke 3-day itinerary — morning, afternoon, and evening — tailored entirely to your style.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-3 mb-12 animate-fade-in-delayed" style={{ animationDelay: "0.5s" }}>
                  {[
                    { icon: "✦", text: "3-Day Itinerary" },
                    { icon: "◈", text: "9 Curated Activities" },
                    { icon: "◉", text: "AI-Personalised" },
                    { icon: "❋", text: "Instant Generation" },
                  ].map((f) => (
                    <span
                      key={f.text}
                      className="inline-flex items-center gap-2 border border-white/8 bg-white/3 rounded-full px-4 py-2 text-[9px] tracking-[0.25em] uppercase text-offwhite/50 font-medium"
                    >
                      <span className="text-gold text-[10px]">{f.icon}</span>
                      {f.text}
                    </span>
                  ))}
                </div>

                {/* Social proof strip */}
                <div className="flex items-center gap-6 border-t border-white/5 pt-8 animate-fade-in-delayed" style={{ animationDelay: "0.7s" }}>
                  {[
                    { num: "10K+", label: "trips planned" },
                    { num: "98%", label: "satisfaction" },
                    { num: "50+", label: "destinations" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="font-serif text-2xl text-gold">{s.num}</div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-offwhite/30 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form side */}
              <div className="w-full max-w-md animate-fade-in-delayed" style={{ animationDelay: "0.3s" }}>
                {/* Glow border */}
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-gold/15 via-transparent to-gold/10 animate-pulse-gold pointer-events-none" />
                <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">

                  <div className="mb-7">
                    <h2 className="font-serif text-2xl text-offwhite/90 mb-1">Plan Your Trip</h2>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-offwhite/25">Powered by Gemini AI</p>
                  </div>

                  <div className="space-y-5 mb-6">
                    {/* Destination */}
                    <div>
                      <label className="text-[9px] tracking-[0.35em] uppercase text-gold/60 mb-3 font-semibold flex items-center gap-2 block">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="2" fill="#A78BFA"/>
                          <circle cx="5" cy="5" r="4.5" stroke="#A78BFA" strokeWidth="1" opacity="0.4"/>
                        </svg>
                        Destination
                      </label>
                      <input
                        ref={inputRef}
                        className="w-full bg-navy/70 border border-white/8 rounded-xl px-5 py-4 text-offwhite font-sans text-sm outline-none transition-all placeholder:text-offwhite/20 focus:border-gold/50 focus:bg-navy focus:shadow-lg focus:shadow-gold/5"
                        type="text"
                        placeholder="Paris, Tokyo, Bali…"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      />
                    </div>

                    {/* Travel Style */}
                    <div>
                      <label className="text-[9px] tracking-[0.35em] uppercase text-gold/60 mb-3 font-semibold flex items-center gap-2 block">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 1L6.5 4H9.5L7 6L8 9L5 7.5L2 9L3 6L0.5 4H3.5L5 1Z" fill="#A78BFA" opacity="0.7"/>
                        </svg>
                        Travel Style
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-navy/70 border border-white/8 rounded-xl px-5 py-4 text-offwhite font-sans text-sm appearance-none outline-none transition-all focus:border-gold/50 cursor-pointer"
                          value={travelStyle}
                          onChange={(e) => setTravelStyle(e.target.value)}
                        >
                          {TRAVEL_STYLES.map((s) => (
                            <option key={s} className="bg-navy">{s}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/40">
                          <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="group relative w-full overflow-hidden rounded-xl py-5 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 text-white font-sans text-[10px] tracking-[0.5em] font-black uppercase transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                        <path d="M8 1L10 6H15L11 9.5L12.5 15L8 12L3.5 15L5 9.5L1 6H6L8 1Z" fill="currentColor"/>
                      </svg>
                      Design My Itinerary
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  </button>

                  {error && (
                    <div className="mt-5 p-4 rounded-xl border border-red-400/20 bg-red-500/5 text-red-300/80 text-[11px] tracking-wide flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <p className="text-center text-[8px] tracking-[0.2em] uppercase text-offwhite/15 mt-6">
                    Free · No signup required · Instant results
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ── CINEMATIC LOADING ───────────────────── */}
        {loading && (
          <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              {loadingImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={loadingImg}
                  alt="loading destination"
                  className="w-full h-full object-cover animate-ken-burns"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={HERO_PHOTOS[0]}
                  alt="loading"
                  className="w-full h-full object-cover animate-ken-burns"
                />
              )}
              <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" />
            </div>

            <div className="relative z-10 text-center px-8 max-w-xl animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-10">
                <div
                  className="absolute inset-0 rounded-full border border-gold/10"
                  style={{ borderTopColor: "#A78BFA", animation: "counter-spin 2s linear infinite" }}
                />
                <div
                  className="absolute inset-2 rounded-full border border-gold/5"
                  style={{ borderBottomColor: "#A78BFA88", animation: "counter-spin 3s linear infinite reverse" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">✦</div>
              </div>

              <p className="text-gold text-[9px] tracking-[0.5em] uppercase mb-4 font-semibold">
                Architecting Your Journey
              </p>
              <h2 className="font-serif text-5xl mb-6 shimmer-text">{destination}</h2>
              <p className="text-offwhite/40 text-xs tracking-wider leading-relaxed">
                Our AI is crafting a bespoke {travelStyle.toLowerCase()} narrative<br />tailored to your refined taste…
              </p>

              <div className="mt-12 relative">
                <div className="h-px bg-white/5 w-full rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-transparent via-gold to-transparent animate-film-progress rounded-full" />
                </div>
                <div className="flex justify-between mt-3 px-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1 rounded-sm bg-white/10" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ITINERARY VIEW — CINEMATIC HD ────── */}
        {itinerary && !loading && (
          <div className="min-h-screen animate-fade-in" style={{ background: "#080f18" }}>

            {/* ══════ DESTINATION CINEMA HEADER ═══════ */}
            <div className="relative h-[70vh] min-h-[480px] overflow-hidden">
              {destHeaderImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={destHeaderImg}
                  alt={itinerary.destination}
                  className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
                  style={{ filter: "saturate(1.1) contrast(1.05)" }}
                />
              ) : (
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0B1B2B 0%, #1a0a3a 50%, #0B1B2B 100%)" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(167,139,250,0.2) 0%, transparent 60%)" }} />
                </div>
              )}

              {/* Multi-layer cinematic overlays */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,15,24,0.2) 0%, rgba(8,15,24,0.1) 40%, rgba(8,15,24,0.95) 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,15,24,0.8) 0%, transparent 50%, rgba(8,15,24,0.3) 100%)" }} />

              {/* Grain texture on header */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")" }}
              />

              {/* Nav sits on top */}
              <div className="relative z-20 flex items-center justify-between px-8 pt-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-3xl tracking-tighter text-gold">MV</span>
                  <span className="font-sans text-[9px] tracking-[0.25em] font-light uppercase opacity-40">Mathew Voyages</span>
                </div>
                <button
                  className="group flex items-center gap-2.5 border border-white/10 hover:border-gold/40 bg-white/5 hover:bg-gold/5 text-offwhite/50 hover:text-gold rounded-full px-5 py-2.5 text-[9px] tracking-[0.3em] uppercase font-bold transition-all duration-300"
                  onClick={() => { setItinerary(null); setDestination(""); setError(""); setActivityImages({}); setDestHeaderImg(null); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Back to Home
                </button>
              </div>

              {/* Destination Text — big editorial */}
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 max-w-7xl mx-auto animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-px bg-gold/60" />
                  <span className="text-gold/70 text-[8px] tracking-[0.6em] uppercase font-semibold">Confirmed Itinerary</span>
                </div>
                <h2
                  className="font-serif text-offwhite leading-none mb-4"
                  style={{
                    fontSize: "clamp(4rem, 14vw, 11rem)",
                    textShadow: "0 8px 60px rgba(0,0,0,0.8)",
                    letterSpacing: "-0.02em"
                  }}
                >
                  {itinerary.destination}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-offwhite/35 text-[9px] tracking-[0.5em] uppercase">
                    {itinerary.travel_style} Edition
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gold/40" />
                  <span className="text-offwhite/35 text-[9px] tracking-[0.5em] uppercase">Three Days</span>
                  <span className="w-1 h-1 rounded-full bg-gold/40" />
                  <span className="text-offwhite/35 text-[9px] tracking-[0.5em] uppercase">Nine Chapters</span>
                </div>
              </div>
            </div>

            {/* ══════ DAY SELECTOR — FILMSTRIP STYLE ═══════ */}
            <div className="relative" style={{ background: "rgba(8,15,24,0.98)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="max-w-7xl mx-auto px-8">
                <div className="flex gap-0 overflow-x-auto no-scrollbar">
                  {itinerary.days.map((day, i) => (
                    <button
                      key={i}
                      className={`relative flex-shrink-0 px-8 py-6 text-left transition-all duration-300 border-b-2 ${
                        activeDay === i
                          ? "border-gold text-offwhite"
                          : "border-transparent text-offwhite/30 hover:text-offwhite/60 hover:border-white/10"
                      }`}
                      onClick={() => setActiveDay(i)}
                    >
                      {activeDay === i && (
                        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
                      )}
                      <span className="block text-[7px] tracking-[0.4em] uppercase mb-2 font-medium text-gold/60">
                        Day {day.day}
                      </span>
                      <span className="block text-[10px] tracking-[0.1em] uppercase font-bold leading-tight" style={{ maxWidth: "160px" }}>
                        {day.theme}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ══════ ACTIVITY CARDS — CINEMATIC ═══════ */}
            {itinerary.days[activeDay] && (
              <div className="max-w-7xl mx-auto px-8 py-12 animate-slide-up">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {itinerary.days[activeDay].activities.map((activity, idx) => {
                    const config = TIME_CONFIG[activity.time] || { icon: "✦", label: activity.time };
                    const imgSrc = activityImages[activity.title];

                    return (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer"
                        style={{
                          background: "#0d1b2a",
                          border: "1px solid rgba(255,255,255,0.06)",
                          boxShadow: "0 4px 40px rgba(0,0,0,0.4)",
                          transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.15)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 40px rgba(0,0,0,0.4)"; }}
                      >
                        {/* ─ FULL-BLEED IMAGE ─ */}
                        <div className="relative overflow-hidden" style={{ height: "260px" }}>
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                              style={{
                                transition: "transform 8s ease",
                                filter: "saturate(1.05)"
                              }}
                              onMouseEnter={e => e.target.style.transform = "scale(1.08)"}
                              onMouseLeave={e => e.target.style.transform = "scale(1)"}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full" style={{
                              background: "linear-gradient(135deg, #0B1B2B 0%, #1a2a3a 50%, #0B1B2B 100%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2s linear infinite"
                            }}>
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-15">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <polyline points="21 15 16 10 5 21"/>
                                </svg>
                              </div>
                            </div>
                          )}

                          {/* Image overlays */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a] via-transparent to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a]/30 to-transparent" />

                          {/* Time pill */}
                          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full px-3 py-1.5"
                            style={{ background: "rgba(8,15,24,0.65)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <span className="text-[13px]">{config.icon}</span>
                            <span className="text-[8px] tracking-[0.3em] uppercase font-semibold text-offwhite/70">{config.label}</span>
                          </div>

                          {/* Episode number — cinematic */}
                          <div className="absolute top-3 right-4 font-serif leading-none"
                            style={{ fontSize: "3.5rem", color: "rgba(167,139,250,0.15)", fontWeight: 700 }}>
                            0{idx + 1}
                          </div>
                        </div>

                        {/* ─ CARD CONTENT ─ */}
                        <div className="flex flex-col flex-1 p-6">
                          <div className="mb-1">
                            <span className="text-[7px] tracking-[0.4em] uppercase font-bold text-gold/50">Chapter {(activeDay * 3) + idx + 1}</span>
                          </div>
                          <h3 className="font-serif text-xl mb-4 leading-tight text-offwhite/90 group-hover:text-gold transition-colors duration-400">
                            {activity.title}
                          </h3>
                          <p className="text-offwhite/40 text-[12px] leading-relaxed mb-auto font-light">
                            {activity.description}
                          </p>

                          {/* Tip */}
                          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex gap-3 items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}>
                                  <div className="w-1 h-1 rounded-full bg-gold/60" />
                                </div>
                              </div>
                              <p className="text-offwhite/25 text-[11px] leading-relaxed italic">
                                "{activity.tips}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────── */}
      {!loading && (
        <footer className="relative z-10 py-20 border-t border-white/5 px-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-serif text-3xl tracking-tighter text-gold">MV</span>
                <span className="font-sans text-[9px] tracking-[0.2em] font-light uppercase opacity-50">Mathew Voyages</span>
              </div>
              <p className="text-[9px] tracking-widest text-offwhite/25 uppercase leading-loose">
                Redefining luxury travel through<br />artificial intelligence and artistic curation.
              </p>
            </div>
            <div className="flex gap-20">
              <div className="flex flex-col gap-4 text-[8px] tracking-[0.3em] uppercase font-medium text-offwhite/35">
                <span className="text-gold mb-1">Socials</span>
                <a href="#" className="hover:text-gold transition-colors">Instagram</a>
                <a href="#" className="hover:text-gold transition-colors">Behance</a>
              </div>
              <div className="flex flex-col gap-4 text-[8px] tracking-[0.3em] uppercase font-medium text-offwhite/35">
                <span className="text-gold mb-1">Legal</span>
                <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gold transition-colors">Terms of Use</a>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/5 flex justify-between items-center opacity-15 text-[7px] tracking-[0.5em] uppercase">
            <span>© 2026 Mathew Voyages</span>
            <span>Architecture BY AI</span>
          </div>
        </footer>
      )}

      <style jsx global>{`
        @keyframes counter-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
