import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget{
  constructor(element) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.initActions();
    //console.log('AmountWidget:', thisWidget);
    //console.log('contstructor arguments:', element);
  }
  getElements(){
    const thisWidget = this;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }
  setValue(value){
    const thisWidget = this;
    const newValue = thisWidget.parseInt(value);
    // TODO: Add validation
    if (value != thisWidget.value && thisWidget.isValid(newValue)){
      thisWidget.value = newValue;
      thisWidget.announce();
    }
    thisWidget.renderValue();
  }

  parseValue(value){
      return parseInt(value);
    }

    isValid(value){
      return !isNaN(value)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax;
    }
    renderValue(){
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.value;
  }

  initActions(){
    const thisWidget = this;
    thisWidget.dom.element.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.dom.element.value);
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function(){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });
    thisWidget.dom.linkIncrease.addEventListener('click', function(){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }
  announce(){
    const thisWidget = this;
    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default AmountWidget;
