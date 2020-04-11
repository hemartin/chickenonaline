import { BodyWithEyes } from './bodywitheyes.js'
import { Button } from './button.js'
import * as Constants from './constants.js'
import { GameState } from './gamestate.js'

/**
 * When the game first loads, a splash screen is shown. From there,
 * it goes into the "get ready" screen and then on the to the
 * game screen where the actual game play happens. Finally, there is
 * a "end of round" screen.
 *
 * @author Martin Hentschel
 */
class Screen {
  constructor (session) {
    this.session = session
  }

  draw () {
    // override
  }

  onClick (click) {
    // override if necessary
    return this
  }

  onMouseDown (click) {
    // override if necessary
  }

  onMouseUp (click) {
    // override if necessary
  }

  onMouseMove (click) {
    // override if necessary
  }

  restartGame () {
    this.session.gameState = new GameState()
    this.session.runGame()
    return new GamePlayScreen(this.session)
  }
}

export class SplashScreen extends Screen {
  constructor (session) {
    super(session)
    this.startButton = new Button('Start')
    this.startButton.origin.y = -0.25
  }

  draw () {
    const chicken = new BodyWithEyes(this)
      .setOrigin(-0.3, 0.15)
      .setDimension(0.2, 0.2)
      .setAngle(Math.random() * 0.6 - 0.3)
      .finalize()

    this.session.graphics.drawGame(this.session, false, false)
    this.session.graphics.drawChicken(chicken, Constants.COLORS)
    this.session.graphics.drawTextAlign(
      'Chicken',
      -0.14,
      0.16,
      0.13,
      Constants.FONT_ALIGN_LEFT
    )
    this.session.graphics.drawTextAlign(
      'On A Line',
      -0.14,
      0.05,
      0.13,
      Constants.FONT_ALIGN_LEFT
    )
    this.session.graphics.drawText(
      'swipe to balance, click to jump, ' +
        Constants.WIN_SCORE +
        ' points to win',
      0,
      -0.14,
      0.035
    )
    this.session.graphics.drawButton(this.startButton)
  }

  onClick (click) {
    if (this.startButton.clicked(click)) {
      this.session.runGame(this.session)
      return new GamePlayScreen(this.session)
    }
    return this
  }

  onMouseDown (click) {
    this.startButton.down(click)
  }

  onMouseUp (click) {
    this.startButton.up(click)
  }
}

export class GamePlayScreen extends Screen {
  constructor (session) {
    super(session)
    this.before = 0
  }

  draw () {
    this.session.graphics.drawGame(this.session, true, false)
  }

  onClick (click) {
    return this
  }

  onMouseMove (click) {
    if (click.y > -0.25) {
      click.y = -0.25
    }
    this.session.gameState.handle.set(click)
    return this
  }

  onMouseDown (click) {
    this.before = Date.now()
  }

  onMouseUp (click) {
    const secs = (Date.now() - this.before) / 1000
    this.session.gameState.jump(secs)
  }
}

export class EndOfRoundScreen extends Screen {
  constructor (session) {
    super(session)
    this.dy = 0.15
    this.session = session
    this.newMultiplier = this.session.multiplier + 1
    this.resetButton = new Button('1x Reset')
    this.resetButton.origin.x = -0.22
    this.resetButton.origin.y = -0.25
    this.riskButton = new Button(this.newMultiplier + 'x Risk')
    this.riskButton.origin.x = 0.22
    this.riskButton.origin.y = -0.25
  }

  draw () {
    this.session.graphics.drawGame(this.session, true, true)
    this.session.graphics.drawText('Good Round', 0, this.dy - 0.08, 0.14)
    this.session.graphics.drawText(
      "round's score " + this.session.roundScore,
      0,
      this.dy - 0.15,
      0.05
    )
    this.session.graphics.drawButton(this.resetButton)
    this.session.graphics.drawButton(this.riskButton)
    this.session.graphics.drawText(
      'Beat ' + this.session.gameState.runTimeStr + 's or game over',
      0.22,
      -0.34,
      0.03
    )
  }

  onClick (click) {
    if (this.resetButton.clicked(click)) {
      this.session.multiplier = 1
      this.session.lastRunTimeStr = '0.0'
      return this.restartGame()
    }
    if (this.riskButton.clicked(click)) {
      this.session.multiplier = this.session.multiplier + 1
      this.session.lastRunTimeStr = this.session.gameState.runTimeStr
      return this.restartGame()
    }
    return this
  }

  onMouseDown (click) {
    this.resetButton.down(click)
    this.riskButton.down(click)
  }

  onMouseUp (click) {
    this.resetButton.up(click)
    this.riskButton.up(click)
  }
}

export class GameOverScreen extends Screen {
  constructor (session, beatHighscore, win) {
    super(session)
    this.dy = 0.15
    this.headline = win ? 'Chicken Dinner!' : 'Game Over'
    this.subline = beatHighscore ? 'new highscore ' : 'final score '
    this.startButton = new Button('Start')
    this.startButton.origin.y = -0.25
  }

  draw () {
    this.session.graphics.drawGame(this.session, true, true)
    this.session.graphics.drawText(this.headline, 0, this.dy - 0.08, 0.14)
    this.session.graphics.drawText(
      this.subline + this.session.score,
      0,
      this.dy - 0.15,
      0.05
    )
    this.session.graphics.drawButton(this.startButton)
  }

  onClick (click) {
    if (this.startButton.clicked(click)) {
      this.session.lastRunTimeStr = '0.0'
      this.session.roundScore = 0
      this.session.score = 0
      this.session.multiplier = 1
      return this.restartGame()
    }
    return this
  }

  onMouseDown (click) {
    this.startButton.down(click)
  }

  onMouseUp (click) {
    this.startButton.up(click)
  }

  onMouseMove (click) {
    // do nothing
  }
}
