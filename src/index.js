import gsap from "https://cdn.skypack.dev/gsap";
import CustomEase from "https://cdn.skypack.dev/gsap/CustomEase";
import ScrollTrigger from "https://cdn.skypack.dev/gsap/ScrollTrigger";
import studioFreightlenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm";
import lagrangeBarbaCore from "https://cdn.skypack.dev/@lagrange/barba-core";

gsap.registerPlugin(ScrollTrigger, CustomEase);

CustomEase.create("custom", "M0,0 C0.88,-0.359 0.064,1.348 1,1 ");

$(document).ready(function () {
  initPageTransitions();
});

let transitionOffset = 800; /* ms */

/* Page Transition */

function pageTransitionIn() {
  let tl = gsap.timeline();
  tl.to(".main", {
    autoAlpha: 0,
    duration: 0.5,
    ease: "power2.inOut",
  });
}

function pageTransitionOut() {
  let tl = gsap.timeline();
  tl.from(".main", {
    autoAlpha: 0,
    duration: 0.5,
    ease: "power2.inOut",
    clearProps: "all",
  });
}

function initPageTransitions() {
  history.scrollRestoration = "manual";

  lagrangeBarbaCore.hooks.afterEnter(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  });

  lagrangeBarbaCore.hooks.leave(() => {
    // Remove this call as it's causing duplicate initialization
    // initFunctions();
  });

  //
  async function commonLeaveBeforeOffset(data) {
    //
    console.log("commonLeaveBeforeOffset");
    pageTransitionIn(data.current);
    $("[data-scrolling-direction]").attr("data-scrolling-direction", "up");
    $("[data-scrolling-started]").attr("data-scrolling-started", "false");
  }

  async function commonLeaveAfterOffset(data) {
    //
    console.log("commonLeaveAfterOffset");
    await delay(10);
    $("[data-scrolling-direction]").attr("data-scrolling-direction", "up");
    $("[data-scrolling-started]").attr("data-scrolling-started", "false");
  }

  async function commonEnter(data) {
    //
    console.log("commonEnter");
    pageTransitionOut(data.next);
  }

  async function commonBeforeEnter(data) {
    //
    console.log("commonBeforeEnter");
    initResetWebflow(data);
    initFunctions();
  }

  async function commonAfterEnter(data) {
    //
    console.log("commonAfterEnter");
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }

  lagrangeBarbaCore.init({
    sync: true,
    debug: true,
    timeout: 7000,
    preventRunning: true,
    prevent: function ({ el }) {
      if (el.hasAttribute("data-barba-prevent")) {
        return true;
      }
    },
    transitions: [
      {
        name: "default",
        once(data) {
          initSmoothScroll(data.next.container);
          initFunctions();
          // Initialize Finsweet attributes on first load only
        },
        async leave(data) {
          await commonLeaveBeforeOffset(data);
          await delay(transitionOffset);
          await commonLeaveAfterOffset(data);
        },
        async enter(data) {
          await commonEnter(data);
        },
        async beforeEnter(data) {
          await commonBeforeEnter(data);
        },
        async afterEnter(data) {
          await commonAfterEnter(data);
        },
      },
    ],
  });
}

function delay(n) {
  n = n || 2000;
  return new Promise((done) => {
    setTimeout(() => {
      done();
    }, n);
  });
}

function initSmoothScroll(container) {
  initLenis();
  ScrollTrigger.refresh();
}

function initLenis() {
  const lenis = new studioFreightlenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function initFunctions() {
  console.log("initFunctions");
  initDetectScrollingDirection();
  initModal();
  initAccordion();
}

function initResetWebflow(data) {
  let parser = new DOMParser();
  let dom = parser.parseFromString(data.next.html, "text/html");
  let webflowPageId = dom.querySelector("html").getAttribute("data-wf-page");
  document.documentElement.setAttribute("data-wf-page", webflowPageId);
  window.Webflow.destroy();
  window.Webflow.ready();
  // window.Webflow.require("ix2").init();
}

/* Basic Functions */

function initDetectScrollingDirection() {
  let lastScrollTop = 0;
  const threshold = 10; // Minimal scroll distance to switch to up/down
  const thresholdTop = 50; // Minimal scroll distance from top of window to start

  window.addEventListener("scroll", () => {
    const nowScrollTop = window.scrollY;

    if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
      // Update Scroll Direction
      const direction = nowScrollTop > lastScrollTop ? "down" : "up";
      document
        .querySelectorAll("[data-scrolling-direction]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-direction", direction)
        );

      // Update Scroll Started
      const started = nowScrollTop > thresholdTop;
      document
        .querySelectorAll("[data-scrolling-started]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-started", started ? "true" : "false")
        );

      lastScrollTop = nowScrollTop;
    }
  });
}

/* Component Functions */

function initModal() {
  console.log("initModal");
  
  let modal = $('.modal');
  let toggles = $('[data-modal-toggle]');    // All modal toggle buttons

  // Open modal
  toggles.on('click', function() {
    if (modal.is('[open]')) {
      closeModal();
    } else {
      openModal();
    }  });

  function openModal() {
    modal.attr('open', '');
  }

  // Close modal function
  function closeModal() {
    modal.removeAttr('open');
  }

  // Close modal on ESC key
  $(window).on('keydown', function(e) {
    if (e.key === 'Escape' && modal.is('[open]')) {
      closeModal();
    }
  });
}

function initAccordion() {  
  const accordionDuration = 0.4;
  const accordionEase = "custom";

  $("[data-accordion]").each(function () {
    let accordionItem = $(this);
    let accordionSummary = accordionItem.find("[data-accordion-summary]");
    let accordionContent = accordionItem.find("[data-accordion-content]");
    
    accordionSummary.on("click", function (e) {
      e.preventDefault();
      
      const isOpen = accordionItem.prop("open");
      isOpen ? closeAccordion() : openAccordion();
    });

    const openAccordion = () => {
      // First set current height and make content visible
      accordionItem.css({
        height: accordionSummary.outerHeight() + "px",
      });
      accordionItem.prop("open", true);
      
      // Now we can measure the content height
      const endHeight = accordionSummary.outerHeight() + accordionContent.outerHeight();
      
      gsap.timeline()
        .to(accordionItem, {
          height: endHeight,
          duration: accordionDuration,
          ease: accordionEase,
          onComplete: () => {
            // Clear temporary styles
            accordionItem.css({
              height: "",
            });
          }
        })
        .fromTo(accordionContent, {
          opacity: 0,
          y: -20,
          filter: "blur(10px)",
        }, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: accordionDuration,
          ease: "power3.inOut"
        }, "<");
    }

    const closeAccordion = () => {
      // Set current height before animating
      const startHeight = accordionItem.outerHeight();
      const endHeight = accordionSummary.outerHeight();
            
      gsap.timeline()
        .to(accordionItem, {
          height: endHeight,
          duration: accordionDuration,
          ease: accordionEase,
          onComplete: () => {
            accordionItem.prop("open", false);
            accordionItem.css({
            });
          }
        })
        .to(accordionContent, {
          opacity: 0,
          duration: accordionDuration,
          ease: accordionEase
        }, "<");
    }
  });
}

