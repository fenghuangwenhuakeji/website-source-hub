/**
 * =================================================================================================
 * DungeonSpire - Skill Base Class
 * =================================================================================================
 */
export class Skill {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // active, passive
        this.cooldown = data.cooldown || 0;
        this.currentCooldown = 0;
        this.description = data.description || "";
        this.icon = data.icon || 'assets/skills/placeholder.png';
    }

    use(user, target) {}
    update(dt) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt;
        }
    }
}