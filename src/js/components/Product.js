class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    //console.log('new Product:', thisProduct);
  }
  renderInMenu(){
    const thisProduct = this;
    /*generate HTML based on template*/
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /*create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* find menu container*/
    const menuContainer = document.querySelector(select.containerOf.menu);
    //console.log('menuContainer:', menuContainer);
    /*add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;
    //console.log('thisinitAccordion:', thisProduct);
    /* find the clickable trigger (the element that should react to clicking) */
    //const trigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    //console.log('clickableTrigger:', clickableTrigger);
    /* START: click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function () {
      //console.log('clicked', event);
      /* prevent default action for event */
      event.preventDefault();
      //console.log(event);
      /* toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle('active');
      /* find all active products */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
      //console.log('activeProducts:', activeProducts);
      /* START LOOP: for each active product */
      for (let activeProduct of activeProducts) {
        //console.log('activeProduct:', activeProduct);
        /* START: if the active product isn't the element of thisProduct */
        if (activeProduct !== thisProduct.element) {
          //console.log('!=activeProduct', activeProduct);
          /* remove class active for the active product */
          activeProduct.classList.remove('active');
          //console.log('thisProductInactive', activeProduct);
          /* END: if the active product isn't the element of thisProduct */
        }
        /* END LOOP: for each active product */
      }
    /* END: click event listener to trigger */
    });
  }


  initOrderForm(){
    const thisProduct = this;
    //console.log('thisProduct of initOrderFrom():', thisProduct);
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    //console.log('thisProduct of processOrder():', thisProduct);
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData:', formData);
    thisProduct.params = {};
    /* set variable price to equal thisProduct.data.price */
    let totalPrice = thisProduct.data.price;
    /* START LOOP: for each paramId in thisProduct.data.params */
    for (let paramId in thisProduct.data.params) {
      /* save the element in thisProduct.data.params with key paramId as const param */
      const param = thisProduct.data.params[paramId];
      /* START LOOP: for each optionId in param.options */
      for (let optionId in param.options){
        /* save the element in param.options with key optionId as const option */
        const option = param.options[optionId];
        const imageSelectors = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        /* START IF: if option is selected and option is not default */
        if (optionSelected && !option.default){
          /* add price of option to variable price */
          totalPrice += option.price;
          /* END IF: if option is selected and option is not default */
        }
        /* START ELSE IF: if option is not selected and option is default */
        else if (!optionSelected && option.default){
          /* deduct price of option from price */
          totalPrice -= option.price;
          /* END ELSE IF: if option is not selected and option is default */
        }
        // START LOOP IF:
        if (optionSelected) {
          if (!thisProduct.params[paramId]){
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label;
          for (let imageSelector of imageSelectors){
            imageSelector.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          for (let imageSelector of imageSelectors){
            imageSelector.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
        /* END LOOP: for each optionId in param.options */
      }
      /* END LOOP: for each paramId in thisProduct.data.params */
    }
    // multiply totalPrice by amount
    thisProduct.priceSingle = totalPrice;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;
    //console.log('thisProduct.params:', thisProduct.params);
  }
  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }
  addToCart(){
    const thisProduct = this;
    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;
    app.cart.add(thisProduct);
  }
}
