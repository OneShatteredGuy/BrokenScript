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

function extractCharsFromClass(classBody) {
    const chars = new Set();
    let i = 0;

    if (classBody[0] === '^') i = 1;

    while (i < classBody.length) {
        const ch = classBody[i];

        if (ch === '\\') {
            const next = classBody[i + 1];
            const escapeMap = {
                d: '0123456789',
                w: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_',
                s: ' \t\n\r'
            };

            if (Object.hasOwn(escapeMap, next)) {
                for (const c of escapeMap[next]) chars.add(c);
            } else {
                // escaped literal, e.g. \- or \] or \.
                chars.add(next);
            }

            i += 2;
            continue;
        }

        if (classBody[i + 1] === '-' && classBody[i + 2] && classBody[i + 2] !== ']') {
            const start = ch.charCodeAt(0);
            const end = classBody[i + 2].charCodeAt(0);

            for (let code = start; code <= end; code++) {
                chars.add(String.fromCharCode(code));
            }

            i += 3;
            continue;
        }

        chars.add(ch);
        i += 1;
    }

    return [...chars];
}

function extractCharsFromRegexSource(source) {
    const chars = new Set();
    const classMatches = source.matchAll(/\[([^\]]*)\]/g);

    for (const m of classMatches) {
        extractCharsFromClass(m[1]).forEach(c => chars.add(c));
    }

    return [...chars];
}

function resolveWhitelist(whitelist) {
    if (!whitelist) return [];

    if (whitelist.type === 'regex') {
        if (typeof whitelist.source !== 'string') return [];
        return extractCharsFromRegexSource(whitelist.source);
    }

    if (whitelist.type === 'chars') {
        if (!Array.isArray(whitelist.values)) return [];
        return whitelist.values;
    }

    return [];
}

function compileRules(rulesBlock) {
    const compiled = {};
    const whitelistChars = new Set();

    for (const [name, rule] of Object.entries(rulesBlock || {})) {
        if (typeof rule !== 'object' || rule === null || typeof rule.function !== 'string') {
            continue;
        }

        let fn;
        try {
            fn = new Function('token', rule.function);
        } catch (err) {
            throw new Error(`RULES.${name}: failed to compile function -- ${err.message}`);
        }

        for (const c of resolveWhitelist(rule.whitelist)) {
            whitelistChars.add(c);
        }

        compiled[name] = fn;
    }

    return {
        fns: compiled,
        whitelist: [...whitelistChars]
    };
}

/*-------------------------------------------------------
  Lexer rules
-------------------------------------------------------*/

function getLexRules(rules) {
    const global_tokentypes = rules.GLOBAL_TOKENTYPES;
    const structures = rules.STRUCTURES;
    const deliminators = rules.DELIMINATORS;
    const breakouts = rules.BREAKOUTS;

    let built_tokens = {};
    let blacklisted = new Set();

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

    for (const token of Object.keys(built_tokens)) {
        for (const char of token) {
            if (!/[A-Za-z0-9_]/.test(char)) {
                blacklisted.add(char);
            }
        }
    }

    const { fns: ruleFns, whitelist: ruleWhitelist } = compileRules(rules.RULES);

    for (const c of ruleWhitelist) {
        blacklisted.delete(c);
    }

    return {
        blacklisted: [...blacklisted],
        whitelisted: ruleWhitelist,
        built_tokens,
        rules: ruleFns,
        deliminators,
        breakouts
    };
}

function interpret(rulesFileName) {
    const rawRules = loadCompileRules(rulesFileName);

    return {
        lexer: getLexRules(rawRules)
    };
}

module.exports = { interpret };

if (require.main === module) {
    console.log(JSON.stringify(interpret('compiler/compile_rules.json'), (key, value) => {
        // rule functions aren't JSON-serializable; show their source instead
        if (typeof value === 'function') return value.toString();
        return value;
    }, 2));
}