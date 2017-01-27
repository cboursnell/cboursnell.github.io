// TODO
// get mouse click coordinates in the canvas
// relate those x and y to a card
// draw a border around the card
// allow for requiring and banning cards
// add generate button
// pick 10 cards from all the ones while adhering to rules

// display the card images for dominion on startup
// when a new expansion is selected or deselected
// update the card list from the json file and display all cards from the selected sets
// only have one button called 'generate kingdom' and it will pull from all the available cards

// when 10 cards are showing for a kingdom then show the 'replace selected' button
// selecting cards in the kingdom screen gives them a yellow border

// globals
var sets = new Array(); 
var all_cards = new Array();
var owned_cards = new Array();
var owned_events = new Array();
var kingdom_cards = new Array();
var kingdom_events = new Array();
var kingdom_bane = null;
var extras = new Object();
var mode = "Cards";

function load() {
  $$("redraw").hide();
  loadingScreen();
  console.log("Calling load() method");
	getSets();
	loadCards();
  addInputEvents();
  setInterval(drawImages, 300);
//   // drawImages();
}

function loadingScreen() {

  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  context.font = "28px Arial";
  context.fillStyle = 'black';
  context.fillText("Loading cards...", 30, 50);
}

document.addEventListener("DOMContentLoaded", load);

function getSets() {
  sets = [];
  if ($$("check01").getValue()===1) {
    sets.push("dominion2ndEdition")
  }
  if ($$("check02").getValue()===1) {
    sets.push("intrigue2ndEdition")
  }
  if ($$("check03").getValue()===1) {
    sets.push("seaside")
  }
  if ($$("check04").getValue()===1) {
    sets.push("alchemy")
  }
  if ($$("check05").getValue()===1) {
    sets.push("prosperity")
  }
  if ($$("check06").getValue()===1) {
    sets.push("hinterlands")
  }
  if ($$("check07").getValue()===1) {
    sets.push("cornucopia")
  }
  if ($$("check08").getValue()===1) {
    sets.push("dark ages")
  }
  if ($$("check09").getValue()===1) {
    sets.push("guilds")
  }
  if ($$("check10").getValue()===1) {
    sets.push("adventures")
  }
  if ($$("check11").getValue()===1) {
    sets.push("empires")
  }
  var msg = "Owned sets: "
  for(var i = 0 ;  i < sets.length; i++) {
    msg = msg + sets[i] +" "
  }
  console.log(msg);
}

function loadCards() {
  var req = new XMLHttpRequest;  
  req.overrideMimeType("application/json");  
  url = "https://raw.githubusercontent.com/cboursnell/randomiser/master/cards_db.json"
  req.open('GET', url, true);
  var target = this;
  req.onload  = function() { parseJSON(req, url) }; // target.parseJSON(req, url) }
  req.send(null);
  console.log("Cards loaded");
}

function parseJSON(req, url) {
  all_cards = []
  if (req.status == 200) {
    var text = req.responseText
    var jsonResponse = JSON.parse(req.responseText);
    for(var i = 0 ; i < jsonResponse.length ; i++) {
      var obj = jsonResponse[i];
      var card = new Object();
      if (obj.hasOwnProperty("card_tag")) {
        card['name'] = obj["card_tag"];
        // console.log("Card name is "+card.name);
      } else {
        console.log("Couldn't get name info for "+obj);
      }
      if (obj.hasOwnProperty("cost")) {
        card['cost'] = obj["cost"];
      }
      if (obj.hasOwnProperty("debtcost")) {
        card['debtcost'] = obj["debtcost"];
      }
      if (obj.hasOwnProperty("cardset_tags")) {
        card['sets'] = obj["cardset_tags"];
      }
      if (obj.hasOwnProperty("types")) {
        card['types'] = obj["types"];
      }
      if (obj.hasOwnProperty("group_tag")) {
        card['group'] = obj["group_tag"];
      }
      if (obj.hasOwnProperty("group_top")) {
        card['group_top'] = obj["group_top"];
      }
      if (obj.hasOwnProperty("url")) {
        card['url'] = obj["url"];
      }
      card['toggle'] = 0;
      // console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types);
      if (card.url === undefined || card.url === null) {
        console.log("Not adding "+card.name+" because it's undefined or null")
      } else {
        all_cards.push(card);
      }
    }
  } else {
    confirm("There was a problem getting the JSON");
  }
  // confirm("Info for "+all_cards.length+" cards was loaded");
  // console.log(all_cards);
  getOwnedCards();
  // console.log("All cards:" + all_cards.length +" owned_cards:"+owned_cards.length);
  // console.log("<parseJSON> drawing images for the first time");
  drawImagesFirst();
}

