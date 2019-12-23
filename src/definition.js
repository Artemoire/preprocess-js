// More apt name for this file is directives.js
const esprima = require('esprima');

const dirs = {
    'ifdef': onIfDef,
    'ifndef': onIfNDef,
    'endif': onEndIf,
    'elif': onElif,
    'elifn': onElifN,
    'else': onElse,
    'undef': onUndef,
    'include': onInclude,
    'echo': onEcho,
    'error': onError,
    'define': onDefine,
}

function onIfDef(ctx, token) {
    //0 12345678
    // '%ifdef X'
    var testDef = token.value.substring(8);
    var isDef = (typeof ctx.defs[testDef] != 'undefined'
        && ctx.defStack[ctx.defStack.length - 1]);
    ctx.defStack.push(isDef);
}

function onIfNDef(ctx, token) {
    //0 123456789
    // '%ifndef X'
    var testDef = token.value.substring(9);
    var isDef = (typeof ctx.defs[testDef] == 'undefined'
        && ctx.defStack[ctx.defStack.length - 1]);
    ctx.defStack.push(isDef);
}

function onEndIf(ctx, token) {
    if (ctx.defStack.length == 0) {
        throw `Preprocess Error: Closing unexisting ifdef directive`;
    }
    ctx.defStack.pop();
}

function onElif(ctx, token) {
    //0 1234567
    // '%elif X'    
    var testDef = token.value.substring(7);
    if (ctx.defStack.length <= 1) {
        // TODO: Macro Stack?
        // TODO: Location Reporting
        throw `Preprocess Error: Elif can't branch`;
    }
    var isDef = !ctx.defStack[ctx.defStack.length - 1] &&
        ctx.defStack[ctx.defStack.length - 2] &&
        typeof ctx.defs[testDef] != 'undefined';
    ctx.defStack.pop();
    ctx.defStack.push(isDef);
}

function onElifN(ctx, token) {
    //0 12345678
    // '%elifn X'
    var testDef = token.value.substring(8);
    if (ctx.defStack.length <= 1) {
        // TODO: Macro Stack?
        // TODO: Location Reporting
        throw `Preprocess Error: ElifN can't branch`;
    }
    var isDef = !ctx.defStack[ctx.defStack.length - 1] &&
        ctx.defStack[ctx.defStack.length - 2] &&
        typeof ctx.defs[testDef] == 'undefined';
    ctx.defStack.pop();
    ctx.defStack.push(isDef);
}

function onElse(ctx, token) {
    if (ctx.defStack.length <= 1) {
        // TODO: Macro Stack?
        // TODO: Location Reporting
        throw `Preprocess Error: Else can't branch`;
    }
    var isDef = !ctx.defStack[ctx.defStack.length - 1] &&
        ctx.defStack[ctx.defStack.length - 2];
    ctx.defStack.pop();
    ctx.defStack.push(isDef);
}

function onUndef(ctx, token) {
    // Don't undef if not emitting
    if (!ctx.defStack[ctx.defStack.length - 1])
    {
        return;
    }
    //0 12345678
    // '%undef X'
    var undefDef = token.value.substring(8);
    ctx.onUndef(undefDef);
}

function onInclude(ctx, token) {
    // Don't include if not emitting
    if (!ctx.defStack[ctx.defStack.length - 1])
    {
        return;
    }
    //0 123456789A
    // '%include X'
    var includeId = token.value.substring(10);
    if(typeof ctx.includes[includeId] == 'undefined')  {
        // TODO: Location Reporting
        throw `Unknown include object key ${includeId}`;
    }
    ctx.onInclude(includeId);
}

function onEcho(ctx, token) {
    //0 1234567
    // '%echo X'
    if (!ctx.defStack[ctx.defStack.length - 1])
    {
        return;
    }
    var echoText = token.value.substring(7);
    // TODO: ctx.log ?
    console.log(echoText);
}

function onError(ctx, token) {
    //0 12345678
    // '%error X'
    if (!ctx.defStack[ctx.defStack.length - 1])
    {
        return;
    }
    var errorText = token.value.substring(8);
    // TODO: should throw ?
    // TODO: location reporting ?
    throw errorText;
}

function onDefine(ctx, token)  {
    // Don't define if not ifdef (conditional define)
    if (!ctx.defStack[ctx.defStack.length - 1])
    {
        return;
    }
    //0 123456789
    // '%define X'
    var defDef = token.value.substring(9);
    var macroTokens = esprima.tokenize(defDef, { comment: true, loc: true });
    if (macroTokens[0].type != 'Identifier') {
        // TODO: Source Location Reporting
        throw `Preprocessor Error: Macro definition must start with an identifier`;
    }

    var macroIdentifier = macroTokens[0].value;
    var macroBody = [];
    var argC = 0;
    if (macroTokens[1].value == '(') {
        var { args, i } = parseDefArgs(token, macroTokens);
        argC = args.length;

        if (i >= macroTokens.length) {
            // TODO: Source Location Reporting
            throw `Preprocessor Error: Macro function definition missing body`;
        }

        for (; i < macroTokens.length; i++) {
            var fToken = macroTokens[i];
            var argId = 0;
            if (fToken.type != 'Identifier' || (argId = args.indexOf(fToken.value)) == -1) {
                macroBody.push(fToken);
            } else {
                macroBody.push({ type: 'macro-arg', value: argId, loc: fToken.loc });
            }
        }
    } else {
        macroBody = macroTokens.slice(1); // define NAME[0] BODY[1+]
    }

    ctx.onDefine({
        identifier: macroIdentifier,
        body: macroBody,
        argC: argC
    });
}

function parseDefArgs(srcToken, tokens) {
    var args = [];
    for(var i = 2; i < tokens.length; i++) {
        var token = tokens[i];
        if (i % 2 == 0) {
            if (token.type != 'Identifier') {
                throw `Preprocessor Error: Was expecting identifier in macro function definition`;
            }
            args.push(token.value);
        } else {
            if (token.value == ')') {
                return { args: args, i: i + 1 };
            } else if (token.value != ',') {
                throw `Preprocessor Error: Was expecting arg delimiter ',' in macro function definition`;
            }
        }
    }
    // didn't close def args
    // i.e: // %define TEST (a,b,c,d,e for(var i...
    // TODO: Source Location Reporting
    throw `Preprocessor Error: Did not properly define macro`;
}

function definition(ctx, token) {
    if (token.value.length > 2 && token.value.startsWith(' %')) {
        for(var i = 2; i < token.value.length; i++) {        
            if (/\s/.test(token.value[i]))  {
                break;
            }
        }
        var onDir;
        if (typeof (onDir = dirs[token.value.substring(2, i)]) != 'undefined') {
            onDir(ctx, token);
        } else {
            throw `Preprocess Error: directive ${token.value.substring(2, i)} is not defined`;
        }    
    } else {
        ctx.emitToken(token);
    }
}

module.exports = definition;