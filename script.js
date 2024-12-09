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
  
          if (this.velocity !== 0) {
            const scaleX = this.velocity > 0 ? 1 : -1;
            const tiltAngle = (this.velocity / this.maxSpeed) * 15;
            this.character.style.transform = `translateX(-50%) scaleX(${scaleX}) rotate(${tiltAngle}deg)`;
          } else {
            this.character.style.transform = `translateX(-50%)`;
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
        this.timeRemaining--;
        this.timerElement.textContent = `Time: ${this.timeRemaining}`;
        if (this.timeRemaining <= 0) {
          this.gameOver = true;
          this.active = false;
          this.showEndScreen();
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
        rotationSpeed: (Math.random() - 0.5) * 3
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
  
        box.position += 3;
        box.rotation += box.rotationSpeed;
        box.element.style.top = box.position + 'px';
        box.element.style.transform = `rotate(${box.rotation}deg)`;
  
        if (box.position > window.innerHeight - 167) {
          const boxLeft = parseInt(box.element.style.left);
          if (Math.abs(boxLeft - this.characterPos) < 90) {
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
          <h2>Final Scores:</h2>
          <p>Player: ${playerGame.score}</p>
          <p>Bot: ${botGame.score}</p>
          <h3>${playerGame.score > botGame.score ? 'Player Wins!' : 
               botGame.score > playerGame.score ? 'Bot Wins!' : 'It\'s a Tie!'}</h3>
        `;
        endScreen.style.display = 'flex';
      }
    }
  
    botAI() {
      if (!this.active || this.gameOver) return;
  
      let dangerZone = null;
      let minDistance = Infinity;
  
      for (const box of this.boxes) {
        if (!box.element) continue;
  
        const boxLeft = parseInt(box.element.style.left);
        const boxTop = box.position;
        const distance = window.innerHeight - boxTop;
  
        if (distance < minDistance && distance < 400) {
          minDistance = distance;
          dangerZone = boxLeft;
        }
      }
  
      if (dangerZone !== null) {
        const safeDistance = 117;
        const distanceToBox = Math.abs(dangerZone - this.characterPos);
  
        if (distanceToBox < safeDistance) {
          this.moveCharacter(dangerZone > this.characterPos ? 'left' : 'right');
        } else {
          if (Math.abs(this.characterPos - this.containerWidth / 2) > 45) {
            this.moveCharacter(this.characterPos > this.containerWidth / 2 ? 'left' : 'right');
          }
        }
      }
    }
  }
  
  const FALLING_OBJECTS = [
    'assets/Fire-extinguisher2.png',
    'assets/Barrel3.png',
    'assets/Box1.png',
    'assets/Box3.png',
    'assets/Box8.png'
  ];
  
  let playerGame;
  let botGame;
  let gameLoop;
  let timerInterval;
  let keysPressed = {};

  function playButtonSound() {
  const guiSound = document.getElementById('gui-sound');
  guiSound.currentTime = 0;
  guiSound.play().catch(error => {
    console.error("Sound playback failed:", error);
  });
}

document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', playButtonSound);
});

  
  function startGame() {
    const bgMusic = document.getElementById('background-music');
    bgMusic.volume = 0.5;
  
    const startMusic = () => {
      bgMusic.play().catch(error => {
        console.log("Audio playback failed:", error);
      });
    };
    
    bgMusic.addEventListener('ended', startMusic);
    startMusic();
  
    const imagesToPreload = [
      'assets/background.png',
      'assets/IndustrialTile_13.png',
      'assets/IndustrialTile_23.png',
      'assets/Fire-extinguisher2.png',
      'assets/Barrel3.png',
      'assets/Box1.png',
      'assets/Box3.png',
      'assets/Box8.png',
      'assets/player.png',
      'assets/bot.png'
    ];
  
    Promise.all(imagesToPreload.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    }))
    .then(() => {
      startMusic();
  
      document.getElementById('menu-screen').style.display = 'none';
      document.getElementById('player-side').style.display = 'block';
      document.getElementById('bot-side').style.display = 'block';
  
      playerGame = new Game('player-side', false);
      botGame = new Game('bot-side', true);
  
      let lastKeyPressed = null;
      document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        lastKeyPressed = e.key;
      });
  
      document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
      });
  
      const inputLoop = setInterval(() => {
        if (playerGame.gameOver && botGame.gameOver) {
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
  
      timerInterval = setInterval(() => {
        playerGame.updateTimer();
        botGame.updateTimer();
      }, 1000);
  
      gameLoop = setInterval(() => {
        if (playerGame.gameOver && botGame.gameOver) {
          clearInterval(gameLoop);
          clearInterval(timerInterval);
          return;
        }
  
        if (Math.random() < 0.02) {
          playerGame.createBox();
          botGame.createBox();
        }
        
        try {
          playerGame.updateBoxes();
          botGame.updateBoxes();
          botGame.botAI();
          playerGame.updateSurvivalScore();
          botGame.updateSurvivalScore();
        } catch (e) {
          console.error('Error in game loop:', e);
        }
      }, 16);
    })
    .catch(error => {
      console.error('Error loading images:', error);
    });
  }
  
  function showInstructions() {
    document.querySelector('.menu-container').style.display = 'none';
    document.getElementById('instructions').style.display = 'flex';
  }
  
  function hideInstructions() {
    document.getElementById('instructions').style.display = 'none';
    document.querySelector('.menu-container').style.display = 'flex';
  }
  
  function endGame() {
    const bgMusic = document.getElementById('background-music');
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
