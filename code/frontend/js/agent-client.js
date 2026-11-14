/* EchoQuest Agent client
 * Orchestrates: prepare -> architect Agent -> writer Agent -> validator tool
 * -> optional repair Agent -> compile. The LLM key stays on the server.
 */
(function () {
  "use strict";

  const D = window.EchoQuestData;
  if (!D) return;

  const STEPS = [
    { id: "prepare", label: "读取故事设定", detail: "保留你的世界、人物与核心物件" },
    { id: "architect", label: "故事架构 Agent", detail: "根据你的背景设计专属流程、角色冲突与分支" },
    { id: "write", label: "剧情撰写 Agent", detail: "按专属流程写剧情、选项与结局" },
    { id: "validate", label: "一致性校验工具", detail: "检查节点连通、选项数量、分支和结局" },
    { id: "repair", label: "自动修复 Agent", detail: "只有在结构校验失败时启动", optional: true },
    { id: "compile", label: "编译故事树", detail: "装订成可游玩、可编辑的世界" }
  ];

  let healthCache = null;
  let healthAt = 0;

  async function health(force) {
    if (window.location.protocol === "file:") {
      healthCache = { available: false, model: "", provider: "", error: "local file mode" };
      healthAt = Date.now();
      return healthCache;
    }
    if (!force && healthCache && Date.now() - healthAt < 30000) return healthCache;
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      healthCache = { available: Boolean(data.ai), model: data.model || "", provider: data.provider || "" };
    } catch (error) {
      healthCache = { available: false, model: "", provider: "", error: error.message };
    }
    healthAt = Date.now();
    return healthCache;
  }

  function clip(text, max) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > max ? value.slice(0, max) + "…" : value;
  }

  function makeTrace(stage, status, detail, meta) {
    return {
      id: stage,
      status: status,
      detail: detail,
      latencyMs: meta && meta.latencyMs ? meta.latencyMs : null,
      usage: (meta && meta.usage) || null,
      model: (meta && meta.model) || "",
      at: new Date().toISOString()
    };
  }

  async function api(path, payload, signal) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal
    });
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Agent 接口返回了无法解析的响应");
    }
    if (!response.ok || data.ok === false) {
      throw new Error((data && data.error) || ("Agent 接口错误 " + response.status));
    }
    return data;
  }

  function validateNodes(nodes, bible) {
    const issues = [];
    if (!nodes || typeof nodes !== "object") return ["nodes 不是对象"];
    const plan = Array.isArray(bible && bible.nodes) ? bible.nodes : [];
    if (!plan.length) return ["故事流程为空"];
    plan.forEach((planned) => {
      if (!planned || !planned.id) return;
      const id = String(planned.id);
      const node = nodes[id];
      if (!node) {
        issues.push("缺少节点 " + id);
        return;
      }
      if (!Array.isArray(node.text) || !node.text.filter(Boolean).length) issues.push(id + " 缺少剧情文本");
      const expected = planned.isEnding ? 0 : ((planned.choices && planned.choices.length) || 0);
      if (!Array.isArray(node.choices) || node.choices.length !== expected) {
        issues.push(id + " 需要 " + expected + " 个选项，正文给了 " + (Array.isArray(node.choices) ? node.choices.length : 0) + " 个");
      }
    });
    return issues;
  }

  function fillCharacters(bible, background) {
    let characters = Array.isArray(bible.characters) ? bible.characters.slice(0, 4) : [];
    const fallback = [
      { name: "故事里的关键人物", role: "与主角命运相连", tone: "stranger", desc: "Ta 知道一些主角尚未察觉的事。" },
      { name: "同行者", role: "主角的同伴", tone: "ally", desc: "Ta 愿意和主角一起承担选择的后果。" },
      { name: "未出场的人", role: "故事背后的名字", tone: "ghost", desc: "所有线索都隐约指向 Ta。" }
    ];
    while (characters.length < 2) characters.push(fallback[characters.length]);
    return characters.map((character, index) => {
      const name = clip(character.name || fallback[index].name, 14);
      return {
        name: name,
        role: clip(character.role || fallback[index].role, 18),
        tone: character.tone || fallback[index].tone,
        initial: /^[\u4e00-\u9fa5A-Za-z]/.test(name) ? name.slice(0, 1) : "?",
        desc: clip(character.desc || fallback[index].desc, 90)
      };
    });
  }

  function compileGame(bible, rawNodes, config, trace, meta) {
    const plan = (Array.isArray(bible.nodes) ? bible.nodes : []).filter((node) => node && node.id);
    if (!plan.length) throw new Error("故事流程为空，无法编译");
    const raw = rawNodes && typeof rawNodes === "object" ? rawNodes : {};
    const planById = {};
    plan.forEach((node) => { planById[String(node.id)] = node; });
    const startId = planById[bible.startNodeId] ? String(bible.startNodeId) : String(plan[0].id);
    const endingCount = plan.filter((node) => node.isEnding).length || 1;
    const statsEnabled = config.statsEnabled !== false;

    const items = Array.isArray(bible.items) ? bible.items.filter((item) => item && item.name) : [];
    const itemLibrary = {};
    items.forEach((item) => { itemLibrary[clip(item.name, 24)] = clip(item.desc || "故事里的一件物品。", 120); });
    const initialInventory = items.filter((item) => item.initial !== false).map((item) => clip(item.name, 24)).slice(0, 4);

    const statNames = bible.statNames || {};
    const stats = D.BASE_STATS.map((stat) => ({
      ...stat,
      name: clip(statNames[stat.key] || stat.name, 12)
    }));

    const coverMap = {
      school: "clocktower",
      sea: "harbor",
      city: "neon",
      space: "neon",
      wasteland: "ash",
      forest: "forest",
      romance: "romance"
    };
    const cover = coverMap[bible.coverHint] || (D.previewCustomCover
      ? D.previewCustomCover(config.background, config.genre)
      : (D.PACKS[config.genre] || D.PACKS.suspense).cover);

    const nodes = {};
    const nodeOrder = [];
    plan.forEach((planned, index) => {
      const id = String(planned.id);
      nodeOrder.push(id);
      const source = raw[id] || {};
      const isEnding = Boolean(planned.isEnding);
      const title = clip(source.title || planned.title || (isEnding ? "故事终点" : "未完的段落"), 28);
      const choices = (isEnding ? [] : (planned.choices || [])).map((plannedChoice, choiceIndex) => {
        const written = Array.isArray(source.choices) ? source.choices[choiceIndex] : null;
        const effects = plannedChoice && plannedChoice.effects ? { ...plannedChoice.effects } : {};
        if (plannedChoice && Array.isArray(plannedChoice.items) && plannedChoice.items.length) {
          effects.items = plannedChoice.items.slice();
          plannedChoice.items.forEach((itemName) => {
            if (!itemLibrary[itemName]) itemLibrary[itemName] = "在这次选择中获得的关键物品。";
          });
        }
        return {
          id: id + "-c" + (choiceIndex + 1),
          text: clip((written && written.text) || (plannedChoice && plannedChoice.text) || "继续向前", 52),
          note: clip((written && written.note) || (plannedChoice && plannedChoice.note) || "", 32),
          to: String((plannedChoice && plannedChoice.to) || ""),
          effects: effects,
          requires: (plannedChoice && plannedChoice.requires) || null,
          keywords: []
        };
      }).filter((choice) => planById[choice.to]);

      const node = {
        id: id,
        chapter: isEnding ? "结局 · " + title : (clip(planned.act || "第 " + (index + 1) + " 幕", 20)),
        title: title,
        location: clip(source.location || planned.location || bible.setting && bible.setting.startLocation || "故事发生的地方", 32),
        time: clip(source.time || planned.time || "故事进行时", 28),
        weather: clip(source.weather || planned.weather || "空气里有未说出口的话", 44),
        text: (Array.isArray(source.text) && source.text.length ? source.text : [planned.summary || "故事在这里继续。"]).map((item) => clip(item, 480)).filter(Boolean),
        echo: (Array.isArray(source.echo) && source.echo.length ? source.echo : ["你听见远处传来一声很轻的回响。", "空气安静下来。"]).map((item) => clip(item, 180)).slice(0, 3),
        choices: choices
      };
      if (isEnding) {
        node.isEnding = true;
        node.endingType = planned.endingType || "good";
        node.endingTitle = title;
        node.endingQuote = clip(source.quote || planned.summary || bible.theme || "故事到此为止。", 90);
      }
      nodes[id] = node;
    });

    // Add descriptors for any item granted by the flow but not declared in items.
    plan.forEach((planned) => {
      (planned.choices || []).forEach((choice) => {
        (choice.items || []).forEach((name) => {
          if (name && !itemLibrary[name]) itemLibrary[name] = "故事中获得的物品。";
        });
      });
    });

    const startNode = nodes[startId] || nodes[nodeOrder[0]];
    return {
      id: config.id || "story-" + Date.now().toString(36),
      title: config.title && config.title.trim() ? config.title.trim() : clip(bible.title || "未命名故事", 24),
      subtitle: clip(bible.subtitle || "你写下的故事，正在继续。", 50),
      genre: config.genre,
      genreLabel: clip(bible.genreLabel || (D.PACKS[config.genre] || D.PACKS.suspense).genreLabel, 34),
      tone: clip(bible.tone || config.tone || "克制", 30),
      era: clip(bible.era || "当代", 24),
      cover: cover,
      author: config.author || "旅人",
      published: false,
      featured: false,
      isSample: false,
      isGenerated: true,
      customized: true,
      synopsis: clip(bible.synopsis || config.background, 150),
      background: config.background,
      tags: [clip(bible.genreLabel || "互动故事", 20), endingCount === 1 ? "单结局" : "多结局", "AI Agent 生成"],
      estimatedTime: (D.LENGTH_OPTIONS.find((item) => item.key === config.length) || D.LENGTH_OPTIONS[1]).time,
      endingCount: endingCount,
      statsEnabled: statsEnabled,
      stats: stats,
      initialStats: { hp: 100, insight: 0, bond: 0 },
      initialInventory: initialInventory,
      itemLibrary: itemLibrary,
      characters: fillCharacters(bible, config.background),
      initialLocation: startNode ? startNode.location : "故事开始的地方",
      initialTime: startNode ? startNode.time : "第 1 天",
      startNodeId: startNode ? startNode.id : nodeOrder[0],
      nodes: nodes,
      nodeOrder: nodeOrder,
      agentTrace: trace,
      generation: {
        length: config.length || "medium",
        endingCount: endingCount,
        statsEnabled: statsEnabled,
        createdAt: new Date().toISOString(),
        aiAgent: true,
        model: meta.model || "",
        usage: meta.usage || {},
        trace: trace,
        flowNodeCount: plan.length
      }
    };
  }

  async function generate(config, handlers) {
    const opts = handlers || {};
    const emit = (event) => {
      if (typeof opts.onEvent === "function") opts.onEvent(event);
    };
    const trace = [];
    const started = Date.now();
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    function addTrace(entry) {
      trace.push(entry);
      emit({ type: "trace", trace: entry });
    }
    function usageAdd(usage) {
      if (!usage) return;
      totalUsage.prompt_tokens += usage.prompt_tokens || 0;
      totalUsage.completion_tokens += usage.completion_tokens || 0;
      totalUsage.total_tokens += usage.total_tokens || 0;
    }

    emit({ type: "stage", id: "prepare", status: "active", progress: 4, detail: "解析你的故事设定" });
    const status = await health();
    if (!status.available) {
      throw new Error("AI Agent 未启用或服务不可用");
    }
    addTrace({
      id: "prepare",
      status: "success",
      detail: "已读取背景、类型与参数",
      tool: "local",
      latencyMs: 0,
      usage: null,
      at: new Date().toISOString()
    });
    emit({ type: "stage", id: "prepare", status: "done", progress: 7, detail: "设定已读取" });

    emit({ type: "stage", id: "architect", status: "active", progress: 9, detail: "故事架构 Agent 正在设计故事圣经" });
    const architect = await api("/api/agent/architect", {
      background: config.background,
      genreLabel: (D.GENRES.find((item) => item.key === config.genre) || {}).label || "",
      tone: config.tone || "",
      length: config.length || "medium",
      endingCount: config.endingCount === 1 ? 1 : 3,
      statsEnabled: config.statsEnabled !== false
    }, opts.signal);
    usageAdd(architect.meta && architect.meta.usage);
    const planIssues = Array.isArray(architect.issues) ? architect.issues : [];
    const planNodeCount = Array.isArray(architect.data.nodes) ? architect.data.nodes.length : 0;
    addTrace({
      id: "architect",
      status: planIssues.length ? "warning" : "success",
      detail: "生成标题《" + (architect.data.title || "未命名") + "》与 " + planNodeCount + " 个专属流程节点" + (planIssues.length ? "，规划警告 " + planIssues.length + " 条" : ""),
      tool: "LLM · architect",
      latencyMs: architect.meta && architect.meta.latencyMs,
      usage: architect.meta && architect.meta.usage,
      model: architect.meta && architect.meta.model,
      at: new Date().toISOString()
    });
    emit({ type: "stage", id: "architect", status: planIssues.length ? "warning" : "done", progress: 38, detail: "故事流程已完成 · " + planNodeCount + " 个节点" });
    emit({ type: "bible", data: architect.data });

    emit({ type: "stage", id: "write", status: "active", progress: 42, detail: "剧情撰写 Agent 正在写完整剧情" });
    const writer = await api("/api/agent/write", {
      background: config.background,
      bible: architect.data,
      endingCount: config.endingCount === 1 ? 1 : 3,
      statsEnabled: config.statsEnabled !== false
    }, opts.signal);
    usageAdd(writer.meta && writer.meta.usage);
    let nodes = (writer.data && writer.data.nodes) || {};
    let issues = Array.isArray(writer.issues) ? writer.issues.slice() : [];
    addTrace({
      id: "write",
      status: issues.length ? "warning" : "success",
      detail: "完成 " + Object.keys(nodes).length + " 个节点正文" + (issues.length ? "，发现 " + issues.length + " 个结构问题" : "，结构完整"),
      tool: "LLM · writer",
      latencyMs: writer.meta && writer.meta.latencyMs,
      usage: writer.meta && writer.meta.usage,
      model: writer.meta && writer.meta.model,
      at: new Date().toISOString()
    });
    emit({ type: "stage", id: "write", status: issues.length ? "warning" : "done", progress: 78, detail: "完整剧情已生成" });
    emit({ type: "nodes", data: nodes });

    emit({ type: "stage", id: "validate", status: "active", progress: 81, detail: "一致性校验工具正在检查节点结构" });
    const localIssues = validateNodes(nodes, architect.data);
    issues = Array.from(new Set(issues.concat(localIssues)));
    addTrace({
      id: "validate",
      status: issues.length ? "warning" : "success",
      detail: issues.length ? "发现 " + issues.length + " 个问题：" + issues.slice(0, 3).join("；") : "节点、选项、结局与文本全部通过",
      tool: "validator",
      latencyMs: 0,
      usage: null,
      at: new Date().toISOString()
    });
    emit({ type: "stage", id: "validate", status: issues.length ? "warning" : "done", progress: 84, detail: issues.length ? "发现 " + issues.length + " 个结构问题" : "一致性校验通过" });

    if (issues.length) {
      emit({ type: "stage", id: "repair", status: "active", progress: 86, detail: "自动修复 Agent 正在补全结构" });
      const repaired = await api("/api/agent/repair", {
        background: config.background,
        bible: architect.data,
        nodes: nodes,
        issues: issues,
        endingCount: config.endingCount === 1 ? 1 : 3,
        statsEnabled: config.statsEnabled !== false
      }, opts.signal);
      usageAdd(repaired.meta && repaired.meta.usage);
      nodes = (repaired.data && repaired.data.nodes) || nodes;
      issues = Array.isArray(repaired.issues) ? repaired.issues : validateNodes(nodes, architect.data);
      addTrace({
        id: "repair",
        status: issues.length ? "warning" : "success",
        detail: issues.length ? "修复后仍有 " + issues.length + " 个问题" : "结构问题已修复",
        tool: "LLM · repair",
        latencyMs: repaired.meta && repaired.meta.latencyMs,
        usage: repaired.meta && repaired.meta.usage,
        model: repaired.meta && repaired.meta.model,
        at: new Date().toISOString()
      });
      emit({ type: "stage", id: "repair", status: issues.length ? "warning" : "done", progress: 94, detail: issues.length ? "仍有结构问题，将使用已有内容编译" : "修复完成" });
    } else {
      emit({ type: "stage", id: "repair", status: "skipped", progress: 94, detail: "未触发修复" });
    }

    emit({ type: "stage", id: "compile", status: "active", progress: 96, detail: "编译故事树与互动机制" });
    const game = compileGame(architect.data, nodes, config, trace, {
      model: (writer.meta && writer.meta.model) || (architect.meta && architect.meta.model) || "",
      usage: totalUsage
    });
    game.generation.totalElapsedMs = Date.now() - started;
    addTrace({
      id: "compile",
      status: "success",
      detail: "已编译 " + game.nodeOrder.length + " 个节点、" + game.nodeOrder.filter((id) => game.nodes[id].isEnding).length + " 个结局",
      tool: "compiler",
      latencyMs: 0,
      usage: null,
      at: new Date().toISOString()
    });
    emit({ type: "stage", id: "compile", status: "done", progress: 100, detail: "故事已装订完成" });
    emit({ type: "game", data: game });
    return { game: game, trace: trace, usage: totalUsage };
  }

  window.EchoQuestAgent = {
    STEPS: STEPS,
    health: health,
    generate: generate,
    compile: compileGame
  };
})();
