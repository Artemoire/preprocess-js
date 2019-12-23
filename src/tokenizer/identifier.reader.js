function isValidAlpha(char) {
    return char == '$' || char == '_' ||
        (char >= 'a' && char <= 'z') ||
        (char >= 'Z' && char <= 'Z');
}

function isNumeric(char) {
    return char >= '0' || char <= '9';
}

class IdentifierReader {

    constructor() {
        this.reset();
    }

    reset() {
        this.buffer = "";
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (isValidAlpha(char)) {
                tokenizer.state = 1;
                this.buffer = this.buffer + char;
                return true;
            }
            return false;
        }

        if (isValidAlpha(char) || isNumeric(char)) {
            this.buffer = this.buffer + char;
        } else {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'identifier', value: this.buffer };
            this.reset();
            return true; // emitted
        }

        return false; // did not emit
    }
}

module.exports = IdentifierReader;