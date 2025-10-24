/* 
   Happy Birthday Celebration Animation Script
   This script animates fireworks, balloons, and a greeting card using the HTML5 canvas.
   It also includes branch and flower animations using GSAP.
*/

// Get references to the main container and the canvas element.
var mainContainer = document.querySelector(".main-container"); 
var c = document.getElementById('c');

// Use full-window canvas for all effects to avoid duplicate canvas/context issues
function resizeCanvasToWindow() {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}
resizeCanvasToWindow();

var w = c.width;
var h = c.height;
var ctx = c.getContext('2d');

// Calculate half dimensions for centering.
var hw = w / 2; // half-width
var hh = h / 2;

// Audio objects (looping). Do not auto-play immediately — start at proper times.
var windAudio = new Audio('wind.mp3');
windAudio.loop = true;
var meowAudio = new Audio('happy birthday_meow.mp3');
meowAudio.loop = true;
var meowAudioStarted = false;
var windAudioStarted = false;

// Animation configuration options.
var opts = {
  strings: [ 'HAPPY', 'BIRTHDAY', 'JAHNVI' ],
  charSize: 40,
  // Reduced spacing between characters (smaller = tighter)
  charSpacing: 20,
  lineHeight: 40,
  cx: w / 2,
  cy: h / 2,
  
  fireworkPrevPoints: 10,           // Trail points for fireworks effect.
  fireworkBaseLineWidth: 5,         // Line width base value.
  fireworkAddedLineWidth: 8,        // Additional random line width.
  fireworkSpawnTime: 400,           // Increased delay before spawning fireworks
  fireworkBaseReachTime: 60,        // Slower reach to target
  fireworkAddedReachTime: 60,       // Additional reach time variance
  fireworkCircleBaseSize: 20,       // Base size for explosion circle.
  fireworkCircleAddedSize: 10,      // Random added size for circle.
  fireworkCircleBaseTime: 60,       // Slower explosion circle growth
  fireworkCircleAddedTime: 60,      // Explosion circle time variation
  fireworkCircleFadeBaseTime: 20,   // Slower circle fade out
  fireworkCircleFadeAddedTime: 10,  // Additional fade time variability
  fireworkBaseShards: 5,            // Base shard count for explosion.
  fireworkAddedShards: 5,           // Additional shard count.
  fireworkShardPrevPoints: 3,       // Trail points for shards.
  fireworkShardBaseVel: 4,          // Base velocity for shards.
  fireworkShardAddedVel: 2,         // Additional shard velocity.
  fireworkShardBaseSize: 3,         // Base shard size.
  fireworkShardAddedSize: 3,        // Additional shard size.
  gravity: .1,                    // Gravity effect on shards.
  upFlow: -.1,                    // Upward force for balloons.
  letterContemplatingWaitTime: 720, // Wait before balloon phase remains the same, or adjust if needed
  balloonSpawnTime: 80,             // Increased delay before each balloon spawns (was 40)
  balloonBaseInflateTime: 40,       // Slower inflation time for balloons (was 20)
  balloonAddedInflateTime: 40,      // Increased variability in inflation time (was 20)
  balloonBaseSize: 20,
  balloonAddedSize: 20,
  balloonBaseVel: 0.2,              // Reduced base drift velocity (was 0.4)
  balloonAddedVel: 0.2,             // Reduced additional drift velocity (was 0.4)
  balloonBaseRadian: -( Math.PI / 2 - .5 ),  // Base angle for balloon movement.
  balloonAddedRadian: -1,         // Angle randomness.
},
calc = {
  // update totalWidth to match new spacing
  totalWidth: opts.charSpacing * Math.max( opts.strings[0].length, opts.strings[1].length, opts.strings[2].length )
},

// Useful constants for full rotation and quarter values.
Tau = Math.PI * 2,
TauQuarter = Tau / 4,
letters = [];  // Array to store all animated Letter objects.

// Initialize the canvas font.
ctx.font = opts.charSize + 'px Verdana';

