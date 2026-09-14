const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

async function buildPresentation() {
  const pptx = new PptxGenJS();

  // Widescreen 16:9 layout (13.333 x 7.5 inches)
  pptx.defineLayout({ name: 'WIDESCREEN_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDESCREEN_16x9';

  pptx.author = '2OS Founder & Executive Team';
  pptx.company = '2OS Accounting System';
  pptx.title = '2OS Pitch Deck - Authentic UI Architecture';
  pptx.subject = '2OS Bilateral Synchronization Accounting Platform';

  // Real 2OS App Color Palette (matching the React UI exactly)
  const C = {
    canvasBg: 'F0F4F8',        // App background canvas
    cardBg: 'FFFFFF',          // Pure white card
    topBarBg: 'EDF6FC',        // Real 2OS Top Bar soft sky
    topBarBorder: 'BAE6FD',    // Sky-200 border
    
    textDark: '0F172A',        // Slate-900 (crisp high contrast)
    textNavy: '0369A1',        // Real 2OS primary blue / header
    textBody: '334155',        // Slate-700
    textMuted: '64748B',       // Slate-500
    textWhite: 'FFFFFF',
    
    brandCyan: '0284C7',       // Sky-600
    brandBlue: '2563EB',       // Blue-600 for primary action buttons
    brandSkyTint: 'E0F2FE',    // Active tool fill
    borderSkyActive: '38BDF8', // Cyan-400 active tool border
    borderCard: 'E2E8F0',      // Slate-200 card borders
    
    // Status colors
    greenPillBg: 'DCFCE7',
    greenPillText: '166534',
    greenPillBorder: '86EFAC',
    
    amberBtnBg: 'FEF3C7',
    amberBtnBorder: 'FCD34D',
    amberBtnText: 'B45309',

    tableHeaderBg: 'F1F5F9',
    tableBorder: 'CBD5E1'
  };

  const defaultFont = 'Calibri';
  const headingFont = 'Segoe UI';

  // Helper: Glow banner at top edge
  function addTopBanner(slide) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.08,
      fill: { color: C.brandCyan }
    });
  }

  // Helper: Slide Header (Title, Subtitle, Category badge)
  function addSlideHeading(slide, badge, title, subtitle) {
    addTopBanner(slide);

    // Pill badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 0.22,
      w: 2.6,
      h: 0.28,
      rectRadius: 0.14,
      fill: { color: 'E0F2FE' },
      line: { color: C.brandCyan, width: 1 }
    });
    slide.addText(badge.toUpperCase(), {
      x: 0.6,
      y: 0.22,
      w: 2.6,
      h: 0.28,
      fontSize: 8.5,
      fontFace: defaultFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    slide.addText(title, {
      x: 0.6,
      y: 0.52,
      w: 12.133,
      h: 0.45,
      fontSize: 18,
      fontFace: headingFont,
      bold: true,
      color: C.textDark
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.6,
        y: 0.96,
        w: 12.133,
        h: 0.26,
        fontSize: 9.5,
        fontFace: defaultFont,
        color: C.textMuted
      });
    }
  }

  // Helper: Render the REAL 2OS Top Bar, Ribbon Tabs, Toolbar, and Bottom Bar
  function renderAuthentic2OSFrame(
    slide,
    options
  ) {
    const {
      activeCategory = 'OTHER TRANSACTIONS',
      activeToolKey = 'payroll',
      categoryTools = [],
      categoryToolsGroupLabel = 'OTHER TRANSACTIONS TOOLS',
      selectedEntity = 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle = 'PAYROLL REGISTER & STATUTORY REMITTANCES',
      periodLabel = 'FOR THE MONTH OF AUGUST 2026'
    } = options;

    const frameX = 0.6;
    const frameW = 12.133;

    // -------------------------------------------------------------
    // 1. TOP WINDOW BAR (Real 2OS Window Header)
    // -------------------------------------------------------------
    const topY = 1.3;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX,
      y: topY,
      w: frameW,
      h: 0.52,
      rectRadius: 0.08,
      fill: { color: C.topBarBg },
      line: { color: C.topBarBorder, width: 1 }
    });

    // 1.1 Left: 2OS Logo Box (Chromatic gradient effect)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 0.15,
      y: topY + 0.08,
      w: 0.5,
      h: 0.36,
      rectRadius: 0.08,
      fill: { color: '2563EB' }
    });
    slide.addText('2OS', {
      x: frameX + 0.15,
      y: topY + 0.08,
      w: 0.5,
      h: 0.36,
      fontSize: 11,
      fontFace: headingFont,
      bold: true,
      color: C.textWhite,
      align: 'center',
      valign: 'middle'
    });

    // 1.2 App Title & Subtitle
    slide.addText('2OS ACCOUNTING SYSTEM', {
      x: frameX + 0.72,
      y: topY + 0.06,
      w: 3.5,
      h: 0.22,
      fontSize: 10,
      fontFace: headingFont,
      bold: true,
      color: C.textDark,
      valign: 'middle'
    });
    slide.addText('Philippine Tax & PFRS Books of Accounts', {
      x: frameX + 0.72,
      y: topY + 0.26,
      w: 3.5,
      h: 0.18,
      fontSize: 7.5,
      fontFace: defaultFont,
      color: C.textNavy,
      valign: 'middle'
    });

    // 1.3 Center: "SELECTED ENTITY: [🏢 Select Entity ▾]"
    slide.addText('SELECTED ENTITY:', {
      x: frameX + 4.3,
      y: topY + 0.1,
      w: 1.5,
      h: 0.32,
      fontSize: 8.5,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy,
      align: 'right',
      valign: 'middle'
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 5.9,
      y: topY + 0.1,
      w: 1.8,
      h: 0.32,
      rectRadius: 0.16,
      fill: { color: C.cardBg },
      line: { color: C.topBarBorder, width: 1 }
    });
    slide.addText('[icon:building] Select Entity  ▾', {
      x: frameX + 5.9,
      y: topY + 0.1,
      w: 1.8,
      h: 0.32,
      fontSize: 8,
      fontFace: defaultFont,
      color: C.textDark,
      align: 'center',
      valign: 'middle'
    });

    // 1.4 Right: "[🗄️ InfinityFree & MySQL]" pill button
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 8.8,
      y: topY + 0.1,
      w: 2.1,
      h: 0.32,
      rectRadius: 0.16,
      fill: { color: C.cardBg },
      line: { color: '22C55E', width: 1.2 }
    });
    slide.addText('[db] InfinityFree & MySQL', {
      x: frameX + 8.8,
      y: topY + 0.1,
      w: 2.1,
      h: 0.32,
      fontSize: 8,
      fontFace: defaultFont,
      bold: true,
      color: '15803D',
      align: 'center',
      valign: 'middle'
    });

    // 1.5 Right Avatar & Window controls
    slide.addShape(pptx.ShapeType.ellipse, {
      x: frameX + 11.05,
      y: topY + 0.11,
      w: 0.3,
      h: 0.3,
      fill: { color: 'E0F2FE' },
      line: { color: C.brandCyan, width: 1 }
    });
    slide.addText('AC', {
      x: frameX + 11.05,
      y: topY + 0.11,
      w: 0.3,
      h: 0.3,
      fontSize: 7.5,
      fontFace: headingFont,
      bold: true,
      color: C.brandCyan,
      align: 'center',
      valign: 'middle'
    });
    slide.addText('—   ▢   ✕', {
      x: frameX + 11.45,
      y: topY + 0.1,
      w: 0.6,
      h: 0.32,
      fontSize: 8,
      fontFace: defaultFont,
      color: C.textMuted,
      align: 'center',
      valign: 'middle'
    });

    // -------------------------------------------------------------
    // 2. RIBBON CATEGORY TABS BAR
    // -------------------------------------------------------------
    const tabsY = topY + 0.54;
    slide.addShape(pptx.ShapeType.rect, {
      x: frameX,
      y: tabsY,
      w: frameW,
      h: 0.38,
      fill: { color: C.topBarBg },
      line: { color: C.topBarBorder, width: 1 }
    });

    const ribbonTabs = [
      { key: 'HOME', label: 'Home', icon: '⏱️' },
      { key: 'DIRECTORY', label: 'Directory', icon: '🏢' },
      { key: 'BOOKS OF ACCOUNTS', label: 'Books of Accounts', icon: '📖' },
      { key: 'OTHER TRANSACTIONS', label: 'Other Transactions', icon: '📑' },
      { key: 'FINANCIAL STATEMENTS', label: 'Financial Statements', icon: '🏛️' },
      { key: 'BIR COMPUTATIONS', label: 'BIR Computations', icon: '🛡️' }
    ];

    let curTabX = frameX + 0.15;
    ribbonTabs.forEach(tab => {
      const isActive = tab.key === activeCategory;
      const tabW = tab.label.length * 0.088 + 0.48;

      if (isActive) {
        // Active Tab: Pure white card with cyan bottom indicator
        slide.addShape(pptx.ShapeType.roundRect, {
          x: curTabX,
          y: tabsY + 0.04,
          w: tabW,
          h: 0.34,
          rectRadius: 0.06,
          fill: { color: C.cardBg },
          line: { color: C.topBarBorder, width: 1 }
        });
        // Cyan bottom accent line
        slide.addShape(pptx.ShapeType.rect, {
          x: curTabX,
          y: tabsY + 0.34,
          w: tabW,
          h: 0.04,
          fill: { color: '06B6D4' }
        });
      }

      slide.addText(`${tab.icon} ${tab.label}`, {
        x: curTabX,
        y: tabsY + 0.04,
        w: tabW,
        h: 0.3,
        fontSize: 8.5,
        fontFace: headingFont,
        bold: isActive,
        color: isActive ? C.textDark : C.textBody,
        align: 'center',
        valign: 'middle'
      });

      curTabX += tabW + 0.08;
    });

    // Settings tab on far right
    slide.addText('⚙️ Settings', {
      x: frameX + frameW - 1.2,
      y: tabsY + 0.04,
      w: 1.1,
      h: 0.3,
      fontSize: 8.5,
      fontFace: headingFont,
      bold: false,
      color: C.textBody,
      align: 'right',
      valign: 'middle'
    });

    // -------------------------------------------------------------
    // 3. RIBBON TOOLBAR (Category Tools on Left, Export & Convert on Right)
    // -------------------------------------------------------------
    const toolY = tabsY + 0.38;
    const toolH = 0.92;
    slide.addShape(pptx.ShapeType.rect, {
      x: frameX,
      y: toolY,
      w: frameW,
      h: toolH,
      fill: { color: C.cardBg },
      line: { color: C.topBarBorder, width: 1 }
    });

    // 3.1 Category Tools (Left Group)
    let toolBtnX = frameX + 0.15;
    categoryTools.forEach(tool => {
      const isActive = tool.key === activeToolKey;
      const btnW = 1.05;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: toolBtnX,
        y: toolY + 0.08,
        w: btnW,
        h: 0.62,
        rectRadius: 0.1,
        fill: { color: isActive ? C.brandSkyTint : C.cardBg },
        line: { color: isActive ? C.borderSkyActive : 'E2E8F0', width: isActive ? 1.5 : 0.8 }
      });

      slide.addText(tool.icon, {
        x: toolBtnX,
        y: toolY + 0.12,
        w: btnW,
        h: 0.28,
        fontSize: 14,
        align: 'center',
        valign: 'middle'
      });

      slide.addText(tool.label, {
        x: toolBtnX + 0.04,
        y: toolY + 0.38,
        w: btnW - 0.08,
        h: 0.28,
        fontSize: 7.5,
        fontFace: defaultFont,
        bold: isActive,
        color: isActive ? C.brandCyan : C.textDark,
        align: 'center',
        valign: 'middle'
      });

      toolBtnX += btnW + 0.12;
    });

    // Category Tools group label underneath
    slide.addText(categoryToolsGroupLabel, {
      x: frameX + 0.2,
      y: toolY + 0.72,
      w: 4.5,
      h: 0.18,
      fontSize: 7,
      fontFace: headingFont,
      bold: true,
      color: '0284C7'
    });

    // Vertical divider before Export & Convert
    const exportX = frameX + frameW - 3.2;
    slide.addShape(pptx.ShapeType.rect, {
      x: exportX - 0.15,
      y: toolY + 0.08,
      w: 0.02,
      h: 0.76,
      fill: { color: C.topBarBorder }
    });

    // 3.2 Right: "EXPORT & CONVERT" group
    const exportTools = [
      { icon: '📄', label: 'Export\nSheet' },
      { icon: '📥', label: 'Work-\nbook' },
      { icon: '🖨️', label: 'Print' },
      { icon: '📤', label: 'Import' }
    ];

    let expX = exportX;
    exportTools.forEach(exp => {
      const expW = 0.65;
      slide.addText(exp.icon, {
        x: expX,
        y: toolY + 0.1,
        w: expW,
        h: 0.25,
        fontSize: 12,
        align: 'center'
      });
      slide.addText(exp.label, {
        x: expX,
        y: toolY + 0.34,
        w: expW,
        h: 0.34,
        fontSize: 7,
        fontFace: defaultFont,
        color: C.textDark,
        align: 'center',
        valign: 'middle'
      });
      expX += expW + 0.1;
    });

    // Export & Convert group label underneath
    slide.addText('EXPORT & CONVERT', {
      x: exportX,
      y: toolY + 0.72,
      w: 2.9,
      h: 0.18,
      fontSize: 7,
      fontFace: headingFont,
      bold: true,
      color: '0284C7',
      align: 'center'
    });

    // -------------------------------------------------------------
    // 4. DOCUMENT SHEET HEADER CARD
    // -------------------------------------------------------------
    const docHeadY = toolY + toolH + 0.14;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX,
      y: docHeadY,
      w: frameW,
      h: 0.86,
      rectRadius: 0.1,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    // 4.1 "SELECTED ENTITY [CONSOLIDATED (ALL BRANCHES)]"
    slide.addText('SELECTED ENTITY', {
      x: frameX + 3.8,
      y: docHeadY + 0.06,
      w: 2.2,
      h: 0.22,
      fontSize: 9,
      fontFace: headingFont,
      bold: true,
      color: C.textDark,
      align: 'right',
      valign: 'middle'
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 6.1,
      y: docHeadY + 0.06,
      w: 2.8,
      h: 0.22,
      rectRadius: 0.11,
      fill: { color: 'E0F2FE' },
      line: { color: 'BAE6FD', width: 0.8 }
    });
    slide.addText(selectedEntity.toUpperCase(), {
      x: frameX + 6.1,
      y: docHeadY + 0.06,
      w: 2.8,
      h: 0.22,
      fontSize: 7.5,
      fontFace: defaultFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    // 4.2 Journal / Report Title (Bold Navy)
    slide.addText(journalTitle, {
      x: frameX + 0.5,
      y: docHeadY + 0.3,
      w: frameW - 1.0,
      h: 0.28,
      fontSize: 13,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    // 4.3 Date Period Pill Button: [📅 FOR THE MONTH OF AUGUST 2026 ▾]
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 4.2,
      y: docHeadY + 0.58,
      w: 3.733,
      h: 0.22,
      rectRadius: 0.11,
      fill: { color: C.cardBg },
      line: { color: C.topBarBorder, width: 0.8 }
    });
    slide.addText(`📅 ${periodLabel} ▾`, {
      x: frameX + 4.2,
      y: docHeadY + 0.58,
      w: 3.733,
      h: 0.22,
      fontSize: 7.5,
      fontFace: defaultFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    // -------------------------------------------------------------
    // 5. BOTTOM SHEETS & BRANCHES BAR
    // -------------------------------------------------------------
    const sheetBarY = 6.95;
    slide.addShape(pptx.ShapeType.rect, {
      x: frameX,
      y: sheetBarY,
      w: frameW,
      h: 0.38,
      fill: { color: C.topBarBg },
      line: { color: C.topBarBorder, width: 1 }
    });

    slide.addText('<  >', {
      x: frameX + 0.15,
      y: sheetBarY + 0.05,
      w: 0.45,
      h: 0.28,
      fontSize: 9,
      bold: true,
      color: C.textMuted,
      valign: 'middle'
    });

    slide.addText('🪢 SHEETS:', {
      x: frameX + 0.65,
      y: sheetBarY + 0.05,
      w: 0.9,
      h: 0.28,
      fontSize: 8,
      fontFace: headingFont,
      bold: true,
      color: C.textDark,
      valign: 'middle'
    });

    // Active sheet pill: [🏢 Consolidated Aggregated]
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 1.6,
      y: sheetBarY + 0.05,
      w: 2.3,
      h: 0.28,
      rectRadius: 0.14,
      fill: { color: C.brandCyan }
    });
    slide.addText('🏢 Consolidated   [Aggregated]', {
      x: frameX + 1.6,
      y: sheetBarY + 0.05,
      w: 2.3,
      h: 0.28,
      fontSize: 7.5,
      fontFace: defaultFont,
      bold: true,
      color: C.textWhite,
      align: 'center',
      valign: 'middle'
    });

    // Inactive sheet pill: [🏢 Head Office Main]
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + 4.0,
      y: sheetBarY + 0.05,
      w: 2.0,
      h: 0.28,
      rectRadius: 0.14,
      fill: { color: C.cardBg },
      line: { color: C.topBarBorder, width: 1 }
    });
    slide.addText('🏢 Head Office   [Main]', {
      x: frameX + 4.0,
      y: sheetBarY + 0.05,
      w: 2.0,
      h: 0.28,
      fontSize: 7.5,
      fontFace: defaultFont,
      color: C.textDark,
      align: 'center',
      valign: 'middle'
    });

    // Far right: [🏢 Manage Branches]
    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX + frameW - 2.1,
      y: sheetBarY + 0.05,
      w: 1.95,
      h: 0.28,
      rectRadius: 0.14,
      fill: { color: C.cardBg },
      line: { color: C.brandCyan, width: 1 }
    });
    slide.addText('🏢 Manage Branches', {
      x: frameX + frameW - 2.1,
      y: sheetBarY + 0.05,
      w: 1.95,
      h: 0.28,
      fontSize: 8,
      fontFace: defaultFont,
      bold: true,
      color: C.brandCyan,
      align: 'center',
      valign: 'middle'
    });

    return {
      contentX: frameX,
      contentY: docHeadY + 0.86 + 0.1,
      contentW: frameW,
      contentH: sheetBarY - (docHeadY + 0.86 + 0.1) - 0.08
    };
  }

  // =========================================================================
  // SLIDE 1: COVER SLIDE
  // =========================================================================
  {
    console.log('Generating Slide 1: Cover...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addTopBanner(slide);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9,
      y: 0.9,
      w: 5.6,
      h: 0.38,
      rectRadius: 0.19,
      fill: { color: 'E0F2FE' },
      line: { color: C.brandCyan, width: 1.2 }
    });
    slide.addText('FILIPINO ROOT: "TUOS" (ACCOUNTING) • BILATERAL SYMMETRY', {
      x: 0.9,
      y: 0.9,
      w: 5.6,
      h: 0.38,
      fontSize: 9,
      fontFace: defaultFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    slide.addText('2OS', {
      x: 0.9,
      y: 1.35,
      w: 11.5,
      h: 1.1,
      fontSize: 60,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy
    });

    slide.addText('2-Parties Oriented & Synchronized Accounting System', {
      x: 0.9,
      y: 2.5,
      w: 11.5,
      h: 0.45,
      fontSize: 20,
      fontFace: defaultFont,
      bold: true,
      color: C.textDark
    });

    slide.addText('Designed with MS Office-Style Ribbon, Familiar Spreadsheets, and Statutory Philippine Compliance', {
      x: 0.9,
      y: 2.95,
      w: 11.5,
      h: 0.35,
      fontSize: 11.5,
      fontFace: defaultFont,
      color: C.textMuted
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9,
      y: 3.45,
      w: 11.5,
      h: 1.5,
      rectRadius: 0.12,
      fill: { color: C.cardBg },
      line: { color: 'D97706', width: 1.5 }
    });

    slide.addText(
      '"Because every progress is always supported by a strong foundation,\nand 2OS will not only be the bridge but also the foundation."',
      {
        x: 1.2,
        y: 3.55,
        w: 10.9,
        h: 1.3,
        fontSize: 16,
        fontFace: defaultFont,
        italic: true,
        bold: true,
        color: 'B45309',
        align: 'left',
        valign: 'middle'
      }
    );

    const pillars = [
      { label: 'MS Office Style UI', desc: 'Familiar tabs, grouped toolbars, quick actions & multi-sheet bottom navigator', color: C.brandCyan },
      { label: 'Bilateral Sync', desc: 'Synchronizes Internal Operations with BIR, Banks & External Audits', color: '0D9488' },
      { label: 'Micro to Enterprise', desc: 'From sari-sari cash registers to consolidated holding financial statements', color: '4F46E5' }
    ];

    pillars.forEach((p, idx) => {
      const px = 0.9 + idx * 3.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px,
        y: 5.2,
        w: 3.6,
        h: 1.3,
        rectRadius: 0.1,
        fill: { color: C.cardBg },
        line: { color: C.borderCard, width: 1 }
      });
      slide.addText(p.label, {
        x: px + 0.2,
        y: 5.3,
        w: 3.2,
        h: 0.35,
        fontSize: 11,
        fontFace: headingFont,
        bold: true,
        color: p.color
      });
      slide.addText(p.desc, {
        x: px + 0.2,
        y: 5.65,
        w: 3.2,
        h: 0.75,
        fontSize: 9.5,
        fontFace: defaultFont,
        color: C.textBody
      });
    });
  }

  // =========================================================================
  // SLIDE 2: APP ANATOMY & MS OFFICE DESIGN
  // =========================================================================
  {
    console.log('Generating Slide 2: Architecture...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '01. Interface Architecture', 'Authentic MS Office-Style Anatomy: Zero Training Resistance', 'Direct translation of desktop Office conventions into a fast, responsive web accounting workspace.');

    const layoutBlocks = [
      {
        x: 0.9,
        y: 1.45,
        w: 11.533,
        h: 0.55,
        bg: C.topBarBg,
        border: C.topBarBorder,
        title: '1. WINDOW TITLE BAR & GLOBAL CONTROLS',
        desc: 'Logo with chromatic badge, Entity Switcher (Head Office vs Branches), InfinityFree & MySQL connection status, user profile, and window controls.'
      },
      {
        x: 0.9,
        y: 2.12,
        w: 11.533,
        h: 0.55,
        bg: C.topBarBg,
        border: C.topBarBorder,
        title: '2. RIBBON CATEGORY TABS (6 CORE DOMAINS + SETTINGS)',
        desc: 'Home | Directory | Books of Accounts | Other Transactions | Financial Statements | BIR Computations | Settings'
      },
      {
        x: 0.9,
        y: 2.79,
        w: 11.533,
        h: 0.9,
        bg: C.cardBg,
        border: C.brandCyan,
        title: '3. GROUPED RIBBON TOOLBAR & EXPORT/CONVERT PANEL',
        desc: 'Left: Domain-specific tools (Payroll, Depreciation, Inventory, Bank Recon). Right: Instant 1-click Export Sheet, Full Workbook XLSX, Print, and Import Data.'
      },
      {
        x: 0.9,
        y: 3.81,
        w: 11.533,
        h: 0.75,
        bg: C.cardBg,
        border: C.borderCard,
        title: '4. CONSOLIDATED DOCUMENT & TAXPAYER HEADER CARD',
        desc: 'Displays active legal entity, branch scope [CONSOLIDATED (ALL BRANCHES)], formal Philippine journal title, and interactive reporting period picker.'
      },
      {
        x: 0.9,
        y: 4.68,
        w: 11.533,
        h: 1.4,
        bg: C.cardBg,
        border: C.borderCard,
        title: '5. INTERACTIVE SPREADSHEET CANVAS & STATUTORY FORM CARDS',
        desc: 'Action toolbars (Load Model Image, Add Entry, Logs), fillable statutory form inputs matching BIR line items, and audit-ready data tables.'
      },
      {
        x: 0.9,
        y: 6.2,
        w: 11.533,
        h: 0.55,
        bg: C.topBarBg,
        border: C.topBarBorder,
        title: '6. WORKBOOK SHEET BAR (BRANCHES & MULTI-VIEW NAVIGATION)',
        desc: 'Sheet navigation (< >), active sheets pills [Consolidated Aggregated] [Head Office Main], and [Manage Branches] modal launcher.'
      }
    ];

    layoutBlocks.forEach(b => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        rectRadius: 0.08,
        fill: { color: b.bg },
        line: { color: b.border || b.bg, width: 1 }
      });
      slide.addText(b.title, {
        x: b.x + 0.2,
        y: b.y + 0.06,
        w: b.w - 0.4,
        h: 0.24,
        fontSize: 10,
        fontFace: headingFont,
        bold: true,
        color: C.textNavy
      });
      slide.addText(b.desc, {
        x: b.x + 0.2,
        y: b.y + 0.3,
        w: b.w - 0.4,
        h: b.h - 0.34,
        fontSize: 9,
        fontFace: defaultFont,
        color: C.textBody
      });
    });
  }

  // =========================================================================
  // SLIDE 3: HOME RIBBON - EXECUTIVE DASHBOARD
  // =========================================================================
  {
    console.log('Generating Slide 3: Home Ribbon...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '02. Ribbon Module', 'HOME Ribbon: Executive Financial Monitoring Dashboard', 'High-level business intelligence, financial health ratios, chart of accounts, and Philippine tax calendar.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'HOME',
      activeToolKey: 'dashboard',
      categoryTools: [
        { key: 'dashboard', label: 'Dashboard', icon: '⏱️' },
        { key: 'reports', label: 'Reports &\nAnalysis', icon: '🧮' },
        { key: 'account_titles', label: 'Chart of\nAccounts', icon: '📖' },
        { key: 'tax_calendar', label: 'Calendar', icon: '📅' },
        { key: 'about_app', label: 'Activity\nLists', icon: '📊' }
      ],
      categoryToolsGroupLabel: 'HOME TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'EXECUTIVE FINANCIAL MONITORING DASHBOARD',
      periodLabel: 'AS OF AUGUST 31, 2026'
    });

    // Content: 4 Metric Cards + Runway Chart
    const metrics = [
      { label: 'Gross Revenue (YTD)', val: '₱ 2,450,800.00', sub: '+18.4% vs prev quarter', color: C.textNavy },
      { label: 'Total Operating Expenses', val: '₱ 1,180,450.00', sub: 'Gross Profit: ₱1,270,350', color: '0D9488' },
      { label: 'Net Cash Position', val: '₱ 894,200.00', sub: 'In Bank & Petty Cash', color: '16A34A' },
      { label: 'Estimated BIR Tax Due', val: '₱ 124,650.00', sub: 'Q3 2550Q / 1702Q Provision', color: 'D97706' }
    ];

    metrics.forEach((m, idx) => {
      const mx = layout.contentX + idx * 3.06;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: mx,
        y: layout.contentY,
        w: 2.95,
        h: 0.95,
        rectRadius: 0.08,
        fill: { color: C.cardBg },
        line: { color: C.borderCard, width: 1 }
      });
      slide.addText(m.label, {
        x: mx + 0.15,
        y: layout.contentY + 0.08,
        w: 2.65,
        h: 0.22,
        fontSize: 8.5,
        fontFace: defaultFont,
        color: C.textMuted
      });
      slide.addText(m.val, {
        x: mx + 0.15,
        y: layout.contentY + 0.3,
        w: 2.65,
        h: 0.35,
        fontSize: 13,
        fontFace: headingFont,
        bold: true,
        color: m.color
      });
      slide.addText(m.sub, {
        x: mx + 0.15,
        y: layout.contentY + 0.65,
        w: 2.65,
        h: 0.2,
        fontSize: 8,
        fontFace: defaultFont,
        color: C.textBody
      });
    });

    // Runway container
    const chartY = layout.contentY + 1.05;
    const chartH = layout.contentH - 1.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: chartY,
      w: layout.contentW,
      h: chartH,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    slide.addText('REVENUE VS. OPERATING EXPENSE RUNWAY (LAST 6 MONTHS)  •  LIVE PFRS BENCHMARKS', {
      x: layout.contentX + 0.3,
      y: chartY + 0.1,
      w: 8.0,
      h: 0.25,
      fontSize: 9,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy
    });

    const months = [
      { m: 'APR', rev: 320, exp: 180 },
      { m: 'MAY', rev: 410, exp: 210 },
      { m: 'JUN', rev: 390, exp: 195 },
      { m: 'JUL', rev: 460, exp: 230 },
      { m: 'AUG', rev: 520, exp: 240 },
      { m: 'SEP', rev: 350, exp: 125 }
    ];

    months.forEach((d, i) => {
      const bx = layout.contentX + 0.6 + i * 1.85;
      const revH = (d.rev / 550) * 0.7;
      slide.addShape(pptx.ShapeType.rect, {
        x: bx,
        y: chartY + 0.95 - revH,
        w: 0.45,
        h: revH,
        fill: { color: C.brandCyan }
      });
      const expH = (d.exp / 550) * 0.7;
      slide.addShape(pptx.ShapeType.rect, {
        x: bx + 0.48,
        y: chartY + 0.95 - expH,
        w: 0.45,
        h: expH,
        fill: { color: 'D97706' }
      });
      slide.addText(d.m, {
        x: bx,
        y: chartY + 1.0,
        w: 0.95,
        h: 0.2,
        fontSize: 8,
        fontFace: defaultFont,
        bold: true,
        color: C.textMuted,
        align: 'center'
      });
    });
  }

  // =========================================================================
  // SLIDE 4: DIRECTORY RIBBON - CUSTOMERS MASTERLIST
  // =========================================================================
  {
    console.log('Generating Slide 4: Directory...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '03. Ribbon Module', 'DIRECTORY Ribbon: Masterlist & Stakeholder Management', 'Centralized registry of Legal Entities, Registered Customers, Vendors, Staff, and Billable Products/Services.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'DIRECTORY',
      activeToolKey: 'customers',
      categoryTools: [
        { key: 'companies', label: 'Entity', icon: '🏢' },
        { key: 'customers', label: 'Customers', icon: '👥' },
        { key: 'providers', label: 'Service\nProviders', icon: '🚚' },
        { key: 'employees', label: 'Employees', icon: '👤' },
        { key: 'inventory_services', label: 'Product/Services\nList', icon: '📁' }
      ],
      categoryToolsGroupLabel: 'DIRECTORY TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'CUSTOMER MASTERLIST & RECEIVABLES SCHEDULE',
      periodLabel: 'AS OF AUGUST 31, 2026'
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: layout.contentY,
      w: layout.contentW,
      h: layout.contentH,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    // Table Header
    slide.addShape(pptx.ShapeType.rect, {
      x: layout.contentX + 0.2,
      y: layout.contentY + 0.15,
      w: layout.contentW - 0.4,
      h: 0.32,
      fill: { color: C.tableHeaderBg }
    });
    slide.addText('REGISTERED TIN', { x: layout.contentX + 0.3, y: layout.contentY + 0.15, w: 2.2, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('CUSTOMER / TRADE NAME', { x: layout.contentX + 2.6, y: layout.contentY + 0.15, w: 3.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('REGISTERED ADDRESS', { x: layout.contentX + 6.2, y: layout.contentY + 0.15, w: 2.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('TAX CLASSIFICATION', { x: layout.contentX + 8.8, y: layout.contentY + 0.15, w: 1.6, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('A/R BALANCE', { x: layout.contentX + 10.5, y: layout.contentY + 0.15, w: 1.3, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });

    const custRows = [
      { tin: '123-456-789-00000', name: 'Ayala Commercial Properties Inc.', address: 'Makati City, Metro Manila', type: 'VAT Registered', balance: '₱ 245,000.00' },
      { tin: '987-654-321-00001', name: 'Jollibee Foods Franchise Corp.', address: 'Pasig City, Metro Manila', type: 'VAT Registered', balance: '₱ 112,400.00' },
      { tin: '456-789-012-00000', name: 'San Miguel Logistics Dist. LLC', address: 'Mandaluyong City', type: 'VAT Registered', balance: '₱ 580,200.00' },
      { tin: '321-654-987-00000', name: 'BGC Creative Digital Agency', address: 'Taguig City, Metro Manila', type: 'Non-VAT (8%)', balance: '₱ 45,000.00' }
    ];

    custRows.forEach((r, i) => {
      const ry = layout.contentY + 0.5 + i * 0.4;
      slide.addShape(pptx.ShapeType.rect, {
        x: layout.contentX + 0.2,
        y: ry,
        w: layout.contentW - 0.4,
        h: 0.38,
        fill: { color: i % 2 === 0 ? C.cardBg : 'F8FAFC' },
        line: { color: 'F1F5F9', width: 0.5 }
      });
      slide.addText(r.tin, { x: layout.contentX + 0.3, y: ry, w: 2.2, h: 0.38, fontSize: 8, fontFace: 'Consolas', color: C.textNavy, valign: 'middle' });
      slide.addText(r.name, { x: layout.contentX + 2.6, y: ry, w: 3.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, bold: true, color: C.textDark, valign: 'middle' });
      slide.addText(r.address, { x: layout.contentX + 6.2, y: ry, w: 2.5, h: 0.38, fontSize: 8, fontFace: defaultFont, color: C.textMuted, valign: 'middle' });
      slide.addText(r.type, { x: layout.contentX + 8.8, y: ry, w: 1.6, h: 0.38, fontSize: 8, fontFace: defaultFont, color: C.textDark, valign: 'middle' });
      slide.addText(r.balance, { x: layout.contentX + 10.5, y: ry, w: 1.3, h: 0.38, fontSize: 8.5, fontFace: defaultFont, bold: true, color: '0D9488', valign: 'middle' });
    });
  }

  // =========================================================================
  // SLIDE 5: BOOKS OF ACCOUNTS - SUBSIDIARY SALES JOURNAL
  // =========================================================================
  {
    console.log('Generating Slide 5: Books of Accounts...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '04. Ribbon Module', 'BOOKS OF ACCOUNTS Ribbon: General Journal & Subsidiary Ledgers', 'Complete Philippine statutory books: Sales, Purchases, Receipts, Disbursements, and General Ledger.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'BOOKS OF ACCOUNTS',
      activeToolKey: 'sales',
      categoryTools: [
        { key: 'sales', label: 'Subsidiary\nSales', icon: '🧾' },
        { key: 'expenses', label: 'Subsidiary\nPurchases', icon: '🧾' },
        { key: 'collections', label: 'Cash\nReceipts', icon: '🪙' },
        { key: 'payments', label: 'Cash\nDisbursements', icon: '💵' },
        { key: 'general_journal', label: 'General\nJournal', icon: '📖' },
        { key: 'general_ledger', label: 'General\nLedger', icon: '📊' }
      ],
      categoryToolsGroupLabel: 'BOOKS OF ACCOUNTS TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'SALES JOURNAL / REVENUE REGISTER',
      periodLabel: 'FOR THE MONTH OF AUGUST 2026'
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: layout.contentY,
      w: layout.contentW,
      h: layout.contentH,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: layout.contentX + 0.2,
      y: layout.contentY + 0.15,
      w: layout.contentW - 0.4,
      h: 0.32,
      fill: { color: C.tableHeaderBg }
    });
    slide.addText('DATE / REF', { x: layout.contentX + 0.3, y: layout.contentY + 0.15, w: 2.0, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('CUSTOMER NAME', { x: layout.contentX + 2.4, y: layout.contentY + 0.15, w: 3.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('VATABLE SALES', { x: layout.contentX + 6.0, y: layout.contentY + 0.15, w: 1.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('OUTPUT VAT (12%)', { x: layout.contentX + 7.6, y: layout.contentY + 0.15, w: 1.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('2307 CWT (2%)', { x: layout.contentX + 9.2, y: layout.contentY + 0.15, w: 1.2, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('TOTAL AMOUNT', { x: layout.contentX + 10.5, y: layout.contentY + 0.15, w: 1.3, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });

    const salesRows = [
      { date: '2026-08-05  INV-0042', party: 'Ayala Commercial Properties Inc.', vatable: '₱ 100,000.00', vat: '₱ 12,000.00', cwt: '₱ 2,000.00', total: '₱ 112,000.00' },
      { date: '2026-08-12  INV-0043', party: 'SM Prime Holdings Inc.', vatable: '₱ 250,000.00', vat: '₱ 30,000.00', cwt: '₱ 5,000.00', total: '₱ 280,000.00' },
      { date: '2026-08-18  INV-0044', party: 'Jollibee Foods Franchise', vatable: '₱ 75,000.00', vat: '₱ 9,000.00', cwt: '₱ 1,500.00', total: '₱ 84,000.00' },
      { date: '2026-08-25  INV-0045', party: 'BGC Creative Digital Agency', vatable: '₱ 50,000.00', vat: '₱ 6,000.00', cwt: '₱ 1,000.00', total: '₱ 56,000.00' }
    ];

    salesRows.forEach((r, i) => {
      const ry = layout.contentY + 0.5 + i * 0.4;
      slide.addShape(pptx.ShapeType.rect, {
        x: layout.contentX + 0.2,
        y: ry,
        w: layout.contentW - 0.4,
        h: 0.38,
        fill: { color: i % 2 === 0 ? C.cardBg : 'F8FAFC' },
        line: { color: 'F1F5F9', width: 0.5 }
      });
      slide.addText(r.date, { x: layout.contentX + 0.3, y: ry, w: 2.0, h: 0.38, fontSize: 8, fontFace: 'Consolas', color: C.textNavy, valign: 'middle' });
      slide.addText(r.party, { x: layout.contentX + 2.4, y: ry, w: 3.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, bold: true, color: C.textDark, valign: 'middle' });
      slide.addText(r.vatable, { x: layout.contentX + 6.0, y: ry, w: 1.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, color: C.textDark, valign: 'middle' });
      slide.addText(r.vat, { x: layout.contentX + 7.6, y: ry, w: 1.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, color: '0D9488', valign: 'middle' });
      slide.addText(r.cwt, { x: layout.contentX + 9.2, y: ry, w: 1.2, h: 0.38, fontSize: 8.5, fontFace: defaultFont, color: 'D97706', valign: 'middle' });
      slide.addText(r.total, { x: layout.contentX + 10.5, y: ry, w: 1.3, h: 0.38, fontSize: 8.5, fontFace: defaultFont, bold: true, color: C.textNavy, valign: 'middle' });
    });
  }

  // =========================================================================
  // SLIDE 6: OTHER TRANSACTIONS RIBBON - STATUTORY PAYROLL (EXACT MATCH TO APP)
  // =========================================================================
  {
    console.log('Generating Slide 6: Other Transactions / Payroll (Exact App UI)...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '05. Ribbon Module', 'OTHER TRANSACTIONS Ribbon: Statutory Payroll & Fixed Assets', 'Automated SSS, PhilHealth, Pag-IBIG & Withholding tax on compensation, PPE depreciation, and Bank Reconciliation.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'OTHER TRANSACTIONS',
      activeToolKey: 'payroll',
      categoryTools: [
        { key: 'payroll', label: 'Payroll', icon: '$' },
        { key: 'ppe', label: 'PPE\nDepreciation', icon: '📈' },
        { key: 'inventory_list', label: 'Inventory\nList', icon: '📦' },
        { key: 'bank_recon', label: 'Bank\nRecon', icon: '🏛️' }
      ],
      categoryToolsGroupLabel: 'OTHER TRANSACTIONS TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'PAYROLL REGISTER & STATUTORY REMITTANCES',
      periodLabel: 'FOR THE MONTH OF AUGUST 2026'
    });

    // Content Card matching the app screenshot exactly!
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: layout.contentY,
      w: layout.contentW,
      h: layout.contentH,
      rectRadius: 0.1,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    // Card Header Row:
    // Left: $ icon + Title + Subtitle
    slide.addText('$', {
      x: layout.contentX + 0.3,
      y: layout.contentY + 0.1,
      w: 0.3,
      h: 0.35,
      fontSize: 20,
      fontFace: headingFont,
      bold: true,
      color: '2563EB'
    });

    slide.addText('Payroll Management & Register (BIR Form 2316 Fillable Structure)', {
      x: layout.contentX + 0.65,
      y: layout.contentY + 0.08,
      w: 6.8,
      h: 0.26,
      fontSize: 11,
      fontFace: headingFont,
      bold: true,
      color: C.textDark
    });

    slide.addText('Fillable payroll records for Jan to Dec. Follows the EXACT structure & line numbers of BIR Form 2316 (September 2021 ENCS). Every record feeds into 6. BIR Attachments → BIR 2316 Certificate.', {
      x: layout.contentX + 0.65,
      y: layout.contentY + 0.34,
      w: 6.8,
      h: 0.38,
      fontSize: 7.8,
      fontFace: defaultFont,
      color: C.textMuted
    });

    // Right Action Buttons matching screenshot:
    // 1. [✨ Load Model Image Sample] (Amber tinted button)
    const btnY = layout.contentY + 0.12;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 7.6,
      y: btnY,
      w: 1.3,
      h: 0.58,
      rectRadius: 0.08,
      fill: { color: C.amberBtnBg },
      line: { color: C.amberBtnBorder, width: 1 }
    });
    slide.addText('✨ Load\nModel\nImage Sample', {
      x: layout.contentX + 7.6,
      y: btnY,
      w: 1.3,
      h: 0.58,
      fontSize: 7.5,
      fontFace: headingFont,
      bold: true,
      color: C.amberBtnText,
      align: 'center',
      valign: 'middle'
    });

    // 2. [+ Fillable BIR 2316 Entry] (Solid Royal Blue button)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 9.05,
      y: btnY,
      w: 1.4,
      h: 0.58,
      rectRadius: 0.08,
      fill: { color: '2563EB' }
    });
    slide.addText('+ Fillable\nBIR 2316\nEntry', {
      x: layout.contentX + 9.05,
      y: btnY,
      w: 1.4,
      h: 0.58,
      fontSize: 8,
      fontFace: headingFont,
      bold: true,
      color: C.textWhite,
      align: 'center',
      valign: 'middle'
    });

    // 3. [📑 Payroll Register Logs] (White outline button)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 10.6,
      y: btnY,
      w: 1.3,
      h: 0.58,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });
    slide.addText('📑 Payroll\nRegister\nLogs', {
      x: layout.contentX + 10.6,
      y: btnY,
      w: 1.3,
      h: 0.58,
      fontSize: 8,
      fontFace: defaultFont,
      color: C.textDark,
      align: 'center',
      valign: 'middle'
    });

    // Form Controls Row matching the screenshot:
    const formY = layout.contentY + 0.82;
    // 1. Employee * [-- Select Employee -- ▾]
    slide.addText('Employee *', { x: layout.contentX + 0.3, y: formY, w: 2.5, h: 0.18, fontSize: 8, fontFace: headingFont, bold: true, color: C.textDark });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 0.3,
      y: formY + 0.18,
      w: 2.6,
      h: 0.3,
      rectRadius: 0.06,
      fill: { color: C.cardBg },
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('-- Select Employee --   ▾', { x: layout.contentX + 0.4, y: formY + 0.18, w: 2.4, h: 0.3, fontSize: 8, fontFace: defaultFont, color: C.textMuted, valign: 'middle' });

    // 2. 1 For the Year (YYYY) * [2024]
    slide.addText('1 For the Year (YYYY) *', { x: layout.contentX + 3.1, y: formY, w: 2.4, h: 0.18, fontSize: 8, fontFace: headingFont, bold: true, color: C.textDark });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 3.1,
      y: formY + 0.18,
      w: 2.5,
      h: 0.3,
      rectRadius: 0.06,
      fill: { color: C.cardBg },
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('2024', { x: layout.contentX + 3.1, y: formY + 0.18, w: 2.5, h: 0.3, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, align: 'center', valign: 'middle' });

    // 3. 2 For Period (MM/DD) * [01/01] To [12/31]
    slide.addText('2 For Period (MM/DD) *', { x: layout.contentX + 5.8, y: formY, w: 2.6, h: 0.18, fontSize: 8, fontFace: headingFont, bold: true, color: C.textDark });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 5.8,
      y: formY + 0.18,
      w: 1.1,
      h: 0.3,
      rectRadius: 0.06,
      fill: { color: C.cardBg },
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('01/01', { x: layout.contentX + 5.8, y: formY + 0.18, w: 1.1, h: 0.3, fontSize: 8, fontFace: defaultFont, color: C.textDark, align: 'center', valign: 'middle' });
    slide.addText('To', { x: layout.contentX + 6.95, y: formY + 0.18, w: 0.3, h: 0.3, fontSize: 8, fontFace: defaultFont, color: C.textMuted, align: 'center', valign: 'middle' });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 7.3,
      y: formY + 0.18,
      w: 1.1,
      h: 0.3,
      rectRadius: 0.06,
      fill: { color: C.cardBg },
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('12/31', { x: layout.contentX + 7.3, y: formY + 0.18, w: 1.1, h: 0.3, fontSize: 8, fontFace: defaultFont, color: C.textDark, align: 'center', valign: 'middle' });

    // 4. Posting Date * [12/31/2024 📅]
    slide.addText('Posting Date *', { x: layout.contentX + 8.6, y: formY, w: 3.2, h: 0.18, fontSize: 8, fontFace: headingFont, bold: true, color: C.textDark });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX + 8.6,
      y: formY + 0.18,
      w: 3.2,
      h: 0.3,
      rectRadius: 0.06,
      fill: { color: C.cardBg },
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('12 / 31 / 2024   📅', { x: layout.contentX + 8.8, y: formY + 0.18, w: 2.8, h: 0.3, fontSize: 8, fontFace: defaultFont, color: C.textDark, valign: 'middle' });

    // Lower summary payroll row
    const summaryY = formY + 0.58;
    slide.addShape(pptx.ShapeType.rect, {
      x: layout.contentX + 0.3,
      y: summaryY,
      w: layout.contentW - 0.6,
      h: 0.42,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0', width: 1 }
    });
    slide.addText('REGISTER SNAPSHOT: 4 EMPLOYEES POSTED  •  TOTAL GROSS: ₱120,500.00  •  TOTAL MANDATORY CONTRIBUTIONS (SSS/PHIC/HDMF): ₱10,790.00  •  W-TAX: ₱7,970.00', {
      x: layout.contentX + 0.4,
      y: summaryY,
      w: layout.contentW - 0.8,
      h: 0.42,
      fontSize: 8,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy,
      valign: 'middle'
    });
  }

  // =========================================================================
  // SLIDE 7: FINANCIAL STATEMENTS RIBBON - BALANCE SHEET (PFRS)
  // =========================================================================
  {
    console.log('Generating Slide 7: Financial Statements...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '06. Ribbon Module', 'FINANCIAL STATEMENTS Ribbon: PFRS Standards Suite', 'One-click generation of Comparative Balance Sheet, P&L Statement, Financial Position, Changes in Equity & Cash Flows.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'FINANCIAL STATEMENTS',
      activeToolKey: 'fs_balance_sheet',
      categoryTools: [
        { key: 'fs_balance_sheet', label: 'Balance\nSheet', icon: '⚖️' },
        { key: 'fs_income', label: 'Statement of\nComp. Income', icon: '📈' },
        { key: 'fs_position', label: 'Statement of\nFinancial Position', icon: '🏛️' },
        { key: 'fs_equity', label: 'Statement of\nChanges in Equity', icon: '📑' },
        { key: 'fs_cashflows', label: 'Statement of\nCash Flows', icon: '🪙' },
        { key: 'fs_notes', label: 'Notes to\nFS', icon: '📄' }
      ],
      categoryToolsGroupLabel: 'FINANCIAL STATEMENTS TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)',
      periodLabel: 'AS OF AUGUST 31, 2026'
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: layout.contentY,
      w: layout.contentW,
      h: layout.contentH,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: layout.contentX + 0.2,
      y: layout.contentY + 0.15,
      w: layout.contentW - 0.4,
      h: 0.32,
      fill: { color: C.tableHeaderBg }
    });
    slide.addText('ACCOUNT CLASSIFICATION (PFRS AUDIT-READY)', { x: layout.contentX + 0.3, y: layout.contentY + 0.15, w: 5.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('CURRENT PERIOD (2026)', { x: layout.contentX + 6.0, y: layout.contentY + 0.15, w: 2.2, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('PRIOR PERIOD (2025)', { x: layout.contentX + 8.4, y: layout.contentY + 0.15, w: 2.0, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('VARIANCE', { x: layout.contentX + 10.5, y: layout.contentY + 0.15, w: 1.3, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });

    const fsRows = [
      { line: 'CURRENT ASSETS: Cash & Cash Equivalents', curr: '₱ 894,200.00', prev: '₱ 640,000.00', change: '+39.7%' },
      { line: 'Trade and Other Receivables (Net of Allowance)', curr: '₱ 580,450.00', prev: '₱ 410,200.00', change: '+41.5%' },
      { line: 'Merchandise Inventory & Prepaid Taxes', curr: '₱ 350,000.00', prev: '₱ 280,000.00', change: '+25.0%' },
      { line: 'TOTAL CURRENT ASSETS', curr: '₱ 1,824,650.00', prev: '₱ 1,330,200.00', change: '+37.2%', bold: true, highlight: true },
      { line: 'NON-CURRENT ASSETS: Property, Plant & Equipment (Net)', curr: '₱ 1,450,000.00', prev: '₱ 1,520,000.00', change: '-4.6%' },
      { line: 'TOTAL ASSETS', curr: '₱ 3,274,650.00', prev: '₱ 2,850,200.00', change: '+14.9%', bold: true, color: C.textNavy }
    ];

    fsRows.forEach((r, i) => {
      const ry = layout.contentY + 0.5 + i * 0.33;
      slide.addShape(pptx.ShapeType.rect, {
        x: layout.contentX + 0.2,
        y: ry,
        w: layout.contentW - 0.4,
        h: 0.31,
        fill: { color: r.highlight ? 'E0F2FE' : (i % 2 === 0 ? C.cardBg : 'F8FAFC') },
        line: { color: 'F1F5F9', width: 0.5 }
      });
      slide.addText(r.line, { x: layout.contentX + 0.3, y: ry, w: 5.5, h: 0.31, fontSize: 8, fontFace: defaultFont, bold: !!r.bold, color: r.color || C.textDark, valign: 'middle' });
      slide.addText(r.curr, { x: layout.contentX + 6.0, y: ry, w: 2.2, h: 0.31, fontSize: 8, fontFace: defaultFont, bold: !!r.bold, color: r.color || C.textNavy, valign: 'middle' });
      slide.addText(r.prev, { x: layout.contentX + 8.4, y: ry, w: 2.0, h: 0.31, fontSize: 8, fontFace: defaultFont, color: C.textBody, valign: 'middle' });
      slide.addText(r.change, { x: layout.contentX + 10.5, y: ry, w: 1.3, h: 0.31, fontSize: 8, fontFace: defaultFont, bold: true, color: r.change.startsWith('+') ? '16A34A' : 'D97706', valign: 'middle' });
    });
  }

  // =========================================================================
  // SLIDE 8: BIR COMPUTATIONS RIBBON - 2307 CERTIFICATES
  // =========================================================================
  {
    console.log('Generating Slide 8: BIR Computations...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '07. Ribbon Module', 'BIR COMPUTATIONS Ribbon: Native Philippine Statutory Tax Suite', 'Automatic compilation of Withholding Tax (2307/2316), VAT 2550Q, Income Tax 1702Q, SLSP, SAWT & QAP.');

    const layout = renderAuthentic2OSFrame(slide, {
      activeCategory: 'BIR COMPUTATIONS',
      activeToolKey: 'cwt_providers',
      categoryTools: [
        { key: 'bir_2316', label: 'Withholding Tax\nCompensation', icon: '📄' },
        { key: 'cwt_providers', label: 'Expanded\nWithholding Tax', icon: '🛡️' },
        { key: 'tax_reports', label: 'Business\nTax', icon: '🧾' },
        { key: 'income_tax', label: 'Income\nTax', icon: '🧮' },
        { key: 'bir_slsp', label: 'SLSP', icon: '📁' },
        { key: 'bir_sawt', label: 'SAWT', icon: '📊' }
      ],
      categoryToolsGroupLabel: 'BIR COMPUTATIONS TOOLS',
      selectedEntity: 'CONSOLIDATED (ALL BRANCHES)',
      journalTitle: 'BIR FORM 2307 CREDITABLE WITHHOLDING TAX (ISSUED)',
      periodLabel: 'FOR THE 3RD QUARTER ENDED SEPTEMBER 30, 2026'
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: layout.contentX,
      y: layout.contentY,
      w: layout.contentW,
      h: layout.contentH,
      rectRadius: 0.08,
      fill: { color: C.cardBg },
      line: { color: C.borderCard, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: layout.contentX + 0.2,
      y: layout.contentY + 0.15,
      w: layout.contentW - 0.4,
      h: 0.32,
      fill: { color: C.tableHeaderBg }
    });
    slide.addText('PAYOR / WITHHOLDING AGENT', { x: layout.contentX + 0.3, y: layout.contentY + 0.15, w: 4.2, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('ATC CODE', { x: layout.contentX + 4.6, y: layout.contentY + 0.15, w: 1.2, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('NATURE OF PAYMENT', { x: layout.contentX + 5.9, y: layout.contentY + 0.15, w: 2.7, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('TAX BASE', { x: layout.contentX + 8.7, y: layout.contentY + 0.15, w: 1.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });
    slide.addText('TAX WITHHELD', { x: layout.contentX + 10.3, y: layout.contentY + 0.15, w: 1.5, h: 0.32, fontSize: 8.5, fontFace: headingFont, bold: true, color: C.textDark, valign: 'middle' });

    const ewtRows = [
      { payor: 'Ayala Commercial Properties (TIN: 123-456-789-00000)', atc: 'WC 100', desc: 'Prof. Fees (Lawyers / Accountants)', base: '₱ 100,000.00', rate: '5.0%', tax: '₱ 5,000.00' },
      { payor: 'SM Prime Holdings Inc. (TIN: 987-654-321-00000)', atc: 'WC 157', desc: 'Rentals - Real Property', base: '₱ 250,000.00', rate: '5.0%', tax: '₱ 12,500.00' },
      { payor: 'San Miguel Logistics LLC (TIN: 456-789-012-00000)', atc: 'WC 158', desc: 'Payment to General Contractors', base: '₱ 150,000.00', rate: '2.0%', tax: '₱ 3,000.00' },
      { payor: 'Jollibee Foods Franchise (TIN: 321-654-987-00001)', atc: 'WC 160', desc: 'Advertising / Media Services', base: '₱ 80,000.00', rate: '2.0%', tax: '₱ 1,600.00' }
    ];

    ewtRows.forEach((r, i) => {
      const ry = layout.contentY + 0.5 + i * 0.4;
      slide.addShape(pptx.ShapeType.rect, {
        x: layout.contentX + 0.2,
        y: ry,
        w: layout.contentW - 0.4,
        h: 0.38,
        fill: { color: i % 2 === 0 ? C.cardBg : 'F8FAFC' },
        line: { color: 'F1F5F9', width: 0.5 }
      });
      slide.addText(r.payor, { x: layout.contentX + 0.3, y: ry, w: 4.2, h: 0.38, fontSize: 8, fontFace: defaultFont, bold: true, color: C.textDark, valign: 'middle' });
      slide.addText(r.atc, { x: layout.contentX + 4.6, y: ry, w: 1.2, h: 0.38, fontSize: 8.5, fontFace: 'Consolas', color: C.textNavy, valign: 'middle' });
      slide.addText(r.desc, { x: layout.contentX + 5.9, y: ry, w: 2.7, h: 0.38, fontSize: 8, fontFace: defaultFont, color: C.textMuted, valign: 'middle' });
      slide.addText(r.base, { x: layout.contentX + 8.7, y: ry, w: 1.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, color: C.textDark, valign: 'middle' });
      slide.addText(`${r.tax} (${r.rate})`, { x: layout.contentX + 10.3, y: ry, w: 1.5, h: 0.38, fontSize: 8.5, fontFace: defaultFont, bold: true, color: 'D97706', valign: 'middle' });
    });
  }

  // =========================================================================
  // SLIDE 9: COMPETITIVE ADVANTAGE
  // =========================================================================
  {
    console.log('Generating Slide 9: Matrix...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '08. Market Comparison', 'Competitive Advantage: Why 2OS Outperforms in the Philippines', 'Comparing 2OS with Foreign SaaS ERPs and vulnerable manual spreadsheets.');

    const compRows = [
      { feat: 'User Interface Paradigm', twoOS: 'MS Office Ribbon & Excel Sheets (Familiar)', saas: 'Complex Custom ERP Navigation', excel: 'Standard Sheets (Unlinked)' },
      { feat: 'Local Currency Pricing', twoOS: 'Affordable PHP (from ₱499/mo)', saas: '$50 - $300 USD/month', excel: 'Free (but high error cost)' },
      { feat: 'BIR Form 2307 & 2316', twoOS: 'Native, Automated & 1-Click', saas: 'Not supported without add-on', excel: 'Manual copy-paste' },
      { feat: 'PH Payroll (SSS/PHIC/HDMF)', twoOS: 'Built-in 2024+ Government Brackets', saas: 'Not available natively', excel: 'Broken formula risks' },
      { feat: 'Bilateral 2-Party Sync', twoOS: 'Core Architectural DNA', saas: 'Single-Party perspective', excel: 'Zero reconciliation' },
      { feat: 'Deployment Options', twoOS: 'Browser Local + Free Cloud (MySQL)', saas: 'Proprietary Cloud Lock-in', excel: 'Dispersed file folders' }
    ];

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.9,
      y: 1.45,
      w: 11.533,
      h: 0.42,
      fill: { color: C.textNavy }
    });
    slide.addText('CORE CAPABILITY', { x: 1.1, y: 1.45, w: 3.2, h: 0.42, fontSize: 9.5, fontFace: headingFont, bold: true, color: C.textWhite, valign: 'middle' });
    slide.addText('2OS ACCOUNTING SYSTEM', { x: 4.4, y: 1.45, w: 3.5, h: 0.42, fontSize: 9.5, fontFace: headingFont, bold: true, color: 'FEF08A', valign: 'middle' });
    slide.addText('FOREIGN SAAS (XERO / QBO)', { x: 8.0, y: 1.45, w: 2.4, h: 0.42, fontSize: 9.5, fontFace: headingFont, bold: true, color: C.textWhite, valign: 'middle' });
    slide.addText('MANUAL SPREADSHEETS', { x: 10.5, y: 1.45, w: 1.8, h: 0.42, fontSize: 9.5, fontFace: headingFont, bold: true, color: C.textWhite, valign: 'middle' });

    compRows.forEach((r, idx) => {
      const yPos = 1.95 + idx * 0.72;
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.9,
        y: yPos,
        w: 11.533,
        h: 0.65,
        fill: { color: idx % 2 === 0 ? C.cardBg : 'F8FAFC' },
        line: { color: C.borderCard, width: 0.5 }
      });
      slide.addText(r.feat, { x: 1.1, y: yPos, w: 3.2, h: 0.65, fontSize: 9.5, fontFace: defaultFont, bold: true, color: C.textDark, valign: 'middle' });
      slide.addText(r.twoOS, { x: 4.4, y: yPos, w: 3.5, h: 0.65, fontSize: 9.5, fontFace: defaultFont, bold: true, color: C.textNavy, valign: 'middle' });
      slide.addText(r.saas, { x: 8.0, y: yPos, w: 2.4, h: 0.65, fontSize: 9, fontFace: defaultFont, color: C.textMuted, valign: 'middle' });
      slide.addText(r.excel, { x: 10.5, y: yPos, w: 1.8, h: 0.65, fontSize: 9, fontFace: defaultFont, color: 'D97706', valign: 'middle' });
    });
  }

  // =========================================================================
  // SLIDE 10: SCALABILITY TIERS
  // =========================================================================
  {
    console.log('Generating Slide 10: Tiers...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addSlideHeading(slide, '09. Market Scope', 'Scalable from Micro Businesses to Large Enterprises', 'Four adaptable deployment tiers supporting the full spectrum of Philippine enterprise growth.');

    const tiers = [
      {
        x: 0.9,
        title: 'TIER 1: MICRO',
        tag: 'Freelancers & Sari-Sari',
        pts: '• Zero accounting training needed\n• Instant invoicing on mobile or PC\n• Daily cash collection tracking\n• 8% Gross Income Tax assistance\n• 80% cheaper than foreign SaaS',
        color: C.brandCyan
      },
      {
        x: 3.85,
        title: 'TIER 2: SMALL',
        tag: 'Cafes, Clinics & Services',
        pts: '• 1 to 20 staff members\n• Automated statutory payroll\n• BIR 2307 vendor certificates\n• Customer credit & collections\n• Inventory cost flow monitoring',
        color: '0D9488'
      },
      {
        x: 6.8,
        title: 'TIER 3: MEDIUM',
        tag: 'Trading & Manufacturing',
        pts: '• Multi-branch operations\n• PFRS financial statement suites\n• SLSP and SAWT validation\n• Bank reconciliation center\n• Horizontal ratio analysis',
        color: '4F46E5'
      },
      {
        x: 9.75,
        title: 'TIER 4: ENTERPRISE',
        tag: 'Holdings & Franchises',
        pts: '• Multi-entity consolidation\n• Parent-subsidiary elimination\n• Private MySQL deployment\n• Unlimited journal throughput\n• Audit trail export for BIR eAFS',
        color: '16A34A'
      }
    ];

    tiers.forEach(t => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: t.x,
        y: 1.5,
        w: 2.65,
        h: 5.1,
        rectRadius: 0.12,
        fill: { color: C.cardBg },
        line: { color: C.borderCard, width: 1 }
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: t.x,
        y: 1.5,
        w: 2.65,
        h: 0.12,
        fill: { color: t.color }
      });
      slide.addText(t.title, {
        x: t.x + 0.15,
        y: 1.75,
        w: 2.35,
        h: 0.35,
        fontSize: 12,
        fontFace: headingFont,
        bold: true,
        color: t.color
      });
      slide.addText(t.tag, {
        x: t.x + 0.15,
        y: 2.12,
        w: 2.35,
        h: 0.3,
        fontSize: 9.5,
        fontFace: defaultFont,
        color: C.textMuted
      });
      slide.addText(t.pts, {
        x: t.x + 0.15,
        y: 2.55,
        w: 2.35,
        h: 3.8,
        fontSize: 9.5,
        fontFace: defaultFont,
        color: C.textBody
      });
    });
  }

  // =========================================================================
  // SLIDE 11: CONCLUSION & CREED
  // =========================================================================
  {
    console.log('Generating Slide 11: Creed...');
    const slide = pptx.addSlide();
    slide.background = { color: C.canvasBg };
    addTopBanner(slide);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 4.15,
      y: 0.85,
      w: 5.0,
      h: 0.45,
      rectRadius: 0.2,
      fill: { color: 'E0F2FE' },
      line: { color: C.brandCyan, width: 1.2 }
    });
    slide.addText('2OS ACCOUNTING SYSTEM', {
      x: 4.15,
      y: 0.85,
      w: 5.0,
      h: 0.45,
      fontSize: 11,
      fontFace: headingFont,
      bold: true,
      color: C.textNavy,
      align: 'center',
      valign: 'middle'
    });

    slide.addText('Build on a Strong Foundation.\nBridge Your Financial Future.', {
      x: 0.9,
      y: 1.5,
      w: 11.5,
      h: 1.2,
      fontSize: 32,
      fontFace: headingFont,
      color: C.textDark,
      align: 'center',
      bold: true
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.4,
      y: 2.9,
      w: 10.5,
      h: 1.5,
      rectRadius: 0.15,
      fill: { color: C.cardBg },
      line: { color: 'D97706', width: 2 }
    });
    slide.addText(
      '"Because every progress is always supported by a strong foundation,\nand 2OS will not only be the bridge but also the foundation."',
      {
        x: 1.7,
        y: 3.0,
        w: 9.9,
        h: 1.3,
        fontSize: 17,
        fontFace: defaultFont,
        italic: true,
        bold: true,
        color: 'B45309',
        align: 'center',
        valign: 'middle'
      }
    );

    slide.addText(
      'Ready for Commercial Demonstration, Pilot Deployments & Investor Partnerships.\nVisit 2OS Cloud or Connect with the Engineering Team.',
      {
        x: 0.9,
        y: 4.8,
        w: 11.5,
        h: 0.8,
        fontSize: 13,
        fontFace: defaultFont,
        color: C.textBody,
        align: 'center'
      }
    );
  }

  // Save to file
  const outDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, '2OS_Accounting_Pitch_Deck.pptx');
  console.log(`Writing PPTX presentation to ${outPath}...`);
  await pptx.writeFile({ fileName: outPath });
  console.log(`Successfully generated pitch deck at: ${outPath}`);

  // Copy to root directory as well
  const rootPath = path.join(process.cwd(), '2OS_Accounting_Pitch_Deck.pptx');
  fs.copyFileSync(outPath, rootPath);
  console.log(`Successfully copied pitch deck to root at: ${rootPath}`);
}

buildPresentation().catch(err => {
  console.error('Build presentation error:', err);
  process.exit(1);
});
