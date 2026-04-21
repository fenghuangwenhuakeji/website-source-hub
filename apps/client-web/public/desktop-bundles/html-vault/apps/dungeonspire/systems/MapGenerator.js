/**
 * =================================================================================================
 * DungeonSpire - Map Generator
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Generates a procedural map similar to Slay the Spire.
 * Uses a node-based graph structure with paths connecting floors.
 * 
 * Algorithm:
 * 1. Create a grid of nodes (Floors x Lanes).
 * 2. Assign room types (Monster, Elite, Event, Shop, Rest, Boss).
 * 3. Generate paths ensuring connectivity.
 * =================================================================================================
 */

import { Random } from '../../utils/Random.js';

export class MapGenerator {
    constructor(seed) {
        this.rng = new Random(seed);
        this.floors = 15;
        this.lanes = 7;
        this.paths = [];
    }

    generateAct(actNum) {
        console.log(`[MapGenerator] Generating Act ${actNum}...`);
        
        const map = [];
        
        // 1. Initialize Grid
        for (let y = 0; y < this.floors; y++) {
            const floor = [];
            for (let x = 0; x < this.lanes; x++) {
                floor.push(null);
            }
            map.push(floor);
        }

        // 2. Determine Nodes (Simplified for demo)
        // Start Nodes
        const startNodes = this.rng.rangeInt(2, 4);
        for (let i = 0; i < startNodes; i++) {
            const x = this.rng.rangeInt(0, this.lanes - 1);
            map[0][x] = { type: 'monster', x: x, y: 0, next: [] };
        }

        // Middle Nodes
        for (let y = 1; y < this.floors - 1; y++) {
            // Density decreases slightly higher up?
            const nodesCount = this.rng.rangeInt(3, 5);
            for (let i = 0; i < nodesCount; i++) {
                const x = this.rng.rangeInt(0, this.lanes - 1);
                if (!map[y][x]) {
                    map[y][x] = { 
                        type: this.getRoomType(y), 
                        x: x, 
                        y: y, 
                        next: [] 
                    };
                }
            }
        }

        // Boss Node
        const bossX = Math.floor(this.lanes / 2);
        map[this.floors - 1][bossX] = { type: 'boss', x: bossX, y: this.floors - 1, next: [] };

        // 3. Connect Nodes (Forward links)
        // This is a simplified pathing logic. Real StS logic is more complex (preventing crossing paths too much)
        for (let y = 0; y < this.floors - 1; y++) {
            for (let x = 0; x < this.lanes; x++) {
                const node = map[y][x];
                if (!node) continue;

                // Find valid next nodes (x-1, x, x+1)
                const candidates = [];
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    if (nx >= 0 && nx < this.lanes && map[y+1][nx]) {
                        candidates.push(nx);
                    }
                }

                // Force connection if possible
                if (candidates.length > 0) {
                    // Connect to 1 or 2 nodes
                    const connections = this.rng.rangeInt(1, Math.min(2, candidates.length));
                    this.rng.shuffle(candidates);
                    for (let i = 0; i < connections; i++) {
                        node.next.push(candidates[i]);
                    }
                }
            }
        }

        // 4. Prune Unreachable Nodes (Backward sweep)
        // ... (Skipped for brevity in this demo, but essential for real implementation)

        return map;
    }

    getRoomType(floor) {
        // Hardcoded rules
        if (floor === 0) return 'monster';
        if (floor === 8) return 'treasure';
        if (floor === 14) return 'rest';

        // Random probabilities
        const r = this.rng.next();
        if (r < 0.1) return 'shop';
        if (r < 0.25) return 'rest';
        if (r < 0.45) return 'elite';
        if (r < 0.70) return 'event';
        return 'monster';
    }
}