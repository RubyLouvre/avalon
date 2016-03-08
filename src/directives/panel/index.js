var template = require("text!./panel.html")
avalon.component("av-panel", {
    template: template,
    defaults: {
        title: "标题"
    }
})