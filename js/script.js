/* ============================================================
   SMART RESUME BUILDER — script.js
   ============================================================ */

/* ----------------------------------------------------------
   1. STATE
   ---------------------------------------------------------- */
const S = {
  tpl:   'classic',
  dark:  false,
  photo: null,
  skills: [],
  exp:   [],
  edu:   [],
  proj:  [],
  certs: []
};

/* ----------------------------------------------------------
   2. INITIALISE — runs after DOM is ready
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();          // restore saved data first
  bindHeaderBtns();
  bindTemplateBtns();
  bindTabBtns();
  bindPhotoUpload();
  bindSkillInput();
  bindDynamicAdds();
  bindFormInputs();

  // Seed at least one empty card per section
  if (!S.exp.length)   addExp();
  if (!S.edu.length)   addEdu();
  if (!S.proj.length)  addProj();
  if (!S.certs.length) addCert();

  renderAll();            // draw everything
});

/* ----------------------------------------------------------
   3. HEADER BUTTONS
   ---------------------------------------------------------- */
function bindHeaderBtns() {
  document.getElementById('sampleBtn').addEventListener('click', loadSample);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('printBtn').addEventListener('click', openPrintModal);
  document.getElementById('downloadBtn').addEventListener('click', openPrintModal);
  document.getElementById('darkBtn').addEventListener('click', toggleDark);

  // Modal buttons
  document.getElementById('confirmPrint').addEventListener('click', () => {
    document.getElementById('pdfModal').classList.remove('open');
    setTimeout(() => window.print(), 120);
  });
  document.getElementById('cancelPrint').addEventListener('click', () => {
    document.getElementById('pdfModal').classList.remove('open');
  });
  // Close modal on backdrop click
  document.getElementById('pdfModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('pdfModal')) {
      document.getElementById('pdfModal').classList.remove('open');
    }
  });
}

function openPrintModal() {
  document.getElementById('pdfModal').classList.add('open');
}

/* ----------------------------------------------------------
   4. DARK MODE
   ---------------------------------------------------------- */
function toggleDark() {
  S.dark = !S.dark;
  document.body.setAttribute('data-theme', S.dark ? 'dark' : 'light');
  document.getElementById('darkBtn').textContent = S.dark ? 'Light Mode' : 'Dark Mode';
  saveStorage();
}

/* ----------------------------------------------------------
   5. TEMPLATE SWITCHING
   ---------------------------------------------------------- */
function bindTemplateBtns() {
  document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      S.tpl = btn.dataset.tpl;
      document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPreview();
      saveStorage();
    });
  });
}

/* ----------------------------------------------------------
   6. TAB SWITCHING
   ---------------------------------------------------------- */
function bindTabBtns() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

/* ----------------------------------------------------------
   7. PHOTO UPLOAD
   ---------------------------------------------------------- */
function bindPhotoUpload() {
  const inp = document.getElementById('photoInput');
  document.getElementById('photoBtn').addEventListener('click', () => inp.click());
  document.getElementById('photoCircle').addEventListener('click', () => inp.click());

  inp.addEventListener('change', () => {
    const file = inp.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      S.photo = e.target.result;
      document.getElementById('photoCircle').innerHTML =
        `<img src="${S.photo}" alt="Profile Photo">`;
      renderPreview();
      saveStorage();
    };
    reader.readAsDataURL(file);
  });
}

/* ----------------------------------------------------------
   8. SKILLS TAG INPUT
   ---------------------------------------------------------- */
function bindSkillInput() {
  const wrap = document.getElementById('skillTags');

  // Create the hidden text input inside the tags container
  const inp = document.createElement('input');
  inp.placeholder = 'Type skill...';
  inp.id = 'skillInp';
  wrap.appendChild(inp);

  // Click anywhere in the box → focus input
  wrap.addEventListener('click', () => inp.focus());

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = inp.value.replace(/,/g, '').trim();
      if (v && !S.skills.includes(v)) {
        S.skills.push(v);
        renderSkills();
        renderPreview();
        saveStorage();
      }
      inp.value = '';
    } else if (e.key === 'Backspace' && inp.value === '' && S.skills.length) {
      S.skills.pop();
      renderSkills();
      renderPreview();
      saveStorage();
    }
  });
}

