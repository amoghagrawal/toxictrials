const FALLING_OBJECTS = [
    'assets/Box1.png',
    'assets/Box3.png', 
    'assets/Box8.png',
    'assets/Barrel3.png',
    'assets/Fire-extinguisher2.png'
];
  
const keysPressed = {};

class Game {
    constructor(side, isBot) {
        this.container = document.getElementById(side);
        this.character = isBot ? this.container.querySelector('.bot') : this.container.querySelector('.player');
        this.timerElement = document.getElementById(side + '-timer');
        this.scoreElement = document.getElementById(side + '-score');
        this.boxes = [];
        this.score = 0;
        this.isBot = isBot;
        this.containerWidth = this.container.offsetWidth;
        this.characterPos = this.containerWidth / 2;
        this.wallWidth = 30;
        this.gameOver = false;
        this.active = true;
        this.lastSurvivalScore = Date.now();
        this.timeRemaining = 60;
        this.lastTimerUpdate = Date.now();
        this.characterSize = 117;
        this.velocity = 0;
        this.acceleration = 0.8;
        this.friction = 0.95;
        this.maxSpeed = 8;
        this.responsiveness = 0.7;
        this.dampening = 0.98;
        this.minMovementThreshold = 0.05;
    }

    moveCharacter(direction) {
        if (!this.active || this.gameOver) return;

        const targetVelocity = direction === 'left' ? -this.maxSpeed : this.maxSpeed;

        if (direction === 'left') {
            this.velocity -= this.acceleration * this.responsiveness;
        } else if (direction === 'right') {
            this.velocity += this.acceleration * this.responsiveness;
        }

        this.velocity = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity));
        this.characterPos += this.velocity;

        const minPos = this.wallWidth + (this.characterSize / 2) - 5;
        const maxPos = this.containerWidth - this.wallWidth - (this.characterSize / 2) - 5;

        if (this.characterPos <= minPos) {
            this.characterPos = minPos;
            this.velocity *= -0.5;
        } else if (this.characterPos >= maxPos) {
            this.characterPos = maxPos;
            this.velocity *= -0.5;
        }

        this.velocity *= this.dampening;

        if (Math.abs(this.velocity) < this.minMovementThreshold) {
            this.velocity = 0;
        }

        if (!keysPressed['ArrowLeft'] && !keysPressed['ArrowRight']) {
            this.velocity *= this.friction;
        }

        if (this.character) {
            requestAnimationFrame(() => {
                this.character.style.left = `${this.characterPos}px`;

                if (direction === 'left') {
                    this.character.style.transform = `translateX(-50%) scaleX(-1)`;
                } else if (direction === 'right') {
                    this.character.style.transform = `translateX(-50%) scaleX(1)`;
                } else if (this.velocity === 0) {
                    const currentScaleX = this.character.style.transform.includes('scaleX(-1)') ? -1 : 1;
                    this.character.style.transform = `translateX(-50%) scaleX(${currentScaleX})`;
                }
            });
        }
    }

    updateSurvivalScore() {
        if (!this.gameOver && this.active) {
            const now = Date.now();
            if (now - this.lastSurvivalScore >= 2000) {
                this.score += 1;
                this.scoreElement.textContent = this.score;
                this.lastSurvivalScore = now;
            }
        }
    }

    updateTimer() {
        if (!this.gameOver && this.active && this.timerElement) {
            const currentTime = Date.now();
            if (currentTime - this.lastTimerUpdate >= 1000) {
                this.timeRemaining--;
                this.timerElement.textContent = `Time: ${this.timeRemaining}`;
                this.lastTimerUpdate = currentTime;

                if (this.timeRemaining <= 0) {
                    this.gameOver = true;
                    this.active = false;
                    this.showEndScreen();
                }
            }
        }
    }

    createBox() {
        if (!this.active || this.gameOver || !this.container) return;

        const box = document.createElement('div');
        box.className = 'box';
        const minX = this.wallWidth;
        const maxX = this.containerWidth - this.wallWidth - 60;
        box.style.left = (Math.random() * (maxX - minX) + minX) + 'px';
        box.style.top = '0px';

        const randomImage = FALLING_OBJECTS[Math.floor(Math.random() * FALLING_OBJECTS.length)];
        const randomRotation = Math.floor(Math.random() * 360);

        box.style.backgroundImage = `url('${randomImage}')`;
        box.style.transform = `rotate(${randomRotation}deg)`;

        this.container.appendChild(box);
        this.boxes.push({
            element: box,
            position: 0,
            rotation: randomRotation,
            rotationSpeed: (Math.random() - 0.5) * 5
        });
    }

    updateBoxes() {
        if (!this.active || this.gameOver) return;

        for (let i = this.boxes.length - 1; i >= 0; i--) {
            const box = this.boxes[i];
            if (!box || !box.element || !box.element.parentNode) {
                this.boxes.splice(i, 1);
                continue;
            }

            box.position += 5;
            box.rotation += box.rotationSpeed;
            box.element.style.top = box.position + 'px';
            box.element.style.transform = `rotate(${box.rotation}deg)`;

            if (box.position > window.innerHeight - 167) {
                const boxLeft = parseInt(box.element.style.left);
                const boxCenter = boxLeft + 30;
                const characterCenter = this.characterPos;
                const collisionDistance = 60;

                if (Math.abs(boxCenter - characterCenter) < collisionDistance) {
                    this.score -= 1;
                    this.scoreElement.textContent = this.score;
                }

                try {
                    if (box.element && box.element.parentNode) {
                        box.element.parentNode.removeChild(box.element);
                    }
                    this.boxes.splice(i, 1);
                } catch (e) {
                    console.error('Error removing box:', e);
                }
            }
        }
    }

    showEndScreen() {
        if (playerGame.gameOver && botGame.gameOver) {
            endGame();
            const endScreen = document.getElementById('end-screen');
            const finalScores = document.getElementById('final-scores');
            finalScores.innerHTML = `
                <h2>Game Over!</h2>
                <p>Final Score: ${this.score}</p>
                <p>Time Survived: ${Math.floor((Date.now() - this.startTime) / 1000)} seconds</p>
            `;
            endScreen.style.display = 'flex';
        }
    }

    botAI() {
        if (!this.active || this.gameOver) return;

        let closestBox = null;
        let minDistance = Infinity;

        for (const box of this.boxes) {
            if (!box.element) continue;

            const boxLeft = parseInt(box.element.style.left);
            const boxTop = box.position;
            const distance = window.innerHeight - 167 - boxTop;

            if (distance > 0 && distance < minDistance) {
                minDistance = distance;
                closestBox = {
                    left: boxLeft,
                    distance: distance
                };
            }
        }

        if (closestBox && closestBox.distance < 300) {
            const boxCenter = closestBox.left + 30;
            const safeDistance = 80;

            if (Math.abs(this.characterPos - boxCenter) < safeDistance) {
                if (Math.random() < 0.95) {
                    const moveDirection = boxCenter > this.characterPos ? 'left' : 'right';
                    this.moveCharacter(moveDirection);
                }
            }
        } else {
            const centerPos = this.containerWidth / 2;
            if (Math.abs(this.characterPos - centerPos) > 30) {
                this.moveCharacter(this.characterPos > centerPos ? 'left' : 'right');
            }
        }
    }
}
  
  class SurvivalGame extends Game {
    constructor(side) {
      super(side, false);
      this.initialBoxFallSpeed = 3;
      this.boxFallSpeed = this.initialBoxFallSpeed;
      this.spawnRate = 0.02;
      this.timeRemaining = Infinity;
      this.startTime = Date.now();
      this.containerWidth = window.innerWidth;
      this.characterPos = this.containerWidth / 2;
      this.score = 0;
  
      window.addEventListener('resize', () => {
        this.containerWidth = window.innerWidth;
        this.characterPos = Math.min(
          Math.max(
            this.characterPos,
            this.wallWidth + (this.characterSize / 2)
          ),
          this.containerWidth - this.wallWidth - (this.characterSize / 2)
        );
      });
    }
  
    updateDifficulty() {
      const timeElapsed = (Date.now() - this.startTime) / 1000;
      this.boxFallSpeed = this.initialBoxFallSpeed + (timeElapsed / 10);
      this.spawnRate = Math.min(0.08, 0.02 + (timeElapsed / 100));
    }
  
    showEndScreen() {
      const endScreen = document.getElementById('end-screen');
      const finalScores = document.getElementById('final-scores');
      finalScores.innerHTML = `
        <h2>Game Over!</h2>
        <p>Final Score: ${this.score}</p>
        <p>Time Survived: ${Math.floor((Date.now() - this.startTime) / 1000)} seconds</p>
      `;
      endScreen.style.display = 'flex';
    }
  
    updateBoxes() {
      if (!this.active || this.gameOver) return;
  
      for (let i = this.boxes.length - 1; i >= 0; i--) {
        const box = this.boxes[i];
        if (!box || !box.element || !box.element.parentNode) {
          this.boxes.splice(i, 1);
          continue;
        }
  
        box.position += this.boxFallSpeed;
        box.rotation += box.rotationSpeed;
        box.element.style.top = box.position + 'px';
        box.element.style.transform = `rotate(${box.rotation}deg)`;
  
        if (box.position > window.innerHeight - 167) {
          const boxLeft = parseInt(box.element.style.left);
          const boxCenter = boxLeft + 30; 
          const characterCenter = this.characterPos;
          const collisionDistance = 60;
  
          if (Math.abs(boxCenter - characterCenter) < collisionDistance) {
            this.gameOver = true;
            this.active = false;
            this.showEndScreen();
            return;
          }
  
          try {
            if (box.element && box.element.parentNode) {
              box.element.parentNode.removeChild(box.element);
            }
            this.boxes.splice(i, 1);
          } catch (e) {
            console.error('Error removing box:', e);
          }
        }
      }
    }
  }
  
  function startSurvivalMode() {
    playButtonSound();
    document.getElementById('menu-screen').style.display = 'none';
    
    document.getElementById('bot-side').style.display = 'none';
    const playerSide = document.getElementById('player-side');
    playerSide.style.display = 'block';
    playerSide.style.margin = '0';
    playerSide.style.float = 'none';
    playerSide.style.width = '100%';
    playerSide.classList.add('survival-container');
  
    const timerElement = playerSide.querySelector('.timer');
    if (timerElement) {
      timerElement.style.display = 'none';
    }
  
    playerGame = new SurvivalGame('player-side');
  
    gameLoop = setInterval(() => {
      if (playerGame.gameOver) {
        clearInterval(gameLoop);
        return;
      }
  
      playerGame.updateDifficulty();
      if (Math.random() < playerGame.spawnRate) {
        playerGame.createBox();
      }
  
      try {
        playerGame.updateBoxes();
        playerGame.updateSurvivalScore();
      } catch (e) {
        console.error('Error in game loop:', e);
      }
    }, 16);
  
    let lastKeyPressed = null;
    document.addEventListener('keydown', (e) => {
      keysPressed[e.key] = true;
      lastKeyPressed = e.key;
    });
  
    document.addEventListener('keyup', (e) => {
      keysPressed[e.key] = false;
    });
  
    const inputLoop = setInterval(() => {
      if (playerGame.gameOver) {
        clearInterval(inputLoop);
        return;
      }
  
      if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
        const lastPressed = lastKeyPressed === 'ArrowLeft' ? 'left' : 'right';
        playerGame.moveCharacter(lastPressed);
      } else if (keysPressed['ArrowLeft']) {
        playerGame.moveCharacter('left');
      } else if (keysPressed['ArrowRight']) {
        playerGame.moveCharacter('right');
      } else {
        playerGame.moveCharacter(null);
      }
    }, 8);
  }
  
  class ChallengeGame extends Game {
    constructor(side) {
      super(side, false);
      this.initialBoxFallSpeed = 4;
      this.boxFallSpeed = this.initialBoxFallSpeed;
      this.spawnRate = 0.03;
      this.timeRemaining = 60; 
      this.startTime = Date.now();
      this.containerWidth = window.innerWidth;
      this.characterPos = this.containerWidth / 2;
      this.score = 0;
  
      window.addEventListener('resize', () => {
        this.containerWidth = window.innerWidth;
        this.characterPos = Math.min(
          Math.max(
            this.characterPos,
            this.wallWidth + (this.characterSize / 2)
          ),
          this.containerWidth - this.wallWidth - (this.characterSize / 2)
        );
      });
    }
  
    updateDifficulty() {
      const timeElapsed = (Date.now() - this.startTime) / 1000;
      this.boxFallSpeed = this.initialBoxFallSpeed + (timeElapsed / 15);
      this.spawnRate = Math.min(0.06, 0.03 + (timeElapsed / 120));
    }
  
    showEndScreen() {
      const endScreen = document.getElementById('end-screen');
      const finalScores = document.getElementById('final-scores');
      const gameResult = this.timeRemaining <= 0 ? 'Challenge Complete!' : 'Game Over!';
      finalScores.innerHTML = `
        <h2>${gameResult}</h2>
        <p>Final Score: ${this.score}</p>
        <p>Time Survived: ${60 - this.timeRemaining} seconds</p>
      `;
      endScreen.style.display = 'flex';
    }
  
    updateBoxes() {
      if (!this.active || this.gameOver) return;
  
      for (let i = this.boxes.length - 1; i >= 0; i--) {
        const box = this.boxes[i];
        if (!box || !box.element || !box.element.parentNode) {
          this.boxes.splice(i, 1);
          continue;
        }
  
        box.position += this.boxFallSpeed;
        box.rotation += box.rotationSpeed;
        box.element.style.top = box.position + 'px';
        box.element.style.transform = `rotate(${box.rotation}deg)`;
  
        if (box.position > window.innerHeight - 167) {
          const boxLeft = parseInt(box.element.style.left);
          const boxCenter = boxLeft + 30; 
          const characterCenter = this.characterPos;
          const collisionDistance = 60;
  
          if (Math.abs(boxCenter - characterCenter) < collisionDistance) {
            this.score -= 1;
            this.scoreElement.textContent = this.score;
          }
  
          try {
            if (box.element && box.element.parentNode) {
              box.element.parentNode.removeChild(box.element);
            }
            this.boxes.splice(i, 1);
          } catch (e) {
            console.error('Error removing box:', e);
          }
        }
      }
    }
  
    updateTimer() {
      if (!this.gameOver && this.active && this.timerElement) {
        const currentTime = Date.now();
        if (currentTime - this.lastTimerUpdate >= 1000) {
          this.timeRemaining--;
          this.timerElement.textContent = `Time: ${this.timeRemaining}`;
          this.lastTimerUpdate = currentTime;
          
          if (this.timeRemaining <= 0) {
            this.gameOver = true;
            this.active = false;
            this.showEndScreen();
          }
        }
      }
    }
  }
  
