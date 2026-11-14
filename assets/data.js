/* EchoQuest prototype story data
 * All content is original and runs locally in the browser.
 */
(function () {
  "use strict";

  const BASE_STATS = [
    { key: "hp", name: "体力", max: 100, color: "red", icon: "heart" },
    { key: "insight", name: "线索", max: 5, color: "gold", icon: "eye" },
    { key: "bond", name: "信任", max: 5, color: "teal", icon: "link" }
  ];

  const GENRES = [
    { key: "suspense", label: "悬疑", sub: "潮湿、秘密与旧信", icon: "fog" },
    { key: "romance", label: "恋爱", sub: "克制、错过与重逢", icon: "bloom" },
    { key: "adventure", label: "冒险", sub: "远方、海图与同伴", icon: "compass" },
    { key: "apocalypse", label: "末世", sub: "余烬、抉择与黎明", icon: "sun" },
    { key: "scifi", label: "科幻", sub: "星海、信号与边界", icon: "orbit" }
  ];

  const STARTER_PROMPTS = {
    suspense:
      "1926 年，雾港。我是一名回到故乡的记者，姐姐在三年前失踪，却突然寄来一封盖着废弃灯塔邮戳的信。信里只有一句话：别相信退潮后还留在岸上的人。",
    romance:
      "南屿的梅雨季，我回到外婆留下的唱片店，遇见七年前不告而别的旧友。店里有一张从未发行过的唱片，封面是我们两人的照片。",
    adventure:
      "无昼海上没有太阳。我继承了一张会随潮汐变化的星图，和父亲留下的半艘飞艇。传说星图尽头有一座会唱歌的岛。",
    apocalypse:
      "太阳落山后的第七码头，广播塔是唯一还亮着的地方。我收到妹妹的求救讯号，但她已经失踪了三年。",
    scifi:
      "月球背面的静海站，我是最后一名通讯官。姐姐的讯号在消失了 1095 天后重新出现，延迟八分钟，来自一个不存在的坐标。"
  };

  const LENGTH_OPTIONS = [
    { key: "short", label: "短篇", time: "8–10 分钟", nodes: "约 8 个节点" },
    { key: "medium", label: "中篇", time: "15–20 分钟", nodes: "约 12 个节点" },
    { key: "long", label: "长篇", time: "25–30 分钟", nodes: "约 18 个节点" }
  ];

  /* ------------------------------------------------------------------ */
  /* Hand-authored flagship story                                        */
  /* ------------------------------------------------------------------ */

  const SAMPLE_GAME = {
    id: "mist-harbor",
    title: "雾港来信",
    subtitle: "潮声会抹去名字，但有些信必须被读到。",
    genre: "suspense",
    genreLabel: "悬疑 · 民国怪谈",
    tone: "潮湿、克制、宿命感",
    era: "1926 年",
    cover: "harbor",
    author: "回响编辑部",
    published: true,
    featured: true,
    isSample: true,
    synopsis:
      "失踪三年的姐姐寄来一封信，邮戳却来自一座停用了十二年的灯塔。你回到雾港，在潮声、旧钥匙与三个互相矛盾的人之间，寻找一个不该被留下的名字。",
    background:
      "1926 年，雾港。你是一名前战地记者，三年前姐姐沈鸢在故乡失踪。一个雾夜，你收到她寄来的信，邮戳来自早已停用的白塔礁灯塔。信中写着：别相信退潮后还留在岸上的人。",
    tags: ["悬疑", "民国", "多结局", "海雾"],
    estimatedTime: "15–20 分钟",
    endingCount: 3,
    statsEnabled: true,
    stats: BASE_STATS.map((s) => ({ ...s })),
    initialStats: { hp: 100, insight: 0, bond: 0 },
    initialInventory: ["黄铜钥匙"],
    itemLibrary: {
      黄铜钥匙: "姐姐信封里的钥匙，齿痕与灯塔门锁严丝合缝。",
      半张潮汐表: "红笔圈出了第 3 天凌晨三点零七分，旁边写着“退潮第七码”。",
      潮湿的火柴: "白鸥递来的火柴，盒面印着鲸落酒馆的鲸鱼标记。",
      未登记的旧船票: "三年前，一艘没有登记的船靠岸。票根上的日期被海雾洇开了。",
      银色哨子: "沈砚被绑在仓库时握在手里的哨子，吹不出声音。"
    },
    characters: [
      { name: "沈砚", role: "雾港最后的守塔人", tone: "stranger", initial: "砚", desc: "寡言，袖口永远沾着灯油。三年前在姐姐的失踪记录上签了字。" },
      { name: "白鸥", role: "《雾港小报》编辑", tone: "ally", initial: "鸥", desc: "消息灵通，笑起来像一把合拢的折扇。她似乎知道所有不该知道的事。" },
      { name: "沈鸢", role: "失踪者 · 你的姐姐", tone: "ghost", initial: "鸢", desc: "三年前被判定溺亡。她的字迹却出现在一封刚刚投递的信上。" }
    ],
    initialLocation: "雾港 · 旧码头",
    initialTime: "第 1 天 · 深夜",
    startNodeId: "n0",
    nodes: {
      n0: {
        id: "n0",
        chapter: "序章",
        title: "雾中来信",
        location: "雾港 · 旧码头",
        time: "第 1 天 · 深夜",
        weather: "有雾，东南风 3 级",
        text: [
          "雾是从海面长出来的。它漫过栈桥，漫过生锈的锚链，最后停在你的靴边，像一件被海水泡胀的旧外套。",
          "三年前，姐姐沈鸢在雾港失踪。所有人都说她被潮水带走了。可今天清晨，你收到一封她写的信——邮戳来自白塔礁，一座停用了十二年的灯塔。",
          "信纸只有一句话：**“别相信退潮后还留在岸上的人。”** 信封夹层里，一把黄铜钥匙硌着你的指尖。远处，灯塔的灯忽然亮了一瞬。"
        ],
        echo: [
          "你沿着码头多走了几步。木板下传来空洞的回响，像有人正隔着海水敲击。",
          "潮湿的风里混着煤油味。远处，灯塔的光又灭了一次，像一只缓慢合上的眼睛。"
        ],
        choices: [
          {
            id: "c0-1",
            text: "沿堤岸走向白塔礁",
            note: "提灯的光在雾里若隐若现",
            to: "n1",
            effects: { hp: -3, insight: 1 },
            keywords: ["灯塔", "白塔", "堤岸", "走", "礁"]
          },
          {
            id: "c0-2",
            text: "先去「鲸落」酒馆，找白鸥问个清楚",
            note: "酒馆还亮着最后一盏灯",
            to: "n2",
            effects: { bond: 1, items: ["潮湿的火柴"] },
            keywords: ["酒馆", "白鸥", "打听", "问", "鲸落"]
          },
          {
            id: "c0-3",
            text: "在码头灯下，拆开信封的夹层",
            note: "黄铜钥匙的齿痕有些眼熟",
            to: "n3",
            effects: { hp: -4, insight: 2, items: ["半张潮汐表"] },
            keywords: ["信", "夹层", "拆", "潮汐表", "检查", "信封"]
          }
        ]
      },
      n1: {
        id: "n1",
        chapter: "第一章",
        title: "白塔不眠",
        location: "白塔礁 · 灯塔外",
        time: "第 1 天 · 深夜",
        weather: "雾更浓了，海面无声",
        text: [
          "通往灯塔的石阶被潮水啃出了缺口。你数到第七十三级时，看见一个人影站在门前，手里提着一盏没有点亮的灯。",
          "沈砚。雾港最后一个守塔人。三年前，是他签下了姐姐的失踪记录。他看见你，没有惊讶，只问：“信，是你收到的，还是她亲自交给你的？”",
          "灯塔在他背后沉默着。门缝里渗出一线暖光，和你手中黄铜钥匙的齿痕，严丝合缝。"
        ],
        echo: [
          "你伸手触碰铁门，指尖传来一阵细微的震动。门后有什么在呼吸，缓慢而潮湿。",
          "沈砚没有看你，视线越过你的肩膀落向海面。那里什么都没有，只有雾。"
        ],
        choices: [
          {
            id: "c1-1",
            text: "“她寄给我的。让我进去。”",
            note: "把钥匙递到他面前",
            to: "n4",
            effects: { insight: 1, bond: 2 },
            keywords: ["沈砚", "信", "进去", "相信", "一起", "钥匙"]
          },
          {
            id: "c1-2",
            text: "不回答，绕到灯塔背面寻找别的入口",
            note: "海风把某扇窗吹开了一条缝",
            to: "n4",
            effects: { hp: -5, insight: 1 },
            keywords: ["绕", "背面", "入口", "窗", "后面"]
          },
          {
            id: "c1-3",
            text: "听见酒馆方向传来姐姐的声音，转身奔回旧街",
            note: "那声音太像她了",
            to: "n2",
            effects: { hp: -4, bond: -1 },
            keywords: ["声音", "酒馆", "转身", "旧街", "回去"]
          }
        ]
      },
      n2: {
        id: "n2",
        chapter: "第一章",
        title: "鲸落酒馆",
        location: "雾港 · 鲸落酒馆",
        time: "第 1 天 · 午夜",
        weather: "雨点开始敲打窗棂",
        text: [
          "酒馆里只剩下白鸥在擦杯子。她把一张旧船票推到你面前，烛火在她指节上跳了一下。",
          "“你姐姐失踪那晚，有一艘没有登记过的船靠岸。”她用指尖压住船票的一角，“灯塔里的沈砚在撒谎。你要听真话，就得跟我去十三号仓库。”",
          "她笑了一下，露出一点不太像笑意的牙齿：“不过先说好——看见什么都不许喊。”"
        ],
        echo: [
          "你把酒馆环视一圈。墙角有一张桌子，桌上两只杯子，一只早已凉透，另一只还在冒热气。",
          "白鸥把船票往你手边推近了一点。她的指甲缝里有一小片暗红色的漆。"
        ],
        choices: [
          {
            id: "c2-1",
            text: "跟白鸥去十三号仓库",
            note: "旧船票背面画着一个潦草的锚",
            to: "n5",
            effects: { hp: -8, insight: 1, items: ["未登记的旧船票"] },
            keywords: ["仓库", "白鸥", "船票", "跟", "十三号"]
          },
          {
            id: "c2-2",
            text: "先去灯塔找沈砚对质",
            note: "让两个说谎的人见一面",
            to: "n4",
            effects: { bond: 2 },
            keywords: ["灯塔", "沈砚", "对质", "找"]
          }
        ]
      },
      n3: {
        id: "n3",
        chapter: "第一章",
        title: "信封的第二层",
        location: "雾港 · 旧码头",
        time: "第 1 天 · 深夜",
        weather: "雾在灯下变成细小的水珠",
        text: [
          "你用钥匙的尖端挑开夹层。里面没有第二封信，只有一张被汗浸软的潮汐表。有人用红笔圈出三天后的凌晨三点，旁边写着：**“退潮第七码，第三封信。”**",
          "你抬头。雾里有个穿黑雨衣的人正看着你，嘴里叼着一根没有点燃的烟。你认出那是白鸥——她转身就走，像在等你跟上来。"
        ],
        echo: [
          "你把潮汐表举到灯下，纸背透出几道极浅的压痕，像是一张被反复折叠过的地图。",
          "白鸥的背影在雾里停了一瞬。她没有回头，只抬起手，朝十三号仓库的方向指了指。"
        ],
        choices: [
          {
            id: "c3-1",
            text: "按潮汐表的标记，前往白塔礁",
            note: "先弄清灯塔为什么亮起",
            to: "n4",
            effects: { insight: 1 },
            keywords: ["潮汐", "白塔", "灯塔", "标记", "走"]
          },
          {
            id: "c3-2",
            text: "追上白鸥，去十三号仓库",
            note: "她显然知道“第三封信”",
            to: "n5",
            effects: { hp: -2, insight: 1 },
            keywords: ["白鸥", "追", "仓库", "十三号", "跟上"]
          }
        ]
      },
      n4: {
        id: "n4",
        chapter: "第二章",
        title: "塔顶的第七次灯灭",
        location: "白塔礁 · 灯塔顶层",
        time: "第 1 天 · 凌晨三点",
        weather: "塔外无风，灯罩内却在起雾",
        text: [
          "塔顶的灯罩里没有灯芯，只有一团缓慢旋转的雾。沈砚把黄铜钥匙插进机关，齿轮咬合，墙壁里传出漫长的一声叹息。",
          "“你姐姐没有失踪，”他说，“她只是走到了潮线另一边。每七年，灯塔要交出一个名字，海才会把雾港还给我们。”",
          "他从怀里取出姐姐的怀表。指针停在三点零七分——和信纸上的邮戳，一模一样。"
        ],
        echo: [
          "你看向灯罩，雾里隐约浮出一张女人的侧脸。等你眨眼，那张脸又变成了你自己的。",
          "沈砚的手一直按在机关上，指节发白。他看起来不像在撒谎，更像是在害怕什么被打开。"
        ],
        choices: [
          {
            id: "c4-1",
            text: "“把信交给我。剩下的路我自己走。”",
            note: "选择相信一个曾经说谎的人",
            to: "n7",
            effects: { insight: 1, bond: 1 },
            keywords: ["信", "相信", "自己走", "沈砚", "答应"]
          },
          {
            id: "c4-2",
            text: "趁他不备，独自钻进灯室",
            note: "那团雾里有人在叫你的名字",
            to: "e2",
            effects: { hp: -12 },
            keywords: ["灯室", "独自", "钻", "进去", "灯罩"]
          }
        ]
      },
      n5: {
        id: "n5",
        chapter: "第二章",
        title: "十三号仓库",
        location: "雾港 · 十三号仓库",
        time: "第 2 天 · 凌晨",
        weather: "铁皮屋顶上积着冷雨",
        text: [
          "仓库里没有货，只有一艘被拆开的旧船。船腹内壁密密麻麻写满了名字，最上面一行是“沈鸢”，最后一行的墨迹还没有干。",
          "白鸥踢开脚边的缆绳。“每个名字，都是一个被留下来的人。你姐姐发现了这件事，所以她要回来。”她拉开一块油布，下面躺着一个人——被绑着，嘴里塞着和你信封上同样的蜡封。",
          "是沈砚。可你半小时前才刚刚见过他。"
        ],
        echo: [
          "你蹲下检查船腹的名字。有些字迹已经发黑，有些像刚刚写上去。最底下一行被海水泡得模糊，只能辨认出一个“陆”字。",
          "被绑着的沈砚睁着眼睛。他不能说话，却用视线一遍遍指向仓库天花板上的那盏灯。"
        ],
        choices: [
          {
            id: "c5-1",
            text: "割断绳子，救下沈砚",
            note: "他的手腕上有一圈旧灯绳的勒痕",
            to: "n7",
            effects: { hp: -10, insight: 2, bond: 1, items: ["银色哨子"] },
            keywords: ["救", "绳子", "割", "沈砚", "松开"]
          },
          {
            id: "c5-2",
            text: "点燃仓库，逼“外面那个沈砚”现身",
            note: "火会照亮一些藏起来的东西",
            to: "e2",
            effects: { hp: -6 },
            keywords: ["火", "点燃", "烧", "逼", "仓库"]
          }
        ]
      },
      n7: {
        id: "n7",
        chapter: "终章",
        title: "退潮之后",
        location: "白塔礁 · 潮线",
        time: "第 3 天 · 凌晨三点零七分",
        weather: "退潮，雾低低地贴着海面",
        text: [
          "凌晨三点零七分。海面退开，露出一道通向灯塔地下的石阶。信纸在你口袋里发烫，姐姐的名字像一枚将熄未熄的火种。",
          "沈砚站在潮线外，没有阻止你。远处，白鸥举起了那盏没有点过的灯。灯塔第七次熄灭，雾港的狗开始整夜地叫。",
          "你听见姐姐的声音从很深的地方传来：“不要回头。灯亮之前，选一个你愿意留下的名字。”"
        ],
        echo: [
          "你向下走了几步。石阶上刻满了名字，每走一步，就有一个名字在脚下亮起，又在身后熄灭。",
          "海面安静得不像海。你听见自己的心跳，和很远的地方传来的、另一个人的呼吸。"
        ],
        choices: [
          {
            id: "c7-1",
            text: "把信投入灯焰，让潮声停止",
            note: "用一个名字，换整座港口的安宁",
            to: "e2",
            effects: { hp: -10 },
            keywords: ["烧", "灯焰", "火", "投入", "停止"]
          },
          {
            id: "c7-2",
            text: "念出姐姐的名字，走向潮线",
            note: "也许告别不是把她留下",
            to: "e1",
            effects: { insight: 1 },
            keywords: ["念", "名字", "姐姐", "走向", "潮线", "海"]
          },
          {
            id: "c7-3",
            text: "沿退潮后的第三道石阶，走进灯塔地下",
            note: "你听见了第三个声音",
            to: "e3",
            requires: { stat: "insight", min: 3, label: "需要至少 3 条线索" },
            keywords: ["第三", "石阶", "地下", "走下去", "台阶"]
          }
        ]
      },
      e1: {
        id: "e1",
        chapter: "结局 · 潮汐之外",
        title: "潮汐之外",
        location: "白塔礁 · 潮线",
        time: "第 3 天 · 黎明",
        weather: "雾散，海面泛白",
        isEnding: true,
        endingType: "good",
        endingTitle: "潮汐之外",
        endingQuote: "海不会留住任何一个名字，除非你愿意替它记得。",
        text: [
          "你把信纸折成一只小船，放进退潮的缝隙里。姐姐的名字随船漂远，雾港的雾第一次没有在黎明前回来。",
          "你回头。沈砚站在岸上，手里那盏灯终于亮了。他朝你点了一下头，像是在替谁告别。",
          "后来，邮差说每年都有一封信从海上寄来，没有落款，只有一句：**“这次，换我等你。”**"
        ],
        echo: [
          "你听见身后的海轻轻响了一声，像有人在很远的地方合上了一本书。",
          "第一缕天光落在灯塔上。那盏亮了七年的灯，这一次没有灭。"
        ],
        choices: []
      },
      e2: {
        id: "e2",
        chapter: "结局 · 长夜守灯人",
        title: "长夜守灯人",
        location: "白塔礁 · 灯塔",
        time: "第 3 天 · 天亮以前",
        weather: "无风，无雾，无声",
        isEnding: true,
        endingType: "bad",
        endingTitle: "长夜守灯人",
        endingQuote: "海记得每一个被留下的名字。",
        text: [
          "灯焰吞掉信纸的那一刻，整座灯塔安静下来。海面平得像一块黑色的玻璃，雾港的雾散了。",
          "天亮时，码头的人说，灯塔昨晚亮得真好看。没有人记得你。你站在灯罩里，成了新的守灯人。",
          "每隔七年，你会听见有人在雾里喊一个名字。你不能回答；你只能把灯点亮，等下一个走近的人。"
        ],
        echo: [
          "你想不起自己的名字了。只记得有一封信，信封上是海水的咸味。",
          "灯亮着。海面很安静。你终于明白，为什么沈砚从不在塔顶点灯。"
        ],
        choices: []
      },
      e3: {
        id: "e3",
        chapter: "隐藏结局 · 第三封信",
        title: "第三封信",
        location: "白塔礁 · 倒悬邮局",
        time: "时间在这里失效",
        weather: "无数封未寄出的信在头顶飘动",
        isEnding: true,
        endingType: "hidden",
        endingTitle: "第三封信",
        endingQuote: "真正被写下的名字，不会留在原地。",
        text: [
          "第三道石阶通向一座倒悬的邮局。天花板上垂着成千上万封信，每一封都写给一个还没有被忘记的人。",
          "姐姐坐在柜台后面，穿着失踪那天的衣服，正在给一封信盖邮戳。她抬起头，像这三年什么也没发生。",
          "“你来得比我想的早。”她把信推给你。收件人一栏写着你自己的名字。信里只有一句：**“不要替我留下。”**",
          "你醒来时，躺在退潮后的礁石上，手里攥着一枚生锈的邮戳。雾港的灯塔不再亮了，但你终于知道，离开并不是消失。"
        ],
        echo: [
          "你低头看手里的邮戳。日期那一栏空着，像在等你自己填上。",
          "姐姐的字迹还留在信封背面：不要替我留下。远处，天一点点亮起来。"
        ],
        choices: []
      }
    },
    nodeOrder: ["n0", "n1", "n2", "n3", "n4", "n5", "n7", "e1", "e2", "e3"]
  };

  /* ------------------------------------------------------------------ */
  /* Reusable story kits, used for generated and demo stories            */
  /* ------------------------------------------------------------------ */

  const PACKS = {
    scifi: {
      key: "scifi",
      genreLabel: "科幻 · 月球悬疑",
      title: "月背来讯",
      subtitle: "光要八分钟才抵达，告别也是。",
      synopsis:
        "姐姐在月背失踪三年后，你收到一封延迟了 1095 天的讯息。信标塔的灯亮起时，静海站所有人都说：不要回应。",
      cover: "neon",
      era: "2147 年",
      tone: "冷冽、寂静、浪漫",
      world: "静海站",
      landmark: "月背信标塔",
      landmarkShort: "信标塔",
      underplace: "冰层档案库",
      route: "月尘栈道",
      tavern: "零重力酒馆",
      npc: "岚",
      npcRole: "信标维护员",
      ally: "七号",
      allyRole: "保管着旧船员记忆的 AI",
      lost: "姐姐沈弥",
      lossYears: 3,
      object: "钛合金密钥",
      objectDesc: "一枚边缘磨损的钛合金密钥，编号 M-07。",
      warning: "别回那条讯息。它不是从月球发来的。",
      weather: "月夜，环形山边缘正在起尘",
      sensory: "空气里是过滤棉和冷却剂的味道",
      disappearTheory: "她在一次太阳风暴里被永远留在了月背",
      abandonedYears: 12,
      signalLight: "信标塔顶的航标灯",
      clueItem: "一段被删除的航行日志",
      clueItemDesc: "日志的最后一行被人为抹去，只剩时间戳：03:07。",
      clueMarker: "第三码，回讯窗口",
      ticketName: "未登记的穿梭票",
      ticketDesc: "一张没有目的地代码的穿梭票，签发人一栏是空的。",
      answerItem: "旧船员徽章",
      answerItemDesc: "七号从旧制服里找出的徽章，背面刻着岚的名字。",
      border: "明暗界线",
      fog: "尘雾",
      fogName: "尘雾",
      flame: "反应堆",
      messenger: "通讯站",
      faraway: "月背",
      keepsake: "姐姐的计时器",
      forbiddenPlace: "信标核心舱",
      ritual: "信标的回讯",
      finalTime: "第 3 天 · 回讯窗口开启前七分钟",
      characters: [
        { name: "岚", role: "信标维护员", tone: "stranger", initial: "岚", desc: "沉默寡言，右臂有一道旧伤。三年前在沈弥的失踪记录上签了字。" },
        { name: "七号", role: "旧船员记忆体", tone: "ally", initial: "七", desc: "拥有七名失踪船员的记忆，偶尔会用别人的语气说话。" },
        { name: "沈弥", role: "失踪者 · 你的姐姐", tone: "ghost", initial: "弥", desc: "静海站最后一位深空通讯官。她的讯号从未真正离开。" }
      ],
      endings: {
        e1: {
          title: "月出之前",
          quote: "有些抵达，是允许另一个人离开。",
          text: [
            "你把讯息折成一束光，投进明暗界线。姐姐的名字随它漂远，静海站的尘雾第一次在月出前散去。",
            "你回头。岚站在气闸外，手里那盏信标灯终于亮了。他朝你点了一下头，像是在替谁告别。",
            "后来，通讯站说每年都有一封延迟讯息从月背寄来，没有编号，只有一句：**“这次，换我等你。”**"
          ]
        },
        e2: {
          title: "静默轨道",
          quote: "没有回讯的宇宙，会把回声当作噪音。",
          text: [
            "讯息被投入反应堆的那一刻，整个信标塔安静下来。静海站的尘雾散了，月面平得像一块冷却的金属。",
            "天亮时，人们说，信标塔昨晚亮得真好看。没有人记得你。你站在控制台前，成了新的信标维护员。",
            "每隔七年，你会听见通讯频道里有人在尘雾中喊一个名字。你不能回答；你只能把灯点亮，等下一个走近的人。"
          ]
        },
        e3: {
          title: "第八码",
          quote: "被写下的名字，会从坐标之外回信。",
          text: [
            "第三道舱门通向一座倒悬的通讯站。天花板上垂着成千上万条未读讯息，每一条都来自一个还没有被忘记的人。",
            "姐姐坐在控制台后，穿着失踪那天的制服，正在给一条讯息标注时间。她抬起头，像这三年什么也没发生。",
            "“你来得比我想的早。”她把讯息推给你。收件人一栏写着你自己的名字。讯息里只有一句：**“不要替我留下。”**",
            "你醒来时，躺在月尘里，手里攥着一枚旧编号牌。信标塔不再亮了，但你终于知道，离开并不是消失。"
          ]
        }
      }
    },
    romance: {
      key: "romance",
      genreLabel: "恋爱 · 海边小城",
      title: "潮汐未寄",
      subtitle: "有些话，要等退潮才听得见。",
      synopsis:
        "南屿的梅雨季，你回到外婆留下的唱片店，遇见七年前不告而别的旧友。一张从未发行过的唱片，把你们带回那个没有说完告别的夏天。",
      cover: "romance",
      era: "当代",
      tone: "温柔、克制、微苦",
      world: "南屿",
      landmark: "白鲸灯塔",
      landmarkShort: "灯塔",
      underplace: "旧防波堤",
      route: "梧桐长街",
      tavern: "晚风唱片店",
      npc: "江屿",
      npcRole: "旧书店店主",
      ally: "阿遥",
      allyRole: "深夜电台主播",
      lost: "母亲",
      lossYears: 7,
      object: "一张旧唱片",
      objectDesc: "唱片封面被雨水泡皱，曲目栏是手写的：给没有寄出的那封信。",
      warning: "别在退潮前，打开那封没有寄出的信。",
      weather: "南屿下了今年第一场春雨",
      sensory: "咸湿的风里混着栀子花和旧纸的味道",
      disappearTheory: "她在台风夜独自去了海边，再也没有回来",
      abandonedYears: 7,
      signalLight: "白鲸灯塔的旧灯",
      clueItem: "一封被退回的信",
      clueItemDesc: "信封上盖着“查无此人”的邮戳，收件人是你。",
      clueMarker: "退潮后，灯塔第三级台阶",
      ticketName: "一张旧渡轮票",
      ticketDesc: "票面上印着七年前的日期，目的地是南屿。",
      answerItem: "一枚唱片店钥匙",
      answerItemDesc: "铜钥匙柄上刻着一只很轻的鲸鱼。",
      border: "潮线",
      fog: "雨雾",
      fogName: "雨雾",
      flame: "唱片店的壁炉",
      messenger: "邮差",
      faraway: "海上",
      keepsake: "母亲的旧怀表",
      forbiddenPlace: "灯塔顶层",
      ritual: "灯塔的点灯仪式",
      finalTime: "第 3 天 · 退潮前十分钟",
      characters: [
        { name: "江屿", role: "旧书店店主", tone: "stranger", initial: "屿", desc: "七年前不告而别的旧友。如今守着长街尽头一间旧书店，像在等谁回来。" },
        { name: "阿遥", role: "深夜电台主播", tone: "ally", initial: "遥", desc: "南屿所有秘密的最后一道出口。她读过每一封没有寄出的信。" },
        { name: "母亲", role: "失踪者 · 唱片店旧主", tone: "ghost", initial: "鸢", desc: "失踪七年。你仍记得她哼歌时会把最后一句唱得很轻。" }
      ],
      endings: {
        e1: {
          title: "潮汐未寄",
          quote: "有些人不是回来了，是终于被允许留下。",
          text: [
            "你把旧唱片放进店里的唱机。雨停在副歌之前，母亲的声音从很远的年头里传过来，像一条终于靠岸的船。",
            "江屿站在门口，没有撑伞。他说七年前没来得及把那句话说完。你替他关掉唱机，说这次可以慢慢说。",
            "后来，南屿的邮差说每年都有一封没有地址的信寄到唱片店，没有落款，只有一句：**“这次，换我等你。”**"
          ]
        },
        e2: {
          title: "无人接听",
          quote: "有些房间，只会在雨声里保持原样。",
          text: [
            "唱片被丢进壁炉的那一刻，整条长街安静下来。雨停了，南屿的天空白得像一张没有写过的信纸。",
            "天亮时，人们说，昨晚白鲸灯塔亮得真好看。没有人记得你。你坐在唱片店里，成了新的守店人。",
            "每隔七年，你会听见电台里有人点一首没有名字的歌。你不能回答；你只能把唱针放下，等下一个推门的人。"
          ]
        },
        e3: {
          title: "给明天的信",
          quote: "没有寄出的那句话，也可以在明天抵达。",
          text: [
            "第三级台阶下没有潮水，只有一间被时间忘记的邮局。天花板上垂着成千上万封信，每一封都写给一个还没有被忘记的人。",
            "母亲坐在柜台后面，穿着失踪那天的衣服，正在给一封信贴邮票。她抬起头，像这七年什么也没发生。",
            "“你来得比我想的早。”她把信推给你。收件人一栏写的是江屿。信里只有一句：**“别替我留下。”**",
            "你醒来时，躺在退潮后的礁石上，手里攥着一枚旧邮票。南屿的灯塔不再亮了，但你终于知道，想念并不是挽留。"
          ]
        }
      }
    },
    adventure: {
      key: "adventure",
      genreLabel: "冒险 · 无昼海",
      title: "无昼之海",
      subtitle: "海图没有尽头，除非你决定回头。",
      synopsis:
        "无昼海上没有太阳。你继承了一张会随潮汐变化的星图，和父亲留下的半艘飞艇。传说星图尽头有一座会唱歌的岛。",
      cover: "forest",
      era: "大航海余晖",
      tone: "辽阔、热烈、宿命感",
      world: "无昼海",
      landmark: "沉钟灯塔",
      landmarkShort: "灯塔",
      underplace: "鲸骨船坞",
      route: "断桅栈桥",
      tavern: "盐与罗盘酒馆",
      npc: "罗盘",
      npcRole: "老船长",
      ally: "雀",
      allyRole: "飞艇机械师",
      lost: "父亲",
      lossYears: 5,
      object: "父亲留下的星图",
      objectDesc: "一张会随潮汐改写的星图，边缘写着：不要相信北方的灯。",
      warning: "跟着星图走的人，都回不来。",
      weather: "无昼海没有太阳，只有一层永远不落的灰蓝",
      sensory: "风里有盐、鲸油和某种烧焦的甜味",
      disappearTheory: "他的船在无昼海里迷了航，被潮水带去了海图之外",
      abandonedYears: 9,
      signalLight: "沉钟灯塔的铜灯",
      clueItem: "一枚被磨平的罗盘针",
      clueItemDesc: "指针始终指向同一个方向，不是北，也不是海。",
      clueMarker: "退潮第七码，沉钟之下",
      ticketName: "一张鲸骨船票",
      ticketDesc: "船票没有日期，只印着一行小字：单程，不保证抵达。",
      answerItem: "父亲的船锚徽章",
      answerItemDesc: "徽章背面刻着一句很浅的话：别为我停船。",
      border: "潮线",
      fog: "灰雾",
      fogName: "灰雾",
      flame: "船坞的鲸油灯",
      messenger: "飞艇邮差",
      faraway: "海图之外",
      keepsake: "父亲的铜制六分仪",
      forbiddenPlace: "灯塔钟楼",
      ritual: "沉钟的敲响",
      finalTime: "第 3 天 · 无昼海退潮时",
      characters: [
        { name: "罗盘", role: "老船长", tone: "stranger", initial: "罗", desc: "在无昼海上航行了四十年。他说自己从没见过日出。" },
        { name: "雀", role: "飞艇机械师", tone: "ally", initial: "雀", desc: "满手机油，胆子比飞艇还大。她答应带你去找那座会唱歌的岛。" },
        { name: "父亲", role: "失踪者 · 上一任船长", tone: "ghost", initial: "锚", desc: "失踪五年。他的星图仍在潮汐里自行改写。" }
      ],
      endings: {
        e1: {
          title: "日出之海",
          quote: "海的尽头不是岛，是你愿意回去的地方。",
          text: [
            "你把星图折成一只纸鸟，放它飞向海图之外。灰蓝的天第一次裂开一道缝，光从很远的地方落下来。",
            "雀在飞艇上朝你挥手。罗盘站在断桅栈桥上，把帽子按在胸口，像在替谁送行。",
            "后来，飞艇邮差说每年都有一封信从海图之外寄来，没有坐标，只有一句：**“这次，换我等你。”**"
          ]
        },
        e2: {
          title: "永夜航线",
          quote: "有些船，会变成海的一部分。",
          text: [
            "星图被丢进鲸油灯的那一刻，整片无昼海安静下来。灰雾散了，海面平得像一块没有刻度的表盘。",
            "天亮时，人们说，沉钟灯塔昨晚亮得真好看。没有人记得你。你站在船头，成了新的守灯人。",
            "每隔七年，你会听见海面下有人唱一首没有名字的歌。你不能回答；你只能把灯点亮，等下一个迷航的人。"
          ]
        },
        e3: {
          title: "世界尽头的水手",
          quote: "海图之外，还有一张没有画完的海图。",
          text: [
            "第三道石阶通向一座倒悬的船坞。天花板上悬着成千上万张未完成的海图，每一张都通向一个还没有被忘记的人。",
            "父亲坐在船头，穿着失踪那天的衣服，正在给一张海图补最后一笔。他抬起头，像这五年什么也没发生。",
            "“你来得比我想的早。”他把海图推给你。终点一栏写着你的名字。海图背后只有一句：**“别为我停船。”**",
            "你醒来时，躺在退潮后的礁石上，手里攥着一枚生锈的船锚徽章。无昼海的灯塔不再亮了，但你终于知道，远航并不是离开。"
          ]
        }
      }
    },
    apocalypse: {
      key: "apocalypse",
      genreLabel: "末世 · 废土求生",
      title: "第七码头的黎明",
      subtitle: "只要广播塔还亮着，就还有人记得天亮的样子。",
      synopsis:
        "太阳落山后的第七码头，广播塔是唯一还亮着的地方。你收到妹妹的求救讯号，但她已经失踪了三年。",
      cover: "ash",
      era: "大停电之后第七年",
      tone: "粗粝、温暖、绝望中的希望",
      world: "第七码头",
      landmark: "旧广播塔",
      landmarkShort: "广播塔",
      underplace: "地铁沉管",
      route: "北闸门废墟",
      tavern: "地下水吧",
      npc: "韩烬",
      npcRole: "守夜人",
      ally: "小满",
      allyRole: "拾荒者",
      lost: "妹妹",
      lossYears: 3,
      object: "一枚辐射计数器",
      objectDesc: "计数器已经不响了，指针却一直停在同一个刻度。",
      warning: "天亮之前，别让广播塔的灯灭。",
      weather: "第七码头已经三年没有见过真正的日出",
      sensory: "空气里是铁锈、柴油和潮湿混凝土的味道",
      disappearTheory: "她在一次地表清理中被列入了失踪名单",
      abandonedYears: 7,
      signalLight: "广播塔顶的探照灯",
      clueItem: "一盘被烧焦的录音带",
      clueItemDesc: "磁带标签上写着：给活下来的人，第七码。",
      clueMarker: "第三码，天亮之前",
      ticketName: "一张旧通行证",
      ticketDesc: "通行证上的照片被磨掉了，只能看见有效期：最后一天。",
      answerItem: "妹妹的金属口琴",
      answerItemDesc: "口琴上刻着两个名字，其中一个被划掉了。",
      border: "隔离墙",
      fog: "尘暴",
      fogName: "尘暴",
      flame: "发电机的炉膛",
      messenger: "地表信使",
      faraway: "墙外",
      keepsake: "妹妹的旧手表",
      forbiddenPlace: "广播塔控制室",
      ritual: "广播塔的晚祷",
      finalTime: "第 3 天 · 天亮前七分钟",
      characters: [
        { name: "韩烬", role: "守夜人", tone: "stranger", initial: "烬", desc: "广播塔的最后一名守夜人。他的声音每天准时响起，安慰着整座码头。" },
        { name: "小满", role: "拾荒者", tone: "ally", initial: "满", desc: "在地表来去自如，背包里永远有半块压缩饼干和一个坏掉的收音机。" },
        { name: "妹妹", role: "失踪者 · 你的家人", tone: "ghost", initial: "灯", desc: "失踪三年。昨晚，她的声音出现在广播里，只说了一句：别让灯灭。" }
      ],
      endings: {
        e1: {
          title: "第七码头",
          quote: "天亮不是奇迹，是有人替你守到了最后。",
          text: [
            "你把录音带塞进广播塔的机器。妹妹的声音穿过整座码头，像一束迟到了三年的光。隔离墙外，天第一次亮了。",
            "韩烬站在控制室门口，没有阻止你。他关掉探照灯，说：“原来白天是这个颜色。”",
            "后来，地表信使说每年都有一盘录音带从墙外寄来，没有署名，只有一句：**“这次，换我等你。”**"
          ]
        },
        e2: {
          title: "无人黎明",
          quote: "灯灭之后，广播里还会有回声。",
          text: [
            "录音带被投入炉膛的那一刻，整座广播塔安静下来。第七码头的尘暴散了，天边露出一线很淡的白。",
            "天亮时，人们说，广播塔昨晚亮得真好看。没有人记得你。你坐在控制台前，成了新的守夜人。",
            "每隔七年，你会听见广播里有人在尘暴中喊一个名字。你不能回答；你只能把灯点亮，等下一个走近的人。"
          ]
        },
        e3: {
          title: "白昼协议",
          quote: "活下来的人，有权利替离开的人看一眼天亮。",
          text: [
            "第三道闸门通向一间倒悬的控制室。天花板上垂着成千上万条未播放的广播，每一条都来自一个还没有被忘记的人。",
            "妹妹坐在控制台后，穿着失踪那天的衣服，正在校准一个时间。她抬起头，像这三年什么也没发生。",
            "“你来得比我想的早。”她把录音带推给你。标签上写着你自己的名字。录音里只有一句：**“别替我留下。”**",
            "你醒来时，躺在隔离墙外的瓦砾上，手里攥着一枚旧磁带。第七码头的广播塔不再亮了，但天终于亮了。"
          ]
        }
      }
    },
    suspense: {
      key: "suspense",
      genreLabel: "悬疑 · 海雾迷局",
      title: "潮汐第七码",
      subtitle: "每一个被留下的名字，都在等一封信。",
      synopsis:
        "失踪三年的姐姐寄来一封信，邮戳却来自一座停用了十二年的灯塔。你回到雾港，在潮声与谎言之间寻找第三封信。",
      cover: "harbor",
      era: "1926 年",
      tone: "潮湿、克制、宿命感",
      world: "雾港",
      landmark: "白塔礁灯塔",
      landmarkShort: "灯塔",
      underplace: "十三号仓库",
      route: "旧码头堤岸",
      tavern: "鲸落酒馆",
      npc: "沈砚",
      npcRole: "守塔人",
      ally: "白鸥",
      allyRole: "小报编辑",
      lost: "姐姐",
      lossYears: 3,
      object: "一把黄铜钥匙",
      objectDesc: "钥匙柄上刻着一只很轻的鲸鱼，齿痕与灯塔门锁严丝合缝。",
      warning: "别相信退潮后还留在岸上的人。",
      weather: "雾是从海面长出来的",
      sensory: "空气里是盐、煤油和旧纸的味道",
      disappearTheory: "她被潮水带走了，连一具遗体也没有留下",
      abandonedYears: 12,
      signalLight: "灯塔的灯",
      clueItem: "半张潮汐表",
      clueItemDesc: "红笔圈出了第 3 天凌晨三点零七分。",
      clueMarker: "退潮第七码，第三封信",
      ticketName: "一张旧船票",
      ticketDesc: "三年前，一艘没有登记的船靠岸。",
      answerItem: "一枚银色哨子",
      answerItemDesc: "被绑的沈砚握在手里的哨子，吹不出声音。",
      border: "潮线",
      fog: "海雾",
      fogName: "海雾",
      flame: "灯焰",
      messenger: "邮差",
      faraway: "海上",
      keepsake: "姐姐的怀表",
      forbiddenPlace: "灯室",
      ritual: "灯塔的第七次灯灭",
      finalTime: "第 3 天 · 凌晨三点零七分",
      characters: [
        { name: "沈砚", role: "雾港最后的守塔人", tone: "stranger", initial: "砚", desc: "寡言，袖口永远沾着灯油。三年前在姐姐的失踪记录上签了字。" },
        { name: "白鸥", role: "《雾港小报》编辑", tone: "ally", initial: "鸥", desc: "消息灵通，笑起来像一把合拢的折扇。" },
        { name: "沈鸢", role: "失踪者 · 你的姐姐", tone: "ghost", initial: "鸢", desc: "三年前被判定溺亡。她的字迹却出现在一封刚刚投递的信上。" }
      ],
      endings: {
        e1: {
          title: "潮汐之外",
          quote: "海不会留住任何一个名字，除非你愿意替它记得。",
          text: [
            "你把信纸折成一只小船，放进退潮的缝隙里。姐姐的名字随船漂远，雾港的雾第一次没有在黎明前回来。",
            "你回头。沈砚站在岸上，手里那盏灯终于亮了。他朝你点了一下头，像是在替谁告别。",
            "后来，邮差说每年都有一封信从海上寄来，没有落款，只有一句：**“这次，换我等你。”**"
          ]
        },
        e2: {
          title: "长夜守灯人",
          quote: "海记得每一个被留下的名字。",
          text: [
            "灯焰吞掉信纸的那一刻，整座灯塔安静下来。海面平得像一块黑色的玻璃，雾港的雾散了。",
            "天亮时，码头的人说，灯塔昨晚亮得真好看。没有人记得你。你站在灯罩里，成了新的守灯人。",
            "每隔七年，你会听见有人在雾里喊一个名字。你不能回答；你只能把灯点亮，等下一个走近的人。"
          ]
        },
        e3: {
          title: "第三封信",
          quote: "真正被写下的名字，不会留在原地。",
          text: [
            "第三道石阶通向一座倒悬的邮局。天花板上垂着成千上万封信，每一封都写给一个还没有被忘记的人。",
            "姐姐坐在柜台后面，穿着失踪那天的衣服，正在给一封信盖邮戳。她抬起头，像这三年什么也没发生。",
            "“你来得比我想的早。”她把信推给你。收件人一栏写着你自己的名字。信里只有一句：**“不要替我留下。”**",
            "你醒来时，躺在退潮后的礁石上，手里攥着一枚生锈的邮戳。雾港的灯塔不再亮了，但你终于知道，离开并不是消失。"
          ]
        }
      }
    }
  };

  const DEFAULT_BACKGROUNDS = {
    scifi: "2147 年，月球背面的静海站。你是最后一名通讯官，姐姐沈弥在三年前的太阳风暴中失踪。某个没有排班的夜晚，废弃信标塔突然向地球发送了一条八分钟前的讯息。",
    romance: "南屿的梅雨季。你回到外婆留下的唱片店，遇见七年前不告而别的旧友江屿。一张从未发行过的唱片，把你们带回那个没有说完告别的夏天。",
    adventure: "无昼海上没有太阳。你继承了一张会随潮汐变化的星图，和父亲留下的半艘飞艇。传说星图尽头有一座会唱歌的岛，而去过的人都没有回来。",
    apocalypse: "大停电后的第七年，第七码头是最后一座还有灯光的避难城。你收到失踪三年的妹妹发来的求救讯号，广播塔却在这时开始倒数。",
    suspense: "1926 年，雾港。你是一名前战地记者，三年前姐姐沈鸢在故乡失踪。某个雾夜，你收到她寄来的信，邮戳却来自早已停用的白塔礁灯塔。"
  };

  function buildPackNodes(pack, options) {
    const statsEnabled = options.statsEnabled !== false;
    const endingCount = options.endingCount === 1 ? 1 : 3;
    const addItemChoice = (item) => (item ? [item] : undefined);
    const lock = statsEnabled && endingCount > 1
      ? { stat: "insight", min: 3, label: "需要至少 3 条线索" }
      : null;
    const vehicleByGenre = {
      scifi: "穿梭机",
      romance: "渡轮",
      adventure: "帆船",
      apocalypse: "改装车",
      suspense: "船"
    };
    const vessel = vehicleByGenre[pack.key] || "船";
    const vesselUnit = pack.key === "apocalypse" ? "辆" : "艘";
    const inspectScenes = {
      scifi: {
        choice: "在旧终端读取密钥里的隐藏扇区",
        text: `你把${pack.object}接上旧终端。隐藏扇区里跳出一段被删除的航行日志，最后一行被人为抹去，只剩时间戳：**“03:07，第三码，回讯窗口。”**`
      },
      romance: {
        choice: "在灯下拆开旧唱片的封套",
        text: `你沿着封套边缘轻轻划开。里面没有第二张唱片，只有一封被退回的信。信封上盖着“查无此人”的邮戳，背面用红笔写着：**“退潮后，灯塔第三级台阶。”**`
      },
      adventure: {
        choice: "在灯下展开星图的夹层",
        text: `你展开星图的夹层。里面没有第二张海图，只有一枚被磨平的罗盘针。它在灯下缓缓转动，最后指向一个没有标注的坐标：**“退潮第七码，沉钟之下。”**`
      },
      apocalypse: {
        choice: "拆开辐射计数器的后盖",
        text: `你拆开计数器的后盖。里面没有电池，只有一小片被烧焦的磁带。标签上写着：**“第三码，天亮之前。”**`
      },
      suspense: {
        choice: "在码头灯下，拆开信封的夹层",
        text: `你用${pack.object}挑开信封的夹层。里面没有第二封信，只有一张被汗浸软的潮汐表。有人用红笔圈出三天后的凌晨三点，旁边写着：**“退潮第七码，第三封信。”**`
      }
    };
    const inspect = inspectScenes[pack.key] || { choice: `检查${pack.object}`, text: `你在灯下仔细检查${pack.object}，发现一道几乎看不见的接缝。` };

    const n0 = {
      id: "n0",
      chapter: "序章",
      title: "迟到的来信",
      location: `${pack.world} · ${pack.route}`,
      time: "第 1 天 · 深夜",
      weather: pack.weather,
      text: [
        `${pack.weather}。${pack.sensory}。`,
        `${pack.lossYears} 年前，${pack.lost}在${pack.world}失踪。所有人都说，${pack.disappearTheory}。可今天清晨，你收到一封 Ta 写的信——邮戳来自${pack.landmark}，一个 ${pack.abandonedYears} 年没有再亮起的地方。`,
        `信纸上只有一句话：**“${pack.warning}”** ${pack.object}硌着你的指尖。远处，${pack.signalLight}忽然亮了一瞬。`
      ],
      echo: [
        `你沿着${pack.world}的边缘多走了几步。脚下传来空洞的回响，像有人正隔着一层旧时光敲击。`,
        `风里混着${pack.sensory.replace(/^空气里是/, "").replace(/。$/, "")}。远处，${pack.signalLight}又灭了一次。`
      ],
      choices: [
        {
          id: "c0-1",
          text: `沿${pack.route}走向${pack.landmark}`,
          note: "那盏灯像在等一个迟到的人",
          to: "n1",
          effects: { hp: -3, insight: 1 },
          keywords: ["灯塔", "地标", "走", "过去", "前往"]
        },
        {
          id: "c0-2",
          text: `先去${pack.tavern}，找${pack.ally}问个清楚`,
          note: "那里总有人知道不该知道的事",
          to: "n2",
          effects: { bond: 1, items: ["潮湿的火柴"] },
          keywords: ["酒馆", "店", "问", "打听", pack.ally]
        },
        {
          id: "c0-3",
          text: inspect.choice,
          note: "也许答案就藏在最薄的地方",
          to: "n3",
          effects: { hp: -4, insight: 2, items: [pack.clueItem] },
          keywords: ["信", "拆", "夹层", "检查", "密钥", "唱片", "星图"]
        }
      ]
    };

    const n1 = {
      id: "n1",
      chapter: "第一章",
      title: "不眠的地标",
      location: `${pack.landmark} · 门外`,
      time: "第 1 天 · 深夜",
      weather: pack.weather,
      text: [
        `${pack.route}的尽头，${pack.landmark}比记忆中更旧。你数到第七十三级台阶时，看见${pack.npc}站在门前，手里提着一盏没有点亮的灯。`,
        `${pack.npc}，${pack.npcRole}。${pack.lossYears} 年前，正是 Ta 签下了${pack.lost}的失踪记录。Ta 看见你，没有惊讶，只问：“那封信，是你收到的，还是 Ta 亲自交给你的？”`,
        `${pack.landmark}在 Ta 背后沉默着。门缝里渗出一线暖光，和你手中${pack.object}上的旧痕，正好对上。`
      ],
      echo: [
        "你伸手触碰门，指尖传来一阵细微的震动。门后有什么在呼吸，缓慢而潮湿。",
        `${pack.npc}没有看你，视线越过你的肩膀落向远处。那里什么都没有，只有${pack.fogName}。`
      ],
      choices: [
        {
          id: "c1-1",
          text: "“是 Ta 寄给我的。让我进去。”",
          note: "把信物递到对方面前",
          to: "n4",
          effects: { insight: 1, bond: 2 },
          keywords: [pack.npc, "信", "进去", "相信", "一起", "钥匙", "密钥"]
        },
        {
          id: "c1-2",
          text: `绕到${pack.landmark}背面，寻找别的入口`,
          note: "风把某扇窗吹开了一条缝",
          to: "n4",
          effects: { hp: -5, insight: 1 },
          keywords: ["绕", "背面", "入口", "窗", "后面"]
        },
        {
          id: "c1-3",
          text: `听见${pack.tavern}方向传来${pack.lost}的声音，转身奔回去`,
          note: "那声音太像 Ta 了",
          to: "n2",
          effects: { hp: -4, bond: -1 },
          keywords: ["声音", "回去", "转身", pack.tavern]
        }
      ]
    };

    const n2 = {
      id: "n2",
      chapter: "第一章",
      title: pack.tavern,
      location: `${pack.world} · ${pack.tavern}`,
      time: "第 1 天 · 午夜",
      weather: "雨点开始敲打窗棂",
      text: [
        `${pack.tavern}里只剩下${pack.ally}在擦杯子。Ta 把一张${pack.ticketName}推到你面前，烛火在指节上跳了一下。`,
        `“${pack.lost}失踪那晚，有一${vesselUnit}没有登记过的${vessel}靠岸。”${pack.ally}用指尖压住票根的一角，“${pack.npc}在撒谎。你要听真话，就得跟我去${pack.underplace}。”`,
        "Ta 笑了一下，露出一点不太像笑意的牙齿：“不过先说好——看见什么都不许喊。”"
      ],
      echo: [
        "你把四周环视一圈。墙角有一张桌子，桌上两只杯子，一只早已凉透，另一只还在冒热气。",
        `${pack.ally}把票往你手边推近了一点。Ta 的指甲缝里有一小片暗红色的漆。`
      ],
      choices: [
        {
          id: "c2-1",
          text: `跟${pack.ally}去${pack.underplace}`,
          note: `票根背面画着一个潦草的锚`,
          to: "n5",
          effects: { hp: -8, insight: 1, items: [pack.ticketName] },
          keywords: [pack.ally, "仓库", "船票", "票", "跟", "去"]
        },
        {
          id: "c2-2",
          text: `先去${pack.landmark}找${pack.npc}对质`,
          note: "让两个说谎的人见一面",
          to: "n4",
          effects: { bond: 2 },
          keywords: ["灯塔", pack.npc, "对质", "找", "当面"]
        }
      ]
    };

    const n3 = {
      id: "n3",
      chapter: "第一章",
      title: "夹层里的第二个答案",
      location: `${pack.world} · ${pack.route}`,
      time: "第 1 天 · 深夜",
      weather: pack.fogName + "在灯下变成细小的水珠",
      text: [
        inspect.text,
        `你抬头。${pack.fogName}里有个身影正看着你，嘴里叼着一根没有点燃的烟。你认出那是${pack.ally}——Ta 转身就走，像在等你跟上来。`
      ],
      echo: [
        "你把那张纸举到灯下，纸背透出几道极浅的压痕，像一张被反复折叠过的地图。",
        "远处的背影停了一瞬。Ta 没有回头，只抬起手，朝目的地的方向指了指。"
      ],
      choices: [
        {
          id: "c3-1",
          text: `按标记前往${pack.landmark}`,
          note: "先弄清那盏灯为什么亮起",
          to: "n4",
          effects: { insight: 1 },
          keywords: ["标记", "灯塔", "前往", "潮汐", "走"]
        },
        {
          id: "c3-2",
          text: `追上${pack.ally}，去${pack.underplace}`,
          note: "Ta 显然知道第三封信",
          to: "n5",
          effects: { hp: -2, insight: 1 },
          keywords: [pack.ally, "追", "仓库", "跟", "去"]
        }
      ]
    };

    const n4 = {
      id: "n4",
      chapter: "第二章",
      title: "第七次灯灭",
      location: `${pack.landmark} · 最高处`,
      time: "第 1 天 · 凌晨三点",
      weather: "塔外无风，灯罩内却在起雾",
      text: [
        `${pack.landmark}的最高处，${pack.npc}把${pack.object}插进机关。墙壁里传出漫长的一声叹息。`,
        `“${pack.lost}没有失踪，”Ta 说，“Ta 只是走到了${pack.border}另一边。每七年，${pack.landmarkShort}要交出一个名字，${pack.world}才会继续存在。”`,
        `Ta 从怀里取出${pack.keepsake}。指针停在那个被红笔圈出的时间，一模一样。`
      ],
      echo: [
        "你看向灯罩，雾里隐约浮出一张熟悉的侧脸。等你眨眼，那张脸又变成了你自己的。",
        `${pack.npc}的手一直按在机关上，指节发白。Ta 看起来不像在撒谎，更像是在害怕什么被打开。`
      ],
      choices: [
        {
          id: "c4-1",
          text: "“把信交给我。剩下的路我自己走。”",
          note: "选择相信一个曾经说谎的人",
          to: "n7",
          effects: { insight: 1, bond: 1 },
          keywords: ["信", "相信", "自己走", pack.npc, "答应"]
        },
        ...(endingCount > 1
          ? [{
              id: "c4-2",
              text: `趁 Ta 不备，独自闯入${pack.forbiddenPlace}`,
              note: "那团光里有人在叫你的名字",
              to: "e2",
              effects: { hp: -12 },
              keywords: ["独自", "闯", "进去", "禁地", "光"]
            }]
          : [])
      ]
    };

    const n5 = {
      id: "n5",
      chapter: "第二章",
      title: pack.underplace,
      location: `${pack.world} · ${pack.underplace}`,
      time: "第 2 天 · 凌晨",
      weather: "铁皮屋顶上积着冷雨",
      text: [
        `${pack.underplace}里没有货，只有一${vesselUnit}被拆开的旧${vessel}。内壁密密麻麻写满了名字，最上面一行是${pack.lost}，最后一行的墨迹还没有干。`,
        `${pack.ally}踢开脚边的缆绳。“每个名字，都是一个被留下来的人。${pack.lost}发现了这件事，所以 Ta 要回来。”Ta 拉开一块油布，下面躺着一个人——被绑着，嘴里塞着和你信封上同样的蜡封。`,
        `是${pack.npc}。可你半小时前才刚刚见过 Ta。`
      ],
      echo: [
        "你蹲下检查船腹的名字。有些字迹已经发黑，有些像刚刚写上去。最底下一行被水泡得模糊，只能辨认出一个“你”字。",
        `被绑着的${pack.npc}睁着眼睛。Ta 不能说话，却用视线一遍遍指向天花板上的那盏灯。`
      ],
      choices: [
        {
          id: "c5-1",
          text: `割断绳子，救下${pack.npc}`,
          note: "Ta 的手腕上有一圈旧灯绳的勒痕",
          to: "n7",
          effects: { hp: -10, insight: 2, bond: 1, items: [pack.answerItem] },
          keywords: ["救", "绳子", "割", pack.npc, "松开"]
        },
        ...(endingCount > 1
          ? [{
              id: "c5-2",
              text: `点燃${pack.underplace}，逼“外面那个${pack.npc}”现身`,
              note: "火会照亮一些藏起来的东西",
              to: "e2",
              effects: { hp: -6 },
              keywords: ["火", "点燃", "烧", "逼", "仓库"]
            }]
          : [])
      ]
    };

    const n7 = {
      id: "n7",
      chapter: "终章",
      title: "退潮之后",
      location: `${pack.landmark} · ${pack.border}`,
      time: pack.finalTime,
      weather: `${pack.weather}，${pack.fogName}低低地贴着地面`,
      text: [
        `${pack.finalTime}。${pack.border}分开，露出一道通向${pack.landmark}地下的石阶。信纸在你口袋里发烫，${pack.lost}的名字像一枚将熄未熄的火种。`,
        `${pack.npc}站在${pack.border}外，没有阻止你。远处，${pack.ally}举起了那盏没有点过的灯。${pack.landmarkShort}第七次熄灭，${pack.world}的风开始整夜地叫。`,
        `你听见${pack.lost}的声音从很深的地方传来：“不要回头。灯亮之前，选一个你愿意留下的名字。”`
      ],
      echo: [
        "你向下走了几步。石阶上刻满了名字，每走一步，就有一个名字在脚下亮起，又在身后熄灭。",
        "四周安静得不像现实。你听见自己的心跳，和很远的地方传来的、另一个人的呼吸。"
      ],
      choices: [
        ...(endingCount > 1
          ? [{
              id: "c7-1",
              text: `交出${pack.object}，让${pack.ritual}停止`,
              note: "用一个名字，换整座世界的安宁",
              to: "e2",
              effects: { hp: -10 },
              keywords: ["交出", "烧", "停止", "放弃", "留下"]
            }]
          : []),
        {
          id: "c7-2",
          text: `念出${pack.lost}的名字，走向${pack.border}`,
          note: "也许告别不是把 Ta 留下",
          to: "e1",
          effects: { insight: 1 },
          keywords: ["念", "名字", "走向", "告别", "离开"]
        },
        ...(endingCount > 1
          ? [{
              id: "c7-3",
              text: `沿第三道石阶，走进${pack.landmark}地下`,
              note: "你听见了第三个声音",
              to: "e3",
              requires: lock,
              keywords: ["第三", "石阶", "地下", "走下去", "台阶"]
            }]
          : [])
      ]
    };

    const endingNodes = {};
    Object.keys(pack.endings).forEach((key) => {
      if (endingCount === 1 && key !== "e1") return;
      const ending = pack.endings[key];
      const meta = {
        e1: { chapter: "结局 · " + ending.title, location: `${pack.landmark} · ${pack.border}`, time: "第 3 天 · 黎明", type: "good" },
        e2: { chapter: "结局 · " + ending.title, location: `${pack.landmark}`, time: "第 3 天 · 天亮以前", type: "bad" },
        e3: { chapter: "隐藏结局 · " + ending.title, location: `${pack.landmark} · 地下`, time: "时间在这里失效", type: "hidden" }
      }[key];
      endingNodes[key] = {
        id: key,
        chapter: meta.chapter,
        title: ending.title,
        location: meta.location,
        time: meta.time,
        weather: pack.weather,
        isEnding: true,
        endingType: meta.type,
        endingTitle: ending.title,
        endingQuote: ending.quote,
        text: ending.text,
        echo: [
          "你听见远处传来一声很轻的回响，像有人在很深的地方合上了一本书。",
          "天光落下来。你知道，这一次故事真的走到了尽头。"
        ],
        choices: []
      };
    });

    const nodes = { n0, n1, n2, n3, n4, n5, n7, ...endingNodes };
    const order = ["n0", "n1", "n2", "n3", "n4", "n5", "n7"];
    if (endingCount === 1) order.push("e1");
    else order.push("e1", "e2", "e3");
    return { nodes, order };
  }

  function trimText(text, max) {
    if (!text) return "";
    const clean = String(text).replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max) + "…" : clean;
  }

  function buildPackGame(packKey, opts) {
    const pack = PACKS[packKey];
    if (!pack) throw new Error("Unknown story pack: " + packKey);
    const options = opts || {};
    const endingCount = options.endingCount === 1 ? 1 : 3;
    const statsEnabled = options.statsEnabled !== false;
    const built = buildPackNodes(pack, { endingCount, statsEnabled });
    const itemLibrary = {};
    itemLibrary[pack.object] = pack.objectDesc;
    itemLibrary[pack.clueItem] = pack.clueItemDesc;
    itemLibrary[pack.ticketName] = pack.ticketDesc;
    itemLibrary[pack.answerItem] = pack.answerItemDesc;
    itemLibrary["潮湿的火柴"] = "一枚被海风磨得发白的火柴盒，也许还能点燃一次。";

    return {
      id: options.id || "demo-" + pack.key,
      title: options.title || pack.title,
      subtitle: pack.subtitle,
      genre: pack.key,
      genreLabel: pack.genreLabel,
      tone: options.tone || pack.tone,
      era: pack.era,
      cover: pack.cover,
      author: options.author || "回响 AI 工坊",
      published: options.published !== false,
      featured: false,
      isSample: false,
      isGenerated: true,
      synopsis: trimText(options.background || pack.synopsis, 150),
      background: options.background || DEFAULT_BACKGROUNDS[pack.key],
      tags: [pack.genreLabel.split(" · ")[0], endingCount === 1 ? "单结局" : "多结局", "AI 生成"],
      estimatedTime: options.lengthLabel || "15–20 分钟",
      endingCount,
      statsEnabled,
      stats: BASE_STATS.map((s) => ({ ...s })),
      initialStats: { hp: 100, insight: 0, bond: 0 },
      initialInventory: [pack.object],
      itemLibrary,
      characters: pack.characters,
      initialLocation: built.nodes.n0.location,
      initialTime: built.nodes.n0.time,
      startNodeId: "n0",
      nodes: built.nodes,
      nodeOrder: built.order,
      generation: {
        length: options.length || "medium",
        endingCount,
        statsEnabled,
        createdAt: options.createdAt || new Date().toISOString()
      }
    };
  }

  function createCustomGame(config) {
    const packKey = PACKS[config.genre] ? config.genre : "suspense";
    const game = buildPackGame(packKey, {
      id: config.id,
      title: config.title,
      background: config.background,
      tone: config.tone,
      length: config.length,
      lengthLabel: (LENGTH_OPTIONS.find((l) => l.key === config.length) || LENGTH_OPTIONS[1]).time,
      endingCount: config.endingCount,
      statsEnabled: config.statsEnabled,
      published: false,
      author: config.author || "旅人",
      createdAt: new Date().toISOString()
    });
    game.isGenerated = true;
    game.tags = [game.genreLabel.split(" · ")[0], game.endingCount === 1 ? "单结局" : "多结局", "原创"];
    return game;
  }

  const DEMO_GAMES = [
    buildPackGame("scifi", { id: "demo-moon-signal", published: true }),
    buildPackGame("romance", { id: "demo-tide-letter", published: true }),
    buildPackGame("adventure", { id: "demo-sunless-sea", published: true }),
    buildPackGame("apocalypse", { id: "demo-seventh-dock", published: true })
  ];

  window.EchoQuestData = {
    BASE_STATS,
    GENRES,
    STARTER_PROMPTS,
    LENGTH_OPTIONS,
    PACKS,
    DEFAULT_BACKGROUNDS,
    SAMPLE_GAME,
    DEMO_GAMES,
    buildPackGame,
    createCustomGame
  };
})();
