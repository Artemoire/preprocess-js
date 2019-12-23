class CommentLineReader {

    constructor() {
        this.reset();
    }

    reset() {
        this.buffer = "";
        this.skipState = false;
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (char == '/' && peek == '/') {
                tokenizer.state = 1;
                this.skipState = true;
                return true;
            }
            return false;
        }

        if (this.skipState) {
            this.skipState = false;
            return false;
        }

        if (char == '\n') {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'line-comment', value: this.buffer };
            this.reset();
            return true; // emit
        }

        this.buffer = this.buffer + char;
        return false;
    }

}

module.exports = CommentLineReader;