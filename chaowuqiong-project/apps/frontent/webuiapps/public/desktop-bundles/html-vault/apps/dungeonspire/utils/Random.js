/**
 * =================================================================================================
 * DungeonSpire - Random Number Generator (Seeded)
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * A seeded random number generator (RNG) class.
 * Essential for Roguelike games to ensure runs are reproducible via seed.
 * Implements a Linear Congruential Generator (LCG) or similar algorithm.
 * =================================================================================================
 */

export class Random {
    /**
     * Create a new RNG instance.
     * @param {number|string} seed - The seed for the generator.
     */
    constructor(seed = Date.now()) {
        this._seed = this._hashString(String(seed));
        this.initialSeed = this._seed;
        this.usageCount = 0;
    }

    /**
     * Internal hash function to convert string seeds to numbers.
     */
    _hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * The core next-float generator (0 to 1).
     * Uses a simple Park-Miller algorithm.
     */
    next() {
        this.usageCount++;
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    }

    /**
     * Returns a float between min (inclusive) and max (exclusive).
     */
    range(min, max) {
        return this.next() * (max - min) + min;
    }

    /**
     * Returns an integer between min (inclusive) and max (inclusive).
     */
    rangeInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns true/false based on probability (0-1).
     */
    boolean(chance = 0.5) {
        return this.next() < chance;
    }

    /**
     * Pick a random element from an array.
     */
    pick(array) {
        if (!array || array.length === 0) return undefined;
        return array[this.rangeInt(0, array.length - 1)];
    }

    /**
     * Shuffle an array in place.
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Weighted pick.
     * @param {Object} weights - { item: weight, item2: weight }
     */
    weightedPick(weights) {
        const keys = Object.keys(weights);
        const totalWeight = keys.reduce((sum, key) => sum + weights[key], 0);
        let random = this.next() * totalWeight;
        
        for (const key of keys) {
            random -= weights[key];
            if (random <= 0) return key;
        }
        return keys[0];
    }

    /**
     * Reset the generator to its initial seed.
     */
    reset() {
        this._seed = this.initialSeed;
        this.usageCount = 0;
    }

    /**
     * Save current state.
     */
    getState() {
        return {
            seed: this.initialSeed,
            current: this._seed,
            usage: this.usageCount
        };
    }

    /**
     * Load state.
     */
    loadState(state) {
        this.initialSeed = state.seed;
        this._seed = state.current;
        this.usageCount = state.usage;
    }
}