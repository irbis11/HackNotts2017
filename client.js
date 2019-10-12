var socket;

function pageLoad() {

    socket = io();
    var counter = 0;

    socket.on('STATE', function(state) {

        if (typeof state !== 'undefined') {
            var screenNum = state.screenNum;
            var offset = (3 - screenNum) * 1920;
            $('#screenNum').html("#" + screenNum);

            $('#screenNum').css('left', offset);

            if (typeof can !== "undefined") {
                can.position(offset,0);
            }

            $('body').scrollLeft(offset);
            // console.log(state);
            $('#spaceship').css('top', state.spaceshipY + 'px');
            $('#spaceship').css('left', state.spaceshipX + 'px');
            $('#missiles').empty();
            for (var i = 0; i < state.missiles.length; i++) {
                var missile = state.missiles[i];
                $('#missiles').append("<div style='top: " + missile.y + "px; left: " + missile.x + "px;' class='m" + missile.sprite + "'></div>");
            }
            $('#projectiles').empty();
            for (var i = 0; i < state.projectiles.length; i++) {
                var projectile = state.projectiles[i];
                $('#projectiles').append("<div style='top: " + projectile.y + "px; left: " + projectile.x + "px'></div>");
            }
            for (var i = 0; i < state.explosions.length; i++) {
                var explosion = state.explosions[i];
                if ($('#explosion' + explosion.eol).length === 0) {
                    $('#explosions').append('<div id="explosion' + explosion.eol + '" style="top: ' + explosion.y + 'px; left: ' + explosion.x + 'px; background: url(explosion.gif?' + explosion.eol + '); background-size: cover"></div>')
                    if ($('#explosions').children().length > 10) {
                        $('#explosions').children().first().remove();
                    }
                }
            }
            gameover = state.gameover;

            score.update(state.score);
            life.cur = state.lives;
        }

    });

    console.log("Client initialized");
}

document.addEventListener('DOMContentLoaded', pageLoad);
