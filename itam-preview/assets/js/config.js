/*
 * Vienintelė vieta įmonės duomenims keisti / Single place to edit company details.
 * Pakeiskite companyName, kai bus pasirinktas pavadinimas.
 */
window.SITE_CONFIG = {
  companyName: "[Įmonės pavadinimas]",   // PLACEHOLDER: company name
  contactEmail: "contact@example.lt",     // PLACEHOLDER: contact e-mail (mailto only, no backend)
  contactPhone: "",                        // PLACEHOLDER: optional phone, hidden when empty
  companyCode: "",                         // PLACEHOLDER: įmonės kodas, hidden when empty
  address: "",                             // PLACEHOLDER: address, hidden when empty
  defaultLang: "lt",

  /*
   * TODO(partner-status): kai įmonė oficialiai taps Lansweeper partnere,
   * įrašykite patvirtintą formuluotę čia (LT ir EN). Kol tuščia – niekas nerodoma.
   * Do NOT fill this in before partner status is confirmed in writing by Lansweeper.
   */
  partnerStatus: { lt: "", en: "" }
};
