import tls from 'tls'
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
    const ip = await dnsPromises.lookup('bilive.halaal.win').catch(() => undefined)
    if (ip === undefined) return ''
    return new Promise<string>(resolve => {
      const c = tls.connect({
        host: ip.address,
        port: 443,
        rejectUnauthorized: false,
        timeout: 10
      })
      c.setEncoding('utf8')
      c.on('error', () => {
        tools.Log('哔哩打码', '网络错误')
        resolve('')
      })
      c.on('data', async (data: string) => {
        const codeReg = data.match(/HTTP\/[\d\.]* (?<statusCode>\d*) /)
        const bodyReg = data.match(/(?<bodyStr>{.*})/)
        if (codeReg !== null && bodyReg !== null) {
          const { statusCode } = <{ statusCode: string }>codeReg.groups
          if (statusCode === '200') {
            const { bodyStr } = <{ bodyStr: string }>bodyReg.groups
            const body = await tools.JSONparse<biliveCaptchaResult>(bodyStr)
            if (body !== undefined && body.code === 0 && body.success) resolve(body.message)
            else tools.Log('哔哩打码', bodyStr)
          }
          else tools.Log('哔哩打码', statusCode)
        }
        else tools.Log('哔哩打码', data)
        resolve('')
      })
      c.write(`POST /captcha/v1 HTTP/1.1\r\n\
host: bilive.halaal.win\r\n\
content-type: application/json\r\n\
content-length: ${imageBase64.length}\r\n\
connection: close\r\n\r\n\
${imageBase64}\r\n\r\n`, err => { if (err !== undefined) resolve('') })
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