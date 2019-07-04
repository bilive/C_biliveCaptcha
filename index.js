"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tls_1 = __importDefault(require("tls"));
const dns_1 = require("dns");
const plugin_1 = __importStar(require("../../plugin"));
class BiliveCaptcha extends plugin_1.default {
    constructor() {
        super();
        this.name = '哔哩打码';
        this.description = '使用哔哩打码识别验证码';
        this.version = '0.0.1';
        this.author = 'lzghzr';
    }
    async load({ defaultOptions, whiteList }) {
        defaultOptions.config['biliveCaptcha'] = [];
        defaultOptions.info['biliveCaptcha'] = {
            description: '哔哩打码',
            tip: '是否使用哔哩打码',
            type: 'boolean'
        };
        whiteList.add('biliveCaptcha');
        this.loaded = true;
    }
    async options({ options }) {
        this._ = options;
        plugin_1.tools.Captcha = captchaJPEG => this._captcha(captchaJPEG);
    }
    async _captcha(captchaJPEG) {
        const useCaptcha = this._.config['biliveCaptcha'];
        if (!useCaptcha)
            return '';
        const image = captchaJPEG.split(',')[1];
        const imageBase64 = `{"image":"${image}"}`;
        const ip = await dns_1.promises.lookup('bilive.halaal.win').catch(() => undefined);
        if (ip === undefined)
            return '';
        return new Promise(resolve => {
            const c = tls_1.default.connect({
                host: ip.address,
                port: 443,
                rejectUnauthorized: false,
                timeout: 10
            });
            c.setEncoding('utf8');
            c.on('error', () => {
                plugin_1.tools.Log('哔哩打码', '网络错误');
                resolve('');
            });
            c.on('data', async (data) => {
                const codeReg = data.match(/HTTP\/[\d\.]* (?<statusCode>\d*) /);
                const bodyReg = data.match(/(?<bodyStr>{.*})/);
                if (codeReg !== null && bodyReg !== null) {
                    const { statusCode } = codeReg.groups;
                    if (statusCode === '200') {
                        const { bodyStr } = codeReg.groups;
                        const body = await plugin_1.tools.JSONparse(bodyStr);
                        if (body !== undefined && body.code === 0 && body.success)
                            resolve(body.message);
                        else
                            plugin_1.tools.Log('哔哩打码', bodyStr);
                    }
                    else
                        plugin_1.tools.Log('哔哩打码', statusCode);
                }
                else
                    plugin_1.tools.Log('哔哩打码', data);
                resolve('');
            });
            c.write(`POST /captcha/v1 HTTP/1.1\r\n\
host: bilive.halaal.win\r\n\
content-type: application/json\r\n\
content-length: ${imageBase64.length}\r\n\
connection: close\r\n\r\n\
${imageBase64}\r\n\r\n`, err => { if (err !== undefined)
                resolve(''); });
        });
    }
}
exports.default = new BiliveCaptcha();
