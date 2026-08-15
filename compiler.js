/*-------READ ME-------//
File:        compiler.js

Pipeline:
interpreter -> lexer -> parser (shaper) -> enforcer -> translator -> builder

interpreter.js  reads compile_rules.json, builds machine-friendly
                per-stage vocab/structure lookups.
lexer.js        flat, context-free tokenization of the source script.
                labels tokens, no awareness of grammar/structure.
parser.js       arranges the flat token stream into matched
                STRUCTURES shapes.
enforcer.js     walks the shaped structures, checks/warns/errors on
                invalid syntax, corrects what it safely can.
translator.js   takes corrected structures, emits C++ source text.
builder.js      writes the emitted C++ to a timestamped file inside
                a build directory (creating the dir if needed).
//---------------------*/

const path = require('path');
const readline = require('readline');

const { interpret } = require('./compiler/interpreter.js');
//const { lex } = require('./compiler/lexer.js');

function compile(sourceFileName, options = {}) {
    const rulesFileName = options.rulesFileName || 'compiler/compile_rules.json';
    const buildDir = options.buildDir || path.join(__dirname, 'build');

    const warnings = [];
    const errors = [];

    const rules = interpret(rulesFileName);

    const tokens = lex(sourceFileName, rules.lexer);

    return { success: true, warnings, errors };
}

module.exports = { compile };


function ask(rl, question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

if (require.main === module) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    (async () => {
        const sourceFileName = await ask(rl, 'File to compile: ');
        if (!sourceFileName) {
            console.error('No file provided.');
            rl.close();
            process.exit(1);
        }

        const buildLocationAnswer = await ask(
            rl,
            'Build location (leave blank for default "./build"): '
        );
        rl.close();

        const buildDir = buildLocationAnswer
            ? path.resolve(buildLocationAnswer)
            : path.join(__dirname, 'build');

        const result = compile(sourceFileName, { buildDir });

        for (const w of result.warnings) console.warn(`[warning] ${w}`);
        for (const e of result.errors) console.error(`[error] ${e}`);

        if (result.success) {
            console.log(`Build succeeded: ${result.outputPath}`);
        } else {
            console.error('Build failed.');
            process.exit(1);
        }
    })();
}