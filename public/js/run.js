var warnHandler=setTimeout(function(){$("#wrapper").html("<h2>It doesn't look like the socket2m server is running at the moment. Please come back later.</h2>")},2500),socket=typeof io!="undefined"?io.connect():{on:function(){}},currentState=null,stateListeners={},pageTitle=$("title").html();typeof io=="undefined"&&(clearTimeout(warnHandler),$("#wrapper").html("<h2>The socket2m server is not running at the moment. Please come back later.</h2>")),socket.on("connect",function(){console.log("connected"),clearTimeout(warnHandler)}),socket.on("statechange",function(a){var b=(new Date).getTime(),c=!1,d=null,e=function(b,e){b!=null&&(c=b),e!=null&&(d=e);if(c&&d){$("#wrapper").html(d);var f=$("#wrapper h1:first");$("#state-wrapper").hide().children("#state-title").html(f.html()),$("title").html(pageTitle+" - "+f.html()),f.parent("div.page-header").remove(),f.remove(),$("#state-wrapper").fadeIn("fast"),$("#wrapper").fadeIn("fast"),window[a+"Actions"].init(),currentState=a;for(var g in stateListeners)socket.on(g,stateListeners[g]);console.log("changed state to "+a),typeof _gaq!="undefined"&&_gaq.push(["_trackPageview","/"+a])}};$("#state-wrapper").fadeOut("fast"),$("#wrapper").fadeOut("fast",function(){e(!0,null)});for(var f in stateListeners)socket.removeListener(f,stateListeners[f]);$.get("/states/"+a+".html?t="+b,{},function(a){e(null,a)})}),socket.on("msg",function(a){mbalert(a)}),loadScript("/shared/js/utils.js");Bullet=function(){this._x=0,this._y=0,this._a=0,this._v=0,this._alive=!1,this._owner=0,this._vx=0,this._vy=0,this._w=0,this._id=0},Bullet.prototype={spawn:function(a){this._x=a.x,this._y=a.y,this._a=a.a,this._v=a.v,this._owner=a.o,this._id=a.id,this._alive=!0,this._w=3,this._vx=Math.cos(this._a/180*Math.PI)*this._v,this._vy=Math.sin(this._a/180*Math.PI)*this._v},getOwner:function(){return this._owner},getId:function(){return this._id},tick:function(a){this._x+=this._vx*a,this._y+=this._vy*a,this._vy+=20*a;if(this._x<GameManager.getLeft()||this._x>GameManager.getRight()||this._y<GameManager.getTop()||this._y>GameManager.getBottom())this._alive=!1},isDead:function(){return!this._alive},preRender:function(){var a=GameManager.getSurface();a.clearRect(this._x|0,this._y|0,this._w,this._w)},render:function(){var a=GameManager.getSurface();a.square(this._x|0,this._y|0,this._w,"rgb(255, 0, 0)")},kill:function(){this._alive=!1},getLeft:function(){return this._x},getTop:function(){return this._y},getRight:function(){return this.getLeft()+this._w},getBottom:function(){return this.getTop()+this._w}},Bullet.factory=function(){return new Bullet};Platform=function(){this.x=0,this.y=0,this.w=0,this.h=0},Platform.prototype={setCoordinates:function(a,b,c,d){this.x=a,this.y=b,this.w=c,this.h=d},render:function(){GameManager.getSurface().fillRect(this.x,this.y,this.w,this.h,"rgb(0, 0, 0)")},getLeft:function(){return this.x},getTop:function(){return this.y},getRight:function(){return this.getLeft()+this.w},getBottom:function(){return this.getTop()+this.h}};Powerup=function(){this.x=0,this.y=0,this.r=0,this.type=0,this.alive=!1,this.id=0,this.letter=""},Powerup.prototype={spawn:function(a){this.x=a.x,this.y=a.y,this.r=a.r,this.type=a.type,this.id=a.id,this.alive=!0,this.letter=a.letter},preRender:function(){GameManager.getSurface().clearRect(this.x,this.y,this.r*2,this.r*2)},render:function(){GameManager.getSurface().circle(this.x,this.y,this.r,"rgb(0, 255, 128)"),GameManager.getSurface().fillText(this.x+this.r,this.y+1,this.letter,"rgb(100, 100, 100)",{font:"bold 13px sans-serif",textBaseline:"hanging",textAlign:"center"})},getLeft:function(){return this.x},getTop:function(){return this.y},getRight:function(){return this.getLeft()+this.r*2},getBottom:function(){return this.getTop()+this.r*2},getId:function(){return this.id},kill:function(){this.alive=!1},isDead:function(){return!this.alive}},Powerup.factory=function(){return new Powerup};var SoundManager=function(){var a={},b={},c={},d=!1;return a.toggleSounds=function(){d=!d},a.mute=function(){d=!0},a.unmute=function(){d=!1},a.preloadSound=function(a,d){if(b[a]==null){var e=document.createElement("audio");e.src=a,e.preload="auto",b[a]=e,$("body").append(e)}else console.log("not preloading sound - already loaded ["+a+"]");d!=null&&(c[d]=a)},a.playSound=function(e){if(d)return;b[e]==null&&(c[e]!=null?e=c[e]:(console.log("warning - "+e+" was not preloaded"),a.preloadSound(e))),b[e].play()},a}();function tick(){animFrame=requestAnimFrame(tick),GameManager.loop()}var GameManager=function(){var a={},b=0,c=0,d=0,e=0,f=null,g=null,h=null,i=[],j=[],k=[],l=[],m=[],n=[],o=0,p=-1,q=!1,r=!1,s=!1,t=!1,u=!1;return a.loop=function(){if(r)return;var b=(new Date).getTime();e=(b-c)/1e3;if(b>=d+1e3){d=b;var f=Math.round(10/e)/10;$("#debug #fps").html(f+" fps")}c=b,s||(o>=0?(o-=e,Math.ceil(o)!=p&&(p=Math.ceil(o),$("#countdown").html(Utils.formatTime(p)))):q||(q=!0,socket.emit("game:timeup"))),a.preRender(),a.handleInput(),a.tick(),a.render()},a.preRender=function(){g.preRender(),h.preRender();for(var a=0,b=l.length;a<b;a++)l[a].preRender();for(var a=0,b=m.length;a<b;a++)m[a].preRender()},a.handleInput=function(){if(u)return;Input.isKeyDown("SPACE_BAR")&&g.fireWeapon(),Input.isKeyDown("LEFT_ARROW")?g.decreaseAngle():Input.isKeyDown("RIGHT_ARROW")&&g.increaseAngle(),Input.isKeyDown("DOWN_ARROW")?g.decreaseVelocity():Input.isKeyDown("UP_ARROW")&&g.increaseVelocity()},a.tick=function(){Math.floor(Math.random()*2501)==0&&m.length<3&&a.spawnPowerup();for(var b=0,c=i.length;b<c;b++){var d=i[b],f=d.socket_id==g.getId()?g:h;f.spawn({x:d.x,y:a.getCoordinateForPlatform(d.platform)}),f.getId()==h.getId()&&(t=!1)}i=[];for(var b=0,c=j.length;b<c;b++)for(var o=l.length-1;o>=0;o--)if(l[o].getId()==j[b]){console.log("killing entity "+l[o].getId()),l[o].kill(),l.splice(o,1);break}j=[];for(var b=0,c=k.length;b<c;b++)for(var o=m.length-1;o>=0;o--)if(m[o].getId()==k[b]){console.log("killing powerup "+m[o].getId()),m[o].kill(),m.splice(o,1);break}k=[];for(var b=l.length-1;b>=0;b--){l[b].tick(e);if(!l[b].isDead()){l[b].getOwner()==g.getId()&&a.entitiesTouching(l[b],h)&&t==0?(t=!0,l[b].kill(),a.killPlayer(h.getId(),l[b].getId())):l[b].getOwner()==h.getId()&&a.entitiesTouching(l[b],g)&&l[b].kill();if(!l[b].isDead())for(var c=m.length-1;c>=0;c--)l[b].getOwner()==g.getId()&&a.entitiesTouching(l[b],m[c])?(l[b].kill(),a.claimPowerup(m[c].getId(),l[b].getId())):l[b].getOwner()==h.getId()&&a.entitiesTouching(l[b],m[c])&&l[b].kill(),!m[c].isDead();if(!l[b].isDead()){var c=4;while(c--)if(a.entitiesTouching(l[b],n[c])){l[b].kill();break}}}l[b].isDead()&&(console.log("found dead entity ID "+l[b].getId()),l.splice(b,1))}},a.render=function(){g.render(),g.renderSight(),h.render();for(var a=0,b=n.length;a<b;a++)n[a].render();for(var a=0,b=l.length;a<b;a++)l[a].render();for(var a=0,b=m.length;a<b;a++)m[a].render()},a.initSurface=function(b){a.setSurface(new Surface(b))},a.setSurface=function(a){f=a},a.setPlayer=function(a){g=a},a.setOpponent=function(a){h=a},a.spawnPowerup=function(){socket.emit("game:powerup:spawn")},a.actuallySpawnPowerup=function(a){console.log("spawning powerup",a);var b=Powerup.factory();b.spawn(a),m.push(b),SoundManager.playSound("game:powerup:spawn")},a.fireWeapon=function(a){socket.emit("game:weapon:fire",a)},a.actuallyFireWeapon=function(b){var c=b.x,d=b.o,e=a.getCoordinateForPlatform(b.platform);b.o==g.getId()&&g.setReloadTime(b.reloadIn);for(var f=0,h=b.bullets.length;f<h;f++){var i=Bullet.factory(),j=b.bullets[f];j.o=d,j.x=c,j.y=e,i.spawn(j),l.push(i)}SoundManager.playSound("weapon:fire")},a.reloadPlayerWeaponIn=function(a){g.setReloadTime(a)},a.getSurface=function(){return f},a.getLeft=function(){return 0},a.getTop=function(){return 0},a.getBottom=function(){return a.getTop()+f.getHeight()},a.getRight=function(){return a.getLeft()+f.getWidth()},a.entitiesTouching=function(a,b){return a.getLeft()<=b.getRight()&&b.getLeft()<=a.getRight()&&a.getTop()<=b.getBottom()&&b.getTop()<=a.getBottom()},a.claimPowerup=function(a,b){console.log("requesting claim powerup "+a+" from bullet "+b),socket.emit("game:powerup:claim",{id:a,eId:b})},a.actuallyClaimPowerup=function(a){console.log("killing bullet "+a.eId+" and queueing powerup removal "+a.id),k.push(a.id),j.push(a.eId)},a.killPlayer=function(a,b){console.log("requesting kill player "+a+" from bullet "+b),socket.emit("game:player:kill",{id:a,eId:b})},a.actuallyKillPlayer=function(a){var b=a.id;console.log("actually killing player "+b),$("#game #p1").html(a.scores[0]),$("#game #p2").html(a.scores[1]),b==g.getId()?(a.doRespawn&&(SoundManager.playSound("player:die"),socket.emit("game:player:respawn")),console.log("queuing entity death "+a.eId),j.push(a.eId)):b==h.getId()?a.doRespawn&&SoundManager.playSound("player:kill"):console.log("unknown ID "+b)},a.actuallyRespawnPlayer=function(a){console.log("queuing respawning player",a.player),i.push(a.player),a.teleport&&SoundManager.playSound("player:teleport")},a.getCoordinateForPlatform=function(a){return(a+1)*200-32},a.beginChatting=function(){Input.releaseKeys(),console.log("beginning chat"),u=!0;var b=$("#viewport").offset(),c=$("<form id='chatform' style='display:none;'><input type='text' placeholder='type your message' autocomplete='off' /></form>").css({left:g.getLeft()+b.left-100,top:g.getTop()+b.top-50});$("body").append(c),$("input",c).blur(function(){a.endChatting()}),c.submit(function(b){b.preventDefault();var d=$.trim($("input",c).val());d.length&&(console.log("chatting: "+d),socket.emit("game:player:chat",d),a.endChatting())}),c.show(),$("input",c).focus()},a.endChatting=function(){Input.bindKeys(),u=!1,$("#chatform").fadeOut("fast",function(){$(this).remove()})},a.isChatting=function(){return u},a.showChatMessage=function(a){var b=$("#viewport").offset(),c=h.getId()==a.id?h:g,d=$("<div class='chatbubble' style='display:none;'>"+a.msg+"</div>");d.addClass(c.getSide()),$("body").append(d),d.css("top",c.getTop()+b.top-40-d.height()/2),c.getSide()=="left"?d.css("left",b.left+8):d.css("left",b.left+$("#viewport").width()-d.width()-21),d.fadeIn("normal",function(){setTimeout(function(){d.fadeOut("normal",function(){d.remove()})},3500)}),c.getId()==h.getId()&&SoundManager.playSound("chat")},a.start=function(b){var d=b.challenger,e=b.challengee;$("#state-title").html("Game On: "+d.username+" Vs "+e.username),$("#game .stats").html("0"),a.bindKeys();var f=Player.factory({id:d.socket_id,x:d.x,y:a.getCoordinateForPlatform(d.platform),a:d.a,v:d.v,c:"rgb(0, 255, 0)",side:"left",username:d.username}),g=Player.factory({id:e.socket_id,x:e.x,y:a.getCoordinateForPlatform(e.platform),a:e.a,v:e.v,c:"rgb(0, 0, 255)",side:"right",username:e.username});d.socket_id==b.user.sid?(a.setPlayer(f),a.setOpponent(g)):(a.setPlayer(g),a.setOpponent(f)),a.initSurface("viewport"),a.addPlatforms(),t=!1,r=!1,s=!1,u=!1,q=!1,p=-1,o=b.duration,c=(new Date).getTime(),l=[],m=[],i=[],j=[],k=[]},a.handleWin=function(b){SoundManager.playSound("game:win");var c=b.scores.win==1?"point":"points",d="<h2>Congratulations - you win!</h2><p>Well done - you beat "+h.getUsername()+" by <strong>"+b.scores.win+"</strong> "+c+" to <strong>"+b.scores.lose+"</strong>.</p>"+"<h3>Ranking change</h3>"+"<p>Your rank has increased to <strong>"+b.rank+"</strong> (+"+b.increase+")</p>"+"<h3>Tweet all about it</h3>"+"<p>Why not let the world know about your victory? Tweet and find some new people to beat!</p>"+tweetButton({text:"I just won a game of Sock it to 'em - why not come and challenge me to a duel?",count:"none"});a.endGame(d)},a.handleLose=function(b){SoundManager.playSound("game:lose");var c=b.scores.win==1?"point":"points",d="<h2>Oh no - you lose!</h2><p>Bad luck - you lost to "+h.getUsername()+" by <strong>"+b.scores.win+"</strong> "+c+" to <strong>"+b.scores.lose+"</strong>.</p>"+"<h3>Ranking change</h3>";b.decrease?d+="<p>Your rank has decreased to <strong>"+b.rank+"</strong> (-"+b.decrease+")</p>":d+="<p>Your rank has remained unchanged at <strong>"+b.rank+"</strong></p>",d+="<h3>Spread the word</h3><p>Why not challenge someone else? Spread the word to find some new people to beat!</p>"+tweetButton({text:"Fancy a duel? Come and have a game of Sock it to em'!",count:"none"}),a.endGame(d)},a.cancelGame=function(b){var c="<h2>Game aborted!</h2><p>Oh no - "+h.getUsername()+" left the game! ";b.defaulted?c+="As it was underway, they have <strong>forfeited</strong> it. You don't get the glory of a win, but your rank has increased by <strong>one</strong> point, and theirs has decreased due to bailing out of your duel.</p>":c+="As it hadn't got properly underway it has been <strong>cancelled</strong>.</p>",a.endGame(c)},a.endGame=function(a,b){cancelRequestAnimFrame(animFrame),r=!0,Input.releaseKeys(),$("#countdown").html("Game Over"),mbalert(a,function(){socket.emit("game:finish")})},a.setSuddenDeath=function(){s=!0,SoundManager.playSound("game:suddendeath"),$("#countdown").html("Sudden Death")},a.bindKeys=function(){Input.captureKeys(["SPACE_BAR","UP_ARROW","DOWN_ARROW","LEFT_ARROW","RIGHT_ARROW"]),Input.bindTo(window),Input.bindKeys(),Input.onKeyPress("T",function(b){a.isChatting()||a.beginChatting()}),Input.onKeyPress("ESC",function(b){a.isChatting()&&a.endChatting()})},a.addPlatforms=function(){n[0]=new Platform,n[0].setCoordinates(0,this.getBottom()/3*1,48,10),n[1]=new Platform,n[1].setCoordinates(0,this.getBottom()/3*2,48,10),n[2]=new Platform,n[2].setCoordinates(this.getRight()-48,this.getBottom()/3*1,48,10),n[3]=new Platform,n[3].setCoordinates(this.getRight()-48,this.getBottom()/3*2,48,10)},a.changePlayerWeapon=function(a){SoundManager.playSound("weapon:change"),g.changeWeapon(a)},a}(),animFrame=null;Surface=function(a){var b,c;b=document.getElementById(a);if(!b.getContext)throw new Error("Canvas not available");c=b.getContext("2d"),b.width=c.canvas.clientWidth,b.height=c.canvas.clientHeight,this.line=function(a,b,d,e,f){c.strokeStyle=f,c.beginPath(),c.moveTo(a,b),c.lineTo(d,e),c.closePath(),c.stroke()},this.fillRect=function(a,b,d,e,f){c.fillStyle=f,c.fillRect(a,b,d,e)},this.getWidth=function(){return c.canvas.clientWidth},this.getHeight=function(){return c.canvas.clientHeight},this.pixel=function(a,b,d){c.fillStyle=d,this.fillRect(a,b,1,1)},this.square=function(a,b,d,e){c.fillStyle=e,this.fillRect(a,b,d,d)},this.drawImage=function(a,b,d,e,f){c.drawImage(a,b,d,e,f)},this.clear=function(){c.clearRect(0,0,b.width,b.height)},this.clearRect=function(a,b,d,e){c.clearRect(a,b,d,e)},this.circle=function(a,b,d,e){c.fillStyle=e,c.beginPath(),c.arc(a+d,b+d,d,0,Math.PI*2,!0),c.closePath(),c.fill()},this.fillText=function(a,b,d,e,f){c.fillStyle=e,f.font&&(c.font=f.font),f.textBaseline&&(c.textBaseline=f.textBaseline),f.textAlign&&(c.textAlign=f.textAlign),c.fillText(d,a,b)}};var Input={keyMap:{27:"ESC",32:"SPACE_BAR",37:"LEFT_ARROW",38:"UP_ARROW",39:"RIGHT_ARROW",40:"DOWN_ARROW",84:"T"},keysPressed:{},capturedKeys:{},target:null,triggers:{},keyDown:function(a){Input.keysPressed[a]=!0},keyUp:function(a){Input.keysPressed[a]=!1},isKeyDown:function(a){return Input.keysPressed[a]==1},captureKeys:function(a){for(var b=0;b<a.length;b++)Input.capturedKeys[a[b]]=!0},isCapturedKey:function(a){return Input.capturedKeys[a]==1},mapKey:function(a){return typeof Input.keyMap[a]!="undefined"?Input.keyMap[a]:"KEY_NOT_MAPPED"},releaseKeys:function(){$(Input.target).unbind("keydown"),$(Input.target).unbind("keyup")},bindKeys:function(){$(Input.target).keydown(function(a){var b=Input.mapKey(a.which);Input.isCapturedKey(b)&&a.preventDefault(),Input.keyDown(b)}),$(Input.target).keyup(function(a){var b=Input.mapKey(a.which);Input.isCapturedKey(b)?a.preventDefault():Input.triggers[b]!=null&&Input.triggers[b](a),Input.keyUp(b)})},bindTo:function(a){Input.target=a},onKeyPress:function(a,b){Input.triggers[a]=b}};var LobbyManager=function(){function f(a){var c=a.sid==b.sid?"me":"opponent",d=a.sid==b.sid?"your":""+a.username+"'s";return a.rank==null&&(a.rank=0),a.wins==null&&(a.wins=0),a.losses==null&&(a.losses=0),$("<tr><td data-id='"+a.sid+"' "+"data-username='"+a.username+"' "+"data-rank='"+a.rank+"' "+"class='"+c+"'>"+a.username+" "+'<a title="View '+d+" profile in a new window\" href='/user/"+a.username+"' target='_blank'><img src='/img/profile.png' alt='View "+a.username+"'s profile' /></a>"+"<td>"+a.rank+"</td>"+"<td>"+a.wins+"</td>"+"<td>"+a.losses+"</td>"+"</tr>")}function g(a){var b=new Date(a.started);console.log("game started at: "+b.getTime()+" with duration: "+a.duration+" current TS: "+c.getTime());var e=Math.round((b.getTime()+a.duration*1e3-c.getTime())/1e3),f="";return e<=0?f="due to finish...":(f=Utils.formatTime(e),d[a._id]=setInterval(function(){e--,e<=0?(clearInterval(d[a._id]),$("td[data-game-time='"+a._id+"']").html("due to finish...")):$("td[data-game-time='"+a._id+"']").html(Utils.formatTime(e))},1e3)),$("<tr data-id='"+a._id+"'><td>"+a.challenger.username+" Vs "+a.challengee.username+"</td><td><span class='challenger'>"+a.challenger.score+"</span> - <span class='challengee'>"+a.challengee.score+"</span></td><td data-game-time='"+a._id+"'>"+f+"</td>")}function h(){$("#users table").unbind("click"),$("#users table").bind("click",function(a){var c=$(a.target),d=c.attr("data-id");if(d!=null&&d!=b.sid)if(e)mbalert("You've got a challenge outstanding - please wait.");else{var f=i(b,{rank:c.data("rank")}),g="<p>Do you want to challenge <strong>"+c.data("username")+"</strong>? "+f+"<h4 class='challenge'>Issue the challenge?</h4>";mbconfirm(g,function(a){a&&(e=!0,console.log("issuing challenge to "+d),socket.emit("lobby:challenge:issue",d))},"Yes","No")}})}function i(a,b){var c="",d="",e="";return a.rank>b.rank?(e="lower than",c="increase by <strong>one</strong> point",d="decrease by <strong>two</strong> points"):a.rank<b.rank?(e="higher than",c="increase by <strong>three</strong> points",d="not change"):(e="the same as",c="increase by <strong>two</strong> points",d="decrease by <strong>one</strong> point"),a.rank<=0&&(d="not change as you are currently unranked"),"Their rank is currently <strong>"+b.rank+"</strong>, which is "+e+" yours.</p>"+"<h3>If you win...</h3>"+"<p>Your ranking will "+c+".</p>"+"<h3>But if you lose...</h3>"+"<p>Your ranking will "+d+".</p>"}var a={},b=null,c=null,d={},e=!1;return a.addChatLine=function(a){var b=new Date(a.timestamp),c=$("<div class='chatline "+a.type+"'><time datetime='"+a.timestamp+"'>"+Utils.formatDate(b)+"</time><span class='author'>"+a.author.username+"</span>: <span class='msg'>"+a.msg+"</span></div>");$("#lobby #chat").append(c)},a.init=function(d){$("#lobby form").submit(function(a){a.preventDefault();var b=$(this).find("input"),c=$.trim(b.val());c.length&&(b.prop("disabled",!0),b.val(""),setTimeout(function(){b.prop("disabled",!1)},250),socket.emit("lobby:chat",c))});var e,i;c=new Date(d.timestamp),b=d.user,console.log("lobby state",d);var j=$("#users table tbody");j.hide();for(e=0,i=d.users.length;e<i;e++)j.append(f(d.users[e]));j.show(),d.users.length<2&&($("#tweet-challengers #tweet-frame").html(tweetButton({text:"I'm in the #socket2m lobby - come and challenge me to a duel!",count:"none"})),$("#tweet-challengers").show());var k=$("#games table tbody");k.hide();for(e=0,i=d.games.length;e<i;e++)k.append(g(d.games[e]));k.show(),d.games.length==0&&k.append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>");for(e=0,i=d.chatlines.length;e<i;e++)a.addChatLine(d.chatlines[e]);h()},a.addUser=function(a){console.log("user joining lobby",a);var b=f(a);$("#users table tbody").append(b),b.hide(),b.fadeIn("slow"),$("#tweet-challengers").hide(),h()},a.removeUser=function(a){console.log("received user leave for ID "+a),$("#users table tbody tr td[data-id='"+a+"']").parent().fadeOut("slow",function(){$(this).remove(),$("#users table tbody tr").length<2&&($("#tweet-challengers #tweet-frame").html(tweetButton({text:"I'm in the #socket2m lobby - come and challenge me to a duel!",count:"none"})),$("#tweet-challengers").fadeIn("slow"))})},a.addGame=function(a){console.log("game starting",a),c=new Date(a.started);var b=g(a);$("#games table tr.placeholder").remove(),$("#games table tbody").append(b),b.hide(),b.fadeIn("slow")},a.removeGame=function(a){console.log("received game end for ID "+a),clearInterval(d[a]),$("#games table tr[data-id='"+a+"']").fadeOut("slow",function(){$(this).remove(),$("#games table tbody tr").length==0&&$("#games table tbody").append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>")})},a.updateGameScore=function(a){$("#games tr[data-id='"+a.id+"']").length&&$("#games tr[data-id='"+a.id+"'] span."+a.player).html(a.score)},a.receiveChallenge=function(a){var c=i(b,a),d="<h2>Incoming challenge!</h2><p>You've received a challenge from <strong>"+a.username+"</strong>. "+c+"<h4 class='challenge'>Accept the challenge?</h4>";mbconfirm(d,function(a){socket.emit("lobby:challenge:respond",a)},"Yes","No")},a.challengeResponse=function(a){e=!1,$(".modal").modal("hide"),a.accepted?(console.log("requesting game start..."),socket.emit("lobby:startgame")):a.to!=b.sid&&mbalert("The opponent declined your challenge.")},a.challengeBlocked=function(){e=!1,mbalert("Sorry, this user has just challenged (or been challenged by) someone else. Try again in a moment.")},a.cancelChallenge=function(){$(".modal").modal("hide"),mbalert("The opponent withdrew their challenge.")},a.couldNotCancelChallenge=function(){console.log("could not cancel challenge")},a.confirmChallenge=function(a){mbmodal("<p>You challenge has been issued. If your opponent accepts it your game will begin immediately. You'll be notified if they reject it.</p><p>You can't challenge anyone else - and nobody can challenge you - while you wait for your opponent's decision. If you don't hear anything you can cancel this challenge whenever you wish.</p>",{"Withdraw challenge":{"class":"danger",callback:function(){e=!1,socket.emit("lobby:challenge:cancel",a)}}})},a}();Weapon=function(){var a=!0,b=(new Date).getTime(),c=0;this.isLoaded=function(){if(a)return!0;if(b==0)return!1;var c=(new Date).getTime();return a=c>=b,a},this.fire=function(d){d.type=c,GameManager.fireWeapon(d),a=!1,b=(new Date).getTime()+3e3},this.reloadIn=function(a){b=(new Date).getTime()+a},this.setType=function(a){c=a}},Weapon.factory=function(a){var b=new Weapon;return b.setType(a),b};Player=function(a){this._id=a.id,this._x=a.x,this._y=a.y,this._a=a.a,this._v=a.v,this._c=a.c,this._username=a.username,this._side=a.side,this._cWeapon=0,this._weapons={0:Weapon.factory(0),1:Weapon.factory(1)},this.aim={x:0,y:0},this.oldAim={x:0,y:0},this.oldX=this._x,this.oldY=this._y,this.tick=function(){},this.getId=function(){return this._id},this.preRender=function(){var a=GameManager.getSurface();a.clearRect(this.aim.x|0,this.aim.y|0,5,5),a.clearRect(this._x|0,this._y|0,16,32)},this.render=function(){GameManager.getSurface().fillRect(this._x|0,this._y|0,16,32,this._c)},this.renderSight=function(){var a=GameManager.getSurface();this.aim.x=this._x+Math.cos(this._a/180*Math.PI)*this._v|0,this.aim.y=this._y+Math.sin(this._a/180*Math.PI)*this._v|0,GameManager.getSurface().square(this.aim.x,this.aim.y,5,"rgb(0, 0, 0)")},this.fireWeapon=function(){if(!this.getWeapon().isLoaded())return;var a={a:this._a,v:this._v};this.getWeapon().fire(a)},this.setReloadTime=function(a){this.getWeapon().reloadIn(a)},this.changeWeapon=function(a){console.log("changing to weapon "+a),this._cWeapon=a},this.getWeapon=function(){return this._weapons[this._cWeapon]},this.getUsername=function(){return this._username},this.decreaseAngle=function(){this._a--},this.increaseAngle=function(){this._a++},this.decreaseVelocity=function(){this._v>25&&this._v--},this.increaseVelocity=function(){this._v<200&&this._v++},this.getLeft=function(){return this._x},this.getTop=function(){return this._y},this.getRight=function(){return this.getLeft()+16},this.getBottom=function(){return this.getTop()+32},this.spawn=function(a){this._x=a.x,this._y=a.y},this.getSide=function(){return this._side}},Player.factory=function(a){return console.log("Player::factory",a),new Player(a)};this.mbalert=function(a,b){var c=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>","<a class='btn primary' href='#'>OK</a>","</div>","</div>"].join("\n"));$("body").append(c),c.bind("hidden",function(){c.remove()}),c.bind("shown",function(){$("a.primary",c).focus()}),c.bind("hide",function(){typeof b=="function"&&b()}),$("a",c).click(function(a){a.preventDefault(),c.modal("hide")}),c.modal({backdrop:"static",keyboard:!0,show:!0})},this.mbconfirm=function(a,b,c,d){c==null&&(c="OK"),d==null&&(d="Cancel");var e=!1,f=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>","<a class='btn primary' href='#'>"+c+"</a>","<a class='btn danger' href='#'>"+d+"</a>","</div>","</div>"].join("\n"));$("body").append(f),f.bind("hidden",function(){f.remove()}),f.bind("hide",function(){}),f.bind("shown",function(){$("a.primary",f).focus()}),$("a",f).click(function(a){e=!0;var c=$(this).hasClass("primary");a.preventDefault(),f.modal("hide"),typeof b=="function"&&b(c)}),f.modal({backdrop:"static",show:!0})},this.mbmodal=function(a,b,c){var d="";for(var e in b){var f=b[e];d+="<a data-handler='"+e+"' class='btn "+f.class+"' href='#'>"+e+"</a>"}var g=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>",d,"</div>","</div>"].join("\n"));g.bind("hidden",function(){g.remove()}),g.bind("hide",function(){}),g.bind("shown",function(){$("a.primary",g).focus()}),$("a",g).click(function(a){a.preventDefault(),g.modal("hide");var c=$(this).data("handler"),d=b[c].callback;typeof d=="function"&&d()}),g.modal({backdrop:"static",show:!0}),$("body").append(g)},loadScript("/js/deps/bootstrap-modal.1.3.0.js");var gameActions=function(){var a={};return a.init=function(){console.log("game init"),stateListeners={"game:start":function(a){console.log("starting game"),GameManager.start(a),tick()},"game:weapon:fire":function(a){GameManager.actuallyFireWeapon(a)},"game:weapon:fire:wait":function(a){GameManager.reloadPlayerWeaponIn(a)},"game:powerup:spawn":function(a){GameManager.actuallySpawnPowerup(a)},"game:powerup:claim":function(a){GameManager.actuallyClaimPowerup(a)},"game:weapon:change":function(a){GameManager.changePlayerWeapon(a)},"game:bullet:die":function(a){},"game:player:kill":function(a){GameManager.actuallyKillPlayer(a)},"game:player:respawn":function(a){GameManager.actuallyRespawnPlayer(a)},"game:player:chat":function(a){GameManager.showChatMessage(a)},"game:win":function(a){GameManager.handleWin(a)},"game:lose":function(a){GameManager.handleLose(a)},"game:cancel":function(a){GameManager.cancelGame(a)},"game:suddendeath":function(){GameManager.setSuddenDeath()}},$("#game #volume").click(function(a){a.preventDefault(),SoundManager.toggleSounds()}),socket.emit("game:ready")},a}();var lobbyActions=function(){var a={};return a.init=function(){console.log("lobby init"),stateListeners={"lobby:users":function(a){LobbyManager.init(a)},"lobby:user:join":function(a){LobbyManager.addUser(a)},"user:leave":function(a){LobbyManager.removeUser(a)},"lobby:game:start":function(a){LobbyManager.addGame(a)},"lobby:game:end":function(a){LobbyManager.removeGame(a)},"lobby:challenge:receive":function(a){LobbyManager.receiveChallenge(a)},"lobby:challenge:response":function(a){LobbyManager.challengeResponse(a)},"lobby:challenge:blocked":function(){LobbyManager.challengeBlocked()},"lobby:challenge:cancel":function(){LobbyManager.cancelChallenge()},"lobby:challenge:cancel:invalid":function(){LobbyManager.couldNotCancelChallenge()},"lobby:challenge:confirm":function(a){LobbyManager.confirmChallenge(a)},"lobby:game:scorechange":function(a){LobbyManager.updateGameScore(a)},"lobby:chat":function(a){LobbyManager.addChatLine(a)}},socket.emit("lobby:ready")},a}();var registerActions=function(){var a={},b={email:"",username:"",password:""};return a.init=function(){console.log("register init"),$("#register form input").bind("change keyup",function(a){var c=$.trim($(this).val());b[$(this).attr("name")]=c;var d=!0;for(var e in b)if(!b[e].length){d=!1;break}d&&($("#register form input").unbind(),$("#register p.alert-message").fadeIn())}),$("#register form").submit(function(a){a.preventDefault(),socket.emit("register:register",$(this).serialize())})},a}();var welcomeActions=function(){return self={},self.init=function(){console.log("welcome init"),$("#login form").submit(function(a){a.preventDefault(),socket.emit("welcome:login",$(this).serialize())}),$("#login a.register").click(function(a){a.preventDefault(),socket.emit("welcome:register")}),stateListeners={"welcome:count":function(a){var b=a.users,c=b!=1?"are":"is",d=b!=1?"users":"user",e=a.games,f=e!=1?"games":"game";$("#login form").after("<p>There "+c+" <strong>"+b+"</strong> "+d+" in the lobby and <strong>"+e+"</strong> "+f+" in progress right now.</p>")}},socket.emit("welcome:ready"),SoundManager.preloadSound("/sounds/bang.wav","weapon:fire"),SoundManager.preloadSound("/sounds/applause.wav","player:kill"),SoundManager.preloadSound("/sounds/boo.wav","player:die"),SoundManager.preloadSound("/sounds/chat.wav","chat"),SoundManager.preloadSound("/sounds/sudden_death.wav","game:suddendeath"),SoundManager.preloadSound("/sounds/win.wav","game:win"),SoundManager.preloadSound("/sounds/lose.wav","game:lose"),SoundManager.preloadSound("/sounds/teleport.wav","player:teleport"),SoundManager.preloadSound("/sounds/weapon.wav","weapon:change"),SoundManager.preloadSound("/sounds/powerup.wav","game:powerup:spawn")},self}();