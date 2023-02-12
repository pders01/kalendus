/** It doesn't make any sense to use lit's translation solution for currently 10 strings
 *  which also creates the necessity of async loading an external translation file.
 *  We just import the strings directly as a JS object.
 */

interface Locale {
    [key: string]: string;
}


export default class Translations {
    private _lang: string;
    private _locales: { [key: string]: Locale };

    constructor() {
        this._lang = document.documentElement.lang.slice(0, 2);
        this._locales = {
            de: {
                Mon: 'Mo',
                Tues: 'Di',
                Wed: 'Mi',
                Thurs: 'Do',
                Fri: 'Fr',
                Sat: 'Sa',
                Sun: 'So',
                Day: 'Tag',
                Month: 'Monat',
                "Current Month": 'Aktueller Monat',
            }
        };
    }

    get lang() {
        return this._lang;
    }

    set lang(lang: string) {
        this._lang = lang;
    }

    getTranslation(key: string) {
        const locale = this._locales[this.lang];
        if (locale) {
            return locale[key] || key;
        }
        return key;
    }
}