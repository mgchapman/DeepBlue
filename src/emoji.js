const happy_emojis = [
    "\uD83D\uDE00","\uD83D\uDE02","\uD83D\uDE03",
    "\uD83D\uDE04","\uD83D\uDE06","\uD83D\uDE07",
    "\uD83D\uDE09","\uD83D\uDE0A","\uD83D\uDE0B",
    "\uD83D\uDE0C","\uD83D\uDE0D","\uD83D\uDE0E",
    "\uD83D\uDE0F","\uD83C\uDF1E","\uD83D\uDE18",
    "\uD83D\uDE1C","\uD83D\uDE1D","\uD83D\uDE1B"
];

const sad_emojis = [
    "\uD83D\uDE14","\uD83D\uDE15","\uD83D\uDE13",
    "\uD83D\uDE2B","\uD83D\uDE29","\uD83D\uDE22",
    "\uD83D\uDE25","\uD83D\uDE2D","\uD83D\uDE26",
    "\uD83D\uDE27","\uD83D\uDE28","\uD83D\uDE31",
    "\uD83D\uDE32","\uD83D\uDE35","\uD83D\uDE30"
];

function EmojiEmotionSelector(type) {
    if(type === "happy") {
        return happy_emojis[Math.floor(Math.random() * happy_emojis.length)];
    } else if(type === "sad") {
        return sad_emojis[Math.floor(Math.random() * sad_emojis.length)];
    }
}

module.exports = EmojiEmotionSelector