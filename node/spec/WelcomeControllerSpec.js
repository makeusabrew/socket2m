require.paths.unshift(__dirname+"/../");

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

var Socket = require('spec/stubs/socket');
var WelcomeController = require('app/controllers/welcome');

describe('Welcome Controller', function() {
    var socket;
    beforeEach(function() {
        socket = new Socket();
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

    it('should emit an error message with invalid login details format', function() {
        WelcomeController.login(socket, {});
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

    it('should emit an error message with incorrect login details', function() {
        WelcomeController.login(socket, "username=fake&password=account");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {
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
    });

    /* @ see DB stuff above
    it ('should emit an error message when a user is already logged in', function() {
        // setup / fixture-esque stuff
        require("app/managers/state").addUser({
            "sid": "1234",
            "username" : "test"
        });

        // test
        WelcomeController.login(socket, "username=test&password=test");

        waitsFor(function() {
            return socket.hasEmission();
        }, "socket did not receive emissions", 500);

        runs(function() {
            expect(
                socket.getEmission(0).namespace
            ).toEqual(
                'msg'
            );

            expect(
                socket.getEmission(0).data
            ).toEqual(
                "Sorry, this user already appears to be logged in. Please try again."
            );
        });
    });
    */

    it('should emit a register statechange message on goRegister', function() {
        WelcomeController.goRegister(socket);

        var emissions = socket.emissions;
        expect(emissions.length).toEqual(1);

        expect(emissions[0].namespace).toEqual('state:change');
        expect(emissions[0].data).toEqual('register');
    });
});