/* Redraws all skill tags without recreating the input element */
function renderSkills() {
  const wrap = document.getElementById('skillTags');
  const inp  = document.getElementById('skillInp');

  // Remove only the tag elements (leave the input)
  Array.from(wrap.children).forEach(child => {
    if (child !== inp) child.remove();
  });

  S.skills.forEach((sk, i) => {
    const tag = document.createElement('span');
    tag.className = 'stag';
    tag.innerHTML = `${esc(sk)}<span class="x" data-i="${i}">&#x2715;</span>`;
    wrap.insertBefore(tag, inp);
  });

  // Bind remove buttons
  wrap.querySelectorAll('.x').forEach(x => {
    x.addEventListener('click', () => {
      S.skills.splice(+x.dataset.i, 1);
      renderSkills();
      renderPreview();
      saveStorage();
    });
  });
}

/* ----------------------------------------------------------
   9. DYNAMIC SECTIONS — add / render / remove
   ---------------------------------------------------------- */
function bindDynamicAdds() {
  document.getElementById('addExpBtn').addEventListener('click', () => {
    addExp(); renderExpList(); renderPreview();
  });
  document.getElementById('addEduBtn').addEventListener('click', () => {
    addEdu(); renderEduList(); renderPreview();
  });
  document.getElementById('addProjBtn').addEventListener('click', () => {
    addProj(); renderProjList(); renderPreview();
  });
  document.getElementById('addCertBtn').addEventListener('click', () => {
    addCert(); renderCertList(); renderPreview();
  });
}

// -- Factories --
function addExp()  { S.exp.push({ title:'', company:'', loc:'', start:'', end:'', current:false, desc:'' }); }
function addEdu()  { S.edu.push({ degree:'', school:'', field:'', start:'', end:'', gpa:'' }); }
function addProj() { S.proj.push({ name:'', tech:'', url:'', desc:'' }); }
function addCert() { S.certs.push({ name:'', org:'', date:'' }); }

// -- Render lists --
function renderExpList() {
  const list = document.getElementById('exp-list');
  list.innerHTML = '';

  S.exp.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'dcard';
    card.innerHTML = `
      <button class="btn rm-btn" data-sec="exp" data-i="${i}">&#x2715;</button>

      <div class="fgrp">
        <label>Job Title</label>
        <input data-sec="exp" data-i="${i}" data-f="title"
          value="${esc(e.title)}" placeholder="Software Engineer">
      </div>

      <div class="frow">
        <div class="fgrp" style="margin-bottom:0">
          <label>Company</label>
          <input data-sec="exp" data-i="${i}" data-f="company"
            value="${esc(e.company)}" placeholder="Company Name">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>Location</label>
          <input data-sec="exp" data-i="${i}" data-f="loc"
            value="${esc(e.loc)}" placeholder="City, State">
        </div>
      </div>

      <div class="frow" style="margin-top:.6rem">
        <div class="fgrp" style="margin-bottom:0">
          <label>Start Date</label>
          <input data-sec="exp" data-i="${i}" data-f="start"
            value="${esc(e.start)}" placeholder="Jan 2022">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>End Date</label>
          <input data-sec="exp" data-i="${i}" data-f="end"
            value="${esc(e.end)}" placeholder="Present" ${e.current ? 'disabled' : ''}>
        </div>
      </div>

      <div class="fgrp" style="margin-top:.5rem">
        <label>
          <input type="checkbox" data-sec="exp" data-i="${i}" data-f="current"
            ${e.current ? 'checked' : ''}
            style="width:auto;display:inline;margin-right:.35rem">
          Currently working here
        </label>
      </div>

      <div class="fgrp">
        <label>Description</label>
        <textarea data-sec="exp" data-i="${i}" data-f="desc"
          rows="3" placeholder="Key responsibilities and achievements...">${esc(e.desc)}</textarea>
      </div>`;
    list.appendChild(card);
  });

  bindCardEvents(list);
}

