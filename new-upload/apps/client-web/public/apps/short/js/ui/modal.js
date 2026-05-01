export class ModalManager {
    constructor() {}

    open(id) {
        document.getElementById(id).classList.add('active');
    }

    close(id) {
        document.getElementById(id).classList.remove('active');
    }
}

export const modalManager = new ModalManager();