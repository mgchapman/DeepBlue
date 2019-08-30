function PerformanceBreakdown(data) {
    this.data = data;
}

PerformanceBreakdown.prototype.getMaxRating = function(types, allowProv) {
    let maxRating = {
        "rating": -Infinity,
        "type": "Unknown"
    };

    for(type in this.data) {
        if(types && types.includes(type) || !types) {
            if(!this.data[type].prov || this.data[type].prov && allowProv) {
                if(this.data[type].rating > maxRating.rating) {
                    maxRating.rating = this.data[type].rating;
                    maxRating.type = PerformanceBreakdown.perfToReadable(type);
                    maxRating.penalty = this.data[type].penalty;
                }
            }
        }
    }

    return maxRating;
};

PerformanceBreakdown.prototype.getRank = function(allData, pivotUid, types) {
    let keys = Object.keys(allData);

    //Map to perfs + max rating for types
    keys = keys.map((uid) => {
        allData[uid].uid = uid;
        this.data = allData[uid].perfs;
        allData[uid].maxRating = this.getMaxRating(types);
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