/* 
   Letter Constructor:
   Represents a single animated character.
   Makes use of different phases: firework, contemplate, and balloon.
*/
function Letter( char, x, y ){
  this.char = char;
  this.x = x;
  this.y = y;
  
  // Adjust for width to center the letter.
  this.dx = -ctx.measureText( char ).width / 2;
  this.dy = +opts.charSize / 2;
  
  // Calculate vertical offset for the firework animation.
  this.fireworkDy = this.y - hh;
  
  // Use x-position to vary hue.
  var hue = x / calc.totalWidth * 360;
  
  // Set color properties used in different phases.
  this.color = 'hsl(hue,80%,50%)'.replace( 'hue', hue );
  this.lightAlphaColor = 'hsla(hue,80%,light%,alp)'.replace( 'hue', hue );
  this.lightColor = 'hsl(hue,80%,light%)'.replace( 'hue', hue );
  this.alphaColor = 'hsla(hue,80%,50%,alp)'.replace( 'hue', hue );
  
  // Initialize animation state.
  this.reset();
}

/* 
   Reset method:
   Sets the letter back to its initial firework phase.
*/
Letter.prototype.reset = function(){
  this.phase = 'firework';
  this.tick = 0;
  this.spawned = false;
  this.spawningTime = opts.fireworkSpawnTime * Math.random() | 0;
  this.reachTime = opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random() | 0;
  this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
  this.prevPoints = [ [ 0, hh, 0 ] ];
}

