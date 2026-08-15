Project:     BrokenScript (BS) parser

Name:        Noah Zielinski

last update: 01/27/2026

version:     0.1

Description:
I am making a parser for my own programming language.  This is just a test in programming language parsers.  It is not meant to be all encompassing, hyper optimized, or extra powerful.  It is meant to help me play around with some features I would have liked to see in other common programming languages, and as practice for the eventual ShatteredScript I am going to use in my game engine, ShatterEngine


TODO:               STATUS:

LEXER               UNSTARTED

CONSTRUCTOR         UNSTARTED

SYNTAX VALIDATOR    UNSTARTED

COMPILER            UNSTARTED


DEVLOG:

#01/27/2026

I made the lexer today.  the lexer is pretty generic,and uses a factory object to recognize and create tokens.  want to add a new keyword?  add a key/value pair to "token.type"  want it to be ignored on the intial token pass for special functionality?  add the key to "ignoreTokens"


#08/14/2026

I restarted today.  There's been a large gap, during which i've really refined the direction I want to take this.

I've also brainstormed a new data-driven structure for my language that should hopefully make it SUPER easy to make compile-time addons for it.
