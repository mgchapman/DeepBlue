const rp = require('request-promise');
const $ = require('cheerio');

//lichessScraper takes a url of the form https://lichess.org/@/[username]/perf/[variant] and returns the peak rating

const lichessScraper = function(url) {
    rp(url)
     .then(function(html){
      return {
      peakRating : $('h2 > strong', html).children().first().text(),
      };
      })
     .catch(function(err){
       //handle error
 });
