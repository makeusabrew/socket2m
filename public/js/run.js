function g(){i=requestAnimFrame(g),h.loop()}var a=null,b={},c=$("title").html(),d=d||null,e=null,Client=function(e){var f={};return f.start=function(){if(!e){$("#wrapper").html("<h2>The socket2m server is not running at the moment. Please come back later.</h2>");return}d==null&&(d=io.connect()),d.on("connect",function(){console.log("connected")}),d.on("state:change",function(e){var f=!1,g=null,h=function(h,i){h!=null&&(f=h),i!=null&&(g=i);if(f&&g){$("#wrapper").html(g);var j=$("#wrapper h1:first");$("#state-wrapper").hide().children("#state-title").html(j.html()),$("title").html(c+" - "+j.html()),j.parent("div.page-header").remove(),j.remove(),$("#state-wrapper").fadeIn("fast"),$("#wrapper").fadeIn("fast"),window[e.charAt(0)+"a"].init(),a=e;for(var k in b)d.on(k,b[k]);console.log("changed state to "+e),typeof _gaq!="undefined"&&_gaq.push(["_trackPageview","/"+e])}};$("#state-wrapper").fadeOut("fast"),$("#wrapper").fadeOut("fast",function(){h(!0,null)});for(var i in b)d.removeListener(i,b[i]);d.emit("state:fetch",e,function(a){h(null,a)})}),d.on("msg",function(a){l.alert(a)}),loadScript("/shared/js/utils.js")},f.isTouchDevice=function(){return"ontouchstart"in document.documentElement},f.iOS=function(){return"ontouchstart"in document.documentElement},f.ping=function(a,b){var c=[];(function e(f){var g=(new Date).getTime();d.emit("ping",function(d){var h=((new Date).getTime()-g)/2;c.push({latency:h,timestamp:d}),f<a?e(f+1):b(c)})})(1)},f}(typeof io!="undefined");$(function(){f.preloadSound("/sounds/bang.wav","weapon:fire"),Client.iOS()||(f.preloadSound("/sounds/applause.wav","player:kill"),f.preloadSound("/sounds/boo.wav","player:die"),f.preloadSound("/sounds/chat.wav","chat"),f.preloadSound("/sounds/sudden_death.wav","game:suddendeath"),f.preloadSound("/sounds/win.wav","game:win"),f.preloadSound("/sounds/lose.wav","game:lose"),f.preloadSound("/sounds/teleport.wav","player:teleport"),f.preloadSound("/sounds/weapon.wav","weapon:change"),f.preloadSound("/sounds/powerup.wav","game:powerup:spawn"),f.preloadSound("/sounds/mention.wav","lobby:mention"),f.preloadSound("/sounds/challenge.wav","lobby:challenge")),Client.start()});Bullet=function(){this._x=0,this._y=0,this._alive=!1,this._owner=0,this._vx=0,this._vy=0,this._w=0,this._id=0},Bullet.prototype={spawn:function(a){this._x=a.x,this._y=a.y,this._owner=a.o,this._id=a.id,this._alive=!0,this._w=3,this._vx=a.vx,this._vy=a.vy,this._lastX=-1,this._lastY=-1},getOwner:function(){return this._owner},getId:function(){return this._id},tick:function(a){this._x+=this._vx*a,this._y+=this._vy*a,this._vy+=20*a,(this._x<h.getLeft()||this._x>h.getRight()||this._y<h.getTop()||this._y>h.getBottom())&&this.kill()},isDead:function(){return!this._alive},render:function(){var a=this._x|0,b=this._y|0;if(a!=this._lastX||b!=this._lastY)e.clearRect(this._lastX,this._lastY,this._w,this._w),this._lastX=a,this._lastY=b;e.square(a,b,this._w)},kill:function(){e.clearRect(this._lastX,this._lastY,this._w,this._w),this._alive=!1},getLeft:function(){return this._x},getTop:function(){return this._y},getRight:function(){return this.getLeft()+this._w},getBottom:function(){return this.getTop()+this._w}},Bullet.factory=function(){return new Bullet};Platform=function(){this.x=0,this.y=0,this.w=0,this.h=0},Platform.prototype={setCoordinates:function(a,b,c,d){this.x=a,this.y=b,this.w=c,this.h=d},render:function(){e.fillRect(this.x,this.y,this.w,this.h)},getLeft:function(){return this.x},getTop:function(){return this.y},getRight:function(){return this.getLeft()+this.w},getBottom:function(){return this.getTop()+this.h}};Powerup=function(){this.x=0,this.y=0,this.r=0,this.type=0,this.alive=!1,this.id=0,this.letter=""},Powerup.prototype={spawn:function(a){this.x=a.x,this.y=a.y,this.r=a.r,this.type=a.type,this.id=a.id,this.alive=!0,this.letter=a.letter},render:function(){e.setFillStyle("rgb(0, 255, 128)"),e.circle(this.x,this.y,this.r),e.fillText(this.x+this.r,this.y+1,this.letter,"rgb(100, 100, 100)",{font:"bold 13px sans-serif",textBaseline:"hanging",textAlign:"center"})},getLeft:function(){return this.x},getTop:function(){return this.y},getRight:function(){return this.getLeft()+this.r*2},getBottom:function(){return this.getTop()+this.r*2},getId:function(){return this.id},kill:function(){e.clearRect(this.x-1,this.y-1,(this.r+1)*2,(this.r+1)*2),this.alive=!1},isDead:function(){return!this.alive}},Powerup.factory=function(){return new Powerup};var f=function(){var a={},b={},c={},d=!1,e=!1;return a.toggleSounds=function(){d=!d},a.mute=function(){d=!0},a.unmute=function(){d=!1},a.preloadSound=function(a,d){if(b[a]==null){var e=new Audio(a);e.load(),b[a]=e}else console.log("not preloading sound - already loaded ["+a+"]");d!=null&&(c[d]=a)},a.playSound=function(a){if(d)return;if(b[a]==null)if(c[a]!=null)a=c[a];else{console.log("warning - "+a+" was not preloaded - aborting");return}b[a].play()},a.pauseSound=function(a){if(d)return;b[a]==null&&c[a]!=null&&(a=c[a]),b[a].pause()},a}();var h=function(){var a=0,b=0,c=0,g=0,h=0,k=0,m=0,n=null,o=null,p=null,q=[],r=[],s=[],t=[],u=[],v=[],w=0,x=-1,y=!1,z=null,A=!1,B=!1,C=!1,D=!1,E=0,F=0,G=null,H=null,I={};return I.loop=function(){if(A)return;c=(new Date).getTime(),h=(c-b)/1e3,b=c;if(c>=g+1e3){g=c;var a=Math.round(10/h)/10;G.innerHTML=a+" fps"}B||(w>0?(w-=h,Math.ceil(w)!=x&&(x=Math.ceil(w),H.innerHTML=Utils.formatTime(x))):y||(y=!0,d.emit("game:timeup"))),I.handleInput(),I.tick(),I.render()},I.handleInput=function(){if(D)return;j.isKeyDown("SPACE_BAR")&&o.fireWeapon(),j.isKeyDown("LEFT_ARROW")?o.decreaseAngle(h):j.isKeyDown("RIGHT_ARROW")&&o.increaseAngle(h),j.isKeyDown("DOWN_ARROW")?o.decreaseVelocity(h):j.isKeyDown("UP_ARROW")&&o.increaseVelocity(h)},I.tick=function(){u.length<3&&Math.floor(Math.random()*2501)==0&&I.spawnPowerup();var a=q.length,b;if(a)while(a--){var c=q[a],d=c.socket_id==o.getId()?o:p;d.spawn({x:c.x,y:I.getCoordinateForPlatform(c.platform)}),d.getId()!=p.getId(),q=[]}a=r.length;if(a){b=t.length;while(a--)while(b--)if(t[b].getId()==r[a]){console.log("killing entity "+t[b].getId()),t[b].kill(),t.splice(b,1);break}r=[]}a=s.length;if(a){b=u.length;while(a--)while(b--)if(u[b].getId()==s[a]){console.log("killing powerup "+u[b].getId()),u[b].kill(),u.splice(b,1);break}s=[]}a=t.length;while(a--){t[a].tick(h);if(!t[a].isDead()){t[a].getOwner()==o.getId()&&I.entitiesTouching(t[a],p)?(t[a].kill(),I.killOpponent(t[a].getId())):t[a].getOwner()==p.getId()&&I.entitiesTouching(t[a],o)&&t[a].kill();if(!t[a].isDead()){b=u.length;while(b--)t[a].getOwner()==o.getId()&&I.entitiesTouching(t[a],u[b])?(t[a].kill(),I.claimPowerup(u[b].getId(),t[a].getId())):t[a].getOwner()==p.getId()&&I.entitiesTouching(t[a],u[b])&&t[a].kill(),!u[b].isDead()}if(!t[a].isDead()){var b=4;while(b--)if(I.entitiesTouching(t[a],v[b])){t[a].kill();break}}}t[a].isDead()&&(console.log("found dead entity ID "+t[a].getId()),t.splice(a,1))}},I.render=function(){o.render(),o.renderSight(),p.render();var a=0;a=v.length,e.setFillStyle("rgb(0, 0, 0)");while(a--)v[a].render();a=t.length,e.setFillStyle("rgb(255, 0, 0)");while(a--)t[a].render();a=u.length;while(a--)u[a].render()},I.setPlayer=function(a){o=a},I.setOpponent=function(a){p=a},I.spawnPowerup=function(){console.log("requesting powerup"),d.emit("game:powerup:spawn")},I.actuallySpawnPowerup=function(a){console.log("spawning powerup",a);var b=Powerup.factory();b.spawn(a),u.push(b),f.playSound("game:powerup:spawn")},I.fireWeapon=function(a){d.emit("game:weapon:fire",a)},I.actuallyFireWeapon=function(a){var b=a.x,c=a.o,d=I.getCoordinateForPlatform(a.platform),e=a.t;a.o==o.getId()&&o.setReloadTime(a.reloadIn);for(var g=0,h=a.bullets.length;g<h;g++){var i=Bullet.factory(),j=a.bullets[g];j.o=c,j.x=b,j.y=d,i.spawn(j),t.push(i)}f.playSound("weapon:fire")},I.reloadPlayerWeaponIn=function(a){o.setReloadTime(a)},I.getLeft=function(){return 0},I.getTop=function(){return 0},I.getBottom=function(){return m},I.getRight=function(){return k},I.entitiesTouching=function(a,b){return a.getLeft()<=b.getRight()&&b.getLeft()<=a.getRight()&&a.getTop()<=b.getBottom()&&b.getTop()<=a.getBottom()},I.claimPowerup=function(a,b){console.log("requesting claim powerup "+a+" from bullet "+b),d.emit("game:powerup:claim",{id:a,eId:b})},I.actuallyClaimPowerup=function(a){console.log("killing bullet "+a.eId+" and queueing powerup removal "+a.id),s.push(a.id),r.push(a.eId)},I.killOpponent=function(a){console.log("requesting kill opponent from bullet "+a),d.emit("game:player:kill",{eId:a})},I.actuallyKillPlayer=function(a){var b=a.kId;$("#game #p1").html(a.scores[0]),$("#game #p2").html(a.scores[1]),b==p.getId()?(a.doRespawn&&f.playSound("player:die"),console.log("queuing entity death "+a.eId),r.push(a.eId)):b==o.getId()&&a.doRespawn&&f.playSound("player:kill")},I.actuallyRespawnPlayer=function(a){console.log("queuing respawning player",a.player),q.push(a.player),a.teleport&&f.playSound("player:teleport")},I.getCoordinateForPlatform=function(a){return(a+1)*200-32},I.beginChatting=function(){j.releaseKeys(),console.log("beginning chat"),D=!0;var a=$("#viewport").offset(),b=$("<form id='chatform' style='display:none;'><input type='text' placeholder='type your message' autocomplete='off' /></form>").css({left:o.getLeft()+a.left-100,top:o.getTop()+a.top-50});$("body").append(b),$("input",b).blur(function(){I.endChatting()}),b.submit(function(a){a.preventDefault();var c=$.trim($("input",b).val());c.length&&(console.log("chatting: "+c),d.emit("game:player:chat",c),I.endChatting())}),b.show(),$("input",b).focus()},I.endChatting=function(){j.bindKeys(),D=!1,$("#chatform").fadeOut("fast",function(){$(this).remove()})},I.isChatting=function(){return D},I.showChatMessage=function(a){var b=$("#viewport").offset(),c=p.getId()==a.id?p:o,d=$("<div class='chatbubble' style='display:none;'>"+a.msg+"</div>");d.addClass(c.getSide()),$("body").append(d),d.css("top",c.getTop()+b.top-40-d.height()/2),c.getSide()=="left"?d.css("left",b.left+8):d.css("left",b.left+$("#viewport").width()-d.width()-21),d.fadeIn("normal",function(){setTimeout(function(){d.fadeOut("normal",function(){d.remove()})},3500)}),c.getId()==p.getId()&&f.playSound("chat")},I.prepare=function(a){var b=a.challenger,c=a.challengee;$("#state-title").html("Game On: "+b.username+" Vs "+c.username),$("#game .stats").html("0"),I.bindKeys();var f=Player.factory({id:b.socket_id,x:b.x,y:I.getCoordinateForPlatform(b.platform),a:b.a,v:b.v,c:"rgb(0, 255, 0)",side:"left",username:b.username}),g=Player.factory({id:c.socket_id,x:c.x,y:I.getCoordinateForPlatform(c.platform),a:c.a,v:c.v,c:"rgb(0, 0, 255)",side:"right",username:c.username});b.socket_id==a.user.sid?(I.setPlayer(f),I.setOpponent(g)):(I.setPlayer(g),I.setOpponent(f)),e=new Surface("viewport"),m=I.getTop()+e.getHeight(),k=I.getLeft()+e.getWidth(),I.addPlatforms(),C=!1,A=!1,B=!1,D=!1,y=!1,x=-1,w=a.duration,t=[],u=[],q=[],r=[],s=[],Client.isTouchDevice()&&($(".topbar").hide(),$("#footer").hide(),$("#touchControls").show(),document.getElementById("left").ontouchstart=function(){j.keyDown("LEFT_ARROW")},document.getElementById("left").ontouchend=function(){j.keyUp("LEFT_ARROW")},document.getElementById("right").ontouchstart=function(){j.keyDown("RIGHT_ARROW")},document.getElementById("right").ontouchend=function(){j.keyUp("RIGHT_ARROW")},document.getElementById("up").ontouchstart=function(){j.keyDown("UP_ARROW")},document.getElementById("up").ontouchend=function(){j.keyUp("UP_ARROW")},document.getElementById("down").ontouchstart=function(){j.keyDown("DOWN_ARROW")},document.getElementById("down").ontouchend=function(){j.keyUp("DOWN_ARROW")},document.getElementById("space").ontouchstart=function(){j.keyDown("SPACE_BAR")},document.getElementById("space").ontouchend=function(){j.keyUp("SPACE_BAR")}),G=document.getElementById("fps"),H=document.getElementById("countdown"),d.emit("game:prepared")},I.start=function(a){b=(new Date).getTime(),g=b},I.handleWin=function(a){f.playSound("game:win");var b=a.scores.win==1?"point":"points",c="<h2>Congratulations - you win!</h2><p>Well done - you beat "+p.getUsername()+" by <strong>"+a.scores.win+"</strong> "+b+" to <strong>"+a.scores.lose+"</strong>.</p>"+"<h3>Ranking change</h3>"+"<p>Your rank has increased to <strong>"+a.rank+"</strong> (+"+a.increase+")</p>"+"<h3>Tweet all about it</h3>"+"<p>Why not let the world know about your victory? Tweet and find some new people to beat!</p>"+tweetButton({text:"I just won a game of Sock it to 'em - why not come and challenge me to a duel?",count:"none"});I.endGame(c)},I.handleLose=function(a){f.playSound("game:lose");var b=a.scores.win==1?"point":"points",c="<h2>Oh no - you lose!</h2><p>Bad luck - you lost to "+p.getUsername()+" by <strong>"+a.scores.win+"</strong> "+b+" to <strong>"+a.scores.lose+"</strong>.</p>"+"<h3>Ranking change</h3>";a.decrease?c+="<p>Your rank has decreased to <strong>"+a.rank+"</strong> (-"+a.decrease+")</p>":c+="<p>Your rank has remained unchanged at <strong>"+a.rank+"</strong></p>",c+="<h3>Spread the word</h3><p>Why not challenge someone else? Spread the word to find some new people to beat!</p>"+tweetButton({text:"Fancy a duel? Come and have a game of Sock it to em'!",count:"none"}),I.endGame(c)},I.cancelGame=function(a){var b="<h2>Game aborted!</h2><p>Oh no - "+p.getUsername()+" left the game! ";a.defaulted?b+="As it was underway, they have <strong>forfeited</strong> it. You don't get the glory of a win, but your rank has increased by <strong>one</strong> point, and theirs has decreased due to bailing out of your duel.</p>":b+="As it hadn't got properly underway it has been <strong>cancelled</strong>.</p>",I.endGame(b)},I.endGame=function(a,b){clearTimeout(z),cancelRequestAnimFrame(i),A=!0,j.releaseKeys(),$("#countdown").html("Game Over"),l.alert(a,function(){d.emit("game:finish")}),Client.isTouchDevice()&&($(".topbar").show(),$("#footer").show())},I.setSuddenDeath=function(){B=!0,f.playSound("game:suddendeath"),$("#countdown").html("Sudden Death")},I.bindKeys=function(){j.captureKeys(["SPACE_BAR","UP_ARROW","DOWN_ARROW","LEFT_ARROW","RIGHT_ARROW"]),j.bindTo(window),j.bindKeys(),j.onKeyPress("T",function(a){I.isChatting()||I.beginChatting()}),j.onKeyPress("ESC",function(a){I.isChatting()&&I.endChatting()})},I.addPlatforms=function(){v[0]=new Platform,v[0].setCoordinates(0,this.getBottom()/3*1,48,10),v[1]=new Platform,v[1].setCoordinates(0,this.getBottom()/3*2,48,10),v[2]=new Platform,v[2].setCoordinates(this.getRight()-48,this.getBottom()/3*1,48,10),v[3]=new Platform,v[3].setCoordinates(this.getRight()-48,this.getBottom()/3*2,48,10)},I.changePlayerWeapon=function(a){f.playSound("weapon:change"),o.changeWeapon(a)},I.delayTimeup=function(a){console.log("retrying timeup in "+a),z=setTimeout(function(){console.log("retrying timeup..."),d.emit("game:timeup")},a)},I.calculateLatencyAndOffset=function(a){Client.ping(10,function(b){b.sort(function(a,b){return a.latency-b.latency});var c=b[Math.floor(b.length/2)].latency,d=b.length,e=c*1.5,f=0,g=0;while(d--)b[d].latency<=e&&(f++,g+=b[d].latency);var h=g/f;console.log("setting latency: "+h),E=h,Client.ping(1,function(b){F=b[0].timestamp-(new Date).getTime()+E,console.log("setting clock offset:"+F),a()})})},I}(),i=null;Surface=function(a){var b,c=document.getElementById(a);if(!c.getContext)throw new Error("Canvas not available");b=c.getContext("2d"),c.width=b.canvas.clientWidth,c.height=b.canvas.clientHeight,this.line=function(a,c,d,e,f){b.strokeStyle=f,b.beginPath(),b.moveTo(a,c),b.lineTo(d,e),b.closePath(),b.stroke()},this.fillRect=function(a,c,d,e){b.fillRect(a,c,d,e)},this.getWidth=function(){return b.canvas.clientWidth},this.getHeight=function(){return b.canvas.clientHeight},this.pixel=function(a,b){this.fillRect(a,b,1,1)},this.square=function(a,b,c){this.fillRect(a,b,c,c)},this.drawImage=function(a,c,d,e,f){b.drawImage(a,c,d,e,f)},this.clear=function(){b.clearRect(0,0,c.width,c.height)},this.clearRect=function(a,c,d,e){b.clearRect(a,c,d,e)},this.circle=function(a,c,d){b.beginPath(),b.arc(a+d,c+d,d,0,Math.PI*2,!0),b.closePath(),b.fill()},this.fillText=function(a,c,d,e,f){b.fillStyle=e,f.font&&(b.font=f.font),f.textBaseline&&(b.textBaseline=f.textBaseline),f.textAlign&&(b.textAlign=f.textAlign),b.fillText(d,a,c)},this.setFillStyle=function(a){b.fillStyle=a}};var j={keyMap:{27:"ESC",32:"SPACE_BAR",37:"LEFT_ARROW",38:"UP_ARROW",39:"RIGHT_ARROW",40:"DOWN_ARROW",84:"T"},keysPressed:{},capturedKeys:{},target:null,triggers:{},keyDown:function(a){j.keysPressed[a]=!0},keyUp:function(a){j.keysPressed[a]=!1},isKeyDown:function(a){return j.keysPressed[a]==1},captureKeys:function(a){for(var b=0;b<a.length;b++)j.capturedKeys[a[b]]=!0},isCapturedKey:function(a){return j.capturedKeys[a]==1},mapKey:function(a){return typeof j.keyMap[a]!="undefined"?j.keyMap[a]:"KEY_NOT_MAPPED"},releaseKeys:function(){$(j.target).unbind("keydown"),$(j.target).unbind("keyup")},bindKeys:function(){$(j.target).keydown(function(a){var b=j.mapKey(a.which);j.isCapturedKey(b)&&a.preventDefault(),j.keyDown(b)}),$(j.target).keyup(function(a){var b=j.mapKey(a.which);j.isCapturedKey(b)?a.preventDefault():j.triggers[b]!=null&&j.triggers[b](a),j.keyUp(b)})},bindTo:function(a){j.target=a},onKeyPress:function(a,b){j.triggers[a]=b}};var k=function(){function a(a){if($("td[data-id='"+a.sid+"']").length){console.warn("Not adding user ID "+a.sid+" to table - already present");return}var b=a.sid==h.sid?"me":"opponent",c=a.sid==h.sid?"your":""+a.username+"'s",d=a.idle?"idle":"";a.rank==null&&(a.rank=0),a.wins==null&&(a.wins=0),a.losses==null&&(a.losses=0);var e="<tr><td data-id='"+a.sid+"' "+"data-username='"+a.username+"' "+"data-rank='"+a.rank+"' "+"class='"+b+"'><span>"+a.username+"</span> "+"<span class='status'>"+d+"</span> "+"<span class='extra'>";return a.position==1?e+="<img src='/img/gold.png' alt='' title='"+a.username+" is the top ranked player of the game!' />":a.position==2?e+="<img src='/img/silver.png' alt='' title='"+a.username+" is the 2nd best ranked player of the game' />":a.position==3&&(e+="<img src='/img/bronze.png' alt='' title='"+a.username+" is the 3rd best ranked player of the game' />"),a.winning_streak>=3&&(e+="<img src='/img/winning_streak.png' alt='' title='"+a.username+"' is on a winning streak' />"),a.accuracy>=20&&(e+="<img src='/img/sharp_shooter.png' alt='' title='"+a.username+"' is a sharp shooter - their accuracy is above 20%' />"),e+='<a title="View '+c+" profile in a new window\" href='/user/"+a.username+"' target='_blank'><img src='/img/profile.png' alt='View "+a.username+"'s profile' /></a>"+"</span></td>"+"<td>"+a.rank+"</td>"+"<td>"+a.wins+"</td>"+"<td>"+a.losses+"</td>"+"</tr>",$(e)}function b(a){var b=new Date(a.started);console.log("game started at: "+b.getTime()+" with duration: "+a.duration+" current TS: "+i.getTime());var c=Math.round((b.getTime()+a.duration*1e3-i.getTime())/1e3),d="";return c<=0?d="due to finish...":(d=Utils.formatTime(c),j[a._id]=setInterval(function(){c--,c<=0?(clearInterval(j[a._id]),$("td[data-game-time='"+a._id+"']").html("due to finish...")):$("td[data-game-time='"+a._id+"']").html(Utils.formatTime(c))},1e3)),$("<tr data-id='"+a._id+"'><td>"+a.challenger.username+" Vs "+a.challengee.username+"</td><td><span class='challenger'>"+a.challenger.score+"</span> - <span class='challengee'>"+a.challengee.score+"</span></td><td data-game-time='"+a._id+"'>"+d+"</td>")}function c(){$("#users table").unbind("click"),$("#users table").bind("click",function(a){var b=$(a.target),c=b.attr("data-id");if(c!=null&&c!=h.sid)if(k)l.alert("You've got a challenge outstanding - please wait.");else{var f=e(h,{rank:b.data("rank")}),g="<p>Do you want to challenge <strong>"+b.data("username")+"</strong>? "+f+"<h4 class='challenge'>Issue the challenge?</h4>";l.confirm(g,function(a){a&&(k=!0,console.log("issuing challenge to "+c),d.emit("lobby:challenge:issue",c))},"Yes","No")}})}function e(a,b){var c="",d="",e="";return a.rank>b.rank?(e="lower than",c="increase by <strong>one</strong> point",d="decrease by <strong>two</strong> points"):a.rank<b.rank?(e="higher than",c="increase by <strong>three</strong> points",d="not change"):(e="the same as",c="increase by <strong>two</strong> points",d="decrease by <strong>one</strong> point"),a.rank<=0&&(d="not change as you are currently unranked"),"Their rank is currently <strong>"+b.rank+"</strong>, which is "+e+" yours.</p>"+"<h3>If you win...</h3>"+"<p>Your ranking will "+c+".</p>"+"<h3>But if you lose...</h3>"+"<p>Your ranking will "+d+".</p>"}var g={},h=null,i=null,j={},k=!1,m=null,n=null,o=!1,p=null;return g.addChatLine=function(a,b){if(b==null||b==1){var c=new RegExp("@"+h.username);c.test(a.msg)&&f.playSound("lobby:mention")}var d=new Date(a.timestamp),e=$("<div class='chatline "+a.type+"'><time datetime='"+a.timestamp+"'>"+Utils.formatDate(d)+"</time><span class='author'>"+a.author.username+"</span>: <span class='msg'>"+a.msg+"</span></div>");$("#lobby #chat").append(e)},g.resetIdleTimer=function(){o&&(d.emit("lobby:active"),o=!1),clearTimeout(p),g.startIdleTimer()},g.startIdleTimer=function(){p=setTimeout(function(){d.emit("lobby:idle"),o=!0},3e4)},g.init=function(e){g.startIdleTimer(),$("#lobby").mousemove(function(a){g.resetIdleTimer()}),$("#lobby form").submit(function(a){a.preventDefault(),g.resetIdleTimer();var b=$(this).find("input"),c=$.trim(b.val());c.length&&(b.prop("disabled",!0),b.val(""),setTimeout(function(){b.prop("disabled",!1)},250),d.emit("lobby:chat",c))});var f,j;i=new Date(e.timestamp),h=e.user,console.log("lobby state",e);var k=$("#users table tbody");k.hide();for(f=0,j=e.users.length;f<j;f++)k.append(a(e.users[f]));k.show(),e.users.length<2&&($("#tweet-challengers #tweet-frame").html(tweetButton({text:"I'm in the #socket2m lobby - come and challenge me to a duel!",count:"none"})),$("#tweet-challengers").show());var l=$("#games table tbody");l.hide();for(f=0,j=e.games.length;f<j;f++)l.append(b(e.games[f]));l.show(),e.games.length==0&&l.append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>");for(f=0,j=e.chatlines.length;f<j;f++)g.addChatLine(e.chatlines[f],!1);c()},g.addUser=function(b){console.log("user joining lobby",b);var d=a(b);d&&($("#users table tbody").append(d),d.hide(),d.fadeIn("slow"),$("#tweet-challengers").hide()),c()},g.removeUser=function(a){console.log("received user leave for ID "+a),$("#users table tbody tr td[data-id='"+a+"']").parent().fadeOut("slow",function(){$(this).remove(),$("#users table tbody tr").length<2&&($("#tweet-challengers #tweet-frame").html(tweetButton({text:"I'm in the #socket2m lobby - come and challenge me to a duel!",count:"none"})),$("#tweet-challengers").fadeIn("slow"))})},g.markIdle=function(a){$("#users table tbody tr td[data-id='"+a+"'] span.status").hide().html("idle").fadeIn("normal")},g.markActive=function(a){$("#users table tbody tr td[data-id='"+a+"'] span.status").fadeOut("normal",function(){$(this).html("")})},g.addGame=function(a){console.log("game starting",a),i=new Date(a.started);var c=b(a);$("#games table tr.placeholder").remove(),$("#games table tbody").append(c),c.hide(),c.fadeIn("slow")},g.removeGame=function(a){console.log("received game end for ID "+a),clearInterval(j[a]),$("#games table tr[data-id='"+a+"']").fadeOut("slow",function(){$(this).remove(),$("#games table tbody tr").length==0&&$("#games table tbody").append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>")})},g.updateGameScore=function(a){$("#games tr[data-id='"+a.id+"']").length&&$("#games tr[data-id='"+a.id+"'] span."+a.player).html(a.score)},g.receiveChallenge=function(a){n=$("title").html();var b=["Incoming challenge!",n],c=0;$("title").html(b[c]),m=setInterval(function(){++c>=b.length&&(c=0),$("title").html(b[c])},2e3);var f=e(h,a),g="<h2>Incoming challenge!</h2><p>You've received a challenge from <strong>"+a.username+"</strong>. "+f+"<h4 class='challenge'>Accept the challenge?</h4>";l.confirm(g,function(a){clearInterval(m),$("title").html(n),d.emit("lobby:challenge:respond",a)},"Yes","No")},g.challengeResponse=function(a){k=!1,$(".modal").modal("hide"),a.accepted?(console.log("requesting game start..."),d.emit("lobby:startgame")):a.to!=h.sid&&l.alert("The opponent declined your challenge.")},g.challengeBlocked=function(){k=!1,l.alert("Sorry, this user has just challenged (or been challenged by) someone else. Try again in a moment.")},g.cancelChallenge=function(){clearInterval(m),$("title").html(n),$(".modal").modal("hide"),l.alert("The opponent withdrew their challenge.")},g.couldNotCancelChallenge=function(){console.log("could not cancel challenge")},g.confirmChallenge=function(a){l.dialog("<p>You challenge has been issued. If your opponent accepts it your game will begin immediately. You'll be notified if they reject it.</p><p>You can't challenge anyone else - and nobody can challenge you - while you wait for your opponent's decision. If you don't hear anything you can cancel this challenge whenever you wish.</p>",{"Withdraw challenge":{"class":"danger",callback:function(){k=!1,d.emit("lobby:challenge:cancel",a)}}})},g}();Weapon=function(){var a=!0,b=(new Date).getTime(),c=0;this.isLoaded=function(){var c;return a?!0:b==0?!1:(c=(new Date).getTime(),a=c>=b,a)},this.fire=function(d){d.type=c,h.fireWeapon(d),a=!1,b=(new Date).getTime()+3e3},this.reloadIn=function(a){b=(new Date).getTime()+a},this.setType=function(a){c=a}},Weapon.factory=function(a){var b=new Weapon;return b.setType(a),b};Player=function(a){this._id=a.id,this._x=a.x,this._y=a.y,this._a=a.a,this._v=a.v,this._c=a.c,this._username=a.username,this._side=a.side,this._cWeapon=0,this._weapons={0:Weapon.factory(0),1:Weapon.factory(1)},this.aim={x:0,y:0},this._lastAim={x:-1,y:-1},this._lastX=-1,this._lastY=-1,this.tick=function(){},this.getId=function(){return this._id},this.render=function(){var a=this._x,b=this._y;if(a!=this._lastX||b!=this._lastY)e.clearRect(this._lastX,this._lastY,16,32),this._lastX=a,this._lastY=b;e.setFillStyle(this._c),e.fillRect(this._x,this._y,16,32)},this.renderSight=function(){var a,b;this.aim.x=this._x+Math.cos(this._a/180*Math.PI)*this._v|0,this.aim.y=this._y+Math.sin(this._a/180*Math.PI)*this._v|0,a=this.aim.x,b=this.aim.y;if(a!=this._lastAim.x||b!=this._lastAim.y)e.clearRect(this._lastAim.x,this._lastAim.y,5,5),this._lastAim.x=this.aim.x,this._lastAim.y=this.aim.y;e.setFillStyle("rgb(0, 0, 0)"),e.square(this.aim.x,this.aim.y,5)},this.fireWeapon=function(){var a;if(!this.getWeapon().isLoaded())return;a={a:this._a,v:this._v},this.getWeapon().fire(a)},this.setReloadTime=function(a){this.getWeapon().reloadIn(a)},this.changeWeapon=function(a){console.log("changing to weapon "+a),this._cWeapon=a},this.getWeapon=function(){return this._weapons[this._cWeapon]},this.getUsername=function(){return this._username},this.decreaseAngle=function(a){this._a-=50*a},this.increaseAngle=function(a){this._a+=50*a},this.decreaseVelocity=function(a){this._v-=60*a,this._v<25&&(this._v=25)},this.increaseVelocity=function(a){this._v+=60*a,this._v>200&&(this._v=200)},this.getLeft=function(){return this._x},this.getTop=function(){return this._y},this.getRight=function(){return this.getLeft()+16},this.getBottom=function(){return this.getTop()+32},this.spawn=function(a){this._x=a.x,this._y=a.y},this.getSide=function(){return this._side}},Player.factory=function(a){return console.log("Player::factory",a),new Player(a)};var l=l||function(){var a={};return a.alert=function(a,b,c){c==null&&(c="OK");var d=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>","<a class='btn primary' href='#'>"+c+"</a>","</div>","</div>"].join("\n"));$("body").append(d),d.bind("hidden",function(){d.remove()}),d.bind("shown",function(){$("a.primary",d).focus()}),d.bind("hide",function(){typeof b=="function"&&b()}),$("a",d).click(function(a){a.preventDefault(),d.modal("hide")}),d.modal({backdrop:"static",keyboard:!0,show:!0})},a.confirm=function(a,b,c,d){c==null&&(c="OK"),d==null&&(d="Cancel");var e=!1,f=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>","<a class='btn primary' href='#'>"+c+"</a>","<a class='btn danger' href='#'>"+d+"</a>","</div>","</div>"].join("\n"));$("body").append(f),f.bind("hidden",function(){f.remove()}),f.bind("hide",function(){}),f.bind("shown",function(){$("a.primary",f).focus()}),$("a",f).click(function(a){e=!0;var c=$(this).hasClass("primary");a.preventDefault(),f.modal("hide"),typeof b=="function"&&b(c)}),f.modal({backdrop:"static",show:!0})},a.dialog=function(a,b,c){var d="";for(var e in b){var f=b[e];d+="<a data-handler='"+e+"' class='btn "+f.class+"' href='#'>"+e+"</a>"}var g=$(["<div class='modal hide fade'>","<div class='modal-body'>",a,"</div>","<div class='modal-footer'>",d,"</div>","</div>"].join("\n"));g.bind("hidden",function(){g.remove()}),g.bind("hide",function(){}),g.bind("shown",function(){$("a.primary",g).focus()}),$("a",g).click(function(a){a.preventDefault(),g.modal("hide");var c=$(this).data("handler"),d=b[c].callback;typeof d=="function"&&d()}),g.modal({backdrop:"static",show:!0}),$("body").append(g)},a}();loadScript("/js/deps/bootstrap-modal.1.3.0.js");var ga=function(){var a={};return a.init=function(){console.log("game init"),b={"game:prepare":function(a){console.log("preparing game"),h.prepare(a)},"game:start":function(){console.log("starting game..."),h.start(d),g()},"game:weapon:fire":function(a){h.actuallyFireWeapon(a)},"game:weapon:fire:wait":function(a){h.reloadPlayerWeaponIn(a)},"game:powerup:spawn":function(a){h.actuallySpawnPowerup(a)},"game:powerup:claim":function(a){h.actuallyClaimPowerup(a)},"game:weapon:change":function(a){h.changePlayerWeapon(a)},"game:bullet:die":function(a){},"game:player:kill":function(a){h.actuallyKillPlayer(a)},"game:player:respawn":function(a){h.actuallyRespawnPlayer(a)},"game:player:chat":function(a){h.showChatMessage(a)},"game:timeup:rejected":function(a){h.delayTimeup(a)},"game:win":function(a){h.handleWin(a)},"game:lose":function(a){h.handleLose(a)},"game:cancel":function(a){h.cancelGame(a)},"game:suddendeath":function(){h.setSuddenDeath()}},$("#game #volume").click(function(a){a.preventDefault(),f.toggleSounds()}),h.calculateLatencyAndOffset(function(){d.emit("game:ready")})},a}();var ia=function(){var a={};return a.init=function(){console.log("intro init"),$("a.proceed").click(function(a){a.preventDefault(),d.emit("welcome:intro:done")})},a}();var la=function(){var a={};return a.init=function(){console.log("lobby init"),b={"lobby:users":function(a){k.init(a)},"lobby:user:join":function(a){k.addUser(a)},"user:leave":function(a){k.removeUser(a)},"lobby:game:start":function(a){k.addGame(a)},"lobby:game:end":function(a){k.removeGame(a)},"lobby:challenge:receive":function(a){k.receiveChallenge(a)},"lobby:challenge:response":function(a){k.challengeResponse(a)},"lobby:challenge:blocked":function(){k.challengeBlocked()},"lobby:challenge:cancel":function(){k.cancelChallenge()},"lobby:challenge:cancel:invalid":function(){k.couldNotCancelChallenge()},"lobby:challenge:confirm":function(a){k.confirmChallenge(a)},"lobby:game:scorechange":function(a){k.updateGameScore(a)},"lobby:chat":function(a){k.addChatLine(a)},"lobby:user:idle":function(a){k.markIdle(a)},"lobby:user:active":function(a){k.markActive(a)}},d.emit("lobby:ready")},a}();var ra=function(){var a={},b={email:"",username:"",password:""};return a.init=function(){console.log("register init"),$("#register form input").bind("change keyup",function(a){var c=$.trim($(this).val());b[$(this).attr("name")]=c;var d=!0;for(var e in b)if(!b[e].length){d=!1;break}d&&($("#register form input").unbind(),$("#register p.alert-message").fadeIn())}),$("#register form").submit(function(a){a.preventDefault(),d.emit("welcome:register:done",$(this).serialize())})},a}();var wa=function(){return self={},self.init=function(){console.log("welcome init"),$("#login form").submit(function(a){a.preventDefault(),Client.iOS()&&(f.playSound("weapon:fire"),f.pauseSound("weapon:fire")),d.emit("welcome:login",$(this).serialize())}),$("#login a.register").click(function(a){a.preventDefault(),d.emit("welcome:register")}),b={"welcome:count":function(a){var b=a.users,c=b!=1?"are":"is",d=b!=1?"users":"user",e=a.games,f=e!=1?"games":"game";$("#login form").after("<p>There "+c+" <strong>"+b+"</strong> active "+d+" and <strong>"+e+"</strong> "+f+" in progress right now.</p>")}},d.emit("welcome:ready")},self}()