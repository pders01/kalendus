/** It doesn't make any sense to use lit's translation solution for currently 10 strings
 *  which also creates the necessity of async loading an external translation file.
 *  We just import the strings directly as a JS object.
 */
export default class Translations {
    constructor() {
        this._lang = document.documentElement.lang.slice(0, 2);
        this._locales = {
            de: {
                /** Weekdays */
                Mon: 'Mo',
                Tues: 'Di',
                Wed: 'Mi',
                Thurs: 'Do',
                Fri: 'Fr',
                Sat: 'Sa',
                Sun: 'So',
                /** Months */
                1: 'Jan',
                2: 'Feb',
                3: 'Mär',
                4: 'Apr',
                5: 'Mai',
                6: 'Jun',
                7: 'Jul',
                8: 'Aug',
                9: 'Sep',
                10: 'Okt',
                11: 'Nov',
                12: 'Dez',
                /** Misc */
                Day: 'Tag',
                Month: 'Monat',
                'Current Month': 'Aktueller Monat',
            },
        };
    }
    get lang() {
        return this._lang;
    }
    set lang(lang) {
        this._lang = lang;
    }
    getTranslation(key) {
        if (!key) {
            return key;
        }
        const locale = this._locales[this.lang];
        if (locale) {
            return locale[key] || key;
        }
        return key;
    }
}
//# sourceMappingURL=Translations.js.map