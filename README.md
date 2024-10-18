<div align="center">

  # CSE 232 Examiner
  A tool that converts your typical CSE 232 sample example exams into web-based Q/A format.

</div>


## Usage

Allow students to have an efficient and better MCQ practice for CSE 232. Users or students would need to input the questions pdf and the answer key pdf in the respective input fields. This generates the questions with options. All the questions are formatted using MD (Markdown)

## Get Started

1. Clone the repo
2. /src/ contains the test code for the string REGEX checks
3. /docs/ contains all the web contents, and lexer/parser
4. [pdf.js v1.10.100](https://mozilla.github.io/pdf.js/)  is used for PDF rendering

## Parser / Lexer Structure 

### Questions PDF
1. Retrieve the PDF data buffer data from the URL provided by the user
2. Use pdf.js to render the PDF
3. Each page that is rendered and checked for a RegEx
4. If the RegEx is matched, then it is tokenized into their respective place (questions or options)
5. After tokenization, it will be compiled into a JSObject with the type ```{questions: string, options: string[]}```
6. This JSObject data is used to render each question and the options onto the webpage

### Answer Key PDF
1. Retrieve the PDF data buffer data from the URL provided by the user
2. Use pdf.js to render the PDF
3. Each page that is rendered and checked for RegExs
4. Checks for the sample exam title RegEx
5. Each answer RegEx match is mapped to their respective questions; this is the answer for each question 
6. This is compiled into a JSObject with the type ```{[string]: string}```
7. This JSObject is used to render the correct answer onto the webpage

# Contributors

<a href="https://github.com/ashp116" title="Ashp116">
  <img src="https://images.weserv.nl/?url=github.com/ashp116.png?v=4&h=300&w=300&fit=cover&mask=circle&maxage=7d" alt="Ashp116 Avatar" width="60" height="60" />
</a>

