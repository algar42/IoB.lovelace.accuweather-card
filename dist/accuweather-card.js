const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;


const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

function hasConfigOrEntityChanged(element, changedProps) {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldHass = changedProps.get("hass");
  if (oldHass) {
    return (
      oldHass.states[element._config.entity] !==
      element.hass.states[element._config.entity] ||
      oldHass.states["sun.sun"] !== element.hass.states["sun.sun"]
    );
  }

  return true;
}

class WeatherCard extends LitElement {
  get properties() {
    return {
      _config: {},
      hass: {}
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a weather entity");
    }
    this._config = config;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  getTemperature(value) {
    const stateObj = this.hass.states[this._config.entity];  
    if (this._config.convertemptof == true) {
      return Math.round((value * (9/5)) + 32);
    } else {
      return Math.round(value*10)/10;
    }
  }

  getWindspeed() {
    const stateObj = this.hass.states[this._config.entity];  
    if (this._config.convertspeedtoms == true) {
      return Math.round(stateObj.attributes.wind_speed/3.6);
    } else {
      return stateObj.attributes.wind_speed;
    }
  }

  getPressure() {
    const stateObj = this.hass.states[this._config.entity];  
    if (this._config.convertpressuretomm == true) {
      return Math.round(stateObj.attributes.pressure * 0.75006);
    } else {
      return stateObj.attributes.pressure;
    }
  }

  render() {
    if (!this._config || !this.hass) {
      return html`<div> Weather not defined </div>`;
    }

    const stateObj = this.hass.states[this._config.entity];
    const lang = this.hass.config.language || this.hass.selectedLanguage || this.hass.language;
    console.log(stateObj.state);

    const next_rising = new Date(stateObj.attributes.sunrise);
    const next_setting = new Date(stateObj.attributes.sunset);
    /*
    options:
     windunit
     pressureunit
     tempunit
     waterunit
     convertspeedtoms
     convertpressuretomm
     convertemptof
    */

       return html`
      ${this.renderStyle()}
      <ha-card @click="${this._handleClick}">
        ${this._config.name ? html`<span class="title"> ${this._config.name} </span>`: ""}
        <div  class="bigicon"  style="background: none, url(${stateObj.attributes.icon_url}) no-repeat center center; background-size: contain;"> </div>
        ${stateObj.state  ? html`<div class="condition">${stateObj.state}</div>`  : ""  }
        <span class="temp">${this.getTemperature(stateObj.attributes.temperature)}</span>
        <span class="tempc"> ${this.getUnit("temperature")}</span>
        <span>
          <ul class="variations">
            <li>
              <span class="ha-icon"><ha-icon style="visibility: hidden;" icon="mdi:weather-windy"></span>
              <br /><span class="ha-icon"><ha-icon icon="mdi:weather-windy"></ha-icon></span> ${stateObj.attributes.wind_bearing}
              ${this.getWindspeed()}<span class="unit"> ${this.getUnit("speed")}</span>
              <br /> <span class="ha-icon"><ha-icon icon="mdi:weather-sunset-up"></ha-icon></span>${next_rising.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
            </li>
            <li>
              <span class="ha-icon"><ha-icon icon="mdi:water-percent"></ha-icon></span> ${stateObj.attributes.humidity}<span class="unit"> %</span>
              <br /><span class="ha-icon"><ha-icon icon="mdi:gauge"></ha-icon></span>${this.getPressure()}<span class="unit"> ${this.getUnit("air_pressure")}</span>
              <br /><span class="ha-icon"><ha-icon icon="mdi:weather-sunset-down"></ha-icon></span>${next_setting.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
            </li>
          </ul>
        </span>
        <div class="bydaytable clear">
          ${
      stateObj.attributes.forecast.slice(0, 5).map(
        daily => html`
              <div class="column">
                <div class="bydaytable-inner">
                  <div class="row dayname"> ${new Date(daily.datetime).toLocaleDateString(lang, { weekday: "short" })} </div>
                  <div class="row"> <i class="icon" style="background: none, url(${daily.icon_url}) no-repeat; background-size: contain;"></i> </div> 
                  <div class="row highTemp"> ${this.getTemperature(daily.temperature)}${this.getUnit("temperature")} </div>
                  ${ daily.templow ?  html`<div class="lowTemp">${this.getTemperature(daily.templow)}${this.getUnit("temperature")}</div>` : html`<div class="lowTemp">&nbsp;</div>` }
                  ${ daily.precipitation ?  html`<div class="row"><ha-icon class="ha-icon-small" icon="mdi:water"></ha-icon><span class="precip">${daily.precipitation} ${this.getUnit("precip")}</span></div>` : html`<div class="row precip">&nbsp;</div>` } 

                </div>
              </div>
              `
      )
      }
        </div>
      </ha-card>
    `;
  }



  getUnit(measure) {
    const lengthUnit = this.hass.config.unit_system.length;
    switch (measure) {
      case "temperature":
        return this._config.tempunit ? this._config.tempunit : "°C";
      case "speed":
        return this._config.windunit ? this._config.windunit : "km/h";
      case "air_pressure":
        return this._config.pressureunit ? this._config.pressureunit : "hPa";
        case "precip":
          return this._config.waterunit ? this._config.waterunit : "mm";  
      default:
        return this.hass.config.unit_system[measure] || "";
    }
  }

  _handleClick() {
    fireEvent(this, "hass-more-info", { entityId: this._config.entity });
  }

  getCardSize() {
    return 3;
  }

  renderStyle() {
    return html`
      <style>

      .bydaytable {
        width: 100%;
        height: 45%;
        display: flex;
        flex-wrap: nowrap;
        position: absolute;
        bottom: 0px;
      }

       .column {
        width: 20%;
        text-align: center;
        border-right: 0.1em solid #d9d9d9;
        box-sizing: border-box;
        }
        
        .bydaytable .column:first-child {
                  margin-left: 0;
                }
        
        .bydaytable .column:nth-last-child(1) {
                  border-right: none;
                  margin-right: 0;
                }

        .bydaytable-inner {
                  display: flex;
                  flex-wrap: nowrap;
                  flex-direction: column;
                }
                
                
                
        .bydaytable-inner .row {
                  width: 100%;
                  margin-bottom: 0.3em;
                  text-align: center;        
        }

        ha-card {
          cursor: pointer;
          margin: auto;
          width: 100%;
          height: 300px;
          min-width: 390px;
          padding-top: 1.5em;
          padding-bottom: 0em;
          padding-left: 0em;
          padding-right: 0em;
          position: relative;
        }

        .clear {
          clear: both;
        }

        .ha-icon {
          height: 18px;
          margin-right: 5px;
          color: var(--paper-item-icon-color);
        }

        .ha-icon-small {
          height: 12px;
          margin-right: -0.3em;
          color: var(--paper-item-icon-color);
        }

        .title {
          position: absolute;
          left: 0.5em;
          top: 0.6em;
          font-weight: 300;
          font-size: 1.5em;
          color: var(--primary-text-color);
        }

        .condition {
          position: absolute;
          left: 1em;
          top: 10.5em;
          width:95%;
          font-weight: 300;
          font-size: 1em;
          color: var(--secondary-text-color);
          text-align: center;
        }

        .temp {
          font-weight: 300;
          font-size: 4em;
          color: var(--primary-text-color);
          position: absolute;
          right: 0.6em;
          margin-top: -0.2em;
        }

        .tempc {
          font-weight: 300;
          font-size: 1.5em;
          vertical-align: super;
          color: var(--primary-text-color);
          position: absolute;
          right: 0.7em;
          margin-top: -5px;
        }

        .variations {
          display: flex;
          flex-flow: row wrap;
          justify-content: space-between;
          font-weight: 300;
          color: var(--primary-text-color);
          list-style: none;
          margin-top: 4.2em;
          padding: 0;
        }

        .variations li {
          flex-basis: auto;
        }

        .variations li:first-child {
          padding-left: 1em;
        }

        .variations li:last-child {
          padding-right: 1em;
        }

        .unit {
          font-size: 0.8em;
        }

        .forecast {
          width: 100%;
          margin: 0 auto;
          height: 9em;
        }

        .day {
          display: block;
          width: 20%;
          float: left;
          text-align: center;
          color: var(--primary-text-color);
          border-right: 0.1em solid #d9d9d9;
          line-height: 2;
          box-sizing: border-box;
        }

        .dayname {
          text-transform: uppercase;
        }

        .forecast .day:first-child {
          margin-left: 0;
        }

        .forecast .day:nth-last-child(1) {
          border-right: none;
          margin-right: 0;
        }

        .highTemp {
          font-weight: bold;
        }

        .lowTemp {
          color: var(--secondary-text-color);
        }

        .precip {
          color: var(--secondary-text-color);
          font-size: 0.9em;
        }

        .bigicon {
          position: absolute;
          top: 1.5em;
          left: 33%;
          width: 38%;
          height: 38%;
          vertical-align: center;
          align-content: center;
          text-align: center;
          background-size: contain;
          background-position: center center;
          background-repeat: no-repeat;
 
        }

        .icon {
          width: 50px;
          height: 50px;
          margin-right: 5px;
          display: inline-block;
          vertical-align: middle;
          background-size: contain;
          background-position: center center;
          background-repeat: no-repeat;
          text-indent: -9999px;
        }

        .weather {
          font-weight: 300;
          font-size: 1.5em;
          color: var(--primary-text-color);
          text-align: left;
          position: absolute;
          top: -0.5em;
          left: 6em;
          word-wrap: break-word;
          width: 30%;
        }
      </style>
    `;
  }
}
customElements.define("weather-card", WeatherCard);