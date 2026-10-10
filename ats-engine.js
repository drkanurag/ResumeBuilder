// ============================================================================
// ResuCraft Pro — Real-Time ATS Audit & Job Description Keyword Matcher Engine
// (Supports 100% Dynamic Custom Sections & Headings)
// ============================================================================

window.ATSEngine = (function () {
  const CURATED_KEYWORDS = [
    'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Golang', 'Rust', 'C++', 'C#', '.NET',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'SQL', 'NoSQL', 'HTML5', 'CSS3', 'Sass',
    'GraphQL', 'gRPC', 'REST API', 'RESTful APIs', 'WebSockets', 'WebAssembly',
    'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Redux', 'Tailwind CSS', 'Webpack',
    'Vite', 'React Native', 'Flutter', 'iOS', 'Android', 'WCAG', 'Accessibility', 'Figma',
    'Node.js', 'Express', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Ruby on Rails',
    'Laravel', 'ASP.NET', 'Microservices', 'Distributed Systems', 'Event-Driven Architecture',
    'System Design', 'Serverless', 'Multi-tenant',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
    'Snowflake', 'BigQuery', 'Redshift', 'Apache Kafka', 'Kafka', 'RabbitMQ', 'Apache Spark',
    'Spark', 'Hadoop', 'Airflow', 'dbt', 'ETL', 'Data Warehousing', 'Data Pipelines',
    'Data Modeling', 'Tableau', 'Power BI', 'Looker',
    'AWS', 'GCP', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'K8s', 'Terraform',
    'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CI/CD', 'ArgoCD', 'Linux', 'Nginx',
    'Prometheus', 'Grafana', 'Datadog', 'Observability', 'OpenTelemetry', 'OAuth', 'JWT',
    'SOC2', 'Cybersecurity', 'DevSecOps', 'IAM',
    'Machine Learning', 'Deep Learning', 'Generative AI', 'GenAI', 'LLMs', 'RAG',
    'PyTorch', 'TensorFlow', 'scikit-learn', 'XGBoost', 'NLP', 'Computer Vision',
    'LangChain', 'Vector Database', 'Pinecone', 'Fine-tuning', 'Prompt Engineering',
    'A/B Testing', 'Causal Inference', 'Statistical Modeling',
    'Unit Testing', 'Integration Testing', 'End-to-End Testing', 'Jest', 'Playwright',
    'Cypress', 'Selenium', 'TDD', 'Quality Assurance', 'Performance Optimization',
    'Product Management', 'Product Strategy', 'Product Roadmap', 'Roadmapping', 'PRDs',
    'Product-Led Growth', 'PLG', 'Go-To-Market', 'GTM', 'User Research', 'Customer Discovery',
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'OKRs', 'KPIs', 'Stakeholder Management',
    'Cross-functional Leadership', 'Mentorship', 'Code Review', 'ARR', 'Retention',
    'Conversion Rate Optimization', 'Amplitude', 'Mixpanel', 'Google Analytics', 'SaaS', 'B2B'
  ];

  const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
    'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
    'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
    'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
    'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
    'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'looking', 'seeking', 'experience', 'years', 'year', 'work', 'working',
    'team', 'teams', 'role', 'responsibilities', 'requirements', 'qualifications', 'skills',
    'ability', 'strong', 'proven', 'plus', 'preferred', 'minimum', 'degree', 'bachelor',
    'master', 'computer', 'science', 'related', 'field', 'equivalent', 'environment',
    'fast-paced', 'build', 'building', 'develop', 'developing', 'design', 'designing',
    'partner', 'collaborate', 'drive', 'driving', 'including', 'such', 'well', 'using',
    'used', 'use', 'new', 'existing', 'high', 'level', 'hands-on', 'deep', 'understanding',
    'knowledge', 'proficiency', 'familiarity', 'excellent', 'communication', 'written',
    'verbal', 'problem', 'solving', 'detail', 'oriented', 'self-starter', 'passionate',
    'join', 'our', 'company', 'product', 'products', 'features', 'solutions', 'services',
    'systems', 'applications', 'software', 'engineer', 'engineering', 'senior', 'junior',
    'staff', 'lead', 'manager', 'management', 'across', 'within', 'multiple', 'various',
    'ensure', 'ensuring', 'support', 'supporting', 'maintain', 'maintaining', 'deliver',
    'delivering', 'help', 'helping', 'create', 'creating', 'implement', 'implementing',
    'manage', 'managing', 'own', 'owning', 'day-to-day', 'end-to-end', 'best', 'practices'
  ]);

  function getStrongVerbSet() {
    const set = new Set();
    const groups = (window.RESUCRAFT_DATA && window.RESUCRAFT_DATA.actionVerbs) || {};
    Object.values(groups).forEach(list => {
      list.forEach(v => set.add(v.toLowerCase()));
    });
    [
      'built', 'created', 'designed', 'drove', 'authored', 'deployed', 'reduced', 'increased',
      'improved', 'cut', 'saved', 'generated', 'delivered', 'migrated', 'integrated', 'resolved',
      'standardized', 'automated', 'architected', 'engineered', 'spearheaded', 'orchestrated',
      'pioneered', 'transformed', 'optimized', 'accelerated', 'launched', 'scaled', 'mentored'
    ].forEach(v => set.add(v));
    return set;
  }

  // Serialize dynamic resume into clean ATS plain text
  function getResumePlainText(resume) {
    if (!resume) return '';
    const parts = [];
    const p = resume.personal || {};
    const customLinksText = (p.customLinks || []).map(l => `${l.label ? l.label + ': ' : ''}${l.value || ''}`).filter(Boolean);
    const headerLine = [
      p.fullName, p.jobTitle, p.email, p.phone, p.location, p.website, p.linkedin, p.github, ...customLinksText
    ].filter(Boolean).join(' | ');
    if (headerLine) parts.push(headerLine);

    (resume.sections || []).forEach(sec => {
      if (sec.visible === false) return;
      const heading = (sec.title || 'SECTION').toUpperCase();

      if (sec.type === 'text') {
        if (sec.content && sec.content.trim()) {
          parts.push(`\n${heading}\n${sec.content.trim()}`);
        }
      } else if (sec.type === 'bullets') {
        const validBullets = (sec.bullets || []).filter(b => b && b.trim());
        if (validBullets.length) {
          parts.push(`\n${heading}`);
          validBullets.forEach(b => parts.push(`• ${b.trim()}`));
        }
      } else if (sec.type === 'detailed') {
        const items = (sec.items || []).filter(it => it.title || it.subtitle || (it.bullets || []).some(b => b && b.trim()));
        if (items.length) {
          parts.push(`\n${heading}`);
          items.forEach(it => {
            const dates = [it.startDate, it.endDate].filter(Boolean).join(' - ');
            const line = [it.title, it.subtitle, dates ? `(${dates})` : '', it.location, it.link].filter(Boolean).join(' | ');
            if (line) parts.push(line);
            (it.bullets || []).forEach(b => {
              if (b && b.trim()) parts.push(`• ${b.trim()}`);
            });
          });
        }
      } else if (sec.type === 'education') {
        const items = (sec.items || []).filter(it => it.institution || it.degree || it.details);
        if (items.length) {
          parts.push(`\n${heading}`);
          items.forEach(it => {
            const line = [it.degree, it.institution, it.date, it.gpa ? `GPA: ${it.gpa}` : '', it.location].filter(Boolean).join(' | ');
            if (line) parts.push(line);
            if (it.details && it.details.trim()) parts.push(it.details.trim());
            (it.bullets || []).forEach(b => {
              if (b && b.trim()) parts.push(`• ${b.trim()}`);
            });
          });
        }
      } else if (sec.type === 'skills') {
        const items = (sec.items || []).filter(it => it.category || it.skillsText);
        if (items.length) {
          parts.push(`\n${heading}`);
          items.forEach(it => {
            parts.push(`${it.category ? it.category + ': ' : ''}${it.skillsText || ''}`);
          });
        }
      } else if (sec.type === 'compact') {
        const items = (sec.items || []).filter(it => it.title || it.issuer || it.details);
        if (items.length) {
          parts.push(`\n${heading}`);
          items.forEach(it => {
            parts.push([it.title, it.issuer, it.date, it.details].filter(Boolean).join(' — '));
          });
        }
      }
    });

    return parts.join('\n').trim();
  }

  function hasQuantifiedMetric(text) {
    if (!text) return false;
    return /(\d+(\.\d+)?\s*(%|x|k|m|b|ms|s|hrs?|hours?|days?|weeks?|months?|years?|users?|clients?|customers?|engineers?|teams?|queries|requests|tps|ops|stars|pulls|\+))|(\$\s*\d+)/i.test(text) || /\b\d{2,}\b/.test(text);
  }

  function collectAllBullets(resume) {
    const allBullets = [];
    (resume.sections || []).forEach(sec => {
      if (sec.visible === false) return;
      if (sec.type === 'detailed' || sec.type === 'education') {
        (sec.items || []).forEach(item => {
          (item.bullets || []).forEach(b => {
            if (b && b.trim()) {
              allBullets.push({
                text: b.trim(),
                source: item.title || item.institution || sec.title || 'Section'
              });
            }
          });
        });
      } else if (sec.type === 'bullets') {
        (sec.bullets || []).forEach(b => {
          if (b && b.trim()) {
            allBullets.push({
              text: b.trim(),
              source: sec.title || 'Bullets'
            });
          }
        });
      }
    });
    return allBullets;
  }

  function evaluateResume(resume) {
    const checks = [];
    const actionableTips = [];
    let totalScore = 0;

    // 1. Contact Info & Links Check (20 pts)
    const p = resume.personal || {};
    let contactPts = 0;
    if (p.fullName && p.fullName.trim().length > 1) contactPts += 4;
    if (p.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) contactPts += 5;
    if (p.phone && p.phone.trim().length >= 6) contactPts += 4;
    if (p.location && p.location.trim().length >= 2) contactPts += 3;
    const hasLink = (p.linkedin && p.linkedin.trim()) ||
      (p.github && p.github.trim()) ||
      (p.website && p.website.trim()) ||
      (p.customLinks || []).some(l => l.value && l.value.trim());
    if (hasLink) {
      contactPts += 4;
    } else {
      actionableTips.push({
        severity: 'warning',
        title: 'Add a LinkedIn, Portfolio, or custom profile link',
        desc: 'Including at least one professional link in your header strengthens credibility.'
      });
    }
    if (contactPts < 15) {
      actionableTips.push({
        severity: 'error',
        title: 'Complete your personal contact details',
        desc: 'Fill in your Full Name, Email, Phone Number, and Location in the Personal Information card.'
      });
    }
    totalScore += contactPts;
    checks.push({
      label: 'Contact & Header Completeness',
      score: contactPts,
      max: 20,
      status: contactPts >= 18 ? 'good' : contactPts >= 12 ? 'warn' : 'bad'
    });

    // 2. Quantified Impact & Metrics Check (25 pts)
    const allBullets = collectAllBullets(resume);
    const quantifiedCount = allBullets.filter(b => hasQuantifiedMetric(b.text)).length;
    const quantRatio = allBullets.length > 0 ? quantifiedCount / allBullets.length : 0;
    let quantPts = 0;
    if (allBullets.length === 0) {
      quantPts = 0;
    } else if (quantRatio >= 0.65) {
      quantPts = 25;
    } else {
      quantPts = Math.round((quantRatio / 0.65) * 25);
    }
    totalScore += quantPts;
    checks.push({
      label: `Quantified Impact (${quantifiedCount}/${allBullets.length} bullets)`,
      score: quantPts,
      max: 25,
      status: quantPts >= 20 ? 'good' : quantPts >= 12 ? 'warn' : 'bad'
    });

    if (allBullets.length === 0) {
      actionableTips.push({
        severity: 'warning',
        title: 'Add achievement bullet points to your sections',
        desc: 'Add bullet points describing your impact, projects, or responsibilities.'
      });
    } else if (quantRatio < 0.65) {
      const unq = allBullets.filter(b => !hasQuantifiedMetric(b.text));
      actionableTips.push({
        severity: 'warning',
        title: `${unq.length} bullet(s) can be strengthened with numbers/metrics`,
        desc: 'Click the "✨ Enhance" button under any bullet point to automatically generate quantified variations.'
      });
    }

    // 3. Action Verbs & Active Voice (20 pts)
    const strongVerbSet = getStrongVerbSet();
    const weakRules = (window.RESUCRAFT_DATA && window.RESUCRAFT_DATA.weakPhrases) || [];
    let weakFound = [];
    let strongStartCount = 0;

    allBullets.forEach(b => {
      const firstWord = (b.text.split(/\s+/)[0] || '').replace(/[^a-zA-Z-]/g, '').toLowerCase();
      if (strongVerbSet.has(firstWord) || firstWord.endsWith('ed')) {
        strongStartCount++;
      }
      weakRules.forEach(rule => {
        if (rule.pattern.test(b.text)) {
          weakFound.push({ bullet: b, rule });
        }
      });
    });

    let verbPts = 0;
    if (allBullets.length > 0) {
      const strongRatio = strongStartCount / allBullets.length;
      verbPts = Math.round(Math.min(1, strongRatio / 0.85) * 20);
      verbPts = Math.max(0, verbPts - weakFound.length * 4);
    }
    totalScore += verbPts;
    checks.push({
      label: 'Action Verbs & Active Voice',
      score: verbPts,
      max: 20,
      status: verbPts >= 16 ? 'good' : verbPts >= 10 ? 'warn' : 'bad'
    });

    weakFound.slice(0, 2).forEach(wf => {
      actionableTips.push({
        severity: 'error',
        title: `Replace weak opening phrase ${wf.rule.label} in ${wf.bullet.source}`,
        desc: `Try starting with: ${wf.rule.replaceWith} instead.`
      });
    });

    // 4. Section Depth & Structure (20 pts)
    const plainText = getResumePlainText(resume);
    const activeSections = (resume.sections || []).filter(s => s.visible !== false);
    let structPts = 0;
    if (activeSections.length >= 3 && plainText.length > 150) structPts += 8;
    if (allBullets.length >= 3) structPts += 6;
    const hasSkills = activeSections.some(s => s.type === 'skills' && (s.items || []).some(i => i.skillsText && i.skillsText.trim()));
    if (hasSkills) structPts += 6;

    totalScore += structPts;
    checks.push({
      label: 'Section Depth & Completeness',
      score: structPts,
      max: 20,
      status: structPts >= 16 ? 'good' : structPts >= 10 ? 'warn' : 'bad'
    });

    // 5. Readability & Word Count (15 pts)
    const words = plainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    let readPts = 0;
    if (wordCount >= 320 && wordCount <= 750) {
      readPts = 15;
    } else if (wordCount > 150) {
      readPts = 10;
    } else if (wordCount > 30) {
      readPts = 5;
    }

    if (wordCount < 250) {
      actionableTips.push({
        severity: 'info',
        title: `Current word count is ${wordCount} words`,
        desc: 'A strong 1-page resume typically contains 350–650 words across your sections.'
      });
    }

    totalScore += readPts;
    checks.push({
      label: `Readability & Length (${wordCount} words)`,
      score: readPts,
      max: 15,
      status: readPts >= 12 ? 'good' : readPts >= 8 ? 'warn' : 'bad'
    });

    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      wordCount,
      bulletCount: allBullets.length,
      quantifiedCount,
      checks,
      actionableTips
    };
  }

  function analyzeJobDescription(jdText, resume) {
    if (!jdText || !jdText.trim()) {
      return { hasJD: false, matchRate: 0, matched: [], missing: [] };
    }

    const resumeTextLower = getResumePlainText(resume).toLowerCase();
    const jdLower = jdText.toLowerCase();
    const extractedMap = new Map();

    CURATED_KEYWORDS.forEach(kw => {
      const kwLower = kw.toLowerCase();
      const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (regex.test(jdLower)) {
        extractedMap.set(kwLower, kw);
      }
    });

    const rawTokens = jdText.match(/\b[A-Za-z][A-Za-z0-9+#.-]{2,18}\b/g) || [];
    const freq = {};
    rawTokens.forEach(tok => {
      const clean = tok.replace(/[.,;:!?]+$/, '');
      const lower = clean.toLowerCase();
      if (clean.length < 3 || STOPWORDS.has(lower)) return;
      if (/^\d+$/.test(clean)) return;
      const isAcronymOrCamel = /^[A-Z0-9]{2,}$/.test(clean) || /[A-Z].*[A-Z]/.test(clean);
      freq[lower] = (freq[lower] || { count: 0, display: clean, isSpecial: false });
      freq[lower].count += 1;
      if (isAcronymOrCamel) freq[lower].isSpecial = true;
    });

    Object.entries(freq).forEach(([lower, info]) => {
      if (!extractedMap.has(lower) && (info.isSpecial || info.count >= 2)) {
        extractedMap.set(lower, info.display);
      }
    });

    const matched = [];
    const missing = [];

    extractedMap.forEach((displayLabel, kwLower) => {
      const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (regex.test(resumeTextLower)) {
        matched.push(displayLabel);
      } else {
        missing.push(displayLabel);
      }
    });

    const total = matched.length + missing.length;
    const matchRate = total > 0 ? Math.round((matched.length / total) * 100) : 100;

    return {
      hasJD: true,
      matchRate,
      matched,
      missing
    };
  }

  return {
    evaluateResume,
    analyzeJobDescription,
    getResumePlainText,
    hasQuantifiedMetric
  };
})();
