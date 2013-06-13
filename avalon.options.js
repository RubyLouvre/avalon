avalon.bindingHandlers.options = function(data, scopes) {
    var elem = data.element;
    if (elem.tagName !== "SELECT") {
        avalon.error("options绑定只能绑在SELECT元素");
    }
    while (elem.length > 0) {
        elem.remove(0);
    }
    var index = data.args[0];
    watchView(data.value, scopes, data, function(val) {
        if (Array.isArray(val)) {
            nextTick(function() {
                elem.setAttribute(prefix + "each-option", data.value);
                var op = new Option("{{option}}", "");
                op.setAttribute("ms-value", "option");
                elem.options[0] = op;
                avalon.scan(elem);
                if (isFinite(index)) {
                    op = elem.options[index];
                    if (op) {
                        op.selected = true;
                    }
                }
                var scope = scopes[0];
                if (index && Array.isArray(scope[index])) {
                    var god = avalon(elem);
                    god.val(scope[index]);
                    god.bind("change", function() {
                        var array = god.val();
                        val.clear();
                        val.push.apply(val, array);
                    });
                }
            });
        } else {
            avalon.error("options绑定必须对应一个字符串数组");
        }
    });
}