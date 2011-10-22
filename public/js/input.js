var Input = {
    
    // @todo more key mappings
    keyMap: {
        27: 'ESC',
        32: 'SPACE_BAR',
        37: 'LEFT_ARROW',
        38: 'UP_ARROW',
        39: 'RIGHT_ARROW',
        40: 'DOWN_ARROW',
        84: 'T'
    },

    keysPressed: {},
    capturedKeys: {},
    target: null,
    triggers: {},

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

    releaseKeys: function() {
            $(Input.target).unbind('keydown');
            $(Input.target).unbind('keypress');
    },

    bindKeys: function() {
        $(Input.target).keydown(function(e) {
            var key = Input.mapKey(e.which);
            if (Input.isCapturedKey(key)) {
                e.preventDefault();
            }
            Input.keyDown(key);
        });

        $(Input.target).keyup(function(e) {
            var key = Input.mapKey(e.which);
            if (Input.isCapturedKey(key)) {
                e.preventDefault();
            } else {
                if (Input.triggers[key] != null) {
                    Input.triggers[key](e);
                }
            }
            Input.keyUp(key);
        });
    },

    bindTo: function(target) {
        Input.target = target;
    },

    onKeyPress: function(k, cb) {
        Input.triggers[k] = cb;
    }
};