function getOwnedCards() {
  var card_count = 0;
  owned_cards = [];
  owned_events = [];
  // console.log(all_cards);
  text_filter = $$("search").getValue();
  for(var i = 0 ; i < all_cards.length; i++) {
    var card = all_cards[i];
    card_count++;
      // only select cards that are in expansions that are ticked
      // remove ruins, shelters, spoils, travellers, prizes
    var supply = false;
    for(var j = 0 ; j < card.sets.length ; j++) {
      var set = card.sets[j];
      for(var k=0; k < sets.length; k++) {
        var owned_set = sets[k];
        // console.log(owned_set+" "+set);
        if (owned_set === set) {
          supply = true
          // console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types);
        }
      }
    }
    if (card.sets.includes("base")) {
      supply = false;
    }
    for(var j=0; j < card.types.length; j++) {
      var type = card.types[j];
      if (type === "Ruins" || type === "Shelter" || type === "Prize") {
        supply = false;
      } 
    }
    if (card.hasOwnProperty("group") && card.group.indexOf("-") >= 0) { // is a traveler or hermit/madman
      if (card.hasOwnProperty("group_top")) { // is the first traveler

      } else {
        supply = false;
      }
    }
    if (card.name === "Spoils") {
      supply = false;
    }
    if (text_filter.length > 0) {
      console.log("text filter is "+text_filter);
      if (card.name.toUpperCase().match(text_filter.toUpperCase())) {
        console.log(card.name + " matches "+text_filter);
      } else {
        supply = false;
      }
    }
    if (supply===true) {
      // console.log("  This card goes into thate owned set: "+card.name);
      // console.log(card);
      if (card.hasOwnProperty("image")) {
        // that's good
      } else {

      }
      if (card.types.includes("Event") || card.types.includes("Landmark")) {
        owned_events.push(card);
        console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types+" "+card.group);
      } else {
        // console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types+" "+card.group);
        owned_cards.push(card);
      }
    }
  } // for loop over all_cards
  var owned_count = 0;
  for(var i = 0; i < owned_cards.length; i++) {
    owned_count++;
  }
  console.log("There are " + owned_count + " cards that you own, out of " + card_count);
  console.log("There are " + owned_events.length + " owned events");
  owned_cards.sort(cardCompareCost);
  owned_events.sort(cardCompareCost);
  if (owned_count===0) {
    $$("generate").disable();
  } else {
    $$("generate").enable();
  }
  if (owned_events.length===0) {
    $$("eventcounter").hide();
  } else {
    // $$("eventcounter").setValue(1);
    $$("eventcounter").show();
  }
}

function addInputEvents() {
  var canvas = document.getElementById("cardCanvas");
  var ctx = canvas.getContext("2d");
  canvas.addEventListener("mousewheel", MouseWheelHandler, false);
  canvas.addEventListener("mousedown", MouseDownHandler, false);
  canvas.addEventListener("touchmove", TouchMoveHandler, false);
  canvas.addEventListener("touchend", TouchEndHandler, false);

  $$("check01").attachEvent("onChange", ChangeHandler);
  $$("check02").attachEvent("onChange", ChangeHandler);
  $$("check03").attachEvent("onChange", ChangeHandler);
  $$("check04").attachEvent("onChange", ChangeHandler);
  $$("check05").attachEvent("onChange", ChangeHandler);
  $$("check06").attachEvent("onChange", ChangeHandler);
  $$("check07").attachEvent("onChange", ChangeHandler);
  $$("check08").attachEvent("onChange", ChangeHandler);
  $$("check09").attachEvent("onChange", ChangeHandler);
  $$("check10").attachEvent("onChange", ChangeHandler);
  $$("check11").attachEvent("onChange", ChangeHandler);

  $$("eventcounter").attachEvent("onChange", EventCounterChangeHandler);

  // $$("search").attachEvent("onChange", TextChangeHandler);
  $$("search").attachEvent("onTimedKeyPress", TextChangeHandler);

}

// var drawingTimer = null;
// var cooldownTimer = 0;
var canvasScroll=0;
var scale=1.0;

