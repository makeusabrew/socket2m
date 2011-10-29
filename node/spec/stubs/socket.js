Socket = function() {
    /**
     * private, ish
     */
    this.emissions = [];

    this.emit = function(namespace, data) {
        this.emissions.push({
            "namespace": namespace,
            "data"     : data
        });
    }

    this.getEmission = function(i) {
        return this.emissions[i];
    }

    this.hasEmission = function() {
        return this.emissions.length > 0;
    }
}

module.exports = Socket;
