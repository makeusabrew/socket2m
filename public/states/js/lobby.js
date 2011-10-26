(function() {

    stateListeners = {
        'lobby:users': function(data) {
            LobbyManager.init(data);
        },
        'lobby:user:join': function(user) {
            LobbyManager.addUser(user);
        },
        // user leave is a global message so it's not namespaced
        'user:leave': function(id) {
            LobbyManager.removeUser(id);
        },
        'lobby:game:start': function(game) {
            LobbyManager.addGame(game);
        },
        'lobby:game:end': function(id) {
            LobbyManager.removeGame(id);
        },
        'lobby:challenge:receive': function(from) {
            LobbyManager.receiveChallenge(from);
        },
        'lobby:challenge:response': function(data) {
            LobbyManager.challengeResponse(data);
        },
        'lobby:challenge:blocked': function() {
            LobbyManager.challengeBlocked();
        },
        'lobby:challenge:cancel': function() {
            LobbyManager.cancelChallenge();
        },
        'lobby:challenge:cancel:invalid': function() {
            LobbyManager.couldNotCancelChallenge();
        },
        'lobby:challenge:confirm': function(to) {
            LobbyManager.confirmChallenge(to);
        },
        'lobby:game:scorechange': function(data) {
            LobbyManager.updateGameScore(data);
        },
        'lobby:chat': function(msg) {
            LobbyManager.addChatLine(msg);
        }
    };

})();

socket.emit('lobby:ready');
