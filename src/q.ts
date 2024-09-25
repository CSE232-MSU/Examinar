function createMarkdownWithCodeBlock(input) {
    // Split the input into the question and code parts
    let parts = input.split('?');
    if (!parts[1]) return input;
    let question = parts[0].trim() + '?'; // Keep the question with the question mark
    let codeString = input.split('?')[1].trim();

    // Create the Markdown string with the question followed by the code block
    console.log(`\`\`\`\n${codeString}\n\`\`\``)
    return `${question}\n\n\`\`\`\n${codeString}\n\`\`\``;
}
function extractQuestionsToJson() {
    const container = document.querySelector('.text-container');
    const spans = container.querySelectorAll('span');
    let questions = [];
    let currentQuestion = null;
    const footerRegex = /Version\s+\w+\s+Page\s+\d+\s+of\s+\d+/i;
    const hyphenRegex = /(\w+)-\s+(\s*\w+)/g; // Regex to match word-hyphen-whitespace-word

    spans.forEach(span => {
        let text = span.textContent.trim();

        // Skip spans that contain code or are empty after cleaning
        if (span.classList.contains('code') || text === '') {
            return;
        }

        // If it's a new question (starts with a number)
        if (/^\d+\./.test(text)) {
            if (currentQuestion) {
                console.log(currentQuestion.question);
                currentQuestion.question = createMarkdownWithCodeBlock(currentQuestion.question)
                questions.push(currentQuestion); // Push the previous question into the array
            }
            currentQuestion = {
                question: text,
                options: []
            };
        }
        // If it's an option (starts with "(a)", "(b)", etc.)
        else if (/^\([a-z]\)/.test(text)) {
            if (currentQuestion) {
                currentQuestion.options.push(text);
            }
        }
        // If it's a continuation of the previous option/question
        else if (currentQuestion) {
            if (currentQuestion.options.length > 0) {
                // Append text to the last option
                currentQuestion.options[currentQuestion.options.length - 1] += " " + text;
                let currentOption = currentQuestion.options[currentQuestion.options.length - 1];

                // Remove footer text if it matches the pattern
                if (footerRegex.test(currentOption)) {
                    currentQuestion.options[currentQuestion.options.length - 1] = currentOption.replace(footerRegex, '').trim(); // Remove footer text
                }
            } else {
                currentQuestion.question += " " + text; // Append to the question if no option exists yet
                currentQuestion.question = currentQuestion.question.replace(hyphenRegex, '$1$2'); // Replace with no space between the two words
                // Clean up hyphenated words
            }
        }
    });

    if (currentQuestion) {
        console.log(currentQuestion.question);
        currentQuestion.question = createMarkdownWithCodeBlock(currentQuestion.question)
        questions.push(currentQuestion); // Push the final question after the loop
    }

    console.log(JSON.stringify(questions, null, 2));
    return questions;
}

// Call the function to extract and print questions as JSON
extractQuestionsToJson();
