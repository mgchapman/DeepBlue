const cfg = require("../config.json");

function RatingRoleManager(deepblue) {
    this.roles = cfg.ratingRoleManager.roles;
    this.unrankedRole = cfg.ratingRoleManager.unrankedRole;
    this.provisionalRole = cfg.ratingRoleManager.provisionalRole;
    this.deepblue = deepblue;

    this.deepblue.discord.on("guildMemberAdd", member => {
        let role =  this.deepblue.guild.roles.find(val => val.name === this.unrankedRole);
        member.addRole(role).catch(console.error);
    });
}

RatingRoleManager.prototype.assignRatingRole = function(member, perf) {
    //Check if user has unranked role and remove it
    let unranked = member.roles.find(val => val.name === this.unrankedRole);
    if(unranked) {
        member.removeRole(unranked).catch(console.error);
    }

    let matchedRole = this.getRatingRoleForRating(perf.rating);
    let actualRole = null;

    //Remove other rating roles, if there are any
    let alreadyHasMatchedRole = false;
    member.roles.some(role => {
        if(this.roles.includes(role.name) || role.name === this.provisionalRole) {
            if(role.name === matchedRole) {
                alreadyHasMatchedRole = true;
                actualRole = role;
            } else {
                member.removeRole(role).catch(console.error);
            }
        }
    });

    //Add new role, if needed
    if(!alreadyHasMatchedRole) {
        let role = this.deepblue.guild.roles.find(val => val.name === matchedRole);
        actualRole = role;
        member.addRole(role).catch(console.error);
    }

    return actualRole;
};

RatingRoleManager.prototype.assignProvisionalRole = function(member) {
    //Check if user has unranked role and remove it
    let unranked = member.roles.find(val => val.name === this.unrankedRole);
    if(unranked) {
        member.removeRole(unranked).catch(console.error);
    }

    let currentRole = this.getCurrentRatingRole(member);
    let provRole = this.deepblue.guild.roles.find(val => val.name === this.provisionalRole);
    if(!currentRole || currentRole.name !== provRole.name) {
        if(currentRole) {
            member.removeRole(currentRole).catch(console.error);
        }
        member.addRole(provRole).catch(console.error);
    }

    return provRole;
};

RatingRoleManager.prototype.getCurrentRatingRole = function(member) {
    let found = null;

    member.roles.some(role => {
        if(this.roles.includes(role.name) || role.name === this.provisionalRole) {
            found = role;
        }
    });

    return found;
};

RatingRoleManager.prototype.removeRatingRole = function(member) {
    member.roles.some(role => {
        if(this.roles.includes(role.name) || role.name === this.provisionalRole) {
            member.removeRole(role).catch(console.error);
        }
    });

    let unranked = this.deepblue.guild.roles.find(val => val.name === this.unrankedRole);
    member.addRole(unranked).catch(console.error);
};

RatingRoleManager.prototype.getRatingRoleForRating = function(rating) {
    //Find appropriate rating role
    //Lowest role edge case
    let matchedRole = rating < parseInt(this.roles[0]) ? this.roles[0] : null;
    if(!matchedRole) {
        //Starting with 2nd lowest
        for(let i = 1; i < this.roles.length; i++) {
            let r = parseInt(this.roles[i]);
            if(rating >= r) {
                matchedRole = this.roles[i];
            } else {
                break; //Implies that roles in config are in order
            }
        }
    }

    if(!matchedRole) {
        console.error(`Coundn't find appropriate role for rating ${rating}.`);
        return null;
    }

    return matchedRole;
};

module.exports = RatingRoleManager;
