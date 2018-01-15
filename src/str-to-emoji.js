class StrToEmoji {
    convert(str) {
        return this._strToEmoji(str);
    }

    _emojiPool() {
        const emojiPool = new Map();
        emojiPool.set('a', ['🇦', '🅰']);
        emojiPool.set('b', ['🇧', '🅱']);
        emojiPool.set('c', ['🇨']);
        emojiPool.set('d', ['🇩']);
        emojiPool.set('e', ['🇪']);
        emojiPool.set('f', ['🇫']);
        emojiPool.set('g', ['🇬']);
        emojiPool.set('h', ['🇭']);
        emojiPool.set('i', ['🇮']);
        emojiPool.set('j', ['🇯']);
        emojiPool.set('k', ['🇰']);
        emojiPool.set('l', ['🇱']);
        emojiPool.set('m', ['🇲']);
        emojiPool.set('n', ['🇳']);
        emojiPool.set('o', ['🇴', '🅾']);
        emojiPool.set('p', ['🇵', '🅿']);
        emojiPool.set('q', ['🇶']);
        emojiPool.set('r', ['🇷']);
        emojiPool.set('s', ['🇸']);
        emojiPool.set('t', ['🇹']);
        emojiPool.set('u', ['🇺']);
        emojiPool.set('v', ['🇻']);
        emojiPool.set('w', ['🇼']);
        emojiPool.set('x', ['🇽']);
        emojiPool.set('y', ['🇾']);
        emojiPool.set('z', ['🇿']);

        emojiPool.set('id', ['🆔']);
        emojiPool.set('vs', ['🆚']);
        emojiPool.set('ab', ['🆎']);
        emojiPool.set('cl', ['🆑']);
        emojiPool.set('sos', ['🆘']);
        emojiPool.set('wc', ['🚾']);
        emojiPool.set('ng', ['🆖']);
        emojiPool.set('ok', ['🆗']);
        emojiPool.set('up', ['🆙']);
        emojiPool.set('cool', ['🆒']);
        emojiPool.set('new', ['🆕']);
        emojiPool.set('0', ['0⃣']);
        emojiPool.set('1', ['1⃣']);
        emojiPool.set('2', ['2⃣']);
        emojiPool.set('3', ['3⃣']);
        emojiPool.set('4', ['4⃣']);
        emojiPool.set('5', ['5⃣']);
        emojiPool.set('6', ['6⃣']);
        emojiPool.set('7', ['7⃣']);
        emojiPool.set('8', ['8⃣']);
        emojiPool.set('9', ['9⃣']);
        emojiPool.set('10', ['🔟']);
        return emojiPool;
    }

    _filterEp(ep, obj) {
        let current = obj;

        while (current) {
            const val = ep.get(current.val);
            if (val) {
                if (val.length > 1) {
                    val.shift();
                } else {
                    ep.delete(current.val);
                }
            }

            current = current.prev;
        }
        return ep;
    }

    _strToEmoji(str) {
        if (!str) {
            return [];
        }

        const root = [];

        const ep = this._emojiPool();

        ep.forEach((val, key) => {
            if (str.startsWith(key)) {
                root.push({ val: key, emoji: val[0], pos: 0, prev: null, next: [] });
            }
        });

        const checklist = [...root];
        const forwardChains = [];
        while (checklist.length) {
            const current = checklist.shift();

            const filtered = this._filterEp(this._emojiPool(), current);
            filtered.forEach((val, key) => {
                if (str.startsWith(key, current.pos + current.val.length)) {
                    const next = {
                        val: key,
                        emoji: val[0],
                        pos: current.pos + current.val.length,
                        prev: current, next: []
                    };

                    current.next.push(next);
                    checklist.push(next);
                }
            });

            if (!current.next.length) {
                forwardChains.push(current);
            }
        }

        let maxChain = { tail: null, length: 0 };
        for (const chain of forwardChains) {
            if (chain.pos + chain.val.length !== str.length) {
                continue;
            }
            let length = 0;
            let cur = chain;
            while (cur) {
                cur = cur.prev;
                ++length;
            }

            if (length > maxChain.length) {
                maxChain = { tail: chain, length: length };
            }
        }

        const result = [];
        let cur = maxChain.tail;
        while (cur) {
            result.push(cur.emoji);
            cur = cur.prev;
        }
        result.reverse();
        return result;
    }
}

module.exports = StrToEmoji;