/**
 * =================================================================================================
 * DungeonSpire - Fire Particle
 * =================================================================================================
 */
export class FireParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 3 - 1;
        this.life = 1.0;
        this.color = '#ff4500';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
}