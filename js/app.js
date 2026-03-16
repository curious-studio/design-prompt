// Main app JS
(function(){
    // Helper: return random item from comma/newline separated source string
    function pickRandomFromText(text) {
        const items = text.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
        if(items.length === 0) return '';
        return items[Math.floor(Math.random() * items.length)];
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
    const promptOutput = document.getElementById('promptOutput');
    const toast = document.getElementById('copyToast');

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

        const html = `Design <span class="mark">${escapeHtml(useProject)}</span> for a <span class="mark">${escapeHtml(useClient)}</span> in <span class="mark">${escapeHtml(useLocation)}</span> whose clients are <span class="mark">${escapeHtml(useAudience)}</span>. It should feel <span class="mark">${escapeHtml(toneStr)}</span>, and use <span class="mark">${escapeHtml(useColor)}</span> as a key color.`;
        return {html, text: `Design ${useProject} for a ${useClient} in ${useLocation} whose clients are ${useAudience}. It should feel ${toneStr}, and use ${useColor} as a key color.`};
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

    newPromptBtn.addEventListener('click', function(){
        const p = buildPrompt();
        promptOutput.innerHTML = p.html;
    });

    copyBtn.addEventListener('click', function(){
// this is a bug--the builPrompt function is being called twice, which can lead to different outputs if the fields are empty. To fix, we should store the last generated prompt and copy that instead of generating a new one on copy.
        const p = buildPrompt();
        navigator.clipboard.writeText(p.text).then(()=>{
            showToast('Copied to clipboard');
        }).catch(()=>{
            showToast('Copy failed');
        });
    });

    // Initialize with a generated prompt
    newPromptBtn.click();

})();
