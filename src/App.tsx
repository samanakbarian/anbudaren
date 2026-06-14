import React, { useState, useEffect, useRef } from "react";
import {
  SubscriptionTier,
  IngestedDocument,
  CompanyProfile,
  Tender,
  MatchResult,
  BidDraft,
  AppState
} from "./types";
import { MOCK_TENDERS } from "./data/mockTenders";
import { DEMO_COMPANIES } from "./data/mockDocuments";
import PricingModule from "./components/PricingModule";
import {
  Sparkles,
  Zap,
  Award,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Send,
  Upload,
  Bot,
  User,
  Cpu,
  Info,
  Lock,
  ChevronRight,
  Clock,
  History,
  Save,
  FileDown,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from "lucide-react";

interface DiffChange {
  type: "added" | "removed" | "unchanged";
  text: string;
}

function computeWordDiff(oldText: string, newText: string): DiffChange[] {
  if (!oldText) return [{ type: "added", text: newText }];
  if (!newText) return [{ type: "removed", text: oldText }];

  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  
  const dp: number[][] = Array(oldWords.length + 1).fill(0).map(() => Array(newWords.length + 1).fill(0));
  
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: DiffChange[] = [];
  let i = oldWords.length;
  let j = newWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: "unchanged", text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", text: newWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", text: oldWords[i - 1] });
      i--;
    }
  }
  
  return result;
}

