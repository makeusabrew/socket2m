var SoundManager = (function() {
    var self = this;

    var _loadedSounds = {},
        _aliases = {},
        _muted = false;

    self.mute = function() {
        _muted = true;
    }

    self.unmute = function() {
        _muted = false;
    }

    self.preloadSound = function(path, alias) {
        var sound = document.createElement("audio");
        sound.src = path;
        sound.preload = 'auto';

        _loadedSounds[path] = sound;
        // attach to dom to actually load the clip
        $("body").append(sound);

        if (alias != null) {
            _aliases[alias] = path;
        }
    }

    self.playSound = function(path) {
        if (_muted) {
            return;
        }

        if (_loadedSounds[path] == null) {
            // check aliases
            if (_aliases[path] != null) {
                path = _aliases[path];
            } else {
                console.log("warning - "+path+" was not preloaded");
                self.preloadSound(path);
            }
                
        }
        _loadedSounds[path].play();
    }

    return self;
})();
