Powerup = function() {
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.type = 0;
    this.alive = false;
    this.id = 0;
}

Powerup.prototype = {
    spawn: function(options) {
        this.x = options.x;
        this.y = options.y;
        this.r = options.r;
        this.type = options.type;
        this.id = options.id;
        this.alive = true;
    },

    preRender: function() {
        GameManager.getSurface().clearRect(this.x, this.y, this.r*2, this.r*2);
    },
    
    render: function() {
        //GameManager.getSurface().circle(this.x, this.y, this.r, "rgb(0, 0, 0)");
        GameManager.getSurface().square(this.x, this.y, this.r*2, "rgb(0, 0, 0)");
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
