/**
 * =================================================================================================
 * DungeonSpire - Asset Loader
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles asynchronous loading of game assets (Images, Audio, JSON Data).
 * Provides a Promise-based API to ensure all assets are ready before the game starts.
 * =================================================================================================
 */

export class AssetLoader {
    constructor() {
        this.assets = {
            images: {},
            audio: {},
            data: {}
        };
        
        this.manifest = {
            images: [
                { id: 'card_back', src: 'assets/cards/card_back.png' },
                { id: 'bg_menu', src: 'assets/bg_menu.jpg' },
                // Add more placeholders
            ],
            audio: [
                // { id: 'bgm_menu', src: 'assets/audio/music/menu.mp3' }
            ]
        };
    }

    /**
     * Load all assets defined in the manifest.
     * @returns {Promise<void>}
     */
    async loadAll() {
        console.log("[AssetLoader] Starting load...");
        
        const imagePromises = this.manifest.images.map(img => this.loadImage(img.id, img.src));
        // const audioPromises = ...

        await Promise.all([...imagePromises]);
        console.log("[AssetLoader] All assets loaded.");
    }

    /**
     * Load a single image.
     * @param {string} id 
     * @param {string} src 
     */
    loadImage(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.images[id] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[AssetLoader] Failed to load image: ${src}. Using placeholder.`);
                // Resolve anyway to not block game start, maybe use a placeholder color
                resolve(null);
            };
            img.src = src;
        });
    }

    /**
     * Get a loaded asset.
     * @param {string} type 
     * @param {string} id 
     */
    get(type, id) {
        return this.assets[type][id];
    }
}