function renderEduList() {
  const list = document.getElementById('edu-list');
  list.innerHTML = '';

  S.edu.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'dcard';
    card.innerHTML = `
      <button class="btn rm-btn" data-sec="edu" data-i="${i}">&#x2715;</button>

      <div class="fgrp">
        <label>Degree</label>
        <input data-sec="edu" data-i="${i}" data-f="degree"
          value="${esc(e.degree)}" placeholder="Bachelor of Science">
      </div>

      <div class="frow">
        <div class="fgrp" style="margin-bottom:0">
          <label>School</label>
          <input data-sec="edu" data-i="${i}" data-f="school"
            value="${esc(e.school)}" placeholder="University Name">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>Field of Study</label>
          <input data-sec="edu" data-i="${i}" data-f="field"
            value="${esc(e.field)}" placeholder="Computer Science">
        </div>
      </div>

      <div class="frow" style="margin-top:.6rem">
        <div class="fgrp" style="margin-bottom:0">
          <label>Start Year</label>
          <input data-sec="edu" data-i="${i}" data-f="start"
            value="${esc(e.start)}" placeholder="2018">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>End Year</label>
          <input data-sec="edu" data-i="${i}" data-f="end"
            value="${esc(e.end)}" placeholder="2022">
        </div>
      </div>

      <div class="fgrp" style="margin-top:.6rem">
        <label>GPA (optional)</label>
        <input data-sec="edu" data-i="${i}" data-f="gpa"
          value="${esc(e.gpa)}" placeholder="3.8 / 4.0">
      </div>`;
    list.appendChild(card);
  });

  bindCardEvents(list);
}

function renderProjList() {
  const list = document.getElementById('proj-list');
  list.innerHTML = '';

  S.proj.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'dcard';
    card.innerHTML = `
      <button class="btn rm-btn" data-sec="proj" data-i="${i}">&#x2715;</button>

      <div class="fgrp">
        <label>Project Name</label>
        <input data-sec="proj" data-i="${i}" data-f="name"
          value="${esc(p.name)}" placeholder="E-Commerce Platform">
      </div>

      <div class="frow">
        <div class="fgrp" style="margin-bottom:0">
          <label>Technologies</label>
          <input data-sec="proj" data-i="${i}" data-f="tech"
            value="${esc(p.tech)}" placeholder="React, Node.js">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>URL (optional)</label>
          <input data-sec="proj" data-i="${i}" data-f="url"
            value="${esc(p.url)}" placeholder="github.com/project">
        </div>
      </div>

      <div class="fgrp" style="margin-top:.6rem">
        <label>Description</label>
        <textarea data-sec="proj" data-i="${i}" data-f="desc"
          rows="3" placeholder="What it does and your role...">${esc(p.desc)}</textarea>
      </div>`;
    list.appendChild(card);
  });

  bindCardEvents(list);
}

function renderCertList() {
  const list = document.getElementById('cert-list');
  list.innerHTML = '';

  S.certs.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'dcard';
    card.innerHTML = `
      <button class="btn rm-btn" data-sec="certs" data-i="${i}">&#x2715;</button>

      <div class="fgrp">
        <label>Certification Name</label>
        <input data-sec="certs" data-i="${i}" data-f="name"
          value="${esc(c.name)}" placeholder="AWS Certified Developer">
      </div>

      <div class="frow">
        <div class="fgrp" style="margin-bottom:0">
          <label>Issuing Organization</label>
          <input data-sec="certs" data-i="${i}" data-f="org"
            value="${esc(c.org)}" placeholder="Amazon Web Services">
        </div>
        <div class="fgrp" style="margin-bottom:0">
          <label>Date</label>
          <input data-sec="certs" data-i="${i}" data-f="date"
            value="${esc(c.date)}" placeholder="March 2023">
        </div>
      </div>`;
    list.appendChild(card);
  });

  bindCardEvents(list);
}