/* 
   Step method:
   Advances the letter's animation based on its current phase.
*/
Letter.prototype.step = function(){
  if( this.phase === 'firework' ){
    if( !this.spawned ){
      ++this.tick;
      if( this.tick >= this.spawningTime ){
        this.tick = 0;
        this.spawned = true;
      }
    } else {
      ++this.tick;
      // Calculate progress along trajectory.
      var linearProportion = this.tick / this.reachTime,
          armonicProportion = Math.sin( linearProportion * TauQuarter ),
          x = linearProportion * this.x,
          y = hh + armonicProportion * this.fireworkDy;
      
      // Record previous points to draw a trail.
      if( this.prevPoints.length > opts.fireworkPrevPoints )
        this.prevPoints.shift();
      this.prevPoints.push( [ x, y, linearProportion * this.lineWidth ] );
      
      var lineWidthProportion = 1 / ( this.prevPoints.length - 1 );
      for( var i = 1; i < this.prevPoints.length; ++i ){
        var point = this.prevPoints[ i ],
            point2 = this.prevPoints[ i - 1 ];
        ctx.strokeStyle = this.alphaColor.replace( 'alp', i / this.prevPoints.length );
        ctx.lineWidth = point[ 2 ] * lineWidthProportion * i;
        ctx.beginPath();
        ctx.moveTo( point[ 0 ], point[ 1 ] );
        ctx.lineTo( point2[ 0 ], point2[ 1 ] );
        ctx.stroke();
      }
      
      if( this.tick >= this.reachTime ){
        // Transition to the 'contemplate' phase (explosion effect).
        this.phase = 'contemplate';
        this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime = opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random() | 0;
        this.circleCreating = true;
        this.circleFading = false;
        this.circleFadeTime = opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random() | 0;
        this.tick = 0;
        this.tick2 = 0;
        
        // Initialize explosion shards.
        this.shards = [];
        var shardCount = opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random() | 0,
            angle = Tau / shardCount,
            cos = Math.cos( angle ),
            sin = Math.sin( angle ),
            x = 1,
            y = 0;
        for( var i = 0; i < shardCount; ++i ){
          var x1 = x;
          x = x * cos - y * sin;
          y = y * cos + x1 * sin;
          this.shards.push( new Shard( this.x, this.y, x, y, this.alphaColor ) );
        }
      }
    }
  } else if( this.phase === 'contemplate' ){
    ++this.tick;
    if( this.circleCreating ){
      // Create explosion circle that grows.
      ++this.tick2;
      var proportion = this.tick2 / this.circleCompleteTime,
          armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor.replace( 'light', 50 + 50 * proportion ).replace( 'alp', proportion );
      ctx.arc( this.x, this.y, armonic * this.circleFinalSize, 0, Tau );
      ctx.fill();
      if( this.tick2 > this.circleCompleteTime ){
        this.tick2 = 0;
        this.circleCreating = false;
        this.circleFading = true;
      }
    } else if( this.circleFading ){
      // Fade out the explosion circle and display the final character.
      ctx.fillStyle = this.lightColor.replace( 'light', 70 );
      ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
      ++this.tick2;
      var proportion = this.tick2 / this.circleFadeTime,
          armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor.replace( 'light', 100 ).replace( 'alp', 1 - armonic );
      ctx.arc( this.x, this.y, this.circleFinalSize, 0, Tau );
      ctx.fill();
      if( this.tick2 >= this.circleFadeTime )
        this.circleFading = false;
    } else {
      // Once fading is done, simply draw the character.
      ctx.fillStyle = this.lightColor.replace( 'light', 70 );
      ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
    }
    
    // Process each explosion shard.
    for( var i = 0; i < this.shards.length; ++i ){
      this.shards[ i ].step();
      if( !this.shards[ i ].alive ){
        this.shards.splice( i, 1 );
        --i;
      }
    }
    
    // Transition to the balloon phase after waiting.
    if( this.tick > opts.letterContemplatingWaitTime ){
      this.phase = 'balloon';
      this.tick = 0;
      this.spawning = true;
      this.spawnTime = opts.balloonSpawnTime * Math.random() | 0;
      this.inflating = false;
      this.inflateTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() | 0;
      this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random() | 0;
      
      // Randomize balloon movement vectors.
      var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
          vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
      this.vx = Math.cos( rad ) * vel;
      this.vy = Math.sin( rad ) * vel;
    }
  } else if( this.phase === 'balloon' ){
    // Animate the balloon phase, simulating a floating balloon.
    ctx.strokeStyle = this.lightColor.replace( 'light', 80 );
    if( this.spawning ){
      ++this.tick;
      ctx.fillStyle = this.lightColor.replace( 'light', 70 );
      ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
      if( this.tick >= this.spawnTime ){
        this.tick = 0;
        this.spawning = false;
        this.inflating = true;	
      }
    } else if( this.inflating ){
      ++this.tick;
      var proportion = this.tick / this.inflateTime,
          x = this.cx = this.x,
          y = this.cy = this.y - this.size * proportion;
      ctx.fillStyle = this.alphaColor.replace( 'alp', proportion );
      ctx.beginPath();
      generateBalloonPath( x, y, this.size * proportion );
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo( x, y );
      ctx.lineTo( x, this.y );
      ctx.stroke();
      ctx.fillStyle = this.lightColor.replace( 'light', 70 );
      ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
      if( this.tick >= this.inflateTime ){
        this.tick = 0;
        this.inflating = false;
      }
    } else {
      // Continue floating with the defined velocity.
      this.cx += this.vx;
      this.cy += this.vy += opts.upFlow;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      generateBalloonPath( this.cx, this.cy, this.size );
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo( this.cx, this.cy );
      ctx.lineTo( this.cx, this.cy + this.size );
      ctx.stroke();
      ctx.fillStyle = this.lightColor.replace( 'light', 70 );
      ctx.fillText( this.char, this.cx + this.dx, this.cy + this.dy + this.size );
      if( this.cy + this.size < -hh || this.cx < -hw || this.cy > hw  )
        this.phase = 'done';
    }
  }
}

/* 
   Shard Constructor:
   Represents a fragment created during the explosion.
*/
function Shard( x, y, vx, vy, color ){
  var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
  this.vx = vx * vel;
  this.vy = vy * vel;
  this.x = x;
  this.y = y;
  this.prevPoints = [ [ x, y ] ];
  this.color = color;
  this.alive = true;
  this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
}

/* 
   Shard step method:
   Updates the shard's position, draws its fading trail, and checks for its lifespan.
*/
Shard.prototype.step = function(){
  this.x += this.vx;
  this.y += this.vy += opts.gravity;
  if( this.prevPoints.length > opts.fireworkShardPrevPoints )
    this.prevPoints.shift();
  this.prevPoints.push( [ this.x, this.y ] );
  
  var lineWidthProportion = this.size / this.prevPoints.length;
  for( var k = 0; k < this.prevPoints.length - 1; ++k ){
    var point = this.prevPoints[ k ],
        point2 = this.prevPoints[ k + 1 ];
    ctx.strokeStyle = this.color.replace( 'alp', k / this.prevPoints.length );
    ctx.lineWidth = k * lineWidthProportion;
    ctx.beginPath();
    ctx.moveTo( point[ 0 ], point[ 1 ] );
    ctx.lineTo( point2[ 0 ], point2[ 1 ] );
    ctx.stroke();
  }
  if( this.prevPoints[ 0 ][ 1 ] > hh )
    this.alive = false;
}