function drawImages() {

  // var x = 0;
  // var y = 0;
  // var width = 200;
  // var height = 320;
  // if (window.innerWidth < 700) {
  //   scale = 0.40;
  // } else if (window.innerWidth < 900) {
  //   scale = 0.50;
  // } else if (window.innerWidth < 1100) {
  //   scale = 0.66;
  // } else if (window.innerWidth < 1300) {
  //   scale = 0.75;
  // } else {
  //   scale = 1.0;
  // }
  scale = ((window.innerWidth-232)/5)/200;
  if (scale > 1.0) {
    scale = 1.0;
  }
  if (scale < 0.5) {
    scale = 0.5;
  }
  var pos = {}
  pos['x']=0
  pos['y']=0
  pos['width']=200*scale;
  pos['height']=320*scale;
  pos['update'] = function(canvas) {
    this.x += this.width;
    // if (this.x > canvas.width-50) {
    if (this.x > window.innerWidth-this.width-230) {
      this.x = 0;
      this.y += this.height;
    }
    if (this.y > canvas.height) {
      canvas.height += this.height;
    }
    if (this.x+this.width > canvas.width) {
      // canvas.width += this.width;
      canvas.width += 10;
      console.log("Width of canvas increased to "+canvas.width);
    }
  }
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  // console.log("window width: "+window.innerWidth);
   
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();
  if (mode === "Cards") {
    if (owned_cards.length+owned_events.length===0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "28px Arial";
      context.fillStyle = 'black';
      // context.font("PT Sans");
      context.fillText("Select Expansions", 30, 50);
    }
    for(var i = 0; i < owned_cards.length; i++) {
      if (pos.y+pos.height+canvasScroll > 0 && pos.y+canvasScroll < window.innerHeight) {
        context.drawImage(owned_cards[i].image, pos.x, pos.y, pos.width, pos.height);
      } else {
        // console.log("Not drawing "+owned_cards[i].name + " as it is off the screen");
      }

      owned_cards[i]['drawX']=pos.x
      owned_cards[i]['drawY']=pos.y
      toggle = owned_cards[i].toggle;
      if (toggle===1) {
        // draw a green box - require
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="green";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      } else if (toggle===2) {
        // draw a red box - ban
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="red";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      }

      pos.update(canvas);
    } // end owned cards

    if (owned_cards.length > 0 && pos.x > 0) {
      pos.y += pos.height;
    }
    pos.width = 320*scale;
    pos.height = 200*scale;
    pos.x = 0;
    for(var i = 0; i < owned_events.length; i++) {
      context.drawImage(owned_events[i].image, pos.x, pos.y, pos.width, pos.height);
      owned_events[i]['drawX']=pos.x
      owned_events[i]['drawY']=pos.y
      toggle = owned_events[i].toggle;
      if (toggle===1) {
        // draw a green box - require
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="green";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      } else if (toggle===2) {
        // draw a red box - ban
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="red";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      }
      pos.update(canvas);
    }
  } else { // mode === "Kingdom"
    kingdom_cards.sort(cardCompareCost);
    for(var i = 0; i < kingdom_cards.length; i++) {
      context.drawImage(kingdom_cards[i].image, pos.x, pos.y, pos.width, pos.height);

      kingdom_cards[i]['drawX']=pos.x
      kingdom_cards[i]['drawY']=pos.y
      if (kingdom_cards[i].hasOwnProperty("selected")) {
        var selected = kingdom_cards[i].selected;
      } else {
        var selected = false;
      }
      if (selected===true) {
        // draw a yellow box - require
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="yellow";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      }

      pos.update(canvas);
    }

    if (pos.x>0) {
      pos.y += pos.height; // for if the last row wasn't finished
    }
    pos.width = 320*scale;
    pos.height = 200*scale;
    pos.x = 0;
    for(var i = 0; i < kingdom_events.length; i++) {
      context.drawImage(kingdom_events[i].image, pos.x, pos.y, pos.width, pos.height);
      kingdom_events[i]['drawX']=pos.x
      kingdom_events[i]['drawY']=pos.y
      if (kingdom_events[i].hasOwnProperty("selected")) {
        var selected = kingdom_events[i].selected;
      } else {
        var selected = false;
      }
      if (selected===true) {
        // draw a yellow box - require
        context.beginPath();
        context.lineWidth="4";
        context.strokeStyle="yellow";
        context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
        context.stroke();
      }
      pos.update(canvas);
    }
    if (kingdom_events.length > 0 && pos.x > 0) {
      pos.y += pos.height;
    }
    // draw horizontal line
    pos.y+=20;
    context.beginPath();
    context.moveTo(20,pos.y);
    context.lineTo(canvas.width-20,pos.y);
    context.lineWidth="2";
    context.strokeStyle="black";
    context.stroke();
    pos.y+=20;
    pos.x=0;
    pos.width = 200*scale;
    pos.height = 320*scale;
    // RECOMMENDED CARDS
    if (kingdom_bane!==null) {
      // var tx=pos.x;
      // var ty=pos.y;
      drawExtra(pos, kingdom_bane.name);
      // context.font = "15px serif";
      // context.fillStyle = 'black';
      // context.fillText("BANE", tx+132, ty+303);
    }
    drawExtra(pos, "Copper");
    drawExtra(pos, "Silver");
    drawExtra(pos, "Gold");
    drawExtra(pos, "Estate");
    drawExtra(pos, "Duchy");
    drawExtra(pos, "Province");
    if (extras.hasOwnProperty("spoils")) {
      drawExtra(pos,"Spoils");
    }
    if (extras.hasOwnProperty("platinum")) {
      drawExtra(pos, "Platinum");
    }
    if (extras.hasOwnProperty("colonies")) {
      drawExtra(pos, "Colony");
    }
    if (extras.hasOwnProperty("potions")) {
      drawExtra(pos, "Potion");
    }
    if (extras.hasOwnProperty("shelters")) {
      drawExtra(pos, "Hovel");
      drawExtra(pos, "Necropolis");
      drawExtra(pos, "Overgrown Estate");
    } // end shelters

    if (extras.hasOwnProperty("ruins")) {
      drawExtra(pos, "Abandoned Mine");
      drawExtra(pos, "Ruined Library");
      drawExtra(pos, "Ruined Village");
      drawExtra(pos, "Ruined Market");
      drawExtra(pos, "Survivors");
    } //ruins

  }
}

function drawExtra(pos, name) {
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  var card = getCard(name);
  if (card === null || card === undefined) {
    console.log("Can't find card " + name + " in all_cards");
  } else {
    context.drawImage(getCard(name).image, pos.x, pos.y, pos.width, pos.height);
  }
  pos.update(canvas);
  // pos.x += pos.width;
  // if (pos.x > canvas.width-50) {
  //   pos.x = 0;
  //   pos.y += pos.height;
  //   if (pos.y > canvas.height) {
  //     canvas.height += pos.height;
  //   }
  // }

}

