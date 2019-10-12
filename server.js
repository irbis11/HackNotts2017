var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');
var io = require('socket.io')(http);

app.use(express.static('.'));

server = http.listen(7777, function() {
    console.log('Listening on port 7777');
});

process.on('exit', function() {
    console.log('About to exit, waiting for remaining connections');
    server.close();
});

process.on('SIGTERM', function() {
    console.log('About to exit, waiting for remaining connections');
    server.close();
});

var state;
var screens = [];
var missileWidth = 310;
var missileHeight = 72;
var spaceshipWidth = 641;
var spaceshipHeight = 212;
var screenWidth = 5760;
var explosionWidth = 420;
var explosionHeight = 270;
var projectileWidth = 120;
var projectileHeight = 40;
var shotAtCircle = 0;
initializeGame();

var ws;
function initLeapMotion() {
    WebSocket = require('ws');
    // Create and open the socket
    ws = new WebSocket("ws://localhost:6437/v6.json");//use latest

    // On successful connection
    ws.onopen = function(event) {
        var enableMessage = JSON.stringify({enableGestures: true});
        ws.send(enableMessage); // Enable gestures
        ws.send(JSON.stringify({focused: true})); // claim focus

        startGame();
        setInterval(gameLoop, 5);
    };

    // On message received
    ws.onmessage = function(event) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);
        if(!obj.id) {

        } else {
            var data = JSON.parse(str);
            if (data.hands[0] !== undefined) {
                var palmHeight = data.hands[0].palmPosition[1];
                var palmHorizontal = data.hands[0].palmPosition[0];

                // Normalize vertical
                palmHeight -= 100;
                if (palmHeight < 0) {
                    palmHeight = 0;
                } else if (palmHeight > 300) {
                    palmHeight = 300;
                }
                palmHeight = 300 - palmHeight;
                // Normalize horizontal
                if (palmHorizontal < -200) {
                    palmHorizontal = -200;
                } else if (palmHorizontal > 200) {
                    palmHorizontal = 200;
                }
                palmHorizontal += 200;
                palmHorizontal *= 8;

                // Set spaceship position
                var maxHeight = 1080 - spaceshipHeight;
                state.spaceshipY = (maxHeight / 300) * palmHeight;
                state.spaceshipX = 2050 + palmHorizontal;
            }
            if (data.gestures.length > 0) {
                // console.log(data.gestures)
                //console.log("Gesture: " + data.gestures[0].type)
                if (data.gestures[0].type === "circle") {
                    var progress = Math.floor(data.gestures[0].progress);
                    if (shotAtCircle !== progress) {
                        shotAtCircle = progress;
                        spawnProjectile(state.spaceshipX, state.spaceshipY + 90);
                    }
                }
            }
        }
    };

    // On socket close
    ws.onclose = function(event) {
        ws = null;
        console.log("Leap Motion socket closed");
    };

    // On socket error
    ws.onerror = function(event) {
        console.log("Leap Motion socket error");
    };
}

function initLeapMotionRemote() {
    WebSocket = require('ws');
    // Create and open the socket
    ws = new WebSocket("ws://10.154.144.44:7778");//use latest

    // On successful connection
    ws.onopen = function(event) {
        console.log("Connected to LM server");
        startGame();
        setInterval(gameLoop, 5);
    };

    // On message received
    ws.onmessage = function(event) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);
        if(!obj.id) {

        } else {
            console.log("Got LM frame");
            var data = JSON.parse(str);
            if (data.hands[0] !== undefined) {
                var palmHeight = data.hands[0].palmPosition[1];
                var palmHorizontal = data.hands[0].palmPosition[0];

                // Normalize vertical
                palmHeight -= 100;
                if (palmHeight < 0) {
                    palmHeight = 0;
                } else if (palmHeight > 300) {
                    palmHeight = 300;
                }
                palmHeight = 300 - palmHeight;
                // Normalize horizontal
                if (palmHorizontal < -200) {
                    palmHorizontal = -200;
                } else if (palmHorizontal > 200) {
                    palmHorizontal = 200;
                }
                palmHorizontal += 200;
                palmHorizontal *= 8;

                // Set spaceship position
                var maxHeight = 1080 - spaceshipHeight;
                state.spaceshipY = (maxHeight / 300) * palmHeight;
                state.spaceshipX = 2050 + palmHorizontal;
            }
            if (data.gestures.length > 0) {
                // console.log(data.gestures)
                //console.log("Gesture: " + data.gestures[0].type)
                if (data.gestures[0].type === "circle") {
                    var progress = Math.floor(data.gestures[0].progress);
                    if (shotAtCircle !== progress) {
                        shotAtCircle = progress;
                        spawnProjectile(state.spaceshipX, state.spaceshipY + 90);
                    }
                }
            }
        }
    };

    // On socket close
    ws.onclose = function(event) {
        ws = null;
        console.log("Leap Motion socket closed");
    };

    // On socket error
    ws.onerror = function(event) {
        console.log("Leap Motion socket error: " + event);
    };
}

