/**
 * =================================================================================================
 * DungeonSpire - Map Screen
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles the visualization and interaction of the dungeon map.
 * Draws nodes, paths, and handles node selection.
 * =================================================================================================
 */

import { globalBus } from '../../core/EventBus.js';

export class MapScreen {
    constructor() {
        this.container = document.getElementById('map-scene');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapData = null;
        this.currentFloor = 0;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.container.appendChild(this.canvas);

        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render();
        });

        // Click handler
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    show(mapData, currentFloor) {
        this.mapData = mapData;
        this.currentFloor = currentFloor;
        this.container.classList.remove('hidden');
        this.render();
    }

    hide() {
        this.container.classList.add('hidden');
    }

    render() {
        if (!this.mapData) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Constants for layout
        const nodeRadius = 25;
        const floorHeight = this.canvas.height / (this.mapData.length + 1);
        const laneWidth = this.canvas.width / (this.mapData[0].length + 1);

        // Draw Paths first (so they are behind nodes)
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);

        for (let y = 0; y < this.mapData.length; y++) {
            for (let x = 0; x < this.mapData[y].length; x++) {
                const node = this.mapData[y][x];
                if (!node) continue;

                const cx = (x + 1) * laneWidth;
                const cy = this.canvas.height - ((y + 1) * floorHeight);

                // Store render coords for click detection
                node.renderX = cx;
                node.renderY = cy;
                node.renderRadius = nodeRadius;

                // Draw lines to next nodes
                if (node.next) {
                    node.next.forEach(nextX => {
                        const nextY = y + 1;
                        if (this.mapData[nextY] && this.mapData[nextY][nextX]) {
                            const nx = (nextX + 1) * laneWidth;
                            const ny = this.canvas.height - ((nextY + 1) * floorHeight);
                            
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(nx, ny);
                            ctx.stroke();
                        }
                    });
                }
            }
        }

        ctx.setLineDash([]);

        // Draw Nodes
        for (let y = 0; y < this.mapData.length; y++) {
            for (let x = 0; x < this.mapData[y].length; x++) {
                const node = this.mapData[y][x];
                if (!node) continue;

                const cx = node.renderX;
                const cy = node.renderY;

                // Style based on type and status
                ctx.beginPath();
                ctx.arc(cx, cy, nodeRadius, 0, Math.PI * 2);
                
                // Fill logic
                if (y < this.currentFloor) {
                    ctx.fillStyle = '#444'; // Visited
                } else if (y === this.currentFloor) {
                     // Current available options (simplified logic)
                     // In real app, we check if connected to previous node
                    ctx.fillStyle = '#eee'; 
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#777'; // Future
                }

                ctx.fill();
                
                // Icon placeholder
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '12px Arial';
                ctx.fillText(node.type.substring(0, 1).toUpperCase(), cx, cy);
            }
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check collision with nodes
        // Only allow clicking nodes on current floor
        const floorNodes = this.mapData[this.currentFloor];
        if (!floorNodes) return;

        for (let x = 0; x < floorNodes.length; x++) {
            const node = floorNodes[x];
            if (!node) continue;

            const dx = clickX - node.renderX;
            const dy = clickY - node.renderY;
            if (dx*dx + dy*dy <= node.renderRadius * node.renderRadius) {
                console.log(`Clicked node: ${node.type} at ${x},${this.currentFloor}`);
                globalBus.emit('node_selected', node);
                return;
            }
        }
    }
}