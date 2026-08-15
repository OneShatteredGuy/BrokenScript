/*-------READ ME-------//
File:        interpreter.js
Description: Reads compile_rules.json and turns it into whatever
             machine-friendly lookup structures the rest of the
             pipeline needs. This is the ONE place that understands
             the raw JSON schema.
//---------------------*/

const fs = require('fs');

function loadCompileRules(fileName) {
    const raw = fs.readFileSync(fileName, 'utf8');
    return JSON.parse(raw);
}

function resolveVocab(localList, globalList) {
    if (!localList) return globalList || [];
    return localList.map(entry =>
        typeof entry === 'number' ? globalList[entry] : entry
    );
}


function getLexRules(rules) {
    const global_tokentypes = rules.GLOBAL_TOKENTYPES;
    const structures = rules.STRUCTURES;

    let built_tokens = {};
    let blacklisted = new Set();

    // Build global token lookup.
    for (const [key, value] of Object.entries(global_tokentypes)) {
        for (const token of value) {
            if (Array.isArray(token)) continue;

            if (Object.hasOwn(built_tokens, token)) {
                built_tokens[token].push(key);
                continue;
            }

            built_tokens[token] = [key];
        }
    }

    // Build structure-specific token lookup.
    for (const [name, structure] of Object.entries(structures)) {
        const tokenTypes = structure.TOKENTYPES;

        for (const [key, value] of Object.entries(tokenTypes)) {
            for (const token of value) {
                if (Array.isArray(token)) continue;

                if (typeof token === "number") {
                    const built_token_index = global_tokentypes[key][token];

                    if (!Object.hasOwn(built_tokens, built_token_index)) continue;

                    built_tokens[built_token_index].push(`${name}.${key}`);
                    continue;
                }

                if (Object.hasOwn(built_tokens, token)) {
                    built_tokens[token].push(`${name}.${key}`);
                    continue;
                }

                built_tokens[token] = [`${name}.${key}`];
            }
        }
    }

    // Compile characters used by tokens, excluding variable-name characters.
    for (const token of Object.keys(built_tokens)) {
        for (const char of token) {
            if (!/[A-Za-z0-9_]/.test(char)) {
                blacklisted.add(char);
            }
        }
    }

    return {
        blacklisted: [...blacklisted],
        built_tokens
    };
}



function interpret(rulesFileName) {
    const rawRules = loadCompileRules(rulesFileName);

    return {
        lexer: getLexRules(rawRules)
    };
}

module.exports = { interpret, resolveVocab, loadCompileRules, getLexRules };

console.log(interpret('compiler/compile_rules.json'));