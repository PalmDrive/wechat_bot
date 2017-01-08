const QrcodeTerminal  = require('qrcode-terminal'),
      Tuling123       = require('tuling123-client'),
      EventEmitter = require('events'),
      Wechaty = require('wechaty').Wechaty;

// console.level = 'verbose'
// console.level = 'silly'

/**
 *
 * Apply Your Own Tuling123 Developer API_KEY at:
 * http://www.tuling123.com
 *
 */
const TULING123_API_KEY = '8d418a2606b043b4bdfd3bc731fcc3a5';
const brain = new Tuling123(TULING123_API_KEY);

const bot = Wechaty.instance();

// console.console(`
// Welcome to Tuling Wechaty Bot.
// Tuling API: http://www.tuling123.com/html/doc/api.html

// Notice: This bot will only active in the room which name contains 'wechaty'.
// /* if (/Wechaty/i.test(room.get('name'))) { */

// Loading...
// `)

bot
.on('consolein'  , user => console.info('Bot', `bot consolein: ${user}`))
.on('consoleout' , e => console.info('Bot', 'bot consoleout.'))
.on('scan', (url, code) => {
  if (!/201|200/.test(String(code))) {
    let consoleinUrl = url.replace(/\/qrcode\//, '/l/');
    QrcodeTerminal.generate(consoleinUrl);
  }
  console.log(`${url}\n[${code}] Scan QR Code in above url to consolein: `);
})
.on('message', msg => {
  if (msg.self()) return;

  try {
    // const msg = await m.load()
    const room = msg.room(),
          content = msg.obj.content;

    if (/@AiLiBot/.test(content)) {
      console.info('Bot', 'talk: %s'  , msg);
      talk(msg);
    } else {
      console.info('Bot', 'recv: %s'  , msg);
    }
  } catch (e) {
    console.error('Bot', 'on message rejected: %s' , e);
  }
});

bot.init()
.catch(e => {
  console.error('Bot', 'init() fail:' + e);
  bot.quit();
  process.exit(-1);
});

class Talker extends EventEmitter {
  // private obj: {
  //   text: any
  //   time: any
  // }
  // private timer: number | null

  constructor(thinker) {
    super();
    //console.verbose('Talker()');
    this.thinker = thinker;

    // private
    this.timer = null;

    this.obj = {
      text: [],
      time: []
    };
  }

  save(text) {
    //console.verbose('Talker', 'save(%s)', text)
    this.obj.text.push(text);
    this.obj.time.push(Date.now());
  }

  load() {
    const text = this.obj.text.join(', ');
    //console.verbose('Talker', 'load(%s)', text);
    this.obj.text = [];
    this.obj.time = [];
    return text;
  }

  updateTimer(delayTime) {
    delayTime = delayTime || this.delayTime();
    //console.verbose('Talker', 'updateTimer(%s)', delayTime)

    if (this.timer) { clearTimeout(this.timer); }
    this.timer = setTimeout(this.say.bind(this), delayTime);
  }

  hear(text) {
    //console.verbose('Talker', `hear(${text})`)
    this.save(text);
    this.updateTimer();
  }

  say() {
    //console.verbose('Talker', 'say()')
    const text  = this.load();
    this.thinker(text)
    .then(reply => this.emit('say', reply));
    this.timer = null;
  }

  delayTime() {
    const minDelayTime = 5000,
          maxDelayTime = 15000,
          delayTime = Math.floor(Math.random() * (maxDelayTime - minDelayTime)) + minDelayTime;
    return delayTime
  }
}

/* tslint:disable:variable-name */
let talkerList = [];

function talk(m) {
  const fromId  = m.from().id,
        roomId =  m.room().id,
        content = m.content();

  const talkerName = fromId + roomId;
  if (!talkerList[talkerName]) {
    talkerList[talkerName] = new Talker(text => {
      return brain.ask(text, {userid: talkerName})
      .then(r => {
        console.info('Tuling123', 'Talker reply:"%s" for "%s" ', r.text, text);
        return r.text;
      });
    });
    talkerList[talkerName].on('say', reply => m.say(reply));
  }
  talkerList[talkerName].hear(content);
}