class BotMode extends Game {
    constructor(side, isBot) {
        super(side, isBot);
        this.timeRemaining = 60;
        this.boxFallSpeed = 4;
        this.startTime = Date.now();
    }

    showEndScreen() {
        if (playerGame.gameOver || botGame.gameOver) {
            const endScreen = document.getElementById('end-screen');
            const finalScores = document.getElementById('final-scores');
            let winnerText = '';
            if (playerGame.score > botGame.score) {
                winnerText = 'Player Wins!';
            } else if (botGame.score > playerGame.score) {
                winnerText = 'Bot Wins!';
            } else {
                winnerText = "It's a Tie!";
            }

            finalScores.innerHTML = `
                <h2>${winnerText}</h2>
                <p>Player Score: ${playerGame.score}</p>
                <p>Bot Score: ${botGame.score}</p>
                <p>Time: ${60 - this.timeRemaining} seconds</p>
            `;
            endScreen.style.display = 'flex';
        }
    }
}

function startGame() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('player-side').style.display = 'block';
    document.getElementById('bot-side').style.display = 'block';

    playerGame = new BotMode('player-side', false);
    botGame = new BotMode('bot-side', true);

    let lastSpawnTime = Date.now();
    const spawnInterval = 2000;

    gameLoop = setInterval(() => {
        if (playerGame.gameOver || botGame.gameOver) {
            clearInterval(gameLoop);
            return;
        }

        const currentTime = Date.now();
        if (currentTime - lastSpawnTime >= spawnInterval) {
            playerGame.createBox();
            botGame.createBox();
            lastSpawnTime = currentTime;
        }

        if (Math.random() < 0.01) {
            playerGame.createBox();
            botGame.createBox();
        }

        try {
            playerGame.updateBoxes();
            botGame.updateBoxes();
            botGame.botAI();
            playerGame.updateTimer();
            botGame.updateTimer();
            playerGame.updateSurvivalScore();
            botGame.updateSurvivalScore();
        } catch (e) {
            console.error('Error in game loop:', e);
        }
    }, 16);

    let lastKeyPressed = null;
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        lastKeyPressed = e.key;
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    const inputLoop = setInterval(() => {
        if (playerGame.gameOver) {
            clearInterval(inputLoop);
            return;
        }

        if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
            const lastPressed = lastKeyPressed === 'ArrowLeft' ? 'left' : 'right';
            playerGame.moveCharacter(lastPressed);
        } else if (keysPressed['ArrowLeft']) {
            playerGame.moveCharacter('left');
        } else if (keysPressed['ArrowRight']) {
            playerGame.moveCharacter('right');
        } else {
            playerGame.moveCharacter(null);
        }
    }, 8);
}

