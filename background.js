var can;

var go;

var goFont;

var stars;

var score;

var gameover = false;

var explosions;

var life,shield;

function preload() {

  goFont = loadFont('assets/Gameplay.ttf');

  frameRate(60);

}
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    explosions.addExplosion(random(0,width),random(0,height));
  }
}



function setup(){

  can = createCanvas(innerWidth,innerHeight);

  go = new GO();

  stars = new Stars();

  score = new Score();

  explosions = new Explosions();

  life = new Bar(width/2,20,0,10,color(40,255,100));

}

var scoreVal = 0;

function draw(){

  background(2);

  if(random(0,1) < 0.5){
    for(var star = 0 ; star < 30 ; star++){
      stars.addStar();
    }
  }

  noStroke();

  if(gameover){
    go.update();
    go.draw();
    life.curr = 10;
    life.col = color(40,255,random(100,120));
    // explosions.update();
  }

  stars.draw();

  score.draw();

  life.draw();
}

function Explosions(){
    this.explosions = [];
}

Explosions.prototype.addExplosion = function(x,y){
    this.explosions.push(new Explosion(x,y,random(1,5)));
}

Explosions.prototype.update = function(){
    for(var i = 0; i < this.explosions.length ; i++){
      this.explosions[i].update();
    }
}

function Explosion(x,y,sub){
    this.pos = createVector(x,y);
    this.sub = [];

    for(var i =0 ; i < sub ; i++)
      this.sub.push({x:this.pos.x + random(-100,100),y:this.pos.y + random(-100,100),s:random(50,100),l:random(0,100)});

}

Explosion.prototype.update = function(){
  for(var se = this.sub.length-1 ; se > 0  ; se--){
    this.sub[se].l--;
    fill(random(0,255));
    ellipse(this.sub[se].x,this.sub[se].y,this.sub[se].s--);
    if(this.sub[se].l <= 1)
      this.sub.splice(se,1);
  }
}


function Stars(){
  this.stars = [];
}

Stars.prototype.addStar = function(){
  this.stars.push(new Star(random(0,width),random(0,height),random(0,200),random(5,10),random(5,40)));
}

Stars.prototype.draw = function(){
  for(var star = this.stars.length-1 ; star > 0  ; star--){
    this.stars[star].draw();
    if(this.stars[star].life <= 0)
      this.stars.splice(star,1);
  }
}

function Star(x,y,l,s,sp){

  this.pos = createVector(x,y);
  this.dir = createVector(0,0);

  this.slife = l;
  this.life = l;
  this.size = s;

  if(floor(random(1,2)) === 1){
    this.dir.set(sp,0);
    this.stretch = 0;
    if(random(0,1) < 0.5){
      this.pos.x = -100;
    } else {
      this.pos.y = -50;
    }
  }

}

Star.prototype.draw = function(){
  this.pos.add(this.dir);
  this.life--;
  if(this.life > 0){
    fill(map(this.life,0,255,0,this.slife));
    ellipse(this.pos.x,this.pos.y,this.size+this.stretch,this.size);
  }
}

function Score(){
  this.currentScore = 0;
  this.burst = [];
}

Score.prototype.update = function(score){
  this.currentScore = score;
}

Score.prototype.draw   = function(){

  textAlign(LEFT);
  textFont(goFont);
  textSize(width/20);

  if(this.currentScore % 5000 === 0 && this.currentScore > 0){
    this.addBurst();
  }

  for(var i = this.burst.length-1 ; i > -1  ; i--){
    this.burst[i].draw();
    if(this.burst[i].l <= 0)
      this.burst.splice(i,1);
  }


  var sc = (this.currentScore + "").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  fill(random(0,255),random(0,255),random(0,255));
  text('SCORE: ' + sc, 20,110);

}

Score.prototype.addBurst = function(){
  this.burst.push(new Burst(random(100,width-100),random(100,height-100)));
}

//////////////////////////////////////////////////////////
function Burst(x,y){
  this.p = [];
  this.l = random(100,400);
  this.sl = this.l;

  for(var i = 0 ; i < random(20,30); i++){
    this.p.push({x:random(-20,20),y:random(-20,20),pos:createVector(x,y)});
  }

}

Burst.prototype.draw = function(){
  for(var i = 0 ; i < this.p.length ; i++){
    fill(random(0,255),200,random(0,255));
    this.p[i].pos.x += this.p[i].x;
    this.p[i].pos.y += this.p[i].y;
    this.l-=0.5;
    ellipse(this.p[i].pos.x,this.p[i].pos.y,map(this.l,0,this.sl,0,30));
  }
}

///////////////////////////////////////////////////////
function Bar(x,y,min,max,col){
  this.pos = createVector(x,y);
  this.level = createVector(min,max);
  this.size = createVector((width/2-20),50);
  this.cur = max;
  this.col = col;
}

Bar.prototype.draw = function(){

  if(this.cur >= 0){
    fill(this.col);
    rect(this.pos.x + (width/2)*(1-((1/this.level.y)*this.cur)),this.pos.y,this.size.x - (width/2)*(1-((1/this.level.y)*this.cur)),this.size.y);

    textAlign(RIGHT);
    textFont(goFont);
    textSize(30);

    fill(255);
    text(this.cur, width-100, this.pos.y+40);
  }

}

function GO(){

  this.text = "GAMEOVER";
  this.pos = createVector(20,20);

  this.box = {x1:0,y1:0,x2:0,y2:0}

  this.vel = createVector(-10,10);

}

GO.prototype.update = function(){

  if(this.box.x1 <= 0 || this.pos.x + this.box.x2 >= width){
    this.vel.x *= -1;
  }

  if(this.box.y1 <= 0 || this.pos.y + this.box.y2 >= height){
    this.vel.y *= -1;
  }

  this.pos.add(this.vel);

  this.box.x1 = this.pos.x;
  this.box.y1 = this.pos.y;

  this.box.x2 = 1200;
  this.box.y2 = 180;

}

GO.prototype.draw = function(){

  textAlign(LEFT);
  textFont(goFont);
  textSize(width/10);

  fill(random(0,255),random(0,255),random(0,255));
  text('GAMEOVER', this.pos.x, this.pos.y + 180);

  if(random(0,1) > 0.5){
    fill('#000');
    text('GAMEOVER', this.pos.x+random(-10,10), this.pos.y+random(-10,10) + 180);
  }
}
