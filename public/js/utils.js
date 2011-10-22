var Utils = {
    formatTime: function(_secs) {
        var formatted = "";

        var mins = Math.floor(_secs / 60);
        var secs = _secs % 60;
        if (secs < 10) {
            secs = "0" + secs;
        }
        return mins+":"+secs;
    }
};