function endGame() {
    if (playerGame.gameOver || botGame.gameOver) {
        const endScreen = document.getElementById('end-screen');
        const finalScores = document.getElementById('final-scores');

        let winnerText = '';
        if (playerGame.score > botGame.score) {
            winnerText = 'Player Wins!';
        } else if (botGame.score > playerGame.score) {
            winnerText = 'Bot Wins!';
        } else {
            winnerText = "It's a Tie!";
        }

        finalScores.innerHTML = `
            <h2>${winnerText}</h2>
            <p>Player Score: ${playerGame.score}</p>
            <p>Bot Score: ${botGame.score}</p>
            <p>Time: ${60 - playerGame.timeRemaining} seconds</p>
        `;
        endScreen.style.display = 'flex';
    }
}

function startSurvivalMode() {
    playButtonSound();
    document.getElementById('menu-screen').style.display = 'none';

    document.getElementById('bot-side').style.display = 'none';
    const playerSide = document.getElementById('player-side');
    playerSide.style.display = 'block';
    playerSide.style.margin = '0';
    playerSide.style.float = 'none';
    playerSide.style.width = '100%';
    playerSide.classList.add('survival-container');

    const timerElement = playerSide.querySelector('.timer');
    if (timerElement) {
        timerElement.style.display = 'none';
    }

    playerGame = new SurvivalGame('player-side');

    gameLoop = setInterval(() => {
        if (playerGame.gameOver) {
            clearInterval(gameLoop);
            return;
        }

        playerGame.updateDifficulty();
        if (Math.random() < playerGame.spawnRate) {
            playerGame.createBox();
        }

        try {
            playerGame.updateBoxes();
            playerGame.updateSurvivalScore();
        } catch (e) {
            console.error('Error in game loop:', e);
        }
    }, 16);

    let lastKeyPressed = null;
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        lastKeyPressed = e.key;
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    const inputLoop = setInterval(() => {
        if (playerGame.gameOver) {
            clearInterval(inputLoop);
            return;
        }

        if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
            const lastPressed = lastKeyPressed === 'ArrowLeft' ? 'left' : 'right';
            playerGame.moveCharacter(lastPressed);
        } else if (keysPressed['ArrowLeft']) {
            playerGame.moveCharacter('left');
        } else if (keysPressed['ArrowRight']) {
            playerGame.moveCharacter('right');
        } else {
            playerGame.moveCharacter(null);
        }
    }, 8);
}

