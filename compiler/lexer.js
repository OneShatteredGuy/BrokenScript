/*-------READ ME-------//
File:        lexer.js
Description: Reads interpreter.js lexer output and the desired file and tokenizes the desired file.
//---------------------*/

const fs = require('fs');

function loadFile(fileName) {
    const raw = fs.readFileSync(fileName, 'utf8');
    return raw;
}

function splitByMultiple(input, delimiters) {
    const parts = [];
    let buffer = '';
    let i = 0;

    while (i < input.length) {
        let matched = null;
        for (const delim of delimiters) {
            if (input.startsWith(delim, i)) {
                matched = delim;
                break;
            }
        }

        if (matched) {
            if (buffer.length > 0) parts.push(buffer);
            parts.push(matched);
            buffer = '';
            i += matched.length;
        } else {
            buffer += input[i];
            i++;
        }
    }

    if (buffer.length > 0) parts.push(buffer);
    return parts;
}

function tokenize(lex_rules, fileRaw, fileName) {
    let curr_file = fileName;
    let curr_line = 0;
    let curr_char = 0;

    const DELIMINATORS = lex_rules.deliminators;
    const BREAKOUTS = lex_rules.breakouts;
    const BLACKLISTED = lex_rules.blacklisted;
    let built_tokens = lex_rules.built_tokens;

    //compiletime pullout
    const pass0 = splitByMultiple(fileRaw, BREAKOUTS.COMPILE_PULLOUT);
    let pulloutStarted = 0;
    let pass1 = "";
    while (true) {
        const chunk = pass0[0];
        if (chunk === undefined) break;
        
        if (chunk === BREAKOUTS.COMPILE_PULLOUT[pulloutStarted]) {
            pulloutStarted = 1 - pulloutStarted;
            pass1 = pass1 + DELIMINATORS.LINE[0];
        } else {
            pass1 = pass1 + chunk;
        }
        pass0.shift();
    }
    pass1 = pass1;

    
    
    let tokenized = [];
    
    return tokenized;
}

function lex(lex_rules, fileName) {
    const raw = loadFile(fileName);

    const tokens = tokenize(lex_rules, raw, fileName);
}

module.exports = { lex };
