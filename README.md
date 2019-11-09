# IoB.lovelace.accuweather-card
Custom weather card for IoBroker Lovelace UI. (not for hass)
This custom card created to show weather from iobroker.accuweather driver (but probably can be used with other weather drivers as well).

## Usage 
Follows instructions of custom cards installation from https://github.com/ioBroker/ioBroker.lovelace#custom-cards

## Entity settings

following settings of entity are supported:
`
type: 'custom:weather-card'
entity: weather.Weather_Summary - your weather entity
name:  - card name, e.g. your location
windunit: - unit of wind speed to be displayed, e.g. km/h
pressureunit:  - unit of pressure to be displayed, e.g. mmHg
tempunit:  - unit of temperature to be displayed, e.g. C
waterunit:  - unit of precipitation amount to be displayed, e.g. mm
convertspeedtoms: - true to convert wind speed from km/h to m/s
convertpressuretomm: - true to convert pressure from hPa to mmHg
convertemptof: true to convert degrees C to F
`
### Example

Card loks like:
