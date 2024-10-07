const toggleButton = document.getElementById('toggle-dark-mode');
const styleLink = document.getElementById('highlight-style');
const lightIcon = document.getElementById('light-icon');
const darkIcon = document.getElementById('dark-icon');

const reloadHighlight = () => {
    // Save user preference in localStorage
    if (localStorage.getItem('dark-mode') === 'enabled') {
        styleLink.href = 'https://cdn.jsdelivr.net/gh/highlightjs/highlight.js@11.7.0/src/styles/atom-one-dark.css';
    } else {
        styleLink.href = 'https://cdn.jsdelivr.net/gh/highlightjs/highlight.js@11.7.0/src/styles/atom-one-light.css';
    }
    hljs.highlightAll(); // Re-highlight the code blocks
}

reloadHighlight();
loadTheme();

toggleButton.addEventListener('click', () => {
    themeActivation();
    reloadHighlight();
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (window.innerWidth < 768) {
        const isOpen = sidebar.classList.toggle('overlay-open');
        overlay.style.display = isOpen ? 'block' : 'none';
        document.querySelector('.main-content').style.opacity = isOpen ? '0.2' : '1';
    }
    else {
        overlay.style.display = 'none';
        document.querySelector('.main-content').style.opacity = '1';
    }
}

function goHome() {
    window.location.href = '../'; // Adjust the URL to your home page
}

(async () => {
    let params = {};
    window.location.search.split("?").forEach((val) => {
        let str_params = decodeURIComponent(val).split("&");
        str_params.forEach((element) => {
            let param = element.split("=");
            if (param.length > 1) {
                params[param[0]] = param[1];
            }
        });
    });

    if (!params['pdf']) return;

    const urlSplit = atob(params['pdf']);
    const pdfQUrl = urlSplit.split(";")[0];
    const pdfAUrl = urlSplit.split(";")[1];

    const { questions, title } = await extractQuestionsFromPDF(pdfQUrl);
    const answers = await extractAnswersFromPDF(pdfAUrl);

    document.getElementById("title").innerText = title;
    document.getElementById("main-title").innerText += title;

    questions.map((value, index) => value.answer = answers[index]);
    const questionAnswerPairs = questions;

    let currentQuestionIndex = params['q'] ? (parseInt(params['q']) - 1) : 0;
    let selectedAnswer = null;

    const questionTitle = document.getElementById('questionTitle');
    const optionsContainer = document.getElementById('optionsContainer');
    // const feedbackMessage = document.getElementById('feedbackMessage');
    const questionNav = document.getElementById('questionNav');

    const navButtons = [];

    function createNavButtons() {
        questionAnswerPairs.forEach((_, index) => {
            const button = document.createElement('button');
            button.classList.add('border', 'border-neutral-400', 'dark:border-neutral-950', 'p-2', 'rounded-md', 'text-center', 'text-black', 'dark:text-white', 'dark:text-neutral-300', 'hover:bg-blue-100', 'dark:hover:bg-blue-950', 'bg-white', 'dark:bg-neutral-900');
            button.textContent = index + 1;

            button.addEventListener('click', () => {
                jumpToQuestion(index);
                updateUrlWithQuestionNumber(); // Update URL
                toggleSidebar();
            });

            navButtons.push(button);
            questionNav.appendChild(button);
        });

        updateActiveButton();
    }

    function updateActiveButton() {
        navButtons.forEach((button, index) => {
            button.classList.remove('bg-blue-500', 'dark:bg-blue-950');
            if (index === currentQuestionIndex) {
                button.classList.add('bg-blue-500', 'dark:bg-blue-950');
            }
        });
    }

    function renderQuestion() {
        const currentQuestion = questionAnswerPairs[currentQuestionIndex];

        // Render the question in Markdown
        questionTitle.innerHTML = marked(`\u00A0${currentQuestion.question}`);

        // Beautify and highlight code blocks inside the question
        const codeBlocks = questionTitle.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock) => {
            const beautifiedCode = js_beautify(codeBlock.textContent);
            codeBlock.textContent = beautifiedCode;
            hljs.highlightElement(codeBlock);
        });

        optionsContainer.innerHTML = '';
        selectedAnswer = null;

        for (const [key, value] of Object.entries(currentQuestion.options)) {
            const optionContainer = document.createElement('div');
            optionContainer.classList.add('bg-blue-100', 'dark:bg-blue-800', 'p-4', 'rounded-lg', 'hover:bg-blue-200', 'dark:hover:bg-blue-700', 'cursor-pointer', 'transition', 'duration-200', 'flex', 'items-center');

            const optionRadio = document.createElement('input');
            optionRadio.type = 'radio';
            optionRadio.name = 'answer';
            optionRadio.value = key;
            optionRadio.id = key;
            optionRadio.classList.add('mr-2');

            optionRadio.addEventListener('change', () => {
                selectedAnswer = value; // Set the selected answer
                checkAnswer(optionContainer, currentQuestion); // Call checkAnswer after updating selectedAnswer
            });

            optionContainer.onclick = function () {
                optionRadio.checked = true; // Set the radio button to checked
                optionRadio.dispatchEvent(new Event('change')); // Trigger the change event to check the answer
            }

            const optionLabel = document.createElement('label');
            optionLabel.classList.add('text-neutral-900', 'dark:text-neutral-300');
            optionLabel.setAttribute('for', key);
            optionLabel.textContent = value;

            optionContainer.appendChild(optionRadio);
            optionContainer.appendChild(optionLabel);
            optionsContainer.appendChild(optionContainer);
        }

        updateActiveButton();
    }

    function checkAnswer(selectedOptionContainer, currentQuestion) {
        // Check if a selected answer exists
        if (!selectedAnswer) return;

        // Assuming the selected answer is compared to the correct answer
        const isCorrect = selectedAnswer.split(' ', 1)[0] === currentQuestion.answer;

        // Remove existing classes for default background and hover effects
        selectedOptionContainer.classList.remove('bg-blue-100', 'hover:bg-blue-200', 'dark:bg-blue-800', 'dark:hover:bg-blue-700');

        // Add classes based on whether the answer is correct or incorrect
        if (isCorrect) {
            selectedOptionContainer.classList.add('bg-green-200', 'dark:bg-green-600');
        } else {
            selectedOptionContainer.classList.add('bg-red-200', 'dark:bg-red-800');
        }
    }

    function jumpToQuestion(index) {
        currentQuestionIndex = index;
        updateNavigationButtons();
        renderQuestion();
    }

    function updateUrlWithQuestionNumber() {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('q', currentQuestionIndex + 1);
        window.history.pushState({}, '', newUrl);
    }

    createNavButtons();
    // Function to update the state of the navigation buttons
    function updateNavigationButtons() {
        const backButton = document.getElementById('backButton');
        const nextButton = document.getElementById('nextButton');

        // Hide back button if on the first question
        backButton.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';

        // Hide next button if on the last question
        nextButton.style.visibility = currentQuestionIndex === questionAnswerPairs.length - 1 ? 'hidden' : 'visible';
    }

    // Create event listeners for the Back and Next buttons
    document.getElementById('backButton').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--; // Move to the previous question
            renderQuestion(); // Render the new question
            updateUrlWithQuestionNumber(); // Update URL
            updateNavigationButtons(); // Update button states
        }
    });

    document.getElementById('nextButton').addEventListener('click', () => {
        if (currentQuestionIndex < questionAnswerPairs.length - 1) {
            currentQuestionIndex++; // Move to the next question
            renderQuestion(); // Render the new question
            updateUrlWithQuestionNumber(); // Update URL
            updateNavigationButtons(); // Update button states
        }
    });

    // Call this function initially to set the button states
    updateNavigationButtons();

    // Render the first question initially
    renderQuestion();

})();

