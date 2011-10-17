(function() {
    socket.emit('userlist');
    socket.on('userlist', function(users) {
        console.log('adding users');
        var str = "";
        for (var i in users) {
            str += "<li>"+users[i].username+"</li>";
        }
        $("#lobby #users").append("<ul>"+str+"</ul>");
    });
})();
