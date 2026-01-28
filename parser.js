/*-------READ ME-------//
Project:     BrokenScript (BS) parser
Name:        Noah Zielinski
last update: 01/27/2026
version:     0.1
Description: I am making a parser for my own programming language.  This is just a test in programming language parsers.
             It is not meant to be all encompassing, hyper optimized, or extra powerful.  It is meant to help me play
             around with some features I would have liked to see in other common programming languages, and as practice
             for the eventual ShatteredScript I am going to use in my game engine, ShatterEngine
//---------------------*/

/*----Devlog / TODO----//
TODO:               STATUS:
LEXER               FINISHED
CONSTRUCTOR         STARTED
SYNTAX VALIDATOR    UNSTARTED
COMPILER            UNSTARTED

Devlog:
01/27/26- I made the lexer today.  the lexer is pretty generic,
        and uses a factory object to recognize and create tokens.  want to add a new keyword?  add a
        key/value pair to "token.type"  want it to be ignored on the intial token pass for special
        functionality?  add the key to "ignoreTokens"
//---------------------*/

//#region Lexer
const token = {
    type: {
        //scopes:
        LET: 'let', //accessible only within the block
        INST: 'inst', //accessible within the object, class, or function instance
        STATIC: 'static', //accessible within all instances of a class.  persists between function calls.
        GLOBAL: 'global', //accessible by everything

        //visibility:
        PRIVATE: 'private', //invisible to anything else
        PROTECTED: 'protected', //visible with the class or child classes.
        PUBLIC: 'public', //visible to everything

        //editors:
        SUPER: 'super',
        ASYNC: 'async',
        POINTER: 'pointer',

        //variable declaration
        VAR: 'var',
        CONST: 'const',
        FUNC: 'func',

        //class declarations and inheritance
        CLASS_NAME: 'class_name',
        INHERIT: 'inherits',
        EXTENDS: 'extends',

        //datatypes/typeassigner
        TYPEASSIGNER: ':',

        INT: 'Int',
        FLOAT: 'Float',

        VECTOR2: 'Vector2',
        VECTOR3: 'Vector3',
        iVECTOR2: 'iVector2',
        iVECTOR3: 'iVector3',

        FRAC: 'frac', //stored like vector2, but methods are differen. frac is meant for uncomputable values, like 1/3 or 2/7
        iFRAC: 'iFrac', //stored like ivector2

        BOOL: 'Bool',
        TRUE: 'True',
        FALSE: 'False',

        BITFLAG: 'BitFlag', //stores an object with keys and bool values
        BITARRAY: "BitArray", //stores a 32 bit number

        STRING: 'String', //just a normal string
        rSTRING: 'rString', //string that escapes special commands
        fSTRING: 'fString', //string that accepts special formatting, multiline, and interpolation

        //data containers:
        DICT: 'Dict',
        ARRAY: 'Array',
        TUPLE: 'Tuple',
        SET: 'Set',

        //empty value:
        NULL: 'None',
        VOID: 'Void',

        //conditionals:
        IF: 'if',
        ELIF: 'elif',
        ELSE: 'else',
        WHEN: 'when', // listens for when the condition becomes true

        //Error Handling:
        TRY: 'try',
        CATCH: 'catch',
        FINALLY: 'finally',
        THROW: 'throw',

        //loops:
        FOR: 'for', // normal for loop
        RUN: 'run', // like a while loop in any other language
        WHILE: 'while', // like a while loop, but breaks instantly upon the condition becoming false, similar to WHEN

        //breakers:
        BREAK: 'break',
        PASS: 'pass',
        CONTINUE: 'continue',
        return: 'return',

        //operators:
        SUM: '+',
        SUB: '-',
        UNARY: '--',

        MULT: '*',
        EXP: '**',

        DIV: '/',
        INTDIV: '//',
        MOD: '%',

        BITAND: '&',
        BITOR: '|',
        BITXOR: '^',
        BITNOT: '~',
        LSHIFT: '<<',
        RSHIFT: '>>',

        //assign operators
        ASSIGN: '=',

        ASSIGNSUM: '+=',
        ASSIGNSUB: '-=',
        ASSIGNUNARY: '=--',

        ASSIGNDIV: '/=',
        ASSIGNINDDIV: '//=',
        ASSIGNMOD: '%=',

        ASSIGNMULT: '*=',
        ASSIGNEXP: "**=",

        ASSIGNAND: '&=',
        ASSIGNOR: '|=',
        ASSIGNXOR: '^=',
        ASSIGNLSHIFT: '<<=',
        ASSIGNRSHIFT: '>>=',

        //truthy checks
        AND: 'and', // both conditions are truthy
        OR: 'or', //1 or more condition is truthy
        XOR: 'xor', //only one condition is truthy
        NOT: 'not', //flip truth of condition
        IS: 'is', //conditions equal to each other
        ISNT: 'isnt', //conditions not equal to each other
        GREATER: 'greater', //condition1 > condition2
        LESSER: 'lesser', // condition 1 < condition2
        GREATERIS: 'greateris', //condition1 >= condition2
        LESSERIS: 'lesseris', //condition1 <= condition2

        //comments
        COMMENT: '#',
        COLLAPSIBLECOMMENT: "##",

        //symbol pairs:
        LPAREN: '(',
        RPAREN: ')',

        LBRACK: '[',
        RBRACK: ']',

        LCURL: '{',
        RCURL: '}',

        //misc:
        ACCESS: '.',
        SEPARATOR: ',',
        SLICE: ':',
        ENDSTATEMENT: ';',
        NEWLINE: '\n',

        //modules:
        IMPORT: 'import',
        FROM: 'from',
        AS: 'as',
        EXPORT: 'export',

        //valued tokens:
        REFERENCE: 'reference',
        NUMBER: 'number',
        STRINGBODY: 'stringbody',
        UNRECOGNIZED: 'unrecognized'
    },
    create(type, line, column, value = '') {
        if (type === token.type.REFERENCE || type === token.type.NUMBER || type === token.type.STRINGBODY || type === token.type.UNRECOGNIZED) {
            return {type, line, column, value}
        }
        return {type, line, column, value: ''}
        
        
    }
}

