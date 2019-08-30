const request = require("request");
const cfg = require("../config.json");
const EmojiSelector = require("./emoji.js");
const DataManager = require("./datamanager.js");
const PerformanceBreakdown = require("./perf.js");

function LichessTracker(deepblue) {
    this.deepblue = deepblue;
    this.dataManager = new DataManager(cfg.lichessTracker.dataFile);
    this.data = this.dataManager.getData();
    this.updateAll();
}

LichessTracker.prototype.remove = function(msg, member) {
    let existed = !!this.data[member.id];

    if(existed) {
        delete this.data[member.id];
        this.dataManager.saveData(this.data);
        this.deepblue.ratingRoleManager.remove(member);

        if(msg) {
            msg.channel.send("Removed.");
        }
    }
};

LichessTracker.prototype.track = function(msg, username) {
    if(this.data[msg.author.id]) {
        let url = cfg.lichessTracker.lichessProfileUrl.replace("%username%", this.data[msg.author.id].username);
        msg.channel.send(`Already tracked as ${url}.`);
    }

    this.getLichessUserData(username)
    .then((lichessUserData) => {
        let parsedData = this.parseLichessUserData(lichessUserData);

        if(parsedData) {
            let valid = this.validateLichessParsedData(parsedData);
            if(valid) {
                let maxRating = new PerformanceBreakdown(parsedData.perfs).getMaxRating(cfg.deepblue.perfsForRoles);

                let role = this.deepblue.ratingRoleManager.assignRoleForRating(msg.member, maxRating.rating);
                if(!role) {
                    return;
                }

                if(msg.member.lastMessage) {
                    parsedData.lastMessageAt = msg.member.lastMessage.createdTimestamp;
                } else {
                    parsedData.lastMessageAt = this.data[msg.member.id].lastMessageAt;
                }

                this.data[msg.member.id] = parsedData;
                this.dataManager.saveData(this.data);

                let title = `Linked ${msg.member.nickname || msg.author.username} to ` +
                    `${cfg.lichessTracker.lichessProfileUrl.replace("%username%", parsedData.username)}`;
                msg.channel.send({
                    "embed": {
                        "title": title,
                        "description": `Added to rating group **${role}** with a rating of **${maxRating.rating}** (${maxRating.type})`,
                        "color": cfg.deepblue.embedColor
                    }
                });
            } else {
                msg.channel.send(`Couldn't track ${parsedData.username}.\nPerhaps their rapid, blitz, and bullet ratings are all provisional?`);
            }
        }
    })
    .catch((error) => {
        msg.channel.send(error);
    });
};

LichessTracker.prototype.updateAll = function() {
    //Create chain of bulk updates and start it
    let start = null;
    let chain = new Promise((resolve, reject) => start = resolve);

    let uids = Object.keys(this.data);

    for(let i = 0; i < uids.length; i+= cfg.lichessTracker.perRequest) {
        let usernames = uids.slice(i, i + cfg.lichessTracker.perRequest).map((uid) => {
            return this.data[uid].username;
        }).join(","); //Create CSV of usernames

        chain = chain.then(() => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.getLichessManyUsersData(usernames)
                    .then((data) => this.updateManyUsers(data))
                    .then(resolve)
                    .catch(reject);
                }, i === 0 ? 0 : cfg.lichessTracker.apiRequestTimeout);
            });
        }).catch(console.error);
    }

    chain = chain.then(() => {
        this.dataManager.saveData(this.data);
    });
    chain.catch(console.error);
    chain.finally(() => {
        setTimeout(() => {
            this.updateAll();
        }, cfg.lichessTracker.updateAllDelay);
    });

    start();
};

