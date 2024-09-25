const fs = require('fs');
import pdf from 'pdf-parse';
const PDFJS = require('../docs/pdf.js/build/pdf.js')

// Function to create Markdown with code blocks
function createMarkdownWithCodeBlock(input) {
    let parts = input.split('?');
    if (!parts[1]) return input;
    let question = parts[0].trim() + '?'; // Keep the question with the question mark
    let codeString = input.split('?')[1].trim();

    // Create the Markdown string with the question followed by the code block
    return `${question}\n\n\`\`\`\n${codeString}\n\`\`\``;
}

// Function to extract answers from PDF text
function extractAnswersFromText(text) {
    const answers = [];
    const regex = /\([a-z]\)/g; // Matches answers like (a), (b), etc.
    const matches = text.match(regex);

    if (matches) {
        matches.forEach(match => answers.push(match)); // Push each matched answer
    }

    //console.log('Extracted Answers:', answers);
    return answers; // Return the array of answers
}

// Function to extract questions from PDF text
function extractQuestionsFromText(text) {
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

        // Question
        if (/^\d+\.\s/.test(trimmedLine)) {
            if (currentType.length > 0) {
                currentQuestion.question = currentQuestion.question.trim();

                // Clean up hyphenated text
                currentQuestion.question = currentQuestion.question.replace(hyphenRegex, '$1$2').trim();
                currentQuestion.options.forEach((option, index) => {
                    currentQuestion.options[index] = option.replace(hyphenRegex, '$1$2').trim();
                })

                currentQuestion.question = createMarkdownWithCodeBlock(currentQuestion.question);
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
        questions.push(currentQuestion);
    }

    console.log('Extracted Questions:', questions);
    return questions;
}


function render_page(pageData) {
    //check documents https://mozilla.github.io/pdf.js/
    //ret.text = ret.text ? ret.text : "";

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

(async() => {
    const dataBuffer = fs.readFileSync('Week02_Sample_Questions.pdf');
    let doc = await PDFJS.getDocument(dataBuffer);
    let counter = doc.numPages;
    let text = "";

    let metaData = await doc.getMetadata().catch(function(err) {
        return null;
    });

    for (var i = 1; i <= counter; i++) {
        let page = await doc.getPage(i);
        text = `${text}\n\n${await render_page(page)}`;
    }

    doc.destroy();
    const questions = extractQuestionsFromText(text);
    //console.log(text)
    console.log('Final Questions:', questions);
})()
/*
// Function to read and process the PDF file
async function processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    // Extract answers and questions from the PDF text
    const answers = extractAnswersFromText(data.text);
    const questions = extractQuestionsFromText(data.text);

    return { answers, questions };
}

// Call processPDF with your specified PDF file
processPDF('Week02_Sample_Questions.pdf')
    .then(({ answers, questions }) => {
        //console.log('Final Answers:', answers);
        //console.log('Final Questions:', questions);
    })
    .catch(error => {
        console.error('Error processing PDF:', error);
    });
*/
