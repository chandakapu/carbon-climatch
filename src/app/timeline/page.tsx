import type { Metadata } from "next";
import { getRegulatoryTimeline } from "@/lib/data";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";

export const metadata: Metadata = {
  title: "Regulatory Timeline — Carbon Climatch",
  description: "Key regulatory milestones and deadlines for Indonesian carbon compliance.",
};

export default function TimelinePage() {
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
            Regulatory Timeline
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl text-pretty">
            Stay ahead of domestic and international carbon regulations. This timeline tracks 
            key enforcement dates for Indonesia&apos;s NEK ETS and the EU&apos;s Carbon Border Adjustment Mechanism (CBAM).
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Timeline list */}
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {event.type === "domestic" ? "🇮🇩" : "🇪🇺"}
                </div>
                {/* Content */}
                <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <time className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" })}
                    </time>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      event.status === "upcoming" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                      event.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-white font-bold mb-2 text-balance">{event.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4 text-pretty">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.affected_sectors.map(sector => (
                      <span key={sector} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AIAnalystPanel 
              requestType="regulation_explainer" 
              data={{ upcoming_events: events.filter(e => e.status === "upcoming") }}
              triggerLabel="Summarize Key Impacts"
            />
            
            <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
              <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
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
