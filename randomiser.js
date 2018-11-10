
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
// globals
var sets = new Array();
var all_cards = new Array();
var owned_cards = new Array();
var owned_events = new Array();
var kingdom_cards = new Array();
var kingdom_events = new Array();
var blackMarketDeck = new Array();
var blackMarketSelection = new Array();
var bmcount = 0;
var kingdom_bane = null;
var extras = new Object();
var mode = "Cards";
var bottom = -1000;
var difference = 0;
var repeater = null;
var ctrlKey = false;
var loadedImages = 0;
var numImages = 0;
var cardBack;
var checkBoxNames = ["checkDominion1st", "checkDominion", "checkIntrigue1st", "checkIntrigue", "checkSeaside",
"checkAlchemy",  "checkProsperity", "checkHinterlands", "checkCornucopia",
"checkDarkAges",  "checkGuilds", "checkAdventures", "checkEmpires"];
var setNames = ["dominion1stEdition", "dominion2ndEdition", "intrigue1stEdition", "intrigue2ndEdition",
"seaside", "alchemy", "prosperity", "hinterlands", "cornucopia", "dark ages",
"guilds", "adventures", "empires"];
var promoCheckBoxNames = ["checkBlackMarket", "checkEnvoy",
"checkSauna", "checkWalledVillage", "checkGovernor", "checkStash",
"checkPrince", "checkSummon"];
var promoCardNames = ["Black Market","Envoy","Sauna",
"Walled Village","Governor","Stash","Prince","Summon"];

function load() {
  if (checkBrowser()) {
    $$("redraw").hide();
    $$("store").hide();
    loadingScreen();
    getSets();
    loadCards();
    addInputEvents();
    drawXTimes(10);
    recallSets();
  }
}

