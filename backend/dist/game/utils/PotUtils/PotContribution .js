"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotContribution = void 0;
class PotContribution {
    constructor() {
        this._contributions = new Map();
    }
    addContribution(player, amount) {
        const currentContribution = this._contributions.get(player) || 0;
        this._contributions.set(player, currentContribution + amount);
    }
    getTotalContribution(player) {
        return this._contributions.get(player) || 0;
    }
    getContributors() {
        return new Set(this._contributions.keys());
    }
    getTotalPotSize() {
        return Array.from(this._contributions.values()).reduce((sum, amount) => sum + amount, 0);
    }
}
exports.PotContribution = PotContribution;
//# sourceMappingURL=PotContribution%20.js.map