/* Binds input-change and remove events for every dynamic card */
function bindCardEvents(container) {
  // Input / textarea / checkbox changes
  container.querySelectorAll('input[data-sec], textarea[data-sec]').forEach(el => {
    const ev = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      const sec   = el.dataset.sec;
      const idx   = +el.dataset.i;
      const field = el.dataset.f;
      S[sec][idx][field] = el.type === 'checkbox' ? el.checked : el.value;

      // Re-render card when "current" checkbox changes (to toggle end-date disabled)
      if (field === 'current') {
        if (el.checked) S[sec][idx].end = 'Present';
        renderExpList();
      }
      renderPreview();
      saveStorage();
    });
  });

  // Remove buttons
  container.querySelectorAll('.rm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.sec;
      const idx = +btn.dataset.i;
      S[sec].splice(idx, 1);
      if (sec === 'exp')   renderExpList();
      if (sec === 'edu')   renderEduList();
      if (sec === 'proj')  renderProjList();
      if (sec === 'certs') renderCertList();
      renderPreview();
      saveStorage();
    });
  });
}

/* ----------------------------------------------------------
   10. PERSONAL + SUMMARY FORM BINDINGS
   ---------------------------------------------------------- */
function bindFormInputs() {
  ['fullName','profTitle','email','phone','location','linkedin','website'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { renderPreview(); saveStorage(); });
  });

  const sum = document.getElementById('summary');
  sum.addEventListener('input', () => {
    const len = sum.value.length;
    const cc  = document.getElementById('charCount');
    cc.textContent  = `${len} / 500`;
    cc.className    = 'char-count' + (len > 500 ? ' over' : len > 400 ? ' warn' : '');
    renderPreview();
    saveStorage();
  });
}

/* ----------------------------------------------------------
   11. RENDER ALL (called on init)
   ---------------------------------------------------------- */
function renderAll() {
  renderSkills();
  renderExpList();
  renderEduList();
  renderProjList();
  renderCertList();
  renderPreview();
}

/* ----------------------------------------------------------
   12. LIVE PREVIEW BUILDER
   ---------------------------------------------------------- */

