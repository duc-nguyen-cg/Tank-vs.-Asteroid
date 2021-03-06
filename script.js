const HULL_WIDTH = 40;
const HULL_LENGTH = 80;
const TURRET_SIZE = 16;
const GUN_LENGTH = 56;
const GUN_SIZE = 6.5;
const TANK_SPEED = 7;
const SHELL_SPEED = 15;
const STANDARD_AMMO = 5;
const ASTEROID_SIZE = 15;
const ASTEROID_SPEED = 3;

let obstacleNum = 15;
let fps = 30;
let movePara = 0;
let asteroid_HP = 1;
let score = 0;
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

function getRandomColor() {
    let red = Math.floor(Math.random() * 255);
    let green = Math.floor(Math.random() * 255);
    let blue = Math.floor(Math.random() * 255);
    return "rgb(" + red + "," + blue + "," + green + ")";
}

class Rectangle {
    constructor(x, y, width, length, color) {
        this.width = width;
        this.length = length;
        this.x = x;
        this.y = y;
        this.centerx = this.x + this.width / 2;
        this.centery = this.y + this.length / 2;
        this.color = color;
    }

    getX() {
        return this.x
    }

    getY() {
        return this.y
    }

    getWidth() {
        return this.width
    }

    getLength() {
        return this.length
    }

    setX(x) {
        this.x = x
    }

    setY(y) {
        this.y = y
    }

    setWidth(width) {
        this.width = width
    }

    setLength(length) {
        this.length = length
    }

    setColor(color) {
        this.color = color
    }

    rotate(angle, centx, centy) {
        context.translate(centx, centy);
        context.rotate(angle);
        context.translate(-centx, -centy);
    }

    draw() {
        context.rect(this.x, this.y, this.width, this.length);
        context.fillStyle = this.color;
        context.fill();
    }
}


class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    getX() {return this.x}
    getY() {return this.y}
    getRadius() {return this.radius}
    getColor() {return this.color}

    setX(x) {this.x = x}
    setY(y) {this.y = y}
    setRadius(radius) {this.radius = radius}
    setColor(color) {this.color = color}

    draw() {
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
    }

    rotate(angle) {
        context.translate(this.x, this.y);
        context.rotate(angle);
        context.restore();
    }

}

class Tank {
    constructor(hull, turret, gun, ammo, health) {
        this.component = [hull, turret, gun, ammo]; //list of objects
        this.hull = hull;
        this.turret = turret;
        this.gun = gun;
        this.ammo = ammo;
        this.health = health;
        this.direction = 'Up';
        this.x = this.hull.centerx;
        this.y = this.hull.centery;
        this.loaded = true;
    }
    setX(x) {this.x = x}
    setY(y) {this.y = y}

    setDirection(direction) {
        this.direction = direction;
    }

    init(posx, posy, direction) {
        this.setDirection(direction);
        this.x = posx;
        this.y = posy;
        this.hull.setX(posx - HULL_WIDTH / 2);
        this.hull.setY(posy - HULL_LENGTH / 2);
        this.turret.setX(posx);
        this.turret.setY(posy);
        switch (this.direction) {
            case 'Up':
                this.gun.x = posx - GUN_SIZE / 2;
                this.gun.y = posy - (TURRET_SIZE + GUN_LENGTH);
                break;
            case 'Down':
                this.gun.x = posx - GUN_SIZE / 2;
                this.gun.y = posy + (TURRET_SIZE);
                break;
        }
        this.ammo.setX(-10000);
        this.ammo.setY(-10000);
    }

    draw() {
        for (let obj of this.component) {
            context.beginPath();
            obj.draw();
            context.closePath();
        }
    }

    rotate(angle) {
        this.hull.rotate(angle, this.x, this.y);
    }

    //move
    moveLeft(pixel) {
        this.x -= pixel;
        for (let obj of this.component) {
            obj.setX(obj.x - pixel);
        }
    }

    moveRight(pixel) {
        this.x += pixel;
        for (let obj of this.component) {
            obj.setX(obj.x + pixel);
        }
    }

    moveUp(pixel) {
        this.y -= pixel;
        for (let obj of this.component) {
            obj.setY(obj.y - pixel);
        }
    }

