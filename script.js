document.documentElement.classList.add("js");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".section-reveal").forEach((section) => {
  observer.observe(section);
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const closeButton = document.querySelector(".lightbox-close");
const prevButton = document.querySelector(".lightbox-prev");
const nextButton = document.querySelector(".lightbox-next");

const galleries = new Map();
let activeGallery = [];
let activeIndex = 0;

function openGalleryItem(item) {
  const galleryName = item.dataset.gallery;
  activeGallery = galleries.get(galleryName) || [];
  activeIndex = activeGallery.indexOf(item);

  if (activeIndex === -1) {
    return;
  }

  openLightbox();
}

document.querySelectorAll(".gallery-item[data-gallery]").forEach((item) => {
  const galleryName = item.dataset.gallery;
  if (!galleries.has(galleryName)) {
    galleries.set(galleryName, []);
  }
  galleries.get(galleryName).push(item);
});

document.addEventListener("click", (event) => {
  const item = event.target.closest(".gallery-item[data-gallery]");
  if (!item || event.defaultPrevented) {
    return;
  }

  openGalleryItem(item);
});

document.querySelectorAll(".carousel-track").forEach((track) => {
  let isDragging = false;
  let didDrag = false;
  let pressedItem = null;
  let dragStartX = 0;
  let startScrollLeft = 0;

  track.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      event.preventDefault();
      track.scrollLeft += event.deltaY;
    },
    { passive: false }
  );

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    isDragging = true;
    didDrag = false;
    pressedItem = event.target.closest(".gallery-item[data-gallery]");
    dragStartX = event.clientX;
    startScrollLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 6) {
      didDrag = true;
    }

    track.scrollLeft = startScrollLeft - distance;
  });

  function stopDrag(event) {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    track.classList.remove("is-dragging");

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  }

  track.addEventListener("pointerup", stopDrag);
  track.addEventListener("pointercancel", stopDrag);
  track.addEventListener(
    "click",
    (event) => {
      if (didDrag) {
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
        pressedItem = null;
        return;
      }

      if (!event.target.closest(".gallery-item[data-gallery]") && pressedItem) {
        event.preventDefault();
        event.stopPropagation();
        openGalleryItem(pressedItem);
        pressedItem = null;
      }
    },
    true
  );
});

document.querySelectorAll(".carousel-button").forEach((button) => {
  button.addEventListener("click", () => {
    const track = document.getElementById(button.dataset.carouselTarget);
    const item = track?.querySelector(".gallery-item");
    if (!track || !item) {
      return;
    }

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const step = item.getBoundingClientRect().width + gap;
    const direction = button.dataset.direction === "prev" ? -1 : 1;

    track.scrollBy({
      left: step * direction,
      behavior: "smooth",
    });
  });
});

function openLightbox() {
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

function updateLightbox() {
  const item = activeGallery[activeIndex];
  const image = item.querySelector("img");

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;

  const hasMultiple = activeGallery.length > 1;
  prevButton.style.display = hasMultiple ? "" : "none";
  nextButton.style.display = hasMultiple ? "" : "none";
}

function showPrevious() {
  activeIndex = (activeIndex - 1 + activeGallery.length) % activeGallery.length;
  updateLightbox();
}

function showNext() {
  activeIndex = (activeIndex + 1) % activeGallery.length;
  updateLightbox();
}

closeButton.addEventListener("click", closeLightbox);
prevButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    showPrevious();
  }

  if (event.key === "ArrowRight") {
    showNext();
  }
});
