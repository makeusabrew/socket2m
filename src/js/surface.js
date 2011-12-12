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

    this.fillRect = function(x, y, w, h) {
        _buffer.fillRect(x, y, w, h);
    }

    this.getWidth = function() {
        return _buffer.canvas.clientWidth;
    }

    this.getHeight = function() {
        return _buffer.canvas.clientHeight;
    }

    this.pixel = function(x, y) {
        this.fillRect(x, y, 1, 1);
    }

    this.square = function(x, y, size) {
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

    this.circle = function(x, y, r) {
        _buffer.beginPath();
        _buffer.arc(x+r, y+r, r, 0, Math.PI*2, true);
        _buffer.closePath();
        _buffer.fill();
    }

    this.fillText = function(x, y, text, colour, options) {
        _buffer.fillStyle = colour;
        if (options.font) {
            _buffer.font = options.font;
        }
        if (options.textBaseline) {
            _buffer.textBaseline = options.textBaseline;
        }
        if (options.textAlign) {
            _buffer.textAlign = options.textAlign;
        }
        _buffer.fillText(text, x, y);
    }

    this.setFillStyle = function(style) {
        _buffer.fillStyle = style;
    }
};
