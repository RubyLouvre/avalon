var heredoc = require('./heredoc')
var avalon = require('../../dist/avalon')
avalon.component("ms-pager", {
    template: heredoc(function () {
        /*
         <div class="pagination">
         <ul>
         <li :for="el in @pages" 
         :class="[ el == @currentPage && 'active' ]">
         <a href="javascript:void(0)" :click="@gotoPage(el, $event)">{{el}}</a>
         </li>
         </ul>
         </div>
         */
    }),
    defaults: {
        totalPage: 25,
        currentPage: 1,
        showPage: 7,
        pages: [1, 2, 3, 4, 5, 6, 7],
        gotoPage: function (page, e) {
            this.currentPage = page;
            this.pages = this.getPages();
        },
        getPages: function () {
            var pages = [];
            var s = this.showPage, l = this.currentPage, r = this.currentPage, c = this.totalPage;
            pages.push(l);
            while (true) {
                if (pages.length >= s) {
                    break;
                }
                if (l > 1) {
                    pages.unshift(--l);
                }
                if (pages.length >= s) {
                    break;
                }
                if (r < c) {
                    pages.push(++r);
                }
            }

            return pages;
        }
    }
});