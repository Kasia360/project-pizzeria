import {classNames,templates, select, settings} from './settings.js';
import AmountWidget from './components/AmountWidget.js';
import DatePicker from './components/DatePicker.js';
import HourPicker from './components/HourPicker.js';
import {utils} from './utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }
  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url       + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event   + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url  + '/' + settings.db.event   + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};
    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const maxDate = thisBooking.datePicker.maxDate;
    const minDate = thisBooking.datePicker.minDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
    console.log('thisBooking.booked', thisBooking.booked);
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
     ||
     typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }

  render(element) {
    const thisBooking = this;
    const renderedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = renderedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

  /*  thisBooking.dom.wrapper.addEventListener('updated', function () {
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.updateDOM();
    }); */
  }
  initActions() {
    const thisBooking = this;

    //update tables when date or time is changed
    const elements = [thisBooking.dom.datePicker, thisBooking.dom.hourPicker];
    for (let element of elements) {
      element.addEventListener('updated', function () {
        for (let table of thisBooking.dom.tables) {
          table.classList.remove(classNames.booking.tableSelected);
        }
        thisBooking.updateDOM();
      });
    }

    // select table
    for (let table of thisBooking.dom.tables) {
      const tableBooked = table.classList.contains(classNames.booking.tableBooked);
      //const tableSelected = table.classList.contains(classNames.booking.tableSelected);
      if (!tableBooked) {
        table.addEventListener('click', function (event) {
          event.preventDefault();
          const clickedTable = this;
          clickedTable.classList.toggle(classNames.booking.tableSelected);
          thisBooking.tableSelected = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.tableSelected = parseInt(thisBooking.tableSelected);
        });
      }
    }

    //add starters
    thisBooking.starters = [];
    for (let starter of thisBooking.dom.starters) {
      starter.addEventListener('change', function (event) {
        event.preventDefault();
        const clickedStarter = this;
        if (thisBooking.starters.indexOf(clickedStarter.value) < 0) {
          thisBooking.starters.push(clickedStarter.value);
        } else {
          thisBooking.starters.splice(thisBooking.starters.indexOf(clickedStarter.value));
        }
      });
    }

    //submit
    thisBooking.dom.wrapper.addEventListener('submit', function (event) {
      event.preventDefault();
      const tableAvailable = thisBooking.ishoursAmoutCorrect(utils.hourToNumber(thisBooking.hourPicker.value));
      console.log('tableAvailable', tableAvailable);
      if (tableAvailable) {
        thisBooking.sendReservation();
        thisBooking.updateDOM();
      }
    });
  }
  ishoursAmoutCorrect(selectedHour) {
    const thisBooking = this;
    const timeToClosing = parseInt(settings.hours.close) - selectedHour;
    const duration = parseFloat(thisBooking.hoursAmount.value);
    console.log('timeToClosing', timeToClosing);
    let availableTime = 0.5;


    if (timeToClosing >= duration) {
      for (let checkedHour = selectedHour + 0.5; checkedHour < selectedHour + duration; checkedHour += 0.5) {
        if (typeof thisBooking.booked[thisBooking.datePicker.value][checkedHour] == 'undefined') {
          thisBooking.booked[thisBooking.datePicker.value][checkedHour] = [];
        }
        if (thisBooking.booked[thisBooking.datePicker.value][checkedHour].indexOf(thisBooking.tableSelected) < 0) {
          availableTime += 0.5;
          console.log('checkedHour', checkedHour);
          console.log('availableTime', availableTime);
        } else {
          break;
        }
      }
      if (availableTime >= duration) {
        return true;
      } else {
        window.alert('This table is available only for ' + availableTime + ' hours');
        return false;
      }
    } else {
      window.alert('Sorry, we are open only till 23 pm.');
      return false;
    }

  }
  sendReservation() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const date = thisBooking.datePicker.value;
    const hour = thisBooking.hourPicker.value;
    const payload = {
      date: date,
      hour: hour,
      table: thisBooking.tableSelected,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };
    console.log('url', url, 'payload', payload);
    for (let starter of thisBooking.starters) {
      payload.starters.push(starter);
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(response => response.json())
      .then(parsedResponse => {
        console.log('parsedResponse:', parsedResponse);
      });
  }
}

export default Booking;
