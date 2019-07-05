import https from 'https'
// @ts-ignore d.ts没有跟进
import { promises as dnsPromises } from 'dns'
import Plugin, { tools } from '../../plugin'

class BiliveCaptcha extends Plugin {
  constructor() {
    super()
  }
  public name = '哔哩打码'
  public description = '使用哔哩打码识别验证码'
  public version = '0.0.1'
  public author = 'lzghzr'
  /**
   * 获取设置
   *
   * @private
   * @type {options}
   * @memberof BiliveCaptcha
   */
  private _!: options
  public async load({ defaultOptions, whiteList }: {
    defaultOptions: options,
    whiteList: Set<string>
  }): Promise<void> {
    defaultOptions.config['biliveCaptcha'] = false
    defaultOptions.info['biliveCaptcha'] = {
      description: '哔哩打码',
      tip: '是否使用哔哩打码',
      type: 'boolean'
    }
    whiteList.add('biliveCaptcha')
    this.loaded = true
  }
  public async options({ options }: { options: options }): Promise<void> {
    this._ = options
    tools.Captcha = captchaJPEG => this._captcha(captchaJPEG)
  }
  private async _captcha(captchaJPEG: string) {
    const useCaptcha = <boolean>this._.config['biliveCaptcha']
    if (!useCaptcha) return ''
    const image = captchaJPEG.split(',')[1]
    const imageBase64 = `{"image":"${image}"}`
    // 规避域名备案
    const host = 'bilive.halaal.win'
    const ip = await dnsPromises.lookup(host).catch(() => undefined)
    if (ip === undefined) return ''
    return new Promise<string>(resolve => {
      const req = https.request({
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
          tools.Log('哔哩打码', '网络错误', err)
          resolve('')
        })
        if (res.statusCode !== 200) {
          tools.Log('哔哩打码', res.statusCode)
          return resolve('')
        }
        res.setEncoding('utf8')
        res.on('data', async data => {
          const body = await tools.JSONparse<biliveCaptchaResult>(data)
          if (body !== undefined && body.code === 0 && body.success) resolve(body.message)
          else {
            tools.Log('哔哩打码', data)
            resolve('')
          }
        })
      })
      req.on('error', err => {
        tools.Log('哔哩打码', '网络错误', err)
        resolve('')
      })
      req.write(imageBase64)
      req.end()
    })
  }
}

/**
 * 哔哩打码返回
 *
 * @interface biliveCaptchaResult
 */
interface biliveCaptchaResult {
  code: number
  message: string
  success: boolean
}

export default new BiliveCaptcha()