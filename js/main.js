/*
 * Main entry point to the game. Initializes the game and shows
 * the initial splash screen.
 * 
 * Contains main loop that uses JavaScript's requestAnimationFrame
 * method. Also contains all draw* methods that paint buttons and game
 * entities to the screen.
 * 
 * @author Martin Hentschel, @hemasail
 */

var currentScreen = null;

function createGame() {
    // DOM elements
    var canvas = document.getElementById("c");
    var context = canvas.getContext("2d");
    resizeCanvas(canvas);

    // movable bodies
    var state = new State();
    state.init();

    // return object that contains all information
    return {
        canvas: canvas,
        context: context,
        state: state,
        isRunning: false,
        lastRunTimeStr: 0,
        roundScore: 0,
        score: 0,
        multiplier: 1,
        highScore: 0
    };
}

/*
 * Main loop. Initializes examples, advances physics, and updates graphics.
 */
window.onload = function () {
    // initialize game
    var game = createGame();
    currentScreen = new SplashScreen(game);

    // add listeners
    window.addEventListener("resize", function (e) {
        resizeCanvasInGame(game);
    });
    game.canvas.addEventListener("click", function (e) {
        currentScreen = currentScreen.onClick(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("mousedown", function (e) {
        currentScreen.onMouseDown(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("touchstart", function (e) {
        var t = e.touches[0];
        currentScreen.onMouseDown(toClickVector(game, t));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("mouseup", function (e) {
        currentScreen.onMouseUp(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("touchend", function (e) {
        var t = e.touches[0];
        currentScreen.onMouseUp(toClickVector(game, t));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    }); 
    game.canvas.addEventListener("mousemove", function (e) {
        currentScreen.onMouseMove(toClickVector(game, e));
    });
    game.canvas.addEventListener("touchmove", function (e) {
        e.preventDefault();
        var t = e.touches[0];
        currentScreen.onMouseMove(toClickVector(game, t));
    }); 

    // splash screen
    currentScreen.draw();
}

function runGame(game) {
    game.isRunning = true;

    // fixed timestep to advance physics
    var fixedTimestep = 10; // in ms
    
    // step function is called every time the browser refreshes the UI
    var start = 0;
    var previous = 0;
    var remainder = 0;
    function step(now) {
        if (start === 0) start = now;
        if (previous === 0) previous = now;
        var timestep = now - previous + remainder;

        // move physics forward in fixed intervals
        while (timestep > fixedTimestep) {
            // advance state of all examples
            game.state.advance(fixedTimestep / 1000);
            timestep -= fixedTimestep;
        }
        previous = now;
        remainder = timestep;

        // draw game
        drawGame(game, true, false);

        // end game if chicken hits bottom edge
        if (game.state.chicken.origin.y < -0.5)
        {
            endGame(game);
        }

        // request next animation frame from browser
        if (game.isRunning) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

function endGame(game) {
    game.isRunning = false;
    if (Number(game.state.runTimeStr) > Number(game.lastRunTimeStr)) {
        game.roundScore = Math.round(10 * game.multiplier * game.state.runTimeStr);
        game.score += game.roundScore;
        var win = game.score > WIN_SCORE;
        if (win) {
            var beatHighscore = game.score > game.highScore;
            if (beatHighscore) {
                game.highScore = game.score;
            }
            currentScreen = new GameOverScreen(game, beatHighscore, win);
        }
        else {
            currentScreen = new EndOfRoundScreen(game);
        }
    }
    else {
        var beatHighscore = game.score > game.highScore;
        if (beatHighscore) {
            game.highScore = game.score;
        }
        currentScreen = new GameOverScreen(game, beatHighscore, win);
    }
    currentScreen.draw();
}

function drawGame(game, includeBodiesAndText, lightColors) {
    // clear whole canvas
    game.context.resetTransform();
    game.context.fillStyle = OUTSIDE_BACKGROUND;
    game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);

    setDrawTransform(game);

    // clear game area
    game.context.fillStyle = BACKGROUND;
    game.context.fillRect(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
    var colors = (lightColors) ? LIGHT_COLORS : COLORS;

    if (includeBodiesAndText) {
        // draw bodies
        drawLine(game, game.state.landingPoint, game.state.handle, colors);
        game.state.bugs.forEach(function(bug) {
            drawBug(game, bug, colors);
        });

        // draw text
        drawTextAlign(game, "score " + game.score, -0.48, 0.445, 0.05,
                        FONT_ALIGN_LEFT);
        drawTextAlign(game, "high score " + game.highScore, -0.48, 0.405, 0.03,
                        FONT_ALIGN_LEFT);
        drawTextAlign(game, "beat " + game.lastRunTimeStr + "s", 0.48, 0.445, 0.05,
                        FONT_ALIGN_RIGHT);
        drawTextAlign(game, "multiplier " + game.multiplier + "x", 0.48, 0.405, 0.03,
                        FONT_ALIGN_RIGHT);
        drawText(game, game.state.runTimeStr + "s", 0, 0.26, 0.1);

        // draw chicken above text
        drawChicken(game, game.state.chicken, colors);
    }

    // draw out of bounds
    game.context.fillStyle = OUTSIDE_BACKGROUND;
    game.context.fillRect(-1, -CANVAS_HEIGHT/2, 2, -1);
    game.context.fillRect(-1, CANVAS_HEIGHT/2, 2, 1);
    game.context.fillRect(-CANVAS_WIDTH/2, -1, -1, 2);
    game.context.fillRect(CANVAS_WIDTH/2, -1, 1, 2);
}

function drawLine(game, landing, handle, colors) {
    var context = game.context;
    var origin = new Vector(0, 0);

    // origin radius and handle radius
    var or = 0.01;
    var hr = 0.1;

    // left landing and right landing
    var LL = new Vector(landing.cx[1], landing.cy[1]);
    var RL = new Vector(landing.cx[0], landing.cy[0]);

    // compute tangent between left landing and left origin
    var LO2LL = new Vector(origin.x, origin.y).subtract(LL);
    var lo2Len = LO2LL.length();
    var lo2Ang = Math.asin(or / lo2Len);
    LO2LL.normalize().rotate(lo2Ang)
        .scale(Math.sqrt(lo2Len * lo2Len - or * or)).add(LL);

    // compute tangent between right landing and right origin
    var RO2RL = new Vector(origin.x, origin.y).subtract(RL);
    var ro2Len = RO2RL.length();
    var ro2Ang = Math.asin(or / ro2Len);
    RO2RL.normalize().rotate(-ro2Ang)
        .scale(Math.sqrt(ro2Len * ro2Len - or * or)).add(RL);

    // compute tangent between left landing and left handle
    var LH2LL = new Vector(handle.x, handle.y).subtract(LL);
    var lh2Len = LH2LL.length();
    var lh2Ang = Math.asin(hr / lh2Len);
    LH2LL.normalize().rotate(-lh2Ang)
        .scale(Math.sqrt(lh2Len * lh2Len - hr * hr)).add(LL);

    // compute tangent between right landing and right handle
    var RH2RL = new Vector(handle.x, handle.y).subtract(RL);
    var rh2Len = RH2RL.length();
    var rh2Ang = Math.asin(hr / rh2Len);
    RH2RL.normalize().rotate(rh2Ang)
        .scale(Math.sqrt(rh2Len * rh2Len - hr * hr)).add(RL);

    // compute tangent between left landing and left handle
    var LL = new Vector(landing.cx[1], landing.cy[1]);
    var LH2LL = new Vector(handle.x, handle.y).subtract(LL);
    var lh2Len = LH2LL.length();
    var lh2Ang = Math.asin(hr / lh2Len);
    LH2LL.normalize().rotate(-lh2Ang)
        .scale(Math.sqrt(lh2Len * lh2Len - hr * hr)).add(LL);

    // compute tangent between right landing and right handle
    var RL = new Vector(landing.cx[0], landing.cy[0]);
    var RH2RL = new Vector(handle.x, handle.y).subtract(RL);
    var rh2Len = RH2RL.length();
    var rh2Ang = Math.asin(hr / rh2Len);
    RH2RL.normalize().rotate(rh2Ang)
        .scale(Math.sqrt(rh2Len * rh2Len - hr * hr)).add(RL);

    // sort by x
    if (RH2RL.x < LH2LL.x)
    {
        var tmp = RH2RL;
        RH2RL = LH2LL;
        LH2LL = tmp;
    }
    if (RO2RL.x < LO2LL.x)
    {
        var tmp = RO2RL;
        RO2RL = LO2LL;
        LO2LL = tmp;
    }

    // draw origin
    context.fillStyle = CHICKEN_WHITE;
    context.beginPath();
    context.arc(origin.x, origin.y, or, 0, 2 * Math.PI, false);
    context.fill();

    // draw 1st line: from origin to landing and back
    context.fillStyle = CHICKEN_WHITE; // colors[2];
    context.beginPath();
    context.moveTo(LO2LL.x, LO2LL.y);
    context.lineTo(landing.cx[1], landing.cy[1]);
    context.lineTo(landing.cx[0], landing.cy[0]);
    context.lineTo(RO2RL.x, RO2RL.y);
    context.closePath();
    context.fill();

    // draw 2nd line: from landing to handle and back
    context.fillStyle = LIGHT_COLORS[7];
    context.beginPath();
    context.moveTo(landing.cx[1], landing.cy[1]);
    context.lineTo(LH2LL.x, LH2LL.y);
    context.lineTo(RH2RL.x, RH2RL.y);
    context.lineTo(landing.cx[0], landing.cy[0]);
    context.closePath();
    context.fill();

    // draw handle
    context.fillStyle = CHICKEN_WHITE;
    context.beginPath();
    context.arc(handle.x, handle.y, hr, 0, 2 * Math.PI, false);
    context.fill();
}

function drawBug(game, body, colors) {
    var context = game.context;

    // full body
    context.fillStyle = colors[2];
    context.beginPath();
    context.moveTo(body.cx[0], body.cy[0]);
    context.lineTo(body.cx[1], body.cy[1]);
    context.lineTo(body.cx[2], body.cy[2]);
    context.lineTo(body.cx[3], body.cy[3]);
    context.closePath();
    context.fill();

    // half body
    var p1x = body.cx[0] + (body.cx[1] - body.cx[0]) * 0.5;
    var p1y = body.cy[0] + (body.cy[1] - body.cy[0]) * 0.5;
    var p3x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p3y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;
    context.fillStyle = colors[1];
    context.beginPath();
    context.moveTo(p1x, p1y);
    context.lineTo(body.cx[1], body.cy[1]);
    context.lineTo(body.cx[2], body.cy[2]);
    context.lineTo(p3x, p3y);
    context.closePath();
    context.fill();

    // face
    var diffx = (p1x - body.origin.x) * 0.7;
    var diffy = (p1y - body.origin.y) * 0.7;
    var verx = body.origin.x + diffx;
    var very = body.origin.y + diffy;
    var p2x = body.cx[1] + (body.cx[2] - body.cx[1]) * 0.5;
    var p2y = body.cy[1] + (body.cy[2] - body.cy[1]) * 0.5;
    var p4x = body.cx[3] + (body.cx[0] - body.cx[3]) * 0.5;
    var p4y = body.cy[3] + (body.cy[0] - body.cy[3]) * 0.5;
    context.fillStyle = colors[3];
    context.beginPath();
    context.moveTo(body.cx[0], body.cy[0]);
    context.lineTo(p4x + diffx, p4y + diffy);
    context.lineTo(p2x + diffx, p2y + diffy);
    context.lineTo(body.cx[1], body.cy[1]);
    context.closePath();
    context.fill();
    context.beginPath();
    context.arc(verx, very, body.dimension.x/2, body.angle-Math.PI, body.angle, false);
    context.fill();

    // eyes
    var elx = body.origin.x + (body.cx[1] - body.origin.x) * 0.5;
    var ely = body.origin.y + (body.cy[1] - body.origin.y) * 0.5;
    var erx = body.origin.x + (body.cx[0] - body.origin.x) * 0.5;
    var ery = body.origin.y + (body.cy[0] - body.origin.y) * 0.5;
    var elx2 = elx + (erx - elx) * 0.14;
    var ely2 = ely + (ery - ely) * 0.14;
    var erx2 = erx + (elx - erx) * 0.14;
    var ery2 = ery + (ely - ery) * 0.14;
    drawEyeWhite(game, body, elx2, ely2, body.dimension.x * 0.22);
    drawEyeWhite(game, body, erx2, ery2, body.dimension.x * 0.22);
    drawEyeRest(game, body, elx2, ely2, body.dimension.x * 0.22);
    drawEyeRest(game, body, erx2, ery2, body.dimension.x * 0.22);
}

function drawChicken(game, body, colors) {
    var context = game.context;

    // light full body
    context.fillStyle = colors[6];
    context.beginPath();
    context.moveTo(body.cx[0], body.cy[0]);
    context.lineTo(body.cx[1], body.cy[1]);
    context.lineTo(body.cx[2], body.cy[2]);
    context.lineTo(body.cx[3], body.cy[3]);
    context.closePath();
    context.fill();

    // p1 is half way between upper right and lower right
    var p1x = body.cx[0] + (body.cx[3] - body.cx[0]) * 0.5;
    var p1y = body.cy[0] + (body.cy[3] - body.cy[0]) * 0.5;
    // p2 is half way between upper left and lower left
    var p2x = body.cx[1] + (body.cx[2] - body.cx[1]) * 0.5;
    var p2y = body.cy[1] + (body.cy[2] - body.cy[1]) * 0.5;
    // p3 is half way between lower left and lower right
    var p3x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p3y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;

    // pecker
    context.fillStyle = colors[5];
    context.beginPath();
    context.moveTo(p1x, p1y);
    context.lineTo(p2x, p2y);
    context.lineTo(p3x, p3y);
    context.closePath();
    context.fill();

    context.fillStyle = colors[8];
    context.beginPath();
    context.moveTo(p1x, p1y);
    context.lineTo(body.origin.x, body.origin.y);
    context.lineTo(p3x, p3y);
    context.closePath();
    context.fill();

    // p4 is half way between upper left and upper right
    var p4x = body.cx[0] + (body.cx[1] - body.cx[0]) * 0.5;
    var p4y = body.cy[0] + (body.cy[1] - body.cy[0]) * 0.5;
    // p5 is top of the tip, outside of body
    var p5x = body.origin.x + (p4x - body.origin.x) * 1.4;
    var p5y = body.origin.y + (p4y - body.origin.y) * 1.4;
    
    // "hat"
    context.fillStyle = colors[1];
    context.beginPath();
    context.moveTo(body.cx[0], body.cy[0]);
    context.lineTo(body.cx[1], body.cy[1]);
    context.lineTo(p5x, p5y);
    context.closePath();
    context.fill();

    // eyes
    var elx = body.origin.x + (body.cx[1] - body.origin.x) * 0.5;
    var ely = body.origin.y + (body.cy[1] - body.origin.y) * 0.5;
    var erx = body.origin.x + (body.cx[0] - body.origin.x) * 0.5;
    var ery = body.origin.y + (body.cy[0] - body.origin.y) * 0.5;
    var elx2 = elx + (erx - elx) * 0.14;
    var ely2 = ely + (ery - ely) * 0.14;
    var erx2 = erx + (elx - erx) * 0.14;
    var ery2 = ery + (ely - ery) * 0.14;
    drawEyeWhite(game, body, elx2, ely2, body.dimension.x * 0.2);
    drawEyeWhite(game, body, erx2, ery2, body.dimension.x * 0.2);
    drawEyeRest(game, body, elx2, ely2, body.dimension.x * 0.2);
    drawEyeRest(game, body, erx2, ery2, body.dimension.x * 0.2);
}

function drawEyeWhite(game, body, x, y, radius) {
    var context = game.context;
    var whiteRadius = radius;

    context.fillStyle = CHICKEN_WHITE;
    context.beginPath();
    context.arc(x, y, whiteRadius, 0, 2 * Math.PI, false);
    context.fill();
} 

function drawEyeRest(game, body, x, y, radius) {
    var context = game.context;
    var whiteRadius = radius;

    // p4 is half way between lower left and lower right
    var p4x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p4y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;

    context.fillStyle = FONT_COLOR;
    var darkRadius = 0.6 * whiteRadius;

    // dir is direction in which eyes are looking
    // - if target defined: look to target
    // - if target not define: default
    var dir = new Vector(body.eyesDir.x, body.eyesDir.y);
    dir.normalize().scale(radius * 0.2);
    x += dir.x;
    y += dir.y;
    context.beginPath();
    context.arc(x, y, darkRadius, 0, 2 * Math.PI, false);
    context.fill();
    
    context.fillStyle = CHICKEN_WHITE;
    var glowRadius = 0.2 * whiteRadius;
    x += radius * 0.2;
    y += radius * 0.2;
    context.beginPath();
    context.arc(x, y, glowRadius, 0, 2 * Math.PI, false);
    context.fill();
} 

function drawButton(game, button) {
    var ulx = button.origin.x - button.dimension.x / 2;
    var uly = button.origin.y + button.dimension.y / 2;
    var offset = 0.02;
    var diff = (button.isDown) ? offset : 0;

    // fill, lighter color
    game.context.fillStyle = COLORS[8];
    game.context.beginPath();
    game.context.moveTo(ulx, uly);
    game.context.lineTo(ulx + button.dimension.x, uly);
    game.context.lineTo(ulx + button.dimension.x, uly - button.dimension.y);
    game.context.lineTo(ulx, uly - button.dimension.y);
    game.context.closePath();
    game.context.fill();

    // fill, darker color
    ulx += diff;
    uly -= diff;
    game.context.fillStyle = COLORS[9];
    game.context.beginPath();
    game.context.moveTo(ulx, uly);
    game.context.lineTo(ulx + button.dimension.x - offset, uly);
    game.context.lineTo(ulx + button.dimension.x - offset, uly - button.dimension.y);
    game.context.lineTo(ulx, uly - button.dimension.y);
    game.context.closePath();
    game.context.fill();

    // text
    drawTextAlign_c(game,
                  button.text,
                  button.origin.x + diff,
                  button.origin.y - (button.dimension.y * 0.22) - diff,
                  button.dimension.y * 0.67,
                  FONT_ALIGN_CENTER,
                  CHICKEN_WHITE);
}

function drawText(game, text, x, y, size) {
    drawTextAlign(game, text, x, y, size, FONT_ALIGN_CENTER);
}

function drawTextAlign(game, text, x, y, size, align) {
    drawTextAlign_c(game, text, x, y, size, align, FONT_COLOR);
}

function drawTextAlign_c(game, text, x, y, size, align, color) {
    game.context.setTransform(CANVAS_WIDTH / 1.1, 0, 0, CANVAS_HEIGHT,
        game.canvas.width / 2, game.canvas.height / 2);

    var textHeight = TRANSFORM_Y * size;
    game.context.fillStyle = color;
    game.context.font = textHeight + FONT;
    game.context.textAlign = align;
    game.context.fillText(text,
        x * TRANSFORM_Y * 1.1,
        -y * TRANSFORM_Y);

    setDrawTransform(game);
}

function setDrawTransform(game) {
    game.context.setTransform(
        TRANSFORM_X, 0, 0, -TRANSFORM_Y,
        game.canvas.width / 2, game.canvas.height / 2);
}

/*
 * Translates physical coord on canvas into logical coord in game.
 */
function x(game, tx) {
    var x = (tx - game.canvas.width / 2) / TRANSFORM_X;
    return x;
}
function y(game, ty) {
    var y = -(ty - game.canvas.height / 2) / TRANSFORM_Y;
    return y;
}
function toClickVector(game, e) {
    var clientRect = game.canvas.getBoundingClientRect();
    var clickX = x(game, e.clientX - clientRect.left);
    var clickY = y(game, e.clientY - clientRect.top);
    return new Vector(clickX, clickY);
}

/*
 * Resizes all canvases to fit screen width in case browser window is thinner than canvasWidth.
 */
function resizeCanvas(canvas) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (canvas.width !== w) {
        canvas.width = w;
        canvas.height = h;
    }
    if (canvas.width > canvas.height) {
        TRANSFORM_X = canvas.height / CANVAS_HEIGHT * CANVAS_WIDTH;
        TRANSFORM_Y = canvas.height;
    }
    else {
        TRANSFORM_X = canvas.width;
        TRANSFORM_Y = canvas.width / CANVAS_WIDTH * CANVAS_HEIGHT;
    }
}

function resizeCanvasInGame(game) {
    resizeCanvas(game.canvas);
    if (!game.isRunning) {
        currentScreen.draw();
    }
}