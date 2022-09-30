

var options = {
    afterMonth: 3,
    beforeMonth: 1,
    unavailableDate: [5, 6],
    min: '08:00',
    max: '19:00',
    duration: 30,
    buff: 15
}

const responseData = {
    unavailableDate: [
        '2022-10-17',
        '2022-10-25',
        '2022-10-01',
        '2022-11-03',
        '2022-11-06',
        '2022-12-09',
        '2022-12-15',
    ],
    unavailableTime: [{
        start: '2022-9-25 09:00:00',
        end: '2022-9-25 15:00:00'
    }, {
        start: '2022-10-12 09:00:00',
        end: '2022-10-12 10:00:00'
    }, {
        start: '2022-11-01 15:00:00',
        end: '2022-11-21 17:00:00'
    }],
    bookedDate: [
        '2022-09-27 15:15',
        '2022-09-19 12:30'
    ]
}

var picker = {
    day: moment().format('yyyy-MM-DD'),
    time: '',

    selectedMonth: moment()
}

function checkDisableDay(day) {
    const now = moment();
    const str = day.format('yyyy-MM-DD');
    if (day.month() !== picker.selectedMonth.month()) return true;
    if (str < now.format('yyyy-MM-DD')) return true;
    if (options.unavailableDate.includes(day.weekday())) return true;
    for (let i = 0; i < responseData.unavailableDate.length; i ++) {
        let itm = responseData.unavailableDate[i];
        if (itm.includes(str)) return true;
    }
    return false;
}

function checkIfBookedDate(day) {
    const str = day.format('yyyy-MM-DD');
    for (let i = 0; i < responseData.bookedDate.length; i ++) {
        let itm = responseData.bookedDate[i];
        if (itm.includes(str)) return true;
    }
    return false;
}

function checkDisableTime(time) {
    const tmpTime = moment(time); tmpTime.add({ minute: options.duration + options.buff });
    const st = time.format('yyyy-MM-DD HH:mm'), ed = tmpTime.format('yyyy-MM-DD HH:mm');
    for (let i = 0; i < responseData.unavailableTime.length; i ++) {
        let itm = responseData.unavailableTime[i];
        const ust = moment(itm.start).format('yyyy-MM-DD HH:mm'), ued = moment(itm.end).format('yyyy-MM-DD HH:mm');
        if (st <= ust && ust < ed) return true;
        if (st < ued && ued <= ed) return true;
        if (ust <= st && st < ued) return true;
        if (ust < ed && ed <= ued) return true;
    }

    return false;
}

function checkIfBookedTime(time) {
    const tmpTime = moment(time); tmpTime.add({ minute: options.duration + options.buff });
    const st = time.format('yyyy-MM-DD HH:mm'), ed = tmpTime.format('yyyy-MM-DD HH:mm');
    for (let i = 0; i < responseData.bookedDate.length; i ++) {
        let itm = moment(responseData.bookedDate[i]).format('yyyy-MM-DD HH:mm');
        if (st <= itm && itm <= ed) return true;
    }
    return false;
}

function setupDatePicker() {
    let timeHtml = '';
    const tmpHour = moment((picker.day + ' ' + options.min));
    while(tmpHour.format('HH:mm') <= options.max) {
        if (!checkDisableTime(tmpHour)) {
            let className = '';
            const tmpTime = moment(tmpHour); tmpTime.add({ minute: options.duration });
            const st = tmpHour.format('HH:mm'), ed = tmpTime.format('HH:mm');
            if (st <= picker.time && picker.time <= ed) className += 'active';
            if (checkIfBookedTime(tmpHour)) className += ' actived'
            timeHtml += `<div class="time-btn ${className}" to="${st}">${tmpHour.format('HH:mm')}</div>`
        }
        tmpHour.add({ minute: options.buff + options.duration });
    }
    $('#time-btns').html(timeHtml);
}

function setupCalendar() {
    const day = moment(picker.selectedMonth);

    $('#appoint-date-picker .month-label').html(day.format('MMMM yyyy'));
    $('#appoint-time-picker .selected-day').html(moment(picker.day).format('dddd, MMMM DD'));

    let dayHtml = '';

    const tmpDay = moment(day); tmpDay.date(1);
    const weekday = (tmpDay.weekday() || 7);
    tmpDay.subtract({ day: weekday });

    for(let i = 0; i < 42; i ++) {
        let content = tmpDay.date();
        let className = "";
        if (checkDisableDay(tmpDay)) className += ' disabled';
        else if (tmpDay.format('yyyy-MM-DD') === picker.day) className += ' active';
        if (checkIfBookedDate(tmpDay)) className += ' actived';
        dayHtml += `<div class="${className}"><div class="day-label" to="${tmpDay.format('yyyy-MM-DD')}">${content}</div></div>`;
        tmpDay.add({ day: 1 });
    }

    $('#days-container').html(dayHtml);

    setupDatePicker();
    setupMonthButtons();
}

function monthDiff(dat1, dat2) {
    const month1 = dat1.year() * 12 + dat1.month();
    const month2 = dat2.year() * 12 + dat2.month();
    return month1 - month2;
}

function setupMonthButtons () {
    const diff = monthDiff(moment(), picker.selectedMonth);
    if (diff >= options.beforeMonth) {
        $('.month-btn.prev').removeClass('active');
    } else {
        $('.month-btn.prev').addClass('active');
    }
    if (-diff >= options.afterMonth) {
        $('.month-btn.next').removeClass('active');
    } else {
        $('.month-btn.next').addClass('active');
    }
}

function prevMonth() {
    const diff = monthDiff(moment(), picker.selectedMonth);
    if (diff >= options.beforeMonth) return;
    picker.selectedMonth.subtract({ month: 1 });
    setupCalendar();
}

function nextMonth() {
    const diff = monthDiff(moment(), picker.selectedMonth);
    if (-diff >= options.afterMonth) return;
    picker.selectedMonth.add({ month: 1 });
    setupCalendar();
}

function dayClicked(e) {
    const dat = $(e.target).attr('to');
    const day = moment(dat);
    if (checkDisableDay(day)) return ;
    picker.day = day.format('yyyy-MM-DD');
    picker.time = '';
    setupCalendar();

    //Dispatch an event
    var evt = new CustomEvent("day-selected", {detail: picker.day});
    window.dispatchEvent(evt);
}

function timeClicked(e) {
    const time = $(e.target).attr('to');
    const day = moment(picker.day + ' ' + time);
    if (checkDisableTime(day)) return ;
    picker.time = day.format('HH:mm');
    setupDatePicker();

    //Dispatch an event
    var evt = new CustomEvent("time-selected", {detail: picker.time});
    window.dispatchEvent(evt);
}

function initCalendar () {
    $('.month-btn.prev').click(prevMonth);
    $('.month-btn.next').click(nextMonth);
    $('#appoint-date-picker').on('click', '.day-labels>div:not(.disabled) .day-label', dayClicked);
    $('#appoint-time-picker').on('click', '.time-btn', timeClicked);
    setupCalendar();

    //event example
    window.addEventListener("day-selected", function(evt) {
        console.log(evt.detail)
    }, false);
    window.addEventListener("time-selected", function(evt) {
        console.log(evt.detail)
    }, false);
}

function confirm() {
    if (!picker.time) return alert('time is not selected');
    alert(picker.day + ' ' + picker.time);
}

$(function() {
    initCalendar();
})