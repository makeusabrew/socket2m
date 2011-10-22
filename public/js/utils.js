var Utils = {
    formatTime: function(_secs) {
        var formatted = "";

        var mins = Math.floor(_secs / 60);
        var secs = _secs % 60;
        if (secs < 10) {
            secs = "0" + secs;
        }
        return mins+":"+secs;
    },

    formatDate: function(date) {
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        if (h < 10) {
            h = "0"+h;
        }
        if (m < 10) {
            m = "0"+m;
        }
        if (s < 10) {
            s = "0"+s;
        }
        return h+":"+m+":"+s;
    }
};
