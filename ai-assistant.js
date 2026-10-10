// ============================================================================
// ResuCraft Pro — Local-First Smart Writing Engine + Optional Gemini/OpenAI API
// ============================================================================

window.AIAssistant = (function () {
  const STORAGE_KEY = 'resucraft_ai_config_v1';

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { provider: 'local', apiKey: '', model: 'gemini-2.5-flash' };
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) { /* ignore */ }
  }

  const VERB_UPGRADES = [
    { match: /^(was\s+)?responsible for\s+(building|creating|developing|making)\s+/i, replace: 'Architected and engineered ' },
    { match: /^(was\s+)?responsible for\s+(managing|leading|running)\s+/i, replace: 'Spearheaded and directed ' },
    { match: /^(was\s+)?responsible for\s+/i, replace: 'Spearheaded and owned ' },
    { match: /^worked on\s+(building|creating|developing)\s+/i, replace: 'Engineered and deployed ' },
    { match: /^worked on\s+/i, replace: 'Developed and optimized ' },
    { match: /^helped\s+(to\s+|with\s+)?(build|create|develop)\s+/i, replace: 'Co-engineered and delivered ' },
    { match: /^helped\s+(to\s+|with\s+)?/i, replace: 'Collaborated cross-functionally to accelerate ' },
    { match: /^assisted\s+(in\s+|with\s+)?/i, replace: 'Contributed to and streamlined ' },
    { match: /^made\s+/i, replace: 'Engineered and launched ' },
    { match: /^built\s+/i, replace: 'Architected and built ' },
    { match: /^created\s+/i, replace: 'Designed and implemented ' },
    { match: /^did\s+/i, replace: 'Executed and delivered ' },
    { match: /^used\s+([^,]+)\s+to\s+/i, replace: 'Leveraged $1 to ' },
    { match: /^improved\s+/i, replace: 'Optimized and elevated ' },
    { match: /^fixed\s+/i, replace: 'Diagnosed and resolved ' },
    { match: /^wrote\s+/i, replace: 'Authored and maintained ' },
    { match: /^managed\s+/i, replace: 'Orchestrated and scaled ' }
  ];

  function inferImpactClause(text) {
    const t = text.toLowerCase();
    if (/api|backend|server|database|sql|query|redis|kafka|microservice|latency|performance/.test(t)) {
      return ', reducing response latency by [X]% and supporting [Y]+ daily requests.';
    }
    if (/react|frontend|ui|ux|web|css|component|dashboard|page|mobile|app/.test(t)) {
      return ', improving performance scores by [X]% and boosting engagement across [Y]+ users.';
    }
    if (/ci\/cd|test|docker|kubernetes|deploy|aws|cloud|terraform|pipeline|automation/.test(t)) {
      return ', cutting deployment times by [X]% and reducing production incidents by [Y]%.';
    }
    if (/ml|ai|model|data|analytics|python|prediction|llm|rag|pipeline/.test(t)) {
      return ', improving accuracy by [X]% and automating [Y]+ hours of manual work per week.';
    }
    if (/product|roadmap|customer|user|launch|growth|funnel|onboarding|retention|sales|revenue/.test(t)) {
      return ', driving a [X]% increase in adoption and generating $[Y]K in measurable value.';
    }
    return ', increasing efficiency by [X]% and delivering measurable improvements across the team.';
  }

  function enhanceBulletLocal(rawBullet, missingKeywords = []) {
    const clean = (rawBullet || '').trim().replace(/^[•\-*]\s*/, '');
    if (!clean) {
      return [
        {
          mode: 'XYZ Formula Template',
          text: 'Spearheaded [project/initiative] using [tools/skills], resulting in a [X]% improvement in [key metric].'
        },
        {
          mode: 'Action + Context + Result',
          text: 'Engineered and launched [feature/process] across [team/scope], reducing turnaround time by [X]%.'
        }
      ];
    }

    let polished = clean;
    let verbReplaced = false;
    for (const rule of VERB_UPGRADES) {
      if (rule.match.test(polished)) {
        polished = polished.replace(rule.match, rule.replace);
        verbReplaced = true;
        break;
      }
    }

    if (!verbReplaced) {
      polished = polished.charAt(0).toUpperCase() + polished.slice(1);
      if (/^(the|a|an|my|our)\s+/i.test(polished)) {
        polished = 'Spearheaded ' + polished.charAt(0).toLowerCase() + polished.slice(1);
      }
    }

    const baseNoPeriod = polished.replace(/[.!;,\s]+$/, '');
    const hasMetrics = window.ATSEngine && window.ATSEngine.hasQuantifiedMetric(baseNoPeriod);

    let v1 = baseNoPeriod + '.';
    if (v1 === clean) {
      v1 = baseNoPeriod.replace(/^[A-Za-z]+/, 'Spearheaded') + ', delivering measurable quality and efficiency gains.';
    }

    let v2 = baseNoPeriod;
    if (!hasMetrics) {
      v2 = baseNoPeriod + inferImpactClause(baseNoPeriod);
    } else {
      v2 = baseNoPeriod.replace(/\bby\s+(\d+%)/i, 'by $1 through systematic optimization') + '.';
    }

    const kwToInject = missingKeywords.slice(0, 2);
    let v3 = baseNoPeriod;
    if (kwToInject.length > 0) {
      v3 = `${baseNoPeriod} leveraging ${kwToInject.join(' and ')}.`;
    } else {
      v3 = baseNoPeriod
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\bwith the goal of\b/gi, 'to')
        .replace(/\ba wide variety of\b/gi, 'diverse')
        .replace(/\bcollaborated with team members to\b/gi, 'partnered cross-functionally to')
        + (hasMetrics ? '.' : ', reducing execution time by [X]%.');
    }

    return [
      { mode: 'Executive Action Polish', text: v1 },
      { mode: 'XYZ Quantified Impact', text: v2 },
      { mode: kwToInject.length ? `ATS Keyword Tailored (+${kwToInject.join(', ')})` : 'High-Density & Concise', text: v3 }
    ];
  }

  function generateSummariesLocal(resume) {
    const p = resume.personal || {};
    const role = (p.jobTitle && p.jobTitle.trim()) ? p.jobTitle.trim() : '[Your Target Role]';

    // Collect skills from any 'skills' section
    const skillItems = [];
    (resume.sections || []).forEach(sec => {
      if (sec.type === 'skills') {
        (sec.items || []).forEach(it => {
          (it.skillsText || '').split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed && skillItems.length < 5) skillItems.push(trimmed);
          });
        });
      }
    });

    const topSkillsStr = skillItems.length >= 2
      ? skillItems.slice(0, 4).join(', ')
      : '[Core Skill 1], [Core Skill 2], and [Core Skill 3]';

    return [
      {
        title: 'Impact & Results Focused',
        text: `Results-driven ${role} with expertise in ${topSkillsStr}. Proven track record of translating complex requirements into high-impact solutions, improving operational efficiency, and delivering measurable outcomes.`
      },
      {
        title: 'Technical & Execution Specialist',
        text: `Detail-oriented ${role} specializing in ${topSkillsStr}. Skilled in designing, building, and optimizing scalable workflows and collaborating across teams to deliver high-quality results on schedule.`
      },
      {
        title: 'Leadership & Strategy Focused',
        text: `Strategic ${role} combining strong domain foundation in ${topSkillsStr} with cross-functional leadership. Experienced in driving end-to-end initiatives from concept to execution while aligning with key organizational goals.`
      }
    ];
  }

  async function enhanceBullet(rawBullet, resume, missingKeywords = []) {
    const cfg = getConfig();
    if (!cfg.apiKey || cfg.provider === 'local') {
      return { source: 'Built-in Smart Engine', suggestions: enhanceBulletLocal(rawBullet, missingKeywords) };
    }

    const prompt = `You are an expert executive resume writer.
Rewrite the following resume bullet point into 3 distinct, high-impact variations:
1. "Executive Action Polish" (strong action verb, active voice, crisp phrasing)
2. "XYZ Quantified Impact" (Accomplished X as measured by Y, by doing Z — preserve existing numbers or add bracketed metric placeholders like [X]% if missing)
3. "ATS Keyword Tailored" (naturally incorporate 1-2 of these target keywords if relevant: ${missingKeywords.slice(0, 4).join(', ') || 'core domain skills'})

Original Bullet: "${rawBullet}"
Target Role: "${(resume.personal && resume.personal.jobTitle) || 'Professional'}"

Respond ONLY with valid JSON array of 3 objects: [{"mode": "...", "text": "..."}]`;

    try {
      if (cfg.provider === 'gemini') {
        const model = cfg.model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
          })
        });
        if (!resp.ok) throw new Error(`Gemini API HTTP ${resp.status}`);
        const data = await resp.json();
        const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(textOut);
        if (Array.isArray(parsed) && parsed.length) {
          return { source: `Gemini (${model})`, suggestions: parsed };
        }
      } else if (cfg.provider === 'openai') {
        const model = cfg.model || 'gpt-4o-mini';
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4
          })
        });
        if (!resp.ok) throw new Error(`OpenAI API HTTP ${resp.status}`);
        const data = await resp.json();
        const textOut = (data?.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(textOut);
        if (Array.isArray(parsed) && parsed.length) {
          return { source: `OpenAI (${model})`, suggestions: parsed };
        }
      }
    } catch (err) {
      console.warn('Live AI API call failed, falling back to Built-in Smart Engine:', err);
    }

    return {
      source: 'Built-in Smart Engine (Fallback)',
      suggestions: enhanceBulletLocal(rawBullet, missingKeywords)
    };
  }

  return {
    getConfig,
    saveConfig,
    enhanceBullet,
    enhanceBulletLocal,
    generateSummariesLocal
  };
})();
