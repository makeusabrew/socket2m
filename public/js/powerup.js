Powerup = function() {
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.type = 0;
    this.alive = false;
    this.id = 0;
    this.letter = "";
}

Powerup.prototype = {
    spawn: function(options) {
        this.x = options.x;
        this.y = options.y;
        this.r = options.r;
        this.type = options.type;
        this.id = options.id;
        this.alive = true;
        this.letter = options.letter;
    },

    preRender: function() {
        GameManager.getSurface().clearRect(this.x, this.y, this.r*2, this.r*2);
    },
    
    render: function() {
        GameManager.getSurface().circle(this.x, this.y, this.r, "rgb(0, 255, 128)");
        GameManager.getSurface().fillText(this.x + this.r, this.y + 1, this.letter, "rgb(100, 100, 100)", {
            "font": "bold 13px sans-serif",
            "textBaseline": "hanging",
            "textAlign": "center"
        });
    },

    getLeft: function() {
        return this.x;
    },

    getTop: function() {
        return this.y; 
    },

    getRight: function() {
        return this.getLeft() + (this.r*2);
    },

    getBottom: function() {
        return this.getTop () + (this.r*2);
    },

    getId: function() {
        return this.id;
    },

    kill: function() {
        this.alive = false;
    },

    isDead: function() {
        return !this.alive;
    }
};

Powerup.factory = function() {
    return new Powerup();
};
