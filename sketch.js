let gameOver = false;

let milei; // Variable to hold the image
let angryMilei; // Global variable for the angry Milei image
let mileiSad; // Global variable for the sad Milei image

let currentMileiImage;

const aspectRatio = 9 / 16;

let mileiWidth = 0.2;
let mileiVelocity = 0.02;


let pesos = [];
const initialN = 70; // Interval for spawning new Pesos
let N;

function updateEnemySpawnRate() {
    const asymptote = 10;  // The value of N will approach this asymptote
    const decayRate = 0.0001;  // Controls how quickly the value of N decays
    N = asymptote + (initialN - asymptote) * Math.exp(-decayRate * frameCount);
}
  

let projectileImg;

let projectiles = [];
const projectileRefractoryPeriod = 20;
let lastProjectileFrame = -projectileRefractoryPeriod; // Initialize to allow immediate firing

let score = 0;

let pesoTypes = {};

let pesoProbability = {
    50: 0.25, 100: 0.25, 200: 0.2, 500: 0.15, 1000: 0.1, 2000: 0.05
  };
  

function preload() {
  // Load the image and place it in the 'assets' folder in your project directory
  milei = loadImage('assets/milei.png');
  angryMilei = loadImage('assets/angry_milei.png');
  mileiSad = loadImage('assets/milei_sad.png');
  projectileImg = loadImage('assets/projectile.png');

  // Load Peso images and assign points and velocities
  pesoTypes = {
    50: { img: loadImage('assets/peso_50.jpg'), points: 50, velocity: 1.6 },
    100: { img: loadImage('assets/peso_100.jpg'), points: 100, velocity: 2.2 },
    200: { img: loadImage('assets/peso_200.jpg'), points: 200, velocity: 2.8 },
    500: { img: loadImage('assets/peso_500.jpg'), points: 500, velocity: 3.6 },
    1000: { img: loadImage('assets/peso_1000.jpg'), points: 1000, velocity: 5 },
    2000: { img: loadImage('assets/peso_2000.jpg'), points: 2000, velocity: 8 }
  };
}

function setup() {
  // Create a canvas that maintains a 9:16 aspect ratio and adjusts to the screen size
  let canvasHeight = windowHeight;
  let canvasWidth = canvasHeight * aspectRatio;
  if (canvasWidth > windowWidth) {
    canvasWidth = windowWidth;
    canvasHeight = canvasWidth / aspectRatio;
  }
  createCanvas(canvasWidth, canvasHeight);

  N = initialN;

  // Position Milei initially in the center-bottom of the canvas
  mileiX = width / 2;
  mileiY = height - (milei.height / 2);
}

function displayScore() {
    textSize(width * 0.3); // Font size as a fraction of the canvas width
    textAlign(CENTER, CENTER);
    fill(100); // White text, change color if needed
    text(score, width / 2, height / 2); // Positioned at the center top of the canvas
  }  

function draw() {
    background(0);

    displayScore();
  
    // Update and display Milei
    handleMilei();

    if (!gameOver){
        updateEnemySpawnRate(); // Update the spawn rate

        // Handle Pesos
        handlePesos();

        handleProjectiles();

        checkMileiCollisions();
    }
}
  
function checkMileiCollisions() {
    for (let enemy of pesos) {
      if (enemy.state === 'alive' && collidesWithMilei(enemy)) {
        pesos = []; // Clear all enemies
        gameOver = true;
        break;
      }
    }
}

function collidesWithMilei(enemy) {
    let mileiScaledWidth = width * mileiWidth;  // Assuming this is the current scale for Milei's width
    let mileiScaledHeight = milei.height * (mileiScaledWidth / milei.width); // Assuming aspect ratio
  
    return (
      mileiX + mileiScaledWidth / 2 > enemy.x - enemy.width / 2 &&
      mileiX - mileiScaledWidth / 2 < enemy.x + enemy.width / 2 &&
      mileiY + mileiScaledHeight / 2 > enemy.y - enemy.height / 2 &&
      mileiY - mileiScaledHeight / 2 < enemy.y + enemy.height / 2
    );
  }

