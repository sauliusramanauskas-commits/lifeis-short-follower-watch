/* Tikri – PERŽIŪRA. Vienas konfigūracijos objektas: planų kainos ir ribos naudojamos VISUR (kainos, palyginimas, mokėjimo langas, trumpi tekstai).
   Kainoms keisti – užtenka pakeisti `price` (ir, jei reikia, `days`) vienoje eilutėje. Kainos nurodomos su PVM. */
window.TIKRI_CONFIG = {
  VAT_NOTE: 'su PVM',
  PLANS: {
    free:    { id: 'free',    name: 'Nemokamas', price: 0,    days: 30 },
    premium: { id: 'premium', name: 'Premium',   price: 6.99, days: 30, yearPrice: 52.99 },
    plus:    { id: 'plus',    name: 'Plus',      price: 13.99, days: 30, yearPrice: 105.99 }
  },
  YEARLY_DISCOUNT: 0.37, /* metinis planas: 12 mėn. kaina −37 % */
  LIMITS: { freeProfilesPerDay: 12, freeNewChatsPerDay: 5, contactUnlockMessages: 3, chatPhotoDays: 7 },
  SELLER: 'Pardavėjas: Saulius Ramanauskas, individuali veikla, PVM LT100015491519',
  BANK_DESCRIPTOR: 'TKR PASLAUGOS'
};
