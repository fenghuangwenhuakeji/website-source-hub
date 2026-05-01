export class EventFactory {
    constructor() {
        this.events = [];
    }

    loadEvents(eventList) {
        this.events = eventList;
    }

    triggerRandomEvent(player) {
        const event = this.events[Math.floor(Math.random() * this.events.length)];
        return event;
    }
}