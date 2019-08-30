const cfg = require("../../config.json");
const DataManager = require("../datamanager.js");
const PerformanceBreakdown = require("../perf.js");

function ListCommand(deepblue, msg, activeOnly) {
    if(cfg.list.channels) {
        if(!cfg.list.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let split = msg.content.toLowerCase().split(/\s+/);
    let page = 1;
    let type = null;

    if(split.length === 2) {
        //!list [page]
        //!list [type]
        page = parseInt(split[1]);
        if(isNaN(page) || page.toString() !== split[1]) {
            type = split[1];
            page = 1;
        }
    } else if(split.length === 3) {
        //!list [type] [page]
        type = split[1];
        page = parseInt(split[2]);
        if(isNaN(page) || page.toString() !== split[2]) {
            msg.channel.send("Invalid page.");
            return;
        }
    }

    let allData = new DataManager(cfg.lichessTracker.dataFile).getData();
    let collectedData = Object.keys(allData);

    if(activeOnly) {
        let now = Date.now();
        collectedData = collectedData.filter((uid) => {
            //Filter only active members
            if(allData[uid].lastMessageAt) {
                let d = allData[uid].lastMessageAt + cfg.list.inactiveThreshold;
                return d > now;
            }
            return false;
        });
    }

    if(type) {
        type = PerformanceBreakdown.toPerfName(type);
        collectedData = collectedData.filter((uid) => {
            //If there is that type, and is not provisional
            return allData[uid].perfs[type] && !allData[uid].perfs[type].prov;
        });
    }

    if(collectedData.length === 0) {
        msg.channel.send("Couldn't find players for that chess variant.");
        return;
    }

    collectedData = collectedData.map((uid) => {
        allData[uid].maxRating = new PerformanceBreakdown(allData[uid].perfs).getMaxRating(type || cfg.deepblue.perfsForRoles);
        allData[uid].uid = uid;
        return allData[uid];
    }); //Turn into data array

    collectedData.sort((a, b) => {
        return b.maxRating.rating - a.maxRating.rating;
    });

    let perPage = cfg.list.perPage;
    let pages = Math.ceil(collectedData.length / perPage);

    if(page < 1) {
        page = 1;
    } else if(page > pages) {
        page = pages;
    }

    let output = {
        "embed": {
            "title": `Current standings${type ? ` for ${PerformanceBreakdown.perfToReadable(type)}` : ""}. Page ${page}/${pages}:`,
            "color": cfg.deepblue.embedColor,
            "description": ""
        }
    };

    let startPos = page * perPage - perPage;
    let endPos = startPos + perPage;

    for(let i = startPos; i < collectedData.length && i < endPos; i++) {
        let member = deepblue.guild.members.get(collectedData[i].uid);
        let nick = member.nickname || member.user.username;
        let url = cfg.lichessTracker.lichessProfileUrl.replace("%username%", collectedData[i].username);

        let typeStr = type ? "" : `(${collectedData[i].maxRating.type}) `;
        let penalty = "";
        if(collectedData[i].maxRating.penalty) {
            penalty = ` (${collectedData[i].maxRating.penalty} RD > ${cfg.lichessTracker.ratingDeviationThreshold} penalty)`;
        }
        output.embed.description += `${(i + 1)}: **${collectedData[i].maxRating.rating}**${penalty} ${nick} ${typeStr}([Lichess](${url}))\n`;
    }

    msg.channel.send(output);
}

module.exports = ListCommand;