/* 
   Generates the balloon shape using bezier curves.
*/
function generateBalloonPath( x, y, size ){
  ctx.moveTo( x, y );
  ctx.bezierCurveTo( x - size / 2, y - size / 2,
                     x - size / 4, y - size,
                     x,         y - size );
  ctx.bezierCurveTo( x + size / 4, y - size,
                     x + size / 2, y - size / 2,
                     x,         y );
}

// Flag to ensure the greeting card is shown only once.
var cardShown = false;

/* 
   Main animation loop:
   Clears the canvas, advances letter animations, and triggers the card display.
*/
function anim(){
  window.requestAnimationFrame( anim );

  // Start the birthday/meow audio once when animation begins.
  if( !meowAudioStarted ){
    meowAudio.play().catch(()=>{/* play may be blocked until user interaction */});
    meowAudioStarted = true;
  }

  // Clear full canvas
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#111';
  ctx.fillRect( 0, 0, w, h );
  
  // Center the coordinate system.
  ctx.save();
  ctx.translate( hw, hh );
  
  var done = true;
  for( var l = 0; l < letters.length; ++l ){
    letters[ l ].step();
    if( letters[ l ].phase !== 'done' )
      done = false;
  }
  
  ctx.restore();
  
  if( done && !cardShown) {
    document.querySelector('.card').classList.add('show');
    cardShown = true;
  }
  
  if( done )
    for( var l = 0; l < letters.length; ++l )
      if( typeof letters[ l ].stop === 'function' )
        letters[ l ].stop();
}

// --- Responsive text layout helpers ---
// Rebuilds opts.charSize and opts.charSpacing to fit within canvas and centers text.
function computeTextLayout() {
  var maxChars = Math.max( opts.strings[0].length, opts.strings[1].length, opts.strings[2].length );
  var baseSpacing = 52;      // design spacing for large screens
  var baseCharSize = 44;     // design char size for large screens
  var maxAllowedWidth = Math.max( Math.min(w * 0.85, 1200), 200 ); // keep some margins, but not too small

  // Determine charSpacing so the longest line fits into maxAllowedWidth
  var spacing = Math.floor( Math.min(baseSpacing, maxAllowedWidth / maxChars) );
  // Make charSize proportional but not larger than baseCharSize
  var charSize = Math.floor( Math.min(baseCharSize, spacing * 0.9) );

  opts.charSpacing = Math.max(12, spacing); // lower bound so letters don't overlap
  opts.charSize = Math.max(12, charSize);

  // Update canvas font immediately
  ctx.font = opts.charSize + 'px Verdana';

  // recalc center coords
  opts.cx = w / 2;
  opts.cy = h / 2;
}

// Replace/build the letter positioning so spacing is applied correctly and text is centered
function buildLetters() {
  letters = [];
  for (var i = 0; i < opts.strings.length; ++i) {
    var str = opts.strings[i];
    // center the string horizontally around x=0
    var startX = -((str.length - 1) * opts.charSpacing) / 2;
    // center the lines vertically around y=0
    var startY = -((opts.strings.length - 1) * opts.lineHeight) / 2;
    for (var j = 0; j < str.length; ++j) {
      var x = startX + j * opts.charSpacing;
      var y = startY + i * opts.lineHeight;
      letters.push(new Letter(str[j], x, y));
    }
  }
}

// Build letters once at startup
computeTextLayout();
buildLetters();

// Replace the old immediate anim start with this unchanged call
anim();

