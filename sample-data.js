// ============================================================================
// ResuCraft Pro — Clean Blank Schema, Section Blueprints & Writing Lexicon
// ============================================================================

window.RESUCRAFT_DATA = {
  // Blueprint for a brand-new clean public resume (no fake example data)
  createBlankResume: function () {
    return {
      settings: {
        template: 'classic-ats',
        fontFamily: "'Inter', sans-serif",
        accentColor: '#1d4ed8',
        fontSize: 'medium',
        lineHeight: '1.42',
        sectionSpacing: '14',
        pageMargin: '14',
        paperSize: 'a4',
        headerAlign: 'center',
        showIcons: true,
        underlineLinks: true,
        showEmptyPlaceholders: true
      },
      personal: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
        customLinks: [] // [{ id, label, value }] — user can add/delete any header fields
      },
      // Fully dynamic sections array: users can rename, reorder, delete any section, or add unlimited new sections/headings
      sections: [
        {
          id: 'sec-summary',
          type: 'text',
          title: 'Professional Summary',
          visible: true,
          content: ''
        },
        {
          id: 'sec-experience',
          type: 'detailed',
          title: 'Work Experience',
          visible: true,
          items: [
            {
              id: 'item-exp-1',
              title: '',
              subtitle: '',
              startDate: '',
              endDate: '',
              location: '',
              link: '',
              bullets: ['']
            }
          ]
        },
        {
          id: 'sec-education',
          type: 'education',
          title: 'Education',
          visible: true,
          items: [
            {
              id: 'item-edu-1',
              institution: '',
              degree: '',
              date: '',
              gpa: '',
              location: '',
              details: '',
              bullets: []
            }
          ]
        },
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'Skills',
          visible: true,
          items: [
            {
              id: 'item-sk-1',
              category: '',
              skillsText: ''
            }
          ]
        },
        {
          id: 'sec-projects',
          type: 'detailed',
          title: 'Projects',
          visible: true,
          items: [
            {
              id: 'item-proj-1',
              title: '',
              subtitle: '',
              startDate: '',
              endDate: '',
              location: '',
              link: '',
              bullets: ['']
            }
          ]
        },
        {
          id: 'sec-certifications',
          type: 'compact',
          title: 'Certifications & Achievements',
          visible: true,
          items: [
            {
              id: 'item-cert-1',
              title: '',
              issuer: '',
              date: '',
              details: ''
            }
          ]
        }
      ]
    };
  },

  // Available Section Types when the user clicks "+ Add New Section / Heading"
  sectionBlueprints: {
    detailed: {
      label: 'Detailed Entries (Experience, Projects, Volunteering, Leadership, Research)',
      defaultTitle: 'New Experience / Project Section',
      createDefaultItem: function () {
        return {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          title: '',
          subtitle: '',
          startDate: '',
          endDate: '',
          location: '',
          link: '',
          bullets: ['']
        };
      }
    },
    education: {
      label: 'Education / Academic Credentials',
      defaultTitle: 'Education',
      createDefaultItem: function () {
        return {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          institution: '',
          degree: '',
          date: '',
          gpa: '',
          location: '',
          details: '',
          bullets: []
        };
      }
    },
    skills: {
      label: 'Categorized Skills / Tools / Languages',
      defaultTitle: 'Skills & Competencies',
      createDefaultItem: function () {
        return {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          category: '',
          skillsText: ''
        };
      }
    },
    compact: {
      label: 'Compact List (Certifications, Awards, Honors, Publications, Courses)',
      defaultTitle: 'Certifications & Awards',
      createDefaultItem: function () {
        return {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          title: '',
          issuer: '',
          date: '',
          details: ''
        };
      }
    },
    bullets: {
      label: 'Bullet Point List Only (Key Achievements, Highlights, Extracurriculars)',
      defaultTitle: 'Key Highlights',
      createDefaultItem: function () {
        return '';
      }
    },
    text: {
      label: 'Freeform Paragraph / Text Block (Summary, Objective, Declaration, Custom)',
      defaultTitle: 'Custom Heading',
      createDefaultItem: function () {
        return '';
      }
    }
  },

  // Curated Color Swatches
  colorSwatches: [
    { name: 'Obsidian Slate', hex: '#0f172a' },
    { name: 'Royal Sapphire', hex: '#1d4ed8' },
    { name: 'Emerald Teal', hex: '#0f766e' },
    { name: 'Executive Indigo', hex: '#4338ca' },
    { name: 'Crimson Burgundy', hex: '#9f1239' },
    { name: 'Forest Pine', hex: '#14532d' },
    { name: 'Warm Charcoal', hex: '#27272a' },
    { name: 'Ocean Cyan', hex: '#0369a1' }
  ],

  // 6 Professional Templates
  templates: [
    {
      id: 'classic-ats',
      name: "Harvard / Classic ATS",
      badge: '99% ATS Parse Rate',
      desc: 'Gold-standard single-column layout with crisp rules and clean hierarchy.'
    },
    {
      id: 'modern-exec',
      name: 'Modern Executive',
      badge: 'Contemporary',
      desc: 'Refined header with subtle accent bars and modern typography.'
    },
    {
      id: 'tech-minimal',
      name: 'Tech Minimalist',
      badge: 'Clean & Sharp',
      desc: 'Geometric typography and high-density layout for technical & analytical roles.'
    },
    {
      id: 'sidebar-split',
      name: 'Executive Split Sidebar',
      badge: '2-Column',
      desc: 'Structured two-column design keeping skills, education, and awards in a side column.'
    },
    {
      id: 'swiss-grid',
      name: 'Swiss Architectural Grid',
      badge: 'Editorial',
      desc: 'Left-column section headings paired with structured right-column timelines.'
    },
    {
      id: 'compact-pro',
      name: 'Ultra-Compact One-Pager',
      badge: 'High Density',
      desc: 'Maximizes vertical space to fit extensive experience cleanly onto a single page.'
    }
  ],

  // Strong Action Verbs Dictionary by Category
  actionVerbs: {
    'Engineering & Technical': [
      'Architected', 'Engineered', 'Developed', 'Implemented', 'Refactored',
      'Automated', 'Containerized', 'Deployed', 'Integrated', 'Scaled',
      'Modernized', 'Programmed', 'Built', 'Configured', 'Decoupled'
    ],
    'Optimization & Impact': [
      'Accelerated', 'Optimized', 'Reduced', 'Streamlined', 'Eliminated',
      'Boosted', 'Maximized', 'Consolidated', 'Amplified', 'Revamped',
      'Slashed', 'Enhanced', 'Fortified', 'Outperformed', 'Simplified'
    ],
    'Leadership & Management': [
      'Spearheaded', 'Orchestrated', 'Directed', 'Pioneered', 'Championed',
      'Mentored', 'Led', 'Established', 'Mobilized', 'Governed',
      'Guided', 'Supervised', 'Instituted', 'Transformed', 'Chaired'
    ],
    'Data, Research & Analytics': [
      'Modeled', 'Forecasted', 'Quantified', 'Synthesized', 'Evaluated',
      'Analyzed', 'Uncovered', 'Trained', 'Fine-tuned', 'Benchmarked',
      'Correlated', 'Visualized', 'Extracted', 'Validated', 'Classified'
    ],
    'Business, Product & Growth': [
      'Launched', 'Conceptualized', 'Grew', 'Monetized', 'Expanded',
      'Positioned', 'Captured', 'Converted', 'Negotiated', 'Secured',
      'Partnered', 'Delivered', 'Piloted', 'Defined', 'Roadmapped'
    ]
  },

  // Weak phrases to detect and suggest replacements for
  weakPhrases: [
    { pattern: /^responsible for\s+/i, label: '"Responsible for"', replaceWith: 'Spearheaded / Owned / Directed' },
    { pattern: /^worked on\s+/i, label: '"Worked on"', replaceWith: 'Engineered / Developed / Executed' },
    { pattern: /^helped\s+(to\s+|with\s+)?/i, label: '"Helped with"', replaceWith: 'Collaborated to / Facilitated / Accelerated' },
    { pattern: /^assisted\s+(in\s+|with\s+)?/i, label: '"Assisted with"', replaceWith: 'Contributed to / Co-developed / Supported' },
    { pattern: /^tasked with\s+/i, label: '"Tasked with"', replaceWith: 'Delivered / Championed / Led' },
    { pattern: /^duties included\s+/i, label: '"Duties included"', replaceWith: 'Executed / Managed / Orchestrated' },
    { pattern: /^participated in\s+/i, label: '"Participated in"', replaceWith: 'Partnered on / Drove / Contributed to' },
    { pattern: /^was involved in\s+/i, label: '"Was involved in"', replaceWith: 'Engineered / Spearheaded / Implemented' }
  ]
};
