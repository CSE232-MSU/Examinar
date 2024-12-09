// Async function to format code using clang-format
function beautifyCode(code) {
    //const formattedCode = await clang.format(code, { style: 'Google' }); // You can change the style to LLVM, Mozilla, etc.
    return js_beautify(code);
}

// Async fetch function to pull the pdf from a given URL
async function fetchPDFData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    return await response.arrayBuffer(); // Get the PDF data as an ArrayBuffer
}

// Parsing a page from a given PDF page
function parsePage(pageData) {
    //check documents https://mozilla.github.io/pdf.js/

    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
        .then(function(textContent) {
            let lastY, text = '';
            //https://github.com/mozilla/pdf.js/issues/8963
            //https://github.com/mozilla/pdf.js/issues/2140
            //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
            //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY){
                    text += " " + item.str;
                }
                else{
                    text += '\n' + item.str;
                }
                lastY = item.transform[5];
            }
            //let strings = textContent.items.map(item => item.str);
            //let text = strings.join("\n");
            //text = text.replace(/[ ]+/ig," ");
            //ret.text = `${ret.text} ${text} \n\n`;
            return text;
        });
}

// Function to create Markdown with code blocks
function createMarkdownWithCodeBlock(input) {
    let parts = input.split('?');
    if (!parts[1]) return input;
    let question = parts[0].trim() + '?'; // Keep the question with the question mark
    let codeString = input.split('?')[1].trim();
    // Create the Markdown string with the question followed by the code block
    return `${question}\n\n\`\`\`\n${beautifyCode(codeString)}\n\`\`\``;
}

// Function to parse PDF
async function parsePDF(dataBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const counter = doc.numPages;
    let text = '';

    for (let i = 1; i <= counter; i++) {
        let page = await doc.getPage(i);
        text += `\n\n${await parsePage(page)}`;
    }

    return text;
}

// Function to fetch title of PDF
async function getTitleOfPDF(dataBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const counter = doc.numPages;
    let page1 = await doc.getPage(1);
    let textContent = await (page1).getTextContent();

    return textContent.items[0].str;
}

// Function to extract answers from PDF text
async function extractAnswersFromPDF(url) {
    const dataBuffer = await fetchPDFData(url);
    const text = await parsePDF(dataBuffer);

    const questionAnswers = {};
    const questionRegex = /^(\d+)\s+/gm; // Matches the question number
    const answerRegex = /\(([a-z](?:[^a-zA-Z0-9\(\)]?[a-z])*)\)/g; // Matches the answers

    let questionMatch;
    while ((questionMatch = questionRegex.exec(text)) !== null) {
        const questionNumber = questionMatch[1]; // Extract the question number
        const startIndex = questionMatch.index; // Start of the question line
        const endIndex = text.indexOf("\n", startIndex); // End of the question line

        // Extract the corresponding answer(s) from the same line
        const lineText = text.substring(startIndex, endIndex);
        const answers = [];
        let answerMatch;
        while ((answerMatch = answerRegex.exec(lineText)) !== null) {
            answers.push(...answerMatch[1].split(",").map(opt => opt.trim())); // Split multiple answers
        }

        questionAnswers[questionNumber] = answers; // Map the question number to its answers
    }

    //console.log('Extracted Answers:', questionAnswers);
    return questionAnswers; // Return the array of answers
}

// Function to extract questions from PDF text
async function extractQuestionsFromPDF(url) {
    const dataBuffer= await fetchPDFData(url);
    const text = await parsePDF(dataBuffer)
    const title = await getTitleOfPDF(dataBuffer);
    const questions = [];
    let currentQuestion = {
        question: "",
        options: []
    };
    const hyphenRegex = /(\w+)-\s+(\w+)/g;

    const lines = text.split('\n');
    let currentType = "";

    lines.forEach(line => {
        let trimmedLine = line.trim();
        trimmedLine = trimmedLine.replace(/Version\s+[A-Za-z]\s+Page\s+\d+\s+of\s+\d+/, "")
        trimmedLine = trimmedLine.replace("This page intentionally left blank.", "")

        // Question
        if (/^\d+\.\s/.test(trimmedLine)) {
            if (currentType.length > 0) {
                currentQuestion.question = currentQuestion.question.trim();

                // Clean up hyphenated text
                currentQuestion.question = currentQuestion.question.replace(hyphenRegex, '$1$2').trim();
                currentQuestion.options.forEach((option, index) => {
                    currentQuestion.options[index] = option.replace(/Version\s+[A-Za-z]\s+Page\s+\d+\s+of\s+\d+/, "").replace(hyphenRegex, '$1$2').trim();
                })

                currentQuestion.question = createMarkdownWithCodeBlock(currentQuestion.question.replace(/\s+/g, ' ').trim());
                questions.push(currentQuestion);
                currentQuestion = {
                    question: "",
                    options: []
                };
            }

            currentType = "question";
            currentQuestion.question = trimmedLine;
        }
        else if (/^\([a-z]\)/.test(trimmedLine)) {
            currentType = "option"
            currentQuestion.options.push(trimmedLine);
        }
        else {
            if (currentType == "question") {
                currentQuestion.question += " " + trimmedLine;
            }
            else if (currentType == "option") {
                currentQuestion.options[currentQuestion.options.length - 1] += " " + trimmedLine;
            }
        }
    });

    // Push the last question if it exists
    if (currentQuestion) {
        currentQuestion.question = currentQuestion.question.trim();
        // Clean up hyphenated text
        currentQuestion.question = currentQuestion.question.replace(hyphenRegex, '$1$2').trim();
        currentQuestion.options.forEach((option, index) => {
            currentQuestion.options[index] = option.replace(/Version\s+[A-Za-z]\s+Page\s+\d+\s+of\s+\d+/, "").replace(hyphenRegex, '$1$2').trim();
        })

        currentQuestion.question = createMarkdownWithCodeBlock(currentQuestion.question.replace(/\s+/g, ' ').trim());
        questions.push(currentQuestion);
        currentQuestion = {
            question: "",
            options: []
        };
    }

    return {questions: questions, title: title};
}