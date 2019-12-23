class StringLiteralReader {
    constructor() {
        this.reset();
    }

    reset() {
        this.buffer = "";
        this.escapeChar = '';
        this.skipState = false;
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (char == '"') {
                this.escapeChar = '"';
                tokenizer.state = 1;
                return true;
            }
            if (char == "'") {
                this.escapeChar = "'";
                tokenizer.state = 1;
                return true;
            }
            return false;
        }

        if (this.skipState == true) {
            this.skipState = false;
            return false;
        }

        if (char == '\\' && peek == '\n') { // what about \r\n ? - fuck those guys (i am windows fan srry fellow windows fans)
            this.skipState = true;
            return false;
        }

        if (char == '\\' && peek == this.escapeChar) {
            this.buffer = this.buffer + char + peek;
            this.skipState = true;
            return false;
        }

        if (char == this.escapeChar) {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'string', value: this.buffer };
            this.reset();
            return true;
        }

        this.buffer = this.buffer + char;
        return false;
    }
}

module.exports = StringLiteralReader;