const ignoreTokens = new Set([
    token.type.REFERENCE,
    token.type.NUMBER,
    token.type.STRINGBODY,
    token.type.UNRECOGNIZED,
    token.type.COMMENT,
    token.type.COLLAPSIBLECOMMENT
]);

function getFirstString(script) {
    let str = '';
    let i = 0;
    let strType = '';

    if (script[i] === "'") {
        while (i < script.length) {
            i++;
            if (script[i] === "'") {
                break
            }
            str += script[i]
        }
        strType = token.type.STRING;
        return {str, strType}
    }
    if (script[i] === '"') {
        while (i < script.length) {
            i++;
            if (script[i] === '"') {
                break
            }
            str += script[i]
        }
        strType = token.type.fSTRING;
        return {str, strType}
    }
    if (script[i] === "`") {
        while (i < script.length) {
            i++;
            if (script[i] === "`") {
                break
            }
            str += script[i]
        }
        strType = token.type.fSTRING;
        return {str, strType}
    }
    if (script.startsWith("##")) {
        i++;
        while (i < script.length) {
            i++;
            if (script.substring(i, i+2) === "##") {
                break
            }
            str += script[i]
        }
        strType = token.type.COLLAPSIBLECOMMENT;
        return {str, strType}
    }
    if (script.startsWith("#")) {
        while (i < script.length) {
            i++;
            if (script[i] === "\n") {
                break
            }
            str += script[i]
        }
        strType = token.type.COMMENT;
        return {str, strType}
    }

    return {str, strType}
}

function getFirstNumber(script, hasDot = false) {
    let num = '';
    let i = 0;

    while (i < script.length) {
        const char = script[i];
        if (char >= '0' && char <= '9') {
            num += char;
        } else if (char === '.' && !hasDot) {
            num += char;
            hasDot = true;
        } else {
            break;
        }
        i++;
    }

    return num;
}

function getFirstWord(script) {
    let word = '';
    let i = 0;

    while (i < script.length && /[a-zA-Z0-9_]/.test(script[i])) {
        word += script[i];
        i++;
    }

    return word;
}

function returnFileData(fileName) {
    const fs = require('fs');
    let fileData = ''
    try {
        fileData = fs.readFileSync(fileName, 'utf8')
    } catch (err) {
        console.error(err);
    }
    return fileData
}

function lex(fileName) {
    const sortedTokens = Object.values(token.type)
        .filter(t => !ignoreTokens.has(t))
        .sort((a, b) => b.length - a.length);

    const script = returnFileData(fileName)

    let cursor = 0
    let line = 0
    let column = 0

    let tokens = []

    while (cursor < script.length) {
        let slice = script.slice(cursor);

        //skip whitespace
        const WHITESPACE = /\s/;
        while (cursor < script.length && WHITESPACE.test(script[cursor])) {
            if (script[cursor] === '\n') {
                tokens.push(token.create(token.type.NEWLINE, line, column - 1))

                line += 1;
                column = 0;
            } else {
                column += 1;
            }
            cursor += 1;
        }

        slice = script.slice(cursor)

        //check if is a known token
        let matched = false;
        for (let tokVal of sortedTokens) {

            if (slice.startsWith(tokVal)) {
                tokens.push(token.create(tokVal, line, column))

                cursor += tokVal.length;
                column += tokVal.length;

                if (tokVal === token.type.NEWLINE) {
                    line++;
                    column = 0;
                }

                matched = true;
                break;
            }
        }

        // skipping next steps if it was known token
        if (matched) {
            continue;
        }

        //special tokens:
        let tokenText = getFirstWord(slice);
        if (tokenText.length !== 0) {
            tokens.push(token.create(token.type.REFERENCE, line, column, tokenText));

            cursor += tokenText.length;
            column += tokenText.length;

            continue;
        }

        tokenText = getFirstNumber(slice)
        if (tokenText.length !== 0) {
            let tokenType = tokenText.includes('.') ? token.type.FLOAT : token.type.INT;
            tokens.push(token.create(tokenType, line, column));
            tokens.push(token.create(token.type.LPAREN, line, column));
            tokens.push(token.create(token.type.NUMBER, line, column, tokenText));
            tokens.push(token.create(token.type.RPAREN, line, column));

            cursor += tokenText.length;
            column += tokenText.length;

            continue;
        }

        tokenText = getFirstString(slice)
        if (tokenText.str.length !== 0) {
            let tokenType = tokenText.strType;
            let tokenStr = tokenText.str;

            tokens.push(token.create(tokenType, line, column));
            tokens.push(token.create(token.type.LPAREN, line, column));
            tokens.push(token.create(token.type.STRINGBODY, line, column, tokenStr));
            tokens.push(token.create(token.type.RPAREN, line, column));

            let multiplier = 1;
            if (tokenType === token.type.COLLAPSIBLECOMMENT) {
                multiplier = 2
            } else if (tokenType === token.type.COMMENT) {
                multiplier = 0.5
            }
            cursor += tokenStr.length + 2 * multiplier;
            column += tokenStr.length + 2 * multiplier;

            continue;
        }

        if (cursor >= script.length) {
            break;
        }

        tokens.push(token.create(token.type.UNRECOGNIZED, line, column, script[cursor]));
        column++;
        cursor++;
    }

    return tokens
}
//#endregion

//#region Constructor | WARNING unfinished

//#endregion