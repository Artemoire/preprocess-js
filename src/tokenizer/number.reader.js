const parseStates = {
    decimal: 0,
    binary: 1,
    hex: 2
}

function isNumeric(char) {
    return char >= '0' && char <= '9';
}

function isHex(char) {
    return (char >= '0' && char <= '9') ||
        (char >= 'a' && char <= 'f'); 
}

class NumberReader {

    constructor() {
        this.reset();
    }

    reset() {
        this.parseState = parseStates.decimal;
        this.decimalPoint = false;
        this.skipState = false;
        this.buffer = "";
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (isNumeric(char)) {
                tokenizer.state = 1;
                this.buffer = this.buffer + char;
                if (char == '0') {
                    if (peek.toLowerCase() == 'b') {
                        this.parseState = parseStates.binary;
                        this.buffer = this.buffer + peek;
                        this.skipState = true;
                    } else if (peek.toLowerCase() == 'x') {
                        this.parseState = parseStates.hex;
                        this.buffer = this.buffer + peek;
                        this.skipState = true;
                    }
                }
                return true;
            }
            return false;
        }

        if (this.skipState) {
            this.skipState = false;
            return false;
        }

        var emit = false;
        switch (this.parseState) {
            case parseStates.decimal:
                if (isNumeric(char)) {
                    this.buffer = this.buffer + char;
                    if (!this.decimalPoint && peek == '.') {
                        this.decimalPoint = true;
                        this.skipState = true;
                        this.buffer = this.buffer + peek;
                    }
                } else {
                    emit = true;
                }
                break;
            case parseStates.binary:
                if (char == '0' || char == '1') {
                    this.buffer = this.buffer + char;
                } else {
                    emit = true;
                }
                break;
            case parseStates.hex:
                if (isHex(char.toLowerCase())) {
                    this.buffer = this.buffer + char;
                } else {
                    emit = true;
                }
                break;
        }

        if (emit) {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'number', value: this.buffer };
            this.reset();
            return true; // emitted
        }

        return false; // did not emit
    }

}

module.exports = NumberReader;