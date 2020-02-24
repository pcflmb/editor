/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../styles/index");

const _ = require("underscore");
const $ = require("jquery");

const ace = require("brace");
require("brace/mode/html");
require("brace/theme/vibrant_ink");
require("brace/ext/searchbox");

class App {
  POWER_MODE_ACTIVATION_THRESHOLD = 200;
  STREAK_TIMEOUT = 10 * 1000;

  MAX_PARTICLES = 500;
  PARTICLE_NUM_RANGE = [5, 6, 7, 8, 9, 10, 11, 12];
  PARTICLE_GRAVITY = 0.075;
  PARTICLE_SIZE = 8;
  PARTICLE_ALPHA_FADEOUT = 0.96;
  PARTICLE_VELOCITY_RANGE = {
    x: [-2.5, 2.5],
    y: [-7, -3.5]
  };

  PARTICLE_COLORS = {
    "text": [255, 255, 255],
    "text.xml": [255, 255, 255],
    "keyword": [0, 221, 255],
    "variable": [0, 221, 255],
    "meta.tag.tag-name.xml": [0, 221, 255],
    "keyword.operator.attribute-equals.xml": [0, 221, 255],
    "constant": [249, 255, 0],
    "constant.numeric": [249, 255, 0],
    "support.constant": [249, 255, 0],
    "string.attribute-value.xml": [249, 255, 0],
    "string.unquoted.attribute-value.html": [249, 255, 0],
    "entity.other.attribute-name.xml": [129, 148, 244],
    "comment": [0, 255, 121],
    "comment.xml": [0, 255, 121]
  };

  EXCLAMATION_EVERY = 10;
  EXCLAMATIONS = ["Super!", "Radical!", "Fantastic!", "Great!", "OMG",
  "Whoah!", "Wow!", "Nice!", "Splendid!", "Wild!", "Grand!", "Impressive!",
  "Stupendous!", "Extreme!", "Awesome!"];

  name = null;
  currentStreak = 0;
  powerMode = false;
  particles = [];
  particlePointer = 0;
  lastDraw = 0;
  editor;

  $streakCounter;
  $streakBar;
  $exclamations;
  $reference;
  $nameTag;
  $lobbyScreen;
  $lobbyScreenName;
  $startButton;
  $result;
  $editor;
  canvas;
  canvasContext;
  $finish;
  $body;

  debouncedSaveContent: Function;
  debouncedEndStreak: Function;
  throttledSpawnParticles: Function;