export default function App() {
  // ---- Core States ----
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.PRO);
  const [activeTab, setActiveTab] = useState<"radar" | "knowledge" | "pricing" | "about">("radar");
  
  // Custom uploaded/added documents state
  const [documents, setDocuments] = useState<IngestedDocument[]>(() => {
    // Start with preloaded Svea Cloud documents for instant WOW factor
    const sveaSourced = DEMO_COMPANIES[0].documents.map((doc, idx) => ({
      id: `svea-doc-${idx}`,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      size: doc.size
    }));
    return sveaSourced;
  });

  // Current company profile state (preloaded with Svea Cloud)
  const [currentPresetId, setCurrentPresetId] = useState<string>("svea-consulting");
  const [profile, setProfile] = useState<CompanyProfile | null>(() => {
    // Define initial preloaded profile
    return {
      companyName: "Svea Cloud & Code AB",
      coreCompetencies: ["Säkra Kubernetes-miljöer", "WCAG 2.1 AA Tillgänglighet", "React & TypeScript", "Agil Säkerhetsmetodik"],
      consultants: [
        {
          name: "Lina Bergman",
          roles: ["Senior Frontendutvecklare", "UI/UX-arkitekt"],
          skills: ["React", "TypeScript", "Tailwind CSS", "WCAG 2.1 AA"],
          bio: "Expert på högpresterande och fullt tillgängliga webbgränssnitt för offentlig sektor."
        },
        {
          name: "Jonas Dahl",
          roles: ["Senior Cloud Architect", "DevSecOps Specialist"],
          skills: ["Kubernetes", "AWS", "Terraform", "OWASP", "Säkerhet"],
          bio: "Designar robusta, isolerade container-miljöer och CI/CD-pipelines för myndigheter."
        },
        {
          name: "Carl Sundqvist",
          roles: ["Senior Agile Coach", "Scrum Master"],
          skills: ["Scrum", "Kanban", "SAFe", "Projektledning"],
          bio: "Hjälper offentliga utvecklingsteam att öka kvalitet och leveranstakt genom agila principer."
        }
      ],
      toneOfVoice: {
        styleDescription: "Metodisk, förtroendeingivande och tillgänglighetsfokuserad. Undviker tomt säljsnack till förmån för beprövade ramverk och standarder.",
        clonedDirectives: [
          "Inled med att förankra expertis i konkreta lyckade offentliga uppdrag.",
          "Betona alltid tillgänglighet (WCAG 2.1 AA) och robusthet som lagkrav snarare än extrafunktioner.",
          "Använd professionella begrepp som 'leveranssäkerhet', 'kollegial granskning' och 'ISO 27000-principer'"
        ],
        typicalPhrases: [
          "Vi säkerställer en robust leverans genom...",
          "Tillgänglighet är för oss en lagstadgad standard...",
          "Med ett DevSecOps-tänk integrerat från första kodraden..."
        ]
      },
      pastWinningBiddingThemes: [
        "Metodisk säkerhet genom OWASP och automatiserad kodgranskning",
        "Erfarenhet från komplexa regelstyrda myndighetsmiljöer",
        "Fullständig regelefterlevnad av nationella krav och tillgänglighetsdirektiv"
      ]
    };
  });

  // Active workspace state
  const [selectedTender, setSelectedTender] = useState<Tender>(MOCK_TENDERS[0]);
  const [activeRequirementIndex, setActiveRequirementIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Loading and system notice states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isCalculatingMatch, setIsCalculatingMatch] = useState<boolean>(false);
  const [isGeneratingSection, setIsGeneratingSection] = useState<boolean>(false);
  const [isRefiningSection, setIsRefiningSection] = useState<boolean>(false);
  
  // Custom manual entry tool state for sandboxed iframe convenience
  const [manualDocName, setManualDocName] = useState<string>("");
  const [manualDocType, setManualDocType] = useState<"cv" | "presentation" | "past_bid">("cv");
  const [manualDocText, setManualDocText] = useState<string>("");
  
  // Custom feedback/instruction for text refinement
  const [userFeedbackText, setUserFeedbackText] = useState<string>("");
  
  // Match results storage
  const [matchResults, setMatchResults] = useState<{ [tenderId: string]: MatchResult }>({});
  
  // Active drafts storage
  const [bidDrafts, setBidDrafts] = useState<{ [tenderId: string]: BidDraft }>(() => {
    return {
      "tender-1": {
        "req-1-1": {
          text: "Svea Cloud & Code AB erbjuder Lina Bergman som Senior Frontendutvecklare och UI/UX-arkitekt. Lina har 8 års verifierad expertis inom React, modern TypeScript och Tailwind CSS. Hon möter Skatteverkets krav till 100% och har tidigare designat offentliga, fullt tillgängliga webbgränssnitt enligt WCAG 2.1 AA för Stockholms Stad, vilket garanterar en robust och lagbunden leverans.",
          isGenerating: false,
          history: [
            "Svea Cloud & Code AB tillhandahåller härmed Lina Bergman för rollen som frontendutvecklare. Lina Bergman har god erfarenhet av React och TypeScript och har byggt webbapplikationer.",
            "Svea Cloud & Code AB tillhandahåller Lina Bergman som senior frontendutvecklare. Lina har över 8 års erfarenhet av React och modern TypeScript. Hon har tidigare byggt tillgängliga webbgränssnitt enligt WCAG 2.1 AA för Stockholms Stad.",
            "Svea Cloud & Code AB erbjuder Lina Bergman som Senior Frontendutvecklare och UI/UX-arkitekt. Lina har 8 års verifierad expertis inom React, modern TypeScript och Tailwind CSS. Hon möter Skatteverkets krav till 100% och har tidigare designat offentliga, fullt tillgängliga webbgränssnitt enligt WCAG 2.1 AA för Stockholms Stad, vilket garanterar en robust och lagbunden leverans."
          ]
        },
        "req-1-2": {
          text: "Svea Cloud & Code AB har implementerat en strikt policy för säker applikationsutveckling integrerad direkt i vår CI/CD-pipeline. All kodgenomgång baseras på OWASP Top 10-standarder samt kollegial granskning för att trygga att eventuella sårbarheter identifieras före produktionssättning. Vårt DevSecOps-arbetssätt leds av Jonas Dahl.",
          isGenerating: false,
          history: [
            "Svea Cloud & Code AB arbetar med OWASP Top 10 och gör regelbunden kodgranskning i alla projekt.",
            "Svea Cloud & Code AB har implementerat en strikt policy för säker applikationsutveckling integrerad direkt i vår CI/CD-pipeline. All kodgenomgång baseras på OWASP Top 10-standarder samt kollegial granskning för att trygga att eventuella sårbarheter identifieras före produktionssättning. Vårt DevSecOps-arbetssätt leds av Jonas Dahl."
          ]
        }
      }
    };
  });

  // Active sub-tabs inside Section B (Editor vs Snapshots)
  const [bidConsoleTab, setBidConsoleTab] = useState<"editor" | "snapshots">("editor");

  // Snapshots storage of whole bids for security audits and reverting
  const [bidSnapshots, setBidSnapshots] = useState<{ [tenderId: string]: any[] }>(() => {
    return {
      "tender-1": [
        {
          id: "snap-1-1",
          tenderId: "tender-1",
          label: "Initialt AI-förslag",
          timestamp: "2026-06-13 20:15",
          author: "AutoBid AI-Skribent",
          drafts: {
            "req-1-1": "Svea Cloud & Code AB tillhandahåller härmed Lina Bergman för rollen som frontendutvecklare. Lina Bergman har god erfarenhet av React och TypeScript och har byggt webbapplikationer.",
            "req-1-2": "Svea Cloud & Code AB arbetar med OWASP Top 10 och gör regelbunden kodgranskning i alla projekt."
          }
        },
        {
          id: "snap-1-2",
          tenderId: "tender-1",
          label: "Internt utkast före granskning",
          timestamp: "2026-06-13 21:30",
          author: "Lina Bergman (Senior Frontend)",
          drafts: {
            "req-1-1": "Svea Cloud & Code AB tillhandahåller Lina Bergman som senior frontendutvecklare. Lina har över 8 års erfarenhet av React och modern TypeScript. Hon har tidigare byggt tillgängliga webbgränssnitt enligt WCAG 2.1 AA för Stockholms Stad.",
            "req-1-2": "Svea Cloud & Code AB arbetar med OWASP Top 10 och gör regelbunden kodgranskning i alla projekt."
          }
        }
      ]
    };
  });

  const [snapshotLabel, setSnapshotLabel] = useState<string>("");
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);

  // States for paragraph level version comparison
  const [viewingParagraphHistory, setViewingParagraphHistory] = useState<boolean>(false);
  const [selectedHistoryVersionIndex, setSelectedHistoryVersionIndex] = useState<number | null>(null);
  
  // Notification banner state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);

  // Active manually edited drafted text
  const [editingText, setEditingText] = useState<string>("");
  const [isCurrentlyEditingInline, setIsCurrentlyEditingInline] = useState<boolean>(false);

  // Helper connection status indicator
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  // Auto-connect to backend API & do initial pre-computations on load
  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          setBackendReady(true);
        } else {
          setBackendReady(false);
        }
      })
      .catch(() => {
        setBackendReady(false);
      });
  }, []);

  // Compute profile matching on change of selected tender or active company profile
  useEffect(() => {
    if (!profile) return;
    
    // Check if we already have it in state
    const matchKey = `${profile.companyName}-${selectedTender.id}`;
    if (matchResults[matchKey]) {
      // Already calculated, reuse
      return;
    }

    // Trigger match analysis
    calculateMatchScore(profile, selectedTender);
  }, [selectedTender, profile]);

  // Clean prompt toast message after delay
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
  };

  // Switch demo company preset
  const handleLoadDemoCompany = (presetId: string) => {
    const preset = DEMO_COMPANIES.find(c => c.id === presetId);
    if (!preset) return;

    setIsAnalyzing(true);
    setCurrentPresetId(presetId);
    
    // Ingest Preset files
    const newDocs: IngestedDocument[] = preset.documents.map((doc, idx) => ({
      id: `${presetId}-doc-${idx}`,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      size: doc.size
    }));
    setDocuments(newDocs);

    // Call API (or let client-side preloaded profiles kick in swiftly)
    fetch("/api/analyze-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: newDocs, companyNameSuggested: preset.name })
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("API-error vid profilanalys");
        }
        const parsed = await res.json();
        setProfile(parsed);
        showToast(`Kunskapsinjektion slutförd för ${parsed.companyName}! "Tone of Voice" är kalibrerad.`, "success");
      })
      .catch((err) => {
        console.warn("Backend API client-side fallback loaded for preset:", presetId, err);
        // Fallback structures if API key is not supplied
        if (presetId === "svea-consulting") {
          setProfile({
            companyName: "Svea Cloud & Code AB",
            coreCompetencies: ["Säkra Kubernetes-miljöer", "WCAG 2.1 AA Tillgänglighet", "React & TypeScript", "Agil Säkerhetsmetodik"],
            consultants: [
              {
                name: "Lina Bergman",
                roles: ["Senior Frontendutvecklare", "UI/UX-arkitekt"],
                skills: ["React", "TypeScript", "Tailwind CSS", "WCAG 2.1 AA"],
                bio: "Expert på tillgängliga och eleganta gränssnitt för offentlig sektor."
              },
              {
                name: "Jonas Dahl",
                roles: ["Senior Cloud Architect", "DevSecOps Specialist"],
                skills: ["Kubernetes", "AWS", "Terraform", "OWASP"],
                bio: "Designar robusta, säkra molnmiljöer med full regelefterlevnad."
              },
              {
                name: "Carl Sundqvist",
                roles: ["Senior Agile Coach", "Scrum Master"],
                skills: ["Scrum", "Kanban", "SAFe"],
                bio: "Leder högpresterande team och tryggar effektiv kompetensöverföring."
              }
            ],
            toneOfVoice: {
              styleDescription: "Teknisk, metodisk och gediget förtroendeingivande med betoning på internationella standarder.",
              clonedDirectives: [
                "Undvik fluffigt säljsnack. Svara direkt med konkreta referenser.",
                "Säkerställ att tillgänglighet (WCAG 2.1 AA) och robust design genomsyrar svaren.",
                "Visa att vi integrerar säkerhet och kollegial kodgranskning i alla leveransled."
              ],
              typicalPhrases: ["Vi säkerställer en robust leverans genom...", "Som en naturlig del i vår agila arbetsprocess..."]
            },
            pastWinningBiddingThemes: ["Säkerhet från första kodraden", "Lokal representation och snabb support", "WCAG och modern TypeScript-standard"]
          });
        } else {
          setProfile({
            companyName: "Nordic AI Labs AB",
            coreCompetencies: ["Generativ AI & LLMs", "Etiskt ansvarsfull AI", "NLP & RAG-Arbeten", "Python & Maskininlärning"],
            consultants: [
              {
                name: "Astrid Lindén",
                roles: ["Senior AI Architect", "NLP Specialist"],
                skills: ["Generativ AI", "LLM Integration", "RAG Systems", "Python", "PyTorch"],
                bio: "Svensk pionjär inom isolerade språkmodeller för bank och offentlig sektor."
              }
            ],
            toneOfVoice: {
              styleDescription: "Innovativ, vetenskapligt förankrad och bunden vid absolut regelefterlevnad (AI Act, GDPR).",
              clonedDirectives: [
                "Betona djupt datasekretess och hindrande av LLM-hallucinationer.",
                "Fokusera på det innovativa tekniksprånget och sökbara RAG-processer.",
                "Lyft fram formella ramverk som AI Act som bärande pelare."
              ],
              typicalPhrases: ["Genom robusta, isolerade språkteknologiska pipelines...", "Vi garanterar etisk regelefterlevnad enligt AI Act..."]
            },
            pastWinningBiddingThemes: ["Isolerade RAG-arkitekturer utan dataläckage", "Anpassade språkmodeller för svenska språket", "Etisk AI-governance"]
          });
        }
        showToast(`Kunskap laddad från demonstrationsmall (${preset.name})`, "info");
      })
      .finally(() => {
        setIsAnalyzing(false);
        setActiveRequirementIndex(0);
      });
  };

  // Call backend matching score generator
  const calculateMatchScore = (compProfile: CompanyProfile, tenderObj: Tender) => {
    setIsCalculatingMatch(true);

    fetch("/api/calculate-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyProfile: compProfile, tender: tenderObj })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("API-error vid matchning");
        const parsedResult: MatchResult = await res.json();
        
        const matchKey = `${compProfile.companyName}-${tenderObj.id}`;
        setMatchResults(prev => ({
          ...prev,
          [matchKey]: parsedResult
        }));
      })
      .catch((err) => {
        console.warn("Match-calculation API error, resolving mock data fallbacks, error:", err);
        // Clean fallbacks logic for high resolution prototyping
        // Calculates a simulated smart match based on matching companies to tenders
        const matchKey = `${compProfile.companyName}-${tenderObj.id}`;
        let score = 50;
        let reasons = "";
        let strengths: string[] = [];
        let risks: string[] = [];
        let checklist: any[] = [];

        if (compProfile.companyName.includes("Svea")) {
          if (tenderObj.id === "tender-1") {
            // Perfect match for Skatteverket
            score = 92;
            reasons = "Svea Cloud & Code AB har en enastående matchning för Skatteverkets förfrågan. Er expert Lina Bergman uppfyller tidskraven för React- och TypeScript-erfarenhet till punkt och pricka. Jonas Dahl kompletterar med spetskompetens inom Kubernetes och säker orkestrering.";
            strengths = [
              "Lina Bergman har 8 års verifierad erfarenhet av React och TypeScript.",
              "Jonas Dahl erbjuder tung DevSecOps-erfarenhet och säkerhetshärdning i Kubernetes.",
              "Metodpelare med kodgranskning och OWASP-efterlevnad matchar skallkraven perfekt."
            ];
            risks = [
              "Färre anställda än de absolut största globala konsultjättarna, vilket kan pressa kapaciteten vid plötslig upptrappning."
            ];
            checklist = [
              { requirementIndex: 0, satisfiesPercent: 100, justification: "Lina Bergman har 8 års expertis inom React/TypeScript och har byggt WCAG-säkra webbgränssnitt för Stockholms Stad.", sourceCVs: ["Lina Bergman"] },
              { requirementIndex: 1, satisfiesPercent: 100, justification: "Sveas metodbeskrivning omfattar obligatorisk 'Säkerhet från första kodraden' baserat på OWASP och integrerade CI/CD-pipelines ledda av Jonas Dahl.", sourceCVs: ["Jonas Dahl"] },
              { requirementIndex: 2, satisfiesPercent: 100, justification: "Jonas Dahl har 12 års erfarenhet av moln/K8s och ritade senast Polismyndighetens isolerade Kubernetes-miljö.", sourceCVs: ["Jonas Dahl"] },
              { requirementIndex: 3, satisfiesPercent: 90, justification: "Carl Sundqvist är certifierad Scrum Master som bland annat drivit utvecklingsteam hos Arbetsförmedlingen på ett strukturerat sätt.", sourceCVs: ["Carl Sundqvist"] }
            ];
          } else if (tenderObj.id === "tender-2") {
            // Stockholms stad
            score = 88;
            reasons = "Stockholms Stads medborgarportal är en utmärkt matchning för Sveas kompetens-profil. Lina Bergman har tidigare varit huvudfrontend-utvecklare för 'Mina Sidor' åt just Stockholms Stad.";
            strengths = [
              "Unik tidigare referens direkt hos den upphandlande myndigheten.",
              "Lina Bergman har djupgående spetskunskap om WCAG 2.1 AA digital tillgänglighet."
            ];
            risks = [
              "Svea saknar en definierad dedikerad heltids-QA-resurs i profilen, även om Jonas erbjuder DevSecOps-testning."
            ];
            checklist = [
              { requirementIndex: 0, satisfiesPercent: 80, justification: "Lina och Jonas har byggt mikrotjänster med Node.js, men har bredare fokus på React och K8s.", sourceCVs: ["Lina Bergman", "Jonas Dahl"] },
              { requirementIndex: 1, satisfiesPercent: 100, justification: "Lina Bergman är WCAG-expert och genomförde det framgångsrika WCAG-arbetet för Stockholms stads portal 2023.", sourceCVs: ["Lina Bergman"] },
              { requirementIndex: 2, satisfiesPercent: 70, justification: "Svea besitter automatisk testning i pipelines, men saknar en uttrycklig fullt dedikerad QA-ledare i databasen.", sourceCVs: ["Jonas Dahl"] }
            ];
          } else if (tenderObj.id === "tender-4") {
            // AI
            score = 35;
            reasons = "Svea har en begränsad matchning i denna upphandling eftersom er profil primärt fokuserar på utveckling, molninfrastruktur och agile, snarare än modern Generativ AI och LLM-modeller.";
            strengths = [
              "Erfarenhet av säkra API-integrationer och myndighetsregelverk."
            ];
            risks = [
              "Ingen av bolagets nuvarande anställda har dokumenterad erfarenhet inom LLM, prompt engineering eller AI Act."
            ];
            checklist = [
              { requirementIndex: 15, satisfiesPercent: 20, justification: "Inga dokumenterade projekt eller kompetenser hittades inom LLM eller Prompt Engineering i CV-databasen.", sourceCVs: [] },
              { requirementIndex: 20, satisfiesPercent: 30, justification: "Svea följer allmänna dataskyddsregler men saknar specifik policy eller expertis kring etisk AI och AI Act.", sourceCVs: [] }
            ];
          } else {
            // General support
            score = 75;
            reasons = "Svea matchar väl på kraven kring CI/CD och Terraform genom Jonas Dahls spetskompetens.";
            strengths = ["Jonas Dahl är Terraform specialist på toppnivå.", "Polismyndigheten är en befintlig nöjd kund till Jonas."];
            risks = ["Leverantören saknar dygnet-runt supportberedskap (24/7) i sin ordinarie policy."];
            checklist = [
              { requirementIndex: 0, satisfiesPercent: 100, justification: "Jonas Dahl har skrivit dussintals Terraform-moduler för säker infrastruktur.", sourceCVs: ["Jonas Dahl"] },
              { requirementIndex: 1, satisfiesPercent: 40, justification: "Svea har ingen dygnet-runt-support i sin ordinarie företagspolicy för 15 personer.", sourceCVs: [] },
              { requirementIndex: 2, satisfiesPercent: 80, justification: "Jonas Dahl har integrerat OAuth/SAML nätverkshärdning.", sourceCVs: ["Jonas Dahl"] }
            ];
          }
        } else {
          // Nordic AI Labs
          if (tenderObj.id === "tender-4") {
            score = 96;
            reasons = "Nordic AI Labs är en perfekt matchning för ärendehanteringen! Astrid Lindén är en av landets ledande experter på tillämpad NLP, Generativ AI och RAG-system för slutna och säkrade offentliga miljöer.";
            strengths = [
              "Astrid Lindéns unika erfarenhet av säkra LLM-lösningar i reglerade sektorer.",
              "Djupt metodologiskt fokus på etisk AI, bias-kontroll och förestående AI Act-compliance."
            ];
            risks = [
              "Ni är ett extremt nischat innovationsbolag och saknar generella infrastrukturresurser om kunden kräver bred förvaltning."
            ];
            checklist = [
              { requirementIndex: 0, satisfiesPercent: 100, justification: "Astrid Lindén har byggt skyddade LLM-assistenter och RAG-system åt storbanker senast 2023.", sourceCVs: ["Astrid Lindén"] },
              { requirementIndex: 1, satisfiesPercent: 100, justification: "Nordic AI Lab besitter färdiga mallar och ramverk för etisk AI-governance och proaktiv efterlevnad av AI Act.", sourceCVs: ["Astrid Lindén"] }
            ];
          } else {
            score = 42;
            reasons = "Genomgående låg matchning. Nordic AI Labs har expertis inom spjutspets-AI, men saknar bred frontend-kompetens (t.ex. React/WCAG) samt tunga agila coacher för stora ramavtal.";
            strengths = ["Astrid kan bidra på avancerad backend/RAG."];
            risks = ["Saknar React specialist.", "Saknar infrastrukturresurser för K8s on-premise.", "Endast 1 konsult tillgänglig i databasen."];
            checklist = [
              { requirementIndex: 0, satisfiesPercent: 30, justification: "Astrid jobbar främst i Python och saknar dokumenterad erfarenhet i modern React.", sourceCVs: [] },
              { requirementIndex: 1, satisfiesPercent: 50, justification: "Bolaget har standard säkerhetsprinciper men saknar systematik för traditionell webb-säkerhetskodgranskning.", sourceCVs: [] },
              { requirementIndex: 2, satisfiesPercent: 30, justification: "Astrid har driftsatt modeller i molnet men är ingen dedikerad K8s-arkitekt.", sourceCVs: [] }
            ];
          }
        }

        setMatchResults(prev => ({
          ...prev,
          [matchKey]: {
            winProbability: score,
            reasoning: reasons,
            strengths,
            risks,
            requirementsChecklist: checklist
          }
        }));
      })
      .finally(() => {
        setIsCalculatingMatch(false);
      });
  };

  // Run AI bid segment generator API
  const handleGenerateSectionText = (reqItem: any, index: number) => {
    if (currentTier === SubscriptionTier.BASIC) {
      showToast("AI-Skribenten ingår inte i din nuvarande Basic-licens! Uppgradera för att autogenerera svar.", "error");
      return;
    }
    
    if (!profile) {
      showToast("Vänligen lägg till eller välj ett företag i kunskapsbanken först.", "error");
      return;
    }

    setIsGeneratingSection(true);
    const matchKey = `${profile.companyName}-${selectedTender.id}`;
    const matchResult = matchResults[matchKey];
    const itemScore = matchResult?.requirementsChecklist.find(c => c.requirementIndex === index);

    fetch("/api/generate-bid-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementText: reqItem.text,
        companyProfile: profile,
        criteriaScore: itemScore
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Genereringsfel");
        const data = await res.json();
        
        setBidDrafts(prev => {
          const tenderDrafts = prev[selectedTender.id] || {};
          return {
            ...prev,
            [selectedTender.id]: {
              ...tenderDrafts,
              [reqItem.id]: {
                text: data.draft,
                isGenerating: false,
                history: [data.draft]
              }
            }
          };
        });
        showToast("Anbudssvar genererat i enlighet med bolagets Tone of Voice!", "success");
      })
      .catch((err) => {
        console.warn("Generation API Error, fabricating high quality fallback text, error:", err);
        // Generates an incredibly authentic contextual response matching Swedish procurement style
        const dummyDraftText = generateSwedishBidFallback(profile.companyName, reqItem.text, itemScore, profile);
        
        setBidDrafts(prev => {
          const tenderDrafts = prev[selectedTender.id] || {};
          return {
            ...prev,
            [selectedTender.id]: {
              ...tenderDrafts,
              [reqItem.id]: {
                text: dummyDraftText,
                isGenerating: false,
                history: [dummyDraftText]
              }
            }
          };
        });
        showToast("Anbudssvar genererat (Genom lokal källmatching)", "success");
      })
      .finally(() => {
        setIsGeneratingSection(false);
        setIsCurrentlyEditingInline(false);
      });
  };

  // Refine an existing draft with human-in-the-loop instructions
  const handleRefineSectionText = (reqItem: any, currentDraft: string) => {
    if (!userFeedbackText.trim()) return;
    setIsRefiningSection(true);

    fetch("/api/refine-bid-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementText: reqItem.text,
        currentDraft,
        feedback: userFeedbackText,
        companyProfile: profile
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Fel vid förfinande");
        const data = await res.json();
        
        setBidDrafts(prev => {
          const tenderDrafts = prev[selectedTender.id] || {};
          const itemDraft = tenderDrafts[reqItem.id] || { text: "", history: [] };
          const history = itemDraft.history ? [...itemDraft.history, data.draft] : [currentDraft, data.draft];
          
          return {
            ...prev,
            [selectedTender.id]: {
              ...tenderDrafts,
              [reqItem.id]: {
                text: data.draft,
                history
              }
            }
          };
        });
        setUserFeedbackText("");
        showToast("Svaret har justerats efter din feedback!", "success");
      })
      .catch((err) => {
        console.warn("Refinement API Error, doing smart client-side adjustment, error:", err);
        // Smart client side modification simulate
        const adaptedText = `${currentDraft}\n\n[JUSTERAT SVAR UTIFRÅN REKOMMENDATION: "${userFeedbackText}"]\nBeskrivningen har kompletterats för att fördjupa och betona hur vi systematiskt möter kraven samt drar nytta av vår ackumulerade kunskapsbank. Det säkrar full regelefterlevnad i alla delmoment.`;
        
        setBidDrafts(prev => {
          const tenderDrafts = prev[selectedTender.id] || {};
          const itemDraft = tenderDrafts[reqItem.id] || { text: "", history: [] };
          const history = itemDraft.history ? [...itemDraft.history, adaptedText] : [currentDraft, adaptedText];
          
          return {
            ...prev,
            [selectedTender.id]: {
              ...tenderDrafts,
              [reqItem.id]: {
                text: adaptedText,
                history
              }
            }
          };
        });
        setUserFeedbackText("");
        showToast("Justerat svar efter feedback (Simulerad)", "success");
      })
      .finally(() => {
        setIsRefiningSection(false);
        setIsCurrentlyEditingInline(false);
      });
  };

  // Generate Swedish fallback bids according to company Tone of Voice & resources
  const generateSwedishBidFallback = (companyName: string, reqText: string, itemScore: any, compProfile: CompanyProfile) => {
    const tone = compProfile.toneOfVoice;
    const pastWinningTheme = compProfile.pastWinningBiddingThemes?.[0] || "Generell leveranssäkerhet";
    const sourceCVNames = itemScore?.sourceCVs?.join(", ") || "";
    
    let keyPhrase = tone?.typicalPhrases?.[0] || "Vi säkerställer en robust leverans...";
    let text = `### 4. Svar på skallkrav: ${reqText.length > 50 ? reqText.substring(0, 50) + "..." : reqText}\n\n`;
    
    text += `${keyPhrase}\n\n`;
    text += `**${companyName}** uppfyller detta skallkrav till fullo. Vi baserar vår leveranskapacitet på vårt beprövade arbetssätt, vilket nyligen validerats i skarpa uppdrag med liknande kravprofiler. `;
    
    if (sourceCVNames) {
      text += `För att garantera ett optimalt genomförande allokerar vi våra namngivna nyckelresurser: **${sourceCVNames}**. `;
      // Add individual consultant context if matches
      const firstConsultant = compProfile.consultants.find(c => c.name === itemScore.sourceCVs[0]);
      if (firstConsultant) {
        text += `\n\n- **${firstConsultant.name}** (${firstConsultant.roles?.join(", ")}) erbjuder personlig spetskompetens genom bred erfarenhet av: *${firstConsultant.skills?.slice(0, 4).join(", ")}*. ${firstConsultant.bio} `;
      }
    } else {
      text += `Vi tillhandahåller ett skalbart specialistteam med gedigen erfarenhet av motsvarande komplexa åtaganden. `;
    }

    text += `\n\n#### Metodbeskrivning & Strategiskt utförande:\n`;
    text += `I linje med vår kärnfilosofi – *${pastWinningTheme}* – integrerar vi alltid strikt kvalitet och kontroll i alla led. Vi arbetar metodiskt i tvåveckors sprintar med regelbunden uppföljning och transparent kompetensöverföring till uppdragsgivaren.\n\n`;
    text += `Genom detta säkerställer vi att alla leveranser hålls på avtalad tid, med absolut högsta prestanda och i fullständig överensstämmelse med gällande nationella krav samt lagstadgade tillgänglighetsdirektiv.`;
    
    return text;
  };

  // Manual document insertion logic (ideal for sandboxed iframe)
  const handleInsertManualDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDocName.trim() || !manualDocText.trim()) {
      showToast("Vänligen fyll i både dokumentnamn och innehåll text.", "error");
      return;
    }

    const newDocId = `man-${Date.now()}`;
    const newDocIdWithFormat = manualDocName.toLowerCase().endsWith(".txt") ? manualDocName : `${manualDocName}.txt`;
    
    const newDoc: IngestedDocument = {
      id: newDocId,
      name: newDocIdWithFormat,
      type: manualDocType,
      content: manualDocText,
      size: `${(manualDocText.length / 1024).toFixed(1)} KB`
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    setManualDocName("");
    setManualDocText("");
    setCurrentPresetId("custom");
    
    showToast(`Dokumentet '${newDocIdWithFormat}' har lagts till i din isolerade fillagring.`, "success");

    // Automatically trigger comprehensive RAG profile analysis if API key allows
    setIsAnalyzing(true);
    fetch("/api/analyze-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: updatedDocs, companyNameSuggested: profile?.companyName || "Mitt Företag AB" })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Analys error");
        const parsed = await res.json();
        setProfile(parsed);
        showToast(`RAG-databasen uppdaterad! Ny kunskapsbank har räknats om utifrån '${newDocIdWithFormat}'.`, "success");
      })
      .catch((err) => {
        console.warn("Backend API not connected for custom document, simulating text integration on client:", err);
        // Dynamically add a custom consultant or competency dynamically if it looks like a CV!
        if (profile) {
          const isCV = manualDocType === "cv";
          const updatedCompetencies = isCV 
            ? Array.from(new Set([...profile.coreCompetencies, "Högpresterande tillskott"])) 
            : profile.coreCompetencies;
            
          const updatedConsultants = [...profile.consultants];
          if (isCV) {
            // Try to extract name
            const firstLine = manualDocText.split("\n")[0] || "Ny Konsult";
            const extractedName = firstLine.replace(/KONSULTPRFIL:|KONSULTPROFIL:|NAMN:/i, "").trim().substring(0, 20) || "Ny Expert";
            updatedConsultants.push({
              name: extractedName,
              roles: ["Specialistkonsult"],
              skills: ["React", "TypeScript", "Specialist"],
              bio: manualDocText.substring(0, 120) + "..."
            });
          }

          setProfile({
            ...profile,
            coreCompetencies: updatedCompetencies,
            consultants: updatedConsultants
          });
        }
        showToast("Kunskapsbank ombyggd offline utifrån nytt dokument.", "info");
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };

  // Remove a document
  const handleRemoveDocument = (id: string) => {
    const updated = documents.filter(doc => doc.id !== id);
    setDocuments(updated);
    showToast("Källdokument raderat från den isolerade bolagsmiljön.", "info");
    
    if (updated.length === 0) {
      setProfile(null);
    }
  };

  // Switch Selected Tender
  const handleSelectTender = (tender: Tender) => {
    setSelectedTender(tender);
    setActiveRequirementIndex(0);
    setIsCurrentlyEditingInline(false);
    setBidConsoleTab("editor");
    setViewingParagraphHistory(false);
    setSelectedHistoryVersionIndex(null);
    setExpandedSnapshotId(null);
    setSnapshotLabel("");
  };

  // Copy current active generated draft to clipboard
  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionId(id);
    setTimeout(() => setCopiedSectionId(null), 2500);
    showToast("Kopierat textdel till urklipp!", "success");
  };

  // Start inline editing of proposal draft text
  const startInlineEdit = (currentText: string) => {
    setEditingText(currentText);
    setIsCurrentlyEditingInline(true);
  };

  // Save current active inline edited draft
  const saveInlineEdit = (reqId: string) => {
    setBidDrafts(prev => {
      const tenderDrafts = prev[selectedTender.id] || {};
      const itemDraft = tenderDrafts[reqId] || { text: "", history: [] };
      const history = itemDraft.history ? [...itemDraft.history, editingText] : [editingText];
      
      return {
        ...prev,
        [selectedTender.id]: {
          ...tenderDrafts,
          [reqId]: {
            ...itemDraft,
            text: editingText,
            history
          }
        }
      };
    });
    setIsCurrentlyEditingInline(false);
    showToast("Svaret uppdaterades manuellt!", "success");
  };

  // Export full multi-requirement bid document
  const handleExportFullDocument = () => {
    const tenderDrafts = bidDrafts[selectedTender.id];
    if (!tenderDrafts || Object.keys(tenderDrafts).length === 0) {
      showToast("Inga genererade svar finns ännu för denna upphandling. Klicka på 'Generera' på skallkraven först!", "error");
      return;
    }

    let fullText = `# ANBUD: ${selectedTender.title}\n`;
    fullText += `## Beställare: ${selectedTender.authority}\n`;
    fullText += `## Datum: ${new Date().toLocaleDateString("sv-SE")}\n`;
    fullText += `## Leverantör: ${profile?.companyName || "AutoBid SaaS Partner"}\n\n`;
    fullText += `========================================================================\n\n`;

    selectedTender.requirements.forEach((req, idx) => {
      const draft = tenderDrafts[req.id];
      fullText += `### KRAV ${idx + 1}: ${req.text}\n\n`;
      if (draft && draft.text) {
        fullText += `${draft.text}\n\n`;
      } else {
        fullText += `*Inget svar genererat för detta krav ännu.*\n\n`;
      }
      fullText += `------------------------------------------------------------------------\n\n`;
    });

    // Simple browser download file routine trigger
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `Anbudssvar_${selectedTender.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast("Hela anbudsdokumentet (.txt) exporterades framgångsrikt!", "success");
  };

  // Save a historic snapshot of the current state of the whole bid
  const handleSaveBidSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) {
      showToast("Vänligen skriv en beskrivande etikett för denna snapshot.", "error");
      return;
    }

    const currentTenderDrafts = bidDrafts[selectedTender.id] || {};
    
    // Check if there is anything to capture
    const hasAnyDrafts = Object.keys(currentTenderDrafts).some(key => currentTenderDrafts[key]?.text);
    if (!hasAnyDrafts) {
      showToast("Det finns inga anbudssvar sparade ännu för att ta en snapshot av.", "error");
      return;
    }

    // Capture requirementId to text mapping
    const draftsMapping: { [requirementId: string]: string } = {};
    for (const reqId in currentTenderDrafts) {
      if (currentTenderDrafts[reqId]?.text) {
        draftsMapping[reqId] = currentTenderDrafts[reqId].text;
      }
    }

    const formatTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const newSnapshot = {
      id: `snap-${Date.now()}`,
      tenderId: selectedTender.id,
      label: snapshotLabel.trim(),
      timestamp: formatTime(new Date()),
      author: "Saman Akbarian (Säkerhetsansvarig)", // Dynamic user identification
      drafts: draftsMapping
    };

    setBidSnapshots(prev => {
      const list = prev[selectedTender.id] || [];
      return {
        ...prev,
        [selectedTender.id]: [newSnapshot, ...list]
      };
    });

    setExpandedSnapshotId(newSnapshot.id);
    setSnapshotLabel("");
    showToast(`Historisk snapshot '${newSnapshot.label}' sparad i den säkra audit-loggen!`, "success");
  };

  // Revert all draft elements to a specific snapshot
  const handleRevertBidToSnapshot = (snapshotId: string) => {
    const list = bidSnapshots[selectedTender.id] || [];
    const snapshot = list.find(s => s.id === snapshotId);
    if (!snapshot) return;

    setBidDrafts(prev => {
      const currentTenderDrafts = prev[selectedTender.id] || {};
      const updatedTenderDrafts: BidDraft = {};

      // Initialize all requirements in the tender with blank or previous versions
      selectedTender.requirements.forEach(req => {
        const textInSnapshot = snapshot.drafts[req.id] || "";
        const currentItem = currentTenderDrafts[req.id] || { text: "", history: [] };
        
        // Pushing to paragraph history to maintain full traceability
        const newHistory = textInSnapshot 
          ? (currentItem.history ? [...currentItem.history, textInSnapshot] : [textInSnapshot])
          : (currentItem.history || []);

        updatedTenderDrafts[req.id] = {
          ...currentItem,
          text: textInSnapshot,
          history: newHistory
        };
      });

      return {
        ...prev,
        [selectedTender.id]: updatedTenderDrafts
      };
    });

    setViewingParagraphHistory(false);
    setSelectedHistoryVersionIndex(null);
    showToast(`Hela anbudet har återställts till snapshoten "${snapshot.label}"!`, "success");
  };

  // Export a draft snapshot as a TXT file
  const handleExportSnapshot = (snapshotId: string) => {
    const list = bidSnapshots[selectedTender.id] || [];
    const snapshot = list.find(s => s.id === snapshotId);
    if (!snapshot) return;

    let fullText = `# HISTORISKT ANBUDSUTKAST UTIFRÅN SNAPSHOT: ${snapshot.label}\n`;
    fullText += `## Upphandling: ${selectedTender.title}\n`;
    fullText += `## Beställare: ${selectedTender.authority}\n`;
    fullText += `## Snapshot-Datum: ${snapshot.timestamp}\n`;
    fullText += `## Sparat av: ${snapshot.author}\n`;
    fullText += `## Återställd Leverantör: ${profile?.companyName || "AutoBid SaaS Partner"}\n\n`;
    fullText += `========================================================================\n\n`;

    selectedTender.requirements.forEach((req, idx) => {
      const text = snapshot.drafts[req.id];
      fullText += `### KRAV ${idx + 1}: ${req.text}\n\n`;
      if (text) {
        fullText += `${text}\n\n`;
      } else {
        fullText += `*Inget svar sparades för detta krav i detta utkast.*\n\n`;
      }
      fullText += `------------------------------------------------------------------------\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `Anbudssnapshot_${snapshot.label.replace(/\s+/g, "_")}_${snapshot.timestamp.replace(/[:\s]/g, "-")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast(`Anbudssnapshot exporterades framgångsrikt som en .txt-fil!`, "success");
  };


  // --- Computed Variables for current company & tender ---
  const activeMatchKey = profile ? `${profile.companyName}-${selectedTender.id}` : "";
  const currentMatchResult = matchResults[activeMatchKey];
  const winPercent = currentMatchResult ? currentMatchResult.winProbability : 30;
  const tenderDrafts = bidDrafts[selectedTender.id] || {};
  
  // Calculate completed requirement answers count
  const completedRequirementsCount = selectedTender.requirements.filter(req => tenderDrafts[req.id]?.text).length;
  const totalRequirementsCount = selectedTender.requirements.length;

  // Filter tenders of radar by search query
  const filteredTenders = MOCK_TENDERS.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="saas-container" className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-amber-500 selection:text-black">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 transform translate-y-0 text-xs backdrop-blur-md max-w-md ${
            toastMessage.type === "success" 
              ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/30 shadow-emerald-950/20" 
              : toastMessage.type === "error"
              ? "bg-rose-950/90 text-rose-300 border-rose-500/30 shadow-rose-950/20"
              : "bg-amber-950/90 text-amber-300 border-amber-500/30 shadow-amber-950/20"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
          {toastMessage.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />}
          {toastMessage.type === "info" && <Info className="h-5 w-5 text-amber-400 flex-shrink-0" />}
          <div className="flex-1 font-medium">{toastMessage.text}</div>
        </div>
      )}

      {/* TOP DECORATIVE COLOR STRIP */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

      {/* TOP NAVIGATION BAR */}
      <nav id="top-nav" className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F0F11] sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("radar")}>
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-lg flex items-center justify-center text-black font-extrabold shadow-md shadow-amber-500/10">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-none">AutoBid <span className="text-amber-500">SaaS</span></span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mt-0.5">Offentlig Upphandling</span>
            </div>
          </div>
          
          <div className="flex gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
            <button 
              id="tab-radar"
              onClick={() => setActiveTab("radar")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === "radar" ? "bg-amber-500 text-black shadow" : "text-slate-400 hover:text-white"}`}
            >
              Tender Radar
            </button>
            <button 
              id="tab-knowledge"
              onClick={() => setActiveTab("knowledge")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 relative ${activeTab === "knowledge" ? "bg-amber-500 text-black shadow" : "text-slate-400 hover:text-white"}`}
            >
              <span>Kunskapsbank (RAG)</span>
              {documents.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-black/10 text-slate-300 font-mono text-[9px] rounded-full border border-white/10">
                  {documents.length}
                </span>
              )}
            </button>
            <button 
              id="tab-pricing"
              onClick={() => setActiveTab("pricing")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === "pricing" ? "bg-amber-500 text-black shadow" : "text-slate-400 hover:text-white"}`}
            >
              Affärsmodell & Pris
            </button>
            <button 
              id="tab-about"
              onClick={() => { setActiveTab("about"); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === "about" ? "bg-amber-500 text-black shadow" : "text-slate-400 hover:text-white"}`}
            >
              Om AutoBid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current system status indicators */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${backendReady ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`}></span>
            <span>{backendReady ? "Gemini Server: Redo" : "Lokal Sandbox-koppling"}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Aktiv Plan:</span>
            <div 
              onClick={() => setActiveTab("pricing")}
              className={`cursor-pointer px-3 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-all duration-150 hover:bg-white/5 ${
                currentTier === SubscriptionTier.BASIC 
                  ? "bg-slate-800 text-slate-300 border-white/10" 
                  : currentTier === SubscriptionTier.PRO
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse"
              }`}
            >
              {currentTier === SubscriptionTier.BASIC && <Zap className="h-3 w-3 text-slate-400" />}
              {currentTier === SubscriptionTier.PRO && <Sparkles className="h-3 w-3 text-amber-500" />}
              {currentTier === SubscriptionTier.ENTERPRISE && <Award className="h-3 w-3 text-purple-400" />}
              <span>{currentTier}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE SUB-CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* TAB 1: MAIN TENDER RADAR & INTERACTIVE WORKSPACE */}
        {activeTab === "radar" && (
          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-0 overflow-y-auto md:overflow-hidden">
            
            {/* COLUMN 1: LEFT SIDEBAR TENDER RADAR LIST (Width 300px) */}
            <aside id="tender-radar-sidebar" className="w-full md:w-80 flex flex-col bg-[#0F0F11] flex-shrink-0 min-h-0 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-black/10">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Tender Radar</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live</span>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input 
                    id="input-search-tenders"
                    type="text" 
                    placeholder="Sök upphandlingar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black border border-white/10 rounded-lg text-xs placeholder:text-slate-600 font-medium text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Tender items stack */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredTenders.length === 0 ? (
                  <div className="p-6 text-center text-slate-600 text-xs font-medium">
                    Inga upphandlingar matchar din sökning.
                  </div>
                ) : (
                  filteredTenders.map((tender) => {
                    const isSelected = selectedTender.id === tender.id;
                    const calculatedKey = profile ? `${profile.companyName}-${tender.id}` : "";
                    const mResult = matchResults[calculatedKey];
                    const probability = mResult ? mResult.winProbability : null;

                    // Match tag coloring
                    let matchTagColor = "text-slate-500 bg-slate-500/10 border-slate-500/20";
                    if (probability !== null) {
                      if (probability >= 80) matchTagColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      else if (probability >= 50) matchTagColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      else matchTagColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    }

                    return (
                      <div
                        key={tender.id}
                        id={`tender-item-${tender.id}`}
                        onClick={() => handleSelectTender(tender)}
                        className={`p-4 border-l-4 transition-all duration-150 cursor-pointer ${
                          isSelected 
                            ? "bg-white/5 border-amber-500" 
                            : "border-transparent hover:bg-white/[0.02] hover:border-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1 text-[10px] font-mono">
                          <span className="text-slate-500 uppercase">#{tender.id}</span>
                          {probability !== null ? (
                            <span className={`px-2 py-0.5 rounded font-bold border ${matchTagColor}`}>
                              {probability}% MATCH
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-amber-500 bg-amber-500/5 border border-amber-500/10 text-[9px] font-bold">
                              RÄKNAR...
                            </span>
                          )}
                        </div>
                        <h3 className={`text-xs font-bold leading-snug mb-1.5 transition-colors ${isSelected ? "text-white" : "text-slate-300 hover:text-white"}`}>
                          {tender.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{tender.authority}</span>
                          <span className="text-slate-400">{tender.deadline}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Scanner stats status footer */}
              <div className="p-4 bg-black/40 border-t border-white/10 mt-auto text-[11px] text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Scannar 12 publika källor</span>
                </div>
                <span className="font-mono text-[10px]">v1.0.4-live</span>
              </div>
            </aside>

            {/* COLUMN 2: MAIN COMPONENT WORKSPACE / ACTIVE INTERACTIVE GENERATOR */}
            <main id="radar-workspace" className="flex-1 flex flex-col bg-[#121214] min-h-0 min-w-0 overflow-y-auto md:overflow-hidden relative pb-16 md:pb-0">
              
              {/* Header with active tender stats */}
              <header className="p-5 bg-[#0F0F11]/60 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold tracking-wider rounded border border-amber-500/20">
                      {selectedTender.category}
                    </span>
                    <span className="text-xs text-slate-500">Upphandlingsdokument</span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white mt-1.5 leading-snug">
                    {selectedTender.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 py-0.5">
                    <span className="font-semibold text-slate-300">{selectedTender.authority}</span>
                    <span className="text-slate-600">•</span>
                    <span>Värde:</span>
                    <span className="font-mono text-slate-300 font-bold">{selectedTender.budget}</span>
                    <span className="text-slate-600">•</span>
                    <span>Deadline:</span>
                    <span className="font-semibold text-amber-500">{selectedTender.deadline}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    id="btn-export-bid"
                    onClick={handleExportFullDocument}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/10 border border-amber-600"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Exportera anbud</span>
                  </button>
                </div>
              </header>

              {/* Split Workspace View */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                
                {/* SUB-SECTION A: REQUIREMENTS AND REQUIREMENTS SELECTOR LIST */}
                <section className="w-full lg:w-1/2 flex flex-col bg-[#121214] min-h-0">
                  <div className="p-3.5 bg-[#0F0F11]/40 border-b border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Myndighetens Kravspecifikation
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {completedRequirementsCount} av {totalRequirementsCount} besvarade
                    </span>
                  </div>

                  {/* Requirements index selectors */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="p-4 bg-amber-500/[0.02] border border-white/10 rounded-xl space-y-2 mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300 flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5 text-amber-500" />
                        <span>Beskrivning av uppdraget</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedTender.description}
                      </p>
                    </div>

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono h-3.5">
                      Specifika skallkrav (klicka för att besvara/analysera):
                    </div>

                    <div className="space-y-2.5">
                      {selectedTender.requirements.map((req, index) => {
                        const isSelected = activeRequirementIndex === index;
                        const matchItem = currentMatchResult?.requirementsChecklist.find(item => item.requirementIndex === index);
                        const hasDraft = !!tenderDrafts[req.id]?.text;

                        return (
                          <div
                            key={req.id}
                            id={`requirement-card-${req.id}`}
                            onClick={() => {
                              setActiveRequirementIndex(index);
                              setIsCurrentlyEditingInline(false);
                            }}
                            className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                              isSelected 
                                ? "bg-amber-500/[0.04] border-amber-500 ring-1 ring-amber-500/20" 
                                : "bg-black/20 border-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold font-mono uppercase text-amber-500">
                                SKALLKRAV {index + 1}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {matchItem && (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    matchItem.satisfiesPercent >= 90 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                                      : matchItem.satisfiesPercent >= 50 
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                                      : "bg-rose-500/10 text-rose-300 border border-rose-500/10"
                                  }`}>
                                    {matchItem.satisfiesPercent}% MATCH
                                  </span>
                                )}

                                {hasDraft ? (
                                  <span className="text-[9px] font-bold bg-green-500/25 border border-green-500/50 text-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <Check className="h-2.5 w-2.5" /> KLART
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.2 rounded">
                                    OBESVARAD
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-200 leading-relaxed font-medium">
                              "{req.text}"
                            </p>

                            {/* Resource mapping preview if matches */}
                            {matchItem && matchItem.sourceCVs.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <User className="h-3 w-3 text-amber-500/80" />
                                  <span>Matchade CV:n:</span>
                                  <span className="text-slate-200 font-semibold">{matchItem.sourceCVs.join(", ")}</span>
                                </div>
                                <span className="text-slate-500 italic">Isolerad data-routing</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* SUB-SECTION B: INTERACTIVE AI BID GENERATOR & REFINEMENT CONSOLE */}
                <section className="w-full lg:w-1/2 flex flex-col bg-[#161618] min-h-0 relative">
                  
                  {/* Panel view bar */}
                  <div className="p-3.5 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs flex justify-between items-center flex-shrink-0 select-none shadow-md">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 fill-black text-black" />
                      <span>AI Bid Generator & Audit System</span>
                    </span>
                    <span className="bg-black/10 text-slate-900 border border-black/10 px-2 py-0.5 rounded text-[10px] font-mono">
                      Tone: {profile?.toneOfVoice.styleDescription ? "Klonad (" + profile.companyName.split(" ")[0] + ")" : "Professionell"}
                    </span>
                  </div>

                  {/* SUB-TABS INTERACTIVE SHIELD COMPONENT */}
                  <div className="flex border-b border-white/10 bg-[#121214] text-xs flex-shrink-0">
                    <button
                      id="subtab-active-editor"
                      onClick={() => setBidConsoleTab("editor")}
                      className={`flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all ${
                        bidConsoleTab === "editor"
                          ? "border-amber-500 text-amber-500 bg-white/[0.02]"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ✍️ Aktivt Svar
                    </button>
                    <button
                      id="subtab-audit-snapshots"
                      onClick={() => setBidConsoleTab("snapshots")}
                      className={`flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all relative ${
                        bidConsoleTab === "snapshots"
                          ? "border-amber-500 text-amber-500 bg-white/[0.02]"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🛡️ Snapshots & Revision
                      {bidSnapshots[selectedTender.id]?.length > 0 && (
                        <span className="ml-1.5 px-2 py-0.2 bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[9.5px] rounded-full font-mono">
                          {bidSnapshots[selectedTender.id].length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* MAIN PANEL CONTENT VIEWPORT */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 pb-20">
                    
                    {/* TAB A: ACTIVE EDITOR TAB ROW */}
                    {bidConsoleTab === "editor" && (
                      <>
                        {/* Active Requirement statement Context */}
                        <div className="p-3.5 bg-[#0F0F11]/90 rounded-lg border border-white/5 text-xs text-slate-400 leading-relaxed text-left">
                          <div className="text-[10px] font-bold font-mono text-amber-500 uppercase tracking-wider mb-1">Fokus-Krav:</div>
                          "{selectedTender.requirements[activeRequirementIndex]?.text}"
                        </div>

                        {/* Check if user profile exists */}
                        {!profile ? (
                          <div className="p-8 text-center bg-[#0F0F11]/50 rounded-xl border border-dashed border-white/10 space-y-3">
                            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                            <h4 className="font-bold text-sm text-white">Ingen aktiv bolagsintelligent profil funnen</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              Vänligen ladda en demoprofil eller ladda upp dokument i fliken "Kunskapsbank" för att bygga RAG-kunskapsbasen!
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const activeReq = selectedTender.requirements[activeRequirementIndex];
                            if (!activeReq) return null;
                            const currentDraft = tenderDrafts[activeReq.id];

                            if (isGeneratingSection) {
                              return (
                                <div className="p-12 text-center space-y-4">
                                  <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-white">Autogenererar anbudssvar...</h4>
                                    <p className="text-xs text-slate-500 animate-pulse">
                                      Hämtar relevant CV-information och tillämpar din Tone of Voice-stilmall.
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            if (!currentDraft?.text) {
                              return (
                                <div className="p-8 py-12 text-center bg-[#0F0F11]/30 rounded-xl border border-white/5 space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                                    <Bot className="h-6 w-6" />
                                  </div>
                                  <div className="space-y-1 max-w-sm mx-auto">
                                    <h4 className="font-bold text-sm text-white">Inget utkast genererat än</h4>
                                    <p className="text-xs text-slate-400">
                                      Klicka på knappen nedan för att skriva ett förhandsutkast anpassat efter bolagets kunskapsbas och skrivstil.
                                    </p>
                                  </div>

                                  {currentTier === SubscriptionTier.BASIC ? (
                                    <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg max-w-sm mx-auto">
                                      <p className="text-[10px] text-rose-300 leading-tight border border-red-500/25 p-2 rounded">
                                        🔒 AI-skribenten är låst i **Basic (Radarn)**-planen. Uppgradera till **Pro** för att generera anbudssvar automatiskt!
                                      </p>
                                    </div>
                                  ) : null}

                                  <div>
                                    <button
                                      id="btn-generate-draft"
                                      onClick={() => handleGenerateSectionText(activeReq, activeRequirementIndex)}
                                      disabled={currentTier === SubscriptionTier.BASIC}
                                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all ${
                                        currentTier === SubscriptionTier.BASIC 
                                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                          : "bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/10"
                                      }`}
                                    >
                                      <Sparkles className="h-3.5 w-3.5 fill-current" />
                                      <span>Automatisera svar med {profile.companyName.split(" ")[0]} röst</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-4 text-left">
                                {/* Actions and Status indicators over draft text */}
                                <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-mono">
                                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    ISO27001-Validerat AI-Svar
                                  </span>
                                  
                                  <div className="flex gap-1.5">
                                    {currentDraft.history && currentDraft.history.length > 1 && (
                                      <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                                        Version {currentDraft.history.length}
                                      </span>
                                    )}
                                    <span className="bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5">
                                      {currentDraft.text.split(" ").length} ord
                                    </span>
                                  </div>
                                </div>

                                {/* Actual Draft Text container */}
                                <div className="relative group p-4 border border-white/10 bg-black/40 rounded-xl">
                                  
                                  {/* Overlay Quick Actions */}
                                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      id={`btn-copy-${activeReq.id}`}
                                      onClick={() => handleCopyToClipboard(activeReq.id, currentDraft.text)}
                                      className="p-1 px-2.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 shadow-sm transition-all"
                                      title="Kopiera text"
                                    >
                                      {copiedSectionId === activeReq.id ? (
                                        <>
                                          <Check className="h-3 w-3 text-emerald-400" />
                                          <span className="text-emerald-400">Kopierad</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          <span>Kopiera</span>
                                        </>
                                      )}
                                    </button>
                                    
                                    <button
                                      id={`btn-edit-inline-${activeReq.id}`}
                                      onClick={() => {
                                        if (isCurrentlyEditingInline) {
                                          setIsCurrentlyEditingInline(false);
                                        } else {
                                          startInlineEdit(currentDraft.text);
                                        }
                                      }}
                                      className={`p-1 px-2.5 rounded text-[10px] font-bold border flex items-center gap-1 shadow-sm transition-all ${
                                        isCurrentlyEditingInline 
                                          ? "bg-amber-500 text-black border-amber-500" 
                                          : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                                      }`}
                                      title="Redigera svar för hand"
                                    >
                                      <span>✍️ Redigera</span>
                                    </button>

                                    <button
                                      id={`btn-regenerate-${activeReq.id}`}
                                      onClick={() => handleGenerateSectionText(activeReq, activeRequirementIndex)}
                                      className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 shadow-sm transition-all"
                                      title="Skenerera om"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {isCurrentlyEditingInline ? (
                                    <div className="space-y-2 mt-4">
                                      <div className="text-[10px] font-bold uppercase text-amber-500 font-mono">Manuell editering:</div>
                                      <textarea
                                        id="textarea-inline-edit"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        rows={10}
                                        className="w-full p-3 bg-black border border-amber-500/30 rounded-lg text-xs leading-relaxed text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                                      />
                                      <div className="flex justify-end gap-2 text-xs">
                                        <button 
                                          id="btn-cancel-inline-edit"
                                          onClick={() => setIsCurrentlyEditingInline(false)}
                                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded font-bold text-white mb-0"
                                        >
                                          Avbryt
                                        </button>
                                        <button 
                                          id="btn-save-inline-edit"
                                          onClick={() => saveInlineEdit(activeReq.id)}
                                          className="px-3 py-1.5 bg-amber-500 text-black font-extrabold rounded hover:bg-amber-600 mb-0"
                                        >
                                          Spara ändringar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-line select-text font-normal pt-2">
                                      {currentDraft.text}
                                    </div>
                                  )}
                                </div>

                                {/* PARAGRAPH LEVEL REVISION AUDIT-LOG CONNECTOR */}
                                {currentDraft.history && currentDraft.history.length > 0 && (
                                  <div className="mt-4 border-t border-white/5 pt-4 space-y-2.5">
                                    <button
                                      id="btn-toggle-par-history"
                                      onClick={() => setViewingParagraphHistory(!viewingParagraphHistory)}
                                      className="flex items-center justify-between w-full px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] rounded-lg text-xs font-bold text-slate-300 border border-white/5 transition-all"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Svarshistorik & Versioner ({currentDraft.history.length} st)</span>
                                      </div>
                                      {viewingParagraphHistory ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </button>

                                    {viewingParagraphHistory && (
                                      <div className="bg-[#121214] p-3.5 rounded-lg border border-white/5 space-y-3 animate-fadeIn">
                                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-left">
                                          Klicka på en version nedan för att se exakta skillnader mot nuvarande text:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {currentDraft.history.map((histText, hIdx) => {
                                            const isSelected = selectedHistoryVersionIndex === hIdx;
                                            const isCurrent = hIdx === currentDraft.history.length - 1;
                                            
                                            return (
                                              <button
                                                key={hIdx}
                                                onClick={() => setSelectedHistoryVersionIndex(isSelected ? null : hIdx)}
                                                className={`px-2.5 py-1 text-[11px] rounded-md font-bold border transition-all ${
                                                  isSelected
                                                    ? "bg-amber-500 text-black border-amber-500"
                                                    : isCurrent 
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                                                }`}
                                              >
                                                v{hIdx + 1} {isCurrent ? "(Nuvarande)" : hIdx === 0 ? "(Original)" : ""}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {selectedHistoryVersionIndex !== null && (
                                          <div className="space-y-3 pt-3 border-t border-white/5 text-left">
                                            <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                                              <span className="text-[10.5px] font-mono text-amber-400 font-bold block">
                                                v{selectedHistoryVersionIndex + 1} vs Nuvarande (v{currentDraft.history.length})
                                              </span>
                                              
                                              {selectedHistoryVersionIndex !== currentDraft.history.length - 1 && (
                                                <button
                                                  id="btn-revert-version"
                                                  onClick={() => {
                                                    const textToRevert = currentDraft.history![selectedHistoryVersionIndex];
                                                    setBidDrafts(prev => {
                                                      const tenderDrafts = prev[selectedTender.id] || {};
                                                      const itemDraft = tenderDrafts[activeReq.id] || { text: "", history: [] };
                                                      const history = itemDraft.history ? [...itemDraft.history, textToRevert] : [textToRevert];
                                                      
                                                      return {
                                                        ...prev,
                                                        [selectedTender.id]: {
                                                          ...tenderDrafts,
                                                          [activeReq.id]: {
                                                            ...itemDraft,
                                                            text: textToRevert,
                                                            history
                                                          }
                                                        }
                                                      };
                                                    });
                                                    setSelectedHistoryVersionIndex(null);
                                                    showToast(`Framgångsrikt återfört svar till historiska version ${selectedHistoryVersionIndex + 1}!`, "success");
                                                  }}
                                                  className="px-2 py-1 bg-amber-500 text-black border border-amber-500 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 hover:bg-amber-600"
                                                >
                                                  <RefreshCw className="h-2.5 w-2.5 text-black" />
                                                  <span>Återställ till v{selectedHistoryVersionIndex + 1}</span>
                                                </button>
                                              )}
                                            </div>

                                            {/* Word Diff Visual Container */}
                                            <div className="bg-[#09090B] p-3 rounded-lg border border-white/5 max-h-60 overflow-y-auto text-left leading-relaxed text-xs">
                                              {computeWordDiff(currentDraft.history[selectedHistoryVersionIndex], currentDraft.text).map((part, pIdx) => {
                                                if (part.type === "added") {
                                                  return (
                                                    <span key={pIdx} className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-medium px-1 rounded hover:bg-emerald-900/30 transition-colors mx-0.5 inline" title="Lagt till">
                                                      {part.text}
                                                    </span>
                                                  );
                                                } else if (part.type === "removed") {
                                                  return (
                                                    <span key={pIdx} className="bg-rose-950/20 border border-rose-500/20 text-rose-400 line-through px-1 rounded opacity-60 hover:bg-rose-950/40 transition-colors mx-0.5 inline" title="Borttaget">
                                                      {part.text}
                                                    </span>
                                                  );
                                                } else {
                                                  return <span key={pIdx}>{part.text}</span>;
                                                }
                                              })}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-[9.5px] text-slate-500 font-mono">
                                              <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Gröna ord = Tillagda i nuvarande svar
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full line-through"></span> Röd-strykning = Borttaget i nuvarande svar
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* REFINEMENT BOX CHAT INTERACTION FROM INPUT */}
                                {currentTier !== SubscriptionTier.BASIC && (
                                  <section className="bg-black/30 p-4 border border-white/5 rounded-xl space-y-3">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                      <Bot className="h-3.5 w-3.5 text-amber-500" />
                                      <span>Förfina valet med AI-feedback</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                      Be roboten formulera om mer formellt, infoga fackbegrepp, eller komplettera data-referenser.
                                    </p>
                                    
                                    <div className="flex gap-2">
                                      <input
                                        id="input-feedback"
                                        type="text"
                                        placeholder="Skriv feedback... t.ex 'gör mer formell och ta bort säljsnack'"
                                        value={userFeedbackText}
                                        onChange={(e) => setUserFeedbackText(e.target.value)}
                                        disabled={isRefiningSection}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleRefineSectionText(activeReq, currentDraft.text);
                                        }}
                                        className="flex-1 bg-black/80 text-xs text-slate-100 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                                      />
                                      <button
                                        id="btn-send-feedback"
                                        onClick={() => handleRefineSectionText(activeReq, currentDraft.text)}
                                        disabled={isRefiningSection || !userFeedbackText.trim()}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-600 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center justify-center mb-0"
                                      >
                                        {isRefiningSection ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Send className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </section>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </>
                    )}

                    {/* TAB B: WHOLE-BID SNAPSHOTS AND AUDITING PORTAL */}
                    {bidConsoleTab === "snapshots" && (
                      <div className="space-y-4 text-left">
                        
                        <div className="p-4 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl space-y-1.5 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                            <ShieldCheck className="h-4 w-4 text-amber-500" />
                            <span>Säkrad Revision & Full-Bid Snapshots</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Systemet tillhandahåller fullständig oföränderlig audit-loggning för att trygga regelefterlevnad i upphandlingsprocessen. Spara en historisk snapshot av anbudets alla kravsvar för att revisionsgranska eller återställa dem i klump.
                          </p>
                        </div>

                        {/* Snapshot generation command board */}
                        <form onSubmit={handleSaveBidSnapshot} className="bg-black/30 p-4 border border-white/5 rounded-xl space-y-3.5 text-left">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            Frys nuvarande arbetsläge (Ta en ny Snapshot):
                          </label>
                          <div className="flex gap-2">
                            <input
                              id="input-snapshot-label"
                              type="text"
                              required
                              placeholder="Ange versionsetikett, t.ex. 'Draft v1.3 - Efter QA', 'Lina verifierad'..."
                              value={snapshotLabel}
                              onChange={(e) => setSnapshotLabel(e.target.value)}
                              className="flex-1 bg-black/80 text-xs text-slate-100 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                              id="btn-save-snapshot"
                              type="submit"
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow mb-0"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Frys & Spara</span>
                            </button>
                          </div>
                        </form>

                        {/* Snapshots log deck */}
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Revisionsregister (Audit Trail)</div>
                          
                          {(!bidSnapshots[selectedTender.id] || bidSnapshots[selectedTender.id].length === 0) ? (
                            <div className="p-8 text-center bg-black/20 rounded-xl border border-dashed border-white/5 text-slate-500 text-xs font-medium">
                              Inga historiska snapshots registrerade ännu. Det nuvarande utkastet är levande. Frys det ovan!
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {bidSnapshots[selectedTender.id].map((snap) => {
                                const isExpanded = expandedSnapshotId === snap.id;
                                const answeredCount = Object.keys(snap.drafts).length;
                                
                                return (
                                  <div 
                                    key={snap.id} 
                                    className={`rounded-xl border transition-all ${
                                      isExpanded 
                                        ? "bg-[#0F0F11] border-amber-500/30 ring-1 ring-amber-500/5 shadow-lg shadow-black/40" 
                                        : "bg-black/20 border-white/5 hover:border-white/10"
                                    }`}
                                  >
                                    {/* Collapsed top view of snapshot item */}
                                    <div 
                                      onClick={() => setExpandedSnapshotId(isExpanded ? null : snap.id)}
                                      className="p-3.5 flex items-center justify-between gap-4 cursor-pointer select-none"
                                    >
                                      <div className="flex gap-3 items-center min-w-0">
                                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg flex-shrink-0">
                                          <History className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                          <span className="font-bold text-white block text-xs truncate leading-tight" title={snap.label}>
                                            {snap.label}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-mono block mt-1 leading-none">
                                            Skapad: {snap.timestamp} • {snap.author}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[9.5px] font-bold px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-mono">
                                          {answeredCount} / {totalRequirementsCount} Delstycken
                                        </span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                      </div>
                                    </div>

                                    {/* Expanded comparison detail panel */}
                                    {isExpanded && (
                                      <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4 bg-black/40 rounded-b-xl animate-fadeIn">
                                        
                                        {/* Action controls for snapshot */}
                                        <div className="flex flex-wrap gap-2 justify-end">
                                          <button
                                            id={`btn-export-snap-${snap.id}`}
                                            onClick={() => handleExportSnapshot(snap.id)}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded text-[11px] flex items-center gap-1.5 transition-all mb-0"
                                          >
                                            <FileDown className="h-3.5 w-3.5" />
                                            <span>Ladda ner snapshot (.txt)</span>
                                          </button>
                                          <button
                                            id={`btn-revert-snap-${snap.id}`}
                                            onClick={() => handleRevertBidToSnapshot(snap.id)}
                                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500/20 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow mb-0"
                                          >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            <span>Reversera hela anbudet hit</span>
                                          </button>
                                        </div>

                                        {/* Requirement by requirement LCS word diff tables */}
                                        <div className="space-y-3.5">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                            Avvikelserapport (Detta utkast vs Levanade anbudssvar):
                                          </div>
                                          
                                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                            {selectedTender.requirements.map((req, rIdx) => {
                                              const snapText = snap.drafts[req.id] || "";
                                              const activeText = tenderDrafts[req.id]?.text || "";
                                              const isSame = snapText === activeText;
                                              
                                              return (
                                                <div key={req.id} className="p-3 bg-black/50 rounded-lg border border-white/5 space-y-2 text-xs">
                                                  <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                                                    <span className="font-bold text-amber-500 font-mono">
                                                      STYCKKRAV {rIdx + 1}: "{req.text.substring(0, 45)}..."
                                                    </span>
                                                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                                                      isSame 
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                                                    }`}>
                                                      {isSame ? "Identisk" : "Utestående revision"}
                                                    </span>
                                                  </div>

                                                  {/* LCS Visual Diff panel */}
                                                  <div className="p-2.5 bg-[#080809] border border-white/5 rounded text-[11px] text-slate-300 leading-relaxed font-normal whitespace-pre-line text-left">
                                                    {(!snapText && !activeText) ? (
                                                      <span className="text-slate-600 italic">Inget svar genererat för detta stycke i varken denna snapshot eller live-anbudet.</span>
                                                    ) : (
                                                      computeWordDiff(snapText, activeText).map((part, pIdx) => {
                                                        if (part.type === "added") {
                                                          return (
                                                            <span key={pIdx} className="bg-[#0f291e] border-b border-emerald-500/30 text-emerald-300 font-medium px-0.5 rounded cursor-help inline" title="Lagt till i nuvarande">
                                                              {part.text}
                                                            </span>
                                                          );
                                                        } else if (part.type === "removed") {
                                                          return (
                                                            <span key={pIdx} className="bg-[#2d0f14] border-b border-rose-500/20 text-rose-300 line-through px-0.5 rounded opacity-60 cursor-help inline" title="Borttaget i nuvarande (historisk text)">
                                                              {part.text}
                                                            </span>
                                                          );
                                                        } else {
                                                          return <span key={pIdx}>{part.text}</span>;
                                                        }
                                                      })
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>

                  {/* PROMPT FLOATING INFO BOX ON THE FOOTER */}
                  <div className="absolute bottom-4 left-4 right-4 h-12 bg-amber-500/[0.02] border border-dashed border-amber-500/20 rounded-lg flex items-center justify-between px-3 text-[10px] text-slate-400 pointer-events-none md:flex z-10 backdrop-blur-md">
                    <span className="flex items-center gap-1 font-medium select-none">
                      <Bot className="h-3 w-3 text-amber-500" />
                      Client: <strong className="text-slate-300">{profile?.companyName || "Ej ansluten"}</strong>
                    </span>
                    <span>• Revision Säkrad • SOC-2 Type II •</span>
                    <span className="text-amber-500 font-bold">100% säkrat mot dataläckage</span>
                  </div>
                </section>
              </div>
            </main>

            {/* COLUMN 3: RIGHT PANEL STATS & ACCUMULATED PROFILE KNOWLEDGE SUMMARY (Width 250px) */}
            <aside id="workspace-sidebar-right" className="w-full md:w-64 border-l border-white/10 bg-[#0F0F11] p-5 space-y-6 flex-shrink-0 min-h-0 overflow-y-auto">
              
              {/* SECTION: WIN PROBABILITY SCORE (Match gauge) */}
              <section id="win-probability-section" className="space-y-3.5 text-center p-4 bg-black/30 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center text-left">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Vinstchans</h2>
                  <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded uppercase font-mono">Skattad</span>
                </div>
                
                <div className="relative flex items-center justify-center py-2">
                  {/* Gauge indicator graphics */}
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="48" 
                      stroke="currentColor" 
                      strokeWidth="7" 
                      fill="transparent" 
                      className="text-white/[0.04]" 
                    />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="48" 
                      stroke="currentColor" 
                      strokeWidth="7" 
                      fill="transparent" 
                      strokeDasharray="301" 
                      strokeDashoffset={301 - (301 * winPercent) / 100}
                      className="text-amber-500 transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-white font-mono tracking-tighter">
                    {winPercent}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 italic leading-snug text-left border-t border-white/5 pt-2">
                  {currentMatchResult?.reasoning || "Välj ett bolag i kunskapsbanken och starta källscanningen för att skatta vinstchansen."}
                </p>
              </section>

              {/* TONE OF VOICE METRICS BAR */}
              <section className="space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Tone of Voice</h2>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Röst-matchning:</span>
                    <span className="text-[10px] text-amber-500 font-bold uppercase font-mono">Klonad & Aktiv</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-700" 
                      style={{ width: profile ? "92%" : "0%" }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                    "{profile?.toneOfVoice.styleDescription || 'Saknar kalibrerad profil'}"
                  </p>
                </div>
              </section>

              {/* KNOWLEDGE BANK DIRECTORIES COUNT SUMMARY */}
              <section className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Inläst rumsdata</h2>
                  <button 
                    onClick={() => setActiveTab("knowledge")} 
                    className="text-[10px] text-amber-500 hover:underline font-bold"
                  >
                    Hantera
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 text-xs space-y-1">
                    <span className="text-slate-400 block font-semibold">Anslutet Bolag:</span>
                    <span className="text-white font-bold text-xs truncate block">{profile?.companyName || "Saknas"}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        CV:n / Konsultprofiler:
                      </span>
                      <span className="text-white font-bold font-mono">{documents.filter(d => d.type === "cv").length}x</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Vinnande anbud (RAG):
                      </span>
                      <span className="text-white font-bold font-mono">{documents.filter(d => d.type === "past_bid").length}x</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Övrigt (Presentationer):
                      </span>
                      <span className="text-white font-bold font-mono">{documents.filter(d => d.type === "presentation").length}x</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTION STRENGTH & RISK SUMMARY ITEMS CARD */}
              {currentMatchResult && (
                <section className="space-y-3 pt-2">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Analysdetaljer</h2>
                  
                  {currentMatchResult.strengths.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase font-mono">Våra Styrkor:</span>
                      <ul className="text-[10px] text-slate-400 space-y-1 list-disc list-inside leading-tight">
                        {currentMatchResult.strengths.slice(0, 2).map((str, i) => (
                          <li key={i} className="truncate" title={str}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentMatchResult.risks.length > 0 && (
                    <div className="space-y-1 pt-1.5">
                      <span className="text-[9px] font-bold text-amber-500 uppercase font-mono">Gaps / Risker:</span>
                      <ul className="text-[10px] text-slate-400 space-y-1 list-disc list-inside leading-tight">
                        {currentMatchResult.risks.slice(0, 2).map((risk, i) => (
                          <li key={i} className="truncate text-rose-300" title={risk}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </aside>

          </div>
        )}

        {/* TAB 2: KNOWLEDGE BASE CONFIGURATION & RAG ONBOARDING DETAILED */}
        {activeTab === "knowledge" && (
          <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8 overflow-y-auto">
            
            {/* Header description card */}
            <div className="p-6 bg-gradient-to-r from-[#0F0F11] to-[#161618] rounded-2xl border border-white/10 space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-radial-gradient from-amber-500/10 to-transparent pointer-none"></div>
              
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-md bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold">
                  SECURE TENANT ISOLATION
                </span>
                <span className="text-xs text-slate-500">● GDPR-kompatibel datakraft</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white">Kunskapsinjektion & Tone of Voice-kloning</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                För att er AutoBid-anbudsrobot ska leverera optimala resultat krävs specifik kännedom om er verksamhet.
                Ladda upp era konsulters CV:n (för automatisk kravmatchning), företagets säljande presentationer och historiska framgångsrika anbudsmaterial. Vår backend bygger upp en säker isolerad RAG-databas och kalibrerar AI:n efter er säljarstil.
              </p>
            </div>

            {/* Quick Presets Toggle Panel - IMPORTANT for immediate interactive demonstration */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                Snabbstarta demo-scenarier (Klicka för att växla bolagsdatabas):
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_COMPANIES.map((company) => {
                  const isCurrent = currentPresetId === company.id;
                  
                  return (
                    <div
                      key={company.id}
                      onClick={() => handleLoadDemoCompany(company.id)}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left relative ${
                        isCurrent 
                          ? "bg-amber-500/[0.04] border-amber-500 ring-1 ring-amber-500/20" 
                          : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white">{company.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full font-mono uppercase">
                            AKTIV PROFIL INDRAGEN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-500 font-medium mb-2 italic">
                        "{company.tagline}"
                      </p>
                      <p className="text-xs text-slate-400 leading-snug">
                        {company.description}
                      </p>
                      <div className="mt-3.5 flex items-center gap-3 text-[10px] text-slate-500 pt-3.5 border-t border-white/5">
                        <span>Laddar {company.documents.length} källdokument</span>
                        <span>•</span>
                        <span>Automatisk Tone of Voice konfigurerad</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main File Management Cockpit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box A: Document Ingestion Drop Area + Form (Left side) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Simulated Drag and Drop with Pasting Form option */}
                <form onSubmit={handleInsertManualDocument} className="bg-[#0F0F11] rounded-2xl border border-white/10 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5 text-amber-500" />
                    <span>Ladda upp källdata (CV eller Framgångsrikt anbud)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Dokumentnamn (t.ex. CV_Anna_Svensson)
                      </label>
                      <input 
                        id="input-manual-doc-name"
                        type="text"
                        placeholder="Namnge din fil..."
                        value={manualDocName}
                        onChange={(e) => setManualDocName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Dokument-typ
                      </label>
                      <select 
                        id="select-manual-doc-type"
                        value={manualDocType}
                        onChange={(e: any) => setManualDocType(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="cv">Konsult CV / Erfarenheter (.txt)</option>
                        <option value="past_bid">Vinnande anbud / Referensfall (.txt)</option>
                        <option value="presentation">Företagsbeskrivning / Policy (.txt)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Innehåll text (kopiera texten från ditt dokument hit)
                    </label>
                    <textarea 
                      id="textarea-manual-doc-text"
                      rows={6}
                      placeholder="Klistra in råtext här..."
                      value={manualDocText}
                      onChange={(e) => setManualDocText(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono leading-relaxed placeholder:text-slate-700"
                    />
                  </div>

                  {isAnalyzing ? (
                    <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center gap-2 text-xs text-amber-500 font-bold border border-white/5">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Bygger om isolerat kunskapsträd...</span>
                    </div>
                  ) : (
                    <button 
                      id="btn-add-manual-doc"
                      type="submit"
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Slutför kunskapsinjektion</span>
                    </button>
                  )}
                </form>

                {/* File list database view */}
                <div className="bg-[#0F0F11] rounded-2xl border border-white/10 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Kunskapsdatabas: Lagrade filer ({documents.length})</span>
                    <span className="text-[10px] font-mono text-slate-500">Säkrad isolering: SOC2-Type II</span>
                  </h3>

                  <div className="space-y-2.5">
                    {documents.length === 0 ? (
                      <div className="p-6 text-center text-slate-600 text-xs font-medium">
                        Inga lagrade filer just nu. Bolagets robot kan ingenting än!
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div 
                          key={doc.id} 
                          id={`user-doc-${doc.id}`}
                          className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-4 text-xs hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              doc.type === "cv" 
                                ? "bg-amber-500/10 text-amber-500" 
                                : doc.type === "past_bid"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="font-bold text-slate-200 block truncate leading-tight" title={doc.name}>
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase font-mono mt-0.5 inline-block">
                                {doc.type === "cv" ? "Konsultprofil" : doc.type === "past_bid" ? "Tidigare Anbudssvar" : "Policy / Pitch"}
                                <span className="mx-1">•</span>
                                {doc.size}
                              </span>
                            </div>
                          </div>

                          <button
                            id={`btn-delete-doc-${doc.id}`}
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all flex-shrink-0"
                            title="Radera fil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Box B: Calculated parsed company profile info page card (Right side) */}
              <div className="space-y-4">
                <div className="bg-[#0F0F11] rounded-2xl border border-white/10 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-left">
                    Analys-Resultat (Isolerad profil)
                  </h3>

                  {profile ? (
                    <div className="space-y-4 text-left">
                      <div className="pb-3 border-b border-white/5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Detekterat bolagsnamn</span>
                        <span className="text-sm font-bold text-white block mt-1">{profile.companyName}</span>
                      </div>

                      <div className="space-y-1.5 pb-3 border-b border-white/5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Identifierad kärnkompetens</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {profile.coreCompetencies?.map((comp, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-semibold text-slate-300 border border-white/5">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pb-3 border-b border-white/5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Klonad skrivprofil (Tone of Voice)</span>
                        <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-2">
                          <p className="text-[11px] leading-relaxed text-slate-300 italic">
                            "{profile.toneOfVoice.styleDescription}"
                          </p>
                          <div className="space-y-1 pt-1 border-t border-white/5">
                            <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Beteendeadjektiv:</span>
                            <ul className="text-[10px] text-slate-400 space-y-1 list-disc list-inside">
                              {profile.toneOfVoice.clonedDirectives?.slice(0, 3).map((rule, idx) => (
                                <li key={idx} className="truncate" title={rule}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {profile.consultants && profile.consultants.length > 0 && (
                        <div className="">
                          <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Konsultresurser ({profile.consultants.length})</span>
                          <div className="mt-2 space-y-2">
                            {profile.consultants.map((con, idx) => (
                              <div key={idx} className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-xs">
                                <div className="flex justify-between items-center font-bold text-white">
                                  <span>{con.name}</span>
                                  <span className="text-[10px] text-amber-500 font-medium">{con.roles?.[0]}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-snug mt-1">{con.bio}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-600 text-xs font-medium space-y-2">
                      <Cpu className="h-8 w-8 text-slate-800 mx-auto" />
                      <p>Ingen profil beräknad ännu. Lägg till CV/anbud till vänster för att automatisera profilering.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: BUSINESS AND PRICING PLAN CARDS */}
        {activeTab === "pricing" && (
          <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8 overflow-y-auto">
            
            {/* Embedded module */}
            <PricingModule 
              currentTier={currentTier}
              onSelectTier={(tier) => {
                setCurrentTier(tier);
                showToast(`Nivå uppdaterad till ${tier}! Gränssnittet har kalibrerats automatiskt.`, "success");
              }}
            />

            {/* Simulated credit card mock alert info */}
            <div className="bg-[#0F0F11]/80 rounded-2xl p-5 border border-white/5 space-y-3 max-w-2xl mx-auto text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                <Bot className="h-4 w-4 text-amber-500" />
                <span>Affärs- och ROI Analys för Testkunder:</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Genom att automatisera anbudsanalyser och CV-matchningar sparar bolag i snitt <strong>12-15 timmar dygnet runt per anbud</strong>. Vår affärsmodell är utformad för att ge ett direkt mervärde på över 10x licenskostnaden redan från de tidigaste testscenarierna. 
              </p>
              <div className="pt-2 text-[11px] text-slate-500 italic block border-t border-white/5">
                ● Basic-kontot ger tillgång till bevakning (Radar). <br />
                ● Pro-kontot ger full AI textformulering med skrivstilsanalytiker. <br />
                ● Enterprise stöder underkonsulter för nätverk och obegränsat antal CV.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ABOUT THE PLATFORM */}
        {activeTab === "about" && (
          <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6 overflow-y-auto text-left">
            <h2 className="text-2xl font-bold text-white">Om AutoBid – Hur fungerar det under huven?</h2>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              AutoBid SaaS är skräddarsydd för konsultföretag, hantverkare, byggbolag och IT-byråer som säljer sina tjänster till offentliga myndigheter via offentliga upphandlingar. 
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="p-4 bg-[#0F0F11] border border-white/5 rounded-xl space-y-2">
                <span className="text-xs font-bold font-mono text-amber-500 uppercase">1. Dataseparering</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Företag A:s anbud, CV:n och prissättningsmodeller sparas i en isolerad tenant-miljö och skickas aldrig till Företag B. Säkrat med SOC-2 protokoll.
                </p>
              </div>

              <div className="p-4 bg-[#0F0F11] border border-white/5 rounded-xl space-y-2">
                <span className="text-xs font-bold font-mono text-amber-500 uppercase">2. RAG & Indexering</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Vi tokeniserar CV:n och lagar referenser. Genom Retrieval Augmented Generation (RAG) kopplas skallkraven till lämpliga konsulters expertis direkt.
                </p>
              </div>

              <div className="p-4 bg-[#0F0F11] border border-white/5 rounded-xl space-y-2">
                <span className="text-xs font-bold font-mono text-amber-500 uppercase">3. Persona-kalibrering</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Vi analyserar stilen i tidigare vinnande anbud och instruerar språkmodellen att klona bolagets stil i de autogenererade anbudssvaren.
                </p>
              </div>
            </div>

            <div className="bg-[#0F0F11] border border-white/10 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Vanliga Frågor vid Onboarding</h3>
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <div>
                  <strong className="text-white block mb-0.5">Vad är "Win Probability Score"?</strong>
                  Vår AI utvärderar skallkraven mot bolagets samlade CV-filer och ger en direkt procentuell skattning på chansen att lyckas, vilket hindrar obetalda slöseri-timmar på döda uppdrag.
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Kan jag exportera mina färdiga dokument?</strong>
                  Ja, du kan enkelt exportera de färdigställda svarsstyckena rad-för-rad eller ladda ner det fulla dokumentet anpassat i rent textformat för att klistra in i TendSign eller motsvarande system.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
