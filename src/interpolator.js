function emitFunction(_this, ctx, args, macroDef) {
    var tokens = [];
    for(var i = 0; i < macroDef.body.length; i++) {
        var token = macroDef.body[i];
        if (token.type == 'macro-arg') {
            var firstArgToken = args[token.value][0];
            var lineDiff = firstArgToken.loc.start.line - token.loc.start.line;
            var columnDiff = firstArgToken.loc.start.column - token.loc.start.column;
            for (var j = 0; j < args[token.value].length; j++) {
                var interpd = { ...args[token.value][j] };
                interpd.loc = {
                    start: {
                        line: interpd.loc.start.line - lineDiff,
                        column: interpd.loc.start.column - columnDiff
                    },
                    end: {
                        line: interpd.loc.end.line - lineDiff,
                        column: interpd.loc.end.column - columnDiff
                    }                    
                }
                tokens.push(interpd);
            }
        } else {
            tokens.push(token);
        }
    }
    tokens[0] = { ...tokens[0] };
    tokens[0].rel = _this.macroBuilder.startRel; // copy rel from entry token
    ctx.emitList(tokens);
}

function entryState(_this, ctx, token) {
    // determine next state from token macro status
    if (token.type != 'Identifier') {
        ctx.emitToken(token);
        return;
    }
    var macroDef;
    if (typeof (macroDef = ctx.defs[token.value]) == 'undefined') {
        ctx.emitToken(token); // macro not defined emit token
        return;
    }

    if (macroDef.argC == 0) {
        var body = [...macroDef.body];
        body[0] = { ...body[0] };
        body[0].rel = token.rel; // copy rel from entry token
        ctx.emitList(body); // macro is not a function emit body as list (could still be preprocessed)
        return ;
    }

    // macro is function
    _this.state = 1; // -> fValidateState    
    _this.macroBuilder = {
        startRel: token.rel, // need rel from entry token
        macroDef: macroDef,
        args: [],
        argBuilder: [],
        scopeLevel: 0
    }
    return;
}

function fValidateState(_this, ctx, token) {
    var macroDef = _this.macroBuilder.macroDef;
    if (token.value != '(') {
        throw `Macro '${macroDef.identifier}' accepts ${macroDef.argC} arguments got 0..`;
    }
    _this.state = 2; // -> fConsumeState
}

function fConsumeState(_this, ctx, token) {
    var macroDef = _this.macroBuilder.macroDef;
    var argBuilder = _this.macroBuilder.argBuilder;
    var args = _this.macroBuilder.args;
    var argC = macroDef.argC;

    var terminate = false; // did finish 'parsing' args

    switch (token.value) {
        case '{':
        case '(': // should never reach args.length == argC        
            _this.macroBuilder.scopeLevel++;
            argBuilder.push(token);
            break;
        case '}': // should never reach args.length == argC        
            _this.macroBuilder.scopeLevel--;
            argBuilder.push(token);
            break;
        case ')':
            if (_this.macroBuilder.scopeLevel == 0) {
                args.push(argBuilder);
                _this.macroBuilder.argBuilder = [];
                terminate = true; // if ')' on scope 0 => end of fCall
            } else { // scope isnt 0, push token as part of arg
                _this.macroBuilder.scopeLevel--;
                argBuilder.push(token);
            }
            break;
        case ',':
            if (_this.macroBuilder.scopeLevel == 0) { // if ',' on scope 0 => arg delimiter
                args.push(argBuilder);
                _this.macroBuilder.argBuilder = [];
            } else { // scope isnt 0, push token as part of arg
                argBuilder.push(token);
            }
            break;
        default:  // part of arg
            argBuilder.push(token);
            break;
    }

    if (terminate) {
        if (args.length != argC) {
            throw `Macro '${macroDef.identifier}' expects ${argC} args but got ${args.length}`;
        }

        emitFunction(_this, ctx, args, macroDef);
        _this.state = 0;
    }
}

const states = [
    entryState,
    fValidateState,
    fConsumeState,
];

class Interpolator {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = 0;
    }

    interpolate(ctx, token) {
        states[this.state](this, ctx, token);
    }
}

var terp8r = new Interpolator();
module.exports = terp8r.interpolate.bind(terp8r);