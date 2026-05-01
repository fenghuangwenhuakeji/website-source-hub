/**
 * =================================================================================================
 * DungeonSpire - The Merchant (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class MerchantNPC extends NPC {
    constructor() {
        super({
            id: 'merchant',
            name: 'The Merchant',
            dialogue: [
                "Buy something, will ya?",
                "I like your haircut.",
                "Have you seen my dog?",
                "No refunds!"
            ]
        });
    }
}