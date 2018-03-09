// imports
import { parse } from 'url'

import EventStore from './store'

// constants
const pingUrlRegexp = new RegExp('^/ping$')

// export main
export default async function main (CONFIG, micro) {
  const { send } = micro

  // init dependencies
  const Actor = await require(CONFIG.ACTOR_LIB)[CONFIG.ACTOR]
  const actor = await new Actor()

  // init event store to start consuming data
  new EventStore(CONFIG, actor) // eslint-disable-line no-new

  // router for microservice
  async function route (req, res) {
    if (pingUrlRegexp.test(req.url)) return send(res, 200)

    // construct payload with parsed request data for query processing
    const payload = {
      meta: {
        headers: { ...req.headers },
        method: req.method,
        url: parse(req.url, true),
        urlParams: actor.parse(req.url)
      }
    }

    try {
      const response = await actor.perform(payload)

      /* istanbul ignore if */
      if (CONFIG.NODE_ENV === 'development') console.log(`'${req.url}' queried successfully at ${new Date().toJSON()}`)
      return send(res, 200, response)
    } catch (e) {
      /* istanbul ignore if */
      if (CONFIG.NODE_ENV === 'development') console.log(e)
      return send(res, 400, e)
    }
  }

  return micro(route)
}
