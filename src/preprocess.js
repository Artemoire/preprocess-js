const esprima = require('esprima');
const interpolator = require('./interpolator');
const definition = require('./definition');

function treeterator(processed, cb) {
    var pStack = [{ i: 0, processed: processed }];
    while (pStack.length != 0) {
        var p = pStack[pStack.length - 1];
        if (p.i == p.processed.length) {
            pStack.pop();
            continue;
        }
        if (p.processed[p.i].type == 'token') {
            cb(p.processed[p.i].value);
        } else {
            pStack.push({ i: 0, processed: p.processed[p.i].value.node.processed });
        }

        p.i++;
    }
}

function processNode(tokens) {
    return {
        processed: [],
        tokens
    }
}

function relLoc(prev, curr)  {
    return {
        line: curr.start.line - prev.end.line,
        column: curr.start.column - prev.end.column
    }
}

function preprocess(code, cfg) {

    cfg = cfg || {};
    cfg.globals = cfg.globals || {};
    cfg.includes = cfg.includes || {};

    var root = processNode(esprima.tokenize(code, { comment: true, loc: true }));
    root.tokens[0].rel = { line: 0, column: 0 }

    var ctx = {
        defStack: [true],
        defs: { ...cfg.globals },
        includes: { ...cfg.includes },
        processStack: [{ idx: 0, node: root }],
        emitToken(token) {
            var processed = this.processStack[this.processStack.length - 1].node.processed;
            processed.push({ type: 'token', value: token });
        },
        emitList(tokens) {
            var processed = this.processStack[this.processStack.length - 1].node.processed;
            var processObject = { idx: 0, node: processNode(tokens) };
            processed.push({ type: 'node', value: processObject });
            this.processStack.push(processObject);
        },
        onDefine(macroDef) {
            this.defs[macroDef.identifier] = macroDef;
        },
        onUndef(identifier) {
            this.defs[identifier] = undefined;
        },
        onInclude(identifier) {
            for (const defKey in this.includes[identifier]) {
                if (this.includes[identifier].hasOwnProperty(defKey)) {
                    const def = this.includes[identifier][defKey];
                    this.defs[defKey] = def;
                }
            }
        }
    }

    while (ctx.processStack.length != 0) {
        var processObject = ctx.processStack[ctx.processStack.length - 1];
        if (processObject.idx >= processObject.node.tokens.length) {
            ctx.processStack.pop();
            continue;
        }
        var processToken = processObject.node.tokens[processObject.idx];
        if (processObject.idx > 0) {
            var prevLoc = processObject.node.tokens[processObject.idx - 1].loc;
            processToken.rel = relLoc(prevLoc, processToken.loc);
        }                
        processObject.idx++
        if (processToken.type != 'LineComment' && processToken.type != 'BlockComment') {
            if (ctx.defStack[ctx.defStack.length - 1]) {
                interpolator(ctx, processToken);
            }
        } else {
            definition(ctx, processToken)
        }
    }

    var processedCode = "";
    treeterator(root.processed, (t)=>{
        for(var i = 0; i < t.rel.line; i++) {
            processedCode = processedCode + "\n";
        }
        for(var i = 0; i < t.rel.column; i++) {
            processedCode = processedCode + " ";
        }
        var val =  t.value;
        if (t.type == 'BlockComment' && t.value == '%%') {
            return; // TODO: move HACK
        } else if (t.type == 'BlockComment') {
            val = "/*" + val + "*/";
        } else if (t.type == 'LineComment') {
            val = "//" + val;
        }

        processedCode = processedCode + val;
    });
    return processedCode;
}

function buildDefines(contents, globals) {
    globals = globals || {};

    var builtDefs = {};

    var ctx  = {
        defStack: [true],
        defs: { ...globals },
        emitToken(token) {
            // do nothing
        },
        // TODO: (?) definition() returns command instead of modifying state
        onDefine(macroDef) {
            builtDefs[macroDef.identifier] = macroDef;
            this.defs[macroDef.identifier] = macroDef;
        },
        onUndef(identifier) {
            builtDefs[macroDef.identifier] = undefined;
            this.defs[identifier] = undefined;
        },
        onInclude(key) {
            throw `Can't use include directive in preprocessor config`;
        }
    }

    const tokens = esprima.tokenize(contents, { comment: true, loc: true });
    for (const token of tokens) {
        if (token.type == 'LineComment' || token.type == 'BlockComment') {
            definition(ctx, token);
        }
    }

    return builtDefs;
}

function cfg(options) {
    options = options || {};
    options.globals = options.globals || ' ';
    options.includes = options.includes || {};
    var globals = buildDefines(options.globals);
    var includes = {};
    for (const inclKey in options.includes) {
        if (options.includes.hasOwnProperty(inclKey)) {            
            const contents = options.includes[inclKey];
            includes[inclKey] = buildDefines(contents, globals);            
        }
    }
    return {
        globals: globals,
        includes: includes
    }
}

module.exports = {
    preprocess,
    cfg
};