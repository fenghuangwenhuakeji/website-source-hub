/**
 * =================================================================================================
 * DungeonSpire - Tooltip Manager
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Manages the display and positioning of floating tooltips for cards, relics, and powers.
 * =================================================================================================
 */

export class TooltipManager {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'tooltip hidden';
        document.body.appendChild(this.el);
        
        this.active = false;
    }

    show(x, y, title, body) {
        this.el.innerHTML = `<div class="tooltip-title">${title}</div><div class="tooltip-body">${body}</div>`;
        this.el.classList.remove('hidden');
        
        // Positioning logic to keep on screen
        const rect = this.el.getBoundingClientRect();
        let top = y + 20;
        let left = x + 20;

        if (left + rect.width > window.innerWidth) {
            left = x - rect.width - 10;
        }
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - 10;
        }

        this.el.style.top = `${top}px`;
        this.el.style.left = `${left}px`;
        this.active = true;
    }

    hide() {
        if (this.active) {
            this.el.classList.add('hidden');
            this.active = false;
        }
    }
}