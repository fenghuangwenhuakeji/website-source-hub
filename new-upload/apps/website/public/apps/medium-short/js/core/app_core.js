export const App = {
    init: async () => {
        try { await DB.init(); } catch(e) { console.error(e); }
        App.nav('home');
    },
    nav: (mod) => {
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if(el) el.classList.add('active');
        
        const vp = document.getElementById('viewport');
        
        // Keep-Alive Logic: Hide all existing views instead of clearing innerHTML
        Array.from(vp.children).forEach(child => {
            child.style.display = 'none';
        });

        let view = document.getElementById(`module-view-${mod}`);
        
        if (!view) {
            // Create new view if it doesn't exist
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod] ? Modules[mod].render() : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
            vp.appendChild(view);
            
            // Initialize module only once
            if(Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init();
                } catch(e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }
        
        // Show the requested view
        view.style.display = 'block';
        
        // Trigger resize to fix layout issues (charts, canvas)
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
};
