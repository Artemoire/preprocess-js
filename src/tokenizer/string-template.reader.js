class StringTemplateReader {

    constructor() {
        this.reset();
    }

    reset() {
        this.buffer = "";
    }

    lex(tokenizer, char, peek) {
        if (tokenizer.state == 0) {
            if (char == '`') {
                tokenizer.state = 1;
                return true;
            }
            return false;
        }

        if (char == '$' && peek == '{') {
            tokenizer.templateCount++;
            tokenizer.state = 0;
            tokenizer.emit = { type: 'template-head', value: this.buffer };
            this.reset();
            return true;
        }

        if (char == '`') {
            tokenizer.state = 0;
            tokenizer.emit = { type: 'template', value: this.buffer };
            this.reset();
            return true;
        }

        this.buffer = this.buffer + char;
        return false;
    }

}