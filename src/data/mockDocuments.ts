import { IngestedDocument } from "../types";

export interface DemoCompanyPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  documents: Omit<IngestedDocument, "id">[];
}

export const DEMO_COMPANIES: DemoCompanyPreset[] = [
  {
    id: "svea-consulting",
    name: "Svea Cloud & Code AB",
    tagline: "Ledande experter på modern molninfrastruktur och frontend-arkitektur",
    description: "Svea Cloud & Code är en etablerad byrå med 15 konsulter baserade i Stockholm. De är experter på avancerade webbapplikationer, säkra Kubernetes-kluster och agil projektledning inom offentlig sektor.",
    documents: [
      {
        name: "CV_Lina_Bergman_Seniordeveloper.txt",
        type: "cv",
        size: "3.4 KB",
        content: `KONSULTPRFIL: Lina Bergman
ROLL: Senior Frontendutvecklare & UI/UX-arkitekt
ERFARENHET: 8 år (specialist på React och TypeScript)

SAMMANFATTNING:
Lina är en passionerad frontendutvecklare som bygger vackra, blixtsnabba och gränssnitt tillgängliga för alla. Hon har stark passion för typografi och strikt tillämpning av WCAG 2.1 AA/AAA tillgänglighet inom offentlig sektor.

NYCKELKOMPETENSER:
- Frontend: React, TypeScript, Tailwind CSS, Next.js, Redux, State Management
- Tillgänglighet: WCAG 2.1 AA specialist, a11y-auditeringar, skärmläsar-optimeringar
- Verktyg: Vite, Webpack, Jest, Cypress, Git, Figma

RELEVANTA UPPDRAG:
1. Stockholms Stad (2023-2024): Ansvarig frontend-utvecklare för 'Mina Sidor'. Implementerade WCAG-anpassat gränssnitt med React/TypeScript vilket drastiskt ökade användarnöjdheten.
2. Skatteverket (2021-2022): Utvecklade interna deklarationstjänster med strikt färgkontrast och tangentbordsnavigering.`
      },
      {
        name: "CV_Jonas_Dahl_Cloudarchitect.txt",
        type: "cv",
        size: "4.1 KB",
        content: `KONSULTPROFIL: Jonas Dahl
ROLL: Senior Cloud Architect & DevSecOps specialist
ERFARENHET: 12 år (Kubernetes, AWS, Säkerhet)

SAMMANFATTNING:
Jonas är en djupt erfaren arkitekt som specialiserat sig på säkra molnmiljöer i offentlig sektor där data-säkerhet och GDPR-efterlevnad är kritiskt. Han har byggt dussintals automatiserade CI/CD pipelines med inbyggd säkerhetsskanning.

NYCKELKOMPETENSER:
- Moln & Containrar: Kubernetes (K8s), AWS, Azure, Docker, Openshift
- DevSecOps: Terraform, GitHub Actions, GitLab CI, OWASP säkerhetsskanning, SonarQube
- Säkerhet: Federal inloggning, SAML 2.0, OAuth, GDPR-compliance, VPN-tunnelering

RELEVANTA UPPDRAG:
1. Polismyndigheten (2024): Designade en isolerad Kubernetes-miljö on-premise baserad på säkerhetsprinciper för känslig data. Utvecklade Terraform-moduler för automatiserad nätverkshärdning.
2. Försäkringskassan (2022-2023): Migrerade legacy-tjänster till ett lokalt Openshift-kluster för att säkra EU-suveränitet.`
      },
      {
        name: "CV_Carl_Sundqvist_Agilecoach.txt",
        type: "cv",
        size: "2.9 KB",
        content: `KONSULTPROFIL: Carl Sundqvist
ROLL: Senior Agile Coach & Scrum Master
ERFARENHET: 9 år (Agila metoder, teamkoordinering)

SAMMANFATTNING:
Carl har bred erfarenhet av att leda högpresterande utvecklingsteam i agila ramverk som Scrum, Kanban och storskaligt SAFe. Han brinner för kontinuerlig kompetensöverföring och att eliminera flaskhalsar i leveransprocessen.

NYCKELKOMPETENSER:
- Agilt ledarskap: Scrum Master certifierad (PSM II), SAFe Agilist, Kanban-coachning
- Projektledning: Jira, Confluence, Trello, agila mått (Velocity, Burndown)
- Facilitering: Sprintplanering, retrospektiv, demo, intressenthantering

RELEVANTA UPPDRAG:
1. Arbetsförmedlingen (2023): Verkade som Scrum Master för två distribuerade utvecklingsteam. Ökade team-leveransen med 30% genom att införa tydliga Definition of Done samt agila kvalitetsmöten.`
      },
      {
        name: "Vinnande_Anbud_Bolagsbeskrivning_Svea.txt",
        type: "past_bid",
        size: "5.2 KB",
        content: `Svea Cloud & Code AB arbetar metodiskt för att säkerställa högsta kvalitet i alla offentliga leveranser. Vi tillämpar i regel tre bärande pelare:

1. METODISK SÄKERHET OCH KODGRANSKNING:
Vi introducerar alltid 'Säkerhet från första kodraden'. All kod granskas kollegialt (Pull Requests) och passerar genom automatiska tester och sårbarhetsanalys (OWASP) i våra DevSecOps-pipelines innan drift. Vi dokumenterar systemarkitektur enligt ISO 27000 principer.

2. ENKLARE SAMARBETE GENOM AGIL KVALITETSSTYRNING:
Vi arbetar uteslutande med agila, iterationer (sprintar om 2 veckor) där myndigheten bjuds in till kontinuerliga demon. Den agila leveransen backas upp av strukturerade kompetensöverföringsmöten, så att kunden aldrig blir beroende av oss som enskild part. Vi bygger robusta dokumentationer direkt i wiki eller kodkommentering.

3. TILLGÄNGLIGHET SOM STANDARDFUNKTION:
Vi anser att tillgängliga gränssnitt är lag. Vi utvecklar med robust semantisk HTML, testar regelbundet med skärmläsare och säkerställer kontrastförhållanden för all text utifrån WCAG 2.1 AA direkt från designfas. Det säkerställer medborgarnyttan.`
      }
    ]
  },
  {
    id: "nordic-ai",
    name: "Nordic AI Labs AB",
    tagline: "Svenska pionjärer inom anpassade röst- och AI-lösningar",
    description: "Nordic AI Labs är ett innovationsbolag som specialiserat sig på integration av storskaliga språkmodeller, maskininlärning och utveckling av egna etiska AI-modeller för den svenska marknaden.",
    documents: [
      {
        name: "CV_Astrid_Linden_AIarchitect.txt",
        type: "cv",
        size: "3.8 KB",
        content: `KONSULTPROFIL: Astrid Lindén
ROLL: Senior AI Architect & NLP Expert
ERFARENHET: 7 år (Generativ AI, Machine Learning)

SAMMANFATTNING:
Astrid är en nationellt erkänd expert på tillämpad Generativ AI och NLP (Natural Language Processing). Hon har byggt anpassade AI-assistenter till banker, finansiella institut och utvecklat robusta RAG-system som tål känslig databehandling.

NYCKELKOMPETENSER:
- AI/ML: Large Language Models (LLM), Generative AI, RAG (Retrieval-Augmented Generation), Prompt Engineering
- Programmering: Python, PyTorch, HuggingFace, FastAPI, Langchain
- Säkerhet: Etisk AI, förhindrande av hallucinationer, data-maskning

RELEVANTA UPPDRAG:
1. SEB (2023-2024): Integrerade säkra språkmodeller med bankens interna kunskapskällor och implementerade strikt säkerhetslager för att maskera känsliga personuppgifter.`
      }
    ]
  }
];