    moveDown(pixel) {
        this.y += pixel;
        for (let obj of this.component) {
            obj.setY(obj.y + pixel);
        }
    }

    //wrap the screen
    collideEdge() {
        let posx = this.x;
        let posy = this.y;
        if (posy < HULL_LENGTH/2) {
            this.init(posx, canvas.height - (HULL_LENGTH / 2), 'Up');
        } else if (posy > canvas.height - (HULL_LENGTH / 2)) {
            this.init(posx, HULL_LENGTH / 2, 'Up');
        }
        if (posx < HULL_WIDTH/2) {
            this.init(canvas.width - HULL_WIDTH / 2, posy, 'Up');
        } else if (posx > canvas.width - HULL_WIDTH / 2) {
            this.init(HULL_WIDTH / 2, posy, 'Up');
        }
    }
    //if collide with an obstacle
    collideObstacle(obstacle) {
        let posx = this.x;
        let posy = this.y;
        for (let asteroid of obstacle) {
            if (Math.abs(posx - asteroid.x) <= (HULL_WIDTH / 2 + asteroid.radius) &&
                Math.abs(posy - asteroid.y) <= (HULL_LENGTH / 2 + asteroid.radius)) {
                this.health--;
                this.hull.setColor(asteroid.color);
                asteroid.setX(Math.floor(Math.random() * canvas.width));
                asteroid.setY(-ASTEROID_SIZE*2);
                asteroid.setColor(getRandomColor());
            }
        }
    }
    //load and shoot
    loadAmmo() {
        if (this.loaded == false){
            this.ammo.x = this.gun.x + GUN_SIZE / 2;
            this.ammo.y = this.gun.y;
            this.loaded = true;
        }
    }

    shoot() {
        if (this.loaded == true){
            var intervalId = setInterval(() => {
                this.ammo.y -= SHELL_SPEED;
            }, fps);
        }
        if(this.ammo.y < 0){
            clearInterval(intervalId);
            this.loaded = false;
            this.ammo.x = -10000;
            this.ammo.y = -10000;
        }
    }
    //die if health runs out
    die() {
        if (this.health == 0 ) {
            bgsound.pause();
            losesound.play();
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 1000; i++) {
                setTimeout(function () {
                    context.font = "30px Arial";
                    context.fillText("Btooom!", canvas.width / 2 - 30, canvas.height / 2);
                }, fps)
            }
            score = 0;
            movePara = 0;
            obstacleNum = 15;
            asteroid_HP = 1;
            let replay = confirm("You died. Do you want to restart?");
            if (replay == true) {
                initObstacle(obstacle);
                bgsound.currentTime = 0;
                bgsound.play();
                this.init(canvas.width / 2, canvas.height - HULL_LENGTH, 'Up');
                this.health = STANDARD_AMMO;
            } else {
                for (let i = 0; i < 1000; i++) {
                    setTimeout(function () {
                        context.font = "30px Arial";
                        context.fillText("Btooom!", canvas.width / 2 - 30, canvas.height / 2);
                    }, fps)
                }
            }
        }
    }
}

class Shell {
    constructor(type, damage) {
        this.type = type;
        this.damage = damage;
        this.x = -10000;
        this.y = -10000;
    }

    setX(x) {
        this.x = x
    }

    setY(y) {
        this.y = y
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, GUN_SIZE / 2, 0, 2 * Math.PI);
        if (this.type == 'AP') {
            context.fillStyle = 'blue';
        } else if (this.type == 'APCR') {
            context.fillStyle = 'red';
        } else if (this.type == 'HE') {
            context.fillStyle = 'black';
        }
        context.fill();
        context.closePath();
    }
    //bullet destroys an obstacle (gain 1 heart)
    collide(obstacle) {
        for (let asteroid of obstacle) {
            if (Math.abs(this.x - asteroid.x) <= (GUN_SIZE / 2 + ASTEROID_SIZE) &&
                Math.abs(this.y - asteroid.y) <= (GUN_SIZE / 2 + ASTEROID_SIZE)) {
                explosionsound.play();
                this.setX(-10000);
                this.setY(-10000);
                asteroid.setX(Math.floor(Math.random() * canvas.width));
                asteroid.setY(-ASTEROID_SIZE*2);
                asteroid.setColor(getRandomColor());
                tiger.health += asteroid_HP;
            }
        }
    }
}

