import React from "react";
import { SubscriptionTier } from "../types";
import { Check, ShieldAlert, Sparkles, Zap, Award } from "lucide-react";

interface PricingModuleProps {
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
}

export default function PricingModule({ currentTier, onSelectTier }: PricingModuleProps) {
  const tiers = [
    {
      id: SubscriptionTier.BASIC,
      name: "Basic (Radarn)",
      price: "990 kr",
      period: "månad",
      icon: Zap,
      description: "För mindre bolag som vill bevaka marknaden och få snabb matchningspoäng automatiskt.",
      features: [
        "Automatisk upphandlingsbevakning (Radar)",
        "Win Probability Score",
        "Enkel kravmatchning",
        "Säker, isolerad databas"
      ],
      color: "border-gray-200 bg-white text-gray-900",
      badgeColor: "bg-gray-100 text-gray-700",
      buttonStyle: "bg-gray-900 text-white hover:bg-gray-800",
      notIncluded: [
        "AI-anbudsskribent (Autogenerering)",
        "Interaktiv Krav-Generator",
        "Kloning av 'Tone of Voice'",
        "CV och profilmatchning på anställda",
        "Export av dokument i Word/Markdown"
      ]
    },
    {
      id: SubscriptionTier.PRO,
      name: "Pro (AI-skribenten)",
      price: "4 990 kr",
      period: "månad",
      icon: Sparkles,
      description: "Vår populäraste plan. Ger full tillgång till den automatiska anbudsroboten med interaktiva verktyg.",
      features: [
        "Allt i Basic-planen",
        "Full AI-generering av anbudssvar",
        "Kloning av 'Tone of Voice'",
        "Interaktiv kravstämning rad-för-rad",
        "Automatisk CV- och resursmatchning",
        "Export och dokumentnedladdning",
        "Personlig isolerad RAG-databas"
      ],
      color: "border-indigo-600 bg-gradient-to-b from-indigo-50/50 to-white text-gray-900 ring-2 ring-indigo-600 ring-offset-2",
      badgeColor: "bg-indigo-600 text-white",
      buttonStyle: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-150",
      notIncluded: [
        "Obegränsat anställda (max 10 CV:n)",
        "Obegränsade API-tokens",
        "Anpassade säkerhetsregler"
      ]
    },
    {
      id: SubscriptionTier.ENTERPRISE,
      name: "Enterprise (Konsultmäklarna)",
      price: "15 000 kr+",
      period: "månad",
      icon: Award,
      description: "För större byråer eller konsultnätverk som vill matcha hundratals CV:n på sekunder.",
      features: [
        "Allt i Pro-planen",
        "Oändligt antal anslutna konsulter",
        "SLA på svarstider och dedikerad support",
        "Multi-tenant nätverk av underkonsulter",
        "Obegränsade API-tokens & anbudsförfrågningar",
        "Anpassade juridiskt utformade standardklausuler",
        "Avancerad loggning av AI-säkerhet"
      ],
      color: "border-slate-800 bg-slate-900 text-white",
      badgeColor: "bg-amber-500 text-slate-950",
      buttonStyle: "bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold",
      notIncluded: []
    }
  ];

  return (
    <div id="pricing-container" className="space-y-6">
      <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-2">
        <span className="p-1.5 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 tracking-wide uppercase">
          Affärsmodell & Licenser
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Skalbar prissättning för alla storlekar
        </h2>
        <p className="text-sm text-gray-500">
          Välj rätt nivå för ditt bolag. Du sparar dussintals timmar varje månad och ökar era vinstchanser dramatiskt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = currentTier === tier.id;

          return (
            <div
              key={tier.id}
              id={`tier-card-${tier.id}`}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${tier.color} ${
                isSelected ? "scale-102 shadow-lg" : "hover:shadow-md"
              }`}
            >
              {isSelected && (
                <div className="absolute right-4 top-4">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${tier.badgeColor}`}>
                    Aktiv Plan
                  </span>
                </div>
              )}

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isSelected && tier.id === "ENTERPRISE" ? "bg-slate-800" : "bg-indigo-50"} text-indigo-600`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold tracking-tight">{tier.price}</span>
                  <span className="text-xs text-gray-500 font-medium">/{tier.period}</span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">
                  {tier.description}
                </p>

                <hr className="border-gray-100" />

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Detta ingår:</h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-600 font-medium">
                        <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {tier.notIncluded.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Ingår inte:</h4>
                    <ul className="space-y-2">
                      {tier.notIncluded.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-xs text-gray-400">
                          <ShieldAlert className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                          <span className="line-through">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-2">
                <button
                  id={`btn-select-tier-${tier.id}`}
                  onClick={() => onSelectTier(tier.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 ${tier.buttonStyle} ${
                    isSelected ? "ring-2 ring-indigo-300" : ""
                  }`}
                >
                  {isSelected ? "Vald plan (Testa Gränssnitt)" : `Uppgradera till ${tier.name.split(" ")[0]}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
