import{AsyncDirective as e}from"lit-html/async-directive.js";import{directive as t}from"lit-html/directive.js";import{isServer as n}from"lit-html/is-server.js";import{css as r,LitElement as i,html as a,nothing as s,unsafeCSS as o}from"lit";import{customElement as l,state as d,property as u}from"lit/decorators.js";import{classMap as c}from"lit/directives/class-map.js";import{map as h}from"lit/directives/map.js";let m=class{constructor(e,{target:t,config:r,callback:i,skipInitial:a}){this.t=/* @__PURE__ */new Set,this.o=!1,this.i=!1,this.h=e,null!==t&&this.t.add(t??e),this.l=r,this.o=a??this.o,this.callback=i,n||(window.ResizeObserver?(this.u=new ResizeObserver(e=>{this.handleChanges(e),this.h.requestUpdate()}),e.addController(this)):console.warn("ResizeController error: browser does not support ResizeObserver."))}handleChanges(e){this.value=this.callback?.(e,this.u)}hostConnected(){for(const e of this.t)this.observe(e)}hostDisconnected(){this.disconnect()}async hostUpdated(){!this.o&&this.i&&this.handleChanges([]),this.i=!1}observe(e){this.t.add(e),this.u.observe(e,this.l),this.i=!0,this.h.requestUpdate()}unobserve(e){this.t.delete(e),this.u.unobserve(e)}disconnect(){this.u.disconnect()}target(e){return f(this,e)}};const f=t(class extends e{constructor(){super(...arguments),this.observing=!1}render(e,t){}update(e,[t,n]){this.controller=t,this.part=e,this.observe=n,!1===n?(t.unobserve(e.element),this.observing=!1):!1===this.observing&&(t.observe(e.element),this.observing=!0)}disconnected(){this.controller?.unobserve(this.part.element),this.observing=!1}reconnected(){!1!==this.observe&&!1===this.observing&&(this.controller?.observe(this.part.element),this.observing=!0)}}),y="lit-localize-status",g=(e,t,n)=>{let r=e[0];for(let i=1;i<e.length;i++)r+=t[n?n[i-1]:i-1],r+=e[i];return r},p=e=>{return"string"!=typeof(t=e)&&"strTag"in t?g(e.strings,e.values):e;var t};let v=p,w=!1;class b{constructor(e){this.__litLocalizeEventHandler=e=>{"ready"===e.detail.status&&this.host.requestUpdate()},this.host=e}hostConnected(){window.addEventListener(y,this.__litLocalizeEventHandler)}hostDisconnected(){window.removeEventListener(y,this.__litLocalizeEventHandler)}}const k=e=>e.addController(new b(e)),D=()=>(e,t)=>(e.addInitializer(k),e);class S{constructor(){this.settled=!1,this.promise=new Promise((e,t)=>{this._resolve=e,this._reject=t})}resolve(e){this.settled=!0,this._resolve(e)}reject(e){this.settled=!0,this._reject(e)}}const x=[];for(let No=0;No<256;No++)x[No]=(No>>4&15).toString(16)+(15&No).toString(16);function E(e,t){return(t?"h":"s")+function(e){let t=0,n=8997,r=0,i=33826,a=0,s=40164,o=0,l=52210;for(let d=0;d<e.length;d++)n^=e.charCodeAt(d),t=435*n,r=435*i,a=435*s,o=435*l,a+=n<<8,o+=i<<8,r+=t>>>16,n=65535&t,a+=r>>>16,i=65535&r,l=o+(a>>>16)&65535,s=65535&a;return x[l>>8]+x[255&l]+x[s>>8]+x[255&s]+x[i>>8]+x[255&i]+x[n>>8]+x[255&n]}("string"==typeof e?e:e.join(""))}const T=/* @__PURE__ */new WeakMap,$=/* @__PURE__ */new Map;function M(e,t,n){if(e){const r=n?.id??function(e){const t="string"==typeof e?e:e.strings;let n=$.get(t);void 0===n&&(n=E(t,"string"!=typeof e&&!("strTag"in e)),$.set(t,n));return n}(t),i=e[r];if(i){if("string"==typeof i)return i;if("strTag"in i)return g(i.strings,t.values,i.values);{let e=T.get(i);return void 0===e&&(e=i.values,T.set(i,e)),{...i,values:e.map(e=>t.values[e])}}}}return p(t)}function O(e){window.dispatchEvent(new CustomEvent(y,{detail:e}))}let N,C,_,I,A,L="",R=new S;R.resolve();let z=0;const F=()=>L,V=e=>{if(e===(N??L))return R.promise;if(!_||!I)throw new Error("Internal error");if(!_.has(e))throw new Error("Invalid locale code");z++;const t=z;N=e,R.settled&&(R=new S),O({status:"loading",loadingLocale:e});return(e===C?Promise.resolve({templates:void 0}):I(e)).then(n=>{z===t&&(L=e,N=void 0,A=n.templates,O({status:"ready",readyLocale:e}),R.resolve())},n=>{z===t&&(O({status:"error",errorLocale:e,errorMessage:n.toString()}),R.reject(n))}),R.promise};class j extends Error{}class W extends j{constructor(e){super(`Invalid DateTime: ${e.toMessage()}`)}}class Y extends j{constructor(e){super(`Invalid Interval: ${e.toMessage()}`)}}class U extends j{constructor(e){super(`Invalid Duration: ${e.toMessage()}`)}}class Z extends j{}class q extends j{constructor(e){super(`Invalid unit ${e}`)}}class P extends j{}class H extends j{constructor(){super("Zone is an abstract class")}}const B="numeric",G="short",K="long",J={year:B,month:B,day:B},Q={year:B,month:G,day:B},X={year:B,month:G,day:B,weekday:G},ee={year:B,month:K,day:B},te={year:B,month:K,day:B,weekday:K},ne={hour:B,minute:B},re={hour:B,minute:B,second:B},ie={hour:B,minute:B,second:B,timeZoneName:G},ae={hour:B,minute:B,second:B,timeZoneName:K},se={hour:B,minute:B,hourCycle:"h23"},oe={hour:B,minute:B,second:B,hourCycle:"h23"},le={hour:B,minute:B,second:B,hourCycle:"h23",timeZoneName:G},de={hour:B,minute:B,second:B,hourCycle:"h23",timeZoneName:K},ue={year:B,month:B,day:B,hour:B,minute:B},ce={year:B,month:B,day:B,hour:B,minute:B,second:B},he={year:B,month:G,day:B,hour:B,minute:B},me={year:B,month:G,day:B,hour:B,minute:B,second:B},fe={year:B,month:G,day:B,weekday:G,hour:B,minute:B},ye={year:B,month:K,day:B,hour:B,minute:B,timeZoneName:G},ge={year:B,month:K,day:B,hour:B,minute:B,second:B,timeZoneName:G},pe={year:B,month:K,day:B,weekday:K,hour:B,minute:B,timeZoneName:K},ve={year:B,month:K,day:B,weekday:K,hour:B,minute:B,second:B,timeZoneName:K};class we{get type(){throw new H}get name(){throw new H}get ianaName(){return this.name}get isUniversal(){throw new H}offsetName(e,t){throw new H}formatOffset(e,t){throw new H}offset(e){throw new H}equals(e){throw new H}get isValid(){throw new H}}let be=null;class ke extends we{static get instance(){return null===be&&(be=new ke),be}get type(){return"system"}get name(){return(new Intl.DateTimeFormat).resolvedOptions().timeZone}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return Wt(e,t,n)}formatOffset(e,t){return qt(this.offset(e),t)}offset(e){return-new Date(e).getTimezoneOffset()}equals(e){return"system"===e.type}get isValid(){return!0}}const De=/* @__PURE__ */new Map;const Se={year:0,month:1,day:2,era:3,hour:4,minute:5,second:6};const xe=/* @__PURE__ */new Map;class Ee extends we{static create(e){let t=xe.get(e);return void 0===t&&xe.set(e,t=new Ee(e)),t}static resetCache(){xe.clear(),De.clear()}static isValidSpecifier(e){return this.isValidZone(e)}static isValidZone(e){if(!e)return!1;try{return new Intl.DateTimeFormat("en-US",{timeZone:e}).format(),!0}catch(t){return!1}}constructor(e){super(),this.zoneName=e,this.valid=Ee.isValidZone(e)}get type(){return"iana"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return Wt(e,t,n,this.name)}formatOffset(e,t){return qt(this.offset(e),t)}offset(e){if(!this.valid)return NaN;const t=new Date(e);if(isNaN(t))return NaN;const n=function(e){let t=De.get(e);return void 0===t&&(t=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",era:"short"}),De.set(e,t)),t}(this.name);let[r,i,a,s,o,l,d]=n.formatToParts?function(e,t){const n=e.formatToParts(t),r=[];for(let i=0;i<n.length;i++){const{type:e,value:t}=n[i],a=Se[e];"era"===e?r[a]=t:bt(a)||(r[a]=parseInt(t,10))}return r}(n,t):function(e,t){const n=e.format(t).replace(/\u200E/g,""),r=/(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(n),[,i,a,s,o,l,d,u]=r;return[s,i,a,o,l,d,u]}(n,t);"BC"===s&&(r=1-Math.abs(r));let u=+t;const c=u%1e3;return u-=c>=0?c:1e3+c,(zt({year:r,month:i,day:a,hour:24===o?0:o,minute:l,second:d,millisecond:0})-u)/6e4}equals(e){return"iana"===e.type&&e.name===this.name}get isValid(){return this.valid}}let Te={};const $e=/* @__PURE__ */new Map;function Me(e,t={}){const n=JSON.stringify([e,t]);let r=$e.get(n);return void 0===r&&(r=new Intl.DateTimeFormat(e,t),$e.set(n,r)),r}const Oe=/* @__PURE__ */new Map;const Ne=/* @__PURE__ */new Map;let Ce=null;const _e=/* @__PURE__ */new Map;function Ie(e){let t=_e.get(e);return void 0===t&&(t=new Intl.DateTimeFormat(e).resolvedOptions(),_e.set(e,t)),t}const Ae=/* @__PURE__ */new Map;function Le(e,t,n,r){const i=e.listingMode();return"error"===i?null:"en"===i?n(t):r(t)}class Re{constructor(e,t,n){this.padTo=n.padTo||0,this.floor=n.floor||!1;const{padTo:r,floor:i,...a}=n;if(!t||Object.keys(a).length>0){const t={useGrouping:!1,...n};n.padTo>0&&(t.minimumIntegerDigits=n.padTo),this.inf=function(e,t={}){const n=JSON.stringify([e,t]);let r=Oe.get(n);return void 0===r&&(r=new Intl.NumberFormat(e,t),Oe.set(n,r)),r}(e,t)}}format(e){if(this.inf){const t=this.floor?Math.floor(e):e;return this.inf.format(t)}return Ot(this.floor?Math.floor(e):It(e,3),this.padTo)}}class ze{constructor(e,t,n){let r;if(this.opts=n,this.originalZone=void 0,this.opts.timeZone)this.dt=e;else if("fixed"===e.zone.type){const t=e.offset/60*-1,n=t>=0?`Etc/GMT+${t}`:`Etc/GMT${t}`;0!==e.offset&&Ee.create(n).valid?(r=n,this.dt=e):(r="UTC",this.dt=0===e.offset?e:e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone)}else"system"===e.zone.type?this.dt=e:"iana"===e.zone.type?(this.dt=e,r=e.zone.name):(r="UTC",this.dt=e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone);const i={...this.opts};i.timeZone=i.timeZone||r,this.dtf=Me(t,i)}format(){return this.originalZone?this.formatToParts().map(({value:e})=>e).join(""):this.dtf.format(this.dt.toJSDate())}formatToParts(){const e=this.dtf.formatToParts(this.dt.toJSDate());return this.originalZone?e.map(e=>{if("timeZoneName"===e.type){const t=this.originalZone.offsetName(this.dt.ts,{locale:this.dt.locale,format:this.opts.timeZoneName});return{...e,value:t}}return e}):e}resolvedOptions(){return this.dtf.resolvedOptions()}}class Fe{constructor(e,t,n){this.opts={style:"long",...n},!t&&St()&&(this.rtf=function(e,t={}){const{base:n,...r}=t,i=JSON.stringify([e,r]);let a=Ne.get(i);return void 0===a&&(a=new Intl.RelativeTimeFormat(e,t),Ne.set(i,a)),a}(e,n))}format(e,t){return this.rtf?this.rtf.format(e,t):function(e,t,n="always",r=!1){const i={years:["year","yr."],quarters:["quarter","qtr."],months:["month","mo."],weeks:["week","wk."],days:["day","day","days"],hours:["hour","hr."],minutes:["minute","min."],seconds:["second","sec."]},a=-1===["hours","minutes","seconds"].indexOf(e);if("auto"===n&&a){const n="days"===e;switch(t){case 1:return n?"tomorrow":`next ${i[e][0]}`;case-1:return n?"yesterday":`last ${i[e][0]}`;case 0:return n?"today":`this ${i[e][0]}`}}const s=Object.is(t,-0)||t<0,o=Math.abs(t),l=1===o,d=i[e],u=r?l?d[1]:d[2]||d[1]:l?i[e][0]:e;return s?`${o} ${u} ago`:`in ${o} ${u}`}(t,e,this.opts.numeric,"long"!==this.opts.style)}formatToParts(e,t){return this.rtf?this.rtf.formatToParts(e,t):[]}}const Ve={firstDay:1,minimalDays:4,weekend:[6,7]};class je{static fromOpts(e){return je.create(e.locale,e.numberingSystem,e.outputCalendar,e.weekSettings,e.defaultToEN)}static create(e,t,n,r,i=!1){const a=e||it.defaultLocale,s=a||(i?"en-US":Ce||(Ce=(new Intl.DateTimeFormat).resolvedOptions().locale,Ce)),o=t||it.defaultNumberingSystem,l=n||it.defaultOutputCalendar,d=$t(r)||it.defaultWeekSettings;return new je(s,o,l,d,a)}static resetCache(){Ce=null,$e.clear(),Oe.clear(),Ne.clear(),_e.clear(),Ae.clear()}static fromObject({locale:e,numberingSystem:t,outputCalendar:n,weekSettings:r}={}){return je.create(e,t,n,r)}constructor(e,t,n,r,i){const[a,s,o]=function(e){const t=e.indexOf("-x-");-1!==t&&(e=e.substring(0,t));const n=e.indexOf("-u-");if(-1===n)return[e];{let t,i;try{t=Me(e).resolvedOptions(),i=e}catch(r){const a=e.substring(0,n);t=Me(a).resolvedOptions(),i=a}const{numberingSystem:a,calendar:s}=t;return[i,a,s]}}(e);this.locale=a,this.numberingSystem=t||s||null,this.outputCalendar=n||o||null,this.weekSettings=r,this.intl=function(e,t,n){return n||t?(e.includes("-u-")||(e+="-u"),n&&(e+=`-ca-${n}`),t&&(e+=`-nu-${t}`),e):e}(this.locale,this.numberingSystem,this.outputCalendar),this.weekdaysCache={format:{},standalone:{}},this.monthsCache={format:{},standalone:{}},this.meridiemCache=null,this.eraCache={},this.specifiedLocale=i,this.fastNumbersCached=null}get fastNumbers(){var e;return null==this.fastNumbersCached&&(this.fastNumbersCached=(!(e=this).numberingSystem||"latn"===e.numberingSystem)&&("latn"===e.numberingSystem||!e.locale||e.locale.startsWith("en")||"latn"===Ie(e.locale).numberingSystem)),this.fastNumbersCached}listingMode(){const e=this.isEnglish(),t=!(null!==this.numberingSystem&&"latn"!==this.numberingSystem||null!==this.outputCalendar&&"gregory"!==this.outputCalendar);return e&&t?"en":"intl"}clone(e){return e&&0!==Object.getOwnPropertyNames(e).length?je.create(e.locale||this.specifiedLocale,e.numberingSystem||this.numberingSystem,e.outputCalendar||this.outputCalendar,$t(e.weekSettings)||this.weekSettings,e.defaultToEN||!1):this}redefaultToEN(e={}){return this.clone({...e,defaultToEN:!0})}redefaultToSystem(e={}){return this.clone({...e,defaultToEN:!1})}months(e,t=!1){return Le(this,e,Kt,()=>{const n="ja"===this.intl||this.intl.startsWith("ja-"),r=(t&=!n)?{month:e,day:"numeric"}:{month:e},i=t?"format":"standalone";if(!this.monthsCache[i][e]){const t=n?e=>this.dtFormatter(e,r).format():e=>this.extract(e,r,"month");this.monthsCache[i][e]=function(e){const t=[];for(let n=1;n<=12;n++){const r=ni.utc(2009,n,1);t.push(e(r))}return t}(t)}return this.monthsCache[i][e]})}weekdays(e,t=!1){return Le(this,e,en,()=>{const n=t?{weekday:e,year:"numeric",month:"long",day:"numeric"}:{weekday:e},r=t?"format":"standalone";return this.weekdaysCache[r][e]||(this.weekdaysCache[r][e]=function(e){const t=[];for(let n=1;n<=7;n++){const r=ni.utc(2016,11,13+n);t.push(e(r))}return t}(e=>this.extract(e,n,"weekday"))),this.weekdaysCache[r][e]})}meridiems(){return Le(this,void 0,()=>tn,()=>{if(!this.meridiemCache){const e={hour:"numeric",hourCycle:"h12"};this.meridiemCache=[ni.utc(2016,11,13,9),ni.utc(2016,11,13,19)].map(t=>this.extract(t,e,"dayperiod"))}return this.meridiemCache})}eras(e){return Le(this,e,sn,()=>{const t={era:e};return this.eraCache[e]||(this.eraCache[e]=[ni.utc(-40,1,1),ni.utc(2017,1,1)].map(e=>this.extract(e,t,"era"))),this.eraCache[e]})}extract(e,t,n){const r=this.dtFormatter(e,t).formatToParts().find(e=>e.type.toLowerCase()===n);return r?r.value:null}numberFormatter(e={}){return new Re(this.intl,e.forceSimple||this.fastNumbers,e)}dtFormatter(e,t={}){return new ze(e,this.intl,t)}relFormatter(e={}){return new Fe(this.intl,this.isEnglish(),e)}listFormatter(e={}){return function(e,t={}){const n=JSON.stringify([e,t]);let r=Te[n];return r||(r=new Intl.ListFormat(e,t),Te[n]=r),r}(this.intl,e)}isEnglish(){return"en"===this.locale||"en-us"===this.locale.toLowerCase()||Ie(this.intl).locale.startsWith("en-us")}getWeekSettings(){return this.weekSettings?this.weekSettings:xt()?function(e){let t=Ae.get(e);if(!t){const n=new Intl.Locale(e);t="getWeekInfo"in n?n.getWeekInfo():n.weekInfo,"minimalDays"in t||(t={...Ve,...t}),Ae.set(e,t)}return t}(this.locale):Ve}getStartOfWeek(){return this.getWeekSettings().firstDay}getMinDaysInFirstWeek(){return this.getWeekSettings().minimalDays}getWeekendDays(){return this.getWeekSettings().weekend}equals(e){return this.locale===e.locale&&this.numberingSystem===e.numberingSystem&&this.outputCalendar===e.outputCalendar}toString(){return`Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`}}let We=null;class Ye extends we{static get utcInstance(){return null===We&&(We=new Ye(0)),We}static instance(e){return 0===e?Ye.utcInstance:new Ye(e)}static parseSpecifier(e){if(e){const t=e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);if(t)return new Ye(Yt(t[1],t[2]))}return null}constructor(e){super(),this.fixed=e}get type(){return"fixed"}get name(){return 0===this.fixed?"UTC":`UTC${qt(this.fixed,"narrow")}`}get ianaName(){return 0===this.fixed?"Etc/UTC":`Etc/GMT${qt(-this.fixed,"narrow")}`}offsetName(){return this.name}formatOffset(e,t){return qt(this.fixed,t)}get isUniversal(){return!0}offset(){return this.fixed}equals(e){return"fixed"===e.type&&e.fixed===this.fixed}get isValid(){return!0}}class Ue extends we{constructor(e){super(),this.zoneName=e}get type(){return"invalid"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(){return null}formatOffset(){return""}offset(){return NaN}equals(){return!1}get isValid(){return!1}}function Ze(e,t){if(bt(e)||null===e)return t;if(e instanceof we)return e;if("string"==typeof e){const n=e.toLowerCase();return"default"===n?t:"local"===n||"system"===n?ke.instance:"utc"===n||"gmt"===n?Ye.utcInstance:Ye.parseSpecifier(n)||Ee.create(e)}return kt(e)?Ye.instance(e):"object"==typeof e&&"offset"in e&&"function"==typeof e.offset?e:new Ue(e)}const qe={arab:"[٠-٩]",arabext:"[۰-۹]",bali:"[᭐-᭙]",beng:"[০-৯]",deva:"[०-९]",fullwide:"[０-９]",gujr:"[૦-૯]",hanidec:"[〇|一|二|三|四|五|六|七|八|九]",khmr:"[០-៩]",knda:"[೦-೯]",laoo:"[໐-໙]",limb:"[᥆-᥏]",mlym:"[൦-൯]",mong:"[᠐-᠙]",mymr:"[၀-၉]",orya:"[୦-୯]",tamldec:"[௦-௯]",telu:"[౦-౯]",thai:"[๐-๙]",tibt:"[༠-༩]",latn:"\\d"},Pe={arab:[1632,1641],arabext:[1776,1785],bali:[6992,7001],beng:[2534,2543],deva:[2406,2415],fullwide:[65296,65303],gujr:[2790,2799],khmr:[6112,6121],knda:[3302,3311],laoo:[3792,3801],limb:[6470,6479],mlym:[3430,3439],mong:[6160,6169],mymr:[4160,4169],orya:[2918,2927],tamldec:[3046,3055],telu:[3174,3183],thai:[3664,3673],tibt:[3872,3881]},He=qe.hanidec.replace(/[\[|\]]/g,"").split("");const Be=/* @__PURE__ */new Map;function Ge({numberingSystem:e},t=""){const n=e||"latn";let r=Be.get(n);void 0===r&&(r=/* @__PURE__ */new Map,Be.set(n,r));let i=r.get(t);return void 0===i&&(i=new RegExp(`${qe[n]}${t}`),r.set(t,i)),i}let Ke,Je=()=>Date.now(),Qe="system",Xe=null,et=null,tt=null,nt=60,rt=null;class it{static get now(){return Je}static set now(e){Je=e}static set defaultZone(e){Qe=e}static get defaultZone(){return Ze(Qe,ke.instance)}static get defaultLocale(){return Xe}static set defaultLocale(e){Xe=e}static get defaultNumberingSystem(){return et}static set defaultNumberingSystem(e){et=e}static get defaultOutputCalendar(){return tt}static set defaultOutputCalendar(e){tt=e}static get defaultWeekSettings(){return rt}static set defaultWeekSettings(e){rt=$t(e)}static get twoDigitCutoffYear(){return nt}static set twoDigitCutoffYear(e){nt=e%100}static get throwOnInvalid(){return Ke}static set throwOnInvalid(e){Ke=e}static resetCaches(){je.resetCache(),Ee.resetCache(),ni.resetCache(),Be.clear()}}class at{constructor(e,t){this.reason=e,this.explanation=t}toMessage(){return this.explanation?`${this.reason}: ${this.explanation}`:this.reason}}const st=[0,31,59,90,120,151,181,212,243,273,304,334],ot=[0,31,60,91,121,152,182,213,244,274,305,335];function lt(e,t){return new at("unit out of range",`you specified ${t} (of type ${typeof t}) as a ${e}, which is invalid`)}function dt(e,t,n){const r=new Date(Date.UTC(e,t-1,n));e<100&&e>=0&&r.setUTCFullYear(r.getUTCFullYear()-1900);const i=r.getUTCDay();return 0===i?7:i}function ut(e,t,n){return n+(At(e)?ot:st)[t-1]}function ct(e,t){const n=At(e)?ot:st,r=n.findIndex(e=>e<t);return{month:r+1,day:t-n[r]}}function ht(e,t){return(e-t+7)%7+1}function mt(e,t=4,n=1){const{year:r,month:i,day:a}=e,s=ut(r,i,a),o=ht(dt(r,i,a),n);let l,d=Math.floor((s-o+14-t)/7);return d<1?(l=r-1,d=Vt(l,t,n)):d>Vt(r,t,n)?(l=r+1,d=1):l=r,{weekYear:l,weekNumber:d,weekday:o,...Pt(e)}}function ft(e,t=4,n=1){const{weekYear:r,weekNumber:i,weekday:a}=e,s=ht(dt(r,1,t),n),o=Lt(r);let l,d=7*i+a-s-7+t;d<1?(l=r-1,d+=Lt(l)):d>o?(l=r+1,d-=Lt(r)):l=r;const{month:u,day:c}=ct(l,d);return{year:l,month:u,day:c,...Pt(e)}}function yt(e){const{year:t,month:n,day:r}=e;return{year:t,ordinal:ut(t,n,r),...Pt(e)}}function gt(e){const{year:t,ordinal:n}=e,{month:r,day:i}=ct(t,n);return{year:t,month:r,day:i,...Pt(e)}}function pt(e,t){if(!bt(e.localWeekday)||!bt(e.localWeekNumber)||!bt(e.localWeekYear)){if(!bt(e.weekday)||!bt(e.weekNumber)||!bt(e.weekYear))throw new Z("Cannot mix locale-based week fields with ISO-based week fields");return bt(e.localWeekday)||(e.weekday=e.localWeekday),bt(e.localWeekNumber)||(e.weekNumber=e.localWeekNumber),bt(e.localWeekYear)||(e.weekYear=e.localWeekYear),delete e.localWeekday,delete e.localWeekNumber,delete e.localWeekYear,{minDaysInFirstWeek:t.getMinDaysInFirstWeek(),startOfWeek:t.getStartOfWeek()}}return{minDaysInFirstWeek:4,startOfWeek:1}}function vt(e){const t=Dt(e.year),n=Mt(e.month,1,12),r=Mt(e.day,1,Rt(e.year,e.month));return t?n?!r&&lt("day",e.day):lt("month",e.month):lt("year",e.year)}function wt(e){const{hour:t,minute:n,second:r,millisecond:i}=e,a=Mt(t,0,23)||24===t&&0===n&&0===r&&0===i,s=Mt(n,0,59),o=Mt(r,0,59),l=Mt(i,0,999);return a?s?o?!l&&lt("millisecond",i):lt("second",r):lt("minute",n):lt("hour",t)}function bt(e){return void 0===e}function kt(e){return"number"==typeof e}function Dt(e){return"number"==typeof e&&e%1==0}function St(){try{return"undefined"!=typeof Intl&&!!Intl.RelativeTimeFormat}catch(e){return!1}}function xt(){try{return"undefined"!=typeof Intl&&!!Intl.Locale&&("weekInfo"in Intl.Locale.prototype||"getWeekInfo"in Intl.Locale.prototype)}catch(e){return!1}}function Et(e,t,n){if(0!==e.length)return e.reduce((e,r)=>{const i=[t(r),r];return e&&n(e[0],i[0])===e[0]?e:i},null)[1]}function Tt(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function $t(e){if(null==e)return null;if("object"!=typeof e)throw new P("Week settings must be an object");if(!Mt(e.firstDay,1,7)||!Mt(e.minimalDays,1,7)||!Array.isArray(e.weekend)||e.weekend.some(e=>!Mt(e,1,7)))throw new P("Invalid week settings");return{firstDay:e.firstDay,minimalDays:e.minimalDays,weekend:Array.from(e.weekend)}}function Mt(e,t,n){return Dt(e)&&e>=t&&e<=n}function Ot(e,t=2){let n;return n=e<0?"-"+(""+-e).padStart(t,"0"):(""+e).padStart(t,"0"),n}function Nt(e){return bt(e)||null===e||""===e?void 0:parseInt(e,10)}function Ct(e){return bt(e)||null===e||""===e?void 0:parseFloat(e)}function _t(e){if(!bt(e)&&null!==e&&""!==e){const t=1e3*parseFloat("0."+e);return Math.floor(t)}}function It(e,t,n="round"){const r=10**t;switch(n){case"expand":return e>0?Math.ceil(e*r)/r:Math.floor(e*r)/r;case"trunc":return Math.trunc(e*r)/r;case"round":return Math.round(e*r)/r;case"floor":return Math.floor(e*r)/r;case"ceil":return Math.ceil(e*r)/r;default:throw new RangeError(`Value rounding ${n} is out of range`)}}function At(e){return e%4==0&&(e%100!=0||e%400==0)}function Lt(e){return At(e)?366:365}function Rt(e,t){const n=(r=t-1)-(i=12)*Math.floor(r/i)+1;var r,i;return 2===n?At(e+(t-n)/12)?29:28:[31,null,31,30,31,30,31,31,30,31,30,31][n-1]}function zt(e){let t=Date.UTC(e.year,e.month-1,e.day,e.hour,e.minute,e.second,e.millisecond);return e.year<100&&e.year>=0&&(t=new Date(t),t.setUTCFullYear(e.year,e.month-1,e.day)),+t}function Ft(e,t,n){return-ht(dt(e,1,t),n)+t-1}function Vt(e,t=4,n=1){const r=Ft(e,t,n),i=Ft(e+1,t,n);return(Lt(e)-r+i)/7}function jt(e){return e>99?e:e>it.twoDigitCutoffYear?1900+e:2e3+e}function Wt(e,t,n,r=null){const i=new Date(e),a={hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"};r&&(a.timeZone=r);const s={timeZoneName:t,...a},o=new Intl.DateTimeFormat(n,s).formatToParts(i).find(e=>"timezonename"===e.type.toLowerCase());return o?o.value:null}function Yt(e,t){let n=parseInt(e,10);Number.isNaN(n)&&(n=0);const r=parseInt(t,10)||0;return 60*n+(n<0||Object.is(n,-0)?-r:r)}function Ut(e){const t=Number(e);if("boolean"==typeof e||""===e||!Number.isFinite(t))throw new P(`Invalid unit value ${e}`);return t}function Zt(e,t){const n={};for(const r in e)if(Tt(e,r)){const i=e[r];if(null==i)continue;n[t(r)]=Ut(i)}return n}function qt(e,t){const n=Math.trunc(Math.abs(e/60)),r=Math.trunc(Math.abs(e%60)),i=e>=0?"+":"-";switch(t){case"short":return`${i}${Ot(n,2)}:${Ot(r,2)}`;case"narrow":return`${i}${n}${r>0?`:${r}`:""}`;case"techie":return`${i}${Ot(n,2)}${Ot(r,2)}`;default:throw new RangeError(`Value format ${t} is out of range for property format`)}}function Pt(e){return function(e,t){return t.reduce((t,n)=>(t[n]=e[n],t),{})}(e,["hour","minute","second","millisecond"])}const Ht=["January","February","March","April","May","June","July","August","September","October","November","December"],Bt=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Gt=["J","F","M","A","M","J","J","A","S","O","N","D"];function Kt(e){switch(e){case"narrow":return[...Gt];case"short":return[...Bt];case"long":return[...Ht];case"numeric":return["1","2","3","4","5","6","7","8","9","10","11","12"];case"2-digit":return["01","02","03","04","05","06","07","08","09","10","11","12"];default:return null}}const Jt=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],Qt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Xt=["M","T","W","T","F","S","S"];function en(e){switch(e){case"narrow":return[...Xt];case"short":return[...Qt];case"long":return[...Jt];case"numeric":return["1","2","3","4","5","6","7"];default:return null}}const tn=["AM","PM"],nn=["Before Christ","Anno Domini"],rn=["BC","AD"],an=["B","A"];function sn(e){switch(e){case"narrow":return[...an];case"short":return[...rn];case"long":return[...nn];default:return null}}function on(e,t){let n="";for(const r of e)r.literal?n+=r.val:n+=t(r.val);return n}const ln={D:J,DD:Q,DDD:ee,DDDD:te,t:ne,tt:re,ttt:ie,tttt:ae,T:se,TT:oe,TTT:le,TTTT:de,f:ue,ff:he,fff:ye,ffff:pe,F:ce,FF:me,FFF:ge,FFFF:ve};class dn{static create(e,t={}){return new dn(e,t)}static parseFormat(e){let t=null,n="",r=!1;const i=[];for(let a=0;a<e.length;a++){const s=e.charAt(a);"'"===s?((n.length>0||r)&&i.push({literal:r||/^\s+$/.test(n),val:""===n?"'":n}),t=null,n="",r=!r):r||s===t?n+=s:(n.length>0&&i.push({literal:/^\s+$/.test(n),val:n}),n=s,t=s)}return n.length>0&&i.push({literal:r||/^\s+$/.test(n),val:n}),i}static macroTokenToFormatOpts(e){return ln[e]}constructor(e,t){this.opts=t,this.loc=e,this.systemLoc=null}formatWithSystemDefault(e,t){null===this.systemLoc&&(this.systemLoc=this.loc.redefaultToSystem());return this.systemLoc.dtFormatter(e,{...this.opts,...t}).format()}dtFormatter(e,t={}){return this.loc.dtFormatter(e,{...this.opts,...t})}formatDateTime(e,t){return this.dtFormatter(e,t).format()}formatDateTimeParts(e,t){return this.dtFormatter(e,t).formatToParts()}formatInterval(e,t){return this.dtFormatter(e.start,t).dtf.formatRange(e.start.toJSDate(),e.end.toJSDate())}resolvedOptions(e,t){return this.dtFormatter(e,t).resolvedOptions()}num(e,t=0,n=void 0){if(this.opts.forceSimple)return Ot(e,t);const r={...this.opts};return t>0&&(r.padTo=t),n&&(r.signDisplay=n),this.loc.numberFormatter(r).format(e)}formatDateTimeFromString(e,t){const n="en"===this.loc.listingMode(),r=this.loc.outputCalendar&&"gregory"!==this.loc.outputCalendar,i=(t,n)=>this.loc.extract(e,t,n),a=t=>e.isOffsetFixed&&0===e.offset&&t.allowZ?"Z":e.isValid?e.zone.formatOffset(e.ts,t.format):"",s=()=>n?function(e){return tn[e.hour<12?0:1]}(e):i({hour:"numeric",hourCycle:"h12"},"dayperiod"),o=(t,r)=>n?function(e,t){return Kt(t)[e.month-1]}(e,t):i(r?{month:t}:{month:t,day:"numeric"},"month"),l=(t,r)=>n?function(e,t){return en(t)[e.weekday-1]}(e,t):i(r?{weekday:t}:{weekday:t,month:"long",day:"numeric"},"weekday"),d=t=>{const n=dn.macroTokenToFormatOpts(t);return n?this.formatWithSystemDefault(e,n):t},u=t=>n?function(e,t){return sn(t)[e.year<0?0:1]}(e,t):i({era:t},"era");return on(dn.parseFormat(t),t=>{switch(t){case"S":return this.num(e.millisecond);case"u":case"SSS":return this.num(e.millisecond,3);case"s":return this.num(e.second);case"ss":return this.num(e.second,2);case"uu":return this.num(Math.floor(e.millisecond/10),2);case"uuu":return this.num(Math.floor(e.millisecond/100));case"m":return this.num(e.minute);case"mm":return this.num(e.minute,2);case"h":return this.num(e.hour%12==0?12:e.hour%12);case"hh":return this.num(e.hour%12==0?12:e.hour%12,2);case"H":return this.num(e.hour);case"HH":return this.num(e.hour,2);case"Z":return a({format:"narrow",allowZ:this.opts.allowZ});case"ZZ":return a({format:"short",allowZ:this.opts.allowZ});case"ZZZ":return a({format:"techie",allowZ:this.opts.allowZ});case"ZZZZ":return e.zone.offsetName(e.ts,{format:"short",locale:this.loc.locale});case"ZZZZZ":return e.zone.offsetName(e.ts,{format:"long",locale:this.loc.locale});case"z":return e.zoneName;case"a":return s();case"d":return r?i({day:"numeric"},"day"):this.num(e.day);case"dd":return r?i({day:"2-digit"},"day"):this.num(e.day,2);case"c":case"E":return this.num(e.weekday);case"ccc":return l("short",!0);case"cccc":return l("long",!0);case"ccccc":return l("narrow",!0);case"EEE":return l("short",!1);case"EEEE":return l("long",!1);case"EEEEE":return l("narrow",!1);case"L":return r?i({month:"numeric",day:"numeric"},"month"):this.num(e.month);case"LL":return r?i({month:"2-digit",day:"numeric"},"month"):this.num(e.month,2);case"LLL":return o("short",!0);case"LLLL":return o("long",!0);case"LLLLL":return o("narrow",!0);case"M":return r?i({month:"numeric"},"month"):this.num(e.month);case"MM":return r?i({month:"2-digit"},"month"):this.num(e.month,2);case"MMM":return o("short",!1);case"MMMM":return o("long",!1);case"MMMMM":return o("narrow",!1);case"y":return r?i({year:"numeric"},"year"):this.num(e.year);case"yy":return r?i({year:"2-digit"},"year"):this.num(e.year.toString().slice(-2),2);case"yyyy":return r?i({year:"numeric"},"year"):this.num(e.year,4);case"yyyyyy":return r?i({year:"numeric"},"year"):this.num(e.year,6);case"G":return u("short");case"GG":return u("long");case"GGGGG":return u("narrow");case"kk":return this.num(e.weekYear.toString().slice(-2),2);case"kkkk":return this.num(e.weekYear,4);case"W":return this.num(e.weekNumber);case"WW":return this.num(e.weekNumber,2);case"n":return this.num(e.localWeekNumber);case"nn":return this.num(e.localWeekNumber,2);case"ii":return this.num(e.localWeekYear.toString().slice(-2),2);case"iiii":return this.num(e.localWeekYear,4);case"o":return this.num(e.ordinal);case"ooo":return this.num(e.ordinal,3);case"q":return this.num(e.quarter);case"qq":return this.num(e.quarter,2);case"X":return this.num(Math.floor(e.ts/1e3));case"x":return this.num(e.ts);default:return d(t)}})}formatDurationFromString(e,t){const n="negativeLargestOnly"===this.opts.signMode?-1:1,r=e=>{switch(e[0]){case"S":return"milliseconds";case"s":return"seconds";case"m":return"minutes";case"h":return"hours";case"d":return"days";case"w":return"weeks";case"M":return"months";case"y":return"years";default:return null}},i=dn.parseFormat(t),a=i.reduce((e,{literal:t,val:n})=>t?e:e.concat(n),[]),s=e.shiftTo(...a.map(r).filter(e=>e));return on(i,((e,t)=>i=>{const a=r(i);if(a){const r=t.isNegativeDuration&&a!==t.largestUnit?n:1;let s;return s="negativeLargestOnly"===this.opts.signMode&&a!==t.largestUnit?"never":"all"===this.opts.signMode?"always":"auto",this.num(e.get(a)*r,i.length,s)}return i})(s,{isNegativeDuration:s<0,largestUnit:Object.keys(s.values)[0]}))}}const un=/[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;function cn(...e){const t=e.reduce((e,t)=>e+t.source,"");return RegExp(`^${t}$`)}function hn(...e){return t=>e.reduce(([e,n,r],i)=>{const[a,s,o]=i(t,r);return[{...e,...a},s||n,o]},[{},null,1]).slice(0,2)}function mn(e,...t){if(null==e)return[null,null];for(const[n,r]of t){const t=n.exec(e);if(t)return r(t)}return[null,null]}function fn(...e){return(t,n)=>{const r={};let i;for(i=0;i<e.length;i++)r[e[i]]=Nt(t[n+i]);return[r,null,n+i]}}const yn=/(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/,gn=/(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/,pn=RegExp(`${gn.source}${`(?:${yn.source}?(?:\\[(${un.source})\\])?)?`}`),vn=RegExp(`(?:[Tt]${pn.source})?`),wn=fn("weekYear","weekNumber","weekDay"),bn=fn("year","ordinal"),kn=RegExp(`${gn.source} ?(?:${yn.source}|(${un.source}))?`),Dn=RegExp(`(?: ${kn.source})?`);function Sn(e,t,n){const r=e[t];return bt(r)?n:Nt(r)}function xn(e,t){return[{hours:Sn(e,t,0),minutes:Sn(e,t+1,0),seconds:Sn(e,t+2,0),milliseconds:_t(e[t+3])},null,t+4]}function En(e,t){const n=!e[t]&&!e[t+1],r=Yt(e[t+1],e[t+2]);return[{},n?null:Ye.instance(r),t+3]}function Tn(e,t){return[{},e[t]?Ee.create(e[t]):null,t+1]}const $n=RegExp(`^T?${gn.source}$`),Mn=/^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;function On(e){const[t,n,r,i,a,s,o,l,d]=e,u="-"===t[0],c=l&&"-"===l[0],h=(e,t=!1)=>void 0!==e&&(t||e&&u)?-e:e;return[{years:h(Ct(n)),months:h(Ct(r)),weeks:h(Ct(i)),days:h(Ct(a)),hours:h(Ct(s)),minutes:h(Ct(o)),seconds:h(Ct(l),"-0"===l),milliseconds:h(_t(d),c)}]}const Nn={GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function Cn(e,t,n,r,i,a,s){const o={year:2===t.length?jt(Nt(t)):Nt(t),month:Bt.indexOf(n)+1,day:Nt(r),hour:Nt(i),minute:Nt(a)};return s&&(o.second=Nt(s)),e&&(o.weekday=e.length>3?Jt.indexOf(e)+1:Qt.indexOf(e)+1),o}const _n=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;function In(e){const[,t,n,r,i,a,s,o,l,d,u,c]=e,h=Cn(t,i,r,n,a,s,o);let m;return m=l?Nn[l]:d?0:Yt(u,c),[h,new Ye(m)]}const An=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,Ln=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,Rn=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;function zn(e){const[,t,n,r,i,a,s,o]=e;return[Cn(t,i,r,n,a,s,o),Ye.utcInstance]}function Fn(e){const[,t,n,r,i,a,s,o]=e;return[Cn(t,o,n,r,i,a,s),Ye.utcInstance]}const Vn=cn(/([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,vn),jn=cn(/(\d{4})-?W(\d\d)(?:-?(\d))?/,vn),Wn=cn(/(\d{4})-?(\d{3})/,vn),Yn=cn(pn),Un=hn(function(e,t){return[{year:Sn(e,t),month:Sn(e,t+1,1),day:Sn(e,t+2,1)},null,t+3]},xn,En,Tn),Zn=hn(wn,xn,En,Tn),qn=hn(bn,xn,En,Tn),Pn=hn(xn,En,Tn);const Hn=hn(xn);const Bn=cn(/(\d{4})-(\d\d)-(\d\d)/,Dn),Gn=cn(kn),Kn=hn(xn,En,Tn);const Jn="Invalid Duration",Qn={weeks:{days:7,hours:168,minutes:10080,seconds:604800,milliseconds:6048e5},days:{hours:24,minutes:1440,seconds:86400,milliseconds:864e5},hours:{minutes:60,seconds:3600,milliseconds:36e5},minutes:{seconds:60,milliseconds:6e4},seconds:{milliseconds:1e3}},Xn={years:{quarters:4,months:12,weeks:52,days:365,hours:8760,minutes:525600,seconds:31536e3,milliseconds:31536e6},quarters:{months:3,weeks:13,days:91,hours:2184,minutes:131040,seconds:7862400,milliseconds:78624e5},months:{weeks:4,days:30,hours:720,minutes:43200,seconds:2592e3,milliseconds:2592e6},...Qn},er=365.2425,tr=30.436875,nr={years:{quarters:4,months:12,weeks:52.1775,days:er,hours:8765.82,minutes:525949.2,seconds:525949.2*60,milliseconds:525949.2*60*1e3},quarters:{months:3,weeks:13.044375,days:91.310625,hours:2191.455,minutes:131487.3,seconds:525949.2*60/4,milliseconds:7889237999.999999},months:{weeks:4.3481250000000005,days:tr,hours:730.485,minutes:43829.1,seconds:2629746,milliseconds:2629746e3},...Qn},rr=["years","quarters","months","weeks","days","hours","minutes","seconds","milliseconds"],ir=rr.slice(0).reverse();function ar(e,t,n=!1){const r={values:n?t.values:{...e.values,...t.values||{}},loc:e.loc.clone(t.loc),conversionAccuracy:t.conversionAccuracy||e.conversionAccuracy,matrix:t.matrix||e.matrix};return new dr(r)}function sr(e,t){let n=t.milliseconds??0;for(const r of ir.slice(1))t[r]&&(n+=t[r]*e[r].milliseconds);return n}function or(e,t){const n=sr(e,t)<0?-1:1;rr.reduceRight((r,i)=>{if(bt(t[i]))return r;if(r){const a=t[r]*n,s=e[i][r],o=Math.floor(a/s);t[i]+=o*n,t[r]-=o*s*n}return i},null),rr.reduce((n,r)=>{if(bt(t[r]))return n;if(n){const i=t[n]%1;t[n]-=i,t[r]+=i*e[n][r]}return r},null)}function lr(e){const t={};for(const[n,r]of Object.entries(e))0!==r&&(t[n]=r);return t}class dr{constructor(e){const t="longterm"===e.conversionAccuracy||!1;let n=t?nr:Xn;e.matrix&&(n=e.matrix),this.values=e.values,this.loc=e.loc||je.create(),this.conversionAccuracy=t?"longterm":"casual",this.invalid=e.invalid||null,this.matrix=n,this.isLuxonDuration=!0}static fromMillis(e,t){return dr.fromObject({milliseconds:e},t)}static fromObject(e,t={}){if(null==e||"object"!=typeof e)throw new P("Duration.fromObject: argument expected to be an object, got "+(null===e?"null":typeof e));return new dr({values:Zt(e,dr.normalizeUnit),loc:je.fromObject(t),conversionAccuracy:t.conversionAccuracy,matrix:t.matrix})}static fromDurationLike(e){if(kt(e))return dr.fromMillis(e);if(dr.isDuration(e))return e;if("object"==typeof e)return dr.fromObject(e);throw new P(`Unknown duration argument ${e} of type ${typeof e}`)}static fromISO(e,t){const[n]=mn(e,[Mn,On]);return n?dr.fromObject(n,t):dr.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static fromISOTime(e,t){const[n]=mn(e,[$n,Hn]);return n?dr.fromObject(n,t):dr.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static invalid(e,t=null){if(!e)throw new P("need to specify a reason the Duration is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new U(n);return new dr({invalid:n})}static normalizeUnit(e){const t={year:"years",years:"years",quarter:"quarters",quarters:"quarters",month:"months",months:"months",week:"weeks",weeks:"weeks",day:"days",days:"days",hour:"hours",hours:"hours",minute:"minutes",minutes:"minutes",second:"seconds",seconds:"seconds",millisecond:"milliseconds",milliseconds:"milliseconds"}[e?e.toLowerCase():e];if(!t)throw new q(e);return t}static isDuration(e){return e&&e.isLuxonDuration||!1}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}toFormat(e,t={}){const n={...t,floor:!1!==t.round&&!1!==t.floor};return this.isValid?dn.create(this.loc,n).formatDurationFromString(this,e):Jn}toHuman(e={}){if(!this.isValid)return Jn;const t=!1!==e.showZeros,n=rr.map(n=>{const r=this.values[n];return bt(r)||0===r&&!t?null:this.loc.numberFormatter({style:"unit",unitDisplay:"long",...e,unit:n.slice(0,-1)}).format(r)}).filter(e=>e);return this.loc.listFormatter({type:"conjunction",style:e.listStyle||"narrow",...e}).format(n)}toObject(){return this.isValid?{...this.values}:{}}toISO(){if(!this.isValid)return null;let e="P";return 0!==this.years&&(e+=this.years+"Y"),0===this.months&&0===this.quarters||(e+=this.months+3*this.quarters+"M"),0!==this.weeks&&(e+=this.weeks+"W"),0!==this.days&&(e+=this.days+"D"),0===this.hours&&0===this.minutes&&0===this.seconds&&0===this.milliseconds||(e+="T"),0!==this.hours&&(e+=this.hours+"H"),0!==this.minutes&&(e+=this.minutes+"M"),0===this.seconds&&0===this.milliseconds||(e+=It(this.seconds+this.milliseconds/1e3,3)+"S"),"P"===e&&(e+="T0S"),e}toISOTime(e={}){if(!this.isValid)return null;const t=this.toMillis();if(t<0||t>=864e5)return null;e={suppressMilliseconds:!1,suppressSeconds:!1,includePrefix:!1,format:"extended",...e,includeOffset:!1};return ni.fromMillis(t,{zone:"UTC"}).toISOTime(e)}toJSON(){return this.toISO()}toString(){return this.toISO()}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Duration { values: ${JSON.stringify(this.values)} }`:`Duration { Invalid, reason: ${this.invalidReason} }`}toMillis(){return this.isValid?sr(this.matrix,this.values):NaN}valueOf(){return this.toMillis()}plus(e){if(!this.isValid)return this;const t=dr.fromDurationLike(e),n={};for(const r of rr)(Tt(t.values,r)||Tt(this.values,r))&&(n[r]=t.get(r)+this.get(r));return ar(this,{values:n},!0)}minus(e){if(!this.isValid)return this;const t=dr.fromDurationLike(e);return this.plus(t.negate())}mapUnits(e){if(!this.isValid)return this;const t={};for(const n of Object.keys(this.values))t[n]=Ut(e(this.values[n],n));return ar(this,{values:t},!0)}get(e){return this[dr.normalizeUnit(e)]}set(e){if(!this.isValid)return this;return ar(this,{values:{...this.values,...Zt(e,dr.normalizeUnit)}})}reconfigure({locale:e,numberingSystem:t,conversionAccuracy:n,matrix:r}={}){return ar(this,{loc:this.loc.clone({locale:e,numberingSystem:t}),matrix:r,conversionAccuracy:n})}as(e){return this.isValid?this.shiftTo(e).get(e):NaN}normalize(){if(!this.isValid)return this;const e=this.toObject();return or(this.matrix,e),ar(this,{values:e},!0)}rescale(){if(!this.isValid)return this;return ar(this,{values:lr(this.normalize().shiftToAll().toObject())},!0)}shiftTo(...e){if(!this.isValid)return this;if(0===e.length)return this;e=e.map(e=>dr.normalizeUnit(e));const t={},n={},r=this.toObject();let i;for(const a of rr)if(e.indexOf(a)>=0){i=a;let e=0;for(const t in n)e+=this.matrix[t][a]*n[t],n[t]=0;kt(r[a])&&(e+=r[a]);const s=Math.trunc(e);t[a]=s,n[a]=(1e3*e-1e3*s)/1e3}else kt(r[a])&&(n[a]=r[a]);for(const a in n)0!==n[a]&&(t[i]+=a===i?n[a]:n[a]/this.matrix[i][a]);return or(this.matrix,t),ar(this,{values:t},!0)}shiftToAll(){return this.isValid?this.shiftTo("years","months","weeks","days","hours","minutes","seconds","milliseconds"):this}negate(){if(!this.isValid)return this;const e={};for(const t of Object.keys(this.values))e[t]=0===this.values[t]?0:-this.values[t];return ar(this,{values:e},!0)}removeZeros(){if(!this.isValid)return this;return ar(this,{values:lr(this.values)},!0)}get years(){return this.isValid?this.values.years||0:NaN}get quarters(){return this.isValid?this.values.quarters||0:NaN}get months(){return this.isValid?this.values.months||0:NaN}get weeks(){return this.isValid?this.values.weeks||0:NaN}get days(){return this.isValid?this.values.days||0:NaN}get hours(){return this.isValid?this.values.hours||0:NaN}get minutes(){return this.isValid?this.values.minutes||0:NaN}get seconds(){return this.isValid?this.values.seconds||0:NaN}get milliseconds(){return this.isValid?this.values.milliseconds||0:NaN}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}equals(e){if(!this.isValid||!e.isValid)return!1;if(!this.loc.equals(e.loc))return!1;function t(e,t){return void 0===e||0===e?void 0===t||0===t:e===t}for(const n of rr)if(!t(this.values[n],e.values[n]))return!1;return!0}}const ur="Invalid Interval";class cr{constructor(e){this.s=e.start,this.e=e.end,this.invalid=e.invalid||null,this.isLuxonInterval=!0}static invalid(e,t=null){if(!e)throw new P("need to specify a reason the Interval is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new Y(n);return new cr({invalid:n})}static fromDateTimes(e,t){const n=ri(e),r=ri(t),i=function(e,t){return e&&e.isValid?t&&t.isValid?t<e?cr.invalid("end before start",`The end of an interval must be after its start, but you had start=${e.toISO()} and end=${t.toISO()}`):null:cr.invalid("missing or invalid end"):cr.invalid("missing or invalid start")}(n,r);return i??new cr({start:n,end:r})}static after(e,t){const n=dr.fromDurationLike(t),r=ri(e);return cr.fromDateTimes(r,r.plus(n))}static before(e,t){const n=dr.fromDurationLike(t),r=ri(e);return cr.fromDateTimes(r.minus(n),r)}static fromISO(e,t){const[n,r]=(e||"").split("/",2);if(n&&r){let e,a,s,o;try{e=ni.fromISO(n,t),a=e.isValid}catch(i){a=!1}try{s=ni.fromISO(r,t),o=s.isValid}catch(i){o=!1}if(a&&o)return cr.fromDateTimes(e,s);if(a){const n=dr.fromISO(r,t);if(n.isValid)return cr.after(e,n)}else if(o){const e=dr.fromISO(n,t);if(e.isValid)return cr.before(s,e)}}return cr.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static isInterval(e){return e&&e.isLuxonInterval||!1}get start(){return this.isValid?this.s:null}get end(){return this.isValid?this.e:null}get lastDateTime(){return this.isValid&&this.e?this.e.minus(1):null}get isValid(){return null===this.invalidReason}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}length(e="milliseconds"){return this.isValid?this.toDuration(e).get(e):NaN}count(e="milliseconds",t){if(!this.isValid)return NaN;const n=this.start.startOf(e,t);let r;return r=t?.useLocaleWeeks?this.end.reconfigure({locale:n.locale}):this.end,r=r.startOf(e,t),Math.floor(r.diff(n,e).get(e))+(r.valueOf()!==this.end.valueOf())}hasSame(e){return!!this.isValid&&(this.isEmpty()||this.e.minus(1).hasSame(this.s,e))}isEmpty(){return this.s.valueOf()===this.e.valueOf()}isAfter(e){return!!this.isValid&&this.s>e}isBefore(e){return!!this.isValid&&this.e<=e}contains(e){return!!this.isValid&&(this.s<=e&&this.e>e)}set({start:e,end:t}={}){return this.isValid?cr.fromDateTimes(e||this.s,t||this.e):this}splitAt(...e){if(!this.isValid)return[];const t=e.map(ri).filter(e=>this.contains(e)).sort((e,t)=>e.toMillis()-t.toMillis()),n=[];let{s:r}=this,i=0;for(;r<this.e;){const e=t[i]||this.e,a=+e>+this.e?this.e:e;n.push(cr.fromDateTimes(r,a)),r=a,i+=1}return n}splitBy(e){const t=dr.fromDurationLike(e);if(!this.isValid||!t.isValid||0===t.as("milliseconds"))return[];let n,{s:r}=this,i=1;const a=[];for(;r<this.e;){const e=this.start.plus(t.mapUnits(e=>e*i));n=+e>+this.e?this.e:e,a.push(cr.fromDateTimes(r,n)),r=n,i+=1}return a}divideEqually(e){return this.isValid?this.splitBy(this.length()/e).slice(0,e):[]}overlaps(e){return this.e>e.s&&this.s<e.e}abutsStart(e){return!!this.isValid&&+this.e===+e.s}abutsEnd(e){return!!this.isValid&&+e.e===+this.s}engulfs(e){return!!this.isValid&&(this.s<=e.s&&this.e>=e.e)}equals(e){return!(!this.isValid||!e.isValid)&&(this.s.equals(e.s)&&this.e.equals(e.e))}intersection(e){if(!this.isValid)return this;const t=this.s>e.s?this.s:e.s,n=this.e<e.e?this.e:e.e;return t>=n?null:cr.fromDateTimes(t,n)}union(e){if(!this.isValid)return this;const t=this.s<e.s?this.s:e.s,n=this.e>e.e?this.e:e.e;return cr.fromDateTimes(t,n)}static merge(e){const[t,n]=e.sort((e,t)=>e.s-t.s).reduce(([e,t],n)=>t?t.overlaps(n)||t.abutsStart(n)?[e,t.union(n)]:[e.concat([t]),n]:[e,n],[[],null]);return n&&t.push(n),t}static xor(e){let t=null,n=0;const r=[],i=e.map(e=>[{time:e.s,type:"s"},{time:e.e,type:"e"}]),a=Array.prototype.concat(...i).sort((e,t)=>e.time-t.time);for(const s of a)n+="s"===s.type?1:-1,1===n?t=s.time:(t&&+t!==+s.time&&r.push(cr.fromDateTimes(t,s.time)),t=null);return cr.merge(r)}difference(...e){return cr.xor([this].concat(e)).map(e=>this.intersection(e)).filter(e=>e&&!e.isEmpty())}toString(){return this.isValid?`[${this.s.toISO()} – ${this.e.toISO()})`:ur}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`:`Interval { Invalid, reason: ${this.invalidReason} }`}toLocaleString(e=J,t={}){return this.isValid?dn.create(this.s.loc.clone(t),e).formatInterval(this):ur}toISO(e){return this.isValid?`${this.s.toISO(e)}/${this.e.toISO(e)}`:ur}toISODate(){return this.isValid?`${this.s.toISODate()}/${this.e.toISODate()}`:ur}toISOTime(e){return this.isValid?`${this.s.toISOTime(e)}/${this.e.toISOTime(e)}`:ur}toFormat(e,{separator:t=" – "}={}){return this.isValid?`${this.s.toFormat(e)}${t}${this.e.toFormat(e)}`:ur}toDuration(e,t){return this.isValid?this.e.diff(this.s,e,t):dr.invalid(this.invalidReason)}mapEndpoints(e){return cr.fromDateTimes(e(this.s),e(this.e))}}class hr{static hasDST(e=it.defaultZone){const t=ni.now().setZone(e).set({month:12});return!e.isUniversal&&t.offset!==t.set({month:6}).offset}static isValidIANAZone(e){return Ee.isValidZone(e)}static normalizeZone(e){return Ze(e,it.defaultZone)}static getStartOfWeek({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getStartOfWeek()}static getMinimumDaysInFirstWeek({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getMinDaysInFirstWeek()}static getWeekendWeekdays({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getWeekendDays().slice()}static months(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:i="gregory"}={}){return(r||je.create(t,n,i)).months(e)}static monthsFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:i="gregory"}={}){return(r||je.create(t,n,i)).months(e,!0)}static weekdays(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||je.create(t,n,null)).weekdays(e)}static weekdaysFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||je.create(t,n,null)).weekdays(e,!0)}static meridiems({locale:e=null}={}){return je.create(e).meridiems()}static eras(e="short",{locale:t=null}={}){return je.create(t,null,"gregory").eras(e)}static features(){return{relative:St(),localeWeek:xt()}}}function mr(e,t){const n=e=>e.toUTC(0,{keepLocalTime:!0}).startOf("day").valueOf(),r=n(t)-n(e);return Math.floor(dr.fromMillis(r).as("days"))}function fr(e,t,n,r){let[i,a,s,o]=function(e,t,n){const r=[["years",(e,t)=>t.year-e.year],["quarters",(e,t)=>t.quarter-e.quarter+4*(t.year-e.year)],["months",(e,t)=>t.month-e.month+12*(t.year-e.year)],["weeks",(e,t)=>{const n=mr(e,t);return(n-n%7)/7}],["days",mr]],i={},a=e;let s,o;for(const[l,d]of r)n.indexOf(l)>=0&&(s=l,i[l]=d(e,t),o=a.plus(i),o>t?(i[l]--,(e=a.plus(i))>t&&(o=e,i[l]--,e=a.plus(i))):e=o);return[e,i,o,s]}(e,t,n);const l=t-i,d=n.filter(e=>["hours","minutes","seconds","milliseconds"].indexOf(e)>=0);0===d.length&&(s<t&&(s=i.plus({[o]:1})),s!==i&&(a[o]=(a[o]||0)+l/(s-i)));const u=dr.fromObject(a,r);return d.length>0?dr.fromMillis(l,r).shiftTo(...d).plus(u):u}function yr(e,t=e=>e){return{regex:e,deser:([e])=>t(function(e){let t=parseInt(e,10);if(isNaN(t)){t="";for(let n=0;n<e.length;n++){const r=e.charCodeAt(n);if(-1!==e[n].search(qe.hanidec))t+=He.indexOf(e[n]);else for(const e in Pe){const[n,i]=Pe[e];r>=n&&r<=i&&(t+=r-n)}}return parseInt(t,10)}return t}(e))}}const gr=`[ ${String.fromCharCode(160)}]`,pr=new RegExp(gr,"g");function vr(e){return e.replace(/\./g,"\\.?").replace(pr,gr)}function wr(e){return e.replace(/\./g,"").replace(pr," ").toLowerCase()}function br(e,t){return null===e?null:{regex:RegExp(e.map(vr).join("|")),deser:([n])=>e.findIndex(e=>wr(n)===wr(e))+t}}function kr(e,t){return{regex:e,deser:([,e,t])=>Yt(e,t),groups:t}}function Dr(e){return{regex:e,deser:([e])=>e}}const Sr={year:{"2-digit":"yy",numeric:"yyyyy"},month:{numeric:"M","2-digit":"MM",short:"MMM",long:"MMMM"},day:{numeric:"d","2-digit":"dd"},weekday:{short:"EEE",long:"EEEE"},dayperiod:"a",dayPeriod:"a",hour12:{numeric:"h","2-digit":"hh"},hour24:{numeric:"H","2-digit":"HH"},minute:{numeric:"m","2-digit":"mm"},second:{numeric:"s","2-digit":"ss"},timeZoneName:{long:"ZZZZZ",short:"ZZZ"}};let xr=null;function Er(e,t){return Array.prototype.concat(...e.map(e=>function(e,t){if(e.literal)return e;const n=Mr(dn.macroTokenToFormatOpts(e.val),t);return null==n||n.includes(void 0)?e:n}(e,t)))}class Tr{constructor(e,t){if(this.locale=e,this.format=t,this.tokens=Er(dn.parseFormat(t),e),this.units=this.tokens.map(t=>function(e,t){const n=Ge(t),r=Ge(t,"{2}"),i=Ge(t,"{3}"),a=Ge(t,"{4}"),s=Ge(t,"{6}"),o=Ge(t,"{1,2}"),l=Ge(t,"{1,3}"),d=Ge(t,"{1,6}"),u=Ge(t,"{1,9}"),c=Ge(t,"{2,4}"),h=Ge(t,"{4,6}"),m=e=>{return{regex:RegExp((t=e.val,t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&"))),deser:([e])=>e,literal:!0};var t},f=(f=>{if(e.literal)return m(f);switch(f.val){case"G":return br(t.eras("short"),0);case"GG":return br(t.eras("long"),0);case"y":return yr(d);case"yy":case"kk":return yr(c,jt);case"yyyy":case"kkkk":return yr(a);case"yyyyy":return yr(h);case"yyyyyy":return yr(s);case"M":case"L":case"d":case"H":case"h":case"m":case"q":case"s":case"W":return yr(o);case"MM":case"LL":case"dd":case"HH":case"hh":case"mm":case"qq":case"ss":case"WW":return yr(r);case"MMM":return br(t.months("short",!0),1);case"MMMM":return br(t.months("long",!0),1);case"LLL":return br(t.months("short",!1),1);case"LLLL":return br(t.months("long",!1),1);case"o":case"S":return yr(l);case"ooo":case"SSS":return yr(i);case"u":return Dr(u);case"uu":return Dr(o);case"uuu":case"E":case"c":return yr(n);case"a":return br(t.meridiems(),0);case"EEE":return br(t.weekdays("short",!1),1);case"EEEE":return br(t.weekdays("long",!1),1);case"ccc":return br(t.weekdays("short",!0),1);case"cccc":return br(t.weekdays("long",!0),1);case"Z":case"ZZ":return kr(new RegExp(`([+-]${o.source})(?::(${r.source}))?`),2);case"ZZZ":return kr(new RegExp(`([+-]${o.source})(${r.source})?`),2);case"z":return Dr(/[a-z_+-/]{1,256}?/i);case" ":return Dr(/[^\S\n\r]/);default:return m(f)}})(e)||{invalidReason:"missing Intl.DateTimeFormat.formatToParts support"};return f.token=e,f}(t,e)),this.disqualifyingUnit=this.units.find(e=>e.invalidReason),!this.disqualifyingUnit){const[e,t]=[`^${(n=this.units).map(e=>e.regex).reduce((e,t)=>`${e}(${t.source})`,"")}$`,n];this.regex=RegExp(e,"i"),this.handlers=t}var n}explainFromTokens(e){if(this.isValid){const[t,n]=function(e,t,n){const r=e.match(t);if(r){const e={};let t=1;for(const i in n)if(Tt(n,i)){const a=n[i],s=a.groups?a.groups+1:1;!a.literal&&a.token&&(e[a.token.val[0]]=a.deser(r.slice(t,t+s))),t+=s}return[r,e]}return[r,{}]}(e,this.regex,this.handlers),[r,i,a]=n?function(e){let t,n=null;return bt(e.z)||(n=Ee.create(e.z)),bt(e.Z)||(n||(n=new Ye(e.Z)),t=e.Z),bt(e.q)||(e.M=3*(e.q-1)+1),bt(e.h)||(e.h<12&&1===e.a?e.h+=12:12===e.h&&0===e.a&&(e.h=0)),0===e.G&&e.y&&(e.y=-e.y),bt(e.u)||(e.S=_t(e.u)),[Object.keys(e).reduce((t,n)=>{const r=(e=>{switch(e){case"S":return"millisecond";case"s":return"second";case"m":return"minute";case"h":case"H":return"hour";case"d":return"day";case"o":return"ordinal";case"L":case"M":return"month";case"y":return"year";case"E":case"c":return"weekday";case"W":return"weekNumber";case"k":return"weekYear";case"q":return"quarter";default:return null}})(n);return r&&(t[r]=e[n]),t},{}),n,t]}(n):[null,null,void 0];if(Tt(n,"a")&&Tt(n,"H"))throw new Z("Can't include meridiem when specifying 24-hour format");return{input:e,tokens:this.tokens,regex:this.regex,rawMatches:t,matches:n,result:r,zone:i,specificOffset:a}}return{input:e,tokens:this.tokens,invalidReason:this.invalidReason}}get isValid(){return!this.disqualifyingUnit}get invalidReason(){return this.disqualifyingUnit?this.disqualifyingUnit.invalidReason:null}}function $r(e,t,n){return new Tr(e,n).explainFromTokens(t)}function Mr(e,t){if(!e)return null;const n=dn.create(t,e).dtFormatter((xr||(xr=ni.fromMillis(1555555555555)),xr)),r=n.formatToParts(),i=n.resolvedOptions();return r.map(t=>function(e,t,n){const{type:r,value:i}=e;if("literal"===r){const e=/^\s+$/.test(i);return{literal:!e,val:e?" ":i}}const a=t[r];let s=r;"hour"===r&&(s=null!=t.hour12?t.hour12?"hour12":"hour24":null!=t.hourCycle?"h11"===t.hourCycle||"h12"===t.hourCycle?"hour12":"hour24":n.hour12?"hour12":"hour24");let o=Sr[s];if("object"==typeof o&&(o=o[a]),o)return{literal:!1,val:o}}(t,e,i))}const Or="Invalid DateTime",Nr=864e13;function Cr(e){return new at("unsupported zone",`the zone "${e.name}" is not supported`)}function _r(e){return null===e.weekData&&(e.weekData=mt(e.c)),e.weekData}function Ir(e){return null===e.localWeekData&&(e.localWeekData=mt(e.c,e.loc.getMinDaysInFirstWeek(),e.loc.getStartOfWeek())),e.localWeekData}function Ar(e,t){const n={ts:e.ts,zone:e.zone,c:e.c,o:e.o,loc:e.loc,invalid:e.invalid};return new ni({...n,...t,old:n})}function Lr(e,t,n){let r=e-60*t*1e3;const i=n.offset(r);if(t===i)return[r,t];r-=60*(i-t)*1e3;const a=n.offset(r);return i===a?[r,i]:[e-60*Math.min(i,a)*1e3,Math.max(i,a)]}function Rr(e,t){const n=new Date(e+=60*t*1e3);return{year:n.getUTCFullYear(),month:n.getUTCMonth()+1,day:n.getUTCDate(),hour:n.getUTCHours(),minute:n.getUTCMinutes(),second:n.getUTCSeconds(),millisecond:n.getUTCMilliseconds()}}function zr(e,t,n){return Lr(zt(e),t,n)}function Fr(e,t){const n=e.o,r=e.c.year+Math.trunc(t.years),i=e.c.month+Math.trunc(t.months)+3*Math.trunc(t.quarters),a={...e.c,year:r,month:i,day:Math.min(e.c.day,Rt(r,i))+Math.trunc(t.days)+7*Math.trunc(t.weeks)},s=dr.fromObject({years:t.years-Math.trunc(t.years),quarters:t.quarters-Math.trunc(t.quarters),months:t.months-Math.trunc(t.months),weeks:t.weeks-Math.trunc(t.weeks),days:t.days-Math.trunc(t.days),hours:t.hours,minutes:t.minutes,seconds:t.seconds,milliseconds:t.milliseconds}).as("milliseconds"),o=zt(a);let[l,d]=Lr(o,n,e.zone);return 0!==s&&(l+=s,d=e.zone.offset(l)),{ts:l,o:d}}function Vr(e,t,n,r,i,a){const{setZone:s,zone:o}=n;if(e&&0!==Object.keys(e).length||t){const r=t||o,i=ni.fromObject(e,{...n,zone:r,specificOffset:a});return s?i:i.setZone(o)}return ni.invalid(new at("unparsable",`the input "${i}" can't be parsed as ${r}`))}function jr(e,t,n=!0){return e.isValid?dn.create(je.create("en-US"),{allowZ:n,forceSimple:!0}).formatDateTimeFromString(e,t):null}function Wr(e,t,n){const r=e.c.year>9999||e.c.year<0;let i="";if(r&&e.c.year>=0&&(i+="+"),i+=Ot(e.c.year,r?6:4),"year"===n)return i;if(t){if(i+="-",i+=Ot(e.c.month),"month"===n)return i;i+="-"}else if(i+=Ot(e.c.month),"month"===n)return i;return i+=Ot(e.c.day),i}function Yr(e,t,n,r,i,a,s){let o=!n||0!==e.c.millisecond||0!==e.c.second,l="";switch(s){case"day":case"month":case"year":break;default:if(l+=Ot(e.c.hour),"hour"===s)break;if(t){if(l+=":",l+=Ot(e.c.minute),"minute"===s)break;o&&(l+=":",l+=Ot(e.c.second))}else{if(l+=Ot(e.c.minute),"minute"===s)break;o&&(l+=Ot(e.c.second))}if("second"===s)break;!o||r&&0===e.c.millisecond||(l+=".",l+=Ot(e.c.millisecond,3))}return i&&(e.isOffsetFixed&&0===e.offset&&!a?l+="Z":e.o<0?(l+="-",l+=Ot(Math.trunc(-e.o/60)),l+=":",l+=Ot(Math.trunc(-e.o%60))):(l+="+",l+=Ot(Math.trunc(e.o/60)),l+=":",l+=Ot(Math.trunc(e.o%60)))),a&&(l+="["+e.zone.ianaName+"]"),l}const Ur={month:1,day:1,hour:0,minute:0,second:0,millisecond:0},Zr={weekNumber:1,weekday:1,hour:0,minute:0,second:0,millisecond:0},qr={ordinal:1,hour:0,minute:0,second:0,millisecond:0},Pr=["year","month","day","hour","minute","second","millisecond"],Hr=["weekYear","weekNumber","weekday","hour","minute","second","millisecond"],Br=["year","ordinal","hour","minute","second","millisecond"];function Gr(e){const t={year:"year",years:"year",month:"month",months:"month",day:"day",days:"day",hour:"hour",hours:"hour",minute:"minute",minutes:"minute",quarter:"quarter",quarters:"quarter",second:"second",seconds:"second",millisecond:"millisecond",milliseconds:"millisecond",weekday:"weekday",weekdays:"weekday",weeknumber:"weekNumber",weeksnumber:"weekNumber",weeknumbers:"weekNumber",weekyear:"weekYear",weekyears:"weekYear",ordinal:"ordinal"}[e.toLowerCase()];if(!t)throw new q(e);return t}function Kr(e){switch(e.toLowerCase()){case"localweekday":case"localweekdays":return"localWeekday";case"localweeknumber":case"localweeknumbers":return"localWeekNumber";case"localweekyear":case"localweekyears":return"localWeekYear";default:return Gr(e)}}function Jr(e,t){const n=Ze(t.zone,it.defaultZone);if(!n.isValid)return ni.invalid(Cr(n));const r=je.fromObject(t);let i,a;if(bt(e.year))i=it.now();else{for(const n of Pr)bt(e[n])&&(e[n]=Ur[n]);const t=vt(e)||wt(e);if(t)return ni.invalid(t);const r=function(e){if(void 0===ei&&(ei=it.now()),"iana"!==e.type)return e.offset(ei);const t=e.name;let n=ti.get(t);return void 0===n&&(n=e.offset(ei),ti.set(t,n)),n}(n);[i,a]=zr(e,r,n)}return new ni({ts:i,zone:n,loc:r,o:a})}function Qr(e,t,n){const r=!!bt(n.round)||n.round,i=bt(n.rounding)?"trunc":n.rounding,a=(e,a)=>{e=It(e,r||n.calendary?0:2,n.calendary?"round":i);return t.loc.clone(n).relFormatter(n).format(e,a)},s=r=>n.calendary?t.hasSame(e,r)?0:t.startOf(r).diff(e.startOf(r),r).get(r):t.diff(e,r).get(r);if(n.unit)return a(s(n.unit),n.unit);for(const o of n.units){const e=s(o);if(Math.abs(e)>=1)return a(e,o)}return a(e>t?-0:0,n.units[n.units.length-1])}function Xr(e){let t,n={};return e.length>0&&"object"==typeof e[e.length-1]?(n=e[e.length-1],t=Array.from(e).slice(0,e.length-1)):t=Array.from(e),[n,t]}let ei;const ti=/* @__PURE__ */new Map;class ni{constructor(e){const t=e.zone||it.defaultZone;let n=e.invalid||(Number.isNaN(e.ts)?new at("invalid input"):null)||(t.isValid?null:Cr(t));this.ts=bt(e.ts)?it.now():e.ts;let r=null,i=null;if(!n){if(e.old&&e.old.ts===this.ts&&e.old.zone.equals(t))[r,i]=[e.old.c,e.old.o];else{const a=kt(e.o)&&!e.old?e.o:t.offset(this.ts);r=Rr(this.ts,a),n=Number.isNaN(r.year)?new at("invalid input"):null,r=n?null:r,i=n?null:a}}this._zone=t,this.loc=e.loc||je.create(),this.invalid=n,this.weekData=null,this.localWeekData=null,this.c=r,this.o=i,this.isLuxonDateTime=!0}static now(){return new ni({})}static local(){const[e,t]=Xr(arguments),[n,r,i,a,s,o,l]=t;return Jr({year:n,month:r,day:i,hour:a,minute:s,second:o,millisecond:l},e)}static utc(){const[e,t]=Xr(arguments),[n,r,i,a,s,o,l]=t;return e.zone=Ye.utcInstance,Jr({year:n,month:r,day:i,hour:a,minute:s,second:o,millisecond:l},e)}static fromJSDate(e,t={}){const n=(r=e,"[object Date]"===Object.prototype.toString.call(r)?e.valueOf():NaN);var r;if(Number.isNaN(n))return ni.invalid("invalid input");const i=Ze(t.zone,it.defaultZone);return i.isValid?new ni({ts:n,zone:i,loc:je.fromObject(t)}):ni.invalid(Cr(i))}static fromMillis(e,t={}){if(kt(e))return e<-Nr||e>Nr?ni.invalid("Timestamp out of range"):new ni({ts:e,zone:Ze(t.zone,it.defaultZone),loc:je.fromObject(t)});throw new P(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`)}static fromSeconds(e,t={}){if(kt(e))return new ni({ts:1e3*e,zone:Ze(t.zone,it.defaultZone),loc:je.fromObject(t)});throw new P("fromSeconds requires a numerical input")}static fromObject(e,t={}){e=e||{};const n=Ze(t.zone,it.defaultZone);if(!n.isValid)return ni.invalid(Cr(n));const r=je.fromObject(t),i=Zt(e,Kr),{minDaysInFirstWeek:a,startOfWeek:s}=pt(i,r),o=it.now(),l=bt(t.specificOffset)?n.offset(o):t.specificOffset,d=!bt(i.ordinal),u=!bt(i.year),c=!bt(i.month)||!bt(i.day),h=u||c,m=i.weekYear||i.weekNumber;if((h||d)&&m)throw new Z("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(c&&d)throw new Z("Can't mix ordinal dates with month/day");const f=m||i.weekday&&!h;let y,g,p=Rr(o,l);f?(y=Hr,g=Zr,p=mt(p,a,s)):d?(y=Br,g=qr,p=yt(p)):(y=Pr,g=Ur);let v=!1;for(const E of y){bt(i[E])?i[E]=v?g[E]:p[E]:v=!0}const w=f?function(e,t=4,n=1){const r=Dt(e.weekYear),i=Mt(e.weekNumber,1,Vt(e.weekYear,t,n)),a=Mt(e.weekday,1,7);return r?i?!a&&lt("weekday",e.weekday):lt("week",e.weekNumber):lt("weekYear",e.weekYear)}(i,a,s):d?function(e){const t=Dt(e.year),n=Mt(e.ordinal,1,Lt(e.year));return t?!n&&lt("ordinal",e.ordinal):lt("year",e.year)}(i):vt(i),b=w||wt(i);if(b)return ni.invalid(b);const k=f?ft(i,a,s):d?gt(i):i,[D,S]=zr(k,l,n),x=new ni({ts:D,zone:n,o:S,loc:r});return i.weekday&&h&&e.weekday!==x.weekday?ni.invalid("mismatched weekday",`you can't specify both a weekday of ${i.weekday} and a date of ${x.toISO()}`):x.isValid?x:ni.invalid(x.invalid)}static fromISO(e,t={}){const[n,r]=mn(e,[Vn,Un],[jn,Zn],[Wn,qn],[Yn,Pn]);return Vr(n,r,t,"ISO 8601",e)}static fromRFC2822(e,t={}){const[n,r]=mn(function(e){return e.replace(/\([^()]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").trim()}(e),[_n,In]);return Vr(n,r,t,"RFC 2822",e)}static fromHTTP(e,t={}){const[n,r]=mn(e,[An,zn],[Ln,zn],[Rn,Fn]);return Vr(n,r,t,"HTTP",t)}static fromFormat(e,t,n={}){if(bt(e)||bt(t))throw new P("fromFormat requires an input string and a format");const{locale:r=null,numberingSystem:i=null}=n,a=je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0}),[s,o,l,d]=function(e,t,n){const{result:r,zone:i,specificOffset:a,invalidReason:s}=$r(e,t,n);return[r,i,a,s]}(a,e,t);return d?ni.invalid(d):Vr(s,o,n,`format ${t}`,e,l)}static fromString(e,t,n={}){return ni.fromFormat(e,t,n)}static fromSQL(e,t={}){const[n,r]=mn(e,[Bn,Un],[Gn,Kn]);return Vr(n,r,t,"SQL",e)}static invalid(e,t=null){if(!e)throw new P("need to specify a reason the DateTime is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new W(n);return new ni({invalid:n})}static isDateTime(e){return e&&e.isLuxonDateTime||!1}static parseFormatForOpts(e,t={}){const n=Mr(e,je.fromObject(t));return n?n.map(e=>e?e.val:null).join(""):null}static expandFormat(e,t={}){return Er(dn.parseFormat(e),je.fromObject(t)).map(e=>e.val).join("")}static resetCache(){ei=void 0,ti.clear()}get(e){return this[e]}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}get outputCalendar(){return this.isValid?this.loc.outputCalendar:null}get zone(){return this._zone}get zoneName(){return this.isValid?this.zone.name:null}get year(){return this.isValid?this.c.year:NaN}get quarter(){return this.isValid?Math.ceil(this.c.month/3):NaN}get month(){return this.isValid?this.c.month:NaN}get day(){return this.isValid?this.c.day:NaN}get hour(){return this.isValid?this.c.hour:NaN}get minute(){return this.isValid?this.c.minute:NaN}get second(){return this.isValid?this.c.second:NaN}get millisecond(){return this.isValid?this.c.millisecond:NaN}get weekYear(){return this.isValid?_r(this).weekYear:NaN}get weekNumber(){return this.isValid?_r(this).weekNumber:NaN}get weekday(){return this.isValid?_r(this).weekday:NaN}get isWeekend(){return this.isValid&&this.loc.getWeekendDays().includes(this.weekday)}get localWeekday(){return this.isValid?Ir(this).weekday:NaN}get localWeekNumber(){return this.isValid?Ir(this).weekNumber:NaN}get localWeekYear(){return this.isValid?Ir(this).weekYear:NaN}get ordinal(){return this.isValid?yt(this.c).ordinal:NaN}get monthShort(){return this.isValid?hr.months("short",{locObj:this.loc})[this.month-1]:null}get monthLong(){return this.isValid?hr.months("long",{locObj:this.loc})[this.month-1]:null}get weekdayShort(){return this.isValid?hr.weekdays("short",{locObj:this.loc})[this.weekday-1]:null}get weekdayLong(){return this.isValid?hr.weekdays("long",{locObj:this.loc})[this.weekday-1]:null}get offset(){return this.isValid?+this.o:NaN}get offsetNameShort(){return this.isValid?this.zone.offsetName(this.ts,{format:"short",locale:this.locale}):null}get offsetNameLong(){return this.isValid?this.zone.offsetName(this.ts,{format:"long",locale:this.locale}):null}get isOffsetFixed(){return this.isValid?this.zone.isUniversal:null}get isInDST(){return!this.isOffsetFixed&&(this.offset>this.set({month:1,day:1}).offset||this.offset>this.set({month:5}).offset)}getPossibleOffsets(){if(!this.isValid||this.isOffsetFixed)return[this];const e=864e5,t=6e4,n=zt(this.c),r=this.zone.offset(n-e),i=this.zone.offset(n+e),a=this.zone.offset(n-r*t),s=this.zone.offset(n-i*t);if(a===s)return[this];const o=n-a*t,l=n-s*t,d=Rr(o,a),u=Rr(l,s);return d.hour===u.hour&&d.minute===u.minute&&d.second===u.second&&d.millisecond===u.millisecond?[Ar(this,{ts:o}),Ar(this,{ts:l})]:[this]}get isInLeapYear(){return At(this.year)}get daysInMonth(){return Rt(this.year,this.month)}get daysInYear(){return this.isValid?Lt(this.year):NaN}get weeksInWeekYear(){return this.isValid?Vt(this.weekYear):NaN}get weeksInLocalWeekYear(){return this.isValid?Vt(this.localWeekYear,this.loc.getMinDaysInFirstWeek(),this.loc.getStartOfWeek()):NaN}resolvedLocaleOptions(e={}){const{locale:t,numberingSystem:n,calendar:r}=dn.create(this.loc.clone(e),e).resolvedOptions(this);return{locale:t,numberingSystem:n,outputCalendar:r}}toUTC(e=0,t={}){return this.setZone(Ye.instance(e),t)}toLocal(){return this.setZone(it.defaultZone)}setZone(e,{keepLocalTime:t=!1,keepCalendarTime:n=!1}={}){if((e=Ze(e,it.defaultZone)).equals(this.zone))return this;if(e.isValid){let r=this.ts;if(t||n){const t=e.offset(this.ts),n=this.toObject();[r]=zr(n,t,e)}return Ar(this,{ts:r,zone:e})}return ni.invalid(Cr(e))}reconfigure({locale:e,numberingSystem:t,outputCalendar:n}={}){return Ar(this,{loc:this.loc.clone({locale:e,numberingSystem:t,outputCalendar:n})})}setLocale(e){return this.reconfigure({locale:e})}set(e){if(!this.isValid)return this;const t=Zt(e,Kr),{minDaysInFirstWeek:n,startOfWeek:r}=pt(t,this.loc),i=!bt(t.weekYear)||!bt(t.weekNumber)||!bt(t.weekday),a=!bt(t.ordinal),s=!bt(t.year),o=!bt(t.month)||!bt(t.day),l=s||o,d=t.weekYear||t.weekNumber;if((l||a)&&d)throw new Z("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(o&&a)throw new Z("Can't mix ordinal dates with month/day");let u;i?u=ft({...mt(this.c,n,r),...t},n,r):bt(t.ordinal)?(u={...this.toObject(),...t},bt(t.day)&&(u.day=Math.min(Rt(u.year,u.month),u.day))):u=gt({...yt(this.c),...t});const[c,h]=zr(u,this.o,this.zone);return Ar(this,{ts:c,o:h})}plus(e){if(!this.isValid)return this;return Ar(this,Fr(this,dr.fromDurationLike(e)))}minus(e){if(!this.isValid)return this;return Ar(this,Fr(this,dr.fromDurationLike(e).negate()))}startOf(e,{useLocaleWeeks:t=!1}={}){if(!this.isValid)return this;const n={},r=dr.normalizeUnit(e);switch(r){case"years":n.month=1;case"quarters":case"months":n.day=1;case"weeks":case"days":n.hour=0;case"hours":n.minute=0;case"minutes":n.second=0;case"seconds":n.millisecond=0}if("weeks"===r)if(t){const e=this.loc.getStartOfWeek(),{weekday:t}=this;t<e&&(n.weekNumber=this.weekNumber-1),n.weekday=e}else n.weekday=1;if("quarters"===r){const e=Math.ceil(this.month/3);n.month=3*(e-1)+1}return this.set(n)}endOf(e,t){return this.isValid?this.plus({[e]:1}).startOf(e,t).minus(1):this}toFormat(e,t={}){return this.isValid?dn.create(this.loc.redefaultToEN(t)).formatDateTimeFromString(this,e):Or}toLocaleString(e=J,t={}){return this.isValid?dn.create(this.loc.clone(t),e).formatDateTime(this):Or}toLocaleParts(e={}){return this.isValid?dn.create(this.loc.clone(e),e).formatDateTimeParts(this):[]}toISO({format:e="extended",suppressSeconds:t=!1,suppressMilliseconds:n=!1,includeOffset:r=!0,extendedZone:i=!1,precision:a="milliseconds"}={}){if(!this.isValid)return null;const s="extended"===e;let o=Wr(this,s,a=Gr(a));return Pr.indexOf(a)>=3&&(o+="T"),o+=Yr(this,s,t,n,r,i,a),o}toISODate({format:e="extended",precision:t="day"}={}){return this.isValid?Wr(this,"extended"===e,Gr(t)):null}toISOWeekDate(){return jr(this,"kkkk-'W'WW-c")}toISOTime({suppressMilliseconds:e=!1,suppressSeconds:t=!1,includeOffset:n=!0,includePrefix:r=!1,extendedZone:i=!1,format:a="extended",precision:s="milliseconds"}={}){if(!this.isValid)return null;return s=Gr(s),(r&&Pr.indexOf(s)>=3?"T":"")+Yr(this,"extended"===a,t,e,n,i,s)}toRFC2822(){return jr(this,"EEE, dd LLL yyyy HH:mm:ss ZZZ",!1)}toHTTP(){return jr(this.toUTC(),"EEE, dd LLL yyyy HH:mm:ss 'GMT'")}toSQLDate(){return this.isValid?Wr(this,!0):null}toSQLTime({includeOffset:e=!0,includeZone:t=!1,includeOffsetSpace:n=!0}={}){let r="HH:mm:ss.SSS";return(t||e)&&(n&&(r+=" "),t?r+="z":e&&(r+="ZZ")),jr(this,r,!0)}toSQL(e={}){return this.isValid?`${this.toSQLDate()} ${this.toSQLTime(e)}`:null}toString(){return this.isValid?this.toISO():Or}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`:`DateTime { Invalid, reason: ${this.invalidReason} }`}valueOf(){return this.toMillis()}toMillis(){return this.isValid?this.ts:NaN}toSeconds(){return this.isValid?this.ts/1e3:NaN}toUnixInteger(){return this.isValid?Math.floor(this.ts/1e3):NaN}toJSON(){return this.toISO()}toBSON(){return this.toJSDate()}toObject(e={}){if(!this.isValid)return{};const t={...this.c};return e.includeConfig&&(t.outputCalendar=this.outputCalendar,t.numberingSystem=this.loc.numberingSystem,t.locale=this.loc.locale),t}toJSDate(){return new Date(this.isValid?this.ts:NaN)}diff(e,t="milliseconds",n={}){if(!this.isValid||!e.isValid)return dr.invalid("created by diffing an invalid DateTime");const r={locale:this.locale,numberingSystem:this.numberingSystem,...n},i=(o=t,Array.isArray(o)?o:[o]).map(dr.normalizeUnit),a=e.valueOf()>this.valueOf(),s=fr(a?this:e,a?e:this,i,r);var o;return a?s.negate():s}diffNow(e="milliseconds",t={}){return this.diff(ni.now(),e,t)}until(e){return this.isValid?cr.fromDateTimes(this,e):this}hasSame(e,t,n){if(!this.isValid)return!1;const r=e.valueOf(),i=this.setZone(e.zone,{keepLocalTime:!0});return i.startOf(t,n)<=r&&r<=i.endOf(t,n)}equals(e){return this.isValid&&e.isValid&&this.valueOf()===e.valueOf()&&this.zone.equals(e.zone)&&this.loc.equals(e.loc)}toRelative(e={}){if(!this.isValid)return null;const t=e.base||ni.fromObject({},{zone:this.zone}),n=e.padding?this<t?-e.padding:e.padding:0;let r=["years","months","days","hours","minutes","seconds"],i=e.unit;return Array.isArray(e.unit)&&(r=e.unit,i=void 0),Qr(t,this.plus(n),{...e,numeric:"always",units:r,unit:i})}toRelativeCalendar(e={}){return this.isValid?Qr(e.base||ni.fromObject({},{zone:this.zone}),this,{...e,numeric:"auto",units:["years","months","days"],calendary:!0}):null}static min(...e){if(!e.every(ni.isDateTime))throw new P("min requires all arguments be DateTimes");return Et(e,e=>e.valueOf(),Math.min)}static max(...e){if(!e.every(ni.isDateTime))throw new P("max requires all arguments be DateTimes");return Et(e,e=>e.valueOf(),Math.max)}static fromFormatExplain(e,t,n={}){const{locale:r=null,numberingSystem:i=null}=n;return $r(je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0}),e,t)}static fromStringExplain(e,t,n={}){return ni.fromFormatExplain(e,t,n)}static buildFormatParser(e,t={}){const{locale:n=null,numberingSystem:r=null}=t,i=je.fromOpts({locale:n,numberingSystem:r,defaultToEN:!0});return new Tr(i,e)}static fromFormatParser(e,t,n={}){if(bt(e)||bt(t))throw new P("fromFormatParser requires an input string and a format parser");const{locale:r=null,numberingSystem:i=null}=n,a=je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0});if(!a.equals(t.locale))throw new P(`fromFormatParser called with a locale of ${a}, but the format parser was created for ${t.locale}`);const{result:s,zone:o,specificOffset:l,invalidReason:d}=t.explainFromTokens(e);return d?ni.invalid(d):Vr(s,o,n,`format ${t.format}`,e,l)}static get DATE_SHORT(){return J}static get DATE_MED(){return Q}static get DATE_MED_WITH_WEEKDAY(){return X}static get DATE_FULL(){return ee}static get DATE_HUGE(){return te}static get TIME_SIMPLE(){return ne}static get TIME_WITH_SECONDS(){return re}static get TIME_WITH_SHORT_OFFSET(){return ie}static get TIME_WITH_LONG_OFFSET(){return ae}static get TIME_24_SIMPLE(){return se}static get TIME_24_WITH_SECONDS(){return oe}static get TIME_24_WITH_SHORT_OFFSET(){return le}static get TIME_24_WITH_LONG_OFFSET(){return de}static get DATETIME_SHORT(){return ue}static get DATETIME_SHORT_WITH_SECONDS(){return ce}static get DATETIME_MED(){return he}static get DATETIME_MED_WITH_SECONDS(){return me}static get DATETIME_MED_WITH_WEEKDAY(){return fe}static get DATETIME_FULL(){return ye}static get DATETIME_FULL_WITH_SECONDS(){return ge}static get DATETIME_HUGE(){return pe}static get DATETIME_HUGE_WITH_SECONDS(){return ve}}function ri(e){if(ni.isDateTime(e))return e;if(e&&e.valueOf&&kt(e.valueOf()))return ni.fromJSDate(e);if(e&&"object"==typeof e)return ni.fromObject(e);throw new P(`Unknown datetime argument: ${e}, of type ${typeof e}`)}function ii(e,t,n){let r=e.length-t.length;if(0===r)return e(...t);if(1===r)return function(e,t,n){let r=n=>e(n,...t);return void 0===n?r:Object.assign(r,{lazy:n,lazyArgs:t})}(e,t,n);throw Error("Wrong number of arguments")}const ai={done:!1,hasNext:!1};function si(e,...t){let n=e,r=t.map(e=>"lazy"in e?function(e){let{lazy:t,lazyArgs:n}=e,r=t(...n);return Object.assign(r,{isSingle:t.single??!1,index:0,items:[]})}(e):void 0),i=0;for(;i<t.length;){if(void 0===r[i]||!li(n)){n=(0,t[i])(n),i+=1;continue}let e=[];for(let n=i;n<t.length;n++){let t=r[n];if(void 0===t||(e.push(t),t.isSingle))break}let a=[];for(let t of n)if(oi(t,a,e))break;let{isSingle:s}=e.at(-1);n=s?a[0]:a,i+=e.length}return n}function oi(e,t,n){if(0===n.length)return t.push(e),!1;let r=e,i=ai,a=!1;for(let[s,o]of n.entries()){let{index:e,items:l}=o;if(l.push(r),i=o(r,e,l),o.index+=1,i.hasNext){if(i.hasMany){for(let e of i.next)if(oi(e,t,n.slice(s+1)))return!0;return a}r=i.next}if(!i.hasNext)break;i.done&&(a=!0)}return i.hasNext&&t.push(r),a}function li(e){return"string"==typeof e||"object"==typeof e&&!!e&&Symbol.iterator in e}const di={asc:(e,t)=>e>t,desc:(e,t)=>e<t};function ui(e,t){let[n,...r]=t;if(!function(e){if(hi(e))return!0;if("object"!=typeof e||!Array.isArray(e))return!1;let[t,n,...r]=e;return hi(t)&&"string"==typeof n&&n in di&&0===r.length}(n))return e(n,ci(...r));let i=ci(n,...r);return t=>e(t,i)}function ci(e,t,...n){let r="function"==typeof e?e:e[0],i="function"==typeof e?"asc":e[1],{[i]:a}=di,s=void 0===t?void 0:ci(t,...n);return(e,t)=>{let n=r(e),i=r(t);return a(n,i)?1:a(i,n)?-1:s?.(e,t)??0}}const hi=e=>"function"==typeof e&&1===e.length;function mi(...e){return ii(fi,e,yi)}const fi=(e,t)=>e.filter(t),yi=e=>(t,n,r)=>e(t,n,r)?{done:!1,hasNext:!0,next:t}:ai;function gi(...e){return ii(pi,e,vi)}const pi=(e,t)=>e.flatMap(t),vi=e=>(t,n,r)=>{let i=e(t,n,r);return Array.isArray(i)?{done:!1,hasNext:!0,hasMany:!0,next:i}:{done:!1,hasNext:!0,next:i}};const wi=(e,t)=>{let n=/* @__PURE__ */Object.create(null);for(let r=0;r<e.length;r++){let i=e[r],a=t(i,r,e);if(void 0!==a){let e=n[a];void 0===e?n[a]=[i]:e.push(i)}}return Object.setPrototypeOf(n,Object.prototype),n};function bi(e,t){if(e===t||Object.is(e,t))return!0;if("object"!=typeof e||"object"!=typeof t||null===e||null===t||Object.getPrototypeOf(e)!==Object.getPrototypeOf(t))return!1;if(Array.isArray(e))return function(e,t){if(e.length!==t.length)return!1;for(let[n,r]of e.entries())if(!bi(r,t[n]))return!1;return!0}(e,t);if(e instanceof Map)return function(e,t){if(e.size!==t.size)return!1;for(let[n,r]of e.entries())if(!t.has(n)||!bi(r,t.get(n)))return!1;return!0}(e,t);if(e instanceof Set)return function(e,t){if(e.size!==t.size)return!1;let n=[...t];for(let r of e){let e=!1;for(let[t,i]of n.entries())if(bi(r,i)){e=!0,n.splice(t,1);break}if(!e)return!1}return!0}(e,t);if(e instanceof Date)return e.getTime()===t.getTime();if(e instanceof RegExp)return e.toString()===t.toString();if(Object.keys(e).length!==Object.keys(t).length)return!1;for(let[n,r]of Object.entries(e))if(!(n in t)||!bi(r,t[n]))return!1;return!0}function ki(...e){return ii(Di,e,Si)}const Di=(e,t)=>e.map(t),Si=e=>(t,n,r)=>({done:!1,hasNext:!0,next:e(t,n,r)});function xi(...e){return ii(Ei,e)}const Ei=(e,t)=>({...e,...t});const Ti=(e,t,n)=>e.reduce(t,n);function $i(e,t){let n=[...e];return n.sort(t),n}const Mi=(e,t)=>[...e].sort(t),Oi=/* @__PURE__ */Symbol.for("@ts-pattern/matcher"),Ni=/* @__PURE__ */Symbol.for("@ts-pattern/isVariadic"),Ci="@ts-pattern/anonymous-select-key",_i=e=>Boolean(e&&"object"==typeof e),Ii=e=>e&&!!e[Oi],Ai=(e,t,n)=>{if(Ii(e)){const r=e[Oi](),{matched:i,selections:a}=r.match(t);return i&&a&&Object.keys(a).forEach(e=>n(e,a[e])),i}if(_i(e)){if(!_i(t))return!1;if(Array.isArray(e)){if(!Array.isArray(t))return!1;let r=[],i=[],a=[];for(const t of e.keys()){const n=e[t];Ii(n)&&n[Ni]?a.push(n):a.length?i.push(n):r.push(n)}if(a.length){if(a.length>1)throw new Error("Pattern error: Using `...P.array(...)` several times in a single pattern is not allowed.");if(t.length<r.length+i.length)return!1;const e=t.slice(0,r.length),s=0===i.length?[]:t.slice(-i.length),o=t.slice(r.length,0===i.length?1/0:-i.length);return r.every((t,r)=>Ai(t,e[r],n))&&i.every((e,t)=>Ai(e,s[t],n))&&(0===a.length||Ai(a[0],o,n))}return e.length===t.length&&e.every((e,r)=>Ai(e,t[r],n))}return Reflect.ownKeys(e).every(r=>{const i=e[r];return(r in t||Ii(a=i)&&"optional"===a[Oi]().matcherType)&&Ai(i,t[r],n);var a})}return Object.is(t,e)},Li=e=>{var t,n,r;return _i(e)?Ii(e)?null!=(t=null==(n=(r=e[Oi]()).getSelectionKeys)?void 0:n.call(r))?t:[]:Array.isArray(e)?Ri(e,Li):Ri(Object.values(e),Li):[]},Ri=(e,t)=>e.reduce((e,n)=>e.concat(t(n)),[]);function zi(e){return Object.assign(e,{optional:()=>{return t=e,zi({[Oi]:()=>({match:e=>{let n={};const r=(e,t)=>{n[e]=t};return void 0===e?(Li(t).forEach(e=>r(e,void 0)),{matched:!0,selections:n}):{matched:Ai(t,e,r),selections:n}},getSelectionKeys:()=>Li(t),matcherType:"optional"})});var t},and:t=>Fi(e,t),or:t=>function(...e){return zi({[Oi]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return Ri(e,Li).forEach(e=>r(e,void 0)),{matched:e.some(e=>Ai(e,t,r)),selections:n}},getSelectionKeys:()=>Ri(e,Li),matcherType:"or"})})}(e,t),select:t=>void 0===t?ji(e):ji(t,e)})}function Fi(...e){return zi({[Oi]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return{matched:e.every(e=>Ai(e,t,r)),selections:n}},getSelectionKeys:()=>Ri(e,Li),matcherType:"and"})})}function Vi(e){return{[Oi]:()=>({match:t=>({matched:Boolean(e(t))})})}}function ji(...e){const t="string"==typeof e[0]?e[0]:void 0,n=2===e.length?e[1]:"string"==typeof e[0]?void 0:e[0];return zi({[Oi]:()=>({match:e=>{let r={[null!=t?t:Ci]:e};return{matched:void 0===n||Ai(n,e,(e,t)=>{r[e]=t}),selections:r}},getSelectionKeys:()=>[null!=t?t:Ci].concat(void 0===n?[]:Li(n))})})}function Wi(e){return!0}function Yi(e){return"number"==typeof e}function Ui(e){return"string"==typeof e}function Zi(e){return"bigint"==typeof e}zi(Vi(Wi)),zi(Vi(Wi));const qi=e=>Object.assign(zi(e),{startsWith:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.startsWith(n)))));var n},endsWith:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.endsWith(n)))));var n},minLength:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.length>=n))));var n},length:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.length===n))));var n},maxLength:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.length<=n))));var n},includes:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&e.includes(n)))));var n},regex:t=>{return qi(Fi(e,(n=t,Vi(e=>Ui(e)&&Boolean(e.match(n))))));var n}});qi(Vi(Ui));const Pi=e=>Object.assign(zi(e),{between:(t,n)=>{return Pi(Fi(e,(r=t,i=n,Vi(e=>Yi(e)&&r<=e&&i>=e))));var r,i},lt:t=>{return Pi(Fi(e,(n=t,Vi(e=>Yi(e)&&e<n))));var n},gt:t=>{return Pi(Fi(e,(n=t,Vi(e=>Yi(e)&&e>n))));var n},lte:t=>{return Pi(Fi(e,(n=t,Vi(e=>Yi(e)&&e<=n))));var n},gte:t=>{return Pi(Fi(e,(n=t,Vi(e=>Yi(e)&&e>=n))));var n},int:()=>Pi(Fi(e,Vi(e=>Yi(e)&&Number.isInteger(e)))),finite:()=>Pi(Fi(e,Vi(e=>Yi(e)&&Number.isFinite(e)))),positive:()=>Pi(Fi(e,Vi(e=>Yi(e)&&e>0))),negative:()=>Pi(Fi(e,Vi(e=>Yi(e)&&e<0)))}),Hi=Pi(Vi(Yi)),Bi=e=>Object.assign(zi(e),{between:(t,n)=>{return Bi(Fi(e,(r=t,i=n,Vi(e=>Zi(e)&&r<=e&&i>=e))));var r,i},lt:t=>{return Bi(Fi(e,(n=t,Vi(e=>Zi(e)&&e<n))));var n},gt:t=>{return Bi(Fi(e,(n=t,Vi(e=>Zi(e)&&e>n))));var n},lte:t=>{return Bi(Fi(e,(n=t,Vi(e=>Zi(e)&&e<=n))));var n},gte:t=>{return Bi(Fi(e,(n=t,Vi(e=>Zi(e)&&e>=n))));var n},positive:()=>Bi(Fi(e,Vi(e=>Zi(e)&&e>0))),negative:()=>Bi(Fi(e,Vi(e=>Zi(e)&&e<0)))});Bi(Vi(Zi)),zi(Vi(function(e){return"boolean"==typeof e})),zi(Vi(function(e){return"symbol"==typeof e}));const Gi=zi(Vi(function(e){return null==e}));zi(Vi(function(e){return null!=e}));var Ki={__proto__:null,number:Hi,nullish:Gi};class Ji extends Error{constructor(e){let t;try{t=JSON.stringify(e)}catch(n){t=e}super(`Pattern matching error: no pattern matches value ${t}`),this.input=void 0,this.input=e}}const Qi={matched:!1,value:void 0};function Xi(e){return new ea(e,Qi)}let ea=class e{constructor(e,t){this.input=void 0,this.state=void 0,this.input=e,this.state=t}with(...t){if(this.state.matched)return this;const n=t[t.length-1],r=[t[0]];let i;3===t.length&&"function"==typeof t[1]?i=t[1]:t.length>2&&r.push(...t.slice(1,t.length-1));let a=!1,s={};const o=(e,t)=>{a=!0,s[e]=t},l=!r.some(e=>Ai(e,this.input,o))||i&&!Boolean(i(this.input))?Qi:{matched:!0,value:n(a?Ci in s?s[Ci]:s:this.input,this.input)};return new e(this.input,l)}when(t,n){if(this.state.matched)return this;const r=Boolean(t(this.input));return new e(this.input,r?{matched:!0,value:n(this.input,this.input)}:Qi)}otherwise(e){return this.state.matched?this.state.value:e(this.input)}exhaustive(e=ta){return this.state.matched?this.state.value:e(this.input)}run(){return this.exhaustive()}returnType(){return this}narrow(){return this}};function ta(e){throw new Ji(e)}const na=["de","de-DE"],{getLocale:ra,setLocale:ia}=(aa={sourceLocale:"en",targetLocales:na,loadLocale:e=>((e,t,n)=>{const r=e[t];return r?"function"==typeof r?r():Promise.resolve(r):new Promise((e,r)=>{("function"==typeof queueMicrotask?queueMicrotask:setTimeout)(r.bind(null,/* @__PURE__ */new Error("Unknown variable dynamic import: "+t+(t.split("/").length!==n?". Note that variables only represent file names one level deep.":""))))})})(/* @__PURE__ */Object.assign({}),`../generated/locales/${e}.js`,4)},function(e){if(w)throw new Error("lit-localize can only be configured once");v=e,w=!0}((e,t)=>M(A,e,t)),L=C=aa.sourceLocale,_=new Set(aa.targetLocales),_.add(aa.sourceLocale),I=aa.loadLocale,{getLocale:F,setLocale:V});var aa;function sa(e,t){return e.setLocale(ra()||document.documentElement.lang?.slice(0,2)||"en").toFormat(t)}function oa(e){return sa(ni.local().set({month:e}),"MMM")}function la(e){return sa(ni.local().set({weekday:e}),"ccc")}var da=Object.getOwnPropertyDescriptor;let ua=class extends i{render(){return a` <div>
            <span>${la(1)}</span>
            <span>${la(2)}</span>
            <span>${la(3)}</span>
            <span>${la(4)}</span>
            <span>${la(5)}</span>
            <span>${la(6)}</span>
            <span>${la(7)}</span>
        </div>`}};ua.styles=r`
        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            padding: var(--context-padding, 0.25em);
            text-align: var(--context-text-align, left);
        }
    `,ua=((e,t,n,r)=>{for(var i,a=r>1?void 0:r?da(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=i(a)||a);return a})([l("lms-calendar-context"),D()],ua);var ca=Object.defineProperty,ha=Object.getOwnPropertyDescriptor,ma=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?ha(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&ca(t,n,a),a};let fa=class extends i{constructor(){super(...arguments),this._hours=[...Array(25).keys()],this._hasActiveSidebar=!1,this.allDayRowCount=0}_renderSeparatorMaybe(e,t){return e?a`<div class="separator" style="grid-row: ${60*t}"></div>`:s}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}render(){const e=this.allDayRowCount>0,t=e?`calc(100% - 3.5em - ${24*this.allDayRowCount}px)`:"100%";return a` <div class="wrapper">
            <div class="all-day-wrapper ${c({collapsed:!e})}">
                <div class="all-day">
                    <slot name="all-day" id="all-day" class="entry"></slot>
                </div>
            </div>
            <div class="container" style="height: ${t}">
                <div
                    class="main ${c({"w-100":!this._hasActiveSidebar,"w-70":this._hasActiveSidebar})}"
                >
                    ${h(this._hours,(e,t)=>a`
                            <div
                                class="hour"
                                style=${this._getHourIndicator(e)}
                            >
                                <span class="indicator">
                                    ${this._renderIndicatorValue(e)}
                                </span>
                            </div>
                            ${this._renderSeparatorMaybe(t,e)}
                            <slot name="${e}" class="entry"></slot>
                        `)}
                </div>
                <div
                    class="sidebar w-30"
                    ?hidden=${!this._hasActiveSidebar}
                ></div>
            </div>
        </div>`}_getHourIndicator(e){return 24!==e?`grid-row: ${60*(e+1)-59}/${60*(e+1)}`:"grid-row: 1440"}};fa.styles=r`
        .wrapper {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            width: 100%;
        }

        .container {
            display: flex;
            flex: 1;
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            overflow-y: scroll;
            text-align: var(--day-text-align, center);
            padding: var(--day-padding, 0.5em);
            position: relative;
        }

        .hour {
            display: var(--day-show-time-column, block);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        .separator {
            grid-column: 2 / 3;
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .sidebar {
            height: 100%;
            border-left: var(--sidebar-border, 1px solid var(--separator-light));
        }

        .w-100 {
            width: 100%;
        }

        .w-70 {
            width: 70%;
        }

        .w-30 {
            width: 30%;
        }

        .w-0 {
            width: 0;
        }

        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            transition: grid-template-rows 0.2s ease;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
        }

        .all-day-wrapper.collapsed {
            grid-template-rows: 0fr;
            overflow: hidden;
            border-bottom: none;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
            overflow: hidden;
            min-height: 0;
            padding: 0.5em 0;
        }
    `,ma([d()],fa.prototype,"_hours",2),ma([d()],fa.prototype,"_hasActiveSidebar",2),ma([u({type:Number})],fa.prototype,"allDayRowCount",2),fa=ma([l("lms-calendar-day")],fa);const ya=()=>v("Day"),ga=()=>v("Week"),pa=()=>v("Month"),va=()=>v("Current Month"),wa=()=>v("All Day"),ba=()=>v("Today"),ka=()=>v("No Title"),Da=()=>v("No Content"),Sa=()=>v("No Time"),xa=()=>v("Event Details"),Ea=()=>v("Export as ICS"),Ta=()=>v("Title"),$a=()=>v("Time"),Ma=()=>v("Date"),Oa=()=>v("Notes"),Na=()=>v("Minimize"),Ca=()=>v("Close"),_a=()=>v("Drag to move menu"),Ia=()=>v("CW");var Aa=Object.defineProperty,La=Object.getOwnPropertyDescriptor,Ra=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?La(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&Aa(t,n,a),a};let za=class extends i{constructor(){super(),this.heading="",this.isContinuation=!1,this.density="standard",this.displayMode="default",this.floatText=!1,this._sumReducer=(e,t)=>e+t,this.addEventListener("click",this._handleInteraction),this.addEventListener("keydown",this._handleInteraction),this.addEventListener("focus",this._handleFocus)}_renderTitle(){return Xi(this.content).with(Ki.nullish,()=>this.heading).otherwise(()=>`${this.heading}: ${this.content}`)}_renderTime(){if("month-dot"===this.displayMode){if(this.isContinuation)return a`<span class="time">${wa()}</span>`;const e=this._displayInterval(this.time);return e?a`<span class="time">${e}</span>`:s}if("compact"===this.density)return s;if(this.isContinuation)return a`<span class="time">${wa()}</span>`;const e=this._displayInterval(this.time);return e?a`<span class="time">${e}</span>`:s}_renderContent(){return"full"===this.density&&this.content?a`<span class="content">${this.content}</span>`:s}_shouldShowTime(){return"compact"!==this.density&&(!!this.isContinuation||("standard"===this.density||"full"===this.density))}_getAriaLabel(){const e=this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} to ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:"All day",t=this.content?`, ${this.content}`:"";return`Calendar event: ${this.heading}${t}, ${e}. Press Enter or Space to open details.`}render(){const e=`main ${this.density}`;if("month-dot"===this.displayMode){const t=this.isContinuation;return a`
                <div
                    class=${e}
                    tabindex=${this.accessibility?.tabIndex??0}
                    role="button"
                    aria-label="${this.accessibility?.ariaLabel??this._getAriaLabel()}"
                    aria-selected=${this._highlighted?"true":"false"}
                    title=${this._renderTitle()}
                    data-full-content=${this.content||""}
                    ?data-extended=${this._extended}
                    ?data-is-multi-day=${t}
                >
                    ${t?"":a`
                                  <span class="color-dot"></span>
                              `}
                    <span class="title">${this.heading}</span>
                    ${this._renderTime()}
                </div>
            `}return this.floatText?a`
                <div
                    class=${e}
                    style="background-color: var(--entry-background-color); height: 100%; position: relative; overflow: visible;"
                >
                    <div class="text-content">
                        <span style="font-weight: 500;">${this.heading}</span>
                        ${this._renderTime()}
                    </div>
                </div>
            `:a`
            <div
                class=${e}
                tabindex=${this.accessibility?.tabIndex??0}
                role="button"
                aria-label="${this.accessibility?.ariaLabel??this._getAriaLabel()}"
                aria-selected=${this._highlighted?"true":"false"}
                title=${this._renderTitle()}
                data-full-content=${this.content||""}
                ?data-extended=${this._extended}
            >
                <span class="title">${this.heading}</span>
                ${this._shouldShowTime()?this._renderTime():s}
                ${this._renderContent()}
            </div>
        `}_displayInterval(e){if(!e)return s;const t=[e.start.hour,e.start.minute,e.end.hour,e.end.minute];if(24===t[2]&&t.reduce(this._sumReducer,0)%24==0)return wa();const[n,r,i,a]=t.map(e=>e<10?`0${e}`:e);return`${n}:${r} - ${i}:${a}`}clearSelection(){this._highlighted=!1,this.setAttribute("aria-selected","false")}_handleFocus(e){const t=new CustomEvent("clear-other-selections",{detail:{exceptEntry:this},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleInteraction(e){if(!(e instanceof KeyboardEvent&&"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),e.stopPropagation(),this._highlighted))){if(this._highlighted=!0,this.setAttribute("aria-selected","true"),!this.date)return;const e={heading:this.heading||ka(),content:this.content||Da(),time:this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} - ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:Sa(),date:this.date?.start},t=new CustomEvent("open-menu",{detail:e,bubbles:!0,composed:!0});this.dispatchEvent(t);const n=()=>{this._highlighted=!1,this.setAttribute("aria-selected","false"),this.removeEventListener("menu-close",n)};this.addEventListener("menu-close",n)}}};za.styles=r`
        :host {
            /* Use shared design tokens from root component */
            font-size: var(--entry-font-size);
            line-height: var(--entry-line-height);
            font-family: var(--system-ui);

            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--entry-width, 100%);
            margin-left: var(--entry-margin-left, 0);
            background-color: var(--entry-background-color);
            color: var(--entry-color);
            border: var(--entry-border, none);
            /* z-index of separators in day view is 0 */
            z-index: var(--entry-z-index, 1);
            opacity: var(--entry-opacity, 1);
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: var(--entry-min-height);
            overflow: hidden;
            position: relative;
        }

        /* Color handle indicator on the left - only for day/week views */
        :host::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: var(--entry-handle-width, 0px);
            background-color: var(--entry-handle-color, transparent);
            border-radius: var(--entry-border-radius) 0 0 var(--entry-border-radius);
            display: var(--entry-handle-display, none);
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        :host([data-highlighted]) {
            background: var(--entry-highlight-color);
        }

        /* ARIA-compliant highlighted border for active menu entries */
        :host([aria-selected='true']) {
            outline: 3px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important; /* Ensure highlighted entry appears above others */
        }

        /* Keyboard-only focus styles — mouse clicks won't trigger the outline */
        :host(:focus-visible) {
            outline: 2px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important;
        }

        :host([data-extended]) {
            background: var(--entry-extended-background-color, var(--background-color));
        }

        :host(:has(:focus-visible)) {
            outline: 2px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important;
        }

        .main {
            padding: var(--entry-padding);
            padding-top: calc(var(--entry-padding-top, 0) + 0.15em);
            border-radius: var(--entry-border-radius);
            background-color: inherit;
            text-align: left;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: var(--entry-layout);
            align-items: var(--entry-align); /* Use shared design token */
            justify-content: flex-start; /* Always align content to left */
            gap: var(--entry-gap);
            overflow: visible;
            position: relative;
        }

        /* Compact grouped content - don't stretch to fill height */
        .main.compact,
        .main.standard {
            align-self: flex-start; /* Don't stretch vertically */
            height: auto; /* Use natural content height instead of 100% */
            min-height: var(--entry-min-height, 1.2em);
        }

        /* When handle design is used, adjust padding for the colored handle */
        .main {
            padding-left: var(--entry-padding-left, 0.25em);
        }

        .text-content {
            position: absolute;
            top: var(--entry-text-top, -20px);
            left: var(--entry-text-left, 0);
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 6px;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            font-size: 0.7rem;
            z-index: 1000;
            white-space: nowrap;
            pointer-events: auto;
            line-height: 1.2;
        }

        /* Compact mode: single line with title only */
        .main.compact {
            flex-direction: row;
            align-items: flex-start; /* Top-left alignment for better overlapping visibility */
            gap: 0;
        }

        /* Standard mode: title + time in various layouts */
        .main.standard {
            flex-direction: var(--entry-layout, row);
            align-items: flex-start;
            gap: 0.25em;
        }

        /* Full mode: multi-line with all content */
        .main.full {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1em;
        }

        .title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: var(--entry-title-wrap);
            font-weight: var(--entry-title-weight);
        }

        .time {
            font-family: var(--entry-font-family, var(--system-ui));
            font-size: var(--entry-time-font-size);
            opacity: var(--entry-time-opacity);
            white-space: nowrap;
            flex-shrink: 0;
            margin-left: 0; /* Ensure time stays on the left, don't auto-align to right */
        }

        /* Row layout: optimized for side-by-side content */
        .main[style*='--entry-layout: row'] {
            align-items: center; /* Center align for single-line layout */
            gap: 0.5em; /* Gap between title and time */
            flex-wrap: nowrap; /* Prevent wrapping */
            min-height: 1.4em; /* Ensure consistent height */
        }

        .main[style*='--entry-layout: row'] .title {
            flex: 1 1 auto; /* Allow title to grow but not beyond container */
            min-width: 0; /* Allow title to shrink below content size */
            max-width: 65%; /* Reserve space for time, but allow more for title */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .main[style*='--entry-layout: row'] .time {
            flex: 0 0 auto; /* Fixed size, don't grow or shrink */
            min-width: fit-content; /* Ensure time always fits */
            font-size: 0.8em; /* Slightly smaller in row layout */
            opacity: 0.9;
        }

        /* Column layout: optimized for stacked content */
        .main[style*='--entry-layout: column'] {
            align-items: flex-start;
            gap: 0.15em; /* Tighter spacing for stacked layout */
            padding-top: 0.2em; /* Slight top padding for better visual balance */
        }

        .main[style*='--entry-layout: column'] .title {
            width: 100%;
            font-weight: 500; /* Slightly bolder in column layout */
            line-height: 1.2;
            margin-bottom: 0.1em;
        }

        .main[style*='--entry-layout: column'] .time {
            width: 100%;
            font-size: 0.85em;
            opacity: 0.8;
            line-height: 1.1;
        }

        /* Month view dot indicator styles */
        :host([data-display-mode='month-dot']) {
            background: var(--entry-month-background);
            padding: var(--entry-month-padding);
            border-radius: 0;
            color: var(--entry-month-text-color);
            position: relative;
            z-index: 1;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
        }

        /* Multi-day events keep their background in month view */
        :host([data-display-mode='month-dot'][data-is-continuation='true']),
        :host([data-display-mode='month-dot']) .main[data-is-multi-day='true'] {
            background: var(--entry-background-color);
            border-radius: var(--border-radius-sm);
            color: var(--entry-color);
        }

        :host([data-display-mode='month-dot']) .main {
            padding: 0;
            align-items: center;
            gap: var(--entry-dot-margin);
            flex-wrap: nowrap;
            overflow: hidden;
            flex-direction: row !important;
        }

        :host([data-display-mode='month-dot']) .title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
        }

        :host([data-display-mode='month-dot']) .time {
            font-family: var(--entry-time-font);
            text-align: var(--entry-time-align);
            min-width: 3.5em;
            margin-left: auto;
            color: inherit;
            opacity: 0.8;
        }

        .color-dot {
            width: var(--entry-dot-size);
            height: var(--entry-dot-size);
            border-radius: 50%;
            background-color: var(--entry-color);
            flex-shrink: 0;
        }

        .content {
            font-size: 0.9em;
            opacity: 0.9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Responsive behavior based on available height */
        :host([data-height='compact']) .main {
            flex-direction: row;
            align-items: center;
        }

        :host([data-height='compact']) .time {
            display: var(--entry-compact-show-time, none);
        }

        :host([data-height='standard']) .main {
            flex-direction: row;
            align-items: flex-start;
        }

        :host([data-height='full']) .main {
            flex-direction: column;
            align-items: flex-start;
        }

        :host([data-height='full']) .title {
            white-space: normal;
            word-wrap: break-word;
        }
    `,Ra([u({attribute:!1})],za.prototype,"time",2),Ra([u()],za.prototype,"heading",2),Ra([u()],za.prototype,"content",2),Ra([u({type:Boolean})],za.prototype,"isContinuation",2),Ra([u({type:Object})],za.prototype,"date",2),Ra([u({type:String,reflect:!0,attribute:"data-density"})],za.prototype,"density",2),Ra([u({type:String,reflect:!0,attribute:"data-display-mode"})],za.prototype,"displayMode",2),Ra([u({type:Boolean,reflect:!0,attribute:"data-float-text"})],za.prototype,"floatText",2),Ra([u({type:Object,attribute:!1})],za.prototype,"accessibility",2),Ra([d()],za.prototype,"_highlighted",2),Ra([d()],za.prototype,"_extended",2),za=Ra([l("lms-calendar-entry"),D()],za);var Fa=Object.defineProperty,Va=Object.getOwnPropertyDescriptor,ja=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?Va(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&Fa(t,n,a),a};let Wa=class extends i{constructor(){super(...arguments),this.viewMode="month"}_getWeekInfo(e){const t=ni.fromObject({year:e.year,month:e.month,day:e.day});return{weekNumber:t.weekNumber,weekYear:t.weekYear}}render(){const e=this.activeDate;return a`<div class="controls">
            <div class="info">
                <span>
                    <strong>${this.heading||va()}</strong>
                </span>
                <div class="view-detail${"day"===this.viewMode?" active":""}">
                    <span class="day">${e.day}</span>
                    <span class="month"
                        >${oa(e.month)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
                <div class="view-detail${"week"===this.viewMode?" active":""}">
                    <span class="week"
                        >${Ia()}
                        ${this._getWeekInfo(e).weekNumber}</span
                    >
                    <span class="month"
                        >${oa(e.month)}</span
                    >
                    <span class="year"
                        >${this._getWeekInfo(e).weekYear}</span
                    >
                </div>
                <div class="view-detail${"month"===this.viewMode?" active":""}">
                    <span class="month"
                        >${oa(e.month)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
            </div>
            <div class="context" @click=${this._dispatchSwitchView}>
                <button
                    ?data-active=${"day"===this.viewMode}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${ya()}
                </button>
                <button
                    ?data-active=${"week"===this.viewMode}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${ga()}
                </button>
                <button
                    ?data-active=${"month"===this.viewMode}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${pa()}
                </button>
            </div>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button name="previous">«</button>
                <button name="next">»</button>
                <span class="separator"></span>
                <button name="today" @click=${this._handleTodayClick}>
                    ${ba()}
                </button>
            </div>
        </div>`}_handleTodayClick(e){e.stopPropagation();const t=/* @__PURE__ */new Date,n={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()},r=new CustomEvent("jumptoday",{detail:{date:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchDate(e){const t=e.target;if(!(t instanceof HTMLButtonElement))return;const n=e.target===e.currentTarget?"container":t.name,r=new CustomEvent("switchdate",{detail:{direction:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchView(e){const t=e.target;if(!(t instanceof HTMLElement))return;const n=e.target===e.currentTarget?"container":t.dataset.context,r=new CustomEvent("switchview",{detail:{view:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}};Wa.styles=r`
        .controls {
            height: var(--header-height, 3.5em);
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--separator-light);
        }

        @media (max-width: 375px) {
            .controls {
                font-size: small;
                height: auto;
                min-height: var(--header-height-mobile, 4.5em);
                flex-wrap: wrap;
                padding: 0.25em 0;
                gap: 0.25em;
            }
            .info {
                width: 100%;
                text-align: center;
                padding-left: 0;
            }
            .buttons {
                padding-right: 0.5em;
            }
        }
        .info {
            padding-left: var(--header-info-padding-left, 1em);
            text-align: right;
            display: grid;
        }

        .view-detail {
            grid-row: 2;
            grid-column: 1;
            visibility: hidden;
        }

        .view-detail.active {
            visibility: visible;
        }
        .day,
        .week,
        .month,
        .year {
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
        }
        button {
            padding: 0.4em 0.7em;
            margin: 0;
            border: none;
            background: none;
            font: inherit;
            font-size: 0.85em;
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            cursor: pointer;
            border-radius: var(--border-radius-sm, 5px);
            transition: background-color 0.15s ease, color 0.15s ease;
        }

        button:hover {
            background: var(--separator-light, rgba(0, 0, 0, 0.1));
        }

        .context {
            display: flex;
            align-items: center;
            gap: 0;
            background: var(--separator-light, rgba(0, 0, 0, 0.06));
            border-radius: var(--border-radius-sm, 5px);
            padding: 0.15em;
        }

        .context button {
            border-radius: calc(var(--border-radius-sm, 5px) - 1px);
        }

        .context button[data-active] {
            background: var(--background-color, white);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .buttons {
            display: flex;
            align-items: center;
            padding-right: var(--header-buttons-padding-right, 1em);
            gap: 0.15em;
        }

        .buttons .separator {
            width: 1px;
            height: 1.2em;
            background: var(--separator-light, rgba(0, 0, 0, 0.15));
            margin: 0 0.2em;
        }
    `,ja([u({type:String})],Wa.prototype,"heading",2),ja([u({type:Object})],Wa.prototype,"activeDate",2),ja([u({type:String})],Wa.prototype,"viewMode",2),ja([u({type:Object})],Wa.prototype,"expandedDate",2),Wa=ja([l("lms-calendar-header"),D()],Wa);var Ya={dragStart:!0},Ua={delay:0,distance:3};var Za=(e,t,n)=>Math.min(Math.max(e,t),n),qa=e=>"string"==typeof e,Pa=([e,t],n,r)=>{const i=(e,t)=>0===t?0:Math.ceil(e/t)*t;return[i(n,e),i(r,t)]},Ha=(e,t)=>e.some(e=>t.some(t=>e.contains(t)));function Ba(e,t){if(void 0===e)return;if(Ka(e))return e.getBoundingClientRect();if("object"==typeof e){const{top:t=0,left:n=0,right:r=0,bottom:i=0}=e;return{top:t,right:window.innerWidth-r,bottom:window.innerHeight-i,left:n}}if("parent"===e)return t.parentNode.getBoundingClientRect();const n=document.querySelector(e);if(null===n)throw new Error("The selector provided for bound doesn't exists in the document.");return n.getBoundingClientRect()}var Ga=(e,t,n)=>e.style.setProperty(t,n),Ka=e=>e instanceof HTMLElement,Ja=class{constructor(e,t={}){this.node=e,this._drag_instance=function(e,t={}){let n,r,{bounds:i,axis:a="both",gpuAcceleration:s=!0,legacyTranslate:o=!1,transform:l,applyUserSelectHack:d=!0,disabled:u=!1,ignoreMultitouch:c=!1,recomputeBounds:h=Ya,grid:m,threshold:f=Ua,position:y,cancel:g,handle:p,defaultClass:v="neodrag",defaultClassDragging:w="neodrag-dragging",defaultClassDragged:b="neodrag-dragged",defaultPosition:k={x:0,y:0},onDragStart:D,onDrag:S,onDragEnd:x}=t,E=!1,T=!1,$=0,M=!1,O=!1,N=0,C=0,_=0,I=0,A=0,L=0,{x:R,y:z}=y?{x:y?.x??0,y:y?.y??0}:k;G(R,z);let F,V,j,W,Y,U="",Z=!!y;h={...Ya,...h},f={...Ua,...f??{}};let q=/* @__PURE__ */new Set;function P(e){E&&!T&&O&&M&&Y&&(T=!0,K("neodrag:start",D,e),B.add(w),d&&(U=H.userSelect,H.userSelect="none"))}const H=document.body.style,B=e.classList;function G(t=N,n=C){if(!l){if(o){let r=`${+t}px, ${+n}px`;return Ga(e,"transform",s?`translate3d(${r}, 0)`:`translate(${r})`)}return Ga(e,"translate",`${+t}px ${+n}px`)}const r=l({offsetX:t,offsetY:n,rootNode:e});qa(r)&&Ga(e,"transform",r)}function K(t,n,r){const i=/* @__PURE__ */function(t){return{offsetX:N,offsetY:C,rootNode:e,currentNode:Y,event:t}}(r);e.dispatchEvent(new CustomEvent(t,{detail:i})),n?.(i)}const J=addEventListener,Q=new AbortController,X={signal:Q.signal,capture:!1};function ee(){let t=e.offsetWidth/V.width;return isNaN(t)&&(t=1),t}return Ga(e,"touch-action","none"),J("pointerdown",t=>{if(u)return;if(2===t.button)return;if(q.add(t.pointerId),c&&q.size>1)return t.preventDefault();if(h.dragStart&&(F=Ba(i,e)),qa(p)&&qa(g)&&p===g)throw new Error("`handle` selector can't be same as `cancel` selector");if(B.add(v),j=function(e,t){if(!e)return[t];if(Ka(e))return[e];if(Array.isArray(e))return e;const n=t.querySelectorAll(e);if(null===n)throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");return Array.from(n.values())}(p,e),W=function(e,t){if(!e)return[];if(Ka(e))return[e];if(Array.isArray(e))return e;const n=t.querySelectorAll(e);if(null===n)throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");return Array.from(n.values())}(g,e),n=/(both|x)/.test(a),r=/(both|y)/.test(a),Ha(W,j))throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");const s=t.composedPath()[0];if(!j.some(e=>e.contains(s)||e.shadowRoot?.contains(s))||Ha(W,[s]))return;Y=1===j.length?e:j.find(e=>e.contains(s)),E=!0,$=Date.now(),f.delay||(M=!0),V=e.getBoundingClientRect();const{clientX:o,clientY:l}=t,d=ee();n&&(_=o-R/d),r&&(I=l-z/d),F&&(A=o-V.left,L=l-V.top)},X),J("pointermove",t=>{if(!E||c&&q.size>1)return;if(!T){if(M||Date.now()-$>=f.delay&&(M=!0,P(t)),!O){const e=t.clientX-_,n=t.clientY-I;Math.sqrt(e**2+n**2)>=f.distance&&(O=!0,P(t))}if(!T)return}h.drag&&(F=Ba(i,e)),t.preventDefault(),V=e.getBoundingClientRect();let a=t.clientX,s=t.clientY;const o=ee();if(F){const e={left:F.left+A,top:F.top+L,right:F.right+A-V.width,bottom:F.bottom+L-V.height};a=Za(a,e.left,e.right),s=Za(s,e.top,e.bottom)}if(Array.isArray(m)){let[e,t]=m;if(isNaN(+e)||e<0)throw new Error("1st argument of `grid` must be a valid positive number");if(isNaN(+t)||t<0)throw new Error("2nd argument of `grid` must be a valid positive number");let n=a-_,r=s-I;[n,r]=Pa([e/o,t/o],n,r),a=_+n,s=I+r}n&&(N=Math.round((a-_)*o)),r&&(C=Math.round((s-I)*o)),R=N,z=C,K("neodrag",S,t),G()},X),J("pointerup",t=>{q.delete(t.pointerId),E&&(T&&(J("click",e=>e.stopPropagation(),{once:!0,signal:Q.signal,capture:!0}),h.dragEnd&&(F=Ba(i,e)),B.remove(w),B.add(b),d&&(H.userSelect=U),K("neodrag:end",x,t),n&&(_=N),r&&(I=C)),E=!1,T=!1,M=!1,O=!1)},X),{destroy:()=>Q.abort(),update:e=>{a=e.axis||"both",u=e.disabled??!1,c=e.ignoreMultitouch??!1,p=e.handle,i=e.bounds,h=e.recomputeBounds??Ya,g=e.cancel,d=e.applyUserSelectHack??!0,m=e.grid,s=e.gpuAcceleration??!0,o=e.legacyTranslate??!1,l=e.transform,f={...Ua,...e.threshold??{}};const t=B.contains(b);B.remove(v,b),v=e.defaultClass??"neodrag",w=e.defaultClassDragging??"neodrag-dragging",b=e.defaultClassDragged??"neodrag-dragged",B.add(v),t&&B.add(b),Z&&(R=N=e.position?.x??N,z=C=e.position?.y??C,G())}}}(e,this._options=t)}_drag_instance;_options={};updateOptions(e){this._drag_instance.update(Object.assign(this._options,e))}set options(e){this._drag_instance.update(this._options=e)}get options(){return this._options}destroy(){this._drag_instance.destroy()}},Qa=e=>Object.fromEntries(Object.entries(e).map(([e,t])=>[t,e])),Xa={action:"ACTION",description:"DESCRIPTION",duration:"DURATION",repeat:"REPEAT",summary:"SUMMARY",trigger:"TRIGGER",attachments:"ATTACH",attendees:"ATTENDEE"};Qa(Xa);Qa({method:"METHOD",prodId:"PRODID",version:"VERSION",name:"X-WR-CALNAME"});var es={alarms:"ALARM",categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",timeTransparent:"TRANSP",url:"URL",end:"DTEND",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"};Qa(es);Qa({id:"TZID",lastModified:"LAST-MODIFIED",url:"TZURL"});Qa({comment:"COMMENT",name:"TZNAME",offsetFrom:"TZOFFSETFROM",offsetTo:"TZOFFSETTO",recurrenceDate:"RDATE",recurrenceRule:"RRULE",start:"DTSTART"});Qa({byDay:"BYDAY",byHour:"BYHOUR",byMinute:"BYMINUTE",byMonth:"BYMONTH",byMonthday:"BYMONTHDAY",bySecond:"BYSECOND",bySetPos:"BYSETPOS",byWeekNo:"BYWEEKNO",byYearday:"BYYEARDAY",count:"COUNT",frequency:"FREQ",interval:"INTERVAL",until:"UNTIL",workweekStart:"WKST"});Qa({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT",completed:"COMPLETED",due:"DUE",percentComplete:"PERCENT-COMPLETE"});Qa({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"});Qa({stamp:"DTSTAMP",start:"DTSTART",uid:"UID",url:"URL",organizer:"ORGANIZER",attendees:"ATTENDEE",comment:"COMMENT",end:"DTEND",freeBusy:"FREEBUSY"});var ts=/\r\n/,ns=e=>`${e}\r\n`,rs=(e,t,n)=>n?null==t?"":ns(`${e};${n}:${t}`):ns(`${e}:${t}`),is=e=>{if(!(e.length<1))return`${e.map(e=>`${e.key}=${e.value}`).join(";")}`},as=(e,t)=>t?`"MAILTO:${e}"`:`MAILTO:${e}`,ss=(e,t)=>{let n=is([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.delegatedFrom&&{key:"DELEGATED-FROM",value:as(e.delegatedFrom,!0)},e.member&&{key:"MEMBER",value:as(e.member,!0)},e.role&&{key:"ROLE",value:e.role},e.name&&{key:"CN",value:e.name},e.partstat&&{key:"PARTSTAT",value:e.partstat},e.sentBy&&{key:"SENT-BY",value:as(e.sentBy,!0)},void 0!==e.rsvp&&(!0===e.rsvp||!1===e.rsvp)&&{key:"RSVP",value:!0===e.rsvp?"TRUE":"FALSE"}].filter(e=>!!e));return rs(t,as(e.email),n)},os=e=>{if(0===Object.values(e).filter(e=>"number"==typeof e).length)return;let t="";return e.before&&(t+="-"),t+="P",void 0!==e.weeks&&(t+=`${e.weeks}W`),void 0!==e.days&&(t+=`${e.days}D`),(void 0!==e.hours||void 0!==e.minutes||void 0!==e.seconds)&&(t+="T",void 0!==e.hours&&(t+=`${e.hours}H`),void 0!==e.minutes&&(t+=`${e.minutes}M`),void 0!==e.seconds&&(t+=`${e.seconds}S`)),t},ls=36e5,ds=/* @__PURE__ */Symbol.for("constructDateFrom");function us(e,t){return"function"==typeof e?e(t):e&&"object"==typeof e&&ds in e?e[ds](t):e instanceof Date?new e.constructor(t):new Date(t)}function cs(e,t){return us(t||e,e)}function hs(e,t,n){let r=cs(e,null==n?void 0:n.in);return isNaN(t)?us((null==n?void 0:n.in)||e,NaN):(t&&r.setDate(r.getDate()+t),r)}function ms(e,t,n){let r=cs(e,void 0);if(isNaN(t))return us(e,NaN);if(!t)return r;let i=r.getDate(),a=us(e,r.getTime());return a.setMonth(r.getMonth()+t+1,0),i>=a.getDate()?a:(r.setFullYear(a.getFullYear(),a.getMonth(),i),r)}function fs(e,t,n){return us(e,+cs(e)+t)}function ys(e,t,n){return fs(e,t*ls)}var gs={};function ps(){return gs}function vs(e,t){var n,r,i,a;let s=ps(),o=(null==t?void 0:t.weekStartsOn)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.weekStartsOn)??s.weekStartsOn??(null==(a=null==(i=s.locale)?void 0:i.options)?void 0:a.weekStartsOn)??0,l=cs(e,null==t?void 0:t.in),d=l.getDay(),u=(d<o?7:0)+d-o;return l.setDate(l.getDate()-u),l.setHours(0,0,0,0),l}function ws(e,t,n){let r=cs(e,void 0);return r.setTime(r.getTime()+6e4*t),r}function bs(e,t,n){return fs(e,1e3*t)}function ks(e,t,n){return hs(e,7*t,n)}function Ds(e,t,n){return ms(e,12*t)}function Ss(e,t){let n=+cs(e)-+cs(t);return n<0?-1:n>0?1:n}function xs(e){return e instanceof Date||"object"==typeof e&&"[object Date]"===Object.prototype.toString.call(e)}function Es(e,t){let n=cs(e,void 0),r=n.getMonth();return n.setFullYear(n.getFullYear(),r+1,0),n.setHours(23,59,59,999),n}function Ts(e,t){let[n,r]=function(e,...t){let n=us.bind(null,t.find(e=>"object"==typeof e));return t.map(n)}(0,t.start,t.end);return{start:n,end:r}}function $s(e,t){let n=cs(e,void 0);return n.setDate(1),n.setHours(0,0,0,0),n}function Ms(e,t){var n,r,i,a;let s=ps(),o=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??s.firstWeekContainsDate??(null==(a=null==(i=s.locale)?void 0:i.options)?void 0:a.firstWeekContainsDate)??1,l=function(e,t){var n,r,i,a;let s=cs(e,null==t?void 0:t.in),o=s.getFullYear(),l=ps(),d=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??l.firstWeekContainsDate??(null==(a=null==(i=l.locale)?void 0:i.options)?void 0:a.firstWeekContainsDate)??1,u=us((null==t?void 0:t.in)||e,0);u.setFullYear(o+1,0,d),u.setHours(0,0,0,0);let c=vs(u,t),h=us((null==t?void 0:t.in)||e,0);h.setFullYear(o,0,d),h.setHours(0,0,0,0);let m=vs(h,t);return+s>=+c?o+1:+s>=+m?o:o-1}(e,t),d=us((null==t?void 0:t.in)||e,0);return d.setFullYear(l,0,o),d.setHours(0,0,0,0),vs(d,t)}function Os(e,t){return cs(e,void 0).getDay()}function Ns(e,t){let n=cs(e,void 0),r=n.getFullYear(),i=n.getMonth(),a=us(n,0);return a.setFullYear(r,i+1,0),a.setHours(0,0,0,0),a.getDate()}function Cs(e,t){return cs(e,void 0).getMonth()}function _s(e,t,n){let r=cs(e,null==n?void 0:n.in),i=function(e,t){let n=cs(e,null==t?void 0:t.in),r=+vs(n,t)-+Ms(n,t);return Math.round(r/6048e5)+1}(r,n)-t;return r.setDate(r.getDate()-7*i),cs(r,null==n?void 0:n.in)}function Is(e,t,n){var r,i,a,s;let o=ps(),l=(null==n?void 0:n.weekStartsOn)??(null==(i=null==(r=null==n?void 0:n.locale)?void 0:r.options)?void 0:i.weekStartsOn)??o.weekStartsOn??(null==(s=null==(a=o.locale)?void 0:a.options)?void 0:s.weekStartsOn)??0,d=cs(e,null==n?void 0:n.in),u=d.getDay(),c=7-l;return hs(d,t<0||t>6?t-(u+c)%7:((t%7+7)%7+c)%7-(u+c)%7,n)}function As(e,t,n){let r=+cs(e,void 0),[i,a]=[+cs(t.start,void 0),+cs(t.end,void 0)].sort((e,t)=>e-t);return r>=i&&r<=a}var Ls=["SU","MO","TU","WE","TH","FR","SA"],Rs=(e,t)=>void 0!==t&&e>=t,zs=(e,t,n,r)=>{let i=n.map(({day:e,occurrence:t})=>({occurrence:t,day:Ls.indexOf(e)}));return"YEARLY"===e.frequency?e.byYearday||e.byMonthday?t.map(e=>e.filter(e=>i.find(({day:t})=>t===Os(e)))):e.byWeekNo?t.map(e=>e.flatMap(e=>i.map(({day:t})=>Is(e,t,{weekStartsOn:r})))):e.byMonth?t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Fs(Vs($s(e)),Vs(Es(e)),t,r,n)))):t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Fs(Vs(function(e){let t=cs(e,void 0);return t.setFullYear(t.getFullYear(),0,1),t.setHours(0,0,0,0),t}(e)),Vs(function(e){let t=cs(e,void 0),n=t.getFullYear();return t.setFullYear(n+1,0,0),t.setHours(23,59,59,999),t}(e)),t,r,n)))):"MONTHLY"===e.frequency?e.byMonthday?t.map(e=>e.filter(e=>i.find(({day:t})=>t===Os(e)))):t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Fs(Vs($s(e)),Vs(Es(e)),t,r,n)))):"WEEKLY"===e.frequency?t.map(e=>e.flatMap(e=>i.map(({day:t})=>Is(e,t,{weekStartsOn:r})))):t.map(e=>e.filter(e=>i.find(({day:t})=>t===Os(e))))},Fs=(e,t,n,r,i)=>{if(void 0!==i){if(!(i<0)){let t=Is(e,n,{weekStartsOn:r});return ks(t,(i||1)-1+(e>t?1:0))}let a=Is(t,n,{weekStartsOn:r});return Vs(function(e){let t=cs(e,void 0);return t.setHours(0,0,0,0),t}(function(e,t,n){return ks(e,-t,n)}(a,-(i||1)-1+(t<a?1:0))))}return function(e){let{start:t,end:n}=Ts(0,e),r=+t>+n,i=r?+t:+n,a=r?n:t;a.setHours(0,0,0,0);let s=[];for(;+a<=i;)s.push(us(t,a)),a.setDate(a.getDate()+1),a.setHours(0,0,0,0);return r?s.reverse():s}({start:e,end:t}).map(e=>Vs(e)).filter(n=>As(n,{start:e,end:t})).filter(e=>n===Os(e))},Vs=e=>ws(e,-e.getTimezoneOffset()),js=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=cs(e,void 0);return n.setHours(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return cs(e,void 0).getHours()}(e)))),Ws=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=cs(e,void 0);return n.setMinutes(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return cs(e,void 0).getMinutes()}(e)))),Ys=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=cs(e,void 0),r=n.getFullYear(),i=n.getDate(),a=us(e,0);a.setFullYear(r,t,15),a.setHours(0,0,0,0);let s=Ns(a);return n.setMonth(t,Math.min(i,s)),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(Cs(e)))),Us=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency?t.map(e=>e.flatMap(e=>{let t=Ns(e);return n.map(n=>n>t?void 0:function(e,t){let n=cs(e,void 0);return n.setDate(t),n}(e,n)).filter(e=>!!e)})):"WEEKLY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(Cs(e)))),Zs=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency||"MINUTELY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=cs(e,void 0);return n.setSeconds(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return cs(e).getSeconds()}(e)))),qs=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=cs(e,void 0);return n.setMonth(0),n.setDate(t),n}(e,t)))):"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(function(e){return cs(e,void 0).getFullYear()}(e)))),Ps=(e,t,n)=>{let r=n;return e.byMonth&&(r=Ys(e,r,e.byMonth)),e.byWeekNo&&(r=((e,t,n,r)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>_s(e,t,{weekStartsOn:r})))):t)(e,r,e.byWeekNo,t.weekStartsOn)),e.byYearday&&(r=qs(e,r,e.byYearday)),e.byMonthday&&(r=Us(e,r,e.byMonthday)),e.byDay&&(r=zs(e,r,e.byDay,t.weekStartsOn)),e.byHour&&(r=js(e,r,e.byHour)),e.byMinute&&(r=Ws(e,r,e.byMinute)),e.bySecond&&(r=Zs(e,r,e.bySecond)),e.bySetPos&&(r=((e,t,n)=>e.byYearday||e.byWeekNo||e.byMonthday||e.byMonth||e.byDay||e.byHour||e.byMinute||e.bySecond?t.map(e=>e.sort(Ss).filter((t,r)=>n.some(t=>t>0?0!==r&&r%t===0:0===r?e.length-1+t===0:r%(e.length-1+t)===0))):t)(e,r,e.bySetPos)),r.map(e=>e.sort(Ss).filter(e=>!(t.exceptions.length>0&&t.exceptions.some(t=>function(e,t){return+cs(e)==+cs(t)}(t,e))||!As(e,{start:t.start,end:t.end}))))},Hs=(e,t)=>{var n;let r=t.start,i=(null==(n=e.until)?void 0:n.date)||(null==t?void 0:t.end)||Ds(r,2),a=t.exceptions||[],s=(e.workweekStart?Ls.indexOf(e.workweekStart):1)%7,o=[[r]];((e,{start:t,end:n},r)=>{if(Rs(r.length,e.count))return;let i=e.frequency,a=e.interval||1;if(!i)return;let s=t;if("SECONDLY"!==i)if("MINUTELY"!==i)if("HOURLY"!==i)if("DAILY"!==i)if("WEEKLY"!==i)if("MONTHLY"!==i)if("YEARLY"!==i);else for(;s<n;)s=Ds(s,a),r.push([s]);else for(;s<n;)s=ms(s,a),r.push([s]);else for(;s<n;){if(Rs(r.length,e.count))return;s=ks(s,a),r.push([s])}else for(;s<n;){if(Rs(r.length,e.count))return;s=hs(s,a),r.push([s])}else for(;s<n;){if(Rs(r.length,e.count))return;s=ys(s,a),r.push([s])}else for(;s<n;){if(Rs(r.length,e.count))return;s=ws(s,a),r.push([s])}else for(;s<n;){if(Rs(r.length,e.count))return;s=bs(s,a),r.push([s])}})(e,{start:r,end:i},o);let l=Ps(e,{start:r,end:i,exceptions:a,weekStartsOn:s},o);return e.count?l.flat().splice(0,e.count):l.flat()},Bs=e=>{let t="+"===e[0]?1:-1;return 1e3*(60*(60*Number(e.slice(1,3))+(e.length>3?Number(e.slice(3,5)):0))+(e.length>5?Number(e.slice(5,7)):0))*t},Gs=(e,t,n)=>{let r=null==n?void 0:n.find(e=>e.id===t);if(r){let t=((e,t)=>t.flatMap(t=>!t.recurrenceRule||t.recurrenceRule.until&&t.recurrenceRule.until.date<e?t:Hs(t.recurrenceRule,{start:t.start,end:e}).map(e=>({...t,start:e}))))(e,r.props).sort((e,t)=>Ss(e.start,t.start));for(let r=0;r<t.length;r+=1)if(e<t[r].start){let e=t[r-1]?t[r-1].offsetTo:t[r].offsetFrom,n=e.length>5?e.substring(0,5):e;return{offset:n,milliseconds:Bs(n)}}let n=t[t.length-1].offsetTo,i=n.length>5?n.substring(0,5):n;return{offset:i,milliseconds:Bs(i)}}let i=((e,t)=>{let n="en-US",r=new Date(t.toLocaleString(n,{timeZone:"UTC"}));try{return new Date(t.toLocaleString(n,{timeZone:e})).getTime()-r.getTime()}catch{return t.getTime()-r.getTime()}})(t,e);if(!Number.isNaN(i)){let e=i<0,t=Math.abs(function(e){let t=e/ls;return Math.trunc(t)}(i)),n=Math.abs(function(e){let t=e/6e4;return Math.trunc(t)}(i))-60*t;return{offset:`${e?"-":"+"}${1===t.toString().length?`0${t}`:t.toString()}${1===n.toString().length?`0${n}`:n.toString()}`,milliseconds:i}}},Ks=e=>{if(!xs(e))throw Error(`Incorrect date object: ${e}`);let t=e.toISOString();return`${t.slice(0,4)}${t.slice(5,7)}${t.slice(8,10)}`},Js=e=>{if(!xs(e))throw Error(`Incorrect date object: ${e}`);return Qs(e)},Qs=(e,t)=>{let n=e.toISOString();return`${n.slice(0,4)}${n.slice(5,7)}${n.slice(8,10)}T${n.slice(11,13)}${n.slice(14,16)}${n.slice(17,19)}${t?"":"Z"}`},Xs=e=>Object.keys(e),eo=e=>{let t="X-";for(let n of e)n===n.toUpperCase()&&(t+="-"),t+=n.toUpperCase();return t},to=(e,t)=>{let n=[],r="",i=0;for(let a=0;a<e.length;a++){let s=e[a],o="\n"===s?2:1;i+o>t?(n.push(0===n.length?r:` ${r}`),r=s,i=o):(r+=s,i+=o)}return r&&n.push(0===n.length?r:` ${r}`),n},no=(e,t)=>{let n=Xs(e),r=t.childComponents,i=r?Xs(r):[],a=t.generateArrayValues,s=a?Xs(a):[],o="";return o+=(e=>ns(`BEGIN:${e}`))(t.icsComponent),n.forEach(n=>{if(i.includes(n)||s.includes(n)||"nonStandard"===n)return;let r=t.icsKeyMap[n];if(!r)return;let a=e[n];if(null==a)return;let l=t.generateValues[n];o+=l?l({icsKey:r,value:a,key:n}):rs(r,String(a))}),r&&i&&i.length>0&&i.forEach(t=>{let n=e[t];!n||!Array.isArray(n)||0===n.length||n.forEach(e=>{let n=r[t];n&&(o+=n(e))})}),a&&s&&s.length>0&&s.forEach(n=>{let r=a[n];if(!r)return;let i=t.icsKeyMap[n];if(!i)return;let s=e[n];!s||!Array.isArray(s)||0===s.length||s.forEach(e=>{o+=r({icsKey:i,value:e})})}),e.nonStandard&&(o+=((e,t)=>{if(!e)return"";let n="";return Object.entries(e).forEach(([e,r])=>{let i=null==t?void 0:t[e];if(!i)return void(n+=rs(eo(e),null==r?void 0:r.toString()));let a=i.generate(r);a&&(n+=rs(i.name,a.value,a.options?is(Object.entries(a.options).map(([e,t])=>({key:e,value:t}))):void 0))}),n})(e.nonStandard,null==t?void 0:t.nonStandard)),o+=(e=>ns(`END:${e}`))(t.icsComponent),null!=t&&t.skipFormatLines?o:(e=>{let t=e.split(ts),n=[];return t.forEach(e=>{(e=>{let t=(e.match(/\n/g)||[]).length;return e.length+t})(e)<75?n.push(e):to(e,75).forEach(e=>{n.push(e)})}),n.join("\r\n")})(o)},ro=(e,t)=>rs(e,Math.trunc(t).toString()),io=(e,t)=>no(e,{icsComponent:"VALARM",icsKeyMap:Xa,generateValues:{trigger:({value:e})=>(e=>{var t,n;let r=is([(null==(t=e.options)?void 0:t.related)&&{key:"RELATED",value:e.options.related}].filter(e=>!!e));return"absolute"===e.type?rs("TRIGGER",Js(null==(n=e.value)?void 0:n.date)):"relative"===e.type?rs("TRIGGER",os(e.value),r):void 0})(e),duration:({icsKey:e,value:t})=>rs(e,os(t)),repeat:({icsKey:e,value:t})=>ro(e,t)},generateArrayValues:{attendees:({value:e})=>ss(e,"ATTENDEE"),attachments:({value:e})=>(e=>{if("uri"===e.type){let t=is([e.formatType&&{key:"FMTTYPE",value:e.formatType}].filter(e=>!!e));return rs("ATTACH",e.url,t)}if("binary"===e.type){let t=is([e.value&&{key:"VALUE",value:e.value},e.encoding&&{key:"ENCODING",value:e.encoding}].filter(e=>!!e));return rs("ATTACH",e.binary,t)}throw Error(`IcsAttachment has no type! ${JSON.stringify(e)}`)})(e)},nonStandard:null==t?void 0:t.nonStandard,skipFormatLines:null==t?void 0:t.skipFormatLines}),ao=(e,t,n=[],r)=>{let i=is([t.type&&{key:"VALUE",value:t.type},t.local&&!(null!=r&&r.forceUtc)&&{key:"TZID",value:t.local.timezone},...n].filter(e=>!!e)),a="DATE"===t.type?Ks(t.date):!t.local||null!=r&&r.forceUtc?Js(t.date):((e,t,n)=>{let r=t.date;if(!xs(r))throw Error(`Incorrect date object: ${r}`);return Gs(r,t.timezone,n)?Qs(r,!0):Js(e)})(t.date,t.local,null==r?void 0:r.timezones);return rs(e,a,i)},so=(e,t,n)=>rs(e,(e=>e.replace(/([\\;,])|(\n)/g,(e,t)=>t?`\\${t}`:"\\n"))(t),n?is(n):void 0),oo=(e,t)=>no(e,{icsComponent:"VEVENT",icsKeyMap:es,generateValues:{stamp:({icsKey:e,value:t})=>ao(e,t,void 0,{timezones:void 0,forceUtc:!0}),start:({icsKey:e,value:t})=>ao(e,t,void 0,{timezones:void 0}),end:({icsKey:e,value:t})=>ao(e,t,void 0,{timezones:void 0}),created:({icsKey:e,value:t})=>ao(e,t,void 0,{timezones:void 0}),lastModified:({icsKey:e,value:t})=>ao(e,t,void 0,{timezones:void 0}),categories:({icsKey:e,value:t})=>rs(e,t.join(",")),description:({icsKey:t,value:n})=>so(t,n,e.descriptionAltRep?[{key:"ALTREP",value:`"${e.descriptionAltRep}"`}]:void 0),location:({icsKey:e,value:t})=>so(e,t),comment:({icsKey:e,value:t})=>so(e,t),summary:({icsKey:e,value:t})=>so(e,t),recurrenceRule:({value:e})=>(e=>{var t;let n="",r=is([e.frequency&&{key:"FREQ",value:e.frequency},e.byDay&&{key:"BYDAY",value:e.byDay.map(e=>(e=>e.occurrence?`${e.occurrence}${e.day}`:e.day)(e)).join(",")},e.byHour&&{key:"BYHOUR",value:e.byHour.join(",")},e.byMinute&&{key:"BYMINUTE",value:e.byMinute.join(",")},e.byMonth&&{key:"BYMONTH",value:e.byMonth.map(e=>e+1).join(",")},e.byMonthday&&{key:"BYMONTHDAY",value:e.byMonthday.join(",")},e.bySecond&&{key:"BYSECOND",value:e.bySecond.join(",")},e.bySetPos&&{key:"BYSETPOS",value:e.bySetPos.join(",")},e.byWeekNo&&{key:"BYWEEKNO",value:e.byWeekNo.join(",")},e.byYearday&&{key:"BYYEARDAY",value:e.byYearday.join(",")},e.count&&{key:"COUNT",value:e.count.toString()},e.interval&&{key:"INTERVAL",value:e.interval.toString()},e.until&&{key:"UNTIL",value:"DATE"===e.until.type?Ks(e.until.date):Js((null==(t=e.until.local)?void 0:t.date)||e.until.date)},e.workweekStart&&{key:"WKST",value:e.workweekStart}].filter(e=>!!e));return n+=rs("RRULE",r),n})(e),duration:({icsKey:e,value:t})=>rs(e,os(t)),organizer:({value:e})=>(e=>{let t=is([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.name&&{key:"CN",value:e.name},e.sentBy&&{key:"SENT-BY",value:as(e.sentBy)}].filter(e=>!!e));return rs("ORGANIZER",as(e.email),t)})(e),sequence:({icsKey:e,value:t})=>ro(e,t),recurrenceId:({value:e})=>((e,t)=>{let n="";return n+=ao("RECURRENCE-ID",e.value,e.range?[{key:"RANGE",value:e.range}]:void 0,t),n})(e,{timezones:void 0})},generateArrayValues:{attendees:({value:e})=>ss(e,"ATTENDEE"),exceptionDates:({value:e})=>((e,t,n)=>ao(t,e,void 0,n))(e,"EXDATE",{timezones:void 0})},childComponents:{alarms:e=>io(e,{nonStandard:void 0,skipFormatLines:!0})},nonStandard:void 0,skipFormatLines:void 0}),lo=Object.defineProperty,uo=Object.getOwnPropertyDescriptor,co=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?uo(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&lo(t,n,a),a};let ho=class extends i{constructor(){super(...arguments),this.open=!1,this.eventDetails={heading:"",content:"",time:""},this.minimized=!1,this._handleMinimize=()=>{this.minimized=!this.minimized},this._handleClose=()=>{this.open=!1,this.minimized=!1,this.dispatchEvent(new CustomEvent("menu-close",{bubbles:!0,composed:!0}))},this._handleExport=()=>{const{heading:e,content:t,time:n,date:r}=this.eventDetails,i=r?.year??2025,a=(r?.month??4)-1,s=r?.day??18;let o,l;if("string"==typeof n){const e=n.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);e&&(o={date:new Date(i,a,s,parseInt(e[1]),parseInt(e[2]))},l={date:new Date(i,a,s,parseInt(e[3]),parseInt(e[4]))})}const d={start:{date:o&&o.date||new Date(i,a,s,12,0)},end:{date:l&&l.date||new Date(i,a,s,13,0)},summary:e,description:t,status:"CONFIRMED",uid:`${Date.now()}@lms-calendar`,stamp:{date:/* @__PURE__ */new Date}},u=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LMS Calendar//EN",oo(d).trim(),"END:VCALENDAR"].join("\r\n"),c=new Blob([u],{type:"text/calendar"}),h=URL.createObjectURL(c),m=document.createElement("a");m.href=h,m.download=`${e||"event"}.ics`,document.body.appendChild(m),m.click(),setTimeout(()=>{document.body.removeChild(m),URL.revokeObjectURL(h)},0)}}connectedCallback(){super.connectedCallback()}disconnectedCallback(){super.disconnectedCallback(),this._dragInstance?.destroy()}firstUpdated(){const e=this.renderRoot.querySelector(".header");e&&(this._dragInstance=new Ja(this,{handle:e}))}render(){return this.style.display=this.open?"":"none",a`
            <div>
                <div class="header" title=${_a()}>
                    <span class="title">${xa()}</span>
                    <button
                        @click=${this._handleMinimize}
                        title=${Na()}
                    >
                        ${this.minimized?"+":"-"}
                    </button>
                    <button
                        @click=${this._handleClose}
                        title=${Ca()}
                    >
                        ×
                    </button>
                </div>
                <div class="content" ?hidden=${this.minimized}>
                    <div
                        class="menu-item"
                        @click=${this._handleExport}
                        title=${Ea()}
                    >
                        ${Ea()}
                    </div>
                    <div class="event-details">
                        <div class="event-detail">
                            <strong>${Ta()}:</strong>
                            <span
                                >${this.eventDetails.heading||ka()}</span
                            >
                        </div>
                        <div class="event-detail">
                            <strong>${$a()}:</strong>
                            <span
                                >${this.eventDetails.time||Sa()}</span
                            >
                        </div>
                        ${this.eventDetails.date?a`<div class="event-detail">
                                  <strong>${Ma()}:</strong>
                                  <span
                                      >${this.eventDetails.date.day}/${this.eventDetails.date.month}/${this.eventDetails.date.year}</span
                                  >
                              </div>`:""}
                        ${this.eventDetails.content?a`<div class="event-detail">
                                  <strong>${Oa()}:</strong>
                                  <span>${this.eventDetails.content}</span>
                              </div>`:""}
                    </div>
                </div>
            </div>
        `}};ho.styles=r`
        :host {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000;
            background: var(--background-color);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm);
            min-width: var(--menu-min-width);
            max-width: var(--menu-max-width);
            font-family: var(--system-ui);
            transition:
                opacity 0.2s,
                visibility 0.2s;
            opacity: 1;
            visibility: visible;
        }
        .header {
            display: flex;
            align-items: center;
            gap: var(--menu-detail-gap);
            background: var(--background-color);
            cursor: grab;
            padding: var(--menu-header-padding);
            border-bottom: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
            user-select: none;
        }
        .header .title {
            flex: 1;
            font-size: var(--menu-title-font-size);
            font-weight: var(--menu-title-font-weight);
            color: var(--separator-dark);
        }
        .header button {
            background: none;
            border: 1px solid transparent;
            border-radius: var(--button-border-radius);
            cursor: pointer;
            font-size: var(--menu-title-font-size);
            line-height: 1;
            padding: var(--menu-button-padding);
            width: var(--menu-button-size);
            height: var(--menu-button-size);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--header-text-color);
            transition:
                background-color 0.15s,
                color 0.15s;
        }
        .header button:hover {
            background-color: var(--separator-light);
            color: var(--separator-dark);
        }
        .content {
            padding: var(--menu-content-padding);
            display: block;
            font-size: var(--menu-content-font-size);
        }
        .content[hidden] {
            display: none;
        }
        .menu-item {
            padding: var(--menu-item-padding);
            margin-bottom: var(--menu-item-margin-bottom);
            background: var(--separator-light);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            font-weight: var(--menu-item-font-weight);
            text-align: center;
            transition:
                background-color 0.15s,
                color 0.15s;
            border: 1px solid transparent;
        }
        .menu-item:hover {
            background: var(--primary-color);
            color: white;
        }
        .event-details {
            display: flex;
            flex-direction: column;
            gap: var(--menu-detail-gap);
        }
        .event-detail {
            display: flex;
            align-items: flex-start;
            gap: var(--menu-detail-gap);
        }
        .event-detail strong {
            min-width: var(--menu-detail-label-min-width);
            font-weight: var(--menu-item-font-weight);
            color: var(--header-text-color);
            font-size: var(--menu-detail-label-font-size);
        }
        .event-detail span {
            flex: 1;
            color: var(--separator-dark);
            word-break: break-word;
        }
    `,co([u({type:Boolean})],ho.prototype,"open",2),co([u({type:Object})],ho.prototype,"eventDetails",2),co([d()],ho.prototype,"minimized",2),ho=co([l("lms-menu"),D()],ho);class mo{constructor({date:e,direction:t}){e&&(this.date=e),this._direction=t}set date(e){const t=ni.fromObject(e);if(!t.isValid)throw new Error("date couldn't be converted to DateTime object");this._date=t}set direction(e){this._direction=e}_toCalendarDate(e){return{day:e.day,month:e.month,year:e.year}}getDateByDayInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set or invalid");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({days:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}getDateByMonthInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({months:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}}var fo=Object.defineProperty,yo=Object.getOwnPropertyDescriptor,go=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?yo(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&fo(t,n,a),a};let po=class extends i{constructor(){super(...arguments),this.currentDate=/* @__PURE__ */new Date,this.activeDate={day:this.currentDate.getDate(),month:this.currentDate.getMonth()+1,year:this.currentDate.getFullYear()}}connectedCallback(){super.connectedCallback(),this.addEventListener("open-menu",e=>{const t=e;if(e.target!==this){e.stopPropagation();const n=new CustomEvent("open-menu",{detail:t.detail,bubbles:!0,composed:!0});this.dispatchEvent(n)}}),this._setupScrollDetection()}_setupScrollDetection(){let e=null;this.updateComplete.then(()=>{const t=this.shadowRoot?.querySelectorAll(".day");t?.forEach(t=>{const n=t;n.addEventListener("scroll",()=>(t=>{e||(e=requestAnimationFrame(()=>{t.scrollTop>5?t.classList.add("scrolled"):t.classList.remove("scrolled"),e=null}))})(n),{passive:!0})})})}_isCurrentDate(e){return new Date(e).toDateString()===this.currentDate.toDateString()}_renderIndicator({year:e,month:t,day:n}){const r=this._isCurrentDate(`${e}/${t}/${n}`),i=t===this.activeDate.month&&e===this.activeDate.year;return a` <div
            class="indicator ${c({current:r})}"
        >
            ${Xi([n,i]).with([1,!0],()=>a` ${n}. ${oa(t)} `).with([1,!1],()=>a` ${n}. ${oa(t)} `).otherwise(()=>a` ${n} `)}
        </div>`}render(){return a`
            <div class="month">
                ${this._getCalendarArray()?.map(({year:e,month:t,day:n})=>a`<div
                            class="day"
                            data-date="${e}-${t}-${n}"
                            @click=${this._dispatchExpand}
                            @keydown=${this._handleKeydown}
                            tabindex="0"
                        >
                            ${this._renderIndicator({year:e,month:t,day:n})}
                            <slot name="${e}-${t}-${n}"></slot>
                        </div>`)}
            </div>
        `}_dispatchExpand(e){const t=e.target;if(!(t instanceof HTMLElement))return;if(t.closest("lms-calendar-entry"))return;const{date:n}=t.dataset;if(!n)return;const[r,i,a]=n.split("-").map(e=>parseInt(e,10)),s=new CustomEvent("expand",{detail:{date:{day:a,month:i,year:r}},bubbles:!0,composed:!0});this.dispatchEvent(s)}_handleKeydown(e){const t=e.key;"Space"!==t&&"Enter"!==t||this._dispatchExpand(e)}_getDaysInMonth(e){return Xi(e).with({year:Ki.number,month:Ki.number,day:Ki.number},({year:e,month:t})=>{const n=new Date(e,t,0).getDate();return n>0?n:0}).otherwise(()=>0)}_getOffsetOfFirstDayInMonth(e){return Xi(e).with({year:Ki.number,month:Ki.number},({year:e,month:t})=>{const n=/* @__PURE__ */new Date(`${e}/${t}/01`).getDay();return 0===n?6:n-1}).otherwise(()=>0)}_getDatesInMonthAsArray(e,t){return Xi(this._getDaysInMonth(e)).with(0,()=>[]).otherwise(n=>Array.from(Array(n).keys(),(t,n)=>({year:e.year,month:e.month,day:n+1})).slice(...t||[0]))}_getCalendarArray(){if(!this.activeDate)return[];const e=new mo({date:this.activeDate});try{e.direction="previous";const t=this._getOffsetOfFirstDayInMonth(this.activeDate),n=t>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[-t]):[],r=this._getDatesInMonthAsArray(this.activeDate,[]);e.date=this.activeDate,e.direction="next";const i=42-(n.length+r.length),a=i>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[0,i]):[];return n.concat(r,a)}catch(t){return console.error("Error generating calendar array:",t),[]}}};po.styles=r`
        .month {
            height: calc(100% - var(--month-header-context-height, 5.5em) + 2px);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-top: 1px solid var(--separator-light);
        }

        .month > div {
            border-bottom: 1px solid var(--separator-light);
            border-right: 1px solid var(--separator-light);
        }

        .month > div:nth-child(7n + 7) {
            border-right: none;
        }

        .month > div:nth-last-child(-n + 7) {
            border-bottom: none;
        }

        .day {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            overflow-y: auto;
            gap: var(--month-day-gap, 1px);
            min-width: 0;
        }

        /* Ensure consistent multi-day event layering */
        ::slotted(lms-calendar-entry) {
            position: relative;
            margin-left: 1em;
            width: calc(100% - 1em);
        }

        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .indicator {
            position: sticky;
            top: 0.25em;
            left: 0.25em;
            z-index: 500;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            text-align: center;
            min-width: 2em;
            min-height: 2em;
            line-height: 2em;
            margin: 0.25em;
            border-radius: 1em;
            align-self: flex-start;
            transition: opacity 0.2s ease-in-out;
            opacity: 1;
            padding: 0 0.25em;
            white-space: nowrap;
        }

        .day.scrolled .indicator {
            opacity: 0;
        }
    `,go([u({attribute:!1})],po.prototype,"activeDate",2),po=go([l("lms-calendar-month"),D()],po);var vo=Object.defineProperty,wo=Object.getOwnPropertyDescriptor,bo=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?wo(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&vo(t,n,a),a};let ko=class extends i{constructor(){super(...arguments),this.activeDate={day:/* @__PURE__ */(new Date).getDate(),month:/* @__PURE__ */(new Date).getMonth()+1,year:/* @__PURE__ */(new Date).getFullYear()},this.allDayRowCount=0}connectedCallback(){super.connectedCallback()}_getWeekDates(){const e=new Date(this.activeDate.year,this.activeDate.month-1,this.activeDate.day),t=e.getDay(),n=0===t?-6:1-t,r=new Date(e);return r.setDate(e.getDate()+n),Array.from({length:7},(e,t)=>{const n=new Date(r);return n.setDate(r.getDate()+t),{day:n.getDate(),month:n.getMonth()+1,year:n.getFullYear()}})}_isCurrentDate(e){const t=/* @__PURE__ */new Date;return e.day===t.getDate()&&e.month===t.getMonth()+1&&e.year===t.getFullYear()}render(){const e=this._getWeekDates(),t=this.allDayRowCount>0;return a`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${e.map((e,t)=>a`
                            <div
                                class="day-label ${c({current:this._isCurrentDate(e)})}"
                                tabindex="0"
                                role="button"
                                aria-label="Switch to day view for ${la(t+1)}, ${e.day}"
                                @click=${()=>this._handleDayLabelClick(e)}
                                @keydown=${t=>this._handleDayLabelKeydown(t,e)}
                            >
                                <span class="day-name">${la(t+1)}</span>
                                <span class="day-number">${e.day}</span>
                            </div>
                        `)}
                </div>

                <!-- All-day events section -->
                <div
                    class="all-day-wrapper ${c({collapsed:!t})}"
                >
                    <div class="all-day-container">
                        <div class="all-day-time-header">All Day</div>
                        ${e.map(e=>a`
                                <div class="all-day-day-column">
                                    <slot
                                        name="all-day-${e.year}-${e.month}-${e.day}"
                                    ></slot>
                                </div>
                            `)}
                    </div>
                </div>
                <div class="week-content">
                    <!-- Hour indicators -->
                    ${Array.from({length:25}).map((e,t)=>a`
                            <div
                                class="hour-indicator"
                                style="grid-column: 1; grid-row: ${60*t+1};"
                            >
                                ${this._renderIndicatorValue(t)}
                            </div>
                        `)}

                    <!-- Hour separators -->
                    ${Array.from({length:25}).map((e,t)=>a`
                            ${t>0?a`
                                      <div
                                          class="hour-separator"
                                          style="grid-column: 2 / -1; grid-row: ${60*t};"
                                      ></div>
                                  `:""}
                        `)}

                    <!-- Hour slots for each day -->
                    ${e.map((e,t)=>a`
                            ${Array.from({length:25}).map((n,r)=>a`
                                    <div
                                        class="hour-slot-container"
                                        style="grid-column: ${t+2}; grid-row: ${60*r+1} / ${60*(r+1)+1}; position: relative;"
                                    >
                                        <slot
                                            name="${e.year}-${e.month}-${e.day}-${r}"
                                            data-debug="Day ${t+1} (${e.month}/${e.day}) Hour ${r}"
                                        ></slot>
                                    </div>
                                `)}
                        `)}

                    <!-- Fallback slot for direct grid positioned entries -->
                    <slot
                        name="week-direct-grid"
                        style="display: contents;"
                    ></slot>
                </div>
            </div>
        `}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}_handleDayLabelClick(e){const t=new CustomEvent("expand",{detail:{date:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleDayLabelKeydown(e,t){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._handleDayLabelClick(t))}};function Do(e){let t=0,n=0,r=0;if(!e||!e.trim())return["rgb(255,255,255)","rgb(0,0,0)"];const i=(e.startsWith("#")?e:`#${e}`).replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,(e,t,n,r)=>`#${t}${t}${n}${n}${r}${r}`).substring(1).match(/.{2}/g);if(!i||3!==i.length)return["rgb(255,255,255)","rgb(0,0,0)"];try{if([t,n,r]=i.map(e=>parseInt(e,16)),isNaN(t)||isNaN(n)||isNaN(r))return["rgb(255,255,255)","rgb(0,0,0)"]}catch{return["rgb(255,255,255)","rgb(0,0,0)"]}const a=(299*t+587*n+114*r)/1e3;return[`rgb(${t},${n},${r})`,Math.abs(a-255)>Math.abs(a-0)?"rgb(255, 255, 255)":"rgb(0, 0, 0)"]}ko.styles=r`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .week-container {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            overflow: hidden;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            height: var(--day-header-height, 3.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
        }

        .time-header {
            border-right: 1px solid var(--separator-light);
        }

        .day-label {
            text-align: center;
            padding: var(--day-padding, 0.5em);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: var(--day-label-gap, 0.15em);
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .day-name {
            font-size: var(--day-label-name-font-size, 0.75em);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            opacity: 0.7;
        }

        .day-number {
            font-size: var(--day-label-number-font-size, 1.125em);
            font-weight: var(--day-label-number-font-weight, 600);
            line-height: 1;
        }

        .day-label:hover {
            background-color: var(--separator-light);
        }

        .day-label:focus {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
            background-color: var(--separator-light);
        }

        .day-label:last-child {
            border-right: none;
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .week-content {
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            position: relative;
        }

        .time-slots {
            grid-column: 1;
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            background: var(--background-color, white);
        }

        .hour-indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .week-days {
            display: contents;
        }

        .day-column {
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            position: relative;
        }

        .day-column:last-child {
            border-right: none;
        }

        .hour-separator {
            grid-column: 2 / 3;
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .hour-slot-container {
            overflow: hidden;
        }

        /* All-day events section */
        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            transition: grid-template-rows 0.2s ease;
            border-bottom: var(--separator-border);
            background: var(--background-color);
            z-index: 2;
            position: relative;
        }

        .all-day-wrapper.collapsed {
            grid-template-rows: 0fr;
            overflow: hidden;
            border-bottom: none;
        }

        .all-day-container {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            overflow: hidden;
        }

        .all-day-day-column {
            position: relative;
            min-height: 2em;
            padding: 0.25em 0;
        }

        /* Stack all-day events vertically with consistent positioning */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry) {
            position: relative !important;
            display: block !important;
            margin-bottom: 0.25em !important;
            z-index: var(--entry-z-index, 1) !important;
        }

        /* Enhanced multi-day spanning styles with consistent ordering */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.first-day) {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: var(--entry-border-radius) !important;
            border-bottom-left-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.middle-day) {
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.last-day) {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-top-right-radius: var(--entry-border-radius) !important;
            border-bottom-right-radius: var(--entry-border-radius) !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.single-day) {
            border-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-time-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
        }
    `,bo([u({attribute:!1})],ko.prototype,"activeDate",2),bo([u({type:Number})],ko.prototype,"allDayRowCount",2),ko=bo([l("lms-calendar-week"),D()],ko);class So{constructor(e={}){this.config={minuteHeight:e.minuteHeight??1,eventMinHeight:e.eventMinHeight??20}}calculateLayout(e){const t=this.eventsToIntervals(e),n=this.calculateGrading(t);return{boxes:this.calculateBoxes(e,n)}}eventsToIntervals(e){return e.map(e=>({start:60*e.startTime.hour+e.startTime.minute,end:60*e.endTime.hour+e.endTime.minute}))}calculateGrading(e){const t=[];return this.findOverlapGroups(e).forEach((n,r)=>{if(1===n.length)t.push({index:n[0],depth:0,group:r});else{const i=n.map(t=>({...e[t],originalIndex:t})),a=i.reduce((e,t)=>t.end-t.start>e.end-e.start?t:e);let s=1;i.forEach(e=>{const n=e.originalIndex===a.originalIndex?0:s++;t.push({index:e.originalIndex,depth:n,group:r})})}}),t.sort((e,t)=>e.index-t.index),t}findOverlapGroups(e){const t=[],n=/* @__PURE__ */new Set;return e.forEach((r,i)=>{if(n.has(i))return;const a=[i];n.add(i);let s=!0;for(;s;)s=!1,e.forEach((t,r)=>{if(n.has(r))return;a.some(n=>this.intervalsOverlap(e[n],t))&&(a.push(r),n.add(r),s=!0)});t.push(a)}),t}intervalsOverlap(e,t){return e.start<t.end&&t.start<e.end}calculateBoxes(e,t){const n=/* @__PURE__ */new Map;return e.forEach((e,r)=>{const i=t[r]||{depth:0,group:r};n.has(i.group)||n.set(i.group,[]),n.get(i.group).push({event:e,index:r,grade:i})}),e.map((e,r)=>{const i=t[r]||{depth:0,group:r},a=60*e.startTime.hour+e.startTime.minute,s=60*e.endTime.hour+e.endTime.minute-a,o=n.get(i.group)||[],l=Math.max(...o.map(e=>e.grade.depth));let d,u;if(1===o.length)d=100,u=0;else{const e=100-65;0===i.depth?(u=0,d=100):(u=l>0?i.depth/l*e:0,d=100-u)}const c=100+i.depth;return{id:e.id,x:u,y:a*this.config.minuteHeight,width:d,height:Math.max(s*this.config.minuteHeight,this.config.eventMinHeight),depth:i.depth,group:i.group,opacity:0===i.depth?.95:Math.max(.85,.95-.05*i.depth),zIndex:c}})}}const xo=new class{calculatePosition(e){const{viewMode:t,date:n,time:r,isAllDay:i}=e;switch(t){case"day":return this._calculateDayPosition(n,r,i);case"week":return this._calculateWeekPosition(n,e.activeDate,r,i);case"month":return this._calculateMonthPosition(n);default:throw new Error(`Unsupported view mode: ${t}`)}}generatePositionCSS(e,t,n){if(e.useDirectGrid){const n=String(e.gridColumn||2),r=e.gridRow||"1",i=String(t.width),a=String(t.x),s=String(t.zIndex),l=String(t.opacity);return o(`\n                grid-column: ${n};\n                grid-row: ${r};\n                --entry-width: ${i}%;\n                --entry-margin-left: ${a}%;\n                --entry-z-index: ${s};\n                --entry-opacity: ${l};\n            `)}{const e=n?this._getGridSlotByTime(n):"1",r=String(t.width),i=String(t.x),a=String(t.zIndex),s=String(t.opacity);return o(`\n                --start-slot: ${e};\n                --entry-width: ${r}%;\n                --entry-margin-left: ${i}%;\n                --entry-z-index: ${a};\n                --entry-opacity: ${s};\n            `)}}_calculateDayPosition(e,t,n){if(n)return{slotName:"all-day",useDirectGrid:!1};if(!t)throw new Error("Day view entries must have time information");return{slotName:t.start.hour.toString(),useDirectGrid:!1}}_calculateWeekPosition(e,t,n,r){const i=this.getWeekDayIndex(e,t),a=i+2;if(r)return{slotName:`all-day-${e.year}-${e.month}-${e.day}`,gridColumn:a,gridRow:"1 / 60",useDirectGrid:!1,isAllDay:!0,dayIndex:i};if(!n)throw new Error("Week view timed entries must have time information");return{slotName:"",gridColumn:a,gridRow:this._getGridSlotByTime(n),useDirectGrid:!0}}_calculateMonthPosition(e){return{slotName:`${e.year}-${e.month}-${e.day}`,useDirectGrid:!1}}getWeekDayIndex(e,t){const n=new Date(t.year,t.month-1,t.day),r=n.getDay(),i=0===r?-6:1-r,a=new Date(n);a.setDate(n.getDate()+i);const s=Array.from({length:7},(e,t)=>{const n=new Date(a);return n.setDate(a.getDate()+t),{day:n.getDate(),month:n.getMonth()+1,year:n.getFullYear()}}).findIndex(t=>t.day===e.day&&t.month===e.month&&t.year===e.year);return s>=0?s:0}_getGridSlotByTime({start:e,end:t}){const n=60*e.hour+(e.minute+1),r=n+(60*t.hour+t.minute-n);return n===r?`${n}/${r+1}`:`${n}/${r}`}calculateAccessibility(e){const{viewMode:t,date:n,time:r,isAllDay:i}=e;let a=0;if("week"===t&&r&&!i){a=1e4+1e4*this.getWeekDayIndex(n,e.activeDate)+100*r.start.hour+r.start.minute}else if("day"===t&&r&&!i)a=60*r.start.hour+r.start.minute;else if(i)if("week"===t){a=1e3+this.getWeekDayIndex(n,e.activeDate)}else a=0;return{tabIndex:a,role:"button",ariaLabel:this._generateAriaLabel(e)}}_generateAriaLabel(e){const{date:t,time:n,isAllDay:r}=e;return`Calendar event on ${`${t.month}/${t.day}/${t.year}`}, ${r||!n?"All day":`${String(n.start.hour).padStart(2,"0")}:${String(n.start.minute).padStart(2,"0")} to ${String(n.end.hour).padStart(2,"0")}:${String(n.end.minute).padStart(2,"0")}`}. Press Enter or Space to open details.`}getPositionDescription(e){const t=this.calculatePosition(e);return t.useDirectGrid?`Direct grid: column ${t.gridColumn}, row ${t.gridRow}`:`Slot: "${t.slotName}"`}validatePosition(e){try{return this.calculatePosition(e),{valid:!0}}catch(t){return{valid:!1,error:t instanceof Error?t.message:"Unknown validation error"}}}};class Eo{constructor(e){this._viewMode="month",this._host=e,e.addController(this);const t=/* @__PURE__ */new Date;this._activeDate={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()}}hostConnected(){}get viewMode(){return this._viewMode}get activeDate(){return this._activeDate}get expandedDate(){return"day"===this._viewMode?this._activeDate:void 0}setViewMode(e){this._viewMode=e,this._host.requestUpdate()}setActiveDate(e){this._activeDate=e,this._host.requestUpdate()}navigateNext(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()+7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day+1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}navigatePrevious(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month-2,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()-7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day-1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}jumpToToday(){const e=/* @__PURE__ */new Date;this.setActiveDate({day:e.getDate(),month:e.getMonth()+1,year:e.getFullYear()})}switchToMonthView(){this.setViewMode("month")}switchToWeekView(){this.setViewMode("week")}switchToDayView(){this.setViewMode("day")}}var To=Object.defineProperty,$o=Object.getOwnPropertyDescriptor,Mo=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?$o(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&To(t,n,a),a};let Oo=class extends i{constructor(){super(...arguments),this._viewState=new Eo(this),this.entries=[],this.color="#000000",this._calendarWidth=window.innerWidth,this._menuOpen=!1,this._layoutCalculator=new So({timeColumnWidth:80,minuteHeight:1,eventMinHeight:20,cascadeOffset:15,paddingLeft:10}),this._handleResize=e=>{const[t]=e;this._calendarWidth=t.contentRect.width||this._calendarWidth},this._resizeController=new m(this,{target:null,callback:this._handleResize,skipInitial:!0})}get activeDate(){return this._viewState.activeDate}set activeDate(e){this._viewState.setActiveDate(e)}get _expandedDate(){return this._viewState.expandedDate}firstUpdated(e){const t=this.shadowRoot?.firstElementChild;if(!t)return;this._resizeController.observe(t);const n=document.documentElement.lang?.slice(0,2);n&&["de","en"].includes(n)&&async function(e){await ia(e)}(n)}willUpdate(e){this.entries.length&&(this.entries=si(this.entries,mi(e=>cr.fromDateTimes(ni.fromObject(xi(e.date.start,e.time.start)),ni.fromObject(xi(e.date.end,e.time.end))).isValid),function(...e){return ii($i,e)}((e,t)=>e.time.start.hour-t.time.start.hour||e.time.start.minute-t.time.start.minute)))}render(){const e=this._viewState.viewMode,t=this._viewState.activeDate;return a`
            <div>
                <lms-calendar-header
                    @switchdate=${this._handleSwitchDate}
                    @switchview=${this._handleSwitchView}
                    @jumptoday=${this._handleJumpToday}
                    .heading=${this.heading}
                    .activeDate=${t}
                    .viewMode=${e}
                    .expandedDate=${"day"===e?t:void 0}
                >
                </lms-calendar-header>

                ${"month"===e?a`
                          <lms-calendar-context> </lms-calendar-context>

                          <lms-calendar-month
                              @expand=${this._handleExpand}
                              @open-menu=${this._handleOpenMenu}
                              @clear-other-selections=${this._handleClearOtherSelections}
                              .activeDate=${t}
                          >
                              ${this._calendarWidth<768?this._renderEntriesSumByDay():this._renderEntries()}
                          </lms-calendar-month>
                      `:s}
                ${"week"===e?(()=>{const e=this._renderEntriesByDate();return a`
                                  <lms-calendar-week
                                      @expand=${this._handleExpand}
                                      @open-menu=${this._handleOpenMenu}
                                      @clear-other-selections=${this._handleClearOtherSelections}
                                      .activeDate=${t}
                                      .allDayRowCount=${e.allDayRowCount}
                                  >
                                      ${e.elements}
                                  </lms-calendar-week>
                              `})():s}
                ${"day"===e?(()=>{const e=this._renderEntriesByDate();return a`
                                  <lms-calendar-day
                                      @open-menu=${this._handleOpenMenu}
                                      @clear-other-selections=${this._handleClearOtherSelections}
                                      .allDayRowCount=${e.allDayRowCount}
                                  >
                                      ${e.elements}
                                  </lms-calendar-day>
                              `})():s}

                <lms-menu
                    ?open=${this._menuOpen}
                    .eventDetails=${this._menuEventDetails||{heading:"",content:"",time:""}}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `}_handleSwitchDate(e){"next"===e.detail.direction?this._viewState.navigateNext():"previous"===e.detail.direction&&this._viewState.navigatePrevious()}_handleSwitchView(e){return Xi(e.detail.view).with("day",()=>this._viewState.switchToDayView()).with("week",()=>this._viewState.switchToWeekView()).with("month",()=>this._viewState.switchToMonthView()).otherwise(()=>{})}_handleJumpToday(e){this._viewState.jumpToToday()}_handleExpand(e){this._viewState.setActiveDate(e.detail.date),this._viewState.switchToDayView()}_handleOpenMenu(e){const t=e.target;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()}),this.openMenu(e.detail)}_handleClearOtherSelections(e){const t=e.detail.exceptEntry;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()})}_handleMenuClose(){this._menuOpen=!1,this._menuEventDetails=void 0}openMenu(e){this._menuEventDetails=e,this._menuOpen=!0}_composeEntry({index:e,slot:t,styles:n,entry:r,isContinuation:i=!1,density:s,displayMode:o="default",floatText:l=!1,spanClass:d}){const u=s||this._determineDensity(r,void 0,void 0,void 0);return a`
            <style>
                ${n}
            </style>
            <lms-calendar-entry
                class=${`_${e}${d?` ${d}`:""}`}
                slot=${t}
                .time=${r.time}
                .heading=${r.heading??""}
                .content=${r.content}
                .isContinuation=${i??!1}
                .date=${r.date}
                .density=${u}
                .displayMode=${o}
                .floatText=${l}
                .accessibility=${r.accessibility}
            >
            </lms-calendar-entry>
        `}_getEntriesCountForDay(e){return this.entries.filter(t=>{const n=ni.fromObject(t.date.start),r=ni.fromObject(t.date.end),i=ni.fromObject(e);return i>=n&&i<=r}).length}_determineDensity(e,t,n,r){if(!e.time)return"compact";if(n&&void 0!==r&&n[r])return"standard";const i=60*(e.time.end.hour-e.time.start.hour)+(e.time.end.minute-e.time.start.minute);return i<30?"compact":i>120&&e.content?"full":"standard"}_expandEntryMaybe({entry:e,range:t}){return Array.from({length:t[2]},(n,r)=>{const i=ni.fromJSDate(t[0]).plus({days:r}),a=i.plus({days:1}).minus({seconds:1});return{...e,date:{start:i.toObject(),end:a.toObject()},isContinuation:r>0,continuation:{has:t[2]>1,is:r>0,index:r,total:t[2]},originalStartDate:e.date?.start}})}_createConsistentEventId(e){const t=e.originalStartDate||e.date?.start;return t?`${e.heading||"unknown"}-${t.year}-${t.month}-${t.day}-${e.time?.start.hour||0}-${e.time?.start.minute||0}`:`${e.heading||"unknown"}-fallback`}_renderEntries(){if(!this.entries.length)return s;const e=/* @__PURE__ */new Map;return this.entries.forEach((t,n)=>{e.set(this._createConsistentEventId(t),n)}),si(this.entries,gi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return ui(Mi,e)}(t=>{const n=this._createConsistentEventId(t),r=e.get(n)||0,i=t;return i.continuation?.has||!1?r-1e3:r}),ki(e=>[e,...Do(e.color)]),ki(([t,n,i],a)=>{const s=this._createConsistentEventId(t),l=e.get(s)||a,d=t.isContinuation||t.continuation?.has||!1?"all-day-":"";return this._composeEntry({index:l,slot:`${d}${t.date.start.year}-${t.date.start.month}-${t.date.start.day}`,styles:r`
                        lms-calendar-entry._${l} {
                            --entry-color: ${o(n)};
                            --entry-background-color: ${o(n)};
                            /* Add z-index based on original order for consistent layering */
                            z-index: ${100+l};
                        }
                    `,entry:{time:t.time,heading:t.heading,content:t.content,date:t.date,isContinuation:t.isContinuation||!1,continuation:t.continuation},density:this._determineDensity({time:t.time,heading:t.heading,content:t.content},this._getEntriesCountForDay(t.date.start),void 0,void 0),displayMode:"month-dot"})}))}_renderEntriesByDate(){const e=this._viewState.activeDate,t=this._viewState.viewMode;if("day"!==t&&"week"!==t)return s;const n=si(this.entries,gi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),mi(n=>{if("day"===t)return function(...e){return ii(bi,e)}(ni.fromObject(n.date.start).toISODate(),ni.fromObject(e).toISODate());{const t=this._getWeekStartDate(e),r=Array.from({length:7},(e,n)=>{const r=new Date(t);return r.setDate(t.getDate()+n),ni.fromJSDate(r).toISODate()}),i=ni.fromObject(n.date.start).toISODate();return r.includes(i)}})),r=n.filter(e=>!e.time||e.time&&Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has),i=n.filter(e=>!(!e.time||Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has));return i.length||r.length?this._renderEntriesWithSlotManager(t,e,r,i):{elements:s,allDayRowCount:0}}_renderEntriesWithSlotManager(e,t,n,i){const a=[];if(i.length>0)if("week"===e){const n=function(...e){return ii(wi,e)}(i,e=>`${e.date.start.year}-${e.date.start.month}-${e.date.start.day}`);Object.entries(n).map(([e,t])=>({dayKey:e,dayEntries:t})).filter(({dayEntries:e})=>e&&e.length>0).sort((e,n)=>{const r=e.dayEntries[0],i=n.dayEntries[0];if(!(r&&i&&r.date&&i.date))return 0;return xo.getWeekDayIndex(r.date.start,t)-xo.getWeekDayIndex(i.date.start,t)}).forEach(({dayEntries:n})=>{const r=this._renderDayEntriesWithSlotManager(n,e,t,i);a.push(...r)})}else{const n=this._renderDayEntriesWithSlotManager(i,e,t,i);a.push(...n)}const s=n.map(n=>({id:this._createConsistentEventId(n),days:["week"===e?xo.getWeekDayIndex(n.date.start,t):0],isMultiDay:n.continuation?.is||n.continuation?.has||!1})),l=/* @__PURE__ */new Map;s.forEach(e=>{const t=l.get(e.id);t?t.days.push(...e.days):l.set(e.id,{...e,days:[...e.days]})});const{rowAssignments:d,totalRows:u}=function(e){const t=/* @__PURE__ */new Map;if(0===e.length)return{rowAssignments:t,totalRows:0};const n=[],r=[];e.forEach(e=>{e.isMultiDay?n.push(e):r.push(e)}),n.sort((e,t)=>{const n=Math.min(...e.days),r=Math.min(...t.days);return n!==r?n-r:e.id.localeCompare(t.id)}),r.sort((e,t)=>Math.min(...e.days)-Math.min(...t.days));const i=/* @__PURE__ */new Map;for(let s=0;s<7;s++)i.set(s,/* @__PURE__ */new Set);n.forEach(e=>{let n=0,r=!1;for(;!r;){let a=!0;for(const t of e.days)if(i.get(t)?.has(n)){a=!1;break}if(a){r=!0,t.set(e.id,n);for(const t of e.days)i.get(t)?.add(n)}else n++}}),r.forEach(e=>{const n=e.days[0];let r=0;for(;i.get(n)?.has(r);)r++;t.set(e.id,r),i.get(n)?.add(r)});let a=0;return i.forEach(e=>{a=Math.max(a,e.size)}),{rowAssignments:t,totalRows:a}}(Array.from(l.values()));return{elements:[...n.map((n,a)=>{const[s,u]=Do(n.color),c=this._createConsistentEventId(n),h={viewMode:e,date:n.date.start,isAllDay:!0,activeDate:t},m=xo.calculatePosition(h),f=xo.calculateAccessibility(h),y=d.get(c)??0,g={width:100,x:0,zIndex:100+y,opacity:1},p=xo.generatePositionCSS(m,g),v=n.continuation;let w="single-day";if((v?.has||v?.is||!1)&&v){const r=l.get(c),i=[...r?.days??[]].sort((e,t)=>e-t),a="week"===e?xo.getWeekDayIndex(n.date.start,t):0;w=function(e){const{continuationIndex:t,totalDays:n,visibleStartIndex:r,visibleEndIndex:i}=e;if(n<=1)return"single-day";const a=t===r,s=t===i;return a&&s?"single-day":a?"first-day":s?"last-day":"middle-day"}({continuationIndex:a,totalDays:v.total,visibleStartIndex:i[0]??a,visibleEndIndex:i[i.length-1]??a})}return this._composeEntry({index:a+i.length,slot:m.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${a+i.length} {
                        --entry-background-color: ${o(s)};
                        --entry-color: ${o(u)};
                        order: ${y};
                        ${p};
                    }
                `,entry:{...n,accessibility:f},density:"standard",floatText:!1,spanClass:w})}),...a],allDayRowCount:u}}_renderDayEntriesWithSlotManager(e,t,n,i){const a=e.map((e,t)=>({id:String(t),heading:e.heading||"",startTime:{hour:e.time.start.hour,minute:e.time.start.minute},endTime:{hour:e.time.end.hour,minute:e.time.end.minute},color:e.color||"#1976d2"})),s=this._layoutCalculator.calculateLayout(a);return e.map((e,a)=>{const l=s.boxes[a],d=i.indexOf(e),u={viewMode:t,date:e.date.start,time:e.time,activeDate:n,isAllDay:e.isContinuation||this._isAllDayEvent(e)},c=xo.calculatePosition(u),h=xo.calculateAccessibility(u),m={width:l.width,x:l.x,zIndex:l.zIndex,opacity:l.opacity,height:l.height},f=xo.generatePositionCSS(c,m,e.time);return this._composeEntry({index:d,slot:c.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${d} {
                        --entry-background-color: rgba(250, 250, 250, 0.8);
                        --entry-color: #333;
                        --entry-border: 1px solid rgba(0, 0, 0, 0.15);
                        --entry-handle-color: ${o(e.color||"#1976d2")};
                        --entry-handle-width: 4px;
                        --entry-handle-display: block;
                        --entry-padding-left: calc(4px + 0.35em);
                        --entry-layout: ${o(this._getSmartLayout(e,l.height,l.width,{depth:l.depth,opacity:l.opacity}))};
                        ${f};
                    }
                `,entry:{...e,accessibility:h},density:"standard",floatText:!1})})}_renderEntriesSumByDay(){return si(this.entries,gi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return ii(Ti,e)}((e,t)=>{const n=`${t.date.start.day}-${t.date.start.month}-${t.date.start.year}`;return e[n]=e[n]?e[n]+1:1,e},{}),Object.entries,ki(([e,t],n)=>this._composeEntry({index:n,slot:e.split("-").reverse().join("-"),styles:r`
                        lms-calendar-entry._${n} {
                            --entry-color: var(--separator-mid);
                            text-align: center;
                        }
                    `,entry:{heading:`${t} events`},displayMode:"month-dot"})))}_getWeekStartDate(e){const t=new Date(e.year,e.month-1,e.day),n=t.getDay(),r=0===n?-6:1-n,i=new Date(t);return i.setDate(t.getDate()+r),i}_getSmartLayout(e,t,n,r){if(!e.time)return"row";if(!(r&&r.depth>0))return"row";return t>=40?"column":"row"}_getDaysRange(e){const{start:t,end:n}=e,r=new Date(t.year,t.month-1,t.day),i=new Date(n.year,n.month-1,n.day);return[r,i,(i.getTime()-r.getTime())/864e5+1]}_isAllDayEvent(e){if(!e.time)return!0;const{start:t,end:n}=e.time;return 0===t.hour&&0===t.minute&&23===n.hour&&59===n.minute}};Oo.styles=r`
        :host {
            --shadow-sm: rgba(0, 0, 0, 0.18) 0px 2px 4px;
            --shadow-md: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px;
            --shadow-lg: rgba(0, 0, 0, 0.15) 0px 2px 8px;
            --shadow-hv: rgba(0, 0, 0, 0.08) 0px 4px 12px;

            --breakpoint-xs: 425px;
            --breakpoint-sm: 768px;
            --breakpoint-md: 1024px;

            --separator-light: rgba(0, 0, 0, 0.1);
            --separator-mid: rgba(0, 0, 0, 0.4);
            --separator-dark: rgba(0, 0, 0, 0.7);

            --system-ui:
                system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
                'Segoe UI Emoji', 'Segoe UI Symbol';
            --monospace-ui:
                'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: white;
            --primary-color: dodgerblue;

            --height: 100%;
            --width: 100%;

            /* Entry design tokens - responsive and density-aware */
            --entry-font-size: 0.8rem;
            --entry-line-height: 1.3;
            --entry-min-height: 1.2em;
            --entry-border-radius: var(--border-radius-sm);
            --entry-background-color: var(--background-color);
            --entry-color: var(--primary-color);
            --entry-highlight-color: var(--separator-light);
            --entry-focus-color: var(--primary-color);
            --entry-padding: 0.2em 0.35em;
            --entry-font-family: system-ui;
            --entry-gap: 0.25em;

            /* Month view dot indicator tokens */
            --entry-dot-size: 0.5em;
            --entry-dot-margin: 0.25em;
            --entry-month-background: transparent;
            --entry-month-padding: 0.1em 0.3em 0.1em 0;
            --entry-time-font: var(--monospace-ui);
            --entry-time-align: right;
            --entry-month-text-color: var(--separator-dark);

            /* Entry typography tokens */
            --entry-title-weight: 500;
            --entry-title-wrap: nowrap;
            --entry-time-font-size: 0.85em;
            --entry-time-opacity: 0.8;

            /* Entry density mode tokens */
            --entry-compact-show-time: none;
            --entry-layout: row;
            --entry-align: flex-start;

            /* Responsive scaling for different viewport sizes */
            --entry-font-size-sm: 0.7rem;
            --entry-font-size-md: 0.75rem;
            --entry-font-size-lg: 0.8rem;

            --context-height: 1.75em;
            --context-padding: 0.25em;
            --context-text-align: left;

            /* Core layout tokens */
            --time-column-width: 4em;
            --grid-rows-per-day: 1440;
            --view-container-height-offset: var(--day-header-height, 3.5em);
            --main-content-height-offset: 1em;

            /* Grid template tokens */
            --calendar-grid-columns-day: var(--time-column-width) 1fr;
            --calendar-grid-columns-week: var(--time-column-width) repeat(7, 1fr);
            --calendar-grid-columns-month: repeat(7, 1fr);
            --calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

            /* Calculated heights */
            --view-container-height: calc(100% - var(--view-container-height-offset));
            --main-content-height: calc(100% - var(--main-content-height-offset));

            /* Legacy tokens (for backward compatibility) */
            --day-header-height: 3.5em;
            --day-main-offset: var(--main-content-height-offset);
            --day-gap: 1px;
            --day-text-align: center;
            --day-padding: 0.5em;
            --day-all-day-font-size: 0.875rem;
            --day-all-day-margin: 0 1.25em 0 4.25em;
            --hour-text-align: center;
            --indicator-top: -0.55em;
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.8125em;
            --hour-indicator-color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            --day-label-font-weight: 500;
            --day-label-name-font-size: 0.75em;
            --day-label-number-font-size: 1.125em;
            --day-label-number-font-weight: 600;
            --day-label-gap: 0.15em;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-left: 1em;
            --header-text-color: rgba(0, 0, 0, 0.6);
            --header-buttons-padding-right: 1em;
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

            --month-header-context-height: 5.5em;
            --month-day-gap: 1px;
            --indicator-color: var(--primary-color);
            --indicator-font-weight: bold;
            --indicator-padding: 0.25em;
            --indicator-margin-bottom: 0.25em;

            --menu-min-width: 17.5em;
            --menu-max-width: 20em;
            --menu-header-padding: 0.75em 1em;
            --menu-content-padding: 1em;
            --menu-item-padding: 0.75em;
            --menu-item-margin-bottom: 0.75em;
            --menu-item-font-weight: 500;
            --menu-button-size: 2em;
            --menu-button-padding: 0.5em;
            --menu-title-font-size: 0.875em;
            --menu-title-font-weight: 500;
            --menu-content-font-size: 0.875em;
            --menu-detail-label-min-width: 4em;
            --menu-detail-label-font-size: 0.8125em;
            --menu-detail-gap: 0.5em;
        }
        div {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
        }

        /* Responsive entry scaling based on viewport width */
        @media (max-width: 480px) {
            :host {
                --entry-font-size: var(--entry-font-size-sm);
                --entry-padding: 0.1em 0.2em;
                --entry-gap: 0.15em;
                --entry-line-height: 1.15;
                --entry-min-height: 1.1em;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 481px) and (max-width: 768px) {
            :host {
                --entry-font-size: var(--entry-font-size-md);
                --entry-padding: 0.15em 0.25em;
                --entry-gap: 0.2em;
                --entry-line-height: 1.2;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 769px) {
            :host {
                --entry-font-size: var(--entry-font-size-lg);
                --entry-compact-show-time: inline;
            }
        }
    `,Mo([u({type:String})],Oo.prototype,"heading",2),Mo([u({type:Array})],Oo.prototype,"entries",2),Mo([u({type:String})],Oo.prototype,"color",2),Mo([d()],Oo.prototype,"_calendarWidth",2),Mo([d()],Oo.prototype,"_menuOpen",2),Mo([d()],Oo.prototype,"_menuEventDetails",2),Oo=Mo([l("lms-calendar"),D()],Oo);export{cr as Interval,Oo as default};
//# sourceMappingURL=lms-calendar.bundled.js.map
