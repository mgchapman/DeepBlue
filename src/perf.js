function PerformanceBreakdown() {
}

PerformanceBreakdown.getMaxRating = function(perfs, types) {
    let maxRating = {
        "rating": -Infinity,
        "type": "Unknown"
    };

    for(i=0; i < perfs.length; i++) {
         let Rat1 = perfs[i];
         let Rat2 = maxRating.rating;

         if(Rat1 > Rat2) {
              maxRating.rating = perfs[i];
              maxRating.type = types[i];
         }
    }

    return maxRating;
};

PerformanceBreakdown.getRank = function(allData, pivotUid, types, activeOnly) {
    let keys = Object.keys(allData);

    keys = keys.map(uid => {
        allData[uid].uid = uid;
        allData[uid].maxRating = this.getMaxRating(allData[uid].perfs, types);
        return allData[uid];
    });

    keys.sort((a, b) => {
        return b.maxRating.rating - a.maxRating.rating;
    });

    for(let i = 0; i < keys.length; i++) {
        if(keys[i].uid === pivotUid) {
            return i + 1;
        }
    }
};

PerformanceBreakdown.toPerfName = function(name) {
    if(name === "ultrabullet" || name === "ultra") {
        return "ultraBullet";
    } else if(name === "koth" || name === "kingofthehill") {
        return "kingOfTheHill";
    } else if(name === "960" || name === "fischer" || name === "c960") {
        return "chess960";
    } else if(name === "bughouse" || name === "ch" || name === "zh") {
        return "crazyhouse";
    } else if(name === "threecheck" || name === "3c") {
        return "threeCheck";
    } else if(name === "corr") {
        return "correspondence";
    } else if(name === "racingkings" || name === "rk") {
        return "racingKings";
    }

    return name;
};

PerformanceBreakdown.perfToReadable = function(name) {
    if(name === "ultraBullet") {
        return "Ultra Bullet";
    }
    if(name === "kingOfTheHill") {
        return "King Of The Hill";
    }
    if(name === "racingKings") {
        return "Racing Kings";
    }
    if(name === "threeCheck") {
        return "Three Check";
    }
    return name[0].toUpperCase() + name.slice(1);
};

module.exports = PerformanceBreakdown;
