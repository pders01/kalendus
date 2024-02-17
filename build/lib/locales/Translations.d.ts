/** It doesn't make any sense to use lit's translation solution for currently 10 strings
 *  which also creates the necessity of async loading an external translation file.
 *  We just import the strings directly as a JS object.
 */
export default class Translations {
    private _lang;
    private _locales;
    constructor();
    get lang(): string;
    set lang(lang: string);
    getTranslation(key: string | number | undefined): string | number | undefined;
}
//# sourceMappingURL=Translations.d.ts.map