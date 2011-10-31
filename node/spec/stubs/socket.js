Socket = function(id) {
    /**
     * private, ish
     */
    this.emissions = [];

    this.id = id;

    this.emit = function(namespace, data) {
        this.emissions.push({
            "namespace": namespace,
            "data"     : data
        });
    }

    this.join = function(room) {
        //
    }

    this.broadcast = {
        to: function(room) {
            return new Socket(null);
        }
    }

    this.getEmission = function(i) {
        return this.emissions[i];
    }

    this.hasEmission = function() {
        return this.emissions.length > 0;
    }
}

module.exports = Socket;
