var template = require("text!./panel.html")
avalon.component("a-panel", {
    template: template,
    defaults: {
        title: "标题"
    }
})