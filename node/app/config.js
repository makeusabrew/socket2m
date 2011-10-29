/* production -> demo -> development -> test -> ci */
var mode = process.env.NODE_ENV || "production";

var Config = {
    /* @todo decouple settings from the object which fetches them
       @todo allow sections to override others and inherit where appropriate
    */
    "production" : {
        "db": {
            "name": "socket2m"
        },
        "port": 80
    },
    "development" : {
        "db": {
            "name": "socket2m"
        },
        "port": 7979 
    },
    "testing": {
        "db": {
            "name": "socket2m_test"
        },
        "port": 7979 
    },

    getValue: function(key) {
        var section = Config[mode];
        var props = key.split(".");
        var depth = props.length;
        switch (depth) {
            case 1:
                return section[props.shift()];
            case 2:
                return section[props.shift()][props.shift()];
            default:
                throw new Error("Nesting level not supported");
        }

        return null;
    }
        
};

module.exports = Config;
