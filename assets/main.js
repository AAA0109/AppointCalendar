

var options = {
    // afterMonth: 3,
    // beforeMonth: 1,
    startDate: '2022-09-15',
    endDate: '2022-11-08',
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
        start: '2022-10-26 09:00:00',
        end: '2022-10-26 15:00:00'
    }, {
        start: '2022-10-12 09:00:00',
        end: '2022-10-12 15:00:00'
    }, {
        start: '2022-11-01 15:00:00',
        end: '2022-11-01 17:00:00'
    }],
    bookedDate: [
        '2022-09-27 15:15',
        '2022-09-19 12:30'
    ]
}

var picker = {
    day: moment().format('yyyy-MM-DD'),
    time: '',
    timezone: 0,

    selectedMonth: moment()
}

function getTimezoneOffset(date, loc) {
    // Try English to get offset. If get abbreviation, use French
    let offset;
    ['en','fr'].some(lang => {
      // Get parts - can't get just timeZoneName, must get one other part at least
      let parts = new Intl.DateTimeFormat(lang, {
        minute: 'numeric',
        timeZone: loc,
        timeZoneName:'short'
      }).formatToParts(date);
      // Get offset from parts
      let tzName = parts.filter(part => part.type == 'timeZoneName' && part.value);
      // timeZoneName starting with GMT or UTC is offset - keep and stop looping
      // Otherwise it's an abbreviation, keep looping
      if (/^(GMT|UTC)/.test(tzName[0].value)) {
        offset = tzName[0].value.replace(/GMT|UTC/,'') || '+0';
        return true;
      }
    });
    // Format offset as ±HH:mm
    // Normalise minus sign as ASCII minus (charCode 45)
    let sign = offset[0] == '\x2b'? '\x2b' : '\x2d';
    let [h, m] = offset.substring(1).split(':');
    let label = sign + h.padStart(2, '0') + ':' + (m || '00');
    return { label, minutes: (parseInt(h) * 60 + parseInt(m || 0)) * ((sign) == '\x2b' ? 1 : -1) }
}

function initTimezone() {
    var aryIannaTimeZones = Intl.supportedValuesOf('timeZone');
    let htmlStr = `<optgroup label="UTC">
                    <option value="UTC">UTC</option>`;
    let lastRegion = 'UTC';

    let date = new Date;
    aryIannaTimeZones.forEach((timeZone) =>
    {
        const region = timeZone.split('/')[0], country = timeZone.split('/')[1];
        if (!country) country = region;
        let strTime = getTimezoneOffset(new Date(), timeZone).label;
        if (lastRegion !== region) {
            htmlStr += `</optgroup><optgroup label="${region}">`
        } else {
            htmlStr += `<option value="${timeZone}">${country}  (${strTime})</option>`
        }
        lastRegion = region;
    });

    htmlStr += `</optgroup>`;
    document.getElementById('select-timezone').innerHTML = htmlStr;

    $('#select-timezone').val(Intl.DateTimeFormat().resolvedOptions().timeZone);
    changedTimezone(false);
}

function changedTimezone(refresh = true) {
    const val = $('#select-timezone').val();
    picker.timezone = getTimezoneOffset(new Date(), val).minutes
    if (refresh) setupCalendar();
}

function subTimeOffset(day) {
    day.subtract({ minute: picker.timezone });
}

function restoreTimeOffset(day) {
    day.add({ minute: picker.timezone });
}

function getDuration() {
    return options.duration;
}

function getBuff() {
    return options.buff;
}

function checkDisableDay(_day) {
    if (_day.month() !== picker.selectedMonth.month()) return true;
    
    const day = moment(_day.format('yyyy-MM-DD') + ' 00:00:00');    
    const ed_day = moment(day); ed_day.add({ day: 1 });

    const tmpHour = moment(day);
    while(tmpHour < ed_day) {
        if (!checkDisableTime(tmpHour)) {
            console.log(tmpHour.format('yyyy-MM-DD HH:mm'), ed_day.format('yyyy-MM-DD HH:mm'))
            return false;
        }
        tmpHour.add({ minute: getBuff() + getDuration() });
    }
    return true;
}

function isInDisabledDays(_day) {
    const st_day = moment(_day.format('yyyy-MM-DD') + ' 00:00:00'), ed_day = moment(_day.format('yyyy-MM-DD') + ' 23:59:59');
    subTimeOffset(st_day); subTimeOffset(ed_day);
    const st = st_day.format('yyyy-MM-DD HH:mm');
    const ed = ed_day.format('yyyy-MM-DD HH:mm');

    if (st < options.startDate || ed > options.endDate || st < moment().format('yyyy-MM-DD HH:mm')) return true;

    for (let i = 0; i < responseData.unavailableDate.length; i ++) {
        let itm = responseData.unavailableDate[i];
        if (itm >= st && itm < ed) return true;
    }

    return false;
}

