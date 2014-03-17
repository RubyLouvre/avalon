var paging = function (scope) {
    scope.pagingModel = {
        get: function () {
            return { total: scope.total, items: scope.items };
        },
        set: function (value) {
            scope.items = value.items;
            scope.total = value.total;
        }
    };
    scope.url = "/"; //数据源Url
    scope.items = []; //当前页面的数据
    scope.pageIndex = 0; //当前页数
    scope.pageSize = 20; //每页显示的数据条数
    scope.pages = [];//装着所有页码
    scope.total = 0;
    scope.category = 0;
    scope.httpMethod = "POST";
    scope.pagingSize = 10; //页面页码按钮的数量
    scope.showMoreNext = false; //在最大页码后面显示...
    scope.showMorePrev = false;//在最小页码后面显示...
    scope.jumpToPrevPaging = function (e) {
        //跳转到上一组翻页按钮组
        e.preventDefault();
        var pagerIndex = Math.floor((scope.pageIndex) / scope.pagingSize);
        var first = (pagerIndex - 1) * scope.pagingSize;
        var pageIndex = (first + 1) * scope.pagingSize - 1;
        filter.pageSize = scope.pageSize;
        filter.pageIndex = pageIndex;
        filter.category = scope.category;
        getItems(filter, scope.update);
    }
    scope.jumpToNextPaging = function (e) {
        //跳转到下一组翻页按钮组
        e.preventDefault();
        var pagerIndex = Math.floor((scope.pageIndex) / scope.pagingSize);
        var first = pagerIndex * scope.pagingSize;
        var pageIndex = (first + 1) * scope.pagingSize + 1;
        filter.pageSize = scope.pageSize;
        filter.pageIndex = pageIndex;
        filter.category = scope.category;
        getItems(filter, scope.update);
    }
    scope.calc = function () {
        var totalPage = Math.ceil(scope.total / scope.pageSize);
        var pagerIndex = Math.floor((scope.pageIndex) / scope.pagingSize);
        var first = pagerIndex * scope.pagingSize;
        scope.showMorePrev = first > 0;
        var last = (pagerIndex + 1) * scope.pagingSize;
        if (last >= totalPage) //超过最大页就截断
        {
            last = totalPage;
            scope.showMoreNext = false;
        }
        else
            scope.showMoreNext = true;
        scope.pages = avalon.range(first, last);
    };

    scope.addItem = function (item) {
        scope.items.push(avalon.mix(true, {}, item));
        scope.total++;
    };

    scope.removeItem = function (e) {
        e.preventDefault();
        var callback = function (success) {
            if (success) {
                var item = this.$vmodel.$remove();
                scope.items.remove(item);
                scope.total--;
            }
        }
    };

    function compare(a, b) {
        return a.name < b.name ? -1 : 1;
    };

    function getItems(filter, callback) {
        if (scope.httpMethod == "POST") {
            if (scope.onBeforeRequest)
                scope.onBeforeRequest(filter);
            $.post(scope.url, filter, function (result) {
                callback(result);
                scope.onRequestCompleted(result);
            })
        }
        else {

        }
    };

    scope.sort = function (compare) {
        scope.items.sort(compare);
    };

    scope.jumpToLastPage = function (e) {
        e.preventDefault();
        filter.pageSize = scope.pageSize;
        filter.pageIndex = Math.ceil(scope.total / scope.pageSize);
        filter.category = scope.category;
        getItems(filter, scope.update);
    };

    scope.jumpToFirstPage = function (e) {
        e.preventDefault();
        filter.pageSize = scope.pageSize;
        filter.pageIndex = 0 + 1;
        filter.category = scope.category;
        getItems(filter, scope.update);
    };

    scope.jumpToNextPage = function (e) {
        e.preventDefault();
        var filter = {};
        filter.pageSize = scope.pageSize;
        filter.pageIndex = scope.pageIndex + 1 + 1;
        filter.category = scope.category;
        getItems(filter, scope.update);
    };

    scope.jumpPage = function (e) {
        e.preventDefault();
        var filter = {};
        filter.pageSize = scope.pageSize;
        filter.pageIndex = scope.pages[this.$vmodel.$index] + 1;
        filter.category = scope.category;
        getItems(filter, scope.update);
    };

    scope.update = function (result) {
        if (result) {
            scope.items = result.items;
            scope.total = result.total;
            scope.pageIndex = result.filter.PageIndex - 1;
            scope.calc();
        }
    }

    scope.onBeforeRequest = function (filter) {
    }

    scope.onRequestCompleted = function (result)
    { }
    var handlers = {};
    scope.addHandler = function (name, func) {
        handlers[name] = func;
    }
    scope.click = function (handlerName, param) {
        try {
            handlers[handlerName](param);
        } catch (e) { }
    }

}
var pagingFactory =
{
    create: function (name, model, category) {
        var _ = avalon.define(name, paging);
        _.items = model.items;
        _.total = model.total;
        if (category) {
            _.category = category;
        }
        _.calc();
        return _;
    }
}