function startChallengeMode() {
    playButtonSound();
    document.getElementById('menu-screen').style.display = 'none';

    document.getElementById('bot-side').style.display = 'none';
    const playerSide = document.getElementById('player-side');
    playerSide.style.display = 'block';
    playerSide.style.margin = '0';
    playerSide.style.float = 'none';
    playerSide.style.width = '100%';
    playerSide.classList.add('survival-container');

    playerGame = new ChallengeGame('player-side');

    gameLoop = setInterval(() => {
        if (playerGame.gameOver) {
            clearInterval(gameLoop);
            return;
        }

        playerGame.updateDifficulty();
        if (Math.random() < playerGame.spawnRate) {
            playerGame.createBox();
        }

        try {
            playerGame.updateBoxes();
            playerGame.updateTimer();
            playerGame.updateSurvivalScore();
        } catch (e) {
            console.error('Error in game loop:', e);
        }
    }, 16);

    let lastKeyPressed = null;
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        lastKeyPressed = e.key;
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    const inputLoop = setInterval(() => {
        if (playerGame.gameOver) {
            clearInterval(inputLoop);
            return;
        }

        if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
            const lastPressed = lastKeyPressed === 'ArrowLeft' ? 'left' : 'right';
            playerGame.moveCharacter(lastPressed);
        } else if (keysPressed['ArrowLeft']) {
            playerGame.moveCharacter('left');
        } else if (keysPressed['ArrowRight']) {
            playerGame.moveCharacter('right');
        } else {
            playerGame.moveCharacter(null);
        }
    }, 8);
}

