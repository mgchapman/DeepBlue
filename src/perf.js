function PerformanceBreakdown() {
}

PerformanceBreakdown.getMaxRating = function(perfs, types, allowProv) {
    let maxRating = {
        "rating": -Infinity,
        "type": "Unknown"
    };

    for(type in perfs) {
        if(types && types.includes(type) || !types) {
            if(!perfs[type].prov || perfs[type].prov && allowProv) {
                let penRat1 = perfs[type].rating - (perfs[type].penalty || 0);
                let penRat2 = maxRating.rating - (maxRating.penalty || 0);

                if(penRat1 > penRat2) {
                    maxRating = perfs[type];
                    maxRating.type = PerformanceBreakdown.perfToReadable(type);
                }
            }
        }
    }

    return maxRating;
};

PerformanceBreakdown.getRank = function(allData, pivotUid, types) {
    let keys = Object.keys(allData);

    //Map to perfs + max rating for types
    if(type === "fide") {
        keys = keys.map((uid) => {
            allData[uid].uid = uid;
            allData[uid].fide = getFideEstimate(allData[uid].perfs);
            return allData[uid];
        });
        keys = keys.filter((p) => {
            return p.fide !== null;
        });
        keys.sort((a, b) => {
            return b.fide - a.fide;
        });
    } else {
        keys = keys.map((uid) => {
            allData[uid].uid = uid;
            allData[uid].maxRating = this.getMaxRating(allData[uid].perfs, types);
            return allData[uid];
        });
        keys.sort((a, b) => {
            return b.maxRating.rating - a.maxRating.rating;
        });
    }

    for(let i = 0; i < keys.length; i++) {
        if(keys[i].uid === pivotUid) {
            return i + 1;
        }
    }
};

function getFideEstimate(perfs) {
    let cr = null;
    if(perfs.classical && !perfs.classical.prov) {
        cr = perfs.classical.rating;
    }

    //Rapid rating
    let rr = null;
    if(perfs.rapid && !perfs.rapid.prov) {
        rr = perfs.rapid.rating;
    }

    //Getting t value
    let t = null;
    if(cr || rr) {
        t = cr > rr ? cr : rr;
    }

    //Blitz rating
    let br = null;
    if(perfs.blitz && !perfs.blitz.prov) {
        br = perfs.blitz.rating;
    }

    if(t && br) {
        if(t > 2100 || br > 2100) {
            return (br + 2 * t) / 3 - 150;
        } else {
            return (2 * br + t) / 3 - 150;
        }
    } else {
        return null;
    }
}

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