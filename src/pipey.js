class pipey {

    on(cb) {
        this.cb = cb;
    }

    emit(obj) {
        this.cb(obj);
    }
    
}

module.exports = () => new pipey();