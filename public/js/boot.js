// requestAnimFrame / cancelRequestanimFrame shims: http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function(/* function */ callback, /* DOMElement */ element){
            return window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame     ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
} )();

function loadScript(src, async) {
    if (async == null) {
        async = false;
    }
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.src = src;
    if (async) {
        script.async = async;
    }
    $("body").append(script);
}

function tweetButton(opts) {
    var text = opts.text ? opts.text : "";
    var count = opts.count ? opts.count : "";
    return '<iframe allowtransparency="true" frameborder="0" scrolling="no" '+
    'src="//platform.twitter.com/widgets/tweet_button.html?'+
    'text='+encodeURIComponent(text)+'&'+
    'count='+encodeURIComponent(count)+'" '+
    'style="width:130px; height:20px;"></iframe>';
}

loadScript("https://apis.google.com/js/plusone.js", true);
