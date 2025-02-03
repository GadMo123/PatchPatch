"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionLock = void 0;
class PositionLock {
    constructor() {
        this.isLocked = false;
        this.waiting = [];
    }
    acquire() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isLocked) {
                yield new Promise(resolve => this.waiting.push(resolve));
            }
            this.isLocked = true;
        });
    }
    release() {
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            if (next)
                next();
        }
        else {
            this.isLocked = false;
        }
    }
}
exports.PositionLock = PositionLock;
//# sourceMappingURL=PositionLock.js.map