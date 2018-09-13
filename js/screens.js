/*
 * Screens are separate state's in the game's state machine.
 * 
 * When the game first loads, a splash screen is shown. From there,
 * the play goes to the "get ready" screen and then on the to the
 * game screen where the actual game play happens. Finally, there is
 * a "end of round" screen.
 * 
 * @author Martin Hentschel, @hemasail
 */

function SplashScreen(game) {
    this.game = game;
    this.startButton = new Button(this.game, "Start");
    this.startButton.origin.y = -0.25;
}

SplashScreen.prototype.draw = function() {
    var chicken = new Body(this)
        .setOrigin(-0.3, 0.15)
        .setDimension(0.2, 0.2)
        .setAngle(Math.random() * 0.6 - 0.3)
        .finalize();

    drawGame(this.game, false, false);
    drawChicken(this.game, chicken, COLORS);
    drawTextAlign(this.game, "Chicken",   -0.14, 0.16, 0.13,  FONT_ALIGN_LEFT);
    drawTextAlign(this.game, "On A Line", -0.14, 0.05, 0.13, FONT_ALIGN_LEFT);
    drawText(this.game, "swipe to balance, click to jump, " + WIN_SCORE + " points to win", 0, -0.14, 0.035);
    drawButton(this.game, this.startButton);
};

SplashScreen.prototype.onClick = function(click) {
    if (this.startButton.clicked(click))
    {
        runGame(this.game);
        return new GamePlayScreen(this.game);
    }
    return this;
};

SplashScreen.prototype.onMouseDown = function(click) {
    this.startButton.down(click);
};

SplashScreen.prototype.onMouseUp = function(click) {
    this.startButton.up(click);
};

SplashScreen.prototype.onMouseMove = function(click) {
    // do nothing
};


function GamePlayScreen(game) {
    this.game = game;
    this.before = 0;
}

GamePlayScreen.prototype.draw = function() {
    drawGame(this.game, true, false);
};

GamePlayScreen.prototype.onClick = function(click) {
    return this;
};

GamePlayScreen.prototype.onMouseMove = function(click) {
    if (click.y > -0.25) {
        click.y = -0.25;
    }
    this.game.state.handle.set(click);
    return this;
};

GamePlayScreen.prototype.onMouseDown = function(click) {
    this.before = Date.now();
};

GamePlayScreen.prototype.onMouseUp = function(click) {
    var secs = (Date.now() - this.before) / 1000;
    this.game.state.jump(secs);
};


function EndOfRoundScreen(game) {
    this.dy = 0.15;
    this.game = game;
    this.newMultiplier = this.game.multiplier + 1;
    this.resetButton = new Button(this.game, "1x Reset");
    this.resetButton.origin.x = -0.22;
    this.resetButton.origin.y = -0.25;
    this.riskButton = new Button(this.game, this.newMultiplier + "x Risk");
    this.riskButton.origin.x = 0.22;
    this.riskButton.origin.y = -0.25;
}

EndOfRoundScreen.prototype.draw = function() {
    drawGame(this.game, true, true);
    drawText(this.game, "Good Round", 0, this.dy - 0.08, 0.14);
    drawText(this.game, "round's score " + this.game.roundScore,
             0, this.dy - 0.15, 0.05);
    drawButton(this.game, this.resetButton);
    drawButton(this.game, this.riskButton);
    drawText(
        this.game,
        "Beat " + this.game.state.runTimeStr + "s or game over",
        0.22, -0.34, 0.03);
};

EndOfRoundScreen.prototype.onClick = function(click) {
    if (this.resetButton.clicked(click)) {
        this.game.multiplier = 1;
        this.game.lastRunTimeStr = '0.0';
        return restartGame(this.game);
    }
    if (this.riskButton.clicked(click)) {
        this.game.multiplier = this.game.multiplier + 1;
        this.game.lastRunTimeStr = this.game.state.runTimeStr;
        return restartGame(this.game);
    }
    return this;
};

EndOfRoundScreen.prototype.onMouseDown = function(click) {
    this.resetButton.down(click);
    this.riskButton.down(click);
};

EndOfRoundScreen.prototype.onMouseUp = function(click) {
    this.resetButton.up(click);
    this.riskButton.up(click);
};

EndOfRoundScreen.prototype.onMouseMove = function(click) {
    // do nothing
};


function GameOverScreen(game, beatHighscore, win) {
    this.dy = 0.15;
    this.game = game;
    this.headline = (win) ? "Chicken Dinner!" : "Game Over";
    this.subline = (beatHighscore) ? "new highscore " : "final score ";
    this.startButton = new Button(this.game, "Start");
    this.startButton.origin.y = -0.25;
}

GameOverScreen.prototype.draw = function() {
    drawGame(this.game, true, true);
    drawText(this.game, this.headline, 0, this.dy - 0.08, 0.14);
    drawText(this.game, this.subline + this.game.score,
             0, this.dy - 0.15, 0.05);
    drawButton(this.game, this.startButton);
};

GameOverScreen.prototype.onClick = function(click) {
    if (this.startButton.clicked(click)) {
        this.game.lastRunTimeStr = '0.0';
        this.game.roundScore = 0;
        this.game.score = 0;
        this.game.multiplier = 1;
        return restartGame(this.game);
    }
    return this;
};

GameOverScreen.prototype.onMouseDown = function(click) {
    this.startButton.down(click);
};

GameOverScreen.prototype.onMouseUp = function(click) {
    this.startButton.up(click);
};

GameOverScreen.prototype.onMouseMove = function(click) {
    // do nothing
};

function restartGame(game) {
    var state = new State();
    state.init();
    game.state = state;
    runGame(game);
    return new GamePlayScreen(game);
}
