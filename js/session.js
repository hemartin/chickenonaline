import * as Constants from './constants.js'
import { GameState } from './gamestate.js'
import { SplashScreen, EndOfRoundScreen, GameOverScreen } from './screens.js'

/**
 * A session includes state across multiple games, such
 * as highscores, and references to canvas and context
 * for drawing graphics.
 *
 * @author Martin Hentschel
 */
export class Session {
  constructor (graphics) {
    this.gameState = new GameState()
    this.graphics = graphics
    this.currentScreen = new SplashScreen(this)
    this.isRunning = false
    this.lastRunTimeStr = 0
    this.roundScore = 0
    this.score = 0
    this.multiplier = 1
    this.highScore = 0

    // draw first screen
    this.currentScreen.draw()
  }

  runGame () {
    this.isRunning = true
    const session = this

    function step (now) {
      // advance game state
      session.gameState.advance(now)

      // draw game
      session.drawGame(true, false)

      // end game if chicken hits bottom edge
      if (session.gameState.chicken.origin.y < -0.5) {
        session.endGame()
      }

      // request next animation frame from browser
      if (session.isRunning) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }

  drawGame (includeBodiesAndText, lightColors) {
    this.graphics.drawGame(this, includeBodiesAndText, lightColors)
  }

  endGame () {
    this.isRunning = false
    if (Number(this.gameState.runTimeStr) > Number(this.lastRunTimeStr)) {
      this.roundScore = Math.round(
        10 * this.multiplier * this.gameState.runTimeStr
      )
      this.score += this.roundScore
      const win = this.score > Constants.WIN_SCORE
      if (win) {
        const beatHighscore = this.score > this.highScore
        if (beatHighscore) {
          this.highScore = this.score
        }
        this.currentScreen = new GameOverScreen(this, beatHighscore, win)
      } else {
        this.currentScreen = new EndOfRoundScreen(this)
      }
    } else {
      const beatHighscore = this.score > this.highScore
      if (beatHighscore) {
        this.highScore = this.score
      }
      this.currentScreen = new GameOverScreen(this, beatHighscore, false)
    }
    this.currentScreen.draw()
  }

  onClick (event) {
    const click = this.graphics.toClickVector(event)
    this.currentScreen = this.currentScreen.onClick(click)
    this.redrawIfNotRunning()
  }

  onMouseDown (event) {
    const click = this.graphics.toClickVector(event)
    this.currentScreen.onMouseDown(click)
    this.redrawIfNotRunning()
  }

  onMouseUp (event) {
    const click = this.graphics.toClickVector(event)
    this.currentScreen.onMouseUp(click)
    this.redrawIfNotRunning()
  }

  onMouseMove (event) {
    const click = this.graphics.toClickVector(event)
    this.currentScreen.onMouseMove(click)
  }

  redrawIfNotRunning () {
    if (!this.isRunning) {
      this.currentScreen.draw()
    }
  }

  resizeCanvasInGame () {
    this.graphics.resizeCanvas()
    if (!this.isRunning) {
      this.currentScreen.draw()
    }
  }
}