function display(objList) {
    context.clearRect(0, 0, 3 * canvas.width, 3 * canvas.height);
    for (let obj of objList) {
        context.beginPath();
        obj.draw();
        context.closePath();
    }
}

function control(evt) {
    switch (evt.keyCode) {
        case 37:
            tiger.moveLeft(TANK_SPEED);
            break;
        case 39:
            tiger.moveRight(TANK_SPEED);
            break;
        case 38:
            tiger.moveUp(TANK_SPEED);
            break;
        case 40:
            tiger.moveDown(TANK_SPEED);
            break;
        case 69:
            tiger.loadAmmo();
            break;
        case 68:
            tiger.shoot();
            break;
    }
}

function initObstacle(obstacle) {
    for (let asteroid of obstacle) {
        asteroid.setX(Math.floor(Math.random() * canvas.width));
        asteroid.setY(-Math.floor(Math.random() * canvas.height));
        asteroid.setColor(getRandomColor());
    }
}

function resetObstacle() {
    for (let asteroid of obstacle){
        if (asteroid.y > canvas.height + ASTEROID_SIZE+movePara) {
            asteroid.setY(-ASTEROID_SIZE);
            asteroid.setX(Math.floor(Math.random() * canvas.width));
        }
    }
}
//hard and easy mod
function beCrazy(){
    if (score > 500 || tiger.health > STANDARD_AMMO+2){
        movePara = ASTEROID_SPEED/2;
        obstacleNum = 30;
        asteroid_HP = 0;
    }
}

function beEasy(){
    if (tiger.health < STANDARD_AMMO-2 ){
        movePara = 0;
        obstacleNum = 15;
        asteroid_HP = 1;
    }
}

function render() {
    //draw
    for (let index in obstacle) {
        let thisAsteroid = obstacle[index];
        thisAsteroid.setY(thisAsteroid.y + ASTEROID_SPEED)
        if (index < obstacle.length/2){
            thisAsteroid.setX(thisAsteroid.x + movePara);
        } else {
            thisAsteroid.setX(thisAsteroid.x - movePara);
        }
    }
    display(objList);
    //events
    tiger.collideEdge();
    tiger.collideObstacle(obstacle);
    tiger.die();
    ap.collide(obstacle);
    resetObstacle();
    beCrazy();
    beEasy();
    //display results
    score++;
    document.getElementById('heart').innerHTML = 'HEART: '+(tiger.health);
    document.getElementById('score').innerHTML = 'SCORE: '+score;
}

function start() {
    bgsound.play();
    bgsound.loop = true;
    setInterval(function () {
        render();
    }, fps);
}


let hull1 = new Rectangle(100, 100, HULL_WIDTH, HULL_LENGTH, 'green');
let turret1 = new Circle(100, 100, TURRET_SIZE, 'yellow');
let gun1 = new Rectangle(100, 100, GUN_SIZE, GUN_LENGTH, 'black');
let ap = new Shell('AP', 5);
let tiger = new Tank(hull1, turret1, gun1, ap, STANDARD_AMMO);
tiger.init(canvas.width / 2, canvas.height - HULL_LENGTH, 'Up');
let objList = [tiger];
let obstacle = [];
for (let i = 1; i <= obstacleNum; i++) {
    let asteroid = new Circle(Math.floor(Math.random() * canvas.width), -Math.floor(Math.random() * canvas.height),
        Math.floor(Math.random()*ASTEROID_SIZE*2)+10, getRandomColor());
    obstacle.push(asteroid);
    objList.push(asteroid);
}

//add sound effect
const explosionsound = document.createElement('audio');
explosionsound.src = 'explosion-sound.mp3';
const losesound = document.createElement('audio');
losesound.src = 'lose-sound.mp3';
const bgsound = document.createElement('audio');
bgsound.src = 'panzerlied.mp3';

window.addEventListener('keydown', control);