  constructor() {
    this.saveContent = this.saveContent.bind(this);
    this.onFrame = this.onFrame.bind(this);
    this.drawParticles = this.drawParticles.bind(this);
    this.activatePowerMode = this.activatePowerMode.bind(this);
    this.deactivatePowerMode = this.deactivatePowerMode.bind(this);
    this.onClickInstructions = this.onClickInstructions.bind(this);
    this.onClickReference = this.onClickReference.bind(this);
    this.onEscapeKeyPress = this.onEscapeKeyPress.bind(this);
    this.onClickFinish = this.onClickFinish.bind(this);
    this.onChange = this.onChange.bind(this);
    this.$streakCounter = $(".streak-container .counter");
    this.$streakBar = $(".streak-container .bar");
    this.$exclamations = $(".streak-container .exclamations");
    this.$reference = $(".reference-screenshot-container");
    this.$nameTag = $(".name-tag");
    this.$lobbyScreen = $(".lobby-screen");
    this.$lobbyScreenName = $(".lobby-screen-name");
    this.$startButton = $("#start-button");
    this.$result = $(".result");
    this.$editor = $("#editor");
    this.canvas = this.setupCanvas();
    this.canvasContext = this.canvas.getContext("2d");
    this.$finish = $(".finish-button");

    this.$body = $("body");

    this.debouncedSaveContent = _.debounce(this.saveContent, 300);
    this.debouncedEndStreak = _.debounce(this.endStreak, this.STREAK_TIMEOUT);
    this.throttledSpawnParticles = _.throttle(this.spawnParticles, 25, {trailing: false});

    this.editor = this.setupAce();
    this.loadContent();
    this.editor.focus();

    this.editor.getSession().on("change", this.onChange);
    $(window).on("beforeunload", () => "Hold your horses!");
    this.$startButton.on("click", this.onClickHideLobby);
    $(".instructions-container, .instructions-button").on("click", this.onClickInstructions);
    this.$reference.on("click", this.onClickReference);
    $(window).on("keydown", this.onEscapeKeyPress);
    this.$finish.on("click", this.onClickFinish);
    this.$nameTag.on("click", () => this.getName(true));

    this.getName();
    this.setLobbyScreenName();

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(this.onFrame);
    }
  }

  setupAce() {
    const editor = ace.edit("editor");

    editor.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);
    editor.setFontSize(20);
    editor.setTheme("ace/theme/vibrant_ink");
    editor.getSession().setMode("ace/mode/html");
    editor.session.setOption("useWorker", false);
    editor.session.setFoldStyle("manual");
    editor.$blockScrolling = Infinity;

    return editor;
  }

  setupCanvas() {
    const canvas = $(".canvas-overlay")[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return canvas;
  }

  getName(forceUpdate: boolean = false) {
    this.name = (!forceUpdate && localStorage["name"]) || prompt("Enter name or hacker alias.");
    localStorage["name"] = this.name;
    if (this.name) { return this.$nameTag.text(this.name); }
  }

  setLobbyScreenName() {
    return this.$lobbyScreenName.html(this.name);
  }

  onClickHideLobby() {
    return $(".lobby-screen").hide();
  }

  loadContent() {
    let content;
    if (!(content = localStorage["content"])) { return; }
    return this.editor.setValue(content, -1);
  }

  saveContent() {
    return localStorage["content"] = this.editor.getValue();
  }

  onFrame(time: number) {
    this.drawParticles();
    this.lastDraw = time;
    return (typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(this.onFrame) : undefined);
  }

  increaseStreak() {
    this.currentStreak++;
    if ((this.currentStreak > 0) && ((this.currentStreak % this.EXCLAMATION_EVERY) === 0)) { this.showExclamation(); }

    if ((this.currentStreak >= this.POWER_MODE_ACTIVATION_THRESHOLD) && !this.powerMode) {
      this.activatePowerMode();
    }

    this.refreshStreakBar();

    return this.renderStreak();
  }

  endStreak() {
    this.currentStreak = 0;
    this.renderStreak();
    return this.deactivatePowerMode();
  }

  renderStreak() {
    this.$streakCounter
      .text(this.currentStreak)
      .removeClass("bump");

    return _.defer(() => {
      return this.$streakCounter.addClass("bump");
    });
  }

  refreshStreakBar() {
    this.$streakBar.css({
      "webkit-transform": "scaleX(1)",
      "transform": "scaleX(1)",
      "transition": "none"
    });

    return _.defer(() => {
      return this.$streakBar.css({
        "webkit-transform": "",
        "transform": "",
        "transition": `all ${this.STREAK_TIMEOUT}ms linear`
      });
    });
  }

  showExclamation() {
    const $exclamation = $("<span>")
      .addClass("exclamation")
      .text(_.sample(this.EXCLAMATIONS));

    this.$exclamations.prepend($exclamation);
    return setTimeout(() => $exclamation.remove()
    , 3000);
  }

  getCursorPosition() {
    let {left, top} = this.editor.renderer.$cursorLayer.getPixelPosition();
    left += this.editor.renderer.gutterWidth + 4;
    top -= this.editor.renderer.scrollTop;
    return {x: left, y: top};
  }

  spawnParticles(type) {
    if (!this.powerMode) { return; }

    const {x, y} = this.getCursorPosition();
    const numParticles = _(this.PARTICLE_NUM_RANGE).sample();
    const color = this.getParticleColor(type);
    _(numParticles).times(() => {
      this.particles[this.particlePointer] = this.createParticle(x, y, color);
      this.particlePointer = (this.particlePointer + 1) % this.MAX_PARTICLES;
    });
  }

  getParticleColor(type) {
    return this.PARTICLE_COLORS[type] || [255, 255, 255];
  }

  createParticle(x: number, y: number, color: [number, number, number]) {
    return {
      x,
      y: y + 10,
      alpha: 1,
      color,
      velocity: {
        x: this.PARTICLE_VELOCITY_RANGE.x[0] + (Math.random() *
          (this.PARTICLE_VELOCITY_RANGE.x[1] - this.PARTICLE_VELOCITY_RANGE.x[0])),
        y: this.PARTICLE_VELOCITY_RANGE.y[0] + (Math.random() *
          (this.PARTICLE_VELOCITY_RANGE.y[1] - this.PARTICLE_VELOCITY_RANGE.y[0]))
      }
    };
  }

  drawParticles() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const result = [];
    for (let particle of this.particles) {
      if (particle.alpha <= 0.1) { continue; }

      particle.velocity.y += this.PARTICLE_GRAVITY;
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha *= this.PARTICLE_ALPHA_FADEOUT;

      this.canvasContext.fillStyle = `rgba(${particle.color.join(", ")}, ${particle.alpha})`;
      result.push(this.canvasContext.fillRect(
        Math.round(particle.x - (this.PARTICLE_SIZE / 2)),
        Math.round(particle.y - (this.PARTICLE_SIZE / 2)),
        this.PARTICLE_SIZE,
        this.PARTICLE_SIZE
      ));
    }
    return result;
  }

  activatePowerMode() {
    this.powerMode = true;
    return this.$body.addClass("power-mode");
  }

  deactivatePowerMode() {
    this.powerMode = false;
    return this.$body.removeClass("power-mode");
  }

  onClickInstructions() {
    $("body").toggleClass("show-instructions");
    if (!$("body").hasClass("show-instructions")) { return this.editor.focus(); }
  }

  onClickReference() {
    this.$reference.toggleClass("active");
    if (!this.$reference.hasClass("active")) { return this.editor.focus(); }
  }

  onEscapeKeyPress(e) {
    const ESCAPE_KEY = 27;
    // Close reference image window
    if ((e.keyCode === ESCAPE_KEY) && this.$reference.hasClass("active")) { this.$reference.toggleClass("active"); }

    // Close instructions window
    if ((e.keyCode === ESCAPE_KEY) && $("body").hasClass("show-instructions")) { return $("body").removeClass("show-instructions"); } 
  }

  onClickFinish() {
    const confirm = prompt(`\
Woah, hold up! \n \
This will show the results of your code. \n \
Please wait for given instructions at the end of the round. \n\
`
    );

    if ((confirm != null ? confirm.toLowerCase() : undefined) === "submit") {
      this.$result[0].contentWindow.postMessage(this.editor.getValue(), "*");
      return this.$result.show();
    }
  }

  onChange(e) {
    this.debouncedSaveContent();
    const insertTextAction = e.data.action === "insertText";
    if (insertTextAction) {
      this.increaseStreak();
      this.debouncedEndStreak();
    }

    const {
      range
    } = e.data;
    const pos = insertTextAction ? range.end : range.start;

    const token = this.editor.session.getTokenAt(pos.row, pos.column);

    return _.defer(() => {
      if (token) { return this.throttledSpawnParticles(token.type); }
    });
  }
}

// onload, initialize the app
$(() => new App);
