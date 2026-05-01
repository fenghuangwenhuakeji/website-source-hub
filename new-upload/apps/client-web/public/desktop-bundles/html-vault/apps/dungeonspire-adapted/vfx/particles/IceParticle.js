/**
 * =================================================================================================
 * DungeonSpire - Ice Particle
 * =================================================================================================
 */
export class IceParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = Math.random() * 2 + 1;
        this.life = 1.0;
        this.color = '#00ffff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
    }
}