LichessTracker.prototype.updateManyUsers = function(lichessData) {
    for(let i = 0; i < lichessData.length; i++) {
        let parsedData = this.parseLichessUserData(lichessData[i]);
        let uid = this.getLinkedUserId(parsedData.username);
        let valid = this.validateLichessParsedData(parsedData);
        if(uid && valid) {
            let member = this.deepblue.guild.members.get(uid);
            let currentRatingRole = this.deepblue.ratingRoleManager.getCurrentRatingRole(member);
            let maxRating = new PerformanceBreakdown(parsedData.perfs).getMaxRating(cfg.deepblue.perfsForRoles);
            let updatedRole = this.deepblue.ratingRoleManager.assignRoleForRating(
                member,
                maxRating.rating
            );

            if(updatedRole) {
                let mrInt = parseInt(updatedRole);
                let crrInt = parseInt(currentRatingRole);
                if(mrInt > crrInt) {
                    let name = member.nickname || member.user.username;
                    this.deepblue.sendBotChannel(`${name} went from ${crrInt} to ${mrInt}! Congratulations! ${EmojiSelector("happy")}`);
                } else if(mrInt < crrInt) {
                    let name = member.nickname || member.user.username;
                    this.deepblue.sendBotChannel(`${name} went from ${crrInt} to ${mrInt}. ${EmojiSelector("sad")}`);
                }
            }

            if(member.lastMessage) {
                parsedData.lastMessageAt = member.lastMessage.createdTimestamp;
            } else {
                parsedData.lastMessageAt = this.data[uid].lastMessageAt;
            }

            this.data[uid] = parsedData;
        } else if(uid) {
            delete this.data[uid];
        }
    }
};

LichessTracker.prototype.getLinkedUserId = function(lichessUsername) {
    for(let uid in this.data) {
        if(this.data[uid].username === lichessUsername) {
            return uid;
        }
    }
};

LichessTracker.prototype.validateLichessParsedData = function(data) {
    if(data.closed) {
        console.error(`Account "${data.username}" is closed on Lichess.`);
        this.deepblue.sendModChannel(`${data.username} has a closed account.`);
        return false;
    }
    if(data.cheating) {
        console.error(data.cheating);
        this.deepblue.sendModChannel(data.cheating);
        return false;
    }
    if(data.allProvisional) {
        console.error(`All classical, rapid, blitz, and bullet ratings for "${data.username}" are provisional.`);
        return false;
    }
    return true;
};

LichessTracker.prototype.parseLichessUserData = function(data) {
    let output = {};

    if(data.closed) {
        output.closed = true;
    }

    if(data.engine || data.booster) {
        let cheating = `Player "${data.username}" (${cfg.lichessTracker.lichessProfileUrl.replace("%username%", data.username)})`;
        if(!data.engine) {
            cheating += " artificially increases/decreases their rating.";
        } else if(!data.booster) {
            cheating += " uses chess computer assistance.";
        } else {
            cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
        }
        output.cheating = cheating;
    }

    let allProvisional = true;
    for(let type in data.perfs) {
        if(cfg.deepblue.perfsForRoles.includes(type)) {
            if(!data.perfs[type].prov) {
                allProvisional = false;
            }
        }
        //Lower rating is RD is above theshold and rating above threshold
        if(!data.perfs[type].prov
            && data.perfs[type].rd > cfg.lichessTracker.ratingDeviationThreshold
            && data.perfs[type].rating > cfg.lichessTracker.rdPenaltyRatingThreshold) {

            data.perfs[type].rating -= cfg.lichessTracker.highRatingDeviationPenalty;
            data.perfs[type].penalty = -cfg.lichessTracker.highRatingDeviationPenalty;
        }
    }
    if(allProvisional) {
        output.allProvisional = true;
    }

    output.username = data.username;
    output.perfs = data.perfs;
    return output;
};

LichessTracker.prototype.getLichessUserData = function(username) {
    return new Promise((resolve, reject) => {
        let url = cfg.lichessTracker.lichessApiUser.replace("%username%", username);
        request.get(url, (error, response, body) => {
            if(error) {
                return reject(new Error("Error accessing Lichess API."));
            }
            if(body.length === 0) {
                return reject(new Error(`Couldn't find "${username}" on Lichess.`));
            }
            let json = null;
            try {
                json = JSON.parse(body);
                resolve(json);
            } catch(e) {
                reject(new Error(`Error getting user data for "${username}".`));
            }
        });
    });
};

LichessTracker.prototype.getLichessManyUsersData = function(usernames) {
    return new Promise((resolve, reject) => {
        request({
            method: "POST",
            url: cfg.lichessTracker.lichessApiManyUsers,
            body: usernames
        }, (error, response, body) => {
            if(error) {
                return reject("Error accessing Lichess API.");
            }
            if(body.length === 0) {
                return reject(`Couldn't find "${username}" on Lichess.`);
            }
            let json = null;
            try {
                json = JSON.parse(body);
                resolve(json);
            } catch(e) {
                reject(`Error getting user data for "${usernames}".`);
            }
        });
    });
};

module.exports = LichessTracker;