function getCard(name) {
  for(var x = 0; x < all_cards.length; x++) {
    if (all_cards[x].name === name) {
      return all_cards[x];
    }
  }
  return null;
}

function chooseBaneCard() {
  // choose a card that costs either 2 or 3
  // is in owned_cards
  // isn't in kingdom_cards
  possible_bane = []
  for(var i = 0; i < owned_cards.length; i++) {
    var sCost = owned_cards[i].cost;
    var iCost = parseInt(sCost);
    if (iCost !== NaN) {
      if (iCost >= 2 && iCost <= 3) {
        if (!containsCard(kingdom_cards, owned_cards[i])) {
          possible_bane.push(owned_cards[i]);
        }
      }
    } else {
      console.log("Cost couldn't be parsed: "+sCost);
    }

  }
  console.log("There are "+possible_bane.length+" possible bane cards");
  if (possible_bane.length===0) {
    console.log("Can't find a bane card. Suggest removing Young Witch, or a 2-3 cost card from the kingdom");
    return null;
  } else {
    var rand_i = Math.floor(Math.random()*possible_bane.length);
    return possible_bane[rand_i];
  }

}

// function loadImages() {
function loadImages(callback) {
  // var images = [];
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  numImages = all_cards.length;
  for(var i = 0 ; i < all_cards.length; i++) {
    // console.log("Loading "+all_cards[i].name +" from "+all_cards[i].url);
    all_cards[i]['image'] = new Image();
    // images[i]['name'] = all_cards[i].name;
    all_cards[i]['image'].onload = function() {
      // console.log("loaded:"+loadedImages+"/"+numImages+" i:"+i+" card:"+all_cards[i].name);
      if(++loadedImages >= numImages) {
        // console.log("calling back to function");
        callback(); // calling code in drawimagesfirst function
      }
      // TODO draw progress bar of cards loading
    };
    all_cards[i]['image'].src = all_cards[i].url;
  }
} // end

function drawImagesFirst() {
  // console.log("Drawing images for the first time <266>");
  // console.log("Owned cards: "+ owned_cards.length);
  // var x = 0;
  // var y = 0;
  // var width = 200*scale;
  // var height = 320;
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');

  // loadImages();

  loadImages(function() {
    // context.save();
    // context.setTransform(1, 0, 0, 1, 0, 0);
    // context.clearRect(0, 0, canvas.width, canvas.height);
    // console.log("drawing white rectangle for the first time");
    // context.restore();
    if (owned_cards.length===0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "28px Arial";
      context.fillStyle = 'black';
      // context.font("PT Sans");
      context.fillText("Select Expansions", 30, 50);
    }
    // for(var i = 0; i < owned_cards.length; i++) {
    //   context.drawImage(owned_cards[i].image, x, y, width, height);
    //   // there are the same number of images as owned cards and they are in the same order
     
    //   // console.log("setting "+owned_cards[i].name+" to "+x+" "+y);
    //   x += width;
    //   if (x > 850) {
    //     x = 0;
    //     y += height;
    //   }
    // }    
  });

}

function MouseWheelHandler(e) {
  // var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  // console.log("mouse scrolling "+e.wheelDelta);
  var canvas = document.getElementById("cardCanvas");
  var ctx = canvas.getContext("2d");
  ctx.translate(0, e.wheelDelta);
  canvasScroll += e.wheelDelta;
  if (canvasScroll > 0) {
    ctx.translate(0,-canvasScroll);
    canvasScroll = 0;
  }
  var bottom = -canvas.height+window.innerHeight-(320*scale);
  // console.log("canvasscroll: " + canvasScroll+ "window height: "+window.innerHeight);
  if (canvasScroll < bottom) {
    ctx.translate(0,-canvasScroll+bottom);
    canvasScroll = bottom;
  }
  // console.log("canvasScroll " + canvasScroll);
  drawImages();
}

var prevY=null;
function TouchMoveHandler(e) {
  var canvas = document.getElementById("cardCanvas");
  var ctx = canvas.getContext("2d");
  var touches = e.changedTouches;
  // console.log("There are "+ touches.length +" touches");
  var y = touches[0].pageY;
  // console.log("X: " + touches[0].pageX +" Y:"+ touches[0].pageY);
  if (prevY===null) {
    prevY=touches[0].pageY;
  } else {
    // console.log("Difference: "+(y-prevY));
    var difference = y-prevY;

    ctx.translate(0, difference);
    canvasScroll += difference;
    if (canvasScroll > 0) {
      ctx.translate(0,-canvasScroll);
      canvasScroll = 0;
    }
    var bottom = -canvas.height+window.innerHeight-(320*scale);
    if (canvasScroll < bottom) {
      ctx.translate(0,-canvasScroll+bottom);
      canvasScroll = bottom;
    }
    // console.log("canvasScroll " + canvasScroll);
    drawImages();
    prevY=y;
  }
}

function TouchEndHandler(e) {
  prevY=null;
  console.log("setting prev Y position to null");
}

