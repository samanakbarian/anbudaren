import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Fixes for ES Modules __dirname and __filename in server file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini client on server only (keeps the key safe)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route - System configuration & health
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      platform: "AutoBid SaaS",
      time: new Date().toISOString(),
      hasApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // API Route - Analyse client documents (CVs, Presentations, Win-bids) to clone Tone of Voice & structure RAG
  app.post("/api/analyze-documents", async (req, res) => {
    try {
      const { documents, companyNameSuggested } = req.body;
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({ error: "No documents provided for injection" });
      }

      const mergedText = documents.map(doc => `[KÄLLA: ${doc.name} (Typ: ${doc.type})]\n${doc.content}`).join("\n\n---\n\n");

      const prompt = `Du är en expert på upphandling, RAG-strukturering och anbudsskrivande. 
Vi har laddat upp ett eller flera erfarenhetsdokument (CV:n, företagspresentationer eller tidigare vinnande anbud) från ett företag. 
Din uppgift är att städa dunka, analysera innehållet och generera en isolerad kunskapsbank samt klona bolagets "Tone of Voice" för framtida anbud.

Analysera följande insamlade data:
${mergedText}

Svara med ett strukturerat JSON-objekt som representerar bolagets isolerade intelligensprofil. Svara på SVENSKA. 
Objektet ska matcha följande typstruktur:
{
  "companyName": "Namn på företaget utifrån dokumenten eller som förslag",
  "coreCompetencies": ["Lista de 4-6 viktigaste kompetenserna/tjänsterna"],
  "consultants": [
    {
      "name": "Namn på konsult eller 'Senior resurs' om anonymt",
      "roles": ["konsultroller t.ex. Systemutvecklare, Cloud arkitekt"],
      "skills": ["Nyckelord för teknologier t.ex. AWS, React, Kubernetes"],
      "bio": "En mycket kort summering på 1-2 meningar om personens kärnstyrka."
    }
  ],
  "toneOfVoice": {
    "styleDescription": "Beskrivning av stilen, t.ex. 'Formell men lösningsorienterad, beskriver beprövade metoder aktivt'",
    "clonedDirectives": [
      "Styrande regel 1 för AI:n t.ex. 'Använd korta, slagkraftiga stycken och undvik onödiga superlativ'",
      "Styrande regel 2 t.ex. 'Använd begrepp som parter, åtaganden och mervärde istället för säljsnack'",
      "Styrande regel 3 t.ex. 'Framhäv certifieringar och tidigare lyckade kundleveranser som kvalitetsbevis'"
    ],
    "typicalPhrases": ["Fras eller ordvända som bolaget ofta använder t.ex. 'Vi säkerställer en robust leverans genom...'"]
  },
  "pastWinningBiddingThemes": [
    "Ett centralt säljande tema som upprepats t.ex. 'Fokus på hållbar arkitektur och lokal datalagring'",
    "Ett annat säljande tema t.ex. 'Metodiskt agilt arbetssätt baserat på SAFe'"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["companyName", "coreCompetencies", "consultants", "toneOfVoice", "pastWinningBiddingThemes"],
            properties: {
              companyName: { type: Type.STRING },
              coreCompetencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              consultants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["name", "roles", "skills", "bio"],
                  properties: {
                    name: { type: Type.STRING },
                    roles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    bio: { type: Type.STRING }
                  }
                }
              },
              toneOfVoice: {
                type: Type.OBJECT,
                required: ["styleDescription", "clonedDirectives", "typicalPhrases"],
                properties: {
                  styleDescription: { type: Type.STRING },
                  clonedDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  typicalPhrases: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              pastWinningBiddingThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsedProfile = JSON.parse(response.text || "{}");
      res.json(parsedProfile);
    } catch (error: any) {
      console.error("Error analyzing documents:", error);
      res.status(500).json({ error: error.message || "Internt fel vid Gemini-analys" });
    }
  });

  // API Route - Calculate Win Probability Score & Requirement Checklist coverage
  app.post("/api/calculate-match", async (req, res) => {
    try {
      const { companyProfile, tender } = req.body;
      if (!companyProfile || !tender) {
        return res.status(400).json({ error: "Bolagsprofil och upphandlingsinfo krävs" });
      }

      const prompt = `Du är en avancerad AI-anbudsanalytiker. 
Din uppgift är att skanna skallkraven i en ny upphandling mot ett bolags sparade kunskapsprofil (CV:n, kompetenser och historiska teman) och göra en strikt matematisk och strategisk matchningsanalys.

Här är bolagets isolerade profil:
${JSON.stringify(companyProfile, null, 2)}

Här är upphandlingen (Tender):
Rubrik: ${tender.title}
Myndighet: ${tender.authority}
Beskrivning: ${tender.description}
Kravspecifikationer (skallkrav):
${tender.requirements.map((req: any, index: number) => `${index + 1}. [KRAV]: ${req.text}`).join("\n")}

Generera en grundlig utvärdering i JSON-format på SVENSKA. 
Beräkna en realistisk "winProbability" i procent (ett heltal mellan 20 och 100) baserat på hur väl bolagets konsulter och kompetenser täcker upphandlingens skallkrav.
Var hård men konstruktiv i din bedömning – om bolaget saknar kompetens eller erfarenhet för ett krav ska det återspeglas i "satisfiesPercent" för det kravet och dras av från winProbability.

JSON-struktur som ska returneras:
{
  "winProbability": 85, // Heltal i procent av vinstchans (0-100)
  "reasoning": "En övergripande strategisk motivering till vinstprocenten på 2-3 meningar.",
  "requirementsChecklist": [
    {
      "requirementIndex": 0, // Motsvarar Index i tender.requirements arrayen
      "satisfiesPercent": 100, // Hur väl vi uppfyller kravet (0, 50, 90, 100)
      "justification": "Konkret motivering varför. T.ex: 'Vår expert Jonas ritar AWS cloud-lösningar sedan 2018.'",
      "sourceCVs": ["Jonas", "Erik"] // Vilka konsulter tillgodoser detta. Tom array om ingen.
    }
  ],
  "strengths": [
    "Konkret styrka 1, t.ex. 'Vi har 3 konsulter som uppfyller tidskravet för Kubernetes.'",
    "Konkret styrka 2, t.ex. 'Tidigare referenser täcker myndighetens specifika krav på e-hälsa.'"
  ],
  "risks": [
    "Konkret risk/gap 1, t.ex. 'Krav på ISO 27001 kan bli svårt då vi endast jobbar enligt dess principer utan certifikat.'"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["winProbability", "reasoning", "requirementsChecklist", "strengths", "risks"],
            properties: {
              winProbability: { type: Type.INTEGER },
              reasoning: { type: Type.STRING },
              requirementsChecklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["requirementIndex", "satisfiesPercent", "justification", "sourceCVs"],
                  properties: {
                    requirementIndex: { type: Type.INTEGER },
                    satisfiesPercent: { type: Type.INTEGER },
                    justification: { type: Type.STRING },
                    sourceCVs: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const parsedResult = JSON.parse(response.text || "{}");
      res.json(parsedResult);
    } catch (error: any) {
      console.error("Error calculating match:", error);
      res.status(500).json({ error: error.message || "Internt fel vid matchningsberäkning" });
    }
  });

  // API Route - Autogenerate a customized bid section matching a specific requirement
  app.post("/api/generate-bid-section", async (req, res) => {
    try {
      const { requirementText, companyProfile, criteriaScore } = req.body;
      if (!requirementText || !companyProfile) {
        return res.status(400).json({ error: "Kravtext och bolagsprofil krävs" });
      }

      const toneOfVoice = companyProfile.toneOfVoice || { styleDescription: "Professionell och objektiv", clonedDirectives: [] };
      const directives = toneOfVoice.clonedDirectives ? toneOfVoice.clonedDirectives.join("\n- ") : "";

      const prompt = `Du är AutoBids intelligenta anbudsskribent-robot. 
Din uppgift är att skriva en professionell, komplett och juridiskt hållbar textdel för ett offentligt anbud till en myndighet. 
Textdelen måste svara exakt på myndighetens skallkrav och framhäva bolagets matchande kompetens.

MYNDIGHETENS KRAV:
"${requirementText}"

VÅR BOLAGSPROFIL:
- Bolag: ${companyProfile.companyName}
- Kärnkompetenser: ${companyProfile.coreCompetencies?.join(", ") || "IT-tjänster"}
- Passande resurser & CV: ${JSON.stringify(companyProfile.consultants || [])}
- Tidigare vinnande teman: ${JSON.stringify(companyProfile.pastWinningBiddingThemes || [])}
${criteriaScore ? `- Hur vi uppfyller detta (match): ${criteriaScore.justification} (Styrka: ${criteriaScore.satisfiesPercent}%)` : ""}

KRAV PÅ SKRIVSTIL (Calibrering genom Tone of Voice):
Stilbeskrivning: ${toneOfVoice.styleDescription}
Regler:
- ${directives || "Håll det koncist, säljande men sakligt."}
Typiska fraser vi använder ibland: ${toneOfVoice.typicalPhrases?.join(", ") || ""}

Skriv ett färdigt anbudssvar på SVENSKA. Texten ska vara välformulerad, uppdelad i tydliga stycken, och läsbar. Den ska låta precis som bolagets egna säljare och bid-managers, utan att kännas genererad av en generisk robot. Använd Markdown för rubriker eller punktlistor om lämpligt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ draft: response.text || "" });
    } catch (error: any) {
      console.error("Error generating bid section:", error);
      res.status(500).json({ error: error.message || "Internt fel vid textgenerering" });
    }
  });

  // API Route - Refine a generated bid section with interactive customer feedback
  app.post("/api/refine-bid-section", async (req, res) => {
    try {
      const { requirementText, currentDraft, feedback, companyProfile } = req.body;
      if (!requirementText || !currentDraft || !feedback) {
        return res.status(400).json({ error: "Kravtext, nuvarande utkast och feedback krävs" });
      }

      const toneOfVoice = companyProfile?.toneOfVoice || { styleDescription: "Professionell och objektiv", clonedDirectives: [] };

      const prompt = `Du är AutoBids intelligenta anbudsskribent-robot. 
Kunden vill finjustera och skriva om ett genererat utkast för ett skallkrav baserat på deras specifik feedback.

MYNDIGHETS-KRAV:
"${requirementText}"

NUVARANDE UTKAST:
"""
${currentDraft}
"""

KUNDENS FEEDBACK / INSTRUKTION:
"${feedback}"

Håll dig till bolagets Tone of Voice om möjligt:
${toneOfVoice.styleDescription}

Skriv om eller redigera utkastet i enlighet med kundens önskemål på SVENSKA. Behåll en hög professionell status och struktur. Leverera det nyskrivna utkastet i formaterat format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ draft: response.text || "" });
    } catch (error: any) {
      console.error("Error refining bid section:", error);
      res.status(500).json({ error: error.message || "Internt fel vid justering av text" });
    }
  });


  // Serve static UI assets or initialize Vite Middleware for SPA hot loading
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Development Server Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production build from /dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoBid server running successfully on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start fullstack server:", error);
});
