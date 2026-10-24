/* EchoQuest custom story generator
 * A local, deterministic story synthesizer that turns a player's own premise
 * into the actual playable opening and branch content. No network calls.
 */
(function () {
  "use strict";

  const D = window.EchoQuestData;
  if (!D) return;

  const PLACE_TERMS = [
    "旧图书馆", "图书馆", "钟楼", "学校", "校园", "教室", "宿舍", "礼堂", "操场", "天台",
    "医院", "病房", "列车", "车站", "地铁", "站台", "码头", "港口", "灯塔", "海边", "海滩",
    "酒馆", "酒吧", "书店", "唱片店", "便利店", "咖啡店", "咖啡馆", "酒店", "旅馆", "公寓",
    "公司", "写字楼", "办公室", "工厂", "实验室", "飞船", "空间站", "月球", "火星",
    "小镇", "村庄", "城市", "街道", "教堂", "博物馆", "剧院", "电影院", "森林", "雪山",
    "沙漠", "岛屿", "山洞", "地下室", "仓库", "旧宅", "老宅", "别墅", "学校后门"
  ];

  const RELATIONS = [
    "姐姐", "妹妹", "哥哥", "弟弟", "母亲", "父亲", "妈妈", "爸爸", "好友", "朋友",
    "同学", "同桌", "恋人", "男友", "女友", "妻子", "丈夫", "老师", "师父", "队长",
    "搭档", "同事", "邻居", "辅导员", "班主任"
  ];

  const ROLE_WORDS = [
    "保安", "管理员", "馆员", "老师", "医生", "护士", "店主", "列车员", "司机", "警察",
    "辅导员", "班主任", "守夜人", "研究员", "船长", "队长", "老板", "邻居", "信标维护员",
    "档案员", "售票员"
  ];

  const THEMES = {
    time: {
      label: "时间循环",
      cover: "harbor",
      npcRole: "值夜人",
      truth: "那不是偶然出现在你手里的东西，而是未来的你反复寄回现在的一次求救。每当天亮，这里就会把同一夜重新写一遍。",
      hint: "时间在这里不是向前的。你已经来过，只是不记得。",
      good: "你没有再向未来求救，而是选择在这一次把话说完。循环断在黎明之前，这里第一次拥有了明天。",
      bad: "你留了下来，成为循环的一部分。每到午夜，你都会把同一件东西寄给下一个自己。",
      hidden: "第三道门后，所有版本的你同时抬起头。真正需要被改写的不是结局，而是最初那个不敢说出口的选择。",
      titles: { good: "天亮以前", bad: "第七次循环", hidden: "未寄出的回信" },
      quote: "时间不是一条河，是一封反复投递的信。"
    },
    missing: {
      label: "失踪谜案",
      cover: "harbor",
      npcRole: "守灯人",
      truth: "那个人没有真正离开。Ta 被留在了故事开始的那一夜，而这里一直替所有人保管着没说完的告别。",
      hint: "这里的每一盏灯，都对应一个没有回来的人。",
      good: "你念出那个名字，让 Ta 终于被允许离开。灯灭了一盏，天却亮了。",
      bad: "你选择留下，成为下一盏灯。以后每个迷路的人，都会听见你用 Ta 的声音指路。",
      hidden: "门后是一间没有出口的邮局，所有失踪的人都在里面等一封回信。你终于拿到了属于自己的那封。",
      titles: { good: "把名字还给夜", bad: "留下的人", hidden: "未寄出的回信" },
      quote: "海记得每一个被留下的名字。"
    },
    campus: {
      label: "校园奇谈",
      cover: "forest",
      npcRole: "旧校舍管理员",
      truth: "旧校舍保留着所有学生没有说出口的选择。每到午夜，它会挑选一个人，把同一段遗憾重新播放。",
      hint: "你听见的钟声，不属于现在。",
      good: "你在钟声响起前做出了那个一直不敢做的选择。旧校舍第一次安静下来，走廊尽头出现了一扇真正的门。",
      bad: "你留在了钟声里，成为每一届学生口耳相传的那个名字。",
      hidden: "第三道门后，是所有版本的毕业照。你找到了自己没有站上去的那一张。",
      titles: { good: "放学的回声", bad: "钟声之后", hidden: "没交出的答卷" },
      quote: "有些放学铃，会一直响到你做出选择。"
    },
    romance: {
      label: "未寄情书",
      cover: "romance",
      npcRole: "旧识",
      truth: "那封信不是偶然抵达。它是很多年前没有说出口的话，被这个地方一直保存到现在。",
      hint: "有些人不是离开了，只是把话留在了另一个时间。",
      good: "你替那封旧信写下结尾，也替自己说出了那句没说完的话。雨停时，对方终于回头。",
      bad: "你留在了没有寄出的那封信里，成为别人故事里的一个标点。",
      hidden: "信的最后一行不是告别，而是一个地址。你找到那里，发现写信的人一直在等。",
      titles: { good: "雨停以前", bad: "没有回信的人", hidden: "给明天的信" },
      quote: "没有寄出的那句话，也可以在明天抵达。"
    },
    game: {
      label: "元叙事",
      cover: "neon",
      npcRole: "系统管理员",
      truth: "这不是你第一次进入这个故事。存档里还留着另一个你，已经在这里重复了七次。",
      hint: "注意那些看起来像界面的裂缝。",
      good: "你关掉了唯一能让你重来的存档。屏幕暗下去以前，你听见有人第一次叫出了你真正的名字。",
      bad: "你成为了游戏的一部分，永远停在第 7 次载入的界面。",
      hidden: "第三道门后堆满了废弃存档。你找到最初那一个，里面的人正在等你按下删除。",
      titles: { good: "最后一次登录", bad: "无法存档", hidden: "给玩家的信" },
      quote: "重来不是恩赐，有时只是另一种困住。"
    },
    scifi: {
      label: "深空悬疑",
      cover: "neon",
      npcRole: "信标维护员",
      truth: "讯号来自一个尚未发生的你。它不是求救，而是在提醒你：这次不要再把某个人留在真空里。",
      hint: "光要走很久才能抵达，但后悔不需要。",
      good: "你关闭了循环的信标，让那条讯息第一次真正抵达地球。真空里没有回声，可你听见了回答。",
      bad: "你留在了信标塔里，成为一段不断重复的讯号。",
      hidden: "第三道舱门后，所有未发送的讯息都写着同一个名字。你终于读到了署名是“你”的那一条。",
      titles: { good: "月出之前", bad: "静默轨道", hidden: "第八码" },
      quote: "光要八分钟才抵达，告别也是。"
    },
    apocalypse: {
      label: "废土求生",
      cover: "ash",
      npcRole: "守夜人",
      truth: "广播里的倒计时不是灾难预警，而是这座城市最后一次呼吸。灯灭之前，有人替你争取了七分钟。",
      hint: "在末日里，最危险的不是怪物，是还有人愿意替你留一盏灯。",
      good: "你在倒计时归零前把讯号送了出去。第七码头的灯没有灭，天亮时，所有人都听见了你的声音。",
      bad: "你留在了广播塔里，成为倒计时的一部分。",
      hidden: "第三道闸门后是一间控制室，墙上贴着所有没有寄出的求救讯号。你找到了写给自己妹妹的那一张。",
      titles: { good: "第七码头的黎明", bad: "无人黎明", hidden: "白昼协议" },
      quote: "只要灯还亮着，就还有人记得天亮的样子。"
    },
    adventure: {
      label: "远航冒险",
      cover: "forest",
      npcRole: "老向导",
      truth: "地图尽头没有宝藏，只有一座会复制记忆的岛。所有没能回去的人，都被留在同一场潮汐里。",
      hint: "海图只会记录到过的地方，不会记录想回去的地方。",
      good: "你把星图折成一只纸鸟，让它飞向海图之外。天亮时，你终于看见了那座岛，也看见了等你的船。",
      bad: "你留在了无昼海上，成为下一张海图边缘的注脚。",
      hidden: "第三道石门后，所有未完成的航海日志同时翻开。你找到了父亲留给你的最后一页。",
      titles: { good: "日出之海", bad: "永夜航线", hidden: "世界尽头的水手" },
      quote: "海的尽头不是岛，是你愿意回去的地方。"
    },
    supernatural: {
      label: "灵异怪谈",
      cover: "harbor",
      npcRole: "守门人",
      truth: "这里每七年会选中一个名字留下。你收到的信，是上一个被留下的人写给你的。",
      hint: "不要回答雾里叫你名字的声音。",
      good: "你把信烧在门槛上，让那个名字第一次离开了这里。门外的天亮了，雾也散了。",
      bad: "你留在了门里，成为下一个写信的人。",
      hidden: "第三道门后，是一整面写着名字的墙。你找到了自己的名字，旁边还有一行尚未写完的日期。",
      titles: { good: "天亮以后", bad: "守门人", hidden: "墙上的名字" },
      quote: "不是所有回声，都来自你认识的人。"
    },
    mystery: {
      label: "都市谜案",
      cover: "harbor",
      npcRole: "知情人",
      truth: "你写下的那个开端，并不是第一次发生。这个地方把同一夜重复了很多年，直到有人愿意问出正确的问题。",
      hint: "所有人都在说同一句谎话，只是版本不同。",
      good: "你问出了那个所有人都在回避的问题。天亮时，这个地方第一次给出了不一样的答案。",
      bad: "你留在了这个故事里，成为下一个替他们保守秘密的人。",
      hidden: "第三道门后，所有版本的真相被钉在墙上。你找到了自己写下的那一页。",
      titles: { good: "天亮以后", bad: "知情的人", hidden: "第三封信" },
      quote: "真相不是答案，是终于有人愿意问出口。"
    }
  };

  function clip(text, max) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > max ? value.slice(0, max).replace(/[，。；、！？!?]$/, "") + "…" : value;
  }

  function stripEnd(text) {
    return String(text || "").replace(/[。！？!?；;，,\s]+$/g, "").trim();
  }

  function toSecondPerson(text) {
    return String(text || "")
      .replace(/我们/g, "你们")
      .replace(/我的/g, "你的")
      .replace(/我/g, "你");
  }

  function sentence(text) {
    const cleanText = stripEnd(toSecondPerson(text));
    return cleanText ? cleanText + "。" : "";
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function findPlaces(text) {
    const found = [];
    PLACE_TERMS.forEach((term) => {
      let index = text.indexOf(term);
      while (index !== -1) {
        found.push({ term: term, index: index, end: index + term.length });
        index = text.indexOf(term, index + term.length);
      }
    });
    found.sort((a, b) => a.index - b.index || b.term.length - a.term.length);
    const selected = [];
    found.forEach((item) => {
      if (selected.some((existing) => item.index >= existing.index && item.end <= existing.end)) return;
      selected.push(item);
    });
    return selected.map((item) => item.term);
  }

  function detectTheme(text, genre) {
    if (/游戏|存档|登录|副本|玩家|NPC|读档|系统提示/.test(text)) return "game";
    if (/时间|未来|十年后|十年前|七年后|七年前|循环|重来|回到过去|钟楼|钟声|倒转/.test(text)) return "time";
    if (/失踪|消失|不见|去世|死了|死亡|遗体/.test(text)) return "missing";
    if (/鬼|灵异|诅咒|附身|镜子|噩梦|闹鬼|纸人|午夜/.test(text)) return "supernatural";
    if (/暗恋|告白|情书|喜欢|恋人|重逢|失恋|婚约/.test(text)) return "romance";
    if (/飞船|月球|火星|星球|星际|外星|AI|人工智能|机器人|空间站|信号/.test(text)) return "scifi";
    if (/末日|废土|丧尸|灾难|避难|辐射|停电|灾变/.test(text)) return "apocalypse";
    if (/宝藏|航海|海图|岛屿|探险|遗迹|远航|船长/.test(text)) return "adventure";
    if (/学校|校园|教室|学生|考试|毕业|社团|老师/.test(text)) return "campus";
    if (genre === "scifi") return "scifi";
    if (genre === "apocalypse") return "apocalypse";
    if (genre === "romance") return "romance";
    if (genre === "adventure") return "adventure";
    if (genre === "suspense") return "mystery";
    return "mystery";
  }

  function derivePlace(text, places, pack, theme) {
    const direct = text.match(/(?:在|回到|来到|进入|走进|站在|位于|赶往|前往)([^，。；！？]{2,24}?)(?:里|中|内|外|上|门口|的时候|收到|发现|遇到|遇见|醒来|看见|准备|等)/);
    let candidate = direct && direct[1] ? direct[1].replace(/^(一个|一座|一间|那条|那条|这家|那家)/, "").trim() : "";
    if (candidate && !PLACE_TERMS.some((term) => candidate.includes(term))) candidate = "";
    if (!candidate && places.length) candidate = places[0];
    if (!candidate) {
      const themePlaces = {
        game: "废弃游戏 · 第七区",
        time: "旧城区 · 钟楼街",
        missing: "海边小镇 · 旧码头",
        campus: "学校 · 旧校舍",
        romance: "海边小镇 · 旧车站",
        scifi: "静海站 · 三号舱门",
        apocalypse: "第七码头 · 北闸门",
        adventure: "断桅港 · 旧栈桥",
        supernatural: "旧城 · 雾巷",
        mystery: "旧城区 · 档案馆街"
      };
      candidate = themePlaces[theme] || pack.world || "旧城";
    }
    return clip(candidate, 24);
  }

  function deriveLandmark(text, place, places, theme) {
    const genericAreas = /^(小镇|村庄|城市|街道|海边|海滩|森林|雪山|沙漠|岛屿|学校|校园)$/;
    const other = places.find((item) => !place.includes(item) && item.length > 1 && !genericAreas.test(item));
    if (other) return other;
    if (/钟楼|钟声/.test(text)) return "旧钟楼";
    if (/灯塔/.test(text)) return "旧灯塔";
    if (/图书馆|书库/.test(place)) return "图书馆地下书库";
    if (/学校|校园|教室|宿舍/.test(place)) return "旧校舍钟楼";
    if (/医院|病房/.test(place)) return "停用的旧住院楼";
    if (/列车|车站|地铁|站台/.test(place)) return "终点站废弃站台";
    if (/海|码头|港|岛/.test(place)) return "废弃灯塔";
    if (/飞船|空间站|月球|火星/.test(place)) return "失联的信标塔";
    if (/公司|写字楼|办公室/.test(place)) return "顶层废弃会议室";
    if (/小镇|村庄|城市/.test(place)) return "山后的旧教堂";
    const fallback = {
      time: "旧钟楼",
      missing: "废弃灯塔",
      campus: "旧校舍钟楼",
      romance: "白鲸灯塔",
      game: "最终关卡入口",
      scifi: "失联信标塔",
      apocalypse: "旧广播塔",
      adventure: "沉钟灯塔",
      supernatural: "旧教堂",
      mystery: "旧档案馆"
    };
    return fallback[theme] || "旧档案馆";
  }

  function deriveUnderplace(place, landmark) {
    const all = place + landmark;
    if (/图书馆|书库/.test(all)) return "旧书库的夹层";
    if (/学校|校园|教室|宿舍/.test(all)) return "旧校舍地下档案室";
    if (/医院|病房/.test(all)) return "停用的旧病区";
    if (/列车|车站|地铁|站台/.test(all)) return "废弃站台下层";
    if (/海|码头|港|岛|灯塔/.test(all)) return "潮线下的旧船坞";
    if (/公司|写字楼|办公室/.test(all)) return "地下一层的旧机房";
    if (/飞船|空间站|月球|火星/.test(all)) return "失联舱段";
    return landmark + "地下";
  }

  function deriveMeetingPlace(text, place, places) {
    const shop = places.find((item) => /店|馆|吧|站/.test(item) && item !== place);
    if (shop) return shop;
    const base = /学校|校园/.test(place) ? "学校" : place.replace(/^(旧|老)/, "").split(" · ").pop();
    return base + "后门那间还亮着灯的店";
  }

  function deriveTime(text) {
    const night = ["暴雨夜", "雨夜", "雪夜", "深夜", "午夜", "凌晨", "清晨", "黄昏", "傍晚", "夜里"]
      .find((word) => text.includes(word));
    if (night) return night;
    if (/白天|中午|下午/.test(text)) return "白天";
    return "深夜";
  }

  function deriveWeather(text, pack) {
    if (/暴雨/.test(text)) return "暴雨，雨声盖住了所有脚步";
    if (/下雨|雨夜|雨/.test(text)) return "雨，一直没有停";
    if (/雪/.test(text)) return "雪落得很轻，像有人在远处屏住呼吸";
    if (/雾/.test(text)) return "雾，能见度很低";
    if (/风/.test(text)) return "风从很远的地方吹来";
    return pack.weather || "天色比往常暗得更早";
  }

  function deriveEra(text, pack) {
    const year = text.match(/(?:19|20|21)\d{2}\s*年/);
    if (year) return year[0].replace(/\s+/g, " ");
    if (/未来|星际|太空|月球|火星/.test(text)) return "近未来";
    if (/末世|末日|废土|灾变/.test(text)) return "灾变之后";
    if (/民国/.test(text)) return "民国";
    if (/古代|王朝|江湖/.test(text)) return "古代";
    if (/高中|大学|校园|毕业/.test(text)) return "当代 · 校园";
    return pack.era || "当代";
  }

  function deriveObject(text, pack, themeKey) {
    const objectNouns = /信|邮件|短信|讯息|消息|明信片|照片|相片|卡片|钥匙|日记|笔记|本子|录音|磁带|硬盘|芯片|地图|海图|唱片|怀表|手表|徽章|邀请函|门票|车票|船票|手机|信号|广播/;
    const matches = Array.from(text.matchAll(/(一[封张枚把本部件段条只个盘盒沓][^，。；！？]{1,26})/g));
    let raw = "";
    for (const match of matches) {
      if (objectNouns.test(match[1])) {
        raw = match[1];
        break;
      }
    }
    if (!raw) {
      const keyword = text.match(/(求救信号|信号|明信片|信件|信|照片|相片|钥匙|日记|录音|地图|海图|唱片|怀表|徽章|邀请函|门票|车票|船票|手机|芯片|磁带|硬盘|广播)/);
      if (keyword) raw = keyword[0];
    }
    if (!raw) {
      const themeObjects = {
        game: "一张写着测试编号的工牌",
        scifi: "一枚旧船员徽章",
        campus: "一张被折过的纸条",
        romance: "一张没有寄出的明信片",
        apocalypse: "一枚辐射计数器",
        adventure: "一张折过很多次的航海图",
        supernatural: "一张写着名字的纸条",
        mystery: "一封没有落款的信"
      };
      raw = themeObjects[themeKey] || pack.object;
    }
    raw = raw
      .replace(/^一[封张枚把本部件段条只个盘盒沓]/, "")
      .replace(/^来自(.{1,12})的自己的/, "来自$1的")
      .replace(/^自己的/, "");
    raw = clip(raw, 18);
    const name = raw || pack.object;
    let ref = "那件东西";
    if (/信号|广播|录音|磁带|硬盘|芯片/.test(name)) ref = "那段信号";
    else if (/明信片|照片|相片|卡片/.test(name)) ref = "那张照片";
    else if (/信(?!号)|邮件|短信|讯息|消息/.test(name)) ref = "那封信";
    else if (/钥匙/.test(name)) ref = "那把钥匙";
    else if (/邀请函|门票|车票|船票/.test(name)) ref = "那张票";
    else if (/日记|笔记|本子|纸条/.test(name)) ref = "那张纸";
    else if (/地图|海图/.test(name)) ref = "那张地图";
    else if (/唱片/.test(name)) ref = "那张唱片";
    else if (/怀表|手表|钟/.test(name)) ref = "那只表";
    else if (/工牌/.test(name)) ref = "那张工牌";
    return { name: name, full: name, ref: ref };
  }

  function deriveClue(objectInfo) {
    if (/信号|广播|录音|磁带|硬盘|芯片/.test(objectInfo.name)) return { name: "第 07 秒的杂音", desc: "录音里反复出现同一段被压低的呼吸声。", marker: "第三码，回讯窗口" };
    if (/明信片|照片|相片|卡片/.test(objectInfo.name)) return { name: "照片背面的字", desc: "照片背面写着一行被水晕开的地址。", marker: "旧钟楼，第三级台阶" };
    if (/信(?!号)|邮件|短信|讯息|消息/.test(objectInfo.name)) return { name: "夹层里的纸条", desc: "从信纸夹层里抽出的薄纸，边缘有一串坐标。", marker: "第三道门，天亮以前" };
    if (/钥匙/.test(objectInfo.name)) return { name: "钥匙齿缝里的地址", desc: "钥匙齿缝里卡着一小片写着门牌号的纸。", marker: "最后一道门，只开一次" };
    if (/日记|笔记/.test(objectInfo.name)) return { name: "被撕掉的那一页", desc: "日记本只剩下一道撕痕，和页脚留下的时间。", marker: "凌晨三点零七分" };
    if (/工牌|徽章/.test(objectInfo.name)) return { name: "工牌背面的登录码", desc: "工牌背面印着一串不属于当前版本的用户编号。", marker: "第七次载入，03:07" };
    return { name: clip(objectInfo.name + "上的刻痕", 16), desc: "物件表面有一道新刻下的痕迹，指向下一个地点。", marker: "第三道门，天亮以前" };
  }

  function deriveTitle(text, explicitTitle, P, pack) {
    if (explicitTitle && explicitTitle.trim()) return explicitTitle.trim();
    const letter = text.match(/来自([^，。；！？]{2,12}?)的(信|讯息|消息|邮件|录音|包裹|邀请函|明信片)/);
    if (letter) return "来自" + letter[1].replace(/的?自己$/, "").replace(/的$/, "") + "的" + letter[2];
    const whenLetter = text.match(/(十年前|十年后|七年前|七年后|未来|过去)[^，。；！？]{0,8}(信|讯息|消息|录音)/);
    if (whenLetter) return whenLetter[1] + "来信";
    if (P.place && P.timeHint && !/深夜|白天/.test(P.timeHint)) {
      const placeShort = P.place.split(" · ").pop();
      if (placeShort.length <= 10) return clip(P.timeHint + "的" + placeShort, 16);
    }
    const objectName = P.object || "";
    if (/信号|广播/.test(objectName) && P.place) return clip(P.place.split(" · ").pop() + "讯号", 16);
    if (objectName.length >= 3 && objectName.length <= 13 && !/^(一封信|一把钥匙|一张照片)$/.test(objectName)) {
      if (/信|录音|照片|钥匙|日记|地图|唱片/.test(objectName)) return objectName;
    }
    const keywordTitles = [
      [/钟楼|钟声/, "钟楼以北"],
      [/图书馆|书库/, "闭馆之后"],
      [/列车|地铁|车站/, "末班车之后"],
      [/学校|校园|毕业/, "放学后的回声"],
      [/游戏|存档|登录/, "第七次登录"],
      [/海|岛|码头/, "潮汐未寄"],
      [/雪/, "雪停以前"],
      [/梦/, "醒来以前"]
    ];
    for (const pair of keywordTitles) {
      if (pair[0].test(text)) return pair[1];
    }
    if (P.place) return clip(P.place.split(" · ").pop() + "的夜", 14);
    return pack.title;
  }

  function extractNames(text) {
    const names = [];
    const patterns = [
      /(?:名叫|叫做|叫(?!出|住|醒|来|去|你|我|他|她))\s*([\u4e00-\u9fa5]{2,3})/g,
      /(?:姐姐|妹妹|哥哥|弟弟|母亲|父亲|好友|朋友|同学|同桌|恋人|男友|女友|妻子|丈夫|老师|师父|队长|搭档|同事|邻居|辅导员|班主任)[（(]([\u4e00-\u9fa5]{2,3})[）)]/g
    ];
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) names.push(match[1]);
      }
    });
    return unique(names);
  }

  function analyzePremise(raw, genre) {
    const text = String(raw || "").replace(/\s+/g, " ").trim();
    const pack = D.PACKS[genre] || D.PACKS.suspense;
    const sentences = text.split(/[。！？!?；;\n]+/).map((item) => item.trim()).filter(Boolean);
    const themeKey = detectTheme(text, genre);
    const theme = THEMES[themeKey] || THEMES.mystery;
    const places = findPlaces(text);
    const place = derivePlace(text, places, pack, themeKey);
    const landmark = deriveLandmark(text, place, places, themeKey);
    const meetingPlace = deriveMeetingPlace(text, place, places);
    const underplace = deriveUnderplace(place, landmark);
    const objectInfo = deriveObject(text, pack, themeKey);
    const clue = deriveClue(objectInfo);
    const timeHint = deriveTime(text);
    const weather = deriveWeather(text, pack);
    const era = deriveEra(text, pack);
    const names = extractNames(text);
    const lossMatch = text.match(/(姐姐|妹妹|哥哥|弟弟|母亲|父亲|妈妈|爸爸|好友|朋友|同学|同桌|恋人|男友|女友|妻子|丈夫|老师|师父|队长|搭档|同事|邻居)[^，。；！？]{0,22}(?:失踪|消失|不见|去世|死了|死亡|离开)/);
    const passedMatch = text.match(/(?:已故|去世的|死去的|故去的)(姐姐|妹妹|哥哥|弟弟|母亲|父亲|妈妈|爸爸|好友|朋友|同学|同桌|恋人|男友|女友|妻子|丈夫|老师|师父|队长|搭档|同事|邻居)/);
    const lostRelation = lossMatch ? lossMatch[1] : (passedMatch ? passedMatch[1] : "");
    const protagonistMatch = text.match(/我(?:是|是一名|是一个|作为|成了|曾是一名)([^。，；！？]{2,20})/);
    const protagonistRole = protagonistMatch ? protagonistMatch[1].replace(/^(一名|一个|位)/, "").trim() : "旅人";

    let npc = names[0] || "";
    let ally = names[1] || "";
    const npcRole = theme.npcRole;
    if (!npc) npc = npcRole;
    if (!ally) {
      const usableRelation = RELATIONS.find((relation) => relation !== lostRelation && text.includes(relation));
      ally = usableRelation || "旧友";
    }
    if (ally === npc) ally = "旧友";
    const lost = lostRelation || "";
    const subject = lost || (themeKey === "time" ? "未来的你" : themeKey === "romance" ? "写信的人" : "没有留下名字的人");
    const subjectRole = lost ? "失踪者" : themeKey === "time" ? "来自未来的人" : themeKey === "romance" ? "写信的人" : "故事里的失踪者";
    const subjectVoice = lost || "一个陌生";

    const warningSentence = sentences.find((item) => /不要|别|千万|必须|不能|记得|小心/.test(item));
    const fallbackWarnings = {
      time: `别让${landmark}的灯替你选名字。`,
      missing: `别在${landmark}的灯熄灭前回头。`,
      campus: "别在午夜钟声后回应任何人。",
      romance: "别在雨停前打开那封没有署名的信。",
      game: "别让最后一次存档覆盖你。",
      scifi: "别在信标塔的灯熄灭前回应那条讯号。",
      apocalypse: "天亮之前，别让广播塔的灯灭。",
      adventure: "别跟着海图走进第七道潮线。",
      supernatural: "别回应雾里叫你名字的声音。",
      mystery: `别让${objectInfo.ref}离开你的视线。`
    };
    const warning = warningSentence
      ? clip(stripEnd(toSecondPerson(warningSentence)), 56)
      : (fallbackWarnings[themeKey] || `别让${objectInfo.ref}把${place}的同一夜带回来。`);
    const eventSentence = sentences.find((item, index) => index > 0 && /收到|发现|看见|遇到|听见|失踪|消失|死|响|醒|开始|必须|来/.test(item)) || sentences[1] || sentences[0] || "";
    const coreEvent = clip(stripEnd(toSecondPerson(eventSentence)), 40);
    const firstParagraphs = sentences.slice(0, 2).map(sentence);
    const openingOne = firstParagraphs[0] || `${place}的夜比往常更安静。`;
    const openingTwo = firstParagraphs[1] || `你还没有想好该从哪里开始，关于${objectInfo.ref}的一切就已经找上了你。`;
    const objectAction = /信号|广播|录音|磁带|硬盘|芯片/.test(objectInfo.name)
      ? `你把${objectInfo.ref}重新播放了一遍。`
      : /明信片|照片|相片|卡片/.test(objectInfo.name)
        ? `你翻过${objectInfo.ref}，指尖停在背面。`
        : `你低头看向${objectInfo.ref}。`;
    const objectState = /信号|广播|录音|磁带|硬盘|芯片/.test(objectInfo.name)
      ? `${objectInfo.ref}在你耳边反复回响`
      : `${objectInfo.ref}在你手里发烫`;

    const title = deriveTitle(text, "", { place: place, timeHint: timeHint, object: objectInfo.name }, pack);
    const subtitle = clip(warning || theme.quote, 44);

    return {
      raw: text,
      sentences: sentences,
      themeKey: themeKey,
      theme: theme,
      pack: pack,
      place: place,
      landmark: landmark,
      landmarkShort: landmark.replace(/^旧/, "").split(" · ").pop(),
      underplace: underplace,
      meetingPlace: meetingPlace,
      startLocation: place,
      initialTime: "第 1 天 · " + timeHint,
      timeHint: timeHint,
      weather: weather,
      era: era,
      object: objectInfo.name,
      objectRef: objectInfo.ref,
      objectAction: objectAction,
      objectState: objectState,
      objectDesc: "你故事里的关键物件：" + objectInfo.name + "。它比你以为的更旧，也更重。",
      clueItem: clue.name,
      clueDesc: clue.desc,
      clueMarker: clue.marker,
      warning: warning,
      coreEvent: coreEvent,
      npc: npc,
      npcRole: npcRole,
      ally: ally,
      allyRole: RELATIONS.includes(ally) ? "唯一还愿意相信你的人" : "旧友",
      lost: lost,
      subject: subject,
      subjectRole: subjectRole,
      subjectVoice: subjectVoice,
      protagonistRole: protagonistRole,
      title: title,
      subtitle: subtitle,
      openingOne: openingOne,
      openingTwo: openingTwo,
      tokenItem: themeKey === "campus" ? "一枚旧校徽" : themeKey === "scifi" ? "一枚旧船员徽章" : "一张旧车票",
      answerItem: /信/.test(objectInfo.name) ? "另一半信纸" : "被藏起来的另一半",
      boundary: "最后一道门"
    };
  }

  function deriveCover(P) {
    const placeText = P.place + " " + P.landmark;
    if (/学校|校园|教室|图书馆|钟楼|宿舍|礼堂/.test(placeText)) return "clocktower";
    if (/海|港|码头|岛|灯塔/.test(placeText)) return "harbor";
    if (P.themeKey === "game" || P.themeKey === "scifi" || /游戏|飞船|空间站|月球|火星|霓虹|城市/.test(placeText)) return "neon";
    if (P.themeKey === "apocalypse" || /废土|末日|灾变|辐射/.test(P.raw)) return "ash";
    if (P.themeKey === "romance") return "romance";
    if (/森林|山|村庄|岛/.test(placeText) || P.themeKey === "adventure") return "forest";
    return P.theme.cover || P.pack.cover;
  }

  function buildCharacters(P) {
    const initial = (name) => /^[\u4e00-\u9fa5]/.test(name) ? name.slice(0, 1) : "?";
    return [
      {
        name: P.npc,
        role: P.npc === P.npcRole ? "知道这里发生过什么的人" : P.npcRole,
        tone: "stranger",
        initial: initial(P.npc),
        desc: `你在${P.place}遇见的${P.npcRole}。Ta 似乎早就知道${P.objectRef}会把你带到这里。`
      },
      {
        name: P.ally,
        role: P.ally === "旧友" ? "唯一还愿意相信你的人" : P.allyRole,
        tone: "ally",
        initial: initial(P.ally),
        desc: `唯一愿意相信你的人。Ta 知道${P.coreEvent || P.place}并不像表面上那么简单。`
      },
      {
        name: P.subject,
        role: P.subjectRole,
        tone: "ghost",
        initial: initial(P.subject),
        desc: `与${P.objectRef}和${P.landmark}有关的名字。所有线索最终都指向 Ta。`
      }
    ];
  }

  function buildItemLibrary(P) {
    const library = {};
    library[P.object] = P.objectDesc;
    library[P.clueItem] = P.clueDesc;
    library[P.tokenItem] = "从故事开始之前就留在你口袋里的东西，也许能换来一次见面的机会。";
    library[P.answerItem] = "藏在另一个版本的故事里，和你的记忆严丝合缝。";
    library["潮湿的火柴"] = "一枚被雨气泡软的火柴盒，也许还能点燃一次。";
    return library;
  }

  function buildCustomNodes(P, options) {
    const endingCount = options.endingCount === 1 ? 1 : 3;
    const statsEnabled = options.statsEnabled !== false;
    const hiddenLock = statsEnabled && endingCount > 1
      ? { stat: "insight", min: 3, label: "需要至少 3 条线索" }
      : null;

    const n0 = {
      id: "n0",
      chapter: "序章",
      title: P.title,
      location: P.startLocation,
      time: P.initialTime,
      weather: P.weather,
      text: [
        P.openingOne,
        P.openingTwo,
        `${P.objectAction}${P.warning ? "脑海里又响起那句话：**“" + P.warning + "”**。" : "它比任何时候都更像一个答案。"}远处，${P.landmark}的灯亮了一瞬。`
      ],
      echo: [
        `你沿着${P.startLocation}多走了几步。脚下的声音空得不像是现实。`,
        `风里混着旧纸和雨水的味道。远处，${P.landmark}又亮了一次。`
      ],
      choices: [
        {
          id: "c0-1",
          text: `前往${P.landmark}，确认那里究竟发生了什么`,
          note: "那盏灯不应该亮着",
          to: "n1",
          effects: { hp: -3, insight: 1 },
          keywords: ["前往", "去", "灯塔", P.landmarkShort, "看看"]
        },
        {
          id: "c0-2",
          text: `先去找${P.ally}，问清${P.lost || "这件事"}的来龙去脉`,
          note: "有人比你更早知道答案",
          to: "n2",
          effects: { bond: 1, items: [P.tokenItem] },
          keywords: ["找", "问", P.ally, "打听"]
        },
        {
          id: "c0-3",
          text: `在灯下重新检查${P.objectRef}`,
          note: "答案可能藏在最薄的地方",
          to: "n3",
          effects: { hp: -4, insight: 2, items: [P.clueItem] },
          keywords: ["检查", "打开", "拆", "信", "照片", "钥匙", "看"]
        }
      ]
    };

    const n1 = {
      id: "n1",
      chapter: "第一章",
      title: "不眠的" + P.landmarkShort,
      location: P.landmark + " · 入口",
      time: "第 1 天 · 深夜",
      weather: P.weather,
      text: [
        `${P.landmark}比你记忆中更旧。${P.place}的光从背后照过来，在地上拖出一条很长的影子。`,
        `你在入口遇见了${P.npc}${P.npc !== P.npcRole ? "，" + P.npcRole : ""}。Ta 看见你手里的${P.objectRef}，没有惊讶，只说：“你终于来了。有人在等你。”`,
        `${P.npc}侧过身。门后传来一声很轻的响动，像有人把另一个夜晚藏了起来。`
      ],
      echo: [
        "你伸手触碰门，指尖传来一阵细微的震动。门后有什么在呼吸，缓慢而潮湿。",
        `${P.npc}没有看你，视线越过你的肩膀落向远处。那里什么都没有，只有${P.theme.hint}`
      ],
      choices: [
        {
          id: "c1-1",
          text: `跟${P.npc}一起走进${P.landmark}`,
          note: "先把信物交给一个知道它来历的人",
          to: "n4",
          effects: { insight: 1, bond: 2 },
          keywords: ["跟", "进去", "相信", P.npc, "一起"]
        },
        {
          id: "c1-2",
          text: `绕到${P.landmark}背面，寻找另一条入口`,
          note: "风把某扇窗吹开了一条缝",
          to: "n4",
          effects: { hp: -5, insight: 1 },
          keywords: ["绕", "背面", "入口", "窗", "后面"]
        },
        {
          id: "c1-3",
          text: `听见${P.ally}在远处叫你，先转身回去`,
          note: "那个声音比门后的响动更急",
          to: "n2",
          effects: { hp: -4, bond: -1 },
          keywords: ["声音", "回去", "转身", P.ally]
        }
      ]
    };

    const n2 = {
      id: "n2",
      chapter: "第一章",
      title: "还亮着灯的地方",
      location: P.meetingPlace,
      time: "第 1 天 · 午夜",
      weather: "雨点开始敲打窗棂",
      text: [
        `${P.meetingPlace}里只剩下${P.ally}。Ta 把一张写着地址的纸推到你面前。`,
        `“${P.coreEvent || P.objectRef}不是偶然。”${P.ally}压低声音，“${P.theme.hint}”`,
        `Ta 用指尖压住纸角：“你要找的答案在${P.underplace}。不过先说好——看见什么都不许喊。”`
      ],
      echo: [
        "你把四周环视一圈。墙角有一张桌子，桌上两只杯子，一只早已凉透，另一只还在冒热气。",
        `${P.ally}把纸往你手边推近了一点。Ta 的指甲缝里有一小片暗红色的漆。`
      ],
      choices: [
        {
          id: "c2-1",
          text: `跟${P.ally}去${P.underplace}`,
          note: "Ta 知道那扇门后面有什么",
          to: "n5",
          effects: { hp: -8, insight: 1, items: [P.tokenItem] },
          keywords: ["跟", "去", P.ally, "地下", "仓库", "档案"]
        },
        {
          id: "c2-2",
          text: `先去${P.landmark}找${P.npc}对质`,
          note: "让两个说谎的人见一面",
          to: "n4",
          effects: { bond: 2 },
          keywords: ["去", "找", P.npc, "对质", "当面"]
        }
      ]
    };

    const n3 = {
      id: "n3",
      chapter: "第一章",
      title: "藏在里面的第二层",
      location: P.startLocation + " · 灯下",
      time: "第 1 天 · 深夜",
      weather: P.weather,
      text: [
        `你重新检查${P.objectRef}，在边缘摸到一道几乎看不见的接缝。它比故事本身更像一个人刻意留下的入口。`,
        `里面是${P.clueItem}。上面写着：**“${P.clueMarker}”**。`,
        `你抬头。${P.ally}站在不远处，像已经等了很久。`
      ],
      echo: [
        "你把发现的纸条举到灯下，纸背透出几道极浅的压痕，像一张被反复折叠过的地图。",
        `${P.ally}的背影停了一瞬。Ta 没有回头，只抬起手，朝${P.landmark}的方向指了指。`
      ],
      choices: [
        {
          id: "c3-1",
          text: `按${P.clueItem}上的标记，前往${P.landmark}`,
          note: "先弄清那盏灯为什么亮起",
          to: "n4",
          effects: { insight: 1 },
          keywords: ["标记", "去", P.landmark, "走"]
        },
        {
          id: "c3-2",
          text: `追上${P.ally}，去${P.underplace}`,
          note: "Ta 显然知道下一层答案",
          to: "n5",
          effects: { hp: -2, insight: 1 },
          keywords: ["追", "跟上", P.ally, "去"]
        }
      ]
    };

    const n4 = {
      id: "n4",
      chapter: "第二章",
      title: P.landmarkShort + "里的真相",
      location: P.landmark + " · 深处",
      time: "第 2 天 · 凌晨",
      weather: "四周安静得能听见自己的心跳",
      text: [
        `${P.landmark}深处，${P.npc}把${P.objectRef}放进一个你从未注意过的凹槽。墙壁里传来漫长的一声叹息。`,
        `“${P.theme.truth}”${P.npc}说。`,
        `${P.npc}把一样东西推到你面前：${P.clueItem}。上面的时间停在你收到${P.objectRef}的那一刻，一秒不差。`
      ],
      echo: [
        "你看向四周，墙上浮出许多被划掉的名字。等你眨眼，那些痕迹又像从未存在过。",
        `${P.npc}的手一直按在凹槽上，指节发白。Ta 看起来不像在撒谎，更像是在害怕什么被打开。`
      ],
      choices: [
        {
          id: "c4-1",
          text: "“把真相告诉我。剩下的路我自己走。”",
          note: "选择相信一个曾经隐瞒的人",
          to: "n7",
          effects: { insight: 1, bond: 1 },
          keywords: ["信", "相信", "自己走", P.npc, "真相"]
        },
        ...(endingCount > 1 ? [{
          id: "c4-2",
          text: `趁 Ta 不备，独自闯进${P.landmark}最深处`,
          note: "那里面有人在叫你的名字",
          to: "e2",
          effects: { hp: -12 },
          keywords: ["独自", "闯", "进去", "深处", "禁地"]
        }] : [])
      ]
    };

    const n5 = {
      id: "n5",
      chapter: "第二章",
      title: P.underplace,
      location: P.underplace,
      time: "第 2 天 · 凌晨",
      weather: "铁皮屋顶上积着冷雨",
      text: [
        `${P.underplace}里没有别的出口，只有一面写满名字的墙。最上面一行是${P.subject}，最后一行的墨迹还没有干。`,
        `${P.ally}踢开脚边的缆绳：“每个名字，都是被留在这里的人。${P.subject}只是其中之一。”Ta 拉开油布——下面躺着${P.npc}。可你半小时前才见过 Ta。`,
        `你蹲下，在名字的最后一行看见了自己。`
      ],
      echo: [
        "你伸手触碰墙上的字。有些已经发黑，有些像刚刚写上去。最底下一行被水泡得模糊，只能辨认出一个“你”字。",
        `被绑着的${P.npc}睁着眼睛。Ta 不能说话，却用视线一遍遍指向天花板上的那盏灯。`
      ],
      choices: [
        {
          id: "c5-1",
          text: `割断绳子，救下${P.npc}`,
          note: "Ta 的手腕上有一圈旧灯绳的勒痕",
          to: "n7",
          effects: { hp: -10, insight: 2, bond: 1, items: [P.answerItem] },
          keywords: ["救", "绳子", "割", P.npc, "松开"]
        },
        ...(endingCount > 1 ? [{
          id: "c5-2",
          text: `点燃${P.underplace}，逼“外面那个${P.npc}”现身`,
          note: "火会照亮一些藏起来的东西",
          to: "e2",
          effects: { hp: -6 },
          keywords: ["火", "点燃", "烧", "逼", "仓库"]
        }] : [])
      ]
    };

    const n7 = {
      id: "n7",
      chapter: "终章",
      title: "回信以前",
      location: P.landmark + " · 边界",
      time: "第 3 天 · 天亮以前",
      weather: P.weather,
      text: [
        `约定的时间到了。${P.landmark}的灯开始一盏接一盏地熄灭。${P.objectState}。`,
        `${P.npc}站在${P.boundary}外，没有阻止你。远处，${P.ally}举起了那盏一直没点亮的灯。`,
        `你听见${P.subjectVoice}的声音从很深的地方传来：“不要回头。天亮之前，选一个你愿意留下的名字。”`
      ],
      echo: [
        "你向下走了几步。石阶上刻满了名字，每走一步，就有一个名字在脚下亮起，又在身后熄灭。",
        "四周安静得不像现实。你听见自己的心跳，和很远的地方传来的、另一个人的呼吸。"
      ],
      choices: [
        ...(endingCount > 1 ? [{
          id: "c7-1",
          text: `交出${P.objectRef}，让${P.landmark}的循环停止`,
          note: "用一个名字，换所有人的安宁",
          to: "e2",
          effects: { hp: -10 },
          keywords: ["交出", "给", "停止", "放弃", "留下"]
        }] : []),
        {
          id: "c7-2",
          text: `念出${P.lost || "那个名字"}，走向${P.boundary}`,
          note: "也许告别不是把 Ta 留下",
          to: "e1",
          effects: { insight: 1 },
          keywords: ["念", "名字", "走向", "告别", "离开"]
        },
        ...(endingCount > 1 ? [{
          id: "c7-3",
          text: `沿着第三道石阶，走进${P.landmark}地下`,
          note: "你听见了第三个声音",
          to: "e3",
          requires: hiddenLock,
          keywords: ["第三", "石阶", "地下", "走下去", "台阶"]
        }] : [])
      ]
    };

    const endingNodes = {
      e1: {
        id: "e1",
        chapter: "结局 · " + P.theme.titles.good,
        title: P.theme.titles.good,
        location: P.landmark + " · 门外",
        time: "第 3 天 · 黎明",
        weather: "天光很低，风终于停了",
        isEnding: true,
        endingType: "good",
        endingTitle: P.theme.titles.good,
        endingQuote: P.theme.quote,
        text: [
          `你把${P.objectRef}留在${P.landmark}，没有回头。${P.theme.good}`,
          `${P.npc}站在出口，手里那盏灯终于亮了。Ta 朝你点了一下头，像是在替谁告别。`,
          `后来，${P.place}的人说，那之后的夜终于安静了。只有${P.ally}偶尔还会去${P.meetingPlace}，替一个不会再出现的人留一盏灯。`
        ],
        echo: [
          "你听见身后传来一声很轻的回响，像有人在很深的地方合上了一本书。",
          "天光落下来。你知道，这一次故事真的走到了尽头。"
        ],
        choices: []
      }
    };

    if (endingCount > 1) {
      endingNodes.e2 = {
        id: "e2",
        chapter: "结局 · " + P.theme.titles.bad,
        title: P.theme.titles.bad,
        location: P.landmark,
        time: "第 3 天 · 天亮以前",
        weather: "无风，无雾，无声",
        isEnding: true,
        endingType: "bad",
        endingTitle: P.theme.titles.bad,
        endingQuote: "有些故事不会结束，只会换一个人继续。",
        text: [
          `你选择让${P.objectRef}留在${P.landmark}。${P.theme.bad}`,
          `天亮时，${P.place}的人照常生活。没有人记得你。只有${P.ally}偶尔会在${P.meetingPlace}留一盏灯，等一个不会再出现的人。`,
          `每隔七年，你会听见有人在${P.place}喊一个名字。你不能回答；你只能把灯点亮，等下一个走近的人。`
        ],
        echo: [
          "你想不起自己的名字了。只记得有一封信，信封上是雨水的味道。",
          `灯亮着。四周很安静。你终于明白，为什么${P.npc}从不在夜里点灯。`
        ],
        choices: []
      };
      endingNodes.e3 = {
        id: "e3",
        chapter: "隐藏结局 · " + P.theme.titles.hidden,
        title: P.theme.titles.hidden,
        location: P.landmark + " · 地下",
        time: "时间在这里失效",
        weather: "所有未寄出的信在头顶飘动",
        isEnding: true,
        endingType: "hidden",
        endingTitle: P.theme.titles.hidden,
        endingQuote: P.theme.quote,
        text: [
          `第三道石阶通向${P.landmark}地下。${P.theme.hidden}`,
          `你看见${P.subject}坐在那里，像这三年什么也没发生。“你来得比我想的早。”Ta 把${P.objectRef}的另一半推给你。`,
          `你醒来时，躺在${P.landmark}外的地上，手里攥着${P.clueItem}。${P.place}的灯不再亮了，但你终于知道，离开并不是消失。`
        ],
        echo: [
          "你低头看手里的东西。那上面有一行你从未注意过的小字。",
          `天一点点亮起来。远处，${P.place}第一次没有在下雨。`
        ],
        choices: []
      };
    }

    const nodes = { n0, n1, n2, n3, n4, n5, n7, ...endingNodes };
    const order = ["n0", "n1", "n2", "n3", "n4", "n5", "n7", "e1"];
    if (endingCount > 1) order.push("e2", "e3");
    return { nodes, order };
  }

  function createCustomGame(config) {
    const genre = D.PACKS[config.genre] ? config.genre : "suspense";
    const pack = D.PACKS[genre];
    const P = analyzePremise(config.background, genre);
    const endingCount = config.endingCount === 1 ? 1 : 3;
    const statsEnabled = config.statsEnabled !== false;
    const built = buildCustomNodes(P, { endingCount: endingCount, statsEnabled: statsEnabled });
    const lengthOption = D.LENGTH_OPTIONS.find((item) => item.key === config.length) || D.LENGTH_OPTIONS[1];
    const genreName = (D.GENRES.find((item) => item.key === genre) || {}).label || pack.genreLabel.split(" · ")[0];

    return {
      id: config.id || "custom-" + Date.now().toString(36),
      title: config.title && config.title.trim() ? config.title.trim() : P.title,
      subtitle: P.subtitle,
      genre: genre,
      genreLabel: genreName + " · " + P.theme.label,
      tone: config.tone || pack.tone,
      era: P.era,
      cover: deriveCover(P),
      author: config.author || "旅人",
      published: false,
      featured: false,
      isSample: false,
      isGenerated: true,
      customized: true,
      synopsis: clip(P.raw, 150),
      background: P.raw,
      tags: [genreName, endingCount === 1 ? "单结局" : "多结局", "根据你的设定"],
      estimatedTime: lengthOption.time,
      endingCount: endingCount,
      statsEnabled: statsEnabled,
      stats: D.BASE_STATS.map((item) => ({ ...item })),
      initialStats: { hp: 100, insight: 0, bond: 0 },
      initialInventory: [P.object],
      itemLibrary: buildItemLibrary(P),
      characters: buildCharacters(P),
      initialLocation: built.nodes.n0.location,
      initialTime: built.nodes.n0.time,
      startNodeId: "n0",
      nodes: built.nodes,
      nodeOrder: built.order,
      generation: {
        length: config.length || "medium",
        endingCount: endingCount,
        statsEnabled: statsEnabled,
        createdAt: new Date().toISOString(),
        analyzed: {
          place: P.place,
          landmark: P.landmark,
          object: P.object,
          theme: P.themeKey,
          npc: P.npc,
          ally: P.ally
        }
      }
    };
  }

  D.createCustomGame = createCustomGame;
  D.previewCustomTitle = function (background, explicitTitle, genre) {
    if (!background || background.trim().length < 10) {
      const pack = D.PACKS[genre] || D.PACKS.suspense;
      return explicitTitle && explicitTitle.trim() ? explicitTitle.trim() : pack.title;
    }
    const P = analyzePremise(background, genre);
    return explicitTitle && explicitTitle.trim() ? explicitTitle.trim() : deriveTitle(background, explicitTitle, P, D.PACKS[genre] || D.PACKS.suspense);
  };
  D.previewCustomCover = function (background, genre) {
    const pack = D.PACKS[genre] || D.PACKS.suspense;
    if (!background || background.trim().length < 10) return pack.cover;
    return deriveCover(analyzePremise(background, genre));
  };
})();