// Update resize handler to recompute layout & rebuild letters
window.addEventListener('resize', function(){
  resizeCanvasToWindow();
  w = c.width = c.width;
  h = c.height = c.height;
  hw = w / 2;
  hh = h / 2;

  // recompute responsive text layout and rebuild letters
  computeTextLayout();
  buildLetters();

  ctx.font = opts.charSize + 'px Verdana';
});

// GSAP animations for branch and flower effects
const branchesRandomOrder = $('[id^=BranchGroup]').toArray().sort(function(){ return 0.5 - Math.random() });
const branchesRandomOrderLeft = $('[id^=BranchGroup-left]').toArray().sort(function(){ return 0.5 - Math.random() });
const branchesRandomOrderRight = $('[id^=BranchGroup-right]').toArray().sort(function(){ return 0.5 - Math.random() });


// Make happy-birthday canvas animation 1.5x faster
// (increase >1 -> faster). This divides time-related options by the factor.
const HBD_SPEED = 1.5;
(function applyHbdSpeed() {
  if (!HBD_SPEED || HBD_SPEED === 1) return;
  const s = HBD_SPEED;
  // keys that represent time/delay durations (divide them to speed up)
  const timeKeys = [
    'fireworkSpawnTime',
    'fireworkBaseReachTime',
    'fireworkAddedReachTime',
    'fireworkCircleBaseTime',
    'fireworkCircleAddedTime',
    'fireworkCircleFadeBaseTime',
    'fireworkCircleFadeAddedTime',
    'letterContemplatingWaitTime',
    'balloonSpawnTime',
    'balloonBaseInflateTime',
    'balloonAddedInflateTime'
  ];
  timeKeys.forEach(key => {
    if (opts[key] !== undefined && typeof opts[key] === 'number') {
      // keep integers and a sensible minimum
      opts[key] = Math.max(1, Math.round(opts[key] / s));
    }
  });
})();
  
// MASTER TIMELINE to control branch and flower animations.
const master = new TimelineMax();
master
  .add(mainSetUp)
  .add(branchMaster);
  
function branchMaster() {
  const tl = new TimelineMax();
  tl
    .add(wholeBranchGrowIn)
    // Start wind audio once after the flower/branch grow animation finishes
    .call(function() { 
      if( !windAudioStarted ) {
        windAudio.play().catch(()=>{/* may be blocked until interaction */});
        windAudioStarted = true;
      }
    })
    .add(smallBranchesSway)
    // Start petals only after branches/flowers finished growing/swaying
    .call(startPetals);
  return tl;
}

function mainSetUp() {
  const tl = new TimelineMax();
  tl
    .set('[id^=petal-]', { fill: "#e5d081" })  // Set the default petal color.
    .set(['[id^=flower-]', '[id^=bud-]', '[id^=bloom-]'], { scale: 0,  transformOrigin: 'center center' })
    .set(branchesRandomOrderLeft, { transformOrigin: 'bottom left' })
    .set(branchesRandomOrderRight, { transformOrigin: 'bottom right' })
    .set('#BranchGroup-left-1', { transformOrigin: '0% 20%' })
    .set('#BranchGroup-right-12', { transformOrigin: '100% 20%' })
    .set(branchesRandomOrder, { scale: 0 })
    .set(".container", { autoAlpha: 1 });
  return tl;
}

function wholeBranchGrowIn() {
  const tl = new TimelineMax();
  tl.staggerTo(branchesRandomOrder, 3, { scale: 1, ease: Power1.easeOut, onStart: flowersBloom, onComplete: currentBranchSwaying }, 0.25);
  return tl;
}

function flowersBloom() {
  const tl = new TimelineMax({ delay: 1.5 });
  const currentBranch = $(this.target);
  const petals = currentBranch.find('[id^=petal-]');
  const flowers = currentBranch.find('[id^=flower-]');
  const buds = currentBranch.find('[id^=bud-]');
  const blooms = currentBranch.find('[id^=bloom-]');
  
  tl
    .staggerTo([flowers, buds, blooms], 2, { scale: 1, ease: Back.easeOut.config(2) }, 0.5, 0)
    .to(flowers, 3, { rotation: 45, ease: Sine.easeOut }, 0)
    .to(petals, 1, { fill: "#fff" }, 0);
  return tl;
}

