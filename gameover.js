
var can;

var go;

var goFont;
function preload() {
  goFont = loadFont('assets/Gameplay.ttf');
  frameRate(60);
}

function setup(){
  can = createCanvas(innerWidth,innerHeight);
  can.parent("game_canvas");
  go = new GO();

  background(0);

}

function draw(){

  for(var i = 0 ; i < 100 ; i++){
    stroke(random(0,255),random(0,255),random(0,255));
    strokeWeight(1);
    line(random(0,width),random(0,height),random(0,width),random(0,height));
  }

  var grid = 20;

  // for(var y = 0 ; y < height/grid ; y++)
  //   for(var x = 0 ; x < width/grid ; x++){
  //     fill(random(0,255),100,200);
  //     rect(x * grid,y * grid,grid,grid);
  // }

  noStroke();
  go.update();
  go.draw();




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


  console.log(this.vel.x,this.vel.y);

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
