/**
 * =================================================================================================
 * DungeonSpire - Dialogue System
 * Version: 1.0.0
 * Description: Handles story dialogue overlays with portraits.
 * =================================================================================================
 */

export class DialogueSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'dialogue-overlay hidden';
        this.container.innerHTML = `
            <div class="dialogue-portrait"></div>
            <div class="dialogue-content">
                <div class="dialogue-name" style="font-weight:bold; color:#ffd700; margin-bottom:5px;"></div>
                <div class="dialogue-text"></div>
                <div class="dialogue-hint" style="font-size:0.8rem; color:#aaa; margin-top:10px;">(Click to continue)</div>
            </div>
        `;
        document.body.appendChild(this.container);
        
        this.queue = [];
        this.isShowing = false;
        
        this.container.addEventListener('click', () => this.next());
    }

    /**
     * Add a line of dialogue.
     * @param {string} name Character name
     * @param {string} text Dialogue text
     * @param {string} portraitUrl Optional image URL
     */
    say(name, text, portraitUrl = null) {
        this.queue.push({ name, text, portraitUrl });
        if (!this.isShowing) {
            this.showNext();
        }
    }

    showNext() {
        if (this.queue.length === 0) {
            this.hide();
            return;
        }

        this.isShowing = true;
        const line = this.queue.shift();
        
        this.container.querySelector('.dialogue-name').textContent = line.name;
        this.container.querySelector('.dialogue-text').textContent = line.text;
        
        const portrait = this.container.querySelector('.dialogue-portrait');
        if (line.portraitUrl) {
            portrait.style.backgroundImage = `url('${line.portraitUrl}')`;
            portrait.style.backgroundSize = 'cover';
            portrait.style.display = 'block';
        } else {
            portrait.style.display = 'none';
        }

        this.container.classList.remove('hidden');
    }

    next() {
        this.showNext();
    }

    hide() {
        this.isShowing = false;
        this.container.classList.add('hidden');
    }
}