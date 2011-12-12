Platform = function() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
}

Platform.prototype = {
    setCoordinates: function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    },

    render: function() {
        gSurface.fillRect(this.x, this.y, this.w, this.h);
    },

    getLeft: function() {
        return this.x;
    },

    getTop: function() {
        return this.y; 
    },

    getRight: function() {
        return this.getLeft() + this.w;
    },

    getBottom: function() {
        return this.getTop () + this.h;
    }
};
