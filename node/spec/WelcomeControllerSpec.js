
/**
 * struggling to make DB reliant tests work
 * - if we don't open DB, they fail obviously
 * - if we do, we just sit in its callback forever
 */
/*
var db = require("app/db");
db.open(function(err, client) {
    console.log("got db");
});
*/

var Socket = require('./stubs/socket');
var io = require('./stubs/io');
require('../app/managers/socket').setIO(io);

var StateManager = require("../app/managers/state");
var WelcomeController = require('../app/controllers/welcome');

describe('Welcome Controller', function() {
    var socket;
    var db = null;
    beforeEach(function() {
        socket = new Socket("1234");
        if (db == null) {
            require("../app/db").open(function(err, client) {
                require("./helpers/fixtures").import(__dirname+'/fixtures/users.js', function() {
                    db = client;
                    asyncSpecDone();
                });
            });
            asyncSpecWait();
        }
    });

    it('should report user and game count on init', function() {
        WelcomeController.init(socket);

        var emissions = socket.emissions;
        expect(emissions.length).toEqual(1);

        var emission = emissions[0];
        expect(emission.namespace).toEqual('welcome:count');

        expect(emission.data.users).toEqual(0);
        expect(emission.data.games).toEqual(0);
    });

    it('should emit an error message with empty login details', function() {
        WelcomeController.login(socket, "");

        expect(
            socket.getEmission(0).namespace
        ).toEqual(
            'msg'
        );

        expect(
            socket.getEmission(0).data
        ).toEqual(
            "Sorry, these details don't appear to be valid. Please try again."
        );
    });

    it('should emit an error message with blank login details', function() {
        WelcomeController.login(socket, "username=&password=");

        expect(
            socket.getEmission(0).data
        ).toEqual(
            "Sorry, these details don't appear to be valid. Please try again."
        );
    });

    it('should emit an error message with invalid login details format', function() {
        WelcomeController.login(socket, {});

        expect(
            socket.getEmission(0).data
        ).toEqual(
            "Sorry, these details don't appear to be valid. Please try again."
        );
    });

    it('should emit an error message with incorrect login details', function() {
        WelcomeController.login(socket, "username=fake&password=account");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {

            expect(
                socket.getEmission(0).data
            ).toEqual(
                "Sorry, these details don't appear to be valid. Please try again."
            );
        });
    });

    it ('should emit an error message when a user is already logged in', function() {
        // setup / fixture-esque stuff
        
        StateManager.addUser({
            "sid": "12345",
            "username" : "test"
        });

        // test
        WelcomeController.login(socket, "username=test&password=test");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {

            expect(
                socket.getEmission(0).data
            ).toEqual(
                "Sorry, this user already appears to be logged in. Please try again."
            );

            StateManager.removeUser("12345");
        });
    });

    it('should set a new user\'s login count to one', function() {
        WelcomeController.login(socket, "username=test&password=test");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {
            expect(
                StateManager.getUserForSocket("1234").logins
            ).toEqual(1);
        });
    });

    it('should increment an existing user\s login count', function() {
        WelcomeController.login(socket, "username=test2&password=test");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {
            expect(
                StateManager.getUserForSocket("1234").logins
            ).toEqual(5);
        });
    });

    it('should emit a register statechange message on goRegister', function() {
        WelcomeController.goRegister(socket);

        var emissions = socket.emissions;
        expect(emissions.length).toEqual(1);

        expect(emissions[0].namespace).toEqual('state:change');
        expect(emissions[0].data).toEqual('register');

        this.after(function() { db.close(); });
    });
});