function startBotMode() {
    playButtonSound();
    startGame();
}

function playButtonSound() {
    const sound = new Audio('sounds/gui-select.wav');
    sound.volume = 0.3;
    sound.play().catch(error => {
        console.log("Audio playback failed:", error);
    });
}

function hideInstructions() {
    document.getElementById('instructions').style.display = 'none';
    document.querySelector('.menu-container').style.display = 'flex';
}

function hideGamemodes() {
    playButtonSound();
    document.getElementById('gamemodes').style.display = 'none';
    document.querySelector('.menu-container').style.display = 'flex';
}

function showGamemodes() {
    playButtonSound();
    document.querySelector('.menu-container').style.display = 'none';
    document.getElementById('gamemodes').style.display = 'flex';

    const bgMusic = document.getElementById('background-music');
    if (bgMusic.paused) {
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
        bgMusic.play().catch(error => {
            console.log("Audio playback failed:", error);
        });
    }
}

function showRules() {
    playButtonSound();
    document.querySelector('.menu-container').style.display = 'none';
    document.getElementById('instructions').style.display = 'flex';
}

function endGame() {
    if (playerGame.gameOver || botGame.gameOver) {
        const endScreen = document.getElementById('end-screen');
        const finalScores = document.getElementById('final-scores');

        let winnerText = '';
        if (playerGame.score > botGame.score) {
            winnerText = 'Player Wins!';
        } else if (botGame.score > playerGame.score) {
            winnerText = 'Bot Wins!';
        } else {
            winnerText = "It's a Tie!";
        }

        finalScores.innerHTML = `
            <h2>${winnerText}</h2>
            <p>Player Score: ${playerGame.score}</p>
            <p>Bot Score: ${botGame.score}</p>
            <p>Time: ${60 - playerGame.timeRemaining} seconds</p>
        `;
        endScreen.style.display = 'flex';
    }
}