const optionsContainer = document.getElementById('optionsContainer');
const scrollUpArrow = document.getElementById('scrollUp');
const scrollDownArrow = document.getElementById('scrollDown');

const updateScrollArrowsVisibility = () => {
    const scrollTop = optionsContainer.scrollTop;
    const scrollHeight = optionsContainer.scrollHeight;
    const clientHeight = optionsContainer.clientHeight;

    // Show the up arrow if not scrolled to the top
    scrollUpArrow.classList.toggle('hidden', scrollTop === 0);

    // Show the down arrow if there is more content to scroll
    scrollDownArrow.classList.toggle('hidden', scrollTop + clientHeight >= scrollHeight);
};

// Observe changes in the optionsContainer for children added or removed
const observer = new MutationObserver(updateScrollArrowsVisibility);
observer.observe(optionsContainer, { childList: true });

// Event listener for scroll
optionsContainer.addEventListener('scroll', updateScrollArrowsVisibility);

// Event listener for window resize
window.addEventListener('resize', () => {
    updateScrollArrowsVisibility()
    toggleSidebar()
});

// Scroll down when the down arrow is clicked
scrollDownArrow.addEventListener('click', () => {
    optionsContainer.scrollBy({ top: 100, behavior: 'smooth' }); // Adjust scroll amount as needed
});

// Scroll up when the up arrow is clicked
scrollUpArrow.addEventListener('click', () => {
    optionsContainer.scrollBy({ top: -100, behavior: 'smooth' }); // Adjust scroll amount as needed
});

// Initial check for content visibility and arrow visibility on page load
window.onload = () => {
    updateScrollArrowsVisibility();
};
