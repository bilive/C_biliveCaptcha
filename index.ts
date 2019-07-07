import { Options as requestOptions } from 'request'
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
    const send: requestOptions = {
      method: 'POST',
      uri: 'https://bilive.halaal.win/captcha/v1',
      // @ts-ignore d.ts 未更新
      servername: '',
      json: true,
      body: { image }
    }
    // @ts-ignore d.ts 未更新
    const ruokuaiResponse = await tools.XHR<biliveCaptchaResult>(send)
    if (ruokuaiResponse !== undefined && ruokuaiResponse.response.statusCode === 200) {
      const body = ruokuaiResponse.body
      if (body.code === 0 && body.success) return body.message
      else {
        tools.Log('哔哩打码', body.message)
        return ''
      }
    }
    else {
      tools.Log('哔哩打码', '网络错误')
      return ''
    }
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