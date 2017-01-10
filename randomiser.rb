#!/usr/bin/env ruby

# randomiser_v3

# TODO:
#
# add a way to limit the cost of the deck, so you don't get too many high cost
# cards
#
# add a way to view all cards from an expansion
#
# show on gui if you need to use ruins, shelters, spoils, paltinum, colony

require 'json'
require 'set'

class String
  def titlecase
    split(/(\W)/).map(&:capitalize).join
  end
  def print_column size
    n=size-self.size
    spaces = " " * n if n > 0
    return self+spaces
  end
end

class Randomiser
  def initialize app
    @app = app
    # sets = "adventures,darkages"
    #sets, max_attacks, need_reaction, events, curser, trash, villages, draw, set_minimum
    max_attacks=1
    need_reaction=true
    # events = "2,3"
    curser = true
    trash = true
    villages = 0
    draw = 1
    set_minimum = 2
    @sets = Set.new
    @events = Hash.new
    @landmarks = Set.new
    @owned = Hash.new
    @kingdom = Array.new # list of cards. a card is a hash
    @kingdom_events = Array.new
    @history = Hash.new
    @curse_trasher = curser
    @need_trasher = trash
    @min_villages = villages
    @min_draw = draw
    @set_minimum = set_minimum

    @history_file = "randomiser_history.json"
    # sets.split(",").each do |set|
    #   if set=="darkages"
    #     set="dark ages"
    #   end
    #   @sets << set
    # end
    # if @sets.size > 5
    #   @set_minimum = 1
    # end
    # if events.split(",").size == 2
      # @min_events, @max_events = events.split(",").map(&:to_i)
    # else
      # abort "Can't parse number of events"
    # end
    @max_attacks = max_attacks
    @need_reaction = need_reaction
  end

  def load_card_descriptions
    json = "cards_en_us.json"
    if File.exist?(json)
      @desc = JSON.parse(File.read(json))
    end
    @desc.each do |name, desc|
      description = desc["description"]
      description.gsub!("<br>","\n")
      description.gsub!("<n>","\n")
      description.gsub!("<i>","")
      description.gsub!("</i>","")
      description.gsub!("<line>", "\n--------\n")
      if @owned.has_key?(name)
        @owned[name]["description"] = description
      end
    end

  end

  def load_cards

    json = "cards_db.json"
    if File.exist?(json)
      @cards = JSON.parse(File.read(json))
      @all_sets = Set.new
      @cards.each do |card|
        name = card["card_tag"]
        card["types"].each do |type|
          card["cardset_tags"].each do |set_tag|
            @all_sets << set_tag
          end
        end
      end
    end
  end

  def get_owned_cards
    # set_counts = @sets.to_a.zip(Array.new(set.length, 0)).to_h
    @owned.clear
    @events.clear
    @cards.each do |card|
      name = card["card_tag"]
      non_supply = false
      card["types"].each do |type|
        card["cardset_tags"].each do |set_tag|
          if @sets.include?(set_tag)
            if type == "Event" or type == "Landmark"
              @events[card] = card
              non_supply = true
            end
            # if type == "Landmark"
              # @landmarks << card
              # non_supply = true
            # end
            if type == "Ruins" or  type == "Shelter" or name == "Spoils"
              non_supply = true
            end
          end
        end
      end
      unless non_supply
        unless card["cardset_tags"].include?("base") 
          card["cardset_tags"].each do |set_tag|
            if @sets.include?(set_tag)
              if card.has_key?("group_tag")
                if card["group_tag"] =~ /\-/
                  if card.has_key?("group_top") and card["group_top"] == true
                    @owned[name] = card
                  end
                else
                  @owned[name] = card
                end
              else
                @owned[name] = card
              end
            end
          end
        end
      end
    end
    unknown_sets = (@sets - @all_sets)
    if unknown_sets.size > 0
      puts "Set not recognised"
      unknown_sets.each do |unknown|
        puts unknown
      end
      abort "Aborting"
    end
  end

  def owned_to_str
    # print all owned cards
    @owned.each do |name, card|
      puts "#{name}\t#{card["cardset_tags"].join(", ")}"
    end
  end

  def kingdom_count
    @attacks=0
    @reactions=0
    @total_cost=0
    @durations=0
    @villages=0
    @draw=0
    @buys=0
    @trasher=0
    @curser =0
    @set_counts = @sets.to_a.zip(Array.new(@sets.length, 0)).to_h
    @trash_cards = ["Advance","Altar","Amulet","Apprentice","Bishop","Bonfire",
      "Butcher","Chapel","Death Cart","Develop","Doctor","Donate","Expand",
      "Forager","Forge","Graverobber","Hermit","Jack of all Trades",
      "Junk Dealer","Loan","Lookout","Masquerade","MercenaryCount","Mine",
      "Mint","Moneylender","Plan","Procession","Ratcatcher","Rats","Raze",
      "Rebuild","Remake","Remodel","Replace","Ritual","Salvager","Sentry",
      "Small Castle","Spice Merchant","Steward","Stonemason","Taxman",
      "Temple","Trade","Trader","Trade Route","Trading Post","Transmogrify",
      "Upgrade"]
    villages = ["Village", "Mining Village", "Shanty Town",
      "Bazaar", "City", "Worker's Village", "Farming Village",
      "Border Village", "Inn", "Bandit Camp", "Fortress", "Madman",
      "Wandering Minstrel", "Plaza", "Port", "Lost City", 
      "Encampment", "Bustling Village"]
    @kingdom.each do |card|
      #@set_counts[card["cardset_tags"].first] += 1
      card["cardset_tags"].each do |cardset|
        if @set_counts.has_key?(cardset)
          @set_counts[cardset] += 1
        end
      end
      if card["types"].include?("Attack")
        @attacks += 1
      end
      if card["types"].include?("Reaction")
        @reactions += 1
      end
      if card["types"].include?("Duration")
        @durations += 1
      end
      if card["card_tag"] == "Peddler"
        @total_cost += 4
      else
        @total_cost += card["cost"].to_i
      end
      if villages.include?(card["card_tag"])
        @villages+=1
      end
      if card["description"] =~ /\+[2-5].Card/
        @draw += 1
      end
      if card["description"] =~ /\+[1-4].Buy/
        @buys += 1
      end
      if (card["description"] =~ /Curse/ or card["description"] =~ /Ruins/) and
        card["card_tag"] != "Vagrant"
        @curser += 1 # curses or ruins
      end
      
      if @trash_cards.include?(card["card_tag"])
        @trasher += 1
      end
    end
    if @need_reaction and @attacks > 0
      @required_reaction = 1
    else
      @required_reaction = 0
    end
    if @need_trasher and @curser > 0
      @required_trasher = 1
    else
      @required_trasher = 0
    end
  end

  def replace_a_card replace=nil
    # @app.alert "Replacing card index #{replace}" unless replace.nil?
    if replace
      remove_this = @kingdom[replace]
    else
      remove_this = @kingdom.sample
    end
    @kingdom.delete(remove_this)
    new_card = choose_random_card
    while @kingdom.include?(new_card) or 
         new_card["card_tag"]==remove_this["card_tag"]
      new_card = choose_random_card
    end
    @kingdom << new_card
    if replace
      msg = "removed: #{remove_this["card_tag"]}, added: #{new_card["card_tag"]}"
      @app.debug msg
    end
  end

  def replace_an_event replace=nil
    if replace
      remove_this = @kingdom_events[replace]
    else
      remove_this = @kingdom_events.sample
    end
    @kingdom_events.delete(remove_this)
    new_card = choose_random_event
    while @kingdom_events.include?(new_card) or 
         new_card["card_tag"]==remove_this["card_tag"]
      new_card = choose_random_event
    end
    @kingdom_events << new_card
    # if replace
      # puts "removed: #{remove_this["card_tag"]}, added: #{new_card["card_tag"]}"
    # end
  end

  def describe number
    if number <1 or number>10
      @kingdom.each do |card|
        describe_card(card)
      end
    else
      describe_card(@kingdom[number-1])
    end
  end

  def describe_card card
    print "\n"
    puts "________"
    puts "(#{card["cost"]}) #{card["card_tag"]}"
    puts "--------"
    puts card["description"]
    puts "________"
    print "\n"
  end

  def choose_random_card
    total = 0
    @owned.each do |name,card|
      total += 1.0/(card["used"].to_f+1.0)
    end
    r = rand * total
    count = 0
    choose = "na"
    @owned.each do |name,card|
      choose = card["card_tag"]
      count += 1.0/(card["used"].to_f+1.0)
      if r < count
        # puts "choosing: #{name}"
        break
      end
    end
    return @owned[choose]
  end

  def choose_random_event
    total=0
    @events.each do |name, card|
      if card.has_key?("used")
        used = card["used"]
      else
        used = 0
      end
      total += 1.0/(used.to_f+1.0)
    end
    r = rand * total
    count = 0
    choose = nil
    @events.each do |name, card|
      choose = card
      if card.has_key?("used")
        used = card["used"]
      else
        used = 0
      end
      count += 1.0/(used.to_f+1.0)
      break if r < count
    end
    return choose
  end


  def select_events
    @kingdom_events.clear
    number_events = ((rand*(@max_events+1-@min_events))+@min_events).to_i
    number_events = 0 if @events.size==0
    @app.debug "There should be #{number_events} events"
    if number_events > 0
      while @kingdom_events.size < number_events
        event = choose_random_event
        unless @kingdom_events.include?(event)
          @kingdom_events << event
        end
      end
    end
  end

  def build_kingdom
    @kingdom = []
    while @kingdom.size < 10
      # card = @owned.to_a.sample
      card = choose_random_card
      unless @kingdom.include?(card)
        @kingdom << card
      end
    end
    kingdom_count()
    count=0
    while count < 1000 and (@attacks > @max_attacks or @reactions < @required_reaction or 
       @trasher < @required_trasher or @draw < @min_draw or 
       @villages < @min_villages or @set_counts.values.min < @set_minimum) 
      replace_a_card()
      kingdom_count()
      count+=1
    end
    select_events
    puts "count: #{count}" if count > 900
    @toggles={}
    @kingdom.each do |card|
      @toggles[card]=false
    end
    @kingdom_events.each do |card|
      @toggles[card]=false
    end
  end

  def recommendations
    if @total_cost > 45 and @sets.include?("prosperity") 
      puts "Recommend to use Platinum and Colony"
    end
    spoils=false
    looter=false
    shelters=false
    @kingdom.each do |card|
      types = card["types"]
      name = card["card_tag"]
      if ["Bandit Camp", "Marauder", "Pillage"].include?(name)
        spoils=true
      end
      types.each do |type|
        if type == "Looter"
          looter=true
        end
      end
    end
    if @kingdom.sample["cardset_tags"].include?("dark ages")
      shelters=true
    end
    puts "Use Spoils" if spoils
    puts "Use Ruins" if looter
    puts "Use Shelters" if shelters

  end

  def output_kingdom
    kingdom_count()
    #p @set_counts.values.min
    puts "Attacks: #{@attacks}, Reaction: #{@reactions}, Required Reaction: #{@required_reaction}, Total Cost: #{@total_cost}"
    puts "Villages: #{@villages}, Draw: #{@draw}, Buys: #{@buys}, Trashers: #{@trasher}, Cursers: #{@curser}"
    puts "Required Trashers: #{@required_trasher}"
    #@kingdom.to_a.sort_by{|c| c["cost"]}.each_with_index do |card, i|
    @kingdom = @kingdom.sort_by{|c| c["cost"]}
    @kingdom_events = @kingdom_events.sort_by{|c| c["cost"]}
    @kingdom.each_with_index do |card, i|  
      print "#{i+1}\t"
      print "(#{card["cost"]}) #{card["card_tag"]}".print_column(24)
      print "(#{card["cardset_tags"].first.titlecase})\n"
      # puts card["description"]
    end
    puts "Events:" if @kingdom_events.size > 0
    @kingdom_events.each_with_index do |card, i|
      puts "#{i+1}\t(#{card["cost"]}) #{card["card_tag"]}"
    end
    recommendations
  end


  def get_input
    puts "What would you like to do:"
    puts "(U)se, (R)estart, (C)hange Card, Change (E)vent, (D)escribe, (Q)uit"
    input = gets.chomp
    if input.nil? or input==""
      input = " "
    end
    return input
  end

  def load_history
    # load history from json file
    @date = Time.now.to_s[0..-7].gsub(":", "").gsub("-", "").gsub(" ", "_")
    if File.exist?(@history_file)
      @history = JSON.parse(File.read(@history_file))
    else
      @history[@date] = {}
      @history[@date] = {}
      @history[@date]["card"]={} # this could be an array TODO
      @history[@date]["event"]={} # don't need counts as they will always be 1
    end
    total_used = {}
    total_used["card"]={}
    total_used["event"]={}
    @history.each do |date, hash|
      hash["card"].each do |card, count|
        total_used["card"][card]||=0
        total_used["card"][card]+=1
      end
      hash["event"].each do |card, count|
        total_used["event"][card]||=0
        total_used["event"][card]+=1
      end
    end
    @owned.each do |name, card|
      name = card["card_tag"]
      if total_used["card"].has_key?(name)
        used = total_used["card"][name]
      else
        used = 0
      end
      card["used"] = used
    end
    @events.each do |name, card|
      if total_used["event"].has_key?(name)
        used = total_used["event"][name]
      else
        used = 0
      end
      card["used"] = used
    end
  end

  def store_kingdom
    # add to counts
    @history[@date]||={}
    @kingdom.each do |card|
      name = card["card_tag"]
      @history[@date]["card"] ||= {}
      @history[@date]["card"][name] ||= 0
      @history[@date]["card"][name] += 1
    end
    @kingdom_events.each do |event|
      name = event["card_tag"]
      @history[@date]["event"] ||= {}
      @history[@date]["event"][name] ||= 0
      @history[@date]["event"][name] += 1
    end
    # save history to json file
    File.open(@history_file, "w") do |io|
      io.write (@history.to_json.gsub("},\"20", "},\n\"20"))
    end
  end

  def check_boxes
    # caption
    @check_boxes = {}
    caption = @app.caption "Select Expansions"
    caption.move(10,10)
    # check boxes
    x = 10
    y = 40
    @all_sets.to_a.sort.each do |set|
      unless set=="base" or set=="promo" or set=~/Upgrade/
        cb = @app.flow do 
          c = @app.check
          @app.para set.titlecase
          @check_boxes[set] = c
          if set=~/adventures/ or set=~/dark\ ages/ or set=~/intrigue2/ or
            set=~/prosperity/
            c.checked = true
          end
        end
        cb.move(x, y)
        y+=25
      end
    end
  end

  def options
    caption = @app.caption "Options"
    y=370
    step=30
    caption.move(10, y)
    y+=step
    # attack
    attack_count = @app.flow do
      @app.para "Max Attack Cards:"
      @attack_count_edit_line = @app.edit_line :width => 40
      @attack_count_edit_line.text = "1"
    end
    attack_count.move(10,y)
    y+=step

    # events (min,max)
    event_count = @app.flow do
      @app.para "Min/Max Events:"
      @event_min_edit_line = @app.edit_line :width => 40
      @event_max_edit_line = @app.edit_line :width => 40
      @event_min_edit_line.text = "2"
      @event_max_edit_line.text = "3"
    end
    event_count.move(10,y)
    y+=step

    # set minimum
    set_count = @app.flow do
      @app.para "Set Minimum:"
      @set_minimum_edit_line = @app.edit_line :width => 40
      @set_minimum_edit_line.text = "2"
    end
    set_count.move(10,y)
    y+=step

    # reaction
    need_reaction_check_flow = @app.flow do
      @required_reaction_check = @app.check
      reaction_caption = @app.para "Require reaction if attack present"
      reaction_caption.style :width => 200
      @required_reaction_check.checked = @need_reaction
    end
    need_reaction_check_flow.move(10,y)
    y+=step+10
    # curser
    # trasher
    need_trasher_check_flow = @app.flow do
      @required_trasher_check = @app.check
      require_trasher_caption = @app.para "Require a card that trashes"
      require_trasher_caption.style :width => 200
      @required_trasher_check.checked = @need_trasher
    end
    need_trasher_check_flow.move(10,y)
    y+=step
    # villages
    # draw


  end

  def read_options
    @max_attacks = @attack_count_edit_line.text.to_i
    @need_reaction = @required_reaction_check.checked
    @min_events = @event_min_edit_line.text.to_i
    @max_events = @event_max_edit_line.text.to_i
    @set_minimum = @set_minimum_edit_line.text.to_i    
  end

  def buttons
    x=10
    y=600
    width=160
    generate_button = @app.button "Generate"
    generate_button.click do
      @sets = Set.new
      @check_boxes.each do |set,box|
        if box.checked?
          @sets << set
        end
      end
      get_owned_cards
      read_options
      build_kingdom
      draw_kingdom
    end
    generate_button.style :width => width
    generate_button.move(x, y)

    redraw_button = @app.button "Redraw Selected"
    redraw_button.click do
      @app.debug "pressed Replace button"
      @toggles.each do |toggle_card, bool|
        if bool
          @kingdom.each_with_index do |card, i|
            if card["card_tag"] == toggle_card["card_tag"]
              replace_a_card i
            end
          end
          @kingdom_events.each_with_index do |card, i|
            if card["card_tag"] == toggle_card["card_tag"]
              replace_an_event i
            end
          end
        end
      end
      draw_kingdom
    end
    redraw_button.style :width => width
    redraw_button.move(x, y+40)

    store_kingdom_button = @app.button "Store Kingdom"
    store_kingdom_button.click do
      @app.alert "Storing kingdom"
      store_kingdom
    end
    store_kingdom_button.style :width => width
    store_kingdom_button.move(x,y+80)
  end

  def draw
    check_boxes()
    options()
    buttons()
  end

  def draw_kingdom
    @kingdom_flow.clear if @kingdom_flow
    @kingdom_events_flow.clear if @kingdom_events_flow
    # @app.alert "You generated #{@kingdom.size} kingdom cards"
    @toggles = {}
    start_x = 230
    x = start_x
    y = -579
    if @kingdom.size > 0
      @kingdom_flow = @app.flow do
        @kingdom.sort_by{|x| x["cost"]}.each do |card| # 
          # @app.debug "drawing card image of #{card["card_tag"]} #{x} #{y}"
          draw_card_image card, x, y, 204, 320
          x += 204
          if x > start_x + (4*204) + 10
            x = start_x
            y += 320
          end
        end
      end
    end
    y = 53
    x = start_x
    if @kingdom_events.size > 0
      @kingdom_events_flow = @app.flow do
        @kingdom_events.each do |card|
          draw_card_image card, x, y, 320, 204
          x += 330
          if x > start_x + (2*330) + 10
            x = start_x
            y += 204
          end
        end
      end
    end
  end

  def draw_card_image card, x, y, width, height
    @toggles[card]=false
    name = card["card_tag"].gsub(" ", "_")
    filename = "dominion_cards/#{name}.jpg"
    if File.exist?(filename)
      image_flow = @app.flow(:width=>width, :height=>height) do
        image = @app.image "#{filename}"
      end
      image_flow.move(x, y)
      image_flow.click do
        @app.debug "clicking on button #{card}"
        @toggles[card]=!@toggles[card]
        if @toggles[card]==true
          image_flow.border @app.red, :strokewidth => 2
        else
          image_flow.border @app.white, :strokewidth => 2
        end
      end
    else
      @app.alert "Can't find #{filename}"
    end
  end

  def run
    load_cards
    load_card_descriptions
    load_history
    draw
  end

end

Shoes.app(title: "Dominion Randomiser", width: 1300, height:850) do
  randomiser = Randomiser.new(self)
  randomiser.run
end