function isInDisabledWeekDays(_day) {
    const day = moment(_day);
    subTimeOffset(day);
    if (options.unavailableDate.includes(day.weekday())) return true;
    return false;
}

function checkIfBookedDate(_day) {
    const st_day = moment(_day.format('yyyy-MM-DD') + ' 00:00:00'), ed_day = moment(_day.format('yyyy-MM-DD') + ' 23:59:59');
    subTimeOffset(st_day); subTimeOffset(ed_day);
    const st = st_day.format('yyyy-MM-DD HH:mm');
    const ed = ed_day.format('yyyy-MM-DD HH:mm');
    for (let i = 0; i < responseData.bookedDate.length; i ++) {
        let itm = responseData.bookedDate[i];
        if (itm >= st && itm < ed) return true;
    }
    return false;
}

function checkDisableTime(_time) {
    const time = moment(_time); subTimeOffset(time);
    const tmpTime = moment(time); 
    tmpTime.add({ minute: getDuration() - 1 + getBuff() });
    if (time.format('HH:mm') < options.min || time.format('HH:mm') > options.max) return true;
    const st = time.format('yyyy-MM-DD HH:mm'), ed = tmpTime.format('yyyy-MM-DD HH:mm');

    if (isInDisabledDays(_time)) return true;
    if (isInDisabledWeekDays(_time)) return true;
    
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

function checkIfBookedTime(_time) {
    const time = moment(_time); subTimeOffset(time);
    const tmpTime = moment(time);
    tmpTime.add({ minute: getDuration() - 1 + getBuff() });
    const st = time.format('yyyy-MM-DD HH:mm'), ed = tmpTime.format('yyyy-MM-DD HH:mm');
    for (let i = 0; i < responseData.bookedDate.length; i ++) {
        let itm = moment(responseData.bookedDate[i]).format('yyyy-MM-DD HH:mm');
        if (st <= itm && itm <= ed) return true;
    }
    return false;
}

function setupDatePicker() {
    let timeHtml = '';
    const tmpHour = moment((picker.day + ' 00:00'));
    while(tmpHour.date() == moment(picker.day).date()) {
        if (!checkDisableTime(tmpHour)) {
            let className = '';
            const tmpTime = moment(tmpHour); tmpTime.add({ minute: getDuration() - 1 });
            const st = tmpHour.format('HH:mm'), ed = tmpTime.format('HH:mm');
            if (st <= picker.time && picker.time <= ed) className += 'active';
            if (checkIfBookedTime(tmpHour)) className += ' actived'
            timeHtml += `<div class="time-btn ${className}" to="${st}">${tmpHour.format('HH:mm')}</div>`
        }
        tmpHour.add({ minute: getBuff() + getDuration() });
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

function checkIfEnableBeforeMonth(month) {
    const prevMonth = moment(month); subTimeOffset(prevMonth);
    prevMonth.date(1); prevMonth.subtract({ day: 1 });

    if (options.startDate <= prevMonth.format('yyyy-MM-DD')) return true;
    return false;
}

function checkIfEnableAfterMonth(month) {
    const nextMonth = moment(month.format('yyyy-MM-DD') + ' 23:59:59'); subTimeOffset(nextMonth);
    nextMonth.date(1); nextMonth.add({ month: 1 });

    if (options.endDate >= nextMonth.format('yyyy-MM-DD')) return true;
    return false;
}

function setupMonthButtons () {
    if (!checkIfEnableBeforeMonth(picker.selectedMonth)) {
        $('.month-btn.prev').removeClass('active');
    } else {
        $('.month-btn.prev').addClass('active');
    }
    if (!checkIfEnableAfterMonth(picker.selectedMonth)) {
        $('.month-btn.next').removeClass('active');
    } else {
        $('.month-btn.next').addClass('active');
    }
}

function prevMonth() {
    if (!checkIfEnableBeforeMonth(picker.selectedMonth)) return;
    picker.selectedMonth.subtract({ month: 1 });
    setupCalendar();
}

function nextMonth() {
    if (!checkIfEnableAfterMonth(picker.selectedMonth)) return;
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
    const selected = moment(picker.day + ' ' + picker.time);
    restoreTimeOffset( selected );
    console.log(selected);
}

$(function() {
    initTimezone();
    initCalendar();
})