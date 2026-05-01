import { ContentRegistry } from '../../src/systems/ContentRegistry.js';

export class EnemyFactory {
    static createEnemy(id, level) {
        const data = ContentRegistry.get('enemies', id);
        if (!data) return null;
        
        const enemy = { ...data };
        // 根据等级动态调整属性
        enemy.hp = Math.floor(enemy.hp * (1 + level * 0.1));
        enemy.atk = Math.floor(enemy.atk * (1 + level * 0.1));
        return enemy;
    }
}