function checkBrowser() {
  if(bowser.msie) {
    console.log("You need to use a better browser");
    Array.prototype.includes = function(item) {
      if (this.indexOf(item) >= 0) {
        return true;
      } else {
        return false;
      }
    };
  }
  return true;
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

  for(var i = 0; i < checkBoxNames.length; i++) {
    if ($$(checkBoxNames[i]).getValue()===1) {
      sets.push(setNames[i]);
    }
  }
  sets.push("promo");
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
      // if (card.url === null) {
      //   console.log("Not adding "+card.name+" because it's undefined or null")
      // } else {

      // }
      all_cards.push(card);
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
        if (owned_set === set && owned_set != "promo") {
          supply = true
          // console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types);
        }
      }
    }
    for(var p = 0; p < promoCheckBoxNames.length; p++) {
      if ($$(promoCheckBoxNames[p]).getValue()===1 && card.name === promoCardNames[p]) {
        supply = true;
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
      // console.log("text filter is "+text_filter);
      var type_search = false;
      for(var t=0;t<card.types.length;t++) { //mark
        if (card.types[t].toUpperCase().match(text_filter.toUpperCase())) {
          type_search = true;
        }
      }
      if (card.name.toUpperCase().match(text_filter.toUpperCase()) || type_search === true || card.cost.match(text_filter)) {
        // console.log(card.name + " matches "+text_filter);
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
        // console.log(card.name+" "+card.cost+" "+card.sets+" "+card.types+" "+card.group);
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
  // console.log("There are " + owned_count + " cards that you own, out of " + card_count);
  // console.log("There are " + owned_events.length + " owned events");
  sortCards();
  if (owned_count===0) {
    $$("generate").disable();
  } else {
    $$("generate").enable();
  }
  if (owned_events.length===0) {
    $$("eventcounter").hide();
  } else {
    $$("eventcounter").show();
  }
}

function addInputEvents() {
  var canvas = document.getElementById("cardCanvas");
  canvas.addEventListener("wheel", _.throttle(MouseWheelHandler, 16));
  canvas.addEventListener("mousedown", MouseDownHandler, false);
  canvas.addEventListener("touchmove", TouchMoveHandler, false);
  canvas.addEventListener("touchend", TouchEndHandler, false);

  for(var i = 0 ; i < checkBoxNames.length; i++) {
    $$(checkBoxNames[i]).attachEvent("onChange", ChangeHandler);
  }
  for(var i = 0; i < promoCheckBoxNames.length; i++) {
    $$(promoCheckBoxNames[i]).attachEvent("onChange", ChangeHandler);
  }

  $$("eventcounter").attachEvent("onChange", EventCounterChangeHandler);

  $$("search").attachEvent("onTimedKeyPress", TextChangeHandler);

  $$("sorting").attachEvent("onChange", SortingHandler);

  window.addEventListener("resize", ResizeHandler);
  window.addEventListener("keydown", CtrlKeyDownHandler);
  window.addEventListener("keyup", CtrlKeyUpHandler);
}

var canvasScroll = 0;
var scale = 1.0;

function drawImages() {
  // console.log("Calling drawImages()");
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
    if (this.x > window.innerWidth-this.width-230 ) { // start new row || this.x > this.width*4
      this.x = 0;
      this.y += this.height;
    }
    if (this.y+this.height > canvas.height) {
      canvas.height += this.height;
      // console.log("Height of canvas increased to "+canvas.height);
    }
    if (canvas.height < window.innerHeight) {
      canvas.height = window.innerHeight;
      // console.log("Height of canvas set to window height: " + window.innerHeight);
    }
    if (this.x+this.width > canvas.width) {
      canvas.width += this.width;
      // console.log("Width of canvas increased to "+canvas.width);
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
      blankPage(context);
    }
    for(var i = 0; i < owned_cards.length; i++) {
      if (pos.y+pos.height+canvasScroll > 0 && pos.y+canvasScroll < window.innerHeight) {
        context.drawImage(owned_cards[i].image, pos.x, pos.y, pos.width, pos.height);
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
      if (pos.y+pos.height+canvasScroll > 0 && pos.y+canvasScroll < window.innerHeight) {
        context.drawImage(owned_events[i].image, pos.x, pos.y, pos.width, pos.height);
      }
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
    bottom = -pos.y + window.innerHeight - 360;
    if (bottom > 0) {
      bottom = 0;
    }
    if (pos.y < -canvasScroll) {
      // console.log("Y is less than -canvasScroll. Scrolling up");
      canvasScroll = 0;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, canvasScroll);
    }
  } else if(mode === "Kingdom") { // mode === "Kingdom"
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
        // draw a yellow box - selected
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
        // draw a yellow box - selected
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
    // context.lineTo(canvas.width-20,pos.y);
    // console.log("width = "+pos.width*5);
    context.lineTo(pos.height*5-20, pos.y);
    context.lineWidth="2";
    context.strokeStyle="black";
    context.stroke();
    pos.y+=20;
    pos.x=0;
    pos.width = 200*scale;
    pos.height = 320*scale;
    // RECOMMENDED CARDS
    if (kingdom_bane!==null) {
      var tx=pos.x;
      var ty=pos.y;
      drawExtra(pos, kingdom_bane.name);
      context.fillStyle="#000000";
      context.fillRect(tx+75, ty+150-14, 50, 18);
      context.font = "15px serif";
      context.fillStyle = 'white';
      context.fillText("BANE", tx+75, ty+150);
    }
    drawExtra(pos, "Copper");
    drawExtra(pos, "Silver");
    drawExtra(pos, "Gold");
    drawExtra(pos, "Estate");
    drawExtra(pos, "Duchy");
    drawExtra(pos, "Province");
    drawExtra(pos, "Curse");
    if (extras.hasOwnProperty("spoils") && extras.spoils===true) {
      drawExtra(pos,"Spoils");
    }
    if (extras.hasOwnProperty("platinum") && extras.platinum===true) {
      drawExtra(pos, "Platinum");
    }
    if (extras.hasOwnProperty("colonies") && extras.colonies===true) {
      drawExtra(pos, "Colony");
    }
    if (extras.hasOwnProperty("potions") && extras.potions===true) {
      drawExtra(pos, "Potion");
    }
    if (extras.hasOwnProperty("shelters") && extras.shelters===true) {
      drawExtra(pos, "Hovel");
      drawExtra(pos, "Necropolis");
      drawExtra(pos, "Overgrown Estate");
    } // end shelters

    if (extras.hasOwnProperty("ruins") && extras.ruins===true) {
      drawExtra(pos, "Abandoned Mine");
      drawExtra(pos, "Ruined Library");
      drawExtra(pos, "Ruined Village");
      drawExtra(pos, "Ruined Market");
      drawExtra(pos, "Survivors");
    } //ruins

    if (extras.hasOwnProperty("prizes") && extras.prizes === true) {
      drawExtra(pos, "Bag of Gold")
      drawExtra(pos, "Diadem");
      drawExtra(pos, "Followers");
      drawExtra(pos, "Princess");
      drawExtra(pos, "Trusty Steed");
    }

    if (extras.hasOwnProperty("page") && extras.page === true) {
      drawExtra(pos, "Treasure Hunter")
      drawExtra(pos, "Warrior");
      drawExtra(pos, "Hero");
      drawExtra(pos, "Champion");
    }

    if (extras.hasOwnProperty("peasant") && extras.peasant === true) {
      drawExtra(pos, "Soldier");
      drawExtra(pos, "Fugitive");
      drawExtra(pos, "Disciple")
      drawExtra(pos, "Teacher");
    }

    bottom = -pos.y + window.innerHeight - 360;
    if (bottom > 0) {
      bottom = 0;
    }
    // console.log("drawImages setting bottom to "+bottom);

  } else if (mode === "BlackMarket") {// end mode === "kingdom"
    context.drawImage(cardBack, 240,20, 200, 320);
    context.fillStyle="#cc3333";
    context.fillRect(235, 6, 30, 30);
    context.font = "20px Arial";
    context.fillStyle = 'black';
    var text = ""+blackMarketDeck.length;
    context.fillText(text, 240, 28);
    if (blackMarketSelection.length === 3) {
      pos.x = 20;
      pos.y = 350;
      pos.width = 200;
      pos.height = 320;
      for(var i = 0; i < 3; i++) {
        blackMarketSelection[i].drawX = pos.x;
        blackMarketSelection[i].drawY = pos.y;

        context.drawImage(blackMarketSelection[i].image, pos.x, pos.y, pos.width, pos.height);
        if (canvas.width < 660) {
          canvas.width = 660;
        }
        if (blackMarketSelection[i].selected===true) {
          context.beginPath();
          context.lineWidth="4";
          context.strokeStyle="yellow";
          context.rect(pos.x+2,pos.y+2,pos.width-4,pos.height-4);
          context.stroke();
        }
        pos.x += 220;
      }
    }
  }
}

function blankPage(context) {
  var canvas = document.getElementById("cardCanvas");
  context.font = "28px Arial";
  context.fillStyle = 'black';
  // context.font("PT Sans");
  var x = 30;
  var y = 50;
  context.fillText("Dominion Randomiser", x,  y);
  context.font = "16px Arial";
  context.fillStyle = 'black';
  // view all cards from expansions
  y+=50;
  context.fillText("Select expansions to display cards. Ctrl-click to select all.", x,  y);
  // mark cards as required (green) or banned (red)
  y+=40;
  context.fillText("Click on cards to mark them as required (green) or banned (red)", x,  y);
  // generate a kingdom
  y+=40;
  context.fillText("Search for cards by name, cost or type (Attack, Duration etc)", x,  y);
  y+=40;
  context.fillText("Click the \"Generate Kingdom\" button to choose 10 cards randomly", x,  y);
  // context.fillText("Generate a kingdom of 10 cards and show other supply piles needed", x,  400);
  // select cards to replace them individually,
  y+=60;
  context.fillText("Select cards in the kingdom and click \"Redraw Selected\" to replace them ", x,  y); y+=20;
  context.fillText("individually or select none and replace them all at once.", x,  y);
  // history
  y+=40;
  context.fillText("Click the \"Store\" button to remember what cards were used.", x,  y);
  y+=40;
  context.fillText("Tick the \"Use History\" box and then those cards will be less likely to",x, y);
  y+=20;
  context.fillText("be chosen next time", x,  y);
  // search for cards by name
  y+=60;
  if (bowser.msie || bowser.msedge) {
    context.fillStyle="#cc0000";
    context.fillText("This website is not optimised for Microsoft browsers. Expect some problems.", x,  y);
    y+=60;
  }
  if (loadedImages < numImages) {
    context.fillStyle="#888888";
    context.fillRect(x, y, 3*loadedImages, 3);
  }

  if (window.innerHeight-20 > y) {
    y = window.innerHeight-20;
    if (y > canvas.height) {
      canvas.height = y+60;
    }
  }
  context.font = "12px Arial";
  context.fillText("Thanks to the dominion strategy wiki for the card images. Thanks to sumpfork for card data.", x, y);
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
          if (owned_cards[i].name !== "Black Market") {
            possible_bane.push(owned_cards[i]);
          }
        }
      }
    } else {
      console.log("Cost couldn't be parsed: "+sCost);
    }

  }
  // console.log("There are "+possible_bane.length+" possible bane cards");
  if (possible_bane.length===0) {
    console.log("Can't find a bane card. Suggest removing Young Witch, or a 2-3 cost card from the kingdom");
    return null;
  } else {
    var rand_i = Math.floor(Math.random()*possible_bane.length);
    return possible_bane[rand_i];
  }

}

