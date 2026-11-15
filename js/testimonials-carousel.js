const carouselViewport = document.querySelector(".testimonials__viewport");

if (carouselViewport) {
    const carouselList = carouselViewport.querySelector(".testimonials__list");
    const originalCards = carouselList ? Array.from(carouselList.children) : [];

    if (carouselList && originalCards.length > 1) {
        const cloneCount = 2;
        const cloneCards = () => originalCards.map((card) => {
            const clone = card.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("inert", "");
            return clone;
        });

        const leadingClones = document.createDocumentFragment();
        for (let index = 0; index < cloneCount; index += 1) {
            cloneCards().forEach((card) => leadingClones.append(card));
        }
        carouselList.prepend(leadingClones);

        const trailingClones = document.createDocumentFragment();
        for (let index = 0; index < cloneCount; index += 1) {
            cloneCards().forEach((card) => trailingClones.append(card));
        }
        carouselList.append(trailingClones);

        const firstOriginal = carouselList.children[originalCards.length * cloneCount];
        const mobileViewer = window.matchMedia("(max-width: 640px)");
        const getCardScrollPosition = (card) => {
            const viewportRect = carouselViewport.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const centerOffset = mobileViewer.matches
                ? (carouselViewport.clientWidth - cardRect.width) / 2
                : 0;

            return carouselViewport.scrollLeft + cardRect.left - viewportRect.left - centerOffset;
        };
        let originalStart = 0;
        let loopDistance = 0;

        const measureLoop = () => {
            const nextCopy = carouselList.children[originalCards.length * (cloneCount + 1)];
            originalStart = getCardScrollPosition(firstOriginal);
            loopDistance = nextCopy.getBoundingClientRect().left -
                firstOriginal.getBoundingClientRect().left;
            carouselViewport.scrollLeft = originalStart;
        };

        measureLoop();

        carouselViewport.addEventListener("scroll", () => {
            const minScroll = originalStart - loopDistance;
            const maxScroll = originalStart + loopDistance;

            if (carouselViewport.scrollLeft < minScroll) {
                carouselViewport.scrollLeft += loopDistance;
            } else if (carouselViewport.scrollLeft >= maxScroll) {
                carouselViewport.scrollLeft -= loopDistance;
            }
        }, { passive: true });

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let isDragging = false;
        let isFocused = false;
        let lastPointerX = 0;
        let pendingDragDelta = 0;
        let dragFrame = 0;
        let lastMoveTime = 0;
        let velocity = 0;
        let animationFrame = 0;
        let settleTimer = 0;
        let autoplayTimer = 0;

        const clearAutoplay = () => {
            window.clearTimeout(autoplayTimer);
            autoplayTimer = 0;
        };

        const scheduleAutoplay = (delay = 2000) => {
            clearAutoplay();

            if (
                reduceMotion.matches ||
                document.hidden ||
                isFocused ||
                isDragging
            ) {
                return;
            }

            autoplayTimer = window.setTimeout(() => {
                let nearestIndex = 0;
                let nearestDistance = Number.POSITIVE_INFINITY;

                Array.from(carouselList.children).forEach((card, index) => {
                    const cardScroll = getCardScrollPosition(card);
                    const distance = Math.abs(cardScroll - carouselViewport.scrollLeft);

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = index;
                    }
                });

                const nextCard = carouselList.children[nearestIndex + 1];
                if (!nextCard) {
                    scheduleAutoplay();
                    return;
                }

                const nextScroll = getCardScrollPosition(nextCard);

                if (mobileViewer.matches && !reduceMotion.matches) {
                    const startScroll = carouselViewport.scrollLeft;
                    const distance = nextScroll - startScroll;
                    let startTime = 0;
                    carouselViewport.classList.add("is-settling");

                    const animateMobileScroll = (time) => {
                        if (!startTime) {
                            startTime = time;
                        }

                        const progress = Math.min((time - startTime) / 2500, 1);
                        const easedProgress = progress < 0.5
                            ? 4 * progress ** 3
                            : 1 - ((-2 * progress + 2) ** 3) / 2;

                        carouselViewport.scrollLeft = startScroll + distance * easedProgress;

                        if (progress < 1) {
                            animationFrame = window.requestAnimationFrame(animateMobileScroll);
                        } else {
                            animationFrame = 0;
                            carouselViewport.classList.remove("is-settling");
                            scheduleAutoplay();
                        }
                    };

                    animationFrame = window.requestAnimationFrame(animateMobileScroll);
                    return;
                }

                carouselViewport.scrollTo({
                    left: nextScroll,
                    behavior: reduceMotion.matches ? "auto" : "smooth"
                });
                scheduleAutoplay();
            }, delay);
        };

        const pauseForInteraction = () => {
            clearAutoplay();
        };

        const resumeAfterInteraction = () => {
            if (!isDragging) {
                scheduleAutoplay(2000);
            }
        };

        carouselViewport.addEventListener("focusin", () => {
            isFocused = true;
            pauseForInteraction();
        });
        carouselViewport.addEventListener("focusout", () => {
            window.setTimeout(() => {
                isFocused = carouselViewport.contains(document.activeElement);
                resumeAfterInteraction();
            }, 0);
        });
        carouselViewport.addEventListener("pointermove", () => {
            if (!isDragging) {
                scheduleAutoplay(2000);
            }
        }, { passive: true });
        carouselViewport.addEventListener("wheel", pauseForInteraction, { passive: true });
        carouselViewport.addEventListener("pointerdown", pauseForInteraction);
        carouselViewport.addEventListener("pointerup", resumeAfterInteraction);
        carouselViewport.addEventListener("pointercancel", resumeAfterInteraction);
        carouselViewport.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                pauseForInteraction();
            }
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                pauseForInteraction();
            } else {
                scheduleAutoplay();
            }
        });
        reduceMotion.addEventListener("change", () => {
            if (reduceMotion.matches) {
                pauseForInteraction();
            } else {
                scheduleAutoplay();
            }
        });

        const applyDragDelta = () => {
            carouselViewport.scrollLeft += pendingDragDelta;
            pendingDragDelta = 0;
            dragFrame = 0;
        };

        const snapToNearestCard = () => {
            const currentScroll = carouselViewport.scrollLeft;
            let nearestScroll = currentScroll;
            let nearestDistance = Number.POSITIVE_INFINITY;

            for (const card of carouselList.children) {
                const cardScroll = getCardScrollPosition(card);
                const distance = Math.abs(cardScroll - currentScroll);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestScroll = cardScroll;
                }
            }

            carouselViewport.classList.add("is-settling");
            carouselViewport.scrollTo({
                left: nearestScroll,
                behavior: reduceMotion.matches ? "auto" : "smooth"
            });

            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(() => {
                carouselViewport.classList.remove("is-settling");
            }, reduceMotion.matches ? 0 : 450);
        };

        const finishDrag = () => {
            if (!isDragging) {
                return;
            }

            isDragging = false;
            carouselViewport.classList.remove("is-dragging");

            if (dragFrame) {
                window.cancelAnimationFrame(dragFrame);
                applyDragDelta();
            }

            if (reduceMotion.matches || Math.abs(velocity) < 0.08) {
                snapToNearestCard();
                return;
            }

            let previousTime = performance.now();
            const coast = (time) => {
                const elapsed = Math.min(time - previousTime, 32);
                previousTime = time;
                carouselViewport.scrollLeft += velocity * elapsed;
                velocity *= Math.exp(-elapsed / 260);

                if (Math.abs(velocity) >= 0.035) {
                    animationFrame = window.requestAnimationFrame(coast);
                } else {
                    animationFrame = 0;
                    snapToNearestCard();
                }
            };

            animationFrame = window.requestAnimationFrame(coast);
        };

        carouselViewport.addEventListener("pointerdown", (event) => {
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            }
            window.clearTimeout(settleTimer);
            carouselViewport.classList.remove("is-settling");

            if (event.pointerType !== "mouse" || event.button !== 0) {
                return;
            }

            isDragging = true;
            lastPointerX = event.clientX;
            lastMoveTime = performance.now();
            pendingDragDelta = 0;
            velocity = 0;
            carouselViewport.classList.add("is-dragging");
            carouselViewport.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        carouselViewport.addEventListener("pointermove", (event) => {
            if (!isDragging) {
                return;
            }

            const deltaX = lastPointerX - event.clientX;
            const now = performance.now();
            const elapsed = Math.max(now - lastMoveTime, 1);
            const instantVelocity = deltaX / elapsed;
            velocity = velocity * 0.35 + instantVelocity * 0.65;
            pendingDragDelta += deltaX;
            lastPointerX = event.clientX;
            lastMoveTime = now;

            if (!dragFrame) {
                dragFrame = window.requestAnimationFrame(applyDragDelta);
            }
        });

        carouselViewport.addEventListener("pointerup", finishDrag);
        carouselViewport.addEventListener("pointercancel", finishDrag);
        carouselViewport.addEventListener("lostpointercapture", finishDrag);

        carouselViewport.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
            }

            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const cardWidth = originalCards[0].getBoundingClientRect().width;
            carouselViewport.scrollBy({
                left: direction * (cardWidth + 32),
                behavior: reduceMotion.matches ? "auto" : "smooth"
            });
        });

        window.addEventListener("resize", measureLoop);
        scheduleAutoplay();
    }
}
