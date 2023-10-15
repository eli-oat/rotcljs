const displayOptions = {
    // Configure the display
    bg: "white", // background
    fg: "dimGrey", // foreground
    fontFamily: "Menlo", // font (use a mono)
    width: 25,
    height: 20, // canvas height and width
    fontSize: 18, // canvas fontsize
    forceSquareRatio: true // make the canvas squared ratio
  };
  
  // Object containing colors per tile
  // you may add as much as you want corresponding to characters
  // they are then applied in gameworld.draw
  const colors = {
    ".": "lightgrey" // the moveable path
  };
  
  let Display = null; // give the browser time to load fonts
  
  let Game = {
    map: [],
    win: false,
    init: async function () {
      await sleep(500).then(() => {
        Display = new ROT.Display(displayOptions);
        let canvas = document.getElementById("canvas");
        canvas.appendChild(Display.getContainer());
      });
  
      Display.clear();
      this.createLevel();
      Player.init();
      this.engine(); // start the game engine
      this.draw();
    },
    engine: async function () {
      while (true) {
        await Player.act();
        this.draw();
      }
    },
    createLevel: function () {
      GameWorld.generate();
    },
    draw: function () {
      Display.clear();
      GameWorld.draw();
      Player.draw();
    },
    endGame: function () {
      this.win = true;
      Display.clear();
      Display.draw(8, 8, "Nailed it.", "violet");
    }
  };
  
  // initialize the game objects
  let GameWorld = {
    map: [],
    moveSpace: [],
    generate: function () {
      let map = [];
  
      for (let i = 0; i < displayOptions.width; i++) {
        map[i] = [];
        for (let j = 0; j < displayOptions.height; j++) {
          map[i][j] = "+"; // create the walls
        }
      }
  
      let freeCells = []; // this is where we will store the moveable space
  
      let digger = new ROT.Map.Cellular(
        displayOptions.width - 2,
        displayOptions.height - 2
      );
      digger.randomize(0.4);
      digger.create((x, y, value) => {
        if (value) {
          map[x + 1][y + 1] = "+"; // create the walls
        } else {
          freeCells.push({ x: x + 1, y: y + 1 });
          map[x + 1][y + 1] = "."; // add . to every free space just for esthetics
        }
      });
  
      // put the exit gate on the last free cell
      const lastFreeCell = freeCells.pop();
      map[lastFreeCell.x][lastFreeCell.y] = "%";
  
      this.map = map;
      this.freeCells = freeCells;
      Player.justMoved = false;
    },
    // make it impossible to pass through if across an obstacle
    isPassable: function (x, y) {
      if (GameWorld.map[x][y] === "+") {
        return false;
      } else {
        return true;
      }
    },
    draw: function () {
      this.map.forEach((element, x) => {
        element.forEach((element, y) => {
            if (element === "%") {
                Display.draw(x, y, element, colors[element] || "red");
            } else {
                Display.draw(x, y, element, colors[element] || "blue");
            }
        });
      });
    }
  };
  
  // create the player
  let Player = {
    x: null,
    y: null,
    init: function () {
      let playerStart = GameWorld.freeCells[0]; // put the player in the first available freecell
      this.x = playerStart.x;
      this.y = playerStart.y;
    },
    draw: function () {
      Display.draw(this.x, this.y, "@", "black");
    },
    act: async function () {
      let action = false;
      while (!action) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        let e = await new Promise((resolve) => {
          window.addEventListener("keydown", resolve, { once: true });
        });
        action = this.handleKey(e);
      } //Await a valid movement
  
      // make it end when the rocket reaches the earth
      if (GameWorld.map[this.x][this.y] === "%") {
        Game.endGame();
        Game.createLevel();
        this.init();
      }
    },
    handleKey: function (e) {
      var keyCode = [];
      //Arrows keys
      keyCode[38] = 0; // key-up
      keyCode[39] = 2; // key-right
      keyCode[40] = 4; // key-down
      keyCode[37] = 6; // key-left
  
      var code = e.keyCode;
  
      if (!(code in keyCode)) {
        return false;
      }
  
      let diff = ROT.DIRS[8][keyCode[code]];
      if (GameWorld.isPassable(this.x + diff[0], this.y + diff[1])) {
        this.x += diff[0];
        this.y += diff[1];
        this.justMoved = true;
        return true;
      } else {
        return false;
      }
    }
  };
  
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  window.addEventListener(
    "keydown",
    function (e) {
      // space and arrow keys
      if ([32, 37, 38, 39, 40].indexOf(e.key) > -1) {
        e.preventDefault();
      }
    },
    false
  );
  
  window.onload = Game.init();
  window.focus();