function MouseDownHandler(e) {
  var canvas = document.getElementById("cardCanvas");
  var ctx = canvas.getContext("2d");

  var offX = e.pageX - canvas.offsetLeft;
  var offY = e.pageY - canvas.offsetTop - canvasScroll;
  console.log("Mouse down at "+offX+" "+offY);
  if (mode === "Cards") {
    for(var i = 0; i < owned_cards.length; i++) {
      var x = owned_cards[i].drawX;
      var y = owned_cards[i].drawY;
      // console.log(owned_cards[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(200*scale) && offY > y && offY < y+(320*scale)) {
        console.log("Click on "+owned_cards[i].name + " toggle:"+owned_cards[i].toggle);
        owned_cards[i].toggle++;
        owned_cards[i].toggle = owned_cards[i].toggle%3;
        console.log("Toggle set to " + owned_cards[i].toggle);
      }
    }
    for(var i = 0 ; i < owned_events.length; i++) {
      var x = owned_events[i].drawX;
      var y = owned_events[i].drawY;
      // console.log(owned_events[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(320*scale) && offY > y && offY < y+(200*scale)) {
        console.log("Click on "+owned_events[i].name + " toggle:"+owned_events[i].toggle);
        owned_events[i].toggle++;
        owned_events[i].toggle = owned_events[i].toggle%3;
        console.log("Toggle set to " + owned_events[i].toggle);
      }

    }
  } else if (mode === "Kingdom") {
    
    for(var i = 0; i < kingdom_cards.length ; i++) {
      var x = kingdom_cards[i].drawX;
      var y = kingdom_cards[i].drawY;
      // console.log(kingdom_cards[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(200*scale) && offY > y && offY < y+(320*scale)) {
        // console.log("Click on "+kingdom_cards[i].name + " toggle:"+kingdom_cards[i].toggle);
        if (kingdom_cards[i].hasOwnProperty("selected")) {
          if (kingdom_cards[i].selected===true) {
            kingdom_cards[i].selected = false;
          } else {
            kingdom_cards[i].selected = true;
          }
        } else {
          kingdom_cards[i]['selected'] = true;
        }
        // kingdom_cards[i].toggle++;
        // kingdom_cards[i].toggle = kingdom_cards[i].toggle%3;
        // console.log("Toggle set to " + kingdom_cards[i].toggle);
        
      }

    } // for in kingdom_cards

    for(var i = 0; i < kingdom_events.length ; i++) {
      var x = kingdom_events[i].drawX;
      var y = kingdom_events[i].drawY;
      // console.log(kingdom_events[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(320*scale) && offY > y && offY < y+(200*scale)) {
        // console.log("Click on "+kingdom_events[i].name + " toggle:"+kingdom_events[i].toggle);
        if (kingdom_events[i].hasOwnProperty("selected")) {
          if (kingdom_events[i].selected===true) {
            kingdom_events[i].selected = false;
          } else {
            kingdom_events[i].selected = true;
          }
        } else {
          kingdom_events[i]['selected'] = true;
        }
        // kingdom_events[i].toggle++;
        // kingdom_events[i].toggle = kingdom_events[i].toggle%3;
        // console.log("Toggle set to " + kingdom_events[i].toggle);
        // countSelected();
      }

    } // for in kingdom_events
    countSelected();
    
    // console.log("selected count: "+selected_count);
  }
  drawImages();
}

function countSelected() {
  var selected_count = 0;
  for(var i = 0; i < kingdom_cards.length ; i++) {
    if (kingdom_cards[i].selected===true){
      selected_count++;
    }
  }
  for(var i = 0; i < kingdom_events.length ; i++) {
    if (kingdom_events[i].selected===true){
      selected_count++;
    }
  }
  if (selected_count===0) {
    $$("redraw").setValue("Redraw All");
    $$("redraw").refresh();
  } else {
    $$("redraw").setValue("Redraw Selected");
    $$("redraw").refresh();
  }
  return selected_count;
}

function cardCompareCost(a,b) {
  if (a.cost < b.cost) {
    return -1;
  }
  if (a.cost > b.cost) {
    return 1;
  }
  if (a.cost === b.cost) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
  }
  return 0;
}

function cardCompareName(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

function switchMode() {
  if (mode === "Kingdom") {
    mode = "Cards";
    console.log("Switched to Cards mode");
    $$("generate").setValue("Show Kingdom");
    $$("generate").refresh();
    $$("redraw").hide();
    $$("search").show();
  } else if (mode === "Cards") {
    mode = "Kingdom";
    console.log("Switched to Kingdom mode");
    $$("generate").setValue("Show Cards");
    $$("generate").refresh();
    $$("redraw").show();
    $$("search").hide();
    if (canvasScroll < -500) {
      var canvas = document.getElementById('cardCanvas');
      var context = canvas.getContext('2d');
      context.translate(0, -canvasScroll);
      canvasScroll = 0;
    } else {
      console.log("when switching modes canvasScroll is " + canvasScroll);
    }
    generate();
  }
}

function containsCard(listOfCards, card) {
  result = false;
  if (listOfCards.length > 0) {
    for (var i = 0 ; i < listOfCards.length; i++) {
      if (listOfCards[i].name === card.name) {
        result = true;
      }
    }
  }
  return result;
}

function containsCardName(listOfCards, cardName) {
  result = false;
  if (listOfCards.length > 0) {
    for (var i = 0 ; i < listOfCards.length; i++) {
      if (listOfCards[i].name === cardName) {
        result = true;
      }
    }
  }
  return result;
}

function recommendations() {
  // console.log("getting recommendations");
  // var extras = {}
  // shelters
  var rand_i = Math.floor(Math.random()*kingdom_cards.length);
  if (kingdom_cards[rand_i].sets.includes("dark ages")) { // error here possibly
    extras['shelters']=true;
  }
  // ruins
  var ruins = false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].types.includes("Looter")) {
      ruins = true;
      extras['ruins']=true;
    }
  }
  // curses - always use curses
  // potion
  var potions = false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].sets.includes("alchemy")) {
      potions = true;
      extras['potions']=true;
    }
  }
  // platinum /colonies

  var rand_i = Math.floor(Math.random()*kingdom_cards.length);
  if (kingdom_cards[rand_i].sets.includes("prosperity")) {
    console.log("Use Colonies and Platinum");
    extras['platinum']=true;
    extras['colonies']=true;
  }
  // spoils // bandit camp, marauder, pillage

  var spoils = false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].name === "Bandit Camp" || kingdom_cards[i].name === "Marauder" || kingdom_cards[i].name === "Pillage") {
      spoils = true
      extras['spoils']=true;
    }
  }
  // young witch / bane
  // console.log("Choose a kingdom card from the owned cards that is not in the kingdom that costs 2-3");
  return extras;
}

