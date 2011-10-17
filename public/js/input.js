var Input = {
    
    // @todo more key mappings
    keyMap: {
        32: 'SPACE_BAR',
        37: 'LEFT_ARROW',
        38: 'UP_ARROW',
        39: 'RIGHT_ARROW',
        40: 'DOWN_ARROW'
    },

    keysPressed: {},
    capturedKeys: {},

    keyDown: function(k) {
        Input.keysPressed[k] = true;
    },

    keyUp: function(k) {
        Input.keysPressed[k] = false;
    },

    isKeyDown: function(k) {
        return Input.keysPressed[k] == true;
    },

    captureKeys: function(keys) {
        for (var i = 0; i < keys.length; i++) {
            Input.capturedKeys[keys[i]] = true;
        }
    },

    isCapturedKey: function(k) {
        return Input.capturedKeys[k] == true;
    },

    mapKey: function(code) {
        if (typeof Input.keyMap[code] != "undefined") {
            return Input.keyMap[code];
        }
        return 'KEY_NOT_MAPPED';
    },

    bindKeys: function(target) {
        $(target).keydown(function(e) {
            var key = Input.mapKey(e.which);
            if (Input.isCapturedKey(key)) {
                e.preventDefault();
            }
            Input.keyDown(key);
        });

        $(target).keyup(function(e) {
            var key = Input.mapKey(e.which);
            if (Input.isCapturedKey(key)) {
                e.preventDefault();
            }
            Input.keyUp(key);
        });
    }
};
