/*
 * Kainodaros duomenys / Pricing data.
 * Kainos dar nenustatytos: palikite null, kol bus patvirtintos.
 * Kai price === null, rodoma „Kaina pagal užklausą“ / "Price on request".
 * price: number (EUR, be PVM) | null
 */
window.PRICING = {
  currency: "EUR",
  vatNote: { lt: "Kainos nurodomos be PVM.", en: "Prices exclude VAT." },
  // Oficiali Lansweeper kaina (lansweeper.com/pricing, tikrinta 2026-10-22). Licencija perkama kliento vardu.
  licenseReference: {
    lt: "Lansweeper Pro licencija: nuo 474 € per mėnesį (mokama už metus, ~5 688 €/m.), įskaičiuota 2 000 turto vienetų, plečiama iki 9 000, iki 3 instaliacijų. Tai oficiali Lansweeper kaina; licenciją klientas perka tiesiogiai iš Lansweeper savo vardu ir moka už ją atskirai. Tiksli kaina didesniam kiekiui pagal Lansweeper pasiūlymą.",
    en: "Lansweeper Pro licence: from €474 per month (billed annually, ~€5,688/yr), includes 2,000 assets, expandable to 9,000, up to 3 installations. This is Lansweeper's official list price; the customer buys the licence directly from Lansweeper in their own name and pays for it separately. Exact price for larger volumes per Lansweeper quote."
  },
  // Mėnesinės kainos pagal kiekį (EUR, be PVM) = kiekis × paketo kaina už asset. Preliminaru, kol bus Lansweeper partnerio kaina.
  volumes: [2000, 4000, 6000],
  volumeCaption: { lt: "Mūsų paslaugų mėnesio kaina pagal turto vienetų kiekį (be licencijos ir PVM, preliminari)", en: "Our monthly service fee by number of assets (excl. licence and VAT, preliminary)" },
  volumeAssetsLabel: { lt: "Turto vienetų", en: "Assets" },
  packages: [
    {
      id: "setup",
      name: { lt: "Diegimas", en: "Setup" },
      unit: { lt: "vienkartinis mokestis", en: "one-off fee" },
      price: null,
      features: {
        lt: [
          "Poreikių ir infrastruktūros analizė",
          "Lansweeper diegimas jūsų aplinkoje (on-prem, izoliuotame tinkle arba debesyje)",
          "Skenavimo tikslų, kredencialų ir sinchronizavimo nustatymas",
          "Iki 3 instaliacijų sujungimas (federacija)",
          "Perdavimas ir administratorių apmokymai"
        ],
        en: [
          "Requirements and infrastructure assessment",
          "Lansweeper deployment in your environment (on-prem, air-gapped or cloud)",
          "Scan targets, credentials and synchronisation setup",
          "Federation of up to 3 installations",
          "Handover and administrator training"
        ]
      }
    },
    {
      id: "managed",
      name: { lt: "Valdomos paslaugos", en: "Managed service" },
      unit: { lt: "už turto vienetą per mėnesį, be Lansweeper licencijos", en: "per asset per month, Lansweeper licence not included" },
      price: 0.16,
      from: true,
      highlight: true,
      features: {
        lt: [
          "Nuolatinė inventoriaus priežiūra ir duomenų kokybė",
          "Skenavimo klaidų ir naujų tinklo segmentų stebėsena",
          "Pažeidžiamumų ir gyvavimo ciklo įžvalgos",
          "Atnaujinimų ir konfigūracijos priežiūra",
          "Mėnesinės inventoriaus ataskaitos",
          "Reguliarios konsultacijos"
        ],
        en: [
          "Ongoing inventory upkeep and data quality",
          "Monitoring of scan errors and new network segments",
          "Vulnerability and lifecycle insights",
          "Updates and configuration maintenance",
          "Monthly inventory reports",
          "Regular check-in sessions"
        ]
      }
    },
    {
      id: "reporting",
      name: { lt: "Valdoma paslauga + SLA ir saugumo ataskaitos", en: "Managed service + SLA and security reporting" },
      unit: { lt: "už turto vienetą per mėnesį, be Lansweeper licencijos", en: "per asset per month, Lansweeper licence not included" },
      price: 0.31,
      from: true,
      features: {
        lt: [
          "Viskas, kas įeina į valdomas paslaugas",
          "Sutartas reagavimo laikas (SLA)",
          "Inventoriaus ir programinės įrangos ataskaitos",
          "Pasenusios / nebepalaikomos įrangos sąrašai",
          "Ataskaitos vidaus auditui ir atitikties reikalavimams",
          "Individualūs ataskaitų šablonai"
        ],
        en: [
          "Everything in Managed service",
          "Agreed response times (SLA)",
          "Inventory and software reports",
          "End-of-life / unsupported asset lists",
          "Reports for internal audit and compliance needs",
          "Custom report templates"
        ]
      }
    }
  ]
};
