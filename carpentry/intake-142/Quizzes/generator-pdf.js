/* Local, browser-side PDF exports for the lecture quiz generator. */
(function (root) {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const bytes = new Map();
  let ready;
  function asset(path) {
    if (!bytes.has(path)) {
      const encoded = root.LectureQuizPDFResources && root.LectureQuizPDFResources[path];
      if (!encoded) throw new Error('Could not load a quiz PDF resource. Please reload and try again.');
      const binary = atob(encoded);
      const decoded = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) decoded[i] = binary.charCodeAt(i);
      bytes.set(path, decoded);
    }
    return bytes.get(path);
  }
  function script(path, globalName) {
    if (root[globalName]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const element = document.createElement('script');
      element.src = new URL(path, base).href;
      element.onload = () => root[globalName] ? resolve() : reject(new Error('The PDF library did not load.'));
      element.onerror = () => { element.remove(); reject(new Error('The local PDF library could not load. Please reload and try again.')); };
      document.head.appendChild(element);
    });
  }
  function libraries() {
    if (!ready) ready = Promise.all([
      script('vendor/pdf-lib.min.js', 'PDFLib'),
      script('vendor/fontkit.umd.min.js', 'fontkit'),
      script('vendor/pdf-resources.js', 'LectureQuizPDFResources')
    ]).catch(error => { ready = null; throw error; });
    return ready;
  }
  function clean(value) {
    return String(value == null ? '' : value).replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  }
  function wrap(value, font, size, width) {
    const lines = [];
    clean(value).split('\n').forEach(paragraph => {
      let line = '';
      paragraph.trim().split(/\s+/).forEach(word => {
        if (!word) return;
        if (font.widthOfTextAtSize(word, size) > width) {
          if (line) { lines.push(line); line = ''; }
          for (const letter of word) {
            if (font.widthOfTextAtSize(line + letter, size) > width && line) { lines.push(line); line = ''; }
            line += letter;
          }
        } else if (!line || font.widthOfTextAtSize(line + ' ' + word, size) <= width) {
          line += (line ? ' ' : '') + word;
        } else { lines.push(line); line = word; }
      });
      lines.push(line);
    });
    return lines;
  }
  async function create(quiz, options) {
    const key = Boolean(options && options.answerKey);
    if (!quiz || !quiz.lecture || !Array.isArray(quiz.questions) || quiz.questions.length < 1 || quiz.questions.length > 25) {
      throw new Error('Generate a quiz with 1–25 questions before exporting.');
    }
    await libraries();
    const { PDFDocument, StandardFonts, rgb } = root.PDFLib;
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(root.fontkit);
    const [regularBytes, boldBytes, logoBytes] = await Promise.all([
      asset('vendor/DejaVuSans.ttf'), asset('vendor/DejaVuSans-Bold.ttf'), asset('../../../brand/is4s-badge-512.png')
    ]);
    const [normal, bold, fieldFont, logo] = await Promise.all([
      pdf.embedFont(regularBytes, { subset: true }), pdf.embedFont(boldBytes, { subset: true }),
      pdf.embedFont(StandardFonts.Helvetica), pdf.embedPng(logoBytes)
    ]);
    const images = new Map();
    await Promise.all([...new Set(quiz.questions.map(q => q.image).filter(Boolean))].map(async name => {
      if (!/^[a-z0-9-]+$/.test(name)) throw new Error('This quiz contains an invalid illustration.');
      images.set(name, await pdf.embedPng(await asset('assets/' + name + '.png')));
    }));
    const ink = rgb(0.067, 0.071, 0.094), red = rgb(0.463, 0, 0.137);
    const muted = rgb(0.259, 0.286, 0.341), border = rgb(0.353, 0.388, 0.451), white = rgb(1, 1, 1);
    const width = 612, height = 792, left = 42, right = 570, bottom = 48, column = 76, columnWidth = 494;
    const form = pdf.getForm();
    const lecture = quiz.lecture;
    const code = clean(quiz.code);
    const report = [];
    pdf.setTitle(lecture.id + ' — ' + lecture.topic + ' — ' + (key ? 'Answer key' : 'Fillable quiz') + ' — ' + code);
    pdf.setAuthor('Indigenous Skills4Success');
    pdf.setSubject('Carpentry Foundation lecture quiz · Version ' + code);
    pdf.setCreator('Lecture quiz generator');
    const styles = {
      title: { font: bold, size: 21, leading: 26, color: ink },
      continued: { font: bold, size: 15, leading: 20, color: ink },
      prompt: { font: normal, size: key ? 11.5 : 14, leading: key ? 15.5 : 19, color: ink },
      choice: { font: normal, size: 12, leading: 16.5, color: ink },
      answer: { font: bold, size: 12.5, leading: 17, color: red },
      explanation: { font: normal, size: 11, leading: 15, color: ink },
      reference: { font: normal, size: 8.8, leading: 11.5, color: muted },
      instruction: { font: normal, size: 10.5, leading: 14, color: muted },
      category: { font: bold, size: 9, leading: 12, color: red }
    };
    function block(value, styleName, maxWidth) {
      const style = styles[styleName];
      const lines = wrap(value, style.font, style.size, maxWidth || columnWidth);
      return { lines, style, height: lines.length * style.leading };
    }
    function drawBlock(page, item, x, top) {
      item.lines.forEach((line, i) => {
        page.drawText(line, { x, y: top - item.style.size - i * item.style.leading, font: item.style.font, size: item.style.size, color: item.style.color });
      });
      return top - item.height;
    }
    function label(page, value, x, top, size, font, color) {
      page.drawText(clean(value), { x, y: top - size, size, font: font || normal, color: color || ink });
    }
    function field(page, name, x, top, fieldWidth, fieldHeight, multiline, tooltip) {
      const input = form.createTextField(name);
      input.acroField.dict.set(root.PDFLib.PDFName.of('TU'), root.PDFLib.PDFHexString.fromText(tooltip));
      if (multiline) input.enableMultiline();
      input.disableScrolling();
      input.setMaxLength(multiline ? 240 : 90);
      input.addToPage(page, { x, y: top - fieldHeight, width: fieldWidth, height: fieldHeight, borderColor: border, borderWidth: 0.8, backgroundColor: white, textColor: ink, font: fieldFont });
      input.setFontSize(multiline ? 10.5 : 12);
    }
    const firstInstruction = key
      ? quiz.questions.length + ' questions. Answers and working match the numbered questions in the learner PDF with the same version code.'
      : quiz.questions.length + ' questions. Show your method and include units. For multiple choice, enter the answer letter. Follow your instructor’s calculator guidance.';
    function headerPlan(first) {
      const title = block(lecture.topic, first ? 'title' : 'continued', 425);
      const detail = block('Day ' + String(lecture.day).padStart(2, '0') + ' · ' + lecture.date + (first ? ' · ' + lecture.start + '–' + lecture.end : ' · ' + quiz.questions.length + ' questions'), 'reference', right - left);
      const instruction = first ? block(firstInstruction, 'instruction', right - left) : null;
      let y = 726 - title.height - 10 - detail.height - 13;
      if (first) {
        y -= instruction.height + 14;
        if (!key) y -= 60;
        else y -= 6;
      }
      return { title, detail, instruction, top: y - 12 };
    }
    function header(page, number, first) {
      const plan = headerPlan(first);
      page.drawImage(logo, { x: 498, y: 713, width: 72, height: 72 * logo.height / logo.width });
      label(page, (key ? 'INSTRUCTOR ANSWER KEY' : 'LECTURE QUIZ') + ' · ' + lecture.id, left, 758, 10.5, bold, red);
      let y = drawBlock(page, plan.title, left, 726) - 10;
      y = drawBlock(page, plan.detail, left, y) - 13;
      if (first) {
        y = drawBlock(page, plan.instruction, left, y) - 14;
        if (!key) {
          label(page, 'Name', left, y, 10.5, bold);
          field(page, 'learner-name', 83, y + 4, 280, 23, false, 'Your name');
          label(page, 'Date', 390, y, 10.5, bold);
          field(page, 'learner-date', 423, y + 4, 147, 23, false, 'Date completed');
          y -= 38;
          label(page, 'Type into the fields and save a copy, or print and write.', left, y, 9, normal, muted);
        }
      }
      label(page, lecture.id + ' · Version ' + code, left, 37, 8, normal, muted);
      return plan.top;
    }
    function plan(q, index) {
      if (q.type === 'choice' && (!q.choices || q.choices.indexOf(q.answer) < 0)) throw new Error('A multiple-choice answer is missing from its choices.');
      const p = { question: q, number: index + 1, category: block(clean(q.category).toUpperCase(), 'category'), prompt: block(q.prompt, 'prompt'), choices: [] };
      p.height = p.category.height + 4 + p.prompt.height + 7;
      if (!key && q.type === 'choice') {
        const choiceWidth = (columnWidth - 20) / 2;
        for (let i = 0; i < q.choices.length; i += 2) {
          const row = q.choices.slice(i, i + 2).map((choice, j) => block(String.fromCharCode(65 + i + j) + '. ' + choice, 'choice', choiceWidth));
          p.choices.push({ row, height: Math.max(...row.map(b => b.height)), width: choiceWidth });
        }
        p.height += p.choices.reduce((sum, row) => sum + row.height + 3, 0) + 5;
      }
      if (q.image) {
        p.image = images.get(q.image);
        const ratio = Math.min(462 / p.image.width, (q.image === 'hub-calculator' ? 118 : 145) / p.image.height);
        p.imageWidth = p.image.width * ratio; p.imageHeight = p.image.height * ratio;
        p.imageCaption = block(quiz.assets && quiz.assets[q.image] && quiz.assets[q.image].source || 'Learning diagram', 'reference');
        p.height += p.imageHeight + 8 + p.imageCaption.height + 8;
      }
      if (key) {
        const answer = q.type === 'choice' ? String.fromCharCode(65 + q.choices.indexOf(q.answer)) + '. ' + q.answer : q.displayAnswer == null ? q.answer : q.displayAnswer;
        p.answer = block('Answer: ' + answer, 'answer');
        p.explanation = block(q.explanation || '', 'explanation');
        p.height += p.answer.height + 5 + p.explanation.height + 8;
      } else p.height += 14 + 46 + 8;
      p.reference = block(clean(q.reference || lecture.reading).replace(/\bACCESS /g, ''), 'reference');
      p.height += p.reference.height + 22;
      return p;
    }
    const plans = quiz.questions.map(plan);
    let page = pdf.addPage([width, height]);
    let y = header(page, 1, true);
    let pageCount = 1;
    for (const p of plans) {
      if (p.height > y - bottom) {
        page = pdf.addPage([width, height]); pageCount++;
        y = header(page, pageCount, false);
      }
      if (p.height > y - bottom) throw new Error('A question is too long to fit on one PDF page. Please use a shorter question.');
      const top = y;
      label(page, String(p.number).padStart(2, '0'), left, y + 1, 20, bold, red);
      y = drawBlock(page, p.category, column, y) - 4;
      y = drawBlock(page, p.prompt, column, y) - 7;
      for (const group of p.choices) {
        group.row.forEach((item, i) => drawBlock(page, item, column + i * (group.width + 20), y));
        y -= group.height + 3;
      }
      if (p.choices.length) y -= 5;
      if (p.image) {
        page.drawImage(p.image, { x: column + (columnWidth - p.imageWidth) / 2, y: y - p.imageHeight, width: p.imageWidth, height: p.imageHeight });
        y -= p.imageHeight + 8;
        y = drawBlock(page, p.imageCaption, column, y) - 8;
      }
      if (key) {
        y = drawBlock(page, p.answer, column, y) - 5;
        y = drawBlock(page, p.explanation, column, y) - 8;
      } else {
        const answerLabel = p.question.type === 'choice' ? 'Answer letter' : 'Answer' + (p.question.unit ? ' (' + p.question.unit + ')' : '');
        const labelSize = Math.min(10.5, 135 / Math.max(1, bold.widthOfTextAtSize(answerLabel, 1)));
        label(page, answerLabel, column, y, labelSize, bold);
        label(page, 'Working / reason', column + 149, y, 10.5, bold);
        y -= 14;
        field(page, 'question-' + p.number + '-answer', column, y, 135, 46, false, 'Question ' + p.number + ': your answer');
        field(page, 'question-' + p.number + '-working', column + 149, y, columnWidth - 149, 46, true, 'Question ' + p.number + ': show your working or reason');
        y -= 54;
      }
      y = drawBlock(page, p.reference, column, y) - 22;
      if (Math.abs(top - y - p.height) > 0.01 || y < bottom - 0.01) throw new Error('The PDF page layout could not be completed.');
      report.push({ number: p.number, id: p.question.id, page: pageCount, top, bottom: y });
    }
    pdf.getPages().forEach((p, i) => {
      const pagination = (i + 1) + ' / ' + pageCount;
      label(p, pagination, right - normal.widthOfTextAtSize(pagination, 9), 37, 9, normal, muted);
    });
    if (!key) form.updateFieldAppearances(fieldFont);
    const output = await pdf.save();
    create.lastLayout = { answerKey: key, code, pages: pageCount, questions: report };
    return output;
  }
  root.LectureQuizPDF = { create };
})(window);
