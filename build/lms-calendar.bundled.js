import{AsyncDirective as e}from"lit-html/async-directive.js";import{directive as t}from"lit-html/directive.js";import{isServer as n}from"lit-html/is-server.js";import{css as r,LitElement as i,html as a,nothing as s,unsafeCSS as o}from"lit";import{property as l,customElement as u,state as c}from"lit/decorators.js";import{classMap as d}from"lit/directives/class-map.js";import{map as h}from"lit/directives/map.js";let m=class{constructor(e,{target:t,config:r,callback:i,skipInitial:a}){this.t=/* @__PURE__ */new Set,this.o=!1,this.i=!1,this.h=e,null!==t&&this.t.add(t??e),this.l=r,this.o=a??this.o,this.callback=i,n||(window.ResizeObserver?(this.u=new ResizeObserver(e=>{this.handleChanges(e),this.h.requestUpdate()}),e.addController(this)):console.warn("ResizeController error: browser does not support ResizeObserver."))}handleChanges(e){this.value=this.callback?.(e,this.u)}hostConnected(){for(const e of this.t)this.observe(e)}hostDisconnected(){this.disconnect()}async hostUpdated(){!this.o&&this.i&&this.handleChanges([]),this.i=!1}observe(e){this.t.add(e),this.u.observe(e,this.l),this.i=!0,this.h.requestUpdate()}unobserve(e){this.t.delete(e),this.u.unobserve(e)}disconnect(){this.u.disconnect()}target(e){return f(this,e)}};const f=t(class extends e{constructor(){super(...arguments),this.observing=!1}render(e,t){}update(e,[t,n]){this.controller=t,this.part=e,this.observe=n,!1===n?(t.unobserve(e.element),this.observing=!1):!1===this.observing&&(t.observe(e.element),this.observing=!0)}disconnected(){this.controller?.unobserve(this.part.element),this.observing=!1}reconnected(){!1!==this.observe&&!1===this.observing&&(this.controller?.observe(this.part.element),this.observing=!0)}}),y="lit-localize-status",p=(e,t,n)=>{let r=e[0];for(let i=1;i<e.length;i++)r+=t[n?n[i-1]:i-1],r+=e[i];return r},g=e=>{return"string"!=typeof(t=e)&&"strTag"in t?p(e.strings,e.values):e;var t};let v=g,w=!1;class b{constructor(e){this.__litLocalizeEventHandler=e=>{"ready"===e.detail.status&&this.host.requestUpdate()},this.host=e}hostConnected(){window.addEventListener(y,this.__litLocalizeEventHandler)}hostDisconnected(){window.removeEventListener(y,this.__litLocalizeEventHandler)}}const k=e=>e.addController(new b(e)),D=()=>(e,t)=>(e.addInitializer(k),e);class S{constructor(){this.settled=!1,this.promise=new Promise((e,t)=>{this._resolve=e,this._reject=t})}resolve(e){this.settled=!0,this._resolve(e)}reject(e){this.settled=!0,this._reject(e)}}const x=[];for(let xo=0;xo<256;xo++)x[xo]=(xo>>4&15).toString(16)+(15&xo).toString(16);function E(e,t){return(t?"h":"s")+function(e){let t=0,n=8997,r=0,i=33826,a=0,s=40164,o=0,l=52210;for(let u=0;u<e.length;u++)n^=e.charCodeAt(u),t=435*n,r=435*i,a=435*s,o=435*l,a+=n<<8,o+=i<<8,r+=t>>>16,n=65535&t,a+=r>>>16,i=65535&r,l=o+(a>>>16)&65535,s=65535&a;return x[l>>8]+x[255&l]+x[s>>8]+x[255&s]+x[i>>8]+x[255&i]+x[n>>8]+x[255&n]}("string"==typeof e?e:e.join(""))}const T=/* @__PURE__ */new WeakMap,O=/* @__PURE__ */new Map;function M(e,t,n){if(e){const r=n?.id??function(e){const t="string"==typeof e?e:e.strings;let n=O.get(t);void 0===n&&(n=E(t,"string"!=typeof e&&!("strTag"in e)),O.set(t,n));return n}(t),i=e[r];if(i){if("string"==typeof i)return i;if("strTag"in i)return p(i.strings,t.values,i.values);{let e=T.get(i);return void 0===e&&(e=i.values,T.set(i,e)),{...i,values:e.map(e=>t.values[e])}}}}return g(t)}function $(e){window.dispatchEvent(new CustomEvent(y,{detail:e}))}let N,_,C,I,A,L="",R=new S;R.resolve();let z=0;const W=()=>L,F=e=>{if(e===(N??L))return R.promise;if(!C||!I)throw new Error("Internal error");if(!C.has(e))throw new Error("Invalid locale code");z++;const t=z;N=e,R.settled&&(R=new S),$({status:"loading",loadingLocale:e});return(e===_?Promise.resolve({templates:void 0}):I(e)).then(n=>{z===t&&(L=e,N=void 0,A=n.templates,$({status:"ready",readyLocale:e}),R.resolve())},n=>{z===t&&($({status:"error",errorLocale:e,errorMessage:n.toString()}),R.reject(n))}),R.promise};class j extends Error{}class V extends j{constructor(e){super(`Invalid DateTime: ${e.toMessage()}`)}}class Y extends j{constructor(e){super(`Invalid Interval: ${e.toMessage()}`)}}class U extends j{constructor(e){super(`Invalid Duration: ${e.toMessage()}`)}}class Z extends j{}class q extends j{constructor(e){super(`Invalid unit ${e}`)}}class H extends j{}class P extends j{constructor(){super("Zone is an abstract class")}}const B="numeric",G="short",K="long",J={year:B,month:B,day:B},Q={year:B,month:G,day:B},X={year:B,month:G,day:B,weekday:G},ee={year:B,month:K,day:B},te={year:B,month:K,day:B,weekday:K},ne={hour:B,minute:B},re={hour:B,minute:B,second:B},ie={hour:B,minute:B,second:B,timeZoneName:G},ae={hour:B,minute:B,second:B,timeZoneName:K},se={hour:B,minute:B,hourCycle:"h23"},oe={hour:B,minute:B,second:B,hourCycle:"h23"},le={hour:B,minute:B,second:B,hourCycle:"h23",timeZoneName:G},ue={hour:B,minute:B,second:B,hourCycle:"h23",timeZoneName:K},ce={year:B,month:B,day:B,hour:B,minute:B},de={year:B,month:B,day:B,hour:B,minute:B,second:B},he={year:B,month:G,day:B,hour:B,minute:B},me={year:B,month:G,day:B,hour:B,minute:B,second:B},fe={year:B,month:G,day:B,weekday:G,hour:B,minute:B},ye={year:B,month:K,day:B,hour:B,minute:B,timeZoneName:G},pe={year:B,month:K,day:B,hour:B,minute:B,second:B,timeZoneName:G},ge={year:B,month:K,day:B,weekday:K,hour:B,minute:B,timeZoneName:K},ve={year:B,month:K,day:B,weekday:K,hour:B,minute:B,second:B,timeZoneName:K};class we{get type(){throw new P}get name(){throw new P}get ianaName(){return this.name}get isUniversal(){throw new P}offsetName(e,t){throw new P}formatOffset(e,t){throw new P}offset(e){throw new P}equals(e){throw new P}get isValid(){throw new P}}let be=null;class ke extends we{static get instance(){return null===be&&(be=new ke),be}get type(){return"system"}get name(){return(new Intl.DateTimeFormat).resolvedOptions().timeZone}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return Vt(e,t,n)}formatOffset(e,t){return qt(this.offset(e),t)}offset(e){return-new Date(e).getTimezoneOffset()}equals(e){return"system"===e.type}get isValid(){return!0}}const De=/* @__PURE__ */new Map;const Se={year:0,month:1,day:2,era:3,hour:4,minute:5,second:6};const xe=/* @__PURE__ */new Map;class Ee extends we{static create(e){let t=xe.get(e);return void 0===t&&xe.set(e,t=new Ee(e)),t}static resetCache(){xe.clear(),De.clear()}static isValidSpecifier(e){return this.isValidZone(e)}static isValidZone(e){if(!e)return!1;try{return new Intl.DateTimeFormat("en-US",{timeZone:e}).format(),!0}catch(t){return!1}}constructor(e){super(),this.zoneName=e,this.valid=Ee.isValidZone(e)}get type(){return"iana"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return Vt(e,t,n,this.name)}formatOffset(e,t){return qt(this.offset(e),t)}offset(e){if(!this.valid)return NaN;const t=new Date(e);if(isNaN(t))return NaN;const n=function(e){let t=De.get(e);return void 0===t&&(t=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",era:"short"}),De.set(e,t)),t}(this.name);let[r,i,a,s,o,l,u]=n.formatToParts?function(e,t){const n=e.formatToParts(t),r=[];for(let i=0;i<n.length;i++){const{type:e,value:t}=n[i],a=Se[e];"era"===e?r[a]=t:bt(a)||(r[a]=parseInt(t,10))}return r}(n,t):function(e,t){const n=e.format(t).replace(/\u200E/g,""),r=/(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(n),[,i,a,s,o,l,u,c]=r;return[s,i,a,o,l,u,c]}(n,t);"BC"===s&&(r=1-Math.abs(r));let c=+t;const d=c%1e3;return c-=d>=0?d:1e3+d,(zt({year:r,month:i,day:a,hour:24===o?0:o,minute:l,second:u,millisecond:0})-c)/6e4}equals(e){return"iana"===e.type&&e.name===this.name}get isValid(){return this.valid}}let Te={};const Oe=/* @__PURE__ */new Map;function Me(e,t={}){const n=JSON.stringify([e,t]);let r=Oe.get(n);return void 0===r&&(r=new Intl.DateTimeFormat(e,t),Oe.set(n,r)),r}const $e=/* @__PURE__ */new Map;const Ne=/* @__PURE__ */new Map;let _e=null;const Ce=/* @__PURE__ */new Map;function Ie(e){let t=Ce.get(e);return void 0===t&&(t=new Intl.DateTimeFormat(e).resolvedOptions(),Ce.set(e,t)),t}const Ae=/* @__PURE__ */new Map;function Le(e,t,n,r){const i=e.listingMode();return"error"===i?null:"en"===i?n(t):r(t)}class Re{constructor(e,t,n){this.padTo=n.padTo||0,this.floor=n.floor||!1;const{padTo:r,floor:i,...a}=n;if(!t||Object.keys(a).length>0){const t={useGrouping:!1,...n};n.padTo>0&&(t.minimumIntegerDigits=n.padTo),this.inf=function(e,t={}){const n=JSON.stringify([e,t]);let r=$e.get(n);return void 0===r&&(r=new Intl.NumberFormat(e,t),$e.set(n,r)),r}(e,t)}}format(e){if(this.inf){const t=this.floor?Math.floor(e):e;return this.inf.format(t)}return $t(this.floor?Math.floor(e):It(e,3),this.padTo)}}class ze{constructor(e,t,n){let r;if(this.opts=n,this.originalZone=void 0,this.opts.timeZone)this.dt=e;else if("fixed"===e.zone.type){const t=e.offset/60*-1,n=t>=0?`Etc/GMT+${t}`:`Etc/GMT${t}`;0!==e.offset&&Ee.create(n).valid?(r=n,this.dt=e):(r="UTC",this.dt=0===e.offset?e:e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone)}else"system"===e.zone.type?this.dt=e:"iana"===e.zone.type?(this.dt=e,r=e.zone.name):(r="UTC",this.dt=e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone);const i={...this.opts};i.timeZone=i.timeZone||r,this.dtf=Me(t,i)}format(){return this.originalZone?this.formatToParts().map(({value:e})=>e).join(""):this.dtf.format(this.dt.toJSDate())}formatToParts(){const e=this.dtf.formatToParts(this.dt.toJSDate());return this.originalZone?e.map(e=>{if("timeZoneName"===e.type){const t=this.originalZone.offsetName(this.dt.ts,{locale:this.dt.locale,format:this.opts.timeZoneName});return{...e,value:t}}return e}):e}resolvedOptions(){return this.dtf.resolvedOptions()}}class We{constructor(e,t,n){this.opts={style:"long",...n},!t&&St()&&(this.rtf=function(e,t={}){const{base:n,...r}=t,i=JSON.stringify([e,r]);let a=Ne.get(i);return void 0===a&&(a=new Intl.RelativeTimeFormat(e,t),Ne.set(i,a)),a}(e,n))}format(e,t){return this.rtf?this.rtf.format(e,t):function(e,t,n="always",r=!1){const i={years:["year","yr."],quarters:["quarter","qtr."],months:["month","mo."],weeks:["week","wk."],days:["day","day","days"],hours:["hour","hr."],minutes:["minute","min."],seconds:["second","sec."]},a=-1===["hours","minutes","seconds"].indexOf(e);if("auto"===n&&a){const n="days"===e;switch(t){case 1:return n?"tomorrow":`next ${i[e][0]}`;case-1:return n?"yesterday":`last ${i[e][0]}`;case 0:return n?"today":`this ${i[e][0]}`}}const s=Object.is(t,-0)||t<0,o=Math.abs(t),l=1===o,u=i[e],c=r?l?u[1]:u[2]||u[1]:l?i[e][0]:e;return s?`${o} ${c} ago`:`in ${o} ${c}`}(t,e,this.opts.numeric,"long"!==this.opts.style)}formatToParts(e,t){return this.rtf?this.rtf.formatToParts(e,t):[]}}const Fe={firstDay:1,minimalDays:4,weekend:[6,7]};class je{static fromOpts(e){return je.create(e.locale,e.numberingSystem,e.outputCalendar,e.weekSettings,e.defaultToEN)}static create(e,t,n,r,i=!1){const a=e||it.defaultLocale,s=a||(i?"en-US":_e||(_e=(new Intl.DateTimeFormat).resolvedOptions().locale,_e)),o=t||it.defaultNumberingSystem,l=n||it.defaultOutputCalendar,u=Ot(r)||it.defaultWeekSettings;return new je(s,o,l,u,a)}static resetCache(){_e=null,Oe.clear(),$e.clear(),Ne.clear(),Ce.clear(),Ae.clear()}static fromObject({locale:e,numberingSystem:t,outputCalendar:n,weekSettings:r}={}){return je.create(e,t,n,r)}constructor(e,t,n,r,i){const[a,s,o]=function(e){const t=e.indexOf("-x-");-1!==t&&(e=e.substring(0,t));const n=e.indexOf("-u-");if(-1===n)return[e];{let t,i;try{t=Me(e).resolvedOptions(),i=e}catch(r){const a=e.substring(0,n);t=Me(a).resolvedOptions(),i=a}const{numberingSystem:a,calendar:s}=t;return[i,a,s]}}(e);this.locale=a,this.numberingSystem=t||s||null,this.outputCalendar=n||o||null,this.weekSettings=r,this.intl=function(e,t,n){return n||t?(e.includes("-u-")||(e+="-u"),n&&(e+=`-ca-${n}`),t&&(e+=`-nu-${t}`),e):e}(this.locale,this.numberingSystem,this.outputCalendar),this.weekdaysCache={format:{},standalone:{}},this.monthsCache={format:{},standalone:{}},this.meridiemCache=null,this.eraCache={},this.specifiedLocale=i,this.fastNumbersCached=null}get fastNumbers(){var e;return null==this.fastNumbersCached&&(this.fastNumbersCached=(!(e=this).numberingSystem||"latn"===e.numberingSystem)&&("latn"===e.numberingSystem||!e.locale||e.locale.startsWith("en")||"latn"===Ie(e.locale).numberingSystem)),this.fastNumbersCached}listingMode(){const e=this.isEnglish(),t=!(null!==this.numberingSystem&&"latn"!==this.numberingSystem||null!==this.outputCalendar&&"gregory"!==this.outputCalendar);return e&&t?"en":"intl"}clone(e){return e&&0!==Object.getOwnPropertyNames(e).length?je.create(e.locale||this.specifiedLocale,e.numberingSystem||this.numberingSystem,e.outputCalendar||this.outputCalendar,Ot(e.weekSettings)||this.weekSettings,e.defaultToEN||!1):this}redefaultToEN(e={}){return this.clone({...e,defaultToEN:!0})}redefaultToSystem(e={}){return this.clone({...e,defaultToEN:!1})}months(e,t=!1){return Le(this,e,Kt,()=>{const n="ja"===this.intl||this.intl.startsWith("ja-"),r=(t&=!n)?{month:e,day:"numeric"}:{month:e},i=t?"format":"standalone";if(!this.monthsCache[i][e]){const t=n?e=>this.dtFormatter(e,r).format():e=>this.extract(e,r,"month");this.monthsCache[i][e]=function(e){const t=[];for(let n=1;n<=12;n++){const r=ni.utc(2009,n,1);t.push(e(r))}return t}(t)}return this.monthsCache[i][e]})}weekdays(e,t=!1){return Le(this,e,en,()=>{const n=t?{weekday:e,year:"numeric",month:"long",day:"numeric"}:{weekday:e},r=t?"format":"standalone";return this.weekdaysCache[r][e]||(this.weekdaysCache[r][e]=function(e){const t=[];for(let n=1;n<=7;n++){const r=ni.utc(2016,11,13+n);t.push(e(r))}return t}(e=>this.extract(e,n,"weekday"))),this.weekdaysCache[r][e]})}meridiems(){return Le(this,void 0,()=>tn,()=>{if(!this.meridiemCache){const e={hour:"numeric",hourCycle:"h12"};this.meridiemCache=[ni.utc(2016,11,13,9),ni.utc(2016,11,13,19)].map(t=>this.extract(t,e,"dayperiod"))}return this.meridiemCache})}eras(e){return Le(this,e,sn,()=>{const t={era:e};return this.eraCache[e]||(this.eraCache[e]=[ni.utc(-40,1,1),ni.utc(2017,1,1)].map(e=>this.extract(e,t,"era"))),this.eraCache[e]})}extract(e,t,n){const r=this.dtFormatter(e,t).formatToParts().find(e=>e.type.toLowerCase()===n);return r?r.value:null}numberFormatter(e={}){return new Re(this.intl,e.forceSimple||this.fastNumbers,e)}dtFormatter(e,t={}){return new ze(e,this.intl,t)}relFormatter(e={}){return new We(this.intl,this.isEnglish(),e)}listFormatter(e={}){return function(e,t={}){const n=JSON.stringify([e,t]);let r=Te[n];return r||(r=new Intl.ListFormat(e,t),Te[n]=r),r}(this.intl,e)}isEnglish(){return"en"===this.locale||"en-us"===this.locale.toLowerCase()||Ie(this.intl).locale.startsWith("en-us")}getWeekSettings(){return this.weekSettings?this.weekSettings:xt()?function(e){let t=Ae.get(e);if(!t){const n=new Intl.Locale(e);t="getWeekInfo"in n?n.getWeekInfo():n.weekInfo,"minimalDays"in t||(t={...Fe,...t}),Ae.set(e,t)}return t}(this.locale):Fe}getStartOfWeek(){return this.getWeekSettings().firstDay}getMinDaysInFirstWeek(){return this.getWeekSettings().minimalDays}getWeekendDays(){return this.getWeekSettings().weekend}equals(e){return this.locale===e.locale&&this.numberingSystem===e.numberingSystem&&this.outputCalendar===e.outputCalendar}toString(){return`Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`}}let Ve=null;class Ye extends we{static get utcInstance(){return null===Ve&&(Ve=new Ye(0)),Ve}static instance(e){return 0===e?Ye.utcInstance:new Ye(e)}static parseSpecifier(e){if(e){const t=e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);if(t)return new Ye(Yt(t[1],t[2]))}return null}constructor(e){super(),this.fixed=e}get type(){return"fixed"}get name(){return 0===this.fixed?"UTC":`UTC${qt(this.fixed,"narrow")}`}get ianaName(){return 0===this.fixed?"Etc/UTC":`Etc/GMT${qt(-this.fixed,"narrow")}`}offsetName(){return this.name}formatOffset(e,t){return qt(this.fixed,t)}get isUniversal(){return!0}offset(){return this.fixed}equals(e){return"fixed"===e.type&&e.fixed===this.fixed}get isValid(){return!0}}class Ue extends we{constructor(e){super(),this.zoneName=e}get type(){return"invalid"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(){return null}formatOffset(){return""}offset(){return NaN}equals(){return!1}get isValid(){return!1}}function Ze(e,t){if(bt(e)||null===e)return t;if(e instanceof we)return e;if("string"==typeof e){const n=e.toLowerCase();return"default"===n?t:"local"===n||"system"===n?ke.instance:"utc"===n||"gmt"===n?Ye.utcInstance:Ye.parseSpecifier(n)||Ee.create(e)}return kt(e)?Ye.instance(e):"object"==typeof e&&"offset"in e&&"function"==typeof e.offset?e:new Ue(e)}const qe={arab:"[٠-٩]",arabext:"[۰-۹]",bali:"[᭐-᭙]",beng:"[০-৯]",deva:"[०-९]",fullwide:"[０-９]",gujr:"[૦-૯]",hanidec:"[〇|一|二|三|四|五|六|七|八|九]",khmr:"[០-៩]",knda:"[೦-೯]",laoo:"[໐-໙]",limb:"[᥆-᥏]",mlym:"[൦-൯]",mong:"[᠐-᠙]",mymr:"[၀-၉]",orya:"[୦-୯]",tamldec:"[௦-௯]",telu:"[౦-౯]",thai:"[๐-๙]",tibt:"[༠-༩]",latn:"\\d"},He={arab:[1632,1641],arabext:[1776,1785],bali:[6992,7001],beng:[2534,2543],deva:[2406,2415],fullwide:[65296,65303],gujr:[2790,2799],khmr:[6112,6121],knda:[3302,3311],laoo:[3792,3801],limb:[6470,6479],mlym:[3430,3439],mong:[6160,6169],mymr:[4160,4169],orya:[2918,2927],tamldec:[3046,3055],telu:[3174,3183],thai:[3664,3673],tibt:[3872,3881]},Pe=qe.hanidec.replace(/[\[|\]]/g,"").split("");const Be=/* @__PURE__ */new Map;function Ge({numberingSystem:e},t=""){const n=e||"latn";let r=Be.get(n);void 0===r&&(r=/* @__PURE__ */new Map,Be.set(n,r));let i=r.get(t);return void 0===i&&(i=new RegExp(`${qe[n]}${t}`),r.set(t,i)),i}let Ke,Je=()=>Date.now(),Qe="system",Xe=null,et=null,tt=null,nt=60,rt=null;class it{static get now(){return Je}static set now(e){Je=e}static set defaultZone(e){Qe=e}static get defaultZone(){return Ze(Qe,ke.instance)}static get defaultLocale(){return Xe}static set defaultLocale(e){Xe=e}static get defaultNumberingSystem(){return et}static set defaultNumberingSystem(e){et=e}static get defaultOutputCalendar(){return tt}static set defaultOutputCalendar(e){tt=e}static get defaultWeekSettings(){return rt}static set defaultWeekSettings(e){rt=Ot(e)}static get twoDigitCutoffYear(){return nt}static set twoDigitCutoffYear(e){nt=e%100}static get throwOnInvalid(){return Ke}static set throwOnInvalid(e){Ke=e}static resetCaches(){je.resetCache(),Ee.resetCache(),ni.resetCache(),Be.clear()}}class at{constructor(e,t){this.reason=e,this.explanation=t}toMessage(){return this.explanation?`${this.reason}: ${this.explanation}`:this.reason}}const st=[0,31,59,90,120,151,181,212,243,273,304,334],ot=[0,31,60,91,121,152,182,213,244,274,305,335];function lt(e,t){return new at("unit out of range",`you specified ${t} (of type ${typeof t}) as a ${e}, which is invalid`)}function ut(e,t,n){const r=new Date(Date.UTC(e,t-1,n));e<100&&e>=0&&r.setUTCFullYear(r.getUTCFullYear()-1900);const i=r.getUTCDay();return 0===i?7:i}function ct(e,t,n){return n+(At(e)?ot:st)[t-1]}function dt(e,t){const n=At(e)?ot:st,r=n.findIndex(e=>e<t);return{month:r+1,day:t-n[r]}}function ht(e,t){return(e-t+7)%7+1}function mt(e,t=4,n=1){const{year:r,month:i,day:a}=e,s=ct(r,i,a),o=ht(ut(r,i,a),n);let l,u=Math.floor((s-o+14-t)/7);return u<1?(l=r-1,u=Ft(l,t,n)):u>Ft(r,t,n)?(l=r+1,u=1):l=r,{weekYear:l,weekNumber:u,weekday:o,...Ht(e)}}function ft(e,t=4,n=1){const{weekYear:r,weekNumber:i,weekday:a}=e,s=ht(ut(r,1,t),n),o=Lt(r);let l,u=7*i+a-s-7+t;u<1?(l=r-1,u+=Lt(l)):u>o?(l=r+1,u-=Lt(r)):l=r;const{month:c,day:d}=dt(l,u);return{year:l,month:c,day:d,...Ht(e)}}function yt(e){const{year:t,month:n,day:r}=e;return{year:t,ordinal:ct(t,n,r),...Ht(e)}}function pt(e){const{year:t,ordinal:n}=e,{month:r,day:i}=dt(t,n);return{year:t,month:r,day:i,...Ht(e)}}function gt(e,t){if(!bt(e.localWeekday)||!bt(e.localWeekNumber)||!bt(e.localWeekYear)){if(!bt(e.weekday)||!bt(e.weekNumber)||!bt(e.weekYear))throw new Z("Cannot mix locale-based week fields with ISO-based week fields");return bt(e.localWeekday)||(e.weekday=e.localWeekday),bt(e.localWeekNumber)||(e.weekNumber=e.localWeekNumber),bt(e.localWeekYear)||(e.weekYear=e.localWeekYear),delete e.localWeekday,delete e.localWeekNumber,delete e.localWeekYear,{minDaysInFirstWeek:t.getMinDaysInFirstWeek(),startOfWeek:t.getStartOfWeek()}}return{minDaysInFirstWeek:4,startOfWeek:1}}function vt(e){const t=Dt(e.year),n=Mt(e.month,1,12),r=Mt(e.day,1,Rt(e.year,e.month));return t?n?!r&&lt("day",e.day):lt("month",e.month):lt("year",e.year)}function wt(e){const{hour:t,minute:n,second:r,millisecond:i}=e,a=Mt(t,0,23)||24===t&&0===n&&0===r&&0===i,s=Mt(n,0,59),o=Mt(r,0,59),l=Mt(i,0,999);return a?s?o?!l&&lt("millisecond",i):lt("second",r):lt("minute",n):lt("hour",t)}function bt(e){return void 0===e}function kt(e){return"number"==typeof e}function Dt(e){return"number"==typeof e&&e%1==0}function St(){try{return"undefined"!=typeof Intl&&!!Intl.RelativeTimeFormat}catch(e){return!1}}function xt(){try{return"undefined"!=typeof Intl&&!!Intl.Locale&&("weekInfo"in Intl.Locale.prototype||"getWeekInfo"in Intl.Locale.prototype)}catch(e){return!1}}function Et(e,t,n){if(0!==e.length)return e.reduce((e,r)=>{const i=[t(r),r];return e&&n(e[0],i[0])===e[0]?e:i},null)[1]}function Tt(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Ot(e){if(null==e)return null;if("object"!=typeof e)throw new H("Week settings must be an object");if(!Mt(e.firstDay,1,7)||!Mt(e.minimalDays,1,7)||!Array.isArray(e.weekend)||e.weekend.some(e=>!Mt(e,1,7)))throw new H("Invalid week settings");return{firstDay:e.firstDay,minimalDays:e.minimalDays,weekend:Array.from(e.weekend)}}function Mt(e,t,n){return Dt(e)&&e>=t&&e<=n}function $t(e,t=2){let n;return n=e<0?"-"+(""+-e).padStart(t,"0"):(""+e).padStart(t,"0"),n}function Nt(e){return bt(e)||null===e||""===e?void 0:parseInt(e,10)}function _t(e){return bt(e)||null===e||""===e?void 0:parseFloat(e)}function Ct(e){if(!bt(e)&&null!==e&&""!==e){const t=1e3*parseFloat("0."+e);return Math.floor(t)}}function It(e,t,n="round"){const r=10**t;switch(n){case"expand":return e>0?Math.ceil(e*r)/r:Math.floor(e*r)/r;case"trunc":return Math.trunc(e*r)/r;case"round":return Math.round(e*r)/r;case"floor":return Math.floor(e*r)/r;case"ceil":return Math.ceil(e*r)/r;default:throw new RangeError(`Value rounding ${n} is out of range`)}}function At(e){return e%4==0&&(e%100!=0||e%400==0)}function Lt(e){return At(e)?366:365}function Rt(e,t){const n=(r=t-1)-(i=12)*Math.floor(r/i)+1;var r,i;return 2===n?At(e+(t-n)/12)?29:28:[31,null,31,30,31,30,31,31,30,31,30,31][n-1]}function zt(e){let t=Date.UTC(e.year,e.month-1,e.day,e.hour,e.minute,e.second,e.millisecond);return e.year<100&&e.year>=0&&(t=new Date(t),t.setUTCFullYear(e.year,e.month-1,e.day)),+t}function Wt(e,t,n){return-ht(ut(e,1,t),n)+t-1}function Ft(e,t=4,n=1){const r=Wt(e,t,n),i=Wt(e+1,t,n);return(Lt(e)-r+i)/7}function jt(e){return e>99?e:e>it.twoDigitCutoffYear?1900+e:2e3+e}function Vt(e,t,n,r=null){const i=new Date(e),a={hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"};r&&(a.timeZone=r);const s={timeZoneName:t,...a},o=new Intl.DateTimeFormat(n,s).formatToParts(i).find(e=>"timezonename"===e.type.toLowerCase());return o?o.value:null}function Yt(e,t){let n=parseInt(e,10);Number.isNaN(n)&&(n=0);const r=parseInt(t,10)||0;return 60*n+(n<0||Object.is(n,-0)?-r:r)}function Ut(e){const t=Number(e);if("boolean"==typeof e||""===e||!Number.isFinite(t))throw new H(`Invalid unit value ${e}`);return t}function Zt(e,t){const n={};for(const r in e)if(Tt(e,r)){const i=e[r];if(null==i)continue;n[t(r)]=Ut(i)}return n}function qt(e,t){const n=Math.trunc(Math.abs(e/60)),r=Math.trunc(Math.abs(e%60)),i=e>=0?"+":"-";switch(t){case"short":return`${i}${$t(n,2)}:${$t(r,2)}`;case"narrow":return`${i}${n}${r>0?`:${r}`:""}`;case"techie":return`${i}${$t(n,2)}${$t(r,2)}`;default:throw new RangeError(`Value format ${t} is out of range for property format`)}}function Ht(e){return function(e,t){return t.reduce((t,n)=>(t[n]=e[n],t),{})}(e,["hour","minute","second","millisecond"])}const Pt=["January","February","March","April","May","June","July","August","September","October","November","December"],Bt=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Gt=["J","F","M","A","M","J","J","A","S","O","N","D"];function Kt(e){switch(e){case"narrow":return[...Gt];case"short":return[...Bt];case"long":return[...Pt];case"numeric":return["1","2","3","4","5","6","7","8","9","10","11","12"];case"2-digit":return["01","02","03","04","05","06","07","08","09","10","11","12"];default:return null}}const Jt=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],Qt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Xt=["M","T","W","T","F","S","S"];function en(e){switch(e){case"narrow":return[...Xt];case"short":return[...Qt];case"long":return[...Jt];case"numeric":return["1","2","3","4","5","6","7"];default:return null}}const tn=["AM","PM"],nn=["Before Christ","Anno Domini"],rn=["BC","AD"],an=["B","A"];function sn(e){switch(e){case"narrow":return[...an];case"short":return[...rn];case"long":return[...nn];default:return null}}function on(e,t){let n="";for(const r of e)r.literal?n+=r.val:n+=t(r.val);return n}const ln={D:J,DD:Q,DDD:ee,DDDD:te,t:ne,tt:re,ttt:ie,tttt:ae,T:se,TT:oe,TTT:le,TTTT:ue,f:ce,ff:he,fff:ye,ffff:ge,F:de,FF:me,FFF:pe,FFFF:ve};class un{static create(e,t={}){return new un(e,t)}static parseFormat(e){let t=null,n="",r=!1;const i=[];for(let a=0;a<e.length;a++){const s=e.charAt(a);"'"===s?((n.length>0||r)&&i.push({literal:r||/^\s+$/.test(n),val:""===n?"'":n}),t=null,n="",r=!r):r||s===t?n+=s:(n.length>0&&i.push({literal:/^\s+$/.test(n),val:n}),n=s,t=s)}return n.length>0&&i.push({literal:r||/^\s+$/.test(n),val:n}),i}static macroTokenToFormatOpts(e){return ln[e]}constructor(e,t){this.opts=t,this.loc=e,this.systemLoc=null}formatWithSystemDefault(e,t){null===this.systemLoc&&(this.systemLoc=this.loc.redefaultToSystem());return this.systemLoc.dtFormatter(e,{...this.opts,...t}).format()}dtFormatter(e,t={}){return this.loc.dtFormatter(e,{...this.opts,...t})}formatDateTime(e,t){return this.dtFormatter(e,t).format()}formatDateTimeParts(e,t){return this.dtFormatter(e,t).formatToParts()}formatInterval(e,t){return this.dtFormatter(e.start,t).dtf.formatRange(e.start.toJSDate(),e.end.toJSDate())}resolvedOptions(e,t){return this.dtFormatter(e,t).resolvedOptions()}num(e,t=0,n=void 0){if(this.opts.forceSimple)return $t(e,t);const r={...this.opts};return t>0&&(r.padTo=t),n&&(r.signDisplay=n),this.loc.numberFormatter(r).format(e)}formatDateTimeFromString(e,t){const n="en"===this.loc.listingMode(),r=this.loc.outputCalendar&&"gregory"!==this.loc.outputCalendar,i=(t,n)=>this.loc.extract(e,t,n),a=t=>e.isOffsetFixed&&0===e.offset&&t.allowZ?"Z":e.isValid?e.zone.formatOffset(e.ts,t.format):"",s=()=>n?function(e){return tn[e.hour<12?0:1]}(e):i({hour:"numeric",hourCycle:"h12"},"dayperiod"),o=(t,r)=>n?function(e,t){return Kt(t)[e.month-1]}(e,t):i(r?{month:t}:{month:t,day:"numeric"},"month"),l=(t,r)=>n?function(e,t){return en(t)[e.weekday-1]}(e,t):i(r?{weekday:t}:{weekday:t,month:"long",day:"numeric"},"weekday"),u=t=>{const n=un.macroTokenToFormatOpts(t);return n?this.formatWithSystemDefault(e,n):t},c=t=>n?function(e,t){return sn(t)[e.year<0?0:1]}(e,t):i({era:t},"era");return on(un.parseFormat(t),t=>{switch(t){case"S":return this.num(e.millisecond);case"u":case"SSS":return this.num(e.millisecond,3);case"s":return this.num(e.second);case"ss":return this.num(e.second,2);case"uu":return this.num(Math.floor(e.millisecond/10),2);case"uuu":return this.num(Math.floor(e.millisecond/100));case"m":return this.num(e.minute);case"mm":return this.num(e.minute,2);case"h":return this.num(e.hour%12==0?12:e.hour%12);case"hh":return this.num(e.hour%12==0?12:e.hour%12,2);case"H":return this.num(e.hour);case"HH":return this.num(e.hour,2);case"Z":return a({format:"narrow",allowZ:this.opts.allowZ});case"ZZ":return a({format:"short",allowZ:this.opts.allowZ});case"ZZZ":return a({format:"techie",allowZ:this.opts.allowZ});case"ZZZZ":return e.zone.offsetName(e.ts,{format:"short",locale:this.loc.locale});case"ZZZZZ":return e.zone.offsetName(e.ts,{format:"long",locale:this.loc.locale});case"z":return e.zoneName;case"a":return s();case"d":return r?i({day:"numeric"},"day"):this.num(e.day);case"dd":return r?i({day:"2-digit"},"day"):this.num(e.day,2);case"c":case"E":return this.num(e.weekday);case"ccc":return l("short",!0);case"cccc":return l("long",!0);case"ccccc":return l("narrow",!0);case"EEE":return l("short",!1);case"EEEE":return l("long",!1);case"EEEEE":return l("narrow",!1);case"L":return r?i({month:"numeric",day:"numeric"},"month"):this.num(e.month);case"LL":return r?i({month:"2-digit",day:"numeric"},"month"):this.num(e.month,2);case"LLL":return o("short",!0);case"LLLL":return o("long",!0);case"LLLLL":return o("narrow",!0);case"M":return r?i({month:"numeric"},"month"):this.num(e.month);case"MM":return r?i({month:"2-digit"},"month"):this.num(e.month,2);case"MMM":return o("short",!1);case"MMMM":return o("long",!1);case"MMMMM":return o("narrow",!1);case"y":return r?i({year:"numeric"},"year"):this.num(e.year);case"yy":return r?i({year:"2-digit"},"year"):this.num(e.year.toString().slice(-2),2);case"yyyy":return r?i({year:"numeric"},"year"):this.num(e.year,4);case"yyyyyy":return r?i({year:"numeric"},"year"):this.num(e.year,6);case"G":return c("short");case"GG":return c("long");case"GGGGG":return c("narrow");case"kk":return this.num(e.weekYear.toString().slice(-2),2);case"kkkk":return this.num(e.weekYear,4);case"W":return this.num(e.weekNumber);case"WW":return this.num(e.weekNumber,2);case"n":return this.num(e.localWeekNumber);case"nn":return this.num(e.localWeekNumber,2);case"ii":return this.num(e.localWeekYear.toString().slice(-2),2);case"iiii":return this.num(e.localWeekYear,4);case"o":return this.num(e.ordinal);case"ooo":return this.num(e.ordinal,3);case"q":return this.num(e.quarter);case"qq":return this.num(e.quarter,2);case"X":return this.num(Math.floor(e.ts/1e3));case"x":return this.num(e.ts);default:return u(t)}})}formatDurationFromString(e,t){const n="negativeLargestOnly"===this.opts.signMode?-1:1,r=e=>{switch(e[0]){case"S":return"milliseconds";case"s":return"seconds";case"m":return"minutes";case"h":return"hours";case"d":return"days";case"w":return"weeks";case"M":return"months";case"y":return"years";default:return null}},i=un.parseFormat(t),a=i.reduce((e,{literal:t,val:n})=>t?e:e.concat(n),[]),s=e.shiftTo(...a.map(r).filter(e=>e));return on(i,((e,t)=>i=>{const a=r(i);if(a){const r=t.isNegativeDuration&&a!==t.largestUnit?n:1;let s;return s="negativeLargestOnly"===this.opts.signMode&&a!==t.largestUnit?"never":"all"===this.opts.signMode?"always":"auto",this.num(e.get(a)*r,i.length,s)}return i})(s,{isNegativeDuration:s<0,largestUnit:Object.keys(s.values)[0]}))}}const cn=/[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;function dn(...e){const t=e.reduce((e,t)=>e+t.source,"");return RegExp(`^${t}$`)}function hn(...e){return t=>e.reduce(([e,n,r],i)=>{const[a,s,o]=i(t,r);return[{...e,...a},s||n,o]},[{},null,1]).slice(0,2)}function mn(e,...t){if(null==e)return[null,null];for(const[n,r]of t){const t=n.exec(e);if(t)return r(t)}return[null,null]}function fn(...e){return(t,n)=>{const r={};let i;for(i=0;i<e.length;i++)r[e[i]]=Nt(t[n+i]);return[r,null,n+i]}}const yn=/(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/,pn=/(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/,gn=RegExp(`${pn.source}${`(?:${yn.source}?(?:\\[(${cn.source})\\])?)?`}`),vn=RegExp(`(?:[Tt]${gn.source})?`),wn=fn("weekYear","weekNumber","weekDay"),bn=fn("year","ordinal"),kn=RegExp(`${pn.source} ?(?:${yn.source}|(${cn.source}))?`),Dn=RegExp(`(?: ${kn.source})?`);function Sn(e,t,n){const r=e[t];return bt(r)?n:Nt(r)}function xn(e,t){return[{hours:Sn(e,t,0),minutes:Sn(e,t+1,0),seconds:Sn(e,t+2,0),milliseconds:Ct(e[t+3])},null,t+4]}function En(e,t){const n=!e[t]&&!e[t+1],r=Yt(e[t+1],e[t+2]);return[{},n?null:Ye.instance(r),t+3]}function Tn(e,t){return[{},e[t]?Ee.create(e[t]):null,t+1]}const On=RegExp(`^T?${pn.source}$`),Mn=/^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;function $n(e){const[t,n,r,i,a,s,o,l,u]=e,c="-"===t[0],d=l&&"-"===l[0],h=(e,t=!1)=>void 0!==e&&(t||e&&c)?-e:e;return[{years:h(_t(n)),months:h(_t(r)),weeks:h(_t(i)),days:h(_t(a)),hours:h(_t(s)),minutes:h(_t(o)),seconds:h(_t(l),"-0"===l),milliseconds:h(Ct(u),d)}]}const Nn={GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function _n(e,t,n,r,i,a,s){const o={year:2===t.length?jt(Nt(t)):Nt(t),month:Bt.indexOf(n)+1,day:Nt(r),hour:Nt(i),minute:Nt(a)};return s&&(o.second=Nt(s)),e&&(o.weekday=e.length>3?Jt.indexOf(e)+1:Qt.indexOf(e)+1),o}const Cn=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;function In(e){const[,t,n,r,i,a,s,o,l,u,c,d]=e,h=_n(t,i,r,n,a,s,o);let m;return m=l?Nn[l]:u?0:Yt(c,d),[h,new Ye(m)]}const An=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,Ln=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,Rn=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;function zn(e){const[,t,n,r,i,a,s,o]=e;return[_n(t,i,r,n,a,s,o),Ye.utcInstance]}function Wn(e){const[,t,n,r,i,a,s,o]=e;return[_n(t,o,n,r,i,a,s),Ye.utcInstance]}const Fn=dn(/([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,vn),jn=dn(/(\d{4})-?W(\d\d)(?:-?(\d))?/,vn),Vn=dn(/(\d{4})-?(\d{3})/,vn),Yn=dn(gn),Un=hn(function(e,t){return[{year:Sn(e,t),month:Sn(e,t+1,1),day:Sn(e,t+2,1)},null,t+3]},xn,En,Tn),Zn=hn(wn,xn,En,Tn),qn=hn(bn,xn,En,Tn),Hn=hn(xn,En,Tn);const Pn=hn(xn);const Bn=dn(/(\d{4})-(\d\d)-(\d\d)/,Dn),Gn=dn(kn),Kn=hn(xn,En,Tn);const Jn="Invalid Duration",Qn={weeks:{days:7,hours:168,minutes:10080,seconds:604800,milliseconds:6048e5},days:{hours:24,minutes:1440,seconds:86400,milliseconds:864e5},hours:{minutes:60,seconds:3600,milliseconds:36e5},minutes:{seconds:60,milliseconds:6e4},seconds:{milliseconds:1e3}},Xn={years:{quarters:4,months:12,weeks:52,days:365,hours:8760,minutes:525600,seconds:31536e3,milliseconds:31536e6},quarters:{months:3,weeks:13,days:91,hours:2184,minutes:131040,seconds:7862400,milliseconds:78624e5},months:{weeks:4,days:30,hours:720,minutes:43200,seconds:2592e3,milliseconds:2592e6},...Qn},er=365.2425,tr=30.436875,nr={years:{quarters:4,months:12,weeks:52.1775,days:er,hours:8765.82,minutes:525949.2,seconds:525949.2*60,milliseconds:525949.2*60*1e3},quarters:{months:3,weeks:13.044375,days:91.310625,hours:2191.455,minutes:131487.3,seconds:525949.2*60/4,milliseconds:7889237999.999999},months:{weeks:4.3481250000000005,days:tr,hours:730.485,minutes:43829.1,seconds:2629746,milliseconds:2629746e3},...Qn},rr=["years","quarters","months","weeks","days","hours","minutes","seconds","milliseconds"],ir=rr.slice(0).reverse();function ar(e,t,n=!1){const r={values:n?t.values:{...e.values,...t.values||{}},loc:e.loc.clone(t.loc),conversionAccuracy:t.conversionAccuracy||e.conversionAccuracy,matrix:t.matrix||e.matrix};return new ur(r)}function sr(e,t){let n=t.milliseconds??0;for(const r of ir.slice(1))t[r]&&(n+=t[r]*e[r].milliseconds);return n}function or(e,t){const n=sr(e,t)<0?-1:1;rr.reduceRight((r,i)=>{if(bt(t[i]))return r;if(r){const a=t[r]*n,s=e[i][r],o=Math.floor(a/s);t[i]+=o*n,t[r]-=o*s*n}return i},null),rr.reduce((n,r)=>{if(bt(t[r]))return n;if(n){const i=t[n]%1;t[n]-=i,t[r]+=i*e[n][r]}return r},null)}function lr(e){const t={};for(const[n,r]of Object.entries(e))0!==r&&(t[n]=r);return t}class ur{constructor(e){const t="longterm"===e.conversionAccuracy||!1;let n=t?nr:Xn;e.matrix&&(n=e.matrix),this.values=e.values,this.loc=e.loc||je.create(),this.conversionAccuracy=t?"longterm":"casual",this.invalid=e.invalid||null,this.matrix=n,this.isLuxonDuration=!0}static fromMillis(e,t){return ur.fromObject({milliseconds:e},t)}static fromObject(e,t={}){if(null==e||"object"!=typeof e)throw new H("Duration.fromObject: argument expected to be an object, got "+(null===e?"null":typeof e));return new ur({values:Zt(e,ur.normalizeUnit),loc:je.fromObject(t),conversionAccuracy:t.conversionAccuracy,matrix:t.matrix})}static fromDurationLike(e){if(kt(e))return ur.fromMillis(e);if(ur.isDuration(e))return e;if("object"==typeof e)return ur.fromObject(e);throw new H(`Unknown duration argument ${e} of type ${typeof e}`)}static fromISO(e,t){const[n]=mn(e,[Mn,$n]);return n?ur.fromObject(n,t):ur.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static fromISOTime(e,t){const[n]=mn(e,[On,Pn]);return n?ur.fromObject(n,t):ur.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static invalid(e,t=null){if(!e)throw new H("need to specify a reason the Duration is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new U(n);return new ur({invalid:n})}static normalizeUnit(e){const t={year:"years",years:"years",quarter:"quarters",quarters:"quarters",month:"months",months:"months",week:"weeks",weeks:"weeks",day:"days",days:"days",hour:"hours",hours:"hours",minute:"minutes",minutes:"minutes",second:"seconds",seconds:"seconds",millisecond:"milliseconds",milliseconds:"milliseconds"}[e?e.toLowerCase():e];if(!t)throw new q(e);return t}static isDuration(e){return e&&e.isLuxonDuration||!1}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}toFormat(e,t={}){const n={...t,floor:!1!==t.round&&!1!==t.floor};return this.isValid?un.create(this.loc,n).formatDurationFromString(this,e):Jn}toHuman(e={}){if(!this.isValid)return Jn;const t=!1!==e.showZeros,n=rr.map(n=>{const r=this.values[n];return bt(r)||0===r&&!t?null:this.loc.numberFormatter({style:"unit",unitDisplay:"long",...e,unit:n.slice(0,-1)}).format(r)}).filter(e=>e);return this.loc.listFormatter({type:"conjunction",style:e.listStyle||"narrow",...e}).format(n)}toObject(){return this.isValid?{...this.values}:{}}toISO(){if(!this.isValid)return null;let e="P";return 0!==this.years&&(e+=this.years+"Y"),0===this.months&&0===this.quarters||(e+=this.months+3*this.quarters+"M"),0!==this.weeks&&(e+=this.weeks+"W"),0!==this.days&&(e+=this.days+"D"),0===this.hours&&0===this.minutes&&0===this.seconds&&0===this.milliseconds||(e+="T"),0!==this.hours&&(e+=this.hours+"H"),0!==this.minutes&&(e+=this.minutes+"M"),0===this.seconds&&0===this.milliseconds||(e+=It(this.seconds+this.milliseconds/1e3,3)+"S"),"P"===e&&(e+="T0S"),e}toISOTime(e={}){if(!this.isValid)return null;const t=this.toMillis();if(t<0||t>=864e5)return null;e={suppressMilliseconds:!1,suppressSeconds:!1,includePrefix:!1,format:"extended",...e,includeOffset:!1};return ni.fromMillis(t,{zone:"UTC"}).toISOTime(e)}toJSON(){return this.toISO()}toString(){return this.toISO()}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Duration { values: ${JSON.stringify(this.values)} }`:`Duration { Invalid, reason: ${this.invalidReason} }`}toMillis(){return this.isValid?sr(this.matrix,this.values):NaN}valueOf(){return this.toMillis()}plus(e){if(!this.isValid)return this;const t=ur.fromDurationLike(e),n={};for(const r of rr)(Tt(t.values,r)||Tt(this.values,r))&&(n[r]=t.get(r)+this.get(r));return ar(this,{values:n},!0)}minus(e){if(!this.isValid)return this;const t=ur.fromDurationLike(e);return this.plus(t.negate())}mapUnits(e){if(!this.isValid)return this;const t={};for(const n of Object.keys(this.values))t[n]=Ut(e(this.values[n],n));return ar(this,{values:t},!0)}get(e){return this[ur.normalizeUnit(e)]}set(e){if(!this.isValid)return this;return ar(this,{values:{...this.values,...Zt(e,ur.normalizeUnit)}})}reconfigure({locale:e,numberingSystem:t,conversionAccuracy:n,matrix:r}={}){return ar(this,{loc:this.loc.clone({locale:e,numberingSystem:t}),matrix:r,conversionAccuracy:n})}as(e){return this.isValid?this.shiftTo(e).get(e):NaN}normalize(){if(!this.isValid)return this;const e=this.toObject();return or(this.matrix,e),ar(this,{values:e},!0)}rescale(){if(!this.isValid)return this;return ar(this,{values:lr(this.normalize().shiftToAll().toObject())},!0)}shiftTo(...e){if(!this.isValid)return this;if(0===e.length)return this;e=e.map(e=>ur.normalizeUnit(e));const t={},n={},r=this.toObject();let i;for(const a of rr)if(e.indexOf(a)>=0){i=a;let e=0;for(const t in n)e+=this.matrix[t][a]*n[t],n[t]=0;kt(r[a])&&(e+=r[a]);const s=Math.trunc(e);t[a]=s,n[a]=(1e3*e-1e3*s)/1e3}else kt(r[a])&&(n[a]=r[a]);for(const a in n)0!==n[a]&&(t[i]+=a===i?n[a]:n[a]/this.matrix[i][a]);return or(this.matrix,t),ar(this,{values:t},!0)}shiftToAll(){return this.isValid?this.shiftTo("years","months","weeks","days","hours","minutes","seconds","milliseconds"):this}negate(){if(!this.isValid)return this;const e={};for(const t of Object.keys(this.values))e[t]=0===this.values[t]?0:-this.values[t];return ar(this,{values:e},!0)}removeZeros(){if(!this.isValid)return this;return ar(this,{values:lr(this.values)},!0)}get years(){return this.isValid?this.values.years||0:NaN}get quarters(){return this.isValid?this.values.quarters||0:NaN}get months(){return this.isValid?this.values.months||0:NaN}get weeks(){return this.isValid?this.values.weeks||0:NaN}get days(){return this.isValid?this.values.days||0:NaN}get hours(){return this.isValid?this.values.hours||0:NaN}get minutes(){return this.isValid?this.values.minutes||0:NaN}get seconds(){return this.isValid?this.values.seconds||0:NaN}get milliseconds(){return this.isValid?this.values.milliseconds||0:NaN}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}equals(e){if(!this.isValid||!e.isValid)return!1;if(!this.loc.equals(e.loc))return!1;function t(e,t){return void 0===e||0===e?void 0===t||0===t:e===t}for(const n of rr)if(!t(this.values[n],e.values[n]))return!1;return!0}}const cr="Invalid Interval";class dr{constructor(e){this.s=e.start,this.e=e.end,this.invalid=e.invalid||null,this.isLuxonInterval=!0}static invalid(e,t=null){if(!e)throw new H("need to specify a reason the Interval is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new Y(n);return new dr({invalid:n})}static fromDateTimes(e,t){const n=ri(e),r=ri(t),i=function(e,t){return e&&e.isValid?t&&t.isValid?t<e?dr.invalid("end before start",`The end of an interval must be after its start, but you had start=${e.toISO()} and end=${t.toISO()}`):null:dr.invalid("missing or invalid end"):dr.invalid("missing or invalid start")}(n,r);return i??new dr({start:n,end:r})}static after(e,t){const n=ur.fromDurationLike(t),r=ri(e);return dr.fromDateTimes(r,r.plus(n))}static before(e,t){const n=ur.fromDurationLike(t),r=ri(e);return dr.fromDateTimes(r.minus(n),r)}static fromISO(e,t){const[n,r]=(e||"").split("/",2);if(n&&r){let e,a,s,o;try{e=ni.fromISO(n,t),a=e.isValid}catch(i){a=!1}try{s=ni.fromISO(r,t),o=s.isValid}catch(i){o=!1}if(a&&o)return dr.fromDateTimes(e,s);if(a){const n=ur.fromISO(r,t);if(n.isValid)return dr.after(e,n)}else if(o){const e=ur.fromISO(n,t);if(e.isValid)return dr.before(s,e)}}return dr.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static isInterval(e){return e&&e.isLuxonInterval||!1}get start(){return this.isValid?this.s:null}get end(){return this.isValid?this.e:null}get lastDateTime(){return this.isValid&&this.e?this.e.minus(1):null}get isValid(){return null===this.invalidReason}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}length(e="milliseconds"){return this.isValid?this.toDuration(e).get(e):NaN}count(e="milliseconds",t){if(!this.isValid)return NaN;const n=this.start.startOf(e,t);let r;return r=t?.useLocaleWeeks?this.end.reconfigure({locale:n.locale}):this.end,r=r.startOf(e,t),Math.floor(r.diff(n,e).get(e))+(r.valueOf()!==this.end.valueOf())}hasSame(e){return!!this.isValid&&(this.isEmpty()||this.e.minus(1).hasSame(this.s,e))}isEmpty(){return this.s.valueOf()===this.e.valueOf()}isAfter(e){return!!this.isValid&&this.s>e}isBefore(e){return!!this.isValid&&this.e<=e}contains(e){return!!this.isValid&&(this.s<=e&&this.e>e)}set({start:e,end:t}={}){return this.isValid?dr.fromDateTimes(e||this.s,t||this.e):this}splitAt(...e){if(!this.isValid)return[];const t=e.map(ri).filter(e=>this.contains(e)).sort((e,t)=>e.toMillis()-t.toMillis()),n=[];let{s:r}=this,i=0;for(;r<this.e;){const e=t[i]||this.e,a=+e>+this.e?this.e:e;n.push(dr.fromDateTimes(r,a)),r=a,i+=1}return n}splitBy(e){const t=ur.fromDurationLike(e);if(!this.isValid||!t.isValid||0===t.as("milliseconds"))return[];let n,{s:r}=this,i=1;const a=[];for(;r<this.e;){const e=this.start.plus(t.mapUnits(e=>e*i));n=+e>+this.e?this.e:e,a.push(dr.fromDateTimes(r,n)),r=n,i+=1}return a}divideEqually(e){return this.isValid?this.splitBy(this.length()/e).slice(0,e):[]}overlaps(e){return this.e>e.s&&this.s<e.e}abutsStart(e){return!!this.isValid&&+this.e===+e.s}abutsEnd(e){return!!this.isValid&&+e.e===+this.s}engulfs(e){return!!this.isValid&&(this.s<=e.s&&this.e>=e.e)}equals(e){return!(!this.isValid||!e.isValid)&&(this.s.equals(e.s)&&this.e.equals(e.e))}intersection(e){if(!this.isValid)return this;const t=this.s>e.s?this.s:e.s,n=this.e<e.e?this.e:e.e;return t>=n?null:dr.fromDateTimes(t,n)}union(e){if(!this.isValid)return this;const t=this.s<e.s?this.s:e.s,n=this.e>e.e?this.e:e.e;return dr.fromDateTimes(t,n)}static merge(e){const[t,n]=e.sort((e,t)=>e.s-t.s).reduce(([e,t],n)=>t?t.overlaps(n)||t.abutsStart(n)?[e,t.union(n)]:[e.concat([t]),n]:[e,n],[[],null]);return n&&t.push(n),t}static xor(e){let t=null,n=0;const r=[],i=e.map(e=>[{time:e.s,type:"s"},{time:e.e,type:"e"}]),a=Array.prototype.concat(...i).sort((e,t)=>e.time-t.time);for(const s of a)n+="s"===s.type?1:-1,1===n?t=s.time:(t&&+t!==+s.time&&r.push(dr.fromDateTimes(t,s.time)),t=null);return dr.merge(r)}difference(...e){return dr.xor([this].concat(e)).map(e=>this.intersection(e)).filter(e=>e&&!e.isEmpty())}toString(){return this.isValid?`[${this.s.toISO()} – ${this.e.toISO()})`:cr}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`:`Interval { Invalid, reason: ${this.invalidReason} }`}toLocaleString(e=J,t={}){return this.isValid?un.create(this.s.loc.clone(t),e).formatInterval(this):cr}toISO(e){return this.isValid?`${this.s.toISO(e)}/${this.e.toISO(e)}`:cr}toISODate(){return this.isValid?`${this.s.toISODate()}/${this.e.toISODate()}`:cr}toISOTime(e){return this.isValid?`${this.s.toISOTime(e)}/${this.e.toISOTime(e)}`:cr}toFormat(e,{separator:t=" – "}={}){return this.isValid?`${this.s.toFormat(e)}${t}${this.e.toFormat(e)}`:cr}toDuration(e,t){return this.isValid?this.e.diff(this.s,e,t):ur.invalid(this.invalidReason)}mapEndpoints(e){return dr.fromDateTimes(e(this.s),e(this.e))}}class hr{static hasDST(e=it.defaultZone){const t=ni.now().setZone(e).set({month:12});return!e.isUniversal&&t.offset!==t.set({month:6}).offset}static isValidIANAZone(e){return Ee.isValidZone(e)}static normalizeZone(e){return Ze(e,it.defaultZone)}static getStartOfWeek({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getStartOfWeek()}static getMinimumDaysInFirstWeek({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getMinDaysInFirstWeek()}static getWeekendWeekdays({locale:e=null,locObj:t=null}={}){return(t||je.create(e)).getWeekendDays().slice()}static months(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:i="gregory"}={}){return(r||je.create(t,n,i)).months(e)}static monthsFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:i="gregory"}={}){return(r||je.create(t,n,i)).months(e,!0)}static weekdays(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||je.create(t,n,null)).weekdays(e)}static weekdaysFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||je.create(t,n,null)).weekdays(e,!0)}static meridiems({locale:e=null}={}){return je.create(e).meridiems()}static eras(e="short",{locale:t=null}={}){return je.create(t,null,"gregory").eras(e)}static features(){return{relative:St(),localeWeek:xt()}}}function mr(e,t){const n=e=>e.toUTC(0,{keepLocalTime:!0}).startOf("day").valueOf(),r=n(t)-n(e);return Math.floor(ur.fromMillis(r).as("days"))}function fr(e,t,n,r){let[i,a,s,o]=function(e,t,n){const r=[["years",(e,t)=>t.year-e.year],["quarters",(e,t)=>t.quarter-e.quarter+4*(t.year-e.year)],["months",(e,t)=>t.month-e.month+12*(t.year-e.year)],["weeks",(e,t)=>{const n=mr(e,t);return(n-n%7)/7}],["days",mr]],i={},a=e;let s,o;for(const[l,u]of r)n.indexOf(l)>=0&&(s=l,i[l]=u(e,t),o=a.plus(i),o>t?(i[l]--,(e=a.plus(i))>t&&(o=e,i[l]--,e=a.plus(i))):e=o);return[e,i,o,s]}(e,t,n);const l=t-i,u=n.filter(e=>["hours","minutes","seconds","milliseconds"].indexOf(e)>=0);0===u.length&&(s<t&&(s=i.plus({[o]:1})),s!==i&&(a[o]=(a[o]||0)+l/(s-i)));const c=ur.fromObject(a,r);return u.length>0?ur.fromMillis(l,r).shiftTo(...u).plus(c):c}function yr(e,t=e=>e){return{regex:e,deser:([e])=>t(function(e){let t=parseInt(e,10);if(isNaN(t)){t="";for(let n=0;n<e.length;n++){const r=e.charCodeAt(n);if(-1!==e[n].search(qe.hanidec))t+=Pe.indexOf(e[n]);else for(const e in He){const[n,i]=He[e];r>=n&&r<=i&&(t+=r-n)}}return parseInt(t,10)}return t}(e))}}const pr=`[ ${String.fromCharCode(160)}]`,gr=new RegExp(pr,"g");function vr(e){return e.replace(/\./g,"\\.?").replace(gr,pr)}function wr(e){return e.replace(/\./g,"").replace(gr," ").toLowerCase()}function br(e,t){return null===e?null:{regex:RegExp(e.map(vr).join("|")),deser:([n])=>e.findIndex(e=>wr(n)===wr(e))+t}}function kr(e,t){return{regex:e,deser:([,e,t])=>Yt(e,t),groups:t}}function Dr(e){return{regex:e,deser:([e])=>e}}const Sr={year:{"2-digit":"yy",numeric:"yyyyy"},month:{numeric:"M","2-digit":"MM",short:"MMM",long:"MMMM"},day:{numeric:"d","2-digit":"dd"},weekday:{short:"EEE",long:"EEEE"},dayperiod:"a",dayPeriod:"a",hour12:{numeric:"h","2-digit":"hh"},hour24:{numeric:"H","2-digit":"HH"},minute:{numeric:"m","2-digit":"mm"},second:{numeric:"s","2-digit":"ss"},timeZoneName:{long:"ZZZZZ",short:"ZZZ"}};let xr=null;function Er(e,t){return Array.prototype.concat(...e.map(e=>function(e,t){if(e.literal)return e;const n=Mr(un.macroTokenToFormatOpts(e.val),t);return null==n||n.includes(void 0)?e:n}(e,t)))}class Tr{constructor(e,t){if(this.locale=e,this.format=t,this.tokens=Er(un.parseFormat(t),e),this.units=this.tokens.map(t=>function(e,t){const n=Ge(t),r=Ge(t,"{2}"),i=Ge(t,"{3}"),a=Ge(t,"{4}"),s=Ge(t,"{6}"),o=Ge(t,"{1,2}"),l=Ge(t,"{1,3}"),u=Ge(t,"{1,6}"),c=Ge(t,"{1,9}"),d=Ge(t,"{2,4}"),h=Ge(t,"{4,6}"),m=e=>{return{regex:RegExp((t=e.val,t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&"))),deser:([e])=>e,literal:!0};var t},f=(f=>{if(e.literal)return m(f);switch(f.val){case"G":return br(t.eras("short"),0);case"GG":return br(t.eras("long"),0);case"y":return yr(u);case"yy":case"kk":return yr(d,jt);case"yyyy":case"kkkk":return yr(a);case"yyyyy":return yr(h);case"yyyyyy":return yr(s);case"M":case"L":case"d":case"H":case"h":case"m":case"q":case"s":case"W":return yr(o);case"MM":case"LL":case"dd":case"HH":case"hh":case"mm":case"qq":case"ss":case"WW":return yr(r);case"MMM":return br(t.months("short",!0),1);case"MMMM":return br(t.months("long",!0),1);case"LLL":return br(t.months("short",!1),1);case"LLLL":return br(t.months("long",!1),1);case"o":case"S":return yr(l);case"ooo":case"SSS":return yr(i);case"u":return Dr(c);case"uu":return Dr(o);case"uuu":case"E":case"c":return yr(n);case"a":return br(t.meridiems(),0);case"EEE":return br(t.weekdays("short",!1),1);case"EEEE":return br(t.weekdays("long",!1),1);case"ccc":return br(t.weekdays("short",!0),1);case"cccc":return br(t.weekdays("long",!0),1);case"Z":case"ZZ":return kr(new RegExp(`([+-]${o.source})(?::(${r.source}))?`),2);case"ZZZ":return kr(new RegExp(`([+-]${o.source})(${r.source})?`),2);case"z":return Dr(/[a-z_+-/]{1,256}?/i);case" ":return Dr(/[^\S\n\r]/);default:return m(f)}})(e)||{invalidReason:"missing Intl.DateTimeFormat.formatToParts support"};return f.token=e,f}(t,e)),this.disqualifyingUnit=this.units.find(e=>e.invalidReason),!this.disqualifyingUnit){const[e,t]=[`^${(n=this.units).map(e=>e.regex).reduce((e,t)=>`${e}(${t.source})`,"")}$`,n];this.regex=RegExp(e,"i"),this.handlers=t}var n}explainFromTokens(e){if(this.isValid){const[t,n]=function(e,t,n){const r=e.match(t);if(r){const e={};let t=1;for(const i in n)if(Tt(n,i)){const a=n[i],s=a.groups?a.groups+1:1;!a.literal&&a.token&&(e[a.token.val[0]]=a.deser(r.slice(t,t+s))),t+=s}return[r,e]}return[r,{}]}(e,this.regex,this.handlers),[r,i,a]=n?function(e){let t,n=null;return bt(e.z)||(n=Ee.create(e.z)),bt(e.Z)||(n||(n=new Ye(e.Z)),t=e.Z),bt(e.q)||(e.M=3*(e.q-1)+1),bt(e.h)||(e.h<12&&1===e.a?e.h+=12:12===e.h&&0===e.a&&(e.h=0)),0===e.G&&e.y&&(e.y=-e.y),bt(e.u)||(e.S=Ct(e.u)),[Object.keys(e).reduce((t,n)=>{const r=(e=>{switch(e){case"S":return"millisecond";case"s":return"second";case"m":return"minute";case"h":case"H":return"hour";case"d":return"day";case"o":return"ordinal";case"L":case"M":return"month";case"y":return"year";case"E":case"c":return"weekday";case"W":return"weekNumber";case"k":return"weekYear";case"q":return"quarter";default:return null}})(n);return r&&(t[r]=e[n]),t},{}),n,t]}(n):[null,null,void 0];if(Tt(n,"a")&&Tt(n,"H"))throw new Z("Can't include meridiem when specifying 24-hour format");return{input:e,tokens:this.tokens,regex:this.regex,rawMatches:t,matches:n,result:r,zone:i,specificOffset:a}}return{input:e,tokens:this.tokens,invalidReason:this.invalidReason}}get isValid(){return!this.disqualifyingUnit}get invalidReason(){return this.disqualifyingUnit?this.disqualifyingUnit.invalidReason:null}}function Or(e,t,n){return new Tr(e,n).explainFromTokens(t)}function Mr(e,t){if(!e)return null;const n=un.create(t,e).dtFormatter((xr||(xr=ni.fromMillis(1555555555555)),xr)),r=n.formatToParts(),i=n.resolvedOptions();return r.map(t=>function(e,t,n){const{type:r,value:i}=e;if("literal"===r){const e=/^\s+$/.test(i);return{literal:!e,val:e?" ":i}}const a=t[r];let s=r;"hour"===r&&(s=null!=t.hour12?t.hour12?"hour12":"hour24":null!=t.hourCycle?"h11"===t.hourCycle||"h12"===t.hourCycle?"hour12":"hour24":n.hour12?"hour12":"hour24");let o=Sr[s];if("object"==typeof o&&(o=o[a]),o)return{literal:!1,val:o}}(t,e,i))}const $r="Invalid DateTime",Nr=864e13;function _r(e){return new at("unsupported zone",`the zone "${e.name}" is not supported`)}function Cr(e){return null===e.weekData&&(e.weekData=mt(e.c)),e.weekData}function Ir(e){return null===e.localWeekData&&(e.localWeekData=mt(e.c,e.loc.getMinDaysInFirstWeek(),e.loc.getStartOfWeek())),e.localWeekData}function Ar(e,t){const n={ts:e.ts,zone:e.zone,c:e.c,o:e.o,loc:e.loc,invalid:e.invalid};return new ni({...n,...t,old:n})}function Lr(e,t,n){let r=e-60*t*1e3;const i=n.offset(r);if(t===i)return[r,t];r-=60*(i-t)*1e3;const a=n.offset(r);return i===a?[r,i]:[e-60*Math.min(i,a)*1e3,Math.max(i,a)]}function Rr(e,t){const n=new Date(e+=60*t*1e3);return{year:n.getUTCFullYear(),month:n.getUTCMonth()+1,day:n.getUTCDate(),hour:n.getUTCHours(),minute:n.getUTCMinutes(),second:n.getUTCSeconds(),millisecond:n.getUTCMilliseconds()}}function zr(e,t,n){return Lr(zt(e),t,n)}function Wr(e,t){const n=e.o,r=e.c.year+Math.trunc(t.years),i=e.c.month+Math.trunc(t.months)+3*Math.trunc(t.quarters),a={...e.c,year:r,month:i,day:Math.min(e.c.day,Rt(r,i))+Math.trunc(t.days)+7*Math.trunc(t.weeks)},s=ur.fromObject({years:t.years-Math.trunc(t.years),quarters:t.quarters-Math.trunc(t.quarters),months:t.months-Math.trunc(t.months),weeks:t.weeks-Math.trunc(t.weeks),days:t.days-Math.trunc(t.days),hours:t.hours,minutes:t.minutes,seconds:t.seconds,milliseconds:t.milliseconds}).as("milliseconds"),o=zt(a);let[l,u]=Lr(o,n,e.zone);return 0!==s&&(l+=s,u=e.zone.offset(l)),{ts:l,o:u}}function Fr(e,t,n,r,i,a){const{setZone:s,zone:o}=n;if(e&&0!==Object.keys(e).length||t){const r=t||o,i=ni.fromObject(e,{...n,zone:r,specificOffset:a});return s?i:i.setZone(o)}return ni.invalid(new at("unparsable",`the input "${i}" can't be parsed as ${r}`))}function jr(e,t,n=!0){return e.isValid?un.create(je.create("en-US"),{allowZ:n,forceSimple:!0}).formatDateTimeFromString(e,t):null}function Vr(e,t,n){const r=e.c.year>9999||e.c.year<0;let i="";if(r&&e.c.year>=0&&(i+="+"),i+=$t(e.c.year,r?6:4),"year"===n)return i;if(t){if(i+="-",i+=$t(e.c.month),"month"===n)return i;i+="-"}else if(i+=$t(e.c.month),"month"===n)return i;return i+=$t(e.c.day),i}function Yr(e,t,n,r,i,a,s){let o=!n||0!==e.c.millisecond||0!==e.c.second,l="";switch(s){case"day":case"month":case"year":break;default:if(l+=$t(e.c.hour),"hour"===s)break;if(t){if(l+=":",l+=$t(e.c.minute),"minute"===s)break;o&&(l+=":",l+=$t(e.c.second))}else{if(l+=$t(e.c.minute),"minute"===s)break;o&&(l+=$t(e.c.second))}if("second"===s)break;!o||r&&0===e.c.millisecond||(l+=".",l+=$t(e.c.millisecond,3))}return i&&(e.isOffsetFixed&&0===e.offset&&!a?l+="Z":e.o<0?(l+="-",l+=$t(Math.trunc(-e.o/60)),l+=":",l+=$t(Math.trunc(-e.o%60))):(l+="+",l+=$t(Math.trunc(e.o/60)),l+=":",l+=$t(Math.trunc(e.o%60)))),a&&(l+="["+e.zone.ianaName+"]"),l}const Ur={month:1,day:1,hour:0,minute:0,second:0,millisecond:0},Zr={weekNumber:1,weekday:1,hour:0,minute:0,second:0,millisecond:0},qr={ordinal:1,hour:0,minute:0,second:0,millisecond:0},Hr=["year","month","day","hour","minute","second","millisecond"],Pr=["weekYear","weekNumber","weekday","hour","minute","second","millisecond"],Br=["year","ordinal","hour","minute","second","millisecond"];function Gr(e){const t={year:"year",years:"year",month:"month",months:"month",day:"day",days:"day",hour:"hour",hours:"hour",minute:"minute",minutes:"minute",quarter:"quarter",quarters:"quarter",second:"second",seconds:"second",millisecond:"millisecond",milliseconds:"millisecond",weekday:"weekday",weekdays:"weekday",weeknumber:"weekNumber",weeksnumber:"weekNumber",weeknumbers:"weekNumber",weekyear:"weekYear",weekyears:"weekYear",ordinal:"ordinal"}[e.toLowerCase()];if(!t)throw new q(e);return t}function Kr(e){switch(e.toLowerCase()){case"localweekday":case"localweekdays":return"localWeekday";case"localweeknumber":case"localweeknumbers":return"localWeekNumber";case"localweekyear":case"localweekyears":return"localWeekYear";default:return Gr(e)}}function Jr(e,t){const n=Ze(t.zone,it.defaultZone);if(!n.isValid)return ni.invalid(_r(n));const r=je.fromObject(t);let i,a;if(bt(e.year))i=it.now();else{for(const n of Hr)bt(e[n])&&(e[n]=Ur[n]);const t=vt(e)||wt(e);if(t)return ni.invalid(t);const r=function(e){if(void 0===ei&&(ei=it.now()),"iana"!==e.type)return e.offset(ei);const t=e.name;let n=ti.get(t);return void 0===n&&(n=e.offset(ei),ti.set(t,n)),n}(n);[i,a]=zr(e,r,n)}return new ni({ts:i,zone:n,loc:r,o:a})}function Qr(e,t,n){const r=!!bt(n.round)||n.round,i=bt(n.rounding)?"trunc":n.rounding,a=(e,a)=>{e=It(e,r||n.calendary?0:2,n.calendary?"round":i);return t.loc.clone(n).relFormatter(n).format(e,a)},s=r=>n.calendary?t.hasSame(e,r)?0:t.startOf(r).diff(e.startOf(r),r).get(r):t.diff(e,r).get(r);if(n.unit)return a(s(n.unit),n.unit);for(const o of n.units){const e=s(o);if(Math.abs(e)>=1)return a(e,o)}return a(e>t?-0:0,n.units[n.units.length-1])}function Xr(e){let t,n={};return e.length>0&&"object"==typeof e[e.length-1]?(n=e[e.length-1],t=Array.from(e).slice(0,e.length-1)):t=Array.from(e),[n,t]}let ei;const ti=/* @__PURE__ */new Map;class ni{constructor(e){const t=e.zone||it.defaultZone;let n=e.invalid||(Number.isNaN(e.ts)?new at("invalid input"):null)||(t.isValid?null:_r(t));this.ts=bt(e.ts)?it.now():e.ts;let r=null,i=null;if(!n){if(e.old&&e.old.ts===this.ts&&e.old.zone.equals(t))[r,i]=[e.old.c,e.old.o];else{const a=kt(e.o)&&!e.old?e.o:t.offset(this.ts);r=Rr(this.ts,a),n=Number.isNaN(r.year)?new at("invalid input"):null,r=n?null:r,i=n?null:a}}this._zone=t,this.loc=e.loc||je.create(),this.invalid=n,this.weekData=null,this.localWeekData=null,this.c=r,this.o=i,this.isLuxonDateTime=!0}static now(){return new ni({})}static local(){const[e,t]=Xr(arguments),[n,r,i,a,s,o,l]=t;return Jr({year:n,month:r,day:i,hour:a,minute:s,second:o,millisecond:l},e)}static utc(){const[e,t]=Xr(arguments),[n,r,i,a,s,o,l]=t;return e.zone=Ye.utcInstance,Jr({year:n,month:r,day:i,hour:a,minute:s,second:o,millisecond:l},e)}static fromJSDate(e,t={}){const n=(r=e,"[object Date]"===Object.prototype.toString.call(r)?e.valueOf():NaN);var r;if(Number.isNaN(n))return ni.invalid("invalid input");const i=Ze(t.zone,it.defaultZone);return i.isValid?new ni({ts:n,zone:i,loc:je.fromObject(t)}):ni.invalid(_r(i))}static fromMillis(e,t={}){if(kt(e))return e<-Nr||e>Nr?ni.invalid("Timestamp out of range"):new ni({ts:e,zone:Ze(t.zone,it.defaultZone),loc:je.fromObject(t)});throw new H(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`)}static fromSeconds(e,t={}){if(kt(e))return new ni({ts:1e3*e,zone:Ze(t.zone,it.defaultZone),loc:je.fromObject(t)});throw new H("fromSeconds requires a numerical input")}static fromObject(e,t={}){e=e||{};const n=Ze(t.zone,it.defaultZone);if(!n.isValid)return ni.invalid(_r(n));const r=je.fromObject(t),i=Zt(e,Kr),{minDaysInFirstWeek:a,startOfWeek:s}=gt(i,r),o=it.now(),l=bt(t.specificOffset)?n.offset(o):t.specificOffset,u=!bt(i.ordinal),c=!bt(i.year),d=!bt(i.month)||!bt(i.day),h=c||d,m=i.weekYear||i.weekNumber;if((h||u)&&m)throw new Z("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(d&&u)throw new Z("Can't mix ordinal dates with month/day");const f=m||i.weekday&&!h;let y,p,g=Rr(o,l);f?(y=Pr,p=Zr,g=mt(g,a,s)):u?(y=Br,p=qr,g=yt(g)):(y=Hr,p=Ur);let v=!1;for(const E of y){bt(i[E])?i[E]=v?p[E]:g[E]:v=!0}const w=f?function(e,t=4,n=1){const r=Dt(e.weekYear),i=Mt(e.weekNumber,1,Ft(e.weekYear,t,n)),a=Mt(e.weekday,1,7);return r?i?!a&&lt("weekday",e.weekday):lt("week",e.weekNumber):lt("weekYear",e.weekYear)}(i,a,s):u?function(e){const t=Dt(e.year),n=Mt(e.ordinal,1,Lt(e.year));return t?!n&&lt("ordinal",e.ordinal):lt("year",e.year)}(i):vt(i),b=w||wt(i);if(b)return ni.invalid(b);const k=f?ft(i,a,s):u?pt(i):i,[D,S]=zr(k,l,n),x=new ni({ts:D,zone:n,o:S,loc:r});return i.weekday&&h&&e.weekday!==x.weekday?ni.invalid("mismatched weekday",`you can't specify both a weekday of ${i.weekday} and a date of ${x.toISO()}`):x.isValid?x:ni.invalid(x.invalid)}static fromISO(e,t={}){const[n,r]=mn(e,[Fn,Un],[jn,Zn],[Vn,qn],[Yn,Hn]);return Fr(n,r,t,"ISO 8601",e)}static fromRFC2822(e,t={}){const[n,r]=mn(function(e){return e.replace(/\([^()]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").trim()}(e),[Cn,In]);return Fr(n,r,t,"RFC 2822",e)}static fromHTTP(e,t={}){const[n,r]=mn(e,[An,zn],[Ln,zn],[Rn,Wn]);return Fr(n,r,t,"HTTP",t)}static fromFormat(e,t,n={}){if(bt(e)||bt(t))throw new H("fromFormat requires an input string and a format");const{locale:r=null,numberingSystem:i=null}=n,a=je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0}),[s,o,l,u]=function(e,t,n){const{result:r,zone:i,specificOffset:a,invalidReason:s}=Or(e,t,n);return[r,i,a,s]}(a,e,t);return u?ni.invalid(u):Fr(s,o,n,`format ${t}`,e,l)}static fromString(e,t,n={}){return ni.fromFormat(e,t,n)}static fromSQL(e,t={}){const[n,r]=mn(e,[Bn,Un],[Gn,Kn]);return Fr(n,r,t,"SQL",e)}static invalid(e,t=null){if(!e)throw new H("need to specify a reason the DateTime is invalid");const n=e instanceof at?e:new at(e,t);if(it.throwOnInvalid)throw new V(n);return new ni({invalid:n})}static isDateTime(e){return e&&e.isLuxonDateTime||!1}static parseFormatForOpts(e,t={}){const n=Mr(e,je.fromObject(t));return n?n.map(e=>e?e.val:null).join(""):null}static expandFormat(e,t={}){return Er(un.parseFormat(e),je.fromObject(t)).map(e=>e.val).join("")}static resetCache(){ei=void 0,ti.clear()}get(e){return this[e]}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}get outputCalendar(){return this.isValid?this.loc.outputCalendar:null}get zone(){return this._zone}get zoneName(){return this.isValid?this.zone.name:null}get year(){return this.isValid?this.c.year:NaN}get quarter(){return this.isValid?Math.ceil(this.c.month/3):NaN}get month(){return this.isValid?this.c.month:NaN}get day(){return this.isValid?this.c.day:NaN}get hour(){return this.isValid?this.c.hour:NaN}get minute(){return this.isValid?this.c.minute:NaN}get second(){return this.isValid?this.c.second:NaN}get millisecond(){return this.isValid?this.c.millisecond:NaN}get weekYear(){return this.isValid?Cr(this).weekYear:NaN}get weekNumber(){return this.isValid?Cr(this).weekNumber:NaN}get weekday(){return this.isValid?Cr(this).weekday:NaN}get isWeekend(){return this.isValid&&this.loc.getWeekendDays().includes(this.weekday)}get localWeekday(){return this.isValid?Ir(this).weekday:NaN}get localWeekNumber(){return this.isValid?Ir(this).weekNumber:NaN}get localWeekYear(){return this.isValid?Ir(this).weekYear:NaN}get ordinal(){return this.isValid?yt(this.c).ordinal:NaN}get monthShort(){return this.isValid?hr.months("short",{locObj:this.loc})[this.month-1]:null}get monthLong(){return this.isValid?hr.months("long",{locObj:this.loc})[this.month-1]:null}get weekdayShort(){return this.isValid?hr.weekdays("short",{locObj:this.loc})[this.weekday-1]:null}get weekdayLong(){return this.isValid?hr.weekdays("long",{locObj:this.loc})[this.weekday-1]:null}get offset(){return this.isValid?+this.o:NaN}get offsetNameShort(){return this.isValid?this.zone.offsetName(this.ts,{format:"short",locale:this.locale}):null}get offsetNameLong(){return this.isValid?this.zone.offsetName(this.ts,{format:"long",locale:this.locale}):null}get isOffsetFixed(){return this.isValid?this.zone.isUniversal:null}get isInDST(){return!this.isOffsetFixed&&(this.offset>this.set({month:1,day:1}).offset||this.offset>this.set({month:5}).offset)}getPossibleOffsets(){if(!this.isValid||this.isOffsetFixed)return[this];const e=864e5,t=6e4,n=zt(this.c),r=this.zone.offset(n-e),i=this.zone.offset(n+e),a=this.zone.offset(n-r*t),s=this.zone.offset(n-i*t);if(a===s)return[this];const o=n-a*t,l=n-s*t,u=Rr(o,a),c=Rr(l,s);return u.hour===c.hour&&u.minute===c.minute&&u.second===c.second&&u.millisecond===c.millisecond?[Ar(this,{ts:o}),Ar(this,{ts:l})]:[this]}get isInLeapYear(){return At(this.year)}get daysInMonth(){return Rt(this.year,this.month)}get daysInYear(){return this.isValid?Lt(this.year):NaN}get weeksInWeekYear(){return this.isValid?Ft(this.weekYear):NaN}get weeksInLocalWeekYear(){return this.isValid?Ft(this.localWeekYear,this.loc.getMinDaysInFirstWeek(),this.loc.getStartOfWeek()):NaN}resolvedLocaleOptions(e={}){const{locale:t,numberingSystem:n,calendar:r}=un.create(this.loc.clone(e),e).resolvedOptions(this);return{locale:t,numberingSystem:n,outputCalendar:r}}toUTC(e=0,t={}){return this.setZone(Ye.instance(e),t)}toLocal(){return this.setZone(it.defaultZone)}setZone(e,{keepLocalTime:t=!1,keepCalendarTime:n=!1}={}){if((e=Ze(e,it.defaultZone)).equals(this.zone))return this;if(e.isValid){let r=this.ts;if(t||n){const t=e.offset(this.ts),n=this.toObject();[r]=zr(n,t,e)}return Ar(this,{ts:r,zone:e})}return ni.invalid(_r(e))}reconfigure({locale:e,numberingSystem:t,outputCalendar:n}={}){return Ar(this,{loc:this.loc.clone({locale:e,numberingSystem:t,outputCalendar:n})})}setLocale(e){return this.reconfigure({locale:e})}set(e){if(!this.isValid)return this;const t=Zt(e,Kr),{minDaysInFirstWeek:n,startOfWeek:r}=gt(t,this.loc),i=!bt(t.weekYear)||!bt(t.weekNumber)||!bt(t.weekday),a=!bt(t.ordinal),s=!bt(t.year),o=!bt(t.month)||!bt(t.day),l=s||o,u=t.weekYear||t.weekNumber;if((l||a)&&u)throw new Z("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(o&&a)throw new Z("Can't mix ordinal dates with month/day");let c;i?c=ft({...mt(this.c,n,r),...t},n,r):bt(t.ordinal)?(c={...this.toObject(),...t},bt(t.day)&&(c.day=Math.min(Rt(c.year,c.month),c.day))):c=pt({...yt(this.c),...t});const[d,h]=zr(c,this.o,this.zone);return Ar(this,{ts:d,o:h})}plus(e){if(!this.isValid)return this;return Ar(this,Wr(this,ur.fromDurationLike(e)))}minus(e){if(!this.isValid)return this;return Ar(this,Wr(this,ur.fromDurationLike(e).negate()))}startOf(e,{useLocaleWeeks:t=!1}={}){if(!this.isValid)return this;const n={},r=ur.normalizeUnit(e);switch(r){case"years":n.month=1;case"quarters":case"months":n.day=1;case"weeks":case"days":n.hour=0;case"hours":n.minute=0;case"minutes":n.second=0;case"seconds":n.millisecond=0}if("weeks"===r)if(t){const e=this.loc.getStartOfWeek(),{weekday:t}=this;t<e&&(n.weekNumber=this.weekNumber-1),n.weekday=e}else n.weekday=1;if("quarters"===r){const e=Math.ceil(this.month/3);n.month=3*(e-1)+1}return this.set(n)}endOf(e,t){return this.isValid?this.plus({[e]:1}).startOf(e,t).minus(1):this}toFormat(e,t={}){return this.isValid?un.create(this.loc.redefaultToEN(t)).formatDateTimeFromString(this,e):$r}toLocaleString(e=J,t={}){return this.isValid?un.create(this.loc.clone(t),e).formatDateTime(this):$r}toLocaleParts(e={}){return this.isValid?un.create(this.loc.clone(e),e).formatDateTimeParts(this):[]}toISO({format:e="extended",suppressSeconds:t=!1,suppressMilliseconds:n=!1,includeOffset:r=!0,extendedZone:i=!1,precision:a="milliseconds"}={}){if(!this.isValid)return null;const s="extended"===e;let o=Vr(this,s,a=Gr(a));return Hr.indexOf(a)>=3&&(o+="T"),o+=Yr(this,s,t,n,r,i,a),o}toISODate({format:e="extended",precision:t="day"}={}){return this.isValid?Vr(this,"extended"===e,Gr(t)):null}toISOWeekDate(){return jr(this,"kkkk-'W'WW-c")}toISOTime({suppressMilliseconds:e=!1,suppressSeconds:t=!1,includeOffset:n=!0,includePrefix:r=!1,extendedZone:i=!1,format:a="extended",precision:s="milliseconds"}={}){if(!this.isValid)return null;return s=Gr(s),(r&&Hr.indexOf(s)>=3?"T":"")+Yr(this,"extended"===a,t,e,n,i,s)}toRFC2822(){return jr(this,"EEE, dd LLL yyyy HH:mm:ss ZZZ",!1)}toHTTP(){return jr(this.toUTC(),"EEE, dd LLL yyyy HH:mm:ss 'GMT'")}toSQLDate(){return this.isValid?Vr(this,!0):null}toSQLTime({includeOffset:e=!0,includeZone:t=!1,includeOffsetSpace:n=!0}={}){let r="HH:mm:ss.SSS";return(t||e)&&(n&&(r+=" "),t?r+="z":e&&(r+="ZZ")),jr(this,r,!0)}toSQL(e={}){return this.isValid?`${this.toSQLDate()} ${this.toSQLTime(e)}`:null}toString(){return this.isValid?this.toISO():$r}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`:`DateTime { Invalid, reason: ${this.invalidReason} }`}valueOf(){return this.toMillis()}toMillis(){return this.isValid?this.ts:NaN}toSeconds(){return this.isValid?this.ts/1e3:NaN}toUnixInteger(){return this.isValid?Math.floor(this.ts/1e3):NaN}toJSON(){return this.toISO()}toBSON(){return this.toJSDate()}toObject(e={}){if(!this.isValid)return{};const t={...this.c};return e.includeConfig&&(t.outputCalendar=this.outputCalendar,t.numberingSystem=this.loc.numberingSystem,t.locale=this.loc.locale),t}toJSDate(){return new Date(this.isValid?this.ts:NaN)}diff(e,t="milliseconds",n={}){if(!this.isValid||!e.isValid)return ur.invalid("created by diffing an invalid DateTime");const r={locale:this.locale,numberingSystem:this.numberingSystem,...n},i=(o=t,Array.isArray(o)?o:[o]).map(ur.normalizeUnit),a=e.valueOf()>this.valueOf(),s=fr(a?this:e,a?e:this,i,r);var o;return a?s.negate():s}diffNow(e="milliseconds",t={}){return this.diff(ni.now(),e,t)}until(e){return this.isValid?dr.fromDateTimes(this,e):this}hasSame(e,t,n){if(!this.isValid)return!1;const r=e.valueOf(),i=this.setZone(e.zone,{keepLocalTime:!0});return i.startOf(t,n)<=r&&r<=i.endOf(t,n)}equals(e){return this.isValid&&e.isValid&&this.valueOf()===e.valueOf()&&this.zone.equals(e.zone)&&this.loc.equals(e.loc)}toRelative(e={}){if(!this.isValid)return null;const t=e.base||ni.fromObject({},{zone:this.zone}),n=e.padding?this<t?-e.padding:e.padding:0;let r=["years","months","days","hours","minutes","seconds"],i=e.unit;return Array.isArray(e.unit)&&(r=e.unit,i=void 0),Qr(t,this.plus(n),{...e,numeric:"always",units:r,unit:i})}toRelativeCalendar(e={}){return this.isValid?Qr(e.base||ni.fromObject({},{zone:this.zone}),this,{...e,numeric:"auto",units:["years","months","days"],calendary:!0}):null}static min(...e){if(!e.every(ni.isDateTime))throw new H("min requires all arguments be DateTimes");return Et(e,e=>e.valueOf(),Math.min)}static max(...e){if(!e.every(ni.isDateTime))throw new H("max requires all arguments be DateTimes");return Et(e,e=>e.valueOf(),Math.max)}static fromFormatExplain(e,t,n={}){const{locale:r=null,numberingSystem:i=null}=n;return Or(je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0}),e,t)}static fromStringExplain(e,t,n={}){return ni.fromFormatExplain(e,t,n)}static buildFormatParser(e,t={}){const{locale:n=null,numberingSystem:r=null}=t,i=je.fromOpts({locale:n,numberingSystem:r,defaultToEN:!0});return new Tr(i,e)}static fromFormatParser(e,t,n={}){if(bt(e)||bt(t))throw new H("fromFormatParser requires an input string and a format parser");const{locale:r=null,numberingSystem:i=null}=n,a=je.fromOpts({locale:r,numberingSystem:i,defaultToEN:!0});if(!a.equals(t.locale))throw new H(`fromFormatParser called with a locale of ${a}, but the format parser was created for ${t.locale}`);const{result:s,zone:o,specificOffset:l,invalidReason:u}=t.explainFromTokens(e);return u?ni.invalid(u):Fr(s,o,n,`format ${t.format}`,e,l)}static get DATE_SHORT(){return J}static get DATE_MED(){return Q}static get DATE_MED_WITH_WEEKDAY(){return X}static get DATE_FULL(){return ee}static get DATE_HUGE(){return te}static get TIME_SIMPLE(){return ne}static get TIME_WITH_SECONDS(){return re}static get TIME_WITH_SHORT_OFFSET(){return ie}static get TIME_WITH_LONG_OFFSET(){return ae}static get TIME_24_SIMPLE(){return se}static get TIME_24_WITH_SECONDS(){return oe}static get TIME_24_WITH_SHORT_OFFSET(){return le}static get TIME_24_WITH_LONG_OFFSET(){return ue}static get DATETIME_SHORT(){return ce}static get DATETIME_SHORT_WITH_SECONDS(){return de}static get DATETIME_MED(){return he}static get DATETIME_MED_WITH_SECONDS(){return me}static get DATETIME_MED_WITH_WEEKDAY(){return fe}static get DATETIME_FULL(){return ye}static get DATETIME_FULL_WITH_SECONDS(){return pe}static get DATETIME_HUGE(){return ge}static get DATETIME_HUGE_WITH_SECONDS(){return ve}}function ri(e){if(ni.isDateTime(e))return e;if(e&&e.valueOf&&kt(e.valueOf()))return ni.fromJSDate(e);if(e&&"object"==typeof e)return ni.fromObject(e);throw new H(`Unknown datetime argument: ${e}, of type ${typeof e}`)}function ii(e,t,n){let r=e.length-t.length;if(0===r)return e(...t);if(1===r)return function(e,t,n){let r=n=>e(n,...t);return void 0===n?r:Object.assign(r,{lazy:n,lazyArgs:t})}(e,t,n);throw Error("Wrong number of arguments")}const ai={done:!1,hasNext:!1};function si(e,...t){let n=e,r=t.map(e=>"lazy"in e?function(e){let{lazy:t,lazyArgs:n}=e,r=t(...n);return Object.assign(r,{isSingle:t.single??!1,index:0,items:[]})}(e):void 0),i=0;for(;i<t.length;){if(void 0===r[i]||!li(n)){n=(0,t[i])(n),i+=1;continue}let e=[];for(let n=i;n<t.length;n++){let t=r[n];if(void 0===t||(e.push(t),t.isSingle))break}let a=[];for(let t of n)if(oi(t,a,e))break;let{isSingle:s}=e.at(-1);n=s?a[0]:a,i+=e.length}return n}function oi(e,t,n){if(0===n.length)return t.push(e),!1;let r=e,i=ai,a=!1;for(let[s,o]of n.entries()){let{index:e,items:l}=o;if(l.push(r),i=o(r,e,l),o.index+=1,i.hasNext){if(i.hasMany){for(let e of i.next)if(oi(e,t,n.slice(s+1)))return!0;return a}r=i.next}if(!i.hasNext)break;i.done&&(a=!0)}return i.hasNext&&t.push(r),a}function li(e){return"string"==typeof e||"object"==typeof e&&!!e&&Symbol.iterator in e}const ui={asc:(e,t)=>e>t,desc:(e,t)=>e<t};function ci(e,t){let[n,...r]=t;if(!function(e){if(hi(e))return!0;if("object"!=typeof e||!Array.isArray(e))return!1;let[t,n,...r]=e;return hi(t)&&"string"==typeof n&&n in ui&&0===r.length}(n))return e(n,di(...r));let i=di(n,...r);return t=>e(t,i)}function di(e,t,...n){let r="function"==typeof e?e:e[0],i="function"==typeof e?"asc":e[1],{[i]:a}=ui,s=void 0===t?void 0:di(t,...n);return(e,t)=>{let n=r(e),i=r(t);return a(n,i)?1:a(i,n)?-1:s?.(e,t)??0}}const hi=e=>"function"==typeof e&&1===e.length;function mi(...e){return ii(fi,e,yi)}const fi=(e,t)=>e.filter(t),yi=e=>(t,n,r)=>e(t,n,r)?{done:!1,hasNext:!0,next:t}:ai;function pi(...e){return ii(gi,e,vi)}const gi=(e,t)=>e.flatMap(t),vi=e=>(t,n,r)=>{let i=e(t,n,r);return Array.isArray(i)?{done:!1,hasNext:!0,hasMany:!0,next:i}:{done:!1,hasNext:!0,next:i}};const wi=(e,t)=>{let n=/* @__PURE__ */Object.create(null);for(let r=0;r<e.length;r++){let i=e[r],a=t(i,r,e);if(void 0!==a){let e=n[a];void 0===e?n[a]=[i]:e.push(i)}}return Object.setPrototypeOf(n,Object.prototype),n};function bi(e,t){if(e===t||Object.is(e,t))return!0;if("object"!=typeof e||"object"!=typeof t||null===e||null===t||Object.getPrototypeOf(e)!==Object.getPrototypeOf(t))return!1;if(Array.isArray(e))return function(e,t){if(e.length!==t.length)return!1;for(let[n,r]of e.entries())if(!bi(r,t[n]))return!1;return!0}(e,t);if(e instanceof Map)return function(e,t){if(e.size!==t.size)return!1;for(let[n,r]of e.entries())if(!t.has(n)||!bi(r,t.get(n)))return!1;return!0}(e,t);if(e instanceof Set)return function(e,t){if(e.size!==t.size)return!1;let n=[...t];for(let r of e){let e=!1;for(let[t,i]of n.entries())if(bi(r,i)){e=!0,n.splice(t,1);break}if(!e)return!1}return!0}(e,t);if(e instanceof Date)return e.getTime()===t.getTime();if(e instanceof RegExp)return e.toString()===t.toString();if(Object.keys(e).length!==Object.keys(t).length)return!1;for(let[n,r]of Object.entries(e))if(!(n in t)||!bi(r,t[n]))return!1;return!0}function ki(...e){return ii(Di,e,Si)}const Di=(e,t)=>e.map(t),Si=e=>(t,n,r)=>({done:!1,hasNext:!0,next:e(t,n,r)});function xi(...e){return ii(Ei,e)}const Ei=(e,t)=>({...e,...t});const Ti=(e,t,n)=>e.reduce(t,n);function Oi(e,t){let n=[...e];return n.sort(t),n}const Mi=(e,t)=>[...e].sort(t),$i=/* @__PURE__ */Symbol.for("@ts-pattern/matcher"),Ni=/* @__PURE__ */Symbol.for("@ts-pattern/isVariadic"),_i="@ts-pattern/anonymous-select-key",Ci=e=>Boolean(e&&"object"==typeof e),Ii=e=>e&&!!e[$i],Ai=(e,t,n)=>{if(Ii(e)){const r=e[$i](),{matched:i,selections:a}=r.match(t);return i&&a&&Object.keys(a).forEach(e=>n(e,a[e])),i}if(Ci(e)){if(!Ci(t))return!1;if(Array.isArray(e)){if(!Array.isArray(t))return!1;let r=[],i=[],a=[];for(const t of e.keys()){const n=e[t];Ii(n)&&n[Ni]?a.push(n):a.length?i.push(n):r.push(n)}if(a.length){if(a.length>1)throw new Error("Pattern error: Using `...P.array(...)` several times in a single pattern is not allowed.");if(t.length<r.length+i.length)return!1;const e=t.slice(0,r.length),s=0===i.length?[]:t.slice(-i.length),o=t.slice(r.length,0===i.length?1/0:-i.length);return r.every((t,r)=>Ai(t,e[r],n))&&i.every((e,t)=>Ai(e,s[t],n))&&(0===a.length||Ai(a[0],o,n))}return e.length===t.length&&e.every((e,r)=>Ai(e,t[r],n))}return Reflect.ownKeys(e).every(r=>{const i=e[r];return(r in t||Ii(a=i)&&"optional"===a[$i]().matcherType)&&Ai(i,t[r],n);var a})}return Object.is(t,e)},Li=e=>{var t,n,r;return Ci(e)?Ii(e)?null!=(t=null==(n=(r=e[$i]()).getSelectionKeys)?void 0:n.call(r))?t:[]:Array.isArray(e)?Ri(e,Li):Ri(Object.values(e),Li):[]},Ri=(e,t)=>e.reduce((e,n)=>e.concat(t(n)),[]);function zi(e){return Object.assign(e,{optional:()=>{return t=e,zi({[$i]:()=>({match:e=>{let n={};const r=(e,t)=>{n[e]=t};return void 0===e?(Li(t).forEach(e=>r(e,void 0)),{matched:!0,selections:n}):{matched:Ai(t,e,r),selections:n}},getSelectionKeys:()=>Li(t),matcherType:"optional"})});var t},and:t=>Wi(e,t),or:t=>function(...e){return zi({[$i]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return Ri(e,Li).forEach(e=>r(e,void 0)),{matched:e.some(e=>Ai(e,t,r)),selections:n}},getSelectionKeys:()=>Ri(e,Li),matcherType:"or"})})}(e,t),select:t=>void 0===t?ji(e):ji(t,e)})}function Wi(...e){return zi({[$i]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return{matched:e.every(e=>Ai(e,t,r)),selections:n}},getSelectionKeys:()=>Ri(e,Li),matcherType:"and"})})}function Fi(e){return{[$i]:()=>({match:t=>({matched:Boolean(e(t))})})}}function ji(...e){const t="string"==typeof e[0]?e[0]:void 0,n=2===e.length?e[1]:"string"==typeof e[0]?void 0:e[0];return zi({[$i]:()=>({match:e=>{let r={[null!=t?t:_i]:e};return{matched:void 0===n||Ai(n,e,(e,t)=>{r[e]=t}),selections:r}},getSelectionKeys:()=>[null!=t?t:_i].concat(void 0===n?[]:Li(n))})})}function Vi(e){return!0}function Yi(e){return"number"==typeof e}function Ui(e){return"string"==typeof e}function Zi(e){return"bigint"==typeof e}zi(Fi(Vi)),zi(Fi(Vi));const qi=e=>Object.assign(zi(e),{startsWith:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.startsWith(n)))));var n},endsWith:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.endsWith(n)))));var n},minLength:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.length>=n))));var n},length:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.length===n))));var n},maxLength:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.length<=n))));var n},includes:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&e.includes(n)))));var n},regex:t=>{return qi(Wi(e,(n=t,Fi(e=>Ui(e)&&Boolean(e.match(n))))));var n}});qi(Fi(Ui));const Hi=e=>Object.assign(zi(e),{between:(t,n)=>{return Hi(Wi(e,(r=t,i=n,Fi(e=>Yi(e)&&r<=e&&i>=e))));var r,i},lt:t=>{return Hi(Wi(e,(n=t,Fi(e=>Yi(e)&&e<n))));var n},gt:t=>{return Hi(Wi(e,(n=t,Fi(e=>Yi(e)&&e>n))));var n},lte:t=>{return Hi(Wi(e,(n=t,Fi(e=>Yi(e)&&e<=n))));var n},gte:t=>{return Hi(Wi(e,(n=t,Fi(e=>Yi(e)&&e>=n))));var n},int:()=>Hi(Wi(e,Fi(e=>Yi(e)&&Number.isInteger(e)))),finite:()=>Hi(Wi(e,Fi(e=>Yi(e)&&Number.isFinite(e)))),positive:()=>Hi(Wi(e,Fi(e=>Yi(e)&&e>0))),negative:()=>Hi(Wi(e,Fi(e=>Yi(e)&&e<0)))}),Pi=Hi(Fi(Yi)),Bi=e=>Object.assign(zi(e),{between:(t,n)=>{return Bi(Wi(e,(r=t,i=n,Fi(e=>Zi(e)&&r<=e&&i>=e))));var r,i},lt:t=>{return Bi(Wi(e,(n=t,Fi(e=>Zi(e)&&e<n))));var n},gt:t=>{return Bi(Wi(e,(n=t,Fi(e=>Zi(e)&&e>n))));var n},lte:t=>{return Bi(Wi(e,(n=t,Fi(e=>Zi(e)&&e<=n))));var n},gte:t=>{return Bi(Wi(e,(n=t,Fi(e=>Zi(e)&&e>=n))));var n},positive:()=>Bi(Wi(e,Fi(e=>Zi(e)&&e>0))),negative:()=>Bi(Wi(e,Fi(e=>Zi(e)&&e<0)))});Bi(Fi(Zi)),zi(Fi(function(e){return"boolean"==typeof e})),zi(Fi(function(e){return"symbol"==typeof e}));const Gi=zi(Fi(function(e){return null==e}));zi(Fi(function(e){return null!=e}));var Ki={__proto__:null,number:Pi,nullish:Gi};class Ji extends Error{constructor(e){let t;try{t=JSON.stringify(e)}catch(n){t=e}super(`Pattern matching error: no pattern matches value ${t}`),this.input=void 0,this.input=e}}const Qi={matched:!1,value:void 0};function Xi(e){return new ea(e,Qi)}let ea=class e{constructor(e,t){this.input=void 0,this.state=void 0,this.input=e,this.state=t}with(...t){if(this.state.matched)return this;const n=t[t.length-1],r=[t[0]];let i;3===t.length&&"function"==typeof t[1]?i=t[1]:t.length>2&&r.push(...t.slice(1,t.length-1));let a=!1,s={};const o=(e,t)=>{a=!0,s[e]=t},l=!r.some(e=>Ai(e,this.input,o))||i&&!Boolean(i(this.input))?Qi:{matched:!0,value:n(a?_i in s?s[_i]:s:this.input,this.input)};return new e(this.input,l)}when(t,n){if(this.state.matched)return this;const r=Boolean(t(this.input));return new e(this.input,r?{matched:!0,value:n(this.input,this.input)}:Qi)}otherwise(e){return this.state.matched?this.state.value:e(this.input)}exhaustive(e=ta){return this.state.matched?this.state.value:e(this.input)}run(){return this.exhaustive()}returnType(){return this}narrow(){return this}};function ta(e){throw new Ji(e)}const na=["ar","de","de-DE","es","fr","ja","pt","zh-Hans"],ra=["ar","de","de-DE","en","es","fr","ja","pt","zh-Hans"],ia={ar:()=>import("./ar-FZjrExX_.js"),de:()=>import("./de--wwHungv.js"),"de-DE":()=>import("./de-DE--wwHungv.js"),es:()=>import("./es-CjoqxudZ.js"),fr:()=>import("./fr-D3sDl40k.js"),ja:()=>import("./ja-Da-01fuI.js"),pt:()=>import("./pt-BUQHRovH.js"),"zh-Hans":()=>import("./zh-Hans-C73uHkbT.js")},{setLocale:aa}=(sa={sourceLocale:"en",targetLocales:na,loadLocale:e=>ia[e]()},function(e){if(w)throw new Error("lit-localize can only be configured once");v=e,w=!0}((e,t)=>M(A,e,t)),L=_=sa.sourceLocale,C=new Set(sa.targetLocales),C.add(sa.sourceLocale),I=sa.loadLocale,{getLocale:W,setLocale:F});var sa;const oa={"zh-Hans":"zh-CN","zh-Hant":"zh-TW"};let la="en";function ua(){return la}async function ca(e){la=oa[e]||e;const t=function(e){const t=ra;if(t.includes(e))return e;const n=e.split("-")[0];return t.includes(n)?n:void 0}(e);t&&await aa(t)}function da(e,t){return e.setLocale(ua()).toFormat(t)}function ha(e){return da(ni.local().set({month:e}),"MMM")}function ma(e){return da(ni.local().set({weekday:e}),"ccc")}function fa(e,t){return((e-t)%7+7)%7}function ya(e,t){const n=new Date(e.year,e.month-1,e.day),r=fa(n.getDay(),t),i=new Date(n);return i.setDate(n.getDate()-r),Array.from({length:7},(e,t)=>{const n=new Date(i);return n.setDate(i.getDate()+t),{day:n.getDate(),month:n.getMonth()+1,year:n.getFullYear()}})}function pa(e){const t=0===e?7:e;return Array.from({length:7},(e,n)=>(t-1+n)%7+1)}var ga=Object.defineProperty,va=Object.getOwnPropertyDescriptor,wa=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?va(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&ga(t,n,a),a};let ba=class extends i{constructor(){super(...arguments),this.firstDayOfWeek=1}render(){const e=pa(this.firstDayOfWeek);return a` <div>
            ${e.map(e=>a`<span>${ma(e)}</span>`)}
        </div>`}};ba.styles=r`
        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            /* Match the month indicator's margin (0.25em) + padding (0.25em) */
            padding: var(--context-padding, 0.25em) var(--context-padding-inline, 0.5em);
            text-align: var(--context-text-align, left);
        }
    `,wa([l({type:Number})],ba.prototype,"firstDayOfWeek",2),ba=wa([u("lms-calendar-context"),D()],ba);var ka=Object.defineProperty,Da=Object.getOwnPropertyDescriptor,Sa=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?Da(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&ka(t,n,a),a};let xa=class extends i{constructor(){super(...arguments),this._hours=[...Array(25).keys()],this._hasActiveSidebar=!1,this.allDayRowCount=0}_renderSeparatorMaybe(e,t){return e?a`<div class="separator" style="grid-row: ${60*t}"></div>`:s}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}render(){const e=this.allDayRowCount>0,t=e?`calc(100% - 3.5em - ${24*this.allDayRowCount}px)`:"100%";return a` <div class="wrapper">
            <div class="all-day-wrapper ${d({collapsed:!e})}">
                <div class="all-day">
                    <slot name="all-day" id="all-day" class="entry"></slot>
                </div>
            </div>
            <div class="container" style="height: ${t}">
                <div
                    class="main ${d({"w-100":!this._hasActiveSidebar,"w-70":this._hasActiveSidebar})}"
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
        </div>`}_getHourIndicator(e){return 24!==e?`grid-row: ${60*(e+1)-59}/${60*(e+1)}`:"grid-row: 1440"}};xa.styles=r`
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

        .all-day-wrapper.collapsed .all-day {
            padding: 0;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
            overflow: hidden;
            min-height: 0;
            padding: 0.5em 0;
        }
    `,Sa([c()],xa.prototype,"_hours",2),Sa([c()],xa.prototype,"_hasActiveSidebar",2),Sa([l({type:Number})],xa.prototype,"allDayRowCount",2),xa=Sa([u("lms-calendar-day")],xa);const Ea=()=>v("Day"),Ta=()=>v("Week"),Oa=()=>v("Month"),Ma=()=>v("Current Month"),$a=()=>v("All Day"),Na=()=>v("Today"),_a=()=>v("No Title"),Ca=()=>v("No Content"),Ia=()=>v("No Time"),Aa=()=>v("Event Details"),La=()=>v("Export as ICS"),Ra=()=>v("Close"),za=()=>v("CW");var Wa=Object.defineProperty,Fa=Object.getOwnPropertyDescriptor,ja=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?Fa(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&Wa(t,n,a),a};let Va=class extends i{constructor(){super(),this.heading="",this.isContinuation=!1,this.density="standard",this.displayMode="default",this.floatText=!1,this._sumReducer=(e,t)=>e+t,this.addEventListener("click",this._handleInteraction),this.addEventListener("keydown",this._handleInteraction),this.addEventListener("focus",this._handleFocus)}_renderTitle(){return Xi(this.content).with(Ki.nullish,()=>this.heading).otherwise(()=>`${this.heading}: ${this.content}`)}_renderTime(){if("month-dot"===this.displayMode){if(this.isContinuation)return a`<span class="time">${$a()}</span>`;const e=this._displayInterval(this.time);return e?a`<span class="time">${e}</span>`:s}if("compact"===this.density)return s;if(this.isContinuation)return a`<span class="time">${$a()}</span>`;const e=this._displayInterval(this.time);return e?a`<span class="time">${e}</span>`:s}_renderContent(){return"full"===this.density&&this.content?a`<span class="content">${this.content}</span>`:s}_shouldShowTime(){return"compact"!==this.density&&(!!this.isContinuation||("standard"===this.density||"full"===this.density))}_getAriaLabel(){const e=this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} to ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:"All day",t=this.content?`, ${this.content}`:"";return`Calendar event: ${this.heading}${t}, ${e}. Press Enter or Space to open details.`}render(){const e=`main ${this.density}`;if("month-dot"===this.displayMode){const t=this.isContinuation;return a`
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
        `}_displayInterval(e){if(!e)return s;const t=[e.start.hour,e.start.minute,e.end.hour,e.end.minute];if(24===t[2]&&t.reduce(this._sumReducer,0)%24==0)return $a();const[n,r,i,a]=t.map(e=>e<10?`0${e}`:e);return`${n}:${r} - ${i}:${a}`}clearSelection(){this._highlighted=!1,this.setAttribute("aria-selected","false")}_handleFocus(e){const t=new CustomEvent("clear-other-selections",{detail:{exceptEntry:this},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleInteraction(e){if(!(e instanceof KeyboardEvent&&"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),e.stopPropagation(),this._highlighted))){if(this._highlighted=!0,this.setAttribute("aria-selected","true"),!this.date)return;const e={heading:this.heading||_a(),content:this.content||Ca(),time:this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} - ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:Ia(),date:this.date?.start,anchorRect:this.getBoundingClientRect()},t=new CustomEvent("open-menu",{detail:e,bubbles:!0,composed:!0});this.dispatchEvent(t);const n=()=>{this._highlighted=!1,this.setAttribute("aria-selected","false"),this.removeEventListener("menu-close",n)};this.addEventListener("menu-close",n)}}};Va.styles=r`
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
    `,ja([l({attribute:!1})],Va.prototype,"time",2),ja([l()],Va.prototype,"heading",2),ja([l()],Va.prototype,"content",2),ja([l({type:Boolean})],Va.prototype,"isContinuation",2),ja([l({type:Object})],Va.prototype,"date",2),ja([l({type:String,reflect:!0,attribute:"data-density"})],Va.prototype,"density",2),ja([l({type:String,reflect:!0,attribute:"data-display-mode"})],Va.prototype,"displayMode",2),ja([l({type:Boolean,reflect:!0,attribute:"data-float-text"})],Va.prototype,"floatText",2),ja([l({type:Object,attribute:!1})],Va.prototype,"accessibility",2),ja([c()],Va.prototype,"_highlighted",2),ja([c()],Va.prototype,"_extended",2),Va=ja([u("lms-calendar-entry"),D()],Va);var Ya=Object.defineProperty,Ua=Object.getOwnPropertyDescriptor,Za=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?Ua(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&Ya(t,n,a),a};let qa=class extends i{constructor(){super(...arguments),this.viewMode="month"}_getWeekInfo(e){const t=ni.fromObject({year:e.year,month:e.month,day:e.day});return{weekNumber:t.weekNumber,weekYear:t.weekYear}}render(){const e=this.activeDate;return a`<div class="controls">
            <div class="info">
                <span>
                    <strong>${this.heading||Ma()}</strong>
                </span>
                <div class="view-detail${"day"===this.viewMode?" active":""}">
                    <span class="day">${e.day}</span>
                    <span class="month"
                        >${ha(e.month)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
                <div class="view-detail${"week"===this.viewMode?" active":""}">
                    <span class="week"
                        >${za()}
                        ${this._getWeekInfo(e).weekNumber}</span
                    >
                    <span class="month"
                        >${ha(e.month)}</span
                    >
                    <span class="year"
                        >${this._getWeekInfo(e).weekYear}</span
                    >
                </div>
                <div class="view-detail${"month"===this.viewMode?" active":""}">
                    <span class="month"
                        >${ha(e.month)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
            </div>
            <nav class="context" aria-label="Calendar view" @click=${this._dispatchSwitchView}>
                <button
                    type="button"
                    ?data-active=${"day"===this.viewMode}
                    aria-pressed=${"day"===this.viewMode?"true":"false"}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${Ea()}
                </button>
                <button
                    type="button"
                    ?data-active=${"week"===this.viewMode}
                    aria-pressed=${"week"===this.viewMode?"true":"false"}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${Ta()}
                </button>
                <button
                    type="button"
                    ?data-active=${"month"===this.viewMode}
                    aria-pressed=${"month"===this.viewMode?"true":"false"}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${Oa()}
                </button>
            </nav>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button type="button" name="previous" aria-label="Previous">«</button>
                <button type="button" name="next" aria-label="Next">»</button>
                <span class="separator"></span>
                <button type="button" name="today" @click=${this._handleTodayClick}>
                    ${Na()}
                </button>
            </div>
        </div>`}_handleTodayClick(e){e.stopPropagation();const t=/* @__PURE__ */new Date,n={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()},r=new CustomEvent("jumptoday",{detail:{date:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchDate(e){const t=e.target;if(!(t instanceof HTMLButtonElement))return;const n=e.target===e.currentTarget?"container":t.name,r=new CustomEvent("switchdate",{detail:{direction:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchView(e){const t=e.target;if(!(t instanceof HTMLElement))return;const n=e.target===e.currentTarget?"container":t.dataset.context,r=new CustomEvent("switchview",{detail:{view:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}};qa.styles=r`
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
    `,Za([l({type:String})],qa.prototype,"heading",2),Za([l({type:Object})],qa.prototype,"activeDate",2),Za([l({type:String})],qa.prototype,"viewMode",2),Za([l({type:Object})],qa.prototype,"expandedDate",2),qa=Za([u("lms-calendar-header"),D()],qa);var Ha=e=>Object.fromEntries(Object.entries(e).map(([e,t])=>[t,e])),Pa={action:"ACTION",description:"DESCRIPTION",duration:"DURATION",repeat:"REPEAT",summary:"SUMMARY",trigger:"TRIGGER",attachments:"ATTACH",attendees:"ATTENDEE"};Ha(Pa);Ha({method:"METHOD",prodId:"PRODID",version:"VERSION",name:"X-WR-CALNAME"});var Ba={alarms:"ALARM",categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",timeTransparent:"TRANSP",url:"URL",end:"DTEND",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"};Ha(Ba);Ha({id:"TZID",lastModified:"LAST-MODIFIED",url:"TZURL"});Ha({comment:"COMMENT",name:"TZNAME",offsetFrom:"TZOFFSETFROM",offsetTo:"TZOFFSETTO",recurrenceDate:"RDATE",recurrenceRule:"RRULE",start:"DTSTART"});Ha({byDay:"BYDAY",byHour:"BYHOUR",byMinute:"BYMINUTE",byMonth:"BYMONTH",byMonthday:"BYMONTHDAY",bySecond:"BYSECOND",bySetPos:"BYSETPOS",byWeekNo:"BYWEEKNO",byYearday:"BYYEARDAY",count:"COUNT",frequency:"FREQ",interval:"INTERVAL",until:"UNTIL",workweekStart:"WKST"});Ha({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT",completed:"COMPLETED",due:"DUE",percentComplete:"PERCENT-COMPLETE"});Ha({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"});Ha({stamp:"DTSTAMP",start:"DTSTART",uid:"UID",url:"URL",organizer:"ORGANIZER",attendees:"ATTENDEE",comment:"COMMENT",end:"DTEND",freeBusy:"FREEBUSY"});var Ga=/\r\n/,Ka=e=>`${e}\r\n`,Ja=(e,t,n)=>n?null==t?"":Ka(`${e};${n}:${t}`):Ka(`${e}:${t}`),Qa=e=>{if(!(e.length<1))return`${e.map(e=>`${e.key}=${e.value}`).join(";")}`},Xa=(e,t)=>t?`"MAILTO:${e}"`:`MAILTO:${e}`,es=(e,t)=>{let n=Qa([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.delegatedFrom&&{key:"DELEGATED-FROM",value:Xa(e.delegatedFrom,!0)},e.member&&{key:"MEMBER",value:Xa(e.member,!0)},e.role&&{key:"ROLE",value:e.role},e.name&&{key:"CN",value:e.name},e.partstat&&{key:"PARTSTAT",value:e.partstat},e.sentBy&&{key:"SENT-BY",value:Xa(e.sentBy,!0)},void 0!==e.rsvp&&(!0===e.rsvp||!1===e.rsvp)&&{key:"RSVP",value:!0===e.rsvp?"TRUE":"FALSE"}].filter(e=>!!e));return Ja(t,Xa(e.email),n)},ts=e=>{if(0===Object.values(e).filter(e=>"number"==typeof e).length)return;let t="";return e.before&&(t+="-"),t+="P",void 0!==e.weeks&&(t+=`${e.weeks}W`),void 0!==e.days&&(t+=`${e.days}D`),(void 0!==e.hours||void 0!==e.minutes||void 0!==e.seconds)&&(t+="T",void 0!==e.hours&&(t+=`${e.hours}H`),void 0!==e.minutes&&(t+=`${e.minutes}M`),void 0!==e.seconds&&(t+=`${e.seconds}S`)),t},ns=36e5,rs=/* @__PURE__ */Symbol.for("constructDateFrom");function is(e,t){return"function"==typeof e?e(t):e&&"object"==typeof e&&rs in e?e[rs](t):e instanceof Date?new e.constructor(t):new Date(t)}function as(e,t){return is(t||e,e)}function ss(e,t,n){let r=as(e,null==n?void 0:n.in);return isNaN(t)?is((null==n?void 0:n.in)||e,NaN):(t&&r.setDate(r.getDate()+t),r)}function os(e,t,n){let r=as(e,void 0);if(isNaN(t))return is(e,NaN);if(!t)return r;let i=r.getDate(),a=is(e,r.getTime());return a.setMonth(r.getMonth()+t+1,0),i>=a.getDate()?a:(r.setFullYear(a.getFullYear(),a.getMonth(),i),r)}function ls(e,t,n){return is(e,+as(e)+t)}function us(e,t,n){return ls(e,t*ns)}var cs={};function ds(){return cs}function hs(e,t){var n,r,i,a;let s=ds(),o=(null==t?void 0:t.weekStartsOn)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.weekStartsOn)??s.weekStartsOn??(null==(a=null==(i=s.locale)?void 0:i.options)?void 0:a.weekStartsOn)??0,l=as(e,null==t?void 0:t.in),u=l.getDay(),c=(u<o?7:0)+u-o;return l.setDate(l.getDate()-c),l.setHours(0,0,0,0),l}function ms(e,t,n){let r=as(e,void 0);return r.setTime(r.getTime()+6e4*t),r}function fs(e,t,n){return ls(e,1e3*t)}function ys(e,t,n){return ss(e,7*t,n)}function ps(e,t,n){return os(e,12*t)}function gs(e,t){let n=+as(e)-+as(t);return n<0?-1:n>0?1:n}function vs(e){return e instanceof Date||"object"==typeof e&&"[object Date]"===Object.prototype.toString.call(e)}function ws(e,t){let n=as(e,void 0),r=n.getMonth();return n.setFullYear(n.getFullYear(),r+1,0),n.setHours(23,59,59,999),n}function bs(e,t){let[n,r]=function(e,...t){let n=is.bind(null,t.find(e=>"object"==typeof e));return t.map(n)}(0,t.start,t.end);return{start:n,end:r}}function ks(e,t){let n=as(e,void 0);return n.setDate(1),n.setHours(0,0,0,0),n}function Ds(e,t){var n,r,i,a;let s=ds(),o=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??s.firstWeekContainsDate??(null==(a=null==(i=s.locale)?void 0:i.options)?void 0:a.firstWeekContainsDate)??1,l=function(e,t){var n,r,i,a;let s=as(e,null==t?void 0:t.in),o=s.getFullYear(),l=ds(),u=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??l.firstWeekContainsDate??(null==(a=null==(i=l.locale)?void 0:i.options)?void 0:a.firstWeekContainsDate)??1,c=is((null==t?void 0:t.in)||e,0);c.setFullYear(o+1,0,u),c.setHours(0,0,0,0);let d=hs(c,t),h=is((null==t?void 0:t.in)||e,0);h.setFullYear(o,0,u),h.setHours(0,0,0,0);let m=hs(h,t);return+s>=+d?o+1:+s>=+m?o:o-1}(e,t),u=is((null==t?void 0:t.in)||e,0);return u.setFullYear(l,0,o),u.setHours(0,0,0,0),hs(u,t)}function Ss(e,t){return as(e,void 0).getDay()}function xs(e,t){let n=as(e,void 0),r=n.getFullYear(),i=n.getMonth(),a=is(n,0);return a.setFullYear(r,i+1,0),a.setHours(0,0,0,0),a.getDate()}function Es(e,t){return as(e,void 0).getMonth()}function Ts(e,t,n){let r=as(e,null==n?void 0:n.in),i=function(e,t){let n=as(e,null==t?void 0:t.in),r=+hs(n,t)-+Ds(n,t);return Math.round(r/6048e5)+1}(r,n)-t;return r.setDate(r.getDate()-7*i),as(r,null==n?void 0:n.in)}function Os(e,t,n){var r,i,a,s;let o=ds(),l=(null==n?void 0:n.weekStartsOn)??(null==(i=null==(r=null==n?void 0:n.locale)?void 0:r.options)?void 0:i.weekStartsOn)??o.weekStartsOn??(null==(s=null==(a=o.locale)?void 0:a.options)?void 0:s.weekStartsOn)??0,u=as(e,null==n?void 0:n.in),c=u.getDay(),d=7-l;return ss(u,t<0||t>6?t-(c+d)%7:((t%7+7)%7+d)%7-(c+d)%7,n)}function Ms(e,t,n){let r=+as(e,void 0),[i,a]=[+as(t.start,void 0),+as(t.end,void 0)].sort((e,t)=>e-t);return r>=i&&r<=a}var $s=["SU","MO","TU","WE","TH","FR","SA"],Ns=(e,t)=>void 0!==t&&e>=t,_s=(e,t,n,r)=>{let i=n.map(({day:e,occurrence:t})=>({occurrence:t,day:$s.indexOf(e)}));return"YEARLY"===e.frequency?e.byYearday||e.byMonthday?t.map(e=>e.filter(e=>i.find(({day:t})=>t===Ss(e)))):e.byWeekNo?t.map(e=>e.flatMap(e=>i.map(({day:t})=>Os(e,t,{weekStartsOn:r})))):e.byMonth?t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Cs(Is(ks(e)),Is(ws(e)),t,r,n)))):t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Cs(Is(function(e){let t=as(e,void 0);return t.setFullYear(t.getFullYear(),0,1),t.setHours(0,0,0,0),t}(e)),Is(function(e){let t=as(e,void 0),n=t.getFullYear();return t.setFullYear(n+1,0,0),t.setHours(23,59,59,999),t}(e)),t,r,n)))):"MONTHLY"===e.frequency?e.byMonthday?t.map(e=>e.filter(e=>i.find(({day:t})=>t===Ss(e)))):t.map(e=>e.flatMap(e=>i.flatMap(({day:t,occurrence:n})=>Cs(Is(ks(e)),Is(ws(e)),t,r,n)))):"WEEKLY"===e.frequency?t.map(e=>e.flatMap(e=>i.map(({day:t})=>Os(e,t,{weekStartsOn:r})))):t.map(e=>e.filter(e=>i.find(({day:t})=>t===Ss(e))))},Cs=(e,t,n,r,i)=>{if(void 0!==i){if(!(i<0)){let t=Os(e,n,{weekStartsOn:r});return ys(t,(i||1)-1+(e>t?1:0))}let a=Os(t,n,{weekStartsOn:r});return Is(function(e){let t=as(e,void 0);return t.setHours(0,0,0,0),t}(function(e,t,n){return ys(e,-t,n)}(a,-(i||1)-1+(t<a?1:0))))}return function(e){let{start:t,end:n}=bs(0,e),r=+t>+n,i=r?+t:+n,a=r?n:t;a.setHours(0,0,0,0);let s=[];for(;+a<=i;)s.push(is(t,a)),a.setDate(a.getDate()+1),a.setHours(0,0,0,0);return r?s.reverse():s}({start:e,end:t}).map(e=>Is(e)).filter(n=>Ms(n,{start:e,end:t})).filter(e=>n===Ss(e))},Is=e=>ms(e,-e.getTimezoneOffset()),As=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=as(e,void 0);return n.setHours(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return as(e,void 0).getHours()}(e)))),Ls=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=as(e,void 0);return n.setMinutes(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return as(e,void 0).getMinutes()}(e)))),Rs=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=as(e,void 0),r=n.getFullYear(),i=n.getDate(),a=is(e,0);a.setFullYear(r,t,15),a.setHours(0,0,0,0);let s=xs(a);return n.setMonth(t,Math.min(i,s)),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(Es(e)))),zs=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency?t.map(e=>e.flatMap(e=>{let t=xs(e);return n.map(n=>n>t?void 0:function(e,t){let n=as(e,void 0);return n.setDate(t),n}(e,n)).filter(e=>!!e)})):"WEEKLY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(Es(e)))),Ws=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency||"MINUTELY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=as(e,void 0);return n.setSeconds(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return as(e).getSeconds()}(e)))),Fs=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=as(e,void 0);return n.setMonth(0),n.setDate(t),n}(e,t)))):"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(function(e){return as(e,void 0).getFullYear()}(e)))),js=(e,t,n)=>{let r=n;return e.byMonth&&(r=Rs(e,r,e.byMonth)),e.byWeekNo&&(r=((e,t,n,r)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>Ts(e,t,{weekStartsOn:r})))):t)(e,r,e.byWeekNo,t.weekStartsOn)),e.byYearday&&(r=Fs(e,r,e.byYearday)),e.byMonthday&&(r=zs(e,r,e.byMonthday)),e.byDay&&(r=_s(e,r,e.byDay,t.weekStartsOn)),e.byHour&&(r=As(e,r,e.byHour)),e.byMinute&&(r=Ls(e,r,e.byMinute)),e.bySecond&&(r=Ws(e,r,e.bySecond)),e.bySetPos&&(r=((e,t,n)=>e.byYearday||e.byWeekNo||e.byMonthday||e.byMonth||e.byDay||e.byHour||e.byMinute||e.bySecond?t.map(e=>e.sort(gs).filter((t,r)=>n.some(t=>t>0?0!==r&&r%t===0:0===r?e.length-1+t===0:r%(e.length-1+t)===0))):t)(e,r,e.bySetPos)),r.map(e=>e.sort(gs).filter(e=>!(t.exceptions.length>0&&t.exceptions.some(t=>function(e,t){return+as(e)==+as(t)}(t,e))||!Ms(e,{start:t.start,end:t.end}))))},Vs=(e,t)=>{var n;let r=t.start,i=(null==(n=e.until)?void 0:n.date)||(null==t?void 0:t.end)||ps(r,2),a=t.exceptions||[],s=(e.workweekStart?$s.indexOf(e.workweekStart):1)%7,o=[[r]];((e,{start:t,end:n},r)=>{if(Ns(r.length,e.count))return;let i=e.frequency,a=e.interval||1;if(!i)return;let s=t;if("SECONDLY"!==i)if("MINUTELY"!==i)if("HOURLY"!==i)if("DAILY"!==i)if("WEEKLY"!==i)if("MONTHLY"!==i)if("YEARLY"!==i);else for(;s<n;)s=ps(s,a),r.push([s]);else for(;s<n;)s=os(s,a),r.push([s]);else for(;s<n;){if(Ns(r.length,e.count))return;s=ys(s,a),r.push([s])}else for(;s<n;){if(Ns(r.length,e.count))return;s=ss(s,a),r.push([s])}else for(;s<n;){if(Ns(r.length,e.count))return;s=us(s,a),r.push([s])}else for(;s<n;){if(Ns(r.length,e.count))return;s=ms(s,a),r.push([s])}else for(;s<n;){if(Ns(r.length,e.count))return;s=fs(s,a),r.push([s])}})(e,{start:r,end:i},o);let l=js(e,{start:r,end:i,exceptions:a,weekStartsOn:s},o);return e.count?l.flat().splice(0,e.count):l.flat()},Ys=e=>{let t="+"===e[0]?1:-1;return 1e3*(60*(60*Number(e.slice(1,3))+(e.length>3?Number(e.slice(3,5)):0))+(e.length>5?Number(e.slice(5,7)):0))*t},Us=(e,t,n)=>{let r=null==n?void 0:n.find(e=>e.id===t);if(r){let t=((e,t)=>t.flatMap(t=>!t.recurrenceRule||t.recurrenceRule.until&&t.recurrenceRule.until.date<e?t:Vs(t.recurrenceRule,{start:t.start,end:e}).map(e=>({...t,start:e}))))(e,r.props).sort((e,t)=>gs(e.start,t.start));for(let r=0;r<t.length;r+=1)if(e<t[r].start){let e=t[r-1]?t[r-1].offsetTo:t[r].offsetFrom,n=e.length>5?e.substring(0,5):e;return{offset:n,milliseconds:Ys(n)}}let n=t[t.length-1].offsetTo,i=n.length>5?n.substring(0,5):n;return{offset:i,milliseconds:Ys(i)}}let i=((e,t)=>{let n="en-US",r=new Date(t.toLocaleString(n,{timeZone:"UTC"}));try{return new Date(t.toLocaleString(n,{timeZone:e})).getTime()-r.getTime()}catch{return t.getTime()-r.getTime()}})(t,e);if(!Number.isNaN(i)){let e=i<0,t=Math.abs(function(e){let t=e/ns;return Math.trunc(t)}(i)),n=Math.abs(function(e){let t=e/6e4;return Math.trunc(t)}(i))-60*t;return{offset:`${e?"-":"+"}${1===t.toString().length?`0${t}`:t.toString()}${1===n.toString().length?`0${n}`:n.toString()}`,milliseconds:i}}},Zs=e=>{if(!vs(e))throw Error(`Incorrect date object: ${e}`);let t=e.toISOString();return`${t.slice(0,4)}${t.slice(5,7)}${t.slice(8,10)}`},qs=e=>{if(!vs(e))throw Error(`Incorrect date object: ${e}`);return Hs(e)},Hs=(e,t)=>{let n=e.toISOString();return`${n.slice(0,4)}${n.slice(5,7)}${n.slice(8,10)}T${n.slice(11,13)}${n.slice(14,16)}${n.slice(17,19)}${t?"":"Z"}`},Ps=e=>Object.keys(e),Bs=e=>{let t="X-";for(let n of e)n===n.toUpperCase()&&(t+="-"),t+=n.toUpperCase();return t},Gs=(e,t)=>{let n=[],r="",i=0;for(let a=0;a<e.length;a++){let s=e[a],o="\n"===s?2:1;i+o>t?(n.push(0===n.length?r:` ${r}`),r=s,i=o):(r+=s,i+=o)}return r&&n.push(0===n.length?r:` ${r}`),n},Ks=(e,t)=>{let n=Ps(e),r=t.childComponents,i=r?Ps(r):[],a=t.generateArrayValues,s=a?Ps(a):[],o="";return o+=(e=>Ka(`BEGIN:${e}`))(t.icsComponent),n.forEach(n=>{if(i.includes(n)||s.includes(n)||"nonStandard"===n)return;let r=t.icsKeyMap[n];if(!r)return;let a=e[n];if(null==a)return;let l=t.generateValues[n];o+=l?l({icsKey:r,value:a,key:n}):Ja(r,String(a))}),r&&i&&i.length>0&&i.forEach(t=>{let n=e[t];!n||!Array.isArray(n)||0===n.length||n.forEach(e=>{let n=r[t];n&&(o+=n(e))})}),a&&s&&s.length>0&&s.forEach(n=>{let r=a[n];if(!r)return;let i=t.icsKeyMap[n];if(!i)return;let s=e[n];!s||!Array.isArray(s)||0===s.length||s.forEach(e=>{o+=r({icsKey:i,value:e})})}),e.nonStandard&&(o+=((e,t)=>{if(!e)return"";let n="";return Object.entries(e).forEach(([e,r])=>{let i=null==t?void 0:t[e];if(!i)return void(n+=Ja(Bs(e),null==r?void 0:r.toString()));let a=i.generate(r);a&&(n+=Ja(i.name,a.value,a.options?Qa(Object.entries(a.options).map(([e,t])=>({key:e,value:t}))):void 0))}),n})(e.nonStandard,null==t?void 0:t.nonStandard)),o+=(e=>Ka(`END:${e}`))(t.icsComponent),null!=t&&t.skipFormatLines?o:(e=>{let t=e.split(Ga),n=[];return t.forEach(e=>{(e=>{let t=(e.match(/\n/g)||[]).length;return e.length+t})(e)<75?n.push(e):Gs(e,75).forEach(e=>{n.push(e)})}),n.join("\r\n")})(o)},Js=(e,t)=>Ja(e,Math.trunc(t).toString()),Qs=(e,t)=>Ks(e,{icsComponent:"VALARM",icsKeyMap:Pa,generateValues:{trigger:({value:e})=>(e=>{var t,n;let r=Qa([(null==(t=e.options)?void 0:t.related)&&{key:"RELATED",value:e.options.related}].filter(e=>!!e));return"absolute"===e.type?Ja("TRIGGER",qs(null==(n=e.value)?void 0:n.date)):"relative"===e.type?Ja("TRIGGER",ts(e.value),r):void 0})(e),duration:({icsKey:e,value:t})=>Ja(e,ts(t)),repeat:({icsKey:e,value:t})=>Js(e,t)},generateArrayValues:{attendees:({value:e})=>es(e,"ATTENDEE"),attachments:({value:e})=>(e=>{if("uri"===e.type){let t=Qa([e.formatType&&{key:"FMTTYPE",value:e.formatType}].filter(e=>!!e));return Ja("ATTACH",e.url,t)}if("binary"===e.type){let t=Qa([e.value&&{key:"VALUE",value:e.value},e.encoding&&{key:"ENCODING",value:e.encoding}].filter(e=>!!e));return Ja("ATTACH",e.binary,t)}throw Error(`IcsAttachment has no type! ${JSON.stringify(e)}`)})(e)},nonStandard:null==t?void 0:t.nonStandard,skipFormatLines:null==t?void 0:t.skipFormatLines}),Xs=(e,t,n=[],r)=>{let i=Qa([t.type&&{key:"VALUE",value:t.type},t.local&&!(null!=r&&r.forceUtc)&&{key:"TZID",value:t.local.timezone},...n].filter(e=>!!e)),a="DATE"===t.type?Zs(t.date):!t.local||null!=r&&r.forceUtc?qs(t.date):((e,t,n)=>{let r=t.date;if(!vs(r))throw Error(`Incorrect date object: ${r}`);return Us(r,t.timezone,n)?Hs(r,!0):qs(e)})(t.date,t.local,null==r?void 0:r.timezones);return Ja(e,a,i)},eo=(e,t,n)=>Ja(e,(e=>e.replace(/([\\;,])|(\n)/g,(e,t)=>t?`\\${t}`:"\\n"))(t),n?Qa(n):void 0),to=(e,t)=>Ks(e,{icsComponent:"VEVENT",icsKeyMap:Ba,generateValues:{stamp:({icsKey:e,value:t})=>Xs(e,t,void 0,{timezones:void 0,forceUtc:!0}),start:({icsKey:e,value:t})=>Xs(e,t,void 0,{timezones:void 0}),end:({icsKey:e,value:t})=>Xs(e,t,void 0,{timezones:void 0}),created:({icsKey:e,value:t})=>Xs(e,t,void 0,{timezones:void 0}),lastModified:({icsKey:e,value:t})=>Xs(e,t,void 0,{timezones:void 0}),categories:({icsKey:e,value:t})=>Ja(e,t.join(",")),description:({icsKey:t,value:n})=>eo(t,n,e.descriptionAltRep?[{key:"ALTREP",value:`"${e.descriptionAltRep}"`}]:void 0),location:({icsKey:e,value:t})=>eo(e,t),comment:({icsKey:e,value:t})=>eo(e,t),summary:({icsKey:e,value:t})=>eo(e,t),recurrenceRule:({value:e})=>(e=>{var t;let n="",r=Qa([e.frequency&&{key:"FREQ",value:e.frequency},e.byDay&&{key:"BYDAY",value:e.byDay.map(e=>(e=>e.occurrence?`${e.occurrence}${e.day}`:e.day)(e)).join(",")},e.byHour&&{key:"BYHOUR",value:e.byHour.join(",")},e.byMinute&&{key:"BYMINUTE",value:e.byMinute.join(",")},e.byMonth&&{key:"BYMONTH",value:e.byMonth.map(e=>e+1).join(",")},e.byMonthday&&{key:"BYMONTHDAY",value:e.byMonthday.join(",")},e.bySecond&&{key:"BYSECOND",value:e.bySecond.join(",")},e.bySetPos&&{key:"BYSETPOS",value:e.bySetPos.join(",")},e.byWeekNo&&{key:"BYWEEKNO",value:e.byWeekNo.join(",")},e.byYearday&&{key:"BYYEARDAY",value:e.byYearday.join(",")},e.count&&{key:"COUNT",value:e.count.toString()},e.interval&&{key:"INTERVAL",value:e.interval.toString()},e.until&&{key:"UNTIL",value:"DATE"===e.until.type?Zs(e.until.date):qs((null==(t=e.until.local)?void 0:t.date)||e.until.date)},e.workweekStart&&{key:"WKST",value:e.workweekStart}].filter(e=>!!e));return n+=Ja("RRULE",r),n})(e),duration:({icsKey:e,value:t})=>Ja(e,ts(t)),organizer:({value:e})=>(e=>{let t=Qa([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.name&&{key:"CN",value:e.name},e.sentBy&&{key:"SENT-BY",value:Xa(e.sentBy)}].filter(e=>!!e));return Ja("ORGANIZER",Xa(e.email),t)})(e),sequence:({icsKey:e,value:t})=>Js(e,t),recurrenceId:({value:e})=>((e,t)=>{let n="";return n+=Xs("RECURRENCE-ID",e.value,e.range?[{key:"RANGE",value:e.range}]:void 0,t),n})(e,{timezones:void 0})},generateArrayValues:{attendees:({value:e})=>es(e,"ATTENDEE"),exceptionDates:({value:e})=>((e,t,n)=>Xs(t,e,void 0,n))(e,"EXDATE",{timezones:void 0})},childComponents:{alarms:e=>Qs(e,{nonStandard:void 0,skipFormatLines:!0})},nonStandard:void 0,skipFormatLines:void 0}),no=Object.defineProperty,ro=Object.getOwnPropertyDescriptor,io=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?ro(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&no(t,n,a),a};let ao=class extends i{constructor(){super(...arguments),this.open=!1,this.eventDetails={heading:"",content:"",time:""},this._cardTop=0,this._cardLeft=0,this._positioned=!1,this._handleKeydown=e=>{if("Tab"!==e.key)return;const t=Array.from(this.renderRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));if(0===t.length)return;const n=t[0],r=t[t.length-1];e.shiftKey?this.renderRoot.activeElement===n&&(e.preventDefault(),r.focus()):this.renderRoot.activeElement===r&&(e.preventDefault(),n.focus())},this._handleClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("menu-close",{bubbles:!0,composed:!0}))},this._handleExport=()=>{const{heading:e,content:t,time:n,date:r}=this.eventDetails,i=r?.year??2025,a=(r?.month??4)-1,s=r?.day??18;let o,l;if("string"==typeof n){const e=n.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);e&&(o={date:new Date(i,a,s,parseInt(e[1]),parseInt(e[2]))},l={date:new Date(i,a,s,parseInt(e[3]),parseInt(e[4]))})}const u={start:{date:o&&o.date||new Date(i,a,s,12,0)},end:{date:l&&l.date||new Date(i,a,s,13,0)},summary:e,description:t,status:"CONFIRMED",uid:`${Date.now()}@lms-calendar`,stamp:{date:/* @__PURE__ */new Date}},c=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LMS Calendar//EN",to(u).trim(),"END:VCALENDAR"].join("\r\n"),d=new Blob([c],{type:"text/calendar"}),h=URL.createObjectURL(d),m=document.createElement("a");m.href=h,m.download=`${e||"event"}.ics`,document.body.appendChild(m),m.click(),setTimeout(()=>{document.body.removeChild(m),URL.revokeObjectURL(h)},0)}}updated(e){(e.has("open")||e.has("anchorRect"))&&this.open&&this.anchorRect&&(this._positioned=!1,this._computePosition(),requestAnimationFrame(()=>{const e=this.renderRoot.querySelector(".close-btn");e?.focus()}))}_computePosition(){requestAnimationFrame(()=>{const e=this.renderRoot.querySelector(".card"),t=this.parentElement;if(!e||!t||!this.anchorRect)return;const n=t.getBoundingClientRect(),r=e.getBoundingClientRect(),i=this.anchorRect.top-n.top,a=this.anchorRect.left-n.left,s=a+this.anchorRect.width,o=i+this.anchorRect.height/2,l=r.width||260,u=r.height||200;let c;c=s+8+l<=n.width?s+8:a-8-l>=0?a-8-l:Math.max(8,(n.width-l)/2);let d=o-u/2;d=Math.max(8,Math.min(d,n.height-u-8)),this._cardTop=d,this._cardLeft=c,this._positioned=!0})}_formatDate(e){return new Date(e.year,e.month-1,e.day).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}render(){const e="card"+(this._positioned?" visible":""),t=this.eventDetails.content&&this.eventDetails.content!==Ca();return a`
            <div
                class=${e}
                role="dialog"
                aria-modal="true"
                aria-label=${Aa()}
                style="top: ${this._cardTop}px; left: ${this._cardLeft}px;"
                @keydown=${this._handleKeydown}
            >
                <div class="header">
                    <span class="title"
                        >${this.eventDetails.heading||_a()}</span
                    >
                    <button
                        type="button"
                        class="close-btn"
                        @click=${this._handleClose}
                        title=${Ra()}
                        aria-label=${Ra()}
                    >
                        &times;
                    </button>
                </div>
                <div class="meta">
                    ${this.eventDetails.time||Ia()}
                </div>
                ${this.eventDetails.date?a`<div class="meta">
                              ${this._formatDate(this.eventDetails.date)}
                          </div>`:s}
                ${t?a`<div class="notes">${this.eventDetails.content}</div>`:s}
                <div class="actions">
                    <button
                        type="button"
                        class="export-btn"
                        @click=${this._handleExport}
                        title=${La()}
                    >
                        ${La()}
                    </button>
                </div>
            </div>
        `}};ao.styles=r`
        :host {
            position: absolute;
            inset: 0;
            z-index: 10000;
            pointer-events: none;
            display: none;
        }
        :host([open]) {
            display: block;
        }
        .card {
            position: absolute;
            pointer-events: auto;
            background: var(--background-color);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            min-width: 16em;
            max-width: 22em;
            padding: 0.875em 1em;
            opacity: 0;
            transform: scale(0.95);
            transition:
                opacity 0.15s ease,
                transform 0.15s ease;
        }
        .card.visible {
            opacity: 1;
            transform: scale(1);
        }
        .header {
            display: flex;
            align-items: flex-start;
            gap: 0.5em;
            margin-bottom: 0.25em;
        }
        .title {
            flex: 1;
            font-size: 1em;
            font-weight: 600;
            color: var(--separator-dark);
            line-height: 1.3;
            word-break: break-word;
        }
        .close-btn {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.125em;
            line-height: 1;
            padding: 0.15em 0.25em;
            margin: -0.15em -0.25em 0 0;
            border-radius: var(--border-radius-sm);
            color: var(--header-text-color);
            transition: background-color 0.15s;
        }
        .close-btn:hover {
            background-color: var(--separator-light);
        }
        .meta {
            font-size: 0.8125em;
            color: var(--header-text-color);
            line-height: 1.5;
        }
        .notes {
            margin-top: 0.5em;
            padding-top: 0.625em;
            border-top: 1px solid var(--separator-light);
            font-size: 0.8125em;
            color: var(--separator-dark);
            word-break: break-word;
            line-height: 1.4;
        }
        .actions {
            padding-top: 0.625em;
        }
        .export-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--system-ui);
            font-size: 0.8125em;
            font-weight: 500;
            color: var(--primary-color);
            padding: 0;
            transition: opacity 0.15s;
        }
        .export-btn:hover {
            opacity: 0.7;
        }
    `,io([l({type:Boolean,reflect:!0})],ao.prototype,"open",2),io([l({type:Object})],ao.prototype,"eventDetails",2),io([l({attribute:!1})],ao.prototype,"anchorRect",2),io([c()],ao.prototype,"_cardTop",2),io([c()],ao.prototype,"_cardLeft",2),io([c()],ao.prototype,"_positioned",2),ao=io([u("lms-menu"),D()],ao);class so{constructor({date:e,direction:t}){e&&(this.date=e),this._direction=t}set date(e){const t=ni.fromObject(e);if(!t.isValid)throw new Error("date couldn't be converted to DateTime object");this._date=t}set direction(e){this._direction=e}_toCalendarDate(e){return{day:e.day,month:e.month,year:e.year}}getDateByDayInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set or invalid");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({days:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}getDateByMonthInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({months:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}}var oo=Object.defineProperty,lo=Object.getOwnPropertyDescriptor,uo=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?lo(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&oo(t,n,a),a};let co=class extends i{constructor(){super(...arguments),this.currentDate=/* @__PURE__ */new Date,this.activeDate={day:this.currentDate.getDate(),month:this.currentDate.getMonth()+1,year:this.currentDate.getFullYear()},this.firstDayOfWeek=1}connectedCallback(){super.connectedCallback(),this.addEventListener("open-menu",e=>{const t=e;if(e.target!==this){e.stopPropagation();const n=new CustomEvent("open-menu",{detail:t.detail,bubbles:!0,composed:!0});this.dispatchEvent(n)}}),this._setupScrollDetection()}_setupScrollDetection(){let e=null;this.updateComplete.then(()=>{const t=this.shadowRoot?.querySelectorAll(".day");t?.forEach(t=>{const n=t;n.addEventListener("scroll",()=>(t=>{e||(e=requestAnimationFrame(()=>{t.scrollTop>5?t.classList.add("scrolled"):t.classList.remove("scrolled"),e=null}))})(n),{passive:!0})})})}_isCurrentDate(e){return new Date(e).toDateString()===this.currentDate.toDateString()}_renderIndicator({year:e,month:t,day:n}){const r=this._isCurrentDate(`${e}/${t}/${n}`);return a` <div
            class="indicator ${d({current:r})}"
        >
            ${1===n?function(e,t,n){const r=new Date(n,t-1,e);return new Intl.DateTimeFormat(ua(),{day:"numeric",month:"short"}).format(r)}(n,t,e):n}
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
        `}_dispatchExpand(e){const t=e.target;if(!(t instanceof HTMLElement))return;if(t.closest("lms-calendar-entry"))return;const{date:n}=t.dataset;if(!n)return;const[r,i,a]=n.split("-").map(e=>parseInt(e,10)),s=new CustomEvent("expand",{detail:{date:{day:a,month:i,year:r}},bubbles:!0,composed:!0});this.dispatchEvent(s)}_handleKeydown(e){const t=e.key;"Space"!==t&&"Enter"!==t||this._dispatchExpand(e)}_getDaysInMonth(e){return Xi(e).with({year:Ki.number,month:Ki.number,day:Ki.number},({year:e,month:t})=>{const n=new Date(e,t,0).getDate();return n>0?n:0}).otherwise(()=>0)}_getOffsetOfFirstDayInMonth(e){return function(e,t){return fa(new Date(e.year,e.month-1,1).getDay(),t)}(e,this.firstDayOfWeek)}_getDatesInMonthAsArray(e,t){return Xi(this._getDaysInMonth(e)).with(0,()=>[]).otherwise(n=>Array.from(Array(n).keys(),(t,n)=>({year:e.year,month:e.month,day:n+1})).slice(...t||[0]))}_getCalendarArray(){if(!this.activeDate)return[];const e=new so({date:this.activeDate});try{e.direction="previous";const t=this._getOffsetOfFirstDayInMonth(this.activeDate),n=t>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[-t]):[],r=this._getDatesInMonthAsArray(this.activeDate,[]);e.date=this.activeDate,e.direction="next";const i=42-(n.length+r.length),a=i>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[0,i]):[];return n.concat(r,a)}catch(t){return console.error("Error generating calendar array:",t),[]}}};co.styles=r`
        .month {
            height: calc(100% - var(--context-height, 1.75em) - var(--context-padding, 0.25em) * 2);
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
            text-align: left;
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
    `,uo([l({attribute:!1})],co.prototype,"activeDate",2),uo([l({type:Number})],co.prototype,"firstDayOfWeek",2),co=uo([u("lms-calendar-month"),D()],co);var ho=Object.defineProperty,mo=Object.getOwnPropertyDescriptor,fo=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?mo(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&ho(t,n,a),a};let yo=class extends i{constructor(){super(...arguments),this.activeDate={day:/* @__PURE__ */(new Date).getDate(),month:/* @__PURE__ */(new Date).getMonth()+1,year:/* @__PURE__ */(new Date).getFullYear()},this.allDayRowCount=0,this.firstDayOfWeek=1}connectedCallback(){super.connectedCallback()}_getWeekDates(){return ya(this.activeDate,this.firstDayOfWeek)}_isCurrentDate(e){const t=/* @__PURE__ */new Date;return e.day===t.getDate()&&e.month===t.getMonth()+1&&e.year===t.getFullYear()}render(){const e=this._getWeekDates(),t=pa(this.firstDayOfWeek),n=this.allDayRowCount>0,r=n?Math.max(2.5,2*this.allDayRowCount)+1:0,i=n?`calc(var(--main-content-height) - ${r}em)`:"var(--main-content-height)";return a`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${e.map((e,n)=>a`
                            <div
                                class="day-label ${d({current:this._isCurrentDate(e)})}"
                                tabindex="0"
                                role="button"
                                aria-label="Switch to day view for ${ma(t[n])}, ${e.day}"
                                @click=${()=>this._handleDayLabelClick(e)}
                                @keydown=${t=>this._handleDayLabelKeydown(t,e)}
                            >
                                <span class="day-name">${ma(t[n])}</span>
                                <span class="day-number">${e.day}</span>
                            </div>
                        `)}
                </div>

                <!-- All-day events section -->
                <div
                    class="all-day-wrapper ${d({collapsed:!n})}"
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
                <div class="week-content" style="height: ${i}">
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
        `}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}_handleDayLabelClick(e){const t=new CustomEvent("expand",{detail:{date:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleDayLabelKeydown(e,t){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._handleDayLabelClick(t))}};function po(e){let t=0,n=0,r=0;if(!e||!e.trim())return["rgb(255,255,255)","rgb(0,0,0)"];const i=(e.startsWith("#")?e:`#${e}`).replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,(e,t,n,r)=>`#${t}${t}${n}${n}${r}${r}`).substring(1).match(/.{2}/g);if(!i||3!==i.length)return["rgb(255,255,255)","rgb(0,0,0)"];try{if([t,n,r]=i.map(e=>parseInt(e,16)),isNaN(t)||isNaN(n)||isNaN(r))return["rgb(255,255,255)","rgb(0,0,0)"]}catch{return["rgb(255,255,255)","rgb(0,0,0)"]}const a=(299*t+587*n+114*r)/1e3;return[`rgb(${t},${n},${r})`,Math.abs(a-255)>Math.abs(a-0)?"rgb(255, 255, 255)":"rgb(0, 0, 0)"]}yo.styles=r`
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

        .all-day-wrapper.collapsed .all-day-container {
            padding: 0;
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
    `,fo([l({attribute:!1})],yo.prototype,"activeDate",2),fo([l({type:Number})],yo.prototype,"allDayRowCount",2),fo([l({type:Number})],yo.prototype,"firstDayOfWeek",2),yo=fo([u("lms-calendar-week"),D()],yo);class go{constructor(e={}){this.config={minuteHeight:e.minuteHeight??1,eventMinHeight:e.eventMinHeight??20}}calculateLayout(e){const t=this.eventsToIntervals(e),n=this.calculateGrading(t);return{boxes:this.calculateBoxes(e,n)}}eventsToIntervals(e){return e.map(e=>({start:60*e.startTime.hour+e.startTime.minute,end:60*e.endTime.hour+e.endTime.minute}))}calculateGrading(e){const t=[];return this.findOverlapGroups(e).forEach((n,r)=>{if(1===n.length)t.push({index:n[0],depth:0,group:r});else{const i=n.map(t=>({...e[t],originalIndex:t})),a=i.reduce((e,t)=>t.end-t.start>e.end-e.start?t:e);let s=1;i.forEach(e=>{const n=e.originalIndex===a.originalIndex?0:s++;t.push({index:e.originalIndex,depth:n,group:r})})}}),t.sort((e,t)=>e.index-t.index),t}findOverlapGroups(e){const t=[],n=/* @__PURE__ */new Set;return e.forEach((r,i)=>{if(n.has(i))return;const a=[i];n.add(i);let s=!0;for(;s;)s=!1,e.forEach((t,r)=>{if(n.has(r))return;a.some(n=>this.intervalsOverlap(e[n],t))&&(a.push(r),n.add(r),s=!0)});t.push(a)}),t}intervalsOverlap(e,t){return e.start<t.end&&t.start<e.end}calculateBoxes(e,t){const n=/* @__PURE__ */new Map;return e.forEach((e,r)=>{const i=t[r]||{depth:0,group:r};n.has(i.group)||n.set(i.group,[]),n.get(i.group).push({event:e,index:r,grade:i})}),e.map((e,r)=>{const i=t[r]||{depth:0,group:r},a=60*e.startTime.hour+e.startTime.minute,s=60*e.endTime.hour+e.endTime.minute-a,o=n.get(i.group)||[],l=Math.max(...o.map(e=>e.grade.depth));let u,c;if(1===o.length)u=100,c=0;else{const e=100-65;0===i.depth?(c=0,u=100):(c=l>0?i.depth/l*e:0,u=100-c)}const d=100+i.depth;return{id:e.id,x:c,y:a*this.config.minuteHeight,width:u,height:Math.max(s*this.config.minuteHeight,this.config.eventMinHeight),depth:i.depth,group:i.group,opacity:0===i.depth?.95:Math.max(.85,.95-.05*i.depth),zIndex:d}})}}const vo=new class{calculatePosition(e){const{viewMode:t,date:n,time:r,isAllDay:i}=e;switch(t){case"day":return this._calculateDayPosition(n,r,i);case"week":return this._calculateWeekPosition(n,e.activeDate,r,i,e.firstDayOfWeek);case"month":return this._calculateMonthPosition(n);default:throw new Error(`Unsupported view mode: ${t}`)}}generatePositionCSS(e,t,n){if(e.useDirectGrid){const n=String(e.gridColumn||2),r=e.gridRow||"1",i=String(t.width),a=String(t.x),s=String(t.zIndex),l=String(t.opacity);return o(`\n                grid-column: ${n};\n                grid-row: ${r};\n                --entry-width: ${i}%;\n                --entry-margin-left: ${a}%;\n                --entry-z-index: ${s};\n                --entry-opacity: ${l};\n            `)}{const e=n?this._getGridSlotByTime(n):"1",r=String(t.width),i=String(t.x),a=String(t.zIndex),s=String(t.opacity);return o(`\n                --start-slot: ${e};\n                --entry-width: ${r}%;\n                --entry-margin-left: ${i}%;\n                --entry-z-index: ${a};\n                --entry-opacity: ${s};\n            `)}}_calculateDayPosition(e,t,n){if(n)return{slotName:"all-day",useDirectGrid:!1};if(!t)throw new Error("Day view entries must have time information");return{slotName:t.start.hour.toString(),useDirectGrid:!1}}_calculateWeekPosition(e,t,n,r,i){const a=this.getWeekDayIndex(e,t,i??1),s=a+2;if(r)return{slotName:`all-day-${e.year}-${e.month}-${e.day}`,gridColumn:s,gridRow:"1 / 60",useDirectGrid:!1,isAllDay:!0,dayIndex:a};if(!n)throw new Error("Week view timed entries must have time information");return{slotName:"",gridColumn:s,gridRow:this._getGridSlotByTime(n),useDirectGrid:!0}}_calculateMonthPosition(e){return{slotName:`${e.year}-${e.month}-${e.day}`,useDirectGrid:!1}}getWeekDayIndex(e,t,n=1){const r=ya(t,n).findIndex(t=>t.day===e.day&&t.month===e.month&&t.year===e.year);return r>=0?r:0}_getGridSlotByTime({start:e,end:t}){const n=60*e.hour+(e.minute+1),r=n+(60*t.hour+t.minute-n);return n===r?`${n}/${r+1}`:`${n}/${r}`}calculateAccessibility(e){const{viewMode:t,date:n,time:r,isAllDay:i,firstDayOfWeek:a}=e;let s=0;if("week"===t&&r&&!i){s=1e4+1e4*this.getWeekDayIndex(n,e.activeDate,a??1)+100*r.start.hour+r.start.minute}else if("day"===t&&r&&!i)s=60*r.start.hour+r.start.minute;else if(i)if("week"===t){s=1e3+this.getWeekDayIndex(n,e.activeDate,a??1)}else s=0;return{tabIndex:s,role:"button",ariaLabel:this._generateAriaLabel(e)}}_generateAriaLabel(e){const{date:t,time:n,isAllDay:r}=e;return`Calendar event on ${`${t.month}/${t.day}/${t.year}`}, ${r||!n?"All day":`${String(n.start.hour).padStart(2,"0")}:${String(n.start.minute).padStart(2,"0")} to ${String(n.end.hour).padStart(2,"0")}:${String(n.end.minute).padStart(2,"0")}`}. Press Enter or Space to open details.`}getPositionDescription(e){const t=this.calculatePosition(e);return t.useDirectGrid?`Direct grid: column ${t.gridColumn}, row ${t.gridRow}`:`Slot: "${t.slotName}"`}validatePosition(e){try{return this.calculatePosition(e),{valid:!0}}catch(t){return{valid:!1,error:t instanceof Error?t.message:"Unknown validation error"}}}};class wo{constructor(e){this._viewMode="month",this._host=e,e.addController(this);const t=/* @__PURE__ */new Date;this._activeDate={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()}}hostConnected(){}get viewMode(){return this._viewMode}get activeDate(){return this._activeDate}get expandedDate(){return"day"===this._viewMode?this._activeDate:void 0}setViewMode(e){this._viewMode=e,this._host.requestUpdate()}setActiveDate(e){this._activeDate=e,this._host.requestUpdate()}navigateNext(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()+7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day+1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}navigatePrevious(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month-2,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()-7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day-1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}jumpToToday(){const e=/* @__PURE__ */new Date;this.setActiveDate({day:e.getDate(),month:e.getMonth()+1,year:e.getFullYear()})}switchToMonthView(){this.setViewMode("month")}switchToWeekView(){this.setViewMode("week")}switchToDayView(){this.setViewMode("day")}}var bo=Object.defineProperty,ko=Object.getOwnPropertyDescriptor,Do=(e,t,n,r)=>{for(var i,a=r>1?void 0:r?ko(t,n):t,s=e.length-1;s>=0;s--)(i=e[s])&&(a=(r?i(t,n,a):i(a))||a);return r&&a&&bo(t,n,a),a};let So=class extends i{constructor(){super(...arguments),this.firstDayOfWeek=1,this._viewState=new wo(this),this.entries=[],this.color="#000000",this._calendarWidth=window.innerWidth,this._menuOpen=!1,this._layoutCalculator=new go({timeColumnWidth:80,minuteHeight:1,eventMinHeight:20,cascadeOffset:15,paddingLeft:10}),this._handleResize=e=>{const[t]=e;this._calendarWidth=t.contentRect.width||this._calendarWidth},this._resizeController=new m(this,{target:null,callback:this._handleResize,skipInitial:!0}),this._handleClickOutside=e=>{if(!this._menuOpen)return;const t=e.composedPath(),n=this.shadowRoot?.querySelector("lms-menu"),r=n&&t.includes(n),i=t.some(e=>e instanceof HTMLElement&&"LMS-CALENDAR-ENTRY"===e.tagName);r||i||this._closeMenuAndClearSelections()},this._handleEscape=e=>{"Escape"===e.key&&this._menuOpen&&this._closeMenuAndClearSelections()}}get activeDate(){return this._viewState.activeDate}set activeDate(e){this._viewState.setActiveDate(e)}get _expandedDate(){return this._viewState.expandedDate}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._handleClickOutside,!0),document.addEventListener("keydown",this._handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._handleClickOutside,!0),document.removeEventListener("keydown",this._handleEscape)}_closeMenuAndClearSelections(){this._menuOpen=!1,this._menuEventDetails=void 0,this._returnFocusToTrigger(),this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e.clearSelection()})}_returnFocusToTrigger(){if(this._menuTriggerEntry){const e=this._menuTriggerEntry.shadowRoot?.querySelector('[role="button"]');(e??this._menuTriggerEntry).focus(),this._menuTriggerEntry=void 0}}firstUpdated(e){const t=this.shadowRoot?.firstElementChild;if(!t)return;this._resizeController.observe(t);const n=document.documentElement.lang;n&&ca(n)}willUpdate(e){this.entries.length&&(this.entries=si(this.entries,mi(e=>dr.fromDateTimes(ni.fromObject(xi(e.date.start,e.time.start)),ni.fromObject(xi(e.date.end,e.time.end))).isValid),function(...e){return ii(Oi,e)}((e,t)=>e.time.start.hour-t.time.start.hour||e.time.start.minute-t.time.start.minute)))}render(){const e=this._viewState.viewMode,t=this._viewState.activeDate;return a`
            <div class="calendar-container">
                <header>
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
                </header>

                <main role="region" aria-live="polite" aria-label="${e} view">
                    ${"month"===e?a`
                              <lms-calendar-context
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                              > </lms-calendar-context>

                              <lms-calendar-month
                                  @expand=${this._handleExpand}
                                  @open-menu=${this._handleOpenMenu}
                                  @clear-other-selections=${this._handleClearOtherSelections}
                                  .activeDate=${t}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
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
                                          .firstDayOfWeek=${this.firstDayOfWeek}
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
                </main>

                <lms-menu
                    ?open=${this._menuOpen}
                    .eventDetails=${this._menuEventDetails||{heading:"",content:"",time:""}}
                    .anchorRect=${this._menuEventDetails?.anchorRect}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `}_handleSwitchDate(e){"next"===e.detail.direction?this._viewState.navigateNext():"previous"===e.detail.direction&&this._viewState.navigatePrevious()}_handleSwitchView(e){return Xi(e.detail.view).with("day",()=>this._viewState.switchToDayView()).with("week",()=>this._viewState.switchToWeekView()).with("month",()=>this._viewState.switchToMonthView()).otherwise(()=>{})}_handleJumpToday(e){this._viewState.jumpToToday()}_handleExpand(e){this._viewState.setActiveDate(e.detail.date),this._viewState.switchToDayView()}_handleOpenMenu(e){const t=e.target;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()}),this._menuTriggerEntry=t,this.openMenu(e.detail)}_handleClearOtherSelections(e){const t=e.detail.exceptEntry;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()})}_handleMenuClose(){this._menuOpen=!1,this._menuEventDetails=void 0,this._returnFocusToTrigger()}openMenu(e){this._menuEventDetails=e,this._menuOpen=!0}_composeEntry({index:e,slot:t,styles:n,entry:r,isContinuation:i=!1,density:s,displayMode:o="default",floatText:l=!1,spanClass:u}){const c=s||this._determineDensity(r,void 0,void 0,void 0);return a`
            <style>
                ${n}
            </style>
            <lms-calendar-entry
                class=${`_${e}${u?` ${u}`:""}`}
                slot=${t}
                .time=${r.time}
                .heading=${r.heading??""}
                .content=${r.content}
                .isContinuation=${i??!1}
                .date=${r.date}
                .density=${c}
                .displayMode=${o}
                .floatText=${l}
                .accessibility=${r.accessibility}
            >
            </lms-calendar-entry>
        `}_getEntriesCountForDay(e){return this.entries.filter(t=>{const n=ni.fromObject(t.date.start),r=ni.fromObject(t.date.end),i=ni.fromObject(e);return i>=n&&i<=r}).length}_determineDensity(e,t,n,r){if(!e.time)return"compact";if(n&&void 0!==r&&n[r])return"standard";const i=60*(e.time.end.hour-e.time.start.hour)+(e.time.end.minute-e.time.start.minute);return i<30?"compact":i>120&&e.content?"full":"standard"}_expandEntryMaybe({entry:e,range:t}){return Array.from({length:t[2]},(n,r)=>{const i=ni.fromJSDate(t[0]).plus({days:r}),a=i.plus({days:1}).minus({seconds:1});return{...e,date:{start:i.toObject(),end:a.toObject()},isContinuation:r>0,continuation:{has:t[2]>1,is:r>0,index:r,total:t[2]},originalStartDate:e.date?.start}})}_createConsistentEventId(e){const t=e.originalStartDate||e.date?.start;return t?`${e.heading||"unknown"}-${t.year}-${t.month}-${t.day}-${e.time?.start.hour||0}-${e.time?.start.minute||0}`:`${e.heading||"unknown"}-fallback`}_renderEntries(){if(!this.entries.length)return s;const e=/* @__PURE__ */new Map;return this.entries.forEach((t,n)=>{e.set(this._createConsistentEventId(t),n)}),si(this.entries,pi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return ci(Mi,e)}(t=>{const n=this._createConsistentEventId(t),r=e.get(n)||0,i=t;return i.continuation?.has||!1?r-1e3:r}),ki(e=>[e,...po(e.color)]),ki(([t,n,i],a)=>{const s=this._createConsistentEventId(t),l=e.get(s)||a,u=t.isContinuation||t.continuation?.has||!1?"all-day-":"";return this._composeEntry({index:l,slot:`${u}${t.date.start.year}-${t.date.start.month}-${t.date.start.day}`,styles:r`
                        lms-calendar-entry._${l} {
                            --entry-color: ${o(n)};
                            --entry-background-color: ${o(n)};
                            /* Add z-index based on original order for consistent layering */
                            z-index: ${100+l};
                        }
                    `,entry:{time:t.time,heading:t.heading,content:t.content,date:t.date,isContinuation:t.isContinuation||!1,continuation:t.continuation},density:this._determineDensity({time:t.time,heading:t.heading,content:t.content},this._getEntriesCountForDay(t.date.start),void 0,void 0),displayMode:"month-dot"})}))}_renderEntriesByDate(){const e=this._viewState.activeDate,t=this._viewState.viewMode;if("day"!==t&&"week"!==t)return s;const n=si(this.entries,pi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),mi(n=>{if("day"===t)return function(...e){return ii(bi,e)}(ni.fromObject(n.date.start).toISODate(),ni.fromObject(e).toISODate());{const t=this._getWeekStartDate(e),r=Array.from({length:7},(e,n)=>{const r=new Date(t);return r.setDate(t.getDate()+n),ni.fromJSDate(r).toISODate()}),i=ni.fromObject(n.date.start).toISODate();return r.includes(i)}})),r=n.filter(e=>!e.time||e.time&&Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has),i=n.filter(e=>!(!e.time||Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has));return i.length||r.length?this._renderEntriesWithSlotManager(t,e,r,i):{elements:s,allDayRowCount:0}}_renderEntriesWithSlotManager(e,t,n,i){const a=[];if(i.length>0)if("week"===e){const n=function(...e){return ii(wi,e)}(i,e=>`${e.date.start.year}-${e.date.start.month}-${e.date.start.day}`);Object.entries(n).map(([e,t])=>({dayKey:e,dayEntries:t})).filter(({dayEntries:e})=>e&&e.length>0).sort((e,n)=>{const r=e.dayEntries[0],i=n.dayEntries[0];if(!(r&&i&&r.date&&i.date))return 0;return vo.getWeekDayIndex(r.date.start,t,this.firstDayOfWeek)-vo.getWeekDayIndex(i.date.start,t,this.firstDayOfWeek)}).forEach(({dayEntries:n})=>{const r=this._renderDayEntriesWithSlotManager(n,e,t,i);a.push(...r)})}else{const n=this._renderDayEntriesWithSlotManager(i,e,t,i);a.push(...n)}const s=n.map(n=>({id:this._createConsistentEventId(n),days:["week"===e?vo.getWeekDayIndex(n.date.start,t,this.firstDayOfWeek):0],isMultiDay:n.continuation?.is||n.continuation?.has||!1})),l=/* @__PURE__ */new Map;s.forEach(e=>{const t=l.get(e.id);t?t.days.push(...e.days):l.set(e.id,{...e,days:[...e.days]})});const{rowAssignments:u,totalRows:c}=function(e){const t=/* @__PURE__ */new Map;if(0===e.length)return{rowAssignments:t,totalRows:0};const n=[],r=[];e.forEach(e=>{e.isMultiDay?n.push(e):r.push(e)}),n.sort((e,t)=>{const n=Math.min(...e.days),r=Math.min(...t.days);return n!==r?n-r:e.id.localeCompare(t.id)}),r.sort((e,t)=>Math.min(...e.days)-Math.min(...t.days));const i=/* @__PURE__ */new Map;for(let s=0;s<7;s++)i.set(s,/* @__PURE__ */new Set);n.forEach(e=>{let n=0,r=!1;for(;!r;){let a=!0;for(const t of e.days)if(i.get(t)?.has(n)){a=!1;break}if(a){r=!0,t.set(e.id,n);for(const t of e.days)i.get(t)?.add(n)}else n++}}),r.forEach(e=>{const n=e.days[0];let r=0;for(;i.get(n)?.has(r);)r++;t.set(e.id,r),i.get(n)?.add(r)});let a=0;return i.forEach(e=>{a=Math.max(a,e.size)}),{rowAssignments:t,totalRows:a}}(Array.from(l.values()));return{elements:[...n.map((n,a)=>{const[s,c]=po(n.color),d=this._createConsistentEventId(n),h={viewMode:e,date:n.date.start,isAllDay:!0,activeDate:t,firstDayOfWeek:this.firstDayOfWeek},m=vo.calculatePosition(h),f=vo.calculateAccessibility(h),y=u.get(d)??0,p={width:100,x:0,zIndex:100+y,opacity:1},g=vo.generatePositionCSS(m,p),v=n.continuation;let w="single-day";if((v?.has||v?.is||!1)&&v){const r=l.get(d),i=[...r?.days??[]].sort((e,t)=>e-t),a="week"===e?vo.getWeekDayIndex(n.date.start,t,this.firstDayOfWeek):0;w=function(e){const{continuationIndex:t,totalDays:n,visibleStartIndex:r,visibleEndIndex:i}=e;if(n<=1)return"single-day";const a=t===r,s=t===i;return a&&s?"single-day":a?"first-day":s?"last-day":"middle-day"}({continuationIndex:a,totalDays:v.total,visibleStartIndex:i[0]??a,visibleEndIndex:i[i.length-1]??a})}return this._composeEntry({index:a+i.length,slot:m.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${a+i.length} {
                        --entry-background-color: ${o(s)};
                        --entry-color: ${o(c)};
                        order: ${y};
                        ${g};
                    }
                `,entry:{...n,accessibility:f},density:"standard",floatText:!1,spanClass:w})}),...a],allDayRowCount:c}}_renderDayEntriesWithSlotManager(e,t,n,i){const a=e.map((e,t)=>({id:String(t),heading:e.heading||"",startTime:{hour:e.time.start.hour,minute:e.time.start.minute},endTime:{hour:e.time.end.hour,minute:e.time.end.minute},color:e.color||"#1976d2"})),s=this._layoutCalculator.calculateLayout(a);return e.map((e,a)=>{const l=s.boxes[a],u=i.indexOf(e),c={viewMode:t,date:e.date.start,time:e.time,activeDate:n,isAllDay:e.isContinuation||this._isAllDayEvent(e),firstDayOfWeek:this.firstDayOfWeek},d=vo.calculatePosition(c),h=vo.calculateAccessibility(c),m={width:l.width,x:l.x,zIndex:l.zIndex,opacity:l.opacity,height:l.height},f=vo.generatePositionCSS(d,m,e.time);return this._composeEntry({index:u,slot:d.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${u} {
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
                `,entry:{...e,accessibility:h},density:"standard",floatText:!1})})}_renderEntriesSumByDay(){return si(this.entries,pi(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return ii(Ti,e)}((e,t)=>{const n=`${t.date.start.day}-${t.date.start.month}-${t.date.start.year}`;return e[n]=e[n]?e[n]+1:1,e},{}),Object.entries,ki(([e,t],n)=>this._composeEntry({index:n,slot:e.split("-").reverse().join("-"),styles:r`
                        lms-calendar-entry._${n} {
                            --entry-color: var(--separator-mid);
                            text-align: center;
                        }
                    `,entry:{heading:`${t} events`},displayMode:"month-dot"})))}_getWeekStartDate(e){const t=ya(e,this.firstDayOfWeek)[0];return new Date(t.year,t.month-1,t.day)}_getSmartLayout(e,t,n,r){if(!e.time)return"row";if(!(r&&r.depth>0))return"row";return t>=40?"column":"row"}_getDaysRange(e){const{start:t,end:n}=e,r=new Date(t.year,t.month-1,t.day),i=new Date(n.year,n.month-1,n.day);return[r,i,(i.getTime()-r.getTime())/864e5+1]}_isAllDayEvent(e){if(!e.time)return!0;const{start:t,end:n}=e.time;return 0===t.hour&&0===t.minute&&23===n.hour&&59===n.minute}};So.styles=r`
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
            --view-container-height-offset: 0px;
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
        .calendar-container {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        header {
            flex-shrink: 0;
        }
        main {
            flex: 1;
            min-height: 0;
            overflow: hidden;
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
    `,Do([l({type:String})],So.prototype,"heading",2),Do([l({type:Number,attribute:"first-day-of-week"})],So.prototype,"firstDayOfWeek",2),Do([l({type:Array})],So.prototype,"entries",2),Do([l({type:String})],So.prototype,"color",2),Do([c()],So.prototype,"_calendarWidth",2),Do([c()],So.prototype,"_menuOpen",2),Do([c()],So.prototype,"_menuEventDetails",2),So=Do([u("lms-calendar"),D()],So);export{dr as Interval,So as default};
//# sourceMappingURL=lms-calendar.bundled.js.map