function loadImages(callback) {
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  numImages = 0;
  numImages = all_cards.length;
  for(var i = 0 ; i < all_cards.length; i++) {
    all_cards[i]['image'] = new Image();
    all_cards[i]['image'].onload = function() {
      if(++loadedImages >= numImages) {
        callback(); // calling code in drawimagesfirst function
      }
      drawXTimes(1);
    };
    // console.log("loaded:"+loadedImages+"/"+numImages+" i:"+i+" card:"+all_cards[i].name);
    var name = all_cards[i].name;
    name = name.replaceAll(" ", "_");
    // console.log("setting src to 'dominion_cards/"+name+".jpg'");
    all_cards[i]['image'].src = "dominion_cards/"+name+".jpg";
    // all_cards[i]['image'].src = all_cards[i].url;
  }
  cardBack = new Image();
  cardBack.onload = function() {};
  // cardBack.src = "http://wiki.dominionstrategy.com/images/c/ca/Card_back.jpg";
  cardBack.src = "dominion_cards/Card_back.png"
}

function drawImagesFirst() {
  loadImages(function(){
    console.log("All images loaded");
    for(var i = 0; i < checkBoxNames.length; i++) {
      $$(checkBoxNames[i]).enable();
    }
  });
}

function MouseWheelHandler(e) {
  if (mode === "Cards" || mode === "Kingdom") {
    var canvas = document.getElementById("cardCanvas");
    var context = canvas.getContext("2d");
    canvasScroll += e.wheelDelta;
    if (canvasScroll > 0) {
      canvasScroll = 0;
    }
    if (canvasScroll < bottom) {
      canvasScroll = bottom;
      //console.log("setting canvasScroll to bottom: "+bottom);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(0, canvasScroll);

    // console.log("canvasScroll " + canvasScroll);
    drawImages();
  }
}

var prevY=null;
function TouchMoveHandler(e) {
  // clearInterval(repeater);
  var canvas = document.getElementById("cardCanvas");
  var context = canvas.getContext("2d");
  var touches = e.changedTouches;
  // console.log("There are "+ touches.length +" touches");
  var y = touches[0].pageY;
  //console.log("X: " + touches[0].pageX +" Y:"+ touches[0].pageY);
  if (prevY===null) {
    //console.log("prevY is null. setting prevY to "+touches[0].pageY);
    prevY=touches[0].pageY;
  } else {
    difference = y-prevY;
    //console.log("Difference: "+(difference));
    canvasScroll += difference;
    // context.translate(0, difference);

    // console.log("difference: "+difference+" canvasScroll: "+canvasScroll+" window.innerHeight:"+window.innerHeight);
    if (canvasScroll > 0) {
      // context.translate(0,-canvasScroll);
      canvasScroll = 0;
    }
    // var bottom = -canvas.height+window.innerHeight-(320*scale);
    // var bottom = -window.innerHeight+(320*scale);
    // console.log("bottom is "+bottom);
    if (canvasScroll < bottom) {
      // context.translate(0,-canvasScroll+bottom);
      canvasScroll = bottom;
      //console.log("setting canvasScroll to bottom: "+bottom);
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(0, canvasScroll);
    // console.log("setting context translate to "+canvasScroll);

    // console.log("canvasScroll " + canvasScroll);
    drawImages();
    prevY=y;
  }
}

function TouchEndHandler(e) {
  // var y = e.changedTouches[0].pageY;
  // var difference = y-prevY;
  // console.log("starting momentum with "+difference);
  // momentum(difference);
  prevY=null;
  //console.log("setting prev Y position to null");
}

function MouseDownHandler(e) {
  var canvas = document.getElementById("cardCanvas");
  var context = canvas.getContext("2d");

  var offX = e.pageX - canvas.offsetLeft;
  var offY = e.pageY - canvas.offsetTop - canvasScroll;
  //console.log("Mouse down at "+offX+" "+offY);
  if (mode === "Cards") {
    for(var i = 0; i < owned_cards.length; i++) {
      var x = owned_cards[i].drawX;
      var y = owned_cards[i].drawY;
      // console.log(owned_cards[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(200*scale) && offY > y && offY < y+(320*scale)) {
        //console.log("Click on "+owned_cards[i].name + " toggle:"+owned_cards[i].toggle);
        owned_cards[i].toggle++;
        owned_cards[i].toggle = owned_cards[i].toggle%3;
        //console.log("Toggle set to " + owned_cards[i].toggle);
      }
    }
    for(var i = 0 ; i < owned_events.length; i++) {
      var x = owned_events[i].drawX;
      var y = owned_events[i].drawY;
      // console.log(owned_events[i].name + "  X:"+x+" Y:"+y);
      if (offX > x && offX < x+(320*scale) && offY > y && offY < y+(200*scale)) {
        //console.log("Click on "+owned_events[i].name + " toggle:"+owned_events[i].toggle);
        owned_events[i].toggle++;
        owned_events[i].toggle = owned_events[i].toggle%3;
        //console.log("Toggle set to " + owned_events[i].toggle);
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
      }

    } // for in kingdom_events
    countSelected();

    // console.log("selected count: "+selected_count);
  } else if (mode === "BlackMarket") {
    if (blackMarketSelection.length === 0) {
      if (offX > 240 && offX < 440 && offY > 20 && offY < 324) {
        // console.log("Clicked top of black market deck");
        revealBlackMarket();
      }
    } else {
      for(var j = 0; j < 3; j++) {
        blackMarketSelection[j].selected = false;
        // console.log("setting " + blackMarketSelection[j].name + " to not selected");
      }
      $$("buyBM").setValue("Buy None");
      for(var i = 0 ; i < 3; i++) {
        var x = blackMarketSelection[i].drawX;
        var y = blackMarketSelection[i].drawY;
        if (offX > x && offX < x+200 && offY > y && offY < y+320) {
          console.log("clicked on "+blackMarketSelection[i].name);
          blackMarketSelection[i].selected = true;
          $$("buyBM").setValue("Buy "+blackMarketSelection[i].name);
          console.log("setting " + blackMarketSelection[i].name + " to selected");
        }
      }
      $$("buyBM").refresh();
    }
  }
  drawXTimes(2);
} // end mouseDownHandler

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

function cardCompareExpansion(a,b) {
  if (a.sets[0] < b.sets[0]) {
    return -1;
  }
  if (a.sets[0] > b.sets[0]) {
    return 1;
  }
  if (a.sets[0] === b.sets[0]) {
    return cardCompareName(a, b);
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

function buyBlackMarket() {
  // console.log("buy the selected card from the black market and put the rest on the bottom of the deck");
  for(var i = 0; i < 3; i++) {
    if (blackMarketSelection[i].selected===false) {
      blackMarketDeck.unshift(blackMarketSelection[i]);
      console.log("adding "+blackMarketSelection[i].name + " to bottom of BM deck");
    } else {
      blackMarketSelection[i].selected = false;
    }
  }
  blackMarketSelection = new Array();
  $$("buyBM").setValue("Buy None");
  $$("buyBM").refresh();
  $$("buyBM").hide();
  bmcount++;
  if (bmcount>=20) {
    bmcount = 0;
    shuffle(blackMarketDeck);
    console.log("Shuffle the Black Market deck as we have gone through it once");
  }
  drawXTimes(2);
}

// code from stackoverflow post 6274339
function shuffle(a) {
    var x;
    for (var i = a.length; i; i--) {
        var j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function showBlackMarket() {
  console.log("switching to black market mode");
  if (mode === "Kingdom") {
    console.log("  from Kingdom mode");
    mode = "BlackMarket";
    $$("generate").setValue("Show Kingdom");
    $$("generate").refresh();
    console.log("setting value of generate button to 'show kingdom'");
    $$("blackMarket").hide();
    $$("redraw").hide();
    $$("store").hide();
    if (blackMarketSelection.length>0) {
      $$("buyBM").show();
    }
    createBlackMarket(); // generate
    canvasScroll = 0;
    drawImages();
  } else {
    console.log("I'm in " + mode + " mode so didn't change things");
  }
}

function switchMode() {
  if (mode === "Kingdom") {
    mode = "Cards";
    //console.log("Switched to Cards mode");
    $$("generate").setValue("Show Kingdom");
    $$("generate").refresh();
    $$("blackMarket").hide();
    $$("redraw").hide();
    $$("search").enable();
    $$("store").hide();
    $$("buyBM").hide();
  } else if (mode === "Cards") {
    mode = "Kingdom";
    //console.log("Switched to Kingdom mode");
    $$("generate").setValue("Show Cards");
    $$("generate").refresh();
    $$("redraw").show();
    $$("search").disable();
    $$("store").show();
    if (canvasScroll < -500) {
      var canvas = document.getElementById('cardCanvas');
      var context = canvas.getContext('2d');
      context.translate(0, -canvasScroll);
      canvasScroll = 0;
    } else {
      //console.log("when switching modes canvasScroll is " + canvasScroll);
    }
    generate();
    if (containsCardName(kingdom_cards, "Black Market")) {
      $$("blackMarket").show();
    } else {
      $$("blackMarket").hide();
    }
    $$("buyBM").hide();
  } else if (mode === "BlackMarket") {
    mode = "Kingdom";
    //console.log("Switched to Kingdom mode");
    $$("generate").setValue("Show Cards");
    $$("generate").refresh();
    $$("blackMarket").show();
    $$("redraw").show();
    $$("search").disable();
    $$("store").show();
    $$("redraw").show();
    $$("buyBM").hide();
    canvasScroll = 0;
    generate();
  }
  drawXTimes(8);
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
  // var rand_i = Math.floor(Math.random()*kingdom_cards.length);
  // if (kingdom_cards[rand_i].sets.includes("dark ages")) {
    // extras['shelters']=true;
  // }
  if (chooseRandomX(kingdom_cards, false).sets.includes("dark ages")) {
    extras['shelters']=true;
  } else {
    extras['shelters']=false;
  }
  // ruins
  extras['ruins']=false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].types.includes("Looter")) {
      extras['ruins']=true;
    }
  }
  // curses - always use curses
  // potion
  extras['potions']=false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].sets.includes("alchemy")) {
      extras['potions']=true;
    }
  }
  // platinum /colonies

  var rand_i = Math.floor(Math.random()*kingdom_cards.length);
  if (kingdom_cards[rand_i].sets.includes("prosperity")) {
    extras['platinum']=true;
    extras['colonies']=true;
  } else {
    extras['platinum']=false;
    extras['colonies']=false;
  }
  // spoils // bandit camp, marauder, pillage

  extras['spoils']=false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].name === "Bandit Camp" || kingdom_cards[i].name === "Marauder" || kingdom_cards[i].name === "Pillage") {
      extras['spoils']=true;
    }
  }

  // tournament
  // page
  extras['prizes']=false;
  extras['page']=false;
  extras['peasant']=false;
  for(var i = 0; i < kingdom_cards.length; i++) {
    if (kingdom_cards[i].name === "Tournament") {
      extras['prizes']=true;
    }
    if (kingdom_cards[i].name === "Page") {
      extras['page']=true;
    }
    if (kingdom_cards[i].name === "Peasant") {
      extras['peasant']=true;
    }
  }

  // young witch / bane
  // console.log("Choose a kingdom card from the owned cards that is not in the kingdom that costs 2-3");
  return extras;
}

