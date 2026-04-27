// Main app JS
(function(){
    // Helper: return random item from comma/newline separated source string
    function pickRandomFromText(text) {
        const items = text.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
        if(items.length === 0) return '';
        return items[Math.floor(Math.random() * items.length)];
    }

    function getArticle(value) {
        const firstChar = String(value || '').trim().charAt(0).toLowerCase();
        return /^[aeiou]$/.test(firstChar) ? 'an' : 'a';
    }

    function pickNRandomFromText(text, n) {
        const pool = text.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
        const out = [];
        if(pool.length === 0) return out;
        while(out.length < n && out.length < pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            if(!out.includes(pick)) out.push(pick);
        }
        return out;
    }

    const newPromptBtn = document.getElementById('newPrompt');
    const copyBtn = document.getElementById('copyBtn');
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeToggleText = document.querySelector('.theme-toggle-text');
    const promptOutput = document.getElementById('promptOutput');
    const toast = document.getElementById('copyToast');
    const customizeForm = document.getElementById('customizeForm');
    const themeStorageKey = 'prompterTheme';
    let lastPromptText = '';
    let promptAnimationTimer = null;

    function buildPrompt() {
        const projectType = (document.getElementById('projectType').value || '').trim();
        const client = (document.getElementById('client').value || '').trim();
        const location = (document.getElementById('location').value || '').trim();
        const audience = (document.getElementById('audience').value || '').trim();
        const tone = (document.getElementById('tone').value || '').trim();
        const keyColor = (document.getElementById('keyColor').value || '').trim();

        // fallback to hidden lists when fields are empty
        const projectTypeText = document.getElementById('projectTypes').value || '';
        const clientsText = document.getElementById('clients').value || '';
        const locationsText = document.getElementById('locations').value || '';
        const demosText = document.getElementById('demographics').value || '';
        const descriptorsText = document.getElementById('descriptors').value || '';
        const colorsText = document.getElementById('colors').value || '';

        const useProject = projectType || pickRandomFromText(projectTypeText);
        const useClient = client || pickRandomFromText(clientsText);
        const useLocation = location || pickRandomFromText(locationsText);
        const useAudience = audience || pickRandomFromText(demosText);
        const useColor = keyColor || pickRandomFromText(colorsText);

        let selectedTones = [];
        if(tone) {
            selectedTones = tone.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).slice(0,3);
            if(selectedTones.length < 3) {
                const extra = pickNRandomFromText(descriptorsText, 3 - selectedTones.length);
                selectedTones = selectedTones.concat(extra).slice(0,3);
            }
        } else {
            selectedTones = pickNRandomFromText(descriptorsText, 3);
        }

        const toneStr = selectedTones.join(', ');

        const projectArticle = getArticle(useProject);
        const clientArticle = getArticle(useClient);
        const html = `Design ${projectArticle} <span class="mark">${escapeHtml(useProject)} </span> for ${clientArticle} <span class="mark">${escapeHtml(useClient)}</span>. <span class="prompt-secondary avoid-orphans">The client serves <span class="mark">${escapeHtml(useAudience)} </span> in <span class="mark">${escapeHtml(useLocation)}</span>, wants the design to feel <span class="mark">${escapeHtml(toneStr)}</span>, and to use <span class="mark">${escapeHtml(useColor)} </span> as a key color.</span>`;
        return {
            html,
            text: `Design ${projectArticle} ${useProject}  for ${clientArticle} ${useClient} in ${useLocation}  whose clients are ${useAudience}. It should feel ${toneStr}, and use ${useColor}  as a key color.`,
            values: {
                projectType: useProject,
                client: useClient,
                location: useLocation,
                audience: useAudience,
                tone: toneStr,
                keyColor: useColor
            }
        };
    }

    function updatePlaceholders(values) {
        document.getElementById('projectType').placeholder = values.projectType;
        document.getElementById('client').placeholder = values.client;
        document.getElementById('location').placeholder = values.location;
        document.getElementById('audience').placeholder = values.audience;
        document.getElementById('tone').placeholder = values.tone;
        document.getElementById('keyColor').placeholder = values.keyColor;
    }

    function escapeHtml(s){
        return String(s).replace(/[&<>\\"]/g, function(c){
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
        });
    }

    function showToast(msg){
        if(!toast) return;
        toast.textContent = msg || 'Copied to clipboard';
        toast.classList.add('visible');
        setTimeout(()=>toast.classList.remove('visible'), 1800);
    }

    function setCopyButtonState(active) {
        if(active) {
            copyBtn.classList.remove('copied');
            copyBtn.disabled = false;
        } else {
            copyBtn.classList.add('copied');
            copyBtn.disabled = true;
        }
    }

    function wrapWordsInSpans(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.trim()) {
                textNodes.push(node);
            }
        }
        textNodes.forEach(textNode => {
            if (textNode.parentNode) {  // still attached
                if (textNode.parentElement && textNode.parentElement.classList.contains('mark')) {
                    textNode.parentElement.classList.add('word');
                } else {
                    const words = textNode.nodeValue.split(/\s+/);
                    const fragment = document.createDocumentFragment();
                    words.forEach((word, index) => {
                        if (word) {
                            const span = document.createElement('span');
                            span.className = 'word';
                            span.textContent = word;
                            fragment.appendChild(span);
                            if (index < words.length - 1) {
                                fragment.appendChild(document.createTextNode(' '));
                            }
                        }
                    });
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            }
        });
    }

    function animatePromptText(plainText, fullHtml) {
        if(promptAnimationTimer) {
            clearInterval(promptAnimationTimer);
            promptAnimationTimer = null;
        }

        promptOutput.innerHTML = fullHtml;
        wrapWordsInSpans(promptOutput);
        const words = promptOutput.querySelectorAll('.word');
        let index = 0;

        promptAnimationTimer = setInterval(() => {
            if (index < words.length) {
                words[index].classList.add('visible');
                index += 1;
            } else {
                clearInterval(promptAnimationTimer);
                promptAnimationTimer = null;
            }
        }, 25);
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        if (!themeToggleBtn) return;
        themeToggleBtn.checked = theme === 'dark';
        themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        if (themeToggleText) {
            themeToggleText.textContent = theme === 'dark' ? 'light mode' : 'dark mode';
        }
    }

    function getInitialTheme() {
        const saved = localStorage.getItem(themeStorageKey);
        if(saved === 'dark' || saved === 'light') return saved;
        return 'dark';
    }

    function setTheme(theme) {
        applyTheme(theme);
        localStorage.setItem(themeStorageKey, theme);
    }

    themeToggleBtn?.addEventListener('change', function(){
        setTheme(themeToggleBtn.checked ? 'dark' : 'light');
    });

    newPromptBtn.addEventListener('click', function(){
        const p = buildPrompt();
        updatePlaceholders(p.values);
        lastPromptText = p.text;
        setCopyButtonState(true);
        animatePromptText(p.text, p.html);
    });

    customizeForm.addEventListener('keydown', function(event){
        if(event.key === 'Enter'){
            event.preventDefault();
            newPromptBtn.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    copyBtn.addEventListener('click', function(){
        const textToCopy = lastPromptText || promptOutput.textContent || '';
        navigator.clipboard.writeText(textToCopy).then(()=>{
            showToast('Copied to clipboard');
            setCopyButtonState(false);
        }).catch(()=>{
            showToast('Copy failed');
        });
    });

    // Initialize theme and prompt
    setTheme(getInitialTheme());
    newPromptBtn.click();

})();