/* Safe value getter from DOM input */
function g(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* HTML-escape a string to prevent XSS in the preview */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPreview() {
  // Collect personal info
  const name    = g('fullName');
  const title   = g('profTitle');
  const email   = g('email');
  const phone   = g('phone');
  const loc     = g('location');
  const li      = g('linkedin');
  const web     = g('website');
  const summary = g('summary');

  // Photo element
  const photoImg = S.photo
    ? `<img class="r-photo" src="${S.photo}" alt="Profile Photo">`
    : `<div class="r-photo-ph">&#128100;</div>`;

  // Contact line (pipe-separated)
  const contactBits = [
    email && esc(email),
    phone && esc(phone),
    loc   && esc(loc),
    li    && esc(li),
    web   && esc(web)
  ].filter(Boolean)
   .join('<span style="margin:0 .3rem;opacity:.5">|</span>');

  /* ---- Section HTML builders ---- */

  function expHTML() {
    const items = S.exp.filter(e => e.title || e.company);
    if (!items.length) return '';
    return `<div class="r-sec">
      <div class="r-sec-title">Work Experience</div>
      ${items.map(e => `
        <div class="r-item">
          <div class="r-item-hdr">
            <div class="r-item-title">${esc(e.title)}</div>
            <div class="r-item-date">${[esc(e.start), esc(e.end)].filter(Boolean).join(' - ')}</div>
          </div>
          <div class="r-item-sub">${[esc(e.company), esc(e.loc)].filter(Boolean).join(', ')}</div>
          ${e.desc ? `<div class="r-item-desc">${esc(e.desc).replace(/\n/g,'<br>')}</div>` : ''}
        </div>`).join('')}
    </div>`;
  }

  function projHTML() {
    const items = S.proj.filter(p => p.name);
    if (!items.length) return '';
    return `<div class="r-sec">
      <div class="r-sec-title">Projects</div>
      ${items.map(p => `
        <div class="r-item">
          <div class="r-item-title">
            ${esc(p.name)}
            ${p.url ? `<span style="font-size:.72rem;font-weight:400;color:#6b7280">| ${esc(p.url)}</span>` : ''}
          </div>
          ${p.tech ? `<div class="r-item-sub">${esc(p.tech)}</div>` : ''}
          ${p.desc ? `<div class="r-item-desc">${esc(p.desc).replace(/\n/g,'<br>')}</div>` : ''}
        </div>`).join('')}
    </div>`;
  }

  function eduHTML() {
    const items = S.edu.filter(e => e.degree || e.school);
    if (!items.length) return '';
    return `<div class="r-sec">
      <div class="r-sec-title">Education</div>
      ${items.map(e => `
        <div class="r-item">
          <div class="r-item-hdr">
            <div class="r-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}</div>
            <div class="r-item-date">${[esc(e.start), esc(e.end)].filter(Boolean).join(' - ')}</div>
          </div>
          <div class="r-item-sub">${esc(e.school)}</div>
          ${e.gpa ? `<div class="r-item-desc">GPA: ${esc(e.gpa)}</div>` : ''}
        </div>`).join('')}
    </div>`;
  }

  function skillsHTML() {
    if (!S.skills.length) return '';
    return `<div class="r-sec">
      <div class="r-sec-title">Skills</div>
      <div class="r-skills">
        ${S.skills.map(s => `<span class="r-skill">${esc(s)}</span>`).join('')}
      </div>
    </div>`;
  }

  function certsHTML() {
    const items = S.certs.filter(c => c.name);
    if (!items.length) return '';
    return `<div class="r-sec">
      <div class="r-sec-title">Certifications</div>
      ${items.map(c => `
        <div class="r-item" style="padding-left:0">
          <div class="r-cert-name">${esc(c.name)}</div>
          <div class="r-cert-org">${[esc(c.org), esc(c.date)].filter(Boolean).join(' | ')}</div>
        </div>`).join('')}
    </div>`;
  }

  /* ---- Build HTML per template ---- */
  let inner = '';
  const t = S.tpl;

  if (t === 'classic') {
    inner = `
      <div class="r-hdr">
        ${photoImg}
        <div>
          <div class="r-name">${name ? esc(name) : 'Your Name'}</div>
          <div class="r-job">${title ? esc(title) : 'Professional Title'}</div>
          <div class="r-contact">
            ${contactBits || '<span style="opacity:.45">Contact info appears here</span>'}
          </div>
        </div>
      </div>
      <div class="r-body">
        ${summary ? `<div class="r-sec"><div class="r-sec-title">Profile Summary</div><div class="r-summary">${esc(summary)}</div></div>` : ''}
        ${expHTML()} ${projHTML()} ${eduHTML()} ${skillsHTML()} ${certsHTML()}
      </div>`;

  } else if (t === 'modern') {
    // Sidebar education block
    const sideEdu = S.edu.filter(e => e.degree || e.school).length
      ? `<div>
          <div class="sb-title">Education</div>
          ${S.edu.filter(e => e.degree || e.school).map(e => `
            <div style="margin-bottom:.65rem">
              <div style="font-weight:700;font-size:.79rem">${esc(e.degree)}</div>
              <div style="font-size:.75rem;opacity:.8">${esc(e.school)}</div>
              <div style="font-size:.71rem;opacity:.6">
                ${[esc(e.start), esc(e.end)].filter(Boolean).join(' - ')}
              </div>
            </div>`).join('')}
        </div>` : '';

    // Sidebar certifications block
    const sideCerts = S.certs.filter(c => c.name).length
      ? `<div>
          <div class="sb-title">Certifications</div>
          ${S.certs.filter(c => c.name).map(c => `
            <div style="margin-bottom:.45rem">
              <div style="font-size:.76rem;font-weight:600">${esc(c.name)}</div>
              <div style="font-size:.71rem;opacity:.65">
                ${[esc(c.org), esc(c.date)].filter(Boolean).join(' | ')}
              </div>
            </div>`).join('')}
        </div>` : '';

    inner = `
      <div class="r-sidebar">
        <div>
          ${photoImg}
          <div class="r-name">${name ? esc(name) : 'Your Name'}</div>
          <div class="r-job">${title ? esc(title) : 'Professional Title'}</div>
        </div>
        <div>
          <div class="sb-title">Contact</div>
          ${[email, phone, loc, li, web].filter(Boolean)
              .map(v => `<div class="sb-item">${esc(v)}</div>`).join('')}
        </div>
        ${S.skills.length
          ? `<div>
              <div class="sb-title">Skills</div>
              ${S.skills.map(s => `<span class="r-skill">${esc(s)}</span>`).join('')}
            </div>` : ''}
        ${sideEdu}
        ${sideCerts}
      </div>
      <div class="r-main">
        ${summary ? `<div class="r-sec"><div class="r-sec-title">About Me</div><div class="r-summary">${esc(summary)}</div></div>` : ''}
        ${expHTML()} ${projHTML()}
      </div>`;

  } else if (t === 'creative') {
    inner = `
      <div class="r-hdr">
        ${photoImg}
        <div>
          <div class="r-name">${name ? esc(name) : 'Your Name'}</div>
          <div class="r-job">${title ? esc(title) : 'Professional Title'}</div>
          <div class="r-contact">${contactBits}</div>
        </div>
      </div>
      <div class="r-body">
        <div class="r-left">
          ${summary ? `<div class="r-sec"><div class="r-sec-title">Profile</div><div class="r-summary">${esc(summary)}</div></div>` : ''}
          ${expHTML()} ${projHTML()}
        </div>
        <div class="r-right">
          ${eduHTML()} ${skillsHTML()} ${certsHTML()}
        </div>
      </div>`;
  }

  document.getElementById('resume-out').innerHTML = inner;

  // Apply template class to preview panel wrapper
  document.getElementById('previewPanel').className = `preview-panel tpl-${t}`;
}

/* ----------------------------------------------------------
   13. CLEAR FORM
   ---------------------------------------------------------- */
function clearAll() {
  if (!confirm('Clear all data? This cannot be undone.')) return;

  // Clear text fields
  ['fullName','profTitle','email','phone','location','linkedin','website','summary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset character counter
  const cc = document.getElementById('charCount');
  cc.textContent = '0 / 500';
  cc.className   = 'char-count';

  // Reset photo
  S.photo = null;
  document.getElementById('photoCircle').innerHTML = '<span class="photo-icon">+</span>';
  document.getElementById('photoInput').value = '';

  // Reset all state arrays
  S.skills = [];
  S.exp    = [];
  S.edu    = [];
  S.proj   = [];
  S.certs  = [];

  // Seed one empty card each
  addExp(); addEdu(); addProj(); addCert();

  // Re-render everything
  renderAll();

  // Clear localStorage
  try { localStorage.removeItem('resumeBuilderSave'); } catch (e) { /* ignore */ }

  showToast('Form cleared successfully!');
}

/* ----------------------------------------------------------
   14. SAMPLE DATA
   ---------------------------------------------------------- */
function loadSample() {
  document.getElementById('fullName').value  = 'Alexandra Chen';
  document.getElementById('profTitle').value = 'Full Stack Software Engineer';
  document.getElementById('email').value     = 'alex.chen@email.com';
  document.getElementById('phone').value     = '+1 (415) 555-0192';
  document.getElementById('location').value  = 'San Francisco, CA';
  document.getElementById('linkedin').value  = 'linkedin.com/in/alexchen';
  document.getElementById('website').value   = 'alexchen.dev';
  document.getElementById('summary').value   =
    'Results-driven Full Stack Engineer with 5+ years of experience building scalable web ' +
    'applications for high-growth startups and Fortune 500 companies. Proficient in React, ' +
    'Node.js, and cloud infrastructure. Passionate about delivering exceptional user ' +
    'experiences and mentoring junior developers.';

  // Update character counter
  const len = document.getElementById('summary').value.length;
  const cc  = document.getElementById('charCount');
  cc.textContent = `${len} / 500`;
  cc.className   = 'char-count' + (len > 400 ? ' warn' : '');

  // Skills
  S.skills = ['JavaScript','TypeScript','React','Node.js','Python','PostgreSQL','AWS','Docker','Git','GraphQL'];

  // Experience
  S.exp = [
    {
      title: 'Senior Software Engineer', company: 'TechCorp Inc.',
      loc: 'San Francisco, CA', start: 'Jan 2022', end: 'Present', current: true,
      desc: 'Led a team of 4 engineers to build a real-time analytics dashboard serving 2M+ users.\n' +
            'Reduced API response time by 40% through query optimization and Redis caching.\n' +
            'Implemented CI/CD pipelines cutting deployment time from 2 hours to 15 minutes.'
    },
    {
      title: 'Software Engineer', company: 'StartupHub',
      loc: 'Remote', start: 'Jun 2019', end: 'Dec 2021', current: false,
      desc: 'Built and maintained 15+ RESTful APIs consumed by mobile and web clients.\n' +
            'Collaborated with cross-functional teams to deliver 3 major features on schedule.\n' +
            'Raised test coverage from 30% to 85% by introducing unit testing practices.'
    }
  ];

  // Education
  S.edu = [{
    degree: 'Bachelor of Science', school: 'UC Berkeley',
    field: 'Computer Science', start: '2015', end: '2019', gpa: '3.9 / 4.0'
  }];

  // Projects
  S.proj = [
    {
      name: 'OpenTask — Project Management Tool',
      tech: 'React, Node.js, PostgreSQL, WebSockets',
      url:  'github.com/alexchen/opentask',
      desc: 'Real-time collaborative project management app with drag-and-drop boards and ' +
            'live notifications used by 500+ teams.'
    },
    {
      name: 'AI Resume Analyzer',
      tech: 'Python, FastAPI, OpenAI API, React',
      url:  '',
      desc: 'Automated resume screening tool using NLP to match candidates to job descriptions ' +
            'with 92% accuracy.'
    }
  ];

  // Certifications
  S.certs = [
    { name: 'AWS Certified Developer - Associate', org: 'Amazon Web Services', date: 'March 2023' },
    { name: 'Google Professional Data Engineer',   org: 'Google Cloud',        date: 'November 2022' }
  ];

  renderAll();
  saveStorage();
  showToast('Sample data loaded!');
}

/* ----------------------------------------------------------
   15. LOCAL STORAGE
   ---------------------------------------------------------- */
function saveStorage() {
  try {
    localStorage.setItem('resumeBuilderSave', JSON.stringify({
      tpl:    S.tpl,
      dark:   S.dark,
      photo:  S.photo,
      skills: S.skills,
      exp:    S.exp,
      edu:    S.edu,
      proj:   S.proj,
      certs:  S.certs,
      fields: {
        fullName:  g('fullName'),
        profTitle: g('profTitle'),
        email:     g('email'),
        phone:     g('phone'),
        location:  g('location'),
        linkedin:  g('linkedin'),
        website:   g('website'),
        summary:   g('summary')
      }
    }));
  } catch (e) { /* storage may be unavailable */ }
}

function loadStorage() {
  try {
    const raw = localStorage.getItem('resumeBuilderSave');
    if (!raw) return;
    const d = JSON.parse(raw);

    // Template
    if (d.tpl) {
      S.tpl = d.tpl;
      document.querySelectorAll('.tpl-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tpl === d.tpl);
      });
    }

    // Dark mode
    if (d.dark) {
      S.dark = true;
      document.body.setAttribute('data-theme', 'dark');
      document.getElementById('darkBtn').textContent = 'Light Mode';
    }

    // Photo
    if (d.photo) {
      S.photo = d.photo;
      document.getElementById('photoCircle').innerHTML =
        `<img src="${d.photo}" alt="Profile Photo">`;
    }

    // Arrays
    if (d.skills && d.skills.length) S.skills = d.skills;
    if (d.exp    && d.exp.length)    S.exp    = d.exp;
    if (d.edu    && d.edu.length)    S.edu    = d.edu;
    if (d.proj   && d.proj.length)   S.proj   = d.proj;
    if (d.certs  && d.certs.length)  S.certs  = d.certs;

    // Personal fields
    if (d.fields) {
      Object.entries(d.fields).forEach(([key, val]) => {
        const el = document.getElementById(key);
        if (el) el.value = val || '';
      });
      // Sync character counter after restoring summary
      const len = (d.fields.summary || '').length;
      const cc  = document.getElementById('charCount');
      cc.textContent = `${len} / 500`;
      cc.className   = 'char-count' + (len > 400 ? ' warn' : '');
    }
  } catch (e) { /* ignore corrupt data */ }
}

/* ----------------------------------------------------------
   16. TOAST NOTIFICATIONS
   ---------------------------------------------------------- */
function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className   = 'toast' + (type === 'err' ? ' err' : '');
  toast.textContent = msg;
  wrap.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'sout .22s ease forwards';
    setTimeout(() => toast.remove(), 230);
  }, 2600);
}