function currentBranchSwaying() {
  const tl = new TimelineMax({ yoyo: true, repeat: -1 });
  const currentBranch = $(this.target);
  var currentBranchRotation = (currentBranch.data('position') === "left") ? -10 : 
                              (currentBranch.data('position') === "right") ? 5 : 10;
  tl.staggerTo(currentBranch, 2 + Math.random(), { rotation: currentBranchRotation, ease: Sine.easeInOut }, Math.random() / 1.2);
  return tl;  
}

function smallBranchesSway() {
  const smallBranches = $('[id^=smallbranch-group]').toArray();
  const tl = new TimelineMax({ yoyo: true, repeat: -1 });
  tl
    .staggerTo(smallBranches, 2 + Math.random(), { rotation: 5, ease: Sine.easeInOut }, Math.random() / 1.2, 'smallBranchSway')
    .to('#smallbranch-group-3-B, #smallbranch-group-8-A', 1 + Math.random(), { rotation: -5, transformOrigin: '100% 50%' }, 'smallBranchSway')
    .to('#smallbranch-group-5-A', 2 + Math.random(), { rotation: -5, transformOrigin: '50% 100%' }, 'smallBranchSway')
    .to('#smallbranch-group-2-C, #smallbranch-group-A, #smallbranch-group-12-A', 2 + Math.random(), { rotation: -5, transformOrigin: '100% 100%' }, 'smallBranchSway');
  return tl;
}

// Petal image / falling petals use the same canvas and ctx — reuse existing vars
const TOTAL = 10;
const petalArray = [];

let petalLoaded = false;
let petalStarted = false;
let petalStartRequested = false;

const petalImg = new Image();
petalImg.src = 'https://djjjk9bjm164h.cloudfront.net/petal.png';
petalImg.addEventListener('load', () => {
  for (let i = 0; i < TOTAL; i++) {
    petalArray.push(new Petal());
  }
  petalLoaded = true;
  // only start render if requested by timeline
  if (petalStartRequested && !petalStarted) {
    petalStarted = true;
    render();
  }
});

function startPetals() {
  petalStartRequested = true;
  if (petalLoaded && !petalStarted) {
    petalStarted = true;
    render();
  }
}

function render() {
  if (!petalStarted) return;
  // do NOT clear the whole canvas here (it would erase the other animation).
  // Instead draw petals on top (they are already using the same ctx), so use save/restore.
  ctx.save();
  petalArray.forEach(petal => petal.animate());
  ctx.restore();
  window.requestAnimationFrame(render);
}

// mouse / touch handling for petals
let mouseX = 0;
function touchHandler(e) {
  mouseX = (e.clientX || (e.touches && e.touches[0].clientX) || 0) / window.innerWidth;
}
window.addEventListener('mousemove', touchHandler);
window.addEventListener('touchmove', touchHandler);

// Petal class
class Petal {
  constructor() {
    this.x = Math.random() * w;
    this.y = (Math.random() * h * 2) - h;
    // smaller petals
    this.w = 12 + Math.random() * 8;
    this.h = 10 + Math.random() * 6;
    this.opacity = this.w / 40;
    this.flip = Math.random();

    this.xSpeed = 1.5 + Math.random() * 2;
    this.ySpeed = 1 + Math.random() * 1;
    this.flipSpeed = Math.random() * 0.03;
  }

  draw() {
    if (this.y > h || this.x > w) {
      this.x = -petalImg.width;
      this.y = (Math.random() * h * 2) - h;
      this.xSpeed = 1.5 + Math.random() * 2;
      this.ySpeed = 1 + Math.random() * 1;
      this.flip = Math.random();
    }
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(
      petalImg, 
      this.x, 
      this.y, 
      // scale down multipliers so smaller petals stay visually small
      this.w * (0.5 + (Math.abs(Math.cos(this.flip)) / 4)), 
      this.h * (0.7 + (Math.abs(Math.sin(this.flip)) / 6))
    );
    ctx.globalAlpha = 1;
  }

  animate() {
    this.x += this.xSpeed + mouseX * 5;
    this.y += this.ySpeed + mouseX * 2;
    this.flip += this.flipSpeed;
    this.draw();
  }
}