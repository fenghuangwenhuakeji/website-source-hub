/**
 * =================================================================================================
 * DungeonSpire - VFX Manager
 * Version: 2.0.0
 * =================================================================================================
 * Description:
 * Handles screen shake, flash effects, floating text, and dynamic feedback.
 * =================================================================================================
 */

export class VFXManager {
    constructor() {
        this.app = document.getElementById('app');
        this.container = document.body;
    }

    /**
     * Shakes the screen.
     * @param {string} intensity 'small', 'medium', 'heavy'
     */
    screenShake(intensity = 'medium') {
        const el = document.getElementById('game-view') || this.app;
        if (!el) return;
        
        el.classList.remove('shake-small', 'shake-medium', 'shake-heavy');
        void el.offsetWidth; // Trigger reflow
        el.classList.add(`shake-${intensity}`);
        
        setTimeout(() => {
            el.classList.remove(`shake-${intensity}`);
        }, 500);
    }

    /**
     * Spawns floating text at coordinates.
     */
    showFloatingText(x, y, text, color = '#fff', size = '1.5rem') {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.color = color;
        el.style.fontSize = size;
        el.style.fontWeight = 'bold';
        el.style.textShadow = '2px 2px 0 #000';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';
        el.style.transition = 'all 1s ease-out';
        el.style.opacity = '1';
        
        document.body.appendChild(el);

        // Animate
        requestAnimationFrame(() => {
            el.style.top = `${y - 100}px`;
            el.style.opacity = '0';
            el.style.transform = `scale(1.5)`;
        });

        setTimeout(() => el.remove(), 1000);
    }

    /**
     * Flashes the screen a color.
     */
    screenFlash(color = 'white', duration = 0.1) {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = 0;
        flash.style.left = 0;
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = color;
        flash.style.opacity = 0.5;
        flash.style.zIndex = 10000;
        flash.style.pointerEvents = 'none';
        flash.style.transition = `opacity ${duration}s`;

        document.body.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = 0;
        });

        setTimeout(() => flash.remove(), duration * 1000 + 100);
    }
    
    /**
     * Create a particle explosion at x, y
     */
    createExplosion(x, y, color = '#ffaa00') {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            p.style.width = '6px';
            p.style.height = '6px';
            p.style.backgroundColor = color;
            p.style.borderRadius = '50%';
            p.style.pointerEvents = 'none';
            p.style.zIndex = '9998';
            document.body.appendChild(p);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            const anim = p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 500 + Math.random() * 500,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            });

            anim.onfinish = () => p.remove();
        }
    }
}