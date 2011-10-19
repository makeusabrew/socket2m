Surface = function(elemId) {
    var _elem,
        _buffer;
        
    _elem = document.getElementById(elemId);
    if (!_elem.getContext) {
        throw new Error('Canvas not available');
    }

    _buffer = _elem.getContext("2d");
    
    _elem.width = _buffer.canvas.clientWidth;
    _elem.height = _buffer.canvas.clientHeight;

    this.line = function(x, y, x1, y1, colour) {
        _buffer.strokeStyle = colour;
        _buffer.beginPath();
        _buffer.moveTo(x, y);
        _buffer.lineTo(x1, y1);
        _buffer.closePath();
        _buffer.stroke();
    }

    this.fillRect = function(x, y, w, h, colour) {
        _buffer.fillStyle = colour;
        _buffer.fillRect(x, y, w, h);
    }

    this.getWidth = function() {
        return _buffer.canvas.clientWidth;
    }

    this.getHeight = function() {
        return _buffer.canvas.clientHeight;
    }

    this.pixel = function(x, y, colour) {
        _buffer.fillStyle = colour;
        this.fillRect(x, y, 1, 1);
    }

    this.square = function(x, y, size, colour) {
        _buffer.fillStyle = colour;
        this.fillRect(x, y, size, size);
    }

    this.drawImage = function(img, x, y, w, h) {
        _buffer.drawImage(img, x, y, w, h);
    }

    this.clear = function() {
        _buffer.clearRect(0, 0, _elem.width, _elem.height);
    }

    this.clearRect = function(x, y, w, h) {
        _buffer.clearRect(x, y, w, h);
    }
};