function generate() {
  loadStorage();
  $$("search").setValue("");
  getOwnedCards();

  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  countSelected();
  if (mode === "Kingdom") {
    // CHOOSING CARDS /////////////////////
    if (kingdom_cards.length==0) {
      // generate new kingdom
      for(var i = 0 ; i < owned_cards.length; i++) {
        if (owned_cards[i].toggle === 1) { // required
          //console.log("Adding required card "+owned_cards[i].name+" to kingdom");
          kingdom_cards.push(owned_cards[i]);
        }
      }
      // if there were too many required cards remove some
      while (kingdom_cards.length > 10) {
        var rand_i = Math.floor(Math.random()*kingdom_cards.length);
        //console.log("Removing "+kingdom_cards[rand_i].name+" from over filled kingdom");
        kingdom_cards[rand_i].selected = false;
        kingdom_cards.splice(rand_i, 1);
      }
      //
      count = 0
      while (kingdom_cards.length < 10 && count < 1000) {
        // choose random card and add it to the kingdom if it's not
        var random_card = chooseRandomX(owned_cards, true);
        if (!containsCard(kingdom_cards, random_card)) {
          if (random_card.toggle < 2) {
            kingdom_cards.push(random_card);
          }
        }
        count++;
      }
      count = 0
      while (kingdom_cards.length < 10 && count < 1000) {
        // choose random card and add it to the kingdom if it's not
        var random_card = chooseRandomX(owned_cards, true);
        if (!containsCard(kingdom_cards, random_card)) {
          kingdom_cards.push(random_card);
        }
        count++;
      }
      if (containsCardName(kingdom_cards, "Black Market")) {
        createBlackMarket();
      } else {
        clearBlackMarket();
      }

      if (containsCardName(kingdom_cards, "Young Witch")) {
        kingdom_bane = chooseBaneCard();
      } else if(blackMarketDeck && containsCardName(blackMarketDeck, "Young Witch")) {
        kingdom_bane = chooseBaneCard();
      } else {
        kingdom_bane = null;
      }
    } // end of when there are 0 cards in the kingdom
    sortCards();
    // CHOOSING EVENTS ///////////////////////////
    chooseKingdomEvents();
    $$("redraw").show();
    recommendations();
    drawImages();
  }
}

