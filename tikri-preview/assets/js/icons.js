/* Tikri – originalios inline SVG piktogramos (sukurtos šiam projektui). */
window.TIKRI_ICONS = (function () {
  'use strict';
  function s(body, extra) {
    return '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || '') + '>' + body + '</svg>';
  }
  return {
    logo: '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F29A7E"/><stop offset="1" stop-color="#C9573F"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="18" fill="url(#lg-logo)"/><circle cx="25" cy="29" r="11" fill="none" stroke="#FFF8F1" stroke-width="4"/><circle cx="39" cy="29" r="11" fill="none" stroke="#FFF8F1" stroke-width="4" opacity=".85"/><path d="M24 46h16" stroke="#FFF8F1" stroke-width="4" stroke-linecap="round"/></svg>',
    near: s('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
    chat: s('<path d="M4.5 6.5a2.5 2.5 0 0 1 2.5-2.5h10a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16h0a2.5 2.5 0 0 1-1.5-2.3z"/><path d="M8.5 9h7M8.5 12h4.5"/>'),
    user: s('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>'),
    gem: s('<path d="M7 4h10l3.5 5L12 20 3.5 9z"/><path d="M3.5 9h17M9.5 4 8 9l4 11 4-11-1.5-5"/>'),
    shield: s('<path d="M12 3.5 5 6.3v5.2c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6.3z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>'),
    lock: s('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><circle cx="12" cy="15.5" r="1.2"/>'),
    check: s('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    verified: '<svg class="ico verified" viewBox="0 0 24 24" width="18" height="18" aria-label="Patvirtintas profilis" role="img"><path d="M12 2.5l2.3 1.7 2.9-.2.9 2.7 2.4 1.7-.9 2.7.9 2.7-2.4 1.7-.9 2.7-2.9-.2L12 21.5l-2.3-1.7-2.9.2-.9-2.7-2.4-1.7.9-2.7-.9-2.7 2.4-1.7.9-2.7 2.9.2z" fill="#4F9A7A"/><path d="m8.3 12.2 2.5 2.5 4.9-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sliders: s('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    back: s('<path d="M15 5 8 12l7 7"/>'),
    close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    send: s('<path d="M4.5 12 20 4.5 15.5 20l-3-6.5z"/><path d="m12.5 13.5 7.5-9"/>'),
    spark: s('<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><path d="M12 8.5c.6 2 1.5 2.9 3.5 3.5-2 .6-2.9 1.5-3.5 3.5-.6-2-1.5-2.9-3.5-3.5 2-.6 2.9-1.5 3.5-3.5z" fill="currentColor" stroke="none"/>'),
    block: s('<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>'),
    flag: s('<path d="M6 21V4"/><path d="M6 4.5h10.5l-2 4 2 4H6"/>'),
    eyeOff: s('<path d="M3.5 12S6.5 6.5 12 6.5c1.6 0 3 .4 4.2 1M20.5 12s-3 5.5-8.5 5.5c-1.6 0-3-.4-4.2-1"/><path d="M4 20 20 4"/><path d="M9.8 13.9a2.8 2.8 0 0 1 4-4"/>'),
    share: s('<circle cx="12" cy="10" r="2.5"/><path d="M12 20s-6-5.2-6-10a6 6 0 0 1 9.6-4.8"/><path d="M17 4.5h3.5V8M20.5 4.5 15.5 9.5"/>'),
    camera: s('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>'),
    chevron: s('<path d="m9 5 7 7-7 7"/>'),
    eye: s('<path d="M3.5 12S6.5 6.5 12 6.5 20.5 12 20.5 12 17.5 17.5 12 17.5 3.5 12 3.5 12z"/><circle cx="12" cy="12" r="2.5"/>'),
    trash: s('<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>'),
    download: s('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
    info: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h0"/>'),
    phone: s('<path d="M7 3.5h3l1.5 4-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 5 5.7 2 2 0 0 1 7 3.5z"/>'),
    rocket: s('<path d="M13.5 4.5c3-1 5.5-1 6-.5s.5 3-.5 6l-6 6-5-5z"/><path d="M8 11 5 11l-1.5 2.5L8 15M13 16v3l-2.5 1.5L9 16"/><circle cx="15.5" cy="8.5" r="1.3"/>')
  };
})();
