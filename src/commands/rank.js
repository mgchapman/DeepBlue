const cfg = require("../../config.json");
const DataManager = require("../datamanager.js");
const PerformanceBreakdown = require("../perf.js");

function RankCommand(deepblue, msg) {
    if(cfg.rank.channels) {
        if(!cfg.rank.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let member = msg.member;
    let allData = new DataManager(cfg.lichessTracker.dataFile).getData();
    let userData = null;

    //Get member from message
    let split = msg.content.split(/\s+/);

    if(split.length === 2) {
        member = deepblue.getMemberFromMention(split[1]);
        if(!member) {
            //Not a mention, so a username
            let uid = getUidFromUsername(allData, split[1]);
            member = deepblue.guild.members.get(uid);
        }
        if(!member) {
            msg.channel.send(`Bad 2nd argument (${split[1]}).`);
            return;
        }
    }

    for(let uid in allData) {
        if(uid === member.id) {
            userData = allData[uid];
            break;
        }
    }

    if(!userData) {
        msg.channel.send("Couldn't find ranking.");
        return;
    }

    let perf = new PerformanceBreakdown(userData.perfs);

    let highestRating = perf.getMaxRating();
    let roleRating = perf.getMaxRating(cfg.deepblue.perfsForRoles);

    //Getting rank modifies data set in perf constructor. getMaxRating is now unreliable.
    let roleRank = perf.getRank(allData, member.id, cfg.deepblue.perfsForRoles);

    let allRatings = {};

    for(let i = 0; i < cfg.deepblue.allPerfs.length; i++) {
        let type = cfg.deepblue.allPerfs[i];
        if(userData.perfs[type]) {
            if(userData.perfs[type].prov) {
                allRatings[type] = {
                    "type": PerformanceBreakdown.perfToReadable(type),
                    "rating": userData.perfs[type].rating
                };
            } else {
                allRatings[type] = {
                    "rank": perf.getRank(allData, member.id, [type]),
                    "type": PerformanceBreakdown.perfToReadable(type),
                    "rating": userData.perfs[type].rating,
                    "penalty": userData.perfs[type].penalty
                };
            }
        }
    }

    let result = {
        "embed": {
            "thumbnail": {
              "url": member.user.avatarURL
            },
            "url": cfg.lichessTracker.lichessProfileUrl.replace("%username%", userData.username),
            "color": cfg.deepblue.embedColor,
            "title": `${member.nickname || member.user.username}'s ratings and rankings:`,
            "description": ""
        }
    };

    result.embed.description += `Rating for role: **${roleRating.rating}** (#${roleRank})`;

    //Finding highest rating rank
    let highObj = null;
    let highRating = -Infinity;
    for(let type in allRatings) {
        let rating = allRatings[type].rating;
        if(userData.perfs[type].prov) {
            continue;
        } else if(rating > highRating) {
            highObj = allRatings[type];
            highRating = rating;
        }
    }
    result.embed.description += `\nHighest rating: **${highObj.rating}** (#${highObj.rank}, ${highObj.type})`;

    //Finding best rank
    let bestObj = null;
    let bestRank = Infinity;
    for(let type in allRatings) {
        let rank = allRatings[type].rank;
        if(!rank) {
            continue;
        } else if(rank < bestRank) {
            bestObj = allRatings[type];
            bestRank = rank;
        }
    }
    result.embed.description += `\nBest rank: **#${bestObj.rank}** (${bestObj.rating}, ${bestObj.type})\n`;

    result.embed.description += getRankText(allRatings, "classical");
    result.embed.description += getRankText(allRatings, "rapid");
    result.embed.description += getRankText(allRatings, "blitz");
    result.embed.description += getRankText(allRatings, "bullet") + "\n";

    result.embed.description += getRankText(allRatings, "ultraBullet");
    result.embed.description += getRankText(allRatings, "correspondence");
    result.embed.description += getRankText(allRatings, "chess960");
    result.embed.description += getRankText(allRatings, "crazyhouse");
    result.embed.description += getRankText(allRatings, "atomic");
    result.embed.description += getRankText(allRatings, "threeCheck");
    result.embed.description += getRankText(allRatings, "kingOfTheHill");
    result.embed.description += getRankText(allRatings, "horde");
    result.embed.description += getRankText(allRatings, "antichess");
    result.embed.description += getRankText(allRatings, "racingKings");
    result.embed.description += getRankText(allRatings, "puzzle");

    msg.channel.send(result);
}

function getUidFromUsername(allData, username) {
    for(let uid in allData) {
        if(allData[uid].username.toLowerCase() === username.toLowerCase()) {
            return uid;
        }
    }

    return null;
}

function getRankText(allRatings, type) {
    if(allRatings[type]) {
        let data = allRatings[type];
        if(data.rank) {
            let penalty = "";
            if(data.penalty) {
                penalty = ` (${data.penalty} RD > ${cfg.lichessTracker.ratingDeviationThreshold} penalty)`;
            }
            return `\n${data.type}: **${data.rating}**${penalty} (#${data.rank})`;
        } else {
            //Provisional, so no rank
            return `\n${data.type}: ${data.rating}?`;
        }
    }
    return "";
}

module.exports = RankCommand;