function chooseKingdomEvents() {

    var numEvents = $$("eventcounter").getValue();
    if (owned_events.length === 0) {
      numEvents = 0;
    }
    // console.log("should have "+numEvents+" events");

    // if the number of events is less than wanted
    if (kingdom_events.length < numEvents) {
      // make a list of required events
      //console.log("there are not enough events")
      var requiredEvents = []
      for(var i = 0 ; i < owned_events.length; i++) {
        if (owned_events[i].toggle === 1) { // required
          if (!containsCard(kingdom_events, owned_events[i])) {
            //console.log("adding "+owned_events[i].name+" to the list of required events");
            requiredEvents.push(owned_events[i]);
          }
        }
      }
      if (kingdom_events.length + requiredEvents.length <= numEvents && requiredEvents.length > 0) {
        // add all the requiredEvents to the kingdom
        //console.log("there are "+kingdom_events.length+" events already and " + requiredEvents.length +" required events so adding them all");
        for(var i = 0; i < requiredEvents.length; i++) {
          kingdom_events.push(requiredEvents[i]);
        }
      } else if (requiredEvents.length > 0) {
        // add some of the requiredEvents to the kingdom
        //console.log("there are "+kingdom_events.length+" events already and " + requiredEvents.length +" required events so adding some of them");
        while (kingdom_events.length < numEvents && requiredEvents.length > 0) {
          // choose a random required event from the list and add it to the kingdom
          var rand_i = Math.floor(Math.random()*requiredEvents.length);
          //console.log("Choosing "+requiredEvents[rand_i].name+" to add to the kingdom")
          kingdom_events.push(requiredEvents[rand_i]);
          requiredEvents.splice(rand_i,1);
        }

      }

      // pick randomly from list of required events
      // are there enough required events to make up the number
      // pick randomly from other events
      count=0;
      while (kingdom_events.length < numEvents && count < 1000) {
        // console.log(kingdom_events.length +" < "+numEvents);
        // var rand_i = Math.floor(Math.random()*owned_events.length);
        var random_event = chooseRandomX(owned_events, true);
        if (!containsCard(kingdom_events, random_event)) {  // not already in kingdom
          if (random_event.toggle < 2) {                    // isn't banned
            //console.log("adding event "+random_event.name);
            kingdom_events.push(random_event);
          }
        }
        count++;
      }
    }

    // if the number of events is more than wanted
    while (kingdom_events.length > numEvents) {
      //console.log("there are too many events ("+kingdom_events.length+") and only need " + numEvents +" so removing some");
      var requiredEvents = [];
      for(var i = 0 ; i < owned_events.length; i++) {
        if (owned_events[i].toggle === 1) { // required
          //console.log("adding "+owned_events[i].name+" to the list of required events");
          requiredEvents.push(owned_events[i]);
        }
      }
      if (requiredEvents.length < kingdom_events.length && requiredEvents.length > 0) {
        //console.log("There are "+requiredEvents.length+" required events");
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
    // remove some if there are more than 10
    while (cardsToAdd.length > 10) {
      var rand_i = Math.floor(Math.random()*cardsToAdd.length);
      cardsToAdd.splice(rand_i, 1);
    }
    count = 0;
    while (cardsToAdd.length < 10 && count < 1000) {
      // add more cards that aren't cardsToAdd, and aren't in kingdomCards
      var card = chooseRandomX(owned_cards, true);
      if (!containsCard(cardsToAdd, card)) {
        if (!containsCard(kingdom_cards, card)) {
          if (card.toggle < 2) {
            cardsToAdd.push(card);
          }
        }
      }
      count++;
    }

    count = 0;
    while (cardsToAdd.length < 10 && count < 1000) {
      // add more cards that aren't cardsToAdd, and might be in kingdomCards if there aren't enough
      var card = chooseRandomX(owned_cards, true);
      if (!containsCard(cardsToAdd, card)) {
        if (card.toggle < 2) {
          cardsToAdd.push(card);
        }
      }
      count++;
    }

    kingdom_cards=[];
    for(var i = 0 ; i < cardsToAdd.length; i++) {
      kingdom_cards.push(cardsToAdd[i]);
    }
    if (containsCardName(kingdom_cards, "Black Market")) {
      createBlackMarket();
    } else {
      clearBlackMarket();
    }
    kingdom_events = [];
    // choose new events that aren't in the list
    chooseKingdomEvents();
    sortCards();
  } else {
    // REDRAW JUST SELECTED CARDS
    var cardsToRemove = []; // list of cards, not list of card names
    var cardsToAdd = []; // list of card objects, not strings of card names
    // get list of cards to remove based on if they were selected yellow
    for(var i = 0; i < kingdom_cards.length; i++) {
      if (kingdom_cards[i].selected === true) {
        cardsToRemove.push(kingdom_cards[i]);
      }
    }
    // choose from required cards that aren't in kingdom or were just removed
    count=0;
    while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
      // build list of required cards
      var requiredCards = [];
      for(var i = 0; i < owned_cards.length; i++) {
        if (owned_cards[i].toggle === 1) {
          requiredCards.push(owned_cards[i]);
        }
      }
      if (requiredCards.length > 0) {
        var card = chooseRandomX(requiredCards, true);
        if (!containsCard(cardsToAdd, card)) {
          if (!containsCard(kingdom_cards, card)) {
            if(!containsCard(cardsToRemove, card)) {
              if (card.toggle === 1) {
                cardsToAdd.push(card);
              }
            }
          }
        }
      } else {
        count = 1000;
      }
      count++;
    }
    count=0;
    while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
      var card = chooseRandomX(owned_cards, true);
      if (!containsCard(cardsToAdd, card)) {
        if (!containsCard(kingdom_cards, card)) {
          if(!containsCard(cardsToRemove, card)) {
            if (card.toggle < 2) {
              cardsToAdd.push(card);
            }
          }
        }
      }
      count++;
    }
    count=0;
    while (cardsToAdd.length < cardsToRemove.length && count < 1000) {
      var card = chooseRandomX(owned_cards, true);
      if (!containsCard(cardsToAdd, card)) {
        if (!containsCard(kingdom_cards, card)) {
          if (card.toggle < 2) {
            cardsToAdd.push(card);
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
  } else if(blackMarketDeck && containsCardName(blackMarketDeck, "Young Witch")) {
    kingdom_bane = chooseBaneCard();
  } else {
    kingdom_bane = null;
  }
  if (containsCardName(kingdom_cards, "Black Market")) {
    $$("blackMarket").show();
  } else {
    $$("blackMarket").hide();
  }
  sortCards();
  countSelected();
  recommendations();
  drawXTimes(3);
} // end redrawSelected

function revealBlackMarket() {
  // take the top 3 cards from the deck and store them
  for(var i = 0; i < 3; i++) {
    blackMarketSelection.push(blackMarketDeck.pop());
  }
  console.log("picked 3 cards from the top of the deck:");
  for(var i = 0; i < blackMarketSelection.length; i++) {
    blackMarketSelection[i].selected=false;
    // console.log("  "+blackMarketSelection[i].name);
  }
  $$("buyBM").show();
}

function createBlackMarket() { // generate the black market deck
  // only if the deck is empty
  if (blackMarketDeck.length === 0) {
    while (blackMarketDeck.length < 60 && count < 1000) {
      var card = chooseRandomX(owned_cards, false);
      if (!containsCard(kingdom_cards, card)) {
        if (!containsCard(blackMarketDeck, card)) {
          blackMarketDeck.push(card);
          // console.log("Adding " + card.name + " to black market deck");
        }
      }
      count++;
    }
  } else {
    for(var i = 0 ; i < blackMarketDeck.length ; i++) {
      console.log(blackMarketDeck[i].name);
    }
  }
}

function clearBlackMarket() {
  blackMarketDeck = [];
  blackMarketSelection = [];
}

function chooseRandomX(array, weighted) { // returns card object
  if (weighted===true && $$("history").getValue()===1) {
    var count = 0;
    var total = 0
    for(var i = 0; i < array.length; i++) {
      if (array[i].used) {
        count = array[i].used;
      } else {
        count = 0;
      }
      total += 1.0/(count+1);
    }
    var r = Math.random() * total;

    var choose = -1;
    total = 0;
    for(var i = 0; i < array.length; i++) {
      if (array[i].used) {
        count = array[i].used;
      } else {
        count = 0;
      }
      total += 1.0/(count+1);
      if (r < total) {
        choose = i;
        i = array.length;
      }
    }
    //console.log("choosing random card ("+array[choose].name+") from weighted list");
    return array[choose];
  } else {
    var rand_i = Math.floor(Math.random()*array.length);
    return array[rand_i];
  }
} // end chooseRandomX

function drawXTimes(x) {
  drawImages();
  var callCount = 1;
  var repeater = setInterval(function () {
    if (callCount < x) {
      // console.log("calling drawImages on a timer: "+callCount);
      drawImages();
      callCount += 1;
    } else {
      clearInterval(repeater);
    }
  }, 100);
}

function momentum(speed) {
  //console.log("starting momentum with "+speed);
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  var scroll = speed;
  repeater = setInterval(function () {
    //console.log("absolule scroll :"+Math.abs(scroll));
    if (Math.abs(scroll) > 2) {
      // console.log("calling drawImages on a timer: "+scroll);
      canvasScroll += scroll;
      if (canvasScroll > 0) {
        canvasScroll = 0;
      }
      if (canvasScroll < bottom) {
        canvasScroll = bottom;
      }
      //console.log("momentum speed "+scroll);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, canvasScroll);
      scroll *= 0.8;
      //console.log("reducing scroll to "+scroll);
      drawImages();
    } else {
      //console.log("clearing momentum repeater");
      clearInterval(repeater);
    }
  }, 25);

}

// function CheckBoxClickHandler(e) {
//   console.log("click!")
//   if (e.ctrlKey) {
//     // console.log("ctrl key was pressed!");
//   } else {
//     console.log("ctrl key not detected");
//   }
// }

function CtrlKeyDownHandler(e) {
  // console.log("key down!");
  if (e.ctrlKey) {
    // console.log("ctrl key was pressed!");
    ctrlKey = true;
  } else {
    // console.log("ctrl key not detected");
  }
}
function CtrlKeyUpHandler(e) {
  ctrlKey = false;
}

function ChangeHandler(e) { // for checkboxes
  // console.log("Change!");
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  context.translate(0, -canvasScroll);
  canvasScroll = 0;
  //console.log("ctrlKey:"+ctrlKey);
  if (ctrlKey) {
    // var target = e.target || e.srcElement;
    // console.log("event:"+e);
    // console.log("set all other checkboxes to be equal to the state of this check box: "+target.getValue());
    for(var i = 0; i < checkBoxNames.length; i++) {
      $$(checkBoxNames[i]).setValue(e);
    }
  }

  getSets();
  getOwnedCards();
  rememberSets();
  drawXTimes(3);
}

function SortingHandler(e) {
  sortCards();
  drawXTimes(1);
}

function sortCards() {
  if ($$("sorting").getValue()===0) {
    kingdom_cards.sort(cardCompareCost);
    owned_cards.sort(cardCompareCost);
    kingdom_events.sort(cardCompareCost);
    owned_events.sort(cardCompareCost);
  } else {
    kingdom_cards.sort(cardCompareExpansion);
    owned_cards.sort(cardCompareExpansion);
    kingdom_events.sort(cardCompareExpansion);
    owned_events.sort(cardCompareExpansion);
  }
}

function rememberSets() {
  var promos = [];
  for(var i = 0; i < promoCheckBoxNames.length; i++) {
    if ($$(promoCheckBoxNames[i]).getValue()===1) {
      promos.push(promoCardNames[i]);
    }
  }
  var cards = sets.concat(promos);
  localStorage['sets'] = cards.join(",");
}

function recallSets() {
  if (localStorage && localStorage.hasOwnProperty('sets')) {
    var list = localStorage['sets'].split(",");
    for(var i = 0 ; i < list.length; i++) {
      for(var j = 0; j < checkBoxNames.length; j++) {
        if (list[i] === setNames[j]) {
          $$(checkBoxNames[j]).setValue(1);
        }
      }
      for(var j = 0; j < promoCheckBoxNames.length; j++) {
        if (list[i] === promoCardNames[j]) {
          $$(promoCheckBoxNames[j]).setValue(1);
        }
      }
    }
    getSets();
    getOwnedCards();
    drawXTimes(3);
  }
}

function EventCounterChangeHandler(e) {
  //console.log("counter is now " + $$("eventcounter").getValue());
  generate();
}

function TextChangeHandler(e) {
  //console.log("text changed");
  getOwnedCards();
  drawXTimes(1);
}

function ResizeHandler(e) {
  var canvas = document.getElementById('cardCanvas');
  var context = canvas.getContext('2d');
  // context.translate(0, -canvasScroll);
  canvasScroll = 0;
  context.setTransform(1, 0, 0, 1, 0, 0);
  drawXTimes(3);
}

function store() {
  // var answer = confirm("Would you like to store this Kingdom");
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth()+1;
  var day = date.getDate();
  day = (day<10?"0":"") + day;
  month = (month<10?"0":"") + month;
  var minutes = date.getMinutes();
  var hours = date.getHours();
  var seconds = date.getSeconds();
  minutes = (minutes<10?"0":"") + minutes;
  hours = (hours<10?"0":"") + hours;
  seconds = (seconds<10?"0":"") + seconds;
  var time = year + "-" + month + "-" + day +"_"+hours+"-"+minutes+"-"+seconds;

  var answer = true;
  //console.log(answer);
  if (answer===true) {
    var kingdom = [];

    for(var i=0;i<kingdom_cards.length;i++) {
      kingdom.push(kingdom_cards[i].name);
    }
    for(var i=0;i<kingdom_events.length;i++) {
      kingdom.push(kingdom_events[i].name);
    }
    prompt("Kingdom:", kingdom.join(", "));
    var string = JSON.stringify(kingdom);
    //console.log(string);
    localStorage[time] = string;

  } else {
    //console.log("Kingdom not stored");
  }
}

function loadStorage() {
  for(var y = 0; y < all_cards.length; y++) {
    all_cards[y]['used'] = 0;
  }
  var list;
  var ok = false;
  for(var d in localStorage) {
    if (d === 'sets') {
    } else {
      try {
        list = JSON.parse(localStorage[d]);
        ok = true;
      }
      catch(SyntaxError) {
        console.log("found a syntax error in localStorage");
        ok = false;
      }
      if (ok == true) {
        for(var i = 0; i < list.length; i++) {
          for(var y = 0; y < all_cards.length; y++) {
            if (all_cards[y].name === list[i]) {
              all_cards[y]['used']++;
            }
          }
        }
      }
    }
  }
}
