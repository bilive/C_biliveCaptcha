"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
        const send = {
            method: 'POST',
            uri: 'https://bilive.halaal.win/captcha/v1',
            servername: '',
            json: true,
            body: { image }
        };
        const ruokuaiResponse = await plugin_1.tools.XHR(send);
        if (ruokuaiResponse !== undefined && ruokuaiResponse.response.statusCode === 200) {
            const body = ruokuaiResponse.body;
            if (body.code === 0 && body.success)
                return body.message;
            else {
                plugin_1.tools.Log('哔哩打码', body.message);
                return '';
            }
        }
        else {
            plugin_1.tools.Log('哔哩打码', '网络错误');
            return '';
        }
    }
}
exports.default = new BiliveCaptcha();
