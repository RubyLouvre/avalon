define(["avalon.position", "text!avalon.datepicker.html"], function(avalon, tmpl) {

    var widget = avalon.ui.datepicker = function(element, data, vmodels) {
        var $element = avalon(element), options = data.datepickerOptions, model
        var now = new Date, datepickerEl
        //   element.stopScan = true

        var model = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options)
            vm.currentYear = now.getFullYear()
            vm.currentMonth = now.getMonth()
            vm.currentDate = now.getDate()
            vm.title = {
                get: function() {
                    var format = "";
                    if (!this.changeYear && this.changeMonth) {
                        format = "yyyy年";
                    } else if (this.formatTitle) {
                        format = this.formatTitle
                    } else if (this.changeYear && !this.changeMonth) {
                        format = "MMMM";
                    } else if (!this.changeYear && !this.changeMonth) {
                        format = "MMMM yyyy年";
                    }
                    return format && avalon.filters.date(new Date(this.currentYear, this.currentMonth, this.currentDate), format);
                }
            };
            vm.years = {
                get: function() {
                    var d = new Date(vm.currentYear, vm.currentMonth, vm.currentDate)
                    var y = d.getFullYear()
                    var match = this.yearRange.split(":")
                    var min = Function("y", "return " + match[0])(y)
                    var max = Function("y", "return " + match[1])(y)
                    return avalon.range(min, max + 1)
                }
            }
            vm.$watch("currentMonth", function(val) {
                var d = new Date(vm.currentYear, vm.currentMonth, vm.currentDate)
                d.setMonth(val);
                vm.weeks = getWeeks(d);
                vm.title = NaN;
            });
            vm.$watch("currentYear", function(val) {
                var d = new Date(vm.currentYear, vm.currentMonth, vm.currentDate)
                d.setFullYear(val);
                vm.weeks = getWeeks(d);
                vm.title = NaN;
            })
            vm.updateMonth = function(n) {
                var d = new Date(vm.currentYear, vm.currentMonth, vm.currentDate)
                var m = d.getMonth();
                d.setMonth(m + n);
                if (vm.minDate && d < vm.minDate)
                    return
                if (vm.maxDate && d > vm.maxDate)
                    return
                m = d.getMonth();
                var y = d.getFullYear();
                vm.currentYear = y;
                vm.currentMonth = m
            }
            vm.showDate = function(date) {
                var val = true
                if (vm.minDate) {
                    val = date.time > vm.minDate
                    if (val === false)
                        return false
                }
                if (vm.maxDate) {
                    val = date.time < vm.maxDate;
                    if (val === false)
                        return false
                }
                return true
            }
            vm.showMonth = function(val) {
                var disabled = false;
                var now = new Date(vm.currentYear, vm.currentMonth, vm.currentDate)
                now.setMonth(val)
                if (vm.minDate) {
                    disabled = now < vm.minDate
                }
                if (disabled && vm.maxDate) {
                    disabled = now > vm.maxDate
                }
                return !disabled
            }
            vm.showYear = function(val) {
                var disabled = false;
                if (vm.minDate) {
                    disabled = val < vm.minDate.getFullYear();
                }
                if (disabled && vm.maxDate) {
                    disabled = val > vm.maxDate.getFullYear();
                }
                return !disabled
            }
            vm.minDate = new Date(2012, 10, 7)
            vm.selectedTime = NaN
            vm.selectTime = function(e, date) {
                e.preventDefault()
                vm.selectedTime = date.time
                vm.toggle = false
            }
            vm.isToday = function(date) {
                return date.year == now.getFullYear() && date.month === now.getMonth() && date.date === now.getDate()
            }
            vm.hide = function() {
                vm.toggle = false
            }
            vm.today = function() {
                model.currentYear = now.getFullYear()
                model.currentMonth = now.getMonth()
                model.currentDate = now.getDate()
            }
            function getGroups(a) {
                var groups = []
                for (var ii = 0; ii < a; ii++) {
                    groups.push({
                        number: ii
                    })
                }
                vm.groups = groups
            }

            vm.$watch("numberOfMonths", getGroups)
            getGroups(vm.numberOfMonths)
            vm.calculateWeek = function(date) {
                var time,
                        checkDate = new Date(date.time);
                checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
                time = checkDate.getTime();
                checkDate.setMonth(0); // Compare with Jan 1
                checkDate.setDate(1);
                return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
            }
            function  getWeeks(ooo) {
                var year = ooo.getFullYear();
                var month = ooo.getMonth();//得到今天是几月（0 ~ 11）
                var date = ooo.getDate();  //得到今天是几号 （1 ~ 31）
                var cur = new Date(year, month, date)
                cur.setMonth(month + 1);//改为下一个月，
                //由于日期是1 ~ 31， 0则是退到上一个月的最后一天，于是得到这个月的总天数
                cur.setDate(0);
                var num = cur.getDate();
                var next = 6 - cur.getDay();

                var dates = avalon.range(1, num + 1);
                dates = dates.map(function(d) {
                    return {
                        year: year,
                        month: month,
                        date: d,
                        time: new Date(year, month, d) - 0
                    }
                });
                cur.setMonth(month);
                cur.setDate(1);//得到当月的第一天
                var prev = cur.getDay();//0 ~ 6
                cur.setDate(date);//还原
                for (var i = 0; i < prev; i++) {//补上上一个月的日期
                    var curr = new Date(year, month, -1 * i)
                    dates.unshift({
                        year: year,
                        month: month - 1,
                        date: curr.getDate(),
                        time: curr - 0
                    })
                }
                for (var i = 0; i < next; i++) {//补上下一个月的日期
                    var curr = new Date(year, month + 1, i + 1)
                    dates.push({
                        year: year,
                        month: month + 1,
                        date: curr.getDate(),
                        time: curr - 0
                    })
                }
                var ret = [];
                while (dates.length) {//每行七个分组
                    ret.push(dates.splice(0, 7));
                }

                return ret;//一个三维数组
            }
            vm.weeks = getWeeks(now)
            vm.$watch("toggle", function(bool) {
                if (bool && datepickerEl) {
                    avalon(datepickerEl).position({
                        of: element,
                        at: "left bottom",
                        my: "left top"
                    })
                } else {
                    element.value = avalon.filters.date(vm.selectedTime, vm.dateFormat)
                }
            })
        })

        avalon.ready(function() {
            $element.bind("focus", function() {
                model.toggle = true
            })

            //element.stopScan = false
            datepickerEl = avalon.parseHTML(tmpl).firstChild
            document.body.appendChild(datepickerEl)
            avalon.scan(datepickerEl, [model].concat(vmodels))
        })
        return model

    }
    widget.defaults = {
        dayNamesMin: "日一二三四五六".split(""),
        monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        changeMonth: true,
        changeYear: true,
        toggle: false,
        yearRange: "y-10:y+10", //你只能改动这里面的数字
        showOtherMonths: true,
        showButtonPanel: false,
        closeText: "Done", // Display text for close link
        prevText: "Prev", // Display text for previous month link
        nextText: "Next", // Display text for next month link
        currentText: "Today", // Display text for current month link
        showWeek: false,
        firstDay: 1,
        weekHeader: "周",
        minDate: null,
        maxDate: null,
        numberOfMonths: 1,
        dateFormat: "MM/dd/yyyy"
    }
    return avalon
})