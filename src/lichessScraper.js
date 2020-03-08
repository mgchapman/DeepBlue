const rp = require('request-promise');
const $ = require('cheerio');

//lichessScraper takes a url of the form https://lichess.org/@/[username]/perf/[variant] and returns the peak rating

function LichessScraper(url) {
    return rp(url)
     .then(function(html){
        peakRating = $('h2 > strong', html).children().first().text();
	return peakRating;
      })
     .catch(function(err){
       //handle error
       console.log(err);
     })
 };

module.exports = LichessScraper;
