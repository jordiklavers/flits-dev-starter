import gsap from "https://cdn.skypack.dev/gsap";
import CustomEase from "https://cdn.skypack.dev/gsap/CustomEase";
import ScrollTrigger from "https://cdn.skypack.dev/gsap/ScrollTrigger";
import studioFreightlenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm";
import lagrangeBarbaCore from "https://cdn.skypack.dev/@lagrange/barba-core";

gsap.registerPlugin(ScrollTrigger, CustomEase);

//CustomEase.create("custom", "M0,0 C0.88,-0.359 0.064,1.348 1,1 ");

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
  // initAccordion();
  initAccordionTwo();
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

function initAccordion() {
  // First, remove any existing click handlers to prevent duplicates
  $("[data-accordion-summary]").off("click");
  
  $("[data-accordion]").each(function () {
    const accordionItem = $(this);
    const accordionSummary = accordionItem.find("[data-accordion-summary]");
    const accordionContent = accordionItem.find("[data-accordion-content]");
    let timeline = null;
    let isClosing = false;
    let isExpanding = false;
    const duration = 0.5;
    const ease = "custom";

    function onClick(e) {
      e.preventDefault();
      accordionItem.css("overflow", "hidden");

      if (isClosing || !accordionItem.prop("open")) {
        openAccordion();
      } else if (isExpanding || accordionItem.prop("open")) {
        shrinkAccordion();
      }
    }

    function shrinkAccordion() {
      isClosing = true;
      const startHeight = accordionItem.outerHeight();
      const endHeight = accordionSummary.outerHeight();

      if (timeline) {
        timeline.kill();
      }

      timeline = gsap.timeline({
        onComplete: function () {
          onAnimationFinish(false);
        },
        onReverseComplete: function () {
          isClosing = false;
        },
      });

      timeline
        .to(accordionItem[0], {
          height: endHeight,
          duration: duration,
          ease: ease,
        })
        .to(
          accordionContent,
          {
            opacity: 0,
            y: -10,
            duration: duration * 0.5,
            ease: "power2.in",
          },
          "<"
        );
    }

    function openAccordion() {
      accordionItem.css("height", `${accordionItem.outerHeight()}px`);
      accordionItem.prop("open", true);
      window.requestAnimationFrame(expandAccordion);
    }

    function expandAccordion() {
      isExpanding = true;
      const startHeight = accordionItem.outerHeight();
      const endHeight = accordionSummary.outerHeight() + accordionContent.outerHeight();

      if (timeline) {
        timeline.kill();
      }

      timeline = gsap.timeline({
        onComplete: function () {
          onAnimationFinish(true);
        },
        onReverseComplete: function () {
          isExpanding = false;
        },
      });

      timeline
        .to(accordionItem[0], {
          height: endHeight,
          duration: duration,
          ease: ease,
        })
        .fromTo(
          accordionContent,
          {
            opacity: 0,
            y: -50,
          },
          {
            opacity: 1,
            y: 0,
            duration: duration * 0.5,
            ease: "power2.out",
          },
          "<+50%"
        )
        .add(() => {
          // Clear props after all animations
          gsap.set(accordionItem[0], { clearProps: "height,overflow" });
          gsap.set(accordionContent, { clearProps: "opacity,y" });
        });
    }

    function onAnimationFinish(open) {
      accordionItem.prop("open", open);
      timeline = null;
      isClosing = false;
      isExpanding = false;
    }

    accordionSummary.on("click", onClick);
  });
}

function initAccordionTwo() {
  
  $("[data-accordion]").each(function () {
    let accordionItem = $(this);
    let accordionSummary = accordionItem.find("[data-accordion-summary]");
    let accordionContent = accordionItem.find("[data-accordion-content]");

    let currentHeight = accordionItem.height();

    
    accordionSummary.on("click", function (e) {
      e.preventDefault();
      const currentStatus = accordionItem.attr("open");
      currentStatus === "open" ? closeAccordion() : openAccordion();
    });

    function openAccordion() {
      let contentHeight = accordionContent.height();

      let tl = gsap.timeline({
        onComplete: function () {
          // accordionItem.attr("open", true);
        },
      });

      gsap.to(accordionItem, {
        height: currentHeight + contentHeight,
        duration: 0.7,
        ease: "power4.inOut",
      });
    }

    async function closeAccordion() {
      console.log("close accordion");

      let tl = gsap.timeline({
        onComplete: function () {
          accordionItem.attr("open", false);
        },
      });
      tl.to(accordionItem, {
        height: currentHeight,
        duration: 0.7,
        ease: "power4.inOut",
      });
    }
  });
}

