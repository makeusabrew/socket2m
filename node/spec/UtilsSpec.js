var Utils = require('../app/shared/utils');

describe('Utils formatTime', function() {
    it('should return 1:00 for 60 seconds', function() {
        expect(Utils.formatTime(60)).toEqual("1:00");
    });
    it('should return 0:00 for 0 seconds', function() {
        expect(Utils.formatTime(0)).toEqual("0:00");
    });
    it('should return 0:00 for < 0 seconds', function() {
        expect(Utils.formatTime(-1)).toEqual("0:00");
    });
});

describe('Utils formatDate', function() {
    it('should return hh:mm:ss for a valid date', function() {
        expect(
            Utils.formatDate(new Date('Fri Oct 28 2011 15:02:47 GMT+0100 (BST)'))
        ).toEqual(
            "15:02:47"
        );
    });
    it('should should zero pad where appropriate', function() {
        expect(
            Utils.formatDate(new Date('Fri Oct 28 2011 09:02:03 GMT+0100 (BST)'))
        ).toEqual(
            "09:02:03"
        );
    });
});
