
export function getmoviedata(id, playerName) {
    const movies = {
        "pre_red": [
            { img: "./game/movie/red_intro_1.png", text: "警告：局所的異常高温。サウナ状態を確認。", speaker: "none" },
            { img: "./game/movie/red_intro_2.png", text: "俺の部下を…よくもやってくれたな！だが俺は違うぞ…火傷じゃ済まさん！", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_intro_2.png", text: "うわ、あっつ。空調壊れてんのか？…いや、お前のせいか。", speaker: "left", name: playerName },
            { img: "./game/movie/red_intro_2.png", text: "なんだその態度は！俺の情熱の炎で、その減らず口を焼き尽くしてやる！", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_intro_2.png", text: "...今は暑苦しいだけだから退場してくれ。", speaker: "left", name: playerName }
        ],
        "post_red": [
            { img: "./game/movie/red_outro_1.png", text: "ぐっ…くっ…俺が…倒されるとは…ふ、ふざけんな…！", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_outro_1.png", text: "Red隊のリーダー…強かった。", speaker: "left", name: playerName },
            { img: "./game/movie/red_outro_1.png", text: "…強い、か。…俺たちが強かったのは…クカルヴ様が、俺たちを照らしてくれていたからだ。", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_outro_1.png", text: "俺の炎は、クカルヴ様の情熱そのものだ。だが…この世界の『空気』が…俺の炎を否定しているようだ…", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_outro_1.png", text: "世界の空気…？", speaker: "left", name: playerName },
            { img: "./game/movie/red_outro_1.png", text: "あぁ…今の『神』が作り出したこの世界は…酷く冷たく、無機質だ。まるで俺たちを『不要なデータ』として処理しようとするような…", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_outro_1.png", text: "クカルヴ様は、そんな『冷徹な神』に抗っているのかもしれないな…", speaker: "right", name: "ディア" },
            { img: "./game/movie/red_outro_1.png", text: "(……)", speaker: "left", name: playerName }
        ],

    };
    return movies[id] || [];
}
