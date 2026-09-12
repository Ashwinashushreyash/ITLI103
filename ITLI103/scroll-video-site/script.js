/* ============================================
   BACKGROUND VIDEO + SCROLL REVEAL
   ============================================
   The video autoplays & loops in the background.
   As the user scrolls, content sections fade in.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const textBlocks = document.querySelectorAll(".content-section .text-block");

  function onScroll() {
    // Reveal text blocks when they enter the viewport
    textBlocks.forEach((block) => {
      const rect = block.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        block.classList.add("visible");
      } else {
        block.classList.remove("visible");
      }
    });
  }

  // Run once on load
  onScroll();

  // Listen to scroll with requestAnimationFrame for smoothness
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
});
