import { io } from 'socket.io-client'
import { getToken } from './api'

let socketInstance = null

export function getSocket() {
  const token = getToken()
  if (!socketInstance) {
    socketInstance = io('/', {
      autoConnect: false,
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  } else {
    socketInstance.auth = { token }
  }

  if (!socketInstance.connected) {
    socketInstance.connect()
  }

  return socketInstance
}
