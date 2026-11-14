const siteHeader = document.querySelector(".site-header");
const menuToggle = siteHeader?.querySelector(".site-header__menu-toggle");
const primaryNavigation = siteHeader?.querySelector(".site-nav");

if (siteHeader && menuToggle && primaryNavigation) {
    const closeMenu = () => {
        siteHeader.classList.remove("is-menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        siteHeader.classList.toggle("is-menu-open", !isOpen);
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    });

    primaryNavigation.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            closeMenu();
        }
    });

    document.addEventListener("click", (event) => {
        const isMenuOpen = menuToggle.getAttribute("aria-expanded") === "true";
        const clickedToggle = event.target instanceof Node && menuToggle.contains(event.target);

        if (isMenuOpen && !clickedToggle) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
            closeMenu();
            menuToggle.focus();
        }
    });

    window.matchMedia("(min-width: 861px)").addEventListener("change", closeMenu);
}