function generate() {
  console.log("Pressed generate button");
  // go through the owned cards
  // pick out ones that have toggle === 1 (ie green)
  // add them to the kingdom
  // if the kingdom size > 10 then
  //   randomly remove cards until you have 10
  // else
  //   pick cards randomly from owned_cards (ignoring any with toggle===2)
  //   and add them to the kingdom

  // if the sets are changed at a later point then keep the kingdom of 10
  // don't draw all the expansions
  // have a button to switch between all cards and kingdom view
  // have a global toggle for kingdom and all view
  // Choose Kingdom and Show Cards. Switch to "Show Kingdom" when in the "All Cards" view
  //                                Switch to "Redraw Kingdom" when in the "Kingdom" view
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  countSelected();
  if (mode === "Kingdom") {
    // CHOOSING CARDS /////////////////////
    if (kingdom_cards.length==0) {
      // zoom to the top. 
      // generate new kingdom
      for(var i = 0 ; i < owned_cards.length; i++) {
        if (owned_cards[i].toggle === 1) { // required
          console.log("Adding required card "+owned_cards[i].name+" to kingdom");
          kingdom_cards.push(owned_cards[i]);
        }
      }
      // if there were too many required cards remove some
      while (kingdom_cards.length > 10) {
        var rand_i = Math.floor(Math.random()*kingdom_cards.length);
        console.log("Removing "+kingdom_cards[rand_i].name+" from over filled kingdom");
        kingdom_cards[rand_i].selected = false;
        kingdom_cards.splice(rand_i, 1);
      }
      // 
      while (kingdom_cards.length < 10) {
        // choose random card and add it to the kingdom if it's not 
        var rand_i = Math.floor(Math.random()*owned_cards.length);
        if (!containsCard(kingdom_cards, owned_cards[rand_i])) {
          if (owned_cards[rand_i].toggle < 2) {
            kingdom_cards.push(owned_cards[rand_i]);
          }
        }
      }

      if (containsCardName(kingdom_cards, "Young Witch")) {
        kingdom_bane = chooseBaneCard();
      } else {
        kingdom_bane = null;
      }
    } // end of when there are 0 cards in the kingdom

    // CHOOSING EVENTS ///////////////////////////
    chooseKingdomEvents();
    $$("redraw").show();
    recommendations();
    drawImages();
  } 
  // else {
  //   $$("redraw").hide();
  //   if (kingdom_cards.length==0) {
  //     $$("generate").setValue("Generate Kingdom");
  //     $$("generate").refresh();
  //   } else {
  //     $$("generate").setValue("Show Kingdom");
  //     $$("generate").refresh();
  //   }
  //   drawImages();
  // }

}

// TODO add chooseRandomCard method

