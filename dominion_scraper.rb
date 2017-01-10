#!/usr/bin/env ruby

# scrape the dominion wiki for card images

require 'json'
require 'net/http'
require 'fileutils'

class Scraper

  def initialize
    @image_url = {}
  end

  def run
    load_cards
    download_images
  end

  def load_cards
    json = "cards_db.json"
    if File.exist?(json)
      @cards = JSON.parse(File.read(json))
    end
    # count = 0
    # @cards.each do |card|
      # p card
      # count += 1
      # break if count > 10
    # end
  end

  def download_images
    FileUtils.mkdir_p 'dominion_cards'
    @cards.each do |card|
      name = card["card_tag"]
      unless name == "Ruins"
        get_page name
      end
    end
    @image_url.each do |name, url|
      if url.length > 1
        puts url
      else
        puts "couldn't get url for #{name}"
      end
    end
  end

  def get_page card
    baseurl = "http://wiki.dominionstrategy.com/index.php"
    card.gsub!(" ", "_")
    card.gsub!("\'", "%27")
    url = "#{baseurl}/#{card}"
    uri = URI(url)
    filename = File.join("dominion_cards", "#{card.gsub("%27","\'")}.jpg")
    unless File.exist?(filename)
      puts "couldn't find #{filename}"
      source = Net::HTTP.get(uri)
      lines = source.split("\n")
      lines.each do |line|
        if line =~ /#{card}.jpg/
          if line =~ /src=\"(.*?)\"/
            image = $1
            if image =~ /#{card}/
              @image_url[card] = image
              cmd = "wget http://wiki.dominionstrategy.com/#{image} -O #{filename}"
              # puts "getting: #{filename}"
              `#{cmd}`
            end
          end
        end
      end 
    end
  end
end

scraper = Scraper.new

scraper.run