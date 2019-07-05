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
const https_1 = __importDefault(require("https"));
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
        defaultOptions.config['biliveCaptcha'] = false;
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
        const host = 'bilive.halaal.win';
        const ip = await dns_1.promises.lookup(host).catch(() => undefined);
        if (ip === undefined)
            return '';
        return new Promise(resolve => {
            const req = https_1.default.request({
                method: 'POST',
                host,
                port: 443,
                path: '/captcha/v1',
                rejectUnauthorized: false,
                setHost: false,
                servername: ip.address,
                timeout: 10,
                headers: {
                    host,
                    'content-type': 'application/json',
                    'content-length': imageBase64.length,
                    'connection': 'close',
                }
            }, res => {
                res.on('error', err => {
                    plugin_1.tools.Log('哔哩打码', '网络错误', err);
                    resolve('');
                });
                if (res.statusCode !== 200) {
                    plugin_1.tools.Log('哔哩打码', res.statusCode);
                    return resolve('');
                }
                res.setEncoding('utf8');
                res.on('data', async (data) => {
                    const body = await plugin_1.tools.JSONparse(data);
                    if (body !== undefined && body.code === 0 && body.success)
                        resolve(body.message);
                    else {
                        plugin_1.tools.Log('哔哩打码', data);
                        resolve('');
                    }
                });
            });
            req.on('error', err => {
                plugin_1.tools.Log('哔哩打码', '网络错误', err);
                resolve('');
            });
            req.write(imageBase64);
            req.end();
        });
    }
}
exports.default = new BiliveCaptcha();
