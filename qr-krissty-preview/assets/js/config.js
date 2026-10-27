/* Krissty QR bendri nustatymai. AI dizainų limitus keisk tik čia. */
window.KQR_CONFIG={AI_LIMITS:{basic:10,full:25,premium:50,trial:3}};
document.addEventListener('DOMContentLoaded',function(){var L=window.KQR_CONFIG.AI_LIMITS;
 document.querySelectorAll('[data-ai-limit]').forEach(function(e){e.textContent=L[e.getAttribute('data-ai-limit')]});});
