export class IsHealthLow {
    check(entity) {
        return entity.hp < entity.maxHp * 0.3;
    }
}