function handleMilei() {
    let mileiScaledWidth = width * mileiWidth;
    let mileiScaledHeight = milei.height * (mileiScaledWidth / milei.width);

    currentMileiImage = milei;  // Default Milei image

    // If the mouse is inside Milei's width, switch to angry Milei image
    if (mouseIsPressed && mouseX > mileiX - mileiScaledWidth / 2 && mouseX < mileiX + mileiScaledWidth / 2) {
        mileiImage = angryMilei;
    }

    if (gameOver){
        currentMileiImage = mileiSad;
    }

    image(currentMileiImage, mileiX - mileiScaledWidth / 2, mileiY - mileiScaledHeight / 2, mileiScaledWidth, mileiScaledHeight);

    // Move Milei based on mouse position, only if the mouse is outside Milei's width
    if (mouseIsPressed) {
        if (mouseX < mileiX - mileiScaledWidth / 2) {
        mileiX -= width * mileiVelocity; // Move left
        } else if (mouseX > mileiX + mileiScaledWidth / 2) {
        mileiX += width * mileiVelocity; // Move right
        }
    }

    if (keyIsDown(LEFT_ARROW)) {
        mileiX -= width * mileiVelocity; // Move left
      } else if (keyIsDown(RIGHT_ARROW)) {
        mileiX += width * mileiVelocity; // Move right
    }
    
      // Keep Milei within the bounds of the canvas
      mileiX = constrain(mileiX, mileiScaledWidth / 2, width - mileiScaledWidth / 2);

      // Fire a projectile if the mouse is pressed within Milei's width and after refractory period
    if (mouseIsPressed && frameCount - lastProjectileFrame > projectileRefractoryPeriod) {
        if (mouseX >= mileiX - mileiScaledWidth / 2 && mouseX <= mileiX + mileiScaledWidth / 2) {
        projectiles.push(new Projectile(projectileImg, mileiX, mileiY, 5, 0.07)); // Adjust velocity and widthFraction as needed
        lastProjectileFrame = frameCount;
        }
    }
}
  
function handlePesos() {
    // Add a new Peso every N frames
    if (frameCount % round(N) === 0){
      pesos.push(new Peso());
    }
  
    // Update, check state, and display each Peso
    for (let i = pesos.length - 1; i >= 0; i--) {
      pesos[i].update();
      pesos[i].updateState();
  
      if (pesos[i].state === 'alive') {
        pesos[i].display();
      } else if (pesos[i].state === 'dead') {
        score += pesos[i].points;
        pesos.splice(i, 1);
      } else if (pesos[i].state === 'passed') {
        score -= pesos[i].points;
        pesos.splice(i, 1);
      }
    }
}

function handleProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      projectiles[i].update();
  
      // Check for collisions with Pesos
      projectiles[i].checkCollision(pesos);
  
      if (projectiles[i].state === 'alive') {
        projectiles[i].display();
      } else {
        // Remove the projectile if it's 'passed' or 'dead'
        projectiles.splice(i, 1);
      }
    }
  }
  

function windowResized() {
    // Recalculate canvas size
    let canvasHeight = windowHeight;
    let canvasWidth = canvasHeight * aspectRatio;
    if (canvasWidth > windowWidth) {
      canvasWidth = windowWidth;
      canvasHeight = canvasWidth / aspectRatio;
    }
    resizeCanvas(canvasWidth, canvasHeight);
  
    // Recalculate Milei's position
    mileiX = width / 2;
    mileiY = height - (milei.height / 2);
}

function mousePressed() {
    if (gameOver) {
      // Reset the game
      gameOver = false;
      score = 0;
      pesos = [];
      projectiles = [];
      // Any other variables to reset
    }
}