function chooseKingdomEvents() {

    var numEvents = $$("eventcounter").getValue();
    if (owned_events.length === 0) {
      numEvents = 0;
    }
    console.log("should have "+numEvents+" events");
    
    // if the number of events is less than wanted
    if (kingdom_events.length < numEvents) {
      // make a list of required events
      console.log("there are not enough events")
      var requiredEvents = []
      for(var i = 0 ; i < owned_events.length; i++) {
        if (owned_events[i].toggle === 1) { // required
          if (!containsCard(kingdom_events, owned_events[i])) {
            console.log("adding "+owned_events[i].name+" to the list of required events");
            requiredEvents.push(owned_events[i]);
          }
        }
      }
      if (kingdom_events.length + requiredEvents.length <= numEvents && requiredEvents.length > 0) {
        // add all the requiredEvents to the kingdom
        console.log("there are "+kingdom_events.length+" events already and " + requiredEvents.length +" required events so adding them all");
        for(var i = 0; i < requiredEvents.length; i++) {
          kingdom_events.push(requiredEvents[i]);
        }
      } else if (requiredEvents.length > 0) {
        console.log("there are "+kingdom_events.length+" events already and " + requiredEvents.length +" required events so adding some of them");
        while (kingdom_events.length < numEvents) {
          // choose a random required event from the list and add it to the kingdom
          var rand_i = Math.floor(Math.random()*requiredEvents.length);
          console.log("Choosing "+requiredEvents[rand_i].name+" to add to the kingdom")
          kingdom_events.push(requiredEvents[rand_i]);
          requiredEvents.splice(rand_i,1);
        }
        
        // add some of the requiredEvents to the kingdom
      } 

      // pick randomly from it
      // are there enough required events to make up the number
      // pick randomly from other events
      count=0;
      while (kingdom_events.length < numEvents && count < 1000) {
        console.log(kingdom_events.length +" < "+numEvents);
        var rand_i = Math.floor(Math.random()*owned_events.length);
        if (!containsCard(kingdom_events, owned_events[rand_i])) {
          if (owned_events[rand_i].toggle < 2) {
            console.log("adding event "+owned_events[rand_i].name);
            kingdom_events.push(owned_events[rand_i]);
          }
        }
        count++;
      }

      count=0;
      while (kingdom_events.length < numEvents && count < 1000) {
        console.log("events:" + kingdom_events.length +" < numEvents:"+numEvents);
        var rand_i = Math.floor(Math.random()*owned_events.length);
        if (!containsCard(kingdom_events, owned_events[rand_i])) {
          console.log("adding event "+owned_events[rand_i].name);
          if (owned_events[rand_i].hasOwnProperty("toggle")) {
            if (owned_events[rand_i].toggle < 2) {
              kingdom_events.push(owned_events[rand_i]);
            }
          } else {
            kingdom_events.push(owned_events[rand_i]);
          }
        }
        count++;
      }
    }

    // if the number of events is more than wanted
    while (kingdom_events.length > numEvents) {
      console.log("there are too many events ("+kingdom_events.length+") and only need " + numEvents +" so removing some");
      var requiredEvents = [];
      for(var i = 0 ; i < owned_events.length; i++) {
        if (owned_events[i].toggle === 1) { // required
          console.log("adding "+owned_events[i].name+" to the list of required events");
          requiredEvents.push(owned_events[i]);
        }
      }
      if (requiredEvents.length < kingdom_events.length && requiredEvents.length > 0) {
        console.log("There are "+requiredEvents.length+" required events");
        // remove some events that aren't required
        var rand_i = Math.floor(Math.random()*kingdom_events.length);
        while (containsCard(requiredEvents, kingdom_events[rand_i])) {
          var rand_i = Math.floor(Math.random()*kingdom_events.length);
        }
        kingdom_events.splice(rand_i, 1); 
      } else {
        var rand_i = Math.floor(Math.random()*kingdom_events.length);
        kingdom_events.splice(rand_i, 1); 
      }
    }

}

function redrawSelected() {
  cardsToAdd = []
  if (countSelected()===0) {
    // REDRAW ALL CARDS AND EVENTS
    // choose new cards that aren't in that list
    // fill cardsToAdd with required cards first. this works if the number of required cards is <10 or >10
    for(var i = 0 ; i < owned_cards.length; i++) {
      if (owned_cards[i].toggle===1) { // is required
        cardsToAdd.push(owned_cards[i]);
      }
    }
    while (cardsToAdd.length > 10) {
      var rand_i = Math.floor(Math.random()*cardsToAdd.length);
      cardsToAdd.splice(rand_i, 1);
    }
    count = 0;
    while (cardsToAdd.length < 10 && count < 1000) {
      // add more cards that aren't cardsToAdd, and aren't in kingdomCards
      var rand_i = Math.floor(Math.random()*owned_cards.length);
      if (!containsCard(cardsToAdd, owned_cards[rand_i])) {
        if (!containsCard(kingdom_cards, owned_cards[rand_i])) {
          if (owned_cards[rand_i].toggle < 2) {
            cardsToAdd.push(owned_cards[rand_i]);
          }
        }
      }
      count++;
    }
    kingdom_cards=[];
    for(var i = 0 ; i < cardsToAdd.length; i++) {
      kingdom_cards.push(cardsToAdd[i]);
    } 
    // choose new events that aren't in the list
    chooseKingdomEvents();
  } else {
    // REDRAW JUST SELECTED CARDS
    var cardsToRemove = []; // list of cards, not list of card names
    var cardsToAdd = []; // list of card objects, not strings of card names
    for(var i = 0; i < kingdom_cards.length; i++) {
      if (kingdom_cards[i].selected === true) {
        cardsToRemove.push(kingdom_cards[i]);
      }
    }
    count=0;
    while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
      var rand_i = Math.floor(Math.random()*owned_cards.length);
      if (!containsCard(cardsToAdd, owned_cards[rand_i])) {
        if (!containsCard(kingdom_cards, owned_cards[rand_i])) {
          if(!containsCard(cardsToRemove, owned_cards[rand_i])) {
            if (owned_cards[rand_i].toggle < 2) {
              cardsToAdd.push(owned_cards[rand_i]);
            }
          }
        }
      }
      count++;
    }
    count=0;
    while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
      var rand_i = Math.floor(Math.random()*owned_cards.length);
      if (!containsCard(cardsToAdd, owned_cards[rand_i])) {
        if (!containsCard(kingdom_cards, owned_cards[rand_i])) {
          if (owned_cards[rand_i].toggle < 2) {
            cardsToAdd.push(owned_cards[rand_i]);
          }
        }
      }
      count++;
    }
    // remove cards from kingdom
    for(var i = 0; i < cardsToRemove.length; i++) {
      for(var j = 0; j < kingdom_cards.length; j++) {
        if (cardsToRemove[i].name === kingdom_cards[j].name) {
          kingdom_cards[j].selected = false;
          kingdom_cards.splice(j,1);
          j--;
        }
      }
    }
    // add new cards to kingdom
    for(var i = 0; i < cardsToAdd.length; i++) {
      kingdom_cards.push(cardsToAdd[i]);
    }
    // REMOVE SELECTED EVENTS

    var eventsToRemove = []; // list of cards, not list of card names
    for(var i = 0; i < kingdom_events.length; i++) {
      if (kingdom_events[i].selected === true) {
        // eventsToRemove.push(kingdom_events[i]);
        kingdom_events[i].selected = false;
        kingdom_events.splice(i,1);
        i--;
      }
    }

    chooseKingdomEvents();
  } // end if else
  if (containsCardName(kingdom_cards, "Young Witch")) {
    kingdom_bane = chooseBaneCard();
  } else {
    kingdom_bane = null;
  }
  recommendations();
}

