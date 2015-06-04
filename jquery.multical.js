var MultiCal = function (userSettings) { 
    var defaults = {
        /*
        * The element the calendar is tied to. The calendar will appear when the element has focus, and the value will be set to the dates selected
        *
        * - If this isn't included, calendar must be manually opened with .show() and you must include an onSet function (see below)
        */
        element: null,
        /*
        * A string or date object representing the start date (if you want to preinitialize it with a selection)
        *
        * - Only set this if you want dates to be selected on initialization. Set displayMonth if you want a starting month/year
        * -- If a string, should be form MM-DD-YYYY or MM/DD/YYYY
        */
        startDate: null,
        /*
        * A string or date object representing the end date (if you want to preinitialize it with a selection)
        *
        * - Only set this if you want dates to be selected on initialization. Set displayMonth if you want a starting month/year
        * -- If a string, should be form MM-DD-YYYY or MM/DD/YYYY
        */
        endDate: null,
        /*
        * A string or date object representing a date to display as the first month when the calendar is opened for the first time.
        */
        displayMonth: null,
        /*
        * The text that is displayed on the bottom of the calendar (optional)
        */
        helpText: '',
        /*
        * A function that will be fired with the results when a valid date range is selected
        */
        onSet: null
    };

    var settings = $.extend({}, defaults, userSettings);

    var wrap, label, isShowing,
        __cache = {},
        currentMonth, 
        selectedDates = [],
        months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        showCss = {
            position: 'absolute',
            top: settings.element ? settings.element.offset().top - 22 : '',
            left: settings.element ? ( settings.element.offset().left + settings.element.width() + 22 ) : '',
            zIndex: 1001,
            display: 'block'
        }; 
 
    init();

    function init() { 
        var key, startAndEnd, initialMonth, split, gmy;

        wrap = createWrap(); 

        wrap.find(".m-prev").bind("click.calendar", function () { switchMonth(false); }); 
        wrap.find(".m-next").bind("click.calendar", function () { switchMonth(true);  });
        wrap.on('click', '[data-date]', handleClick);

        wrap.on('click', function (e) { 
            if (isShowing) {
                e.stopPropagation();
            }
        });

        $(document).on('click', function () {
            if (isShowing) {
                hide();
            }
        });

        $(document).on('keypress', function (e) {
            if (e.keyCode === 27 && isShowing) {
                hide();
            }
        });

        if (settings.element) {
            settings.element.on('focus', function () {
                show();
            });

            settings.element.on('click', function (e) {
                if (isShowing) {
                    e.stopPropagation();
                }
            });
        }

        startAndEnd = {
            startDate: null,
            endDate: null
        };

        for (key in startAndEnd) {
            if (startAndEnd.hasOwnProperty(key) && settings[key]) {
                if (settings[key] instanceof Date) {
                    startAndEnd[key] = (parseInt(settings[key].getMonth(), 10) + 1) + '-' + settings[key].getDate() + '-' + settings[key].getFullYear();
                } else {
                    split = settings[key].split('-');

                    if (split.length === 1) {
                        split = settings[key].split('/');
                    }

                    if (split.length === 3) {
                        startAndEnd[key] = split.join('-');
                    }
                }
            }
        }

        gmy = [ ];

        if (startAndEnd.startDate) {
            selectedDates.push(startAndEnd.startDate);

            split = startAndEnd.startDate.split('-');
            gmy[0] = split[0];
            gmy[1] = split[2];
        }

        if (startAndEnd.endDate) {
            selectedDates.push(startAndEnd.endDate);
        }

        if (settings.displayMonth) {
            if (settings.displayMonth instanceof Date) {
                gmy[0] = settings.displayMonth.getMonth();
                gmy[1] = settings.displayMonth.getFullYear();
            } else {
                split = settings.displayMonth.split('-');

                if (split.length === 1) {
                    split = settings.displayMonth.split('/');
                }

                if (split.length === 3) {
                    gmy[0] = split[0] - 1;
                    gmy[1] = split[2];
                }
            }
        }

        if (gmy.length !== 2) {
            gmy[0] = new Date().getMonth();
            gmy[1] = new Date().getFullYear();
        }

        currentMonth = getMonthYear(gmy[0], gmy[1]);
        switchMonth(true);
    } 
 
    function handleClick(e) {
        var el = e.target;
        var date = $(el).attr('data-date');

        if (date) {
            if (selectedDates.length === 2) {
                selectedDates = [];
            }

            selectedDates.push(date);

            handleDateColoring();

            if (selectedDates.length === 2) {
                returnDates();
                setTimeout(function () {
                    hide();
                }, 1000);
            }
        }
    }

    function show() {
        wrap.css(showCss);
        isShowing = true;
    }

    function hide() {
        wrap.removeAttr('style');
        isShowing = false;
    }

    function getMonthYear(month, year, next) {
        month = parseInt(month, 10);
        year = parseInt(year, 10);
        
        return {
            month: ((next) ? ( (month === 11) ? 0 : month + 1 ) : ( (month === 0) ? 11 : month - 1 )),
            year: ((next && month === 11) ? year + 1 : (!next && month === 0) ? year - 1 : year)
        };
    }

    function getDateString(year, month, day) {
        if (day) {
            return month + '-' + day + '-' + year;
        }

        return '';
    }

    function switchMonth(next) { 
        var calendar, 
            month = currentMonth.month,
            year = currentMonth.year,
            newLeft = getMonthYear(month, year, next),
            newRight = getMonthYear(newLeft.month, newLeft.year, true);

        leftCal =  createCal(newLeft.year, newLeft.month); 
        rightCal = createCal(newRight.year, newRight.month);

        wrap.data('slider').empty().append(leftCal.calendar()).append(rightCal.calendar());
        
        currentMonth = newLeft;
        handleDateColoring();
    } 
 
    function createCal(year, month) { 
        var j, 
            day = 1, 
            i = 0, 
            daytoprint = "", 
            haveDays = true,  
            startDay = new Date(year, month, day).getDay(), 
            daysInMonths = [31, (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
            caltext = [],
            classes,
            classesInside,
            calendar = [];

        if (__cache[year]) { 
            if (__cache[year][month]) { 
                return __cache[year][month]; 
            } 
        } else { 
            __cache[year] = {}; 
        }

        while (haveDays) {
            caltext[i] = '<div class="_multical-view__week">';

            for (j = 0; j < 7; j++) {
                classes = ['_multical-view__cell', 'm-day'];
                classesInside = ['_multical-view__day-number'];

                if (j === 0) {
                    classes.push('m-first');
                } else if (j === 6) {
                    classes.push('m-last');
                }

                if (i === 0) { 
                    if (j === startDay) { 
                        daytoprint = day++; 
                        startDay++; 
                    } 
                } else if (day <= daysInMonths[month]) { 
                    daytoprint = day++; 
                } else { 
                    daytoprint = "";
                    classes.push('m-empty');
                    haveDays = false; 
                } 

                if (day > daysInMonths[month]) { 
                    haveDays = false; 
                } 

                caltext[i] += '<div class="' + classes.join(' ') + '">';
                caltext[i] += '<div data-date="' + getDateString(year, month, daytoprint) + '" class="' + classesInside.join(' ') + '">' + daytoprint + '</div>';
                caltext[i] += '</div>';
            }
            caltext[i] += '</div>';

            i++; 

        } 

        calendar = createMonthWrapped(caltext, months[month] + " " + year);

        __cache[year][month] = { calendar : function () { return calendar.clone(); }, label : months[month] + " " + year }; 
         
        return __cache[year][month];
    } 

    function createMonthWrapped(weeks, name) {
        var wrap = $('<div class="_multical-view__month"></div>');
        var titl = $('<div class="_multical-view__month-name">' + name + '</div>');
        var grid = $('<div class="_multical-view__month-grid"></div>');
        var head = $('<div class="_multical-view__week m-dow-row"><div class="_multical-view__cell m-dow m-first">Su</div><div class="_multical-view__cell m-dow">M</div><div class="_multical-view__cell m-dow">Tu</div><div class="_multical-view__cell m-dow">W</div><div class="_multical-view__cell m-dow">Th</div><div class="_multical-view__cell m-dow">F</div><div class="_multical-view__cell m-dow m-last">Sa</div><div class="clear"></div></div>');

        grid.append(head).append($(weeks.join('')));
        wrap.append(titl).append(grid);
            
        return wrap;
    }

    function createWrap() {
        var full = '<div class="_multical-popper">';

            full += '<div class="_multical-view m-flex m-show-range-boxes">';
                full += '<div class="_multical_view__month-wrapper" style="width:600px">';
                    full += '<div class="_multical-view__month-slider"></div>';
                full += '</div>';
                full += '<div class="_multical-view__nav-button js-date-picker-nav m-prev m-enabled">';
                    full += '<div class="_multical-view__nav-button-left-arrow"></div>';
                full += '</div>';
                full += '<div class="_multical-view__nav-button js-date-picker-nav m-next m-enabled">';
                    full += '<div class="_multical-view__nav-button-right-arrow"></div>';
                full += '</div>';
                if ($.trim(settings.helpText).length) {
                    full += '<div class="_multical-view__education-container">';
                        full += '<div class="_multical-view__education">' + settings.helpText + '</div>';
                    full += '</div>';
                }
            full += '</div>';
        full += '</div>';

        full = $(full);
        full.appendTo($('body'));

        full.data('slider', full.find('._multical-view__month-slider'));

        return full;
    }

    function handleDateColoring() {
        $('[data-date].m-between').removeClass('m-between');
        $('[data-date].m-cap-left').removeClass('m-cap-left');
        $('[data-date].m-cap-right').removeClass('m-cap-right');

        switch (selectedDates.length) {
        case 1:
            $('[data-date="' + selectedDates[0] + '"]').addClass('m-cap-left');
        break;
        case 2:
            var start = selectedDates[0].split('-');
            var end = selectedDates[1].split('-');

            startsum = "" + start[2] + (parseInt(start[0], 10) + 10) + (parseInt(start[1], 10) + 10);
            endsum = "" + end[2] + (parseInt(end[0], 10) + 10) + (parseInt(end[1], 10) + 10);

            if (startsum > endsum) {
                var hold = start;
                start = end;
                end = hold;

                hold = startsum;
                startsum = endsum;
                endsum = hold;

                hold = selectedDates[0];
                selectedDates[0] = selectedDates[1];
                selectedDates[1] = hold;
            }

            $('[data-date="' + selectedDates[0] + '"]').addClass('m-cap-left');
            $('[data-date="' + selectedDates[1] + '"]').addClass('m-cap-right');

            if (start !== end) {
                var dates = $('[data-date]');

                dates.each(function (i, el, arr) {
                    var date = $(el).attr('data-date');

                    if (date) {
                        date = date.split('-');
                        var sum = "" + date[2] + (parseInt(date[0], 10) + 10) + (parseInt(date[1], 10) + 10);

                        if (sum >= startsum && sum <= endsum) {
                            $(el).addClass('m-between');
                        }
                    }
                });
            } else {
                $('[data-date="' + selectedDates[0] + '"]').addClass('m-between');
            }
        break;
        }
    }

    function returnDates() {
        if (settings.element) {
            var string;
            var datesplits = [ selectedDates[0].split('-'), selectedDates[1].split('-') ];
            var dates = [ new Date(datesplits[0][2], datesplits[0][0], datesplits[0][1]), new Date(datesplits[1][2], datesplits[1][0], datesplits[1][1]) ];
            var dateStrings = [
                {
                    month: months[dates[0].getMonth()],
                    day: dates[0].getDate(),
                    year: dates[0].getFullYear()
                },{
                    month: months[dates[1].getMonth()],
                    day: dates[1].getDate(),
                    year: dates[1].getFullYear()
                }
            ];

            if (dates[0].getTime() === dates[1].getTime()) {
                string = dateStrings[0].month + ' ' + dateStrings[0].day + ', ' + dateStrings[0].year;
            } else {
                var bothYears = true,
                    bothMonths = true;

                if (dateStrings[0].year === dateStrings[1].year) {
                    bothYears = false;
                }

                if (dateStrings[0].month === dateStrings[1].month) {
                    bothMonths = false;
                }

                string = dateStrings[0].month;

                if (bothYears) {
                    string += ' ' + dateStrings[0].day + ', ' + dateStrings[0].year + ' - ' + dateStrings[1].month + ' ' + dateStrings[1].day + ', ' + dateStrings[1].year;
                } else if (bothMonths) {
                    string += ' ' + dateStrings[0].day + ' - ' + dateStrings[1].month + ' ' + dateStrings[1].day + ', ' + dateStrings[0].year;
                } else {
                    string += ' ' + dateStrings[0].day + ' - ' + dateStrings[1].day + ', ' + dateStrings[0].year;
                }

            }

            settings.element.val(string);
            if (typeof settings.onSet === 'function') {
                var start = selectedDates[0].split('-');
                var end = selectedDates[1].split('-');

                start[0] = parseInt(start[0], 10) + 1;
                end[0] = parseInt(end[0], 10) + 1;

                settings.onSet(string, start.join('-'), end.join('-'));
            }
        }
    }
    
    return { 
        switchMonth: switchMonth,
        show: show,
        hide: hide
    }; 
};