function keyPressed() {
    if (keyCode === 32 && !gameOver) { // 32 is the key code for the space bar
      if (frameCount - lastProjectileFrame > projectileRefractoryPeriod) {
        projectiles.push(new Projectile(projectileImg, mileiX, mileiY, 5, 0.07)); // Adjust velocity and widthFraction as needed
        lastProjectileFrame = frameCount;
      }
    }
  }

class Enemy {
    constructor(img, x, y, widthFraction, verticalVelocity, lateralAmplitude, lateralSpeed, points) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.width = widthFraction * width; // Width as a fraction of the canvas width
        this.height = this.img.height * (this.width / this.img.width); // Maintain aspect ratio
        this.verticalVelocity = verticalVelocity;
        this.lateralAmplitude = lateralAmplitude; // Maximum horizontal displacement
        this.lateralSpeed = lateralSpeed; // Speed of horizontal movement
        this.lateralDirection = 1; // 1 for right, -1 for left
        this.centralX = x; // Central X position for cyclical movement
        this.state = 'alive'; // New field for state

        this.points = points;
    }

    updateState() {
        if (this.y > height && this.state === 'alive') {
          this.state = 'passed';
        }
    }

    update() {
        // Update vertical position
        this.y += this.verticalVelocity;

        // Update horizontal position
        this.x += this.lateralSpeed * this.lateralDirection;
        if (Math.abs(this.x - this.centralX) >= this.lateralAmplitude) {
        // Reverse direction when reaching maximum displacement
        this.lateralDirection *= -1;
        }
    }

    display() {
        image(this.img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}


class Peso extends Enemy {
    constructor() {
        // Choose a Peso type based on the probability distribution
        const pesoType = choosePesoType();
        const pesoData = pesoTypes[pesoType];
        const widthFraction = 0.2;
        const lateralAmplitude = 5;
        const lateralSpeed = 1;
  
        // Generate a random x position within the canvas bounds, accounting for the image width
        const minX = (widthFraction * width) / 2;
        const maxX = width - minX;
        const x = random(minX, maxX);
  
        super(pesoData.img, x, -minX, widthFraction, pesoData.velocity, lateralAmplitude, lateralSpeed, pesoData.points);
    }

    
  }
  
  function choosePesoType() {
    let rand = random();
    let cumulative = 0;
    for (let type in pesoProbability) {
      cumulative += pesoProbability[type];
      if (rand < cumulative) {
        return parseInt(type);
      }
    }
    return parseInt(Object.keys(pesoProbability)[0]); // Fallback
  }

  class Projectile {
    constructor(img, x, y, yVelocity, widthFraction) {
      this.img = img;
      this.x = x;
      this.y = y;
      this.yVelocity = yVelocity;
      this.width = widthFraction * width; // Width as a fraction of the canvas width
      this.height = this.img.height * (this.width / this.img.width); // Height scaled to maintain aspect ratio
      this.state = 'alive';
    }
  
    update() {
      if (this.state === 'alive') {
        this.y -= this.yVelocity;
        if (this.y + this.height < 0) {
          this.state = 'passed';
        }
      }
    }
  
    checkCollision(enemies) {
      if (this.state !== 'alive') return;
  
      for (let enemy of enemies) {
        if (enemy.state === 'alive' && enemy.y > 0 && this.collidesWith(enemy)) {
          this.state = 'dead';
          enemy.state = 'dead';
          break; // Assuming one projectile can only hit one enemy
        }
      }
    }
  
    collidesWith(enemy) {
        // Check for overlap in both x and y dimensions
        return (
          this.x + this.width / 2 > enemy.x - enemy.width / 2 &&
          this.x - this.width / 2 < enemy.x + enemy.width / 2 &&
          this.y + this.height > enemy.y - enemy.height / 2 &&
          this.y - this.height < enemy.y + enemy.height / 2
        );
      }
  
    display() {
      if (this.state === 'alive') {
        image(this.img, this.x - this.width / 2, this.y - this.height, this.width, this.height);
      }
    }
  }
  