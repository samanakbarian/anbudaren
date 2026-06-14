import { Tender } from "../types";

export const MOCK_TENDERS: Tender[] = [
  {
    id: "tender-1",
    title: "Seniora Systemutvecklare & Cloudarkitekter",
    authority: "Skatteverket (IT-avdelningen)",
    description: "Skatteverket söker en ramavtalspartner för löpande utveckling av säkra e-tjänster i deras privata molnmiljö. Arbetet omfattar backend- samt frontend-utveckling med mycket höga krav på tillgänglighet, säkerhet och automatiserade tester.",
    budget: "4 800 000 SEK",
    deadline: "2026-07-20",
    category: "IT-konsulttjänster",
    requirements: [
      {
        id: "req-1-1",
        text: "Offererade konsulter måste ha minst 5 års erfarenhet av frontend-utveckling i React samt modern TypeScript."
      },
      {
        id: "req-1-2",
        text: "Leverantören ska beskriva sina etablerade rutiner för säker applikationsutveckling (t.ex. OWASP Top 10) och kodgranskning."
      },
      {
        id: "req-1-3",
        text: "Erfarenhet av molninfrastruktur, specifikt automatiserad orkestrering med Kubernetes (K8s) samt privat datalagring inom EU."
      },
      {
        id: "req-1-4",
        text: "Metodbeskrivning: Hur leverantören säkrar agila leveranser (Scrum/SAFe) och kontinuerlig kompetensöverföring till myndigheten."
      }
    ]
  },
  {
    id: "tender-2",
    title: "Nästa Generations Medborgarplattform",
    authority: "Stockholms Stad",
    description: "Stockholms Stad upphandlar ett agilt konsultteam för att bygga om stadens centrala portal för invånartjänster. Plattformen kommer att integrera dussintals interna API:er och rullas ut till över en miljon invånare.",
    budget: "8 500 000 SEK",
    deadline: "2026-08-15",
    category: "Plattformsutveckling",
    requirements: [
      {
        id: "req-2-1",
        text: "Erfarenhet av komplexa integrationer och mikrotjänst-arkitekturer med Node.js och RESTful/GraphQL API-design."
      },
      {
        id: "req-2-2",
        text: "Leverantören måste påvisa dokumenterad erfarenhet från offentlig sektor med fokus på tillgänglighetskrav enligt WCAG 2.1 AA."
      },
      {
        id: "req-2-3",
        text: "Teamet skall stödjas av en dedikerad QA-ledare med erfarenhet av testautomatisering och prestandautvärdering vid extrem systemlast."
      }
    ]
  },
  {
    id: "tender-3",
    title: "Ramavtal för IT-infrastruktur & DevSecOps",
    authority: "Polismyndigheten (IT-avdelningen)",
    description: "Upphandling av expertstöd för Polismyndighetens satsning på DevSecOps och kontinuerlig driftsäkerhet. Uppdraget kräver svenskt medborgarskap och registerkontroll, samt förmåga till extremt robust incidenthantering.",
    budget: "12 000 000 SEK",
    deadline: "2026-09-01",
    category: "DevSecOps & Säkerhet",
    requirements: [
      {
        id: "req-3-1",
        text: "Konsulterna måste ha omfattande dokumenterad erfarenhet av CI/CD-pipelines, automatiserad säkerhetsskanning samt infra som kod (Terraform)."
      },
      {
        id: "req-3-2",
        text: "Beskrivning av leverantörens arbetssätt vid incidenter och kritiska driftstopp dygnet runt (24/7-beredskap)."
      },
      {
        id: "req-3-3",
        text: "Erfarenhet av federal identitetshantering, SAML/OAuth, samt hårda nätverksskydd mot DDOS-attacker."
      }
    ]
  },
  {
    id: "tender-4",
    title: "AI-baserat Stöd för Ärendehantering",
    authority: "Arbetsförmedlingen",
    description: "Upphandling av ett innovativt pilotprojekt för att införa AI-assistans vid tolkning av fritextsökningar och matchning av arbetssökande. Fokus ligger på säker hantering av känsliga personuppgifter.",
    budget: "2 200 000 SEK",
    deadline: "2026-07-05",
    category: "AI & Innovation",
    requirements: [
      {
        id: "req-4-1",
        text: "Djupgående kunskap om generativ AI, prompt engineering samt erfarenhet av integrationer mot slutna språkmodeller (LLM)."
      },
      {
        id: "req-4-2",
        text: "Redogörelse för hur kunden garanterar efterlevnad av AI Act, etisk AI samt förhindrande av bias i träningsdata."
      }
    ]
  }
];
