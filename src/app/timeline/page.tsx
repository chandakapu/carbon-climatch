"use client";

import { getRegulatoryTimeline } from "@/lib/data";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";
import { useLanguage } from "@/components/layout/LanguageContext";
import { TracingBeam } from "@/components/ui/tracing-beam";

export default function TimelinePage() {
  const { language, t } = useLanguage();

  const events = getRegulatoryTimeline().map(event => {
    let computedStatus = event.status;
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (event.status === "planned" && eventDate.getFullYear() > 2027) {
      computedStatus = "planned";
    } else if (daysDiff < 0) {
      computedStatus = daysDiff < -180 ? "past" : "active";
    } else {
      computedStatus = "upcoming";
    }

    return { ...event, status: computedStatus };
  });

  return (
    <div className="min-h-screen bg-[#0b1120] text-white font-sans">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-balance">
            {t("timeline.title")}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl text-pretty">
            {t("timeline.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Timeline list using TracingBeam */}
          <div className="pl-6 md:pl-10">
            <TracingBeam>
              <div className="space-y-12">
                {events.map((event) => {
                  const eventTitle = t(`timelineEvents.${event.id}.title`) !== `timelineEvents.${event.id}.title`
                    ? t(`timelineEvents.${event.id}.title`)
                    : event.title;

                  const eventDesc = t(`timelineEvents.${event.id}.description`) !== `timelineEvents.${event.id}.description`
                    ? t(`timelineEvents.${event.id}.description`)
                    : event.description;

                  const statusLabel = 
                    event.status === "upcoming" ? (language === "id" ? "Mendatang" : "Upcoming") :
                    event.status === "active" ? (language === "id" ? "Aktif" : "Active") :
                    event.status === "past" ? (language === "id" ? "Selesai" : "Past") :
                    (language === "id" ? "Direncanakan" : "Planned");

                  return (
                    <div key={event.id} className="relative flex flex-col md:flex-row gap-4 items-start group">
                      {/* Left Badge/Icon indicator */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow shrink-0">
                          {event.type === "domestic" ? "🇮🇩" : "🇪🇺"}
                        </div>
                      </div>
                      
                      {/* Content Card */}
                      <div className="w-full p-6 rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur-sm shadow-md hover:border-emerald-500/20 transition-all duration-300">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <time className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            {new Date(event.date).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: "long", year: "numeric", day: "numeric" })}
                          </time>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            event.status === "upcoming" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                            event.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                          }`}>
                            {statusLabel}
                          </span>
                        </div>
                        <h3 className="text-white text-lg font-bold mb-2 text-balance">{eventTitle}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4 text-pretty">
                          {eventDesc}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.affected_sectors.map(sector => (
                            <span key={sector} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">
                              {sector}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TracingBeam>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AIAnalystPanel 
              requestType="regulation_explainer" 
              data={{ upcoming_events: events.filter(e => e.status === "upcoming") }}
              triggerLabel={language === "id" ? "Ringkas Dampak Utama" : "Summarize Key Impacts"}
            />
            
            <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
              <h4 className="text-sm font-bold text-white mb-4">{language === "id" ? "Sumber Daya" : "Resources"}</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://idxcarbon.co.id/" target="_blank" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-2">
                    <span>↗</span> IDXCarbon Official
                  </a>
                </li>
                <li>
                  <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en" target="_blank" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-2">
                    <span>↗</span> EU CBAM Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
