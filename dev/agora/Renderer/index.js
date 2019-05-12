const GlRenderer_1 = require("./GlRenderer")
class GlRenderer {
    constructor() {
        this.self = GlRenderer_1.apply(this);
    }
    bind(element) {
        return this.self.bind(element);
    }
    unbind() {
        return this.self.unbind();
    }
    drawFrame(imageData) {
        return this.self.drawFrame(imageData);
    }
    setContentMode(mode) {
        return this.self.setContentMode(mode);
    }
}
module.exports = { GlRenderer };