function oldredrawSelected() {
  console.log("Redrawing selected cards");
  // count how many cards are selected
  // draw that many new, unique cards
  // remove selected cards, deselect them, add new ones
  var cardsToRemove = []; // list of cards, not list of card names
  var cardsToAdd = []; // list of card objects, not strings of card names
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].selected === true) {
      cardsToRemove.push(kingdom_cards[i]);
    }
  }
  if (countSelected()===0) { // non-selected
    for(var i = 0; i < kingdom_cards.length; i++) {
      cardsToRemove.push(kingdom_cards[i]);
    }
    console.log("Removing "+cardsToRemove.length+" cards with Redraw All");
  }
  var count = 0;
  while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
    var rand_i = Math.floor(Math.random()*owned_cards.length);
    var rand_card = owned_cards[rand_i];
    // console.log("random card chosen is " + rand_card.name);
    if (containsCard(kingdom_cards, rand_card)) {
      // console.log(rand_card.name +" found in kingdom cards already");
    } else if (containsCard(cardsToAdd, rand_card)) {
      // console.log(rand_card.name +" found in cardsToAdd already");
    } else {
      cardsToAdd.push(rand_card);
      //
      // for(var x=0;x<kingdom_cards.length;x++) {
        // console.log("kingdom: "+kingdom_cards[x].name);
      // }
      // for(var x=0;x<cardsToAdd.length;x++) {
        // console.log("cardToAdd: "+cardsToAdd[x].name);
      // }
      //
      // console.log(name + " not found in kingdomcards or cardsToAdd");
      // console.log("cardsToAdd.length "+cardsToAdd.length);
      // console.log("________");
    }
    count++;
  } // end while
  if (cardsToAdd.length < cardsToRemove.length) {
    console.log("couldn't add cards because there are too few to choose from. count: "+count);
    while (cardsToAdd.length < cardsToRemove.length) {
      var rand_i = Math.floor(Math.random()*owned_cards.length);
      var rand_card = owned_cards[rand_i];
      if (!containsCard(cardsToAdd, rand_card)) {
        if (rand_card.toggle < 2) {
          cardsToAdd.push(rand_card);
        }
      }
    }
  }
  // console.log("Removing: "+cardsToRemove.join()+" Adding:"+cardsToAdd.join());
  var str = "Removing: ";
  for(var x=0;x<cardsToRemove.length;x++) {
    // console.log("kingdom: "+kingdom_cards[x].name);
    str = str + cardsToRemove[x].name +" ";
  }
  str += ", Adding: ";
  for(var x=0;x<cardsToAdd.length;x++) {
    // console.log("cardToAdd: "+cardsToAdd[x].name);
    str = str + cardsToAdd[x].name +" ";
  }
  console.log(str);
  
  // remove cards from kingdom
  for(var i = 0; i < cardsToRemove.length; i++) {
    for(var j = 0; j < kingdom_cards.length; j++) {
      if (cardsToRemove[i].name === kingdom_cards[j].name) {
        kingdom_cards[j].selected = false;
        kingdom_cards.splice(j,1);
        j--;
      }
    }
  }
  // console.log("Kingdom size: " + kingdom_cards.length);
  // add new cards to kingdom
  for(var i = 0; i < cardsToAdd.length; i++) {
    for(var j = 0; j < owned_cards.length; j++) {
      if (cardsToAdd[i].name === owned_cards[j].name) {
        kingdom_cards.push(owned_cards[j]);
      }
    }
  }
  countSelected();
  drawImages();   
}

function ChangeHandler(e) {
  // console.log("Change!");
  // scroll to the top. 
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  context.translate(0, -canvasScroll);
  canvasScroll = 0;

  getSets();
  getOwnedCards();
  drawImages();
}

function EventCounterChangeHandler(e) {
  console.log("counter is now " + $$("eventcounter").getValue());
  generate();
}

function TextChangeHandler(e) {
  console.log("text changed");
  getOwnedCards();
}