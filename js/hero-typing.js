const typingWord = document.querySelector(".hero__typing-word");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (typingWord) {
    const words = ["Application", "Animations", "Development", "Experiences"];
    let wordIndex = 0;
    let characterIndex = words[0].length;
    let isDeleting = true;
    let timeoutId;

    const scheduleNextCharacter = (delay) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(updateWord, delay);
    };

    const updateWord = () => {
        if (reduceMotion.matches) {
            typingWord.textContent = words[0];
            return;
        }

        const currentWord = words[wordIndex];

        if (isDeleting) {
            characterIndex -= 1;
            typingWord.textContent = currentWord.slice(0, characterIndex);

            if (characterIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                scheduleNextCharacter(280);
            } else {
                scheduleNextCharacter(42);
            }
            return;
        }

        const nextWord = words[wordIndex];
        characterIndex += 1;
        typingWord.textContent = nextWord.slice(0, characterIndex);

        if (characterIndex === nextWord.length) {
            isDeleting = true;
            scheduleNextCharacter(1500);
        } else {
            scheduleNextCharacter(72);
        }
    };

    const handleMotionPreferenceChange = (event) => {
        window.clearTimeout(timeoutId);

        if (event.matches) {
            typingWord.textContent = words[0];
            return;
        }

        wordIndex = 0;
        characterIndex = words[0].length;
        isDeleting = true;
        scheduleNextCharacter(1500);
    };

    if (reduceMotion.matches) {
        typingWord.textContent = words[0];
    } else {
        scheduleNextCharacter(1500);
    }

    reduceMotion.addEventListener("change", handleMotionPreferenceChange);
}
