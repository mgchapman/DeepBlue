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

        if(!cfg.deepblue.allPerfs.includes(type)) {
            delete data.perfs[type];
            continue;
        }

        //Decrease rating if RD is above theshold and rating above threshold
        if(!data.perfs[type].prov
            && data.perfs[type].rd > cfg.lichessTracker.ratingDeviationThreshold) {

            data.perfs[type].penalty = cfg.lichessTracker.highRatingDeviationPenalty;
        }
    }
    if(allProvisional) {
        output.allProvisional = true;
    }

    output.username = data.username;
    output.perfs = data.perfs;
    return output;
};

LichessTracker.prototype.updateManyUsers = function(lichessData) {
    for(let i = 0; i < lichessData.length; i++) {
        let parsedData = this.parseLichessUserData(lichessData[i]);
        let uid = this.getLinkedUserId(parsedData.username);
        let valid = this.validateLichessParsedData(parsedData);
        if(uid && valid) {
            let member = this.deepblue.guild.members.get(uid);

            //Assuming that user can't go from non-provisional to provisional
            if(parsedData.allProvisional) {
                this.data[uid] = parsedData;
                return;
            }

            let currentRatingRole = this.deepblue.ratingRoleManager.getCurrentRatingRole(member);
            let perf = PerformanceBreakdown.getMaxRating(parsedData.perfs, cfg.deepblue.perfsForRoles);
            let updatedRole = this.deepblue.ratingRoleManager.assignRatingRole(
                member,
                perf
            );

            if(updatedRole) {
                let mrInt = parseInt(updatedRole.name);
                let crrInt = parseInt(currentRatingRole.name);
                let name = member.nickname || member.user.username;
                if(isNaN(crrInt)) {
                    //Was provisional, now has proper ratings
                    sendTrackSuccessMessage(
                        this.deepblue.botChannel,
                        perf,
                        parsedData.username,
                        role,
                        name
                    );
                } else if(mrInt > crrInt) {
                    this.deepblue.sendBotChannel(`${name} went from ${crrInt} to ${mrInt}! Congratulations! ${EmojiSelector("happy")}`);
                } else if(mrInt < crrInt) {
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

LichessTracker.prototype.updateAll = function() {
    //Create chain of bulk updates and start it
    let start = null;
    let chain = new Promise((resolve, reject) => start = resolve);

    let uids = Object.keys(this.data);

    for(let i = 0; i < uids.length; i+= cfg.lichessTracker.perRequest) {
        let usernames = uids.slice(i, i + cfg.lichessTracker.perRequest).map(uid => {
            return this.data[uid].username;
        }).join(","); //Create CSV of usernames

        chain = chain.then(() => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.getLichessManyUsersData(usernames)
                    .then((data) => this.updateManyUsers(data))
                    .then(resolve)
                    .catch(reject)
                    .finally(() => console.log("Inner updated", usernames));
                }, i === 0 ? 0 : cfg.lichessTracker.apiRequestTimeout);
            });
        })
        .catch(console.error)
        .finally(() => console.log("Updated", usernames));
    }

    chain = chain.then(() => {
        this.dataManager.saveData(this.data);
    });
    chain.catch(console.error);
    chain.finally(() => {
        console.log("Updated all!");
        setTimeout(() => {
            this.updateAll();
        }, cfg.lichessTracker.updateAllDelay);
    });

    start();
};

function sendTrackSuccessMessageProvisional(channel, username, role, nickname) {
    let title = `Linked ${nickname} to ${cfg.lichessTracker.lichessProfileUrl.replace("%username%", username)}`;
    let requiredVariants = cfg.deepblue.perfsForRoles.map(p => PerformanceBreakdown.perfToReadable(p)).join(", ");
    let msg = `Added to rating group **${role.name}**.\nCouldn't find non-provisional ratings for required variants (${requiredVariants}).`;

    channel.send({
        "embed": {
            "title": title,
            "description": msg,
            "color": cfg.deepblue.embedColor
        }
    }).catch(console.error);
};

function sendTrackSuccessMessage(channel, perf, username, role, nickname) {
    let title = `Linked ${nickname} to ${cfg.lichessTracker.lichessProfileUrl.replace("%username%", username)}`;
    let msg = `Added to rating group **${role.name}** with a rating of **${perf.rating}** (${perf.type})`;

    if(perf.penalty) {
        msg += ` ▼\n\n▼ — Penalty of ${cfg.lichessTracker.highRatingDeviationPenalty}.`
        msg += ` RD is above ${cfg.lichessTracker.ratingDeviationThreshold}.`;
    }

    channel.send({
        "embed": {
            "title": title,
            "description": msg,
            "color": cfg.deepblue.embedColor
        }
    }).catch(console.error);
}

LichessTracker.prototype.track = function(msg, username) {
    if(this.data[msg.member.id] && this.data[msg.member.id].username.toLowerCase() === username) {
        let url = cfg.lichessTracker.lichessProfileUrl.replace("%username%", this.data[msg.member.id].username);
        msg.channel.send(`Previously you were tracked as ${url}.`).catch(console.error);
    }

    this.getLichessUserData(username)
    .then((lichessUserData) => {
        let parsedData = this.parseLichessUserData(lichessUserData);

        if(parsedData) {
            let valid = this.validateLichessParsedData(parsedData);
            if(valid) {
                if(parsedData.allProvisional) {
                    //If all provisional, only add provisional role, still keep track
                    let role = this.deepblue.ratingRoleManager.assignProvisionalRole(msg.member);
                    sendTrackSuccessMessageProvisional(
                        msg.channel,
                        parsedData.username,
                        role,
                        msg.member.nickname || msg.author.username
                    );
                } else {
                    let perf = PerformanceBreakdown.getMaxRating(parsedData.perfs, cfg.deepblue.perfsForRoles);
                    let role = this.deepblue.ratingRoleManager.assignRatingRole(msg.member, perf);
                    sendTrackSuccessMessage(
                        msg.channel,
                        perf,
                        parsedData.username,
                        role,
                        msg.member.nickname || msg.author.username
                    );
                }

                if(msg.member.lastMessage) {
                    parsedData.lastMessageAt = msg.member.lastMessage.createdTimestamp;
                } else {
                    parsedData.lastMessageAt = this.data[msg.member.id].lastMessageAt;
                }

                this.data[msg.member.id] = parsedData;
                this.dataManager.saveData(this.data);
            } else {
                msg.channel.send(`Couldn't track ${parsedData.username}.\nDid you type your username correctly?`)
                .catch(console.error);
            }
        }
    })
    .catch((error) => {
        msg.channel.send(error).catch(console.error);
    })
    .finally(() => {
        console.log("Tracking done", username);
    });
};

LichessTracker.prototype.remove = function(msg, member) {
    let existed = !!this.data[member.id];

    if(existed) {
        delete this.data[member.id];
        this.dataManager.saveData(this.data);
        this.deepblue.ratingRoleManager.removeRatingRole(member);

        if(msg) {
            msg.channel.send(`No longer tracking ${member.nickname || member.user.username}.`).catch(console.error);
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
                reject(new Error(`Error getting user data for "${usernames}".`));
            }
        });
    });
};

module.exports = LichessTracker;