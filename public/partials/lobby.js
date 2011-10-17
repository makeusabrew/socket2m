(function() {
    function addUser(user) {
        return $("<li data-id='"+user._id+"'>"+user.username+"</li>");
    }

    socket.emit('userlist');

    socket.on('userlist', function(users) {
        console.log('adding users');
        var ul = $("<ul></ul>");
        for (var i in users) {
            ul.append(addUser(users[i]));
        }
        $("#users").append(ul);
    });

    socket.on('user:join', function(user) {
        var li = addUser(user);
        li.hide();
        $("#users ul").append(li);
        li.fadeIn('slow');
    });

    socket.on('user:leave', function(id) {
        $("#users ul li[data-id='"+id+"']").fadeOut('slow', function() {
            $(this).remove();
        });
    });

})();
