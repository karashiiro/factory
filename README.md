[![powered-by-drash](https://img.shields.io/badge/powered%20by-drash-brightgreen.svg?logo=image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAqFBMVEUAAAAcjjk5qjn/AAAzmWb/AADbtgelCgrhBQoPndK7VwqZBgkrhjVtrnzgnQcQsO0XibMokTXxAwXxAwUWjLcWjLmGBATLBwb/AACKBAQQruj00QHSBweLwm6Mwm4ln3gspzpSUR//AAC6KAgrpj14GQyqBwelBwoQruvzzwInnTQjm3/VWgcQn9XavAYQntOJBAThBwkqhzUyskBKWSSnCArZugbhBwnEMechAAAAMnRSTlMACQkJDxEjMzNET1pldZKbm6SnqKurq6ursLG7v8HBwsPExcjJzNDS1NTW4OPt7e/w8+r9Fr8AAABkSURBVHjaVccDFgMxAADRGLWV2knt+5+sy2ie5gMXBmF0FGkdUXRi/rp250rpxmNq2Zzp6/c8dDzWWWXjOLlIwD97y94t5WFs2epLUL0PHE9bY1Y7y8XrtWw/37WSBCEE09JNAFkaBzkb5U0ZAAAAAElFTkSuQmCC)](https://drash.land/drash)

# factory

A simple flat-file website generator, heavily inspired by
[nprapps/app-template](https://github.com/nprapps/app-template).

Requires [deno](https://deno.land/) v1.13.0 or higher, and the
[Sass CLI](https://sass-lang.com/install) v1.37.5 or higher.

Dates are hardcoded to be read from the spreadsheet in `mm/dd/yyyy` format. If
you would like to change this, refer to `parseDate()` in [cms.ts](cms.ts).

You can apply some amount of data validation to your copy by selecting the date
column, deselecting the header cell with Ctrl+Click, and using the following
settings:

![Data validation](https://i.imgur.com/p8Rdgwi.png)
![Reject invalid dates](https://i.imgur.com/hC8esCN.png)