io.on('connection', function(socket) {
    screens.push(socket);
    console.log('Screen connected as screen #' + screens.length);

    socket.on('disconnect', function() {
        var screen = getScreenNumber(socket);
        if (screen > -1) {
            console.log('Screen ' + getScreenNumber(socket) + ' disconnected');
            screens = [];
        }
    });

});

function isColliding(x1, width1, y1, height1, x2, width2, y2, height2) {
    return !(x2 > (x1 + width1) ||
    (x2 + width2) < x1 ||
    y2 > (y1 + height1) ||
    (y2 + height2) < y1);
}

function getScreenNumber(socket) {
    for (var i = 0; i < screens.length; i++) {
        if (screens[i] === socket) {
            return i + 1
        }
    }
    return -1
}

function initializeGame() {
    initLeapMotion();
}

function startGame() {
    state = Object();
    state.missiles = [];
    state.explosions = [];
    state.projectiles = [];
    state.collided = false;
    state.score = 0;
    state.lives = 5;
}

function spawnMissile() {
    var missile = {};
    missile.y = getRandom(1, 980);
    missile.x = -missileWidth;
    missile.speed = 10 / getRandom(1, 10);
    missile.sprite = getRandomInt(1, 2);
    state.missiles.push(missile);
}

function spawnExplosion(x, y) {
    var explosion = {};
    explosion.x = x;
    explosion.y = y;
    explosion.eol = (new Date()).getTime() + 6000;
    state.explosions.push(explosion);
}

function spawnProjectile(x, y) {
    var projectile = {};
    projectile.x = x;
    projectile.y = y;
    projectile.speedX = -5;
    state.projectiles.push(projectile);
}

function gameLoop() {

    if (ws !== null) {
        ws.send(JSON.stringify({focused: true})); // claim focus
    }

    //state.score++;

    var missileChance = getRandom(1, 100000);
    if (missileChance < (500 * (1 * ((state.score + 100000) / 100000)))) {
        spawnMissile();
    }

    // Move missiles
    for (var i = 0; i < state.missiles.length; i++) {
       state.missiles[i].x += state.missiles[i].speed;
    }

    // Move projectiles
    for (var i = 0; i < state.projectiles.length; i++) {
        state.projectiles[i].x += state.projectiles[i].speedX;
    }

    // Delete off-screen/exploded missiles
    var kept = [];
    for (var i = 0; i < state.missiles.length; i++) {
        if (state.missiles[i].x <= screenWidth && state.missiles[i].exploded !== true) {
            kept.push(state.missiles[i]);
        }
    }
    state.missiles = kept;

    // Delete off-screen/exploded projectiles
    var kept = [];
    for (var i = 0; i < state.projectiles.length; i++) {
        if (state.projectiles[i].x >= 0 && state.projectiles[i].exploded !== true) {
            kept.push(state.projectiles[i]);
        }
    }
    state.projectiles = kept;

    // Delete expired explosions
    var kept = [];
    for (var i = 0; i < state.explosions.length; i++) {
        if (state.explosions[i].eol > (new Date().getTime())) {
            kept.push(state.explosions[i]);
        }
    }
    state.explosions = kept;

    // Collision detection
    state.collided = false;
    for (var i = 0; i < state.missiles.length; i++) {
        var missile = state.missiles[i];
        if (isColliding(state.spaceshipX, spaceshipWidth, state.spaceshipY, spaceshipHeight,
                        missile.x, missileWidth, missile.y, missileHeight)) {
            if (missile.exploded !== true) {
                state.collided = true;
                missile.exploded = true;
                spawnExplosion(missile.x + missileWidth, missile.y - missileHeight);

                state.lives--;
                console.log("Hit by missile");

                if (state.lives <= 0) {
                    state.gameover = true;
                    console.log("Game over");
                    setTimeout(function () {
                        state.lives = 5;
                        state.gameover = false;
                        state.score = 0;
                    }, 3000);
                }
            }
        }
    }

    // Projectile collision detection
    for (var i = 0; i < state.projectiles.length; i++) {
        var projectile = state.projectiles[i];
        for (var j = 0; j < state.missiles.length; j++) {
            var missile = state.missiles[j];
            if (isColliding(projectile.x, projectileWidth, projectile.y, projectileHeight, missile.x, missileWidth, missile.y, missileHeight)) {
                missile.exploded = true;
                projectile.exploded = true;
                state.score += 1000;
                spawnExplosion(missile.x + missileWidth, missile.y - missileHeight);
                console.log("Missile shot down");
            }
        }
    }

    // Send the game state
    screens.forEach(function(screen) {
        state.screenNum = getScreenNumber(screen);
        screen.emit("STATE", state);
    });
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
