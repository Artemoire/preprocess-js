const states = {
    START: 0,
    STATE: 1
}

function importReaders() {
    //  TODO:
}

function tryStart(tokenizer, char, peek) {

}

function lex(tokenizer, char, peek='') {
    if (tokenizer.state == state.START) {
        var res = tryStart(tokenizer, char, peek);
    }

    readers[tokenizer.readerId](tokenizer, char, peek);
}

class Tokenizer {

    constructor() {
        importReaders();
        this.state = states.START;
        this.templateCount = 0;
        this.emit = null;
    }

    buffered(chunk) {
        var start = 0;
        if (this.crossChunk) {
            lex(this, this.crossChunk, chunk[0]);
            start++;
        }

        this.crossChunk = chunk[chunk.length - 1];
        for (var i = start; i < chunk.length - 1; i++) {
            lex(this, chunk[i], chunk[i + 1]);
        }
    }

    end() {
        lex(this, this.crossChunk);
    }    

}

module.exports = Tokenizer;