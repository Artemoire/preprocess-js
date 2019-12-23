class CommentBlockReader {

    constructor() {
        this.reset();
    }

    reset() {
        this.buffer = "";
        this.skipState = false;
        this.deferredEmit = false;
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (char == '/' && peek == '*') {
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

        if (this.deferredEmit) {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'comment-block', value: this.buffer };
            this.reset();
            return true; // emit me
        }

        if (char == '*' && peek == '/') {
            this.deferredEmit = true;
            return false;
        }

        this.buffer = this.buffer + char;
        return false;
    }

}